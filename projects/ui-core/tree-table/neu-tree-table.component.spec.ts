import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuTableColumn, NeuTableExpandDirective } from '@neural-ui/core/table';
import { By } from '@angular/platform-browser';
import { NeuTableComponent } from '@neural-ui/core/table';
import {
  NeuTreeTableComponent,
  NeuTreeTableNode,
  NeuTreeTableRow,
} from './neu-tree-table.component';

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

@Component({
  standalone: true,
  imports: [NeuTreeTableComponent, NeuTableExpandDirective],
  template: `
    <neu-tree-table [nodes]="nodes" [columns]="columns" [expandable]="true">
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
    fixture.componentRef.setInput('selectable', true);

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

    fixture.componentInstance.onTableRowClick(fixture.componentInstance.flatRows()[0]);
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
    fixture.componentRef.setInput('expandLabel', 'Expand');
    fixture.componentRef.setInput('collapseLabel', 'Collapse');
    fixture.detectChanges();

    const row = fixture.componentInstance.flatRows()[0] as NeuTreeTableRow<RepoMeta>;
    expect(fixture.componentInstance.treeIndent(row)).toBe(0);
    expect(fixture.componentInstance.isTreeRowDisabled(row)).toBe(false);
    expect(fixture.componentInstance.treeToggleAriaLabel(row)).toBe('Collapse');
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
    fixture.componentInstance.expansionChange.subscribe(() => expansionCount++);
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
    fixture.componentInstance.expansionChange.subscribe((ids) => expansionStates.push(ids));
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
    fixture.componentRef.setInput('exportable', true);
    fixture.componentRef.setInput('exportFormats', ['csv', 'json']);
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualScrollVisibleItems', 12);
    fixture.componentRef.setInput('resizableColumns', true);
    fixture.componentRef.setInput('reorderableColumns', true);
    fixture.componentRef.setInput('columnChooser', true);
    fixture.componentRef.setInput('inlineEdit', true);
    fixture.componentRef.setInput('inlineEditLabel', 'Edit tree cell');
    fixture.componentRef.setInput('saveInlineEditLabel', 'Save tree cell');
    fixture.componentRef.setInput('cancelInlineEditLabel', 'Cancel tree cell edit');
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
    expect(table.exportable()).toBe(true);
    expect(table.exportFormats()).toEqual(['csv', 'json']);
    expect(table.virtualScroll()).toBe(true);
    expect(table.virtualScrollVisibleItems()).toBe(12);
    expect(table.resizableColumns()).toBe(true);
    expect(table.reorderableColumns()).toBe(true);
    expect(table.columnChooser()).toBe(true);
    expect(table.inlineEdit()).toBe(true);
    expect(table.inlineEditLabel()).toBe('Edit tree cell');
    expect(table.saveInlineEditLabel()).toBe('Save tree cell');
    expect(table.cancelInlineEditLabel()).toBe('Cancel tree cell edit');
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
      events.push(`selection-action:${event.action.key}:${event.nodes.map((node) => node.id).join(',')}`),
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

  it('forwards table state, search, layout and row events without changing their contract', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('columns', COLUMNS);
    const row = fixture.componentInstance.flatRows()[0] as NeuTreeTableRow<RepoMeta>;
    const received: unknown[] = [];
    fixture.componentInstance.nodeClick.subscribe((node) => received.push(`click:${node.id}`));
    fixture.componentInstance.searchChange.subscribe((value) => received.push(`search:${value}`));
    fixture.componentInstance.serverStateChange.subscribe((value) => received.push(value));
    fixture.componentInstance.columnResize.subscribe((value) => received.push(value));
    fixture.componentInstance.columnReorder.subscribe((value) => received.push(value));
    fixture.componentInstance.layoutChange.subscribe((value) => received.push(value));
    fixture.detectChanges();

    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent;
    const state = { page: 2, pageSize: 20, search: 'core', sort: null, multiSort: [] } as any;
    const resize = { key: 'label', width: 320 };
    const reorder = { previousIndex: 0, currentIndex: 1, columns: [] } as any;
    const layout = { columns: [], pageSize: 20 } as any;
    table.rowClick.emit(row);
    table.searchChange.emit('core');
    table.serverStateChange.emit(state);
    table.columnResize.emit(resize);
    table.columnReorder.emit(reorder);
    table.layoutChange.emit(layout);

    expect(received).toEqual(['click:workspace', 'search:core', state, resize, reorder, layout]);
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
    expect(treeTable.expandTemplateRef(directive!)).toBe(directive!.templateRef);
    expect(treeTable.expandTemplateContext(row)).toEqual(
      expect.objectContaining({
        $implicit: NODES[0],
        node: NODES[0],
        row: expect.objectContaining({ id: 'workspace' }),
      }),
    );
    (fixture.nativeElement.querySelector('.neu-table__expand-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tree-detail')?.textContent).toContain('Workspace / 0');
  });
});
