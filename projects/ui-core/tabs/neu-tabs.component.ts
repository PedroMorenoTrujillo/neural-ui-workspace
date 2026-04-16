import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  InjectionToken,
  OnDestroy,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NeuUrlStateService } from '@neural-ui/core/url-state';

// ----------------------------------------------------------------
// Token de contexto — permite a NeuTabPanelComponent inyectar
// la instancia padre sin pasar signals manualmente.
// ----------------------------------------------------------------
export const NEU_TABS_CONTEXT = new InjectionToken<NeuTabsComponent>('NeuTabsContext');

export interface NeuTab {
  /** ID único de la pestaña — se usa como valor en la URL / Unique tab ID — used as the URL value */
  id: string;
  /** Etiqueta visible / Visible label */
  label: string;
  /** Badge opcional junto al label / Optional badge next to the label */
  badge?: string;
  /** Deshabilita la pestaña sin ocultarla / Disables the tab without hiding it */
  disabled?: boolean;
}

/**
 * NeuralUI Tabs Component
 *
 * Sistema de pestañas con estado sincronizado a la URL via NeuUrlStateService. / Tab system with state synchronized to the URL via NeuUrlStateService.
 * El panel activo se determina por ?{tabParam}={tabId}. / The active panel is determined by ?{tabParam}={tabId}.
 *
 * Uso:
 *   <neu-tabs [tabs]="tabs" tabParam="tab">
 *     <neu-tab-panel tabId="preview">...</neu-tab-panel>
 *     <neu-tab-panel tabId="api">...</neu-tab-panel>
 *   </neu-tabs>
 */
