/**
 * Runtime configuration for the core layer.
 *
 * The core never reads env vars itself — the app calls `configureCore()` once at
 * startup (see `src/lib/setupCore.ts`). That keeps this folder portable to any
 * Expo app.
 */

/**
 * How responses are checked against a service's zod schema.
 *   off    — no checking
 *   warn   — log a warning, return the data as-is (production default)
 *   strict — throw an `ApiError` with code `VALIDATION` (development default)
 */
export type ResponseValidationMode = 'off' | 'warn' | 'strict';

export interface CoreConfig {
  /** Base URL of the API, e.g. `https://api.example.com/v1`. */
  apiBaseUrl: string;
  requestTimeoutMs: number;
  responseValidation: ResponseValidationMode;
}

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

let config: CoreConfig = {
  apiBaseUrl: '',
  requestTimeoutMs: 30_000,
  responseValidation: isDev ? 'strict' : 'warn',
};

type Listener = (config: CoreConfig) => void;
const listeners = new Set<Listener>();

/** Merge `partial` into the core config and notify subscribers (http clients re-apply it). */
export function configureCore(partial: Partial<CoreConfig>): void {
  config = { ...config, ...partial };
  listeners.forEach((listener) => listener(config));
}

export function getCoreConfig(): Readonly<CoreConfig> {
  return config;
}

/** Subscribe to config changes. Returns an unsubscribe function. */
export function onCoreConfigChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
