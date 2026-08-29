import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NeuTableComponent } from './neu-table.component';
import { NeuTableCellEditorDirective } from './neu-table-templates.directive';
import type { NeuTableColumn, NeuTableLazyRequest } from './neu-table.types';

interface Row {
  meta: { id: number; team: { code: string } };
  name: string;
  score: number;
}

const ROWS: Row[] = [
  { meta: { id: 1, team: { code: 'A' } }, name: 'Ada', score: 2 },
  { meta: { id: 2, team: { code: 'B' } }, name: 'Grace', score: 1 },
  { meta: { id: 3, team: { code: 'A' } }, name: 'Linus', score: 3 },
];

const COLUMNS: NeuTableColumn<Row, string>[] = [
  { key: 'name', header: 'Name', sortable: true, filterable: true, editable: true },
  { key: 'score', header: 'Score', sortable: true, editable: true },
];

@Component({
  imports: [NeuTableComponent, NeuTableCellEditorDirective],
  template: `
    <neu-table
      [columns]="columns"
      [data]="rows"
      [pagination]="false"
      [searchable]="false"
      editMode="cell"
      rowKey="meta.id"
    >
      <ng-template neuTableCellEditor="name" let-value>
        <button class="fallback" type="button">Fallback</button>
        <input class="preferred" [value]="value" />
      </ng-template>
    </neu-table>
  `,
})
class EditorHost {
  readonly rows = ROWS;
  readonly columns: NeuTableColumn<Row, string>[] = [
    { ...COLUMNS[0], editorFocusSelector: '.preferred' },
    COLUMNS[1],
  ];
}

