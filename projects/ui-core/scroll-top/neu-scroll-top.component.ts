import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ContentChild,
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  TemplateRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { InternalNeuIconOutletComponent, neuStructuralIconPath } from '@neural-ui/core/icon-outlet-internal';
import type { NeuIconKey } from '@neural-ui/core/foundation';
import { neuIconChevronUp as iconChevronUp } from '@neural-ui/core/internal';

export type NeuScrollTopTarget = 'window' | 'parent';
export type NeuScrollTopBehavior = 'auto' | 'smooth';

/** Custom visual icon for ScrollTop. The native button keeps its accessible label. */
@Directive({ selector: 'ng-template[neuScrollTopIcon]' })
export class NeuScrollTopIconDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

/** A browser-safe button that returns either the window or its parent scroller to the top. */
@Component({
  selector: 'neu-scroll-top',
  imports: [InternalNeuIconOutletComponent, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (visible()) {
      <button class="neu-scroll-top" type="button" [attr.aria-label]="buttonAriaLabel()"
        (click)="scrollToTop()">
        @if (iconTemplate) {
          <ng-container [ngTemplateOutlet]="iconTemplate.templateRef" />
        } @else {
          <neu-icon-outlet [icon]="icon() === 'chevron-up' ? iconChevronUp : icon()" [fallbackPath]="iconFallbackPath(icon() === 'chevron-up' ? iconChevronUp : icon())" size="1.125rem" aria-hidden="true" />
        }
      </button>
    }
  `,
  styleUrl: './neu-scroll-top.component.scss',
})
export class NeuScrollTopComponent {
  protected readonly iconFallbackPath = neuStructuralIconPath;
  protected readonly iconChevronUp = iconChevronUp;
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly browser = isPlatformBrowser(this.platformId);
  private removeListener: (() => void) | null = null;

  @ContentChild(NeuScrollTopIconDirective) iconTemplate?: NeuScrollTopIconDirective;
  /** Scroll source: browser window or the component's parent element. */
  target = input<NeuScrollTopTarget>('window');
  /** Vertical scroll amount required before the button is rendered. */
  threshold = input<number>(400);
  /** Requested scroll behavior; smooth is reduced to auto for reduced-motion users. */
  behavior = input<NeuScrollTopBehavior>('smooth');
  /** Registered Neural icon name. */
  icon = input<NeuIconKey>('chevron-up');
  /** Accessible action label on the native button. */
  buttonAriaLabel = input<string>('Scroll to top');

  readonly visible = signal(false);
  readonly hostClasses = computed(() => ({
    'neu-scroll-top-host': true,
    'neu-scroll-top-host--parent': this.target() === 'parent',
  }));

  constructor() {
    effect(() => {
      const target = this.target();
      this.threshold();
      if (!this.browser) return;
      this.rebind(target);
    });
    this.destroyRef.onDestroy(() => this.unbind());
  }

  scrollToTop(): void {
    const target = this.scrollTarget();
    if (!target) return;
    const behavior = this.reducedMotion() ? 'auto' : this.behavior();
    target.scrollTo({ top: 0, behavior });
  }

  private rebind(target: NeuScrollTopTarget): void {
    this.unbind();
    const scrollTarget = this.scrollTarget(target);
    if (!scrollTarget) {
      this.visible.set(false);
      return;
    }
    const listener = () => this.updateVisibility(scrollTarget);
    scrollTarget.addEventListener('scroll', listener, { passive: true });
    this.removeListener = () => scrollTarget.removeEventListener('scroll', listener);
    this.updateVisibility(scrollTarget);
  }

  private unbind(): void {
    this.removeListener?.();
    this.removeListener = null;
  }

  private scrollTarget(target = this.target()): Window | HTMLElement | null {
    if (!this.browser) return null;
    if (target === 'window') return this.document.defaultView;
    return this.element.nativeElement.parentElement;
  }

  private updateVisibility(target: Window | HTMLElement): void {
    const position = target === this.document.defaultView
      ? target.scrollY || this.document.documentElement.scrollTop || 0
      : (target as HTMLElement).scrollTop;
    this.visible.set(position > Math.max(0, this.threshold()));
  }

  private reducedMotion(): boolean {
    return this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }
}
