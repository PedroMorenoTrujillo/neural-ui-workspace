import type { NeuTableVirtualRange } from './neu-table.types';

export interface NeuTableRetainedInterval {
  readonly first: number;
  readonly end: number;
}

/**
 * Append-only render memory. Intervals prevent a far programmatic jump from
 * allocating every skipped logical row; sparse loaded rows are cached by index.
 */
export class NeuTableVirtualRetentionController<T> {
  private _intervals: NeuTableRetainedInterval[] = [];
  private readonly _rows = new Map<number, T>();

  include(
    range: NeuTableVirtualRange,
    totalItems: number,
    dataFirst: number | undefined,
    rows: readonly T[],
  ): boolean {
    const total = Math.max(0, Math.floor(totalItems) || 0);
    const first = Math.min(total, Math.max(0, Math.floor(range.first) || 0));
    const end = Math.min(total, Math.max(first, Math.floor(range.end) || first));
    let changed = false;
    if (end > first) {
      const before = JSON.stringify(this._intervals);
      this._intervals = mergeIntervals([...this._intervals, { first, end }]);
      changed = before !== JSON.stringify(this._intervals);
    }
    if (dataFirst !== undefined) {
      const start = Math.max(0, Math.floor(dataFirst) || 0);
      rows.forEach((row, index) => {
        const logicalIndex = start + index;
        if (logicalIndex >= total) return;
        if (this._rows.get(logicalIndex) !== row) {
          this._rows.set(logicalIndex, row);
          changed = true;
        }
      });
    }
    for (const index of this._rows.keys()) {
      if (index >= total) {
        this._rows.delete(index);
        changed = true;
      }
    }
    const clamped = mergeIntervals(
      this._intervals
        .map((interval) => ({
          first: Math.min(total, interval.first),
          end: Math.min(total, interval.end),
        }))
        .filter((interval) => interval.end > interval.first),
    );
    if (JSON.stringify(clamped) !== JSON.stringify(this._intervals)) {
      this._intervals = clamped;
      changed = true;
    }
    return changed;
  }

  intervals(): readonly NeuTableRetainedInterval[] {
    return this._intervals;
  }

  row(index: number): T | undefined {
    return this._rows.get(index);
  }

  reset(): boolean {
    if (this._intervals.length === 0 && this._rows.size === 0) return false;
    this._intervals = [];
    this._rows.clear();
    return true;
  }
}

function mergeIntervals(
  intervals: readonly NeuTableRetainedInterval[],
): NeuTableRetainedInterval[] {
  const sorted = [...intervals].sort((left, right) => left.first - right.first);
  const merged: NeuTableRetainedInterval[] = [];
  for (const interval of sorted) {
    const previous = merged.at(-1);
    if (!previous || interval.first > previous.end) {
      merged.push({ ...interval });
    } else {
      merged[merged.length - 1] = {
        first: previous.first,
        end: Math.max(previous.end, interval.end),
      };
    }
  }
  return merged;
}
