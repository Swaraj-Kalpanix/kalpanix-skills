import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Calendar, Clock, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Theme, useTheme, XStack, YStack } from 'tamagui';

import { formatDate, formatTime, parseApiDate, toApiDate } from '@/utils/format';

import { Button } from './Button';
import { CalendarPicker } from './CalendarPicker';
import { FieldLabel, FieldMessage, fieldFrame } from './FieldChrome';
import { IconButton } from './IconButton';
import { Sheet, SheetActions } from './Sheet';
import { Body } from './Text';
import { TimeDial } from './TimeDial';

/**
 * A date or time field, picked in the app's own sheet with an explicit Cancel and Done.
 *
 * ## A date is the app's own calendar; a time is the platform's clock
 *
 * - **A date** is `CalendarPicker`: the chosen day as a heading, quick picks, and a month grid drawn in
 *   Tamagui, the same on both platforms. It replaced the iOS wheel and Android's Material calendar, whose grey
 *   panel showed through every date sheet.
 * - **A time** is still the platform's (`TimeDial`): the iOS wheel and Android's clock face, from `@expo/ui`.
 *
 * ## The value is an API string, not a `Date`
 *
 * `YYYY-MM-DD` for a date and `HH:mm` for a time — exactly what the request bodies carry (e.g. `due_date`,
 * `starts_at.time`). Keeping a `Date` in form state would mean converting at
 * every submit and risking the UTC-midnight off-by-one that `parseApiDate` exists to avoid.
 */
export interface DateFieldProps {
  label: string;
  /** `YYYY-MM-DD` when `mode` is `date`, `HH:mm` when `time`. Empty or invalid renders the placeholder. */
  value?: string;
  onChange: (value: string | undefined) => void;
  mode?: 'date' | 'time';
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Allow clearing back to no value — for an optional follow-up or validity date. */
  clearable?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
}

export function DateField({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder,
  error,
  hint,
  required,
  clearable,
  minimumDate,
  maximumDate,
  disabled,
}: DateFieldProps) {
  const sheet = useRef<BottomSheetModal>(null);
  const theme = useTheme();

  /**
   * The picker is controlled, so it needs a `Date` even when the field is empty.
   *
   * Draft state rather than writing straight through on every scroll tick: the iOS wheel fires a change for each
   * intermediate value, and committing those would make "cancel" meaningless.
   */
  const [draft, setDraft] = useState<Date>(() => toDate(value, mode) ?? new Date());

  const display = value ? (mode === 'time' ? formatTime(timeToDate(value)) : formatDate(value)) : undefined;
  const Icon = mode === 'time' ? Clock : Calendar;

  const open = () => {
    setDraft(toDate(value, mode) ?? new Date());
    sheet.current?.present();
  };

  const commit = () => {
    onChange(mode === 'time' ? toApiTime(draft) : toApiDate(draft));
    sheet.current?.dismiss();
  };

  return (
    <YStack gap="$1.5">
      <FieldLabel label={label} required={required} />

      <XStack
        items="center"
        gap="$2"
        {...fieldFrame(Boolean(error))}
        pr={clearable && value && !disabled ? '$1.5' : '$3'}
        opacity={disabled ? 0.5 : 1}
        transition="quicker"
        pressStyle={disabled ? undefined : { bg: '$color3' }}
        onPress={disabled ? undefined : open}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${display ?? 'Not set'}`}
      >
        <Icon size={16} color={theme.color10?.val} />
        <Body flex={1} numberOfLines={1} color={display ? '$color12' : '$color9'}>
          {display ?? placeholder ?? (mode === 'time' ? 'Select a time' : 'Select a date')}
        </Body>
        {clearable && value && !disabled ? (
          <IconButton
            icon={X}
            size="sm"
            onPress={() => onChange(undefined)}
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
          />
        ) : null}
      </XStack>

      <FieldMessage error={error} hint={hint} />

      {/*
       * Not `scroll`: sized to its content, the calendar and Cancel and Done fit on a phone without scrolling.
       */}
      <Sheet ref={sheet} title={label}>
        {mode === 'time' ? (
          // In the brand theme, so the clock's hand and selection read the brand colour.
          <Theme name="brand">
            <TimeDial value={draft} onChange={setDraft} />
          </Theme>
        ) : (
          <CalendarPicker value={draft} minimumDate={minimumDate} maximumDate={maximumDate} onChange={setDraft} />
        )}
        <SheetActions>
          <Button flex={1} onPress={() => sheet.current?.dismiss()}>
            Cancel
          </Button>
          <Button flex={1} variant="primary" onPress={commit}>
            Done
          </Button>
        </SheetActions>
      </Sheet>
    </YStack>
  );
}

/** The field's string value as a `Date` the picker can take. */
function toDate(value: string | undefined, mode: 'date' | 'time'): Date | undefined {
  if (!value) return undefined;
  return mode === 'time' ? timeToDate(value) : parseApiDate(value);
}

/**
 * `HH:mm` on today's date.
 *
 * A time on its own has no day, but the picker is date-backed — so it is anchored to today, and only the
 * hours and minutes are ever read back out.
 */
function timeToDate(value: string): Date | undefined {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/** `HH:mm`, 24-hour — the form the jsonb time slots are stored in. */
function toApiTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
