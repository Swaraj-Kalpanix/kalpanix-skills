import { renderHook } from '@testing-library/react-native';
import type { Href } from 'expo-router';

import { useNavigationGuard } from '../useNavigationGuard';

const mockRouter = { push: jest.fn(), navigate: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

// The core is app-agnostic, so these paths are not this app's typed routes.
const to = (path: string) => path as Href;

describe('useNavigationGuard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());

  it('forwards navigation to the router', async () => {
    const { result } = await renderHook(() => useNavigationGuard(0));
    result.current.push(to('/leads'));
    result.current.navigate(to('/deals'));
    result.current.replace(to('/login'));
    result.current.back();
    expect(mockRouter.push).toHaveBeenCalledWith('/leads');
    expect(mockRouter.navigate).toHaveBeenCalledWith('/deals');
    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('drops repeat taps inside the lock window, across all methods', async () => {
    const { result } = await renderHook(() => useNavigationGuard(500));
    result.current.push(to('/leads/1'));
    result.current.push(to('/leads/1'));
    result.current.back();
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.back).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    result.current.push(to('/leads/2'));
    expect(mockRouter.push).toHaveBeenCalledTimes(2);
  });
});
