import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

/** @internal Shared resource and topmost-event ownership for full-page Neural overlays. */
@Injectable({ providedIn: 'root' })
export class InternalNeuOverlayStack {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly owners: Array<{ readonly owner: object; readonly priority: number }> = [];
  private previousHtmlOverflow = '';
  private previousBodyOverflow = '';

  activate(owner: object, priority = 1): () => void {
    if (!this.browser || this.owners.some((entry) => entry.owner === owner)) return () => undefined;

    if (this.owners.length === 0) {
      this.previousHtmlOverflow = this.document.documentElement.style.overflow;
      this.previousBodyOverflow = this.document.body.style.overflow;
      this.document.documentElement.style.overflow = 'hidden';
      this.document.body.style.overflow = 'hidden';
    }
    this.owners.push({ owner, priority });

    let active = true;
    return () => {
      if (!active) return;
      active = false;
      let index = -1;
      for (let candidate = this.owners.length - 1; candidate >= 0; candidate -= 1) {
        if (this.owners[candidate]?.owner === owner) {
          index = candidate;
          break;
        }
      }
      if (index >= 0) this.owners.splice(index, 1);
      if (this.owners.length === 0) {
        this.document.documentElement.style.overflow = this.previousHtmlOverflow;
        this.document.body.style.overflow = this.previousBodyOverflow;
      }
    };
  }

  isTop(owner: object): boolean {
    let top: { readonly owner: object; readonly priority: number } | undefined;
    for (const entry of this.owners) {
      if (!top || entry.priority >= top.priority) top = entry;
    }
    return top?.owner === owner;
  }
}
