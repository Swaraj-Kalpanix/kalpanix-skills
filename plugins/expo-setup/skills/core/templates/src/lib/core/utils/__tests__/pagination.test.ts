import { getNextPage, toPaginated } from '../pagination';

describe('toPaginated', () => {
  it('passes a full PaginatedResponse through unchanged', () => {
    const body = { data: [1, 2], count: 2, total: 10, page: 3, pageCount: 5 };
    expect(toPaginated(body)).toEqual(body);
  });

  it('wraps a plain array as a single page', () => {
    expect(toPaginated(['a', 'b'])).toEqual({ data: ['a', 'b'], count: 2, total: 2, page: 1, pageCount: 1 });
  });

  it('fills missing fields from the fallback page and limit', () => {
    expect(toPaginated({ data: [1, 2], total: 45 }, { page: 2, limit: 20 })).toEqual({
      data: [1, 2],
      count: 2,
      total: 45,
      page: 2,
      pageCount: 3,
    });
  });

  it('defaults total to data length and pageCount to 1 without a limit', () => {
    expect(toPaginated({ data: [1] })).toEqual({ data: [1], count: 1, total: 1, page: 1, pageCount: 1 });
  });

  it('never reports fewer than one page', () => {
    expect(toPaginated({ data: [], total: 0 }, { limit: 20 }).pageCount).toBe(1);
  });

  it.each([null, undefined, 'text', 42, { items: [] }])('throws for an unrecognized body (%p)', (raw) => {
    expect(() => toPaginated(raw)).toThrow(TypeError);
  });
});

describe('getNextPage', () => {
  it('returns the next page while pages remain, otherwise undefined', () => {
    expect(getNextPage({ data: [], count: 0, total: 50, page: 1, pageCount: 3 })).toBe(2);
    expect(getNextPage({ data: [], count: 0, total: 50, page: 3, pageCount: 3 })).toBeUndefined();
  });
});