@Component({
  selector: 'neu-tabs',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NEU_TABS_CONTEXT, useExisting: NeuTabsComponent }],
  template: `
    <!-- Barra de pestañas -->
    <div class="neu-tabs" [class.neu-tabs--flush]="flush()">
      <div class="neu-tabs__nav" role="tablist" [attr.aria-label]="ariaLabel()" #navRef>
        @for (tab of tabs(); track tab.id) {
          <button
            class="neu-tabs__tab"
            [class.neu-tabs__tab--active]="activeTabId() === tab.id"
            [class.neu-tabs__tab--disabled]="tab.disabled"
            role="tab"
            [id]="'neu-tab-' + tab.id"
            [attr.aria-selected]="activeTabId() === tab.id"
            [attr.aria-controls]="'neu-tabpanel-' + tab.id"
            [attr.tabindex]="activeTabId() === tab.id ? '0' : '-1'"
            [disabled]="tab.disabled"
            type="button"
            (click)="selectTab(tab)"
            (keydown.arrowRight)="focusTab($any($event), 1)"
            (keydown.arrowLeft)="focusTab($any($event), -1)"
            (keydown.home)="focusTab($any($event), 'first')"
            (keydown.end)="focusTab($any($event), 'last')"
          >
            {{ tab.label }}
            @if (tab.badge) {
              <span class="neu-tabs__tab-badge">{{ tab.badge }}</span>
            }
          </button>
        }
        <!-- Indicador deslizante -->
        <span class="neu-tabs__indicator" [style]="indicatorStyle()"></span>
      </div>

      <!-- Paneles (proyectados desde NeuTabPanelComponent) -->
      <div class="neu-tabs__panels">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './neu-tabs.component.scss',
})
export class NeuTabsComponent implements AfterViewInit, OnDestroy {
  private readonly urlState = inject(NeuUrlStateService);
  private readonly elRef = inject(ElementRef);
  private resizeObserver?: ResizeObserver;

  constructor() {
    // Actualizar indicador cuando activeTabId cambie — debe estar en el constructor (injection context)
    effect(() => {
      this.activeTabId(); // dependencia reactiva
      requestAnimationFrame(() => this._updateIndicator());
    });
  }

  /** Definición de pestañas / Tab definitions */
  tabs = input<NeuTab[]>([]);

  /** QueryParam que almacena la pestaña activa / QueryParam that stores the active tab */
  tabParam = input<string>('tab');

  /** Si true, elimina el padding interno de los paneles / If true, removes the internal padding from panels */
  flush = input<boolean>(false);

  /** Etiqueta accesible del rol tablist / Accessible label for the tablist role */
  ariaLabel = input<string>('Pestañas de contenido');

  /** Emite al cambiar de pestaña / Emits when the tab changes */
  tabChange = output<string>();

  /** ID de la pestaña activa (de la URL o la primera disponible) / Active tab ID (from the URL or the first available) */
  readonly activeTabId = computed(() => {
    const fromUrl = this.urlState.getParam(this.tabParam())();
    const available = this.tabs().find((t) => t.id === fromUrl && !t.disabled);
    if (available) return available.id;
    // Fallback: primera pestaña no deshabilitada
    return this.tabs().find((t) => !t.disabled)?.id ?? '';
  });

  /** Posición del indicador calculada mediante medición DOM / Indicator position calculated via DOM measurement */
  private readonly _indicatorLeft = signal('0px');
  private readonly _indicatorWidth = signal('0px');

  readonly indicatorStyle = computed(
    () => `left: ${this._indicatorLeft()}; width: ${this._indicatorWidth()}`,
  );

  ngAfterViewInit(): void {
    this._updateIndicator();
    // Actualizar cuando cambie el tamaño del nav (p.ej. resize de ventana)
    const nav = this.elRef.nativeElement.querySelector('.neu-tabs__nav');
    if (nav && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this._updateIndicator());
      this.resizeObserver.observe(nav);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private _updateIndicator(): void {
    const nav: HTMLElement | null = this.elRef.nativeElement.querySelector('.neu-tabs__nav');
    if (!nav) return;
    const tabEls = nav.querySelectorAll<HTMLElement>('.neu-tabs__tab');
    const idx = this.tabs().findIndex((t) => t.id === this.activeTabId());
    const tabEl = tabEls[idx];
    if (tabEl) {
      this._indicatorLeft.set(tabEl.offsetLeft + 'px');
      this._indicatorWidth.set(tabEl.offsetWidth + 'px');
    }
  }

  selectTab(tab: NeuTab): void {
    if (tab.disabled) return;
    this.urlState.setParam(this.tabParam(), tab.id);
    this.tabChange.emit(tab.id);
    requestAnimationFrame(() => this._updateIndicator());
  }

  /** Mueve el foco entre tabs con flechas (roving tabindex — WAI-ARIA Tabs Pattern) / Moves focus between tabs with arrows (roving tabindex — WAI-ARIA Tabs Pattern) */
  focusTab(event: Event, dir: 1 | -1 | 'first' | 'last'): void {
    event.preventDefault();
    const enabledTabs = this.tabs().filter((t) => !t.disabled);
    const currentIdx = enabledTabs.findIndex((t) => t.id === this.activeTabId());
    let nextIdx: number;
    if (dir === 'first') {
      nextIdx = 0;
    } else if (dir === 'last') {
      nextIdx = enabledTabs.length - 1;
    } else {
      nextIdx = (currentIdx + dir + enabledTabs.length) % enabledTabs.length;
    }
    const next = enabledTabs[nextIdx];
    this.selectTab(next);
    const btn = (this.elRef.nativeElement as HTMLElement).querySelector(
      `#neu-tab-${next.id}`,
    ) as HTMLElement | null;
    btn?.focus();
  }
}

// ----------------------------------------------------------------
// NeuTabPanelComponent — panel individual (usa DI para el contexto)
// ----------------------------------------------------------------

/**
 * NeuralUI Tab Panel
 *
 * Panel de contenido asociado a una pestaña de NeuTabsComponent. / Content panel associated with a NeuTabsComponent tab.
 * Solo se renderiza (no oculta con CSS) cuando la pestaña está activa. / Only rendered (not hidden with CSS) when the tab is active.
 *
 * Uso: hijo directo de <neu-tabs>
 *   <neu-tab-panel tabId="api">...</neu-tab-panel>
 */
@Component({
  selector: 'neu-tab-panel',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isActive()) {
      <div
        class="neu-tab-panel"
        role="tabpanel"
        [id]="'neu-tabpanel-' + tabId()"
        [attr.aria-labelledby]="'neu-tab-' + tabId()"
      >
        <ng-content />
      </div>
    }
  `,
})
export class NeuTabPanelComponent {
  private readonly tabs = inject(NEU_TABS_CONTEXT, { optional: true });

  /** ID que debe coincidir con NeuTab.id del padre / ID that must match the parent NeuTab.id */
  tabId = input.required<string>();

  readonly isActive = computed(() => this.tabs?.activeTabId() === this.tabId());
}
