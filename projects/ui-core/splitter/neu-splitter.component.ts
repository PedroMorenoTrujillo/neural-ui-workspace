import {
  Component, DestroyRef, ElementRef, ViewEncapsulation, afterRenderEffect,
  computed, inject, input, output, signal, viewChildren,
} from '@angular/core';

export type NeuSplitterDirection = 'horizontal' | 'vertical';

export interface NeuSplitterPane {
  size?: number;
  min?: number;
  max?: number;
}

interface DragSession {
  pointerId: number;
  index: number;
  position: number;
  handle: HTMLElement;
}

@Component({
  selector: 'neu-splitter',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-splitter',
    '[class.neu-splitter--horizontal]': 'orientation() === "horizontal"',
    '[class.neu-splitter--vertical]': 'orientation() === "vertical"',
  },
  template: `
    <div class="neu-splitter__projection-source" aria-hidden="true"><ng-content select="neu-splitter-pane" /></div>
    @for (size of _sizes(); track $index) {
      <div
        class="neu-splitter__pane"
        [style.flex-basis]="size + '%'"
        [style.min-width]="orientation() === 'horizontal' ? (panes()[$index]?.min ?? 0) + 'px' : null"
        [style.min-height]="orientation() === 'vertical' ? (panes()[$index]?.min ?? 0) + 'px' : null"
      >
        <div class="neu-splitter__pane-slot" #paneSlot></div>
      </div>
      @if (!$last) {
        <div
          class="neu-splitter__handle"
          role="separator"
          tabindex="0"
          [attr.aria-valuenow]="size"
          [attr.aria-valuemin]="_ariaMin($index)"
          [attr.aria-valuemax]="_ariaMax($index)"
          [attr.aria-orientation]="orientation() === 'horizontal' ? 'vertical' : 'horizontal'"
          [attr.aria-label]="'Separador ' + ($index + 1)"
          (pointerdown)="_onPointerDown($event, $index)"
          (pointermove)="_onPointerMove($event)"
          (pointerup)="_onPointerEnd($event)"
          (pointercancel)="_onPointerEnd($event)"
          (lostpointercapture)="_onPointerEnd($event)"
          (keydown)="_onHandleKey($event, $index)"
        ><span class="neu-splitter__handle-dots" aria-hidden="true"></span></div>
      }
    }
  `,
  styleUrl: './neu-splitter.component.scss',
})
export class NeuSplitterComponent {
  readonly orientation = input<NeuSplitterDirection>('horizontal');
  readonly panes = input<readonly NeuSplitterPane[]>([]);
  /** Proposal in pane-array order, expressed as percentages. */
  readonly sizesChange = output<readonly number[]>();
  readonly resizeStart = output<readonly number[]>();
  readonly resize = output<readonly number[]>();

  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _paneSlots = viewChildren<ElementRef<HTMLElement>>('paneSlot');
  private readonly _appliedSizes = computed(() => {
    const panes = this.panes();
    if (!panes.length) return [];
    const total = panes.reduce((sum, pane) => sum + (pane.size ?? 0), 0);
    const unspecified = panes.filter((pane) => pane.size === undefined).length;
    const remaining = unspecified ? (100 - total) / unspecified : 0;
    return panes.map((pane) => pane.size ?? remaining);
  });
  private readonly _dragPreview = signal<readonly number[] | null>(null);
  protected readonly _sizes = computed(() => this._dragPreview() ?? this._appliedSizes());
  private _drag: DragSession | null = null;

  constructor() {
    this._destroyRef.onDestroy(() => this._endDrag());
    afterRenderEffect(() => {
      this._sizes();
      this._paneSlots();
      this._attachProjectedPanes();
    });
  }

  protected _onPointerDown(event: PointerEvent, index: number): void {
    if (this._destroyRef.destroyed || event.button !== 0 || this._drag) return;
    const handle = event.currentTarget as HTMLElement;
    const position = this.orientation() === 'horizontal' ? event.clientX : event.clientY;
    this._drag = { pointerId: event.pointerId, index, position, handle };
    this._dragPreview.set([...this._appliedSizes()]);
    handle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    this.resizeStart.emit([...this._appliedSizes()]);
  }

