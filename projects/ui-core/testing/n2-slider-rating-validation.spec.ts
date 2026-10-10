import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, max, min, required, validate } from '@angular/forms/signals';
import { NeuRatingComponent } from '../rating/neu-rating.component';
import { NeuSliderComponent } from '../slider/neu-slider.component';

@Component({
  imports: [FormField, NeuSliderComponent, NeuRatingComponent],
  template: `
    <neu-slider data-control="slider" [minValue]="10" [maxValue]="90" [formField]="fields.slider" />
    <neu-rating data-control="rating" [formField]="fields.rating" />
  `,
})
class ValidationHost {
  readonly data = signal({ slider: 50, rating: null as number | null });
  readonly fields = form(this.data, (path) => {
    required(path.slider);
    min(path.slider, 10);
    max(path.slider, 90);
    validate(path.slider, ({ value }) =>
      value() % 5 === 0 ? undefined : { kind: 'step-domain', message: 'Use a multiple of five' },
    );
    required(path.rating);
    min(path.rating, 1);
    max(path.rating, 5);
    validate(path.rating, ({ value }) =>
      value() === 2 ? { kind: 'blocked-rating', message: 'Two is unavailable' } : undefined,
    );
  });
}

function kinds(field: { errors(): readonly { kind: string }[] }): string[] {
  return field.errors().map((error) => error.kind);
}

describe('N2-010 Slider/Rating Signal Forms validation', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('keeps numeric Slider bounds separate from form validation metadata', () => {
    const fixture = TestBed.createComponent(ValidationHost);
    fixture.detectChanges();
    const field = fixture.componentInstance.fields.slider();
    const input = fixture.nativeElement.querySelector(
      '[data-control="slider"] input',
    ) as HTMLInputElement;
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-valuemin')).toBe('10');
    expect(input.getAttribute('aria-valuemax')).toBe('90');
    field.value.set(5);
    expect(kinds(field)).toContain('min');
    field.value.set(95);
    expect(kinds(field)).toContain('max');
    field.value.set(13);
    expect(kinds(field)).toContain('step-domain');
    field.value.set(55);
    expect(field.valid()).toBe(true);
  });

  it('binds nullable required, min, max and custom validation to Rating', () => {
    const fixture = TestBed.createComponent(ValidationHost);
    fixture.detectChanges();
    const field = fixture.componentInstance.fields.rating();
    const group = fixture.nativeElement.querySelector(
      '[data-control="rating"] [role="radiogroup"]',
    ) as HTMLElement;
    expect(kinds(field)).toContain('required');
    expect(group.getAttribute('aria-required')).toBe('true');
    field.value.set(0);
    expect(kinds(field)).toContain('min');
    field.value.set(6);
    expect(kinds(field)).toContain('max');
    field.value.set(2);
    expect(kinds(field)).toContain('blocked-rating');
    field.value.set(4);
    expect(field.valid()).toBe(true);
  });
});
