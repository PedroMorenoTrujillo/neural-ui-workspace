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
    const groups: InternalNeuTableGroup<T>[] = [];
    rows.forEach((row, rowIndex) => {
      const key = value(row, rowIndex);
      const previous = groups[groups.length - 1];
      if (previous && Object.is(previous.key, key)) {
        const nextRows = [...previous.rows, row];
        groups[groups.length - 1] = {
          ...previous,
          rows: Object.freeze(nextRows),
          count: nextRows.length,
          lastRowIndex: rowIndex,
        };
        return;
      }
      groups.push({
        key,
        label: String(key ?? '—'),
        rows: Object.freeze([row]),
        count: 1,
        groupIndex: groups.length,
        expanded: expandedKeys.has(key),
        firstRowIndex: rowIndex,
        lastRowIndex: rowIndex,
      });
    });
    return groups;
  }

  rowspan(
    mode: NeuTableRowGroupMode,
    groups: readonly InternalNeuTableGroup<T>[],
    rowIndex: number,
  ): InternalNeuTableRowspan {
    if (mode !== 'rowspan') return { hidden: false, span: 1 };
    const group = groups.find(
      (candidate) => rowIndex >= candidate.firstRowIndex && rowIndex <= candidate.lastRowIndex,
    );
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
