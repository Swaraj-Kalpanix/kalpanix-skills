import { act, renderHook, waitFor } from '@testing-library/react-native';

import { ApiError } from '../../errors/api.error';
import { createQueryWrapper } from '../../test/createQueryWrapper';
import type { PaginatedResponse } from '../../types/api.types';
import { useApiInfiniteList } from '../useApiInfiniteList';

const pageOf = (page: number, pageCount = 3): PaginatedResponse<string> => ({
  data: [`item-${page}a`, `item-${page}b`],
  count: 2,
  total: pageCount * 2,
  page,
  pageCount,
});

describe('useApiInfiniteList', () => {
  it('starts at page 1, flattens items and exposes total', async () => {
    const queryFn = jest.fn(async (page: number) => pageOf(page));
    const { wrapper } = createQueryWrapper();
    const { result } = await renderHook(() => useApiInfiniteList({ queryKey: ['list'], queryFn }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryFn).toHaveBeenCalledWith(1, { signal: expect.any(AbortSignal) });
    expect(result.current.items).toEqual(['item-1a', 'item-1b']);
    expect(result.current.total).toBe(6);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('loads following pages until pageCount is reached', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = await renderHook(() => useApiInfiniteList({ queryKey: ['list2'], queryFn: async (page) => pageOf(page, 2) }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.items).toHaveLength(4));
    expect(result.current.items).toEqual(['item-1a', 'item-1b', 'item-2a', 'item-2b']);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('returns empty items and total 0 before data arrives', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = await renderHook(
      () => useApiInfiniteList({ queryKey: ['never'], queryFn: () => new Promise<PaginatedResponse<string>>(() => {}) }),
      { wrapper },
    );
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('normalizes errors to ApiError', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = await renderHook(
      () =>
        useApiInfiniteList<string>({
          queryKey: ['fail'],
          queryFn: async () => {
            throw new Error('offline');
          },
        }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
  });

  it('respects enabled: false', async () => {
    const queryFn = jest.fn(async (page: number) => pageOf(page));
    const { wrapper } = createQueryWrapper();
    await renderHook(() => useApiInfiniteList({ queryKey: ['off'], queryFn, enabled: false }), { wrapper });
    expect(queryFn).not.toHaveBeenCalled();
  });
});
