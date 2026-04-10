import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

export type NeuBadgeVariant = 'default' | 'success' | 'info' | 'warning' | 'danger';
export type NeuBadgeSize = 'sm' | 'md';

/**
 * NeuralUI Badge Component
 *
 * Etiqueta de estado compacta y semántica. / Compact and semantic status label.
 *
 * Uso: <neu-badge variant="success">Activo</neu-badge>
 *      <neu-badge variant="danger" [dot]="true">Error</neu-badge>
 */
@Component({
  selector: 'neu-badge',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (dot()) {
      <span class="neu-badge__dot" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  styleUrl: './neu-badge.component.scss',
})
export class NeuBadgeComponent {
  /** Variante semántica / Semantic variant */
  variant = input<NeuBadgeVariant>('default');

  /** Tamaño / Size */
  size = input<NeuBadgeSize>('md');

  /** Muestra un punto de color a la izquierda / Shows a colored dot on the left */
  dot = input<boolean>(false);

  /** Estilo con solo borde (outline) sin relleno / Border-only style (outline) without fill */
  outline = input<boolean>(false);

  /** Estilo completamente redondeado (pill) / Fully rounded style (pill) */
  pill = input<boolean>(true);

  readonly hostClasses = computed(() => ({
    'neu-badge': true,
    [`neu-badge--${this.variant()}`]: true,
    [`neu-badge--${this.size()}`]: true,
    'neu-badge--outline': this.outline(),
    'neu-badge--pill': this.pill(),
    'neu-badge--dot': this.dot(),
  }));
}
