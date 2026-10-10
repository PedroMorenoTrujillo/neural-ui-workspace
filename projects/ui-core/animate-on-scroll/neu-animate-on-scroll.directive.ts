import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  effect,
  inject,
  input,
} from '@angular/core';

/** Applies enter/leave animation classes as the host intersects a viewport or element root. */
@Directive({
  selector: '[neuAnimateOnScroll]',
  standalone: true,
})
export class NeuAnimateOnScrollDirective implements AfterViewInit {
  readonly neuAnimateOnScroll = input(true, { transform: booleanAttribute });
  readonly neuAnimateOnScrollEnterClass = input<string | undefined>(undefined);
  readonly neuAnimateOnScrollLeaveClass = input<string | undefined>(undefined);
  readonly neuAnimateOnScrollRoot = input<HTMLElement | null | undefined>(undefined);
  readonly neuAnimateOnScrollRootMargin = input<string | undefined>(undefined);
  readonly neuAnimateOnScrollThreshold = input<number>(0.5);
  readonly neuAnimateOnScrollOnce = input(false, { transform: booleanAttribute });

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private observer: IntersectionObserver | undefined;
  private reducedMotionQuery: MediaQueryList | undefined;
  private initialized = false;
  private reducedMotion = false;
  private state: 'enter' | 'leave' | undefined;

  constructor() {
    effect(() => {
      this.neuAnimateOnScroll();
      this.neuAnimateOnScrollEnterClass();
      this.neuAnimateOnScrollLeaveClass();
      this.neuAnimateOnScrollRoot();
      this.neuAnimateOnScrollRootMargin();
      this.neuAnimateOnScrollThreshold();
      this.neuAnimateOnScrollOnce();
      if (this.initialized) this.configure();
    });

    this.destroyRef.onDestroy(() => this.dispose());
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initialized = true;
    this.reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => this.configure();
    this.reducedMotionQuery?.addEventListener('change', onMotionChange);
    this.destroyRef.onDestroy(() => this.reducedMotionQuery?.removeEventListener('change', onMotionChange));
    this.configure();
  }

  private configure(): void {
    this.observer?.disconnect();
    this.observer = undefined;
    this.clearAnimationClasses();
    this.state = undefined;
    this.reducedMotion = this.reducedMotionQuery?.matches ?? false;

    if (!this.neuAnimateOnScroll() || this.reducedMotion) return;
    if (typeof IntersectionObserver === 'undefined') {
      this.enter();
      return;
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) this.enter();
        else if (!this.neuAnimateOnScrollOnce()) this.leave();
      },
      {
        root: this.neuAnimateOnScrollRoot() ?? null,
        rootMargin: this.neuAnimateOnScrollRootMargin(),
        threshold: this.neuAnimateOnScrollThreshold(),
      },
    );
    this.observer.observe(this.host);
  }

  private enter(): void {
    if (this.state === 'enter') return;
    this.apply(this.neuAnimateOnScrollEnterClass(), this.neuAnimateOnScrollLeaveClass());
    this.state = 'enter';
    if (this.neuAnimateOnScrollOnce()) this.observer?.disconnect();
  }

  private leave(): void {
    if (this.state === 'leave') return;
    this.apply(this.neuAnimateOnScrollLeaveClass(), this.neuAnimateOnScrollEnterClass());
    this.state = 'leave';
  }

  private apply(add: string | undefined, remove: string | undefined): void {
    this.removeClasses(remove);
    if (!add) return;
    this.host.classList.add(...this.classNames(add));
    const clear = () => this.removeClasses(add);
    this.host.addEventListener('animationend', clear, { once: true });
  }

  private clearAnimationClasses(): void {
    this.removeClasses(this.neuAnimateOnScrollEnterClass());
    this.removeClasses(this.neuAnimateOnScrollLeaveClass());
  }

  private removeClasses(value: string | undefined): void {
    const names = this.classNames(value);
    if (names.length) this.host.classList.remove(...names);
  }

  private classNames(value: string | undefined): string[] {
    return value?.trim().split(/\s+/).filter(Boolean) ?? [];
  }

  private dispose(): void {
    this.observer?.disconnect();
    this.observer = undefined;
    this.clearAnimationClasses();
  }
}
