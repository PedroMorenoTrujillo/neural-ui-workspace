import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuTableComponent } from './public/neu-table.component-contract';
import type {
  NeuTableColumn,
  NeuTableDataMode,
  NeuTableDataRequest,
  NeuTableFilterOptions,
  NeuTableLayoutState,
  NeuTableMetadata,
  NeuTableQuery,
  NeuTableSelection,
} from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly score: number;
  readonly pinned?: 'start' | 'end';
}
type Field = 'id' | 'name' | 'score';

const rows: readonly Row[] = [
  { id: 99, name: 'Pinned', score: 0, pinned: 'start' },
  { id: 1, name: 'Charlie', score: 30 },
  { id: 2, name: 'Ada', score: 10 },
  { id: 3, name: 'Bravo', score: 20 },
  { id: 4, name: 'Delta', score: 40 },
  { id: 5, name: 'Echo', score: 50 },
];

@Component({
  standalone: true,
  imports: [NeuTableComponent],
  template: `
    <neu-table
      [dataMode]="dataMode()"
      [data]="rows"
      [metadata]="metadata()"
      [columns]="columns"
      [query]="query()"
      [rowKey]="rowKey"
      [rowOptions]="rowOptions"
      [filterOptions]="filterOptions"
      [paginationOptions]="paginationOptions"
      [sortOptions]="sortOptions"
      [selection]="selection()"
      [layout]="layout()"
      (queryChange)="onQuery($event)"
      (selectionChange)="selectionEvents += 1"
      (layoutChange)="layoutEvents += 1"
      (dataRequest)="onRequest($event)"
    />
  `,
})
class QueryUiHostComponent {
  readonly rows = rows;
  readonly dataMode = signal<NeuTableDataMode>('client');
  readonly query = signal<NeuTableQuery<Field>>({
    page: 0,
    pageSize: 2,
    search: '',
    sort: [],
    filters: null,
  });
  readonly selection = signal<NeuTableSelection<number, Field>>({ kind: 'keys', keys: [2, 500] });
  readonly layout = signal<NeuTableLayoutState>({
    order: [],
    hidden: [],
    widths: {},
    pinnedStart: ['name'],
    pinnedEnd: [],
  });
  readonly metadata = signal<NeuTableMetadata>({
    totalItems: 40,
    loading: false,
    error: null,
    queryRevision: 0,
    appliedRequestId: null,
  });
  readonly columns: readonly NeuTableColumn<Row, Field>[] = [
    { id: 'id', header: 'ID', field: 'id', sort: { field: 'id' } },
    {
      id: 'name',
      header: 'Name',
      field: 'name',
      sort: { field: 'name' },
      filter: { field: 'name', rules: ['contains', 'equals'], defaultRule: 'contains' },
    },
    {
      id: 'score',
      header: 'Score',
      field: 'score',
      sort: { field: 'score' },
      filter: { field: 'score', rules: ['equals', 'greaterThan'], defaultRule: 'equals' },
    },
  ];
  readonly filterOptions: NeuTableFilterOptions<Row, Field> = {
    surfaces: ['row', 'menu', 'builder'],
    globalFields: ['name'],
    predicates: {},
    debounceMs: 0,
    commit: 'explicit',
  };
  readonly paginationOptions = {
    enabled: true,
    pageSizeOptions: [2, 4, 10],
    position: 'bottom' as const,
    report: 'range' as const,
    showPageJump: true,
  };
  readonly sortOptions = {
    mode: 'multiple' as const,
    removable: true,
    defaultDirection: 'asc' as const,
    resetPageOnChange: true,
  };
  readonly rowKey = (row: Row) => row.id;
  readonly rowOptions = { reorderable: false, pin: (row: Row) => row.pinned ?? null };
  accept = false;
  queryEvents: NeuTableQuery<Field>[] = [];
  requestEvents = 0;
  selectionEvents = 0;
  layoutEvents = 0;

