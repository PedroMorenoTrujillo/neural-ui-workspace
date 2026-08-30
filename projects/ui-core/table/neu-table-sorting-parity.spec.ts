import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NeuTableComponent } from './neu-table.component';
import type { NeuTableColumn, NeuTableServerState, NeuTableSortState } from './neu-table.types';

interface Row {
  id: number;
  name: string;
  email: string;
  role: string;
  score: number;
  primary: number;
  secondary: number;
}

const ROWS: Row[] = [
  {
    id: 1,
    name: 'beta',
    email: 'beta@example.com',
    role: 'Admin',
    score: 10,
    primary: 9,
    secondary: 1,
  },
  {
    id: 2,
    name: 'Alpha',
    email: 'alpha@example.com',
    role: 'Viewer',
    score: 2,
    primary: 1,
    secondary: 8,
  },
  {
    id: 3,
    name: 'Gamma',
    email: 'gamma@example.com',
    role: 'Admin',
    score: 30,
    primary: 4,
    secondary: 2,
  },
];

const COLUMNS: NeuTableColumn<Row>[] = [
  { key: 'id', header: 'ID', sortable: true },
  { key: 'name', header: 'Name', sortable: true, filterable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'score', header: 'Score', sortable: true },
];

describe('NeuTable sorting and global-filter migration parity', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideZonelessChangeDetection(),
        provideIcons({ lucidePencil }),
      ],
    }).compileComponents();
  });

  function createTable(options: { server?: boolean; url?: boolean; multi?: boolean } = {}) {
    const fixture = TestBed.createComponent(NeuTableComponent<Row>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('sortable', true);
    fixture.componentRef.setInput('serverSide', options.server ?? false);
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: options.url ?? false,
    });
    fixture.componentRef.setInput('multiSort', options.multi ?? false);
    fixture.componentRef.setInput('pageSize', 1);
    fixture.detectChanges();
    return fixture;
  }

  it('cycles none -> asc -> desc -> none repeatedly and emits one immutable event per action', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('removableSort', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const events: NeuTableSortState[] = [];
    fixture.componentInstance.sortChange.subscribe((event) => events.push(event));

    fixture.componentInstance.sortBy('name');
    fixture.componentInstance.sortBy('name');
    fixture.componentInstance.sortBy('name');
    fixture.componentInstance.sortBy('name');

    expect(events).toEqual([
      [{ key: 'name', dir: 'asc' }],
      [{ key: 'name', dir: 'desc' }],
      [],
      [{ key: 'name', dir: 'asc' }],
    ]);
    expect(Object.isFrozen(events[0])).toBe(true);
    expect(Object.isFrozen(events[0][0])).toBe(true);
  });

  it('cleans single-sort URL params and resets page atomically when unsorted', async () => {
    const router = TestBed.inject(Router);
    const fixture = createTable({ url: true });
    fixture.componentRef.setInput('removableSort', true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.sortBy('name');
    await fixture.whenStable();
    fixture.componentInstance.goToPage(2);
    fixture.componentInstance.sortBy('name');
    fixture.componentInstance.sortBy('name');
    await fixture.whenStable();

    expect(fixture.componentInstance.currentPage()).toBe(1);
    expect(router.parseUrl(router.url).queryParams['sort']).toBeUndefined();
    expect(router.parseUrl(router.url).queryParams['sortDir']).toBeUndefined();
  });

  it('uses explicit nullable server sort while preserving legacy fields when unsorted', async () => {
    const fixture = createTable({ server: true });
    fixture.componentRef.setInput('removableSort', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const events: NeuTableServerState[] = [];
    fixture.componentInstance.serverStateChange.subscribe((event) => events.push(event));

    fixture.componentInstance.sortBy('name');
    fixture.componentInstance.sortBy('name');
    fixture.componentInstance.sortBy('name');

    expect(events).toHaveLength(3);
    expect(events[2].sortKey).toBe('');
    expect(events[2].sortDir).toBe('asc');
    expect(events[2].sort).toBeNull();
    expect(events[2].sortEntries).toEqual([]);
  });

  it('emits complete multisort add, direction and removal snapshots plus one server event each', async () => {
    const fixture = createTable({ server: true, multi: true });
    fixture.componentRef.setInput('removableSort', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const sorts: NeuTableSortState[] = [];
    const server: NeuTableServerState[] = [];
    fixture.componentInstance.sortChange.subscribe((event) => sorts.push(event));
    fixture.componentInstance.serverStateChange.subscribe((event) => server.push(event));

    fixture.componentInstance.sortBy('name', { shiftKey: true } as MouseEvent);
    fixture.componentInstance.sortBy('score', { shiftKey: true } as MouseEvent);
    fixture.componentInstance.sortBy('name', { shiftKey: true } as MouseEvent);
    fixture.componentInstance.sortBy('name', { shiftKey: true } as MouseEvent);

    expect(sorts).toEqual([
      [{ key: 'name', dir: 'asc' }],
      [
        { key: 'name', dir: 'asc' },
        { key: 'score', dir: 'asc' },
      ],
      [
        { key: 'name', dir: 'desc' },
        { key: 'score', dir: 'asc' },
      ],
      [{ key: 'score', dir: 'asc' }],
    ]);
    expect(server).toHaveLength(4);
    expect(server[3].sortEntries).toEqual([{ key: 'score', dir: 'asc' }]);
    expect(server[3].sort).toBeNull();
    expect(server[3].sortKey).toBe('');
    expect(server[3].sortDir).toBe('asc');
  });

  it('writes and removes URL multisort in one atomic page-reset write', async () => {
    const router = TestBed.inject(Router);
    const fixture = createTable({ url: true, multi: true });
    fixture.componentRef.setInput('removableSort', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const navigate = vi.spyOn(router, 'navigate');

    fixture.componentInstance.sortBy('name', { shiftKey: true } as MouseEvent);
    await fixture.whenStable();
    expect(router.parseUrl(router.url).queryParams['msort']).toBe('name:asc');

    fixture.componentInstance.goToPage(2);
    navigate.mockClear();
    fixture.componentInstance.sortBy('name', { shiftKey: true } as MouseEvent);
    fixture.componentInstance.sortBy('name', { shiftKey: true } as MouseEvent);
    await fixture.whenStable();

    expect(fixture.componentInstance.currentPage()).toBe(1);
    expect(router.parseUrl(router.url).queryParams['msort']).toBeUndefined();
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  it('uses typed row comparators and sort accessors independently of display values', async () => {
    const comparator = vi.fn((a: Row, b: Row) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );
    const fixture = createTable();
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('columns', [
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        cell: () => 'same',
        sortComparator: comparator,
      },
      {
        key: 'primary',
        header: 'Computed',
        sortable: true,
        sortAccessor: (row: Row) => row.primary + row.secondary,
      },
    ] satisfies NeuTableColumn<Row>[]);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.sortBy('name');
    expect(fixture.componentInstance.sortedData().map((row) => row.id)).toEqual([2, 1, 3]);
    expect(comparator).toHaveBeenCalled();
    fixture.componentInstance.sortBy('primary');
    expect(fixture.componentInstance.sortedData().map((row) => row.id)).toEqual([3, 2, 1]);
  });

  it('keeps controlled sort authoritative until echo and does not duplicate sortChange', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('sort', [{ key: 'name', dir: 'asc' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    const events: NeuTableSortState[] = [];
    fixture.componentInstance.sortChange.subscribe((event) => events.push(event));

    fixture.componentInstance.sortBy('name');
    expect(fixture.componentInstance.currentSort()).toEqual([{ key: 'name', dir: 'asc' }]);
    expect(events).toEqual([[{ key: 'name', dir: 'desc' }]]);

    fixture.componentRef.setInput('sort', events[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.currentSort()).toEqual([{ key: 'name', dir: 'desc' }]);
    expect(events).toHaveLength(1);
  });

  it('limits global filtering to configured direct fields and preserves the all-column default', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('globalFilterFields', ['name', 'email']);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance['onSearch']({ target: { value: 'Admin' } } as unknown as Event);
    expect(fixture.componentInstance.filteredData()).toEqual([]);
    fixture.componentInstance['onSearch']({
      target: { value: 'alpha@example.com' },
    } as unknown as Event);
    expect(fixture.componentInstance.filteredData().map((row) => row.id)).toEqual([2]);

    fixture.componentRef.setInput('globalFilterFields', undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance['onSearch']({ target: { value: 'Admin' } } as unknown as Event);
    expect(fixture.componentInstance.filteredData().map((row) => row.id)).toEqual([1, 3]);
  });

  it('supports computed global accessors and ANDs global search with column filters', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('globalFilterFields', [
      { accessor: (row: Row) => `${row.name}:${row.score}` },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance['onSearch']({ target: { value: 'beta:10' } } as unknown as Event);
    expect(fixture.componentInstance.filteredData().map((row) => row.id)).toEqual([1]);
    fixture.componentInstance.setColumnFilter('name', 'Alpha');
    expect(fixture.componentInstance.filteredData()).toEqual([]);
  });

  it('projects only serializable global fields and marks accessor-only metadata', async () => {
    const fixture = createTable({ server: true });
    fixture.componentRef.setInput('globalFilterFields', [
      'name',
      { accessor: (row: Row) => row.role, serverField: 'roleLabel' },
      { accessor: (row: Row) => row.score * 2 },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const events: NeuTableServerState[] = [];
    fixture.componentInstance.serverStateChange.subscribe((event) => events.push(event));

    fixture.componentInstance['onSearch']({ target: { value: 'Admin' } } as unknown as Event);

    expect(events).toHaveLength(1);
    expect(events[0].globalFilterFields).toEqual(['name', 'roleLabel']);
    expect(events[0].localOnlyGlobalFilterFields).toBe(true);
  });

  it('does not mutate selection or expansion or emit their events while sorting/filtering', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('selectable', 'multiple');
    fixture.componentRef.setInput('expandMode', true ? 'multiple' : 'none');
    fixture.detectChanges();
    await fixture.whenStable();
    const selections = vi.fn();
    fixture.componentInstance.selectionChange.subscribe(selections);
    fixture.componentInstance['toggleRow'](ROWS[0]);
    fixture.componentInstance.expandRow(ROWS[1]);
    selections.mockClear();

    fixture.componentInstance.sortBy('name');
    fixture.componentInstance['onSearch']({ target: { value: 'Alpha' } } as unknown as Event);

    const state = (fixture.componentInstance as any)._state.snapshot();
    expect(state.selectionKeys).toEqual(new Set([1]));
    expect(state.expansionKeys).toEqual(new Set([2]));
    expect(selections).not.toHaveBeenCalled();
  });

  it('keeps controlled single sort authoritative, resets page and emits the proposed server state', async () => {
    const fixture = createTable({ server: true });
    fixture.componentRef.setInput('totalItems', 3);
    fixture.componentRef.setInput('sort', [{ key: 'name', dir: 'asc' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.goToPage(2);
    const sorts: NeuTableSortState[] = [];
    const server: NeuTableServerState[] = [];
    fixture.componentInstance.sortChange.subscribe((event) => sorts.push(event));
    fixture.componentInstance.serverStateChange.subscribe((event) => server.push(event));

    fixture.componentInstance.sortBy('name');

    expect(fixture.componentInstance.currentSort()).toEqual([{ key: 'name', dir: 'asc' }]);
    expect(fixture.componentInstance.currentPage()).toBe(1);
    expect(sorts).toEqual([[{ key: 'name', dir: 'desc' }]]);
    expect(server).toHaveLength(1);
    expect(server[0]).toMatchObject({
      page: 1,
      sortKey: 'name',
      sortDir: 'desc',
      sort: { key: 'name', dir: 'desc' },
      sortEntries: [],
    });

    fixture.componentRef.setInput('sort', sorts[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.currentSort()).toEqual(sorts[0]);
    expect(sorts).toHaveLength(1);
    expect(server).toHaveLength(1);
  });

  it('keeps controlled multisort authoritative until echo and emits one complete proposal', async () => {
    const fixture = createTable({ server: true, multi: true });
    fixture.componentRef.setInput('sort', [
      { key: 'name', dir: 'asc' },
      { key: 'score', dir: 'desc' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const sorts: NeuTableSortState[] = [];
    const server: NeuTableServerState[] = [];
    fixture.componentInstance.sortChange.subscribe((event) => sorts.push(event));
    fixture.componentInstance.serverStateChange.subscribe((event) => server.push(event));

    fixture.componentInstance.sortBy('name', { shiftKey: true } as MouseEvent);

    expect(fixture.componentInstance.currentSort()).toEqual([
      { key: 'name', dir: 'asc' },
      { key: 'score', dir: 'desc' },
    ]);
    expect(sorts).toEqual([
      [
        { key: 'name', dir: 'desc' },
        { key: 'score', dir: 'desc' },
      ],
    ]);
    expect(server).toHaveLength(1);
    expect(server[0]).toMatchObject({
      page: 1,
      sortKey: '',
      sortDir: 'asc',
      sort: null,
      sortEntries: sorts[0],
    });

    fixture.componentRef.setInput('sort', sorts[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.currentSort()).toEqual(sorts[0]);
    expect(sorts).toHaveLength(1);
    expect(server).toHaveLength(1);
  });

  it('suppresses automatic sort URL writes when the sort input is controlled', async () => {
    const fixture = createTable({ url: true });
    fixture.componentRef.setInput('sort', [{ key: 'name', dir: 'asc' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.goToPage(2);
    const adapter = (fixture.componentInstance as any)._urlAdapter;
    const writeSort = vi.spyOn(adapter, 'writeSort');
    const events: NeuTableSortState[] = [];
    fixture.componentInstance.sortChange.subscribe((event) => events.push(event));

    fixture.componentInstance.sortBy('name');

    expect(events).toEqual([[{ key: 'name', dir: 'desc' }]]);
    expect(fixture.componentInstance.currentSort()).toEqual([{ key: 'name', dir: 'asc' }]);
    expect(fixture.componentInstance.currentPage()).toBe(1);
    expect(writeSort).not.toHaveBeenCalled();

    fixture.componentRef.setInput('multiSort', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const writeSortEntries = vi.spyOn(adapter, 'writeSortEntries');
    fixture.componentInstance.sortBy('name', { shiftKey: true } as MouseEvent);
    expect(writeSortEntries).not.toHaveBeenCalled();
  });

  it('normalizes uncontrolled sort slices across dynamic single/multiple mode changes', async () => {
    const fixture = createTable();
    fixture.componentInstance.sortBy('name');
    expect(fixture.componentInstance.currentSort()).toEqual([{ key: 'name', dir: 'asc' }]);

    fixture.componentRef.setInput('multiSort', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.currentSort()).toEqual([{ key: 'name', dir: 'asc' }]);
    fixture.componentInstance.sortBy('score', { shiftKey: true } as MouseEvent);
    expect(fixture.componentInstance.currentSort()).toEqual([
      { key: 'name', dir: 'asc' },
      { key: 'score', dir: 'asc' },
    ]);

    fixture.componentRef.setInput('multiSort', false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.currentSort()).toEqual([{ key: 'name', dir: 'asc' }]);
    fixture.componentRef.setInput('multiSort', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.currentSort()).toEqual([{ key: 'name', dir: 'asc' }]);
  });

  it('reinterprets the authoritative controlled input deterministically when sort mode changes', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('sort', [
      { key: 'name', dir: 'asc' },
      { key: 'score', dir: 'desc' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.currentSort()).toEqual([{ key: 'name', dir: 'asc' }]);

    fixture.componentRef.setInput('multiSort', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.currentSort()).toEqual([
      { key: 'name', dir: 'asc' },
      { key: 'score', dir: 'desc' },
    ]);

    fixture.componentRef.setInput('multiSort', false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.currentSort()).toEqual([{ key: 'name', dir: 'asc' }]);
    expect((fixture.componentInstance as any)._state.sortEntries()).toEqual([]);
  });

  it('gives the active sort mode deterministic precedence when both URL forms exist', async () => {
    const router = TestBed.inject(Router);
    await router.navigate([], {
      queryParams: { sort: 'name', sortDir: 'desc', msort: 'score:asc' },
    });
    const single = createTable({ url: true });
    await single.whenStable();
    expect(single.componentInstance.currentSort()).toEqual([{ key: 'name', dir: 'desc' }]);
    single.destroy();

    await router.navigate([], {
      queryParams: { sort: 'name', sortDir: 'desc', msort: 'score:asc' },
    });
    const multiple = createTable({ url: true, multi: true });
    await multiple.whenStable();
    expect(multiple.componentInstance.currentSort()).toEqual([{ key: 'score', dir: 'asc' }]);
  });

  it('defines imperative sorting for non-sortable and missing runtime keys without affecting UI guards', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('columns', [
      { key: 'name', header: 'Name', sortable: false },
    ] satisfies NeuTableColumn<Row>[]);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.sortBy('name');
    expect(fixture.componentInstance.sortedData().map((row) => row.id)).toEqual([2, 1, 3]);
    expect(() => fixture.componentInstance.sortBy('runtimeMissing')).not.toThrow();
    expect(fixture.componentInstance.currentSort()).toEqual([
      { key: 'runtimeMissing', dir: 'asc' },
    ]);
  });

  it('treats an empty global field list as no searchable fields and deduplicates direct keys', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('globalFilterFields', []);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance['onSearch']({ target: { value: 'Alpha' } } as unknown as Event);
    expect(fixture.componentInstance.filteredData()).toEqual([]);

    const display = vi.fn((row: Row) => `Display ${row.name}`);
    fixture.componentRef.setInput('columns', [
      { key: 'name', header: 'Name', cell: display },
    ] satisfies NeuTableColumn<Row>[]);
    fixture.componentRef.setInput('globalFilterFields', ['name', 'name']);
    fixture.detectChanges();
    await fixture.whenStable();
    display.mockClear();
    fixture.componentInstance['onSearch']({ target: { value: 'no-match' } } as unknown as Event);
    expect(fixture.componentInstance.filteredData()).toEqual([]);
    expect(display).toHaveBeenCalledTimes(ROWS.length);
  });

  it('preserves raw/display matching for configured keys and safely handles unknown keys', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('columns', [
      {
        key: 'role',
        header: 'Role',
        type: 'badge',
        badgeMap: { Admin: { label: 'Administrator', variant: 'success' } },
      },
    ] satisfies NeuTableColumn<Row>[]);
    fixture.componentRef.setInput('globalFilterFields', ['role']);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance['onSearch']({ target: { value: 'Administrator' } } as unknown as Event);
    expect(fixture.componentInstance.filteredData().map((row) => row.id)).toEqual([1, 3]);
    fixture.componentInstance['onSearch']({ target: { value: 'Viewer' } } as unknown as Event);
    expect(fixture.componentInstance.filteredData().map((row) => row.id)).toEqual([2]);

    fixture.componentRef.setInput('globalFilterFields', ['runtimeMissing' as keyof Row]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(() => fixture.componentInstance.filteredData()).not.toThrow();
    expect(fixture.componentInstance.filteredData()).toEqual([]);
  });

  it('searches only exact accessor results including 0 and false', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('pagination', false);
    const emptyAccessor = vi.fn(() => '');
    fixture.componentRef.setInput('globalFilterFields', [
      { accessor: (row: Row) => row.id - 1 },
      { accessor: (row: Row) => row.role === 'Viewer' },
      { accessor: emptyAccessor },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance['onSearch']({ target: { value: '0' } } as unknown as Event);
    expect(fixture.componentInstance.filteredData().map((row) => row.id)).toEqual([1]);
    fixture.componentInstance['onSearch']({ target: { value: 'false' } } as unknown as Event);
    expect(fixture.componentInstance.filteredData().map((row) => row.id)).toEqual([1, 3]);
    fixture.componentInstance['onSearch']({ target: { value: 'Viewer' } } as unknown as Event);
    expect(fixture.componentInstance.filteredData()).toEqual([]);
    expect(emptyAccessor).toHaveBeenCalled();
  });

  it('snapshots global field configuration by Angular input identity without mutating it', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('pagination', false);
    const fields: Array<keyof Row> = ['name'];
    fixture.componentRef.setInput('globalFilterFields', fields);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.filteredData();
    fields.push('role');

    fixture.componentInstance['onSearch']({ target: { value: 'Admin' } } as unknown as Event);
    expect(fixture.componentInstance.filteredData()).toEqual([]);
    expect(fields).toEqual(['name', 'role']);
  });

  it('propagates consumer global-accessor exceptions', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('globalFilterFields', [
      {
        accessor: () => {
          throw new Error('consumer accessor failed');
        },
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance['onSearch']({ target: { value: 'query' } } as unknown as Event);

    expect(() => fixture.componentInstance.filteredData()).toThrow('consumer accessor failed');
  });

  it('emits the exact stable server global-filter metadata matrix', async () => {
    const fixture = createTable({ server: true });
    const events: NeuTableServerState[] = [];
    fixture.componentInstance.serverStateChange.subscribe((event) => events.push(event));
    const emit = async (fields: readonly unknown[] | undefined, search: string) => {
      fixture.componentRef.setInput('globalFilterFields', fields);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.componentInstance['onSearch']({ target: { value: search } } as unknown as Event);
      return events.at(-1)!;
    };

    expect(await emit(undefined, 'a')).not.toHaveProperty('globalFilterFields');
    expect(await emit([], 'b')).toMatchObject({ globalFilterFields: [] });
    expect(await emit(['name', 'name'], 'c')).toMatchObject({ globalFilterFields: ['name'] });
    expect(
      await emit(
        [
          { accessor: (row: Row) => row.role, serverField: 'roleLabel' },
          { accessor: (row: Row) => row.role, serverField: 'roleLabel' },
        ],
        'd',
      ),
    ).toMatchObject({ globalFilterFields: ['roleLabel'] });
    const mixed = await emit(
      [
        'name',
        { accessor: (row: Row) => row.role, serverField: 'roleLabel' },
        { accessor: (row: Row) => row.score },
      ],
      'e',
    );
    expect(mixed.globalFilterFields).toEqual(['name', 'roleLabel']);
    expect(mixed.localOnlyGlobalFilterFields).toBe(true);
    expect(mixed.search).toBe('e');
  });

  it('isolates controlled input snapshots and every public sort projection', async () => {
    const fixture = createTable();
    const controlled: Array<{ key: string; dir: 'asc' | 'desc' }> = [{ key: 'name', dir: 'asc' }];
    fixture.componentRef.setInput('sort', controlled);
    fixture.detectChanges();
    await fixture.whenStable();
    controlled[0].key = 'mutated';
    controlled.push({ key: 'score', dir: 'desc' });

    const current = fixture.componentInstance.currentSort();
    expect(current).toEqual([{ key: 'name', dir: 'asc' }]);
    expect(Object.isFrozen(current)).toBe(true);
    expect(Object.isFrozen(current[0])).toBe(true);

    fixture.componentRef.setInput('sort', undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    const events: NeuTableSortState[] = [];
    fixture.componentInstance.sortChange.subscribe((event) => events.push(event));
    fixture.componentInstance.sortBy('name');
    fixture.componentInstance.sortBy('name');
    expect(events).toHaveLength(2);
    expect(events[0]).not.toBe(events[1]);
    expect(events[0][0]).not.toBe(events[1][0]);
  });

  it('performs one search intent, event and URL write with an atomic page reset', async () => {
    const fixture = createTable({ url: true });
    await fixture.whenStable();
    fixture.componentInstance.goToPage(2);
    const adapter = (fixture.componentInstance as any)._urlAdapter;
    const writeSearch = vi.spyOn(adapter, 'writeSearch');
    const changes: string[] = [];
    fixture.componentInstance.searchChange.subscribe((value) => changes.push(value));

    fixture.componentInstance['onSearch']({ target: { value: 'Alpha' } } as unknown as Event);
    fixture.componentInstance['onSearch']({ target: { value: 'Alpha' } } as unknown as Event);

    expect(fixture.componentInstance.currentPage()).toBe(1);
    expect(changes).toEqual(['Alpha']);
    expect(writeSearch).toHaveBeenCalledTimes(1);
  });
});
