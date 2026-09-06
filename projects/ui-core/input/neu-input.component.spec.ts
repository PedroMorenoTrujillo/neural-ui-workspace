import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import {
  COMPOSITION_BUFFER_MODE,
  FormControl,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { NeuInputComponent } from './neu-input.component';
import { provideIcons } from '@ng-icons/core';
import { lucideAlertCircle, lucideSearch, lucideUser } from '@ng-icons/lucide';

function mk(inputs: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(NeuInputComponent);
  for (const [k, v] of Object.entries(inputs)) {
    f.componentRef.setInput(k, v);
  }
  f.detectChanges();
  return { f, comp: f.componentInstance as any };
}

function composeText(element: HTMLInputElement, intermediate: string, final: string): void {
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

@Component({
  imports: [NeuInputComponent, FormsModule],
  template: '<neu-input [ngModel]="value" (ngModelChange)="changed($event)" />',
})
class NgModelInitialValueHost {
  value = 'Initial consumer value';
  changes: string[] = [];
  changed(value: string): void {
    this.value = value;
    this.changes.push(value);
  }
}

describe('NeuInputComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideIcons({ lucideAlertCircle, lucideSearch, lucideUser })],
    }).compileComponents();
  });

  it('preserves ngModel initialization without reporting empty DOM as autofill', async () => {
    const fixture = TestBed.createComponent(NgModelInitialValueHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe('Initial consumer value');
    expect(fixture.componentInstance.changes).toEqual([]);
    expect(fixture.nativeElement.querySelector('input').value).toBe('Initial consumer value');
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

  it('keeps the start-icon wrapper state when floatingLabel=false', () => {
    const { f } = mk({
      label: 'Buscar',
      floatingLabel: false,
      icon: 'lucideSearch',
      iconPosition: 'left',
    });

    const wrapper = f.nativeElement.querySelector('.neu-input__wrapper') as HTMLElement;
    expect(wrapper.classList).toContain('neu-input__wrapper--no-float');
    expect(wrapper.classList).toContain('neu-input__wrapper--has-start-icon');
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

  it('should describe the input with the hint id when there is a hint and no error', () => {
    const { f } = mk({ hint: 'Mínimo 8 caracteres', label: 'Test' });
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    const hint = f.nativeElement.querySelector('.neu-input__hint') as HTMLElement;

    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
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
    expect(comp['_value']()).toBe('hello');
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
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    input.value = 'Pedro';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(onChange).toHaveBeenCalledWith('Pedro');
  });

  it('should emit valueChange only after user input', () => {
    const { f, comp } = mk({ label: 'Test' });
    const emitted = vi.fn();
    comp.valueChange.subscribe(emitted);

    comp.writeValue('Programmatic');
    expect(emitted).not.toHaveBeenCalled();

    const el: HTMLInputElement = f.nativeElement.querySelector('input');
    el.value = 'User value';
    el.dispatchEvent(new Event('input'));
    expect(emitted).toHaveBeenCalledWith('User value');
  });

  it('buffers IME CVA propagation while preserving native DOM input events', () => {
    const { f, comp } = mk({ label: 'Name' });
    const cvaValues: string[] = [];
    const domValues: string[] = [];
    comp.registerOnChange((value: string) => cvaValues.push(value));
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    input.addEventListener('input', () => domValues.push(input.value));

    composeText(input, 'に', '日本');

    expect(domValues).toEqual(['に', '日本']);
    expect(cvaValues).toEqual(['日本']);
    expect(comp['_value']()).toBe('日本');
  });

  it('buffers FormControl valueChanges until IME composition commits', async () => {
    @Component({
      template: `<neu-input label="Name" [formControl]="ctrl" />`,
      imports: [NeuInputComponent, ReactiveFormsModule],
    })
    class ImeHost {
      readonly ctrl = new FormControl('');
    }
    const fixture = TestBed.createComponent(ImeHost);
    fixture.detectChanges();
    const values: Array<string | null> = [];
    fixture.componentInstance.ctrl.valueChanges.subscribe((value) => values.push(value));

    composeText(fixture.nativeElement.querySelector('input'), 'に', '日本');

    expect(values).toEqual(['日本']);
    expect(fixture.componentInstance.ctrl.value).toBe('日本');
  });

  it('respects COMPOSITION_BUFFER_MODE=false', () => {
    TestBed.overrideProvider(COMPOSITION_BUFFER_MODE, { useValue: false });
    const { f, comp } = mk();
    const values: string[] = [];
    comp.registerOnChange((value: string) => values.push(value));

    composeText(f.nativeElement.querySelector('input'), 'に', '日本');

    expect(values).toEqual(['に', '日本']);
  });

  it('cancels pending IME propagation on blur, disable, writeValue, and destroy', () => {
    const blurFixture = mk();
    const blurChanges = vi.fn();
    const touched = vi.fn();
    blurFixture.comp.registerOnChange(blurChanges);
    blurFixture.comp.registerOnTouched(touched);
    const blurInput = blurFixture.f.nativeElement.querySelector('input') as HTMLInputElement;
    blurInput.dispatchEvent(new CompositionEvent('compositionstart'));
    blurInput.value = 'draft';
    blurInput.dispatchEvent(new InputEvent('input', { isComposing: true }));
    blurInput.dispatchEvent(new FocusEvent('blur'));
    blurInput.dispatchEvent(new CompositionEvent('compositionend'));
    expect(blurChanges).not.toHaveBeenCalled();
    expect(touched).toHaveBeenCalledTimes(1);

    const disabledFixture = mk();
    const disabledChanges = vi.fn();
    disabledFixture.comp.registerOnChange(disabledChanges);
    const disabledInput = disabledFixture.f.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    disabledInput.dispatchEvent(new CompositionEvent('compositionstart'));
    disabledInput.value = 'draft';
    disabledFixture.comp.setDisabledState(true);
    disabledInput.dispatchEvent(new CompositionEvent('compositionend'));
    expect(disabledChanges).not.toHaveBeenCalled();

    const writeFixture = mk();
    const writeChanges = vi.fn();
    writeFixture.comp.registerOnChange(writeChanges);
    const writeInput = writeFixture.f.nativeElement.querySelector('input') as HTMLInputElement;
    writeInput.dispatchEvent(new CompositionEvent('compositionstart'));
    writeFixture.comp.writeValue('server');
    writeInput.dispatchEvent(new CompositionEvent('compositionend'));
    expect(writeChanges).not.toHaveBeenCalled();
    expect(writeFixture.comp['_value']()).toBe('server');

    const destroyFixture = mk();
    const destroyChanges = vi.fn();
    destroyFixture.comp.registerOnChange(destroyChanges);
    const destroyInput = destroyFixture.f.nativeElement.querySelector('input') as HTMLInputElement;
    destroyInput.dispatchEvent(new CompositionEvent('compositionstart'));
    destroyFixture.f.destroy();
    destroyInput.dispatchEvent(new CompositionEvent('compositionend'));
    expect(destroyChanges).not.toHaveBeenCalled();
  });

  it('onBlur should call onTouched and remove focused state', () => {
    const { f, comp } = mk({ label: 'Test' });
    const onTouched = vi.fn();
    comp.registerOnTouched(onTouched);
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('focus'));
    f.detectChanges();
    expect(comp['_focused']()).toBe(true);
    input.dispatchEvent(new Event('blur'));
    f.detectChanges();
    expect(comp['_focused']()).toBe(false);
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

  it('synchronises a browser-autofilled value with the form control state', () => {
    const { f, comp } = mk({ label: 'Email', floatingLabel: true });
    const onChange = vi.fn();
    comp.registerOnChange(onChange);
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'learner@example.com';

    comp.syncNativeValue();
    f.detectChanges();

    expect(comp.hasValue()).toBe(true);
    expect(onChange).toHaveBeenCalledWith('learner@example.com');
    expect(f.nativeElement.querySelector('.neu-input__wrapper')?.classList).toContain(
      'neu-input__wrapper--has-value',
    );
  });

  it('does not emit duplicate changes when the native value already matches the form', () => {
    const { f, comp } = mk({ label: 'Email' });
    const onChange = vi.fn();
    comp.registerOnChange(onChange);
    comp.writeValue('learner@example.com');
    f.detectChanges();
    comp.syncNativeValue();
    expect(onChange).not.toHaveBeenCalled();
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
    f.componentRef.setInput('icon', 'lucideUser');
    f.componentRef.setInput('iconPosition', 'left');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-input__icon--start')).toBeTruthy();
  });

  it('icon with iconPosition=right renders .neu-input__icon--end', async () => {
    const f = TestBed.createComponent(NeuInputComponent);
    f.componentRef.setInput('icon', 'lucideUser');
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

  it('renders projected start and end icon slots and full native attributes', async () => {
    @Component({
      template: `
        <neu-input
          inputId="account-field"
          name="account"
          label="Account"
          placeholder="Account id"
          autocomplete="username"
          [floatingLabel]="false"
          [startIcon]="true"
          [endIcon]="true"
          [minlength]="2"
          [maxlength]="8"
          min="1"
          max="9"
          pattern="[a-z]+"
        >
          <span neu-input-start class="start-slot">S</span>
          <span neu-input-end class="end-slot">E</span>
        </neu-input>
      `,
      imports: [NeuInputComponent],
    })
    class InputSlotHostComponent {}

    await TestBed.configureTestingModule({ imports: [InputSlotHostComponent] }).compileComponents();
    const f = TestBed.createComponent(InputSlotHostComponent);
    f.detectChanges();
    await f.whenStable();

    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    expect(f.nativeElement.querySelector('.start-slot')?.textContent).toBe('S');
    expect(f.nativeElement.querySelector('.end-slot')?.textContent).toBe('E');
    expect(input.id).toBe('account-field');
    expect(input.name).toBe('account');
    expect(input.autocomplete).toBe('username');
    expect(input.minLength).toBe(2);
    expect(input.maxLength).toBe(8);
    expect(input.getAttribute('min')).toBe('1');
    expect(input.getAttribute('max')).toBe('9');
    expect(input.getAttribute('pattern')).toBe('[a-z]+');
  });

  it('input and blur before CVA registration use the default callbacks safely', async () => {
    const f = TestBed.createComponent(NeuInputComponent);
    f.detectChanges();
    await f.whenStable();

    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'unregistered';

    expect(() => input.dispatchEvent(new Event('input', { bubbles: true }))).not.toThrow();
    expect(() => input.dispatchEvent(new Event('blur'))).not.toThrow();
    expect((f.componentInstance as any)['_value']()).toBe('unregistered');
  });

  it('synchronises autofill through the native animationstart binding', () => {
    const { f, comp } = mk();
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    const changed = vi.fn();
    comp.registerOnChange(changed);
    input.value = 'credential-manager-value';
    const event = new Event('animationstart', { bubbles: true }) as AnimationEvent;
    Object.defineProperty(event, 'animationName', { value: 'neu-autofill-start' });

    input.dispatchEvent(event);

    expect(changed).toHaveBeenCalledWith('credential-manager-value');
    expect(comp._value()).toBe('credential-manager-value');
  });
});
