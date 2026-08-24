import { describe, expect, it, vi } from 'vitest';
import { NeuTableSortController } from './neu-table-sort.controller';
import type { NeuTableColumn } from './neu-table.types';

interface Row {
  id: number;
  name: string;
  score: number;
  primary: number;
  secondary: number;
}

describe('NeuTableSortController', () => {
  const controller = new NeuTableSortController<Row>();

  it('preserves the two-state default and provides an opt-in removable cycle', () => {
    let state = controller.next([], 'name', {
      multiple: false,
      additive: false,
      removable: true,
    });
    expect(state).toEqual([{ key: 'name', dir: 'asc' }]);
    state = controller.next(state, 'name', { multiple: false, additive: false, removable: true });
    expect(state).toEqual([{ key: 'name', dir: 'desc' }]);
    state = controller.next(state, 'name', { multiple: false, additive: false, removable: true });
    expect(state).toEqual([]);
    state = controller.next(state, 'name', { multiple: false, additive: false, removable: true });
    expect(state).toEqual([{ key: 'name', dir: 'asc' }]);

    expect(
      controller.next([{ key: 'name', dir: 'desc' }], 'name', {
        multiple: false,
        additive: false,
        removable: false,
      }),
    ).toEqual([{ key: 'name', dir: 'asc' }]);
  });

  it('adds, changes and removes ordered multisort entries without mutating the input', () => {
    const source = Object.freeze([{ key: 'name', dir: 'desc' as const }]);
    const removed = controller.next(source, 'name', {
      multiple: true,
      additive: true,
      removable: true,
    });
    const added = controller.next(source, 'score', {
      multiple: true,
      additive: true,
      removable: true,
    });

    expect(removed).toEqual([]);
    expect(added).toEqual([
      { key: 'name', dir: 'desc' },
      { key: 'score', dir: 'asc' },
    ]);
    expect(source).toEqual([{ key: 'name', dir: 'desc' }]);
  });

  it('replaces a non-additive multisort entry across both legacy directions and removal', () => {
    expect(
      controller.next([{ key: 'name', dir: 'asc' }], 'name', {
        multiple: true,
        additive: false,
        removable: false,
      }),
    ).toEqual([{ key: 'name', dir: 'desc' }]);
    expect(
      controller.next([{ key: 'name', dir: 'desc' }], 'name', {
        multiple: true,
        additive: false,
        removable: false,
      }),
    ).toEqual([{ key: 'name', dir: 'asc' }]);
    expect(
      controller.next([{ key: 'name', dir: 'desc' }], 'name', {
        multiple: true,
        additive: false,
        removable: true,
      }),
    ).toEqual([]);
  });

  it('uses numeric/accessor values and a typed row comparator without display coercion', () => {
    const rows: Row[] = [
      { id: 1, name: 'beta', score: 10, primary: 9, secondary: 1 },
      { id: 2, name: 'Alpha', score: 2, primary: 1, secondary: 8 },
    ];
    const comparator = vi.fn((a: Row, b: Row) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );
    const columns: NeuTableColumn<Row>[] = [
      { key: 'score', header: 'Score', sortable: true },
      {
        key: 'primary',
        header: 'Computed',
        sortable: true,
        sortAccessor: (row) => row.primary + row.secondary,
      },
      { key: 'name', header: 'Name', sortable: true, sortComparator: comparator },
    ];

    expect(
      controller.sort(rows, [{ key: 'score', dir: 'asc' }], columns).map((row) => row.id),
    ).toEqual([2, 1]);
    expect(
      controller.sort(rows, [{ key: 'primary', dir: 'asc' }], columns).map((row) => row.id),
    ).toEqual([2, 1]);
    expect(
      controller.sort(rows, [{ key: 'name', dir: 'asc' }], columns).map((row) => row.id),
    ).toEqual([2, 1]);
    expect(comparator).toHaveBeenCalledWith(rows[1], rows[0]);
  });

  it('applies descending direction once, runs only the active accessor and preserves row identity', () => {
    const rows: Row[] = [
      { id: 1, name: 'same', score: 10, primary: 2, secondary: 0 },
      { id: 2, name: 'same', score: 20, primary: 1, secondary: 0 },
      { id: 3, name: 'same', score: 20, primary: 1, secondary: 0 },
    ];
    const activeAccessor = vi.fn((row: Row) => row.primary);
    const inactiveAccessor = vi.fn((row: Row) => row.secondary);
    const comparator = vi.fn((a: Row, b: Row) => a.score - b.score);
    const columns: NeuTableColumn<Row>[] = [
      { key: 'score', header: 'Score', sortComparator: comparator },
      { key: 'primary', header: 'Primary', sortAccessor: activeAccessor },
      { key: 'secondary', header: 'Secondary', sortAccessor: inactiveAccessor },
    ];

    const compared = controller.sort(rows, [{ key: 'score', dir: 'desc' }], columns);
    expect(compared).toEqual([rows[1], rows[2], rows[0]]);
    expect(compared[0]).toBe(rows[1]);
    expect(rows.map((row) => row.id)).toEqual([1, 2, 3]);

    const accessed = controller.sort(rows, [{ key: 'primary', dir: 'desc' }], columns);
    expect(accessed).toEqual([rows[0], rows[1], rows[2]]);
    expect(activeAccessor).toHaveBeenCalled();
    expect(inactiveAccessor).not.toHaveBeenCalled();
  });

  it('compares nulls, NaN, bigint, dates, booleans, strings and mixed fallback values', () => {
    interface ValueRow {
      id: number;
      value: unknown;
      secondary?: number;
    }
    const valueController = new NeuTableSortController<ValueRow>();
    const column: NeuTableColumn<ValueRow> = { key: 'value', header: 'Value' };
    const ids = (values: unknown[], dir: 'asc' | 'desc' = 'asc') =>
      valueController
        .sort(
          values.map((value, index) => ({ id: index, value })),
          [{ key: 'value', dir }],
          [column],
        )
        .map((row) => row.id);

    expect(valueController.sort([{ id: 1, value: 1 }], [], [column])).toEqual([
      { id: 1, value: 1 },
    ]);
    expect(ids([null, 1])).toEqual([0, 1]);
    expect(ids([1, null])).toEqual([1, 0]);
    expect(ids([undefined, null, 1])).toEqual([1, 0, 2]);
    expect(ids([undefined, null, 1], 'desc')).toEqual([2, 0, 1]);
    expect(ids([Number.NaN, 1])).toEqual([0, 1]);
    expect(ids([1, Number.NaN])).toEqual([1, 0]);
    expect(ids([Number.NaN, Number.NaN])).toEqual([0, 1]);
    expect(ids([0, -0, 1])).toEqual([0, 1, 2]);
    expect(ids([2n, 1n])).toEqual([1, 0]);
    expect(ids([new Date(2), new Date(1)])).toEqual([1, 0]);
    expect(ids([new Date(Number.NaN), new Date(1)])).toEqual([0, 1]);
    expect(ids([new Date(1), new Date(Number.NaN)])).toEqual([1, 0]);
    expect(ids([new Date(Number.NaN), new Date(Number.NaN)])).toEqual([0, 1]);
    expect(ids([new Date(1), new Date(1), new Date(2)])).toEqual([0, 1, 2]);
    expect(ids([true, false])).toEqual([1, 0]);
    expect(ids(['10', '2'])).toEqual([1, 0]);
    expect(ids(['2', 10])).toEqual([0, 1]);
    expect(
      valueController
        .sort(
          [
            { id: 1, value: 'same', secondary: 2 },
            { id: 2, value: 'same', secondary: 1 },
          ],
          [
            { key: 'value', dir: 'asc' },
            { key: 'secondary', dir: 'asc' },
          ],
          [column],
        )
        .map((row) => row.id),
    ).toEqual([2, 1]);

    const tied = [
      { id: 1, value: 'same' },
      { id: 2, value: 'same' },
      { id: 3, value: 'same' },
    ];
    expect(
      valueController.sort(tied, [{ key: 'value', dir: 'asc' }], [column]).map((row) => row.id),
    ).toEqual([1, 2, 3]);
  });
});
