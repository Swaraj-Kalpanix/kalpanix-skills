import * as z from 'zod';

import { getCoreConfig, issuesToMessages, type Id } from '..';
import { getMockConfig } from './mock.config';
import { applyListQuery, parseNestQuery, parseRestQuery, type RestParseOptions } from './mockQuery';
import { mockError, mockResponse, mockServer, normalizePath, type MockRouteOptions } from './mockServer';

export interface MockCollectionOptions<T extends object> {
  /** Initial records. A function is re-run on `reset()`. */
  seed?: readonly T[] | (() => readonly T[]);
  /** Primary key. Default `id`. */
  idField?: Extract<keyof T, string>;
  /** Default: next integer when ids are numeric, otherwise a random string. */
  generateId?: (items: readonly T[]) => Id;
  /** Query format the list endpoint understands. Default `nest` (matches `NestCrudQueryBuilder`). */
  queryFormat?: 'nest' | 'rest';
  /** `rest` format only: search fields and param names (match your `RestQueryBuilder`). */
  rest?: RestParseOptions;
  /** Entity schema — the seed and every stored record are checked against it. */
  schema?: z.ZodType<T>;
  /** POST / PUT body schema — invalid bodies get a NestJS-style 400. */
  createSchema?: z.ZodType;
  /** PATCH body schema. */
  updateSchema?: z.ZodType;
  /** Build the stored record from a POST body. Default `{ ...body, id }`. */
  onCreate?: (body: Record<string, unknown>, ctx: { id: Id; now: string }) => T;
  /** Build the stored record from a PATCH body. Default `{ ...existing, ...body }`. */
  onUpdate?: (existing: T, body: Record<string, unknown>, ctx: { now: string }) => T;
  /** Name used in 404 messages. Default: derived from the endpoint (`/leads` → `Lead`). */
  entityName?: string;
  latencyMs?: MockRouteOptions['latencyMs'];
}

export interface MockCollection<T> {
  readonly endpoint: string;
  /** Live records (a copy). */
  all(): T[];
  find(id: Id): T | undefined;
  insert(record: T): T;
  update(id: Id, patch: Partial<T>): T | undefined;
  remove(id: Id): boolean;
  /** Restore the seed. */
  reset(): void;
  /** Remove this collection's routes from the mock server. */
  unregister(): void;
}

function entityNameFrom(endpoint: string): string {
  const last = endpoint.split('/').filter(Boolean).pop() ?? 'Record';
  const singular = last.replace(/ies$/, 'y').replace(/s$/, '');
  return singular.charAt(0).toUpperCase() + singular.slice(1).replace(/[-_](\w)/g, (_, c: string) => ` ${c}`);
}

