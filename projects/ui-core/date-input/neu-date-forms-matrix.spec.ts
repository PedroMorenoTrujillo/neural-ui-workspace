import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { NeuDateInputComponent } from './neu-date-input.component';
import type { CivilMonth, CivilYear } from './neu-date-value';

const month: CivilMonth = { year: 2026, month: 9 };
const year: CivilYear = { year: 2026 };

@Component({
  imports: [FormField, NeuDateInputComponent],
  template: `<neu-date-input mode="month" presentation="inline" [formField]="fields.month" />
    <neu-date-input mode="year" presentation="inline" [formField]="fields.year" />`,
})
class SignalHost {
  readonly data = signal<{ month: CivilMonth | null; year: CivilYear | null }>({ month, year });
  readonly fields = form(this.data);
}

@Component({
  imports: [ReactiveFormsModule, NeuDateInputComponent],
  template: `<neu-date-input mode="month" presentation="inline" [formControl]="month" />
    <neu-date-input mode="year" presentation="inline" [formControl]="year" />`,
})
class ReactiveDirectHost {
  readonly month = new FormControl<CivilMonth | null>(month);
  readonly year = new FormControl<CivilYear | null>(year);
}

@Component({
  imports: [ReactiveFormsModule, NeuDateInputComponent],
  template: `<form [formGroup]="group">
    <neu-date-input mode="month" presentation="inline" formControlName="month" />
    <neu-date-input mode="year" presentation="inline" formControlName="year" />
  </form>`,
})
class ReactiveGroupHost {
  readonly group = new FormGroup({
    month: new FormControl<CivilMonth | null>(month),
    year: new FormControl<CivilYear | null>(year),
  });
}

@Component({
  imports: [FormsModule, NeuDateInputComponent],
  template: `<neu-date-input mode="month" presentation="inline" [(ngModel)]="month" [ngModelOptions]="{standalone: true}" />
    <neu-date-input mode="year" presentation="inline" [(ngModel)]="year" [ngModelOptions]="{standalone: true}" />`,
})
class TemplateHost {
  readonly month = signal<CivilMonth | null>(month);
  readonly year = signal<CivilYear | null>(year);
}

describe('N2-025 month/year official Angular Forms interoperability', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  it('[formField] keeps one model per mode and reset remains authoritative', () => {
    const fixture = TestBed.createComponent(SignalHost);
    fixture.detectChanges();
    const controls = fixture.debugElement.queryAll(By.directive(NeuDateInputComponent));
    controls[0].componentInstance.selectMonth(10);
    controls[1].componentInstance.selectYear(2027);
    fixture.detectChanges();
    expect(fixture.componentInstance.data()).toEqual({ month: { year: 2026, month: 10 }, year: { year: 2027 } });
    expect(fixture.componentInstance.fields.month().dirty()).toBe(true);
    fixture.componentInstance.fields.month().reset(null);
    expect(fixture.componentInstance.data().month).toBeNull();
  });

  it('[formControl] propagates month/year edits and silent parent writes', () => {
    const fixture = TestBed.createComponent(ReactiveDirectHost);
    fixture.detectChanges();
    const controls = fixture.debugElement.queryAll(By.directive(NeuDateInputComponent));
    const changes: CivilMonth[] = [];
    fixture.componentInstance.month.valueChanges.subscribe((value) => { if (value) changes.push(value); });
    controls[0].componentInstance.selectMonth(10);
    controls[1].componentInstance.selectYear(2027);
    fixture.detectChanges();
    expect(fixture.componentInstance.month.value).toEqual({ year: 2026, month: 10 });
    expect(fixture.componentInstance.year.value).toEqual({ year: 2027 });
    expect(changes).toHaveLength(1);
    fixture.componentInstance.month.setValue({ year: 2028, month: 4 });
    fixture.detectChanges();
    expect(changes).toHaveLength(2);
  });

  it('formControlName propagates and resets both civil period types', () => {
    const fixture = TestBed.createComponent(ReactiveGroupHost);
    fixture.detectChanges();
    const controls = fixture.debugElement.queryAll(By.directive(NeuDateInputComponent));
    controls[0].componentInstance.selectMonth(10);
    controls[1].componentInstance.selectYear(2027);
    expect(fixture.componentInstance.group.getRawValue()).toEqual({ month: { year: 2026, month: 10 }, year: { year: 2027 } });
    fixture.componentInstance.group.reset({ month: null, year: null });
    expect(fixture.componentInstance.group.getRawValue()).toEqual({ month: null, year: null });
  });

  it('[(ngModel)] propagates each period edit once', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const controls = fixture.debugElement.queryAll(By.directive(NeuDateInputComponent));
    controls[0].componentInstance.selectMonth(10);
    controls[1].componentInstance.selectYear(2027);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.month()).toEqual({ year: 2026, month: 10 });
    expect(fixture.componentInstance.year()).toEqual({ year: 2027 });
  });
});
