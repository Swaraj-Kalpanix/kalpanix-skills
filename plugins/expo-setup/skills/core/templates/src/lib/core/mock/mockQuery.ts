import { RequestQueryParser, type QueryFilter, type SCondition } from '@dataui/crud-request';

import {
  DEFAULT_REST_PARAMS,
  parseRestSort,
  type PaginatedResponse,
  type ParsedQuery,
  type RestParamNames,
  type SortConfig,
} from '..';

/**
 * Evaluates list queries against in-memory records, so mock lists behave like
 * the real API: filters, search, sort, field selection, and pagination.
 */

type Condition = Record<string, unknown>;

export interface NormalizedListQuery {
  where?: Condition;
  sort: SortConfig[];
  /** Selected fields; empty = all. */
  fields: string[];
  /** Joined relation names — kept when `fields` is set. */
  joins: string[];
  limit?: number;
  offset?: number;
  page?: number;
  /** `true` → `PaginatedResponse`, `false` → plain array (NestJS crud without page/offset). */
  paginate: boolean;
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

function toCondition(filter: QueryFilter): Condition {
  const operator = filter.operator.startsWith('$') ? filter.operator : `$${filter.operator}`;
  return { [filter.field]: { [operator]: filter.value ?? true } };
}

/** Parse a NestJS `@nestjsx/crud` query with the library's own parser. Throws on invalid input. */
export function parseNestQuery(query: ParsedQuery): NormalizedListQuery {
  const parsed = RequestQueryParser.create().parseQuery(query).getParsed();

  let where: Condition | undefined;
  if (parsed.search) {
    where = parsed.search as Condition;
  } else {
    const and = (parsed.filter ?? []).map(toCondition);
    const or = (parsed.or ?? []).map(toCondition);
    if (and.length && or.length) where = { $or: [{ $and: and }, { $and: or }] };
    else if (and.length) where = { $and: and };
    else if (or.length) where = { $or: or };
  }

  const limit = parsed.limit || undefined;
  const page = parsed.page || undefined;
  const offset = parsed.offset || undefined;
  return {
    where,
    sort: (parsed.sort ?? []).map((s) => ({ field: s.field, order: s.order })),
    fields: parsed.fields ?? [],
    joins: (parsed.join ?? []).map((j) => j.field),
    limit,
    page,
    offset,
    paginate: (page !== undefined || offset !== undefined) && limit !== undefined,
  };
}

export interface RestParseOptions {
  params?: Partial<RestParamNames>;
  /** Fields the `search` param matches (case-insensitive contains). */
  searchFields?: string[];
}

/** Parse a plain REST query: known params + every other param as an equality (or IN) filter. */
export function parseRestQuery(query: ParsedQuery, options: RestParseOptions = {}): NormalizedListQuery {
  const names = { ...DEFAULT_REST_PARAMS, ...options.params };
  const reserved = new Set(Object.values(names));
  const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const and: Condition[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (reserved.has(key) || value === '') continue;
    and.push({ [key]: Array.isArray(value) ? { $in: value } : { $eq: value } });
  }

  const search = single(query[names.search])?.trim();
  if (search && options.searchFields?.length) {
    and.push({ $or: options.searchFields.map((field) => ({ [field]: { $contL: search } })) });
  }

  const limit = Number(single(query[names.limit])) || undefined;
  const page = Number(single(query[names.page])) || 1;
  const sort = single(query[names.sort]);
  return {
    where: and.length ? { $and: and } : undefined,
    sort: sort ? parseRestSort(sort) : [],
    fields: [],
    joins: [],
    limit,
    page,
    paginate: true,
  };
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

function getPath(item: unknown, path: string): unknown {
  let current: unknown = item;
  for (const key of path.split('.')) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

const lower = (value: unknown) => (typeof value === 'string' ? value.toLowerCase() : value);
const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));
const toArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [value];

/** Loose equality: `1` equals `'1'`, `true` equals `'true'` — query strings carry everything as text. */
function equals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
}

