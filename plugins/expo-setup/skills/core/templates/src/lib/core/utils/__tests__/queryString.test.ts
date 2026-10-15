import { parseQueryString, toQueryString, withQuery } from '../queryString';

describe('toQueryString', () => {
  it('serializes primitives and encodes keys and values', () => {
    expect(toQueryString({ a: 1, b: 'x y', 'c&d': 'e=f', flag: true })).toBe('a=1&b=x%20y&c%26d=e%3Df&flag=true');
  });

  it('skips null, undefined and empty strings but keeps 0 and false', () => {
    expect(toQueryString({ a: null, b: undefined, c: '', d: 0, e: false })).toBe('d=0&e=false');
  });

  it('repeats array values by default', () => {
    expect(toQueryString({ status: ['a', 'b'] })).toBe('status=a&status=b');
  });

  it('joins array values with commas in comma format', () => {
    expect(toQueryString({ status: ['a', 'b'] }, 'comma')).toBe('status=a%2Cb');
  });

  it('drops empty arrays and empty items', () => {
    expect(toQueryString({ status: [], ids: [1, null, '', 2] })).toBe('ids=1&ids=2');
  });
});

describe('parseQueryString', () => {
  it('returns an empty object for an empty string or a lone ?', () => {
    expect(parseQueryString('')).toEqual({});
    expect(parseQueryString('?')).toEqual({});
  });

  it('parses single values and strips a leading ?', () => {
    expect(parseQueryString('?a=1&b=two')).toEqual({ a: '1', b: 'two' });
  });

  it('turns repeated keys into arrays', () => {
    expect(parseQueryString('s=a&s=b&s=c')).toEqual({ s: ['a', 'b', 'c'] });
  });

  it('turns bracket keys (qs format) into arrays, even with one value', () => {
    expect(parseQueryString('sort%5B0%5D=a%2CASC&sort%5B1%5D=b%2CDESC&ids[]=1')).toEqual({
      sort: ['a,ASC', 'b,DESC'],
      ids: ['1'],
    });
  });

  it('decodes + as space and percent-encoding', () => {
    expect(parseQueryString('q=hello+world&x=%E2%9C%93')).toEqual({ q: 'hello world', x: '✓' });
  });

  it('keeps keys without values and survives malformed encoding', () => {
    expect(parseQueryString('flag&bad=%E0%A4%A')).toEqual({ flag: '', bad: '%E0%A4%A' });
  });

  it('round-trips with toQueryString', () => {
    const record = { page: 2, search: 'acme & co', status: ['new', 'won'] };
    expect(parseQueryString(toQueryString(record))).toEqual({ page: '2', search: 'acme & co', status: ['new', 'won'] });
  });
});

describe('withQuery', () => {
  it('appends with ? or & and skips empty queries', () => {
    expect(withQuery('/leads', 'a=1')).toBe('/leads?a=1');
    expect(withQuery('/leads?x=1', 'a=1')).toBe('/leads?x=1&a=1');
    expect(withQuery('/leads', '')).toBe('/leads');
  });
});
