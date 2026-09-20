/**
 * Candidate public contracts for NeuTable 2.
 *
 * N2-011A keeps this file outside the product entrypoint. It is compiled by the
 * contract fixtures and becomes public only when the migration reaches the
 * atomic entrypoint switch.
 */

import type { Signal } from '@angular/core';

export type NeuTableKey = string | number;
export type NeuTableDataMode = 'client' | 'remote';
export type NeuSortDirection = 'asc' | 'desc';
export type NeuFilterOperator = 'and' | 'or';

export interface NeuSortEntry<F extends string> {
  readonly field: F;
  readonly direction: NeuSortDirection;
}

export interface NeuFilterConstraint<F extends string> {
  readonly kind: 'condition';
  readonly field: F;
  readonly rule: string;
  readonly value: unknown;
}

export interface NeuFilterGroup<F extends string> {
  readonly kind: 'group';
  readonly operator: NeuFilterOperator;
  readonly children: readonly NeuFilterExpression<F>[];
}

export type NeuFilterExpression<F extends string> = NeuFilterConstraint<F> | NeuFilterGroup<F>;

export interface NeuTableQuery<F extends string> {
  /** One-based. */
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly sort: readonly NeuSortEntry<F>[];
  readonly filters: NeuFilterExpression<F> | null;
}

export interface NeuTableRange {
  /** Inclusive. */
  readonly start: number;
  /** Exclusive. */
  readonly end: number;
}

export interface NeuTableRangeChange {
  readonly visible: NeuTableRange;
  readonly render: NeuTableRange;
  readonly reason: 'scroll' | 'resize' | 'programmatic' | 'query';
}

export interface NeuTableMetadata {
  readonly totalItems: number | null;
  readonly loading: boolean;
  readonly error: unknown | null;
  /** Revision of the applied query represented by data. */
  readonly queryRevision: number;
  /** Latest request represented by data, or null for initial client data. */
  readonly appliedRequestId: number | null;
  /** Logical position of data for remote virtualization. */
  readonly dataRange?: NeuTableRange;
}

export type NeuTableDataRequestReason = 'initial' | 'query' | 'viewport' | 'retry';

export interface NeuTableDataRequest<F extends string> {
  readonly requestId: number;
  readonly queryRevision: number;
  readonly query: NeuTableQuery<F>;
  readonly reason: NeuTableDataRequestReason;
  readonly range?: NeuTableRange;
}

export type NeuRowKey<T, K extends NeuTableKey> = (row: T) => K;
export type NeuRowTrackBy<T> = (index: number, row: T) => unknown;
export type NeuTableValueAccessor<T> = (row: T) => unknown;

export interface NeuTableSortColumn<T, F extends string> {
  readonly field: F;
  readonly value?: NeuTableValueAccessor<T>;
  readonly compare?: (left: T, right: T) => number;
}

export interface NeuTableFilterColumn<T, F extends string> {
  readonly field: F;
  readonly value?: NeuTableValueAccessor<T>;
  readonly rules: readonly string[];
  readonly defaultRule: string;
}

export interface NeuTableEditColumn<T, F extends string> {
  readonly field: F;
  readonly read?: NeuTableValueAccessor<T>;
  /** Produces a consumer-owned replacement; Table never mutates T. */
  readonly write?: (row: T, value: unknown) => T;
}

export interface NeuTableColumn<T, F extends string> {
  readonly id: string;
  readonly header: string;
  readonly field?: F;
  readonly value?: NeuTableValueAccessor<T>;
  readonly sort?: NeuTableSortColumn<T, F>;
  readonly filter?: NeuTableFilterColumn<T, F>;
  readonly edit?: NeuTableEditColumn<T, F>;
  readonly width?: string;
  readonly minWidth?: string;
  readonly maxWidth?: string;
  readonly align?: 'start' | 'center' | 'end';
}

export interface NeuTableSortOptions {
  readonly mode: 'single' | 'multiple';
  readonly removable: boolean;
  readonly defaultDirection: NeuSortDirection;
  readonly resetPageOnChange: boolean;
}

export type NeuTableFilterSurface = 'row' | 'menu' | 'builder';

export interface NeuTableFilterPredicateContext<T, F extends string> {
  readonly row: T;
  readonly field: F;
  readonly candidate: unknown;
  readonly filterValue: unknown;
}

export type NeuTableFilterPredicate<T, F extends string> = (
  context: NeuTableFilterPredicateContext<T, F>,
) => boolean;

export interface NeuTableFilterOptions<T, F extends string> {
  readonly surfaces: readonly NeuTableFilterSurface[];
  readonly globalFields: readonly F[];
  readonly predicates: Readonly<Record<string, NeuTableFilterPredicate<T, F>>>;
  readonly debounceMs: number;
  readonly commit: 'immediate' | 'explicit';
  readonly equals?: (left: unknown, right: unknown) => boolean;
}

