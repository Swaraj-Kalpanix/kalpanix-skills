import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Theme, useTheme, XStack, YStack, type GetProps, type ThemeName } from 'tamagui';

import { Card } from './Card';
import { ExpandableText } from './ExpandableText';
import { Body, Caption, Overline } from './Text';

/**
 * One line of a grouped list — the unit every detail screen is built from.
 *
 * A caption stacked above a value puts every fact on two lines and aligns nothing. A row puts the **label on the left and the value on the right**, so a column of
 * facts reads down one edge and the values line up — the iOS Settings / Android preference pattern people
 * already know how to scan.
 *
 * - With `onPress` it gains a chevron and a press state: a row that goes somewhere looks like one.
 * - `icon` draws a small leading glyph; rows in one group should either all have one or none.
 * - `subtitle` puts a second line under the title — for a row whose title is a name rather than a label.
 * - `trailing` replaces the value with any node (a pill, a switch, an icon button).
 */
export interface ListRowProps extends Omit<GetProps<typeof XStack>, 'children'> {
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  icon?: LucideIcon;
  /** Tint the leading glyph — the brand for a primary link, red for a destructive row. */
  iconColor?: string;
  /** Draw the glyph on a tinted chip in this colour, instead of bare. */
  iconTone?: ThemeName;
  trailing?: ReactNode;
  /** Let the value wrap under the title instead of truncating on the right — for long free text. */
  stacked?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  /**
   * The trailing ›, drawn on a pressable row by default because it says "this goes somewhere". Turn it off for a
   * row that **selects** rather than navigates — a radio choice (e.g. Settings → Appearance).
   */
  chevron?: boolean;
}

export function ListRow({
  title,
  subtitle,
  value,
  icon: Icon,
  iconColor,
  iconTone,
  trailing,
  stacked,
  destructive,
  disabled,
  chevron = true,
  onPress,
  ...props
}: ListRowProps) {
  const theme = useTheme();
  const pressable = Boolean(onPress) && !disabled;
  const empty = value === undefined || value === null || value === '';
  const valueNode = empty ? (
    // An em dash, not nothing: a missing value should be visibly absent rather than look unloaded.
    <Body color="$color9">—</Body>
  ) : stacked && typeof value === 'string' ? (
    // Long free text clamps with a "Show more", so one description cannot push the rest of a record off-screen.
    <ExpandableText color="$color11">{value}</ExpandableText>
  ) : typeof value === 'string' || typeof value === 'number' ? (
    <Body color="$color11" numberOfLines={stacked ? undefined : 1} text={stacked ? 'left' : 'right'}>
      {value}
    </Body>
  ) : (
    value
  );

  return (
    <XStack
      items={stacked ? 'flex-start' : 'center'}
      gap="$3"
      px="$3.5"
      py="$3"
      minH={52}
      opacity={disabled ? 0.45 : 1}
      onPress={pressable ? onPress : undefined}
      pressStyle={pressable ? { bg: '$color3' } : undefined}
      accessibilityRole={pressable ? 'button' : undefined}
      {...props}
    >
      {Icon && iconTone ? (
        <Theme name={iconTone}>
          <RowIconChip icon={Icon} />
        </Theme>
      ) : Icon ? (
        <Icon
          size={18}
          color={iconColor ?? (destructive ? theme.red10?.val : theme.color10?.val)}
          style={stacked ? { marginTop: 2 } : undefined}
        />
      ) : null}

      <YStack flex={1} minW={0} gap="$1">
        {typeof title === 'string' ? (
          <Body color={destructive ? '$red10' : '$color12'} numberOfLines={stacked ? undefined : 1}>
            {title}
          </Body>
        ) : (
          title
        )}
        {subtitle ? typeof subtitle === 'string' ? <Caption numberOfLines={2}>{subtitle}</Caption> : subtitle : null}
        {stacked && !trailing && value !== undefined ? valueNode : null}
      </YStack>

      {trailing ?? (!stacked && value !== undefined ? <XStack shrink={1} maxW="60%">{valueNode}</XStack> : null)}

      {pressable && chevron ? <ChevronRight size={18} color={theme.color9?.val} /> : null}
    </XStack>
  );
}

/** The glyph on its chip — its own component so `useTheme` reads the chip's tone. */
function RowIconChip({ icon: Icon }: { icon: LucideIcon }) {
  const theme = useTheme();
  return (
    <XStack width={32} height={32} rounded="$4" bg="$color4" items="center" justify="center">
      <Icon size={16} color={theme.color11?.val} />
    </XStack>
  );
}

/** The hairline between two rows, inset to the text edge so a group reads as one block. */
function RowDivider({ inset }: { inset: number }) {
  return <YStack height={1} bg="$borderColor" ml={inset} />;
}

/**
 * A titled group of rows on one card — a detail screen's section.
 *
 * The title is an `Overline` **outside** the card, so a stack of sections reads as labelled blocks on the page.
 * Children are separated by inset hairlines automatically; `null` children (a row that does not apply) are
 * skipped, so a call site can write `{phone ? <ListRow …/> : null}` without leaving a double divider.
 */
export interface SectionCardProps {
  title?: string;
  /**
   * A small glyph before the title — optional, so a card without one is unchanged.
   */
  icon?: LucideIcon;
  /** A small action at the right of the title — "See all", "Edit". */
  action?: ReactNode;
  /** Free content instead of rows: the card gets padding and no dividers. */
  padded?: boolean;
  /** Where the dividers start: 16 for text-only rows, 46 when the rows have icons. @default 16 */
  inset?: number;
  children: ReactNode;
}

export function SectionCard({ title, icon: Icon, action, padded, inset = 16, children }: SectionCardProps) {
  const rows = Children.toArray(children).filter(isValidElement);
  const theme = useTheme();

  return (
    <YStack gap="$2">
      {title || action ? (
        <XStack items="center" justify="space-between" px="$1" minH={20}>
          {title ? (
            <XStack items="center" gap="$1.5">
              {/* The overline's own colour, so the glyph reads as part of the label rather than beside it. */}
              {Icon ? <Icon size={13} color={theme.color10?.val} /> : null}
              <Overline>{title}</Overline>
            </XStack>
          ) : (
            <YStack />
          )}
          {action}
        </XStack>
      ) : null}
      {padded ? (
        <Card>{children}</Card>
      ) : (
        <Card flush>
          {rows.map((row, index) => (
            <Fragment key={row.key ?? index}>
              {index > 0 ? <RowDivider inset={inset} /> : null}
              {row}
            </Fragment>
          ))}
        </Card>
      )}
    </YStack>
  );
}
