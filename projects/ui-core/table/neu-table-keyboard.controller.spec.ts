import { describe, expect, it } from 'vitest';
import { NeuTableKeyboardController } from './neu-table-keyboard.controller';

describe('NeuTableKeyboardController', () => {
  it('enters on the first selected navigable key and keeps one logical focus key', () => {
    const controller = new NeuTableKeyboardController<number>();

    controller.reconcile([1, 2, 3], new Set([2]));
    expect(controller.focusedKey()).toBe(2);

    controller.focus(3, [1, 2, 3]);
    controller.reconcile([3, 2, 1], new Set([2]));
    expect(controller.focusedKey()).toBe(3);
    expect(controller.focus(4, [1, 2, 3])).toBe(false);
  });

  it('normalizes focus and anchor when the rendered scope changes', () => {
    const controller = new NeuTableKeyboardController<number>();
    controller.reconcile([1, 2, 3], new Set());
    controller.focus(2, [1, 2, 3]);
    controller.establishAnchor(2);

    controller.reconcile([3, 4], new Set([4]));
    expect(controller.focusedKey()).toBe(4);
    expect(controller.rangeAnchorKey()).toBeNull();
    expect(controller.rangeExtentKey()).toBeNull();

    controller.reconcile([], new Set());
    expect(controller.focusedKey()).toBeNull();
  });

  it('calculates bounded previous, next, first and last navigation', () => {
    const controller = new NeuTableKeyboardController<number>();
    const keys = [1, 3, 5];

    expect(controller.move(keys, 1, 'previous')).toBe(1);
    expect(controller.move(keys, 1, 'next')).toBe(3);
    expect(controller.move(keys, 3, 'last')).toBe(5);
    expect(controller.move(keys, 5, 'next')).toBe(5);
    expect(controller.move(keys, 5, 'first')).toBe(1);
    expect(controller.move(keys, 99, 'next')).toBe(1);
    expect(controller.move([], 1, 'next')).toBeNull();
  });

  it('builds inclusive ranges in current navigable order without owning selection', () => {
    const controller = new NeuTableKeyboardController<number>();
    const keys = [4, 2, 8, 6];

    expect(controller.range(keys, 8, 2)).toEqual([2, 8]);
    controller.establishAnchor(8);
    expect(controller.range(keys, 4, 8)).toEqual([4, 2, 8]);
    expect(controller.range(keys, 99, 8)).toEqual([]);

    controller.resetAnchor();
    expect(controller.rangeAnchorKey()).toBeNull();
    expect(controller.rangeExtentKey()).toBeNull();
    expect(controller.ensureAnchor(6)).toBe(6);
  });

  it('describes forward, contraction and reversal transitions without storing selection', () => {
    const controller = new NeuTableKeyboardController<number>();
    const keys = [1, 2, 3, 4, 5];
    controller.establishAnchor(3);

    expect(controller.transitionRange(keys, 5, 3)).toEqual({
      previous: [3],
      current: [3, 4, 5],
    });
    expect(controller.transitionRange(keys, 4, 3)).toEqual({
      previous: [3, 4, 5],
      current: [3, 4],
    });
    expect(controller.transitionRange(keys, 2, 3)).toEqual({
      previous: [3, 4],
      current: [2, 3],
    });
    expect(controller.rangeExtentKey()).toBe(2);
  });
});
