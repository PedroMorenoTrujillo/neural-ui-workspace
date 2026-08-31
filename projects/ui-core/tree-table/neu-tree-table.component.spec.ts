import { Component, provideZonelessChangeDetection, TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NeuTableCaptionDirective,
  NeuTableCellEditorDirective,
  NeuTableCellViewDirective,
  NeuTableColumn,
  NeuTableEmptyDirective,
  NeuTableExpandDirective,
  NeuTableFooterGroupDirective,
  NeuTableGroupFooterDirective,
  NeuTableGroupHeaderDirective,
  NeuTableHeaderGroupDirective,
  NeuTableLoadingBodyDirective,
  NeuTablePaginatorLeftDirective,
  NeuTablePaginatorRightDirective,
  NeuTableSummaryDirective,
  NeuTableToolbarDirective,
} from '@neural-ui/core/table';
import { By } from '@angular/platform-browser';
import { NeuTableComponent } from '@neural-ui/core/table';
import type { NeuTableQueryState } from '@neural-ui/core/table';
import {
  NeuTreeTableComponent,
  NeuTreeTableNode,
  NeuTreeTableRow,
  NeuTreeTableRowEditEvent,
} from './neu-tree-table.component';
import {
  NeuTreeTableBodyDirective,
  NeuTreeTableBodySectionDirective,
  NeuTreeTableManagedRowDirective,
  NeuTreeTableNodeDirective,
} from './neu-tree-table-templates.directive';
import { projectNeuTreeTable } from './neu-tree-table-hierarchy.controller';

interface RepoMeta extends Record<string, unknown> {
  owner: string;
  status: string;
}

const NODES: NeuTreeTableNode<RepoMeta>[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    expanded: true,
    data: { owner: 'Platform', status: 'active' },
    children: [
      {
        id: 'ui-core',
        label: 'UI Core',
        data: { owner: 'Design', status: 'active' },
        children: [{ id: 'tree', label: 'Tree', data: { owner: 'Frontend', status: 'beta' } }],
      },
    ],
  },
];

const COLUMNS: NeuTableColumn<NeuTreeTableRow<RepoMeta>>[] = [
  { key: 'label', header: 'Node', width: '300px' },
  { key: 'owner', header: 'Owner' },
  { key: 'status', header: 'Status' },
];

function query(
  search = '',
  filters: NeuTableQueryState['filters'] = {},
  sortEntries: NeuTableQueryState['sortEntries'] = [],
): NeuTableQueryState {
  return {
    page: 1,
    pageSize: 10,
    search,
    sort: sortEntries.length === 1 ? sortEntries[0] : null,
    sortEntries,
    globalFilterFields: [],
    filters,
    serialization: {
      status: 'serializable',
      localOnlyFilters: [],
      requiresConsumerSerializationFilters: [],
      localOnlyGlobalFilterFields: false,
    },
  };
}

@Component({
  standalone: true,
  imports: [NeuTreeTableComponent, NeuTableExpandDirective],
  template: `
    <neu-tree-table [nodes]="nodes" [columns]="columns" expandMode="multiple" selectionMode="multiple">
      <ng-template neuTableExpand let-node let-row="row">
        <span class="tree-detail">{{ node.label }} / {{ row.__treeLevel }}</span>
      </ng-template>
    </neu-tree-table>
  `,
})
class TreeTableExpandHostComponent {
  nodes = NODES;
  columns = COLUMNS;
}

@Component({
  standalone: true,
  imports: [NeuTreeTableComponent, NeuTreeTableNodeDirective, NeuTableCaptionDirective],
  template: `
    <neu-tree-table [nodes]="nodes" [columns]="columns" selectionMode="multiple">
      <ng-template neuTableCaption>Repository hierarchy</ng-template>
      <ng-template neuTreeTableNode let-node let-level="level" let-toggle="toggle" let-toggleSelection="toggleSelection">
        <strong class="custom-node">{{ node.label }} level {{ level }}</strong>
        <button class="custom-node-toggle" type="button" (click)="toggle()">Toggle</button>
        <button class="custom-node-select" type="button" (click)="toggleSelection()">Select</button>
      </ng-template>
    </neu-tree-table>
  `,
})
class TreeTableCompositionHostComponent {
  nodes = NODES;
  columns = COLUMNS;
}

@Component({
  standalone: true,
  imports: [NeuTreeTableComponent],
  template: `
    <ng-template #customCell let-row>
      <span class="consumer-tree-cell">custom {{ row.label }}</span>
    </ng-template>
    <neu-tree-table [nodes]="nodes" [columns]="columns(customCell)" />
  `,
})
class TreeTableConsumerCellHostComponent {
  nodes = NODES;
  columns(template: TemplateRef<unknown>): NeuTableColumn<Record<string, unknown>>[] {
    return [
      { key: 'label', header: 'Node', cellTemplate: template as never },
      { key: 'owner', header: 'Owner' },
    ];
  }
}

@Component({
  standalone: true,
  imports: [
    NeuTreeTableComponent,
    NeuTreeTableBodySectionDirective,
    NeuTreeTableManagedRowDirective,
  ],
  template: `
    <neu-tree-table [nodes]="nodes" [columns]="columns" selectionMode="multiple">
      <ng-template neuTreeTableBodySection let-entries let-colspan="colspan">
        @for (entry of entries; track entry.key) {
          @if (entry.kind === 'node') {
            <tr [neuTreeTableManagedRow]="entry" class="advanced-node-row">
              <td [attr.colspan]="colspan">{{ entry.node.label }} / {{ entry.level }}</td>
            </tr>
            <tr class="advanced-detail-row" aria-hidden="true">
              <td [attr.colspan]="colspan">detail {{ entry.node.id }}</td>
            </tr>
          } @else if (entry.kind === 'empty') {
            <tr>
              <td [attr.colspan]="entry.colspan">{{ entry.message }}</td>
            </tr>
          }
        }
      </ng-template>
    </neu-tree-table>
  `,
})
class TreeTableBodySectionHostComponent {
  nodes = NODES;
  columns = COLUMNS;
}

@Component({
  standalone: true,
  imports: [NeuTreeTableComponent, NeuTreeTableNodeDirective],
  template: `
    <neu-tree-table
      [nodes]="nodes"
      [columns]="columns"
      [query]="queryState"
      [sort]="sortState"
      filterMode="strict"
      selectionMode="checkbox"
      [selection]="selection"
      [expandedKeys]="expandedKeys"
      editMode="row"
      [editingRowKeys]="editingRowKeys"
      [pagination]="true"
      [pageSize]="10"
      [serverSide]="true"
      [totalItems]="42"
      [labels]="labels"
      [exportOptions]="exportOptions"
      [virtualScroll]="true"
      [virtualizationOptions]="virtualizationOptions"
      [urlStateOptions]="urlStateOptions"
    >
      <ng-template neuTreeTableNode let-node let-level="level" let-partial="partial">
        <span class="strict-final-node">{{ node.label }} / {{ level }} / {{ partial }}</span>
      </ng-template>
    </neu-tree-table>
  `,
})
class TreeTableFinalApiHostComponent {
  readonly nodes = NODES;
  readonly columns = COLUMNS;
  readonly queryState = query();
  readonly sortState = [{ key: 'label', dir: 'asc' as const }];
  readonly selection = [NODES[0]];
  readonly expandedKeys = ['workspace'];
  readonly editingRowKeys = ['workspace'];
  readonly labels = {
    searchPlaceholder: 'Search hierarchy',
    expandNodeAriaLabel: 'Expand node',
  };
  readonly exportOptions = { enabled: true, formats: ['csv' as const] };
  readonly virtualizationOptions = { visibleItems: 8, overscan: 2 };
  readonly urlStateOptions = { enabled: true, pageParam: 'treePage' };
}

