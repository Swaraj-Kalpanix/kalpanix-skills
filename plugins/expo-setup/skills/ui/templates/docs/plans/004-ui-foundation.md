---
id: PLAN-004
title: UI foundation — Tamagui, sheets, keyboard, fonts, forms
status: in-progress    # draft | approved | in-progress | done | dropped
modules: []
created: {{DATE}}
updated: {{DATE}}
---

# PLAN-004 — UI foundation

## Goal
Install and wire the UI stack so feature screens can be built right away: Tamagui v2 (config v5), bottom sheets, keyboard handling, fonts, icons, forms, lists, blur.

## Decisions (MEMO-005)
- **Tamagui v2 + `@tamagui/config/v5`**, Reanimated animation driver (`@tamagui/config/v5-reanimated`). Shorthand-only styles (`onlyAllowShorthands: true`).
- **Compiler (`@tamagui/babel-plugin`) installed but not enabled** — optional on native, docs recommend starting without it, and it is reported to crash alongside the React Compiler.
- **Fonts:** Inter (body) + Sora (heading) from `@expo-google-fonts/*`, built with v5's `createSystemFont` so Tamagui's full size scale is kept; loaded with `useFonts` while the splash screen stays up.
- **Providers (outer → inner):** GestureHandlerRootView → CoreQueryProvider → TamaguiProvider (includes PortalProvider) → ToastProvider → KeyboardProvider → BottomSheetModalProvider.
- **Feedback:** core `setNotifier` → in-app Tamagui toast; core `useConfirmDialog` → Tamagui `AlertDialog` host.
- **Bottom sheets:** `@gorhom/bottom-sheet` for every sheet; inputs inside sheets use `BottomSheetTextInput`.
- **Keyboard:** `react-native-keyboard-controller` for screens/forms (needs a development build).
- **Lists:** FlashList v2 (no `estimatedItemSize`). **Icons:** `lucide-react-native` (+ `react-native-svg`). **Forms:** react-hook-form + `@hookform/resolvers/zod`. **Blur:** `expo-blur` (Android needs `BlurTargetView` + `blurTarget`). **Utils:** lodash per-method imports.

## Checklist
- [x] Install packages (`npx expo install`)
- [x] Tamagui config + fonts in `src/theme/`
- [x] Providers in `src/providers/AppProviders.tsx`, font loading + splash in root layout
- [x] Toast bridge + confirm dialog host in `src/components/feedback/`
- [x] `.claude/skills/tamagui` + `.claude/skills/mobile-ui` for agents
- [x] Typecheck, lint, tests, Android bundle
- [ ] First development build on a device — verify sheets, keyboard, toasts, confirm dialog, fonts
- [ ] Brand theme from the logo colours

## Risks
- Tamagui + React Compiler without the Tamagui compiler: fine at runtime; revisit only if enabling the compiler.
- Known @gorhom/bottom-sheet issues on New Architecture (first-open lag, keyboard with inputs) — verify on device.

## Log
- {{DATE}} — created; packages installed and wired; typecheck, lint, tests, Android bundle OK
