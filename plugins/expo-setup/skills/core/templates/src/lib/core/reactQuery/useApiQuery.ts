import { useQuery, type QueryFunction, type QueryKey, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';

import { toApiError, type ApiError } from '../errors/api.error';

/** Guarantee that whatever a query function throws reaches the UI as an `ApiError`. */
function normalizeErrors<T, K extends QueryKey>(fn: QueryFunction<T, K> | unknown): typeof fn {
  if (typeof fn !== 'function') return fn;
  return (async (context: Parameters<QueryFunction<T, K>>[0]) => {
    try {
      return await (fn as QueryFunction<T, K>)(context);
    } catch (error) {
      throw toApiError(error);
    }
  }) as QueryFunction<T, K>;
}

/**
 * `useQuery` with the error pinned to `ApiError`. All options pass through.
 *
 * ```ts
 * const lead = useApiQuery({
 *   queryKey: leadKeys.detail(id),
 *   queryFn: ({ signal }) => leadService.getById(id, { signal }),
 * });
 * ```
 */
export function useApiQuery<TQueryFnData, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
  options: UseQueryOptions<TQueryFnData, ApiError, TData, TQueryKey>,
): UseQueryResult<TData, ApiError> {
  return useQuery({
    ...options,
    queryFn: normalizeErrors(options.queryFn) as typeof options.queryFn,
  });
}
