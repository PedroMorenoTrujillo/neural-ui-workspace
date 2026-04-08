import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NeuProgressBarComponent } from './neu-progress-bar.component';

@Component({
  template: `<neu-progress-bar
    [value]="value"
    [variant]="variant"
    [label]="label"
    [showValue]="showValue"
    [indeterminate]="indeterminate"
    [size]="size"
  />`,
  imports: [NeuProgressBarComponent],
})
class TestHostComponent {
  value = 50;
  variant: any = 'primary';
  label = '';
  showValue = false;
  indeterminate = false;
  size: any = 'md';
}

describe('NeuProgressBarComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render', () => {
    expect(fixture.nativeElement.querySelector('neu-progress-bar')).toBeTruthy();
  });

  it('should show label when provided', () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('label', 'Uploading...');
    df.detectChanges();
    expect(df.nativeElement.textContent).toContain('Uploading...');
  });

  it('should show percentage value when showValue=true', () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('showValue', true);
    df.componentRef.setInput('value', 75);
    df.detectChanges();
    expect(df.nativeElement.textContent).toContain('75');
  });

  it('should apply indeterminate class when indeterminate=true', () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('indeterminate', true);
    df.detectChanges();
    const el = df.nativeElement.querySelector('[class*="indeterminate"]');
    expect(el).toBeTruthy();
  });

  it('should apply variant class', () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('variant', 'success');
    df.detectChanges();
    const el = df.nativeElement.querySelector('[class*="success"]');
    expect(el).toBeTruthy();
  });

  it('should apply size class', () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('size', 'lg');
    df.detectChanges();
    const el = df.nativeElement.querySelector('[class*="lg"]');
    expect(el).toBeTruthy();
  });

  it('should set aria-valuenow', () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('value', 40);
    df.detectChanges();
    const bar = df.nativeElement.querySelector('[role="progressbar"], [aria-valuenow]');
    expect(bar).toBeTruthy();
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
  });
});
