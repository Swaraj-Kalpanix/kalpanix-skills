import { XStack, YStack } from 'tamagui';

import { Card } from './Card';

/**
 * The placeholder a list shows on its first load — shaped like the real row (a leading tile, two lines, a
 * trailing pill), so the screen does not jump when the data arrives.
 */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <YStack gap="$2.5">
      {Array.from({ length: rows }, (_, index) => (
        <Card key={index} gap="$3">
          <XStack gap="$3" items="center">
            <YStack width={40} height={40} rounded="$5" bg="$color3" />
            <YStack flex={1} gap="$2">
              <Bar width="55%" />
              <Bar width="80%" />
            </YStack>
            <YStack width={56} height={20} rounded={1000} bg="$color3" />
          </XStack>
        </Card>
      ))}
    </YStack>
  );
}

function Bar({ width }: { width: number | string }) {
  return <YStack height={10} width={width as number} bg="$color3" rounded={1000} />;
}
