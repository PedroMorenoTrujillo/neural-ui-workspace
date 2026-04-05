import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NeuButtonComponent } from '@neural-ui/core';
import { NeuSidebarComponent } from '@neural-ui/core';

/**
 * SidebarDemoComponent
 *
 * Demuestra el patrón "URL-driven State":
 * - El input() 'menu' recibe el valor de ?menu= gracias a withComponentInputBinding()
 * - computed() deriva si el sidebar está abierto
 * - El Router actualiza la URL al abrir/cerrar — el estado es compartible y navegable
 */
@Component({
  selector: 'app-sidebar-demo',
  standalone: true,
  imports: [NeuButtonComponent, NeuSidebarComponent],
  templateUrl: './sidebar-demo.component.html',
  styleUrl: './sidebar-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarDemoComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // ----------------------------------------------------------------
  // URL State via withComponentInputBinding()
  // Angular inyecta automáticamente el valor de ?menu= en este input()
  // ----------------------------------------------------------------
  menu = input<string>(); // ← hydratado desde ?menu=open por el Router

  readonly isSidebarOpen = computed(() => this.menu() === 'open');

  readonly currentUrl = computed(() => {
    const base = '/components/sidebar';
    return this.isSidebarOpen() ? `${base}?menu=open` : base;
  });

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
