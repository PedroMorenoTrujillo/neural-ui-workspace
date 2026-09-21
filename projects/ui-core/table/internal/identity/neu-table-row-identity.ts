import type { NeuRowKey, NeuRowTrackBy, NeuTableKey } from '../../public/neu-table.types';

export interface NeuTableRenderRow<T, K extends NeuTableKey> {
  readonly row: T;
  readonly key: K;
  readonly index: number;
  readonly track: unknown;
  readonly pin: 'start' | 'end' | null;
}

export function neuTableIdentityToken(key: NeuTableKey): string {
  return `${typeof key}:${String(key)}`;
}

export function projectNeuTableRows<T, K extends NeuTableKey>(
  data: readonly T[],
  rowKey: NeuRowKey<T, K>,
  rowTrackBy: NeuRowTrackBy<T> | undefined,
  pin: ((row: T, key: K) => 'start' | 'end' | null) | undefined,
  diagnoseDuplicateKeys: boolean,
): readonly NeuTableRenderRow<T, K>[] {
  const seen = new Set<string>();
  const start: NeuTableRenderRow<T, K>[] = [];
  const middle: NeuTableRenderRow<T, K>[] = [];
  const end: NeuTableRenderRow<T, K>[] = [];

  for (const [sourceIndex, row] of data.entries()) {
    const key = rowKey(row);
    const token = neuTableIdentityToken(key);
    if (diagnoseDuplicateKeys && seen.has(token)) {
      throw new Error(`NeuTable 2 duplicate row key: ${token}`);
    }
    seen.add(token);
    const rowPin = pin?.(row, key) ?? null;
    const renderRow: NeuTableRenderRow<T, K> = {
      row,
      key,
      index: sourceIndex,
      track: rowTrackBy?.(sourceIndex, row) ?? token,
      pin: rowPin,
    };
    if (rowPin === 'start') start.push(renderRow);
    else if (rowPin === 'end') end.push(renderRow);
    else middle.push(renderRow);
  }

  const ordered = [...start, ...middle, ...end];
  return ordered.map((entry, index) => ({ ...entry, index }));
}
