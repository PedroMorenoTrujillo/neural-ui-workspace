import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import {
  NeuTreeSelectComponent,
  NeuTreeSelectEmptyDirective,
  NeuTreeSelectFooterDirective,
  NeuTreeSelectHeaderDirective,
  NeuTreeSelectNode,
  NeuTreeSelectNodeDirective,
  NeuTreeSelectSelectedDirective,
} from './neu-tree-select.component';

@Component({
  imports: [
    NeuTreeSelectComponent,
    NeuTreeSelectNodeDirective,
    NeuTreeSelectSelectedDirective,
    NeuTreeSelectHeaderDirective,
    NeuTreeSelectFooterDirective,
    NeuTreeSelectEmptyDirective,
  ],
  template: `
    <neu-tree-select [nodes]="nodes" [searchable]="true">
      <ng-template neuTreeSelectHeader><span class="tree-header">Header</span></ng-template>
      <ng-template neuTreeSelectNode let-node let-level="level" let-toggle="toggle">
        <button class="tree-template-toggle" type="button" (click)="toggle()">
          {{ node.label }}-{{ level }}
        </button>
      </ng-template>
      <ng-template neuTreeSelectSelected let-node>
        <span class="tree-selected">{{ node?.label }}</span>
      </ng-template>
      <ng-template neuTreeSelectEmpty><span class="tree-empty">Empty slot</span></ng-template>
      <ng-template neuTreeSelectFooter><span class="tree-footer">Footer</span></ng-template>
    </neu-tree-select>
  `,
})
class TreeSelectTemplatesHost {
  nodes: NeuTreeSelectNode[] = [
    { value: 'root', label: 'Root', children: [{ value: 'leaf', label: 'Leaf' }] },
  ];
}

