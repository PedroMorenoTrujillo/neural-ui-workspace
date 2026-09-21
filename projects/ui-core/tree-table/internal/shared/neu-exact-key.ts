export type NeuExactKey = string | number;

/** Stable token that preserves the semantic distinction between numeric and string keys. */
export function neuExactKeyToken(key: NeuExactKey): string {
  return `${typeof key}:${String(key)}`;
}
