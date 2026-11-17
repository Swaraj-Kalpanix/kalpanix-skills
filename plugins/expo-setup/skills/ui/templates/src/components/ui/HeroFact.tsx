import type { LucideIcon } from 'lucide-react-native';
import type { ComponentProps, ReactNode } from 'react';
import { Theme, useTheme, XStack, YStack } from 'tamagui';

import { Caption } from './Text';

type ThemeName = ComponentProps<typeof Theme>['name'];

export interface HeroFactProps {
  /** The glyph on the round chip. Ignored when `leading` is given. */
  icon?: LucideIcon;
  /** Drawn in place of the chip — an avatar, for instance. */
  leading?: ReactNode;
  /** The chip's colour: a Tamagui child theme. The app's neutral palette when absent. */
  tone?: ThemeName;
  /** The small grey label over the value — "Status", "Due date", "Assigned to". */
  label: string;
  /** The value: text, which wraps rather than being cut. */
  children: ReactNode;
  /** Beside the fact, at its right — a button, for instance. Never squeezed: the value wraps first. */
  trailing?: ReactNode;
  onPress?: () => void;
  /** Dimmed, still pressable: the role cannot do this, and pressing says so. */
  muted?: boolean;
  accessibilityLabel?: string;
}

/**
 * One fact on a record's hero: a round tinted chip, a small grey label, and the value under it — a record's
 * status, due date and assignee all read the same way. Pressable when it opens something; the value wraps,
 * however long.
 */
export function HeroFact({ icon, leading, tone, label, children, trailing, onPress, muted, accessibilityLabel }: HeroFactProps) {
  return (
    <XStack
      minW={0}
      items="center"
      gap="$2.5"
      opacity={muted ? 0.4 : 1}
      onPress={onPress}
      transition="quick"
      pressStyle={onPress ? { opacity: muted ? 0.3 : 0.7 } : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      {leading ?? (icon ? <FactChip icon={icon} tone={tone} /> : null)}
      <YStack flex={1} minW={0}>
        <Caption color="$color10">{label}</Caption>
        {children}
      </YStack>
      {trailing}
    </XStack>
  );
}

function FactChip({ icon, tone }: { icon: LucideIcon; tone?: ThemeName }) {
  const chip = <FactChipBody icon={icon} />;
  return tone ? <Theme name={tone}>{chip}</Theme> : chip;
}

function FactChipBody({ icon: Icon }: { icon: LucideIcon }) {
  const theme = useTheme();
  return (
    <XStack width={34} height={34} rounded={1000} bg="$color3" items="center" justify="center" shrink={0}>
      <Icon size={16} color={theme.color11?.val} />
    </XStack>
  );
}
