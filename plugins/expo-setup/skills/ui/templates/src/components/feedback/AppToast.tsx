import { Toast, ToastViewport, useToastController, useToastState } from '@tamagui/toast';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';

import { setNotifier } from '@/lib/core';

type ToastVariant = 'success' | 'error' | 'info';

const variantTheme = { success: 'green', error: 'red', info: undefined } as const;

/**
 * App toasts: connects the core's `notify.*` (used by the global mutation
 * toasts) to Tamagui's toast controller, and renders the current toast.
 * Mount once inside `ToastProvider` (done in `AppProviders`).
 */
export function AppToast() {
  const toast = useToastController();
  const current = useToastState();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const show = (variant: ToastVariant) => (message: string) =>
      toast.show(message, { customData: { variant } });
    setNotifier({ success: show('success'), error: show('error'), info: show('info') });
    return () => setNotifier(null);
  }, [toast]);

  const variant = ((current?.customData as { variant?: ToastVariant } | undefined)?.variant ?? 'info') as ToastVariant;

  return (
    <>
      {current && !current.isHandledNatively ? (
        <Toast
          key={current.id}
          duration={current.duration}
          viewportName={current.viewportName}
          theme={variantTheme[variant]}
          transition="quick"
          enterStyle={{ opacity: 0, y: -20, scale: 0.95 }}
          exitStyle={{ opacity: 0, y: -20, scale: 0.95 }}
          opacity={1}
          y={0}
          scale={1}
          rounded="$6"
          px="$4"
          py="$3"
        >
          <YStack gap="$1">
            <Toast.Title>{current.title}</Toast.Title>
            {current.message ? <Toast.Description>{current.message}</Toast.Description> : null}
          </YStack>
        </Toast>
      ) : null}
      <ToastViewport flexDirection="column" t={insets.top + 8} l={16} r={16} />
    </>
  );
}
