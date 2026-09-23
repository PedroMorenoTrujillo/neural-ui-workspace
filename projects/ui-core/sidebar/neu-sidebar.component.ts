import {
  Component,
  DestroyRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  output,
  HostListener,
  signal,
  viewChild,
} from '@angular/core';
import { NeuFocusTrapDirective } from '@neural-ui/core/focus-trap';
import { DOCUMENT } from '@angular/common';
import { NeuralIcon } from '@neural-icons/angular';
import { iconX } from '@neural-icons/core/icons/x';
import { NeuCloseRequest } from '@neural-ui/core/foundation';
import { InternalNeuOverlayStack } from '@neural-ui/core/internal';

/**
 * NeuralUI Sidebar Component
 *
 * El estado overlay es aplicado y controlado por el consumer. / Overlay state is consumer-controlled.
 *
 * Modos:
 *   - overlay (default): panel flotante sobre el contenido con backdrop / floating panel above content with backdrop
 *   - persistent: sidebar fijo integrado en el layout (desktop) / fixed sidebar integrated in the layout (desktop)
 *
 * Uso:
 *   <neu-sidebar [open]="menuOpen()" [persistent]="isDesktop()" (closeRequested)="closeMenu($event)">
 *     <span neu-sidebar-header>Mi App</span>
 *     <nav>...</nav>
 *     <div neu-sidebar-footer>...</div>
 *   </neu-sidebar>
 */
