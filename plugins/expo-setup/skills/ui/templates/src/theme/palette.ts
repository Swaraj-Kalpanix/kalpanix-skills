/**
 * The neutral base palettes — warm greys and an ink (not black) text colour, light and dark.
 *
 * Tamagui v5 reads a base palette as **twelve values in order**, and its templates give the steps their jobs.
 * ⚠ Measured from `createV5Theme` itself: `$background` is step **2** and `$borderColor` is step **4** — not the
 * Radix 1 and 3 you might assume. Reorder this array and every card renders the page colour.
 *
 * | step | job | light |
 * |---|---|---|
 * | 1 | the **page** behind the cards — `Screen`, `ScreenHeader`, the stack header | #f6f6f4 |
 * | 2 | `$background` — a **card**, a sheet, an input | #ffffff |
 * | 3 | a subtle fill — pressed rows, chips, identity tiles | #efefec |
 * | 4 | `$borderColor` — the hairline round a card, row dividers | #e5e5e1 |
 * | 5 | a control's border — inputs, outlined buttons and pills | #d6d6d0 |
 * | 6–9 | firmer borders, disabled, faint icons | |
 * | 10 | icons, placeholders | |
 * | 11 | secondary text | |
 * | 12 | `$color` — text: ink, not black | #16171c |
 *
 * **The rule every screen uses:** the page is `$color1`, a card or sheet is `$background`, its edge is
 * `$borderColor`, a control's edge is `$color5`. A page and cards of the same colour is what makes a screen read flat.
 *
 * In dark mode the card (step 2) is lighter than the page (step 1): a card sits *above* the page in both schemes,
 * and in the dark "above" means lighter.
 *
 * Text contrast, WCAG 2.1: step 12 on a card 17.9 (light) / 15.6 (dark); step 11 on a card 6.1 / 7.9; step 11
 * on the page 5.6 / 8.6; step 10 (icons only) on a card 4.3 / 5.9.
 *
 * `scripts/makeBrandTheme.mjs` mixes the brand ramp against these ends — change them there too.
 */
export const lightPalette = [
  '#f6f6f4',
  '#ffffff',
  '#efefec',
  '#e5e5e1',
  '#d6d6d0',
  '#c8c8c1',
  '#b3b4ae',
  '#9c9da2',
  '#878991',
  '#757882',
  '#5f626b',
  '#16171c',
];

export const darkPalette = [
  '#16171c',
  '#1f2027',
  '#272930',
  '#2f3139',
  '#3b3e47',
  '#464953',
  '#565964',
  '#6c6f7a',
  '#80838e',
  '#9497a1',
  '#aeb1ba',
  '#f6f6f4',
];
