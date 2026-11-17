---
name: ui
description: Phase 4 of the Kalpanix Expo setup — install and wire the mobile UI stack AND the design system: Tamagui v2 with @tamagui/config/v5 and the Reanimated driver, a warm neutral palette, a brand theme generated and contrast-checked from one hex, Geist + Geist Mono on a product type scale, Light/Dark/System appearance, ~40 design-system components in src/components/ui (Screen, ScreenHeader, Card, ListRow, RecordList, Sheet, TextField, SelectField, DateField, StatusPill, Button, IconButton…), @gorhom/bottom-sheet, react-native-keyboard-controller, FlashList v2, @expo/ui date picker, lucide, expo-blur, react-hook-form, the core's toast / confirm / action-lock hosts, a dev-only Design system screen, and the project skills design-system + tamagui + mobile-ui. Use when setting up the UI foundation of a Kalpanix Expo app, or to bring an app's UI up to the Kalpanix design system.
---

# Phase 4 — UI foundation and design system

Templates: `${CLAUDE_PLUGIN_ROOT}/skills/ui/templates`. Ground rules: see `expo-setup:bootstrap`. Needs phases 1–3.

The design system is the one Crystal CRM arrived at after its full redesign (warm three-surface palette, measured brand
contrast, product type scale, fixed screen anatomy), made app-agnostic. MEMO-006 in the templates records why.

