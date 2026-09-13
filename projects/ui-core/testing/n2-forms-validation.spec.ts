import { Component, provideZonelessChangeDetection, resource, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  form,
  maxLength,
  minLength,
  pattern,
  required,
  validate,
  validateAsync,
} from '@angular/forms/signals';
import { NeuCheckboxComponent } from '../checkbox/neu-checkbox.component';
import { NeuInputComponent } from '../input/neu-input.component';

interface ValidationModel {
  text: string;
  flag: boolean;
}

@Component({
  imports: [FormField, NeuInputComponent, NeuCheckboxComponent],
  template: `
    <neu-input label="Code" errorMessage="Invalid code" [formField]="fields.text" />
    <neu-checkbox label="Accept" [formField]="fields.flag" />
  `,
})
class SyncValidationHost {
  readonly data = signal<ValidationModel>({ text: '', flag: false });
  readonly fields = form(this.data, (path) => {
    required(path.text);
    minLength(path.text, 3);
    maxLength(path.text, 5);
    pattern(path.text, /^[A-Z]+$/);
    validate(path.text, ({ value }) =>
      value() === 'BAD' ? { kind: 'reserved-code', message: 'Reserved code' } : undefined,
    );
    required(path.flag);
    validate(path.flag, ({ value }) =>
      value() ? { kind: 'custom-boolean', message: 'Custom boolean rule' } : undefined,
    );
  });
}

type PendingRequest = {
  readonly aborted: () => boolean;
  resolve(result: boolean): void;
};

@Component({
  imports: [FormField, NeuInputComponent],
  template: `<neu-input label="Async" errorMessage="Unavailable" [formField]="fields.text" />`,
})
class AsyncValidationHost {
  readonly data = signal({ text: '' });
  readonly requests = new Map<string, PendingRequest>();
  readonly fields = form(this.data, (path) => {
    validateAsync(path.text, {
      params: ({ value }) => value(),
      factory: (params) =>
        resource({
          params,
          loader: ({ params: request, abortSignal }) =>
            new Promise<boolean>((resolve) => {
              this.requests.set(request, {
                aborted: () => abortSignal.aborted,
                resolve,
              });
            }),
        }),
      onSuccess: (available) =>
        available ? undefined : { kind: 'unavailable', message: 'Value unavailable' },
      onError: () => ({ kind: 'async-error', message: 'Validation failed' }),
      when: ({ value }) => value().length > 0,
    });
  });
}

function kinds(field: { errors(): readonly { kind: string }[] }): string[] {
  return field.errors().map((error) => error.kind);
}

async function flushValidation(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('N2 Signal Forms validation infrastructure', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('binds required, minLength, maxLength, pattern and custom sync validation to NeuInput', () => {
    const fixture = TestBed.createComponent(SyncValidationHost);
    fixture.detectChanges();
    const text = fixture.componentInstance.fields.text();
    const native = fixture.nativeElement.querySelector(
      'input:not([type="checkbox"])',
    ) as HTMLInputElement;

    expect(kinds(text)).toContain('required');
    expect(native.required).toBe(true);
    expect(native.minLength).toBe(3);
    expect(native.maxLength).toBe(5);
    expect(native.pattern).toBe('^[A-Z]+$');

    text.value.set('AB');
    expect(kinds(text)).toContain('minLength');
    text.value.set('ABCDEF');
    expect(kinds(text)).toContain('maxLength');
    text.value.set('abc');
    expect(kinds(text)).toContain('pattern');
    text.value.set('BAD');
    expect(kinds(text)).toContain('reserved-code');
    text.value.set('GOOD');
    expect(text.valid()).toBe(true);
  });

  it('binds requiredTrue semantics and custom validation to NeuCheckbox', () => {
    const fixture = TestBed.createComponent(SyncValidationHost);
    fixture.detectChanges();
    const flag = fixture.componentInstance.fields.flag();
    const native = fixture.nativeElement.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    expect(kinds(flag)).toContain('required');
    expect(native.required).toBe(true);
    expect(native.getAttribute('aria-required')).toBe('true');
    expect(native.getAttribute('aria-invalid')).toBe('true');

    flag.value.set(true);
    expect(kinds(flag)).toContain('custom-boolean');
    expect(kinds(flag)).not.toContain('required');
  });

  it('reports async pending, cancellation, success and failure without stale results', async () => {
    const fixture = TestBed.createComponent(AsyncValidationHost);
    fixture.detectChanges();
    const text = fixture.componentInstance.fields.text();

    text.value.set('first');
    fixture.detectChanges();
    await flushValidation();
    const first = fixture.componentInstance.requests.get('first');
    expect(first).toBeDefined();
    expect(text.pending()).toBe(true);

    text.value.set('second');
    fixture.detectChanges();
    await flushValidation();
    const second = fixture.componentInstance.requests.get('second');
    expect(second).toBeDefined();
    expect(first?.aborted()).toBe(true);
    first?.resolve(false);
    await flushValidation();
    expect(text.pending()).toBe(true);
    expect(kinds(text)).not.toContain('unavailable');

    second?.resolve(true);
    await flushValidation();
    fixture.detectChanges();
    expect(text.pending()).toBe(false);
    expect(text.valid()).toBe(true);

    text.value.set('taken');
    fixture.detectChanges();
    await flushValidation();
    fixture.componentInstance.requests.get('taken')?.resolve(false);
    await flushValidation();
    fixture.detectChanges();
    expect(text.pending()).toBe(false);
    expect(kinds(text)).toContain('unavailable');
    expect(text.invalid()).toBe(true);
  });
});
