import {
  areNeuTreeTableRangesEqual,
  neuTreeTableIndexForOffset,
  neuTreeTableOffsetForIndex,
  normalizeNeuTreeTableItemSize,
  normalizeNeuTreeTableOverscan,
  normalizeNeuTreeTableRange,
  projectNeuTreeTableVirtualWindow,
} from './internal/virtualization/neu-tree-table-virtualization';

describe('NeuTreeTable 2 fixed-height virtual math', () => {
  it('bounds the unmeasured bootstrap while keeping disabled projections complete', () => {
    expect(
      projectNeuTreeTableVirtualWindow({
        geometry: { measured: false, scrollTop: 9_999, viewportSize: 600 },
        total: 10_000,
        virtualization: { enabled: true, itemSize: 20, overscan: 2 },
      }),
    ).toEqual({
      itemSize: 20,
      measured: false,
      visible: { start: 0, end: 20 },
      render: { start: 0, end: 22 },
      before: 0,
      after: 199_560,
    });
    expect(
      projectNeuTreeTableVirtualWindow({
        geometry: { measured: true, scrollTop: 200, viewportSize: 100 },
        total: 50,
        virtualization: { enabled: false },
      }).render,
    ).toEqual({ start: 0, end: 50 });
  });

  it.each([0, 1, 10_000, 100_000])(
    'keeps SSR and client bootstrap bounded for %i rows',
    (total) => {
      const projected = projectNeuTreeTableVirtualWindow({
        geometry: { measured: false, scrollTop: 0, viewportSize: 0 },
        total,
        virtualization: { enabled: true, itemSize: 32, overscan: 4 },
      });
      expect(projected.measured).toBe(false);
      expect(projected.render).toEqual({ start: 0, end: Math.min(total, 16) });
      expect(projected.before + projected.render.end * 32 + projected.after).toBe(total * 32);
    },
  );

  it.each([
    {
      name: 'empty',
      total: 0,
      scrollTop: 0,
      viewportSize: 100,
      visible: { start: 0, end: 0 },
      render: { start: 0, end: 0 },
    },
    {
      name: 'one row',
      total: 1,
      scrollTop: 0,
      viewportSize: 100,
      visible: { start: 0, end: 1 },
      render: { start: 0, end: 1 },
    },
    {
      name: 'top',
      total: 100,
      scrollTop: 0,
      viewportSize: 100,
      visible: { start: 0, end: 5 },
      render: { start: 0, end: 7 },
    },
    {
      name: 'middle',
      total: 100,
      scrollTop: 800,
      viewportSize: 100,
      visible: { start: 40, end: 45 },
      render: { start: 38, end: 47 },
    },
    {
      name: 'end',
      total: 100,
      scrollTop: 1_980,
      viewportSize: 100,
      visible: { start: 99, end: 100 },
      render: { start: 97, end: 100 },
    },
  ])('projects half-open visible and overscanned render ranges at $name', (fixture) => {
    const projected = projectNeuTreeTableVirtualWindow({
      geometry: {
        measured: true,
        scrollTop: fixture.scrollTop,
        viewportSize: fixture.viewportSize,
      },
      total: fixture.total,
      virtualization: { enabled: true, itemSize: 20, overscan: 2 },
    });
    expect(projected.visible).toEqual(fixture.visible);
    expect(projected.render).toEqual(fixture.render);
    expect(projected.before).toBe(fixture.render.start * 20);
    expect(projected.after).toBe((fixture.total - fixture.render.end) * 20);
  });

  it('normalizes invalid geometry without mutating the applied options', () => {
    const applied = Object.freeze({ enabled: true as const, itemSize: Number.NaN, overscan: -1 });
    const projected = projectNeuTreeTableVirtualWindow({
      geometry: { measured: true, scrollTop: Number.NaN, viewportSize: 3 },
      total: 10,
      virtualization: applied,
    });
    expect(projected.itemSize).toBe(1);
    expect(projected.visible).toEqual({ start: 0, end: 3 });
    expect(projected.render).toEqual({ start: 0, end: 7 });
    expect(applied).toEqual({ enabled: true, itemSize: Number.NaN, overscan: -1 });
    expect(normalizeNeuTreeTableItemSize(0)).toBe(1);
    expect(normalizeNeuTreeTableOverscan(Number.POSITIVE_INFINITY)).toBe(4);
  });

  it('keeps range and index/offset helpers deterministic for huge loaded lengths', () => {
    const projected = projectNeuTreeTableVirtualWindow({
      geometry: { measured: true, scrollTop: 1_234_560, viewportSize: 640 },
      total: 100_000,
      virtualization: { enabled: true, itemSize: 32, overscan: 6 },
    });
    expect(projected.render.end - projected.render.start).toBeLessThanOrEqual(32);
    expect(neuTreeTableOffsetForIndex(38_580, 32)).toBe(1_234_560);
    expect(neuTreeTableIndexForOffset(1_234_579, 32)).toBe(38_580);
    expect(neuTreeTableOffsetForIndex(-1, 32)).toBeNull();
    expect(normalizeNeuTreeTableRange({ start: -4, end: Number.NaN })).toEqual({
      start: 0,
      end: 0,
    });
    expect(areNeuTreeTableRangesEqual(projected.visible, { ...projected.visible })).toBe(true);
  });
});
