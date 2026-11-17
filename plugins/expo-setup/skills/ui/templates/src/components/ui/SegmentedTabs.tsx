import type { LucideIcon } from 'lucide-react-native';
import { SizableText, useTheme, XStack } from 'tamagui';

/**
 * Two or three tabs as one segmented control — e.g. a record screen's Overview | Activity.
 *
 * A segmented control
 * rather than a tab navigator because the tabs share one scroll and one header: switching must not reload the record
 * or lose the scroll position of the hero above.
 *
 * The selected segment is a raised card-coloured pill on a `$color3` track — the iOS idiom, and the same "ink is on,
 * not brand" rule `Chip` follows: a brand colour here could read as an error.
 */
export interface SegmentedTab<K extends string> {
  key: K;
  label: string;
  /** A quiet number after the label — "Activity 12". */
  count?: number;
  /** A glyph before the label, in the label's colour. */
  icon?: LucideIcon;
}

export interface SegmentedTabsProps<K extends string> {
  tabs: readonly SegmentedTab<K>[];
  value: K;
  onChange: (key: K) => void;
  /**
   * Size each segment to its label instead of equal thirds, every label on one line — for a row where one label is
   * much longer than the others ("Products & Services"). Off by default, so every other row is unchanged.
   */
  fit?: boolean;
}

export function SegmentedTabs<K extends string>({ tabs, value, onChange, fit = false }: SegmentedTabsProps<K>) {
  const theme = useTheme();
  return (
    <XStack bg="$color3" borderWidth={1} borderColor="$color3" rounded="$6" p="$1" gap="$1" accessibilityRole="tablist">
      {tabs.map((tab) => {
        const selected = tab.key === value;
        const Icon = tab.icon;
        return (
          <XStack
            key={tab.key}
            {...(fit ? { flexGrow: 1, flexShrink: 1, flexBasis: 'auto' as const, px: '$2.5' as const } : { flex: 1 })}
            height={38}
            items="center"
            justify="center"
            gap="$1.5"
            rounded="$5"
            /*
             * The unselected segment paints the **track's own `$color3`**, not `transparent`, and the switch is
             * **not animated**. Tweening the fill flickered on every tap: the label's colour and weight flip at once
             * while the fill, border and shadow take their time, and a colour tweened to or from `transparent`
             * passes through dark on the way. A segmented control changes in one frame on iOS too.
             */
            bg={selected ? '$background' : '$color3'}
            shadowColor="$shadowColor"
            shadowOpacity={selected ? 0.08 : 0}
            shadowRadius={4}
            shadowOffset={{ width: 0, height: 1 }}
            elevation={selected ? 1 : 0}
            pressStyle={selected ? undefined : { bg: '$color4' }}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.count !== undefined ? `${tab.label}, ${tab.count}` : tab.label}
          >
            {Icon ? <Icon size={15} color={(selected ? theme.color12 : theme.color11)?.val} /> : null}
            <SizableText
              size="$3"
              fontWeight={selected ? '600' : '500'}
              color={selected ? '$color12' : '$color11'}
              {...(fit ? { numberOfLines: 1 } : {})}
            >
              {tab.label}
            </SizableText>
            {tab.count !== undefined ? (
              <SizableText size="$2" fontWeight="600" color="$color10">
                {tab.count}
              </SizableText>
            ) : null}
          </XStack>
        );
      })}
    </XStack>
  );
}
