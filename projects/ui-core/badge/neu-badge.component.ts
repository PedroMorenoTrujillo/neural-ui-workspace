import {
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

export type NeuBadgeTone = 'neutral' | 'success' | 'info' | 'warning' | 'danger';
export type NeuBadgeVariant = 'soft' | 'outline';
export type NeuBadgeSize = 'sm' | 'md';

/**
 * NeuralUI Badge Component
 *
 * Etiqueta de estado compacta y semántica. / Compact and semantic status label.
 *
 * Uso: <neu-badge tone="success">Activo</neu-badge>
 *      <neu-badge tone="danger" variant="outline" [dot]="true">Error</neu-badge>
 */
@Component({
  selector: 'neu-badge',
  imports: [],
  encapsulation: ViewEncapsulation.None,
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
  /** Intención semántica / Semantic intent */
  tone = input<NeuBadgeTone>('neutral');

  /** Tratamiento visual / Visual treatment */
  variant = input<NeuBadgeVariant>('soft');

  /** Tamaño / Size */
  size = input<NeuBadgeSize>('md');

  /** Muestra un punto de color a la izquierda / Shows a colored dot on the left */
  dot = input<boolean>(false);

  /** Estilo completamente redondeado (pill) / Fully rounded style (pill) */
  pill = input<boolean>(true);

  readonly hostClasses = computed(() => ({
    'neu-badge': true,
    [`neu-badge--${this.tone()}`]: true,
    [`neu-badge--${this.variant()}`]: true,
    [`neu-badge--${this.size()}`]: true,
    'neu-badge--pill': this.pill(),
    'neu-badge--dot': this.dot(),
  }));
}