function defaultGenerateId(items: readonly object[], idField: string): Id {
  const ids = items.map((item) => (item as Record<string, unknown>)[idField]);
  if (ids.every((id) => typeof id === 'number')) {
    return (ids as number[]).reduce((max, id) => Math.max(max, id), 0) + 1;
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function asRecord(body: unknown): Record<string, unknown> {
  if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  throw mockError(400, 'Request body must be a JSON object.');
}

function validateBody(schema: z.ZodType | undefined, body: unknown): Record<string, unknown> {
  if (!schema) return asRecord(body);
  const result = schema.safeParse(body);
  if (!result.success) throw mockError(400, issuesToMessages(result.error));
  return asRecord(result.data);
}

/**
 * A mocked CRUD resource: registers `GET /x`, `GET /x/:id`, `POST /x`,
 * `PATCH /x/:id`, `PUT /x/:id`, and `DELETE /x/:id` on the mock server, backed
 * by an in-memory array. The list endpoint honors the same query format the
 * real API uses, so filters, search, sort, and pagination behave the same.
 *
 * ```ts
 * // src/features/leads/mocks/lead-mocks.ts
 * export const leadsMock = mockCollection<Lead>('/leads', {
 *   seed: leadSeed,
 *   schema: LeadSchema,
 *   createSchema: CreateLeadSchema,
 *   onCreate: (body, { id, now }) => ({ ...body, id, status: 'new', createdAt: now }) as Lead,
 * });
 * ```
 */
export function mockCollection<T extends object>(
  endpoint: string,
  options: MockCollectionOptions<T> = {},
): MockCollection<T> {
  const path = normalizePath(endpoint);
  const idField = (options.idField ?? 'id') as string;
  const entityName = options.entityName ?? entityNameFrom(path);
  const routeOptions: MockRouteOptions = { latencyMs: options.latencyMs };

  const readSeed = () => {
    const seed = typeof options.seed === 'function' ? options.seed() : (options.seed ?? []);
    return seed.map((item) => ({ ...item }));
  };

  const checkRecord = (record: T, context: string): T => {
    const mode = getMockConfig().validation ?? getCoreConfig().responseValidation;
    if (!options.schema || mode === 'off') return record;
    const result = options.schema.safeParse(record);
    if (result.success) return record;
    const message = `[mock] ${context} for ${path} does not match its schema:\n${z.prettifyError(result.error)}`;
    if (mode === 'strict') throw new Error(message);
    console.warn(message);
    return record;
  };

  let items: T[] = readSeed().map((item, i) => checkRecord(item, `seed[${i}]`));

  const idOf = (item: T) => (item as Record<string, unknown>)[idField];
  const indexOf = (id: Id) => items.findIndex((item) => String(idOf(item)) === String(id));
  const notFound = () => mockError(404, `${entityName} not found`);

  const collection: MockCollection<T> = {
    endpoint: path,
    all: () => [...items],
    find: (id) => items[indexOf(id)],
    insert(record) {
      items = [...items, checkRecord(record, 'insert')];
      return record;
    },
    update(id, patch) {
      const index = indexOf(id);
      if (index === -1) return undefined;
      const next = checkRecord({ ...items[index], ...patch, [idField]: idOf(items[index]) } as T, 'update');
      items = items.map((item, i) => (i === index ? next : item));
      return next;
    },
    remove(id) {
      const index = indexOf(id);
      if (index === -1) return false;
      items = items.filter((_, i) => i !== index);
      return true;
    },
    reset() {
      items = readSeed();
    },
    unregister: () => unregisters.forEach((off) => off()),
  };

  const now = () => new Date().toISOString();
  const serverError = (error: unknown) =>
    mockError(500, error instanceof Error ? error.message : 'Mock handler failed');

  const unregisters = [
    mockServer.get(
      path,
      ({ query }) => {
        try {
          const parsed =
            options.queryFormat === 'rest' ? parseRestQuery(query, options.rest) : parseNestQuery(query);
          return applyListQuery(items, parsed, idField);
        } catch (error) {
          throw mockError(400, error instanceof Error ? error.message : 'Invalid query');
        }
      },
      routeOptions,
    ),

    mockServer.get(
      `${path}/:id`,
      ({ params }) => {
        const record = collection.find(params.id);
        if (!record) throw notFound();
        return record;
      },
      routeOptions,
    ),

    mockServer.post(
      path,
      ({ body }) => {
        const input = validateBody(options.createSchema, body);
        const id = options.generateId?.(items) ?? defaultGenerateId(items, idField);
        const record = options.onCreate?.(input, { id, now: now() }) ?? ({ ...input, [idField]: id } as T);
        try {
          return mockResponse(201, collection.insert(record));
        } catch (error) {
          throw serverError(error);
        }
      },
      routeOptions,
    ),

    mockServer.patch(
      `${path}/:id`,
      ({ params, body }) => {
        const existing = collection.find(params.id);
        if (!existing) throw notFound();
        const input = validateBody(options.updateSchema, body);
        const next = options.onUpdate?.(existing, input, { now: now() }) ?? ({ ...existing, ...input } as T);
        try {
          return collection.update(params.id, next);
        } catch (error) {
          throw serverError(error);
        }
      },
      routeOptions,
    ),

    mockServer.put(
      `${path}/:id`,
      ({ params, body }) => {
        const index = indexOf(params.id);
        if (index === -1) throw notFound();
        const input = validateBody(options.createSchema, body);
        try {
          // Like NestJS crud `replaceOne`: the body is written over the stored record, so
          // server-owned fields the create schema doesn't accept (status, createdAt, …) survive.
          const existing = items[index];
          const record = checkRecord({ ...existing, ...input, [idField]: idOf(existing) } as T, 'replace');
          items = items.map((item, i) => (i === index ? record : item));
          return record;
        } catch (error) {
          throw serverError(error);
        }
      },
      routeOptions,
    ),

    mockServer.delete(
      `${path}/:id`,
      ({ params }) => {
        if (!collection.remove(params.id)) throw notFound();
        return mockResponse(200);
      },
      routeOptions,
    ),
  ];

  return collection;
}
