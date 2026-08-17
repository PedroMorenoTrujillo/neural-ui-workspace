import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  PLATFORM_ID,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { Directionality } from '@angular/cdk/bidi';

export interface NeuCarouselItemContext<T> {
  $implicit: T;
  index: number;
  active: boolean;
}

@Directive({ selector: 'ng-template[neuCarouselItem]' })
export class NeuCarouselItemDirective<T = unknown> {
  constructor(readonly templateRef: TemplateRef<NeuCarouselItemContext<T>>) {}
}

@Component({
  selector: 'neu-carousel',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-carousel-host' },
  template: `
    <section
      class="neu-carousel"
      role="region"
      aria-roledescription="carousel"
      [attr.aria-label]="ariaLabel()"
      [style.--neu-carousel-visible]="effectiveVisibleItems()"
      (keydown)="onKeydown($event)"
      (pointerenter)="paused.set(true)"
      (pointerleave)="paused.set(false)"
      (focusin)="paused.set(true)"
      (focusout)="paused.set(false)"
      (touchstart)="onTouchStart($event)"
      (touchend)="onTouchEnd($event)"
    >
      <div class="neu-carousel__viewport">
        <div class="neu-carousel__track" aria-live="polite" [attr.aria-atomic]="true">
          @for (slide of visibleSlides(); track trackBy()(slide.item, slide.index)) {
            <article
              class="neu-carousel__slide"
              role="group"
              aria-roledescription="slide"
              [attr.aria-label]="slideLabel() + ' ' + (slide.index + 1) + ' ' + ofLabel() + ' ' + items().length"
              [attr.aria-current]="slide.index === activeIndex() ? 'true' : null"
            >
              @if (itemTpl()) {
                <ng-container
                  [ngTemplateOutlet]="itemTpl()!.templateRef"
                  [ngTemplateOutletContext]="{ $implicit: slide.item, index: slide.index, active: slide.index === activeIndex() }"
                />
              } @else {
                {{ slide.item }}
              }
            </article>
          }
          @if (!items().length) {
            <div class="neu-carousel__empty" role="status">{{ emptyLabel() }}</div>
          }
        </div>
      </div>

      @if (items().length > effectiveVisibleItems()) {
        <button class="neu-carousel__nav neu-carousel__nav--previous" type="button" [disabled]="!canGoPrevious()" [attr.aria-label]="previousLabel()" (click)="previous()">{{ previousArrow() }}</button>
        <button class="neu-carousel__nav neu-carousel__nav--next" type="button" [disabled]="!canGoNext()" [attr.aria-label]="nextLabel()" (click)="next()">{{ nextArrow() }}</button>
      }

      @if (showIndicators() && pageCount() > 1) {
        <div class="neu-carousel__indicators" role="tablist" [attr.aria-label]="paginationLabel()">
          @for (page of pages(); track page) {
            <button
              class="neu-carousel__indicator"
              type="button"
              role="tab"
              [attr.aria-selected]="page === currentPage()"
              [attr.aria-label]="goToLabel() + ' ' + (page + 1)"
              [class.is-active]="page === currentPage()"
              (click)="goToPage(page)"
            ></button>
          }
        </div>
      }
    </section>
  `,
  styleUrl: './neu-carousel.component.scss',
})
export class NeuCarouselComponent<T = unknown> {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly directionality = inject(Directionality);
  readonly itemTpl = contentChild(NeuCarouselItemDirective<T>);

  readonly items = input<T[]>([]);
  readonly visibleItems = input(1);
  readonly step = input(1);
  readonly circular = input(false);
  readonly autoplayInterval = input(0);
  readonly showIndicators = input(true);
  readonly ariaLabel = input('Featured content');
  readonly previousLabel = input('Previous slide');
  readonly nextLabel = input('Next slide');
  readonly slideLabel = input('Slide');
  readonly ofLabel = input('of');
  readonly paginationLabel = input('Choose a slide');
  readonly goToLabel = input('Go to page');
  readonly emptyLabel = input('No items available');
  readonly trackBy = input<(item: T, index: number) => unknown>((_item, index) => index);

