import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  viewChild,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js/max';
import {
  createNeuPhoneInputValue,
  type NeuPhoneInputValue,
  type NeuPhoneRegion,
} from './neu-phone-input.value';

const REGIONS = getCountries();

@Component({
  selector: 'neu-phone-input',
  template: `
    @if (!hidden()) {
      <fieldset [disabled]="disabled()" (focusout)="onFocusOut($event)">
        <legend>{{ label() || labels().phone }}</legend>
        <div class="neu-phone-input__controls">
          <div>
            <label [for]="countryId">{{ labels().region }}</label>
            <select
              #country
              [id]="countryId"
              [value]="region()"
              [disabled]="readonly()"
              (change)="changeRegion(country.value)"
            >
              @for (option of regionOptions(); track option.code) {
                <option [value]="option.code" [selected]="option.code === region()">
                  {{ option.label }}
                </option>
              }
            </select>
          </div>
          <div>
            <label [for]="numberId">{{ labels().number }}</label>
            <input
              #number
              [id]="numberId"
              type="tel"
              autocomplete="tel"
              [name]="name()"
              [value]="value()?.raw ?? ''"
              [readOnly]="readonly()"
              [required]="required()"
              [attr.aria-invalid]="invalid() ? 'true' : null"
              [attr.aria-describedby]="description() ? descriptionId : null"
              (input)="edit(number.value)"
            />
          </div>
        </div>
        @if (description(); as text) {
          <div [id]="descriptionId">{{ text }}</div>
        }
      </fieldset>
    }
  `,
  styleUrl: './neu-phone-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeuPhoneInputComponent implements FormValueControl<NeuPhoneInputValue | null> {
  private readonly locale = inject(NEURAL_LOCALE);
  private readonly id = inject(NeuIdGenerator).getId('neu-phone-input');
  private readonly numberInput = viewChild<ElementRef<HTMLInputElement>>('number');

  readonly value = model<NeuPhoneInputValue | null>(null);
  readonly defaultRegion = input<NeuPhoneRegion>('US');
  readonly label = input('');
  readonly name = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly hidden = input(false);
  readonly invalid = input(false);
  readonly required = input(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly touch = output<void>();

  protected readonly countryId = this.id + '-region';
  protected readonly numberId = this.id + '-number';
  protected readonly descriptionId = this.id + '-description';
  protected readonly region = linkedSignal(() => this.value()?.region ?? this.defaultRegion());
  protected readonly labels = computed(() =>
    this.locale.toLowerCase().startsWith('es')
      ? { phone: 'Teléfono', number: 'Número', region: 'País o región' }
      : { phone: 'Phone', number: 'Number', region: 'Country or region' },
  );
  protected readonly regionOptions = computed(() => {
    const names = new Intl.DisplayNames([this.locale, 'en'], { type: 'region' });
    const order = new Intl.Collator(this.locale);
    return REGIONS.map((code) => ({
      code,
      label: (names.of(code) ?? code) + ' (+' + getCountryCallingCode(code) + ')',
    })).sort((a, b) => order.compare(a.label, b.label));
  });
  protected readonly description = computed(() =>
    this.invalid() ? this.errorMessage() || this.errors()[0]?.message || this.hint() : this.hint(),
  );

  focus(options?: FocusOptions): void {
    this.numberInput()?.nativeElement.focus(options);
  }

  reset(): void {
    this.region.set(this.value()?.region ?? this.defaultRegion());
  }

  protected changeRegion(value: string): void {
    if (this.disabled() || this.readonly()) return;
    const nextRegion = REGIONS.find((code) => code === value);
    if (!nextRegion) return;
    const current = this.value();
    const raw = current?.raw ?? '';
    // The region disambiguates national numbers. It does not override an explicit calling code.
    const next = createNeuPhoneInputValue(raw, nextRegion);
    this.region.set(next?.region ?? nextRegion);
    this.value.set(next);
  }

  protected edit(raw: string): void {
    if (this.disabled() || this.readonly()) return;
    const region = this.region();
    const next = createNeuPhoneInputValue(raw, region);
    this.value.set(next);
    this.region.set(next?.region ?? region);
  }

  protected onFocusOut(event: FocusEvent): void {
    const target = event.relatedTarget;
    if (!(target instanceof Node) || !(event.currentTarget as HTMLElement).contains(target)) {
      this.touch.emit();
    }
  }
}
