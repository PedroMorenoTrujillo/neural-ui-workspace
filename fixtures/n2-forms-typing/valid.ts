import type { FormCheckboxControl, FormValueControl } from '@angular/forms/signals';
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
import type { NeuSelectionMode, NeuSelectionValue } from '@neural-ui/core/option-api';
import { NeuSelectComponent } from '@neural-ui/core/select';
import { NeuAutocompleteComponent } from '@neural-ui/core/autocomplete';
import { NeuCascadeSelectComponent } from '@neural-ui/core/cascade-select';
import { NeuListboxComponent } from '@neural-ui/core/listbox';
import { NeuToggleButtonGroupComponent } from '@neural-ui/core/toggle-button-group';
import { NeuInputTagsComponent } from '@neural-ui/core/input-tags';
import {
  NeuDateInputComponent,
  civilDate,
  localDateTime,
  localTime,
  type CivilDate,
  type CivilDateRange,
  type LocalDateTime,
  type LocalTime,
  type NeuDateMode,
  type NeuDateValue,
} from '@neural-ui/core/date-input';

declare const input: NeuInputComponent;
declare const checkbox: NeuCheckboxComponent;
declare const textarea: NeuTextareaComponent;
declare const password: NeuPasswordComponent;
declare const mask: NeuInputMaskComponent;
declare const otp: NeuInputOTPComponent;
declare const switchControl: NeuSwitchComponent;
type Role = 'admin' | 'user';
declare const radioGroup: NeuRadioGroupComponent<Role>;
declare const radio: NeuRadioComponent<Role>;
declare const numberInput: NeuNumberInputComponent;
declare const knob: NeuKnobComponent;
declare const dateInput: NeuDateInputComponent<'date'>;
declare const timeInput: NeuDateInputComponent<'time'>;
declare const dateTimeInput: NeuDateInputComponent<'datetime'>;
declare const multipleInput: NeuDateInputComponent<'multiple'>;
declare const rangeInput: NeuDateInputComponent<'range'>;
interface Person {
  readonly id: number;
  readonly name: string;
}
declare const selectSingle: NeuSelectComponent<Person, number, 'single'>;
declare const selectMultiple: NeuSelectComponent<Person, number, 'multiple'>;
declare const selectDynamic: NeuSelectComponent<Person, number, NeuSelectionMode>;
declare const autocompleteStrict: NeuAutocompleteComponent<Person, number, 'strict'>;
declare const autocompleteFreeText: NeuAutocompleteComponent<Person, number, 'free-text'>;
declare const cascadeSelect: NeuCascadeSelectComponent<Person, number>;
declare const listboxSingle: NeuListboxComponent<Person, number, 'single'>;
declare const listboxMultiple: NeuListboxComponent<Person, number, 'multiple'>;
declare const toggleSingle: NeuToggleButtonGroupComponent<Person, number, 'single'>;
declare const toggleMultiple: NeuToggleButtonGroupComponent<Person, number, 'multiple'>;
declare const stringTags: NeuInputTagsComponent<string, string>;
declare const mappedTags: NeuInputTagsComponent<Person, number>;

input.value.set('valid');
checkbox.checked.set(true);
textarea.value.set('notes');
password.value.set('secret');
mask.value.set('123-456');
otp.value.set('1234');
switchControl.checked.set(true);
radioGroup.value.set('admin');
radioGroup.value.set(null);
numberInput.value.set(12.5);
numberInput.value.set(0);
numberInput.value.set(null);
knob.value.set(50);
const option: Role = radio.value();
dateInput.value.set(civilDate('2026-03-29'));
dateInput.value.set(null);
timeInput.value.set(localTime('02:30'));
timeInput.value.set(null);
dateTimeInput.value.set(localDateTime('2026-03-29T02:30'));
dateTimeInput.value.set(null);
multipleInput.value.set([civilDate('2026-03-29')]);
rangeInput.value.set({ start: civilDate('2026-03-29'), end: null });
selectSingle.value.set(1);
selectSingle.value.set(null);
selectMultiple.value.set([1, 2] as const);
declare const dynamicSelectionValue: NeuSelectionValue<number, NeuSelectionMode>;
selectDynamic.value.set(dynamicSelectionValue);
autocompleteStrict.value.set(1);
autocompleteStrict.value.set(null);
autocompleteFreeText.value.set(1);
autocompleteFreeText.value.set('custom value');
autocompleteFreeText.value.set(null);
cascadeSelect.value.set(1);
cascadeSelect.value.set(null);
listboxSingle.value.set(1);
listboxSingle.value.set(null);
listboxMultiple.value.set([1, 2] as const);
toggleSingle.value.set(1);
toggleSingle.value.set(null);
toggleMultiple.value.set([1, 2] as const);
stringTags.value.set(['Angular', 'Signals'] as const);
mappedTags.value.set([1, 2] as const);

declare const dynamicMode: NeuDateMode;
declare const dynamicValue: NeuDateValue<typeof dynamicMode>;
const dynamicInput: NeuDateInputComponent<typeof dynamicMode> = {} as never;
dynamicInput.value.set(dynamicValue);

const valueControl: FormValueControl<string> = input;
const checkboxControl: FormCheckboxControl = checkbox;
const textareaControl: FormValueControl<string> = textarea;
const passwordControl: FormValueControl<string> = password;
const maskControl: FormValueControl<string> = mask;
const otpControl: FormValueControl<string> = otp;
const officialSwitch: FormCheckboxControl = switchControl;
const typedRadio: FormValueControl<Role | null> = radioGroup;
const officialNumber: FormValueControl<number | null> = numberInput;
const officialKnob: FormValueControl<number> = knob;
const officialDate: FormValueControl<CivilDate | null> = dateInput;
const officialTime: FormValueControl<LocalTime | null> = timeInput;
const officialDateTime: FormValueControl<LocalDateTime | null> = dateTimeInput;
const officialMultiple: FormValueControl<readonly CivilDate[]> = multipleInput;
const officialRange: FormValueControl<CivilDateRange> = rangeInput;
const officialSelectSingle: FormValueControl<number | null> = selectSingle;
const officialSelectMultiple: FormValueControl<readonly number[]> = selectMultiple;
const officialAutocompleteStrict: FormValueControl<number | null> = autocompleteStrict;
const officialAutocompleteFreeText: FormValueControl<number | string | null> = autocompleteFreeText;
const officialCascadeSelect: FormValueControl<number | null> = cascadeSelect;
const officialListboxSingle: FormValueControl<number | null> = listboxSingle;
const officialListboxMultiple: FormValueControl<readonly number[]> = listboxMultiple;
const officialToggleSingle: FormValueControl<number | null> = toggleSingle;
const officialToggleMultiple: FormValueControl<readonly number[]> = toggleMultiple;
const officialStringTags: FormValueControl<readonly string[]> = stringTags;
const officialMappedTags: FormValueControl<readonly number[]> = mappedTags;
void valueControl;
void checkboxControl;
void textareaControl;
void passwordControl;
void maskControl;
void otpControl;
void officialSwitch;
void typedRadio;
void officialNumber;
void officialKnob;
void officialDate;
void officialTime;
void officialDateTime;
void officialMultiple;
void officialRange;
void officialSelectSingle;
void officialSelectMultiple;
void officialAutocompleteStrict;
void officialAutocompleteFreeText;
void officialCascadeSelect;
void officialListboxSingle;
void officialListboxMultiple;
void officialToggleSingle;
void officialToggleMultiple;
void officialStringTags;
void officialMappedTags;
void dynamicInput;
void option;
