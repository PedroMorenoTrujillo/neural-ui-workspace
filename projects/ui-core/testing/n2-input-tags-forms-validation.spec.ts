import { Component, provideZonelessChangeDetection, resource, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, maxLength, minLength, required, validate, validateAsync } from '@angular/forms/signals';
import { NeuInputTagsComponent } from '../input-tags/neu-input-tags.component';

@Component({
  selector: 'n2-input-tags-validation-host',
  imports: [FormField, NeuInputTagsComponent],
  template: `<neu-input-tags [formField]="fields.tags" />`,
})
class ValidationHost {
  readonly data = signal({ tags: [] as readonly string[] });
  readonly fields = form(this.data, (path) => {
    required(path.tags);
    validate(path.tags, ({ value }) =>
      value().length ? undefined : { kind: 'required', message: 'At least one tag' },
    );
    minLength(path.tags, 2);
    maxLength(path.tags, 3);
    validate(path.tags, ({ value }) =>
      value().includes('blocked') ? { kind: 'blocked-tag', message: 'Blocked tag' } : undefined,
    );
  });
}

type PendingRequest = { readonly aborted: () => boolean; resolve(result: boolean): void };

@Component({
  selector: 'n2-input-tags-async-validation-host',
  imports: [FormField, NeuInputTagsComponent],
  template: `<neu-input-tags [formField]="fields.tags" />`,
})
class AsyncValidationHost {
  readonly data = signal({ tags: [] as readonly string[] });
  readonly requests = new Map<string, PendingRequest>();
  readonly fields = form(this.data, (path) => {
    validateAsync(path.tags, {
      params: ({ value }) => value().join('|'),
      factory: (params) =>
        resource({
          params,
          loader: ({ params: request, abortSignal }) =>
            new Promise<boolean>((resolve) => {
              if (request) this.requests.set(request, { aborted: () => abortSignal.aborted, resolve });
            }),
        }),
      onSuccess: (available) => available ? undefined : { kind: 'unavailable-tags', message: 'Unavailable' },
      onError: () => ({ kind: 'async-tags-error', message: 'Validation failed' }),
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

describe('N2-008 InputTags Signal Forms validation', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  it('propagates required, min/max length and custom collection validation', () => {
    const fixture = TestBed.createComponent(ValidationHost);
    fixture.detectChanges();
    const field = fixture.componentInstance.fields.tags();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(kinds(field)).toContain('required');
    expect(kinds(field)).toContain('minLength');
    expect(input.getAttribute('aria-required')).toBe('true');
    field.value.set(['one', 'two', 'three', 'four']);
    expect(kinds(field)).toContain('maxLength');
    field.value.set(['one', 'blocked']);
    expect(kinds(field)).toContain('blocked-tag');
    field.value.set(['one', 'two']);
    expect(field.valid()).toBe(true);
  });

  it('cancels stale async requests and exposes only the latest result', async () => {
    const fixture = TestBed.createComponent(AsyncValidationHost);
    fixture.detectChanges();
    const field = fixture.componentInstance.fields.tags();
    field.value.set(['first']);
    fixture.detectChanges();
    await flush();
    const first = fixture.componentInstance.requests.get('first');
    expect(first).toBeDefined();
    expect(field.pending()).toBe(true);
    field.value.set(['second']);
    fixture.detectChanges();
    await flush();
    const second = fixture.componentInstance.requests.get('second');
    expect(first?.aborted()).toBe(true);
    first?.resolve(false);
    await flush();
    expect(kinds(field)).not.toContain('unavailable-tags');
    second?.resolve(false);
    await flush();
    fixture.detectChanges();
    expect(field.pending()).toBe(false);
    expect(kinds(field)).toContain('unavailable-tags');
  });
});
