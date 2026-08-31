import type {
  NeuTableColumn,
  NeuTableQueryFilterConstraint,
  NeuTableQueryState,
  NeuTableSortState,
} from '@neural-ui/core/table';
import { projectNeuTreeTable } from './neu-tree-table-hierarchy.controller';
import type { NeuTreeTableFilterMode, NeuTreeTableNode } from './neu-tree-table.types';

interface RecordRow extends Record<string, unknown> {
  amount: number | null;
  active: boolean;
  category: string;
  created: Date | string | null;
  name: string;
}

const BASE_NODES: NeuTreeTableNode<RecordRow>[] = [
  {
    id: 'parent',
    label: 'Parent 10',
    description: 'root description',
    badge: 'root badge',
    expanded: true,
    data: {
      amount: 10,
      active: true,
      category: 'alpha',
      created: new Date('2026-01-10T00:00:00.000Z'),
      name: 'Parent',
    },
    children: [
      {
        id: 'child',
        label: 'Child 2',
        disabled: true,
        data: {
          amount: 20,
          active: false,
          category: 'beta',
          created: '2026-02-10T00:00:00.000Z',
          name: 'Child',
        },
      },
    ],
  },
  {
    id: 'lazy',
    label: 'Lazy',
    leaf: false,
    data: {
      amount: 30,
      active: false,
      category: 'gamma',
      created: null,
      name: 'Lazy',
    },
  },
  { id: 'empty', label: 'Empty' },
];

const COLUMNS: NeuTableColumn<Record<string, unknown>>[] = [
  { key: 'label', header: 'Label' },
  { key: 'name', header: 'Name', filterConfig: { kind: 'text' } },
  { key: 'amount', header: 'Amount', filterConfig: { kind: 'number' } },
  { key: 'active', header: 'Active', filterConfig: { kind: 'boolean' } },
  { key: 'category', header: 'Category', filterConfig: { kind: 'select' } },
  { key: 'created', header: 'Created', filterConfig: { kind: 'date' } },
];

function query(
  search = '',
  filters: NeuTableQueryState['filters'] = {},
  globalFilterFields: string[] = [],
): NeuTableQueryState {
  return {
    page: 1,
    pageSize: 10,
    search,
    sort: null,
    sortEntries: [],
    globalFilterFields,
    filters,
    serialization: {
      status: 'serializable',
      localOnlyFilters: [],
      requiresConsumerSerializationFilters: [],
      localOnlyGlobalFilterFields: false,
    },
  };
}

function filter(
  constraint: NeuTableQueryFilterConstraint,
  operator: 'and' | 'or' = 'and',
): NeuTableQueryState['filters'][string] {
  return { operator, constraints: [constraint], serializability: 'serializable' };
}

function project(
  activeQuery = query(),
  sort: NeuTableSortState = [],
  filterMode: NeuTreeTableFilterMode = 'strict',
  exactMatch = false,
  nodes: readonly NeuTreeTableNode<RecordRow>[] = BASE_NODES,
  columns: readonly NeuTableColumn<Record<string, unknown>>[] = COLUMNS,
) {
  return projectNeuTreeTable(nodes, { query: activeQuery, sort, filterMode, exactMatch, columns });
}

function ids(result: ReturnType<typeof projectNeuTreeTable<RecordRow>>): string[] {
  return [...result.nodesById.keys()];
}

