import type {
  NeuRowKey,
  NeuTableColumn,
  NeuTableFilterOptions,
  NeuTableKey,
  NeuTableQuery,
  NeuTableRowOptions,
  NeuTableSelection,
  NeuTableSelectionChange,
  NeuTableSelectionOptions,
  NeuTableSelectionScope,
} from '../../public/neu-table.types';
import {
  createNeuTableFieldResolver,
  filterNeuTableRows,
  normalizeNeuTableText,
  searchNeuTableRows,
} from '../client-pipeline/neu-table-client-pipeline';
import { neuTableIdentityToken } from '../identity/neu-table-row-identity';

export type NeuTableHeaderSelectionState = 'checked' | 'unchecked' | 'indeterminate';

export interface NeuTableSelectionRow<T, K extends NeuTableKey> {
  readonly row: T;
  readonly key: K;
}

export interface NeuTableSelectionProjection<K extends NeuTableKey> {
  readonly selectedTokens: ReadonlySet<string>;
  readonly headerState: NeuTableHeaderSelectionState;
  readonly selectedCount: number;
  readonly selectableCount: number;
  readonly isSelected: (key: K) => boolean;
}

export interface NeuTableSelectionIntent<T, K extends NeuTableKey> {
  readonly row: T;
  readonly key: K;
  readonly source: NeuTableSelectionChange<T, K, string>['source'];
  readonly shiftKey: boolean;
  readonly platformModifier: boolean;
}

function sameFilter(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') {
    return Object.is(left, right);
  }
  const leftRecord = left as Readonly<Record<string, unknown>>;
  const rightRecord = right as Readonly<Record<string, unknown>>;
  if (leftRecord['kind'] !== rightRecord['kind']) return false;
  if (leftRecord['kind'] === 'condition') {
    return (
      leftRecord['field'] === rightRecord['field'] &&
      leftRecord['rule'] === rightRecord['rule'] &&
      Object.is(leftRecord['value'], rightRecord['value'])
    );
  }
  const leftChildren = leftRecord['children'];
  const rightChildren = rightRecord['children'];
  return (
    leftRecord['operator'] === rightRecord['operator'] &&
    Array.isArray(leftChildren) &&
    Array.isArray(rightChildren) &&
    leftChildren.length === rightChildren.length &&
    leftChildren.every((child, index) => sameFilter(child, rightChildren[index]))
  );
}

export function createNeuTableSelectionScope<T, F extends string>(
  query: NeuTableQuery<F>,
  filterOptions: NeuTableFilterOptions<T, F>,
): NeuTableSelectionScope<F> {
  return {
    search: query.search,
    filters: query.filters,
    globalFields: [...filterOptions.globalFields],
  };
}

export function areNeuTableSelectionScopesEqual<F extends string>(
  left: NeuTableSelectionScope<F>,
  right: NeuTableSelectionScope<F>,
): boolean {
  return (
    normalizeNeuTableText(left.search) === normalizeNeuTableText(right.search) &&
    left.globalFields.length === right.globalFields.length &&
    left.globalFields.every((field, index) => field === right.globalFields[index]) &&
    sameFilter(left.filters, right.filters)
  );
}

export function neuTableRowMatchesSelectionScope<T extends object, F extends string>(
  row: T,
  scope: NeuTableSelectionScope<F>,
  columns: readonly NeuTableColumn<T, F>[],
  filterOptions: NeuTableFilterOptions<T, F>,
): boolean {
  return matchingRowsForScope([row], scope, columns, filterOptions).has(row);
}

function matchingRowsForScope<T extends object, F extends string>(
  rows: readonly T[],
  scope: NeuTableSelectionScope<F>,
  columns: readonly NeuTableColumn<T, F>[],
  filterOptions: NeuTableFilterOptions<T, F>,
): ReadonlySet<T> {
  const resolver = createNeuTableFieldResolver(columns);
  const searched = searchNeuTableRows(
    rows,
    normalizeNeuTableText(scope.search),
    scope.globalFields,
    resolver,
  );
  return new Set(filterNeuTableRows(searched, scope.filters, resolver, filterOptions));
}

