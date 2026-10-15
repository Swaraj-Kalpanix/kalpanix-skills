export type ConfirmVariant = 'default' | 'destructive' | 'warning' | 'info';

/**
 * Options for `confirm()` and `useApiMutation({ meta: { confirm } })`.
 * Always describe the specific action — the generic fallback title is a last resort.
 */
export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  /**
   * Action to run on confirm. The dialog shows a pending state while it runs
   * and closes when it settles. Errors are left to the action's own handling
   * (the global mutation toast); the dialog never shows its own.
   */
  onConfirm?: () => unknown;
}

export interface ConfirmState {
  isOpen: boolean;
  isPending: boolean;
  options: ConfirmOptions | null;
}

/** Thrown by a confirm-gated `mutateAsync()` when the user cancels. */
export class ConfirmCancelledError extends Error {
  constructor() {
    super('Action cancelled by user');
    this.name = 'ConfirmCancelledError';
  }
}

export const DEFAULT_CONFIRM_TITLE = 'Are you sure?';
