---
id: MEMO-004
title: Testing — Jest + jest-expo + React Native Testing Library
status: active
superseded_by:
date: {{DATE}}
updated: {{DATE}}
---

# MEMO-004 — Testing stack

## Context
The core data layer must be reliable before other developers build features on it, and before a UI library is chosen.

## Decision
- **Unit / hook / component tests: Jest + `jest-expo` preset + `@testing-library/react-native` (v14).** Installed with `npx expo install jest-expo jest @types/jest @testing-library/react-native -- --dev`, per the Expo unit-testing guide for the current SDK.
- Tests live in a `__tests__/` folder inside the folder of the file under test (`services/__tests__/lead.service.test.ts`), never in `src/app/`.
- Agents write tests only when the user asks for them; they always run the existing suite.
- `src/lib/core` has a coverage floor (95% statements/lines/functions, 90% branches).
- **End-to-end tests** (Maestro) come later, once real screens exist — Expo recommends E2E over snapshot tests for UI.

## Why
- `jest-expo` is Expo's official preset: it mocks native modules per platform and mirrors Metro's resolution, so tests run in Node without a device.
- React Native Testing Library is the supported way to test hooks and components; `react-test-renderer` is deprecated and does not support React 19.
- Vitest is faster but has no maintained React Native / Expo preset; native-module mocking would be ours to maintain.

## Consequences
- RNTL v14 APIs are async (`await render`, `await renderHook`, `await act(async …)`).
- `transformIgnorePatterns` must list packages that ship untranspiled ESM. Recent SDKs need `standard-navigation` (an `expo-router` dependency) added to the pattern from the Expo docs.
- `tsconfig.json` sets `"types": ["jest"]` so test globals typecheck.
