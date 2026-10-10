import { Component } from '@angular/core';
import {
  NeuSpeedDialComponent,
  NeuSpeedDialItemDirective,
  NeuSpeedDialTriggerDirective,
} from '@neural-ui/core/speed-dial';
import { SPEED_DIAL_ITEMS } from './shared';

@Component({
  selector: 'neu-h5b4-valid-fixture',
  standalone: true,
  imports: [
    NeuSpeedDialComponent,
    NeuSpeedDialItemDirective,
    NeuSpeedDialTriggerDirective,
  ],
  template: `
    <neu-speed-dial [items]="actions">
      <ng-template neuSpeedDialTrigger let-open="open">{{ open ? 'Open' : 'Closed' }}</ng-template>
      <ng-template neuSpeedDialItem let-item let-index="index" let-disabled="disabled">
        {{ item.label }} {{ index.toFixed() }} {{ disabled }}
      </ng-template>
    </neu-speed-dial>
  `,
})
export class ValidH5B4TemplateFixtureComponent {
  readonly actions = SPEED_DIAL_ITEMS;
}