export interface NeuTablePaginationOptions {
  readonly enabled: boolean;
  readonly pageSizeOptions: readonly number[];
  readonly position: 'top' | 'bottom' | 'both';
  readonly report: 'none' | 'summary' | 'range';
  readonly showPageJump: boolean;
}

export interface NeuTableSelectionScope<F extends string> {
  readonly search: string;
  readonly filters: NeuFilterExpression<F> | null;
  readonly globalFields: readonly F[];
}

export type NeuTableSelection<K extends NeuTableKey, F extends string> =
  | {
      readonly kind: 'keys';
      readonly keys: readonly K[];
    }
  | {
      /** Select every row matching a frozen query scope, including unloaded rows. */
      readonly kind: 'all-matching';
      readonly scope: NeuTableSelectionScope<F>;
      readonly excludedKeys: readonly K[];
    };

export type NeuTableSelectionOptions<T> =
  | { readonly mode: 'none' }
  | {
      readonly mode: 'single';
      readonly indicator: 'none' | 'radio';
      readonly selectOnRowClick: boolean;
      readonly allowClear: boolean;
      readonly isRowDisabled?: (row: T) => boolean;
    }
  | {
      readonly mode: 'multiple';
      readonly indicator: 'none' | 'checkbox';
      readonly selectOnRowClick: boolean;
      readonly modifier: 'replace' | 'platform' | 'toggle';
      readonly range: boolean;
      readonly toggleAllScope: 'rendered' | 'page' | 'loaded' | 'all-matching';
      readonly isRowDisabled?: (row: T) => boolean;
    };

export interface NeuTableSelectionChange<T, K extends NeuTableKey, F extends string> {
  readonly next: NeuTableSelection<K, F>;
  readonly source: 'row' | 'radio' | 'checkbox' | 'keyboard' | 'toggle-all';
  readonly addedKeys: readonly K[];
  readonly removedKeys: readonly K[];
  /** Only loaded rows are present; keys remain authoritative. */
  readonly loadedRows: readonly T[];
}

export type NeuTableVirtualizationOptions =
  | { readonly enabled: false }
  | {
      readonly enabled: true;
      readonly itemSize: number;
      readonly overscan: number;
      /** Aligns remote request windows; absent in client mode. */
      readonly requestStep?: number;
    };

export interface NeuTableLayoutState {
  readonly order: readonly string[];
  readonly hidden: readonly string[];
  readonly widths: Readonly<Record<string, string>>;
  readonly pinnedStart: readonly string[];
  readonly pinnedEnd: readonly string[];
}

export interface NeuTableLayoutChange {
  readonly next: NeuTableLayoutState;
  readonly source: 'resize' | 'reorder' | 'visibility' | 'pin';
}

export interface NeuTableRowOptions<T, K extends NeuTableKey> {
  readonly className?: (row: T) => string | readonly string[] | null;
  readonly isDisabled?: (row: T) => boolean;
  readonly pin?: (row: T, key: K) => 'start' | 'end' | null;
  readonly reorderable: boolean;
}

export interface NeuTableAppearance {
  readonly density: 'compact' | 'normal' | 'relaxed';
  readonly borders: 'none' | 'rows' | 'cells';
  readonly striped: boolean;
  readonly stickyHeader: boolean;
  readonly responsive: 'contained-scroll' | 'stacked';
}

export interface NeuTableLabels {
  readonly ariaLabel: string;
  readonly empty: string;
  readonly loading: string;
  readonly error: string;
  readonly retry: string;
  readonly selection: string;
  readonly pagination: string;
}

export interface NeuTableInteractionOptions {
  readonly navigation: 'native' | 'rows' | 'cells';
  readonly wrapFocus: boolean;
  readonly announceChanges: boolean;
}

export type NeuTableEditState<K extends NeuTableKey> =
  | { readonly kind: 'none' }
  | { readonly kind: 'cell'; readonly key: K; readonly columnId: string }
  | { readonly kind: 'row'; readonly key: K };

export interface NeuTableEditError {
  readonly code: string;
  readonly message: string;
  readonly columnId?: string;
}

export interface NeuTableEditChange<K extends NeuTableKey> {
  readonly next: NeuTableEditState<K>;
  readonly source: 'pointer' | 'keyboard' | 'programmatic' | 'commit' | 'cancel';
}

export interface NeuTableEditValueChange<F extends string> {
  readonly columnId: string;
  readonly field?: F;
  readonly previous: unknown;
  readonly value: unknown;
}

export interface NeuTableEditCommit<T, K extends NeuTableKey, F extends string> {
  readonly key: K;
  readonly row: T;
  readonly changes: readonly NeuTableEditValueChange<F>[];
}

