import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { NeuSidebarComponent, NeuButtonComponent } from '@neural-ui/core';

@Component({
  selector: 'app-sidebar-sandbox',
  imports: [NeuSidebarComponent, NeuButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Sidebar</h1>
        <p class="sb-page__desc">
          NeuSidebarComponent — side, persistent, urlParam, hideHeader. Métodos:
          <code>open()</code> / <code>close()</code>.
        </p>
      </div>

      <!-- Sidebar izquierdo (default) -->
      <section class="sb-section">
        <h2 class="sb-section__title">Sidebar izquierdo (por defecto)</h2>
        <div class="sb-demo">
          <button neu-button variant="primary" icon="lucideMenu" (neuClick)="openLeft()">
            Abrir sidebar izq
          </button>
        </div>
        <neu-sidebar #leftSidebar urlParam="sb-left" ariaLabel="Sidebar izquierdo de demo">
          <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px">
            <p style="font-weight: 600">Contenido del sidebar</p>
            <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
              Cualquier contenido proyectado vía ng-content.
            </p>
            <button neu-button variant="ghost" (neuClick)="closeLeft()">Cerrar</button>
          </div>
        </neu-sidebar>
      </section>

      <!-- Sidebar derecho -->
      <section class="sb-section">
        <h2 class="sb-section__title">Sidebar derecho</h2>
        <div class="sb-demo">
          <button neu-button variant="outline" icon="lucidePanelLeft" (neuClick)="openRight()">
            Abrir sidebar dcho
          </button>
        </div>
        <neu-sidebar
          #rightSidebar
          side="right"
          urlParam="sb-right"
          ariaLabel="Sidebar derecho de demo"
        >
          <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px">
            <p style="font-weight: 600">Panel derecho</p>
            <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
              Útil para detalles, filtros o configuración contextual.
            </p>
            <button neu-button variant="ghost" (neuClick)="closeRight()">Cerrar</button>
          </div>
        </neu-sidebar>
      </section>

      <!-- Persistente -->
      <section class="sb-section">
        <h2 class="sb-section__title">Persistente (no se cierra al hacer clic fuera)</h2>
        <div class="sb-demo">
          <button neu-button variant="secondary" icon="lucideMenu" (neuClick)="openPersistent()">
            Abrir persistente
          </button>
        </div>
        <neu-sidebar
          #persistentSidebar
          [persistent]="true"
          urlParam="sb-persist"
          ariaLabel="Sidebar persistente de demo"
        >
          <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px">
            <p style="font-weight: 600">Sidebar persistente</p>
            <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
              No se cierra al hacer clic fuera del panel.
            </p>
            <button neu-button variant="ghost" (neuClick)="closePersistent()">Cerrar</button>
          </div>
        </neu-sidebar>
      </section>

      <!-- hideHeader -->
      <section class="sb-section">
        <h2 class="sb-section__title">Sin cabecera (hideHeader)</h2>
        <div class="sb-demo">
          <button neu-button variant="ghost" icon="lucideMenu" (neuClick)="openNoHeader()">
            Sin cabecera
          </button>
        </div>
        <neu-sidebar
          #noHeaderSidebar
          [hideHeader]="true"
          urlParam="sb-noheader"
          ariaLabel="Sidebar sin cabecera"
        >
          <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px">
            <p style="font-weight: 600">Sin botón de cierre nativo</p>
            <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
              Tú controlas el cierre con tu propio botón.
            </p>
            <button neu-button variant="danger" (neuClick)="closeNoHeader()">Cerrar</button>
          </div>
        </neu-sidebar>
      </section>
    </div>
  `,
})
export class SidebarSandboxComponent {
  readonly leftSidebar = viewChild.required<NeuSidebarComponent>('leftSidebar');
  readonly rightSidebar = viewChild.required<NeuSidebarComponent>('rightSidebar');
  readonly persistentSidebar = viewChild.required<NeuSidebarComponent>('persistentSidebar');
  readonly noHeaderSidebar = viewChild.required<NeuSidebarComponent>('noHeaderSidebar');

  openLeft(): void {
    this.leftSidebar().open();
  }
  closeLeft(): void {
    this.leftSidebar().close();
  }
  openRight(): void {
    this.rightSidebar().open();
  }
  closeRight(): void {
    this.rightSidebar().close();
  }
  openPersistent(): void {
    this.persistentSidebar().open();
  }
  closePersistent(): void {
    this.persistentSidebar().close();
  }
  openNoHeader(): void {
    this.noHeaderSidebar().open();
  }
  closeNoHeader(): void {
    this.noHeaderSidebar().close();
  }
}
