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
  NeuSpinnerComponent,
  NeuSpinnerSeverity,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-spinner-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuSpinnerComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spinner-demo.component.html',
  styleUrl: './spinner-demo.component.scss',
})
export class SpinnerDemoComponent {
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
    severity: NeuSpinnerSeverity;
    color: string;
    strokeWidth: string;
    size: string;
    animationDuration: string;
  } = {
    severity: 'primary',
    color: '',
    strokeWidth: '4',
    size: '40px',
    animationDuration: '1s',
  };

  get configCode(): string {
    const attrs: string[] = [];
    if (this.cfg.severity !== 'primary') attrs.push(`severity="${this.cfg.severity}"`);
    if (this.cfg.color) attrs.push(`color="${this.cfg.color}"`);
    if (this.cfg.strokeWidth !== '4') attrs.push(`strokeWidth="${this.cfg.strokeWidth}"`);
    if (this.cfg.size !== '40px') attrs.push(`size="${this.cfg.size}"`);
    if (this.cfg.animationDuration !== '1s')
      attrs.push(`animationDuration="${this.cfg.animationDuration}"`);
    return attrs.length ? `<neu-spinner ${attrs.join(' ')} />` : '<neu-spinner />';
  }

  readonly usageCode = `import { NeuSpinnerComponent } from '@neural-ui/core';

@Component({
  imports: [NeuSpinnerComponent],
  template: \`
    <!-- Severity -->
    <neu-spinner severity="primary" />
    <neu-spinner severity="success" />
    <neu-spinner severity="warning" />
    <neu-spinner severity="danger" />
    <neu-spinner severity="info" />

    <!-- Tamaño y grosor personalizados -->
    <neu-spinner size="64px" strokeWidth="6" />

    <!-- Color libre -->
    <neu-spinner color="#ff6b35" />
  \`
})
export class MyComponent {}`;
}
