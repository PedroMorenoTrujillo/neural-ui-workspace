import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuEmptyStateComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-empty-state-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuEmptyStateComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state-demo.component.html',
  styleUrl: './empty-state-demo.component.scss',
})
export class EmptyStateDemoComponent {
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

  // Configurador
  cfgIcon = signal('lucideInbox');
  cfgTitle = signal('Sin notificaciones');
  cfgDescription = signal('Cuando recibas notificaciones aparecerán aquí.');
  cfgActionLabel = signal('Actualizar');

  readonly iconOptions = [
    'lucideInbox',
    'lucideSearch',
    'lucideFileX',
    'lucidePackageOpen',
    'lucideAlertCircle',
    'lucideWifi',
    'lucideFolder',
  ];

  get configCode(): string {
    const action = this.cfgActionLabel() ? `\n  actionLabel="${this.cfgActionLabel()}"` : '';
    return `<neu-empty-state
  icon="${this.cfgIcon()}"
  title="${this.cfgTitle()}"
  description="${this.cfgDescription()}"${action}
/>`;
  }

  readonly usageCode = `import { NeuEmptyStateComponent } from '@neural-ui/core';

@Component({
  imports: [NeuEmptyStateComponent],
  template: \`
    <!-- Estado vacío básico -->
    <neu-empty-state
      icon="lucideInbox"
      title="Sin notificaciones"
      description="Cuando recibas notificaciones aparecerán aquí."
    />

    <!-- Con CTA -->
    <neu-empty-state
      icon="lucideSearch"
      title="Sin resultados"
      description="No encontramos coincidencias para tu búsqueda."
      actionLabel="Limpiar filtros"
      (action)="clearSearch()"
    />
  \`,
})
export class MyComponent {}`;
}
