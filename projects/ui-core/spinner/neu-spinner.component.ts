import {
  Component,
  ViewEncapsulation,
  input,
} from '@angular/core';

export type NeuSpinnerTone = 'neutral' | 'brand' | 'success' | 'info' | 'warning' | 'danger';

/**
 * NeuralUI Spinner Component
 *
 * Indicador de carga circular animado para estados de espera.
 * Permite personalizar color mediante tone o color CSS directo.
 *
 * Uso básico:
 *   <neu-spinner />
 *
 * Con tone:
 *   <neu-spinner tone="success" size="48px" />
 *
 * Con color personalizado:
 *   <neu-spinner color="#ff6b35" strokeWidth="6" />
 */
@Component({
  selector: 'neu-spinner',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-spinner-host', role: 'status', 'aria-live': 'polite' },
  template: `
    <svg
      class="neu-spinner"
      [class]="'neu-spinner--' + tone()"
      [style.width]="size()"
      [style.height]="size()"
      [style.animation-duration]="animationDuration()"
      viewBox="25 25 50 50"
      aria-hidden="true"
    >
      <circle
        class="neu-spinner__track"
        cx="50"
        cy="50"
        r="20"
        fill="none"
        [attr.stroke-width]="strokeWidth()"
      />
      <circle
        class="neu-spinner__arc"
        cx="50"
        cy="50"
        r="20"
        fill="none"
        [attr.stroke-width]="strokeWidth()"
        [style.stroke]="color() || null"
      />
    </svg>
    @if (label()) {
      <span class="neu-spinner__label">{{ label() }}</span>
    } @else {
      <span class="neu-spinner__sr-only">{{ ariaLabel() }}</span>
    }
  `,
  styleUrl: './neu-spinner.component.scss',
})
export class NeuSpinnerComponent {
  /** Intención semántica / Semantic intent */
  tone = input<NeuSpinnerTone>('brand');

  /** Color CSS directo — sobreescribe tone / Direct CSS color — overrides tone */
  color = input<string>('');

  /** Grosor del trazo SVG (unidades SVG) / SVG stroke width (SVG units) */
  strokeWidth = input<string>('4');

  /** Tamaño del spinner (CSS: '40px', '2rem', etc.) / Spinner size (CSS: '40px', '2rem', etc.) */
  size = input<string>('40px');

  /** Duración de la animación de rotación / Rotation animation duration */
  animationDuration = input<string>('1s');

  /** Etiqueta visible opcional junto al spinner / Optional visible label beside the spinner */
  label = input<string>('');

  /** Texto accesible cuando no se muestra label / Accessible text when label is not displayed */
  ariaLabel = input<string>('Loading...');

}
