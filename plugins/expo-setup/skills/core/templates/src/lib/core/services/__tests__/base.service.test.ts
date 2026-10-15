import * as z from 'zod';

import { configureCore } from '../../config/core.config';
import { ApiError } from '../../errors/api.error';
import { createHttpClient } from '../../http/client';
import { bodyOf, installFakeHttp, type FakeHttp } from '../../test/fakeHttp';
import { BaseService } from '../base.service';

const UserSchema = z.object({ id: z.number(), name: z.string() });

class UserService extends BaseService {
  me() {
    return this.get('/me', { schema: UserSchema });
  }
  raw() {
    return this.get<{ anything: boolean }>('/raw');
  }
  rename(name: string) {
    return this.patch('/me', { name }, { schema: UserSchema });
  }
  create(name: string) {
    return this.post('/users', { name });
  }
  replace(name: string) {
    return this.put('/me', { name });
  }
  remove() {
    return this.delete('/me');
  }
}

describe('BaseService', () => {
  let fake: FakeHttp;
  const service = new UserService();
  beforeEach(() => {
    fake = installFakeHttp();
    configureCore({ responseValidation: 'strict' });
  });
  afterEach(() => fake.restore());

  it('returns the response body', async () => {
    fake.reply(() => [200, { anything: true }]);
    await expect(service.raw()).resolves.toEqual({ anything: true });
  });

  it('sends the right method, url and body for each verb', async () => {
    fake.reply(() => [200, { id: 1, name: 'A' }]);
    await service.me();
    await service.rename('B');
    await service.create('C');
    await service.replace('D');
    await service.remove();
    expect(fake.requests.map((r) => [r.method, r.url, r.data === undefined ? undefined : bodyOf(r)])).toEqual([
      ['get', '/me', undefined],
      ['patch', '/me', { name: 'B' }],
      ['post', '/users', { name: 'C' }],
      ['put', '/me', { name: 'D' }],
      ['delete', '/me', undefined],
    ]);
  });

  it('validates with the schema and strips unknown keys', async () => {
    fake.reply(() => [200, { id: 1, name: 'A', password: 'leak' }]);
    await expect(service.me()).resolves.toEqual({ id: 1, name: 'A' });
  });

  it('throws a VALIDATION ApiError when the schema does not match', async () => {
    fake.reply(() => [200, { id: '1' }]);
    await expect(service.me()).rejects.toMatchObject({ code: 'VALIDATION', message: 'GET /me response does not match its schema.' });
  });

  it('turns HTTP errors into ApiError', async () => {
    fake.reply(() => [422, { statusCode: 422, message: ['name too short'] }]);
    const error = await service.rename('x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'HTTP', status: 422, message: 'name too short' });
  });

  it('can use another client', async () => {
    const other = createHttpClient({ baseURL: 'https://other.test', withAuth: false });
    class OtherService extends BaseService {
      constructor() {
        super(other);
      }
      ping() {
        return this.get('/ping');
      }
    }
    await new OtherService().ping();
    expect(fake.requests[0].baseURL).toBe('https://other.test');
  });
});
