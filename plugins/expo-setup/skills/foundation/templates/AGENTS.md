# Agent Instructions — {{APP_NAME}}

These are the rules for any AI coding agent (Claude Code, Codex, Cursor, …) working in this repo.
What the app *is* lives in `CLAUDE.md`; what changed lives in `CHANGELOG.md`; plans and feature specs live in `docs/`.

## Platform — iOS and Android only

This is an Expo/React Native **mobile app**. Prioritize mobile patterns, performance, and iOS/Android parity.

- **Never run or verify on web** (`expo start --web`, `expo export --platform web`, browser previews). Verify with typecheck, lint, tests, and an Android bundle: `npx expo export --platform android --output-dir <tmp dir>`. Real verification happens in the development build on a device or emulator.
- Don't add web-specific code or `.web.tsx` files.
- The app needs a **development build** (native modules such as react-native-keyboard-controller are not in Expo Go): `npx expo start --dev-client`.

## Workflow — docs first, code second

Every non-trivial change follows this loop:

1. **Read context.** Check `docs/TODO.md`, the relevant module doc in `docs/modules/`, and any open plan in `docs/plans/`.
2. **Plan.** For a new feature or a change touching more than a couple of files, create or update a plan in `docs/plans/` (copy `_template.md`) and set `status: draft`. Get the user's approval before building — then set `status: in-progress`.
3. **Build.** Implement against the plan. If the plan turns out wrong, update the plan — don't silently diverge.
4. **Wrap up.** Before declaring done:
   - `npx expo lint`, `npx tsc --noEmit`, and `npm test` pass.
   - `CHANGELOG.md` has an entry under `## [Unreleased]`.
   - The plan's status and checklist are updated; the module doc reflects the new behavior.
   - `docs/TODO.md` items are ticked or added.
   - Any decision worth remembering (library choice, trade-off, "we tried X, it failed") gets a memo in `docs/memos/`.

Project skills in `.claude/skills/` automate these steps: `plan-feature`, `new-module`, `wrap-up`.

## Doc rules

- Every doc in `docs/plans/`, `docs/memos/`, and `docs/modules/` starts with YAML frontmatter including `status` and `updated` (YYYY-MM-DD). Keep them accurate.
- When you create, rename, or change the status of a doc, update the index table in that folder's `README.md`.
- IDs are sequential and never reused: plans `PLAN-001`, memos `MEMO-001`. File names: `NNN-short-slug.md`.
- Never delete a plan or memo — set `status: dropped` / `superseded` instead.

## Folder structure — MUST follow

The app is organized **by feature**. Every feature owns all of its code in `src/features/<feature>/`; anything used by two or more features goes in the shared root folders.

**Create folders only when you add the first file that belongs in them.** Never scaffold empty folders, `.gitkeep` files, or placeholder `index.ts` files ahead of time. The structure below is the target layout, not a checklist to generate.

