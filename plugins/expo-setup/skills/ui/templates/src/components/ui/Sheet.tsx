import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type {
  BottomSheetBackdropProps,
  BottomSheetFooterProps,
  BottomSheetScrollViewMethods,
} from '@gorhom/bottom-sheet';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentRef,
  type FC,
  type Ref,
  type ReactNode,
} from 'react';
import { BackHandler, Keyboard, TextInput, useWindowDimensions, type View } from 'react-native';
import { KeyboardEvents } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, XStack, YStack, type TamaguiElement } from 'tamagui';

import { Muted, Subtitle } from './Text';

/**
 * Every bottom sheet in the app.
 *
 * `@gorhom/bottom-sheet` needs seven props configured the same way each time — backdrop, background, handle,
 * and the three keyboard props — and getting one of them wrong is how a sheet ends up behind the keyboard or
 * without a dimmed backdrop. Four modules open sheets for filters, pickers and short forms, so this is the one
 * place those decisions are made.
 *
 * ## What is fixed here, and why
 *
 * - **`enableDynamicSizing`** and no `snapPoints`. Every sheet in the app is content-sized (a short form, a
 *   list of statuses); the two settings are mutually exclusive, and picking a snap point would mean guessing a
 *   height that is wrong on the first device with a different font scale.
 * - **The keyboard** (a multiline note field sat under it on Android):
 *   - `android_keyboardInputMode="adjustPan"` means **the library lifts the sheet itself**. It is not the window's
 *     soft-input mode. `adjustResize` told the library that Android would shrink the window for the keyboard, so
 *     it skipped the lift, but an edge-to-edge app under `KeyboardProvider` never shrinks. Nothing moved, and the
 *     lower half of every sheet stayed under the keyboard.
 *   - A short sheet (`keyboardBehavior="interactive"`) rises above the keyboard and comes back down when it closes
 *     (`keyboardBlurBehavior="restore"`).
 *   - A **form** sheet (`scroll`, not `tall`) can be taller than the room above the keyboard. While typing it fills
 *     the screen (`fillParent`), and the focused field is scrolled to just above the keyboard (`revealFocused`) —
 *     when the keyboard has risen, and again as each field takes focus (`useSheetFieldFocus`, which `TextField`
 *     calls). The library already ends the sheet's scroll area at the keyboard, so no room is added under the
 *     fields: the keyboard's height of it showed as a blank gap at the end of the list.
 * - **`enablePanDownToClose`**, with the backdrop also closing it — a sheet a user cannot dismiss by the two
 *   gestures they will try is a trap.
 * - **The bottom safe-area inset** is applied to the content, not the sheet: a sheet sits at the bottom of the
 *   screen, so without it the last button is under the home indicator.
 *
 * @example
 * ```tsx
 * const sheet = useRef<BottomSheetModal>(null);
 * <Button onPress={() => sheet.current?.present()}>Change status</Button>
 * <Sheet ref={sheet} title="Change status" description="Pick the status this order has moved to.">
 *   …
 * </Sheet>
 * ```
 */
export interface SheetProps {
  title: string;
  /** One sentence under the title. Use it for the rule the user needs before they act, not to restate the title. */
  description?: string;
  children: ReactNode;
  /** Wrap the content in a `BottomSheetScrollView` — for a long list or a form with several fields. */
  scroll?: boolean;
  /**
   * Open at nearly the full screen height instead of sizing to the content — for a **search picker**.
   *
   * A content-sized sheet with a search box at its top opens low; the moment the keyboard rises it covers most of
   * the results, and the sheet resizes again with every keystroke as the matches change. A fixed tall sheet keeps
   * the box and the list where they are while the user types. Implies `scroll`.
   */
  tall?: boolean;
  /**
   * A `tall` sheet's list was scrolled to within a screenful of its end — a picker loads its next page here
   * Called again as long as the end stays in reach, so the handler must ignore a call while a page is
   * already loading or when there is none left.
   */
  onEndReached?: () => void;
  /**
   * A `tall` sheet's **pinned** part — a search picker's search box. Given, the title, the description and
   * this stay at the top of the sheet and only `children` scroll under them, so the box is in reach however far the
   * list has been scrolled. Without it, a tall sheet scrolls as one piece, as before.
   */
  pinned?: ReactNode;
  onDismiss?: () => void;
  /**
   * Pinned to the sheet's foot, outside the scroll — a filter's Close · Apply. It stays put while the content scrolls
   * and rides above the keyboard, and the content is given its height of room so its last row is never under it.
   */
  footer?: ReactNode;
  /** Beside the title, at its right — a filter's Reset. */
  headerAction?: ReactNode;
}

/** A `tall` sheet's one height. Module-level, so the array is stable across renders as the library requires. */
const TALL_SNAP_POINTS = ['90%'];

