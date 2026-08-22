import type {
  NeuTableColumn,
  NeuTableDateFilterMode,
  NeuTableDatePoint,
  NeuTableDatePrecision,
  NeuTableDateRangeValue,
  NeuTableFilterConfig,
  NeuTableFilterMatchMode,
  NeuTableFilterState,
  NeuTableNumberFilterMode,
  NeuTableNumberRangeValue,
  NeuTableTextFilterMode,
} from './neu-table.types';
import { neuOptionValuesEqual } from '@neural-ui/core/option-api';

type FilterableColumn<T> = NeuTableColumn<T, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isEmptyRange(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!('from' in value) && !('to' in value)) return false;
  const from = value['from'];
  const to = value['to'];
  return (
    (from === null || from === undefined || from === '') &&
    (to === null || to === undefined || to === '')
  );
}

export function isNeuTableFilterValueEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (isEmptyRange(value)) return true;
  return false;
}

function normalizedText(value: unknown): string {
  return String(value ?? '').toLowerCase();
}

function resolveTextFilterMode(
  override: NeuTableFilterMatchMode | undefined,
  configured: NeuTableTextFilterMode | undefined,
): NeuTableTextFilterMode {
  switch (override) {
    case 'contains':
    case 'startsWith':
    case 'endsWith':
    case 'equals':
    case 'notEquals':
    case 'notContains':
      return override;
    default:
      return configured ?? 'contains';
  }
}

function resolveNumberFilterMode(
  override: NeuTableFilterMatchMode | undefined,
  configured: NeuTableNumberFilterMode | undefined,
): NeuTableNumberFilterMode {
  switch (override) {
    case 'equals':
    case 'notEquals':
    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte':
    case 'between':
      return override;
    default:
      return configured ?? 'equals';
  }
}

function resolveDateFilterMode(
  override: NeuTableFilterMatchMode | undefined,
  configured: NeuTableDateFilterMode | undefined,
): NeuTableDateFilterMode {
  switch (override) {
    case 'is':
    case 'isNot':
    case 'before':
    case 'after':
    case 'between':
      return override;
    default:
      return configured ?? 'is';
  }
}

export function matchNeuTableText(
  value: unknown,
  filterValue: unknown,
  mode: NeuTableTextFilterMode = 'contains',
): boolean {
  if (isNeuTableFilterValueEmpty(filterValue)) return true;
  const candidate = normalizedText(value);
  const filter = normalizedText(filterValue);
  switch (mode) {
    case 'startsWith':
      return candidate.startsWith(filter);
    case 'endsWith':
      return candidate.endsWith(filter);
    case 'equals':
      return candidate === filter;
    case 'notEquals':
      return candidate !== filter;
    case 'notContains':
      return !candidate.includes(filter);
    default:
      return candidate.includes(filter);
  }
}

