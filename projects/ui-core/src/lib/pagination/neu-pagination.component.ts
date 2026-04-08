import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

/**
 * NeuralUI Pagination Component
 *
 * Paginación accesible con navegación por páginas, primera/última y ellipsis.
 *
 * Uso:
 *   <neu-pagination [total]="200" [pageSize]="10" [page]="currentPage"
 *                  (pageChange)="currentPage = $event" />
 */
@Component({
  selector: 'neu-pagination',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="neu-pagination" aria-label="Paginación">
      <!-- Anterior -->
      <button
        class="neu-pagination__btn neu-pagination__btn--nav"
        type="button"
        [disabled]="page() <= 1"
        [attr.aria-label]="'Página anterior'"
        (click)="go(page() - 1)"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <!-- Páginas -->
      @for (p of pages(); track p) {
        @if (p === -1) {
          <span class="neu-pagination__ellipsis" aria-hidden="true">…</span>
        } @else {
          <button
            class="neu-pagination__btn"
            [class.neu-pagination__btn--active]="p === page()"
            type="button"
            [attr.aria-label]="'Página ' + p"
            [attr.aria-current]="p === page() ? 'page' : null"
            (click)="go(p)"
          >
            {{ p }}
          </button>
        }
      }

      <!-- Siguiente -->
      <button
        class="neu-pagination__btn neu-pagination__btn--nav"
        type="button"
        [disabled]="page() >= totalPages()"
        [attr.aria-label]="'Página siguiente'"
        (click)="go(page() + 1)"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </nav>
  `,
  styleUrl: './neu-pagination.component.scss',
})
export class NeuPaginationComponent {
  /** Página actual (1-indexed) */
  page = input<number>(1);

  /** Total de ítems */
  total = input<number>(0);

  /** Ítems por página */
  pageSize = input<number>(10);

  /** Número máximo de botones de página visibles (sin contar anterior/siguiente) */
  maxVisible = input<number>(7);

  /** Emite la nueva página al hacer click */
  pageChange = output<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  readonly pages = computed((): (number | -1)[] => {
    const total = this.totalPages();
    const current = this.page();
    const max = this.maxVisible();

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor(max / 2);
    let start = Math.max(2, current - half + 1);
    let end = Math.min(total - 1, start + max - 3);
    if (end - start < max - 3) start = Math.max(2, end - (max - 4));

    const result: (number | -1)[] = [1];
    if (start > 2) result.push(-1);
    for (let i = start; i <= end; i++) result.push(i);
    if (end < total - 1) result.push(-1);
    result.push(total);
    return result;
  });

  go(page: number): void {
    const clamped = Math.min(this.totalPages(), Math.max(1, page));
    if (clamped !== this.page()) {
      this.pageChange.emit(clamped);
    }
  }
}
