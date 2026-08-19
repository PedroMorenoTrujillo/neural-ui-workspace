import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { NeuTreeSelectComponent, NeuTreeSelectNode } from './neu-tree-select.component';

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
    expect(component.isSelected('admin')).toBe(false);
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

    expect(component.visibleNodes().map((item) => item.node.value)).toEqual(['admin', 'lazy', 'disabled']);
    component.toggleExpanded(nodes[0], event);
    expect(stop).toHaveBeenCalled();
    expect(component.visibleNodes().map((item) => item.node.value)).toEqual(['admin', 'editor', 'lazy', 'disabled']);
    expect(component.expanded().has('admin')).toBe(true);

    component.toggleExpanded(nodes[0], new Event('click'));
    expect(component.expanded().has('admin')).toBe(false);
    expect(component.visibleNodes().map((item) => item.node.value)).toEqual(['admin', 'lazy', 'disabled']);

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

    const trigger = fixture.nativeElement.querySelector('.neu-tree-select__trigger') as HTMLButtonElement;
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
    const twisties = Array.from(document.querySelectorAll('.neu-tree-select__twisty')) as HTMLElement[];
    twisties[1].click();
    fixture.detectChanges();
    expect(expanded).toEqual([nodes[1]]);

    const nodeButtons = Array.from(document.querySelectorAll('.neu-tree-select__node')) as HTMLButtonElement[];
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

    await TestBed.resetTestingModule().configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
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

    const departments: Department[] = [{ id: 1, name: 'Root', children: [{ id: 2, name: 'Child' }] }];
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

    const departments: Department[] = [{ id: 1, name: 'Root', descendants: [{ id: 2, name: 'Child' }] }];
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
    expect(component.optionValueOf(child!)).toEqual(child);
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
    expect(fixture.componentInstance.isSelected('admin')).toBe(true);
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

    const departments: Department[] = [{ id: 1, name: 'Root', descendants: [{ id: 2, name: 'Child' }] }];
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
});
