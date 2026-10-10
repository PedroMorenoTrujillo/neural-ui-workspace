import { describe, expect, it } from 'vitest';
import {
  clampScroll, logicalScrollLeftToRaw, rawScrollLeftToLogical, type RtlScrollMode,
} from './scroll-left';

describe('logical horizontal scroll coordinate', () => {
  it('preserves LTR numeric behavior and clamps overscroll', () => {
    expect(rawScrollLeftToLogical(35, 100, false, 'negative')).toBe(35);
    expect(logicalScrollLeftToRaw(35, 100, false, 'negative')).toBe(35);
    expect(clampScroll(-8, 100)).toBe(0);
    expect(clampScroll(108, 100)).toBe(100);
  });

  it.each<readonly [RtlScrollMode, number, number]>([
    ['negative', 0, -100],
    ['reverse', 0, 100],
    ['default', 100, 0],
  ])('maps RTL %s raw start/end to logical 0/max', (mode, rawStart, rawEnd) => {
    expect(rawScrollLeftToLogical(rawStart, 100, true, mode)).toBe(0);
    expect(rawScrollLeftToLogical(rawEnd, 100, true, mode)).toBe(100);
    expect(logicalScrollLeftToRaw(0, 100, true, mode)).toBe(rawStart);
    expect(logicalScrollLeftToRaw(100, 100, true, mode)).toBe(rawEnd);
  });

  it.each<RtlScrollMode>(['negative', 'reverse', 'default'])(
    'round-trips intermediate positions in RTL %s', (mode) => {
      const raw = logicalScrollLeftToRaw(37, 100, true, mode);
      expect(rawScrollLeftToLogical(raw, 100, true, mode)).toBe(37);
    },
  );
});
