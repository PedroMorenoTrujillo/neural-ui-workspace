import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

export type NeuProgressVariant = 'primary' | 'success' | 'warning' | 'danger';

/**
 * NeuralUI ProgressBar Component
 *
 * Barra de progreso accesible con valor, etiqueta y variantes semánticas.
 * Soporte para modo indeterminado (animación continua).
 *
 * Uso:
 *   <neu-progress-bar [value]="75" />
 *   <neu-progress-bar [value]="75" label="Cargando..." variant="success" [showValue]="true" />
 *   <neu-progress-bar [indeterminate]="true" />
 */
@Component({
  selector: 'neu-progress-bar',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        [attr.aria-label]="label() || 'Progreso'"
        [attr.aria-valuetext]="indeterminate() ? 'Cargando...' : clampedValue() + '%'"
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
  /** Valor de 0 a 100 */
  value = input<number>(0);

  /** Variante de color */
  variant = input<NeuProgressVariant>('primary');

  /** Etiqueta descriptiva sobre la barra */
  label = input<string>('');

  /** Muestra el % a la derecha */
  showValue = input<boolean>(false);

  /** Modo indeterminado (animación continua) */
  indeterminate = input<boolean>(false);

  /** Altura de la barra */
  size = input<'sm' | 'md' | 'lg'>('md');

  readonly clampedValue = computed(() => Math.min(100, Math.max(0, this.value())));

  readonly hostClasses = computed(() =>
    [`neu-progress--${this.variant()}`, `neu-progress--${this.size()}`].join(' '),
  );
}