```
src/
├── app/                      # Expo Router routes ONLY — thin files that render a feature screen
├── features/
│   └── <feature>/            # e.g. leads, contacts, followUps — same name as docs/modules/<feature>.md
│       ├── screens/          # LeadListScreen.tsx — full screens (rendered by src/app routes)
│       ├── components/       # LeadCard.tsx — UI used only by this feature
│       ├── hooks/            # useLeadFilters.ts — hooks used only by this feature
│       ├── services/         # lead.service.ts — CrudService / BaseService for this feature's endpoints
│       ├── queries/          # lead.queries.ts — query keys + React Query hooks
│       ├── schemas/          # lead.schema.ts — zod schemas: the API contract, reused by forms
│       ├── mocks/            # lead.mock.ts + lead.seed.ts + index.ts (loaded only in mock mode)
│       ├── types/            # lead.types.ts — types not derived from a schema
│       ├── store/            # lead.slice.ts — feature-local Redux state, only if needed
│       ├── utils/            # lead.utils.ts — pure helpers used only by this feature
│       ├── lead.constants.ts # feature constants
│       └── index.ts          # public API — the ONLY file other code may import from
├── lib/
│   ├── core/                 # generic data layer (http, services, query builders, React Query,
│   │   │                     #   toast/confirm bridges) — app-agnostic, see src/lib/core/USAGE.md
│   │   └── mock/             # mock server — own entry point `@/lib/core/mock`, plugged in via setHttpAdapter;
│   │                         #   the rest of core never imports it — see src/lib/core/mock/USAGE.md
│   ├── env.ts                # validated EXPO_PUBLIC_* env
│   └── setupCore.ts          # wires core to this app (config, mock server + feature mocks, auth adapter, notifier)
├── theme/                    # tamagui.config.ts (tokens, themes, animations) · fonts.ts
├── components/               # shared UI across features
│   ├── ui/                   # design-system primitives built with Tamagui styled()
│   └── feedback/             # AppToast, ConfirmDialogHost (wired to the core)
├── hooks/                    # shared hooks
├── services/                 # shared app services used by several features (e.g. uploads)
├── queries/                  # cross-feature query helpers
├── schemas/                  # shared validation schemas (phone, email, pagination, …)
├── types/                    # shared/global types (API envelope, User, …)
├── store/                    # Redux Toolkit store + global slices (created with the first slice)
├── providers/                # app-wide providers — AppProviders.tsx is mounted in src/app/_layout.tsx
├── utils/                    # shared pure helpers (formatting, dates, currency)
└── constants/                # theme tokens, app config, shared constants
```

Placement rules:

- **Start local, promote when shared.** New code goes inside its feature. Move it to the shared root only when a second feature actually needs it — not "in case".
- **Routes stay thin.** A file in `src/app/` only wires a route to a screen, e.g. `export { default } from '@/features/leads/screens/LeadListScreen';`. No data fetching, business logic, or styling there.
- **Dependency direction:** `app → features → shared`. Shared folders never import from `features/`. A feature never imports another feature's internals — only from `@/features/<other>/index.ts`. If two features need the same thing, move it to shared.
- **Services vs queries:** `services/` talk to the API (no React). `queries/` wrap services in hooks for screens and components.
- **Validation lives in `schemas/`** (zod) and is reused by forms, services, and mocks. Derive TypeScript types with `z.infer` — don't hand-write entity types that a schema already defines.
- One feature in `src/features/` ↔ one doc in `docs/modules/`, same name.

## Naming conventions — MUST follow

**No hyphenated (kebab-case) file names in `src/`.** The only exception is route files in `src/app/`, whose names are URL paths (Expo Router).

| What | Convention | Examples |
|---|---|---|
| Components, screens, providers — any `.tsx` exporting a component | **PascalCase**, file name = component name | `LeadCard.tsx`, `LeadListScreen.tsx`, `AppProviders.tsx` |
| Hooks | **camelCase with `use` prefix**, file name = hook name, one hook per file | `useLeads.ts`, `useMyHook.ts` |
| Services | `<name>.service.ts` | `lead.service.ts`, `base.service.ts` |
| Zod schemas | `<name>.schema.ts` | `lead.schema.ts` |
| Types | `<name>.types.ts` | `lead.types.ts`, `api.types.ts` |
| React Query keys + hooks | `<name>.queries.ts` | `lead.queries.ts` |
| Mocks / seed data | `<name>.mock.ts` / `<name>.seed.ts` | `lead.mock.ts`, `lead.seed.ts` |
| Redux | `<name>.slice.ts`, `<name>.store.ts` | `session.slice.ts` |
| Config / constants / utils / builders | `<name>.config.ts` / `.constants.ts` / `.utils.ts` / `.builder.ts` | `core.config.ts`, `lead.constants.ts` |
| Any other module (functions, helpers) | **camelCase**, named after its main export | `queryString.ts`, `createCrudHooks.ts` |
| Folders | lowercase; camelCase when multi-word | `features/leads/`, `features/followUps/` |
| Tests (only when asked) | in the folder's `__tests__/`, same name + `.test` | `services/__tests__/lead.service.test.ts`, `components/__tests__/LeadCard.test.tsx` |
| Route files (`src/app/` only) | lowercase URL segments; `[param]`, `(group)`, `_layout` | `leads/[id].tsx`, `follow-ups.tsx` |

`<name>` is camelCase when it has several words: `leadNote.service.ts`, `leadNote.schema.ts`.

