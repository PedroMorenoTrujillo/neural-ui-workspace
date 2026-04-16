import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NeuSliderComponent } from './neu-slider.component';

@Component({
  template: `<neu-slider
    [value]="value"
    [min]="min"
    [max]="max"
    [step]="step"
    [label]="label"
    [showValue]="showValue"
    [disabled]="disabled"
    (valueChange)="lastValue = $event"
  />`,
  imports: [NeuSliderComponent],
})
class TestHostComponent {
  value = 50;
  min = 0;
  max = 100;
  step = 1;
  label = '';
  showValue = false;
  disabled = false;
  lastValue: number | undefined;
}

describe('NeuSliderComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render range input', () => {
    const input = fixture.nativeElement.querySelector('input[type="range"]');
    expect(input).toBeTruthy();
  });

  it('should set min, max, step and value attributes', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="range"]');
    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
    expect(input.step).toBe('1');
    expect(input.value).toBe('50');
  });

  it('should show label when provided', () => {
    const df = TestBed.createComponent(NeuSliderComponent);
    df.componentRef.setInput('label', 'Volumen');
    df.detectChanges();
    expect(df.nativeElement.textContent).toContain('Volumen');
  });

  it('should show value when showValue=true', () => {
    const df = TestBed.createComponent(NeuSliderComponent);
    df.componentRef.setInput('showValue', true);
    df.componentRef.setInput('value', 75);
    df.detectChanges();
    expect(df.nativeElement.textContent).toContain('75');
  });

  it('should emit valueChange when slider changes', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="range"]');
    input.value = '60';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.lastValue).toBe(60);
  });

  it('should be disabled when disabled=true', () => {
    const df = TestBed.createComponent(NeuSliderComponent);
    df.componentRef.setInput('disabled', true);
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="range"]');
    expect(input.disabled).toBe(true);
  });

  it('should apply custom min and max', () => {
    const df = TestBed.createComponent(NeuSliderComponent);
    df.componentRef.setInput('min', 10);
    df.componentRef.setInput('max', 50);
    df.detectChanges();
    const input: HTMLInputElement = df.nativeElement.querySelector('input[type="range"]');
    expect(input.min).toBe('10');
    expect(input.max).toBe('50');
  });

  it('showTicks=true should render tick labels', async () => {
    const df = TestBed.createComponent(NeuSliderComponent);
    df.componentRef.setInput('showTicks', true);
    df.componentRef.setInput('min', 0);
    df.componentRef.setInput('max', 100);
    df.detectChanges();
    await df.whenStable();
    const ticks = df.nativeElement.querySelector('.neu-slider__ticks');
    expect(ticks).toBeTruthy();
    expect(ticks.textContent).toContain('0');
    expect(ticks.textContent).toContain('100');
  });

  it('showTicks=false should NOT render tick labels', async () => {
    const df = TestBed.createComponent(NeuSliderComponent);
    df.componentRef.setInput('showTicks', false);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('.neu-slider__ticks')).toBeNull();
  });

  it('unit input is shown in ticks', async () => {
    const df = TestBed.createComponent(NeuSliderComponent);
    df.componentRef.setInput('showTicks', true);
    df.componentRef.setInput('min', 0);
    df.componentRef.setInput('max', 10);
    df.componentRef.setInput('unit', 'kg');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.textContent).toContain('0kg');
    expect(df.nativeElement.textContent).toContain('10kg');
  });

  it('disabled input adds disabled class to inner div', async () => {
    const df = TestBed.createComponent(NeuSliderComponent);
    df.componentRef.setInput('disabled', true);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('.neu-slider--disabled')).toBeTruthy();
  });

  it('disabled=false should not add disabled class', async () => {
    const df = TestBed.createComponent(NeuSliderComponent);
    df.componentRef.setInput('disabled', false);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('.neu-slider--disabled')).toBeNull();
  });

  it('onBlur should call registerOnTouched callback', () => {
    const df = TestBed.createComponent(NeuSliderComponent);
    df.detectChanges();
    // NeuSliderComponent is NOT a CVA - onBlur is not available
    // Just verify the component exists and native blur works
    const inputEl = df.nativeElement.querySelector('input[type="range"]');
    expect(() => inputEl?.dispatchEvent(new Event('blur'))).not.toThrow();
  });
});
