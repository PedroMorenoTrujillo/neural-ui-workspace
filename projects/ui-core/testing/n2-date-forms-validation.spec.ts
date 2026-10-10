import { Component, provideZonelessChangeDetection, resource, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required, validate, validateAsync } from '@angular/forms/signals';
import { NeuDateInputComponent } from '../date-input/neu-date-input.component';
import { civilDate, type CivilDate, type CivilDateRange } from '../date-input/neu-date-value';

@Component({
  imports: [FormField, NeuDateInputComponent],
  template: `
    <neu-date-input data-name="date" [formField]="fields.date" />
    <neu-date-input data-name="range" mode="range" [formField]="fields.range" />
  `,
})
class DateValidationHost {
  readonly data = signal({
    date: null as CivilDate | null,
    range: { start: null, end: null } as CivilDateRange,
  });
  readonly fields = form(this.data, (path) => {
    required(path.date);
    validate(path.date, ({ value }) => {
      const date = value();
      if (date && date < civilDate('2026-03-01'))
        return { kind: 'min', message: 'Date before minimum' };
      if (date && date > civilDate('2026-03-31'))
        return { kind: 'max', message: 'Date after maximum' };
      return date === civilDate('2026-03-13')
        ? { kind: 'unavailable-date', message: 'Date unavailable' }
        : undefined;
    });
    validate(path.range, ({ value }) => {
      const range = value();
      if (!range.start || !range.end)
        return { kind: 'complete-range', message: 'Choose both boundaries' };
      return range.start <= range.end
        ? undefined
        : { kind: 'ordered-range', message: 'Start must precede end' };
    });
  });
}

type PendingRequest = { readonly aborted: () => boolean; resolve(value: boolean): void };

@Component({
  imports: [FormField, NeuDateInputComponent],
  template: `<neu-date-input [formField]="fields.date" />`,
})
class AsyncDateHost {
  readonly data = signal({ date: null as CivilDate | null });
  readonly requests = new Map<CivilDate, PendingRequest>();
  readonly fields = form(this.data, (path) => {
    validateAsync(path.date, {
      params: ({ value }) => value(),
      factory: (params) =>
        resource({
          params,
          loader: ({ params: requested, abortSignal }) =>
            new Promise<boolean>((resolve) => {
              if (requested)
                this.requests.set(requested, {
                  aborted: () => abortSignal.aborted,
                  resolve,
                });
            }),
        }),
      onSuccess: (available) =>
        available ? undefined : { kind: 'blocked-date', message: 'Date blocked' },
      onError: () => ({ kind: 'date-validation-error', message: 'Validation failed' }),
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

describe('N2-006 DateInput Signal Forms validation', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('propagates required, min, max and custom civil-date validation', () => {
    const fixture = TestBed.createComponent(DateValidationHost);
    fixture.detectChanges();
    const field = fixture.componentInstance.fields.date();
    const input = fixture.nativeElement.querySelector(
      '[data-name="date"] input',
    ) as HTMLInputElement;
    expect(kinds(field)).toContain('required');
    expect(input.getAttribute('aria-required')).toBe('true');
    field.value.set(civilDate('2026-02-28'));
    expect(kinds(field)).toContain('min');
    field.value.set(civilDate('2026-04-01'));
    expect(kinds(field)).toContain('max');
    field.value.set(civilDate('2026-03-13'));
    expect(kinds(field)).toContain('unavailable-date');
    field.value.set(civilDate('2026-03-20'));
    expect(field.valid()).toBe(true);
  });

  it('validates partial, ordered and complete range states', () => {
    const fixture = TestBed.createComponent(DateValidationHost);
    fixture.detectChanges();
    const field = fixture.componentInstance.fields.range();
    expect(kinds(field)).toContain('complete-range');
    field.value.set({ start: civilDate('2026-03-10'), end: null });
    expect(kinds(field)).toContain('complete-range');
    field.value.set({ start: civilDate('2026-03-10'), end: civilDate('2026-03-05') });
    expect(kinds(field)).toContain('ordered-range');
    field.value.set({ start: civilDate('2026-03-05'), end: civilDate('2026-03-10') });
    expect(field.valid()).toBe(true);
  });

  it('propagates pending, cancellation and only the latest async result', async () => {
    const fixture = TestBed.createComponent(AsyncDateHost);
    fixture.detectChanges();
    const field = fixture.componentInstance.fields.date();
    const firstDate = civilDate('2026-03-01');
    const secondDate = civilDate('2026-03-02');
    field.value.set(firstDate);
    fixture.detectChanges();
    await flush();
    const first = fixture.componentInstance.requests.get(firstDate);
    expect(first).toBeDefined();
    expect(field.pending()).toBe(true);
    field.value.set(secondDate);
    fixture.detectChanges();
    await flush();
    const second = fixture.componentInstance.requests.get(secondDate);
    expect(first?.aborted()).toBe(true);
    first?.resolve(false);
    await flush();
    expect(kinds(field)).not.toContain('blocked-date');
    second?.resolve(false);
    await flush();
    expect(kinds(field)).toContain('blocked-date');
    expect(field.pending()).toBe(false);
  });
});
