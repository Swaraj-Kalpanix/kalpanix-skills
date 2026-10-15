/**
 * Mock server — an in-memory API behind the core's http clients.
 * Entry point `@/lib/core/mock` — wired to the core only through `setHttpAdapter`;
 * nothing else in the core imports this folder, and `@/lib/core` does not re-export it.
 * See USAGE.md.
 */
export { disableMockServer, enableMockServer, isMockServerEnabled } from './enableMockServer';
export { configureMockServer, getMockConfig, type MockConfig } from './mock.config';
export { createMockAdapter } from './mockAdapter';
export { mockCollection, type MockCollection, type MockCollectionOptions } from './mockCollection';
export { applyListQuery, matchesCondition, parseNestQuery, parseRestQuery, type NormalizedListQuery } from './mockQuery';
export {
  MockResponse,
  mockError,
  mockResponse,
  mockServer,
  type HttpMethod,
  type LatencyMs,
  type MockHandler,
  type MockRequest,
  type MockRouteOptions,
} from './mockServer';
