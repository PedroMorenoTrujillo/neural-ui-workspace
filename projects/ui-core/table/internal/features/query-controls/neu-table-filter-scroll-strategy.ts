import type { OverlayRef, ScrollStrategy } from '@angular/cdk/overlay';

/** A filter is anchored to its header, rather than following a moving table/page. */
export class TableFilterScrollStrategy implements ScrollStrategy {
  private overlay: OverlayRef | null = null;
  private listening = false;

  attach(overlay: OverlayRef): void { this.overlay = overlay; }

  enable(): void {
    if (this.listening || !this.overlay) return;
    const document = this.overlay.overlayElement.ownerDocument;
    document.addEventListener('scroll', this.onScroll, true);
    document.defaultView?.addEventListener('resize', this.close);
    this.listening = true;
  }

  disable(): void {
    if (!this.listening || !this.overlay) return;
    const document = this.overlay.overlayElement.ownerDocument;
    document.removeEventListener('scroll', this.onScroll, true);
    document.defaultView?.removeEventListener('resize', this.close);
    this.listening = false;
  }

  detach(): void { this.disable(); this.overlay = null; }

  private readonly onScroll = (event: Event): void => {
    // A nested Select renders in a sibling CDK pane. Its options and the filter
    // itself must remain scrollable without dismissing the owning editor.
    const container = this.overlay?.overlayElement.closest('.cdk-overlay-container');
    const target = event.target;
    if (target && container?.contains(target as Node)) return;
    this.close();
  };

  private readonly close = (): void => {
    this.disable();
    if (this.overlay?.hasAttached()) this.overlay.detach();
  };
}
