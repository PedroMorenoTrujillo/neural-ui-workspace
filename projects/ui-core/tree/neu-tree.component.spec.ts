import { TestBed } from '@angular/core/testing';
import { NeuTreeComponent, NeuTreeNode } from './neu-tree.component';

const NODES: NeuTreeNode[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    expanded: true,
    children: [
      {
        id: 'apps',
        label: 'Apps',
        children: [{ id: 'admin', label: 'Admin portal' }],
      },
      { id: 'design', label: 'Design system', description: 'Shared tokens' },
    ],
  },
  { id: 'archive', label: 'Archive', disabled: true },
];

describe('NeuTreeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuTreeComponent],
    }).compileComponents();
  });

  it('renders root and visible child nodes', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Workspace');
    expect(text).toContain('Apps');
    expect(text).toContain('Design system');
  });

  it('toggles collapsed branches', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Admin portal');

    const buttons = fixture.nativeElement.querySelectorAll('.neu-tree__toggle');
    buttons[1].click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Admin portal');
  });

  it('filters nodes and preserves matching ancestry', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('searchable', true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.neu-tree__search-input');
    input.value = 'admin';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Workspace');
    expect(text).toContain('Apps');
    expect(text).toContain('Admin portal');
    expect(text).not.toContain('Design system');
  });

  it('emits single selection when a node is activated', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', true);
    const emitted: string[][] = [];

    fixture.componentInstance.selectionChange.subscribe((nodes) => {
      emitted.push(nodes.map((node) => node.id));
    });

    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.neu-tree__content');
    buttons[1].click();
    fixture.detectChanges();

    expect(emitted.at(-1)).toEqual(['apps']);
  });

  it('supports multiple selection with checkboxes', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selectionMode', 'multiple');
    const emitted: string[][] = [];

    fixture.componentInstance.selectionChange.subscribe((nodes) => {
      emitted.push(nodes.map((node) => node.id));
    });

    fixture.detectChanges();
    const checkboxes = fixture.nativeElement.querySelectorAll(
      '.neu-tree__checkbox input[type="checkbox"]',
    );
    checkboxes[0].checked = true;
    checkboxes[0].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    checkboxes[1].checked = true;
    checkboxes[1].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(emitted.at(-1)).toEqual(['workspace', 'apps']);
  });

  it('removes a selected node when its checkbox is unchecked in multiple mode', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selectionMode', 'multiple');
    const emitted: string[][] = [];

    fixture.componentInstance.selectionChange.subscribe((nodes) => {
      emitted.push(nodes.map((node) => node.id));
    });

    fixture.detectChanges();
    const checkboxes = fixture.nativeElement.querySelectorAll(
      '.neu-tree__checkbox input[type="checkbox"]',
    );
    checkboxes[0].checked = true;
    checkboxes[0].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    checkboxes[0].checked = false;
    checkboxes[0].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(emitted.at(-1)).toEqual([]);
  });

  it('keeps checkbox clicks scoped to the checkbox primitive', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selectionMode', 'multiple');
    const clicks: string[] = [];
    fixture.componentInstance.nodeClick.subscribe((node) => clicks.push(node.id));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.neu-tree__checkbox') as HTMLElement).click();
    expect(clicks).toEqual([]);
  });

  it('shows the empty label when filtering returns no matches', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('searchable', true);
    fixture.componentRef.setInput('emptyLabel', 'Nothing found');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.neu-tree__search-input');
    input.value = 'zzz';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nothing found');
  });

  it('does not emit selection or nodeClick for disabled nodes', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', true);
    let selectionCount = 0;
    let clickCount = 0;
    fixture.componentInstance.selectionChange.subscribe(() => selectionCount++);
    fixture.componentInstance.nodeClick.subscribe(() => clickCount++);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.neu-tree__content');
    buttons[3].click();
    fixture.detectChanges();

    expect(selectionCount).toBe(0);
    expect(clickCount).toBe(0);
  });

  it('preserves nested expanded descendants from the input model', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
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
            children: [{ id: 'admin', label: 'Admin portal' }],
          },
        ],
      },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Admin portal');
  });

  it('ignores checkbox changes for disabled nodes', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selectionMode', 'multiple');
    let selectionCount = 0;
    fixture.componentInstance.selectionChange.subscribe(() => selectionCount++);
    fixture.detectChanges();

    fixture.componentInstance.onCheckboxChange(NODES[1], {
      target: { checked: true },
    } as unknown as Event);
    fixture.detectChanges();

    expect(selectionCount).toBe(0);
  });

  it('emits nodeClick but not selection when selectable is false', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', false);
    let selectionCount = 0;
    let clickCount = 0;
    fixture.componentInstance.selectionChange.subscribe(() => selectionCount++);
    fixture.componentInstance.nodeClick.subscribe(() => clickCount++);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.neu-tree__content');
    buttons[1].click();
    fixture.detectChanges();

    expect(clickCount).toBe(1);
    expect(selectionCount).toBe(0);
  });

  it('renders badges and keeps search-expanded descendants visible', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', [
      {
        id: 'root',
        label: 'Root',
        badge: 'NEW',
        expanded: false,
        children: [{ id: 'leaf', label: 'Leaf result', description: 'Nested match' }],
      },
    ]);
    fixture.componentRef.setInput('searchable', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('NEW');
    const input = fixture.nativeElement.querySelector('.neu-tree__search-input') as HTMLInputElement;
    input.value = 'leaf';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Leaf result');
    expect(fixture.nativeElement.textContent).toContain('Nested match');
  });

  it('uses expanded state as fallback while search is active', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    const node: NeuTreeNode = {
      id: 'root',
      label: 'Root',
      children: [{ id: 'leaf', label: 'Leaf' }],
    };
    fixture.componentRef.setInput('nodes', [node]);
    fixture.componentRef.setInput('searchable', true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.neu-tree__search-input') as HTMLInputElement;
    input.value = 'root';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.isRenderedExpanded(node)).toBe(false);
    fixture.componentInstance.toggleNode(node);
    expect(fixture.componentInstance.isRenderedExpanded(node)).toBe(true);
  });

  it('toggleNode ignores leaf and disabled nodes and can collapse open parents', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    const emitted: string[][] = [];
    fixture.componentInstance.expansionChange.subscribe((keys) => emitted.push(keys));
    fixture.detectChanges();

    fixture.componentInstance.toggleNode(NODES[0].children![1]);
    fixture.componentInstance.toggleNode(NODES[1]);
    expect(emitted).toEqual([]);

    fixture.componentInstance.toggleNode(NODES[0]);
    fixture.detectChanges();
    expect(emitted.at(-1)).not.toContain('workspace');
  });

  it('multiple activation toggles selected nodes off again', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selectionMode', 'multiple');
    const emitted: string[][] = [];
    fixture.componentInstance.selectionChange.subscribe((nodes) => emitted.push(nodes.map((node) => node.id)));
    fixture.detectChanges();

    fixture.componentInstance.activateNode(NODES[0]);
    fixture.componentInstance.activateNode(NODES[0]);
    fixture.detectChanges();

    expect(emitted.at(-1)).toEqual([]);
  });

  it('single checkbox changes can clear a selected node', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selectionMode', 'single');
    const emitted: string[][] = [];
    fixture.componentInstance.selectionChange.subscribe((nodes) =>
      emitted.push(nodes.map((node) => node.id)),
    );
    fixture.detectChanges();

    fixture.componentInstance.onCheckboxChange(NODES[0], {
      target: { checked: true },
    } as unknown as Event);
    fixture.componentInstance.onCheckboxChange(NODES[0], {
      target: { checked: false },
    } as unknown as Event);

    expect(emitted.at(-1)).toEqual([]);
  });

  it('activateNode returns early for disabled nodes when called directly', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', true);
    let clicks = 0;
    fixture.componentInstance.nodeClick.subscribe(() => clicks++);
    fixture.detectChanges();

    fixture.componentInstance.activateNode(NODES[1]);

    expect(clicks).toBe(0);
  });
});
