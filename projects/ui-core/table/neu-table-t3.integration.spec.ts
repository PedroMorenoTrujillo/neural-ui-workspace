import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  NeuContextMenuDirective,
  type NeuContextMenuItem,
} from '../context-menu/neu-context-menu.component';
import { NeuTableComponent } from './neu-table.component';
import {
  NeuTableCellViewDirective,
  NeuTableGroupFooterDirective,
  NeuTableHeaderGroupDirective,
} from './neu-table-templates.directive';
import type {
  NeuTableColumn,
  NeuTableColumnReorderEvent,
  NeuTableColumnResizeEvent,
  NeuTableContextMenuSelectEvent,
  NeuTableRowEditEvent,
  NeuTableRowReorderEvent,
} from './neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly team: string;
}

const FROZEN: readonly Row[] = Object.freeze([{ id: 0, name: 'Pinned', team: 'Core' }]);
const ROWS: readonly Row[] = Object.freeze([
  { id: 1, name: 'Ada', team: 'Platform' },
  { id: 2, name: 'Grace', team: 'Research' },
]);
const COLUMNS: readonly NeuTableColumn<Row>[] = Object.freeze([
  { key: 'name', header: 'Name', editable: true, minWidth: 100, maxWidth: 260 },
  { key: 'team', header: 'Team', minWidth: 90, maxWidth: 220 },
]);

@Component({
  imports: [
    NeuTableComponent,
    NeuTableCellViewDirective,
    NeuTableGroupFooterDirective,
    NeuTableHeaderGroupDirective,
    NeuContextMenuDirective,
  ],
  template: `
    <div [neuContextMenu]="menuItems" #rowMenu="neuContextMenu"></div>
    <neu-table
      [columns]="columns"
      [data]="rows"
      [frozenData]="frozenRows"
      [pagination]="false"
      [searchable]="false"
      selectable="multiple"
      expandMode="multiple"
      editMode="row"
      [resizableColumns]="true"
      [columnResizeMode]="'expand'"
      [reorderableColumns]="true"
      [reorderableRows]="true"
      [contextMenu]="rowMenu"
      [groupBy]="groupBy()"
      [expandableRowGroups]="expandableGroups()"
      [expandedGroupKeys]="expandedGroups()"
      [rowGroupMode]="rowGroupMode()"
      (selectionChange)="selections.push($event)"
      (expandedRowKeysChange)="expansions.push($event)"
      (rowEditInit)="edits.push($event)"
      (columnResize)="resizes.push($event)"
      (columnReorder)="columnReorders.push($event)"
      (rowReorder)="rowReorders.push($event)"
      (contextMenuSelectionChange)="contextSelections.push($event)"
      (contextMenuSelect)="contextEvents.push($event)"
    >
      <ng-template neuTableHeaderGroup let-columns="columns" let-column="column">
        <tr>
          <th [attr.colspan]="columns.length + 3">People</th>
        </tr>
        <tr>
          <th></th>
          <th></th>
          <th></th>
          @for (col of columns; track col.key) {
            <th
              class="custom-leaf"
              [attr.data-key]="col.key"
              [style.width]="column.width(col.key)"
              [attr.draggable]="column.draggable(col.key) ? 'true' : null"
              (pointerdown)="column.pointerDown(col.key, $any($event))"
              (dragstart)="column.dragStart(col.key, $any($event))"
              (dragover)="column.dragOver(col.key, $any($event))"
              (drop)="column.drop(col.key, $any($event))"
              (dragend)="column.dragEnd(col.key)"
            >
              {{ col.header }}
              @if (column.resizable(col.key)) {
                <button
                  type="button"
                  class="custom-resize"
                  (pointerdown)="column.resizeStart(col.key, $any($event))"
                  (dblclick)="column.resetWidth(col.key, $event)"
                ></button>
              }
            </th>
          }
        </tr>
      </ng-template>
      <ng-template neuTableCellView="name" let-row let-frozen="frozen">
        <span class="name-view" [attr.data-frozen]="frozen">{{ row['name'] }}</span>
      </ng-template>
      <ng-template neuTableGroupFooter let-group>{{ group.label }} footer</ng-template>
    </neu-table>
  `,
})
class T3Host {
  columns = COLUMNS;
  rows = ROWS;
  frozenRows = FROZEN;
  menuItems: NeuContextMenuItem[] = [{ key: 'open', label: 'Open row' }];
  selections: Row[][] = [];
  expansions: (readonly unknown[])[] = [];
  edits: NeuTableRowEditEvent<Row>[] = [];
  resizes: NeuTableColumnResizeEvent[] = [];
  columnReorders: NeuTableColumnReorderEvent[] = [];
  rowReorders: NeuTableRowReorderEvent<Row>[] = [];
  contextSelections: (Row | null)[] = [];
  contextEvents: NeuTableContextMenuSelectEvent<Row>[] = [];
  groupBy = signal('');
  expandableGroups = signal(false);
  expandedGroups = signal<readonly unknown[]>([]);
  rowGroupMode = signal<'subheader' | 'rowspan'>('subheader');
}

