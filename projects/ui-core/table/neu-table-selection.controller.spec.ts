import { describe, expect, it } from 'vitest';
import { NeuTableSelectionController } from './neu-table-selection.controller';

interface Row {
  id: number | string;
  label: string;
  disabled?: boolean;
}

const rows: Row[] = [
  { id: 0, label: 'Zero' },
  { id: 'one', label: 'One' },
  { id: 2, label: 'Two', disabled: true },
];

describe('NeuTableSelectionController', () => {
  const controller = new NeuTableSelectionController<Row, number | string>((row) => row.id);

  it('normalizes controlled single and multiple values to key identity', () => {
    expect(controller.keysFromSelection(rows, 'single')).toEqual(new Set([0]));
    expect(controller.keysFromSelection(rows, 'multiple')).toEqual(new Set([0, 'one', 2]));
    expect(controller.keysFromSelection(null, 'multiple')).toEqual(new Set());
  });

  it('normalizes none, empty and duplicate controlled values without retaining row objects', () => {
    const duplicate = { ...rows[0], label: 'Duplicate zero' };

    expect(controller.keysFromSelection(rows, 'none')).toEqual(new Set());
    expect(controller.keysFromSelection([], 'multiple')).toEqual(new Set());
    expect(controller.keysFromSelection([rows[0], duplicate], 'multiple')).toEqual(new Set([0]));
  });

  it('resolves reconstructed data to the newest instance and handles duplicate keys first-win', () => {
    const replacements: Row[] = [
      { id: 0, label: 'New zero' },
      { id: 0, label: 'Duplicate zero' },
      { id: 'one', label: 'New one' },
    ];

    const resolved = controller.resolveRows(new Set([0, 'one']), replacements, rows);

    expect(resolved).toEqual([replacements[0], replacements[2]]);
    expect(resolved[0]).toBe(replacements[0]);
  });

  it('keeps selected keys that are absent from the loaded rows', () => {
    const keys = new Set<number | string>([0, 99]);

    expect(controller.resolveRows(keys, rows)).toEqual([rows[0]]);
    expect(keys).toEqual(new Set([0, 99]));
  });

  it('resolves supplied-row fallbacks without replacing a matching current-data row', () => {
    const suppliedOnly = { id: 9, label: 'Supplied nine' };
    const staleZero = { id: 0, label: 'Stale zero' };

    expect(controller.resolveRows(new Set([0, 9, 10]), rows, [staleZero, suppliedOnly])).toEqual([
      rows[0],
      suppliedOnly,
    ]);
  });

  it('applies single replacement and selected-row toggle semantics', () => {
    expect(controller['toggleRow'](new Set([0]), rows[1], 'single')).toEqual(new Set(['one']));
    expect(controller['toggleRow'](new Set([0]), rows[0], 'single')).toEqual(new Set());
    expect(controller['toggleRow'](new Set([0]), rows[0], 'single', false)).toEqual(new Set([0]));
  });

  it('handles none and every multiple toggle branch, including replacement', () => {
    expect(controller['toggleRow'](new Set([0]), rows[1], 'none')).toEqual(new Set([0]));
    expect(controller['toggleRow'](new Set([0]), rows[1], 'multiple')).toEqual(new Set([0, 'one']));
    expect(controller['toggleRow'](new Set([0, 'one']), rows[1], 'multiple')).toEqual(new Set([0]));
    expect(controller['toggleRow'](new Set([0, 'one']), rows[2], 'multiple', true, true)).toEqual(
      new Set([2]),
    );
  });

  it('derives scoped selectable rows and header state without mutable checkbox state', () => {
    const selectable = controller.scopedRows(
      'page',
      rows.slice(0, 2),
      rows,
      (row) => row.disabled !== true,
      rows,
    );

    expect(selectable).toEqual(rows.slice(0, 2));
    expect(controller.headerState(new Set([0]), selectable)).toEqual({
      checked: false,
      indeterminate: true,
      disabled: false,
    });
    expect(controller.headerState(new Set(), [])).toEqual({
      checked: false,
      indeterminate: false,
      disabled: true,
    });
  });

  it('deduplicates filtered scope, reports missing indexes and derives unchecked/checked headers', () => {
    const duplicateZero = { id: 0, label: 'Duplicate zero' };
    const missing = { id: 9, label: 'Missing' };
    const indexes: number[] = [];
    const scoped = controller.scopedRows(
      'filtered',
      rows.slice(0, 1),
      [rows[0], duplicateZero, rows[2], missing],
      (row, index) => {
        indexes.push(index);
        return row.disabled !== true;
      },
      rows,
    );

    expect(scoped).toEqual([rows[0], missing]);
    expect(indexes).toEqual([0, 2, -1]);
    expect(controller.headerState(new Set(), scoped)).toEqual({
      checked: false,
      indeterminate: false,
      disabled: false,
    });
    expect(controller.headerState(new Set([0, 9]), scoped)).toEqual({
      checked: true,
      indeterminate: false,
      disabled: false,
    });
  });

  it('page select-all modifies only scoped keys and preserves off-page keys', () => {
    const next = controller.toggleAll(new Set<number | string>([2]), rows.slice(0, 2));

    expect(next).toEqual(new Set([2, 0, 'one']));
    expect(controller.toggleAll(next, rows.slice(0, 2))).toEqual(new Set([2]));
  });

  it('looks up indexes and rows through current, supplied and missing-key paths', () => {
    const supplied = { id: 9, label: 'Supplied' };

    expect(controller.indexOf(rows[1], rows)).toBe(1);
    expect(controller.indexOf(supplied, rows)).toBe(-1);
    expect(controller.rowForKey(0, rows, [supplied])).toBe(rows[0]);
    expect(controller.rowForKey(9, rows, [supplied])).toBe(supplied);
    expect(controller.rowForKey(10, rows, [supplied])).toBeUndefined();
  });
});
