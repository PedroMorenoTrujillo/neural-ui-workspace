import {
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import {
  clampScroll, detectRtlScrollMode, logicalScrollLeftToRaw, rawScrollLeftToLogical,
  type RtlScrollMode,
} from './scroll-left';

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
  host: { class: 'neu-panel' },
  template: `
    <section class="neu-panel__surface">
      @if (header()) {
        <header class="neu-panel__header">
          <h3>{{ header() }}</h3>
          @if (collapsible()) {
            <button type="button" (click)="toggle()" [attr.aria-expanded]="!effectiveCollapsed()" [attr.aria-controls]="_bodyId">
              {{ effectiveCollapsed() ? expandLabel() : collapseLabel() }}
            </button>
          }
        </header>
      }
      @if (!effectiveCollapsed()) {
        <div class="neu-panel__body" [id]="_bodyId"><ng-content /></div>
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
  /** Applied controlled state. Undefined selects uncontrolled mode for this instance. */
  readonly collapsed = input<boolean | undefined>(undefined);
  /** One-time seed used only when `collapsed` is not bound. */
  readonly initialCollapsed = input(false);
  readonly collapsedChange = output<boolean>();
  private controlMode: 'controlled' | 'uncontrolled' | null = null;
  private modeWarningEmitted = false;
  private uncontrolledCollapsed = false;
  private readonly uncontrolledRevision = signal(0);
  readonly effectiveCollapsed = computed(() => {
    this.uncontrolledRevision();
    return this.ensureControlMode() === 'controlled'
      ? (this.collapsed() ?? false)
      : this.uncontrolledCollapsed;
  });
  protected readonly _bodyId = inject(NeuIdGenerator).getId('neu-panel-body-');

  toggle(): void {
    if (!this.collapsible()) return;
    const proposal = !this.effectiveCollapsed();
    if (this.ensureControlMode() === 'uncontrolled') {
      this.uncontrolledCollapsed = proposal;
      this.uncontrolledRevision.update((revision) => revision + 1);
    }
    this.collapsedChange.emit(proposal);
  }

  private ensureControlMode(): 'controlled' | 'uncontrolled' {
    const requested = this.collapsed() === undefined ? 'uncontrolled' : 'controlled';
    if (this.controlMode === null) {
      this.controlMode = requested;
      if (requested === 'uncontrolled') this.uncontrolledCollapsed = this.initialCollapsed();
    } else if (this.controlMode !== requested && !this.modeWarningEmitted) {
      this.modeWarningEmitted = true;
      if (isDevMode())
        console.warn('NeuPanel cannot switch between controlled and uncontrolled collapse.');
    }
    return this.controlMode;
  }
}

@Component({
  selector: 'neu-fieldset',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-fieldset-host' },
  template: `
    <fieldset class="neu-fieldset" [disabled]="disabled()">
      @if (legend()) {
        <legend [id]="_legendId">
          @if (collapsible()) {
            <button
              class="neu-fieldset__toggle"
              type="button"
              [disabled]="disabled()"
              [attr.aria-expanded]="!effectiveCollapsed()"
              [attr.aria-controls]="_contentId"
              (click)="toggle()"
            >
              <span aria-hidden="true" class="neu-fieldset__indicator">⌄</span>
              <span>{{ legend() }}</span>
            </button>
          } @else {
            {{ legend() }}
          }
        </legend>
      }
      @if (!effectiveCollapsed()) {
        <div
          class="neu-fieldset__content"
          [id]="_contentId"
          [attr.role]="collapsible() ? 'region' : null"
          [attr.aria-labelledby]="collapsible() ? _legendId : null"
        >
          <ng-content />
        </div>
      }
    </fieldset>
  `,
  styleUrl: './neu-panel.component.scss',
})
export class NeuFieldsetComponent {
  readonly legend = input('');
  /** Native disabled state for projected form controls. */
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Presence makes collapse state consumer-authoritative. */
  readonly collapsed = input<boolean | undefined>(undefined);
  readonly collapsedChange = output<boolean>();
  private readonly internalCollapsed = signal(false);
  readonly effectiveCollapsed = computed(
    () => this.collapsible() && (this.collapsed() ?? this.internalCollapsed()),
  );
  protected readonly _legendId = inject(NeuIdGenerator).getId('neu-fieldset-legend-');
  protected readonly _contentId = inject(NeuIdGenerator).getId('neu-fieldset-content-');

  toggle(): void {
    if (!this.collapsible() || this.disabled()) return;
    const next = !this.effectiveCollapsed();
    if (this.collapsed() === undefined) this.internalCollapsed.set(next);
    this.collapsedChange.emit(next);
  }
}

@Component({
  selector: 'neu-scroll-area',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-scroll-area', '[attr.data-neu-scroll-variant]': 'variant()' },
  template: `
    <div
      #viewport
      [id]="viewportId"
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
        (pointermove)="onTrackPointerMove('x', $event)"
        (keydown)="onBarKey($event, 'x')"
      ><span class="neu-scroll-area__thumb" [style.width.%]="thumbX()" [style.inset-inline-start.%]="thumbOffsetX()"></span></div>
    }
  `,
  styleUrl: './neu-panel.component.scss',
})

/**
 * Native scrolling by default, with opt-in themed, keyboard-operable scrollbars.
 * The viewport is always the source of truth, so wheel, touch, RTL and browser
 * scrolling retain their platform behavior.
 */
export class NeuScrollAreaComponent {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private resizeObserver?: ResizeObserver;
  private rtlScrollMode?: RtlScrollMode;
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

  constructor() {
    effect((onCleanup) => {
      if (!isPlatformBrowser(this.platformId)) return;
      const viewport = this.viewport().nativeElement;
      const enhanced = this.enhanced();
      this.refresh();
      if (!enhanced) return;
      const ResizeObserverCtor = this.document.defaultView?.ResizeObserver;
      if (!ResizeObserverCtor) return;
      const observer = new ResizeObserverCtor(() => this.refresh());
      this.resizeObserver = observer;
      observer.observe(viewport);
      onCleanup(() => {
        observer.disconnect();
        if (this.resizeObserver === observer) this.resizeObserver = undefined;
      });
    });
  }

  onScroll(): void {
    this.refresh(true);
  }

  refresh(emit = false): void {
    const element = this.viewport().nativeElement;
    const max = Math.max(0, element.scrollWidth - element.clientWidth);
    const rtl = this.isRtl();
    const next: NeuScrollPosition = {
      top: element.scrollTop,
      left: rawScrollLeftToLogical(element.scrollLeft, max, rtl, rtl ? this.scrollMode() : 'negative'),
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
    const max = Math.max(0, element.scrollWidth - element.clientWidth);
    const rtl = options.left !== undefined && this.isRtl();
    const nativeOptions = options.left === undefined ? options : {
      ...options,
      left: logicalScrollLeftToRaw(options.left, max, rtl, rtl ? this.scrollMode() : 'negative'),
    };
    if (typeof element.scrollTo === 'function') {
      element.scrollTo(nativeOptions);
    } else {
      if (options.top !== undefined) element.scrollTop = options.top;
      if (nativeOptions.left !== undefined) element.scrollLeft = nativeOptions.left;
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
  readonly thumbOffsetX = () => this.maxScrollX()
    ? this.position().left / this.maxScrollX() * (100 - this.thumbX()) : 0;

  moveBy(axis: 'x' | 'y', event: MouseEvent): void {
    const element = this.viewport().nativeElement;
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const coordinate = axis === 'x' ? event.clientX - rect.left : event.clientY - rect.top;
    const size = axis === 'x' ? rect.width : rect.height;
    const max = axis === 'x' ? this.maxScrollX() : this.maxScrollY();
    const ratio = size > 0 ? clampScroll(coordinate / size, 1) : 0;
    this.scrollTo(axis === 'x' ? { left: max * (this.isRtl() ? 1 - ratio : ratio) } : { top: max * ratio });
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
    const physicalSign = axis === 'x' && this.isRtl() ? -1 : 1;
    if (event.key === forward) amount = this.step() * physicalSign;
    if (event.key === backward) amount = -this.step() * physicalSign;
    if (event.key === 'PageDown') amount = (axis === 'x' ? element.clientWidth : element.clientHeight) * physicalSign;
    if (event.key === 'PageUp') amount = -(axis === 'x' ? element.clientWidth : element.clientHeight) * physicalSign;
    if (event.key === 'Home') amount = -(axis === 'x' ? this.position().left : element.scrollTop);
    if (event.key === 'End') amount = axis === 'x' ? this.maxScrollX() - this.position().left : this.maxScrollY() - element.scrollTop;
    if (amount === undefined) return;
    event.preventDefault();
    if (axis === 'x') this.scrollTo({ left: this.position().left + amount });
    else element.scrollTop += amount;
    this.refresh(true);
  }

  private isRtl(): boolean {
    const element = this.viewport().nativeElement;
    return this.document.defaultView?.getComputedStyle(element).direction === 'rtl';
  }

  private scrollMode(): RtlScrollMode {
    if (!this.rtlScrollMode && isPlatformBrowser(this.platformId)) {
      this.rtlScrollMode = detectRtlScrollMode(this.document);
    }
    return this.rtlScrollMode ?? 'negative';
  }
}
