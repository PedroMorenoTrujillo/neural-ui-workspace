import { DOCUMENT } from '@angular/common';
import {
  Component,
  AfterRenderRef,
  DestroyRef,
  ElementRef,
  Injector,
  ViewEncapsulation,
  computed,
  effect,
  afterRenderEffect,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NeuFocusTrapDirective } from '@neural-ui/core/focus-trap';
import { observeDialogViewport } from './neu-dialog-viewport';
import {
  InternalNeuIconOutletComponent,
  neuCloseIconPath,
} from '@neural-ui/core/icon-outlet-internal';
import { neuIconX as iconX } from '@neural-ui/core/internal';
import { InternalNeuOverlayStack, NeuIdGenerator } from '@neural-ui/core/internal';
import {
  NEU_OVERLAY_DISMISS_GUARD,
  NeuCloseRequest,
  allowsNeuOverlayDismissal,
} from '@neural-ui/core/foundation';

export type NeuDialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type NeuDialogLayout = 'auto' | 'viewport';

/**
 * NeuDialogComponent — Diálogo accesible con header, body y footer. / Accessible dialog with header, body and footer.
 * Úsalo directamente como componente declarativo pasando `open` como signal. / Use it directly as a declarative component passing `open` as a signal.
 *
 * Para uso programático, utiliza NeuDialogService.open().
 *
 * Uso declarativo:
 *   <neu-dialog [open]="isOpen()" title="Editar usuario" (closeRequested)="onClose($event)">
 *     <p>Contenido del diálogo</p>
 *     <div neu-dialog-footer>
 *       <neu-button (click)="save()">Guardar</neu-button>
 *     </div>
 *   </neu-dialog>
 */
