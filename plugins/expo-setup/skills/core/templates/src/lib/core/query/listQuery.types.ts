import type { ListParams, PaginatedResponse } from '../types/api.types';

/**
 * Turns `ListParams` into a query string and normalizes the list response.
 * `CrudService` works with any implementation — `NestCrudQueryBuilder` for
 * NestJS `@nestjsx/crud` backends, `RestQueryBuilder` for plain REST, or your own.
 */
export interface ListQueryBuilder<TFilters = unknown> {
  /** Query string without the leading `?`. */
  build(params: ListParams<TFilters>): string;
  /** Normalize the raw response body into `PaginatedResponse`. */
  parseList<T>(raw: unknown, params: ListParams<TFilters>): PaginatedResponse<T>;
}
