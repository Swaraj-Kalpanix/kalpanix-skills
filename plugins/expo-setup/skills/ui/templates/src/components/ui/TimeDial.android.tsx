import { DateTimePicker as ComposeDateTimePicker, Host } from '@expo/ui/jetpack-compose';
import { useTheme } from 'tamagui';

import type { TimeDialProps } from './TimeDial';

/**
 * Android's Material clock, coloured element by element.
 *
 * ## Why not the community `DateTimePicker` the date picker uses
 *
 * That wrapper takes one `accentColor` and paints it on the **selected hour box**, but leaves the digits inside at
 * Material's default dark navy — so with the brand colour the hour read navy-on-brand, the least legible thing on the
 * screen (seen on the emulator). It does not pass `elementColors` through; the Compose component underneath does,
 * so this uses that directly.
 *
 * The scheme is Material's own pattern in the brand's colours: a **light tint** behind the selected hour or minute
 * with **dark brand-tinted** digits, and the **brand colour** for the hand and the selected number on the dial.
 *
 * Must render inside the brand theme — `DateField` wraps it — so `color3`/`color9`/`color11` are the brand steps.
 *
 * ⚠ The time picker reads the device's own time zone (`ExpoTimePicker` in @expo/ui's `DatePickerView.kt`), so
 * unlike the date calendar it needs no UTC translation.
 */
export function TimeDial({ value, onChange }: TimeDialProps) {
  const theme = useTheme();
  const tint = theme.color3?.val;
  const brand = theme.color9?.val;
  const ink = theme.color11?.val;

  return (
    // Full width, as the date picker: a Compose `Host` sizes itself vertically only, and under a centring parent it
    // measures zero wide and draws nothing.
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <ComposeDateTimePicker
        initialDate={value.toISOString()}
        displayedComponents="hourAndMinute"
        variant="picker"
        showVariantToggle={false}
        is24Hour={false}
        color={brand}
        elementColors={{
          timeSelectorSelectedContainerColor: tint,
          timeSelectorSelectedContentColor: ink,
          selectorColor: brand,
          clockDialColor: tint,
          periodSelectorSelectedContainerColor: tint,
          periodSelectorSelectedContentColor: ink,
        }}
        onDateSelected={(date) => {
          if (date) onChange(date);
        }}
      />
    </Host>
  );
}
