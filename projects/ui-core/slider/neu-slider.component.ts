import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * NeuralUI Slider Component
 *
 * Control deslizante accesible que envuelve el <input type="range">
 * nativo con estilos personalizados y tooltips de valor.
 *
 * Uso:
 *   <neu-slider [value]="volume" (valueChange)="volume = $event" />
 *   <neu-slider formControlName="volume" />
 *   <neu-slider [value]="50" [min]="0" [max]="100" [step]="5" [showValue]="true" />
 */
@Component({
  selector: 'neu-slider',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.dir]': 'direction()' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuSliderComponent),
      multi: true,
    },
  ],
  template: `
    <div class="neu-slider" [class.neu-slider--disabled]="isDisabled()">
      @if (label()) {
        <div class="neu-slider__header">
          <label class="neu-slider__label" [for]="sliderId">{{ label() }}</label>
          @if (showValue()) {
            <span class="neu-slider__value">{{ currentValue() }}{{ unit() }}</span>
          }
        </div>
      } @else if (showValue()) {
        <div class="neu-slider__header">
          <span></span>
          <span class="neu-slider__value">{{ currentValue() }}{{ unit() }}</span>
        </div>
      }
      <div class="neu-slider__track-wrap">
        <div class="neu-slider__track">
          <div class="neu-slider__fill" [style.inline-size.%]="fillPercent()"></div>
        </div>
        <input
          class="neu-slider__input"
          type="range"
          [id]="sliderId"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [value]="currentValue()"
          [disabled]="isDisabled()"
          [attr.aria-label]="label() || 'Slider'"
          [attr.aria-valuenow]="currentValue()"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          (input)="onInput($event)"
          (blur)="markTouched()"
        />
      </div>
      @if (showTicks()) {
        <div class="neu-slider__ticks">
          <span>{{ min() }}{{ unit() }}</span>
          <span>{{ (max() - min()) / 2 + min() }}{{ unit() }}</span>
          <span>{{ max() }}{{ unit() }}</span>
        </div>
      }
    </div>
  `,
  styleUrl: './neu-slider.component.scss',
})
export class NeuSliderComponent implements ControlValueAccessor {
  private readonly directionality = inject(Directionality);
  readonly direction = computed(() => this.directionality.valueSignal());
  private static _idCounter = 0;
  protected readonly sliderId = `neu-slider-${++NeuSliderComponent._idCounter}`;

  /** Valor actual / Current value */
  value = input<number>(0);

  /** Valor mínimo / Minimum value */
  min = input<number>(0);

  /** Valor máximo / Maximum value */
  max = input<number>(100);

  /** Paso / Step */
  step = input<number>(1);

  /** Etiqueta / Label */
  label = input<string>('');

  /** Muestra el valor numerico / Shows the numeric value */
  showValue = input<boolean>(true);

  /** Muestra min/mid/max bajo la barra / Shows min/mid/max below the bar */
  showTicks = input<boolean>(false);

  /** Unidad a mostrar junto al valor / Unit to display next to the value */
  unit = input<string>('');

  /** Deshabilitado / Disabled */
  disabled = input<boolean>(false);

  /** Emite al mover el slider / Emits when the slider moves */
  valueChange = output<number>();

  readonly cvaDisabled = signal(false);
  private readonly cvaActive = signal(false);
  private readonly cvaValue = signal(0);
  readonly currentValue = computed(() => (this.cvaActive() ? this.cvaValue() : this.value()));
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  readonly fillPercent = computed(() => {
    const range = this.max() - this.min();
    if (range === 0) return 0;
    return ((this.currentValue() - this.min()) / range) * 100;
  });

  writeValue(value: number | null): void {
    this.cvaActive.set(true);
    this.cvaValue.set(this.clamp(value ?? this.min()));
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.cvaDisabled.set(disabled);
  }

  markTouched(): void {
    this.onTouched();
  }

  onInput(event: Event): void {
    if (this.isDisabled()) return;
    const val = this.clamp(Number((event.target as HTMLInputElement).value));
    if (this.cvaActive()) this.cvaValue.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
  }

  private clamp(value: number): number {
    return Math.min(this.max(), Math.max(this.min(), value));
  }
}