In code:
- Components, classes, types, interfaces: **PascalCase** — `LeadCard`, `LeadService`, `Lead`, `LeadFilters`.
- Functions, hooks, variables, service instances: **camelCase** — `formatPhone`, `useLeads`, `leadService`.
- Zod schemas: PascalCase + `Schema` — `LeadSchema`, `CreateLeadSchema`; inferred types drop the suffix — `type Lead = z.infer<typeof LeadSchema>`.
- True constants: **UPPER_SNAKE_CASE** — `MAX_UPLOAD_MB`.
- One component per file; its `Props` interface is `<Component>Props` in the same file.

## UI — Tamagui + mobile building blocks

Read the project skills before writing UI: **`.claude/skills/tamagui`** (styles, tokens, themes, animations, components) and **`.claude/skills/mobile-ui`** (bottom sheets, keyboard, FlashList, forms, icons, blur, lodash). The short version:

- **Tamagui v2 + `@tamagui/config/v5`.** Shorthand-only styles (`p`, `bg`, `items`, `rounded`, …); tokens (`$4`, `$background`, `$color11`) — never hex colors or raw spacing. Animations use the `transition` prop.
- **Fonts:** Inter (body) and Sora (headings) via the Tamagui config — never set font families in components.
- **Bottom sheets:** `@gorhom/bottom-sheet` (`BottomSheetModal`); inputs inside sheets use `BottomSheetTextInput`.
- **Keyboard:** `react-native-keyboard-controller` (`KeyboardAwareScrollView`, `KeyboardStickyView`, `KeyboardToolbar`) — never React Native's `KeyboardAvoidingView`.
- **Lists:** `@shopify/flash-list` v2 for every record list (no `estimatedItemSize`).
- **Forms:** react-hook-form + `zodResolver` with the feature's zod schemas.
- **Icons:** `lucide-react-native`, colored from the theme. **Blur:** `expo-blur` with `BlurTargetView` on Android.
- **Toasts / confirmations:** through the core (`notify`, mutation `meta`, `confirm()`) — never mount another ToastProvider or build ad-hoc confirm dialogs.
- All providers are mounted once in `src/providers/AppProviders.tsx` — never add them in screens.

## Data layer — use `@/lib/core`

Follow `src/lib/core/USAGE.md` and `src/lib/core/mock/USAGE.md`. The short version:

- **Never import axios or call `fetch` in features.** Services extend `CrudService` / `BaseService` from `@/lib/core`; they throw only `ApiError`.
- **Every service passes its zod `schema`** so responses (mock and live) are validated against the contract.
- **Server data lives in React Query**, via `createCrudHooks` or `useApiQuery` / `useApiInfiniteList` / `useApiMutation` — never copied into Redux. Query keys come from `createQueryKeys('<feature>')`.
- **Client-only state** (session, UI preferences, drafts) goes in Redux Toolkit (`src/store/`, created with the first slice).
- **Mocks first.** Until an endpoint exists, write `src/features/<feature>/mocks/` with `mockCollection` + realistic seed data that passes the schema, and register it in `src/lib/setupCore.ts` inside the mock-mode block (see `src/lib/core/mock/USAGE.md`). The app runs on mocks by default (`EXPO_PUBLIC_API_MODE=mock`); going live is an env change, not a code change.
- **Mutations:** destructive actions use `meta.confirm`; rely on the global toasts (`meta.successMessage` to customize) instead of calling toasts by hand.
- **`src/lib/core/` stays app-agnostic** — no imports from features, no app-specific code; the whole folder (mock included) is copied as-is into other apps. If it needs a change, keep it generic, update its USAGE.md, and note it in the changelog.
- **The mock is only wired to the core, never part of it:** nothing in `src/lib/core` outside `mock/` imports from `mock/`, and `@/lib/core` does not re-export it. `mock/` imports only the core's public API (`'..'`). App code imports mocks from `@/lib/core/mock`, and only inside the mock-mode block and feature `mocks/` folders — this keeps mock code out of live builds.
- Lists on mobile use `useInfiniteList` + `FlatList`, with loading, error, empty, and pull-to-refresh states.

## Code conventions

