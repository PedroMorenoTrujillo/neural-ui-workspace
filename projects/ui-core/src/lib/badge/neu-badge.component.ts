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
 * Etiqueta de estado compacta y semántica.
 *
 * Uso: <neu-badge variant="success">Activo</neu-badge>
 *      <neu-badge variant="danger" [dot]="true">Error</neu-badge>
 */
@Component({
  selector: 'neu-badge',
  standalone: true,
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
  /** Variante semántica */
  variant = input<NeuBadgeVariant>('default');

  /** Tamaño */
  size = input<NeuBadgeSize>('md');

  /** Muestra un punto de color a la izquierda */
  dot = input<boolean>(false);

  /** Estilo con solo borde (outline) sin relleno */
  outline = input<boolean>(false);

  /** Estilo completamente redondeado (pill) */
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
