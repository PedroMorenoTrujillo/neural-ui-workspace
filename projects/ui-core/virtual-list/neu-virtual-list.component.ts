import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender, afterRenderEffect, Component, computed, contentChild, DestroyRef,
  Directive, ElementRef, inject, input, isDevMode, output, signal, TemplateRef,
  viewChild, ViewEncapsulation,
} from '@angular/core';
import { duplicateVirtualListKeys, keyToken, projectVirtualWindow } from './neu-virtual-list.engine';
import type {
  NeuVirtualItemContext, NeuVirtualListKey, NeuVirtualListRange, NeuVirtualListScrollTarget,
} from './neu-virtual-list.types';

@Directive({ selector: 'ng-template[neuVirtualItem]', standalone: true })
export class NeuVirtualItemDirective<T, K extends NeuVirtualListKey = NeuVirtualListKey> {
  /** [neuVirtualItem]="items" acts as a typing witness for consumer templates. */
  readonly neuVirtualItem = input<readonly T[] | undefined>();
  /** Optional key witness preserves the exact K type in the template context. */
  readonly neuVirtualItemKey = input<((item: T) => K) | undefined>();
  readonly templateRef = inject<TemplateRef<NeuVirtualItemContext<T, K>>>(TemplateRef);

  static ngTemplateContextGuard<T, K extends NeuVirtualListKey>(
    _directive: NeuVirtualItemDirective<T, K>, context: unknown,
  ): context is NeuVirtualItemContext<T, K> {
    return true;
  }
}

interface RenderedItem<T, K extends NeuVirtualListKey> {
  readonly item: T;
  readonly index: number;
  readonly track: string;
  readonly context: NeuVirtualItemContext<T, K>;
}

