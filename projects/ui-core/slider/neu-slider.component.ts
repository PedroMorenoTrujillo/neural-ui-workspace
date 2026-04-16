import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

/**
 * NeuralUI Slider Component
 *
 * Control deslizante accesible que envuelve el <input type="range">
 * nativo con estilos personalizados y tooltips de valor.
 *
 * Uso:
 *   <neu-slider [value]="volume" (valueChange)="volume = $event" />
 *   <neu-slider [value]="50" [min]="0" [max]="100" [step]="5" [showValue]="true" />
 */
@Component({
  selector: 'neu-slider',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="neu-slider" [class.neu-slider--disabled]="disabled()">
      @if (label()) {
        <div class="neu-slider__header">
          <label class="neu-slider__label" [for]="sliderId">{{ label() }}</label>
          @if (showValue()) {
            <span class="neu-slider__value">{{ value() }}{{ unit() }}</span>
          }
        </div>
      } @else if (showValue()) {
        <div class="neu-slider__header">
          <span></span>
          <span class="neu-slider__value">{{ value() }}{{ unit() }}</span>
        </div>
      }
      <div class="neu-slider__track-wrap">
        <div class="neu-slider__track">
          <div class="neu-slider__fill" [style.width.%]="fillPercent()"></div>
        </div>
        <input
          class="neu-slider__input"
          type="range"
          [id]="sliderId"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [value]="value()"
          [disabled]="disabled()"
          [attr.aria-label]="label() || 'Slider'"
          [attr.aria-valuenow]="value()"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          (input)="onInput($event)"
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
export class NeuSliderComponent {
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

  readonly fillPercent = computed(() => {
    const range = this.max() - this.min();
    if (range === 0) return 0;
    return ((this.value() - this.min()) / range) * 100;
  });

  onInput(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.valueChange.emit(val);
  }
}
