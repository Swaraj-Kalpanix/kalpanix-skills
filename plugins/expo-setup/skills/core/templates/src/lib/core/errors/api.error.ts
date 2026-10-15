import { AxiosError, isAxiosError, isCancel } from 'axios';

export type ApiErrorCode =
  /** The server answered with a non-2xx status. */
  | 'HTTP'
  /** No response — offline, DNS, CORS, server down. */
  | 'NETWORK'
  | 'TIMEOUT'
  /** Request aborted (e.g. React Query cancelled it). */
  | 'CANCELLED'
  /** Response did not match the service's zod schema. */
  | 'VALIDATION'
  | 'UNKNOWN';

/** NestJS error body: `{ statusCode, message, error }` — `message` is an array for class-validator errors. */
export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

interface ApiErrorInit {
  code: ApiErrorCode;
  status?: number;
  data?: unknown;
  messages?: string[];
  cause?: unknown;
}

/**
 * The only error type services throw. Branch on `code` / `status` instead of
 * inspecting axios internals.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  /** Raw response body (or validation issues for `VALIDATION`). */
  readonly data?: unknown;
  /** Every message the server sent — `message` is the first one. */
  readonly messages: string[];

  constructor(message: string, init: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.code = init.code;
    this.status = init.status;
    this.data = init.data;
    this.messages = init.messages?.length ? init.messages : [message];
    if (init.cause !== undefined) (this as { cause?: unknown }).cause = init.cause;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  /** 4xx — retrying the same request won't help. */
  get isClientError() {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

function messagesFromBody(body: unknown): string[] {
  if (!body || typeof body !== 'object') return typeof body === 'string' && body.trim() ? [body] : [];
  const { message, error } = body as ApiErrorBody;
  if (Array.isArray(message)) return message.filter((m): m is string => typeof m === 'string' && !!m.trim());
  if (typeof message === 'string' && message.trim()) return [message];
  if (typeof error === 'string' && error.trim()) return [error];
  return [];
}

/** Convert anything thrown during a request into an `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isCancel(error)) {
    return new ApiError('Request was cancelled.', { code: 'CANCELLED', cause: error });
  }

  if (isAxiosError(error)) {
    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
      return new ApiError('The request timed out. Please try again.', { code: 'TIMEOUT', cause: error });
    }
    if (!error.response) {
      return new ApiError('Network error. Check your connection and try again.', {
        code: 'NETWORK',
        cause: error,
      });
    }
    const { status, data } = error.response;
    const messages = messagesFromBody(data);
    return new ApiError(messages[0] ?? error.message ?? FALLBACK_MESSAGE, {
      code: 'HTTP',
      status,
      data,
      messages,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new ApiError(error.message || FALLBACK_MESSAGE, { code: 'UNKNOWN', cause: error });
  }
  return new ApiError(FALLBACK_MESSAGE, { code: 'UNKNOWN', data: error });
}
