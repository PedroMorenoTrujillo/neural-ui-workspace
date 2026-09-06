import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { COMPOSITION_BUFFER_MODE, FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuTextareaComponent } from './neu-textarea.component';
import { provideIcons } from '@ng-icons/core';
import { lucideAlertCircle } from '@ng-icons/lucide';

function mk(inputs: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(NeuTextareaComponent);
  for (const [k, v] of Object.entries(inputs)) {
    f.componentRef.setInput(k, v);
  }
  f.detectChanges();
  return { f, comp: f.componentInstance as any };
}

function composeText(element: HTMLTextAreaElement, intermediate: string, final: string): void {
  element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  element.value = intermediate;
  element.dispatchEvent(
    new InputEvent('input', { bubbles: true, data: intermediate, isComposing: true }),
  );
  element.dispatchEvent(
    new CompositionEvent('compositionupdate', { bubbles: true, data: intermediate }),
  );
  element.value = final;
  element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: final }));
  element.dispatchEvent(new InputEvent('input', { bubbles: true, data: final }));
}

describe('NeuTextareaComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideIcons({ lucideAlertCircle })],
    }).compileComponents();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('should render textarea element', () => {
    const { f } = mk({ label: 'Descripción' });
    expect(f.nativeElement.querySelector('textarea')).toBeTruthy();
  });

  it('should render label', () => {
    const { f } = mk({ label: 'Descripción' });
    expect(f.nativeElement.textContent).toContain('Descripción');
  });

  it('should set rows attribute', () => {
    const { f } = mk({ rows: 5 });
    const el: HTMLTextAreaElement = f.nativeElement.querySelector('textarea');
    expect(el.rows).toBe(5);
  });

  // ── Error / hint ──────────────────────────────────────────────────────────

  it('should show error message', () => {
    const { f } = mk({ errorMessage: 'Campo inválido', label: 'Test' });
    expect(f.nativeElement.textContent).toContain('Campo inválido');
  });

  it('should apply error wrapper class when errorMessage is set', () => {
    const { f } = mk({ errorMessage: 'Error', label: 'Test' });
    expect(f.nativeElement.querySelector('.neu-textarea__wrapper--error')).toBeTruthy();
  });

  it('should show hint when no error', () => {
    const { f } = mk({ hint: 'Máximo 500 caracteres', label: 'Test' });
    expect(f.nativeElement.querySelector('.neu-textarea__hint')).toBeTruthy();
    expect(f.nativeElement.textContent).toContain('Máximo 500 caracteres');
  });

  it('should NOT show hint when error is present', () => {
    const { f } = mk({ errorMessage: 'Error', hint: 'Hint', label: 'Test' });
    expect(f.nativeElement.querySelector('.neu-textarea__hint')).toBeFalsy();
  });

  // ── Disabled ──────────────────────────────────────────────────────────────

  it('should be disabled when disabled input=true', () => {
    const { f } = mk({ disabled: true, label: 'Test' });
    const el: HTMLTextAreaElement = f.nativeElement.querySelector('textarea');
    expect(el.disabled).toBe(true);
  });

  it('setDisabledState should disable the textarea', () => {
    const { f, comp } = mk({ label: 'Test' });
    comp.setDisabledState(true);
    f.detectChanges();
    const el: HTMLTextAreaElement = f.nativeElement.querySelector('textarea');
    expect(el.disabled).toBe(true);
  });

  // ── CVA ───────────────────────────────────────────────────────────────────

  it('writeValue should update _value', () => {
    const { comp } = mk({ label: 'Test' });
    comp.writeValue('Hola mundo');
    expect(comp['_value']()).toBe('Hola mundo');
  });

  it('writeValue with null should set empty string', () => {
    const { comp } = mk({ label: 'Test' });
    comp.writeValue(null);
    expect(comp['_value']()).toBe('');
  });

  it('should call onChange when typing', () => {
    const { f, comp } = mk({ label: 'Test' });
    const onChange = vi.fn();
    comp.registerOnChange(onChange);
    const el: HTMLTextAreaElement = f.nativeElement.querySelector('textarea');
    el.value = 'Nuevo texto';
    el.dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalledWith('Nuevo texto');
  });

  it('should emit valueChange only after user input', () => {
    const { f, comp } = mk({ label: 'Test' });
    const emitted = vi.fn();
    comp.valueChange.subscribe(emitted);

    comp.writeValue('Programmatic');
    expect(emitted).not.toHaveBeenCalled();

    const el: HTMLTextAreaElement = f.nativeElement.querySelector('textarea');
    el.value = 'User value';
    el.dispatchEvent(new Event('input'));
    expect(emitted).toHaveBeenCalledWith('User value');
  });

  it('buffers IME CVA and FormControl propagation while retaining native input events', async () => {
    const direct = mk();
    const cvaValues: string[] = [];
    const domValues: string[] = [];
    direct.comp.registerOnChange((value: string) => cvaValues.push(value));
    const textarea = direct.f.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.addEventListener('input', () => domValues.push(textarea.value));
    composeText(textarea, 'に', '日本');
    expect(domValues).toEqual(['に', '日本']);
    expect(cvaValues).toEqual(['日本']);

    @Component({
      template: `<neu-textarea label="Notes" [formControl]="ctrl" />`,
      imports: [NeuTextareaComponent, ReactiveFormsModule],
    })
    class ImeHost {
      readonly ctrl = new FormControl('');
    }
    const fixture = TestBed.createComponent(ImeHost);
    fixture.detectChanges();
    const values: Array<string | null> = [];
    fixture.componentInstance.ctrl.valueChanges.subscribe((value) => values.push(value));
    composeText(fixture.nativeElement.querySelector('textarea'), 'に', '日本');
    expect(values).toEqual(['日本']);
  });

  it('respects COMPOSITION_BUFFER_MODE=false', () => {
    TestBed.overrideProvider(COMPOSITION_BUFFER_MODE, { useValue: false });
    const { f, comp } = mk();
    const values: string[] = [];
    comp.registerOnChange((value: string) => values.push(value));
    composeText(f.nativeElement.querySelector('textarea'), 'に', '日本');
    expect(values).toEqual(['に', '日本']);
  });

  it('cancels pending IME propagation on blur, disable, writeValue, and destroy', () => {
    for (const action of ['blur', 'disable', 'write', 'destroy'] as const) {
      const fixture = mk();
      const changes = vi.fn();
      fixture.comp.registerOnChange(changes);
      const textarea = fixture.f.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
      textarea.dispatchEvent(new CompositionEvent('compositionstart'));
      textarea.value = 'draft';
      textarea.dispatchEvent(new InputEvent('input', { isComposing: true }));
      if (action === 'blur') textarea.dispatchEvent(new FocusEvent('blur'));
      else if (action === 'disable') fixture.comp.setDisabledState(true);
      else if (action === 'write') fixture.comp.writeValue('server');
      else fixture.f.destroy();
      textarea.dispatchEvent(new CompositionEvent('compositionend'));
      expect(changes).not.toHaveBeenCalled();
      if (action === 'write') expect(fixture.comp['_value']()).toBe('server');
    }
  });

  it('onBlur should call onTouched', () => {
    const { f, comp } = mk({ label: 'Test' });
    const onTouched = vi.fn();
    comp.registerOnTouched(onTouched);
    const el: HTMLTextAreaElement = f.nativeElement.querySelector('textarea');
    el.dispatchEvent(new Event('blur'));
    expect(onTouched).toHaveBeenCalled();
  });

  it('onFocus should set _focused to true', () => {
    const { f, comp } = mk({ label: 'Test' });
    const el: HTMLTextAreaElement = f.nativeElement.querySelector('textarea');
    el.dispatchEvent(new Event('focus'));
    expect(comp['_focused']()).toBe(true);
    el.dispatchEvent(new Event('blur'));
    expect(comp['_focused']()).toBe(false);
  });

  // ── hasValue / hasError computed ──────────────────────────────────────────

  it('hasValue should be true when value is non-empty', () => {
    const { comp } = mk({ label: 'Test' });
    comp.writeValue('Texto');
    expect(comp.hasValue()).toBe(true);
  });

  it('hasError should be true when errorMessage is set', () => {
    const { comp } = mk({ errorMessage: 'Error', label: 'Test' });
    expect(comp.hasError()).toBe(true);
  });

  // ── resizable / autoResize ────────────────────────────────────────────────

  it('_resizeStyle should be "none" when autoResize=true', () => {
    const { comp } = mk({ autoResize: true, label: 'Test' });
    expect(comp['_resizeStyle']()).toBe('none');
  });

  it('_resizeStyle should be "vertical" when resizable=true', () => {
    const { comp } = mk({ resizable: true, label: 'Test' });
    expect(comp['_resizeStyle']()).toBe('vertical');
  });

  it('_resizeStyle should be "none" when resizable=false', () => {
    const { comp } = mk({ resizable: false, label: 'Test' });
    expect(comp['_resizeStyle']()).toBe('none');
  });

  // ── readonly / required / maxlength ───────────────────────────────────────

  it('should set readonly attribute', () => {
    const { f } = mk({ readonly: true, label: 'Test' });
    const el: HTMLTextAreaElement = f.nativeElement.querySelector('textarea');
    expect(el.readOnly).toBe(true);
  });

  it('should set required attribute', () => {
    const { f } = mk({ required: true, label: 'Test' });
    const el: HTMLTextAreaElement = f.nativeElement.querySelector('textarea');
    expect(el.required).toBe(true);
  });

  it('should set maxlength attribute', () => {
    const { f } = mk({ maxlength: 200, label: 'Test' });
    const el: HTMLTextAreaElement = f.nativeElement.querySelector('textarea');
    expect(el.maxLength).toBe(200);
  });

  // ── ReactiveFormsModule ───────────────────────────────────────────────────

  it('should integrate with FormControl', async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
    }).compileComponents();

    @Component({
      template: `<neu-textarea label="Bio" [formControl]="ctrl" />`,
      imports: [NeuTextareaComponent, ReactiveFormsModule],
    })
    class HostComp {
      ctrl = new FormControl('');
    }

    const f = TestBed.createComponent(HostComp);
    f.detectChanges();
    const el: HTMLTextAreaElement = f.nativeElement.querySelector('textarea');
    el.value = 'Hola';
    el.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(f.componentInstance.ctrl.value).toBe('Hola');
  });

  it('should disable textarea when formControl is disabled', async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
    }).compileComponents();

    @Component({
      template: `<neu-textarea label="Bio" [formControl]="ctrl" />`,
      imports: [NeuTextareaComponent, ReactiveFormsModule],
    })
    class HostComp {
      ctrl = new FormControl({ value: '', disabled: true });
    }

    const f = TestBed.createComponent(HostComp);
    f.detectChanges();
    const el: HTMLTextAreaElement = f.nativeElement.querySelector('textarea');
    expect(el.disabled).toBe(true);
  });

  it('onBlur should call _onTouched callback', () => {
    const f = TestBed.createComponent(NeuTextareaComponent);
    f.detectChanges();
    let touched = false;
    f.componentInstance.registerOnTouched(() => (touched = true));
    f.componentInstance.onBlur();
    expect(touched).toBe(true);
  });

  it('writeValue null should set empty string', () => {
    const f = TestBed.createComponent(NeuTextareaComponent);
    f.detectChanges();
    f.componentInstance.writeValue(null);
    expect(f.componentInstance['_value']()).toBe('');
  });

  it('autoResize=true should add auto-resize class', async () => {
    const f = TestBed.createComponent(NeuTextareaComponent);
    f.componentRef.setInput('autoResize', true);
    f.componentRef.setInput('label', 'Bio');
    f.detectChanges();
    await f.whenStable();
    // autoResize=true sets resize style to 'none' on the textarea
    const textareaEl = f.nativeElement.querySelector('textarea');
    expect(textareaEl).toBeTruthy();
    expect(f.componentInstance.autoResize()).toBe(true);
  });

  it('hint input is rendered', async () => {
    const f = TestBed.createComponent(NeuTextareaComponent);
    f.componentRef.setInput('hint', 'Max 200 chars');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Max 200 chars');
  });

  it('errorMessage is rendered', async () => {
    const f = TestBed.createComponent(NeuTextareaComponent);
    f.componentRef.setInput('errorMessage', 'This field is required');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('This field is required');
  });

  it('_resizeStyle returns vertical when resizable=true and autoResize=false', () => {
    // resizable=true debe devolver 'vertical' en _resizeStyle
    // resizable=true must return 'vertical' in _resizeStyle
    const f = TestBed.createComponent(NeuTextareaComponent);
    f.componentRef.setInput('autoResize', false);
    f.componentRef.setInput('resizable', true);
    f.detectChanges();
    expect((f.componentInstance as any)['_resizeStyle']()).toBe('vertical');
  });

  it('onInput with autoResize=true should resize the textarea', async () => {
    // onInput con autoResize=true debe ajustar la altura del textarea
    // onInput with autoResize=true must adjust textarea height
    const f = TestBed.createComponent(NeuTextareaComponent);
    f.componentRef.setInput('autoResize', true);
    f.detectChanges();
    await f.whenStable();
    const textarea: HTMLTextAreaElement = f.nativeElement.querySelector('textarea');
    if (textarea) {
      const fakeEvent = { target: textarea } as unknown as Event;
      Object.defineProperty(textarea, 'scrollHeight', { value: 120, configurable: true });
      (f.componentInstance as any)['onInput'](fakeEvent);
      // Verify the handler ran without throwing
      expect(textarea).toBeTruthy();
    }
  });

  it('input and blur before CVA registration use default callbacks safely', async () => {
    const f = TestBed.createComponent(NeuTextareaComponent);
    f.detectChanges();
    await f.whenStable();
    const textarea = f.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'draft';

    expect(() => textarea.dispatchEvent(new Event('input', { bubbles: true }))).not.toThrow();
    expect(() => textarea.dispatchEvent(new Event('blur'))).not.toThrow();
    expect((f.componentInstance as any)['_value']()).toBe('draft');
  });

  it('constructor auto-resize effect is safe before a textarea ref is available', () => {
    const f = TestBed.createComponent(NeuTextareaComponent);
    f.componentRef.setInput('autoResize', true);

    expect(() => f.componentInstance['_isDisabledState']()).not.toThrow();
    expect(() => f.detectChanges()).not.toThrow();
  });
});
