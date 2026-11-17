import { useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';

import { getAppearance, subscribeAppearance } from '@/theme/appearance.store';

/**
 * The scheme the app is drawn in — `'light'` or `'dark'` — for the Tamagui theme, the navigation theme, the status
 * bar and anything else that picks by scheme.
 *
 * A forced Light or Dark comes from the appearance store, so it applies in the same render as the tap rather than
 * after the native round trip; System follows the phone. Reads the store directly, so it works above every provider
 * (the root layout and `AppProviders` call it).
 */
export function useColorSchemeName(): 'light' | 'dark' {
  const preference = useSyncExternalStore(subscribeAppearance, getAppearance, getAppearance);
  const system = useColorScheme();
  if (preference !== 'system') return preference;
  return system === 'dark' ? 'dark' : 'light';
}