export interface NeuTableEditCancel<T, K extends NeuTableKey> {
  readonly key: K;
  readonly row: T;
  readonly reason: 'escape' | 'consumer' | 'data-change';
}

export type NeuTableEditValidation<T, K extends NeuTableKey, F extends string> = (
  event: NeuTableEditCommit<T, K, F>,
) => readonly NeuTableEditError[] | Promise<readonly NeuTableEditError[]>;

export type NeuTableEditingOptions<T, K extends NeuTableKey, F extends string> =
  | { readonly mode: 'none' }
  | {
      readonly mode: 'cell' | 'row';
      readonly activation: 'click' | 'double-click' | 'enter' | 'f2';
      readonly validate?: NeuTableEditValidation<T, K, F>;
      readonly commitOnBlur: boolean;
    };

export interface NeuTableExpansionOptions<T> {
  readonly enabled: boolean;
  readonly toggleOnRowClick: boolean;
  readonly isExpandable?: (row: T) => boolean;
}

export interface NeuTableExpandedKeysChange<K extends NeuTableKey> {
  readonly next: readonly K[];
  readonly key: K;
  readonly expanded: boolean;
  readonly source: 'toggle' | 'keyboard' | 'programmatic';
}

export interface NeuTableGroupingState<F extends string> {
  readonly by: readonly F[];
  readonly expandedGroupIds: readonly string[];
}

export interface NeuTableGroupContext<T> {
  readonly id: string;
  readonly level: number;
  readonly value: unknown;
  readonly rows: readonly T[];
  readonly expanded: boolean;
}

export interface NeuTableGroupingOptions<T, F extends string> {
  readonly mode: 'subheader' | 'rowspan';
  /** P1 grouping is over loaded client rows; it never implies TreeTable semantics. */
  readonly scope: 'loaded';
  readonly value?: (row: T, field: F) => unknown;
  readonly aggregate?: (rows: readonly T[], field: F) => unknown;
}

export interface NeuTableGroupingChange<F extends string> {
  readonly next: NeuTableGroupingState<F>;
  readonly source: 'toggle' | 'programmatic';
}

export interface NeuTableRowAction<T, K extends NeuTableKey> {
  readonly row: T;
  readonly key: K;
  readonly index: number;
  readonly action: 'activate' | 'double-activate' | 'context-menu';
}

export interface NeuTableRowMove<K extends NeuTableKey> {
  readonly key: K;
  readonly beforeKey: K | null;
  readonly fromIndex: number;
  readonly toIndex: number;
}

export type NeuTableExportFormat = 'csv' | 'json' | 'xlsx';
export type NeuTableExportScope = 'page' | 'loaded' | 'filtered' | 'selected' | 'all';

export interface NeuTableExportRequest<F extends string> {
  readonly format: NeuTableExportFormat;
  readonly scope: NeuTableExportScope;
  readonly fileName: string;
  readonly query: NeuTableQuery<F>;
}

export interface NeuTableExportResult {
  readonly fileName: string;
  readonly mediaType: string;
  readonly bytes: Uint8Array;
}

export type NeuTableExportOutcome =
  | { readonly kind: 'generated'; readonly result: NeuTableExportResult }
  | { readonly kind: 'delegated' };

export interface NeuTableFeatureError {
  readonly feature: 'filters' | 'editing' | 'virtualization' | 'export';
  readonly cause: unknown;
  readonly recoverable: boolean;
}

export interface NeuTableRowContext<T, K extends NeuTableKey> {
  readonly $implicit: T;
  readonly row: T;
  readonly key: K;
  readonly index: number;
  readonly selected: boolean;
  readonly expanded: boolean;
  readonly disabled: boolean;
}

export interface NeuTableCellContext<T, K extends NeuTableKey> extends NeuTableRowContext<T, K> {
  readonly columnId: string;
  readonly value: unknown;
}

export interface NeuTableHeaderContext<T, F extends string> {
  readonly column: NeuTableColumn<T, F>;
  readonly sort: readonly NeuSortEntry<F>[];
}

export interface NeuTableEditorContext<
  T,
  K extends NeuTableKey,
  F extends string,
> extends NeuTableCellContext<T, K> {
  readonly valueSignal: Signal<unknown>;
  readonly errors: Signal<readonly NeuTableEditError[]>;
  readonly setValue: (value: unknown) => void;
  readonly commit: () => void;
  readonly cancel: () => void;
}

export interface NeuTableDetailContext<T, K extends NeuTableKey> extends NeuTableRowContext<T, K> {}

export interface NeuTableStateTemplateContext {
  readonly loading: boolean;
  readonly error: unknown | null;
  readonly retry: () => void;
}
