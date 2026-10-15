import { configureCore } from '@/lib/core';
import { env } from '@/lib/env';

/**
 * Connects the generic core (and, in mock mode, the mock server) to this app.
 * Imported once, for its side effects, by `src/providers/AppProviders.tsx`.
 */
configureCore({
  apiBaseUrl: env.apiBaseUrl,
  requestTimeoutMs: env.requestTimeoutMs,
});

// Mock mode. The literal `process.env.EXPO_PUBLIC_API_MODE` check (not `env.apiMode`)
// lets production builds with `live` drop the mock server and all seed data;
// `require` keeps those modules out of the bundle when the branch is removed.
if (process.env.EXPO_PUBLIC_API_MODE !== 'live') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- conditional require keeps mocks out of live bundles
  const { enableMockServer } = require('@/lib/core/mock') as typeof import('@/lib/core/mock');
  enableMockServer({ passthrough: env.mockPassthrough });

  // Register feature mocks here, e.g.:
  // require('@/features/leads/mocks');
}

// Auth (custom login or Clerk — not decided yet) connects via `setAuthAdapter()`.
// Toasts connect via `setNotifier()` once a UI library is chosen.
