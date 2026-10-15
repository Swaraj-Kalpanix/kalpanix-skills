---
id: MEMO-005
title: UI stack — Tamagui v2 + v5 config, gorhom sheets, keyboard-controller, FlashList, RHF
status: active
superseded_by:
date: {{DATE}}
updated: {{DATE}}
---

# MEMO-005 — UI stack

## Context
{{APP_NAME}} is an iOS/Android-only app. We need a themeable UI kit plus solid building blocks for sheets, keyboard, long lists, and forms before feature work starts.

## Decision
- **Tamagui v2 with `@tamagui/config/v5`** (tokens, light/dark + color sub-themes, media queries, shorthand-only styles) and the **Reanimated** animation driver (`@tamagui/config/v5-reanimated`, prop `transition`).
- **Tamagui compiler (`@tamagui/babel-plugin`) installed but not enabled.** It is optional on native, the docs recommend starting without it, and it is reported to crash alongside the React Compiler (which we use). Revisit only with a measured performance need.
- **Fonts:** Inter (body) + Sora (headings) from `@expo-google-fonts`, built with v5's `createSystemFont` (keeps the full size scale), loaded with `useFonts` behind the splash screen.
- **Feedback:** the core's `notify` → Tamagui in-app toast; the core's confirm → Tamagui `AlertDialog`. No native `burnt` toasts (one less native module).
- **Bottom sheets:** `@gorhom/bottom-sheet` v5 (`BottomSheetModal`) for all sheets; `BottomSheetTextInput` for inputs inside sheets.
- **Keyboard:** `react-native-keyboard-controller` (recommended by Expo's keyboard guide; handles Android edge-to-edge).
- **Lists:** FlashList v2. **Forms:** react-hook-form + `@hookform/resolvers/zod`. **Icons:** lucide-react-native. **Blur:** expo-blur. **Utils:** lodash (per-method imports).
- **Delivery:** EAS development builds (`expo-dev-client`), expo-updates with runtime version policy `fingerprint`.

## Why
- Tamagui gives a token/theme system and accessible primitives (dialogs, selects) that work on both platforms, with typed shorthands that keep styling consistent.
- All `tamagui` and `@tamagui/*` packages are kept on the exact same version, and `@tamagui/animations-reanimated` must match the installed Reanimated major.
- `fingerprint` runtime versions stop OTA updates from reaching incompatible native builds without manual version bumps.

## Consequences
- The app needs a development build (keyboard-controller is not in Expo Go).
- Known @gorhom/bottom-sheet issues on the New Architecture must be checked on a device.
- Agents follow `.claude/skills/tamagui` and `.claude/skills/mobile-ui`.
