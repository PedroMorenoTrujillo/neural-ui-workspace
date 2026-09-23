import { JsonPipe } from '@angular/common';
import { Component, afterNextRender, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NeuCheckboxComponent } from '@neural-ui/core/checkbox';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuTextareaComponent } from '@neural-ui/core/textarea';
import { NeuPasswordComponent } from '@neural-ui/core/password';
import { NeuInputMaskComponent } from '@neural-ui/core/input-mask';
import { NeuInputOTPComponent } from '@neural-ui/core/input-otp';
import { NeuSwitchComponent } from '@neural-ui/core/switch';
import { NeuRadioComponent, NeuRadioGroupComponent } from '@neural-ui/core/radio';
import { NeuNumberInputComponent } from '@neural-ui/core/number-input';
import { NeuKnobComponent } from '@neural-ui/core/knob';
import { NeuDateInputComponent, civilDate, type CivilDate, type CivilMonth, type CivilYear } from '@neural-ui/core/date-input';
import { NeuSelectComponent } from '@neural-ui/core/select';
import { NeuAutocompleteComponent } from '@neural-ui/core/autocomplete';
import { NeuCascadeSelectComponent } from '@neural-ui/core/cascade-select';
import { NeuListboxComponent } from '@neural-ui/core/listbox';
import { NeuToggleButtonGroupComponent } from '@neural-ui/core/toggle-button-group';
import { NeuInputTagsComponent } from '@neural-ui/core/input-tags';
import { NeuInlineEditorComponent } from '@neural-ui/core/inline-editor';
import { NeuColorPickerComponent } from '@neural-ui/core/color-picker';
import { NeuRichTextEditorComponent } from '@neural-ui/core/rich-text-editor';
import { NeuUploaderComponent } from '@neural-ui/core/uploader';
import { NeuSliderComponent } from '@neural-ui/core/slider';
import { NeuRatingComponent } from '@neural-ui/core/rating';

