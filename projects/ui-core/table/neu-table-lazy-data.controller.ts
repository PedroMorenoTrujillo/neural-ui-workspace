import type {
  NeuTableLazyRequest,
  NeuTableLazyRequestReason,
  NeuTableQueryState,
  NeuTableVirtualRange,
} from './neu-table.types';

export type NeuTableVirtualSlot<T> =
  | { readonly kind: 'loaded'; readonly logicalIndex: number; readonly row: T }
  | { readonly kind: 'placeholder'; readonly logicalIndex: number };

export interface NeuTableVirtualRangeConfig {
  readonly scrollTop: number;
  readonly itemSize: number;
  readonly visibleItems: number;
  readonly totalItems: number;
  readonly overscan: number;
}

/** Focused transient policy for sparse virtual data. */
export class NeuTableLazyDataController<T> {
  private lastRequestedRange: NeuTableVirtualRange | null = null;
  private nextRequestId = 1;

  itemSize(value: number | undefined, fallback: number): number {
    if (Number.isFinite(value) && value! > 0) return value!;
    return Number.isFinite(fallback) && fallback > 0 ? fallback : 1;
  }

  total(value: number | undefined): number {
    return Number.isFinite(value) && value! > 0 ? Math.floor(value!) : 0;
  }

  range(config: NeuTableVirtualRangeConfig): NeuTableVirtualRange {
    const totalItems = this.total(config.totalItems);
    const itemSize = this.itemSize(config.itemSize, 1);
    const visibleItems = Math.max(1, Math.floor(config.visibleItems) || 1);
    const overscan = Math.max(0, Math.floor(config.overscan) || 0);
    const rawScrollTop = Number.isFinite(config.scrollTop) ? config.scrollTop : 0;
    const maxVisibleFirst = Math.max(0, totalItems - visibleItems);
    const visibleFirst = Math.min(
      maxVisibleFirst,
      Math.max(0, Math.floor(Math.max(0, rawScrollTop) / itemSize)),
    );
    const visibleEnd = Math.min(totalItems, visibleFirst + visibleItems);
    const first = Math.max(0, visibleFirst - overscan);
    const end = Math.min(totalItems, visibleEnd + overscan);

    return Object.freeze({ first, end, visibleFirst, visibleEnd });
  }

  slots(
    range: NeuTableVirtualRange,
    dataFirst: number,
    rows: readonly T[],
  ): readonly NeuTableVirtualSlot<T>[] {
    const first = Math.max(0, Math.floor(range.first) || 0);
    const end = Math.max(first, Math.floor(range.end) || first);
    const windowFirst = Math.max(0, Math.floor(dataFirst) || 0);
    const slots: NeuTableVirtualSlot<T>[] = [];

    for (let logicalIndex = first; logicalIndex < end; logicalIndex++) {
      const windowIndex = logicalIndex - windowFirst;
      if (windowIndex >= 0 && windowIndex < rows.length) {
        slots.push({ kind: 'loaded', logicalIndex, row: rows[windowIndex] });
      } else {
        slots.push({ kind: 'placeholder', logicalIndex });
      }
    }

    return Object.freeze(slots);
  }

  request(
    query: NeuTableQueryState,
    range: NeuTableVirtualRange,
    reason: NeuTableLazyRequestReason,
    force = false,
  ): NeuTableLazyRequest | null {
    if (!force && this.equalRange(this.lastRequestedRange, range)) return null;
    this.lastRequestedRange = range;
    return Object.freeze({
      requestId: this.nextRequestId++,
      reason,
      query,
      range,
    });
  }

  forgetRange(): void {
    this.lastRequestedRange = null;
  }

  equalRange(
    left: NeuTableVirtualRange | null | undefined,
    right: NeuTableVirtualRange | null | undefined,
  ): boolean {
    return (
      left === right ||
      (!!left &&
        !!right &&
        left.first === right.first &&
        left.end === right.end &&
        left.visibleFirst === right.visibleFirst &&
        left.visibleEnd === right.visibleEnd)
    );
  }
}
