import { defaultConfig } from '@tamagui/config/v5';
import { animations } from '@tamagui/config/v5-reanimated';
import { createTamagui } from 'tamagui';

import { bodyFont, headingFont } from './fonts';

/**
 * Tamagui v2 with the v5 preset: tokens, light/dark + color themes, media
 * queries, shorthands (shorthand-only styles), Reanimated animations, and our
 * fonts. Add brand tokens/themes here — see .claude/skills/tamagui.
 */
export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  animations,
  fonts: {
    ...defaultConfig.fonts,
    body: bodyFont,
    heading: headingFont,
  },
});

export default tamaguiConfig;

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Tamagui's required type augmentation
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