function numericValue(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function numberFilterRange(value: unknown): NeuTableNumberRangeValue | null {
  if (!isRecord(value)) return null;
  const from = value['from'];
  const to = value['to'];
  const normalizedFrom =
    from === null || from === undefined || from === '' ? null : numericValue(from);
  const normalizedTo = to === null || to === undefined || to === '' ? null : numericValue(to);
  if (from !== null && from !== undefined && from !== '' && normalizedFrom === null) return null;
  if (to !== null && to !== undefined && to !== '' && normalizedTo === null) return null;
  return { from: normalizedFrom, to: normalizedTo };
}

export function matchNeuTableNumber(
  value: unknown,
  filterValue: unknown,
  mode: NeuTableNumberFilterMode = 'equals',
): boolean {
  if (isNeuTableFilterValueEmpty(filterValue)) return true;
  const candidate = numericValue(value);
  if (candidate === null) return false;

  if (mode === 'between') {
    const range = numberFilterRange(filterValue);
    if (!range) return false;
    if (range.from === null && range.to === null) return true;
    if (range.from !== null && candidate < range.from) return false;
    if (range.to !== null && candidate > range.to) return false;
    return true;
  }

  const filter = numericValue(filterValue);
  if (filter === null) return false;
  switch (mode) {
    case 'notEquals':
      return candidate !== filter;
    case 'lt':
      return candidate < filter;
    case 'lte':
      return candidate <= filter;
    case 'gt':
      return candidate > filter;
    case 'gte':
      return candidate >= filter;
    default:
      return candidate === filter;
  }
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dateOnlyFromDate(value: Date): NeuTableDatePoint {
  return {
    precision: 'date-only',
    value: `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`,
  };
}

function instantFromDate(value: Date): NeuTableDatePoint {
  return { precision: 'instant', value: value.toISOString() };
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (Number.isNaN(timestamp)) return false;
  const parsed = new Date(timestamp);
  return (
    `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}` ===
    value
  );
}

export function normalizeNeuTableDatePoint(
  value: unknown,
  precision: NeuTableDatePrecision = 'date-only',
): NeuTableDatePoint | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : precision === 'instant'
        ? instantFromDate(value)
        : dateOnlyFromDate(value);
  }

  if (
    isRecord(value) &&
    typeof value['precision'] === 'string' &&
    typeof value['value'] === 'string'
  ) {
    const pointPrecision = value['precision'];
    const pointValue = value['value'];
    if (pointPrecision === 'date-only' && isValidDateOnly(pointValue)) {
      return { precision: 'date-only', value: pointValue };
    }
    if (pointPrecision === 'instant') {
      const parsed = new Date(pointValue);
      return Number.isNaN(parsed.getTime()) ? null : instantFromDate(parsed);
    }
    return null;
  }

  if (typeof value !== 'string' || value.trim() === '') return null;
  const trimmed = value.trim();
  if (isValidDateOnly(trimmed)) {
    return { precision: 'date-only', value: trimmed };
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime())
    ? null
    : precision === 'instant'
      ? instantFromDate(parsed)
      : dateOnlyFromDate(parsed);
}

function normalizeDatePointForPrecision(
  value: unknown,
  precision: NeuTableDatePrecision,
): NeuTableDatePoint | null {
  const source = isRecord(value) && typeof value['value'] === 'string' ? value['value'] : value;
  return normalizeNeuTableDatePoint(source, precision);
}

function dateRangeValue(
  value: unknown,
  precision: NeuTableDatePrecision,
): NeuTableDateRangeValue | null {
  if (!isRecord(value)) return null;
  const from = value['from'];
  const to = value['to'];
  const normalizedFrom =
    from === null || from === undefined || from === ''
      ? null
      : normalizeDatePointForPrecision(from, precision);
  const normalizedTo =
    to === null || to === undefined || to === ''
      ? null
      : normalizeDatePointForPrecision(to, precision);
  if (from !== null && from !== undefined && from !== '' && normalizedFrom === null) return null;
  if (to !== null && to !== undefined && to !== '' && normalizedTo === null) return null;
  return { from: normalizedFrom, to: normalizedTo };
}

function dateTimestamp(value: unknown): number | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value !== 'string' || value.trim() === '') return null;
  if (isValidDateOnly(value.trim())) {
    return Date.parse(`${value.trim()}T00:00:00.000Z`);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function dateComparable(value: unknown, precision: NeuTableDatePrecision): string | number | null {
  if (precision === 'date-only') {
    const point = normalizeNeuTableDatePoint(value, 'date-only');
    return point?.value ?? null;
  }
  return dateTimestamp(value);
}

function pointComparable(
  point: NeuTableDatePoint,
  precision: NeuTableDatePrecision,
): string | number | null {
  return precision === 'date-only'
    ? point.precision === 'date-only'
      ? point.value
      : dateComparable(point.value, 'date-only')
    : point.precision === 'instant'
      ? dateTimestamp(point.value)
      : dateTimestamp(point.value);
}

function compareDateComparable(left: string | number, right: string | number): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (typeof left === 'string' && typeof right === 'string')
    return left < right ? -1 : left > right ? 1 : 0;
  return Number.NaN;
}

