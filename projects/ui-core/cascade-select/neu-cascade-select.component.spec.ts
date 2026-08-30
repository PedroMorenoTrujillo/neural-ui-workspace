import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideZonelessChangeDetection } from '@angular/core';
import {
  NeuCascadeSelectComponent,
  NeuCascadeSelectEmptyDirective,
  NeuCascadeSelectFooterDirective,
  NeuCascadeSelectHeaderDirective,
  NeuCascadeSelectItemDirective,
  NeuCascadeSelectNode,
  NeuCascadeSelectSelectedDirective,
} from './neu-cascade-select.component';

interface Department {
  id: number;
  name: string;
  blocked?: boolean;
  children?: Department[];
}

interface DescendantDepartment {
  id: number;
  name: string;
  descendants?: DescendantDepartment[];
}

const nextAnimationFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const leaf = (id: number, name: string): Department => ({ id, name });
const hierarchy: Department[] = [
  {
    id: 1,
    name: 'Europe',
    children: [
      {
        id: 2,
        name: 'Spain',
        children: [leaf(3, 'Malaga'), leaf(4, 'Madrid')],
      },
      { id: 5, name: 'France', children: [leaf(6, 'Paris')] },
    ],
  },
  { id: 7, name: 'Disabled', blocked: true, children: [leaf(8, 'Hidden')] },
];

@Component({
  standalone: true,
  imports: [
    NeuCascadeSelectComponent,
    NeuCascadeSelectItemDirective,
    NeuCascadeSelectSelectedDirective,
    NeuCascadeSelectHeaderDirective,
    NeuCascadeSelectFooterDirective,
    NeuCascadeSelectEmptyDirective,
    ReactiveFormsModule,
  ],
  template: `
    <neu-cascade-select
      [nodes]="nodes"
      label="Location"
      [clearable]="true"
      (selectionChange)="selection = $event"
    >
      <ng-template neuCascadeSelectItem let-node let-depth="depth">Item {{ node.name }} {{ depth }}</ng-template>
      <ng-template neuCascadeSelectSelected let-node>Selected {{ node?.name }}</ng-template>
      <ng-template neuCascadeSelectHeader>Header</ng-template>
      <ng-template neuCascadeSelectEmpty>Empty</ng-template>
      <ng-template neuCascadeSelectFooter>Footer</ng-template>
    </neu-cascade-select>
  `,
})
class CascadeTemplateHost {
  nodes = hierarchy;
  selection: Department | null = null;
}

@Component({
  standalone: true,
  imports: [NeuCascadeSelectComponent, ReactiveFormsModule],
  template: `<neu-cascade-select [nodes]="nodes" optionValue="id" [formControl]="control" />`,
})
class CascadeFormHost {
  nodes = hierarchy;
  control = new FormControl<number | null>(null);
}

