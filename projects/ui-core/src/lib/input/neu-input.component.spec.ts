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
});
