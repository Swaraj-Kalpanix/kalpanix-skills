---
name: ui
description: Phase 4 of the Kalpanix Expo setup — install and wire the mobile UI stack: Tamagui v2 with @tamagui/config/v5 and the Reanimated driver, Inter + Sora fonts behind the splash screen, @gorhom/bottom-sheet, react-native-keyboard-controller, FlashList v2, lucide icons, expo-blur, react-hook-form + zod resolver, lodash, the core's toast and confirm-dialog hosts, AppProviders, and the project skills tamagui + mobile-ui. Use when setting up the UI foundation of a Kalpanix Expo app.
---

# Phase 4 — UI foundation

Templates: `${CLAUDE_PLUGIN_ROOT}/skills/ui/templates`. Ground rules: see `expo-setup:bootstrap`. Needs phases 1–3.

## 1. Install
**Tamagui is pinned to major v2** — the templates are written for Tamagui v2 + `@tamagui/config/v5`, and **Tamagui v3 breaks them** (toast API, token types, `enterStyle` on dialog parts). Everything else installs at its latest SDK-compatible version.
```bash
npm install --save-exact tamagui@^2 @tamagui/config@^2 @tamagui/alert-dialog@^2 @tamagui/dismissable@^2 @tamagui/portal@^2 @tamagui/toast@^2 @tamagui/animations-reanimated@^2
npm install --save-dev --save-exact @tamagui/babel-plugin@^2
npx expo install @gorhom/bottom-sheet react-native-keyboard-controller @shopify/flash-list @expo-google-fonts/inter @expo-google-fonts/sora expo-font expo-blur lucide-react-native react-native-svg react-hook-form @hookform/resolvers lodash
npx expo install @types/lodash -- --save-dev
```
Tamagui goes through plain `npm install --save-exact` (it isn't an Expo-managed package, and `npx expo install` with version ranges has been seen to hang after installing). Then check versions:
- **Every `tamagui` / `@tamagui/*` package on the exact same version** — `npm ls @tamagui/core` shows a single version.
- `@tamagui/animations-reanimated`'s peer `react-native-reanimated` must match the version Expo installed (`npm ls react-native-reanimated` — no `invalid`).
- Moving the kit to Tamagui v3 is a deliberate migration of these templates (read `https://tamagui.dev/llms.txt` and the v3 upgrade guide), done in `kalpanix-skills` — not ad hoc in a project.
- `@tamagui/babel-plugin` stays **installed but not enabled** (optional on native; reported to crash alongside the React Compiler).

## 2. Copy
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/copyTemplates.mjs" --from "${CLAUDE_PLUGIN_ROOT}/skills/ui/templates" --to . --force
```
`--force` replaces the earlier stubs `src/app/_layout.tsx`, `src/app/index.tsx` and `src/providers/AppProviders.tsx` — only use it while they are still stubs. Writes:
- `src/theme/tamagui.config.ts` — v5 `defaultConfig` + Reanimated `animations` + our fonts, and the `TamaguiCustomConfig` augmentation.
- `src/theme/fonts.ts` — `fontAssets` (Inter 400/500/600/700, Sora 600/700/800) and `bodyFont` / `headingFont` via `createSystemFont`.
- `src/hooks/useAppFonts.ts` — `useFonts(fontAssets)` → `{ ready, error }`.
- `src/providers/AppProviders.tsx` — GestureHandlerRootView → CoreQueryProvider → TamaguiProvider (includes PortalProvider) → ToastProvider → KeyboardProvider → BottomSheetModalProvider, plus `ConfirmDialogHost` and `AppToast`.
- `src/components/feedback/AppToast.tsx` (core `setNotifier` → Tamagui toast) and `ConfirmDialogHost.tsx` (core confirm → Tamagui `AlertDialog`).
- `src/app/_layout.tsx` — keeps the splash up until fonts load, then `AppProviders` → React Navigation `ThemeProvider` → `Stack`. `src/app/index.tsx` — Tamagui placeholder.
- `.claude/skills/tamagui` and `.claude/skills/mobile-ui` — project skills agents read before writing UI.
- PLAN-004, MEMO-005.

## 3. app.json
Make sure `"expo-font"` is in `plugins` (next to `expo-router` and `expo-splash-screen`).

## 4. Verify
- `npx tsc --noEmit`, `npx expo lint`, `npm test` — clean.
- `npx expo export --platform android --output-dir <scratch dir>` — bundles. **Never** verify on web.
- `npx expo-doctor` — all checks pass (fix version mismatches with `npx expo install --fix`).

Known gotchas (Tamagui v2 / v5 config): styles are **shorthand-only** (`p`, `bg`, `items`, `justify`, `rounded`) — but only props that *have* a shorthand (`width`, not `w`); animations use the `transition` prop; PortalProvider is already inside TamaguiProvider; inputs inside gorhom sheets use `BottomSheetTextInput`; FlashList v2 has no `estimatedItemSize`; expo-blur on Android needs `BlurTargetView` + `blurTarget`; keyboard-controller needs a development build (not Expo Go).

## 5. Docs
- Add PLAN-004 to `docs/plans/README.md` (in-progress) and MEMO-005 (UI stack: Tamagui v2 + v5 config, gorhom sheets, keyboard-controller, FlashList, RHF) to `docs/memos/README.md`.
- `docs/TODO.md` → Now: `First development build on a device: check fonts, toasts, confirm dialog, bottom sheet, keyboard — PLAN-004`. Next: `Add the brand colours as a Tamagui brand theme — PLAN-004`. Done: `UI foundation: Tamagui, fonts, toasts, confirm dialog, sheets, keyboard, lists, forms, icons, blur — PLAN-004`.
- `CHANGELOG.md` → Added: `UI foundation (PLAN-004, MEMO-005): Tamagui v2 with @tamagui/config/v5 and the Reanimated driver; Inter (body) + Sora (heading) fonts loaded behind the splash screen; AppProviders (GestureHandlerRootView → CoreQueryProvider → TamaguiProvider → ToastProvider → KeyboardProvider → BottomSheetModalProvider); AppToast and ConfirmDialogHost wired to the core.` and a `Packages:` line listing what step 1 installed; `Project skills tamagui and mobile-ui`. Changed: `Placeholder home route now renders with Tamagui.`