describe('NeuCascadeSelectComponent', () => {
  let fixture: ComponentFixture<NeuCascadeSelectComponent<Department, number>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuCascadeSelectComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(NeuCascadeSelectComponent) as ComponentFixture<
      NeuCascadeSelectComponent<Department, number>
    >;
    fixture.componentRef.setInput('nodes', hierarchy);
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.componentRef.setInput('optionDisabled', 'blocked');
    fixture.detectChanges();
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
  });

  it('instantiates without nodes or options', () => {
    const empty = TestBed.createComponent(NeuCascadeSelectComponent);
    empty.detectChanges();
    expect(empty.componentInstance.currentNodes()).toEqual([]);
    expect(empty.nativeElement.querySelector('.neu-cascade-select__trigger')).toBeTruthy();
  });

  it('applies the CascadeSelect root class to the host', () => {
    expect(fixture.nativeElement.classList.contains('neu-cascade-select')).toBe(true);
  });

  it('supports the convenient NeuCascadeSelectNode model', () => {
    const component = fixture.componentInstance as unknown as NeuCascadeSelectComponent<
      NeuCascadeSelectNode<number>,
      number
    >;
    fixture.componentRef.setInput('nodes', [
      { value: 0, label: 'Zero', children: [{ value: 1, label: 'One' }] },
    ]);
    fixture.componentRef.setInput('optionLabel', null);
    fixture.componentRef.setInput('optionValue', null);
    fixture.detectChanges();
    expect(component['optionLabelOf'](component.currentNodes()[0])).toBe('Zero');
    expect(component['optionValueOf'](component.currentNodes()[0])).toBe(0);
  });

  it('supports key and function accessors, including custom children', () => {
    const component = fixture.componentInstance as unknown as NeuCascadeSelectComponent<Department, string>;
    expect(component['optionLabelOf'](hierarchy[0])).toBe('Europe');
    fixture.componentRef.setInput('optionLabel', (node: Department) => node.name.toUpperCase());
    fixture.componentRef.setInput('optionValue', (node: Department): string => `dep-${node.id}`);
    fixture.componentRef.setInput('optionDisabled', (node: Department) => node.blocked === true);
    fixture.componentRef.setInput('optionChildren', (node: Department) => node.children ?? []);
    fixture.detectChanges();
    expect(component['optionLabelOf'](hierarchy[0])).toBe('EUROPE');
    expect(component['optionValueOf'](hierarchy[0])).toBe('dep-1');
    expect(component['isOptionDisabled'](hierarchy[1])).toBe(true);
    expect(component.hasChildren(hierarchy[0])).toBe(true);
  });

  it('resolves optionChildren by key against descendant nodes', () => {
    const component = fixture.componentInstance as unknown as NeuCascadeSelectComponent<DescendantDepartment, number>;
    const nodes: DescendantDepartment[] = [
      { id: 10, name: 'Platform', descendants: [{ id: 11, name: 'Frontend' }] },
    ];
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('optionChildren', 'descendants');
    fixture.detectChanges();

    component.openPanel();
    component.activate(nodes[0]);
    expect(component.currentNodes()).toEqual(nodes[0].descendants);
  });

  it('supports the options alias and full-object values when optionValue is omitted', () => {
    const component = fixture.componentInstance as unknown as NeuCascadeSelectComponent<Department, Department>;
    fixture.componentRef.setInput('nodes', []);
    fixture.componentRef.setInput('options', hierarchy);
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.componentRef.setInput('optionValue', null);
    fixture.detectChanges();
    component.activate(hierarchy[0].children![0].children![0]);
    expect(component.value()).toBe(hierarchy[0].children![0].children![0]);
  });

  it('keeps string, number and zero values intact', () => {
    const component = fixture.componentInstance as unknown as NeuCascadeSelectComponent<
      NeuCascadeSelectNode<string | number>,
      string | number
    >;
    const nodes: NeuCascadeSelectNode<string | number>[] = [
      { value: 'text', label: 'Text' },
      { value: 0, label: 'Zero' },
      { value: 42, label: 'Number' },
    ];
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('optionLabel', null);
    fixture.componentRef.setInput('optionValue', null);
    fixture.detectChanges();
    component.activate(nodes[1]);
    expect(component.value()).toBe(0);
    component.writeValue('text');
    expect(component.selectedNode()?.label).toBe('Text');
  });

  it('implements the single-value CVA contract', () => {
    const component = fixture.componentInstance;
    const changes: Array<number | null> = [];
    let touched = 0;
    component.registerOnChange((value) => changes.push(value));
    component.registerOnTouched(() => touched++);
    component.writeValue(3);
    expect(component.selectedNode()?.name).toBe('Malaga');
    component.activate(hierarchy[0].children![0].children![1]);
    expect(changes).toEqual([4]);
    expect(touched).toBe(1);
    component.setDisabledState(true);
    expect(component.isDisabled()).toBe(true);
  });

  it('emits the original T model, not V', () => {
    const selected: Array<Department | null> = [];
    fixture.componentInstance.selectionChange.subscribe((node) => selected.push(node));
    fixture.componentInstance.activate(hierarchy[0].children![0].children![0]);
    expect(selected).toEqual([hierarchy[0].children![0].children![0]]);
  });

  it('matches reconstructed domain objects through optionValue', () => {
    const component = fixture.componentInstance;
    component.writeValue(3);
    fixture.componentRef.setInput('nodes', [
      { id: 1, name: 'Europe', children: [{ id: 3, name: 'Malaga' }] },
    ] satisfies Department[]);
    fixture.detectChanges();
    expect(component.selectedNode()?.name).toBe('Malaga');
    expect(component['isOptionSelected']({ id: 3, name: 'Malaga' })).toBe(true);
  });

  it('navigates through two and three levels and replaces descendants when the parent changes', () => {
    const component = fixture.componentInstance;
    component.openPanel();
    expect(component.currentNodes().map((node) => node.name)).toEqual(['Europe', 'Disabled']);
    component.activate(hierarchy[0]);
    expect(component.activePath()).toEqual([hierarchy[0]]);
    expect(component.currentNodes().map((node) => node.name)).toEqual(['Spain', 'France']);
    component.activate(hierarchy[0].children![0]);
    expect(component.activePath()).toEqual([hierarchy[0], hierarchy[0].children![0]]);
    expect(component.currentNodes().map((node) => node.name)).toEqual(['Malaga', 'Madrid']);
    component.goBack();
    component.activate(hierarchy[0].children![1]);
    expect(component.activePath()).toEqual([hierarchy[0], hierarchy[0].children![1]]);
    expect(component.currentNodes().map((node) => node.name)).toEqual(['Paris']);
  });

  it('selects leaves and does not navigate or select disabled nodes', () => {
    const component = fixture.componentInstance;
    component.openPanel();
    component.activate(hierarchy[1]);
    expect(component.activePath()).toEqual([]);
    expect(component.value()).toBeNull();
    component.activate(hierarchy[0]);
    component.activate(hierarchy[0].children![0]);
    component.activate(hierarchy[0].children![0].children![0]);
    expect(component.value()).toBe(3);
    expect(component.open()).toBe(false);
  });

  it('supports keyboard navigation, skips disabled nodes, and activates branches and leaves', () => {
    const component = fixture.componentInstance;
    component.openPanel();
    component.onOptionKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0);
    expect(component.activeIndex()).toBe(0);
    component.onOptionKeydown(new KeyboardEvent('keydown', { key: 'Home' }), 1);
    expect(component.activeIndex()).toBe(0);
    component.onOptionKeydown(new KeyboardEvent('keydown', { key: 'End' }), 0);
    expect(component.activeIndex()).toBe(0);
    component.activate(hierarchy[0]);
    component.onOptionKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0);
    expect(component.activeIndex()).toBe(1);
    component.onOptionKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }), 1);
    expect(component.activeIndex()).toBe(0);
    component.onOptionKeydown(new KeyboardEvent('keydown', { key: 'Home' }), 1);
    expect(component.activeIndex()).toBe(0);
    component.onOptionKeydown(new KeyboardEvent('keydown', { key: 'End' }), 0);
    expect(component.activeIndex()).toBe(1);
    component.onOptionKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), 1);
    expect(component.activePath()).toEqual([hierarchy[0], hierarchy[0].children![1]]);
    component.onOptionKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }), 0);
    expect(component.activePath()).toEqual([hierarchy[0]]);
    component.onOptionKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), 0);
    expect(component.activePath()).toEqual([hierarchy[0], hierarchy[0].children![0]]);
    component.onOptionKeydown(new KeyboardEvent('keydown', { key: ' ' }), 0);
    expect(component.value()).toBe(3);
    expect(component.open()).toBe(false);
  });

  it('opens from trigger, closes with Escape/backdrop, and returns focus', async () => {
    const component = fixture.componentInstance;
    const trigger = fixture.nativeElement.querySelector('.neu-cascade-select__trigger') as HTMLButtonElement;
    trigger.focus();
    component.openPanel();
    fixture.detectChanges();
    expect(component.open()).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const option = document.querySelector<HTMLButtonElement>('.neu-cascade-select__option');
    option?.focus();
    component.onOptionKeydown(new KeyboardEvent('keydown', { key: 'Escape' }), 0);
    fixture.detectChanges();
    await nextAnimationFrame();
    expect(component.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);

    component.openPanel();
    fixture.detectChanges();
    document.querySelector<HTMLElement>('.cdk-overlay-backdrop')?.click();
    fixture.detectChanges();
    await nextAnimationFrame();
    expect(component.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('exposes accessible trigger, listbox, options and disabled state', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Department');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.neu-cascade-select__trigger') as HTMLElement;
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('aria-label')).toBe('Department');
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    fixture.componentRef.setInput('disabled', false);
    component.openPanel();
    fixture.detectChanges();
    expect(document.getElementById(`${component.panelId}-listbox`)?.getAttribute('role')).toBe('listbox');
    expect(document.querySelector('[role="option"]')?.getAttribute('aria-disabled')).toBeNull();
  });

  it('renders item, selected, header, footer and empty templates with original T', () => {
    const hostFixture = TestBed.createComponent(CascadeTemplateHost);
    hostFixture.detectChanges();
    const component = hostFixture.debugElement.query(By.directive(NeuCascadeSelectComponent))
      .componentInstance as NeuCascadeSelectComponent<Department, Department>;
    component.openPanel();
    hostFixture.detectChanges();
    expect(document.querySelector('.neu-cascade-select__panel')?.textContent).toContain('Header');
    expect(document.querySelector('.neu-cascade-select__option')?.textContent).toContain('Europe 0');
    component.activate(hierarchy[0]);
    component.activate(hierarchy[0].children![0]);
    component.activate(hierarchy[0].children![0].children![0]);
    hostFixture.detectChanges();
    expect(hostFixture.nativeElement.textContent).toContain('Selected Malaga');
    component.openPanel();
    hostFixture.detectChanges();
    expect(document.querySelector('.neu-cascade-select__panel')?.textContent).toContain('Footer');
  });

  it('clears by click without opening the overlay', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('clearable', true);
    component.writeValue(3);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.neu-cascade-select__trigger') as HTMLButtonElement;
    const clear = fixture.nativeElement.querySelector('.neu-cascade-select__clear') as HTMLButtonElement;
    expect(trigger.querySelector('.neu-cascade-select__clear')).toBeNull();
    clear.click();
    expect(component.value()).toBeNull();
    expect(component.open()).toBe(false);
  });

  it('keeps the native clear button focusable and activatable', async () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('clearable', true);
    component.writeValue(3);
    fixture.detectChanges();
    const clear = fixture.nativeElement.querySelector('.neu-cascade-select__clear') as HTMLButtonElement;
    expect(clear.disabled).toBe(false);
    expect(clear.type).toBe('button');
    expect(clear.getAttribute('aria-label')).toBe('Clear selection');
    clear.focus();
    expect(document.activeElement).toBe(clear);
    clear.click();
    await nextAnimationFrame();
    expect(component.value()).toBeNull();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.neu-cascade-select__trigger'));
  });

  it('disables clear with the component and never clears while disabled', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('clearable', true);
    component.writeValue(3);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const clear = fixture.nativeElement.querySelector('.neu-cascade-select__clear') as HTMLButtonElement;
    expect(clear.disabled).toBe(true);
    clear.click();
    expect(component.value()).toBe(3);
  });

  it('renders the empty slot', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('nodes', []);
    component.openPanel();
    fixture.detectChanges();
    expect(document.querySelector('.neu-cascade-select__empty')).toBeTruthy();
  });

  it('integrates with Reactive Forms', () => {
    const hostFixture = TestBed.createComponent(CascadeFormHost);
    hostFixture.detectChanges();
    const component = hostFixture.debugElement.query(By.directive(NeuCascadeSelectComponent))
      .componentInstance as NeuCascadeSelectComponent<Department, number>;
    component.activate(hierarchy[0].children![0].children![1]);
    expect(hostFixture.componentInstance.control.value).toBe(4);
    hostFixture.componentInstance.control.setValue(6);
    hostFixture.detectChanges();
    expect(component.selectedNode()?.name).toBe('Paris');
  });

  it('does not throw when browser focus and positioning paths run', () => {
    expect(() => fixture.componentInstance.openPanel()).not.toThrow();
    expect(() => fixture.componentInstance.close()).not.toThrow();
  });

  it('finds selections deterministically through cycles, shared branches, and depth 5,000', () => {
    const component = fixture.componentInstance as any;
    const self = leaf(20, 'Self');
    const sibling = leaf(21, 'Sibling');
    self.children = [self, sibling];
    const ancestor = leaf(22, 'Ancestor');
    const child = leaf(23, 'Child');
    const grandchild = leaf(27, 'Grandchild');
    ancestor.children = [child];
    child.children = [grandchild];
    grandchild.children = [ancestor];
    const shared = leaf(24, 'Shared');
    const left = { ...leaf(25, 'Left'), children: [shared] };
    const right = { ...leaf(26, 'Right'), children: [shared] };

    expect(component.findSelectionPath([self, ancestor, left, right], 21).node).toBe(sibling);
    expect(component.findSelectionPath([self, ancestor, left, right], 27).ancestors).toEqual([
      ancestor,
      child,
    ]);
    expect(component.findSelectionPath([left, right], 24).ancestors).toEqual([left]);

    let deep = leaf(5_000, '5000');
    for (let depth = 4_999; depth >= 0; depth -= 1) {
      deep = { ...leaf(depth, String(depth)), children: [deep] };
    }
    const selection = component.findSelectionPath([deep], 5_000);
    expect(selection.node.id).toBe(5_000);
    expect(selection.ancestors).toHaveLength(5_000);
  });
});
