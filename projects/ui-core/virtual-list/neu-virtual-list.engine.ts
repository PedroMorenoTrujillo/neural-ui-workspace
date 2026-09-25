import type { NeuVirtualListKey, NeuVirtualListRange } from './neu-virtual-list.types';

export interface NeuVirtualWindow {
  readonly itemSize: number;
  readonly visible: NeuVirtualListRange;
  readonly render: NeuVirtualListRange;
  readonly topSpacer: number;
  readonly bottomSpacer: number;
}

export function keyToken(key: NeuVirtualListKey): string {
  if (typeof key === 'string') return `s:${key.length}:${key}`;
  if (Object.is(key, -0)) return 'n:-0';
  return `n:${String(key)}`;
}

export function duplicateVirtualListKeys<T, K extends NeuVirtualListKey>(
  items: readonly T[],
  itemKey: (item: T) => K,
): ReadonlySet<string> {
  const seen = new Set<string>();
  const duplicate = new Set<string>();
  for (const item of items) {
    const token = keyToken(itemKey(item));
    if (seen.has(token)) duplicate.add(token);
    else seen.add(token);
  }
  return duplicate;
}

export function projectVirtualWindow(options: {
  readonly scrollTop: number;
  readonly viewportHeight: number;
  readonly itemSize: number;
  readonly itemCount: number;
  readonly overscan: number;
}): NeuVirtualWindow {
  const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;
  const count = Math.max(0, Math.floor(finite(options.itemCount, 0)));
  const size = options.itemSize > 0 && Number.isFinite(options.itemSize) ? options.itemSize : 1;
  const height = Math.max(0, finite(options.viewportHeight, 0));
  const top = Math.max(0, Math.min(finite(options.scrollTop, 0), Math.max(0, count * size - height)));
  const overscan = Math.min(
    Math.max(0, Math.floor(finite(options.overscan, 0))),
    Math.max(1, Math.ceil(height / size) * 2),
  );
  const start = Math.min(count, Math.floor(top / size));
  const end = Math.min(count, Math.max(start, Math.ceil((top + height) / size)));
  const renderStart = Math.max(0, start - overscan);
  const renderEnd = Math.min(count, end + overscan);
  return {
    itemSize: size,
    visible: { start, end },
    render: { start: renderStart, end: renderEnd },
    topSpacer: renderStart * size,
    bottomSpacer: (count - renderEnd) * size,
  };
}
