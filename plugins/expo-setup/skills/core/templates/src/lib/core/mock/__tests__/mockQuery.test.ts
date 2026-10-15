import { NestCrudQueryBuilder, makeFilter, makeFilterIn, CondOperator } from '../../query/nestCrudQuery.builder';
import { RestQueryBuilder } from '../../query/restQuery.builder';
import type { PaginatedResponse } from '../../types/api.types';
import { parseQueryString } from '../../utils/queryString';
import { applyListQuery, matchesCondition, parseNestQuery, parseRestQuery } from '../mockQuery';

interface Row {
  id: number;
  name: string;
  status: string | null;
  value: number;
  tags: string[];
  owner: { name: string } | null;
  createdAt: string;
}

const rows: Row[] = [
  { id: 1, name: 'Acme', status: 'new', value: 500, tags: ['vip', 'b2b'], owner: { name: 'Ravi' }, createdAt: '2026-01-10' },
  { id: 2, name: 'Beta', status: 'won', value: 1500, tags: ['b2b'], owner: { name: 'Asha' }, createdAt: '2026-03-02' },
  { id: 3, name: 'acme labs', status: null, value: 900, tags: [], owner: null, createdAt: '2026-02-15' },
  { id: 4, name: 'Delta', status: 'lost', value: 100, tags: ['vip'], owner: { name: 'Ravi' }, createdAt: '2026-04-20' },
];

const ids = (result: PaginatedResponse<Row> | Row[]) => (Array.isArray(result) ? result : result.data).map((r) => r.id);

describe('matchesCondition — operators', () => {
  const row = rows[0];
  it.each<[string, unknown, boolean]>([
    ['$eq', 'new', true],
    ['$ne', 'new', false],
    ['$eqL', 'NEW', true],
    ['$neL', 'NEW', false],
    ['$in', ['won', 'new'], true],
    ['$notin', ['won', 'new'], false],
    ['$inL', ['NEW'], true],
    ['$notinL', ['NEW'], false],
    ['$starts', 'ne', true],
    ['$startsL', 'NE', true],
    ['$ends', 'ew', true],
    ['$endsL', 'EW', true],
    ['$cont', 'e', true],
    ['$cont', 'E', false],
    ['$contL', 'E', true],
    ['$excl', 'x', true],
    ['$exclL', 'N', false],
    ['$isnull', true, false],
    ['$notnull', true, true],
  ])('status %s %p → %p', (op, value, expected) => {
    expect(matchesCondition(row, { status: { [op]: value } })).toBe(expected);
  });

  it.each<[string, unknown, boolean]>([
    ['$gt', 499, true],
    ['$gt', 500, false],
    ['$gte', 500, true],
    ['$lt', '600', true],
    ['$lte', 499, false],
    ['$between', [100, 500], true],
    ['$between', '600,900', false],
  ])('value %s %p → %p (numbers and numeric strings)', (op, value, expected) => {
    expect(matchesCondition(row, { value: { [op]: value } })).toBe(expected);
  });

  it('compares ISO dates as strings', () => {
    expect(matchesCondition(row, { createdAt: { $between: ['2026-01-01', '2026-01-31'] } })).toBe(true);
    expect(matchesCondition(row, { createdAt: { $gt: '2026-02-01' } })).toBe(false);
  });

  it('handles array operators', () => {
    expect(matchesCondition(row, { tags: { $contArr: ['vip', 'b2b'] } })).toBe(true);
    expect(matchesCondition(rows[1], { tags: { $contArr: ['vip', 'b2b'] } })).toBe(false);
    expect(matchesCondition(rows[1], { tags: { $intersectsArr: ['vip', 'b2b'] } })).toBe(true);
    expect(matchesCondition(rows[2], { tags: { $intersectsArr: ['vip'] } })).toBe(false);
  });

  it('treats null fields correctly', () => {
    const nullRow = rows[2];
    expect(matchesCondition(nullRow, { status: { $isnull: true } })).toBe(true);
    expect(matchesCondition(nullRow, { status: { $cont: 'n' } })).toBe(false);
    expect(matchesCondition(nullRow, { status: { $excl: 'n' } })).toBe(true);
    expect(matchesCondition(nullRow, { status: { $gt: 'a' } })).toBe(false);
  });

  it('supports plain values, nested paths, $and / $or / $not and field-level $or', () => {
    expect(matchesCondition(row, { name: 'Acme', 'owner.name': 'Ravi' })).toBe(true);
    expect(matchesCondition(rows[2], { 'owner.name': { $isnull: true } })).toBe(true);
    expect(matchesCondition(row, { $and: [{ status: 'new' }, { value: { $gte: 500 } }] })).toBe(true);
    expect(matchesCondition(row, { $or: [{ status: 'won' }, { value: { $gt: 1000 } }] })).toBe(false);
    expect(matchesCondition(row, { $not: [{ status: 'won' }] })).toBe(true);
    expect(matchesCondition(row, { name: { $or: { $eq: 'Nope', $startsL: 'ac' } } })).toBe(true);
    expect(matchesCondition(row, undefined)).toBe(true);
  });

  it('accepts operators without the $ prefix and rejects unknown ones', () => {
    expect(matchesCondition(row, { status: { eq: 'new' } })).toBe(true);
    expect(() => matchesCondition(row, { status: { $regex: 'x' } })).toThrow('Unsupported query operator "$regex".');
  });
});

