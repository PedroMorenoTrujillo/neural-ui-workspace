import type { TemplateRef } from '@angular/core';

export type NeuTreeTableKey = string | number;
export type NeuTreeTableDataMode = 'client' | 'remote';
export type NeuTreeSortDirection = 'asc' | 'desc';
export type NeuTreeFilterOperator = 'and' | 'or';

export interface NeuTreeSortEntry<F extends string> {
  readonly field: F;
  readonly direction: NeuTreeSortDirection;
}

export interface NeuTreeFilterConstraint<F extends string> {
  readonly kind: 'condition';
  readonly field: F;
  readonly rule:
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'notContains'
    | 'startsWith'
    | 'endsWith'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'between'
    | 'in'
    | 'notIn'
    | 'isNull'
    | 'isNotNull'
    | 'isEmpty'
    | 'isNotEmpty';
  readonly value: unknown;
}

export interface NeuTreeFilterGroup<F extends string> {
  readonly kind: 'group';
  readonly operator: NeuTreeFilterOperator;
  readonly children: readonly NeuTreeFilterExpression<F>[];
}

export type NeuTreeFilterExpression<F extends string> =
  NeuTreeFilterConstraint<F> | NeuTreeFilterGroup<F>;

/** Page and pageSize address roots, never flattened visible nodes. */
export interface NeuTreeTableQuery<F extends string> {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly sort: readonly NeuTreeSortEntry<F>[];
  readonly filters: NeuTreeFilterExpression<F> | null;
}

export type NeuTreeRelationStatus = 'unloaded' | 'loading' | 'error' | 'loaded';
export type NeuTreeRelationCompleteness = 'partial' | 'complete';

export interface NeuTreeUnloadedRelation<K extends NeuTreeTableKey> {
  readonly status: 'unloaded';
  readonly keys: readonly K[];
  readonly relationRevision: number;
  readonly appliedRequestId: number | null;
  readonly total: number | null;
}

export interface NeuTreeLoadingRelation<K extends NeuTreeTableKey> {
  readonly status: 'loading';
  readonly keys: readonly K[];
  readonly relationRevision: number;
  readonly appliedRequestId: number;
  readonly total: number | null;
}

export interface NeuTreeErrorRelation<K extends NeuTreeTableKey> {
  readonly status: 'error';
  readonly keys: readonly K[];
  readonly relationRevision: number;
  readonly appliedRequestId: number | null;
  readonly total: number | null;
  readonly error: unknown;
}

export interface NeuTreeLoadedRelation<K extends NeuTreeTableKey> {
  readonly status: 'loaded';
  readonly keys: readonly K[];
  readonly relationRevision: number;
  readonly appliedRequestId: number | null;
  readonly total: number | null;
  readonly completeness: NeuTreeRelationCompleteness;
}

export type NeuTreeRelation<K extends NeuTreeTableKey> =
  | NeuTreeUnloadedRelation<K>
  | NeuTreeLoadingRelation<K>
  | NeuTreeErrorRelation<K>
  | NeuTreeLoadedRelation<K>;

export interface NeuTreeChildRelation<K extends NeuTreeTableKey> {
  readonly parentKey: K;
  readonly relation: NeuTreeRelation<K>;
}

/** Single parent-owned applied hierarchy snapshot. */
export interface NeuTreeTableHierarchy<K extends NeuTreeTableKey> {
  readonly hierarchyRevision: number;
  readonly queryRevision: number;
  readonly roots: NeuTreeRelation<K>;
  readonly children: readonly NeuTreeChildRelation<K>[];
}

export type NeuTreeValueAccessor<T> = (value: T) => unknown;

export interface NeuTreeSortColumn<T, F extends string> {
  readonly field: F;
  readonly value?: NeuTreeValueAccessor<T>;
  readonly compare?: (left: T, right: T) => number;
}

export interface NeuTreeFilterColumn<T, F extends string> {
  readonly field: F;
  readonly value?: NeuTreeValueAccessor<T>;
  readonly rules: readonly NeuTreeFilterConstraint<F>['rule'][];
  readonly defaultRule: NeuTreeFilterConstraint<F>['rule'];
}

