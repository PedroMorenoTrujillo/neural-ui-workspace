import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuProgressBarComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-progress-bar-demo',
  imports: [
    NeuBadgeComponent,
    NeuProgressBarComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-bar-demo.component.html',
  styleUrl: './progress-bar-demo.component.scss',
})
export class ProgressBarDemoComponent {
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

  cfg: {
    value: number;
    variant: 'primary' | 'success' | 'warning' | 'danger';
    size: 'sm' | 'md' | 'lg';
    label: string;
    showValue: boolean;
    indeterminate: boolean;
  } = {
    value: 65,
    variant: 'primary',
    size: 'md',
    label: 'Cargando...',
    showValue: true,
    indeterminate: false,
  };

  get configCode(): string {
    const attrs: string[] = [`[value]="${this.cfg.value}"`];
    if (this.cfg.variant !== 'primary') attrs.push(`variant="${this.cfg.variant}"`);
    if (this.cfg.size !== 'md') attrs.push(`size="${this.cfg.size}"`);
    if (this.cfg.label) attrs.push(`label="${this.cfg.label}"`);
    if (!this.cfg.showValue) attrs.push(`[showValue]="false"`);
    if (this.cfg.indeterminate) attrs.push(`[indeterminate]="true"`);
    return `<neu-progress-bar ${attrs.join(' ')} />`;
  }

  readonly usageCode = `import { NeuProgressBarComponent } from '@neural-ui/core';

@Component({
  imports: [NeuProgressBarComponent],
  template: \`
    <neu-progress-bar [value]="uploadPct" label="Subiendo archivo" [showValue]="true" />
    <neu-progress-bar variant="success" [value]="100" label="Completado" />
    <neu-progress-bar [indeterminate]="true" label="Procesando..." />
  \`
})
export class MyComponent {
  uploadPct = 65;
}`;
}
