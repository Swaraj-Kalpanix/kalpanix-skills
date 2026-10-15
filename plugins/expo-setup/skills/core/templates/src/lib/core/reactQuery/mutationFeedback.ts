import { MutationCache, type QueryClient, type QueryKey } from '@tanstack/react-query';

import type { ApiError } from '../errors/api.error';
import type { ConfirmOptions } from '../feedback/confirm.types';
import { notify } from '../feedback/notifier';

/**
 * Per-mutation options — pass as `useApiMutation({ meta: { … } })`.
 */
export interface MutationMeta extends Record<string, unknown> {
  /** `false` suppresses both toasts; `true` forces the success toast even when success toasts are off globally. */
  toast?: boolean;
  /** Success toast text. `false` suppresses only the success toast. Default: the API's `message`, then a generic text. */
  successMessage?: string | false;
  /** Error toast text. `false` suppresses only the error toast. Default: the API's error message. */
  errorMessage?: string | false;
  /** Ask before running. `true` uses the generic copy; pass options to describe the action. */
  confirm?: true | ConfirmOptions;
  /** Query keys to invalidate after success, e.g. `[leadKeys.lists()]`. */
  invalidates?: readonly QueryKey[];
}

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
    mutationMeta: MutationMeta;
  }
}

export interface FeedbackConfig {
  /** Show a success toast for every mutation unless it opts out. Default `true`. */
  successToasts: boolean;
  /** Show an error toast for every failed mutation unless it opts out. Default `true`. */
  errorToasts: boolean;
  defaultSuccessMessage: string;
  defaultErrorMessage: string;
}

let feedback: FeedbackConfig = {
  successToasts: true,
  errorToasts: true,
  defaultSuccessMessage: 'Saved successfully.',
  defaultErrorMessage: 'Something went wrong. Please try again.',
};

export function configureFeedback(partial: Partial<FeedbackConfig>): void {
  feedback = { ...feedback, ...partial };
}

/** The API's own `message` field, if it sent one. */
function responseMessage(data: unknown): string | undefined {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return undefined;
}

/**
 * Global mutation side effects: success / error toasts and `meta.invalidates`.
 * Feature hooks never have to think about toasts.
 */
export function createMutationCache(getClient: () => QueryClient | undefined): MutationCache {
  return new MutationCache({
    onSuccess: (data, _variables, _context, mutation) => {
      const meta = mutation.meta;
      meta?.invalidates?.forEach((queryKey) => void getClient()?.invalidateQueries({ queryKey }));

      if (meta?.toast === false || meta?.successMessage === false) return;
      const explicit = meta?.toast === true || typeof meta?.successMessage === 'string';
      if (!feedback.successToasts && !explicit) return;
      notify.success(meta?.successMessage || responseMessage(data) || feedback.defaultSuccessMessage);
    },

    onError: (error, _variables, _context, mutation) => {
      const meta = mutation.meta;
      if (error?.code === 'CANCELLED') return;
      if (meta?.toast === false || meta?.errorMessage === false) return;
      if (!feedback.errorToasts && typeof meta?.errorMessage !== 'string') return;
      notify.error(meta?.errorMessage || error?.message || feedback.defaultErrorMessage);
    },
  });
}
