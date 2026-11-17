import type { LucideIcon } from 'lucide-react-native';
import { SizableText, Spinner, Theme, useTheme, XStack, YStack, type GetProps } from 'tamagui';

import { useBrandSolid } from './useBrandSolid';

/**
 * A round, icon-only button — header actions, the filter toggle, a row's call button.
 *
 * `accessibilityLabel` is **required**: an icon has no text for a screen reader to read, and an unlabelled
 * glyph is the most common accessibility failure in a mobile app.
 *
 * | variant | when |
 * |---|---|
 * | `ghost` | in a header or a row — no surface until pressed. The default |
 * | `outline` | on the page, beside a search field — a card-coloured circle with the hairline edge |
 * | `brand` | the screen's create action (`+`) — the brand solid, replacing the extended FAB that covered rows |
 * | `soft` | a tinted circle — the round quick actions on a detail hero |
 */
export interface IconButtonProps extends Omit<GetProps<typeof XStack>, 'children' | 'theme'> {
  icon: LucideIcon;
  accessibilityLabel: string;
  variant?: 'ghost' | 'outline' | 'brand' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  /** A count drawn on the corner — active filters, unread items. Hidden at 0. */
  badge?: number;
  loading?: boolean;
  disabled?: boolean;
  /** Colour the glyph alone — e.g. a WhatsApp or call action in its own green. */
  tint?: 'green';
}

const DIMENSION = { sm: 32, md: 40, lg: 48 } as const;
const PRESSED_SCALE = 0.92;
const GLYPH = { sm: 16, md: 20, lg: 24 } as const;

export function IconButton(props: IconButtonProps) {
  // The brand variant renders inside the brand theme, and the glyph colour must be read *inside* it — hence the
  // split: `useTheme` in a parent would return the caller's theme.
  return props.variant === 'brand' ? (
    <Theme name="brand">
      <IconButtonInner {...props} />
    </Theme>
  ) : (
    <IconButtonInner {...props} />
  );
}

function IconButtonInner({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  badge,
  loading,
  disabled,
  tint,
  onPress,
  ...props
}: IconButtonProps) {
  const theme = useTheme();
  // Only used by the brand variant, which renders inside the brand theme; the same fill and label as `Button`.
  const solid = useBrandSolid();
  const dimension = DIMENSION[size];
  const inactive = disabled || loading;

  // Every press also settles the button a little (`PRESSED_SCALE`) — the one thing that animates; see below.
  const surface =
    variant === 'brand'
      ? { bg: solid.bg, pressStyle: { bg: solid.pressed, scale: PRESSED_SCALE } }
      : variant === 'outline'
        ? ({
            bg: '$background',
            borderWidth: 1,
            borderColor: '$borderColor',
            pressStyle: { bg: '$color3', scale: PRESSED_SCALE },
          } as const)
        : variant === 'soft'
          ? ({ bg: '$color3', pressStyle: { bg: '$color4', scale: PRESSED_SCALE } } as const)
          : ({ bg: 'transparent', pressStyle: { bg: '$color3', scale: PRESSED_SCALE } } as const);

  const glyphColor =
    tint === 'green'
      ? theme.green10?.val
      : variant === 'brand'
        ? solid.label
        : variant === 'soft'
          ? theme.color11?.val
          : theme.color12?.val;

  return (
    <XStack
      width={dimension}
      height={dimension}
      rounded={1000}
      items="center"
      justify="center"
      transition="quicker"
      /*
       * Only the press scale animates; the fill changes at once. A tweened fill flashed **twice** per tap on a ghost
       * button (the ☰): `transparent` tweens through `rgba(0, 0, 0, 0)`, so the circle darkened on the way in and
       * again on the way out. The same fix as `Chip` and `SegmentedTabs`.
       */
      animateOnly={['transform']}
      opacity={disabled ? 0.45 : 1}
      onPress={inactive ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(inactive) }}
      hitSlop={size === 'sm' ? 8 : 4}
      {...surface}
      {...props}
    >
      {loading ? <Spinner size="small" color={glyphColor} /> : <Icon size={GLYPH[size]} color={glyphColor} />}
      {badge ? (
        <Theme name="brand">
          <CountBadge count={badge} />
        </Theme>
      ) : null}
    </XStack>
  );
}

/** The count on the corner — the brand solid with its label, as `Button` draws it. */
function CountBadge({ count }: { count: number }) {
  const solid = useBrandSolid();

  return (
    <YStack
      position="absolute"
      t={-2}
      r={-2}
      minW={18}
      height={18}
      px={4}
      rounded={1000}
      bg={solid.bg}
      items="center"
      justify="center"
      borderWidth={2}
      borderColor="$background"
    >
      <SizableText size="$1" fontWeight="700" color={solid.label as '$color1'} lineHeight={13}>
        {count > 9 ? '9+' : count}
      </SizableText>
    </YStack>
  );
}
