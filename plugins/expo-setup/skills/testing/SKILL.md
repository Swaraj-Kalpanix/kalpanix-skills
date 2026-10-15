---
name: testing
description: Phase 3 of the Kalpanix Expo setup — install and configure Jest with the jest-expo preset and React Native Testing Library, run the core data layer's shipped test suite, enforce the src/lib/core coverage floor, and record the "tests only when asked" rule. Use when setting up unit testing in a Kalpanix Expo app.
---

# Phase 3 — Testing

Templates: `${CLAUDE_PLUGIN_ROOT}/skills/testing/templates`. Ground rules: see `expo-setup:bootstrap`. Needs phase 2 (the core and its `__tests__/`).

## 1. Install (per the Expo unit-testing guide for this SDK)
Read `https://docs.expo.dev/develop/unit-testing/` (versioned for the project's SDK) first — it gives the current install command and `transformIgnorePatterns`.
```bash
npx expo install jest-expo jest @types/jest @testing-library/react-native -- --save-dev
```

## 2. Configure
`package.json`:
```json
"scripts": { "test": "jest", "test:watch": "jest --watch", "test:coverage": "jest --coverage" },
"jest": {
  "preset": "jest-expo",
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|standard-navigation|@sentry/react-native|native-base|react-native-svg)"
  ],
  "collectCoverageFrom": [
    "src/lib/core/**/*.{ts,tsx}",
    "!src/lib/core/**/index.ts",
    "!src/lib/core/**/__tests__/**",
    "!src/lib/core/test/**",
    "!src/lib/core/**/*.types.ts"
  ],
  "coverageThreshold": {
    "./src/lib/core/": { "statements": 95, "branches": 90, "functions": 95, "lines": 95 }
  }
}
```
Use the docs' current `transformIgnorePatterns` as the base and keep the extras (`@expo-google-fonts/.*`, `standard-navigation`). `tsconfig.json` → `compilerOptions.types: ["jest"]`. `.gitignore` → add `coverage/`.

## 3. Run
- `npm test` — the whole core suite must pass (Crystal CRM's setup: 28 suites / 256 tests; the count grows with the core).
- `npm run test:coverage` — must meet the floor.
- `npx tsc --noEmit` and `npx expo lint` — clean (this is the first typecheck that includes the core's tests).
- Errors: "Cannot use import statement outside a module" → add that package to `transformIgnorePatterns`. Testing Library is async from v14 (`await render`, `await renderHook`, `await act(async …)`) — the core's tests already follow this; if a newer major changed APIs, fix the tests and report it for `kalpanix-skills`.

## 4. Docs
- Set `TEST_SUMMARY` in `.claude/expo-setup.json` to e.g. `28 suites / 256 tests, 99% lines`, then copy:
  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/scripts/copyTemplates.mjs" --from "${CLAUDE_PLUGIN_ROOT}/skills/testing/templates" --to .
  ```
  (PLAN-003, MEMO-004). Add their rows to `docs/plans/README.md` and `docs/memos/README.md` (MEMO-004: Testing: Jest + jest-expo + React Native Testing Library).
- `docs/TODO.md` → Done: `Unit testing setup + full src/lib/core test suite — PLAN-003, MEMO-004`.
- `CHANGELOG.md` → Added: `Unit testing: Jest + jest-expo + React Native Testing Library (npm test, test:watch, test:coverage); the src/lib/core suite with a 95/90 coverage floor; test helpers installFakeHttp and createQueryWrapper; testing rules in AGENTS.md (tests live in each folder's __tests__/; agents write tests only when asked). (PLAN-003, MEMO-004)`
- `AGENTS.md` already holds the testing rules — agents **write tests only when the user asks**, and always run `npm test`.
