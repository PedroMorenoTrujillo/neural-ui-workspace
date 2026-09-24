import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  OnDestroy,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NeuFocusTrapDirective, NeuModalFocusDirective } from '@neural-ui/core/focus-trap';
import { InternalNeuMediaPreviewAdapter } from '@neural-ui/core/internal';
import { NeuralIcon } from '@neural-icons/angular';
import { iconChevronLeft } from '@neural-icons/core/icons/chevron-left';
import { iconChevronRight } from '@neural-icons/core/icons/chevron-right';
import { iconRotateCcw } from '@neural-icons/core/icons/rotate-ccw';
import { iconRotateCw } from '@neural-icons/core/icons/rotate-cw';
import { iconFlipHorizontal } from '@neural-icons/core/icons/flip-horizontal';
import { iconFlipVertical } from '@neural-icons/core/icons/flip-vertical';
import { iconDownload } from '@neural-icons/core/icons/download';
import { iconX } from '@neural-icons/core/icons/x';
import { iconZoomIn } from '@neural-icons/core/icons/zoom-in';
import { iconZoomOut } from '@neural-icons/core/icons/zoom-out';

export interface NeuImageViewerItem {
  src: string;
  /** Required; an empty string marks decorative media. */
  alt: string;
  caption?: string;
}

/** Token que comparte datos entre directiva y overlay */
import { InjectionToken } from '@angular/core';

export const NEU_IV_DATA = new InjectionToken<_NeuIvData>('NEU_IV_DATA');

interface _NeuIvData {
  items: readonly NeuImageViewerItem[];
  initialIndex: number;
  ariaLabel: string;
  close: () => void;
}

/**
 * Componente interno del overlay del visor de imágenes.
 * No debe usarse directamente — es instanciado por la directiva.
 */
