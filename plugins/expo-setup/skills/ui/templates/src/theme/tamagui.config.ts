import { createV5Theme, defaultChildrenThemes, defaultConfig, v5ComponentThemes } from '@tamagui/config/v5';
import { animations } from '@tamagui/config/v5-reanimated';
import { createTamagui } from 'tamagui';

import { brandTheme } from './brand';
import { bodyFont, headingFont, monoFont } from './fonts';
import { darkPalette, lightPalette } from './palette';

/**
 * v5's component sub-themes, **minus Button, Input and TextArea**.
 *
 * A component theme re-maps the palette inside that component — inside a v5 `Button`, `$background` is a shifted
 * grey, not the card white the rest of the app means by it. Our `Button` and form fields style themselves from
 * explicit tokens (`fieldFrame`, the button variants), so the sub-theme only made a white field render grey on a
 * white card. Switch, Slider, Progress and Tooltip keep theirs.
 */
const { Button: _button, Input: _input, TextArea: _textArea, ...componentThemes } = v5ComponentThemes;

/**
 * Tamagui v2 with the v5 preset: tokens, media queries, shorthands (shorthand-only styles), Reanimated animations.
 *
 * `themes` is rebuilt rather than taken from `defaultConfig`:
 * - the **warm neutral palettes** (`palette.ts`) replace v5's pure greys — the three-surface rule depends on them;
 * - the **brand** joins the built-in colour themes as `theme="brand"` (`brand.ts`, generated from one hex). The
 *   defaults are spread back in, so `theme="red"`, `"green"` and the rest still work — `red` stays for destructive
 *   actions and errors, which must remain distinguishable from the brand.
 *
 * See the design-system skill for how screens use these.
 */
export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  animations,
  themes: createV5Theme({
    lightPalette,
    darkPalette,
    componentThemes,
    childrenThemes: { ...defaultChildrenThemes, brand: brandTheme },
  }),
  fonts: {
    ...defaultConfig.fonts,
    body: bodyFont,
    heading: headingFont,
    mono: monoFont,
  },
});

export default tamaguiConfig;

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Tamagui's required type augmentation
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
