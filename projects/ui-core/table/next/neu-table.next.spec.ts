import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { projectNeuTableRows } from './internal/identity/neu-table-row-identity';
import { NeuTableComponent } from './public/neu-table.component-contract';
import {
  NeuTableCaptionDirective,
  NeuTableCellDirective,
  NeuTableEmptyDirective,
  NeuTableErrorDirective,
  NeuTableFooterDirective,
  NeuTableHeaderDirective,
  NeuTableLoadingDirective,
  NeuTableSummaryDirective,
  NeuTableToolbarDirective,
} from './public/neu-table-template-contracts';
import type {
  NeuTableAppearance,
  NeuTableColumn,
  NeuTableDataMode,
  NeuTableFilterOptions,
  NeuTableLayoutState,
  NeuTableMetadata,
  NeuTablePaginationOptions,
  NeuTableQuery,
  NeuTableSortOptions,
} from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly detail: { readonly label: string } | null;
  readonly disabled?: boolean;
  readonly pin?: 'start' | 'end';
}

type Field = 'id' | 'name' | 'detail';

const baseRows: readonly Row[] = [
  { id: 1, name: 'Ada', detail: { label: 'private' } },
  { id: 2, name: 'Grace', detail: null, disabled: true },
  { id: 3, name: 'Linus', detail: { label: 'private' } },
];

const baseColumns: readonly NeuTableColumn<Row, Field>[] = [
  { id: 'id', header: 'Identifier', field: 'id', width: '6rem' },
  { id: 'name', header: 'Name', field: 'name' },
  { id: 'detail', header: 'Detail', field: 'detail' },
];

const baseMetadata: NeuTableMetadata = {
  totalItems: 3,
  loading: false,
  error: null,
  queryRevision: 0,
  appliedRequestId: null,
};

const baseLayout: NeuTableLayoutState = {
  order: [],
  hidden: [],
  widths: {},
  pinnedStart: [],
  pinnedEnd: [],
};

@Component({
  standalone: true,
  imports: [
    NeuTableComponent,
    NeuTableCaptionDirective,
    NeuTableToolbarDirective,
    NeuTableHeaderDirective,
    NeuTableCellDirective,
    NeuTableFooterDirective,
    NeuTableSummaryDirective,
    NeuTableEmptyDirective,
    NeuTableLoadingDirective,
    NeuTableErrorDirective,
  ],
  template: `
    <neu-table
      [data]="rows()"
      [columns]="columns()"
      [metadata]="metadata()"
      [dataMode]="dataMode()"
      [query]="query()"
      [sortOptions]="sortOptions"
      [filterOptions]="filterOptions"
      [paginationOptions]="paginationOptions()"
      [layout]="layout()"
      [rowKey]="rowKey"
      [rowOptions]="rowOptions"
      [appearance]="appearance()"
    >
      <ng-template neuTableCaption>People</ng-template>
      <ng-template neuTableToolbar>Directory</ng-template>
      <ng-template neuTableHeader="name" let-column="column"
        >Custom {{ column.header }}</ng-template
      >
      <ng-template neuTableCell="name" let-row let-index="index"
        >{{ index }}:{{ row.name }}</ng-template
      >
      <ng-template neuTableFooter="name" let-column="column">End {{ column.header }}</ng-template>
      <ng-template neuTableSummary>Summary</ng-template>
      <ng-template neuTableEmpty>Custom empty</ng-template>
      <ng-template neuTableLoading let-loading="loading">Custom loading {{ loading }}</ng-template>
      <ng-template neuTableError let-error="error">Custom error {{ error }}</ng-template>
    </neu-table>
  `,
})
class NeuTableNextHostComponent {
  readonly rows = signal(baseRows);
  readonly columns = signal(baseColumns);
  readonly metadata = signal(baseMetadata);
  readonly dataMode = signal<NeuTableDataMode>('client');
  readonly query = signal<NeuTableQuery<Field>>({
    page: 0,
    pageSize: 25,
    search: '',
    sort: [],
    filters: null,
  });
  readonly paginationOptions = signal<NeuTablePaginationOptions>({
    enabled: false,
    pageSizeOptions: [1, 2, 25],
    position: 'bottom',
    report: 'none',
    showPageJump: false,
  });
  readonly layout = signal(baseLayout);
  readonly appearance = signal<NeuTableAppearance>({
    density: 'compact',
    borders: 'cells',
    striped: true,
    stickyHeader: true,
    responsive: 'contained-scroll',
  });
  readonly rowKey = (row: Row) => row.id;
  readonly sortOptions: NeuTableSortOptions = {
    mode: 'multiple',
    removable: true,
    defaultDirection: 'asc',
    resetPageOnChange: true,
  };
  readonly filterOptions: NeuTableFilterOptions<Row, Field> = {
    surfaces: [],
    globalFields: ['name'],
    predicates: {},
    debounceMs: 0,
    commit: 'immediate',
  };
  readonly rowOptions = {
    reorderable: false,
    isDisabled: (row: Row) => row.disabled ?? false,
    className: (row: Row) => (row.disabled ? ['is-disabled', 'is-muted'] : null),
    pin: (row: Row) => row.pin ?? null,
  };
}

