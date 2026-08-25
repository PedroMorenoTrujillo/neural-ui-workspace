import { computed, signal, type WritableSignal } from '@angular/core';
import type { NeuTableFilterMatchMode, NeuTableLayout, NeuTableSortEntry } from './neu-table.types';

export type InternalNeuTableStateOrigin =
  | 'ui'
  | 'api'
  | 'input'
  | 'url'
  | 'controlled'
  | 'persistence'
  | 'server'
  | 'column-lifecycle';

export type InternalNeuTableStateKey =
  | 'page'
  | 'pageSize'
  | 'search'
  | 'sort'
  | 'sortEntries'
  | 'filters'
  | 'selectionKeys'
  | 'expansionKeys'
  | 'editingKeys'
  | 'editingCell'
  | 'groupExpansionKeys'
  | 'layout';

export type InternalAppliedFilterOperator = 'and' | 'or';

export interface InternalAppliedFilterConstraint {
  mode?: string;
  value: unknown;
  projectionValue?: unknown;
}

export interface InternalAppliedColumnFilter {
  operator: InternalAppliedFilterOperator;
  constraints: readonly InternalAppliedFilterConstraint[];
}

export interface InternalNeuTableSort {
  key: string;
  dir: 'asc' | 'desc';
}

export interface InternalNeuTableState<K = unknown> {
  page: number;
  pageSize: number;
  search: string;
  sort: InternalNeuTableSort | null;
  sortEntries: readonly NeuTableSortEntry[];
  filters: Readonly<Record<string, InternalAppliedColumnFilter>>;
  selectionKeys: ReadonlySet<K>;
  expansionKeys: ReadonlySet<K>;
  editingKeys: ReadonlySet<K>;
  editingCell: Readonly<{ rowKey: K; columnKey: string }> | null;
  groupExpansionKeys: ReadonlySet<K>;
  layout: NeuTableLayout;
}

export interface InternalNeuTableStateChange<K = unknown> {
  previous: InternalNeuTableState<K>;
  current: InternalNeuTableState<K>;
  changedKeys: readonly InternalNeuTableStateKey[];
  origin: InternalNeuTableStateOrigin;
  committed: boolean;
}

export type InternalNeuTableStateChangeListener<K = unknown> = (
  change: InternalNeuTableStateChange<K>,
) => void;

const _DEFAULT_LAYOUT: NeuTableLayout = {
  columnOrder: [],
  hiddenColumns: [],
  columnWidths: {},
};

/**
 * Instance-local canonical owner for consumer-relevant Table state.
 *
 * The controller deliberately knows nothing about DOM, controls, rows, URL
 * routing or server payloads. Those remain adapters/projections around this
 * boundary. Controlled mode records change intent without mutating the
 * authoritative snapshot; uncontrolled mode commits the same normalized intent.
 */
export class NeuTableStateController<K = unknown> {
  private readonly _state = signal<InternalNeuTableState<K>>(
    cloneState({
      page: 1,
      pageSize: 10,
      search: '',
      sort: null,
      sortEntries: [],
      filters: {},
      selectionKeys: new Set<K>(),
      expansionKeys: new Set<K>(),
      editingKeys: new Set<K>(),
      editingCell: null,
      groupExpansionKeys: new Set<K>(),
      layout: _DEFAULT_LAYOUT,
    }),
  );
  private readonly _controlledKeys = signal<ReadonlySet<InternalNeuTableStateKey>>(new Set());
  private readonly _sortState = computed(() => this._state().sort);
  private readonly _sortEntriesState = computed(() => this._state().sortEntries);
  private readonly _filtersState = computed(() => this._state().filters);
  private readonly _selectionKeysState = computed(() => this._state().selectionKeys);
  private readonly _expansionKeysState = computed(() => this._state().expansionKeys);
  private readonly _editingKeysState = computed(() => this._state().editingKeys);
  private readonly _editingCellState = computed(() => this._state().editingCell);
  private readonly _groupExpansionKeysState = computed(() => this._state().groupExpansionKeys);
  private readonly _layoutState = computed(() => this._state().layout);