export function matchNeuTableDate(
  value: unknown,
  filterValue: unknown,
  mode: NeuTableDateFilterMode = 'is',
  precision: NeuTableDatePrecision = 'date-only',
): boolean {
  if (isNeuTableFilterValueEmpty(filterValue)) return true;
  const candidate = dateComparable(value, precision);
  if (candidate === null) return false;

  if (mode === 'between') {
    const range = dateRangeValue(filterValue, precision);
    if (!range) return false;
    if (range.from === null && range.to === null) return true;
    const from = range.from ? pointComparable(range.from, precision) : null;
    const to = range.to ? pointComparable(range.to, precision) : null;
    if (from !== null && compareDateComparable(candidate, from) < 0) return false;
    if (to !== null && compareDateComparable(candidate, to) > 0) return false;
    return true;
  }

  const point = normalizeNeuTableDatePoint(filterValue, precision);
  if (!point) return false;
  const filter = pointComparable(point, precision);
  if (filter === null) return false;
  switch (mode) {
    case 'isNot':
      return candidate !== filter;
    case 'before':
      return candidate < filter;
    case 'after':
      return candidate > filter;
    default:
      return candidate === filter;
  }
}

export function matchNeuTableBoolean(value: unknown, filterValue: unknown): boolean {
  if (filterValue === null || filterValue === undefined || filterValue === 'all') return true;
  if (typeof filterValue !== 'boolean') return false;
  return value === filterValue;
}

function filterAccessor<T>(
  row: T,
  column: FilterableColumn<T>,
  config?: NeuTableFilterConfig<T>,
): unknown {
  return config?.accessor ? config.accessor(row) : (row as Record<string, unknown>)[column.key];
}

export function matchesNeuTableFilter<T>(
  row: T,
  column: FilterableColumn<T>,
  filterValue: unknown,
  modeOverride?: NeuTableFilterMatchMode,
): boolean {
  const config = column.filterConfig;
  if (isNeuTableFilterValueEmpty(filterValue)) return true;
  const value = filterAccessor(row, column, config);

  if (!config) return matchNeuTableText(value, filterValue, 'contains');

  switch (config.kind) {
    case 'number':
      return matchNeuTableNumber(
        value,
        filterValue,
        resolveNumberFilterMode(modeOverride, config.mode),
      );
    case 'date':
      return matchNeuTableDate(
        value,
        filterValue,
        resolveDateFilterMode(modeOverride, config.mode),
        config.precision ?? 'date-only',
      );
    case 'boolean':
      return matchNeuTableBoolean(value, filterValue);
    case 'custom':
      return config.predicate(value, filterValue, row);
    case 'text':
      return matchNeuTableText(
        value,
        filterValue,
        resolveTextFilterMode(modeOverride, config.mode),
      );
    case 'select':
      return neuOptionValuesEqual(value, filterValue);
    case 'multiSelect':
      return (
        Array.isArray(filterValue) &&
        filterValue.some((item) => neuOptionValuesEqual(item, value))
      );
  }
  return false;
}

export function normalizeNeuTableAppliedFilterValue<T>(
  column: FilterableColumn<T>,
  filterValue: unknown,
  modeOverride?: NeuTableFilterMatchMode,
): unknown {
  if (isNeuTableFilterValueEmpty(filterValue)) return filterValue;
  const config = column.filterConfig;
  if (!config) return filterValue;

  switch (config.kind) {
    case 'text':
      return String(filterValue);
    case 'number': {
      const mode = resolveNumberFilterMode(modeOverride, config.mode);
      const value = mode === 'between' ? numberFilterRange(filterValue) : numericValue(filterValue);
      return value ?? snapshotNeuTableRangeValue(filterValue);
    }
    case 'date': {
      const mode = resolveDateFilterMode(modeOverride, config.mode);
      const precision = config.precision ?? 'date-only';
      if (mode === 'between') {
        const range = dateRangeValue(filterValue, precision);
        return range
          ? { from: range.from?.value ?? null, to: range.to?.value ?? null }
          : snapshotNeuTableRangeValue(filterValue);
      }
      return (
        normalizeDatePointForPrecision(filterValue, precision)?.value ??
        snapshotNeuTableDateValue(filterValue)
      );
    }
    case 'multiSelect':
      return Array.isArray(filterValue) ? [...filterValue] : filterValue;
    default:
      return filterValue;
  }
}