describe('NeuTreeSelectComponent', () => {
  let fixture: ComponentFixture<NeuTreeSelectComponent<NeuTreeSelectNode, string>>;
  const nodes: NeuTreeSelectNode[] = [
    {
      value: 'admin',
      label: 'Admin',
      children: [{ value: 'editor', label: 'Editor' }],
    },
    { value: 'lazy', label: 'Lazy', lazy: true },
    { value: 'disabled', label: 'Disabled', disabled: true },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuTreeSelectComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuTreeSelectComponent) as ComponentFixture<
      NeuTreeSelectComponent<NeuTreeSelectNode, string>
    >;
    fixture.componentRef.setInput('nodes', nodes);
    fixture.detectChanges();
  });

  it('renders its placeholder and an optional label', () => {
    expect(fixture.nativeElement.textContent).toContain('Select');
    expect(fixture.nativeElement.querySelector('.neu-tree-select__chevron')).toBeTruthy();
    fixture.componentRef.setInput('label', 'Role');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('label')?.textContent).toContain('Role');
  });

  it('implements CVA write, change, touched and disabled contracts', () => {
    const component = fixture.componentInstance;
    const changes: Array<string | string[] | null> = [];
    let touched = 0;
    component.registerOnChange((value) => changes.push(value));
    component.registerOnTouched(() => touched++);

    component.writeValue('admin');
    expect(component.values()).toEqual(['admin']);
    expect(component.selectedLabel()).toBe('Admin');

    component.selectNode(nodes[1]);
    expect(changes).toEqual(['lazy']);
    expect(touched).toBe(1);
    expect(component.values()).toEqual(['lazy']);
    expect(component.open()).toBe(false);

    component.setDisabledState(true);
    component.toggle();
    expect(component.isDisabled()).toBe(true);
    expect(component.open()).toBe(false);
    component.setDisabledState(false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.isDisabled()).toBe(true);
  });

  it('selects and unselects several nodes in multiple mode', () => {
    const component = fixture.componentInstance;
    const changes: Array<string | string[] | null> = [];
    component.registerOnChange((value) => changes.push(value));
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();

    component.selectNode(nodes[0]);
    component.selectNode(nodes[1]);
    expect(component.values()).toEqual(['admin', 'lazy']);
    expect(component.selectedLabel()).toBe('2 selected');
    expect(changes).toEqual([['admin'], ['admin', 'lazy']]);

    component.selectNode(nodes[0]);
    expect(component.values()).toEqual(['lazy']);
    expect(component['isSelected']('admin')).toBe(false);
  });

  it('owns multiple programmatic selections and emits a fresh selection proposal', () => {
    const component = fixture.componentInstance;
    const incoming = ['admin'];
    const cvaValues: string[][] = [];
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();
    component.registerOnChange((value) => cvaValues.push(value as string[]));

    component.writeValue(incoming);
    expect(component.values()).toEqual(incoming);
    expect(component.values()).not.toBe(incoming);

    incoming.push('lazy');
    expect(component.values()).toEqual(['admin']);

    component.selectNode(nodes[1]);
    expect(incoming).toEqual(['admin', 'lazy']);
    expect(cvaValues[0]).toEqual(['admin', 'lazy']);
    expect(cvaValues[0]).not.toBe(component.values());
  });

  it('does not commit disabled nodes and emits selected node objects', () => {
    const component = fixture.componentInstance;
    const selected: NeuTreeSelectNode[][] = [];
    component.selectionChange.subscribe((value) => selected.push(value));

    component.selectNode(nodes[2]);
    expect(component.values()).toEqual([]);

    component.selectNode(nodes[0]);
    expect(selected).toEqual([[nodes[0]]]);
  });

  it('expands nested nodes, emits lazy expansion and filters all tree nodes', () => {
    const component = fixture.componentInstance;
    const expanded: NeuTreeSelectNode[] = [];
    component.nodeExpand.subscribe((node) => expanded.push(node));
    const event = new Event('click');
    const stop = vi.spyOn(event, 'stopPropagation');
    expect(component.expanded().has('admin')).toBe(false);

    expect(component.visibleNodes().map((item) => item.node.value)).toEqual([
      'admin',
      'lazy',
      'disabled',
    ]);
    component.toggleExpanded(nodes[0], event);
    expect(stop).toHaveBeenCalled();
    expect(component.visibleNodes().map((item) => item.node.value)).toEqual([
      'admin',
      'editor',
      'lazy',
      'disabled',
    ]);
    expect(component.expanded().has('admin')).toBe(true);

    component.toggleExpanded(nodes[0], new Event('click'));
    expect(component.expanded().has('admin')).toBe(false);
    expect(component.visibleNodes().map((item) => item.node.value)).toEqual([
      'admin',
      'lazy',
      'disabled',
    ]);

    component.toggleExpanded(nodes[1], new Event('click'));
    expect(expanded).toEqual([nodes[1]]);
    component.toggleExpanded(nodes[1], new Event('click'));
    expect(expanded).toEqual([nodes[1]]);

    component.query.set('edit');
    expect(component.visibleNodes().map((item) => item.node.value)).toEqual(['editor']);
    component.query.set('unknown');
    expect(component.visibleNodes()).toEqual([]);
  });

  it('opens from the trigger, closes from backdrop and clears with the clear affordance', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('clearable', true);
    component.writeValue('admin');
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '.neu-tree-select__trigger',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(component.open()).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    const clear = fixture.nativeElement.querySelector('.neu-tree-select__clear') as HTMLElement;
    clear.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(component.values()).toEqual([]);

    component.close();
    expect(component.open()).toBe(false);
  });

  it('handles the overlay search, tree node and twisty listeners', () => {
    const component = fixture.componentInstance;
    const expanded: NeuTreeSelectNode[] = [];
    component.nodeExpand.subscribe((node) => expanded.push(node));
    component.toggle();
    fixture.detectChanges();

    const search = document.querySelector('.neu-tree-select__search') as HTMLInputElement;
    search.value = 'admin';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.query()).toBe('admin');

    component.query.set('');
    fixture.detectChanges();
    const twisties = Array.from(
      document.querySelectorAll('.neu-tree-select__twisty'),
    ) as HTMLElement[];
    twisties[1].click();
    fixture.detectChanges();
    expect(expanded).toEqual([nodes[1]]);

    const nodeButtons = Array.from(
      document.querySelectorAll('.neu-tree-select__node'),
    ) as HTMLButtonElement[];
    nodeButtons[0].click();
    fixture.detectChanges();
    expect(component.values()).toEqual(['admin']);

    component.toggle();
    fixture.detectChanges();
    (document.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
    expect(component.open()).toBe(false);
  });

  it('renders the empty overlay state and integrates through Reactive Forms', async () => {
    fixture.componentInstance.toggle();
    fixture.detectChanges();
    const search = document.querySelector('.neu-tree-select__search') as HTMLInputElement;
    search.value = 'missing';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(document.querySelector('.neu-tree-select__empty')).toBeTruthy();

    @Component({
      imports: [NeuTreeSelectComponent, ReactiveFormsModule],
      template: '<neu-tree-select [nodes]="nodes" [formControl]="control" />',
    })
    class FormHostComponent {
      readonly nodes = nodes;
      readonly control = new FormControl<string | null>('admin');
    }

    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [FormHostComponent] })
      .compileComponents();
    const formFixture = TestBed.createComponent(FormHostComponent);
    formFixture.detectChanges();
    expect(formFixture.nativeElement.textContent).toContain('Admin');
  });

  it('renders without search, supports single selected labels and handles undefined writes', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('searchable', false);
    component.writeValue(undefined as unknown as null);
    fixture.detectChanges();

    component.selectNode(nodes[0]);
    fixture.detectChanges();

    expect(component.selectedLabel()).toBe('Admin');
    component.toggle();
    fixture.detectChanges();
    expect(document.querySelector('.neu-tree-select__search')).toBeNull();
  });

  it('clear and select before CVA registration use default callbacks safely', () => {
    const fresh = TestBed.createComponent(NeuTreeSelectComponent);
    fresh.componentRef.setInput('nodes', nodes);
    fresh.componentRef.setInput('clearable', true);
    fresh.detectChanges();

    expect(() => fresh.componentInstance.selectNode(nodes[0])).not.toThrow();
    expect(() => fresh.componentInstance.clear(new MouseEvent('click'))).not.toThrow();
    expect(fresh.componentInstance.values()).toEqual([]);
  });

  it('searches across full tree even with collapsed nodes', () => {
    interface Department {
      id: number;
      name: string;
      children?: Department[];
    }

    const departments: Department[] = [
      { id: 1, name: 'Root', children: [{ id: 2, name: 'Child' }] },
    ];
    const fixture = TestBed.createComponent(NeuTreeSelectComponent) as ComponentFixture<
      NeuTreeSelectComponent<Department, number>
    >;
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('nodes', departments);
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.detectChanges();

    component.query.set('child');
    expect(component.visibleNodes().map((item) => item.label)).toEqual(['Child']);
  });

  it('supports key-based optionLabel, optionValue and optionDisabled accessors', () => {
    interface Department {
      id: number;
      name: string;
      disabled?: boolean;
      children?: Department[];
    }

    const departments: Department[] = [
      { id: 1, name: 'Platform', children: [{ id: 11, name: 'Users' }] },
      { id: 2, name: 'Operations', disabled: true },
    ];
    const fixture = TestBed.createComponent(NeuTreeSelectComponent) as ComponentFixture<
      NeuTreeSelectComponent<Department, number>
    >;
    fixture.componentRef.setInput('nodes', departments);
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.componentRef.setInput('optionDisabled', 'disabled');
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();

    const events: Department[][] = [];
    fixture.componentInstance.selectionChange.subscribe((selection) => events.push(selection));
    const values: Array<number | number[] | null> = [];
    fixture.componentInstance.registerOnChange((value) => values.push(value));

    fixture.componentInstance.selectNode(departments[0]);
    fixture.componentInstance.selectNode(departments[1]);

    expect(fixture.componentInstance.values()).toEqual([1]);
    expect(values.at(-1)).toEqual([1]);
    expect(events.at(-1)).toEqual([departments[0]]);
  });

  it('supports numeric optionValue and numeric zero through writeValue', () => {
    interface MetricNode {
      id: number;
      name: string;
    }

    const fixture = TestBed.createComponent(NeuTreeSelectComponent) as ComponentFixture<
      NeuTreeSelectComponent<MetricNode, number>
    >;
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('nodes', [
      { id: 0, name: 'Zero' },
      { id: 1, name: 'One' },
    ]);
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.detectChanges();

    component.writeValue(0);
    expect(component.values()).toEqual([0]);

    component.selectNode({ id: 0, name: 'Zero' });
    expect(component.values()).toEqual([0]);
  });

  it('supports function-based accessors and full-domain values when optionValue is omitted', () => {
    interface Department {
      id: number;
      name: string;
      disabled?: boolean;
      descendants?: Department[];
    }

    const departments: Department[] = [
      { id: 1, name: 'Root', descendants: [{ id: 2, name: 'Child' }] },
    ];
    const fixture = TestBed.createComponent(NeuTreeSelectComponent) as ComponentFixture<
      NeuTreeSelectComponent<Department, Department>
    >;
    const component = fixture.componentInstance as NeuTreeSelectComponent<Department, Department>;

    fixture.componentRef.setInput('nodes', departments);
    fixture.componentRef.setInput('optionLabel', (node: Department) => node.name);
    fixture.componentRef.setInput('optionChildren', (node: Department) => node.descendants ?? []);
    fixture.detectChanges();

    const cvaValues: Array<Department | Department[] | null> = [];
    const emitted: Department[][] = [];
    component.registerOnChange((value) => {
      cvaValues.push(value as Department | Department[] | null);
    });
    component.selectionChange.subscribe((selection) => emitted.push(selection));

    const child = departments[0]?.descendants?.[0];
    expect(component['optionValueOf'](child!)).toEqual(child);
    component.selectNode(child!);

    expect(component.values()).toEqual([child]);
    expect(cvaValues.at(-1)).toBe(child);
    expect(emitted.at(-1)).toEqual([child]);
  });

  it('supports legacy optionValue behavior and primitive default option values', () => {
    const primitive = ['admin', 'editor', 'viewer'];
    const fixture = TestBed.createComponent(NeuTreeSelectComponent) as ComponentFixture<
      NeuTreeSelectComponent<string, string>
    >;

    fixture.componentRef.setInput('nodes', primitive);
    fixture.componentRef.setInput('searchable', false);
    fixture.detectChanges();

    fixture.componentInstance.writeValue('editor');
    fixture.detectChanges();
    expect(fixture.componentInstance.values()).toEqual(['editor']);
    fixture.componentInstance.selectNode('admin');
    expect(fixture.componentInstance['isSelected']('admin')).toBe(true);
  });

  it('supports optionValue function accessors for expanded/collapsed state', () => {
    interface Department {
      id: number;
      name: string;
      children?: Department[];
    }

    const departments: Department[] = [
      {
        id: 1,
        name: 'Platform',
        children: [{ id: 11, name: 'Users' }],
      },
    ];

    const fixture = TestBed.createComponent(NeuTreeSelectComponent) as ComponentFixture<
      NeuTreeSelectComponent<Department, string>
    >;
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('nodes', departments);
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.componentRef.setInput('optionValue', (node: Department) => `id:${node.id}`);
    fixture.detectChanges();

    component.toggleExpanded(departments[0], new Event('click'));
    expect(component.expanded().has('id:1')).toBe(true);
    expect(component.visibleNodes().map((item) => item.node.name)).toEqual(['Platform', 'Users']);

    component.toggleExpanded(departments[0], new Event('click'));
    expect(component.expanded().has('id:1')).toBe(false);
    expect(component.visibleNodes().map((item) => item.node.name)).toEqual(['Platform']);
  });

  it('supports full-domain V expansion, collapse and selection without optionValue', () => {
    interface Department {
      id: number;
      name: string;
      descendants?: Department[];
    }

    const departments: Department[] = [
      { id: 1, name: 'Root', descendants: [{ id: 2, name: 'Child' }] },
    ];
    const fixture = TestBed.createComponent(NeuTreeSelectComponent) as ComponentFixture<
      NeuTreeSelectComponent<Department, Department>
    >;
    const component = fixture.componentInstance as NeuTreeSelectComponent<Department, Department>;

    fixture.componentRef.setInput('nodes', departments);
    fixture.componentRef.setInput('optionLabel', (node: Department) => node.name);
    fixture.componentRef.setInput('optionChildren', 'descendants');
    fixture.detectChanges();

    const root = departments[0];
    const child = departments[0]?.descendants?.[0];
    expect(component.expanded().size).toBe(0);

    component.toggleExpanded(root, new Event('click'));
    expect(component.expanded().has(root)).toBe(true);
    expect(component.visibleNodes().map((item) => item.node.name)).toEqual(['Root', 'Child']);

    component.selectNode(child!);
    expect(component.values()).toEqual([child]);

    component.toggleExpanded(root, new Event('click'));
    expect(component.expanded().has(root)).toBe(false);
    expect(component.visibleNodes().map((item) => item.node.name)).toEqual(['Root']);
  });

  it('uses a native clear button outside the trigger and respects readonly state', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('clearable', true);
    fixture.componentRef.setInput('readonly', true);
    component.writeValue('admin');
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '.neu-tree-select__trigger',
    ) as HTMLButtonElement;
    const clear = fixture.nativeElement.querySelector(
      '.neu-tree-select__clear',
    ) as HTMLButtonElement;
    expect(trigger.contains(clear)).toBe(false);
    expect(clear.getAttribute('aria-label')).toBe('Clear selection');
    expect(clear.disabled).toBe(true);
    component.selectNode(nodes[1]);
    expect(component.values()).toEqual(['admin']);
  });

  it('provides deterministic trigger/panel relationships and tree roving navigation', async () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('searchable', false);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '.neu-tree-select__trigger',
    ) as HTMLButtonElement;
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = document.querySelector('.neu-tree-select__panel') as HTMLElement;
    const items = () =>
      Array.from(panel.querySelectorAll('[role="treeitem"]')) as HTMLButtonElement[];
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
    expect(items().filter((item) => item.tabIndex === 0)).toHaveLength(1);
    expect(document.activeElement).toBe(items()[0]);
    expect(items()[0].getAttribute('aria-level')).toBe('1');

    items()[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(items().map((item) => item.textContent?.trim())).toContain('Editor');
    items()[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement?.textContent).toContain('Editor');
    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('matches the overlay panel width to the visible trigger', async () => {
    const trigger = fixture.nativeElement.querySelector(
      '.neu-tree-select__trigger',
    ) as HTMLButtonElement;
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      width: 360,
      height: 48,
      top: 0,
      right: 360,
      bottom: 48,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fixture.componentInstance.toggle();
    fixture.detectChanges();
    await fixture.whenStable();

    const overlayPane = document.querySelector('.cdk-overlay-pane') as HTMLElement;
    expect(overlayPane.style.width).toBe('360px');
  });

  it('hands ArrowDown and ArrowUp from search to the first and last eligible treeitems', async () => {
    const component = fixture.componentInstance;
    component.toggle();
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = document.querySelector('.neu-tree-select__panel') as HTMLElement;
    const search = panel.querySelector('.neu-tree-select__search') as HTMLInputElement;
    const items = Array.from(panel.querySelectorAll<HTMLButtonElement>('[role="treeitem"]'));

    search.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(items[0]);
    search.focus();
    search.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(items[1]);
  });

  it('terminates cycles, retains shared references per branch, and flattens depth 5,000', () => {
    const self: NeuTreeSelectNode = { value: 'self', label: 'Self', children: [] };
    const parent: NeuTreeSelectNode = { value: 'parent', label: 'Parent', children: [] };
    const child: NeuTreeSelectNode = { value: 'child', label: 'Child', children: [] };
    const grandchild: NeuTreeSelectNode = {
      value: 'grandchild',
      label: 'Grandchild',
      children: [],
    };
    const shared: NeuTreeSelectNode = { value: 'shared', label: 'Shared' };
    self.children = [self, { value: 'safe', label: 'Safe sibling' }];
    parent.children = [child, shared];
    child.children = [grandchild];
    grandchild.children = [parent];
    fixture.componentRef.setInput('nodes', [
      self,
      parent,
      { value: 'right', label: 'Right', children: [shared] },
    ]);
    fixture.componentInstance.query.set('shared');
    fixture.detectChanges();
    expect(fixture.componentInstance.visibleNodes().map((item) => item.label)).toEqual([
      'Shared',
      'Shared',
    ]);

    let deep: NeuTreeSelectNode = { value: 'deep-5000', label: 'Deep' };
    for (let level = 4999; level >= 0; level -= 1) {
      deep = { value: `deep-${level}`, label: `Deep ${level}`, children: [deep] };
    }
    expect((fixture.componentInstance as any).flatten([deep])).toHaveLength(5001);
  });

  it('renders every typed template slot and executes the node toggle callback', () => {
    const host = TestBed.createComponent(TreeSelectTemplatesHost);
    host.detectChanges();
    const component = host.debugElement.query(By.directive(NeuTreeSelectComponent))
      .componentInstance as any;
    component.writeValue('leaf');
    component.toggle();
    host.detectChanges();

    expect(document.querySelector('.tree-header')?.textContent).toContain('Header');
    expect(document.querySelector('.tree-footer')?.textContent).toContain('Footer');
    expect(
      document.querySelector('.tree-header')?.closest('.neu-tree-select__header'),
    ).toBeTruthy();
    expect(
      document.querySelector('.tree-footer')?.closest('.neu-tree-select__footer'),
    ).toBeTruthy();
    expect(document.querySelector('.tree-template-toggle')?.textContent).toContain('Root-0');
    (document.querySelector('.tree-template-toggle') as HTMLButtonElement).click();
    host.detectChanges();
    expect(component.expanded().has('root')).toBe(true);
    component.toggle();
    host.detectChanges();
    expect(document.querySelectorAll('.tree-template-toggle')).toHaveLength(2);
    component.close();
    host.detectChanges();
    expect(host.nativeElement.querySelector('.tree-selected')?.textContent).toContain('Root');

    const emptyHost = TestBed.createComponent(TreeSelectTemplatesHost);
    emptyHost.componentInstance.nodes = [];
    emptyHost.detectChanges();
    const emptyComponent = emptyHost.debugElement.query(By.directive(NeuTreeSelectComponent))
      .componentInstance as any;
    emptyComponent.toggle();
    emptyHost.detectChanges();
    expect(document.querySelector('.tree-empty')?.textContent).toContain('Empty slot');
    expect(
      document
        .querySelector('.tree-empty')
        ?.closest('.neu-tree-select__empty')
        ?.getAttribute('role'),
    ).toBe('status');
  });
});
