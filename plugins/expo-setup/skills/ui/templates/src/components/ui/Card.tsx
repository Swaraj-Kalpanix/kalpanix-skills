import { styled, YStack, type GetProps } from 'tamagui';

/**
 * The container every list row and detail section is built from — each feature's record card (`OrderCard`, …)
 * composes it, so a change to elevation or radius happens once.
 *
 * **A card is the one surface that sits above the page**: `$background` on a `$color1` page, lifted by a
 * soft shadow with no border. A card placed on another card is a mistake; nest a `ListRow` or a
 * `Section` instead.
 *
 * `pressable` is a variant rather than something inferred from `onPress`, because a card that only *looks*
 * tappable is worse than one that does not: the press feedback and the tap target should be a deliberate
 * choice at the call site.
 *
 * **A `selected` or `tone` card keeps its edge**: there the edge means something.
 */
const CardFrame = styled(YStack, {
  name: 'Card',
  bg: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  rounded: '$6',
  p: '$3.5',
  gap: '$2',

  variants: {
    pressable: {
      true: {
        transition: 'quicker',
        // A press-in plus the page tint: a list of cards flashing a strong fill on scroll-tap reads as a glitch.
        pressStyle: { scale: 0.99, bg: '$color3' },
      },
    },
    /** For a card that is the current selection — the brand's one legitimate use outside a primary action. */
    selected: {
      true: {
        borderColor: '$color8',
        bg: '$color3',
      },
    },
    /** Drop the padding when the card's own children manage it (a card holding `ListRow`s). */
    flush: {
      true: { p: 0, gap: 0, overflow: 'hidden' },
    },
    /** A quiet, un-elevated panel: a notice or an inline summary that is not a record. */
    tone: {
      quiet: { bg: '$color3', borderColor: '$color3' },
      warning: { bg: '$yellow2', borderColor: '$yellow6' },
      danger: { bg: '$red2', borderColor: '$red6' },
    },
  } as const,
});

export type CardProps = GetProps<typeof CardFrame>;

/** Wide and faint, so it fades out. Android's `elevation` ends in a hard line that reads as a border. */
const CARD_SHADOW = '0 2px 10px $shadow2';

export function Card(props: CardProps) {
  const edged = Boolean(props.selected || props.tone);
  return <CardFrame borderWidth={edged ? 1 : 0} {...(props.tone ? null : { boxShadow: CARD_SHADOW })} {...props} />;
}

/** A titled block on a detail or form screen. No surface of its own — sections sit on the page. */
export const Section = styled(YStack, {
  name: 'Section',
  gap: '$2',
});

export type SectionProps = GetProps<typeof Section>;
