import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { distinctUntilChanged, fromEvent, map, startWith } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  NeuAvatarComponent,
  NeuIconComponent,
  NeuSidebarComponent,
  NeuToastContainerComponent,
  NeuUrlStateService,
} from '@neural-ui/core';
import { AdminTranslationService } from './services/admin-translation.service';

interface NavItem {
  labelKey: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NeuSidebarComponent,
    NeuIconComponent,
    NeuAvatarComponent,
    NeuToastContainerComponent,
    TranslocoPipe,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly urlState = inject(NeuUrlStateService);
  readonly i18n = inject(AdminTranslationService);

  readonly isDesktop = toSignal(
    fromEvent(window, 'resize').pipe(
      startWith(null),
      map(() => window.innerWidth >= 768),
      distinctUntilChanged(),
    ),
    { initialValue: window.innerWidth >= 768 },
  );

  readonly navItems: NavItem[] = [
    { labelKey: 'nav.dashboard', route: '/dashboard', icon: 'lucideLayoutDashboard' },
    { labelKey: 'nav.users', route: '/users', icon: 'lucideUsers' },
    { labelKey: 'nav.settings', route: '/settings', icon: 'lucideSettings' },
  ];

  openMenu(): void {
    this.urlState.setParam('menu', 'open', false);
  }

  toggleLang(): void {
    this.i18n.toggle();
  }
}
