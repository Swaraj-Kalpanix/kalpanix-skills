import { Stack } from 'expo-router';
import { H2, Paragraph, YStack } from 'tamagui';

// Placeholder home route — replace with a feature screen.
export default function HomeScreen() {
  return (
    <YStack flex={1} items="center" justify="center" gap="$2" bg="$background" p="$4">
      <Stack.Screen options={{ title: '{{APP_NAME}}' }} />
      <H2>{{APP_NAME}}</H2>
      <Paragraph color="$color10">UI foundation ready</Paragraph>
    </YStack>
  );
}
