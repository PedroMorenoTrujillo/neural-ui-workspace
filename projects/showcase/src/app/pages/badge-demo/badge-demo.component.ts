import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-badge-demo',
  imports: [
    TranslocoPipe,NeuBadgeComponent, NeuCodeBlockComponent, NeuTabsComponent, NeuTabPanelComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge-demo.component.html',
  styleUrl: './badge-demo.component.scss',
})
export class BadgeDemoComponent {
  private readonly _t = inject(TranslocoService);
  private readonly _activeLang = toSignal(this._t.langChanges$, { initialValue: this._t.getActiveLang() });
  readonly demoTabs = computed<NeuTab[]>(() => {
    this._activeLang();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'config', label: this._t.translate('demo.common.tabs.config') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

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

  get configCode(): string {
    const attrs: string[] = [];
    if (this.cfg.variant !== 'default') attrs.push(`variant="${this.cfg.variant}"`);
    if (this.cfg.size !== 'md') attrs.push(`size="${this.cfg.size}"`);
    if (this.cfg.dot) attrs.push(`[dot]="true"`);
    if (this.cfg.outline) attrs.push(`[outline]="true"`);
    if (!this.cfg.pill) attrs.push(`[pill]="false"`);
    const attrsStr = attrs.length ? ' ' + attrs.join(' ') : '';
    return `<neu-badge${attrsStr}>${this.cfg.label}</neu-badge>`;
  }

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