@Component({
  selector: 'neu-dialog',
  imports: [NeuFocusTrapDirective, InternalNeuIconOutletComponent],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.neu-dialog--open]': 'open()',
    '[class.neu-dialog--responsive]': 'responsive()',
    '[class.neu-dialog--layout-auto]': 'layout() === "auto"',
    '[class.neu-dialog--layout-viewport]': 'layout() === "viewport"',
    '[class.neu-dialog--draggable]': 'draggable()',
    '[class.neu-dialog--resizable]': 'resizable()',
    '[class.neu-dialog--maximized]': 'effectiveMaximized()',
    '[attr.aria-hidden]': '!open()',
    '(document:click)': 'captureActivationOrigin($event)',
  },
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div
        class="neu-dialog__backdrop"
        (click)="requestClose('backdrop', $event)"
        aria-hidden="true"
      ></div>

      <div class="neu-dialog__visual-viewport" [style]="visualViewport()">
        <div class="neu-dialog__viewport">
          <!-- Panel -->
          <div
            #panel
            class="neu-dialog__panel neu-dialog__panel--{{ size() }}"
            [class.neu-dialog__panel--responsive]="responsive()"
            [class.neu-dialog__panel--layout-auto]="layout() === 'auto'"
            [class.neu-dialog__panel--layout-viewport]="layout() === 'viewport'"
            [class.neu-dialog__panel--maximized]="effectiveMaximized()"
            role="dialog"
            tabindex="-1"
            [neuFocusTrap]="isTopOverlay()"
            [id]="'neu-dialog-' + _uid"
            [attr.aria-labelledby]="'neu-dialog-title-' + _uid"
            [attr.aria-modal]="true"
            (keydown)="onPanelKeydown($event)"
            (pointermove)="onPointerMove($event)"
            (pointerup)="onPointerEnd($event)"
            (pointercancel)="onPointerEnd($event)"
          >
            <!-- Header -->
            <div class="neu-dialog__header" (pointerdown)="onDragStart($event)">
              <h2 class="neu-dialog__title" [id]="'neu-dialog-title-' + _uid">{{ title() }}</h2>
              <div class="neu-dialog__actions">
                @if (maximizable()) {
                  <button
                    class="neu-dialog__action neu-dialog__maximize"
                    type="button"
                    [attr.aria-label]="effectiveMaximized() ? restoreLabel() : maximizeLabel()"
                    [attr.aria-pressed]="effectiveMaximized()"
                    (click)="toggleMaximize()"
                  >
                    <span class="neu-dialog__maximize-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none">
                        @if (effectiveMaximized()) {
                          <path d="m14 10 7-7m0 0v6m0-6h-6M10 14l-7 7m0 0v-6m0 6h6" />
                        } @else {
                          <path
                            d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3"
                          />
                        }
                      </svg>
                    </span>
                  </button>
                }
                @if (!disableClose()) {
                  <button
                    class="neu-dialog__action neu-dialog__close"
                    type="button"
                    [attr.aria-label]="closeLabel()"
                    (click)="requestClose('action', $event)"
                  >
                    <neu-icon-outlet
                      [icon]="iconX"
                      [fallbackPath]="closeIconPath"
                      size="1.125rem"
                    />
                  </button>
                }
              </div>
            </div>

            <!-- Body -->
            <div class="neu-dialog__body">
              <div class="neu-dialog__content">
                <ng-content />
              </div>
            </div>

            <!-- Footer (opcional via slot) -->
            <ng-content select="[neu-dialog-footer]" />
            @if (resizable() && !effectiveMaximized()) {
              <button
                class="neu-dialog__resize-handle"
                type="button"
                [attr.aria-label]="resizeLabel()"
                (pointerdown)="onResizeStart($event)"
                (keydown)="onResizeKeydown($event)"
              ></button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './neu-modal.component.scss',
})
export class NeuDialogComponent {
  protected readonly closeIconPath = neuCloseIconPath;
  protected readonly iconX = iconX;
  /** Controla la visibilidad del diálogo. / Controls dialog visibility. */
  open = input<boolean>(false);
  /** Título que aparece en el header. / Title shown in the header. */
  title = input<string>('');
  /** Tamaño del panel: sm | md | lg | xl | full. / Panel size: sm | md | lg | xl | full. */
  size = input<NeuDialogSize>('md');
  /** Ajusta la altura al contenido o al viewport disponible. / Fits height to content or to the available viewport. */
  layout = input<NeuDialogLayout>('auto');
  /** Si es true, el backdrop y el botón cerrar no funcionan. / If true, the backdrop and close button do not work. */
  disableClose = input<boolean>(false);
  /** Adapta el panel a mobile/full-width cuando el viewport es estrecho. */
  responsive = input<boolean>(true);
  /** Devuelve el foco al elemento activo antes de abrir. */
  restoreFocus = input<boolean>(true);
  /** Pointer drag is opt-in and position remains transient. */
  draggable = input(false);
  /** Pointer and keyboard resize are opt-in. */
  resizable = input(false);
  maximizable = input(false);
  /** Presence makes maximize state consumer-authoritative. */
  maximized = input<boolean | undefined>(undefined);
  maximizeLabel = input('Maximize dialog');
  restoreLabel = input('Restore dialog');
  resizeLabel = input('Resize dialog');
  /** Accessible label of the close action, owned by the consuming locale. */
  closeLabel = input('Close dialog');

  /** Consumer-owned close intent. Applied `open` remains unchanged. */
  readonly closeRequested = output<NeuCloseRequest>();

