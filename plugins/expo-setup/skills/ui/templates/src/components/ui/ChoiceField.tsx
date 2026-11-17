import type { LucideIcon } from 'lucide-react-native';
import { XStack, YStack } from 'tamagui';

import { Chip } from './Chip';
import { FieldLabel, FieldMessage } from './FieldChrome';

/**
 * A single choice among a **few** options, shown as pills — Call / Meeting / Email, Incoming / Outgoing.
 *
 * For two to six short options every one of them should be visible: a `SelectField` would hide them behind a
 * tap and a sheet for no gain. Past six, or with long labels, use `SelectField`.
 *
 * Tapping the selected pill again clears it only when `clearable` — otherwise a required choice could be
 * un-made by a stray double tap.
 */
export interface ChoiceOption {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export interface ChoiceFieldProps {
  label: string;
  value?: string;
  onChange: (id: string | undefined) => void;
  options: readonly ChoiceOption[];
  required?: boolean;
  clearable?: boolean;
  error?: string;
  hint?: string;
}

export function ChoiceField({ label, value, onChange, options, required, clearable, error, hint }: ChoiceFieldProps) {
  return (
    <YStack gap="$2">
      <FieldLabel label={label} required={required} />
      <XStack flexWrap="wrap" gap="$2" accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <Chip
              key={option.id}
              label={option.label}
              icon={option.icon}
              selected={selected}
              accessibilityRole="radio"
              onPress={() => onChange(selected && clearable ? undefined : option.id)}
            />
          );
        })}
      </XStack>
      <FieldMessage error={error} hint={hint} />
    </YStack>
  );
}
