import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NEU_RADIO_GROUP, NeuRadioGroupComponent } from './neu-radio-group.component';

describe('NeuRadioGroupComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should create the component', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    expect(f.componentInstance).toBeTruthy();
  });

  it('direction input defaults to "column"', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    expect(f.componentInstance.direction()).toBe('column');
  });

  it('direction input accepts "row"', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.componentRef.setInput('direction', 'row');
    f.detectChanges();
    expect(f.componentInstance.direction()).toBe('row');
  });

  it('host element should have role="radiogroup"', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    expect(f.nativeElement.getAttribute('role')).toBe('radiogroup');
  });

  it('should set aria-label from ariaLabel input', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.componentRef.setInput('ariaLabel', 'Opciones de pago');
    f.detectChanges();
    expect(f.nativeElement.getAttribute('aria-label')).toBe('Opciones de pago');
  });

  it('should NOT set aria-label attribute when ariaLabel is empty string', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    expect(f.nativeElement.getAttribute('aria-label')).toBeNull();
  });

  it('writeValue() should update _value signal', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    f.componentInstance.writeValue('option-b');
    expect(f.componentInstance._value()).toBe('option-b');
  });

  it('writeValue(null) should set _value to null', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    f.componentInstance.writeValue(null);
    expect(f.componentInstance._value()).toBeNull();
  });

  it('writeValue(undefined) should set _value to null', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    f.componentInstance.writeValue(undefined as unknown as null);
    expect(f.componentInstance._value()).toBeNull();
  });

  it('select() should update _value signal', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    f.componentInstance.select('option-a');
    expect(f.componentInstance._value()).toBe('option-a');
  });

  it('select() should call onChange callback', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    const changes: unknown[] = [];
    f.componentInstance.registerOnChange((v) => changes.push(v));
    f.componentInstance.select('option-a');
    expect(changes).toEqual(['option-a']);
  });

  it('select() should call onTouched callback', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    let touched = false;
    f.componentInstance.registerOnTouched(() => {
      touched = true;
    });
    f.componentInstance.select('option-x');
    expect(touched).toBe(true);
  });

  it('setDisabledState(true) should set _isDisabled to true', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    f.componentInstance.setDisabledState(true);
    expect(f.componentInstance._isDisabled()).toBe(true);
  });

  it('setDisabledState(true) should set aria-disabled="true" on host', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    f.componentInstance.setDisabledState(true);
    f.detectChanges();
    expect(f.nativeElement.getAttribute('aria-disabled')).toBe('true');
  });

  it('setDisabledState(false) should set _isDisabled to false', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    f.componentInstance.setDisabledState(true);
    f.componentInstance.setDisabledState(false);
    expect(f.componentInstance._isDisabled()).toBe(false);
  });

  it('should provide NEU_RADIO_GROUP token with itself', () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    const token = f.debugElement.injector.get(NEU_RADIO_GROUP);
    expect(token).toBe(f.componentInstance);
  });

  it('should work with ReactiveFormsModule FormControl', async () => {
    @Component({
      template: `<neu-radio-group [formControl]="ctrl" />`,
      imports: [NeuRadioGroupComponent, ReactiveFormsModule],
    })
    class HostComponent {
      ctrl = new FormControl('a');
    }

    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    await f.whenStable();
    const group = f.debugElement.children[0].injector.get(NeuRadioGroupComponent);
    expect(group._value()).toBe('a');
  });

  it('ReactiveFormsModule: programmatic setValue should update _value', async () => {
    @Component({
      template: `<neu-radio-group [formControl]="ctrl" />`,
      imports: [NeuRadioGroupComponent, ReactiveFormsModule],
    })
    class HostComponent {
      ctrl = new FormControl('a');
    }

    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    await f.whenStable();
    const group = f.debugElement.children[0].injector.get(NeuRadioGroupComponent);
    f.componentInstance.ctrl.setValue('b');
    expect(group._value()).toBe('b');
  });
});
