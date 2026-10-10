import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuTextareaComponent } from './neu-textarea.component';

function create(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(NeuTextareaComponent);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  return {
    fixture,
    component: fixture.componentInstance,
    textarea: fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement,
  };
}

function compose(element: HTMLTextAreaElement, intermediate: string, final: string): void {
  element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  element.value = intermediate;
  element.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  element.value = final;
  element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: final }));
  element.dispatchEvent(new InputEvent('input', { bubbles: true, data: final }));
}

describe('NeuTextareaComponent Signal Forms contract', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('renders labels, sizing, native constraints and accessible hint relationships', () => {
    const { fixture, textarea } = create({
      label: 'Biography',
      size: 'lg',
      rows: 5,
      hint: 'Public profile',
      name: 'bio',
      required: true,
      minLength: 2,
      maxLength: 20,
      pattern: [/^[A-Z]/],
      readonly: true,
      pending: true,
    });
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const hint = fixture.nativeElement.querySelector('.neu-textarea__hint') as HTMLElement;
    expect(label.htmlFor).toBe(textarea.id);
    expect(fixture.nativeElement.classList).toContain('neu-textarea-host--lg');
    expect(textarea.rows).toBe(5);
    expect(textarea.name).toBe('bio');
    expect(textarea.required).toBe(true);
    expect(textarea.minLength).toBe(2);
    expect(textarea.maxLength).toBe(20);
    expect(textarea.getAttribute('pattern')).toBe('^[A-Z]');
    expect(textarea.readOnly).toBe(true);
    expect(textarea.getAttribute('aria-required')).toBe('true');
    expect(textarea.getAttribute('aria-readonly')).toBe('true');
    expect(textarea.getAttribute('aria-busy')).toBe('true');
    expect(textarea.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('renders official error state ahead of a hint', () => {
    const { fixture, textarea, component } = create({
      hint: 'Hint',
      errorMessage: 'Invalid biography',
      invalid: true,
    });
    const error = fixture.nativeElement.querySelector('.neu-textarea__error') as HTMLElement;
    expect(component.hasError()).toBe(true);
    expect(fixture.nativeElement.querySelector('.neu-textarea__hint')).toBeNull();
    expect(error.textContent).toContain('Invalid biography');
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('merges external FormField descriptions without losing local hint or error IDs', () => {
    const { fixture, textarea } = create({ inputId: 'notes', ariaLabel: 'Notes', ariaLabelledBy: 'field-label', ariaDescribedBy: 'field-hint field-hint', hint: 'Local hint' });
    expect(textarea.getAttribute('aria-label')).toBe('Notes');
    expect(textarea.getAttribute('aria-labelledby')).toBe('field-label');
    expect(textarea.getAttribute('aria-describedby')).toBe('field-hint notes-hint');
    fixture.componentRef.setInput('errorMessage', 'Required');
    fixture.detectChanges();
    expect(textarea.getAttribute('aria-describedby')).toBe('field-hint notes-error');
  });

  it('writes the model exactly once for a user input and never echoes a parent write', () => {
    const { fixture, component, textarea } = create();
    const changes = vi.fn();
    component.value.subscribe(changes);
    fixture.componentRef.setInput('value', 'parent');
    fixture.detectChanges();
    expect(textarea.value).toBe('parent');
    expect(changes).not.toHaveBeenCalled();
    textarea.value = 'user';
    textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
    expect(component.value()).toBe('user');
    expect(changes).toHaveBeenCalledExactlyOnceWith('user');
  });

  it('buffers IME changes and suppresses the duplicate input after compositionend', () => {
    const { component, textarea } = create();
    const values: string[] = [];
    component.value.subscribe((value) => values.push(value));
    compose(textarea, 'に', '日本');
    expect(values).toEqual(['日本']);
    expect(component.value()).toBe('日本');
  });

  it('lets a parent write win during IME composition', () => {
    const { fixture, component, textarea } = create();
    const changes = vi.fn();
    component.value.subscribe(changes);
    textarea.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    textarea.value = 'draft';
    textarea.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    fixture.componentRef.setInput('value', 'server');
    fixture.detectChanges();
    textarea.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(component.value()).toBe('server');
    expect(changes).not.toHaveBeenCalled();
  });

  it('cancels an active composition if the field becomes disabled before commit', () => {
    const { fixture, component, textarea } = create();
    const changed = vi.fn();
    component.value.subscribe(changed);
    component.onCompositionStart();
    textarea.value = 'draft';
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    component.onCompositionEnd({ target: textarea } as unknown as Event);
    expect(component.value()).toBe('');
    expect(changed).not.toHaveBeenCalled();
  });

  it.each(['disabled', 'readonly'] as const)('blocks mutation and IME when %s', (state) => {
    const { component, textarea } = create({ [state]: true, value: 'fixed' });
    const changes = vi.fn();
    component.value.subscribe(changes);
    textarea.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    textarea.value = 'changed';
    textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
    textarea.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(component.value()).toBe('fixed');
    expect(changes).not.toHaveBeenCalled();
  });

  it('cancels a pending composition on blur and destroy', () => {
    const first = create();
    const changed = vi.fn();
    const touched = vi.fn();
    first.component.value.subscribe(changed);
    first.component.touch.subscribe(touched);
    first.textarea.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    first.textarea.value = 'draft';
    first.textarea.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    first.textarea.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(changed).not.toHaveBeenCalled();
    expect(touched).toHaveBeenCalledTimes(1);

    const second = create();
    const destroyedChange = vi.fn();
    second.component.value.subscribe(destroyedChange);
    second.textarea.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    second.fixture.destroy();
    second.textarea.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(destroyedChange).not.toHaveBeenCalled();
  });

  it('keeps focus separate from touch and exposes focus/reset boundaries', () => {
    const { component, textarea } = create();
    const touched = vi.fn();
    component.touch.subscribe(touched);
    textarea.dispatchEvent(new FocusEvent('focus'));
    expect(touched).not.toHaveBeenCalled();
    component.focus();
    expect(document.activeElement).toBe(textarea);
    component.reset();
    textarea.dispatchEvent(new FocusEvent('blur'));
    expect(touched).toHaveBeenCalledTimes(1);
  });

  it('supports diagonal, fixed and automatic resize without changing the value', async () => {
    const manual = create();
    expect(manual.textarea.style.resize).toBe('both');
    expect(manual.textarea.classList).not.toContain('neu-textarea__field--auto-resize');
    manual.textarea.style.width = '180px';
    manual.textarea.style.height = '120px';
    manual.fixture.detectChanges();
    expect(manual.textarea.style.resize).toBe('both');
    expect(manual.component.value()).toBe('');
    const fixed = create({ resizable: false });
    expect(fixed.textarea.style.resize).toBe('none');
    const automatic = create({ autoResize: true });
    Object.defineProperty(automatic.textarea, 'scrollHeight', { configurable: true, value: 84 });
    Object.defineProperty(automatic.textarea, 'offsetHeight', { configurable: true, value: 86 });
    Object.defineProperty(automatic.textarea, 'clientHeight', { configurable: true, value: 84 });
    automatic.textarea.value = 'two\nlines';
    automatic.textarea.dispatchEvent(new InputEvent('input'));
    await Promise.resolve();
    expect(automatic.textarea.style.height).toBe('86px');
    expect(automatic.textarea.style.resize).toBe('none');
    expect(automatic.textarea.classList).toContain('neu-textarea__field--auto-resize');
  });

  it('normalizes an unexpected transient non-string only for display and supports hidden', () => {
    const { fixture, textarea } = create({ value: null, hidden: true, size: 'sm' });
    expect(textarea.value).toBe('');
    expect(fixture.nativeElement.hidden).toBe(true);
    expect(fixture.nativeElement.classList).toContain('neu-textarea-host--sm');
  });
});
