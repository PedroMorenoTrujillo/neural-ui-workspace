import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { NeuTreeSelectComponent, NeuTreeSelectNode } from './neu-tree-select.component';

describe('NeuTreeSelectComponent', () => {
  let fixture: ComponentFixture<NeuTreeSelectComponent>;
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
    fixture = TestBed.createComponent(NeuTreeSelectComponent);
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

    expect(component.visibleNodes().map((item) => item.node.value)).toEqual(['admin', 'lazy', 'disabled']);
    component.toggleExpanded(nodes[0], event);
    expect(stop).toHaveBeenCalled();
    expect(component.visibleNodes().map((item) => item.node.value)).toEqual(['admin', 'editor', 'lazy', 'disabled']);

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
});
