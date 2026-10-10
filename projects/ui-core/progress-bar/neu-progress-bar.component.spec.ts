import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { NeuProgressBarComponent } from './neu-progress-bar.component';

@Component({
  template: `<neu-progress-bar
    [value]="value"
    [tone]="tone"
    [label]="label"
    [showValue]="showValue"
    [indeterminate]="indeterminate"
    [size]="size"
  />`,
  imports: [NeuProgressBarComponent],
})
class TestHostComponent {
  value = 50;
  tone: any = 'brand';
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

  it('should apply tone class', () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('tone', 'success');
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

  it('tone=success should add the success CSS class', async () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('tone', 'success');
    df.componentRef.setInput('value', 50);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('.neu-progress--success')).toBeTruthy();
  });

  it('tone=danger should add the danger CSS class', async () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('tone', 'danger');
    df.componentRef.setInput('value', 50);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('.neu-progress--danger')).toBeTruthy();
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

  it('indeterminate omits numeric progress and NaN cannot enter ARIA', () => {
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('value', Number.NaN);
    df.detectChanges();
    const bar = df.nativeElement.querySelector('[role="progressbar"]');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
    expect(bar.getAttribute('aria-valuetext')).toBe('0%');
    df.componentRef.setInput('indeterminate', true);
    df.detectChanges();
    expect(bar.hasAttribute('aria-valuenow')).toBe(false);
    expect(bar.getAttribute('aria-valuetext')).toBe('Loading…');
  });

  it('uses the optional Spanish locale for default progress and loading names', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NeuProgressBarComponent],
      providers: [{ provide: NEURAL_LOCALE, useValue: 'es-ES' }],
    });
    const df = TestBed.createComponent(NeuProgressBarComponent);
    df.componentRef.setInput('indeterminate', true);
    df.detectChanges();
    const bar = df.nativeElement.querySelector('[role="progressbar"]');
    expect(bar.getAttribute('aria-label')).toBe('Progreso');
    expect(bar.getAttribute('aria-valuetext')).toBe('Cargando…');
  });
});
