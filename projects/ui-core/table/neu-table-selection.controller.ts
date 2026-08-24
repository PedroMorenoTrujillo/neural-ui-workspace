import type {
  NeuTableSelectAllScope,
  NeuTableSelection,
  NeuTableSelectionMode,
} from './neu-table.types';

/**
 * Stateless selection semantics around the canonical selected-key set.
 * NeuTableStateController remains the only mutable owner of selected keys.
 */
export class NeuTableSelectionController<T, K = unknown> {
  constructor(private readonly _keyOf: (row: T) => K) {}

  keysFromSelection(selection: NeuTableSelection<T>, mode: NeuTableSelectionMode): ReadonlySet<K> {
    if (mode === 'none' || selection === null) return new Set();
    const rows = Array.isArray(selection) ? selection : [selection as T];
    const normalized = mode === 'single' ? rows.slice(0, 1) : rows;
    return new Set(normalized.map((row) => this._keyOf(row)));
  }

  resolveRows(keys: ReadonlySet<K>, rows: readonly T[], suppliedRows: readonly T[] = []): T[] {
    const resolved = new Map<K, T>();
    for (const row of rows) {
      const key = this._keyOf(row);
      if (keys.has(key) && !resolved.has(key)) resolved.set(key, row);
    }
    for (const row of suppliedRows) {
      const key = this._keyOf(row);
      if (keys.has(key) && !resolved.has(key)) resolved.set(key, row);
    }
    return [...resolved.values()];
  }

  scopedRows(
    scope: NeuTableSelectAllScope,
    pageRows: readonly T[],
    filteredRows: readonly T[],
    selectable: (row: T, index: number) => boolean,
    allRows: readonly T[],
  ): T[] {
    const rows = scope === 'page' ? pageRows : filteredRows;
    const indexes = this._indexByKey(allRows);
    const seen = new Set<K>();
    return rows.filter((row) => {
      const key = this._keyOf(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return selectable(row, indexes.get(key) ?? -1);
    });
  }

  headerState(
    keys: ReadonlySet<K>,
    rows: readonly T[],
  ): { checked: boolean; indeterminate: boolean; disabled: boolean } {
    if (rows.length === 0) return { checked: false, indeterminate: false, disabled: true };
    let selected = 0;
    for (const row of rows) if (keys.has(this._keyOf(row))) selected++;
    return {
      checked: selected === rows.length,
      indeterminate: selected > 0 && selected < rows.length,
      disabled: false,
    };
  }

  toggleRow(
    keys: ReadonlySet<K>,
    row: T,
    mode: NeuTableSelectionMode,
    toggleSelected = true,
    replaceMultiple = false,
  ): ReadonlySet<K> {
    if (mode === 'none') return new Set(keys);
    const key = this._keyOf(row);
    if (mode === 'single') {
      if (keys.has(key)) return toggleSelected ? new Set() : new Set(keys);
      return new Set([key]);
    }
    const next = replaceMultiple ? new Set<K>() : new Set(keys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  }

  toggleAll(keys: ReadonlySet<K>, rows: readonly T[]): ReadonlySet<K> {
    const state = this.headerState(keys, rows);
    const next = new Set(keys);
    for (const row of rows) {
      const key = this._keyOf(row);
      if (state.checked) next.delete(key);
      else next.add(key);
    }
    return next;
  }

  indexOf(row: T, rows: readonly T[]): number {
    return this._indexByKey(rows).get(this._keyOf(row)) ?? -1;
  }

  rowForKey(key: K, rows: readonly T[], suppliedRows: readonly T[] = []): T | undefined {
    return (
      rows.find((row) => Object.is(this._keyOf(row), key)) ??
      suppliedRows.find((row) => Object.is(this._keyOf(row), key))
    );
  }

  private _indexByKey(rows: readonly T[]): Map<K, number> {
    const indexes = new Map<K, number>();
    rows.forEach((row, index) => {
      const key = this._keyOf(row);
      if (!indexes.has(key)) indexes.set(key, index);
    });
    return indexes;
  }
}
