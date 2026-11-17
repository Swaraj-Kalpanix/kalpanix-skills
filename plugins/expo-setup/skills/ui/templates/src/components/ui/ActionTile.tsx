import type { LucideIcon } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { SizableText, Theme, useTheme, XStack, YStack } from 'tamagui';

import { Spinner } from './Spinner';

export interface ActionTileProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  /**
   * The tint: the brand colour by default, `green` for positive actions (Navigate, Complete), `neutral` — the
   * app's grey — for Edit and Amend, `red` for Cancel and Delete.
   */
  tone?: ComponentProps<typeof Theme>['name'] | 'neutral';
  /** Dimmed, still pressable: the role cannot do it, and pressing says so. */
  muted?: boolean;
  /** Dimmed and not pressable: there is nothing to act on (no number on file, a step that does not apply). */
  disabled?: boolean;
  /** A spinner in place of the glyph while the action runs. */
  loading?: boolean;
  accessibilityLabel?: string;
}

/**
 * One action in a hero's row: a tinted round icon with its label under it — Navigate, Amend, Start, Complete,
 * Delete. Lay several out in an `XStack` with `justify="space-around"`.
 */
export function ActionTile({ tone = 'brand', ...props }: ActionTileProps) {
  return tone === 'neutral' ? (
    <ActionTileBody {...props} />
  ) : (
    <Theme name={tone}>
      <ActionTileBody {...props} />
    </Theme>
  );
}

function ActionTileBody({ icon: Icon, label, onPress, muted, disabled, loading, accessibilityLabel }: Omit<ActionTileProps, 'tone'>) {
  const theme = useTheme();
  const inert = disabled || loading;
  return (
    <YStack
      items="center"
      gap="$1.5"
      minW={64}
      opacity={disabled || muted ? 0.4 : 1}
      onPress={inert ? undefined : onPress}
      transition="quick"
      pressStyle={inert ? undefined : { scale: 0.95 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(loading) }}
    >
      <XStack width={48} height={48} rounded={1000} bg="$color3" items="center" justify="center">
        {loading ? <Spinner size="small" color={theme.color11?.val} /> : <Icon size={20} color={theme.color11?.val} />}
      </XStack>
      <SizableText size="$2" fontWeight="600" color="$color11" text="center">
        {label}
      </SizableText>
    </YStack>
  );
}
