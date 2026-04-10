import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface NeuBreadcrumbItem {
  /** Etiqueta visible / Visible label */
  label: string;
  /** Ruta interna (RouterLink) / Internal route (RouterLink) */
  route?: string | string[];
  /** URL externa / External URL */
  url?: string;
  /** Icono Lucide opcional / Optional Lucide icon */
  icon?: string;
}

/**
 * NeuralUI Breadcrumb Component
 *
 * Ruta de navegación jerárquica. El último elemento se muestra
 * como activo (sin enlace).
 *
 * Uso:
 *   <neu-breadcrumb [items]="breadcrumbs" />
 *
 *   items = [
 *     { label: 'Inicio', route: '/' },
 *     { label: 'Componentes', route: '/components' },
 *     { label: 'Breadcrumb' },
 *   ];
 */
@Component({
  selector: 'neu-breadcrumb',
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="neu-breadcrumb" aria-label="Breadcrumb">
      <ol class="neu-breadcrumb__list">
        @for (item of items(); track item.label; let last = $last) {
          <li class="neu-breadcrumb__item" [class.neu-breadcrumb__item--active]="last">
            @if (!last) {
              @if (item.route) {
                <a class="neu-breadcrumb__link" [routerLink]="item.route">{{ item.label }}</a>
              } @else if (item.url) {
                <a class="neu-breadcrumb__link" [href]="item.url" target="_blank" rel="noopener">{{
                  item.label
                }}</a>
              } @else {
                <span class="neu-breadcrumb__link">{{ item.label }}</span>
              }
              <span class="neu-breadcrumb__separator" aria-hidden="true">{{ separator() }}</span>
            } @else {
              <span class="neu-breadcrumb__current" aria-current="page">{{ item.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styleUrl: './neu-breadcrumb.component.scss',
})
export class NeuBreadcrumbComponent {
  /** Lista de ítems de navegación / Navigation item list */
  items = input<NeuBreadcrumbItem[]>([]);

  /** Separador personalizable / Customizable separator */
  separator = input<string>('/');
}
