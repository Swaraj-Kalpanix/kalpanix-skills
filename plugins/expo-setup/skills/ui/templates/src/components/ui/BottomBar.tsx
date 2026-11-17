import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';

import { Caption } from './Text';

/**
 * The pinned action bar at the bottom of a detail or form screen — pass it as `Screen`'s `footer`.
 *
 * Holds the screen's **one** primary action (Save, Place order, Mark paid) and at most one alternative beside
 * it. Pinned because the action is the reason the screen exists: scrolling to the end of a form to find Save,
 * is the commonest complaint about a mobile form.
 *
 * `note` puts one line of context above the buttons — "This order is closed", "Draft · last saved …".
 * Children share the width equally; give the primary `flex={2}` to make it the wider one.
 */
export function BottomBar({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <YStack borderTopWidth={1} borderColor="$borderColor" bg="$background" px="$3.5" pt="$3" pb="$3" gap="$2">
      {note ? typeof note === 'string' ? <Caption text="center">{note}</Caption> : note : null}
      <XStack gap="$2.5" items="center">
        {children}
      </XStack>
    </YStack>
  );
}
