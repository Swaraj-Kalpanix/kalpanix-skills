import * as z from 'zod';

/**
 * App environment, validated at startup. Only `EXPO_PUBLIC_*` vars reach the
 * app, and Expo inlines them at build time — so they must be read with literal
 * `process.env.EXPO_PUBLIC_…` access, and never hold secrets.
 */
const EnvSchema = z
  .object({
    apiMode: z.enum(['mock', 'live']).default('mock'),
    apiBaseUrl: z.union([z.literal(''), z.url()]).default(''),
    requestTimeoutMs: z.coerce.number().int().positive().default(30_000),
    mockPassthrough: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
  })
  .refine((env) => env.apiMode === 'mock' || env.apiBaseUrl !== '', {
    message: 'EXPO_PUBLIC_API_BASE_URL is required when EXPO_PUBLIC_API_MODE=live',
    path: ['apiBaseUrl'],
  });

const emptyToUndefined = (value: string | undefined) => (value === '' ? undefined : value);

export const env = EnvSchema.parse({
  apiMode: emptyToUndefined(process.env.EXPO_PUBLIC_API_MODE),
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  requestTimeoutMs: emptyToUndefined(process.env.EXPO_PUBLIC_API_TIMEOUT_MS),
  mockPassthrough: emptyToUndefined(process.env.EXPO_PUBLIC_MOCK_PASSTHROUGH),
});