describe('applyListQuery with NestJS crud queries (built by NestCrudQueryBuilder)', () => {
  const run = (qb: NestCrudQueryBuilder<Record<string, unknown>>, params: Parameters<typeof qb.build>[0]) =>
    applyListQuery(rows, parseNestQuery(parseQueryString(qb.build(params))), 'id') as PaginatedResponse<Row>;

  it('paginates and reports totals', () => {
    const qb = new NestCrudQueryBuilder({ limit: 3, sort: [{ field: 'id', order: 'ASC' }] });
    expect(run(qb, { page: 1 })).toMatchObject({ count: 3, total: 4, page: 1, pageCount: 2 });
    const second = run(qb, { page: 2 });
    expect(ids(second)).toEqual([4]);
    expect(second).toMatchObject({ count: 1, page: 2 });
    expect(run(qb, { page: 5 }).data).toEqual([]);
  });

  it('sorts by several fields with Postgres null ordering', () => {
    const qb = new NestCrudQueryBuilder({ limit: 10 });
    expect(ids(run(qb, { sort: [{ field: 'status', order: 'ASC' }] }))).toEqual([4, 1, 2, 3]); // nulls last
    expect(ids(run(qb, { sort: [{ field: 'status', order: 'DESC' }] }))).toEqual([3, 2, 1, 4]); // nulls first
    expect(ids(run(qb, { sort: [{ field: 'owner.name', order: 'ASC' }, { field: 'value', order: 'DESC' }] }))).toEqual([2, 1, 4, 3]);
  });

  it('filters, searches, and combines both', () => {
    const qb = new NestCrudQueryBuilder<{ statuses?: string[]; open?: boolean }>({
      limit: 10,
      sort: [{ field: 'id', order: 'ASC' }],
      searchFields: ['name', 'owner.name'],
      filters: (f) => [makeFilterIn('status', f.statuses), f.open && makeFilter('status', CondOperator.NOT_NULL)],
    });
    expect(ids(run(qb, { filters: { statuses: ['new', 'lost'] } }))).toEqual([1, 4]);
    expect(ids(run(qb, { search: 'ACME' }))).toEqual([1, 3]);
    expect(ids(run(qb, { search: 'ravi' }))).toEqual([1, 4]);
    expect(ids(run(qb, { search: 'acme', filters: { open: true } }))).toEqual([1]);
  });

  it('projects selected fields plus the id and joined relations', () => {
    const qb = new NestCrudQueryBuilder({ limit: 1, sort: [{ field: 'id', order: 'ASC' }], select: ['name'], joins: [{ field: 'owner' }] });
    expect(run(qb, {}).data).toEqual([{ id: 1, name: 'Acme', owner: { name: 'Ravi' } }]);
  });

  it('combines `filter` and `or` params like the server', () => {
    const q = parseNestQuery(parseQueryString('filter=status||$eq||new&or=value||$gt||1000&or=name||$eq||Delta'));
    // (status = new) OR (value > 1000 AND name = Delta)
    expect(ids(applyListQuery(rows, q, 'id'))).toEqual([1]);
    const orOnly = parseNestQuery(parseQueryString('or=status||$eq||won&or=status||$eq||lost'));
    expect(ids(applyListQuery(rows, orOnly, 'id'))).toEqual([2, 4]);
  });

  it('returns a plain array without page/offset, and honors offset', () => {
    expect(Array.isArray(applyListQuery(rows, parseNestQuery(parseQueryString('limit=2')), 'id'))).toBe(true);
    const withOffset = applyListQuery(rows, parseNestQuery(parseQueryString('limit=2&offset=1')), 'id') as PaginatedResponse<Row>;
    expect(ids(withOffset)).toEqual([2, 3]);
    expect(withOffset.page).toBe(1);
  });

  it('throws on invalid crud syntax (the collection turns this into a 400)', () => {
    expect(() => parseNestQuery(parseQueryString('filter=status||$nope||x'))).toThrow();
  });
});

describe('applyListQuery with REST queries (built by RestQueryBuilder)', () => {
  const run = (qs: string, searchFields = ['name']) =>
    applyListQuery(rows, parseRestQuery(parseQueryString(qs), { searchFields }), 'id') as PaginatedResponse<Row>;

  it('paginates, sorts, searches and filters', () => {
    const qb = new RestQueryBuilder<{ status?: string[] }>({ limit: 2, sort: [{ field: 'value', order: 'DESC' }] });
    expect(ids(run(qb.build({})))).toEqual([2, 3]);
    expect(run(qb.build({})).pageCount).toBe(2);
    expect(ids(run(qb.build({ page: 2 })))).toEqual([1, 4]);
    expect(ids(run(qb.build({ search: 'acme' })))).toEqual([3, 1]);
    expect(ids(run(qb.build({ filters: { status: ['won', 'lost'] } })))).toEqual([2, 4]);
  });

  it('treats single params as equality filters and returns everything without a limit', () => {
    const result = run('status=won');
    expect(ids(result)).toEqual([2]);
    expect(result).toMatchObject({ page: 1, pageCount: 1, total: 1 });
  });

  it('honors renamed params', () => {
    const q = parseRestQuery(parseQueryString('q=delta&per_page=1'), { params: { search: 'q', limit: 'per_page' }, searchFields: ['name'] });
    expect(ids(applyListQuery(rows, q, 'id'))).toEqual([4]);
  });
});
