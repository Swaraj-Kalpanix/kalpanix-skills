---
name: design-system
description: {{APP_NAME}}'s visual system and its components in src/components/ui — the three-surface rule (page / card / control), text roles, the brand colour and where it may appear, status tones, button variants, screen anatomy (list screen, detail screen, form, sheet), empty/loading/error states, dark mode and contrast rules. Use before building or restyling any screen, list card, detail page, form or sheet, and whenever the user says the UI looks plain, unaligned, "like a school project", or asks for a modern / premium look.
---

# {{APP_NAME}} design system

Every screen is assembled from `@/components/ui` (import from the barrel, never a file inside it). Open the **Design system** screen in a dev build (`/design-system`, linked from the home placeholder) to see every primitive in light and dark. Tamagui mechanics (shorthands, tokens, animations) are in the `tamagui` skill; libraries (sheets, keyboard, lists) in `mobile-ui`. The decisions behind all of this: MEMO-006.

## 1. Three surfaces — always these tokens

| Role | Token |
|---|---|
| Page (behind everything) | `$color1` — `Screen` and `ScreenHeader` draw it |
| Card, sheet, input | `$background` |
| Hairline (card edge, row divider) | `$borderColor` |
| Control border (input, outlined button, pill) | `$color5` |
| Subtle fill, pressed, selected | `$color3` |
| Text / secondary text / icons | `$color12` / `$color11` / `$color10` |

