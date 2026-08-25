import type { NeuTableColumn, NeuTableSortEntry } from './neu-table.types';

interface InternalNeuTableSortPlan<T> {
  accessor: (row: T) => unknown;
  comparator?: (a: T, b: T) => number;
}

/** Stateless interaction/comparison policy. Canonical sort values remain in NeuTableStateController. */
export class NeuTableSortController<T extends object> {
  next(
    current: readonly NeuTableSortEntry[],
    key: string,
    options: {
      multiple: boolean;
      additive: boolean;
      removable: boolean;
      defaultOrder?: 1 | -1;
    },
  ): NeuTableSortEntry[] {
    const initialDirection: 'asc' | 'desc' = options.defaultOrder === -1 ? 'desc' : 'asc';
    if (!options.multiple) {
      const active = current[0];
      if (active?.key !== key) return [{ key, dir: initialDirection }];
      if (active.dir === initialDirection) {
        return [{ key, dir: initialDirection === 'asc' ? 'desc' : 'asc' }];
      }
      return options.removable ? [] : [{ key, dir: initialDirection }];
    }

    const entries = options.additive ? current.map((entry) => ({ ...entry })) : [];
    const active = current.find((entry) => entry.key === key);
    const index = entries.findIndex((entry) => entry.key === key);
    if (!active) {
      entries.push({ key, dir: initialDirection });
    } else if (active.dir === initialDirection) {
      const next = { key, dir: initialDirection === 'asc' ? ('desc' as const) : ('asc' as const) };
      if (index >= 0) entries[index] = next;
      else entries.push(next);
    } else if (!options.removable) {
      const next: NeuTableSortEntry = { key, dir: initialDirection };
      if (index >= 0) entries[index] = next;
      else entries.push(next);
    } else if (index >= 0) {
      entries.splice(index, 1);
    }
    return entries;
  }

  sort(
    rows: readonly T[],
    entries: readonly NeuTableSortEntry[],
    columns: readonly NeuTableColumn<T>[],
  ): T[] {
    if (entries.length === 0) return [...rows];
    const plans = this._plans(columns);
    return [...rows].sort((a, b) => {
      for (const entry of entries) {
        const plan = plans.get(entry.key) ?? {
          accessor: (row: T) => (row as Record<string, unknown>)[entry.key],
        };
        const compared = plan.comparator
          ? plan.comparator(a, b)
          : compareNeuTableSortValues(plan.accessor(a), plan.accessor(b));
        if (compared !== 0) return entry.dir === 'asc' ? compared : -compared;
      }
      return 0;
    });
  }

  private _plans(columns: readonly NeuTableColumn<T>[]): Map<string, InternalNeuTableSortPlan<T>> {
    return new Map(
      columns.map((column) => [
        column.key,
        {
          accessor:
            column.sortAccessor ?? ((row: T) => (row as Record<string, unknown>)[column.key]),
          ...(column.sortComparator ? { comparator: column.sortComparator } : {}),
        },
      ]),
    );
  }
}

function compareNeuTableSortValues(left: unknown, right: unknown): number {
  if (Object.is(left, right)) return 0;
  const leftEmptyRank = left === null ? 0 : left === undefined ? 1 : 2;
  const rightEmptyRank = right === null ? 0 : right === undefined ? 1 : 2;
  if (leftEmptyRank !== rightEmptyRank) return leftEmptyRank < rightEmptyRank ? -1 : 1;
  if (typeof left === 'number' && typeof right === 'number') {
    if (Number.isNaN(left)) return Number.isNaN(right) ? 0 : -1;
    if (Number.isNaN(right)) return 1;
    if (left === right) return 0;
    return left < right ? -1 : 1;
  }
  if (typeof left === 'bigint' && typeof right === 'bigint') return left < right ? -1 : 1;
  if (left instanceof Date && right instanceof Date) {
    const leftTime = left.getTime();
    const rightTime = right.getTime();
    if (Number.isNaN(leftTime)) return Number.isNaN(rightTime) ? 0 : -1;
    if (Number.isNaN(rightTime)) return 1;
    if (leftTime === rightTime) return 0;
    return leftTime < rightTime ? -1 : 1;
  }
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);
  if (typeof left === 'string' && typeof right === 'string') {
    return left.localeCompare(right, undefined, { numeric: true });
  }
  return String(left).localeCompare(String(right), undefined, { numeric: true });
}
