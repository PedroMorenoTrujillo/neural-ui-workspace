import {
  appendNeuTableFilterCondition,
  areNeuTableQuerySlicesEqual,
  createNeuTablePaginationPresentation,
  effectiveNeuTablePage,
  neuTableFilterValueFromText,
  proposeNeuTableFilters,
  proposeNeuTablePage,
  proposeNeuTablePageSize,
  proposeNeuTableSearch,
  proposeNeuTableSort,
  removeNeuTableFilterField,
  setNeuTableFilterCondition,
} from './internal/query-ui/neu-table-query-transitions';
import type {
  NeuFilterExpression,
  NeuTableFilterOptions,
  NeuTableQuery,
  NeuTableSortOptions,
} from './public/neu-table.types';

type Field = 'id' | 'name' | 'score';

const sortOptions: NeuTableSortOptions = {
  mode: 'single',
  removable: true,
  defaultDirection: 'asc',
  resetPageOnChange: true,
};
const filterOptions: NeuTableFilterOptions<Record<string, unknown>, Field> = {
  surfaces: ['row', 'menu', 'builder'],
  globalFields: ['name'],
  predicates: {},
  debounceMs: 0,
  commit: 'explicit',
};
const query = (overrides: Partial<NeuTableQuery<Field>> = {}): NeuTableQuery<Field> => ({
  page: 4,
  pageSize: 25,
  search: '',
  sort: [],
  filters: null,
  ...overrides,
});

