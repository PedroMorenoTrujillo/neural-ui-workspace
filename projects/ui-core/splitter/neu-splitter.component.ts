import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-splitter',
    '[class.neu-splitter--horizontal]': 'direction() === "horizontal"',
    '[class.neu-splitter--vertical]': 'direction() === "vertical"',
  },
  template: `
    @for (size of _sizes(); track $index) {
      <div
        class="neu-splitter__pane"
        [style.flex-basis]="size + '%'"
        [style.min-width]="direction() === 'horizontal' ? (panes()[$index]?.min ?? 0) + 'px' : null"
        [style.min-height]="direction() === 'vertical' ? (panes()[$index]?.min ?? 0) + 'px' : null"
      >
        <ng-content select="neu-splitter-pane" />
      </div>
      @if (!$last) {
        <div
          class="neu-splitter__handle"
          role="separator"
          tabindex="0"
          [attr.aria-valuenow]="size"
          [attr.aria-valuemin]="0"
          [attr.aria-valuemax]="100"
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

  private readonly _el = inject(ElementRef<HTMLElement>);
  readonly _sizes = signal<number[]>([]);

  constructor() {
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
  }

  private _dragIndex = -1;
  private _dragPos = 0;

  _startDrag(e: MouseEvent, index: number): void {
    e.preventDefault();
    this._dragIndex = index;
    this._dragPos = this.direction() === 'horizontal' ? e.clientX : e.clientY;
    const onMove = (ev: MouseEvent) => this._onDragMove(ev.clientX, ev.clientY);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      this._dragIndex = -1;
      this.sizeChange.emit(this._sizes());
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  _startTouchDrag(e: TouchEvent, index: number): void {
    const t = e.touches[0];
    this._dragIndex = index;
    this._dragPos = this.direction() === 'horizontal' ? t.clientX : t.clientY;
    const onMove = (ev: TouchEvent) =>
      this._onDragMove(ev.touches[0].clientX, ev.touches[0].clientY);
    const onEnd = () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      this._dragIndex = -1;
      this.sizeChange.emit(this._sizes());
    };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  }

  _onHandleKey(e: KeyboardEvent, index: number): void {
    const step = 2;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      this._adjustPair(index, -step);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      this._adjustPair(index, step);
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
    this._adjustPair(this._dragIndex, (delta / total) * 100);
  }

  private _adjustPair(index: number, delta: number): void {
    const sizes = [...this._sizes()];
    const container = this._el.nativeElement;
    const total =
      this.direction() === 'horizontal' ? container.offsetWidth : container.offsetHeight;
    const minA = this.panes()[index]?.min ?? 0;
    const minB = this.panes()[index + 1]?.min ?? 0;
    const minPctA = total > 0 ? (minA / total) * 100 : 0;
    const minPctB = total > 0 ? (minB / total) * 100 : 0;

    let newA = sizes[index] + delta;
    let newB = sizes[index + 1] - delta;
    if (newA < minPctA) {
      newB -= minPctA - newA;
      newA = minPctA;
    }
    if (newB < minPctB) {
      newA -= minPctB - newB;
      newB = minPctB;
    }

    sizes[index] = Math.max(0, newA);
    sizes[index + 1] = Math.max(0, newB);
    this._sizes.set(sizes);
  }
}
