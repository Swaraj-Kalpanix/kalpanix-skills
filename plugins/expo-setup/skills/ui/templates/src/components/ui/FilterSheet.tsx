import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Check, RotateCcw } from 'lucide-react-native';
import { useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import { XStack } from 'tamagui';

import { Button } from './Button';
import { Sheet, type SheetHandle } from './Sheet';

export interface FilterSheetProps<T extends object> {
  ref?: Ref<SheetHandle>;
  title: string;
  /** The filters the list is using now. The sheet edits a copy of them. */
  value: T;
  /** What Reset returns the copy to — usually `{}`; a list with a default filter passes it. */
  empty: T;
  /** Called once, on Apply, with the whole copy. */
  onApply: (value: T) => void;
  /** The fields: the copy to show, and `set` to change it. Nothing reaches the list until Apply. */
  children: (draft: T, set: (patch: Partial<T>) => void) => ReactNode;
}

/**
 * Every list's filter sheet: **nothing applies until Apply**.
 *
 * - **A copy.** Opening the sheet copies the list's filters (`value`). Every chip, switch and picker changes only
 *   the copy, so the list never jumps while a choice is half made.
 * - **Close** drops the copy. **Apply** hands the whole copy to the list once (`onApply`) and closes.
 * - **Reset**, beside the title, returns the copy to `empty`. It too waits for Apply, so a mistaken Reset is undone by
 *   Close.
 * - **Close · Apply are pinned** to the sheet's foot (`Sheet`'s `footer`): they never scroll away under a long list of
 *   filters.
 *
 * Each feature's sheet is only its fields, written against the copy:
 *
 * @example
 * ```tsx
 * <FilterSheet ref={ref} title="Filter orders" value={value} empty={{}} onApply={onApply}>
 *   {(draft, set) => <Chip label="Open" selected={draft.status === 'open'} onPress={() => set({ status: 'open' })} />}
 * </FilterSheet>
 * ```
 */
/** Deep equality for plain filter values (strings, numbers, booleans, arrays, plain objects). */
function isEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((k) => isEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

export function FilterSheet<T extends object>({ ref, title, value, empty, onApply, children }: FilterSheetProps<T>) {
  const sheet = useRef<BottomSheetModal>(null);
  const [draft, setDraft] = useState<T>(value);

  useImperativeHandle(
    ref,
    () => ({
      // A fresh copy each time it opens: what was left unapplied last time is gone, as Close promised.
      present: () => {
        setDraft(value);
        sheet.current?.present();
      },
      dismiss: () => sheet.current?.dismiss(),
    }),
    [value],
  );

  const set = (patch: Partial<T>) => setDraft((current) => ({ ...current, ...patch }));
  const atEmpty = isEqual(draft, empty);

  const apply = () => {
    if (!isEqual(draft, value)) onApply(draft);
    sheet.current?.dismiss();
  };

  return (
    <Sheet
      ref={sheet}
      title={title}
      scroll
      headerAction={
        <Button
          size="$3"
          variant="ghost"
          icon={<RotateCcw size={14} />}
          disabled={atEmpty}
          opacity={atEmpty ? 0.4 : 1}
          onPress={() => setDraft(empty)}
        >
          Reset
        </Button>
      }
      footer={
        <XStack gap="$2.5">
          <Button flex={1} onPress={() => sheet.current?.dismiss()}>
            Close
          </Button>
          <Button flex={2} variant="primary" icon={<Check size={16} />} onPress={apply}>
            Apply
          </Button>
        </XStack>
      }
    >
      {children(draft, set)}
    </Sheet>
  );
}
