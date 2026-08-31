import type {
  NeuTableGroup,
  NeuTableGroupSortOrder,
  NeuTableRowGroupMode,
} from './neu-table.types';

export interface InternalNeuTableGroup<T extends object> extends NeuTableGroup<T> {
  readonly firstRowIndex: number;
  readonly lastRowIndex: number;
}

export interface InternalNeuTableRowspan {
  readonly hidden: boolean;
  readonly span: number;
}

interface MutableNeuTableGroup<T extends object> {
  key: unknown;
  label: string;
  rows: T[];
  count: number;
  groupIndex: number;
  expanded: boolean;
  firstRowIndex: number;
  lastRowIndex: number;
}

/** Pure group ordering, partition and rowspan resolver. */
export class NeuTableGroupingController<T extends object> {
  order(
    rows: readonly T[],
    value: (row: T, index: number) => unknown,
    order: NeuTableGroupSortOrder,
  ): T[] {
    return rows
      .map((row, index) => ({ row, index, value: value(row, index) }))
      .sort((left, right) => {
        const compared = compareGroupValue(left.value, right.value) * order;
        return compared || left.index - right.index;
      })
      .map(({ row }) => row);
  }

  groups(
    rows: readonly T[],
    value: (row: T, index: number) => unknown,
    expandedKeys: ReadonlySet<unknown>,
  ): InternalNeuTableGroup<T>[] {
    const groups: MutableNeuTableGroup<T>[] = [];
    rows.forEach((row, rowIndex) => {
      const key = value(row, rowIndex);
      const previous = groups[groups.length - 1];
      if (previous && Object.is(previous.key, key)) {
        previous.rows.push(row);
        previous.count += 1;
        previous.lastRowIndex = rowIndex;
        return;
      }
      groups.push({
        key,
        label: String(key ?? '—'),
        rows: [row],
        count: 1,
        groupIndex: groups.length,
        expanded: expandedKeys.has(key),
        firstRowIndex: rowIndex,
        lastRowIndex: rowIndex,
      });
    });
    return groups.map((group) => ({ ...group, rows: Object.freeze(group.rows) }));
  }

  /** One bounded projection per group recomputation; render bindings perform O(1) index reads. */
  rowspanProjection(
    mode: NeuTableRowGroupMode,
    groups: readonly InternalNeuTableGroup<T>[],
  ): Int32Array {
    if (mode !== 'rowspan' || groups.length === 0) return new Int32Array(0);
    const projection = new Int32Array(groups[groups.length - 1].lastRowIndex + 1);
    projection.fill(1);
    for (const group of groups) {
      projection[group.firstRowIndex] = group.count;
      projection.fill(0, group.firstRowIndex + 1, group.lastRowIndex + 1);
    }
    return projection;
  }

  rowspan(
    mode: NeuTableRowGroupMode,
    groups: readonly InternalNeuTableGroup<T>[],
    rowIndex: number,
  ): InternalNeuTableRowspan {
    if (mode !== 'rowspan') return { hidden: false, span: 1 };
    let low = 0;
    let high = groups.length - 1;
    let group: InternalNeuTableGroup<T> | undefined;
    while (low <= high) {
      const middle = (low + high) >>> 1;
      const candidate = groups[middle];
      if (rowIndex < candidate.firstRowIndex) high = middle - 1;
      else if (rowIndex > candidate.lastRowIndex) low = middle + 1;
      else {
        group = candidate;
        break;
      }
    }
    if (!group) return { hidden: false, span: 1 };
    return rowIndex === group.firstRowIndex
      ? { hidden: false, span: group.count }
      : { hidden: true, span: 0 };
  }
}

function compareGroupValue(left: unknown, right: unknown): number {
  if (Object.is(left, right)) return 0;
  if (left == null) return -1;
  if (right == null) return 1;
  if (typeof left === 'string' && typeof right === 'string') {
    return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
  }
  return left < right ? -1 : 1;
}