export interface NeuTreeEditColumn<T, F extends string> {
  readonly field: F;
  readonly read?: NeuTreeValueAccessor<T>;
  readonly write?: (value: T, candidate: unknown) => T;
}

export interface NeuTreeTableColumn<T, F extends string> {
  readonly id: string;
  readonly header: string;
  readonly field?: F;
  readonly value?: NeuTreeValueAccessor<T>;
  readonly sort?: NeuTreeSortColumn<T, F>;
  readonly filter?: NeuTreeFilterColumn<T, F>;
  readonly edit?: NeuTreeEditColumn<T, F>;
  readonly width?: string;
  readonly minWidth?: string;
  readonly maxWidth?: string;
  readonly align?: 'start' | 'center' | 'end';
}

export interface NeuTreeTableSortOptions {
  readonly mode: 'single' | 'multiple';
  readonly removable: boolean;
  readonly defaultDirection: NeuTreeSortDirection;
  readonly resetRootPageOnChange: boolean;
}

export type NeuTreeFilterSurface = 'row' | 'menu' | 'builder';

export interface NeuTreeFilterPredicateContext<T, F extends string> {
  readonly value: T;
  readonly field: F;
  readonly candidate: unknown;
  readonly filterValue: unknown;
}

export type NeuTreeFilterPredicate<T, F extends string> = (
  context: NeuTreeFilterPredicateContext<T, F>,
) => boolean;

export interface NeuTreeTableFilterOptions<T, F extends string> {
  readonly surfaces: readonly NeuTreeFilterSurface[];
  readonly globalFields: readonly F[];
  readonly predicates: Readonly<Record<string, NeuTreeFilterPredicate<T, F>>>;
  readonly debounceMs: number;
  readonly commit: 'immediate' | 'explicit';
  readonly equals?: (left: unknown, right: unknown) => boolean;
}

export interface NeuTreeTablePaginationOptions {
  readonly enabled: boolean;
  readonly pageSizeOptions: readonly number[];
  readonly position: 'top' | 'bottom' | 'both';
  readonly report: 'none' | 'roots';
}

export interface NeuTreeTableSelection<K extends NeuTreeTableKey> {
  readonly kind: 'keys';
  readonly keys: readonly K[];
}

export type NeuTreeTableSelectionOptions<T> =
  | { readonly mode: 'none' }
  | {
      readonly mode: 'single';
      readonly indicator: 'none' | 'radio';
      readonly selectOnRowClick: boolean;
      readonly allowClear: boolean;
      readonly isNodeDisabled?: (value: T) => boolean;
    }
  | {
      readonly mode: 'multiple' | 'checkbox';
      readonly indicator: 'none' | 'checkbox';
      readonly selectOnRowClick: boolean;
      readonly modifier: 'replace' | 'platform' | 'toggle';
      readonly range: boolean;
      readonly propagation: 'none' | 'loaded-subtree';
      readonly toggleAllScope: 'visible' | 'loaded';
      readonly isNodeDisabled?: (value: T) => boolean;
    };

export interface NeuTreeTableSelectionChange<T, K extends NeuTreeTableKey> {
  readonly next: NeuTreeTableSelection<K>;
  readonly source: 'row' | 'radio' | 'checkbox' | 'keyboard' | 'toggle-all';
  readonly addedKeys: readonly K[];
  readonly removedKeys: readonly K[];
  readonly loadedValues: readonly T[];
  readonly propagation: 'none' | 'loaded-subtree';
}

export interface NeuTreeTableExpandedKeysChange<K extends NeuTreeTableKey> {
  readonly next: readonly K[];
  readonly source: 'toggle' | 'keyboard';
  readonly changedKey: K;
}

export interface NeuTreeTableLayoutState {
  readonly order: readonly string[];
  readonly hidden: readonly string[];
  readonly widths: Readonly<Record<string, string>>;
  readonly pinnedStart: readonly string[];
  readonly pinnedEnd: readonly string[];
}

