import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { NeuInputMaskComponent } from './neu-input-mask.component';

describe('NeuInputMaskComponent', () => {
  let fixture: ComponentFixture<NeuInputMaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuInputMaskComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuInputMaskComponent);
    fixture.componentRef.setInput('mask', '(999) 999');
    fixture.detectChanges();
  });

  it('applies numeric masks and skips invalid characters', () => {
    const component = fixture.componentInstance;
    component.onInput('123456');
    expect(component.value()).toBe('(123) 456');
    component.onInput('1a2-3');
    expect(component.value()).toBe('(12) 3');
  });

  it('supports alphabetic, alphanumeric and unmasked input', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('mask', 'AA-**');
    fixture.detectChanges();
    component.onInput('a1B#2');
    expect(component.value()).toBe('a-B2');

    fixture.componentRef.setInput('mask', '');
    fixture.detectChanges();
    component.onInput('raw value');
    expect(component.value()).toBe('raw value');
  });

  it('implements CVA change, touched, null and disabled behavior', () => {
    const component = fixture.componentInstance;
    const changes: string[] = [];
    let touched = 0;
    component.registerOnChange((value) => changes.push(value));
    component.registerOnTouched(() => touched++);
    component.writeValue(null);
    expect(component.value()).toBe('');
    component.onInput('123');
    expect(changes).toEqual(['(123']);
    component.onTouched();
    expect(touched).toBe(1);

    component.setDisabledState(true);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).disabled).toBe(true);
    component.setDisabledState(false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).disabled).toBe(true);
  });

  it('keeps default CVA callbacks safe before registration', () => {
    const component = fixture.componentInstance;

    expect(() => component.onInput('123')).not.toThrow();
    expect(() => component.onTouched()).not.toThrow();
    expect(component.value()).toBe('(123');
  });

  it('renders metadata and propagates input, blur and valueChange from the template', () => {
    const component = fixture.componentInstance;
    const changed = vi.spyOn(component.valueChange, 'emit');
    fixture.componentRef.setInput('label', 'Phone');
    fixture.componentRef.setInput('placeholder', '000000');
    fixture.componentRef.setInput('hint', 'Digits only');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(fixture.nativeElement.querySelector('label')?.textContent).toContain('Phone');
    expect(input.placeholder).toBe('000000');
    expect(fixture.nativeElement.querySelector('.neu-input-mask__hint')?.textContent).toContain('Digits only');

    input.value = '123456';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    expect(component.value()).toBe('(123) 456');
    expect(changed).toHaveBeenCalledWith('(123) 456');
  });

  it('resolves the CVA provider through Reactive Forms', async () => {
    @Component({
      imports: [NeuInputMaskComponent, ReactiveFormsModule],
      template: `<neu-input-mask mask="999" [formControl]="control" />`,
    })
    class HostComponent {
      readonly control = new FormControl('12');
    }

    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [HostComponent] })
      .compileComponents();
    const host = TestBed.createComponent(HostComponent);
    host.detectChanges();

    const input = host.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('12');
    input.value = '345';
    input.dispatchEvent(new Event('input'));
    host.detectChanges();

    expect(host.componentInstance.control.value).toBe('345');
  });
});
