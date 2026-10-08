import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal, untracked } from '@angular/core';

/** @internal Shared resource and topmost-event ownership for full-page Neural overlays. */
@Injectable({ providedIn: 'root' })
export class InternalNeuOverlayStack {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly owners = signal<Array<{ readonly owner: object; readonly priority: number }>>([]);
  private previousHtmlOverflow = '';
  private previousBodyOverflow = '';

  activate(owner: object, priority = 1): () => void {
    const owners = untracked(this.owners);
    if (!this.browser || owners.some((entry) => entry.owner === owner)) return () => undefined;

    if (owners.length === 0) {
      this.previousHtmlOverflow = this.document.documentElement.style.overflow;
      this.previousBodyOverflow = this.document.body.style.overflow;
      this.document.documentElement.style.overflow = 'hidden';
      this.document.body.style.overflow = 'hidden';
    }
    this.owners.set([...owners, { owner, priority }]);

    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const owners = untracked(this.owners);
      let index = -1;
      for (let candidate = owners.length - 1; candidate >= 0; candidate -= 1) {
        if (owners[candidate]?.owner === owner) {
          index = candidate;
          break;
        }
      }
      if (index >= 0) {
        this.owners.set([...owners.slice(0, index), ...owners.slice(index + 1)]);
      }
      if (owners.length === 0 || (index >= 0 && owners.length === 1)) {
        this.document.documentElement.style.overflow = this.previousHtmlOverflow;
        this.document.body.style.overflow = this.previousBodyOverflow;
      }
      const onDeactivated = (owner as {
        onNeuOverlayDeactivated?: (nextOwner: object | undefined) => void;
      }).onNeuOverlayDeactivated;
      onDeactivated?.call(owner, untracked(() => this.topOwner()));
    };
  }

  isTop(owner: object): boolean {
    return this.topOwner() === owner;
  }

  private topOwner(): object | undefined {
    let top: { readonly owner: object; readonly priority: number } | undefined;
    for (const entry of this.owners()) {
      if (!top || entry.priority >= top.priority) top = entry;
    }
    return top?.owner;
  }
}
