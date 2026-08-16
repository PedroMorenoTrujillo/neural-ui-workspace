import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
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

  it('renders the clear affordance as an independently focusable button', () => {
    fixture.componentRef.setInput('clearable', true);
    fixture.componentInstance.writeValue('admin');
    fixture.detectChanges();

    const clear = fixture.nativeElement.querySelector(
      '.neu-tree-select__clear',
    ) as HTMLButtonElement;
    expect(clear.tagName).toBe('BUTTON');
    expect(clear.getAttribute('aria-label')).toBe('Clear selection');
    expect(
      fixture.nativeElement.querySelector('.neu-tree-select__trigger .neu-tree-select__clear'),
    ).toBeNull();
  });

  it('opens with ArrowDown and navigates enabled treeitems with a roving tabindex', async () => {
    const trigger = fixture.nativeElement.querySelector(
      '.neu-tree-select__trigger',
    ) as HTMLButtonElement;
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    const buttons = Array.from(
      document.querySelectorAll('.neu-tree-select__node:not(:disabled)'),
    ) as HTMLButtonElement[];

    expect(document.activeElement).toBe(buttons[0]);
    expect(buttons.map((button) => button.tabIndex)).toEqual([0, -1]);
    expect(buttons[0].getAttribute('aria-level')).toBe('1');
    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(buttons[1]);
    buttons[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('expands branches with ArrowRight and closes with Escape while restoring focus', async () => {
    const trigger = fixture.nativeElement.querySelector(
      '.neu-tree-select__trigger',
    ) as HTMLButtonElement;
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    const admin = document.querySelector('[data-tree-select-value="admin"]') as HTMLButtonElement;
    admin.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(admin.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('[data-tree-select-value="editor"]')).toBeTruthy();

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(escape);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(escape.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('does not open from the keyboard while disabled or consume Escape while closed', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const openEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      cancelable: true,
    });
    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });

    fixture.componentInstance.openWithKeyboard(openEvent);
    fixture.componentInstance.onEscape(escape);

    expect(fixture.componentInstance.open()).toBe(false);
    expect(openEvent.defaultPrevented).toBe(false);
    expect(escape.defaultPrevented).toBe(false);
  });

  it('collapses an expanded branch with ArrowLeft', async () => {
    fixture.componentInstance.open.set(true);
    fixture.componentInstance.expanded.set(new Set(['admin']));
    fixture.detectChanges();
    await fixture.whenStable();
    const admin = document.querySelector('[data-tree-select-value="admin"]') as HTMLButtonElement;

    admin.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.expanded().has('admin')).toBe(false);
  });

  it('moves to boundaries and focuses the parent branch with ArrowLeft', async () => {
    fixture.componentInstance.open.set(true);
    fixture.componentInstance.expanded.set(new Set(['admin']));
    fixture.detectChanges();
    await fixture.whenStable();
    const admin = document.querySelector('[data-tree-select-value="admin"]') as HTMLButtonElement;
    const editor = document.querySelector('[data-tree-select-value="editor"]') as HTMLButtonElement;
    const lazy = document.querySelector('[data-tree-select-value="lazy"]') as HTMLButtonElement;

    editor.focus();
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(admin);

    admin.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(lazy);
    lazy.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(editor);
  });

  it('renders every projected template and exposes its documented context', async () => {
    @Component({
      imports: [
        NeuTreeSelectComponent,
        NeuTreeSelectEmptyDirective,
        NeuTreeSelectFooterDirective,
        NeuTreeSelectHeaderDirective,
        NeuTreeSelectNodeDirective,
        NeuTreeSelectSelectedDirective,
      ],
      template: `
        <neu-tree-select [nodes]="nodes" [clearable]="true">
          <ng-template neuTreeSelectHeader>Custom header</ng-template>
          <ng-template neuTreeSelectFooter>Custom footer</ng-template>
          <ng-template neuTreeSelectEmpty>Custom empty</ng-template>
          <ng-template neuTreeSelectSelected let-node>Selected {{ node.label }}</ng-template>
          <ng-template neuTreeSelectNode let-node let-level="level" let-toggle="toggle">
            <span class="custom-node" (click)="toggle()">{{ level }}:{{ node.label }}</span>
          </ng-template>
        </neu-tree-select>
      `,
    })
    class TreeSelectTemplateHostComponent {
      readonly nodes = nodes;
    }

    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [TreeSelectTemplateHostComponent] })
      .compileComponents();
    const host = TestBed.createComponent(TreeSelectTemplateHostComponent);
    const component = host.debugElement.query(By.directive(NeuTreeSelectComponent))
      .componentInstance as NeuTreeSelectComponent;
    component.writeValue('admin');
    component.open.set(true);
    host.detectChanges();

    expect(host.nativeElement.textContent).toContain('Selected Admin');
    expect(document.body.textContent).toContain('Custom header');
    expect(document.body.textContent).toContain('Custom footer');
    expect(document.body.textContent).toContain('0:Admin');

    component.toggleExpandedFromTemplate(nodes[0]);
    expect(component.expanded().has('admin')).toBe(true);
    component.query.set('not-found');
    host.detectChanges();
    expect(document.body.textContent).toContain('Custom empty');
  });
});
