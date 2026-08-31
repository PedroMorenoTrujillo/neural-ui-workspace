import { ChangeDetectionStrategy, Component, effect, input, untracked } from '@angular/core';
import type { InternalNeuTableOptionalFeatureHost } from './neu-table-optional-features.types';

/** @internal Deterministic failure terminus for the private deferred Table feature chunk. */
@Component({
  selector: 'neu-table-optional-feature-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<span class="sr-only" role="alert">Table feature unavailable</span>`,
})
export class NeuTableOptionalFeatureErrorComponent {
  readonly host = input.required<InternalNeuTableOptionalFeatureHost<Record<string, unknown>>>();
  readonly kind = input.required<'filter' | 'editor'>();
  private _reported = false;

  constructor() {
    effect(() => {
      const host = this.host();
      const kind = this.kind();
      untracked(() => {
        if (this._reported) return;
        this._reported = true;
        host._optionalFeatureLoadFailed(
          kind,
          new Error(`Neural Table ${kind} feature chunk failed to load.`),
        );
      });
    });
  }
}
