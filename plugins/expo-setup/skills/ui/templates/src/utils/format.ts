/**
 * The app's shared formatting module — dates, day labels and number parsing. It grows as features need it
 * (money, percentages, names, addresses…): add a formatter here once instead of letting each screen decide.
 *
 * ## Every function tolerates missing input
 *
 * That is not defensive habit; it is what APIs are like. Numeric columns often arrive as strings, absent fields
 * are `null` or omitted, and older rows may lack newer fields. A formatter that threw on any of those would take
 * a whole list down over one bad row, so each returns a **dash** instead.
 */

/** What every formatter renders for "not set" — an em dash, so a missing value looks absent, not unloaded. */
export const EMPTY = '—';

/** The locale every `Intl` formatter here uses. Change it in one place. */
export const LOCALE = 'en-IN';

/**
 * A number from a `numeric` column, which may already be a number or may be its string form.
 *
 * @returns `undefined` for anything that is not a finite number, including `''` and `null` — both of which a
 *   database really produces.
 */
export function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Parse a date the API might send.
 *
 * Handles the forms an API typically produces: a full ISO timestamp, a Postgres-style timestamp, a bare
 * `YYYY-MM-DD`, and a `YYYY-MM-DDTHH:mm` built by joining a date and a time.
 *
 * A bare date is read as **local midnight**, not UTC midnight. `new Date('2026-09-27')` is UTC by
 * specification, which renders as the 26th anywhere west of Greenwich — an off-by-one that shows users yesterday's
 * date.
 */
export function parseApiDate(value: unknown): Date | undefined {
  // A `Date` passes straight through. `DateField` hands `formatTime` one for a time-only value, and refusing it here
  // drew every time picker as "—" with a value set.
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (!value || typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const bareDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (bareDate) {
    const [, year, month, day] = bareDate;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const parsed = new Date(toIsoTimestamp(trimmed));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Postgres's own text form of a `timestamptz` — `2026-09-26 05:20:17.536+00` — as ISO 8601.
 *
 * ⚠ **Hermes does not parse the Postgres form.** Some backends (an ORM in string mode) hand back exactly that
 * text: a space instead of `T`, and a two-digit `+00` offset. V8 is lenient about both, so it works in tests and
 * on the web; on the phone it is an Invalid Date, and every list timestamp renders as "—".
 *
 * Anything that is not this shape is returned untouched.
 */
function toIsoTimestamp(value: string): string {
  const pg = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)(?:([+-]\d{2})(?::?(\d{2}))?)?$/.exec(value);
  if (!pg) return value;
  const [, date, time, offsetHours, offsetMinutes] = pg;
  return offsetHours ? `${date}T${time}${offsetHours}:${offsetMinutes ?? '00'}` : `${date}T${time}`;
}

/**
 * Some locales' short September is **"Sept"** — every other month has three letters — while date-fns' `MMM` is
 * always three ("Sep"). Every `Intl` short-month format passes through this so the app is consistent.
 *
 * @example threeLetterMonths('27 Sept 2026, 3:40 pm') // '27 Sep 2026, 3:40 pm'
 */
export function threeLetterMonths(text: string): string {
  return text.replace(/\bSept\b/g, 'Sep');
}

/** `27 Sep 2026`. */
export function formatDate(value: unknown): string {
  const date = parseApiDate(value);
  if (!date) return EMPTY;
  return threeLetterMonths(new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' }).format(date));
}

/** `27 Sep 2026, 3:40 pm`. */
export function formatDateTime(value: unknown): string {
  const date = parseApiDate(value);
  if (!date) return EMPTY;
  return threeLetterMonths(
    new Intl.DateTimeFormat(LOCALE, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date),
  );
}

/** `3:40 pm`. */
export function formatTime(value: unknown): string {
  const date = parseApiDate(value);
  if (!date) return EMPTY;
  return new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
}

/** Midnight local, for comparing dates without their time. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Whole days from today: `0` today, `1` tomorrow, `-1` yesterday. */
export function daysFromToday(value: unknown, now: Date = new Date()): number | undefined {
  const date = parseApiDate(value);
  if (!date) return undefined;
  return Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);
}

/**
 * A section header for a day: `Today`, `Tomorrow`, `Yesterday`, else the date. For lists grouped by day on the
 * client.
 */
export function formatDayLabel(value: unknown, now: Date = new Date()): string {
  const offset = daysFromToday(value, now);
  if (offset === undefined) return 'No date';
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  if (offset === -1) return 'Yesterday';
  return formatDate(value);
}

/** `YYYY-MM-DD` for a request body, from a `Date`. Local, matching how the app parses one back. */
export function toApiDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
