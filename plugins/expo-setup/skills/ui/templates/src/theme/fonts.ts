import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import { createSystemFont } from '@tamagui/config/v5';

/** Font files loaded at startup (`useAppFonts`). Keys are the family names used below. */
export const fontAssets = {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  GeistMono_400Regular,
  GeistMono_500Medium,
};

/**
 * The type scale — a **product app's** scale, not the iOS HIG default Tamagui v5 ships for native.
 *
 * v5's native sizes put body copy at 17 and a card title at 20: right for a reading app, wrong for screens that are
 * lists of records, where every row spends three lines saying what fits in one. This scale is one step denser:
 * body **15**, secondary **13**, caption **12**, a list-row title **16**, a screen title **28**.
 *
 * Step meanings (stable, so the named roles in `components/ui/Text.tsx` mean the same thing everywhere):
 * `$1` micro label · `$2` caption · `$3` secondary · `$4` body · `$5` row title · `$6` section title ·
 * `$7` card title · `$8` hero figure · `$9` screen title.
 */
const SIZE = {
  1: 11,
  2: 12,
  3: 13,
  4: 15,
  true: 15,
  5: 16,
  6: 17,
  7: 20,
  8: 24,
  9: 28,
  10: 34,
  11: 40,
  12: 48,
  13: 56,
  14: 64,
  15: 76,
  16: 96,
} as const;

/**
 * Body text — **Geist**. `face` maps weights to the loaded files — required on Android for a weight to apply at all.
 */
export const bodyFont = createSystemFont({
  font: {
    family: 'Geist_400Regular',
    size: SIZE,
    weight: { 1: '400' },
    // Geist is drawn tight; a hair of tracking keeps small sizes legible on a phone.
    letterSpacing: { 1: 0.1, 2: 0.1, 3: 0, 4: 0 },
    face: {
      400: { normal: 'Geist_400Regular' },
      500: { normal: 'Geist_500Medium' },
      600: { normal: 'Geist_600SemiBold' },
      700: { normal: 'Geist_700Bold' },
    },
  },
  sizeLineHeight: (size) => Math.round(size * 1.42),
});

/**
 * Headings — the same Geist at **600**, with negative tracking at display sizes. One family with weight doing the
 * work: a display face at row-title size makes every list read as a stack of banners.
 */
export const headingFont = createSystemFont({
  font: {
    family: 'Geist_600SemiBold',
    size: SIZE,
    weight: { 0: '600', 9: '700' },
    letterSpacing: { 5: -0.1, 6: -0.2, 7: -0.3, 8: -0.4, 9: -0.6, 10: -0.8 },
    face: {
      500: { normal: 'Geist_500Medium' },
      600: { normal: 'Geist_600SemiBold' },
      700: { normal: 'Geist_700Bold' },
    },
  },
  sizeLineHeight: (size) => Math.round(size * 1.22),
});

/**
 * Identifiers — **Geist Mono** (`$mono`, the `Mono` text role): order and invoice numbers, codes, serials. A number
 * that is read aloud or typed into a search box is easier to read in it.
 */
export const monoFont = createSystemFont({
  font: {
    family: 'GeistMono_400Regular',
    size: SIZE,
    weight: { 1: '400' },
    face: {
      400: { normal: 'GeistMono_400Regular' },
      500: { normal: 'GeistMono_500Medium' },
    },
  },
  sizeLineHeight: (size) => Math.round(size * 1.4),
});
