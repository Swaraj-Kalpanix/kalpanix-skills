import type { InternalAxiosRequestConfig } from 'axios';

import { installFakeHttp, type FakeHttp } from '../../test/fakeHttp';
import { setAuthAdapter } from '../auth';
import { createHttpClient, http, publicHttp } from '../client';

const authHeader = (config: InternalAxiosRequestConfig) => config.headers.get('Authorization');

describe('auth adapter', () => {
  let fake: FakeHttp;
  beforeEach(() => {
    fake = installFakeHttp();
  });
  afterEach(() => {
    setAuthAdapter(null);
    fake.restore();
  });

  it('sends no auth header without an adapter', async () => {
    await http.get('/me');
    expect(authHeader(fake.requests[0])).toBeUndefined();
  });

  it('attaches a Bearer token (sync or async getter)', async () => {
    setAuthAdapter({ getAccessToken: () => 'sync-token' });
    await http.get('/a');
    setAuthAdapter({ getAccessToken: async () => 'async-token' });
    await http.get('/b');
    expect(authHeader(fake.requests[0])).toBe('Bearer sync-token');
    expect(authHeader(fake.requests[1])).toBe('Bearer async-token');
  });

  it('supports a custom header name and scheme', async () => {
    setAuthAdapter({ getAccessToken: () => 'k', headerName: 'X-Api-Key', scheme: '' });
    await http.get('/a');
    expect(fake.requests[0].headers.get('X-Api-Key')).toBe('k');
    expect(authHeader(fake.requests[0])).toBeUndefined();
  });

  it('skips when signed out, for skipAuth, for publicHttp, and when a header is already set', async () => {
    const getAccessToken = jest.fn(() => 'token');
    setAuthAdapter({ getAccessToken: () => null });
    await http.get('/signed-out');
    setAuthAdapter({ getAccessToken });
    await http.get('/skip', { skipAuth: true });
    await publicHttp.get('/public');
    await createHttpClient({ withAuth: false }).get('/no-auth-client');
    await http.get('/preset', { headers: { Authorization: 'Basic abc' } });

    expect(fake.requests.map(authHeader)).toEqual([undefined, undefined, undefined, undefined, 'Basic abc']);
  });

  describe('on 401', () => {
    let token: string;
    beforeEach(() => {
      token = 'old';
      // The server accepts only the "new" token.
      fake.reply((config) => (authHeader(config) === 'Bearer new' ? [200, { ok: true }] : [401, { message: 'Unauthorized' }]));
    });

    it('refreshes once for concurrent failures and replays every request', async () => {
      const refreshAccessToken = jest.fn(async () => {
        await new Promise((r) => setTimeout(r, 10));
        token = 'new';
        return token;
      });
      const onUnauthorized = jest.fn();
      setAuthAdapter({ getAccessToken: () => token, refreshAccessToken, onUnauthorized });

      const results = await Promise.all([http.get('/a'), http.get('/b'), http.get('/c')]);

      expect(results.map((r) => r.data)).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
      expect(refreshAccessToken).toHaveBeenCalledTimes(1);
      expect(onUnauthorized).not.toHaveBeenCalled();
      expect(fake.requests).toHaveLength(6); // 3 failed + 3 replayed
    });

    it('signs out once for a burst when refresh returns null', async () => {
      const onUnauthorized = jest.fn();
      setAuthAdapter({ getAccessToken: () => token, refreshAccessToken: async () => null, onUnauthorized });

      const results = await Promise.allSettled([http.get('/a'), http.get('/b')]);

      expect(results.every((r) => r.status === 'rejected')).toBe(true);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('signs out when refresh throws', async () => {
      const onUnauthorized = jest.fn();
      setAuthAdapter({
        getAccessToken: () => token,
        refreshAccessToken: async () => {
          throw new Error('refresh endpoint down');
        },
        onUnauthorized,
      });
      await expect(http.get('/a')).rejects.toMatchObject({ response: { status: 401 } });
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('signs out directly when there is no refresh function (e.g. Clerk)', async () => {
      const onUnauthorized = jest.fn();
      setAuthAdapter({ getAccessToken: () => token, onUnauthorized });
      await expect(http.get('/a')).rejects.toBeDefined();
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
      expect(fake.requests).toHaveLength(1);
    });

    it('does not loop when the replay is still unauthorized', async () => {
      fake.reply(() => [401, {}]);
      const refreshAccessToken = jest.fn(async () => 'still-bad');
      const onUnauthorized = jest.fn();
      setAuthAdapter({ getAccessToken: () => token, refreshAccessToken, onUnauthorized });

      await expect(http.get('/a')).rejects.toBeDefined();
      expect(refreshAccessToken).toHaveBeenCalledTimes(1);
      expect(fake.requests).toHaveLength(2);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('leaves skipAuth requests and other statuses alone', async () => {
      const refreshAccessToken = jest.fn(async () => 'new');
      setAuthAdapter({ getAccessToken: () => token, refreshAccessToken });
      await expect(http.get('/a', { skipAuth: true })).rejects.toBeDefined();
      fake.reply(() => [403, {}]);
      await expect(http.get('/b')).rejects.toBeDefined();
      expect(refreshAccessToken).not.toHaveBeenCalled();
    });
  });
});
