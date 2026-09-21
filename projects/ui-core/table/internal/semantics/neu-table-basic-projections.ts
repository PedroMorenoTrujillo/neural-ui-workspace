import type { NeuTableColumn, NeuTableLayoutState } from '../../public/neu-table.types';
import { projectNeuTableLayout } from '../layout/neu-table-layout';

export function projectNeuTableVisibleColumns<T, F extends string>(
  columns: readonly NeuTableColumn<T, F>[],
  layout: NeuTableLayoutState,
): readonly NeuTableColumn<T, F>[] {
  return projectNeuTableLayout(columns, layout).columns;
}

export function readNeuTableColumnValue<T extends object, F extends string>(
  row: T,
  column: NeuTableColumn<T, F>,
): unknown {
  if (column.value) return column.value(row);
  if (!column.field || !(column.field in row)) return undefined;
  return Reflect.get(row, column.field) as unknown;
}

export function presentNeuTableBasicValue(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  return null;
}

export function resolveNeuTableColumnWidth<T, F extends string>(
  column: NeuTableColumn<T, F>,
  layout: NeuTableLayoutState,
): string | undefined {
  return layout.widths[column.id] ?? column.width;
}
