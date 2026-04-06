import {
  ComponentRef,
  Directive,
  ElementRef,
  HostListener,
  Injector,
  NgZone,
  OnDestroy,
  inject,
  input,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { NeuTooltipOverlayComponent } from './neu-tooltip.component';

export type NeuTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * NeuralUI Tooltip Directive
 *
 * Muestra un globo informativo al hacer hover/focus sobre el elemento host.
 * Usa CDK Overlay para posicionamiento robusto.
 *
 * Uso:
 *   <button [neuTooltip]="'Guardar cambios'">Guardar</button>
 *   <button [neuTooltip]="'Eliminar'" neuTooltipPosition="bottom">Eliminar</button>
 */
@Directive({
  selector: '[neuTooltip]',
  host: {
    '[attr.aria-describedby]': '_tooltipId',
    '[attr.tabindex]': '"0"',
  },
})
export class NeuTooltipDirective implements OnDestroy {
  readonly neuTooltip = input.required<string>();
  readonly neuTooltipPosition = input<NeuTooltipPosition>('top');
  readonly neuTooltipDisabled = input<boolean>(false);

  private readonly _overlay = inject(Overlay);
  private readonly _elementRef = inject(ElementRef<HTMLElement>);
  private readonly _injector = inject(Injector);
  private readonly _zone = inject(NgZone);

  readonly _tooltipId = `neu-tooltip-${Math.random().toString(36).slice(2, 7)}`;

  private _overlayRef: OverlayRef | null = null;
  private _tooltipRef: ComponentRef<NeuTooltipOverlayComponent> | null = null;
  private _hideTimeout: ReturnType<typeof setTimeout> | null = null;

  @HostListener('mouseenter')
  @HostListener('focus')
  show(): void {
    if (this.neuTooltipDisabled() || !this.neuTooltip()) return;
    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }
    if (this._overlayRef?.hasAttached()) return;

    this._zone.run(() => {
      this._createOverlay();
      const portal = new ComponentPortal(NeuTooltipOverlayComponent, null, this._injector);
      this._tooltipRef = this._overlayRef!.attach(portal);
      this._tooltipRef!.setInput('text', this.neuTooltip());
    });
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  hide(): void {
    this._hideTimeout = setTimeout(() => this._detach(), 100);
  }

  private _createOverlay(): void {
    if (this._overlayRef) return;

    const positionStrategy = this._overlay
      .position()
      .flexibleConnectedTo(this._elementRef)
      .withPositions(this._getPositions());

    this._overlayRef = this._overlay.create({
      positionStrategy,
      scrollStrategy: this._overlay.scrollStrategies.reposition(),
      panelClass: 'neu-tooltip-panel',
    });
  }

  private _getPositions(): ConnectedPosition[] {
    const map: Record<NeuTooltipPosition, ConnectedPosition> = {
      top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
      bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
      left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 },
      right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 },
    };
    return [map[this.neuTooltipPosition()], map['top'], map['bottom']];
  }

  private _detach(): void {
    this._overlayRef?.detach();
    this._tooltipRef = null;
  }

  ngOnDestroy(): void {
    if (this._hideTimeout) clearTimeout(this._hideTimeout);
    this._overlayRef?.dispose();
  }
}
