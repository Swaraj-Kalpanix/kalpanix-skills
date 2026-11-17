import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';

import { Muted, Title } from './Text';

/**
 * The large-title header of a module's list — Orders, Customers, Invoices.
 *
 * A module's list is a place, not a step, so it gets a place's header: the name at 28, a live line under it (the
 * count, "3 due today"), and the screen's actions at the right — e.g. the account avatar and the create button.
 * The stack's own small header is hidden on these screens; drill-in screens keep it, because they need a back
 * button and do not need a large title.
 *
 * It draws the top safe-area inset itself, which is why a screen using it passes `edges="none"`/`"bottom"` to
 * `Screen` and the stack hides its header.
 *
 * `children` renders under the title row — the search field and the quick filters — so they stay pinned while
 * the list scrolls beneath.
 */
export interface ScreenHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Before the title — the ☰ that opens the navigation drawer. */
  leading?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function ScreenHeader({ title, subtitle, leading, actions, children }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <YStack bg="$color1" pt={insets.top + 8} pb="$2.5" px="$3.5" gap="$3">
      <XStack items="center" justify="space-between" gap="$3" minH={48}>
        {leading}
        <YStack flex={1} minW={0}>
          <Title numberOfLines={1} accessibilityRole="header">
            {title}
          </Title>
          {subtitle ? typeof subtitle === 'string' ? <Muted numberOfLines={1}>{subtitle}</Muted> : subtitle : null}
        </YStack>
        {actions ? (
          <XStack items="center" gap="$2">
            {actions}
          </XStack>
        ) : null}
      </XStack>
      {children}
    </YStack>
  );
}
