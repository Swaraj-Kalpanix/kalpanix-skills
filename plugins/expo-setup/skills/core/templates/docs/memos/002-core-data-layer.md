---
id: MEMO-002
title: Core data layer — React Query, NestJS crud + REST, HTTP-level mocks, zod contracts
status: active
superseded_by:
date: {{DATE}}
updated: {{DATE}}
---

# MEMO-002 — Core data layer

## Context
Development starts before the backend exists, possibly by other developers, on mock data. Replacing mocks with the real API later must not require rewriting features. The team reuses one app-agnostic core across its Expo apps.

## Decision
1. **Server state: TanStack React Query.** Same model as the web `_core`; built-in caching, infinite lists, offline pause/resume. Wired to `AppState` and `expo-network` for mobile.
2. **Backend format: both supported** — this app: {{API_STYLE}}. NestJS crud lists use `NestCrudQueryBuilder` (`@dataui/crud-request`). `RestQueryBuilder` is available for plain REST endpoints. Both plug into the same `CrudService`.
3. **Mocks at the HTTP layer, inside the core but only wired to it.** `src/lib/core/mock` (entry `@/lib/core/mock`) ships with the reusable core and answers requests from an in-memory mock server when `EXPO_PUBLIC_API_MODE=mock`; it plugs into the core through `setHttpAdapter`, and the core never imports it, so live builds drop it. Services, hooks, and screens are identical in mock and live. Passthrough lets features go live one at a time.
4. **zod schemas are the contract.** Services validate responses against the entity schema; mock seed data and writes are validated against the same schema. Forms reuse them.
5. **Auth is an adapter** (`setAuthAdapter`): custom login (with refresh) or Clerk (SDK refresh) — decided later without touching the core.
6. **UI is an adapter too**: toasts via `setNotifier`, confirm dialog via `useConfirmDialog` — decided with the UI library.
7. **`src/lib/core` is app-agnostic** — reusable in other Expo apps; app wiring lives in `src/lib/setupCore.ts`.

## Why
- Mocking per service (mock vs API repository classes) doubles the code and drifts; mocking under axios exercises the real service/query/error paths from day one.
- Evaluating list queries with the crud library's own parser makes mock filtering, search, sort, and pagination match the server.
- Schema validation turns "the API changed shape" into an immediate, named error instead of a crash deep in the UI.

## Consequences
- Every feature ships a `mocks/` folder with realistic seed data until its endpoint exists.
- Mock data must pass the schema in development (`responseValidation: strict`).
- Going live = set `EXPO_PUBLIC_API_MODE=live` and `EXPO_PUBLIC_API_BASE_URL`; fix any schema mismatches the validation reports.
