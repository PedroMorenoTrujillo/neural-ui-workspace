import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NeuTableComponent } from './public/neu-table.component-contract';
import type {
  NeuTableColumn,
  NeuTableDataRequest,
  NeuTableMetadata,
  NeuTableQuery,
  NeuTableRangeChange,
  NeuTableSelection,
} from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly pin?: 'start' | 'end';
}

type Field = 'id' | 'name';

const columns: readonly NeuTableColumn<Row, Field>[] = [
  { id: 'id', header: 'ID', field: 'id', sort: { field: 'id' } },
  { id: 'name', header: 'Name', field: 'name' },
];

const query = (): NeuTableQuery<Field> => ({
  page: 7,
  pageSize: 25,
  search: '',
  sort: [{ field: 'id', direction: 'desc' }],
  filters: null,
});

@Component({
  standalone: true,
  imports: [NeuTableComponent],
  template: `
    <neu-table
      [data]="data"
      [metadata]="metadata"
      [columns]="columns"
      [query]="appliedQuery"
      [rowKey]="rowKey"
      [rowOptions]="rowOptions"
      [selection]="selection()"
      [selectionOptions]="selectionOptions"
      [sortOptions]="sortOptions"
      [filterOptions]="filterOptions"
      [paginationOptions]="paginationOptions"
      [virtualizationOptions]="virtualizationOptions()"
      [layout]="layout()"
      (rangeChange)="ranges.push($event)"
      (queryChange)="queryChanges += 1"
      (dataRequest)="dataRequests += 1"
    />
  `,
})
class ClientVirtualHostComponent {
  pipelineReads = 0;
  readonly data: readonly Row[] = [
    { id: -1, name: 'Pinned start', pin: 'start' },
    ...Array.from({ length: 10_000 }, (_, id) => ({ id, name: `Row ${id}` })),
    { id: 10_000, name: 'Pinned end', pin: 'end' },
  ];
  readonly metadata: NeuTableMetadata = {
    totalItems: 10_000,
    loading: false,
    error: null,
    queryRevision: 0,
    appliedRequestId: null,
  };
  readonly columns: readonly NeuTableColumn<Row, Field>[] = [
    {
      id: 'id',
      header: 'ID',
      field: 'id',
      sort: {
        field: 'id',
        value: (row) => {
          this.pipelineReads += 1;
          return row.id;
        },
      },
    },
    { id: 'name', header: 'Name', field: 'name' },
  ];
  readonly appliedQuery = query();
  readonly rowKey = (row: Row) => row.id;
  readonly rowOptions = {
    reorderable: false,
    pin: (row: Row) => row.pin ?? null,
  };
  readonly selection = signal<NeuTableSelection<number, Field>>({
    kind: 'keys',
    keys: [4_999],
  });
  readonly selectionOptions = {
    mode: 'multiple' as const,
    indicator: 'checkbox' as const,
    selectOnRowClick: true,
    modifier: 'toggle' as const,
    range: true,
    toggleAllScope: 'rendered' as const,
  };
  readonly sortOptions = {
    mode: 'single' as const,
    removable: true,
    defaultDirection: 'asc' as const,
    resetPageOnChange: true,
  };
  readonly filterOptions = {
    surfaces: [] as const,
    globalFields: [] as const,
    predicates: {},
    debounceMs: 0,
    commit: 'immediate' as const,
  };
  readonly paginationOptions = {
    enabled: true,
    pageSizeOptions: [25, 50],
    position: 'both' as const,
    report: 'range' as const,
    showPageJump: true,
  };
  readonly virtualizationOptions = signal({
    enabled: true as const,
    itemSize: 20,
    overscan: 2,
    requestStep: 50,
  });
  readonly layout = signal({
    order: [] as readonly string[],
    hidden: [] as readonly string[],
    widths: {} as Readonly<Record<string, string>>,
    pinnedStart: [] as readonly string[],
    pinnedEnd: [] as readonly string[],
  });
  ranges: NeuTableRangeChange[] = [];
  queryChanges = 0;
  dataRequests = 0;
}

