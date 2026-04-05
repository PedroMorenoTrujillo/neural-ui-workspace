import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { NeuUrlStateService } from '../url-state/neu-url-state.service';

// ----------------------------------------------------------------
// Token de contexto — permite a NeuTabPanelComponent inyectar
// la instancia padre sin pasar signals manualmente.
// ----------------------------------------------------------------
export const NEU_TABS_CONTEXT = new InjectionToken<NeuTabsComponent>('NeuTabsContext');

export interface NeuTab {
  /** ID único de la pestaña — se usa como valor en la URL */
  id: string;
  /** Etiqueta visible */
  label: string;
  /** Badge opcional junto al label */
  badge?: string;
  /** Deshabilita la pestaña sin ocultarla */
  disabled?: boolean;
}

/**
 * NeuralUI Tabs Component
 *
 * Sistema de pestañas con estado sincronizado a la URL via NeuUrlStateService.
 * El panel activo se determina por ?{tabParam}={tabId}.
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
      <div class="neu-tabs__nav" role="tablist" [attr.aria-label]="ariaLabel()">
        @for (tab of tabs(); track tab.id) {
          <button
            class="neu-tabs__tab"
            [class.neu-tabs__tab--active]="activeTabId() === tab.id"
            [class.neu-tabs__tab--disabled]="tab.disabled"
            role="tab"
            [id]="'neu-tab-' + tab.id"
            [attr.aria-selected]="activeTabId() === tab.id"
            [attr.aria-controls]="'neu-tabpanel-' + tab.id"
            [disabled]="tab.disabled"
            type="button"
            (click)="selectTab(tab)"
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
export class NeuTabsComponent {
  private readonly urlState = inject(NeuUrlStateService);

  /** Definición de pestañas */
  tabs = input<NeuTab[]>([]);

  /** QueryParam que almacena la pestaña activa */
  tabParam = input<string>('tab');

  /** Si true, elimina el padding interno de los paneles */
  flush = input<boolean>(false);

  /** Etiqueta accesible del rol tablist */
  ariaLabel = input<string>('Pestañas de contenido');

  /** Emite al cambiar de pestaña */
  tabChange = output<string>();

  /** ID de la pestaña activa (de la URL o la primera disponible) */
  readonly activeTabId = computed(() => {
    const fromUrl = this.urlState.getParam(this.tabParam())();
    const available = this.tabs().find((t) => t.id === fromUrl && !t.disabled);
    if (available) return available.id;
    // Fallback: primera pestaña no deshabilitada
    return this.tabs().find((t) => !t.disabled)?.id ?? '';
  });

  /** Estilo CSS del indicador deslizante (calcula posición por índice) */
  readonly indicatorStyle = computed(() => {
    const idx = this.tabs().findIndex((t) => t.id === this.activeTabId());
    if (idx < 0) return '';
    const pct = (100 / this.tabs().length) * idx;
    const w = 100 / this.tabs().length;
    return `left: ${pct}%; width: ${w}%`;
  });

  selectTab(tab: NeuTab): void {
    if (tab.disabled) return;
    this.urlState.setParam(this.tabParam(), tab.id);
    this.tabChange.emit(tab.id);
  }
}

// ----------------------------------------------------------------
// NeuTabPanelComponent — panel individual (usa DI para el contexto)
// ----------------------------------------------------------------

/**
 * NeuralUI Tab Panel
 *
 * Panel de contenido asociado a una pestaña de NeuTabsComponent.
 * Solo se renderiza (no oculta con CSS) cuando la pestaña está activa.
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

  /** ID que debe coincidir con NeuTab.id del padre */
  tabId = input.required<string>();

  readonly isActive = computed(() => this.tabs?.activeTabId() === this.tabId());
}
