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
import { NeuDateInputComponent, civilDate, type CivilDate } from '@neural-ui/core/date-input';

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
  ],
  template: `
    <span id="n2-ready">{{ ready() }}</span>
    <output id="n2-input-events">{{ inputEvents() | json }}</output>
    <output id="n2-checkbox-events">{{ checkboxEvents() | json }}</output>
    <output id="n2-new-control-events">{{ newControlEvents() | json }}</output>
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
  `,
})
export class N2FormsHydrationComponent {
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
    afterNextRender(() => this.ready.set(true));
  }

  private record(name: string, value: string | number | boolean | null): void {
    this.newControlEvents.update((events) => [...events, `${name}:${String(value)}`]);
  }
}
