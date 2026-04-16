import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

export interface NeuImageViewerItem {
  src: string;
  alt?: string;
  caption?: string;
}

/** Token que comparte datos entre directiva y overlay */
import { InjectionToken } from '@angular/core';

export const NEU_IV_DATA = new InjectionToken<_NeuIvData>('NEU_IV_DATA');

interface _NeuIvData {
  items: NeuImageViewerItem[];
  initialIndex: number;
  close: () => void;
}

/**
 * Componente interno del overlay del visor de imágenes.
 * No debe usarse directamente — es instanciado por la directiva.
 */
@Component({
  selector: 'neu-image-viewer-overlay',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-iv',
    'aria-modal': 'true',
    role: 'dialog',
    'aria-label': 'Visor de imágenes',
    tabIndex: '0',
    '(keydown)': '_onKey($event)',
    '(click)': '_onBackdropClick($event)',
  },
  template: `
    <div class="neu-iv__overlay" (click)="$event.stopPropagation()">
      <!-- Toolbar -->
      <div class="neu-iv__toolbar">
        <span class="neu-iv__counter">{{ _index() + 1 }} / {{ _data.items.length }}</span>
        <div class="neu-iv__toolbar-actions">
          <button type="button" class="neu-iv__btn" aria-label="Zoom in" (click)="_zoom(0.25)">
            ＋
          </button>
          <button type="button" class="neu-iv__btn" aria-label="Zoom out" (click)="_zoom(-0.25)">
            －
          </button>
          <button type="button" class="neu-iv__btn" aria-label="Reset zoom" (click)="_resetZoom()">
            ⟳
          </button>
          <button
            type="button"
            class="neu-iv__btn neu-iv__btn--close"
            aria-label="Cerrar"
            (click)="_data.close()"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Image -->
      <div class="neu-iv__stage" (wheel)="_onWheel($event)" (mousedown)="_onMouseDown($event)">
        <img
          class="neu-iv__img"
          [src]="_current().src"
          [alt]="_current().alt ?? ''"
          [style.transform]="_transform()"
          draggable="false"
        />
      </div>

      <!-- Caption -->
      @if (_current().caption) {
        <div class="neu-iv__caption">{{ _current().caption }}</div>
      }

      <!-- Prev/Next arrows -->
      @if (_data.items.length > 1) {
        <button
          type="button"
          class="neu-iv__arrow neu-iv__arrow--prev"
          aria-label="Anterior"
          [disabled]="_index() === 0"
          (click)="_navigate(-1)"
        >
          ‹
        </button>
        <button
          type="button"
          class="neu-iv__arrow neu-iv__arrow--next"
          aria-label="Siguiente"
          [disabled]="_index() === _data.items.length - 1"
          (click)="_navigate(1)"
        >
          ›
        </button>
      }
    </div>
  `,
  styleUrl: './neu-image-viewer.component.scss',
})
export class NeuImageViewerOverlayComponent {
  readonly _data = inject(NEU_IV_DATA);
  readonly _index = signal(this._data.initialIndex);
  readonly _scale = signal(1);
  readonly _panX = signal(0);
  readonly _panY = signal(0);

  private _dragging = false;
  private _dragStart = { x: 0, y: 0, px: 0, py: 0 };

  readonly _current = computed(() => this._data.items[this._index()]);

  readonly _transform = computed(
    () => `translate(${this._panX()}px, ${this._panY()}px) scale(${this._scale()})`,
  );

  _navigate(dir: -1 | 1): void {
    this._index.update((i) => Math.max(0, Math.min(this._data.items.length - 1, i + dir)));
    this._resetZoom();
  }

  _zoom(delta: number): void {
    this._scale.update((s) => Math.max(0.25, Math.min(5, s + delta)));
  }

  _resetZoom(): void {
    this._scale.set(1);
    this._panX.set(0);
    this._panY.set(0);
  }

  _onWheel(e: WheelEvent): void {
    e.preventDefault();
    this._zoom(e.deltaY < 0 ? 0.1 : -0.1);
  }

  _onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this._dragging = true;
    this._dragStart = {
      x: e.clientX,
      y: e.clientY,
      px: this._panX(),
      py: this._panY(),
    };
    const onMove = (ev: MouseEvent) => {
      if (!this._dragging) return;
      this._panX.set(this._dragStart.px + ev.clientX - this._dragStart.x);
      this._panY.set(this._dragStart.py + ev.clientY - this._dragStart.y);
    };
    const onUp = () => {
      this._dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  _onBackdropClick(_e: MouseEvent): void {
    this._data.close();
  }

  _onKey(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowLeft':
        this._navigate(-1);
        break;
      case 'ArrowRight':
        this._navigate(1);
        break;
      case 'Escape':
        this._data.close();
        break;
      case '+':
        this._zoom(0.25);
        break;
      case '-':
        this._zoom(-0.25);
        break;
    }
  }
}

/**
 * NeuralUI ImageViewer Directive
 *
 * Adjunta un visor de imágenes en pantalla completa a cualquier elemento.
 *
 * Uso básico (imagen única):
 *   <img src="photo.jpg" [neuImageViewer]="src" />
 *
 * Uso con galería:
 *   <img src="photo.jpg" [neuImageViewer]="items" [neuIvIndex]="0" />
 */
@Directive({
  selector: '[neuImageViewer]',
  exportAs: 'neuImageViewer',
  host: {
    class: 'neu-iv-trigger',
    style: 'cursor:pointer',
    '(click)': 'open()',
  },
})
export class NeuImageViewerDirective implements OnDestroy {
  /** Puede ser una URL, NeuImageViewerItem o un array de items */
  readonly neuImageViewer = input<string | NeuImageViewerItem | NeuImageViewerItem[]>('');
  /** Índice inicial cuando se pasa un array */
  readonly neuIvIndex = input<number>(0);

  private readonly _overlay = inject(Overlay);
  private readonly _injector = inject(Injector);
  private _overlayRef: OverlayRef | null = null;

  open(): void {
    if (this._overlayRef) return;

    const items = this._normalizeItems();
    const overlayRef = this._overlay.create({
      hasBackdrop: false,
      scrollStrategy: this._overlay.scrollStrategies.block(),
      positionStrategy: this._overlay.position().global().centerHorizontally().centerVertically(),
    });

    const data: _NeuIvData = {
      items,
      initialIndex: Math.max(0, Math.min(this.neuIvIndex(), items.length - 1)),
      close: () => this.close(),
    };

    const injector = Injector.create({
      providers: [{ provide: NEU_IV_DATA, useValue: data }],
      parent: this._injector,
    });

    const portal = new ComponentPortal(NeuImageViewerOverlayComponent, null, injector);
    overlayRef.attach(portal);
    this._overlayRef = overlayRef;

    // Focus overlay for keyboard events
    setTimeout(() => {
      const el = overlayRef.overlayElement?.querySelector<HTMLElement>('.neu-iv');
      el?.focus();
    }, 50);
  }

  close(): void {
    this._overlayRef?.detach();
    this._overlayRef?.dispose();
    this._overlayRef = null;
  }

  ngOnDestroy(): void {
    this.close();
  }

  private _normalizeItems(): NeuImageViewerItem[] {
    const v = this.neuImageViewer();
    if (typeof v === 'string') return [{ src: v }];
    if (Array.isArray(v)) return v;
    return [v];
  }
}
