import { Check, type LucideIcon } from 'lucide-react-native';
import type { ComponentProps, ReactNode } from 'react';
import { ScrollView, SizableText, Theme, useTheme, XStack, YStack, type GetProps } from 'tamagui';

import { TONE_THEME, type StatusTone } from './StatusPill';

/**
 * A quick filter — a pill with an optional count.
 *
 * **Selected is ink, not the brand colour.** The brand colour is the primary action's colour (and may be close to
 * a danger red); a row of brand-coloured filter pills makes the list header the loudest thing on the screen. An ink pill says "this is on" without saying "this is urgent".
 *
 * `count` is drawn as a separate, quieter figure after the label, so "Mine 12" reads as a label and a number
 * rather than as one word.
 *
 * `tone="brand"` is for a **choice in a form** rather than a filter: selected is a light brand tint with a ✓, so the
 * picked option stands out without shouting (a form's type or purpose picker). A **status tone** (`danger`,
 * `warning`, `info`, …) does the same in that tone's colour — a priority — and `dot` marks each option with
 * its colour before it is picked, as `StatusPill` does.
 */
export interface ChipProps extends Omit<GetProps<typeof XStack>, 'children' | 'theme'> {
  label: string;
  selected?: boolean;
  icon?: LucideIcon;
  count?: number;
  /**
   * `ink` (default): selected is a dark pill. `brand`, or a status tone: selected is a light tint of that colour with a
   * ✓.
   */
  tone?: 'ink' | 'brand' | StatusTone;
  /** With a tint tone: a dot in the tone's colour before the label while unselected. */
  dot?: boolean;
}

export function Chip({ tone = 'ink', dot, ...props }: ChipProps) {
  if (tone === 'ink') return <InkChip {...props} />;
  const themeName = tone === 'brand' ? 'brand' : TONE_THEME[tone];
  // Only a **selected** chip sits in the tone's theme: an unselected one keeps the page's own surface and border, so a
  // row of options reads as one row, and only the dot carries the colour.
  if (props.selected && themeName) {
    return (
      <Theme name={themeName}>
        <TintChip {...props} />
      </Theme>
    );
  }
  return <TintChip {...props} dot={dot ? (themeName ?? 'none') : undefined} />;
}

/**
 * Selected as a light tint with a ✓ — rendered inside the tone's theme, so `$color` tokens are its colours.
 * `dot` is the theme to colour the unselected dot from (`none`: the page's own neutral, for `muted`).
 */
function TintChip({
  label,
  selected,
  icon: Icon,
  count,
  dot,
  ...props
}: Omit<ChipProps, 'tone' | 'dot'> & { dot?: ComponentProps<typeof Theme>['name'] | 'none' }) {
  const theme = useTheme();
  const MarkIcon = selected ? Check : Icon;
  const dotView = <YStack width={8} height={8} rounded={1000} bg="$color9" />;
  return (
    <XStack
      items="center"
      gap="$1.5"
      px="$3"
      height={32}
      rounded={1000}
      bg={selected ? '$color3' : '$background'}
      borderWidth={1}
      borderColor={selected ? '$color8' : '$color5'}
      transition="quicker"
      animateOnly={['transform']}
      pressStyle={{ scale: 0.96 }}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      {...props}
    >
      {dot && !selected ? dot === 'none' ? dotView : <Theme name={dot}>{dotView}</Theme> : null}
      {MarkIcon ? (
        <MarkIcon size={14} strokeWidth={selected ? 3 : 2} color={selected ? theme.color11?.val : theme.color10?.val} />
      ) : null}
      <SizableText size="$3" fontWeight={selected ? '600' : '500'} color={selected ? '$color11' : '$color12'}>
        {label}
      </SizableText>
      {count !== undefined ? (
        <SizableText size="$2" fontWeight="600" color="$color10">
          {count}
        </SizableText>
      ) : null}
    </XStack>
  );
}

function InkChip({ label, selected, icon: Icon, count, ...props }: Omit<ChipProps, 'tone' | 'dot'>) {
  const theme = useTheme();
  const fg = selected ? '$color1' : '$color12';

  return (
    <XStack
      items="center"
      gap="$1.5"
      px="$3"
      height={32}
      rounded={1000}
      bg={selected ? '$color12' : '$background'}
      borderWidth={1}
      borderColor={selected ? '$color12' : '$color5'}
      transition="quicker"
      // Only the press scale animates. A tweened fill flickered on every tap: the label's colour flips at once while
      // the fill takes its time, so a chip being selected showed white text on a still-white pill.
      animateOnly={['transform']}
      pressStyle={{ scale: 0.96 }}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      {...props}
    >
      {Icon ? <Icon size={14} color={selected ? theme.color1?.val : theme.color11?.val} /> : null}
      <SizableText size="$3" fontWeight="500" color={fg}>
        {label}
      </SizableText>
      {count !== undefined ? (
        <SizableText size="$2" fontWeight="600" color={selected ? '$color6' : '$color10'}>
          {count}
        </SizableText>
      ) : null}
    </XStack>
  );
}

/** A horizontally scrolling row of chips that bleeds to the screen edge, so the last pill is never clipped mid-word. */
export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" mx="$-3.5">
      {/* The gap and the gutter live on an inner stack: Tamagui's ScrollView only accepts a narrow set of style
          props on `contentContainerStyle`, and padding is not one of them. */}
      <XStack gap="$2" px="$3.5">
        {children}
      </XStack>
    </ScrollView>
  );
}
