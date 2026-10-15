import { skipToken } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { ApiError } from '../../errors/api.error';
import { createQueryWrapper } from '../../test/createQueryWrapper';
import { useApiQuery } from '../useApiQuery';

describe('useApiQuery', () => {
  it('returns data and passes the abort signal', async () => {
    const queryFn = jest.fn(async ({ signal }: { signal: AbortSignal }) => ({ ok: signal instanceof AbortSignal }));
    const { wrapper } = createQueryWrapper();
    const { result } = await renderHook(() => useApiQuery({ queryKey: ['a'], queryFn }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ ok: true });
  });

  it('supports select', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = await renderHook(
      () => useApiQuery({ queryKey: ['b'], queryFn: async () => [1, 2, 3], select: (xs) => xs.length }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data).toBe(3));
  });

  it('keeps ApiErrors as they are', async () => {
    const apiError = new ApiError('Lead not found', { code: 'HTTP', status: 404 });
    const { wrapper } = createQueryWrapper();
    const { result } = await renderHook(
      () =>
        useApiQuery({
          queryKey: ['c'],
          queryFn: async () => {
            throw apiError;
          },
        }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(apiError);
  });

  it('turns any other thrown value into an ApiError', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = await renderHook(
      () =>
        useApiQuery({
          queryKey: ['d'],
          queryFn: () => {
            throw new TypeError('bug in queryFn');
          },
        }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({ code: 'UNKNOWN', message: 'bug in queryFn' });
  });

  it('does not fetch with skipToken', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = await renderHook(() => useApiQuery({ queryKey: ['e'], queryFn: skipToken }), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isPending).toBe(true);
  });
});
