import { AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';

import { configureCore } from '../../config/core.config';
import { toApiError } from '../../errors/api.error';
import { http, publicHttp } from '../../http/client';
import { disableMockServer, enableMockServer, isMockServerEnabled } from '../enableMockServer';
import { configureMockServer } from '../mock.config';
import { createMockAdapter } from '../mockAdapter';
import { mockError, mockResponse, mockServer, type MockRequest } from '../mockServer';

describe('mock adapter (via enableMockServer)', () => {
  let log: jest.SpyInstance;
  beforeAll(() => {
    configureCore({ apiBaseUrl: 'https://api.test/v1' });
  });
  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
    enableMockServer({ latencyMs: 0, logging: false, passthrough: false });
  });
  afterEach(() => {
    mockServer.reset();
    disableMockServer();
    log.mockRestore();
  });

  it('toggles and reports its state', () => {
    expect(isMockServerEnabled()).toBe(true);
    disableMockServer();
    expect(isMockServerEnabled()).toBe(false);
  });

  it('passes the full request to the handler', async () => {
    let seen: MockRequest | undefined;
    mockServer.post('/leads/:id/notes', (req) => {
      seen = req;
      return { ok: true };
    });
    const res = await http.post('/leads/42/notes?draft=true&tag=a&tag=b', { text: 'hi' }, { headers: { 'X-Trace': 't1' } });

    expect(res.status).toBe(201);
    expect(res.data).toEqual({ ok: true });
    expect(seen).toMatchObject({
      method: 'POST',
      path: '/leads/42/notes',
      params: { id: '42' },
      query: { draft: 'true', tag: ['a', 'b'] },
      rawQuery: 'draft=true&tag=a&tag=b',
      body: { text: 'hi' },
    });
    expect(seen?.headers['x-trace']).toBe('t1');
  });

  it('merges axios params into the query and works for publicHttp', async () => {
    mockServer.get('/search', ({ query }) => query);
    expect((await publicHttp.get('/search', { params: { q: 'acme', page: 2 } })).data).toEqual({ q: 'acme', page: '2' });
  });

  it('resolves absolute URLs on the API host too', async () => {
    mockServer.get('/ping', () => 'pong');
    expect((await http.get('https://api.test/v1/ping')).data).toBe('pong');
    expect((await http.get('https://elsewhere.test/ping')).data).toBe('pong');
  });

  it('uses 200 by default, 201 for POST, and custom statuses via mockResponse', async () => {
    mockServer.get('/a', () => ({ a: 1 }));
    mockServer.delete('/a', () => mockResponse(204));
    expect((await http.get('/a')).status).toBe(200);
    const deleted = await http.delete('/a');
    expect(deleted.status).toBe(204);
    expect(deleted.data).toBe('');
  });

  it('turns thrown mockError into an axios error that becomes the right ApiError', async () => {
    mockServer.get('/secret', () => {
      throw mockError(403, 'No access');
    });
    const error = await http.get('/secret').catch(toApiError);
    expect(error).toMatchObject({ code: 'HTTP', status: 403, message: 'No access' });
  });

  it('supports async handlers and returned mockError', async () => {
    mockServer.get('/slow', async () => {
      await Promise.resolve();
      return mockError(409, 'Conflict here');
    });
    await expect(http.get('/slow').catch(toApiError)).resolves.toMatchObject({ status: 409 });
  });

  it('answers 500 when a handler crashes', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    configureMockServer({ logging: true });
    mockServer.get('/boom', () => {
      throw new Error('kaboom');
    });
    await expect(http.get('/boom').catch(toApiError)).resolves.toMatchObject({ status: 500, message: 'kaboom' });
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('answers 404 naming the missing route when passthrough is off', async () => {
    const error = await http.get('/nothing/here').then(() => {
      throw new Error('expected a 404');
    }, toApiError);
    expect(error.status).toBe(404);
    expect(error.message).toContain('No mock registered for GET /nothing/here');
  });

  it('JSON round-trips responses so the mock store cannot be mutated', async () => {
    const store = { list: [{ when: new Date('2026-01-01T00:00:00Z') }] };
    mockServer.get('/store', () => store);
    const { data } = await http.get('/store');
    expect(data).toEqual({ list: [{ when: '2026-01-01T00:00:00.000Z' }] });
    data.list.push('x');
    expect(store.list).toHaveLength(1);
  });

  it('respects validateStatus', async () => {
    mockServer.get('/missing', () => mockResponse(404, { gone: true }));
    const res = await http.get('/missing', { validateStatus: () => true });
    expect(res.status).toBe(404);
  });

  it('logs traffic when logging is on', async () => {
    configureMockServer({ logging: true });
    mockServer.get('/logged', () => 1);
    await http.get('/logged');
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/^\[mock\] GET \/logged → 200/));
  });

  describe('latency and cancellation', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('waits the configured latency (route option wins)', async () => {
      configureMockServer({ latencyMs: 300 });
      mockServer.get('/fast', () => 'ok', { latencyMs: 50 });
      mockServer.get('/normal', () => 'ok');

      let fastDone = false;
      let normalDone = false;
      void http.get('/fast').then(() => (fastDone = true));
      void http.get('/normal').then(() => (normalDone = true));

      await jest.advanceTimersByTimeAsync(60);
      expect(fastDone).toBe(true);
      expect(normalDone).toBe(false);
      await jest.advanceTimersByTimeAsync(300);
      expect(normalDone).toBe(true);
    });

    it('picks latency within a [min, max] range', async () => {
      configureMockServer({ latencyMs: [100, 200] });
      mockServer.get('/range', () => 'ok');
      let done = false;
      void http.get('/range').then(() => (done = true));
      await jest.advanceTimersByTimeAsync(99);
      expect(done).toBe(false);
      await jest.advanceTimersByTimeAsync(101);
      expect(done).toBe(true);
    });

    it('rejects with CANCELLED when aborted during latency, before the handler runs', async () => {
      configureMockServer({ latencyMs: 500 });
      const handler = jest.fn(() => 'ok');
      mockServer.get('/abortable', handler);
      const controller = new AbortController();
      const pending = http.get('/abortable', { signal: controller.signal }).catch(toApiError);

      await jest.advanceTimersByTimeAsync(100);
      controller.abort();
      await expect(pending).resolves.toMatchObject({ code: 'CANCELLED' });
      expect(handler).not.toHaveBeenCalled();
    });

    it('rejects immediately when the signal is already aborted', async () => {
      mockServer.get('/x', () => 'ok');
      const controller = new AbortController();
      controller.abort();
      await expect(http.get('/x', { signal: controller.signal }).catch(toApiError)).resolves.toMatchObject({ code: 'CANCELLED' });
    });
  });
});

describe('createMockAdapter passthrough', () => {
  afterEach(() => {
    mockServer.reset();
    configureMockServer({ passthrough: false });
  });

  const config = (url: string) =>
    ({ url, method: 'get', baseURL: 'https://api.test', headers: new AxiosHeaders() }) as InternalAxiosRequestConfig;

  it('sends unmatched requests to the network adapter when passthrough is on, and still mocks matched ones', async () => {
    const network = jest.fn(async (c: InternalAxiosRequestConfig) => ({ data: 'from-network', status: 200, statusText: 'OK', headers: {}, config: c }));
    const adapter = createMockAdapter(network as unknown as AxiosAdapter);
    configureMockServer({ passthrough: true, latencyMs: 0, logging: false });
    mockServer.get('/mocked', () => 'from-mock');

    await expect(adapter(config('/real'))).resolves.toMatchObject({ data: 'from-network' });
    await expect(adapter(config('/mocked'))).resolves.toMatchObject({ data: 'from-mock' });
    expect(network).toHaveBeenCalledTimes(1);
  });
});
