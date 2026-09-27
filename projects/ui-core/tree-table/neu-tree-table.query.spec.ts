import {
  normalizeNeuTreeTableHierarchy,
  projectNormalizedNeuTreeTableHierarchy,
} from './internal/hierarchy/neu-tree-table-hierarchy';
import {
  buildNeuTreeTableQueryProjection,
  evaluateNeuTreeFilter,
  normalizeNeuTreeSearch,
  proposeNeuTreeTableSort,
  readNeuTreeTableFilterValue,
  replaceNeuTreeTableFilter,
} from './internal/query/neu-tree-table-query';
import type {
  NeuTreeFilterConstraint,
  NeuTreeLoadedRelation,
  NeuTreeTableColumn,
  NeuTreeTableFilterOptions,
  NeuTreeTableHierarchy,
  NeuTreeTableQuery,
  NeuTreeTableSortOptions,
} from './public/neu-tree-table.types';

type Field = 'name' | 'rank' | 'group' | 'created';
interface Row {
  readonly id: string | number;
  readonly name: string;
  readonly rank: number;
  readonly group: string;
  readonly created?: Date;
}

const loaded = <K extends string | number>(
  keys: readonly K[],
  completeness: 'partial' | 'complete' = 'complete',
): NeuTreeLoadedRelation<K> => ({
  status: 'loaded',
  keys,
  relationRevision: 1,
  appliedRequestId: null,
  total: completeness === 'complete' ? keys.length : null,
  completeness,
});

const hierarchy = <K extends string | number>(
  roots: readonly K[],
  children: NeuTreeTableHierarchy<K>['children'] = [],
): NeuTreeTableHierarchy<K> => ({
  hierarchyRevision: 4,
  queryRevision: 2,
  roots: loaded(roots),
  children,
});

const columns: readonly NeuTreeTableColumn<Row, Field>[] = [
  {
    id: 'name',
    header: 'Name',
    field: 'name',
    sort: { field: 'name' },
    filter: {
      field: 'name',
      rules: ['contains', 'notContains', 'startsWith', 'endsWith', 'equals', 'notEquals'],
      defaultRule: 'contains',
    },
  },
  {
    id: 'rank',
    header: 'Rank',
    field: 'rank',
    sort: { field: 'rank' },
    filter: {
      field: 'rank',
      rules: [
        'equals',
        'notEquals',
        'lessThan',
        'lessThanOrEqual',
        'greaterThan',
        'greaterThanOrEqual',
        'between',
        'in',
        'notIn',
        'isNull',
        'isNotNull',
        'isEmpty',
        'isNotEmpty',
      ],
      defaultRule: 'equals',
    },
  },
  {
    id: 'group',
    header: 'Group',
    value: (row) => row.group,
    sort: { field: 'group', value: (row) => row.group },
    filter: {
      field: 'group',
      value: (row) => row.group,
      rules: ['equals'],
      defaultRule: 'equals',
    },
  },
  {
    id: 'created',
    header: 'Created',
    field: 'created',
    sort: { field: 'created' },
  },
];

const filterOptions: NeuTreeTableFilterOptions<Row, Field> = {
  surfaces: ['row'],
  globalFields: ['name', 'rank'],
  predicates: {},
  debounceMs: 0,
  commit: 'immediate',
};

const sortOptions: NeuTreeTableSortOptions = {
  mode: 'multiple',
  removable: true,
  defaultDirection: 'asc',
  resetRootPageOnChange: true,
};

const emptyQuery = (): NeuTreeTableQuery<Field> => ({
  page: 3,
  pageSize: 25,
  search: '',
  sort: [],
  filters: null,
});

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

