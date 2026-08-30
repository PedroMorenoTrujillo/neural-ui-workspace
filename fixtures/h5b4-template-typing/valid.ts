import { Component } from '@angular/core';
import {
  NeuOrganizationChartComponent,
  NeuOrganizationChartNodeDirective,
  NeuOrganizationChartSelectionIndicatorDirective,
  NeuOrganizationChartToggleDirective,
  NeuOrganizationChartToggleIconDirective,
} from '@neural-ui/core/organization-chart';
import {
  NeuSpeedDialComponent,
  NeuSpeedDialItemDirective,
  NeuSpeedDialTriggerDirective,
} from '@neural-ui/core/speed-dial';
import { ORGANIZATION_NODES, SPEED_DIAL_ITEMS } from './shared';

@Component({
  selector: 'neu-h5b4-valid-fixture',
  standalone: true,
  imports: [
    NeuSpeedDialComponent,
    NeuSpeedDialItemDirective,
    NeuSpeedDialTriggerDirective,
    NeuOrganizationChartComponent,
    NeuOrganizationChartNodeDirective,
    NeuOrganizationChartSelectionIndicatorDirective,
    NeuOrganizationChartToggleDirective,
    NeuOrganizationChartToggleIconDirective,
  ],
  template: `
    <neu-speed-dial [items]="actions">
      <ng-template neuSpeedDialTrigger let-open="open">{{ open ? 'Open' : 'Closed' }}</ng-template>
      <ng-template neuSpeedDialItem let-item let-index="index" let-disabled="disabled">
        {{ item.label }} {{ index.toFixed() }} {{ disabled }}
      </ng-template>
    </neu-speed-dial>
    <neu-organization-chart [nodes]="nodes" selectionMode="checkbox" [collapsible]="true">
      <ng-template [neuOrganizationChartNode]="nodes" let-node let-path="path" let-select="select">
        {{ node.data?.profile?.name }} {{ path[0]?.toFixed() }}
        <button type="button" (click)="select($event)">Select</button>
      </ng-template>
      <ng-template [neuOrganizationChartToggleIcon]="nodes" let-expanded="expanded">
        {{ expanded }}
      </ng-template>
      <ng-template [neuOrganizationChartToggle]="nodes" let-toggle="toggle">
        <button type="button" (click)="toggle($event)">Toggle</button>
      </ng-template>
      <ng-template [neuOrganizationChartSelectionIndicator]="nodes" let-partial="partialSelected">
        {{ partial }}
      </ng-template>
    </neu-organization-chart>
  `,
})
export class ValidH5B4TemplateFixtureComponent {
  readonly actions = SPEED_DIAL_ITEMS;
  readonly nodes = ORGANIZATION_NODES;
}
