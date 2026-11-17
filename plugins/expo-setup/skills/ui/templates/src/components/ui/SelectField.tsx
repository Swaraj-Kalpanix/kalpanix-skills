import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Check, ChevronDown, Search, type LucideIcon } from 'lucide-react-native';
import { createElement, useRef, useState, type ReactNode } from 'react';
import { Input, Theme, useTheme, XStack, YStack } from 'tamagui';

import { Card } from './Card';
import { FieldLabel, FieldMessage, fieldFrame } from './FieldChrome';
import { Sheet } from './Sheet';
import { Body, Caption, Muted, Overline } from './Text';
import { Spinner } from './Spinner';

/** One option. `id` is what goes into a payload; `label` is what the user reads. */
export interface SelectOption {
  id: string;
  label: string;
  /** A second line — a short description under the option's label. */
  detail?: string;
  /**
   * A glyph before the label, in the list **and** on the closed field — e.g. a category's icon. Optional: a picker
   * whose options have nothing to show stays as it was.
   */
  icon?: LucideIcon;
}

/**
 * A picker that opens a bottom sheet.
 *
 * ## Why not Tamagui's `Select`
 *
 * Tamagui's `Select` adapts into its own `Sheet` on phones, which would mean two sheet implementations in one
 * app — `@gorhom/bottom-sheet` for everything else and Tamagui's for pickers — with different backdrops,
 * different keyboard handling and two sets of bugs to learn. The `mobile-ui` skill is explicit that
 * `@gorhom/bottom-sheet` is the app's sheet library, and Tamagui `Sheet` is only for components that adapt into
 * one internally. A picker written on top of the app's own `Sheet` also gets the search box below, which
 * `Select` has no place for.
 *
 * ## Search appears when the list is long enough to need it
 *
 * A status list is a handful of rows; a catalog can be hundreds. Rather than making every call
 * site decide, the field shows a filter box once there are more than `SEARCH_THRESHOLD` options — the point at
 * which scrolling stops being faster than typing.
 */
const SEARCH_THRESHOLD = 8;

/*
 * ## It does not open while its options are loading
 *
 * The field shows a small spinner and ignores taps until `loading` is false. Opening the sheet over a spinner
 * looked harmless but trapped the user: the content-sized sheet measured itself around the spinner and did **not**
 * re-measure when the rows arrived, so it kept showing a spinner after the data was in — until the sheet was closed and opened again (found on the
 * emulator). A user on one bar of signal opens a picker before its list has arrived all the time.
 */

