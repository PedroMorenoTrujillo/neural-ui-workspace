import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuInputComponent } from './neu-input.component';
import { provideIcons } from '@ng-icons/core';
import { lucideAlertCircle, lucideSearch } from '@ng-icons/lucide';

function mk(inputs: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(NeuInputComponent);
  for (const [k, v] of Object.entries(inputs)) {
    f.componentRef.setInput(k, v);
  }
  f.detectChanges();
  return { f, comp: f.componentInstance as any };
}

describe('NeuInputComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideIcons({ lucideAlertCircle, lucideSearch })],
    }).compileComponents();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('should render input element', () => {
    const { f } = mk({ label: 'Nombre' });
    expect(f.nativeElement.querySelector('input')).toBeTruthy();
  });

  it('should render floating label', () => {
    const { f } = mk({ label: 'Nombre', floatingLabel: true });
    expect(f.nativeElement.querySelector('.neu-input__label')).toBeTruthy();
  });

  it('should render static label when floatingLabel=false', () => {
    const { f } = mk({ label: 'Nombre', floatingLabel: false });
    expect(f.nativeElement.querySelector('.neu-input__static-label')).toBeTruthy();
  });

  it('should set type attribute', () => {
    const { f } = mk({ type: 'email', label: 'Email' });
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    expect(input.type).toBe('email');
  });

  it('should set placeholder when floatingLabel=false', () => {
    const { f } = mk({ label: 'Test', floatingLabel: false, placeholder: 'Escribe aquí' });
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    expect(input.placeholder).toBe('Escribe aquí');
  });

  // ── Error state ───────────────────────────────────────────────────────────

  it('should show error message', () => {
    const { f } = mk({ errorMessage: 'Campo requerido', label: 'Test' });
    expect(f.nativeElement.textContent).toContain('Campo requerido');
  });

  it('should apply error class when errorMessage is set', () => {
    const { f } = mk({ errorMessage: 'Error!', label: 'Test' });
    expect(f.nativeElement.querySelector('.neu-input__wrapper--error')).toBeTruthy();
  });

  it('should show hint when no error', () => {
    const { f } = mk({ hint: 'Mínimo 8 caracteres', label: 'Test' });
    expect(f.nativeElement.textContent).toContain('Mínimo 8 caracteres');
    expect(f.nativeElement.querySelector('.neu-input__hint')).toBeTruthy();
  });

  it('should NOT show hint when error is present', () => {
    const { f } = mk({ errorMessage: 'Error', hint: 'Hint', label: 'Test' });
    expect(f.nativeElement.querySelector('.neu-input__hint')).toBeFalsy();
    expect(f.nativeElement.querySelector('.neu-input__error')).toBeTruthy();
  });

  // ── CVA ───────────────────────────────────────────────────────────────────

  it('writeValue should update _value', () => {
    const { comp } = mk({ label: 'Test' });
    comp.writeValue('hello');
    expect(comp._value()).toBe('hello');
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
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    input.value = 'Pedro';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(onChange).toHaveBeenCalledWith('Pedro');
  });

  it('onBlur should call onTouched and remove focused state', () => {
    const { f, comp } = mk({ label: 'Test' });
    const onTouched = vi.fn();
    comp.registerOnTouched(onTouched);
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('focus'));
    f.detectChanges();
    expect(comp._focused()).toBe(true);
    input.dispatchEvent(new Event('blur'));
    f.detectChanges();
    expect(comp._focused()).toBe(false);
    expect(onTouched).toHaveBeenCalled();
  });

  it('setDisabledState should disable the input', () => {
    const { f, comp } = mk({ label: 'Test' });
    comp.setDisabledState(true);
    f.detectChanges();
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    expect(input.disabled).toBe(true);
  });

  it('disabled input should disable native element', () => {
    const { f } = mk({ disabled: true, label: 'Test' });
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    expect(input.disabled).toBe(true);
  });

  // ── Computed state ────────────────────────────────────────────────────────

  it('hasValue computed should be true when value is non-empty', () => {
    const { comp } = mk({ label: 'Test' });
    comp.writeValue('x');
    expect(comp.hasValue()).toBe(true);
  });

  it('hasValue computed should be false for empty string', () => {
    const { comp } = mk({ label: 'Test' });
    comp.writeValue('');
    expect(comp.hasValue()).toBe(false);
  });

  it('hasError computed should be true when errorMessage is set', () => {
    const { comp } = mk({ errorMessage: 'Error', label: 'Test' });
    expect(comp.hasError()).toBe(true);
  });

  // ── Icon ──────────────────────────────────────────────────────────────────

  it('should render icon on the left when icon + iconPosition=left', () => {
    const { f } = mk({ label: 'Test', icon: 'lucideSearch', iconPosition: 'left' });
    expect(f.nativeElement.querySelector('.neu-input__icon--start')).toBeTruthy();
  });

  it('should render icon on the right when iconPosition=right', () => {
    const { f } = mk({ label: 'Test', icon: 'lucideSearch', iconPosition: 'right' });
    expect(f.nativeElement.querySelector('.neu-input__icon--end')).toBeTruthy();
  });

  // ── Attributes ────────────────────────────────────────────────────────────

  it('should set readonly attribute', () => {
    const { f } = mk({ label: 'Test', readonly: true });
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    expect(input.readOnly).toBe(true);
  });

  it('should set maxlength attribute', () => {
    const { f } = mk({ label: 'Test', maxlength: 20 });
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    expect(input.maxLength).toBe(20);
  });

  it('should set required attribute', () => {
    const { f } = mk({ label: 'Test', required: true });
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    expect(input.required).toBe(true);
  });

  // ── ReactiveFormsModule integration ──────────────────────────────────────

  it('should update formControl value when typing', async () => {
    await TestBed.configureTestingModule({ imports: [ReactiveFormsModule] }).compileComponents();

    @Component({
      template: `<neu-input label="Nombre" [formControl]="ctrl" />`,
      imports: [NeuInputComponent, ReactiveFormsModule],
    })
    class HostComp {
      ctrl = new FormControl('');
    }

    const f = TestBed.createComponent(HostComp);
    f.detectChanges();
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    input.value = 'Pedro';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(f.componentInstance.ctrl.value).toBe('Pedro');
  });

  it('should reflect formControl setValue in input', async () => {
    await TestBed.configureTestingModule({ imports: [ReactiveFormsModule] }).compileComponents();

    @Component({
      template: `<neu-input label="Nombre" [formControl]="ctrl" />`,
      imports: [NeuInputComponent, ReactiveFormsModule],
    })
    class HostComp {
      ctrl = new FormControl('');
    }

    const f = TestBed.createComponent(HostComp);
    f.detectChanges();
    f.componentInstance.ctrl.setValue('Juan');
    f.detectChanges();
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    expect(input.value).toBe('Juan');
  });

  it('should be disabled when formControl is disabled', async () => {
    await TestBed.configureTestingModule({ imports: [ReactiveFormsModule] }).compileComponents();

    @Component({
      template: `<neu-input label="Nombre" [formControl]="ctrl" />`,
      imports: [NeuInputComponent, ReactiveFormsModule],
    })
    class HostComp {
      ctrl = new FormControl({ value: '', disabled: true });
    }

    const f = TestBed.createComponent(HostComp);
    f.detectChanges();
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    expect(input.disabled).toBe(true);
  });

  it('endIcon input renders .neu-input__icon--end', async () => {
    const f = TestBed.createComponent(NeuInputComponent);
    f.componentRef.setInput('endIcon', 'search');
    f.detectChanges();
    await f.whenStable();
    const endEl = f.nativeElement.querySelector('.neu-input__icon--end');
    expect(endEl).toBeTruthy();
  });

  it('icon with iconPosition=left renders .neu-input__icon--start', async () => {
    const f = TestBed.createComponent(NeuInputComponent);
    f.componentRef.setInput('icon', 'user');
    f.componentRef.setInput('iconPosition', 'left');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-input__icon--start')).toBeTruthy();
  });

  it('icon with iconPosition=right renders .neu-input__icon--end', async () => {
    const f = TestBed.createComponent(NeuInputComponent);
    f.componentRef.setInput('icon', 'user');
    f.componentRef.setInput('iconPosition', 'right');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-input__icon--end')).toBeTruthy();
  });

  it('onBlur should call _onTouched', () => {
    const f = TestBed.createComponent(NeuInputComponent);
    f.detectChanges();
    let touched = false;
    f.componentInstance.registerOnTouched(() => (touched = true));
    f.componentInstance.onBlur();
    expect(touched).toBe(true);
  });

  it('writeValue null should set empty string', () => {
    const f = TestBed.createComponent(NeuInputComponent);
    f.detectChanges();
    f.componentInstance.writeValue(null);
    expect(f.componentInstance['_value']()).toBe('');
  });

  it('startIcon renders start icon block in template', async () => {
    // startIcon debe renderizar el bloque de icono inicial en el template
    // startIcon must render the start icon block in the template
    const f = TestBed.createComponent(NeuInputComponent);
    f.componentRef.setInput('startIcon', 'search');
    f.detectChanges();
    await f.whenStable();
    // The startIcon() truthy value should render the start icon wrapper span
    const startSpan = f.nativeElement.querySelector(
      '.neu-input__icon--start, [class*="icon--start"]',
    );
    expect(startSpan).toBeTruthy();
  });

  it('writeValue with a string value should update _value signal', () => {
    // writeValue con un string debe actualizar la señal _value
    // writeValue with a string must update the _value signal
    const f = TestBed.createComponent(NeuInputComponent);
    f.detectChanges();
    f.componentInstance.writeValue('hello');
    expect(f.componentInstance['_value']()).toBe('hello');
  });
});
