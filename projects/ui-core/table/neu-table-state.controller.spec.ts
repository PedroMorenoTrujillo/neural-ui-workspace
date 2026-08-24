import { describe, expect, it, vi } from 'vitest';
import {
  NeuTableStateController,
  type InternalAppliedColumnFilter,
  type InternalNeuTableStateChange,
} from './neu-table-state.controller';

describe('NeuTableStateController', () => {
  it('starts with the normalized uncontrolled default state', () => {
    const controller = new NeuTableStateController<number>();

    expect(controller.controlled()).toBe(false);
    expect(controller.snapshot()).toEqual({
      page: 1,
      pageSize: 10,
      search: '',
      sort: null,
      sortEntries: [],
      filters: {},
      selectionKeys: new Set(),
      expansionKeys: new Set(),
      layout: { columnOrder: [], hiddenColumns: [], columnWidths: {} },
    });
  });

  it('returns immutable snapshots for arrays, sets, dates, ranges and layout records', () => {
    const sourceDate = new Date('2026-08-24T10:00:00.000Z');
    const controller = new NeuTableStateController<number>();
    controller.update(
      {
        filters: {
          createdAt: {
            operator: 'and',
            constraints: [{ value: sourceDate }],
          },
          score: {
            operator: 'and',
            constraints: [{ value: { from: 1, to: 5 } }],
          },
        },
        selectionKeys: new Set([1]),
        expansionKeys: new Set([2]),
        layout: {
          columnOrder: ['name'],
          hiddenColumns: ['age'],
          columnWidths: { name: 180 },
        },
      },
      'api',
    );

    const snapshot = controller.snapshot();
    snapshot.selectionKeys = new Set([99]);
    snapshot.expansionKeys = new Set([99]);
    snapshot.layout.columnOrder.push('age');
    snapshot.layout.columnWidths['name'] = 999;
    (snapshot.filters['createdAt'].constraints[0].value as Date).setUTCFullYear(2030);
    (snapshot.filters['score'].constraints[0].value as { from: number }).from = 99;

    const next = controller.snapshot();
    expect(next.selectionKeys).toEqual(new Set([1]));
    expect(next.expansionKeys).toEqual(new Set([2]));
    expect(next.layout).toEqual({
      columnOrder: ['name'],
      hiddenColumns: ['age'],
      columnWidths: { name: 180 },
    });
    expect(next.filters['createdAt'].constraints[0].value).toEqual(sourceDate);
    expect(next.filters['score'].constraints[0].value).toEqual({ from: 1, to: 5 });
  });

  it('normalizes page and page-size updates', () => {
    const controller = new NeuTableStateController();

    controller.setPage(4.8, 'ui');
    controller.setPageSize(25.9, 'ui');
    expect(controller.page()).toBe(4);
    expect(controller.pageSize()).toBe(25);

    controller.setPage(-10, 'api');
    controller.setPageSize(Number.NaN, 'api');
    expect(controller.page()).toBe(1);
    expect(controller.pageSize()).toBe(1);
  });

  it('updates search and single-sort state', () => {
    const controller = new NeuTableStateController();

    controller.setSearch('neural', 'ui');
    controller.setSort({ key: 'name', dir: 'desc' }, 'ui');

    expect(controller.search()).toBe('neural');
    expect(controller.sort()).toEqual({ key: 'name', dir: 'desc' });
  });

  it('snapshots normalized multisort entries', () => {
    const entries = [{ key: 'name', dir: 'asc' as const }];
    const controller = new NeuTableStateController();

    controller.setSortEntries(entries, 'ui');
    entries[0].key = 'mutated';

    expect(controller.sortEntries()).toEqual([{ key: 'name', dir: 'asc' }]);
  });

  it('owns the sole applied-filter snapshot while preserving opaque option identity', () => {
    const option = { id: 1, label: 'Admin' };
    const filters: Record<string, InternalAppliedColumnFilter> = {
      role: { operator: 'and', constraints: [{ value: option }] },
    };
    const controller = new NeuTableStateController();

    controller.setFilters(filters, 'api');

    expect(controller.filters()['role'].constraints[0].value).toBe(option);
    filters['role'] = { operator: 'and', constraints: [{ value: { id: 2 } }] };
    expect(controller.filters()['role'].constraints[0].value).toBe(option);
  });

  it('updates selection keys by key identity', () => {
    const controller = new NeuTableStateController<number>();
    const source = new Set([1, 2]);

    controller.setSelectionKeys(source, 'ui');
    source.add(3);

    expect(controller.selectionKeys()).toEqual(new Set([1, 2]));
  });

  it('updates expansion keys by key identity', () => {
    const controller = new NeuTableStateController<string>();

    controller.setExpansionKeys(new Set(['row-1']), 'ui');

    expect(controller.expansionKeys()).toEqual(new Set(['row-1']));
  });

  it('updates a cloned layout snapshot', () => {
    const layout = {
      columnOrder: ['name', 'age'],
      hiddenColumns: ['age'],
      columnWidths: { name: 160 },
    };
    const controller = new NeuTableStateController();

    controller.setLayout(layout, 'api');
    layout.columnOrder.reverse();
    layout.columnWidths['name'] = 10;

    expect(controller.layout()).toEqual({
      columnOrder: ['name', 'age'],
      hiddenColumns: ['age'],
      columnWidths: { name: 160 },
    });
  });

  it('suppresses semantic no-op updates and change callbacks', () => {
    const listener = vi.fn();
    const controller = new NeuTableStateController(listener);

    expect(controller.setPage(1, 'ui')).toBeNull();
    expect(controller.setLayout(controller.snapshot().layout, 'api')).toBeNull();
    expect(listener).not.toHaveBeenCalled();
  });

  it('commits uncontrolled changes immediately with one typed intent', () => {
    const events: InternalNeuTableStateChange[] = [];
    const controller = new NeuTableStateController((event) => events.push(event));

    controller.update({ page: 2, search: 'Ana' }, 'ui');

    expect(controller.page()).toBe(2);
    expect(controller.search()).toBe('Ana');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      changedKeys: ['page', 'search'],
      origin: 'ui',
      committed: true,
    });
  });

  it('keeps external controlled state authoritative for UI proposals', () => {
    const events: InternalNeuTableStateChange[] = [];
    const controller = new NeuTableStateController((event) => events.push(event));
    controller.setControlledState({ ...controller.snapshot(), page: 3 });
    events.length = 0;

    const proposal = controller.setPage(4, 'ui');

    expect(proposal?.committed).toBe(false);
    expect(proposal?.current.page).toBe(4);
    expect(controller.page()).toBe(3);
    expect(events).toHaveLength(1);
  });

  it('controls only selection while pagination remains independently uncontrolled', () => {
    const events: InternalNeuTableStateChange<number>[] = [];
    const controller = new NeuTableStateController<number>((event) => events.push(event));
    controller.setControlledSelectionKeys(new Set([1]));

    const selectionProposal = controller.setSelectionKeys(new Set([2]), 'ui');
    const pageCommit = controller.setPage(2, 'ui');

    expect(selectionProposal?.committed).toBe(false);
    expect(controller.selectionKeys()).toEqual(new Set([1]));
    expect(pageCommit?.committed).toBe(true);
    expect(controller.page()).toBe(2);
    expect(events.map((event) => event.changedKeys)).toEqual([['selectionKeys'], ['page']]);
  });

  it('controls only sort slices while committing an atomic page reset proposal', () => {
    const controller = new NeuTableStateController();
    controller.setPage(3, 'api');
    controller.setControlledSort({ key: 'name', dir: 'asc' }, []);

    const proposal = controller.update(
      { sort: { key: 'name', dir: 'desc' }, page: 1 },
      'ui',
    );

    expect(proposal).toMatchObject({
      committed: false,
      current: { page: 1, sort: { key: 'name', dir: 'desc' } },
    });
    expect(controller.page()).toBe(1);
    expect(controller.sort()).toEqual({ key: 'name', dir: 'asc' });

    controller.setControlledSort({ key: 'name', dir: 'desc' }, []);
    expect(controller.sort()).toEqual({ key: 'name', dir: 'desc' });
    controller.releaseControlledSort();
    expect(controller.controlled()).toBe(false);
  });

  it('commits uncontrolled slices from a mixed proposal without committing selection', () => {
    const controller = new NeuTableStateController<number>();
    controller.setControlledSelectionKeys(new Set([1]));

    const proposal = controller.update({ page: 3, selectionKeys: new Set([2]) }, 'ui');

    expect(proposal?.committed).toBe(false);
    expect(proposal?.current.page).toBe(3);
    expect(proposal?.current.selectionKeys).toEqual(new Set([2]));
    expect(controller.page()).toBe(3);
    expect(controller.selectionKeys()).toEqual(new Set([1]));
  });

  it('commits a controlled selection echo without emitting a second intent', () => {
    const listener = vi.fn();
    const controller = new NeuTableStateController<number>(listener);
    controller.setControlledSelectionKeys(new Set([1]));
    controller.setSelectionKeys(new Set([2]), 'ui');

    controller.setControlledSelectionKeys(new Set([2]));

    expect(controller.selectionKeys()).toEqual(new Set([2]));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('replaces controlled state only when the consumer supplies a new snapshot', () => {
    const controller = new NeuTableStateController();
    controller.setControlledState({ ...controller.snapshot(), page: 3 });
    controller.setPage(4, 'ui');

    controller.setControlledState({ ...controller.snapshot(), page: 4 });

    expect(controller.page()).toBe(4);
    expect(controller.controlled()).toBe(true);
  });

  it('does not emit a write-back intent when a controlled proposal is replaced', () => {
    const listener = vi.fn();
    const controller = new NeuTableStateController(listener);
    controller.setControlledState({ ...controller.snapshot(), page: 2 });
    listener.mockClear();

    controller.setPage(3, 'ui');
    controller.setControlledState({ ...controller.snapshot(), page: 3 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toMatchObject({
      origin: 'ui',
      committed: false,
      current: { page: 3 },
    });
  });

  it('retains the last authoritative snapshot when returning to uncontrolled mode', () => {
    const controller = new NeuTableStateController();
    controller.setControlledState({ ...controller.snapshot(), page: 5 });

    controller.releaseControlledState();
    controller.setPage(6, 'ui');

    expect(controller.controlled()).toBe(false);
    expect(controller.page()).toBe(6);
  });

  it('preserves explicit origins in committed and proposed changes', () => {
    const events: InternalNeuTableStateChange[] = [];
    const controller = new NeuTableStateController((event) => events.push(event));

    controller.setSearch('url value', 'url');
    controller.setControlledState({ ...controller.snapshot(), page: 2 });
    controller.setSearch('UI value', 'ui');

    expect(events.map((event) => event.origin)).toEqual(['url', 'ui']);
    expect(events.map((event) => event.committed)).toEqual([true, false]);
  });

  it('normalizes a complete controlled snapshot at the boundary', () => {
    const controller = new NeuTableStateController<number>();
    const snapshot = controller.snapshot() as any;

    controller.setControlledState({
      ...snapshot,
      page: Number.NaN,
      pageSize: Number.NaN,
      search: undefined,
      sort: { key: 7, dir: 'invalid' },
      sortEntries: [
        { key: 1, dir: 'invalid' },
        { key: 'name', dir: 'desc' },
      ],
      layout: { columnOrder: undefined, hiddenColumns: undefined, columnWidths: undefined },
    });

    expect(controller.snapshot()).toMatchObject({
      page: 1,
      pageSize: 1,
      search: '',
      sort: { key: '7', dir: 'asc' },
      sortEntries: [
        { key: '1', dir: 'asc' },
        { key: 'name', dir: 'desc' },
      ],
      layout: { columnOrder: [], hiddenColumns: [], columnWidths: {} },
    });
  });

  it('normalizes explicitly undefined partial slices without disturbing omitted slices', () => {
    const controller = new NeuTableStateController<number>();
    controller.update(
      {
        page: 3,
        pageSize: 25,
        search: 'kept only until replaced',
        sortEntries: [{ key: 'name', dir: 'asc' }],
        selectionKeys: new Set([1]),
        expansionKeys: new Set([2]),
      },
      'api',
    );

    controller.update(
      {
        page: undefined,
        pageSize: undefined,
        search: undefined,
        sortEntries: undefined,
        filters: undefined,
        selectionKeys: undefined,
        expansionKeys: undefined,
        layout: undefined,
      } as any,
      'persistence',
    );

    expect(controller.snapshot()).toMatchObject({
      page: 1,
      pageSize: 1,
      search: '',
      sortEntries: [],
      filters: {},
      selectionKeys: new Set(),
      expansionKeys: new Set(),
      layout: { columnOrder: [], hiddenColumns: [], columnWidths: {} },
    });
  });

  it('detects semantic filter equality for dates, arrays, ranges and date points', () => {
    const listener = vi.fn();
    const controller = new NeuTableStateController(listener);
    const filters = {
      date: { operator: 'and' as const, constraints: [{ value: new Date(100) }] },
      list: { operator: 'and' as const, constraints: [{ value: [1, 2] }] },
      range: { operator: 'and' as const, constraints: [{ value: { from: 1, to: 2 } }] },
      point: {
        operator: 'and' as const,
        constraints: [{ value: { precision: 'instant', value: '2026-08-24' } }],
      },
    };
    controller.setFilters(filters, 'api');
    listener.mockClear();

    expect(
      controller.setFilters(
        {
          date: { operator: 'and', constraints: [{ value: new Date(100) }] },
          list: { operator: 'and', constraints: [{ value: [1, 2] }] },
          range: { operator: 'and', constraints: [{ value: { from: 1, to: 2 } }] },
          point: {
            operator: 'and',
            constraints: [{ value: { precision: 'instant', value: '2026-08-24' } }],
          },
        },
        'api',
      ),
    ).toBeNull();

    expect(
      controller.setFilters(
        { ...filters, list: { operator: 'and', constraints: [{ value: [1] }] } },
        'api',
      ),
    ).not.toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('detects different same-size key sets and filter structures', () => {
    const controller = new NeuTableStateController<number>();
    controller.setSelectionKeys(new Set([1]), 'api');
    expect(controller.setSelectionKeys(new Set([2]), 'api')).not.toBeNull();

    controller.setFilters(
      { name: { operator: 'and', constraints: [{ mode: 'contains', value: 'A' }] } },
      'api',
    );
    expect(
      controller.setFilters(
        { name: { operator: 'or', constraints: [{ mode: 'contains', value: 'A' }] } },
        'api',
      ),
    ).not.toBeNull();
    expect(
      controller.setFilters(
        {
          name: {
            operator: 'or',
            constraints: [
              { mode: 'contains', value: 'A' },
              { mode: 'equals', value: 'B' },
            ],
          },
        },
        'api',
      ),
    ).not.toBeNull();
  });

  it('provides writable compatibility facades that still commit through the controller', () => {
    const controller = new NeuTableStateController();
    const filters = controller.createFiltersFacade();
    const order = controller.createColumnOrderFacade('column-lifecycle');

    filters.set({ name: { operator: 'and', constraints: [{ value: 'A' }] } });
    filters.update((current) => ({
      ...current,
      city: { operator: 'and', constraints: [{ value: 'Madrid' }] },
    }));
    order.set(['name']);
    order.update((current) => [...current, 'city']);

    expect(filters.asReadonly()()).toEqual({
      name: { operator: 'and', constraints: [{ value: 'A' }] },
      city: { operator: 'and', constraints: [{ value: 'Madrid' }] },
    });
    expect(order.asReadonly()()).toEqual(['name', 'city']);
    expect(controller.layout().columnOrder).toEqual(['name', 'city']);
  });

  it('does not expose controller-owned mutable references through live projections', () => {
    const option = { id: 1, label: 'Admin' };
    const controller = new NeuTableStateController<number>();
    controller.update(
      {
        sort: { key: 'name', dir: 'asc' },
        sortEntries: [{ key: 'name', dir: 'asc' }],
        filters: {
          createdAt: {
            operator: 'and',
            constraints: [{ value: new Date('2026-08-24T10:00:00.000Z') }],
          },
          range: {
            operator: 'and',
            constraints: [{ mode: 'between', value: { from: 1, to: 5 } }],
          },
          roles: { operator: 'and', constraints: [{ mode: 'in', value: [option] }] },
        },
        selectionKeys: new Set([1]),
        expansionKeys: new Set([2]),
        layout: {
          columnOrder: ['name'],
          hiddenColumns: ['age'],
          columnWidths: { name: 180 },
        },
      },
      'api',
    );

    const sort = controller.sort()!;
    const sortEntries = controller.sortEntries() as Array<{ key: string; dir: 'asc' | 'desc' }>;
    const filters = controller.filters() as Record<string, InternalAppliedColumnFilter>;
    const selection = controller.selectionKeys() as Set<number>;
    const expansion = controller.expansionKeys() as Set<number>;
    const layout = controller.layout();
    sort.key = 'mutated';
    sortEntries[0].key = 'mutated';
    (filters['createdAt'].constraints[0].value as Date).setUTCFullYear(2030);
    (filters['range'].constraints[0].value as { from: number }).from = 99;
    (filters['roles'].constraints[0].value as unknown[])[0] = { id: 2 };
    filters['extra'] = { operator: 'and', constraints: [{ value: true }] };
    selection.add(99);
    expansion.add(99);
    layout.columnOrder.push('age');
    layout.hiddenColumns.length = 0;
    layout.columnWidths['name'] = 999;

    expect(controller.snapshot()).toEqual({
      page: 1,
      pageSize: 10,
      search: '',
      sort: { key: 'name', dir: 'asc' },
      sortEntries: [{ key: 'name', dir: 'asc' }],
      filters: {
        createdAt: {
          operator: 'and',
          constraints: [{ value: new Date('2026-08-24T10:00:00.000Z') }],
        },
        range: {
          operator: 'and',
          constraints: [{ mode: 'between', value: { from: 1, to: 5 } }],
        },
        roles: { operator: 'and', constraints: [{ mode: 'in', value: [option] }] },
      },
      selectionKeys: new Set([1]),
      expansionKeys: new Set([2]),
      layout: {
        columnOrder: ['name'],
        hiddenColumns: ['age'],
        columnWidths: { name: 180 },
      },
    });
  });

  it('preserves filter identity semantics for primitives, opaque options and MultiSelect items', () => {
    const controller = new NeuTableStateController();
    const option = { id: 1, label: 'Admin' };
    const lookalike = { id: 1, label: 'Admin' };
    const filter = (value: unknown, mode?: 'equals' | 'in') => ({
      value: { operator: 'and' as const, constraints: [{ ...(mode ? { mode } : {}), value }] },
    });

    controller.setFilters(filter(option, 'equals'), 'api');
    expect(controller.setFilters(filter(option, 'equals'), 'api')).toBeNull();
    expect(controller.setFilters(filter(lookalike, 'equals'), 'api')).not.toBeNull();

    controller.setFilters(filter(Number.NaN), 'api');
    expect(controller.setFilters(filter(Number.NaN), 'api')).toBeNull();
    controller.setFilters(filter(0), 'api');
    expect(controller.setFilters(filter(0), 'api')).toBeNull();
    controller.setFilters(filter(false), 'api');
    expect(controller.setFilters(filter(false), 'api')).toBeNull();

    controller.setFilters(filter([option], 'in'), 'api');
    expect(controller.setFilters(filter([option], 'in'), 'api')).toBeNull();
    expect(controller.setFilters(filter([lookalike], 'in'), 'api')).not.toBeNull();
  });

  it('emits one deterministic proposal for each repeated controlled intent', () => {
    const listener = vi.fn();
    const controller = new NeuTableStateController(listener);
    controller.setControlledState({ ...controller.snapshot(), page: 1 });
    listener.mockClear();

    const first = controller.setPage(2, 'ui');
    const second = controller.setPage(2, 'ui');

    expect(controller.page()).toBe(1);
    expect(first).toMatchObject({ committed: false, previous: { page: 1 }, current: { page: 2 } });
    expect(second).toMatchObject({ committed: false, previous: { page: 1 }, current: { page: 2 } });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('suppresses semantically identical controlled replacements across structured slices', () => {
    const listener = vi.fn();
    const controller = new NeuTableStateController<number>(listener);
    const authoritative = {
      ...controller.snapshot(),
      sort: { key: 'name', dir: 'asc' as const },
      sortEntries: [{ key: 'name', dir: 'asc' as const }],
      filters: {
        createdAt: {
          operator: 'and' as const,
          constraints: [{ value: new Date('2026-08-24T10:00:00.000Z') }],
        },
      },
      selectionKeys: new Set([1]),
      expansionKeys: new Set([2]),
      layout: { columnOrder: ['name'], hiddenColumns: ['age'], columnWidths: { name: 180 } },
    };
    controller.setControlledState(authoritative);
    listener.mockClear();

    const replacement = controller.setControlledState({
      ...authoritative,
      sort: { ...authoritative.sort },
      sortEntries: authoritative.sortEntries.map((entry) => ({ ...entry })),
      filters: {
        createdAt: {
          operator: 'and',
          constraints: [{ value: new Date('2026-08-24T10:00:00.000Z') }],
        },
      },
      selectionKeys: new Set([1]),
      expansionKeys: new Set([2]),
      layout: { columnOrder: ['name'], hiddenColumns: ['age'], columnWidths: { name: 180 } },
    });

    expect(replacement).toBeNull();
    expect(listener).not.toHaveBeenCalled();
  });

  it('preserves unrelated projection references for a granular page update', () => {
    const controller = new NeuTableStateController<number>();
    controller.update(
      {
        filters: { name: { operator: 'and', constraints: [{ value: 'A' }] } },
        selectionKeys: new Set([1]),
        expansionKeys: new Set([2]),
        layout: { columnOrder: ['name'], hiddenColumns: [], columnWidths: {} },
      },
      'api',
    );
    const filters = controller.filters();
    const selection = controller.selectionKeys();
    const expansion = controller.expansionKeys();
    const layout = controller.layout();

    controller.setPage(2, 'ui');

    expect(controller.filters()).toBe(filters);
    expect(controller.selectionKeys()).toBe(selection);
    expect(controller.expansionKeys()).toBe(expansion);
    expect(controller.layout()).toBe(layout);
  });
});
