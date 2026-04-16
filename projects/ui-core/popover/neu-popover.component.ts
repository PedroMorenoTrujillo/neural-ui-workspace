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
  host: { class: 'neu-popover' },
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

  readonly _isOpen = signal(false);

  private readonly _overlay = inject(Overlay);
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _injector = inject(Injector);
  private readonly _vcr = inject(ViewContainerRef);

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

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.neuPopoverTrigger() !== 'hover') return;
    this.close();
  }

  @HostListener('focus')
  onFocus(): void {
    if (this.neuPopoverTrigger() !== 'focus') return;
    this.open();
  }

  @HostListener('blur')
  onBlur(): void {
    if (this.neuPopoverTrigger() !== 'focus') return;
    this.close();
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
    this._isOpen.set(true);
    this.popoverOpened.emit();

    // Cierra al hacer clic fuera (solo en trigger 'click') / Close on outside click (click trigger only)
    if (this.neuPopoverTrigger() === 'click') {
      this._overlayRef!.backdropClick().subscribe(() => this.close());
    }
  }

  /** Cierra el popover / Closes the popover */
  close(): void {
    this._overlayRef?.detach();
    this._isOpen.set(false);
    this.popoverClosed.emit();
  }

  /** Alterna la visibilidad / Toggles visibility */
  toggle(): void {
    this._toggle();
  }

  ngOnDestroy(): void {
    this._overlayRef?.dispose();
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
      ...POSITIONS[pos === 'bottom' ? 'top' : 'bottom'],
    ];
    this._overlayRef = this._overlay.create({
      // Solo usamos backdrop en trigger 'click' — hover/focus lo cierran con sus propios listeners.
      // Only use backdrop for 'click' trigger — hover/focus close via their own listeners.
      hasBackdrop: isClick,
      backdropClass: 'neu-popover-backdrop',
      positionStrategy: this._overlay
        .position()
        .flexibleConnectedTo(this._el)
        .withPositions(positions),
      scrollStrategy: this._overlay.scrollStrategies.reposition(),
    });
  }
}

const POSITIONS: Record<NeuPopoverPosition, ConnectedPosition[]> = {
  bottom: [
    { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 6 },
  ],
  top: [{ originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -6 }],
  left: [{ originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -6 }],
  right: [{ originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 6 }],
};
