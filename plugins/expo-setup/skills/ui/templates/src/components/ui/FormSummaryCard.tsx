import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { SizableText, useTheme, XStack, YStack } from 'tamagui';

import { Card } from './Card';
import { Caption, Mono, Subtitle } from './Text';

/**
 * What this record is, as one card above a form — the header every redesigned form grew for itself.
 *
 * Every form grows a private summary card with the same bones: a 40pt icon tile, a one-line title, a quieter
 * second line, and a body indented to clear the tile. By the third copy it should be shared, which is what this is.
 *
 * ## The indent is the whole reason this is shared
 *
 * The body sits at `pl={52}` — the tile's 40 plus the `$3` gap — so a detail line under the title starts where the
 * title starts rather than under the icon. That number is the kind of thing that drifts to 48 in one copy and 52 in
 * another, and then two forms look subtly unlike each other for no reason anyone can name.
 *
 * Each form keeps its own body: one lists linked records, another shows a number, a
 * version pill and a status line. Only the frame is shared.
 *
 * @example
 * ```tsx
 * <FormSummaryCard icon={Building2} title={companyName} subtitle={orderNo} mono>
 *   <SummaryRow icon={Package} text="Widget 3000 · S/N 44812" />
 * </FormSummaryCard>
 * ```
 */
export interface FormSummaryCardProps {
  icon: LucideIcon;
  title: string;
  /** The second line. Shown as a record number when `mono`, as a caption otherwise. */
  subtitle?: string;
  /** Render `subtitle` in the mono face — for a record number (`ORD-0042`), not for prose. */
  mono?: boolean;
  /** The body, indented to line up under the title. Supply the stack; a single `XStack` wraps pills fine. */
  children?: ReactNode;
}

/** The tile's width plus the header gap — what the body is indented by so it lines up under the title. */
const BODY_INDENT = 52;

export function FormSummaryCard({ icon: Icon, title, subtitle, mono, children }: FormSummaryCardProps) {
  const theme = useTheme();

  return (
    <Card gap="$2.5" p="$3.5">
      <XStack items="center" gap="$3">
        <XStack width={40} height={40} rounded="$5" bg="$color3" items="center" justify="center">
          <Icon size={20} color={theme.color11?.val} />
        </XStack>
        <YStack flex={1} minW={0}>
          <Subtitle numberOfLines={1}>{title}</Subtitle>
          {subtitle ? (
            mono ? (
              <Mono size="$2" color="$color10">
                {subtitle}
              </Mono>
            ) : (
              <Caption numberOfLines={1}>{subtitle}</Caption>
            )
          ) : null}
        </YStack>
      </XStack>
      {children ? (
        <YStack gap="$1.5" pl={BODY_INDENT}>
          {children}
        </YStack>
      ) : null}
    </Card>
  );
}

/** One detail line in a {@link FormSummaryCard} body — a small icon and a line of text that truncates. */
export function SummaryRow({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  const theme = useTheme();
  return (
    <XStack items="center" gap="$2">
      <Icon size={14} color={theme.color10?.val} />
      <SizableText size="$3" color="$color11" numberOfLines={1} flex={1}>
        {text}
      </SizableText>
    </XStack>
  );
}