@Component({
  selector: 'neu-image-viewer-overlay',
  imports: [NeuFocusTrapDirective, NeuModalFocusDirective, NgTemplateOutlet, NeuralIcon],
  hostDirectives: [NeuFocusTrapDirective, NeuModalFocusDirective],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-iv',
    'aria-modal': 'true',
    role: 'dialog',
    '[attr.aria-label]': '_data.ariaLabel',
    tabIndex: '0',
    '(keydown)': '_onKey($event)',
    '(click)': '_onBackdropClick($event)',
  },
  template: `
    <div class="neu-iv__overlay" (click)="$event.stopPropagation()">
      <!-- Toolbar -->
      <div class="neu-iv__toolbar">
        <span class="neu-iv__counter">{{ _activeIndex() + 1 }} / {{ _items().length }}</span>
        <div class="neu-iv__toolbar-actions" role="group" [attr.aria-label]="_label('toolbar')">
          <button
            type="button"
            class="neu-iv__btn"
            [attr.aria-label]="_label('zoomIn')"
            [attr.title]="_label('zoomIn')"
            (click)="_zoom(0.25)"
          >
            <neural-icon [icon]="iconZoomIn" size="1.25rem" />
          </button>
          <button
            type="button"
            class="neu-iv__btn"
            [attr.aria-label]="_label('zoomOut')"
            [attr.title]="_label('zoomOut')"
            (click)="_zoom(-0.25)"
          >
            <neural-icon [icon]="iconZoomOut" size="1.25rem" />
          </button>
          @if (_galleryHost) {
            <button
              type="button"
              class="neu-iv__btn"
              [attr.aria-label]="_label('rotateLeft')"
              [attr.title]="_label('rotateLeft')"
              (click)="_rotate(-90)"
            >
              <neural-icon [icon]="iconRotateCcw" size="1.25rem" />
            </button>
            <button
              type="button"
              class="neu-iv__btn"
              [attr.aria-label]="_label('rotateRight')"
              [attr.title]="_label('rotateRight')"
              (click)="_rotate(90)"
            >
              <neural-icon [icon]="iconRotateCw" size="1.25rem" />
            </button>
            <button
              type="button"
              class="neu-iv__btn"
              [attr.aria-label]="_label('flipHorizontal')"
              [attr.title]="_label('flipHorizontal')"
              (click)="_flipAxis('x')"
            >
              <neural-icon [icon]="iconFlipHorizontal" size="1.25rem" />
            </button>
            <button
              type="button"
              class="neu-iv__btn"
              [attr.aria-label]="_label('flipVertical')"
              [attr.title]="_label('flipVertical')"
              (click)="_flipAxis('y')"
            >
              <neural-icon [icon]="iconFlipVertical" size="1.25rem" />
            </button>
            <a
              class="neu-iv__btn"
              [href]="_current().src"
              [attr.download]="_downloadName()"
              [attr.aria-label]="_label('download')"
              [attr.title]="_label('download')"
            >
              <neural-icon [icon]="iconDownload" size="1.25rem" />
            </a>
          }
          <button
            type="button"
            class="neu-iv__btn"
            [attr.aria-label]="_label('reset')"
            [attr.title]="_label('reset')"
            (click)="_resetTransform()"
          >
            <neural-icon [icon]="iconRotateCcw" size="1.25rem" />
          </button>
          <button
            type="button"
            class="neu-iv__btn neu-iv__btn--close"
            [attr.aria-label]="_label('close')"
            [attr.title]="_label('close')"
            (click)="_data.close()"
          >
            <neural-icon [icon]="iconX" size="1.25rem" />
          </button>
        </div>
      </div>

      <!-- Image -->
      <div
        class="neu-iv__stage"
        (wheel)="_onWheel($event)"
        (pointerdown)="_onPointerDown($event)"
        (pointermove)="_onPointerMove($event)"
        (pointerup)="_onPointerUp($event)"
        (pointercancel)="_onPointerCancel()"
      >
        <img
          class="neu-iv__img"
          [src]="_current().src"
          [alt]="_current().alt"
          [style.transform]="_transform()"
          draggable="false"
          (error)="_onImageError()"
        />
      </div>

      <!-- Caption -->
      @if (_galleryHost?.captionTemplate(); as template) {
        <div class="neu-iv__caption">
          <ng-container
            [ngTemplateOutlet]="template"
            [ngTemplateOutletContext]="{ $implicit: _current(), index: _activeIndex() }"
          />
        </div>
      } @else if (_current().caption) {
        <div class="neu-iv__caption">{{ _current().caption }}</div>
      }

      <!-- Prev/Next arrows -->
      @if (_items().length > 1) {
        <button
          type="button"
          class="neu-iv__arrow neu-iv__arrow--prev"
          [attr.aria-label]="_label('previous')"
          [disabled]="!_canNavigate(-1)"
          (click)="_navigate(-1)"
        >
          <neural-icon [icon]="iconChevronLeft" size="1.25rem" />
        </button>
        <button
          type="button"
          class="neu-iv__arrow neu-iv__arrow--next"
          [attr.aria-label]="_label('next')"
          [disabled]="!_canNavigate(1)"
          (click)="_navigate(1)"
        >
          <neural-icon [icon]="iconChevronRight" size="1.25rem" />
        </button>
      }
    </div>
  `,
  styleUrl: './neu-image-viewer.component.scss',
})
export class NeuImageViewerOverlayComponent {
  protected readonly iconChevronLeft = iconChevronLeft;
  protected readonly iconChevronRight = iconChevronRight;
  protected readonly iconDownload = iconDownload;
  protected readonly iconFlipHorizontal = iconFlipHorizontal;
  protected readonly iconFlipVertical = iconFlipVertical;
  protected readonly iconRotateCcw = iconRotateCcw;
  protected readonly iconRotateCw = iconRotateCw;
  protected readonly iconX = iconX;
  protected readonly iconZoomIn = iconZoomIn;
  protected readonly iconZoomOut = iconZoomOut;
  readonly _data = inject(NEU_IV_DATA);
  private readonly _adapter = inject(InternalNeuMediaPreviewAdapter, { optional: true });
  readonly _galleryHost = this._adapter?.host ?? null;
  readonly _index = signal(this._data.initialIndex);
  readonly _scale = signal(1);
  readonly _panX = signal(0);
  readonly _panY = signal(0);
  readonly _rotation = signal(0);
  readonly _flips = signal({ x: 1, y: 1 });

  private _pointerStart: { id: number; x: number; y: number; panX: number; panY: number } | null =
    null;
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalFocus = inject(NeuModalFocusDirective, { self: true });

  constructor() {
    const escapeSubscription = this.modalFocus.neuModalFocusEscape.subscribe(() =>
      this._data.close(),
    );
    this.destroyRef.onDestroy(() => {
      escapeSubscription.unsubscribe();
      this._pointerStart = null;
    });
    effect(() => {
      this._current();
      untracked(() => this._resetTransform());
    });
  }

