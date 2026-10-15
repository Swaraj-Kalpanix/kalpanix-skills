import { renderHook } from '@testing-library/react-native';

import { useDebouncedCallback } from '../useDebouncedCallback';

describe('useDebouncedCallback', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('calls once with the latest arguments after the delay', async () => {
    const callback = jest.fn();
    const { result } = await renderHook(() => useDebouncedCallback(callback, 200));
    result.current('a');
    result.current('ab');
    jest.advanceTimersByTime(199);
    expect(callback).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('ab');
  });

  it('keeps a stable identity and always calls the latest callback', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { result, rerender } = await renderHook(({ cb }: { cb: (v: string) => void }) => useDebouncedCallback(cb, 100), {
      initialProps: { cb: first },
    });
    const debounced = result.current;
    await rerender({ cb: second });
    expect(result.current).toBe(debounced);

    result.current('x');
    jest.advanceTimersByTime(100);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('x');
  });

  it('supports cancel and flush', async () => {
    const callback = jest.fn();
    const { result } = await renderHook(() => useDebouncedCallback(callback, 100));

    result.current(1);
    result.current.cancel();
    jest.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();

    result.current(2);
    result.current.flush();
    expect(callback).toHaveBeenCalledWith(2);
    result.current.flush(); // nothing pending
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('cancels pending calls on unmount', async () => {
    const callback = jest.fn();
    const { result, unmount } = await renderHook(() => useDebouncedCallback(callback, 100));
    result.current('late');
    await unmount();
    jest.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();
  });
});
