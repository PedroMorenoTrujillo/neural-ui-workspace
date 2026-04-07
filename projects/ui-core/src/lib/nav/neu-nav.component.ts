import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { NeuIconComponent } from '../icon/neu-icon.component';
import { NeuTooltipDirective } from '../tooltip/neu-tooltip.directive';

// ---- Tipos públicos ----

/**
 * Ítem de navegación con soporte para 3 niveles de profundidad.
 *
 * Destino del enlace — usa UNO de los dos:
 *   - `route`  → navegación interna Angular (RouterLink)
 *   - `href`   → URL externa, se abre en nueva pestaña con rel="noopener noreferrer"
 *
 * Los ítems con `children` actúan como grupo acordeón (sin destino propio).
 * Máximo 3 niveles: raíz → hijos → nietos.
 * Los nietos no pueden tener `children`.
 */
export interface NeuNavItem {
  id: string;
  label: string;
  icon: string;
  /** Ruta Angular interna (RouterLink). Excluye `href`. */
  route?: string;
  /** URL externa. Se abre en nueva pestaña. Excluye `route`. */
  href?: string;
  /** Ítems hijo (nivel 2). Cada hijo puede tener sus propios `children` (nivel 3). */
  children?: NeuNavItem[];
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  disabled?: boolean;
}

