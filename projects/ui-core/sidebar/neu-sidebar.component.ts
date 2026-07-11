import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  ElementRef,
  HostListener,
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
      [class.neu-sidebar--collapsed]="collapsed()"
      [class.neu-sidebar--right]="side() === 'right'"
      [attr.role]="persistent() ? 'navigation' : 'dialog'"
      [attr.aria-modal]="persistent() ? null : 'true'"
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
  private readonly elementRef = inject(ElementRef);
  private readonly urlState = inject(NeuUrlStateService);
  private readonly openParam = computed(() => this.urlState.getParam(this.urlParam()));
  private previousActiveElement: HTMLElement | null = null;

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
  /** Cierra el overlay al pulsar Escape / Closes the overlay when pressing Escape */
  closeOnEscape = input<boolean>(true);
  /** Devuelve el foco al elemento activo antes de abrir / Restores focus after close */
  restoreFocus = input<boolean>(true);

  /**
   * Modo colapsado: el sidebar muestra solo iconos (icon-only en desktop).
   * Útil para sidebars persistentes en modo compact / Collapsed mode: sidebar shows only icons.
   */
  collapsed = input<boolean>(false);

  /** Emite cuando el usuario cierra el sidebar (overlay click o botón) / Emits when the user closes the sidebar (overlay click or button) */
  closeRequested = output<void>();

  /** Emite cuando el estado collapsed cambia / Emits when collapsed state changes */
  collapsedChange = output<boolean>();

  /** Signal reactivo: true si el sidebar debe mostrarse / Reactive signal: true if the sidebar should be shown */
  readonly isOpen = computed(() => {
    if (this.persistent()) return true;
    return this.openParam()() === 'open';
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

    // Focus management: save previous element and move focus to sidebar when opening in drawer mode
    effect(() => {
      const isOpenNow = this.isOpen();
      const isPersistent = this.persistent();

      if (isPersistent) {
        return;
      }

      if (isOpenNow) {
        // Save the current active element
        this.previousActiveElement = this.document.activeElement as HTMLElement;

        // Move focus to first focusable element inside the sidebar
        this.focusFirstElement();
      } else if (
        this.restoreFocus() &&
        this.previousActiveElement &&
        this.previousActiveElement.focus
      ) {
        // Restore focus to the element that had it before opening
        setTimeout(() => {
          this.previousActiveElement?.focus();
          this.previousActiveElement = null;
        }, 0);
      }
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

  /** Alterna el estado collapsed / Toggles collapsed state */
  toggleCollapsed(): void {
    const newState = !this.collapsed();
    this.collapsedChange.emit(newState);
  }

  /** Obtiene los elementos focusables dentro del sidebar / Gets focusable elements inside sidebar */
  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'button',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const aside = this.elementRef.nativeElement.querySelector('aside.neu-sidebar');
    if (!aside) {
      return [];
    }

    return Array.from(aside.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }

  /** Mueve el foco al primer elemento focusable / Moves focus to first focusable element */
  private focusFirstElement(): void {
    setTimeout(() => {
      const focusable = this.getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }, 0);
  }

  /** Focus trap: cicla entre elementos focusables con Tab/Shift+Tab / Focus trap cycling */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen() || this.persistent()) {
      return;
    }

    if (event.key === 'Escape' && this.closeOnEscape()) {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      return;
    }

    const activeElement = this.document.activeElement as HTMLElement;
    const currentIndex = focusable.indexOf(activeElement);

    if (event.shiftKey) {
      // Shift+Tab — go to previous
      if (currentIndex <= 0) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      }
    } else {
      // Tab — go to next
      if (currentIndex >= focusable.length - 1) {
        event.preventDefault();
        focusable[0].focus();
      }
    }
  }
}