  protected _onPointerMove(event: PointerEvent): void {
    const drag = this._drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const position = this.orientation() === 'horizontal' ? event.clientX : event.clientY;
    const physicalDelta = position - drag.position;
    drag.position = position;
    const total = this._containerSize();
    if (total <= 0) return;
    const sign = this.orientation() === 'horizontal' && this._isRtl() ? -1 : 1;
    const candidate = this._proposePair(drag.index, (physicalDelta / total) * 100 * sign, this._sizes());
    if (!candidate) return;
    this._dragPreview.set(candidate);
    this.resize.emit([...candidate]);
    this.sizesChange.emit([...candidate]);
  }

  protected _onPointerEnd(event: PointerEvent): void {
    if (this._drag?.pointerId === event.pointerId) this._endDrag();
  }

  private _endDrag(): void {
    const drag = this._drag;
    this._drag = null;
    this._dragPreview.set(null);
    if (drag?.handle.hasPointerCapture?.(drag.pointerId)) {
      drag.handle.releasePointerCapture(drag.pointerId);
    }
  }

  protected _onHandleKey(event: KeyboardEvent, index: number): void {
    const horizontal = this.orientation() === 'horizontal';
    let physicalStep = 0;
    if (horizontal && event.key === 'ArrowLeft') physicalStep = -2;
    if (horizontal && event.key === 'ArrowRight') physicalStep = 2;
    if (!horizontal && event.key === 'ArrowUp') physicalStep = -2;
    if (!horizontal && event.key === 'ArrowDown') physicalStep = 2;
    if (!physicalStep) return;
    event.preventDefault();
    const candidate = this._proposePair(
      index, physicalStep * (horizontal && this._isRtl() ? -1 : 1), this._appliedSizes(),
    );
    if (candidate) this.sizesChange.emit([...candidate]);
  }

  private _proposePair(index: number, delta: number, base: readonly number[]): number[] | null {
    if (base[index] == null || base[index + 1] == null) return null;
    const sizes = [...base];
    const [lower, upper] = this._pairBounds(index, base);
    if (lower > upper) return null;
    const next = Math.max(lower, Math.min(upper, sizes[index] + delta));
    if (next === sizes[index]) return null;
    const pairTotal = sizes[index] + sizes[index + 1];
    sizes[index] = next;
    sizes[index + 1] = pairTotal - next;
    return sizes;
  }

  private _pairBounds(index: number, sizes: readonly number[]): readonly [number, number] {
    const total = this._containerSize();
    const paneA = this.panes()[index];
    const paneB = this.panes()[index + 1];
    const pairTotal = sizes[index] + sizes[index + 1];
    const toPercent = (pixels: number) => total > 0 ? pixels / total * 100 : 0;
    const minA = toPercent(paneA?.min ?? 0);
    const minB = toPercent(paneB?.min ?? 0);
    const maxA = paneA?.max == null || total <= 0 ? 100 : toPercent(paneA.max);
    const maxB = paneB?.max == null || total <= 0 ? 100 : toPercent(paneB.max);
    return [Math.max(0, minA, pairTotal - maxB), Math.min(100, maxA, pairTotal - minB)];
  }

  protected _ariaMin(index: number): number {
    return this._pairBounds(index, this._sizes())[0];
  }

  protected _ariaMax(index: number): number {
    return this._pairBounds(index, this._sizes())[1];
  }

  private _containerSize(): number {
    return this.orientation() === 'horizontal'
      ? this._el.nativeElement.offsetWidth : this._el.nativeElement.offsetHeight;
  }

  private _isRtl(): boolean {
    const host = this._el.nativeElement;
    return host.ownerDocument.defaultView?.getComputedStyle(host).direction === 'rtl';
  }

  private _attachProjectedPanes(): void {
    const host = this._el.nativeElement as HTMLElement;
    if (!host.ownerDocument.defaultView) return;
    const source = host.querySelector<HTMLElement>('.neu-splitter__projection-source');
    if (!source) return;
    const projected = Array.from(source.children);
    const slots = this._paneSlots();
    projected.forEach((pane, index) => {
      const slot = slots[index]?.nativeElement;
      if (slot && pane.parentElement !== slot) slot.appendChild(pane);
    });
  }
}
