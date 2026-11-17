import { useThemeName, type ColorTokens } from 'tamagui';

import { BRAND_BUTTON } from '@/theme/brand';

/**
 * The colours of a **filled brand control** — the primary `Button`, the `brand` `IconButton` and its count badge —
 * so the three cannot drift apart.
 *
 * They come from `BRAND_BUTTON` in `src/theme/brand.ts`, which `makeBrandTheme.mjs` **measured**: a white label
 * where the brand can carry one at AA (4.5:1), with the fill deepened just enough — in dark mode a step deeper than
 * the bright step 9 the accents use. Writing `bg="$color9"` with `$color1` text instead brings back a near-black
 * label on a bright fill in dark mode, which passes on paper and reads poorly on a phone.
 *
 * `label` is a resolved colour value, because it also colours SVG icons, which reject token strings (see `Button`).
 */
export function useBrandSolid(): { bg: ColorTokens; pressed: ColorTokens; label: string } {
  const solid = useThemeName().startsWith('dark') ? BRAND_BUTTON.dark : BRAND_BUTTON.light;
  // A colour value is valid at runtime wherever a token is; the style props are typed for tokens only.
  return { bg: solid.bg as ColorTokens, pressed: solid.pressed as ColorTokens, label: solid.label };
}
