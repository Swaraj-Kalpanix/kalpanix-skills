import { act, renderHook } from '@testing-library/react-native';

import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns the initial value immediately and updates only after the delay', async () => {
    const { result, rerender } = await renderHook(({ value }: { value: string }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });
    expect(result.current).toBe('a');

    await rerender({ value: 'ab' });
    await act(async () => jest.advanceTimersByTime(299));
    expect(result.current).toBe('a');
    await act(async () => jest.advanceTimersByTime(1));
    expect(result.current).toBe('ab');
  });

  it('restarts the timer on every change (only the last value lands)', async () => {
    const { result, rerender } = await renderHook(({ value }: { value: string }) => useDebounce(value), {
      initialProps: { value: 'a' },
    });
    await rerender({ value: 'ab' });
    await act(async () => jest.advanceTimersByTime(300));
    await rerender({ value: 'abc' });
    await act(async () => jest.advanceTimersByTime(300));
    expect(result.current).toBe('a');
    await act(async () => jest.advanceTimersByTime(100));
    expect(result.current).toBe('abc');
  });
});
