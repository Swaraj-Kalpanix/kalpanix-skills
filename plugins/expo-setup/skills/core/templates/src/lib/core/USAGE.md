# core — usage

App-agnostic data layer for Expo apps: HTTP, services, query builders, React Query hooks, toast and confirm bridges. It knows nothing about this app — copy `src/lib/core/` into any Expo project and configure it once. The mock server ships in `mock/` (see `mock/USAGE.md`) but is only wired to the core through `setHttpAdapter` — it has its own entry point, `@/lib/core/mock`, and is not exported from `@/lib/core`, so live builds leave it out.

**Dependencies:** `axios`, `@tanstack/react-query`, `@dataui/crud-request`, `zod`, `expo-network`, `expo-router`, `react-native`.
Install with `npx expo install axios @tanstack/react-query @dataui/crud-request zod expo-network`.

```
core/
├── config/        core.config.ts — configureCore(): base URL, timeout, validation mode
├── errors/        api.error.ts — ApiError, the only error type services throw
├── http/          client.ts (http · publicHttp · createHttpClient · setHttpAdapter) · auth.ts (setAuthAdapter)
├── query/         nestCrudQuery.builder.ts (NestJS @nestjsx/crud) · restQuery.builder.ts (plain REST)
├── services/      base.service.ts · crud.service.ts
├── validation/    validateResponse.ts — zod response validation
├── reactQuery/    CoreQueryProvider · useApiQuery · useApiInfiniteList · useApiMutation · createCrudHooks · queryKeys
├── feedback/      notifier.ts (toasts) · confirm.store.ts · useConfirmDialog (confirm dialog)
├── hooks/         useDebounce · useDebouncedCallback · useNavigationGuard
├── utils/         queryString · pagination
├── test/          test-only helpers: installFakeHttp · createQueryWrapper
├── mock/          mock server — separate entry `@/lib/core/mock` (see mock/USAGE.md)
└── index.ts       import everything (except mock) from here
```

---

## 1. Setup (once per app)

```ts
// src/lib/setupCore.ts
configureCore({
  apiBaseUrl: 'https://api.example.com/v1',
  requestTimeoutMs: 30_000,
  responseValidation: __DEV__ ? 'strict' : 'warn',   // default
});
```

```tsx
// root layout
<CoreQueryProvider>{children}</CoreQueryProvider>
```

`CoreQueryProvider` wires React Query to `AppState` (refetch when the app returns to the foreground) and `expo-network` (pause offline, refetch on reconnect).

---

## 2. Transport — real network or mock

Every client created by the core (`http`, `publicHttp`, `createHttpClient()`) uses one shared transport. By default that is the real network; `setHttpAdapter` swaps it for all of them at once:

```ts
setHttpAdapter((networkAdapter) => myAdapter);  // networkAdapter = the real one, for passthrough
setHttpAdapter(null);                           // back to the network
```

That is the only hook the mock server uses (`enableMockServer()` from `@/lib/core/mock`). Services, hooks, and screens never know which transport is active.

The API is expected to paginate lists as `{ data, count, total, page, pageCount }` and to return errors as `{ statusCode, message, error }` (NestJS). The core normalizes both into `PaginatedResponse` and `ApiError`; nothing else to handle.

---

## 3. Schemas are the contract

Define each entity once with zod. The same schema checks mock data **and** the real API, so when the backend lands, any mismatch shows up immediately instead of as a crash three screens later.

```ts
// src/features/leads/schemas/lead.schema.ts
export const LeadSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
  status: z.enum(['new', 'contacted', 'won', 'lost']),
  createdAt: z.string(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const CreateLeadSchema = LeadSchema.pick({ name: true, email: true });
export type CreateLeadDto = z.infer<typeof CreateLeadSchema>;
```

`responseValidation`: `strict` throws `ApiError` (`code: 'VALIDATION'`), `warn` logs and continues, `off` skips. Reuse the same schemas for forms.

---

## 4. Services

```ts
// src/features/leads/services/lead.service.ts
export interface LeadFilters { status?: Lead['status']; ownerIds?: number[] }

export const leadService = new CrudService<Lead, LeadFilters, CreateLeadDto>({
  endpoint: '/leads',
  schema: LeadSchema,
  query: new NestCrudQueryBuilder<LeadFilters>({
    limit: 20,
    sort: [{ field: 'createdAt', order: 'DESC' }],
    searchFields: ['name', 'email'],
    filters: (f) => [
      makeFilterIf('status', CondOperator.EQUALS, f.status),
      makeFilterIn('ownerId', f.ownerIds),
    ],
  }),
});

// list · getById · create · update (PATCH) · replace (PUT) · remove
await leadService.list({ page: 1, search: 'acme', filters: { status: 'new' } });
```

