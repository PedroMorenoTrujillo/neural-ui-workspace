import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { vi } from 'vitest';
import { NeuRatingComponent } from '../rating/neu-rating.component';
import { NeuSliderComponent } from '../slider/neu-slider.component';

type Values = { slider: number; rating: number | null };
const INITIAL: Values = { slider: 20, rating: 2 };
const EDITED: Values = { slider: 70, rating: 4 };
const imports = [NeuSliderComponent, NeuRatingComponent] as const;

function editAll(fixture: ComponentFixture<unknown>): void {
  fixture.debugElement.query(By.directive(NeuSliderComponent)).componentInstance.value.set(
    EDITED.slider,
  );
  fixture.debugElement.query(By.directive(NeuRatingComponent)).componentInstance.value.set(
    EDITED.rating,
  );
}

@Component({
  imports: [FormField, ...imports],
  template: `
    <neu-slider [formField]="fields.slider" />
    <neu-rating [formField]="fields.rating" />
  `,
})
class SignalHost {
  readonly data = signal<Values>({ ...INITIAL });
  readonly fields = form(this.data);
}

@Component({
  imports: [ReactiveFormsModule, ...imports],
  template: `
    <neu-slider [formControl]="controls.slider" />
    <neu-rating [formControl]="controls.rating" />
  `,
})
class ReactiveDirectHost {
  readonly controls = {
    slider: new FormControl(INITIAL.slider, { nonNullable: true }),
    rating: new FormControl<number | null>(INITIAL.rating),
  };
}

@Component({
  imports: [ReactiveFormsModule, ...imports],
  template: `<form [formGroup]="group">
    <neu-slider formControlName="slider" />
    <neu-rating formControlName="rating" />
  </form>`,
})
class ReactiveGroupHost {
  readonly group = new FormGroup({
    slider: new FormControl(INITIAL.slider, { nonNullable: true }),
    rating: new FormControl<number | null>(INITIAL.rating),
  });
}

@Component({
  imports: [FormsModule, ...imports],
  template: `
    <neu-slider [(ngModel)]="slider" [ngModelOptions]="{ standalone: true }" />
    <neu-rating [(ngModel)]="rating" [ngModelOptions]="{ standalone: true }" />
  `,
})
class TemplateHost {
  readonly slider = signal(INITIAL.slider);
  readonly rating = signal<number | null>(INITIAL.rating);
}

type Range = readonly [number, number];

@Component({
  imports: [FormField, ...imports],
  template: `
    <neu-slider [minValue]="0" [maxValue]="100" [formField]="fields.range" />
    <neu-rating [step]="0.5" [formField]="fields.rating" />
  `,
})
class B7SignalHost {
  readonly data = signal({ range: [20, 80] as Range, rating: 2 as number | null });
  readonly fields = form(this.data);
}

@Component({
  imports: [ReactiveFormsModule, ...imports],
  template: `
    <neu-slider [minValue]="0" [maxValue]="100" [formControl]="range" />
    <neu-rating [step]="0.5" [formControl]="rating" />
  `,
})
class B7ReactiveDirectHost {
  readonly range = new FormControl<Range>([20, 80], { nonNullable: true });
  readonly rating = new FormControl<number | null>(2);
}

@Component({
  imports: [ReactiveFormsModule, ...imports],
  template: `<form [formGroup]="group">
    <neu-slider formControlName="range" [minValue]="0" [maxValue]="100" />
    <neu-rating formControlName="rating" [step]="0.5" />
  </form>`,
})
class B7ReactiveGroupHost {
  readonly group = new FormGroup({
    range: new FormControl<Range>([20, 80], { nonNullable: true }),
    rating: new FormControl<number | null>(2),
  });
}

@Component({
  imports: [FormsModule, ...imports],
  template: `
    <neu-slider [minValue]="0" [maxValue]="100" [(ngModel)]="range" [ngModelOptions]="{ standalone: true }" />
    <neu-rating [step]="0.5" [(ngModel)]="rating" [ngModelOptions]="{ standalone: true }" />
  `,
})
class B7TemplateHost {
  range: Range = [20, 80];
  readonly rating = signal<number | null>(2);
}

function b7Controls(fixture: ComponentFixture<unknown>) {
  return {
    slider: fixture.debugElement.query(By.directive(NeuSliderComponent))
      .componentInstance as NeuSliderComponent<Range>,
    rating: fixture.debugElement.query(By.directive(NeuRatingComponent))
      .componentInstance as NeuRatingComponent,
  };
}

function editB7(fixture: ComponentFixture<unknown>): void {
  const { slider, rating } = b7Controls(fixture);
  const thumb = fixture.nativeElement.querySelector('[role="slider"]') as HTMLElement;
  thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
  const half = fixture.nativeElement.querySelector('[data-neu-rating-value="2.5"]') as HTMLButtonElement;
  half.click();
  expect(slider.value()).toEqual([21, 80]);
  expect(rating.value()).toBe(2.5);
}

