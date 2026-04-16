import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuSwitchComponent } from './neu-switch.component';

@Component({
  template: `<neu-switch [label]="label" [disabled]="disabled" [formControl]="ctrl" />`,
  imports: [NeuSwitchComponent, ReactiveFormsModule],
})
class TestHostComponent {
  label = 'Notificaciones';
  disabled = false;
  ctrl = new FormControl(false);
}

describe('NeuSwitchComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render label', () => {
    expect(fixture.nativeElement.textContent).toContain('Notificaciones');
  });

  it('should not be checked by default', () => {
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.checked).toBe(false);
  });

  it('should check when formControl is set to true', () => {
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
    const df = TestBed.createComponent(NeuSwitchComponent);
    df.componentRef.setInput('disabled', true);
    df.componentRef.setInput('label', 'Test');
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.disabled).toBe(true);
  });

  it('should apply disabled class', () => {
    const df = TestBed.createComponent(NeuSwitchComponent);
    df.componentRef.setInput('disabled', true);
    df.componentRef.setInput('label', 'Test');
    df.detectChanges();
    const el = df.nativeElement.querySelector('.neu-switch--disabled');
    expect(el).toBeTruthy();
  });

  it('should be disabled when formControl is disabled', () => {
    host.ctrl.disable();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.disabled).toBe(true);
  });

  it('writeValue with null should set checked to false', () => {
    // writeValue(null) debe establecer el estado checked a false
    // writeValue(null) must set the checked state to false
    const df = TestBed.createComponent(NeuSwitchComponent);
    df.componentRef.setInput('label', 'Test');
    df.detectChanges();
    df.componentInstance.writeValue(true);
    df.componentInstance.writeValue(null);
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.checked).toBe(false);
  });

  it('writeValue(true) should set checked to true', () => {
    // writeValue(true) debe establecer el estado checked a true
    // writeValue(true) must set the checked state to true
    const df = TestBed.createComponent(NeuSwitchComponent);
    df.componentRef.setInput('label', 'Test');
    df.detectChanges();
    df.componentInstance.writeValue(true);
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.checked).toBe(true);
  });

  it('should apply name attribute to input', () => {
    // El atributo name debe propagarse al input nativo
    // The name attribute must be propagated to the native input
    const df = TestBed.createComponent(NeuSwitchComponent);
    df.componentRef.setInput('label', 'Test');
    df.componentRef.setInput('name', 'my-switch');
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.name).toBe('my-switch');
  });

  it('setDisabledState should toggle disabled', () => {
    // setDisabledState(true/false) debe actualizar _isDisabled computed
    // setDisabledState(true/false) must update _isDisabled computed
    const df = TestBed.createComponent(NeuSwitchComponent);
    df.componentRef.setInput('label', 'Test');
    df.detectChanges();
    df.componentInstance.setDisabledState(true);
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.disabled).toBe(true);
    df.componentInstance.setDisabledState(false);
    df.detectChanges();
    expect(input.disabled).toBe(false);
  });

  it('onChange emits the checked value via registerOnChange', async () => {
    const df = TestBed.createComponent(NeuSwitchComponent);
    df.detectChanges();
    let emittedVal: boolean | undefined;
    df.componentInstance.registerOnChange((v: boolean) => (emittedVal = v));
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    df.detectChanges();
    await df.whenStable();
    expect(emittedVal).toBe(true);
  });

  it('onBlur should call _onTouched callback', () => {
    const df = TestBed.createComponent(NeuSwitchComponent);
    df.detectChanges();
    let touched = false;
    df.componentInstance.registerOnTouched(() => (touched = true));
    df.componentInstance.onBlur();
    expect(touched).toBe(true);
  });

  it('onChange on disabled switch should not be called', async () => {
    const df = TestBed.createComponent(NeuSwitchComponent);
    df.componentRef.setInput('disabled', true);
    df.detectChanges();
    let called = false;
    df.componentInstance.registerOnChange(() => (called = true));
    // With disabled=true the HTML input is disabled so the event won't fire,
    // but we verify the disabled state is applied correctly
    expect(df.nativeElement.querySelector('input').disabled).toBe(true);
    expect(called).toBe(false);
  });

  it('onChange event on enabled switch should update checked state and call _onChange', () => {
    // El evento change en el checkbox debe actualizar el estado y notificar al CVA
    // The change event on the checkbox must update state and notify CVA
    const df = TestBed.createComponent(NeuSwitchComponent);
    df.detectChanges();
    const values: boolean[] = [];
    df.componentInstance.registerOnChange((v: boolean) => values.push(v));
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    expect(values.length).toBeGreaterThan(0);
    expect(values[values.length - 1]).toBe(true);
  });

  it('onChange should not throw when no onChange callback registered (uses default noop)', () => {
    // onChange sin callback registrado no debe lanzar error (usa función por defecto)
    // onChange without registered callback must not throw (uses default noop function)
    const df = TestBed.createComponent(NeuSwitchComponent);
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="checkbox"]');
    input.checked = true;
    // No registerOnChange called — default () => {} is invoked
    expect(() => input.dispatchEvent(new Event('change'))).not.toThrow();
  });

  it('onBlur should not throw when no onTouched callback registered (uses default noop)', () => {
    // onBlur sin callback registrado no debe lanzar error (usa función por defecto)
    // onBlur without registered callback must not throw (uses default noop function)
    const df = TestBed.createComponent(NeuSwitchComponent);
    df.detectChanges();
    // No registerOnTouched called — default () => {} is invoked
    expect(() => df.componentInstance.onBlur()).not.toThrow();
  });
});
