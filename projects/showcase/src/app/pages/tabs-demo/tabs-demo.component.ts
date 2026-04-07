import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuIconComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-tabs-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    NeuIconComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs-demo.component.html',
  styleUrl: './tabs-demo.component.scss',
})
export class TabsDemoComponent {
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

  readonly basicTabs: NeuTab[] = [
    { id: 'tab1', label: 'General' },
    { id: 'tab2', label: 'Seguridad' },
    { id: 'tab3', label: 'Notificaciones' },
    { id: 'tab4', label: 'Facturación', badge: 'New' },
    { id: 'tab5', label: 'Avanzado', disabled: true },
  ];

  readonly flushTabs: NeuTab[] = [
    { id: 'ft1', label: 'Vista general' },
    { id: 'ft2', label: 'Actividad' },
    { id: 'ft3', label: 'Equipo' },
  ];

  cfg: {
    flush: boolean;
    badge: string;
    disabled: boolean;
  } = {
    flush: false,
    badge: '',
    disabled: false,
  };

  get cfgTabs(): NeuTab[] {
    return [
      { id: 'c1', label: 'General' },
      { id: 'c2', label: 'Seguridad', badge: this.cfg.badge || undefined },
      { id: 'c3', label: 'Avanzado', disabled: this.cfg.disabled },
    ];
  }

  get configCode(): string {
    const attrs: string[] = ['[tabs]="tabs"', 'tabParam="tab"'];
    if (this.cfg.flush) attrs.push('[flush]="true"');
    return `<neu-tabs ${attrs.join(' ')}>
  <neu-tab-panel tabId="tab1">Contenido de General</neu-tab-panel>
  <neu-tab-panel tabId="tab2">Contenido de Seguridad</neu-tab-panel>
</neu-tabs>`;
  }

  readonly usageCode = `import { NeuTabsComponent, NeuTabPanelComponent } from '@neural-ui/core';

@Component({
  imports: [NeuTabsComponent, NeuTabPanelComponent],
  template: \`
    <neu-tabs [tabs]="tabs" tabParam="tab">
      <neu-tab-panel tabId="preview">
        <!-- Contenido de Preview -->
      </neu-tab-panel>
      <neu-tab-panel tabId="api">
        <!-- Contenido de API -->
      </neu-tab-panel>
    </neu-tabs>
  \`
})
export class MyComponent {
  tabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'api', label: 'API', badge: 'New' },
    { id: 'disabled', label: 'Disabled', disabled: true },
  ];
}`;
}
