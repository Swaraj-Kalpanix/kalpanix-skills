import axios, { create, getAdapter, type AxiosAdapter, type AxiosInstance } from 'axios';

import { getCoreConfig, onCoreConfigChange, type CoreConfig } from '../config/core.config';
import { attachAuth } from './auth';

/** The platform's real transport (XHR in React Native). Resolved once. */
const networkAdapter: AxiosAdapter = getAdapter(axios.defaults.adapter);

/** Receives the real network adapter (for passthrough) and returns the adapter to use instead. */
export type HttpAdapterFactory = (networkAdapter: AxiosAdapter) => AxiosAdapter;

let activeAdapter: AxiosAdapter = networkAdapter;
const clients = new Set<AxiosInstance>();

/**
 * Replace the transport of every http client — the plug point for the mock
 * server (`./mock`, entry `@/lib/core/mock`), request recording, tests, etc. `null` restores the
 * real network.
 */
export function setHttpAdapter(factory: HttpAdapterFactory | null): void {
  activeAdapter = factory ? factory(networkAdapter) : networkAdapter;
  clients.forEach((client) => {
    client.defaults.adapter = activeAdapter;
  });
}

export interface HttpClientOptions {
  /** Attach the auth header + 401 refresh (see `setAuthAdapter`). Default `true`. */
  withAuth?: boolean;
  /** Fixed base URL for this client. Default: `apiBaseUrl` from the core config. */
  baseURL?: string;
}

/**
 * Create an axios instance that follows the core config (base URL, timeout)
 * and the active transport. Use for a second backend; everyday code uses
 * `http` / `publicHttp`.
 */
export function createHttpClient(options: HttpClientOptions = {}): AxiosInstance {
  const instance = create({
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    adapter: activeAdapter,
  });
  clients.add(instance);

  const apply = (config: Readonly<CoreConfig>) => {
    instance.defaults.baseURL = options.baseURL ?? config.apiBaseUrl;
    instance.defaults.timeout = config.requestTimeoutMs;
  };
  apply(getCoreConfig());
  onCoreConfigChange(apply);

  if (options.withAuth !== false) attachAuth(instance);
  return instance;
}

/** Authenticated client — every service uses this by default. */
export const http = createHttpClient();

/** No auth header, no refresh — for login, refresh, and public endpoints. */
export const publicHttp = createHttpClient({ withAuth: false });
