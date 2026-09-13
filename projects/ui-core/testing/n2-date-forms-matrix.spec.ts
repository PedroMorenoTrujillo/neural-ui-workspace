import { Component, provideZonelessChangeDetection, signal, viewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { NeuDateInputComponent } from '../date-input/neu-date-input.component';
import {
  civilDate,
  localDateTime,
  localTime,
  type CivilDate,
  type CivilDateRange,
  type LocalDateTime,
  type LocalTime,
} from '../date-input/neu-date-value';

interface DateValues {
  date: CivilDate | null;
  time: LocalTime | null;
  datetime: LocalDateTime | null;
  multiple: readonly CivilDate[];
  range: CivilDateRange;
}

const INITIAL: DateValues = {
  date: civilDate('2026-03-01'),
  time: localTime('09:15'),
  datetime: localDateTime('2026-03-01T09:15'),
  multiple: [civilDate('2026-03-01')],
  range: { start: civilDate('2026-03-01'), end: null },
};

const PARENT: DateValues = {
  date: civilDate('2026-05-10'),
  time: localTime('18:45'),
  datetime: localDateTime('2026-05-10T18:45'),
  multiple: [civilDate('2026-05-10'), civilDate('2026-05-11')],
  range: { start: civilDate('2026-05-10'), end: civilDate('2026-05-15') },
};

@Component({
  imports: [FormField, NeuDateInputComponent],
  template: `
    <neu-date-input data-name="date" [formField]="fields.date" />
    <neu-date-input data-name="time" mode="time" [formField]="fields.time" />
    <neu-date-input data-name="datetime" mode="datetime" [formField]="fields.datetime" />
    <neu-date-input data-name="multiple" mode="multiple" [formField]="fields.multiple" />
    <neu-date-input data-name="range" mode="range" [formField]="fields.range" />
  `,
})
class SignalHost {
  readonly data = signal<DateValues>({ ...INITIAL });
  readonly fields = form(this.data);
  readonly controls = viewChildren(NeuDateInputComponent);
}

@Component({
  imports: [ReactiveFormsModule, NeuDateInputComponent],
  template: `
    <neu-date-input data-name="date" [formControl]="date" />
    <neu-date-input data-name="time" mode="time" [formControl]="time" />
    <neu-date-input data-name="datetime" mode="datetime" [formControl]="datetime" />
    <neu-date-input data-name="multiple" mode="multiple" [formControl]="multiple" />
    <neu-date-input data-name="range" mode="range" [formControl]="range" />
  `,
})
class ReactiveDirectHost {
  readonly date = new FormControl<CivilDate | null>(INITIAL.date);
  readonly time = new FormControl<LocalTime | null>(INITIAL.time);
  readonly datetime = new FormControl<LocalDateTime | null>(INITIAL.datetime);
  readonly multiple = new FormControl<readonly CivilDate[]>(INITIAL.multiple, {
    nonNullable: true,
  });
  readonly range = new FormControl<CivilDateRange>(INITIAL.range, { nonNullable: true });
  readonly controls = viewChildren(NeuDateInputComponent);
}

@Component({
  imports: [ReactiveFormsModule, NeuDateInputComponent],
  template: `
    <form [formGroup]="group">
      <neu-date-input data-name="date" formControlName="date" />
      <neu-date-input data-name="time" mode="time" formControlName="time" />
      <neu-date-input data-name="datetime" mode="datetime" formControlName="datetime" />
      <neu-date-input data-name="multiple" mode="multiple" formControlName="multiple" />
      <neu-date-input data-name="range" mode="range" formControlName="range" />
    </form>
  `,
})
class ReactiveGroupHost {
  readonly group = new FormGroup({
    date: new FormControl<CivilDate | null>(INITIAL.date),
    time: new FormControl<LocalTime | null>(INITIAL.time),
    datetime: new FormControl<LocalDateTime | null>(INITIAL.datetime),
    multiple: new FormControl<readonly CivilDate[]>(INITIAL.multiple, { nonNullable: true }),
    range: new FormControl<CivilDateRange>(INITIAL.range, { nonNullable: true }),
  });
  readonly controls = viewChildren(NeuDateInputComponent);
}

@Component({
  imports: [FormsModule, NeuDateInputComponent],
  template: `
    <neu-date-input data-name="date" name="date" [(ngModel)]="date" />
    <neu-date-input data-name="time" name="time" mode="time" [(ngModel)]="time" />
    <neu-date-input data-name="datetime" name="datetime" mode="datetime" [(ngModel)]="datetime" />
    <neu-date-input data-name="multiple" name="multiple" mode="multiple" [(ngModel)]="multiple" />
    <neu-date-input data-name="range" name="range" mode="range" [(ngModel)]="range" />
  `,
})
class TemplateHost {
  readonly date = signal<CivilDate | null>(INITIAL.date);
  readonly time = signal<LocalTime | null>(INITIAL.time);
  readonly datetime = signal<LocalDateTime | null>(INITIAL.datetime);
  readonly multiple = signal<readonly CivilDate[]>(INITIAL.multiple);
  readonly range = signal<CivilDateRange>(INITIAL.range);
  readonly controls = viewChildren(NeuDateInputComponent);
}

function editAll(
  root: HTMLElement,
  controls: readonly NeuDateInputComponent<import('../date-input/neu-date-value').NeuDateMode>[],
): void {
  const text = (name: string, value: string) => {
    const field = root.querySelector(`[data-name="${name}"] input`) as HTMLInputElement;
    field.dispatchEvent(new FocusEvent('focus'));
    field.value = value;
    field.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
  };
  text('date', '2026-04-02');
  text('time', '11:30');
  text('datetime', '2026-04-02T11:30');
  controls[3].selectCivilDate(civilDate('2026-04-02'));
  controls[4].clear();
  controls[4].selectCivilDate(civilDate('2026-04-02'));
  controls[4].selectCivilDate(civilDate('2026-04-05'));
}

function expectEdited(values: DateValues): void {
  expect(values).toEqual({
    date: '2026-04-02',
    time: '11:30',
    datetime: '2026-04-02T11:30',
    multiple: ['2026-03-01', '2026-04-02'],
    range: { start: '2026-04-02', end: '2026-04-05' },
  });
}

describe('N2-006 DateInput Forms matrix: five modes x four paths', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('Signal Forms supports edits, dirty, touch, parent writes and reset for every mode', async () => {
    const fixture = TestBed.createComponent(SignalHost);
    fixture.detectChanges();
    editAll(fixture.nativeElement, fixture.componentInstance.controls());
    fixture.detectChanges();
    expectEdited(fixture.componentInstance.data());
    for (const key of Object.keys(INITIAL) as (keyof DateValues)[]) {
      expect(fixture.componentInstance.fields[key]().dirty()).toBe(true);
    }
    const first = fixture.nativeElement.querySelector('[data-name="date"]') as HTMLElement;
    first.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await Promise.resolve();
    fixture.detectChanges();
    expect(fixture.componentInstance.fields.date().touched()).toBe(true);
    fixture.componentInstance.fields.date().value.set(PARENT.date);
    expect(fixture.componentInstance.data().date).toBe(PARENT.date);
    fixture.componentInstance.fields.date().reset(INITIAL.date);
    expect(fixture.componentInstance.fields.date().dirty()).toBe(false);
  });

  it('Reactive [formControl] supports all modes and parent writes do not echo', () => {
    const fixture = TestBed.createComponent(ReactiveDirectHost);
    fixture.detectChanges();
    const emissions = vi.fn();
    fixture.componentInstance.date.valueChanges.subscribe(emissions);
    fixture.componentInstance.date.setValue(PARENT.date);
    fixture.detectChanges();
    expect(emissions).toHaveBeenCalledExactlyOnceWith(PARENT.date);
    emissions.mockClear();
    editAll(fixture.nativeElement, fixture.componentInstance.controls());
    fixture.detectChanges();
    expectEdited({
      date: fixture.componentInstance.date.value,
      time: fixture.componentInstance.time.value,
      datetime: fixture.componentInstance.datetime.value,
      multiple: fixture.componentInstance.multiple.value,
      range: fixture.componentInstance.range.value,
    });
    expect(emissions).toHaveBeenCalledExactlyOnceWith(civilDate('2026-04-02'));
  });

  it('Reactive formControlName supports all modes and group reset', () => {
    const fixture = TestBed.createComponent(ReactiveGroupHost);
    fixture.detectChanges();
    editAll(fixture.nativeElement, fixture.componentInstance.controls());
    fixture.detectChanges();
    expectEdited(fixture.componentInstance.group.getRawValue());
    fixture.componentInstance.group.reset(INITIAL);
    fixture.detectChanges();
    expect(fixture.componentInstance.group.getRawValue()).toEqual(INITIAL);
  });

  it('Template [(ngModel)] supports all modes and parent writes without valueChange echo', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    editAll(fixture.nativeElement, fixture.componentInstance.controls());
    fixture.detectChanges();
    await fixture.whenStable();
    expectEdited({
      date: fixture.componentInstance.date(),
      time: fixture.componentInstance.time(),
      datetime: fixture.componentInstance.datetime(),
      multiple: fixture.componentInstance.multiple(),
      range: fixture.componentInstance.range(),
    });
    const changes = vi.fn();
    fixture.componentInstance.controls()[0].value.subscribe(changes);
    fixture.componentInstance.date.set(PARENT.date);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.controls()[0].value()).toBe(PARENT.date);
    expect(changes).not.toHaveBeenCalled();
  });
});