function snapshotNeuTableDateValue(value: unknown): unknown {
  if (value instanceof Date) return new Date(value.getTime());
  if (!isRecord(value)) return value;
  return { ...value };
}

function snapshotNeuTableRangeValue(value: unknown): unknown {
  if (!isRecord(value)) return value;
  return {
    ...value,
    ...(Object.prototype.hasOwnProperty.call(value, 'from')
      ? { from: snapshotNeuTableDateValue(value['from']) }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(value, 'to')
      ? { to: snapshotNeuTableDateValue(value['to']) }
      : {}),
  };
}

export function buildNeuTableFilterState<T>(
  column: FilterableColumn<T>,
  filterValue: unknown,
  modeOverride?: NeuTableFilterMatchMode,
): NeuTableFilterState | null {
  if (isNeuTableFilterValueEmpty(filterValue)) return null;
  const config = column.filterConfig;
  if (!config) return null;

  if (config.kind === 'custom') {
    return { kind: 'custom', mode: 'custom', value: filterValue, localOnly: true };
  }

  if (config.kind === 'number') {
    const mode = resolveNumberFilterMode(modeOverride, config.mode);
    const value = mode === 'between' ? numberFilterRange(filterValue) : numericValue(filterValue);
    return value === null || value === undefined
      ? null
      : { kind: 'number', mode, value };
  }
  if (config.kind === 'date') {
    const mode = resolveDateFilterMode(modeOverride, config.mode);
    const precision = config.precision ?? 'date-only';
    const value =
      mode === 'between'
        ? dateRangeValue(filterValue, precision)
        : normalizeNeuTableDatePoint(filterValue, precision);
    return value === null || value === undefined
      ? null
      : { kind: 'date', mode, value };
  }
  if (config.kind === 'boolean') {
    if (filterValue !== true && filterValue !== false) return null;
    return { kind: 'boolean', mode: filterValue ? 'true' : 'false', value: filterValue };
  }
  if (config.kind === 'select') {
    return { kind: 'select', mode: 'equals', value: filterValue };
  }
  if (config.kind === 'multiSelect') {
    if (!Array.isArray(filterValue)) return null;
    return {
      kind: 'multiSelect',
      mode: 'in',
      value: filterValue,
    };
  }
  const mode = resolveTextFilterMode(modeOverride, config.mode);
  return { kind: 'text', mode, value: String(filterValue) };
}

export function resolveNeuTableFilterMatchMode<T>(
  column: FilterableColumn<T>,
  modeOverride?: NeuTableFilterMatchMode,
): NeuTableFilterMatchMode | undefined {
  const config = column.filterConfig;
  if (!config || config.kind === 'boolean' || config.kind === 'custom') return undefined;
  switch (config.kind) {
    case 'number':
      return resolveNumberFilterMode(modeOverride, config.mode);
    case 'date':
      return resolveDateFilterMode(modeOverride, config.mode);
    case 'select':
      return 'equals';
    case 'multiSelect':
      return 'in';
    case 'text':
      return resolveTextFilterMode(modeOverride, config.mode);
  }
}

export function resolveNeuTableFilterAccessor<T>(row: T, column: FilterableColumn<T>): unknown {
  return filterAccessor(row, column, column.filterConfig);
}
