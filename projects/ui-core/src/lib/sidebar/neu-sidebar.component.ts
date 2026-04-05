import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { NeuUrlStateService } from '../url-state/neu-url-state.service';
import { NeuIconComponent } from '../icon/neu-icon.component';

/**
 * NeuralUI Sidebar Component
 *
 * El estado abierto/cerrado se gestiona automáticamente desde la URL
 * via NeuUrlStateService (?menu=open por defecto).
 *
 * Modos:
 *   - overlay (default): panel flotante sobre el contenido con backdrop
 *   - persistent: sidebar fijo integrado en el layout (desktop)
 *
 * Uso:
 *   <neu-sidebar urlParam="menu" [persistent]="isDesktop()">
 *     <span neu-sidebar-header>Mi App</span>
 *     <nav>...</nav>
 *     <div neu-sidebar-footer>...</div>
 *   </neu-sidebar>
 *
 * Abrir desde cualquier parte:
 *   inject(NeuUrlStateService).setParam('menu', 'open', false);
 */
@Component({
  selector: 'neu-sidebar',
  imports: [NeuIconComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Overlay de fondo — solo visible en modo overlay -->
    @if (!persistent()) {
      <div
        class="neu-sidebar__overlay"
        [class.neu-sidebar__overlay--visible]="isOpen()"
        (click)="close()"
        aria-hidden="true"
      ></div>
    }

    <!-- Panel lateral -->
    <aside
      class="neu-sidebar"
      [class.neu-sidebar--open]="isOpen()"
      [class.neu-sidebar--persistent]="persistent()"
      role="navigation"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-hidden]="!isOpen() && !persistent()"
      [attr.inert]="!isOpen() && !persistent() ? '' : null"
    >
      <!-- Cabecera -->
      <div class="neu-sidebar__header">
        <div class="neu-sidebar__title">
          <ng-content select="[neu-sidebar-header]" />
        </div>
        @if (!persistent()) {
          <button
            class="neu-sidebar__close"
            (click)="close()"
            [attr.aria-label]="closeLabel()"
            type="button"
          >
            <neu-icon name="lucideX" size="18px" aria-hidden="true" />
          </button>
        }
      </div>

      <!-- Contenido -->
      <div class="neu-sidebar__content">
        <ng-content />
      </div>

      <!-- Footer -->
      <div class="neu-sidebar__footer">
        <ng-content select="[neu-sidebar-footer]" />
      </div>
    </aside>
  `,
  styleUrl: './neu-sidebar.component.scss',
})
export class NeuSidebarComponent {
  private readonly urlState = inject(NeuUrlStateService);

  /** QueryParam que controla el estado. Default: 'menu' (?menu=open) */
  urlParam = input<string>('menu');

  /**
   * Modo persistente: el sidebar está siempre visible como parte del layout.
   * Usar en desktop (≥768px). El overlay y el toggle por URL no aplican.
   */
  persistent = input<boolean>(false);

  /** Etiqueta accesible para el <aside> */
  ariaLabel = input<string>('Menú de navegación');

  /** Etiqueta accesible para el botón cerrar */
  closeLabel = input<string>('Cerrar menú de navegación');

  /** Emite cuando el usuario cierra el sidebar (overlay click o botón) */
  closeRequested = output<void>();

  /** Signal reactivo: true si el sidebar debe mostrarse */
  readonly isOpen = computed(() => {
    if (this.persistent()) return true;
    return this.urlState.getParam(this.urlParam())() === 'open';
  });

  /** Abre el sidebar — añade ?{urlParam}=open a la URL */
  open(replaceUrl = false): void {
    this.urlState.setParam(this.urlParam(), 'open', replaceUrl);
  }

  /** Cierra el sidebar — elimina el parámetro de la URL */
  close(): void {
    this.urlState.setParam(this.urlParam(), null, true);
    this.closeRequested.emit();
  }
}
