import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { distinctUntilChanged, filter, fromEvent, map, startWith } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  NeuIconComponent,
  NeuSidebarComponent,
  NeuToastContainerComponent,
  NeuUrlStateService,
} from '@neural-ui/core';
import { NeuTranslationService } from './services/neu-translation.service';

interface NavItem {
  labelKey: string;
  route: string;
  icon?: string;
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
    NeuToastContainerComponent,
    TranslocoPipe,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly urlState = inject(NeuUrlStateService);
  readonly i18n = inject(NeuTranslationService);
  private readonly router = inject(Router);

  // ---- Dark Mode ----
  readonly isDark = signal(this._initDark());

  constructor() {
    effect(() => {
      const theme = this.isDark() ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('neu-theme', theme);
    });
  }

  private _initDark(): boolean {
    const saved = localStorage.getItem('neu-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggleTheme(): void {
    this.isDark.update((v) => !v);
  }

  // ---- Grupos colapsables de navegación ----
  readonly collapsedGroups = signal<Set<string>>(new Set());

  toggleGroup(key: string): void {
    this.collapsedGroups.update((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  isGroupCollapsed(key: string): boolean {
    return this.collapsedGroups().has(key);
  }

  readonly isDesktop = toSignal(
    fromEvent(window, 'resize').pipe(
      startWith(null),
      map(() => window.innerWidth >= 400),
      distinctUntilChanged(),
    ),
    { initialValue: window.innerWidth >= 400 },
  );

  /** True cuando la ruta activa es una página de componente (con sidebar) */
  readonly showSidebar = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.startsWith('/components')),
    ),
    { initialValue: window.location.pathname.startsWith('/components') },
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
        { labelKey: 'comp.input', route: '/components/input', icon: 'lucideType' },
        { labelKey: 'comp.select', route: '/components/select', icon: 'lucideList' },
        {
          labelKey: 'comp.multiselect',
          route: '/components/multiselect',
          icon: 'lucideListChecks',
          isNew: true,
        },
        {
          labelKey: 'comp.dateInput',
          route: '/components/date-input',
          icon: 'lucideCalendar',
          isNew: true,
        },
        { labelKey: 'comp.textarea', route: '/components/textarea', icon: 'lucideFileText' },
        { labelKey: 'comp.switch', route: '/components/switch', icon: 'lucideToggleLeft' },
        { labelKey: 'comp.checkbox', route: '/components/checkbox', icon: 'lucideSquareCheck' },
        { labelKey: 'comp.radio', route: '/components/radio', icon: 'lucideCircleDot' },
      ],
    },
    {
      labelKey: 'nav.actions',
      icon: 'lucideMousePointerClick',
      items: [
        { labelKey: 'comp.button', route: '/components/button', icon: 'lucidePlaySquare' },
        {
          labelKey: 'comp.splitButton',
          route: '/components/split-button',
          icon: 'lucideChevronDown',
          isNew: true,
        },
        {
          labelKey: 'comp.toggleButton',
          route: '/components/toggle-button',
          icon: 'lucideLayoutGrid',
          isNew: true,
        },
      ],
    },
    {
      labelKey: 'nav.data',
      icon: 'lucideDatabase',
      items: [
        { labelKey: 'comp.table', route: '/components/table', icon: 'lucideTable2', badge: '⭐' },
        { labelKey: 'comp.badge', route: '/components/badge', icon: 'lucideTag' },
        { labelKey: 'comp.card', route: '/components/card', icon: 'lucideLayout' },
      ],
    },
    {
      labelKey: 'nav.navigation',
      icon: 'lucideLayoutTemplate',
      items: [
        { labelKey: 'comp.sidebar', route: '/components/sidebar', icon: 'lucidePanelLeft' },
        {
          labelKey: 'comp.nav',
          route: '/components/nav',
          icon: 'lucideLayoutDashboard',
          isNew: true,
        },
        { labelKey: 'comp.avatar', route: '/components/avatar', icon: 'lucideUser', isNew: true },
      ],
    },
    {
      labelKey: 'nav.charts',
      icon: 'lucideBarChart2',
      items: [
        {
          labelKey: 'comp.chart',
          route: '/components/chart',
          icon: 'lucideBarChart2',
          isNew: true,
        },
        {
          labelKey: 'comp.statsCard',
          route: '/components/stats-card',
          icon: 'lucideTrendingUp',
          isNew: true,
        },
      ],
    },
    {
      labelKey: 'nav.overlays',
      icon: 'lucideLayers',
      items: [
        {
          labelKey: 'comp.modal',
          route: '/components/modal',
          icon: 'lucideMaximize2',
          isNew: true,
        },
        {
          labelKey: 'comp.emptyState',
          route: '/components/empty-state',
          icon: 'lucideInbox',
          isNew: true,
        },
        {
          labelKey: 'comp.tooltip',
          route: '/components/feedback',
          icon: 'lucideMessageSquare',
          isNew: true,
        },
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
