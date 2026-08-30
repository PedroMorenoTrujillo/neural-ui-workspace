import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { NeuIdGenerator } from '@neural-ui/core/internal';

export interface NeuScrollPosition {
  top: number;
  left: number;
  scrollHeight: number;
  scrollWidth: number;
  clientHeight: number;
  clientWidth: number;
}

export type NeuScrollAreaVariant = 'auto' | 'hover' | 'scroll' | 'always' | 'hidden';

@Component({
  selector: 'neu-panel',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-panel' },
  template: `
    <section class="neu-panel__surface">
      @if (header()) {
        <header class="neu-panel__header">
          <h3>{{ header() }}</h3>
          @if (collapsible()) {
            <button type="button" (click)="toggle()" [attr.aria-expanded]="!collapsed()">
              {{ collapsed() ? expandLabel() : collapseLabel() }}
            </button>
          }
        </header>
      }
      @if (!collapsed()) {
        <div class="neu-panel__body"><ng-content /></div>
      }
    </section>
  `,
  styleUrl: './neu-panel.component.scss',
})
export class NeuPanelComponent {
  readonly header = input('');
  readonly collapsible = input(false);
  readonly expandLabel = input('Expand');
  readonly collapseLabel = input('Collapse');
  readonly collapsedChange = output<boolean>();
  readonly collapsed = signal(false);

  toggle(): void {
    this.collapsed.set(!this.collapsed());
    this.collapsedChange.emit(this.collapsed());
  }
}

@Component({
  selector: 'neu-fieldset',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-fieldset-host' },
  template: `
    <fieldset class="neu-fieldset">
      @if (legend()) {
        <legend>{{ legend() }}</legend>
      }
      <ng-content />
    </fieldset>
  `,
  styleUrl: './neu-panel.component.scss',
})
export class NeuFieldsetComponent {
  readonly legend = input('');
}

@Component({
  selector: 'neu-scroll-area',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-scroll-area', '[attr.data-neu-scroll-variant]': 'variant()' },
  template: `
    <div
      #viewport
      class="neu-scroll-area__viewport"
      [class.neu-scroll-area__viewport--enhanced]="enhanced()"
      [class.neu-scroll-area__viewport--masked]="mask()"
      [style.max-height]="maxHeight()"
      [style.max-width]="maxWidth()"
      [attr.role]="ariaLabel() ? 'region' : null"
      [attr.aria-label]="ariaLabel() || null"
      [attr.tabindex]="tabindex()"
      (scroll)="onScroll()"
    ><ng-content /></div>
    @if (enhanced()) {
      <div
        class="neu-scroll-area__bar neu-scroll-area__bar--y"
        [class.neu-scroll-area__bar--hidden]="!canScrollY()"
        role="scrollbar"
        tabindex="0"
        aria-orientation="vertical"
        [attr.aria-controls]="viewportId"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="maxScrollY()"
        [attr.aria-valuenow]="position().top"
        (click)="moveBy('y', $event)"
        (pointerdown)="moveBy('y', $event)"
        (pointermove)="onTrackPointerMove('y', $event)"
        (keydown)="onBarKey($event, 'y')"
      ><span class="neu-scroll-area__thumb" [style.height.%]="thumbY()" [style.transform]="thumbTransformY()"></span></div>
      <div
        class="neu-scroll-area__bar neu-scroll-area__bar--x"
        [class.neu-scroll-area__bar--hidden]="!canScrollX()"
        role="scrollbar"
        tabindex="0"
        aria-orientation="horizontal"
        [attr.aria-controls]="viewportId"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="maxScrollX()"
        [attr.aria-valuenow]="position().left"
        (click)="moveBy('x', $event)"
        (pointerdown)="moveBy('x', $event)"
        (pointermove)="onTrackPointerMove('x', $event)"
        (keydown)="onBarKey($event, 'x')"
      ><span class="neu-scroll-area__thumb" [style.width.%]="thumbX()" [style.transform]="thumbTransformX()"></span></div>
    }
  `,
  styleUrl: './neu-panel.component.scss',
})

/**
 * Native scrolling by default, with opt-in themed, keyboard-operable scrollbars.
 * The viewport is always the source of truth, so wheel, touch, RTL and browser
 * scrolling retain their platform behavior.
 */
