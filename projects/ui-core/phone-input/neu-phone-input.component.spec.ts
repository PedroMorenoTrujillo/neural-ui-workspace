import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { NeuPhoneInputComponent } from './neu-phone-input.component';
import { createNeuPhoneInputValue, type NeuPhoneInputValue } from './neu-phone-input.value';

@Component({
  imports: [FormField, NeuPhoneInputComponent],
  template: '<neu-phone-input [formField]="fields.phone" defaultRegion="ES" />',
  providers: [{ provide: NEURAL_LOCALE, useValue: 'es-ES' }],
})
class PhoneForm {
  readonly profile = signal<{ phone: NeuPhoneInputValue | null }>({ phone: null });
  readonly fields = form(this.profile, (path) => {
    required(path.phone);
    validate(path.phone, ({ value }) =>
      value() && !value()?.e164 ? { kind: 'phone', message: 'Número incompleto' } : null,
    );
  });
}

describe('NeuPhoneInputComponent', () => {
  it('uses strict metadata and preserves the raw text of incomplete and invalid values', () => {
    expect(createNeuPhoneInputValue('  ', 'ES')).toBeNull();
    expect(createNeuPhoneInputValue('612 34', 'ES')).toEqual({ region: 'ES', raw: '612 34', e164: null });
    expect(createNeuPhoneInputValue('612 34 56 78', 'ES')?.e164).toBe('+34612345678');
    expect(createNeuPhoneInputValue('Call +34 612 345 678', 'ES')?.e164).toBeNull();
    expect(createNeuPhoneInputValue('+1 213 373 4253 ext. 33', 'ES')?.e164).toBeNull();
    expect(createNeuPhoneInputValue('+1 213 373 4253', 'ES')).toMatchObject({ region: 'US', e164: '+12133734253' });
  });

  it('updates the Signal Forms model, localizes labels and restores its configured default on reset', async () => {
    const fixture = TestBed.createComponent(PhoneForm);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const number = host.querySelector<HTMLInputElement>('input[type="tel"]')!;
    const region = host.querySelector<HTMLSelectElement>('select')!;
    expect(region.value).toBe('ES');
    expect(host.querySelector('legend')?.textContent).toBe('Teléfono');
    expect(region.selectedOptions[0].textContent).toContain('España (+34)');
    expect(number.labels?.[0].textContent).toBe('Número');

    number.value = '612 34';
    number.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.componentInstance.fields.phone().invalid()).toBe(true);
    expect(host.textContent).toContain('Número incompleto');
    expect(number.getAttribute('aria-invalid')).toBe('true');

    number.value = '+1 213 373 4253';
    number.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(region.value).toBe('US');
    expect(fixture.componentInstance.fields.phone().valid()).toBe(true);
    expect(fixture.componentInstance.profile().phone?.e164).toBe('+12133734253');

    fixture.componentInstance.fields().reset({ phone: null });
    await fixture.whenStable();
    expect(region.value).toBe('ES');
    expect(number.value).toBe('');
  });
});
