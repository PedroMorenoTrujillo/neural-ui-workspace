import { TemplateRef } from '@angular/core';

/**
 * Legacy row shape used by the unparameterized public API. Parameterized
 * tables use their concrete domain model instead.
 */
export type NeuTableRow = Record<string, unknown>;

/**
 * Default direct keys are Extract<keyof T, string>, so concrete row models get
 * completion and type checking. The unparameterized legacy API continues to
 * accept strings, while computed, action and path-like typed columns opt into
 * NeuTableColumn<T, string> explicitly.
 */
export type NeuTableColumnKey<T> = [keyof T] extends [never]
  ? string
  : Extract<keyof T, string>;

export type NeuTableRowKey<T> = NeuTableColumnKey<T>;

// ── Badge ─────────────────────────────────────────────────────────────────
export type NeuTableBadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'default';

export interface NeuTableBadgeConfig {
  /** Etiqueta visible. Si se omite, se muestra el valor bruto. */
  label?: string;
  variant: NeuTableBadgeVariant;
}

// ── Actions ───────────────────────────────────────────────────────────────
export interface NeuTableAction<T = Record<string, unknown>> {
  key: string;
  label: string;
  icon: string;
  variant?: 'ghost' | 'primary' | 'danger';
  show?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  /** Texto de confirmación inline. Requiere segunda pulsación. */
  confirm?: string;
}

export interface NeuTableActionEvent<T = Record<string, unknown>> {
  action: NeuTableAction<T>;
  row: T;
}

export interface NeuTableSelectionAction<T = Record<string, unknown>> {
  key: string;
  label: string;
  icon: string;
  variant?: 'ghost' | 'primary' | 'danger';
  show?: (rows: T[]) => boolean;
  disabled?: (rows: T[]) => boolean;
  confirm?: string;
}

export interface NeuTableSelectionActionEvent<T = Record<string, unknown>> {
  action: NeuTableSelectionAction<T>;
  rows: T[];
}

// ── Layout / Editing ───────────────────────────────────────────────────────
export interface NeuTableLayout {
  columnOrder: string[];
  hiddenColumns: string[];
  columnWidths: Record<string, number>;
}

export interface NeuTableColumnReorderEvent {
  previousIndex: number;
  currentIndex: number;
  columns: string[];
}

export interface NeuTableCellEditEvent<T = Record<string, unknown>> {
  row: T;
  column: NeuTableColumn<T>;
  value: unknown;
  previousValue: unknown;
}

// ── Typed filtering ───────────────────────────────────────────────────────

export type NeuTableFilterKind =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multiSelect'
  | 'custom';

export type NeuTableTextFilterMode =
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'equals'
  | 'notEquals'
  | 'notContains';

export type NeuTableNumberFilterMode =
  | 'equals'
  | 'notEquals'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'between';

export type NeuTableDateFilterMode = 'is' | 'isNot' | 'before' | 'after' | 'between';

export type NeuTableBooleanFilterMode = 'true' | 'false' | 'all';

export type NeuTableSelectFilterMode = 'equals';

export type NeuTableMultiSelectFilterMode = 'in';

/**
 * Match modes configurable by consumers. Boolean and custom filtering derive
 * their behavior from the filter value/configuration instead of this union.
 */
export type NeuTableFilterMatchMode =
  | NeuTableTextFilterMode
  | NeuTableNumberFilterMode
  | NeuTableDateFilterMode
  | NeuTableSelectFilterMode
  | NeuTableMultiSelectFilterMode;

/** Internal/public compatibility union for all typed filter state modes. */
export type NeuTableFilterMode =
  | NeuTableFilterMatchMode
  | NeuTableBooleanFilterMode
  | 'custom';

export type NeuTableDatePrecision = 'date-only' | 'instant';

/** Canonical date point used by the typed filter state. */
export interface NeuTableDatePoint {
  precision: NeuTableDatePrecision;
  value: string;
}

export interface NeuTableDateRangeValue {
  from: NeuTableDatePoint | null;
  to: NeuTableDatePoint | null;
}

export interface NeuTableNumberRangeValue {
  from: number | null;
  to: number | null;
}

export type NeuTableFilterAccessor<T, V = unknown> = (row: T) => V;

export interface NeuTableFilterBaseConfig<T, K extends NeuTableFilterKind, M extends string, V> {
  kind: K;
  mode?: M;
  accessor?: NeuTableFilterAccessor<T, V>;
}

export interface NeuTableTextFilterConfig<T = NeuTableRow>
  extends NeuTableFilterBaseConfig<T, 'text', NeuTableTextFilterMode, string> {}

export interface NeuTableNumberFilterConfig<T = NeuTableRow>
  extends NeuTableFilterBaseConfig<T, 'number', NeuTableNumberFilterMode, number | null> {}

export interface NeuTableDateFilterConfig<T = NeuTableRow>
  extends NeuTableFilterBaseConfig<
    T,
    'date',
    NeuTableDateFilterMode,
    Date | string | null | undefined
  > {
  precision?: NeuTableDatePrecision;
}

