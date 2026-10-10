import { describe, expect, it } from 'vitest';
import { duplicateVirtualListKeys, keyToken, projectVirtualWindow } from './neu-virtual-list.engine';

const project = (overrides: Partial<Parameters<typeof projectVirtualWindow>[0]> = {}) =>
  projectVirtualWindow({ scrollTop: 0, viewportHeight: 100, itemSize: 10, itemCount: 100,
    overscan: 2, ...overrides });

describe('NeuVirtualList pure fixed-height geometry', () => {
  it('projects half-open visible and overscanned render ranges', () => {
    expect(project()).toEqual({ itemSize: 10, visible: { start: 0, end: 10 },
      render: { start: 0, end: 12 }, topSpacer: 0, bottomSpacer: 880 });
  });
  it('handles partial intersection at each viewport edge', () => {
    expect(project({ scrollTop: 5, viewportHeight: 21 }).visible).toEqual({ start: 0, end: 3 });
    expect(project({ scrollTop: 15, viewportHeight: 20 }).visible).toEqual({ start: 1, end: 4 });
  });
  it('handles exact fit and a list shorter than the viewport', () => {
    expect(project({ itemCount: 10 }).visible).toEqual({ start: 0, end: 10 });
    expect(project({ itemCount: 3 }).render).toEqual({ start: 0, end: 3 });
  });
  it('is empty without phantom rows or spacers', () => {
    expect(project({ itemCount: 0 })).toEqual({ itemSize: 10,
      visible: { start: 0, end: 0 }, render: { start: 0, end: 0 },
      topSpacer: 0, bottomSpacer: 0 });
  });
  it('clamps large jumps, overscan and malformed geometry', () => {
    expect(project({ scrollTop: 99_999, overscan: 999 }).render).toEqual({ start: 70, end: 100 });
    expect(project({ itemSize: 0, itemCount: -5, scrollTop: NaN, viewportHeight: Infinity,
      overscan: -1 })).toEqual({ itemSize: 1, visible: { start: 0, end: 0 },
      render: { start: 0, end: 0 }, topSpacer: 0, bottomSpacer: 0 });
  });
  it('projects 1M logical items in constant geometry work', () => {
    const result = project({ itemCount: 1_000_000, scrollTop: 5_000_000 });
    expect(result.visible).toEqual({ start: 500_000, end: 500_010 });
    expect(result.render).toEqual({ start: 499_998, end: 500_012 });
    expect(result.topSpacer + (result.render.end - result.render.start) * 10 + result.bottomSpacer)
      .toBe(10_000_000);
  });
  it('keeps string/number and signed-zero semantic identities distinct', () => {
    expect(new Set([keyToken('1'), keyToken(1), keyToken(-0), keyToken(0)]).size).toBe(4);
  });
  it('detects duplicate K deterministically without mutating frozen items', () => {
    const items = Object.freeze([{ key: 'a' }, { key: 'b' }, { key: 'a' }]);
    expect([...duplicateVirtualListKeys(items, (item) => item.key)]).toEqual(['s:1:a']);
  });
});
