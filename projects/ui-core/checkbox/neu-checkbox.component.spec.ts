import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuCheckboxComponent } from './neu-checkbox.component';

@Component({
  template: `<neu-checkbox [label]="label" [formControl]="ctrl" />`,
  imports: [NeuCheckboxComponent, ReactiveFormsModule],
})
class TestHostComponent {
  label = 'Acepto los términos';
  ctrl = new FormControl(false);
}

@Component({
  template: `
    <neu-checkbox
      label="Controlled"
      ariaLabel="Controlled checkbox"
      [checked]="checked"
      [indeterminate]="indeterminate"
      (checkedChange)="onCheckedChange($event)"
    />
  `,
  imports: [NeuCheckboxComponent],
})
class ControlledHostComponent {
  checked = false;
  indeterminate = false;
  lastChange: boolean | undefined;

  onCheckedChange(value: boolean): void {
    this.lastChange = value;
    this.checked = value;
  }
}

describe('NeuCheckboxComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render label', () => {
    expect(fixture.nativeElement.textContent).toContain('Acepto los términos');
  });

  it('should be unchecked by default', () => {
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.checked).toBe(false);
  });

  it('should check when formControl value is true', () => {
    host.ctrl.setValue(true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.checked).toBe(true);
  });

  it('should update formControl when clicked', () => {
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]');
    input.click();
    fixture.detectChanges();
    expect(host.ctrl.value).toBe(true);
  });

  it('should be disabled when disabled input is true', () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.componentRef.setInput('disabled', true);
    df.componentRef.setInput('label', 'Test');
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.disabled).toBe(true);
  });

  it('should be disabled when formControl is disabled', () => {
    host.ctrl.disable();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.disabled).toBe(true);
  });

  it('should apply disabled class when disabled', () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.componentRef.setInput('disabled', true);
    df.componentRef.setInput('label', 'Test');
    df.detectChanges();
    const el = df.nativeElement.querySelector('[class*="disabled"]');
    expect(el).toBeTruthy();
  });

  it('emits checkedChange exactly once after a user change', async () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.detectChanges();
    const emitted = vi.fn();
    df.componentInstance.checked.subscribe(emitted);
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    df.detectChanges();
    await df.whenStable();
    expect(emitted).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('onBlur emits the Signal Forms touch boundary', () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.detectChanges();
    const touched = vi.fn();
    df.componentInstance.touch.subscribe(touched);
    df.componentInstance.onBlur();
    expect(touched).toHaveBeenCalledOnce();
  });

  it('disabled input should disable the native input element', async () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.componentRef.setInput('disabled', true);
    df.detectChanges();
    await df.whenStable();
    const inputEl: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    expect(df.nativeElement.querySelector('.neu-checkbox--disabled')).toBeTruthy();
    expect(inputEl.disabled).toBe(true);
  });

  it('onChange should not throw when there are no output subscribers', () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    input.checked = true;
    expect(() => input.dispatchEvent(new Event('change'))).not.toThrow();
  });

  it('onBlur should not throw when there are no touch subscribers', () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.detectChanges();
    expect(() => df.componentInstance.onBlur()).not.toThrow();
  });

  it('an external checked write should update without an output echo', () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.detectChanges();
    const changed = vi.fn();
    df.componentInstance.checked.subscribe(changed);
    df.componentRef.setInput('checked', true);
    df.detectChanges();
    expect((df.nativeElement.querySelector('input') as HTMLInputElement).checked).toBe(true);
    df.componentRef.setInput('checked', false);
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.checked).toBe(false);
    expect(changed).not.toHaveBeenCalled();
  });

  it('should support controlled checked input and checkedChange output', () => {
    const df = TestBed.createComponent(ControlledHostComponent);
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');

    expect(input.checked).toBe(false);

    input.click();
    df.detectChanges();

    expect(df.componentInstance.lastChange).toBe(true);
    expect(input.checked).toBe(true);
  });

  it('should expose indeterminate state and mixed aria state', () => {
    const df = TestBed.createComponent(ControlledHostComponent);
    df.componentInstance.indeterminate = true;
    df.detectChanges();

    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.indeterminate).toBe(true);
    expect(input.getAttribute('aria-checked')).toBe('mixed');
    expect(df.nativeElement.querySelector('.neu-checkbox__box--mixed')).toBeTruthy();
  });

  it('should pass ariaLabel to the native input', () => {
    const df = TestBed.createComponent(ControlledHostComponent);
    df.detectChanges();

    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.getAttribute('aria-label')).toBe('Controlled checkbox');
  });

  it('native blur event emits touch through the template listener', () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.detectChanges();
    const touched = vi.fn();
    df.componentInstance.touch.subscribe(touched);

    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    input.dispatchEvent(new Event('blur'));

    expect(touched).toHaveBeenCalledOnce();
  });

  it('readonly remains focusable and blocks mutation', () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.componentRef.setInput('readonly', true);
    df.detectChanges();
    const changed = vi.fn();
    df.componentInstance.checked.subscribe(changed);
    const input = df.nativeElement.querySelector('input') as HTMLInputElement;

    input.focus();
    expect(document.activeElement).toBe(input);
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(df.componentInstance.checked()).toBe(false);
    expect(input.checked).toBe(false);
    expect(changed).not.toHaveBeenCalled();
    expect(input.getAttribute('aria-readonly')).toBe('true');
  });

  it('required, invalid and pending states reach the semantic checkbox', () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.componentRef.setInput('required', true);
    df.componentRef.setInput('invalid', true);
    df.componentRef.setInput('pending', true);
    df.detectChanges();
    const input = df.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.type).toBe('checkbox');
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-busy')).toBe('true');
  });

  it('focus targets the native checkbox and reset emits no fictitious change', () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.detectChanges();
    const changed = vi.fn();
    df.componentInstance.checked.subscribe(changed);
    const input = df.nativeElement.querySelector('input') as HTMLInputElement;

    df.componentInstance.focus({ preventScroll: true });
    expect(document.activeElement).toBe(input);
    df.componentInstance.reset();
    expect(changed).not.toHaveBeenCalled();
  });
});
