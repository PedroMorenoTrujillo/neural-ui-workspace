import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { NeuTableComponent } from './neu-table.component';
import type { NeuTableColumn, NeuTableQueryState, NeuTableServerState } from './neu-table.types';

interface StateRow {
  id: number;
  name: string;
}

const COLUMNS: NeuTableColumn<StateRow>[] = [
  { key: 'id', header: 'ID', sortable: true },
  { key: 'name', header: 'Name', sortable: true, filterable: true },
];

const ROWS: StateRow[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
  { id: 3, name: 'Gamma' },
];

const ROLE_ADMIN = { id: 'admin', label: 'Admin' };
const ROLE_VIEWER = { id: 'viewer', label: 'Viewer' };
const TAG_CORE = { id: 'core', label: 'Core' };
const TAG_OPS = { id: 'ops', label: 'Ops' };

interface ServerStateRow extends StateRow {
  role: typeof ROLE_ADMIN;
  tag: typeof TAG_CORE;
}

const SERVER_COLUMNS: NeuTableColumn<ServerStateRow>[] = [
  { key: 'id', header: 'ID', sortable: true },
  { key: 'name', header: 'Name', sortable: true, filterConfig: { kind: 'text' } },
  {
    key: 'role',
    header: 'Role',
    filterConfig: { kind: 'select', options: [ROLE_ADMIN, ROLE_VIEWER] },
  },
  {
    key: 'tag',
    header: 'Tag',
    filterConfig: { kind: 'multiSelect', options: [TAG_CORE, TAG_OPS] },
  },
];

const SERVER_ROWS: ServerStateRow[] = [
  { id: 1, name: 'Alpha', role: ROLE_ADMIN, tag: TAG_CORE },
  { id: 2, name: 'Beta', role: ROLE_VIEWER, tag: TAG_OPS },
  { id: 3, name: 'Gamma', role: ROLE_ADMIN, tag: TAG_OPS },
];

