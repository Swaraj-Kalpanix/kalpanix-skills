import * as z from 'zod';

import { configureCore } from '../../config/core.config';
import { http } from '../../http/client';
import { CondOperator, NestCrudQueryBuilder, makeFilterIf } from '../../query/nestCrudQuery.builder';
import { RestQueryBuilder } from '../../query/restQuery.builder';
import { CrudService } from '../../services/crud.service';
import { disableMockServer, enableMockServer } from '../enableMockServer';
import { configureMockServer } from '../mock.config';
import { mockCollection } from '../mockCollection';
import { mockServer } from '../mockServer';

const LeadSchema = z.object({ id: z.number(), name: z.string(), email: z.email(), status: z.enum(['new', 'won']), createdAt: z.string() });
type Lead = z.infer<typeof LeadSchema>;
const CreateLeadSchema = z.object({ name: z.string().min(2), email: z.email() });
const UpdateLeadSchema = CreateLeadSchema.partial().extend({ status: z.enum(['new', 'won']).optional() });

const seed = (): Lead[] => [
  { id: 1, name: 'Acme', email: 'a@acme.com', status: 'new', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 2, name: 'Beta', email: 'b@beta.com', status: 'won', createdAt: '2026-02-01T00:00:00.000Z' },
  { id: 3, name: 'Gamma', email: 'g@gamma.com', status: 'new', createdAt: '2026-03-01T00:00:00.000Z' },
];

const leadService = new CrudService<Lead, { status?: Lead['status'] }, z.infer<typeof CreateLeadSchema>, z.infer<typeof UpdateLeadSchema>>({
  endpoint: '/leads',
  schema: LeadSchema,
  query: new NestCrudQueryBuilder({
    limit: 2,
    sort: [{ field: 'id', order: 'ASC' }],
    searchFields: ['name'],
    filters: (f) => [makeFilterIf('status', CondOperator.EQUALS, f.status)],
  }),
});

