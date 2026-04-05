import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { distinctUntilChanged, fromEvent, map, startWith } from 'rxjs';
import {
  NeuBadgeComponent,
  NeuSidebarComponent,
  NeuUrlStateService,
} from '@neural-ui/core';

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  route: string;
  badge?: string;
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NeuSidebarComponent,
    NeuBadgeComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly urlState = inject(NeuUrlStateService);

  // ------------------------------------------------
  // Detectar si estamos en ≥400px → sidebar persistente
  // Por debajo de 400px → hamburguesa overlay
  // ------------------------------------------------
  readonly isDesktop = toSignal(
    fromEvent(window, 'resize').pipe(
      startWith(null),
      map(() => window.innerWidth >= 400),
      distinctUntilChanged(),
    ),
    { initialValue: window.innerWidth >= 400 },
  );

  // ------------------------------------------------
  // Navegación del showcase
  // ------------------------------------------------
  readonly navGroups: NavGroup[] = [
    {
      label: 'Primeros pasos',
      items: [{ label: 'Inicio', route: '/' }],
    },
    {
      label: 'Componentes',
      items: [
        { label: 'Badge',   route: '/components/badge' },
        { label: 'Button',  route: '/components/button' },
        { label: 'Card',    route: '/components/card' },
        { label: 'Input',   route: '/components/input' },
        { label: 'Select',  route: '/components/select' },
        { label: 'Sidebar', route: '/components/sidebar' },
        { label: 'Table',   route: '/components/table', badge: 'Star' },
      ],
    },
  ];

  openMenu(): void {
    // false = pushState, el usuario puede volver con el botón Atrás
    this.urlState.setParam('menu', 'open', false);
  }
}
