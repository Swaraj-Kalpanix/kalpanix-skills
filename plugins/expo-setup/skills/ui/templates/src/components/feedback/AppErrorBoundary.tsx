import type { ErrorBoundaryProps } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useEffect } from 'react';

import { Button, EmptyState, Screen } from '@/components/ui';

/**
 * What a screen shows when it throws while rendering — instead of a blank or a red box.
 *
 * Exported as `ErrorBoundary` from `src/app/(app)/_layout.tsx`, so it covers every signed-in screen and sits
 * **inside** the root providers (theme, toasts) that it needs to render. The user gets one sentence and a way to
 * try again, which re-renders the route.
 */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    // Report the error here (Sentry, Crashlytics, …) as a non-fatal.
  }, [error]);

  return (
    <Screen>
      <EmptyState
        variant="error"
        icon={TriangleAlert}
        title="Something went wrong on this screen"
        description="It has been reported. Try again — if it keeps happening, go back and open it from the list."
        action={
          <Button variant="primary" onPress={() => void retry()}>
            Try again
          </Button>
        }
      />
    </Screen>
  );
}
