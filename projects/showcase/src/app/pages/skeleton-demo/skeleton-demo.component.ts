import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
  NeuSkeletonComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-skeleton-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    NeuSkeletonComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton-demo.component.html',
  styleUrl: './skeleton-demo.component.scss',
})
export class SkeletonDemoComponent {
  private readonly _t = inject(TranslocoService);
  private readonly _translations = toSignal(this._t.selectTranslation());
  readonly demoTabs = computed<NeuTab[]>(() => {
    this._translations();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

  readonly usageCode = `import { NeuSkeletonComponent } from '@neural-ui/core';

@Component({
  imports: [NeuSkeletonComponent],
  template: \`
    <!-- Texto -->
    <neu-skeleton variant="text" width="80%" />
    <neu-skeleton variant="text" width="60%" />

    <!-- Círculo (avatar) -->
    <neu-skeleton variant="circle" width="40px" height="40px" />

    <!-- Rectángulo (imagen/card) -->
    <neu-skeleton variant="rect" width="100%" height="180px" />

    <!-- Border radius personalizado -->
    <neu-skeleton width="120px" height="32px" borderRadius="16px" />
  \`
})
export class MyComponent {}`;
}
