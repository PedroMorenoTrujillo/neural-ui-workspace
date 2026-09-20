import {
  areNeuTableQueriesSemanticallyEqual,
  createNeuTableFieldResolver,
  evaluateNeuTableFilterRule,
  filterNeuTableRows,
  normalizeNeuTableQuery,
  paginateNeuTableRows,
  runNeuTableClientPipeline,
  searchNeuTableRows,
  sortNeuTableRows,
} from './internal/client-pipeline/neu-table-client-pipeline';
import type {
  NeuFilterExpression,
  NeuTableColumn,
  NeuTableFilterOptions,
  NeuTablePaginationOptions,
  NeuTableQuery,
  NeuTableRowOptions,
  NeuTableSortOptions,
} from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly score: number;
  readonly enabled: boolean;
  readonly group?: string;
  readonly value?: unknown;
  readonly pin?: 'start' | 'end';
  readonly nested?: { readonly label: string };
}

type Field = 'id' | 'name' | 'score' | 'enabled' | 'group' | 'value' | 'nested.label';

const columns: readonly NeuTableColumn<Row, Field>[] = [
  { id: 'id', header: 'ID', field: 'id' },
  { id: 'name', header: 'Name', field: 'name' },
  { id: 'score', header: 'Score', field: 'score' },
  { id: 'enabled', header: 'Enabled', field: 'enabled' },
  { id: 'group', header: 'Group', field: 'group' },
  { id: 'value', header: 'Value', field: 'value' },
  { id: 'nested', header: 'Nested', field: 'nested.label' },
];

const rows: readonly Row[] = [
  {
    id: 1,
    name: '  ÁDA  Lovelace ',
    score: 20,
    enabled: true,
    group: 'b',
    nested: { label: 'hidden' },
  },
  { id: 2, name: 'Grace Hopper', score: 10, enabled: false, group: 'a' },
  { id: 3, name: 'Linus Torvalds', score: 10, enabled: true, group: 'a' },
  { id: 4, name: 'Margaret Hamilton', score: 30, enabled: false, group: 'b' },
];

const sortOptions: NeuTableSortOptions = {
  mode: 'multiple',
  removable: true,
  defaultDirection: 'asc',
  resetPageOnChange: true,
};

const filterOptions: NeuTableFilterOptions<Row, Field> = {
  surfaces: [],
  globalFields: ['name', 'score', 'enabled'],
  predicates: {},
  debounceMs: 0,
  commit: 'immediate',
};

const paginationOptions: NeuTablePaginationOptions = {
  enabled: true,
  pageSizeOptions: [2],
  position: 'bottom',
  report: 'none',
  showPageJump: false,
};

const rowOptions: NeuTableRowOptions<Row, number> = {
  reorderable: false,
  pin: (row) => row.pin ?? null,
};

const query = (overrides: Partial<NeuTableQuery<Field>> = {}): NeuTableQuery<Field> => ({
  page: 0,
  pageSize: 25,
  search: '',
  sort: [],
  filters: null,
  ...overrides,
});

