import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { map } from 'rxjs/operators';
import { NeuButtonComponent } from '@neural-ui/core';
import { NeuSidebarComponent } from '@neural-ui/core';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NeuSidebarComponent, NeuButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // ----------------------------------------------------------------
  // URL State — el sidebar lee ?menu=open del queryParam
  // Usamos toSignal() para convertir el Observable de la ruta en Signal
  // ----------------------------------------------------------------
  private readonly menuParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('menu'))),
    { initialValue: null },
  );

  readonly isSidebarOpen = computed(() => this.menuParam() === 'open');

  readonly navItems: NavItem[] = [
    { label: 'Inicio', route: '/', icon: '◇' },
    { label: 'Button', route: '/components/button', icon: '□' },
    { label: 'Sidebar', route: '/components/sidebar', icon: '▤' },
  ];

  openSidebar(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { menu: 'open' },
      queryParamsHandling: 'merge',
    });
  }

  closeSidebar(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { menu: null },
      queryParamsHandling: 'merge',
    });
  }
}
