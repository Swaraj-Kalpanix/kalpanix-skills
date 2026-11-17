---
id: MEMO-006
title: Visual system — three surfaces, a measured brand theme, a product type scale
status: active
superseded_by:
date: {{DATE}}
updated: {{DATE}}
---

# MEMO-006 — Visual system

## Context
A UI stack (MEMO-005) is not a look. Left to defaults, Tamagui v5 gives pure greys where the page, a card and a control
are all white, a reading-app type scale (body 17), and component themes that tint every control grey — screens with no
hierarchy, which read as unfinished. The first Kalpanix app (Crystal CRM) had to redesign every screen to fix that; this
setup starts from where that redesign ended, so {{APP_NAME}} does not repeat it.

## Decision
- **Warm neutral base palettes** (`src/theme/palette.ts`) passed to `createV5Theme` as `lightPalette` / `darkPalette`.
  **Three surfaces, always the same tokens:** page `$color1`, card/sheet/input `$background`, hairline `$borderColor`,
  control border `$color5`, subtle fill `$color3`, text `$color12` / `$color11`. Cards sit above the page with a soft shadow.
- **The brand is a generated, measured child theme** (`src/theme/brand.ts`, written by the kit's `makeBrandTheme.mjs`
  from one hex): a 12-step light and dark ramp with step 9 at the brand, steps 10–12 derived beneath it, and the
  filled-button colours (`BRAND_BUTTON`) chosen by contrast — a white label at ≥ 4.5:1, the fill deepened just enough;
  in dark mode a step deeper than the bright step 9 the accents use. Literals, so the colours that ship are in the diff.
- **The brand is rare:** the primary action, the selected item, focus, the active nav row, the create button. Never
  headers or large surfaces.
- **`destructive` is an outlined red button**, never filled: a filled Tamagui red cannot carry AA body text in light mode
  (white on red-9 ≈ 3.9:1).
- **Geist + Geist Mono** on a product scale (body 15, secondary 13, caption 12, row title 16, screen title 28), used
  through named text roles (`Title`, `Heading`, `Subtitle`, `Body`, `Muted`, `Caption`, `Overline`, `Mono`, `ErrorText`).
- **v5's Button / Input / TextArea component themes are removed** — they re-mapped `$background` inside the control,
  so a white field rendered grey on a white card.
- **A design system in `src/components/ui`** (Screen, ScreenHeader, BottomBar, Card, ListRow/SectionCard, RecordList,
  Sheet, TextField/SelectField/ChoiceField/DateField, StatusPill with six tones, Button, IconButton, …) and a fixed screen
  anatomy for lists, records, forms and sheets — the `design-system` skill.
- **Appearance:** Light / Dark / System, stored with `expo-secure-store` and applied synchronously before the first frame
  (`src/theme/appearance.store.ts`), read everywhere through `useColorSchemeName()`.

## Why
- **Measured, not eyeballed.** In the first app, v5's real step mapping (`$background` is step 2, `$borderColor` step 4)
  was the difference between cards that read as cards and cards the colour of the page; and white on a bright dark-mode
  brand looked fine and measured 3.66:1, while the dark label that passed read as black-on-colour on a phone.
- **One vocabulary** — six tones, nine text roles, four button variants — means fewer decisions per screen and screens
  that agree with each other without anyone checking.
- Rejected: restyling each screen ad hoc (how the first app got its "school project" look); a component-library preset
  look (a third visual language); generating the brand ramp at runtime (the shipped colours would not be reviewable).

## Consequences
- Never a hex in a component. A new surface uses one of the tokens above; a new brand means rerunning the generator.
- `useTheme()` reads the theme it is called inside — a component wrapping itself in `<Theme>` reads colours in an inner
  component. Colours that reach an SVG or a navigator option are resolved values, not `$tokens`.
- Contrast ratios are arithmetic; how a ramp *feels* is not. Check the Design system screen (`/design-system`, dev only)
  on a device in both schemes after any change to the palette, the brand or a primitive.
- If the brand is red, it shares a hue with danger — that is why `destructive` stays outlined and errors stay `$red*`.
