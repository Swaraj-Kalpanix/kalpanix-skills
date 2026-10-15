import { useEffect, useRef, useState } from 'react';

export interface DebouncedFunction<TArgs extends unknown[]> {
  (...args: TArgs): void;
  cancel(): void;
  /** Run the pending call now. */
  flush(): void;
}

/**
 * A debounced callback with a stable identity. Always calls the latest
 * `callback`; pending calls are cancelled on unmount.
 *
 * `const save = useDebouncedCallback((text: string) => saveDraft(text), 500);`
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs = 400,
): DebouncedFunction<TArgs> {
  const callbackRef = useRef(callback);
  const delayRef = useRef(delayMs);
  useEffect(() => {
    callbackRef.current = callback;
    delayRef.current = delayMs;
  });

  const [debounced] = useState(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: TArgs | undefined;

    const fn = ((...args: TArgs) => {
      pending = args;
      if (timer) clearTimeout(timer);
      timer = setTimeout(fn.flush, delayRef.current);
    }) as DebouncedFunction<TArgs>;

    fn.cancel = () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
      pending = undefined;
    };
    fn.flush = () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
      if (!pending) return;
      const args = pending;
      pending = undefined;
      callbackRef.current(...args);
    };
    return fn;
  });

  useEffect(() => debounced.cancel, [debounced]);
  return debounced;
}
