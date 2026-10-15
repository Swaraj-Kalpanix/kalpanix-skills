import { act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { confirm, confirmStore } from '../confirm.store';
import { useConfirmDialog } from '../useConfirmDialog';

describe('useConfirmDialog', () => {
  afterEach(() => jest.restoreAllMocks());

  it('registers as the dialog host while mounted and reflects the store', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { result, unmount } = await renderHook(() => useConfirmDialog());
    expect(result.current.isOpen).toBe(false);

    let answer: Promise<boolean> | undefined;
    await act(async () => {
      answer = confirm({ title: 'Archive?' });
    });
    expect(alert).not.toHaveBeenCalled(); // the host handles it, not the native fallback
    expect(result.current).toMatchObject({ isOpen: true, isPending: false, options: { title: 'Archive?' } });

    await act(() => result.current.confirm());
    await expect(answer).resolves.toBe(true);
    expect(result.current.isOpen).toBe(false);

    await unmount();
    void confirm({ title: 'After unmount' });
    expect(alert).toHaveBeenCalledTimes(1); // back to the native fallback
  });

  it('cancel closes the dialog', async () => {
    const { result } = await renderHook(() => useConfirmDialog());
    let answer: Promise<boolean> | undefined;
    await act(async () => {
      answer = confirm({ title: 'x' });
    });
    await act(async () => result.current.cancel());
    await expect(answer).resolves.toBe(false);
    expect(confirmStore.getState().isOpen).toBe(false);
  });
});
