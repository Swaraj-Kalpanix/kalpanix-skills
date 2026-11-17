import { cloneElement, useEffect, useState, type ComponentRef, type ReactElement } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Portal, SizableText, YStack } from 'tamagui';

/** How long the bubble stays up once shown. Long enough to read a sentence, short enough not to linger. */
const SHOW_MS = 3000;

/** The widest a bubble may grow before its text wraps. */
const MAX_WIDTH = 240;

/** The bubble's distance from the control, and the least it keeps from the screen's edges. */
const GAP = 8;

/** The pointer: a small square turned 45°, half of it showing above (or below) the bubble. */
const ARROW = 10;

/** The least the pointer keeps from the bubble's rounded corners. */
const ARROW_INSET = 10;

/**
 * Only one bubble on screen at a time: opening one closes the last, so two chips side by side never show
 * two bubbles at once and a reader cannot pair a bubble with the wrong chip.
 */
let openCount = 0;
let active: { id: number; hide: () => void } | null = null;

export interface TooltipProps {
  /** What the bubble says — a control's name, or a sentence on what a view holds. */
  label: string;
  /**
   * Which edge of the control the bubble lines up with. `end` for a control near the right edge of the screen (a
   * header action), so the bubble grows leftwards; `center` for one that can sit anywhere, such as a chip in a row.
   * Whatever the alignment, the bubble is kept on the screen, and its pointer stays on the control.
   */
  align?: 'start' | 'center' | 'end';
  /**
   * What opens the bubble. `longPress` (the default) for a control whose tap does something of its own — an
   * `IconButton`, a `Chip`. `press` for an element a tap does nothing on, such as a status chip that only labels: there a
   * long press is invisible, so a tap explains it instead.
   */
  trigger?: 'longPress' | 'press';
  /** The control — any element that takes `onLongPress` (or `onPress`, for `trigger="press"`). */
  children: ReactElement<{
    onLongPress?: () => void;
    onPress?: () => void;
    accessibilityRole?: string;
    accessibilityHint?: string;
  }>;
}

/** Where the control is on the screen, from `measureInWindow`. */
interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A **press-and-hold** label: a tooltip normally shows on hover, and a phone has no hover, so here a long press shows a
 * small bubble by the control for a moment. A tap still does what the control does; a tap on the bubble closes it.
 *
 * ## Drawn in a portal
 *
 * The bubble is drawn in Tamagui's `Portal`, over the whole app, at the control's measured place on the screen. A
 * bubble drawn beside the control was cut off by any parent that clips — a chip row scrolls sideways, and a
 * `ScrollView` clips what hangs out of it — and could sit under a sibling drawn later.
 *
 * ## Placed by its own size, with a pointer
 *
 * The bubble used to sit in a fixed 240-wide frame that was pushed back onto the screen; a short bubble for a chip
 * towards the right then landed under the chip **beside** it (a status chip under its neighbour). Now the bubble
 * is measured and placed by its own width, moving only as far as the screen's edge requires, and a pointer marks the
 * control it belongs to. It opens below the control, or above it when there is no room below.
 *
 * ## Why not Expo's
 *
 * `@expo/ui` has a tooltip only on **Android** (`TooltipBox`, Jetpack Compose) — nothing on iOS — and its anchor must
 * be one of Expo's own native controls, so it could not wrap the app's `IconButton` or `Chip`. This is Tamagui, which
 * the app already draws everything with, so it looks and behaves the same on both phones.
 */
export function Tooltip({ label, align = 'center', trigger = 'longPress', children }: TooltipProps) {
  // The control's view, held as state through a callback ref rather than in `useRef`: the long-press handler is handed
  // to the child during render, and the React Compiler's lint refuses a ref read reachable from render.
  const [node, setNode] = useState<ComponentRef<typeof View> | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  // The bubble's own size, measured once it is drawn; until then it is drawn invisibly to be measured.
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [id] = useState(() => ++openCount);
  const screen = useWindowDimensions();

  useEffect(() => {
    if (!anchor) return;
    const timer = setTimeout(() => setAnchor(null), SHOW_MS);
    return () => {
      clearTimeout(timer);
      if (active?.id === id) active = null;
    };
  }, [anchor, id]);

  const show = () =>
    node?.measureInWindow((x, y, width, height) => {
      if (active && active.id !== id) active.hide();
      active = { id, hide: () => setAnchor(null) };
      setSize(null);
      setAnchor({ x, y, width, height });
    });

  let bubble = null;
  if (anchor) {
    const width = size?.width ?? 0;
    const height = size?.height ?? 0;
    const wanted =
      align === 'end' ? anchor.x + anchor.width - width : align === 'start' ? anchor.x : anchor.x + anchor.width / 2 - width / 2;
    const left = Math.max(GAP, Math.min(wanted, screen.width - GAP - width));
    const below = anchor.y + anchor.height + GAP;
    const fitsBelow = below + height <= screen.height - GAP;
    const top = fitsBelow ? below : anchor.y - GAP - height;
    // The pointer under the control's centre, kept off the bubble's rounded corners.
    const arrowLeft = Math.max(ARROW_INSET, Math.min(anchor.x + anchor.width / 2 - left - ARROW / 2, width - ARROW_INSET - ARROW));

    bubble = (
      <Portal>
        <YStack
          position="absolute"
          t={top}
          l={left}
          maxW={Math.min(MAX_WIDTH, screen.width - GAP * 2)}
          // Drawn invisibly the first time, to be measured; then placed and shown.
          opacity={size ? 1 : 0}
          onLayout={(event) => {
            const { width: w, height: h } = event.nativeEvent.layout;
            if (!size || Math.abs(size.width - w) > 0.5 || Math.abs(size.height - h) > 0.5) setSize({ width: w, height: h });
          }}
          onPress={() => setAnchor(null)}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          <YStack
            position="absolute"
            l={arrowLeft}
            {...(fitsBelow ? { t: -ARROW / 2 } : { b: -ARROW / 2 })}
            width={ARROW}
            height={ARROW}
            bg="$color12"
            rotate="45deg"
          />
          <YStack px="$2.5" py="$1.5" rounded="$4" bg="$color12" elevation={6}>
            <SizableText size="$2" fontWeight="600" color="$color1">
              {label}
            </SizableText>
          </YStack>
        </YStack>
      </Portal>
    );
  }

  return (
    // `collapsable={false}`: on Android a view that only wraps another can be flattened away, and then there is
    // nothing to measure.
    <View ref={setNode} collapsable={false}>
      {cloneElement(
        children,
        trigger === 'press'
          ? // A tap explains it, and a screen reader is told so — the bubble's text is read when it appears.
            { onPress: show, accessibilityRole: 'button', accessibilityHint: 'Shows what this means' }
          : { onLongPress: show },
      )}
      {bubble}
    </View>
  );
}
