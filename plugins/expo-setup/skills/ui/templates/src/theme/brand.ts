/**
 * The brand palette, as a Tamagui child theme — GENERATED from one colour, #2563eb, by
 * `makeBrandTheme.mjs` (expo-setup kit, ui phase). Regenerate rather than hand-edit:
 *
 *   node "<kit>/skills/ui/scripts/makeBrandTheme.mjs" --color "#2563eb"
 *
 * Used as `theme="brand"` — the primary action, the selected item, focus rings, the active nav row. **Not** headers
 * or large surfaces: a brand-coloured app bar in a tool used all day reads as loud, and keeping the brand rare is
 * what keeps a primary action findable. See the design-system skill.
 *
 * A child theme is **twelve values in order** (`createV5Theme` reads them with `Object.values`; the key names are
 * documentation): 1–2 app backgrounds · 3–5 component backgrounds · 6–8 borders · 9 solid · 10 hover/pressed ·
 * 11 low-contrast text · 12 high-contrast text. Steps 10–12 are derived beneath step 9 so lightness always descends.
 *
 * Measured (WCAG 2.1):
 *
 * | | light | dark | needs |
 * |---|---|---|---|
 * | button label on fill | 5.17 | 4.51 | ≥ 4.5 |
 * | button fill on the page | 5.17 | 3.97 | ≥ 3 |
 * | step 9 on the page | 5.17 | 4.6 | ≥ 3 |
 * | step 11 on step 3 (tinted chip text) | 7.1 | 7.01 | ≥ 4.5 |
 * | step 11 on the page | 8.17 | 8.93 | ≥ 4.5 |
 *
 * - Dark: the button fill is #4272db, not step 9 (#487cee); step 9 stays bright for accents on the dark page.
 * - Dark step 9 is brightened from the brand (#2563eb) so it reads on the dark page.
 *
 * The values are literals on purpose: the colours that ship are visible in the diff.
 */

/** Light mode. */
export const brandLight = {
  brand1: '#fafbff',
  brand2: '#f3f6fe',
  brand3: '#e9effd',
  brand4: '#d1defb',
  brand5: '#bed0f9',
  brand6: '#a6bff7',
  brand7: '#8bacf4',
  brand8: '#6893f1',
  brand9: '#2563eb',
  brand10: '#1f54c8',
  brand11: '#1b48ac',
  brand12: '#182d5d',
} as const;

/** Dark mode. */
export const brandDark = {
  brand1: '#191c27',
  brand2: '#1b2131',
  brand3: '#202b46',
  brand4: '#25355a',
  brand5: '#293d6b',
  brand6: '#2e477f',
  brand7: '#34549a',
  brand8: '#3d65bf',
  brand9: '#487cee',
  brand10: '#5e8cf0',
  brand11: '#9ab7f6',
  brand12: '#d1ddf5',
} as const;

/** The pair `createV5Theme` takes as a child theme. */
export const brandTheme = { light: brandLight, dark: brandDark };

/**
 * A **filled brand control** — the primary `Button`, the `brand` `IconButton` and its count badge — per scheme.
 * Read through `useBrandSolid()`, never directly: `bg="$color9"` with `$color1` text is how a dark label on a
 * bright fill comes back.
 */
export const BRAND_BUTTON = {
  light: { bg: '#2563eb', pressed: '#2157cf', label: '#ffffff' },
  dark: { bg: '#4272db', pressed: '#3a64c1', label: '#ffffff' },
} as const;
