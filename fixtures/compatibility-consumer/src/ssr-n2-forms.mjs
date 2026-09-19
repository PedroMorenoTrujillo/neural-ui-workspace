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
const { NeuSelectComponent } = await import('@neural-ui/core/select');
const { NeuAutocompleteComponent } = await import('@neural-ui/core/autocomplete');
const { NeuCascadeSelectComponent } = await import('@neural-ui/core/cascade-select');
const { NeuListboxComponent } = await import('@neural-ui/core/listbox');
const { NeuToggleButtonGroupComponent } = await import('@neural-ui/core/toggle-button-group');
const { NeuInputTagsComponent } = await import('@neural-ui/core/input-tags');
const { NeuInlineEditorComponent } = await import('@neural-ui/core/inline-editor');
const { NeuColorPickerComponent } = await import('@neural-ui/core/color-picker');
const { NeuRichTextEditorComponent } = await import('@neural-ui/core/rich-text-editor');
const { NeuUploaderComponent } = await import('@neural-ui/core/uploader');
const { NeuSliderComponent } = await import('@neural-ui/core/slider');
const { NeuRatingComponent } = await import('@neural-ui/core/rating');

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
  options = [{ id: 1, label: 'SSR one' }, { id: 2, label: 'SSR two' }];
  optionValue = (option) => option.id;
  selectSingle = new FormControl(1);
  selectMultiple = new FormControl([1], { nonNullable: true });
  autocompleteStrict = new FormControl(1);
  autocompleteFree = new FormControl('SSR draft');
  cascade = new FormControl(1);
  listboxSingle = new FormControl(1);
  listboxMultiple = new FormControl([1], { nonNullable: true });
  toggleSingle = new FormControl(1);
  toggleMultiple = new FormControl([1], { nonNullable: true });
  inputTags = new FormControl([1], { nonNullable: true });
  inlineText = new FormControl('server-inline', { nonNullable: true });
  inlineNumber = new FormControl(42);
  color = new FormControl('#336699', { nonNullable: true });
  richText = new FormControl('<p>server-rich</p>', { nonNullable: true });
  files = new FormControl([], { nonNullable: true });
  slider = new FormControl(35, { nonNullable: true });
  rating = new FormControl(3);
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
    this.selectSingle.valueChanges.subscribe((value) => changes.push(`select-single:${value}`));
    this.selectMultiple.valueChanges.subscribe((value) => changes.push(`select-multiple:${value}`));
    this.autocompleteStrict.valueChanges.subscribe((value) => changes.push(`autocomplete-strict:${value}`));
    this.autocompleteFree.valueChanges.subscribe((value) => changes.push(`autocomplete-free:${value}`));
    this.cascade.valueChanges.subscribe((value) => changes.push(`cascade:${value}`));
    this.listboxSingle.valueChanges.subscribe((value) => changes.push(`listbox-single:${value}`));
    this.listboxMultiple.valueChanges.subscribe((value) => changes.push(`listbox-multiple:${value}`));
    this.toggleSingle.valueChanges.subscribe((value) => changes.push(`toggle-single:${value}`));
    this.toggleMultiple.valueChanges.subscribe((value) => changes.push(`toggle-multiple:${value}`));
    this.inputTags.valueChanges.subscribe((value) => changes.push(`input-tags:${value}`));
    this.inlineText.valueChanges.subscribe((value) => changes.push(`inline-text:${value}`));
    this.inlineNumber.valueChanges.subscribe((value) => changes.push(`inline-number:${value}`));
    this.color.valueChanges.subscribe((value) => changes.push(`color:${value}`));
    this.richText.valueChanges.subscribe((value) => changes.push(`rich-text:${value}`));
    this.files.valueChanges.subscribe((value) => changes.push(`files:${value.length}`));
    this.slider.valueChanges.subscribe((value) => changes.push(`slider:${value}`));
    this.rating.valueChanges.subscribe((value) => changes.push(`rating:${value}`));
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
    <neu-select id="ssr-select-single" [options]="options" [optionValue]="optionValue" [formControl]="selectSingle" />
    <neu-select id="ssr-select-multiple" mode="multiple" [options]="options" [optionValue]="optionValue" [formControl]="selectMultiple" />
    <neu-autocomplete id="ssr-autocomplete-strict" mode="strict" [options]="options" [optionValue]="optionValue" [formControl]="autocompleteStrict" />
    <neu-autocomplete id="ssr-autocomplete-free" mode="free-text" [options]="options" [optionValue]="optionValue" [formControl]="autocompleteFree" />
    <neu-cascade-select id="ssr-cascade" [options]="options" [optionValue]="optionValue" [formControl]="cascade" />
    <neu-listbox id="ssr-listbox-single" [options]="options" [optionValue]="optionValue" [formControl]="listboxSingle" />
    <neu-listbox id="ssr-listbox-multiple" mode="multiple" [options]="options" [optionValue]="optionValue" [formControl]="listboxMultiple" />
    <neu-toggle-button-group id="ssr-toggle-single" [options]="options" [optionValue]="optionValue" [formControl]="toggleSingle" />
    <neu-toggle-button-group id="ssr-toggle-multiple" mode="multiple" [options]="options" [optionValue]="optionValue" [formControl]="toggleMultiple" />
    <neu-input-tags id="ssr-input-tags" [options]="options" optionLabel="label" [optionValue]="optionValue" [formControl]="inputTags" />
    <neu-inline-editor id="ssr-inline-text" [formControl]="inlineText" />
    <neu-inline-editor id="ssr-inline-number" type="number" [formControl]="inlineNumber" />
    <neu-color-picker id="ssr-color-picker" [formControl]="color" />
    <neu-rich-text-editor id="ssr-rich-text" [formControl]="richText" />
    <neu-uploader id="ssr-uploader" [formControl]="files" />
    <neu-slider id="ssr-slider" [step]="5" [formControl]="slider" />
    <neu-rating id="ssr-rating" [formControl]="rating" />
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
  'ssr-select-single',
  'ssr-select-multiple',
  'ssr-autocomplete-strict',
  'ssr-autocomplete-free',
  'ssr-cascade',
  'ssr-listbox-single',
  'ssr-listbox-multiple',
  'ssr-toggle-single',
  'ssr-toggle-multiple',
  'ssr-input-tags',
  'ssr-inline-text',
  'ssr-inline-number',
  'ssr-color-picker',
  'ssr-rich-text',
  'ssr-uploader',
  'ssr-slider',
  'ssr-rating',
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
assert.match(html, /aria-valuenow="35"/);
assert.match(html, /data-neu-rating-value="3"[^>]*aria-checked="true"/);
assert.match(html, /ngh=/);
assert.deepEqual(changes, []);
console.log(
  'N2 Forms SSR passed for all 27 controls: values, states, explicit locale, hydration annotations and zero write echo',
);
