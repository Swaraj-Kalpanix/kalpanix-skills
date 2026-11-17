import type { LucideIcon } from 'lucide-react-native';
import { SizableText, Theme, useTheme, XStack, YStack } from 'tamagui';

import { Spinner } from './Spinner';

/**
 * The row of round actions under a detail hero — Call, Message, Share, Edit.
 *
 * Replaces a grid of six equal outlined buttons: every action had the same
 * weight, so nothing said what the screen was *for*. Here the everyday actions are glyphs with a label, the one
 * primary action sits in the sticky `BottomBar`, and anything rarer goes behind "More".
 *
 * At most five, evenly spaced; four is the comfortable number on a phone.
 */
export interface QuickAction {
  key: string;
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  /** The brand tint — for the one action that is the screen's natural next step. */
  emphasis?: boolean;
  /** Colour the glyph alone — a third-party brand's own green (e.g. WhatsApp). */
  tint?: 'green';
  disabled?: boolean;
  loading?: boolean;
  /**
   * Dimmed, but **still pressable** — for an action the signed-in role does not hold.
   *
   * ⚠ Deliberately not `disabled`. A phone has no hover, so a disabled control is a grey shape that does nothing
   * and says nothing; this one looks unavailable and explains why when pressed. The
   * difference matters: `disabled` means "not applicable right now" — Call with no number on file — and `muted`
   * means "not yours to do", which is answerable by asking someone with access.
   */
  muted?: boolean;
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <XStack justify="space-around" gap="$2">
      {actions.map(({ key, ...action }) => (
        <QuickActionButton key={key} {...action} />
      ))}
    </XStack>
  );
}

/** Its own component so `useTheme` reads the brand theme when the action is emphasised. */
function Circle({ icon: Icon, emphasis, loading, tint }: Pick<QuickAction, 'icon' | 'emphasis' | 'loading' | 'tint'>) {
  const theme = useTheme();
  const glyph = emphasis ? theme.color10?.val : tint === 'green' ? theme.green10?.val : theme.color12?.val;
  return (
    <YStack
      width={48}
      height={48}
      rounded={1000}
      items="center"
      justify="center"
      bg={emphasis ? '$color3' : '$background'}
      borderWidth={emphasis ? 0 : 1}
      borderColor="$borderColor"
    >
      {loading ? <Spinner size="small" /> : <Icon size={20} color={glyph} />}
    </YStack>
  );
}

function QuickActionButton({ label, icon, onPress, emphasis, tint, disabled, loading, muted }: Omit<QuickAction, 'key'>) {
  const inactive = disabled || loading;
  const circle = <Circle icon={icon} emphasis={emphasis} loading={loading} tint={tint} />;

  return (
    <YStack
      flex={1}
      maxW={84}
      items="center"
      gap="$1.5"
      opacity={disabled || muted ? 0.4 : 1}
      transition="quicker"
      pressStyle={inactive ? undefined : { scale: 0.94, opacity: 0.8 }}
      onPress={inactive ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(inactive) }}
    >
      {emphasis ? <Theme name="brand">{circle}</Theme> : circle}
      <SizableText size="$2" fontWeight="500" color="$color11" numberOfLines={1} text="center">
        {label}
      </SizableText>
    </YStack>
  );
}
