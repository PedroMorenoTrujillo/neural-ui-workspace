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