describe('NeuTable canonical state integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideZonelessChangeDetection(),
        provideIcons({ lucidePencil }),
      ],
    }).compileComponents();
  });

  it('routes legacy pagination, search, sort and filter writers through the canonical controller', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('useUrlState', false);
    fixture.componentRef.setInput('pageSize', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;

    table.goToPage(2);
    table.onSearch({ target: { value: 'Beta' } } as unknown as Event);
    table.sortBy('name');
    table.setColumnFilter('name', 'Bet');

    const state = (table as any)._state.snapshot();
    expect(state).toMatchObject({
      page: 1,
      pageSize: 1,
      search: 'Beta',
      sort: { key: 'name', dir: 'asc' },
    });
    expect(state.filters['name'].constraints[0].value).toBe('Bet');
  });

  it('routes key-based selection, expansion and layout writers through the same controller', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('useUrlState', false);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;

    table.toggleRow(ROWS[0]);
    table.expandRow(ROWS[1]);
    table.applyLayout({
      columnOrder: ['name', 'id'],
      hiddenColumns: ['id'],
      columnWidths: { name: 200 },
    });

    const state = (table as any)._state.snapshot();
    expect(state.selectionKeys).toEqual(new Set([1]));
    expect(state.expansionKeys).toEqual(new Set([2]));
    expect(state.layout).toEqual({
      columnOrder: ['name', 'id'],
      hiddenColumns: ['id'],
      columnWidths: { name: 200 },
    });
  });

  it('restores URL state using the active sort mode as canonical precedence', async () => {
    const router = TestBed.inject(Router);
    await router.navigate([], {
      queryParams: {
        page: '2',
        q: 'Beta',
        sort: 'name',
        sortDir: 'desc',
        msort: 'name:asc,id:desc',
      },
    });
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('multiSort', true);
    fixture.componentRef.setInput('pageSize', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    const state = (fixture.componentInstance as any)._state.snapshot();
    expect(state.page).toBe(2);
    expect(state.search).toBe('Beta');
    expect(state.sort).toBeNull();
    expect(state.sortEntries).toEqual([
      { key: 'name', dir: 'asc' },
      { key: 'id', dir: 'desc' },
    ]);
  });

  it('writes canonical UI state to the URL exactly once', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('pageSize', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    navigate.mockClear();

    fixture.componentInstance.goToPage(2);
    await fixture.whenStable();

    expect((fixture.componentInstance as any)._state.page()).toBe(2);
    expect(router.parseUrl(router.url).queryParams['page']).toBe('2');
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('accepts browser-style external URL changes without writing them back', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('pageSize', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    const navigate = vi.spyOn(router, 'navigate');

    await router.navigate([], { queryParams: { page: '3', q: 'Gamma' } });
    await fixture.whenStable();

    expect(fixture.componentInstance.currentPage()).toBe(3);
    expect(fixture.componentInstance.searchQuery()).toBe('Gamma');
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('treats a semantically identical external URL replacement as a canonical no-op', async () => {
    const router = TestBed.inject(Router);
    const queryParams = {
      page: '2',
      q: 'Beta',
      sort: 'name',
      sortDir: 'desc',
      msort: 'name:asc,id:desc',
    };
    await router.navigate([], { queryParams });
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('multiSort', true);
    fixture.componentRef.setInput('pageSize', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const state = (table as any)._state;
    const sort = state.sort();
    const sortEntries = state.sortEntries();
    const update = vi.spyOn(state, 'update');
    const adapter = (table as any)._urlAdapter;
    const writers = [
      vi.spyOn(adapter, 'writeSearch'),
      vi.spyOn(adapter, 'clearSearch'),
      vi.spyOn(adapter, 'writePage'),
      vi.spyOn(adapter, 'writeSort'),
      vi.spyOn(adapter, 'writeSortEntries'),
      vi.spyOn(adapter, 'resetPage'),
    ];

    await router.navigate([], { queryParams: { ...queryParams, unrelated: 'kept' } });
    await fixture.whenStable();

    expect(update.mock.results.every((result: { value: unknown }) => result.value === null)).toBe(
      true,
    );
    expect(state.sort()).toBe(sort);
    expect(state.sortEntries()).toBe(sortEntries);
    expect(writers.every((writer) => writer.mock.calls.length === 0)).toBe(true);
  });

  it('emits one server projection and suppresses a repeated semantic filter no-op', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('useUrlState', false);
    fixture.componentRef.setInput('serverSide', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const events: NeuTableServerState[] = [];
    fixture.componentInstance.serverStateChange.subscribe((event) => events.push(event));

    fixture.componentInstance.setColumnFilter('name', 'Alpha');
    fixture.componentInstance.setColumnFilter('name', 'Alpha');

    expect(events).toHaveLength(1);
    expect(events[0].columnFilters).toEqual({ name: 'Alpha' });
    expect(events[0].page).toBe(1);
  });

  it('writes each URL-supported action exactly once without restore bounce', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('pageSize', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const adapter = (table as any)._urlAdapter;
    const navigate = vi.spyOn(router, 'navigate');
    const writeSearch = vi.spyOn(adapter, 'writeSearch');
    const clearSearch = vi.spyOn(adapter, 'clearSearch');
    const writePage = vi.spyOn(adapter, 'writePage');
    const writeSort = vi.spyOn(adapter, 'writeSort');
    const writeSortEntries = vi.spyOn(adapter, 'writeSortEntries');

    const expectSingleWrite = async (write: ReturnType<typeof vi.spyOn>) => {
      await fixture.whenStable();
      expect(write).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledTimes(1);
      await fixture.whenStable();
      expect(write).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledTimes(1);
      vi.clearAllMocks();
    };

    table.onSearch({ target: { value: 'Alpha' } } as unknown as Event);
    await expectSingleWrite(writeSearch);

    table.clearSearch();
    await expectSingleWrite(clearSearch);

    table.goToPage(2);
    await expectSingleWrite(writePage);

    table.sortBy('name');
    await expectSingleWrite(writeSort);

    fixture.componentRef.setInput('multiSort', true);
    fixture.detectChanges();
    await fixture.whenStable();
    vi.clearAllMocks();
    table.sortBy('name', { shiftKey: true } as MouseEvent);
    await expectSingleWrite(writeSortEntries);
  });

  it('does not write the URL for unrelated canonical state or when URL state is disabled', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('pageSize', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const adapter = (table as any)._urlAdapter;
    const writers = [
      vi.spyOn(adapter, 'writeSearch'),
      vi.spyOn(adapter, 'clearSearch'),
      vi.spyOn(adapter, 'writePage'),
      vi.spyOn(adapter, 'writeSort'),
      vi.spyOn(adapter, 'writeSortEntries'),
      vi.spyOn(adapter, 'resetPage'),
    ];

    table.toggleRow(ROWS[0]);
    table.expandRow(ROWS[0]);
    table.applyLayout({
      columnOrder: ['name', 'id'],
      hiddenColumns: ['id'],
      columnWidths: { name: 180 },
    });
    table.setColumnFilter('name', 'Alpha');
    await fixture.whenStable();
    expect(writers.every((writer) => writer.mock.calls.length === 0)).toBe(true);

    fixture.componentRef.setInput('useUrlState', false);
    fixture.detectChanges();
    await fixture.whenStable();
    table.onSearch({ target: { value: 'Beta' } } as unknown as Event);
    table.clearSearch();
    table.goToPage(2);
    table.sortBy('name');
    table.onPageSizeChange(2);
    fixture.componentRef.setInput('multiSort', true);
    fixture.detectChanges();
    await fixture.whenStable();
    table.sortBy('name', { shiftKey: true } as MouseEvent);
    await fixture.whenStable();

    expect(writers.every((writer) => writer.mock.calls.length === 0)).toBe(true);
  });

  it('preserves the E5 server emission matrix and intentional F1 no-op suppression', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<ServerStateRow>);
    fixture.componentRef.setInput('columns', SERVER_COLUMNS);
    fixture.componentRef.setInput('data', SERVER_ROWS);
    fixture.componentRef.setInput('useUrlState', false);
    fixture.componentRef.setInput('serverSide', true);
    fixture.componentRef.setInput('totalItems', 3);
    fixture.componentRef.setInput('pageSize', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const events: NeuTableServerState[] = [];
    table.serverStateChange.subscribe((event) => events.push(event));

    const expectOne = (action: () => void, expected: Partial<NeuTableServerState>) => {
      events.length = 0;
      action();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject(expected);
    };

    expectOne(() => table.goToPage(2), { page: 2 });
    expectOne(() => table.onPageSizeChange(2), { page: 1, pageSize: 2 });
    expectOne(() => table.onSearch({ target: { value: 'Beta' } } as unknown as Event), {
      page: 1,
      search: 'Beta',
    });
    expectOne(() => table.clearSearch(), { page: 1, search: '' });
    expectOne(() => table.sortBy('name'), { page: 1, sortKey: 'name', sortDir: 'asc' });
    expectOne(() => table.setColumnFilter('name', 'Alpha'), {
      page: 1,
      columnFilters: { name: 'Alpha' },
    });
    events.length = 0;
    table.setColumnFilter('name', 'Alpha');
    expect(events).toHaveLength(0);

    expectOne(() => table.setColumnFilter('role', ROLE_ADMIN), { page: 1 });
    events.length = 0;
    table.setColumnFilter('role', ROLE_ADMIN);
    expect(events).toHaveLength(0);

    expectOne(() => table.setColumnFilter('tag', [TAG_CORE]), { page: 1 });
    events.length = 0;
    table.setColumnFilter('tag', [TAG_CORE]);
    expect(events).toHaveLength(0);

    events.length = 0;
    table.clearColumnFilters();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ page: 1, columnFilters: {}, typedColumnFilters: {} });
  });

  it('projects complete ordered server multisort metadata once', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('serverSide', true);
    fixture.componentRef.setInput('useUrlState', false);
    fixture.componentRef.setInput('multiSort', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const events: NeuTableServerState[] = [];
    fixture.componentInstance.serverStateChange.subscribe((event) => events.push(event));

    fixture.componentInstance.sortBy('name', { shiftKey: true } as MouseEvent);
    fixture.componentInstance.sortBy('id', { shiftKey: true } as MouseEvent);

    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      page: 1,
      sortEntries: [
        { key: 'name', dir: 'asc' },
        { key: 'id', dir: 'asc' },
      ],
    });
    expect((fixture.componentInstance as any)._state.sortEntries()).toEqual([
      { key: 'name', dir: 'asc' },
      { key: 'id', dir: 'asc' },
    ]);
  });

  it('emits one opt-in initial query after URL and input restoration', async () => {
    const router = TestBed.inject(Router);
    await router.navigate([], {
      queryParams: { page: 2, q: 'Beta', sort: 'name', sortDir: 'desc' },
    });
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS.slice(1, 2));
    fixture.componentRef.setInput('serverSide', true);
    fixture.componentRef.setInput('lazyLoadOnInit', true);
    fixture.componentRef.setInput('totalItems', 3);
    fixture.componentRef.setInput('pageSize', 1);
    const queries: NeuTableQueryState[] = [];
    const legacy: NeuTableServerState[] = [];
    fixture.componentInstance.queryChange.subscribe((event) => queries.push(event));
    fixture.componentInstance.serverStateChange.subscribe((event) => legacy.push(event));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(queries).toHaveLength(1);
    expect(legacy).toHaveLength(1);
    expect(queries[0]).toMatchObject({
      page: 2,
      pageSize: 1,
      search: 'Beta',
      sort: { key: 'name', dir: 'desc' },
    });
  });

  it('emits exactly once for plain, controlled and controlled-plus-URL initial loading', async () => {
    const authoritative: NeuTableQueryState = {
      page: 4,
      pageSize: 25,
      search: 'Query',
      sort: { key: 'name', dir: 'desc' },
      sortEntries: [],
      globalFilterFields: ['id', 'name'],
      filters: {},
      serialization: {
        status: 'serializable',
        localOnlyFilters: [],
        requiresConsumerSerializationFilters: [],
        localOnlyGlobalFilterFields: false,
      },
    };
    const create = async (query: NeuTableQueryState | undefined, useUrlState: boolean) => {
      const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.componentRef.setInput('data', ROWS);
      fixture.componentRef.setInput('serverSide', true);
      fixture.componentRef.setInput('lazyLoadOnInit', true);
      fixture.componentRef.setInput('useUrlState', useUrlState);
      if (query) fixture.componentRef.setInput('query', query);
      const queries: NeuTableQueryState[] = [];
      const legacy: NeuTableServerState[] = [];
      fixture.componentInstance.queryChange.subscribe((event) => queries.push(event));
      fixture.componentInstance.serverStateChange.subscribe((event) => legacy.push(event));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      return { queries, legacy };
    };

    const plain = await create(undefined, false);
    expect(plain.queries).toHaveLength(1);
    expect(plain.legacy).toHaveLength(1);
    expect(plain.queries[0]).toMatchObject({ page: 1, pageSize: 10, search: '', sort: null });

    const controlled = await create(authoritative, false);
    expect(controlled.queries).toHaveLength(1);
    expect(controlled.legacy).toHaveLength(1);
    expect(controlled.queries[0]).toMatchObject(authoritative);

    const router = TestBed.inject(Router);
    await router.navigate([], { queryParams: { page: 2, q: 'URL', sort: 'id' } });
    const controlledWithUrl = await create(authoritative, true);
    expect(controlledWithUrl.queries).toHaveLength(1);
    expect(controlledWithUrl.legacy).toHaveLength(1);
    expect(controlledWithUrl.queries[0]).toMatchObject(authoritative);
  });

  it('keeps initial loading disabled by default for legacy server consumers', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('serverSide', true);
    fixture.componentRef.setInput('useUrlState', false);
    const queries: NeuTableQueryState[] = [];
    const legacy: NeuTableServerState[] = [];
    fixture.componentInstance.queryChange.subscribe((event) => queries.push(event));
    fixture.componentInstance.serverStateChange.subscribe((event) => legacy.push(event));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(queries).toEqual([]);
    expect(legacy).toEqual([]);
  });

  it('treats initial lazy loading as a server-only mount-time decision', async () => {
    const clientFixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    clientFixture.componentRef.setInput('columns', COLUMNS);
    clientFixture.componentRef.setInput('data', ROWS);
    clientFixture.componentRef.setInput('useUrlState', false);
    clientFixture.componentRef.setInput('lazyLoadOnInit', true);
    const clientQueries: NeuTableQueryState[] = [];
    clientFixture.componentInstance.queryChange.subscribe((event) => clientQueries.push(event));
    clientFixture.detectChanges();
    await clientFixture.whenStable();
    expect(clientQueries).toEqual([]);

    clientFixture.componentRef.setInput('serverSide', true);
    clientFixture.detectChanges();
    await clientFixture.whenStable();
    expect(clientQueries).toEqual([]);

    const serverFixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    serverFixture.componentRef.setInput('columns', COLUMNS);
    serverFixture.componentRef.setInput('data', ROWS);
    serverFixture.componentRef.setInput('useUrlState', false);
    serverFixture.componentRef.setInput('serverSide', true);
    const serverQueries: NeuTableQueryState[] = [];
    serverFixture.componentInstance.queryChange.subscribe((event) => serverQueries.push(event));
    serverFixture.detectChanges();
    await serverFixture.whenStable();
    serverFixture.componentRef.setInput('lazyLoadOnInit', true);
    serverFixture.detectChanges();
    await serverFixture.whenStable();
    expect(serverQueries).toEqual([]);
  });

  it('emits canonical query changes in client mode without legacy server events', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('useUrlState', false);
    fixture.detectChanges();
    await fixture.whenStable();
    const queries: NeuTableQueryState[] = [];
    const legacy: NeuTableServerState[] = [];
    fixture.componentInstance.queryChange.subscribe((event) => queries.push(event));
    fixture.componentInstance.serverStateChange.subscribe((event) => legacy.push(event));

    fixture.componentInstance.onSearch({ target: { value: 'Beta' } } as unknown as Event);

    expect(queries).toHaveLength(1);
    expect(queries[0].search).toBe('Beta');
    expect(legacy).toEqual([]);
  });

  it('treats query as authoritative over URL, pageSize and sort inputs with atomic silent echo', async () => {
    const router = TestBed.inject(Router);
    await router.navigate([], { queryParams: { page: 3, q: 'URL', sort: 'id' } });
    const authoritative: NeuTableQueryState = {
      page: 1,
      pageSize: 1,
      search: '',
      sort: null,
      sortEntries: [],
      globalFilterFields: ['id', 'name'],
      filters: {},
      serialization: {
        status: 'serializable',
        localOnlyFilters: [],
        requiresConsumerSerializationFilters: [],
        localOnlyGlobalFilterFields: false,
      },
    };
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS.slice(0, 1));
    fixture.componentRef.setInput('serverSide', true);
    fixture.componentRef.setInput('totalItems', 3);
    fixture.componentRef.setInput('pageSize', 25);
    fixture.componentRef.setInput('sort', [{ key: 'name', dir: 'desc' }]);
    fixture.componentRef.setInput('query', authoritative);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const queries: NeuTableQueryState[] = [];
    const legacy: NeuTableServerState[] = [];
    table.queryChange.subscribe((event) => queries.push(event));
    table.serverStateChange.subscribe((event) => legacy.push(event));
    const adapter = (table as any)._urlAdapter;
    const writers = [
      vi.spyOn(adapter, 'writePage'),
      vi.spyOn(adapter, 'writeSearch'),
      vi.spyOn(adapter, 'writeSort'),
      vi.spyOn(adapter, 'resetPage'),
    ];

    expect(table.currentPage()).toBe(1);
    expect(table.searchQuery()).toBe('');
    expect(table.currentSort()).toEqual([]);
    expect((table as any)._state.pageSize()).toBe(1);

    table.goToPage(2);
    expect(queries).toHaveLength(1);
    expect(legacy).toHaveLength(1);
    expect(queries[0]).toMatchObject({ page: 2, pageSize: 1 });
    expect(table.currentPage()).toBe(1);

    table.goToPage(2);
    expect(queries).toHaveLength(1);
    expect(legacy).toHaveLength(1);

    fixture.componentRef.setInput('query', queries[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table.currentPage()).toBe(2);
    expect(queries).toHaveLength(1);
    expect(legacy).toHaveLength(1);

    table.onPageSizeChange(2);
    expect(queries).toHaveLength(2);
    expect(queries[1]).toMatchObject({ page: 1, pageSize: 2 });
    expect(table.currentPage()).toBe(2);
    expect((table as any)._state.pageSize()).toBe(1);
    expect(writers.every((writer) => writer.mock.calls.length === 0)).toBe(true);

    fixture.componentRef.setInput('sort', [{ key: 'id', dir: 'asc' }]);
    fixture.componentRef.setInput('query', { ...authoritative, page: 2, search: 'Echo' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table.currentPage()).toBe(2);
    expect(table.searchQuery()).toBe('Echo');
    expect(table.currentSort()).toEqual([]);
    expect(queries).toHaveLength(2);

    fixture.componentRef.setInput('query', undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table.currentPage()).toBe(3);
    expect(table.searchQuery()).toBe('URL');
    expect((table as any)._state.pageSize()).toBe(25);
    expect(table.currentSort()).toEqual([{ key: 'id', dir: 'asc' }]);
  });

  it('emits one semantic query for serializer/global-field changes and column invalidation', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<ServerStateRow>);
    fixture.componentRef.setInput('columns', SERVER_COLUMNS);
    fixture.componentRef.setInput('data', SERVER_ROWS);
    fixture.componentRef.setInput('useUrlState', false);
    fixture.componentRef.setInput('serverSide', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const queries: NeuTableQueryState[] = [];
    fixture.componentInstance.queryChange.subscribe((event) => queries.push(event));

    fixture.componentInstance.setColumnFilter('role', ROLE_ADMIN);
    queries.length = 0;
    fixture.componentRef.setInput(
      'columns',
      SERVER_COLUMNS.map((column) =>
        column.key === 'role'
          ? {
              ...column,
              filterConfig: {
                ...column.filterConfig!,
                serverSerializer: (value: unknown) => (value as { id: string }).id,
              },
            }
          : column,
      ),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(queries).toHaveLength(1);
    expect(queries[0].filters['role'].constraints[0].serverValue).toBe('admin');

    queries.length = 0;
    fixture.componentRef.setInput('globalFilterFields', ['name']);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(queries).toHaveLength(1);
    expect(queries[0].globalFilterFields).toEqual(['name']);

    queries.length = 0;
    fixture.componentRef.setInput(
      'columns',
      SERVER_COLUMNS.filter((column) => column.key !== 'role'),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(queries).toHaveLength(1);
    expect(queries[0].filters).not.toHaveProperty('role');
  });

  it('keeps canonical layout isolated from input and returned-layout mutation', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<StateRow>);
    const inputLayout = {
      columnOrder: ['name', 'id'],
      hiddenColumns: ['id'],
      columnWidths: { name: 180 },
    };
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('initialLayout', inputLayout);
    fixture.detectChanges();
    await fixture.whenStable();

    inputLayout.columnOrder.reverse();
    inputLayout.hiddenColumns.length = 0;
    inputLayout.columnWidths['name'] = 999;
    const returned = fixture.componentInstance.currentLayout();
    returned.columnOrder.reverse();
    returned.hiddenColumns.length = 0;
    returned.columnWidths['name'] = 1;

    expect((fixture.componentInstance as any)._state.snapshot().layout).toEqual({
      columnOrder: ['name', 'id'],
      hiddenColumns: ['id'],
      columnWidths: { name: 180 },
    });
  });
});