describe('projectNeuTreeTable', () => {
  it('projects immutable hierarchy metadata for loaded, lazy, disabled, and empty nodes', () => {
    const result = project();

    expect(result.roots.map((entry) => entry.node.id)).toEqual(['parent', 'lazy', 'empty']);
    expect(result.roots[0].row).toMatchObject({
      id: 'parent',
      description: 'root description',
      badge: 'root badge',
      __treeHasChildren: true,
      __treeDisabled: false,
      __treePosInSet: 1,
      __treeSetSize: 3,
    });
    expect(result.nodesById.get('child')?.row).toMatchObject({
      __treeLevel: 1,
      __treeParentId: 'parent',
      __treeDisabled: true,
      __treeHasChildren: false,
    });
    expect(result.nodesById.get('lazy')?.row.__treeHasChildren).toBe(true);
    expect(result.nodesById.get('empty')?.row['name']).toBeUndefined();
    expect(BASE_NODES[0].children?.[0].data?.name).toBe('Child');
  });

  it('supports global search fields, derived fields, exact matching, and no matches', () => {
    expect(ids(project(query('child', {}, ['name'])))).toEqual(['parent', 'child']);
    expect(ids(project(query('child')))).toEqual(['parent', 'child']);
    expect(ids(project(query('chi'), [], 'strict', true))).toEqual([]);
    expect(ids(project(query('child'), [], 'strict', true))).toEqual(['parent', 'child']);
    expect(ids(project(query('missing')))).toEqual([]);
  });

  it('distinguishes lenient parent matches from strict child filtering', () => {
    const active = query('', { name: filter({ kind: 'text', mode: 'equals', value: 'Parent' }) });

    expect(ids(project(active, [], 'lenient'))).toEqual(['parent', 'child']);
    expect(ids(project(active, [], 'strict'))).toEqual(['parent']);
    expect(
      ids(
        project(
          query('', { name: filter({ kind: 'text', mode: 'equals', value: 'Child' }) }),
        ),
      ),
    ).toEqual(['parent', 'child']);
  });

  it.each([
    ['startsWith', 'Par', ['parent']],
    ['endsWith', 'ild', ['parent', 'child']],
    ['equals', 'Lazy', ['lazy']],
    ['notEquals', 'Parent', ['parent', 'child', 'lazy', 'empty']],
    ['notContains', 'a', ['parent', 'child', 'empty']],
    ['contains', 'hil', ['parent', 'child']],
  ] as const)('applies the %s text constraint', (mode, value, expected) => {
    expect(ids(project(query('', { name: filter({ kind: 'text', mode, value }) })))).toEqual(expected);
  });

  it.each([
    ['notEquals', 10, ['parent', 'child', 'lazy', 'empty']],
    ['lt', 20, ['parent']],
    ['lte', 20, ['parent', 'child']],
    ['gt', 20, ['lazy']],
    ['gte', 20, ['parent', 'child', 'lazy']],
    ['equals', 20, ['parent', 'child']],
  ] as const)('applies the %s number constraint', (mode, value, expected) => {
    expect(ids(project(query('', { amount: filter({ kind: 'number', mode, value }) })))).toEqual(
      expected,
    );
  });

  it('applies open and closed numeric ranges', () => {
    expect(
      ids(
        project(
          query('', {
            amount: filter({ kind: 'number', mode: 'between', value: { from: 15, to: 25 } }),
          }),
        ),
      ),
    ).toEqual(['parent', 'child']);
    expect(
      ids(
        project(
          query('', {
            amount: filter({ kind: 'number', mode: 'between', value: { from: null, to: 10 } }),
          }),
        ),
      ),
    ).toEqual(['parent']);
    expect(
      ids(
        project(
          query('', {
            amount: filter({ kind: 'number', mode: 'between', value: { from: 30, to: null } }),
          }),
        ),
      ),
    ).toEqual(['lazy']);
  });

  it('applies boolean, select, and multiselect constraints', () => {
    expect(ids(project(query('', { active: filter({ kind: 'boolean', mode: 'all', value: null }) })))).toEqual([
      'parent',
      'child',
      'lazy',
      'empty',
    ]);
    expect(ids(project(query('', { active: filter({ kind: 'boolean', mode: 'true', value: true }) })))).toEqual([
      'parent',
    ]);
    expect(ids(project(query('', { active: filter({ kind: 'boolean', mode: 'false', value: false }) })))).toEqual([
      'parent',
      'child',
      'lazy',
      'empty',
    ]);
    expect(ids(project(query('', { category: filter({ kind: 'select', mode: 'equals', value: 'beta' }) })))).toEqual([
      'parent',
      'child',
    ]);
    expect(
      ids(
        project(
          query('', {
            category: filter({ kind: 'multiSelect', mode: 'in', value: ['alpha', 'gamma'] }),
          }),
        ),
      ),
    ).toEqual(['parent', 'lazy']);
    expect(
      ids(
        project(
          query('', { category: filter({ kind: 'multiSelect', mode: 'in', value: ['missing'] }) }),
        ),
      ),
    ).toEqual([]);
  });

  it('supports AND/OR constraint groups and filter accessors', () => {
    const columns = COLUMNS.map((column) =>
      column.key === 'amount'
        ? { ...column, filterConfig: { kind: 'number' as const, accessor: () => 42 } }
        : column,
    );
    const constraints: readonly NeuTableQueryFilterConstraint[] = [
      { kind: 'number', mode: 'gte', value: 40 },
      { kind: 'number', mode: 'lt', value: 0 },
    ];
    const andQuery = query('', {
      amount: { operator: 'and', constraints, serializability: 'serializable' },
    });
    const orQuery = query('', {
      amount: { operator: 'or', constraints, serializability: 'serializable' },
    });

    expect(ids(project(andQuery, [], 'strict', false, BASE_NODES, columns))).toEqual([]);
    expect(ids(project(orQuery, [], 'strict', false, BASE_NODES, columns))).toEqual([
      'parent',
      'child',
      'lazy',
      'empty',
    ]);
  });

  it('supports custom predicates and permissive unresolved custom filters', () => {
    const predicate = vi.fn((value: unknown, expected: unknown, row: Record<string, unknown>) =>
      value === expected && row['id'] === 'child',
    );
    const customColumns: NeuTableColumn<Record<string, unknown>>[] = COLUMNS.map((column) =>
      column.key === 'category'
        ? { ...column, filterConfig: { kind: 'custom', predicate } }
        : column,
    );
    const active = query('', {
      category: filter({ kind: 'custom', mode: 'owned', value: 'beta' }),
    });

    expect(ids(project(active, [], 'strict', false, BASE_NODES, customColumns))).toEqual([
      'parent',
      'child',
    ]);
    expect(predicate).toHaveBeenCalled();
    expect(ids(project(active))).toEqual(['parent', 'child', 'lazy', 'empty']);
  });

  it.each([
    ['before', { precision: 'date-only', value: '2026-02-01' }, ['parent']],
    ['after', { precision: 'date-only', value: '2026-02-01' }, ['parent', 'child']],
    ['isNot', { precision: 'date-only', value: '2026-01-10' }, ['parent', 'child']],
    ['is', { precision: 'instant', value: '2026-02-10T00:00:00.000Z' }, ['parent', 'child']],
  ] as const)('applies the %s date constraint', (mode, value, expected) => {
    expect(ids(project(query('', { created: filter({ kind: 'date', mode, value }) })))).toEqual(
      expected,
    );
  });

  it('applies date ranges and rejects invalid date points', () => {
    expect(
      ids(
        project(
          query('', {
            created: filter({
              kind: 'date',
              mode: 'between',
              value: {
                from: { precision: 'date-only', value: '2026-01-01' },
                to: { precision: 'date-only', value: '2026-01-31' },
              },
            }),
          }),
        ),
      ),
    ).toEqual(['parent']);
    expect(
      ids(
        project(
          query('', {
            created: filter({
              kind: 'date',
              mode: 'between',
              value: { from: null, to: { precision: 'date-only', value: '2026-01-10' } },
            }),
          }),
        ),
      ),
    ).toEqual(['parent']);
    expect(
      ids(
        project(
          query('', {
            created: filter({
              kind: 'date',
              mode: 'between',
              value: { from: { precision: 'date-only', value: '2026-02-10' }, to: null },
            }),
          }),
        ),
      ),
    ).toEqual(['parent', 'child']);
    expect(
      ids(
        project(
          query('', {
            created: filter({
              kind: 'date',
              mode: 'is',
              value: { precision: 'instant', value: 'not-a-date' },
            }),
          }),
        ),
      ),
    ).toEqual([]);
  });

  it('sorts nulls, numbers, dates, labels, accessors, comparators, and stable ties', () => {
    const sortable: NeuTreeTableNode<RecordRow>[] = [
      ...BASE_NODES,
      {
        id: 'tie',
        label: 'Parent 2',
        data: {
          amount: 10,
          active: true,
          category: 'alpha',
          created: new Date('2025-01-01T00:00:00.000Z'),
          name: 'Parent',
        },
      },
    ];
    expect(project(query(), [{ key: 'amount', dir: 'asc' }], 'strict', false, sortable).roots.map((entry) => entry.node.id)).toEqual([
      'empty',
      'parent',
      'tie',
      'lazy',
    ]);
    expect(project(query(), [{ key: 'amount', dir: 'desc' }], 'strict', false, sortable).roots.map((entry) => entry.node.id)).toEqual([
      'lazy',
      'parent',
      'tie',
      'empty',
    ]);
    expect(project(query(), [{ key: 'created', dir: 'asc' }], 'strict', false, sortable).roots[0].node.id).toBe('empty');
    expect(project(query(), [{ key: 'label', dir: 'asc' }], 'strict', false, sortable).roots.map((entry) => entry.node.id)).toEqual([
      'empty',
      'lazy',
      'tie',
      'parent',
    ]);

    const accessorColumns = COLUMNS.map((column) =>
      column.key === 'name' ? { ...column, sortAccessor: (row: Record<string, unknown>) => String(row['name']).length } : column,
    );
    expect(project(query(), [{ key: 'name', dir: 'asc' }], 'strict', false, sortable, accessorColumns).roots[0].node.id).toBe('lazy');

    const comparator = vi.fn((left: Record<string, unknown>, right: Record<string, unknown>) =>
      String(left['id']).localeCompare(String(right['id'])),
    );
    const comparatorColumns = [
      ...COLUMNS,
      { key: 'id', header: 'Id', sortComparator: comparator },
    ];
    expect(project(query(), [{ key: 'id', dir: 'asc' }], 'strict', false, sortable, comparatorColumns).roots.map((entry) => entry.node.id)).toEqual([
      'empty',
      'lazy',
      'parent',
      'tie',
    ]);
    expect(comparator).toHaveBeenCalled();
  });
});
