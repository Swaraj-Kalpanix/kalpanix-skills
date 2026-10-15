import '@/lib/setupCore';

import type { ReactNode } from 'react';

import { CoreQueryProvider } from '@/lib/core';

/**
 * Every app-wide provider. The UI phase replaces this file with the full stack
 * (gestures → server data → UI kit → toasts → keyboard → bottom sheets).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <CoreQueryProvider>{children}</CoreQueryProvider>;
}
