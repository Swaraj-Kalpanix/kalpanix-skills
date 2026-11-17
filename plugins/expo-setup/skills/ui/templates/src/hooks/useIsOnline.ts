import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const isOnline = () => onlineManager.isOnline();

/**
 * Whether the phone has a working connection, live.
 *
 * Read from React Query's `onlineManager`, which the core already feeds from `expo-network`
 * (`setupReactNativeQueryManagers`). The banner and the queries therefore agree by construction: when this says
 * offline, queries are paused, and when it flips back they refetch. No second network listener.
 */
export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribe, isOnline, isOnline);
}
