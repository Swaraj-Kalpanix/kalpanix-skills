import { Fragment, type ReactNode } from 'react';
import { SizableText, XStack, YStack } from 'tamagui';

import { Caption } from './Text';

/**
 * The key figures of a record, side by side — an order's total, unit price and
 * quantity; an invoice's amount, version and validity.
 *
 * Two to four equal columns divided by hairlines, label above value. This is the "vitals" strip of a detail page,
 * reduced to what fits a phone: a figure, not a chart.
 *
 * `tone` colours a value whose meaning is the colour — an overdue date, a breached deadline.
 */
export interface Stat {
  label: string;
  value: ReactNode;
  tone?: 'danger' | 'warning' | 'success';
}

const TONE_COLOR = { danger: '$red10', warning: '$orange10', success: '$green10' } as const;

export function StatGroup({ stats }: { stats: Stat[] }) {
  return (
    <XStack>
      {stats.map((stat, index) => (
        <Fragment key={stat.label}>
          {index > 0 ? <YStack width={1} bg="$borderColor" my="$1" /> : null}
          <YStack flex={1} minW={0} gap="$1" px={index === 0 ? 0 : '$3'}>
            <Caption numberOfLines={1}>{stat.label}</Caption>
            {typeof stat.value === 'string' || typeof stat.value === 'number' ? (
              <SizableText
                size="$5"
                fontWeight="600"
                color={stat.tone ? TONE_COLOR[stat.tone] : '$color12'}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {stat.value}
              </SizableText>
            ) : (
              stat.value
            )}
          </YStack>
        </Fragment>
      ))}
    </XStack>
  );
}
