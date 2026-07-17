import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { NeuTagItemDirective, NeuTagSuggestionDirective, NeuTagsComponent } from './neu-tags.component';

describe('NeuTagsComponent', () => {
  let fixture: ComponentFixture<NeuTagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuTagsComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuTagsComponent);
    fixture.detectChanges();
  });

  it('implements the CVA value, touched and disabled contracts', () => {
    const component = fixture.componentInstance;
    const changes: string[][] = [];
    let touched = 0;
    component.registerOnChange((value) => changes.push(value));
    component.registerOnTouched(() => touched++);
    component.writeValue(['Angular']);
    component.setDisabledState(true);
    fixture.componentRef.setInput('label', 'Skills');
    fixture.detectChanges();

    expect(component.value()).toEqual(['Angular']);
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('label')?.textContent).toContain('Skills');

    component.setDisabledState(false);
    component.draft.set('Signals');
    component.commitDraft();
    expect(changes).toEqual([['Angular', 'Signals']]);
    expect(touched).toBe(1);

    component.writeValue(null);
    expect(component.value()).toEqual([]);
  });

  it('adds unique tags, removes tags and emits the public value change', () => {
    const component = fixture.componentInstance;
    const emitted = vi.spyOn(component.valueChange, 'emit');
    component.add('Angular');
    component.add('Angular');
    component.add('Signals');
    expect(component.value()).toEqual(['Angular', 'Signals']);
    expect(component.draft()).toBe('');
    component.remove('Angular');
    expect(component.value()).toEqual(['Signals']);
    expect(emitted).toHaveBeenLastCalledWith(['Signals']);
  });

  it('filters suggestions and handles separators, blank drafts and Backspace', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('suggestions', ['Angular', 'Signals', 'RxJS']);
    component.writeValue(['Angular']);
    component.draft.set('sign');
    expect(component.filteredSuggestions()).toEqual([{ label: 'Signals', value: 'Signals' }]);

    const enter = new KeyboardEvent('keydown', { key: 'Enter' });
    const prevent = vi.spyOn(enter, 'preventDefault');
    component.onKeyDown(enter);
    expect(prevent).toHaveBeenCalled();
    expect(component.value()).toEqual(['Angular', 'sign']);

    component.draft.set('   ');
    component.commitDraft();
    expect(component.value()).toEqual(['Angular', 'sign']);
    component.draft.set('RxJS,');
    component.onKeyDown(new KeyboardEvent('keydown', { key: ',' }));
    expect(component.value()).toEqual(['Angular', 'sign', 'RxJS']);

    component.onKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(component.value()).toEqual(['Angular', 'sign']);
  });

  it('handles input, blur, suggestions and removal through the template', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('suggestions', ['Angular']);
    fixture.componentRef.setInput('removeLabel', 'Delete');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Ang';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.draft()).toBe('Ang');
    expect(fixture.nativeElement.querySelector('.neu-tags__suggestions button')?.textContent).toContain('Angular');

    (fixture.nativeElement.querySelector('.neu-tags__suggestions button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.value()).toEqual(['Angular']);
    expect(fixture.nativeElement.querySelector('[aria-label="Delete Angular"]')).toBeTruthy();

    input.value = 'Signals';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(component.value()).toEqual(['Angular', 'Signals']);
    (fixture.nativeElement.querySelector('[aria-label="Delete Angular"]') as HTMLButtonElement).click();
    expect(component.value()).toEqual(['Signals']);
  });

  it('normalizes rich suggestions while keeping the public value as strings', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('suggestions', [
      { label: 'Angular', value: 'angular', data: { color: 'red' } },
    ]);
    component.draft.set('ang');
    expect(component.filteredSuggestions()).toEqual([
      { label: 'Angular', value: 'angular', data: { color: 'red' } },
    ]);
    component.add(component.filteredSuggestions()[0]!.value);
    expect(component.value()).toEqual(['angular']);
  });

  it('renders projected tag and rich-suggestion templates', async () => {
    @Component({
      imports: [NeuTagsComponent, NeuTagItemDirective, NeuTagSuggestionDirective],
      template: `<neu-tags [suggestions]="suggestions"><ng-template neuTagItem let-tag>TAG:{{ tag }}</ng-template><ng-template neuTagSuggestion let-suggestion>SUG:{{ suggestion.data.flag }}</ng-template></neu-tags>`,
    })
    class Host { suggestions = [{ label: 'Spain', value: 'es', data: { flag: '🇪🇸' } }]; }
    await TestBed.resetTestingModule().configureTestingModule({ imports: [Host] }).compileComponents();
    const host = TestBed.createComponent(Host);
    const component = host.debugElement.children[0].componentInstance as NeuTagsComponent;
    component.writeValue(['existing']);
    component.draft.set('spa');
    host.detectChanges();
    expect(host.nativeElement.textContent).toContain('TAG:existing');
    expect(host.nativeElement.textContent).toContain('SUG:🇪🇸');
  });

  it('commits the draft through the input Enter binding', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Keyboard';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fixture.componentInstance.value()).toEqual(['Keyboard']);
  });

  it('resolves the CVA provider through Reactive Forms', async () => {
    @Component({
      imports: [NeuTagsComponent, ReactiveFormsModule],
      template: `<neu-tags [formControl]="control" />`,
    })
    class HostComponent {
      readonly control = new FormControl<string[]>(['Angular'], { nonNullable: true });
    }

    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [HostComponent] })
      .compileComponents();
    const host = TestBed.createComponent(HostComponent);
    host.detectChanges();

    const input = host.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Signals';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    host.detectChanges();

    expect(host.componentInstance.control.value).toEqual(['Angular', 'Signals']);
  });
});
