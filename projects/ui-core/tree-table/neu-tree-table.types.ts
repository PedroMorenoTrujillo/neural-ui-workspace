import type {
  NeuTableAction,
  NeuTableBodyRenderEntry,
  NeuTableColumn,
  NeuTableEditValidationResult,
  NeuTableLabels,
  NeuTableQueryState,
  NeuTableRowSelectionEvent,
  NeuTableSelectionAction,
} from '@neural-ui/core/table';

export type NeuTreeTableFilterMode = 'lenient' | 'strict';
export type NeuTreeTableSelectionMode = 'none' | 'single' | 'multiple' | 'checkbox';

/** Per-instance TreeTable copy overrides. Omitted members use Neural defaults. */
export interface NeuTreeTableLabels extends NeuTableLabels {
  exactMatchLabel?: string;
  clearFilterLabel?: string;
  filterPlaceholder?: string;
  filterAriaPrefix?: string;
  allFilterOptionLabel?: string;
  emptyMessage?: string;
  expandNodeAriaLabel?: string;
  collapseNodeAriaLabel?: string;
}

export interface NeuTreeTableNode<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  children?: NeuTreeTableNode<T>[];
  /** `false` truthfully marks a branch whose children may not be loaded yet. */
  leaf?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  selectable?: boolean;
  loading?: boolean;
  data?: T;
}

export interface NeuTreeTableRow<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends Record<string, unknown> {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  __treeLevel: number;
  __treeHasChildren: boolean;
  __treeExpanded: boolean;
  __treeDisabled: boolean;
  __treeParentId?: string;
  __treePosInSet: number;
  __treeSetSize: number;
  __treeNode: NeuTreeTableNode<T>;
}

export type NeuTreeTableSelection<T extends Record<string, unknown> = Record<string, unknown>> =
  | NeuTreeTableNode<T>
  | readonly NeuTreeTableNode<T>[]
  | null;

export interface NeuTreeTableActionEvent<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  action: NeuTableAction<Record<string, unknown>>;
  node: NeuTreeTableNode<T>;
  row: NeuTreeTableRow<T>;
}

export interface NeuTreeTableSelectionActionEvent<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  action: NeuTableSelectionAction<Record<string, unknown>>;
  nodes: NeuTreeTableNode<T>[];
  rows: NeuTreeTableRow<T>[];
}

export interface NeuTreeTableSelectionEvent<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly node: NeuTreeTableNode<T>;
  readonly row: NeuTreeTableRow<T>;
  readonly source: NeuTableRowSelectionEvent<Record<string, unknown>>['source'];
  readonly selection: readonly NeuTreeTableNode<T>[];
}

export interface NeuTreeTableCellEditEvent<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  node: NeuTreeTableNode<T>;
  row: NeuTreeTableRow<T>;
  column: NeuTableColumn<Record<string, unknown>>;
  value: unknown;
  previousValue: unknown;
}

export interface NeuTreeTableRowEditEvent<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly node: NeuTreeTableNode<T>;
  readonly row: NeuTreeTableRow<T>;
  /** Consumer data only; TreeTable bookkeeping is never exposed as an editable draft. */
  readonly draft: Readonly<T>;
  readonly editingNodeKeys: readonly string[];
}

export type NeuTreeTableRowEditValidator<
  T extends Record<string, unknown> = Record<string, unknown>,
> = (event: NeuTreeTableRowEditEvent<T>) => NeuTableEditValidationResult;

export interface NeuTreeTableLazyRequest<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly reason: 'node-expand' | 'query' | 'virtual';
  readonly query: NeuTableQueryState;
  readonly node?: NeuTreeTableNode<T>;
  readonly first?: number;
  readonly last?: number;
}

export interface NeuTreeTableNodeContext<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly $implicit: NeuTreeTableNode<T>;
  readonly node: NeuTreeTableNode<T>;
  readonly data: T | undefined;
  readonly row: NeuTreeTableRow<T>;
  readonly column: NeuTableColumn<Record<string, unknown>>;
  readonly level: number;
  readonly leaf: boolean;
  readonly expanded: boolean;
  readonly selected: boolean;
  readonly partial: boolean;
  readonly editing: boolean;
  readonly toggle: () => void;
  readonly toggleSelection: () => void;
}

export interface NeuTreeTableBodyContext<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends Omit<NeuTreeTableNodeContext<T>, 'column' | 'toggle'> {
  readonly rowIndex: number;
  readonly logicalIndex: number;
  readonly frozen: boolean;
  readonly columns: readonly NeuTableColumn<Record<string, unknown>>[];
  readonly toggleExpansion: () => void;
  readonly edit: {
    readonly editing: boolean;
    readonly draft: Readonly<T>;
    readonly setValue: (key: string, value: unknown) => void;
    readonly init: () => void;
    readonly save: () => boolean;
    readonly cancel: () => void;
  };
}

export interface NeuTreeTableBodyDataEntry<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends NeuTreeTableBodyContext<T> {
  readonly kind: 'node';
  readonly key: string;
  readonly focus: () => void;
  readonly focusParent: () => void;
  readonly focusFirstChild: () => void;
  readonly focusPrevious: () => void;
  readonly focusNext: () => void;
}

export type NeuTreeTableBodyRenderEntry<
  T extends Record<string, unknown> = Record<string, unknown>,
> =
  | NeuTreeTableBodyDataEntry<T>
  | Exclude<NeuTableBodyRenderEntry<Record<string, unknown>>, { kind: 'data' }>;

export interface NeuTreeTableBodySectionContext<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly $implicit: readonly NeuTreeTableBodyRenderEntry<T>[];
  readonly entries: readonly NeuTreeTableBodyRenderEntry<T>[];
  readonly columns: readonly NeuTableColumn<Record<string, unknown>>[];
  readonly colspan: number;
  readonly virtualized: boolean;
  readonly siblingRowsSupported: boolean;
}

export interface NeuTreeTableScrollOptions {
  readonly nodeId?: string;
  readonly index?: number;
  readonly offset?: number;
  readonly behavior?: ScrollBehavior;
}
