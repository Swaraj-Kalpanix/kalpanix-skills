# mock — usage

An in-memory API for building features before the backend exists. It sits **under** the core's axios clients, so services, React Query hooks and screens run exactly the same code in mock and live mode. Switching is an env change, not a code change.

- Lives inside the core (`src/lib/core/mock/`) so the core is reusable as one folder, but is only **wired** to it: it uses the core's public API (`'..'`), and nothing else in the core imports it.
- Own entry point: `@/lib/core/mock` — not re-exported from `@/lib/core`.
- Plugs in through the core's `setHttpAdapter()` — one call, `enableMockServer()`.
- Live builds (`EXPO_PUBLIC_API_MODE=live`) drop this folder and all seed data from the bundle.

```
mock/
├── enableMockServer.ts   enableMockServer · disableMockServer · isMockServerEnabled
├── mock.config.ts        configureMockServer · getMockConfig (passthrough, latency, logging)
├── mockServer.ts         mockServer route registry · mockResponse · mockError
├── mockCollection.ts     mockCollection — a full CRUD resource in one call
├── mockQuery.ts          evaluates NestJS crud / REST list queries in memory
├── mockAdapter.ts        the axios adapter (installed by enableMockServer)
└── index.ts
```

---

## 1. Turn it on

Already wired in `src/lib/setupCore.ts`:

```ts
if (process.env.EXPO_PUBLIC_API_MODE !== 'live') {
  const { enableMockServer } = require('@/lib/core/mock') as typeof import('@/lib/core/mock');
  enableMockServer({ passthrough: env.mockPassthrough });

  require('@/features/leads/mocks');      // ← register each feature's mocks here
  require('@/features/contacts/mocks');
}
```

Keep the literal `process.env.EXPO_PUBLIC_API_MODE` check and `require` (not `import`) — that is what lets live builds remove the mocks.

| `.env.local` | Behavior |
|---|---|
| `EXPO_PUBLIC_API_MODE=mock` (default) | Every request answered by mocks; a request with no mock → 404 that names the missing route |
| `EXPO_PUBLIC_API_MODE=mock` + `EXPO_PUBLIC_MOCK_PASSTHROUGH=true` | Mocked routes answered by mocks, everything else goes to `EXPO_PUBLIC_API_BASE_URL` — switch features to the real API one at a time by deleting their mocks |
| `EXPO_PUBLIC_API_MODE=live` | Real API only; mock code not bundled |

After changing any `EXPO_PUBLIC_*` value, restart with a cleared cache: `npx expo start --clear` (and `--clear` on `expo export`) — otherwise the old value stays inlined.

Settings: `enableMockServer({ passthrough, latencyMs, logging, validation })`, changeable at runtime with `configureMockServer()` — e.g. `configureMockServer({ latencyMs: 3000 })` to test loading states on a slow network.

---

## 2. A CRUD resource — `mockCollection`

One call registers `GET /x`, `GET /x/:id`, `POST /x`, `PATCH /x/:id`, `PUT /x/:id`, `DELETE /x/:id`, backed by an in-memory array.

```ts
// src/features/leads/mocks/lead.mock.ts
import { mockCollection } from '@/lib/core/mock';
import { CreateLeadSchema, LeadSchema, UpdateLeadSchema, type Lead } from '../schemas/lead.schema';
import { leadSeed } from './lead.seed';

export const leadsMock = mockCollection<Lead>('/leads', {
  seed: leadSeed,                  // array, or a function (re-run on reset())
  schema: LeadSchema,              // seed + every stored record must match the API contract
  createSchema: CreateLeadSchema,  // invalid POST/PUT body → NestJS-style 400 with messages[]
  updateSchema: UpdateLeadSchema,  // invalid PATCH body → 400
  onCreate: (body, { id, now }) => ({ ...body, id, status: 'new', createdAt: now, updatedAt: now }) as Lead,
  onUpdate: (existing, body, { now }) => ({ ...existing, ...body, updatedAt: now }),
});
```

```ts
// src/features/leads/mocks/index.ts
import './lead.mock';
```

