import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NeuFormFieldComponent, NeuInputGroupComponent } from './neu-form-field.component';

describe('NeuFormFieldComponent', () => {
  let fixture: ComponentFixture<NeuFormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuFormFieldComponent, NeuInputGroupComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NeuFormFieldComponent);
  });

  it('renders label and hint', () => {
    fixture.componentRef.setInput('label', 'Email');
    fixture.componentRef.setInput('hint', 'Work email');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Email');
    expect(fixture.nativeElement.textContent).toContain('Work email');
  });

  it('prefers error over hint', () => {
    fixture.componentRef.setInput('hint', 'Hint');
    fixture.componentRef.setInput('error', 'Required');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Required');
    expect(fixture.nativeElement.textContent).not.toContain('Hint');
  });

  it('renders prefix, suffix, association and computed size/error classes', () => {
    fixture.componentRef.setInput('label', 'Amount');
    fixture.componentRef.setInput('forId', 'amount-input');
    fixture.componentRef.setInput('prefix', '$');
    fixture.componentRef.setInput('suffix', 'USD');
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('error', 'Invalid');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('neu-form-field--lg');
    expect(host.classList).toContain('neu-form-field--error');
    expect(host.querySelector('label')?.getAttribute('for')).toBe('amount-input');
    expect(host.querySelector('.neu-form-field__prefix')?.textContent).toBe('$');
    expect(host.querySelector('.neu-form-field__suffix')?.textContent).toBe('USD');
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Invalid');
  });
});

@Component({
  imports: [NeuFormFieldComponent, NeuInputGroupComponent],
  template: `
    <neu-form-field label="Name"><input value="Ada" /></neu-form-field>
    <neu-input-group><input /><button type="button">Go</button></neu-input-group>
  `,
})
class ProjectionHostComponent {}

describe('NeuInputGroupComponent', () => {
  it('projects controls and exposes size and attachment classes', async () => {
    await TestBed.configureTestingModule({ imports: [NeuInputGroupComponent, ProjectionHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuInputGroupComponent);
    fixture.componentRef.setInput('size', 'sm');
    fixture.componentRef.setInput('attached', false);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('neu-input-group--sm');
    expect(host.classList).not.toContain('neu-input-group--attached');

    const projected = TestBed.createComponent(ProjectionHostComponent);
    projected.detectChanges();
    expect(projected.nativeElement.querySelector('neu-form-field input')).toBeTruthy();
    expect(projected.nativeElement.querySelector('neu-input-group button')?.textContent).toContain('Go');
  });
});
