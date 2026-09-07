import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NeuOrganizationChartComponent,
  NeuOrganizationChartNodeDirective,
  NeuOrganizationChartSelectionIndicatorDirective,
  NeuOrganizationChartToggleDirective,
  NeuOrganizationChartToggleIconDirective,
  type NeuOrganizationChartNode,
} from './neu-organization-chart.component';

interface Person {
  role: string;
}

const NODES: NeuOrganizationChartNode<Person>[] = [
  {
    id: 'ceo',
    label: 'Alex Morgan',
    description: 'Chief executive officer',
    data: { role: 'CEO' },
    children: [
      {
        id: 'product',
        label: 'Mina Patel',
        data: { role: 'Product lead' },
        children: [
          { id: 'design', label: 'Jo Kim', data: { role: 'Designer' } },
          { id: 'research', label: 'Sam Lee', data: { role: 'Researcher' } },
        ],
      },
      {
        id: 'engineering',
        label: 'Noah García',
        badge: 'Hiring',
        data: { role: 'Engineering lead' },
      },
    ],
  },
];

@Component({
  standalone: true,
  imports: [
    NeuOrganizationChartComponent,
    NeuOrganizationChartNodeDirective,
    NeuOrganizationChartToggleIconDirective,
  ],
  template: `
    <neu-organization-chart
      [nodes]="nodes"
      selectionMode="multiple"
      [collapsible]="true"
      [(selectionKeys)]="selectionKeys"
      [(collapsedKeys)]="collapsedKeys"
      ariaLabel="Team hierarchy"
    >
      <ng-template
        [neuOrganizationChartNode]="nodes"
        let-node
        let-level="level"
        let-selected="selected"
      >
        <span class="custom-card"
          >{{ node.label }} · {{ node.data?.role }} · {{ level }} · {{ selected }}</span
        >
      </ng-template>
      <ng-template [neuOrganizationChartToggleIcon]="nodes" let-expanded="expanded">
        <span class="custom-toggle">{{ expanded ? 'open' : 'closed' }}</span>
      </ng-template>
    </neu-organization-chart>
  `,
})
class OrganizationChartHostComponent {
  nodes = NODES;
  selectionKeys: readonly string[] | undefined = [];
  collapsedKeys: readonly string[] | undefined = [];
}

@Component({
  standalone: true,
  imports: [
    NeuOrganizationChartComponent,
    NeuOrganizationChartNodeDirective,
    NeuOrganizationChartSelectionIndicatorDirective,
    NeuOrganizationChartToggleDirective,
  ],
  template: `
    <neu-organization-chart [nodes]="nodes" selectionMode="checkbox" [collapsible]="true">
      <ng-template
        [neuOrganizationChartNode]="nodes"
        let-node
        let-index="index"
        let-path="path"
        let-leaf="leaf"
      >
        <button class="consumer-button" type="button">
          {{ node.label }} · {{ index }} · {{ path.join('.') }} · {{ leaf }}
        </button>
      </ng-template>
      <ng-template
        [neuOrganizationChartSelectionIndicator]="nodes"
        let-selected="selected"
        let-partial="partialSelected"
      >
        <span class="custom-indicator">{{ selected }} · {{ partial }}</span>
      </ng-template>
      <ng-template
        [neuOrganizationChartToggle]="nodes"
        let-node
        let-expanded="expanded"
        let-childCount="childCount"
        let-toggle="toggle"
      >
        <button class="custom-full-toggle" type="button" (click)="toggle($event)">
          {{ node.label }} · {{ expanded }} · {{ childCount }}
        </button>
      </ng-template>
    </neu-organization-chart>
  `,
})
class OrganizationChartCompositionHostComponent {
  nodes = NODES;
}

