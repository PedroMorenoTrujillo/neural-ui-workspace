import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';

const TABBABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

/**
 * Keeps sequential keyboard focus inside the host while enabled.
 *
 * The directive owns only Tab and Shift+Tab containment. It deliberately does
 * not move focus when enabled, restore focus when disabled, or add ARIA roles;
 * those policies belong to the dialog, menu, or overlay that uses the trap.
 */
@Directive({
  selector: '[neuFocusTrap]',
  host: {
    '(keydown)': 'onKeydown($event)',
    '(focusin)': 'onFocusin($event)',
  },
})
export class NeuFocusTrapDirective {
  /** Enables or temporarily disables focus containment. */
  readonly neuFocusTrap = input(true, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private lastFocusedInside: HTMLElement | null = null;
  private removeDocumentKeydownListener: (() => void) | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.removeDocumentKeydownListener?.());
  }

  /** Moves focus to the first currently eligible descendant. */
  focusFirst(options?: FocusOptions): boolean {
    return this.focusBoundary('first', options);
  }

  /** Moves focus to the last currently eligible descendant. */
  focusLast(options?: FocusOptions): boolean {
    return this.focusBoundary('last', options);
  }

  /** @internal */
  protected onFocusin(event: FocusEvent): void {
    if (!(event.target instanceof HTMLElement) || !this.host.contains(event.target)) return;

    this.lastFocusedInside = event.target;
    this.ensureRemovedFocusRecovery();
  }

  /** @internal */
  protected onKeydown(event: KeyboardEvent): void {
    if (
      !this.neuFocusTrap() ||
      event.defaultPrevented ||
      event.key !== 'Tab' ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    const tabbable = this.tabbableElements();
    if (tabbable.length === 0) {
      event.preventDefault();
      this.host.focus({ preventScroll: true });
      return;
    }

    const activeElement = this.document.activeElement;
    const activeIndex = tabbable.indexOf(activeElement as HTMLElement);
    const atStart = activeIndex <= 0;
    const atEnd = activeIndex === -1 || activeIndex === tabbable.length - 1;

    if (event.shiftKey ? atStart : atEnd) {
      event.preventDefault();
      const target = event.shiftKey ? tabbable.at(-1) : tabbable[0];
      target?.focus({ preventScroll: true });
    }
  }

  private ensureRemovedFocusRecovery(): void {
    if (this.removeDocumentKeydownListener) return;

    const listener = (event: KeyboardEvent) => {
      if (
        this.lastFocusedInside?.isConnected === false &&
        !this.host.contains(this.document.activeElement)
      ) {
        this.onKeydown(event);
      }
    };

    this.document.addEventListener('keydown', listener, true);
    this.removeDocumentKeydownListener = () => {
      this.document.removeEventListener('keydown', listener, true);
      this.removeDocumentKeydownListener = null;
    };
  }

  private focusBoundary(boundary: 'first' | 'last', options?: FocusOptions): boolean {
    if (!this.neuFocusTrap()) return false;

    const tabbable = this.tabbableElements();
    const target = boundary === 'first' ? tabbable[0] : tabbable.at(-1);
    target?.focus(options);
    return !!target;
  }

  private tabbableElements(): HTMLElement[] {
    return Array.from(this.host.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR))
      .map((element, domIndex) => ({ element, domIndex, tabIndex: element.tabIndex }))
      .filter(({ element, tabIndex }) => tabIndex >= 0 && this.isEligible(element))
      .sort((left, right) => {
        const leftPositive = left.tabIndex > 0;
        const rightPositive = right.tabIndex > 0;

        if (leftPositive && rightPositive && left.tabIndex !== right.tabIndex) {
          return left.tabIndex - right.tabIndex;
        }
        if (leftPositive !== rightPositive) return leftPositive ? -1 : 1;
        return left.domIndex - right.domIndex;
      })
      .map(({ element }) => element);
  }

  private isEligible(element: HTMLElement): boolean {
    if (
      element.hasAttribute('disabled') ||
      element.getAttribute('aria-disabled') === 'true' ||
      this.isDisabledByFieldset(element)
    ) {
      return false;
    }

    for (let current: HTMLElement | null = element; current; current = current.parentElement) {
      if (
        current.hidden ||
        current.hasAttribute('inert') ||
        current.getAttribute('aria-hidden') === 'true'
      ) {
        return false;
      }

      const style = this.document.defaultView?.getComputedStyle(current);
      if (
        style?.display === 'none' ||
        style?.visibility === 'hidden' ||
        style?.visibility === 'collapse'
      ) {
        return false;
      }

      if (current.tagName === 'DETAILS' && !current.hasAttribute('open')) {
        const summary = Array.from(current.children).find((child) => child.tagName === 'SUMMARY');
        if (!summary?.contains(element)) return false;
      }

      if (current === this.host) break;
    }

    return true;
  }

  private isDisabledByFieldset(element: HTMLElement): boolean {
    for (let current = element.parentElement; current; current = current.parentElement) {
      if (current.tagName === 'FIELDSET' && current.hasAttribute('disabled')) {
        const firstLegend = Array.from(current.children).find(
          (child) => child.tagName === 'LEGEND',
        );
        if (!firstLegend?.contains(element)) return true;
      }
    }
    return false;
  }
}