Custom endpoints — subclass:

```ts
class LeadService extends CrudService<Lead, LeadFilters, CreateLeadDto> {
  convert(id: Id) {
    return this.post(`${this.endpoint}/${id}/convert`, undefined, { schema: LeadSchema });
  }
}
export const leadService = new LeadService({ endpoint: '/leads', schema: LeadSchema });
```

Non-CRUD services extend `BaseService` (`get` / `post` / `patch` / `put` / `delete`, each accepting `{ schema }`). Pass `publicHttp` to `super()` for unauthenticated endpoints.

**Plain REST backend** — swap the builder:

```ts
new RestQueryBuilder<ContactFilters>({
  params: { search: 'q', limit: 'per_page' },   // rename params
  sort: [{ field: 'name', order: 'ASC' }],      // → sort=name:asc
  arrayFormat: 'comma',                          // status=a,b
  parseList: (raw) => ({ data: raw.items, total: raw.meta.total, … }),  // odd response shapes
});
```
(mock side: see `mock/USAGE.md` → `queryFormat: 'rest'`)

### NestJS operators

`CondOperator.EQUALS` `$eq` · `NOT_EQUALS` `$ne` · `GREATER_THAN(_EQUALS)` `$gt/$gte` · `LOWER_THAN(_EQUALS)` `$lt/$lte` · `STARTS` · `ENDS` · `CONTAINS` · `EXCLUDES` · `IN` · `NOT_IN` · `IS_NULL` · `NOT_NULL` · `BETWEEN` · case-insensitive `*_LOW` variants (`CONTAINS_LOW` is the default search) · `CONTAINS_ARRAY` · `INTERSECTS_ARRAY`.
Helpers: `makeFilter`, `makeFilterIf` (skips empty), `makeFilterIn` (skips empty arrays), `makeFilterRange` (between / ≥ / ≤).

---

## 5. React Query

The quickest path — standard hooks with cache updates wired:

```ts
// src/features/leads/queries/lead.queries.ts
export const leadKeys = createQueryKeys('leads');
export const leadQueries = createCrudHooks(leadService, leadKeys);
```

```tsx
const search = useDebounce(searchInput, 400);
const { items, total, fetchNextPage, hasNextPage, isLoading, refetch, isRefetching } =
  leadQueries.useInfiniteList({ search, filters });

<FlatList
  data={items}
  onEndReached={() => hasNextPage && fetchNextPage()}
  refreshing={isRefetching}
  onRefresh={refetch}
/>

const lead = leadQueries.useDetail(id);
const createLead = leadQueries.useCreate({ meta: { successMessage: 'Lead created' } });
const updateLead = leadQueries.useUpdate();          // mutate({ id, data })
const deleteLead = leadQueries.useRemove({
  meta: { confirm: { variant: 'destructive', title: 'Delete lead?', description: 'This cannot be undone.' } },
});
```

Anything custom — the typed wrappers (error is always `ApiError`):

```ts
useApiQuery({ queryKey: ['dashboard'], queryFn: ({ signal }) => dashboardService.stats({ signal }) });

useApiMutation({
  mutationFn: (id: Id) => leadService.convert(id),
  meta: {
    confirm: { title: 'Convert to customer?' },
    successMessage: 'Lead converted',
    invalidates: [leadKeys.lists(), ['customers']],
  },
});
```

**Mutation `meta`:** `toast` (false = silent) · `successMessage` / `errorMessage` (string or false) · `confirm` (true or options) · `invalidates` (query keys).
With `confirm`, `mutate()` and `mutateAsync()` ask first; `mutateAsync()` rejects with `ConfirmCancelledError` on cancel.
Global toast behavior: `configureFeedback({ successToasts, errorToasts, defaultSuccessMessage, defaultErrorMessage })`.

**Defaults** (`createQueryClient`): `staleTime` 60 s · `gcTime` 5 min · retry network/5xx up to 2× (never 4xx, validation, cancel) · mutations never auto-retry.

