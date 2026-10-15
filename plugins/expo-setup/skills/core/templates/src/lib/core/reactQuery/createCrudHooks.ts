import {
  keepPreviousData,
  skipToken,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type { ApiError } from '../errors/api.error';
import type { CrudService } from '../services/crud.service';
import type { Id, ListParams, PaginatedResponse } from '../types/api.types';
import { createQueryKeys, type QueryKeys } from './queryKeys';
import { useApiMutation } from './useApiMutation';
import { useApiInfiniteList, type UseApiInfiniteListOptions } from './useApiInfiniteList';
import { useApiQuery } from './useApiQuery';

type QueryOptions<T> = Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>;
type MutationOptions<TData, TVariables> = Omit<UseMutationOptions<TData, ApiError, TVariables>, 'mutationFn'>;

/**
 * The standard React Query hooks for a `CrudService`, with cache updates wired:
 * create/update/remove invalidate every list; update writes the detail cache;
 * remove drops it.
 *
 * ```ts
 * // src/features/leads/queries/lead-queries.ts
 * export const leadQueries = createCrudHooks(leadService, createQueryKeys('leads'));
 *
 * // in a screen
 * const { items, fetchNextPage, hasNextPage, isLoading } = leadQueries.useInfiniteList({ search });
 * const createLead = leadQueries.useCreate({ meta: { successMessage: 'Lead created' } });
 * const deleteLead = leadQueries.useRemove({ meta: { confirm: { title: 'Delete lead?', variant: 'destructive' } } });
 * ```
 */
export function createCrudHooks<T, TFilters, TCreate, TUpdate>(
  service: CrudService<T, TFilters, TCreate, TUpdate>,
  keys: QueryKeys = createQueryKeys(service.endpoint),
) {
  return {
    keys,

    /** One page. Keeps the previous page on screen while the next one loads. */
    useList(params: ListParams<TFilters> = {}, options?: QueryOptions<PaginatedResponse<T>>) {
      return useApiQuery({
        queryKey: keys.list(params),
        queryFn: ({ signal }) => service.list(params, { signal }),
        placeholderData: keepPreviousData,
        ...options,
      });
    },

    /** Infinite scroll. */
    useInfiniteList(
      params: Omit<ListParams<TFilters>, 'page'> = {},
      options?: Omit<UseApiInfiniteListOptions<T>, 'queryKey' | 'queryFn'>,
    ) {
      return useApiInfiniteList<T>({
        queryKey: keys.infinite(params),
        queryFn: (page, { signal }) => service.list({ ...params, page }, { signal }),
        ...options,
      });
    },

    /** One record. Skipped while `id` is `null` / `undefined` / `''`. */
    useDetail(id: Id | null | undefined, options?: QueryOptions<T>) {
      const hasId = id !== null && id !== undefined && id !== '';
      return useApiQuery({
        queryKey: keys.detail(hasId ? id : ''),
        queryFn: hasId ? ({ signal }) => service.getById(id, { signal }) : skipToken,
        ...options,
      });
    },

    useCreate(options?: MutationOptions<T, TCreate>) {
      const client = useQueryClient();
      return useApiMutation<T, TCreate>({
        ...options,
        mutationFn: (payload) => service.create(payload),
        onSuccess: (data, variables, ...rest) => {
          void client.invalidateQueries({ queryKey: keys.lists() });
          return options?.onSuccess?.(data, variables, ...rest);
        },
      });
    },

    useUpdate(options?: MutationOptions<T, { id: Id; data: TUpdate }>) {
      const client = useQueryClient();
      return useApiMutation<T, { id: Id; data: TUpdate }>({
        ...options,
        mutationFn: ({ id, data }) => service.update(id, data),
        onSuccess: (data, variables, ...rest) => {
          client.setQueryData(keys.detail(variables.id), data);
          void client.invalidateQueries({ queryKey: keys.lists() });
          return options?.onSuccess?.(data, variables, ...rest);
        },
      });
    },

    useRemove(options?: MutationOptions<void, Id>) {
      const client = useQueryClient();
      return useApiMutation<void, Id>({
        ...options,
        mutationFn: (id) => service.remove(id),
        onSuccess: (data, id, ...rest) => {
          client.removeQueries({ queryKey: keys.detail(id) });
          void client.invalidateQueries({ queryKey: keys.lists() });
          return options?.onSuccess?.(data, id, ...rest);
        },
      });
    },
  };
}