@Component({
  selector: 'app-root',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    NeuInputComponent,
    NeuCheckboxComponent,
    NeuTextareaComponent,
    NeuPasswordComponent,
    NeuInputMaskComponent,
    NeuInputOTPComponent,
    NeuSwitchComponent,
    NeuRadioGroupComponent,
    NeuRadioComponent,
    NeuNumberInputComponent,
    NeuKnobComponent,
    NeuDateInputComponent,
    NeuSelectComponent,
    NeuAutocompleteComponent,
    NeuCascadeSelectComponent,
    NeuListboxComponent,
    NeuToggleButtonGroupComponent,
    NeuInputTagsComponent,
    NeuInlineEditorComponent,
    NeuColorPickerComponent,
    NeuRichTextEditorComponent,
    NeuUploaderComponent,
    NeuSliderComponent,
    NeuRatingComponent,
  ],
  template: `
    <span id="n2-ready">{{ ready() }}</span>
    <output id="n2-input-events">{{ inputEvents() | json }}</output>
    <output id="n2-checkbox-events">{{ checkboxEvents() | json }}</output>
    <output id="n2-new-control-events">{{ newControlEvents() | json }}</output>
    <output id="n2-period-events">{{ periodEvents() | json }}</output>
    <output id="n2-period-lifecycle">{{ periodLifecycle() | json }}</output>
    <output id="n2-b7-events">{{ b7Events() | json }}</output>
    <neu-input
      id="n2-input"
      label="Hydrated input"
      [required]="true"
      [formControl]="inputControl"
    />
    <neu-checkbox
      id="n2-checkbox"
      label="Hydrated checkbox"
      [required]="true"
      [formControl]="checkboxControl"
    />
    <neu-input
      id="n2-readonly-input"
      label="Readonly input"
      value="readonly-value"
      [readonly]="true"
    />
    <neu-input id="n2-disabled-input" label="Disabled input" [disabled]="true" />
    <neu-input id="n2-invalid-input" label="Invalid input" [invalid]="true" />
    <neu-checkbox
      id="n2-readonly-checkbox"
      label="Readonly checkbox"
      [checked]="true"
      [readonly]="true"
    />
    <neu-checkbox id="n2-disabled-checkbox" label="Disabled checkbox" [disabled]="true" />
    <neu-textarea id="n2-textarea" label="Hydrated textarea" [formControl]="textareaControl" />
    <neu-password id="n2-password" label="Hydrated password" [formControl]="passwordControl" />
    <neu-input-mask id="n2-mask" mask="999-999" [formControl]="maskControl" />
    <neu-input-otp id="n2-otp" [length]="4" [formControl]="otpControl" />
    <neu-switch id="n2-switch" label="Hydrated switch" [formControl]="switchControl" />
    <neu-radio-group id="n2-radio" ariaLabel="Hydrated role" [formControl]="radioControl">
      <neu-radio value="admin" label="Admin" />
      <neu-radio value="user" label="User" />
    </neu-radio-group>
    <neu-number-input
      id="n2-number"
      label="Hydrated amount"
      [formatOptions]="numberFormat"
      [formControl]="numberControl"
    />
    <neu-knob id="n2-knob" label="Hydrated knob" [step]="5" [formControl]="knobControl" />
    <neu-date-input
      id="n2-date"
      label="Hydrated civil date"
      locale="es-ES"
      [formControl]="dateControl"
    />
    <neu-date-input id="n2-date-inline" presentation="inline" [formControl]="dateInlineControl" (opened)="recordPeriodLifecycle('date-inline:opened')" (closed)="recordPeriodLifecycle('date-inline:closed')" />
    <neu-date-input id="n2-month-overlay" mode="month" [formControl]="monthOverlayControl" (opened)="recordPeriodLifecycle('month:opened')" (closed)="recordPeriodLifecycle('month:closed')" />
    <neu-date-input id="n2-month-inline" mode="month" presentation="inline" [formControl]="monthInlineControl" (opened)="recordPeriodLifecycle('month-inline:opened')" (closed)="recordPeriodLifecycle('month-inline:closed')" />
    <neu-date-input id="n2-year-overlay" mode="year" [formControl]="yearOverlayControl" (opened)="recordPeriodLifecycle('year:opened')" (closed)="recordPeriodLifecycle('year:closed')" />
    <neu-date-input id="n2-year-inline" mode="year" presentation="inline" [formControl]="yearInlineControl" (opened)="recordPeriodLifecycle('year-inline:opened')" (closed)="recordPeriodLifecycle('year-inline:closed')" />
    <neu-date-input id="n2-week-grid" presentation="inline" [showWeekNumbers]="true" [formControl]="weekControl" (opened)="recordPeriodLifecycle('week:opened')" (closed)="recordPeriodLifecycle('week:closed')" />
    <neu-select id="n2-select-single" [options]="options" [optionValue]="valueOf" [formControl]="selectSingleControl" />
    <neu-select id="n2-select-multiple" mode="multiple" [selectionOptions]="multipleOptions" [options]="options" [optionValue]="valueOf" [formControl]="selectMultipleControl" />
    <neu-autocomplete id="n2-autocomplete-strict" mode="strict" [dropdown]="true" [options]="options" [optionValue]="valueOf" [formControl]="autocompleteStrictControl" />
    <neu-autocomplete id="n2-autocomplete-free" mode="free-text" [options]="options" [optionValue]="valueOf" [formControl]="autocompleteFreeControl" />
    <neu-cascade-select id="n2-cascade" [options]="options" [optionValue]="valueOf" [formControl]="cascadeControl" />
    <neu-listbox id="n2-listbox-single" [options]="options" [optionValue]="valueOf" [formControl]="listboxSingleControl" />
    <neu-listbox id="n2-listbox-multiple" mode="multiple" [options]="options" [optionValue]="valueOf" [formControl]="listboxMultipleControl" />
    <neu-toggle-button-group id="n2-toggle-single" [options]="options" [optionValue]="$any(valueOf)" [formControl]="toggleSingleControl" />
    <neu-toggle-button-group id="n2-toggle-multiple" mode="multiple" [options]="options" [optionValue]="$any(valueOf)" [formControl]="toggleMultipleControl" />
    <neu-input-tags id="n2-input-tags" [options]="options" optionLabel="label" [optionValue]="valueOf" [formControl]="inputTagsControl" />
    <neu-inline-editor id="n2-inline-text" [formControl]="inlineTextControl" />
    <neu-inline-editor id="n2-inline-number" type="number" [formControl]="inlineNumberControl" />
    <neu-color-picker id="n2-color-picker" [formControl]="colorControl" />
    <neu-rich-text-editor id="n2-rich-text" [formControl]="richTextControl" />
    <neu-uploader id="n2-uploader" [formControl]="uploaderControl" />
    <neu-slider id="n2-slider" label="Hydrated slider" [step]="5" [formControl]="sliderControl" />
    <neu-rating id="n2-rating" label="Hydrated rating" [formControl]="ratingControl" />
    <neu-slider id="n2-b7-range" label="Hydrated range" [minValue]="0" [maxValue]="100" [step]="5" [minStepsBetweenThumbs]="2" [formControl]="rangeSliderControl" />
    <neu-slider id="n2-b7-vertical" label="Hydrated vertical range" orientation="vertical" [minValue]="0" [maxValue]="100" [formControl]="verticalSliderControl" />
    <neu-rating id="n2-b7-half" label="Hydrated half rating" [step]="0.5" [formControl]="halfRatingControl" />
  `,
})
export class N2FormsHydrationComponent {
  readonly options = [
    { id: 1, label: 'Hydrated one' },
    { id: 2, label: 'Hydrated two' },
  ] as const;
  readonly valueOf = (option: (typeof this.options)[number]) => option.id;
  readonly multipleOptions = { chips: true, toggleAll: true } as const;
  readonly ready = signal(false);
  readonly inputControl = new FormControl('server-value', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly checkboxControl = new FormControl(true, {
    nonNullable: true,
    validators: [Validators.requiredTrue],
  });
  readonly inputEvents = signal<string[]>([]);
  readonly checkboxEvents = signal<boolean[]>([]);
  readonly textareaControl = new FormControl('server-notes', { nonNullable: true });
  readonly passwordControl = new FormControl('Server1!', { nonNullable: true });
  readonly maskControl = new FormControl('123-456', { nonNullable: true });
  readonly otpControl = new FormControl('1234', { nonNullable: true });
  readonly switchControl = new FormControl(true, { nonNullable: true });
  readonly radioControl = new FormControl<'admin' | 'user' | null>('admin');
  readonly numberControl = new FormControl<number | null>(1234.5);
  readonly knobControl = new FormControl(25, { nonNullable: true });
  readonly dateControl = new FormControl<CivilDate | null>(civilDate('2026-03-29'));
  readonly dateInlineControl = new FormControl<CivilDate | null>(civilDate('2026-09-03'));
  readonly monthOverlayControl = new FormControl<CivilMonth | null>({ year: 2026, month: 9 });
  readonly monthInlineControl = new FormControl<CivilMonth | null>({ year: 2026, month: 9 });
  readonly yearOverlayControl = new FormControl<CivilYear | null>({ year: 2026 });
  readonly yearInlineControl = new FormControl<CivilYear | null>({ year: 2026 });
  readonly weekControl = new FormControl<CivilDate | null>(civilDate('2021-01-01'));
  readonly periodEvents = signal<string[]>([]);
  readonly periodLifecycle = signal<string[]>([]);
  readonly selectSingleControl = new FormControl<number | null>(1);
  readonly selectMultipleControl = new FormControl<readonly number[]>([1], { nonNullable: true });
  readonly autocompleteStrictControl = new FormControl<number | null>(1);
  readonly autocompleteFreeControl = new FormControl<number | string | null>('hydrated draft');
  readonly cascadeControl = new FormControl<number | null>(1);
  readonly listboxSingleControl = new FormControl<number | null>(1);
  readonly listboxMultipleControl = new FormControl<readonly number[]>([1], { nonNullable: true });
  readonly toggleSingleControl = new FormControl<number | null>(1);
  readonly toggleMultipleControl = new FormControl<readonly number[]>([1], { nonNullable: true });
  readonly inputTagsControl = new FormControl<readonly number[]>([1], { nonNullable: true });
  readonly inlineTextControl = new FormControl('server-inline', { nonNullable: true });
  readonly inlineNumberControl = new FormControl<number | null>(42);
  readonly colorControl = new FormControl('#336699', { nonNullable: true });
  readonly richTextControl = new FormControl('<p>server-rich</p>', { nonNullable: true });
  readonly uploaderControl = new FormControl<readonly File[]>([], { nonNullable: true });
  readonly sliderControl = new FormControl(35, { nonNullable: true });
  readonly ratingControl = new FormControl<number | null>(3);
  readonly rangeSliderControl = new FormControl<readonly [number, number]>([20, 80], { nonNullable: true });
  readonly verticalSliderControl = new FormControl<readonly [number, number]>([10, 60], { nonNullable: true });
  readonly halfRatingControl = new FormControl<number | null>(2.5);
  readonly b7Events = signal<string[]>([]);
  readonly numberFormat = {
    locale: 'de-DE',
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  } as const;
  readonly newControlEvents = signal<string[]>([]);

  constructor() {
    this.inputControl.valueChanges.subscribe((value) =>
      this.inputEvents.update((events) => [...events, value]),
    );
    this.checkboxControl.valueChanges.subscribe((value) =>
      this.checkboxEvents.update((events) => [...events, value]),
    );
    this.textareaControl.valueChanges.subscribe((value) => this.record('textarea', value));
    this.passwordControl.valueChanges.subscribe((value) => this.record('password', value));
    this.maskControl.valueChanges.subscribe((value) => this.record('mask', value));
    this.otpControl.valueChanges.subscribe((value) => this.record('otp', value));
    this.switchControl.valueChanges.subscribe((value) => this.record('switch', value));
    this.radioControl.valueChanges.subscribe((value) => this.record('radio', value));
    this.numberControl.valueChanges.subscribe((value) => this.record('number', value));
    this.knobControl.valueChanges.subscribe((value) => this.record('knob', value));
    this.dateControl.valueChanges.subscribe((value) => this.record('date', value));
    this.monthOverlayControl.valueChanges.subscribe((value) => this.periodEvents.update((events) => [...events, `month-overlay:${JSON.stringify(value)}`]));
    this.monthInlineControl.valueChanges.subscribe((value) => this.periodEvents.update((events) => [...events, `month-inline:${JSON.stringify(value)}`]));
    this.yearOverlayControl.valueChanges.subscribe((value) => this.periodEvents.update((events) => [...events, `year-overlay:${JSON.stringify(value)}`]));
    this.yearInlineControl.valueChanges.subscribe((value) => this.periodEvents.update((events) => [...events, `year-inline:${JSON.stringify(value)}`]));
    this.selectSingleControl.valueChanges.subscribe((value) => this.record('select-single', value));
    this.selectMultipleControl.valueChanges.subscribe((value) => this.record('select-multiple', value));
    this.autocompleteStrictControl.valueChanges.subscribe((value) => this.record('autocomplete-strict', value));
    this.autocompleteFreeControl.valueChanges.subscribe((value) => this.record('autocomplete-free', value));
    this.cascadeControl.valueChanges.subscribe((value) => this.record('cascade', value));
    this.listboxSingleControl.valueChanges.subscribe((value) => this.record('listbox-single', value));
    this.listboxMultipleControl.valueChanges.subscribe((value) => this.record('listbox-multiple', value));
    this.toggleSingleControl.valueChanges.subscribe((value) => this.record('toggle-single', value));
    this.toggleMultipleControl.valueChanges.subscribe((value) => this.record('toggle-multiple', value));
    this.inputTagsControl.valueChanges.subscribe((value) => this.record('input-tags', value));
    this.inlineTextControl.valueChanges.subscribe((value) => this.record('inline-text', value));
    this.inlineNumberControl.valueChanges.subscribe((value) => this.record('inline-number', value));
    this.colorControl.valueChanges.subscribe((value) => this.record('color-picker', value));
    this.richTextControl.valueChanges.subscribe((value) => this.record('rich-text', value));
    this.uploaderControl.valueChanges.subscribe((value) =>
      this.record('uploader', value.map((file) => file.name)),
    );
    this.sliderControl.valueChanges.subscribe((value) => this.record('slider', value));
    this.ratingControl.valueChanges.subscribe((value) => this.record('rating', value));
    this.rangeSliderControl.valueChanges.subscribe((value) =>
      this.b7Events.update((events) => [...events, `range:${JSON.stringify(value)}`]),
    );
    this.halfRatingControl.valueChanges.subscribe((value) =>
      this.b7Events.update((events) => [...events, `half:${value}`]),
    );
    afterNextRender(() => this.ready.set(true));
  }

  private record(name: string, value: unknown): void {
    this.newControlEvents.update((events) => [...events, `${name}:${Array.isArray(value) ? JSON.stringify(value) : String(value)}`]);
  }

  recordPeriodLifecycle(event: string): void {
    this.periodLifecycle.update((events) => [...events, event]);
  }
}
