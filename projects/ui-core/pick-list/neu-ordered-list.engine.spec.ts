import { describe, expect, it } from 'vitest';
import {
  findOrderedDuplicate,
  moveSelectedVisible,
  pruneSelectedKeys,
  reorderVisible,
  transferSelected,
  visibleAnchorIndex,
} from './neu-ordered-list.engine';

interface Row {
  readonly id: string;
  readonly disabled?: boolean;
}

const keyOf = (row: Row) => row.id;
const disabled = (row: Row) => !!row.disabled;
const rows: readonly Row[] = Object.freeze([
  Object.freeze({ id: 'A' }),
  Object.freeze({ id: 'B' }),
  Object.freeze({ id: 'C' }),
  Object.freeze({ id: 'D' }),
]);
const ids = (items: readonly Row[]) => items.map((item) => item.id);

describe('private ordered-list engine', () => {
  it('permutes only visible slots and never mutates applied data', () => {
    const next = reorderVisible(rows, [rows[1]!, rows[3]!], 'D', 0, keyOf, disabled);
    expect(ids(next!)).toEqual(['A', 'D', 'C', 'B']);
    expect(ids(rows)).toEqual(['A', 'B', 'C', 'D']);
    expect(next).not.toBe(rows);
  });

  it('uses the same algorithm for unfiltered reorder and rejects no-ops', () => {
    expect(ids(reorderVisible(rows, rows, 'D', 0, keyOf, disabled)!)).toEqual([
      'D', 'A', 'B', 'C',
    ]);
    expect(reorderVisible(rows, rows, 'B', 1, keyOf, disabled)).toBeNull();
    expect(reorderVisible(rows, rows, 'B', -1, keyOf, disabled)).toBeNull();
    expect(reorderVisible(rows, rows, 'B', 1.5, keyOf, disabled)).toBeNull();
  });

  it('keeps hidden positions for top/bottom and skips single-visible no-ops', () => {
    expect(ids(moveSelectedVisible(rows, [rows[1]!, rows[3]!], ['D'], 'top', keyOf, disabled)!))
      .toEqual(['A', 'D', 'C', 'B']);
    expect(moveSelectedVisible(rows, [rows[3]!], ['D'], 'top', keyOf, disabled)).toBeNull();
  });

  it('treats disabled visible items as movement barriers', () => {
    const applied: Row[] = [{ id: 'A' }, { id: 'locked', disabled: true }, { id: 'B' }];
    expect(reorderVisible(applied, applied, 'B', 0, keyOf, disabled)).toBeNull();
    expect(moveSelectedVisible(applied, applied, ['B'], 'top', keyOf, disabled)).toBeNull();
    expect(reorderVisible(applied, applied, 'locked', 0, keyOf, disabled)).toBeNull();
  });

  it('inserts before a visible anchor, after the last, or at full-array end', () => {
    const visible = [rows[1]!, rows[3]!];
    expect(visibleAnchorIndex(rows, visible, 0, keyOf)).toBe(1);
    expect(visibleAnchorIndex(rows, visible, 1, keyOf)).toBe(3);
    expect(visibleAnchorIndex(rows, visible, 2, keyOf)).toBe(4);
    expect(visibleAnchorIndex(rows, [], 0, keyOf)).toBe(4);
    expect(visibleAnchorIndex(rows, visible, -1, keyOf)).toBeNull();
  });

  it('transfers selected movable items in applied source order, not selection order', () => {
    const proposal = transferSelected(rows, [{ id: 'X' }], ['D', 'B'], keyOf, disabled);
    expect(ids(proposal!.source)).toEqual(['A', 'C']);
    expect(ids(proposal!.target)).toEqual(['X', 'B', 'D']);
    expect(ids(rows)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('does not transfer disabled items', () => {
    const source: Row[] = [{ id: 'A', disabled: true }, { id: 'B' }];
    expect(transferSelected(source, [], ['A'], keyOf, disabled)).toBeNull();
    expect(ids(transferSelected(source, [], ['A', 'B'], keyOf, disabled)!.target)).toEqual(['B']);
  });

  it('detects duplicates within and across lists with deterministic positions', () => {
    expect(findOrderedDuplicate([['items', rows]], keyOf)).toBeNull();
    expect(findOrderedDuplicate([['items', [rows[0]!, { id: 'A' }]]], keyOf)).toEqual({
      key: 'A', firstList: 'items', firstIndex: 0, list: 'items', index: 1,
    });
    expect(findOrderedDuplicate([['source', rows], ['target', [{ id: 'C' }]]], keyOf)).toEqual({
      key: 'C', firstList: 'source', firstIndex: 2, list: 'target', index: 0,
    });
    expect(findOrderedDuplicate([['items', [0, -0]]], (value) => value)).toBeNull();
  });

  it('prunes only keys absent from newly applied data', () => {
    expect([...pruneSelectedKeys(new Set(['A', 'B']), [rows[1]!], keyOf)!]).toEqual(['B']);
    expect(pruneSelectedKeys(new Set(['B']), [{ id: 'B' }], keyOf)).toBeNull();
  });
});
