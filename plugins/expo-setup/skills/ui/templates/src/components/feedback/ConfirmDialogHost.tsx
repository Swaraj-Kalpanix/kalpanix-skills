import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { AlertDialog, XStack, YStack } from 'tamagui';

import { Button } from '@/components/ui';
import { useColorSchemeName } from '@/hooks/useColorSchemeName';
import { DEFAULT_CONFIRM_TITLE, useConfirmDialog } from '@/lib/core';

import { dialogBlurTarget } from './dialogBlurTarget';

/**
 * Renders the core's confirm requests — `useApiMutation({ meta: { confirm } })`
 * and `confirm()` — as a Tamagui AlertDialog. Mount once (done in `AppProviders`);
 * while mounted it replaces the native Alert fallback.
 *
 * The screen behind blurs, under a dark overlay: gray ink in light mode, near black and a little stronger in dark.
 */
export function ConfirmDialogHost() {
  const { isOpen, isPending, options, confirm, cancel } = useConfirmDialog();
  const destructive = options?.variant === 'destructive';
  const dark = useColorSchemeName() === 'dark';

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) cancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          key="overlay"
          transition="quick"
          bg="transparent"
          opacity={1}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        >
          <BlurView blurTarget={dialogBlurTarget} blurMethod="dimezisBlurView" intensity={35} style={StyleSheet.absoluteFill} />
          <YStack style={StyleSheet.absoluteFill} bg={dark ? '$color1' : '$color12'} opacity={dark ? 0.62 : 0.5} />
        </AlertDialog.Overlay>
        <AlertDialog.Content
          key="content"
          borderWidth={0}
          rounded="$8"
          transition="quick"
          enterStyle={{ opacity: 0, y: -20, scale: 0.95 }}
          exitStyle={{ opacity: 0, y: 10, scale: 0.95 }}
          opacity={1}
          y={0}
          scale={1}
          width="90%"
          maxW={420}
        >
          <YStack gap="$3">
            <AlertDialog.Title size="$7">{options?.title ?? DEFAULT_CONFIRM_TITLE}</AlertDialog.Title>
            <AlertDialog.Description>{options?.description ?? ''}</AlertDialog.Description>
            {/* The app's own buttons, as on every sheet and form: Cancel outlined, the action in the brand colour —
                or outlined red for a destructive one. Not Tamagui's raw accent and red themes, which would differ from the rest. */}
            <XStack gap="$3" mt="$2">
              <Button flex={1} disabled={isPending} onPress={cancel}>
                {options?.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                flex={1}
                variant={destructive ? 'destructive' : 'primary'}
                loading={isPending}
                onPress={() => void confirm()}
              >
                {options?.confirmLabel ?? 'Confirm'}
              </Button>
            </XStack>
          </YStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  );
}
