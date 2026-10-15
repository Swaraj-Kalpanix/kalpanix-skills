import type { Id } from '../types/api.types';

/**
 * Consistent query keys per resource, so invalidation is predictable:
 * invalidating `keys.lists()` refreshes every list and infinite list of that resource.
 *
 * ```ts
 * export const leadKeys = createQueryKeys('leads');
 * leadKeys.list({ page: 1 })  // ['leads', 'list', { page: 1 }]
 * leadKeys.detail(42)         // ['leads', 'detail', 42]
 * ```
 */
export function createQueryKeys<const TScope extends string>(scope: TScope) {
  return {
    all: [scope] as const,
    lists: () => [scope, 'list'] as const,
    list: (params: object = {}) => [scope, 'list', params] as const,
    infinite: (params: object = {}) => [scope, 'list', 'infinite', params] as const,
    details: () => [scope, 'detail'] as const,
    detail: (id: Id) => [scope, 'detail', id] as const,
  };
}

export type QueryKeys = ReturnType<typeof createQueryKeys<string>>;