@Component({
  selector: 'neu-virtual-list',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-virtual-list' },
  template: `
    <div #viewport class="neu-virtual-list__viewport" role="list"
      [style.block-size.px]="viewportBlockSize()">
      <div class="neu-virtual-list__spacer" aria-hidden="true"
        [style.block-size.px]="window().topSpacer"></div>
      @for (row of renderedItems(); track row.track) {
        <div class="neu-virtual-list__item" role="listitem"
          [attr.aria-posinset]="row.index + 1"
          [attr.aria-setsize]="items().length"
          [style.block-size.px]="window().itemSize">
          @if (itemTemplate(); as projected) {
            <ng-container [ngTemplateOutlet]="projected.templateRef"
              [ngTemplateOutletContext]="row.context" />
          } @else {
            {{ row.item }}
          }
        </div>
      }
      <div class="neu-virtual-list__spacer" aria-hidden="true"
        [style.block-size.px]="window().bottomSpacer"></div>
    </div>
    @if (items().length === 0) {
      <div class="neu-virtual-list__empty" role="status">{{ emptyLabel() }}</div>
    }
  `,
  styleUrl: './neu-virtual-list.component.scss',
})
export class NeuVirtualListComponent<T, K extends NeuVirtualListKey = string> {
  readonly items = input<readonly T[]>([]);
  readonly itemSize = input(48);
  readonly visibleRows = input(10);
  readonly itemKey = input.required<(item: T) => K>();
  readonly emptyLabel = input('No results');
  /** Intersecting viewport range; [start, end), excluding overscan. */
  readonly rangeChange = output<NeuVirtualListRange>();

  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  protected readonly itemTemplate = contentChild(NeuVirtualItemDirective<T, K>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scrollTop = signal(0);
  private readonly measuredHeight = signal<number | null>(null);
  private readonly browserActive = signal(false);
  private pendingFrame: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private removeScrollListener: (() => void) | null = null;
  private lastEmittedRange: NeuVirtualListRange | null = null;
  private lastDuplicateSignature = '';

  private readonly normalizedItemSize = computed(() =>
    Number.isFinite(this.itemSize()) && this.itemSize() > 0 ? this.itemSize() : 1,
  );
  protected readonly viewportBlockSize = computed(() => {
    const rows = this.visibleRows();
    return (Number.isFinite(rows) ? Math.max(1, Math.floor(rows)) : 1) * this.normalizedItemSize();
  });
  protected readonly window = computed(() => projectVirtualWindow({
    scrollTop: this.scrollTop(),
    viewportHeight: this.measuredHeight() ?? this.viewportBlockSize(),
    itemSize: this.itemSize(),
    itemCount: this.items().length,
    overscan: 2,
  }));
  private readonly duplicateKeys = computed(() =>
    duplicateVirtualListKeys(this.items(), this.itemKey()),
  );
  protected readonly renderedItems = computed(() => {
    const rows: RenderedItem<T, K>[] = [];
    const items = this.items();
    const getKey = this.itemKey();
    const duplicates = this.duplicateKeys();
    const { render } = this.window();
    for (let index = render.start; index < render.end; index++) {
      const item = items[index];
      const key = getKey(item);
      const token = keyToken(key);
      rows.push({
        item, index,
        track: duplicates.has(token) ? `${token}@${index}` : token,
        context: { $implicit: item, item, index, key },
      });
    }
    return rows;
  });

  constructor() {
    afterNextRender(() => {
      if (this.destroyRef.destroyed) return;
      const viewport = this.viewport().nativeElement;
      const update = () => {
        if (this.destroyRef.destroyed) return;
        this.scrollTop.set(viewport.scrollTop);
        this.measuredHeight.set(viewport.clientHeight || this.viewportBlockSize());
      };
      const schedule = () => {
        if (this.pendingFrame !== null || this.destroyRef.destroyed) return;
        this.pendingFrame = requestAnimationFrame(() => {
          this.pendingFrame = null;
          update();
        });
      };
      viewport.addEventListener('scroll', schedule, { passive: true });
      this.removeScrollListener = () => viewport.removeEventListener('scroll', schedule);
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(schedule);
        this.resizeObserver.observe(viewport);
      }
      update();
      this.browserActive.set(true);
    });
    afterRenderEffect(() => {
      const range = this.window().visible;
      const duplicateKeys = this.duplicateKeys();
      if (!this.browserActive()) return;
      if (isDevMode()) {
        const signature = duplicateKeys.size ? JSON.stringify([...duplicateKeys]) : '';
        if (signature && signature !== this.lastDuplicateSignature)
          console.warn(`NeuVirtualList duplicate itemKey: ${signature}`);
        this.lastDuplicateSignature = signature;
      }
      if (this.lastEmittedRange?.start === range.start && this.lastEmittedRange.end === range.end)
        return;
      this.lastEmittedRange = range;
      this.rangeChange.emit(range);
    });
    this.destroyRef.onDestroy(() => {
      this.removeScrollListener?.();
      this.resizeObserver?.disconnect();
      if (this.pendingFrame !== null) cancelAnimationFrame(this.pendingFrame);
      this.pendingFrame = null;
    });
  }

  /** Scrolls the applied client list; key lookup is an on-demand linear scan. */
  scrollTo(target: NeuVirtualListScrollTarget<K>): boolean {
    if (!this.browserActive() || this.destroyRef.destroyed) return false;
    const items = this.items();
    let index: number;
    if ('index' in target) index = target.index;
    else {
      const requested = keyToken(target.key);
      const getKey = this.itemKey();
      index = items.findIndex((item) => keyToken(getKey(item)) === requested);
    }
    if (!Number.isInteger(index) || index < 0 || index >= items.length) return false;
    const viewport = this.viewport().nativeElement;
    const size = this.normalizedItemSize();
    const height = viewport.clientHeight || this.viewportBlockSize();
    const top = index * size;
    const align = target.align ?? 'nearest';
    let next = viewport.scrollTop;
    if (align === 'start') next = top;
    else if (align === 'center') next = top - (height - size) / 2;
    else if (align === 'end') next = top + size - height;
    else if (top < next) next = top;
    else if (top + size > next + height) next = top + size - height;
    viewport.scrollTop = Math.max(0, Math.min(next, Math.max(0, items.length * size - height)));
    this.scrollTop.set(viewport.scrollTop);
    return true;
  }
}
