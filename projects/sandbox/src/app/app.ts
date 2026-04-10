import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { distinctUntilChanged, filter, fromEvent, map, pairwise, startWith } from 'rxjs';
import { NeuIconComponent, NeuSidebarComponent, NeuToastContainerComponent } from '@neural-ui/core';

interface NavItem {
  label: string;
  route: string;
}

interface NavGroup {
  key: string;
  label: string;
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
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly isDark = signal(this._initDark());
  readonly collapsedGroups = signal<Set<string>>(new Set());

  private readonly router = inject(Router);

  readonly isDesktop = toSignal(
    fromEvent(window, 'resize').pipe(
      startWith(null),
      map(() => window.innerWidth >= 768),
      distinctUntilChanged(),
    ),
    { initialValue: window.innerWidth >= 768 },
  );

  constructor() {
    effect(() => {
      const theme = this.isDark() ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('neu-sandbox-theme', theme);
    });

    // Scroll al top solo cuando cambia el path
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map((e) => e.urlAfterRedirects.split('?')[0]),
        pairwise(),
        filter(([prev, curr]) => prev !== curr),
      )
      .subscribe(() => window.scrollTo({ top: 0 }));
  }

  private _initDark(): boolean {
    const saved = localStorage.getItem('neu-sandbox-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggleTheme(): void {
    this.isDark.update((v) => !v);
  }

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

  readonly navGroups: NavGroup[] = [
    {
      key: 'forms',
      label: 'Formularios',
      icon: 'lucideFormInput',
      items: [
        { label: 'Input', route: '/input' },
        { label: 'Select', route: '/select' },
        { label: 'Multiselect', route: '/multiselect' },
        { label: 'Textarea', route: '/textarea' },
        { label: 'Checkbox', route: '/checkbox' },
        { label: 'Radio', route: '/radio' },
        { label: 'Switch', route: '/switch' },
        { label: 'Date Input', route: '/date-input' },
        { label: 'Slider', route: '/slider' },
        { label: 'Rating', route: '/rating' },
        { label: 'Toggle Button Group', route: '/toggle-button-group' },
      ],
    },
    {
      key: 'actions',
      label: 'Acciones',
      icon: 'lucideMousePointerClick',
      items: [
        { label: 'Button', route: '/button' },
        { label: 'Split Button', route: '/split-button' },
      ],
    },
    {
      key: 'data',
      label: 'Datos',
      icon: 'lucideDatabase',
      items: [
        { label: 'Table', route: '/table' },
        { label: 'Badge', route: '/badge' },
        { label: 'Chip', route: '/chip' },
        { label: 'Stats Card', route: '/stats-card' },
        { label: 'Progress Bar', route: '/progress-bar' },
        { label: 'Pagination', route: '/pagination' },
      ],
    },
    {
      key: 'nav',
      label: 'Navegación',
      icon: 'lucideLayoutTemplate',
      items: [
        { label: 'Sidebar', route: '/sidebar' },
        { label: 'Nav', route: '/nav' },
        { label: 'Breadcrumb', route: '/breadcrumb' },
        { label: 'Stepper', route: '/stepper' },
        { label: 'Tabs', route: '/tabs' },
      ],
    },
    {
      key: 'layout',
      label: 'Layout',
      icon: 'lucideLayout',
      items: [
        { label: 'Accordion', route: '/accordion' },
        { label: 'Card', route: '/card' },
        { label: 'Divider', route: '/divider' },
        { label: 'Modal', route: '/modal' },
      ],
    },
    {
      key: 'feedback',
      label: 'Feedback',
      icon: 'lucideBell',
      items: [
        { label: 'Toast', route: '/toast' },
        { label: 'Spinner', route: '/spinner' },
        { label: 'Skeleton', route: '/skeleton' },
        { label: 'Empty State', route: '/empty-state' },
        { label: 'Timeline', route: '/timeline' },
      ],
    },
    {
      key: 'overlay',
      label: 'Overlays',
      icon: 'lucideLayers',
      items: [{ label: 'Tooltip', route: '/tooltip' }],
    },
    {
      key: 'media',
      label: 'Media',
      icon: 'lucideImage',
      items: [
        { label: 'Avatar', route: '/avatar' },
        { label: 'Icon', route: '/icon' },
        { label: 'Code Block', route: '/code-block' },
        { label: 'Chart', route: '/chart' },
      ],
    },
    {
      key: 'utils',
      label: 'Utilidades',
      icon: 'lucideSettings',
      items: [{ label: 'URL State', route: '/url-state' }],
    },
  ];
}
