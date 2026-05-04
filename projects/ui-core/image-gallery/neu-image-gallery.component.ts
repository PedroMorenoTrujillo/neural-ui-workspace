import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { NeuImageViewerDirective, type NeuImageViewerItem } from '@neural-ui/core/image-viewer';

@Component({
  selector: 'neu-image-gallery',
  imports: [NeuImageViewerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length > 0) {
      <div
        class="neu-image-gallery"
        [class.neu-image-gallery--left]="thumbnailPosition() === 'left' && showThumbnails()"
      >
        @if (showThumbnails()) {
          <div
            class="neu-image-gallery__thumbs"
            [class.neu-image-gallery__thumbs--left]="thumbnailPosition() === 'left'"
          >
            @for (item of items(); track item.src; let i = $index) {
              <button
                type="button"
                class="neu-image-gallery__thumb"
                [class.neu-image-gallery__thumb--active]="activeIndex() === i"
                [attr.aria-label]="item.alt || 'Image ' + (i + 1)"
                (click)="setActiveIndex(i)"
              >
                <img [src]="item.src" [alt]="item.alt || ''" />
              </button>
            }
          </div>
        }

        <div class="neu-image-gallery__stage">
          @if (items().length > 1) {
            <button
              type="button"
              class="neu-image-gallery__nav neu-image-gallery__nav--prev"
              [disabled]="activeIndex() === 0"
              aria-label="Previous image"
              (click)="goPrev()"
            >
              ‹
            </button>
            <button
              type="button"
              class="neu-image-gallery__nav neu-image-gallery__nav--next"
              [disabled]="activeIndex() === items().length - 1"
              aria-label="Next image"
              (click)="goNext()"
            >
              ›
            </button>
          }

          @if (viewerEnabled()) {
            <button
              type="button"
              class="neu-image-gallery__viewer-trigger"
              [neuImageViewer]="items()"
              [neuIvIndex]="activeIndex()"
              [attr.aria-label]="currentItem().alt || 'Open image viewer'"
            >
              <img
                class="neu-image-gallery__image"
                [class.neu-image-gallery__image--contain]="objectFit() === 'contain'"
                [class.neu-image-gallery__image--cover]="objectFit() === 'cover'"
                [src]="currentItem().src"
                [alt]="currentItem().alt || ''"
              />
            </button>
          } @else {
            <img
              class="neu-image-gallery__image"
              [class.neu-image-gallery__image--contain]="objectFit() === 'contain'"
              [class.neu-image-gallery__image--cover]="objectFit() === 'cover'"
              [src]="currentItem().src"
              [alt]="currentItem().alt || ''"
            />
          }

          <div class="neu-image-gallery__meta">
            @if (showCounter()) {
              <span class="neu-image-gallery__counter">
                {{ activeIndex() + 1 }} / {{ items().length }}
              </span>
            }
            @if (currentItem().caption) {
              <span class="neu-image-gallery__caption">{{ currentItem().caption }}</span>
            }
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './neu-image-gallery.component.scss',
})
export class NeuImageGalleryComponent {
  readonly items = input<NeuImageViewerItem[]>([]);
  readonly initialIndex = input<number>(0);
  readonly showThumbnails = input<boolean>(true);
  readonly thumbnailPosition = input<'bottom' | 'left'>('bottom');
  readonly objectFit = input<'cover' | 'contain'>('cover');
  readonly showCounter = input<boolean>(true);
  readonly viewerEnabled = input<boolean>(true);

  readonly activeIndexChange = output<number>();

  private readonly _activeIndex = signal(0);

  constructor() {
    effect(() => {
      this._activeIndex.set(this._clampIndex(this.initialIndex()));
    });
  }

  readonly activeIndex = computed(() => this._clampIndex(this._activeIndex()));
  readonly currentItem = computed(() => this.items()[this.activeIndex()]);

  setActiveIndex(index: number): void {
    const nextIndex = this._clampIndex(index);
    this._activeIndex.set(nextIndex);
    this.activeIndexChange.emit(nextIndex);
  }

  goPrev(): void {
    this.setActiveIndex(this.activeIndex() - 1);
  }

  goNext(): void {
    this.setActiveIndex(this.activeIndex() + 1);
  }

  private _clampIndex(index: number): number {
    const total = this.items().length;
    if (total === 0) return 0;
    return Math.max(0, Math.min(total - 1, index));
  }
}

export type { NeuImageViewerItem } from '@neural-ui/core/image-viewer';
