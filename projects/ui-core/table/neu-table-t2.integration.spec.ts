import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { NeuTableComponent } from './neu-table.component';
import {
  NeuTableBodyDirective,
  NeuTableCaptionDirective,
  NeuTableCellEditorDirective,
  NeuTableCellViewDirective,
  NeuTableFooterGroupDirective,
  NeuTableGroupFooterDirective,
  NeuTableGroupHeaderDirective,
  NeuTableHeaderGroupDirective,
  NeuTableLoadingBodyDirective,
  NeuTablePaginatorLeftDirective,
  NeuTablePaginatorRightDirective,
  NeuTableSummaryDirective,
} from './neu-table-templates.directive';
import type { NeuTableCellEditLifecycleEvent, NeuTableColumn } from './neu-table.types';

interface Row {
  id: number;
  name: string;
  team: string;
}

const ROWS: Row[] = [
  { id: 1, name: 'Ada', team: 'B' },
  { id: 2, name: 'Grace', team: 'A' },
  { id: 3, name: 'Linus', team: 'B' },
];

const COLUMNS: NeuTableColumn<Row, string>[] = [
  { key: 'name', header: 'Name', editable: true },
  { key: 'team', header: 'Team' },
];

@Component({
  imports: [
    NeuTableComponent,
    NeuTableCaptionDirective,
    NeuTableHeaderGroupDirective,
    NeuTableFooterGroupDirective,
    NeuTableLoadingBodyDirective,
    NeuTableSummaryDirective,
    NeuTablePaginatorLeftDirective,
    NeuTablePaginatorRightDirective,
  ],
  template: `
    <neu-table
      [columns]="columns"
      [data]="rows"
      [loading]="loading()"
      [pageSizeOptions]="[2]"
      [serverSide]="serverSide()"
      [totalItems]="totalItems()"
    >
      <ng-template neuTableCaption>Accounts</ng-template>
      <ng-template neuTableHeaderGroup
        ><tr>
          <th colspan="2">People</th>
        </tr></ng-template
      >
      <ng-template neuTableFooterGroup
        ><tr>
          <td colspan="2">Footer group</td>
        </tr></ng-template
      >
      <ng-template neuTableLoadingBody let-columns="columns"
        ><tr>
          <td [attr.colspan]="columns.length">Custom loading</td>
        </tr></ng-template
      >
      <ng-template neuTableSummary>Summary</ng-template>
      <ng-template neuTablePaginatorLeft>Left outlet</ng-template>
      <ng-template neuTablePaginatorRight>Right outlet</ng-template>
    </neu-table>
  `,
})
class StructuralHost {
  columns = COLUMNS;
  rows = ROWS;
  loading = signal(false);
  serverSide = signal(false);
  totalItems = signal<number | undefined>(0);
}

@Component({
  imports: [
    NeuTableComponent,
    NeuTableCellViewDirective,
    NeuTableCellEditorDirective,
    NeuTableGroupHeaderDirective,
    NeuTableGroupFooterDirective,
  ],
  template: `
    <neu-table
      [columns]="columns"
      [data]="rows"
      [pagination]="false"
      [searchable]="false"
      [inlineEdit]="true"
      [cellEditValidator]="validator"
      groupBy="team"
      [rowGroupMode]="mode()"
      [expandableRowGroups]="expandable()"
      [expandedGroupKeys]="expandedGroups()"
      (cellEditInit)="init($event)"
      (cellEditCommit)="commit($event)"
      (editValidationError)="invalid($event)"
      (expandedGroupKeysChange)="groups($event); expandedGroups.set($event)"
    >
      <ng-template neuTableCellView="name" let-row
        ><strong class="cell-view">{{ row['name'] }}</strong></ng-template
      >
      <ng-template
        neuTableCellEditor="name"
        let-value
        let-setValue="setValue"
        let-save="save"
        let-cancel="cancel"
      >
        <input class="cell-editor" [value]="value" (input)="setValue($any($event.target).value)" />
        <button class="cell-save" type="button" (click)="save()">Save</button>
        <button class="cell-cancel" type="button" (click)="cancel()">Cancel</button>
      </ng-template>
      <ng-template neuTableGroupHeader let-group
        ><span class="group-header">{{ group.label }}</span></ng-template
      >
      <ng-template neuTableGroupFooter let-group
        ><span class="group-footer">{{ group.count }}</span></ng-template
      >
    </neu-table>
  `,
})
class EditGroupHost {
  columns = COLUMNS;
  rows = ROWS;
  init = vi.fn();
  commit = vi.fn();
  invalid = vi.fn();
  groups = vi.fn();
  mode = signal<'subheader' | 'rowspan'>('subheader');
  expandable = signal(true);
  expandedGroups = signal<readonly unknown[]>(['A']);
  validation = signal<true | false | string>('Name is required');
  validator = (event: NeuTableCellEditLifecycleEvent<Row>) =>
    String(event.value).trim() ? this.validation() : 'Name is required';
}

