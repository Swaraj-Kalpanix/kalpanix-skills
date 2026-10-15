# expo-setup

The initial setup Kalpanix uses for every Expo app (first built for Crystal CRM), packaged as Claude Code skills. It always targets the **latest** Expo SDK: projects come from `create-expo-app@latest`, packages from `npx expo install` with no pinned versions, and every phase checks the current docs.

## Use

In an empty folder, or a fresh `create-expo-app` project:

```
/expo-setup:bootstrap
```

It asks for the app name, bundle ID, description, API style and auth, then runs every phase in order. Each phase also runs alone:

| Skill | Phase |
|---|---|
| `/expo-setup:foundation` | Remove the starter template · app identity · `AGENTS.md`, `CLAUDE.md`, `CHANGELOG.md` · `docs/` (plans, memos, modules, TODO) · project skills `plan-feature`, `new-module`, `wrap-up` · feature folder + naming rules · ESLint |
| `/expo-setup:core` | `src/lib/core` — axios clients, auth adapter (custom login or Clerk), `BaseService` / `CrudService` + zod, NestJS crud + REST query builders, React Query hooks (confirm on mutation, global toasts), mock server (wired only) · `env.ts`, `setupCore.ts` |
| `/expo-setup:testing` | Jest + jest-expo + React Native Testing Library · the core's test suite · coverage floor · "tests only when asked" |
| `/expo-setup:ui` | Tamagui v2 + `@tamagui/config/v5` (Reanimated) · Inter + Sora · gorhom bottom sheet · keyboard-controller · FlashList · lucide · expo-blur · react-hook-form · toast + confirm hosts · `AppProviders` · project skills `tamagui`, `mobile-ui` |
| `/expo-setup:branding` | One logo → app icon, Android adaptive + monochrome icons, splash |
| `/expo-setup:eas` | **Last** — your EAS project ID · expo-updates (fingerprint runtime) · dev client · `eas.json` profiles · build/update scripts · first dev build |

## What you end up with

```
AGENTS.md · CLAUDE.md · CHANGELOG.md · README.md · eas.json · .env.example
.claude/  expo-setup.json (the inputs) · settings.json · skills/{plan-feature,new-module,wrap-up,tamagui,mobile-ui}
docs/     TODO.md · plans/ (PLAN-001…004) · memos/ (MEMO-001…005) · modules/
src/app/          _layout.tsx (fonts + splash + providers) · index.tsx
src/lib/core/     the generic data layer (+ mock/, test/, __tests__/)
src/lib/          env.ts · setupCore.ts
src/providers/    AppProviders.tsx
src/theme/        tamagui.config.ts · fonts.ts
src/components/   feedback/AppToast.tsx · feedback/ConfirmDialogHost.tsx
src/hooks/        useAppFonts.ts
assets/images/    logo, icon, android-icon-{foreground,background,monochrome}, splash-icon
```

Feature folders (`src/features/<feature>/…`) and the other shared folders are created only when development needs them — `AGENTS.md` holds the rules.

## Requirements

Node 20+, npm, Python 3 + Pillow (branding), an Expo account and EAS project (last phase). iOS and Android only — the kit never targets web.

## Maintaining

Templates live in `skills/<phase>/templates/` with `{{PLACEHOLDERS}}`, filled from the project's `.claude/expo-setup.json` by `scripts/copyTemplates.mjs`. The core (`skills/core/templates/src/lib/core`) is the shared Kalpanix core — when an app improves it generically, copy the change back here and bump `version` in `.claude-plugin/plugin.json`.