  readonly controlled = computed(() => this._controlledKeys().size > 0);
  readonly page = computed(() => this._state().page);
  readonly pageSize = computed(() => this._state().pageSize);
  readonly search = computed(() => this._state().search);
  readonly sort = computed(() => {
    const sort = this._sortState();
    return sort ? { ...sort } : null;
  });
  readonly sortEntries = computed(() => this._sortEntriesState().map((entry) => ({ ...entry })));
  readonly filters = computed(() => cloneFilters(this._filtersState()));
  readonly selectionKeys = computed<ReadonlySet<K>>(() => new Set(this._selectionKeysState()));
  readonly expansionKeys = computed<ReadonlySet<K>>(() => new Set(this._expansionKeysState()));
  readonly editingKeys = computed<ReadonlySet<K>>(() => new Set(this._editingKeysState()));
  readonly editingCell = computed(() => {
    const cell = this._editingCellState();
    return cell ? { ...cell } : null;
  });
  readonly groupExpansionKeys = computed<ReadonlySet<K>>(
    () => new Set(this._groupExpansionKeysState()),
  );
  readonly layout = computed(() => cloneLayout(this._layoutState()));

  constructor(private readonly _onChange?: InternalNeuTableStateChangeListener<K>) {}

  snapshot(): InternalNeuTableState<K> {
    return cloneState(this._state());
  }

  createFiltersFacade(
    origin: InternalNeuTableStateOrigin = 'api',
  ): WritableSignal<Record<string, InternalAppliedColumnFilter>> {
    const projection = computed<Record<string, InternalAppliedColumnFilter>>(
      () => this.filters() as Record<string, InternalAppliedColumnFilter>,
    );
    const readonlyProjection = computed(() => projection());
    const facade = projection as WritableSignal<Record<string, InternalAppliedColumnFilter>>;
    facade.set = (filters) => {
      this.setFilters(filters, origin);
    };
    facade.update = (update) => facade.set(update(projection()));
    facade.asReadonly = () => readonlyProjection;
    return facade;
  }

  createColumnOrderFacade(origin: InternalNeuTableStateOrigin = 'api'): WritableSignal<string[]> {
    const projection = computed<string[]>(() => [...this.layout().columnOrder]);
    const readonlyProjection = computed(() => projection());
    const facade = projection as WritableSignal<string[]>;
    facade.set = (columnOrder) => {
      this.setLayout({ ...this.layout(), columnOrder }, origin);
    };
    facade.update = (update) => facade.set(update(projection()));
    facade.asReadonly = () => readonlyProjection;
    return facade;
  }

  setControlledState(state: InternalNeuTableState<K>): InternalNeuTableStateChange<K> | null {
    this._controlledKeys.set(
      new Set<InternalNeuTableStateKey>([
        'page',
        'pageSize',
        'search',
        'sort',
        'sortEntries',
        'filters',
        'selectionKeys',
        'expansionKeys',
        'editingKeys',
        'editingCell',
        'groupExpansionKeys',
        'layout',
      ]),
    );
    return this._commit(state, 'controlled');
  }

  releaseControlledState(): void {
    this._controlledKeys.set(new Set());
  }

  /** Controls only server/query slices while selection, expansion and layout stay independent. */
  setControlledQuery(
    query: Pick<
      InternalNeuTableState<K>,
      'page' | 'pageSize' | 'search' | 'sort' | 'sortEntries' | 'filters'
    >,
  ): InternalNeuTableStateChange<K> | null {
    const controlledKeys = new Set(this._controlledKeys());
    for (const key of ['page', 'pageSize', 'search', 'sort', 'sortEntries', 'filters'] as const) {
      controlledKeys.add(key);
    }
    this._controlledKeys.set(controlledKeys);
    return this._commit({ ...this.snapshot(), ...query }, 'controlled');
  }

  releaseControlledQuery(): void {
    const controlledKeys = new Set(this._controlledKeys());
    for (const key of ['page', 'pageSize', 'search', 'sort', 'sortEntries', 'filters'] as const) {
      controlledKeys.delete(key);
    }
    this._controlledKeys.set(controlledKeys);
  }

