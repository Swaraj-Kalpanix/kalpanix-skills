---
id: PLAN-002
title: Core data layer (src/lib/core)
status: done           # draft | approved | in-progress | done | dropped
modules: []
created: {{DATE}}
updated: {{DATE}}
---

# PLAN-002 — Core data layer (`src/lib/core`)

## Goal
A generic, reusable data layer so feature work can start on mock data and switch to the real API with an env change — no code changes in features.

## Context
`src/lib/core` is the shared, app-agnostic core used across Kalpanix Expo apps (copied as one folder). Decisions in MEMO-002 / MEMO-003. Backend style for this app: {{API_STYLE}}.

## Approach
- `config/` — `configureCore()`; the core never reads env itself (portable).
- `http/` — `http` / `publicHttp` axios clients; `setHttpAdapter` swaps the transport for all clients (the mock server's plug point); `setAuthAdapter` works for custom login or Clerk.
- `mock/` (own entry point `@/lib/core/mock`, wired only through `setHttpAdapter`) — route registry, axios mock adapter, `mockCollection` (CRUD + list queries evaluated in memory using `@dataui/crud-request`'s own parser); `enableMockServer()` plugs it into the core.
- `services/`, `query/`, `validation/` — `CrudService` with pluggable `NestCrudQueryBuilder` / `RestQueryBuilder`, zod response validation.
- `reactQuery/` — provider wired to `AppState` + `expo-network`, typed hooks, `createCrudHooks`.
- `feedback/` — toast and confirm bridges; native `Alert` fallback until the UI layer registers its hosts.

## Checklist
- [x] Core copied into `src/lib/core` (config, errors, http, query, services, validation, reactQuery, feedback, hooks, utils, mock, test helpers)
- [x] Dependencies: `axios`, `@tanstack/react-query`, `@dataui/crud-request`, `zod`, `expo-network`
- [x] App wiring: `src/lib/env.ts`, `src/lib/setupCore.ts`, `.env.example`
- [x] Lint + typecheck pass

## Risks & open questions
- Auth: {{AUTH}} — the adapter interface covers custom login and Clerk; token storage is decided with it.

## Log
- {{DATE}} — created and completed
