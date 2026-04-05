import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NeuBadgeComponent, NeuButtonComponent, NeuCardComponent } from '@neural-ui/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NeuButtonComponent, NeuBadgeComponent, NeuCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly components = [
    { name: 'Badge',   route: '/components/badge',   desc: 'Etiquetas de estado semánticas con 5 variantes', tag: 'componente' },
    { name: 'Button',  route: '/components/button',  desc: 'Botón con 4 variantes, 3 tamaños y estado loading', tag: 'componente' },
    { name: 'Card',    route: '/components/card',    desc: 'Superficie de contenido con header, body y footer', tag: 'componente' },
    { name: 'Input',   route: '/components/input',   desc: 'Campo de texto con floating label y validación', tag: 'componente' },
    { name: 'Select',  route: '/components/select',  desc: 'Dropdown personalizado con teclado y Forms', tag: 'componente' },
    { name: 'Sidebar', route: '/components/sidebar', desc: 'Panel lateral con estado sincronizado a la URL', tag: 'componente' },
    { name: 'Table',   route: '/components/table',   desc: 'Tabla con búsqueda, orden y paginación URL-driven', tag: '⭐ estrella' },
  ];
}
