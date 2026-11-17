import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTheme, XStack, YStack } from 'tamagui';

import { Body, Caption } from './Text';

/**
 * A label-and-value row — what a detail screen is mostly made of.
 *
 * Stacked rather than side-by-side: on a phone, a right-aligned value column either truncates the label or
 * wraps awkwardly the first time a customer has a long name. Label above value always fits.
 */
export interface FieldProps {
  label: string;
  /** `undefined` and empty are treated alike — the row renders a dash rather than a blank gap. */
  value?: ReactNode;
  icon?: LucideIcon;
}

export function Field({ label, value, icon: Icon }: FieldProps) {
  const theme = useTheme();
  const empty = value === undefined || value === null || value === '';

  return (
    <YStack gap="$1">
      <XStack items="center" gap="$1.5">
        {Icon ? <Icon size={13} color={theme.color10?.val} /> : null}
        <Caption>{label}</Caption>
      </XStack>
      {/* An em dash, not an empty string: a missing value should be visibly absent rather than look unloaded. */}
      {empty ? <Body color="$color10">—</Body> : typeof value === 'string' ? <Body>{value}</Body> : value}
    </YStack>
  );
}

/**
 * Two or three `Field`s across a row.
 *
 * `flexWrap` and a `minW` on each child rather than fixed columns, so three short fields sit on one line and
 * two long ones wrap instead of squeezing.
 */
export function MetaRow({ children }: { children: ReactNode }) {
  return (
    <XStack flexWrap="wrap" gap="$4">
      {children}
    </XStack>
  );
}

/** A single metadata item inside a list row: a small icon and a value, no label. */
export function MetaItem({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  const theme = useTheme();
  return (
    <XStack items="center" gap="$1.5" minW={0}>
      {Icon ? <Icon size={13} color={theme.color10?.val} /> : null}
      <Caption numberOfLines={1}>{children}</Caption>
    </XStack>
  );
}
