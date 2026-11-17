import type { LucideIcon } from 'lucide-react-native';
import { Inbox } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Theme, useTheme, YStack } from 'tamagui';

import { Muted, Subtitle } from './Text';

/**
 * What a list or screen shows when it has nothing — or could not load.
 *
 * The icon sits in a soft round tile so an empty screen looks designed rather than broken; the title says
 * what is missing in plain words, the description what to do about it, and `action` is the one button that
 * does it.
 */
export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'empty' | 'error';
}

export function EmptyState({ icon = Inbox, title, description, action, variant = 'empty' }: EmptyStateProps) {
  return (
    <YStack flex={1} items="center" justify="center" gap="$3.5" px="$5" py="$8">
      {variant === 'error' ? (
        <Theme name="red">
          <IconTile icon={icon} />
        </Theme>
      ) : (
        <IconTile icon={icon} />
      )}
      <YStack items="center" gap="$1.5">
        <Subtitle text="center">{title}</Subtitle>
        {description ? (
          <Muted text="center" maxW={300}>
            {description}
          </Muted>
        ) : null}
      </YStack>
      {action}
    </YStack>
  );
}

/** Its own component so `useTheme` reads the theme the tile is wrapped in — red for an error. */
function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  const theme = useTheme();
  return (
    <YStack width={64} height={64} rounded={1000} bg="$color3" items="center" justify="center">
      <Icon size={28} color={theme.color10?.val} strokeWidth={1.75} />
    </YStack>
  );
}

/** The whole-screen "no connection" state. */
export function OfflineState({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      variant="error"
      title="No connection"
      description="This screen needs a connection. Your work is not lost — reconnect and try again."
      action={action}
    />
  );
}
