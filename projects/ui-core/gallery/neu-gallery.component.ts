import {
  Component,
  ContentChild,
  Directive,
  TemplateRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { InternalNeuMediaPreviewAdapter } from '@neural-ui/core/internal';
import { NeuImageViewerDirective } from '@neural-ui/core/image-viewer';
import type { NeuImageViewerItem } from '@neural-ui/core/image-viewer';
import { NeuralIcon } from '@neural-icons/angular';
import { iconChevronLeft } from '@neural-icons/core/icons/chevron-left';
import { iconChevronRight } from '@neural-icons/core/icons/chevron-right';

/** Gallery's canonical public media-item name; one shared object shape. */
export type NeuGalleryItem = NeuImageViewerItem;

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

/** A positional media gallery with a single shared, private CDK preview engine. */
@Component({
  selector: 'neu-gallery',
  imports: [NgTemplateOutlet, NeuImageViewerDirective, NeuralIcon],
  providers: [InternalNeuMediaPreviewAdapter],
  host: { class: 'neu-gallery', '[class.neu-gallery--fullscreen]': 'isPreviewOpen()' },
  template: `
    @if (items().length) {
      <section
        class="neu-gallery__surface"
        [class.neu-gallery__surface--start]="showThumbnails() && items().length > 1 && thumbnailPosition() === 'start'"
        [attr.aria-label]="ariaLabel()"
        (keydown)="onKeydown($event)"
      >
        <div
          class="neu-gallery__stage"
          (pointerdown)="onPointerDown($event)"
          (pointerup)="onPointerUp($event)"
          (pointercancel)="onPointerCancel()"
        >
          @if (showItemNavigators() && items().length > 1) {
            <button
              type="button"
              class="neu-gallery__nav neu-gallery__nav--prev"
              [disabled]="!canPrev()"
              [attr.aria-label]="previousLabel()"
              (click)="previous()"
            >
              <neural-icon [icon]="iconChevronLeft" size="1.25rem" />
            </button>
          }
          @if (previewEnabled()) {
            <button
              type="button"
              class="neu-gallery__preview"
              [neuImageViewer]="items()"
              [neuIvIndex]="activeIndex()"
              [attr.aria-label]="previewLabel()"
              (opened)="onPreviewOpened()"
              (closed)="onPreviewClosed()"
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
          } @else {
            <div class="neu-gallery__preview neu-gallery__preview--static">
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
            </div>
          }
          @if (showItemNavigators() && items().length > 1) {
            <button
              type="button"
              class="neu-gallery__nav neu-gallery__nav--next"
              [disabled]="!canNext()"
              [attr.aria-label]="nextLabel()"
              (click)="next()"
            >
              <neural-icon [icon]="iconChevronRight" size="1.25rem" />
            </button>
          }
          @if (showCounter() || captionTemplate || activeItem().caption) {
            <div class="neu-gallery__meta">
              @if (showCounter()) {
                <span class="neu-gallery__stage-counter"
                  >{{ activeIndex() + 1 }} / {{ items().length }}</span
                >
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
                [attr.aria-label]="item.alt || thumbnailLabel() + ' ' + (index + 1)"
                [class.neu-gallery__thumbnail--active]="index === activeIndex()"
                (click)="setActiveIndex(index, true)"
              >
                <img [src]="item.src" alt="" loading="lazy" />
              </button>
            }
          </div>
        }
      </section>
    }
  `,
  styleUrl: './neu-gallery.component.scss',
})
export class NeuGalleryComponent {
  protected readonly iconChevronLeft = iconChevronLeft;
  protected readonly iconChevronRight = iconChevronRight;

  readonly items = input<readonly NeuGalleryItem[]>([]);
  readonly activeIndexInput = input<number | null>(null, { alias: 'activeIndex' });
  readonly initialIndex = input(0);
  readonly circular = input(false);
  readonly showThumbnails = input(true);
  readonly thumbnailPosition = input<'bottom' | 'start'>('bottom');
  readonly showItemNavigators = input(true);
  readonly showCounter = input(false);
  readonly previewEnabled = input(true);
  readonly objectFit = input<'cover' | 'contain'>('contain');
  readonly imageLoading = input<'eager' | 'lazy'>('lazy');
  readonly maxZoom = input(3);
  readonly ariaLabel = input('Image gallery');
  readonly thumbnailLabel = input('Gallery thumbnails');
  readonly previewLabel = input('Image preview');
  readonly toolbarLabel = input('Image controls');
  readonly zoomOutLabel = input('Zoom out');
  readonly zoomInLabel = input('Zoom in');
  readonly rotateLeftLabel = input('Rotate left');
  readonly rotateRightLabel = input('Rotate right');
  readonly flipHorizontalLabel = input('Flip horizontally');
  readonly flipVerticalLabel = input('Flip vertically');
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

  private readonly _adapter = inject(InternalNeuMediaPreviewAdapter);
  private readonly _viewer = viewChild(NeuImageViewerDirective);
  private readonly _localIndex = signal<number | null>(null);
  private readonly _previewOpen = signal(false);
  private _pointerStart: { x: number; y: number } | null = null;

  readonly activeIndex = computed(() =>
    this.clamp(this.activeIndexInput() ?? this._localIndex() ?? this.initialIndex()),
  );
  readonly activeItem = computed(() => this.items()[this.activeIndex()] ?? { src: '', alt: '' });
  readonly isPreviewOpen = this._previewOpen.asReadonly();
  readonly zoomLevel = computed(() => this._adapter.session()?.scale() ?? 1);
  readonly transform = computed(() => this._adapter.session()?.transform() ?? '');
  readonly canPrev = computed(
    () => this.items().length > 1 && (this.circular() || this.activeIndex() > 0),
  );
  readonly canNext = computed(
    () =>
      this.items().length > 1 && (this.circular() || this.activeIndex() < this.items().length - 1),
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

  constructor() {
    this._adapter.host = {
      gallery: true,
      items: () => this.items(),
      index: () => this.activeIndex(),
      navigate: (direction) => (direction < 0 ? this.previous() : this.next()),
      canNavigate: (direction) => (direction < 0 ? this.canPrev() : this.canNext()),
      maxZoom: () => this.maxZoom(),
      captionTemplate: () => this.captionTemplate?.templateRef,
      labels: () => ({
        toolbar: this.toolbarLabel(),
        zoomIn: this.zoomInLabel(),
        zoomOut: this.zoomOutLabel(),
        rotateLeft: this.rotateLeftLabel(),
        rotateRight: this.rotateRightLabel(),
        flipHorizontal: this.flipHorizontalLabel(),
        flipVertical: this.flipVerticalLabel(),
        reset: this.resetLabel(),
        close: this.closeLabel(),
        previous: this.previousLabel(),
        next: this.nextLabel(),
        download: this.downloadLabel(),
      }),
      onZoom: (value) => this.zoomChange.emit(value),
      onRotation: (value) => this.rotationChange.emit(value),
      onFlip: (value) => this.flipChange.emit(value),
      onImageError: (index) => {
        const item = this.items()[index];
        if (item) this.imageError.emit({ item, index });
      },
    };
  }

  setActiveIndex(index: number, user = false): void {
    const next = this.clamp(index);
    if (next === this.activeIndex()) return;
    if (this.activeIndexInput() == null) this._localIndex.set(next);
    if (user) this.activeIndexChange.emit(next);
  }
  previous(): void {
    this.setActiveIndex(this.activeIndex() - 1, true);
  }
  next(): void {
    this.setActiveIndex(this.activeIndex() + 1, true);
  }
  openPreview(trigger?: EventTarget | null): void {
    if (!this.previewEnabled()) return;
    (trigger as { focus?: (options?: FocusOptions) => void } | null)?.focus?.({
      preventScroll: true,
    });
    this._viewer()?.open();
  }
  closePreview(): void {
    this._viewer()?.close();
  }
  protected onPreviewOpened(): void {
    if (this._previewOpen()) return;
    this._previewOpen.set(true);
    this.previewChange.emit(true);
  }
  protected onPreviewClosed(): void {
    if (!this._previewOpen()) return;
    this._previewOpen.set(false);
    this.previewChange.emit(false);
  }
  zoom(delta: number): void {
    this._adapter.session()?.zoom(delta);
  }
  rotate(delta: number): void {
    this._adapter.session()?.rotate(delta);
  }
  flip(axis: 'x' | 'y'): void {
    this._adapter.session()?.flip(axis);
  }
  resetTransform(): void {
    this._adapter.session()?.resetTransform();
  }
  onKeydown(event: KeyboardEvent): void {
    const movement: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      Home: -Infinity,
      End: Infinity,
    };
    if (!(event.key in movement)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') this.previous();
    else if (event.key === 'ArrowRight') this.next();
    else this.setActiveIndex(event.key === 'Home' ? 0 : this.items().length - 1, true);
  }
  onPreviewKeydown(event: KeyboardEvent): void {
    this.onKeydown(event);
  }
  onPointerDown(event: PointerEvent): void {
    this._pointerStart = { x: event.clientX, y: event.clientY };
  }
  onPointerUp(event: PointerEvent): void {
    const start = this._pointerStart;
    this._pointerStart = null;
    if (!start) return;
    const distance = event.clientX - start.x;
    if (Math.abs(distance) > 36) distance > 0 ? this.previous() : this.next();
  }
  onPointerCancel(): void {
    this._pointerStart = null;
  }
  onImageError(): void {
    const item = this.items()[this.activeIndex()];
    if (item) this.imageError.emit({ item, index: this.activeIndex() });
  }
  private clamp(index: number): number {
    const length = this.items().length;
    if (!length) return 0;
    const value = Number.isFinite(index) ? Math.trunc(index) : 0;
    if (this.circular()) return ((value % length) + length) % length;
    return Math.max(0, Math.min(length - 1, value));
  }
}
