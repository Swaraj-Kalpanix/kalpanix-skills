---
id: MEMO-003
title: Client state — Redux Toolkit
status: active
superseded_by:
date: {{DATE}}
updated: {{DATE}}
---

# MEMO-003 — Client state: Redux Toolkit

## Context
The app needs a home for client-only state (session, preferences, UI state, drafts). Server data already lives in React Query (MEMO-002).

## Decision
Use **Redux Toolkit** (+ `react-redux`) for client state, with zod for validation. Server data is never copied into Redux.

The store is created together with the first real slice (most likely auth/session), not as an empty placeholder: `npx expo install @reduxjs/toolkit react-redux`, then `src/store/` with `configureStore`, typed `useAppDispatch` / `useAppSelector` (`.withTypes<>()`), and the `Provider` added to `src/providers/AppProviders.tsx`.

## Why
- Matches the team's web stack and conventions.
- Clear separation: React Query = server state, Redux = client state.

## Consequences
- Persisting slices (e.g. session) needs a storage choice — decide with auth (secure storage for tokens).