  readonly activeIndexChange = output<number>();
  readonly itemChange = output<T | null>();
  readonly activeIndex = signal(0);
  readonly paused = signal(false);
  private touchStartX = 0;

  readonly effectiveVisibleItems = computed(() => Math.max(1, Math.min(this.visibleItems(), Math.max(1, this.items().length))));
  readonly pageCount = computed(() => Math.max(1, Math.floor(this.maxStartIndex() / Math.max(1, this.step())) + 1));
  readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, index) => index));
  readonly currentPage = computed(() => Math.floor(this.activeIndex() / Math.max(1, this.step())));
  readonly previousArrow = computed(() => this.directionality.valueSignal() === 'rtl' ? '›' : '‹');
  readonly nextArrow = computed(() => this.directionality.valueSignal() === 'rtl' ? '‹' : '›');
  readonly canGoPrevious = computed(() => this.circular() || this.activeIndex() > 0);
  readonly canGoNext = computed(() => this.circular() || this.activeIndex() < this.maxStartIndex());
  readonly visibleSlides = computed(() => {
    const items = this.items();
    if (!items.length) return [];
    const slides: { item: T; index: number }[] = [];
    for (let offset = 0; offset < this.effectiveVisibleItems(); offset += 1) {
      const rawIndex = this.activeIndex() + offset;
      const index = this.circular() ? rawIndex % items.length : rawIndex;
      if (index < items.length) slides.push({ item: items[index] as T, index });
    }
    return slides;
  });

  constructor() {
    effect(() => {
      this.items();
      this.visibleItems();
      this.activeIndex.update((index) => Math.min(index, this.maxStartIndex()));
    });
    effect((onCleanup) => {
      const interval = this.autoplayInterval();
      if (!isPlatformBrowser(this.platformId) || interval <= 0) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const timer = window.setInterval(() => {
        if (!this.paused() && this.items().length > this.effectiveVisibleItems()) this.next(true);
      }, Math.max(1000, interval));
      onCleanup(() => window.clearInterval(timer));
    });
  }

  previous(): void {
    const step = Math.max(1, this.step());
    const next = this.activeIndex() - step;
    this.setIndex(next < 0 && this.circular() ? this.maxStartIndex() : Math.max(0, next));
  }
  next(fromAutoplay = false): void {
    const step = Math.max(1, this.step());
    const next = this.activeIndex() + step;
    if (next > this.maxStartIndex()) {
      if (this.circular() || fromAutoplay) this.setIndex(0);
      return;
    }
    this.setIndex(next);
  }
  goToPage(page: number): void { this.setIndex(Math.min(this.maxStartIndex(), page * Math.max(1, this.step()))); }
  onKeydown(event: KeyboardEvent): void {
    const previousKey = this.directionality.valueSignal() === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    const nextKey = this.directionality.valueSignal() === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    if (event.key === previousKey) { event.preventDefault(); this.previous(); }
    else if (event.key === nextKey) { event.preventDefault(); this.next(); }
    else if (event.key === 'Home') { event.preventDefault(); this.setIndex(0); }
    else if (event.key === 'End') { event.preventDefault(); this.setIndex(this.maxStartIndex()); }
  }
  onTouchStart(event: TouchEvent): void { this.touchStartX = event.changedTouches[0]?.clientX ?? 0; }
  onTouchEnd(event: TouchEvent): void {
    const delta = (event.changedTouches[0]?.clientX ?? this.touchStartX) - this.touchStartX;
    if (Math.abs(delta) < 40) return;
    const rtl = this.directionality.valueSignal() === 'rtl';
    (delta > 0) !== rtl ? this.previous() : this.next();
  }
  private setIndex(index: number): void {
    const next = Math.max(0, Math.min(this.maxStartIndex(), index));
    if (next === this.activeIndex()) return;
    this.activeIndex.set(next);
    this.activeIndexChange.emit(next);
    this.itemChange.emit(this.items()[next] ?? null);
  }
  private maxStartIndex(): number { return Math.max(0, this.items().length - this.effectiveVisibleItems()); }
}
