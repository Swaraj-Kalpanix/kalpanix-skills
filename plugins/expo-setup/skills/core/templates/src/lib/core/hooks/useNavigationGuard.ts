import { useRouter, type Href } from 'expo-router';
import { useRef } from 'react';

/**
 * Expo Router navigation that ignores repeat taps: after a navigation, further
 * calls within `lockMs` are dropped — so a double tap doesn't open a screen twice.
 *
 * ```tsx
 * const nav = useNavigationGuard();
 * <Pressable onPress={() => nav.push(`/leads/${lead.id}`)} />
 * ```
 */
export function useNavigationGuard(lockMs = 500) {
  const router = useRouter();
  const lockedUntil = useRef(0);

  const run = (action: () => void) => {
    const now = Date.now();
    if (now < lockedUntil.current) return;
    lockedUntil.current = now + lockMs;
    action();
  };

  return {
    push: (href: Href) => run(() => router.push(href)),
    navigate: (href: Href) => run(() => router.navigate(href)),
    replace: (href: Href) => run(() => router.replace(href)),
    back: () => run(() => router.back()),
  };
}
