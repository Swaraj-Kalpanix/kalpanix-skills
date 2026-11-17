import { Redirect, Stack } from 'expo-router';

import { DesignSystemScreen } from '@/features/designSystem';

/** Development only — every design-system primitive on one screen. Release builds redirect home. */
export default function DesignSystemRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <>
      <Stack.Screen options={{ title: 'Design system' }} />
      <DesignSystemScreen />
    </>
  );
}
