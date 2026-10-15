import { useInfiniteQuery, type InfiniteData, type QueryKey, type UseInfiniteQueryOptions } from '@tanstack/react-query';

import { toApiError, type ApiError } from '../errors/api.error';
import type { PaginatedResponse } from '../types/api.types';
import { getNextPage } from '../utils/pagination';

export interface UseApiInfiniteListOptions<T, TQueryKey extends QueryKey = QueryKey>
  extends Omit<
    UseInfiniteQueryOptions<PaginatedResponse<T>, ApiError, InfiniteData<PaginatedResponse<T>, number>, TQueryKey, number>,
    'queryFn' | 'initialPageParam' | 'getNextPageParam' | 'select'
  > {
  /** Fetch one page (1-based). Pass `signal` through so scrolling away cancels the request. */
  queryFn: (page: number, context: { signal: AbortSignal }) => Promise<PaginatedResponse<T>>;
}

/**
 * Infinite list over `PaginatedResponse` pages — for `FlatList` with
 * `onEndReached={() => hasNextPage && fetchNextPage()}`.
 * Adds `items` (all loaded rows, flattened) and `total`.
 */
export function useApiInfiniteList<T, TQueryKey extends QueryKey = QueryKey>({
  queryFn,
  ...options
}: UseApiInfiniteListOptions<T, TQueryKey>) {
  const query = useInfiniteQuery({
    ...options,
    initialPageParam: 1,
    getNextPageParam: getNextPage,
    queryFn: async ({ pageParam, signal }) => {
      try {
        return await queryFn(pageParam, { signal });
      } catch (error) {
        throw toApiError(error);
      }
    },
  });

  const pages = query.data?.pages;
  return {
    ...query,
    items: pages?.flatMap((page) => page.data) ?? [],
    total: pages?.[0]?.total ?? 0,
  };
}
