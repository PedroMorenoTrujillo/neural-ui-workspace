import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  HostListener,
  Injector,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import {
  NEU_OVERLAY_DISMISS_GUARD,
  allowsNeuOverlayDismissal,
  type NeuOverlayDismissReason,
} from '@neural-ui/core/foundation';

export type NeuPopoverPosition = 'top' | 'bottom' | 'left' | 'right';
export type NeuPopoverTrigger = 'click' | 'hover' | 'focus';

/**
 * NeuralUI Popover Overlay Component (internal)
 * Renderizado por CDK Portal — no usar directamente.
 */
@Component({
  selector: 'neu-popover-overlay',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-popover',
    '[attr.id]': '_id()',
    '[attr.role]': '_role()',
    '[attr.aria-modal]': '_role() === "dialog" ? "false" : null',
  },
  template: `
    @if (_templateRef) {
      <ng-container [ngTemplateOutlet]="_templateRef" [ngTemplateOutletContext]="_context" />
    } @else {
      <div class="neu-popover__inner">{{ _text() }}</div>
    }
  `,
  styleUrl: './neu-popover.component.scss',
})
export class NeuPopoverOverlayComponent {
  readonly _text = signal('');
  readonly _id = signal('');
  readonly _role = signal<'dialog' | null>(null);
  _templateRef: TemplateRef<unknown> | null = null;
  _context: unknown = {};
}

/**
 * NeuralUI Popover Directive
 *
 * Muestra un popover flotante anclado al elemento host usando CDK Overlay.
 *
 * Uso:
 *   <button [neuPopoverTemplate]="myTpl">Info</button>
 *   <ng-template #myTpl>Contenido del popover</ng-template>
 *
 *   <button [neuPopoverText]="'Descripción detallada'">Hover me</button>
 */
@Directive({
  selector: '[neuPopover]',
  exportAs: 'neuPopover',
  host: {
    '[attr.aria-haspopup]': '_hostAriaHasPopup()',
    '[attr.aria-expanded]': '_hostAriaExpanded()',
    '[attr.aria-controls]': '_hostAriaControls()',
    '[attr.aria-describedby]': '_hostAriaDescribedBy()',
  },
})
export class NeuPopoverDirective implements OnDestroy {
  /** Template del contenido / Content template */
  readonly neuPopover = input<TemplateRef<unknown> | null>(null);

  /** Texto plano cuando no hay template / Plain text when no template */
  readonly neuPopoverText = input<string>('');

  /** Posición preferida / Preferred position */
  readonly neuPopoverPosition = input<NeuPopoverPosition>('bottom');

  /** Trigger del popover / Popover trigger */
  readonly neuPopoverTrigger = input<NeuPopoverTrigger>('click');

  /** Desactiva el popover / Disables the popover */
  readonly neuPopoverDisabled = input<boolean>(false);

  /** Contexto del template / Template context */
  readonly neuPopoverContext = input<unknown>({});

  /** Emitido al abrir / Emitted on open */
  readonly popoverOpened = output<void>();

  /** Emitido al cerrar / Emitted on close */
  readonly popoverClosed = output<void>();

  private readonly _isOpen = signal(false);

  private readonly _overlay = inject(Overlay);
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _injector = inject(Injector);
  private readonly _vcr = inject(ViewContainerRef);
  private readonly _popoverId = inject(NeuIdGenerator).getId('neu-popover-');
  private readonly dismissGuard = inject(NEU_OVERLAY_DISMISS_GUARD, { optional: true });

  private _overlayRef: OverlayRef | null = null;
  private _compRef: ComponentRef<NeuPopoverOverlayComponent> | null = null;

  @HostListener('click')
  onHostClick(): void {
    if (this.neuPopoverTrigger() !== 'click') return;
    this._toggle();
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.neuPopoverTrigger() !== 'hover') return;
    this.open();
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeave(event?: MouseEvent): void {
    if (this.neuPopoverTrigger() !== 'hover') return;
    this.requestClose('outside-pointer', event ?? null);
  }

  @HostListener('focus')
  onFocus(): void {
    if (this.neuPopoverTrigger() !== 'focus') return;
    this.open();
  }

  @HostListener('blur', ['$event'])
  onBlur(event?: FocusEvent): void {
    if (this.neuPopoverTrigger() !== 'focus') return;
    this.requestClose('focus-loss', event ?? null);
  }