## 1. Install
**Tamagui is pinned to major v2** — the templates are written for Tamagui v2 + `@tamagui/config/v5`, and **Tamagui v3 breaks them** (toast API, token types, `enterStyle` on dialog parts). Everything else installs at its latest SDK-compatible version.
```bash
npm install --save-exact tamagui@^2 @tamagui/config@^2 @tamagui/alert-dialog@^2 @tamagui/dismissable@^2 @tamagui/portal@^2 @tamagui/toast@^2 @tamagui/animations-reanimated@^2
npm install --save-dev --save-exact @tamagui/babel-plugin@^2
npx expo install @gorhom/bottom-sheet react-native-keyboard-controller @shopify/flash-list @expo-google-fonts/geist @expo-google-fonts/geist-mono expo-font expo-blur expo-secure-store @expo/ui lucide-react-native react-native-svg react-hook-form @hookform/resolvers lodash
npx expo install @types/lodash -- --save-dev
```
Tamagui goes through plain `npm install --save-exact` (it isn't an Expo-managed package, and `npx expo install` with version ranges has been seen to hang after installing). Then check versions:
- **Every `tamagui` / `@tamagui/*` package on the exact same version** — `npm ls @tamagui/core` shows a single version.
- `@tamagui/animations-reanimated`'s peer `react-native-reanimated` must match the version Expo installed (`npm ls react-native-reanimated` — no `invalid`).
- Moving the kit to Tamagui v3 is a deliberate migration of these templates (read `https://tamagui.dev/llms.txt` and the v3 upgrade guide), done in `kalpanix-skills` — not ad hoc in a project.
- `@tamagui/babel-plugin` stays **installed but not enabled** (optional on native; reported to crash alongside the React Compiler).
- `expo-secure-store` holds the appearance choice (read synchronously before the first frame); `@expo/ui` provides the native date/time picker inside `DateField`.

## 2. Copy
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/copyTemplates.mjs" --from "${CLAUDE_PLUGIN_ROOT}/skills/ui/templates" --to . --force
```
`--force` replaces the earlier stubs `src/app/_layout.tsx`, `src/app/index.tsx` and `src/providers/AppProviders.tsx` — only use it while they are still stubs; on an existing app, copy without `--force` and merge the skipped files by hand. Writes:
- **Theme** `src/theme/`: `palette.ts` (warm neutral 12-step light/dark — the order is load-bearing), `brand.ts` (generated, see step 3), `fonts.ts` (Geist / Geist Mono, product scale), `tamagui.config.ts` (`createV5Theme` with the palettes, the brand child theme, v5 component themes minus Button/Input/TextArea), `appearance.store.ts` (Light/Dark/System in secure-store).
- **Design system** `src/components/ui/` (public API: `index.ts`) — text roles, `Screen`, `ScreenHeader`, `BottomBar`, `Card`, `ListRow`/`SectionCard`, `MetaRow`, `RecordList`, `ListSkeleton`, `SearchBar`, `SegmentedTabs`, `Chip`, `StatusPill`, `StatGroup`, `HeroFact`, `IdentityTile`, `Avatar`, `QuickActions`, `ActionTile`, `ActionBanner`, `Timeline`, `ExpandableText`, `FormSummaryCard`, `Button`, `IconButton`, `useBrandSolid`, `TextField`, `SelectField`, `ChoiceField`, `DateField` (+ `CalendarPicker`, `TimeDial`), `FieldChrome`, `Sheet`, `FilterSheet`, `EmptyState`, `OfflineBanner`, `Spinner`, `Tooltip`, `usePullToRefresh`.
- **Feedback** `src/components/feedback/`: `AppToast` (core notifier → Tamagui toast), `ConfirmDialogHost` (core confirm → blurred `AlertDialog` with the app's buttons), `dialogBlurTarget`, `ActionLock` (+ store: blocks presses while a mutation runs), `AppErrorBoundary`.
- **Navigation** `src/components/navigation/useStackScreenOptions.ts` — the shared page-coloured stack header.
- **Hooks / utils:** `src/hooks/useAppFonts.ts`, `useColorSchemeName.ts`, `useIsOnline.ts`; `src/utils/format.ts` (date helpers the fields use; `LOCALE`).
- **Providers / routes:** `src/providers/AppProviders.tsx` (GestureHandlerRootView → CoreQueryProvider → TamaguiProvider → ToastProvider → KeyboardProvider → BlurTargetView → BottomSheetModalProvider + ConfirmDialogHost, ActionLock, AppToast); `src/app/_layout.tsx` (appearance before first frame, fonts behind the splash, status bar, `ErrorBoundary`, shared stack header); `src/app/index.tsx` (placeholder); `src/app/design-system.tsx` + `src/features/designSystem/` (dev-only gallery of every primitive with a Light/Dark switch).
- **Project skills** `.claude/skills/design-system` (the visual rules and screen anatomy), `tamagui`, `mobile-ui`.
- PLAN-004, MEMO-005 (UI stack), MEMO-006 (visual system).

## 3. Brand theme
Generate `src/theme/brand.ts` from the app's brand colour (`BRAND_COLOR` in `.claude/expo-setup.json`; if absent, ask — or sample the logo's main colour in phase 5 and come back). The template ships a neutral blue (`#2563EB`) so the app runs before a brand is chosen.
```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/ui/scripts/makeBrandTheme.mjs" --color "<BRAND_COLOR>"
```
It writes the 12-step light and dark ramps and `BRAND_BUTTON` (the filled-control fill/pressed/label per scheme) and prints a contrast report. Every line should say `ok`; if one says `FAIL`, show the user the report and suggest a deeper or more saturated colour rather than hand-editing. If the brand is red, mention that it shares a hue with danger (handled: destructive is outlined, errors stay `$red*`). Use `--check` to preview without writing.

## 4. app.json
Make sure `"expo-font"` and `"expo-secure-store"` are in `plugins` (next to `expo-router` and `expo-splash-screen`), and keep any other config plugin `npx expo install` added. `userInterfaceStyle` stays `automatic` (the appearance store overrides it at runtime).

## 5. Verify
- `npx tsc --noEmit`, `npx expo lint`, `npm test` — clean.
- `npx expo export --platform android --output-dir <scratch dir>` — bundles. **Never** verify on web.
- `npx expo-doctor` — all checks pass (fix version mismatches with `npx expo install --fix`).

Known gotchas (Tamagui v2 / v5 config): styles are **shorthand-only** (`p`, `bg`, `items`, `justify`, `rounded`) — but only props that *have* a shorthand (`width`, not `w`); animations use the `transition` prop; PortalProvider is already inside TamaguiProvider; inputs inside gorhom sheets use `TextField inSheet` (`BottomSheetTextInput`); FlashList v2 has no `estimatedItemSize`; expo-blur on Android needs `BlurTargetView` + `blurTarget` (mounted in `AppProviders`); keyboard-controller and `@expo/ui` need a development build (not Expo Go). If a component no longer typechecks on a newer SDK or library, fix it in the project and tell the user which template in `kalpanix-skills` needs the same fix.

## 6. Docs
- Add PLAN-004 to `docs/plans/README.md` (in-progress) and MEMO-005 (UI stack) + MEMO-006 (visual system: three surfaces, generated brand theme, Geist, design system) to `docs/memos/README.md`.
- `AGENTS.md` → the "UI" section already points agents at the `design-system`, `tamagui` and `mobile-ui` skills; check it does.
- `docs/TODO.md` → Now: `First development build on a device: open the Design system screen in light and dark; check fonts, toasts, confirm dialog, sheets, date picker, keyboard — PLAN-004`. Next: `Add an Appearance (System / Light / Dark) row to the app's settings with setAppearance() — PLAN-004`. Done: `UI foundation and design system: Tamagui, palette, brand theme (<hex>), Geist, components, toasts, confirm dialog, sheets, keyboard, lists, forms — PLAN-004`.
- `CHANGELOG.md` → Added: `UI foundation (PLAN-004, MEMO-005): Tamagui v2 with @tamagui/config/v5 and the Reanimated driver; providers; toasts, confirm dialog and action lock wired to the core.` `Design system (MEMO-006): warm neutral palette, brand theme generated from <hex> with measured contrast, Geist + Geist Mono product type scale, Light/Dark/System appearance, src/components/ui (screens, cards, rows, lists, sheets, fields, pills, buttons), dev-only Design system screen.` and a `Packages:` line listing what step 1 installed; `Project skills design-system, tamagui and mobile-ui`. Changed: `Placeholder home route now uses the design system.`
