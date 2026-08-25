/** Resolves a dotted field path without treating valid falsy values as absent. */
export function resolveNeuTablePath(value: unknown, path: string): unknown {
  if (!path) return value;
  let current = value;
  for (const segment of path.split('.')) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * A deterministic structural token for deep-selection equality. It stores no
 * row objects and distinguishes values that JSON.stringify collapses.
 */
export function neuTableDeepSelectionToken(value: unknown): string {
  const ancestors = new Map<object, number>();
  let nextReference = 0;

  const visit = (candidate: unknown): string => {
    if (candidate === null) return 'null';
    if (candidate === undefined) return 'undefined';
    if (typeof candidate === 'number') {
      if (Number.isNaN(candidate)) return 'number:NaN';
      if (Object.is(candidate, -0)) return 'number:-0';
      return `number:${candidate}`;
    }
    if (typeof candidate === 'string') return `string:${JSON.stringify(candidate)}`;
    if (typeof candidate === 'boolean') return `boolean:${candidate}`;
    if (typeof candidate === 'bigint') return `bigint:${candidate}`;
    if (typeof candidate === 'symbol') return `symbol:${String(candidate.description ?? '')}`;
    if (typeof candidate === 'function') return `function:${candidate.name}`;
    if (candidate instanceof Date) return `date:${candidate.toISOString()}`;

    const object = candidate as object;
    const reference = ancestors.get(object);
    if (reference !== undefined) return `ref:${reference}`;
    ancestors.set(object, nextReference++);
    if (Array.isArray(candidate)) return `array:[${candidate.map(visit).join(',')}]`;
    const entries = Object.keys(candidate as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${visit((candidate as Record<string, unknown>)[key])}`);
    return `object:{${entries.join(',')}}`;
  };

  return visit(value);
}

/** Reference tokens let canonical selection remain key-only in equals mode. */
export class NeuTableReferenceIdentity<T extends object> {
  private readonly _tokens = new WeakMap<T, symbol>();

  key(row: T): symbol {
    let token = this._tokens.get(row);
    if (!token) {
      token = Symbol('neu-table-row');
      this._tokens.set(row, token);
    }
    return token;
  }
}
