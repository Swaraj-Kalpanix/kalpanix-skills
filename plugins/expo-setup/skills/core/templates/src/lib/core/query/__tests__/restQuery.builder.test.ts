import { parseQueryString } from '../../utils/queryString';
import { RestQueryBuilder, formatRestSort, parseRestSort } from '../restQuery.builder';

describe('RestQueryBuilder', () => {
  it('sends page, limit, search, sort and filters with default names', () => {
    const qb = new RestQueryBuilder<{ status?: string[]; city?: string }>({
      limit: 10,
      sort: [{ field: 'name', order: 'ASC' }],
    });
    expect(parseQueryString(qb.build({ page: 2, search: ' acme ', filters: { status: ['a', 'b'], city: 'Pune' } }))).toEqual({
      page: '2',
      limit: '10',
      search: 'acme',
      sort: 'name:asc',
      status: ['a', 'b'],
      city: 'Pune',
    });
  });

  it('omits empty search, sort and filters', () => {
    expect(new RestQueryBuilder().build({})).toBe('page=1&limit=20');
    expect(new RestQueryBuilder().build({ search: '  ', filters: { x: '' } })).toBe('page=1&limit=20');
  });

  it('renames params, uses comma arrays, custom sort format and filter mapper', () => {
    const qb = new RestQueryBuilder<{ statuses: string[] }>({
      params: { search: 'q', limit: 'per_page' },
      arrayFormat: 'comma',
      formatSort: (sort) => sort.map((s) => (s.order === 'DESC' ? `-${s.field}` : s.field)).join(','),
      filters: (f) => ({ status: f.statuses }),
    });
    expect(
      parseQueryString(qb.build({ search: 'x', sort: [{ field: 'createdAt', order: 'DESC' }], filters: { statuses: ['new', 'won'] } })),
    ).toEqual({ page: '1', per_page: '20', q: 'x', sort: '-createdAt', status: 'new,won' });
  });

  it('parseList normalizes by default and defers to a custom parser', () => {
    expect(new RestQueryBuilder({ limit: 5 }).parseList({ data: [1], total: 11 }, { page: 1 }).pageCount).toBe(3);

    const custom = new RestQueryBuilder({
      parseList: (raw) => {
        const body = raw as { items: number[]; meta: { total: number } };
        return { data: body.items, count: body.items.length, total: body.meta.total, page: 1, pageCount: 1 };
      },
    });
    expect(custom.parseList({ items: [7], meta: { total: 1 } }, {})).toEqual({
      data: [7],
      count: 1,
      total: 1,
      page: 1,
      pageCount: 1,
    });
  });
});

describe('rest sort helpers', () => {
  it('formats and parses the field:order format', () => {
    const sort = [
      { field: 'createdAt', order: 'DESC' as const },
      { field: 'name', order: 'ASC' as const },
    ];
    expect(formatRestSort(sort)).toBe('createdAt:desc,name:asc');
    expect(parseRestSort('createdAt:desc,name:asc')).toEqual(sort);
  });

  it('defaults to ASC and ignores blanks', () => {
    expect(parseRestSort('name, ,id:weird')).toEqual([
      { field: 'name', order: 'ASC' },
      { field: 'id', order: 'ASC' },
    ]);
  });
});
