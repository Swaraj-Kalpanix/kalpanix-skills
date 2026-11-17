import { useState } from 'react';
import { RefreshControl } from 'react-native';
import { useTheme } from 'tamagui';

/**
 * Pull to refresh for a list, in the brand colour. Pass the result to the list's `refreshControl`.
 *
 * **The spinner means a person pulled.** It runs from the pull until `refresh` settles, however long that takes. It is
 * not tied to `isRefetching`, which is also true when a screen refocuses or a save invalidates the list, and made the
 * spinner appear at the top of a list nobody had touched.
 *
 * @example
 * ```tsx
 * const refreshControl = usePullToRefresh(() => orders.refetch());
 * <FlashList refreshControl={refreshControl} … />
 * ```
 */
export function usePullToRefresh(refresh: () => unknown) {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const colour = theme.brand9?.val;

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
      // Android's spinner, on a disc in the surface colour so it reads in both schemes.
      colors={[colour]}
      progressBackgroundColor={theme.background?.val}
      // iOS's spinner.
      tintColor={colour}
    />
  );
}
