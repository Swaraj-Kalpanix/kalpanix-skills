/**
 * Toast bridge. The core calls `notify.*`; the app plugs in its toast library
 * once with `setNotifier()` — so swapping UI libraries never touches the core.
 *
 * ```ts
 * setNotifier({ success: (m) => toast.success(m), error: (m) => toast.error(m) });
 * ```
 */
export interface Notifier {
  success(message: string): void;
  error(message: string): void;
  info?(message: string): void;
}

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

/** Used until the app installs a real notifier: logs in development, silent in production. */
const consoleNotifier: Notifier = {
  success: (message) => isDev && console.log(`[notify:success] ${message}`),
  error: (message) => isDev && console.warn(`[notify:error] ${message}`),
  info: (message) => isDev && console.log(`[notify:info] ${message}`),
};

let current: Notifier = consoleNotifier;

/** Install the app's toast implementation (`null` restores the console fallback). */
export function setNotifier(notifier: Notifier | null): void {
  current = notifier ?? consoleNotifier;
}

export const notify = {
  success: (message: string) => current.success(message),
  error: (message: string) => current.error(message),
  info: (message: string) => (current.info ?? current.success).call(current, message),
};
