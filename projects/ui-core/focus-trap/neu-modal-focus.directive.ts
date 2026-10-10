import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { NeuFocusTrapDirective } from './neu-focus-trap.directive';

export type NeuModalInitialFocus = 'first' | 'container' | string;

/**
 * @internal
 * Adds origin capture, initial focus, Escape delegation, and focus restoration
 * around the existing focus-containment directive. Overlay lifecycle remains local.
 */
@Directive({
  selector: '[neuModalFocus]',
  host: {
    tabindex: '-1',
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class NeuModalFocusDirective {
  readonly neuModalFocus = input(true, { transform: booleanAttribute });
  readonly neuModalFocusInitial = input<NeuModalInitialFocus>('first');
  readonly neuModalFocusRestore = input(true, { transform: booleanAttribute });
  readonly neuModalFocusEscape = output<KeyboardEvent>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly focusTrap = inject(NeuFocusTrapDirective, { self: true, optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly origin =
    this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
  private destroyed = false;

  constructor() {
    afterNextRender(() => {
      queueMicrotask(() => {
        if (!this.destroyed && this.neuModalFocus()) this.focusInitial();
      });
    });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      if (this.neuModalFocusRestore() && this.origin?.isConnected) {
        this.origin.focus({ preventScroll: true });
      }
    });
  }

  onEscape(event: Event): void {
    if (!this.neuModalFocus() || event.defaultPrevented) return;
    event.preventDefault();
    event.stopPropagation();
    this.neuModalFocusEscape.emit(event as KeyboardEvent);
  }

  focusInitial(): boolean {
    const initial = this.neuModalFocusInitial();
    if (initial === 'container') {
      this.host.focus({ preventScroll: true });
      return true;
    }
    if (initial !== 'first') {
      const target = this.host.querySelector<HTMLElement>(initial);
      if (target && this.isFocusable(target)) {
        target.focus({ preventScroll: true });
        return true;
      }
    }
    if (this.focusTrap?.focusFirst({ preventScroll: true })) return true;
    this.host.focus({ preventScroll: true });
    return true;
  }

  private isFocusable(element: HTMLElement): boolean {
    return (
      element.isConnected &&
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-disabled') !== 'true' &&
      element.tabIndex >= 0
    );
  }
}
