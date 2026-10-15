import { RequestQueryParser } from '@dataui/crud-request';

import { parseQueryString } from '../../utils/queryString';
import {
  CondOperator,
  NestCrudQueryBuilder,
  makeFilter,
  makeFilterIf,
  makeFilterIn,
  makeFilterRange,
  type FilterInput,
} from '../nestCrudQuery.builder';

/** Parse a built query the way the NestJS server does. */
function serverParse(query: string) {
  return RequestQueryParser.create().parseQuery(parseQueryString(query)).getParsed();
}

interface LeadFilters {
  status?: string;
  ownerIds?: number[];
  archived?: boolean;
}

const leadFilters = (f: LeadFilters): FilterInput[] => [
  makeFilterIf('status', CondOperator.EQUALS, f.status),
  makeFilterIn('ownerId', f.ownerIds),
  f.archived === false && makeFilter('archivedAt', CondOperator.IS_NULL),
];

describe('NestCrudQueryBuilder', () => {
  it('defaults to page 1 and limit 20', () => {
    const parsed = serverParse(new NestCrudQueryBuilder().build({}));
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
    expect(parsed.sort).toEqual([]);
  });

  it('uses config limit and sort, overridden per call', () => {
    const qb = new NestCrudQueryBuilder({ limit: 5, sort: [{ field: 'createdAt', order: 'DESC' }] });
    expect(serverParse(qb.build({ page: 3 }))).toMatchObject({
      page: 3,
      limit: 5,
      sort: [{ field: 'createdAt', order: 'DESC' }],
    });
    expect(
      serverParse(qb.build({ limit: 50, sort: [{ field: 'name', order: 'ASC' }, { field: 'id', order: 'DESC' }] })),
    ).toMatchObject({
      limit: 50,
      sort: [
        { field: 'name', order: 'ASC' },
        { field: 'id', order: 'DESC' },
      ],
    });
  });

  it('sends filters as `filter` params and skips empty ones', () => {
    const qb = new NestCrudQueryBuilder<LeadFilters>({ filters: leadFilters });
    const parsed = serverParse(qb.build({ filters: { status: 'new', ownerIds: [1, 2], archived: false } }));
    expect(parsed.filter).toEqual([
      { field: 'status', operator: '$eq', value: 'new' },
      { field: 'ownerId', operator: '$in', value: [1, 2] },
      { field: 'archivedAt', operator: '$isnull', value: '' },
    ]);
    expect(serverParse(qb.build({ filters: { status: '', ownerIds: [] } })).filter).toEqual([]);
  });

  it('builds a case-insensitive OR search over searchFields, keeping the case of the term', () => {
    const qb = new NestCrudQueryBuilder({
      searchFields: ['name', { field: 'phone', operator: CondOperator.STARTS }],
    });
    const parsed = serverParse(qb.build({ search: '  AcMe ' }));
    expect(parsed.search).toEqual({ $or: [{ name: { $contL: 'AcMe' } }, { phone: { $starts: 'AcMe' } }] });
  });

  it('moves filters inside the search condition when both are present', () => {
    const qb = new NestCrudQueryBuilder<LeadFilters>({ searchFields: ['name'], filters: leadFilters });
    const parsed = serverParse(qb.build({ search: 'acme', filters: { status: 'won', archived: false } }));
    expect(parsed.search).toEqual({
      $and: [
        { status: { $eq: 'won' } },
        { archivedAt: { $isnull: true } },
        { $or: [{ name: { $contL: 'acme' } }] },
      ],
    });
    expect(parsed.filter).toEqual([]);
  });

  it('ignores blank search and search without searchFields', () => {
    expect(serverParse(new NestCrudQueryBuilder({ searchFields: ['name'] }).build({ search: '   ' })).search).toBeUndefined();
    expect(serverParse(new NestCrudQueryBuilder().build({ search: 'x' })).search).toBeUndefined();
  });

  it('adds select fields and joins', () => {
    const qb = new NestCrudQueryBuilder({
      select: ['id', 'name'],
      joins: [{ field: 'owner', select: ['id', 'name'] }, { field: 'tags' }],
    });
    const parsed = serverParse(qb.build({}));
    expect(parsed.fields).toEqual(['id', 'name']);
    expect(parsed.join).toEqual([
      { field: 'owner', select: ['id', 'name'] },
      { field: 'tags', select: undefined },
    ]);
  });

  it('lets subclasses override buildFilters / buildSelect / buildJoins', () => {
    class ActiveOnly extends NestCrudQueryBuilder<{ q?: string }> {
      protected override buildFilters() {
        return [makeFilter('active', CondOperator.EQUALS, true)];
      }
      protected override buildSelect() {
        return ['id'];
      }
    }
    const parsed = serverParse(new ActiveOnly().build({ filters: {} }));
    expect(parsed.filter).toEqual([{ field: 'active', operator: '$eq', value: true }]);
    expect(parsed.fields).toEqual(['id']);
  });

  it('does not call the filter mapper when no filters are passed', () => {
    const filters = jest.fn(() => []);
    new NestCrudQueryBuilder({ filters }).build({ page: 1 });
    expect(filters).not.toHaveBeenCalled();
  });

  it('parseList normalizes with the requested page and limit', () => {
    const qb = new NestCrudQueryBuilder({ limit: 10 });
    expect(qb.parseList({ data: [1], total: 25 }, { page: 2 })).toEqual({
      data: [1],
      count: 1,
      total: 25,
      page: 2,
      pageCount: 3,
    });
  });
});

describe('filter helpers', () => {
  it('makeFilterIf skips null, undefined and empty string but keeps 0 and false', () => {
    expect(makeFilterIf('a', CondOperator.EQUALS, null)).toBeNull();
    expect(makeFilterIf('a', CondOperator.EQUALS, undefined)).toBeNull();
    expect(makeFilterIf('a', CondOperator.EQUALS, '')).toBeNull();
    expect(makeFilterIf('a', CondOperator.EQUALS, 0)).toEqual({ field: 'a', operator: '$eq', value: 0 });
    expect(makeFilterIf('a', CondOperator.EQUALS, false)).toEqual({ field: 'a', operator: '$eq', value: false });
  });

  it('makeFilterIn skips empty or missing arrays and copies the values', () => {
    const values = [1, 2];
    const filter = makeFilterIn('id', values);
    expect(filter).toEqual({ field: 'id', operator: '$in', value: [1, 2] });
    expect(filter?.value).not.toBe(values);
    expect(makeFilterIn('id', [])).toBeNull();
    expect(makeFilterIn('id', undefined)).toBeNull();
  });

  it('makeFilterRange picks between, >=, <= or nothing', () => {
    expect(makeFilterRange('v', 1, 5)).toEqual({ field: 'v', operator: '$between', value: [1, 5] });
    expect(makeFilterRange('v', 1, '')).toEqual({ field: 'v', operator: '$gte', value: 1 });
    expect(makeFilterRange('v', null, 5)).toEqual({ field: 'v', operator: '$lte', value: 5 });
    expect(makeFilterRange('v', undefined, null)).toBeNull();
  });
});