/** How far above the keyboard a revealed field sits. */
const REVEAL_GAP = 24;

/**
 * A form sheet's "a field took focus" — `null` outside one. `TextField` calls it, so moving between fields with the
 * keyboard already up still brings the new one into view.
 */
const SheetFieldFocusContext = createContext<(() => void) | null>(null);

/** Call on a sheet field's focus. Does nothing outside a form sheet. */
export function useSheetFieldFocus() {
  return useContext(SheetFieldFocusContext);
}

export const Sheet = forwardRef<BottomSheetModal, SheetProps>(function Sheet(
  { title, description, children, scroll, tall, onEndReached, pinned, onDismiss, footer, headerAction },
  ref,
) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  /*
   * ## Android Back closes the sheet, not the screen under it
   *
   * `@gorhom/bottom-sheet` does not listen to the hardware Back button, so Back went straight to the navigator and
   * left the screen the sheet was opened on — taking a half-filled form with it.
   *
   * While this sheet is open it registers its own Back handler that closes it and swallows the press. Android calls
   * Back handlers **most recent first**, so with a picker open on top of another sheet the picker closes first, then
   * the sheet under it, and only then does Back reach the screen — the order a person expects.
   *
   * The library's own ref is kept here as well as handed to the caller, because the handler needs to close the
   * sheet itself without the caller's help.
   */
  const own = useRef<BottomSheetModal | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      own.current?.dismiss();
      return true;
    });
    return () => subscription.remove();
  }, [open]);

  /*
   * ## A form sheet keeps the focused field above the keyboard
   *
   * Once the keyboard is up (`keyboardDidShow`), the focused input is measured against this sheet's content.
   * An input that is not in it (a picker stacked on top) fails the measurement and is left alone. Otherwise the list
   * scrolls by exactly how far the field reaches under the keyboard.
   */
  const form = Boolean(scroll) && !tall;
  const scrollView = useRef<BottomSheetScrollViewMethods>(null);
  /*
   * `onEndReached` for a tall sheet: the list's end is within a screenful of the bottom of what shows. Checked on scroll
   * **and** whenever the list or the sheet changes size — a first page too short to scroll would otherwise never ask
   * for the next. The handler ignores calls while a page loads or when none is left.
   */
  const endCheck = useRef({ viewport: 0, content: 0, offset: 0 });
  const checkEnd = () => {
    const { viewport, content, offset } = endCheck.current;
    if (onEndReached && viewport > 0 && content > 0 && offset + viewport >= content - viewport) onEndReached();
  };
  const body = useRef<ComponentRef<typeof View>>(null);
  const scrollY = useRef(0);
  const keyboardHeight = useRef(0);

  const revealFocused = () => {
    const input = TextInput.State.currentlyFocusedInput();
    const content = body.current;
    if (!input || !content || keyboardHeight.current === 0) return;
    input.measureLayout(
      content,
      (_x, inputY, _width, inputHeight) => {
        content.measureInWindow((_cx, contentTop) => {
          const keyboardTop = windowHeight - keyboardHeight.current;
          const overlap = contentTop + inputY + inputHeight + REVEAL_GAP - keyboardTop;
          if (overlap > 0) scrollView.current?.scrollTo({ y: scrollY.current + overlap, animated: true });
        });
      },
      () => undefined,
    );
  };

  // The latest `revealFocused`, for the listeners below without resubscribing them on every render.
  const revealAfterKeyboard = useEffectEvent(() => revealFocused());

  useEffect(() => {
    if (!open || !form) return;
    // After the sheet has finished rising to fill the screen.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const didShow = KeyboardEvents.addListener('keyboardDidShow', (event) => {
      keyboardHeight.current = event.height;
      timer = setTimeout(revealAfterKeyboard, 60);
    });
    const willHide = KeyboardEvents.addListener('keyboardWillHide', () => {
      keyboardHeight.current = 0;
    });
    return () => {
      clearTimeout(timer);
      didShow.remove();
      willHide.remove();
    };
  }, [open, form]);

  /** A field took focus: with the keyboard already up, bring it into view once its focus has settled. */
  const onFieldFocus = () => {
    if (keyboardHeight.current > 0) setTimeout(revealFocused, 60);
  };

  const setRefs = (instance: BottomSheetModal | null) => {
    own.current = instance;
    // The caller gets the sheet with a `present()` that closes the keyboard first — see `closingKeyboard`.
    const handed = instance ? closingKeyboard(instance) : null;
    if (typeof ref === 'function') ref(handed);
    else if (ref) ref.current = handed;
  };

  /*
   * The footer component is created **once** per sheet and reads its content from a slot. The library renders
   * `footerComponent` as a component, so a new function each render would remount the buttons on every keystroke and
   * every chip tapped; the slot keeps the component and updates only what it shows.
   */
  const [footerSlot] = useState(() => createSlot(footer));
  const [Footer] = useState(() => footerFor(footerSlot));
  useLayoutEffect(() => footerSlot.set(footer), [footerSlot, footer]);
  const hasFooter = footer !== undefined && footer !== null;

  const heading = (
    <XStack items="flex-start" gap="$3">
      <YStack flex={1} gap="$1">
        <Subtitle size="$6">{title}</Subtitle>
        {description ? <Muted>{description}</Muted> : null}
      </YStack>
      {headerAction}
    </XStack>
  );
  // A tall sheet with a pinned part: the heading and that part stay put above the scrolling list.
  const pinnedTop = tall && pinned !== undefined && pinned !== null;

  const content = (
    <SheetFieldFocusContext.Provider value={form ? onFieldFocus : null}>
      {/* With a footer, the foot's safe-area inset is the footer's to keep, not the content's. */}
      {/* On native a Tamagui stack is a View; its ref is typed for the web (`TamaguiElement`), hence the cast. */}
      <YStack ref={body as unknown as Ref<TamaguiElement>} px="$3.5" pt="$1" pb={hasFooter ? 16 : insets.bottom + 16} gap="$4">
        {pinnedTop ? null : heading}
        {children}
      </YStack>
    </SheetFieldFocusContext.Provider>
  );

  return (
    <BottomSheetModal
      ref={setRefs}
      /*
       * ⚠ `push`, not the library's default `switch`. A `SelectField` in a sheet — a status picker
       * in a form — is itself a sheet, and it is mounted *inside* this one's content. Under `switch`, presenting it
       * minimizes this sheet, which takes the picker down with it: on the emulator tapping the
       * option closed the parent outright and nothing opened. `push`
       * stacks the picker on top and leaves its parent where it was.
       */
      stackBehavior="push"
      // Content-sized, except a `tall` picker, which takes a fixed 90% so typing never moves it (see `tall`).
      enableDynamicSizing={!tall}
      snapPoints={tall ? TALL_SNAP_POINTS : undefined}
      /*
       * ⚠ The cap is on the **sheet**, not on the list inside it. It used to be `maxHeight: 520` on the scroll view,
       * while dynamic sizing still grew the sheet to the *whole* list's height — so a long picker opened full-screen
       * with its rows stopping at 520pt and an empty band below them. Capping the
       * sheet at 85% of the screen lets it shrink to a short list and stop at a long one, with the list filling it.
       */
      maxDynamicContentSize={Math.round(windowHeight * 0.85) - insets.top}
      enablePanDownToClose
      // -1 is closed. Tracked so the Back handler exists only while the sheet is up.
      onChange={(index) => setOpen(index >= 0)}
      onDismiss={() => {
        setOpen(false);
        onDismiss?.();
      }}
      backdropComponent={SheetBackdrop}
      footerComponent={hasFooter ? Footer : undefined}
      // 20pt top corners and the card colour: a sheet is a card raised over the screen, so it uses the card's
      // surface and a radius one step rounder than a card's, the way a dialog does.
      backgroundStyle={{ backgroundColor: theme.background?.val, borderRadius: 20 }}
      handleIndicatorStyle={{ backgroundColor: theme.color6?.val, width: 36 }}
      // Never under the status bar, which a form sheet filling the screen would otherwise reach.
      topInset={insets.top}
      keyboardBehavior={form ? 'fillParent' : 'interactive'}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustPan"
    >
      {tall ? (
        // Fills the snap point. With `pinned`, the heading and the pinned part stay put and the list scrolls under them.
        <YStack flex={1}>
          {pinnedTop ? (
            <YStack px="$3.5" pt="$1" pb="$3" gap="$4">
              {heading}
              {pinned}
            </YStack>
          ) : null}
          <BottomSheetScrollView
            keyboardShouldPersistTaps="handled"
            enableFooterMarginAdjustment={hasFooter}
            onLayout={
              onEndReached
                ? (event) => {
                    endCheck.current.viewport = event.nativeEvent.layout.height;
                    checkEnd();
                  }
                : undefined
            }
            onContentSizeChange={
              onEndReached
                ? (_width, height) => {
                    endCheck.current.content = height;
                    checkEnd();
                  }
                : undefined
            }
            onScroll={
              onEndReached
                ? (event) => {
                    endCheck.current.offset = event.nativeEvent.contentOffset.y;
                    checkEnd();
                  }
                : undefined
            }
          >
            {content}
          </BottomSheetScrollView>
        </YStack>
      ) : scroll ? (
        <BottomSheetScrollView
          ref={scrollView}
          keyboardShouldPersistTaps="handled"
          enableFooterMarginAdjustment={hasFooter}
          onScroll={(event) => {
            scrollY.current = event.nativeEvent.contentOffset.y;
          }}
        >
          {content}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView enableFooterMarginAdjustment={hasFooter}>{content}</BottomSheetView>
      )}
    </BottomSheetModal>
  );
});

