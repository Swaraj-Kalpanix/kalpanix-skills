import axios, {
  AxiosError,
  AxiosHeaders,
  CanceledError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { parseQueryString } from '..';
import { getMockConfig } from './mock.config';
import {
  MockResponse,
  STATUS_TEXT,
  mockError,
  mockServer,
  normalizePath,
  type HttpMethod,
  type LatencyMs,
  type MockRequest,
} from './mockServer';

function pickLatency(latency: LatencyMs): number {
  if (typeof latency === 'number') return latency;
  const [min, max] = latency;
  return Math.round(min + Math.random() * Math.max(0, max - min));
}

function cancelled(config: InternalAxiosRequestConfig) {
  return new CanceledError(undefined, undefined, config);
}

function wait(ms: number, config: InternalAxiosRequestConfig): Promise<void> {
  const signal = config.signal;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(cancelled(config));
    if (ms <= 0) return resolve();
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener?.('abort', () => {
      clearTimeout(timer);
      reject(cancelled(config));
    });
  });
}

/** `https://api.x.com/v1/leads/42?limit=5` → `{ path: '/leads/42', rawQuery: 'limit=5' }` (relative to baseURL). */
function resolveTarget(config: InternalAxiosRequestConfig): { path: string; rawQuery: string } {
  let rest = axios.getUri(config).split('#')[0];
  const base = (config.baseURL ?? '').replace(/\/+$/, '');
  if (base && rest.startsWith(base)) rest = rest.slice(base.length);
  else rest = rest.replace(/^[a-z][a-z\d+.-]*:\/\/[^/]+/i, '');

  const q = rest.indexOf('?');
  return {
    path: normalizePath(q === -1 ? rest : rest.slice(0, q)),
    rawQuery: q === -1 ? '' : rest.slice(q + 1),
  };
}

function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function headersOf(config: InternalAxiosRequestConfig): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = config.headers?.toJSON?.() ?? {};
  for (const [key, value] of Object.entries(raw)) {
    if (value !== undefined && value !== null) out[key.toLowerCase()] = String(value);
  }
  return out;
}

/** Round-trip through JSON so callers can't mutate the mock store and dates arrive as strings, like a real API. */
function serialize(body: unknown): unknown {
  return body === undefined ? '' : JSON.parse(JSON.stringify(body));
}

async function runHandler(request: MockRequest, handler: (r: MockRequest) => unknown): Promise<MockResponse> {
  try {
    const result = await handler(request);
    if (result instanceof MockResponse) return result;
    return new MockResponse(request.method === 'POST' ? 201 : 200, result);
  } catch (error) {
    if (error instanceof MockResponse) return error;
    if (getMockConfig().logging) console.error(`[mock] ${request.method} ${request.path} handler threw`, error);
    return mockError(500, error instanceof Error ? error.message : 'Mock handler failed');
  }
}

/**
 * Axios adapter that answers from `mockServer`. Unmatched requests go to
 * `networkAdapter` (the real network) when `passthrough` is on, otherwise
 * they get a 404 naming the missing route. Installed by `enableMockServer()`.
 */
export function createMockAdapter(networkAdapter: AxiosAdapter): AxiosAdapter {
  return async (config) => {
    const { passthrough, latencyMs, logging } = getMockConfig();
    const method = (config.method ?? 'get').toUpperCase() as HttpMethod;
    const { path, rawQuery } = resolveTarget(config);
    const match = mockServer.match(method, path);

    if (!match && passthrough) {
      if (logging) console.log(`[mock] ${method} ${path} → passthrough to network`);
      return networkAdapter(config);
    }

    const started = Date.now();
    await wait(pickLatency(match?.options.latencyMs ?? latencyMs), config);

    const result = match
      ? await runHandler(
          {
            method,
            path,
            params: match.params,
            query: parseQueryString(rawQuery),
            rawQuery,
            body: parseBody(config.data),
            headers: headersOf(config),
          },
          match.handler,
        )
      : mockError(
          404,
          `No mock registered for ${method} ${path}. Add one with mockServer.${method.toLowerCase()}('${path}', …) or mockCollection(), or enable passthrough.`,
        );

    if (config.signal?.aborted) throw cancelled(config);

    const response: AxiosResponse = {
      data: serialize(result.body),
      status: result.status,
      statusText: STATUS_TEXT[result.status] ?? '',
      headers: new AxiosHeaders({ 'content-type': 'application/json', ...result.headers }),
      config,
      request: { mock: true },
    };

    if (logging) console.log(`[mock] ${method} ${path} → ${result.status} (${Date.now() - started}ms)`);

    const validateStatus = config.validateStatus;
    if (!validateStatus || validateStatus(result.status)) return response;
    throw new AxiosError(
      `Request failed with status code ${result.status}`,
      result.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      response.request,
      response,
    );
  };
}
