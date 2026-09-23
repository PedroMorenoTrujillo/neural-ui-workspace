import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { NeuSliderComponent, type NeuSliderValue } from '@neural-ui/core/slider';

type Range = readonly [number, number];

@Component({
  imports: [NeuSliderComponent, FormField, ReactiveFormsModule, FormsModule],
  template: `
    <neu-slider [minValue]="0" [maxValue]="100" [formField]="fields.range" />
    <neu-slider [minValue]="0" [maxValue]="100" [formControl]="rangeControl" />
    <form [formGroup]="group"><neu-slider formControlName="range" [minValue]="0" [maxValue]="100" /></form>
    <neu-slider [minValue]="0" [maxValue]="100" [(ngModel)]="rangeModel" [ngModelOptions]="{ standalone: true }" />
    <neu-slider [minValue]="0" [maxValue]="100" [formField]="fields.scalar" />
    <neu-slider [minValue]="0" [maxValue]="100" [formControl]="scalarControl" />
    <neu-slider [minValue]="0" [maxValue]="100" [(ngModel)]="scalarModel" [ngModelOptions]="{ standalone: true }" />
  `,
})
export class SliderFormsTypeFixture {
  readonly state = signal({ range: [20, 80] as Range, scalar: 25 });
  readonly fields = form(this.state);
  readonly rangeControl = new FormControl<Range>([20, 80], { nonNullable: true });
  readonly scalarControl = new FormControl(25, { nonNullable: true });
  readonly group = new FormGroup({ range: new FormControl<Range>([20, 80], { nonNullable: true }) });
  rangeModel: Range = [20, 80];
  scalarModel = 25;
}

declare const scalar: NeuSliderComponent;
declare const range: NeuSliderComponent<Range>;
scalar.value.set(12);
range.value.set([10, 90]);
const rangeValue: NeuSliderValue = [10, 90];
const lowerBound: number = range.minValue();
const upperBound: number = range.maxValue();
void rangeValue;
void lowerBound;
void upperBound;

declare const arbitraryArray: number[];
// @ts-expect-error a mutable arbitrary-length array is not a two-value range
range.value.set(arbitraryArray);
// @ts-expect-error range needs two values
range.value.set([1]);
// @ts-expect-error range cannot have a third value
range.value.set([1, 2, 3]);
// @ts-expect-error range values must be numeric
range.value.set(['1', '2']);
// @ts-expect-error mixed tuple is not a range
range.value.set([1, '2']);
// @ts-expect-error strings are not Slider values
range.value.set('1');
// @ts-expect-error scalar Slider does not accept tuple values
scalar.value.set([1, 2]);
// @ts-expect-error former min input is not public
range.min();
// @ts-expect-error former max input is not public
range.max();
