import { useMutation, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';

import { toApiError, type ApiError } from '../errors/api.error';
import { confirmStore } from '../feedback/confirm.store';
import { ConfirmCancelledError, DEFAULT_CONFIRM_TITLE } from '../feedback/confirm.types';

/**
 * `useMutation` with the error pinned to `ApiError`, global toasts (see
 * `mutation-feedback.ts`), and an optional confirm step.
 *
 * ```ts
 * const removeLead = useApiMutation({
 *   mutationFn: (id: Id) => leadService.remove(id),
 *   meta: {
 *     confirm: { variant: 'destructive', title: 'Delete lead?', description: 'This cannot be undone.' },
 *     successMessage: 'Lead deleted',
 *     invalidates: [leadKeys.lists()],
 *   },
 * });
 *
 * removeLead.mutate(id);            // confirm → run → toast
 * await removeLead.mutateAsync(id); // rejects with ConfirmCancelledError if cancelled
 * ```
 *
 * With `meta.confirm`, both `mutate` and `mutateAsync` ask first. The dialog
 * stays open in a pending state while the mutation runs.
 */
export function useApiMutation<TData = unknown, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, ApiError, TVariables, TContext>,
): UseMutationResult<TData, ApiError, TVariables, TContext> {
  const { mutationFn } = options;
  const mutation = useMutation<TData, ApiError, TVariables, TContext>({
    ...options,
    mutationFn: mutationFn
      ? async (variables, context) => {
          try {
            return await mutationFn(variables, context);
          } catch (error) {
            throw toApiError(error);
          }
        }
      : undefined,
  });

  const confirmMeta = options.meta?.confirm;
  if (!confirmMeta) return mutation;

  const confirmOptions = confirmMeta === true ? { title: DEFAULT_CONFIRM_TITLE } : confirmMeta;

  const guardedMutateAsync: typeof mutation.mutateAsync = (...args) =>
    new Promise<TData>((resolve, reject) => {
      void confirmStore
        .open({
          ...confirmOptions,
          onConfirm: () => mutation.mutateAsync(...args).then(resolve, reject),
        })
        .then((confirmed) => {
          if (!confirmed) reject(new ConfirmCancelledError());
        });
    });

  return {
    ...mutation,
    mutate: (...args) => {
      // Errors are already surfaced by the global toast; `mutate` has no promise to reject.
      guardedMutateAsync(...args).catch(() => {});
    },
    mutateAsync: guardedMutateAsync,
  };
}
