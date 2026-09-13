import {
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterRenderEffect,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';

export type NeuSplitterDirection = 'horizontal' | 'vertical';

export interface NeuSplitterPane {
  size?: number;
  min?: number;
  max?: number;
}

@Component({
  selector: 'neu-splitter',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-splitter',
    '[class.neu-splitter--horizontal]': 'direction() === "horizontal"',
    '[class.neu-splitter--vertical]': 'direction() === "vertical"',
  },
  template: `
    <div class="neu-splitter__projection-source" aria-hidden="true"><ng-content select="neu-splitter-pane" /></div>
    @for (size of _sizes(); track $index) {
      <div
        class="neu-splitter__pane"
        [style.flex-basis]="size + '%'"
        [style.min-width]="direction() === 'horizontal' ? (panes()[$index]?.min ?? 0) + 'px' : null"
        [style.min-height]="direction() === 'vertical' ? (panes()[$index]?.min ?? 0) + 'px' : null"
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
          [attr.aria-orientation]="direction() === 'horizontal' ? 'vertical' : 'horizontal'"
          [attr.aria-label]="'Separador ' + ($index + 1)"
          (mousedown)="_startDrag($event, $index)"
          (touchstart)="_startTouchDrag($event, $index)"
          (keydown)="_onHandleKey($event, $index)"
        >
          <span class="neu-splitter__handle-dots" aria-hidden="true"></span>
        </div>
      }
    }
  `,
  styleUrl: './neu-splitter.component.scss',
})
export class NeuSplitterComponent {
  readonly direction = input<NeuSplitterDirection>('horizontal');
  readonly panes = input<NeuSplitterPane[]>([]);
  readonly sizeChange = output<number[]>();
  /** Sizes at pointer/touch drag start; keyboard uses sizeChange only. */
  readonly resizeStart = output<number[]>();
  /** Changed live percentage sizes during a drag. */
  readonly resize = output<number[]>();

  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _paneSlots = viewChildren<ElementRef<HTMLElement>>('paneSlot');
  protected readonly _sizes = signal<number[]>([]);
  private _dragSessionDisposer: (() => void) | null = null;

  constructor() {
    this._destroyRef.onDestroy(() => this._disposeDragSession());
    effect(() => {
      const ps = this.panes();
      untracked(() => {
        if (!ps.length) return;
        const defined = ps.filter((p) => p.size !== undefined);
        const total = defined.reduce((sum, p) => sum + (p.size ?? 0), 0);
        if (defined.length === ps.length) {
          this._sizes.set(ps.map((p) => p.size ?? 0));
        } else {
          const remaining = (100 - total) / (ps.length - defined.length);
          this._sizes.set(ps.map((p) => p.size ?? remaining));
        }
      });
    });
    afterRenderEffect(() => {
      this._sizes();
      this._paneSlots();
      this._attachProjectedPanes();
    });
  }

  private _dragIndex = -1;
  private _dragPos = 0;

  protected _startDrag(e: MouseEvent, index: number): void {
    if (this._destroyRef.destroyed || e.button !== 0) return;
    e.preventDefault();
    this._disposeDragSession();
    this._dragIndex = index;
    this._dragPos = this.direction() === 'horizontal' ? e.clientX : e.clientY;
    const view = this._el.nativeElement.ownerDocument.defaultView;
    if (!view) return;
    const onMove = (ev: MouseEvent) => this._onDragMove(ev.clientX, ev.clientY);
    const onUp = () => {
      this._disposeDragSession();
      this.sizeChange.emit(this._sizes());
    };
    this._dragSessionDisposer = () => {
      view.removeEventListener('mousemove', onMove);
      view.removeEventListener('mouseup', onUp);
      view.removeEventListener('blur', onUp);
      this._dragIndex = -1;
      this._dragSessionDisposer = null;
    };
    view.addEventListener('mousemove', onMove);
    view.addEventListener('mouseup', onUp);
    view.addEventListener('blur', onUp);
    this.resizeStart.emit([...this._sizes()]);
  }