describe('mockCollection (through the real service + http stack)', () => {
  beforeAll(() => {
    configureCore({ apiBaseUrl: 'https://api.test/v1', responseValidation: 'strict' });
    enableMockServer({ latencyMs: 0, logging: false });
  });
  afterAll(() => disableMockServer());
  afterEach(() => mockServer.reset());

  const register = () =>
    mockCollection<Lead>('/leads', {
      seed,
      schema: LeadSchema,
      createSchema: CreateLeadSchema,
      updateSchema: UpdateLeadSchema,
      onCreate: (body, { id, now }) => ({ ...(body as Pick<Lead, 'name' | 'email'>), id: id as number, status: 'new', createdAt: now }),
    });

  it('lists with pagination, filters and search', async () => {
    register();
    await expect(leadService.list()).resolves.toMatchObject({ total: 3, pageCount: 2, page: 1, count: 2 });
    expect((await leadService.list({ page: 2 })).data.map((l) => l.id)).toEqual([3]);
    expect((await leadService.list({ filters: { status: 'new' } })).data.map((l) => l.id)).toEqual([1, 3]);
    expect((await leadService.list({ search: 'bet' })).data.map((l) => l.id)).toEqual([2]);
  });

  it('gets by id and returns a NestJS 404 for unknown ids', async () => {
    register();
    await expect(leadService.getById(2)).resolves.toMatchObject({ name: 'Beta' });
    await expect(leadService.getById(99)).rejects.toMatchObject({ code: 'HTTP', status: 404, message: 'Lead not found' });
  });

  it('creates with validation, generated id and onCreate defaults', async () => {
    const leads = register();
    await expect(leadService.create({ name: 'A', email: 'nope' })).rejects.toMatchObject({ status: 400, messages: [expect.stringMatching(/^name:/), expect.stringMatching(/^email:/)] });

    const created = await leadService.create({ name: 'Delta', email: 'd@delta.com' });
    expect(created).toMatchObject({ id: 4, name: 'Delta', status: 'new' });
    expect(Date.parse(created.createdAt)).not.toBeNaN();
    expect(leads.all()).toHaveLength(4);
  });

  it('updates (PATCH merges), replaces (PUT keeps the id) and deletes', async () => {
    const leads = register();
    await expect(leadService.update(1, { status: 'won' })).resolves.toMatchObject({ id: 1, name: 'Acme', status: 'won' });
    await expect(leadService.update(1, { email: 'bad' } as never)).rejects.toMatchObject({ status: 400 });

    // PUT is validated with createSchema (which strips status/createdAt) and keeps server-owned fields.
    const replaced = await http.put('/leads/2', { id: 999, name: 'Beta 2', email: 'b2@beta.com', status: 'new' });
    expect(replaced.data).toEqual({ id: 2, name: 'Beta 2', email: 'b2@beta.com', status: 'won', createdAt: '2026-02-01T00:00:00.000Z' });
    await expect(http.put('/leads/2', { name: 'B' })).rejects.toMatchObject({ response: { status: 400 } });

    await leadService.remove(3);
    expect(leads.find(3)).toBeUndefined();
    await expect(leadService.remove(3)).rejects.toMatchObject({ status: 404 });
    await expect(leadService.update(99, { status: 'won' })).rejects.toMatchObject({ status: 404 });
    await expect(http.put('/leads/99', { name: 'x', email: 'x@x.io' })).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('rejects non-object bodies', async () => {
    mockCollection('/things');
    await expect(http.post('/things', JSON.stringify('text'))).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('returns 500 when a write breaks the entity schema', async () => {
    mockCollection<Lead>('/leads', { seed, schema: LeadSchema });
    await expect(http.patch('/leads/1', { status: 'lost' })).rejects.toMatchObject({ response: { status: 500 } });
  });

  it('returns 400 for an invalid query', async () => {
    register();
    await expect(http.get('/leads?filter=status||$nope||x')).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('exposes a data handle: find / insert / update / remove / reset / unregister', () => {
    const leads = register();
    leads.insert({ id: 10, name: 'X', email: 'x@x.io', status: 'new', createdAt: 'now' });
    expect(leads.find('10')?.name).toBe('X');
    expect(leads.update(10, { name: 'Y' })?.name).toBe('Y');
    expect(leads.update(99, { name: 'Y' })).toBeUndefined();
    expect(leads.remove(10)).toBe(true);
    expect(leads.remove(10)).toBe(false);
    leads.update(1, { name: 'Changed' });
    leads.reset();
    expect(leads.find(1)?.name).toBe('Acme');
    leads.unregister();
    expect(mockServer.list()).toEqual([]);
  });

  it('all() returns a copy', () => {
    const leads = register();
    leads.all().pop();
    expect(leads.all()).toHaveLength(3);
  });

  it('strict validation throws on a bad seed; warn only logs', () => {
    const bad = [{ id: 'x' }] as unknown as Lead[];
    expect(() => mockCollection('/bad', { seed: bad, schema: LeadSchema })).toThrow(/seed\[0\] for \/bad does not match its schema/);

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    configureMockServer({ validation: 'warn' });
    expect(() => mockCollection('/bad', { seed: bad, schema: LeadSchema })).not.toThrow();
    expect(warn).toHaveBeenCalled();
    configureMockServer({ validation: undefined });
    warn.mockRestore();
  });

  it('generates string ids when existing ids are strings, and supports custom idField / generateId / entityName', async () => {
    mockCollection<{ key: string; name: string }>('/tags', { idField: 'key', seed: [{ key: 'a', name: 'A' }], entityName: 'Tag' });
    const created = await http.post('/tags', { name: 'B' });
    expect(typeof created.data.key).toBe('string');
    await expect(http.get('/tags/zzz')).rejects.toMatchObject({ response: { data: { message: 'Tag not found' } } });

    mockCollection('/items', { generateId: () => 'fixed' });
    expect((await http.post('/items', { a: 1 })).data).toEqual({ a: 1, id: 'fixed' });
  });

  it('derives entity names for 404s from the endpoint', async () => {
    mockCollection('/follow_ups');
    mockCollection('/companies');
    await expect(http.get('/follow_ups/1')).rejects.toMatchObject({ response: { data: { message: 'Follow up not found' } } });
    await expect(http.get('/companies/1')).rejects.toMatchObject({ response: { data: { message: 'Company not found' } } });
  });

  it('serves REST-format lists', async () => {
    mockCollection('/contacts', {
      queryFormat: 'rest',
      rest: { params: { search: 'q' }, searchFields: ['name'] },
      seed: [
        { id: 1, name: 'Zed', city: 'Pune' },
        { id: 2, name: 'Amy', city: 'Mumbai' },
        { id: 3, name: 'Bob', city: 'Pune' },
      ],
    });
    const contacts = new CrudService<{ id: number; name: string; city: string }>({
      endpoint: '/contacts',
      query: new RestQueryBuilder({ params: { search: 'q' }, sort: [{ field: 'name', order: 'ASC' }] }),
    });
    expect((await contacts.list({ filters: { city: 'Pune' } })).data.map((c) => c.name)).toEqual(['Bob', 'Zed']);
    expect((await contacts.list({ search: 'am' })).data.map((c) => c.name)).toEqual(['Amy']);
  });
});
