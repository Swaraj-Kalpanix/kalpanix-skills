import { act, renderHook, waitFor } from '@testing-library/react-native';

import { ApiError } from '../../errors/api.error';
import { confirmStore } from '../../feedback/confirm.store';
import { ConfirmCancelledError } from '../../feedback/confirm.types';
import { setNotifier } from '../../feedback/notifier';
import { createQueryWrapper } from '../../test/createQueryWrapper';
import { useApiMutation } from '../useApiMutation';

describe('useApiMutation', () => {
  beforeEach(() => setNotifier({ success: jest.fn(), error: jest.fn() }));
  afterEach(() => setNotifier(null));

  it('runs the mutation and returns data', async () => {
    const mutationFn = jest.fn(async (n: number) => n * 2);
    const { wrapper } = createQueryWrapper();
    const { result } = await renderHook(() => useApiMutation({ mutationFn }), { wrapper });

    let value: number | undefined;
    await act(async () => {
      value = await result.current.mutateAsync(21);
    });
    expect(value).toBe(42);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(42);
  });

  it('normalizes thrown errors to ApiError', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = await renderHook(
      () =>
        useApiMutation({
          mutationFn: async () => {
            throw new Error('nope');
          },
        }),
      { wrapper },
    );
    let error: unknown;
    await act(async () => {
      error = await result.current.mutateAsync().catch((e: unknown) => e);
    });
    expect(error).toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.error).toMatchObject({ code: 'UNKNOWN', message: 'nope' }));
  });

  describe('with meta.confirm', () => {
    let unregisterHost: () => void;
    beforeEach(() => {
      unregisterHost = confirmStore.registerHost(); // a dialog host is "mounted"
    });
    afterEach(() => {
      if (confirmStore.getState().isOpen) confirmStore.cancel();
      unregisterHost();
    });

    const setup = async (confirm: true | { title: string; variant?: 'destructive' }) => {
      const mutationFn = jest.fn(async (id: number) => `deleted ${id}`);
      const { wrapper } = createQueryWrapper();
      const hook = await renderHook(() => useApiMutation({ mutationFn, meta: { confirm } }), { wrapper });
      return { mutationFn, ...hook };
    };

    it('opens the dialog with the given options and runs only after confirm', async () => {
      const { result, mutationFn } = await setup({ title: 'Delete lead?', variant: 'destructive' });

      let settled: string | undefined;
      await act(async () => {
        void result.current.mutateAsync(5).then((v) => (settled = v));
      });
      expect(confirmStore.getState()).toMatchObject({ isOpen: true, options: { title: 'Delete lead?', variant: 'destructive' } });
      expect(mutationFn).not.toHaveBeenCalled();

      await act(() => confirmStore.confirm());
      expect(mutationFn).toHaveBeenCalledWith(5, expect.anything());
      expect(settled).toBe('deleted 5');
      expect(confirmStore.getState().isOpen).toBe(false);
    });

    it('uses the generic title for confirm: true', async () => {
      const { result } = await setup(true);
      await act(async () => {
        result.current.mutate(1);
      });
      expect(confirmStore.getState().options?.title).toBe('Are you sure?');
    });

    it('mutateAsync rejects with ConfirmCancelledError on cancel; the mutation never runs', async () => {
      const { result, mutationFn } = await setup({ title: 'Delete?' });
      let rejection: unknown;
      await act(async () => {
        result.current.mutateAsync(1).catch((e: unknown) => (rejection = e));
      });
      await act(async () => confirmStore.cancel());
      expect(rejection).toBeInstanceOf(ConfirmCancelledError);
      expect(mutationFn).not.toHaveBeenCalled();
    });

    it('mutate swallows cancellation', async () => {
      const { result, mutationFn } = await setup({ title: 'Delete?' });
      await act(async () => {
        result.current.mutate(1);
      });
      await act(async () => confirmStore.cancel());
      expect(mutationFn).not.toHaveBeenCalled();
      expect(result.current.isError).toBe(false);
    });

    it('mutate swallows mutation errors (they are surfaced by the global toast)', async () => {
      const { wrapper } = createQueryWrapper();
      const { result } = await renderHook(
        () =>
          useApiMutation({
            mutationFn: async () => {
              throw new ApiError('Server down', { code: 'HTTP', status: 500 });
            },
            meta: { confirm: { title: 'Go?' } },
          }),
        { wrapper },
      );
      await act(async () => {
        result.current.mutate();
      });
      await act(() => confirmStore.confirm());
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(confirmStore.getState().isOpen).toBe(false);
    });
  });
});
