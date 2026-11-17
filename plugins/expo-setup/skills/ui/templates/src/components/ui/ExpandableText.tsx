import { useState } from 'react';
import { SizableText, YStack, type GetProps } from 'tamagui';

/**
 * Long free text, clamped to a few lines with a "Show more" — a description, a message, a note.
 *
 * A record screen is read top-down for its facts; one long description should not push everything after it a
 * screen and a half down. The toggle only appears when the text is long enough to have been clamped (judged by
 * characters, since React Native reports no reliable "was truncated" signal).
 */
export interface ExpandableTextProps extends Omit<GetProps<typeof SizableText>, 'children'> {
  children: string;
  /** Lines shown while collapsed. @default 5 */
  lines?: number;
}

/** Roughly what five lines hold on a phone — below this the clamp would never bite. */
const CHARS_PER_LINE = 48;

export function ExpandableText({ children, lines = 5, ...props }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const long = children.length > lines * CHARS_PER_LINE || children.split('\n').length > lines;

  return (
    <YStack gap="$1" items="flex-start">
      <SizableText size="$4" color="$color12" numberOfLines={expanded || !long ? undefined : lines} {...props}>
        {children}
      </SizableText>
      {long ? (
        <SizableText
          size="$3"
          fontWeight="600"
          color="$color11"
          onPress={() => setExpanded((value) => !value)}
          accessibilityRole="button"
          hitSlop={8}
        >
          {expanded ? 'Show less' : 'Show more'}
        </SizableText>
      ) : null}
    </YStack>
  );
}
