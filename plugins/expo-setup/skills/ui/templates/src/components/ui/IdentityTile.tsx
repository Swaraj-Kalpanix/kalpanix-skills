import type { LucideIcon } from 'lucide-react-native';
import { SizableText, Theme, useTheme, XStack, type GetProps } from 'tamagui';

import type { StatusTone } from './StatusPill';
import { TONE_THEME } from './StatusPill';

/**
 * The square at the start of a record — a list row's leading mark and a detail hero's identity block.
 *
 * Gives every row a fixed left edge to align on, which is what the old cards lacked: a name, a
 * document number and a date all started at the card's padding, so nothing lined up from one row to
 * the next.
 *
 * - `tone="ink"` — an ink square; used on a detail hero.
 * - a status tone — a tinted square in that colour, so a list can say "overdue" or "won" at the left edge.
 * - `muted` (default) — a quiet tile in the app's own warm neutral, for an ordinary row.
 *
 * Shows `icon` when given, otherwise the initials of `label`.
 */
export interface IdentityTileProps extends Omit<GetProps<typeof XStack>, 'children' | 'theme'> {
  icon?: LucideIcon;
  label?: string | null;
  tone?: StatusTone | 'ink' | 'brand';
  size?: 'sm' | 'md' | 'lg';
}

const DIMENSION = { sm: 32, md: 40, lg: 52 } as const;
const GLYPH = { sm: 16, md: 18, lg: 24 } as const;
const TEXT = { sm: '$2', md: '$3', lg: '$6' } as const;

/** The salutations a person's name can carry, with or without the full stop. */
const TITLE = /^(mr|mrs|ms|dr)\.?$/i;

/**
 * First and last initials — "Rajesh Kumar Sharma" reads RS. Non-letters are dropped, so "R. Kumar" has no full stop.
 *
 * ⚠ A leading title is skipped: "Ms. JANE DOE" is **JD**, not MD. A title on its own is still used — a name of one word keeps its letter.
 */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const named = words.length > 1 && TITLE.test(words[0]!) ? words.slice(1) : words;
  const parts = named.map((part) => part.replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : '';
  return (first + last).toUpperCase();
}

export function IdentityTile({ tone = 'muted', ...props }: IdentityTileProps) {
  const tile = <Tile tone={tone} {...props} />;
  if (tone === 'brand') return <Theme name="brand">{tile}</Theme>;
  const themeName = tone === 'ink' ? undefined : TONE_THEME[tone];
  return themeName ? <Theme name={themeName}>{tile}</Theme> : tile;
}

/** Its own component so `useTheme` reads the tone's theme, not the caller's — the glyph is that tone's colour. */
function Tile({ icon: Icon, label, tone, size = 'md', ...props }: IdentityTileProps) {
  const theme = useTheme();
  const ink = tone === 'ink';
  const glyph = ink ? theme.color1?.val : theme.color11?.val;

  return (
    <XStack
      width={DIMENSION[size]}
      height={DIMENSION[size]}
      rounded={size === 'lg' ? '$6' : '$5'}
      bg={ink ? '$color12' : '$color3'}
      items="center"
      justify="center"
      shrink={0}
      {...props}
    >
      {Icon ? (
        <Icon size={GLYPH[size]} color={glyph} strokeWidth={2} />
      ) : (
        <SizableText size={TEXT[size]} fontWeight="600" color={ink ? '$color1' : '$color11'}>
          {label ? initials(label) : ''}
        </SizableText>
      )}
    </XStack>
  );
}