export interface NeuTableBooleanFilterConfig<T = NeuTableRow>
  extends Omit<
    NeuTableFilterBaseConfig<T, 'boolean', NeuTableBooleanFilterMode, boolean | null | undefined>,
    'mode'
  > {}

export interface NeuTableSelectFilterConfig<T = NeuTableRow>
  extends NeuTableFilterBaseConfig<T, 'select', 'equals', unknown> {}

export interface NeuTableMultiSelectFilterConfig<T = NeuTableRow>
  extends NeuTableFilterBaseConfig<
    T,
    'multiSelect',
    NeuTableMultiSelectFilterMode,
    readonly unknown[]
  > {}

/** Custom predicates remain local-only and intentionally use unknown values in P2.2B. */
export interface NeuTableCustomFilterConfig<T = NeuTableRow>
  extends NeuTableFilterBaseConfig<T, 'custom', 'custom', unknown> {
  predicate: (value: unknown, filterValue: unknown, row: T) => boolean;
}

export type NeuTableFilterConfig<T = NeuTableRow> =
  | NeuTableTextFilterConfig<T>
  | NeuTableNumberFilterConfig<T>
  | NeuTableDateFilterConfig<T>
  | NeuTableBooleanFilterConfig<T>
  | NeuTableSelectFilterConfig<T>
  | NeuTableMultiSelectFilterConfig<T>
  | NeuTableCustomFilterConfig<T>;

export interface NeuTableTextFilterState {
  kind: 'text';
  mode: NeuTableTextFilterMode;
  value: string;
}

export interface NeuTableNumberFilterState {
  kind: 'number';
  mode: NeuTableNumberFilterMode;
  value: number | NeuTableNumberRangeValue | null;
}

export interface NeuTableDateFilterState {
  kind: 'date';
  mode: NeuTableDateFilterMode;
  value: NeuTableDatePoint | NeuTableDateRangeValue | null;
}

export interface NeuTableBooleanFilterState {
  kind: 'boolean';
  mode: NeuTableBooleanFilterMode;
  value: boolean | null;
}

export interface NeuTableSelectFilterState {
  kind: 'select';
  mode: 'equals';
  value: unknown;
}

export interface NeuTableMultiSelectFilterState {
  kind: 'multiSelect';
  mode: 'in';
  value: readonly unknown[];
}

export interface NeuTableCustomFilterState {
  kind: 'custom';
  mode: 'custom';
  value: unknown;
  localOnly: true;
}

export type NeuTableFilterState =
  | NeuTableTextFilterState
  | NeuTableNumberFilterState
  | NeuTableDateFilterState
  | NeuTableBooleanFilterState
  | NeuTableSelectFilterState
  | NeuTableMultiSelectFilterState
  | NeuTableCustomFilterState;

// ── Sort ──────────────────────────────────────────────────────────────────
export interface NeuTableSortEntry {
  key: string;
  dir: 'asc' | 'desc';
}

// ── Server state ──────────────────────────────────────────────────────────
export interface NeuTableServerState {
  page: number;
  pageSize: number;
  search: string;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  sortEntries: NeuTableSortEntry[];
  columnFilters: Record<string, unknown>;
  /** Typed filter state. Legacy columnFilters remains unchanged. */
  typedColumnFilters?: Record<string, NeuTableFilterState>;
  /** Known local-only predicates. Full serialization is a later contract. */
  localOnlyFilters?: string[];
}

// ── Cell type ─────────────────────────────────────────────────────────────
export type NeuTableCellType =
  | 'text'
  | 'badge'
  | 'date'
  | 'number'
  | 'currency'
  | 'link'
  | 'actions';

// ── Column ────────────────────────────────────────────────────────────────
export interface NeuTableColumn<T = Record<string, unknown>, K extends string = NeuTableColumnKey<T>> {
  /** Direct property key for typed columns; legacy columns may use any string. */
  key: K;
  header: string;
  width?: string;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  cell?: (row: T) => string;
  cellTemplate?: TemplateRef<{ $implicit: T; row: T; column: NeuTableColumn<T, K> }>;
  cellClass?: string;
  sortable?: boolean;
  resizable?: boolean;
  type?: NeuTableCellType;
  // Badge
  badgeMap?: Record<string, NeuTableBadgeConfig>;
  // Date
  dateFormat?: Intl.DateTimeFormatOptions;
  locale?: string;
  // Number / Currency
  numberFormat?: Intl.NumberFormatOptions;
  currencyCode?: string;
  // Link
  linkHref?: (row: T) => string;
  linkTarget?: '_blank' | '_self';
  // Actions
  actions?: NeuTableAction<T>[];
  // Column filter
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'number-range' | 'date';
  filterOptions?: string[];
  /** Additive typed filter configuration. Legacy filterType remains supported. */
  filterConfig?: NeuTableFilterConfig<T>;
  // Inline edit
  editable?: boolean;
  editor?: 'text' | 'number' | 'select' | 'date';
  editOptions?: string[];
  // Frozen
  frozen?: 'left' | 'right';
  // Header template
  headerTemplate?: TemplateRef<{ $implicit: NeuTableColumn<T, K> }>;
}
