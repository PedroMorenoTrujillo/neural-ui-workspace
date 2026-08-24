import { describe, expect, it } from 'vitest';
import { NeuTableLazyDataController } from './neu-table-lazy-data.controller';
import type { NeuTableQueryState } from './neu-table.types';

const QUERY: NeuTableQueryState = Object.freeze({
  page: 1,
  pageSize: 10,
  search: '',
  sort: null,
  sortEntries: Object.freeze([]),
  globalFilterFields: Object.freeze([]),
  filters: Object.freeze({}),
  serialization: Object.freeze({
    status: 'serializable',
    localOnlyFilters: Object.freeze([]),
    requiresConsumerSerializationFilters: Object.freeze([]),
    localOnlyGlobalFilterFields: false,
  }),
});

describe('NeuTableLazyDataController', () => {
  it('computes half-open visible and overscan ranges at the top, middle and bottom', () => {
    const controller = new NeuTableLazyDataController<object>();
    const config = { itemSize: 40, visibleItems: 5, totalItems: 100, overscan: 3 };

    expect(controller.range({ ...config, scrollTop: 0 })).toEqual({
      first: 0,
      end: 8,
      visibleFirst: 0,
      visibleEnd: 5,
    });
    expect(controller.range({ ...config, scrollTop: 20 * 40 })).toEqual({
      first: 17,
      end: 28,
      visibleFirst: 20,
      visibleEnd: 25,
    });
    expect(controller.range({ ...config, scrollTop: Number.MAX_VALUE })).toEqual({
      first: 92,
      end: 100,
      visibleFirst: 95,
      visibleEnd: 100,
    });
  });

  it('normalizes small, zero, huge and invalid range inputs without NaN', () => {
    const controller = new NeuTableLazyDataController<object>();

    expect(
      controller.range({
        scrollTop: Number.NaN,
        itemSize: Number.NaN,
        visibleItems: 8.8,
        totalItems: 0,
        overscan: -3,
      }),
    ).toEqual({ first: 0, end: 0, visibleFirst: 0, visibleEnd: 0 });
    expect(
      controller.range({
        scrollTop: 9_999_999,
        itemSize: 33.5,
        visibleItems: 8,
        totalItems: 100_000,
        overscan: 3,
      }),
    ).toEqual({ first: 99_989, end: 100_000, visibleFirst: 99_992, visibleEnd: 100_000 });
    expect(controller.itemSize(-4, 48)).toBe(48);
    expect(controller.itemSize(Number.POSITIVE_INFINITY, Number.NaN)).toBe(1);
    expect(controller.total(4.9)).toBe(4);
    expect(controller.total(-1)).toBe(0);
  });

  it('covers zeroed range fallbacks and valid explicit item sizes', () => {
    const controller = new NeuTableLazyDataController<object>();

    expect(
      controller.range({
        scrollTop: -100,
        itemSize: 24,
        visibleItems: 0,
        totalItems: 3,
        overscan: Number.NaN,
      }),
    ).toEqual({ first: 0, end: 1, visibleFirst: 0, visibleEnd: 1 });
    expect(controller.itemSize(24, 48)).toBe(24);
    expect(controller.total(undefined)).toBe(0);
  });

  it('maps one bounded supplied window to loaded rows and truthful placeholders', () => {
    const controller = new NeuTableLazyDataController<{ id: number }>();
    const rows = [{ id: 10 }, { id: 11 }, { id: 12 }];
    const slots = controller.slots(
      { first: 8, end: 14, visibleFirst: 9, visibleEnd: 13 },
      10,
      rows,
    );

    expect(slots).toEqual([
      { kind: 'placeholder', logicalIndex: 8 },
      { kind: 'placeholder', logicalIndex: 9 },
      { kind: 'loaded', logicalIndex: 10, row: rows[0] },
      { kind: 'loaded', logicalIndex: 11, row: rows[1] },
      { kind: 'loaded', logicalIndex: 12, row: rows[2] },
      { kind: 'placeholder', logicalIndex: 13 },
    ]);
    expect(slots).toHaveLength(6);
    expect((slots[2] as { row: object }).row).toBe(rows[0]);
    expect(Object.isFrozen(slots)).toBe(true);
  });

  it('keeps 100k logical records O(rendered range), not O(total records)', () => {
    const controller = new NeuTableLazyDataController<{ id: number }>();
    const range = controller.range({
      scrollTop: 50_000 * 48,
      itemSize: 48,
      visibleItems: 8,
      totalItems: 100_000,
      overscan: 3,
    });
    const slots = controller.slots(range, 50_000, [{ id: 50_000 }]);

    expect(slots.length).toBeLessThanOrEqual(14);
    expect(slots.filter((slot) => slot.kind === 'loaded')).toHaveLength(1);
  });

  it('normalizes malformed supplied-window bounds without indexing outside the window', () => {
    const controller = new NeuTableLazyDataController<{ id: number }>();

    expect(
      controller.slots(
        { first: Number.NaN, end: Number.NaN, visibleFirst: 0, visibleEnd: 0 },
        Number.NaN,
        [{ id: 0 }],
      ),
    ).toEqual([]);
  });

  it('emits once per semantic range and assigns monotonic request identity', () => {
    const controller = new NeuTableLazyDataController<object>();
    const first = controller.range({
      scrollTop: 0,
      itemSize: 40,
      visibleItems: 5,
      totalItems: 100,
      overscan: 3,
    });
    const next = controller.range({
      scrollTop: 40,
      itemSize: 40,
      visibleItems: 5,
      totalItems: 100,
      overscan: 3,
    });

    expect(controller.request(QUERY, first, 'initial')).toMatchObject({ requestId: 1 });
    expect(controller.request(QUERY, { ...first }, 'scroll')).toBeNull();
    expect(controller.request(QUERY, next, 'scroll')).toMatchObject({ requestId: 2 });
    expect(controller.request(QUERY, next, 'query', true)).toMatchObject({ requestId: 3 });
    controller.forgetRange();
    expect(controller.request(QUERY, next, 'scroll')).toMatchObject({ requestId: 4 });
  });

  it('compares every half-open range coordinate and nullable values semantically', () => {
    const controller = new NeuTableLazyDataController<object>();
    const range = { first: 1, end: 8, visibleFirst: 3, visibleEnd: 6 };

    expect(controller.equalRange(null, undefined)).toBe(false);
    expect(controller.equalRange(range, range)).toBe(true);
    expect(controller.equalRange(range, { ...range, first: 0 })).toBe(false);
    expect(controller.equalRange(range, { ...range, end: 9 })).toBe(false);
    expect(controller.equalRange(range, { ...range, visibleFirst: 2 })).toBe(false);
    expect(controller.equalRange(range, { ...range, visibleEnd: 7 })).toBe(false);
  });
});
