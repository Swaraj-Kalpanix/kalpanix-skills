import type { ResponseValidationMode } from '..';
import type { LatencyMs } from './mockServer';

export interface MockConfig {
  /**
   * Requests with no registered mock go to the real API (`true`) or fail with a
   * 404 naming the missing route (`false`). `true` lets features go live one at a time.
   */
  passthrough: boolean;
  /** Simulated latency in ms — a fixed number or a `[min, max]` range. */
  latencyMs: LatencyMs;
  /** Log every mocked request. */
  logging: boolean;
  /** How collection seed data / stored records are checked against their schema. Default: the core's `responseValidation`. */
  validation?: ResponseValidationMode;
}

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

let config: MockConfig = {
  passthrough: false,
  latencyMs: [150, 450],
  logging: isDev,
};

export function getMockConfig(): Readonly<MockConfig> {
  return config;
}

/** Change mock settings at runtime (e.g. `configureMockServer({ latencyMs: 2000 })` to test slow networks). */
export function configureMockServer(partial: Partial<MockConfig>): void {
  config = { ...config, ...partial };
}
