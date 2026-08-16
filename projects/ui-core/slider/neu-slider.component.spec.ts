import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Directionality } from '@angular/cdk/bidi';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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

@Component({
  template: `<neu-slider [formControl]="control" />`,
  imports: [NeuSliderComponent, ReactiveFormsModule],
})
class SliderFormHostComponent {
  readonly control = new FormControl(25, { nonNullable: true });
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

  it('should render a label without the value when showValue=false', () => {
    const df = TestBed.createComponent(NeuSliderComponent);
    df.componentRef.setInput('label', 'Volumen');
    df.componentRef.setInput('showValue', false);
    df.componentRef.setInput('value', 75);
    df.detectChanges();

    expect(df.nativeElement.textContent).toContain('Volumen');
    expect(df.nativeElement.querySelector('.neu-slider__value')).toBeNull();
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

  it('fillPercent should be zero when min and max are equal', () => {
    const df = TestBed.createComponent(NeuSliderComponent);
    df.componentRef.setInput('min', 10);
    df.componentRef.setInput('max', 10);
    df.componentRef.setInput('value', 10);
    df.detectChanges();

    expect(df.componentInstance.fillPercent()).toBe(0);
  });

  it('updates its logical fill direction dynamically in RTL', () => {
    const df = TestBed.createComponent(NeuSliderComponent);
    df.componentRef.setInput('value', 40);
    df.detectChanges();
    const fill = df.nativeElement.querySelector('.neu-slider__fill') as HTMLElement;

    expect(df.nativeElement.getAttribute('dir')).toBe('ltr');
    expect(fill.style.inlineSize).toBe('40%');

    TestBed.inject(Directionality).valueSignal.set('rtl');
    df.detectChanges();
    expect(df.nativeElement.getAttribute('dir')).toBe('rtl');
    expect(fill.style.inlineSize).toBe('40%');
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

  it('integrates with reactive forms and propagates value, touched and disabled state', () => {
    const df = TestBed.createComponent(SliderFormHostComponent);
    df.detectChanges();
    const slider = df.debugElement.query(By.directive(NeuSliderComponent))
      .componentInstance as NeuSliderComponent;
    const input = df.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;

    expect(slider.currentValue()).toBe(25);
    input.value = '60';
    input.dispatchEvent(new Event('input'));
    expect(df.componentInstance.control.value).toBe(60);

    input.dispatchEvent(new Event('blur'));
    expect(df.componentInstance.control.touched).toBe(true);

    df.componentInstance.control.setValue(40);
    df.detectChanges();
    expect(slider.currentValue()).toBe(40);

    df.componentInstance.control.disable();
    df.detectChanges();
    expect(slider.cvaDisabled()).toBe(true);
    expect(input.disabled).toBe(true);
  });
});
