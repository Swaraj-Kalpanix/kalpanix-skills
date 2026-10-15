import { RequestQueryParser } from '@dataui/crud-request';
import * as z from 'zod';

import { configureCore } from '../../config/core.config';
import { CondOperator, NestCrudQueryBuilder, makeFilterIf } from '../../query/nestCrudQuery.builder';
import { RestQueryBuilder } from '../../query/restQuery.builder';
import { bodyOf, installFakeHttp, type FakeHttp } from '../../test/fakeHttp';
import { parseQueryString } from '../../utils/queryString';
import { CrudService } from '../crud.service';

const LeadSchema = z.object({ id: z.number(), name: z.string(), status: z.enum(['new', 'won']) });
type Lead = z.infer<typeof LeadSchema>;

const page = (data: unknown[], extra: object = {}) => ({ data, count: data.length, total: data.length, page: 1, pageCount: 1, ...extra });

function queryOf(url: string | undefined) {
  const q = url?.split('?')[1] ?? '';
  return RequestQueryParser.create().parseQuery(parseQueryString(q)).getParsed();
}

describe('CrudService', () => {
  let fake: FakeHttp;
  const leads = new CrudService<Lead, { status?: Lead['status'] }, Omit<Lead, 'id'>>({
    endpoint: '/leads/',
    schema: LeadSchema,
    query: new NestCrudQueryBuilder({
      limit: 10,
      searchFields: ['name'],
      filters: (f) => [makeFilterIf('status', CondOperator.EQUALS, f.status)],
    }),
  });

  beforeEach(() => {
    fake = installFakeHttp();
    configureCore({ responseValidation: 'strict' });
  });
  afterEach(() => fake.restore());

  it('trims a trailing slash from the endpoint', () => {
    expect(leads.endpoint).toBe('/leads');
  });

  it('list: builds the query and returns a validated page', async () => {
    fake.reply(() => [200, page([{ id: 1, name: 'A', status: 'new', extra: 1 }], { total: 31, pageCount: 4 })]);
    const result = await leads.list({ page: 2, search: 'a', filters: { status: 'new' } });

    const request = fake.requests[0];
    expect(request.method).toBe('get');
    expect(request.url?.startsWith('/leads?')).toBe(true);
    expect(queryOf(request.url)).toMatchObject({ page: 2, limit: 10 });
    expect(result.data).toEqual([{ id: 1, name: 'A', status: 'new' }]);
    expect(result.total).toBe(31);
  });

  it('list: works with an empty params object and a plain REST builder', async () => {
    const contacts = new CrudService<{ id: string }>({ endpoint: '/contacts', query: new RestQueryBuilder() });
    fake.reply(() => [200, page([{ id: 'a' }])]);
    await contacts.list();
    expect(fake.requests[0].url).toBe('/contacts?page=1&limit=20');
  });

  it('list: throws VALIDATION when an item breaks the schema', async () => {
    fake.reply(() => [200, page([{ id: 1, name: 'A', status: 'lost' }])]);
    await expect(leads.list()).rejects.toMatchObject({ code: 'VALIDATION', message: 'GET /leads response does not match its schema.' });
  });

  it('list: throws VALIDATION when the body is not a list', async () => {
    fake.reply(() => [200, { unexpected: true }]);
    await expect(leads.list()).rejects.toMatchObject({ code: 'VALIDATION', data: { unexpected: true } });
  });

  it('list: passes the abort signal through', async () => {
    const controller = new AbortController();
    fake.reply(() => [200, page([])]);
    await leads.list({}, { signal: controller.signal });
    expect(fake.requests[0].signal).toBe(controller.signal);
  });

  it('getById / create / update / replace / remove hit the right endpoints', async () => {
    fake.reply(() => [200, { id: 7, name: 'A', status: 'won' }]);
    await leads.getById(7);
    await leads.create({ name: 'A', status: 'new' });
    await leads.update(7, { status: 'won' });
    await leads.replace(7, { name: 'A', status: 'won' });
    fake.reply(() => [200, '']);
    await leads.remove(7);

    expect(fake.requests.map((r) => [r.method, r.url, r.data === undefined ? undefined : bodyOf(r)])).toEqual([
      ['get', '/leads/7', undefined],
      ['post', '/leads', { name: 'A', status: 'new' }],
      ['patch', '/leads/7', { status: 'won' }],
      ['put', '/leads/7', { name: 'A', status: 'won' }],
      ['delete', '/leads/7', undefined],
    ]);
  });

  it('encodes ids in the URL', async () => {
    fake.reply(() => [200, { id: 1, name: 'A', status: 'new' }]);
    await leads.getById('a/b c');
    expect(fake.requests[0].url).toBe('/leads/a%2Fb%20c');
  });

  it('validates single-record responses', async () => {
    fake.reply(() => [200, { id: 'nope' }]);
    await expect(leads.getById(1)).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(leads.create({ name: 'A', status: 'new' })).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('works without a schema', async () => {
    const plain = new CrudService<{ id: number; anything: string }>({ endpoint: '/things' });
    fake.reply(() => [200, page([{ id: 1, anything: 'x', extra: true }])]);
    await expect(plain.list()).resolves.toMatchObject({ data: [{ id: 1, anything: 'x', extra: true }] });
  });

  it('surfaces API errors as ApiError', async () => {
    fake.reply(() => [404, { statusCode: 404, message: 'Lead not found' }]);
    await expect(leads.getById(99)).rejects.toMatchObject({ code: 'HTTP', status: 404, message: 'Lead not found' });
  });

  it('subclasses can add endpoint-specific methods', async () => {
    class LeadService extends CrudService<Lead> {
      convert(id: number) {
        return this.post(`${this.endpoint}/${id}/convert`, undefined, { schema: LeadSchema });
      }
    }
    fake.reply(() => [200, { id: 3, name: 'A', status: 'won' }]);
    await expect(new LeadService({ endpoint: '/leads' }).convert(3)).resolves.toEqual({ id: 3, name: 'A', status: 'won' });
    expect(fake.requests[0].url).toBe('/leads/3/convert');
  });
});
