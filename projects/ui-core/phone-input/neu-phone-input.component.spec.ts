import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { By } from '@angular/platform-browser';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { NeuSelectComponent, type NeuSelectOption } from '@neural-ui/core/select';
import { NeuSelectHarness } from '@neural-ui/core/testing';
import { NeuPhoneInputComponent } from './neu-phone-input.component';
import { createNeuPhoneInputValue, type NeuPhoneInputValue, type NeuPhoneRegion } from './neu-phone-input.value';

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
  function countryControl<T>(fixture: ComponentFixture<T>): NeuSelectComponent<NeuSelectOption<NeuPhoneRegion>, NeuPhoneRegion> {
    return fixture.debugElement.query(By.directive(NeuSelectComponent)).componentInstance;
  }

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
    const region = countryControl(fixture);
    const picker = await TestbedHarnessEnvironment.loader(fixture).getHarness(NeuSelectHarness);
    expect(region.value()).toBe('ES');
    expect(host.querySelector('legend')?.textContent).toBe('Teléfono');
    expect(await picker.getValueText()).toBe('España (+34)');
    expect(number.labels?.[0].textContent).toContain('Número');

    number.value = '612 34';
    number.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.componentInstance.fields.phone().invalid()).toBe(true);
    expect(host.textContent).toContain('Número incompleto');
    expect(number.getAttribute('aria-invalid')).toBe('true');

    number.value = '+1 213 373 4253';
    number.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(region.value()).toBe('US');
    expect(fixture.componentInstance.fields.phone().valid()).toBe(true);
    expect(fixture.componentInstance.profile().phone?.e164).toBe('+12133734253');

    fixture.componentInstance.fields().reset({ phone: null });
    await fixture.whenStable();
    expect(region.value()).toBe('ES');
    expect(number.value).toBe('');
  });

  it('reparses national numbers when the country changes and retains an empty country choice', async () => {
    const fixture = TestBed.createComponent(NeuPhoneInputComponent);
    fixture.componentRef.setInput('defaultRegion', 'ES');
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const country = countryControl(fixture);
    const number = host.querySelector<HTMLInputElement>('input[type=tel]')!;
    const picker = await TestbedHarnessEnvironment.loader(fixture).getHarness(NeuSelectHarness);
    await picker.selectOption('United Kingdom (+44)');
    expect(fixture.componentInstance.value()).toBeNull();
    expect(country.value()).toBe('GB');

    number.value = '07400 123456';
    number.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()?.e164).toBe('+447400123456');
    await picker.selectOption('Spain (+34)');
    expect(fixture.componentInstance.value()).toEqual({ region: 'ES', raw: '07400 123456', e164: null });

    // A stale or unrecognized selection must not replace the existing phone value.
    country.value.set(null);
    expect(fixture.componentInstance.value()?.region).toBe('ES');
    expect(country.value()).toBe('ES');
    number.value = '';
    number.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBeNull();
    expect(country.value()).toBe('ES');
  });

  it('rejects synthetic edits in disabled and readonly states', () => {
    const fixture = TestBed.createComponent(NeuPhoneInputComponent);
    const original = createNeuPhoneInputValue('612 34 56 78', 'ES');
    fixture.componentRef.setInput('value', original);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const number = host.querySelector('input')!;
    const country = countryControl(fixture);
    const proposals: (NeuPhoneInputValue | null)[] = [];
    fixture.componentInstance.value.subscribe(value => proposals.push(value));
    for (const state of ['disabled', 'readonly']) {
      fixture.componentRef.setInput(state, true);
      fixture.detectChanges();
      number.value = '+1 213 373 4253';
      number.dispatchEvent(new Event('input'));
      country.value.set('US');
      expect(country.value()).toBe('ES');
      expect(fixture.componentInstance.value()).toEqual(original);
      expect(proposals).toEqual([]);
      fixture.componentRef.setInput(state, false);
    }
  });

  it('marks touch only when focus leaves the composite control and tolerates a hidden focus target', () => {
    const fixture = TestBed.createComponent(NeuPhoneInputComponent);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const number = host.querySelector('input')!;
    const country = host.querySelector('neu-select [role=combobox]')!;
    const focus = vi.spyOn(number, 'focus');
    const touched = vi.fn();
    fixture.componentInstance.touch.subscribe(touched);
    fixture.componentInstance.focus({ preventScroll: true });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    number.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: country }));
    countryControl(fixture).focusLeft.emit(new FocusEvent('focusout', { relatedTarget: number }));
    expect(touched).not.toHaveBeenCalled();
    countryControl(fixture).focusLeft.emit(new FocusEvent('focusout', { relatedTarget: document.body }));
    number.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    number.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    expect(touched).toHaveBeenCalledTimes(3);
    fixture.componentRef.setInput('hidden', true);
    fixture.detectChanges();
    expect(host.querySelector('fieldset')).toBeNull();
    expect(() => fixture.componentInstance.focus()).not.toThrow();
  });

  it('uses English labels and resolves explicit errors, validation messages and hints in order', () => {
    const fixture = TestBed.createComponent(NeuPhoneInputComponent);
    fixture.componentRef.setInput('hint', 'Include the country code');
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const number = host.querySelector('input')!;
    expect(host.querySelector('legend')?.textContent).toBe('Phone');
    expect(number.labels?.[0].textContent).toBe('Number');
    const descriptionId = number.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    expect(host.textContent).toContain('Include the country code');
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('errors', [{ kind: 'phone', message: 'Incomplete phone' }]);
    fixture.detectChanges();
    expect(host.textContent).toContain('Incomplete phone');
    fixture.componentRef.setInput('errorMessage', 'Use a valid contact number');
    fixture.detectChanges();
    expect(host.textContent).toContain('Use a valid contact number');
    fixture.componentRef.setInput('errorMessage', '');
    fixture.componentRef.setInput('errors', []);
    fixture.detectChanges();
    expect(host.textContent).toContain('Include the country code');
    fixture.componentRef.setInput('hint', '');
    fixture.detectChanges();
    expect(number.getAttribute('aria-describedby')).toBeNull();
  });

  it('restores the supplied value region on reset and retains the selected region for global numbers', async () => {
    const fixture = TestBed.createComponent(NeuPhoneInputComponent);
    const value = createNeuPhoneInputValue('+1 213 373 4253', 'ES');
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('defaultRegion', 'ES');
    fixture.detectChanges();
    fixture.componentInstance.reset();
    fixture.detectChanges();
    const country = countryControl(fixture);
    const picker = await TestbedHarnessEnvironment.loader(fixture).getHarness(NeuSelectHarness);
    expect(country.value()).toBe('US');
    await picker.selectOption('Spain (+34)');
    expect(country.value()).toBe('US');
    expect(await picker.getValueText()).toBe('United States (+1)');
    expect(fixture.componentInstance.value()?.e164).toBe('+12133734253');
    expect(createNeuPhoneInputValue('+800 1234 5678', 'ES')).toEqual({
      region: 'ES', raw: '+800 1234 5678', e164: '+80012345678',
    });
  });
});
