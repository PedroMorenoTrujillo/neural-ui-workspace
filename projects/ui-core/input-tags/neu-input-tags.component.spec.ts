import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { NeuInputTagsComponent } from './neu-input-tags.component';

interface Skill { label: string; id: string; disabled?: boolean; }

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
    expect(component.model().map((item) => typeof item === 'string' ? item : item.id)).toEqual(['ng', 'React']);
    expect(changes).toHaveLength(1);

    component.setDisabledState(true);
    component.query.set('Vue');
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
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
    input.value = 'a'; input.dispatchEvent(new Event('input'));
    vi.runAllTimers();
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(completed).toHaveBeenCalledWith(expect.objectContaining({ query: 'a' }));
    expect(component.model()).toEqual(['ng']);
    expect(selected).toHaveBeenCalledWith(expect.objectContaining({ value: 'ng' }));
    expect(fixture.nativeElement.querySelector('.neu-input-tags__item-label')?.textContent).toContain('ng');
    vi.useRealTimers();
  });

  it('handles delimiter, paste, Tab, Backspace and maximum/duplicate policies', () => {
    fixture.componentRef.setInput('delimiter', /[,;]/g);
    fixture.componentRef.setInput('addOnPaste', true);
    fixture.componentRef.setInput('addOnTab', true);
    fixture.componentRef.setInput('max', 3);
    fixture.detectChanges();
    component.query.set('one,two');
    component.onKeyDown(new KeyboardEvent('keydown', { key: ',' }));
    expect(component.model()).toEqual(['one', 'two']);

    const paste = new Event('paste') as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => 'three;four' } });
    component.onPaste(paste);
    expect(component.model()).toEqual(['one', 'two', 'three']);
    component.query.set('three'); component.onKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(component.model()).toEqual(['one', 'two', 'three']);
    component.query.set(''); component.onKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(component.model()).toEqual(['one', 'two']);
  });

  it('exposes accessible combobox markup and removes values through the template', () => {
    component.writeValue(['Angular' as unknown as Skill]);
    fixture.componentRef.setInput('inputId', 'skills');
    fixture.componentRef.setInput('name', 'skills');
    fixture.componentRef.setInput('ariaDescribedBy', 'skills-help');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.id).toBe('skills'); expect(input.name).toBe('skills'); expect(input.getAttribute('aria-describedby')).toBe('skills-help');
    (fixture.nativeElement.querySelector('.neu-input-tags__remove') as HTMLButtonElement).click();
    expect(component.model()).toEqual([]);
  });

  it('supports focus completion, function accessors, controlled option removal and escape', () => {
    const shown = vi.spyOn(component.show, 'emit'); const hidden = vi.spyOn(component.hide, 'emit');
    fixture.componentRef.setInput('typeahead', true); fixture.componentRef.setInput('completeOnFocus', true);
    fixture.componentRef.setInput('optionLabel', (item: Skill) => item.label.toUpperCase());
    fixture.componentRef.setInput('optionValue', (item: Skill) => item.id);
    fixture.componentRef.setInput('optionDisabled', (item: Skill) => item.disabled === true);
    fixture.componentRef.setInput('suggestions', [{ label: 'Vue', id: 'vue' }, { label: 'Blocked', id: 'blocked', disabled: true }]);
    fixture.detectChanges();
    component.onFocus(new FocusEvent('focus'));
    expect(shown).toHaveBeenCalled(); expect(component.availableOptions()).toEqual([{ label: 'Vue', id: 'vue' }]);
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'Escape' })); expect(hidden).toHaveBeenCalled();
    component.writeValue([{ label: 'Vue', id: 'vue' }]);
    component.removeItem(new Event('click'), 4); expect(component.model()).toHaveLength(1);
    fixture.componentRef.setInput('readonly', true); fixture.detectChanges(); component.removeItem(new Event('click'), 0); expect(component.model()).toHaveLength(1);
  });

  it('covers inactive typeahead and identity policies without changing NeuTags-style defaults', () => {
    const hide = vi.spyOn(component.hide, 'emit');
    component.query.set('draft'); component.onInput({ target: { value: 'draft' } } as unknown as Event);
    expect(component.panelOpen()).toBe(false); expect(hide).not.toHaveBeenCalled();
    fixture.componentRef.setInput('delimiter', ','); fixture.componentRef.setInput('allowDuplicate', true); fixture.componentRef.setInput('max', null); fixture.detectChanges();
    component.query.set('one,two'); component.onKeyDown(new KeyboardEvent('keydown', { key: ',' }));
    component.query.set('one'); component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.model()).toEqual(['one', 'two', 'one']);
    expect(component.trackValue(3, 'one' as unknown as Skill)).toBe('one'); expect(component.trackOption(3, 'one' as unknown as Skill)).toBe('one');
    component.onPaste(new Event('paste') as ClipboardEvent); expect(component.model()).toHaveLength(3);
  });

  it('covers empty values, IDs, direct disabled options and touch registration', () => {
    let touched = 0; component.registerOnTouched(() => touched++); component.writeValue(null);
    fixture.componentRef.setInput('max', 0); fixture.componentRef.setInput('typeahead', true); fixture.componentRef.setInput('optionDisabled', 'disabled'); fixture.detectChanges();
    component.query.set('blocked'); component.selectOption(new Event('click'), { label: 'Blocked', id: 'blocked', disabled: true });
    component.onBlur(new FocusEvent('blur')); expect(component.model()).toEqual([]); expect(touched).toBe(1);
    expect(component.optionId(2)).toContain('-option-2'); expect(component.itemLabel({ label: 'Name', id: 'name' })).toBe('Name'); component.focusInput();
  });

  it('runs the rendered option, blur and paste listeners with active listbox state', () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('typeahead', true); fixture.componentRef.setInput('delay', 0); fixture.componentRef.setInput('addOnPaste', true); fixture.componentRef.setInput('addOnBlur', true);
    fixture.componentRef.setInput('suggestions', [{ label: 'Angular', id: 'ng' }]); fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'a'; input.dispatchEvent(new Event('input')); vi.runAllTimers(); fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })); fixture.detectChanges();
    const option = fixture.nativeElement.querySelector('.neu-input-tags__option') as HTMLButtonElement;
    option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); option.click(); fixture.detectChanges();
    Object.defineProperty(input, 'value', { value: 'blur tag', configurable: true }); input.dispatchEvent(new FocusEvent('blur'));
    input.dispatchEvent(Object.assign(new Event('paste', { bubbles: true }), { clipboardData: { getData: () => '' } }));
    expect(component.model()).toContain('ng'); vi.useRealTimers();
  });

  it('integrates with reactive forms', async () => {
    @Component({ imports: [NeuInputTagsComponent, ReactiveFormsModule], template: '<neu-input-tags [formControl]="control" />' })
    class Host { readonly control = new FormControl<unknown[]>(['Angular']); }
    await TestBed.resetTestingModule().configureTestingModule({ imports: [Host] }).compileComponents();
    const host = TestBed.createComponent(Host); host.detectChanges();
    const input = host.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Signals'; input.dispatchEvent(new Event('input')); input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(host.componentInstance.control.value).toEqual(['Angular', 'Signals']);
  });
});
