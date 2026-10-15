import * as z from 'zod';

import { configureCore } from '../../config/core.config';
import { ApiError } from '../../errors/api.error';
import { issuesToMessages, validateResponse } from '../validateResponse';

const LeadSchema = z.object({ id: z.number(), name: z.string(), createdAt: z.string().transform((s) => s.slice(0, 4)) });

describe('validateResponse', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
    configureCore({ responseValidation: 'strict' });
  });

  it('strict: returns parsed data (unknown keys stripped, transforms applied)', () => {
    configureCore({ responseValidation: 'strict' });
    expect(validateResponse(LeadSchema, { id: 1, name: 'A', createdAt: '2026-01-01', extra: true }, 'GET /leads/1')).toEqual({
      id: 1,
      name: 'A',
      createdAt: '2026',
    });
  });

  it('strict: throws a VALIDATION ApiError naming the endpoint and field', () => {
    configureCore({ responseValidation: 'strict' });
    let error: unknown;
    try {
      validateResponse(LeadSchema, { id: 'x', name: 'A', createdAt: '2026' }, 'GET /leads/1');
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'VALIDATION', message: 'GET /leads/1 response does not match its schema.' });
    expect((error as ApiError).messages[0]).toContain('id');
    expect(Array.isArray((error as ApiError).data)).toBe(true);
  });

  it('warn: logs and returns the raw data on mismatch, parsed data on success', () => {
    configureCore({ responseValidation: 'warn' });
    const raw = { id: 'x' };
    expect(validateResponse(LeadSchema, raw, 'GET /x')).toBe(raw);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(validateResponse(LeadSchema, { id: 1, name: 'A', createdAt: '2026-05' }, 'GET /x')).toEqual({
      id: 1,
      name: 'A',
      createdAt: '2026',
    });
  });

  it('off: returns the raw data without parsing', () => {
    configureCore({ responseValidation: 'off' });
    const raw = { anything: true };
    expect(validateResponse(LeadSchema, raw, 'GET /x')).toBe(raw);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('issuesToMessages', () => {
  it('prefixes messages with the field path', () => {
    const result = z.object({ name: z.string().min(2), address: z.object({ city: z.string() }) }).safeParse({
      name: 'A',
      address: {},
    });
    expect(result.success).toBe(false);
    const messages = issuesToMessages(result.error!);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatch(/^name: /);
    expect(messages[1]).toMatch(/^address\.city: /);
  });

  it('uses the bare message for root-level issues', () => {
    const result = z.string().safeParse(1);
    expect(issuesToMessages(result.error!)).toEqual([result.error!.issues[0].message]);
  });
});
