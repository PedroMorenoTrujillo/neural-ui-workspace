import {
  Component,
  ComponentRef,
  Directive,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { GlobalPositionStrategy, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NeuRovingMenuController } from '@neural-ui/core/internal';
import { NEU_OVERLAY_DISMISS_GUARD, allowsNeuOverlayDismissal } from '@neural-ui/core/foundation';

export interface NeuContextMenuItem {
  /** Key para identificar la acción / Key to identify the action */
  key: string;
  /** Texto visible / Visible text */
  label: string;
  /** Icono opcional (texto/emoji) / Optional icon (text/emoji) */
  icon?: string;
  /** Separador antes de este item / Separator before this item */
  separator?: boolean;
  /** Desactiva el item / Disables the item */
  disabled?: boolean;
  /** Intención semántica / Semantic intent */
  tone?: 'neutral' | 'danger';
}

/**
 * Contexto disponible dentro de `neuContextMenuItem`.
 * Context available inside `neuContextMenuItem`.
 */
export interface NeuContextMenuItemContext {
  /** Elemento que se está renderizando / Item currently being rendered */
  $implicit: NeuContextMenuItem;
}

/** Personaliza cada opción del menú contextual / Customizes every context-menu option */
@Directive({ selector: 'ng-template[neuContextMenuItem]' })
export class NeuContextMenuItemDirective {
  constructor(readonly templateRef: TemplateRef<NeuContextMenuItemContext>) {}

  static ngTemplateContextGuard(
    _directive: NeuContextMenuItemDirective,
    context: unknown,
  ): context is NeuContextMenuItemContext {
    return true;
  }
}

/**
 * NeuralUI ContextMenu Overlay Component (internal)
 */
@Component({
  selector: 'neu-context-menu-overlay',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-context-menu',
    role: 'menu',
    tabindex: '-1',
    '(keydown)': '_onKeydown($event)',
  },
  template: `
    @for (item of _items(); track item.key; let index = $index) {
      @if (item.separator && !$first) {
        <hr class="neu-context-menu__separator" role="separator" />
      }
      <button
        type="button"
        role="menuitem"
        class="neu-context-menu__item"
        [class.neu-context-menu__item--danger]="item.tone === 'danger'"
        [class.neu-context-menu__item--disabled]="item.disabled"
        [disabled]="item.disabled ?? false"
        [attr.aria-disabled]="item.disabled ?? false"
        [tabIndex]="_tabIndexFor(index)"
        [attr.data-neu-context-menu-index]="index"
        (focus)="_setActiveIndex(index)"
        (keydown)="_onKeydown($event)"
        (click)="select(item)"
      >
        @if (itemTemplate) {
          <ng-container
            [ngTemplateOutlet]="itemTemplate"
            [ngTemplateOutletContext]="{ $implicit: item }"
          />
        } @else {
          @if (item.icon) {
            <span class="neu-context-menu__icon" aria-hidden="true">{{ item.icon }}</span>
          }
          {{ item.label }}
        }
      </button>
    }
  `,
  styleUrl: './neu-context-menu.component.scss',
})
export class NeuContextMenuOverlayComponent {
  readonly _items = signal<NeuContextMenuItem[]>([]);
  itemTemplate: TemplateRef<{ $implicit: NeuContextMenuItem }> | null = null;
  _selectFn: ((item: NeuContextMenuItem) => void) | null = null;
  _escapeFn: (() => void) | null = null;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly controller = new NeuRovingMenuController({ orientation: 'vertical' });
  private initialFocusRequested = false;

  constructor() {
    afterRenderEffect(() => {
      this._items();
      this.reconcile();
      if (this.initialFocusRequested) {
        this.initialFocusRequested = false;
        this.focusActive();
      }
    });
  }

  select(item: NeuContextMenuItem): void {
    if (!item.disabled) this._selectFn?.(item);
  }

  _onEscape(): void {
    this._escapeFn?.();
  }

  _requestInitialFocus(): void {
    this.initialFocusRequested = true;
  }

  _tabIndexFor(index: number): 0 | -1 {
    this.reconcile();
    return this.controller.tabIndexFor(index);
  }

  _setActiveIndex(index: number): void {
    this.reconcile();
    this.controller.setActiveIndex(index);
  }

  _onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this._onEscape();
      return;
    }
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-neu-context-menu-index]',
    );
    const index = Number(target?.dataset['neuContextMenuIndex']);
    if (!Number.isInteger(index)) return;
    this.reconcile();
    this.controller.setActiveIndex(index);
    const result = this.controller.handleKey(event);
    if (!result.handled) return;
    event.stopPropagation();
    if (result.activate) {
      this.select(this._items()[index]);
      return;
    }
    this.focusActive();
  }

  private reconcile(): void {
    this.controller.setItems(
      this._items().map((item) => ({
        key: item.key,
        label: item.label,
        disabled: item.disabled,
      })),
    );
  }

  private focusActive(): void {
    const active = this.host.querySelector<HTMLElement>(
      `[data-neu-context-menu-index="${this.controller.index}"]`,
    );
    (active ?? this.host).focus({ preventScroll: true });
  }
}

/**
 * NeuralUI ContextMenu Directive
 *
 * Muestra un menú contextual al hacer clic derecho sobre el elemento host.
 *
 * Uso:
 *   <div [neuContextMenu]="menuItems" (menuItemClick)="onItem($event)">
 *     Clic derecho aquí
 *   </div>
 */
@Directive({
  selector: '[neuContextMenu]',
  exportAs: 'neuContextMenu',
  host: {
    tabindex: '0',
    'aria-haspopup': 'menu',
  },
})
export class NeuContextMenuDirective implements OnDestroy {
  readonly itemTpl = contentChild(NeuContextMenuItemDirective);
  /** Ítems del menú / Menu items */
  readonly neuContextMenu = input<NeuContextMenuItem[]>([]);