  /** Controls only selection while every other canonical state slice remains uncontrolled. */
  setControlledSelectionKeys(selectionKeys: ReadonlySet<K>): InternalNeuTableStateChange<K> | null {
    const controlledKeys = new Set(this._controlledKeys());
    controlledKeys.add('selectionKeys');
    this._controlledKeys.set(controlledKeys);
    return this._commit({ ...this.snapshot(), selectionKeys }, 'controlled');
  }

  releaseControlledSelection(): void {
    const controlledKeys = new Set(this._controlledKeys());
    controlledKeys.delete('selectionKeys');
    this._controlledKeys.set(controlledKeys);
  }

  /** Controls only expanded row keys while every other state slice stays independent. */
  setControlledExpansionKeys(expansionKeys: ReadonlySet<K>): InternalNeuTableStateChange<K> | null {
    const controlledKeys = new Set(this._controlledKeys());
    controlledKeys.add('expansionKeys');
    this._controlledKeys.set(controlledKeys);
    return this._commit({ ...this.snapshot(), expansionKeys }, 'controlled');
  }

  releaseControlledExpansion(): void {
    const controlledKeys = new Set(this._controlledKeys());
    controlledKeys.delete('expansionKeys');
    this._controlledKeys.set(controlledKeys);
  }

  setControlledEditingKeys(editingKeys: ReadonlySet<K>): InternalNeuTableStateChange<K> | null {
    const controlledKeys = new Set(this._controlledKeys());
    controlledKeys.add('editingKeys');
    this._controlledKeys.set(controlledKeys);
    return this._commit({ ...this.snapshot(), editingKeys }, 'controlled');
  }

  releaseControlledEditing(): void {
    const controlledKeys = new Set(this._controlledKeys());
    controlledKeys.delete('editingKeys');
    this._controlledKeys.set(controlledKeys);
  }

  setControlledEditingCell(
    editingCell: Readonly<{ rowKey: K; columnKey: string }> | null,
  ): InternalNeuTableStateChange<K> | null {
    const controlledKeys = new Set(this._controlledKeys());
    controlledKeys.add('editingCell');
    this._controlledKeys.set(controlledKeys);
    return this._commit({ ...this.snapshot(), editingCell }, 'controlled');
  }

  releaseControlledEditingCell(): void {
    const controlledKeys = new Set(this._controlledKeys());
    controlledKeys.delete('editingCell');
    this._controlledKeys.set(controlledKeys);
  }

  setControlledGroupExpansionKeys(
    groupExpansionKeys: ReadonlySet<K>,
  ): InternalNeuTableStateChange<K> | null {
    const controlledKeys = new Set(this._controlledKeys());
    controlledKeys.add('groupExpansionKeys');
    this._controlledKeys.set(controlledKeys);
    return this._commit({ ...this.snapshot(), groupExpansionKeys }, 'controlled');
  }

  releaseControlledGroupExpansion(): void {
    const controlledKeys = new Set(this._controlledKeys());
    controlledKeys.delete('groupExpansionKeys');
    this._controlledKeys.set(controlledKeys);
  }

  /** Controls only the single/multiple sort slices. */
  setControlledSort(
    sort: InternalNeuTableSort | null,
    sortEntries: readonly NeuTableSortEntry[],
  ): InternalNeuTableStateChange<K> | null {
    const controlledKeys = new Set(this._controlledKeys());
    controlledKeys.add('sort');
    controlledKeys.add('sortEntries');
    this._controlledKeys.set(controlledKeys);
    return this._commit({ ...this.snapshot(), sort, sortEntries }, 'controlled');
  }

  releaseControlledSort(): void {
    const controlledKeys = new Set(this._controlledKeys());
    controlledKeys.delete('sort');
    controlledKeys.delete('sortEntries');
    this._controlledKeys.set(controlledKeys);
  }