@Component({
  standalone: true,
  imports: [NeuTableComponent],
  template: `
    <neu-table
      dataMode="remote"
      [data]="data()"
      [metadata]="metadata()"
      [columns]="columns"
      [query]="appliedQuery()"
      [rowKey]="rowKey"
      [sortOptions]="sortOptions"
      [filterOptions]="filterOptions"
      [paginationOptions]="paginationOptions"
      [virtualizationOptions]="virtualizationOptions"
      (dataRequest)="requests.push($event)"
      (rangeChange)="ranges.push($event)"
    />
  `,
})
class RemoteVirtualHostComponent {
  readonly data = signal<readonly Row[]>(
    Array.from({ length: 50 }, (_, id) => ({ id, name: `Remote ${id}` })),
  );
  readonly metadata = signal<NeuTableMetadata>({
    totalItems: 1_000_000,
    loading: false,
    error: null,
    queryRevision: 0,
    appliedRequestId: 9,
    dataRange: { start: 0, end: 50 },
  });
  readonly columns = columns;
  readonly appliedQuery = signal(query());
  readonly rowKey = (row: Row) => row.id;
  readonly sortOptions = {
    mode: 'single' as const,
    removable: true,
    defaultDirection: 'asc' as const,
    resetPageOnChange: true,
  };
  readonly filterOptions = {
    surfaces: [] as const,
    globalFields: [] as const,
    predicates: {},
    debounceMs: 0,
    commit: 'immediate' as const,
  };
  readonly paginationOptions = {
    enabled: false,
    pageSizeOptions: [25],
    position: 'bottom' as const,
    report: 'range' as const,
    showPageJump: false,
  };
  readonly virtualizationOptions = {
    enabled: true as const,
    itemSize: 20,
    overscan: 2,
    requestStep: 50,
  };
  requests: NeuTableDataRequest<Field>[] = [];
  ranges: NeuTableRangeChange[] = [];
}

function table<T extends ClientVirtualHostComponent | RemoteVirtualHostComponent>(
  fixture: ComponentFixture<T>,
): NeuTableComponent<Row, number, Field> {
  return fixture.debugElement.query(By.directive(NeuTableComponent))
    .componentInstance as NeuTableComponent<Row, number, Field>;
}

function viewport(fixture: ComponentFixture<unknown>): HTMLElement {
  const element = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
    '.neu-table2__viewport',
  )!;
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: 200 });
  return element;
}

