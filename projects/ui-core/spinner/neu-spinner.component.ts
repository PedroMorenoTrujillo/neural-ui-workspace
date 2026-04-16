import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

export type NeuSpinnerSeverity = 'primary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * NeuralUI Spinner Component
 *
 * Indicador de carga circular animado para estados de espera.
 * Permite personalizar color via severity o color CSS directo.
 *
 * Uso básico:
 *   <neu-spinner />
 *
 * Con severity:
 *   <neu-spinner severity="success" size="48px" />
 *
 * Con color personalizado:
 *   <neu-spinner color="#ff6b35" strokeWidth="6" />
 */
@Component({
  selector: 'neu-spinner',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-spinner-host' },
  template: `
    <svg
      class="neu-spinner"
      [class]="'neu-spinner--' + severity()"
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
    <span class="cdk-visually-hidden">{{ ariaLabel() }}</span>
  `,
  styleUrl: './neu-spinner.component.scss',
})
export class NeuSpinnerComponent {
  /** Variante de color semántica / Semantic color variant */
  severity = input<NeuSpinnerSeverity>('primary');

  /** Color CSS directo — sobreescribe severity / Direct CSS color — overrides severity */
  color = input<string>('');

  /** Grosor del trazo SVG (unidades SVG) / SVG stroke width (SVG units) */
  strokeWidth = input<string>('4');

  /** Tamaño del spinner (CSS: '40px', '2rem', etc.) / Spinner size (CSS: '40px', '2rem', etc.) */
  size = input<string>('40px');

  /** Duración de la animación de rotación / Rotation animation duration */
  animationDuration = input<string>('1s');

  /** Texto accesible para lectores de pantalla / Accessible text for screen readers */
  ariaLabel = input<string>('Cargando...');

  readonly _severityColor = computed(() => {
    const map: Record<NeuSpinnerSeverity, string> = {
      primary: 'var(--neu-primary)',
      success: 'var(--neu-success)',
      warning: 'var(--neu-warning)',
      danger: 'var(--neu-danger)',
      info: 'var(--neu-info)',
    };
    return map[this.severity()];
  });
}
