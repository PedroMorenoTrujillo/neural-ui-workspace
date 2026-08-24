import { NeuTableQueryController } from './neu-table-query.controller';
import { NeuTableStateController } from './neu-table-state.controller';
import type {
  NeuTableColumn,
  NeuTableGlobalFilterField,
  NeuTableQueryColumnFilter,
  NeuTableQueryState,
} from './neu-table.types';

interface QueryRow {
  name: string;
  score: number;
  createdAt: string;
  role: { id: number; label: string };
  status: string;
}

const ROLE = { id: 1, label: 'Admin' };

const COLUMNS: readonly NeuTableColumn<QueryRow>[] = [
  { key: 'name', header: 'Name', filterConfig: { kind: 'text' } },
  { key: 'score', header: 'Score', filterConfig: { kind: 'number' } },
  {
    key: 'createdAt',
    header: 'Created',
    filterConfig: { kind: 'date', precision: 'instant' },
  },
  { key: 'role', header: 'Role', filterConfig: { kind: 'select' } },
  {
    key: 'status',
    header: 'Status',
    filterConfig: {
      kind: 'custom',
      predicate: (value, filterValue) => value === filterValue,
    },
  },
];

function build(
  state: NeuTableStateController,
  options: {
    columns?: readonly NeuTableColumn<QueryRow>[];
    globalFilterFields?: readonly NeuTableGlobalFilterField<QueryRow>[];
    configuredGlobalFields?: boolean;
    multiSort?: boolean;
  } = {},
) {
  const controller = new NeuTableQueryController<QueryRow>();
  const query = controller.build(state.snapshot(), {
    columns: options.columns ?? COLUMNS,
    globalFilterFields: options.configuredGlobalFields
      ? (options.globalFilterFields ?? [])
      : undefined,
    multiSort: options.multiSort ?? false,
  });
  return { controller, query };
}

