import { Component, afterNextRender, signal } from '@angular/core';
import { NeuPanelComponent } from './ui-core/panel/neu-panel.component';
import { NeuSidebarComponent } from './ui-core/sidebar/neu-sidebar.component';
import {
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from './ui-core/tabs/neu-tabs.component';

@Component({
  selector: 'n2-navigation-hydration',
  imports: [NeuTabsComponent, NeuTabPanelComponent, NeuPanelComponent, NeuSidebarComponent],
  template: `
    <span id="n2-navigation-ready">{{ ready() }}</span>
    <output id="n2-tabs-events">{{ tabsEvents() }}</output>
    <output id="n2-panel-events">{{ panelEvents() }}</output>
    <output id="n2-sidebar-events">{{ sidebarEvents() }}</output>

    <neu-tabs
      id="n2-tabs-one"
      [tabs]="tabs"
      [activeId]="activeId()"
      (activeIdChange)="acceptTab($event)"
    >
      <neu-tab-panel tabId="overview"><p>Overview body</p></neu-tab-panel>
      <neu-tab-panel tabId="security"><p>Security body</p></neu-tab-panel>
    </neu-tabs>

    <neu-tabs id="n2-tabs-two" [tabs]="tabs" activeId="overview">
      <neu-tab-panel tabId="overview"><p>Second overview</p></neu-tab-panel>
      <neu-tab-panel tabId="security"><p>Second security</p></neu-tab-panel>
    </neu-tabs>

    <neu-panel
      id="n2-panel"
      header="Account"
      [collapsible]="true"
      [collapsed]="panelCollapsed()"
      (collapsedChange)="acceptPanel($event)"
    >
      <p>Panel body</p>
    </neu-panel>

    <neu-sidebar
      #sidebar
      id="n2-sidebar"
      [persistent]="true"
      [collapsed]="sidebarCollapsed()"
      (collapsedChange)="acceptSidebar($event)"
    >
      <span neu-sidebar-header>Navigation</span>
      <button id="n2-sidebar-toggle" type="button" (click)="sidebar.toggleCollapsed()">
        Toggle navigation
      </button>
    </neu-sidebar>
  `,
})
export class N2NavigationHydrationComponent {
  readonly tabs: readonly NeuTab<string>[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'security', label: 'Security' },
  ];
  readonly activeId = signal<string | null>('overview');
  readonly panelCollapsed = signal(false);
  readonly sidebarCollapsed = signal(false);
  readonly ready = signal(false);
  readonly tabsEvents = signal(0);
  readonly panelEvents = signal(0);
  readonly sidebarEvents = signal(0);

  constructor() {
    afterNextRender(() => this.ready.set(true));
  }

  acceptTab(id: string | null): void {
    this.activeId.set(id);
    this.tabsEvents.update((count) => count + 1);
  }

  acceptPanel(collapsed: boolean): void {
    this.panelCollapsed.set(collapsed);
    this.panelEvents.update((count) => count + 1);
  }

  acceptSidebar(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
    this.sidebarEvents.update((count) => count + 1);
  }
}
