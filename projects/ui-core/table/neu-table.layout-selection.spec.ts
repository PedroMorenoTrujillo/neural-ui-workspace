import {
  normalizeNeuTableColumns,
  normalizeNeuTableResize,
  projectNeuTableLayout,
  proposeNeuTableMove,
  proposeNeuTablePin,
  proposeNeuTableReorder,
  proposeNeuTableResize,
  proposeNeuTableVisibility,
} from './internal/layout/neu-table-layout';
import {
  areNeuTableSelectionScopesEqual,
  areNeuTableSelectionsEqual,
  createNeuTableSelectionScope,
  projectNeuTableSelection,
  proposeNeuTableRowSelection,
  proposeNeuTableToggleAll,
  selectionRowsFromData,
} from './internal/selection/neu-table-selection';
import type {
  NeuTableColumn,
  NeuTableFilterOptions,
  NeuTableLayoutState,
  NeuTableQuery,
  NeuTableRowOptions,
  NeuTableSelection,
  NeuTableSelectionOptions,
  NeuTableSelectionScope,
} from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly score: number;
  readonly disabled?: boolean;
}

type Field = 'id' | 'name' | 'score';

const rows: readonly Row[] = [
  { id: 1, name: 'Ada', score: 10 },
  { id: 2, name: 'Grace', score: 20 },
  { id: 3, name: 'Linus', score: 30, disabled: true },
  { id: 4, name: 'Margaret', score: 40 },
];
const columns: readonly NeuTableColumn<Row, Field>[] = [
  { id: 'id', header: 'ID', field: 'id', minWidth: '40px', maxWidth: '120px' },
  { id: 'name', header: 'Name', field: 'name' },
  { id: 'score', header: 'Score', field: 'score' },
];
const layout: NeuTableLayoutState = {
  order: [],
  hidden: [],
  widths: {},
  pinnedStart: [],
  pinnedEnd: [],
};
const query: NeuTableQuery<Field> = {
  page: 0,
  pageSize: 25,
  search: '',
  sort: [],
  filters: null,
};
const filters: NeuTableFilterOptions<Row, Field> = {
  surfaces: [],
  globalFields: ['name'],
  predicates: {},
  debounceMs: 0,
  commit: 'immediate',
};
const rowOptions: NeuTableRowOptions<Row, number> = {
  reorderable: false,
  isDisabled: (row) => row.disabled ?? false,
};
const multiple = (
  overrides: Partial<Extract<NeuTableSelectionOptions<Row>, { mode: 'multiple' }>> = {},
): Extract<NeuTableSelectionOptions<Row>, { mode: 'multiple' }> => ({
  mode: 'multiple',
  indicator: 'checkbox',
  selectOnRowClick: true,
  modifier: 'toggle',
  range: true,
  toggleAllScope: 'page',
  ...overrides,
});
const selectionRows = selectionRowsFromData(rows, (row) => row.id);