export function isNeuTableRowDisabled<T, K extends NeuTableKey>(
  row: T,
  selectionOptions: NeuTableSelectionOptions<T>,
  rowOptions: NeuTableRowOptions<T, K>,
): boolean {
  return (
    rowOptions.isDisabled?.(row) === true ||
    (selectionOptions.mode !== 'none' && selectionOptions.isRowDisabled?.(row) === true)
  );
}

function keyTokens<K extends NeuTableKey>(keys: readonly K[]): ReadonlySet<string> {
  return new Set(keys.map(neuTableIdentityToken));
}

function selectedForRows<T extends object, K extends NeuTableKey, F extends string>(options: {
  readonly selection: NeuTableSelection<K, F>;
  readonly selectionOptions: NeuTableSelectionOptions<T>;
  readonly rows: readonly NeuTableSelectionRow<T, K>[];
  readonly columns: readonly NeuTableColumn<T, F>[];
  readonly filterOptions: NeuTableFilterOptions<T, F>;
}): ReadonlySet<string> {
  if (options.selection.kind === 'keys') {
    const keys =
      options.selectionOptions.mode === 'single'
        ? options.selection.keys.slice(0, 1)
        : options.selection.keys;
    const applied = keyTokens(keys);
    return new Set(
      options.rows
        .map(({ key }) => neuTableIdentityToken(key))
        .filter((token) => applied.has(token)),
    );
  }
  if (options.selectionOptions.mode !== 'multiple') return new Set();
  const selection = options.selection;
  const excluded = keyTokens(selection.excludedKeys);
  const matchingRows = matchingRowsForScope(
    options.rows.map(({ row }) => row),
    selection.scope,
    options.columns,
    options.filterOptions,
  );
  return new Set(
    options.rows
      .filter(({ row, key }) => !excluded.has(neuTableIdentityToken(key)) && matchingRows.has(row))
      .map(({ key }) => neuTableIdentityToken(key)),
  );
}

export function projectNeuTableSelection<
  T extends object,
  K extends NeuTableKey,
  F extends string,
>(options: {
  readonly selection: NeuTableSelection<K, F>;
  readonly selectionOptions: NeuTableSelectionOptions<T>;
  readonly rowOptions: NeuTableRowOptions<T, K>;
  readonly rows: readonly NeuTableSelectionRow<T, K>[];
  readonly headerRows: readonly NeuTableSelectionRow<T, K>[];
  readonly columns: readonly NeuTableColumn<T, F>[];
  readonly filterOptions: NeuTableFilterOptions<T, F>;
  readonly currentScope: NeuTableSelectionScope<F>;
}): NeuTableSelectionProjection<K> {
  const selectedTokens = selectedForRows({
    selection: options.selection,
    selectionOptions: options.selectionOptions,
    rows: options.rows,
    columns: options.columns,
    filterOptions: options.filterOptions,
  });
  const selectable = options.headerRows.filter(
    ({ row }) => !isNeuTableRowDisabled(row, options.selectionOptions, options.rowOptions),
  );
  const selectedHeaderTokens = selectedForRows({
    selection: options.selection,
    selectionOptions: options.selectionOptions,
    rows: selectable,
    columns: options.columns,
    filterOptions: options.filterOptions,
  });
  let headerState: NeuTableHeaderSelectionState = 'unchecked';
  if (
    options.selectionOptions.mode === 'multiple' &&
    options.selectionOptions.toggleAllScope === 'all-matching'
  ) {
    if (
      options.selection.kind === 'all-matching' &&
      areNeuTableSelectionScopesEqual(options.selection.scope, options.currentScope)
    ) {
      headerState = options.selection.excludedKeys.length === 0 ? 'checked' : 'indeterminate';
    } else if (selectedHeaderTokens.size > 0) {
      headerState = 'indeterminate';
    }
  } else if (selectable.length > 0) {
    headerState =
      selectedHeaderTokens.size === 0
        ? 'unchecked'
        : selectedHeaderTokens.size === selectable.length
          ? 'checked'
          : 'indeterminate';
  }
  return {
    selectedTokens,
    headerState,
    selectedCount: selectedHeaderTokens.size,
    selectableCount: selectable.length,
    isSelected: (key) => selectedTokens.has(neuTableIdentityToken(key)),
  };
}