  /* v8 ignore start -- Angular signal-query factories; modal focus behavior is covered. */
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly focusTrapRef = viewChild(NeuFocusTrapDirective);
  /* v8 ignore stop */
  private readonly document = inject(DOCUMENT);
  protected readonly visualViewport = observeDialogViewport(this.open, this.document);
  private readonly dismissGuard = inject(NEU_OVERLAY_DISMISS_GUARD, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly overlayStack = inject(InternalNeuOverlayStack);
  protected readonly isTopOverlay = computed(() => this.overlayStack.isTop(this));
  private previousActiveElement: HTMLElement | null = null;
  private activationOrigin: HTMLElement | null = null;
  private activationOriginCleanup: AfterRenderRef | null = null;
  private deactivateOverlay: (() => void) | null = null;
  private lowerOverlayOwner: NeuDialogComponent | null = null;
  private focusEpoch = 0;
  private offsetX = 0;
  private offsetY = 0;
  private interaction: NeuDialogPointerInteraction | null = null;
  private closeRequestEpoch = 0;

  /** @internal — ID único para aria-labelledby / Unique ID for aria-labelledby */
  protected readonly _uid = inject(NeuIdGenerator).getId('dialog-');

  private eventPanelVisible = false;
  private lifecycleInitialized = false;
  /** Panel mounted in the browser, independently of the trigger source. */
  readonly opened = output<void>();
  /** Panel unmounted after an applied post-init transition. Silent on destroy. */
  readonly closed = output<void>();
  readonly maximizedChange = output<boolean>();
  private readonly internalMaximized = signal(false);
  readonly effectiveMaximized = computed(
    () => this.maximizable() && (this.maximized() ?? this.internalMaximized()),
  );

  constructor() {
    afterRenderEffect(() => {
      const visible = !!this.panelRef();
      if (!this.lifecycleInitialized) {
        this.lifecycleInitialized = true;
        this.eventPanelVisible = visible;
        return;
      }
      if (visible === this.eventPanelVisible) return;
      this.eventPanelVisible = visible;
      if (visible) this.opened.emit();
      else this.closed.emit();
    });
    effect((onCleanup) => {
      if (!this.open()) return;
      this.lowerOverlayOwner = null;
      const deactivate = this.overlayStack.activate(this);
      this.deactivateOverlay = deactivate;
      onCleanup(() => {
        if (!untracked(() => this.overlayStack.isTop(this))) this.previousActiveElement = null;
        deactivate();
        if (this.deactivateOverlay === deactivate) this.deactivateOverlay = null;
      });
    });

    effect(() => {
      if (this.open()) return;
      this.cancelInteraction();
      this.resetGeometry();
    });

    effect(() => {
      const epoch = ++this.focusEpoch;
      if (!this.open()) {
        this.restorePreviousFocus(epoch);
        return;
      }

      this.previousActiveElement ??=
        this.activationOrigin ?? (this.document.activeElement as HTMLElement | null);
      queueMicrotask(() => {
        if (
          epoch === this.focusEpoch &&
          this.open() &&
          !this.destroyRef.destroyed &&
          this.overlayStack.isTop(this)
        ) {
          this.focusInitialElement();
        }
      });
    });

    this.destroyRef.onDestroy(() => {
      const wasTop = this.overlayStack.isTop(this);
      this.deactivateOverlay?.();
      this.deactivateOverlay = null;
      this.activationOriginCleanup?.destroy();
      this.activationOriginCleanup = null;
      this.activationOrigin = null;
      this.cancelInteraction();
      this.focusEpoch += 1;
      const target = this.previousActiveElement;
      this.previousActiveElement = null;
      if (this.restoreFocus() && wasTop) {
        this.restoreFocusTarget(target);
      }
      this.lowerOverlayOwner = null;
    });
  }

  close(): void {
    if (this.destroyRef.destroyed) return;
    this.closeRequestEpoch += 1;
    this.closeRequested.emit({ reason: 'programmatic-command' });
  }

  protected captureActivationOrigin(event: Event): void {
    if (this.open() || this.destroyRef.destroyed || !(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLElement>(
      'button, a[href], input:not([type="hidden"]), select, textarea, [tabindex]',
    );
    this.activationOriginCleanup?.destroy();
    this.activationOrigin = this.isValidFocusTarget(target) ? target : null;
    // Some browsers activate a button without focusing it. Keep the actual
    // click origin only until that interaction's Angular render has applied.
    this.activationOriginCleanup = afterNextRender(
      () => {
        this.activationOrigin = null;
        this.activationOriginCleanup = null;
      },
      { injector: this.injector },
    );
  }

  requestClose(reason: 'escape' | 'backdrop' | 'action', event: Event): void {
    if (this.disableClose() || this.destroyRef.destroyed) return;
    if (!this.overlayStack.isTop(this)) return;
    const closeRequestEpoch = this.closeRequestEpoch;
    if (
      reason !== 'action' &&
      !allowsNeuOverlayDismissal(this.dismissGuard, {
        source: 'dialog',
        reason,
        originalEvent: event,
      })
    )
      return;
    if (this.destroyRef.destroyed || !this.open() || closeRequestEpoch !== this.closeRequestEpoch)
      return;
    this.closeRequestEpoch += 1;
    this.closeRequested.emit({
      reason: reason === 'backdrop' ? 'outside' : reason,
      originalEvent: event,
    });
  }

  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.overlayStack.isTop(this)) return;
    event.preventDefault();
    event.stopPropagation();
    this.requestClose('escape', event);
  }

  toggleMaximize(): void {
    if (!this.maximizable() || this.destroyRef.destroyed) return;
    this.cancelInteraction();
    const next = !this.effectiveMaximized();
    if (this.maximized() === undefined) this.internalMaximized.set(next);
    this.maximizedChange.emit(next);
  }

  onDragStart(event: PointerEvent): void {
    if (
      !this.draggable() ||
      this.effectiveMaximized() ||
      this.narrowResponsiveViewport() ||
      event.button !== 0 ||
      (event.target as Element).closest('button, a, input, select, textarea, [role="button"]')
    )
      return;
    this.beginInteraction('drag', event);
  }

  onResizeStart(event: PointerEvent): void {
    if (
      !this.resizable() ||
      this.effectiveMaximized() ||
      this.narrowResponsiveViewport() ||
      event.button !== 0
    )
      return;
    event.stopPropagation();
    this.beginInteraction('resize', event);
  }

  onPointerMove(event: PointerEvent): void {
    const state = this.interaction;
    const panel = this.panelRef()?.nativeElement;
    if (!state || !panel || state.pointerId !== event.pointerId) return;
    event.preventDefault();
    const viewport = this.viewportSize();
    const margin = 8;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (state.kind === 'drag') {
      const left = clamp(
        state.rect.left + dx,
        margin,
        Math.max(margin, viewport.width - state.rect.width - margin),
      );
      const top = clamp(
        state.rect.top + dy,
        margin,
        Math.max(margin, viewport.height - state.rect.height - margin),
      );
      this.offsetX = state.offsetX + left - state.rect.left;
      this.offsetY = state.offsetY + top - state.rect.top;
      this.applyTransform(panel);
      return;
    }

    const rtl = state.direction === 'rtl';
    const maxWidth = rtl ? state.rect.right - margin : viewport.width - state.rect.left - margin;
    const maxHeight = viewport.height - state.rect.top - margin;
    const width = clamp(state.rect.width + (rtl ? -dx : dx), Math.min(320, maxWidth), maxWidth);
    const height = clamp(state.rect.height + dy, Math.min(180, maxHeight), maxHeight);
    this.applySize(panel, state, width, height);
  }

  onPointerEnd(event: PointerEvent): void {
    if (this.interaction?.pointerId !== event.pointerId) return;
    this.releasePointer(event.pointerId);
    this.interaction = null;
  }

  onResizeKeydown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const step = event.shiftKey ? 32 : 8;
    const widthDelta = event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0;
    const heightDelta = event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0;
    const viewport = this.viewportSize();
    const direction =
      this.document.defaultView?.getComputedStyle(panel).direction === 'rtl' ? 'rtl' : 'ltr';
    const state: NeuDialogPointerInteraction = {
      kind: 'resize',
      pointerId: -1,
      startX: 0,
      startY: 0,
      rect,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      direction,
    };
    const maxWidth = direction === 'rtl' ? rect.right - 8 : viewport.width - rect.left - 8;
    const maxHeight = viewport.height - rect.top - 8;
    this.applySize(
      panel,
      state,
      clamp(rect.width + widthDelta, Math.min(320, maxWidth), maxWidth),
      clamp(rect.height + heightDelta, Math.min(180, maxHeight), maxHeight),
    );
  }

