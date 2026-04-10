import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuTabsComponent, NeuTabPanelComponent } from '@neural-ui/core';
import type { NeuTab } from '@neural-ui/core';

@Component({
  selector: 'app-tabs-sandbox',
  imports: [NeuTabsComponent, NeuTabPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Tabs</h1>
        <p class="sb-page__desc">
          NeuTabsComponent + NeuTabPanelComponent — tabs con URL state, badges, flush.
        </p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico</h2>
        <div class="sb-demo--column sb-demo">
          <neu-tabs [tabs]="basicTabs" tabParam="tab1" (tabChange)="activeTab1.set($event)">
            <neu-tab-panel tabId="overview">
              <p style="padding: 16px; color: var(--neu-text-muted)">
                Contenido de la pestaña Overview
              </p>
            </neu-tab-panel>
            <neu-tab-panel tabId="config">
              <p style="padding: 16px; color: var(--neu-text-muted)">Contenido de Configuración</p>
            </neu-tab-panel>
            <neu-tab-panel tabId="logs">
              <p style="padding: 16px; color: var(--neu-text-muted)">
                Aquí van los logs del sistema
              </p>
            </neu-tab-panel>
          </neu-tabs>
          <span class="sb-value">tab activo: {{ activeTab1() }}</span>
        </div>
      </section>

      <!-- Con badges -->
      <section class="sb-section">
        <h2 class="sb-section__title">Con badges y tab deshabilitado</h2>
        <div class="sb-demo--column sb-demo">
          <neu-tabs [tabs]="tabsWithBadge" tabParam="tab2">
            <neu-tab-panel tabId="inbox">
              <p style="padding: 16px; color: var(--neu-text-muted)">12 mensajes sin leer</p>
            </neu-tab-panel>
            <neu-tab-panel tabId="sent">
              <p style="padding: 16px; color: var(--neu-text-muted)">Mensajes enviados</p>
            </neu-tab-panel>
            <neu-tab-panel tabId="drafts">
              <p style="padding: 16px; color: var(--neu-text-muted)">Borradores</p>
            </neu-tab-panel>
          </neu-tabs>
        </div>
      </section>

      <!-- Flush -->
      <section class="sb-section">
        <h2 class="sb-section__title">Flush (sin borde)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-tabs [tabs]="flushTabs" [flush]="true" tabParam="tab3">
            <neu-tab-panel tabId="a">
              <p style="padding: 16px; color: var(--neu-text-muted)">Panel A</p>
            </neu-tab-panel>
            <neu-tab-panel tabId="b">
              <p style="padding: 16px; color: var(--neu-text-muted)">Panel B</p>
            </neu-tab-panel>
            <neu-tab-panel tabId="c">
              <p style="padding: 16px; color: var(--neu-text-muted)">Panel C</p>
            </neu-tab-panel>
          </neu-tabs>
        </div>
      </section>
    </div>
  `,
})
export class TabsSandboxComponent {
  readonly activeTab1 = signal('overview');

  readonly basicTabs: NeuTab[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'config', label: 'Configuración' },
    { id: 'logs', label: 'Logs' },
  ];

  readonly tabsWithBadge: NeuTab[] = [
    { id: 'inbox', label: 'Bandeja', badge: '12' },
    { id: 'sent', label: 'Enviados' },
    { id: 'drafts', label: 'Borradores', disabled: true },
  ];

  readonly flushTabs: NeuTab[] = [
    { id: 'a', label: 'Pestaña A' },
    { id: 'b', label: 'Pestaña B' },
    { id: 'c', label: 'Pestaña C' },
  ];
}
