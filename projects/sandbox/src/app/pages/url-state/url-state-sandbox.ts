import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { NeuUrlStateService, NeuButtonComponent, NeuInputComponent } from '@neural-ui/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-url-state-sandbox',
  imports: [NeuButtonComponent, NeuInputComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">URL State</h1>
        <p class="sb-page__desc">
          NeuUrlStateService — <code>getParam</code>, <code>setParam</code>,
          <code>patchParams</code>, <code>clearParams</code>. Los parámetros se escriben en la URL
          del navegador.
        </p>
      </div>

      <!-- getParam / setParam -->
      <section class="sb-section">
        <h2 class="sb-section__title">getParam + setParam</h2>
        <div class="sb-demo--column sb-demo" style="max-width: 480px">
          <div style="display: flex; gap: 8px">
            <neu-input
              [(ngModel)]="searchInput"
              placeholder="Buscar..."
              hint="Se escribe como ?q= en la URL"
            />
            <button neu-button variant="primary" (neuClick)="setSearch()">Buscar</button>
            <button neu-button variant="ghost" (neuClick)="clearSearch()">Limpiar</button>
          </div>
          <div class="sb-field">
            <span class="sb-label">q (de la URL):</span>
            <span class="sb-value">{{ qParam() ?? '(sin valor)' }}</span>
          </div>
        </div>
      </section>

      <!-- patchParams -->
      <section class="sb-section">
        <h2 class="sb-section__title">patchParams (múltiples a la vez)</h2>
        <div class="sb-demo--column sb-demo" style="max-width: 480px">
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <button neu-button variant="outline" (neuClick)="applyFilter1()">
              Filtro 1 (page=1, sort=name)
            </button>
            <button neu-button variant="outline" (neuClick)="applyFilter2()">
              Filtro 2 (page=2, sort=date, dir=desc)
            </button>
            <button neu-button variant="secondary" (neuClick)="clearAll()">Limpiar todo</button>
          </div>
          <div class="sb-field" style="margin-top: 8px">
            <span class="sb-label">page:</span>
            <span class="sb-value">{{ pageParam() ?? '(sin valor)' }}</span>
          </div>
          <div class="sb-field">
            <span class="sb-label">sort:</span>
            <span class="sb-value">{{ sortParam() ?? '(sin valor)' }}</span>
          </div>
          <div class="sb-field">
            <span class="sb-label">dir:</span>
            <span class="sb-value">{{ dirParam() ?? '(sin valor)' }}</span>
          </div>
        </div>
      </section>

      <!-- clearParams -->
      <section class="sb-section">
        <h2 class="sb-section__title">clearParams</h2>
        <div class="sb-demo--column sb-demo">
          <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
            Borra <strong>todos</strong> los queryParams de la URL actual.
          </p>
          <div style="display: flex; gap: 8px; margin-top: 8px">
            <button neu-button variant="danger" (neuClick)="clearAll()">
              Eliminar todos los params
            </button>
          </div>
        </div>
      </section>

      <!-- Estado actual -->
      <section class="sb-section">
        <h2 class="sb-section__title">Estado actual de la URL</h2>
        <div class="sb-demo--column sb-demo">
          <p
            style="font-size: var(--neu-text-sm); font-family: monospace; background: var(--neu-surface-2); padding: 12px; border-radius: 6px; word-break: break-all"
          >
            {{ currentUrl }}
          </p>
        </div>
      </section>
    </div>
  `,
})
export class UrlStateSandboxComponent {
  private readonly urlState = inject(NeuUrlStateService);

  readonly qParam = this.urlState.getParam('q');
  readonly pageParam = this.urlState.getParam('page');
  readonly sortParam = this.urlState.getParam('sort');
  readonly dirParam = this.urlState.getParam('dir');

  readonly searchInput = signal('');

  get currentUrl(): string {
    return window.location.href;
  }

  constructor() {
    // Pre-fill input from URL on init
    effect(() => {
      const q = this.qParam();
      if (q !== null) {
        this.searchInput.set(q);
      }
    });
  }

  setSearch(): void {
    const value = this.searchInput().trim();
    this.urlState.setParam('q', value || null);
  }

  clearSearch(): void {
    this.searchInput.set('');
    this.urlState.setParam('q', null);
  }

  applyFilter1(): void {
    this.urlState.patchParams({ page: '1', sort: 'name', dir: null });
  }

  applyFilter2(): void {
    this.urlState.patchParams({ page: '2', sort: 'date', dir: 'desc' });
  }

  clearAll(): void {
    this.searchInput.set('');
    this.urlState.clearParams();
  }
}
