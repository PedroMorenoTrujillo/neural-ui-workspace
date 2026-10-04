import { isPlatformServer } from '@angular/common';
import { Component, inject, input, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { NeuCheckboxComponent } from '@neural-ui/core/checkbox';

const serverCheckbox = makeStateKey<boolean>('neu-table-checkbox-ssr');

/** Selection is a proposal, not an editable local model. The renderer handles activation. */
@Component({
  selector: 'neu-table-checkbox',
  imports: [NeuCheckboxComponent],
  template: `
    @if (hydrate) {
      @defer (on immediate; hydrate on immediate) {
        <neu-checkbox [checked]="checked()" [indeterminate]="indeterminate()"
          [disabled]="disabled()" [ariaLabel]="ariaLabel()" />
      }
    } @else {
      @defer (on immediate) {
        <neu-checkbox [checked]="checked()" [indeterminate]="indeterminate()"
          [disabled]="disabled()" [ariaLabel]="ariaLabel()" />
      }
    }
  `,
  styles: ':host { display: inline-flex; vertical-align: middle; }',
})
export class NeuTableCheckboxComponent {
  readonly checked = input(false);
  readonly indeterminate = input(false);
  readonly disabled = input(false);
  readonly ariaLabel = input.required<string>();
  protected readonly hydrate: boolean;

  constructor() {
    const state = inject(TransferState);
    if (isPlatformServer(inject(PLATFORM_ID))) state.set(serverCheckbox, true);
    this.hydrate = state.get(serverCheckbox, false);
  }
}
