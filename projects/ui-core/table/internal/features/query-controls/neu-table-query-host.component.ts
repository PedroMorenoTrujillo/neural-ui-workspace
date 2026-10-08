import { isPlatformServer } from '@angular/common';
import { Component, inject, input, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { NeuTableCheckboxComponent } from '../selection/neu-table-checkbox.component';
import {
  NeuTableQueryControlsComponent,
  type TableQueryControls,
} from './neu-table-query-controls.component';

const serverControls = makeStateKey<boolean>('neu-table-query-controls-ssr');

export interface TableSelectionControls {
  readonly checked: boolean;
  readonly indeterminate: boolean;
  readonly disabled: boolean;
  readonly ariaLabel: string;
  readonly activate: (event: MouseEvent) => void;
  readonly enter: (event: Event) => void;
}

/** SSR renders the optional controls; CSR does not require hydration providers. */
@Component({
  selector: 'neu-table-query-host',
  imports: [NeuTableQueryControlsComponent, NeuTableCheckboxComponent],
  template: `
    @if (controls().selection; as selection) {
      @if (hydrate) {
        @defer (on immediate; hydrate on immediate) {
          <neu-table-checkbox [controls]="selection"
            (activate)="selection.activate($event)" (keydown.enter)="selection.enter($event)" />
        }
      } @else {
        @defer (on immediate) {
          <neu-table-checkbox [controls]="selection"
            (activate)="selection.activate($event)" (keydown.enter)="selection.enter($event)" />
        }
      }
    } @else if (hydrate) {
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
  readonly controls = input<TableQueryControls & { readonly selection?: TableSelectionControls }>({});
  protected readonly hydrate: boolean;

  constructor() {
    const state = inject(TransferState);
    if (isPlatformServer(inject(PLATFORM_ID))) state.set(serverControls, true);
    this.hydrate = state.get(serverControls, false);
  }
}
