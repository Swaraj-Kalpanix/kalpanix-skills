import type { ListParams, PaginatedResponse, SortConfig } from '../types/api.types';
import { toPaginated } from '../utils/pagination';
import { toQueryString, type ArrayFormat, type QueryRecord } from '../utils/queryString';
import type { ListQueryBuilder } from './listQuery.types';

export interface RestParamNames {
  page: string;
  limit: string;
  search: string;
  sort: string;
}

export const DEFAULT_REST_PARAMS: RestParamNames = {
  page: 'page',
  limit: 'limit',
  search: 'search',
  sort: 'sort',
};

/** Default sort format: `createdAt:desc,name:asc`. */
export function formatRestSort(sort: readonly SortConfig[]): string {
  return sort.map((s) => `${s.field}:${s.order.toLowerCase()}`).join(',');
}

/** Inverse of `formatRestSort` (used by the mock server). */
export function parseRestSort(value: string): SortConfig[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [field, order] = part.split(':');
      return { field, order: order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC' } as SortConfig;
    });
}

export interface RestQueryConfig<TFilters = unknown> {
  /** Default page size. Default 20. */
  limit?: number;
  sort?: SortConfig[];
  /** Rename query params, e.g. `{ search: 'q', limit: 'per_page' }`. */
  params?: Partial<RestParamNames>;
  /** How array filters are sent. Default `repeat` (`status=a&status=b`). */
  arrayFormat?: ArrayFormat;
  formatSort?: (sort: readonly SortConfig[]) => string;
  /** Map UI filters to query params. Default: the filters object as-is. */
  filters?: (filters: TFilters) => QueryRecord;
  /** Map the list response when the API doesn't return an array or `{ data, total, … }`. */
  parseList?: (raw: unknown, params: ListParams<TFilters>) => PaginatedResponse<unknown>;
}

/**
 * Query builder for plain REST lists: `?page=1&limit=20&search=acme&sort=createdAt:desc&status=open`.
 *
 * ```ts
 * const contactQuery = new RestQueryBuilder<ContactFilters>({
 *   params: { search: 'q' },
 *   sort: [{ field: 'name', order: 'ASC' }],
 * });
 * ```
 */
export class RestQueryBuilder<TFilters = unknown> implements ListQueryBuilder<TFilters> {
  protected readonly names: RestParamNames;

  constructor(protected readonly config: RestQueryConfig<TFilters> = {}) {
    this.names = { ...DEFAULT_REST_PARAMS, ...config.params };
  }

  build(params: ListParams<TFilters>): string {
    const sort = params.sort?.length ? params.sort : this.config.sort;
    const formatSort = this.config.formatSort ?? formatRestSort;
    return toQueryString(
      {
        [this.names.page]: params.page ?? 1,
        [this.names.limit]: this.limitFor(params),
        [this.names.search]: params.search?.trim(),
        [this.names.sort]: sort?.length ? formatSort(sort) : undefined,
        ...(params.filters === undefined ? {} : this.buildFilters(params.filters)),
      },
      this.config.arrayFormat,
    );
  }

  parseList<T>(raw: unknown, params: ListParams<TFilters>): PaginatedResponse<T> {
    if (this.config.parseList) return this.config.parseList(raw, params) as PaginatedResponse<T>;
    return toPaginated<T>(raw, { page: params.page ?? 1, limit: this.limitFor(params) });
  }

  protected buildFilters(filters: TFilters): QueryRecord {
    return this.config.filters?.(filters) ?? ((filters ?? {}) as QueryRecord);
  }

  protected limitFor(params: ListParams<TFilters>): number {
    return params.limit ?? this.config.limit ?? 20;
  }
}
