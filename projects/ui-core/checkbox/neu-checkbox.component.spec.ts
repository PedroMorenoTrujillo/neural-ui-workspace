import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuCheckboxComponent } from './neu-checkbox.component';

@Component({
  template: `<neu-checkbox [label]="label" [disabled]="disabled" [formControl]="ctrl" />`,
  imports: [NeuCheckboxComponent, ReactiveFormsModule],
})
class TestHostComponent {
  label = 'Acepto los términos';
  disabled = false;
  ctrl = new FormControl(false);
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

  it('onChange fires registerOnChange callback', async () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.detectChanges();
    let emitted: boolean | undefined;
    df.componentInstance.registerOnChange((v: boolean) => (emitted = v));
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    df.detectChanges();
    await df.whenStable();
    expect(emitted).toBe(true);
  });

  it('onBlur should call _onTouched callback', () => {
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.detectChanges();
    let touched = false;
    df.componentInstance.registerOnTouched(() => (touched = true));
    df.componentInstance.onBlur();
    expect(touched).toBe(true);
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

  it('onChange should not throw when no onChange callback registered (uses default noop)', () => {
    // onChange sin callback registrado no debe lanzar error (usa función por defecto)
    // onChange without registered callback must not throw (uses default noop function)
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    input.checked = true;
    // No registerOnChange called — default () => {} is invoked
    expect(() => input.dispatchEvent(new Event('change'))).not.toThrow();
  });

  it('onBlur should not throw when no onTouched callback registered (uses default noop)', () => {
    // onBlur sin callback registrado no debe lanzar error (usa función por defecto)
    // onBlur without registered callback must not throw (uses default noop function)
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.detectChanges();
    // No registerOnTouched called — default () => {} is invoked
    expect(() => df.componentInstance.onBlur()).not.toThrow();
  });

  it('writeValue(false) should uncheck the input', () => {
    // writeValue(false) debe desmarcar el input
    // writeValue(false) must uncheck the input
    const df = TestBed.createComponent(NeuCheckboxComponent);
    df.detectChanges();
    df.componentInstance.writeValue(true);
    df.detectChanges();
    df.componentInstance.writeValue(false);
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.checked).toBe(false);
  });
});
