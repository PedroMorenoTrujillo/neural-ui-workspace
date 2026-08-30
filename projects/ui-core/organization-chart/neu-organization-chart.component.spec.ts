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
      <ng-template [neuOrganizationChartNode]="nodes" let-node let-level="level" let-selected="selected">
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
    <neu-organization-chart
      [nodes]="nodes"
      selectionMode="checkbox"
      [collapsible]="true"
    >
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
});
