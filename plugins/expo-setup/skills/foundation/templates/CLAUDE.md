@AGENTS.md

# {{APP_NAME}} — Project Context

> Keep this file short: it is loaded into every Claude session. Details belong in `docs/`, history belongs in `CHANGELOG.md`.

## What the app is

{{APP_NAME}} is an **iOS and Android** app built with Expo. **Not a web app** — never build or verify for web (`AGENTS.md` → "Platform").

{{APP_DESCRIPTION}}

<!-- TODO(owner): fill in — who uses it, the core problem it solves, and the backend it talks to. -->

## Modules

The feature list lives in [`docs/modules/README.md`](docs/modules/README.md) — one doc per module, each with its own status. Read the relevant module doc before touching that feature.

## Tech stack

| Area | Choice |
|---|---|
| Framework | Expo SDK {{SDK}}, React Native {{RN_VERSION}}, React {{REACT_VERSION}} |
| Language | TypeScript (strict), `@/*` → `src/*` |
| Navigation | Expo Router (file-based, typed routes) |
| Compiler | React Compiler enabled |
| Package manager | npm |
| Backend / API | {{API_STYLE}} — the core supports NestJS crud and plain REST (MEMO-002) |
| Data layer | `src/lib/core` — axios, mock server, `CrudService`, TanStack React Query (MEMO-002) |
| Validation | zod — schemas are the API contract and form schemas (MEMO-002) |
| UI | Tamagui v2 (`@tamagui/config/v5`, Reanimated driver), Inter + Sora fonts, @gorhom/bottom-sheet, react-native-keyboard-controller, FlashList v2, lucide icons, expo-blur (MEMO-005) — skills: `tamagui`, `mobile-ui` |
| Forms | react-hook-form + @hookform/resolvers (zod) |
| Builds / updates | EAS development builds (`eas.json`), expo-updates (runtime policy `fingerprint`) |
| Testing | Jest + `jest-expo` + React Native Testing Library — `npm test` (MEMO-004) |
| Client state | Redux Toolkit — store created with the first slice (MEMO-003) |
| Auth | {{AUTH}} — plugs in via `setAuthAdapter` (MEMO-002) |

When one of the "not decided" rows gets decided, record it in a memo (`docs/memos/`) and update this table.

## Where things are

Feature-based structure — full layout and placement rules in `AGENTS.md` → "Folder structure"; file naming in "Naming conventions" (PascalCase components, `useX` hooks, `name.service.ts`, no kebab-case). Folders are created only when their first file is written.

```
src/app/          routes only (Expo Router) — thin, render feature screens
src/features/     one folder per feature: screens, components, hooks, services,
                  queries, schemas, types, … + index.ts public API
src/lib/core/     generic data layer — read src/lib/core/USAGE.md before any data work
src/lib/core/mock/ mock server (`@/lib/core/mock`, wired to core only) — read its USAGE.md before writing mocks
src/lib/          env.ts (validated env) · setupCore.ts (wires core: config, mocks, auth, toasts)
src/providers/    AppProviders.tsx — every app-wide provider
src/theme/        tamagui.config.ts · fonts.ts
src/components/   feedback/ (AppToast, ConfirmDialogHost) · ui/ (shared primitives)
src/hooks/ services/ queries/ schemas/ types/ store/ utils/ constants/
                  shared code used by 2+ features
docs/             plans, memos, module specs, TODO board — see docs/README.md
CHANGELOG.md      every user-visible or structural change
.claude/skills/   plan-feature, new-module, wrap-up, tamagui, mobile-ui
```

## Sub-agents

Background / sub-agents must use a cheaper model — pass `model` explicitly on every Agent call: `haiku` by default (searches, doc lookups, mechanical edits), `sonnet` only for research that must be precise. Never let them inherit the main session model.

## Current state

{{CURRENT_STATE}}
