import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
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
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

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

