import {
  alignNeuTableRequestRange,
  areNeuTableRangesEqual,
  doesNeuTableRangeCover,
  effectiveNeuTableRequestStep,
  neuTableIndexForOffset,
  neuTableOffsetForIndex,
  normalizeNeuTableItemSize,
  normalizeNeuTableLogicalCount,
  normalizeNeuTableOverscan,
  normalizeNeuTableRange,
  projectNeuTableSpacerSizes,
  projectNeuTableVirtualWindow,
} from './internal/virtualization/neu-table-virtualization';

const virtual = (
  overrides: Partial<{ itemSize: number; overscan: number; requestStep: number }> = {},
) => ({
  enabled: true as const,
  itemSize: 20,
  overscan: 2,
  requestStep: 50,
  ...overrides,
});

describe('NeuTable fixed-height virtualization engine', () => {
  it('normalizes configuration, logical counts and half-open ranges without NaN/Infinity', () => {
    expect(normalizeNeuTableLogicalCount(null)).toBeNull();
    expect(normalizeNeuTableLogicalCount(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeNeuTableLogicalCount(-2.2)).toBe(0);
    expect(normalizeNeuTableLogicalCount(10.9)).toBe(10);
    expect(normalizeNeuTableItemSize(0)).toBe(1);
    expect(normalizeNeuTableItemSize(Number.NaN)).toBe(1);
    expect(normalizeNeuTableOverscan(-1)).toBe(4);
    expect(normalizeNeuTableOverscan(3.9)).toBe(3);
    expect(effectiveNeuTableRequestStep(undefined)).toBe(50);
    expect(effectiveNeuTableRequestStep(Number.NaN)).toBe(50);
    expect(effectiveNeuTableRequestStep(-10)).toBe(50);
    expect(effectiveNeuTableRequestStep(0.5)).toBe(1);
    expect(effectiveNeuTableRequestStep(19.9)).toBe(19);
    expect(normalizeNeuTableRange({ start: -4.7, end: Number.POSITIVE_INFINITY })).toEqual({
      start: 0,
      end: 0,
    });
    expect(normalizeNeuTableRange({ start: 8.9, end: 3.1 })).toEqual({ start: 8, end: 8 });
  });

  it('implements exhaustive half-open coverage boundaries', () => {
    expect(doesNeuTableRangeCover({ start: 0, end: 100 }, { start: 20, end: 40 })).toBe(true);
    expect(doesNeuTableRangeCover({ start: 0, end: 30 }, { start: 20, end: 40 })).toBe(false);
    expect(doesNeuTableRangeCover({ start: 20, end: 40 }, { start: 20, end: 40 })).toBe(true);
    expect(doesNeuTableRangeCover({ start: 20, end: 40 }, { start: 40, end: 40 })).toBe(true);
    expect(doesNeuTableRangeCover({ start: 20, end: 40 }, { start: 19, end: 20 })).toBe(false);
    expect(doesNeuTableRangeCover({ start: 20, end: 40 }, { start: 39, end: 40 })).toBe(true);
    expect(doesNeuTableRangeCover({ start: 20, end: 40 }, { start: 40, end: 41 })).toBe(false);
    expect(doesNeuTableRangeCover(undefined, { start: 0, end: 0 })).toBe(true);
    expect(doesNeuTableRangeCover(undefined, { start: 0, end: 1 })).toBe(false);
    expect(doesNeuTableRangeCover(undefined, null)).toBe(true);
  });

  it('aligns request ranges by floor/ceil step and clamps only against known totals', () => {
    expect(alignNeuTableRequestRange({ start: 37, end: 58 }, 50, null)).toEqual({
      start: 0,
      end: 100,
    });
    expect(alignNeuTableRequestRange({ start: 100, end: 150 }, 50, 123)).toEqual({
      start: 100,
      end: 123,
    });
    expect(alignNeuTableRequestRange({ start: 200, end: 250 }, 50, 123)).toEqual({
      start: 123,
      end: 123,
    });
    expect(alignNeuTableRequestRange({ start: -9, end: 1.2 }, Number.NaN, 1_000_000)).toEqual({
      start: 0,
      end: 50,
    });
  });

  it('uses a deterministic SSR bootstrap without claiming a visible range', () => {
    expect(
      projectNeuTableVirtualWindow({
        geometry: { measured: false, scrollTop: 999, viewportSize: 999 },
        total: 10,
        virtualization: virtual(),
      }),
    ).toEqual({
      itemSize: 20,
      measured: false,
      visible: { start: 0, end: 0 },
      render: { start: 0, end: 10 },
      request: { start: 0, end: 10 },
      step: 50,
    });
    expect(
      projectNeuTableVirtualWindow({
        geometry: { measured: false, scrollTop: 0, viewportSize: 0 },
        total: null,
        virtualization: virtual({ requestStep: Number.NaN }),
      }).render,
    ).toEqual({ start: 0, end: 50 });
  });

  it.each([
    {
      name: 'zero rows',
      total: 0,
      scrollTop: 0,
      viewportSize: 100,
      visible: [0, 0],
      render: [0, 0],
    },
    { name: 'one row', total: 1, scrollTop: 0, viewportSize: 100, visible: [0, 1], render: [0, 1] },
    {
      name: 'viewport smaller than row',
      total: 100,
      scrollTop: 0,
      viewportSize: 9,
      visible: [0, 1],
      render: [0, 3],
    },
    {
      name: 'exact multiple',
      total: 100,
      scrollTop: 40,
      viewportSize: 40,
      visible: [2, 4],
      render: [0, 6],
    },
    {
      name: 'partial row',
      total: 100,
      scrollTop: 41,
      viewportSize: 40,
      visible: [2, 5],
      render: [0, 7],
    },
    {
      name: 'negative overscroll',
      total: 100,
      scrollTop: -100,
      viewportSize: 40,
      visible: [0, 2],
      render: [0, 4],
    },
    {
      name: 'beyond end',
      total: 10,
      scrollTop: 2_000,
      viewportSize: 40,
      visible: [10, 10],
      render: [8, 10],
    },
    {
      name: 'fractional pixels',
      total: 100,
      scrollTop: 20.5,
      viewportSize: 20.25,
      visible: [1, 3],
      render: [0, 5],
    },
  ])(
    'projects visible/render ranges for $name',
    ({ total, scrollTop, viewportSize, visible, render }) => {
      const projection = projectNeuTableVirtualWindow({
        geometry: { measured: true, scrollTop, viewportSize },
        total,
        virtualization: virtual(),
      });
      expect(projection.visible).toEqual({ start: visible[0], end: visible[1] });
      expect(projection.render).toEqual({ start: render[0], end: render[1] });
      expect(Number.isFinite(projection.request.start)).toBe(true);
      expect(Number.isFinite(projection.request.end)).toBe(true);
    },
  );

  it('keeps spacer and offset/index math O(1) for very large logical totals', () => {
    expect(
      projectNeuTableSpacerSizes({
        itemSize: 20,
        mounted: { start: 499_998, end: 500_023 },
        total: 1_000_000,
      }),
    ).toEqual({
      before: 9_999_960,
      after: 9_999_540,
    });
    expect(neuTableOffsetForIndex(999_999, 20)).toBe(19_999_980);
    expect(neuTableOffsetForIndex(-1, 20)).toBeNull();
    expect(neuTableOffsetForIndex(1.5, 20)).toBeNull();
    expect(neuTableIndexForOffset(41.8, 20)).toBe(2);
    expect(neuTableIndexForOffset(-1, 20)).toBe(0);
    expect(neuTableIndexForOffset(Number.POSITIVE_INFINITY, 20)).toBe(0);
    expect(areNeuTableRangesEqual({ start: 1, end: 2 }, { start: 1, end: 2 })).toBe(true);
  });
});
