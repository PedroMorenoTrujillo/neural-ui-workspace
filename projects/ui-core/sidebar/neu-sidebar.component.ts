import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NeuUrlStateService } from '@neural-ui/core/url-state';
import { NeuIconComponent } from '@neural-ui/core/icon';

let overlayScrollLockCount = 0;
let previousHtmlOverflow = '';
let previousBodyOverflow = '';

function lockDocumentScroll(document: Document): void {
  if (overlayScrollLockCount === 0) {
    previousHtmlOverflow = document.documentElement.style.overflow;
    previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  overlayScrollLockCount += 1;
}

function unlockDocumentScroll(document: Document): void {
  if (overlayScrollLockCount === 0) {
    return;
  }

  overlayScrollLockCount -= 1;

  if (overlayScrollLockCount === 0) {
    document.documentElement.style.overflow = previousHtmlOverflow;
    document.body.style.overflow = previousBodyOverflow;
  }
}

/**
 * NeuralUI Sidebar Component
 *
 * El estado abierto/cerrado se gestiona automáticamente desde la URL / The open/closed state is automatically managed from the URL
 * via NeuUrlStateService (?menu=open por defecto). / via NeuUrlStateService (?menu=open by default).
 *
 * Modos:
 *   - overlay (default): panel flotante sobre el contenido con backdrop / floating panel above content with backdrop
 *   - persistent: sidebar fijo integrado en el layout (desktop) / fixed sidebar integrated in the layout (desktop)
 *
 * Uso:
 *   <neu-sidebar urlParam="menu" [persistent]="isDesktop()">
 *     <span neu-sidebar-header>Mi App</span>
 *     <nav>...</nav>
 *     <div neu-sidebar-footer>...</div>
 *   </neu-sidebar>
 *
 * Abrir desde cualquier parte: / Open from anywhere:
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
      [class.neu-sidebar--right]="side() === 'right'"
      role="navigation"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-hidden]="!isOpen() && !persistent()"
      [attr.inert]="!isOpen() && !persistent() ? '' : null"
    >
      <!-- Cabecera -->
      @if (!hideHeader()) {
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
      }

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
  private readonly document = inject(DOCUMENT);
  private readonly urlState = inject(NeuUrlStateService);

  /** Posición del sidebar: izquierda o derecha de la pantalla / Sidebar position: left or right of the screen */
  side = input<'left' | 'right'>('left');

  /** QueryParam que controla el estado. Default: 'menu' (?menu=open) / QueryParam that controls the state. Default: 'menu' (?menu=open) */
  urlParam = input<string>('menu');

  /**
   * Modo persistente: el sidebar está siempre visible como parte del layout.
   * Usar en desktop (≥768px). El overlay y el toggle por URL no aplican.
   */
  persistent = input<boolean>(false);

  /**
   * Ocultar la cabecera del sidebar. Útil cuando el header ya está en el layout
   * principal y el sidebar persistente no necesita su propio header.
   */
  hideHeader = input<boolean>(false);

  /** Etiqueta accesible para el <aside> / Accessible label for the <aside> */
  ariaLabel = input<string>('Menú de navegación');

  /** Etiqueta accesible para el botón cerrar / Accessible label for the close button */
  closeLabel = input<string>('Cerrar menú de navegación');

  /** Emite cuando el usuario cierra el sidebar (overlay click o botón) / Emits when the user closes the sidebar (overlay click or button) */
  closeRequested = output<void>();

  /** Signal reactivo: true si el sidebar debe mostrarse / Reactive signal: true if the sidebar should be shown */
  readonly isOpen = computed(() => {
    if (this.persistent()) return true;
    return this.urlState.getParam(this.urlParam())() === 'open';
  });

  constructor() {
    effect((onCleanup) => {
      const shouldLockScroll = !this.persistent() && this.isOpen();

      if (!shouldLockScroll) {
        return;
      }

      lockDocumentScroll(this.document);

      onCleanup(() => {
        unlockDocumentScroll(this.document);
      });
    });
  }

  /** Abre el sidebar — añade ?{urlParam}=open a la URL / Opens the sidebar — adds ?{urlParam}=open to the URL */
  open(replaceUrl = false): void {
    this.urlState.setParam(this.urlParam(), 'open', replaceUrl);
  }

  /** Cierra el sidebar — elimina el parámetro de la URL / Closes the sidebar — removes the URL parameter */
  close(): void {
    this.urlState.setParam(this.urlParam(), null, true);
    this.closeRequested.emit();
  }
}
