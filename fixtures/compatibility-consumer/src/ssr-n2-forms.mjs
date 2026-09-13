import assert from 'node:assert/strict';
await import('@angular/compiler');
const core = await import('@angular/core');
const { FormControl, ReactiveFormsModule, Validators } = await import('@angular/forms');
const { bootstrapApplication, provideClientHydration } = await import('@angular/platform-browser');
const { provideServerRendering, renderApplication } = await import('@angular/platform-server');
const { NeuInputComponent } = await import('@neural-ui/core/input');
const { NeuCheckboxComponent } = await import('@neural-ui/core/checkbox');
const { NeuTextareaComponent } = await import('@neural-ui/core/textarea');
const { NeuPasswordComponent } = await import('@neural-ui/core/password');
const { NeuInputMaskComponent } = await import('@neural-ui/core/input-mask');
const { NeuInputOTPComponent } = await import('@neural-ui/core/input-otp');
const { NeuSwitchComponent } = await import('@neural-ui/core/switch');
const { NeuRadioComponent, NeuRadioGroupComponent } = await import('@neural-ui/core/radio');
const { NeuNumberInputComponent } = await import('@neural-ui/core/number-input');
const { NeuKnobComponent } = await import('@neural-ui/core/knob');
const { NeuDateInputComponent, civilDate } = await import('@neural-ui/core/date-input');

const changes = [];
class N2FormsSsr {
  input = new FormControl('server-value', { nonNullable: true, validators: [Validators.required] });
  checkbox = new FormControl(true, {
    nonNullable: true,
    validators: [Validators.requiredTrue],
  });
  textarea = new FormControl('server-notes', { nonNullable: true });
  password = new FormControl('Server1!', { nonNullable: true });
  mask = new FormControl('123-456', { nonNullable: true });
  otp = new FormControl('1234', { nonNullable: true });
  enabled = new FormControl(true, { nonNullable: true });
  role = new FormControl('admin');
  amount = new FormControl(1234.5);
  volume = new FormControl(25, { nonNullable: true });
  date = new FormControl(civilDate('2026-03-29'));
  numberFormat = {
    locale: 'de-DE',
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  constructor() {
    this.input.valueChanges.subscribe((value) => changes.push(`input:${value}`));
    this.checkbox.valueChanges.subscribe((value) => changes.push(`checkbox:${value}`));
    this.textarea.valueChanges.subscribe((value) => changes.push(`textarea:${value}`));
    this.password.valueChanges.subscribe((value) => changes.push(`password:${value}`));
    this.mask.valueChanges.subscribe((value) => changes.push(`mask:${value}`));
    this.otp.valueChanges.subscribe((value) => changes.push(`otp:${value}`));
    this.enabled.valueChanges.subscribe((value) => changes.push(`switch:${value}`));
    this.role.valueChanges.subscribe((value) => changes.push(`radio:${value}`));
    this.amount.valueChanges.subscribe((value) => changes.push(`number:${value}`));
    this.volume.valueChanges.subscribe((value) => changes.push(`knob:${value}`));
    this.date.valueChanges.subscribe((value) => changes.push(`date:${value}`));
  }
}
core.Component({
  selector: 'app-root',
  standalone: true,
  imports: [
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
    <neu-input id="ssr-input" label="SSR input" [required]="true" [readonly]="true" [formControl]="input" />
    <neu-checkbox id="ssr-checkbox" label="SSR checkbox" [required]="true" [formControl]="checkbox" />
    <neu-input id="ssr-disabled-input" label="Disabled" [disabled]="true" />
    <neu-textarea id="ssr-textarea" [formControl]="textarea" />
    <neu-password id="ssr-password" [formControl]="password" />
    <neu-input-mask id="ssr-mask" mask="999-999" [formControl]="mask" />
    <neu-input-otp id="ssr-otp" [length]="4" [formControl]="otp" />
    <neu-switch id="ssr-switch" [formControl]="enabled" />
    <neu-radio-group id="ssr-radio" ariaLabel="Role" [formControl]="role">
      <neu-radio value="admin" /><neu-radio value="user" />
    </neu-radio-group>
    <neu-number-input id="ssr-number" [formatOptions]="numberFormat" [formControl]="amount" />
    <neu-knob id="ssr-knob" [formControl]="volume" />
    <neu-date-input id="ssr-date" locale="es-ES" [formControl]="date" />
  `,
})(N2FormsSsr);

const html = await renderApplication(
  (context) =>
    bootstrapApplication(
      N2FormsSsr,
      {
        providers: [
          provideServerRendering(),
          provideClientHydration(),
          core.provideZonelessChangeDetection(),
        ],
      },
      context,
    ),
  { document: '<!doctype html><html><body><app-root></app-root></body></html>', url: '/' },
);

assert.match(html, /id="ssr-input"/);
assert.match(html, /value="server-value"/);
assert.match(html, /readonly/);
assert.match(html, /id="ssr-checkbox"/);
assert.match(html, /checked/);
assert.match(html, /required/);
assert.match(html, /id="ssr-disabled-input"/);
assert.match(html, /disabled/);
for (const id of [
  'ssr-textarea',
  'ssr-password',
  'ssr-mask',
  'ssr-otp',
  'ssr-switch',
  'ssr-radio',
  'ssr-number',
  'ssr-knob',
  'ssr-date',
]) {
  assert.match(html, new RegExp(`id="${id}"`));
}
assert.match(html, /server-notes/);
assert.match(html, /Server1!/);
assert.match(html, /123-456/);
assert.match(html, /aria-label="Role"/);
assert.match(html, /1\.234,50/);
assert.match(html, /aria-valuenow="1234\.5"/);
assert.match(html, /29\/03\/2026/);
assert.match(html, /ngh=/);
assert.deepEqual(changes, []);
console.log(
  'N2 Forms SSR passed for all 11 controls: values, states, explicit locale, hydration annotations and zero write echo',
);
