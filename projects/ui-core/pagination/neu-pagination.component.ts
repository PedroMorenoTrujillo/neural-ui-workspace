import {
  Component,
  DestroyRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { NeuSelectComponent, type NeuSelectOption } from '@neural-ui/core/select';

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
  imports: [ReactiveFormsModule, NeuSelectComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <nav class="neu-pagination" [attr.aria-label]="labels().pagination">
      @if (normalizedPageSizeOptions().length) {
        <neu-select
          class="neu-pagination__size"
          size="sm"
          [floatingLabel]="false"
          [ariaLabel]="resolvedPageSizeAriaLabel()"
          [options]="pageSizeSelectOptions()"
          optionLabel="label"
          [formControl]="pageSizeControl"
        />
      }
      <!-- Anterior -->
      <button
        class="neu-pagination__btn neu-pagination__btn--nav"
        type="button"
        [disabled]="page() <= 1"
        [attr.aria-label]="labels().previousPage"
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
            [attr.aria-label]="labels().page(p)"
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
        [attr.aria-label]="labels().nextPage"
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
  private readonly doc = inject(DOCUMENT);
  private readonly defaultLocale = inject(NEURAL_LOCALE);
  private readonly destroyRef = inject(DestroyRef);

  /** Página actual (1-indexed) / Current page (1-indexed) */
  page = input<number>(1);

  /** Total de ítems / Total items */
  total = input<number>(0);

  /** Ítems por página / Items per page */
  pageSize = input<number>(10);

  /** Empty by default so basic pagination retains no selector UI. */
  pageSizeOptions = input<readonly number[]>([]);

  pageSizeAriaLabel = input('Items per page');

  /** Número máximo de botones de página visibles (sin contar anterior/siguiente) / Maximum number of visible page buttons (not counting prev/next) */
  maxVisible = input<number>(7);

  /** Emite la nueva página al hacer click / Emits the new page on click */
  pageChange = output<number>();

  pageSizeChange = output<number>();

  readonly normalizedPageSizeOptions = computed(() => [
    ...new Set(
      this.pageSizeOptions()
        .map((value) => Math.trunc(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  ]);

  readonly pageSizeSelectOptions = computed<NeuSelectOption<number>[]>(() =>
    this.normalizedPageSizeOptions().map((size) => ({
      label: String(size),
      value: size,
    })),
  );
  private readonly activeLocale = signal(resolveDocumentLocale(this.doc, this.defaultLocale));
  protected readonly labels = computed(() => paginationLabels(this.activeLocale()));
  protected readonly resolvedPageSizeAriaLabel = computed(() => {
    const configured = this.pageSizeAriaLabel().trim();
    return configured && configured !== 'Items per page' ? configured : this.labels().itemsPerPage;
  });

  protected readonly pageSizeControl = new FormControl(10, { nonNullable: true });

  constructor() {
    const pageSizeSubscription = this.pageSizeControl.valueChanges.subscribe((value) =>
      this.changePageSize(value),
    );
    this.destroyRef.onDestroy(() => pageSizeSubscription.unsubscribe());

    effect(() => {
      const pageSize = this.pageSize();
      if (this.pageSizeControl.value !== pageSize) {
        this.pageSizeControl.setValue(pageSize, { emitEvent: false });
      }
    });

    const win = this.doc.defaultView;
    if (win?.MutationObserver) {
      const observer = new win.MutationObserver(() => {
        this.activeLocale.set(resolveDocumentLocale(this.doc, this.defaultLocale));
      });
      observer.observe(this.doc.documentElement, {
        attributes: true,
        attributeFilter: ['lang'],
      });
      this.destroyRef.onDestroy(() => observer.disconnect());
    }
  }

  readonly totalPages = computed(() => {
    const size = Number.isFinite(this.pageSize()) ? Math.max(1, this.pageSize()) : 1;
    const total = Number.isFinite(this.total()) ? Math.max(0, this.total()) : 0;
    return Math.max(1, Math.ceil(total / size));
  });

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

  changePageSize(value: string | number | null): void {
    const nextSize = Math.trunc(Number(value));
    if (!Number.isFinite(nextSize) || nextSize <= 0 || nextSize === this.pageSize()) return;
    const first = Math.max(0, (Math.max(1, this.page()) - 1) * Math.max(1, this.pageSize()));
    const nextTotalPages = Math.max(1, Math.ceil(Math.max(0, this.total()) / nextSize));
    const nextPage = Math.min(nextTotalPages, Math.floor(first / nextSize) + 1);
    this.pageSizeChange.emit(nextSize);
    if (nextPage !== this.page()) this.pageChange.emit(nextPage);
  }
}

interface NeuPaginationLocaleLabels {
  readonly pagination: string;
  readonly itemsPerPage: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly page: (page: number) => string;
}

function resolveDocumentLocale(doc: Document, fallback: string): string {
  return doc.documentElement.lang.trim() || fallback;
}

function paginationLabels(locale: string): NeuPaginationLocaleLabels {
  return locale.toLowerCase().startsWith('es')
    ? {
        pagination: 'Paginación',
        itemsPerPage: 'Elementos por página',
        previousPage: 'Página anterior',
        nextPage: 'Página siguiente',
        page: (page) => `Página ${page}`,
      }
    : {
        pagination: 'Pagination',
        itemsPerPage: 'Items per page',
        previousPage: 'Previous page',
        nextPage: 'Next page',
        page: (page) => `Page ${page}`,
      };
}