export interface NeuTreeTableLayoutChange {
  readonly next: NeuTreeTableLayoutState;
  readonly source: 'resize' | 'reorder' | 'visibility' | 'pin';
}

export type NeuTreeTableVirtualizationOptions =
  | { readonly enabled: false }
  | { readonly enabled: true; readonly itemSize: number; readonly overscan: number };

export interface NeuTreeTableRange {
  readonly start: number;
  readonly end: number;
}

export interface NeuTreeTableRangeChange {
  readonly visible: NeuTreeTableRange;
  readonly render: NeuTreeTableRange;
  readonly projectionRevision: number;
  readonly reason: 'scroll' | 'resize' | 'programmatic' | 'hierarchy';
}

export type NeuTreeTableEditState<K extends NeuTreeTableKey> =
  | { readonly kind: 'none' }
  | { readonly kind: 'cell'; readonly key: K; readonly columnId: string }
  | { readonly kind: 'row'; readonly key: K };

export interface NeuTreeTableEditingOptions<T, K extends NeuTreeTableKey, F extends string> {
  readonly mode: 'none' | 'cell' | 'row';
  readonly validate?: (context: {
    readonly value: T;
    readonly key: K;
    readonly field: F | null;
    readonly draft: Readonly<Partial<T>>;
  }) => true | string;
}

export interface NeuTreeTableEditChange<K extends NeuTreeTableKey> {
  readonly next: NeuTreeTableEditState<K>;
  readonly source: 'gesture' | 'keyboard' | 'commit' | 'cancel' | 'hidden';
}

export interface NeuTreeTableEditCommit<T, K extends NeuTreeTableKey, F extends string> {
  readonly key: K;
  readonly value: T;
  readonly field: F | null;
  readonly draft: Readonly<Partial<T>>;
  readonly source: 'cell' | 'row';
}

export interface NeuTreeTableEditCancel<T, K extends NeuTreeTableKey> {
  readonly key: K;
  readonly value: T;
  readonly reason: 'escape' | 'gesture' | 'hidden' | 'destroy';
}

export interface NeuTreeTableHierarchyOptions {
  readonly treeColumnId: string;
  readonly indentSize: number;
}

export interface NeuTreeTableRowOptions<T> {
  readonly className?: (value: T) => string | readonly string[] | null;
}

export interface NeuTreeTableAppearance {
  readonly density: 'compact' | 'normal' | 'relaxed';
  readonly borders: 'none' | 'rows' | 'cells';
  readonly striped: boolean;
  readonly stickyHeader: boolean;
  readonly responsive: 'contained-scroll' | 'stacked';
}

export interface NeuTreeTableLabels {
  readonly ariaLabel: string;
  readonly empty: string;
  readonly loading: string;
  readonly error: string;
  readonly retry: string;
  readonly expand: string;
  readonly collapse: string;
  readonly selection: string;
  readonly pagination: string;
}

export interface NeuTreeTableInteractionOptions {
  readonly navigation: 'row';
  readonly wrapFocus: boolean;
  readonly announceChanges: boolean;
  readonly contextMenuAction: boolean;
}

export interface NeuTreeTableExportOptions {
  readonly formats: readonly ('csv' | 'json' | 'xlsx')[];
  readonly defaultFilename: string;
}

export interface NeuTreeTableExportRequest<F extends string> {
  readonly format: 'csv' | 'json' | 'xlsx';
  readonly scope: 'visible' | 'loaded' | 'selected';
  readonly filename?: string;
  readonly query: NeuTreeTableQuery<F>;
}

export type NeuTreeTableExportOutcome =
  | { readonly status: 'downloaded'; readonly filename: string; readonly rowCount: number }
  | { readonly status: 'delegated' }
  | { readonly status: 'unsupported'; readonly reason: string }
  | { readonly status: 'failed'; readonly error: unknown };

