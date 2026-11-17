import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useTheme } from 'tamagui';

export interface TimeDialProps {
  /** The time shown, as a local `Date`; only its hours and minutes matter. */
  value: Date;
  onChange: (date: Date) => void;
}

/**
 * The time picker inside `DateField`'s sheet — the iOS wheel.
 *
 * Android has its own file, `TimeDial.android.tsx`, which colours Material's clock element by element; that needs
 * the Compose component directly, which exists only on Android, hence the split rather than a `Platform` check.
 *
 * Must render inside the brand theme, so the accent is the brand colour.
 */
export function TimeDial({ value, onChange }: TimeDialProps) {
  const theme = useTheme();
  return (
    <DateTimePicker
      value={value}
      mode="time"
      presentation="inline"
      display="spinner"
      style={{ width: '100%' }}
      accentColor={theme.color9?.val}
      onValueChange={(_event, date) => onChange(date)}
    />
  );
}