@Component({
  imports: [NeuTableComponent, NeuTableBodyDirective],
  template: `
    <neu-table
      [columns]="columns"
      [data]="rows"
      [pagination]="false"
      [searchable]="false"
      [inlineEdit]="true"
      editMode="row"
      [editingRowKeys]="controlledKeys()"
      [rowEditValidator]="validator"
      (rowEditInit)="init($event)"
      (rowEditSave)="save($event)"
      (rowEditCancel)="cancel($event)"
      (editValidationError)="invalid($event)"
    >
      <ng-template neuTableBody let-row let-edit="edit">
        <td>{{ edit.draft['name'] }}</td>
        <td>
          <button class="row-init" type="button" (click)="edit.init()">
            Edit {{ row['name'] }}
          </button>
          <button class="row-save" type="button" (click)="edit.save()">Save</button>
        </td>
      </ng-template>
    </neu-table>
  `,
})
class RowEditHost {
  columns = COLUMNS;
  rows = ROWS;
  init = vi.fn();
  save = vi.fn();
  cancel = vi.fn();
  invalid = vi.fn();
  controlledKeys = signal<readonly unknown[] | undefined>(undefined);
  validation = signal<true | string>(true);
  validator = () => this.validation();
}

describe('NeuTable T2 templates, editing and grouping', () => {
  async function create<T>(host: new () => T) {
    await TestBed.configureTestingModule({
      imports: [host],
      providers: [provideRouter([]), provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders typed caption/header/footer/summary and paginator outlets plus loading body', async () => {
    const fixture = await create(StructuralHost);
    expect(fixture.nativeElement.querySelector('caption').textContent).toContain('Accounts');
    expect(fixture.nativeElement.querySelector('thead').textContent).toContain('People');
    expect(fixture.nativeElement.querySelector('tfoot').textContent).toContain('Footer group');
    expect(fixture.nativeElement.querySelector('.neu-table__summary').textContent).toContain(
      'Summary',
    );
    expect(fixture.nativeElement.textContent).toContain('Left outlet');
    expect(fixture.nativeElement.textContent).toContain('Right outlet');
    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent<Row>;
    expect(table.bodyContext(ROWS[0] as Row & Record<string, unknown>, 0, 0).group).toBeNull();
    fixture.componentInstance.serverSide.set(true);
    fixture.componentInstance.totalItems.set(42);
    await fixture.whenStable();
    expect(table.paginatorTemplateContext().totalRecords).toBe(42);
    fixture.componentInstance.totalItems.set(undefined);
    await fixture.whenStable();
    expect(table.paginatorTemplateContext().totalRecords).toBe(0);
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Custom loading');
  });

  it('orders groups, controls expansion and uses custom view/editor templates', async () => {
    const fixture = await create(EditGroupHost);
    const toggles = fixture.nativeElement.querySelectorAll('.neu-table__group-toggle');
    expect(
      [...fixture.nativeElement.querySelectorAll('.group-header')].map((el: Element) =>
        el.textContent?.trim(),
      ),
    ).toEqual(['A', 'B']);
    toggles[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.groups).toHaveBeenCalledWith(['A', 'B']);
    const view = fixture.nativeElement.querySelector('.cell-view') as HTMLElement;
    view.closest('td')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.init).toHaveBeenCalledTimes(1);
    const editor = fixture.nativeElement.querySelector('.cell-editor') as HTMLInputElement;
    editor.value = '';
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    (fixture.nativeElement.querySelector('.cell-save') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    fixture.componentInstance.validation.set(true);
    editor.value = 'Ada Lovelace';
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    (fixture.nativeElement.querySelector('.cell-save') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.commit).toHaveBeenCalledTimes(1);

    fixture.componentInstance.mode.set('rowspan');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.neu-table__group-row')).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('td[rowspan="2"]')).toBeTruthy();
  });

  it('exposes wrapper-safe row edit actions without mutating source rows', async () => {
    const fixture = await create(RowEditHost);
    (fixture.nativeElement.querySelector('.row-init') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.init).toHaveBeenCalledTimes(1);
    (fixture.nativeElement.querySelector('.row-save') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.save).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.rows[0].name).toBe('Ada');

    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent<Row>;
    table.startRowEdit(fixture.componentInstance.rows[1] as Row & Record<string, unknown>);
    table.startRowEdit(fixture.componentInstance.rows[1] as Row & Record<string, unknown>);
    table.setRowEditingValue(
      fixture.componentInstance.rows[1] as Row & Record<string, unknown>,
      'name',
      'Grace updated',
    );
    fixture.componentInstance.validation.set('Row is invalid');
    expect(
      table.saveRowEdit(fixture.componentInstance.rows[1] as Row & Record<string, unknown>),
    ).toBe(false);
    expect(fixture.componentInstance.invalid).toHaveBeenCalledTimes(1);
    table.cancelRowEdit(fixture.componentInstance.rows[1] as Row & Record<string, unknown>);
    expect(fixture.componentInstance.cancel).toHaveBeenCalledTimes(1);
    table.cancelRowEdit(fixture.componentInstance.rows[1] as Row & Record<string, unknown>);
    table.setRowEditingValue(
      fixture.componentInstance.rows[1] as Row & Record<string, unknown>,
      'name',
      'ignored',
    );

    fixture.componentInstance.controlledKeys.set([3]);
    await fixture.whenStable();
    expect(table.isEditingRow(fixture.componentInstance.rows[2])).toBe(true);
    fixture.componentInstance.controlledKeys.set(undefined);
    await fixture.whenStable();
  });

  it('covers editing keyboard, cancellation, context and group lifecycle alternatives', async () => {
    const fixture = await create(EditGroupHost);
    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent<Row>;
    const name = COLUMNS[0];
    const team = COLUMNS[1];

    expect(table.editingValue()).toBe('');
    expect(table.cellEditingInvalid()).toBe(false);
    expect(table.cellEditingError()).toBeNull();
    table.commitCellEdit(ROWS[0], name);
    table.startCellEdit(ROWS[0], team);
    expect(table.isEditingCell(ROWS[0], team)).toBe(false);
    table.startCellEdit(ROWS[0], name);
    table.startCellEdit(ROWS[0], name);
    expect(table.cellEditingInvalid()).toBe(false);
    expect(table.cellEditingError()).toBeNull();
    table.commitCellEdit(ROWS[1], name);
    table.commitCellEdit(ROWS[0], team);

    const unrelated = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    table.onEditableCellKeydown(ROWS[1], name, unrelated);
    table.onEditableCellKeydown(ROWS[0], name, unrelated);

    const textarea = document.createElement('textarea');
    const multilineEnter = new KeyboardEvent('keydown', { key: 'Enter' });
    Object.defineProperty(multilineEnter, 'target', { value: textarea });
    table.onEditableCellKeydown(ROWS[0], name, multilineEnter);
    expect(table.isEditingCell(ROWS[0], name)).toBe(true);

    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    const contentEditableEnter = new KeyboardEvent('keydown', { key: 'Enter' });
    Object.defineProperty(contentEditableEnter, 'target', { value: editable });
    table.onEditableCellKeydown(ROWS[0], name, contentEditableEnter);
    expect(table.isEditingCell(ROWS[0], name)).toBe(true);

    table.onEditableCellKeydown(ROWS[0], name, new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(table.isEditingCell(ROWS[0], name)).toBe(false);
    table.cancelCellEdit();

    const detached = { id: 99, name: 'Detached', team: 'A' };
    table.startCellEdit(detached, name, {
      stopPropagation: vi.fn(),
    } as unknown as Event);
    table.cancelCellEdit();

    table.startCellEdit(ROWS[0], name);
    table.setEditingValue('');
    const invalidTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      cancelable: true,
    });
    table.onEditableCellKeydown(ROWS[0], name, invalidTab);
    expect(invalidTab.defaultPrevented).toBe(true);
    expect(table.cellEditingError()).toBe('Name is required');

    table.setEditingValue('Ada updated');
    fixture.componentInstance.validation.set(true);
    table.onEditableCellKeydown(ROWS[0], name, new KeyboardEvent('keydown', { key: 'Tab' }));
    await Promise.resolve();
    expect(table.isEditingCell(ROWS[0], name)).toBe(false);

    table.startCellEdit(ROWS[0], name);
    fixture.componentInstance.validation.set(true);
    const inputEnter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    Object.defineProperty(inputEnter, 'target', { value: document.createElement('input') });
    table.onEditableCellKeydown(ROWS[0], name, inputEnter);
    expect(inputEnter.defaultPrevented).toBe(true);

    table.startCellEdit(ROWS[0], name);
    table.onEditableCellKeydown(
      ROWS[0],
      name,
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }),
    );
    await Promise.resolve();
    expect(table.isEditingCell(ROWS[0], name)).toBe(false);
    const lifecycleInternals = table as unknown as {
      _cellLifecycleEvent: (row: Row, column: NeuTableColumn<Row>) => unknown;
    };
    expect(lifecycleInternals._cellLifecycleEvent(ROWS[0], name as NeuTableColumn<Row>)).toBeNull();

    expect(table.cellViewTemplate('missing')).toBeNull();
    expect(table.cellEditorTemplate('missing')).toBeNull();
    expect(
      table.cellEditorContext(
        ROWS[0] as Row & Record<string, unknown>,
        name as NeuTableColumn<Row>,
        0,
        0,
      ),
    ).toMatchObject({ value: undefined, invalid: false, error: null });
    table.startRowEdit(ROWS[0] as Row & Record<string, unknown>);
    const context = table.bodyContext(ROWS[0] as Row & Record<string, unknown>, 0, 0);
    expect(context.group?.label).toBe('A');
    expect(context.edit.save()).toBe(false);
    context.toggleSelection();
    expect(context.selected).toBe(false);
    context.toggleExpansion();
    expect(table.structuralContext().columns).toHaveLength(2);
    expect(table.paginatorTemplateContext().totalRecords).toBe(3);

    const group = table.visibleGroups()[0];
    expect(table.groupExpansionAriaLabel(group)).toContain('Collapse');
    table.toggleGroup(group);
    expect(fixture.componentInstance.groups).toHaveBeenLastCalledWith([]);
    expect(table.groupExpansionAriaLabel({ ...group, expanded: false })).toContain('Expand');
    fixture.componentInstance.expandable.set(false);
    await fixture.whenStable();
    table.toggleGroup(group);
    expect(table.isRowspanGroupCell(0, 'name')).toBe(false);
    expect(table.groupRowspan(0)).toBe(1);
    expect(table.hideGroupRowspanCell(0)).toBe(false);
  });
});
