import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuNavComponent } from '@neural-ui/core';
import type { NeuNavItem } from '@neural-ui/core';

@Component({
  selector: 'app-nav-sandbox',
  imports: [NeuNavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Nav</h1>
        <p class="sb-page__desc">
          NeuNavComponent — items, collapsed, collapsible, badges, children.
        </p>
      </div>

      <!-- Básico expandido -->
      <section class="sb-section">
        <h2 class="sb-section__title">Navegación básica</h2>
        <div class="sb-demo" style="align-items: flex-start">
          <div
            style="width: 240px; border: 1px solid var(--neu-border); border-radius: 8px; overflow: hidden"
          >
            <neu-nav
              [items]="basicItems"
              ariaLabel="Nav básico"
              (collapsedChange)="isCollapsed.set($event)"
            />
          </div>
          <span class="sb-value">collapsed: {{ isCollapsed() }}</span>
        </div>
      </section>

      <!-- Con badges y jerarquía -->
      <section class="sb-section">
        <h2 class="sb-section__title">Con badges y jerarquía (children)</h2>
        <div class="sb-demo" style="align-items: flex-start">
          <div
            style="width: 240px; border: 1px solid var(--neu-border); border-radius: 8px; overflow: hidden"
          >
            <neu-nav [items]="richItems" ariaLabel="Nav con badges" [collapsible]="false" />
          </div>
        </div>
      </section>

      <!-- Estado colapsado -->
      <section class="sb-section">
        <h2 class="sb-section__title">Colapsado por defecto</h2>
        <div class="sb-demo" style="align-items: flex-start">
          <div style="border: 1px solid var(--neu-border); border-radius: 8px; overflow: hidden">
            <neu-nav [items]="basicItems" [collapsed]="true" ariaLabel="Nav colapsado" />
          </div>
        </div>
      </section>

      <!-- No colapsable -->
      <section class="sb-section">
        <h2 class="sb-section__title">No colapsable</h2>
        <div class="sb-demo" style="align-items: flex-start">
          <div
            style="width: 240px; border: 1px solid var(--neu-border); border-radius: 8px; overflow: hidden"
          >
            <neu-nav [items]="basicItems" [collapsible]="false" ariaLabel="Nav no colapsable" />
          </div>
        </div>
      </section>
    </div>
  `,
})
export class NavSandboxComponent {
  readonly isCollapsed = signal(false);

  readonly basicItems: NeuNavItem[] = [
    { id: 'home', label: 'Inicio', icon: 'lucideHome', route: '/nav' },
    { id: 'users', label: 'Usuarios', icon: 'lucideUsers', route: '/nav' },
    { id: 'settings', label: 'Configuración', icon: 'lucideSettings', route: '/nav' },
    {
      id: 'docs',
      label: 'Documentación',
      icon: 'lucideFileText',
      href: 'https://example.com',
      disabled: false,
    },
  ];

  readonly richItems: NeuNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'lucideLayoutDashboard', route: '/nav' },
    {
      id: 'analytics',
      label: 'Analíticas',
      icon: 'lucideBarChart2',
      badge: '3',
      badgeVariant: 'info',
      children: [
        { id: 'overview', label: 'Resumen', icon: 'lucideActivity', route: '/nav' },
        { id: 'reports', label: 'Informes', icon: 'lucideFileText', route: '/nav' },
        {
          id: 'realtime',
          label: 'Tiempo real',
          icon: 'lucideZap',
          route: '/nav',
          badge: 'live',
          badgeVariant: 'success',
        },
      ],
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: 'lucideUsers',
      badge: '24',
      badgeVariant: 'warning',
      children: [
        { id: 'all-users', label: 'Todos', icon: 'lucideList', route: '/nav' },
        { id: 'admins', label: 'Administradores', icon: 'lucideShieldCheck', route: '/nav' },
      ],
    },
    { id: 'settings', label: 'Configuración', icon: 'lucideSettings', route: '/nav' },
    {
      id: 'disabled',
      label: 'Módulo bloqueado',
      icon: 'lucideLock',
      disabled: true,
      route: '/nav',
    },
  ];
}