  private beginInteraction(kind: 'drag' | 'resize', event: PointerEvent): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;
    event.preventDefault();
    panel.setPointerCapture?.(event.pointerId);
    this.interaction = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rect: panel.getBoundingClientRect(),
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      direction:
        this.document.defaultView?.getComputedStyle(panel).direction === 'rtl' ? 'rtl' : 'ltr',
    };
  }

  private applySize(
    panel: HTMLElement,
    state: NeuDialogPointerInteraction,
    width: number,
    height: number,
  ): void {
    const widthDelta = width - state.rect.width;
    const heightDelta = height - state.rect.height;
    this.offsetX = state.offsetX + (state.direction === 'rtl' ? -widthDelta / 2 : widthDelta / 2);
    this.offsetY = state.offsetY + heightDelta / 2;
    panel.style.width = `${Math.round(width)}px`;
    panel.style.height = `${Math.round(height)}px`;
    this.applyTransform(panel);
  }

  private applyTransform(panel: HTMLElement): void {
    panel.style.transform = `translate3d(${Math.round(this.offsetX)}px, ${Math.round(this.offsetY)}px, 0)`;
  }

  private viewportSize(): { width: number; height: number } {
    const view = this.document.defaultView;
    return {
      width: Math.max(0, view?.innerWidth ?? this.document.documentElement.clientWidth),
      height: Math.max(0, view?.innerHeight ?? this.document.documentElement.clientHeight),
    };
  }

  private narrowResponsiveViewport(): boolean {
    return this.responsive() && this.viewportSize().width <= 480;
  }

  private cancelInteraction(): void {
    if (this.interaction) this.releasePointer(this.interaction.pointerId);
    this.interaction = null;
  }

  private releasePointer(pointerId: number): void {
    const panel = this.panelRef()?.nativeElement;
    if (pointerId >= 0 && panel?.hasPointerCapture?.(pointerId)) {
      panel.releasePointerCapture(pointerId);
    }
  }

  private resetGeometry(): void {
    this.offsetX = 0;
    this.offsetY = 0;
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;
    panel.style.removeProperty('width');
    panel.style.removeProperty('height');
    panel.style.removeProperty('transform');
  }

  private focusInitialElement(): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;

    if (!this.focusTrapRef()?.focusFirst()) {
      panel.focus();
    }
  }

  private restorePreviousFocus(epoch: number): void {
    const target = this.previousActiveElement;
    const lowerOwner = this.lowerOverlayOwner;
    this.lowerOverlayOwner = null;
    if (!this.restoreFocus() || !target?.focus) {
      this.previousActiveElement = null;
      return;
    }

    queueMicrotask(() => {
      if (epoch === this.focusEpoch && !this.open() && !this.destroyRef.destroyed) {
        this.restoreFocusTarget(target, lowerOwner);
        if (this.previousActiveElement === target) this.previousActiveElement = null;
      }
    });
  }

  private isValidFocusTarget(target: HTMLElement | null): target is HTMLElement {
    if (
      !target?.isConnected ||
      target.ownerDocument !== this.document ||
      target.matches(':disabled, [aria-disabled="true"]')
    )
      return false;

    for (let element: HTMLElement | null = target; element; element = element.parentElement) {
      if (
        element.hidden ||
        element.hasAttribute('inert') ||
        element.getAttribute('aria-hidden') === 'true'
      )
        return false;
      const style = this.document.defaultView?.getComputedStyle(element);
      if (
        style?.display === 'none' ||
        style?.visibility === 'hidden' ||
        style?.visibility === 'collapse'
      )
        return false;
    }
    return true;
  }

  private onNeuOverlayDeactivated(nextOwner: object | undefined): void {
    this.lowerOverlayOwner =
      this.restoreFocus() && nextOwner instanceof NeuDialogComponent ? nextOwner : null;
  }

  private restoreFocusTarget(
    target: HTMLElement | null,
    lowerOwner: NeuDialogComponent | null = this.lowerOverlayOwner,
  ): void {
    if (lowerOwner) {
      if (!this.overlayStack.isTop(lowerOwner)) return;
      const lowerPanel = lowerOwner.panelRef()?.nativeElement;
      if (!target || !lowerPanel?.contains(target) || !this.isValidFocusTarget(target)) {
        lowerOwner.focusInitialElement();
        return;
      }
    }
    if (this.isValidFocusTarget(target)) target.focus({ preventScroll: true });
  }
}

interface NeuDialogPointerInteraction {
  readonly kind: 'drag' | 'resize';
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  readonly rect: DOMRect;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly direction: 'ltr' | 'rtl';
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}
