import { Component, provideZonelessChangeDetection, signal, viewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { vi } from 'vitest';
import { NeuInputTagsComponent } from '../input-tags/neu-input-tags.component';

interface Option { readonly id: number; readonly label: string }
interface Values {
  simple: readonly string[]; mapped: readonly number[]; suggestions: readonly string[];
  separators: readonly string[]; duplicates: readonly string[]; blur: readonly string[];
}
const INITIAL: Values = { simple: ['one'], mapped: [1], suggestions: ['alpha'], separators: ['a'], duplicates: ['x'], blur: ['draft'] };
const EDITED: Values = { simple: ['two'], mapped: [2], suggestions: ['beta'], separators: ['b', 'c'], duplicates: ['y'], blur: ['committed'] };

abstract class BaseHost {
  readonly options: readonly Option[] = [{ id: 1, label: 'One' }, { id: 2, label: 'Two' }];
  readonly suggestionOptions = ['alpha', 'beta'];
}
function editAll(host: { tags(): readonly NeuInputTagsComponent[] }): void {
  const tags = host.tags();
  (Object.keys(EDITED) as (keyof Values)[]).forEach((key, index) => tags[index].value.set(EDITED[key] as never));
}

@Component({
  imports: [FormField, NeuInputTagsComponent],
  template: `
    <neu-input-tags data-case="A" [formField]="fields.simple" />
    <neu-input-tags data-case="B" [options]="options" optionLabel="label" optionValue="id" [formField]="fields.mapped" />
    <neu-input-tags data-case="C" [typeahead]="true" [options]="suggestionOptions" [formField]="fields.suggestions" />
    <neu-input-tags data-case="D" [separators]="[',', ';']" [formField]="fields.separators" />
    <neu-input-tags data-case="E" [allowDuplicates]="false" [formField]="fields.duplicates" />
    <neu-input-tags data-case="F" [commitOnBlur]="true" [formField]="fields.blur" />
  `,
})
class SignalHost extends BaseHost {
  readonly data = signal<Values>({ ...INITIAL });
  readonly fields = form(this.data);
  readonly tags = viewChildren(NeuInputTagsComponent);
}

@Component({
  imports: [ReactiveFormsModule, NeuInputTagsComponent],
  template: `
    <neu-input-tags data-case="A" [formControl]="controls.simple" />
    <neu-input-tags data-case="B" [options]="options" optionLabel="label" optionValue="id" [formControl]="controls.mapped" />
    <neu-input-tags data-case="C" [typeahead]="true" [options]="suggestionOptions" [formControl]="controls.suggestions" />
    <neu-input-tags data-case="D" [separators]="[',', ';']" [formControl]="controls.separators" />
    <neu-input-tags data-case="E" [allowDuplicates]="false" [formControl]="controls.duplicates" />
    <neu-input-tags data-case="F" [commitOnBlur]="true" [formControl]="controls.blur" />
  `,
})
class ReactiveDirectHost extends BaseHost {
  readonly controls = {
    simple: new FormControl(INITIAL.simple, { nonNullable: true }), mapped: new FormControl(INITIAL.mapped, { nonNullable: true }),
    suggestions: new FormControl(INITIAL.suggestions, { nonNullable: true }), separators: new FormControl(INITIAL.separators, { nonNullable: true }),
    duplicates: new FormControl(INITIAL.duplicates, { nonNullable: true }), blur: new FormControl(INITIAL.blur, { nonNullable: true }),
  };
  readonly tags = viewChildren(NeuInputTagsComponent);
}

@Component({
  imports: [ReactiveFormsModule, NeuInputTagsComponent],
  template: `<form [formGroup]="group">
    <neu-input-tags data-case="A" formControlName="simple" />
    <neu-input-tags data-case="B" [options]="options" optionLabel="label" optionValue="id" formControlName="mapped" />
    <neu-input-tags data-case="C" [typeahead]="true" [options]="suggestionOptions" formControlName="suggestions" />
    <neu-input-tags data-case="D" [separators]="[',', ';']" formControlName="separators" />
    <neu-input-tags data-case="E" [allowDuplicates]="false" formControlName="duplicates" />
    <neu-input-tags data-case="F" [commitOnBlur]="true" formControlName="blur" />
  </form>`,
})
class ReactiveGroupHost extends BaseHost {
  readonly group = new FormGroup({
    simple: new FormControl(INITIAL.simple, { nonNullable: true }), mapped: new FormControl(INITIAL.mapped, { nonNullable: true }),
    suggestions: new FormControl(INITIAL.suggestions, { nonNullable: true }), separators: new FormControl(INITIAL.separators, { nonNullable: true }),
    duplicates: new FormControl(INITIAL.duplicates, { nonNullable: true }), blur: new FormControl(INITIAL.blur, { nonNullable: true }),
  });
  readonly tags = viewChildren(NeuInputTagsComponent);
}

@Component({
  imports: [FormsModule, NeuInputTagsComponent],
  template: `
    <neu-input-tags data-case="A" [(ngModel)]="simple" [ngModelOptions]="{standalone: true}" />
    <neu-input-tags data-case="B" [options]="options" optionLabel="label" optionValue="id" [(ngModel)]="mapped" [ngModelOptions]="{standalone: true}" />
    <neu-input-tags data-case="C" [typeahead]="true" [options]="suggestionOptions" [(ngModel)]="suggestions" [ngModelOptions]="{standalone: true}" />
    <neu-input-tags data-case="D" [separators]="[',', ';']" [(ngModel)]="separators" [ngModelOptions]="{standalone: true}" />
    <neu-input-tags data-case="E" [allowDuplicates]="false" [(ngModel)]="duplicates" [ngModelOptions]="{standalone: true}" />
    <neu-input-tags data-case="F" [commitOnBlur]="true" [(ngModel)]="blur" [ngModelOptions]="{standalone: true}" />
  `,
})
class TemplateHost extends BaseHost {
  readonly simple = signal(INITIAL.simple); readonly mapped = signal(INITIAL.mapped); readonly suggestions = signal(INITIAL.suggestions);
  readonly separators = signal(INITIAL.separators); readonly duplicates = signal(INITIAL.duplicates); readonly blur = signal(INITIAL.blur);
  readonly tags = viewChildren(NeuInputTagsComponent);
}

describe('N2-008 InputTags Forms matrix: cases A-F x four paths', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  it('binds all cases through Signal Forms and marks user edits dirty', () => {
    const fixture = TestBed.createComponent(SignalHost); fixture.detectChanges(); editAll(fixture.componentInstance); fixture.detectChanges();
    expect(fixture.componentInstance.data()).toEqual(EDITED);
    for (const key of Object.keys(EDITED) as (keyof Values)[]) expect(fixture.componentInstance.fields[key]().dirty()).toBe(true);
    fixture.componentInstance.fields.simple().reset(INITIAL.simple);
    expect(fixture.componentInstance.data().simple).toEqual(['one']);
  });

  it('binds all cases through direct Reactive Forms exactly once', () => {
    const fixture = TestBed.createComponent(ReactiveDirectHost); fixture.detectChanges();
    const emitted = vi.fn(); fixture.componentInstance.controls.simple.valueChanges.subscribe(emitted);
    fixture.componentInstance.controls.simple.setValue(['parent']); fixture.detectChanges();
    expect(emitted).toHaveBeenCalledExactlyOnceWith(['parent']); editAll(fixture.componentInstance);
    expect(Object.fromEntries(Object.entries(fixture.componentInstance.controls).map(([key, control]) => [key, control.value]))).toEqual(EDITED);
  });

  it('binds all cases through formControlName and resets from the group', () => {
    const fixture = TestBed.createComponent(ReactiveGroupHost); fixture.detectChanges(); editAll(fixture.componentInstance);
    expect(fixture.componentInstance.group.getRawValue()).toEqual(EDITED);
    fixture.componentInstance.group.reset(INITIAL); expect(fixture.componentInstance.group.getRawValue()).toEqual(INITIAL);
  });

  it('binds all cases through ngModel without echoing parent writes', async () => {
    const fixture = TestBed.createComponent(TemplateHost); fixture.detectChanges(); await fixture.whenStable();
    editAll(fixture.componentInstance); fixture.detectChanges(); await fixture.whenStable();
    expect(Object.fromEntries((Object.keys(EDITED) as (keyof Values)[]).map((key) => [key, fixture.componentInstance[key]()]))).toEqual(EDITED);
    const changes = vi.fn(); fixture.componentInstance.tags()[0].value.subscribe(changes);
    fixture.componentInstance.simple.set(['parent']); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(changes).not.toHaveBeenCalled(); expect(fixture.componentInstance.tags()[0].value()).toEqual(['parent']);
  });
});
