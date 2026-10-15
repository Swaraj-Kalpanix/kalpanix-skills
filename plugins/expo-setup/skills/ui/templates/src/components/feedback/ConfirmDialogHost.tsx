import { AlertDialog, Button, Spinner, XStack, YStack } from 'tamagui';

import { DEFAULT_CONFIRM_TITLE, useConfirmDialog } from '@/lib/core';

/**
 * Renders the core's confirm requests — `useApiMutation({ meta: { confirm } })`
 * and `confirm()` — as a Tamagui AlertDialog. Mount once (done in `AppProviders`);
 * while mounted it replaces the native Alert fallback.
 */
export function ConfirmDialogHost() {
  const { isOpen, isPending, options, confirm, cancel } = useConfirmDialog();
  const destructive = options?.variant === 'destructive';

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
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <AlertDialog.Content
          key="content"
          bordered
          elevate
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
            <XStack gap="$3" justify="flex-end" mt="$2">
              <AlertDialog.Cancel asChild>
                <Button disabled={isPending}>{options?.cancelLabel ?? 'Cancel'}</Button>
              </AlertDialog.Cancel>
              <Button
                theme={destructive ? 'red' : 'accent'}
                disabled={isPending}
                icon={isPending ? <Spinner /> : undefined}
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
