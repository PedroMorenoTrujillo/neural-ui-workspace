import {
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { InternalNeuIconOutletComponent, neuSemanticIconText } from '@neural-ui/core/icon-outlet-internal';
import type { NeuIconKey } from '@neural-ui/core/foundation';
import { neuIconInbox as iconInbox } from '@neural-ui/core/internal';
import { NeuButtonComponent } from '@neural-ui/core/button';
import type { NeuDensity } from '@neural-ui/core';

export type NeuEmptyStateSize = 'sm' | 'md' | 'lg';
export type NeuEmptyStateTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success';

/**
 * NeuEmptyState — Estado vacío con icono Neural, título, descripción y acción.
 *
 * Uso:
 *   <neu-empty-state
 *     icon="inbox"
 *     title="Sin resultados"
 *     description="Prueba con otros filtros."
 *     actionLabel="Limpiar filtros"
 *     (action)="clearFilters()"
 *   />
 */
@Component({
  selector: 'neu-empty-state',
  imports: [InternalNeuIconOutletComponent, NeuButtonComponent],
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'hostClasses()' },
  template: `
    <div class="neu-empty-state__inner">
      @if (icon()) {
        <span class="neu-empty-state__icon">
          <neu-icon-outlet [icon]="icon() === 'inbox' ? iconInbox : icon()!" [fallbackText]="iconFallbackText(icon() === 'inbox' ? iconInbox : icon()!)" [size]="iconSize()" aria-hidden="true" />
        </span>
      }

      <p class="neu-empty-state__title">{{ title() }}</p>

      @if (description()) {
        <p class="neu-empty-state__desc">{{ description() }}</p>
      }

      @if (actionLabel()) {
        <button neu-button tone="brand" variant="solid" size="md" (click)="action.emit()">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styleUrl: './neu-empty-state.component.scss',
})
export class NeuEmptyStateComponent {
  protected readonly iconFallbackText = neuSemanticIconText;
  protected readonly iconInbox = iconInbox;
  /** Canonical Neural icon name; the built-in inbox icon needs no registration. */
  icon = input<NeuIconKey | null>('inbox');
  /** Tamaño del icono. Por defecto 3rem. / Icon size. Default 3rem. */
  iconSize = input<string>('3rem');
  /** Título principal del estado vacío. / Main title of the empty state. */
  title = input<string>('Nothing to see here');
  /** Descripción secundaria opcional. / Optional secondary description. */
  description = input<string>('');
  /** Texto del botón de acción. Si está vacío, no se muestra el botón. / Action button text. If empty, the button is not shown. */
  actionLabel = input<string>('');
  /** Tamaño visual del estado vacío / Visual empty state size */
  size = input<NeuEmptyStateSize>('md');
  /** Tono semántico del icono y fondo / Semantic tone for icon and background */
  tone = input<NeuEmptyStateTone>('neutral');
  /** Compactación espacial para tablas, listas y overlays / Spatial compactness */
  density = input<NeuDensity>('normal');

  /** Emite cuando el usuario hace clic en el botón de acción. / Emits when the user clicks the action button. */
  action = output<void>();

  hostClasses(): Record<string, boolean> {
    return {
      'neu-empty-state': true,
      [`neu-empty-state--${this.size()}`]: true,
      [`neu-empty-state--${this.tone()}`]: true,
      [`neu-empty-state--density-${this.density()}`]: true,
    };
  }
}
