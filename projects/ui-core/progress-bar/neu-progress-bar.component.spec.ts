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

  it('variant=success should add the success CSS class', async () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('variant', 'success');
    df.componentRef.setInput('value', 50);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('.neu-progress--success')).toBeTruthy();
  });

  it('variant=error should add the error CSS class', async () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('variant', 'error');
    df.componentRef.setInput('value', 50);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('.neu-progress--error')).toBeTruthy();
  });

  it('size=sm should add the sm CSS class', async () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('size', 'sm');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('.neu-progress--sm')).toBeTruthy();
  });

  it('size=lg should add the lg CSS class', async () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('size', 'lg');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('.neu-progress--lg')).toBeTruthy();
  });

  it('indeterminate=true should add indeterminate CSS class', async () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('indeterminate', true);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('.neu-progress__fill--indeterminate')).toBeTruthy();
  });

  it('showValue=true with label renders the value and label', async () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('value', 70);
    df.componentRef.setInput('showValue', true);
    df.componentRef.setInput('label', 'Progreso');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.textContent).toContain('70%');
    expect(df.nativeElement.textContent).toContain('Progreso');
  });

  it('value above 100 should clamp to 100', () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('value', 150);
    df.detectChanges();
    expect(df.componentInstance.clampedValue()).toBe(100);
  });

  it('value below 0 should clamp to 0', () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('value', -10);
    df.detectChanges();
    expect(df.componentInstance.clampedValue()).toBe(0);
  });
});