describe('NeuOrganizationChartComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NeuOrganizationChartComponent,
        NeuOrganizationChartNodeDirective,
        NeuOrganizationChartSelectionIndicatorDirective,
        NeuOrganizationChartToggleDirective,
        NeuOrganizationChartToggleIconDirective,
        OrganizationChartHostComponent,
        OrganizationChartCompositionHostComponent,
      ],
    }).compileComponents();
  });

  function setup(nodes: readonly NeuOrganizationChartNode<Person>[] = NODES) {
    const fixture = TestBed.createComponent(NeuOrganizationChartComponent<Person>);
    fixture.componentRef.setInput('nodes', nodes);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a stable accessible hierarchy with presentation-only connectors', () => {
    const fixture = setup();
    const tree = fixture.nativeElement.querySelector('[role="tree"]');
    const items = fixture.nativeElement.querySelectorAll('[role="treeitem"]');

    expect(tree.getAttribute('aria-label')).toBe('Organization chart');
    expect(items).toHaveLength(5);
    expect(items[0].getAttribute('aria-level')).toBe('1');
    expect(items[1].getAttribute('aria-level')).toBe('2');
    expect(fixture.nativeElement.querySelectorAll('[role="group"]')).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain('Chief executive officer');
  });

  it('supports multiple roots as a Neural superset', () => {
    const fixture = setup([
      ...NODES,
      { id: 'board', label: 'Board', data: { role: 'Governance' } },
    ]);
    expect(fixture.nativeElement.querySelectorAll('[aria-level="1"]')).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain('Board');
  });

  it('frames the primary root inside an overflowing viewport without changing public state', () => {
    const fixture = setup();
    const viewport = fixture.nativeElement.querySelector(
      '.neu-organization-chart__viewport',
    ) as HTMLElement;
    const root = fixture.nativeElement.querySelector(
      '.neu-organization-chart__tree--root > .neu-organization-chart__branch > .neu-organization-chart__node',
    ) as HTMLElement;
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 320 });
    Object.defineProperty(viewport, 'scrollWidth', { configurable: true, value: 980 });
    Object.defineProperty(viewport, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, width: 320 }),
    });
    Object.defineProperty(root, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 410, width: 160 }),
    });
    const scrollBy = vi.fn();
    Object.defineProperty(viewport, 'scrollBy', { configurable: true, value: scrollBy });

    (fixture.componentInstance as any).centerInitialView();

    expect(scrollBy).toHaveBeenCalledWith({ left: 330, behavior: 'instant' });
    expect(fixture.componentInstance.selectionKeys()).toBeUndefined();
    expect(fixture.componentInstance.collapsedKeys()).toBeUndefined();
  });

  it('renders strict custom node and toggle-icon template contexts', () => {
    const fixture = TestBed.createComponent(OrganizationChartHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.custom-card')?.textContent).toContain(
      'Alex Morgan · CEO · 1 · false',
    );
    expect(fixture.nativeElement.querySelector('.custom-toggle')?.textContent).toContain('open');
    expect(fixture.nativeElement.querySelector('[role="tree"]')?.getAttribute('aria-label')).toBe(
      'Team hierarchy',
    );
  });

  it('supports full toggle and selection-indicator composition with arbitrary controls', () => {
    const fixture = TestBed.createComponent(OrganizationChartCompositionHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.consumer-button')?.textContent).toContain(
      'Alex Morgan · 0 · 0 · false',
    );
    expect(fixture.nativeElement.querySelector('.custom-indicator')?.textContent).toContain(
      'false · false',
    );
    const toggle = fixture.nativeElement.querySelector('.custom-full-toggle') as HTMLButtonElement;
    expect(toggle.textContent).toContain('Alex Morgan · true · 2');
    toggle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Mina Patel');
  });

  it('uses controlled single selection keys and emits select/unselect events', () => {
    const fixture = setup();
    fixture.componentRef.setInput('selectionMode', 'single');
    const selected: string[] = [];
    const unselected: string[] = [];
    fixture.componentInstance.nodeSelect.subscribe((event) => selected.push(event.node.id));
    fixture.componentInstance.nodeUnselect.subscribe((event) => unselected.push(event.node.id));
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll('.neu-organization-chart__node-action');
    const treeitems = fixture.nativeElement.querySelectorAll('[role="treeitem"]');
    actions[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectionKeys()).toEqual(['product']);
    expect(treeitems[1].getAttribute('aria-selected')).toBe('true');

    actions[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectionKeys()).toEqual([]);
    expect(selected).toEqual(['product']);
    expect(unselected).toEqual(['product']);
  });

  it('supports independent multiple selection', () => {
    const fixture = setup();
    fixture.componentRef.setInput('selectionMode', 'multiple');
    fixture.detectChanges();
    const actions = fixture.nativeElement.querySelectorAll('.neu-organization-chart__node-action');

    actions[1].click();
    actions[4].click();
    fixture.detectChanges();

    expect(new Set(fixture.componentInstance.selectionKeys())).toEqual(
      new Set(['product', 'engineering']),
    );
    expect(
      fixture.nativeElement.querySelector('[role="tree"]')?.getAttribute('aria-multiselectable'),
    ).toBe('true');
  });

  it('cascades checkbox selection and reports partial ancestors truthfully', () => {
    const fixture = setup();
    fixture.componentRef.setInput('selectionMode', 'checkbox');
    fixture.detectChanges();
    let actions = fixture.nativeElement.querySelectorAll('.neu-organization-chart__node-action');

    actions[2].click();
    fixture.detectChanges();
    actions = fixture.nativeElement.querySelectorAll('.neu-organization-chart__node-action');
    let treeitems = fixture.nativeElement.querySelectorAll('[role="treeitem"]');
    expect(treeitems[0].getAttribute('aria-checked')).toBe('mixed');
    expect(treeitems[1].getAttribute('aria-checked')).toBe('mixed');

    actions[3].click();
    fixture.detectChanges();
    treeitems = fixture.nativeElement.querySelectorAll('[role="treeitem"]');
    expect(treeitems[1].getAttribute('aria-checked')).toBe('true');
    expect(new Set(fixture.componentInstance.selectionKeys())).toEqual(
      new Set(['design', 'research', 'product']),
    );

    actions[0].click();
    fixture.detectChanges();
    expect(new Set(fixture.componentInstance.selectionKeys())).toEqual(
      new Set(['ceo', 'product', 'design', 'research', 'engineering']),
    );
  });

  it('uses controlled collapsed keys and emits collapse/expand events without mutating nodes', () => {
    const fixture = setup();
    fixture.componentRef.setInput('collapsible', true);
    const snapshot = structuredClone(NODES);
    const changes: string[] = [];
    fixture.componentInstance.nodeCollapse.subscribe((event) =>
      changes.push(`close:${event.node.id}`),
    );
    fixture.componentInstance.nodeExpand.subscribe((event) =>
      changes.push(`open:${event.node.id}`),
    );
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('.neu-organization-chart__toggle');
    toggle.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.collapsedKeys()).toEqual(['ceo']);
    expect(fixture.nativeElement.textContent).not.toContain('Mina Patel');

    fixture.nativeElement.querySelector('.neu-organization-chart__toggle').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.collapsedKeys()).toEqual([]);
    expect(changes).toEqual(['close:ceo', 'open:ceo']);
    expect(NODES).toEqual(snapshot);
  });

  it('derives initial collapse from expanded=false only while uncontrolled', () => {
    const fixture = setup([
      {
        ...NODES[0],
        expanded: false,
      },
    ]);
    fixture.componentRef.setInput('collapsible', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Mina Patel');
    expect(
      fixture.nativeElement.querySelector('[role="treeitem"]').getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('honors per-node selectable and collapsible overrides plus disabled state', () => {
    const fixture = setup([
      {
        id: 'root',
        label: 'Root',
        data: { role: 'Root' },
        selectable: true,
        collapsible: true,
        children: [
          {
            id: 'disabled',
            label: 'Disabled',
            data: { role: 'Disabled' },
            disabled: true,
          },
        ],
      },
    ]);
    fixture.componentRef.setInput('selectionMode', 'single');
    fixture.componentRef.setInput('selectable', false);
    fixture.componentRef.setInput('collapsible', false);
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll('.neu-organization-chart__node-action');
    const treeitems = fixture.nativeElement.querySelectorAll('[role="treeitem"]');
    actions[0].click();
    actions[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectionKeys()).toEqual(['root']);
    expect(treeitems[1].getAttribute('aria-disabled')).toBe('true');
    expect(treeitems[1].getAttribute('tabindex')).toBe('-1');
    expect(fixture.nativeElement.querySelector('.neu-organization-chart__toggle')).toBeTruthy();
  });

  it('reconciles a dynamic model by identity', () => {
    const fixture = setup();
    fixture.componentRef.setInput('nodes', [
      { id: 'new-root', label: 'New root', data: { role: 'New' } },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('[role="treeitem"]')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('New root');
    expect(fixture.nativeElement.textContent).not.toContain('Alex Morgan');
  });

  it('supports sequential and hierarchy keyboard navigation', () => {
    const fixture = setup();
    fixture.componentRef.setInput('collapsible', true);
    fixture.componentRef.setInput('selectionMode', 'single');
    fixture.detectChanges();
    const actions = fixture.nativeElement.querySelectorAll('[role="treeitem"]');

    actions[0].focus();
    actions[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(actions[1]);

    actions[0].focus();
    actions[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(actions[1]);

    actions[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.collapsedKeys()).toEqual(['ceo']);
  });

  it('mirrors hierarchy arrow navigation in RTL', () => {
    const fixture = setup();
    fixture.nativeElement.setAttribute('dir', 'rtl');
    fixture.componentRef.setInput('collapsible', true);
    fixture.componentRef.setInput('selectionMode', 'single');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[role="treeitem"]');

    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.collapsedKeys()).toEqual(['ceo']);
  });

  it('applies horizontal and vertical gaps and renders an accessible empty state', () => {
    const fixture = setup();
    fixture.componentRef.setInput('gap', [24, 48] as const);
    fixture.detectChanges();
    const viewport = fixture.nativeElement.querySelector('.neu-organization-chart__viewport');
    expect(viewport.style.getPropertyValue('--neu-organization-chart-gap-x')).toBe('24px');
    expect(viewport.style.getPropertyValue('--neu-organization-chart-gap-y')).toBe('48px');

    fixture.componentRef.setInput('nodes', []);
    fixture.componentRef.setInput('emptyLabel', 'No reporting lines');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'No reporting lines',
    );
  });

  it('terminates cycles and retains shared nodes in separate branches', () => {
    const self: NeuOrganizationChartNode<Person> = {
      id: 'self',
      label: 'Self',
      data: { role: 'Self' },
      children: [],
    };
    const parent: NeuOrganizationChartNode<Person> = {
      id: 'parent',
      label: 'Parent',
      data: { role: 'Parent' },
      children: [],
    };
    const child: NeuOrganizationChartNode<Person> = {
      id: 'child',
      label: 'Child',
      data: { role: 'Child' },
      children: [],
    };
    const grandchild: NeuOrganizationChartNode<Person> = {
      id: 'grandchild',
      label: 'Grandchild',
      data: { role: 'Grandchild' },
      children: [],
    };
    const shared: NeuOrganizationChartNode<Person> = {
      id: 'shared',
      label: 'Shared',
      data: { role: 'Shared' },
    };
    self.children = [self, { id: 'safe', label: 'Safe', data: { role: 'Safe' } }];
    parent.children = [child, shared];
    child.children = [grandchild];
    grandchild.children = [parent];
    const fixture = setup([
      self,
      parent,
      { id: 'right', label: 'Right', data: { role: 'Right' }, children: [shared] },
    ]);

    expect(fixture.nativeElement.textContent).toContain('Safe');
    expect(fixture.nativeElement.textContent.match(/Shared/g)).toHaveLength(2);
  });

  it('renders a valid depth-1,000 chain without stack exhaustion', () => {
    let deep: NeuOrganizationChartNode<Person> = {
      id: 'deep-1000',
      label: 'Deep 1000',
      data: { role: 'Deep' },
    };
    for (let level = 999; level >= 0; level -= 1) {
      deep = {
        id: `deep-${level}`,
        label: `Deep ${level}`,
        data: { role: 'Deep' },
        children: [deep],
      };
    }
    const fixture = setup([deep]);
    fixture.componentRef.setInput('selectionMode', 'single');
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('[role="treeitem"]');
    expect(items).toHaveLength(1_001);
    expect(items[1_000].getAttribute('aria-level')).toBe('1001');
    expect(fixture.nativeElement.querySelector('.neu-organization-chart__tree--flat')).toBeTruthy();

    const viewport = fixture.nativeElement.querySelector('.neu-organization-chart__viewport');
    viewport.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    viewport.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    items[0].dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(items[1]);
  });

  it('keeps context callbacks, selection guards, and checkbox deselection explicit', () => {
    const fixture = setup();
    const chart = fixture.componentInstance as any;
    const root = NODES[0];
    const leaf = root.children![1];

    expect(chart.gapX()).toBe(40);
    expect(chart.gapY()).toBe(40);
    fixture.componentRef.setInput('gap', [12] as const);
    expect(chart.gapY()).toBe(12);
    expect(chart.deepIndent(100)).toBe(24);

    expect(chart.canSelect(root)).toBe(false);
    fixture.componentRef.setInput('selectionMode', 'single');
    fixture.componentRef.setInput('selectable', false);
    expect(chart.canSelect({ ...root, selectable: true })).toBe(true);
    expect(chart.canSelect({ ...root, selectable: false })).toBe(false);
    expect(chart.canSelect({ ...root, disabled: true })).toBe(false);
    expect(chart.canSelect(root)).toBe(false);

    expect(chart.canCollapse(leaf)).toBe(false);
    fixture.componentRef.setInput('collapsible', false);
    expect(chart.canCollapse({ ...root, collapsible: true })).toBe(true);
    expect(chart.canCollapse({ ...root, collapsible: false })).toBe(false);
    expect(chart.canCollapse({ ...root, disabled: true })).toBe(false);
    expect(chart.canCollapse(root)).toBe(false);

    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('collapsible', true);
    fixture.componentRef.setInput('selectionMode', 'checkbox');
    const selectEvents: string[] = [];
    const unselectEvents: string[] = [];
    fixture.componentInstance.nodeSelect.subscribe(({ node }) => selectEvents.push(node.id));
    fixture.componentInstance.nodeUnselect.subscribe(({ node }) => unselectEvents.push(node.id));
    chart.activateNode(root);
    chart.activateNode(root);
    expect(fixture.componentInstance.selectionKeys()).toEqual([]);
    expect(selectEvents).toEqual(['ceo']);
    expect(unselectEvents).toEqual(['ceo']);

    const nodeContext = chart.nodeTemplateContext(root, null, 0, 0, [0]);
    const event = new Event('click');
    nodeContext.select();
    nodeContext.select(event);
    nodeContext.toggle();
    nodeContext.toggle(event);
    const leafToggleContext = chart.toggleTemplateContext(leaf);
    expect(leafToggleContext.childCount).toBe(0);
    leafToggleContext.toggle();
    leafToggleContext.toggle(event);
  });

  it('handles interactive content and every keyboard navigation boundary', () => {
    const fixture = setup();
    fixture.componentRef.setInput('selectionMode', 'single');
    fixture.componentRef.setInput('collapsible', true);
    fixture.detectChanges();
    const chart = fixture.componentInstance as any;
    const root = NODES[0];
    const items = Array.from(
      fixture.nativeElement.querySelectorAll('[role="treeitem"]'),
    ) as HTMLElement[];

    const nested = document.createElement('button');
    items[0].appendChild(nested);
    chart.onNodeContentClick(root, {
      target: nested,
      currentTarget: items[0],
    } as unknown as MouseEvent);
    expect(fixture.componentInstance.selectionKeys()).toBeUndefined();
    chart.onNodeContentClick(root, {
      target: items[0],
      currentTarget: items[0],
    } as unknown as MouseEvent);
    expect(fixture.componentInstance.selectionKeys()).toEqual(['ceo']);

    const nestedKey = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    Object.defineProperties(nestedKey, {
      target: { value: nested },
      currentTarget: { value: items[0] },
    });
    chart.onNodeKeydown(root, nestedKey);
    expect(nestedKey.defaultPrevented).toBe(false);

    for (const [key, expected] of [
      ['ArrowDown', items[1]],
      ['End', items.at(-1)],
      ['Home', items[0]],
      ['ArrowUp', undefined],
    ] as const) {
      const keyboard = new KeyboardEvent('keydown', { key, cancelable: true });
      Object.defineProperties(keyboard, {
        target: { value: items[0] },
        currentTarget: { value: items[0] },
      });
      chart.onNodeKeydown(root, keyboard);
      if (expected) expect(document.activeElement).toBe(expected);
      else expect(keyboard.defaultPrevented).toBe(false);
    }

    const unknown = new KeyboardEvent('keydown', { key: 'PageDown', cancelable: true });
    Object.defineProperties(unknown, {
      target: { value: items[0] },
      currentTarget: { value: items[0] },
    });
    chart.onNodeKeydown(root, unknown);
    expect(unknown.defaultPrevented).toBe(false);

    const flatTree = document.createElement('ul');
    flatTree.className = 'neu-organization-chart__tree neu-organization-chart__tree--flat';
    const flatItems = [1, 2, 2, 1].map((level) => {
      const item = document.createElement('li');
      item.className = 'neu-organization-chart__branch';
      item.tabIndex = 0;
      item.setAttribute('aria-level', String(level));
      flatTree.appendChild(item);
      return item;
    });
    fixture.nativeElement.appendChild(flatTree);
    expect(chart.firstChildItem(flatItems[0])).toBe(flatItems[1]);
    expect(chart.firstChildItem(flatItems[3])).toBeUndefined();
    expect(chart.parentItem(flatItems[2])).toBe(flatItems[0]);
    expect(chart.parentItem(flatItems[0])).toBeUndefined();
  });

  it('covers collapsed arrows, empty selectable subtrees, and hierarchy edge lookups', () => {
    const fixture = setup();
    fixture.componentRef.setInput('selectionMode', 'checkbox');
    fixture.componentRef.setInput('collapsible', true);
    fixture.detectChanges();
    const chart = fixture.componentInstance as any;
    const root = NODES[0];
    const items = Array.from(
      fixture.nativeElement.querySelectorAll('[role="treeitem"]'),
    ) as HTMLElement[];

    expect(chart.deepRenderEntries()).toEqual([]);
    expect(
      chart.isPartialSelected({
        id: 'disabled-only',
        label: 'Disabled only',
        disabled: true,
      }),
    ).toBe(false);

    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    Object.defineProperties(enter, {
      target: { value: items[0] },
      currentTarget: { value: items[0] },
    });
    chart.onNodeKeydown(root, enter);
    expect(enter.defaultPrevented).toBe(true);

    chart.toggleNode(root);
    const forward = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
    Object.defineProperties(forward, {
      target: { value: items[0] },
      currentTarget: { value: items[0] },
    });
    chart.onNodeKeydown(root, forward);
    expect(fixture.componentInstance.collapsedKeys()).toEqual([]);

    chart.toggleNode(root);
    const backWhileCollapsed = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      cancelable: true,
    });
    Object.defineProperties(backWhileCollapsed, {
      target: { value: items[0] },
      currentTarget: { value: items[0] },
    });
    chart.onNodeKeydown(root, backWhileCollapsed);
    expect(backWhileCollapsed.defaultPrevented).toBe(false);

    const noTarget = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true });
    Object.defineProperties(noTarget, {
      target: { value: items[0] },
      currentTarget: { value: items[0] },
    });
    chart.onNodeKeydown(root, noTarget);
    expect(noTarget.defaultPrevented).toBe(false);

    expect(chart.firstChildItem(items[4])).toBeUndefined();
    expect(chart.parentItem(items[0])).toBeUndefined();
    expect(chart.parentItem(items[2])).toBe(items[1]);

    const flatTree = document.createElement('ul');
    flatTree.className = 'neu-organization-chart__tree--flat';
    const levelTwo = document.createElement('li');
    levelTwo.className = 'neu-organization-chart__branch';
    levelTwo.tabIndex = 0;
    levelTwo.setAttribute('aria-level', '2');
    const nextRoot = document.createElement('li');
    nextRoot.className = 'neu-organization-chart__branch';
    nextRoot.tabIndex = 0;
    nextRoot.setAttribute('aria-level', '1');
    flatTree.append(levelTwo, nextRoot);
    fixture.nativeElement.appendChild(flatTree);
    expect(chart.firstChildItem(levelTwo)).toBeUndefined();

    const nonSelectableParent: NeuOrganizationChartNode<Person> = {
      id: 'parent',
      label: 'Parent',
      selectable: false,
      children: [
        { id: 'first-child', label: 'First child' },
        { id: 'second-child', label: 'Second child' },
      ],
    };
    fixture.componentRef.setInput('nodes', [nonSelectableParent]);
    fixture.componentInstance.selectionKeys.set([]);
    fixture.detectChanges();
    const actions = fixture.nativeElement.querySelectorAll('.neu-organization-chart__node-action');
    actions[1].click();
    actions[2].click();
    expect(new Set(fixture.componentInstance.selectionKeys())).toEqual(
      new Set(['first-child', 'second-child']),
    );
  });
});
