import { AxiosError, AxiosHeaders, CanceledError, type InternalAxiosRequestConfig } from 'axios';

import { ApiError, isApiError, toApiError } from '../api.error';

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

function httpError(status: number, data: unknown) {
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, {}, {
    status,
    statusText: '',
    data,
    headers: {},
    config,
  });
}

describe('ApiError', () => {
  it('exposes status helpers', () => {
    const e = new ApiError('x', { code: 'HTTP', status: 404 });
    expect(e.isNotFound).toBe(true);
    expect(e.isClientError).toBe(true);
    expect(e.isUnauthorized).toBe(false);
    expect(new ApiError('x', { code: 'HTTP', status: 401 }).isUnauthorized).toBe(true);
    expect(new ApiError('x', { code: 'HTTP', status: 403 }).isForbidden).toBe(true);
    expect(new ApiError('x', { code: 'HTTP', status: 500 }).isClientError).toBe(false);
    expect(new ApiError('x', { code: 'NETWORK' }).isClientError).toBe(false);
  });

  it('defaults messages to [message] and is an Error', () => {
    const e = new ApiError('Boom', { code: 'UNKNOWN' });
    expect(e.messages).toEqual(['Boom']);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ApiError');
    expect(isApiError(e)).toBe(true);
    expect(isApiError(new Error('x'))).toBe(false);
  });
});

describe('toApiError', () => {
  it('returns an ApiError untouched', () => {
    const e = new ApiError('x', { code: 'HTTP', status: 400 });
    expect(toApiError(e)).toBe(e);
  });

  it('reads a NestJS string message', () => {
    const e = toApiError(httpError(404, { statusCode: 404, message: 'Lead not found', error: 'Not Found' }));
    expect(e).toMatchObject({ code: 'HTTP', status: 404, message: 'Lead not found', messages: ['Lead not found'] });
    expect(e.data).toEqual({ statusCode: 404, message: 'Lead not found', error: 'Not Found' });
  });

  it('reads NestJS class-validator message arrays', () => {
    const e = toApiError(httpError(400, { statusCode: 400, message: ['name is required', 'email must be an email'] }));
    expect(e.message).toBe('name is required');
    expect(e.messages).toEqual(['name is required', 'email must be an email']);
  });

  it('falls back to the `error` field, then to the axios message', () => {
    expect(toApiError(httpError(500, { error: 'Internal Server Error' })).message).toBe('Internal Server Error');
    expect(toApiError(httpError(502, '')).message).toBe('Request failed');
    expect(toApiError(httpError(503, 'Service down')).message).toBe('Service down');
  });

  it('maps a missing response to NETWORK', () => {
    const e = toApiError(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config));
    expect(e.code).toBe('NETWORK');
    expect(e.status).toBeUndefined();
  });

  it.each([AxiosError.ECONNABORTED, AxiosError.ETIMEDOUT])('maps %s to TIMEOUT', (code) => {
    expect(toApiError(new AxiosError('timeout', code, config)).code).toBe('TIMEOUT');
  });

  it('maps cancellation to CANCELLED', () => {
    expect(toApiError(new CanceledError()).code).toBe('CANCELLED');
  });

  it('wraps plain errors and unknown values as UNKNOWN', () => {
    expect(toApiError(new TypeError('bad'))).toMatchObject({ code: 'UNKNOWN', message: 'bad' });
    const unknown = toApiError({ weird: true });
    expect(unknown.code).toBe('UNKNOWN');
    expect(unknown.data).toEqual({ weird: true });
    expect(unknown.message).toMatch(/something went wrong/i);
  });
});