- A card **sits above the page**: `Card` is `$background` with a soft shadow on a `$color1` page. A page and cards of the same colour is what makes a screen read flat.
- **Never put a card on a card** — nest `ListRow`s (via `SectionCard`) or a `Section` instead.
- **Never write a hex in a component.** A new surface uses a token above; a tone colour comes from a child theme (`StatusPill`'s `TONE_THEME`) or the palette families (`$red10`, `$yellow2`).

## 2. Text roles — never `Paragraph size=… color=…`

`Title` 28 (one per module list) · `Heading` 20 (a record's hero) · `Subtitle` 16 (row / card title) · `Body` 15 · `Muted` 13 (secondary) · `Caption` 12 (metadata, labels) · `Overline` 11 caps (section label — write it in sentence case) · `Mono` 13 (order / invoice numbers, codes) · `ErrorText` (red, never the brand).

Three screens each picking a different grey for "secondary text" is how an app stops looking like one app — pick the role, not the colour.

## 3. The brand colour is rare

The brand (`theme="brand"`, `$brand9`) appears on: **the one primary action**, the selected item, focus rings, the active nav row, the create (`+`) button. **Not** headers, app bars, large surfaces or body text — a brand-coloured bar in a tool used all day reads as loud, and a rare brand is what keeps the primary action findable.

- Filled brand controls use `useBrandSolid()` (`Button variant="primary"`, `IconButton variant="brand"` already do). Its fill and label were **measured** by `makeBrandTheme.mjs` — a white label at ≥ 4.5:1, the fill deepened just enough. `bg="$color9"` + `$color1` text brings back a near-black label in dark mode.
- Changing the brand: rerun `node <kit>/skills/ui/scripts/makeBrandTheme.mjs --color "#RRGGBB"` (it rewrites `src/theme/brand.ts` with a contrast table), then check the Design system screen on a device in both schemes. Never hand-edit the ramp.
- If the brand hue is red, it collides with danger: keep `destructive` outlined (it already is) and errors in `$red*`.

## 4. Status tones — six words for the whole app

`StatusPill tone=` · `Chip tone=` · `IdentityTile tone=`:

| tone | means |
|---|---|
| `info` (blue) | in progress, sent, scheduled |
| `success` (green) | done, paid, accepted |
| `warning` (orange) | on hold, due soon, at risk |
| `danger` (red) | failed, rejected, overdue |
| `neutral` (purple) | new, open — a state with no judgement |
| `muted` (grey) | draft, closed, cancelled |

Each feature maps its own statuses onto these in one function (`orderStatusTone(status)`) next to its schema — never a colour per status.

## 5. Buttons

| `Button variant=` | when |
|---|---|
| `primary` | the **one** obvious action on a screen — filled brand |
| `secondary` (default) | an alternative — outlined neutral |
| `ghost` | low emphasis, in rows and headers |
| `destructive` | delete, cancel — **outlined red**, never filled (a filled red can't carry AA body text in light mode) |

- `loading` keeps the label and width and blocks presses — use it for every in-flight action instead of disabling + spinner by hand.
- Icon-only actions: `IconButton` with a required `accessibilityLabel` — `ghost` in headers/rows, `outline` beside a search field, `brand` for create (`+`), `soft` for hero quick actions; `badge` for counts.
- Only the press scale animates. Never tween a fill.

## 6. Screen anatomy — copy these, don't invent new ones

**Module list (a place):**
```tsx
<Screen flush edges="none" header={
  <ScreenHeader title="Orders" subtitle={`${total} orders`} actions={<IconButton icon={Plus} variant="brand" accessibilityLabel="New order" onPress={…} />}>
    <XStack gap="$2"><SearchBar value={search} onChangeText={setSearch} /><IconButton icon={SlidersHorizontal} variant="outline" size="lg" badge={activeFilters} accessibilityLabel="Filters" onPress={…} /></XStack>
    <SegmentedTabs tabs={…} value={view} onChange={setView} />   {/* or a ChipRow of quick filters */}
  </ScreenHeader>}>
  <RecordList query={orders} renderItem={({ item }) => <OrderCard order={item} />} keyExtractor={(o) => o.id}
    empty={{ title: 'No orders yet', description: '…', action: <Button variant="primary">Add an order</Button> }} />
</Screen>
```
Hide the stack header on these screens (`ScreenHeader` draws the safe area). No extended FAB covering rows — the create action is the `+` in the header.

**List card** (`features/<f>/components/<Thing>Card.tsx`): `Card pressable` → an `XStack` of `IdentityTile` (or `Avatar`) · title (`Subtitle`, one line) + `Mono` number / `Muted` line · `StatusPill size="sm"`; then at most one `MetaItem` row. Say each fact once; a row that takes three lines to say what fits in one is the most common flaw.

**Detail (a record):** stack header with a back button →
1. a hero `Card`: `IdentityTile`/`Avatar`, `Heading`, `StatusPill`, `StatGroup` (2–3 numbers), `HeroFact`s for the facts that drive action;
2. `QuickActions` (call, message, directions) or `ActionTile`s; an `ActionBanner` when something needs attention;
3. `SectionCard`s of `ListRow`s — label left, value right, `—` for empty, `stacked` for long text, `onPress` adds the chevron;
4. a `Timeline` for history;
5. the closing actions in a `BottomBar` as `Screen`'s `footer` (`footerFollowsKeyboard={false}` on a record screen, so sheets' keyboards don't move it).

**Form:** `<Screen scroll footer={<BottomBar><Button flex={1}>Cancel</Button><Button flex={2} variant="primary" loading={…}>Save</Button></BottomBar>}>` with `FieldGroup`s of `TextField` / `SelectField` / `ChoiceField` (≤ 5 options) / `DateField`. Save is pinned, never at the end of the scroll. A `FormSummaryCard` on top when the form acts on an existing record.

**Sheet:** `Sheet` (title, optional description, `scroll` for forms, `footer` for its action row) — pickers, filters (`FilterSheet` with draft → Apply), short forms. Inputs inside use `TextField inSheet`.

## 7. States — every screen has all four

- **Loading:** `ListSkeleton` / `DetailLoading` (mirror the content's shape) — never a centred spinner on a blank page. A refetch keeps the old rows on screen.
- **Empty:** `EmptyState` with a title that says *which* empty ("No orders yet" vs "No orders match these filters") and the action that fixes it.
- **Error:** `ListError` / `EmptyState variant="error"` with Try again. A render crash is caught by `AppErrorBoundary` (root layout's `ErrorBoundary`).
- **Offline:** `Screen` shows `OfflineBanner` automatically; queries pause and resume.

While a mutation runs, `ActionLock` blocks other presses app-wide (opt out with `meta: { background: true }`). Toasts and confirms come from the core (`notify`, mutation `meta`, `confirm()`), never ad hoc.

## 8. Spacing and shape

- Screen gutter `$3.5` (`Screen` applies it); gap between sections `$4`–`$5`; inside a card `$2`–`$3.5`.
- Radii: cards `$6`, controls and buttons `$5`, pills `1000`. Buttons and fields are both 44–46 tall, so a button beside a field is the same shape.
- Touch targets ≥ 44; small icon buttons get `hitSlop`.

## 9. Dark mode and accessibility

- Check every new screen in **both** schemes (the Design system screen has a System / Light / Dark switch; the app setting uses `setAppearance()` from `src/theme/appearance.store.ts`).
- Pick by scheme with `useColorSchemeName()`, never React Native's `useColorScheme()` (it ignores the user's choice).
- Text contrast is measured, not eyeballed: `$color12` and `$color11` pass AA on both `$color1` and `$background`; `$color10` is for icons only.
- Status is never colour alone — `StatusPill` carries a label and a dot.
- Every pressable without visible text has an `accessibilityLabel`; headers use `accessibilityRole="header"` (`Title` in `ScreenHeader` does).

## 10. Adding to the system

- Start local (`features/<f>/components/`); promote to `src/components/ui/` when a second feature needs it, export it from `index.ts`, and add it to the Design system screen.
- A component that wraps itself in `<Theme name=…>` reads colours in an inner component (`useTheme()` reads the theme it is called inside).
- Colours that reach an SVG / native prop are resolved values (`theme.color11?.val`), never `$tokens`.
