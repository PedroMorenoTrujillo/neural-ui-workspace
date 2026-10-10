import {
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';

export type NeuProgressTone = 'neutral' | 'brand' | 'success' | 'info' | 'warning' | 'danger';

/**
 * NeuralUI ProgressBar Component
 *
 * Barra de progreso accesible con valor, etiqueta y variantes semánticas.
 * Soporte para modo indeterminado (animación continua).
 *
 * Uso:
 *   <neu-progress-bar [value]="75" />
 *   <neu-progress-bar [value]="75" label="Cargando..." tone="success" [showValue]="true" />
 *   <neu-progress-bar [indeterminate]="true" />
 */
@Component({
  selector: 'neu-progress-bar',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="neu-progress" [class]="hostClasses()">
      @if (label()) {
        <div class="neu-progress__header">
          <span class="neu-progress__label">{{ label() }}</span>
          @if (showValue() && !indeterminate()) {
            <span class="neu-progress__value">{{ clampedValue() }}%</span>
          }
        </div>
      } @else if (showValue() && !indeterminate()) {
        <div class="neu-progress__header">
          <span></span>
          <span class="neu-progress__value">{{ clampedValue() }}%</span>
        </div>
      }
      <div
        class="neu-progress__track"
        role="progressbar"
        [attr.aria-valuenow]="indeterminate() ? null : clampedValue()"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="100"
        [attr.aria-label]="label() || defaultLabel"
        [attr.aria-valuetext]="indeterminate() ? loadingText : clampedValue() + '%'"
      >
        <div
          class="neu-progress__fill"
          [class.neu-progress__fill--indeterminate]="indeterminate()"
          [style.width.%]="indeterminate() ? null : clampedValue()"
        ></div>
      </div>
    </div>
  `,
  styleUrl: './neu-progress-bar.component.scss',
})
export class NeuProgressBarComponent {
  private readonly spanish = (inject(NEURAL_LOCALE, { optional: true }) ?? 'en').toLowerCase().startsWith('es');
  protected readonly defaultLabel = this.spanish ? 'Progreso' : 'Progress';
  protected readonly loadingText = this.spanish ? 'Cargando…' : 'Loading…';

  /** Valor de 0 a 100 / Value from 0 to 100 */
  value = input<number>(0);

  /** Intención semántica / Semantic intent */
  tone = input<NeuProgressTone>('brand');

  /** Etiqueta descriptiva sobre la barra / Descriptive label above the bar */
  label = input<string>('');

  /** Muestra el % a la derecha / Shows the % on the right */
  showValue = input<boolean>(false);

  /** Modo indeterminado (animación continua) / Indeterminate mode (continuous animation) */
  indeterminate = input<boolean>(false);

  /** Altura de la barra / Bar height */
  size = input<'sm' | 'md' | 'lg'>('md');

  readonly clampedValue = computed(() => {
    const value = this.value();
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  });

  readonly hostClasses = computed(() =>
    [`neu-progress--${this.tone()}`, `neu-progress--${this.size()}`].join(' '),
  );
}
