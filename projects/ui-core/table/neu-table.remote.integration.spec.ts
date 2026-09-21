import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NeuTableComponent } from './public/neu-table.component-contract';
import type {
  NeuTableColumn,
  NeuTableDataMode,
  NeuTableDataRequest,
  NeuTableLayoutState,
  NeuTableMetadata,
  NeuTableQuery,
  NeuTableSelection,
} from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
}
type Field = 'id' | 'name';

const initialQuery = (): NeuTableQuery<Field> => ({
  page: 0,
  pageSize: 2,
  search: '',
  sort: [],
  filters: null,
});
const initialMetadata = (): NeuTableMetadata => ({
  totalItems: 2,
  loading: false,
  error: null,
  queryRevision: 0,
  appliedRequestId: null,
});

@Component({
  standalone: true,
  imports: [NeuTableComponent],
  template: `
    <neu-table
      [dataMode]="dataMode()"
      [data]="data()"
      [metadata]="metadata()"
      [columns]="columns"
      [query]="query()"
      [rowKey]="rowKey"
      [sortOptions]="sortOptions"
      [filterOptions]="filterOptions"
      [paginationOptions]="paginationOptions"
      [selection]="selection()"
      [layout]="layout()"
      [appearance]="appearance()"
      (queryChange)="onQuery($event)"
      (dataRequest)="onRequest($event)"
      (selectionChange)="otherOutputs += 1"
      (layoutChange)="otherOutputs += 1"
      (rangeChange)="otherOutputs += 1"
    />
  `,
})
class RemoteHostComponent {
  readonly dataMode = signal<NeuTableDataMode>('remote');
  readonly data = signal<readonly Row[]>([
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Grace' },
  ]);
  readonly metadata = signal<NeuTableMetadata>(initialMetadata());
  readonly query = signal<NeuTableQuery<Field>>(initialQuery());
  readonly selection = signal<NeuTableSelection<number, Field>>({ kind: 'keys', keys: [] });
  readonly layout = signal<NeuTableLayoutState>({
    order: [],
    hidden: [],
    widths: {},
    pinnedStart: [],
    pinnedEnd: [],
  });
  readonly appearance = signal({
    density: 'normal' as const,
    borders: 'rows' as const,
    striped: false,
    stickyHeader: false,
    responsive: 'contained-scroll' as const,
  });
  readonly columns: readonly NeuTableColumn<Row, Field>[] = [
    { id: 'id', header: 'ID', field: 'id', sort: { field: 'id' } },
    {
      id: 'name',
      header: 'Name',
      field: 'name',
      sort: { field: 'name' },
      filter: { field: 'name', rules: ['contains'], defaultRule: 'contains' },
    },
  ];
  readonly rowKey = (row: Row) => row.id;
  readonly sortOptions = {
    mode: 'single' as const,
    removable: true,
    defaultDirection: 'asc' as const,
    resetPageOnChange: true,
  };
  readonly filterOptions = {
    surfaces: ['row'] as const,
    globalFields: ['name'] as const,
    predicates: {},
    debounceMs: 0,
    commit: 'explicit' as const,
  };
  readonly paginationOptions = {
    enabled: true,
    pageSizeOptions: [2, 5],
    position: 'bottom' as const,
    report: 'range' as const,
    showPageJump: true,
  };
  acceptQuery = false;
  correlateResponses = true;
  queryEvents: NeuTableQuery<Field>[] = [];
  requests: NeuTableDataRequest<Field>[] = [];
  ordering: string[] = [];
  otherOutputs = 0;

  onQuery(query: NeuTableQuery<Field>): void {
    this.queryEvents.push(query);
    this.ordering.push('queryChange');
    if (this.acceptQuery) this.query.set(query);
  }

  onRequest(request: NeuTableDataRequest<Field>): void {
    this.requests.push(request);
    this.ordering.push(`dataRequest:${request.reason}`);
    if (this.correlateResponses) {
      this.metadata.update((value) => ({
        ...value,
        queryRevision: request.queryRevision,
        appliedRequestId: request.requestId,
      }));
    }
  }
}

function table(fixture: ComponentFixture<RemoteHostComponent>) {
  return fixture.debugElement.query(By.directive(NeuTableComponent))
    .componentInstance as NeuTableComponent<Row, number, Field>;
}