  @HostListener('keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    if (!(event instanceof KeyboardEvent) || event.key !== 'Escape' || !this._isOpen()) return;
    event.preventDefault();
    event.stopPropagation();
    this.requestClose('escape', event);
  }

  /** Abre el popover / Opens the popover */
  open(): void {
    if (this.neuPopoverDisabled() || this._isOpen()) return;
    this._createOverlay();
    const portal = new ComponentPortal(NeuPopoverOverlayComponent, this._vcr, this._injector);
    this._compRef = this._overlayRef!.attach(portal);
    const comp = this._compRef.instance;
    const tpl = this.neuPopover();
    if (tpl) {
      comp._templateRef = tpl;
      comp._context = this.neuPopoverContext();
    } else {
      comp._text.set(this.neuPopoverText());
    }
    comp._id.set(this._popoverId);
    comp._role.set(this.neuPopoverTrigger() === 'click' ? 'dialog' : null);
    this._isOpen.set(true);
    this.popoverOpened.emit();

    // Cierra al hacer clic fuera (solo en trigger 'click') / Close on outside click (click trigger only)
    if (this.neuPopoverTrigger() === 'click') {
      this._overlayRef!.backdropClick().subscribe((event) =>
        this.requestClose('outside-pointer', event),
      );
    }
    this._overlayRef!.keydownEvents().subscribe((event) => this.onEscape(event));
    this._overlayRef!.detachments().subscribe(() => this._finalizeClose());
  }

  /** Cierra el popover / Closes the popover */
  close(): void {
    if (!this._isOpen()) return;
    this._finalizeClose();
  }

  private requestClose(reason: NeuOverlayDismissReason, event: Event | null): void {
    if (
      !allowsNeuOverlayDismissal(this.dismissGuard, {
        source: 'popover',
        reason,
        originalEvent: event,
      })
    )
      return;
    this.close();
  }

  /** Alterna la visibilidad / Toggles visibility */
  toggle(): void {
    this._toggle();
  }

  ngOnDestroy(): void {
    this._isOpen.set(false);
    const overlayRef = this._overlayRef;
    this._overlayRef = null;
    this._compRef = null;
    overlayRef?.dispose();
  }

  protected _hostAriaHasPopup(): 'dialog' | null {
    return this.neuPopoverTrigger() === 'click' ? 'dialog' : null;
  }

  protected _hostAriaExpanded(): 'true' | 'false' | null {
    if (this.neuPopoverTrigger() !== 'click') {
      return null;
    }
    return this._isOpen() ? 'true' : 'false';
  }

  protected _hostAriaControls(): string | null {
    return this.neuPopoverTrigger() === 'click' && this._isOpen() ? this._popoverId : null;
  }

  protected _hostAriaDescribedBy(): string | null {
    return this.neuPopoverTrigger() !== 'click' && this._isOpen() ? this._popoverId : null;
  }

  private _toggle(): void {
    this._isOpen() ? this.close() : this.open();
  }

  private _createOverlay(): void {
    if (this._overlayRef) {
      this._overlayRef.dispose();
    }
    const pos = this.neuPopoverPosition();
    const isClick = this.neuPopoverTrigger() === 'click';
    const positions: ConnectedPosition[] = [
      ...POSITIONS[pos],
      ...POSITIONS[OPPOSITE_POSITION[pos]],
    ];
    this._overlayRef = this._overlay.create({
      // Solo usamos backdrop en trigger 'click' — hover/focus lo cierran con sus propios listeners.
      // Only use backdrop for 'click' trigger — hover/focus close via their own listeners.
      hasBackdrop: isClick,
      backdropClass: 'neu-popover-backdrop',
      positionStrategy: this._overlay
        .position()
        .flexibleConnectedTo(this._el)
        .withPositions(positions)
        .withPush(true)
        .withViewportMargin(8),
      scrollStrategy: this._overlay.scrollStrategies.reposition(),
    });
  }

  private _finalizeClose(): void {
    if (!this._isOpen()) return;
    this._isOpen.set(false);
    const overlayRef = this._overlayRef;
    this._overlayRef = null;
    this._compRef = null;
    overlayRef?.dispose();
    this.popoverClosed.emit();
  }
}

const OPPOSITE_POSITION: Record<NeuPopoverPosition, NeuPopoverPosition> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

const POSITIONS: Record<NeuPopoverPosition, ConnectedPosition[]> = {
  bottom: [
    { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 6 },
  ],
  top: [{ originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -6 }],
  left: [{ originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -6 }],
  right: [{ originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 6 }],
};