describe('NeuTable 2 private semantic renderer and facade', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuTableNextHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('renders native table semantics, typed templates and safe primitive fallbacks', async () => {
    const fixture = TestBed.createComponent(NeuTableNextHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const native = fixture.nativeElement as HTMLElement;
    const table = native.querySelector('table');
    expect(table?.getAttribute('aria-label')).toBe('Data table');
    expect(native.querySelector('caption')?.textContent?.trim()).toBe('People');
    expect(native.querySelector('.neu-table2__toolbar')?.textContent?.trim()).toBe('Directory');
    expect([...native.querySelectorAll('th')].map((cell) => cell.getAttribute('scope'))).toEqual([
      'col',
      'col',
      'col',
    ]);
    expect(
      native
        .querySelector('th[data-column-id="name"] .neu-table2__header-label')
        ?.textContent?.trim(),
    ).toBe('Custom Name');
    expect(
      native.querySelector('tr[data-row-key="1"] td[data-column-id="name"]')?.textContent?.trim(),
    ).toBe('0:Ada');
    expect(
      native.querySelector('tr[data-row-key="1"] td[data-column-id="id"]')?.textContent?.trim(),
    ).toBe('1');
    expect(
      native.querySelector('tr[data-row-key="1"] td[data-column-id="detail"]')?.textContent?.trim(),
    ).toBe('');
    expect(native.querySelectorAll('[tabindex], th[id], td[headers]').length).toBe(0);
    expect(native.querySelector('tfoot')?.textContent).toContain('End Name');
    expect(native.querySelector('tfoot')?.textContent).toContain('Summary');
  });

  it('reacts to immutable parent replacement, reorder, columns, layout and appearance without echo', async () => {
    const fixture = TestBed.createComponent(NeuTableNextHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const native = fixture.nativeElement as HTMLElement;
    const tableDebug = fixture.debugElement.query(By.directive(NeuTableComponent));
    const table = tableDebug.componentInstance as NeuTableComponent<Row, number, Field>;
    let emissions = 0;
    const subscriptions = [
      table.queryChange,
      table.selectionChange,
      table.layoutChange,
      table.expandedKeysChange,
      table.editStateChange,
      table.groupingChange,
      table.dataRequest,
      table.rangeChange,
      table.rowAction,
      table.editCommit,
      table.editCancel,
      table.rowReorder,
      table.exportRequest,
      table.featureError,
    ].map((emitter) => emitter.subscribe(() => (emissions += 1)));
    const before = new Map(
      [...native.querySelectorAll<HTMLTableRowElement>('tr[data-row-key]')].map((row) => [
        row.dataset['rowKey'],
        row,
      ]),
    );

    host.rows.set(baseRows.map((row) => ({ ...row })).reverse());
    host.columns.set([...baseColumns]);
    host.layout.set({
      ...baseLayout,
      order: ['name', 'id', 'detail'],
      hidden: ['detail'],
      widths: { name: '12rem' },
    });
    host.appearance.update((value) => ({ ...value, density: 'relaxed', striped: false }));
    fixture.detectChanges();
    await fixture.whenStable();

    const reordered = [...native.querySelectorAll<HTMLTableRowElement>('tr[data-row-key]')];
    expect(reordered.map((row) => row.dataset['rowKey'])).toEqual(['3', '2', '1']);
    expect(reordered[0]).toBe(before.get('3'));
    expect(reordered[2]).toBe(before.get('1'));
    expect([...native.querySelectorAll('th')].map((cell) => cell.dataset['columnId'])).toEqual([
      'name',
      'id',
    ]);
    expect(native.querySelector<HTMLElement>('th[data-column-id="name"]')?.style.inlineSize).toBe(
      '12rem',
    );
    expect(native.querySelector('.neu-table2__viewport')?.getAttribute('data-density')).toBe(
      'relaxed',
    );
    expect(emissions).toBe(0);
    subscriptions.forEach((subscription) => subscription.unsubscribe());
  });

  it('renders loading, error and empty metadata states with projected state templates', async () => {
    const fixture = TestBed.createComponent(NeuTableNextHostComponent);
    const host = fixture.componentInstance;

    host.metadata.set({ ...baseMetadata, loading: true });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-state="loading"]')?.textContent,
    ).toContain('Custom loading true');

    host.metadata.set({ ...baseMetadata, error: { message: 'offline' } });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-state="error"]')?.textContent,
    ).toContain('Custom error [object Object]');

    host.metadata.set({ ...baseMetadata, totalItems: 0 });
    host.rows.set([]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-state="empty"]')?.textContent,
    ).toContain('Custom empty');
  });

  it('applies combined client query, parent replacement and remote bypass without outputs', async () => {
    const fixture = TestBed.createComponent(NeuTableNextHostComponent);
    const host = fixture.componentInstance;
    host.paginationOptions.set({ ...host.paginationOptions(), enabled: true });
    host.query.set({
      page: 0,
      pageSize: 1,
      search: '',
      sort: [{ field: 'name', direction: 'desc' }],
      filters: { kind: 'condition', field: 'id', rule: 'greaterThan', value: 1 },
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const native = fixture.nativeElement as HTMLElement;
    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent<Row, number, Field>;
    let queryChanges = 0;
    let dataRequests = 0;
    const querySubscription = table.queryChange.subscribe(() => (queryChanges += 1));
    const requestSubscription = table.dataRequest.subscribe(() => (dataRequests += 1));

    expect(
      [...native.querySelectorAll('tr[data-row-key]')].map((row) =>
        row.getAttribute('data-row-key'),
      ),
    ).toEqual(['3']);
    expect(native.querySelector('th[data-column-id="name"]')?.getAttribute('aria-sort')).toBe(
      'descending',
    );

    host.query.set({ ...host.query(), search: 'grace', filters: null, sort: [] });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      [...native.querySelectorAll('tr[data-row-key]')].map((row) =>
        row.getAttribute('data-row-key'),
      ),
    ).toEqual(['2']);

    host.metadata.set({ ...baseMetadata, queryRevision: 1, appliedRequestId: 77 });
    host.dataMode.set('remote');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      [...native.querySelectorAll('tr[data-row-key]')].map((row) =>
        row.getAttribute('data-row-key'),
      ),
    ).toEqual(['1', '2', '3']);
    expect(queryChanges).toBe(0);
    expect(dataRequests).toBe(0);
    querySubscription.unsubscribe();
    requestSubscription.unsubscribe();
  });

  it('keeps semantic keys distinct, diagnoses duplicates and partitions pinned rows stably', () => {
    const mixed = [{ key: 1 }, { key: '1' }] as const;
    const distinct = projectNeuTableRows(mixed, (row) => row.key, undefined, undefined, true);
    expect(distinct.map((row) => row.track)).toEqual(['number:1', 'string:1']);
    expect(() =>
      projectNeuTableRows([{ id: 1 }, { id: 1 }], (row) => row.id, undefined, undefined, true),
    ).toThrowError(/duplicate row key/i);

    const pinned = projectNeuTableRows(
      [{ id: 1, pin: 'end' as const }, { id: 2 }, { id: 3, pin: 'start' as const }, { id: 4 }],
      (row) => row.id,
      undefined,
      (row) => row.pin ?? null,
      true,
    );
    expect(pinned.map((row) => row.key)).toEqual([3, 2, 4, 1]);
  });

  it('does not mutate deeply frozen inputs while focus activates and export generates', async () => {
    const rows = Object.freeze(baseRows.map((row) => Object.freeze({ ...row })));
    const columns = Object.freeze(baseColumns.map((column) => Object.freeze({ ...column })));
    const fixture = TestBed.createComponent(NeuTableNextHostComponent);
    fixture.componentInstance.rows.set(rows);
    fixture.componentInstance.columns.set(columns);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent<Row, number, Field>;

    expect(table.focusCell({ key: 1, columnId: 'name' })).toBe(true);
    await table.scrollTo({ key: 1 });
    const outcome = await table.export({
      format: 'csv',
      scope: 'loaded',
      fileName: 'people.csv',
      query: { page: 1, pageSize: 25, search: '', sort: [], filters: null },
    });
    expect(outcome.kind).toBe('generated');
    if (outcome.kind === 'generated') {
      expect(outcome.result.fileName).toBe('people.csv');
      expect(outcome.result.mediaType).toBe('text/csv;charset=utf-8');
      expect(outcome.result.bytes.byteLength).toBeGreaterThan(0);
    }
    expect(rows[0]?.name).toBe('Ada');
    expect(columns[0]?.header).toBe('Identifier');
  });
});
