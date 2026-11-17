import { FlashList, type FlashListProps } from '@shopify/flash-list';
import { RefreshCcw, WifiOff } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactElement, ReactNode } from 'react';
import { YStack } from 'tamagui';

import type { ApiError } from '@/lib/core';

import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { ListSkeleton } from './ListSkeleton';
import { usePullToRefresh } from './usePullToRefresh';
import { Spinner } from './Spinner';

/**
 * The record list every list screen is built from.
 *
 * `AGENTS.md` requires every list to handle **loading, error, empty, pull-to-refresh and next-page**. Five
 * states, many screens, many chances to skip one — and the ones that get skipped are always the same two: an
 * empty list ships as a blank rectangle that looks like a bug, and an error ships as a blank rectangle that
 * looks like an empty list. So the states live here and a screen passes data.
 *
 * ## It takes the hook's result, not twelve props
 *
 * `useInfiniteList` already returns exactly what this needs. Passing the whole object means a screen cannot
 * wire `isRefetching` to `refreshing` and forget `onRefresh`, and adding a state later is a change here rather
 * than in four screens.
 *
 * ## Why the error state distinguishes offline
 *
 * A live-only app with no offline write queue sees failed reads as a matter of routine in low-signal areas. "No results" would be a lie and "Something went wrong" would read
 * as the server's fault; `code: 'NETWORK'` gets its own screen saying the connection is the problem and the work
 * is not lost.
 */
export interface RecordListProps<T> {
  /** Straight from `useInfiniteList` — see above. */
  query: {
    items: T[];
    isLoading: boolean;
    isRefetching: boolean;
    /** A changed filter or search is loading behind the previous rows (`keepPreviousData`): the skeleton shows. */
    isPlaceholderData?: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    error: ApiError | null;
    fetchNextPage: () => unknown;
    refetch: () => unknown;
  };
  renderItem: FlashListProps<T>['renderItem'];
  keyExtractor: (item: T, index: number) => string;
  /** The empty state. Give it the action that fixes it ("Add an order"), not just a sentence. */
  empty: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode };
  /** Anything above the rows that should scroll with them — a search bar, filter chips, a summary count. */
  header?: ReactElement;
  /** Extra padding at the bottom, for a floating action button. */
  footerSpace?: number;
  /**
   * What a pull to refresh reloads, in place of `query.refetch`. A list whose header shows counts read by other
   * queries passes one that reloads those too — refetching the rows alone left "All 6 · 3 open" stale beside a list
   * that had changed. The pull's spinner (`usePullToRefresh`) runs until what this returns settles, so
   * return the promise.
   */
  onRefresh?: () => unknown;
}

export function RecordList<T>({
  query,
  renderItem,
  keyExtractor,
  empty,
  header,
  footerSpace = 0,
  onRefresh,
}: RecordListProps<T>) {
  const { items, isLoading, isPlaceholderData, isFetchingNextPage, hasNextPage, error, fetchNextPage, refetch } = query;
  // The list runs edge to edge, under the home indicator, so its last row must clear the indicator itself. A tab
  // bar would normally do that, and
  const insets = useSafeAreaInsets();
  // The pull spinner (it runs only while a person pulls) refreshes what the screen names — its counts too — or the
  // rows alone.
  const refreshControl = usePullToRefresh(onRefresh ?? refetch);

  // An error with rows already on screen is a *failed refresh*, not a failed list — replacing a usable list with
  // an error screen would throw away data the user can still act on. The toast has already reported it.
  const showError = error && items.length === 0;

  /*
   * A changed filter, search or quick view is loading. The rows on screen are the previous query's
   * (`keepPreviousData`), so they are put away and the skeleton shows until the new first page has arrived. It is
   * React Query's own `isPlaceholderData`, so it ends exactly when the data does: no timer, no minimum.
   */
  const switching = Boolean(isPlaceholderData);

  return (
    <FlashList
      data={switching ? [] : items}
      // A tap on a row, a chip or the empty state's button acts even while the search keyboard is up — the default
      // ('never') spends the first tap on closing the keyboard.
      keyboardShouldPersistTaps="handled"
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      // No `estimatedItemSize` — removed in FlashList v2.
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage && !switching) void fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      refreshControl={refreshControl}
      ListHeaderComponent={header}
      // `contentContainerStyle` rather than a padded wrapper: padding the list's container keeps the scroll
      // indicator and the pull-to-refresh spinner in the right place, which an outer `YStack` with padding does
      // not.
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 + footerSpace + insets.bottom }}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={
        isLoading || switching ? (
          <ListSkeleton />
        ) : showError ? (
          <ListError error={error} onRetry={() => void refetch()} />
        ) : (
          <EmptyState {...empty} />
        )
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <YStack py="$4" items="center">
            <Spinner />
          </YStack>
        ) : null
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

/** The gap between rows. A component rather than a margin on the card, so the first and last rows sit flush. */
function Separator() {
  return <YStack height={10} />;
}

/**
 * The failed-first-load state.
 *
 * Exported so a **detail** screen can show the same thing — one record failing to load is the same situation as
 * a list failing to load, and two differently worded versions of it is how an app starts to feel arbitrary.
 */
export function ListError({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  const offline = error.code === 'NETWORK';

  return (
    <EmptyState
      variant="error"
      icon={offline ? WifiOff : undefined}
      title={offline ? 'No connection' : 'Could not load'}
      description={
        offline
          ? 'This screen needs a connection. Nothing is lost — reconnect and try again.'
          : // The server's own message. `VALIDATION` errors from `/api/v1` are written for users ("Archive it
            // instead, so its history is kept"), so showing them beats a generic apology.
            error.message
      }
      action={
        <Button icon={<RefreshCcw size={16} />} onPress={onRetry}>
          Try again
        </Button>
      }
    />
  );
}

/** The centred spinner a detail screen shows while its one record loads. */
export function DetailLoading() {
  return (
    <YStack flex={1} items="center" justify="center" py="$8">
      <Spinner size="large" />
    </YStack>
  );
}
