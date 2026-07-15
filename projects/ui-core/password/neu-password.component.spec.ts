import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { NeuPasswordComponent } from './neu-password.component';

describe('NeuPasswordComponent', () => {
  let fixture: ComponentFixture<NeuPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuPasswordComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuPasswordComponent);
    fixture.detectChanges();
  });

  it('computes every strength contribution', () => {
    const component = fixture.componentInstance;
    component.onTouched();
    component.setValue('short');
    expect(component.strength()).toBe(0);
    component.setValue('longvalue');
    expect(component.strength()).toBe(1);
    component.setValue('Longvalue');
    expect(component.strength()).toBe(2);
    component.setValue('Longvalue1');
    expect(component.strength()).toBe(3);
    component.setValue('Longvalue1!');
    expect(component.strength()).toBe(4);
  });

  it('implements CVA change, touched, null and disabled behavior', () => {
    const component = fixture.componentInstance;
    const changes: string[] = [];
    let touched = 0;
    component.registerOnChange((value) => changes.push(value));
    component.registerOnTouched(() => touched++);
    component.writeValue(null);
    expect(component.value()).toBe('');
    component.setValue('Secret1!');
    expect(changes).toEqual(['Secret1!']);
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

  it('renders an accessible icon toggle and strength indicator', () => {
    fixture.componentRef.setInput('label', 'Password');
    fixture.componentRef.setInput('placeholder', 'Enter password');
    fixture.componentRef.setInput('showLabel', 'Reveal');
    fixture.componentRef.setInput('hideLabel', 'Conceal');
    fixture.componentRef.setInput('showStrength', true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector('.neu-password__toggle') as HTMLButtonElement;
    expect(fixture.nativeElement.querySelector('label')?.textContent).toContain('Password');
    expect(input.placeholder).toBe('Enter password');
    expect(input.type).toBe('password');
    expect(toggle.getAttribute('aria-label')).toBe('Reveal');
    expect(toggle.textContent?.trim()).toBe('');
    expect(toggle.querySelector('svg')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.neu-password__strength span')).toHaveLength(4);
    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Conceal');
    expect(toggle.querySelector('svg')).toBeTruthy();
  });

  it('disables the reveal toggle whenever the password control is disabled', () => {
    const toggle = fixture.nativeElement.querySelector('.neu-password__toggle') as HTMLButtonElement;

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(toggle.disabled).toBe(true);

    fixture.componentRef.setInput('disabled', false);
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();
    expect(toggle.disabled).toBe(true);
  });

  it('propagates input, blur and value changes through its template', () => {
    const component = fixture.componentInstance;
    const emitted = vi.spyOn(component.valueChange, 'emit');
    let touched = 0;
    component.registerOnTouched(() => touched++);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Pass123!';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    expect(component.value()).toBe('Pass123!');
    expect(emitted).toHaveBeenCalledWith('Pass123!');
    expect(touched).toBe(1);

    fixture.componentRef.setInput('toggleable', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-password__toggle')).toBeNull();
  });

  it('integrates with a reactive form and runs default callbacks safely before registration', async () => {
    fixture.componentInstance.setValue('Unregistered1!');

    @Component({
      imports: [NeuPasswordComponent, ReactiveFormsModule],
      template: '<neu-password [formControl]="control" />',
    })
    class FormHostComponent {
      readonly control = new FormControl('Initial1!');
    }

    await TestBed.resetTestingModule().configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
    const formFixture = TestBed.createComponent(FormHostComponent);
    formFixture.detectChanges();
    const input = formFixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('Initial1!');
    input.value = 'Changed1!';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(formFixture.componentInstance.control.value).toBe('Changed1!');
  });
});
