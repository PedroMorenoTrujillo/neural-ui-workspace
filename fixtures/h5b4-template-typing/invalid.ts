import { Component } from '@angular/core';
import {
  NeuOrganizationChartComponent,
  NeuOrganizationChartNodeDirective,
} from '@neural-ui/core/organization-chart';
import {
  NeuSpeedDialComponent,
  NeuSpeedDialItemDirective,
  NeuSpeedDialTriggerDirective,
} from '@neural-ui/core/speed-dial';
import { ORGANIZATION_NODES, SPEED_DIAL_ITEMS } from './shared';

@Component({
  selector: 'neu-h5b4-invalid-fixture',
  standalone: true,
  imports: [
    NeuSpeedDialComponent,
    NeuSpeedDialItemDirective,
    NeuSpeedDialTriggerDirective,
    NeuOrganizationChartComponent,
    NeuOrganizationChartNodeDirective,
  ],
  template: `
    <neu-speed-dial [items]="actions">
      <ng-template neuSpeedDialTrigger let-open="open">{{ open.missing }}</ng-template>
      <ng-template neuSpeedDialItem let-item>{{ item.missing }}</ng-template>
    </neu-speed-dial>
    <neu-organization-chart [nodes]="nodes">
      <ng-template [neuOrganizationChartNode]="nodes" let-node let-toggle="toggle">
        {{ node.data?.profile?.missing }}
        <button type="button" (click)="toggle(123)">Toggle</button>
      </ng-template>
    </neu-organization-chart>
  `,
})
export class InvalidH5B4TemplateFixtureComponent {
  readonly actions = SPEED_DIAL_ITEMS;
  readonly nodes = ORGANIZATION_NODES;
}
