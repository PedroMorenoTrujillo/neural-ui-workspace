import { describe, expect, it } from 'vitest';
import { NeuTableGroupingController } from './neu-table-grouping.controller';

interface Row {
  id: number;
  team: string | null;
}

describe('NeuTableGroupingController', () => {
  const controller = new NeuTableGroupingController<Row>();
  const rows: Row[] = [
    { id: 1, team: 'B' },
    { id: 2, team: 'A' },
    { id: 3, team: 'B' },
  ];

  it('applies a stable group-first order and builds contiguous metadata', () => {
    const ordered = controller.order(rows, (row) => row.team, 1);
    expect(ordered.map((row) => row.id)).toEqual([2, 1, 3]);
    const groups = controller.groups(ordered, (row) => row.team, new Set(['B']));
    expect(groups).toMatchObject([
      { key: 'A', count: 1, expanded: false, firstRowIndex: 0, lastRowIndex: 0 },
      { key: 'B', count: 2, expanded: true, firstRowIndex: 1, lastRowIndex: 2 },
    ]);
    expect(groups[1].rows.map((row) => row.id)).toEqual([1, 3]);
  });

  it('resolves rowspan only for the first row and supports descending groups', () => {
    const ordered = controller.order(rows, (row) => row.team, -1);
    const groups = controller.groups(ordered, (row) => row.team, new Set());
    expect(ordered.map((row) => row.id)).toEqual([1, 3, 2]);
    expect(controller.rowspan('rowspan', groups, 0)).toEqual({ hidden: false, span: 2 });
    expect(controller.rowspan('rowspan', groups, 1)).toEqual({ hidden: true, span: 0 });
    expect(controller.rowspan('subheader', groups, 1)).toEqual({ hidden: false, span: 1 });
  });

  it('orders null, numeric and equal values and resolves missing rowspan groups', () => {
    const mixed = [
      { id: 1, team: null },
      { id: 2, team: '10' },
      { id: 3, team: '2' },
      { id: 4, team: '2' },
    ];
    expect(controller.order(mixed, (row) => row.team, 1).map((row) => row.id)).toEqual([
      1, 3, 4, 2,
    ]);
    expect(controller.order(mixed, (row) => row.id, -1).map((row) => row.id)).toEqual([4, 3, 2, 1]);
    const groups = controller.groups(mixed, (row) => row.team, new Set([null]));
    expect(groups[0]).toMatchObject({ label: '—', expanded: true });
    expect(controller.rowspan('rowspan', groups, 99)).toEqual({ hidden: false, span: 1 });
  });

  it('accumulates a large group without mutating the source and freezes the final rows', () => {
    const large = Array.from({ length: 10_000 }, (_, index) => ({ id: index, team: 'A' }));
    const groups = controller.groups(large, (row) => row.team, new Set(['A']));

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ count: 10_000, firstRowIndex: 0, lastRowIndex: 9_999 });
    expect(groups[0].rows[0]).toBe(large[0]);
    expect(groups[0].rows[9_999]).toBe(large[9_999]);
    expect(Object.isFrozen(groups[0].rows)).toBe(true);
    expect(Object.isFrozen(large)).toBe(false);
  });

  it('projects O(1) rowspan values for empty, single and multiple groups', () => {
    expect(controller.rowspanProjection('rowspan', [])).toEqual(new Int32Array());
    const single = controller.groups(
      [
        { id: 1, team: 'A' },
        { id: 2, team: 'A' },
        { id: 3, team: 'A' },
      ],
      (row) => row.team,
      new Set(),
    );
    expect([...controller.rowspanProjection('rowspan', single)]).toEqual([3, 0, 0]);

    const multiple = controller.groups(
      [
        { id: 1, team: 'A' },
        { id: 2, team: 'A' },
        { id: 3, team: 'B' },
        { id: 4, team: 'C' },
        { id: 5, team: 'C' },
      ],
      (row) => row.team,
      new Set(),
    );
    expect([...controller.rowspanProjection('rowspan', multiple)]).toEqual([2, 0, 1, 2, 0]);
    expect([...controller.rowspanProjection('subheader', multiple)]).toEqual([]);
  });
});
