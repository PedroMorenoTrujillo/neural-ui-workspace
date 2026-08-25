import { TemplateRef } from '@angular/core';
import type {
  NeuOptionDisabledAccessor,
  NeuOptionLabelAccessor,
  NeuOptionValue,
  NeuOptionValueAccessor,
} from '@neural-ui/core/option-api';

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
export type NeuTableColumnKey<T> = [keyof T] extends [never] ? string : Extract<keyof T, string>;

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

// ── Selection ───────────────────────────────────────────────────────────
export type NeuTableSelectionMode = 'none' | 'single' | 'multiple';

/** Rows affected by the header checkbox. Server mode always means loaded rows. */
export type NeuTableSelectAllScope = 'page' | 'filtered';

export type NeuTableSelectionSource = 'row' | 'checkbox' | 'radio' | 'header' | 'api';

/** Consumer-facing controlled value. Canonical Table state continues to store keys. */
export type NeuTableSelection<T> = T | readonly T[] | null;

export interface NeuTableRowSelectionEvent<T = Record<string, unknown>> {
  row: T;
  key: unknown;
  /** Index in the current data input, or the logical index in sparse virtual mode. */
  index: number;
  source: Exclude<NeuTableSelectionSource, 'header'>;
  /** Proposed whole selection after this action. */
  selection: readonly T[];
}

