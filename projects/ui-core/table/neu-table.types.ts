import { TemplateRef } from '@angular/core';

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
export interface NeuTableColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  cell?: (row: T) => string;
  cellTemplate?: TemplateRef<{ $implicit: T; row: T; column: NeuTableColumn<T> }>;
  cellClass?: string;
  sortable?: boolean;
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
  // Frozen
  frozen?: 'left' | 'right';
  // Header template
  headerTemplate?: TemplateRef<{ $implicit: NeuTableColumn<T> }>;
}
