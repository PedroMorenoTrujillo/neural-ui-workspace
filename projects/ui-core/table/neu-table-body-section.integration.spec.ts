import { Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NeuContextMenuDirective } from '../context-menu/neu-context-menu.component';
import { NeuTableManagedRowDirective } from './neu-table-managed-row.directive';
import { NeuTableRowReorderHandleDirective } from './neu-table-row-reorder-handle.directive';
import {
  NeuTableBodyDirective,
  NeuTableBodySectionDirective,
} from './neu-table-templates.directive';
import { NeuTableComponent } from './neu-table.component';
import type {
  NeuTableColumn,
  NeuTableContextMenuSelectEvent,
  NeuTableRowReorderEvent,
} from './neu-table.types';

interface Row {
  readonly [key: string]: unknown;
  readonly id: number;
  readonly name: string;
  readonly team: string;
}

const ROWS: readonly Row[] = Object.freeze([
  { id: 1, name: 'Ada', team: 'Core' },
  { id: 2, name: 'Grace', team: 'Core' },
  { id: 3, name: 'Linus', team: 'Labs' },
]);

const COLUMNS: readonly NeuTableColumn<Row>[] = Object.freeze([
  { key: 'name', header: 'Name', sortable: true, filterable: true },
  { key: 'team', header: 'Team' },
]);

@Component({
  selector: 'test-detail',
  template: `<strong class="detail-component">Details for {{ name() }}</strong>`,
})
class DetailComponent {
  readonly name = input.required<string>();
}

@Component({
  imports: [
    NeuTableComponent,
    NeuTableBodyDirective,
    NeuTableBodySectionDirective,
    NeuTableManagedRowDirective,
    NeuTableRowReorderHandleDirective,
    DetailComponent,
  ],
  template: `
    <neu-table
      [columns]="columns"
      [data]="rows()"
      [frozenData]="frozenRows()"
      [pagination]="pagination()"
      [pageSize]="2"
      [searchable]="true"
      [sortable]="true"
      [selectable]="'multiple'"
      expandMode="multiple"
      editMode="row"
      [reorderableRows]="reorderable()"
      [rowClass]="rowClass"
      [contextMenu]="contextMenu()"
      [groupBy]="groupBy()"
      [rowGroupMode]="'subheader'"
      [loading]="loading()"
      (selectionChange)="selections.push($event)"
      (contextMenuSelect)="contextEvents.push($event)"
      (rowReorder)="rowReorders.push($event)"
    >
      <ng-template neuTableBody
        ><td class="normal-body-must-not-render">Normal body</td></ng-template
      >
      <ng-template
        neuTableBodySection
        [neuTableBodySectionOf]="rows()"
        let-entries
        let-colspan="colspan"
        let-siblingRowsSupported="siblingRowsSupported"
      >
        @for (entry of entries; track entry.key) {
          @if (entry.kind === 'data') {
            <tr
              [neuTableManagedRow]="entry"
              class="consumer-primary"
              [class.consumer-selected]="entry.selected"
              [attr.data-consumer-id]="entry.row.id"
              [attr.data-expanded]="entry.expanded"
              [attr.data-editing]="entry.editing"
              [attr.data-sibling-rows-supported]="siblingRowsSupported"
              aria-label="Consumer row {{ entry.row.name }}"
            >
              <td>
                <button
                  type="button"
                  neuTableRowReorderHandle
                  aria-label="Move {{ entry.row.name }}"
                >
                  Move
                </button>
                {{ entry.row.name }}
                <button
                  type="button"
                  class="edit"
                  (click)="entry.edit.init(); $event.stopPropagation()"
                >
                  Edit {{ entry.row.name }}
                </button>
                @if (entry.editing) {
                  <input
                    class="consumer-editor"
                    [value]="entry.edit.draft.name"
                    (input)="entry.edit.setValue('name', inputValue($event))"
                  />
                }
              </td>
              <td>
                <button
                  type="button"
                  class="expand"
                  (click)="entry.toggleExpansion(); $event.stopPropagation()"
                >
                  Toggle {{ entry.row.name }}
                </button>
              </td>
            </tr>
            @if (siblingRowsSupported) {
              <tr class="consumer-detail" [attr.data-detail-for]="entry.row.id">
                <td [attr.colspan]="colspan">
                  <test-detail [name]="entry.row.name" />
                </td>
              </tr>
              @if (entry.row.id === 1) {
                <tr class="consumer-third-row">
                  <td [attr.colspan]="colspan">Third row</td>
                </tr>
              }
            }
          } @else if (entry.kind === 'group-header') {
            <tr class="consumer-group-header">
              <th [attr.colspan]="colspan">
                Group {{ entry.group.label }}
                <button class="consumer-group-toggle" type="button" (click)="entry.toggle()">
                  Toggle group
                </button>
              </th>
            </tr>
            <tr class="consumer-group-meta">
              <td [attr.colspan]="colspan">{{ entry.group.count }} records</td>
            </tr>
          } @else if (entry.kind === 'group-footer') {
            <tr class="consumer-group-footer">
              <td [attr.colspan]="colspan">End {{ entry.group.label }}</td>
            </tr>
          } @else if (entry.kind === 'empty') {
            <tr class="consumer-empty-title">
              <th [attr.colspan]="entry.colspan">Nothing here</th>
            </tr>
            <tr class="consumer-empty-action">
              <td [attr.colspan]="entry.colspan">{{ entry.message }}</td>
            </tr>
          } @else if (entry.kind === 'loading') {
            <tr class="consumer-loading">
              <td [attr.colspan]="entry.colspan">Loading section</td>
            </tr>
          }
        }
      </ng-template>
    </neu-table>
  `,
})
class BodySectionHost {
  readonly columns = COLUMNS;
  readonly rows = signal(ROWS);
  readonly frozenRows = signal<readonly Row[]>([]);
  readonly pagination = signal(false);
  readonly reorderable = signal(false);
  readonly groupBy = signal('');
  readonly loading = signal(false);
  readonly contextMenu = signal<NeuContextMenuDirective | null>(null);
  readonly selections: Row[][] = [];
  readonly contextEvents: NeuTableContextMenuSelectEvent<Row>[] = [];
  readonly rowReorders: NeuTableRowReorderEvent<Row>[] = [];
  readonly rowClass = (row: Row) => `configured-row configured-row-${row.id}`;

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}

