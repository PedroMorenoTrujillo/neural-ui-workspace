import type { NeuTableColumnResizeMode } from './neu-table.types';

export interface InternalNeuTableColumnMetric {
  readonly key: string;
  readonly width: number;
  readonly minWidth: number;
  readonly maxWidth: number;
  readonly frozen: 'left' | 'right' | null;
}

export interface InternalNeuTableResizeResult {
  readonly key: string;
  readonly width: number;
  readonly delta: number;
  readonly adjacentKey?: string;
  readonly adjacentWidth?: number;
  readonly widths: Readonly<Record<string, number>>;
}

export interface InternalNeuTableColumnReorderResult {
  readonly key: string;
  readonly previousIndex: number;
  readonly currentIndex: number;
  readonly order: readonly string[];
}

/** Pure fit/expand sizing and stable-key column reorder policy. */
export class NeuTableLayoutController {
  resize(
    columns: readonly InternalNeuTableColumnMetric[],
    key: string,
    requestedDelta: number,
    mode: NeuTableColumnResizeMode,
  ): InternalNeuTableResizeResult | null {
    const index = columns.findIndex((column) => column.key === key);
    const column = columns[index];
    if (!column || !Number.isFinite(requestedDelta)) return null;

    const adjacent = mode === 'fit' ? columns[index + 1] : undefined;
    if (mode === 'fit' && !adjacent) return null;

    let minimumDelta = column.minWidth - column.width;
    let maximumDelta = column.maxWidth - column.width;
    if (adjacent) {
      minimumDelta = Math.max(minimumDelta, adjacent.width - adjacent.maxWidth);
      maximumDelta = Math.min(maximumDelta, adjacent.width - adjacent.minWidth);
    }
    const delta = Math.round(Math.min(maximumDelta, Math.max(minimumDelta, requestedDelta)));
    if (delta === 0) return null;

    const width = Math.round(column.width + delta);
    const widths: Record<string, number> = { [key]: width };
    if (!adjacent) return { key, width, delta, widths: Object.freeze(widths) };

    const adjacentWidth = Math.round(adjacent.width - delta);
    widths[adjacent.key] = adjacentWidth;
    return {
      key,
      width,
      delta,
      adjacentKey: adjacent.key,
      adjacentWidth,
      widths: Object.freeze(widths),
    };
  }

  reorder(
    columns: readonly InternalNeuTableColumnMetric[],
    key: string,
    targetKey: string,
    placement: 'before' | 'after',
  ): InternalNeuTableColumnReorderResult | null {
    const previousIndex = columns.findIndex((column) => column.key === key);
    const targetIndex = columns.findIndex((column) => column.key === targetKey);
    const column = columns[previousIndex];
    const target = columns[targetIndex];
    if (!column || !target || previousIndex === targetIndex || column.frozen !== target.frozen) {
      return null;
    }

    const order = columns.map((candidate) => candidate.key);
    order.splice(previousIndex, 1);
    let insertionIndex = order.indexOf(targetKey) + (placement === 'after' ? 1 : 0);
    insertionIndex = Math.max(0, Math.min(insertionIndex, order.length));
    order.splice(insertionIndex, 0, key);
    if (insertionIndex === previousIndex) return null;

    return {
      key,
      previousIndex,
      currentIndex: insertionIndex,
      order: Object.freeze(order),
    };
  }
}
