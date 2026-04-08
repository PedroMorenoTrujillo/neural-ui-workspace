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
});
