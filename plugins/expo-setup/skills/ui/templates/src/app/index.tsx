import { router, Stack } from 'expo-router';
import { Palette } from 'lucide-react-native';

import { Button, EmptyState, Screen } from '@/components/ui';

// Placeholder home route — replace with a feature screen.
export default function HomeScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ title: '{{APP_NAME}}' }} />
      <EmptyState
        icon={Palette}
        title="{{APP_NAME}}"
        description="UI foundation ready."
        action={__DEV__ ? <Button variant="primary" onPress={() => router.push('/design-system')}>Open the design system</Button> : undefined}
      />
    </Screen>
  );
}