describe('N2-010 Slider/Rating Forms matrix', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('binds Slider and Rating through formField and marks only user model writes dirty', () => {
    const fixture = TestBed.createComponent(SignalHost);
    fixture.detectChanges();
    editAll(fixture);
    fixture.detectChanges();
    expect(fixture.componentInstance.data()).toEqual(EDITED);
    expect(fixture.componentInstance.fields.slider().dirty()).toBe(true);
    expect(fixture.componentInstance.fields.rating().dirty()).toBe(true);
  });

  it('binds direct formControl and keeps parent writes silent', () => {
    const fixture = TestBed.createComponent(ReactiveDirectHost);
    fixture.detectChanges();
    const slider = fixture.debugElement.query(By.directive(NeuSliderComponent))
      .componentInstance as NeuSliderComponent;
    const rating = fixture.debugElement.query(By.directive(NeuRatingComponent))
      .componentInstance as NeuRatingComponent;
    const sliderEcho = vi.fn();
    const ratingEcho = vi.fn();
    slider.value.subscribe(sliderEcho);
    rating.value.subscribe(ratingEcho);
    fixture.componentInstance.controls.slider.setValue(30);
    fixture.componentInstance.controls.rating.setValue(null);
    fixture.detectChanges();
    expect(slider.value()).toBe(30);
    expect(rating.value()).toBeNull();
    expect(sliderEcho).not.toHaveBeenCalled();
    expect(ratingEcho).not.toHaveBeenCalled();
    editAll(fixture);
    expect(fixture.componentInstance.controls.slider.value).toBe(EDITED.slider);
    expect(fixture.componentInstance.controls.rating.value).toBe(EDITED.rating);
  });

  it('binds formControlName and resets to the values owned by Angular', () => {
    const fixture = TestBed.createComponent(ReactiveGroupHost);
    fixture.detectChanges();
    editAll(fixture);
    expect(fixture.componentInstance.group.getRawValue()).toEqual(EDITED);
    fixture.componentInstance.group.reset({ slider: 10, rating: null });
    fixture.detectChanges();
    expect(fixture.componentInstance.group.getRawValue()).toEqual({ slider: 10, rating: null });
  });

  it('binds ngModel in both directions without echoing parent writes', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    editAll(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.slider()).toBe(EDITED.slider);
    expect(fixture.componentInstance.rating()).toBe(EDITED.rating);
    const slider = fixture.debugElement.query(By.directive(NeuSliderComponent))
      .componentInstance as NeuSliderComponent;
    const echo = vi.fn();
    slider.value.subscribe(echo);
    fixture.componentInstance.slider.set(55);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(slider.value()).toBe(55);
    expect(echo).not.toHaveBeenCalled();
  });
});

describe('B7 range Slider and half Rating Forms matrix', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('propagates through formField once and keeps minValue independent of field metadata', () => {
    const fixture = TestBed.createComponent(B7SignalHost);
    fixture.detectChanges();
    const { slider, rating } = b7Controls(fixture);
    const sliderEcho = vi.fn();
    const ratingEcho = vi.fn();
    slider.value.subscribe(sliderEcho);
    rating.value.subscribe(ratingEcho);
    editB7(fixture);
    fixture.detectChanges();
    expect(fixture.componentInstance.data()).toEqual({ range: [21, 80], rating: 2.5 });
    expect(sliderEcho).toHaveBeenCalledTimes(1);
    expect(ratingEcho).toHaveBeenCalledTimes(1);
    fixture.componentInstance.data.set({ range: [30, 70], rating: 3.5 });
    fixture.detectChanges();
    expect(slider.value()).toEqual([30, 70]);
    expect(rating.value()).toBe(3.5);
    expect(sliderEcho).toHaveBeenCalledTimes(1);
    expect(ratingEcho).toHaveBeenCalledTimes(1);
  });

  it('propagates through direct formControl and accepts silent external writes', () => {
    const fixture = TestBed.createComponent(B7ReactiveDirectHost);
    fixture.detectChanges();
    editB7(fixture);
    expect(fixture.componentInstance.range.value).toEqual([21, 80]);
    expect(fixture.componentInstance.rating.value).toBe(2.5);
    fixture.componentInstance.range.setValue([30, 70]);
    fixture.componentInstance.rating.setValue(3.5);
    fixture.detectChanges();
    expect(b7Controls(fixture).slider.value()).toEqual([30, 70]);
  });

  it('propagates through formControlName and resets under parent ownership', () => {
    const fixture = TestBed.createComponent(B7ReactiveGroupHost);
    fixture.detectChanges();
    editB7(fixture);
    expect(fixture.componentInstance.group.getRawValue()).toEqual({ range: [21, 80], rating: 2.5 });
    fixture.componentInstance.group.reset({ range: [10, 90], rating: null });
    fixture.detectChanges();
    expect(b7Controls(fixture).slider.value()).toEqual([10, 90]);
    expect(b7Controls(fixture).rating.value()).toBeNull();
  });

  it('propagates through ngModel without echoing parent changes', async () => {
    const fixture = TestBed.createComponent(B7TemplateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(b7Controls(fixture).slider.value()).toEqual([20, 80]);
    editB7(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.range).toEqual([21, 80]);
    expect(fixture.componentInstance.rating()).toBe(2.5);
    fixture.componentInstance.range = [30, 70];
    fixture.componentInstance.rating.set(3.5);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(b7Controls(fixture).slider.value()).toEqual([30, 70]);
  });
});