  onQuery(next: NeuTableQuery<Field>): void {
    this.queryEvents.push(next);
    if (this.accept) this.query.set(next);
  }

  onRequest(request: NeuTableDataRequest<Field>): void {
    this.requestEvents += 1;
    this.metadata.update((value) => ({
      ...value,
      queryRevision: request.queryRevision,
      appliedRequestId: request.requestId,
    }));
  }
}

function renderedKeys(native: HTMLElement): string[] {
  return [...native.querySelectorAll<HTMLElement>('tbody tr[data-row-key]')].map(
    (row) => row.dataset['rowKey']!,
  );
}

describe('NeuTable 2 controlled query UI integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueryUiHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('keeps rejected sort applied and accepts one multi-sort proposal without echoes', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const native = fixture.nativeElement as HTMLElement;
    const nameSort = native.querySelector<HTMLButtonElement>('[aria-label^="Sort Name"]')!;
    const before = renderedKeys(native);

    nameSort.click();
    await fixture.whenStable();
    expect(host.queryEvents).toHaveLength(1);
    expect(host.query()).toMatchObject({ sort: [] });
    expect(nameSort.closest('th')?.getAttribute('aria-sort')).toBeNull();
    expect(renderedKeys(native)).toEqual(before);

    host.accept = true;
    nameSort.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    await fixture.whenStable();
    expect(host.queryEvents).toHaveLength(2);
    expect(host.query().sort).toEqual([{ field: 'name', direction: 'asc' }]);
    expect(nameSort.closest('th')?.getAttribute('aria-sort')).toBe('ascending');
    expect(renderedKeys(native)).toEqual(['99', '2', '3']);
    expect(host.requestEvents).toBe(0);
  });

  it('cycles accepted sort directions and removes a sorted field on the third activation', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    const host = fixture.componentInstance;
    host.accept = true;
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const sort = native.querySelector<HTMLButtonElement>('th[data-column-id="name"] button')!;

    sort.click();
    await fixture.whenStable();
    expect(host.query().sort).toEqual([{ field: 'name', direction: 'asc' }]);
    expect(sort.closest('th')?.getAttribute('aria-sort')).toBe('ascending');

    sort.click();
    await fixture.whenStable();
    expect(host.query().sort).toEqual([{ field: 'name', direction: 'desc' }]);
    expect(sort.closest('th')?.getAttribute('aria-sort')).toBe('descending');

    sort.click();
    await fixture.whenStable();
    expect(host.query().sort).toEqual([]);
    expect(sort.closest('th')?.getAttribute('aria-sort')).toBeNull();
    expect(host.queryEvents).toHaveLength(3);
  });

  it('uses the rendered descending default and keeps a required sort while reporting page summary', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    const host = fixture.componentInstance;
    host.accept = true;
    Object.assign(host.sortOptions, { defaultDirection: 'desc', removable: false });
    Object.assign(host.paginationOptions, { report: 'summary' });
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const sort = native.querySelector<HTMLButtonElement>('th[data-column-id="name"] button')!;

    sort.click();
    await fixture.whenStable();
    expect(host.query().sort).toEqual([{ field: 'name', direction: 'desc' }]);
    expect(sort.closest('th')?.getAttribute('aria-sort')).toBe('descending');
    sort.click();
    await fixture.whenStable();
    expect(host.query().sort).toEqual([{ field: 'name', direction: 'asc' }]);
    sort.click();
    await fixture.whenStable();
    expect(host.query().sort).toEqual([{ field: 'name', direction: 'desc' }]);
    expect(host.queryEvents).toHaveLength(3);
    expect(native.textContent).toContain('Page 1 of');
  });

  it('cancels an uncommitted search and clears an applied search through the toolbar', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    const host = fixture.componentInstance;
    host.query.set({ ...host.query(), search: 'Ada' });
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const search = native.querySelector<HTMLInputElement>('input[aria-label="Search table"]')!;

    search.focus();
    search.value = 'Grace';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(search.value).toBe('Ada');
    expect(host.queryEvents).toHaveLength(0);

    host.accept = true;
    native.querySelector<HTMLButtonElement>('button[aria-label="Clear table search"]')!.click();
    await fixture.whenStable();
    expect(host.query().search).toBe('');
    expect(host.queryEvents).toHaveLength(1);
    expect(search.value).toBe('');
  });

  it('keeps search/menu drafts ephemeral and preserves nested filter branches', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const native = fixture.nativeElement as HTMLElement;
    const search = native.querySelector<HTMLInputElement>('input[aria-label="Search table"]')!;
    search.focus();
    search.value = 'Ada';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    search.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(host.queryEvents.at(-1)?.search).toBe('Ada');
    expect(host.query().search).toBe('');
    expect(search.value).toBe('');

    host.query.set({
      ...host.query(),
      filters: {
        kind: 'group',
        operator: 'or',
        children: [
          { kind: 'condition', field: 'id', rule: 'equals', value: '1' },
          { kind: 'condition', field: 'score', rule: 'greaterThan', value: '15' },
        ],
      },
    });
    await fixture.whenStable();
    host.accept = true;
    native.querySelector<HTMLButtonElement>('button[aria-label="Filter Name"]')!.click();
    await fixture.whenStable();
    const editor = native.querySelector<HTMLElement>('[data-filter-editor="name"]')!;
    const value = editor.querySelector<HTMLInputElement>('input')!;
    value.value = 'a';
    value.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(JSON.stringify(host.query().filters)).toContain('"operator":"or"');
    expect(JSON.stringify(host.query().filters)).toContain('"field":"id"');
    expect(JSON.stringify(host.query().filters)).toContain('"field":"name"');

    native.querySelector<HTMLButtonElement>('button[aria-label="Filter Name"]')!.click();
    await fixture.whenStable();
    native
      .querySelector<HTMLButtonElement>('[data-filter-editor="name"] button:nth-of-type(2)')!
      .click();
    await fixture.whenStable();
    expect(JSON.stringify(host.query().filters)).not.toContain('"field":"name"');
  });

  it('proposes controlled page and anchor-preserving page size without selection/layout writes', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    const host = fixture.componentInstance;
    host.query.set({ ...host.query(), page: 2, pageSize: 2 });
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    native.querySelector<HTMLButtonElement>('button[aria-label="Previous page"]')!.click();
    await fixture.whenStable();
    expect(host.queryEvents.at(-1)).toMatchObject({ page: 1, pageSize: 2 });
    expect(host.query()).toMatchObject({ page: 2, pageSize: 2 });

    host.accept = true;
    const size = native.querySelector<HTMLSelectElement>('label select');
    const pageSize = [...native.querySelectorAll<HTMLSelectElement>('select')].find((candidate) =>
      candidate.closest('label')?.textContent?.includes('Rows per page'),
    )!;
    expect(size).toBeDefined();
    pageSize.value = '4';
    pageSize.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(host.query()).toMatchObject({ page: 1, pageSize: 4 });
    expect(host.queryEvents).toHaveLength(2);
    expect(host.selection()).toEqual({ kind: 'keys', keys: [2, 500] });
    expect(host.layout().pinnedStart).toEqual(['name']);
    expect(host.selectionEvents).toBe(0);
    expect(host.layoutEvents).toBe(0);
    expect(host.requestEvents).toBe(0);
  });

  it('accepts a page jump while preserving selection and pinned layout', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    const host = fixture.componentInstance;
    host.accept = true;
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const jump = [...native.querySelectorAll<HTMLInputElement>('input[type="number"]')].find((input) =>
      input.closest('label')?.textContent?.includes('Go to page'),
    )!;

    jump.value = '3';
    jump.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(host.query()).toMatchObject({ page: 2, pageSize: 2 });
    expect(jump.value).toBe('3');
    expect(host.selection()).toEqual({ kind: 'keys', keys: [2, 500] });
    expect(host.layout().pinnedStart).toEqual(['name']);
    expect(host.selectionEvents).toBe(0);
    expect(host.layoutEvents).toBe(0);
  });

  it.each([
    { start: 2, action: 'First page', expected: 0 },
    { start: 1, action: 'Next page', expected: 2 },
    { start: 0, action: 'Last page', expected: 2 },
  ])('navigates from page $start with the rendered $action action', async ({ start, action, expected }) => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    const host = fixture.componentInstance;
    host.accept = true;
    host.query.set({ ...host.query(), page: start });
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const button = native.querySelector<HTMLButtonElement>(`button[aria-label="${action}"]`)!;
    expect(button.disabled).toBe(false);

    button.click();
    await fixture.whenStable();
    expect(host.query().page).toBe(expected);
    expect(host.queryEvents).toHaveLength(1);
    expect(native.querySelector('[aria-current="page"]')?.textContent).toContain(`Page ${expected + 1}`);
    expect(host.selectionEvents).toBe(0);
    expect(host.layoutEvents).toBe(0);
  });

  it('loads the private advanced builder only on demand and proposes one AST snapshot', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const native = fixture.nativeElement as HTMLElement;
    const trigger = [...native.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Advanced filters'),
    )!;
    expect(native.querySelector('neu-table-advanced-filter-builder')).toBeNull();
    trigger.click();
    await fixture.whenStable();
    const builder = native.querySelector<HTMLElement>('neu-table-advanced-filter-builder')!;
    expect(builder).not.toBeNull();
    const value = builder.querySelector<HTMLInputElement>('input')!;
    value.value = 'Ada';
    value.dispatchEvent(new Event('input', { bubbles: true }));
    builder.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    expect(host.queryEvents).toHaveLength(1);
    expect(host.queryEvents[0]?.filters).toMatchObject({
      kind: 'condition',
      field: 'name',
      rule: 'contains',
      value: 'Ada',
    });
    expect(host.query().filters).toBeNull();
    expect(native.ownerDocument.activeElement).toBe(trigger);
  });

  it('opens and closes the filter menu 100 times without retaining state or emitting proposals', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;

    for (let index = 0; index < 100; index += 1) {
      native.querySelector<HTMLButtonElement>('[aria-label="Filter Name"]')!.click();
      fixture.detectChanges();
      expect(native.querySelector('[data-filter-editor="name"]')).not.toBeNull();
      native
        .querySelector<HTMLButtonElement>('[data-filter-editor="name"] button:last-of-type')!
        .click();
      fixture.detectChanges();
    }

    expect(native.querySelector('[data-filter-editor="name"]')).toBeNull();
    expect(host.queryEvents).toHaveLength(0);
  });

  it('reflects parent writes for every query slice with zero echo and bypasses remote processing', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    host.dataMode.set('remote');
    host.query.set({
      page: 4,
      pageSize: 2,
      search: 'server',
      sort: [{ field: 'score', direction: 'desc' }],
      filters: { kind: 'condition', field: 'name', rule: 'contains', value: 'z' },
    });
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    expect(host.queryEvents).toHaveLength(0);
    expect(host.requestEvents).toBe(1);
    expect(renderedKeys(native)).toEqual(['99', '1', '2', '3', '4', '5']);
    expect(native.querySelector('th[data-column-id="score"]')?.getAttribute('aria-sort')).toBe(
      'descending',
    );
    expect(native.querySelector<HTMLInputElement>('input[aria-label="Search table"]')?.value).toBe(
      'server',
    );

    const pageSize = [...native.querySelectorAll<HTMLSelectElement>('select')].find((candidate) =>
      candidate.closest('label')?.textContent?.includes('Rows per page'),
    )!;
    pageSize.value = '4';
    pageSize.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(host.queryEvents.at(-1)).toMatchObject({ page: 2, pageSize: 4 });
    expect(host.requestEvents).toBe(1);
  });
});
