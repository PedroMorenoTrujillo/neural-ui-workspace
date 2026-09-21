import type { NeuTableRange, NeuTableVirtualizationOptions } from '../../public/neu-table.types';

export interface NeuTableViewportGeometry {
  readonly measured: boolean;
  readonly scrollTop: number;
  readonly viewportSize: number;
}

export interface NeuTableVirtualProjection {
  readonly itemSize: number;
  readonly measured: boolean;
  readonly render: NeuTableRange;
  readonly request: NeuTableRange;
  readonly step: number;
  readonly visible: NeuTableRange;
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function normalizeNeuTableLogicalCount(value: number | null): number | null {
  if (value === null) return null;
  return Math.max(0, Math.floor(finite(value, 0)));
}

export function normalizeNeuTableItemSize(value: number): number {
  return value > 0 && Number.isFinite(value) ? value : 1;
}

export function normalizeNeuTableOverscan(value: number): number {
  return value >= 0 && Number.isFinite(value) ? Math.floor(value) : 4;
}

export function effectiveNeuTableRequestStep(value: number | undefined): number {
  return value !== undefined && value > 0 && Number.isFinite(value)
    ? Math.max(1, Math.floor(value))
    : 50;
}

export function normalizeNeuTableRange(range: NeuTableRange): NeuTableRange {
  const start = Math.max(0, Math.floor(finite(range.start, 0)));
  const end = Math.max(start, Math.floor(finite(range.end, start)));
  return { start, end };
}

export function areNeuTableRangesEqual(
  left: NeuTableRange | null | undefined,
  right: NeuTableRange | null | undefined,
): boolean {
  return left?.start === right?.start && left?.end === right?.end;
}

export function doesNeuTableRangeCover(
  available: NeuTableRange | undefined,
  required: NeuTableRange | null | undefined,
): boolean {
  if (required === null || required === undefined) return true;
  if (available === undefined) return required.start === required.end;
  const normalizedAvailable = normalizeNeuTableRange(available);
  const normalizedRequired = normalizeNeuTableRange(required);
  return (
    normalizedAvailable.start <= normalizedRequired.start &&
    normalizedAvailable.end >= normalizedRequired.end
  );
}

export function alignNeuTableRequestRange(
  required: NeuTableRange,
  step: number,
  total: number | null,
): NeuTableRange {
  const normalized = normalizeNeuTableRange(required);
  const normalizedStep = effectiveNeuTableRequestStep(step);
  const normalizedTotal = normalizeNeuTableLogicalCount(total);
  const start = Math.floor(normalized.start / normalizedStep) * normalizedStep;
  const alignedEnd = Math.ceil(normalized.end / normalizedStep) * normalizedStep;
  const end = normalizedTotal === null ? alignedEnd : Math.min(normalizedTotal, alignedEnd);
  return { start: Math.min(start, end), end };
}

export function projectNeuTableVirtualWindow(options: {
  readonly geometry: NeuTableViewportGeometry;
  readonly total: number | null;
  readonly virtualization: Extract<NeuTableVirtualizationOptions, { readonly enabled: true }>;
}): NeuTableVirtualProjection {
  const itemSize = normalizeNeuTableItemSize(options.virtualization.itemSize);
  const overscan = normalizeNeuTableOverscan(options.virtualization.overscan);
  const step = effectiveNeuTableRequestStep(options.virtualization.requestStep);
  const total = normalizeNeuTableLogicalCount(options.total);

  if (!options.geometry.measured) {
    const end = total === null ? step : Math.min(total, step);
    const render = { start: 0, end };
    return {
      itemSize,
      measured: false,
      visible: { start: 0, end: 0 },
      render,
      request: alignNeuTableRequestRange(render, step, total),
      step,
    };
  }

  const scrollTop = Math.max(0, finite(options.geometry.scrollTop, 0));
  const viewportSize = Math.max(0, finite(options.geometry.viewportSize, 0));
  const unboundedStart = Math.floor(scrollTop / itemSize);
  const visibleStart = total === null ? unboundedStart : Math.min(total, unboundedStart);
  const unboundedEnd = Math.ceil((scrollTop + viewportSize) / itemSize);
  const visibleEnd =
    total === null
      ? Math.max(visibleStart, unboundedEnd)
      : Math.min(total, Math.max(visibleStart, unboundedEnd));
  const renderStart = Math.max(0, visibleStart - overscan);
  const renderEndUnbounded = visibleEnd + overscan;
  const renderEnd = total === null ? renderEndUnbounded : Math.min(total, renderEndUnbounded);
  const render = { start: renderStart, end: Math.max(renderStart, renderEnd) };

  return {
    itemSize,
    measured: true,
    visible: { start: visibleStart, end: visibleEnd },
    render,
    request: alignNeuTableRequestRange(render, step, total),
    step,
  };
}

export function projectNeuTableSpacerSizes(options: {
  readonly itemSize: number;
  readonly mounted: NeuTableRange;
  readonly total: number | null;
}): { readonly before: number; readonly after: number } {
  const mounted = normalizeNeuTableRange(options.mounted);
  const total = normalizeNeuTableLogicalCount(options.total);
  const itemSize = normalizeNeuTableItemSize(options.itemSize);
  return {
    before: mounted.start * itemSize,
    after: total === null ? 0 : Math.max(0, total - mounted.end) * itemSize,
  };
}

export function neuTableOffsetForIndex(index: number, itemSize: number): number | null {
  if (!Number.isFinite(index) || index < 0 || !Number.isInteger(index)) return null;
  return index * normalizeNeuTableItemSize(itemSize);
}

export function neuTableIndexForOffset(offset: number, itemSize: number): number {
  return Math.floor(Math.max(0, finite(offset, 0)) / normalizeNeuTableItemSize(itemSize));
}
