import { Spinner as TamaguiSpinner, useTheme, type SpinnerProps } from 'tamagui';

/**
 * The app's loading spinner, in the brand colour. A spinner on a filled button passes its label colour,
 * because the theme colour would vanish against the button.
 */
export function Spinner({ color, ...props }: SpinnerProps) {
  const theme = useTheme();
  return <TamaguiSpinner color={color ?? theme.brand9?.val} {...props} />;
}
