import { describe, expect, it } from 'vitest';
import {
  type InternalNeuTableColumnMetric,
  NeuTableLayoutController,
} from './neu-table-layout.controller';

const columns = (): readonly InternalNeuTableColumnMetric[] => [
  { key: 'frozen', width: 80, minWidth: 60, maxWidth: 120, frozen: 'left' },
  { key: 'name', width: 160, minWidth: 100, maxWidth: 240, frozen: null },
  { key: 'team', width: 140, minWidth: 90, maxWidth: 180, frozen: null },
  { key: 'status', width: 120, minWidth: 80, maxWidth: 200, frozen: null },
  { key: 'actions', width: 100, minWidth: 80, maxWidth: 140, frozen: 'right' },
];

describe('NeuTableLayoutController', () => {
  const controller = new NeuTableLayoutController();

  it('resizes fit columns against the next visible leaf without width drift', () => {
    const before = columns();
    const result = controller.resize(before, 'name', 37.4, 'fit');

    expect(result).toEqual({
      key: 'name',
      width: 197,
      delta: 37,
      adjacentKey: 'team',
      adjacentWidth: 103,
      widths: { name: 197, team: 103 },
    });
    expect(result!.width + result!.adjacentWidth!).toBe(300);
    expect(before[1].width).toBe(160);
  });

  it('clamps fit deltas to both leaf constraints and rejects the last leaf', () => {
    expect(controller.resize(columns(), 'name', 500, 'fit')).toEqual(
      expect.objectContaining({ width: 210, adjacentWidth: 90, delta: 50 }),
    );
    expect(controller.resize(columns(), 'actions', 10, 'fit')).toBeNull();
    expect(controller.resize(columns(), 'missing', 10, 'fit')).toBeNull();
    expect(controller.resize(columns(), 'name', Number.NaN, 'fit')).toBeNull();
  });

  it('resizes expand columns independently and obeys min/max constraints', () => {
    expect(controller.resize(columns(), 'status', -500, 'expand')).toEqual({
      key: 'status',
      width: 80,
      delta: -40,
      widths: { status: 80 },
    });
    expect(controller.resize(columns(), 'status', 0, 'expand')).toBeNull();
  });

  it('reorders by stable key only inside the same frozen zone', () => {
    expect(controller.reorder(columns(), 'status', 'name', 'before')).toEqual({
      key: 'status',
      previousIndex: 3,
      currentIndex: 1,
      order: ['frozen', 'status', 'name', 'team', 'actions'],
    });
    expect(controller.reorder(columns(), 'name', 'frozen', 'after')).toBeNull();
    expect(controller.reorder(columns(), 'name', 'team', 'before')).toBeNull();
  });
});
