import { describe, expect, it } from 'vitest';
import { NeuTableReorderController } from './neu-table-reorder.controller';

interface Row {
  readonly id: number;
  readonly visible: boolean;
}

describe('NeuTableReorderController', () => {
  const controller = new NeuTableReorderController<Row>();
  const source: readonly Row[] = Object.freeze([
    { id: 1, visible: true },
    { id: 2, visible: false },
    { id: 3, visible: true },
    { id: 4, visible: true },
  ]);
  const keyOf = (row: Row) => row.id;

  it('creates an immutable filtered/page proposal without mutating consumer rows', () => {
    const visible = source.filter((row) => row.visible);
    const result = controller.reorder(
      source,
      visible,
      4,
      1,
      'before',
      keyOf,
      'page',
    );

    expect(result).toEqual(
      expect.objectContaining({
        key: 4,
        previousIndex: 2,
        currentIndex: 0,
        previousDataIndex: 3,
        currentDataIndex: 0,
        scope: 'page',
      }),
    );
    expect(result!.visibleRows.map(keyOf)).toEqual([4, 1, 3]);
    expect(result!.rows.map(keyOf)).toEqual([4, 2, 1, 3]);
    expect(source.map(keyOf)).toEqual([1, 2, 3, 4]);
    expect(Object.isFrozen(result!.rows)).toBe(true);
    expect(Object.isFrozen(result!.visibleRows)).toBe(true);
  });

  it('rejects missing, identical and no-op destinations', () => {
    expect(controller.reorder(source, source, 1, 99, 'before', keyOf, 'loaded')).toBeNull();
    expect(controller.reorder(source, source, 1, 1, 'after', keyOf, 'loaded')).toBeNull();
    expect(controller.reorder(source, source, 1, 2, 'before', keyOf, 'loaded')).toBeNull();
  });
});
