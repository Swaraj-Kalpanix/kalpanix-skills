import { QueryClientProvider, focusManager, onlineManager, type QueryClient } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { createQueryClient } from './queryClient';

let managersReady = false;

/**
 * React Native has no window focus / `navigator.onLine`, so wire React Query to
 * `AppState` (refetch stale data when the app returns to the foreground) and
 * `expo-network` (pause while offline, refetch on reconnect). Web keeps
 * React Query's built-in browser listeners. Idempotent.
 */
export function setupReactNativeQueryManagers(): void {
  if (managersReady || Platform.OS === 'web') return;
  managersReady = true;

  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (status) => handleFocus(status === 'active'));
    return () => subscription.remove();
  });

  onlineManager.setEventListener((setOnline) => {
    let initialised = false;
    const subscription = Network.addNetworkStateListener((state) => {
      initialised = true;
      setOnline(!!state.isConnected);
    });
    Network.getNetworkStateAsync()
      .then((state) => {
        if (!initialised) setOnline(!!state.isConnected);
      })
      .catch(() => {
        // Can reject on some platforms; stay optimistic (online).
      });
    return () => subscription.remove();
  });
}

interface CoreQueryProviderProps {
  children: ReactNode;
  /** Bring your own client (tests, custom defaults). Default: `createQueryClient()`. */
  client?: QueryClient;
}

/** Wrap the app root with this. */
export function CoreQueryProvider({ children, client }: CoreQueryProviderProps) {
  const [queryClient] = useState(() => client ?? createQueryClient());
  useEffect(setupReactNativeQueryManagers, []);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