  readonly _items = computed(() => this._galleryHost?.items() ?? this._data.items);
  readonly _activeIndex = computed(() => this._galleryHost?.index() ?? this._index());
   readonly _current = computed(() => this._items()[this._activeIndex()] ?? { src: '', alt: '' });

  readonly _transform = computed(
    () =>
      `translate(${this._panX()}px, ${this._panY()}px) scale(${this._scale()}) rotate(${this._rotation()}deg) scale(${this._flips().x}, ${this._flips().y})`,
  );
  readonly _downloadName = computed(
    () => this._current().src.split('/').pop()?.split('?')[0] || 'image',
  );

  _navigate(dir: -1 | 1): void {
    if (!this._canNavigate(dir)) return;
    if (this._galleryHost) this._galleryHost.navigate(dir);
    else
      this._index.update((index) => Math.max(0, Math.min(this._items().length - 1, index + dir)));
  }

  _zoom(delta: number): void {
    const previous = this._scale();
    const maximum = Math.max(1, this._galleryHost?.maxZoom() ?? 5);
    const next = Math.round(Math.max(0.25, Math.min(maximum, previous + delta)) * 100) / 100;
    if (next === previous) return;
    this._scale.set(next);
    if (next <= 1) this._resetPan();
    this._galleryHost?.onZoom(next);
  }

  _resetZoom(): void {
    this._scale.set(1);
    this._resetPan();
  }

  _resetTransform(): void {
    this._resetZoom();
    this._rotation.set(0);
    this._flips.set({ x: 1, y: 1 });
    this._pointerStart = null;
  }

  _rotate(delta: number): void {
    const next = (this._rotation() + delta + 360) % 360;
    if (next === this._rotation()) return;
    this._rotation.set(next);
    this._galleryHost?.onRotation(next);
  }

  _flipAxis(axis: 'x' | 'y'): void {
    const next = { ...this._flips(), [axis]: -this._flips()[axis] };
    this._flips.set(next);
    this._galleryHost?.onFlip(next);
  }

  private _resetPan(): void {
    this._panX.set(0);
    this._panY.set(0);
  }

  _onWheel(e: WheelEvent): void {
    if (!e.deltaY) return;
    const before = this._scale();
    this._zoom(e.deltaY < 0 ? 0.1 : -0.1);
    if (this._scale() !== before) e.preventDefault();
  }

  _onPointerDown(e: PointerEvent): void {
    if (e.button !== 0 || this._pointerStart) return;
    this._pointerStart = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      panX: this._panX(),
      panY: this._panY(),
    };
    if (e.currentTarget instanceof HTMLElement && e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }

  _onPointerMove(e: PointerEvent): void {
    const start = this._pointerStart;
    if (!start || start.id !== e.pointerId || this._scale() <= 1) return;
    this._panX.set(start.panX + e.clientX - start.x);
    this._panY.set(start.panY + e.clientY - start.y);
  }

  _onPointerUp(e: PointerEvent): void {
    const start = this._pointerStart;
    this._pointerStart = null;
    if (!start || start.id !== e.pointerId) return;
    if (this._scale() > 1 || !this._galleryHost) return;
    const distance = e.clientX - start.x;
    if (Math.abs(distance) > 36) this._navigate(distance > 0 ? -1 : 1);
  }

  _onPointerCancel(): void {
    this._pointerStart = null;
  }

  _onBackdropClick(_e: MouseEvent): void {
    this._data.close();
  }

  _onKey(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this._navigate(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this._navigate(1);
        break;
      case 'Escape':
        if (!e.defaultPrevented) this._data.close();
        break;
      case '+':
        e.preventDefault();
        this._zoom(0.25);
        break;
      case '-':
        e.preventDefault();
        this._zoom(-0.25);
        break;
    }
  }

  _canNavigate(direction: -1 | 1): boolean {
    if (this._galleryHost) return this._galleryHost.canNavigate(direction);
    const next = this._activeIndex() + direction;
    return next >= 0 && next < this._items().length;
  }

  _onImageError(): void {
    this._galleryHost?.onImageError(this._activeIndex());
  }

