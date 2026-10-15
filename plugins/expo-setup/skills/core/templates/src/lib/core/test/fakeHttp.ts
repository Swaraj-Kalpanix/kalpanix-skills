import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { setHttpAdapter } from '../http/client';

/**
 * Test helper: replaces the core's transport with a scripted fake.
 * Test-only — never import from app code.
 *
 * ```ts
 * const fake = installFakeHttp();
 * fake.reply(() => [200, { id: 1 }]);
 * await leadService.getById(1);
 * expect(fake.requests[0].url).toBe('/leads/1');
 * ```
 */
export type FakeReply = (config: InternalAxiosRequestConfig) => [number, unknown?] | Promise<[number, unknown?]>;

export interface FakeHttp {
  adapter: jest.Mock<ReturnType<AxiosAdapter>, Parameters<AxiosAdapter>>;
  /** Every request seen, in order. */
  requests: InternalAxiosRequestConfig[];
  /** Set how requests are answered (default: 200 with `null`). */
  reply(fn: FakeReply): void;
  /** Restore the real network transport. */
  restore(): void;
}

export function respond(config: InternalAxiosRequestConfig, status: number, data?: unknown): AxiosResponse {
  const response: AxiosResponse = {
    data,
    status,
    statusText: String(status),
    headers: new AxiosHeaders(),
    config,
    request: {},
  };
  if (status >= 200 && status < 300) return response;
  throw new AxiosError(
    `Request failed with status code ${status}`,
    status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    {},
    response,
  );
}

export function installFakeHttp(): FakeHttp {
  const requests: InternalAxiosRequestConfig[] = [];
  let replyFn: FakeReply = () => [200, null];

  const adapter = jest.fn(async (config: InternalAxiosRequestConfig) => {
    requests.push(config);
    const [status, data] = await replyFn(config);
    return respond(config, status, data);
  });

  setHttpAdapter(() => adapter);
  return {
    adapter,
    requests,
    reply: (fn) => {
      replyFn = fn;
    },
    restore: () => setHttpAdapter(null),
  };
}

/** Parse the JSON body axios sent. */
export function bodyOf(config: InternalAxiosRequestConfig): unknown {
  return typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
}
