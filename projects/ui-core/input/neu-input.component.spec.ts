import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NeuInputComponent } from './neu-input.component';
import { provideNeuralIcons } from '@neural-icons/angular';
import { iconCircleAlert } from '@neural-icons/core/icons/circle-alert';
import { iconSearch } from '@neural-icons/core/icons/search';
import { iconUser } from '@neural-icons/core/icons/user';

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
      providers: [provideNeuralIcons(iconCircleAlert, iconSearch, iconUser)],
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
      icon: 'search',
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

  // ── Signal control contract ───────────────────────────────────────────────

  it('an external value input updates the public model without output echo', () => {
    const { f, comp } = mk({ label: 'Test' });
    const changed = vi.fn();
    comp.value.subscribe(changed);
    f.componentRef.setInput('value', 'hello');
    f.detectChanges();
    expect(comp.value()).toBe('hello');
    expect(changed).not.toHaveBeenCalled();
  });

  it('should update value and emit exactly once when typing', () => {
    const { f, comp } = mk({ label: 'Test' });
    const changed = vi.fn();
    comp.value.subscribe(changed);
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    input.value = 'Pedro';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(comp.value()).toBe('Pedro');
    expect(changed).toHaveBeenCalledExactlyOnceWith('Pedro');
  });

  it('buffers IME model propagation while preserving native DOM input events', () => {
    const { f, comp } = mk({ label: 'Name' });
    const modelValues: string[] = [];
    const domValues: string[] = [];
    comp.value.subscribe((value: string) => modelValues.push(value));
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    input.addEventListener('input', () => domValues.push(input.value));

    composeText(input, 'に', '日本');

    expect(domValues).toEqual(['に', '日本']);
    expect(modelValues).toEqual(['日本']);
    expect(comp.value()).toBe('日本');
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

  it('cancels or supersedes pending IME propagation on blur, disable, external write, and destroy', () => {
    const blurFixture = mk();
    const blurChanges = vi.fn();
    const touched = vi.fn();
    blurFixture.comp.value.subscribe(blurChanges);
    blurFixture.comp.touch.subscribe(touched);
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
    disabledFixture.comp.value.subscribe(disabledChanges);
    const disabledInput = disabledFixture.f.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    disabledInput.dispatchEvent(new CompositionEvent('compositionstart'));
    disabledInput.value = 'draft';
    disabledFixture.f.componentRef.setInput('disabled', true);
    disabledFixture.f.detectChanges();
    disabledInput.dispatchEvent(new CompositionEvent('compositionend'));
    expect(disabledChanges).not.toHaveBeenCalled();

    const writeFixture = mk();
    const writeChanges = vi.fn();
    writeFixture.comp.value.subscribe(writeChanges);
    const writeInput = writeFixture.f.nativeElement.querySelector('input') as HTMLInputElement;
    writeInput.dispatchEvent(new CompositionEvent('compositionstart'));
    writeFixture.f.componentRef.setInput('value', 'server');
    writeFixture.f.detectChanges();
    writeInput.dispatchEvent(new CompositionEvent('compositionend'));
    expect(writeChanges).not.toHaveBeenCalled();
    expect(writeFixture.comp.value()).toBe('server');

    const destroyFixture = mk();
    const destroyChanges = vi.fn();
    destroyFixture.comp.value.subscribe(destroyChanges);
    const destroyInput = destroyFixture.f.nativeElement.querySelector('input') as HTMLInputElement;
    destroyInput.dispatchEvent(new CompositionEvent('compositionstart'));
    destroyFixture.f.destroy();
    destroyInput.dispatchEvent(new CompositionEvent('compositionend'));
    expect(destroyChanges).not.toHaveBeenCalled();
  });

  it('onBlur should emit touch and remove focused state', () => {
    const { f, comp } = mk({ label: 'Test' });
    const onTouched = vi.fn();
    comp.touch.subscribe(onTouched);
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('focus'));
    f.detectChanges();
    expect(comp['_focused']()).toBe(true);
    input.dispatchEvent(new Event('blur'));
    f.detectChanges();
    expect(comp['_focused']()).toBe(false);
    expect(onTouched).toHaveBeenCalled();
  });

  it('disabled input should disable native element', () => {
    const { f } = mk({ disabled: true, label: 'Test' });
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    expect(input.disabled).toBe(true);
  });

  // ── Computed state ────────────────────────────────────────────────────────

  it('hasValue computed should be true when value is non-empty', () => {
    const { f, comp } = mk({ label: 'Test' });
    f.componentRef.setInput('value', 'x');
    f.detectChanges();
    expect(comp.hasValue()).toBe(true);
  });

  it('hasValue computed should be false for empty string', () => {
    const { comp } = mk({ label: 'Test' });
    expect(comp.hasValue()).toBe(false);
  });

  it('synchronises a browser-autofilled value with the form control state', () => {
    const { f, comp } = mk({ label: 'Email', floatingLabel: true });
    const changed = vi.fn();
    comp.value.subscribe(changed);
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'learner@example.com';

    comp.syncNativeValue();
    f.detectChanges();

    expect(comp.hasValue()).toBe(true);
    expect(changed).toHaveBeenCalledExactlyOnceWith('learner@example.com');
    expect(f.nativeElement.querySelector('.neu-input__wrapper')?.classList).toContain(
      'neu-input__wrapper--has-value',
    );
  });

  it('does not emit duplicate changes when the native value already matches the form', () => {
    const { f, comp } = mk({ label: 'Email' });
    const changed = vi.fn();
    comp.value.subscribe(changed);
    f.componentRef.setInput('value', 'learner@example.com');
    f.detectChanges();
    comp.syncNativeValue();
    expect(changed).not.toHaveBeenCalled();
  });

  it('hasError computed should be true when errorMessage is set', () => {
    const { comp } = mk({ errorMessage: 'Error', label: 'Test' });
    expect(comp.hasError()).toBe(true);
  });

  // ── Icon ──────────────────────────────────────────────────────────────────

  it('should render icon on the left when icon + iconPosition=left', () => {
    const { f } = mk({ label: 'Test', icon: 'search', iconPosition: 'left' });
    expect(f.nativeElement.querySelector('.neu-input__icon--start')).toBeTruthy();
  });

  it('should render icon on the right when iconPosition=right', () => {
    const { f } = mk({ label: 'Test', icon: 'search', iconPosition: 'right' });
    expect(f.nativeElement.querySelector('.neu-input__icon--end')).toBeTruthy();
  });

  // ── Attributes ────────────────────────────────────────────────────────────

  it('should set readonly attribute', () => {
    const { f } = mk({ label: 'Test', readonly: true });
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    expect(input.readOnly).toBe(true);
  });

  it('readonly remains focusable and selectable while blocking edits', () => {
    const { f, comp } = mk({ readonly: true, value: 'select me', label: 'Test' });
    const changed = vi.fn();
    comp.value.subscribe(changed);
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    input.setSelectionRange(0, 6);
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    input.value = 'mutated';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    f.detectChanges();

    expect(comp.value()).toBe('select me');
    expect(changed).not.toHaveBeenCalled();
  });

  it('should set maxlength attribute', () => {
    const { f } = mk({ label: 'Test', maxLength: 20 });
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

  it('onBlur should emit touch', () => {
    const f = TestBed.createComponent(NeuInputComponent);
    f.detectChanges();
    const touched = vi.fn();
    f.componentInstance.touch.subscribe(touched);
    f.componentInstance.onBlur();
    expect(touched).toHaveBeenCalledOnce();
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

  it('a string value input should update the model signal', () => {
    const f = TestBed.createComponent(NeuInputComponent);
    f.detectChanges();
    f.componentRef.setInput('value', 'hello');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('hello');
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
          [minLength]="2"
          [maxLength]="8"
          min="1"
          max="9"
          [pattern]="patterns"
        >
          <span neu-input-start class="start-slot">S</span>
          <span neu-input-end class="end-slot">E</span>
        </neu-input>
      `,
      imports: [NeuInputComponent],
    })
    class InputSlotHostComponent {
      readonly patterns = [/[a-z]+/];
    }

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

  it('input and blur without output subscribers are safe', async () => {
    const f = TestBed.createComponent(NeuInputComponent);
    f.detectChanges();
    await f.whenStable();

    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'unregistered';

    expect(() => input.dispatchEvent(new Event('input', { bubbles: true }))).not.toThrow();
    expect(() => input.dispatchEvent(new Event('blur'))).not.toThrow();
    expect(f.componentInstance.value()).toBe('unregistered');
  });

  it('synchronises autofill through the native animationstart binding', () => {
    const { f, comp } = mk();
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    const changed = vi.fn();
    comp.value.subscribe(changed);
    input.value = 'credential-manager-value';
    const event = new Event('animationstart', { bubbles: true }) as AnimationEvent;
    Object.defineProperty(event, 'animationName', { value: 'neu-autofill-start' });

    input.dispatchEvent(event);

    expect(changed).toHaveBeenCalledExactlyOnceWith('credential-manager-value');
    expect(comp.value()).toBe('credential-manager-value');
  });

  it('focus targets the native input and reset clears only ephemeral UI state', () => {
    const { f, comp } = mk({ value: 'kept' });
    const changed = vi.fn();
    comp.value.subscribe(changed);
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new Event('focus'));
    input.dispatchEvent(new CompositionEvent('compositionstart'));

    comp.focus({ preventScroll: true });
    expect(document.activeElement).toBe(input);
    comp.reset();

    expect(comp.value()).toBe('kept');
    expect(comp['_focused']()).toBe(false);
    expect(comp['_compositionDraft']()).toBeNull();
    expect(changed).not.toHaveBeenCalled();
  });

  it('ignores unrelated animation events and blocked autofill synchronisation', () => {
    const { f, comp } = mk({ value: 'kept', readonly: true });
    const changed = vi.fn();
    comp.value.subscribe(changed);
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'ignored';

    const event = new Event('animationstart') as AnimationEvent;
    Object.defineProperty(event, 'animationName', { value: 'other-animation' });
    comp.onAnimationStart(event);
    comp.syncNativeValue();

    expect(comp.value()).toBe('kept');
    expect(changed).not.toHaveBeenCalled();
  });
});
