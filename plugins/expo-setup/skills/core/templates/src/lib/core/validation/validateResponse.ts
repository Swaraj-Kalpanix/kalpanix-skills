import * as z from 'zod';

import { getCoreConfig } from '../config/core.config';
import { ApiError } from '../errors/api.error';

/**
 * Check `data` against `schema` according to `responseValidation`:
 *   strict — return the parsed data, or throw `ApiError` (`VALIDATION`) on mismatch
 *   warn   — return the parsed data, or log and return the raw data on mismatch
 *   off    — return the raw data untouched (schemas must then have no transforms)
 *
 * The schema is the contract between the app and the API: mock data and the
 * real API are checked against the same schema, so swapping one for the other
 * surfaces any mismatch immediately.
 */
export function validateResponse<T>(schema: z.ZodType<T>, data: unknown, context: string): T {
  const { responseValidation } = getCoreConfig();
  if (responseValidation === 'off') return data as T;

  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const details = z.prettifyError(result.error);
  if (responseValidation === 'warn') {
    console.warn(`[core] ${context} response does not match its schema:\n${details}`);
    return data as T;
  }
  throw new ApiError(`${context} response does not match its schema.`, {
    code: 'VALIDATION',
    data: result.error.issues,
    messages: [details],
  });
}

/** Zod issues → NestJS class-validator style messages (`"email: Invalid email"`). */
export function issuesToMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message));
}
