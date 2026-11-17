import type { Stack } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTheme } from 'tamagui';

/** expo-router 57 vendors React Navigation, so the options type is taken from its own `Stack` rather than imported. */
type NativeStackNavigationOptions = Exclude<NonNullable<ComponentProps<typeof Stack>['screenOptions']>, Function>;

/**
 * The header every stack in the app shares — one definition instead of five layouts each assembling
 * their own, which is how two tabs end up with different header colours.
 *
 * - **Page-coloured, no shadow.** The header is part of the page, not a bar over it; the content's own cards
 *   are what carry elevation. A contrasting bar over a tinted page is a hard seam.
 * - **The title in Geist 600 at 17**, the platform size, so a drill-in screen's title is clearly smaller than
 *   a module list's 28pt large title.
 * - **Back button without the previous screen's title** — on a narrow phone "‹ Orders" next to a long record
 *   name truncates the one you are looking at.
 *
 * Colours are read in JS: a navigator takes them as prop *values*, not style props, so a `$token` string would
 * not resolve.
 */
export function useStackScreenOptions(): NativeStackNavigationOptions {
  const theme = useTheme();
  const page = theme.color1?.val;

  return {
    headerStyle: { backgroundColor: page },
    headerShadowVisible: false,
    headerTintColor: theme.color12?.val,
    headerTitleStyle: { color: theme.color12?.val, fontFamily: 'Geist_600SemiBold', fontSize: 17 },
    headerBackButtonDisplayMode: 'minimal',
    contentStyle: { backgroundColor: page },
  };
}
