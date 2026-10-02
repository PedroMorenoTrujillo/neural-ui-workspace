import { isPlatformServer } from '@angular/common';
import { Component, inject, input, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import {
  NeuTableQueryControlsComponent,
  type TableQueryControls,
} from './neu-table-query-controls.component';

const serverControls = makeStateKey<boolean>('neu-table-query-controls-ssr');

/** SSR renders the optional controls; CSR does not require hydration providers. */
@Component({
  selector: 'neu-table-query-host',
  imports: [NeuTableQueryControlsComponent],
  template: `
    @if (hydrate) {
      @defer (on immediate; hydrate on immediate) {
        <neu-table-query-controls [controls]="controls()" />
      }
    } @else {
      @defer (on immediate) {
        <neu-table-query-controls [controls]="controls()" />
      }
    }
  `,
  styles: ':host { display: contents; }',
})
export class NeuTableQueryHostComponent {
  readonly controls = input<TableQueryControls>({});
  protected readonly hydrate: boolean;

  constructor() {
    const state = inject(TransferState);
    if (isPlatformServer(inject(PLATFORM_ID))) state.set(serverControls, true);
    this.hydrate = state.get(serverControls, false);
  }
}