@Component({
  standalone: true,
  imports: [
    NeuTreeTableComponent,
    NeuTableToolbarDirective,
    NeuTableCaptionDirective,
    NeuTableHeaderGroupDirective,
    NeuTableFooterGroupDirective,
    NeuTableLoadingBodyDirective,
    NeuTableEmptyDirective,
    NeuTableSummaryDirective,
    NeuTablePaginatorLeftDirective,
    NeuTablePaginatorRightDirective,
    NeuTableGroupHeaderDirective,
    NeuTableGroupFooterDirective,
    NeuTableCellViewDirective,
    NeuTableCellEditorDirective,
  ],
  template: `
    <neu-tree-table
      [nodes]="nodes"
      [columns]="columns"
      [loading]="loading"
      [pagination]="true"
      [pageSize]="1"
      groupBy="owner"
      editMode="cell"
    >
      <ng-template neuTableToolbar><span class="slot-toolbar">Toolbar</span></ng-template>
      <ng-template neuTableCaption let-colspan="colspan"><caption class="slot-caption">Caption {{ colspan }}</caption></ng-template>
      <ng-template neuTableHeaderGroup let-colspan="colspan"><tr class="slot-header"><th [attr.colspan]="colspan">Header</th></tr></ng-template>
      <ng-template neuTableFooterGroup let-colspan="colspan"><tr class="slot-footer"><td [attr.colspan]="colspan">Footer</td></tr></ng-template>
      <ng-template neuTableLoadingBody let-colspan="colspan"><tr class="slot-loading"><td [attr.colspan]="colspan">Loading</td></tr></ng-template>
      <ng-template neuTableEmpty let-message="message" let-colspan="colspan"><tr class="slot-empty"><td [attr.colspan]="colspan">{{ message }}</td></tr></ng-template>
      <ng-template neuTableSummary let-colspan="colspan"><tfoot class="slot-summary"><tr><td [attr.colspan]="colspan">Summary</td></tr></tfoot></ng-template>
      <ng-template neuTablePaginatorLeft let-currentPage><span class="slot-page-left">Left {{ currentPage }}</span></ng-template>
      <ng-template neuTablePaginatorRight let-totalPages="totalPages"><span class="slot-page-right">Right {{ totalPages }}</span></ng-template>
      <ng-template neuTableGroupHeader let-label="label" let-count="count"><tr class="slot-group-header"><td>Group {{ label }} {{ count }}</td></tr></ng-template>
      <ng-template neuTableGroupFooter let-label="label"><tr class="slot-group-footer"><td>End {{ label }}</td></tr></ng-template>
      <ng-template neuTableCellView="owner" let-value="value"><span class="slot-cell-view">View {{ value }}</span></ng-template>
      <ng-template neuTableCellEditor="owner" let-value let-setValue="setValue"><input class="slot-cell-editor" [value]="value" (input)="setValue('Edited')" /></ng-template>
    </neu-tree-table>
  `,
})
class TreeTableAllSlotsHostComponent {
  nodes: NeuTreeTableNode<RepoMeta>[] = NODES;
  loading = false;
  columns: NeuTableColumn<NeuTreeTableRow<RepoMeta>>[] = COLUMNS.map((column) =>
    column.key === 'owner' ? { ...column, editable: true } : column,
  );
}

@Component({
  standalone: true,
  imports: [NeuTreeTableComponent, NeuTreeTableBodyDirective],
  template: `
    <neu-tree-table [nodes]="nodes" [columns]="columns" selectionMode="multiple">
      <ng-template neuTreeTableBody let-node let-level="level" let-toggleSelection="toggleSelection" let-toggleExpansion="toggleExpansion">
        <tr class="slot-tree-body">
          <td>{{ node.label }} / {{ level }}</td>
          <td><button class="body-select" (click)="toggleSelection()">Select</button></td>
          <td><button class="body-expand" (click)="toggleExpansion()">Expand</button></td>
        </tr>
      </ng-template>
    </neu-tree-table>
  `,
})
class TreeTableBodyHostComponent {
  nodes = NODES;
  columns = COLUMNS;
}

