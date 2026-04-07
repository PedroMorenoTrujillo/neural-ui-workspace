import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuButtonComponent,
  NeuCodeBlockComponent,
  NeuSidebarComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
  NeuUrlStateService,
} from '@neural-ui/core';

@Component({
  selector: 'app-sidebar-demo',
  imports: [
    TranslocoPipe,
    NeuButtonComponent,
    NeuBadgeComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    NeuCodeBlockComponent,
    NeuSidebarComponent,
  ],
  templateUrl: './sidebar-demo.component.html',
  styleUrl: './sidebar-demo.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarDemoComponent {
  private readonly urlState = inject(NeuUrlStateService);

  private readonly _t = inject(TranslocoService);
  private readonly _translations = toSignal(this._t.selectTranslation());
  readonly demoTabs = computed<NeuTab[]>(() => {
    this._translations();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

  readonly isDemoOpen = this.urlState.getParam('sidebar-demo');
  readonly isDemoRightOpen = this.urlState.getParam('sidebar-demo-right');

  openDemo(): void {
    this.urlState.setParam('sidebar-demo', 'open', false);
  }

  closeDemo(): void {
    this.urlState.setParam('sidebar-demo', null, false);
  }

  openDemoRight(): void {
    this.urlState.setParam('sidebar-demo-right', 'open', false);
  }

  readonly usageCode = `import { NeuSidebarComponent, NeuUrlStateService } from '@neural-ui/core';

@Component({
  imports: [NeuSidebarComponent, NeuButtonComponent],
  template: \`
    <!-- El sidebar gestiona su propio estado desde ?menu=open -->
    <neu-sidebar urlParam="menu" [persistent]="isDesktop()">
      <span neu-sidebar-header>Mi App</span>
      <nav><!-- links de navegación --></nav>
      <div neu-sidebar-footer>v1.0</div>
    </neu-sidebar>

    <!-- Abrir desde cualquier botón -->
    <button neu-button (click)="open()">Abrir menú</button>
  \`
})
export class AppComponent {
  private readonly urlState = inject(NeuUrlStateService);
  isDesktop = computed(() => window.innerWidth >= 400);

  open() {
    this.urlState.setParam('menu', 'open', false);
  }
}\``;
}
