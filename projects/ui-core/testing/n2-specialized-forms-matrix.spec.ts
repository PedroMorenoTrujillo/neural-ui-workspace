import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { vi } from 'vitest';
import { NeuInlineEditorComponent } from '../inline-editor/neu-inline-editor.component';
import { NeuColorPickerComponent } from '../color-picker/neu-color-picker.component';
import { NeuRichTextEditorComponent } from '../rich-text-editor/neu-rich-text-editor.component';
import { NeuUploaderComponent } from '../uploader/neu-uploader.component';

const FIRST_FILE = new File(['first'], 'first.txt', { type: 'text/plain' });
const SECOND_FILE = new File(['second'], 'second.txt', { type: 'text/plain' });
interface Values {
  readonly inlineText: string;
  readonly inlineNumber: number | null;
  readonly color: string;
  readonly richText: string;
  readonly files: readonly File[];
}
const INITIAL: Values = {
  inlineText: 'Initial',
  inlineNumber: 1,
  color: '#336699',
  richText: '<p>Initial</p>',
  files: [FIRST_FILE],
};
const EDITED: Values = {
  inlineText: 'Edited',
  inlineNumber: 2,
  color: '#ff0000',
  richText: '<p>Edited</p>',
  files: [SECOND_FILE],
};

const imports = [
  NeuInlineEditorComponent,
  NeuColorPickerComponent,
  NeuRichTextEditorComponent,
  NeuUploaderComponent,
] as const;

function editAll(fixture: ComponentFixture<unknown>): void {
  const inline = fixture.debugElement.queryAll(By.directive(NeuInlineEditorComponent));
  const text = inline[0].componentInstance as NeuInlineEditorComponent<'text'>;
  const number = inline[1].componentInstance as NeuInlineEditorComponent<'number'>;
  text.value.set(EDITED.inlineText);
  number.value.set(EDITED.inlineNumber);
  fixture.debugElement.query(By.directive(NeuColorPickerComponent)).componentInstance.value.set(
    EDITED.color,
  );
  fixture.debugElement
    .query(By.directive(NeuRichTextEditorComponent))
    .componentInstance.value.set(EDITED.richText);
  fixture.debugElement.query(By.directive(NeuUploaderComponent)).componentInstance.value.set(
    EDITED.files,
  );
}

@Component({
  imports: [FormField, ...imports],
  template: `
    <neu-inline-editor [formField]="fields.inlineText" />
    <neu-inline-editor type="number" [formField]="fields.inlineNumber" />
    <neu-color-picker [formField]="fields.color" />
    <neu-rich-text-editor [formField]="fields.richText" />
    <neu-uploader [formField]="fields.files" />
  `,
})
class SignalHost {
  readonly data = signal<Values>({ ...INITIAL });
  readonly fields = form(this.data);
}

@Component({
  imports: [ReactiveFormsModule, ...imports],
  template: `
    <neu-inline-editor [formControl]="controls.inlineText" />
    <neu-inline-editor type="number" [formControl]="controls.inlineNumber" />
    <neu-color-picker [formControl]="controls.color" />
    <neu-rich-text-editor [formControl]="controls.richText" />
    <neu-uploader [formControl]="controls.files" />
  `,
})
class ReactiveDirectHost {
  readonly controls = {
    inlineText: new FormControl(INITIAL.inlineText, { nonNullable: true }),
    inlineNumber: new FormControl<number | null>(INITIAL.inlineNumber),
    color: new FormControl(INITIAL.color, { nonNullable: true }),
    richText: new FormControl(INITIAL.richText, { nonNullable: true }),
    files: new FormControl(INITIAL.files, { nonNullable: true }),
  };
}

@Component({
  imports: [ReactiveFormsModule, ...imports],
  template: `<form [formGroup]="group">
    <neu-inline-editor formControlName="inlineText" />
    <neu-inline-editor type="number" formControlName="inlineNumber" />
    <neu-color-picker formControlName="color" />
    <neu-rich-text-editor formControlName="richText" />
    <neu-uploader formControlName="files" />
  </form>`,
})
class ReactiveGroupHost {
  readonly group = new FormGroup({
    inlineText: new FormControl(INITIAL.inlineText, { nonNullable: true }),
    inlineNumber: new FormControl<number | null>(INITIAL.inlineNumber),
    color: new FormControl(INITIAL.color, { nonNullable: true }),
    richText: new FormControl(INITIAL.richText, { nonNullable: true }),
    files: new FormControl(INITIAL.files, { nonNullable: true }),
  });
}

