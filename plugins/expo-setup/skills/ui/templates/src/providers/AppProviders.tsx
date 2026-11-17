import '@/lib/setupCore';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ToastProvider } from '@tamagui/toast';
import { BlurTargetView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { TamaguiProvider } from 'tamagui';

import { ActionLock } from '@/components/feedback/ActionLock';
import { AppToast } from '@/components/feedback/AppToast';
import { ConfirmDialogHost } from '@/components/feedback/ConfirmDialogHost';
import { dialogBlurTarget } from '@/components/feedback/dialogBlurTarget';
import { useColorSchemeName } from '@/hooks/useColorSchemeName';
import { CoreQueryProvider } from '@/lib/core';
import { tamaguiConfig } from '@/theme/tamagui.config';

/**
 * Every app-wide provider, outer → inner:
 * gestures → server data → UI kit (includes PortalProvider) → toasts → keyboard → blur target → bottom sheets.
 * GestureHandlerRootView must be outermost; KeyboardProvider must sit above the sheets.
 *
 * - `defaultTheme` follows `useColorSchemeName()` — the user's Light / Dark / System choice (`appearance.store.ts`).
 * - `BlurTargetView` holds the screens and their sheets: it is what the confirm dialog blurs on Android.
 * - `ActionLock` sits after the sheets so it covers them while a mutation runs.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const colorScheme = useColorSchemeName();
  return (
    <GestureHandlerRootView style={styles.root}>
      <CoreQueryProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme}>
          <ToastProvider swipeDirection="up" duration={3500}>
            <KeyboardProvider>
              <BlurTargetView ref={dialogBlurTarget} style={styles.root}>
                <BottomSheetModalProvider>
                  {children}
                  <ConfirmDialogHost />
                </BottomSheetModalProvider>
              </BlurTargetView>
              <ActionLock />
            </KeyboardProvider>
            <AppToast />
          </ToastProvider>
        </TamaguiProvider>
      </CoreQueryProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