describe('NeuTableQueryController', () => {
  it('builds an immutable 1-based default query without full Table UI state', () => {
    const { query } = build(new NeuTableStateController());

    expect(query).toEqual({
      page: 1,
      pageSize: 10,
      search: '',
      sort: null,
      sortEntries: [],
      globalFilterFields: ['name', 'score', 'createdAt', 'role', 'status'],
      filters: {},
      serialization: {
        status: 'serializable',
        localOnlyFilters: [],
        requiresConsumerSerializationFilters: [],
        localOnlyGlobalFilterFields: false,
      },
    });
    expect(Object.isFrozen(query)).toBe(true);
    expect(Object.isFrozen(query.globalFilterFields)).toBe(true);
    expect(query).not.toHaveProperty('selection');
    expect(query).not.toHaveProperty('layout');
  });

  it('projects single sort and complete ordered multisort without a fake single sort', () => {
    const state = new NeuTableStateController();
    state.update(
      { page: 3, pageSize: 25, search: 'ana', sort: { key: 'name', dir: 'desc' } },
      'api',
    );
    expect(build(state).query).toMatchObject({
      page: 3,
      pageSize: 25,
      search: 'ana',
      sort: { key: 'name', dir: 'desc' },
      sortEntries: [],
    });

    state.update(
      {
        sort: null,
        sortEntries: [
          { key: 'score', dir: 'desc' },
          { key: 'name', dir: 'asc' },
        ],
      },
      'api',
    );
    expect(build(state, { multiSort: true }).query).toMatchObject({
      sort: null,
      sortEntries: [
        { key: 'score', dir: 'desc' },
        { key: 'name', dir: 'asc' },
      ],
    });
  });

  it('serializes every ordered AND/OR constraint with typed modes and canonical ranges', () => {
    const state = new NeuTableStateController();
    state.setFilters(
      {
        name: {
          operator: 'or',
          constraints: [
            { mode: 'startsWith', value: 'A' },
            { mode: 'endsWith', value: 'z' },
          ],
        },
        score: {
          operator: 'and',
          constraints: [
            { mode: 'between', value: { from: 10, to: 20 } },
            { mode: 'notEquals', value: 15 },
          ],
        },
        createdAt: {
          operator: 'and',
          constraints: [
            {
              mode: 'between',
              value: { from: '2026-08-01T10:00:00Z', to: '2026-08-02T10:00:00Z' },
            },
          ],
        },
      },
      'api',
    );

    const { query } = build(state);
    expect(query.filters['name']).toEqual({
      operator: 'or',
      serializability: 'serializable',
      constraints: [
        { kind: 'text', mode: 'startsWith', value: 'A' },
        { kind: 'text', mode: 'endsWith', value: 'z' },
      ],
    });
    expect(query.filters['score'].constraints).toEqual([
      { kind: 'number', mode: 'between', value: { from: 10, to: 20 } },
      { kind: 'number', mode: 'notEquals', value: 15 },
    ]);
    expect(query.filters['createdAt'].constraints[0]).toEqual({
      kind: 'date',
      mode: 'between',
      value: {
        from: { precision: 'instant', value: '2026-08-01T10:00:00.000Z' },
        to: { precision: 'instant', value: '2026-08-02T10:00:00.000Z' },
      },
    });
  });

  it('classifies custom, opaque option and computed global values exactly', () => {
    const state = new NeuTableStateController();
    state.setFilters(
      {
        role: { operator: 'and', constraints: [{ value: ROLE }] },
        status: { operator: 'and', constraints: [{ value: 'active' }] },
      },
      'api',
    );
    const globalFilterFields: readonly NeuTableGlobalFilterField<QueryRow>[] = [
      'name',
      { accessor: (row) => row.role.label, serverField: 'role_label' },
      { accessor: (row) => row.status },
    ];

    const { query } = build(state, { configuredGlobalFields: true, globalFilterFields });
    expect(query.filters['role'].constraints[0].value).toBe(ROLE);
    expect(query.filters['role'].serializability).toBe('requires-consumer');
    expect(query.filters['status'].serializability).toBe('local-only');
    expect(query.globalFilterFields).toEqual(['name', 'role_label']);
    expect(query.serialization).toEqual({
      status: 'local-only',
      localOnlyFilters: ['status'],
      requiresConsumerSerializationFilters: ['role'],
      localOnlyGlobalFilterFields: true,
    });
  });

  it('uses a configured serializer without losing the original option/custom value', () => {
    const customValue = { state: 'active' };
    const columns: readonly NeuTableColumn<QueryRow>[] = [
      {
        key: 'role',
        header: 'Role',
        filterConfig: {
          kind: 'select',
          serverSerializer: (value) => (value as { id: number }).id,
        },
      },
      {
        key: 'status',
        header: 'Status',
        filterConfig: {
          kind: 'custom',
          predicate: () => true,
          serverSerializer: (value, context) => ({ field: context.columnKey, value }),
        },
      },
    ];
    const state = new NeuTableStateController();
    state.setFilters(
      {
        role: { operator: 'and', constraints: [{ value: ROLE }] },
        status: { operator: 'and', constraints: [{ value: customValue }] },
      },
      'api',
    );

    const { query } = build(state, { columns });
    expect(query.filters['role'].constraints[0]).toMatchObject({ value: ROLE, serverValue: 1 });
    expect(query.filters['role'].constraints[0].value).toBe(ROLE);
    expect(query.filters['status'].constraints[0]).toMatchObject({
      value: customValue,
      serverValue: { field: 'status', value: customValue },
    });
    expect(query.serialization.status).toBe('serializable');
  });

  it('defensively snapshots arrays/ranges while retaining opaque option identity', () => {
    const selected = [ROLE];
    const range = { from: 1, to: 9 };
    const columns: readonly NeuTableColumn<QueryRow>[] = [
      { key: 'role', header: 'Role', filterConfig: { kind: 'multiSelect' } },
      { key: 'score', header: 'Score', filterConfig: { kind: 'number', mode: 'between' } },
    ];
    const state = new NeuTableStateController();
    state.setFilters(
      {
        role: { operator: 'and', constraints: [{ value: selected }] },
        score: { operator: 'and', constraints: [{ mode: 'between', value: range }] },
      },
      'api',
    );

    const first = build(state, { columns }).query;
    const roleValue = first.filters['role'].constraints[0].value as readonly unknown[];
    const scoreValue = first.filters['score'].constraints[0].value as { from: number; to: number };
    expect(roleValue).not.toBe(selected);
    expect(roleValue[0]).toBe(ROLE);
    expect(Object.isFrozen(roleValue)).toBe(true);
    expect(Object.isFrozen(scoreValue)).toBe(true);
    expect(build(state, { columns }).query.filters['score'].constraints[0].value).toEqual({
      from: 1,
      to: 9,
    });
  });

  it('uses semantic equality for metadata but identity for opaque option objects', () => {
    const state = new NeuTableStateController();
    state.setFilters({ role: { operator: 'and', constraints: [{ value: ROLE }] } }, 'api');
    const first = build(state);
    const second = build(state);
    expect(first.controller.equal(first.query, second.query)).toBe(true);

    state.setFilters({ role: { operator: 'and', constraints: [{ value: { ...ROLE } }] } }, 'api');
    expect(first.controller.equal(first.query, build(state).query)).toBe(false);
  });

  it('normalizes controlled query slices and derives a truthful legacy projection', () => {
    const state = new NeuTableStateController();
    state.setFilters(
      {
        name: {
          operator: 'or',
          constraints: [
            { mode: 'startsWith', value: 'A' },
            { mode: 'endsWith', value: 'z' },
          ],
        },
      },
      'api',
    );
    const { controller, query } = build(state);
    const patch = controller.controlledPatch({
      ...query,
      page: 0,
      pageSize: 0,
      sort: { key: 'ignored', dir: 'asc' },
      sortEntries: [{ key: 'score', dir: 'desc' }],
    });
    expect(patch).toMatchObject({
      page: 1,
      pageSize: 1,
      sort: null,
      sortEntries: [{ key: 'score', dir: 'desc' }],
      filters: {
        name: {
          operator: 'or',
          constraints: [
            { mode: 'startsWith', value: 'A' },
            { mode: 'endsWith', value: 'z' },
          ],
        },
      },
    });

    const legacy = controller.legacy(query, state.snapshot(), {
      effectivePageSize: 10,
      configuredGlobalFilterFields: false,
    });
    expect(legacy.columnFilters).toEqual({});
    expect(legacy.typedColumnFilters).toEqual({});
    expect(legacy).not.toHaveProperty('globalFilterFields');
  });

  it('keeps controlled query snapshots structurally usable by consumers', () => {
    const state = new NeuTableStateController();
    const { query } = build(state);
    const typed: NeuTableQueryState = query;
    expect(typed.page).toBe(1);
  });

  it('normalizes defensive controlled-input edge cases without leaking invalid rules', () => {
    const { controller, query } = build(new NeuTableStateController());
    const patch = controller.controlledPatch({
      ...query,
      page: Number.NaN,
      pageSize: 7.9,
      search: null as unknown as string,
      sort: { key: '', dir: 'desc' },
      sortEntries: undefined as unknown as [],
      filters: {
        empty: {
          operator: 'and',
          serializability: 'serializable',
          constraints: [
            null,
            { kind: 'text', mode: 'contains', value: '' },
          ] as unknown as NeuTableQueryColumnFilter['constraints'],
        },
        modes: {
          operator: 'invalid' as 'and',
          serializability: 'serializable',
          constraints: [
            { kind: 'custom', mode: 'custom', value: 'a' },
            { kind: 'boolean', mode: 'true', value: true },
            { kind: 'boolean', mode: 'false', value: false },
            { kind: 'text', mode: 'contains', value: 'kept' },
          ],
        },
      },
    });

    expect(patch).toEqual({
      page: 1,
      pageSize: 7,
      search: '',
      sort: null,
      sortEntries: [],
      filters: {
        modes: {
          operator: 'and',
          constraints: [
            { value: 'a' },
            { value: true },
            { value: false },
            { mode: 'contains', value: 'kept' },
          ],
        },
      },
    });
  });

  it('covers mixed serialization precedence, duplicates and invalid typed constraints', () => {
    const columns: readonly NeuTableColumn<QueryRow>[] = [
      {
        key: 'role',
        header: 'Role',
        filterConfig: { kind: 'select' },
      },
      {
        key: 'score',
        header: 'Score',
        filterConfig: { kind: 'number' },
      },
    ];
    const state = new NeuTableStateController();
    state.setFilters(
      {
        role: {
          operator: 'and',
          constraints: [{ value: 'admin' }, { value: ROLE }],
        },
        score: {
          operator: 'or',
          constraints: [{ mode: 'between', value: { from: null, to: null } }],
        },
        unknown: {
          operator: 'and',
          constraints: [{ value: 42 }],
        },
      },
      'api',
    );

    const { query } = build(state, {
      columns,
      configuredGlobalFields: true,
      globalFilterFields: ['role', 'role', { accessor: (row) => row.role.label, serverField: '' }],
    });

    expect(query.filters['role']).toMatchObject({ serializability: 'requires-consumer' });
    expect(query.filters).not.toHaveProperty('score');
    expect(query.filters['unknown'].constraints[0]).toEqual({
      kind: 'text',
      mode: 'contains',
      value: '42',
    });
    expect(query.globalFilterFields).toEqual(['role']);
    expect(query.serialization).toMatchObject({
      status: 'local-only',
      localOnlyGlobalFilterFields: true,
    });
  });

  it('projects every legacy optional branch without inventing multi-rule values', () => {
    const state = new NeuTableStateController();
    state.setFilters(
      {
        name: {
          operator: 'and',
          constraints: [{ mode: 'equals', value: 'Ana', projectionValue: 'ana-id' }],
        },
        status: {
          operator: 'and',
          constraints: [{ value: 'active' }],
        },
      },
      'api',
    );
    state.update({ sort: { key: 'name', dir: 'desc' } }, 'api');
    const { controller, query } = build(state, {
      configuredGlobalFields: true,
      globalFilterFields: [{ accessor: (row) => row.status }],
    });

    const legacy = controller.legacy(query, state.snapshot(), {
      effectivePageSize: 50,
      configuredGlobalFilterFields: true,
      typedFilterKeys: new Set(['status']),
    });

    expect(legacy).toMatchObject({
      sortKey: 'name',
      sortDir: 'desc',
      sort: { key: 'name', dir: 'desc' },
      globalFilterFields: [],
      localOnlyGlobalFilterFields: true,
      columnFilters: { name: 'ana-id', status: 'active' },
      typedColumnFilters: {
        status: { kind: 'custom', mode: 'custom', value: 'active', localOnly: true },
      },
    });
    expect(legacy.typedColumnFilters).not.toHaveProperty('name');
  });

  it('compares every query layer semantically and rejects localized differences', () => {
    const state = new NeuTableStateController();
    state.setFilters(
      {
        score: {
          operator: 'and',
          constraints: [{ mode: 'between', value: { from: 1, to: 2 } }],
        },
      },
      'api',
    );
    const { controller, query } = build(state);
    const filter = query.filters['score'];
    const withFilter = (
      nextFilter: NeuTableQueryColumnFilter,
      serialization: NeuTableQueryState['serialization'] = query.serialization,
    ): NeuTableQueryState => ({
      ...query,
      filters: { score: nextFilter },
      serialization,
    });

    expect(controller.equal(null, query)).toBe(false);
    expect(controller.equal(query, { ...query, page: 2 })).toBe(false);
    expect(controller.equal(query, { ...query, pageSize: 20 })).toBe(false);
    expect(controller.equal(query, { ...query, search: 'x' })).toBe(false);
    expect(controller.equal(query, { ...query, sort: { key: 'name', dir: 'asc' } })).toBe(false);
    expect(controller.equal(query, { ...query, sortEntries: [{ key: 'name', dir: 'asc' }] })).toBe(
      false,
    );
    expect(controller.equal(query, { ...query, globalFilterFields: ['name'] })).toBe(false);
    expect(controller.equal(query, { ...query, filters: {} })).toBe(false);
    expect(controller.equal(query, { ...query, filters: { score: filter, extra: filter } })).toBe(
      false,
    );
    expect(controller.equal(query, withFilter({ ...filter, operator: 'or' }))).toBe(false);
    expect(
      controller.equal(query, withFilter({ ...filter, serializability: 'requires-consumer' })),
    ).toBe(false);
    expect(controller.equal(query, withFilter({ ...filter, constraints: [] }))).toBe(false);
    expect(
      controller.equal(
        query,
        withFilter({
          ...filter,
          constraints: [{ kind: 'number', mode: 'notEquals', value: { from: 1, to: 2 } }],
        }),
      ),
    ).toBe(false);
    expect(
      controller.equal(
        query,
        withFilter(filter, { ...query.serialization, status: 'requires-consumer' }),
      ),
    ).toBe(false);
    expect(
      controller.equal(
        query,
        withFilter(filter, {
          ...query.serialization,
          localOnlyGlobalFilterFields: true,
        }),
      ),
    ).toBe(false);
    expect(
      controller.equal(
        query,
        withFilter(filter, { ...query.serialization, localOnlyFilters: ['score'] }),
      ),
    ).toBe(false);
    expect(
      controller.equal(
        query,
        withFilter(filter, {
          ...query.serialization,
          requiresConsumerSerializationFilters: ['score'],
        }),
      ),
    ).toBe(false);
  });

  it('normalizes duplicate sorts and snapshots dates and nested opaque arrays', () => {
    const state = new NeuTableStateController();
    state.setFilters(
      {
        role: { operator: 'and', constraints: [{ value: [null, ROLE] }] },
      },
      'api',
    );
    const { controller, query } = build(state);
    const patch = controller.controlledPatch({
      ...query,
      sort: { key: 'fallback', dir: 'asc' },
      sortEntries: [
        { key: 'name', dir: 'asc' },
        { key: 'name', dir: 'desc' },
      ],
      filters: {
        dated: {
          operator: 'and',
          serializability: 'serializable',
          constraints: [
            {
              kind: 'custom',
              mode: 'custom',
              value: new Date('2026-08-24T00:00:00Z'),
            },
          ],
        },
        missing: null as unknown as NeuTableQueryColumnFilter,
      },
    });

    expect(patch.sortEntries).toEqual([{ key: 'name', dir: 'asc' }]);
    expect(patch.filters['dated'].constraints[0].value).toEqual(new Date('2026-08-24T00:00:00Z'));
    expect(patch.filters).not.toHaveProperty('missing');
  });

  it('compares dates, arrays, ranges, date points and server projections semantically', () => {
    const { controller, query } = build(new NeuTableStateController());
    type Constraint = NeuTableQueryColumnFilter['constraints'][number];
    const withConstraint = (constraint: Constraint): NeuTableQueryState => ({
      ...query,
      filters: {
        value: {
          operator: 'and',
          serializability: 'serializable',
          constraints: [constraint],
        },
      },
    });
    const custom = (...args: [unknown] | [unknown, unknown]): Constraint => {
      const [value, serverValue] = args;
      return {
        kind: 'custom',
        mode: 'custom',
        value,
        ...(args.length > 1 ? { serverValue } : {}),
      } as Constraint;
    };
    const equalValues = (left: unknown, right: unknown) =>
      controller.equal(withConstraint(custom(left)), withConstraint(custom(right)));

    expect(equalValues(new Date('2026-08-24T00:00:00Z'), new Date('2026-08-24T00:00:00Z'))).toBe(
      true,
    );
    expect(equalValues(new Date('2026-08-24T00:00:00Z'), new Date('2026-08-25T00:00:00Z'))).toBe(
      false,
    );
    expect(equalValues([1, 2], [1, 2])).toBe(true);
    expect(equalValues([1], [1, 2])).toBe(false);
    expect(equalValues([1, 2], [1, 3])).toBe(false);
    expect(equalValues({ from: 1, to: 2 }, { from: 1, to: 2 })).toBe(true);
    expect(equalValues({ from: 1, to: 2 }, { from: 9, to: 2 })).toBe(false);
    expect(equalValues({ from: 1, to: 2 }, { from: 1, to: 9 })).toBe(false);
    expect(
      equalValues(
        { precision: 'date-only', value: '2026-08-24' },
        { precision: 'date-only', value: '2026-08-24' },
      ),
    ).toBe(true);
    expect(
      equalValues(
        { precision: 'date-only', value: '2026-08-24' },
        { precision: 'instant', value: '2026-08-24' },
      ),
    ).toBe(false);
    expect(
      equalValues(
        { precision: 'date-only', value: '2026-08-24' },
        { precision: 'date-only', value: '2026-08-25' },
      ),
    ).toBe(false);

    const left = withConstraint(custom('x'));
    expect(
      controller.equal(left, withConstraint({ kind: 'text', mode: 'contains', value: 'x' })),
    ).toBe(false);
    expect(controller.equal(left, withConstraint(custom('x', 'server')))).toBe(false);
    expect(
      controller.equal(
        withConstraint(custom('x', { from: 1, to: 2 })),
        withConstraint(custom('x', { from: 1, to: 2 })),
      ),
    ).toBe(true);
    expect(
      controller.equal(
        withConstraint(custom('x', { from: 1, to: 2 })),
        withConstraint(custom('x', { from: 1, to: 3 })),
      ),
    ).toBe(false);

    const nullPrototypeRange = Object.assign(Object.create(null) as object, {
      from: 1,
      to: 2,
    });
    expect(equalValues(nullPrototypeRange, { from: 1, to: 2 })).toBe(true);
  });

  it('orders filter maps deterministically and compares equivalent insertion orders', () => {
    const left = new NeuTableStateController();
    const right = new NeuTableStateController();
    left.setFilters(
      {
        score: { operator: 'and', constraints: [{ value: 4 }] },
        name: { operator: 'and', constraints: [{ value: 'Ada' }] },
      },
      'api',
    );
    right.setFilters(
      {
        name: { operator: 'and', constraints: [{ value: 'Ada' }] },
        score: { operator: 'and', constraints: [{ value: 4 }] },
      },
      'api',
    );

    const first = build(left);
    const second = build(right);
    expect(Object.keys(first.query.filters)).toEqual(['name', 'score']);
    expect(first.controller.equal(first.query, second.query)).toBe(true);
  });

  it('classifies unusual option values and cyclic membership arrays without throwing', () => {
    const cyclic: unknown[] = [];
    cyclic.push(cyclic);
    const values: unknown[] = [Number.NaN, Number.POSITIVE_INFINITY, 1n, Symbol('role'), () => 1];
    const columns: readonly NeuTableColumn<QueryRow>[] = [
      { key: 'role', header: 'Role', filterConfig: { kind: 'select' } },
      { key: 'status', header: 'Status', filterConfig: { kind: 'multiSelect' } },
    ];

    for (const value of values) {
      const state = new NeuTableStateController();
      state.setFilters({ role: { operator: 'and', constraints: [{ value }] } }, 'api');
      expect(build(state, { columns }).query.filters['role'].serializability).toBe(
        'requires-consumer',
      );
    }

    const state = new NeuTableStateController();
    state.setFilters(
      {
        role: { operator: 'and', constraints: [{ value: false }] },
        status: { operator: 'and', constraints: [{ value: cyclic }] },
      },
      'api',
    );
    const first = build(state, { columns });
    const second = build(state, { columns });
    const snapshotted = first.query.filters['status'].constraints[0].value as readonly unknown[];
    expect(first.query.filters['role'].serializability).toBe('serializable');
    expect(first.query.filters['status'].serializability).toBe('requires-consumer');
    expect(snapshotted[0]).toBe(snapshotted);
    expect(Object.isFrozen(snapshotted)).toBe(true);
    expect(first.controller.equal(first.query, second.query)).toBe(true);
  });

  it('snapshots serializer DTOs, compares them structurally and fails fast on exceptions', () => {
    const dto = { ids: [1, 2], nested: { active: true } };
    const columns: readonly NeuTableColumn<QueryRow>[] = [
      {
        key: 'role',
        header: 'Role',
        filterConfig: { kind: 'select', serverSerializer: () => dto },
      },
    ];
    const state = new NeuTableStateController();
    state.setFilters({ role: { operator: 'and', constraints: [{ value: ROLE }] } }, 'api');

    const first = build(state, { columns });
    const serverValue = first.query.filters['role'].constraints[0].serverValue as {
      ids: readonly number[];
      nested: { active: boolean };
    };
    dto.ids.push(3);
    dto.nested.active = false;
    expect(serverValue).toEqual({ ids: [1, 2], nested: { active: true } });
    expect(Object.isFrozen(serverValue)).toBe(true);
    expect(Object.isFrozen(serverValue.ids)).toBe(true);
    expect(first.controller.equal(first.query, build(state, { columns }).query)).toBe(false);

    const stableColumns: readonly NeuTableColumn<QueryRow>[] = [
      {
        key: 'role',
        header: 'Role',
        filterConfig: {
          kind: 'select',
          serverSerializer: () => ({ ids: [1, 2], nested: { active: true } }),
        },
      },
    ];
    const stableFirst = build(state, { columns: stableColumns });
    expect(
      stableFirst.controller.equal(
        stableFirst.query,
        build(state, { columns: stableColumns }).query,
      ),
    ).toBe(true);

    const throwingColumns: readonly NeuTableColumn<QueryRow>[] = [
      {
        key: 'role',
        header: 'Role',
        filterConfig: {
          kind: 'select',
          serverSerializer: () => {
            throw new Error('serializer failed');
          },
        },
      },
    ];
    expect(() => build(state, { columns: throwingColumns })).toThrowError('serializer failed');
  });

  it('marks non-transport-safe serializer output for consumer handling', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic['self'] = cyclic;
    const outputs: unknown[] = [cyclic, 1n, Number.NaN, Symbol('server')];
    const state = new NeuTableStateController();
    state.setFilters({ role: { operator: 'and', constraints: [{ value: ROLE }] } }, 'api');

    for (const output of outputs) {
      const columns: readonly NeuTableColumn<QueryRow>[] = [
        {
          key: 'role',
          header: 'Role',
          filterConfig: { kind: 'select', serverSerializer: () => output },
        },
      ];
      expect(build(state, { columns }).query.filters['role'].serializability).toBe(
        'requires-consumer',
      );
    }
  });

  it('handles cyclic range snapshots and semantic cyclic/date serializer comparisons', () => {
    const { controller, query } = build(new NeuTableStateController());
    const cyclicRange: { from: unknown; to: number } = { from: null, to: 2 };
    cyclicRange.from = cyclicRange;
    const controlled = controller.controlledPatch({
      ...query,
      filters: {
        cyclic: {
          operator: 'and',
          serializability: 'requires-consumer',
          constraints: [{ kind: 'custom', mode: 'custom', value: cyclicRange }],
        },
      },
    });
    const snapshotted = controlled.filters['cyclic'].constraints[0].value as {
      from: unknown;
      to: number;
    };
    expect(snapshotted).not.toBe(cyclicRange);
    expect(snapshotted.from).toBe(snapshotted);

    const otherCyclicRange: { from: unknown; to: number } = { from: null, to: 2 };
    otherCyclicRange.from = otherCyclicRange;
    const withCyclicRange = (value: unknown): NeuTableQueryState => ({
      ...query,
      filters: {
        cyclic: {
          operator: 'and',
          serializability: 'requires-consumer',
          constraints: [{ kind: 'custom', mode: 'custom', value }],
        },
      },
    });
    expect(controller.equal(withCyclicRange(cyclicRange), withCyclicRange(otherCyclicRange))).toBe(
      true,
    );

    const state = new NeuTableStateController();
    state.setFilters({ role: { operator: 'and', constraints: [{ value: ROLE }] } }, 'api');
    const cyclicSerializerColumns: readonly NeuTableColumn<QueryRow>[] = [
      {
        key: 'role',
        header: 'Role',
        filterConfig: {
          kind: 'select',
          serverSerializer: () => {
            const value: unknown[] = [];
            value.push(value);
            return value;
          },
        },
      },
    ];
    const cyclicFirst = build(state, { columns: cyclicSerializerColumns });
    expect(
      cyclicFirst.controller.equal(
        cyclicFirst.query,
        build(state, { columns: cyclicSerializerColumns }).query,
      ),
    ).toBe(true);

    const dateSerializerColumns: readonly NeuTableColumn<QueryRow>[] = [
      {
        key: 'role',
        header: 'Role',
        filterConfig: {
          kind: 'select',
          serverSerializer: () => new Date('2026-08-24T00:00:00Z'),
        },
      },
    ];
    const dateFirst = build(state, { columns: dateSerializerColumns });
    expect(
      dateFirst.controller.equal(
        dateFirst.query,
        build(state, { columns: dateSerializerColumns }).query,
      ),
    ).toBe(true);
  });
});