@Component({
  imports: [FormsModule, ...imports],
  template: `
    <neu-inline-editor [(ngModel)]="inlineText" [ngModelOptions]="{standalone: true}" />
    <neu-inline-editor type="number" [(ngModel)]="inlineNumber" [ngModelOptions]="{standalone: true}" />
    <neu-color-picker [(ngModel)]="color" [ngModelOptions]="{standalone: true}" />
    <neu-rich-text-editor [(ngModel)]="richText" [ngModelOptions]="{standalone: true}" />
    <neu-uploader [(ngModel)]="files" [ngModelOptions]="{standalone: true}" />
  `,
})
class TemplateHost {
  readonly inlineText = signal(INITIAL.inlineText);
  readonly inlineNumber = signal<number | null>(INITIAL.inlineNumber);
  readonly color = signal(INITIAL.color);
  readonly richText = signal(INITIAL.richText);
  readonly files = signal<readonly File[]>(INITIAL.files);
}

describe('N2-009 specialized controls Forms matrix', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('binds InlineEditor text/number, ColorPicker, RTE and Uploader through Signal Forms', () => {
    const fixture = TestBed.createComponent(SignalHost);
    fixture.detectChanges();
    editAll(fixture);
    fixture.detectChanges();
    expect(fixture.componentInstance.data()).toEqual(EDITED);
    for (const key of Object.keys(EDITED) as (keyof Values)[]) {
      expect(fixture.componentInstance.fields[key]().dirty()).toBe(true);
    }
    fixture.componentInstance.fields.files().reset([]);
    expect(fixture.componentInstance.data().files).toEqual([]);
  });

  it('binds direct Reactive Forms exactly once and keeps parent writes silent', () => {
    const fixture = TestBed.createComponent(ReactiveDirectHost);
    fixture.detectChanges();
    const emitted = vi.fn();
    fixture.componentInstance.controls.color.valueChanges.subscribe(emitted);
    fixture.componentInstance.controls.color.setValue('#00ff00');
    fixture.detectChanges();
    expect(emitted).toHaveBeenCalledExactlyOnceWith('#00ff00');
    editAll(fixture);
    expect(
      Object.fromEntries(
        Object.entries(fixture.componentInstance.controls).map(([key, control]) => [
          key,
          control.value,
        ]),
      ),
    ).toEqual(EDITED);
  });

  it('binds formControlName and resets all canonical empty values', () => {
    const fixture = TestBed.createComponent(ReactiveGroupHost);
    fixture.detectChanges();
    editAll(fixture);
    expect(fixture.componentInstance.group.getRawValue()).toEqual(EDITED);
    fixture.componentInstance.group.reset({
      inlineText: '',
      inlineNumber: null,
      color: '#000000',
      richText: '',
      files: [],
    });
    expect(fixture.componentInstance.group.getRawValue()).toEqual({
      inlineText: '',
      inlineNumber: null,
      color: '#000000',
      richText: '',
      files: [],
    });
  });

  it('binds ngModel without echoing parent writes', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    editAll(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    expect({
      inlineText: fixture.componentInstance.inlineText(),
      inlineNumber: fixture.componentInstance.inlineNumber(),
      color: fixture.componentInstance.color(),
      richText: fixture.componentInstance.richText(),
      files: fixture.componentInstance.files(),
    }).toEqual(EDITED);
    const color = fixture.debugElement.query(By.directive(NeuColorPickerComponent))
      .componentInstance as NeuColorPickerComponent;
    const changes = vi.fn();
    color.value.subscribe(changes);
    fixture.componentInstance.color.set('#abcdef');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(changes).not.toHaveBeenCalled();
    expect(color.value()).toBe('#abcdef');
  });
});
