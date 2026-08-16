import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import {
  NeuListboxComponent,
  NeuListboxEmptyDirective,
  NeuListboxFooterDirective,
  NeuListboxHeaderDirective,
  NeuListboxItemDirective,
  NeuListboxOption,
} from './neu-listbox.component';

describe('NeuListboxComponent', () => {
  let fixture: ComponentFixture<NeuListboxComponent>;
  const options: NeuListboxOption[] = [
    { label: 'Alpha', value: 'a' },
    { label: 'Beta', value: 'b' },
    { label: 'Disabled', value: 'd', disabled: true },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuListboxComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuListboxComponent);
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();
  });

  it('renders options and exposes an accessible labelled listbox', () => {
    fixture.componentRef.setInput('label', 'Available choices');
    fixture.componentRef.setInput('hint', 'Choose one');
    fixture.detectChanges();
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    expect(fixture.nativeElement.textContent).toContain('Alpha');
    expect(listbox.getAttribute('aria-labelledby')).toContain('neu-listbox-label');
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
    expect(component.isSelected('a')).toBe(true);

    component.toggleOption(options[1]);
    expect(component.values()).toEqual(['b']);
    expect(changes).toEqual(['b']);
    expect(touched).toBe(1);

    component.setDisabledState(true);
    component.toggleOption(options[0]);
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
    component.toggleOption(options[0]);
    component.toggleOption(options[1]);
    component.toggleOption(options[0]);
    component.toggleOption(options[2]);
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
    component.onKeyDown(down);
    expect(prevent).toHaveBeenCalled();
    expect(component.activeIndex()).toBe(0);

    const select = new KeyboardEvent('keydown', { key: 'Enter' });
    component.onKeyDown(select);
    expect(component.values()).toEqual(['b']);
    component.query.set('missing');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-listbox__empty')).toBeTruthy();
    component.onKeyDown(new KeyboardEvent('keydown', { key: ' ' }));
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

  it('uses an APG active descendant, skips disabled options and exposes multiselect semantics', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    const optionButtons = Array.from(
      fixture.nativeElement.querySelectorAll('[role="option"]'),
    ) as HTMLButtonElement[];
    expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
    expect(listbox.getAttribute('aria-activedescendant')).toBe(optionButtons[0].id);
    expect(optionButtons.map((button) => button.tabIndex)).toEqual([-1, -1, -1]);

    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(component.activeIndex()).toBe(1);
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(component.activeIndex()).toBe(1);
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(component.activeIndex()).toBe(0);
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(component.activeIndex()).toBe(1);
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(component.values()).toEqual(['b']);
  });

  it('accepts array CVA values and marks buttons disabled when either source disables it', () => {
    const component = fixture.componentInstance;
    component.writeValue(['a', 'b']);
    expect(component.values()).toEqual(['a', 'b']);
    component.setDisabledState(true);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      '.neu-listbox__option',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[2].disabled).toBe(true);
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

  it('renders projected header, footer and empty templates', async () => {
    @Component({
      imports: [
        NeuListboxComponent,
        NeuListboxEmptyDirective,
        NeuListboxFooterDirective,
        NeuListboxHeaderDirective,
      ],
      template: `
        <neu-listbox [options]="options">
          <ng-template neuListboxHeader>Custom header</ng-template>
          <ng-template neuListboxFooter>Custom footer</ng-template>
          <ng-template neuListboxEmpty>Custom empty</ng-template>
        </neu-listbox>
      `,
    })
    class ChromeTemplateHostComponent {
      readonly options: NeuListboxOption[] = [];
    }

    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [ChromeTemplateHostComponent] })
      .compileComponents();
    const host = TestBed.createComponent(ChromeTemplateHostComponent);
    host.detectChanges();
    expect(host.nativeElement.textContent).toContain('Custom header');
    expect(host.nativeElement.textContent).toContain('Custom footer');
    expect(host.nativeElement.textContent).toContain('Custom empty');
  });

  it('normalizes a stale active index to the first enabled option', () => {
    const component = fixture.componentInstance;
    component.activeIndex.set(99);
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    const prevent = vi.spyOn(event, 'preventDefault');

    component.onKeyDown(event);

    expect(prevent).toHaveBeenCalled();
    expect(component.values()).toEqual(['a']);
  });

  it('removes a disabled listbox from the tab order and ignores keyboard input', () => {
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    const prevent = vi.spyOn(event, 'preventDefault');

    fixture.componentInstance.onKeyDown(event);

    expect(listbox.tabIndex).toBe(-1);
    expect(listbox.getAttribute('aria-disabled')).toBe('true');
    expect(prevent).not.toHaveBeenCalled();
  });

  it('single selection before CVA registration uses default callbacks safely', () => {
    expect(() => fixture.componentInstance.toggleOption(options[0])).not.toThrow();
    expect(fixture.componentInstance.values()).toEqual(['a']);
  });

  it('emits null when a malformed single-select option has no value', () => {
    const changes: unknown[] = [];
    fixture.componentInstance.registerOnChange((value) => changes.push(value));

    fixture.componentInstance.toggleOption({ label: 'Broken' } as NeuListboxOption);

    expect(changes).toEqual([null]);
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
});
