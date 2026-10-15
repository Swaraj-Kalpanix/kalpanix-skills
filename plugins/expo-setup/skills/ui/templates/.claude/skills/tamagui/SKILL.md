---
name: tamagui
description: How to build UI with Tamagui v2 (@tamagui/config/v5) in {{APP_NAME}} — shorthand-only styles, tokens, themes, fonts, animations, components, toasts and dialogs. Use before writing or changing any component, screen, or style, and whenever the user mentions Tamagui, theme, tokens, colors, spacing, styling, or a UI component.
---

# Tamagui v2 in {{APP_NAME}}

Versions: `tamagui` v2 (check `package.json`), `@tamagui/config` (**v5 preset**), Reanimated 4 driver. Your training data is likely Tamagui v1 — **don't trust it**. When unsure, check the installed source in `node_modules/@tamagui/*/src` or the docs (full text: https://tamagui.dev/llms.txt).

Config: `src/theme/tamagui.config.ts` · fonts: `src/theme/fonts.ts` · providers: `src/providers/AppProviders.tsx`.

## 1. Styles are shorthand-only (`onlyAllowShorthands: true`)

If a property **has** a shorthand, you **must** use the shorthand — the long name is a type error. Properties without a shorthand keep their full name.

| Shorthand | Property | Shorthand | Property |
|---|---|---|---|
| `p` `px` `py` `pt` `pb` `pl` `pr` | padding… | `m` `mx` `my` `mt` `mb` `ml` `mr` | margin… |
| `bg` | backgroundColor | `rounded` | borderRadius |
| `items` | alignItems | `justify` | justifyContent |
| `self` | alignSelf | `content` | alignContent |
| `grow` | flexGrow | `shrink` | flexShrink |
| `minW` `maxW` | min/maxWidth | `minH` `maxH` | min/maxHeight |
| `t` `b` `l` `r` | top/bottom/left/right | `z` | zIndex |
| `text` | textAlign | `select` | userSelect |

Full names stay: `width`, `height`, `flex`, `flexDirection`, `flexWrap`, `gap`, `borderWidth`, `borderColor`, `color`, `opacity`, `position`, `overflow`, `fontSize`, `fontWeight`, …

```tsx
<YStack flex={1} p="$4" gap="$3" bg="$background" items="center" justify="center" rounded="$4" width="100%" maxW={480}>
```

v5 uses `styleCompat: 'web'` — flex behaves like CSS (`flex={1}` is `flex: 1 1 0%` semantics). Children of `XStack`/`YStack` don't stretch unless you set `self="stretch"` / `width`.

## 2. Tokens and theme values — never hard-code

(Verified against the installed v5 config.)
- **Space / size:** `$0 $0.25 $0.5 $0.75 $1 $1.5 $2 $2.5 $3 $3.5 $4 $4.5 $5 … $20` and `$true` (= `$4`). Negative space for margins: `m="-$2"`. Use for `p`, `m`, `gap`, `width`, `height`, `size`.
- **Radius:** `rounded="$0"` … `"$12"` and `"$true"`. There is no `$full` — use `rounded={1000}` for pills/avatars.
- **zIndex:** `z="$0"` … `"$5"`.
- **Font sizes:** `fontSize="$1"` … `"$16"`; components take `size="$4"` (text + padding scale together).
- **Theme values** (switch automatically with light/dark and sub-themes): `$background` `$backgroundHover` `$backgroundPress` `$backgroundFocus` `$backgroundActive`, `$color` `$colorHover` `$colorPress` `$colorFocus`, `$borderColor` `$borderColorHover` `$borderColorPress` `$borderColorFocus`, `$placeholderColor`, `$shadowColor`, `$outlineColor`, `$accentBackground` `$accentColor`, the 12-step scale `$color1`…`$color12` (1–2 app/subtle backgrounds, 3–5 component backgrounds, 6–8 borders, 9–10 solid, 11–12 text), and palette scales like `$blue9`, `$red10`, `$green9`.
- **Never** write hex/rgb colors or raw pixel spacing in components. Need a new value? Add a token/theme in `tamagui.config.ts`.

## 3. Themes

- Light/dark follows the system: `TamaguiProvider defaultTheme` is set from `useColorScheme()` in `AppProviders`.
- Sub-themes: `theme="accent" | "blue" | "green" | "red" | "yellow" | "orange" | "pink" | "purple" | "teal" | "gray" | "neutral" | "black" | "white" | "surface1" | "surface2"` on any component, or `<Theme name="red">…</Theme>`.
  - Destructive action → `theme="red"`; success → `"green"`; primary → `"accent"`.
