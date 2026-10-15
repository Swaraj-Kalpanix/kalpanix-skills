import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Send this request without the auth header and skip 401 handling. */
    skipAuth?: boolean;
  }
}

/**
 * Connects the http layer to whatever auth the app uses — custom login, Clerk,
 * or anything else — without the core knowing which.
 *
 * Custom login (access + refresh token):
 * ```ts
 * setAuthAdapter({
 *   getAccessToken: () => tokenStore.access,
 *   refreshAccessToken: async () => {
 *     const { accessToken } = await publicHttp.post('/auth/refresh', { refreshToken: tokenStore.refresh }).then(r => r.data);
 *     tokenStore.access = accessToken;
 *     return accessToken;
 *   },
 *   onUnauthorized: () => store.dispatch(signedOut()),
 * });
 * ```
 *
 * Clerk (the SDK refreshes on its own, so no `refreshAccessToken`):
 * ```ts
 * const { getToken, signOut } = useAuth();
 * setAuthAdapter({ getAccessToken: () => getToken(), onUnauthorized: () => signOut() });
 * ```
 */
export interface AuthAdapter {
  /** Current access token, or `null` when signed out. May be async (Clerk's `getToken()` is). */
  getAccessToken: () => string | null | undefined | Promise<string | null | undefined>;
  /**
   * Called on a 401 to get a fresh token. Return `null` when refresh is not
   * possible. Concurrent 401s share one call. Omit if your auth SDK refreshes itself.
   */
  refreshAccessToken?: () => Promise<string | null | undefined>;
  /** Called when a request is still unauthorized after refresh. Sign the user out here. */
  onUnauthorized?: () => void;
  /** Header to set. Default `Authorization`. */
  headerName?: string;
  /** Prefix before the token. Default `Bearer`; `''` sends the bare token. */
  scheme?: string;
}

let adapter: AuthAdapter | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let lastUnauthorizedAt = 0;

/** Install (or remove with `null`) the auth adapter. Safe to call again on sign-in / sign-out. */
export function setAuthAdapter(next: AuthAdapter | null): void {
  adapter = next;
  refreshInFlight = null;
  lastUnauthorizedAt = 0;
}

function formatToken(token: string): string {
  const scheme = adapter?.scheme ?? 'Bearer';
  return scheme ? `${scheme} ${token}` : token;
}

/** Single-flight refresh: concurrent 401s wait on the same promise. Never rejects. */
function refreshOnce(): Promise<string | null> {
  const refresh = adapter?.refreshAccessToken;
  if (!refresh) return Promise.resolve(null);
  refreshInFlight ??= refresh()
    .then((token) => token ?? null)
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/** A burst of parallel 401s should sign the user out once, not N times. */
function notifyUnauthorized(): void {
  const now = Date.now();
  if (now - lastUnauthorizedAt < 2_000) return;
  lastUnauthorizedAt = now;
  adapter?.onUnauthorized?.();
}

type RetriableConfig = InternalAxiosRequestConfig & { _authRetried?: boolean };

/** Attach the auth header on requests and the refresh-and-replay handler on 401 responses. */
export function attachAuth(instance: AxiosInstance): void {
  instance.interceptors.request.use(async (config) => {
    if (!adapter || config.skipAuth) return config;
    const headerName = adapter.headerName ?? 'Authorization';
    if (config.headers.has(headerName)) return config;
    const token = await adapter.getAccessToken();
    if (token) config.headers.set(headerName, formatToken(token));
    return config;
  });

  instance.interceptors.response.use(undefined, async (error: unknown) => {
    const response = (error as { response?: { status?: number } } | null)?.response;
    const config = (error as { config?: RetriableConfig } | null)?.config;
    if (!adapter || !config || config.skipAuth || response?.status !== 401) throw error;

    if (!config._authRetried && adapter.refreshAccessToken) {
      config._authRetried = true;
      const token = await refreshOnce();
      if (token) {
        config.headers.set(adapter.headerName ?? 'Authorization', formatToken(token));
        return instance(config);
      }
    }

    notifyUnauthorized();
    throw error;
  });
}