@Component({
  imports: [NeuTableComponent, NeuTableBodySectionDirective, NeuTableManagedRowDirective],
  template: `
    <neu-table
      [columns]="columns"
      [data]="rows"
      [dataFirst]="0"
      [totalItems]="20"
      [serverSide]="true"
      [pagination]="false"
      [virtualScroll]="true"
      [virtualizationOptions]="{ visibleItems: 3, itemSize: 40 }"
    >
      <ng-template
        neuTableBodySection
        [neuTableBodySectionOf]="rows"
        let-entries
        let-siblingRowsSupported="siblingRowsSupported"
      >
        @for (entry of entries; track entry.key) {
          @if (entry.kind === 'data') {
            <tr
              [neuTableManagedRow]="entry"
              [attr.data-sibling-rows-supported]="siblingRowsSupported"
            >
              <td>{{ entry.row.name }}</td>
              <td>{{ entry.logicalIndex }}</td>
            </tr>
          } @else if (entry.kind === 'placeholder') {
            <tr class="consumer-placeholder" aria-hidden="true">
              <td [attr.colspan]="entry.colspan">Placeholder {{ entry.logicalIndex }}</td>
            </tr>
          } @else if (entry.kind === 'spacer') {
            <tr class="consumer-spacer" aria-hidden="true">
              <td [attr.colspan]="entry.colspan" [style.height.px]="entry.height"></td>
            </tr>
          }
        }
      </ng-template>
    </neu-table>
  `,
})
class VirtualBodySectionHost {
  readonly columns = COLUMNS;
  readonly rows = ROWS.slice(0, 1);
}

