/**
 * Core — the app-agnostic data layer. Copy `src/lib/core/` into any Expo app;
 * configure it once with `configureCore()`. See USAGE.md.
 *
 * Import everything from here: `import { CrudService, useApiQuery } from '@/lib/core';`
 * The mock server lives in `./mock` but is NOT exported here — import it from `@/lib/core/mock`
 * (mock mode only) so live builds leave it out. It plugs in through `setHttpAdapter`.
 */

// Config
export {
  configureCore,
  getCoreConfig,
  onCoreConfigChange,
  type CoreConfig,
  type ResponseValidationMode,
} from './config/core.config';

// Errors & types
export { ApiError, isApiError, toApiError, type ApiErrorBody, type ApiErrorCode } from './errors/api.error';
export type { Id, ListParams, PaginatedResponse, SortConfig, SortOrder } from './types/api.types';

// HTTP & auth
export {
  createHttpClient,
  http,
  publicHttp,
  setHttpAdapter,
  type HttpAdapterFactory,
  type HttpClientOptions,
} from './http/client';
export { setAuthAdapter, type AuthAdapter } from './http/auth';

// Services
export { BaseService, type ServiceRequestConfig } from './services/base.service';
export { CrudService, type CrudServiceOptions } from './services/crud.service';
export { validateResponse, issuesToMessages } from './validation/validateResponse';

// Query builders
export type { ListQueryBuilder } from './query/listQuery.types';
export {
  CondOperator,
  NestCrudQueryBuilder,
  makeFilter,
  makeFilterIf,
  makeFilterIn,
  makeFilterRange,
  type FilterInput,
  type NestCrudQueryConfig,
  type QueryFilter,
  type QueryJoin,
  type SCondition,
  type SearchField,
} from './query/nestCrudQuery.builder';
export {
  DEFAULT_REST_PARAMS,
  RestQueryBuilder,
  formatRestSort,
  parseRestSort,
  type RestParamNames,
  type RestQueryConfig,
} from './query/restQuery.builder';

// React Query
export { CoreQueryProvider, setupReactNativeQueryManagers } from './reactQuery/CoreQueryProvider';
export { createQueryClient, shouldRetry } from './reactQuery/queryClient';
export { configureFeedback, type FeedbackConfig, type MutationMeta } from './reactQuery/mutationFeedback';
export { useApiQuery } from './reactQuery/useApiQuery';
export { useApiInfiniteList, type UseApiInfiniteListOptions } from './reactQuery/useApiInfiniteList';
export { useApiMutation } from './reactQuery/useApiMutation';
export { createQueryKeys, type QueryKeys } from './reactQuery/queryKeys';
export { createCrudHooks } from './reactQuery/createCrudHooks';

// Feedback (toasts & confirm)
export { notify, setNotifier, type Notifier } from './feedback/notifier';
export { confirm, confirmStore } from './feedback/confirm.store';
export { useConfirmDialog } from './feedback/useConfirmDialog';
export {
  ConfirmCancelledError,
  DEFAULT_CONFIRM_TITLE,
  type ConfirmOptions,
  type ConfirmState,
  type ConfirmVariant,
} from './feedback/confirm.types';

// Hooks
export { useDebounce } from './hooks/useDebounce';
export { useDebouncedCallback, type DebouncedFunction } from './hooks/useDebouncedCallback';
export { useNavigationGuard } from './hooks/useNavigationGuard';

// Utils
export { toPaginated, getNextPage } from './utils/pagination';
export {
  parseQueryString,
  toQueryString,
  withQuery,
  type ArrayFormat,
  type ParsedQuery,
  type QueryRecord,
} from './utils/queryString';
