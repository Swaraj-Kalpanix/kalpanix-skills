import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { SizableText, Theme, XStack, YStack, type ColorTokens } from 'tamagui';

import { LOCALE, threeLetterMonths } from '@/utils/format';

import { IconButton } from './IconButton';
import { Caption } from './Text';
import { useBrandSolid } from './useBrandSolid';

export interface CalendarPickerProps {
  /** The chosen day, a local `Date`. Only its year, month and day are read. */
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

/** Monday first, the common calendar layout. */
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_SIZE = 38;

/**
 * The app's own month calendar, drawn in Tamagui so it is the same on iOS and Android and sits in the
 * sheet's own surface. It replaced the iOS wheel and Android's Material calendar, whose grey panel showed through
 * every date sheet.
 *
 * - **The chosen day as a heading** ("Tue, 4 Nov"), with Today or Tomorrow beside it, so the result reads before
 *   Done.
 * - **Quick picks**: Today, Tomorrow, next Monday, a week from today. They are the dates set most often.
 * - **The month**: arrows either side of its name, the weekday letters, then the days. The chosen day is a solid
 *   brand disc, today has a brand ring, and a day outside `minimumDate`…`maximumDate` is faded and cannot be pressed.
 *
 * Every date here is a **local** day. Nothing is converted to UTC, so the Android "one day early" translation the
 * Material calendar needed is gone with it.
 */
export function CalendarPicker({ value, onChange, minimumDate, maximumDate }: CalendarPickerProps) {
  const [month, setMonth] = useState(() => firstOfMonth(value));
  const today = startOfDay(new Date());
  const min = minimumDate ? startOfDay(minimumDate) : undefined;
  const max = maximumDate ? startOfDay(maximumDate) : undefined;
  const allowed = (day: Date) => (!min || day >= min) && (!max || day <= max);

  const pick = (day: Date) => {
    if (!allowed(day)) return;
    onChange(day);
    setMonth(firstOfMonth(day));
  };

  const previousMonth = addMonths(month, -1);
  const nextMonth = addMonths(month, 1);
  const canGoBack = !min || lastOfMonth(previousMonth) >= min;
  const canGoForward = !max || nextMonth <= max;

  const chosen = startOfDay(value);
  const relative = relativeName(chosen, today);
  const quickPicks = [
    { label: 'Today', day: today },
    { label: 'Tomorrow', day: addDays(today, 1) },
    { label: 'Next Mon', day: nextMonday(today) },
    { label: 'In a week', day: addDays(today, 7) },
  ];

  return (
    <YStack gap="$3.5">
      {/* ── The chosen day ─────────────────────────────────────────────── */}
      <XStack items="center" justify="space-between" gap="$3">
        <SizableText size="$8" fontFamily="$heading" fontWeight="700" color="$color12" numberOfLines={1} shrink={1}>
          {headingFor(chosen, today)}
        </SizableText>
        {relative ? (
          <Theme name="brand">
            <XStack px="$2.5" py="$1" rounded={1000} bg="$color3">
              <Caption color="$color11" fontWeight="600">
                {relative}
              </Caption>
            </XStack>
          </Theme>
        ) : null}
      </XStack>

      {/* ── Quick picks ───────────────────────────────────────────────── */}
      <XStack gap="$2" flexWrap="wrap">
        {quickPicks.map(({ label, day }) => (
          <QuickPick
            key={label}
            label={label}
            selected={sameDay(day, chosen)}
            disabled={!allowed(day)}
            onPress={() => pick(day)}
          />
        ))}
      </XStack>

      {/* ── The month ─────────────────────────────────────────────────── */}
      <YStack borderWidth={1} borderColor="$borderColor" rounded="$8" px="$2" pt="$2.5" pb="$2" gap="$1.5">
        <XStack items="center" justify="space-between" px="$1">
          <IconButton
            icon={ChevronLeft}
            variant="soft"
            size="sm"
            disabled={!canGoBack}
            accessibilityLabel="Previous month"
            onPress={() => setMonth(previousMonth)}
          />
          <SizableText size="$5" fontWeight="600" color="$color12">
            {monthName(month)}
          </SizableText>
          <IconButton
            icon={ChevronRight}
            variant="soft"
            size="sm"
            disabled={!canGoForward}
            accessibilityLabel="Next month"
            onPress={() => setMonth(nextMonth)}
          />
        </XStack>

        <XStack>
          {WEEKDAYS.map((letter, index) => (
            <YStack key={index} flex={1} items="center" py="$1">
              <Caption color="$color9" fontWeight="600">
                {letter}
              </Caption>
            </YStack>
          ))}
        </XStack>

        {weeksOf(month).map((week, row) => (
          <XStack key={row}>
            {week.map((day, column) => (
              <YStack key={column} flex={1} items="center" py="$0.5">
                {day ? (
                  <Day
                    day={day}
                    selected={sameDay(day, chosen)}
                    today={sameDay(day, today)}
                    disabled={!allowed(day)}
                    onPress={() => pick(day)}
                  />
                ) : (
                  <YStack width={DAY_SIZE} height={DAY_SIZE} />
                )}
              </YStack>
            ))}
          </XStack>
        ))}
      </YStack>
    </YStack>
  );
}

interface DayProps {
  day: Date;
  selected: boolean;
  today: boolean;
  disabled: boolean;
  onPress: () => void;
}

/**
 * One day: a solid brand disc when chosen, a brand ring when today, faded when it cannot be picked.
 *
 * Only the chosen day renders in the brand theme; the rest stay neutral, so an ordinary day reads in the page's ink.
 */
function Day(props: DayProps) {
  return props.selected ? (
    <Theme name="brand">
      <ChosenDay {...props} />
    </Theme>
  ) : (
    <YStack
      width={DAY_SIZE}
      height={DAY_SIZE}
      rounded={1000}
      items="center"
      justify="center"
      borderWidth={props.today ? 1.5 : 0}
      borderColor="$brand9"
      pressStyle={props.disabled ? undefined : { bg: '$color3' }}
      onPress={props.disabled ? undefined : props.onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibleDay(props.day)}
      accessibilityState={{ selected: false, disabled: props.disabled }}
    >
      <SizableText
        size="$4"
        fontWeight={props.today ? '600' : '400'}
        color={props.disabled ? '$color7' : props.today ? '$brand10' : '$color12'}
      >
        {props.day.getDate()}
      </SizableText>
    </YStack>
  );
}

/** The chosen day's disc — its own component so `useBrandSolid` reads the brand theme `Day` wraps it in. */
function ChosenDay({ day }: DayProps) {
  const brand = useBrandSolid();
  return (
    <YStack
      width={DAY_SIZE}
      height={DAY_SIZE}
      rounded={1000}
      items="center"
      justify="center"
      bg={brand.bg}
      accessibilityRole="button"
      accessibilityLabel={accessibleDay(day)}
      accessibilityState={{ selected: true }}
    >
      <SizableText size="$4" fontWeight="600" color={brand.label as ColorTokens}>
        {day.getDate()}
      </SizableText>
    </YStack>
  );
}

interface QuickPickProps {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}

/** A quick pick: an outlined pill, or a solid brand one when it is the chosen day. */
function QuickPick(props: QuickPickProps) {
  return props.selected ? (
    <Theme name="brand">
      <ChosenQuickPick {...props} />
    </Theme>
  ) : (
    <XStack
      px="$3"
      py="$1.5"
      rounded={1000}
      borderWidth={1}
      borderColor="$borderColor"
      opacity={props.disabled ? 0.4 : 1}
      pressStyle={props.disabled ? undefined : { bg: '$color3' }}
      onPress={props.disabled ? undefined : props.onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: false, disabled: props.disabled }}
    >
      <Caption fontWeight="600" color="$color12">
        {props.label}
      </Caption>
    </XStack>
  );
}

