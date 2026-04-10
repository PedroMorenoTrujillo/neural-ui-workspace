import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { NeuIconComponent } from '../icon/neu-icon.component';
import { NeuButtonComponent } from '../button/neu-button.component';

/**
 * NeuEmptyState — Estado vacío con icono Lucide, título, descripción y acción.
 *
 * Uso:
 *   <neu-empty-state
 *     icon="lucideInbox"
 *     title="Sin resultados"
 *     description="Prueba con otros filtros."
 *     actionLabel="Limpiar filtros"
 *     (action)="clearFilters()"
 *   />
 */
@Component({
  selector: 'neu-empty-state',
  imports: [NeuIconComponent, NeuButtonComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-empty-state' },
  template: `
    <div class="neu-empty-state__inner">
      @if (icon()) {
        <span class="neu-empty-state__icon">
          <neu-icon [name]="icon()" [size]="iconSize()" />
        </span>
      }

      <p class="neu-empty-state__title">{{ title() }}</p>

      @if (description()) {
        <p class="neu-empty-state__desc">{{ description() }}</p>
      }

      @if (actionLabel()) {
        <button neu-button variant="primary" size="md" (click)="action.emit()">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styleUrl: './neu-empty-state.component.scss',
})
export class NeuEmptyStateComponent {
  /** Nombre del icono Lucide registrado con provideIcons(). / Lucide icon name registered with provideIcons(). */
  icon = input<string>('lucideInbox');
  /** Tamaño del icono. Por defecto 3rem. / Icon size. Default 3rem. */
  iconSize = input<string>('3rem');
  /** Título principal del estado vacío. / Main title of the empty state. */
  title = input<string>('No hay nada aquí');
  /** Descripción secundaria opcional. / Optional secondary description. */
  description = input<string>('');
  /** Texto del botón de acción. Si está vacío, no se muestra el botón. / Action button text. If empty, the button is not shown. */
  actionLabel = input<string>('');

  /** Emite cuando el usuario hace clic en el botón de acción. / Emits when the user clicks the action button. */
  action = output<void>();
}