@Component({
  selector: 'neu-nav',
  imports: [RouterLink, RouterLinkActive, NeuIconComponent, NeuTooltipDirective],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="neu-nav-wrapper" [class.neu-nav-wrapper--collapsed]="isCollapsed()">
      <nav
        class="neu-nav"
        [class.neu-nav--collapsed]="isCollapsed()"
        [attr.aria-label]="ariaLabel()"
      >
        <!-- Brand slot -->
        <div class="neu-nav__brand">
          <!-- Icono visible solo en modo colapsado -->
          <div class="neu-nav__brand-icon">
            <ng-content select="[neu-nav-brand-icon]" />
          </div>
          <!-- Contenido completo visible en modo expandido -->
          <div class="neu-nav__brand-content">
            <ng-content select="[neu-nav-brand]" />
          </div>
        </div>

        <!-- Items (nivel 1) -->
        <div class="neu-nav__items" role="list">
          @for (item of items(); track item.id) {
            @if (item.children?.length) {
              <!-- NIVEL 1 — Grupo acordeón -->
              <div
                class="neu-nav__group"
                [class.neu-nav__group--open]="isGroupOpen(item.id)"
                role="listitem"
                (mouseenter)="onGroupMouseEnter(item, $event)"
                (mouseleave)="onGroupMouseLeave()"
              >
                <button
                  class="neu-nav__item neu-nav__item--parent"
                  type="button"
                  [class.neu-nav__item--active]="isGroupActive(item)"
                  [class.neu-nav__item--disabled]="item.disabled"
                  [attr.aria-expanded]="isGroupOpen(item.id)"
                  [attr.aria-haspopup]="true"
                  [attr.disabled]="item.disabled ? '' : null"
                  [neuTooltip]="isCollapsed() ? item.label : ''"
                  neuTooltipPosition="right"
                  (click)="!isCollapsed() && toggleGroup(item.id)"
                >
                  <neu-icon
                    [name]="item.icon"
                    size="18px"
                    class="neu-nav__item-icon"
                    aria-hidden="true"
                  />
                  <span class="neu-nav__item-label">{{ item.label }}</span>
                  @if (item.badge) {
                    <span
                      class="neu-nav__item-badge neu-nav__item-badge--{{
                        item.badgeVariant ?? 'default'
                      }}"
                      >{{ item.badge }}</span
                    >
                  }
                  <neu-icon
                    name="lucideChevronRight"
                    size="14px"
                    class="neu-nav__group-chevron"
                    aria-hidden="true"
                  />
                </button>

                <!-- Submenú nivel 2 -->
                @if (!isCollapsed() && isGroupOpen(item.id)) {
                  <div class="neu-nav__submenu" role="list">
                    @for (child of item.children; track child.id) {
                      @if (child.children?.length) {
                        <!-- NIVEL 2 — Subgrupo acordeón -->
                        <div
                          class="neu-nav__group neu-nav__group--nested"
                          [class.neu-nav__group--open]="isGroupOpen(child.id)"
                          role="listitem"
                        >
                          <button
                            class="neu-nav__item neu-nav__item--child neu-nav__item--parent"
                            type="button"
                            [class.neu-nav__item--active]="isGroupActive(child)"
                            [class.neu-nav__item--disabled]="child.disabled"
                            [attr.aria-expanded]="isGroupOpen(child.id)"
                            [attr.aria-haspopup]="true"
                            [attr.disabled]="child.disabled ? '' : null"
                            (click)="toggleGroup(child.id)"
                          >
                            <neu-icon
                              [name]="child.icon"
                              size="15px"
                              class="neu-nav__item-icon"
                              aria-hidden="true"
                            />
                            <span class="neu-nav__item-label">{{ child.label }}</span>
                            @if (child.badge) {
                              <span
                                class="neu-nav__item-badge neu-nav__item-badge--{{
                                  child.badgeVariant ?? 'default'
                                }}"
                                >{{ child.badge }}</span
                              >
                            }
                            <neu-icon
                              name="lucideChevronRight"
                              size="13px"
                              class="neu-nav__group-chevron"
                              aria-hidden="true"
                            />
                          </button>

                          <!-- Submenú nivel 3 -->
                          @if (isGroupOpen(child.id)) {
                            <div class="neu-nav__submenu neu-nav__submenu--nested" role="list">
                              @for (grand of child.children; track grand.id) {
                                @if (grand.href) {
                                  <!-- NIVEL 3 — Enlace externo -->
                                  <a
                                    class="neu-nav__item neu-nav__item--grandchild"
                                    [class.neu-nav__item--disabled]="grand.disabled"
                                    [href]="grand.disabled ? null : grand.href"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    [attr.aria-disabled]="grand.disabled ? 'true' : null"
                                    role="listitem"
                                  >
                                    <neu-icon
                                      [name]="grand.icon"
                                      size="14px"
                                      class="neu-nav__item-icon"
                                      aria-hidden="true"
                                    />
                                    <span class="neu-nav__item-label">{{ grand.label }}</span>
                                    <neu-icon
                                      name="lucideExternalLink"
                                      size="11px"
                                      class="neu-nav__external-icon"
                                      aria-label="(abre en nueva pestaña)"
                                    />
                                  </a>
                                } @else {
                                  <!-- NIVEL 3 — Enlace interno -->
                                  <a
                                    class="neu-nav__item neu-nav__item--grandchild"
                                    [class.neu-nav__item--disabled]="grand.disabled"
                                    [routerLink]="grand.disabled ? null : (grand.route ?? null)"
                                    routerLinkActive="neu-nav__item--active"
                                    [routerLinkActiveOptions]="{ exact: true }"
                                    [attr.aria-current]="
                                      isCurrentRoute(grand.route ?? '') ? 'page' : null
                                    "
                                    role="listitem"
                                  >
                                    <neu-icon
                                      [name]="grand.icon"
                                      size="14px"
                                      class="neu-nav__item-icon"
                                      aria-hidden="true"
                                    />
                                    <span class="neu-nav__item-label">{{ grand.label }}</span>
                                    @if (grand.badge) {
                                      <span
                                        class="neu-nav__item-badge neu-nav__item-badge--{{
                                          grand.badgeVariant ?? 'default'
                                        }}"
                                        >{{ grand.badge }}</span
                                      >
                                    }
                                  </a>
                                }
                              }
                            </div>
                          }
                        </div>
                      } @else if (child.href) {
                        <!-- NIVEL 2 — Enlace externo -->
                        <a
                          class="neu-nav__item neu-nav__item--child"
                          [class.neu-nav__item--disabled]="child.disabled"
                          [href]="child.disabled ? null : child.href"
                          target="_blank"
                          rel="noopener noreferrer"
                          [attr.aria-disabled]="child.disabled ? 'true' : null"
                          role="listitem"
                        >
                          <neu-icon
                            [name]="child.icon"
                            size="15px"
                            class="neu-nav__item-icon"
                            aria-hidden="true"
                          />
                          <span class="neu-nav__item-label">{{ child.label }}</span>
                          @if (child.badge) {
                            <span
                              class="neu-nav__item-badge neu-nav__item-badge--{{
                                child.badgeVariant ?? 'default'
                              }}"
                              >{{ child.badge }}</span
                            >
                          }
                          <neu-icon
                            name="lucideExternalLink"
                            size="12px"
                            class="neu-nav__external-icon"
                            aria-label="(abre en nueva pestaña)"
                          />
                        </a>
                      } @else {
                        <!-- NIVEL 2 — Enlace interno -->
                        <a
                          class="neu-nav__item neu-nav__item--child"
                          [class.neu-nav__item--disabled]="child.disabled"
                          [routerLink]="child.disabled ? null : (child.route ?? null)"
                          routerLinkActive="neu-nav__item--active"
                          [routerLinkActiveOptions]="{ exact: true }"
                          [attr.aria-current]="isCurrentRoute(child.route ?? '') ? 'page' : null"
                          role="listitem"
                        >
                          <neu-icon
                            [name]="child.icon"
                            size="15px"
                            class="neu-nav__item-icon"
                            aria-hidden="true"
                          />
                          <span class="neu-nav__item-label">{{ child.label }}</span>
                          @if (child.badge) {
                            <span
                              class="neu-nav__item-badge neu-nav__item-badge--{{
                                child.badgeVariant ?? 'default'
                              }}"
                              >{{ child.badge }}</span
                            >
                          }
                        </a>
                      }
                    }
                  </div>
                }
              </div>
            } @else if (item.href) {
              <!-- NIVEL 1 — Enlace externo -->
              <a
                class="neu-nav__item"
                [class.neu-nav__item--disabled]="item.disabled"
                [href]="item.disabled ? null : item.href"
                target="_blank"
                rel="noopener noreferrer"
                [attr.aria-disabled]="item.disabled ? 'true' : null"
                [neuTooltip]="isCollapsed() ? item.label : ''"
                neuTooltipPosition="right"
                role="listitem"
              >
                <neu-icon
                  [name]="item.icon"
                  size="18px"
                  class="neu-nav__item-icon"
                  aria-hidden="true"
                />
                <span class="neu-nav__item-label">{{ item.label }}</span>
                @if (item.badge) {
                  <span
                    class="neu-nav__item-badge neu-nav__item-badge--{{
                      item.badgeVariant ?? 'default'
                    }}"
                    >{{ item.badge }}</span
                  >
                }
                <neu-icon
                  name="lucideExternalLink"
                  size="13px"
                  class="neu-nav__external-icon"
                  aria-label="(abre en nueva pestaña)"
                />
              </a>
            } @else {
              <!-- NIVEL 1 — Enlace interno -->
              <a
                class="neu-nav__item"
                [class.neu-nav__item--disabled]="item.disabled"
                [routerLink]="item.disabled ? null : (item.route ?? null)"
                routerLinkActive="neu-nav__item--active"
                [routerLinkActiveOptions]="{ exact: item.route === '/' }"
                [attr.aria-current]="isCurrentRoute(item.route ?? '') ? 'page' : null"
                [neuTooltip]="isCollapsed() ? item.label : ''"
                neuTooltipPosition="right"
                role="listitem"
              >
                <neu-icon
                  [name]="item.icon"
                  size="18px"
                  class="neu-nav__item-icon"
                  aria-hidden="true"
                />
                <span class="neu-nav__item-label">{{ item.label }}</span>
                @if (item.badge) {
                  <span
                    class="neu-nav__item-badge neu-nav__item-badge--{{
                      item.badgeVariant ?? 'default'
                    }}"
                    >{{ item.badge }}</span
                  >
                }
              </a>
            }
          }
        </div>

        <!-- Footer slot -->
        <div class="neu-nav__footer">
          <ng-content select="[neu-nav-footer]" />
        </div>
      </nav>

      <!-- Flyout panel para grupos en modo colapsado -->
      @if (flyoutState(); as flyout) {
        <div
          class="neu-nav__flyout"
          [style.top.px]="flyout.top"
          [style.left.px]="flyout.left"
          role="menu"
          (mouseenter)="onFlyoutMouseEnter()"
          (mouseleave)="onFlyoutMouseLeave()"
        >
          <div class="neu-nav__flyout-title">{{ flyout.item.label }}</div>
          @for (child of flyout.item.children ?? []; track child.id) {
            @if (child.children?.length) {
              <div class="neu-nav__flyout-group">
                <span class="neu-nav__flyout-group-label">{{ child.label }}</span>
                @for (grand of child.children; track grand.id) {
                  @if (grand.href) {
                    <a
                      class="neu-nav__flyout-item"
                      role="menuitem"
                      [href]="grand.href"
                      target="_blank"
                      rel="noopener noreferrer"
                      (click)="flyoutState.set(null)"
                    >
                      <neu-icon [name]="grand.icon" size="13px" aria-hidden="true" />
                      <span>{{ grand.label }}</span>
                      <neu-icon
                        name="lucideExternalLink"
                        size="10px"
                        class="neu-nav__external-icon"
                      />
                    </a>
                  } @else {
                    <a
                      class="neu-nav__flyout-item"
                      role="menuitem"
                      [routerLink]="grand.route"
                      routerLinkActive="neu-nav__flyout-item--active"
                      (click)="flyoutState.set(null)"
                    >
                      <neu-icon [name]="grand.icon" size="13px" aria-hidden="true" />
                      <span>{{ grand.label }}</span>
                    </a>
                  }
                }
              </div>
            } @else if (child.href) {
              <a
                class="neu-nav__flyout-item"
                role="menuitem"
                [href]="child.href"
                target="_blank"
                rel="noopener noreferrer"
                (click)="flyoutState.set(null)"
              >
                <neu-icon [name]="child.icon" size="13px" aria-hidden="true" />
                <span>{{ child.label }}</span>
                <neu-icon name="lucideExternalLink" size="10px" class="neu-nav__external-icon" />
              </a>
            } @else {
              <a
                class="neu-nav__flyout-item"
                role="menuitem"
                [routerLink]="child.route"
                routerLinkActive="neu-nav__flyout-item--active"
                (click)="flyoutState.set(null)"
              >
                <neu-icon [name]="child.icon" size="13px" aria-hidden="true" />
                <span>{{ child.label }}</span>
              </a>
            }
          }
        </div>
      }

      <!-- Pestaña collapse/expand — fuera del nav para no ser recortada -->
      @if (collapsible()) {
        <button
          class="neu-nav__toggle-tab"
          type="button"
          [attr.aria-label]="isCollapsed() ? 'Expandir menú' : 'Colapsar menú'"
          [attr.aria-expanded]="!isCollapsed()"
          (click)="toggleCollapse()"
        >
          <neu-icon
            [name]="isCollapsed() ? 'lucideChevronRight' : 'lucideChevronLeft'"
            size="12px"
            aria-hidden="true"
          />
        </button>
      }
    </div>
  `,
  styleUrl: './neu-nav.component.scss',
})
export class NeuNavComponent {
  private readonly router = inject(Router);

  // ---- Señal reactiva de ruta activa ----
  private readonly currentUrl = toSignal(
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)),
    { initialValue: null },
  );

  // ---- Inputs ----

  /** Lista de ítems de navegación */
  items = input<NeuNavItem[]>([]);

  /** Estado inicial colapsado */
  collapsed = input<boolean>(false);

  /** Muestra el botón de colapsar/expandir */
  collapsible = input<boolean>(true);

  /** Etiqueta accesible del <nav> */
  ariaLabel = input<string>('Navegación principal');

  /** Emite cuando cambia el estado colapsado */
  collapsedChange = output<boolean>();

  // ---- Estado interno ----

  // Sigue el input `collapsed` del padre (permite el configurador)
  // pero puede ser sobreescrito localmente con toggleCollapse()
  readonly isCollapsed = signal(this.collapsed());
  private readonly openGroups = signal<Set<string>>(new Set());

  // ---- Flyout para modo colapsado ----
  readonly flyoutState = signal<{ item: NeuNavItem; top: number; left: number } | null>(null);
  private _flyoutTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Sincroniza isCollapsed cuando el input cambia desde el padre
    effect(() => this.isCollapsed.set(this.collapsed()), { allowSignalWrites: true });
    // Abrimos el grupo activo DESPUÉS de que el padre haya pasado los inputs
    afterNextRender(() => this._openActiveGroup());
    // Limpiamos el timer del flyout al destruir el componente
    inject(DestroyRef).onDestroy(() => {
      if (this._flyoutTimer) clearTimeout(this._flyoutTimer);
    });
  }

  // ---- Helpers de estado ----

  toggleCollapse(): void {
    this.isCollapsed.update((v) => {
      const next = !v;
      this.collapsedChange.emit(next);
      return next;
    });
  }

  toggleGroup(id: string): void {
    this.openGroups.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isGroupOpen(id: string): boolean {
    return this.openGroups().has(id);
  }

  isCurrentRoute(route: string): boolean {
    if (!route) return false;
    // Consume la señal para que OnPush re-evalúe tras navegación
    this.currentUrl();
    return this.router.url === route || this.router.url.startsWith(route + '?');
  }

  isGroupActive(item: NeuNavItem): boolean {
    if (!item.children?.length) return false;
    return item.children.some(
      (c) =>
        this.isCurrentRoute(c.route ?? '') ||
        (c.children?.some((g) => this.isCurrentRoute(g.route ?? '')) ?? false),
    );
  }

  // ---- Flyout handlers ----

  onGroupMouseEnter(item: NeuNavItem, event: MouseEvent): void {
    if (!this.isCollapsed() || !item.children?.length) return;
    if (this._flyoutTimer) {
      clearTimeout(this._flyoutTimer);
      this._flyoutTimer = null;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.flyoutState.set({ item, top: rect.top, left: rect.right });
  }

  onGroupMouseLeave(): void {
    if (!this.isCollapsed()) return;
    this._flyoutTimer = setTimeout(() => this.flyoutState.set(null), 150);
  }

  onFlyoutMouseEnter(): void {
    if (this._flyoutTimer) {
      clearTimeout(this._flyoutTimer);
      this._flyoutTimer = null;
    }
  }

  onFlyoutMouseLeave(): void {
    this._flyoutTimer = setTimeout(() => this.flyoutState.set(null), 150);
  }

  private _openActiveGroup(): void {
    const toOpen = new Set<string>();
    for (const item of this.items()) {
      if (!item.children) continue;
      for (const child of item.children) {
        if (child.route && this.router.url.startsWith(child.route)) {
          toOpen.add(item.id);
        }
        if (child.children) {
          for (const grand of child.children) {
            if (grand.route && this.router.url.startsWith(grand.route)) {
              toOpen.add(item.id);
              toOpen.add(child.id);
            }
          }
        }
      }
    }
    if (toOpen.size > 0) {
      this.openGroups.set(toOpen);
    }
  }
}
