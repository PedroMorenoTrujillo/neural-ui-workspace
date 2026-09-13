import { Component, provideZonelessChangeDetection, signal, viewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { NeuAutocompleteComponent } from '../autocomplete/neu-autocomplete.component';
import { NeuCascadeSelectComponent } from '../cascade-select/neu-cascade-select.component';
import { NeuListboxComponent } from '../listbox/neu-listbox.component';
import { NeuSelectComponent } from '../select/neu-select.component';
import { NeuToggleButtonGroupComponent } from '../toggle-button-group/neu-toggle-button-group.component';

interface Choice {
  readonly id: number;
  readonly label: string;
  readonly children?: readonly Choice[];
}

interface SelectorValues {
  selectSingle: number | null;
  selectMultiple: readonly number[];
  autocompleteStrict: number | null;
  autocompleteFreeText: number | string | null;
  cascade: number | null;
  listboxSingle: number | null;
  listboxMultiple: readonly number[];
  toggleSingle: number | null;
  toggleMultiple: readonly number[];
}

const INITIAL: SelectorValues = {
  selectSingle: 1,
  selectMultiple: [1],
  autocompleteStrict: 1,
  autocompleteFreeText: 'initial draft',
  cascade: 1,
  listboxSingle: 1,
  listboxMultiple: [1],
  toggleSingle: 1,
  toggleMultiple: [1],
};

const EDITED: SelectorValues = {
  selectSingle: 2,
  selectMultiple: [1, 2],
  autocompleteStrict: 2,
  autocompleteFreeText: 'free draft',
  cascade: 2,
  listboxSingle: 2,
  listboxMultiple: [1, 2],
  toggleSingle: 2,
  toggleMultiple: [1, 2],
};

const SELECTOR_IMPORTS = [
  NeuSelectComponent,
  NeuAutocompleteComponent,
  NeuCascadeSelectComponent,
  NeuListboxComponent,
  NeuToggleButtonGroupComponent,
] as const;

abstract class SelectorHostBase {
  readonly options: readonly Choice[] = [
    { id: 1, label: 'One' },
    { id: 2, label: 'Two' },
  ];
  readonly valueOf = (option: Choice) => option.id;
}

function editAll(host: any): void {
  host.selects()[0].value.set(EDITED.selectSingle);
  host.selects()[1].value.set(EDITED.selectMultiple as never);
  host.autocompletes()[0].value.set(EDITED.autocompleteStrict);
  host.autocompletes()[1].value.set(EDITED.autocompleteFreeText);
  host.cascades()[0].value.set(EDITED.cascade);
  host.listboxes()[0].value.set(EDITED.listboxSingle);
  host.listboxes()[1].value.set(EDITED.listboxMultiple as never);
  host.toggles()[0].value.set(EDITED.toggleSingle);
  host.toggles()[1].value.set(EDITED.toggleMultiple as never);
}

@Component({
  imports: [FormField, ...SELECTOR_IMPORTS],
  template: `
    <neu-select [options]="options" [optionValue]="valueOf" [formField]="fields.selectSingle" />
    <neu-select mode="multiple" [options]="options" [optionValue]="valueOf" [formField]="fields.selectMultiple" />
    <neu-autocomplete mode="strict" [options]="options" [optionValue]="valueOf" [formField]="fields.autocompleteStrict" />
    <neu-autocomplete mode="free-text" [options]="options" [optionValue]="valueOf" [formField]="fields.autocompleteFreeText" />
    <neu-cascade-select [options]="options" [optionValue]="valueOf" [formField]="fields.cascade" />
    <neu-listbox [options]="options" [optionValue]="valueOf" [formField]="fields.listboxSingle" />
    <neu-listbox mode="multiple" [options]="options" [optionValue]="valueOf" [formField]="fields.listboxMultiple" />
    <neu-toggle-button-group [options]="options" [optionValue]="valueOf" [formField]="fields.toggleSingle" />
    <neu-toggle-button-group mode="multiple" [options]="options" [optionValue]="valueOf" [formField]="fields.toggleMultiple" />
  `,
})
class SignalHost extends SelectorHostBase {
  readonly data = signal<SelectorValues>({ ...INITIAL });
  readonly fields = form(this.data);
  readonly selects = viewChildren(NeuSelectComponent);
  readonly autocompletes = viewChildren(NeuAutocompleteComponent);
  readonly cascades = viewChildren(NeuCascadeSelectComponent);
  readonly listboxes = viewChildren(NeuListboxComponent);
  readonly toggles = viewChildren(NeuToggleButtonGroupComponent);
}

function controls() {
  return {
    selectSingle: new FormControl<number | null>(INITIAL.selectSingle),
    selectMultiple: new FormControl<readonly number[]>(INITIAL.selectMultiple, { nonNullable: true }),
    autocompleteStrict: new FormControl<number | null>(INITIAL.autocompleteStrict),
    autocompleteFreeText: new FormControl<number | string | null>(INITIAL.autocompleteFreeText),
    cascade: new FormControl<number | null>(INITIAL.cascade),
    listboxSingle: new FormControl<number | null>(INITIAL.listboxSingle),
    listboxMultiple: new FormControl<readonly number[]>(INITIAL.listboxMultiple, { nonNullable: true }),
    toggleSingle: new FormControl<number | null>(INITIAL.toggleSingle),
    toggleMultiple: new FormControl<readonly number[]>(INITIAL.toggleMultiple, { nonNullable: true }),
  };
}

@Component({
  imports: [ReactiveFormsModule, ...SELECTOR_IMPORTS],
  template: `
    <neu-select [options]="options" [optionValue]="valueOf" [formControl]="controls.selectSingle" />
    <neu-select mode="multiple" [options]="options" [optionValue]="valueOf" [formControl]="controls.selectMultiple" />
    <neu-autocomplete mode="strict" [options]="options" [optionValue]="valueOf" [formControl]="controls.autocompleteStrict" />
    <neu-autocomplete mode="free-text" [options]="options" [optionValue]="valueOf" [formControl]="controls.autocompleteFreeText" />
    <neu-cascade-select [options]="options" [optionValue]="valueOf" [formControl]="controls.cascade" />
    <neu-listbox [options]="options" [optionValue]="valueOf" [formControl]="controls.listboxSingle" />
    <neu-listbox mode="multiple" [options]="options" [optionValue]="valueOf" [formControl]="controls.listboxMultiple" />
    <neu-toggle-button-group [options]="options" [optionValue]="$any(valueOf)" [formControl]="controls.toggleSingle" />
    <neu-toggle-button-group mode="multiple" [options]="options" [optionValue]="$any(valueOf)" [formControl]="controls.toggleMultiple" />
  `,
})
class ReactiveDirectHost extends SelectorHostBase {
  readonly controls = controls();
  readonly selects = viewChildren(NeuSelectComponent);
  readonly autocompletes = viewChildren(NeuAutocompleteComponent);
  readonly cascades = viewChildren(NeuCascadeSelectComponent);
  readonly listboxes = viewChildren(NeuListboxComponent);
  readonly toggles = viewChildren(NeuToggleButtonGroupComponent);
}

@Component({
  imports: [ReactiveFormsModule, ...SELECTOR_IMPORTS],
  template: `<form [formGroup]="group">
    <neu-select [options]="options" [optionValue]="valueOf" formControlName="selectSingle" />
    <neu-select mode="multiple" [options]="options" [optionValue]="valueOf" formControlName="selectMultiple" />
    <neu-autocomplete mode="strict" [options]="options" [optionValue]="valueOf" formControlName="autocompleteStrict" />
    <neu-autocomplete mode="free-text" [options]="options" [optionValue]="valueOf" formControlName="autocompleteFreeText" />
    <neu-cascade-select [options]="options" [optionValue]="valueOf" formControlName="cascade" />
    <neu-listbox [options]="options" [optionValue]="valueOf" formControlName="listboxSingle" />
    <neu-listbox mode="multiple" [options]="options" [optionValue]="valueOf" formControlName="listboxMultiple" />
    <neu-toggle-button-group [options]="options" [optionValue]="$any(valueOf)" formControlName="toggleSingle" />
    <neu-toggle-button-group mode="multiple" [options]="options" [optionValue]="$any(valueOf)" formControlName="toggleMultiple" />
  </form>`,
})
class ReactiveGroupHost extends SelectorHostBase {
  readonly group = new FormGroup(controls());
  readonly selects = viewChildren(NeuSelectComponent);
  readonly autocompletes = viewChildren(NeuAutocompleteComponent);
  readonly cascades = viewChildren(NeuCascadeSelectComponent);
  readonly listboxes = viewChildren(NeuListboxComponent);
  readonly toggles = viewChildren(NeuToggleButtonGroupComponent);
}

@Component({
  imports: [FormsModule, ...SELECTOR_IMPORTS],
  template: `
    <neu-select [options]="options" [optionValue]="valueOf" name="selectSingle" [(ngModel)]="selectSingle" />
    <neu-select mode="multiple" [options]="options" [optionValue]="valueOf" name="selectMultiple" [(ngModel)]="selectMultiple" />
    <neu-autocomplete mode="strict" [options]="options" [optionValue]="valueOf" name="autocompleteStrict" [(ngModel)]="autocompleteStrict" />
    <neu-autocomplete mode="free-text" [options]="options" [optionValue]="valueOf" name="autocompleteFreeText" [(ngModel)]="autocompleteFreeText" />
    <neu-cascade-select [options]="options" [optionValue]="valueOf" name="cascade" [(ngModel)]="cascade" />
    <neu-listbox [options]="options" [optionValue]="valueOf" name="listboxSingle" [(ngModel)]="listboxSingle" />
    <neu-listbox mode="multiple" [options]="options" [optionValue]="valueOf" name="listboxMultiple" [(ngModel)]="listboxMultiple" />
    <neu-toggle-button-group [options]="options" [optionValue]="$any(valueOf)" name="toggleSingle" [(ngModel)]="toggleSingle" />
    <neu-toggle-button-group mode="multiple" [options]="options" [optionValue]="$any(valueOf)" name="toggleMultiple" [(ngModel)]="toggleMultiple" />
  `,
})
class TemplateHost extends SelectorHostBase {
  readonly selectSingle = signal<number | null>(INITIAL.selectSingle);
  readonly selectMultiple = signal<readonly number[]>(INITIAL.selectMultiple);
  readonly autocompleteStrict = signal<number | null>(INITIAL.autocompleteStrict);
  readonly autocompleteFreeText = signal<number | string | null>(INITIAL.autocompleteFreeText);
  readonly cascade = signal<number | null>(INITIAL.cascade);
  readonly listboxSingle = signal<number | null>(INITIAL.listboxSingle);
  readonly listboxMultiple = signal<readonly number[]>(INITIAL.listboxMultiple);
  readonly toggleSingle = signal<number | null>(INITIAL.toggleSingle);
  readonly toggleMultiple = signal<readonly number[]>(INITIAL.toggleMultiple);
  readonly selects = viewChildren(NeuSelectComponent);
  readonly autocompletes = viewChildren(NeuAutocompleteComponent);
  readonly cascades = viewChildren(NeuCascadeSelectComponent);
  readonly listboxes = viewChildren(NeuListboxComponent);
  readonly toggles = viewChildren(NeuToggleButtonGroupComponent);
}

describe('N2-007 selector family Forms matrix: nine modes x four paths', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('Signal Forms binds all nine values, marks user model edits dirty and accepts reset', () => {
    const fixture = TestBed.createComponent(SignalHost);
    fixture.detectChanges();
    editAll(fixture.componentInstance);
    fixture.detectChanges();
    expect(fixture.componentInstance.data()).toEqual(EDITED);
    for (const key of Object.keys(EDITED) as (keyof SelectorValues)[]) {
      expect(fixture.componentInstance.fields[key]().dirty()).toBe(true);
    }
    fixture.componentInstance.fields.selectSingle().reset(INITIAL.selectSingle);
    expect(fixture.componentInstance.data().selectSingle).toBe(1);
  });

  it('Reactive [formControl] binds every mode and parent writes emit once', () => {
    const fixture = TestBed.createComponent(ReactiveDirectHost);
    fixture.detectChanges();
    const emitted = vi.fn();
    fixture.componentInstance.controls.selectSingle.valueChanges.subscribe(emitted);
    fixture.componentInstance.controls.selectSingle.setValue(2);
    fixture.detectChanges();
    expect(emitted).toHaveBeenCalledExactlyOnceWith(2);
    editAll(fixture.componentInstance);
    expect(Object.fromEntries(Object.entries(fixture.componentInstance.controls).map(([key, control]) => [key, control.value]))).toEqual(EDITED);
  });

  it('Reactive formControlName binds every mode and group reset restores official empties', () => {
    const fixture = TestBed.createComponent(ReactiveGroupHost);
    fixture.detectChanges();
    editAll(fixture.componentInstance);
    expect(fixture.componentInstance.group.getRawValue()).toEqual(EDITED);
    fixture.componentInstance.group.reset(INITIAL);
    expect(fixture.componentInstance.group.getRawValue()).toEqual(INITIAL);
  });

  it('Template [(ngModel)] binds every mode and accepts parent writes without echo', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    editAll(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
    const values = Object.fromEntries((Object.keys(EDITED) as (keyof SelectorValues)[]).map((key) => [key, fixture.componentInstance[key]() ]));
    expect(values).toEqual(EDITED);
    const changes = vi.fn();
    fixture.componentInstance.selects()[0].value.subscribe(changes);
    fixture.componentInstance.selectSingle.set(1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.selects()[0].value()).toBe(1);
    expect(changes).not.toHaveBeenCalled();
  });
});
