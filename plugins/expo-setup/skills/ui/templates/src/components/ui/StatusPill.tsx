import { Info } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { SizableText, Theme, useTheme, XStack, YStack, type GetProps } from 'tamagui';

/**
 * What a status *means*, independent of which status it is. Screens map their own statuses onto these
 * (`orderStatusTone`, …) so the colour vocabulary stays six words across the whole app:
 *
 * | tone | means |
 * |---|---|
 * | `info` | in progress, sent, scheduled |
 * | `success` | accepted, completed, paid, resolved |
 * | `warning` | on hold, due soon, low stock |
 * | `danger` | rejected, failed, overdue |
 * | `neutral` | open, new, a state with no judgement |
 * | `muted` | draft, closed, archived — done with, de-emphasised |
 */
export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

type ThemeNameProp = ComponentProps<typeof Theme>['name'];

/** The Tamagui child theme behind each tone. `muted` uses the app's own neutral palette. */
export const TONE_THEME: Record<StatusTone, ThemeNameProp> = {
  neutral: 'purple',
  info: 'blue',
  success: 'green',
  warning: 'orange',
  danger: 'red',
  muted: undefined,
};

export interface StatusPillProps extends Omit<GetProps<typeof XStack>, 'children' | 'theme'> {
  label: string;
  tone?: StatusTone;
  size?: 'sm' | 'md';
  /** Drop the leading dot — for a pill that sits beside its own icon. */
  plain?: boolean;
  /**
   * A small ⓘ after the label — says "tap me to learn what this is", for a pill wrapped in a `Tooltip` with
   * `trigger="press"`.
   */
  info?: boolean;
}

/**
 * A status, as a tinted pill with a leading dot — chips carry a dot and a ring, never a
 * filled block of colour.
 *
 * The dot carries the colour, the label stays at `$color11` of the tone (≥ 7:1 on its own `$color3` in both
 * schemes), so the status is legible to someone who cannot tell the hues apart.
 *
 * `neutral` is purple, so a fresh record ("new") and a draft read differently at a glance.
 */
export function StatusPill({ label, tone = 'muted', size = 'md', plain, info, ...props }: StatusPillProps) {
  const pill = (
    <XStack
      items="center"
      gap="$1.5"
      bg="$color3"
      px={size === 'sm' ? '$2' : '$2.5'}
      height={size === 'sm' ? 22 : 26}
      rounded={1000}
      self="flex-start"
      shrink={0}
      {...props}
    >
      {plain ? null : <YStack width={6} height={6} rounded={1000} bg="$color9" />}
      <SizableText size={size === 'sm' ? '$1' : '$2'} fontWeight="600" color="$color11" numberOfLines={1}>
        {label}
      </SizableText>
      {info ? <InfoGlyph size={size === 'sm' ? 11 : 13} /> : null}
    </XStack>
  );

  const themeName = TONE_THEME[tone];
  return themeName ? <Theme name={themeName}>{pill}</Theme> : pill;
}

/** The ⓘ, in the pill's own text colour — its own component so `useTheme` reads the tone's theme it sits in. */
function InfoGlyph({ size }: { size: number }) {
  const theme = useTheme();
  return <Info size={size} color={theme.color11?.val} strokeWidth={2.25} />;
}