export function areNeuTableSelectionsEqual<K extends NeuTableKey, F extends string>(
  left: NeuTableSelection<K, F>,
  right: NeuTableSelection<K, F>,
): boolean {
  if (left.kind !== right.kind) return false;
  if (left.kind === 'keys' && right.kind === 'keys') {
    return (
      left.keys.length === right.keys.length &&
      left.keys.every(
        (key, index) => neuTableIdentityToken(key) === neuTableIdentityToken(right.keys[index]!),
      )
    );
  }
  if (left.kind !== 'all-matching' || right.kind !== 'all-matching') return false;
  const leftExcluded = keyTokens(left.excludedKeys);
  const rightExcluded = keyTokens(right.excludedKeys);
  return (
    areNeuTableSelectionScopesEqual(left.scope, right.scope) &&
    leftExcluded.size === rightExcluded.size &&
    [...leftExcluded].every((token) => rightExcluded.has(token))
  );
}

function createChange<T, K extends NeuTableKey, F extends string>(
  applied: NeuTableSelection<K, F>,
  next: NeuTableSelection<K, F>,
  source: NeuTableSelectionChange<T, K, F>['source'],
  loaded: readonly NeuTableSelectionRow<T, K>[],
): NeuTableSelectionChange<T, K, F> | null {
  if (areNeuTableSelectionsEqual(applied, next)) return null;
  const before = applied.kind === 'keys' ? keyTokens(applied.keys) : new Set<string>();
  const after = next.kind === 'keys' ? keyTokens(next.keys) : new Set<string>();
  const loadedByToken = new Map(
    loaded.map((entry) => [neuTableIdentityToken(entry.key), entry] as const),
  );
  const beforeExcluded =
    applied.kind === 'all-matching' ? keyTokens(applied.excludedKeys) : new Set<string>();
  const afterExcluded =
    next.kind === 'all-matching' ? keyTokens(next.excludedKeys) : new Set<string>();
  const addedKeys =
    next.kind === 'keys'
      ? next.keys.filter((key) => !before.has(neuTableIdentityToken(key)))
      : applied.kind === 'all-matching'
        ? applied.excludedKeys.filter((key) => !afterExcluded.has(neuTableIdentityToken(key)))
        : [];
  const removedKeys =
    applied.kind === 'keys'
      ? applied.keys.filter((key) => !after.has(neuTableIdentityToken(key)))
      : next.kind === 'all-matching'
        ? next.excludedKeys.filter((key) => !beforeExcluded.has(neuTableIdentityToken(key)))
        : [];
  const changedTokens = new Set([...addedKeys, ...removedKeys].map(neuTableIdentityToken));
  const loadedRows =
    applied.kind === 'all-matching' || next.kind === 'all-matching'
      ? loaded.map((entry) => entry.row)
      : [...changedTokens]
          .map((token) => loadedByToken.get(token)?.row)
          .filter((row): row is T => row !== undefined);
  return { next, source, addedKeys, removedKeys, loadedRows };
}

function toggleKey<K extends NeuTableKey>(keys: readonly K[], key: K): readonly K[] {
  const token = neuTableIdentityToken(key);
  return keys.some((candidate) => neuTableIdentityToken(candidate) === token)
    ? keys.filter((candidate) => neuTableIdentityToken(candidate) !== token)
    : [...keys, key];
}

