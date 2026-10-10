import {
  Component,
  provideZonelessChangeDetection,
  resource,
  signal,
  type Signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  form,
  maxLength,
  minLength,
  required,
  validate,
  validateAsync,
} from '@angular/forms/signals';
import { NeuInlineEditorComponent } from '../inline-editor/neu-inline-editor.component';
import { NeuColorPickerComponent } from '../color-picker/neu-color-picker.component';
import { NeuRichTextEditorComponent } from '../rich-text-editor/neu-rich-text-editor.component';
import { NeuUploaderComponent } from '../uploader/neu-uploader.component';

@Component({
  imports: [
    FormField,
    NeuInlineEditorComponent,
    NeuColorPickerComponent,
    NeuRichTextEditorComponent,
    NeuUploaderComponent,
  ],
  template: `
    <neu-inline-editor [formField]="fields.text" />
    <neu-inline-editor type="number" [formField]="fields.amount" />
    <neu-color-picker [formField]="fields.color" />
    <neu-rich-text-editor [formField]="fields.richText" />
    <neu-uploader [formField]="fields.files" />
  `,
})
class ValidationHost {
  readonly data = signal({
    text: '',
    amount: null as number | null,
    color: '',
    richText: '',
    files: [] as readonly File[],
  });
  readonly fields = form(this.data, (path) => {
    required(path.text);
    required(path.amount);
    required(path.color);
    required(path.richText);
    required(path.files);
    validate(path.files, ({ value }) =>
      value().length ? undefined : { kind: 'required', message: 'Select at least one file' },
    );
    minLength(path.richText, 3);
    maxLength(path.richText, 20);
    minLength(path.files, 1);
    maxLength(path.files, 2);
    validate(path.amount, ({ value }) => {
      const amount = value();
      return amount !== null && amount < 0
        ? { kind: 'non-negative', message: 'Use a non-negative number' }
        : undefined;
    });
    validate(path.color, ({ value }) =>
      value() && !/^#[\da-f]{6}$/i.test(value())
        ? { kind: 'css-color', message: 'Use a six-digit hex color' }
        : undefined,
    );
  });
}

type PendingRequest = { readonly aborted: () => boolean; resolve(result: boolean): void };

@Component({
  imports: [FormField, NeuColorPickerComponent],
  template: `<neu-color-picker [formField]="fields.color" />`,
})
class AsyncValidationHost {
  readonly data = signal({ color: '' });
  readonly requests = new Map<string, PendingRequest>();
  readonly fields = form(this.data, (path) => {
    validateAsync(path.color, {
      params: ({ value }) => value(),
      factory: (params: Signal<string | undefined>) =>
        resource({
          params,
          loader: ({ params: request, abortSignal }) =>
            new Promise<boolean>((resolve) => {
              if (request) {
                this.requests.set(request, {
                  aborted: () => abortSignal.aborted,
                  resolve,
                });
              }
            }),
        }),
      onSuccess: (available: boolean | undefined) =>
        available ? undefined : { kind: 'reserved-color', message: 'Reserved color' },
      onError: () => ({ kind: 'color-check-failed', message: 'Validation failed' }),
      when: ({ value }) => value().length > 0,
    });
  });
}

function kinds(field: { errors(): readonly { kind: string }[] }): string[] {
  return field.errors().map((error) => error.kind);
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('N2-009 specialized controls Signal Forms validation', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('propagates required, length/count and custom rules through official fields', () => {
    const fixture = TestBed.createComponent(ValidationHost);
    fixture.detectChanges();
    const fields = fixture.componentInstance.fields;
    expect(kinds(fields.text())).toContain('required');
    expect(kinds(fields.amount())).toContain('required');
    expect(kinds(fields.color())).toContain('required');
    expect(kinds(fields.richText())).toContain('required');
    expect(kinds(fields.files())).toContain('required');

    fields.amount().value.set(-1);
    fields.color().value.set('invalid');
    fields.richText().value.set('ab');
    fields.files().value.set([new File(['a'], 'a.txt'), new File(['b'], 'b.txt'), new File(['c'], 'c.txt')]);
    expect(kinds(fields.amount())).toContain('non-negative');
    expect(kinds(fields.color())).toContain('css-color');
    expect(kinds(fields.richText())).toContain('minLength');
    expect(kinds(fields.files())).toContain('maxLength');

    fields.amount().value.set(1);
    fields.color().value.set('#336699');
    fields.richText().value.set('valid');
    fields.files().value.set([new File(['a'], 'a.txt')]);
    expect(fields.amount().valid()).toBe(true);
    expect(fields.color().valid()).toBe(true);
    expect(fields.richText().valid()).toBe(true);
    expect(fields.files().valid()).toBe(true);
  });

  it('cancels stale async validation and exposes only the latest result', async () => {
    const fixture = TestBed.createComponent(AsyncValidationHost);
    fixture.detectChanges();
    const field = fixture.componentInstance.fields.color();
    field.value.set('#111111');
    fixture.detectChanges();
    await flush();
    const first = fixture.componentInstance.requests.get('#111111');
    field.value.set('#222222');
    fixture.detectChanges();
    await flush();
    const second = fixture.componentInstance.requests.get('#222222');
    expect(first?.aborted()).toBe(true);
    first?.resolve(false);
    await flush();
    expect(kinds(field)).not.toContain('reserved-color');
    second?.resolve(false);
    await flush();
    fixture.detectChanges();
    expect(kinds(field)).toContain('reserved-color');
  });
});