describe('NeuTable 2 query UI pure transitions', () => {
  it('converts numeric field text without coercing string fields or invalid input', () => {
    expect(neuTableFilterValueFromText('greaterThan', '300', 240)).toBe(300);
    expect(neuTableFilterValueFromText('equals', '0', 240)).toBe(0);
    expect(neuTableFilterValueFromText('between', '10, 20', 240)).toEqual([10, 20]);
    expect(neuTableFilterValueFromText('in', '10, 20', 240)).toEqual([10, 20]);
    expect(neuTableFilterValueFromText('equals', '001', '001')).toBe('001');
    expect(neuTableFilterValueFromText('equals', '', 240)).toBe('');
    expect(neuTableFilterValueFromText('equals', 'bad', 240)).toBe('bad');
    expect(neuTableFilterValueFromText('equals', 'Infinity', 240)).toBe('Infinity');
  });
  it('compares filter condition semantics with an explicit value comparator', () => {
    const condition = (field: Field, rule: 'equals' | 'notEquals', value: unknown): NeuFilterExpression<Field> =>
      ({ kind: 'condition', field, rule, value });
    const base = query({ filters: condition('name', 'equals', 'Ada') });
    expect(areNeuTableQuerySlicesEqual(base, query({ filters: condition('name', 'equals', 'ada') }),
      sortOptions, (left, right) => String(left).toLowerCase() === String(right).toLowerCase()))
      .toBe(true);
    for (const filters of [
      condition('score', 'equals', 'Ada'),
      condition('name', 'notEquals', 'Ada'),
      condition('name', 'equals', 'Grace'),
      { kind: 'group' as const, operator: 'and' as const,
        children: [condition('name', 'equals', 'Ada')] },
    ]) {
      expect(areNeuTableQuerySlicesEqual(base, query({ filters }), sortOptions)).toBe(false);
    }
    const group = query({ filters: { kind: 'group', operator: 'or',
      children: [condition('name', 'equals', 'Ada')] } });
    expect(areNeuTableQuerySlicesEqual(group, query({ filters: { kind: 'group', operator: 'or',
      children: [condition('name', 'equals', 'Ada')] } }), sortOptions)).toBe(true);
    expect(areNeuTableQuerySlicesEqual(group, query({ filters: { kind: 'group', operator: 'or',
      children: [condition('name', 'equals', 'Grace')] } }), sortOptions)).toBe(false);
  });

  it('normalizes nonfinite pages and parses unary or list filter text', () => {
    expect(effectiveNeuTablePage(Number.NaN)).toBe(0);
    expect(effectiveNeuTablePage(2.9)).toBe(2);
    expect(neuTableFilterValueFromText('isNull', 'ignored')).toBeNull();
    expect(neuTableFilterValueFromText('between', ' a, , b ')).toEqual(['a', 'b']);
    expect(neuTableFilterValueFromText('in', 'one,two')).toEqual(['one', 'two']);
    expect(neuTableFilterValueFromText('contains', 'Ada')).toBe('Ada');
  });

  it('handles empty nested removal and appends to a matching filter group', () => {
    const item: NeuFilterExpression<Field> = { kind: 'condition', field: 'name', rule: 'equals', value: 'Ada' };
    const group: NeuFilterExpression<Field> = { kind: 'group', operator: 'and', children: [item] };
    expect(removeNeuTableFilterField(group, 'name')).toBeNull();
    expect(removeNeuTableFilterField(null, 'name')).toBeNull();
    expect(setNeuTableFilterCondition(null, item)).toEqual(item);
    expect(appendNeuTableFilterCondition(group, { kind: 'condition', field: 'score',
      rule: 'equals', value: 1 }, 'and')).toEqual({ kind: 'group', operator: 'and',
      children: [item, { kind: 'condition', field: 'score', rule: 'equals', value: 1 }] });
  });
  it('cycles single sort using default direction, removable policy and immutable snapshots', () => {
    const source = query();
    const ascending = proposeNeuTableSort({
      query: source,
      field: 'name',
      sortOptions,
      additive: false,
    })!;
    const descending = proposeNeuTableSort({
      query: ascending,
      field: 'name',
      sortOptions,
      additive: false,
    })!;
    const removed = proposeNeuTableSort({
      query: descending,
      field: 'name',
      sortOptions,
      additive: false,
    })!;

    expect(source).toEqual(query());
    expect(ascending.sort).toEqual([{ field: 'name', direction: 'asc' }]);
    expect(ascending.page).toBe(0);
    expect(descending.sort).toEqual([{ field: 'name', direction: 'desc' }]);
    expect(removed.sort).toEqual([]);
    expect(ascending.filters).toBe(source.filters);
  });

  it('supports descending defaults, non-removable cycles and ordered multiple sort', () => {
    const policy: NeuTableSortOptions = {
      ...sortOptions,
      mode: 'multiple',
      removable: false,
      defaultDirection: 'desc',
    };
    const first = proposeNeuTableSort({
      query: query(),
      field: 'score',
      sortOptions: policy,
      additive: true,
    })!;
    const second = proposeNeuTableSort({
      query: first,
      field: 'name',
      sortOptions: policy,
      additive: true,
    })!;
    const cycled = proposeNeuTableSort({
      query: second,
      field: 'score',
      sortOptions: policy,
      additive: true,
    })!;

    expect(second.sort).toEqual([
      { field: 'score', direction: 'desc' },
      { field: 'name', direction: 'desc' },
    ]);
    expect(cycled.sort).toEqual([
      { field: 'name', direction: 'desc' },
      { field: 'score', direction: 'asc' },
    ]);
    expect(proposeNeuTablePage({ query: query({ page: 2 }), page: 2, sortOptions })).toBeNull();
  });

  it('keeps search and filters independent and suppresses semantically equal proposals', () => {
    const filters: NeuFilterExpression<Field> = {
      kind: 'condition',
      field: 'score',
      rule: 'greaterThan',
      value: '10',
    };
    const source = query({ search: 'Ada', filters });
    const searched = proposeNeuTableSearch({ query: source, search: 'Grace', sortOptions })!;
    expect(searched.filters).toBe(filters);
    expect(
      proposeNeuTableSearch({
        query: { ...source, page: 0 },
        search: '  ada  ',
        sortOptions,
      }),
    ).toBeNull();

    const filtered = proposeNeuTableFilters({
      query: source,
      filters: { ...filters, value: '20' },
      sortOptions,
      filterOptions,
    })!;
    expect(filtered.search).toBe('Ada');
    expect(filtered.filters).not.toBe(filters);
  });

  it('retains the current page for sort, search and filter changes when configured', () => {
    const noReset = { ...sortOptions, resetPageOnChange: false };
    const source = query();
    expect(proposeNeuTableSort({ query: source, field: 'name', sortOptions: noReset, additive: false })?.page).toBe(4);
    expect(proposeNeuTableSearch({ query: source, search: 'Grace', sortOptions: noReset })?.page).toBe(4);
    expect(proposeNeuTableFilters({
      query: source,
      filters: { kind: 'condition', field: 'score', rule: 'equals', value: 10 },
      sortOptions: noReset,
      filterOptions,
    })?.page).toBe(4);
  });

  it('adds, edits and removes one filter without flattening nested AND/OR branches', () => {
    const nested: NeuFilterExpression<Field> = {
      kind: 'group',
      operator: 'or',
      children: [
        { kind: 'condition', field: 'name', rule: 'contains', value: 'a' },
        {
          kind: 'group',
          operator: 'and',
          children: [
            { kind: 'condition', field: 'score', rule: 'greaterThan', value: '10' },
            { kind: 'condition', field: 'id', rule: 'notEquals', value: '3' },
          ],
        },
      ],
    };
    const edited = setNeuTableFilterCondition(nested, {
      kind: 'condition',
      field: 'score',
      rule: 'lessThan',
      value: '90',
    });
    expect(edited).toEqual({
      ...nested,
      children: [
        nested.children[0],
        {
          kind: 'group',
          operator: 'and',
          children: [
            { kind: 'condition', field: 'score', rule: 'lessThan', value: '90' },
            nested.kind === 'group' && nested.children[1]?.kind === 'group'
              ? nested.children[1].children[1]
              : null,
          ],
        },
      ],
    });
    const removed = removeNeuTableFilterField(edited, 'score');
    expect(JSON.stringify(removed)).toContain('"operator":"or"');
    expect(JSON.stringify(removed)).toContain('"field":"id"');
    expect(JSON.stringify(removed)).not.toContain('"field":"score"');
    expect(
      appendNeuTableFilterCondition(
        removed,
        {
          kind: 'condition',
          field: 'score',
          rule: 'equals',
          value: '50',
        },
        'and',
      ),
    ).toMatchObject({ kind: 'group', operator: 'and' });
  });

  it('preserves the first normal-row index for every page-size transition', () => {
    expect(
      proposeNeuTablePageSize({
        query: query(),
        pageSize: 50,
        sortOptions,
        allowedPageSizes: [10, 25, 50],
      }),
    ).toMatchObject({ page: 2, pageSize: 50 });
    expect(
      proposeNeuTablePageSize({
        query: query(),
        pageSize: 10,
        sortOptions,
        allowedPageSizes: [10, 25, 50],
      }),
    ).toMatchObject({ page: 10, pageSize: 10 });
    expect(
      proposeNeuTablePageSize({
        query: query({ page: 0 }),
        pageSize: 50,
        sortOptions,
        allowedPageSizes: [50],
      }),
    ).toMatchObject({ page: 0, pageSize: 50 });
    expect(
      proposeNeuTablePageSize({
        query: query({ page: 4.9, pageSize: Number.NaN }),
        pageSize: 10,
        sortOptions,
        allowedPageSizes: [10],
      }),
    ).toMatchObject({ page: 0, pageSize: 10 });
    expect(
      proposeNeuTablePageSize({
        query: query({ page: 2, pageSize: 25 }),
        pageSize: 25,
        sortOptions,
        allowedPageSizes: [25],
      }),
    ).toBeNull();
    expect(
      proposeNeuTablePageSize({
        query: query(),
        pageSize: 13,
        sortOptions,
        allowedPageSizes: [10, 25, 50],
      }),
    ).toBeNull();
  });

  it('represents unknown totals and out-of-range applied pages without correction', () => {
    expect(
      createNeuTablePaginationPresentation({
        query: query({ page: 12, pageSize: 10 }),
        total: 21,
        visibleNormalCount: 0,
      }),
    ).toMatchObject({ page: 12, pageCount: 3, rangeStart: 0, rangeEnd: 0, canNext: false });
    expect(
      createNeuTablePaginationPresentation({
        query: query({ page: 3, pageSize: 10 }),
        total: null,
        visibleNormalCount: 4,
      }),
    ).toMatchObject({ humanPage: 4, pageCount: null, rangeStart: 31, rangeEnd: 34, canNext: true });
  });
});