- Read values in JS: `const theme = useTheme(); theme.color10.val` (e.g. for icon colors, native props). `useThemeName()` returns the current name.
- Brand colors: extend with `createV5Theme({ childrenThemes: { ...defaultChildrenThemes, brand: { light, dark } } })` from `@tamagui/config/v5` (palettes from `@tamagui/colors`), then pass `themes` to `createTamagui`. Discuss with the user before adding a theme.

## 4. Fonts

`body` = Inter (400/500/600/700), `heading` = Sora (600/700/800), loaded in the root layout while the splash stays up. `defaultFont` is `body`. Headings (`H1`–`H6`) use `heading` automatically. To use a weight: `fontWeight="600"` (mapped to the loaded face). Don't reference font files or family strings in components.

## 5. Media queries (responsive / tablets)

Min-width (mobile-first): `$xxxs $xxs $xs $sm $md $lg $xl $xxl`; max-width: `$max-xxxs` … `$max-xxl`; height: `$height-sm $height-md $height-lg` and `$max-height-*`; capability: `$touchable`, `$hoverable`. Phones are narrow — use these mainly for tablets.
```tsx
<XStack flexDirection="column" $md={{ flexDirection: 'row' }} />
const media = useMedia(); if (media.md) …
```

## 6. Animations (Reanimated driver)

Prop is **`transition`** in v2 (not `animation`). Presets: `quick`, `quicker`, `quickest`, `bouncy`, `superBouncy`, `medium`, `lazy`, `superLazy`, `slow`, `slowest`, `quickLessBouncy`, `quickerLessBouncy`, `quickestLessBouncy`, and timings `'100ms'`…`'500ms'`.
```tsx
<YStack transition="quick" enterStyle={{ opacity: 0, y: 10 }} exitStyle={{ opacity: 0 }} pressStyle={{ scale: 0.97 }} />
<AnimatePresence>{open && <YStack key="panel" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />}</AnimatePresence>
```
Pseudo states: `pressStyle`, `hoverStyle`, `focusStyle`, `focusVisibleStyle`, `disabledStyle`.

## 7. Building components

- Import everything from `'tamagui'` (`YStack`, `XStack`, `ZStack`, `View`, `Text`, `SizableText`, `Paragraph`, `H1`–`H6`, `Button`, `Input`, `TextArea`, `Label`, `Checkbox`, `Switch`, `RadioGroup`, `Select`, `Separator`, `Spinner`, `Avatar`, `Card`, `ScrollView`, `AlertDialog`, `Dialog`, `Popover`, `Sheet`, `Theme`, `useTheme`, `useMedia`, `styled`). Toasts from `'@tamagui/toast'`.
- Reusable styled primitives go in `src/components/ui/` (PascalCase files), feature-only ones in the feature's `components/`.
- `styled()` with variants — prefer this over conditional style props:
```tsx
export const StatusBadge = styled(XStack, {
  name: 'StatusBadge',
  px: '$2', py: '$1', rounded: '$2', items: 'center', gap: '$1',
  variants: {
    tone: { neutral: { bg: '$color3' }, success: { bg: '$green3' }, danger: { bg: '$red3' } },
    size: { sm: { px: '$1.5' }, md: { px: '$2' } },
  } as const,
  defaultVariants: { tone: 'neutral', size: 'md' },
});
export type StatusBadgeProps = GetProps<typeof StatusBadge>;
```
- Compound components: `createStyledContext` + `withStaticProperties`.
- Icons: `lucide-react-native`, colored from the theme: `<Search size={20} color={theme.color11.val} />` (or `Button icon={Search}`).

## 8. Toasts and confirm dialogs — use the core, not Tamagui directly

- Toasts: call `notify.success / error / info` from `@/lib/core`, or rely on mutation `meta` (`successMessage`, `errorMessage`) — they render through `src/components/feedback/AppToast.tsx`. Don't mount another `ToastProvider`.
- Confirmations: `useApiMutation({ meta: { confirm: { title, description, variant: 'destructive' } } })` or `await confirm({...})` — rendered by `ConfirmDialogHost` (Tamagui `AlertDialog`). Don't build ad-hoc confirm dialogs.
- `PortalProvider` is already inside `TamaguiProvider` — never add another.

## 9. Sheets

Use **@gorhom/bottom-sheet** for bottom sheets (see the `mobile-ui` skill). Tamagui `Sheet` only where a Tamagui component adapts into one internally (e.g. `Select` → `Adapt` → `Sheet` on phones; check the Select docs for the exact `Adapt` props).

## 10. Don'ts

- No `StyleSheet.create` / inline style objects for design values in screens — use Tamagui props (StyleSheet is fine for non-visual layout glue in providers).
- No hex colors, raw font sizes, raw spacing numbers where a token exists.
- No `animation=` prop (v1) — use `transition=`.
- No web-only props or `.web.tsx` files — this app is iOS/Android only.
- Don't enable `@tamagui/babel-plugin` (compiler) — installed but intentionally off (MEMO-005).