export type NeuTreeTableFeatureError =
  | {
      readonly feature: 'hierarchy';
      readonly code:
        | 'cycle'
        | 'duplicate-key'
        | 'duplicate-parent'
        | 'missing-root'
        | 'missing-node'
        | 'duplicate-child'
        | 'orphan'
        | 'invalid-tree-column';
      readonly error: unknown;
    }
  | {
      readonly feature: 'advanced-filter' | 'editor' | 'export';
      readonly error: unknown;
    };

export interface NeuTreeTableRequestBase<F extends string> {
  readonly requestId: number;
  readonly queryRevision: number;
  readonly hierarchyRevision: number;
  readonly query: NeuTreeTableQuery<F>;
}

export interface NeuTreeTableRootsRequest<F extends string> extends NeuTreeTableRequestBase<F> {
  readonly kind: 'roots';
  readonly reason: 'initial' | 'query' | 'page' | 'retry';
  readonly relationRevision: number;
}

export interface NeuTreeTableChildrenRequest<
  K extends NeuTreeTableKey,
  F extends string,
> extends NeuTreeTableRequestBase<F> {
  readonly kind: 'children';
  readonly reason: 'expand' | 'query' | 'retry';
  readonly parentKey: K;
  readonly relationRevision: number;
}

export type NeuTreeTableDataRequest<K extends NeuTreeTableKey, F extends string> =
  NeuTreeTableRootsRequest<F> | NeuTreeTableChildrenRequest<K, F>;

export interface NeuTreeTableRowAction<T, K extends NeuTreeTableKey> {
  readonly key: K;
  readonly value: T;
  readonly source: 'click' | 'double-click' | 'keyboard' | 'context-menu';
}

export type NeuTreeTableFocusTarget<K extends NeuTreeTableKey> =
  | { readonly kind: 'node'; readonly key: K }
  | { readonly kind: 'cell'; readonly key: K; readonly columnId: string }
  | { readonly kind: 'first' | 'last' };

export type NeuTreeTableScrollTarget<K extends NeuTreeTableKey> =
  | { readonly kind: 'node'; readonly key: K; readonly behavior?: ScrollBehavior }
  | { readonly kind: 'index'; readonly index: number; readonly behavior?: ScrollBehavior }
  | { readonly kind: 'offset'; readonly offset: number; readonly behavior?: ScrollBehavior };

export type NeuTreeTableRetryTarget<K extends NeuTreeTableKey> =
  { readonly kind: 'roots' } | { readonly kind: 'children'; readonly parentKey: K };

export interface NeuTreeTableNodeContext<T, K extends NeuTreeTableKey> {
  readonly $implicit: T;
  readonly value: T;
  readonly key: K;
  readonly parentKey: K | null;
  readonly depth: number;
  readonly siblingIndex: number;
  readonly siblingCount: number | null;
  readonly path: readonly K[];
  readonly expanded: boolean;
  readonly selected: boolean;
  readonly indeterminate: boolean;
  readonly disabled: boolean;
  readonly childStatus: NeuTreeRelationStatus;
  readonly toggleExpansion: () => void;
  readonly toggleSelection: () => void;
}

export interface NeuTreeTableCellContext<
  T,
  K extends NeuTreeTableKey,
  F extends string,
> extends NeuTreeTableNodeContext<T, K> {
  readonly column: NeuTreeTableColumn<T, F>;
  readonly columnIndex: number;
  readonly logicalIndex: number;
}

export interface NeuTreeTableHeaderContext<T, F extends string> {
  readonly column: NeuTreeTableColumn<T, F>;
  readonly columnIndex: number;
}

export interface NeuTreeTableEditorContext<
  T,
  K extends NeuTreeTableKey,
  F extends string,
> extends NeuTreeTableCellContext<T, K, F> {
  readonly field: F | null;
  readonly draftValue: unknown;
  readonly update: (value: unknown) => void;
  readonly commit: () => void;
  readonly cancel: () => void;
}

export interface NeuTreeTableStateContext {
  readonly retry: () => void;
}

export interface NeuTreeTableTemplateDirective<C> {
  readonly templateRef: TemplateRef<C>;
}
