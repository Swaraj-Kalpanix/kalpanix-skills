import type { ConfirmOptions, ConfirmState } from './confirm.types';
import { nativeConfirm } from './nativeConfirm';

/**
 * Global confirm dialog state — a tiny external store with no UI. A dialog
 * component (from whichever UI library the app picks) renders it via
 * `useConfirmDialog()`. Until one is mounted, `open()` falls back to the
 * platform's native alert, so confirmations never silently hang.
 */

let state: ConfirmState = { isOpen: false, isPending: false, options: null };
let resolvePending: ((confirmed: boolean) => void) | null = null;
let hostCount = 0;
const listeners = new Set<() => void>();

function setState(next: ConfirmState) {
  state = next;
  listeners.forEach((listener) => listener());
}

// Keep `options` while closing so the dialog's exit animation doesn't flash fallback text.
function close() {
  resolvePending = null;
  setState({ ...state, isOpen: false, isPending: false });
}

async function runAfterNativeConfirm(options: ConfirmOptions): Promise<boolean> {
  const confirmed = await nativeConfirm(options);
  if (confirmed && options.onConfirm) {
    try {
      await options.onConfirm();
    } catch {
      // Surfaced by the action's own error handling.
    }
  }
  return confirmed;
}

export const confirmStore = {
  getState: (): ConfirmState => state,

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Called by `useConfirmDialog()`. Returns the unregister function. */
  registerHost(): () => void {
    hostCount += 1;
    return () => {
      hostCount -= 1;
    };
  },

  /** Ask for confirmation. Resolves `true` once confirmed (after `onConfirm` settles), `false` if cancelled. */
  open(options: ConfirmOptions): Promise<boolean> {
    if (hostCount === 0) return runAfterNativeConfirm(options);
    resolvePending?.(false); // a newer request replaces an unanswered one
    return new Promise<boolean>((resolve) => {
      resolvePending = resolve;
      setState({ isOpen: true, isPending: false, options });
    });
  },

  cancel(): void {
    if (state.isPending) return;
    resolvePending?.(false);
    close();
  },

  async confirm(): Promise<void> {
    const { options, isPending } = state;
    if (!options || isPending) return;
    const resolve = resolvePending;

    if (options.onConfirm) {
      setState({ ...state, isPending: true });
      try {
        await options.onConfirm();
      } catch {
        // Surfaced by the action's own error handling; the dialog just must not hang.
      }
    }
    resolve?.(true);
    close();
  },
};

/** `if (await confirm({ title: 'Discard changes?', variant: 'destructive' })) router.back();` */
export const confirm = (options: ConfirmOptions) => confirmStore.open(options);
