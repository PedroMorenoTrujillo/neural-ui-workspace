import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
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
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'api', label: 'API' },
  ];

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
