import { Label, SizableText, XStack } from 'tamagui';

import { ErrorText, Muted } from './Text';

/**
 * The parts every form control shares — the label above, the message below, and the frame around the value.
 *
 * `TextField`, `SelectField` and `DateField` each drew these themselves and had already drifted (the text field
 * focused to `$color8`, the pickers had no focus state; the sheet input was 44 tall, the others `minH` 44). One
 * definition means a field, a picker and a date in the same form are visibly the same kind of thing.
 */

/** Height of a single-line control. Matches `Button` (44) plus the 1pt border either side. */
export const FIELD_HEIGHT = 46;

/** The frame of a control, as style props. `error` wins over everything; there is no separate focus colour on the pickers, which open a sheet rather than taking focus. */
export function fieldFrame(error?: boolean) {
  return {
    bg: '$background',
    borderWidth: 1,
    borderColor: error ? '$red8' : '$color5',
    rounded: '$5',
    px: '$3',
    minH: FIELD_HEIGHT,
  } as const;
}

/** Focus style for a control that takes the keyboard — a firmer neutral edge, not the brand: red reads as an error. */
export const FIELD_FOCUS = { borderColor: '$color8' } as const;

/** The label above a control. 13pt medium; a required field carries a red asterisk. */
export function FieldLabel({ label, required, htmlFor }: { label: string; required?: boolean; htmlFor?: string }) {
  return (
    <XStack items="center" gap="$1">
      <Label htmlFor={htmlFor} unstyled>
        <SizableText size="$3" fontWeight="500" color="$color11">
          {label}
        </SizableText>
      </Label>
      {required ? (
        <SizableText size="$3" fontWeight="500" color="$red10">
          *
        </SizableText>
      ) : null}
    </XStack>
  );
}

/** The line under a control: the error if there is one, otherwise the hint. */
export function FieldMessage({ error, hint }: { error?: string; hint?: string }) {
  if (error) return <ErrorText>{error}</ErrorText>;
  if (hint) return <Muted size="$2">{hint}</Muted>;
  return null;
}