  /** Desactiva el menú / Disables the menu */
  readonly neuContextMenuDisabled = input<boolean>(false);

  /** Emitido al seleccionar un ítem / Emitted when an item is selected */
  readonly menuItemClick = output<NeuContextMenuItem>();

  /** Emitido al abrir / Emitted on open */
  readonly menuOpened = output<void>();

  /** Emitido al cerrar / Emitted on close */
  readonly menuClosed = output<void>();

  private readonly _overlay = inject(Overlay);
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _injector = inject(Injector);
  private readonly _vcr = inject(ViewContainerRef);
  private readonly _document = inject(DOCUMENT);
  private readonly dismissGuard = inject(NEU_OVERLAY_DISMISS_GUARD, { optional: true });
  private _overlayRef: OverlayRef | null = null;
  private _compRef: ComponentRef<NeuContextMenuOverlayComponent> | null = null;
  private _origin: HTMLElement | null = null;
  private _onClose: (() => void) | null = null;
  private _positionEpoch = 0;

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    if (this.neuContextMenuDisabled()) return;
    this.openAt(event.clientX, event.clientY, event.currentTarget as HTMLElement);
  }

  @HostListener('keydown', ['$event'])
  onHostKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
    event.preventDefault();
    const origin = event.currentTarget as HTMLElement;
    const rect = origin.getBoundingClientRect();
    this.openAt(rect.left + 8, rect.top + 8, origin);
  }

  /** Opens the existing menu surface for composite controls such as NeuTable. */
  openAt(x: number, y: number, origin?: HTMLElement | null, onClose?: () => void): void {
    if (this.neuContextMenuDisabled()) return;
    this._close();
    this._origin = origin ?? this._el.nativeElement;
    this._onClose = onClose ?? null;
    const positionStrategy = this._overlay.position().global().left(`${x}px`).top(`${y}px`);
    this._overlayRef = this._overlay.create({
      hasBackdrop: true,
      backdropClass: 'neu-context-menu-backdrop',
      positionStrategy,
      scrollStrategy: this._overlay.scrollStrategies.reposition({ scrollThrottle: 0 }),
    });

    const portal = new ComponentPortal(NeuContextMenuOverlayComponent, this._vcr, this._injector);
    this._compRef = this._overlayRef.attach(portal);
    this._compRef.instance._items.set(this.neuContextMenu());
    this._compRef.instance.itemTemplate = this.itemTpl()?.templateRef ?? null;
    this._compRef.instance._selectFn = (item) => {
      this.menuItemClick.emit(item);
      this._close();
    };
    this._compRef.instance._escapeFn = () => this.requestClose('escape', null);
    this._compRef.instance._requestInitialFocus();

    this._overlayRef
      .backdropClick()
      .subscribe((event) => this.requestClose('outside-pointer', event));
    const overlayRef = this._overlayRef;
    this._overlayRef.detachments().subscribe(() => this._finalizeClose(overlayRef));
    this._constrainToViewport(overlayRef, positionStrategy, x, y);
    this.menuOpened.emit();
  }

  close(): void {
    this._close();
  }

  private requestClose(reason: 'escape' | 'outside-pointer', event: Event | null): void {
    if (!this._overlayRef) return;
    if (
      !allowsNeuOverlayDismissal(this.dismissGuard, {
        source: 'context-menu',
        reason,
        originalEvent: event,
      })
    )
      return;
    this._close();
  }

  private _close(): void {
    const overlayRef = this._overlayRef;
    if (!overlayRef) return;
    if (overlayRef.hasAttached()) {
      overlayRef.detach();
    } else {
      this._finalizeClose(overlayRef);
    }
  }

  private _finalizeClose(overlayRef: OverlayRef): void {
    if (this._overlayRef !== overlayRef) return;
    this._positionEpoch += 1;
    this._overlayRef = null;
    this._compRef = null;
    const origin = this._origin;
    const onClose = this._onClose;
    this._origin = null;
    this._onClose = null;
    overlayRef.dispose();
    this.menuClosed.emit();
    onClose?.();
    if (origin?.isConnected) origin.focus({ preventScroll: true });
  }

  private _constrainToViewport(
    overlayRef: OverlayRef,
    positionStrategy: GlobalPositionStrategy,
    x: number,
    y: number,
  ): void {
    const epoch = ++this._positionEpoch;
    const constrain = () => {
      if (
        epoch !== this._positionEpoch ||
        this._overlayRef !== overlayRef ||
        !overlayRef.hasAttached()
      ) {
        return;
      }

      const viewport = this._document.defaultView;
      const viewportWidth = viewport?.innerWidth ?? this._document.documentElement.clientWidth;
      const viewportHeight = viewport?.innerHeight ?? this._document.documentElement.clientHeight;
      const rect = overlayRef.overlayElement.getBoundingClientRect();
      const margin = 8;
      const left = Math.max(margin, Math.min(x, viewportWidth - rect.width - margin));
      const top = Math.max(margin, Math.min(y, viewportHeight - rect.height - margin));

      positionStrategy.left(`${left}px`).top(`${top}px`);
      overlayRef.updatePosition();
    };

    // The portal is attached synchronously, but its projected menu items are not
    // guaranteed to have their final size until the next rendered frame. Clamp
    // once immediately and once after layout so pointer and keyboard openings
    // stay inside the viewport in every browser engine.
    queueMicrotask(() => {
      constrain();
      this._document.defaultView?.requestAnimationFrame(constrain);
    });
  }

  ngOnDestroy(): void {
    this._close();
  }
}
