import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { createSystemFont } from '@tamagui/config/v5';

/** Font files loaded at startup (`useAppFonts`). Keys are the family names used below. */
export const fontAssets = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
};

/**
 * Body text — Inter. `createSystemFont` keeps the v5 size/line-height scale
 * ($1…$16, native sizes follow the iOS HIG); only the family changes.
 * `face` maps weights to the loaded files — required on Android for weights to apply.
 */
export const bodyFont = createSystemFont({
  font: {
    family: 'Inter_400Regular',
    weight: { 1: '400' },
    face: {
      400: { normal: 'Inter_400Regular' },
      500: { normal: 'Inter_500Medium' },
      600: { normal: 'Inter_600SemiBold' },
      700: { normal: 'Inter_700Bold' },
    },
  },
});

/** Headings (H1–H6) — Sora, weights mirror the v5 heading font. */
export const headingFont = createSystemFont({
  font: {
    family: 'Sora_700Bold',
    weight: { 0: '600', 6: '700', 9: '800' },
    face: {
      600: { normal: 'Sora_600SemiBold' },
      700: { normal: 'Sora_700Bold' },
      800: { normal: 'Sora_800ExtraBold' },
    },
  },
  sizeLineHeight: (size) => Math.round(size * 1.2),
});
