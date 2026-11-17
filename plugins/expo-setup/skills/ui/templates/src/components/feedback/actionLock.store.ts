/**
 * Work that blocks the screen while it runs but is not a React Query mutation: signing in and signing out.
 * `ActionLock` reads this beside the running mutations.
 */
let running = 0;
const listeners = new Set<() => void>();

function changeBy(delta: number) {
  running += delta;
  listeners.forEach((listener) => listener());
}

export function subscribeActionLock(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isActionLocked(): boolean {
  return running > 0;
}

/** Runs `work` with every touch on the app blocked until it settles. */
export async function whileActionLocked<T>(work: () => Promise<T>): Promise<T> {
  changeBy(1);
  try {
    return await work();
  } finally {
    changeBy(-1);
  }
}