describe('NeuTable full body-section composition', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollTo ??= vi.fn();
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideZonelessChangeDetection()],
    }).compileComponents();
  });

  async function create<T>(host: new () => T) {
    const fixture = TestBed.createComponent(host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders consumer-owned managed and unlimited sibling rows directly under tbody', async () => {
    const fixture = await create(BodySectionHost);
    const tbody = fixture.nativeElement.querySelector('tbody') as HTMLTableSectionElement;
    const directRows = Array.from(tbody.children) as HTMLTableRowElement[];

    expect(directRows.every((row) => row.tagName === 'TR')).toBe(true);
    expect(tbody.querySelectorAll(':scope > .consumer-primary')).toHaveLength(3);
    expect(tbody.querySelectorAll(':scope > .consumer-detail')).toHaveLength(3);
    expect(tbody.querySelectorAll(':scope > .consumer-third-row')).toHaveLength(1);
    expect(tbody.querySelector('tr tr')).toBeNull();
    expect(tbody.querySelectorAll('.detail-component')).toHaveLength(3);
    expect(tbody.querySelector('.normal-body-must-not-render')).toBeNull();
  });

  it('preserves managed selection, keyboard focus, ARIA and consumer attributes/classes', async () => {
    const fixture = await create(BodySectionHost);
    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('tr[data-neu-table-managed-row="true"]'),
    ) as HTMLTableRowElement[];

    expect(rows[0].classList.contains('consumer-primary')).toBe(true);
    expect(rows[0].classList.contains('configured-row-1')).toBe(true);
    expect(rows[0].getAttribute('data-consumer-id')).toBe('1');
    expect(rows[0].getAttribute('aria-label')).toBe('Consumer row Ada');
    expect(rows.map((row) => row.tabIndex)).toEqual([0, -1, -1]);
    expect(rows[0].getAttribute('aria-selected')).toBe('false');

    rows[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selections.at(-1)?.map((row) => row.id)).toEqual([1]);
    expect(rows[0].getAttribute('aria-selected')).toBe('true');
    expect(rows[0].classList.contains('neu-table__row--selected')).toBe(true);

    rows[0].focus();
    rows[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(rows[1]);

    rows[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.selections.at(-1)?.map((row) => row.id)).toEqual([1, 2]);

    const edit = rows[1].querySelector('.edit') as HTMLButtonElement;
    edit.click();
    fixture.detectChanges();
    expect(rows[1].getAttribute('data-editing')).toBe('true');
    expect(rows[1].querySelector('.consumer-editor')).toBeTruthy();
  });

  it('keeps every public data-entry operation wired to the canonical controllers', async () => {
    const fixture = await create(BodySectionHost);
    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent<Row>;

    const paginator = table.paginatorTemplateContext();
    paginator.goToPage(1);
    paginator.setPageSize(2);

    const body = table.bodyContext(ROWS[0], 0, 0);
    body.toggleSelection();
    body.toggleExpansion();
    body.reorder.move(1);

    body.edit.init();
    const editing = table.rowEditContext(ROWS[0], 0, 0);
    editing.setValue('name', 'Ada Updated');
    editing.save();
    table.rowEditContext(ROWS[1], 1, 1).init();
    table.rowEditContext(ROWS[1], 1, 1).cancel();

    const column = COLUMNS[0];
    table.cellViewContext(ROWS[0], column, 0, 0).startEdit();
    const cellEditor = table.cellEditorContext(ROWS[0], column, 0, 0);
    cellEditor.setValue('Ada Cell');
    expect(cellEditor.save()).toBe(true);
    table.cellViewContext(ROWS[0], column, 0, 0).startEdit();
    table.cellEditorContext(ROWS[0], column, 0, 0).cancel();

    fixture.componentInstance.groupBy.set('team');
    fixture.detectChanges();
    const groupToggle = fixture.nativeElement.querySelector(
      '.consumer-group-toggle',
    ) as HTMLButtonElement;
    groupToggle.click();
    fixture.detectChanges();
    expect(groupToggle).toBeTruthy();
  });

  it('preserves context-menu and row-reorder orchestration without double emission', async () => {
    const fixture = await create(BodySectionHost);
    const openAt = vi.fn();
    fixture.componentInstance.contextMenu.set({ openAt } as unknown as NeuContextMenuDirective);
    fixture.componentInstance.reorderable.set(true);
    fixture.detectChanges();
    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('tr[data-neu-table-managed-row="true"]'),
    ) as HTMLTableRowElement[];

    rows[0].dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 12,
        clientY: 20,
      }),
    );
    expect(openAt).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.contextEvents).toHaveLength(1);
    expect(fixture.componentInstance.contextEvents[0].row.id).toBe(1);

    const handle = rows[0].querySelector('.neu-table__row-reorder-handle') as HTMLButtonElement;
    handle.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    expect(rows[0].draggable).toBe(true);
    rows[0].dispatchEvent(new MouseEvent('dragstart', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(rows[0].classList.contains('neu-table__row--dragging')).toBe(true);
    rows[1].dispatchEvent(
      new MouseEvent('dragover', { bubbles: true, cancelable: true, clientY: 1 }),
    );
    fixture.detectChanges();
    expect(rows[1].classList.contains('neu-table__row--drop-after')).toBe(true);
    rows[1].dispatchEvent(new MouseEvent('drop', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.rowReorders).toHaveLength(1);
    expect(fixture.componentInstance.rowReorders[0]).toEqual(
      expect.objectContaining({ key: 1, previousIndex: 0, currentIndex: 1 }),
    );
  });

  it('keeps pagination, sorting and filtering canonical and excludes sibling rows from counts', async () => {
    const fixture = await create(BodySectionHost);
    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent<Row>;
    fixture.componentInstance.pagination.set(true);
    fixture.detectChanges();

    expect(table.paginatorTemplateContext().totalRecords).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('.consumer-primary')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('.consumer-detail')).toHaveLength(2);

    table.sortBy('name');
    table.sortBy('name');
    fixture.detectChanges();
    expect(
      Array.from<Element>(fixture.nativeElement.querySelectorAll('.consumer-primary')).map((row) =>
        row.getAttribute('data-consumer-id'),
      ),
    ).toEqual(['3', '2']);

    const search = fixture.nativeElement.querySelector('.neu-table__search') as HTMLInputElement;
    search.value = 'Linus';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 320));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.consumer-primary')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.consumer-primary')?.textContent).toContain(
      'Linus',
    );
    expect(table.paginatorTemplateContext().totalRecords).toBe(1);
  });

  it('structurally owns loading, empty, group, expansion and frozen states', async () => {
    const fixture = await create(BodySectionHost);

    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.consumer-loading')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.neu-table__row--loading')).toBeNull();

    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.rows.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.consumer-empty-title')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('.consumer-empty-action')).toHaveLength(1);

    fixture.componentInstance.rows.set(ROWS);
    fixture.componentInstance.groupBy.set('team');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.consumer-group-header')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('.consumer-group-meta')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('.consumer-group-footer')).toHaveLength(2);

    fixture.componentInstance.groupBy.set('');
    fixture.componentInstance.frozenRows.set([ROWS[0]]);
    fixture.componentInstance.rows.set(ROWS.slice(1));
    fixture.detectChanges();
    const frozen = fixture.nativeElement.querySelector(
      'tr[data-neu-table-managed-row="true"][data-neu-table-frozen="true"]',
    );
    expect(frozen).toBeTruthy();

    const expand = fixture.nativeElement.querySelector('.expand') as HTMLButtonElement;
    expand.click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('tr[data-neu-table-managed-row="true"]')
        ?.getAttribute('data-expanded'),
    ).toBe('true');
  });

  it('keeps virtual entries truthful and disables arbitrary sibling-row composition', async () => {
    const fixture = await create(VirtualBodySectionHost);
    const managed = fixture.nativeElement.querySelector(
      'tr[data-neu-table-managed-row="true"]',
    ) as HTMLTableRowElement;

    expect(managed.getAttribute('data-sibling-rows-supported')).toBe('false');
    expect(managed.style.height).toBe('40px');
    expect(fixture.nativeElement.querySelectorAll('.consumer-placeholder').length).toBeGreaterThan(
      0,
    );
    expect(fixture.nativeElement.querySelector('.consumer-detail')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('tbody > tr').length).toBeLessThanOrEqual(8);
  });
});