describe('NeuTreeTable 2 pure hierarchical query engine', () => {
  it('normalizes search once and searches only declared scalar global fields', () => {
    expect(normalizeNeuTreeSearch('  Ａlpha\n  NODE ')).toBe('alpha node');
    const rows: readonly Row[] = [
      { id: 'a', name: 'Root', rank: 1, group: 'x' },
      { id: 'b', name: 'Ａlpha   Node', rank: 2, group: 'y' },
      { id: 'c', name: 'Hidden', rank: 123, group: 'needle' },
    ];
    const state = hierarchy(
      ['a', 'c'],
      [
        { parentKey: 'a', relation: loaded(['b']) },
        { parentKey: 'b', relation: loaded([]) },
        { parentKey: 'c', relation: loaded([]) },
      ],
    );
    const normalized = normalizeNeuTreeTableHierarchy(rows, (row) => row.id, state);
    const matched = buildNeuTreeTableQueryProjection({
      normalized,
      query: { ...emptyQuery(), search: ' alpha node ' },
      columns,
      filterOptions,
      sortOptions,
      dataMode: 'client',
    });
    expect(matched.roots).toEqual(['string:a']);
    expect(matched.children.get('string:a')).toEqual(['string:b']);
    expect([...matched.transientReveal]).toEqual(['string:a']);
    expect(
      projectNormalizedNeuTreeTableHierarchy(normalized, [], matched).visible.map(
        (node) => node.key,
      ),
    ).toEqual(['a', 'b']);
    expect(
      buildNeuTreeTableQueryProjection({
        normalized,
        query: { ...emptyQuery(), search: 'needle' },
        columns,
        filterOptions,
        sortOptions,
        dataMode: 'client',
      }).roots,
    ).toEqual([]);
  });

  it('keeps only matching nodes plus ancestor paths and restores applied expansion on clear', () => {
    const rows: readonly Row[] = [
      { id: 'a', name: 'A', rank: 1, group: 'x' },
      { id: 'b', name: 'B', rank: 2, group: 'x' },
      { id: 'c', name: 'match', rank: 3, group: 'x' },
      { id: 'd', name: 'unrelated', rank: 4, group: 'x' },
    ];
    const state = hierarchy(
      ['a', 'd'],
      [
        { parentKey: 'a', relation: loaded(['b']) },
        { parentKey: 'b', relation: loaded(['c']) },
        { parentKey: 'c', relation: loaded([]) },
        { parentKey: 'd', relation: loaded([]) },
      ],
    );
    const normalized = normalizeNeuTreeTableHierarchy(rows, (row) => row.id, state);
    const filtered = buildNeuTreeTableQueryProjection({
      normalized,
      query: { ...emptyQuery(), search: 'match' },
      columns,
      filterOptions,
      sortOptions,
      dataMode: 'client',
    });
    const visible = projectNormalizedNeuTreeTableHierarchy(normalized, [], filtered);
    expect(visible.visible.map((node) => node.key)).toEqual(['a', 'b', 'c']);
    expect(visible.visible.slice(0, 2).every((node) => node.transientlyRevealed)).toBe(true);
    const cleared = buildNeuTreeTableQueryProjection({
      normalized,
      query: emptyQuery(),
      columns,
      filterOptions,
      sortOptions,
      dataMode: 'client',
    });
    expect(
      projectNormalizedNeuTreeTableHierarchy(normalized, [], cleared).visible.map(
        (node) => node.key,
      ),
    ).toEqual(['a', 'd']);
    expect(
      projectNormalizedNeuTreeTableHierarchy(normalized, ['a'], cleared).visible.map(
        (node) => node.key,
      ),
    ).toEqual(['a', 'b', 'd']);
  });

  it('implements the closed filter rule truth tables without coercing invalid operands', () => {
    const row: Row = { id: 'a', name: ' Alpha  Beta ', rank: 2, group: 'x' };
    const test = (
      rule: NeuTreeFilterConstraint<Field>['rule'],
      value: unknown,
      candidate: unknown,
    ) =>
      evaluateNeuTreeFilter(
        { kind: 'condition', field: 'name', rule, value },
        candidate,
        row,
        filterOptions,
      );
    expect(test('equals', 2, 2)).toBe(true);
    expect(test('notEquals', 3, 2)).toBe(true);
    expect(test('contains', 'alpha beta', row.name)).toBe(true);
    expect(test('notContains', 'z', row.name)).toBe(true);
    expect(test('notContains', '2', 2)).toBe(false);
    expect(test('startsWith', 'alpha', row.name)).toBe(true);
    expect(test('endsWith', 'beta', row.name)).toBe(true);
    expect(test('lessThan', 3, 2)).toBe(true);
    expect(test('lessThanOrEqual', 2, 2)).toBe(true);
    expect(test('greaterThan', 1, 2)).toBe(true);
    expect(test('greaterThanOrEqual', 2, 2)).toBe(true);
    expect(test('between', [1, 2], 2)).toBe(true);
    expect(test('between', ['1', 2], 2)).toBe(false);
    expect(test('in', [1, 2], 2)).toBe(true);
    expect(test('notIn', [3], 2)).toBe(true);
    expect(test('notIn', 'invalid', 2)).toBe(false);
    expect(test('isNull', null, undefined)).toBe(true);
    expect(test('isNotNull', null, 0)).toBe(true);
    expect(test('isEmpty', null, '   ')).toBe(true);
    expect(test('isEmpty', null, [])).toBe(true);
    expect(test('isNotEmpty', null, null)).toBe(false);
    expect(test('isNotEmpty', null, [0])).toBe(true);
  });

  it('keeps numeric, bigint, string and null filter boundaries type safe', () => {
    const row: Row = { id: 'typed', name: 'Typed', rank: 0, group: 'x' };
    const evaluate = (
      rule: NeuTreeFilterConstraint<Field>['rule'],
      candidate: unknown,
      value: unknown,
    ) => evaluateNeuTreeFilter(
      { kind: 'condition', field: 'rank', rule, value },
      candidate,
      row,
      filterOptions,
    );

    // Heterogeneous remote values must never be coerced into an ordered match.
    expect(evaluate('lessThan', 2, '3')).toBe(false);
    expect(evaluate('greaterThan', Number.NaN, 2)).toBe(false);
    expect(evaluate('between', 2, [1, Number.NaN])).toBe(false);
    expect(evaluate('between', 2, [1])).toBe(false);
    expect(evaluate('equals', -0, 0)).toBe(false);
    expect(evaluate('equals', true, true)).toBe(true);
    expect(evaluate('notEquals', 2n, 3n)).toBe(true);

    // Ordered bigint and string ranges preserve their native ordering.
    expect(evaluate('between', 3n, [1n, 5n])).toBe(true);
    expect(evaluate('between', 0n, [1n, 5n])).toBe(false);
    expect(evaluate('greaterThan', 9n, 3n)).toBe(true);
    expect(evaluate('lessThanOrEqual', 3n, 3n)).toBe(true);
    expect(evaluate('between', 'beta', ['alpha', 'gamma'])).toBe(true);
    expect(evaluate('between', 'omega', ['alpha', 'gamma'])).toBe(false);
    expect(evaluate('greaterThanOrEqual', 'alpha', 'alpha')).toBe(true);

    expect(evaluate('isNull', 0, null)).toBe(false);
    expect(evaluate('isNotNull', undefined, null)).toBe(false);
    expect(evaluate('isEmpty', null, null)).toBe(false);
    expect(evaluate('isEmpty', ['item'], null)).toBe(false);
    expect(evaluate('isNotEmpty', ' ', null)).toBe(false);
    expect(evaluate('notIn', 2, [2, 3])).toBe(false);

    const custom = evaluateNeuTreeFilter(
      { kind: 'condition', field: 'name', rule: 'equals', value: 'typed' },
      'TYPED',
      row,
      { ...filterOptions, predicates: { equals: ({ candidate, filterValue }) =>
        String(candidate).toLowerCase() === filterValue } },
    );
    expect(custom).toBe(true);
  });

  it('combines global search AND a nested filter AST while retaining deep paths', () => {
    const rows: readonly Row[] = [
      { id: 'a', name: 'root', rank: 0, group: 'x' },
      { id: 'b', name: 'target', rank: 5, group: 'blue' },
      { id: 'c', name: 'target', rank: 2, group: 'red' },
    ];
    const state = hierarchy(
      ['a'],
      [
        { parentKey: 'a', relation: loaded(['b', 'c']) },
        { parentKey: 'b', relation: loaded([]) },
        { parentKey: 'c', relation: loaded([]) },
      ],
    );
    const normalized = normalizeNeuTreeTableHierarchy(rows, (row) => row.id, state);
    const projection = buildNeuTreeTableQueryProjection({
      normalized,
      query: {
        ...emptyQuery(),
        search: 'target',
        filters: {
          kind: 'group',
          operator: 'and',
          children: [
            { kind: 'condition', field: 'rank', rule: 'greaterThan', value: 3 },
            {
              kind: 'group',
              operator: 'or',
              children: [
                { kind: 'condition', field: 'group', rule: 'equals', value: 'blue' },
                { kind: 'condition', field: 'group', rule: 'equals', value: 'green' },
              ],
            },
          ],
        },
      },
      columns,
      filterOptions,
      sortOptions,
      dataMode: 'client',
    });
    expect(
      projectNormalizedNeuTreeTableHierarchy(normalized, [], projection).visible.map(
        (node) => node.key,
      ),
    ).toEqual(['a', 'b']);
  });

  it('sorts each sibling set stably with ordered multi-sort and deterministic invalid ordering', () => {
    const rows: readonly Row[] = [
      { id: 'a', name: 'Zulu', rank: 1, group: 'root' },
      { id: 'b', name: 'Beta', rank: 2, group: 'same', created: new Date('invalid') },
      { id: 'c', name: 'Alpha', rank: 2, group: 'same', created: new Date('2025-01-01') },
      { id: 'd', name: 'Delta', rank: 2, group: 'same' },
      { id: 'e', name: 'Root', rank: 0, group: 'root' },
    ];
    const state = hierarchy(
      ['a', 'e'],
      [
        { parentKey: 'a', relation: loaded(['b', 'c', 'd']) },
        { parentKey: 'b', relation: loaded([]) },
        { parentKey: 'c', relation: loaded([]) },
        { parentKey: 'd', relation: loaded([]) },
        { parentKey: 'e', relation: loaded([]) },
      ],
    );
    const normalized = normalizeNeuTreeTableHierarchy(rows, (row) => row.id, state);
    const query = {
      ...emptyQuery(),
      sort: [
        { field: 'rank', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ],
    } as const;
    const projected = buildNeuTreeTableQueryProjection({
      normalized,
      query,
      columns,
      filterOptions,
      sortOptions,
      dataMode: 'client',
    });
    expect(projected.roots).toEqual(['string:a', 'string:e']);
    expect(projected.children.get('string:a')).toEqual(['string:c', 'string:b', 'string:d']);

    const byDate = buildNeuTreeTableQueryProjection({
      normalized,
      query: { ...emptyQuery(), sort: [{ field: 'created', direction: 'desc' }] },
      columns,
      filterOptions,
      sortOptions,
      dataMode: 'client',
    });
    expect(byDate.children.get('string:a')).toEqual(['string:c', 'string:b', 'string:d']);
  });

  it('leaves remote applied order untouched and does not fabricate unloaded matches', () => {
    const rows: readonly Row[] = [
      { id: 'a', name: 'Zulu', rank: 1, group: 'x' },
      { id: 'b', name: 'Alpha', rank: 2, group: 'x' },
    ];
    const state: NeuTreeTableHierarchy<string> = {
      ...hierarchy(['a', 'b']),
      roots: loaded(['a', 'b'], 'partial'),
    };
    const normalized = normalizeNeuTreeTableHierarchy(rows, (row) => String(row.id), state);
    const projection = buildNeuTreeTableQueryProjection({
      normalized,
      query: {
        ...emptyQuery(),
        search: 'missing backend node',
        sort: [{ field: 'name', direction: 'asc' }],
      },
      columns,
      filterOptions,
      sortOptions,
      dataMode: 'remote',
    });
    expect(projection.roots).toEqual(['string:a', 'string:b']);
    expect(projection.filtering).toBe(false);
    expect(projection.transientReveal.size).toBe(0);
  });

  it('processes only loaded children in a partial client relation and preserves unknown sibling size', () => {
    const rows: readonly Row[] = [
      { id: 'a', name: 'root', rank: 0, group: 'x' },
      { id: 'b', name: 'loaded match', rank: 1, group: 'x' },
    ];
    const state = hierarchy(
      ['a'],
      [
        { parentKey: 'a', relation: loaded(['b'], 'partial') },
        { parentKey: 'b', relation: loaded([]) },
      ],
    );
    const normalized = normalizeNeuTreeTableHierarchy(rows, (row) => row.id, state);
    const queried = buildNeuTreeTableQueryProjection({
      normalized,
      query: { ...emptyQuery(), search: 'loaded match' },
      columns,
      filterOptions,
      sortOptions,
      dataMode: 'client',
    });
    const projection = projectNormalizedNeuTreeTableHierarchy(normalized, [], queried);
    expect(projection.visible.map((node) => node.key)).toEqual(['a', 'b']);
    expect(projection.visible[1]?.siblingCount).toBeNull();
  });

  it('honors a custom sibling comparator before the canonical accessor comparator', () => {
    const rows: readonly Row[] = [
      { id: 'a', name: 'short', rank: 1, group: 'x' },
      { id: 'b', name: 'much longer', rank: 2, group: 'x' },
    ];
    const customColumns: readonly NeuTreeTableColumn<Row, Field>[] = [
      {
        ...columns[0]!,
        sort: { field: 'name', compare: (left, right) => left.name.length - right.name.length },
      },
    ];
    const normalized = normalizeNeuTreeTableHierarchy(rows, (row) => row.id, hierarchy(['a', 'b']));
    const projection = buildNeuTreeTableQueryProjection({
      normalized,
      query: { ...emptyQuery(), sort: [{ field: 'name', direction: 'desc' }] },
      columns: customColumns,
      filterOptions,
      sortOptions,
      dataMode: 'client',
    });
    expect(projection.roots).toEqual(['string:b', 'string:a']);
  });

  it('builds immutable sort/filter proposals and preserves frozen inputs', () => {
    const query = deepFreeze<NeuTreeTableQuery<Field>>({
      ...emptyQuery(),
      filters: { kind: 'condition', field: 'name', rule: 'contains', value: 'a' },
    });
    const first = proposeNeuTreeTableSort(query, 'rank', sortOptions);
    const second = proposeNeuTreeTableSort(first, 'rank', sortOptions);
    const third = proposeNeuTreeTableSort(second, 'rank', sortOptions);
    expect(first).toMatchObject({ page: 0, sort: [{ field: 'rank', direction: 'asc' }] });
    expect(second.sort).toEqual([{ field: 'rank', direction: 'desc' }]);
    expect(third.sort).toEqual([]);
    const filters = replaceNeuTreeTableFilter(query.filters, 'rank', {
      kind: 'condition',
      field: 'rank',
      rule: 'greaterThan',
      value: 2,
    });
    expect(readNeuTreeTableFilterValue(filters, 'name')).toBe('a');
    expect(readNeuTreeTableFilterValue(filters, 'rank')).toBe(2);
    expect(replaceNeuTreeTableFilter(filters, 'name', null)).toEqual({
      kind: 'condition',
      field: 'rank',
      rule: 'greaterThan',
      value: 2,
    });
    const nested = {
      kind: 'group' as const,
      operator: 'or' as const,
      children: [
        {
          kind: 'condition' as const,
          field: 'name' as const,
          rule: 'contains' as const,
          value: 'a',
        },
        {
          kind: 'condition' as const,
          field: 'group' as const,
          rule: 'equals' as const,
          value: 'x',
        },
      ],
    };
    expect(
      replaceNeuTreeTableFilter(nested, 'rank', {
        kind: 'condition',
        field: 'rank',
        rule: 'greaterThan',
        value: 4,
      }),
    ).toEqual({
      kind: 'group',
      operator: 'and',
      children: [nested, { kind: 'condition', field: 'rank', rule: 'greaterThan', value: 4 }],
    });
    expect(query.sort).toEqual([]);
    expect(query.filters).toEqual({
      kind: 'condition',
      field: 'name',
      rule: 'contains',
      value: 'a',
    });
  });
});
