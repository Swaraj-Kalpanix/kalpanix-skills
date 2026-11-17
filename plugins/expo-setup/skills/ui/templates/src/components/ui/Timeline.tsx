import { Circle, type LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { SizableText, Theme, useTheme, XStack, YStack } from 'tamagui';

import { Button } from './Button';
import { Caption } from './Text';

/**
 * A vertical history — a record's activity, an audit trail.
 *
 * Each entry hangs off a rail: a small icon in a circle, and a hairline down to the next one, so the eye follows
 * time down the left edge and reads the entries to the right. That is what made the old lists (avatar, text,
 * separator, repeat) hard to scan: nothing connected one entry to the next.
 *
 * - `tone="accent"` marks an entry a person logged (a call, a meeting) — an ink circle and a semibold title;
 *   a system event (created, stage changed, emailed) is quieter, so the human entries stand out in a long history.
 * - `limit` shows the newest N with a "Show all" button, because a record's history runs to dozens of entries and
 *   the timeline sits at the end of a screen people mostly open for the top of it.
 * - `tint` draws the circle in a colour theme — its soft step behind the icon in its strong step, a tinted
 *   activity marker. Without one the circle is drawn plain.
 */

/** The colour themes a timeline marker can take — the activity tones (a neutral slate is no tint). */
export type TimelineTint = 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'teal';
export interface TimelineEntry {
  key: string;
  icon?: LucideIcon;
  title: ReactNode;
  /** The words someone wrote — shown in full under the title. */
  body?: ReactNode;
  /** Small facts after the title: "Outgoing · 4 min". */
  detail?: string;
  /** Who and when. */
  meta?: string;
  tone?: 'accent' | 'muted';
  /** The marker's colour — see `TimelineTint`. */
  tint?: TimelineTint;
}

export function Timeline({ entries, empty, limit = 6 }: { entries: TimelineEntry[]; empty?: ReactNode; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (entries.length === 0) return <>{empty ?? null}</>;

  const visible = expanded ? entries : entries.slice(0, limit);
  const hidden = entries.length - visible.length;

  return (
    <YStack>
      {visible.map((entry, index) => (
        <TimelineRow key={entry.key} entry={entry} last={index === visible.length - 1} />
      ))}
      {hidden > 0 ? (
        <Button size="$3" variant="ghost" self="flex-start" ml={36} mt="$2" onPress={() => setExpanded(true)}>
          {`Show ${hidden} earlier`}
        </Button>
      ) : null}
    </YStack>
  );
}

function TimelineRow({ entry, last }: { entry: TimelineEntry; last: boolean }) {
  const accent = entry.tone === 'accent';

  return (
    <XStack gap="$3">
      <YStack items="center" width={28}>
        {entry.tint ? (
          <Theme name={entry.tint}>
            <Marker entry={entry} tinted />
          </Theme>
        ) : (
          <Marker entry={entry} />
        )}
        {last ? null : <YStack flex={1} width={1.5} bg="$borderColor" my="$1" />}
      </YStack>

      <YStack flex={1} minW={0} gap="$1" pb={last ? 0 : '$4'} pt={5}>
        <XStack items="center" gap="$1.5" flexWrap="wrap">
          {typeof entry.title === 'string' ? (
            // `SizableText`, not `Body`: a styled `Paragraph` resets the weight from its size variant, so a 600
            // title rendered as 400 and the accent entries lost the only thing distinguishing them.
            <SizableText size="$3" fontWeight={accent ? '600' : '400'} color={accent ? '$color12' : '$color11'}>
              {entry.title}
            </SizableText>
          ) : (
            entry.title
          )}
          {entry.detail ? <Caption>· {entry.detail}</Caption> : null}
        </XStack>
        {entry.body ? (
          typeof entry.body === 'string' ? (
            <YStack bg="$color1" rounded="$5" px="$3" py="$2" mt="$0.5" borderWidth={1} borderColor="$borderColor">
              <SizableText size="$3" color="$color12">
                {entry.body}
              </SizableText>
            </YStack>
          ) : (
            entry.body
          )
        ) : null}
        {entry.meta ? <Caption color="$color10">{entry.meta}</Caption> : null}
      </YStack>
    </XStack>
  );
}

/**
 * The circle on the rail. Tinted, it is read **inside** the colour theme, so `$color4` and `$color11` are that colour's
 * soft and strong steps — in both schemes, with a hairline ring. Untinted: ink for a logged entry, the
 * quiet grey for a system one.
 */
function Marker({ entry, tinted }: { entry: TimelineEntry; tinted?: boolean }) {
  const theme = useTheme();
  const Icon = entry.icon ?? Circle;
  const accent = entry.tone === 'accent';

  return (
    <YStack
      width={28}
      height={28}
      rounded={1000}
      items="center"
      justify="center"
      bg={tinted ? '$color4' : accent ? '$color12' : '$color3'}
      borderWidth={tinted ? 1 : 0}
      borderColor="$color6"
    >
      <Icon
        size={entry.icon ? 14 : 7}
        color={tinted ? theme.color11?.val : accent ? theme.color1?.val : theme.color10?.val}
        fill={entry.icon ? 'none' : theme.color10?.val}
      />
    </YStack>
  );
}
