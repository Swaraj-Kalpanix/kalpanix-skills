import { useEffect, useState } from 'react';

/**
 * Debounce a value — e.g. a search input feeding a query key.
 * `const debouncedSearch = useDebounce(search, 400);`
 */
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
