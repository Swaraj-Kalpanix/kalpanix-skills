import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

/**
 * The user's Light / Dark / System choice — a tiny external store, readable above every provider.
 *
 * - **Applied before the first frame.** `expo-secure-store`'s synchronous `getItem` runs at module load of the root
 *   layout (`applyStoredAppearance()`), so a dark-preferring user never sees a light flash on launch. An async store
 *   (AsyncStorage) would flash light on every cold start.
 * - **One source for every reader.** `useColorSchemeName()` reads this beside the phone's scheme, and the Tamagui
 *   theme, the navigation theme, the status bar and the confirm dialog all call it — so a tap changes all of them in
 *   the same render.
 * - **Native views follow too.** `Appearance.setColorScheme` makes native pickers and the keyboard match the choice.
 *
 * Settings screens call `setAppearance('dark')`; nothing else writes it.
 */
export type AppearancePreference = 'system' | 'light' | 'dark';

const KEY = 'appearance';
let preference: AppearancePreference = 'system';
const listeners = new Set<() => void>();

export function getAppearance(): AppearancePreference {
  return preference;
}

export function subscribeAppearance(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAppearance(next: AppearancePreference): void {
  preference = next;
  applyNative(next);
  listeners.forEach((listener) => listener());
  try {
    SecureStore.setItem(KEY, next);
  } catch {
    // Not persisted (no keychain access yet) — the choice still applies for this session.
  }
}

/** Call once, at module load of `src/app/_layout.tsx`. Synchronous by design. */
export function applyStoredAppearance(): void {
  try {
    const stored = SecureStore.getItem(KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') preference = stored;
  } catch {
    preference = 'system';
  }
  applyNative(preference);
}

function applyNative(value: AppearancePreference) {
  Appearance.setColorScheme(value === 'system' ? 'unspecified' : value);
}
