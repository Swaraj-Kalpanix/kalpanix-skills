import { useFonts } from 'expo-font';

import { fontAssets } from '@/theme/fonts';

/** Loads the app fonts. `ready` is true once loaded — or on error, so the app falls back to system fonts instead of hanging. */
export function useAppFonts() {
  const [loaded, error] = useFonts(fontAssets);
  return { ready: loaded || !!error, error };
}
