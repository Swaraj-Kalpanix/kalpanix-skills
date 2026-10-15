import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { createQueryClient } from '../reactQuery/queryClient';

/**
 * Test helper: a fresh QueryClient (with the core's mutation cache) and a
 * wrapper for `renderHook`. Retries are off so failures surface immediately.
 * Test-only — never import from app code.
 */
export function createQueryWrapper(client: QueryClient = createTestQueryClient()) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { client, wrapper: Wrapper };
}

export function createTestQueryClient(): QueryClient {
  return createQueryClient({
    // gcTime Infinity: no garbage-collection timers left running after a test.
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
  });
}
