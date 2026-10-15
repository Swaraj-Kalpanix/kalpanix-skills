import { Alert, Platform, type AlertButton } from 'react-native';

import { confirm, confirmStore } from '../confirm.store';

/** Press a button of the last native alert by its label. */
function pressAlertButton(label: string) {
  const buttons = (jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? []) as AlertButton[];
  buttons.find((b) => b.text === label)?.onPress?.();
}

describe('confirmStore with a dialog host mounted', () => {
  let unregister: () => void;
  beforeEach(() => {
    unregister = confirmStore.registerHost();
  });
  afterEach(() => {
    confirmStore.cancel();
    unregister();
  });

  it('opens with options and notifies subscribers', () => {
    const listener = jest.fn();
    const unsubscribe = confirmStore.subscribe(listener);
    void confirm({ title: 'Delete lead?', variant: 'destructive' });
    expect(confirmStore.getState()).toEqual({ isOpen: true, isPending: false, options: { title: 'Delete lead?', variant: 'destructive' } });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('resolves true on confirm and false on cancel', async () => {
    const first = confirm({ title: 'A' });
    await confirmStore.confirm();
    await expect(first).resolves.toBe(true);

    const second = confirm({ title: 'B' });
    confirmStore.cancel();
    await expect(second).resolves.toBe(false);
  });

  it('keeps options while closing (for the exit animation)', async () => {
    void confirm({ title: 'Keep me' });
    confirmStore.cancel();
    expect(confirmStore.getState()).toMatchObject({ isOpen: false, options: { title: 'Keep me' } });
  });

  it('shows a pending state while onConfirm runs, ignores cancel meanwhile, then closes', async () => {
    let finish!: () => void;
    const onConfirm = jest.fn(() => new Promise<void>((r) => (finish = r)));
    const result = confirm({ title: 'Save?', onConfirm });

    const confirming = confirmStore.confirm();
    expect(confirmStore.getState()).toMatchObject({ isOpen: true, isPending: true });
    confirmStore.cancel(); // ignored while pending
    void confirmStore.confirm(); // ignored while pending
    expect(onConfirm).toHaveBeenCalledTimes(1);

    finish();
    await confirming;
    await expect(result).resolves.toBe(true);
    expect(confirmStore.getState()).toMatchObject({ isOpen: false, isPending: false });
  });

  it('still closes and resolves true when onConfirm throws', async () => {
    const result = confirm({
      onConfirm: async () => {
        throw new Error('failed');
      },
    });
    await confirmStore.confirm();
    await expect(result).resolves.toBe(true);
    expect(confirmStore.getState().isOpen).toBe(false);
  });

  it('a newer request cancels an unanswered one', async () => {
    const older = confirm({ title: 'Old' });
    const newer = confirm({ title: 'New' });
    await expect(older).resolves.toBe(false);
    expect(confirmStore.getState().options?.title).toBe('New');
    await confirmStore.confirm();
    await expect(newer).resolves.toBe(true);
  });

  it('confirm() without an open dialog is a no-op', async () => {
    confirmStore.cancel();
    await expect(confirmStore.confirm()).resolves.toBeUndefined();
  });
});

describe('confirmStore without a host (native fallback)', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('uses Alert.alert with the given labels and destructive style', async () => {
    const result = confirm({ title: 'Delete?', description: 'Gone forever', confirmLabel: 'Delete', cancelLabel: 'Keep', variant: 'destructive' });
    const [title, message, buttons, options] = jest.mocked(Alert.alert).mock.calls[0];
    expect(title).toBe('Delete?');
    expect(message).toBe('Gone forever');
    expect(buttons).toEqual([
      expect.objectContaining({ text: 'Keep', style: 'cancel' }),
      expect.objectContaining({ text: 'Delete', style: 'destructive' }),
    ]);
    expect(options).toMatchObject({ cancelable: true });

    pressAlertButton('Delete');
    await expect(result).resolves.toBe(true);
    expect(confirmStore.getState().isOpen).toBe(false); // never used the dialog state
  });

  it('defaults the title and labels, resolves false on cancel or dismiss', async () => {
    const cancelled = confirm({});
    expect(jest.mocked(Alert.alert).mock.calls[0][0]).toBe('Are you sure?');
    pressAlertButton('Cancel');
    await expect(cancelled).resolves.toBe(false);

    const dismissed = confirm({});
    (jest.mocked(Alert.alert).mock.calls[1][3] as { onDismiss: () => void }).onDismiss();
    await expect(dismissed).resolves.toBe(false);
  });

  it('runs onConfirm after the native confirm, swallowing its errors', async () => {
    const onConfirm = jest.fn(async () => {
      throw new Error('x');
    });
    const result = confirm({ title: 'Go', onConfirm });
    pressAlertButton('Confirm');
    await expect(result).resolves.toBe(true);
    expect(onConfirm).toHaveBeenCalled();
  });

  it('does not run onConfirm when cancelled', async () => {
    const onConfirm = jest.fn();
    const result = confirm({ onConfirm });
    pressAlertButton('Cancel');
    await result;
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('uses window.confirm on web', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const browserConfirm = jest.fn(() => true);
    (globalThis as { confirm?: unknown }).confirm = browserConfirm;

    await expect(confirm({ title: 'Leave?', description: 'Unsaved changes' })).resolves.toBe(true);
    expect(browserConfirm).toHaveBeenCalledWith('Leave?\n\nUnsaved changes');
    expect(Alert.alert).not.toHaveBeenCalled();

    delete (globalThis as { confirm?: unknown }).confirm;
    await expect(confirm({ title: 'x' })).resolves.toBe(false);
  });
});
