import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuNumberInputComponent, type NeuNumberInputDetail } from './neu-number-input.component';

function create() {
  const fixture = TestBed.createComponent(NeuNumberInputComponent);
  fixture.detectChanges();
  return fixture;
}

function native(fixture: ReturnType<typeof create>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input');
}

function edit(fixture: ReturnType<typeof create>, text: string): void {
  const input = native(fixture);
  input.value = text;
  input.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
  fixture.detectChanges();
}

describe('NeuNumberInputComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('uses null as its empty value and model emits exactly once for a valid edit', () => {
    const fixture = create();
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    edit(fixture, '12.5');
    expect(fixture.componentInstance.value()).toBe(12.5);
    expect(changes).toHaveBeenCalledExactlyOnceWith(12.5);
  });

  it('clears to null from an empty input without converting it to zero', () => {
    const fixture = create();
    fixture.componentInstance.value.set(8);
    fixture.detectChanges();
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    edit(fixture, '');
    expect(fixture.componentInstance.value()).toBeNull();
    expect(changes).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('keeps incomplete and invalid text as a draft without replacing the committed value', () => {
    const fixture = create();
    fixture.componentInstance.value.set(7);
    fixture.detectChanges();
    const details: NeuNumberInputDetail[] = [];
    fixture.componentInstance.inputDetail.subscribe((detail) => details.push(detail));
    edit(fixture, '-');
    edit(fixture, '1.');
    edit(fixture, '1e');
    edit(fixture, 'not-a-number');
    expect(fixture.componentInstance.value()).toBe(7);
    expect(details.map((detail) => detail.state)).toEqual([
      'incomplete',
      'incomplete',
      'incomplete',
      'invalid',
    ]);
    expect(details.every((detail) => detail.value === 7)).toBe(true);
  });

  it('discards an invalid draft on blur and emits touch only on the real composite exit', () => {
    const fixture = create();
    fixture.componentInstance.value.set(42);
    fixture.detectChanges();
    edit(fixture, 'invalid');
    const touched = vi.fn();
    fixture.componentInstance.touch.subscribe(touched);
    const button = fixture.nativeElement.querySelector('button');
    fixture.componentInstance.onFocusOut({ relatedTarget: button } as unknown as FocusEvent);
    expect(touched).not.toHaveBeenCalled();
    fixture.componentInstance.onFocusOut({ relatedTarget: null } as unknown as FocusEvent);
    fixture.detectChanges();
    expect(native(fixture).value).toBe('42');
    expect(touched).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['en-US', '1,234.5', 1234.5, '1,234.50'],
    ['es-ES', '1.234,5', 1234.5, '1234,50'],
    ['de-DE', '1.234,5', 1234.5, '1.234,50'],
  ])('parses and formats %s coherently', (locale, raw, expected, formatted) => {
    const fixture = TestBed.createComponent(NeuNumberInputComponent);
    fixture.componentRef.setInput('formatOptions', {
      locale,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: locale !== 'es-ES',
    });
    fixture.detectChanges();
    edit(fixture, raw);
    expect(fixture.componentInstance.value()).toBe(expected);
    fixture.componentInstance.onFocusOut({ relatedTarget: null } as unknown as FocusEvent);
    fixture.detectChanges();
    expect(native(fixture).value).toBe(formatted);
  });

  it('parses pasted de-DE currency without leaking the formatted string into value', () => {
    const fixture = TestBed.createComponent(NeuNumberInputComponent);
    fixture.componentRef.setInput('formatOptions', {
      locale: 'de-DE',
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    fixture.detectChanges();
    edit(fixture, '1.234,50 €');
    expect(fixture.componentInstance.value()).toBe(1234.5);
    fixture.componentInstance.onFocusOut({ relatedTarget: null } as unknown as FocusEvent);
    fixture.detectChanges();
    expect(native(fixture).value).toContain('1.234,50');
    expect(native(fixture).value).toContain('€');
  });

  it('rejects malformed grouping instead of silently publishing a different number', () => {
    const fixture = create();
    fixture.componentInstance.value.set(9);
    fixture.detectChanges();
    const details: NeuNumberInputDetail[] = [];
    fixture.componentInstance.inputDetail.subscribe((detail) => details.push(detail));
    edit(fixture, '12,34.5');
    expect(fixture.componentInstance.value()).toBe(9);
    expect(details.at(-1)?.state).toBe('invalid');
  });

  it.each(['NaN', 'Infinity', '-Infinity', '1e999'])('rejects non-finite user input %s', (raw) => {
    const fixture = create();
    const details: NeuNumberInputDetail[] = [];
    fixture.componentInstance.inputDetail.subscribe((detail) => details.push(detail));
    edit(fixture, raw);
    expect(fixture.componentInstance.value()).toBeNull();
    expect(details.at(-1)?.state).toBe('invalid');
  });

  it('renders non-finite parent values safely without emitting or claiming aria-valuenow', () => {
    const fixture = create();
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    fixture.componentRef.setInput('value', Number.NaN);
    fixture.detectChanges();
    expect(native(fixture).value).toBe('');
    expect(native(fixture).hasAttribute('aria-valuenow')).toBe(false);
    expect(changes).not.toHaveBeenCalled();
  });

  it('does not clamp typed input so Angular min/max validation remains authoritative', () => {
    const fixture = TestBed.createComponent(NeuNumberInputComponent);
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 10);
    fixture.detectChanges();
    edit(fixture, '25');
    expect(fixture.componentInstance.value()).toBe(25);
    expect(native(fixture).getAttribute('aria-valuemax')).toBe('10');
  });

  it('steps relative to min, clamps UI commands and avoids duplicate commits at a boundary', () => {
    const fixture = TestBed.createComponent(NeuNumberInputComponent);
    fixture.componentRef.setInput('min', 0.1);
    fixture.componentRef.setInput('max', 0.5);
    fixture.componentRef.setInput('step', 0.2);
    fixture.detectChanges();
    fixture.componentInstance.value.set(0.1);
    fixture.detectChanges();
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    fixture.componentInstance.increment();
    fixture.componentInstance.increment();
    fixture.componentInstance.increment();
    expect(fixture.componentInstance.value()).toBe(0.5);
    expect(changes).toHaveBeenCalledTimes(2);
  });

  it('steps from null using clamped zero and falls back from an invalid step', () => {
    const fixture = TestBed.createComponent(NeuNumberInputComponent);
    fixture.componentRef.setInput('min', 5);
    fixture.componentRef.setInput('max', 10);
    fixture.componentRef.setInput('step', 0);
    fixture.detectChanges();
    fixture.componentInstance.increment();
    expect(fixture.componentInstance.value()).toBe(6);
    fixture.componentInstance.decrement();
    expect(fixture.componentInstance.value()).toBe(5);
  });

  it('supports Arrow, Home, End and Enter commit semantics', () => {
    const fixture = TestBed.createComponent(NeuNumberInputComponent);
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 10);
    fixture.componentRef.setInput('step', 2);
    fixture.detectChanges();
    const dispatch = (key: string) =>
      native(fixture).dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
    dispatch('ArrowUp');
    dispatch('End');
    dispatch('ArrowDown');
    dispatch('Home');
    edit(fixture, '1.');
    dispatch('Enter');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(0);
    expect(native(fixture).value).toBe('0');
  });

  it('blocks all mutations while readonly or disabled but preserves readonly focusability', () => {
    const fixture = create();
    fixture.componentInstance.value.set(3);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    edit(fixture, '4');
    fixture.componentInstance.increment();
    expect(fixture.componentInstance.value()).toBe(3);
    expect(native(fixture).readOnly).toBe(true);
    expect(native(fixture).disabled).toBe(false);
    fixture.componentRef.setInput('readonly', false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    edit(fixture, '5');
    expect(fixture.componentInstance.value()).toBe(3);
    expect(native(fixture).disabled).toBe(true);
  });

  it('parent writes replace the rendered draft without event echo', () => {
    const fixture = create();
    fixture.componentInstance.value.set(1);
    fixture.detectChanges();
    edit(fixture, '1.');
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    fixture.componentRef.setInput('value', 2000);
    fixture.detectChanges();
    expect(native(fixture).value).toBe('2,000');
    expect(changes).not.toHaveBeenCalled();
  });

  it('reset removes draft state without changing the form-owned value', () => {
    const fixture = create();
    fixture.componentInstance.value.set(2);
    fixture.detectChanges();
    edit(fixture, '2.');
    fixture.componentInstance.reset();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(2);
    expect(native(fixture).value).toBe('2');
  });

  it.each(['horizontal', 'stacked', 'vertical'] as const)(
    'renders the single layout contract: %s',
    (layout) => {
      const fixture = TestBed.createComponent(NeuNumberInputComponent);
      fixture.componentRef.setInput('layout', layout);
      fixture.componentRef.setInput('floatingLabel', true);
      fixture.componentRef.setInput('label', 'Amount');
      fixture.detectChanges();
      expect(fixture.nativeElement.classList).toContain(`neu-number-input--${layout}`);
      expect(fixture.nativeElement.querySelectorAll('input')).toHaveLength(1);
      expect(!!fixture.nativeElement.querySelector('.neu-number-input__floating-label')).toBe(
        layout !== 'vertical',
      );
      fixture.componentInstance.value.set(5);
      fixture.detectChanges();
      (
        fixture.nativeElement.querySelector('.neu-number-input__btn--inc') as HTMLButtonElement
      ).click();
      (
        fixture.nativeElement.querySelector('.neu-number-input__btn--dec') as HTMLButtonElement
      ).click();
      expect(fixture.componentInstance.value()).toBe(5);
    },
  );

  it('exposes complete spinbutton, label and form-state accessibility', () => {
    const fixture = TestBed.createComponent(NeuNumberInputComponent);
    fixture.componentRef.setInput('value', 1234.5);
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 2000);
    fixture.componentRef.setInput('label', 'Amount');
    fixture.componentRef.setInput('ariaDescribedBy', 'amount-help');
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('invalid', true);
    fixture.detectChanges();
    const input = native(fixture);
    expect(input.getAttribute('role')).toBe('spinbutton');
    expect(input.getAttribute('aria-valuenow')).toBe('1234.5');
    expect(input.getAttribute('aria-valuetext')).toBe('1,234.5');
    expect(input.getAttribute('aria-valuemin')).toBe('0');
    expect(input.getAttribute('aria-valuemax')).toBe('2000');
    expect(input.getAttribute('aria-describedby')).toBe('amount-help');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('label').htmlFor).toBe(input.id);
  });

  it('focus() targets the native input and destroy safely stops subsequent handlers', () => {
    const fixture = create();
    const input = native(fixture);
    const focus = vi.spyOn(input, 'focus');
    fixture.componentInstance.focus({ preventScroll: true });
    expect(focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
    fixture.destroy();
    input.value = '4';
    fixture.componentInstance.onInput({ target: input } as unknown as Event);
    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('falls back deterministically when Intl options are invalid at runtime', () => {
    const fixture = TestBed.createComponent(NeuNumberInputComponent);
    fixture.componentRef.setInput('formatOptions', {
      locale: 'invalid_locale',
      style: 'currency',
      currency: '',
    });
    fixture.componentRef.setInput('value', 1000);
    fixture.detectChanges();
    expect(native(fixture).value).toBe('1,000');
  });

  it('accepts signs, exponents and localized digits while classifying partial separators', () => {
    const fixture = create();
    const details: NeuNumberInputDetail[] = [];
    fixture.componentInstance.inputDetail.subscribe((detail) => details.push(detail));
    edit(fixture, '+2.5e2');
    expect(fixture.componentInstance.value()).toBe(250);
    edit(fixture, '1,');
    expect(details.at(-1)?.state).toBe('incomplete');
    const arabic = TestBed.createComponent(NeuNumberInputComponent);
    arabic.componentRef.setInput('formatOptions', { locale: 'ar-EG', style: 'decimal' });
    arabic.detectChanges();
    edit(arabic, '١٢٫٥');
    expect(arabic.componentInstance.value()).toBe(12.5);
  });

  it('rejects broken inner groups and accepts a complete grouped value', () => {
    const fixture = create();
    edit(fixture, '1,234,56.7');
    expect(fixture.componentInstance.value()).toBeNull();
    edit(fixture, '1,234,567.8');
    expect(fixture.componentInstance.value()).toBe(1234567.8);
  });

  it('ignores keyboard commands when blocked and reports step boundaries', () => {
    const fixture = TestBed.createComponent(NeuNumberInputComponent);
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 1);
    fixture.componentRef.setInput('value', 1);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    native(fixture).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(fixture.componentInstance.value()).toBe(1);
    expect(fixture.componentInstance.canIncrement()).toBe(false);
    expect(fixture.componentInstance.canDecrement()).toBe(true);
  });
});
