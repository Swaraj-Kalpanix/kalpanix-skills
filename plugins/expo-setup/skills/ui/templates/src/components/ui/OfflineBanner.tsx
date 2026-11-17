import { Wifi, WifiOff, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { SizableText, Theme, useTheme, XStack, YStack } from 'tamagui';

import { useIsOnline } from '@/hooks/useIsOnline';

import { Caption } from './Text';

/** How long "Back online" stays once the connection returns. */
const BACK_ONLINE_MS = 2500;

/**
 * The strip under a screen's header that says the phone is offline.
 *
 * Assumes a live-only app (no offline write queue): offline, a screen keeps showing what it last loaded, and nothing on
 * it says that
 * the rows may be stale or that a save will fail. This says it, once, on every screen — `Screen` draws it, so no
 * screen opts in.
 *
 * - **Offline:** amber, until the connection returns. It never hides on its own: the condition is still true.
 * - **Back online:** green, briefly, then gone. React Query refetches on reconnect, so the rows refresh under it.
 * - **Online from the start:** nothing at all.
 *
 * Driven by `useIsOnline`, the same signal that pauses the queries, so the banner and the data never disagree.
 */
export function OfflineBanner() {
  const online = useIsOnline();
  const [previous, setPrevious] = useState(online);
  const [backOnline, setBackOnline] = useState(false);

  // Adjusted during render, not in an effect: the flip is known here, and an effect would paint one stale frame.
  if (online !== previous) {
    setPrevious(online);
    setBackOnline(online);
  }

  useEffect(() => {
    if (!backOnline) return;
    const timer = setTimeout(() => setBackOnline(false), BACK_ONLINE_MS);
    return () => clearTimeout(timer);
  }, [backOnline]);

  if (!online) {
    return (
      <Theme name="yellow">
        <Strip key="offline" icon={WifiOff} title="You're offline" subtitle="Showing what was last loaded" />
      </Theme>
    );
  }
  if (backOnline) {
    return (
      <Theme name="green">
        <Strip key="online" icon={Wifi} title="Back online" />
      </Theme>
    );
  }
  return null;
}

interface StripProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

/** Inside the tone's theme, so `useTheme` gives the icon its colour. */
function Strip({ icon: Icon, title, subtitle }: StripProps) {
  const theme = useTheme();

  return (
    <XStack
      mx="$3.5"
      mt="$2"
      px="$3"
      py="$2.5"
      gap="$3"
      items="center"
      bg="$color2"
      borderWidth={1}
      borderColor="$color5"
      rounded="$6"
      transition="quick"
      enterStyle={{ opacity: 0, y: -6 }}
      role="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
    >
      <XStack width={32} height={32} rounded="$4" bg="$color4" items="center" justify="center">
        <Icon size={16} color={theme.color11?.val} strokeWidth={2.25} />
      </XStack>
      <YStack flex={1} minW={0}>
        <SizableText size="$3" fontWeight="600" color="$color12">
          {title}
        </SizableText>
        {subtitle ? <Caption color="$color11">{subtitle}</Caption> : null}
      </YStack>
    </XStack>
  );
}
