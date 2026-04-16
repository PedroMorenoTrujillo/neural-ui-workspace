import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  Signal,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NeuTableExpandDirective } from './neu-table-expand.directive';
import { NeuUrlStateService } from '@neural-ui/core/url-state';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuSelectComponent } from '@neural-ui/core/select';
import { NeuDateInputComponent } from '@neural-ui/core/date-input';
import { NeuIconComponent } from '@neural-ui/core/icon';
import type { NeuSelectOption } from '@neural-ui/core/select';
import type {
  NeuTableAction,
  NeuTableActionEvent,
  NeuTableColumn,
  NeuTableServerState,
  NeuTableSortEntry,
} from './neu-table.types';

export type {
  NeuTableAction,
  NeuTableActionEvent,
  NeuTableBadgeConfig,
  NeuTableBadgeVariant,
  NeuTableCellType,
  NeuTableColumn,
  NeuTableServerState,
  NeuTableSortEntry,
} from './neu-table.types';

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
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    NeuInputComponent,
    NeuSelectComponent,
    NeuDateInputComponent,
    NeuIconComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.neu-table__host]': 'true',
    '[class.neu-table__host--compact]': 'density() === "compact"',
    '[class.neu-table__host--relaxed]': 'density() === "relaxed"',
  },
  template: `
    <div class="neu-table-container" [class.neu-table--sticky-header]="stickyHeader()">
      <!-- ---- Toolbar ---- -->
      @if (searchable() || title() || exportable()) {
        <div class="neu-table__toolbar">
          @if (title()) {
            <h3 class="neu-table__title">{{ title() }}</h3>
          }
          @if (searchable()) {
            <div class="neu-table__search-group">
              <div class="neu-table__search-wrapper">
                <svg
                  class="neu-table__search-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  class="neu-table__search"
                  type="search"
                  [placeholder]="searchPlaceholder()"
                  [value]="searchQuery()"
                  (input)="onSearch($event)"
                  [attr.aria-label]="searchAriaLabel()"
                />
                @if (searchQuery()) {
                  <button
                    class="neu-table__search-clear"
                    type="button"
                    [attr.aria-label]="clearSearchAriaLabel()"
                    (click)="clearSearch()"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                }
              </div>
              @if (exactMatchable()) {
                <label class="neu-table__exact-label">
                  <input
                    class="neu-table__exact-checkbox"
                    type="checkbox"
                    [checked]="exactMatch()"
                    (change)="setExactMatch($any($event.target).checked)"
                  />
                  {{ exactMatchLabel() }}
                </label>
              }
            </div>
          }
          @if (exportable() && !loading()) {
            <div class="neu-table__export-group">
              @if (exportFormats().includes('csv')) {
                <button
                  class="neu-table__export-btn"
                  type="button"
                  (click)="exportCsv()"
                  [title]="exportCsvTitle()"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    width="15"
                    height="15"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  CSV
                </button>
              }
              @if (exportFormats().includes('json')) {
                <button
                  class="neu-table__export-btn"
                  type="button"
                  (click)="exportJson()"
                  [title]="exportJsonTitle()"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    width="15"
                    height="15"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  JSON
                </button>
              }
            </div>
          }
        </div>
      }

      <!-- Barra de selección (aparece al seleccionar) -->
      @if (selectable() && selectedCount() > 0) {
        <div class="neu-table__selection-bar">
          <span>{{ selectedRowsInfo() }}</span>
          <button class="neu-table__selection-clear" type="button" (click)="clearSelection()">
            {{ clearSelectionLabel() }}
          </button>
        </div>
      }

      <!-- ---- Scroll container ---- -->
      <div
        class="neu-table__scroll-container"
        role="region"
        [attr.aria-label]="title() || tableAriaLabel()"
      >
        <table class="neu-table" [attr.aria-rowcount]="filteredData().length">
          <thead class="neu-table__head">
            <tr>
              <!-- Checkbox de selección global -->
              @if (expandable()) {
                <th class="neu-table__th neu-table__th--expand-col" scope="col"></th>
              }
              @if (selectable()) {
                <th class="neu-table__th neu-table__th--check" scope="col">
                  <input
                    type="checkbox"
                    class="neu-table__checkbox"
                    [checked]="isAllFilteredSelected()"
                    [indeterminate]="isSomeFilteredSelected()"
                    (change)="toggleAll()"
                    [attr.aria-label]="selectAllAriaLabel()"
                  />
                </th>
              }
              @if (showRowNumbers()) {
                <th class="neu-table__th neu-table__th--rn" scope="col">#</th>
              }
              @for (col of columns(); track col.key) {
                <th
                  class="neu-table__th"
                  [class.neu-table__th--sortable]="sortable() && col.sortable !== false"
                  [class.neu-table__th--sorted-asc]="
                    !multiSort() && sortKey() === col.key && sortDir() === 'asc'
                  "
                  [class.neu-table__th--sorted-desc]="
                    !multiSort() && sortKey() === col.key && sortDir() === 'desc'
                  "
                  [class]="col.cellClass ?? ''"
                  [class.neu-table__th--frozen-left]="col.frozen === 'left'"
                  [class.neu-table__th--frozen-right]="col.frozen === 'right'"
                  [class.neu-table__th--frozen-left-boundary]="isLastFrozenLeftColumn(col.key)"
                  [class.neu-table__th--frozen-right-boundary]="isFirstFrozenRightColumn(col.key)"
                  [style.left]="
                    col.frozen === 'left' ? (_frozenLeftOffsets().get(col.key) ?? 0) + 'px' : null
                  "
                  [style.width]="col.width ?? 'auto'"
                  [style.text-align]="col.align ?? 'left'"
                  scope="col"
                  (click)="sortable() && col.sortable !== false ? sortBy(col.key, $event) : null"
                >
                  @if (col.headerTemplate) {
                    <ng-container
                      [ngTemplateOutlet]="col.headerTemplate"
                      [ngTemplateOutletContext]="{ $implicit: col }"
                    />
                  } @else {
                    {{ col.header }}
                  }
                  @if (sortable() && col.sortable !== false) {
                    <span class="neu-table__sort-icon" aria-hidden="true">
                      @if (multiSort()) {
                        @let pri = getSortPriority(col.key);
                        @if (pri >= 0) {
                          <span class="neu-table__sort-priority">{{ pri + 1 }}</span>
                          {{ _sortEntries()[pri]?.dir === 'asc' ? '↑' : '↓' }}
                        } @else {
                          ↕
                        }
                      } @else {
                        @if (sortKey() === col.key) {
                          {{ sortDir() === 'asc' ? '↑' : '↓' }}
                        } @else {
                          ↕
                        }
                      }
                    </span>
                  }
                </th>
              }
            </tr>
            <!-- ── Fila de filtros de columna / Column filter row ── -->
            @if (_hasFilterableCol()) {
              <tr class="neu-table__filter-row">
                @if (expandable()) {
                  <th class="neu-table__th neu-table__th--filter-placeholder" scope="col"></th>
                }
                @if (selectable()) {
                  <th class="neu-table__th neu-table__th--filter-placeholder" scope="col"></th>
                }
                @if (showRowNumbers()) {
                  <th class="neu-table__th neu-table__th--filter-placeholder" scope="col"></th>
                }
                @for (col of columns(); track col.key) {
                  <th
                    class="neu-table__th neu-table__th--filter"
                    scope="col"
                    [style.width]="col.width ?? 'auto'"
                  >
                    @if (col.filterable) {
                      @if (col.filterType === 'select') {
                        <neu-select
                          [floatingLabel]="false"
                          [options]="_filterOpts(col)"
                          [formControl]="columnFilterControl(col.key)"
                          [attr.aria-label]="filterAriaPrefix() + ' ' + col.header"
                        />
                      } @else if (col.filterType === 'date') {
                        <neu-date-input
                          [formControl]="columnFilterControl(col.key)"
                          [attr.aria-label]="filterAriaPrefix() + ' ' + col.header"
                        />
                      } @else {
                        <neu-input
                          [floatingLabel]="false"
                          [placeholder]="filterPlaceholder()"
                          [formControl]="columnFilterControl(col.key)"
                          [attr.aria-label]="filterAriaPrefix() + ' ' + col.header"
                        />
                      }
                    }
                  </th>
                }
              </tr>
            }
          </thead>

          <tbody class="neu-table__body">
            @if (loading()) {
              <tr class="neu-table__row--loading">
                <td [attr.colspan]="totalColspan()" class="neu-table__td neu-table__td--center">
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
                <td [attr.colspan]="totalColspan()" class="neu-table__td neu-table__td--empty">
                  @if (emptyStateTemplate()) {
                    <ng-container [ngTemplateOutlet]="emptyStateTemplate()!" />
                  } @else {
                    <div class="neu-table__empty">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <p>{{ emptyMessage() }}</p>
                      @if (searchQuery()) {
                        <button
                          class="neu-table__clear-filter"
                          type="button"
                          (click)="clearSearch()"
                        >
                          {{ clearFilterLabel() }}
                        </button>
                      }
                    </div>
                  }
                </td>
              </tr>
            } @else {
              @for (row of paginatedData(); track getRowKey(row); let rowIdx = $index) {
                <tr
                  class="neu-table__row"
                  [class]="getRowClass(row)"
                  [class.neu-table__row--selected]="isRowSelected(row)"
                  [class.neu-table__row--clickable]="selectable()"
                  (click)="onRowClick(row, $event)"
                  (dblclick)="rowDblClick.emit(row)"
                >
                  @if (expandable()) {
                    <td
                      class="neu-table__td neu-table__td--expand-col"
                      (click)="$event.stopPropagation()"
                    >
                      <button
                        class="neu-table__expand-btn"
                        type="button"
                        (click)="toggleExpand(row)"
                        [class.neu-table__expand-btn--open]="isRowExpanded(row)"
                        [attr.aria-expanded]="isRowExpanded(row)"
                        [attr.aria-label]="expandRowAriaLabel()"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </td>
                  }
                  @if (selectable()) {
                    <td
                      class="neu-table__td neu-table__th--check"
                      (click)="$event.stopPropagation()"
                    >
                      <input
                        type="checkbox"
                        class="neu-table__checkbox"
                        [checked]="isRowSelected(row)"
                        (change)="toggleRow(row)"
                        [attr.aria-label]="selectRowAriaLabel()"
                      />
                    </td>
                  }
                  @if (showRowNumbers()) {
                    <td class="neu-table__td neu-table__td--rn">
                      {{ (currentPage() - 1) * effectivePageSize() + rowIdx + 1 }}
                    </td>
                  }
                  @for (col of columns(); track col.key) {
                    <td
                      class="neu-table__td"
                      [class]="col.cellClass ?? ''"
                      [class.neu-table__td--frozen-left]="col.frozen === 'left'"
                      [class.neu-table__td--frozen-right]="col.frozen === 'right'"
                      [class.neu-table__td--frozen-left-boundary]="isLastFrozenLeftColumn(col.key)"
                      [class.neu-table__td--frozen-right-boundary]="
                        isFirstFrozenRightColumn(col.key)
                      "
                      [style.left]="
                        col.frozen === 'left'
                          ? (_frozenLeftOffsets().get(col.key) ?? 0) + 'px'
                          : null
                      "
                      [style.text-align]="col.align ?? 'left'"
                    >
                      @if (col.cellTemplate) {
                        <ng-container
                          [ngTemplateOutlet]="col.cellTemplate"
                          [ngTemplateOutletContext]="{ $implicit: row, row: row, column: col }"
                        />
                      } @else if (col.type === 'badge') {
                        @let badgeVal = getCellValue(row, col);
                        @let badgeCfg = col.badgeMap?.[badgeVal];
                        <span
                          class="neu-table__cell-badge neu-table__cell-badge--{{
                            badgeCfg?.variant ?? 'default'
                          }}"
                        >
                          {{ badgeCfg?.label ?? badgeVal }}
                        </span>
                      } @else if (col.type === 'link') {
                        <a
                          class="neu-table__cell-link"
                          [href]="col.linkHref ? col.linkHref(row) : '#'"
                          [target]="col.linkTarget ?? '_self'"
                          (click)="$event.stopPropagation()"
                          >{{ getCellValue(row, col) }}</a
                        >
                      } @else if (col.type === 'actions') {
                        <div class="neu-table__actions">
                          @for (action of col.actions ?? []; track action.key) {
                            @if (action.show === undefined || action.show(row)) {
                              @if (isConfirmPending(row, action)) {
                                <span class="neu-table__action-confirm">
                                  <span>{{ action.confirm }}</span>
                                  <button
                                    class="neu-table__action-btn neu-table__action-btn--danger"
                                    type="button"
                                    (click)="handleAction(row, action); $event.stopPropagation()"
                                  >
                                    Sí
                                  </button>
                                  <button
                                    class="neu-table__action-btn"
                                    type="button"
                                    (click)="cancelConfirm(); $event.stopPropagation()"
                                  >
                                    No
                                  </button>
                                </span>
                              } @else {
                                <button
                                  class="neu-table__action-btn neu-table__action-btn--{{
                                    action.variant ?? 'ghost'
                                  }}"
                                  type="button"
                                  [disabled]="action.disabled ? action.disabled(row) : false"
                                  [title]="action.label"
                                  (click)="handleAction(row, action); $event.stopPropagation()"
                                >
                                  @if (action.icon.startsWith('lucide')) {
                                    <neu-icon
                                      class="neu-table__action-icon"
                                      [name]="action.icon"
                                      size="1rem"
                                      aria-hidden="true"
                                    />
                                  } @else {
                                    <span class="neu-table__action-icon" aria-hidden="true">{{
                                      action.icon
                                    }}</span>
                                  }
                                  <span class="sr-only">{{ action.label }}</span>
                                </button>
                              }
                            }
                          }
                        </div>
                      } @else {
                        {{ getCellValue(row, col) }}
                      }
                    </td>
                  }
                </tr>
                @if (expandable() && isRowExpanded(row)) {
                  <tr class="neu-table__row-expand-detail">
                    <td [attr.colspan]="totalColspan()" class="neu-table__td--expand-panel">
                      <div class="neu-table__expand-content">
                        @if (expandTemplate(); as tpl) {
                          <ng-container
                            [ngTemplateOutlet]="tpl.templateRef"
                            [ngTemplateOutletContext]="{ $implicit: row }"
                          />
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            }
          </tbody>
          @if (footerRow()) {
            <tfoot class="neu-table__foot">
              <tr class="neu-table__footer-row">
                @if (expandable()) {
                  <td class="neu-table__td"></td>
                }
                @if (selectable()) {
                  <td class="neu-table__td"></td>
                }
                @if (showRowNumbers()) {
                  <td class="neu-table__td"></td>
                }
                @for (col of columns(); track col.key) {
                  <td
                    class="neu-table__td neu-table__td--footer"
                    [style.text-align]="col.align ?? 'left'"
                  >
                    {{ footerRow()![col.key] !== undefined ? footerRow()![col.key] : '' }}
                  </td>
                }
              </tr>
            </tfoot>
          }
        </table>
      </div>

      <!-- ---- Footer ---- -->
      @if (!loading() && filteredData().length > 0) {
        <div class="neu-table__footer">
          @if (pageSizeOptions().length > 0) {
            <div class="neu-table__page-size">
              <label class="neu-table__page-size-label">{{ pageSizeLabel() }}</label>
              <neu-select
                class="neu-table__page-size-select"
                [floatingLabel]="false"
                [options]="_pageSizeOptions()"
                [formControl]="_pageSizeControl"
                [attr.aria-label]="pageSizeAriaLabel()"
                size="sm"
              />
            </div>
          }
          <span class="neu-table__info">
            {{ paginationInfo() }}
          </span>
          @if (totalPages() > 1) {
            <nav class="neu-table__pagination" [attr.aria-label]="paginationAriaLabel()">
              <button
                class="neu-table__page-btn"
                [disabled]="currentPage() === 1"
                (click)="goToPage(currentPage() - 1)"
                [attr.aria-label]="previousPageAriaLabel()"
                type="button"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
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
                >
                  {{ page }}
                </button>
              }
              <button
                class="neu-table__page-btn"
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(currentPage() + 1)"
                [attr.aria-label]="nextPageAriaLabel()"
                type="button"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
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
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _urlState = inject(NeuUrlStateService);
  private readonly _platformId = inject(PLATFORM_ID);

  readonly expandTemplate = contentChild(NeuTableExpandDirective);

  // ── Inputs de datos ─────────────────────────────────────────────────
  readonly columns = input<NeuTableColumn[]>([]);
  readonly data = input<object[]>([]);
  readonly pageSize = input<number>(10);
  readonly loading = input<boolean>(false);
  readonly title = input<string>('');
  readonly emptyMessage = input<string>('No results found');
  readonly skeletonRows = input<number[]>([1, 2, 3, 4, 5]);

  // ── Inputs de funcionalidad ──────────────────────────────────────────
  readonly searchable = input<boolean>(true);
  readonly searchPlaceholder = input<string>('Search...');
  readonly exactMatchable = input<boolean>(false);
  readonly exactMatchLabel = input<string>('Exact match');
  readonly searchAriaLabel = input<string>('Search table');
  readonly clearSearchAriaLabel = input<string>('Clear search');
  readonly clearFilterLabel = input<string>('Clear filter');
  readonly previousPageAriaLabel = input<string>('Previous page');
  readonly nextPageAriaLabel = input<string>('Next page');
  readonly pageSizeLabel = input<string>('Rows:');
  readonly pageSizeAriaLabel = input<string>('Rows per page');
  readonly paginationAriaLabel = input<string>('Pagination');
  readonly exportCsvTitle = input<string>('Export CSV');
  readonly exportJsonTitle = input<string>('Export JSON');
  readonly clearSelectionLabel = input<string>('Clear selection');
  readonly selectionSummaryLabel = input<string>('selected');
  readonly tableAriaLabel = input<string>('Data table');
  readonly selectAllAriaLabel = input<string>('Select all filtered rows');
  readonly selectRowAriaLabel = input<string>('Select row');
  readonly expandRowAriaLabel = input<string>('Expand row');
  readonly filterPlaceholder = input<string>('Filter...');
  readonly filterAriaPrefix = input<string>('Filter by');
  readonly allFilterOptionLabel = input<string>('All');
  readonly ofLabel = input<string>('of');
  readonly resultLabelSingular = input<string>('result');
  readonly resultLabelPlural = input<string>('results');
  readonly sortable = input<boolean>(false);
  readonly selectable = input<boolean>(false);
  readonly expandable = input<boolean>(false);
  readonly exportable = input<boolean>(false);
  readonly exportFileName = input<string>('export');
  readonly pageSizeOptions = input<number[]>([]);
  readonly stickyHeader = input<boolean>(false);
  readonly rowKey = input<string>('id');

  // ── Inputs nuevos v1.3.0 ──────────────────────────────────────────────
  readonly density = input<'compact' | 'normal' | 'relaxed'>('normal');
  readonly showRowNumbers = input<boolean>(false);
  readonly rowClass = input<((row: Row) => string) | undefined>(undefined);
  readonly footerRow = input<Record<string, string | number> | undefined>(undefined);
  readonly emptyStateTemplate = input<TemplateRef<void> | undefined>(undefined);
  readonly serverSide = input<boolean>(false);
  readonly totalItems = input<number | undefined>(undefined);
  readonly multiSort = input<boolean>(false);
  readonly exportFormats = input<('csv' | 'json')[]>(['csv']);
  readonly exportColumns = input<string[]>([]);

  // ── URL params ────────────────────────────────────────────────────────
  readonly pageParam = input<string>('page');
  readonly searchParam = input<string>('q');
  readonly sortParam = input<string>('sort');
  readonly sortDirParam = input<string>('sortDir');
  /** Param used to persist multi-sort state in the URL / Param para persistir multisort en la URL */
  readonly multiSortParam = input<string>('msort');
  /**
   * Activa o desactiva la sincronización de estado con los queryParams de la URL.
   * Cuando es false, la paginación, búsqueda y ordenación se gestionan con
   * señales internas sin tocar la URL del navegador.
   *
   * Enables or disables URL query-param synchronization.
   * When false, pagination, search and sort are managed with internal signals
   * and the browser URL is never modified.
   */
  readonly useUrlState = input<boolean>(true);

  // ── Outputs ───────────────────────────────────────────────────────────
  readonly selectionChange = output<Row[]>();
  readonly rowClick = output<Row>();
  readonly rowDblClick = output<Row>();
  readonly actionClick = output<NeuTableActionEvent<Row>>();
  readonly serverStateChange = output<NeuTableServerState>();
  readonly searchChange = output<string>();

  // ── Estado interno (usado cuando useUrlState = false) ─────────────────
  // Internal state signals (used when useUrlState = false)
  private readonly _internalPage = signal(1);
  private readonly _internalSearch = signal('');
  private readonly _internalSortKey = signal('');
  private readonly _internalSortDir = signal<'asc' | 'desc'>('asc');
  private readonly _internalMultiSort = signal('');

  // ── URL State ─────────────────────────────────────────────────────────
  private readonly _urlParamSignals = new Map<string, Signal<string | null>>();

  private _getUrlParamSignal(key: string): Signal<string | null> {
    let paramSignal = this._urlParamSignals.get(key);
    if (!paramSignal) {
      paramSignal = this._urlState.getParam(key);
      this._urlParamSignals.set(key, paramSignal);
    }
    return paramSignal;
  }

  private _readUrlParam(key: string): string | null {
    return this._getUrlParamSignal(key)();
  }

  readonly currentPage = computed(() => {
    if (!this.useUrlState()) return this._internalPage();
    const raw = this._readUrlParam(this.pageParam());
    const n = Number(raw);
    return !raw || isNaN(n) || n < 1 ? 1 : n;
  });

  readonly searchQuery = computed(() => {
    if (!this.useUrlState()) return this._internalSearch();
    return this._readUrlParam(this.searchParam()) ?? '';
  });

  readonly sortKey = computed(() => {
    if (!this.useUrlState()) return this._internalSortKey();
    return this._readUrlParam(this.sortParam()) ?? '';
  });

  readonly sortDir = computed<'asc' | 'desc'>(() => {
    if (!this.useUrlState()) return this._internalSortDir();
    const d = this._readUrlParam(this.sortDirParam());
    return d === 'desc' ? 'desc' : 'asc';
  });

  // ---- Pipeline de datos / Data pipeline ----
  private readonly rows = computed(() => asRows(this.data()));

  // ── Estado interno ────────────────────────────────────────────────────
  private readonly _exactMatch = signal(false);
  readonly exactMatch = this._exactMatch.asReadonly();

  /**
   * Multi-sort entries derived from URL param or internal state.
   * Entradas de multisort derivadas del param de URL o del estado interno.
   */
  readonly _sortEntries = computed<NeuTableSortEntry[]>(() => {
    if (!this.multiSort()) return [];
    const param = this.useUrlState()
      ? this._readUrlParam(this.multiSortParam())
      : this._internalMultiSort();
    if (!param) return [];
    return param.split(',').flatMap((chunk) => {
      const [key, dir] = chunk.split(':');
      if (!key) return [];
      return [{ key, dir: (dir === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc' }];
    });
  });
  readonly _columnFilters = signal<Record<string, unknown>>({});
  readonly _pageSizeControl = new FormControl('', { nonNullable: true });
  private readonly _columnFilterControls = new Map<string, FormControl<string>>();
  /** True when at least one column has filterable:true / True si alguna columna tiene filterable:true */
  readonly _hasFilterableCol = computed(() => this.columns().some((c) => c.filterable));

  /** Convierte filterOptions de string[] a NeuSelectOption[] con opción "Todos" al inicio.
   *  Converts filterOptions from string[] to NeuSelectOption[] with a leading "All" option. */
  _filterOpts(col: NeuTableColumn): NeuSelectOption[] {
    return [
      { label: this.allFilterOptionLabel(), value: '' },
      ...(col.filterOptions ?? []).map((o) => ({ label: o, value: o })),
    ];
  }

  readonly _pageSizeOptions = computed<NeuSelectOption[]>(() =>
    this.pageSizeOptions().map((size) => ({ label: String(size), value: String(size) })),
  );

  constructor() {
    this._pageSizeControl.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value) => this.onPageSizeChange(value));

    effect(() => {
      const nextSize = String(this.effectivePageSize());
      if (this._pageSizeControl.value !== nextSize) {
        this._pageSizeControl.setValue(nextSize, { emitEvent: false });
      }
    });

    effect(() => {
      const filters = this._columnFilters();
      for (const col of this.columns()) {
        if (!col.filterable) continue;
        const control = this.columnFilterControl(col.key);
        const nextValue = String(filters[col.key] ?? '');
        if (control.value !== nextValue) {
          control.setValue(nextValue, { emitEvent: false });
        }
      }
    });
  }

  private readonly _confirmPending = signal<{ rowKey: unknown; actionKey: string } | null>(null);

  // ── Pipeline de datos ─────────────────────────────────────────────────
  private readonly _rows = computed(() => asRows(this.data()));

  readonly filteredData = computed<Row[]>(() => {
    if (this.serverSide()) return this._rows();
    const rows = this._rows();
    const colFilters = this._columnFilters();
    const q = this.searchQuery().trim().toLowerCase();
    const exact = this._exactMatch();
    const matches = (text: string) =>
      exact ? text.toLowerCase() === q : text.toLowerCase().includes(q);
    return rows.filter((row) => {
      const passesGlobal =
        !q ||
        this.columns().some((col) => {
          const rawVal = String(row[col.key] ?? '');
          const displayVal = col.cell
            ? col.cell(row)
            : col.type === 'badge' && col.badgeMap?.[rawVal]?.label
              ? col.badgeMap[rawVal].label!
              : rawVal;
          return matches(displayVal) || matches(rawVal);
        });
      if (!passesGlobal) return false;
      for (const [colKey, filterVal] of Object.entries(colFilters)) {
        if (filterVal === null || filterVal === '' || filterVal === undefined) continue;
        if (
          !String(row[colKey] ?? '')
            .toLowerCase()
            .includes(String(filterVal).toLowerCase())
        )
          return false;
      }
      return true;
    });
  });

  readonly sortedData = computed<Row[]>(() => {
    if (this.serverSide()) return this.filteredData();
    const data = [...this.filteredData()];
    if (!this.sortable()) return data;
    if (this.multiSort() && this._sortEntries().length > 0) {
      const entries = this._sortEntries();
      return data.sort((a, b) => {
        for (const entry of entries) {
          const cmp = String(a[entry.key] ?? '').localeCompare(
            String(b[entry.key] ?? ''),
            undefined,
            { numeric: true },
          );
          if (cmp !== 0) return entry.dir === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
    }
    const key = this.sortKey();
    if (!key) return data;
    const dir = this.sortDir();
    return data.sort((a, b) => {
      const cmp = String(a[key] ?? '').localeCompare(String(b[key] ?? ''), undefined, {
        numeric: true,
      });
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  private readonly _dynamicPageSize = signal<number | null>(null);
  readonly effectivePageSize = computed(() => this._dynamicPageSize() ?? this.pageSize());

  readonly totalPages = computed(() => {
    const total =
      this.serverSide() && this.totalItems() != null
        ? this.totalItems()!
        : this.filteredData().length;
    return Math.max(1, Math.ceil(total / this.effectivePageSize()));
  });

  readonly paginatedData = computed(() => {
    if (this.serverSide()) return this._rows();
    const page = Math.min(this.currentPage(), this.totalPages());
    const size = this.effectivePageSize();
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
    const total =
      this.serverSide() && this.totalItems() != null
        ? this.totalItems()!
        : this.filteredData().length;
    const page = Math.min(this.currentPage(), this.totalPages());
    const size = this.effectivePageSize();
    const from = Math.min((page - 1) * size + 1, total);
    const to = Math.min(page * size, total);
    return `${from}\u2013${to} ${this.ofLabel()} ${total} ${
      total === 1 ? this.resultLabelSingular() : this.resultLabelPlural()
    }`;
  });

  readonly totalColspan = computed(() => {
    let cols = this.columns().length;
    if (this.selectable()) cols++;
    if (this.expandable()) cols++;
    if (this.showRowNumbers()) cols++;
    return cols;
  });

  /** Calcula el offset izquierdo acumulado para columnas frozen-left múltiples.
   *  Calculates cumulative left offset for multiple frozen-left columns. */
  readonly _frozenLeftOffsets = computed(() => {
    const offsets = new Map<string, number>();
    let leftPx = 0;
    for (const col of this.columns()) {
      if (col.frozen === 'left') {
        offsets.set(col.key, leftPx);
        if (col.width && col.width !== 'auto') {
          const px = parseFloat(col.width);
          if (!isNaN(px)) leftPx += px;
        }
      }
    }
    return offsets;
  });

  readonly _lastFrozenLeftKey = computed(() => {
    const frozenLeft = this.columns().filter((col) => col.frozen === 'left');
    return frozenLeft.at(-1)?.key ?? null;
  });

  readonly _firstFrozenRightKey = computed(() => {
    const frozenRight = this.columns().filter((col) => col.frozen === 'right');
    return frozenRight[0]?.key ?? null;
  });

  isLastFrozenLeftColumn(key: string): boolean {
    return this._lastFrozenLeftKey() === key;
  }

  isFirstFrozenRightColumn(key: string): boolean {
    return this._firstFrozenRightKey() === key;
  }

  // ── Expansión de filas ────────────────────────────────────────────────
  private readonly _expandedKeys = signal<Set<unknown>>(new Set());

  isRowExpanded(row: Row): boolean {
    return this._expandedKeys().has(this.getRowKey(row));
  }

  toggleExpand(row: Row): void {
    const key = this.getRowKey(row);
    const set = new Set(this._expandedKeys());
    if (set.has(key)) set.delete(key);
    else set.add(key);
    this._expandedKeys.set(set);
  }

  // ── Selección ─────────────────────────────────────────────────────────
  private readonly _selectedKeys = signal<Set<unknown>>(new Set());

  readonly selectedCount = computed(() => this._selectedKeys().size);
  readonly selectedRowsInfo = computed(
    () => `${this.selectedCount()} ${this.selectionSummaryLabel()}`,
  );

  /**
   * TRUE cuando TODOS los registros que pasan el filtro activo están seleccionados.
   * A diferencia de una selección global, actúa solo sobre el subconjunto filtrado.
   */
  readonly isAllFilteredSelected = computed(() => {
    const filtered = this.filteredData();
    return (
      filtered.length > 0 && filtered.every((r) => this._selectedKeys().has(this.getRowKey(r)))
    );
  });

  readonly isSomeFilteredSelected = computed(
    () =>
      this.filteredData().some((r) => this._selectedKeys().has(this.getRowKey(r))) &&
      !this.isAllFilteredSelected(),
  );

  isRowSelected(row: Row): boolean {
    return this._selectedKeys().has(this.getRowKey(row));
  }

  toggleRow(row: Row): void {
    const key = this.getRowKey(row);
    const set = new Set(this._selectedKeys());
    if (set.has(key)) set.delete(key);
    else set.add(key);
    this._selectedKeys.set(set);
    this._emitSelection(set);
  }

  /** Selecciona/deselecciona SOLO los datos filtrados activos. */
  toggleAll(): void {
    const set = new Set(this._selectedKeys());
    if (this.isAllFilteredSelected()) {
      this.filteredData().forEach((r) => set.delete(this.getRowKey(r)));
    } else {
      this.filteredData().forEach((r) => set.add(this.getRowKey(r)));
    }
    this._selectedKeys.set(set);
    this._emitSelection(set);
  }

  clearSelection(): void {
    this._selectedKeys.set(new Set());
    this.selectionChange.emit([]);
  }

  private _emitSelection(keys: Set<unknown>): void {
    const selected = this._rows().filter((r) => keys.has(this.getRowKey(r)));
    this.selectionChange.emit(selected);
  }

  // ── Navegación ────────────────────────────────────────────────────────
  goToPage(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages()));
    if (this.serverSide()) {
      this._emitServerState({ page: clamped });
    } else if (this.useUrlState()) {
      this._urlState.setParam(this.pageParam(), String(clamped));
    } else {
      this._internalPage.set(clamped);
    }
  }

  sortBy(key: string, event?: MouseEvent): void {
    if (this.multiSort() && event?.shiftKey) {
      // Shift+click: toggle or add column / Shift+click: alterna o añade columna
      const entries = [...this._sortEntries()];
      const idx = entries.findIndex((e) => e.key === key);
      if (idx >= 0) {
        entries[idx] = { key, dir: entries[idx].dir === 'asc' ? 'desc' : 'asc' };
      } else {
        entries.push({ key, dir: 'asc' });
      }
      const val = entries.map((e) => `${e.key}:${e.dir}`).join(',') || null;
      if (this.useUrlState()) {
        this._urlState.setParam(this.multiSortParam(), val);
      } else {
        this._internalMultiSort.set(val ?? '');
      }
    } else if (this.multiSort()) {
      // Single click: replace sort / Click simple: reemplaza el orden
      const current = this._sortEntries().find((e) => e.key === key);
      const dir: 'asc' | 'desc' = current?.dir === 'asc' ? 'desc' : 'asc';
      const val = `${key}:${dir}`;
      if (this.useUrlState()) {
        this._urlState.setParam(this.multiSortParam(), val);
      } else {
        this._internalMultiSort.set(val);
      }
    } else {
      const dir = this.sortKey() === key && this.sortDir() === 'asc' ? 'desc' : 'asc';
      if (this.serverSide()) {
        this._emitServerState({ sortKey: key, sortDir: dir, page: 1 });
      } else if (this.useUrlState()) {
        this._urlState.patchParams({
          [this.sortParam()]: key,
          [this.sortDirParam()]: dir,
          [this.pageParam()]: '1',
        });
      } else {
        this._internalSortKey.set(key);
        this._internalSortDir.set(dir);
        this._internalPage.set(1);
      }
    }
  }

  onRowClick(row: Row, _event: MouseEvent): void {
    if (this.selectable()) this.toggleRow(row);
    this.rowClick.emit(row);
  }

  onSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.searchChange.emit(q);
    if (this.serverSide()) {
      this._emitServerState({ search: q, page: 1 });
    } else if (this.useUrlState()) {
      this._urlState.patchParams({ [this.searchParam()]: q || null, [this.pageParam()]: '1' });
    } else {
      this._internalSearch.set(q);
      this._internalPage.set(1);
    }
  }

  clearSearch(): void {
    if (this.serverSide()) {
      this._emitServerState({ search: '', page: 1 });
    } else if (this.useUrlState()) {
      this._urlState.patchParams({ [this.searchParam()]: null, [this.pageParam()]: '1' });
    } else {
      this._internalSearch.set('');
      this._internalPage.set(1);
    }
  }

  onPageSizeChange(value: string | number | { target?: { value?: unknown } } | null): void {
    const normalizedValue =
      value && typeof value === 'object' ? (value.target?.value ?? null) : value;
    const size = Number(normalizedValue);
    if (!Number.isFinite(size) || size <= 0) return;
    this._dynamicPageSize.set(size);
    if (this.serverSide()) {
      this._emitServerState({ pageSize: size, page: 1 });
    } else if (this.useUrlState()) {
      this._urlState.patchParams({ [this.pageParam()]: '1' });
    } else {
      this._internalPage.set(1);
    }
  }

  setExactMatch(value: boolean): void {
    this._exactMatch.set(value);
  }

  setColumnFilter(colKey: string, value: unknown): void {
    // Column filters are local signal — no URL update avoids scroll jumps.
    // paginatedData already clamps currentPage to totalPages automatically.
    // Los filtros de columna son locales — sin URL para evitar saltos de scroll.
    // paginatedData ya adapta currentPage a totalPages automáticamente.
    this._columnFilters.update((f) => ({ ...f, [colKey]: value }));
    if (this.serverSide()) {
      this._emitServerState({
        columnFilters: { ...this._columnFilters(), [colKey]: value },
        page: 1,
      });
    }
  }

  clearColumnFilters(): void {
    this._columnFilters.set({});
  }

  // ── Actions ───────────────────────────────────────────────────────────
  isConfirmPending(row: Row, action: NeuTableAction<Row>): boolean {
    const p = this._confirmPending();
    return p !== null && p.rowKey === this.getRowKey(row) && p.actionKey === action.key;
  }

  handleAction(row: Row, action: NeuTableAction<Row>): void {
    if (action.confirm) {
      const p = this._confirmPending();
      const rowKey = this.getRowKey(row);
      if (p && p.rowKey === rowKey && p.actionKey === action.key) {
        this._confirmPending.set(null);
        this.actionClick.emit({ action, row });
      } else {
        this._confirmPending.set({ rowKey, actionKey: action.key });
      }
    } else {
      this.actionClick.emit({ action, row });
    }
  }

  cancelConfirm(): void {
    this._confirmPending.set(null);
  }

  // ── Export ────────────────────────────────────────────────────────────
  exportCsv(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const cols = this._getExportColumns();
    const headers = cols.map((c) => `"${c.header.replace(/"/g, '""')}"`);
    const rows = this.filteredData().map((row) =>
      cols.map((col) => `"${this.getCellValue(row, col).replace(/"/g, '""')}"`),
    );
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\r\n');
    this._downloadBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      `${this.exportFileName()}.csv`,
    );
  }

  exportJson(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const cols = this._getExportColumns();
    const data = this.filteredData().map((row) => {
      const obj: Record<string, string> = {};
      cols.forEach((col) => (obj[col.key] = this.getCellValue(row, col)));
      return obj;
    });
    this._downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      `${this.exportFileName()}.json`,
    );
  }

  private _getExportColumns(): NeuTableColumn[] {
    const keys = this.exportColumns();
    const all = this.columns().filter((c) => c.type !== 'actions');
    return keys.length ? all.filter((c) => keys.includes(c.key)) : all;
  }

  private _downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Utilidades ────────────────────────────────────────────────────────
  getRowKey(row: Row): unknown {
    return row[this.rowKey()] ?? JSON.stringify(row);
  }

  getRowClass(row: Row): string {
    return this.rowClass()?.(row) ?? '';
  }

  getCellValue(row: Row, col: NeuTableColumn): string {
    if (col.cell) return col.cell(row);
    const val = row[col.key];
    if (val == null) return '—';
    const locale = col.locale ?? 'es-ES';
    switch (col.type) {
      case 'date': {
        const d = val instanceof Date ? val : new Date(String(val));
        return isNaN(d.getTime())
          ? String(val)
          : d.toLocaleDateString(
              locale,
              col.dateFormat ?? { day: '2-digit', month: '2-digit', year: 'numeric' },
            );
      }
      case 'number':
        return new Intl.NumberFormat(locale, col.numberFormat).format(Number(val));
      case 'currency':
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: col.currencyCode ?? 'EUR',
          ...col.numberFormat,
        }).format(Number(val));
      default:
        return String(val);
    }
  }

  getSortPriority(key: string): number {
    if (!this.multiSort()) return -1;
    return this._sortEntries().findIndex((e) => e.key === key);
  }

  columnFilterControl(key: string): FormControl<string> {
    let control = this._columnFilterControls.get(key);
    if (!control) {
      control = new FormControl(String(this.getColumnFilterValue(key)), {
        nonNullable: true,
      });
      control.valueChanges
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe((value) => this.setColumnFilter(key, value));
      this._columnFilterControls.set(key, control);
    }
    return control;
  }

  getColumnFilterValue(key: string): unknown {
    return this._columnFilters()[key] ?? '';
  }

  private _emitServerState(patch: Partial<NeuTableServerState>): void {
    const current: NeuTableServerState = {
      page: this.currentPage(),
      pageSize: this.effectivePageSize(),
      search: this.searchQuery(),
      sortKey: this.sortKey(),
      sortDir: this.sortDir(),
      sortEntries: this._sortEntries(),
      columnFilters: this._columnFilters(),
    };
    this.serverStateChange.emit({ ...current, ...patch });
  }
}
