import { useIsMutating } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { YStack } from 'tamagui';

import { confirmStore } from '@/lib/core';

import { isActionLocked, subscribeActionLock } from './actionLock.store';

/**
 * While an action is being processed, nothing else can be pressed.
 *
 * A full-screen layer over the whole app, sheets included, for as long as a mutation or `whileActionLocked` work runs.
 *
 * - **A paused mutation does not lock.** Offline, React Query holds it until the connection returns, which could be
 *   forever.
 * - **`meta.background` does not lock**: a mutation opts out with `meta: { background: true }` — e.g. an attachment
 *   uploading while the rest of the form is filled in.
 * - **An open question does not lock.** A confirm dialog waiting for an answer has to stay pressable.
 * - **Android Back is swallowed too**, or it would leave the screen mid-save.
 * - **Not quite transparent, on purpose.** On Android, gesture-handler looks through a view with no background, and the
 *   drawer and bottom sheets could still be dragged beneath it.
 *
 * Mounted once, in `AppProviders`, after the bottom sheets so it covers them.
 */
export function ActionLock() {
  const mutating = useIsMutating({
    predicate: (mutation) => !mutation.state.isPaused && !mutation.options.meta?.background,
  });
  const lockedByWork = useSyncExternalStore(subscribeActionLock, isActionLocked, isActionLocked);
  const dialog = useSyncExternalStore(confirmStore.subscribe, confirmStore.getState, confirmStore.getState);
  const awaitingAnswer = dialog.isOpen && !dialog.isPending;
  const locked = (mutating > 0 || lockedByWork) && !awaitingAnswer;

  useEffect(() => {
    if (!locked) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [locked]);

  if (!locked) return null;

  return (
    <YStack
      style={StyleSheet.absoluteFill}
      bg="$color1"
      opacity={0.01}
      onStartShouldSetResponder={() => true}
      accessibilityViewIsModal
    />
  );
}
