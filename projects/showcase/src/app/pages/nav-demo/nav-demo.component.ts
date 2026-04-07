import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuNavComponent,
  NeuNavItem,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-nav-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuNavComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    NeuCodeBlockComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav-demo.component.html',
  styleUrl: './nav-demo.component.scss',
})
export class NavDemoComponent {
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
    collapsible: boolean;
    collapsed: boolean;
  } = {
    collapsible: true,
    collapsed: false,
  };

  // Datos de demo — estructura típica de un dashboard con 3 niveles y enlaces externos
  readonly demoItems: NeuNavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'lucideLayoutDashboard',
      route: '/components/nav',
    },
    {
      id: 'analytics',
      label: 'Analíticas',
      icon: 'lucideBarChart2',
      children: [
        { id: 'overview', label: 'Resumen', icon: 'lucideActivity', route: '/components/chart' },
        {
          id: 'reports',
          label: 'Informes',
          icon: 'lucideFileText',
          children: [
            {
              id: 'report-monthly',
              label: 'Mensual',
              icon: 'lucideCalendar',
              route: '/components/stats-card',
            },
            {
              id: 'report-export',
              label: 'Exportar a Sheets',
              icon: 'lucideImage',
              href: 'https://sheets.google.com',
            },
          ],
        },
      ],
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: 'lucideUsers',
      children: [
        { id: 'user-list', label: 'Lista', icon: 'lucideList', route: '/components/table' },
        { id: 'user-avatar', label: 'Avatares', icon: 'lucideUser', route: '/components/avatar' },
        {
          id: 'user-docs',
          label: 'Documentación',
          icon: 'lucideFileText',
          href: 'https://angular.dev/guide/components',
        },
      ],
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: 'lucideSettings',
      route: '/components/input',
    },
    {
      id: 'github',
      label: 'GitHub',
      icon: 'lucideGithub',
      href: 'https://github.com',
    },
    {
      id: 'help',
      label: 'Ayuda (desactivado)',
      icon: 'lucideHelpCircle',
      route: '/components/feedback',
      disabled: true,
    },
  ];

  get configCode(): string {
    const attrs: string[] = ['[items]="navItems"'];
    if (!this.cfg.collapsible) attrs.push('[collapsible]="false"');
    if (this.cfg.collapsed) attrs.push('[collapsed]="true"');
    return `<neu-nav ${attrs.join(' ')}>\n  <span neu-nav-brand>Mi App</span>\n  <div neu-nav-footer>v1.0.0</div>\n</neu-nav>`;
  }

  readonly usageCode = `import { NeuNavComponent, NeuNavItem } from '@neural-ui/core';

@Component({
  imports: [NeuNavComponent],
  template: \`
    <div style="display: flex; height: 100vh">
      <neu-nav [items]="navItems" [collapsible]="true">
        <span neu-nav-brand>Mi App</span>
        <div neu-nav-footer>usuario@email.com</div>
      </neu-nav>
      <main><!-- contenido --></main>
    </div>
  \`
})
export class AppComponent {
  readonly navItems: NeuNavItem[] = [
    // Nivel 1 — enlace interno
    { id: 'home', label: 'Inicio', icon: 'lucideHome', route: '/' },

    // Nivel 1 — enlace externo (nueva pestaña)
    { id: 'github', label: 'GitHub', icon: 'lucideGithub', href: 'https://github.com' },

    // Nivel 1 → Nivel 2 con subítem de nivel 3
    {
      id: 'analytics',
      label: 'Analíticas',
      icon: 'lucideBarChart2',
      children: [
        // Nivel 2 — enlace interno
        { id: 'overview', label: 'Resumen', icon: 'lucideActivity', route: '/analytics' },
        // Nivel 2 → Nivel 3
        {
          id: 'reports',
          label: 'Informes',
          icon: 'lucideFileText',
          children: [
            // Nivel 3 — enlace interno
            { id: 'monthly', label: 'Mensual', icon: 'lucideCalendar', route: '/analytics/monthly' },
            // Nivel 3 — enlace externo
            { id: 'export', label: 'Exportar', icon: 'lucideDownload', href: 'https://sheets.google.com' },
          ],
        },
      ],
    },

    // Nivel 1 — con badge y deshabilitado
    { id: 'settings', label: 'Ajustes', icon: 'lucideSettings', route: '/settings',
      badge: 'New', badgeVariant: 'success', disabled: false },
  ];
}`;
}