describe('NeuTable virtual facade integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientVirtualHostComponent, RemoteVirtualHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('virtualizes 10k queried rows with bounded DOM, global indexes and pinned rows', async () => {
    const fixture = TestBed.createComponent(ClientVirtualHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const native = fixture.nativeElement as HTMLElement;
    viewport(fixture);
    await table(fixture).scrollTo({ index: 5_000 });
    await fixture.whenStable();

    const normal = [...native.querySelectorAll<HTMLTableRowElement>('tr[data-logical-index]')];
    expect(normal).toHaveLength(14);
    expect(normal.map((row) => Number(row.dataset['logicalIndex']))).toEqual(
      Array.from({ length: 14 }, (_, offset) => 4_998 + offset),
    );
    expect(normal.map((row) => row.dataset['rowKey'])).toContain('4999');
    expect(normal.every((row) => row.style.blockSize === '20px')).toBe(true);
    expect(native.querySelector('tr[data-row-key="4999"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(native.querySelectorAll('tr[data-row-pin]')).toHaveLength(2);
    expect(native.querySelector('tr[data-row-pin]')?.hasAttribute('data-logical-index')).toBe(
      false,
    );
    expect(native.querySelectorAll('.neu-table2__virtual-spacer[data-row-key]')).toHaveLength(0);
    expect(native.querySelector('table')?.getAttribute('aria-rowcount')).toBe('10000');
    expect(native.querySelector('.neu-table2__pagination')).toBeNull();
    expect(host.appliedQuery).toMatchObject({ page: 7, pageSize: 25 });
    expect(host.queryChanges).toBe(0);
    expect(host.dataRequests).toBe(0);
  });

  it('does not rerun search/sort/filter pipeline while scrolling and emits semantic ranges only', async () => {
    const fixture = TestBed.createComponent(ClientVirtualHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    viewport(fixture);
    await table(fixture).scrollTo({ index: 0 });
    const reads = host.pipelineReads;
    const emissions = host.ranges.length;

    await table(fixture).scrollTo({ index: 5_000 });
    await fixture.whenStable();
    expect(host.pipelineReads).toBe(reads);
    expect(host.ranges.length).toBe(emissions + 1);
    expect(host.ranges.at(-1)).toMatchObject({
      visible: { start: 5_000, end: 5_010 },
      render: { start: 4_998, end: 5_012 },
      reason: 'programmatic',
    });

    await table(fixture).scrollTo({ index: 5_000 });
    await fixture.whenStable();
    expect(host.ranges.length).toBe(emissions + 1);
    expect(host.pipelineReads).toBe(reads);
  });

  it('supports scrollTo/focusCell for known client keys and rejects invalid targets', async () => {
    const fixture = TestBed.createComponent(ClientVirtualHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const scrollHost = viewport(fixture);
    const instance = table(fixture);

    await instance.scrollTo({ key: 100 });
    await fixture.whenStable();
    expect(scrollHost.scrollTop).toBe(9_899 * 20);
    expect(instance.focusCell({ key: 100, columnId: 'name' })).toBe(true);
    await fixture.whenStable();
    expect((scrollHost.ownerDocument.activeElement as HTMLElement)?.dataset['columnId']).toBe(
      'name',
    );
    expect(
      (scrollHost.ownerDocument.activeElement?.closest('tr') as HTMLElement)?.dataset['rowKey'],
    ).toBe('100');

    const stableOffset = scrollHost.scrollTop;
    await instance.scrollTo({ index: -1 });
    await instance.scrollTo({ key: 50_000 });
    expect(scrollHost.scrollTop).toBe(stableOffset);
    expect(instance.focusCell({ key: 50_000, columnId: 'name' })).toBe(false);
    host.layout.update((value) => ({ ...value, hidden: ['name'] }));
    await fixture.whenStable();
    expect(instance.focusCell({ key: 100, columnId: 'name' })).toBe(false);
  });

  it('keeps a satisfied remote hydration range silent, then dedupes viewport requests at 1M total', async () => {
    const fixture = TestBed.createComponent(RemoteVirtualHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const scrollHost = viewport(fixture);
    const instance = table(fixture);

    await instance.scrollTo({ index: 0 });
    expect(host.requests).toHaveLength(0);
    await instance.scrollTo({ key: 25 });
    expect(scrollHost.scrollTop).toBe(500);
    expect(host.requests).toHaveLength(0);
    await instance.scrollTo({ key: 500_000 });
    expect(scrollHost.scrollTop).toBe(500);
    expect(host.requests).toHaveLength(0);
    expect(instance.focusCell({ key: 500_000, columnId: 'name' })).toBe(false);

    await instance.scrollTo({ index: 1_000 });
    await fixture.whenStable();
    expect(host.requests).toEqual([
      expect.objectContaining({
        requestId: 1,
        queryRevision: 0,
        reason: 'viewport',
        range: { start: 950, end: 1_050 },
      }),
    ]);
    await instance.scrollTo({ index: 1_001 });
    await fixture.whenStable();
    expect(host.requests).toHaveLength(1);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('table')?.getAttribute('aria-rowcount'),
    ).toBe('1000000');
  });

  it('emits one ranged query request and retries the current range without a duplicate viewport request', async () => {
    const fixture = TestBed.createComponent(RemoteVirtualHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    viewport(fixture);
    const instance = table(fixture);
    await instance.scrollTo({ index: 1_000 });
    host.appliedQuery.update((value) => ({ ...value, search: 'accepted' }));
    await fixture.whenStable();

    expect(host.requests.map(({ reason }) => reason)).toEqual(['viewport', 'query']);
    expect(host.requests[1]).toMatchObject({
      requestId: 2,
      queryRevision: 1,
      query: { page: 7, pageSize: 25, search: 'accepted' },
      range: { start: 950, end: 1_050 },
    });
    instance.retryData();
    await fixture.whenStable();
    expect(host.requests[2]).toMatchObject({
      requestId: 3,
      queryRevision: 1,
      reason: 'retry',
      range: { start: 950, end: 1_050 },
    });
  });

  it('maps remote dataRange indexes exactly and renders only a safe mismatch intersection', async () => {
    const fixture = TestBed.createComponent(RemoteVirtualHostComponent);
    const host = fixture.componentInstance;
    host.data.set(Array.from({ length: 10 }, (_, id) => ({ id, name: `Remote ${id}` })));
    host.metadata.set({
      totalItems: 1_000_000,
      loading: false,
      error: null,
      queryRevision: 0,
      appliedRequestId: 9,
      dataRange: { start: 0, end: 50 },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    viewport(fixture);
    await table(fixture).scrollTo({ index: 0 });
    await fixture.whenStable();

    const rows = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLTableRowElement>(
        'tr[data-logical-index]',
      ),
    ];
    expect(rows.map((row) => Number(row.dataset['logicalIndex']))).toEqual(
      Array.from({ length: 10 }, (_, index) => index),
    );
    expect(rows.map((row) => Number(row.dataset['rowKey']))).toEqual(
      Array.from({ length: 10 }, (_, index) => index),
    );
  });

  it('cleans one listener, one observer and a pending frame across 100 create/destroy cycles', async () => {
    const browser = window as typeof window & { ResizeObserver?: typeof ResizeObserver };
    const eventPrototype = browser.EventTarget.prototype as EventTarget & {
      addEventListener: typeof EventTarget.prototype.addEventListener;
      removeEventListener: typeof EventTarget.prototype.removeEventListener;
    };
    const originalAdd = eventPrototype.addEventListener;
    const originalRemove = eventPrototype.removeEventListener;
    const originalObserver = browser.ResizeObserver;
    const originalCancel = browser.cancelAnimationFrame;
    let added = 0;
    let removed = 0;
    let observed = 0;
    let disconnected = 0;
    let cancelled = 0;

    eventPrototype.addEventListener = function (type, listener, options) {
      if (
        type === 'scroll' &&
        this instanceof HTMLElement &&
        this.classList.contains('neu-table2__viewport')
      ) {
        added += 1;
      }
      return originalAdd.call(this, type, listener, options);
    };
    eventPrototype.removeEventListener = function (type, listener, options) {
      if (
        type === 'scroll' &&
        this instanceof HTMLElement &&
        this.classList.contains('neu-table2__viewport')
      ) {
        removed += 1;
      }
      return originalRemove.call(this, type, listener, options);
    };
    browser.ResizeObserver = class {
      observe(): void {
        observed += 1;
      }
      unobserve(): void {}
      disconnect(): void {
        disconnected += 1;
      }
    } as typeof ResizeObserver;
    browser.cancelAnimationFrame = (handle: number) => {
      cancelled += 1;
      originalCancel.call(browser, handle);
    };

    try {
      for (let index = 0; index < 100; index += 1) {
        const fixture = TestBed.createComponent(RemoteVirtualHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const host = fixture.componentInstance;
        const scrollHost = viewport(fixture);
        scrollHost.dispatchEvent(new Event('scroll'));
        const eventCount = host.ranges.length;
        fixture.destroy();
        await Promise.resolve();
        expect(host.ranges).toHaveLength(eventCount);
        expect(host.requests).toHaveLength(0);
      }
    } finally {
      eventPrototype.addEventListener = originalAdd;
      eventPrototype.removeEventListener = originalRemove;
      browser.ResizeObserver = originalObserver;
      browser.cancelAnimationFrame = originalCancel;
    }

    expect({ added, removed, observed, disconnected }).toEqual({
      added: 100,
      removed: 100,
      observed: 100,
      disconnected: 100,
    });
    expect(cancelled).toBeGreaterThanOrEqual(100);
  }, 30_000);
});
