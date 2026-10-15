import type { AxiosAdapter } from 'axios';

import { configureCore } from '../../config/core.config';
import { createHttpClient, http, publicHttp, setHttpAdapter } from '../client';

describe('http clients', () => {
  afterEach(() => {
    setHttpAdapter(null);
    configureCore({ apiBaseUrl: '', requestTimeoutMs: 30_000 });
  });

  it('follow configureCore for base URL and timeout, including clients created later', () => {
    configureCore({ apiBaseUrl: 'https://api.test/v1', requestTimeoutMs: 5_000 });
    const later = createHttpClient();
    for (const client of [http, publicHttp, later]) {
      expect(client.defaults.baseURL).toBe('https://api.test/v1');
      expect(client.defaults.timeout).toBe(5_000);
    }
    configureCore({ apiBaseUrl: 'https://other.test' });
    expect(http.defaults.baseURL).toBe('https://other.test');
    expect(later.defaults.baseURL).toBe('https://other.test');
  });

  it('keeps a fixed baseURL when one is given', () => {
    const second = createHttpClient({ baseURL: 'https://files.test' });
    configureCore({ apiBaseUrl: 'https://api.test' });
    expect(second.defaults.baseURL).toBe('https://files.test');
  });

  it('sends JSON headers', () => {
    expect(http.defaults.headers['Content-Type']).toBe('application/json');
    expect(http.defaults.headers.Accept).toBe('application/json');
  });

  it('setHttpAdapter swaps the transport for every client and null restores the network', () => {
    const original = http.defaults.adapter;
    const fake: AxiosAdapter = jest.fn();
    const factory = jest.fn(() => fake);

    setHttpAdapter(factory);
    expect(factory).toHaveBeenCalledWith(expect.any(Function)); // receives the real network adapter
    expect(http.defaults.adapter).toBe(fake);
    expect(publicHttp.defaults.adapter).toBe(fake);
    expect(createHttpClient().defaults.adapter).toBe(fake);

    setHttpAdapter(null);
    expect(http.defaults.adapter).toBe(original);
    expect(publicHttp.defaults.adapter).toBe(original);
  });

  it('passes the real network adapter to the factory for passthrough', () => {
    const original = http.defaults.adapter;
    let received: AxiosAdapter | undefined;
    setHttpAdapter((network) => {
      received = network;
      return network;
    });
    expect(received).toBe(original);
  });
});
