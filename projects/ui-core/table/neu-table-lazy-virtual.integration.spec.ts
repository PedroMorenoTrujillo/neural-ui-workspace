import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NeuTableComponent } from './neu-table.component';
import type { NeuTableColumn, NeuTableLazyRequest } from './neu-table.types';

interface LazyRow {
  id: number;
  name: string;
}

const COLUMNS: NeuTableColumn<LazyRow>[] = [
  { key: 'id', header: 'ID', frozen: 'left', sortable: true },
  { key: 'name', header: 'Name', sortable: true },
];

function makeRows(first: number, count: number): LazyRow[] {
  return Array.from({ length: count }, (_, offset) => ({
    id: first + offset,
    name: `Server row ${first + offset}`,
  }));
}

@Component({
  standalone: true,
  imports: [NeuTableComponent],
  template: `
    <neu-table
      [columns]="columns"
      [data]="rows"
      [dataFirst]="0"
      [totalItems]="20"
      [serverSide]="true"
      [virtualScroll]="true"
      [virtualScrollVisibleItems]="3"
      [virtualScrollItemSize]="40"
      [lazyPlaceholderTemplate]="placeholder"
    />
    <ng-template #placeholder let-logicalIndex let-colspan="colspan">
      <td class="custom-lazy-placeholder" [attr.colspan]="colspan">Loading {{ logicalIndex }}</td>
    </ng-template>
  `,
})
class LazyPlaceholderHost {
  readonly columns = COLUMNS;
  readonly rows = makeRows(0, 1);
}

