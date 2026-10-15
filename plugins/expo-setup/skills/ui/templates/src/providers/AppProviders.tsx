import '@/lib/setupCore';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ToastProvider } from '@tamagui/toast';
import type { ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { TamaguiProvider } from 'tamagui';

import { AppToast } from '@/components/feedback/AppToast';
import { ConfirmDialogHost } from '@/components/feedback/ConfirmDialogHost';
import { CoreQueryProvider } from '@/lib/core';
import { tamaguiConfig } from '@/theme/tamagui.config';

/**
 * Every app-wide provider, outer → inner:
 * gestures → server data → UI kit (includes PortalProvider) → toasts → keyboard → bottom sheets.
 * GestureHandlerRootView must be outermost; KeyboardProvider must sit above the sheets.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={styles.root}>
      <CoreQueryProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}>
          <ToastProvider swipeDirection="up" duration={3500}>
            <KeyboardProvider>
              <BottomSheetModalProvider>
                {children}
                <ConfirmDialogHost />
              </BottomSheetModalProvider>
            </KeyboardProvider>
            <AppToast />
          </ToastProvider>
        </TamaguiProvider>
      </CoreQueryProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