  update(
    patch: Partial<InternalNeuTableState<K>>,
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    const previous = this._state();
    const proposed = normalizeUpdate(previous, patch);
    const changedKeys = stateChangedKeys(previous, proposed);
    if (changedKeys.length === 0) return null;

    const controlledKeys = this._controlledKeys();
    const controlledProposal =
      origin !== 'controlled' && changedKeys.some((key) => controlledKeys.has(key));
    const change: InternalNeuTableStateChange<K> = {
      previous: cloneState(previous),
      current: cloneState(proposed),
      changedKeys,
      origin,
      committed: !controlledProposal,
    };
    if (controlledProposal) {
      const uncontrolledPatch = Object.fromEntries(
        changedKeys.filter((key) => !controlledKeys.has(key)).map((key) => [key, proposed[key]]),
      ) as Partial<InternalNeuTableState<K>>;
      const committed = normalizeUpdate(previous, uncontrolledPatch);
      if (stateChangedKeys(previous, committed).length > 0) this._state.set(committed);
    } else {
      this._state.set(proposed);
    }
    this._onChange?.(change);
    return change;
  }

  setPage(
    page: number,
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    return this.update({ page }, origin);
  }

  setPageSize(
    pageSize: number,
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    return this.update({ pageSize }, origin);
  }

  setSearch(
    search: string,
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    return this.update({ search }, origin);
  }

  setSort(
    sort: InternalNeuTableSort | null,
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    return this.update({ sort }, origin);
  }

  setSortEntries(
    sortEntries: readonly NeuTableSortEntry[],
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    return this.update({ sortEntries }, origin);
  }

  setFilters(
    filters: Readonly<Record<string, InternalAppliedColumnFilter>>,
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    return this.update({ filters }, origin);
  }

  setSelectionKeys(
    selectionKeys: ReadonlySet<K>,
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    return this.update({ selectionKeys }, origin);
  }

  setExpansionKeys(
    expansionKeys: ReadonlySet<K>,
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    return this.update({ expansionKeys }, origin);
  }

  setEditingKeys(
    editingKeys: ReadonlySet<K>,
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    return this.update({ editingKeys }, origin);
  }

  setEditingCell(
    editingCell: Readonly<{ rowKey: K; columnKey: string }> | null,
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    return this.update({ editingCell }, origin);
  }

  setGroupExpansionKeys(
    groupExpansionKeys: ReadonlySet<K>,
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    return this.update({ groupExpansionKeys }, origin);
  }

  setLayout(
    layout: NeuTableLayout,
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    return this.update({ layout }, origin);
  }

  private _commit(
    state: InternalNeuTableState<K>,
    origin: InternalNeuTableStateOrigin,
  ): InternalNeuTableStateChange<K> | null {
    const previous = this._state();
    const current = normalizeState(state);
    const changedKeys = stateChangedKeys(previous, current);
    if (changedKeys.length === 0) return null;
    this._state.set(current);
    const change: InternalNeuTableStateChange<K> = {
      previous: cloneState(previous),
      current: cloneState(current),
      changedKeys,
      origin,
      committed: true,
    };
    // Controlled replacement is an authoritative input, not a change intent.
    // Returning the record keeps internal observability without writing back
    // through the listener that a future public stateChange output will use.
    return change;
  }
}

function normalizeUpdate<K>(
  previous: InternalNeuTableState<K>,
  patch: Partial<InternalNeuTableState<K>>,
): InternalNeuTableState<K> {
  const owns = (key: keyof InternalNeuTableState<K>) =>
    Object.prototype.hasOwnProperty.call(patch, key);
  return {
    page: owns('page') ? normalizePositiveInteger(patch.page, 1) : previous.page,
    pageSize: owns('pageSize') ? normalizePositiveInteger(patch.pageSize, 1) : previous.pageSize,
    search: owns('search') ? String(patch.search ?? '') : previous.search,
    sort: owns('sort')
      ? patch.sort
        ? { key: String(patch.sort.key), dir: patch.sort.dir === 'desc' ? 'desc' : 'asc' }
        : null
      : previous.sort,
    sortEntries: owns('sortEntries')
      ? (patch.sortEntries ?? []).map((entry) => ({
          key: String(entry.key),
          dir: entry.dir === 'desc' ? 'desc' : 'asc',
        }))
      : previous.sortEntries,
    filters: owns('filters') ? cloneFilters(patch.filters ?? {}) : previous.filters,
    selectionKeys: owns('selectionKeys')
      ? new Set(patch.selectionKeys ?? [])
      : previous.selectionKeys,
    expansionKeys: owns('expansionKeys')
      ? new Set(patch.expansionKeys ?? [])
      : previous.expansionKeys,
    editingKeys: owns('editingKeys') ? new Set(patch.editingKeys ?? []) : previous.editingKeys,
    editingCell: owns('editingCell')
      ? patch.editingCell
        ? { rowKey: patch.editingCell.rowKey, columnKey: String(patch.editingCell.columnKey) }
        : null
      : previous.editingCell,
    groupExpansionKeys: owns('groupExpansionKeys')
      ? new Set(patch.groupExpansionKeys ?? [])
      : previous.groupExpansionKeys,
    layout: owns('layout') ? cloneLayout(patch.layout ?? _DEFAULT_LAYOUT) : previous.layout,
  };
}

