import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuInputMaskComponent } from './neu-input-mask.component';

function create(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(NeuInputMaskComponent);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  return {
    fixture,
    component: fixture.componentInstance,
    input: fixture.nativeElement.querySelector('input') as HTMLInputElement,
  };
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
}

function paste(input: HTMLInputElement, value: string): ClipboardEvent {
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: { getData: () => value },
  });
  input.dispatchEvent(event);
  return event;
}

describe('NeuInputMaskComponent Signal Forms contract', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('applies numeric, alphabetic and alphanumeric slots without dropping deferred valid chars', () => {
    const numeric = create({ mask: '999-999' });
    type(numeric.input, '12a3b456');
    expect(numeric.component.value()).toBe('123-456');

    const mixed = create({ mask: '99-AA-**' });
    type(mixed.input, '1a2bc3Z');
    expect(mixed.component.value()).toBe('12-ab-c3');
  });

  it('keeps raw text when no mask is configured', () => {
    const { component, input } = create();
    type(input, 'raw value!');
    expect(component.value()).toBe('raw value!');
  });

  it('publishes one masked update and does not echo an external write', () => {
    const { fixture, component, input } = create({ mask: '999-999' });
    const changed = vi.fn();
    component.value.subscribe(changed);
    fixture.componentRef.setInput('value', '123-456');
    fixture.detectChanges();
    expect(input.value).toBe('123-456');
    expect(changed).not.toHaveBeenCalled();
    type(input, '987654');
    expect(component.value()).toBe('987-654');
    expect(changed).toHaveBeenCalledExactlyOnceWith('987-654');
    expect(input.selectionStart).toBe(7);
  });

  it('handles paste as one masked update and preserves surrounding input', () => {
    const { component, input } = create({ mask: '999-999', value: '123-456' });
    const changed = vi.fn();
    component.value.subscribe(changed);
    input.setSelectionRange(4, 7);
    const event = paste(input, '789');
    expect(event.defaultPrevented).toBe(true);
    expect(component.value()).toBe('123-789');
    expect(changed).toHaveBeenCalledExactlyOnceWith('123-789');
  });

  it('ignores a paste event without clipboard data', () => {
    const { component, input } = create({ mask: '999', value: '123' });
    const event = new Event('paste', { bubbles: true, cancelable: true });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(component.value()).toBe('123');
  });

  it('buffers IME, masks once on compositionend and suppresses the duplicate input', () => {
    const { component, input } = create({ mask: 'AA-99' });
    const values: string[] = [];
    component.value.subscribe((value) => values.push(value));
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'a';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    input.value = 'ab12';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    expect(values).toEqual(['ab-12']);
  });

  it('suppresses the browser duplicate input after a direct composition commit', () => {
    const { component, input } = create({ mask: 'AA-99' });
    const changed = vi.fn();
    component.value.subscribe(changed);
    component.onCompositionStart();
    input.value = 'ab12';
    component.onCompositionEnd({ target: input } as unknown as Event);
    component.onInput({ target: input } as unknown as Event);
    expect(component.value()).toBe('ab-12');
    expect(changed).toHaveBeenCalledExactlyOnceWith('ab-12');
  });

  it('lets a parent write win during composition', () => {
    const { fixture, component, input } = create({ mask: '999' });
    const changed = vi.fn();
    component.value.subscribe(changed);
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '12';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    fixture.componentRef.setInput('value', '999');
    fixture.detectChanges();
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(component.value()).toBe('999');
    expect(changed).not.toHaveBeenCalled();
  });

  it('cancels an active composition if readonly arrives before compositionend', () => {
    const { fixture, component, input } = create({ mask: 'AA-99' });
    const changed = vi.fn();
    component.value.subscribe(changed);
    component.onCompositionStart();
    input.value = 'ab12';
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    component.onCompositionEnd({ target: input } as unknown as Event);
    expect(component.value()).toBe('');
    expect(changed).not.toHaveBeenCalled();
  });

  it('covers sparse masks, invalid candidates, equal edits and null selections', () => {
    const { component, input } = create({ mask: '99-AA-**', value: '12' });
    const changed = vi.fn();
    component.value.subscribe(changed);
    type(input, '12');
    expect(changed).not.toHaveBeenCalled();
    type(input, '---');
    expect(component.value()).toBe('');
    input.value = '';
    Object.defineProperty(input, 'selectionStart', { configurable: true, value: null });
    Object.defineProperty(input, 'selectionEnd', { configurable: true, value: null });
    paste(input, 'a1b2z9');
    expect(component.value()).toBe('12-ab-z9');
  });

  it.each(['disabled', 'readonly'] as const)(
    'blocks typing, paste and composition when %s',
    (state) => {
      const { component, input } = create({ mask: '999', value: '123', [state]: true });
      const changed = vi.fn();
      component.value.subscribe(changed);
      type(input, '456');
      paste(input, '789');
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      expect(component.value()).toBe('123');
      expect(changed).not.toHaveBeenCalled();
    },
  );

  it('renders labels, hint/error and official native states', () => {
    const { fixture, input } = create({
      label: 'Phone',
      hint: 'Numbers only',
      name: 'phone',
      required: true,
      minLength: 7,
      maxLength: 7,
      pattern: [/^\d{3}-\d{3}$/],
      readonly: true,
      pending: true,
    });
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const hint = fixture.nativeElement.querySelector('.neu-input-mask__hint') as HTMLElement;
    expect(label.htmlFor).toBe(input.id);
    expect(input.name).toBe('phone');
    expect(input.required).toBe(true);
    expect(input.minLength).toBe(7);
    expect(input.maxLength).toBe(7);
    expect(input.pattern).toContain('d{3}');
    expect(input.readOnly).toBe(true);
    expect(input.getAttribute('aria-busy')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);

    const invalid = create({ invalid: true, errorMessage: 'Invalid phone', hint: 'hidden' });
    expect(invalid.input.getAttribute('aria-invalid')).toBe('true');
    expect(invalid.fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Invalid phone',
    );
  });

  it('emits touch only on blur and exposes focus/reset', () => {
    const { component, input } = create();
    const touched = vi.fn();
    component.touch.subscribe(touched);
    component.focus();
    expect(document.activeElement).toBe(input);
    expect(touched).not.toHaveBeenCalled();
    input.dispatchEvent(new FocusEvent('blur'));
    expect(touched).toHaveBeenCalledTimes(1);
    expect(() => component.reset()).not.toThrow();
  });
});
