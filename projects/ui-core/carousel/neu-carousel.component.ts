import { Component, ContentChild, DestroyRef, Directive, PLATFORM_ID, TemplateRef, afterNextRender, computed, effect, inject, input, output, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';

export interface NeuCarouselResponsiveOption { breakpoint: string | number; numVisible: number; numScroll?: number; }
export interface NeuCarouselItemContext<T> { $implicit: T; index: number; }
export interface NeuCarouselPageEvent { page: number; first: number; }
@Directive({ selector: 'ng-template[neuCarouselItem]' }) export class NeuCarouselItemDirective<T = unknown> { readonly templateRef = inject<TemplateRef<NeuCarouselItemContext<T>>>(TemplateRef); }
@Directive({ selector: 'ng-template[neuCarouselHeader]' }) export class NeuCarouselHeaderDirective { readonly templateRef = inject<TemplateRef<void>>(TemplateRef); }
@Directive({ selector: 'ng-template[neuCarouselFooter]' }) export class NeuCarouselFooterDirective { readonly templateRef = inject<TemplateRef<void>>(TemplateRef); }

/** Generic paged content carousel. It never mutates the consumer's item array. */
@Component({
  selector: 'neu-carousel', imports: [NgTemplateOutlet],
  host: { class: 'neu-carousel', '[class.neu-carousel--vertical]': 'orientation() === "vertical"' },
  template: `
    <section class="neu-carousel__root" role="region" [attr.aria-label]="ariaLabel()" (keydown)="onKeydown($event)" (pointerdown)="onPointerDown($event)" (pointerup)="onPointerUp($event)">
      @if (headerTemplate) { <ng-container [ngTemplateOutlet]="headerTemplate.templateRef" /> }
      @if (items().length) {
        <div class="neu-carousel__content">
          @if (showNavigators()) { <button type="button" class="neu-carousel__nav" [disabled]="!canPrevious()" [attr.aria-label]="previousLabel()" (click)="previous()">{{ orientation() === 'vertical' ? '↑' : '‹' }}</button> }
          <div class="neu-carousel__viewport" [style.block-size]="orientation() === 'vertical' ? verticalViewPortHeight() : null" aria-live="off">
            <div class="neu-carousel__track" [style.grid-template-columns]="orientation() === 'horizontal' ? 'repeat(' + effectiveVisible() + ', minmax(0, 1fr))' : null">
              @for (item of visibleItems(); track trackBy()($index + first(), item); let index = $index) {
                <div class="neu-carousel__item" role="group" [attr.aria-label]="itemLabel(first() + index)">
                  @if (itemTemplate) { <ng-container [ngTemplateOutlet]="itemTemplate.templateRef" [ngTemplateOutletContext]="{ $implicit: item, index: first() + index }" /> } @else { {{ item }} }
                </div>
              }
            </div>
          </div>
          @if (showNavigators()) { <button type="button" class="neu-carousel__nav" [disabled]="!canNext()" [attr.aria-label]="nextLabel()" (click)="next()">{{ orientation() === 'vertical' ? '↓' : '›' }}</button> }
        </div>
        <div class="neu-carousel__controls">
          @if (showIndicators() && pageCount() > 1) { <div class="neu-carousel__indicators" role="group" [attr.aria-label]="indicatorLabel()"> @for (pageNumber of pages(); track pageNumber) { <button type="button" [attr.aria-pressed]="pageNumber === page()" [attr.aria-label]="pageLabel(pageNumber)" [class.neu-carousel__indicator--active]="pageNumber === page()" (click)="setPage(pageNumber, true)"><span aria-hidden="true"></span></button> } </div> }
          @if (autoplayInterval() > 0 && pageCount() > 1) { <button type="button" class="neu-carousel__autoplay" [attr.aria-label]="autoplayLabel()" [attr.aria-pressed]="paused()" (click)="paused.update(value => !value)">{{ paused() ? '▶' : 'Ⅱ' }}</button> }
        </div>
      } @else { <div class="neu-carousel__empty" role="status">{{ emptyLabel() }}</div> }
      @if (footerTemplate) { <ng-container [ngTemplateOutlet]="footerTemplate.templateRef" /> }
    </section>
  `, styleUrl: './neu-carousel.component.scss',
})
export class NeuCarouselComponent<T = unknown> {
  private readonly _destroyRef = inject(DestroyRef); private readonly _document = inject(DOCUMENT); private readonly _platformId = inject(PLATFORM_ID); private readonly _isBrowser = isPlatformBrowser(this._platformId); private _timer: ReturnType<typeof setTimeout> | null = null; private _pointerStart: { x: number; y: number } | null = null; private _lastEffectiveScroll = 1; private readonly _viewportWidth = signal<number | null>(null); private readonly _reducedMotion = signal(false); private readonly _browserReady = signal(false); protected readonly paused = signal(false);
  readonly items = input<readonly T[]>([]); readonly pageInput = input<number | null>(null, { alias: 'page' }); readonly initialPage = input(0); readonly numVisible = input(1); readonly numScroll = input(1); readonly responsiveOptions = input<readonly NeuCarouselResponsiveOption[]>([]); readonly circular = input(false); readonly autoplayInterval = input(0); readonly showIndicators = input(true); readonly showNavigators = input(true); readonly orientation = input<'horizontal' | 'vertical'>('horizontal'); readonly verticalViewPortHeight = input('20rem'); readonly ariaLabel = input('Carousel'); readonly indicatorLabel = input('Carousel pages'); readonly previousLabel = input('Previous items'); readonly nextLabel = input('Next items'); readonly emptyLabel = input('No items'); readonly trackBy = input<(index: number, item: T) => unknown>((index) => index);
  readonly pageChange = output<NeuCarouselPageEvent>(); @ContentChild(NeuCarouselItemDirective) readonly itemTemplate?: NeuCarouselItemDirective<T>; @ContentChild(NeuCarouselHeaderDirective) readonly headerTemplate?: NeuCarouselHeaderDirective; @ContentChild(NeuCarouselFooterDirective) readonly footerTemplate?: NeuCarouselFooterDirective; private readonly _page = signal<number | null>(null);
  private readonly locale = inject(NEURAL_LOCALE);
  private readonly activeLocale = signal(this._document.documentElement.lang || this.locale);
  protected readonly autoplayLabel = computed(() => {
    const es = this.activeLocale().toLowerCase().startsWith('es');
    return (this.paused() ? (es ? 'Reanudar ' : 'Resume ') : (es ? 'Pausar ' : 'Pause ')) + this.ariaLabel();
  });
  constructor() {
    const Observer = this._document.defaultView?.MutationObserver;
    if (Observer) {
      const observer = new Observer(() => this.activeLocale.set(this._document.documentElement.lang || this.locale));
      observer.observe(this._document.documentElement, { attributes: true, attributeFilter: ['lang'] });
      this._destroyRef.onDestroy(() => observer.disconnect());
    }
    if (this._isBrowser) {
      afterNextRender(() => {
        const view = this._document.defaultView;
        this._viewportWidth.set(view?.innerWidth ?? null);
        const onResize = () => this._viewportWidth.set(view?.innerWidth ?? null);
        view?.addEventListener('resize', onResize, { passive: true });
        this._destroyRef.onDestroy(() => view?.removeEventListener('resize', onResize));
        const motion = view?.matchMedia?.('(prefers-reduced-motion: reduce)');
        this._reducedMotion.set(motion?.matches ?? false);
        const onMotion = (event: MediaQueryListEvent) => this._reducedMotion.set(event.matches);
        motion?.addEventListener?.('change', onMotion);
        this._destroyRef.onDestroy(() => motion?.removeEventListener?.('change', onMotion));
        this._browserReady.set(true);
      });
    }
    effect(() => {
      const scroll = this.effectiveScroll(); this.effectiveVisible(); this.items(); this.circular();
      if (this.pageInput() != null) { this._lastEffectiveScroll = scroll; return; }
      const current = this._page();
      const next = current === null
        ? this.clampPage(this.initialPage())
        : this.clampPage(scroll === this._lastEffectiveScroll ? current : Math.floor(current * this._lastEffectiveScroll / scroll));
      if (current !== next) this._page.set(next);
      this._lastEffectiveScroll = scroll;
    });
    effect(() => { const interval = this.autoplayInterval(); const paused = this.paused(); const reducedMotion = this._reducedMotion(); const count = this.pageCount(); const ready = this._browserReady(); this.stopAutoplay(); if (ready && interval > 0 && count > 1 && !reducedMotion && !paused) this.scheduleAutoplay(interval); });
    this._destroyRef.onDestroy(() => this.stopAutoplay());
  }
  readonly matchedResponsiveOption = computed(() => {
    const viewportWidth = this._viewportWidth();
    if (viewportWidth == null) return undefined;
    return [...this.responsiveOptions()]
      .filter((option) => Number.isFinite(this.breakpointValue(option.breakpoint)))
      .sort((first, second) => this.breakpointValue(first.breakpoint) - this.breakpointValue(second.breakpoint))
      .find((option) => this.breakpointValue(option.breakpoint) >= viewportWidth);
  });
  readonly resolvedNumVisible = computed(() => this.matchedResponsiveOption()?.numVisible ?? this.numVisible()); readonly resolvedNumScroll = computed(() => this.matchedResponsiveOption()?.numScroll ?? this.numScroll()); readonly effectiveVisible = computed(() => Math.max(1, Math.min(this.resolvedNumVisible(), this.items().length || 1))); readonly effectiveScroll = computed(() => Math.max(1, this.resolvedNumScroll())); readonly pageCount = computed(() => Math.max(1, Math.ceil(Math.max(0, this.items().length - this.effectiveVisible()) / this.effectiveScroll()) + 1)); readonly page = computed(() => this.clampPage(this.pageInput() ?? this._page() ?? this.initialPage())); readonly first = computed(() => Math.min(this.page() * this.effectiveScroll(), Math.max(0, this.items().length - this.effectiveVisible()))); readonly visibleItems = computed(() => this.items().slice(this.first(), this.first() + this.effectiveVisible())); readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, index) => index)); readonly canPrevious = computed(() => this.circular() || this.page() > 0); readonly canNext = computed(() => this.circular() || this.page() < this.pageCount() - 1);
  setPage(page: number, user = false): void { const next = this.clampPage(page); if (next === this.page()) return; if (this.pageInput() == null) this._page.set(next); if (user) this.pageChange.emit({ page: next, first: Math.min(next * this.effectiveScroll(), Math.max(0, this.items().length - this.effectiveVisible())) }); }
  previous(): void { this.setPage(this.page() - 1, true); }
  next(): void { this.setPage(this.page() + 1, true); }
  onKeydown(event: KeyboardEvent): void {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('.neu-carousel__item')) return;
    const rtl = this.orientation() === 'horizontal' && this.isRtl(event.currentTarget);
    if (event.key === 'ArrowUp' || event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) { event.preventDefault(); this.previous(); }
    if (event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) { event.preventDefault(); this.next(); }
    if (event.key === 'Home') { event.preventDefault(); this.setPage(0, true); }
    if (event.key === 'End') { event.preventDefault(); this.setPage(this.pageCount() - 1, true); }
  }
  onPointerDown(event: PointerEvent): void { this._pointerStart = { x: event.clientX, y: event.clientY }; }
  onPointerUp(event: PointerEvent): void {
    if (!this._pointerStart) return;
    const delta = this.orientation() === 'vertical' ? event.clientY - this._pointerStart.y : event.clientX - this._pointerStart.x;
    this._pointerStart = null;
    if (Math.abs(delta) <= 36) return;
    const towardsPrevious = delta > 0 !== (this.orientation() === 'horizontal' && this.isRtl(event.currentTarget));
    towardsPrevious ? this.previous() : this.next();
  }
  itemLabel(index: number): string { return this.activeLocale().toLowerCase().startsWith('es') ? `Elemento ${index + 1} de ${this.items().length}` : `Item ${index + 1} of ${this.items().length}`; }
  pageLabel(page: number): string { return this.activeLocale().toLowerCase().startsWith('es') ? `Página ${page + 1} de ${this.pageCount()}` : `Page ${page + 1} of ${this.pageCount()}`; }
  private isRtl(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && (
      target.closest('[dir]')?.getAttribute('dir') === 'rtl' ||
      this._document.defaultView?.getComputedStyle(target).direction === 'rtl'
    );
  }
  private breakpointValue(breakpoint: string | number): number { return Number.parseInt(String(breakpoint), 10); }
  private clampPage(page: number): number { const count = this.pageCount(); if (this.circular()) return ((Math.trunc(page) % count) + count) % count; return Math.max(0, Math.min(count - 1, Math.trunc(page))); }
  private scheduleAutoplay(interval: number): void { this._timer = setTimeout(() => { this._timer = null; if (this.circular() || this.canNext()) { this.next(); this.scheduleAutoplay(interval); } }, interval); }
  private stopAutoplay(): void { if (this._timer) clearTimeout(this._timer); this._timer = null; }
}