describe('NeuTable 2 pure client pipeline', () => {
  it('implements the closed filter rule set and rejects invalid runtime operands', () => {
    expect(evaluateNeuTableFilterRule(1, 'equals', 1)).toBe(true);
    expect(evaluateNeuTableFilterRule(Number.NaN, 'equals', Number.NaN)).toBe(true);
    expect(evaluateNeuTableFilterRule(1, 'notEquals', 2)).toBe(true);
    expect(evaluateNeuTableFilterRule(' Café  au lait ', 'contains', 'CAFÉ AU')).toBe(true);
    expect(evaluateNeuTableFilterRule('alpha', 'notContains', 'z')).toBe(true);
    expect(evaluateNeuTableFilterRule('alpha', 'startsWith', ' AL')).toBe(true);
    expect(evaluateNeuTableFilterRule('alpha', 'endsWith', 'HA ')).toBe(true);
    expect(evaluateNeuTableFilterRule(1, 'lessThan', 2)).toBe(true);
    expect(evaluateNeuTableFilterRule(2, 'lessThanOrEqual', 2)).toBe(true);
    expect(evaluateNeuTableFilterRule(3n, 'greaterThan', 2n)).toBe(true);
    expect(evaluateNeuTableFilterRule('b', 'greaterThanOrEqual', 'b')).toBe(true);
    expect(evaluateNeuTableFilterRule(2, 'between', [1, 2])).toBe(true);
    expect(evaluateNeuTableFilterRule('b', 'in', ['a', 'b'])).toBe(true);
    expect(evaluateNeuTableFilterRule('c', 'notIn', ['a', 'b'])).toBe(true);
    expect(evaluateNeuTableFilterRule(undefined, 'isNull', null)).toBe(true);
    expect(evaluateNeuTableFilterRule(0, 'isNotNull', null)).toBe(true);
    expect(evaluateNeuTableFilterRule('   ', 'isEmpty', null)).toBe(true);
    expect(evaluateNeuTableFilterRule(false, 'isNotEmpty', null)).toBe(true);

    expect(evaluateNeuTableFilterRule(10, 'contains', '1')).toBe(false);
    expect(evaluateNeuTableFilterRule(10, 'notContains', '1')).toBe(false);
    expect(evaluateNeuTableFilterRule('1', 'lessThan', 2)).toBe(false);
    expect(evaluateNeuTableFilterRule(2, 'between', [1])).toBe(false);
    expect(evaluateNeuTableFilterRule(2, 'in', 2)).toBe(false);
    expect(evaluateNeuTableFilterRule(2, 'notIn', 2)).toBe(true);
    expect(evaluateNeuTableFilterRule(null, 'isEmpty', null)).toBe(false);
    expect(evaluateNeuTableFilterRule(null, 'isNotEmpty', null)).toBe(false);
    expect(evaluateNeuTableFilterRule(1, 'futureRule', 1)).toBe(false);
  });

  it('searches only declared primitive fields with deterministic normalization', () => {
    const resolver = createNeuTableFieldResolver(columns);
    expect(searchNeuTableRows(rows, 'áda lov', ['name'], resolver).map((row) => row.id)).toEqual([
      1,
    ]);
    expect(searchNeuTableRows(rows, 'true', ['enabled'], resolver).map((row) => row.id)).toEqual([
      1, 3,
    ]);
    expect(searchNeuTableRows(rows, '10', ['score'], resolver).map((row) => row.id)).toEqual([
      2, 3,
    ]);
    expect(searchNeuTableRows(rows, '', ['name'], resolver)).toBe(rows);
    expect(searchNeuTableRows(rows, 'hidden', ['nested.label'], resolver)).toEqual([]);
  });

  it('uses accessor precedence even for falsy values and evaluates nested AND/OR ASTs', () => {
    const accessorColumns: readonly NeuTableColumn<Row, Field>[] = [
      {
        id: 'name',
        header: 'Name',
        field: 'name',
        value: () => '',
        filter: { field: 'name', value: () => 'ignored', rules: ['equals'], defaultRule: 'equals' },
      },
    ];
    const accessorResolver = createNeuTableFieldResolver(accessorColumns);
    expect(accessorResolver.resolve(rows[0]!, 'name')).toBe('');

    const expression: NeuFilterExpression<Field> = {
      kind: 'group',
      operator: 'and',
      children: [
        { kind: 'condition', field: 'score', rule: 'greaterThanOrEqual', value: 10 },
        {
          kind: 'group',
          operator: 'or',
          children: [
            { kind: 'condition', field: 'group', rule: 'equals', value: 'a' },
            { kind: 'condition', field: 'name', rule: 'startsWith', value: 'margaret' },
          ],
        },
      ],
    };
    expect(
      filterNeuTableRows(rows, expression, createNeuTableFieldResolver(columns), filterOptions).map(
        (row) => row.id,
      ),
    ).toEqual([2, 3, 4]);
  });

  it('normalizes evaluation only, deduplicates sort and compares effective queries', () => {
    const source = query({
      page: -2.4,
      pageSize: Number.NaN,
      search: '  HELLO   WORLD ',
      sort: [
        { field: 'score', direction: 'desc' },
        { field: 'score', direction: 'asc' },
        { field: 'name', direction: 'asc' },
      ],
      filters: { kind: 'group', operator: 'and', children: [] },
    });
    const effective = normalizeNeuTableQuery(source, { ...sortOptions, mode: 'single' });
    expect(effective).toEqual({
      page: 0,
      pageSize: 1,
      search: 'hello world',
      sort: [{ field: 'score', direction: 'desc' }],
      filters: null,
    });
    expect(source.page).toBe(-2.4);
    expect(source.sort.length).toBe(3);
    expect(areNeuTableQueriesSemanticallyEqual(effective, { ...effective })).toBe(true);
  });

  it('sorts stably across default categories, nullish and non-comparable values', () => {
    const values: readonly Row[] = [
      { id: 1, name: 'one', score: 0, enabled: false, value: null },
      { id: 2, name: 'two', score: 0, enabled: false, value: Number.NaN },
      { id: 3, name: 'three', score: 0, enabled: false, value: 2 },
      { id: 4, name: 'four', score: 0, enabled: false, value: 1 },
      { id: 5, name: 'five', score: 0, enabled: false, value: {} },
      { id: 6, name: 'six', score: 0, enabled: false, value: undefined },
      { id: 7, name: 'seven', score: 0, enabled: false, value: new Date('invalid') },
    ];
    const resolver = createNeuTableFieldResolver(columns);
    expect(
      sortNeuTableRows(values, [{ field: 'value', direction: 'asc' }], resolver).map(
        (row) => row.id,
      ),
    ).toEqual([4, 3, 2, 5, 7, 1, 6]);
    expect(
      sortNeuTableRows(values, [{ field: 'value', direction: 'desc' }], resolver).map(
        (row) => row.id,
      ),
    ).toEqual([3, 4, 2, 5, 7, 1, 6]);

    const heterogeneous: readonly Row[] = [
      { id: 1, name: '', score: 0, enabled: false, value: 'a' },
      { id: 2, name: '', score: 0, enabled: false, value: 2n },
      { id: 3, name: '', score: 0, enabled: false, value: 3 },
      { id: 4, name: '', score: 0, enabled: false, value: true },
      { id: 5, name: '', score: 0, enabled: false, value: new Date(0) },
    ];
    expect(
      sortNeuTableRows(heterogeneous, [{ field: 'value', direction: 'asc' }], resolver).map(
        (row) => row.id,
      ),
    ).toEqual([4, 3, 2, 1, 5]);
    expect(
      sortNeuTableRows(heterogeneous, [{ field: 'value', direction: 'desc' }], resolver).map(
        (row) => row.id,
      ),
    ).toEqual([5, 1, 2, 3, 4]);
  });

  it('composes multi-sort lexicographically and honors a custom comparator', () => {
    const resolver = createNeuTableFieldResolver(columns);
    expect(
      sortNeuTableRows(
        rows,
        [
          { field: 'group', direction: 'asc' },
          { field: 'score', direction: 'desc' },
        ],
        resolver,
      ).map((row) => row.id),
    ).toEqual([2, 3, 4, 1]);

    const custom = createNeuTableFieldResolver<Row, Field>([
      {
        id: 'name',
        header: 'Name',
        sort: { field: 'name', compare: (left, right) => left.name.length - right.name.length },
      },
    ]);
    expect(
      sortNeuTableRows(rows, [{ field: 'name', direction: 'asc' }], custom).map((row) => row.id),
    ).toEqual([2, 3, 1, 4]);
  });

  it('normalizes zero-based pages without clamping an out-of-range page', () => {
    expect(paginateNeuTableRows(rows, -2, Number.NaN, true).rows.map((row) => row.id)).toEqual([1]);
    const beyond = paginateNeuTableRows(rows, 99, 2, true);
    expect(beyond.rows).toEqual([]);
    expect(beyond.page).toBe(99);
    expect(paginateNeuTableRows(rows, 2, 2, false).rows).toBe(rows);
  });

  it('keeps pinned rows outside query membership, paging and counts', () => {
    const source: readonly Row[] = [
      { ...rows[0]!, pin: 'end' },
      rows[1]!,
      { ...rows[2]!, pin: 'start' },
      rows[3]!,
    ];
    const result = runNeuTableClientPipeline({
      data: source,
      dataMode: 'client',
      columns,
      query: query({ page: 0, pageSize: 1, search: 'margaret' }),
      rowKey: (row) => row.id,
      rowOptions,
      sortOptions,
      filterOptions,
      paginationOptions,
    });
    expect(result.rows.map((row) => row.id)).toEqual([3, 4, 1]);
    expect(result.sourceNormalCount).toBe(2);
    expect(result.matchedNormalCount).toBe(1);
    expect(result.pageNormalCount).toBe(1);
    expect(() =>
      runNeuTableClientPipeline({
        data: [rows[0]!, { ...rows[0]!, name: 'duplicate filtered out' }],
        dataMode: 'client',
        columns,
        query: query({ search: 'missing' }),
        rowKey: (row) => row.id,
        rowOptions,
        sortOptions,
        filterOptions,
        paginationOptions,
        diagnoseDuplicateKeys: true,
      }),
    ).toThrowError(/duplicate row key/i);
  });

  it('bypasses client query stages in remote mode while retaining pinned presentation', () => {
    const source: readonly Row[] = [{ ...rows[0]!, pin: 'end' }, rows[1]!, rows[2]!];
    const result = runNeuTableClientPipeline({
      data: source,
      dataMode: 'remote',
      columns,
      query: query({
        page: 9,
        pageSize: 1,
        search: 'missing',
        sort: [{ field: 'id', direction: 'desc' }],
      }),
      rowKey: (row) => row.id,
      rowOptions,
      sortOptions,
      filterOptions,
      paginationOptions,
    });
    expect(result.rows.map((row) => row.id)).toEqual([2, 3, 1]);
    expect(result.matchedNormalCount).toBe(2);
  });

  it('is deterministic and leaves deeply frozen inputs untouched', () => {
    const frozenRows = Object.freeze(rows.map((row) => Object.freeze({ ...row })));
    const frozenQuery = Object.freeze(
      query({ sort: Object.freeze([{ field: 'score', direction: 'asc' }]) }),
    );
    const options = {
      data: frozenRows,
      dataMode: 'client' as const,
      columns,
      query: frozenQuery,
      rowKey: (row: Row) => row.id,
      rowOptions,
      sortOptions,
      filterOptions,
      paginationOptions: { ...paginationOptions, enabled: false },
    };
    const first = runNeuTableClientPipeline(options);
    const second = runNeuTableClientPipeline(options);
    expect(first.rows).toEqual(second.rows);
    expect(frozenRows[0]?.name).toBe('  ÁDA  Lovelace ');
    expect(frozenQuery.sort[0]?.direction).toBe('asc');
  });
});
