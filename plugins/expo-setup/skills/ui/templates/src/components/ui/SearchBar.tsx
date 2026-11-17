import { Search, X } from 'lucide-react-native';
import { Input, useTheme, XStack } from 'tamagui';

import { IconButton } from './IconButton';

/**
 * The search field at the top of a list.
 *
 * A card-coloured field on the page, the same height and radius as every input (44 / 10), with the clear
 * button inside it. `clearButtonMode` is iOS-only; the explicit `X` is what gives Android the same affordance.
 */
export interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search' }: SearchBarProps) {
  const theme = useTheme();

  return (
    <XStack
      flex={1}
      items="center"
      gap="$2"
      bg="$background"
      rounded="$5"
      pl="$3"
      pr="$1.5"
      height={44}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Search size={18} color={theme.color10?.val} />
      <Input
        flex={1}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="$color9"
        size="$4"
        bg="transparent"
        borderWidth={0}
        px={0}
        height={42}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value.length > 0 ? (
        <IconButton icon={X} size="sm" accessibilityLabel="Clear search" onPress={() => onChangeText('')} />
      ) : null}
    </XStack>
  );
}