export class NeuScrollAreaComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private resizeObserver?: ResizeObserver;
  readonly viewport = viewChild.required<ElementRef<HTMLDivElement>>('viewport');
  readonly viewportId = inject(NeuIdGenerator).getId('neu-scroll-area-');
  readonly maxHeight = input('240px');
  readonly maxWidth = input<string | null>(null);
  /** Enables decorative, accessible scrollbar tracks. Native scrolling stays active. */
  readonly enhanced = input(false, { transform: booleanAttribute });
  readonly variant = input<NeuScrollAreaVariant>('auto');
  readonly mask = input(true, { transform: booleanAttribute });
  readonly tabindex = input(0, { transform: numberAttribute });
  readonly step = input(40);
  readonly ariaLabel = input('');
  readonly scrollPositionChange = output<NeuScrollPosition>();
  readonly position = signal<NeuScrollPosition>({
    top: 0,
    left: 0,
    scrollHeight: 0,
    scrollWidth: 0,
    clientHeight: 0,
    clientWidth: 0,
  });

  ngAfterViewInit(): void {
    this.viewport().nativeElement.id = this.viewportId;
    this.refresh();
    if (this.enhanced() && isPlatformBrowser(this.platformId)) {
      const ResizeObserverCtor = this.document.defaultView?.ResizeObserver;
      if (ResizeObserverCtor) {
        this.resizeObserver = new ResizeObserverCtor(() => this.refresh());
        this.resizeObserver.observe(this.viewport().nativeElement);
      }
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  onScroll(): void {
    this.refresh(true);
  }

  refresh(emit = false): void {
    const element = this.viewport().nativeElement;
    const next: NeuScrollPosition = {
      top: element.scrollTop,
      left: element.scrollLeft,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
    };
    this.position.set(next);
    if (emit) this.scrollPositionChange.emit(next);
  }

  scrollTo(options: ScrollToOptions): void {
    const element = this.viewport().nativeElement;
    if (typeof element.scrollTo === 'function') {
      element.scrollTo(options);
    } else {
      if (options.top !== undefined) element.scrollTop = options.top;
      if (options.left !== undefined) element.scrollLeft = options.left;
    }
    this.refresh();
  }

  focus(options?: FocusOptions): void {
    this.viewport().nativeElement.focus(options);
  }

  readonly maxScrollY = () => Math.max(0, this.position().scrollHeight - this.position().clientHeight);
  readonly maxScrollX = () => Math.max(0, this.position().scrollWidth - this.position().clientWidth);
  readonly canScrollY = () => this.maxScrollY() > 0;
  readonly canScrollX = () => this.maxScrollX() > 0;
  readonly thumbY = () => this.canScrollY() ? Math.max((this.position().clientHeight / this.position().scrollHeight) * 100, 12) : 100;
  readonly thumbX = () => this.canScrollX() ? Math.max((this.position().clientWidth / this.position().scrollWidth) * 100, 12) : 100;
  readonly thumbTransformY = () => `translateY(${this.maxScrollY() ? ((this.position().top / this.maxScrollY()) * (100 - this.thumbY())) : 0}%)`;
  readonly thumbTransformX = () => `translateX(${this.maxScrollX() ? ((this.position().left / this.maxScrollX()) * (100 - this.thumbX())) : 0}%)`;

  moveBy(axis: 'x' | 'y', event: MouseEvent): void {
    const element = this.viewport().nativeElement;
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const coordinate = axis === 'x' ? event.clientX - rect.left : event.clientY - rect.top;
    const size = axis === 'x' ? rect.width : rect.height;
    const max = axis === 'x' ? this.maxScrollX() : this.maxScrollY();
    this.scrollTo(axis === 'x' ? { left: max * (coordinate / size) } : { top: max * (coordinate / size) });
    this.refresh(true);
  }

  onTrackPointerMove(axis: 'x' | 'y', event: PointerEvent): void {
    if (event.buttons === 1) this.moveBy(axis, event);
  }

  onBarKey(event: KeyboardEvent, axis: 'x' | 'y'): void {
    const forward = axis === 'x' ? 'ArrowRight' : 'ArrowDown';
    const backward = axis === 'x' ? 'ArrowLeft' : 'ArrowUp';
    const element = this.viewport().nativeElement;
    let amount: number | undefined;
    if (event.key === forward) amount = this.step();
    if (event.key === backward) amount = -this.step();
    if (event.key === 'PageDown') amount = axis === 'x' ? element.clientWidth : element.clientHeight;
    if (event.key === 'PageUp') amount = -(axis === 'x' ? element.clientWidth : element.clientHeight);
    if (event.key === 'Home') amount = -(axis === 'x' ? element.scrollLeft : element.scrollTop);
    if (event.key === 'End') amount = axis === 'x' ? this.maxScrollX() - element.scrollLeft : this.maxScrollY() - element.scrollTop;
    if (amount === undefined) return;
    event.preventDefault();
    if (axis === 'x') element.scrollLeft += amount;
    else element.scrollTop += amount;
    this.refresh(true);
  }
}
