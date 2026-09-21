import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NeuTreeTableComponent } from './public/neu-tree-table.component-contract';
import type {
  NeuTreeLoadedRelation,
  NeuTreeTableColumn,
  NeuTreeTableHierarchy,
  NeuTreeTableFilterOptions,
  NeuTreeTableQuery,
  NeuTreeTableRangeChange,
  NeuTreeTableSelection,
  NeuTreeTableSelectionOptions,
  NeuTreeTableVirtualizationOptions,
} from './public/neu-tree-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
}

const total = 10_000;
const rows: readonly Row[] = Array.from({ length: total }, (_, id) => ({ id, name: `Row ${id}` }));
const loadedRoots: NeuTreeLoadedRelation<number> = {
  status: 'loaded',
  keys: rows.map((row) => row.id),
  relationRevision: 1,
  appliedRequestId: null,
  total,
  completeness: 'complete',
};

@Component({
  standalone: true,
  imports: [NeuTreeTableComponent],
  template: `
    <neu-tree-table
      [data]="rows"
      [hierarchy]="hierarchy()"
      [columns]="columns"
      [rowKey]="rowKey"
      [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
      [virtualizationOptions]="virtualization()"
      [selection]="selection()"
      [selectionOptions]="selectionOptions"
      [query]="query()"
      [filterOptions]="filterOptions"
      (rangeChange)="ranges.update((ranges) => [...ranges, $event])"
      (dataRequest)="requests.update((count) => count + 1)"
    />
  `,
})
class VirtualHostComponent {
  readonly rows = rows;
  readonly columns: readonly NeuTreeTableColumn<Row, 'name'>[] = [
    { id: 'name', header: 'Name', field: 'name' },
  ];
  readonly hierarchy = signal<NeuTreeTableHierarchy<number>>({
    hierarchyRevision: 1,
    queryRevision: 0,
    roots: loadedRoots,
    children: [],
  });
  readonly virtualization = signal<NeuTreeTableVirtualizationOptions>({
    enabled: true,
    itemSize: 20,
    overscan: 2,
  });
  readonly selection = signal<NeuTreeTableSelection<number>>({ kind: 'keys', keys: [9_999] });
  readonly selectionOptions: NeuTreeTableSelectionOptions<Row> = {
    mode: 'multiple',
    indicator: 'checkbox',
    selectOnRowClick: false,
    modifier: 'toggle',
    range: false,
    propagation: 'none',
    toggleAllScope: 'loaded',
  };
  readonly query = signal<NeuTreeTableQuery<'name'>>({
    page: 0,
    pageSize: 25,
    search: '',
    sort: [],
    filters: null,
  });
  readonly filterOptions: NeuTreeTableFilterOptions<Row, 'name'> = {
    surfaces: [],
    globalFields: ['name'],
    predicates: {},
    debounceMs: 0,
    commit: 'immediate',
  };
  readonly ranges = signal<readonly NeuTreeTableRangeChange[]>([]);
  readonly requests = signal(0);
  readonly rowKey = (row: Row) => row.id;
}

