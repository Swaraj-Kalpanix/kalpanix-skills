import { createRef, type ComponentRef } from 'react';
import type { View } from 'react-native';

/**
 * What the confirm dialog blurs on Android, where `expo-blur` needs a `BlurTargetView` around the content. Set in
 * `AppProviders`, read by `ConfirmDialogHost`. The dialog itself is portalled outside it, so it never blurs itself.
 */
// `ComponentRef<typeof View>`, not `View`: from React Native 0.83 `View` is a function component whose instance type
// is `ReactNativeElement`, and the class-style `View` type no longer fits a ref.
export const dialogBlurTarget = createRef<ComponentRef<typeof View>>();
