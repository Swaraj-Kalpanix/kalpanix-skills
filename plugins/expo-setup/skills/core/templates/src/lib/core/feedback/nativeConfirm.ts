import { Alert, Platform } from 'react-native';

import { DEFAULT_CONFIRM_TITLE, type ConfirmOptions } from './confirm.types';

/**
 * Fallback used when no confirm dialog UI is mounted: the platform's own
 * alert on iOS/Android, `window.confirm` on web.
 */
export function nativeConfirm(options: ConfirmOptions): Promise<boolean> {
  const title = options.title ?? DEFAULT_CONFIRM_TITLE;

  if (Platform.OS === 'web') {
    const browserConfirm = (globalThis as { confirm?: (message: string) => boolean }).confirm;
    const message = [title, options.description].filter(Boolean).join('\n\n');
    return Promise.resolve(browserConfirm ? browserConfirm(message) : false);
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      options.description,
      [
        { text: options.cancelLabel ?? 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: options.confirmLabel ?? 'Confirm',
          style: options.variant === 'destructive' ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
