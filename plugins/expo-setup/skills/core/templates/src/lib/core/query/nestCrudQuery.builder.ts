import {
  CondOperator,
  RequestQueryBuilder,
  type QueryFilter,
  type QueryJoin,
  type SCondition,
} from '@dataui/crud-request';

import type { ListParams, PaginatedResponse, SortConfig } from '../types/api.types';
import { toPaginated } from '../utils/pagination';
import type { ListQueryBuilder } from './listQuery.types';

export { CondOperator };
export type { QueryFilter, QueryJoin, SCondition };

/** A filter, or a falsy value to skip it — so `buildFilters` can return helpers' results directly. */
export type FilterInput = QueryFilter | null | undefined | false;

export interface SearchField {
  field: string;
  /** Default `CondOperator.CONTAINS_LOW` (`$contL`, case-insensitive contains). */
  operator?: CondOperator;
}

export interface NestCrudQueryConfig<TFilters = unknown> {
  /** Default page size. Default 20. */
  limit?: number;
  /** Default sort when the caller passes none. */
  sort?: SortConfig[];
  /** Fields the free-text `search` matches (OR-ed). */
  searchFields?: (string | SearchField)[];
  /** Only return these fields. Empty = all. */
  select?: string[];
  /** Relations to load. */
  joins?: QueryJoin[];
  /** Map UI filters to crud filters — alternative to overriding `buildFilters` in a subclass. */
  filters?: (filters: TFilters) => FilterInput[];
}

const NULL_OPERATORS = new Set<string>([CondOperator.IS_NULL, CondOperator.NOT_NULL]);

function toOperator(operator: string): string {
  return operator.startsWith('$') ? operator : `$${operator}`;
}

/**
 * Query builder for NestJS `@nestjsx/crud` endpoints (`filter`, `s`, `sort`,
 * `join`, `fields`, `page`, `limit`).
 *
 * Config only:
 * ```ts
 * const leadQuery = new NestCrudQueryBuilder<LeadFilters>({
 *   limit: 20,
 *   sort: [{ field: 'createdAt', order: 'DESC' }],
 *   searchFields: ['name', 'email', { field: 'phone', operator: CondOperator.STARTS }],
 *   filters: (f) => [
 *     makeFilterIf('status', CondOperator.EQUALS, f.status),
 *     makeFilterIn('ownerId', f.ownerIds),
 *   ],
 * });
 * ```
 * Or subclass and override `buildFilters` / `buildSelect` / `buildJoins` for anything dynamic.
 */
export class NestCrudQueryBuilder<TFilters = unknown> implements ListQueryBuilder<TFilters> {
  constructor(protected readonly config: NestCrudQueryConfig<TFilters> = {}) {}

  build(params: ListParams<TFilters>): string {
    return this.toRequest(params).query();
  }

  parseList<T>(raw: unknown, params: ListParams<TFilters>): PaginatedResponse<T> {
    return toPaginated<T>(raw, { page: params.page ?? 1, limit: this.limitFor(params) });
  }

  /** The underlying `RequestQueryBuilder`, for anything this class doesn't cover. */
  toRequest(params: ListParams<TFilters>): RequestQueryBuilder {
    const sort = params.sort?.length ? params.sort : this.config.sort;
    const builder = RequestQueryBuilder.create({
      page: params.page ?? 1,
      limit: this.limitFor(params),
      ...(sort?.length ? { sort } : {}),
    });

    const select = this.buildSelect();
    if (select.length) builder.select(select);

    this.buildJoins().forEach((join) => builder.setJoin(join));

    const filters = (params.filters === undefined ? [] : this.buildFilters(params.filters)).filter(
      (f): f is QueryFilter => !!f,
    );
    const search = this.buildSearch(params.search);

    if (search) {
      // `s` overrides `filter` on the server, so filters move inside the search condition.
      const conditions: SCondition[] = filters.map((f) => ({
        [f.field]: {
          [toOperator(f.operator)]: NULL_OPERATORS.has(toOperator(f.operator)) ? true : f.value,
        },
      }));
      conditions.push(search);
      builder.search(conditions.length === 1 ? search : { $and: conditions });
    } else if (filters.length) {
      builder.setFilter(filters);
    }

    return builder;
  }

  // ─── Override in a subclass ────────────────────────────────────────────────

  protected buildFilters(filters: TFilters): FilterInput[] {
    return this.config.filters?.(filters) ?? [];
  }

  protected buildSelect(): string[] {
    return this.config.select ?? [];
  }

  protected buildJoins(): QueryJoin[] {
    return this.config.joins ?? [];
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  protected limitFor(params: ListParams<TFilters>): number {
    return params.limit ?? this.config.limit ?? 20;
  }

  private buildSearch(search: string | undefined): SCondition | undefined {
    const term = search?.trim();
    const fields = this.config.searchFields;
    if (!term || !fields?.length) return undefined;
    return {
      $or: fields.map((f) => {
        const { field, operator = CondOperator.CONTAINS_LOW } = typeof f === 'string' ? { field: f } : f;
        return { [field]: { [operator]: term } };
      }),
    };
  }
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

/** `makeFilter('status', CondOperator.EQUALS, 'active')`, `makeFilter('deletedAt', CondOperator.IS_NULL)` */
export function makeFilter(field: string, operator: CondOperator, value?: unknown): QueryFilter {
  return { field, operator, value };
}

/** Skipped (returns `null`) when `value` is `null`, `undefined`, or `''`. */
export function makeFilterIf(field: string, operator: CondOperator, value: unknown): QueryFilter | null {
  if (value === null || value === undefined || value === '') return null;
  return makeFilter(field, operator, value);
}

/** `IN` filter; skipped when the array is empty or missing. */
export function makeFilterIn(field: string, values: readonly unknown[] | null | undefined): QueryFilter | null {
  if (!values?.length) return null;
  return makeFilter(field, CondOperator.IN, [...values]);
}

/** `BETWEEN` filter; falls back to `>=` / `<=` when only one bound is given, skipped when neither is. */
export function makeFilterRange(field: string, from: unknown, to: unknown): QueryFilter | null {
  const hasFrom = from !== null && from !== undefined && from !== '';
  const hasTo = to !== null && to !== undefined && to !== '';
  if (hasFrom && hasTo) return makeFilter(field, CondOperator.BETWEEN, [from, to]);
  if (hasFrom) return makeFilter(field, CondOperator.GREATER_THAN_EQUALS, from);
  if (hasTo) return makeFilter(field, CondOperator.LOWER_THAN_EQUALS, to);
  return null;
}
