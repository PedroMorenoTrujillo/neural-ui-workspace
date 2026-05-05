import { TestBed } from '@angular/core/testing';
import { NeuTableColumn } from '@neural-ui/core/table';
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

describe('NeuTreeTableComponent', () => {
  beforeEach(async () => {
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
    const checkboxes = fixture.nativeElement.querySelectorAll('.neu-table__checkbox');
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
});
