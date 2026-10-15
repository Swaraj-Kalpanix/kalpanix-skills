import { useEffect, useSyncExternalStore } from 'react';

import { confirmStore } from './confirm.store';

/**
 * For the app's confirm dialog component. Mount exactly one dialog near the
 * root; while it is mounted, confirmations render there instead of the
 * native alert fallback.
 *
 * ```tsx
 * export function ConfirmDialogHost() {
 *   const { isOpen, isPending, options, confirm, cancel } = useConfirmDialog();
 *   return <Dialog open={isOpen} onClose={cancel}>…<Button loading={isPending} onPress={confirm} /></Dialog>;
 * }
 * ```
 */
export function useConfirmDialog() {
  useEffect(() => confirmStore.registerHost(), []);
  const state = useSyncExternalStore(confirmStore.subscribe, confirmStore.getState, confirmStore.getState);
  return { ...state, confirm: confirmStore.confirm, cancel: confirmStore.cancel };
}