The list endpoint answers the **same query format as the real API**, so screens behave identically:

- `queryFormat: 'nest'` (default) — NestJS `@nestjsx/crud`: `filter`, `or`, `s` (search), `sort`, `fields`, `join`, `page`, `limit`, `offset`, with every `CondOperator` (`$eq`, `$contL`, `$in`, `$between`, `$isnull`, …). Parsed with `@dataui/crud-request`'s own parser.
- `queryFormat: 'rest'` — `?page=&limit=&search=&sort=field:asc&status=x`. Match your `RestQueryBuilder` settings:
  `mockCollection('/contacts', { queryFormat: 'rest', rest: { params: { search: 'q' }, searchFields: ['name', 'email'] } })`

Responses use the API's shapes: lists return `{ data, count, total, page, pageCount }`; errors return `{ statusCode, message, error }`; unknown ids return 404 `"<Entity> not found"`.

Other options: `idField` (default `id`), `generateId` (default: next integer for numeric ids, otherwise a random string), `entityName` (for 404 messages), `latencyMs` (per collection).

The returned collection is a handle on the data: `all()`, `find(id)`, `insert(record)`, `update(id, patch)`, `remove(id)`, `reset()`, `unregister()`.

---

## 3. Custom endpoints — `mockServer`

```ts
import { mockError, mockResponse, mockServer } from '@/lib/core/mock';
import { leadsMock } from './lead.mock';

mockServer.get('/dashboard/stats', () => ({ openLeads: leadsMock.all().filter((l) => l.status === 'new').length }));

mockServer.post('/leads/:id/convert', ({ params }) => {
  const lead = leadsMock.find(params.id);
  if (!lead) throw mockError(404, 'Lead not found');
  if (lead.status === 'won') throw mockError(409, 'Lead is already converted');
  return leadsMock.update(params.id, { status: 'won' });
});

mockServer.post('/auth/login', ({ body }) => {
  const { email, password } = body as { email: string; password: string };
  if (password !== 'password') throw mockError(401, 'Invalid email or password');
  return mockResponse(200, { accessToken: 'mock-access', refreshToken: 'mock-refresh', user: { email } });
});
```

Handlers receive `{ method, path, params, query, rawQuery, body, headers }` and may be async.
- Return data → `200` (`201` for POST)
- Return `mockResponse(status, body, headers?)` → any status
- Throw `mockError(status, message | messages[])` → NestJS-shaped error; the service rejects with `ApiError` exactly as it would against the real API
- Anything else thrown → `500`

Specific routes win over parameter routes (`/leads/stats` beats `/leads/:id`), regardless of registration order. `mockServer.list()` shows everything registered.

---

## 4. Seed data

- Put it in `src/features/<feature>/mocks/<name>.seed.ts`, typed with the entity type from the schema.
- Make it realistic: 20–50 records, varied statuses, some `null` optionals, long names, dates spread over months — enough to exercise pagination, filters, search, and empty/edge states.
- It must pass the entity schema; in development a mismatch throws at startup with the exact field (set `validation: 'warn'` in `enableMockServer` to only log).
- Responses are JSON round-tripped, so `Date` objects arrive as ISO strings — store dates as ISO strings, like the API.

---

## 5. Testing error and edge cases

```ts
mockServer.get('/leads/:id', () => { throw mockError(500, 'Database unavailable'); });   // server error
mockServer.get('/me', () => { throw mockError(401, 'Unauthorized'); });                   // exercises auth refresh / sign-out
configureMockServer({ latencyMs: 5000 });                                                 // slow network
```
A route registered later for the same method + path replaces the earlier one.

---

## 6. Going live, feature by feature

1. Set `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_MOCK_PASSTHROUGH=true`.
2. Remove the feature's `require('@/features/<feature>/mocks')` line — its requests now reach the real API; every other feature stays mocked.
3. Fix anything the core's schema validation reports (a `VALIDATION` `ApiError` names the endpoint and field).
4. When every feature is live, set `EXPO_PUBLIC_API_MODE=live`.
