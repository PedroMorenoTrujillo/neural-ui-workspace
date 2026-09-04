import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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
    const input = fixture.nativeElement.querySelector(
      '.neu-tree__search-input',
    ) as HTMLInputElement;
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

    const input = fixture.nativeElement.querySelector(
      '.neu-tree__search-input',
    ) as HTMLInputElement;
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
    fixture.componentInstance.selectionChange.subscribe((nodes) =>
      emitted.push(nodes.map((node) => node.id)),
    );
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

  it('owns one tree tab stop and supports hierarchy, linear navigation, Home and End', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.detectChanges();
    const items = () =>
      Array.from(fixture.nativeElement.querySelectorAll('[role="treeitem"]')) as HTMLElement[];
    expect(items().filter((item) => item.tabIndex === 0)).toHaveLength(1);
    expect(items().at(-1)?.getAttribute('aria-disabled')).toBe('true');

    items()[0].focus();
    items()[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(items()[1]);
    items()[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(items().some((item) => item.textContent?.includes('Admin portal'))).toBe(true);
    items()[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement?.textContent).toContain('Admin portal');
    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(items()[0]);
    items()[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement?.textContent).toContain('Design system');
  });

  it('supports RTL collapse, activation and unhandled-key navigation paths', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();
    fixture.nativeElement.style.direction = 'rtl';
    const component = fixture.componentInstance;
    const selected: string[][] = [];
    component.selectionChange.subscribe((nodes) => selected.push(nodes.map((node) => node.id)));

    component.onNodeKeydown(NODES[0], new KeyboardEvent('keydown', { key: 'Unidentified' }));
    expect(component.isRenderedExpanded(NODES[0])).toBe(true);
    component.onNodeKeydown(
      NODES[0],
      new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }),
    );
    expect(component.isRenderedExpanded(NODES[0])).toBe(false);
    component.onNodeKeydown(NODES[0], new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(selected.at(-1)).toEqual(['workspace']);
  });

  it('removes nested selection controls from sequential Tab order', async () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selectionMode', 'multiple');
    fixture.detectChanges();
    await fixture.whenStable();
    const nested = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.neu-tree__toggle, .neu-tree__content, .neu-tree__checkbox input',
      ),
    ) as HTMLElement[];
    expect(nested.every((element) => element.tabIndex === -1)).toBe(true);
  });

  it('terminates self/ancestor cycles, preserves shared branches, and walks depth 5,000', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    const self: NeuTreeNode = { id: 'self', label: 'Self', expanded: true, children: [] };
    const parent: NeuTreeNode = { id: 'parent', label: 'Parent', expanded: true, children: [] };
    const child: NeuTreeNode = { id: 'child', label: 'Child', expanded: true, children: [] };
    const grandchild: NeuTreeNode = {
      id: 'grandchild',
      label: 'Grandchild',
      expanded: true,
      children: [],
    };
    const shared: NeuTreeNode = { id: 'shared', label: 'Shared' };
    self.children = [self, { id: 'safe', label: 'Safe sibling' }];
    parent.children = [child, shared];
    child.children = [grandchild];
    grandchild.children = [parent];
    fixture.componentRef.setInput('nodes', [
      self,
      parent,
      { id: 'right', label: 'Right', expanded: true, children: [shared] },
    ]);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.textContent).toContain('Safe sibling');
    expect(fixture.nativeElement.textContent.match(/Shared/g)).toHaveLength(2);

    let deep: NeuTreeNode = { id: 'deep-5000', label: 'Deep', expanded: true };
    for (let level = 4999; level >= 0; level -= 1) {
      deep = { id: `deep-${level}`, label: `Deep ${level}`, expanded: true, children: [deep] };
    }
    expect((fixture.componentInstance as any).collectExpandedKeys([deep]).size).toBe(5001);
  });

  it('keeps controlled selection and expansion authoritative while emitting proposals', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selection', [NODES[0].children![0]]);
    fixture.componentRef.setInput('expandedKeys', []);
    const selections: string[][] = [];
    const expansions: string[][] = [];
    fixture.componentInstance.selectionChange.subscribe((nodes) =>
      selections.push(nodes.map((node) => node.id)),
    );
    fixture.componentInstance.expansionChange.subscribe((keys) => expansions.push(keys));
    fixture.detectChanges();

    fixture.componentInstance.activateNode(NODES[0].children![1]);
    fixture.componentInstance.toggleNode(NODES[0]);

    expect(selections.at(-1)).toEqual(['design']);
    expect(fixture.componentInstance.isSelected('apps')).toBe(true);
    expect(fixture.componentInstance.isSelected('design')).toBe(false);
    expect(expansions.at(-1)).toEqual(['workspace']);
    expect(fixture.componentInstance.isExpanded('workspace')).toBe(false);
  });

  it('propagates checkbox state iteratively and stops at disabled boundaries', () => {
    const hidden: NeuTreeNode = { id: 'hidden', label: 'Hidden' };
    const root: NeuTreeNode = {
      id: 'root',
      label: 'Root',
      expanded: true,
      children: [
        { id: 'first', label: 'First' },
        { id: 'second', label: 'Second' },
        { id: 'locked', label: 'Locked', disabled: true, children: [hidden] },
      ],
    };
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', [root]);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selectionMode', 'checkbox');
    fixture.componentRef.setInput('showSelectAll', true);
    const proposals: string[][] = [];
    fixture.componentInstance.selectionChange.subscribe((nodes) =>
      proposals.push(nodes.map((node) => node.id)),
    );
    fixture.detectChanges();

    fixture.componentInstance.onCheckboxChange(root, true);
    expect(proposals.at(-1)).toEqual(['root', 'first', 'second']);
    expect(fixture.componentInstance.checkboxState('root')).toBe('checked');
    expect(fixture.componentInstance.checkboxState('hidden')).toBe('unchecked');

    fixture.componentInstance.onCheckboxChange(root.children![0], false);
    expect(fixture.componentInstance.checkboxState('root')).toBe('mixed');
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('[data-neu-tree-node-id="root"]')
        ?.getAttribute('aria-checked'),
    ).toBe('mixed');
    fixture.componentInstance.toggleSelectAll(false);
    expect(proposals.at(-1)).toEqual([]);
  });

  it('deduplicates lazy requests and exposes an explicit retry', () => {
    const lazy: NeuTreeNode = { id: 'lazy', label: 'Lazy', leaf: false };
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', [lazy]);
    fixture.componentRef.setInput('lazy', true);
    const requests: string[] = [];
    fixture.componentInstance.lazyRequest.subscribe((event) =>
      requests.push(`${event.reason}:${event.requestId}`),
    );
    fixture.detectChanges();

    fixture.componentInstance.toggleNode(lazy);
    fixture.componentInstance.toggleNode(lazy);
    fixture.componentInstance.toggleNode(lazy);
    fixture.componentInstance.retryLazy(lazy);

    expect(requests).toEqual(['expand:1', 'retry:2']);
    expect(fixture.componentInstance.isExpandable(lazy)).toBe(true);
  });

  it('windows a flattened 10k-capable projection without flattening on scroll', () => {
    const children = Array.from({ length: 10_000 }, (_, index) => ({
      id: `node-${index}`,
      label: `Node ${index}`,
    }));
    const root: NeuTreeNode = { id: 'root', label: 'Root', expanded: true, children };
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', [root]);
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('visibleRows', 5);
    fixture.componentRef.setInput('virtualOverscan', 1);
    fixture.detectChanges();

    const projection = fixture.componentInstance.flatVisibleNodes();
    expect(projection).toHaveLength(10_001);
    expect(fixture.componentInstance.virtualEntries()).toHaveLength(6);
    const viewport = fixture.nativeElement.querySelector('.neu-tree__virtual') as HTMLElement;
    viewport.scrollTop = 440;
    viewport.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(fixture.componentInstance.flatVisibleNodes()).toBe(projection);
    expect(fixture.componentInstance.virtualRange().start).toBe(9);
  });

  it('emits typed pointer/keyboard context and rejects DnD cycles', () => {
    const root = NODES[0];
    const child = root.children![0];
    const sibling = root.children![1];
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('dragDrop', true);
    fixture.detectChanges();
    const contexts: string[] = [];
    fixture.componentInstance.contextRequest.subscribe((event) => contexts.push(event.node.id));
    fixture.componentInstance.onNodeContext(
      child,
      new MouseEvent('contextmenu', { cancelable: true }),
    );
    fixture.componentInstance.onNodeKeydown(
      child,
      new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, cancelable: true }),
    );
    expect(contexts).toEqual(['apps', 'apps']);

    const rootDrag = fixture.componentInstance.dragData(root);
    const childTarget = fixture.componentInstance.dropTarget(child, 'inside');
    expect(fixture.componentInstance.acceptDrop(rootDrag, childTarget)).toBe(false);
    const childDrag = fixture.componentInstance.dragData(child);
    const siblingTarget = fixture.componentInstance.dropTarget(sibling, 'before');
    expect(fixture.componentInstance.acceptDrop(childDrag, siblingTarget)).toBe(true);
    const drops: string[] = [];
    fixture.componentInstance.nodeDrop.subscribe((event) =>
      drops.push(`${event.dragNode.id}:${event.position}:${event.targetNode.id}`),
    );
    fixture.componentInstance.onTreeDrop({
      data: childDrag,
      targetData: siblingTarget,
      interaction: 'keyboard',
      originalEvent: null,
      scope: ['neu-tree'],
      effect: 'move',
    });
    expect(drops).toEqual(['apps:before:design']);
  });

  it('routes recursive and virtual template interactions through the public intents', () => {
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selectionMode', 'checkbox');
    fixture.componentRef.setInput('showSelectAll', true);
    fixture.componentRef.setInput('dragDrop', true);
    fixture.detectChanges();

    const selectAll = fixture.nativeElement.querySelector(
      '.neu-tree__select-all input',
    ) as HTMLInputElement;
    selectAll.click();
    fixture.detectChanges();
    const firstTreeItem = fixture.nativeElement.querySelector('[role="treeitem"]') as HTMLElement;
    firstTreeItem.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));

    const drag = fixture.componentInstance.dragData(NODES[0].children![0]);
    const dropEvent = {
      data: drag,
      targetData: fixture.componentInstance.dropTarget(NODES[0].children![1], 'before'),
      scope: ['neu-tree'],
      effect: 'move' as const,
      interaction: 'keyboard' as const,
      originalEvent: null,
    };
    for (const dropZone of fixture.debugElement.queryAll(By.css('.neu-tree__drop')))
      dropZone.triggerEventHandler('drop', dropEvent);

    fixture.componentRef.setInput('virtualScroll', true);
    fixture.detectChanges();
    const flatItem = fixture.debugElement.query(By.css('.neu-tree__node--flat'));
    flatItem.triggerEventHandler('focus', new FocusEvent('focus'));
    flatItem.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'Home' }));
    flatItem.triggerEventHandler(
      'contextmenu',
      new MouseEvent('contextmenu', { cancelable: true }),
    );
    for (const dropZone of fixture.debugElement.queryAll(By.css('.neu-tree__drop')))
      dropZone.triggerEventHandler('drop', dropEvent);

    expect(fixture.componentInstance.selectAllState()).toBe('checked');
  });

  it('fails closed across disabled, duplicate, lazy and cross-tree edge policies', () => {
    const locked: NeuTreeNode = { id: 'locked', label: 'Locked', disabled: true };
    const fixed: NeuTreeNode = { id: 'fixed', label: 'Fixed', draggable: false };
    const leaf: NeuTreeNode = { id: 'leaf', label: 'Leaf', leaf: true };
    const blocked: NeuTreeNode = { id: 'blocked', label: 'Blocked', droppable: false };
    const loading: NeuTreeNode = { id: 'loading', label: 'Loading', leaf: false, loading: true };
    const noSelect: NeuTreeNode = { id: 'no-select', label: 'No select', selectable: false };
    const root: NeuTreeNode = {
      id: 'root',
      label: 'Root',
      children: [locked, fixed, leaf, blocked, loading, noSelect],
    };
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', [root]);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selectionMode', 'checkbox');
    fixture.componentRef.setInput('lazy', true);
    fixture.componentRef.setInput('loadingKeys', ['leaf']);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const rootData = component.dragData(root);

    expect(component.isMultiMode()).toBe(true);
    expect(component.isCheckboxMode()).toBe(true);
    expect(component.isLoading(loading)).toBe(true);
    expect(component.isLoading(leaf)).toBe(true);
    expect(component.navigationIndex('missing')).toBe(-1);
    expect(component.dragData({ id: 'missing', label: 'Missing' }).index).toBe(-1);
    expect(component.acceptDrop(null as never, component.dropTarget(leaf, 'before'))).toBe(false);
    expect(component.acceptDrop(rootData, null as never)).toBe(false);
    expect(component.acceptDrop(rootData, component.dropTarget(locked, 'before'))).toBe(false);
    expect(component.acceptDrop(rootData, component.dropTarget(blocked, 'before'))).toBe(false);
    expect(
      component.acceptDrop(component.dragData(locked), component.dropTarget(leaf, 'before')),
    ).toBe(false);
    expect(
      component.acceptDrop(component.dragData(fixed), component.dropTarget(leaf, 'before')),
    ).toBe(false);
    expect(component.acceptDrop(rootData, component.dropTarget(leaf, 'inside'))).toBe(false);
    expect(
      component.acceptDrop(
        { treeId: 'external', node: root, parent: null, index: 0 },
        component.dropTarget(leaf, 'before'),
      ),
    ).toBe(false);
    expect(
      component.acceptDrop(
        {
          treeId: 'external',
          node: { id: 'external', label: 'External' },
          parent: null,
          index: 0,
        },
        component.dropTarget(leaf, 'before'),
      ),
    ).toBe(true);

    component.activateNode(locked);
    component.activateNode(noSelect);
    component.toggleNode(locked);
    component.toggleNode(leaf);
    component.toggleNode(loading);
    component.onNodeContext(locked, new MouseEvent('contextmenu'));
    const checkboxEvent = new Event('change');
    Object.defineProperty(checkboxEvent, 'target', { value: { checked: true } });
    component.onCheckboxChange(leaf, checkboxEvent);
    component.onCheckboxChange(leaf, false);
    component.toggleSelectAll(true);
    component.toggleSelectAll(false);
    component.retryLazy(loading);
    component.retryLazy(leaf);

    fixture.componentRef.setInput('nodes', [
      { id: 'duplicate', label: 'First' },
      { id: 'duplicate', label: 'Second' },
      { id: 'other', label: 'Other' },
    ]);
    fixture.detectChanges();
    const duplicates = component.nodes();
    expect(
      component.acceptDrop(
        component.dragData(duplicates[0]),
        component.dropTarget(duplicates[2], 'before'),
      ),
    ).toBe(false);
  });

  it('reconciles replaced state and exercises template callbacks and indexed fallbacks', () => {
    const lazy: NeuTreeNode = { id: 'lazy', label: 'Lazy', leaf: false };
    const child: NeuTreeNode = { id: 'child', label: 'Child' };
    const root: NeuTreeNode = {
      id: 'root',
      label: 'Root',
      expanded: true,
      children: [lazy, child],
    };
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', [root]);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selectionMode', 'checkbox');
    fixture.componentRef.setInput('lazy', true);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.activateNode(child);
    component.toggleNode(lazy);

    const context = component.templateContext(child, 2);
    context.toggleSelection();
    context.toggle();
    expect(component.hasChildren(root)).toBe(true);
    expect(component.hasChildren(child)).toBe(false);

    expect(
      component.acceptDrop(
        { treeId: 'tree', node: { ...child }, parent: root, index: 1 },
        component.dropTarget({ ...lazy }, 'before'),
      ),
    ).toBe(true);
    component.onTreeDrop({
      data: { treeId: 'tree', node: root, parent: null, index: 0 },
      targetData: component.dropTarget(child, 'inside'),
      scope: ['neu-tree'],
      effect: 'move',
      interaction: 'keyboard',
      originalEvent: null,
    });
    component.onTreeDrop({
      data: {
        treeId: 'external',
        node: { id: 'external-source', label: 'External source' },
        parent: null,
        index: 0,
      },
      targetData: component.dropTarget(
        { id: 'external-target', label: 'External target' },
        'after',
      ),
      scope: ['neu-tree'],
      effect: 'move',
      interaction: 'keyboard',
      originalEvent: null,
    });

    fixture.componentRef.setInput('nodes', [
      {
        ...root,
        children: [{ ...lazy, children: [{ id: 'loaded', label: 'Loaded' }] }],
      },
    ]);
    fixture.detectChanges();
    expect(component.isSelected('child')).toBe(false);
  });

  it('emits every drop position and materializes virtual keyboard focus', async () => {
    const root: NeuTreeNode = {
      id: 'root',
      label: 'Root',
      expanded: true,
      children: Array.from({ length: 30 }, (_, index) => ({
        id: `child-${index}`,
        label: `Child ${index}`,
      })),
    };
    const fixture = TestBed.createComponent(NeuTreeComponent);
    fixture.componentRef.setInput('nodes', [root]);
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('visibleRows', 3);
    fixture.componentRef.setInput('dragDrop', true);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const drag = component.dragData(root.children![0]);
    const positions: string[] = [];
    component.nodeDrop.subscribe((event) => positions.push(event.position));
    for (const position of ['before', 'inside', 'after'] as const)
      component.onTreeDrop({
        data: drag,
        targetData: component.dropTarget(root.children![1], position),
        scope: ['neu-tree'],
        effect: 'move',
        interaction: 'pointer',
        originalEvent: null,
      });
    component.setActiveNode('child-20');
    component.onNodeKeydown(
      root.children![20],
      new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    expect(positions).toEqual(['before', 'inside', 'after']);
    expect(component.virtualRange().start).toBeGreaterThan(0);
  });
});
