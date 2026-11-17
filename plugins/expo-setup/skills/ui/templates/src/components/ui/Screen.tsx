import type { ReactNode } from 'react';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, type YStackProps } from 'tamagui';

import { OfflineBanner } from './OfflineBanner';

/**
 * The outermost element of every screen: the page colour, safe-area padding, and the standard gutter.
 *
 * Exists so no screen reaches for `useSafeAreaInsets` or an ad-hoc padding value of its own — that is how
 * two screens end up 4px apart for no reason.
 *
 * **The page is `$color1`**, the warm surface, so the white cards on it read as surfaces (the page and the
 * cards must not be the same colour).
 *
 * Only the **bottom** inset is applied by default. The top is handled by the stack header, or by
 * `ScreenHeader` on a module's list; adding it here would double the gap. A screen with neither passes
 * `edges="top"` to opt in.
 *
 * **Every screen says when the phone is offline** (`OfflineBanner`): drawn under the header, outside the
 * scroll, so it stays in view. It renders nothing while online.
 */
export interface ScreenProps extends YStackProps {
  children?: ReactNode;
  /**
   * Make the content scroll.
   *
   * Uses `KeyboardAwareScrollView`, so a screen with inputs keeps the focused field visible with no extra
   * wiring — the reason this is one prop rather than a separate `ScrollScreen`.
   *
   * ⚠ Never inside a bottom sheet: `@gorhom/bottom-sheet` reacts to the keyboard too, and the two libraries
   * fight. Use `BottomSheetScrollView` there (see the design-system skill).
   */
  scroll?: boolean;
  /** Drop the standard gutter — for a screen whose child is a full-bleed list. @default false */
  flush?: boolean;
  /** Which safe-area edges to pad. @default 'bottom' */
  edges?: 'bottom' | 'top' | 'both' | 'none';
  /** Drawn above the content, outside the scroll — a `ScreenHeader`. */
  header?: ReactNode;
  /**
   * Pinned under the content, above the keyboard — a `BottomBar` with the screen's primary action.
   *
   * The footer takes the bottom safe-area inset instead of the content, so the action sits clear of the
   * gesture bar and the content scrolls fully into view above it.
   */
  footer?: ReactNode;
  /**
   * Whether the footer rides up with the keyboard. `true` for a **form**, whose Save must stay above the keyboard
   * while the fields are typed into.
   *
   * `false` for a **record screen** — an order, a job, an invoice — whose own content has nothing to type into
   * except what its sheets hold. A sheet's keyboard is still a keyboard to `KeyboardStickyView`, so the screen's
   * button jumped up behind the sheet each time one was typed into, and dropped back when it closed ("the action should not move"). Pinned, the bar stays where it is, whatever opens over it.
   * @default true
   */
  footerFollowsKeyboard?: boolean;
  /**
   * With `scroll`: how much room to keep between the focused field and the keyboard, in dp. Raise it when the
   * action that ends the form sits under its last field and must stay in view — the sign-in card's button.
   * @default 16, or 96 with a `footer`
   */
  keyboardOffset?: number;
}

/**
 * @example A list screen — the FlashList wants the full width
 * ```tsx
 * <Screen flush edges="none" header={<ScreenHeader title="Orders" />}>
 *   <RecordList … />
 * </Screen>
 * ```
 * @example A form screen with a pinned submit
 * ```tsx
 * <Screen scroll gap="$4" footer={<BottomBar><Button variant="primary">Save</Button></BottomBar>}>
 *   <SectionCard …/>
 * </Screen>
 * ```
 */
export function Screen({
  children,
  scroll,
  flush,
  edges = 'bottom',
  header,
  footer,
  footerFollowsKeyboard = true,
  keyboardOffset,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const wantsBottom = edges === 'bottom' || edges === 'both';
  // A footer owns the bottom inset (see `footer`), so the content does not pad for it twice.
  const pb = wantsBottom && !footer ? insets.bottom : 0;
  const pt = edges === 'top' || edges === 'both' ? insets.top : 0;

  const footerBar = footer ? (
    <YStack pb={wantsBottom ? insets.bottom : 0} bg="$background">
      {footer}
    </YStack>
  ) : null;
  const footerNode =
    footerBar && footerFollowsKeyboard ? (
      <KeyboardStickyView offset={{ opened: wantsBottom ? insets.bottom : 0 }}>{footerBar}</KeyboardStickyView>
    ) : (
      footerBar
    );

  if (scroll) {
    return (
      <YStack flex={1} bg="$color1" pt={pt}>
        {header}
        <OfflineBanner />
        <KeyboardAwareScrollView
          // Enough that a focused field is never flush against the keyboard — or against a pinned footer.
          bottomOffset={keyboardOffset ?? (footer ? 96 : 16)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: pb + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <YStack flex={1} p={flush ? 0 : '$3.5'} {...props}>
            {children}
          </YStack>
        </KeyboardAwareScrollView>
        {footerNode}
      </YStack>
    );
  }

  // Two elements on purpose: the outer one owns the safe-area insets and the inner one the gutter. Combining
  // them would mean `p="$3.5"` and `pt={0}` on the same element, where the later prop wins and one of the two
  // silently loses — which is how a screen ends up with no top padding.
  return (
    <YStack flex={1} bg="$color1" pt={pt} pb={pb}>
      {header}
      <OfflineBanner />
      <YStack flex={1} p={flush ? 0 : '$3.5'} {...props}>
        {children}
      </YStack>
      {footerNode}
    </YStack>
  );
}
