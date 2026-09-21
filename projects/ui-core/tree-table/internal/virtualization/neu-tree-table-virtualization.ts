import type {
  NeuTreeTableRange,
  NeuTreeTableVirtualizationOptions,
} from '../../public/neu-tree-table.types';

export interface TreeVirtualViewportGeometry {
  readonly measured: boolean;
  readonly scrollTop: number;
  readonly viewportSize: number;
}

export interface TreeVirtualWindow {
  readonly itemSize: number;
  readonly measured: boolean;
  readonly visible: NeuTreeTableRange;
  readonly render: NeuTreeTableRange;
  readonly before: number;
  readonly after: number;
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function normalizeNeuTreeTableItemSize(value: number): number {
  return value > 0 && Number.isFinite(value) ? value : 1;
}

export function normalizeNeuTreeTableOverscan(value: number): number {
  return value >= 0 && Number.isFinite(value) ? Math.floor(value) : 4;
}

export function normalizeNeuTreeTableRange(range: NeuTreeTableRange): NeuTreeTableRange {
  const start = Math.max(0, Math.floor(finite(range.start, 0)));
  const end = Math.max(start, Math.floor(finite(range.end, start)));
  return { start, end };
}

export function areNeuTreeTableRangesEqual(
  left: NeuTreeTableRange | null | undefined,
  right: NeuTreeTableRange | null | undefined,
): boolean {
  return left?.start === right?.start && left?.end === right?.end;
}

export function neuTreeTableOffsetForIndex(index: number, itemSize: number): number | null {
  if (!Number.isInteger(index) || index < 0 || !Number.isFinite(index)) return null;
  return index * normalizeNeuTreeTableItemSize(itemSize);
}

export function neuTreeTableIndexForOffset(offset: number, itemSize: number): number {
  return Math.floor(Math.max(0, finite(offset, 0)) / normalizeNeuTreeTableItemSize(itemSize));
}

export function projectNeuTreeTableVirtualWindow(options: {
  readonly geometry: TreeVirtualViewportGeometry;
  readonly total: number;
  readonly virtualization: NeuTreeTableVirtualizationOptions;
}): TreeVirtualWindow {
  const total = Math.max(0, Math.floor(finite(options.total, 0)));
  if (!options.virtualization.enabled || !options.geometry.measured) {
    const range = { start: 0, end: total };
    return {
      itemSize: options.virtualization.enabled
        ? normalizeNeuTreeTableItemSize(options.virtualization.itemSize)
        : 1,
      measured: false,
      visible: range,
      render: range,
      before: 0,
      after: 0,
    };
  }

  const itemSize = normalizeNeuTreeTableItemSize(options.virtualization.itemSize);
  const overscan = normalizeNeuTreeTableOverscan(options.virtualization.overscan);
  const scrollTop = Math.max(0, finite(options.geometry.scrollTop, 0));
  const viewportSize = Math.max(0, finite(options.geometry.viewportSize, 0));
  const visibleStart = Math.min(total, Math.floor(scrollTop / itemSize));
  const visibleEnd = Math.min(
    total,
    Math.max(visibleStart, Math.ceil((scrollTop + viewportSize) / itemSize)),
  );
  const renderStart = Math.max(0, visibleStart - overscan);
  const renderEnd = Math.min(total, visibleEnd + overscan);

  return {
    itemSize,
    measured: true,
    visible: { start: visibleStart, end: visibleEnd },
    render: { start: renderStart, end: Math.max(renderStart, renderEnd) },
    before: renderStart * itemSize,
    after: Math.max(0, total - renderEnd) * itemSize,
  };
}
