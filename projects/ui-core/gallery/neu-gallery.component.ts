import {
  Component,
  ContentChild,
  Directive,
  TemplateRef,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NeuFocusTrapDirective, NeuModalFocusDirective } from '@neural-ui/core/focus-trap';
import { Overlay } from '@angular/cdk/overlay';
import { NeuIconComponent } from '@neural-ui/core/icon';

export interface NeuGalleryItem {
  src: string;
  alt: string;
  caption?: string;
}

export interface NeuGalleryItemContext {
  $implicit: NeuGalleryItem;
  index: number;
  active: boolean;
}

export interface NeuGalleryCaptionContext {
  $implicit: NeuGalleryItem;
  index: number;
}

@Directive({ selector: 'ng-template[neuGalleryItem]' })
export class NeuGalleryItemDirective {
  readonly templateRef = inject<TemplateRef<NeuGalleryItemContext>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuGalleryCaption]' })
export class NeuGalleryCaptionDirective {
  readonly templateRef = inject<TemplateRef<NeuGalleryCaptionContext>>(TemplateRef);
}

/** An image gallery with typed content templates, preview controls, and touch/keyboard navigation. */
@Component({
  selector: 'neu-gallery',
  imports: [NgTemplateOutlet, NeuFocusTrapDirective, NeuModalFocusDirective, NeuIconComponent],
  host: { class: 'neu-gallery', '[class.neu-gallery--fullscreen]': 'isPreviewOpen()' },
  template: `
    @if (items().length) {
      <section
        class="neu-gallery__surface"
        [attr.aria-label]="ariaLabel()"
        (keydown)="onKeydown($event)"
      >
        <div
          class="neu-gallery__stage"
          (pointerdown)="onPointerDown($event)"
          (pointerup)="onPointerUp($event)"
        >
          @if (showItemNavigators() && items().length > 1) {
            <button
              type="button"
              class="neu-gallery__nav neu-gallery__nav--prev"
              [disabled]="!canPrev()"
              [attr.aria-label]="previousLabel()"
              (click)="previous()"
            >
              <neu-icon name="lucideChevronLeft" size="1.25rem" />
            </button>
          }
          <button
            type="button"
            class="neu-gallery__preview"
            [attr.aria-label]="previewLabel()"
            (click)="openPreview($event.currentTarget)"
          >
            @if (itemTemplate) {
              <ng-container
                [ngTemplateOutlet]="itemTemplate.templateRef"
                [ngTemplateOutletContext]="itemContext()"
              />
            } @else {
              <img
                class="neu-gallery__image"
                [src]="activeItem().src"
                [alt]="activeItem().alt"
                [attr.loading]="imageLoading()"
                [class.neu-gallery__image--contain]="objectFit() === 'contain'"
                (error)="onImageError()"
              />
            }
          </button>
          @if (showItemNavigators() && items().length > 1) {
            <button
              type="button"
              class="neu-gallery__nav neu-gallery__nav--next"
              [disabled]="!canNext()"
              [attr.aria-label]="nextLabel()"
              (click)="next()"
            >
              <neu-icon name="lucideChevronRight" size="1.25rem" />
            </button>
          }
          @if (captionTemplate) {
            <div class="neu-gallery__caption">
              <ng-container
                [ngTemplateOutlet]="captionTemplate.templateRef"
                [ngTemplateOutletContext]="captionContext()"
              />
            </div>
          } @else if (activeItem().caption) {
            <p class="neu-gallery__caption">{{ activeItem().caption }}</p>
          }
        </div>
        @if (showThumbnails() && items().length > 1) {
          <div
            class="neu-gallery__thumbnails"
            [class.neu-gallery__thumbnails--start]="thumbnailPosition() === 'start'"
            role="group"
            [attr.aria-label]="thumbnailLabel()"
          >
            @for (item of items(); track $index; let index = $index) {
              <button
                type="button"
                class="neu-gallery__thumbnail"
                [attr.aria-pressed]="index === activeIndex()"
                [attr.aria-label]="item.alt"
                [class.neu-gallery__thumbnail--active]="index === activeIndex()"
                (click)="setActiveIndex(index, true)"
              >
                <img [src]="item.src" [alt]="item.alt" loading="lazy" />
              </button>
            }
          </div>
        }
      </section>
    }

    @if (isPreviewOpen()) {
      <div
        class="neu-gallery__backdrop"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="previewLabel()"
        neuFocusTrap
        neuModalFocus
        (neuModalFocusEscape)="closePreview()"
        (keydown)="onPreviewKeydown($event)"
        (click)="closePreview()"
      >
        <div
          class="neu-gallery__lightbox"
          (click)="$event.stopPropagation()"
          (pointerdown)="onPointerDown($event)"
          (pointerup)="onPointerUp($event)"
        >
          <div class="neu-gallery__toolbar" role="toolbar" [attr.aria-label]="toolbarLabel()">
            <span class="neu-gallery__counter">
              {{ activeIndex() + 1 }} / {{ items().length }}
            </span>
            <div class="neu-gallery__toolbar-actions">
              <button
                type="button"
                class="neu-gallery__tool"
                (click)="zoom(-0.25)"
                [disabled]="zoomLevel() <= 1"
                [attr.aria-label]="zoomOutLabel()"
                [attr.title]="zoomOutLabel()"
              >
                <neu-icon name="lucideZoomOut" size="1.25rem" />
              </button>
              <button
                type="button"
                class="neu-gallery__tool"
                (click)="zoom(0.25)"
                [disabled]="zoomLevel() >= maxZoom()"
                [attr.aria-label]="zoomInLabel()"
                [attr.title]="zoomInLabel()"
              >
                <neu-icon name="lucideZoomIn" size="1.25rem" />
              </button>
              <button
                type="button"
                class="neu-gallery__tool"
                (click)="rotate(-90)"
                [attr.aria-label]="rotateLeftLabel()"
                [attr.title]="rotateLeftLabel()"
              >
                <neu-icon name="lucideRotateCcw" size="1.25rem" />
              </button>
              <button
                type="button"
                class="neu-gallery__tool"
                (click)="rotate(90)"
                [attr.aria-label]="rotateRightLabel()"
                [attr.title]="rotateRightLabel()"
              >
                <neu-icon name="lucideRotateCw" size="1.25rem" />
              </button>
              <button
                type="button"
                class="neu-gallery__tool"
                (click)="flip('x')"
                [attr.aria-label]="flipHorizontalLabel()"
                [attr.title]="flipHorizontalLabel()"
              >
                <neu-icon name="lucideFlipHorizontal2" size="1.25rem" />
              </button>
              <button
                type="button"
                class="neu-gallery__tool"
                (click)="flip('y')"
                [attr.aria-label]="flipVerticalLabel()"
                [attr.title]="flipVerticalLabel()"
              >
                <neu-icon name="lucideFlipVertical2" size="1.25rem" />
              </button>
              <button
                type="button"
                class="neu-gallery__tool"
                (click)="resetTransform()"
                [attr.aria-label]="resetLabel()"
                [attr.title]="resetLabel()"
              >
                <neu-icon name="lucideRotateCcw" size="1.25rem" />
              </button>
              <a
                class="neu-gallery__download neu-gallery__tool"
                [href]="activeItem().src"
                [attr.download]="downloadName()"
                [attr.aria-label]="downloadLabel()"
                [attr.title]="downloadLabel()"
              >
                <neu-icon name="lucideDownload" size="1.25rem" />
              </a>
              <button
                type="button"
                class="neu-gallery__tool neu-gallery__tool--close"
                (click)="closePreview()"
                [attr.aria-label]="closeLabel()"
                [attr.title]="closeLabel()"
              >
                <neu-icon name="lucideX" size="1.25rem" />
              </button>
            </div>
          </div>
          <img
            class="neu-gallery__lightbox-image"
            [src]="activeItem().src"
            [alt]="activeItem().alt"
            [style.transform]="transform()"
            draggable="false"
          />
          @if (items().length > 1) {
            <button
              type="button"
              class="neu-gallery__lightbox-nav neu-gallery__lightbox-nav--prev"
              [disabled]="!canPrev()"
              (click)="previous()"
              [attr.aria-label]="previousLabel()"
            >
              <neu-icon name="lucideChevronLeft" size="1.25rem" />
            </button>
            <button
              type="button"
              class="neu-gallery__lightbox-nav neu-gallery__lightbox-nav--next"
              [disabled]="!canNext()"
              (click)="next()"
              [attr.aria-label]="nextLabel()"
            >
              <neu-icon name="lucideChevronRight" size="1.25rem" />
            </button>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './neu-gallery.component.scss',
})
export class NeuGalleryComponent {
  readonly items = input<readonly NeuGalleryItem[]>([]);
  readonly activeIndexInput = input<number | null>(null, { alias: 'activeIndex' });
  readonly initialIndex = input(0);
  readonly circular = input(false);
  readonly showThumbnails = input(true);
  readonly thumbnailPosition = input<'bottom' | 'start'>('bottom');
  readonly showItemNavigators = input(true);
  readonly objectFit = input<'cover' | 'contain'>('contain');
  readonly imageLoading = input<'eager' | 'lazy'>('lazy');
  readonly maxZoom = input(3);
  readonly ariaLabel = input('Image gallery');
  readonly thumbnailLabel = input('Gallery thumbnails');
  readonly previewLabel = input('Image preview');
  readonly toolbarLabel = input('Image controls');
  /** Accessible label and native tooltip for decreasing image zoom. / Etiqueta accesible y tooltip nativo para alejar la imagen. */
  readonly zoomOutLabel = input('Zoom out');
  /** Accessible label and native tooltip for increasing image zoom. / Etiqueta accesible y tooltip nativo para acercar la imagen. */
  readonly zoomInLabel = input('Zoom in');
  /** Accessible label and native tooltip for counterclockwise rotation. / Etiqueta accesible y tooltip nativo para girar a la izquierda. */
  readonly rotateLeftLabel = input('Rotate left');
  /** Accessible label and native tooltip for clockwise rotation. / Etiqueta accesible y tooltip nativo para girar a la derecha. */
  readonly rotateRightLabel = input('Rotate right');
  /** Accessible label and native tooltip for horizontal flipping. / Etiqueta accesible y tooltip nativo para voltear horizontalmente. */
  readonly flipHorizontalLabel = input('Flip horizontally');
  /** Accessible label and native tooltip for vertical flipping. / Etiqueta accesible y tooltip nativo para voltear verticalmente. */
  readonly flipVerticalLabel = input('Flip vertically');
  /** Accessible label and native tooltip for restoring the original transform. / Etiqueta accesible y tooltip nativo para restaurar la transformación original. */
  readonly resetLabel = input('Reset image');
  readonly previousLabel = input('Previous image');
  readonly nextLabel = input('Next image');
  readonly closeLabel = input('Close preview');
  readonly downloadLabel = input('Download image');
  readonly activeIndexChange = output<number>();
  readonly previewChange = output<boolean>();
  readonly zoomChange = output<number>();
  readonly rotationChange = output<number>();
  readonly flipChange = output<{ x: number; y: number }>();
  readonly imageError = output<{ item: NeuGalleryItem; index: number }>();

  @ContentChild(NeuGalleryItemDirective) readonly itemTemplate?: NeuGalleryItemDirective;
  @ContentChild(NeuGalleryCaptionDirective) readonly captionTemplate?: NeuGalleryCaptionDirective;
  private readonly _activeIndex = signal(0);
  private readonly _previewOpen = signal(false);
  private readonly _zoom = signal(1);
  private readonly _rotation = signal(0);
  private readonly _flip = signal({ x: 1, y: 1 });
  private readonly _scrollStrategy = inject(Overlay).scrollStrategies.block();
  private _hasInitializedIndex = false;
  private _wasControlled = false;
  private _pointerStart: { x: number; y: number } | null = null;

  constructor() {
    effect((onCleanup) => {
      if (!this._previewOpen()) return;
      this._scrollStrategy.enable();
      onCleanup(() => this._scrollStrategy.disable());
    });

    effect(() => {
      const requested = this.activeIndexInput();
      this.items();
      this.circular();
      this.initialIndex();
      untracked(() => {
        if (requested != null) {
          this._activeIndex.set(this.clamp(requested));
          this._hasInitializedIndex = true;
          this._wasControlled = true;
          return;
        }

        if (!this._hasInitializedIndex || this._wasControlled) {
          this._activeIndex.set(this.clamp(this.initialIndex()));
          this._hasInitializedIndex = true;
          this._wasControlled = false;
          return;
        }

        // Replacing items must retain a valid local proposal, rather than
        // resetting it to the initial index.
        this._activeIndex.update((index) => this.clamp(index));
      });
    });
  }

  readonly activeIndex = computed(() => this.clamp(this._activeIndex()));
  readonly activeItem = computed(() => this.items()[this.activeIndex()] ?? { src: '', alt: '' });
  readonly isPreviewOpen = this._previewOpen.asReadonly();
  readonly zoomLevel = this._zoom.asReadonly();
  readonly transform = computed(
    () =>
      `scale(${this._zoom()}) rotate(${this._rotation()}deg) scale(${this._flip().x}, ${this._flip().y})`,
  );
  readonly canPrev = computed(() => this.circular() || this.activeIndex() > 0);
  readonly canNext = computed(
    () => this.circular() || this.activeIndex() < this.items().length - 1,
  );
  readonly itemContext = computed<NeuGalleryItemContext>(() => ({
    $implicit: this.activeItem(),
    index: this.activeIndex(),
    active: true,
  }));
  readonly captionContext = computed<NeuGalleryCaptionContext>(() => ({
    $implicit: this.activeItem(),
    index: this.activeIndex(),
  }));
  readonly downloadName = computed(
    () => this.activeItem().src.split('/').pop()?.split('?')[0] || 'image',
  );

  setActiveIndex(index: number, user = false): void {
    const next = this.clamp(index);
    if (next === this._activeIndex()) return;
    this._activeIndex.set(next);
    this.resetTransform();
    // In controlled usage this is an optimistic proposal until the consumer
    // echoes an `activeIndex` input; input reconciliation is intentionally silent.
    if (user) this.activeIndexChange.emit(next);
  }
  previous(): void {
    this.setActiveIndex(this.activeIndex() - 1, true);
  }
  next(): void {
    this.setActiveIndex(this.activeIndex() + 1, true);
  }
  openPreview(trigger?: EventTarget | null): void {
    if (this._previewOpen()) return;
    const opener = trigger as (EventTarget & { focus?: (options?: FocusOptions) => void }) | null;
    opener?.focus?.({ preventScroll: true });
    this._previewOpen.set(true);
    this.previewChange.emit(true);
  }
  closePreview(): void {
    if (!this._previewOpen()) return;
    this._previewOpen.set(false);
    this.resetTransform();
    this.previewChange.emit(false);
  }
  zoom(delta: number): void {
    const value = Math.max(1, Math.min(this.maxZoom(), this._zoom() + delta));
    this._zoom.set(value);
    this.zoomChange.emit(value);
  }
  rotate(delta: number): void {
    const value = (this._rotation() + delta + 360) % 360;
    this._rotation.set(value);
    this.rotationChange.emit(value);
  }
  flip(axis: 'x' | 'y'): void {
    const value = { ...this._flip(), [axis]: this._flip()[axis] * -1 };
    this._flip.set(value);
    this.flipChange.emit(value);
  }
  resetTransform(): void {
    this._zoom.set(1);
    this._rotation.set(0);
    this._flip.set({ x: 1, y: 1 });
  }
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    }
    if (event.key === 'Home') {
      event.preventDefault();
      this.setActiveIndex(0, true);
    }
    if (event.key === 'End') {
      event.preventDefault();
      this.setActiveIndex(this.items().length - 1, true);
    }
  }
  onPreviewKeydown(event: KeyboardEvent): void {
    this.onKeydown(event);
  }
  onPointerDown(event: PointerEvent): void {
    this._pointerStart = { x: event.clientX, y: event.clientY };
  }
  onPointerUp(event: PointerEvent): void {
    if (!this._pointerStart) return;
    const distance = event.clientX - this._pointerStart.x;
    this._pointerStart = null;
    if (Math.abs(distance) > 36) distance > 0 ? this.previous() : this.next();
  }
  onImageError(): void {
    this.imageError.emit({ item: this.activeItem(), index: this.activeIndex() });
  }
  private clamp(index: number): number {
    const last = this.items().length - 1;
    if (last < 0) return 0;
    if (this.circular()) return ((Math.trunc(index) % (last + 1)) + last + 1) % (last + 1);
    return Math.max(0, Math.min(last, Math.trunc(index)));
  }
}