export interface SelectFieldProps {
  label: string;
  /** The selected option's `id`, or `undefined` for none. */
  value?: string;
  onChange: (id: string | undefined) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Options are still being fetched: the field shows a spinner and does not open until they arrive. */
  loading?: boolean;
  /** Offer a "None" row that clears the selection. Off by default: most pickers back a required field. */
  clearable?: boolean;
  /** The clearing row's words, when "None" is not what clearing means — a filter's "All statuses". */
  clearLabel?: string;
  /** The clearing row's own glyph, where the options carry one — Industry's "Not specified" is the generic building. */
  clearIcon?: LucideIcon;
  disabled?: boolean;
  /** What the sheet says when `options` is empty — usually "this tenant has configured none". */
  emptyMessage?: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select',
  error,
  hint,
  required,
  loading,
  clearable,
  clearLabel = 'None',
  clearIcon,
  disabled,
  emptyMessage = 'Nothing to choose from yet.',
}: SelectFieldProps) {
  const sheet = useRef<BottomSheetModal>(null);
  const theme = useTheme();
  const [term, setTerm] = useState('');

  const selected = options.find((option) => option.id === value);
  const openable = !disabled && !loading;
  const showSearch = options.length > SEARCH_THRESHOLD;
  const needle = term.trim().toLowerCase();
  const visible = needle
    ? options.filter((o) => o.label.toLowerCase().includes(needle) || o.detail?.toLowerCase().includes(needle))
    : options;

  const pick = (id: string | undefined) => {
    onChange(id);
    sheet.current?.dismiss();
  };

  return (
    <YStack gap="$1.5">
      <FieldLabel label={label} required={required} />

      <XStack
        items="center"
        justify="space-between"
        gap="$2"
        {...fieldFrame(Boolean(error))}
        opacity={disabled ? 0.5 : 1}
        transition="quicker"
        pressStyle={openable ? { bg: '$color3' } : undefined}
        onPress={openable ? () => sheet.current?.present() : undefined}
        // The row is the control, so it needs the role and a label of its own — the visible label is a separate
        // element that a screen reader would not associate with it.
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${loading ? 'Loading' : (selected?.label ?? placeholder)}`}
        accessibilityState={{ disabled: !openable, busy: loading }}
      >
        {/*
          The chosen option's own glyph, so the field shows what was picked and not only its name — and the clearing
          row's glyph while nothing is picked, e.g. a "Not specified" mark.
        */}
        {selected?.icon ? (
          createElement(selected.icon, { size: 16, color: theme.color10?.val })
        ) : !selected && clearIcon ? (
          createElement(clearIcon, { size: 16, color: theme.color9?.val })
        ) : null}
        <Body numberOfLines={1} color={selected ? '$color12' : '$color9'} flex={1}>
          {loading && !selected ? 'Loading…' : (selected?.label ?? placeholder)}
        </Body>
        {loading ? <Spinner size="small" /> : <ChevronDown size={18} color={theme.color10?.val} />}
      </XStack>

      <FieldMessage error={error} hint={hint} />

      {/* `tall` once there is a search box: a content-sized sheet shrank to the matches with every keystroke while the
          keyboard was up. A fixed height keeps the box and the list where they are. */}
      <Sheet
        ref={sheet}
        title={label}
        scroll
        tall={showSearch}
        // The search box stays at the top while the list scrolls under it.
        pinned={
          showSearch ? (
            <XStack items="center" gap="$2" {...fieldFrame()} bg="$color1" borderColor="$borderColor">
              <Search size={18} color={theme.color10?.val} />
              {/* A plain Tamagui `Input`, not `BottomSheetTextInput`: this one filters a list that is already on
                  screen, and the `tall` sheet keeps it above the keyboard.
                  A field the user *types content into* is the case that needs the sheet-aware input. */}
              <Input
                flex={1}
                value={term}
                onChangeText={setTerm}
                placeholder={`Search ${label.toLowerCase()}`}
                bg="transparent"
                borderWidth={0}
                px={0}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </XStack>
          ) : undefined
        }
        onDismiss={() => setTerm('')}
      >

        {loading ? (
          <XStack py="$4" justify="center">
            <Spinner />
          </XStack>
        ) : visible.length === 0 ? (
          <Muted py="$3">{needle ? `Nothing matches “${term}”.` : emptyMessage}</Muted>
        ) : (
          <YStack>
            {clearable ? (
              <OptionRow label={clearLabel} icon={clearIcon} selected={value === undefined} onPress={() => pick(undefined)} />
            ) : null}
            {visible.map((option) => (
              <OptionRow
                key={option.id}
                label={option.label}
                detail={option.detail}
                icon={option.icon}
                selected={option.id === value}
                onPress={() => pick(option.id)}
              />
            ))}
          </YStack>
        )}
      </Sheet>
    </YStack>
  );
}

function OptionRow({
  label,
  detail,
  icon,
  selected,
  onPress,
}: {
  label: string;
  detail?: string;
  icon?: LucideIcon;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <XStack
      items="center"
      gap="$3"
      py="$3"
      px="$2"
      mx="$-2"
      rounded="$5"
      bg={selected ? '$color3' : undefined}
      transition="quicker"
      pressStyle={{ bg: '$color3' }}
      onPress={onPress}
      accessibilityRole="button"
      // A checkmark is the only thing distinguishing the current selection, and it is invisible to a screen
      // reader without this.
      accessibilityState={{ selected }}
    >
      {icon ? createElement(icon, { size: 18, color: theme.color10?.val }) : null}
      <YStack flex={1} gap="$0.5">
        <Body numberOfLines={2} fontWeight={selected ? '600' : '400'}>
          {label}
        </Body>
        {detail ? <Caption>{detail}</Caption> : null}
      </YStack>
      {/* The brand solid, read from the base theme's merged child colours — the one mark of the current pick. */}
      {selected ? <Check size={18} color={theme.brand9?.val} /> : null}
    </XStack>
  );
}

/**
 * Turn API rows into options — the mapping from a row to an option, written once instead of in every picker.
 * A row with a blank name still gets a label, because a picker with an invisible row is unusable.
 *
 * @example toOptions(categories, (c) => c.id, (c) => c.name, (c) => c.code)
 */
export function toOptions<T>(
  rows: readonly T[] | undefined,
  id: (row: T) => string | number,
  name: (row: T) => string | null | undefined,
  detail?: (row: T) => string | undefined,
): SelectOption[] {
  return (rows ?? []).map((row) => ({
    id: String(id(row)),
    label: name(row)?.trim() || 'Unnamed',
    detail: detail?.(row),
  }));
}

/** A labelled group of fields on a form — the visual unit a `Screen scroll` is made of. */
export function FieldGroup({
  title,
  description,
  icon,
  children,
}: {
  title?: string;
  description?: string;
  /** A small brand-tinted icon before the title, so a long form's sections can be told apart at a glance. */
  icon?: LucideIcon;
  children: ReactNode;
}) {
  // A titled card: the overline sits on the page, the fields on a card under it — the same shape as
  // a detail screen's `SectionCard`, so a form and the record it edits look like the same object.
  return (
    <YStack gap="$2">
      {title ? (
        <YStack px="$1" gap="$0.5">
          <XStack items="center" gap="$2">
            {icon ? <SectionIcon icon={icon} /> : null}
            <Overline>{title}</Overline>
          </XStack>
          {description ? <Caption>{description}</Caption> : null}
        </YStack>
      ) : null}
      <Card gap="$3.5" p="$3.5">
        {children}
      </Card>
    </YStack>
  );
}

/**
 * A section's icon in a small brand circle — `FieldGroup`'s `icon`, and exported for a section that is not a field
 * group (a section that sits on the page, not on a card).
 */
export function SectionIcon({ icon }: { icon: LucideIcon }) {
  return (
    <Theme name="brand">
      <SectionIconInner icon={icon} />
    </Theme>
  );
}

/** Its own component so `useTheme` reads the brand theme it sits in. */
function SectionIconInner({ icon: Icon }: { icon: LucideIcon }) {
  const theme = useTheme();
  return (
    <XStack width={22} height={22} rounded={1000} bg="$color3" items="center" justify="center">
      <Icon size={13} color={theme.color11?.val} />
    </XStack>
  );
}
