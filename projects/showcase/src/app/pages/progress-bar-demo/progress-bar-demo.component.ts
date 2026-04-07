import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
    TranslocoPipe,
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
  private readonly _t = inject(TranslocoService);
  private readonly _translations = toSignal(this._t.selectTranslation());
  readonly demoTabs = computed<NeuTab[]>(() => {
    this._translations();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'config', label: this._t.translate('demo.common.tabs.config') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

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
