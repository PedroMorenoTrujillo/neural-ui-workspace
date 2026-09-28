import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NEU_ICON_RESOLVER, type NeuIconKey } from '@neural-ui/core/foundation';

/** @internal Application-rendered icon or small Core-owned affordance fallback. */
@Component({
  selector: 'neu-icon-outlet',
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.width]': 'resolvedSize()',
    '[style.height]': 'resolvedSize()',
    '[style.display]': "visible() ? null : 'none'",
    '[attr.role]': "label() && visible() ? 'img' : null",
    '[attr.aria-label]': 'visible() ? label() : null',
  },
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; flex: none; line-height: 1; vertical-align: middle; }
    svg { display: block; width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
    span { display: inline-block; font: inherit; line-height: 1; text-align: center; white-space: nowrap; }
  `],
  template: `
    @if (rendered(); as render) {
      <ng-container *ngComponentOutlet="render.component; inputs: render.inputs" />
    } @else if (path(); as shape) {
      <svg viewBox="0 0 24 24" aria-hidden="true" [attr.stroke-width]="strokeWidth()">
        <path [attr.d]="shape" />
      </svg>
    } @else if (text(); as glyph) {
      <span aria-hidden="true">{{ glyph }}</span>
    }
  `,
})
export class InternalNeuIconOutletComponent {
  readonly icon = input.required<NeuIconKey>();
  readonly size = input<string | number>('1em');
  readonly strokeWidth = input<number>(2);
  readonly label = input<string | null>(null);
  readonly fallbackPath = input<string | null>(null);
  readonly fallbackText = input<string | null>(null);

  private readonly resolver = inject(NEU_ICON_RESOLVER, { optional: true });
  protected resolvedSize(): string {
    const size = this.size();
    return typeof size === 'number' ? `${size}px` : size;
  }
  protected readonly rendered = computed(() =>
    this.resolver?.({
      key: this.icon(),
      size: this.size(),
      strokeWidth: this.strokeWidth(),
      label: this.label(),
    }) ?? null,
  );

  // The calling component owns only the affordances it actually uses.
  protected path(): string | null {
    return this.rendered() ? null : this.fallbackPath();
  }

  protected text(): string | null {
    return this.rendered() || this.path() ? null : this.fallbackText();
  }

  protected visible(): boolean {
    return !!(this.rendered() || this.path() || this.text());
  }
}
