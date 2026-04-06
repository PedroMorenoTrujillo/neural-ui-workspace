import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { distinctUntilChanged, fromEvent, map, startWith } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { NeuIconComponent, NeuSidebarComponent, NeuUrlStateService } from '@neural-ui/core';
import { NeuTranslationService } from './services/neu-translation.service';

interface NavItem {
  labelKey: string;
  route: string;
  badge?: string;
  isNew?: boolean;
}

interface NavGroup {
  labelKey: string;
  icon: string;
  items: NavItem[];
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NeuSidebarComponent,
    NeuIconComponent,
    TranslocoPipe,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly urlState = inject(NeuUrlStateService);
  readonly i18n    = inject(NeuTranslationService);

  readonly isDesktop = toSignal(
    fromEvent(window, 'resize').pipe(
      startWith(null),
      map(() => window.innerWidth >= 400),
      distinctUntilChanged(),
    ),
    { initialValue: window.innerWidth >= 400 },
  );

  readonly navGroups: NavGroup[] = [
    {
      labelKey: 'nav.gettingStarted',
      icon: 'lucideHome',
      items: [{ labelKey: 'nav.home', route: '/' }],
    },
    {
      labelKey: 'nav.form',
      icon: 'lucideFormInput',
      items: [
        { labelKey: 'comp.input',  route: '/components/input' },
        { labelKey: 'comp.select', route: '/components/select' },
        { labelKey: 'comp.button', route: '/components/button' },
      ],
    },
    {
      labelKey: 'nav.data',
      icon: 'lucideDatabase',
      items: [
        { labelKey: 'comp.table', route: '/components/table', badge: '⭐' },
        { labelKey: 'comp.badge', route: '/components/badge' },
        { labelKey: 'comp.card',  route: '/components/card' },
      ],
    },
    {
      labelKey: 'nav.navigation',
      icon: 'lucideLayoutTemplate',
      items: [
        { labelKey: 'comp.sidebar', route: '/components/sidebar' },
        { labelKey: 'comp.avatar',  route: '/components/avatar', isNew: true },
      ],
    },
    {
      labelKey: 'nav.charts',
      icon: 'lucideBarChart2',
      items: [
        { labelKey: 'comp.chart',     route: '/components/chart',     isNew: true },
        { labelKey: 'comp.statsCard', route: '/components/stats-card', isNew: true },
      ],
    },
    {
      labelKey: 'nav.overlays',
      icon: 'lucideLayers',
      items: [
        { labelKey: 'comp.modal',      route: '/components/modal',       isNew: true },
        { labelKey: 'comp.emptyState', route: '/components/empty-state', isNew: true },
      ],
    },
  ];

  openMenu(): void {
    this.urlState.setParam('menu', 'open', false);
  }

  toggleLang(): void {
    this.i18n.setLang(this.i18n.lang() === 'es' ? 'en' : 'es');
  }
}
