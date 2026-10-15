export type SortOrder = 'ASC' | 'DESC';

export interface SortConfig {
  field: string;
  order: SortOrder;
}

/** Paginated list shape (NestJS `@nestjsx/crud` `getMany`). Every list the core returns is normalized to this. */
export interface PaginatedResponse<T> {
  data: T[];
  /** Items in this page. */
  count: number;
  /** Items across all pages. */
  total: number;
  /** 1-based. */
  page: number;
  pageCount: number;
}

/** What a list screen asks for. Query builders turn this into a query string. */
export interface ListParams<TFilters = unknown> {
  /** 1-based. Defaults to 1. */
  page?: number;
  /** Page size. Falls back to the builder's default. */
  limit?: number;
  search?: string;
  /** Falls back to the builder's default sort. */
  sort?: SortConfig[];
  filters?: TFilters;
}

export type Id = string | number;