/** Its own component so `useBrandSolid` reads the brand theme. */
function ChosenQuickPick({ label }: QuickPickProps) {
  const brand = useBrandSolid();
  return (
    <XStack
      px="$3"
      py="$1.5"
      rounded={1000}
      borderWidth={1}
      borderColor="transparent"
      bg={brand.bg}
      accessibilityRole="button"
      accessibilityState={{ selected: true }}
    >
      <Caption fontWeight="600" color={brand.label as ColorTokens}>
        {label}
      </Caption>
    </XStack>
  );
}

// ── Dates — local days throughout ─────────────────────────────────────────────────────────────────────────────

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function lastOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** The coming Monday — a week on when today is one. */
function nextMonday(today: Date): Date {
  const daysUntil = ((8 - today.getDay()) % 7) || 7;
  return addDays(today, daysUntil);
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** The month's days in rows of seven, Monday first, with `null` before the 1st and after the last. */
function weeksOf(month: Date): (Date | null)[][] {
  const lead = (month.getDay() + 6) % 7;
  const count = lastOfMonth(month).getDate();
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7));
}

/** `Today`, `Tomorrow` or `Yesterday`, else nothing. */
function relativeName(day: Date, today: Date): string | undefined {
  const offset = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  if (offset === -1) return 'Yesterday';
  return undefined;
}

/** `Tue, 4 Nov`, with the year only when it is not this one. */
function headingFor(day: Date, today: Date): string {
  return threeLetterMonths(
    new Intl.DateTimeFormat(LOCALE, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      ...(day.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
    }).format(day),
  );
}

/** `November 2026`. */
function monthName(month: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' }).format(month);
}

/** `Tuesday, 4 November 2026` — what a screen reader says for a day. */
function accessibleDay(day: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    day,
  );
}
