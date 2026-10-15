import type { PaginatedResponse } from '../types/api.types';

/**
 * Normalize a list response into `PaginatedResponse`.
 * Accepts a plain array (NestJS crud without `limit`/`page`) or an object with
 * a `data` array and any subset of `count` / `total` / `page` / `pageCount`.
 */
export function toPaginated<T>(raw: unknown, fallback: { page?: number; limit?: number } = {}): PaginatedResponse<T> {
  if (Array.isArray(raw)) {
    return { data: raw as T[], count: raw.length, total: raw.length, page: 1, pageCount: 1 };
  }

  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    const body = raw as Partial<PaginatedResponse<T>> & { data: T[] };
    const total = typeof body.total === 'number' ? body.total : body.data.length;
    const page = typeof body.page === 'number' ? body.page : (fallback.page ?? 1);
    const pageCount =
      typeof body.pageCount === 'number'
        ? body.pageCount
        : fallback.limit
          ? Math.max(1, Math.ceil(total / fallback.limit))
          : 1;
    return {
      data: body.data,
      count: typeof body.count === 'number' ? body.count : body.data.length,
      total,
      page,
      pageCount,
    };
  }

  throw new TypeError(
    'List response is neither an array nor an object with a `data` array. Override `parseList` on the query builder for this endpoint.',
  );
}

/** `getNextPageParam` for infinite queries over `PaginatedResponse`. */
export function getNextPage(last: PaginatedResponse<unknown>): number | undefined {
  return last.page < last.pageCount ? last.page + 1 : undefined;
}
