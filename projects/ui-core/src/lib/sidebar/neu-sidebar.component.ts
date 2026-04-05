import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

/**
 * NeuralUI Sidebar Component
 *
 * El estado abierto/cerrado se controla desde fuera via el input `isOpen`.
 * La forma idiomática es sincronizarlo con el QueryParam `?menu=open` en la URL.
 *
 * Ejemplo de uso en el componente padre:
 *
 *   <neu-sidebar [isOpen]="isSidebarOpen()" (closeRequested)="onClose()">
 *     <span neu-sidebar-header>Menú</span>
 *     <nav>...</nav>
 *   </neu-sidebar>
 *
 * URL State pattern:
 *   - Abrir:  router.navigate([], { queryParams: { menu: 'open' }, queryParamsHandling: 'merge' })
 *   - Cerrar: router.navigate([], { queryParams: { menu: null },   queryParamsHandling: 'merge' })
 */
@Component({
  selector: 'neu-sidebar',
  standalone: true,
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Overlay de fondo -->
    <div
      class="neu-sidebar__overlay"
      [class.neu-sidebar__overlay--visible]="isOpen()"
      (click)="onClose()"
      aria-hidden="true"
    ></div>

    <!-- Panel lateral -->
    <aside
      class="neu-sidebar"
      [class.neu-sidebar--open]="isOpen()"
      role="navigation"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-hidden]="!isOpen()"
      [attr.inert]="!isOpen() ? '' : null"
    >
      <!-- Cabecera del sidebar -->
      <div class="neu-sidebar__header">
        <div class="neu-sidebar__title">
          <ng-content select="[neu-sidebar-header]" />
        </div>
        <button
          class="neu-sidebar__close"
          (click)="onClose()"
          [attr.aria-label]="closeLabel()"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Contenido principal del sidebar -->
      <div class="neu-sidebar__content">
        <ng-content />
      </div>

      <!-- Footer opcional -->
      <div class="neu-sidebar__footer">
        <ng-content select="[neu-sidebar-footer]" />
      </div>
    </aside>
  `,
  styleUrl: './neu-sidebar.component.scss',
})
export class NeuSidebarComponent {
  /** Controla si el sidebar está visible. Sincronizar con ?menu=open en la URL. */
  isOpen = input<boolean>(false);

  /** Etiqueta accesible para el elemento <aside> */
  ariaLabel = input<string>('Menú de navegación');

  /** Etiqueta accesible para el botón de cerrar */
  closeLabel = input<string>('Cerrar menú de navegación');

  /** Se emite cuando el usuario solicita cerrar el sidebar (overlay click o botón cerrar) */
  closeRequested = output<void>();

  readonly isVisible = computed(() => this.isOpen());

  onClose(): void {
    this.closeRequested.emit();
  }
}
