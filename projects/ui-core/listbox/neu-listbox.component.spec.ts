import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { NeuListboxComponent } from './neu-listbox.component';
import {
  NeuListboxEmptyDirective,
  NeuListboxEmptyFilterDirective,
  NeuListboxFilterDirective,
  NeuListboxFooterDirective,
  NeuListboxGroupDirective,
  NeuListboxHeaderDirective,
  NeuListboxItemDirective,
  NeuListboxLoaderDirective,
} from './neu-listbox.directives';
import { NeuListboxOption } from './neu-listbox.types';

describe('NeuListboxComponent', () => {
  let fixture: ComponentFixture<NeuListboxComponent<NeuListboxOption, string>>;
  const options: NeuListboxOption[] = [
    { label: 'Alpha', value: 'a' },
    { label: 'Beta', value: 'b' },
    { label: 'Disabled', value: 'd', disabled: true },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuListboxComponent] }).compileComponents();
    fixture = TestBed.createComponent(
      NeuListboxComponent as unknown as new () => NeuListboxComponent<NeuListboxOption, string>,
    );
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();
  });

  it('renders options and exposes an accessible labelled listbox', () => {
    fixture.componentRef.setInput('label', 'Available choices');
    fixture.componentRef.setInput('hint', 'Choose one');
    fixture.detectChanges();
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    expect(fixture.nativeElement.textContent).toContain('Alpha');
    expect(listbox.getAttribute('aria-labelledby')).toMatch(/^neu-listbox-\d+-label$/);
    expect(fixture.nativeElement.querySelector('.neu-listbox__hint')?.textContent).toContain(
      'Choose one',
    );
  });

  it('implements the CVA selection, touched and disabled contracts', () => {
    const component = fixture.componentInstance;
    const changes: Array<string | string[] | null> = [];
    let touched = 0;
    component.registerOnChange((value) => changes.push(value));
    component.registerOnTouched(() => touched++);
    component.writeValue('a');
    expect(component['isSelected']('a')).toBe(true);

    component['toggleOption'](options[1]);
    expect(component.values()).toEqual(['b']);
    expect(changes).toEqual(['b']);
    expect(touched).toBe(0);
    component['onListBlur'](new FocusEvent('blur'));
    expect(touched).toBe(1);

    component.setDisabledState(true);
    component['toggleOption'](options[0]);
    expect(component.values()).toEqual(['b']);
    component.setDisabledState(false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.isDisabled()).toBe(true);
    component.writeValue(null);
    expect(component.values()).toEqual([]);
  });

  it('supports multiple selection and ignores disabled options', () => {
    const component = fixture.componentInstance;
    const emitted = vi.spyOn(component.selectionChange, 'emit');
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();
    component['toggleOption'](options[0]);
    component['toggleOption'](options[1]);
    component['toggleOption'](options[0]);
    component['toggleOption'](options[2]);
    expect(component.values()).toEqual(['b']);
    expect(emitted).toHaveBeenLastCalledWith([options[1]]);
  });

  it('filters, renders empty state and handles keyboard navigation', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('searchable', true);
    fixture.detectChanges();
    const search = fixture.nativeElement.querySelector('.neu-listbox__search') as HTMLInputElement;
    search.value = 'beta';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.filteredOptions()).toEqual([options[1]]);

    const down = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    const prevent = vi.spyOn(down, 'preventDefault');
    component['onKeyDown'](down);
    expect(prevent).toHaveBeenCalled();
    expect(component.activeIndex()).toBe(0);

    const select = new KeyboardEvent('keydown', { key: 'Enter' });
    component['onKeyDown'](select);
    expect(component.values()).toEqual(['b']);
    component.query.set('missing');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-listbox__empty')).toBeTruthy();
    component['onKeyDown'](new KeyboardEvent('keydown', { key: ' ' }));
  });

  it('selects options through the template and uses ariaLabel without a visible label', () => {
    fixture.componentRef.setInput('ariaLabel', 'Custom choices');
    fixture.detectChanges();
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    expect(listbox.getAttribute('aria-label')).toBe('Custom choices');
    (fixture.nativeElement.querySelector('.neu-listbox__option') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.values()).toEqual(['a']);
    expect(
      fixture.nativeElement.querySelector('.neu-listbox__option')?.getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('uses DOM keyboard navigation, active boundaries and multiselect semantics', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
    component.activeIndex.set(2);
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(component.activeIndex()).toBe(0);
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(component.activeIndex()).toBe(0);
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(component.values()).toEqual(['a']);
  });

  it('accepts array CVA values and exposes composite disabled state without option tab stops', () => {
    const component = fixture.componentInstance;
    component.writeValue(['a', 'b']);
    expect(component.values()).toEqual(['a', 'b']);
    component.setDisabledState(true);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll(
      '.neu-listbox__option',
    ) as NodeListOf<HTMLElement>;
    expect(fixture.nativeElement.querySelector('[role="listbox"]').getAttribute('tabindex')).toBe(
      '-1',
    );
    expect(rows[0].hasAttribute('tabindex')).toBe(false);
    expect(rows[2].getAttribute('aria-disabled')).toBe('true');
  });

  it('renders a projected option template', async () => {
    @Component({
      imports: [NeuListboxComponent, NeuListboxItemDirective],
      template: `
        <neu-listbox [options]="options">
          <ng-template neuListboxItem let-option>Template: {{ option.label }}</ng-template>
        </neu-listbox>
      `,
    })
    class ItemTemplateHostComponent {
      readonly options = [{ label: 'Alpha', value: 'a' }];
    }

    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [ItemTemplateHostComponent] })
      .compileComponents();
    const host = TestBed.createComponent(ItemTemplateHostComponent);
    host.detectChanges();
    expect(host.nativeElement.textContent).toContain('Template: Alpha');
  });

  it('keyboard selection ignores an active index with no option', () => {
    const component = fixture.componentInstance;
    component.activeIndex.set(99);
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    const prevent = vi.spyOn(event, 'preventDefault');

    component['onKeyDown'](event);

    expect(prevent).toHaveBeenCalled();
    expect(component.values()).toEqual([]);
  });

  it('single selection before CVA registration uses default callbacks safely', () => {
    expect(() => fixture.componentInstance['toggleOption'](options[0])).not.toThrow();
    expect(fixture.componentInstance.values()).toEqual(['a']);
  });

  it('emits null when a malformed single-select option has no value', () => {
    const changes: unknown[] = [];
    fixture.componentInstance.registerOnChange((value) => changes.push(value));

    fixture.componentInstance['toggleOption']({ label: 'Broken' } as NeuListboxOption);

    expect(changes).toEqual([{ label: 'Broken' }]);
  });

  it('resolves the CVA provider through Reactive Forms with a projected template', async () => {
    @Component({
      imports: [NeuListboxComponent, NeuListboxItemDirective, ReactiveFormsModule],
      template: `
        <neu-listbox [options]="options" [formControl]="control">
          <ng-template neuListboxItem let-option>Projected {{ option.label }}</ng-template>
        </neu-listbox>
      `,
    })
    class FormHostComponent {
      readonly options = [
        { label: 'Alpha', value: 'a' },
        { label: 'Beta', value: 'b' },
      ];
      readonly control = new FormControl('a');
    }

    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [FormHostComponent] })
      .compileComponents();
    const host = TestBed.createComponent(FormHostComponent);
    host.detectChanges();

    expect(host.nativeElement.textContent).toContain('Projected Alpha');
    const buttons = host.nativeElement.querySelectorAll(
      '.neu-listbox__option',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    host.detectChanges();

    expect(host.componentInstance.control.value).toBe('b');
  });

  it('supports key-based optionLabel / optionValue / optionDisabled accessors', () => {
    const fixture = TestBed.createComponent(NeuListboxComponent) as ComponentFixture<
      NeuListboxComponent<any, string>
    >;
    const users = [
      { id: 'a', name: 'Alice', disabled: false },
      { id: 'b', name: 'Bob', disabled: false },
      { id: 'c', name: 'Charlie', disabled: true },
    ];

    fixture.componentRef.setInput('options', users);
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.componentRef.setInput('optionDisabled', 'disabled');
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();

    const emitted: any[] = [];
    fixture.componentInstance.selectionChange.subscribe((value) => emitted.push(value));

    const values: Array<string | string[] | null> = [];
    fixture.componentInstance.registerOnChange((value) => values.push(value));
    fixture.componentInstance['toggleOption'](users[0]);
    fixture.componentInstance['toggleOption'](users[1]);
    fixture.componentInstance['toggleOption'](users[2]);

    expect(values.at(-1)).toEqual(['a', 'b']);
    expect(fixture.componentInstance.values()).toEqual(['a', 'b']);
    expect(fixture.componentInstance['isSelected']('a')).toBe(true);
    expect(emitted.at(-1)).toEqual([users[0], users[1]]);
  });

  it('supports function-based accessors and emits complete selected options', () => {
    const users = [
      { id: 'u-1', label: 'alpha', unavailable: false },
      { id: 'u-2', label: 'bravo', unavailable: true },
    ];
    const fixture = TestBed.createComponent(NeuListboxComponent) as ComponentFixture<
      NeuListboxComponent<any, string>
    >;
    const listbox = fixture.componentInstance as NeuListboxComponent<any, string>;

    fixture.componentRef.setInput('options', users);
    fixture.componentRef.setInput('optionLabel', (option: (typeof users)[number]) =>
      option.label.toUpperCase(),
    );
    fixture.componentRef.setInput('optionValue', (option: (typeof users)[number]) => option.id);
    fixture.componentRef.setInput(
      'optionDisabled',
      (option: (typeof users)[number]) => option.unavailable,
    );
    fixture.componentRef.setInput('multiple', false);
    fixture.detectChanges();

    const emitted: any[] = [];
    fixture.componentInstance.selectionChange.subscribe((value) => emitted.push(value));

    listbox['toggleOption'](users[1]);
    listbox['toggleOption'](users[0]);

    expect(fixture.componentInstance.values()).toEqual(['u-1']);
    expect(emitted.at(-1)).toEqual([users[0]]);
  });

  it('supports full-domain option objects when optionValue is omitted', () => {
    const users = [
      { uid: 1, fullName: 'Admin', isDisabled: false },
      { uid: 2, fullName: 'Viewer', isDisabled: false },
    ];
    const fixture = TestBed.createComponent(NeuListboxComponent) as ComponentFixture<
      NeuListboxComponent<any, (typeof users)[number]>
    >;
    const listbox = fixture.componentInstance as NeuListboxComponent<any, (typeof users)[number]>;

    fixture.componentRef.setInput('options', users as any);
    fixture.componentRef.setInput('optionLabel', 'fullName');
    fixture.componentRef.setInput('optionDisabled', 'isDisabled');
    fixture.detectChanges();

    listbox['toggleOption'](users[1]);

    expect(fixture.componentInstance.values()).toEqual([users[1]]);
    expect(listbox['optionValueOf'](users[1])).toEqual(users[1]);
  });

  it('supports single-selection with numeric optionValue and disabled domain options', () => {
    interface User {
      id: number;
      fullName: string;
      disabled: boolean;
    }

    const users: User[] = [
      { id: 1, fullName: 'Admin', disabled: false },
      { id: 2, fullName: 'Viewer', disabled: false },
      { id: 3, fullName: 'Guest', disabled: true },
    ];

    const fixture = TestBed.createComponent(NeuListboxComponent) as ComponentFixture<
      NeuListboxComponent<User, number>
    >;
    const listbox = fixture.componentInstance;

    fixture.componentRef.setInput('options', users);
    fixture.componentRef.setInput('optionLabel', 'fullName');
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.componentRef.setInput('optionDisabled', 'disabled');
    fixture.componentRef.setInput('multiple', false);
    fixture.detectChanges();

    const values: Array<number | number[] | null> = [];
    const selectionChanges: User[][] = [];
    fixture.componentInstance.registerOnChange((value) => values.push(value));
    fixture.componentInstance.selectionChange.subscribe((value) => selectionChanges.push(value));

    fixture.componentInstance['toggleOption'](users[1]);

    expect(values.at(-1)).toBe(2);
    expect(fixture.componentInstance.values()).toEqual([2]);
    expect(selectionChanges.at(-1)).toEqual([users[1]]);

    fixture.componentInstance['toggleOption'](users[2]);
    expect(fixture.componentInstance.values()).toEqual([2]);
  });

  it('supports primitive options as values when optionValue is omitted', () => {
    const primitiveOptions = ['read', 'write', 'admin'];
    const fixture = TestBed.createComponent(NeuListboxComponent) as ComponentFixture<
      NeuListboxComponent<string, string>
    >;

    fixture.componentRef.setInput('options', primitiveOptions);
    fixture.componentRef.setInput('multiple', false);
    fixture.componentRef.setInput('searchable', false);
    fixture.detectChanges();

    fixture.componentInstance.writeValue('admin');
    fixture.detectChanges();

    expect(fixture.componentInstance.values()).toEqual(['admin']);
    fixture.componentInstance['toggleOption']('read' as any);
    expect(fixture.componentInstance['isSelected']('read')).toBe(true);
  });

  it('skips disabled rows across arrows, Home, End and typeahead', () => {
    const component = fixture.componentInstance;
    component.activeIndex.set(0);
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'End', cancelable: true }));
    expect(component.activeIndex()).toBe(1);
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'Home', cancelable: true }));
    expect(component.activeIndex()).toBe(0);
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'b', cancelable: true }));
    expect(component.activeIndex()).toBe(1);
  });

  it('reconciles the ephemeral active row by option identity after immutable reorder', () => {
    const component = fixture.componentInstance;
    component['setActiveRow'](1);
    const reordered = [
      { ...options[1], label: 'Beta replacement' },
      { ...options[0], label: 'Alpha replacement' },
      { ...options[2] },
    ];

    fixture.componentRef.setInput('options', reordered);
    fixture.detectChanges();

    expect(component.activeIndex()).toBe(0);
    expect((component.visibleRows()[0] as any).option).toBe(reordered[0]);
  });

  it('disposes the shared typeahead buffer timer with the component', () => {
    vi.useFakeTimers();
    try {
      const component = fixture.componentInstance;
      const timersBefore = vi.getTimerCount();
      component['onKeyDown'](new KeyboardEvent('keydown', { key: 'b' }));
      const controller = (component as any).typeaheadController;
      expect(controller.buffer).toBe('b');
      expect(vi.getTimerCount()).toBeGreaterThan(timersBefore);

      fixture.destroy();

      expect(controller.isDestroyed).toBe(true);
      expect(controller.buffer).toBe('');
      vi.runOnlyPendingTimers();
      expect(controller.buffer).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('supports shift range selection and Ctrl+A over visible eligible options', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();
    component.activeIndex.set(0);
    component['onKeyDown'](
      new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, cancelable: true }),
    );
    expect(component.values()).toEqual(['a', 'b']);
    component['onKeyDown'](
      new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, cancelable: true }),
    );
    expect(component.values()).toEqual(['a', 'b']);
  });

  it('implements desktop meta-key replacement and additive selection', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('metaKeySelection', true);
    fixture.detectChanges();
    component['toggleOption'](options[0], new MouseEvent('click'));
    component['toggleOption'](options[1], new MouseEvent('click', { ctrlKey: true }));
    expect(component.values()).toEqual(['a', 'b']);
    component['toggleOption'](options[0], new MouseEvent('click'));
    expect(component.values()).toEqual(['a']);
  });

  it('keeps controlled filter value immutable until the owner echoes it', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('searchable', true);
    fixture.componentRef.setInput('filterValue', 'alpha');
    fixture.detectChanges();
    const emitted: string[] = [];
    component.filter.subscribe((event) => emitted.push(event.filter));
    component.setFilter('beta');
    expect(emitted).toEqual(['beta']);
    expect(component.currentFilter()).toBe('alpha');
    expect(component.filteredOptions()).toEqual([options[0]]);
  });

  it('supports field filters, match modes and a distinct empty-filter message', () => {
    const users = [
      { id: 1, name: 'Álvaro', city: 'Madrid' },
      { id: 2, name: 'Bea', city: 'Berlin' },
    ];
    const typed = TestBed.createComponent(NeuListboxComponent) as ComponentFixture<
      NeuListboxComponent<any, number>
    >;
    typed.componentRef.setInput('options', users);
    typed.componentRef.setInput('optionLabel', 'name');
    typed.componentRef.setInput('optionValue', 'id');
    typed.componentRef.setInput('searchable', true);
    typed.componentRef.setInput('filterConfig', { fields: ['city'], matchMode: 'startsWith' });
    typed.componentRef.setInput('noResultsMessage', 'Nothing in this city');
    typed.detectChanges();
    typed.componentInstance.setFilter('ber');
    typed.detectChanges();
    expect(typed.componentInstance.filteredOptions()).toEqual([users[1]]);
    typed.componentInstance.setFilter('par');
    typed.detectChanges();
    expect(typed.nativeElement.textContent).toContain('Nothing in this city');
  });

  it('normalizes typed groups without exposing group rows as options', () => {
    interface Group {
      title: string;
      locked?: boolean;
      children: NeuListboxOption[];
    }
    const groups: Group[] = [
      { title: 'Core', children: [options[0], options[1]] },
      { title: 'Locked', locked: true, children: [{ label: 'Gamma', value: 'g' }] },
    ];
    const grouped = TestBed.createComponent(NeuListboxComponent) as ComponentFixture<
      NeuListboxComponent<NeuListboxOption, string, Group>
    >;
    grouped.componentRef.setInput('groups', groups);
    grouped.componentRef.setInput('groupConfig', {
      labelAccessor: 'title',
      childrenAccessor: 'children',
      disabledAccessor: 'locked',
    });
    grouped.detectChanges();
    expect(grouped.nativeElement.querySelectorAll('.neu-listbox__group').length).toBe(2);
    expect(grouped.nativeElement.querySelectorAll('[role="option"]').length).toBe(3);
    grouped.componentInstance['toggleOption'](groups[1].children[0]);
    expect(grouped.componentInstance.values()).toEqual([]);
  });

  it('uses identity accessors across immutable option replacement', () => {
    const first = [
      { id: 1, name: 'First' },
      { id: 2, name: 'Second' },
    ];
    const typed = TestBed.createComponent(NeuListboxComponent) as ComponentFixture<
      NeuListboxComponent<any, any>
    >;
    typed.componentRef.setInput('options', first);
    typed.componentRef.setInput('optionLabel', 'name');
    typed.componentRef.setInput('identityConfig', { identityAccessor: 'id' });
    typed.componentInstance.writeValue(first[1]);
    typed.componentRef.setInput('options', [
      { id: 1, name: 'First v2' },
      { id: 2, name: 'Second v2' },
    ]);
    typed.detectChanges();
    expect(typed.nativeElement.querySelectorAll('[aria-selected="true"]').length).toBe(1);
    expect(typed.nativeElement.querySelector('[aria-selected="true"]').textContent).toContain(
      'Second v2',
    );
  });

  it('bounds rendered option DOM under virtual scrolling', () => {
    const many = Array.from({ length: 200 }, (_, index) => ({
      label: `Option ${index}`,
      value: String(index),
    }));
    fixture.componentRef.setInput('options', many);
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualScrollViewportItems', 8);
    fixture.componentRef.setInput('virtualScrollBuffer', 2);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role="option"]').length).toBeLessThanOrEqual(
      12,
    );
    const list = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    Object.defineProperty(list, 'scrollTop', { value: 1600, configurable: true });
    list.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Option 40');
  });

  it('emits bounded, monotonic lazy requests and loader rows', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('lazy', true);
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('totalItems', 1000);
    fixture.detectChanges();
    const requests: any[] = [];
    component.lazyRequest.subscribe((request) => requests.push(request));
    component['onListFocus'](new FocusEvent('focus'));
    const list = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    Object.defineProperty(list, 'scrollTop', { value: 400, configurable: true });
    list.dispatchEvent(new Event('scroll', { bubbles: true }));
    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({ first: 0, end: 14, count: 14, reason: 'initial' });
    expect(requests[1].requestId).toBeGreaterThan(requests[0].requestId);
    expect(component.renderedRows().length).toBe(14);
  });

  it('keeps selectAll controlled and emits an immutable visible-scope proposal', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('checkbox', true);
    fixture.componentRef.setInput('selectAll', false);
    fixture.detectChanges();
    const events: any[] = [];
    component.selectAllChangeDetail.subscribe((event) => events.push(event));
    component.toggleAll(new MouseEvent('click'));
    expect(component.values()).toEqual([]);
    expect(events[0]).toMatchObject({
      checked: true,
      scope: 'visible-eligible',
      value: ['a', 'b'],
    });
  });

  it('renders native form metadata and stable active-descendant targets', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'roles');
    fixture.componentRef.setInput('name', 'roles');
    fixture.componentRef.setInput('required', true);
    component.writeValue('b');
    fixture.detectChanges();
    const list = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    list.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(list.getAttribute('aria-activedescendant')).toBe('roles-option-1');
    expect(fixture.nativeElement.querySelector('#roles-option-1')).toBeTruthy();
    const native = fixture.nativeElement.querySelector('select[name="roles"]') as HTMLSelectElement;
    expect(native.required).toBe(true);
    expect(native.value).toBe('b');
  });

  it('keeps readonly navigable but blocks selection and all selection outputs', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    const changes = vi.spyOn(component.changeDetail, 'emit');
    const legacy = vi.spyOn(component.selectionChange, 'emit');
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    expect(component.activeIndex()).toBe(0);
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(component.values()).toEqual([]);
    expect(changes).not.toHaveBeenCalled();
    expect(legacy).not.toHaveBeenCalled();
  });

  it('keeps programmatic writes and reset silent for falsy, NaN, unknown and empty values', () => {
    const typed = TestBed.createComponent(NeuListboxComponent) as ComponentFixture<
      NeuListboxComponent<number, number>
    >;
    typed.componentRef.setInput('options', [0, 1, Number.NaN]);
    typed.detectChanges();
    const changes = vi.spyOn(typed.componentInstance.changeDetail, 'emit');
    const legacy = vi.spyOn(typed.componentInstance.selectionChange, 'emit');
    typed.componentInstance.writeValue(0);
    expect(typed.componentInstance['isSelected'](0)).toBe(true);
    typed.componentInstance.writeValue(Number.NaN);
    expect(typed.componentInstance['isSelected'](Number.NaN)).toBe(true);
    typed.componentInstance.writeValue(999);
    expect(typed.componentInstance.values()).toEqual([999]);
    typed.componentInstance.writeValue(null);
    expect(typed.componentInstance.values()).toEqual([]);
    expect(changes).not.toHaveBeenCalled();
    expect(legacy).not.toHaveBeenCalled();
  });

  it('emits one CVA, legacy and detailed change for one semantic selection', () => {
    const component = fixture.componentInstance;
    const cva: unknown[] = [];
    const legacy: unknown[] = [];
    const detailed: unknown[] = [];
    component.registerOnChange((value) => cva.push(value));
    component.selectionChange.subscribe((value) => legacy.push(value));
    component.changeDetail.subscribe((value) => detailed.push(value));
    component['toggleOption'](options[0], new MouseEvent('click'));
    expect(cva).toHaveLength(1);
    expect(legacy).toHaveLength(1);
    expect(detailed).toHaveLength(1);
  });

  it('emits a filtered immutable reorder proposal without mutating source options', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('dragdrop', true);
    component.setFilter('a');
    fixture.detectChanges();
    const proposals: any[] = [];
    component.drop.subscribe((event) => proposals.push(event));
    const data = component.renderedRows();
    component['onDropRow']({
      item: { data: data[0].row },
      container: { data },
      currentIndex: 1,
      event: new MouseEvent('mouseup'),
    } as any);
    expect(options.map((option) => option.value)).toEqual(['a', 'b', 'd']);
    expect(proposals[0]).toMatchObject({ previousIndex: 0, currentIndex: 1 });
    expect(proposals[0].options.map((option: NeuListboxOption) => option.value)).toEqual([
      'b',
      'a',
      'd',
    ]);
  });

  it('renders every typed projection across grouped, loading and empty states', async () => {
    @Component({
      imports: [
        NeuListboxComponent,
        NeuListboxItemDirective,
        NeuListboxGroupDirective,
        NeuListboxFilterDirective,
        NeuListboxLoaderDirective,
        NeuListboxHeaderDirective,
        NeuListboxFooterDirective,
        NeuListboxEmptyDirective,
        NeuListboxEmptyFilterDirective,
      ],
      template: `
        <neu-listbox
          [groups]="groups"
          [groupConfig]="groupConfig"
          [searchable]="true"
          [filterValue]="filterValue"
          [lazy]="lazy"
          [loading]="loading"
          [totalItems]="20"
          [virtualScroll]="lazy"
          [virtualScrollViewportItems]="2"
          [virtualScrollBuffer]="0"
        >
          <ng-template neuListboxHeader>Projected header</ng-template>
          <ng-template neuListboxFooter>Projected footer</ng-template>
          <ng-template
            [neuListboxFilter]="{}"
            let-value="value"
            let-filter="filter"
            let-reset="reset"
          >
            <button class="filter-value" (click)="filter('beta')">{{ value || 'empty' }}</button>
            <button class="filter-reset" (click)="reset()">Reset</button>
          </ng-template>
          <ng-template [neuListboxGroup]="groups" let-group let-disabled="disabled">
            Group {{ group.title }} {{ disabled }}
          </ng-template>
          <ng-template
            [neuListboxItem]="itemOptions"
            let-option
            let-active="active"
            let-selected="selected"
          >
            Item {{ option.label }} {{ active }} {{ selected }}
          </ng-template>
          <ng-template neuListboxLoader let-index="logicalIndex" let-count="count">
            Loader {{ index }} / {{ count }}
          </ng-template>
          <ng-template neuListboxEmpty>Projected empty</ng-template>
          <ng-template neuListboxEmptyFilter>Projected empty filter</ng-template>
        </neu-listbox>
      `,
    })
    class ProjectionHostComponent {
      readonly itemOptions: NeuListboxOption[] = [{ label: 'Alpha', value: 'a' }];
      groups: Array<{ title: string; disabled?: boolean; items: NeuListboxOption[] }> = [
        { title: 'Core', items: this.itemOptions },
        {
          title: 'Locked',
          disabled: true,
          items: [{ label: 'Beta', value: 'b' }],
        },
      ];
      readonly groupConfig = {
        labelAccessor: 'title' as const,
        childrenAccessor: 'items' as const,
        disabledAccessor: 'disabled' as const,
      };
      filterValue: string | null = null;
      lazy = false;
      loading = false;
    }

    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [ProjectionHostComponent] })
      .compileComponents();
    const host = TestBed.createComponent(ProjectionHostComponent);
    host.detectChanges();
    expect(host.nativeElement.textContent).toContain('Projected header');
    expect(host.nativeElement.textContent).toContain('Group Core false');
    expect(host.nativeElement.textContent).toContain('Group Locked true');
    expect(host.nativeElement.textContent).toContain('Item Alpha');

    const projectedListbox = host.debugElement.children[0].componentInstance as NeuListboxComponent;
    projectedListbox['filterTemplateContext']().filter('beta');
    projectedListbox['filterTemplateContext']().reset();

    const loadingHost = TestBed.createComponent(ProjectionHostComponent);
    loadingHost.componentInstance.groups = [];
    loadingHost.componentInstance.lazy = true;
    loadingHost.componentInstance.loading = true;
    loadingHost.detectChanges();
    expect(loadingHost.nativeElement.textContent).toContain('Loader 0 / 1');

    const emptyHost = TestBed.createComponent(ProjectionHostComponent);
    emptyHost.componentInstance.groups = [];
    emptyHost.detectChanges();
    expect(emptyHost.nativeElement.textContent).toContain('Projected empty');

    const filteredEmptyHost = TestBed.createComponent(ProjectionHostComponent);
    filteredEmptyHost.componentInstance.groups = [];
    filteredEmptyHost.componentInstance.filterValue = 'missing';
    filteredEmptyHost.detectChanges();
    expect(filteredEmptyHost.nativeElement.textContent).toContain('Projected empty filter');
    expect(filteredEmptyHost.nativeElement.textContent).toContain('Projected footer');
  });

  it('covers focus, pointer and filter keyboard policy combinations atomically', () => {
    const component = fixture.componentInstance;
    const optionEvents: unknown[] = [];
    const doubleEvents: unknown[] = [];
    component.optionClick.subscribe((event) => optionEvents.push(event));
    component.optionDoubleClick.subscribe((event) => doubleEvents.push(event));
    fixture.componentRef.setInput('selectOnFocus', true);
    fixture.detectChanges();

    component['onListFocus'](new FocusEvent('focus'));
    expect(component.values()).toEqual(['a']);
    component['onOptionMouseEnter'](1);
    expect(component.activeIndex()).toBe(1);
    component['onOptionDoubleClick'](new MouseEvent('dblclick'), component.visibleRows()[1] as any);
    component['markTouchInteraction']();
    component['selectOption'](
      new MouseEvent('click', { ctrlKey: true }),
      component.visibleRows()[1] as any,
      1,
    );
    expect(optionEvents.length).toBeGreaterThan(0);
    expect(doubleEvents).toHaveLength(1);

    component['onFilterKeyDown'](new KeyboardEvent('keydown', { key: 'x' }));
    component['onFilterKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    component['onFilterKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    component['onFilterKeyDown'](new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'PageDown', cancelable: true }));
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'PageUp', cancelable: true }));
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'z', altKey: true }));
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));

    const child = fixture.nativeElement.querySelector('.neu-listbox__option') as HTMLElement;
    component['onListBlur'](new FocusEvent('blur', { relatedTarget: child }));
    expect(component.focused()).toBe(true);
    component['onListBlur'](new FocusEvent('blur'));
    expect(component.focused()).toBe(false);
  });

  it('covers virtual, lazy, native-value and drag guard boundaries', () => {
    const component = fixture.componentInstance;
    expect(component['optionPosition'](component.visibleRows()[0] as any, 0)).toBe(1);
    expect(component['loaderTemplateContext'](7)).toEqual({
      $implicit: 7,
      logicalIndex: 7,
      first: 7,
      end: 8,
      count: 1,
    });
    component['onScroll'](new Event('scroll'));
    component['onDropRow']({} as any);
    expect(component['canDrag'](component.visibleRows()[0] as any)).toBe(false);

    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualScrollItemSize', Number.NaN);
    fixture.componentRef.setInput('lazy', true);
    fixture.componentRef.setInput('dataFirst', 5);
    fixture.componentRef.setInput('totalItems', null);
    fixture.detectChanges();
    const lazyRow = component.visibleRows()[0] as any;
    expect(component['optionPosition'](lazyRow, 0)).toBe(6);
    component['onListFocus'](new FocusEvent('focus'));
    component['onListFocus'](new FocusEvent('focus'));
    expect(component['loaderTemplateContext'](5).first).toBe(0);

    component.writeValue([null, true, 3, 4n, { id: 1 }, BigInt(5)] as any);
    expect(component.selectedNativeValues().map((entry) => entry.value)).toEqual([
      '',
      'true',
      '3',
      '4',
      '{"id":1}',
      '5',
    ]);
    const circular: any = {};
    circular.self = circular;
    component.writeValue(circular);
    expect(component.selectedNativeValues()[0].value).toBe('[object Object]');
  });

  it('covers selection, toggle-all and reorder no-op branches without mutation', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('metaKeySelection', true);
    fixture.componentRef.setInput('dragdrop', true);
    fixture.detectChanges();

    component['toggleOption'](options[0], new MouseEvent('click', { metaKey: true }));
    component['toggleOption'](options[0], new MouseEvent('click', { metaKey: true }));
    component['toggleOption'](options[0], new MouseEvent('click'));
    component['markTouchInteraction']();
    component['toggleOption'](options[1], new MouseEvent('click', { ctrlKey: true }));
    expect(component.values()).toEqual(['a', 'b']);
    component.toggleAll(new MouseEvent('click'));
    expect(component.values()).toEqual([]);
    component.toggleAll(new MouseEvent('click'));
    expect(component['allSelected']()).toBe(true);

    const rows = component.renderedRows();
    const event = {
      item: { data: rows[0].row },
      container: { data: rows },
      currentIndex: 0,
      event: new MouseEvent('mouseup'),
    } as any;
    component['onDropRow'](event);
    event.item.data = undefined;
    component['onDropRow'](event);
    event.item.data = rows[2].row;
    component['onDropRow'](event);

    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    component.toggleAll(new MouseEvent('click'));
    component['onOptionDoubleClick'](new MouseEvent('dblclick'), rows[0].row as any);
    expect(component['canDrag'](rows[0].row as any)).toBe(false);
  });

  it('covers rendered indicator, legacy-group and empty virtual boundaries', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('checkbox', true);
    fixture.componentRef.setInput('checkmark', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-listbox__indicator')?.textContent).toBe('');
    component['toggleOption'](options[0]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.neu-listbox__indicator')[1].textContent).toBe(
      '✓',
    );
    component.toggleAll(new MouseEvent('click'));
    fixture.detectChanges();

    fixture.componentRef.setInput('options', [
      { label: 'One', value: '1', group: 'First' },
      { label: 'Two', value: '2', group: 'First' },
      { label: 'Loose', value: '3' },
    ]);
    fixture.detectChanges();
    expect(component.normalizedRows().some((row) => row.kind === 'group')).toBe(true);
    component['setActiveRow'](0);
    component['setActiveRow'](3);

    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('emptyLabel', 'Explicit empty');
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.detectChanges();
    expect(component.renderedRows()).toEqual([]);
    expect(component.virtualTopHeight()).toBe(0);
    expect(component.virtualBottomHeight()).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Explicit empty');
    fixture.componentRef.setInput('emptyLabel', 'No options found');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No options found');
    component.focused.set(true);
    component.activeIndex.set(0);
    expect(component.activeDescendantId()).toBeNull();
  });

  it('routes the complete rendered pointer, touch, filter, toggle and blur lifecycle', () => {
    const component = fixture.componentInstance as any;
    const doubleClicks: unknown[] = [];
    component.optionDoubleClick.subscribe((event: unknown) => doubleClicks.push(event));
    fixture.componentRef.setInput('searchable', true);
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('checkbox', true);
    fixture.componentRef.setInput('showToggleAll', true);
    fixture.detectChanges();

    for (const accessor of [
      'itemTpl',
      'indicatorTpl',
      'groupTpl',
      'filterTpl',
      'loaderTpl',
      'headerTpl',
      'footerTpl',
      'emptyTpl',
      'emptyFilterTpl',
    ]) {
      expect(component[accessor]()).toBeUndefined();
    }

    const list = fixture.nativeElement.querySelector('.neu-listbox__options') as HTMLElement;
    const search = fixture.nativeElement.querySelector('.neu-listbox__search') as HTMLInputElement;
    const first = fixture.nativeElement.querySelector('.neu-listbox__option') as HTMLElement;
    list.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    first.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    first.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    first.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
    first.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    search.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    search.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    (fixture.nativeElement.querySelector('.neu-listbox__toggle-all') as HTMLButtonElement).click();
    list.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

    expect(doubleClicks).toHaveLength(1);
    expect(component.values()).toEqual(['a', 'b']);
    expect(component.focused()).toBe(false);
  });

  it('preserves numeric identity, controlled select-all and virtual/lazy guard boundaries', () => {
    const numericFixture = TestBed.createComponent(NeuListboxComponent);
    const numeric = numericFixture.componentInstance as any;
    const numericOptions = [
      { label: 'Positive zero', value: 0 },
      { label: 'Negative zero', value: -0 },
      { label: 'One', value: 1 },
    ];
    numericFixture.componentRef.setInput('options', numericOptions);
    numericFixture.componentRef.setInput('multiple', true);
    numericFixture.componentRef.setInput('checkbox', true);
    numeric.writeValue([0, -0]);
    numericFixture.detectChanges();

    expect(numeric.isOptionSelected(numericOptions[0])).toBe(true);
    expect(numeric.isOptionSelected(numericOptions[1])).toBe(true);
    expect(numeric.isOptionSelected(numericOptions[2])).toBe(false);
    numericFixture.componentRef.setInput('identityConfig', {
      compareWith: (left: number, right: number) => Object.is(left, right),
    });
    numericFixture.detectChanges();
    expect(numeric.isOptionSelected(numericOptions[0])).toBe(true);
    expect(numeric.isOptionSelected(numericOptions[2])).toBe(false);

    numericFixture.componentRef.setInput('selectAll', true);
    numericFixture.detectChanges();
    const before = numeric.values();
    numeric.toggleAll(new Event('toggle'));
    expect(numeric.values()).toBe(before);
    expect(numeric.allSelected()).toBe(true);

    numericFixture.componentRef.setInput('virtualScroll', true);
    numericFixture.componentRef.setInput('virtualScrollViewportItems', 1);
    numericFixture.componentRef.setInput('virtualScrollBuffer', -1);
    numericFixture.componentRef.setInput('virtualScrollItemSize', 0);
    numeric.virtualFirst.set(99);
    numericFixture.detectChanges();
    expect(numeric.renderedRows()).toHaveLength(1);
    expect(numeric.virtualTopHeight()).toBeGreaterThanOrEqual(0);
    expect(numeric['safeItemSize']()).toBe(1);
    numeric.activeIndex.set(0);
    numeric['ensureActiveRendered'](0);
    expect(numeric.virtualFirst()).toBe(0);
    numeric['moveActive'](new KeyboardEvent('keydown', { cancelable: true }), -1);

    numericFixture.componentRef.setInput('lazy', true);
    numericFixture.componentRef.setInput('loading', true);
    numericFixture.componentRef.setInput('options', []);
    numericFixture.componentRef.setInput('totalItems', 20);
    numericFixture.componentRef.setInput('dataFirst', 4);
    numericFixture.detectChanges();
    expect(numeric.filteredOptions()).toEqual([]);
    expect(numeric.logicalOptionCount()).toBe(20);
    expect(numeric.virtualTopHeight()).toBe(4);
    numeric.setFilter('missing');
    numeric.setFilter('');
    numeric['onScroll']({ currentTarget: { scrollTop: 12 } } as unknown as Event);
    expect(numeric.virtualFirst()).toBe(12);

    numericFixture.componentRef.setInput('disabled', true);
    numericFixture.detectChanges();
    numeric['onListFocus'](new FocusEvent('focus'));
    numeric['onKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(numeric.focused()).toBe(false);
  });
});