@Component({
  standalone: true,
  imports: [NeuTreeTableComponent],
  template: `
    <neu-tree-table
      [data]="data"
      [hierarchy]="hierarchy"
      [columns]="columns"
      [rowKey]="rowKey"
      [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
      [virtualizationOptions]="{ enabled: true, itemSize: 20, overscan: 1 }"
    />
  `,
})
class SmallVirtualHostComponent {
  readonly data = [rows[0]!];
  readonly hierarchy: NeuTreeTableHierarchy<number> = {
    hierarchyRevision: 1,
    queryRevision: 0,
    roots: { ...loadedRoots, keys: [0], total: 1 },
    children: [],
  };
  readonly columns: readonly NeuTreeTableColumn<Row, 'name'>[] = [
    { id: 'name', header: 'Name', field: 'name' },
  ];
  readonly rowKey = (row: Row) => row.id;
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

describe('NeuTreeTable 2 fixed-height virtualization integration', () => {
  beforeEach(async () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('neu-tree-table2__viewport') ? 100 : 0;
    });
    await TestBed.configureTestingModule({
      imports: [VirtualHostComponent, SmallVirtualHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  it('bounds 10k loaded nodes, emits local ranges and keeps native treegrid semantics', async () => {
    const fixture = TestBed.createComponent(VirtualHostComponent);
    fixture.detectChanges();
    await nextFrame();
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const viewport = native.querySelector<HTMLElement>('.neu-tree-table2__viewport')!;
    const table = native.querySelector<HTMLTableElement>('table[role="treegrid"]')!;
    const mounted = () => [...native.querySelectorAll<HTMLTableRowElement>('tr[data-node-key]')];

    expect(mounted()).toHaveLength(7);
    expect(table.getAttribute('aria-rowcount')).toBe('10000');
    expect(mounted()[0]?.getAttribute('aria-rowindex')).toBe('1');
    expect(native.querySelector('[data-virtual-spacer="after"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(native.querySelectorAll('tr[data-node-key][tabindex="0"]')).toHaveLength(1);
    expect(fixture.componentInstance.ranges().at(-1)).toMatchObject({
      visible: { start: 0, end: 5 },
      render: { start: 0, end: 7 },
      reason: 'resize',
    });

    viewport.scrollTop = 100_000;
    viewport.dispatchEvent(new Event('scroll'));
    await nextFrame();
    fixture.detectChanges();
    expect(mounted()).toHaveLength(9);
    expect(mounted()[0]?.dataset['logicalIndex']).toBe('4998');
    expect(fixture.componentInstance.ranges().at(-1)).toMatchObject({
      visible: { start: 5000, end: 5005 },
      render: { start: 4998, end: 5007 },
      reason: 'scroll',
    });
    expect(fixture.componentInstance.requests()).toBe(0);
  }, 15_000);

  it('mounts programmatic index and semantic focus targets without backend lookup', async () => {
    const fixture = TestBed.createComponent(VirtualHostComponent);
    fixture.detectChanges();
    await nextFrame();
    fixture.detectChanges();
    const table = fixture.debugElement.query(By.directive(NeuTreeTableComponent))
      .componentInstance as NeuTreeTableComponent<Row, number, 'name'>;
    const native = fixture.nativeElement as HTMLElement;

    table.scrollTo({ kind: 'index', index: 9_999 });
    fixture.detectChanges();
    expect(
      [...native.querySelectorAll<HTMLElement>('tr[data-node-key]')].at(-1)?.dataset[
        'logicalIndex'
      ],
    ).toBe('9999');
    expect(
      native.querySelector('tr[data-logical-index="9999"]')?.getAttribute('aria-selected'),
    ).toBe('true');
    expect(fixture.componentInstance.ranges().at(-1)?.reason).toBe('programmatic');

    table.scrollTo({ kind: 'index', index: 0 });
    fixture.detectChanges();
    table.focus({ kind: 'node', key: 9_999 });
    fixture.detectChanges();
    await fixture.whenStable();
    expect((document.activeElement as HTMLElement | null)?.dataset['logicalIndex']).toBe('9999');
    expect(fixture.componentInstance.requests()).toBe(0);
  }, 15_000);

  it('clamps the window after an applied query shrink without mutating selection', async () => {
    const fixture = TestBed.createComponent(VirtualHostComponent);
    fixture.detectChanges();
    await nextFrame();
    fixture.detectChanges();
    const table = fixture.debugElement.query(By.directive(NeuTreeTableComponent))
      .componentInstance as NeuTreeTableComponent<Row, number, 'name'>;
    table.scrollTo({ kind: 'index', index: 9_999 });
    fixture.detectChanges();

    fixture.componentInstance.query.set({
      page: 0,
      pageSize: 25,
      search: 'Row 9999',
      sort: [],
      filters: null,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const domainRows = fixture.nativeElement.querySelectorAll('tr[data-node-key]');
    expect(domainRows).toHaveLength(1);
    expect(domainRows[0]?.getAttribute('aria-selected')).toBe('true');
    expect(fixture.componentInstance.selection()).toEqual({ kind: 'keys', keys: [9_999] });
    expect(fixture.componentInstance.ranges().at(-1)?.reason).toBe('hierarchy');
    expect(fixture.componentInstance.requests()).toBe(0);
  }, 15_000);

  it('keeps the server-compatible full projection until viewport geometry is measured', () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(0);
    const fixture = TestBed.createComponent(VirtualHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tr[data-node-key]')).toHaveLength(total);
    expect(fixture.componentInstance.ranges()).toEqual([]);
  }, 15_000);

  it('cleans one viewport listener, observer and pending frame across 100 lifecycles', () => {
    const originalResizeObserver = window.ResizeObserver;
    let observed = 0;
    let disconnected = 0;
    class TestResizeObserver {
      observe(): void {
        observed += 1;
      }
      disconnect(): void {
        disconnected += 1;
      }
    }
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      value: TestResizeObserver,
    });
    const add = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const remove = vi.spyOn(HTMLElement.prototype, 'removeEventListener');
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');

    for (let index = 0; index < 100; index += 1) {
      const fixture = TestBed.createComponent(SmallVirtualHostComponent);
      fixture.detectChanges();
      fixture.destroy();
    }

    expect(add.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(100);
    expect(remove.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(100);
    expect(observed).toBe(100);
    expect(disconnected).toBe(100);
    expect(cancel.mock.calls.length).toBeGreaterThanOrEqual(100);
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      value: originalResizeObserver,
    });
  });
});
