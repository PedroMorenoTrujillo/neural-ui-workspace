import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  effect,
  inject,
  input,
  numberAttribute,
} from '@angular/core';

/** Optional, pointer-origin visual feedback for interactive hosts. */
@Directive({
  selector: '[neuRipple]',
  standalone: true,
  host: {
    class: 'neu-ripple',
    '(pointerdown)': 'onPointerDown($event)',
    '(keydown.enter)': 'onKeyboardActivation()',
    '(keydown.space)': 'onKeyboardActivation()',
  },
})
export class NeuRippleDirective {
  readonly neuRipple = input(true, { transform: booleanAttribute });
  readonly neuRippleDisabled = input(false, { transform: booleanAttribute });
  readonly neuRippleDuration = input(450, { transform: numberAttribute });

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private reducedMotionQuery: MediaQueryList | undefined;
  private reducedMotion = false;
  private readonly activeRipples = new Map<HTMLSpanElement, ReturnType<typeof setTimeout>>();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const updateMotion = () => (this.reducedMotion = this.reducedMotionQuery?.matches ?? false);
    updateMotion();
    this.reducedMotionQuery?.addEventListener('change', updateMotion);
    this.destroyRef.onDestroy(() => {
      this.reducedMotionQuery?.removeEventListener('change', updateMotion);
      this.clearRipples();
    });

    effect(() => {
      if (!this.neuRipple() || this.neuRippleDisabled()) this.clearRipples();
    });
  }

  onPointerDown(event: PointerEvent): void {
    if (!this.canRipple()) return;
    const bounds = this.host.getBoundingClientRect();
    this.create(event.clientX - bounds.left, event.clientY - bounds.top, bounds);
  }

  onKeyboardActivation(): void {
    if (!this.canRipple()) return;
    const bounds = this.host.getBoundingClientRect();
    this.create(bounds.width / 2, bounds.height / 2, bounds);
  }

  private canRipple(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      this.neuRipple() &&
      !this.neuRippleDisabled() &&
      !this.reducedMotion &&
      !this.isHostDisabled()
    );
  }

  private isHostDisabled(): boolean {
    return this.host instanceof HTMLButtonElement || this.host instanceof HTMLInputElement
      ? this.host.disabled
      : this.host.getAttribute('aria-disabled') === 'true';
  }

  private create(x: number, y: number, bounds: DOMRect): void {
    const diameter =
      Math.max(
        Math.hypot(x, y),
        Math.hypot(bounds.width - x, y),
        Math.hypot(x, bounds.height - y),
        Math.hypot(bounds.width - x, bounds.height - y),
      ) * 2;
    const ripple = this.document.createElement('span');
    ripple.className = 'neu-ripple__ink';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.width = `${diameter}px`;
    ripple.style.height = `${diameter}px`;
    ripple.style.left = `${x - diameter / 2}px`;
    ripple.style.top = `${y - diameter / 2}px`;
    ripple.style.animationDuration = `${Math.max(1, this.neuRippleDuration())}ms`;
    this.host.append(ripple);
    const remove = () => {
      ripple.remove();
      const timeout = this.activeRipples.get(ripple);
      if (timeout) clearTimeout(timeout);
      this.activeRipples.delete(ripple);
    };
    ripple.addEventListener('animationend', remove, { once: true });
    const timeout = setTimeout(remove, Math.max(1, this.neuRippleDuration()) + 100);
    this.activeRipples.set(ripple, timeout);
  }

  private clearRipples(): void {
    for (const [ripple, timeout] of this.activeRipples) {
      clearTimeout(timeout);
      ripple.remove();
    }
    this.activeRipples.clear();
  }
}
