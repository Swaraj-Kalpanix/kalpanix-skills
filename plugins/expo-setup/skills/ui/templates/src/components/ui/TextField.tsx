import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import type { TextInputProps } from 'react-native';
import { Input, TextArea, useTheme, YStack, type InputProps } from 'tamagui';

import { FIELD_FOCUS, FIELD_HEIGHT, FieldLabel, FieldMessage, fieldFrame } from './FieldChrome';
import { useSheetFieldFocus } from './Sheet';

/**
 * A labelled text input with its error message — the building block of every form in the app.
 *
 * Beyond a bare input it adds a `hint`, a `required` marker, and the `inSheet` switch below.
 *
 * ## `inSheet` is not cosmetic
 *
 * A text input inside a `@gorhom/bottom-sheet` **must** be `BottomSheetTextInput`, or the sheet does not know
 * the keyboard is coming and the field ends up underneath it. Half the forms in this app live in sheets (change
 * stage, check out, mark lost), so the choice is a prop rather than a second component — one `TextField` that
 * can be wrong in a sheet is better than two components where every call site has to remember which is which.
 *
 * ## The props are an explicit list, not a passthrough
 *
 * This renders one of three things — Tamagui's `Input`, its `TextArea`, or a plain `BottomSheetTextInput` — and
 * their prop types are mutually incompatible in TypeScript: Tamagui's are DOM-typed (`FocusEventHandler<
 * HTMLInputElement>`, `CSSProperties`) while React Native's are native-typed, so `style`, `onFocus`,
 * `onPointerCancel` and a dozen others conflict outright. Spreading one into the other needs a cast per site,
 * and a cast that wide hides real mistakes.
 *
 * So the surface is written out instead: the props a form actually uses, which is also the list that works on
 * all three. It documents itself, and a field that needs something not on it is a change here — visible, and
 * applied to every form at once.
 */
export interface TextFieldProps {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  /** react-hook-form's `field.onBlur`, which takes no argument. */
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  /** From react-hook-form's `fieldState.error`, or a server field error. */
  error?: string;
  /** One line under the field, for a rule the label cannot carry ("Leave empty to clear the follow-up"). */
  hint?: string;
  /** Adds a red asterisk. Presentation only — the zod schema is what actually requires the value. */
  required?: boolean;
  /** `true` when this field is inside a bottom sheet. See above — it is not optional there. */
  inSheet?: boolean;
  multiline?: boolean;
  /** Visible rows when `multiline`. @default 4 */
  rows?: number;
  /**
   * With `multiline`: `rows` becomes the *least* height, and the box grows with what is typed, so the whole value is
   * always on screen — for an address or a link the user must be able to read in full, not scroll inside a box.
   */
  grow?: boolean;
  /**
   * With `grow`: the most rows the box grows to. Past it the box stops growing and its text scrolls inside it — for a
   * value that is usually short but can be long, such as a catalog item's description. Without it, `grow` has no cap.
   */
  maxRows?: number;
  editable?: boolean;
  autoFocus?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  // Tamagui's own union: React Native keeps adding keyboard types (`ascii-capable-number-pad`) Tamagui's Input
  // doesn't declare yet, and every value here must reach both inputs.
  keyboardType?: InputProps['keyboardType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  secureTextEntry?: boolean;
  maxLength?: number;
  /** Select the whole value on focus, so typing replaces it — for a value the app filled in, not the user. */
  selectTextOnFocus?: boolean;
  testID?: string;
}

export function TextField({ label, error, hint, required, inSheet, multiline, rows = 4, grow, maxRows, ...props }: TextFieldProps) {
  const inputId = `field-${label.replace(/\s+/g, '-').toLowerCase()}`;
  // The border is the only signal that a field is wrong — the message below it is easy to miss on a phone
  // where the keyboard covers the bottom half of the screen.
  const frame = fieldFrame(Boolean(error));
  const focusStyle = error ? ({ borderColor: '$red9' } as const) : FIELD_FOCUS;

  return (
    <YStack gap="$1.5">
      <FieldLabel label={label} required={required} htmlFor={inputId} />

      {inSheet ? (
        <SheetInput id={inputId} hasError={Boolean(error)} multiline={multiline} rows={rows} {...props} />
      ) : multiline && grow ? (
        // `Input`, not `TextArea`: a TextArea always sets `numberOfLines`, which fixes its height and scrolls the rest.
        // Without it the native input grows with its text — `scrollEnabled={false}` is what lets it on iOS. With
        // `maxRows` it grows to that cap and then scrolls, so scrolling is on.
        <Input
          id={inputId}
          size="$4"
          multiline
          scrollEnabled={maxRows !== undefined}
          textAlignVertical="top"
          {...frame}
          height="auto"
          minH={rows * LINE_HEIGHT + 20}
          maxH={maxRows !== undefined ? maxRows * LINE_HEIGHT + 20 : undefined}
          py="$2.5"
          placeholderTextColor="$color9"
          focusStyle={focusStyle}
          {...props}
        />
      ) : multiline ? (
        <TextArea
          id={inputId}
          size="$4"
          rows={rows}
          multiline
          // Android centres a fixed-height box's text vertically; start it on the first line, as the `grow` box does
          textAlignVertical="top"
          {...frame}
          py="$2.5"
          placeholderTextColor="$color9"
          focusStyle={focusStyle}
          {...props}
        />
      ) : (
        <Input
          id={inputId}
          size="$4"
          {...frame}
          height={FIELD_HEIGHT}
          placeholderTextColor="$color9"
          focusStyle={focusStyle}
          {...props}
        />
      )}

      <FieldMessage error={error} hint={hint} />
    </YStack>
  );
}

/** Roughly one line of 16px text — used to size a multiline sheet input by rows. */
const LINE_HEIGHT = 22;

type SheetInputProps = Omit<TextFieldProps, 'label' | 'error' | 'hint' | 'required' | 'inSheet' | 'rows'> & {
  id: string;
  hasError: boolean;
  rows: number;
};

/**
 * `BottomSheetTextInput` with the app's field styling.
 *
 * Every visual decision that *can* be a theme token is one, on the Tamagui wrapper. What cannot — a plain
 * `TextInput` takes a React Native style object, not Tamagui props — is the text itself, so `color` and
 * `placeholderTextColor` are read out of the theme in JS rather than left to the platform default. Leaving them
 * out would render black text on the dark theme's near-black sheet.
 */
function SheetInput({ id, hasError, rows, multiline, ...props }: SheetInputProps) {
  const theme = useTheme();
  // In a form sheet, a field that takes focus with the keyboard already up is scrolled above it (`Sheet`).
  const revealInSheet = useSheetFieldFocus();

  return (
    <YStack
      {...fieldFrame(hasError)}
      py={multiline ? '$2.5' : '$2'}
      minH={multiline ? rows * LINE_HEIGHT + 20 : FIELD_HEIGHT}
      justify="center"
    >
      <BottomSheetTextInput
        nativeID={id}
        multiline={multiline}
        placeholderTextColor={theme.color9?.val}
        style={{
          // The body size from the type scale (15) and its family — a raw TextInput inherits neither.
          fontSize: 15,
          fontFamily: 'Geist_400Regular',
          color: theme.color12?.val,
          paddingVertical: 0,
          minHeight: multiline ? rows * LINE_HEIGHT : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        {...props}
        onFocus={() => revealInSheet?.()}
      />
    </YStack>
  );
}