export function proposeNeuTableRowSelection<
  T extends object,
  K extends NeuTableKey,
  F extends string,
>(options: {
  readonly selection: NeuTableSelection<K, F>;
  readonly selectionOptions: NeuTableSelectionOptions<T>;
  readonly rowOptions: NeuTableRowOptions<T, K>;
  readonly intent: NeuTableSelectionIntent<T, K>;
  readonly rangeRows: readonly NeuTableSelectionRow<T, K>[];
  readonly loadedRows: readonly NeuTableSelectionRow<T, K>[];
  readonly anchor: K | null;
  readonly columns: readonly NeuTableColumn<T, F>[];
  readonly filterOptions: NeuTableFilterOptions<T, F>;
}): { readonly change: NeuTableSelectionChange<T, K, F> | null; readonly anchor: K | null } {
  const mode = options.selectionOptions.mode;
  if (
    mode === 'none' ||
    isNeuTableRowDisabled(options.intent.row, options.selectionOptions, options.rowOptions)
  ) {
    return { change: null, anchor: options.anchor };
  }
  if (mode === 'single') {
    const keys = options.selection.kind === 'keys' ? options.selection.keys.slice(0, 1) : [];
    const selected = keys.some(
      (key) => neuTableIdentityToken(key) === neuTableIdentityToken(options.intent.key),
    );
    const next: NeuTableSelection<K, F> = {
      kind: 'keys',
      keys: selected && options.selectionOptions.allowClear ? [] : [options.intent.key],
    };
    return {
      change: createChange(options.selection, next, options.intent.source, options.loadedRows),
      anchor: options.intent.key,
    };
  }
  if (options.selection.kind === 'all-matching') {
    if (
      !neuTableRowMatchesSelectionScope(
        options.intent.row,
        options.selection.scope,
        options.columns,
        options.filterOptions,
      )
    ) {
      return { change: null, anchor: options.intent.key };
    }
    const next: NeuTableSelection<K, F> = {
      ...options.selection,
      excludedKeys: toggleKey(options.selection.excludedKeys, options.intent.key),
    };
    return {
      change: createChange(options.selection, next, options.intent.source, options.loadedRows),
      anchor: options.intent.key,
    };
  }

  let nextKeys: readonly K[];
  const isExplicitToggle = options.intent.source === 'checkbox';
  const anchorIndex = options.rangeRows.findIndex(
    ({ key }) =>
      options.anchor !== null &&
      neuTableIdentityToken(key) === neuTableIdentityToken(options.anchor),
  );
  const rowIndex = options.rangeRows.findIndex(
    ({ key }) => neuTableIdentityToken(key) === neuTableIdentityToken(options.intent.key),
  );
  if (
    options.selectionOptions.range &&
    options.intent.shiftKey &&
    anchorIndex >= 0 &&
    rowIndex >= 0
  ) {
    const [start, end] = anchorIndex < rowIndex ? [anchorIndex, rowIndex] : [rowIndex, anchorIndex];
    const rangeKeys = options.rangeRows
      .slice(start, end + 1)
      .filter(
        ({ row }) => !isNeuTableRowDisabled(row, options.selectionOptions, options.rowOptions),
      )
      .map(({ key }) => key);
    if (options.selectionOptions.modifier === 'replace' && !options.intent.platformModifier) {
      nextKeys = rangeKeys;
    } else {
      const tokens = keyTokens(options.selection.keys);
      nextKeys = [
        ...options.selection.keys,
        ...rangeKeys.filter((key) => !tokens.has(neuTableIdentityToken(key))),
      ];
    }
  } else if (
    isExplicitToggle ||
    options.selectionOptions.modifier === 'toggle' ||
    (options.selectionOptions.modifier === 'platform' && options.intent.platformModifier)
  ) {
    nextKeys = toggleKey(options.selection.keys, options.intent.key);
  } else {
    nextKeys = [options.intent.key];
  }
  const next: NeuTableSelection<K, F> = { kind: 'keys', keys: nextKeys };
  return {
    change: createChange(options.selection, next, options.intent.source, options.loadedRows),
    anchor: options.intent.key,
  };
}

