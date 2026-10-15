/**
 * Tiny query-string helpers. React Native's `URL` / `URLSearchParams` polyfills
 * are incomplete, so the core never relies on them.
 */

export type QueryValue = string | number | boolean | null | undefined;
export type QueryRecord = Record<string, QueryValue | readonly QueryValue[]>;
export type ParsedQuery = Record<string, string | string[]>;

export type ArrayFormat =
  /** `status=a&status=b` */
  | 'repeat'
  /** `status=a,b` */
  | 'comma';

/** Serialize a record. `null`, `undefined`, and `''` are skipped. */
export function toQueryString(record: QueryRecord, arrayFormat: ArrayFormat = 'repeat'): string {
  const parts: string[] = [];
  const push = (key: string, value: QueryValue) => {
    if (value === null || value === undefined || value === '') return;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  };

  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      const values = value.filter((v) => v !== null && v !== undefined && v !== '');
      if (!values.length) continue;
      if (arrayFormat === 'comma') push(key, values.join(','));
      else values.forEach((v) => push(key, v));
    } else {
      push(key, value as QueryValue);
    }
  }
  return parts.join('&');
}

function decode(part: string): string {
  try {
    return decodeURIComponent(part.replace(/\+/g, ' '));
  } catch {
    return part;
  }
}

/**
 * Parse `a=1&b=2&b=3` → `{ a: '1', b: ['2', '3'] }`. Repeated keys and
 * bracket keys (`sort[0]=x&sort[1]=y`, `ids[]=1` — the `qs` format the crud
 * request builder emits) become arrays, the way Express parses them.
 */
export function parseQueryString(query: string): ParsedQuery {
  const result: ParsedQuery = {};
  const trimmed = query.startsWith('?') ? query.slice(1) : query;
  if (!trimmed) return result;

  for (const pair of trimmed.split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    const rawKey = decode(eq === -1 ? pair : pair.slice(0, eq));
    const value = eq === -1 ? '' : decode(pair.slice(eq + 1));
    const bracket = /^(.+)\[\d*\]$/.exec(rawKey);
    const key = bracket ? bracket[1] : rawKey;
    const existing = result[key];
    if (existing === undefined) result[key] = bracket ? [value] : value;
    else if (Array.isArray(existing)) existing.push(value);
    else result[key] = [existing, value];
  }
  return result;
}

/** Join a path and a query string, skipping the `?` when there is no query. */
export function withQuery(path: string, query: string): string {
  if (!query) return path;
  return `${path}${path.includes('?') ? '&' : '?'}${query}`;
}
