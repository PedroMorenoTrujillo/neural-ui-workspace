import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuStatsCardComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-stats-card-demo',
  templateUrl: './stats-card-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuStatsCardComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
})
export class StatsCardDemoComponent {
  private readonly _t = inject(TranslocoService);
  private readonly _translations = toSignal(this._t.selectTranslation());

  readonly demoTabs = computed<NeuTab[]>(() => {
    this._translations();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

  revenueData = [30, 55, 40, 80, 65, 90, 75, 110, 95, 120];
  usersData = [80, 70, 85, 60, 55, 65, 50, 45, 55, 40];

  readonly usageCode = `import { NeuStatsCardComponent } from '@neural-ui/core';

@Component({
  imports: [NeuStatsCardComponent],
  template: \`
    <neu-stats-card
      title="Ingresos"
      value="$48,295"
      change="+12.5%"
      trend="up"
      label="vs mes anterior"
      icon="lucideTrendingUp"
      [sparkData]="data"
    />
  \`
})
export class MyComponent {
  data = [30, 55, 40, 80, 65, 90, 75, 110, 95, 120];
}`;
}
