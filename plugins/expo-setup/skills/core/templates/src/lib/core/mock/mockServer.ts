import type { ParsedQuery } from '..';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type LatencyMs = number | readonly [number, number];

export interface MockRequest {
  method: HttpMethod;
  /** Path relative to the API base URL, without the query string — e.g. `/leads/42`. */
  path: string;
  /** Route params — `/leads/:id` → `{ id: '42' }`. */
  params: Record<string, string>;
  /** Parsed query string; repeated keys become arrays. */
  query: ParsedQuery;
  rawQuery: string;
  /** JSON bodies are parsed; anything else (FormData, text) is passed through. */
  body: unknown;
  /** Lower-cased header names. */
  headers: Record<string, string>;
}

/** Return (or throw) this from a handler to control the status code. Plain return values are sent as 200/201. */
export class MockResponse {
  constructor(
    readonly status: number,
    readonly body?: unknown,
    readonly headers: Record<string, string> = {},
  ) {}
}

export function mockResponse(status: number, body?: unknown, headers?: Record<string, string>): MockResponse {
  return new MockResponse(status, body, headers);
}

export const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

/** A NestJS-shaped error: `{ statusCode, message, error }`. `throw mockError(404, 'Lead not found')`. */
export function mockError(status: number, message: string | string[], error?: string): MockResponse {
  return new MockResponse(status, { statusCode: status, message, error: error ?? STATUS_TEXT[status] ?? 'Error' });
}

export type MockHandler = (request: MockRequest) => unknown;

export interface MockRouteOptions {
  /** Override the global mock latency for this route. */
  latencyMs?: LatencyMs;
}

interface Route {
  method: HttpMethod;
  pattern: string;
  regex: RegExp;
  keys: string[];
  /** Routes with more literal segments win: `/leads/stats` beats `/leads/:id`. */
  literalSegments: number;
  handler: MockHandler;
  options: MockRouteOptions;
}

export interface MockMatch {
  handler: MockHandler;
  params: Record<string, string>;
  options: MockRouteOptions;
}

export function normalizePath(path: string): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compile(pattern: string): Pick<Route, 'regex' | 'keys' | 'literalSegments'> {
  const keys: string[] = [];
  let literalSegments = 0;
  const source = normalizePath(pattern)
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      if (segment) literalSegments += 1;
      return escapeRegex(segment);
    })
    .join('/');
  return { regex: new RegExp(`^${source}$`), keys, literalSegments };
}

/**
 * In-memory API used once `enableMockServer()` runs. Features register their routes
 * (usually with `mockCollection`) in `src/features/<feature>/mocks/`.
 *
 * ```ts
 * mockServer.get('/dashboard/stats', () => ({ openLeads: 12, wonThisMonth: 3 }));
 * mockServer.post('/leads/:id/convert', ({ params }) => {
 *   if (!leads.find(params.id)) throw mockError(404, 'Lead not found');
 *   return leads.update(params.id, { status: 'converted' });
 * });
 * ```
 */
class MockServer {
  private routes: Route[] = [];

  /** Register a handler. Returns a function that removes it. */
  on(method: HttpMethod, pattern: string, handler: MockHandler, options: MockRouteOptions = {}): () => void {
    const route: Route = { method, pattern: normalizePath(pattern), handler, options, ...compile(pattern) };
    this.routes = [...this.routes.filter((r) => !(r.method === method && r.pattern === route.pattern)), route];
    return () => {
      this.routes = this.routes.filter((r) => r !== route);
    };
  }

  get(pattern: string, handler: MockHandler, options?: MockRouteOptions) {
    return this.on('GET', pattern, handler, options);
  }
  post(pattern: string, handler: MockHandler, options?: MockRouteOptions) {
    return this.on('POST', pattern, handler, options);
  }
  put(pattern: string, handler: MockHandler, options?: MockRouteOptions) {
    return this.on('PUT', pattern, handler, options);
  }
  patch(pattern: string, handler: MockHandler, options?: MockRouteOptions) {
    return this.on('PATCH', pattern, handler, options);
  }
  delete(pattern: string, handler: MockHandler, options?: MockRouteOptions) {
    return this.on('DELETE', pattern, handler, options);
  }

  match(method: HttpMethod, path: string): MockMatch | null {
    const normalized = normalizePath(path);
    let best: { route: Route; values: string[] } | null = null;

    for (const route of this.routes) {
      if (route.method !== method) continue;
      const result = route.regex.exec(normalized);
      if (!result) continue;
      if (!best || route.literalSegments > best.route.literalSegments) {
        best = { route, values: result.slice(1) };
      }
    }
    if (!best) return null;

    const params: Record<string, string> = {};
    best.route.keys.forEach((key, i) => {
      params[key] = decodeURIComponent(best.values[i]);
    });
    return { handler: best.route.handler, params, options: best.route.options };
  }

  /** Registered routes, for debugging. */
  list(): { method: HttpMethod; pattern: string }[] {
    return this.routes.map(({ method, pattern }) => ({ method, pattern }));
  }

  /** Remove every route (tests). */
  reset(): void {
    this.routes = [];
  }
}

export const mockServer = new MockServer();
export type { MockServer };
