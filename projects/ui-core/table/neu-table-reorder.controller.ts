import type { NeuTableRowReorderScope } from './neu-table.types';

export interface InternalNeuTableRowReorderResult<T extends object> {
  readonly row: T;
  readonly key: unknown;
  readonly previousIndex: number;
  readonly currentIndex: number;
  readonly previousDataIndex: number;
  readonly currentDataIndex: number;
  readonly scope: NeuTableRowReorderScope;
  readonly rows: readonly T[];
  readonly visibleRows: readonly T[];
}

/** Builds immutable row-order proposals without owning or mutating consumer data. */
export class NeuTableReorderController<T extends object> {
  reorder(
    sourceRows: readonly T[],
    visibleRows: readonly T[],
    draggedKey: unknown,
    targetKey: unknown,
    placement: 'before' | 'after',
    keyOf: (row: T) => unknown,
    scope: NeuTableRowReorderScope,
  ): InternalNeuTableRowReorderResult<T> | null {
    const previousIndex = visibleRows.findIndex((row) => Object.is(keyOf(row), draggedKey));
    const targetIndex = visibleRows.findIndex((row) => Object.is(keyOf(row), targetKey));
    const row = visibleRows[previousIndex];
    if (!row || previousIndex === targetIndex || targetIndex < 0) return null;

    const nextVisible = [...visibleRows];
    nextVisible.splice(previousIndex, 1);
    let currentIndex =
      nextVisible.findIndex((candidate) => Object.is(keyOf(candidate), targetKey)) +
      (placement === 'after' ? 1 : 0);
    currentIndex = Math.max(0, Math.min(currentIndex, nextVisible.length));
    nextVisible.splice(currentIndex, 0, row);
    if (currentIndex === previousIndex) return null;

    const visibleKeys = new Set(visibleRows.map(keyOf));
    let visibleCursor = 0;
    const rows = sourceRows.map((candidate) =>
      visibleKeys.has(keyOf(candidate)) ? nextVisible[visibleCursor++]! : candidate,
    );
    const previousDataIndex = sourceRows.findIndex((candidate) =>
      Object.is(keyOf(candidate), draggedKey),
    );
    const currentDataIndex = rows.findIndex((candidate) => Object.is(keyOf(candidate), draggedKey));

    return {
      row,
      key: draggedKey,
      previousIndex,
      currentIndex,
      previousDataIndex,
      currentDataIndex,
      scope,
      rows: Object.freeze(rows),
      visibleRows: Object.freeze(nextVisible),
    };
  }
}
