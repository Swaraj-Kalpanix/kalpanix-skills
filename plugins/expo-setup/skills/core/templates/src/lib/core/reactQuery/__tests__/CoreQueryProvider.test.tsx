import { focusManager, onlineManager, useQueryClient } from '@tanstack/react-query';
import { render, renderHook, screen } from '@testing-library/react-native';
import * as Network from 'expo-network';
import type { ReactNode } from 'react';
import { AppState, Text, type AppStateStatus } from 'react-native';

import { createTestQueryClient } from '../../test/createQueryWrapper';
import { CoreQueryProvider, setupReactNativeQueryManagers } from '../CoreQueryProvider';

jest.mock('expo-network', () => ({
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
  getNetworkStateAsync: jest.fn(async () => ({ isConnected: true })),
}));

// Runs first: setup is one-time module state, and rendering the provider below also triggers it.
describe('setupReactNativeQueryManagers', () => {
  afterAll(() => jest.restoreAllMocks());

  it('installs AppState focus and expo-network online listeners, exactly once', () => {
    const setFocus = jest.spyOn(focusManager, 'setEventListener');
    const setOnline = jest.spyOn(onlineManager, 'setEventListener');
    let onAppState: ((status: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      onAppState = listener as (status: AppStateStatus) => void;
      return { remove: jest.fn() } as never;
    });

    setupReactNativeQueryManagers();
    setupReactNativeQueryManagers(); // idempotent

    expect(setFocus).toHaveBeenCalledTimes(1);
    expect(setOnline).toHaveBeenCalledTimes(1);

    onAppState?.('background');
    expect(focusManager.isFocused()).toBe(false);
    onAppState?.('active');
    expect(focusManager.isFocused()).toBe(true);

    const onNetwork = jest.mocked(Network.addNetworkStateListener).mock.calls[0][0] as (s: { isConnected?: boolean }) => void;
    onNetwork({ isConnected: false });
    expect(onlineManager.isOnline()).toBe(false);
    onNetwork({ isConnected: true });
    expect(onlineManager.isOnline()).toBe(true);
    expect(Network.getNetworkStateAsync).toHaveBeenCalled();
  });
});

describe('CoreQueryProvider', () => {
  it('renders children inside a QueryClientProvider', async () => {
    await render(
      <CoreQueryProvider>
        <Text>inside</Text>
      </CoreQueryProvider>,
    );
    expect(screen.getByText('inside')).toBeTruthy();
  });

  it('uses the client passed in', async () => {
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <CoreQueryProvider client={client}>{children}</CoreQueryProvider>;
    const { result } = await renderHook(() => useQueryClient(), { wrapper });
    expect(result.current).toBe(client);
  });
});
