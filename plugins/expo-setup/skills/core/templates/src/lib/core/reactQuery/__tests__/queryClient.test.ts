import { ApiError } from '../../errors/api.error';
import { createQueryClient, shouldRetry } from '../queryClient';

const http = (status: number) => new ApiError('x', { code: 'HTTP', status });

describe('shouldRetry', () => {
  it.each([
    ['network error', new ApiError('x', { code: 'NETWORK' }), true],
    ['timeout', new ApiError('x', { code: 'TIMEOUT' }), true],
    ['500', http(500), true],
    ['503', http(503), true],
    ['408 request timeout', http(408), true],
    ['429 rate limited', http(429), true],
    ['400', http(400), false],
    ['401', http(401), false],
    ['404', http(404), false],
    ['validation', new ApiError('x', { code: 'VALIDATION' }), false],
    ['cancelled', new ApiError('x', { code: 'CANCELLED' }), false],
    ['non-ApiError', new Error('x'), false],
  ])('%s → retry=%p on the first failure', (_label, error, expected) => {
    expect(shouldRetry(0, error)).toBe(expected);
  });

  it('stops after two retries', () => {
    expect(shouldRetry(1, http(500))).toBe(true);
    expect(shouldRetry(2, http(500))).toBe(false);
  });
});

describe('createQueryClient', () => {
  it('applies mobile defaults', () => {
    const { queries, mutations } = createQueryClient().getDefaultOptions();
    expect(queries).toMatchObject({ staleTime: 60_000, gcTime: 300_000, refetchOnWindowFocus: true, refetchOnReconnect: true, retry: shouldRetry });
    expect(mutations).toMatchObject({ retry: 0 });
  });

  it('lets callers override individual defaults', () => {
    const client = createQueryClient({ defaultOptions: { queries: { staleTime: 0 }, mutations: { retry: 1 } } });
    const { queries, mutations } = client.getDefaultOptions();
    expect(queries?.staleTime).toBe(0);
    expect(queries?.gcTime).toBe(300_000);
    expect(mutations?.retry).toBe(1);
  });
});
