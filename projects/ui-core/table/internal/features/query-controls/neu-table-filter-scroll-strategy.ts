import type { OverlayRef, ScrollStrategy } from '@angular/cdk/overlay';

/** A filter is anchored to its header, rather than following a moving table/page. */
export class TableFilterScrollStrategy implements ScrollStrategy {
  private overlay: OverlayRef | null = null;
  private listening = false;
  private viewportWidth = 0;

  attach(overlay: OverlayRef): void { this.overlay = overlay; }

  enable(): void {
    if (this.listening || !this.overlay) return;
    const document = this.overlay.overlayElement.ownerDocument;
    this.viewportWidth = this.widthOf(document);
    document.addEventListener('scroll', this.onScroll, true);
    document.addEventListener('wheel', this.onOutsideGesture, { capture: true, passive: true });
    document.addEventListener('touchmove', this.onOutsideGesture, { capture: true, passive: true });
    document.defaultView?.addEventListener('resize', this.onResize);
    this.listening = true;
  }

  disable(): void {
    if (!this.listening || !this.overlay) return;
    const document = this.overlay.overlayElement.ownerDocument;
    document.removeEventListener('scroll', this.onScroll, true);
    document.removeEventListener('wheel', this.onOutsideGesture, true);
    document.removeEventListener('touchmove', this.onOutsideGesture, true);
    document.defaultView?.removeEventListener('resize', this.onResize);
    this.listening = false;
  }

  detach(): void { this.disable(); this.overlay = null; }

  private readonly onScroll = (event: Event): void => {
    // A nested Select renders in a sibling CDK pane. Its options and the filter
    // itself must remain scrollable without dismissing the owning editor.
    const container = this.overlay?.overlayElement.closest('.cdk-overlay-container');
    const target = event.target;
    if ((target as Element | null)?.closest?.('.cdk-overlay-pane')) return;
    const document = this.overlay?.overlayElement.ownerDocument;
    const active = document?.activeElement;
    // Mobile keyboards can pan the document after focusing an editor. External
    // wheel/touch gestures still dismiss immediately; native table scrolling
    // remains a real anchor movement and is never ignored.
    const rootScroll = target === document || target === document?.documentElement || target === document?.body;
    if (rootScroll && active && container?.contains(active) && active.matches('input,textarea,[contenteditable="true"]')) return;
    this.close();
  };

  private readonly onOutsideGesture = (event: Event): void => {
    if (!(event.target as Element | null)?.closest?.('.cdk-overlay-pane')) this.close();
  };

  private widthOf(document: Document): number {
    return document.defaultView?.visualViewport?.width ??
      (document.documentElement.clientWidth || document.defaultView?.innerWidth || 0);
  }

  private readonly onResize = (): void => {
    const document = this.overlay?.overlayElement.ownerDocument;
    const width = document ? this.widthOf(document) : this.viewportWidth;
    // Height-only changes include the on-screen keyboard. Keep typing possible.
    if (width !== this.viewportWidth) this.close();
  };

  private readonly close = (): void => {
    this.disable();
    if (this.overlay?.hasAttached()) this.overlay.detach();
  };
}