function compare(a: unknown, b: unknown): number {
  const na = typeof a === 'number' ? a : Number(a);
  const nb = typeof b === 'number' ? b : Number(b);
  if (a !== '' && b !== '' && !Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  const sa = text(a);
  const sb = text(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

function applyOperator(operator: string, actual: unknown, expected: unknown): boolean {
  const op = operator.startsWith('$') ? operator : `$${operator}`;
  // `$eqL`, `$contL`, `$inL`, … — the `L` suffix means case-insensitive.
  const caseInsensitive = /L$/.test(op);
  const a = caseInsensitive ? lower(actual) : actual;
  const e = caseInsensitive ? (Array.isArray(expected) ? expected.map(lower) : lower(expected)) : expected;

  switch (op) {
    case '$eq':
    case '$eqL':
      return equals(a, e);
    case '$ne':
    case '$neL':
      return !equals(a, e);
    case '$gt':
      return actual != null && compare(actual, expected) > 0;
    case '$gte':
      return actual != null && compare(actual, expected) >= 0;
    case '$lt':
      return actual != null && compare(actual, expected) < 0;
    case '$lte':
      return actual != null && compare(actual, expected) <= 0;
    case '$starts':
    case '$startsL':
      return actual != null && text(a).startsWith(text(e));
    case '$ends':
    case '$endsL':
      return actual != null && text(a).endsWith(text(e));
    case '$cont':
    case '$contL':
      return actual != null && text(a).includes(text(e));
    case '$excl':
    case '$exclL':
      return actual == null || !text(a).includes(text(e));
    case '$in':
    case '$inL':
      return toArray(e).some((value) => equals(a, value));
    case '$notin':
    case '$notinL':
      return !toArray(e).some((value) => equals(a, value));
    case '$isnull':
      return actual === null || actual === undefined;
    case '$notnull':
      return actual !== null && actual !== undefined;
    case '$between': {
      const [from, to] = toArray(expected);
      return actual != null && compare(actual, from) >= 0 && compare(actual, to) <= 0;
    }
    case '$contArr':
      return Array.isArray(actual) && toArray(expected).every((v) => actual.some((x) => equals(x, v)));
    case '$intersectsArr':
      return Array.isArray(actual) && toArray(expected).some((v) => actual.some((x) => equals(x, v)));
    default:
      throw new Error(`Unsupported query operator "${operator}".`);
  }
}

function matchesField(actual: unknown, spec: unknown): boolean {
  if (spec === null || typeof spec !== 'object' || Array.isArray(spec)) return equals(actual, spec);
  return Object.entries(spec as Record<string, unknown>).every(([operator, expected]) => {
    if (operator === '$or') {
      return Object.entries(expected as Record<string, unknown>).some(([op, value]) =>
        applyOperator(op, actual, value),
      );
    }
    return applyOperator(operator, actual, expected);
  });
}

/** Does `item` satisfy a crud `SCondition` (`$and` / `$or` / `$not` / field operators)? */
export function matchesCondition(item: unknown, condition: Condition | SCondition | undefined): boolean {
  if (!condition) return true;
  return Object.entries(condition).every(([key, value]) => {
    if (value === undefined) return true;
    if (key === '$and') return (value as Condition[]).every((c) => matchesCondition(item, c));
    if (key === '$or') return (value as Condition[]).some((c) => matchesCondition(item, c));
    if (key === '$not') return !(value as Condition[]).every((c) => matchesCondition(item, c));
    return matchesField(getPath(item, key), value);
  });
}

/** Postgres ordering: ASC puts nulls last, DESC puts them first. */
function sortItems<T>(items: T[], sort: SortConfig[]): T[] {
  if (!sort.length) return items;
  return [...items].sort((x, y) => {
    for (const { field, order } of sort) {
      const a = getPath(x, field);
      const b = getPath(y, field);
      const aNull = a === null || a === undefined;
      const bNull = b === null || b === undefined;
      let result: number;
      if (aNull && bNull) result = 0;
      else if (aNull) result = 1;
      else if (bNull) result = -1;
      else result = compare(a, b);
      if (result !== 0) return order === 'DESC' ? -result : result;
    }
    return 0;
  });
}

function project<T>(item: T, keep: Set<string> | null): T {
  if (!keep) return item;
  const out: Record<string, unknown> = {};
  for (const key of keep) {
    if (key in (item as Record<string, unknown>)) out[key] = (item as Record<string, unknown>)[key];
  }
  return out as T;
}

/** Filter → sort → paginate → project. */
export function applyListQuery<T>(
  items: readonly T[],
  query: NormalizedListQuery,
  idField: string,
): PaginatedResponse<T> | T[] {
  const filtered = items.filter((item) => matchesCondition(item, query.where));
  const sorted = sortItems(filtered, query.sort);

  const limit = query.limit;
  const offset = query.offset ?? (query.page && limit ? (query.page - 1) * limit : 0);
  const pageItems = limit ? sorted.slice(offset, offset + limit) : sorted.slice(offset);

  const keep = query.fields.length
    ? new Set([idField, ...query.fields, ...query.joins.map((j) => j.split('.')[0])])
    : null;
  const data = pageItems.map((item) => project(item, keep));

  if (!query.paginate) return data;
  return {
    data,
    count: data.length,
    total: filtered.length,
    page: limit ? Math.floor(offset / limit) + 1 : 1,
    pageCount: limit ? Math.max(1, Math.ceil(filtered.length / limit)) : 1,
  };
}