describe('NeuTable 2 pure controlled layout', () => {
  it('normalizes stable column identity and diagnoses duplicates deterministically', () => {
    const reconstructed = columns.map((column) => ({ ...column }));
    expect(normalizeNeuTableColumns(reconstructed, true).map((column) => column.id)).toEqual([
      'id',
      'name',
      'score',
    ]);
    expect(() => normalizeNeuTableColumns([...columns, { ...columns[0]! }], true)).toThrowError(
      /duplicate column id: id/i,
    );
    expect(normalizeNeuTableColumns([...columns, { ...columns[0]! }], false).length).toBe(3);
  });

  it('projects applied order, visibility and pinning without mutating inputs', () => {
    const applied: NeuTableLayoutState = {
      order: ['score', 'unknown', 'id'],
      hidden: ['name'],
      widths: { score: '80px' },
      pinnedStart: ['id'],
      pinnedEnd: ['score', 'id'],
    };
    const projected = projectNeuTableLayout(columns, applied);
    expect(projected.columns.map((column) => column.id)).toEqual(['id', 'score']);
    expect(projected.hiddenColumns.map((column) => column.id)).toEqual(['name']);
    expect(projected.pinById.get('id')).toBe('start');
    expect(projected.pinById.get('score')).toBe('end');
    expect(applied.order).toEqual(['score', 'unknown', 'id']);
  });

  it('creates immutable visibility, pin and reorder proposals with pinned boundaries', () => {
    expect(proposeNeuTableVisibility(layout, 'name', false)?.next.hidden).toEqual(['name']);
    expect(proposeNeuTableVisibility({ ...layout, hidden: ['name'] }, 'name', false)).toBeNull();
    expect(proposeNeuTablePin(layout, 'id', 'start')?.next.pinnedStart).toEqual(['id']);

    const ordered = { ...layout, order: ['id', 'name', 'score'] };
    expect(proposeNeuTableReorder(columns, ordered, 'score', 'id')?.next.order).toEqual([
      'score',
      'id',
      'name',
    ]);
    const pinned = { ...ordered, pinnedStart: ['id'] };
    expect(proposeNeuTableReorder(columns, pinned, 'id', 'name')).toBeNull();
    expect(proposeNeuTableMove(columns, pinned, 'id', 1)).toBeNull();
    expect(ordered.order).toEqual(['id', 'name', 'score']);
  });

  it('normalizes resize values and constraints without NaN, Infinity or negatives', () => {
    expect(normalizeNeuTableResize(columns[0]!, 10)).toBe('40px');
    expect(normalizeNeuTableResize(columns[0]!, 200)).toBe('120px');
    expect(normalizeNeuTableResize(columns[0]!, Number.NaN)).toBeNull();
    expect(normalizeNeuTableResize(columns[0]!, Number.POSITIVE_INFINITY)).toBeNull();
    expect(proposeNeuTableResize(layout, columns[0]!, 88.4)?.next.widths['id']).toBe('88px');
  });
});

