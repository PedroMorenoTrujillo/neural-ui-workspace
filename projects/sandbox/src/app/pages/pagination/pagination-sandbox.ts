import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuPaginationComponent } from '@neural-ui/core';

@Component({
  selector: 'app-pagination-sandbox',
  imports: [NeuPaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Pagination</h1>
        <p class="sb-page__desc">NeuPaginationComponent — total, pageSize, maxVisible.</p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico (100 items, 10 por página)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-pagination
            [page]="page1()"
            [total]="100"
            [pageSize]="10"
            (pageChange)="page1.set($event)"
          />
          <span class="sb-value">página: {{ page1() }}</span>
        </div>
      </section>

      <!-- Muchas páginas -->
      <section class="sb-section">
        <h2 class="sb-section__title">Muchas páginas (500 items, 10 por página)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-pagination
            [page]="page2()"
            [total]="500"
            [pageSize]="10"
            [maxVisible]="7"
            (pageChange)="page2.set($event)"
          />
          <span class="sb-value">página: {{ page2() }} / 50</span>
        </div>
      </section>

      <!-- pageSize diferente -->
      <section class="sb-section">
        <h2 class="sb-section__title">pageSize grande (1000 items, 50 por página)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-pagination
            [page]="page3()"
            [total]="1000"
            [pageSize]="50"
            (pageChange)="page3.set($event)"
          />
          <span class="sb-value">página: {{ page3() }} / 20</span>
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo">
          <div style="display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">Una sola página</span>
            <neu-pagination [page]="1" [total]="5" [pageSize]="10" />
          </div>
          <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">2 páginas</span>
            <neu-pagination [page]="1" [total]="15" [pageSize]="10" />
          </div>
          <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">maxVisible reducido (3)</span>
            <neu-pagination
              [page]="page4()"
              [total]="100"
              [pageSize]="10"
              [maxVisible]="3"
              (pageChange)="page4.set($event)"
            />
          </div>
          <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">Sin items (total 0)</span>
            <neu-pagination [page]="1" [total]="0" [pageSize]="10" />
          </div>
        </div>
      </section>
    </div>
  `,
})
export class PaginationSandboxComponent {
  readonly page1 = signal(1);
  readonly page2 = signal(1);
  readonly page3 = signal(1);
  readonly page4 = signal(1);
}