  protected _startTouchDrag(e: TouchEvent, index: number): void {
    if (this._destroyRef.destroyed || !e.touches.length) return;
    this._disposeDragSession();
    const t = e.touches[0];
    this._dragIndex = index;
    this._dragPos = this.direction() === 'horizontal' ? t.clientX : t.clientY;
    const view = this._el.nativeElement.ownerDocument.defaultView;
    if (!view) return;
    const onMove = (ev: TouchEvent) => {
      ev.preventDefault();
      this._onDragMove(ev.touches[0].clientX, ev.touches[0].clientY);
    };
    const onEnd = () => {
      this._disposeDragSession();
      this.sizeChange.emit(this._sizes());
    };
    this._dragSessionDisposer = () => {
      view.removeEventListener('touchmove', onMove);
      view.removeEventListener('touchend', onEnd);
      view.removeEventListener('touchcancel', onEnd);
      this._dragIndex = -1;
      this._dragSessionDisposer = null;
    };
    view.addEventListener('touchmove', onMove, { passive: false });
    view.addEventListener('touchend', onEnd);
    view.addEventListener('touchcancel', onEnd);
    this.resizeStart.emit([...this._sizes()]);
  }

  private _disposeDragSession(): void {
    this._dragSessionDisposer?.();
  }

  protected _onHandleKey(e: KeyboardEvent, index: number): void {
    const step = 2;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (this._adjustPair(index, -step)) this.sizeChange.emit(this._sizes());
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (this._adjustPair(index, step)) this.sizeChange.emit(this._sizes());
    }
  }

  private _onDragMove(clientX: number, clientY: number): void {
    if (this._dragIndex < 0) return;
    const pos = this.direction() === 'horizontal' ? clientX : clientY;
    const delta = pos - this._dragPos;
    this._dragPos = pos;
    const container = this._el.nativeElement;
    const total =
      this.direction() === 'horizontal' ? container.offsetWidth : container.offsetHeight;
    if (total === 0) return;
    if (this._adjustPair(this._dragIndex, (delta / total) * 100)) this.resize.emit([...this._sizes()]);
  }

  private _adjustPair(index: number, delta: number): boolean {
    const sizes = [...this._sizes()];
    if (sizes[index] == null || sizes[index + 1] == null) return false;
    const container = this._el.nativeElement;
    const total =
      this.direction() === 'horizontal' ? container.offsetWidth : container.offsetHeight;
    const minA = this.panes()[index]?.min ?? 0;
    const minB = this.panes()[index + 1]?.min ?? 0;
    const minPctA = total > 0 ? (minA / total) * 100 : 0;
    const minPctB = total > 0 ? (minB / total) * 100 : 0;
    const maxA = this.panes()[index]?.max;
    const maxB = this.panes()[index + 1]?.max;
    const maxPctA = total > 0 && maxA != null ? (maxA / total) * 100 : 100;
    const maxPctB = total > 0 && maxB != null ? (maxB / total) * 100 : 100;
    const pairTotal = sizes[index] + sizes[index + 1];
    const lower = Math.max(0, minPctA, pairTotal - maxPctB);
    const upper = Math.min(100, maxPctA, pairTotal - minPctB);
    const newA = Math.max(lower, Math.min(upper, sizes[index] + delta));
    const newB = pairTotal - newA;
    if (newA === sizes[index] && newB === sizes[index + 1]) return false;
    sizes[index] = newA;
    sizes[index + 1] = newB;
    this._sizes.set(sizes);
    return true;
  }

  protected _ariaMin(index: number): number {
    const total = this._containerSize();
    return total > 0 ? Math.round(((this.panes()[index]?.min ?? 0) / total) * 100) : 0;
  }

  protected _ariaMax(index: number): number {
    const total = this._containerSize();
    const max = this.panes()[index]?.max;
    return total > 0 && max != null ? Math.round((max / total) * 100) : 100;
  }

  private _containerSize(): number {
    return this.direction() === 'horizontal'
      ? this._el.nativeElement.offsetWidth
      : this._el.nativeElement.offsetHeight;
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
