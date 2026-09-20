import type {
  NeuTableColumn,
  NeuTableLayoutChange,
  NeuTableLayoutState,
} from '../../public/neu-table.types';

export type NeuTableColumnPin = 'start' | 'end' | null;

export interface NeuTableLayoutProjection<T, F extends string> {
  readonly columns: readonly NeuTableColumn<T, F>[];
  readonly hiddenColumns: readonly NeuTableColumn<T, F>[];
  readonly pinById: ReadonlyMap<string, NeuTableColumnPin>;
}

function uniqueKnownIds(ids: readonly string[], known: ReadonlySet<string>): readonly string[] {
  const seen = new Set<string>();
  return ids.filter((id) => {
    if (!known.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function normalizeNeuTableColumns<T, F extends string>(
  columns: readonly NeuTableColumn<T, F>[],
  diagnoseDuplicates: boolean,
): readonly NeuTableColumn<T, F>[] {
  const seen = new Set<string>();
  const normalized: NeuTableColumn<T, F>[] = [];
  for (const column of columns) {
    if (seen.has(column.id)) {
      if (diagnoseDuplicates) throw new Error(`NeuTable 2 duplicate column id: ${column.id}`);
      continue;
    }
    seen.add(column.id);
    normalized.push(column);
  }
  return normalized;
}

export function projectNeuTableLayout<T, F extends string>(
  columns: readonly NeuTableColumn<T, F>[],
  layout: NeuTableLayoutState,
): NeuTableLayoutProjection<T, F> {
  const known = new Set(columns.map((column) => column.id));
  const byId = new Map(columns.map((column) => [column.id, column] as const));
  const order = uniqueKnownIds(layout.order, known);
  const orderedIds = new Set(order);
  const ordered = [
    ...order.map((id) => byId.get(id)!),
    ...columns.filter((column) => !orderedIds.has(column.id)),
  ];
  const hiddenIds = new Set(uniqueKnownIds(layout.hidden, known));
  const startIds = new Set(uniqueKnownIds(layout.pinnedStart, known));
  const endIds = new Set(uniqueKnownIds(layout.pinnedEnd, known).filter((id) => !startIds.has(id)));
  const visible = ordered.filter((column) => !hiddenIds.has(column.id));
  const start = visible.filter((column) => startIds.has(column.id));
  const normal = visible.filter((column) => !startIds.has(column.id) && !endIds.has(column.id));
  const end = visible.filter((column) => endIds.has(column.id));
  const pinById = new Map<string, NeuTableColumnPin>();
  for (const column of columns) {
    pinById.set(
      column.id,
      startIds.has(column.id) ? 'start' : endIds.has(column.id) ? 'end' : null,
    );
  }
  return {
    columns: [...start, ...normal, ...end],
    hiddenColumns: ordered.filter((column) => hiddenIds.has(column.id)),
    pinById,
  };
}

export function areNeuTableLayoutsEqual(
  left: NeuTableLayoutState,
  right: NeuTableLayoutState,
): boolean {
  const sameArray = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && a.every((value, index) => value === b[index]);
  const leftWidths = Object.entries(left.widths);
  const rightWidths = Object.entries(right.widths);
  return (
    sameArray(left.order, right.order) &&
    sameArray(left.hidden, right.hidden) &&
    sameArray(left.pinnedStart, right.pinnedStart) &&
    sameArray(left.pinnedEnd, right.pinnedEnd) &&
    leftWidths.length === rightWidths.length &&
    leftWidths.every(([id, width]) => right.widths[id] === width)
  );
}

function proposal(
  applied: NeuTableLayoutState,
  next: NeuTableLayoutState,
  source: NeuTableLayoutChange['source'],
): NeuTableLayoutChange | null {
  return areNeuTableLayoutsEqual(applied, next) ? null : { next, source };
}

export function proposeNeuTableVisibility(
  layout: NeuTableLayoutState,
  columnId: string,
  visible: boolean,
): NeuTableLayoutChange | null {
  const hidden = layout.hidden.filter((id) => id !== columnId);
  if (!visible) hidden.push(columnId);
  return proposal(layout, { ...layout, hidden }, 'visibility');
}

export function proposeNeuTablePin(
  layout: NeuTableLayoutState,
  columnId: string,
  pin: NeuTableColumnPin,
): NeuTableLayoutChange | null {
  const pinnedStart = layout.pinnedStart.filter((id) => id !== columnId);
  const pinnedEnd = layout.pinnedEnd.filter((id) => id !== columnId);
  if (pin === 'start') pinnedStart.push(columnId);
  if (pin === 'end') pinnedEnd.push(columnId);
  return proposal(layout, { ...layout, pinnedStart, pinnedEnd }, 'pin');
}

export function proposeNeuTableReorder<T, F extends string>(
  columns: readonly NeuTableColumn<T, F>[],
  layout: NeuTableLayoutState,
  columnId: string,
  targetId: string,
): NeuTableLayoutChange | null {
  if (columnId === targetId) return null;
  const projection = projectNeuTableLayout(columns, layout);
  if (projection.pinById.get(columnId) !== projection.pinById.get(targetId)) return null;
  const order = projection.columns.map((column) => column.id);
  const from = order.indexOf(columnId);
  const target = order.indexOf(targetId);
  if (from < 0 || target < 0) return null;
  const [moved] = order.splice(from, 1);
  if (moved === undefined) return null;
  order.splice(target, 0, moved);
  const hidden = projection.hiddenColumns.map((column) => column.id);
  return proposal(layout, { ...layout, order: [...order, ...hidden] }, 'reorder');
}

export function proposeNeuTableMove<T, F extends string>(
  columns: readonly NeuTableColumn<T, F>[],
  layout: NeuTableLayoutState,
  columnId: string,
  delta: -1 | 1,
): NeuTableLayoutChange | null {
  const projected = projectNeuTableLayout(columns, layout).columns;
  const index = projected.findIndex((column) => column.id === columnId);
  const target = projected[index + delta];
  return target === undefined ? null : proposeNeuTableReorder(columns, layout, columnId, target.id);
}

function pixelValue(value: string | undefined): number | null {
  if (value === undefined) return null;
  const match = /^\s*(\d+(?:\.\d+)?)px\s*$/u.exec(value);
  if (match === null) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeNeuTableResize<T, F extends string>(
  column: NeuTableColumn<T, F>,
  width: number,
): string | null {
  if (!Number.isFinite(width)) return null;
  const minimum = pixelValue(column.minWidth) ?? 1;
  const maximum = pixelValue(column.maxWidth) ?? Number.MAX_SAFE_INTEGER;
  const normalized = Math.min(Math.max(Math.round(width), minimum), Math.max(minimum, maximum));
  return `${normalized}px`;
}

export function proposeNeuTableResize<T, F extends string>(
  layout: NeuTableLayoutState,
  column: NeuTableColumn<T, F>,
  width: number,
): NeuTableLayoutChange | null {
  const normalized = normalizeNeuTableResize(column, width);
  if (normalized === null) return null;
  return proposal(
    layout,
    { ...layout, widths: { ...layout.widths, [column.id]: normalized } },
    'resize',
  );
}
