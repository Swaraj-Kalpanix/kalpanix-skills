---
id: PLAN-003
title: Unit testing setup + core test suite
status: done           # draft | approved | in-progress | done | dropped
modules: []
created: {{DATE}}
updated: {{DATE}}
---

# PLAN-003 — Unit testing setup + core test suite

## Goal
Every part of `src/lib/core` is covered by fast unit tests, so changes to the core can't silently break features.

## Approach
- Jest + `jest-expo` + React Native Testing Library (MEMO-004); config in `package.json`.
- Test helpers in `src/lib/core/test/`: `installFakeHttp` (scripted transport via `setHttpAdapter`) and `createQueryWrapper` (QueryClient without retries/GC timers).
- Tests in each folder's `__tests__/` (shipped with the core).

## Checklist
- [x] Install and configure Jest (`jest-expo`, `transformIgnorePatterns`, `types: ["jest"]`)
- [x] Core suite passing ({{TEST_SUMMARY}})
- [x] Coverage floor enforced for `src/lib/core` (95/90/95/95)
- [x] AGENTS.md testing rules (tests only when asked)

## Log
- {{DATE}} — created and completed
