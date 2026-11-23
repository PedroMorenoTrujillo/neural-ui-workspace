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
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuSelectComponent, type NeuSelectOption } from '@neural-ui/core/select';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js/max';
import {
  createNeuPhoneInputValue,
  type NeuPhoneInputValue,
  type NeuPhoneRegion,
} from './neu-phone-input.value';

const REGIONS = getCountries();

@Component({
  selector: 'neu-phone-input',
  imports: [NeuInputComponent, NeuSelectComponent],
  template: `
    @if (!hidden()) {
      <fieldset [disabled]="disabled()">
        <legend>{{ label() || labels().phone }}</legend>
        <div class="neu-phone-input__controls">
          <neu-select
            #country
            mode="single"
            [label]="labels().region"
            [options]="regionOptions()"
            [value]="region()"
            [disabled]="disabled() || readonly()"
            [searchable]="true"
            [searchPlaceholder]="labels().search"
            [ariaFilterLabel]="labels().search"
            [filterConfig]="countryFilter"
            [fluid]="true"
            (valueChange)="changeRegion($event)"
            (focusLeft)="onFocusOut($event)"
          />
          <neu-input
            #number
            dir="ltr"
            type="tel"
            autocomplete="tel"
            [floatingLabel]="false"
            [label]="labels().number"
            [name]="name()"
            [value]="value()?.raw ?? ''"
            [disabled]="disabled()"
            [readonly]="readonly()"
            [required]="required()"
            [invalid]="invalid()"
            [hint]="hint()"
            [errorMessage]="resolvedError()"
            (valueChange)="edit($event)"
            (focusout)="onFocusOut($event)"
          />
        </div>
      </fieldset>
    }
  `,
  styleUrl: './neu-phone-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeuPhoneInputComponent implements FormValueControl<NeuPhoneInputValue | null> {
  private readonly locale = inject(NEURAL_LOCALE);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly numberInput = viewChild<NeuInputComponent>('number');
  private readonly countryInput = viewChild<NeuSelectComponent<NeuSelectOption<NeuPhoneRegion>, NeuPhoneRegion>>('country');

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

  protected readonly countryFilter = { locale: this.locale };
  protected readonly region = linkedSignal(() => this.value()?.region ?? this.defaultRegion());
  protected readonly labels = computed(() =>
    this.locale.toLowerCase().startsWith('es')
      ? { phone: 'Teléfono', number: 'Número', region: 'País o región', search: 'Buscar país o prefijo' }
      : { phone: 'Phone', number: 'Number', region: 'Country or region', search: 'Search country or calling code' },
  );
  protected readonly regionOptions = computed(() => {
    const names = new Intl.DisplayNames([this.locale, 'en'], { type: 'region' });
    const order = new Intl.Collator(this.locale);
    return REGIONS.map((code) => ({
      value: code,
      label: (names.of(code) ?? code) + ' (+' + getCountryCallingCode(code) + ')',
    })).sort((a, b) => order.compare(a.label, b.label));
  });
  protected readonly resolvedError = computed(() =>
    this.invalid() ? this.errorMessage() || this.errors()[0]?.message || '' : '',
  );

  focus(options?: FocusOptions): void {
    this.numberInput()?.focus(options);
  }

  reset(): void {
    this.region.set(this.value()?.region ?? this.defaultRegion());
  }

  protected changeRegion(value: NeuPhoneRegion | null): void {
    const previousRegion = this.region();
    if (value === previousRegion) return;
    const nextRegion = REGIONS.find((code) => code === value);
    if (this.disabled() || this.readonly() || !nextRegion) {
      this.countryInput()?.value.set(previousRegion);
      return;
    }
    const current = this.value();
    const raw = current?.raw ?? '';
    // The region disambiguates national numbers. It does not override an explicit calling code.
    const next = createNeuPhoneInputValue(raw, nextRegion);
    const effectiveRegion = next?.region ?? nextRegion;
    this.region.set(effectiveRegion);
    // Reset the child model when an explicit calling code keeps the previous region.
    if (effectiveRegion !== value) this.countryInput()?.value.set(effectiveRegion);
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
    if (!(target instanceof Node) || !this.element.nativeElement.contains(target)) {
      this.touch.emit();
    }
  }
}
