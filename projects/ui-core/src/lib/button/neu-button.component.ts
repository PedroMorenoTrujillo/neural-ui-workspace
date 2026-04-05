import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

export type NeuButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type NeuButtonSize = 'sm' | 'md' | 'lg';

/**
 * NeuralUI Button Component
 *
 * Uso: <button neu-button variant="primary" size="md">Texto</button>
 *
 * Signals: variant, size, disabled, loading, fullWidth son inputs reactivos.
 * El estado se computa automáticamente con computed().
 */
@Component({
  selector: 'button[neu-button]',
  standalone: true,
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled()',
    '[attr.aria-busy]': 'loading()',
  },
  template: `
    @if (loading()) {
      <span class="neu-button__spinner" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-dasharray="31.416"
            stroke-dashoffset="10"
          />
        </svg>
      </span>
    }
    <ng-content />
  `,
  styleUrl: './neu-button.component.scss',
})
export class NeuButtonComponent {
  /** Variante visual del botón */
  variant = input<NeuButtonVariant>('primary');

  /** Tamaño del botón */
  size = input<NeuButtonSize>('md');

  /** Deshabilita el botón y bloquea la interacción */
  disabled = input<boolean>(false);

  /** Muestra un spinner y deshabilita mientras se procesa */
  loading = input<boolean>(false);

  /** Ocupa el 100% del ancho de su contenedor */
  fullWidth = input<boolean>(false);

  /** Emite el evento de click cuando el botón está activo */
  neuClick = output<MouseEvent>();

  readonly isDisabled = computed(() => this.disabled() || this.loading());

  readonly hostClasses = computed(() => ({
    'neu-button': true,
    [`neu-button--${this.variant()}`]: true,
    [`neu-button--${this.size()}`]: true,
    'neu-button--loading': this.loading(),
    'neu-button--disabled': this.isDisabled(),
    'neu-button--full-width': this.fullWidth(),
  }));
}
