import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
    expect(comp._value()).toBe('Hola mundo');
  });

  it('writeValue with null should set empty string', () => {
    const { comp } = mk({ label: 'Test' });
    comp.writeValue(null);
    expect(comp._value()).toBe('');
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
    expect(comp._focused()).toBe(true);
    el.dispatchEvent(new Event('blur'));
    expect(comp._focused()).toBe(false);
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
    expect(comp._resizeStyle()).toBe('none');
  });

  it('_resizeStyle should be "vertical" when resizable=true', () => {
    const { comp } = mk({ resizable: true, label: 'Test' });
    expect(comp._resizeStyle()).toBe('vertical');
  });

  it('_resizeStyle should be "none" when resizable=false', () => {
    const { comp } = mk({ resizable: false, label: 'Test' });
    expect(comp._resizeStyle()).toBe('none');
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
});