describe('NeuTable remote request integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemoteHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('emits one browser initial and never loops on response metadata/data', async () => {
    const fixture = TestBed.createComponent(RemoteHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;

    expect(host.requests).toEqual([
      expect.objectContaining({ requestId: 1, queryRevision: 0, reason: 'initial' }),
    ]);

    host.metadata.update((value) => ({ ...value, loading: true }));
    host.metadata.update((value) => ({ ...value, loading: false, totalItems: 50 }));
    host.data.set([{ id: 3, name: 'Katherine' }]);
    await fixture.whenStable();
    expect(host.requests).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('[data-state="loading"]')).toBeNull();
  });

  it('waits for parent acceptance and preserves queryChange/dataRequest ordering', async () => {
    const fixture = TestBed.createComponent(RemoteHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    host.ordering = [];
    const native = fixture.nativeElement as HTMLElement;
    const sort = native.querySelector<HTMLButtonElement>('[aria-label^="Sort Name"]')!;

    sort.click();
    await fixture.whenStable();
    expect(host.queryEvents).toHaveLength(1);
    expect(host.requests).toHaveLength(1);
    expect(host.ordering).toEqual(['queryChange']);

    host.acceptQuery = true;
    sort.click();
    await fixture.whenStable();
    expect(host.ordering).toEqual(['queryChange', 'queryChange', 'dataRequest:query']);
    expect(host.requests.at(-1)).toMatchObject({
      requestId: 2,
      queryRevision: 1,
      reason: 'query',
    });
  });

  it('uses one query channel for search/filter/page/pageSize and dedupes semantic echoes', async () => {
    const fixture = TestBed.createComponent(RemoteHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const applied: NeuTableQuery<Field>[] = [
      { ...host.query(), search: 'ada' },
      {
        ...host.query(),
        search: 'ada',
        filters: { kind: 'condition', field: 'name', rule: 'contains', value: 'a' },
      },
      {
        ...host.query(),
        search: 'ada',
        filters: { kind: 'condition', field: 'name', rule: 'contains', value: 'a' },
        page: 1,
      },
      {
        ...host.query(),
        search: 'ada',
        filters: { kind: 'condition', field: 'name', rule: 'contains', value: 'a' },
        page: 0,
        pageSize: 5,
      },
    ];
    for (const next of applied) {
      host.query.set(next);
      await fixture.whenStable();
    }
    expect(host.requests.map(({ reason }) => reason)).toEqual([
      'initial',
      'query',
      'query',
      'query',
      'query',
    ]);
    expect(host.requests.map(({ queryRevision }) => queryRevision)).toEqual([0, 1, 2, 3, 4]);

    host.query.set({ ...host.query(), sort: [...host.query().sort] });
    await fixture.whenStable();
    expect(host.requests).toHaveLength(5);
    expect(
      host.requests.some(({ reason, range }) => reason === 'viewport' || range !== undefined),
    ).toBe(false);
  });

  it('keeps selection/layout/appearance independent and supports all-matching without transport', async () => {
    const fixture = TestBed.createComponent(RemoteHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;

    host.selection.set({
      kind: 'all-matching',
      scope: { search: '', filters: null, globalFields: ['name'] },
      excludedKeys: [2],
    });
    host.layout.set({ ...host.layout(), hidden: ['id'] });
    host.appearance.update((value) => ({ ...value, striped: true }));
    host.metadata.update((value) => ({ ...value, totalItems: 500, loading: true }));
    await fixture.whenStable();
    expect(host.requests).toHaveLength(1);
    expect(host.otherOutputs).toBe(0);
  });

  it('routes public and accessible UI retry through the same revision and monotonic IDs', async () => {
    const fixture = TestBed.createComponent(RemoteHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    host.query.set({ ...host.query(), search: 'remote' });
    await fixture.whenStable();

    table(fixture).retryData();
    await fixture.whenStable();
    expect(host.requests.at(-1)).toMatchObject({ requestId: 3, queryRevision: 1, reason: 'retry' });

    host.metadata.update((value) => ({ ...value, error: new Error('failed') }));
    await fixture.whenStable();
    const retry = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Retry"]',
    )!;
    expect(retry).not.toBeNull();
    retry.click();
    await fixture.whenStable();
    expect(host.requests.at(-1)).toMatchObject({ requestId: 4, queryRevision: 1, reason: 'retry' });
    expect(host.queryEvents).toHaveLength(0);
    expect(host.otherOutputs).toBe(0);
  });

  it('keeps client silent and applies satisfaction rules on remote entry and re-entry', async () => {
    const fixture = TestBed.createComponent(RemoteHostComponent);
    const host = fixture.componentInstance;
    host.dataMode.set('client');
    fixture.detectChanges();
    await fixture.whenStable();
    host.query.set({ ...host.query(), search: 'client' });
    host.metadata.set({ ...initialMetadata(), queryRevision: 1, appliedRequestId: 30 });
    await fixture.whenStable();
    expect(host.requests).toHaveLength(0);

    host.dataMode.set('remote');
    await fixture.whenStable();
    expect(host.requests).toHaveLength(0);

    host.dataMode.set('client');
    await fixture.whenStable();
    host.metadata.update((value) => ({ ...value, appliedRequestId: null }));
    host.dataMode.set('remote');
    await fixture.whenStable();
    expect(host.requests).toEqual([
      expect.objectContaining({ requestId: 1, queryRevision: 1, reason: 'initial' }),
    ]);
  });

  it('does not present old-revision or older-retry rows as current', async () => {
    const fixture = TestBed.createComponent(RemoteHostComponent);
    const host = fixture.componentInstance;
    host.correlateResponses = false;
    fixture.detectChanges();
    await fixture.whenStable();
    host.metadata.set({ ...initialMetadata(), appliedRequestId: 1 });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('tbody tr[data-row-key]')).toHaveLength(2);

    host.query.set({ ...host.query(), search: 'new' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('tbody tr[data-row-key]')).toHaveLength(0);
    host.metadata.set({ ...initialMetadata(), queryRevision: 1, appliedRequestId: 2 });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('tbody tr[data-row-key]')).toHaveLength(2);

    table(fixture).retryData();
    await fixture.whenStable();
    expect(host.requests.at(-1)).toMatchObject({ requestId: 3, reason: 'retry' });
    expect(fixture.nativeElement.querySelectorAll('tbody tr[data-row-key]')).toHaveLength(0);
    host.metadata.set({ ...initialMetadata(), queryRevision: 1, appliedRequestId: 3 });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('tbody tr[data-row-key]')).toHaveLength(2);
  });

  it('emits nothing from retryData after component destruction', async () => {
    const fixture = TestBed.createComponent(RemoteHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const instance = table(fixture);
    fixture.destroy();

    instance.retryData();
    expect(host.requests).toHaveLength(1);
  });
});