---

## 6. Toasts and confirm dialog (UI-library agnostic)

The core never renders UI. Connect whichever library the app uses:

```ts
setNotifier({ success: (m) => toast.success(m), error: (m) => toast.error(m) });
```

```tsx
// Mount once near the root
export function ConfirmDialogHost() {
  const { isOpen, isPending, options, confirm, cancel } = useConfirmDialog();
  return (
    <Dialog open={isOpen} onClose={cancel}>
      <Dialog.Title>{options?.title}</Dialog.Title>
      <Dialog.Description>{options?.description}</Dialog.Description>
      <Button onPress={cancel} disabled={isPending}>{options?.cancelLabel ?? 'Cancel'}</Button>
      <Button onPress={confirm} loading={isPending} destructive={options?.variant === 'destructive'}>
        {options?.confirmLabel ?? 'Confirm'}
      </Button>
    </Dialog>
  );
}
```

Until then: toasts log to the console in development, and confirmations use the native `Alert` (or `window.confirm` on web) — nothing hangs. Imperative use anywhere: `if (await confirm({ title: 'Discard changes?' })) router.back();`

---

## 7. Auth (custom login or Clerk)

The http layer asks an adapter for the token; it doesn't care where it comes from.

```ts
// Custom login with refresh tokens
setAuthAdapter({
  getAccessToken: () => session.accessToken,
  refreshAccessToken: async () => {
    const { data } = await publicHttp.post('/auth/refresh', { refreshToken: session.refreshToken });
    session.accessToken = data.accessToken;
    return data.accessToken;
  },
  onUnauthorized: () => signOut(),
});

// Clerk — the SDK refreshes tokens itself
setAuthAdapter({ getAccessToken: () => getToken(), onUnauthorized: () => signOut() });
```

On 401: one shared refresh for all concurrent failures → replay the requests → if still unauthorized, `onUnauthorized` fires once. `{ skipAuth: true }` on a request opts out. Test the flow in mock mode by throwing `mockError(401, 'Unauthorized')` from a mock route.

---

## 8. Errors

```ts
catch (e) {
  if (isApiError(e)) {
    e.code;      // 'HTTP' | 'NETWORK' | 'TIMEOUT' | 'CANCELLED' | 'VALIDATION' | 'UNKNOWN'
    e.status;    // HTTP status
    e.message;   // first server message
    e.messages;  // all messages (NestJS validation arrays)
    e.isNotFound; e.isUnauthorized; e.isForbidden; e.isClientError;
  }
}
```

---

## 9. Testing

The core ships with its own suite (in each folder's `__tests__/`, ≥ 95% coverage) and two helpers for testing code built on it:

```ts
import { installFakeHttp, bodyOf } from '@/lib/core/test/fakeHttp';
import { createQueryWrapper } from '@/lib/core/test/createQueryWrapper';

let fake: FakeHttp;
beforeEach(() => { fake = installFakeHttp(); });
afterEach(() => fake.restore());

it('creates a lead', async () => {
  fake.reply(() => [201, { id: 1, name: 'Acme' }]);
  const { wrapper } = createQueryWrapper();
  const { result } = await renderHook(() => leadQueries.useCreate(), { wrapper });
  await act(async () => { await result.current.mutateAsync({ name: 'Acme' }); });
  expect(fake.requests[0]).toMatchObject({ method: 'post', url: '/leads' });
  expect(bodyOf(fake.requests[0])).toEqual({ name: 'Acme' });
});
```

To test against a feature's mock API instead: `enableMockServer({ latencyMs: 0, logging: false })`, register the feature's mocks, and `mockServer.reset()` / `disableMockServer()` afterwards. The helpers in `test/` are test-only — never import them from app code.

---

## New feature checklist

```
□ schemas/lead.schema.ts     zod entity + create/update schemas (the API contract)
□ services/lead.service.ts   CrudService (or BaseService) — endpoint + query builder
□ queries/lead.queries.ts    createQueryKeys + createCrudHooks (or custom useApiQuery/useApiMutation)
□ mocks/lead.mock.ts         mockCollection + lead.seed.ts; register in src/lib/setupCore.ts (see src/lib/core/mock/USAGE.md)
□ screens/LeadListScreen.tsx use the hooks; handle loading / error / empty states
□ __tests__/*.test.ts(x)     only when tests are requested — in each folder's __tests__/
```
