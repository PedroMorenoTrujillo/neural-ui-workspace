import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-badge-demo',
  imports: [NeuBadgeComponent, NeuCodeBlockComponent, NeuTabsComponent, NeuTabPanelComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge-demo.component.html',
  styleUrl: './badge-demo.component.scss',
})
export class BadgeDemoComponent {
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

  cfg: {
    variant: 'default' | 'success' | 'info' | 'warning' | 'danger';
    size: 'sm' | 'md';
    outline: boolean;
    dot: boolean;
    pill: boolean;
    label: string;
  } = {
    variant: 'default',
    size: 'md',
    outline: false,
    dot: false,
    pill: true,
    label: 'Estado',
  };

  readonly usageCode = `import { NeuBadgeComponent } from '@neural-ui/core';

@Component({
  imports: [NeuBadgeComponent],
  template: \`
    <neu-badge variant="success">Activo</neu-badge>
    <neu-badge variant="danger" [dot]="true">Offline</neu-badge>
    <neu-badge variant="warning" [outline]="true" size="sm">Aviso</neu-badge>
  \`
})
export class MyComponent {}\``;
}