  _label(
    name:
      | 'toolbar'
      | 'zoomIn'
      | 'zoomOut'
      | 'rotateLeft'
      | 'rotateRight'
      | 'flipHorizontal'
      | 'flipVertical'
      | 'reset'
      | 'close'
      | 'previous'
      | 'next'
      | 'download',
  ): string {
    const defaults = {
      toolbar: 'Image controls',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      rotateLeft: 'Rotate left',
      rotateRight: 'Rotate right',
      flipHorizontal: 'Flip horizontally',
      flipVertical: 'Flip vertically',
      reset: 'Reset zoom',
      close: 'Close image viewer',
      previous: 'Previous image',
      next: 'Next image',
      download: 'Download image',
    };
    return this._galleryHost?.labels()[name] ?? defaults[name];
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
    role: 'button',
    tabindex: '0',
    '[attr.aria-label]': '_triggerLabel()',
    '(click)': 'open()',
    '(keydown.enter)': 'openFromKeyboard($event)',
    '(keydown.space)': 'openFromKeyboard($event)',
  },
})
export class NeuImageViewerDirective implements OnDestroy {
  /** Puede ser una URL, NeuImageViewerItem o un array de items */
  readonly neuImageViewer = input<string | NeuImageViewerItem | readonly NeuImageViewerItem[]>('');
  /** Índice inicial cuando se pasa un array */
  readonly neuIvIndex = input<number>(0);

  private readonly _overlay = inject(Overlay);
  private readonly _injector = inject(Injector);
  private readonly _adapter = inject(InternalNeuMediaPreviewAdapter, { optional: true });
  private readonly _element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private _overlayRef: OverlayRef | null = null;
  private readonly eventDestroyRef = inject(DestroyRef);
  private destroying = false;
  readonly opened = output<void>();
  readonly closed = output<void>();

  open(): void {
    if (this.destroying || this.eventDestroyRef.destroyed || this._overlayRef) return;
    const items = this._normalizeItems();
    if (!items.length) return;

    this._element.focus({ preventScroll: true });
    const overlayRef = this._overlay.create({
      hasBackdrop: false,
      scrollStrategy: this._overlay.scrollStrategies.block(),
      positionStrategy: this._overlay.position().global().centerHorizontally().centerVertically(),
    });

    const data: _NeuIvData = {
      items,
      initialIndex: Math.max(0, Math.min(this.neuIvIndex(), items.length - 1)),
      ariaLabel:
        this._element.getAttribute('aria-label')?.trim() || items[0].alt?.trim() || 'Image viewer',
      close: () => this.close(),
    };

    const injector = Injector.create({
      providers: [{ provide: NEU_IV_DATA, useValue: data }],
      parent: this._injector,
    });

    const portal = new ComponentPortal(NeuImageViewerOverlayComponent, null, injector);
    const componentRef = overlayRef.attach(portal);
    this._overlayRef = overlayRef;
    this._adapter?.session.set({
      scale: componentRef.instance._scale.asReadonly(),
      transform: componentRef.instance._transform,
      zoom: (delta) => componentRef.instance._zoom(delta),
      rotate: (delta) => componentRef.instance._rotate(delta),
      flip: (axis) => componentRef.instance._flipAxis(axis),
      resetTransform: () => componentRef.instance._resetTransform(),
    });
    this.opened.emit();
  }

  openFromKeyboard(event: Event): void {
    event.preventDefault();
    this.open();
  }

  close(): void {
    const overlayRef = this._overlayRef;
    if (!overlayRef) return;
    this._overlayRef = null;
    this._adapter?.session.set(null);
    overlayRef.detach();
    overlayRef.dispose();
    if (!this.destroying && !this.eventDestroyRef.destroyed) this.closed.emit();
  }

  ngOnDestroy(): void {
    this.destroying = true;
    this.close();
  }

  protected _triggerLabel(): string {
    return (
      this._element.getAttribute('aria-label')?.trim() ||
      this._element.getAttribute('alt')?.trim() ||
      'Open image viewer'
    );
  }

  private _normalizeItems(): NeuImageViewerItem[] {
    const v = this.neuImageViewer();
    const values = typeof v === 'string' ? [{ src: v, alt: '' }] : Array.isArray(v) ? v : [v];
    return values
      .filter(
        (item): item is NeuImageViewerItem =>
          !!item && typeof item.src === 'string' && item.src.trim().length > 0,
      )
      .map((item) => ({ ...item, alt: item.alt ?? '' }));
  }
}
