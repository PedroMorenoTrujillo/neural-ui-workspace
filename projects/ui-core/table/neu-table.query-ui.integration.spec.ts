import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NeuTableComponent } from './public/neu-table.component-contract';
import type {
  NeuTableColumn,
  NeuTableDataMode,
  NeuTableDataRequest,
  NeuTableExpansionOptions,
  NeuTableFilterOptions,
  NeuTableLayoutState,
  NeuTableMetadata,
  NeuTableQuery,
  NeuTableSelection,
  NeuTableSelectionOptions,
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
      [columnOptions]="{ reorderable: true, resizable: true, hideable: true, pinnable: true }"
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
      [selectionOptions]="selectionOptions"
      [expansionOptions]="expansionOptions"
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
  rowOptions = { reorderable: false, pin: (row: Row) => row.pinned ?? null };
  selectionOptions: NeuTableSelectionOptions<Row> = { mode: 'none' };
  expansionOptions: NeuTableExpansionOptions<Row> = { enabled: false, toggleOnRowClick: false };
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

  it('formats filter values and guards unsortable or unfiltered columns', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as {
      filterValueText(value: unknown): string;
      filterRules(column: NeuTableColumn<Row, Field>): readonly string[];
      appliedFilter(column: NeuTableColumn<Row, Field>): unknown;
      sortPriority(column: NeuTableColumn<Row, Field>): number | null;
      sortActionLabel(column: NeuTableColumn<Row, Field>): string;
      sortColumn(column: NeuTableColumn<Row, Field>, event: MouseEvent): void;
    };
    const plain: NeuTableColumn<Row, Field> = { id: 'plain', header: 'Plain', field: 'name' };
    expect(renderer.filterRules(plain)).toEqual(['equals']);
    expect(renderer.appliedFilter(plain)).toBeNull();
    expect(renderer.sortPriority(plain)).toBeNull();
    expect(renderer.sortActionLabel(plain)).toBe('');
    renderer.sortColumn(plain, new MouseEvent('click'));
    expect(fixture.componentInstance.queryEvents).toEqual([]);

    const values: readonly [unknown, string][] = [
      ['Ada', 'Ada'],
      [4, '4'],
      [4n, '4'],
      [false, 'false'],
      [new Date('2026-01-01T00:00:00Z'), '2026-01-01T00:00:00.000Z'],
      [new Date('invalid'), ''],
      [['Ada', 4, 4n, true, null, {}], 'Ada, 4, 4, true'],
      [null, ''],
      [{ name: 'Ada' }, ''],
    ];
    for (const [value, expected] of values) expect(renderer.filterValueText(value)).toBe(expected);
    expect(renderer.filterRules(fixture.componentInstance.columns[1]!)).toEqual([
      'contains',
      'equals',
    ]);
  });

  it('rejects unsupported row filter rules and applies an explicit valid rule', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.componentInstance.accept = true;
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as {
      filterRule(column: NeuTableColumn<Row, Field>): string;
      filterValue(column: NeuTableColumn<Row, Field>): string;
      setRowFilterRule(column: NeuTableColumn<Row, Field>, event: Event): void;
      setRowFilterValue(column: NeuTableColumn<Row, Field>, event: Event): void;
      commitRowFilter(column: NeuTableColumn<Row, Field>, event?: Event): void;
      clearFilter(column: NeuTableColumn<Row, Field>): void;
    };
    const column = fixture.componentInstance.columns[1]!;
    const select = document.createElement('select');
    select.innerHTML =
      '<option value="contains">contains</option><option value="equals">equals</option>';
    select.value = 'futureRule';
    renderer.setRowFilterRule(column, { currentTarget: select } as unknown as Event);
    expect(renderer.filterRule(column)).toBe('contains');
    select.value = 'equals';
    renderer.setRowFilterRule(column, { currentTarget: select } as unknown as Event);
    expect(renderer.filterRule(column)).toBe('equals');
    const input = document.createElement('input');
    input.value = 'Ada';
    renderer.setRowFilterValue(column, { currentTarget: input } as unknown as Event);
    expect(renderer.filterValue(column)).toBe('Ada');
    renderer.commitRowFilter(column);
    fixture.detectChanges();
    expect(fixture.componentInstance.query().filters).toEqual({
      kind: 'condition',
      field: 'name',
      rule: 'equals',
      value: 'Ada',
    });
    renderer.clearFilter(column);
    fixture.detectChanges();
    expect(fixture.componentInstance.query().filters).toBeNull();
    renderer.clearFilter({ id: 'plain', header: 'Plain', field: 'name' });
    expect(fixture.componentInstance.query().filters).toBeNull();
  });

  it('commits and clears a row filter through the rendered controls', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.componentInstance.accept = true;
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const rule = native.querySelector<HTMLSelectElement>('[aria-label="Filter rule for Name"]')!;
    rule.value = 'equals';
    rule.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    const value = native.querySelector<HTMLInputElement>('[aria-label="Filter value for Name"]')!;
    value.value = 'Ada';
    value.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    (rule.closest('.neu-table2__row-filter')!.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.query().filters).toEqual({
      kind: 'condition',
      field: 'name',
      rule: 'equals',
      value: 'Ada',
    });
    native.querySelector<HTMLButtonElement>('[aria-label="Clear filter for Name"]')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.query().filters).toBeNull();
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
    const jump = [...native.querySelectorAll<HTMLInputElement>('input[type="number"]')].find(
      (input) => input.closest('label')?.textContent?.includes('Go to page'),
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
  ])(
    'navigates from page $start with the rendered $action action',
    async ({ start, action, expected }) => {
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
      expect(native.querySelector('[aria-current="page"]')?.textContent).toContain(
        `Page ${expected + 1}`,
      );
      expect(host.selectionEvents).toBe(0);
      expect(host.layoutEvents).toBe(0);
    },
  );

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

  it('uses rendered keyboard, filter and drag controls without mutating applied state', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    const host = fixture.componentInstance;
    host.rowOptions = { reorderable: true, pin: (row: Row) => row.pinned ?? null };
    host.selectionOptions = {
      mode: 'multiple',
      indicator: 'checkbox',
      selectOnRowClick: false,
      modifier: 'toggle',
      range: true,
      toggleAllScope: 'page',
    };
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const headerSelect = native.querySelector<HTMLInputElement>(
      'thead input[aria-label="Select all rows"]',
    )!;
    headerSelect.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(host.selectionEvents).toBe(1);

    const header = native.querySelector<HTMLElement>('thead th[data-column-id="name"]')!;
    const headerOver = new Event('dragover', { bubbles: true, cancelable: true });
    header.dispatchEvent(headerOver);
    expect(headerOver.defaultPrevented).toBe(true);
    header.dispatchEvent(new Event('dragend', { bubbles: true }));
    header.querySelector<HTMLButtonElement>('[aria-label="Move Name right"]')!.click();
    const resize = header.querySelector<HTMLButtonElement>('.neu-table2__resize-handle')!;
    resize.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    resize.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(host.layoutEvents).toBeGreaterThan(0);

    const filterButton = header.querySelector<HTMLButtonElement>(
      'button[aria-label="Filter Name"]',
    )!;
    filterButton.click();
    fixture.detectChanges();
    const filterForm = native.querySelector<HTMLFormElement>('[data-filter-editor="name"]')!;
    const rule = filterForm.querySelector('select')!;
    rule.value = 'equals';
    rule.dispatchEvent(new Event('change', { bubbles: true }));
    filterForm.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(native.querySelector('[data-filter-editor="name"]')).toBeNull();

    const filterInput = native.querySelector<HTMLInputElement>(
      'input[aria-label="Filter value for Name"]',
    )!;
    filterInput.value = 'Ada';
    filterInput.dispatchEvent(new Event('input', { bubbles: true }));
    filterInput.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(host.queryEvents.at(-1)?.filters).toMatchObject({ field: 'name', value: 'Ada' });

    const row = native.querySelector<HTMLElement>('tbody tr[data-row-key]')!;
    const rowOver = new Event('dragover', { bubbles: true, cancelable: true });
    row.dispatchEvent(rowOver);
    expect(rowOver.defaultPrevented).toBe(true);
    row.dispatchEvent(new Event('dragend', { bubbles: true }));
    expect(host.query().filters).toBeNull();
    expect(host.selection()).toEqual({ kind: 'keys', keys: [2, 500] });
  });

  it('restores controlled search text across commit, cancel and clear controls', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.type = 'search';
    form.append(input);
    renderer.beginSearch();
    renderer.searchDraft.set('Ada');
    input.value = 'draft';
    renderer.commitSearch({ currentTarget: form, preventDefault: vi.fn() } as unknown as Event);
    expect(input.value).toBe('');
    expect(fixture.componentInstance.queryEvents.at(-1)?.search).toBe('Ada');
    renderer.beginSearch();
    input.value = 'temporary';
    renderer.cancelSearch({ currentTarget: input, preventDefault: vi.fn() } as unknown as Event);
    expect(input.value).toBe('');
    renderer.beginSearch();
    renderer.searchDraft.set('discard');
    input.value = 'discard';
    renderer.clearSearch({ currentTarget: input } as unknown as Event);
    expect(input.value).toBe('');
    expect(renderer.searchEditing()).toBe(false);
  });

  it('refuses invalid filter menu actions and commits a valid row filter', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    const name = fixture.componentInstance.columns[1]!;
    const plain: NeuTableColumn<Row, Field> = { id: 'plain', header: 'Plain', field: 'name' };
    renderer.commitRowFilter(plain);
    renderer.openFilterMenu(plain, new MouseEvent('click'));
    renderer.applyFilterMenu();
    expect(fixture.componentInstance.queryEvents).toHaveLength(0);
    const select = document.createElement('select');
    select.value = 'unsupported';
    renderer.setRowFilterRule(name, { currentTarget: select } as unknown as Event);
    expect(renderer.rowFilterDrafts().has(name.id)).toBe(false);
    renderer.filterDraftRule.set('unsupported');
    renderer.openFilterColumnId.set(name.id);
    renderer.applyFilterMenu();
    expect(fixture.componentInstance.queryEvents).toHaveLength(0);
    const input = document.createElement('input');
    input.value = 'Ada';
    renderer.setRowFilterValue(name, { currentTarget: input } as unknown as Event);
    renderer.commitRowFilter(name);
    expect(fixture.componentInstance.queryEvents.at(-1)?.filters).toMatchObject({
      field: 'name',
      value: 'Ada',
    });
  });

  it('formats summary pagination and rejects a nonnumeric page jump', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    (fixture.componentInstance.paginationOptions as { report: 'range' | 'summary' }).report =
      'summary';
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    expect(renderer.paginationReport()).toMatch(/^Page 1 of /);
    const controls = fixture.debugElement.query(
      By.css('.neu-table2__pagination neu-table-query-controls'),
    ).componentInstance as any;
    const input = document.createElement('input');
    input.value = 'unavailable';
    controls.jump({ currentTarget: input } as unknown as Event);
    expect(fixture.componentInstance.queryEvents).toHaveLength(0);
    input.value = '2';
    controls.jump({ currentTarget: input } as unknown as Event);
    expect(fixture.componentInstance.queryEvents.at(-1)?.page).toBe(1);
  });

  it('labels empty group values and unavailable aggregates without throwing', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    expect(renderer.groupLabel({ value: null })).toBe('Group');
    expect(renderer.groupLabel({ value: 'North' })).toBe('Group North');
    expect(
      renderer.groupAggregateLabel({
        aggregates: [
          { field: 'score', value: null, error: null },
          { field: 'count', value: 3, error: null },
          { field: 'failed', value: null, error: 'missing' },
        ],
      }),
    ).toBe('score: , count: 3, failed: unavailable');
    expect(
      renderer.editorContext(renderer.rows()[0], fixture.componentInstance.columns[0]),
    ).toBeNull();
  });

  it('guards row drop and resize transitions with no active gesture', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    const row = renderer.rows()[0];
    const preventDefault = vi.fn();
    renderer.onRowDrop(row, { preventDefault } as unknown as DragEvent);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.selectionEvents).toBe(0);
    renderer.onResizeMove({ clientX: 10 } as PointerEvent);
    expect(renderer.resizePreview()).toBeNull();
    renderer.commitResize();
    expect(fixture.componentInstance.layoutEvents).toBe(0);
    renderer.resizeWithKeyboard(fixture.componentInstance.columns[0], 1, {
      currentTarget: document.createElement('div'),
      preventDefault,
    } as unknown as Event);
    expect(fixture.componentInstance.layoutEvents).toBe(0);
  });

  it('replaces a pending immediate filter timer before committing the latest draft', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    (fixture.componentInstance.filterOptions as any).commit = 'immediate';
    (fixture.componentInstance.filterOptions as any).debounceMs = 1000;
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    const name = fixture.componentInstance.columns[1]!;
    const input = document.createElement('input');
    input.value = 'Ada';
    renderer.setRowFilterValue(name, { currentTarget: input } as unknown as Event);
    const previous = renderer.filterTimers.get(name.id);
    input.value = 'Bravo';
    renderer.setRowFilterValue(name, { currentTarget: input } as unknown as Event);
    expect(renderer.filterTimers.get(name.id)).not.toBe(previous);
    renderer.commitRowFilter(name);
    expect(renderer.filterTimers.has(name.id)).toBe(false);
    expect(fixture.componentInstance.queryEvents.at(-1)?.filters).toMatchObject({
      field: 'name',
      value: 'Bravo',
    });
  });

  it('restores a select filter control and uses an explicit preferred rule', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    const column = fixture.componentInstance.columns[1]!;
    const select = document.createElement('select');
    select.add(new Option('Contains', 'contains'));
    renderer.rowFilterControls.set(column.id, select);
    renderer.commitRowFilter(column);
    expect(select.value).toBe(renderer.filterRule(column));
    const preferred: NeuTableColumn<Row, Field> = {
      id: 'preferred',
      header: 'Preferred',
      field: 'name',
      filter: { field: 'name', rules: ['equals'], defaultRule: 'equals' },
    };
    expect(renderer.filterRule(preferred)).toBe('equals');
  });

  it('shows page count without a total and derives layout pin offsets', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    (fixture.componentInstance.paginationOptions as { report: 'range' | 'summary' }).report =
      'summary';
    fixture.componentInstance.dataMode.set('remote');
    fixture.componentInstance.metadata.update((value) => ({ ...value, totalItems: null }));
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    expect(renderer.paginationReport()).toBe('Page 1');
    const name = fixture.componentInstance.columns[1]!;
    expect(renderer.columnPinOffset(name, 'start')).toBe('0px');
    expect(renderer.columnPinOffset(name, 'end')).toBe('0px');
    expect(renderer.selectionIndicator()).toBe('none');
    expect(renderer.editCommitOnBlur()).toBe(false);
    const last = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Last page"]',
    )!;
    last.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.componentInstance.queryEvents).toHaveLength(0);
  });

  it('cycles a column through start, end and unpinned proposals', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    const name = fixture.componentInstance.columns[1]!;
    renderer.cycleColumnPin(name);
    expect(fixture.componentInstance.layoutEvents).toBe(1);
    fixture.componentInstance.layout.update((value) => ({
      ...value,
      pinnedStart: [],
      pinnedEnd: ['name'],
    }));
    fixture.detectChanges();
    renderer.cycleColumnPin(name);
    expect(fixture.componentInstance.layoutEvents).toBe(2);
  });

  it('tracks a reorderable row drag and clears it on a same-row drop', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.componentInstance.rowOptions = {
      reorderable: true,
      pin: (row: Row) => row.pinned ?? null,
    };
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    const row = renderer.rows()[0];
    renderer.onRowDragStart(row);
    expect(renderer.draggedRow()).toBe(row);
    renderer.onRowDrop(row, { preventDefault: vi.fn() } as unknown as DragEvent);
    expect(renderer.draggedRow()).toBeNull();
  });

  it('renders both paginators and preserves an applied page size absent from the choices', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    const host = fixture.componentInstance;
    (host.paginationOptions as { position: 'top' | 'bottom' | 'both' }).position = 'both';
    host.query.update((value) => ({ ...value, pageSize: 7 }));
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    expect(native.querySelectorAll('.neu-table2__pagination')).toHaveLength(2);
    const current = native.querySelector(
      '.neu-table2__pagination select option[value="7"]',
    ) as HTMLOptionElement;
    expect(current.disabled).toBe(true);
    expect(current.textContent?.trim()).toBe('7');
  });

  it('omits global search and renders radio selection controls when configured', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    const host = fixture.componentInstance;
    (host.filterOptions as unknown as { globalFields: Field[] }).globalFields = [];
    host.selectionOptions = {
      mode: 'single',
      indicator: 'radio',
      selectOnRowClick: true,
      allowClear: true,
    };
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    expect(native.querySelector('.neu-table2__search')).toBeNull();
    expect(native.querySelector('input[type="radio"]')).not.toBeNull();
    expect(native.querySelector('thead input[type="checkbox"]')).toBeNull();
    native.querySelector<HTMLInputElement>('input[type="radio"]')!.click();
    expect(host.selectionEvents).toBe(1);
  });

  it('uses a configured width preview, pinned offset and first filter rule fallback', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    renderer.resizePreview.set({ columnId: 'name', width: '190px' });
    expect(renderer.columnWidth(host.columns[1])).toBe('190px');
    expect(renderer.columnPinOffset(host.columns[2], 'start')).toContain('190px');
    expect(
      renderer.filterRule({
        id: 'extra',
        header: 'Extra',
        filter: { field: 'name', rules: ['equals'] },
      }),
    ).toBe('equals');
  });

  it('restores applied search text through input cancellation and form commit', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.componentInstance.query.update((value) => ({ ...value, search: 'applied' }));
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    const form = (fixture.nativeElement as HTMLElement).querySelector(
      'form.neu-table2__search',
    ) as HTMLFormElement;
    const input = form.querySelector('input[type="search"]') as HTMLInputElement;
    renderer.beginSearch();
    input.value = 'draft';
    const cancel = new Event('keydown', { cancelable: true });
    Object.defineProperty(cancel, 'currentTarget', { value: input });
    renderer.cancelSearch(cancel);
    expect(input.value).toBe('applied');
    renderer.beginSearch();
    renderer.searchDraft.set('next');
    fixture.detectChanges();
    expect(input.value).toBe('next');
    const submit = new Event('submit', { cancelable: true });
    Object.defineProperty(submit, 'currentTarget', { value: form });
    renderer.commitSearch(submit);
    expect(input.value).toBe('applied');
    expect(fixture.componentInstance.queryEvents.at(-1)?.search).toBe('next');
  });

  it('hides value inputs for unary filters and respects a non-expandable row', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    const host = fixture.componentInstance;
    (host.columns[1] as any).filter = {
      field: 'name',
      rules: ['isNull'],
      defaultRule: 'isNull',
    };
    host.expansionOptions = {
      enabled: true,
      toggleOnRowClick: false,
      isExpandable: () => false,
    };
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    expect(
      native.querySelector('.neu-table2__filter-row .neu-table2__expansion-column'),
    ).not.toBeNull();
    expect(native.querySelector('input[aria-label="Filter value for Name"]')).toBeNull();
    expect(native.querySelector('tbody .neu-table2__expansion-column button')).toBeNull();

    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    renderer.openFilterMenu(host.columns[1], new MouseEvent('click'));
    fixture.detectChanges();
    await fixture.whenStable();
    const menu = native.querySelector('.neu-table2__filter-menu') as HTMLElement;
    expect(menu).not.toBeNull();
    expect(menu.querySelector('input')).toBeNull();
  });

  it('ignores an unavailable filter menu rule and an unavailable row expansion', async () => {
    const fixture = TestBed.createComponent(QueryUiHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as any;
    const rule = renderer.filterDraftRule();
    const select = document.createElement('select');
    select.add(new Option('Equals', 'equals'));
    const change = new Event('change');
    Object.defineProperty(change, 'currentTarget', { value: select });
    renderer.setMenuRule(change);
    expect(renderer.filterDraftRule()).toBe(rule);
    renderer.toggleExpansion(renderer.rows()[0], 'button', new Event('click'));
    expect(fixture.componentInstance.queryEvents).toHaveLength(0);
  });
});
