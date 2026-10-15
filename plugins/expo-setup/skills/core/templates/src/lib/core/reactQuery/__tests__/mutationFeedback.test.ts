import type { MutationOptions, QueryClient } from '@tanstack/react-query';

import { ApiError } from '../../errors/api.error';
import { setNotifier } from '../../feedback/notifier';
import { createTestQueryClient } from '../../test/createQueryWrapper';
import { configureFeedback, type MutationMeta } from '../mutationFeedback';

const notifier = { success: jest.fn(), error: jest.fn() };

/** Run a mutation through the client's MutationCache (which owns the global feedback). */
function run(client: QueryClient, mutationFn: () => Promise<unknown>, meta?: MutationMeta) {
  const options = { mutationFn, meta } as MutationOptions<unknown, ApiError, void>;
  return client.getMutationCache().build(client, options).execute(undefined).catch(() => undefined);
}

describe('global mutation feedback', () => {
  let client: QueryClient;
  beforeEach(() => {
    client = createTestQueryClient();
    setNotifier(notifier);
    jest.clearAllMocks();
  });
  afterEach(() => {
    setNotifier(null);
    configureFeedback({ successToasts: true, errorToasts: true });
  });

  describe('success', () => {
    it('prefers meta.successMessage, then the API message, then the default', async () => {
      await run(client, async () => ({ message: 'Server says ok' }), { successMessage: 'Lead created' });
      await run(client, async () => ({ message: 'Server says ok' }));
      await run(client, async () => ({ id: 1 }));
      await run(client, async () => ({ message: '   ' }));
      expect(notifier.success.mock.calls).toEqual([['Lead created'], ['Server says ok'], ['Saved successfully.'], ['Saved successfully.']]);
    });

    it('is silenced by toast: false or successMessage: false', async () => {
      await run(client, async () => ({}), { toast: false });
      await run(client, async () => ({}), { successMessage: false });
      expect(notifier.success).not.toHaveBeenCalled();
    });

    it('respects successToasts: false unless the mutation asks explicitly', async () => {
      configureFeedback({ successToasts: false });
      await run(client, async () => ({}));
      await run(client, async () => ({}), { toast: true });
      await run(client, async () => ({}), { successMessage: 'Explicit' });
      expect(notifier.success.mock.calls).toEqual([['Saved successfully.'], ['Explicit']]);
    });

    it('invalidates meta.invalidates keys', async () => {
      const invalidate = jest.spyOn(client, 'invalidateQueries');
      await run(client, async () => ({}), { invalidates: [['leads', 'list'], ['dashboard']], toast: false });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['leads', 'list'] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
    });
  });

  describe('error', () => {
    const fail = (error: unknown) => async () => {
      throw error;
    };

    it('prefers meta.errorMessage, then the error message, then the default', async () => {
      await run(client, fail(new ApiError('Lead not found', { code: 'HTTP', status: 404 })), { errorMessage: 'Could not load' });
      await run(client, fail(new ApiError('Lead not found', { code: 'HTTP', status: 404 })));
      await run(client, fail(new ApiError('', { code: 'UNKNOWN' })));
      expect(notifier.error.mock.calls).toEqual([['Could not load'], ['Lead not found'], ['Something went wrong. Please try again.']]);
    });

    it('is silenced by toast: false, errorMessage: false, and for cancellations', async () => {
      await run(client, fail(new ApiError('x', { code: 'HTTP' })), { toast: false });
      await run(client, fail(new ApiError('x', { code: 'HTTP' })), { errorMessage: false });
      await run(client, fail(new ApiError('x', { code: 'CANCELLED' })));
      expect(notifier.error).not.toHaveBeenCalled();
    });

    it('respects errorToasts: false unless errorMessage is set', async () => {
      configureFeedback({ errorToasts: false });
      await run(client, fail(new ApiError('x', { code: 'HTTP' })));
      await run(client, fail(new ApiError('x', { code: 'HTTP' })), { errorMessage: 'Shown' });
      expect(notifier.error.mock.calls).toEqual([['Shown']]);
    });

    it('does not invalidate on failure', async () => {
      const invalidate = jest.spyOn(client, 'invalidateQueries');
      await run(client, fail(new ApiError('x', { code: 'HTTP' })), { invalidates: [['leads']], toast: false });
      expect(invalidate).not.toHaveBeenCalled();
    });
  });
});
