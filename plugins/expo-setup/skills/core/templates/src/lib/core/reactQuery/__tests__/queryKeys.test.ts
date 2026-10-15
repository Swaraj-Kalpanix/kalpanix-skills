import { createQueryKeys } from '../queryKeys';

describe('createQueryKeys', () => {
  const keys = createQueryKeys('leads');

  it('builds a predictable hierarchy', () => {
    expect(keys.all).toEqual(['leads']);
    expect(keys.lists()).toEqual(['leads', 'list']);
    expect(keys.list({ page: 1 })).toEqual(['leads', 'list', { page: 1 }]);
    expect(keys.list()).toEqual(['leads', 'list', {}]);
    expect(keys.infinite({ search: 'a' })).toEqual(['leads', 'list', 'infinite', { search: 'a' }]);
    expect(keys.details()).toEqual(['leads', 'detail']);
    expect(keys.detail(7)).toEqual(['leads', 'detail', 7]);
  });

  it('nests lists and infinite lists under lists() so one invalidation refreshes both', () => {
    const prefix = keys.lists();
    for (const key of [keys.list({ a: 1 }), keys.infinite({ b: 2 })]) {
      expect(key.slice(0, prefix.length)).toEqual(prefix);
    }
  });
});
