import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import {
  NeuInputTagsComponent,
  NeuInputTagsFooterDirective,
  NeuInputTagsGroupDirective,
  NeuInputTagsHeaderDirective,
  NeuInputTagsItemDirective,
  NeuInputTagsOptionDirective,
  NeuInputTagsRemoveIconDirective,
} from './neu-input-tags.component';

interface Skill {
  label: string;
  id: string;
  disabled?: boolean;
}

describe('NeuInputTagsComponent', () => {
  let fixture: ComponentFixture<NeuInputTagsComponent<Skill>>;
  let component: NeuInputTagsComponent<Skill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuInputTagsComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuInputTagsComponent<Skill>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('optionLabel', 'label');
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.detectChanges();
  });

  it('keeps the CVA contract and adds values only on explicit configured gestures', () => {
    expect(component.groupedOptions()).toEqual([]);
    expect(component.trackValue(8, undefined as unknown as Skill)).toBe(8);
    const changes: Skill[][] = [];
    component.registerOnChange((value) => changes.push(value));
    component.writeValue([{ label: 'Angular', id: 'ng' }]);
    component.query.set('React');
    component.onBlur(new FocusEvent('blur'));
    expect(component.model()).toHaveLength(1);

    fixture.componentRef.setInput('addOnBlur', true);
    fixture.detectChanges();
    component.query.set('React');
    component.onBlur(new FocusEvent('blur'));
    expect(component.model().map((item) => (typeof item === 'string' ? item : item.id))).toEqual([
      'ng',
      'React',
    ]);
    expect(changes).toHaveLength(1);

    component.setDisabledState(true);
    component.query.set('Vue');
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.model()).toHaveLength(2);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).disabled).toBe(true);
  });

  it('supports typeahead option mappings, active keyboard selection and detailed events', () => {
    vi.useFakeTimers();
    const selected = vi.spyOn(component.select, 'emit');
    const completed = vi.spyOn(component.completeMethod, 'emit');
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('delay', 0);
    fixture.componentRef.setInput('suggestions', [
      { label: 'Angular', id: 'ng' },
      { label: 'React', id: 'react', disabled: true },
      { label: 'Vue', id: 'vue' },
    ]);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    vi.runAllTimers();
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(completed).toHaveBeenCalledWith(expect.objectContaining({ query: 'a' }));
    expect(component.model()).toEqual(['ng']);
    expect(selected).toHaveBeenCalledWith(expect.objectContaining({ value: 'ng' }));
    expect(
      fixture.nativeElement.querySelector('.neu-input-tags__item-label')?.textContent,
    ).toContain('ng');
    vi.useRealTimers();
  });

  it('buffers IME typeahead completion and ignores composing action keys', () => {
    vi.useFakeTimers();
    const completed = vi.spyOn(component.completeMethod, 'emit');
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('delay', 0);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'に';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true }));
    input.value = '日本';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    vi.runAllTimers();

    expect(completed).toHaveBeenCalledTimes(1);
    expect(completed).toHaveBeenCalledWith(expect.objectContaining({ query: '日本' }));
    expect(component.model()).toEqual([]);
    vi.useRealTimers();
  });

  it('handles delimiter, paste, Tab, Backspace and maximum/duplicate policies', () => {
    fixture.componentRef.setInput('delimiter', /[,;]/g);
    fixture.componentRef.setInput('addOnPaste', true);
    fixture.componentRef.setInput('addOnTab', true);
    fixture.componentRef.setInput('max', 3);
    fixture.detectChanges();
    component.query.set('one,two');
    component['onKeyDown'](new KeyboardEvent('keydown', { key: ',' }));
    expect(component.model()).toEqual(['one', 'two']);

    const paste = new Event('paste') as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => 'three;four' } });
    component.onPaste(paste);
    expect(component.model()).toEqual(['one', 'two', 'three']);
    component.query.set('three');
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(component.model()).toEqual(['one', 'two', 'three']);
    component.query.set('');
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(component.model()).toEqual(['one', 'two']);
  });

  it('exposes accessible combobox markup and removes values through the template', () => {
    component.writeValue(['Angular' as unknown as Skill]);
    fixture.componentRef.setInput('inputId', 'skills');
    fixture.componentRef.setInput('name', 'skills');
    fixture.componentRef.setInput('ariaDescribedBy', 'skills-help');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.id).toBe('skills');
    expect(input.name).toBe('skills');
    expect(input.getAttribute('aria-describedby')).toBe('skills-help');
    (fixture.nativeElement.querySelector('.neu-input-tags__remove') as HTMLButtonElement).click();
    expect(component.model()).toEqual([]);
  });

  it('supports focus completion, function accessors, controlled option removal and escape', () => {
    const shown = vi.spyOn(component.show, 'emit');
    const hidden = vi.spyOn(component.hide, 'emit');
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('completeOnFocus', true);
    fixture.componentRef.setInput('optionLabel', (item: Skill) => item.label.toUpperCase());
    fixture.componentRef.setInput('optionValue', (item: Skill) => item.id);
    fixture.componentRef.setInput('optionDisabled', (item: Skill) => item.disabled === true);
    fixture.componentRef.setInput('suggestions', [
      { label: 'Vue', id: 'vue' },
      { label: 'Blocked', id: 'blocked', disabled: true },
    ]);
    fixture.detectChanges();
    component.onFocus(new FocusEvent('focus'));
    expect(shown).toHaveBeenCalled();
    expect(component.availableOptions()).toEqual([{ label: 'Vue', id: 'vue' }]);
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(hidden).toHaveBeenCalled();
    component.writeValue([{ label: 'Vue', id: 'vue' }]);
    component.removeItem(new Event('click'), 4);
    expect(component.model()).toHaveLength(1);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    component.removeItem(new Event('click'), 0);
    expect(component.model()).toHaveLength(1);
  });

  it('covers inactive typeahead and identity policies without changing NeuTags-style defaults', () => {
    const hide = vi.spyOn(component.hide, 'emit');
    component.query.set('draft');
    component['onInput']({ target: { value: 'draft' } } as unknown as Event);
    expect(component.panelOpen()).toBe(false);
    expect(hide).not.toHaveBeenCalled();
    fixture.componentRef.setInput('delimiter', ',');
    fixture.componentRef.setInput('allowDuplicate', true);
    fixture.componentRef.setInput('max', null);
    fixture.detectChanges();
    component.query.set('one,two');
    component['onKeyDown'](new KeyboardEvent('keydown', { key: ',' }));
    component.query.set('one');
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.model()).toEqual(['one', 'two', 'one']);
    expect(component.trackValue(3, 'one' as unknown as Skill)).toBe('one');
    expect(component.trackOption(3, 'one' as unknown as Skill)).toBe('one');
    component.onPaste(new Event('paste') as ClipboardEvent);
    expect(component.model()).toHaveLength(3);
  });

  it('covers empty values, IDs, direct disabled options and touch registration', () => {
    let touched = 0;
    component.registerOnTouched(() => touched++);
    component.writeValue(null);
    fixture.componentRef.setInput('max', 0);
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('optionDisabled', 'disabled');
    fixture.detectChanges();
    component.query.set('blocked');
    component['selectOption'](new Event('click'), {
      label: 'Blocked',
      id: 'blocked',
      disabled: true,
    });
    component.onBlur(new FocusEvent('blur'));
    expect(component.model()).toEqual([]);
    expect(touched).toBe(1);
    expect(component.optionId(2)).toContain('-option-2');
    expect(component.itemLabel({ label: 'Name', id: 'name' })).toBe('Name');
    component.focusInput();
  });

  it('keeps grouped identities, zero values and optional clipboard data deterministic', () => {
    const edgeFixture = TestBed.createComponent(NeuInputTagsComponent<any>);
    const objectGroup = {
      label: 'Frameworks',
      children: [{ label: 'Angular', id: 'ng' }],
    };
    edgeFixture.componentRef.setInput('group', true);
    edgeFixture.componentRef.setInput('suggestions', [objectGroup]);
    edgeFixture.componentRef.setInput('optionGroupLabel', 'label');
    edgeFixture.componentRef.setInput('optionGroupChildren', 'children');
    edgeFixture.componentRef.setInput('optionLabel', 'label');
    edgeFixture.componentRef.setInput('optionValue', 'id');
    edgeFixture.detectChanges();
    const edge = edgeFixture.componentInstance as any;

    expect(edge.groupedOptionIndex(objectGroup, 0)).toBe(0);
    expect(edge.groupedOptionIndex({ label: 'missing', children: [] }, 2)).toBe(2);
    expect(edge.trackOption(7, null)).toBe(7);
    expect(edge.trackGroup(8, {})).toBe('[object Object]');

    edgeFixture.componentRef.setInput('group', false);
    edgeFixture.componentRef.setInput('optionValue', null);
    edgeFixture.componentRef.setInput('addOnPaste', true);
    edgeFixture.detectChanges();
    edge.writeValue([0, -0]);
    expect(edge.containsValue(0)).toBe(true);
    expect(edge.containsValue(-0)).toBe(true);
    expect(edge.containsValue(1)).toBe(false);

    const paste = new Event('paste', { cancelable: true }) as ClipboardEvent;
    edge.onPaste(paste);
    expect(paste.defaultPrevented).toBe(false);

    edgeFixture.componentRef.setInput('suggestions', ['one']);
    edgeFixture.componentRef.setInput('focusOnHover', false);
    edgeFixture.detectChanges();
    edge.activeIndex.set(-1);
    edge.onOptionHover('one');
    expect(edge.activeIndex()).toBe(-1);
    edgeFixture.componentRef.setInput('focusOnHover', true);
    edgeFixture.detectChanges();
    edge.onOptionHover('one');
    expect(edge.activeIndex()).toBe(0);

    edgeFixture.componentRef.setInput('group', true);
    edgeFixture.componentRef.setInput('suggestions', ['primitive-group']);
    edgeFixture.componentRef.setInput('optionGroupLabel', (group: string) => group);
    edgeFixture.componentRef.setInput('optionGroupChildren', () => ['child']);
    edgeFixture.detectChanges();
    expect(edge.groupedOptionIndex('primitive-group', 0)).toBe(0);
  });

  it('runs the rendered option, blur and paste listeners with active listbox state', () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('delay', 0);
    fixture.componentRef.setInput('addOnPaste', true);
    fixture.componentRef.setInput('addOnBlur', true);
    fixture.componentRef.setInput('suggestions', [{ label: 'Angular', id: 'ng' }]);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    vi.runAllTimers();
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    const option = fixture.nativeElement.querySelector(
      '.neu-input-tags__option',
    ) as HTMLButtonElement;
    option.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    option.click();
    fixture.detectChanges();
    Object.defineProperty(input, 'value', { value: 'blur tag', configurable: true });
    input.dispatchEvent(new FocusEvent('blur'));
    input.dispatchEvent(
      Object.assign(new Event('paste', { bubbles: true }), {
        clipboardData: { getData: () => '' },
      }),
    );
    expect(component.model()).toContain('ng');
    vi.useRealTimers();
  });

  it('integrates with reactive forms', async () => {
    @Component({
      imports: [NeuInputTagsComponent, ReactiveFormsModule],
      template: '<neu-input-tags [formControl]="control" />',
    })
    class Host {
      readonly control = new FormControl<unknown[]>(['Angular']);
    }
    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [Host] })
      .compileComponents();
    const host = TestBed.createComponent(Host);
    host.detectChanges();
    const input = host.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Signals';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(host.componentInstance.control.value).toEqual(['Angular', 'Signals']);
  });

  it('renders typed group and content templates without treating group rows as values', async () => {
    interface Group {
      label: string;
      items: Skill[];
    }
    @Component({
      imports: [
        NeuInputTagsComponent,
        NeuInputTagsItemDirective,
        NeuInputTagsRemoveIconDirective,
        NeuInputTagsOptionDirective,
        NeuInputTagsGroupDirective,
        NeuInputTagsHeaderDirective,
        NeuInputTagsFooterDirective,
      ],
      template: `<neu-input-tags
        [typeahead]="true"
        [delay]="0"
        [group]="true"
        [suggestions]="groups"
        optionGroupLabel="label"
        optionGroupChildren="items"
        optionLabel="label"
        ><ng-template neuInputTagsHeader>Header</ng-template
        ><ng-template neuInputTagsGroup let-group>Group: {{ group.label }}</ng-template
        ><ng-template neuInputTagsOption let-option let-index="index"
          >{{ index }}: {{ option.label }}</ng-template
        ><ng-template neuInputTagsItem let-item let-index="index" let-onRemove="onRemove"
          >Tag {{ index }}: {{ item.label }}</ng-template
        ><ng-template neuInputTagsRemoveIcon>Remove icon</ng-template
        ><ng-template neuInputTagsFooter>Footer</ng-template></neu-input-tags
      >`,
    })
    class Host {
      readonly groups: readonly Group[] = [
        { label: 'Frontend', items: [{ label: 'Angular', id: 'ng' }] },
        { label: 'Blocked', items: [{ label: 'React', id: 'react', disabled: true }] },
      ];
    }
    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [Host] })
      .compileComponents();
    const host = TestBed.createComponent(Host);
    host.detectChanges();
    const input = host.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    await new Promise((resolve) => setTimeout(resolve));
    host.detectChanges();
    expect(host.nativeElement.textContent).toContain('Header');
    expect(host.nativeElement.textContent).toContain('Group: Frontend');
    expect(host.nativeElement.textContent).toContain('0: Angular');
    expect(host.nativeElement.textContent).toContain('Footer');
    const inner = host.debugElement.children[0].componentInstance as NeuInputTagsComponent<
      Skill | Group
    >;
    const option = host.nativeElement.querySelector('.neu-input-tags__option') as HTMLButtonElement;
    option.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    option.click();
    host.detectChanges();
    expect(inner.model()).toEqual([{ label: 'Angular', id: 'ng' }]);
    expect(host.nativeElement.textContent).toContain('Tag 0: Angular');
  });

  it('applies option-focus policies and form/native presentation to the real text input', async () => {
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('delay', 0);
    fixture.componentRef.setInput('autoOptionFocus', true);
    fixture.componentRef.setInput('focusOnHover', true);
    fixture.componentRef.setInput('suggestions', [
      { label: 'Angular', id: 'ng' },
      { label: 'Vue', id: 'vue' },
    ]);
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('variant', 'filled');
    fixture.componentRef.setInput('fluid', true);
    fixture.componentRef.setInput('autocomplete', 'skills');
    fixture.componentRef.setInput('title', 'Skill tags');
    fixture.componentRef.setInput('minlength', 2);
    fixture.componentRef.setInput('maxlength', 10);
    fixture.componentRef.setInput('pattern', /^[a-z]+$/i);
    fixture.detectChanges();
    fixture.componentRef.setInput('completeOnFocus', true);
    component.onFocus(new FocusEvent('focus'));
    await Promise.resolve();
    expect(component.activeIndex()).toBe(0);
    component['onInput']({ target: { value: 'a' } } as unknown as Event);
    component.onOptionHover(component.availableOptions()[1]);
    expect(component.activeIndex()).toBe(1);
    component.onOptionHover(component.availableOptions()[0]);
    expect(component.activeIndex()).toBe(0);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.autocomplete).toBe('skills');
    expect(input.title).toBe('Skill tags');
    expect(input.maxLength).toBe(10);
    expect(input.getAttribute('minlength')).toBe('2');
    expect(input.pattern).toBe('^[a-z]+$');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.classList).toContain('neu-input-tags--invalid');
    expect(fixture.nativeElement.classList).toContain('neu-input-tags--filled');
    expect(fixture.nativeElement.classList).toContain('neu-input-tags--fluid');
    expect(fixture.nativeElement.classList).toContain('neu-input-tags--size-lg');
  });

  it('integrates with template-driven forms without emitting for a programmatic write', async () => {
    @Component({
      imports: [NeuInputTagsComponent, FormsModule],
      template: '<neu-input-tags [(ngModel)]="skills" name="skills" />',
    })
    class Host {
      skills: unknown[] = ['Angular'];
    }
    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [Host] })
      .compileComponents();
    const host = TestBed.createComponent(Host);
    host.detectChanges();
    await host.whenStable();
    host.detectChanges();
    const input = host.nativeElement.querySelector('input') as HTMLInputElement;
    expect(host.componentInstance.skills).toEqual(['Angular']);
    input.value = 'Signals';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(host.componentInstance.skills).toEqual(['Angular', 'Signals']);
  });

  it('keeps group, focus and native fallbacks safe for incomplete or disabled input', async () => {
    fixture.componentRef.setInput('group', true);
    fixture.componentRef.setInput('optionGroupLabel', 'label');
    fixture.componentRef.setInput('optionGroupChildren', 'items');
    fixture.componentRef.setInput('suggestions', [
      {
        label: 'Frontend',
        id: 'frontend',
        items: [{ label: 'Angular', id: 'ng' }],
      } as unknown as Skill,
    ]);
    fixture.detectChanges();
    expect(component.groupedOptions()).toHaveLength(1);
    expect(component.groupedOptionIndex(component.groupedOptions()[0].group, 0)).toBe(0);
    expect(component.trackGroup(0, component.groupedOptions()[0].group)).toBe('frontend');
    fixture.componentRef.setInput('focusOnHover', false);
    component.onOptionHover(component.availableOptions()[0]);
    expect(component.activeIndex()).toBe(-1);
    fixture.componentRef.setInput('focusOnHover', true);
    fixture.componentRef.setInput('optionDisabled', 'disabled');
    component.onOptionHover({
      label: 'Blocked',
      id: 'blocked',
      disabled: true,
    } as unknown as Skill);
    expect(component.activeIndex()).toBe(-1);
    fixture.componentRef.setInput('pattern', '[a-z]+');
    fixture.componentRef.setInput('optionGroupChildren', null);
    fixture.detectChanges();
    expect(component.nativePattern()).toBe('[a-z]+');
    expect(component.groupedOptions()[0].options).toEqual([]);
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('completeOnFocus', true);
    component.setDisabledState(true);
    component.onFocus(new FocusEvent('focus'));
    await Promise.resolve();
    expect(component.panelOpen()).toBe(false);
  });

  it('projects the remove icon through the default accessible remove button', async () => {
    @Component({
      imports: [
        NeuInputTagsComponent,
        NeuInputTagsOptionDirective,
        NeuInputTagsRemoveIconDirective,
      ],
      template:
        '<neu-input-tags><ng-template neuInputTagsOption let-option><span class="custom-option">{{ option }}</span></ng-template><ng-template neuInputTagsRemoveIcon><span class="custom-remove">×</span></ng-template></neu-input-tags>',
    })
    class Host {}
    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [Host] })
      .compileComponents();
    const host = TestBed.createComponent(Host);
    host.detectChanges();
    const inner = host.debugElement.children[0].componentInstance as NeuInputTagsComponent<string>;
    inner.writeValue(['Angular']);
    host.detectChanges();
    expect(host.nativeElement.querySelector('.custom-remove')).not.toBeNull();
    (host.nativeElement.querySelector('.neu-input-tags__remove') as HTMLButtonElement).click();
    expect(inner.model()).toEqual([]);
  });

  it('renders default grouped rows while retaining keyboard navigation over options only', () => {
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('group', true);
    fixture.componentRef.setInput('optionGroupLabel', 'label');
    fixture.componentRef.setInput('optionGroupChildren', 'items');
    fixture.componentRef.setInput('suggestions', [
      { label: 'Frontend', items: [{ label: 'Angular', id: 'ng' }] },
    ] as unknown as Skill[]);
    fixture.detectChanges();
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Frontend');
    expect(fixture.nativeElement.textContent).toContain('Angular');
    expect(component.activeIndex()).toBe(0);
  });
});
