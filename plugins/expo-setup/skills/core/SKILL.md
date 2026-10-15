---
name: core
description: Phase 2 of the Kalpanix Expo setup — add the generic, app-agnostic data layer src/lib/core (axios clients, pluggable auth adapter for custom login or Clerk, BaseService/CrudService with zod validation, NestJS crud and REST query builders, TanStack React Query hooks with confirm-on-mutation and global toasts, debounce/navigation-guard hooks, and an in-core mock server wired only through setHttpAdapter), plus env.ts and setupCore.ts. Use when setting up a new app's data layer or copying the core into another Expo app.
---

# Phase 2 — Core data layer

Templates: `${CLAUDE_PLUGIN_ROOT}/skills/core/templates`. Ground rules: see `expo-setup:bootstrap`. Needs `.claude/expo-setup.json` and phase 1.

## What it is
`src/lib/core` is one folder shared across Kalpanix apps — copy it **as-is**, never add app code to it. Its own docs: `src/lib/core/USAGE.md` (services, hooks, auth, toasts/confirm) and `src/lib/core/mock/USAGE.md` (mock server). App wiring lives outside it: `src/lib/env.ts` (validated `EXPO_PUBLIC_*`) and `src/lib/setupCore.ts` (config + mock mode).

The mock lives in `src/lib/core/mock` but is **only wired**: nothing in the core imports it; `setupCore.ts` `require`s it behind a literal `process.env.EXPO_PUBLIC_API_MODE !== 'live'` check, so live builds drop it.

## 1. Dependencies
```bash
npx expo install axios @tanstack/react-query @dataui/crud-request zod expo-network
```
After install, confirm the majors the core is written for: **zod 4** (`import * as z from 'zod'`), **TanStack Query 5**, **axios 1**. If a new major landed, read its migration notes before continuing and fix the core in the project (and report it for `kalpanix-skills`).

## 2. Copy
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/copyTemplates.mjs" --from "${CLAUDE_PLUGIN_ROOT}/skills/core/templates" --to .
```
Writes `src/lib/core/**` (with every folder's `__tests__/` and the `test/` helpers), `src/lib/env.ts`, `src/lib/setupCore.ts`, `.env.example`, a core-only `src/providers/AppProviders.tsx`, `src/app/_layout.tsx` (wraps the Stack in `AppProviders`), PLAN-002, MEMO-002, MEMO-003.

`src/app/_layout.tsx` already exists from phase 1, so it is **skipped** — if it's still the phase-1 stub, rerun the command with `--force`, or wrap `<Stack />` in `<AppProviders>` by hand.

## 3. Env
- `cp .env.example .env.local` — mock mode is the default; `.env*.local` is gitignored.
- If `API_STYLE` is plain REST, nothing changes in the core — services pass `query: new RestQueryBuilder(...)`; note it in MEMO-002 (already templated).

## 4. Docs
- `docs/plans/README.md` → add the PLAN-002 row (done). `docs/memos/README.md` → add MEMO-002 (Core data layer: React Query, NestJS crud + REST, HTTP-level mocks, zod contracts) and MEMO-003 (Client state: Redux Toolkit).
- `docs/TODO.md` → Done: `Core data layer src/lib/core with mock/live switch — PLAN-002`. Next: `Decide auth (custom login vs Clerk) → memo, token storage, setAuthAdapter in setupCore.ts — PLAN-002` (skip if decided) and `Create the Redux Toolkit store with the first client-state slice — MEMO-003`.
- `CHANGELOG.md` → under Added:
  - `Core data layer in src/lib/core (app-agnostic): axios clients with a pluggable auth adapter and single-flight token refresh; setHttpAdapter transport hook; BaseService / CrudService with zod response validation; NestCrudQueryBuilder and RestQueryBuilder; React Query provider wired to app focus and network state, useApiQuery, useApiInfiniteList, useApiMutation (confirm gate, global toasts, invalidates), createCrudHooks, createQueryKeys; toast and confirm bridges with native fallbacks; useDebounce, useDebouncedCallback, useNavigationGuard. (PLAN-002, MEMO-002)`
  - `Mock server in src/lib/core/mock — own entry point, wired only via setHttpAdapter and excluded from live builds. (PLAN-002)`
  - `Validated env (src/lib/env.ts, .env.example): EXPO_PUBLIC_API_MODE (mock by default), EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_API_TIMEOUT_MS, EXPO_PUBLIC_MOCK_PASSTHROUGH. (PLAN-002)`
  - `Dependencies: axios, @tanstack/react-query, @dataui/crud-request, zod, expo-network. (PLAN-002)`

## 5. Verify
The core ships its tests, which need Jest types — **typecheck after phase 3** (`expo-setup:testing`). Until then, check only that `npx expo lint` passes and `grep -rn "features/" src/lib/core` finds nothing but comments.