describe('NeuTreeTableComponent', () => {
  beforeEach(async () => {
    if (!HTMLElement.prototype.scrollTo) {
      HTMLElement.prototype.scrollTo = vi.fn();
    }
    await TestBed.configureTestingModule({
      imports: [NeuTreeTableComponent],
    }).compileComponents();
  });

  it('renders visible rows from expanded nodes', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Workspace');
    expect(text).toContain('UI Core');
    expect(text).not.toContain('Tree');
  });

  it('expands a branch when clicking the toggle', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();

    const toggles = fixture.nativeElement.querySelectorAll('.neu-tree-table__toggle');
    toggles[1].click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tree');
  });

  it('maps selectionChange back to tree nodes', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('selectionMode', 'multiple');

    const emitted: string[][] = [];
    fixture.componentInstance.selectionChange.subscribe((nodes) => {
      emitted.push(nodes.map((node) => node.id));
    });

    fixture.detectChanges();
    const checkboxes = fixture.nativeElement.querySelectorAll(
      '.neu-table__checkbox input[type="checkbox"]',
    );
    checkboxes[1].checked = true;
    checkboxes[1].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(emitted.at(-1)).toEqual(['workspace']);
  });

  it('wires selectionChange from the inner table back to tree nodes', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    const emitted: string[][] = [];

    fixture.componentInstance.selectionChange.subscribe((nodes) => {
      emitted.push(nodes.map((node) => node.id));
    });

    fixture.detectChanges();

    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent;
    table.selectionChange.emit([fixture.componentInstance.flatRows()[0]]);
    fixture.detectChanges();

    expect(emitted.at(-1)).toEqual(['workspace']);
  });

  it('emits nodeClick when the table row is activated', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    const emitted: string[] = [];
    fixture.componentInstance.nodeClick.subscribe((node) => emitted.push(node.id));
    fixture.detectChanges();

    fixture.componentInstance['onTableRowClick'](fixture.componentInstance.flatRows()[0]);
    expect(emitted).toEqual(['workspace']);
  });

  it('adds the cell template only to the configured tree column', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('treeColumnKey', 'owner');
    fixture.detectChanges();

    const columns = fixture.componentInstance.resolvedColumns();
    expect(columns[0].cellTemplate).toBeUndefined();
    expect(columns[1].cellTemplate).toBeTruthy();
    expect(columns[2].cellTemplate).toBeUndefined();
  });

  it('falls back to the first column when the configured tree column is missing', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('treeColumnKey', 'missing');
    fixture.detectChanges();

    const columns = fixture.componentInstance.resolvedColumns();
    expect(columns[0].cellTemplate).toBeTruthy();
    expect(columns[1].cellTemplate).toBeUndefined();
    expect(columns[2].cellTemplate).toBeUndefined();
  });

  it('renders badges and descriptions inside the tree cell template', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', [
      {
        id: 'workspace',
        label: 'Workspace',
        badge: 'Core',
        description: 'Main workspace',
        expanded: true,
        data: { owner: 'Platform', status: 'active' },
      },
    ]);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Core');
    expect(text).toContain('Main workspace');
  });

  it('computes tree cell helpers from the flattened row state', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('labels', {
      expandNodeAriaLabel: 'Expand',
      collapseNodeAriaLabel: 'Collapse',
    });
    fixture.detectChanges();

    const row = fixture.componentInstance.flatRows()[0] as NeuTreeTableRow<RepoMeta>;
    expect(fixture.componentInstance['treeIndent'](row as any)).toBe(0);
    expect(fixture.componentInstance['isTreeRowDisabled'](row as any)).toBe(false);
    expect(fixture.componentInstance['treeToggleAriaLabel'](row as any)).toBe(
      'Collapse: Workspace',
    );
  });

  it('ignores toggle requests for disabled or leaf nodes', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', [
      {
        id: 'disabled-root',
        label: 'Disabled root',
        expanded: true,
        disabled: true,
        children: [{ id: 'child', label: 'Child' }],
      },
      { id: 'leaf', label: 'Leaf' },
    ]);
    fixture.componentRef.setInput('columns', COLUMNS);
    let expansionCount = 0;
    fixture.componentInstance.expandedKeysChange.subscribe(() => expansionCount++);
    fixture.detectChanges();

    fixture.componentInstance.toggleNode({
      id: 'disabled-root',
      label: 'Disabled root',
      disabled: true,
      children: [{ id: 'child', label: 'Child' }],
    });
    fixture.componentInstance.toggleNode({ id: 'leaf', label: 'Leaf' });

    expect(expansionCount).toBe(0);
  });

  it('collapses expanded branches and preserves nested expanded descendants from the input model', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', [
      {
        id: 'workspace',
        label: 'Workspace',
        expanded: true,
        children: [
          {
            id: 'apps',
            label: 'Apps',
            expanded: true,
            children: [
              {
                id: 'admin',
                label: 'Admin',
                data: { owner: 'Frontend', status: 'beta' },
              },
            ],
            data: { owner: 'Platform', status: 'active' },
          },
        ],
        data: { owner: 'Platform', status: 'active' },
      },
    ]);
    fixture.componentRef.setInput('columns', COLUMNS);
    const expansionStates: string[][] = [];
    fixture.componentInstance.expandedKeysChange.subscribe((ids) => expansionStates.push([...ids]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Admin');

    fixture.componentInstance.toggleNode({
      id: 'apps',
      label: 'Apps',
      expanded: true,
      children: [{ id: 'admin', label: 'Admin' }],
    });
    fixture.detectChanges();

    expect(expansionStates.at(-1)).toEqual(['workspace']);
    expect(fixture.nativeElement.textContent).not.toContain('Admin');
  });

  it('passes advanced table features through to the inner table', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('pageSize', 20);
    fixture.componentRef.setInput('exactMatchable', true);
    fixture.componentRef.setInput('exportOptions', {
      enabled: true,
      formats: ['csv', 'json'],
    });
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualizationOptions', { visibleItems: 12 });
    fixture.componentRef.setInput('resizableColumns', true);
    fixture.componentRef.setInput('reorderableColumns', true);
    fixture.componentRef.setInput('columnChooser', true);
    fixture.componentRef.setInput('editMode', 'cell');
    fixture.componentRef.setInput('labels', {
      inlineEditLabel: 'Edit tree cell',
      saveInlineEditLabel: 'Save tree cell',
      cancelInlineEditLabel: 'Cancel tree cell edit',
    });
    fixture.componentRef.setInput('multiSort', true);
    fixture.componentRef.setInput('serverSide', true);
    fixture.componentRef.setInput('totalItems', 42);
    fixture.componentRef.setInput('groupBy', 'owner');
    fixture.detectChanges();

    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent;

    expect(table.loading()).toBe(true);
    expect(table.pageSize()).toBe(20);
    expect(table.exactMatchable()).toBe(true);
    expect(table.exportOptions().enabled).toBe(true);
    expect(table.exportOptions().formats).toEqual(['csv', 'json']);
    expect(table.virtualScroll()).toBe(true);
    expect(table.virtualizationOptions().visibleItems).toBe(12);
    expect(table.resizableColumns()).toBe(true);
    expect(table.reorderableColumns()).toBe(true);
    expect(table.columnChooser()).toBe(true);
    expect(table.editMode()).toBe('cell');
    expect(table.labels().inlineEditLabel).toBe('Edit tree cell');
    expect(table.labels().saveInlineEditLabel).toBe('Save tree cell');
    expect(table.labels().cancelInlineEditLabel).toBe('Cancel tree cell edit');
    expect(table.multiSort()).toBe(true);
    expect(table.serverSide()).toBe(true);
    expect(table.totalItems()).toBe(42);
    expect(table.groupBy()).toBe('owner');
  });

  it('maps advanced table events back to tree nodes', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    const row = fixture.componentInstance.flatRows()[0] as NeuTreeTableRow<RepoMeta>;
    const events: string[] = [];

    fixture.componentInstance.nodeDblClick.subscribe((node) => events.push(`dbl:${node.id}`));
    fixture.componentInstance.actionClick.subscribe((event) =>
      events.push(`action:${event.action.key}:${event.node.id}`),
    );
    fixture.componentInstance.selectionActionClick.subscribe((event) =>
      events.push(
        `selection-action:${event.action.key}:${event.nodes.map((node) => node.id).join(',')}`,
      ),
    );
    fixture.componentInstance.cellEditCommit.subscribe((event) =>
      events.push(`edit:${event.column.key}:${event.node.id}:${event.value}`),
    );
    fixture.detectChanges();

    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent;

    table.rowDblClick.emit(row);
    table.actionClick.emit({ action: { key: 'open', label: 'Open', icon: 'open' }, row });
    table.selectionActionClick.emit({
      action: { key: 'archive', label: 'Archive', icon: 'archive' },
      rows: [row],
    });
    table.cellEditCommit.emit({
      row,
      column: COLUMNS[1] as unknown as NeuTableColumn<Record<string, unknown>>,
      value: 'DX',
      previousValue: 'Platform',
    });

    expect(events).toEqual([
      'dbl:workspace',
      'action:open:workspace',
      'selection-action:archive:workspace',
      'edit:owner:workspace:DX',
    ]);
  });

  it('forwards search, layout and row events without changing their contract', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    const row = fixture.componentInstance.flatRows()[0] as NeuTreeTableRow<RepoMeta>;
    const received: unknown[] = [];
    fixture.componentInstance.nodeClick.subscribe((node) => received.push(`click:${node.id}`));
    fixture.componentInstance.searchChange.subscribe((value) => received.push(`search:${value}`));
    fixture.componentInstance.columnResize.subscribe((value) => received.push(value));
    fixture.componentInstance.columnReorder.subscribe((value) => received.push(value));
    fixture.componentInstance.layoutChange.subscribe((value) => received.push(value));
    fixture.detectChanges();

    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent;
    const resize = { key: 'label', width: 320 };
    const reorder = { previousIndex: 0, currentIndex: 1, columns: [] } as any;
    const layout = { columns: [], pageSize: 20 } as any;
    table.rowClick.emit(row);
    table.searchChange.emit('core');
    table.columnResize.emit(resize);
    table.columnReorder.emit(reorder);
    table.layoutChange.emit(layout);

    expect(received).toEqual(['click:workspace', 'search:core', resize, reorder, layout]);
  });

  it('forwards projected expand templates to the inner table with node and row context', () => {
    const fixture = TestBed.createComponent(TreeTableExpandHostComponent);
    fixture.detectChanges();

    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent;

    expect(table.expandTemplate()).toBeTruthy();
    const treeTable = fixture.debugElement.query(By.directive(NeuTreeTableComponent))
      .componentInstance as NeuTreeTableComponent;
    expect((treeTable as any).treeCellTpl()).toBeTruthy();
    const row = treeTable.flatRows()[0];
    const directive = treeTable.expandTemplate();
    expect(directive).toBeTruthy();
    expect(treeTable['expandTemplateRef'](directive!)).toBe(directive!.templateRef);
    expect(treeTable['expandTemplateContext'](row)).toEqual(
      expect.objectContaining({
        $implicit: NODES[0],
        node: NODES[0],
        row: expect.objectContaining({ id: 'workspace' }),
      }),
    );
    (fixture.nativeElement.querySelector('.neu-table__expand-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tree-detail')?.textContent).toContain(
      'Workspace / 0',
    );
  });

  it('keeps native table semantics and exposes truthful hierarchy state on toggle controls', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector('table') as HTMLTableElement;
    const toggle = fixture.nativeElement.querySelector(
      '.neu-tree-table__toggle',
    ) as HTMLButtonElement;
    expect(table.getAttribute('role')).toBe('treegrid');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Collapse row: Workspace');

    toggle.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('sorts siblings recursively without breaking parent-child adjacency', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', [
      {
        id: 'b',
        label: 'B',
        expanded: true,
        children: [
          { id: 'b2', label: 'B2' },
          { id: 'b1', label: 'B1' },
        ],
      },
      { id: 'a', label: 'A', expanded: true, children: [{ id: 'a1', label: 'A1' }] },
    ]);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('sort', [{ key: 'label', dir: 'asc' }]);
    fixture.detectChanges();

    expect(fixture.componentInstance.flatRows().map((row) => row['id'])).toEqual([
      'a',
      'a1',
      'b',
      'b1',
      'b2',
    ]);
  });

  it('finds loaded descendants of collapsed branches in lenient mode', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', [
      { id: 'root', label: 'Root', children: [{ id: 'needle', label: 'Needle' }] },
      { id: 'other', label: 'Other' },
    ]);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('query', query('needle'));
    fixture.componentRef.setInput('filterMode', 'lenient');
    fixture.detectChanges();

    expect(fixture.componentInstance.flatRows().map((row) => row['id'])).toEqual([
      'root',
      'needle',
    ]);
    expect(fixture.nativeElement.textContent).toContain('Needle');
  });

  it('retains a matching parent subtree in lenient mode and prunes it in strict mode', () => {
    const nodes: NeuTreeTableNode[] = [
      {
        id: 'root',
        label: 'Match',
        children: [
          { id: 'matching-child', label: 'Match child' },
          { id: 'other-child', label: 'Other child' },
        ],
      },
    ];
    const lenient = TestBed.createComponent(NeuTreeTableComponent);
    lenient.componentRef.setInput('nodes', nodes);
    lenient.componentRef.setInput('columns', COLUMNS);
    lenient.componentRef.setInput('query', query('match'));
    lenient.detectChanges();
    expect(lenient.componentInstance.flatRows().map((row) => row['id'])).toEqual([
      'root',
      'matching-child',
      'other-child',
    ]);

    const strict = TestBed.createComponent(NeuTreeTableComponent);
    strict.componentRef.setInput('nodes', nodes);
    strict.componentRef.setInput('columns', COLUMNS);
    strict.componentRef.setInput('query', query('match'));
    strict.componentRef.setInput('filterMode', 'strict');
    strict.detectChanges();
    expect(strict.componentInstance.flatRows().map((row) => row['id'])).toEqual([
      'root',
      'matching-child',
    ]);
  });

  it('keeps projections fresh across no-filter, filter edits, clear, and input replacement', () => {
    const original: NeuTreeTableNode[] = [
      {
        id: 'root',
        label: 'Root',
        children: [
          { id: 'alpha', label: 'Alpha' },
          { id: 'beta', label: 'Beta' },
        ],
      },
      { id: 'other', label: 'Other' },
    ];
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', original);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('expandedKeys', ['root']);
    fixture.componentRef.setInput('query', query());
    fixture.detectChanges();

    const ids = () => fixture.componentInstance.flatRows().map((row) => row['id']);
    const initialRows = fixture.componentInstance.flatRows();
    expect(ids()).toEqual(['root', 'alpha', 'beta', 'other']);

    fixture.componentRef.setInput('query', query('alpha'));
    fixture.detectChanges();
    expect(ids()).toEqual(['root', 'alpha']);

    fixture.componentRef.setInput('query', query('beta'));
    fixture.detectChanges();
    expect(ids()).toEqual(['root', 'beta']);

    fixture.componentRef.setInput('query', query());
    fixture.detectChanges();
    expect(ids()).toEqual(['root', 'alpha', 'beta', 'other']);
    expect(fixture.componentInstance.flatRows()[0]).not.toBe(initialRows[0]);

    fixture.componentRef.setInput('query', query());
    fixture.detectChanges();
    expect(ids()).toEqual(['root', 'alpha', 'beta', 'other']);

    const replacement: NeuTreeTableNode[] = [
      { id: 'replacement', label: 'Replacement', children: [{ id: 'fresh', label: 'Fresh' }] },
    ];
    fixture.componentRef.setInput('nodes', replacement);
    fixture.componentRef.setInput('expandedKeys', ['replacement']);
    fixture.detectChanges();
    expect(ids()).toEqual(['replacement', 'fresh']);
    expect((fixture.componentInstance.flatRows()[0] as any).__treeNode).toBe(replacement[0]);
    expect(original[0].children?.map((node) => node.id)).toEqual(['alpha', 'beta']);
  });

  it('keeps filter, sort, clear, re-sort, re-filter, and selection projections coherent', () => {
    const nodes: NeuTreeTableNode[] = [
      {
        id: 'group-b',
        label: 'Group B',
        children: [
          { id: 'beta', label: 'Match beta' },
          { id: 'alpha', label: 'Match alpha' },
        ],
      },
      {
        id: 'group-a',
        label: 'Group A',
        children: [{ id: 'gamma', label: 'Other gamma' }],
      },
    ];
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('expandedKeys', ['group-a', 'group-b']);
    fixture.componentRef.setInput('selectionMode', 'single');
    fixture.componentRef.setInput('selection', nodes[0].children?.[0] ?? null);
    fixture.componentRef.setInput('query', query('match'));
    fixture.detectChanges();

    const ids = () => fixture.componentInstance.flatRows().map((row) => row['id']);
    expect(ids()).toEqual(['group-b', 'beta', 'alpha']);
    expect((fixture.componentInstance.selectedRows()[0] as any).__treeNode).toBe(
      nodes[0].children?.[0],
    );

    fixture.componentRef.setInput('sort', [{ key: 'label', dir: 'asc' }]);
    fixture.detectChanges();
    expect(ids()).toEqual(['group-b', 'alpha', 'beta']);

    fixture.componentRef.setInput('query', query());
    fixture.detectChanges();
    expect(ids()).toEqual(['group-a', 'gamma', 'group-b', 'alpha', 'beta']);

    fixture.componentRef.setInput('sort', [{ key: 'label', dir: 'desc' }]);
    fixture.detectChanges();
    expect(ids()).toEqual(['group-b', 'beta', 'alpha', 'group-a', 'gamma']);

    fixture.componentRef.setInput('query', query('match'));
    fixture.detectChanges();
    expect(ids()).toEqual(['group-b', 'beta', 'alpha']);
    expect((fixture.componentInstance.selectedRows()[0] as any).__treeNode).toBe(
      nodes[0].children?.[0],
    );
  });

  it('keeps zero-match and repeated pure projections isolated from consumer nodes', () => {
    const nodes: NeuTreeTableNode[] = [
      { id: 'root', label: 'Root', children: [{ id: 'child', label: 'Child' }] },
    ];
    const options: Parameters<typeof projectNeuTreeTable>[1] = {
      query: query(),
      sort: [],
      filterMode: 'strict',
      exactMatch: false,
      columns: COLUMNS as unknown as NeuTableColumn<Record<string, unknown>>[],
    };
    const first = projectNeuTreeTable(nodes, options);
    (first.roots[0].row as { label: string }).label = 'Internal mutation';
    const second = projectNeuTreeTable(nodes, options);
    const empty = projectNeuTreeTable(nodes, { ...options, query: query('missing') });

    expect(second.roots[0].row.label).toBe('Root');
    expect(second.roots[0]).not.toBe(first.roots[0]);
    expect(second.roots[0].children[0]).not.toBe(first.roots[0].children[0]);
    expect(second.nodesById.get('child')?.node).toBe(nodes[0].children?.[0]);
    expect(empty.roots).toEqual([]);
    expect(empty.nodesById.size).toBe(0);
    expect(nodes[0].label).toBe('Root');
  });

  it('skips per-node query matching when no filter is active', () => {
    const trim = vi.spyOn(String.prototype, 'trim');
    try {
      projectNeuTreeTable(
        [{ id: 'root', label: 'Root', children: [{ id: 'child', label: 'Child' }] }],
        {
          query: query(),
          sort: [],
          filterMode: 'lenient',
          exactMatch: false,
          columns: COLUMNS as unknown as NeuTableColumn<Record<string, unknown>>[],
        },
      );
      expect(trim).toHaveBeenCalledTimes(1);
    } finally {
      trim.mockRestore();
    }
  });

  it('keeps repeated projection churn bounded and emits no work after destroy', async () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    const nodes = Array.from({ length: 12 }, (_, index) => ({
      id: `root-${index}`,
      label: `Root ${index}`,
      children: [{ id: `child-${index}`, label: `Child ${index}` }],
    }));
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('selectionMode', 'multiple');
    let queryEvents = 0;
    fixture.componentInstance.queryChange.subscribe(() => queryEvents++);

    for (let index = 0; index < 40; index += 1) {
      fixture.componentRef.setInput('query', query(index % 3 === 0 ? 'child' : ''));
      fixture.componentRef.setInput('sort', [
        { key: 'label', dir: index % 2 === 0 ? 'asc' : 'desc' },
      ]);
      fixture.componentRef.setInput(
        'expandedKeys',
        index % 2 === 0 ? nodes.map((node) => node.id) : [],
      );
      fixture.componentRef.setInput('selection', index % 2 === 0 ? [nodes[index % 12]] : []);
      fixture.detectChanges();

      const hierarchy = fixture.componentInstance['hierarchy']();
      expect(hierarchy.nodesById.size).toBeLessThanOrEqual(24);
      expect(fixture.componentInstance.flatRows().length).toBeLessThanOrEqual(24);
    }

    for (let index = 0; index < 10; index += 1) {
      fixture.componentInstance['onTableQueryChange'](query(index % 2 ? 'root' : 'child'));
    }
    expect(queryEvents).toBe(10);
    const renderedTable = fixture.nativeElement.querySelector('table') as HTMLTableElement;
    fixture.destroy();
    const eventsAtDestroy = queryEvents;
    await Promise.resolve();
    expect(queryEvents).toBe(eventsAtDestroy);
    expect(fixture.componentRef.hostView.destroyed).toBe(true);
    TestBed.resetTestingModule();
    expect(renderedTable.isConnected).toBe(false);
  });

  it('recomputes filter transitions under explicit zoneless change detection', async () => {
    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [NeuTreeTableComponent],
        providers: [provideZonelessChangeDetection()],
      })
      .compileComponents();
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('expandedKeys', ['workspace', 'ui-core']);
    fixture.componentRef.setInput('query', query('tree'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.flatRows().map((row) => row['id'])).toEqual([
      'workspace',
      'ui-core',
      'tree',
    ]);

    fixture.componentRef.setInput('query', query());
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.flatRows().map((row) => row['id'])).toEqual([
      'workspace',
      'ui-core',
      'tree',
    ]);
    fixture.destroy();
  });

  it('keeps controlled selection authoritative while emitting one proposal', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('selectionMode', 'single');
    fixture.componentRef.setInput('selection', null);
    const proposals: string[][] = [];
    fixture.componentInstance.selectionChange.subscribe((nodes) =>
      proposals.push(nodes.map((node) => node.id)),
    );
    fixture.detectChanges();

    fixture.componentInstance['onTableSelectionChange']([fixture.componentInstance.flatRows()[0]]);
    fixture.detectChanges();

    expect(proposals).toEqual([['workspace']]);
    expect(fixture.componentInstance.selectedRows()).toEqual([]);
  });

  it('propagates checkbox selection through loaded descendants and renders partial ancestors', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', [
      {
        id: 'root',
        label: 'Root',
        expanded: true,
        children: [
          { id: 'one', label: 'One' },
          { id: 'two', label: 'Two' },
        ],
      },
    ]);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('selectionMode', 'checkbox');
    const proposals: string[][] = [];
    fixture.componentInstance.selectionChange.subscribe((nodes) =>
      proposals.push(nodes.map((node) => node.id)),
    );
    fixture.detectChanges();

    const rows = fixture.componentInstance.flatRows() as NeuTreeTableRow[];
    fixture.componentInstance['onTableSelectionChange']([rows[1]]);
    fixture.detectChanges();
    expect(proposals.at(-1)).toEqual(['one']);
    const rootCheckbox = fixture.nativeElement.querySelector(
      'tr[data-neu-tree-node-id="root"] input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(rootCheckbox.indeterminate).toBe(true);
    expect(rootCheckbox.getAttribute('aria-checked')).toBe('mixed');

    fixture.componentInstance['onTableSelectionChange']([rows[0], rows[1], rows[2]]);
    expect(proposals.at(-1)).toEqual(['root', 'one', 'two']);
  });

  it('exposes truthful row hierarchy aria and moves between parent and child with arrows', async () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      'tr[data-neu-tree-node-id="workspace"]',
    ) as HTMLTableRowElement;
    const child = fixture.nativeElement.querySelector(
      'tr[data-neu-tree-node-id="ui-core"]',
    ) as HTMLTableRowElement;
    expect(root.getAttribute('aria-level')).toBe('1');
    expect(root.getAttribute('aria-expanded')).toBe('true');
    expect(child.getAttribute('aria-level')).toBe('2');

    root.focus();
    root.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    expect(document.activeElement).toBe(child);
    child.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(root);
  });

  it('does not hijack arrow keys from interactive descendants', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector(
      '.neu-tree-table__toggle',
    ) as HTMLButtonElement;
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    toggle.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('maps row editing to immutable consumer data keyed by node identity', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    const saves: NeuTreeTableRowEditEvent<RepoMeta>[] = [];
    fixture.componentInstance.rowEditSave.subscribe((event) =>
      saves.push(event as NeuTreeTableRowEditEvent<RepoMeta>),
    );
    fixture.detectChanges();
    const row = fixture.componentInstance.flatRows()[0];
    fixture.componentInstance['onTableRowEdit']('save', {
      row,
      draft: { ...row, owner: 'DX' },
      rowKey: 'workspace',
      rowIndex: 0,
      editingRowKeys: [],
    });
    expect(saves[0].node).toBe(NODES[0]);
    expect(saves[0].draft).toEqual({ owner: 'DX', status: 'active' });
    expect(saves[0].draft).not.toHaveProperty('__treeNode');
    expect(NODES[0].data?.owner).toBe('Platform');
  });

  it('relays structural composition and keeps Neural-owned node semantics', () => {
    const fixture = TestBed.createComponent(TreeTableCompositionHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('caption')?.textContent).toContain(
      'Repository hierarchy',
    );
    expect(fixture.nativeElement.querySelector('.custom-node')?.textContent).toContain(
      'Workspace level 0',
    );
    expect(
      fixture.nativeElement.querySelector('tr[data-neu-tree-node-id="workspace"]'),
    ).toBeTruthy();
  });

  it('keeps projected node-template selection and expansion callbacks live', () => {
    const fixture = TestBed.createComponent(TreeTableCompositionHostComponent);
    fixture.detectChanges();
    const component = fixture.debugElement.query(By.directive(NeuTreeTableComponent))
      .componentInstance as NeuTreeTableComponent;
    const selections: string[][] = [];
    const expansions: string[][] = [];
    component.selectionChange.subscribe((nodes) => selections.push(nodes.map((node) => node.id)));
    component.expandedKeysChange.subscribe((keys) => expansions.push([...keys]));

    (fixture.nativeElement.querySelector('.custom-node-select') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.custom-node-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(selections.at(-1)).toEqual(['workspace']);
    expect(expansions.at(-1)).toEqual([]);
  });

  it('composes a consumer tree-column template inside indentation and toggler chrome', () => {
    const fixture = TestBed.createComponent(TreeTableConsumerCellHostComponent);
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('.neu-tree-table__cell');
    expect(cell.querySelector('.neu-tree-table__toggle')).toBeTruthy();
    expect(cell.querySelector('.consumer-tree-cell')?.textContent).toContain('custom Workspace');
  });

  it('strictly composes managed primary node rows plus non-semantic sibling rows', () => {
    const fixture = TestBed.createComponent(TreeTableBodySectionHostComponent);
    fixture.detectChanges();
    const primary = fixture.nativeElement.querySelector(
      '.advanced-node-row',
    ) as HTMLTableRowElement;
    const detail = fixture.nativeElement.querySelector(
      '.advanced-detail-row',
    ) as HTMLTableRowElement;
    expect(primary.getAttribute('role')).toBe('row');
    expect(primary.getAttribute('aria-level')).toBe('1');
    expect(primary.tabIndex).toBe(0);
    expect(detail.hasAttribute('data-neu-tree-node-id')).toBe(false);
  });

  it('keeps managed body-section focus navigation on semantic node rows', async () => {
    const fixture = TestBed.createComponent(TreeTableBodySectionHostComponent);
    fixture.detectChanges();
    const rows = () =>
      [...fixture.nativeElement.querySelectorAll('.advanced-node-row')] as HTMLTableRowElement[];
    const press = (row: HTMLTableRowElement, key: string) =>
      row.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

    rows()[0].focus();
    press(rows()[0], 'ArrowDown');
    expect(document.activeElement).toBe(rows()[1]);
    press(rows()[1], 'ArrowUp');
    expect(document.activeElement).toBe(rows()[0]);
    press(rows()[1], 'ArrowLeft');
    expect(document.activeElement).toBe(rows()[0]);
    press(rows()[0], 'ArrowRight');
    await Promise.resolve();
    expect(document.activeElement).toBe(rows()[1]);
    press(rows()[0], 'ArrowLeft');
    fixture.detectChanges();
    press(rows()[0], 'ArrowRight');
    fixture.detectChanges();
    expect(rows().length).toBeGreaterThan(1);
  });

  it('strictly compiles a representative consumer using only the final canonical API', () => {
    const fixture = TestBed.createComponent(TreeTableFinalApiHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strict-final-node')?.textContent).toContain(
      'Workspace / 0',
    );
  });

  it('projects structural, grouped, paginator, loading, empty, view, and editor templates', () => {
    const fixture = TestBed.createComponent(TreeTableAllSlotsHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.slot-toolbar')?.textContent).toContain('Toolbar');
    expect(fixture.nativeElement.querySelector('.slot-caption')?.textContent).toContain('Caption');
    expect(fixture.nativeElement.querySelector('.slot-header')?.textContent).toContain('Header');
    expect(fixture.nativeElement.querySelector('.slot-footer')?.textContent).toContain('Footer');
    expect(fixture.nativeElement.querySelector('.slot-summary')?.textContent).toContain('Summary');
    expect(fixture.nativeElement.querySelector('.slot-page-left')?.textContent).toContain('Left');
    expect(fixture.nativeElement.querySelector('.slot-page-right')?.textContent).toContain('Right');
    expect(fixture.nativeElement.querySelector('.slot-group-header')?.textContent).toContain(
      'Platform',
    );
    expect(fixture.nativeElement.querySelector('.slot-group-footer')?.textContent).toContain(
      'Platform',
    );
    expect(fixture.nativeElement.querySelector('.slot-cell-view')?.textContent).toContain(
      'Platform',
    );

    const treeTable = fixture.debugElement.query(By.directive(NeuTreeTableComponent))
      .componentInstance as NeuTreeTableComponent;
    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent;
    table.startCellEdit(treeTable.flatRows()[0], treeTable.resolvedColumns()[1]);
    fixture.detectChanges();
    const editor = fixture.nativeElement.querySelector('.slot-cell-editor') as HTMLInputElement;
    expect(editor.value).toBe('Platform');
    editor.dispatchEvent(new Event('input', { bubbles: true }));

    const loadingFixture = TestBed.createComponent(TreeTableAllSlotsHostComponent);
    loadingFixture.componentInstance.loading = true;
    loadingFixture.detectChanges();
    expect(loadingFixture.nativeElement.querySelector('.slot-loading')?.textContent).toContain(
      'Loading',
    );

    const emptyFixture = TestBed.createComponent(TreeTableAllSlotsHostComponent);
    emptyFixture.componentInstance.nodes = [];
    emptyFixture.detectChanges();
    expect(emptyFixture.nativeElement.querySelector('.slot-empty')?.textContent).toContain(
      'No rows found',
    );
  });

  it('projects the tree body context and keeps its selection and expansion callbacks live', () => {
    const fixture = TestBed.createComponent(TreeTableBodyHostComponent);
    const selection: string[][] = [];
    const expansion: string[][] = [];
    fixture.detectChanges();
    const treeTable = fixture.debugElement.query(By.directive(NeuTreeTableComponent))
      .componentInstance as NeuTreeTableComponent;
    treeTable.selectionChange.subscribe((nodes) => selection.push(nodes.map((node) => node.id)));
    treeTable.expandedKeysChange.subscribe((keys) => expansion.push([...keys]));

    expect(fixture.nativeElement.querySelector('.slot-tree-body')?.textContent).toContain(
      'Workspace / 0',
    );
    (fixture.nativeElement.querySelector('.body-select') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.body-expand') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(selection.length).toBeGreaterThan(0);
    expect(selection.every((proposal) => proposal.join(',') === 'workspace')).toBe(true);
    expect(expansion.at(-1)).toEqual([]);
  });

  it('maps the complete inner-table event lifecycle to tree identities and request reasons', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('selectionMode', 'multiple');
    fixture.componentRef.setInput('editMode', 'row');
    fixture.componentRef.setInput('serverSide', true);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent;
    const row = component.flatRows()[0];
    const column = COLUMNS[1] as unknown as NeuTableColumn<Record<string, unknown>>;
    const received: string[] = [];

    component.nodeSelect.subscribe((event) => received.push(`select:${event.node.id}`));
    component.nodeUnselect.subscribe((event) => received.push(`unselect:${event.node.id}`));
    component.cellEditInit.subscribe((event) => received.push(`cell-init:${event.node.id}`));
    component.cellEditCancel.subscribe((event) => received.push(`cell-cancel:${event.node.id}`));
    component.editValidationError.subscribe((event) => received.push(`invalid:${event.message}`));
    component.queryChange.subscribe((event) => received.push(`query:${event.search}`));
    component.sortChange.subscribe((event) => received.push(`sort:${event[0]?.dir}`));
    component.lazyRequest.subscribe((event) => received.push(`lazy:${event.reason}`));
    component.editingRowKeysChange.subscribe((keys) => received.push(`keys:${keys.join(',')}`));
    component.rowEditInit.subscribe((event) => received.push(`row-init:${event.node.id}`));
    component.rowEditSave.subscribe((event) => received.push(`row-save:${event.node.id}`));
    component.rowEditCancel.subscribe((event) => received.push(`row-cancel:${event.node.id}`));

    const selectionEvent = {
      row,
      key: 'workspace',
      index: 0,
      source: 'row',
      selection: [row],
    } as const;
    table.rowSelect.emit(selectionEvent);
    table.rowUnselect.emit(selectionEvent);
    const cellEvent = {
      row,
      rowKey: 'workspace',
      rowIndex: 0,
      column,
      value: 'DX',
      previousValue: 'Platform',
    };
    table.cellEditInit.emit(cellEvent);
    table.cellEditCancel.emit(cellEvent);
    table.editValidationError.emit({
      mode: 'cell',
      row,
      rowKey: 'workspace',
      rowIndex: 0,
      column,
      value: 'DX',
      message: 'Rejected',
    });
    const nextQuery = query('server');
    table.queryChange.emit(nextQuery);
    table.sortChange.emit([{ key: 'label', dir: 'desc' }]);
    table.lazyRequest.emit({
      reason: 'virtual-scroll',
      query: nextQuery,
      range: { first: 4, end: 8 },
    } as never);
    table.editingRowKeysChange.emit([123, 'workspace']);
    const rowEditEvent = {
      row,
      draft: { ...row, owner: 'DX' },
      rowKey: 'workspace',
      rowIndex: 0,
      editingRowKeys: ['workspace'],
    };
    table.rowEditInit.emit(rowEditEvent);
    table.rowEditSave.emit(rowEditEvent);
    table.rowEditCancel.emit(rowEditEvent);

    expect(received).toEqual([
      'select:workspace',
      'unselect:workspace',
      'cell-init:workspace',
      'cell-cancel:workspace',
      'invalid:Rejected',
      'query:server',
      'lazy:query',
      'sort:desc',
      'lazy:virtual',
      'keys:123,workspace',
      'row-init:workspace',
      'row-save:workspace',
      'row-cancel:workspace',
    ]);
  });

  it('implements the public scroll, reset, and row-edit boundary for present and missing nodes', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('editMode', 'row');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent;
    const resetScroll = vi.spyOn(table, 'resetVirtualScroll');
    const scrollIndex = vi.spyOn(table, 'scrollToIndex');
    const scrollOffset = vi.spyOn(table, 'scrollToOffset');
    const resetState = vi.spyOn(table, 'resetState');
    const startEdit = vi.spyOn(table, 'startRowEdit');
    const saveEdit = vi.spyOn(table, 'saveRowEdit').mockReturnValue(true);
    const cancelEdit = vi.spyOn(table, 'cancelRowEdit');

    component.resetScrollTop('smooth');
    component.scrollToVirtualIndex(2, 'smooth');
    component.scrollTo({ index: 3 });
    component.scrollTo({ offset: 120, behavior: 'smooth' });
    component.scrollTo({ nodeId: 'workspace' });
    component.scrollTo({});
    expect(component.scrollToNode('missing')).toBe(false);
    component.reset();
    expect(component.startRowEdit('missing')).toBe(false);
    expect(component.startRowEdit('workspace')).toBe(true);
    expect(component.saveRowEdit('missing')).toBe(false);
    expect(component.saveRowEdit('workspace')).toBe(true);
    expect(component.cancelRowEdit('missing')).toBe(false);
    expect(component.cancelRowEdit('workspace')).toBe(true);

    expect(resetScroll).toHaveBeenCalledWith('smooth');
    expect(resetScroll).toHaveBeenCalledWith('auto');
    expect(scrollIndex).toHaveBeenCalledWith(2, 'smooth');
    expect(scrollIndex).toHaveBeenCalledWith(3, 'auto');
    expect(scrollIndex).toHaveBeenCalledWith(0, 'auto');
    expect(scrollOffset).toHaveBeenCalledWith(120, 'smooth');
    expect(resetState).toHaveBeenCalledTimes(1);
    expect(startEdit).toHaveBeenCalledTimes(1);
    expect(saveEdit).toHaveBeenCalledTimes(1);
    expect(cancelEdit).toHaveBeenCalledTimes(1);
  });

  it('covers lazy expansion and controlled row-edit validation boundaries', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    const lazyNode: NeuTreeTableNode = { id: 'lazy', label: 'Lazy', leaf: false };
    fixture.componentRef.setInput('nodes', [lazyNode]);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('editMode', 'row');
    const lazy: string[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) => lazy.push(event.reason));
    fixture.detectChanges();

    fixture.componentInstance.toggleNode(lazyNode);
    fixture.detectChanges();
    expect(lazy).toEqual(['node-expand']);

    const row = fixture.componentInstance.flatRows()[0];
    const tableEvent = {
      row,
      draft: { ...row, owner: 'DX' },
      rowKey: 'lazy',
      rowIndex: 0,
      editingRowKeys: ['lazy'],
    };
    expect(fixture.componentInstance.tableRowEditValidator(tableEvent)).toBe(true);

    const validator = vi.fn(() => ({ valid: false, message: 'Owner required' }));
    fixture.componentRef.setInput('rowEditValidator', validator);
    fixture.detectChanges();
    expect(fixture.componentInstance.tableRowEditValidator(tableEvent)).toEqual({
      valid: false,
      message: 'Owner required',
    });
    expect(validator).toHaveBeenCalledWith(
      expect.objectContaining({ node: lazyNode, draft: { owner: 'DX' } }),
    );
  });

  it('prunes uncontrolled selection after nodes are replaced and preserves controlled stale values', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('selectionMode', 'multiple');
    fixture.detectChanges();
    fixture.componentInstance['onTableSelectionChange']([fixture.componentInstance.flatRows()[0]]);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedRows().map((row) => row['id'])).toEqual(['workspace']);

    fixture.componentRef.setInput('nodes', [{ id: 'replacement', label: 'Replacement' }]);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedRows()).toEqual([]);

    fixture.componentRef.setInput('selection', NODES[0]);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedRows()).toEqual([]);
  });

  it('supports row-level Home, End, selection, expansion, and relative keyboard boundaries', async () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('selectionMode', 'multiple');
    const selections: string[][] = [];
    fixture.componentInstance.selectionChange.subscribe((nodes) =>
      selections.push(nodes.map((node) => node.id)),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const findRow = (id: string) =>
      fixture.nativeElement.querySelector(
        `tr[data-neu-tree-node-id="${id}"]`,
      ) as HTMLTableRowElement;
    const press = (row: HTMLTableRowElement, key: string) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      row.dispatchEvent(event);
      return event;
    };
    let root = findRow('workspace');
    let child = findRow('ui-core');

    root.focus();
    press(root, 'End');
    expect(document.activeElement).toBe(child);
    press(child, 'Home');
    expect(document.activeElement).toBe(root);
    press(root, 'ArrowUp');
    press(child, 'ArrowDown');
    press(root, ' ');
    fixture.detectChanges();
    root = findRow('workspace');
    press(root, 'Enter');
    expect(selections).toEqual([['workspace'], []]);

    press(root, 'ArrowLeft');
    fixture.detectChanges();
    root = findRow('workspace');
    expect(root.getAttribute('aria-expanded')).toBe('false');
    press(root, 'ArrowRight');
    fixture.detectChanges();
    root = findRow('workspace');
    child = findRow('ui-core');
    press(root, 'ArrowRight');
    await Promise.resolve();
    expect(document.activeElement).toBe(child);
    press(child, 'ArrowLeft');
    expect(document.activeElement).toBe(root);
    expect(press(child, 'PageDown').defaultPrevented).toBe(false);

    press(root, 'ArrowLeft');
    fixture.detectChanges();
    root = findRow('workspace');
    root.style.direction = 'rtl';
    press(root, 'ArrowLeft');
    fixture.detectChanges();
    expect(findRow('workspace').getAttribute('aria-expanded')).toBe('true');
  });

  it('projects cycles, shared branches, and depth 5,000 without mutating consumer nodes', () => {
    const self: NeuTreeTableNode<RepoMeta> = {
      id: 'self',
      label: 'Self',
      data: { owner: 'A', status: 'active' },
    };
    const sibling: NeuTreeTableNode<RepoMeta> = {
      id: 'sibling',
      label: 'Sibling',
      data: { owner: 'A', status: 'active' },
    };
    self.children = [self, sibling];
    const shared: NeuTreeTableNode<RepoMeta> = {
      id: 'shared',
      label: 'Shared',
      data: { owner: 'B', status: 'active' },
    };
    const left: NeuTreeTableNode<RepoMeta> = {
      id: 'left',
      label: 'Left',
      data: { owner: 'B', status: 'active' },
      children: [shared],
    };
    const right: NeuTreeTableNode<RepoMeta> = {
      id: 'right',
      label: 'Right',
      data: { owner: 'C', status: 'active' },
      children: [shared],
    };
    const ancestor: NeuTreeTableNode<RepoMeta> = {
      id: 'ancestor',
      label: 'Ancestor',
      data: { owner: 'C', status: 'active' },
    };
    const child: NeuTreeTableNode<RepoMeta> = {
      id: 'child',
      label: 'Child',
      data: { owner: 'C', status: 'active' },
    };
    const grandchild: NeuTreeTableNode<RepoMeta> = {
      id: 'grandchild',
      label: 'Grandchild',
      data: { owner: 'C', status: 'active' },
    };
    ancestor.children = [child];
    child.children = [grandchild];
    grandchild.children = [ancestor];
    const options: Parameters<typeof projectNeuTreeTable<RepoMeta>>[1] = {
      query: query(),
      sort: [],
      filterMode: 'strict' as const,
      exactMatch: false,
      columns: COLUMNS as unknown as NeuTableColumn<Record<string, unknown>>[],
    };
    const projection = projectNeuTreeTable([self, left, right, ancestor], options);
    expect(projection.roots[0].children.map((entry) => entry.node.id)).toEqual(['sibling']);
    expect(projection.roots[1].children[0].node).toBe(shared);
    expect(projection.roots[2].children[0].node).toBe(shared);
    expect(projection.roots[3].children[0].children[0].node).toBe(grandchild);
    expect(projection.roots[3].children[0].children[0].children).toHaveLength(0);
    expect(self.children).toEqual([self, sibling]);

    let deep: NeuTreeTableNode<RepoMeta> = {
      id: '5000',
      label: '5000',
      data: { owner: 'D', status: 'active' },
    };
    for (let depth = 4_999; depth >= 0; depth -= 1) {
      deep = {
        id: String(depth),
        label: String(depth),
        data: { owner: 'D', status: 'active' },
        children: [deep],
      };
    }
    const deepProjection = projectNeuTreeTable([deep], options);
    expect(deepProjection.nodesById.size).toBe(5_001);
  });
});
