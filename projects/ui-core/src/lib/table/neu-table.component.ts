import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NeuUrlStateService } from '../url-state/neu-url-state.service';
import { NeuTableColumn } from './neu-table.types';

export type { NeuTableColumn } from './neu-table.types';

type Row = Record<string, unknown>;

// Conversor interno — el input acepta object[] para compatibilidad con
// interfaces de usuario concretas (User, Product…). Internamente casteamos a Row.
function asRows(data: object[]): Row[] {
  return data as Row[];
}

/**
 * NeuralUI Table — Componente Estrella
 *
 * Tabla de datos con:
 *   - Búsqueda/filtrado → ?q=...
 *   - Paginación → ?page=...
 *   - Ordenación → ?sort=col&sortDir=asc|desc
 *   - Selección de filas (múltiple) opcional
 *   - Skeleton de carga animado
 *   - Scroll horizontal elegante en mobile (<400px)
 *
 * Uso básico:
 *   <neu-table [columns]="cols" [data]="rows" />
 *
 * Múltiples tablas por página:
 *   <neu-table pageParam="userPage" searchParam="userQ" sortParam="userSort" ... />
 */
@Component({
  selector: 'neu-table',
  standalone: true,
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="neu-table-container">

      <!-- ---- Toolbar ---- -->
      @if (searchable() || title()) {
        <div class="neu-table__toolbar">
          @if (title()) {
            <h3 class="neu-table__title">{{ title() }}</h3>
          }
          @if (searchable()) {
            <div class="neu-table__search-wrapper">
              <svg class="neu-table__search-icon" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round"
                   stroke-linejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                class="neu-table__search"
                type="search"
                [placeholder]="searchPlaceholder()"
                [value]="searchQuery()"
                (input)="onSearch($event)"
                aria-label="Buscar en la tabla"
              />
              @if (searchQuery()) {
                <button class="neu-table__search-clear" type="button"
                        aria-label="Limpiar búsqueda" (click)="clearSearch()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              }
            </div>
          }
        </div>
      }

      <!-- Barra de selección (aparece al seleccionar) -->
      @if (selectable() && selectedCount() > 0) {
        <div class="neu-table__selection-bar">
          <span>{{ selectedCount() }} fila{{ selectedCount() !== 1 ? 's' : '' }} seleccionada{{ selectedCount() !== 1 ? 's' : '' }}</span>
          <button class="neu-table__selection-clear" type="button" (click)="clearSelection()">
            Deseleccionar todo
          </button>
        </div>
      }

      <!-- ---- Scroll container ---- -->
      <div class="neu-table__scroll-container" role="region" [attr.aria-label]="title() || 'Tabla de datos'">
        <table class="neu-table" [attr.aria-rowcount]="filteredData().length">
          <thead class="neu-table__head">
            <tr>
              <!-- Checkbox de selección global -->
              @if (selectable()) {
                <th class="neu-table__th neu-table__th--check" scope="col">
                  <input
                    type="checkbox"
                    class="neu-table__checkbox"
                    [checked]="isAllSelected()"
                    [indeterminate]="isSomeSelected()"
                    (change)="toggleAll()"
                    aria-label="Seleccionar todas las filas"
                  />
                </th>
              }
              @for (col of columns(); track col.key) {
                <th
                  class="neu-table__th"
                  [class.neu-table__th--sortable]="sortable() && col.sortable !== false"
                  [class.neu-table__th--sorted-asc]="sortKey() === col.key && sortDir() === 'asc'"
                  [class.neu-table__th--sorted-desc]="sortKey() === col.key && sortDir() === 'desc'"
                  [class]="col.cellClass ?? ''"
                  [style.width]="col.width ?? 'auto'"
                  [style.text-align]="col.align ?? 'left'"
                  scope="col"
                  (click)="sortable() && col.sortable !== false ? sortBy(col.key) : null"
                >
                  {{ col.header }}
                  @if (sortable() && col.sortable !== false) {
                    <span class="neu-table__sort-icon" aria-hidden="true">
                      @if (sortKey() === col.key) {
                        @if (sortDir() === 'asc') { ↑ } @else { ↓ }
                      } @else { ↕ }
                    </span>
                  }
                </th>
              }
            </tr>
          </thead>

          <tbody class="neu-table__body">
            @if (loading()) {
              <tr class="neu-table__row--loading">
                <td [attr.colspan]="columns().length + (selectable() ? 1 : 0)"
                    class="neu-table__td neu-table__td--center">
                  <div class="neu-table__skeleton-rows">
                    @for (_ of skeletonRows(); track $index) {
                      <div class="neu-table__skeleton-row">
                        @for (__ of columns(); track $index) {
                          <div class="neu-table__skeleton-cell"></div>
                        }
                      </div>
                    }
                  </div>
                </td>
              </tr>
            } @else if (paginatedData().length === 0) {
              <tr>
                <td [attr.colspan]="columns().length + (selectable() ? 1 : 0)"
                    class="neu-table__td neu-table__td--empty">
                  <div class="neu-table__empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <p>{{ emptyMessage() }}</p>
                    @if (searchQuery()) {
                      <button class="neu-table__clear-filter" type="button" (click)="clearSearch()">
                        Eliminar filtro
                      </button>
                    }
                  </div>
                </td>
              </tr>
            } @else {
              @for (row of paginatedData(); track getRowKey(row)) {
                <tr
                  class="neu-table__row"
                  [class.neu-table__row--selected]="isRowSelected(row)"
                  [class.neu-table__row--clickable]="selectable()"
                  (click)="selectable() ? toggleRow(row) : null"
                >
                  @if (selectable()) {
                    <td class="neu-table__td neu-table__th--check" (click)="$event.stopPropagation()">
                      <input
                        type="checkbox"
                        class="neu-table__checkbox"
                        [checked]="isRowSelected(row)"
                        (change)="toggleRow(row)"
                        [attr.aria-label]="'Seleccionar fila'"
                      />
                    </td>
                  }
                  @for (col of columns(); track col.key) {
                    <td
                      class="neu-table__td"
                      [class]="col.cellClass ?? ''"
                      [style.text-align]="col.align ?? 'left'"
                    >
                      {{ getCellValue(row, col) }}
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- ---- Footer ---- -->
      @if (!loading() && filteredData().length > 0) {
        <div class="neu-table__footer">
          <span class="neu-table__info">
            {{ paginationInfo() }}
          </span>
          @if (totalPages() > 1) {
            <nav class="neu-table__pagination" aria-label="Paginación">
              <button class="neu-table__page-btn" [disabled]="currentPage() === 1"
                      (click)="goToPage(currentPage() - 1)" aria-label="Anterior" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              @for (page of pageNumbers(); track page) {
                <button
                  class="neu-table__page-btn"
                  [class.neu-table__page-btn--active]="page === currentPage()"
                  (click)="goToPage(page)"
                  [attr.aria-current]="page === currentPage() ? 'page' : null"
                  type="button"
                >{{ page }}</button>
              }
              <button class="neu-table__page-btn" [disabled]="currentPage() === totalPages()"
                      (click)="goToPage(currentPage() + 1)" aria-label="Siguiente" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </nav>
          }
        </div>
      }

    </div>
  `,
  styleUrl: './neu-table.component.scss',
})
export class NeuTableComponent {
  private readonly urlState = inject(NeuUrlStateService);

  // ---- Inputs de datos ----
  columns    = input<NeuTableColumn[]>([]);
  data       = input<object[]>([]);
  pageSize   = input<number>(10);
  loading    = input<boolean>(false);
  title      = input<string>('');
  emptyMessage = input<string>('No se encontraron resultados');
  skeletonRows = input<number[]>([1, 2, 3, 4, 5]);

  // ---- Inputs de funcionalidad ----
  searchable        = input<boolean>(true);
  searchPlaceholder = input<string>('Buscar...');
  sortable          = input<boolean>(false);
  selectable        = input<boolean>(false);
  /** Clave del campo que identifica de forma única cada fila */
  rowKey            = input<string>('id');

  // ---- URL params (personalizables para múltiples tablas) ----
  pageParam    = input<string>('page');
  searchParam  = input<string>('q');
  sortParam    = input<string>('sort');
  sortDirParam = input<string>('sortDir');

  // ---- Outputs ----
  rowSelectionChange = output<Row[]>();

  // ---- URL State ----
  readonly currentPage = computed(() => {
    const raw = this.urlState.getParam(this.pageParam())();
    const n = Number(raw);
    return !raw || isNaN(n) || n < 1 ? 1 : n;
  });

  readonly searchQuery = computed(() => this.urlState.getParam(this.searchParam())() ?? '');
  readonly sortKey     = computed(() => this.urlState.getParam(this.sortParam())() ?? '');
  readonly sortDir     = computed<'asc' | 'desc'>(() => {
    const d = this.urlState.getParam(this.sortDirParam())();
    return d === 'desc' ? 'desc' : 'asc';
  });

  // ---- Pipeline de datos ----
  private readonly rows = computed(() => asRows(this.data()));

  readonly filteredData = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter((row) =>
      this.columns().some((col) => {
        const val = col.cell ? col.cell(row) : String(row[col.key] ?? '');
        return val.toLowerCase().includes(q);
      }),
    );
  });

  readonly sortedData = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir();
    const data = [...this.filteredData()];
    if (!key || !this.sortable()) return data;
    return data.sort((a, b) => {
      const av = a[key] ?? '';
      const bv = b[key] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedData().length / this.pageSize())),
  );

  readonly paginatedData = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const size = this.pageSize();
    return this.sortedData().slice((page - 1) * size, page * size);
  });

  readonly pageNumbers = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  readonly paginationInfo = computed(() => {
    const total = this.sortedData().length;
    const page = Math.min(this.currentPage(), this.totalPages());
    const size = this.pageSize();
    const from = Math.min((page - 1) * size + 1, total);
    const to = Math.min(page * size, total);
    return `${from}–${to} de ${total} resultado${total !== 1 ? 's' : ''}`;
  });

  // ---- Selección de filas ----
  private readonly _selectedKeys = signal<Set<unknown>>(new Set());

  readonly selectedCount = computed(() => this._selectedKeys().size);
  readonly isAllSelected = computed(
    () => this.paginatedData().length > 0 &&
      this.paginatedData().every((r) => this._selectedKeys().has(r[this.rowKey()])),
  );
  readonly isSomeSelected = computed(
    () => !this.isAllSelected() && this.paginatedData().some((r) => this._selectedKeys().has(r[this.rowKey()])),
  );

  isRowSelected(row: Row): boolean {
    return this._selectedKeys().has(row[this.rowKey()]);
  }

  toggleRow(row: Row): void {
    const key = row[this.rowKey()];
    const set = new Set(this._selectedKeys());
    if (set.has(key)) set.delete(key); else set.add(key);
    this._selectedKeys.set(set);
    this._emitSelection(set);
  }

  toggleAll(): void {
    const allKeys = new Set(this._selectedKeys());
    if (this.isAllSelected()) {
      this.paginatedData().forEach((r) => allKeys.delete(r[this.rowKey()]));
    } else {
      this.paginatedData().forEach((r) => allKeys.add(r[this.rowKey()]));
    }
    this._selectedKeys.set(allKeys);
    this._emitSelection(allKeys);
  }

  clearSelection(): void {
    this._selectedKeys.set(new Set());
    this.rowSelectionChange.emit([]);
  }

  private _emitSelection(keys: Set<unknown>): void {
    const selected = this.rows().filter((r) => keys.has(r[this.rowKey()]));
    this.rowSelectionChange.emit(selected);
  }

  // ---- Acciones de URL ----
  goToPage(page: number): void {
    this.urlState.setParam(this.pageParam(), String(Math.max(1, Math.min(page, this.totalPages()))));
  }

  sortBy(key: string): void {
    const dir = this.sortKey() === key && this.sortDir() === 'asc' ? 'desc' : 'asc';
    this.urlState.patchParams({
      [this.sortParam()]: key,
      [this.sortDirParam()]: dir,
      [this.pageParam()]: '1',
    });
  }

  onSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.urlState.patchParams({ [this.searchParam()]: q || null, [this.pageParam()]: '1' });
  }

  clearSearch(): void {
    this.urlState.patchParams({ [this.searchParam()]: null, [this.pageParam()]: '1' });
  }

  getRowKey(row: Row): unknown {
    return row[this.rowKey()] ?? JSON.stringify(row);
  }

  getCellValue(row: Row, col: NeuTableColumn): string {
    if (col.cell) return col.cell(row);
    const val = row[col.key];
    return val == null ? '—' : String(val);
  }
}
