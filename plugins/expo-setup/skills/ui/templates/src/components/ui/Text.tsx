import { styled, Paragraph, SizableText, type GetProps } from 'tamagui';

/**
 * Named text roles.
 *
 * The point is that a screen writes `<Muted>` rather than `<Paragraph size="$2" color="$color10">`. Three
 * screens choosing `$color10` / `$color11` / `$color9` for "secondary text" is how an app stops looking like
 * one app, and it is invisible in review because each one is individually reasonable.
 *
 * The scale is the app's scale in `theme/fonts.ts` (body 15). Sizes come from it and colours from
 * the theme, so both follow light/dark and any sub-theme without these components knowing about it.
 *
 * | role | size | use |
 * |---|---|---|
 * | `Title` | 28 / 600 | the large title of a module's list — one per screen |
 * | `Heading` | 20 / 600 | the title inside a detail screen's hero |
 * | `Subtitle` | 16 / 600 | a list-row or card title |
 * | `Body` | 15 | default copy, values |
 * | `Muted` | 13 | secondary text under a title |
 * | `Caption` | 12 | metadata, timestamps, field labels |
 * | `Overline` | 11 / 600, caps | a section label above a group of rows |
 * | `Mono` | 13 mono | identifiers — order numbers, references, codes |
 */

/** The large title of a module's list. Heading font, tight tracking from the font config. */
export const Title = styled(SizableText, {
  name: 'Title',
  fontFamily: '$heading',
  size: '$9',
  fontWeight: '600',
  color: '$color12',
});

/** The title of a record in a detail screen's hero. */
export const Heading = styled(SizableText, {
  name: 'Heading',
  fontFamily: '$heading',
  size: '$7',
  fontWeight: '600',
  color: '$color12',
});

/** A card, row or sheet title. */
export const Subtitle = styled(SizableText, {
  name: 'Subtitle',
  fontFamily: '$heading',
  size: '$5',
  fontWeight: '600',
  color: '$color12',
});

/** Default body copy. */
export const Body = styled(Paragraph, {
  name: 'Body',
  size: '$4',
  color: '$color12',
});

/** Secondary text: a subtitle under a name, a timestamp, a hint. */
export const Muted = styled(Paragraph, {
  name: 'Muted',
  size: '$3',
  color: '$color11',
});

/** The smallest role — field labels, metadata, counts. */
export const Caption = styled(SizableText, {
  name: 'Caption',
  size: '$2',
  color: '$color11',
});

/**
 * A section label — small capitals above a group of rows, the iOS Settings / web card-head convention.
 *
 * Uppercase is done here, so a call site writes the label in sentence case and a screen reader reads a word
 * rather than spelling out capitals.
 */
export const Overline = styled(SizableText, {
  name: 'Overline',
  size: '$1',
  fontWeight: '600',
  letterSpacing: 0.6,
  textTransform: 'uppercase',
  color: '$color11',
});

/** An identifier — set in Geist Mono, so identifiers line up and stay legible. */
export const Mono = styled(SizableText, {
  name: 'Mono',
  fontFamily: '$mono',
  size: '$3',
  color: '$color11',
});

/**
 * An error message under a field.
 *
 * `red`, never the brand: an error is not a brand moment, and the two must stay distinguishable, which matters most
 * when the brand colour is itself red or close to it.
 */
export const ErrorText = styled(Paragraph, {
  name: 'ErrorText',
  size: '$2',
  color: '$red10',
});

export type TitleProps = GetProps<typeof Title>;
export type BodyProps = GetProps<typeof Body>;
export type MutedProps = GetProps<typeof Muted>;
export type CaptionProps = GetProps<typeof Caption>;
