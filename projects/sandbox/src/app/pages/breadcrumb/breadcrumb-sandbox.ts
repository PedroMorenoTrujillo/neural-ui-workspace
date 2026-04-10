import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuBreadcrumbComponent } from '@neural-ui/core';
import type { NeuBreadcrumbItem } from '@neural-ui/core';

@Component({
  selector: 'app-breadcrumb-sandbox',
  imports: [NeuBreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Breadcrumb</h1>
        <p class="sb-page__desc">NeuBreadcrumbComponent — navegación jerárquica, separator.</p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico</h2>
        <div class="sb-demo--column sb-demo">
          <neu-breadcrumb [items]="basic" />
        </div>
      </section>

      <!-- Ruta profunda -->
      <section class="sb-section">
        <h2 class="sb-section__title">Ruta profunda</h2>
        <div class="sb-demo--column sb-demo">
          <neu-breadcrumb [items]="deep" />
        </div>
      </section>

      <!-- Separadores personalizados -->
      <section class="sb-section">
        <h2 class="sb-section__title">Separadores personalizados</h2>
        <div class="sb-demo--column sb-demo">
          <neu-breadcrumb [items]="basic" separator=">" />
          <neu-breadcrumb [items]="basic" separator="•" />
          <neu-breadcrumb [items]="basic" separator="|" />
          <neu-breadcrumb [items]="basic" separator="→" />
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo">
          <div style="display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">Un solo ítem</span>
            <neu-breadcrumb [items]="[{ label: 'Inicio', route: '/' }]" />
          </div>
          <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">Último ítem sin href (activo)</span>
            <neu-breadcrumb [items]="withActive" />
          </div>
          <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">Etiqueta larga</span>
            <neu-breadcrumb [items]="longLabel" />
          </div>
        </div>
      </section>
    </div>
  `,
})
export class BreadcrumbSandboxComponent {
  readonly basic: NeuBreadcrumbItem[] = [
    { label: 'Inicio', route: '/' },
    { label: 'Usuarios', route: '/users' },
    { label: 'Perfil' },
  ];

  readonly deep: NeuBreadcrumbItem[] = [
    { label: 'Inicio', route: '/' },
    { label: 'Configuración', route: '/settings' },
    { label: 'Seguridad', route: '/settings/security' },
    { label: 'Autenticación', route: '/settings/security/auth' },
    { label: 'Tokens API' },
  ];

  readonly withActive: NeuBreadcrumbItem[] = [
    { label: 'Dashboard', route: '/' },
    { label: 'Productos', route: '/products' },
    { label: 'Producto #1234 (activo)' },
  ];

  readonly longLabel: NeuBreadcrumbItem[] = [
    { label: 'Inicio', route: '/' },
    { label: 'Categoría con nombre muy largo', route: '/cat' },
    { label: 'Subcategoría también larga', route: '/cat/sub' },
    { label: 'Artículo con título extenso' },
  ];
}