export function proposeNeuTableToggleAll<
  T extends object,
  K extends NeuTableKey,
  F extends string,
>(options: {
  readonly selection: NeuTableSelection<K, F>;
  readonly selectionOptions: NeuTableSelectionOptions<T>;
  readonly rowOptions: NeuTableRowOptions<T, K>;
  readonly rows: readonly NeuTableSelectionRow<T, K>[];
  readonly loadedRows: readonly NeuTableSelectionRow<T, K>[];
  readonly currentScope: NeuTableSelectionScope<F>;
  readonly columns: readonly NeuTableColumn<T, F>[];
  readonly filterOptions: NeuTableFilterOptions<T, F>;
}): NeuTableSelectionChange<T, K, F> | null {
  if (options.selectionOptions.mode !== 'multiple') return null;
  if (options.selectionOptions.toggleAllScope === 'all-matching') {
    const sameScope =
      options.selection.kind === 'all-matching' &&
      areNeuTableSelectionScopesEqual(options.selection.scope, options.currentScope);
    const next: NeuTableSelection<K, F> =
      sameScope &&
      options.selection.kind === 'all-matching' &&
      options.selection.excludedKeys.length === 0
        ? { kind: 'keys', keys: [] }
        : { kind: 'all-matching', scope: options.currentScope, excludedKeys: [] };
    return createChange(options.selection, next, 'toggle-all', options.loadedRows);
  }
  const selectable = options.rows.filter(
    ({ row }) => !isNeuTableRowDisabled(row, options.selectionOptions, options.rowOptions),
  );
  if (selectable.length === 0) return null;
  const selected = selectedForRows({
    selection: options.selection,
    selectionOptions: options.selectionOptions,
    rows: selectable,
    columns: options.columns,
    filterOptions: options.filterOptions,
  });
  const allSelected = selected.size === selectable.length;
  let next: NeuTableSelection<K, F>;
  if (options.selection.kind === 'all-matching') {
    const selection = options.selection;
    const exclusions = new Set(selection.excludedKeys.map(neuTableIdentityToken));
    for (const { key } of selectable) {
      const token = neuTableIdentityToken(key);
      if (allSelected) exclusions.add(token);
      else exclusions.delete(token);
    }
    const byToken = new Map(
      options.loadedRows.map(({ key }) => [neuTableIdentityToken(key), key] as const),
    );
    next = {
      ...selection,
      excludedKeys: [...exclusions]
        .map(
          (token) =>
            byToken.get(token) ??
            selection.excludedKeys.find((key) => neuTableIdentityToken(key) === token),
        )
        .filter((key): key is K => key !== undefined),
    };
  } else {
    const selection = options.selection;
    const candidateTokens = keyTokens(selectable.map(({ key }) => key));
    next = {
      kind: 'keys',
      keys: allSelected
        ? selection.keys.filter((key) => !candidateTokens.has(neuTableIdentityToken(key)))
        : [
            ...selection.keys,
            ...selectable
              .map(({ key }) => key)
              .filter(
                (key) =>
                  !selection.keys.some(
                    (selectedKey) =>
                      neuTableIdentityToken(selectedKey) === neuTableIdentityToken(key),
                  ),
              ),
          ],
    };
  }
  return createChange(options.selection, next, 'toggle-all', options.loadedRows);
}

export function selectionRowsFromData<T, K extends NeuTableKey>(
  rows: readonly T[],
  rowKey: NeuRowKey<T, K>,
): readonly NeuTableSelectionRow<T, K>[] {
  return rows.map((row) => ({ row, key: rowKey(row) }));
}
