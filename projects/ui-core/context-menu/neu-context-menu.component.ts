import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Directive,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  ViewContainerRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

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
  /** Variante de color / Color variant */
  variant?: 'default' | 'danger';
}

let _seq = 0;

/**
 * NeuralUI ContextMenu Overlay Component (internal)
 */
@Component({
  selector: 'neu-context-menu-overlay',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-context-menu',
    role: 'menu',
    tabindex: '-1',
    '(keydown.escape)': '_onEscape()',
  },
  template: `
    @for (item of _items(); track item.key) {
      @if (item.separator && !$first) {
        <hr class="neu-context-menu__separator" role="separator" />
      }
      <button
        type="button"
        role="menuitem"
        class="neu-context-menu__item"
        [class.neu-context-menu__item--danger]="item.variant === 'danger'"
        [class.neu-context-menu__item--disabled]="item.disabled"
        [disabled]="item.disabled ?? false"
        [attr.aria-disabled]="item.disabled ?? false"
        (click)="select(item)"
      >
        @if (item.icon) {
          <span class="neu-context-menu__icon" aria-hidden="true">{{ item.icon }}</span>
        }
        {{ item.label }}
      </button>
    }
  `,
  styleUrl: './neu-context-menu.component.scss',
})
export class NeuContextMenuOverlayComponent {
  readonly _items = signal<NeuContextMenuItem[]>([]);
  _selectFn: ((item: NeuContextMenuItem) => void) | null = null;
  _escapeFn: (() => void) | null = null;

  select(item: NeuContextMenuItem): void {
    if (!item.disabled) this._selectFn?.(item);
  }

  _onEscape(): void {
    this._escapeFn?.();
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
})
export class NeuContextMenuDirective implements OnDestroy {
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
  private _overlayRef: OverlayRef | null = null;
  private _compRef: ComponentRef<NeuContextMenuOverlayComponent> | null = null;

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    if (this.neuContextMenuDisabled()) return;
    this._open(event.clientX, event.clientY);
  }

  private _open(x: number, y: number): void {
    this._close();
    this._overlayRef = this._overlay.create({
      hasBackdrop: true,
      backdropClass: 'neu-context-menu-backdrop',
      positionStrategy: this._overlay.position().global().left(`${x}px`).top(`${y}px`),
      scrollStrategy: this._overlay.scrollStrategies.close(),
    });

    const portal = new ComponentPortal(NeuContextMenuOverlayComponent, this._vcr, this._injector);
    this._compRef = this._overlayRef.attach(portal);
    this._compRef.instance._items.set(this.neuContextMenu());
    this._compRef.instance._selectFn = (item) => {
      this.menuItemClick.emit(item);
      this._close();
    };
    this._compRef.instance._escapeFn = () => this._close();

    this._overlayRef.backdropClick().subscribe(() => this._close());
    this.menuOpened.emit();
  }

  private _close(): void {
    if (this._overlayRef?.hasAttached()) {
      this._overlayRef.detach();
      this.menuClosed.emit();
    }
    this._overlayRef?.dispose();
    this._overlayRef = null;
    this._compRef = null;
  }

  ngOnDestroy(): void {
    this._close();
  }
}
