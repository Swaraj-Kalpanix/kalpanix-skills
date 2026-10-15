import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

import { isApiError } from '../errors/api.error';
import { createMutationCache } from './mutationFeedback';

/** Retry network / 5xx failures up to twice; never retry 4xx (except 408 / 429), validation, or cancellation. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (!isApiError(error)) return false;
  if (error.code === 'VALIDATION' || error.code === 'CANCELLED') return false;
  if (error.isClientError && error.status !== 408 && error.status !== 429) return false;
  return true;
}

/**
 * QueryClient with mobile-friendly defaults:
 *   staleTime 60 s · gcTime 5 min · smart retry · refetch on app focus and reconnect
 *   mutations never auto-retry — the user decides whether to resubmit.
 * Anything passed in overrides these.
 */
export function createQueryClient(config: QueryClientConfig = {}): QueryClient {
  let client: QueryClient | undefined;
  client = new QueryClient({
    mutationCache: createMutationCache(() => client),
    ...config,
    defaultOptions: {
      ...config.defaultOptions,
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        ...config.defaultOptions?.queries,
      },
      mutations: {
        retry: 0,
        ...config.defaultOptions?.mutations,
      },
    },
  });
  return client;
}