describe('NeuTable 2 pure controlled selection', () => {
  it('invalidates an all-matching scope when its nested filter semantics change', () => {
    const condition = { kind: 'condition' as const, field: 'score' as const, rule: 'greaterThan' as const, value: 20 };
    const base: NeuTableSelectionScope<Field> = {
      search: '  GRACE  ',
      globalFields: ['name', 'score'],
      filters: { kind: 'group', operator: 'and', children: [condition] },
    };
    const equivalent: NeuTableSelectionScope<Field> = {
      search: 'grace',
      globalFields: ['name', 'score'],
      filters: { kind: 'group', operator: 'and', children: [{ ...condition }] },
    };
    expect(areNeuTableSelectionScopesEqual(base, equivalent)).toBe(true);
    expect(areNeuTableSelectionScopesEqual(base, {
      ...equivalent,
      filters: { kind: 'group', operator: 'and', children: [{ ...condition, value: 21 }] },
    })).toBe(false);
    expect(areNeuTableSelectionScopesEqual(base, {
      ...equivalent,
      filters: { kind: 'group', operator: 'or', children: [condition] },
    })).toBe(false);
    expect(areNeuTableSelectionScopesEqual(base, {
      ...equivalent,
      globalFields: ['score', 'name'],
    })).toBe(false);
    expect(areNeuTableSelectionScopesEqual(base, { ...equivalent, filters: null })).toBe(false);
  });

  it('projects key membership by exact K and uses only the first key in single mode', () => {
    const single: NeuTableSelectionOptions<Row> = {
      mode: 'single',
      indicator: 'radio',
      selectOnRowClick: true,
      allowClear: false,
    };
    const projection = projectNeuTableSelection({
      selection: { kind: 'keys', keys: [2, 4] },
      selectionOptions: single,
      rowOptions,
      rows: selectionRows,
      headerRows: selectionRows,
      columns,
      filterOptions: filters,
      currentScope: createNeuTableSelectionScope(query, filters),
    });
    expect(projection.isSelected(2)).toBe(true);
    expect(projection.isSelected(4)).toBe(false);
  });

  it('toggles multiple keys deterministically, suppresses same state and preserves inputs', () => {
    const applied = Object.freeze({ kind: 'keys' as const, keys: Object.freeze([1, 2]) });
    const result = proposeNeuTableRowSelection({
      selection: applied,
      selectionOptions: multiple(),
      rowOptions,
      intent: {
        row: rows[1]!,
        key: 2,
        source: 'checkbox',
        shiftKey: false,
        platformModifier: false,
      },
      rangeRows: selectionRows,
      loadedRows: selectionRows,
      anchor: null,
      columns,
      filterOptions: filters,
    });
    expect(result.change?.next).toEqual({ kind: 'keys', keys: [1] });
    expect(result.change?.removedKeys).toEqual([2]);
    expect(applied.keys).toEqual([1, 2]);
    expect(areNeuTableSelectionsEqual(applied, { kind: 'keys', keys: [1, 2] })).toBe(true);
  });

  it('implements replace/platform policy and range over visible order while skipping disabled rows', () => {
    const range = proposeNeuTableRowSelection({
      selection: { kind: 'keys', keys: [99] },
      selectionOptions: multiple({ modifier: 'replace' }),
      rowOptions,
      intent: {
        row: rows[3]!,
        key: 4,
        source: 'row',
        shiftKey: true,
        platformModifier: false,
      },
      rangeRows: selectionRows,
      loadedRows: selectionRows,
      anchor: 1,
      columns,
      filterOptions: filters,
    });
    expect(range.change?.next).toEqual({ kind: 'keys', keys: [1, 2, 4] });

    const platform = proposeNeuTableRowSelection({
      selection: { kind: 'keys', keys: [1] },
      selectionOptions: multiple({ modifier: 'platform', range: false }),
      rowOptions,
      intent: {
        row: rows[1]!,
        key: 2,
        source: 'row',
        shiftKey: false,
        platformModifier: false,
      },
      rangeRows: selectionRows,
      loadedRows: selectionRows,
      anchor: null,
      columns,
      filterOptions: filters,
    });
    expect(platform.change?.next).toEqual({ kind: 'keys', keys: [2] });
  });

  it('blocks disabled gestures without deleting parent-applied disabled keys', () => {
    const projection = projectNeuTableSelection({
      selection: { kind: 'keys', keys: [3] },
      selectionOptions: multiple(),
      rowOptions,
      rows: selectionRows,
      headerRows: selectionRows,
      columns,
      filterOptions: filters,
      currentScope: createNeuTableSelectionScope(query, filters),
    });
    expect(projection.isSelected(3)).toBe(true);
    expect(projection.selectableCount).toBe(3);
    const blocked = proposeNeuTableRowSelection({
      selection: { kind: 'keys', keys: [3] },
      selectionOptions: multiple(),
      rowOptions,
      intent: {
        row: rows[2]!,
        key: 3,
        source: 'checkbox',
        shiftKey: false,
        platformModifier: false,
      },
      rangeRows: selectionRows,
      loadedRows: selectionRows,
      anchor: null,
      columns,
      filterOptions: filters,
    });
    expect(blocked.change).toBeNull();
  });

  it('represents all matching without enumeration and toggles exclusions in place', () => {
    const scopedQuery: NeuTableQuery<Field> = {
      ...query,
      filters: { kind: 'condition', field: 'score', rule: 'greaterThanOrEqual', value: 20 },
    };
    const applied: NeuTableSelection<number, Field> = {
      kind: 'all-matching',
      scope: createNeuTableSelectionScope(scopedQuery, filters),
      excludedKeys: [4],
    };
    const projection = projectNeuTableSelection({
      selection: applied,
      selectionOptions: multiple({ toggleAllScope: 'all-matching' }),
      rowOptions,
      rows: selectionRows,
      headerRows: selectionRows,
      columns,
      filterOptions: filters,
      currentScope: createNeuTableSelectionScope(scopedQuery, filters),
    });
    expect(projection.isSelected(1)).toBe(false);
    expect(projection.isSelected(2)).toBe(true);
    expect(projection.isSelected(4)).toBe(false);
    expect(projection.headerState).toBe('indeterminate');

    const toggled = proposeNeuTableRowSelection({
      selection: applied,
      selectionOptions: multiple({ toggleAllScope: 'all-matching' }),
      rowOptions,
      intent: {
        row: rows[3]!,
        key: 4,
        source: 'checkbox',
        shiftKey: false,
        platformModifier: false,
      },
      rangeRows: selectionRows,
      loadedRows: selectionRows,
      anchor: null,
      columns,
      filterOptions: filters,
    });
    expect(toggled.change?.next).toEqual({ ...applied, excludedKeys: [] });
    expect(toggled.change?.addedKeys).toEqual([4]);
  });

  it('keeps stale all-matching scope applied across query changes without proposals', () => {
    const oldScope = createNeuTableSelectionScope({ ...query, search: 'grace' }, filters);
    const newScope = createNeuTableSelectionScope({ ...query, search: 'ada' }, filters);
    const projection = projectNeuTableSelection({
      selection: { kind: 'all-matching', scope: oldScope, excludedKeys: [] },
      selectionOptions: multiple({ toggleAllScope: 'all-matching' }),
      rowOptions,
      rows: selectionRows,
      headerRows: selectionRows,
      columns,
      filterOptions: filters,
      currentScope: newScope,
    });
    expect(projection.isSelected(2)).toBe(true);
    expect(projection.isSelected(1)).toBe(false);
    expect(projection.headerState).toBe('indeterminate');
  });

  it('derives header state and toggles local/all-matching scopes without loaded-key inference', () => {
    const localProjection = projectNeuTableSelection({
      selection: { kind: 'keys', keys: [1, 2, 99] },
      selectionOptions: multiple(),
      rowOptions,
      rows: selectionRows,
      headerRows: selectionRows.slice(0, 2),
      columns,
      filterOptions: filters,
      currentScope: createNeuTableSelectionScope(query, filters),
    });
    expect(localProjection.headerState).toBe('checked');
    const clearedPage = proposeNeuTableToggleAll({
      selection: { kind: 'keys', keys: [1, 2, 99] },
      selectionOptions: multiple(),
      rowOptions,
      rows: selectionRows.slice(0, 2),
      loadedRows: selectionRows,
      currentScope: createNeuTableSelectionScope(query, filters),
      columns,
      filterOptions: filters,
    });
    expect(clearedPage?.next).toEqual({ kind: 'keys', keys: [99] });

    const selectBackend = proposeNeuTableToggleAll({
      selection: { kind: 'keys', keys: [1, 2, 4] },
      selectionOptions: multiple({ toggleAllScope: 'all-matching' }),
      rowOptions,
      rows: selectionRows,
      loadedRows: selectionRows,
      currentScope: createNeuTableSelectionScope(query, filters),
      columns,
      filterOptions: filters,
    });
    expect(selectBackend?.next).toEqual({
      kind: 'all-matching',
      scope: createNeuTableSelectionScope(query, filters),
      excludedKeys: [],
    });
    expect(selectBackend?.addedKeys).toEqual([]);
  });

  it('applies single selection clear policy and preserves a rejected repeated proposal', () => {
    const options = { mode: 'single' as const, indicator: 'radio' as const,
      selectOnRowClick: true, allowClear: true };
    const base = {
      selection: { kind: 'keys' as const, keys: [2] }, selectionOptions: options, rowOptions,
      intent: { row: rows[1]!, key: 2, source: 'row' as const,
        shiftKey: false, platformModifier: false },
      rangeRows: selectionRows, loadedRows: selectionRows, anchor: null,
      columns, filterOptions: filters,
    };
    expect(proposeNeuTableRowSelection(base).change?.next).toEqual({ kind: 'keys', keys: [] });
    expect(proposeNeuTableRowSelection({ ...base, selectionOptions: { ...options, allowClear: false } }).change).toBeNull();
    expect(proposeNeuTableRowSelection({ ...base, selection: { kind: 'keys', keys: [] } }).change?.next)
      .toEqual({ kind: 'keys', keys: [2] });
    expect(proposeNeuTableRowSelection({ ...base, selection: {
      kind: 'all-matching', scope: createNeuTableSelectionScope(query, filters), excludedKeys: [],
    } }).change?.next).toEqual({ kind: 'keys', keys: [2] });
  });

  it('covers reverse range and additive platform selection without disabled rows', () => {
    const selection = { kind: 'keys' as const, keys: [99, 4] };
    const base = {
      selection, selectionOptions: multiple({ modifier: 'replace' }), rowOptions,
      intent: { row: rows[0]!, key: 1, source: 'row' as const,
        shiftKey: true, platformModifier: true },
      rangeRows: selectionRows, loadedRows: selectionRows, anchor: 4,
      columns, filterOptions: filters,
    };
    expect(proposeNeuTableRowSelection(base).change?.next).toEqual({ kind: 'keys', keys: [99, 4, 1, 2] });
    expect(proposeNeuTableRowSelection({ ...base, intent: {
      ...base.intent, key: 88, row: rows[0]!, shiftKey: false,
    } }).change?.next).toEqual({ kind: 'keys', keys: [88] });
  });

  it('projects partial headers and all-matching exclusions across current scopes', () => {
    const scope = createNeuTableSelectionScope(query, filters);
    const base = { selectionOptions: multiple(), rowOptions, rows: selectionRows,
      headerRows: selectionRows, columns, filterOptions: filters, currentScope: scope };
    expect(projectNeuTableSelection({ ...base, selection: { kind: 'keys', keys: [1] } }).headerState)
      .toBe('indeterminate');
    expect(projectNeuTableSelection({ ...base, selection: { kind: 'keys', keys: [] } }).headerState)
      .toBe('unchecked');
    const backend = { ...base, selectionOptions: multiple({ toggleAllScope: 'all-matching' }) };
    expect(projectNeuTableSelection({ ...backend, selection: {
      kind: 'all-matching', scope, excludedKeys: [],
    } }).headerState).toBe('checked');
    expect(projectNeuTableSelection({ ...backend, selection: {
      kind: 'keys', keys: [1],
    } }).headerState).toBe('indeterminate');
  });

  it('toggles an all-matching scope off and clears only selectable page keys', () => {
    const scope = createNeuTableSelectionScope(query, filters);
    const base = { selectionOptions: multiple({ toggleAllScope: 'all-matching' }), rowOptions,
      rows: selectionRows, loadedRows: selectionRows, currentScope: scope, columns,
      filterOptions: filters };
    expect(proposeNeuTableToggleAll({ ...base, selection: {
      kind: 'all-matching', scope, excludedKeys: [],
    } })?.next).toEqual({ kind: 'keys', keys: [] });
    expect(proposeNeuTableToggleAll({ ...base, selection: {
      kind: 'all-matching', scope, excludedKeys: [2],
    } })?.next).toEqual({ kind: 'all-matching', scope, excludedKeys: [] });
    expect(proposeNeuTableToggleAll({ ...base, selectionOptions: multiple(),
      selection: { kind: 'keys', keys: [1] }, rows: [],
    })).toBeNull();
    expect(proposeNeuTableToggleAll({ ...base, selectionOptions: multiple(),
      selection: { kind: 'keys', keys: [1] },
    })?.next).toEqual({ kind: 'keys', keys: [1, 2, 4] });
  });

  it('rejects a changed filter kind and a changed all-matching selection scope', () => {
    const condition = { kind: 'condition' as const, field: 'score' as const, rule: 'greaterThan' as const, value: 20 };
    const first: NeuTableSelectionScope<Field> = {
      search: '', globalFields: ['name'], filters: condition,
    };
    const second: NeuTableSelectionScope<Field> = {
      ...first, filters: { kind: 'group', operator: 'and', children: [condition] },
    };
    expect(areNeuTableSelectionScopesEqual(first, second)).toBe(false);
    expect(areNeuTableSelectionsEqual(
      { kind: 'all-matching', scope: first, excludedKeys: [] },
      { kind: 'all-matching', scope: second, excludedKeys: [] },
    )).toBe(false);
  });

  it('keeps toggle-all unavailable in single-selection mode', () => {
    const scope = createNeuTableSelectionScope(query, filters);
    expect(proposeNeuTableToggleAll({
      selection: { kind: 'keys', keys: [1] },
      selectionOptions: { mode: 'single', indicator: 'radio', selectOnRowClick: true, allowClear: true },
      rowOptions,
      rows: selectionRows,
      loadedRows: selectionRows,
      currentScope: scope,
      columns,
      filterOptions: filters,
    })).toBeNull();
  });

  it('toggles page exclusions against an applied all-matching selection', () => {
    const scope = createNeuTableSelectionScope(query, filters);
    const base = {
      selectionOptions: multiple({ toggleAllScope: 'page' }), rowOptions,
      rows: selectionRows.slice(0, 2), loadedRows: selectionRows.slice(0, 2),
      currentScope: scope, columns, filterOptions: filters,
    };
    const applied: NeuTableSelection<number, Field> = {
      kind: 'all-matching', scope, excludedKeys: [],
    };
    const excluded = proposeNeuTableToggleAll({ ...base, selection: applied });
    expect(excluded?.next).toEqual({ ...applied, excludedKeys: [1, 2] });
    const restored = proposeNeuTableToggleAll({
      ...base, selection: excluded!.next,
    });
    expect(restored?.next).toEqual(applied);
  });
});
