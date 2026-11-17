import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { SizableText, Theme, useTheme, XStack, YStack } from 'tamagui';

import { Caption } from './Text';

/**
 * A tappable banner at the top of a list that says work is waiting — "4 orders overdue", "2 items expiring"
 * — and opens the view that holds it.
 *
 * A pill is a filter you have to think to press; this says the work exists. A screen shows it only while that view
 * is not already on screen, and only when the count is above zero — a banner reading "0 due" is noise.
 *
 * `tone` is a Tamagui child theme: `orange` for "due soon", `red` for something already late.
 */
export interface ActionBannerProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  tone?: 'orange' | 'red' | 'blue';
  onPress: () => void;
  accessibilityLabel?: string;
}

export function ActionBanner({ tone = 'orange', ...props }: ActionBannerProps) {
  return (
    <Theme name={tone}>
      <BannerBody {...props} />
    </Theme>
  );
}

/** Inside the tone's theme, so `useTheme` gives the icons its colour. */
function BannerBody({ icon: Icon, title, subtitle, onPress, accessibilityLabel }: Omit<ActionBannerProps, 'tone'>) {
  const theme = useTheme();

  return (
    <XStack
      items="center"
      gap="$3"
      p="$3"
      mb="$3"
      bg="$color2"
      borderWidth={1}
      borderColor="$color5"
      rounded="$6"
      transition="quicker"
      pressStyle={{ scale: 0.99, bg: '$color3' }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
    >
      <XStack width={36} height={36} rounded="$5" bg="$color4" items="center" justify="center">
        <Icon size={18} color={theme.color11?.val} />
      </XStack>
      <YStack flex={1} minW={0}>
        <SizableText size="$4" fontWeight="600" color="$color12">
          {title}
        </SizableText>
        {subtitle ? <Caption color="$color11">{subtitle}</Caption> : null}
      </YStack>
      <ChevronRight size={18} color={theme.color10?.val} />
    </XStack>
  );
}