/** One wrapper per sheet instance, so the ref the caller holds stays the same object between renders. */
const keyboardClosing = new WeakMap<BottomSheetModal, BottomSheetModal>();

/**
 * The sheet as its caller holds it — the same methods, but **`present()` closes the keyboard first** (a keyboard left open
 * when a dropdown opens a sheet should close).
 *
 * Done here, once, because every sheet in the app opens through this ref: a `SelectField`, `DateField`,
 * `FilterSheet`, and every feature sheet. Left open, the keyboard sat over the sheet's
 * options and pushed it up, and the field it belonged to stayed focused behind the sheet.
 *
 * `Keyboard.dismiss()` **blurs the field that has focus now** — the one on the screen under the sheet — before the sheet
 * mounts. A sheet that focuses its own search box on opening (a record picker) still gets its
 * keyboard: that box takes focus after this, once it is drawn.
 */
function closingKeyboard(modal: BottomSheetModal): BottomSheetModal {
  const cached = keyboardClosing.get(modal);
  if (cached) return cached;
  const present = (...args: Parameters<BottomSheetModal['present']>) => {
    Keyboard.dismiss();
    modal.present(...args);
  };
  // A Proxy, not a copy: every other method is the sheet's own, whether it lives on the object or on a prototype (the
  // test mock's sheet is a class; a spread copied none of its methods).
  const wrapped = new Proxy(modal, {
    get(target, key, receiver) {
      if (key === 'present') return present;
      const value = Reflect.get(target, key, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  keyboardClosing.set(modal, wrapped);
  return wrapped;
}

/**
 * What a screen holds a reference to when it owns a sheet.
 *
 * Two methods instead of `BottomSheetModal`'s full surface, because a screen only ever needs to open and close
 * one — and because the sheet itself needs to close itself after a successful save. Passing the raw
 * `BottomSheetModal` ref down through a feature sheet would mean every one of them casting the forwarded ref back
 * to a ref object to call `.dismiss()`, which is noise in eight files.
 */
export interface SheetHandle {
  present(): void;
  dismiss(): void;
}

/**
 * Wire a feature sheet's forwarded `SheetHandle` to the `BottomSheetModal` inside it.
 *
 * @returns The ref to put on the `Sheet` — usable inside the component for its own `dismiss()` too.
 * @example
 * ```tsx
 * export const StatusSheet = forwardRef<SheetHandle, Props>(function StatusSheet(props, ref) {
 *   const sheet = useSheetHandle(ref);
 *   …
 *   return <Sheet ref={sheet} title="Change status">…</Sheet>;
 * });
 * ```
 */
export function useSheetHandle(ref: Ref<SheetHandle>) {
  const inner = useRef<BottomSheetModal>(null);
  useImperativeHandle(
    ref,
    () => ({
      present: () => inner.current?.present(),
      dismiss: () => inner.current?.dismiss(),
    }),
    [],
  );
  return inner;
}

/** A value one component reads and another writes — the footer's content, outside React's tree. */
interface Slot<T> {
  get: () => T;
  set: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
}

function createSlot<T>(initial: T): Slot<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next) => {
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** The sheet's pinned foot: a hairline over the sheet's surface, the bottom inset kept, and whatever the slot holds. */
function footerFor(slot: Slot<ReactNode>): FC<BottomSheetFooterProps> {
  return function SheetFooter(props: BottomSheetFooterProps) {
    const node = useSyncExternalStore(slot.subscribe, slot.get);
    const insets = useSafeAreaInsets();
    return (
      <BottomSheetFooter {...props}>
        <YStack bg="$background" borderTopWidth={1} borderColor="$borderColor" px="$3.5" pt="$3" pb={insets.bottom + 12}>
          {node}
        </YStack>
      </BottomSheetFooter>
    );
  };
}

/** Dimmed backdrop that appears with the sheet and closes it on tap. */
function SheetBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />;
}

/**
 * A row of buttons at the bottom of a sheet or a form.
 *
 * Give each button `flex={1}` so a pair comes out the same width — an asymmetric "Cancel / Confirm" reads as
 * one of them being the safe choice, which is only true when it actually is. Tamagui v5 uses `styleCompat:
 * 'web'`, so children of a stack do not stretch on their own.
 */
export function SheetActions({ children }: { children: ReactNode }) {
  return (
    <XStack gap="$2.5" pt="$1">
      {children}
    </XStack>
  );
}