describe('NeuTable T3 integration', () => {
  afterEach(() =>
    document.querySelectorAll('.cdk-overlay-container').forEach((node) => node.remove()),
  );

  async function create() {
    await TestBed.configureTestingModule({
      imports: [NeuTableComponent, T3Host],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(T3Host);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('composes frozen rows with templates, selection, expansion and row editing', async () => {
    const fixture = await create();
    const host = fixture.componentInstance;
    const table = fixture.debugElement.query(By.directive(NeuTableComponent<Row>))
      .componentInstance as NeuTableComponent<Row>;
    const frozenRow = fixture.nativeElement.querySelector('[data-neu-table-frozen="true"]');

    expect(frozenRow).toBeTruthy();
    expect(frozenRow.querySelector('.name-view')?.getAttribute('data-frozen')).toBe('true');
    expect(fixture.nativeElement.querySelector('table')?.hasAttribute('aria-rowcount')).toBe(false);
    expect(frozenRow.hasAttribute('aria-rowindex')).toBe(false);

    table.toggleAll();
    expect(host.selections.at(-1)?.map((row) => row.id)).toEqual([0, 1, 2]);

    table.toggleExpand(FROZEN[0]);
    expect(host.expansions.at(-1)).toEqual([0]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-table__row-expand-detail')).toBeTruthy();

    table.startRowEdit(FROZEN[0] as never);
    expect(host.edits.at(-1)).toEqual(expect.objectContaining({ rowKey: 0, rowIndex: 0 }));
  });

  it('routes custom grouped-header resize and drag through one canonical layout lifecycle', async () => {
    const fixture = await create();
    const host = fixture.componentInstance;
    const leaves = fixture.nativeElement.querySelectorAll('.custom-leaf');
    const resize = leaves[0].querySelector('.custom-resize') as HTMLElement;

    resize.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10 }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 35 }));
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 35 }));
    fixture.detectChanges();

    expect(host.resizes).toHaveLength(1);
    expect(host.resizes[0]).toEqual(
      expect.objectContaining({ key: 'name', delta: 25, mode: 'expand' }),
    );

    leaves[1].dispatchEvent(new Event('dragstart', { bubbles: true, cancelable: true }));
    leaves[0].dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(host.columnReorders).toHaveLength(1);
    expect(host.columnReorders[0]).toEqual({
      columnKey: 'team',
      previousIndex: 1,
      currentIndex: 0,
      columns: ['team', 'name'],
    });
  });

  it('emits immutable row-order proposals and leaves consumer data untouched', async () => {
    const fixture = await create();
    const host = fixture.componentInstance;
    const down = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.getAttribute('aria-label')?.includes('down'),
    ) as HTMLButtonElement;

    down.click();

    expect(host.rowReorders).toHaveLength(1);
    expect(host.rowReorders[0]).toEqual(
      expect.objectContaining({ key: 1, previousIndex: 0, currentIndex: 1, scope: 'loaded' }),
    );
    expect(host.rowReorders[0].rows.map((row) => row.id)).toEqual([2, 1]);
    expect(host.rows.map((row) => row.id)).toEqual([1, 2]);
    expect(Object.isFrozen(host.rowReorders[0].rows)).toBe(true);
  });

  it('keeps context selection separate and restores row focus for pointer and keyboard invocation', async () => {
    const fixture = await create();
    const host = fixture.componentInstance;
    const regularRow = fixture.nativeElement.querySelectorAll('.neu-table__row')[1] as HTMLElement;
    const ordinarySelectionCount = host.selections.length;

    regularRow.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 20, clientY: 30 }),
    );
    await fixture.whenStable();

    expect(host.contextSelections.at(-1)?.id).toBe(1);
    expect(host.contextEvents.at(-1)).toEqual(expect.objectContaining({ row: ROWS[0], key: 1 }));
    expect(host.selections).toHaveLength(ordinarySelectionCount);
    expect(document.querySelector('[role="menuitem"]')).toBeTruthy();

    const menu = fixture.debugElement
      .query(By.directive(NeuContextMenuDirective))
      .injector.get(NeuContextMenuDirective);
    menu.close();
    expect(host.contextSelections.at(-1)).toBeNull();
    expect(document.activeElement).toBe(regularRow);

    const stopPropagation = vi.spyOn(Event.prototype, 'stopPropagation');
    regularRow.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true }),
    );
    expect(host.contextEvents.at(-1)?.originalEvent).toBeInstanceOf(KeyboardEvent);
    expect(stopPropagation).toHaveBeenCalled();
    stopPropagation.mockRestore();
  });

  it('executes the default header and row native drag listener lifecycle', async () => {
    const hostFixture = await create();
    hostFixture.destroy();
    const fixture = TestBed.createComponent(NeuTableComponent);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', [
      ...ROWS,
      { id: 3, name: 'Katherine', team: 'Research' },
    ]);
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('searchable', false);
    fixture.componentRef.setInput('resizableColumns', true);
    fixture.componentRef.setInput('columnResizeMode', 'expand');
    fixture.componentRef.setInput('reorderableColumns', true);
    fixture.componentRef.setInput('reorderableRows', true);
    const columnEvents: NeuTableColumnReorderEvent[] = [];
    const rowEvents: NeuTableRowReorderEvent<any>[] = [];
    fixture.componentInstance.columnReorder.subscribe((event) => columnEvents.push(event));
    fixture.componentInstance.rowReorder.subscribe((event) => rowEvents.push(event));
    fixture.detectChanges();
    await fixture.whenStable();

    const headers = fixture.nativeElement.querySelectorAll('[data-neu-table-column-key]');
    headers[1].dispatchEvent(new Event('dragstart', { bubbles: true, cancelable: true }));
    headers[0].dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
    headers[0].dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
    headers[1].dispatchEvent(new Event('dragend', { bubbles: true }));
    expect(columnEvents).toHaveLength(1);

    const resize = headers[0].querySelector('.neu-table__resize-handle') as HTMLElement;
    resize.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 20 }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 30 }));
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 30 }));

    const rows = fixture.nativeElement.querySelectorAll('.neu-table__row');
    const handle = rows[0].querySelector('[data-neu-table-row-reorder-handle]') as HTMLElement;
    handle.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    rows[0].dispatchEvent(new Event('dragstart', { bubbles: true, cancelable: true }));
    rows[2].dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
    rows[2].dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
    rows[0].dispatchEvent(new Event('dragend', { bubbles: true }));

    expect(rowEvents).toHaveLength(1);
    expect(rowEvents[0].rows.map((row) => row['id'])).toEqual([2, 1, 3]);
  });

  it('covers disabled, boundary, RTL and frozen/group interaction policy branches', async () => {
    const fixture = await create();
    const tableDebug = fixture.debugElement.query(By.directive(NeuTableComponent));
    const table = tableDebug.componentInstance as any;
    const column = table['structuralContext']().column;
    const inertEvent = {
      target: null,
      currentTarget: document.createElement('th'),
      clientX: 0,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      composedPath() {
        return [this.target, this.currentTarget];
      },
    };

    expect(column.width('missing')).toBeNull();
    expect(column.resizable('missing')).toBe(false);
    expect(column.draggable('missing')).toBe(false);
    column.pointerDown('missing', inertEvent);
    column.resizeStart('missing', inertEvent);
    column.dragStart('missing', inertEvent);
    column.dragOver('missing', inertEvent);
    column.drop('missing', inertEvent);
    column.dragEnd('missing');

    const interactive = document.createElement('button');
    const disabledDrag = { ...inertEvent, target: interactive, preventDefault: vi.fn() };
    table.onColumnDragStart(COLUMNS[0], disabledDrag);
    expect(disabledDrag.preventDefault).toHaveBeenCalled();
    table.onColumnDragOver(COLUMNS[0], inertEvent);
    table.onColumnDrop(COLUMNS[0], inertEvent);
    const resizeTarget = document.createElement('button');
    resizeTarget.className = 'neu-table__resize-handle';
    table.onColumnPointerDown(COLUMNS[0], { target: resizeTarget });
    table.onColumnPointerDown(COLUMNS[0], { target: document.createElement('span') });

    const target = document.createElement('th');
    target.style.direction = 'rtl';
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 40,
      width: 200,
      height: 40,
      toJSON: () => ({}),
    });
    const transfer = {
      effectAllowed: 'none',
      dropEffect: 'none',
      setData: vi.fn(),
    };
    table.onColumnDragStart(COLUMNS[1], {
      ...inertEvent,
      target,
      currentTarget: target,
      dataTransfer: transfer,
    });
    table.onColumnDragOver(COLUMNS[0], {
      ...inertEvent,
      currentTarget: target,
      clientX: 20,
      dataTransfer: transfer,
    });
    expect(transfer.dropEffect).toBe('move');
    table.onColumnDragEnd(COLUMNS[1]);

    expect(table['canReorderRow'](ROWS[0], true)).toBe(false);
    expect(table['canMoveRow'](ROWS[0], -1)).toBe(false);
    expect(table['canMoveRow'](ROWS[1], 1)).toBe(false);
    table['moveRow'](ROWS[0], -1);

    const rowElement = document.createElement('tr');
    const plainTarget = document.createElement('span');
    table.onRowPointerDown(ROWS[0], false, {
      target: plainTarget,
      currentTarget: rowElement,
    });
    expect(rowElement.draggable).toBe(false);
    const deniedRowDrag = { ...inertEvent, preventDefault: vi.fn() };
    table.onRowDragStart(ROWS[0], false, deniedRowDrag);
    expect(deniedRowDrag.preventDefault).toHaveBeenCalled();
    table.onRowDragOver(ROWS[0], true, inertEvent);
    table.onRowDrop(ROWS[0], true, inertEvent);
    table.onRowDragEnd({ currentTarget: rowElement });

    const dragHandle = document.createElement('button');
    dragHandle.setAttribute('data-neu-table-row-reorder-handle', 'true');
    rowElement.append(dragHandle);
    table.onRowPointerDown(ROWS[0], false, {
      target: dragHandle,
      currentTarget: rowElement,
    });
    const rowTransfer = {
      effectAllowed: 'none',
      dropEffect: 'none',
      setData: vi.fn(),
    };
    table.onRowDragStart(ROWS[0], false, {
      ...inertEvent,
      currentTarget: rowElement,
      dataTransfer: rowTransfer,
    });
    table.onRowDragOver(ROWS[0], false, inertEvent);
    table.onRowDragOver(ROWS[1], true, inertEvent);
    vi.spyOn(rowElement, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
      toJSON: () => ({}),
    });
    table.onRowDragOver(ROWS[1], false, {
      ...inertEvent,
      currentTarget: rowElement,
      clientY: 90,
      dataTransfer: rowTransfer,
    });
    expect(rowTransfer.dropEffect).toBe('move');
    table.onRowDrop(ROWS[1], false, {
      ...inertEvent,
      currentTarget: rowElement,
      dataTransfer: rowTransfer,
    });
    expect(rowElement.draggable).toBe(false);

    fixture.componentInstance.groupBy.set('team');
    fixture.componentInstance.expandableGroups.set(true);
    fixture.componentInstance.expandedGroups.set(['Core']);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table.frozenPageEntries().some((entry: any) => entry.kind === 'group-footer')).toBe(
      true,
    );
    fixture.componentInstance.expandedGroups.set([]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table.frozenPageEntries().some((entry: any) => entry.kind === 'group')).toBe(true);
    expect(table.frozenPageEntries().some((entry: any) => entry.kind === 'row')).toBe(false);
    expect(table['canReorderRow'](ROWS[0])).toBe(false);

    fixture.componentInstance.rowGroupMode.set('rowspan');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table.frozenPageEntries().every((entry: any) => entry.kind === 'row')).toBe(true);
  });

  it('covers controlled layout, selection and row-order combination boundaries', async () => {
    const hostFixture = await create();
    hostFixture.destroy();
    const fixture = TestBed.createComponent(NeuTableComponent);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', [...ROWS, { id: 3, name: 'Disabled', team: 'Archive' }]);
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('searchable', false);
    fixture.componentRef.setInput('reorderableRows', true);
    fixture.componentRef.setInput('selectable', 'multiple');
    fixture.componentRef.setInput('rowSelectable', (row: any) => row.id !== 3);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance as any;

    expect(table._rowReorderScope()).toBe('loaded');
    expect(table['canReorderRow'](ROWS[0])).toBe(true);
    fixture.componentRef.setInput('rowReorderable', () => false);
    fixture.detectChanges();
    expect(table['canReorderRow'](ROWS[0])).toBe(false);
    fixture.componentRef.setInput('rowReorderable', undefined);

    table.selectRow(ROWS[0]);
    table.selectRow(ROWS[0]);
    table.selectRow({ id: 3, name: 'Disabled', team: 'Archive' });
    table.unselectRow(ROWS[1]);
    table.unselectRow(ROWS[0]);
    table.selectRow(ROWS[1]);
    table.clearSelection();
    table.clearSelection();
    fixture.componentRef.setInput('selectable', 'single');
    fixture.detectChanges();
    table.toggleAll();
    table.selectRow(ROWS[0]);
    table.selectRow(ROWS[1]);
    expect(table['isRowSelected'](ROWS[1])).toBe(true);

    const layout = {
      columnOrder: ['team', 'missing'],
      hiddenColumns: ['missing'],
      columnWidths: { name: 175 },
    };
    table.applyLayout(layout);
    table.applyLayout(table.currentLayout());
    expect(table.currentLayout()).toEqual({
      columnOrder: ['team', 'name'],
      hiddenColumns: [],
      columnWidths: { name: 175 },
    });
    const originalCss = globalThis.CSS;
    Object.defineProperty(globalThis, 'CSS', { configurable: true, value: undefined });
    table._columnMetrics();
    Object.defineProperty(globalThis, 'CSS', {
      configurable: true,
      value: { escape: (key: string) => key },
    });
    table._columnMetrics();
    Object.defineProperty(globalThis, 'CSS', {
      configurable: true,
      value: originalCss,
    });
    const resetEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
    table['resetColumnWidth']('missing', resetEvent);
    table['resetColumnWidth']('name', resetEvent);
    expect(resetEvent.preventDefault).toHaveBeenCalledTimes(2);
    table._commitColumnReorder({
      key: 'team',
      previousIndex: 0,
      currentIndex: 0,
      order: table.currentLayout().columnOrder,
    });
    table._draggedColumnKey.set('missing');
    table.onColumnDrop(COLUMNS[0], {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    });

    fixture.componentRef.setInput('resizableColumns', true);
    fixture.componentRef.setInput('columnResizeMode', 'expand');
    fixture.detectChanges();
    const rtlHeader = document.createElement('th');
    rtlHeader.style.direction = 'rtl';
    const rtlHandle = document.createElement('button');
    rtlHeader.append(rtlHandle);
    table['startColumnResize'](COLUMNS[0], {
      currentTarget: rtlHandle,
      clientX: 100,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    });
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 80 }));
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 80 }));

    fixture.componentRef.setInput('pagination', true);
    fixture.detectChanges();
    expect(table._rowReorderScope()).toBe('page');
    fixture.componentRef.setInput('pagination', false);
    table['onSearch']({ target: { value: 'Ada' } });
    expect(table._rowReorderScope()).toBe('filtered');
    table['onSearch']({ target: { value: '' } });
    fixture.componentRef.setInput('serverSide', true);
    fixture.detectChanges();
    expect(table._rowReorderScope()).toBe('server-window');

    fixture.componentRef.setInput('serverSide', false);
    fixture.componentRef.setInput('sortable', true);
    fixture.detectChanges();
    table.sortBy('name', new MouseEvent('click'));
    expect(table['canReorderRow'](ROWS[0])).toBe(false);
    table._proposeRowReorder(999, 1, 'before');
    table.onRowContextMenu(ROWS[0], 0, {
      target: document.createElement('tr'),
      currentTarget: document.createElement('tr'),
      composedPath: () => [],
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    });
    table._openRowContextMenuFromKeyboard(ROWS[0], {
      currentTarget: document.createElement('tr'),
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    });
    table._proposeContextMenuSelection(ROWS[0]);
    table._proposeContextMenuSelection(null);
    expect(table.isNavigableRow(ROWS[0])).toBe(true);

    fixture.componentRef.setInput('stickyHeader', false);
    fixture.detectChanges();
    expect(table.frozenRowTop(2)).toBeGreaterThan(0);
    fixture.componentRef.setInput('stickyHeader', true);
    fixture.detectChanges();
    expect(table.frozenRowTop(0)).toBe(44);
  });
});