export interface NeuTableSelectAllChangeEvent<T = Record<string, unknown>> {
  checked: boolean;
  scope: NeuTableSelectAllScope;
  /** Selectable rows in the active scope, not every row in the Table. */
  rows: readonly T[];
  keys: readonly unknown[];
  /** Proposed whole selection after this action. */
  selection: readonly T[];
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

export type NeuTableEditMode = 'cell' | 'row';

export interface NeuTableEditingCellState {
  readonly rowKey: unknown;
  readonly columnKey: string;
}

export type NeuTableEditValidationResult =
  | boolean
  | string
  | Readonly<{ valid: boolean; message?: string }>;

export interface NeuTableCellEditLifecycleEvent<
  T = Record<string, unknown>,
> extends NeuTableCellEditEvent<T> {
  readonly rowKey: unknown;
  readonly rowIndex: number;
}

export interface NeuTableEditValidationEvent<T = Record<string, unknown>> {
  readonly mode: NeuTableEditMode;
  readonly row: T;
  readonly rowKey: unknown;
  readonly rowIndex: number;
  readonly column?: NeuTableColumn<T>;
  readonly value?: unknown;
  readonly draft?: Readonly<T>;
  readonly message: string;
}

export interface NeuTableRowEditEvent<T = Record<string, unknown>> {
  readonly row: T;
  readonly draft: Readonly<T>;
  readonly rowKey: unknown;
  readonly rowIndex: number;
  readonly editingRowKeys: readonly unknown[];
}

export interface NeuTableCellEditorContext<
  T extends object = NeuTableRow,
  K extends string = string,
> {
  readonly $implicit: unknown;
  readonly row: T;
  readonly rowIndex: number;
  readonly logicalIndex: number;
  readonly column: NeuTableColumn<T, K>;
  readonly value: unknown;
  readonly previousValue: unknown;
  readonly invalid: boolean;
  readonly error: string | null;
  readonly setValue: (value: unknown) => void;
  readonly save: () => boolean;
  readonly cancel: () => void;
}

export interface NeuTableCellViewContext<
  T extends object = NeuTableRow,
  K extends string = string,
> {
  readonly $implicit: T;
  readonly row: T;
  readonly rowIndex: number;
  readonly logicalIndex: number;
  readonly column: NeuTableColumn<T, K>;
  readonly value: unknown;
  readonly editing: boolean;
  readonly startEdit: () => void;
}

export interface NeuTableRowEditContext<T extends object = NeuTableRow> {
  readonly $implicit: T;
  readonly row: T;
  readonly draft: Readonly<T>;
  readonly rowIndex: number;
  readonly logicalIndex: number;
  readonly editing: boolean;
  readonly invalid: boolean;
  readonly error: string | null;
  readonly setValue: (columnKey: string, value: unknown) => void;
  readonly init: () => void;
  readonly save: () => boolean;
  readonly cancel: () => void;
}

export type NeuTableRowGroupMode = 'subheader' | 'rowspan';
export type NeuTableGroupSortOrder = 1 | -1;

export interface NeuTableGroup<T extends object = NeuTableRow> {
  readonly key: unknown;
  readonly label: string;
  readonly rows: readonly T[];
  readonly count: number;
  readonly groupIndex: number;
  readonly expanded: boolean;
}

export interface NeuTableGroupExpansionEvent<T extends object = NeuTableRow> {
  readonly group: NeuTableGroup<T>;
  readonly expandedGroupKeys: readonly unknown[];
}

export interface NeuTableGroupTemplateContext<
  T extends object = NeuTableRow,
> extends NeuTableGroup<T> {
  readonly $implicit: NeuTableGroup<T>;
  readonly toggle: () => void;
}

export interface NeuTableStructuralContext<T extends object = NeuTableRow> {
  readonly $implicit: readonly NeuTableColumn<T>[];
  readonly columns: readonly NeuTableColumn<T>[];
  readonly colspan: number;
}

/** Wrapper-owned row semantics remain active while this template owns the row cells. */
export interface NeuTableBodyContext<T extends object = NeuTableRow> {
  readonly $implicit: T;
  readonly row: T;
  readonly rowIndex: number;
  readonly logicalIndex: number;
  readonly columns: readonly NeuTableColumn<T>[];
  /** Group metadata for grouped rows; null for an ungrouped body. */
  readonly group: NeuTableGroup<T> | null;
  readonly selected: boolean;
  readonly expanded: boolean;
  readonly editing: boolean;
  readonly toggleSelection: () => void;
  readonly toggleExpansion: () => void;
  readonly edit: NeuTableRowEditContext<T>;
}

export interface NeuTablePaginatorTemplateContext {
  readonly $implicit: number;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly first: number;
  readonly rows: number;
  readonly totalRecords: number;
}

// ── Expansion / persisted state ──────────────────────────────────────────

/** JSON-stable row identity accepted by automatic Table persistence. */
export type NeuTableStateKey = string | number | boolean | null;

export interface NeuTableRowExpansionEvent<T = Record<string, unknown>> {
  row: T;
  key: unknown;
  /** Immutable whole-state proposal after the row action. */
  expandedRowKeys: readonly unknown[];
}

export interface NeuTablePersistedFilterConstraint {
  mode?: NeuTableFilterMatchMode;
  value: unknown;
}

export interface NeuTablePersistedColumnFilter {
  operator: 'and' | 'or';
  constraints: readonly NeuTablePersistedFilterConstraint[];
}

export interface NeuTableStateOmissions {
  /** Filters containing functions, symbols, cycles or other non-JSON values. */
  filterKeys: readonly string[];
  selectionKeyCount: number;
  expandedRowKeyCount: number;
  expandedGroupKeyCount?: number;
}

/**
 * Immutable, row-data-free state used by save/restore events and storage.
 * Version 1 intentionally stores selection and expansion as stable keys only.
 */
export interface NeuTableStateSnapshot {
  version: 1;
  page: number;
  pageSize: number;
  search: string;
  sort: NeuTableSortEntry | null;
  sortEntries: readonly NeuTableSortEntry[];
  filters: Readonly<Record<string, NeuTablePersistedColumnFilter>>;
  selectionKeys: readonly NeuTableStateKey[];
  expandedRowKeys: readonly NeuTableStateKey[];
  /** Separate from row expansion so group identity can never collide with row identity. */
  expandedGroupKeys?: readonly NeuTableStateKey[];
  layout: NeuTableLayout;
  /** Truthful accounting for canonical values that automatic JSON persistence omitted. */
  omissions: NeuTableStateOmissions;
}

export type NeuTableStateStorage = 'local' | 'session';

// ── Typed filtering ───────────────────────────────────────────────────────

export type NeuTableFilterKind =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multiSelect'
  | 'custom';

export type NeuTableAdvancedFilterMode = 'off' | 'menu';

export interface NeuTableAdvancedFilterTexts {
  openFilter: string;
  filterTitle: string;
  closeFilter: string;
  operator?: string;
  matchAll?: string;
  matchAny?: string;
  matchMode: string;
  value: string;
  from: string;
  to: string;
  all: string;
  yes: string;
  no: string;
  clear: string;
  cancel: string;
  apply: string;
  filterActive: string;
  addRule?: string;
  removeRule?: string;
  rule?: string;
  ruleActive?: string;
  rulesActive?: string;
  multipleRulesActive: string;
  contains: string;
  startsWith: string;
  endsWith: string;
  equals: string;
  notEquals: string;
  notContains: string;
  lt: string;
  lte: string;
  gt: string;
  gte: string;
  between: string;
  is: string;
  isNot: string;
  before: string;
  after: string;
}

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
export type NeuTableFilterMode = NeuTableFilterMatchMode | NeuTableBooleanFilterMode | 'custom';

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

export interface NeuTableFilterServerSerializerContext {
  columnKey: string;
  kind: NeuTableFilterKind;
  mode: NeuTableFilterMode;
}

/**
 * Converts an applied client filter value into backend metadata. The original
 * value remains in the query snapshot so controlled queries can echo it
 * without losing Select/MultiSelect object identity.
 */
export type NeuTableFilterServerSerializer = (
  value: unknown,
  context: NeuTableFilterServerSerializerContext,
) => unknown;

type NeuTableBivariantOptionAccessor<O, R> = {
  read(option: O): R;
}['read'];

/**
 * The default column-level option model is intentionally broad so existing
 * `NeuTableColumn<T>[]` declarations can use primitive options and property
 * keys. Consumers that need option-function parameter checking can declare a
 * `NeuTableSelectFilterConfig<T, O, V>` or `NeuTableMultiSelectFilterConfig<T, O, V>`.
 */
type NeuTableOptionConfigAccessor<O, R> = unknown extends O
  ? PropertyKey | NeuTableBivariantOptionAccessor<O, R>
  : NeuOptionLabelAccessor<O>;

type NeuTableOptionValueConfigAccessor<O, V> = unknown extends O
  ? PropertyKey | NeuTableBivariantOptionAccessor<O, V>
  : NeuOptionValueAccessor<O, V>;

type NeuTableOptionDisabledConfigAccessor<O> = unknown extends O
  ? PropertyKey | NeuTableBivariantOptionAccessor<O, boolean>
  : NeuOptionDisabledAccessor<O>;

export interface NeuTableFilterBaseConfig<T, K extends NeuTableFilterKind, M extends string, V> {
  kind: K;
  mode?: M;
  accessor?: NeuTableFilterAccessor<T, V>;
  /** Optional backend projection for custom or opaque option values. */
  serverSerializer?: NeuTableFilterServerSerializer;
}

export interface NeuTableTextFilterConfig<T = NeuTableRow> extends NeuTableFilterBaseConfig<
  T,
  'text',
  NeuTableTextFilterMode,
  string
> {}

export interface NeuTableNumberFilterConfig<T = NeuTableRow> extends NeuTableFilterBaseConfig<
  T,
  'number',
  NeuTableNumberFilterMode,
  number | null
> {}

export interface NeuTableDateFilterConfig<T = NeuTableRow> extends NeuTableFilterBaseConfig<
  T,
  'date',
  NeuTableDateFilterMode,
  Date | string | null | undefined
> {
  precision?: NeuTableDatePrecision;
}

export interface NeuTableBooleanFilterConfig<T = NeuTableRow> extends Omit<
  NeuTableFilterBaseConfig<T, 'boolean', NeuTableBooleanFilterMode, boolean | null | undefined>,
  'mode'
> {}

export interface NeuTableSelectFilterConfig<
  T = NeuTableRow,
  O = unknown,
  V = NeuOptionValue<O>,
> extends NeuTableFilterBaseConfig<T, 'select', 'equals', V> {
  options?: readonly O[];
  optionLabel?: NeuTableOptionConfigAccessor<O, string> | null;
  optionValue?: NeuTableOptionValueConfigAccessor<O, V> | null;
  optionDisabled?: NeuTableOptionDisabledConfigAccessor<O> | null;
  searchable?: boolean;
  virtualScroll?: boolean;
  virtualScrollVisibleItems?: number;
}

export interface NeuTableMultiSelectFilterConfig<
  T = NeuTableRow,
  O = unknown,
  V = NeuOptionValue<O>,
> extends NeuTableFilterBaseConfig<T, 'multiSelect', NeuTableMultiSelectFilterMode, V> {
  options?: readonly O[];
  optionLabel?: NeuTableOptionConfigAccessor<O, string> | null;
  optionValue?: NeuTableOptionValueConfigAccessor<O, V> | null;
  optionDisabled?: NeuTableOptionDisabledConfigAccessor<O> | null;
  searchable?: boolean;
  virtualScroll?: boolean;
  virtualScrollVisibleItems?: number;
}

/** Custom predicates remain local-only and intentionally use unknown values in P2.2B. */
export interface NeuTableCustomFilterConfig<T = NeuTableRow> extends NeuTableFilterBaseConfig<
  T,
  'custom',
  'custom',
  unknown
> {
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

/** Public current/controlled sort shape. Empty means no active sort. */
export type NeuTableSortState = readonly NeuTableSortEntry[];

/** A computed global-search value. `serverField` is optional backend metadata. */
export interface NeuTableGlobalFilterAccessor<T = NeuTableRow> {
  accessor: NeuTableFilterAccessor<T>;
  /** Stable backend field identifier; the accessor function itself is never serialized. */
  serverField?: string;
}

/** Direct row fields stay typed; computed values opt into an accessor. */
export type NeuTableGlobalFilterField<T = NeuTableRow> =
  | NeuTableColumnKey<T>
  | NeuTableGlobalFilterAccessor<T>;

// ── Canonical query state ────────────────────────────────────────────────

export type NeuTableQueryFilterConstraint =
  | (Readonly<NeuTableTextFilterState> & { readonly serverValue?: unknown })
  | (Readonly<NeuTableNumberFilterState> & { readonly serverValue?: unknown })
  | (Readonly<NeuTableDateFilterState> & { readonly serverValue?: unknown })
  | (Readonly<NeuTableBooleanFilterState> & { readonly serverValue?: unknown })
  | (Readonly<NeuTableSelectFilterState> & { readonly serverValue?: unknown })
  | (Readonly<NeuTableMultiSelectFilterState> & { readonly serverValue?: unknown })
  | {
      readonly kind: 'custom';
      readonly mode: 'custom';
      readonly value: unknown;
      readonly serverValue?: unknown;
    };

/** Exact backend reproducibility of one filter or the whole query. */
export type NeuTableQuerySerializability = 'serializable' | 'requires-consumer' | 'local-only';

export interface NeuTableQueryColumnFilter {
  readonly operator: 'and' | 'or';
  readonly constraints: readonly NeuTableQueryFilterConstraint[];
  readonly serializability: NeuTableQuerySerializability;
}

export interface NeuTableQuerySerializationStatus {
  readonly status: NeuTableQuerySerializability;
  readonly localOnlyFilters: readonly string[];
  readonly requiresConsumerSerializationFilters: readonly string[];
  readonly localOnlyGlobalFilterFields: boolean;
}

/**
 * Server/query-oriented Table state. Selection, expansion, layout, keyboard
 * focus and filter drafts deliberately remain outside this contract.
 */
export interface NeuTableQueryState {
  /** Neural's historical page contract is 1-based. */
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  /** Present only in single-sort mode; null means unsorted or multisort. */
  readonly sort: Readonly<NeuTableSortEntry> | null;
  /** Complete ordered entries in multisort mode; empty in single-sort mode. */
  readonly sortEntries: readonly Readonly<NeuTableSortEntry>[];
  /** Stable backend field identifiers used by global search. */
  readonly globalFilterFields: readonly string[];
  /** Complete applied column filters, including ordered constraints and AND/OR. */
  readonly filters: Readonly<Record<string, NeuTableQueryColumnFilter>>;
  readonly serialization: NeuTableQuerySerializationStatus;
}

// ── Sparse virtual data ───────────────────────────────────────────

/**
 * Half-open logical ranges. `first/end` is the overscan-aware requested
 * window; `visibleFirst/visibleEnd` is the viewport-only window.
 */
export interface NeuTableVirtualRange {
  readonly first: number;
  readonly end: number;
  readonly visibleFirst: number;
  readonly visibleEnd: number;
}

/** Context for a consumer-owned sparse placeholder. No fake row value is exposed. */
export interface NeuTableLazyPlaceholderContext<T extends object = NeuTableRow> {
  /** Logical index, also available as the implicit template value. */
  readonly $implicit: number;
  readonly logicalIndex: number;
  readonly columns: readonly NeuTableColumn<T>[];
  readonly colspan: number;
}

export type NeuTableLazyRequestReason =
  | 'initial'
  | 'scroll'
  | 'query'
  | 'total-change'
  | 'viewport-change'
  | 'programmatic';

/** Atomic server fetch proposal for sparse virtual mode. */
export interface NeuTableLazyRequest {
  /** Monotonic per Table instance; consumers use this to discard stale responses. */
  readonly requestId: number;
  readonly reason: NeuTableLazyRequestReason;
  readonly query: NeuTableQueryState;
  readonly range: NeuTableVirtualRange;
}

// ── Server state ──────────────────────────────────────────────────────────
export interface NeuTableServerState {
  page: number;
  pageSize: number;
  search: string;
  /**
   * Legacy single-sort projection. Empty string plus `asc` represents no active single sort.
   * Prefer `sort` for an explicit nullable state.
   */
  sortKey: string;
  /** Legacy direction paired with `sortKey`. Prefer `sort` for new integrations. */
  sortDir: 'asc' | 'desc';
  /** Explicit single-sort projection. Null in unsorted and multisort modes. */
  sort?: NeuTableSortEntry | null;
  sortEntries: NeuTableSortEntry[];
  /** Serializable configured global fields. Omitted when the default all-column policy applies. */
  globalFilterFields?: string[];
  /** True when at least one configured global field is an accessor without backend metadata. */
  localOnlyGlobalFilterFields?: boolean;
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
export interface NeuTableColumn<
  T = Record<string, unknown>,
  K extends string = NeuTableColumnKey<T>,
> {
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
  /** Value used by built-in sorting, independent of display rendering. */
  sortAccessor?: (row: T) => unknown;
  /** Ascending/base row comparator; Table applies the active direction exactly once. */
  sortComparator?: (a: T, b: T) => number;
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
