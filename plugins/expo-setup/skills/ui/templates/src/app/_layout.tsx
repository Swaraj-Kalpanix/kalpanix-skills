import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { useStackScreenOptions } from '@/components/navigation/useStackScreenOptions';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useColorSchemeName } from '@/hooks/useColorSchemeName';
import { AppProviders } from '@/providers/AppProviders';
import { applyStoredAppearance } from '@/theme/appearance.store';

// Keep the splash screen up until fonts are ready.
void SplashScreen.preventAutoHideAsync();

// The stored Light / Dark choice, applied before the first frame so a dark-preferring user never sees a light flash.
applyStoredAppearance();

// A screen that throws while rendering shows a "Try again" screen instead of a blank or a red box.
export { AppErrorBoundary as ErrorBoundary };

export default function RootLayout() {
  const colorScheme = useColorSchemeName();
  const { ready } = useAppFonts();

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <AppProviders>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* Dark icons on light, light icons on dark — left unset, Android draws them white on the light page. */}
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <RootStack />
      </ThemeProvider>
    </AppProviders>
  );
}

/** Inside the providers, so the shared header reads the Tamagui theme. */
function RootStack() {
  const screenOptions = useStackScreenOptions();
  return <Stack screenOptions={screenOptions} />;
}
