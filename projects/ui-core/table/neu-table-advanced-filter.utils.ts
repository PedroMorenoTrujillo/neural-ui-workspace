import { normalizeNeuTableDatePoint } from './neu-table-filter.engine';
import type {
  NeuTableColumn,
  NeuTableFilterMatchMode,
  NeuTableNumberRangeValue,
} from './neu-table.types';

export type InternalAdvancedFilterKind =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multiSelect'
  | 'custom';
export type InternalAdvancedFilterControlKind =
  | InternalAdvancedFilterKind
  | 'select'
  | 'multiSelect'
  | 'none';
export type InternalAdvancedFilterMatchMode = Exclude<NeuTableFilterMatchMode, 'in'>;

export function neuTableAdvancedFilterControlKind<T>(
  column: NeuTableColumn<T>,
): InternalAdvancedFilterControlKind {
  const kind = column.filterConfig?.kind;
  if (
    kind === 'text' ||
    kind === 'number' ||
    kind === 'date' ||
    kind === 'boolean' ||
    kind === 'select' ||
    kind === 'multiSelect'
  ) {
    return kind;
  }
  if (!column.filterConfig && column.filterType === 'select') return 'select';
  if (!column.filterConfig && column.filterType === 'date') return 'date';
  return !column.filterConfig && column.filterable ? 'text' : 'none';
}

export function neuTableAdvancedFilterDatePrecision<T>(
  column: NeuTableColumn<T>,
): 'date-only' | 'instant' {
  return column.filterConfig?.kind === 'date'
    ? (column.filterConfig.precision ?? 'date-only')
    : 'date-only';
}

export function neuTableAdvancedFilterModes<T>(
  column: NeuTableColumn<T>,
): readonly InternalAdvancedFilterMatchMode[] {
  const kind = neuTableAdvancedFilterControlKind(column);
  return kind === 'number'
    ? ['equals', 'notEquals', 'lt', 'lte', 'gt', 'gte', 'between']
    : kind === 'date'
      ? ['is', 'isNot', 'before', 'after', 'between']
      : ['contains', 'startsWith', 'endsWith', 'equals', 'notEquals', 'notContains'];
}

export function neuTableNumberRangeValue(value: unknown): NeuTableNumberRangeValue {
  if (!isRecord(value)) return { from: null, to: null };
  return {
    from: typeof value['from'] === 'number' ? value['from'] : null,
    to: typeof value['to'] === 'number' ? value['to'] : null,
  };
}

export function neuTableDateRangeControlValue(value: unknown): CivilDateRange {
  if (!isRecord(value)) return { start: null, end: null };
  return {
    start: dateOnlyControlDate(value['from']),
    end: dateOnlyControlDate(value['to']),
  };
}

export function neuTableDateRangeFilterValue(value: unknown): {
  from: unknown;
  to: unknown;
} {
  if (!isRecord(value)) return { from: null, to: null };
  return { from: value['from'] ?? null, to: value['to'] ?? null };
}

export function neuTableInstantRangeControlValue(value: unknown, boundary: 'from' | 'to'): string {
  return neuTableDateInputControlValue(neuTableDateRangeFilterValue(value)[boundary], 'instant');
}

export function neuTableDateInputControlValue(
  value: unknown,
  precision: 'date-only' | 'instant',
): string {
  if (precision === 'date-only') {
    return normalizeNeuTableDatePoint(value, 'date-only')?.value ?? '';
  }
  const date = dateControlDate(value);
  return date ? formatLocalDateTime(date) : '';
}

export function neuTableDateFilterValue(
  date: Date | CivilDate | null,
  precision: 'date-only' | 'instant',
): string | null {
  if (isCivilDate(date)) return precision === 'date-only' ? date : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return precision === 'date-only' ? formatLocalDate(date) : date.toISOString();
}

export function neuTableInstantFilterValue(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function isNeuTableDateRange(value: unknown): value is CivilDateRange {
  return isRecord(value) && ('start' in value || 'end' in value);
}

function dateOnlyControlDate(value: unknown): CivilDate | null {
  const canonicalDate = normalizeNeuTableDatePoint(value, 'date-only')?.value;
  if (!canonicalDate) return null;
  return civilDate(canonicalDate);
}

function dateControlDate(value: unknown): Date | null {
  const source = isRecord(value) && typeof value['value'] === 'string' ? value['value'] : value;
  if (source instanceof Date) {
    return Number.isNaN(source.getTime()) ? null : new Date(source.getTime());
  }
  if (typeof source !== 'string' || !source) return null;
  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatLocalDateTime(date: Date): string {
  return `${formatLocalDate(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
import {
  civilDate,
  isCivilDate,
  type CivilDate,
  type CivilDateRange,
} from '@neural-ui/core/date-input';
