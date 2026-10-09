import {
  Component,
  DestroyRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { InternalNeuIconOutletComponent, neuStructuralIconPath, neuSemanticIconText } from '@neural-ui/core/icon-outlet-internal';
import type { NeuIconKey } from '@neural-ui/core/foundation';
import { neuIconChevronRight as iconChevronRight } from '@neural-ui/core/internal';
import { neuIconChevronLeft as iconChevronLeft } from '@neural-ui/core/internal';
import { neuIconExternalLink as iconExternalLink } from '@neural-ui/core/internal';
import { NeuTooltipDirective } from '@neural-ui/core/tooltip';

// ---- Tipos públicos / Public types ----

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
  icon: NeuIconKey;
  /** Ruta Angular interna (RouterLink). Excluye `href`. / Internal Angular route (RouterLink). Excludes `href`. */
  route?: string;
  /** URL externa. Se abre en nueva pestaña. Excluye `route`. / External URL. Opens in a new tab. Excludes `route`. */
  href?: string;
  /** Ítems hijo (nivel 2). Cada hijo puede tener sus propios `children` (nivel 3). / Child items (level 2). Each child can have its own `children` (level 3). */
  children?: NeuNavItem[];
  badge?: string;
  badgeTone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  disabled?: boolean;
  /** Applied current-page state, owned by the consumer. */
  active?: boolean;
}

