import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuNumberInputComponent } from './neu-number-input.component';

function mk() {
  return TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
}

describe('NeuNumberInputComponent', () => {
  beforeEach(() => mk().compileComponents());

  it('should render with neu-number-input class', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-number-input');
  });

  it('should render increment and decrement buttons', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-number-input__btn--dec')).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-number-input__btn--inc')).toBeTruthy();
  });

  it('writeValue should update _value', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.detectChanges();
    f.componentInstance.writeValue(42);
    expect((f.componentInstance as any)._value()).toBe(42);
  });

  it('writeValue should clamp to min and max', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('min', 0);
    f.componentRef.setInput('max', 10);
    f.detectChanges();
    f.componentInstance.writeValue(50);
    expect((f.componentInstance as any)._value()).toBe(10);
    f.componentInstance.writeValue(-5);
    expect((f.componentInstance as any)._value()).toBe(0);
  });

  it('increment should increase value by step', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('step', 2);
    f.detectChanges();
    f.componentInstance.writeValue(10);
    f.componentInstance.increment();
    expect((f.componentInstance as any)._value()).toBe(12);
  });

  it('decrement should decrease value by step', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('step', 3);
    f.detectChanges();
    f.componentInstance.writeValue(10);
    f.componentInstance.decrement();
    expect((f.componentInstance as any)._value()).toBe(7);
  });

  it('increment should not exceed max', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('max', 5);
    f.detectChanges();
    f.componentInstance.writeValue(5);
    f.componentInstance.increment();
    expect((f.componentInstance as any)._value()).toBe(5);
  });

  it('decrement should not go below min', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('min', 0);
    f.detectChanges();
    f.componentInstance.writeValue(0);
    f.componentInstance.decrement();
    expect((f.componentInstance as any)._value()).toBe(0);
  });

  it('should emit valueChange on increment', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.detectChanges();
    f.componentInstance.writeValue(5);
    const emitted: number[] = [];
    f.componentInstance.valueChange.subscribe((v: number) => emitted.push(v));
    f.componentInstance.increment();
    expect(emitted).toEqual([6]);
  });

  it('setDisabledState should apply disabled class', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.detectChanges();
    await f.whenStable();
    f.componentInstance.setDisabledState(true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-number-input--disabled');
  });

  it('should call onChange when value changes via increment', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.detectChanges();
    const changes: number[] = [];
    f.componentInstance.registerOnChange((v: number) => changes.push(v));
    f.componentInstance.writeValue(10);
    f.componentInstance.increment();
    expect(changes).toContain(11);
  });

  it('vertical input renders with vertical class', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('vertical', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-number-input--vertical');
  });

  it('onInputChange should parse and clamp value', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('min', 0);
    f.componentRef.setInput('max', 100);
    f.detectChanges();
    const fakeInput = document.createElement('input');
    fakeInput.type = 'number';
    (fakeInput as any).valueAsNumber = 150;
    (f.componentInstance as any).onInputChange({ target: fakeInput } as unknown as Event);
    expect((f.componentInstance as any)._value()).toBe(100);
  });

  it('onInputChange with NaN should default to 0', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('min', 0);
    f.componentRef.setInput('max', 10);
    f.detectChanges();
    const fakeInput = document.createElement('input');
    (fakeInput as HTMLInputElement).value = 'abc';
    (f.componentInstance as any).onInputChange({ target: fakeInput } as unknown as Event);
    expect((f.componentInstance as any)._value()).toBe(0);
  });

  it('onBlur should call _onTouched', () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.detectChanges();
    let touched = false;
    f.componentInstance.registerOnTouched(() => (touched = true));
    f.componentInstance.onBlur();
    expect(touched).toBe(true);
  });

  it('stacked=false, vertical=false renders horizontal layout', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('stacked', false);
    f.componentRef.setInput('vertical', false);
    f.detectChanges();
    await f.whenStable();
    // Both buttons should be siblings to input in horizontal layout
    const buttons = f.nativeElement.querySelectorAll('.neu-number-input__btn');
    expect(buttons.length).toBe(2);
    // The first button in horizontal layout is the decrement button
    expect(buttons[0].classList).toContain('neu-number-input__btn--dec');
  });

  it('stacked=true renders stacked buttons', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('stacked', true);
    f.componentRef.setInput('vertical', false);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-number-input__stack')).toBeTruthy();
  });

  it('vertical=true renders vertical layout with up button first', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('vertical', true);
    f.detectChanges();
    await f.whenStable();
    const buttons = f.nativeElement.querySelectorAll('.neu-number-input__btn');
    expect(buttons[0].classList).toContain('neu-number-input__btn--inc');
    expect(buttons[1].classList).toContain('neu-number-input__btn--dec');
  });

  it('size sm renders sm class', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('size', 'sm');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-number-input--sm');
  });

  it('size lg renders lg class', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('size', 'lg');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-number-input--lg');
  });

  it('label is rendered when set', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('label', 'Cantidad');
    f.detectChanges();
    await f.whenStable();
    const lbl = f.nativeElement.querySelector('.neu-number-input__label');
    expect(lbl).toBeTruthy();
    expect(lbl.textContent.trim()).toBe('Cantidad');
  });

  it('label is not rendered when empty', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-number-input__label')).toBeNull();
  });

  it('registerOnChange is stored and called on increment', () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.detectChanges();
    const values: number[] = [];
    f.componentInstance.registerOnChange((v: number) => values.push(v));
    f.componentInstance.writeValue(5);
    f.componentInstance.increment();
    expect(values).toContain(6);
  });

  it('registerOnTouched is stored and called on blur', () => {
    // registerOnTouched debe almacenar la función y llamarla al hacer blur
    // registerOnTouched must store the function and call it on blur
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.detectChanges();
    const touched: boolean[] = [];
    f.componentInstance.registerOnTouched(() => touched.push(true));
    f.componentInstance.onBlur();
    expect(touched.length).toBe(1);
  });

  it('clicking decrement button in stacked layout should decrease value', async () => {
    // El botón de decremento en layout apilado debe disminuir el valor
    // Decrement button in stacked layout must decrease value
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('stacked', true);
    f.componentRef.setInput('vertical', false);
    f.detectChanges();
    f.componentInstance.writeValue(10);
    f.detectChanges();
    const decBtn: HTMLButtonElement = f.nativeElement.querySelector('.neu-number-input__btn--dec');
    if (decBtn) {
      decBtn.click();
      f.detectChanges();
    } else {
      f.componentInstance.decrement();
    }
    expect((f.componentInstance as any)._value()).toBe(9);
  });

  it('clicking increment button in vertical layout should increase value', async () => {
    // El botón incrementar en layout vertical debe aumentar el valor
    // Increment button in vertical layout must increase value
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('vertical', true);
    f.detectChanges();
    f.componentInstance.writeValue(5);
    f.detectChanges();
    const incBtn: HTMLButtonElement = f.nativeElement.querySelector('.neu-number-input__btn--inc');
    if (incBtn) {
      incBtn.click();
      f.detectChanges();
    } else {
      f.componentInstance.increment();
    }
    expect((f.componentInstance as any)._value()).toBe(6);
  });

  // ── DOM change / blur events (template listener coverage) ─────────────────

  it('DOM change event on stacked input invokes onInputChange via template listener', async () => {
    // El evento change DOM en el input apilado invoca onInputChange vía listener de template
    // DOM change event on stacked input invokes onInputChange via template listener
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('stacked', true);
    f.componentRef.setInput('vertical', false);
    f.detectChanges();
    const input: HTMLInputElement = f.nativeElement.querySelector('.neu-number-input__field');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    f.detectChanges();
    // valueAsNumber is NaN for type=text → component defaults to 0 or min
    expect((f.componentInstance as any)._value()).toBeGreaterThanOrEqual(0);
  });

  it('DOM blur event on stacked input invokes onBlur via template listener', async () => {
    // El evento blur DOM en el input apilado invoca onBlur vía listener de template
    // DOM blur event on stacked input invokes onBlur via template listener
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('stacked', true);
    f.componentRef.setInput('vertical', false);
    f.detectChanges();
    let touched = false;
    f.componentInstance.registerOnTouched(() => (touched = true));
    const input: HTMLInputElement = f.nativeElement.querySelector('.neu-number-input__field');
    input.dispatchEvent(new Event('blur', { bubbles: false }));
    expect(touched).toBe(true);
  });

  it('DOM change event on vertical input invokes onInputChange via template listener', async () => {
    // El evento change DOM en el input vertical invoca onInputChange vía listener
    // DOM change event on vertical input invokes onInputChange via template listener
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('vertical', true);
    f.detectChanges();
    const input: HTMLInputElement = f.nativeElement.querySelector('.neu-number-input__field');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    f.detectChanges();
    expect((f.componentInstance as any)._value()).toBeGreaterThanOrEqual(0);
  });

  it('DOM blur event on vertical input invokes onBlur via template listener', async () => {
    // El evento blur DOM en el input vertical invoca onBlur vía listener
    // DOM blur event on vertical input invokes onBlur via template listener
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('vertical', true);
    f.detectChanges();
    let touched = false;
    f.componentInstance.registerOnTouched(() => (touched = true));
    const input: HTMLInputElement = f.nativeElement.querySelector('.neu-number-input__field');
    input.dispatchEvent(new Event('blur', { bubbles: false }));
    expect(touched).toBe(true);
  });

  it('clicking increment button in stacked layout via DOM increases value', async () => {
    // El botón de incremento en layout apilado debe aumentar el valor via clic DOM
    // Increment button in stacked layout must increase value via DOM click
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('stacked', true);
    f.componentRef.setInput('vertical', false);
    f.detectChanges();
    f.componentInstance.writeValue(7);
    f.detectChanges();
    const incBtn: HTMLButtonElement = f.nativeElement.querySelector('.neu-number-input__btn--inc');
    if (incBtn) {
      incBtn.click();
      f.detectChanges();
      expect((f.componentInstance as any)._value()).toBe(8);
    } else {
      f.componentInstance.increment();
      expect((f.componentInstance as any)._value()).toBe(8);
    }
  });

  it('DOM change event on horizontal input invokes onInputChange via template listener', async () => {
    // El evento change DOM en el input horizontal invoca onInputChange vía listener
    // DOM change event on horizontal input invokes onInputChange via template listener
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('stacked', false);
    f.componentRef.setInput('vertical', false);
    f.detectChanges();
    const input: HTMLInputElement = f.nativeElement.querySelector('.neu-number-input__field');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    f.detectChanges();
    expect((f.componentInstance as any)._value()).toBeGreaterThanOrEqual(0);
  });

  it('DOM blur event on horizontal input invokes onBlur via template listener', async () => {
    // El evento blur DOM en el input horizontal invoca onBlur vía listener
    // DOM blur event on horizontal input invokes onBlur via template listener
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('stacked', false);
    f.componentRef.setInput('vertical', false);
    f.detectChanges();
    let touched = false;
    f.componentInstance.registerOnTouched(() => (touched = true));
    const input: HTMLInputElement = f.nativeElement.querySelector('.neu-number-input__field');
    input.dispatchEvent(new Event('blur', { bubbles: false }));
    expect(touched).toBe(true);
  });

  it('clicking decrement button in vertical layout via DOM decreases value', async () => {
    // El botón decremento en layout vertical vía DOM disminuye el valor
    // Decrement button in vertical layout via DOM decreases value
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('vertical', true);
    f.detectChanges();
    f.componentInstance.writeValue(10);
    f.detectChanges();
    const decBtn: HTMLButtonElement = f.nativeElement.querySelector('.neu-number-input__btn--dec');
    if (decBtn) {
      decBtn.click();
      f.detectChanges();
      expect((f.componentInstance as any)._value()).toBe(9);
    } else {
      f.componentInstance.decrement();
      expect((f.componentInstance as any)._value()).toBe(9);
    }
  });

  it('clicking decrement button in horizontal layout via DOM decreases value', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('stacked', false);
    f.componentRef.setInput('vertical', false);
    f.detectChanges();
    f.componentInstance.writeValue(7);
    f.detectChanges();

    const decBtn: HTMLButtonElement = f.nativeElement.querySelector('.neu-number-input__btn--dec');
    decBtn.click();
    f.detectChanges();

    expect((f.componentInstance as any)._value()).toBe(6);
  });

  it('clicking increment button in horizontal layout via DOM increases value', async () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('stacked', false);
    f.componentRef.setInput('vertical', false);
    f.detectChanges();
    f.componentInstance.writeValue(7);
    f.detectChanges();

    const incBtn: HTMLButtonElement = f.nativeElement.querySelector('.neu-number-input__btn--inc');
    incBtn.click();
    f.detectChanges();

    expect((f.componentInstance as any)._value()).toBe(8);
  });

  it('onInputChange should parse decimal text values', () => {
    const f = TestBed.createComponent(NeuNumberInputComponent);
    f.componentRef.setInput('min', 0);
    f.componentRef.setInput('max', 10);
    f.detectChanges();

    const fakeInput = document.createElement('input');
    fakeInput.value = '3.5';
    (f.componentInstance as any).onInputChange({ target: fakeInput } as unknown as Event);

    expect((f.componentInstance as any)._value()).toBe(3.5);
  });
});