describe('NeuTable lazy virtual integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideZonelessChangeDetection(),
        provideIcons({ lucidePencil }),
      ],
    }).compileComponents();
  });

  function createLazyTable(rows = makeRows(0, 6)) {
    const fixture = TestBed.createComponent(NeuTableComponent<LazyRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('dataFirst', 0);
    fixture.componentRef.setInput('totalItems', 10_000);
    fixture.componentRef.setInput('serverSide', true);
    fixture.componentRef.setInput('lazyLoadOnInit', true);
    fixture.componentRef.setInput('pagination', true);
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualScrollVisibleItems', 3);
    fixture.componentRef.setInput('virtualScrollItemSize', 40);
    fixture.componentRef.setInput('useUrlState', false);
    return fixture;
  }

  it('emits one atomic initial request and no response-to-request loop', async () => {
    const fixture = createLazyTable();
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      requestId: 1,
      reason: 'initial',
      range: { first: 0, end: 6, visibleFirst: 0, visibleEnd: 3 },
      query: { page: 1, pageSize: 10, search: '' },
    });

    fixture.componentRef.setInput('data', makeRows(0, 6));
    fixture.componentRef.setInput('dataFirst', 0);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(requests).toHaveLength(1);
  });

  it('emits only when the requested logical range changes and keeps the DOM bounded', async () => {
    const fixture = createLazyTable();
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;

    table.onTableScroll({ target: { scrollTop: 20 } } as unknown as Event);
    expect(requests).toHaveLength(1);

    table.onTableScroll({ target: { scrollTop: 44 + 5000 * 40 } } as unknown as Event);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(requests).toHaveLength(2);
    expect(requests[1]).toMatchObject({
      requestId: 2,
      reason: 'scroll',
      range: { first: 4997, end: 5006, visibleFirst: 5000, visibleEnd: 5003 },
    });
    expect(fixture.nativeElement.querySelectorAll('.neu-table__row--placeholder')).toHaveLength(9);
    expect(fixture.nativeElement.querySelectorAll('.neu-table__body > tr').length).toBeLessThan(12);
  });

  it('supports configurable overscan and emits once when viewport sizing changes', async () => {
    const fixture = createLazyTable();
    fixture.componentRef.setInput('virtualScrollOverscan', 5);
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(requests).toHaveLength(1);
    expect(requests[0].range).toEqual({
      first: 0,
      end: 8,
      visibleFirst: 0,
      visibleEnd: 3,
    });

    fixture.componentRef.setInput('virtualScrollVisibleItems', 4);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(requests).toHaveLength(2);
    expect(requests[1]).toMatchObject({
      reason: 'viewport-change',
      range: { first: 0, end: 9, visibleFirst: 0, visibleEnd: 4 },
    });

    fixture.componentRef.setInput('virtualScrollItemSize', 50);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(requests.at(-1)?.reason).toBe('viewport-change');

    fixture.componentRef.setInput('virtualScrollOverscan', -4);
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.componentInstance as any)._virtualOverscan()).toBe(0);
    expect(requests.at(-1)).toMatchObject({
      reason: 'viewport-change',
      range: { first: 0, end: 4 },
    });

    fixture.componentRef.setInput('virtualScrollVisibleItems', 0);
    fixture.componentRef.setInput('virtualScrollOverscan', 0);
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.componentInstance as any)._virtualOverscan()).toBe(0);
    fixture.componentInstance.scrollToIndex(3);
    fixture.componentInstance.scrollToOffset(100);
  });

  it('debounces range rendering and lazy requests when a delay is configured', async () => {
    const fixture = createLazyTable();
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentRef.setInput('virtualScrollDelay', 25);
    fixture.detectChanges();

    vi.useFakeTimers();
    try {
      fixture.componentInstance.onTableScroll({
        target: { scrollTop: 44 + 100 * 40 },
      } as unknown as Event);
      expect(requests).toHaveLength(1);
      expect((fixture.componentInstance as any)._virtualRange().visibleFirst).toBe(0);

      vi.advanceTimersByTime(24);
      expect(requests).toHaveLength(1);
      vi.advanceTimersByTime(1);

      expect(requests).toHaveLength(2);
      expect(requests[1]).toMatchObject({
        reason: 'scroll',
        range: { visibleFirst: 100, visibleEnd: 103 },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('coalesces delayed scrolls and cancels pending work on destroy', async () => {
    const fixture = createLazyTable();
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentRef.setInput('virtualScrollDelay', 10.9);
    fixture.detectChanges();

    vi.useFakeTimers();
    try {
      fixture.componentInstance.onTableScroll({
        target: { scrollTop: 44 + 100 * 40 },
      } as unknown as Event);
      fixture.componentInstance.onTableScroll({
        target: { scrollTop: 44 + 101 * 40 },
      } as unknown as Event);
      vi.advanceTimersByTime(10);
      expect(requests).toHaveLength(2);
      expect(requests[1].range.visibleFirst).toBe(101);

      fixture.componentInstance.onTableScroll({
        target: { scrollTop: 44 + 200 * 40 },
      } as unknown as Event);
      fixture.destroy();
      vi.runAllTimers();
      expect(requests).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('positions by logical index and offset with one deduplicated sparse request', async () => {
    const fixture = createLazyTable();
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;

    table.scrollToIndex(5000);
    expect(requests).toHaveLength(2);
    expect(requests[1]).toMatchObject({
      reason: 'programmatic',
      range: { first: 4997, end: 5006, visibleFirst: 5000, visibleEnd: 5003 },
    });

    table.onTableScroll({ target: { scrollTop: 44 + 5000 * 40 } } as unknown as Event);
    expect(requests).toHaveLength(2);

    table.scrollToOffset(10 * 40);
    expect(requests).toHaveLength(3);
    expect(requests[2]).toMatchObject({
      reason: 'programmatic',
      range: { visibleFirst: 10, visibleEnd: 13 },
    });

    table.resetVirtualScroll();
    expect(requests).toHaveLength(4);
    expect(requests[3]).toMatchObject({
      reason: 'programmatic',
      range: { visibleFirst: 0, visibleEnd: 3 },
    });
    table.scrollToIndex(-10);
    expect(requests).toHaveLength(4);
  });

  it('normalizes invalid and out-of-range programmatic positions', async () => {
    const fixture = createLazyTable();
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;

    table.scrollToIndex(Number.NaN);
    table.scrollToIndex(Number.POSITIVE_INFINITY);
    expect(requests).toHaveLength(1);

    table.scrollToIndex(1_000_000);
    expect(requests.at(-1)?.range.visibleEnd).toBe(10_000);

    table.scrollToOffset(Number.NaN);
    expect(requests.at(-1)?.range.visibleFirst).toBe(0);

    table.scrollToOffset(1_000_000_000);
    expect(requests.at(-1)?.range.visibleEnd).toBe(10_000);

    table.scrollToOffset(-100);
    expect(requests.at(-1)?.range.visibleFirst).toBe(0);
  });

  it('keeps public virtual positioning safe for an empty total and disabled virtualization', async () => {
    const empty = createLazyTable([]);
    empty.componentRef.setInput('totalItems', 0);
    const emptyRequests: NeuTableLazyRequest[] = [];
    empty.componentInstance.lazyRequest.subscribe((event) => emptyRequests.push(event));
    empty.detectChanges();
    await empty.whenStable();
    empty.componentInstance.scrollToIndex(4);
    expect(emptyRequests).toHaveLength(1);

    const disabled = createLazyTable();
    disabled.componentRef.setInput('virtualScroll', false);
    const disabledRequests: NeuTableLazyRequest[] = [];
    disabled.componentInstance.lazyRequest.subscribe((event) => disabledRequests.push(event));
    disabled.detectChanges();
    await disabled.whenStable();
    disabled.componentInstance.scrollToIndex(4);
    disabled.componentInstance.scrollToOffset(100);
    expect(disabledRequests).toEqual([]);
  });

  it('renders a custom inert placeholder without exposing a fake row value', async () => {
    const fixture = TestBed.createComponent(LazyPlaceholderHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const custom = [
      ...fixture.nativeElement.querySelectorAll('.custom-lazy-placeholder'),
    ] as HTMLTableCellElement[];
    const placeholderRows = [
      ...fixture.nativeElement.querySelectorAll('.neu-table__row--placeholder'),
    ] as HTMLTableRowElement[];

    expect(custom.length).toBeGreaterThan(0);
    expect(custom[0].textContent).toContain('Loading 1');
    expect(placeholderRows.every((row) => row.hasAttribute('inert'))).toBe(true);
    expect(
      placeholderRows.every((row) => row.querySelector('button,input,[tabindex]') === null),
    ).toBe(true);
  });

  it('renders non-interactive placeholders with truthful logical ARIA metadata', async () => {
    const fixture = createLazyTable(makeRows(0, 2));
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const region = fixture.nativeElement.querySelector('.neu-table__scroll-container');
    const table = fixture.nativeElement.querySelector('table');
    const placeholders = [
      ...fixture.nativeElement.querySelectorAll('.neu-table__row--placeholder'),
    ] as HTMLTableRowElement[];
    const loaded = [
      ...fixture.nativeElement.querySelectorAll(
        '.neu-table__row:not(.neu-table__row--placeholder)',
      ),
    ] as HTMLTableRowElement[];

    expect(region.getAttribute('aria-busy')).toBe('true');
    expect(table.getAttribute('aria-rowcount')).toBe('10000');
    expect(placeholders).toHaveLength(4);
    expect(placeholders.every((row) => row.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(placeholders.every((row) => row.querySelector('button,input,[tabindex]') === null)).toBe(
      true,
    );
    expect(loaded.map((row) => row.getAttribute('aria-rowindex'))).toEqual(['2', '3']);
    expect(placeholders[0].querySelector('.neu-table__td--frozen-left')).not.toBeNull();
  });

  it('offsets logical aria-rowindex for both header rows when filters are rendered', async () => {
    const fixture = createLazyTable(makeRows(50, 3));
    fixture.componentRef.setInput('dataFirst', 50);
    fixture.componentRef.setInput('columns', [
      COLUMNS[0],
      { ...COLUMNS[1], filterConfig: { kind: 'text' } },
    ] satisfies NeuTableColumn<LazyRow>[]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.onTableScroll({
      target: { scrollTop: 96 + 50 * 40 },
    } as unknown as Event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.nativeElement
        .querySelector('[data-neu-table-logical-index="50"]')
        ?.getAttribute('aria-rowindex'),
    ).toBe('53');
  });

  it('keeps key selection canonical across window replacement and restores projection', async () => {
    const fixture = createLazyTable();
    fixture.componentRef.setInput('selectionMode', 'multiple');
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const selectionChanges: LazyRow[][] = [];
    table.selectionChange.subscribe((event) => selectionChanges.push(event));

    table.toggleRow(table.data()[1] as LazyRow, 'checkbox');
    expect((table as any)._state.selectionKeys()).toEqual(new Set([1]));

    table.onTableScroll({ target: { scrollTop: 44 + 100 * 40 } } as unknown as Event);
    fixture.componentRef.setInput('dataFirst', 97);
    fixture.componentRef.setInput('data', makeRows(97, 9));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table.selectedCount()).toBe(1);
    expect(table.selectedRows()).toEqual([]);

    table.onTableScroll({ target: { scrollTop: 0 } } as unknown as Event);
    fixture.componentRef.setInput('dataFirst', 0);
    fixture.componentRef.setInput('data', makeRows(0, 6));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table.selectedRows()).toEqual([makeRows(0, 6)[1]]);
    expect(
      fixture.nativeElement
        .querySelector('[data-neu-table-logical-index="1"]')
        ?.classList.contains('neu-table__row--selected'),
    ).toBe(true);
    expect(selectionChanges).toHaveLength(1);
  });

  it('uses logical indexes for row selection policy and row events', async () => {
    const fixture = createLazyTable(makeRows(500, 6));
    const selectable = vi.fn((_row: LazyRow, index: number) => index === 501);
    fixture.componentRef.setInput('dataFirst', 500);
    fixture.componentRef.setInput('selectionMode', 'multiple');
    fixture.componentRef.setInput('rowSelectable', selectable);
    fixture.detectChanges();
    await fixture.whenStable();
    const selected: number[] = [];
    fixture.componentInstance.rowSelect.subscribe((event) => selected.push(event.index));

    fixture.componentInstance.toggleRow(fixture.componentInstance.data()[1] as LazyRow, 'checkbox');

    expect(selectable).toHaveBeenCalledWith(expect.objectContaining({ id: 501 }), 501);
    expect(selected).toEqual([501]);
    expect(fixture.componentInstance.visibleRowNumber(500)).toBe(501);
  });

  it('resets query and range as one lazy request and suppresses the paginator', async () => {
    const fixture = createLazyTable(makeRows(97, 9));
    fixture.componentRef.setInput('dataFirst', 97);
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    table.onTableScroll({ target: { scrollTop: 44 + 100 * 40 } } as unknown as Event);
    const beforeSort = requests.length;

    table.sortBy('name');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(requests).toHaveLength(beforeSort + 1);
    expect(requests.at(-1)).toMatchObject({
      reason: 'query',
      query: { sort: { key: 'name', dir: 'asc' } },
      range: { first: 0, end: 6, visibleFirst: 0, visibleEnd: 3 },
    });
    expect(fixture.nativeElement.querySelector('.neu-table__footer')).toBeNull();
    table.goToPage(2);
    expect(table.currentPage()).toBe(1);
  });

  it('clamps a shrunk total with at most one corrected request and does not reset on growth', async () => {
    const fixture = createLazyTable();
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    table.onTableScroll({ target: { scrollTop: 44 + 9000 * 40 } } as unknown as Event);

    const beforeShrink = requests.length;
    fixture.componentRef.setInput('totalItems', 20);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(requests).toHaveLength(beforeShrink + 1);
    expect(requests.at(-1)).toMatchObject({
      reason: 'total-change',
      range: { visibleFirst: 17, visibleEnd: 20 },
    });

    fixture.componentRef.setInput('totalItems', 100_000);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(requests).toHaveLength(beforeShrink + 1);
  });

  it('renders a zero total without phantom slots and emits one empty initial request', async () => {
    const fixture = createLazyTable([]);
    fixture.componentRef.setInput('totalItems', 0);
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(requests).toHaveLength(1);
    expect(requests[0].range).toEqual({ first: 0, end: 0, visibleFirst: 0, visibleEnd: 0 });
    expect((fixture.componentInstance as any)._virtualSlots()).toEqual([]);
    expect((fixture.componentInstance as any)._virtualBottomSpacerHeight()).toBe(0);
    expect(fixture.nativeElement.querySelector('.neu-table__empty')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.neu-table__row--placeholder')).toBeNull();
  });

  it('does not emit a corrected request when a smaller total still contains the viewport', async () => {
    const fixture = createLazyTable();
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentRef.setInput('totalItems', 100);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(requests).toHaveLength(1);
  });

  it('disables variable-height expansion, keeps selection keys, normalizes focus, and cancels an unloaded edit', async () => {
    const fixture = createLazyTable();
    const editableColumn = { ...COLUMNS[1], editable: true } satisfies NeuTableColumn<LazyRow>;
    fixture.componentRef.setInput('columns', [
      COLUMNS[0],
      editableColumn,
    ] satisfies NeuTableColumn<LazyRow>[]);
    fixture.componentRef.setInput('selectionMode', 'multiple');
    fixture.componentRef.setInput('expandable', true);
    fixture.componentRef.setInput('inlineEdit', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const firstRow = table.data()[0] as LazyRow;

    table.toggleRow(firstRow, 'checkbox');
    table.expandRow(firstRow);
    table.startCellEdit(firstRow, editableColumn);
    table.toggleAll();
    fixture.detectChanges();
    await fixture.whenStable();
    expect((table as any)._expansionEnabled()).toBe(false);
    expect(table.isRowExpanded(firstRow)).toBe(false);
    expect(table.isEditingCell(firstRow, editableColumn)).toBe(true);
    expect(table.selectedCount()).toBe(6);

    table.onTableScroll({ target: { scrollTop: 44 + 100 * 40 } } as unknown as Event);
    fixture.componentRef.setInput('dataFirst', 97);
    fixture.componentRef.setInput('data', makeRows(97, 9));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(table.isRowExpanded(firstRow)).toBe(false);
    expect(table.isEditingCell(firstRow, editableColumn)).toBe(false);
    expect((table as any)._keyboardController.focusedKey()).toBe(97);
    expect(table.selectedCount()).toBe(6);
  });

  it('preserves authoritative expansion keys while sparse UI remains inert', async () => {
    const fixture = createLazyTable();
    fixture.componentRef.setInput('expandable', true);
    fixture.componentRef.setInput('expandedRowKeys', [0, 'off-page']);
    const changes: Array<readonly unknown[]> = [];
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.expandedRowKeysChange.subscribe((event) => changes.push(event));
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const firstRow = table.data()[0] as LazyRow;

    expect((table as any)._expansionEnabled()).toBe(false);
    expect((table as any)._state.expansionKeys()).toEqual(new Set([0, 'off-page']));
    expect(table.isRowExpanded(firstRow)).toBe(true);
    expect(fixture.nativeElement.querySelector('.neu-table__row-expand-detail')).toBeNull();
    expect(requests).toHaveLength(1);

    table.toggleExpand(firstRow);
    table.expandRow(firstRow);
    table.collapseRow(firstRow);
    expect(changes).toEqual([]);
    expect(requests).toHaveLength(1);
    expect((table as any)._state.expansionKeys()).toEqual(new Set([0, 'off-page']));
  });

  it('preserves preloaded virtual behavior when dataFirst is absent', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<LazyRow>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', makeRows(0, 20));
    fixture.componentRef.setInput('serverSide', true);
    fixture.componentRef.setInput('totalItems', 100_000);
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualScrollVisibleItems', 3);
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));
    fixture.detectChanges();
    await fixture.whenStable();

    expect((fixture.componentInstance as any)._lazyVirtualActive()).toBe(false);
    expect((fixture.componentInstance as any)._logicalTotalItems()).toBe(20);
    expect((fixture.componentInstance as any)._virtualRange()).toMatchObject({ first: 0, end: 6 });
    expect((fixture.componentInstance as any)._virtualSlots()).toEqual([]);
    (fixture.componentInstance as any)._emitLazyRequest('scroll');
    expect(requests).toEqual([]);
    expect(fixture.nativeElement.querySelector('.neu-table__row--placeholder')).toBeNull();
  });

  it('snapshots the supplied window container while retaining row identities', async () => {
    const rows = makeRows(0, 6);
    const fixture = createLazyTable(rows);
    fixture.detectChanges();
    await fixture.whenStable();
    const snapshot = (fixture.componentInstance as any)._rows();

    rows.push({ id: 99, name: 'Late mutation' });

    expect((fixture.componentInstance as any)._rows()).toBe(snapshot);
    expect(snapshot).toHaveLength(6);
    expect(snapshot[0]).toBe(rows[0]);
  });
});