@Component({
  selector: 'neu-nav',
  imports: [RouterLink, InternalNeuIconOutletComponent, NeuTooltipDirective],
  encapsulation: ViewEncapsulation.None,
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
        <div class="neu-nav__items">
          @for (item of items(); track item.id) {
            @if (item.children?.length) {
              <!-- NIVEL 1 — Grupo acordeón -->
              <div
                class="neu-nav__group"
                [class.neu-nav__group--open]="isGroupOpen(item.id)"
                (mouseenter)="onGroupMouseEnter(item, $event)"
                (mouseleave)="onGroupMouseLeave()"
                (focusin)="onGroupFocusIn(item, $event)"
                (focusout)="onGroupMouseLeave()"
              >
                <button
                  class="neu-nav__item neu-nav__item--parent"
                  type="button"
                  [class.neu-nav__item--active]="isGroupActive(item)"
                  [class.neu-nav__item--disabled]="item.disabled"
                  [attr.aria-expanded]="isGroupOpen(item.id)"
                  [attr.aria-label]="isCollapsed() ? item.label : null"
                  [attr.disabled]="item.disabled ? '' : null"
                  [neuTooltip]="isCollapsed() ? item.label : ''"
                  neuTooltipPosition="right"
                  (click)="!isCollapsed() && toggleGroup(item.id)"
                >
                  <neu-icon-outlet
                    [icon]="item.icon" [fallbackPath]="iconFallbackPath(item.icon)" [fallbackText]="iconFallbackText(item.icon)"
                    size="18px"
                    class="neu-nav__item-icon"
                    aria-hidden="true"
                  />
                  <span class="neu-nav__item-label">{{ item.label }}</span>
                  @if (item.badge) {
                    <span
                      class="neu-nav__item-badge neu-nav__item-badge--{{
                        item.badgeTone ?? 'neutral'
                      }}"
                      >{{ item.badge }}</span
                    >
                  }
                  <neu-icon-outlet
                    [icon]="iconChevronRight" [fallbackPath]="iconFallbackPath(iconChevronRight)" [fallbackText]="iconFallbackText(iconChevronRight)"
                    size="14px"
                    class="neu-nav__group-chevron"
                    aria-hidden="true"
                  />
                </button>

                <!-- Submenú nivel 2 -->
                @if (!isCollapsed() && isGroupOpen(item.id)) {
                  <div class="neu-nav__submenu">
                    @for (child of item.children; track child.id) {
                      @if (child.children?.length) {
                        <!-- NIVEL 2 — Subgrupo acordeón -->
                        <div
                          class="neu-nav__group neu-nav__group--nested"
                          [class.neu-nav__group--open]="isGroupOpen(child.id)"
                        >
                          <button
                            class="neu-nav__item neu-nav__item--child neu-nav__item--parent"
                            type="button"
                            [class.neu-nav__item--active]="isGroupActive(child)"
                            [class.neu-nav__item--disabled]="child.disabled"
                            [attr.aria-expanded]="isGroupOpen(child.id)"
                            [attr.disabled]="child.disabled ? '' : null"
                            (click)="toggleGroup(child.id)"
                          >
                            <neu-icon-outlet
                              [icon]="child.icon" [fallbackPath]="iconFallbackPath(child.icon)" [fallbackText]="iconFallbackText(child.icon)"
                              size="15px"
                              class="neu-nav__item-icon"
                              aria-hidden="true"
                            />
                            <span class="neu-nav__item-label">{{ child.label }}</span>
                            @if (child.badge) {
                              <span
                                class="neu-nav__item-badge neu-nav__item-badge--{{
                                  child.badgeTone ?? 'neutral'
                                }}"
                                >{{ child.badge }}</span
                              >
                            }
                            <neu-icon-outlet
                              [icon]="iconChevronRight" [fallbackPath]="iconFallbackPath(iconChevronRight)" [fallbackText]="iconFallbackText(iconChevronRight)"
                              size="13px"
                              class="neu-nav__group-chevron"
                              aria-hidden="true"
                            />
                          </button>

                          <!-- Submenú nivel 3 -->
                          @if (isGroupOpen(child.id)) {
                            <div class="neu-nav__submenu neu-nav__submenu--nested">
                              @for (grand of child.children; track grand.id) {
                                @if (grand.href) {
                                  <!-- NIVEL 3 — Enlace externo -->
                                  <a
                                    class="neu-nav__item neu-nav__item--grandchild"
                                    [class.neu-nav__item--active]="grand.active"
                                    [class.neu-nav__item--disabled]="grand.disabled"
                                    [attr.aria-current]="grand.active ? 'page' : null"
                                    [href]="grand.disabled ? null : grand.href"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    [attr.aria-disabled]="grand.disabled ? 'true' : null"
                                  >
                                    <neu-icon-outlet
                                      [icon]="grand.icon" [fallbackPath]="iconFallbackPath(grand.icon)" [fallbackText]="iconFallbackText(grand.icon)"
                                      size="14px"
                                      class="neu-nav__item-icon"
                                      aria-hidden="true"
                                    />
                                    <span class="neu-nav__item-label">{{ grand.label }}</span>
                                    <neu-icon-outlet
                                      [icon]="iconExternalLink" [fallbackPath]="iconFallbackPath(iconExternalLink)" [fallbackText]="iconFallbackText(iconExternalLink)"
                                      size="11px"
                                      class="neu-nav__external-icon"
                                      aria-hidden="true"
                                    />
                                  </a>
                                } @else {
                                  <!-- NIVEL 3 — Enlace interno -->
                                  <a
                                    class="neu-nav__item neu-nav__item--grandchild"
                                    [class.neu-nav__item--disabled]="grand.disabled"
                                    [routerLink]="grand.disabled ? null : (grand.route ?? null)"
                                    [attr.aria-disabled]="grand.disabled ? 'true' : null"
                                    [attr.tabindex]="grand.disabled || !grand.route ? -1 : null"
                                    [class.neu-nav__item--active]="grand.active"
                                    [attr.aria-current]="grand.active ? 'page' : null"
                                  >
                                    <neu-icon-outlet
                                      [icon]="grand.icon" [fallbackPath]="iconFallbackPath(grand.icon)" [fallbackText]="iconFallbackText(grand.icon)"
                                      size="14px"
                                      class="neu-nav__item-icon"
                                      aria-hidden="true"
                                    />
                                    <span class="neu-nav__item-label">{{ grand.label }}</span>
                                    @if (grand.badge) {
                                      <span
                                        class="neu-nav__item-badge neu-nav__item-badge--{{
                                          grand.badgeTone ?? 'neutral'
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
                          [class.neu-nav__item--active]="child.active"
                          [class.neu-nav__item--disabled]="child.disabled"
                          [attr.aria-current]="child.active ? 'page' : null"
                          [href]="child.disabled ? null : child.href"
                          target="_blank"
                          rel="noopener noreferrer"
                          [attr.aria-disabled]="child.disabled ? 'true' : null"
                        >
                          <neu-icon-outlet
                            [icon]="child.icon" [fallbackPath]="iconFallbackPath(child.icon)" [fallbackText]="iconFallbackText(child.icon)"
                            size="15px"
                            class="neu-nav__item-icon"
                            aria-hidden="true"
                          />
                          <span class="neu-nav__item-label">{{ child.label }}</span>
                          @if (child.badge) {
                            <span
                              class="neu-nav__item-badge neu-nav__item-badge--{{
                                child.badgeTone ?? 'neutral'
                              }}"
                              >{{ child.badge }}</span
                            >
                          }
                          <neu-icon-outlet
                            [icon]="iconExternalLink" [fallbackPath]="iconFallbackPath(iconExternalLink)" [fallbackText]="iconFallbackText(iconExternalLink)"
                            size="12px"
                            class="neu-nav__external-icon"
                            aria-hidden="true"
                          />
                        </a>
                      } @else {
                        <!-- NIVEL 2 — Enlace interno -->
                        <a
                          class="neu-nav__item neu-nav__item--child"
                          [class.neu-nav__item--disabled]="child.disabled"
                          [routerLink]="child.disabled ? null : (child.route ?? null)"
                          [attr.aria-disabled]="child.disabled ? 'true' : null"
                          [attr.tabindex]="child.disabled || !child.route ? -1 : null"
                          [class.neu-nav__item--active]="child.active"
                          [attr.aria-current]="child.active ? 'page' : null"
                        >
                          <neu-icon-outlet
                            [icon]="child.icon" [fallbackPath]="iconFallbackPath(child.icon)" [fallbackText]="iconFallbackText(child.icon)"
                            size="15px"
                            class="neu-nav__item-icon"
                            aria-hidden="true"
                          />
                          <span class="neu-nav__item-label">{{ child.label }}</span>
                          @if (child.badge) {
                            <span
                              class="neu-nav__item-badge neu-nav__item-badge--{{
                                child.badgeTone ?? 'neutral'
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
                [class.neu-nav__item--active]="item.active"
                [class.neu-nav__item--disabled]="item.disabled"
                [attr.aria-current]="item.active ? 'page' : null"
                [href]="item.disabled ? null : item.href"
                [attr.aria-label]="isCollapsed() ? item.label : null"
                target="_blank"
                rel="noopener noreferrer"
                [attr.aria-disabled]="item.disabled ? 'true' : null"
                [neuTooltip]="isCollapsed() ? item.label : ''"
                neuTooltipPosition="right"
              >
                <neu-icon-outlet
                  [icon]="item.icon" [fallbackPath]="iconFallbackPath(item.icon)" [fallbackText]="iconFallbackText(item.icon)"
                  size="18px"
                  class="neu-nav__item-icon"
                  aria-hidden="true"
                />
                <span class="neu-nav__item-label">{{ item.label }}</span>
                @if (item.badge) {
                  <span
                    class="neu-nav__item-badge neu-nav__item-badge--{{
                      item.badgeTone ?? 'neutral'
                    }}"
                    >{{ item.badge }}</span
                  >
                }
                <neu-icon-outlet
                  [icon]="iconExternalLink" [fallbackPath]="iconFallbackPath(iconExternalLink)" [fallbackText]="iconFallbackText(iconExternalLink)"
                  size="13px"
                  class="neu-nav__external-icon"
                  aria-hidden="true"
                />
              </a>
            } @else {
              <!-- NIVEL 1 — Enlace interno -->
              <a
                class="neu-nav__item"
                [class.neu-nav__item--disabled]="item.disabled"
                [routerLink]="item.disabled ? null : (item.route ?? null)"
                [attr.aria-label]="isCollapsed() ? item.label : null"
                [attr.aria-disabled]="item.disabled ? 'true' : null"
                [attr.tabindex]="item.disabled || !item.route ? -1 : null"
                [class.neu-nav__item--active]="item.active"
                [attr.aria-current]="item.active ? 'page' : null"
                [neuTooltip]="isCollapsed() ? item.label : ''"
                neuTooltipPosition="right"
              >
                <neu-icon-outlet
                  [icon]="item.icon" [fallbackPath]="iconFallbackPath(item.icon)" [fallbackText]="iconFallbackText(item.icon)"
                  size="18px"
                  class="neu-nav__item-icon"
                  aria-hidden="true"
                />
                <span class="neu-nav__item-label">{{ item.label }}</span>
                @if (item.badge) {
                  <span
                    class="neu-nav__item-badge neu-nav__item-badge--{{
                      item.badgeTone ?? 'neutral'
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
          [style.max-height]="'calc(100dvh - ' + flyout.top + 'px - 8px)'"
          [style.left.px]="flyout.left"
          [style.right.px]="flyout.right"
          role="navigation"
          [attr.aria-label]="ariaLabel() + ' shortcuts'"
          (mouseenter)="onFlyoutMouseEnter()"
          (mouseleave)="onFlyoutMouseLeave()"
          (focusin)="onFlyoutMouseEnter()"
          (focusout)="onFlyoutMouseLeave()"
          (keydown.escape)="closeFlyout()"
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
                      [class.neu-nav__flyout-item--active]="grand.active"
                      [class.neu-nav__flyout-item--disabled]="grand.disabled"
                      [attr.aria-current]="grand.active ? 'page' : null"
                      [attr.aria-disabled]="grand.disabled ? 'true' : null"
                      [attr.tabindex]="grand.disabled ? -1 : null"
                      [attr.href]="grand.disabled ? null : grand.href"
                      target="_blank"
                      rel="noopener noreferrer"
                      (click)="!grand.disabled && flyoutState.set(null)"
                    >
                      <neu-icon-outlet [icon]="grand.icon" [fallbackPath]="iconFallbackPath(grand.icon)" [fallbackText]="iconFallbackText(grand.icon)" size="13px" aria-hidden="true" />
                      <span>{{ grand.label }}</span>
                      <neu-icon-outlet
                        [icon]="iconExternalLink" [fallbackPath]="iconFallbackPath(iconExternalLink)" [fallbackText]="iconFallbackText(iconExternalLink)"
                        size="10px"
                        class="neu-nav__external-icon"
                      />
                    </a>
                  } @else {
                    <a
                      class="neu-nav__flyout-item"
                      [routerLink]="grand.disabled ? null : (grand.route ?? null)"
                      [class.neu-nav__flyout-item--active]="grand.active"
                      [class.neu-nav__flyout-item--disabled]="grand.disabled"
                      [attr.aria-current]="grand.active ? 'page' : null"
                      [attr.aria-disabled]="grand.disabled ? 'true' : null"
                      [attr.tabindex]="grand.disabled ? -1 : null"
                      (click)="!grand.disabled && flyoutState.set(null)"
                    >
                      <neu-icon-outlet [icon]="grand.icon" [fallbackPath]="iconFallbackPath(grand.icon)" [fallbackText]="iconFallbackText(grand.icon)" size="13px" aria-hidden="true" />
                      <span>{{ grand.label }}</span>
                    </a>
                  }
                }
              </div>
            } @else if (child.href) {
              <a
                class="neu-nav__flyout-item"
                [class.neu-nav__flyout-item--active]="child.active"
                [class.neu-nav__flyout-item--disabled]="child.disabled"
                [attr.aria-current]="child.active ? 'page' : null"
                [attr.aria-disabled]="child.disabled ? 'true' : null"
                [attr.tabindex]="child.disabled ? -1 : null"
                [attr.href]="child.disabled ? null : child.href"
                target="_blank"
                rel="noopener noreferrer"
                (click)="!child.disabled && flyoutState.set(null)"
              >
                <neu-icon-outlet [icon]="child.icon" [fallbackPath]="iconFallbackPath(child.icon)" [fallbackText]="iconFallbackText(child.icon)" size="13px" aria-hidden="true" />
                <span>{{ child.label }}</span>
                <neu-icon-outlet [icon]="iconExternalLink" [fallbackPath]="iconFallbackPath(iconExternalLink)" [fallbackText]="iconFallbackText(iconExternalLink)" size="10px" class="neu-nav__external-icon" />
              </a>
            } @else {
              <a
                class="neu-nav__flyout-item"
                [routerLink]="child.disabled ? null : (child.route ?? null)"
                [class.neu-nav__flyout-item--active]="child.active"
                [class.neu-nav__flyout-item--disabled]="child.disabled"
                [attr.aria-current]="child.active ? 'page' : null"
                [attr.aria-disabled]="child.disabled ? 'true' : null"
                [attr.tabindex]="child.disabled ? -1 : null"
                (click)="!child.disabled && flyoutState.set(null)"
              >
                <neu-icon-outlet [icon]="child.icon" [fallbackPath]="iconFallbackPath(child.icon)" [fallbackText]="iconFallbackText(child.icon)" size="13px" aria-hidden="true" />
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
          [attr.aria-label]="isCollapsed() ? expandLabel() : collapseLabel()"
          [attr.aria-expanded]="!isCollapsed()"
          (click)="toggleCollapse()"
        >
          <neu-icon-outlet
            [icon]="isCollapsed() ? iconChevronRight : iconChevronLeft" [fallbackPath]="iconFallbackPath(isCollapsed() ? iconChevronRight : iconChevronLeft)" [fallbackText]="iconFallbackText(isCollapsed() ? iconChevronRight : iconChevronLeft)"
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
  protected readonly iconFallbackPath = neuStructuralIconPath;
  protected readonly iconFallbackText = neuSemanticIconText;
  protected readonly iconChevronLeft = iconChevronLeft;
  protected readonly iconChevronRight = iconChevronRight;
  protected readonly iconExternalLink = iconExternalLink;

  // ---- Inputs ----

  /** Lista de ítems de navegación / Navigation item list */
  items = input<NeuNavItem[]>([]);

  /** Applied collapse state; omit for local uncontrolled disclosure. */
  collapsed = input<boolean | undefined>(undefined);

  /** Muestra el botón de colapsar/expandir / Shows the collapse/expand button */
  collapsible = input<boolean>(true);

  /** Etiqueta accesible del <nav> / Accessible label for the <nav> */
  ariaLabel = input<string>('Main navigation');

  /** Aria-label del botón cuando el nav está colapsado / Aria-label for the button when the nav is collapsed */
  expandLabel = input<string>('Expand navigation');

  /** Aria-label del botón cuando el nav está expandido / Aria-label for the button when the nav is expanded */
  collapseLabel = input<string>('Collapse navigation');

  /** Emite cuando cambia el estado colapsado / Emits when the collapsed state changes */
  collapsedChange = output<boolean>();

  // ---- Estado interno / Internal state ----

  private readonly localCollapsed = signal(false);
  readonly isCollapsed = computed(() => this.collapsed() ?? this.localCollapsed());
  private readonly openGroups = signal<Set<string>>(new Set());

  // ---- Flyout para modo colapsado / Flyout for collapsed mode ----
  readonly flyoutState = signal<{
    item: NeuNavItem;
    top: number;
    left: number | null;
    right?: number | null;
  } | null>(null);
  private _flyoutTimer: ReturnType<typeof setTimeout> | null = null;
  private flyoutTrigger: HTMLElement | null = null;
  private restoringFlyoutFocus = false;

  constructor() {
    // Limpiamos el timer del flyout al destruir el componente
    inject(DestroyRef).onDestroy(() => {
      if (this._flyoutTimer) clearTimeout(this._flyoutTimer);
    });
  }

  // ---- Helpers de estado / State helpers ----

  toggleCollapse(): void {
    const next = !this.isCollapsed();
    if (this.collapsed() === undefined) this.localCollapsed.set(next);
    this.collapsedChange.emit(next);
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

  /** Query the consumer-applied active item; the Router never owns active state. */
  isCurrentRoute(route: string): boolean {
    if (!route) return false;
    const matches = (item: NeuNavItem): boolean =>
      (item.route === route && !!item.active) || !!item.children?.some(matches);
    return this.items().some(matches);
  }

  isGroupActive(item: NeuNavItem): boolean {
    return (
      !!item.active ||
      !!item.children?.some(
        (child) => child.active || child.children?.some((grandchild) => grandchild.active),
      )
    );
  }

  // ---- Flyout handlers ----

  onGroupMouseEnter(item: NeuNavItem, event: MouseEvent): void {
    this.openFlyout(item, event);
  }

  protected onGroupFocusIn(item: NeuNavItem, event: FocusEvent): void {
    if (this.restoringFlyoutFocus) {
      this.restoringFlyoutFocus = false;
      return;
    }
    this.openFlyout(item, event);
  }

  private openFlyout(item: NeuNavItem, event: Event): void {
    if (!this.isCollapsed() || !item.children?.length) return;
    if (this._flyoutTimer) {
      clearTimeout(this._flyoutTimer);
      this._flyoutTimer = null;
    }
    const target = event.currentTarget;
    this.flyoutTrigger = target instanceof HTMLElement ? target.querySelector('button') : null;
    const triggerRect = this.flyoutTrigger?.getBoundingClientRect();
    const rect = triggerRect?.width ? triggerRect : (target as HTMLElement).getBoundingClientRect();
    const panelWidth = Math.min(240, Math.max(0, window.innerWidth - 16));
    const maxInset = Math.max(8, window.innerWidth - panelWidth - 14);
    const clampInset = (value: number) => Math.max(8, Math.min(value, maxInset));
    const rtl =
      target instanceof HTMLElement &&
      (target.closest('[dir]')?.getAttribute('dir') === 'rtl' ||
        getComputedStyle(target).direction === 'rtl');
    this.flyoutState.set({
      item,
      top: Math.max(8, Math.min(rect.top, window.innerHeight - 56)),
      left: rtl ? null : clampInset(rect.right),
      right: rtl ? clampInset(window.innerWidth - rect.left) : null,
    });
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

  protected closeFlyout(): void {
    if (this._flyoutTimer) clearTimeout(this._flyoutTimer);
    this._flyoutTimer = null;
    this.flyoutState.set(null);
    if (this.flyoutTrigger && document.activeElement !== this.flyoutTrigger) {
      this.restoringFlyoutFocus = true;
      this.flyoutTrigger.focus();
    }
  }
}