- TypeScript strict. No `any` without a comment explaining why.
- Import via the `@/` alias (`@/components/...`, `@/features/leads`), not long relative paths. Relative imports are fine *inside* a feature folder.
- Never hard-code colors, spacing, radii, or font sizes — use Tamagui tokens and theme values.
- React Compiler is enabled — don't add `useMemo` / `useCallback` / `React.memo` by reflex.
- Platform-specific files use the `.ios.tsx` / `.android.tsx` suffix pattern (`LeadCard.ios.tsx`).
- Never commit secrets. Local env goes in `.env.local` (gitignored); only `EXPO_PUBLIC_*` vars reach the client, so never put secrets in them.

## Testing — MUST follow

Stack: **Jest + `jest-expo` preset + React Native Testing Library** (MEMO-004). Config lives in `package.json` → `jest`.

> ⚠️ **Write or change tests ONLY when the user explicitly asks for tests.** Don't add test files, test cases, or test helpers on your own initiative as part of a feature or fix.
> You still **run** the existing suite (`npm test`) before declaring any task done. If your change makes an existing test fail, stop and tell the user which test broke and why — don't silently rewrite or delete the test to make it pass; ask whether the behavior change is intended.

When the user does ask for tests:

- **Where:** in a `__tests__/` folder inside the folder of the file under test, same file name + `.test.ts(x)`:
  ```
  features/leads/services/lead.service.ts
  features/leads/services/__tests__/lead.service.test.ts
  features/leads/components/LeadCard.tsx
  features/leads/components/__tests__/LeadCard.test.tsx
  ```
  Import the code under test with `../`. Every file inside `__tests__/` is treated as a test, so put shared helpers elsewhere (the core's live in `src/lib/core/test/`). **Never put tests inside `src/app/`** (Expo Router would treat them as routes).
- **What to test:** services, schemas, query hooks, utils, and hooks — every branch that matters. Components: behavior (what the user sees and presses), not snapshots. Full user flows belong in end-to-end tests later, not unit tests.
- **Core coverage floor:** `src/lib/core` is kept ≥ 95% statements/lines/functions and ≥ 90% branches; `npm run test:coverage` fails below that. When the user asks you to test core changes, run it.
- **Testing Library v14 is async:** `await render(...)`, `await renderHook(...)`, `await rerender(...)`, `await unmount()`, and wrap updates in `await act(async () => { ... })` (its return value has no `.catch`).
- **No real network, ever.** Use the core's test helpers:
  - `installFakeHttp()` (`src/lib/core/test/fakeHttp.ts`) — scripted transport; inspect `fake.requests`, set `fake.reply(...)`, call `fake.restore()` in `afterEach`.
  - `createQueryWrapper()` (`src/lib/core/test/createQueryWrapper.tsx`) — fresh QueryClient (no retries, no GC timers) + `wrapper` for `renderHook`.
  - Or `enableMockServer({ latencyMs: 0, logging: false })` + `mockCollection` to test a feature against its mock API.
- **Reset shared state** (`mockServer.reset()`, `setAuthAdapter(null)`, `setNotifier(null)`, `disableMockServer()`, `configureCore(...)`) in `afterEach` — core config is module-level.
- `jest.mock()` factories may only reference variables prefixed with `mock` (`const mockRouter = …`).
- Timers: `jest.useFakeTimers()` + `jest.advanceTimersByTime` / `advanceTimersByTimeAsync`; restore with `jest.useRealTimers()`.
- If a new dependency ships untranspiled ESM ("Cannot use import statement outside a module"), add it to `transformIgnorePatterns` in `package.json`.

## Git

- Branch per task: `feat/…`, `fix/…`, `chore/…`, `docs/…`. Never commit straight to `main`.
- Conventional-commit style messages: `feat(leads): add lead list screen`.
- Only commit or push when the user asks.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

This project uses **npm** (`package-lock.json`).

```bash
npx expo install <package>  # ALWAYS use instead of npm install — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npm test                    # unit tests (npm run test:watch · npm run test:coverage)
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint, typecheck, and tests before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Typed routes are enabled (`experiments.typedRoutes`).
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `npx eas-cli@latest <command>`; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