@Component({
  selector: 'neu-sidebar',
  imports: [NeuFocusTrapDirective, NeuralIcon],
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- Overlay de fondo — solo visible en modo overlay -->
    @if (!persistent()) {
      <div
        class="neu-sidebar__overlay"
        [class.neu-sidebar__overlay--visible]="isOpen()"
        (click)="requestClose('outside', $event)"
        aria-hidden="true"
      ></div>
    }

    <!-- Panel lateral -->
    <aside
      class="neu-sidebar"
      tabindex="-1"
      [neuFocusTrap]="isOpen() && !persistent()"
      [class.neu-sidebar--open]="isOpen()"
      [class.neu-sidebar--persistent]="persistent()"
      [class.neu-sidebar--collapsed]="effectiveCollapsed()"
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
              (click)="requestClose('action', $event)"
              [attr.aria-label]="closeLabel()"
              type="button"
            >
              <neural-icon [icon]="iconX" size="18px" aria-hidden="true" />
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
  protected readonly iconX = iconX;
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly focusTrapRef = viewChild(NeuFocusTrapDirective);
  private readonly overlayStack = inject(InternalNeuOverlayStack);
  private previousActiveElement: HTMLElement | null = null;
  private pendingFocusTimer: ReturnType<typeof setTimeout> | null = null;
  private lifecycleInitialized = false;
  private eventOverlayActive = false;

  /** Posición del sidebar: izquierda o derecha de la pantalla / Sidebar position: left or right of the screen */
  side = input<'left' | 'right'>('left');

  /** Applied overlay state. Ignored for persistent presentation without being rewritten. */
  readonly open = input(false);

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
  ariaLabel = input<string>('Navigation menu');

  /** Etiqueta accesible para el botón cerrar / Accessible label for the close button */
  closeLabel = input<string>('Close navigation menu');
  /** Cierra el overlay al pulsar Escape / Closes the overlay when pressing Escape */
  closeOnEscape = input<boolean>(true);
  /** Devuelve el foco al elemento activo antes de abrir / Restores focus after close */
  restoreFocus = input<boolean>(true);

  /**
   * Modo colapsado: el sidebar muestra solo iconos (icon-only en desktop).
   * Útil para sidebars persistentes en modo compact / Collapsed mode: sidebar shows only icons.
   */
  /** Applied controlled collapse state. Undefined selects uncontrolled mode. */
  readonly collapsed = input<boolean | undefined>(undefined);
  /** One-time collapse seed for uncontrolled instances. */
  readonly initialCollapsed = input(false);

  /** Consumer-owned close intent. Applied `open` remains unchanged. */
  readonly closeRequested = output<NeuCloseRequest>();
  /** Completed post-init overlay lifecycle. */
  readonly opened = output<void>();
  readonly closed = output<void>();

  /** Emite cuando el estado collapsed cambia / Emits when collapsed state changes */
  readonly collapsedChange = output<boolean>();
  private collapseControlMode: 'controlled' | 'uncontrolled' | null = null;
  private collapseModeWarningEmitted = false;
  private uncontrolledCollapsed = false;
  private readonly uncontrolledCollapsedRevision = signal(0);
  readonly effectiveCollapsed = computed(() => {
    this.uncontrolledCollapsedRevision();
    return this.ensureCollapseControlMode() === 'controlled'
      ? (this.collapsed() ?? false)
      : this.uncontrolledCollapsed;
  });

  readonly overlayActive = computed(() => !this.persistent() && this.open());
  /** Persistent mode is always presented; overlay mode follows the applied input. */
  readonly isOpen = computed(() => this.persistent() || this.open());

  constructor() {
    effect((onCleanup) => {
      if (!this.overlayActive()) return;
      onCleanup(this.overlayStack.activate(this, 0));
    });

    // Focus management: save previous element and move focus to sidebar when opening in drawer mode
    effect(() => {
      const isOpenNow = this.overlayActive();
      const isPersistent = this.persistent();
      const shouldRestoreFocus = this.restoreFocus();

      this.cancelPendingFocus();

      if (isPersistent) {
        this.previousActiveElement = null;
        return;
      }

      if (isOpenNow) {
        // Preserve the original trigger when a close is immediately superseded by a reopen.
        this.previousActiveElement ??= this.document.activeElement as HTMLElement;

        // Move focus to first focusable element inside the sidebar
        this.focusFirstElement();
      } else if (shouldRestoreFocus && this.previousActiveElement) {
        // Restore focus to the element that had it before opening
        const target = this.previousActiveElement;
        this.scheduleFocus(() => {
          this.previousActiveElement = null;
          if (this.isValidFocusTarget(target)) target.focus();
        });
      } else {
        this.previousActiveElement = null;
      }
    });

    afterRenderEffect(() => {
      const active = this.overlayActive();
      if (!this.lifecycleInitialized) {
        this.lifecycleInitialized = true;
        this.eventOverlayActive = active;
        return;
      }
      if (active === this.eventOverlayActive) return;
      this.eventOverlayActive = active;
      if (active) this.opened.emit();
      else this.closed.emit();
    });

    this.destroyRef.onDestroy(() => {
      this.cancelPendingFocus();
      this.previousActiveElement = null;
    });
  }

  /** Alterna el estado collapsed / Toggles collapsed state */
  toggleCollapsed(): void {
    const proposal = !this.effectiveCollapsed();
    if (this.ensureCollapseControlMode() === 'uncontrolled') {
      this.uncontrolledCollapsed = proposal;
      this.uncontrolledCollapsedRevision.update((revision) => revision + 1);
    }
    this.collapsedChange.emit(proposal);
  }

  private ensureCollapseControlMode(): 'controlled' | 'uncontrolled' {
    const requested = this.collapsed() === undefined ? 'uncontrolled' : 'controlled';
    if (this.collapseControlMode === null) {
      this.collapseControlMode = requested;
      if (requested === 'uncontrolled') this.uncontrolledCollapsed = this.initialCollapsed();
    } else if (this.collapseControlMode !== requested && !this.collapseModeWarningEmitted) {
      this.collapseModeWarningEmitted = true;
      if (isDevMode())
        console.warn('NeuSidebar cannot switch between controlled and uncontrolled collapse.');
    }
    return this.collapseControlMode;
  }

  /** Mueve el foco al primer elemento focusable / Moves focus to first focusable element */
  private focusFirstElement(): void {
    this.scheduleFocus(() => {
      this.focusTrapRef()?.focusFirst();
    });
  }

  private scheduleFocus(callback: () => void): void {
    this.cancelPendingFocus();
    this.pendingFocusTimer = setTimeout(() => {
      this.pendingFocusTimer = null;
      if (!this.destroyRef.destroyed) callback();
    }, 0);
  }

  private cancelPendingFocus(): void {
    if (this.pendingFocusTimer === null) return;
    clearTimeout(this.pendingFocusTimer);
    this.pendingFocusTimer = null;
  }

  private isValidFocusTarget(target: HTMLElement): boolean {
    return (
      target.isConnected &&
      target.ownerDocument === this.document &&
      this.document.documentElement.contains(target)
    );
  }

  protected requestClose(reason: 'escape' | 'outside' | 'action', originalEvent: Event): void {
    if (this.destroyRef.destroyed || !this.overlayActive() || !this.overlayStack.isTop(this))
      return;
    this.closeRequested.emit({ reason, originalEvent });
  }

  /** Focus trap: cicla entre elementos focusables con Tab/Shift+Tab / Focus trap cycling */
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen() || this.persistent()) {
      return;
    }

    if (event.key === 'Escape' && this.closeOnEscape() && this.overlayStack.isTop(this)) {
      event.preventDefault();
      event.stopPropagation();
      this.requestClose('escape', event);
      return;
    }
  }
}