describe('NeuTable G01-G16 final parity integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideZonelessChangeDetection(),
        provideIcons({ lucidePencil }),
      ],
    }).compileComponents();
  });

  function createTable(rows: readonly Row[] = ROWS) {
    const fixture = TestBed.createComponent(NeuTableComponent<Row>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('searchable', false);
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: false,
    });
    fixture.detectChanges();
    return fixture;
  }

  it('keeps nested/computed identity coherent across immutable selection and expansion', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('rowKey', 'meta.id');
    fixture.componentRef.setInput('selectable', 'multiple');
    fixture.componentRef.setInput('expandMode', true ? 'multiple' : 'none');
    fixture.detectChanges();
    const table = fixture.componentInstance;
    table.selectRow(ROWS[0]);
    table.expandRow(ROWS[0]);
    const replacement = ROWS.map((row) => ({ ...row, meta: { ...row.meta } }));
    fixture.componentRef.setInput('data', replacement);
    fixture.detectChanges();
    expect(table.isRowSelected(replacement[0])).toBe(true);
    expect(table.isRowExpanded(replacement[0])).toBe(true);

    fixture.componentRef.setInput('rowKey', (row: Row) => `row:${row.meta.id}`);
    fixture.detectChanges();
    table.clearSelection();
    table.selectRow(replacement[1]);
    expect(table.isRowSelected(replacement[1])).toBe(true);

    const tracked = vi.fn((index: number, row: Row) => `${index}:${row.meta.id}`);
    fixture.componentRef.setInput('rowTrackBy', tracked);
    fixture.detectChanges();
    expect(tracked).toHaveBeenCalledWith(0, replacement[0]);
  });

  it('supports equals and deepEquals selection without changing canonical row identity', () => {
    const equals = createTable();
    equals.componentRef.setInput('selectable', 'multiple');
    equals.componentRef.setInput('compareSelectionBy', 'equals');
    equals.detectChanges();
    equals.componentInstance.selectRow(ROWS[0]);
    expect(equals.componentInstance.isRowSelected(ROWS[0])).toBe(true);
    expect(equals.componentInstance.isRowSelected({ ...ROWS[0] })).toBe(false);

    const deep = createTable();
    deep.componentRef.setInput('selectable', 'multiple');
    deep.componentRef.setInput('rowKey', 'missing');
    deep.componentRef.setInput('compareSelectionBy', 'deepEquals');
    deep.detectChanges();
    deep.componentInstance.selectRow(ROWS[0]);
    expect(deep.componentInstance.isRowSelected(JSON.parse(JSON.stringify(ROWS[0])) as Row)).toBe(
      true,
    );
    expect(deep.componentInstance.getRowKey(ROWS[0])).toBe(
      deep.componentInstance.getRowKey({ ...ROWS[0] }),
    );
  });

  it('keeps deep selection coherent for explicit path/function identity and safe key fallbacks', () => {
    const fixture = createTable();
    const table = fixture.componentInstance;
    fixture.componentRef.setInput('selectable', 'multiple');
    fixture.componentRef.setInput('compareSelectionBy', 'deepEquals');
    fixture.componentRef.setInput('rowKey', 'meta.id');
    fixture.detectChanges();
    table.selectRow(ROWS[0]);
    expect(table.isRowSelected({ ...ROWS[0], meta: { ...ROWS[0].meta } })).toBe(true);

    fixture.componentRef.setInput('rowKey', (row: Row) => ({ id: row.meta.id }));
    fixture.detectChanges();
    table.clearSelection();
    table.selectRow(ROWS[1]);
    expect(table.isRowSelected({ ...ROWS[1], meta: { ...ROWS[1].meta } })).toBe(true);

    fixture.componentRef.setInput('rowKey', undefined);
    fixture.componentRef.setInput('rowKey', 'missing');
    fixture.detectChanges();
    expect(table.getRowKey(ROWS[0])).toContain('"name":"Ada"');
    const cyclic = { meta: { id: 4, team: { code: 'C' } }, name: 'Cycle', score: 4 } as Row & {
      self?: unknown;
    };
    cyclic.self = cyclic;
    expect(typeof table.getRowKey(cyclic)).toBe('symbol');
    expect(table.getRowKey(cyclic)).toBe(table.getRowKey(cyclic));

    const globalValues = (
      table as unknown as {
        _globalColumnValues(row: Row, column: NeuTableColumn<Row, string>): readonly unknown[];
      }
    )._globalColumnValues.bind(table);
    expect(globalValues(ROWS[0], COLUMNS[0])).toEqual(['Ada']);
    expect(globalValues(ROWS[0], { ...COLUMNS[0], cell: () => 'Rendered' })).toEqual([
      'Rendered',
      'Ada',
    ]);
    expect(
      globalValues(ROWS[0], {
        ...COLUMNS[0],
        type: 'badge',
        badgeMap: { Ada: { label: 'Active', variant: 'success' } },
      }),
    ).toEqual(['Active', 'Ada']);
    expect(
      (
        table as unknown as {
          bodyContext(
            row: Row,
            rowIndex: number,
            logicalIndex: number,
            frozen: boolean,
          ): {
            group: unknown;
          };
        }
      ).bodyContext(ROWS[0], 0, 0, true).group,
    ).toBeNull();
  });

  it('uses defaultSortOrder and can preserve the current page on sort', () => {
    const fixture = createTable();
    fixture.componentRef.setInput('pagination', true);
    fixture.componentRef.setInput('pageSize', 1);
    fixture.componentRef.setInput('sortable', true);
    fixture.componentRef.setInput('defaultSortOrder', -1);
    fixture.componentRef.setInput('resetPageOnSort', false);
    fixture.detectChanges();
    fixture.componentInstance.goToPage(2);
    fixture.componentInstance.sortBy('score');
    expect(fixture.componentInstance.currentSort()).toEqual([{ key: 'score', dir: 'desc' }]);
    expect(fixture.componentInstance.currentPage()).toBe(2);

    const normalize = (
      fixture.componentInstance as unknown as {
        _normalizeSortState(
          entries: readonly ({ key: string; dir: 'asc' | 'desc' } | null | undefined)[],
          multiple: boolean,
        ): readonly { key: string; dir: 'asc' | 'desc' }[];
      }
    )._normalizeSortState.bind(fixture.componentInstance);
    expect(
      normalize(
        [
          undefined,
          null,
          { key: '', dir: 'asc' },
          { key: 'score', dir: 'asc' },
          { key: 'score', dir: 'desc' },
        ],
        true,
      ),
    ).toEqual([{ key: 'score', dir: 'asc' }]);
  });

  it('coalesces filter delay and commits enter-driven inline filters once', () => {
    vi.useFakeTimers();
    const fixture = createTable();
    fixture.componentRef.setInput('searchable', true);
    fixture.componentRef.setInput('filterOptions', {
      ...fixture.componentInstance.filterOptions(),
      delay: 25,
    });
    fixture.detectChanges();
    const table = fixture.componentInstance;
    table.onSearch({ target: { value: 'A' } } as unknown as Event);
    table.onSearch({ target: { value: 'Ada' } } as unknown as Event);
    expect(table.searchQuery()).toBe('');
    vi.advanceTimersByTime(25);
    expect(table.searchQuery()).toBe('Ada');

    table.clearSearch();
    table.columnFilterControl('name').setValue('Grace');
    vi.advanceTimersByTime(25);
    expect(table.filteredData()).toHaveLength(1);
    fixture.componentRef.setInput('filterOptions', {
      ...fixture.componentInstance.filterOptions(),
      on: 'enter',
    });
    fixture.detectChanges();
    table.columnFilterControl('name').setValue('Linus');
    vi.advanceTimersByTime(25);
    expect(table.filteredData()[0].name).toBe('Grace');
    const inline = fixture.nativeElement.querySelector(
      '.neu-table__filter-row neu-input',
    ) as HTMLElement;
    inline.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    vi.advanceTimersByTime(25);
    expect(table.filteredData()[0].name).toBe('Linus');
    vi.useRealTimers();
  });

  it('groups by nested paths and computed accessors', () => {
    const fixture = createTable();
    fixture.componentRef.setInput('groupBy', 'meta.team.code');
    fixture.detectChanges();
    expect(fixture.componentInstance.visibleGroups().map((group) => group.key)).toEqual(['A', 'B']);
    fixture.componentRef.setInput('groupBy', (row: Row) => row.name.length);
    fixture.detectChanges();
    expect(fixture.componentInstance.visibleGroups().map((group) => group.key)).toEqual([3, 5]);
  });

  it('focuses the configured editor target and traverses vertically while guarding text arrows', async () => {
    const fixture = TestBed.createComponent(EditorHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const firstCell = fixture.nativeElement.querySelector(
      '[data-neu-table-edit-row="0"][data-neu-table-edit-column="name"]',
    ) as HTMLElement;
    firstCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    const preferred = fixture.nativeElement.querySelector('.preferred') as HTMLInputElement;
    expect(document.activeElement).toBe(preferred);
    preferred.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-neu-table-editing="true"]')?.dataset[
        'neuTableEditRow'
      ],
    ).toBe('0');
    preferred.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('[data-neu-table-editing="true"]')?.dataset[
        'neuTableEditRow'
      ],
    ).toBe('1');
    const secondPreferred = fixture.nativeElement.querySelector('.preferred') as HTMLInputElement;
    secondPreferred.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('[data-neu-table-editing="true"]')?.dataset[
        'neuTableEditRow'
      ],
    ).toBe('0');
  });

  it('falls back safely when a custom editor focus selector is invalid', async () => {
    const fixture = TestBed.createComponent(EditorHost);
    fixture.componentInstance.columns[0].editorFocusSelector = '[';
    fixture.detectChanges();
    await fixture.whenStable();
    const cell = fixture.nativeElement.querySelector(
      '[data-neu-table-edit-row="0"][data-neu-table-edit-column="name"]',
    ) as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.preferred'));
  });

  it('exposes flex viewport/raw scrolling and blocks disabled row context menus', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('scrollHeight', 'flex');
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualizationOptions', {
      ...fixture.componentInstance.virtualizationOptions(),
      visibleItems: 1,
    });
    const openAt = vi.fn();
    fixture.componentRef.setInput('contextMenu', { openAt } as never);
    fixture.componentRef.setInput('contextMenuRowDisabled', (row: Row) => row.meta.id === 1);
    const scrollEvents: unknown[] = [];
    fixture.componentInstance.virtualScrollEvent.subscribe((event) => scrollEvents.push(event));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.neu-table-container--flex-scroll')).toBeTruthy();
    const container = fixture.nativeElement.querySelector(
      '.neu-table__scroll-container',
    ) as HTMLElement;
    Object.defineProperty(container, 'scrollTop', {
      value: 40,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(container, 'scrollLeft', {
      value: 7,
      configurable: true,
      writable: true,
    });
    container.dispatchEvent(new Event('scroll'));
    expect(scrollEvents.at(-1)).toMatchObject({ scrollTop: 40, scrollLeft: 7 });
    const rows = fixture.nativeElement.querySelectorAll(
      '.neu-table__row[data-neu-table-logical-index]',
    );
    const disabledPointerEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });
    rows[0].dispatchEvent(disabledPointerEvent);
    expect(openAt).not.toHaveBeenCalled();
    expect(disabledPointerEvent.defaultPrevented).toBe(true);
    const disabledKeyboardEvent = new KeyboardEvent('keydown', {
      key: 'F10',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    rows[0].dispatchEvent(disabledKeyboardEvent);
    expect(openAt).not.toHaveBeenCalled();
    expect(disabledKeyboardEvent.defaultPrevented).toBe(true);
    rows[1].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 2, clientY: 3 }));
    expect(openAt).toHaveBeenCalledOnce();
  });

  it('keeps fixed viewport CSS independent from auto-sized logical rows', async () => {
    const fixture = createTable();
    fixture.componentRef.setInput('scrollHeight', '18rem');
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualizationOptions', {
      autoSize: true,
      visibleItems: 2,
      itemSize: 40,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    expect(table._scrollContainerMaxHeight()).toBe('18rem');
    expect(table._virtualItemSize()).toBe(40);
    expect(table._virtualVisibleItems()).toBe(2);

    const container = fixture.nativeElement.querySelector(
      '.neu-table__scroll-container',
    ) as HTMLElement;
    const header = container.querySelector('.neu-table__head') as HTMLElement;
    Object.defineProperty(container, 'clientHeight', { value: 220, configurable: true });
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({
      height: 60,
    } as DOMRect);
    (
      table as unknown as {
        _measureViewportGeometry(
          container: HTMLElement,
          header: HTMLElement | null,
          frozen: readonly HTMLElement[],
        ): void;
      }
    )._measureViewportGeometry(container, header, []);
    expect(table._virtualVisibleItems()).toBe(4);
    expect(table._virtualHeaderHeight()).toBe(60);

    const ignored = document.createElement('tr');
    const firstFrozen = document.createElement('tr');
    firstFrozen.dataset['neuTableFrozenStack'] = 'frozen:1';
    const secondFrozen = document.createElement('tr');
    secondFrozen.dataset['neuTableFrozenStack'] = 'frozen:2';
    vi.spyOn(firstFrozen, 'getBoundingClientRect').mockReturnValue({ height: 36 } as DOMRect);
    vi.spyOn(secondFrozen, 'getBoundingClientRect').mockReturnValue({ height: 52 } as DOMRect);
    const measure = (
      table as unknown as {
        _measureViewportGeometry(
          container: HTMLElement,
          header: HTMLElement | null,
          frozen: readonly HTMLElement[],
        ): void;
      }
    )._measureViewportGeometry.bind(table);
    measure(container, header, [ignored, firstFrozen, secondFrozen]);
    const frozenRowTop = (
      table as unknown as { frozenRowTop(stackKey: string): number }
    ).frozenRowTop.bind(table);
    expect(frozenRowTop('frozen:1')).toBe(60);
    expect(frozenRowTop('frozen:2')).toBe(96);
    measure(container, header, [ignored, firstFrozen, secondFrozen]);
  });

  it('emits raw scroll only for real virtual DOM scrolls and never for restoration', async () => {
    const fixture = createTable(ROWS.slice(0, 2));
    const table = fixture.componentInstance;
    const events: unknown[] = [];
    table.virtualScrollEvent.subscribe((event) => events.push(event));
    const target = { scrollTop: 24, scrollLeft: 3 } as HTMLElement;
    table.onTableScroll({ target } as unknown as Event);
    expect(events).toHaveLength(0);

    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualizationOptions', {
      ...fixture.componentInstance.virtualizationOptions(),
      visibleItems: 1,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    table.scrollToIndex(1);
    expect(events).toHaveLength(0);
    table.onTableScroll({ target } as unknown as Event);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ scrollTop: 24, scrollLeft: 3 });
  });

  it('guards arrow-owning editor controls without suppressing table navigation elsewhere', () => {
    const fixture = createTable();
    const ownsArrow = (
      fixture.componentInstance as unknown as {
        _editorOwnsArrow(event: KeyboardEvent): boolean;
      }
    )._editorOwnsArrow.bind(fixture.componentInstance);
    const event = (target: EventTarget | null, key: string) =>
      ({ target, key }) as unknown as KeyboardEvent;

    expect(ownsArrow(event(null, 'ArrowLeft'))).toBe(false);
    expect(ownsArrow(event(document.createElement('textarea'), 'ArrowDown'))).toBe(true);
    expect(ownsArrow(event(document.createElement('select'), 'ArrowLeft'))).toBe(true);
    for (const role of ['listbox', 'slider', 'spinbutton']) {
      const control = document.createElement('div');
      control.setAttribute('role', role);
      expect(ownsArrow(event(control, 'ArrowRight'))).toBe(true);
    }
    const editable = document.createElement('div');
    Object.defineProperty(editable, 'isContentEditable', { value: true });
    expect(ownsArrow(event(editable, 'ArrowUp'))).toBe(true);
    const combo = document.createElement('div');
    combo.setAttribute('role', 'combobox');
    expect(ownsArrow(event(combo, 'ArrowUp'))).toBe(true);
    expect(ownsArrow(event(combo, 'ArrowLeft'))).toBe(false);
    const number = document.createElement('input');
    number.type = 'number';
    expect(ownsArrow(event(number, 'ArrowDown'))).toBe(true);
    const range = document.createElement('input');
    range.type = 'range';
    expect(ownsArrow(event(range, 'ArrowDown'))).toBe(true);
    const text = document.createElement('input');
    expect(ownsArrow(event(text, 'ArrowLeft'))).toBe(true);
    expect(ownsArrow(event(text, 'ArrowDown'))).toBe(false);
    expect(ownsArrow(event(document.createElement('button'), 'ArrowDown'))).toBe(false);

    const adjacent = (
      fixture.componentInstance as unknown as {
        _adjacentEditableCell(
          row: Row,
          column: NeuTableColumn<Row, string>,
          intent: 'previous' | 'next' | 'left' | 'right' | 'up' | 'down',
        ): { row: Row; column: NeuTableColumn<Row, string> } | null;
      }
    )._adjacentEditableCell.bind(fixture.componentInstance);
    expect(adjacent(ROWS[0], COLUMNS[0], 'left')).toBeNull();
    expect(adjacent(ROWS[0], COLUMNS[0], 'previous')).toBeNull();
    expect(adjacent(ROWS[0], COLUMNS[0], 'right')?.column.key).toBe('score');
    expect(adjacent(ROWS[0], COLUMNS[0], 'next')?.column.key).toBe('score');
    expect(adjacent(ROWS[0], COLUMNS[0], 'up')).toBeNull();
    expect(adjacent(ROWS[0], COLUMNS[0], 'down')?.row).toBe(ROWS[1]);
    expect(adjacent({ ...ROWS[0] }, COLUMNS[0], 'down')).toBeNull();
  });

  it('accepts Enter only for inline text/number policies and ignores repeat/non-Enter keys', () => {
    const fixture = createTable();
    const table = fixture.componentInstance;
    fixture.componentRef.setInput('filterOptions', {
      ...fixture.componentInstance.filterOptions(),
      on: 'enter',
    });
    fixture.detectChanges();
    const commit = (
      table as unknown as {
        commitInlineFilterOnEnter(column: NeuTableColumn<Row, string>, event: Event): void;
      }
    ).commitInlineFilterOnEnter.bind(table);
    const enter = (key = 'Enter', repeat = false) => ({ key, repeat }) as KeyboardEvent;
    const isEnterDriven = (
      table as unknown as {
        _isEnterDrivenFilter(column: NeuTableColumn<Row, string>): boolean;
      }
    )._isEnterDrivenFilter.bind(table);

    expect(isEnterDriven(COLUMNS[0])).toBe(true);
    expect(isEnterDriven({ ...COLUMNS[0], filterType: 'number-range' })).toBe(true);
    expect(isEnterDriven({ ...COLUMNS[0], filterType: 'select' })).toBe(false);
    expect(isEnterDriven({ ...COLUMNS[0], filterable: false })).toBe(false);

    table.columnFilterControl('name').setValue('Ada');
    commit(COLUMNS[0], enter('Escape'));
    commit(COLUMNS[0], enter('Enter', true));
    expect(table.filteredData()).toHaveLength(ROWS.length);
    commit(COLUMNS[0], enter());
    expect(table.filteredData()).toEqual([ROWS[0]]);

    table.clearColumnFilters();
    const selectColumn: NeuTableColumn<Row, string> = {
      key: 'name',
      header: 'Name',
      filterable: true,
      filterConfig: { kind: 'select', options: [{ label: 'Ada', value: 'Ada' }] },
    };
    commit(selectColumn, enter());
    expect(table.filteredData()).toHaveLength(ROWS.length);

    const textColumn: NeuTableColumn<Row, string> = {
      key: 'name',
      header: 'Name',
      filterable: true,
      filterConfig: { kind: 'text' },
    };
    const typedControl = (
      table as unknown as {
        typedColumnFilterControl(column: NeuTableColumn<Row, string>): {
          setValue(value: unknown): void;
        };
      }
    ).typedColumnFilterControl.bind(table);
    typedControl(textColumn).setValue('Grace');
    commit(textColumn, enter());
    expect(table.filteredData()).toEqual([ROWS[1]]);

    table.clearColumnFilters();
    const numberColumn: NeuTableColumn<Row, string> = {
      key: 'score',
      header: 'Score',
      filterable: true,
      filterConfig: { kind: 'number', mode: 'between' },
    };
    fixture.componentRef.setInput('columns', [COLUMNS[0], numberColumn]);
    fixture.detectChanges();
    const rangeControls = table as unknown as {
      typedRangeStartControl(column: NeuTableColumn<Row, string>): {
        setValue(value: number): void;
      };
      typedRangeEndControl(column: NeuTableColumn<Row, string>): { setValue(value: number): void };
    };
    rangeControls.typedRangeStartControl(numberColumn).setValue(1);
    rangeControls.typedRangeEndControl(numberColumn).setValue(2);
    commit(numberColumn, enter());
    expect(table.filteredData()).toEqual(ROWS.slice(0, 2));

    fixture.componentRef.setInput('filterOptions', {
      ...fixture.componentInstance.filterOptions(),
      on: 'input',
    });
    fixture.detectChanges();
    const beforeIgnoredEnter = table.filteredData();
    commit(COLUMNS[0], enter());
    expect(table.filteredData()).toEqual(beforeIgnoredEnter);
  });

  it('retains sparse append-only intervals and requests an independent step', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<Row>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS.slice(0, 1));
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('searchable', false);
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: false,
    });
    fixture.componentRef.setInput('serverSide', true);
    fixture.componentRef.setInput('dataFirst', 0);
    fixture.componentRef.setInput('totalItems', 10_000);
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualizationOptions', {
      visibleItems: 2,
      itemSize: 40,
      overscan: 1,
      appendOnly: true,
      step: 20,
    });
    fixture.componentRef.setInput('lazyLoadOnInit', true);
    const requests: NeuTableLazyRequest[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => requests.push(event));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(requests[0].range).toMatchObject({ first: 0, end: 20 });
    fixture.componentInstance.scrollToIndex(5_000);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(requests.at(-1)?.range).toMatchObject({ first: 5_000, end: 5_020 });
    const retainedRows = fixture.nativeElement.querySelectorAll(
      '.neu-table__row, .neu-table__row--placeholder',
    );
    expect(retainedRows.length).toBeLessThan(20);
    fixture.componentRef.setInput('virtualizationOptions', {
      ...fixture.componentInstance.virtualizationOptions(),
      appendOnly: false,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelectorAll('.neu-table__row--placeholder').length,
    ).toBeLessThanOrEqual(4);
  });
});
