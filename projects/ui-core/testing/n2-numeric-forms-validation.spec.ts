import { Component, provideZonelessChangeDetection, resource, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  form,
  max,
  min,
  required,
  validate,
  validateAsync,
} from '@angular/forms/signals';
import { NeuKnobComponent } from '../knob/neu-knob.component';
import { NeuNumberInputComponent } from '../number-input/neu-number-input.component';

@Component({
  imports: [FormField, NeuNumberInputComponent, NeuKnobComponent],
  template: `
    <neu-number-input data-control="amount" [formField]="fields.amount" />
    <neu-knob data-control="volume" [formField]="fields.volume" />
  `,
})
class NumericValidationHost {
  readonly data = signal({ amount: null as number | null, volume: 50 });
  readonly fields = form(this.data, (path) => {
    required(path.amount);
    min(path.amount, 10);
    max(path.amount, 20);
    validate(path.amount, ({ value }) =>
      value() === 13 ? { kind: 'unlucky', message: 'Not thirteen' } : undefined,
    );
    min(path.volume, 0);
    max(path.volume, 100);
    validate(path.volume, ({ value }) =>
      value() % 5 === 0 ? undefined : { kind: 'step-domain', message: 'Must align' },
    );
  });
}

type PendingRequest = { readonly aborted: () => boolean; resolve(result: boolean): void };

@Component({
  imports: [FormField, NeuNumberInputComponent],
  template: `<neu-number-input [formField]="fields.amount" />`,
})
class AsyncNumberHost {
  readonly data = signal({ amount: null as number | null });
  readonly requests = new Map<number, PendingRequest>();
  readonly fields = form(this.data, (path) => {
    validateAsync(path.amount, {
      params: ({ value }) => value(),
      factory: (params) =>
        resource({
          params,
          loader: ({ params: request, abortSignal }) =>
            new Promise<boolean>((resolve) => {
              if (typeof request === 'number')
                this.requests.set(request, { aborted: () => abortSignal.aborted, resolve });
            }),
        }),
      onSuccess: (available) =>
        available ? undefined : { kind: 'unavailable-number', message: 'Unavailable' },
      onError: () => ({ kind: 'async-number-error', message: 'Validation failed' }),
      when: ({ value }) => value() !== null,
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

describe('N2-005 numeric Signal Forms validation', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('binds required, min, max and custom validation to NumberInput', () => {
    const fixture = TestBed.createComponent(NumericValidationHost);
    fixture.detectChanges();
    const field = fixture.componentInstance.fields.amount();
    const input = fixture.nativeElement.querySelector(
      '[data-control="amount"] input',
    ) as HTMLInputElement;
    expect(kinds(field)).toContain('required');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-valuemin')).toBe('10');
    expect(input.getAttribute('aria-valuemax')).toBe('20');
    field.value.set(5);
    expect(kinds(field)).toContain('min');
    field.value.set(25);
    expect(kinds(field)).toContain('max');
    field.value.set(13);
    expect(kinds(field)).toContain('unlucky');
    field.value.set(15);
    expect(field.valid()).toBe(true);
  });

  it('binds numeric constraints and a custom schema rule to Knob', () => {
    const fixture = TestBed.createComponent(NumericValidationHost);
    fixture.detectChanges();
    const field = fixture.componentInstance.fields.volume();
    const knob = fixture.nativeElement.querySelector(
      '[data-control="volume"] [role="spinbutton"]',
    ) as HTMLElement;
    expect(knob.getAttribute('aria-valuemin')).toBe('0');
    expect(knob.getAttribute('aria-valuemax')).toBe('100');
    field.value.set(-1);
    expect(kinds(field)).toContain('min');
    expect(kinds(field)).toContain('step-domain');
    field.value.set(101);
    expect(kinds(field)).toContain('max');
    field.value.set(55);
    expect(field.valid()).toBe(true);
  });

  it('propagates pending, cancellation and the latest async numeric result', async () => {
    const fixture = TestBed.createComponent(AsyncNumberHost);
    fixture.detectChanges();
    const field = fixture.componentInstance.fields.amount();
    field.value.set(1);
    fixture.detectChanges();
    await flush();
    const first = fixture.componentInstance.requests.get(1);
    expect(first).toBeDefined();
    expect(field.pending()).toBe(true);
    field.value.set(2);
    fixture.detectChanges();
    await flush();
    const second = fixture.componentInstance.requests.get(2);
    expect(first?.aborted()).toBe(true);
    first?.resolve(false);
    await flush();
    expect(kinds(field)).not.toContain('unavailable-number');
    second?.resolve(false);
    await flush();
    fixture.detectChanges();
    expect(field.pending()).toBe(false);
    expect(kinds(field)).toContain('unavailable-number');
  });
});
