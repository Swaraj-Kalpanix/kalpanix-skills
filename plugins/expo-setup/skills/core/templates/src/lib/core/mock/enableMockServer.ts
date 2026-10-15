import { setHttpAdapter } from '..';
import { configureMockServer, type MockConfig } from './mock.config';
import { createMockAdapter } from './mockAdapter';

let enabled = false;

/**
 * Route every core http client through the mock server. Call once at startup,
 * before feature mocks register (see `src/lib/setupCore.ts`).
 */
export function enableMockServer(options: Partial<MockConfig> = {}): void {
  configureMockServer(options);
  setHttpAdapter(createMockAdapter);
  enabled = true;
}

/** Back to the real network. */
export function disableMockServer(): void {
  setHttpAdapter(null);
  enabled = false;
}

export function isMockServerEnabled(): boolean {
  return enabled;
}