function normalizeState<K>(state: InternalNeuTableState<K>): InternalNeuTableState<K> {
  return {
    page: normalizePositiveInteger(state.page, 1),
    pageSize: normalizePositiveInteger(state.pageSize, 1),
    search: String(state.search ?? ''),
    sort: state.sort
      ? { key: String(state.sort.key), dir: state.sort.dir === 'desc' ? 'desc' : 'asc' }
      : null,
    sortEntries: state.sortEntries.map((entry) => ({
      key: String(entry.key),
      dir: entry.dir === 'desc' ? 'desc' : 'asc',
    })),
    filters: cloneFilters(state.filters),
    selectionKeys: new Set(state.selectionKeys),
    expansionKeys: new Set(state.expansionKeys),
    editingKeys: new Set(state.editingKeys),
    editingCell: state.editingCell ? { ...state.editingCell } : null,
    groupExpansionKeys: new Set(state.groupExpansionKeys),
    layout: cloneLayout(state.layout),
  };
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value!)) : fallback;
}

function cloneState<K>(state: InternalNeuTableState<K>): InternalNeuTableState<K> {
  return {
    page: state.page,
    pageSize: state.pageSize,
    search: state.search,
    sort: state.sort ? { ...state.sort } : null,
    sortEntries: state.sortEntries.map((entry) => ({ ...entry })),
    filters: cloneFilters(state.filters),
    selectionKeys: new Set(state.selectionKeys),
    expansionKeys: new Set(state.expansionKeys),
    editingKeys: new Set(state.editingKeys),
    editingCell: state.editingCell ? { ...state.editingCell } : null,
    groupExpansionKeys: new Set(state.groupExpansionKeys),
    layout: cloneLayout(state.layout),
  };
}

function cloneFilters(
  filters: Readonly<Record<string, InternalAppliedColumnFilter>>,
): Record<string, InternalAppliedColumnFilter> {
  const seen = new WeakMap<object, unknown>();
  return Object.fromEntries(
    Object.entries(filters).map(([key, filter]) => [
      key,
      {
        operator: filter.operator,
        constraints: filter.constraints.map((constraint) => ({
          ...constraint,
          value: cloneFilterValue(constraint.value, seen),
          ...(Object.prototype.hasOwnProperty.call(constraint, 'projectionValue')
            ? { projectionValue: constraint.projectionValue }
            : {}),
        })),
      },
    ]),
  );
}

function cloneFilterValue(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) {
    const existing = seen.get(value);
    if (existing) return existing;
    const clone: unknown[] = [];
    seen.set(value, clone);
    for (const entry of value) clone.push(cloneFilterValue(entry, seen));
    return clone;
  }
  if (isRangeRecord(value)) {
    const existing = seen.get(value);
    if (existing) return existing;
    const clone: { from?: unknown; to?: unknown } = {};
    seen.set(value, clone);
    clone.from = cloneFilterValue(value['from'], seen);
    clone.to = cloneFilterValue(value['to'], seen);
    return clone;
  }
  if (isDatePointRecord(value)) {
    return { precision: value['precision'], value: value['value'] };
  }
  return value;
}

function cloneLayout(layout: NeuTableLayout): NeuTableLayout {
  return {
    columnOrder: [...(layout.columnOrder ?? [])],
    hiddenColumns: [...(layout.hiddenColumns ?? [])],
    columnWidths: { ...(layout.columnWidths ?? {}) },
  };
}

function stateChangedKeys<K>(
  previous: InternalNeuTableState<K>,
  current: InternalNeuTableState<K>,
): InternalNeuTableStateKey[] {
  const changed: InternalNeuTableStateKey[] = [];
  if (previous.page !== current.page) changed.push('page');
  if (previous.pageSize !== current.pageSize) changed.push('pageSize');
  if (previous.search !== current.search) changed.push('search');
  if (!semanticEqual(previous.sort, current.sort)) changed.push('sort');
  if (!semanticEqual(previous.sortEntries, current.sortEntries)) changed.push('sortEntries');
  if (!filtersEqual(previous.filters, current.filters)) changed.push('filters');
  if (!setEqual(previous.selectionKeys, current.selectionKeys)) changed.push('selectionKeys');
  if (!setEqual(previous.expansionKeys, current.expansionKeys)) changed.push('expansionKeys');
  if (!setEqual(previous.editingKeys, current.editingKeys)) changed.push('editingKeys');
  if (!semanticEqual(previous.editingCell, current.editingCell)) changed.push('editingCell');
  if (!setEqual(previous.groupExpansionKeys, current.groupExpansionKeys)) {
    changed.push('groupExpansionKeys');
  }
  if (!semanticEqual(previous.layout, current.layout)) changed.push('layout');
  return changed;
}

function setEqual<T>(left: ReadonlySet<T>, right: ReadonlySet<T>): boolean {
  if (left.size !== right.size) return false;
  for (const value of left) if (!right.has(value)) return false;
  return true;
}

function filtersEqual(
  left: Readonly<Record<string, InternalAppliedColumnFilter>>,
  right: Readonly<Record<string, InternalAppliedColumnFilter>>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => {
    const leftFilter = left[key];
    const rightFilter = right[key];
    if (!rightFilter || leftFilter.operator !== rightFilter.operator) return false;
    if (leftFilter.constraints.length !== rightFilter.constraints.length) return false;
    return leftFilter.constraints.every((constraint, index) => {
      const candidate = rightFilter.constraints[index];
      return (
        constraint.mode === candidate.mode &&
        filterValueEqual(constraint.value, candidate.value) &&
        filterValueEqual(constraint.projectionValue, candidate.projectionValue)
      );
    });
  });
}

function filterValueEqual(
  left: unknown,
  right: unknown,
  seen = new WeakMap<object, WeakSet<object>>(),
): boolean {
  if (Object.is(left, right)) return true;
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  if (Array.isArray(left) && Array.isArray(right)) {
    if (pairSeen(left, right, seen)) return true;
    return (
      left.length === right.length &&
      left.every((value, index) => filterValueEqual(value, right[index], seen))
    );
  }
  if (isRangeRecord(left) && isRangeRecord(right)) {
    if (pairSeen(left, right, seen)) return true;
    return (
      filterValueEqual(left['from'], right['from'], seen) &&
      filterValueEqual(left['to'], right['to'], seen)
    );
  }
  if (isDatePointRecord(left) && isDatePointRecord(right)) {
    return left['precision'] === right['precision'] && left['value'] === right['value'];
  }
  return false;
}

function pairSeen(left: object, right: object, seen: WeakMap<object, WeakSet<object>>): boolean {
  const rights = seen.get(left);
  if (rights?.has(right)) return true;
  if (rights) rights.add(right);
  else seen.set(left, new WeakSet([right]));
  return false;
}

function isRangeRecord(value: unknown): value is Record<'from' | 'to', unknown> {
  return (
    isPlainRecord(value) &&
    Object.keys(value).every((key) => key === 'from' || key === 'to') &&
    Object.prototype.hasOwnProperty.call(value, 'from') &&
    Object.prototype.hasOwnProperty.call(value, 'to')
  );
}

function isDatePointRecord(value: unknown): value is Record<'precision' | 'value', unknown> {
  return (
    isPlainRecord(value) &&
    Object.keys(value).every((key) => key === 'precision' || key === 'value') &&
    Object.prototype.hasOwnProperty.call(value, 'precision') &&
    Object.prototype.hasOwnProperty.call(value, 'value')
  );
}

function semanticEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((value, index) => semanticEqual(value, right[index]))
    );
  }
  if (isPlainRecord(left) && isPlainRecord(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(right, key) && semanticEqual(left[key], right[key]),
      )
    );
  }
  return false;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
