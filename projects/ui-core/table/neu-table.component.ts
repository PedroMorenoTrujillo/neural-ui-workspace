import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  Signal,
  TemplateRef,
  ViewEncapsulation,
  WritableSignal,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';
import type { Subscription } from 'rxjs';
import { NeuTableExpandDirective } from './neu-table-expand.directive';
import { NeuTableToolbarDirective } from './neu-table-toolbar.directive';
import {
  NeuTableFilterTemplateDirective,
  type NeuTableFilterTemplateContext,
} from './neu-table-filter-template.directive';
import {
  buildNeuTableFilterState,
  isNeuTableFilterValueEmpty,
  matchesNeuTableFilter,
  normalizeNeuTableAppliedFilterValue,
  resolveNeuTableFilterMatchMode,
} from './neu-table-filter.engine';
import { NeuUrlStateService } from '@neural-ui/core/url-state';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuNumberInputComponent } from '@neural-ui/core/number-input';
import { NeuSelectComponent } from '@neural-ui/core/select';
import { NeuMultiselectComponent } from '@neural-ui/core/multiselect';
import { NeuDateInputComponent } from '@neural-ui/core/date-input';
import { NeuIconComponent } from '@neural-ui/core/icon';
import { NeuCheckboxComponent } from '@neural-ui/core/checkbox';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuInlineEditorComponent, NeuInlineEditorType } from '@neural-ui/core/inline-editor';
import type { NeuSelectOption } from '@neural-ui/core/select';
import type {
  NeuOptionDisabledAccessor,
  NeuOptionLabelAccessor,
  NeuOptionValueAccessor,
} from '@neural-ui/core/option-api';
import type {
  NeuTableAction,
  NeuTableAdvancedFilterMode,
  NeuTableAdvancedFilterTexts,
  NeuTableActionEvent,
  NeuTableCellEditEvent,
  NeuTableColumn,
  NeuTableColumnReorderEvent,
  NeuTableLayout,
  NeuTableRow,
  NeuTableRowKey,
  NeuTableSelectionAction,
  NeuTableSelectionActionEvent,
  NeuTableDatePoint,
  NeuTableDateRangeValue,
  NeuTableFilterConfig,
  NeuTableFilterKind,
  NeuTableFilterMatchMode,
  NeuTableFilterState,
  NeuTableServerState,
  NeuTableSortEntry,
} from './neu-table.types';
import {
  NeuTableAdvancedFilterController,
  isNeuTableDateRange,
  neuTableAdvancedFilterControlKind,
  neuTableAdvancedFilterDatePrecision,
  neuTableAdvancedFilterModes,
  neuTableDateFilterValue,
  neuTableDateInputControlValue,
  neuTableDateRangeControlValue,
  neuTableDateRangeFilterValue,
  neuTableInstantFilterValue,
  neuTableInstantRangeControlValue,
  neuTableNumberRangeValue,
} from './neu-table-advanced-filter.controller';

export type {
  NeuTableAction,
  NeuTableActionEvent,
  NeuTableAdvancedFilterMode,
  NeuTableAdvancedFilterTexts,
  NeuTableBadgeConfig,
  NeuTableBadgeVariant,
  NeuTableCellEditEvent,
  NeuTableCellType,
  NeuTableColumn,
  NeuTableColumnReorderEvent,
  NeuTableLayout,
  NeuTableSelectionAction,
  NeuTableSelectionActionEvent,
  NeuTableDatePoint,
  NeuTableDateRangeValue,
  NeuTableFilterConfig,
  NeuTableFilterKind,
  NeuTableFilterMatchMode,
  NeuTableFilterState,
  NeuTableNumberRangeValue,
  NeuTableServerState,
  NeuTableSortEntry,
  NeuTableRow,
  NeuTableRowKey,
} from './neu-table.types';

type NeuTableRuntimeRow<T extends object> = T & Record<string, unknown>;

type NeuTablePageEntry<T extends object> =
  | { kind: 'group'; key: string; label: string; count: number }
  | { kind: 'row'; key: unknown; row: NeuTableRuntimeRow<T>; rowIndex: number };

type NeuTableData<T> = [T] extends [Record<string, unknown>]
  ? readonly T[] | readonly object[]
  : readonly T[];

type InternalAppliedFilterOperator = 'and' | 'or';

interface InternalAppliedFilterConstraint {
  mode?: NeuTableFilterMatchMode;
  value: unknown;
  projectionValue?: unknown;
}

interface InternalAppliedColumnFilter {
  operator: InternalAppliedFilterOperator;
  constraints: readonly InternalAppliedFilterConstraint[];
}

interface InternalFilterColumnSignature {
  kind: NeuTableFilterKind | 'legacy' | 'none';
  mode?: NeuTableFilterMatchMode;
  datePrecision?: 'date-only' | 'instant';
  optionValue?: unknown;
  controlKind: string;
}

interface InternalResolvedAppliedColumnFilter<T> {
  column: NeuTableColumn<T>;
  operator: InternalAppliedFilterOperator;
  constraints: readonly InternalAppliedFilterConstraint[];
}

type InternalResolvedAdvancedFilterTexts = Required<NeuTableAdvancedFilterTexts>;

const _NEU_TABLE_ADVANCED_FILTER_TEXTS: InternalResolvedAdvancedFilterTexts = {
  openFilter: 'Open filter for {column}',
  filterTitle: 'Filter {column}',
  closeFilter: 'Close filter for {column}',
  operator: 'Operator',
  matchAll: 'Match all',
  matchAny: 'Match any',
  matchMode: 'Match mode',
  value: 'Value',
  from: 'From',
  to: 'To',
  all: 'All',
  yes: 'Yes',
  no: 'No',
  clear: 'Clear',
  cancel: 'Cancel',
  apply: 'Apply',
  filterActive: 'Filter active',
  addRule: 'Add rule',
  removeRule: 'Remove rule',
  rule: 'Rule {count}',
  ruleActive: '1 filter rule active',
  rulesActive: '{count} filter rules active',
  multipleRulesActive: 'Multiple rules are active. Server-side editing is unavailable.',
  contains: 'Contains',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  equals: 'Is',
  notEquals: 'Is not',
  notContains: 'Does not contain',
  lt: 'Less than',
  lte: 'At most',
  gt: 'Greater than',
  gte: 'At least',
  between: 'Between',
  is: 'Is',
  isNot: 'Is not',
  before: 'Before',
  after: 'After',
};

let _neuTableFilterOverlayIdSeq = 0;

const _NEU_TABLE_FILTER_SESSION_OPENED = 'neu-table-filter-session-opened';
const _NEU_TABLE_FILTER_CHILD_TRIGGER =
  '.neu-select__trigger, .neu-multiselect__trigger, .neu-date-input__trigger, .neu-drp__trigger';

export type NeuTableColumnInput<T extends object> =
  | NeuTableColumn<T>
  | NeuTableColumn<T, string>
  /**
   * Angular checks a generic standalone component in templates at its default
   * instantiation, so a typed callback such as (row: User) => string is not
   * assignable to the legacy Record<string, unknown> callback under strict
   * function variance. The minimum structural column contract keeps this
   * bridge column-only and rejects `{}` without widening to object.
   */
  | Pick<NeuTableColumn<NeuTableRow, string>, 'key' | 'header'>;

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
    OverlayModule,
    ScrollingModule,
    NeuInputComponent,
    NeuNumberInputComponent,
    NeuSelectComponent,
    NeuMultiselectComponent,
    NeuDateInputComponent,
    NeuIconComponent,
    NeuCheckboxComponent,
    NeuButtonComponent,
    NeuInlineEditorComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.neu-table__host]': 'true',
    '[class.neu-table__host--compact]': 'density() === "compact"',
    '[class.neu-table__host--relaxed]': 'density() === "relaxed"',
  },
  template: `
    <!--
      E2 boundary: this content is independent from the desktop connected-overlay host so a
      future mobile dialog can render the same surface without moving filter state into the host.
    -->
    <ng-template #filterOverlayContent let-column>
      <div class="neu-table__filter-overlay-content">
        @if (_filterDraftKind()) {
          @if (_filterDraftReadOnly()) {
            <p class="neu-table__filter-overlay-summary" role="status">
              {{ _filterOverlayActiveRuleSummary(_filterDraftRules().length) }}
              {{ _advancedFilterText().multipleRulesActive }}
            </p>
          } @else {
          @if (_filterDraftHasMultipleRules()) {
            <neu-select
              class="neu-table__filter-overlay-control neu-table__filter-overlay-operator"
              [floatingLabel]="false"
              [label]="_advancedFilterText().operator"
              [options]="_filterOverlayOperatorOptions()"
              [formControl]="_filterOverlayOperatorControl"
            />
          }
          <div class="neu-table__filter-overlay-rules">
            @for (rule of _filterDraftRules(); track rule.id; let index = $index) {
              <div
                class="neu-table__filter-overlay-rule"
                role="group"
                [attr.data-neu-table-filter-rule-id]="rule.id"
                [attr.aria-labelledby]="_filterOverlayRuleLabelId(column.key, rule.id)"
              >
                <div class="neu-table__filter-overlay-rule-header">
                  <span
                    class="neu-table__filter-overlay-rule-label"
                    [id]="_filterOverlayRuleLabelId(column.key, rule.id)"
                  >
                    {{ _filterOverlayRuleLabel(index) }}
                  </span>
                  <button
                    type="button"
                    class="neu-table__filter-overlay-remove-rule"
                    [attr.aria-label]="_filterOverlayRemoveRuleLabel(index)"
                    (click)="_removeFilterDraftRule(rule.id)"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                @if (
                  _filterDraftKind() === 'text' ||
                  _filterDraftKind() === 'number' ||
                  _filterDraftKind() === 'date'
                ) {
                  <neu-select
                    class="neu-table__filter-overlay-control neu-table__filter-overlay-mode"
                    [floatingLabel]="false"
                    [label]="_advancedFilterText().matchMode"
                    [options]="_filterOverlayModeOptions(column)"
                    [formControl]="rule.modeControl"
                  />
                }
                @switch (_filterDraftKind()) {
                  @case ('text') {
                    <neu-input
                      class="neu-table__filter-overlay-control"
                      [floatingLabel]="false"
                      [label]="_advancedFilterText().value"
                      [formControl]="rule.textControl"
                    />
                  }
                  @case ('number') {
                    @if (rule.mode() === 'between') {
                      <div class="neu-table__filter-overlay-range">
                        <neu-number-input
                          [nullable]="true"
                          [label]="_advancedFilterText().from"
                          [formControl]="rule.numberFromControl"
                        />
                        <neu-number-input
                          [nullable]="true"
                          [label]="_advancedFilterText().to"
                          [formControl]="rule.numberToControl"
                        />
                      </div>
                    } @else {
                      <neu-number-input
                        class="neu-table__filter-overlay-control"
                        [nullable]="true"
                        [label]="_advancedFilterText().value"
                        [formControl]="rule.numberControl"
                      />
                    }
                  }
                  @case ('date') {
                    @if (rule.mode() === 'between') {
                      @if (_filterOverlayDatePrecision(column) === 'instant') {
                        <div class="neu-table__filter-overlay-range">
                          <neu-date-input
                            type="datetime-local"
                            [label]="_advancedFilterText().from"
                            [formControl]="rule.instantFromControl"
                          />
                          <neu-date-input
                            type="datetime-local"
                            [label]="_advancedFilterText().to"
                            [formControl]="rule.instantToControl"
                          />
                        </div>
                      } @else {
                        <neu-date-input
                          class="neu-table__filter-overlay-control"
                          type="range"
                          [label]="_advancedFilterText().value"
                          [formControl]="rule.dateControl"
                        />
                      }
                    } @else {
                      <neu-date-input
                        class="neu-table__filter-overlay-control"
                        [type]="
                          _filterOverlayDatePrecision(column) === 'instant'
                            ? 'datetime-local'
                            : 'date'
                        "
                        [label]="_advancedFilterText().value"
                        [formControl]="rule.dateControl"
                      />
                    }
                  }
                  @case ('boolean') {
                    <neu-select
                      class="neu-table__filter-overlay-control"
                      [floatingLabel]="false"
                      [label]="_advancedFilterText().value"
                      [placeholder]="_advancedFilterText().all"
                      [options]="_filterOverlayBooleanOptions()"
                      [clearable]="true"
                      [clearAriaLabel]="_advancedFilterText().all"
                      [formControl]="rule.booleanControl"
                    />
                  }
                  @case ('select') {
                    <neu-select
                      class="neu-table__filter-overlay-control"
                      [floatingLabel]="false"
                      [label]="_filterOverlayControlLabel(column)"
                      [placeholder]="allFilterOptionLabel()"
                      [options]="_filterOverlayOptions(column)"
                      [optionLabel]="typedFilterOptionLabel(column)"
                      [optionValue]="typedFilterOptionValue(column)"
                      [optionDisabled]="typedFilterOptionDisabled(column)"
                      [searchable]="typedFilterSearchable(column)"
                      [virtualScroll]="typedFilterVirtualScroll(column)"
                      [virtualScrollVisibleItems]="typedFilterVirtualScrollVisibleItems(column)"
                      [clearable]="true"
                      [clearAriaLabel]="_advancedFilterText().clear"
                      [formControl]="rule.selectControl"
                      (selectionChange)="_onFilterOverlaySingleValueCommitted(rule.id)"
                    />
                  }
                  @case ('multiSelect') {
                    <neu-multiselect
                      class="neu-table__filter-overlay-control"
                      [floatingLabel]="false"
                      [label]="_filterOverlayControlLabel(column)"
                      [placeholder]="allFilterOptionLabel()"
                      [options]="_filterOverlayOptions(column)"
                      [optionLabel]="typedFilterOptionLabel(column)"
                      [optionValue]="typedFilterOptionValue(column)"
                      [optionDisabled]="typedFilterOptionDisabled(column)"
                      [searchable]="typedFilterSearchable(column)"
                      [virtualScroll]="typedFilterVirtualScroll(column)"
                      [virtualScrollVisibleItems]="typedFilterVirtualScrollVisibleItems(column)"
                      [clearable]="true"
                      [clearAriaLabel]="_advancedFilterText().clear"
                      [formControl]="rule.multiSelectControl"
                    />
                  }
                  @case ('custom') {
                    @if (_filterOverlayCustomTemplate(column); as customTemplate) {
                      <div class="neu-table__filter-overlay-custom">
                        <ng-container
                          [ngTemplateOutlet]="customTemplate"
                          [ngTemplateOutletContext]="_filterOverlayCustomContext(column)"
                        />
                      </div>
                    }
                  }
                }
              </div>
            }
          </div>
          @if (_filterDraftCanAddRule()) {
            <button
              neu-button
              type="button"
              variant="secondary"
              size="sm"
              class="neu-table__filter-overlay-add-rule"
              data-neu-table-filter-add-rule
              (click)="_addFilterDraftRule()"
            >
              {{ _advancedFilterText().addRule }}
            </button>
          }
          }
          <div class="neu-table__filter-overlay-actions">
            @if (!_filterDraftReadOnly()) {
            <button
              neu-button
              type="button"
              variant="ghost"
              size="sm"
              (click)="_clearFilterDraft()"
            >
              {{ _advancedFilterText().clear }}
            </button>
            }
            <span class="neu-table__filter-overlay-actions-spacer"></span>
            <button
              neu-button
              type="button"
              variant="secondary"
              size="sm"
              (click)="_closeFilterOverlay()"
            >
              {{ _advancedFilterText().cancel }}
            </button>
            @if (!_filterDraftReadOnly()) {
              <button
                neu-button
                type="button"
                size="sm"
                [disabled]="!_filterDraftValid()"
                (click)="_applyFilterDraft()"
              >
                {{ _advancedFilterText().apply }}
              </button>
            }
          </div>
        }
      </div>
    </ng-template>

    <div
      class="neu-table-container"
      [class.neu-table--sticky-header]="stickyHeader()"
      [class.neu-table-container--bordered]="bordered()"
      [class.neu-table-container--rounded]="roundedBorders()"
      [class.neu-table-container--striped]="stripedRows()"
    >
      <!-- ---- Toolbar ---- -->
      @if (searchable() || title() || exportable() || _toolbarTemplateRef()) {
        <div class="neu-table__toolbar">
          @if (title()) {
            <h3 class="neu-table__title">{{ title() }}</h3>
          }
          @if (_toolbarTemplateRef(); as toolbarTpl) {
            <div class="neu-table__toolbar-extra">
              <ng-container [ngTemplateOutlet]="toolbarTpl" />
            </div>
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
                <neu-checkbox
                    class="neu-table__exact-checkbox"
                    [checked]="exactMatch()"
                    [label]="exactMatchLabel()"
                    (checkedChange)="setExactMatch($event)"
                  />
              }
            </div>
          }
          @if (columnChooser()) {
            <div class="neu-table__column-chooser">
              <button
                class="neu-table__export-btn"
                type="button"
                [attr.aria-expanded]="columnChooserOpen()"
                (click)="toggleColumnChooser()"
              >
                {{ columnChooserLabel() }}
              </button>
              @if (columnChooserOpen()) {
                <div class="neu-table__column-chooser-panel" role="menu">
                  @for (col of orderedColumns(); track col.key) {
                    <div class="neu-table__column-chooser-item">
                      <neu-checkbox
                        class="neu-table__column-chooser-checkbox"
                        [checked]="isColumnVisible(col.key)"
                        [label]="col.header"
                        (checkedChange)="toggleColumnVisibility(col.key)"
                      />
                    </div>
                  }
                </div>
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
              @if (exportFormats().includes('xlsx')) {
                <button
                  class="neu-table__export-btn"
                  type="button"
                  (click)="exportXlsx()"
                  [title]="exportXlsxTitle()"
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
                  XLSX
                </button>
              }
            </div>
          }
        </div>
      }

      <!-- Barra de selección (aparece al seleccionar) -->
      @if (selectable() && selectedCount() > 0) {
        <div class="neu-table__selection-bar">
          <div class="neu-table__selection-main">
            <span>{{ selectedRowsInfo() }}</span>
            @if (selectionActions().length > 0) {
              <div class="neu-table__selection-actions">
                @for (action of selectionActions(); track action.key) {
                  @if (action.show === undefined || action.show(selectedRows())) {
                    @if (isSelectionConfirmPending(action)) {
                      <span class="neu-table__action-confirm">
                        <span>{{ action.confirm }}</span>
                        <button
                          class="neu-table__action-btn neu-table__action-btn--danger"
                          type="button"
                          (click)="handleSelectionAction(action)"
                        >
                          Sí
                        </button>
                        <button
                          class="neu-table__action-btn"
                          type="button"
                          (click)="cancelSelectionConfirm()"
                        >
                          No
                        </button>
                      </span>
                    } @else {
                      <button
                        class="neu-table__export-btn neu-table__export-btn--selection neu-table__export-btn--{{
                          action.variant ?? 'ghost'
                        }}"
                        type="button"
                        [disabled]="action.disabled ? action.disabled(selectedRows()) : false"
                        [title]="action.label"
                        (click)="handleSelectionAction(action)"
                      >
                        @if (action.icon.startsWith('lucide')) {
                          <neu-icon [name]="action.icon" size="0.95rem" aria-hidden="true" />
                        } @else {
                          <span aria-hidden="true">{{ action.icon }}</span>
                        }
                        <span>{{ action.label }}</span>
                      </button>
                    }
                  }
                }
              </div>
            }
          </div>
          <button class="neu-table__selection-clear" type="button" (click)="clearSelection()">
            {{ clearSelectionLabel() }}
          </button>
        </div>
      }

      <!-- ---- Scroll container ---- -->
      <div
        #scrollContainer
        cdkScrollable
        class="neu-table__scroll-container"
        [class.neu-table__scroll-container--virtual]="_virtualScrollActive()"
        role="region"
        [attr.aria-label]="title() || tableAriaLabel()"
        [style.max-height]="_virtualScrollActive() ? virtualContainerMaxHeight() : null"
        (scroll)="onTableScroll($event)"
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
                  <neu-checkbox
                    class="neu-table__checkbox"
                    [checked]="isAllFilteredSelected()"
                    [indeterminate]="isSomeFilteredSelected()"
                    [ariaLabel]="selectAllAriaLabel()"
                    (checkedChange)="toggleAll()"
                  />
                </th>
              }
              @if (showRowNumbers()) {
                <th class="neu-table__th neu-table__th--rn" scope="col">#</th>
              }
              @for (col of visibleColumns(); track col.key) {
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
                  [style.width]="columnWidth(col)"
                  [style.min-width]="columnWidth(col)"
                  [style.max-width]="columnWidth(col)"
                  [style.text-align]="col.align ?? 'left'"
                  scope="col"
                  (click)="sortable() && col.sortable !== false ? sortBy(col.key, $event) : null"
                >
                  @if (reorderableColumns()) {
                    <span class="neu-table__reorder-controls" (click)="$event.stopPropagation()">
                      <button
                        type="button"
                        class="neu-table__reorder-btn"
                        [disabled]="isFirstVisibleColumn(col.key)"
                        [attr.aria-label]="'Move ' + col.header + ' left'"
                        (click)="moveColumn(col.key, -1)"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        class="neu-table__reorder-btn"
                        [disabled]="isLastVisibleColumn(col.key)"
                        [attr.aria-label]="'Move ' + col.header + ' right'"
                        (click)="moveColumn(col.key, 1)"
                      >
                        ›
                      </button>
                    </span>
                  }
                  @if (col.headerTemplate) {
                    <ng-container
                      [ngTemplateOutlet]="col.headerTemplate"
                      [ngTemplateOutletContext]="{ $implicit: col }"
                    />
                  } @else {
                    {{ col.header }}
                  }
                  @if (_isFilterOverlayEligible(col)) {
                    <button
                      cdkOverlayOrigin
                      #filterOverlayOrigin="cdkOverlayOrigin"
                      type="button"
                      class="neu-table__filter-overlay-trigger"
                      [class.neu-table__filter-overlay-trigger--open]="_openFilterKey() === col.key"
                      [class.neu-table__filter-overlay-trigger--active]="
                        _isFilterOverlayActive(col.key)
                      "
                      [id]="_filterOverlayTriggerId(col.key)"
                      aria-haspopup="dialog"
                      [attr.aria-expanded]="_openFilterKey() === col.key ? 'true' : 'false'"
                      [attr.aria-controls]="_filterOverlayPanelId(col.key)"
                      [attr.aria-label]="_filterOverlayTriggerLabel(col)"
                      [attr.aria-pressed]="_isFilterOverlayActive(col.key)"
                      [attr.title]="
                        _isFilterOverlayActive(col.key) ? _advancedFilterText().filterActive : null
                      "
                      (click)="_toggleFilterOverlay(col.key, $event)"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M4 5h16" />
                        <path d="M7 12h10" />
                        <path d="M10 19h4" />
                      </svg>
                      @if (_filterOverlayRuleCount(col.key) > 1) {
                        <span class="neu-table__filter-overlay-rule-count" aria-hidden="true">
                          {{ _filterOverlayRuleCount(col.key) }}
                        </span>
                      }
                    </button>
                    <ng-template
                      cdkConnectedOverlay
                      [cdkConnectedOverlayOrigin]="filterOverlayOrigin"
                      [cdkConnectedOverlayOpen]="_openFilterKey() === col.key"
                      [cdkConnectedOverlayPositions]="_filterOverlayPositions"
                      [cdkConnectedOverlayHasBackdrop]="false"
                      [cdkConnectedOverlayPush]="true"
                      [cdkConnectedOverlayFlexibleDimensions]="true"
                      [cdkConnectedOverlayViewportMargin]="8"
                      (attach)="_onFilterOverlayAttached(col.key)"
                      (detach)="_onFilterOverlayDetached(col.key)"
                      (overlayOutsideClick)="_onFilterOverlayOutsideClick(col.key, $event)"
                    >
                      <section
                        class="neu-table__filter-overlay"
                        role="dialog"
                        tabindex="-1"
                        aria-modal="false"
                        [id]="_filterOverlayPanelId(col.key)"
                        [attr.aria-labelledby]="_filterOverlayTitleId(col.key)"
                      >
                        <header class="neu-table__filter-overlay-header">
                          <h2
                            class="neu-table__filter-overlay-title"
                            [id]="_filterOverlayTitleId(col.key)"
                          >
                            {{ _filterOverlayTitle(col) }}
                          </h2>
                          <button
                            type="button"
                            class="neu-table__filter-overlay-close"
                            data-neu-table-filter-initial-focus
                            [attr.aria-label]="_filterOverlayCloseLabel(col)"
                            (click)="_closeFilterOverlay()"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              aria-hidden="true"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </header>
                        <ng-container
                          [ngTemplateOutlet]="filterOverlayContent"
                          [ngTemplateOutletContext]="{ $implicit: col }"
                        />
                      </section>
                    </ng-template>
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
                  @if (isColumnResizable(col)) {
                    <button
                      class="neu-table__resize-handle"
                      type="button"
                      [attr.aria-label]="'Resize ' + col.header"
                      (dblclick)="resetColumnWidth(col.key, $event)"
                      (mousedown)="startColumnResize(col, $event)"
                    ></button>
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
                @for (col of visibleColumns(); track col.key) {
                  <th
                    class="neu-table__th neu-table__th--filter"
                    scope="col"
                    [style.width]="columnWidth(col)"
                    [style.min-width]="columnWidth(col)"
                    [style.max-width]="columnWidth(col)"
                  >
                    @if (_hasMultipleAppliedRules(col.key)) {
                      <span class="neu-table__filter-multiple-summary" role="status">
                        {{ _filterOverlayActiveRuleSummary(_filterOverlayRuleCount(col.key)) }}
                      </span>
                    } @else if (col.filterConfig; as config) {
                        @switch (config.kind) {
                          @case ('text') {
                            <neu-input
                              [floatingLabel]="false"
                              [label]="modernFilterLabel(col)"
                              [placeholder]="filterPlaceholder()"
                              [formControl]="typedColumnFilterControl(col)"
                            />
                          }
                          @case ('number') {
                            @if (modernFilterMode(col) === 'between') {
                              <div class="neu-table__filter-range">
                                <neu-number-input
                                  [nullable]="true"
                                  [label]="rangeFilterLabel(col, 'from')"
                                  [formControl]="typedRangeStartControl(col)"
                                />
                                <neu-number-input
                                  [nullable]="true"
                                  [label]="rangeFilterLabel(col, 'to')"
                                  [formControl]="typedRangeEndControl(col)"
                                />
                              </div>
                            } @else {
                              <neu-number-input
                                [nullable]="true"
                                [label]="modernFilterLabel(col)"
                                [formControl]="typedColumnFilterControl(col)"
                              />
                            }
                          }
                          @case ('date') {
                            @if (isDateOnlyRange(col)) {
                              <neu-date-input
                                type="range"
                                [label]="modernFilterLabel(col)"
                                [placeholder]="filterPlaceholder()"
                                [formControl]="typedColumnFilterControl(col)"
                              />
                            } @else if (isInstantRange(col)) {
                              <div class="neu-table__filter-range">
                                <neu-date-input
                                  type="datetime-local"
                                  [label]="rangeFilterLabel(col, 'from')"
                                  [formControl]="typedInstantRangeStartControl(col)"
                                />
                                <neu-date-input
                                  type="datetime-local"
                                  [label]="rangeFilterLabel(col, 'to')"
                                  [formControl]="typedInstantRangeEndControl(col)"
                                />
                              </div>
                            } @else {
                              <neu-date-input
                                [type]="dateInputType(col)"
                                [label]="modernFilterLabel(col)"
                                [formControl]="typedColumnFilterControl(col)"
                              />
                            }
                          }
                          @case ('boolean') {
                            <neu-select
                              [floatingLabel]="false"
                              [label]="modernFilterLabel(col)"
                              [placeholder]="allFilterOptionLabel()"
                              [options]="typedBooleanFilterOptions()"
                              [clearable]="true"
                              [formControl]="typedColumnFilterControl(col)"
                            />
                          }
                          @case ('select') {
                            <neu-select
                              [floatingLabel]="false"
                              [label]="modernFilterLabel(col)"
                              [placeholder]="allFilterOptionLabel()"
                              [options]="typedFilterOptions(col)"
                              [optionLabel]="typedFilterOptionLabel(col)"
                              [optionValue]="typedFilterOptionValue(col)"
                              [optionDisabled]="typedFilterOptionDisabled(col)"
                              [searchable]="typedFilterSearchable(col)"
                              [virtualScroll]="typedFilterVirtualScroll(col)"
                              [virtualScrollVisibleItems]="
                                typedFilterVirtualScrollVisibleItems(col)
                              "
                              [clearable]="true"
                              [formControl]="typedColumnFilterControl(col)"
                            />
                          }
                          @case ('multiSelect') {
                            <neu-multiselect
                              [floatingLabel]="false"
                              [label]="modernFilterLabel(col)"
                              [placeholder]="allFilterOptionLabel()"
                              [options]="typedFilterOptions(col)"
                              [optionLabel]="typedFilterOptionLabel(col)"
                              [optionValue]="typedFilterOptionValue(col)"
                              [optionDisabled]="typedFilterOptionDisabled(col)"
                              [searchable]="typedFilterSearchable(col)"
                              [virtualScroll]="typedFilterVirtualScroll(col)"
                              [virtualScrollVisibleItems]="
                                typedFilterVirtualScrollVisibleItems(col)
                              "
                              [clearable]="true"
                              [formControl]="typedMultiSelectFilterControl(col)"
                            />
                          }
                        }
                    } @else if (col.filterable) {
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
                          [placeholder]="filterPlaceholder()"
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
                        @for (__ of visibleColumns(); track $index) {
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
              @if (_virtualScrollActive() && _virtualTopSpacerHeight() > 0) {
                <tr class="neu-table__spacer-row" aria-hidden="true">
                  <td
                    [attr.colspan]="totalColspan()"
                    class="neu-table__spacer-cell"
                    [style.height.px]="_virtualTopSpacerHeight()"
                  ></td>
                </tr>
              }
              @for (entry of visiblePageEntries(); track entry.key; let entryIdx = $index) {
                @if (entry.kind === 'group') {
                  <tr class="neu-table__group-row">
                    <td [attr.colspan]="totalColspan()" class="neu-table__td neu-table__td--group">
                      {{ groupHeaderLabel() }} {{ entry.label }}
                      <span class="neu-table__group-count">({{ entry.count }})</span>
                    </td>
                  </tr>
                } @else {
                  @let row = entry.row;
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
                      <neu-checkbox
                        class="neu-table__checkbox"
                        [checked]="isRowSelected(row)"
                        [ariaLabel]="selectRowAriaLabel()"
                        (checkedChange)="toggleRow(row)"
                      />
                    </td>
                  }
                  @if (showRowNumbers()) {
                    <td class="neu-table__td neu-table__td--rn">
                      {{ visibleRowNumber(entry.rowIndex) }}
                    </td>
                  }
                  @for (col of visibleColumns(); track col.key) {
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
                      [style.width]="columnWidth(col)"
                      [style.min-width]="columnWidth(col)"
                      [style.max-width]="columnWidth(col)"
                      [style.text-align]="col.align ?? 'left'"
                      (dblclick)="startCellEdit(row, col, $event)"
                    >
                      @if (isEditingCell(row, col)) {
                        <neu-inline-editor
                          class="neu-table__edit-control"
                          [type]="inlineEditorType(col)"
                          [value]="$any(editingValue())"
                          [options]="inlineEditorOptions(col)"
                          [startInEdit]="true"
                          [saveOnBlur]="true"
                          [editLabel]="inlineEditLabel()"
                          [saveLabel]="saveInlineEditLabel()"
                          [cancelLabel]="cancelInlineEditLabel()"
                          (valueChange)="setEditingValue($event)"
                          (editCommit)="commitCellEdit(row, col)"
                          (editCancel)="cancelCellEdit()"
                        />
                      } @else if (col.cellTemplate) {
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
              @if (_virtualScrollActive() && _virtualBottomSpacerHeight() > 0) {
                <tr class="neu-table__spacer-row" aria-hidden="true">
                  <td
                    [attr.colspan]="totalColspan()"
                    class="neu-table__spacer-cell"
                    [style.height.px]="_virtualBottomSpacerHeight()"
                  ></td>
                </tr>
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
                @for (col of visibleColumns(); track col.key) {
                  <td
                    class="neu-table__td neu-table__td--footer"
                    [style.width]="columnWidth(col)"
                    [style.min-width]="columnWidth(col)"
                    [style.max-width]="columnWidth(col)"
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
          @if (pagination() && pageSizeOptions().length > 0) {
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
export class NeuTableComponent<T extends object = NeuTableRow> {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _urlState = inject(NeuUrlStateService);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _document = inject(DOCUMENT);
  private readonly _scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  private readonly _virtualOverscan = 3;
  private readonly _filterOverlayUid = _neuTableFilterOverlayIdSeq++;
  private _activeFilterTrigger: HTMLElement | null = null;
  private _lastFilterWorkflowFocus: HTMLElement | null = null;
  private _escapeReturnFocus: HTMLElement | null = null;
  private _filterOverlayFocusCleanup: (() => void) | null = null;
  private readonly _filterOverlayOwnedChildPanes = new Map<HTMLElement, HTMLElement>();
  private readonly _filterOverlayOwnedChildBackdrops = new Map<HTMLElement, HTMLElement>();
  private _pendingFilterOverlayChildTrigger: HTMLElement | null = null;
  private _destroyed = false;

  private readonly _advancedFilter = new NeuTableAdvancedFilterController<T>(
    () => this._focusOverlayChildTrigger('date'),
    (key) => this._currentTypedColumn(key),
  );
  protected readonly _openFilterKey = signal<string | null>(null);
  protected readonly _filterDraftKind = this._advancedFilter.kind;
  protected readonly _filterDraftMode = this._advancedFilter.mode;
  protected readonly _filterDraftValue = this._advancedFilter.value;
  protected readonly _filterDraftValid = this._advancedFilter.valid;
  protected readonly _filterDraftHasMultipleRules = this._advancedFilter.hasMultipleRules;
  protected readonly _filterDraftOperator = this._advancedFilter.operator;
  protected readonly _filterDraftRules = this._advancedFilter.rules;
  protected readonly _filterDraftCanAddRule = this._advancedFilter.canAddRule;
  protected readonly _filterDraftReadOnly = this._advancedFilter.readOnly;
  protected readonly _filterOverlayOperatorControl = this._advancedFilter.operatorControl;
  protected readonly _filterOverlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
  ];

  // ── Inputs de datos ─────────────────────────────────────────────────
  readonly columns = input<readonly NeuTableColumnInput<T>[]>([]);
  readonly data = input<NeuTableData<T>>([]);
  readonly pageSize = input<number>(10);
  /** Controla si la paginación está activa. Si es false, se muestran todos los datos y se ocultan los controles de paginación y pageSize. */
  readonly pagination = input<boolean>(true);
  readonly loading = input<boolean>(false);
  readonly title = input<string>('');
  readonly toolbarExtraRef = input<TemplateRef<unknown> | null>(null);
  readonly emptyMessage = input<string>('No results found');
  readonly skeletonRows = input<number[]>([1, 2, 3, 4, 5]);

  readonly expandTemplate = contentChild<NeuTableExpandDirective<T>>(NeuTableExpandDirective);
  readonly toolbarTemplate = contentChild(NeuTableToolbarDirective);
  protected readonly filterTemplates = contentChildren<NeuTableFilterTemplateDirective<T>>(
    NeuTableFilterTemplateDirective,
  );
  protected readonly _toolbarTemplateRef = computed(
    () => this.toolbarExtraRef() ?? this.toolbarTemplate()?.templateRef ?? null,
  );

  // ── Inputs de funcionalidad ──────────────────────────────────────────
  readonly searchable = input<boolean>(true);
  readonly advancedFilterMode = input<NeuTableAdvancedFilterMode>('off');
  readonly advancedFilterTexts = input<Partial<NeuTableAdvancedFilterTexts>>({});
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
  readonly exportXlsxTitle = input<string>('Export XLSX');
  readonly clearSelectionLabel = input<string>('Clear selection');
  readonly selectionSummaryLabel = input<string>('selected');
  readonly tableAriaLabel = input<string>('Data table');
  readonly selectAllAriaLabel = input<string>('Select all filtered rows');
  readonly selectRowAriaLabel = input<string>('Select row');
  readonly expandRowAriaLabel = input<string>('Expand row');
  readonly filterPlaceholder = input<string>('Filter...');
  readonly filterAriaPrefix = input<string>('Filter by');
  readonly filterFromLabel = input<string>('From');
  readonly filterToLabel = input<string>('To');
  readonly filterTrueLabel = input<string>('Yes');
  readonly filterFalseLabel = input<string>('No');
  readonly allFilterOptionLabel = input<string>('All');
  readonly ofLabel = input<string>('of');
  readonly resultLabelSingular = input<string>('result');
  readonly resultLabelPlural = input<string>('results');
  readonly sortable = input<boolean>(false);
  readonly selectable = input<boolean>(false);
  readonly expandable = input<boolean>(false);
  readonly expandMode = input<'multiple' | 'single'>('multiple');
  readonly exportable = input<boolean>(false);
  readonly exportFileName = input<string>('export');
  readonly pageSizeOptions = input<number[]>([]);
  readonly stickyHeader = input<boolean>(false);
  readonly virtualScroll = input<boolean>(false);
  readonly virtualScrollVisibleItems = input<number>(8);
  readonly resizableColumns = input<boolean>(false);
  readonly reorderableColumns = input<boolean>(false);
  readonly columnChooser = input<boolean>(false);
  readonly columnChooserLabel = input<string>('Columns');
  readonly groupBy = input<string>('');
  readonly groupHeaderLabel = input<string>('Group:');
  readonly inlineEdit = input<boolean>(false);
  readonly inlineEditLabel = input<string>('Edit cell');
  readonly saveInlineEditLabel = input<string>('Save cell');
  readonly cancelInlineEditLabel = input<string>('Cancel cell edit');
  readonly initialLayout = input<NeuTableLayout | null>(null);
  readonly rowKey = input<NeuTableRowKey<T>>('id' as NeuTableRowKey<T>);
  readonly bordered = input<boolean>(true);
  readonly roundedBorders = input<boolean>(true);
  readonly stripedRows = input<boolean>(false);

  // ── Inputs nuevos v1.3.0 ──────────────────────────────────────────────
  readonly density = input<'compact' | 'normal' | 'relaxed'>('normal');
  readonly showRowNumbers = input<boolean>(false);
  readonly rowClass = input<((row: T) => string) | undefined>(undefined);
  readonly footerRow = input<Record<string, string | number> | undefined>(undefined);
  readonly emptyStateTemplate = input<TemplateRef<void> | undefined>(undefined);
  readonly serverSide = input<boolean>(false);
  readonly totalItems = input<number | undefined>(undefined);
  readonly multiSort = input<boolean>(false);
  readonly exportFormats = input<('csv' | 'json' | 'xlsx')[]>(['csv']);
  readonly exportColumns = input<string[]>([]);
  readonly exportScope = input<'filtered' | 'selected' | 'auto'>('auto');
  readonly selectionActions = input<readonly NeuTableSelectionAction<T>[]>([]);

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
  readonly selectionChange = output<T[]>();
  readonly rowClick = output<T>();
  readonly rowDblClick = output<T>();
  readonly actionClick = output<NeuTableActionEvent<T>>();
  readonly selectionActionClick = output<NeuTableSelectionActionEvent<T>>();
  readonly serverStateChange = output<NeuTableServerState>();
  readonly searchChange = output<string>();
  readonly columnResize = output<{ key: string; width: number }>();
  readonly columnReorder = output<NeuTableColumnReorderEvent>();
  readonly layoutChange = output<NeuTableLayout>();
  readonly cellEditCommit = output<NeuTableCellEditEvent<T>>();

  // ── Estado interno (usado cuando useUrlState = false) ─────────────────
  // Internal state signals (used when useUrlState = false)
  private readonly _internalPage = signal(1);
  private readonly _internalSearch = signal('');
  private readonly _internalSortKey = signal('');
  private readonly _internalSortDir = signal<'asc' | 'desc'>('asc');
  private readonly _internalMultiSort = signal('');
  private readonly _columnWidths = signal<Record<string, number>>({});
  private readonly _columnOrder = signal<string[]>([]);
  private readonly _hiddenColumns = signal<Set<string>>(new Set());
  readonly columnChooserOpen = signal(false);
  private readonly _editingCell = signal<{
    rowKey: unknown;
    columnKey: string;
    value: unknown;
    previousValue: unknown;
  } | null>(null);
  private _resizeCleanup: (() => void) | null = null;

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
  private readonly _appliedFilters = signal<Record<string, InternalAppliedColumnFilter>>({});
  readonly _columnFilters = this._createLegacyColumnFiltersFacade();
  readonly _pageSizeControl = new FormControl('', { nonNullable: true });
  private readonly _columnFilterControls = new Map<string, FormControl<string>>();
  private readonly _typedColumnFilterControls = new Map<string, FormControl<unknown>>();
  private readonly _typedRangeStartControls = new Map<string, FormControl<number | null>>();
  private readonly _typedRangeEndControls = new Map<string, FormControl<number | null>>();
  private readonly _typedInstantRangeStartControls = new Map<string, FormControl<string>>();
  private readonly _typedInstantRangeEndControls = new Map<string, FormControl<string>>();
  private readonly _typedMultiSelectFilterControls = new Map<string, FormControl<unknown[]>>();
  private readonly _filterControlSubscriptions = new Map<object, Subscription>();
  private _filterColumnSignatures = new Map<string, InternalFilterColumnSignature>();
  /** True when a legacy or typed column filter is available. */
  readonly _hasFilterableCol = computed(() =>
    this.visibleColumns().some((column) => column.filterable || column.filterConfig),
  );
  protected readonly typedBooleanFilterOptions = computed<NeuSelectOption<boolean>[]>(() => [
    { label: this.filterTrueLabel(), value: true },
    { label: this.filterFalseLabel(), value: false },
  ]);
  protected readonly _advancedFilterText = computed<InternalResolvedAdvancedFilterTexts>(() => ({
    ..._NEU_TABLE_ADVANCED_FILTER_TEXTS,
    ...this.advancedFilterTexts(),
  }));
  protected readonly _filterOverlayBooleanOptions = computed<NeuSelectOption<boolean>[]>(() => [
    { label: this._advancedFilterText().yes, value: true },
    { label: this._advancedFilterText().no, value: false },
  ]);

  readonly orderedColumns = computed(() => {
    const columns = this._typedColumns();
    const order = this._columnOrder();
    if (order.length === 0) {
      return columns;
    }

    const byKey = new Map<string, NeuTableColumn<T>>(
      columns.map((col) => [col.key, col] as [string, NeuTableColumn<T>]),
    );
    return [
      ...order.flatMap((key) => {
        const col = byKey.get(key);
        return col ? [col] : [];
      }),
      ...columns.filter((col) => !order.includes(col.key)),
    ];
  });

  readonly visibleColumns = computed(() => {
    const hidden = this._hiddenColumns();
    return this.orderedColumns().filter((col) => !hidden.has(col.key));
  });

  /**
   * Normalize the three supported column contracts: direct T keys, the
   * explicit T/string escape for computed/action/path-like columns, and the
   * unparameterized legacy column form used by existing templates.
   */
  private readonly _typedColumns = computed<readonly NeuTableColumn<T>[]>(
    () => this.columns().map((column) => this.asRuntimeColumn(column)),
  );

  /** Convierte filterOptions de string[] a NeuSelectOption[] con opción "Todos" al inicio.
   *  Converts filterOptions from string[] to NeuSelectOption[] with a leading "All" option. */
  _filterOpts(col: NeuTableColumn<T>): NeuSelectOption[] {
    return [
      { label: this.allFilterOptionLabel(), value: '' },
      ...(col.filterOptions ?? []).map((o) => ({ label: o, value: o })),
    ];
  }

  readonly _pageSizeOptions = computed<NeuSelectOption[]>(() =>
    this.pageSizeOptions().map((size) => ({ label: String(size), value: String(size) })),
  );

  private readonly _virtualScrollTop = signal(0);

  constructor() {
    this._destroyRef.onDestroy(() => {
      this._destroyed = true;
      this._advancedFilter.destroy();
      this._stopFilterOverlayFocusContainment();
      this._clearFilterOverlayOwnership();
      this._openFilterKey.set(null);
      this._activeFilterTrigger = null;
      this._lastFilterWorkflowFocus = null;
      this._escapeReturnFocus = null;
      this._stopColumnResize();
      this._disposeAllFilterControls();
    });

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
      this._handleFilterColumnLifecycle(this._typedColumns());
    });

    effect(() => {
      const visibleKeys = new Set<string>(
        this.visibleColumns().map((column): string => column.key),
      );
      const activeKey = this._openFilterKey();
      if (activeKey && !visibleKeys.has(activeKey)) {
        untracked(() => this._closeFilterOverlay(false));
      }
    });

    effect(() => {
      this.filterTemplates();
      this.advancedFilterMode();
      this.serverSide();
      const activeKey = this._openFilterKey();
      const column = activeKey ? this._currentTypedColumn(activeKey) : null;
      if (activeKey && (!column || !this._isFilterOverlayEligible(column))) {
        untracked(() => this._closeFilterOverlay(false));
      }
    });

    effect(() => {
      let legacyFilters: Record<string, unknown> | null = null;
      for (const col of this._typedColumns()) {
        if (col.filterConfig) {
          this._syncTypedFilterControl(col, this._appliedSingleFilterValue(col.key));
        } else if (col.filterable) {
          legacyFilters ??= this._columnFilters();
          const control = this.columnFilterControl(col.key);
          const nextValue = String(legacyFilters[col.key] ?? '');
          if (control.value !== nextValue) {
            control.setValue(nextValue, { emitEvent: false });
          }
        }
      }
    });

    effect(() => {
      const keys = this._typedColumns().map((col): string => col.key);
      const layout = this.initialLayout();
      const rawOrder = layout?.columnOrder?.length ? layout.columnOrder : this._columnOrder();
      const nextOrder = [
        ...rawOrder.filter((key) => keys.includes(key)),
        ...keys.filter((key) => !rawOrder.includes(key)),
      ];

      if (nextOrder.join('|') !== this._columnOrder().join('|')) {
        this._columnOrder.set(nextOrder);
      }

      if (layout) {
        this._hiddenColumns.set(new Set(layout.hiddenColumns.filter((key) => keys.includes(key))));
        this._columnWidths.set(layout.columnWidths ?? {});
      }
    });

    effect(() => {
      if (!this.virtualScroll()) {
        return;
      }

      this.currentPage();
      this.searchQuery();
      this.sortKey();
      this.sortDir();
      this._sortEntries();
      this._appliedFilters();
      this.effectivePageSize();
      this.paginatedData().length;
      this.resetVirtualScrollPosition();
    });
  }

  private readonly _confirmPending = signal<{ rowKey: unknown; actionKey: string } | null>(null);

  // ── Advanced filter overlay ───────────────────────────────────────────
  protected _isFilterOverlayEligible(column: NeuTableColumn<T>): boolean {
    if (this.advancedFilterMode() !== 'menu') return false;
    const kind = column.filterConfig?.kind;
    if (
      kind === 'text' ||
      kind === 'number' ||
      kind === 'date' ||
      kind === 'boolean' ||
      kind === 'select' ||
      kind === 'multiSelect'
    ) {
      return true;
    }
    if (kind === 'custom') {
      return !this.serverSide() && this._filterOverlayCustomTemplate(column) !== null;
    }
    if (
      !column.filterConfig &&
      column.filterable &&
      (!column.filterType || column.filterType === 'text')
    ) {
      return true;
    }
    return false;
  }

  protected _filterOverlayControlKind(column: NeuTableColumn<T>): string {
    return neuTableAdvancedFilterControlKind(column);
  }

  protected _filterOverlayDatePrecision(column: NeuTableColumn<T>): 'date-only' | 'instant' {
    return neuTableAdvancedFilterDatePrecision(column);
  }

  protected get _filterOverlayModeControl(): FormControl<unknown> {
    return this._advancedFilter.modeControl;
  }

  protected get _filterOverlayTextControl(): FormControl<string> {
    return this._advancedFilter.textControl;
  }

  protected get _filterOverlayNumberControl(): FormControl<number | null> {
    return this._advancedFilter.numberControl;
  }

  protected get _filterOverlayNumberFromControl(): FormControl<number | null> {
    return this._advancedFilter.numberFromControl;
  }

  protected get _filterOverlayNumberToControl(): FormControl<number | null> {
    return this._advancedFilter.numberToControl;
  }

  protected get _filterOverlayInstantFromControl(): FormControl<string> {
    return this._advancedFilter.instantFromControl;
  }

  protected get _filterOverlayInstantToControl(): FormControl<string> {
    return this._advancedFilter.instantToControl;
  }

  protected get _filterOverlayBooleanControl(): FormControl<unknown> {
    return this._advancedFilter.booleanControl;
  }

  protected get _filterOverlayDateControl(): FormControl<unknown> {
    return this._advancedFilter.dateControl;
  }

  protected get _filterOverlaySelectControl(): FormControl<unknown> {
    return this._advancedFilter.selectControl;
  }

  protected get _filterOverlayMultiSelectControl(): FormControl<unknown[]> {
    return this._advancedFilter.multiSelectControl;
  }

  protected _filterOverlayModeOptions(
    column: NeuTableColumn<T>,
  ): readonly NeuSelectOption<NeuTableFilterMatchMode>[] {
    const text = this._advancedFilterText();
    return neuTableAdvancedFilterModes(column).map((mode) => ({ label: text[mode], value: mode }));
  }

  protected _filterOverlayOperatorOptions(): readonly NeuSelectOption<InternalAppliedFilterOperator>[] {
    const text = this._advancedFilterText();
    return [
      { label: text.matchAll, value: 'and' },
      { label: text.matchAny, value: 'or' },
    ];
  }

  protected _filterOverlayOptions(column: NeuTableColumn<T>): readonly unknown[] {
    const config = column.filterConfig;
    if (config?.kind === 'select' || config?.kind === 'multiSelect') {
      return config.options ?? [];
    }
    return column.filterType === 'select' ? this._filterOpts(column) : [];
  }

  protected _filterOverlayCustomTemplate(
    column: NeuTableColumn<T>,
  ): TemplateRef<NeuTableFilterTemplateContext<T>> | null {
    if (column.filterConfig?.kind !== 'custom') return null;
    return (
      this.filterTemplates().find((template) => template.columnKey() === column.key)?.templateRef ??
      null
    );
  }

  protected _filterOverlayCustomContext(
    column: NeuTableColumn<T>,
  ): NeuTableFilterTemplateContext<T> {
    const context = {
      column,
      value: this._filterDraftValue(),
      setValue: (value: unknown) => this._setCustomFilterDraftValue(column.key, value),
      clear: () => this._setCustomFilterDraftValue(column.key, null),
      active: this._isFilterOverlayActive(column.key),
    } as Omit<NeuTableFilterTemplateContext<T>, '$implicit'> &
      Partial<Pick<NeuTableFilterTemplateContext<T>, '$implicit'>>;
    const complete = context as NeuTableFilterTemplateContext<T>;
    complete.$implicit = complete;
    return complete;
  }

  protected _filterOverlayTriggerId(key: string): string {
    return `neu-table-filter-trigger-${this._filterOverlayUid}-${encodeURIComponent(key)}`;
  }

  protected _filterOverlayPanelId(key: string): string {
    return `neu-table-filter-panel-${this._filterOverlayUid}-${encodeURIComponent(key)}`;
  }

  protected _filterOverlayTitleId(key: string): string {
    return `${this._filterOverlayPanelId(key)}-title`;
  }

  protected _filterOverlayRuleLabelId(key: string, ruleId: string): string {
    return `${this._filterOverlayPanelId(key)}-${ruleId}-label`;
  }

  protected _filterOverlayRuleLabel(index: number): string {
    return this._advancedFilterText().rule.replace('{count}', String(index + 1));
  }

  protected _filterOverlayRemoveRuleLabel(index: number): string {
    return `${this._advancedFilterText().removeRule}: ${this._filterOverlayRuleLabel(index)}`;
  }

  protected _filterOverlayTriggerLabel(column: NeuTableColumn<T>): string {
    const label = this._formatAdvancedFilterText(this._advancedFilterText().openFilter, column);
    const count = this._filterOverlayRuleCount(column.key);
    return count > 0
      ? `${label}. ${this._advancedFilterText().filterActive}. ${this._filterOverlayActiveRuleSummary(count)}`
      : label;
  }

  protected _filterOverlayTitle(column: NeuTableColumn<T>): string {
    return this._formatAdvancedFilterText(this._advancedFilterText().filterTitle, column);
  }

  protected _filterOverlayCloseLabel(column: NeuTableColumn<T>): string {
    return this._formatAdvancedFilterText(this._advancedFilterText().closeFilter, column);
  }

  protected _filterOverlayControlLabel(column: NeuTableColumn<T>): string {
    return `${this._advancedFilterText().value}: ${column.header}`;
  }

  protected _isFilterOverlayActive(key: string): boolean {
    return this._filterOverlayRuleCount(key) > 0;
  }

  protected _filterOverlayRuleCount(key: string): number {
    return (
      this._appliedFilters()[key]?.constraints.filter(
        (constraint) => !isNeuTableFilterValueEmpty(constraint.value),
      ).length ?? 0
    );
  }

  protected _hasMultipleAppliedRules(key: string): boolean {
    return this._filterOverlayRuleCount(key) > 1;
  }

  protected _filterOverlayActiveRuleSummary(count: number): string {
    return (
      count === 1 ? this._advancedFilterText().ruleActive : this._advancedFilterText().rulesActive
    ).replace('{count}', String(count));
  }

  protected _toggleFilterOverlay(key: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this._openFilterKey() === key) {
      this._closeFilterOverlay();
      return;
    }

    this._activeFilterTrigger = event.currentTarget as HTMLElement;
    this._lastFilterWorkflowFocus = null;
    this._escapeReturnFocus = null;
    const column = this._currentTypedColumn(key);
    if (!column || !this._isFilterOverlayEligible(column)) return;
    this._advancedFilter.initialize(column, this._appliedFilters()[column.key], {
      allowMultipleRules: !this.serverSide(),
    });
    this._openFilterKey.set(key);
  }

  protected _closeFilterOverlay(restoreFocus = true): void {
    const trigger = restoreFocus ? this._activeFilterTrigger : null;
    this._openFilterKey.set(null);
    this._stopFilterOverlayFocusContainment();
    this._clearFilterOverlayOwnership();
    this._lastFilterWorkflowFocus = null;
    this._escapeReturnFocus = null;
    this._activeFilterTrigger = null;
    this._advancedFilter.discard();
    if (trigger) this._focusElementIfAvailable(trigger);
  }

  protected _onFilterOverlayAttached(key: string): void {
    if (this._openFilterKey() !== key || !isPlatformBrowser(this._platformId)) return;
    this._startFilterOverlayFocusContainment();
    this._document.dispatchEvent(
      new CustomEvent(_NEU_TABLE_FILTER_SESSION_OPENED, { detail: this._filterOverlayUid }),
    );
    const initialFocus = this._filterOverlayPanel(key)?.querySelector<HTMLElement>(
      '[data-neu-table-filter-initial-focus]',
    );
    initialFocus?.focus();
    this._lastFilterWorkflowFocus = initialFocus ?? null;
    if (this._filterDraftKind() === 'custom') {
      queueMicrotask(() => this._focusCustomFilterControl());
    }
  }

  protected _onFilterOverlayDetached(key: string): void {
    if (this._openFilterKey() !== key) return;
    this._closeFilterOverlay();
  }

  protected _onFilterOverlayOutsideClick(key: string, event: MouseEvent): void {
    if (this._openFilterKey() !== key) return;
    const target = event.target;
    const panel = this._filterOverlayPanel(key);
    if (!(target instanceof Element) || !panel) {
      this._closeFilterOverlay();
      return;
    }

    const ownedBackdropTrigger = this._ownedFilterOverlayBackdropTrigger(target);
    if (ownedBackdropTrigger && this._eventPointInside(panel, event)) {
      this._focusElementIfAvailable(ownedBackdropTrigger);
      return;
    }

    if (this._isInFilterOverlaySession(target)) {
      return;
    }

    this._closeFilterOverlay();
  }

  protected _onFilterOverlaySingleValueCommitted(ruleId: string): void {
    queueMicrotask(() => this._focusFilterDraftRule(ruleId, 'select'));
  }

  private _setCustomFilterDraftValue(key: string, value: unknown): void {
    const column = this._currentTypedColumn(key);
    if (
      this._openFilterKey() !== key ||
      column?.filterConfig?.kind !== 'custom' ||
      !this._filterOverlayCustomTemplate(column)
    ) {
      return;
    }
    this._advancedFilter.setValue(value);
  }

  protected _clearFilterDraft(): void {
    this._advancedFilter.clear();
  }

  protected _addFilterDraftRule(): void {
    const id = this._advancedFilter.addRule();
    if (id) queueMicrotask(() => this._focusFilterDraftRule(id));
  }

  protected _removeFilterDraftRule(id: string): void {
    const rules = this._filterDraftRules();
    const index = rules.findIndex((rule) => rule.id === id);
    if (index < 0 || !this._advancedFilter.removeRule(id)) return;
    const remaining = this._filterDraftRules();
    const target = remaining[Math.min(index, remaining.length - 1)];
    queueMicrotask(() => {
      if (target) this._focusFilterDraftRule(target.id);
      else {
        this._filterOverlayPanel()
          ?.querySelector<HTMLElement>('[data-neu-table-filter-add-rule]')
          ?.focus();
      }
    });
  }

  protected _applyFilterDraft(): void {
    const key = this._openFilterKey();
    const column = key ? this._currentTypedColumn(key) : null;
    const result = this._advancedFilter.buildApplyResult();
    if (!key || !column || !result || result.key !== key) return;
    this._writeAppliedFilter(key, result.filter);
    if (this.serverSide()) this._emitServerState({ page: 1 });
    this._closeFilterOverlay();
  }

  private _focusFilterDraftRule(id: string, kind: 'default' | 'select' = 'default'): void {
    const rule = this._filterOverlayPanel()?.querySelector<HTMLElement>(
      `[data-neu-table-filter-rule-id="${id}"]`,
    );
    const selector =
      kind === 'select'
        ? 'neu-select:not(.neu-table__filter-overlay-mode) .neu-select__trigger'
        : '.neu-table__filter-overlay-mode .neu-select__trigger, input, .neu-select__trigger, .neu-multiselect__trigger';
    const target = rule?.querySelector<HTMLElement>(selector);
    this._focusElementIfAvailable(target ?? null);
  }

  private _focusCustomFilterControl(): void {
    const custom = this._filterOverlayPanel()?.querySelector<HTMLElement>(
      '.neu-table__filter-overlay-custom',
    );
    const target = custom?.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (target) {
      this._focusElementIfAvailable(target);
      this._lastFilterWorkflowFocus = target;
    }
  }

  private _formatAdvancedFilterText(template: string, column: NeuTableColumn<T>): string {
    return template.replace('{column}', column.header);
  }

  private _startFilterOverlayFocusContainment(): void {
    if (this._filterOverlayFocusCleanup || !isPlatformBrowser(this._platformId)) return;

    const overlayContainer = this._filterOverlayPanel()?.closest('.cdk-overlay-container');
    const pendingBackdrops = new Set<HTMLElement>();
    const observer = overlayContainer
      ? new MutationObserver((records) => {
          const trigger = this._pendingFilterOverlayChildTrigger;
          if (!trigger || !trigger.isConnected || trigger.getAttribute('aria-expanded') !== 'true') {
            return;
          }

          const addedElements = records.flatMap((record) =>
            Array.from(record.addedNodes).filter(
              (node): node is HTMLElement => node instanceof HTMLElement,
            ),
          );
          for (const element of addedElements) {
            if (element.classList.contains('cdk-overlay-backdrop')) pendingBackdrops.add(element);
            element
              .querySelectorAll<HTMLElement>('.cdk-overlay-backdrop')
              .forEach((backdrop) => pendingBackdrops.add(backdrop));
          }

          const addedPanes = addedElements.flatMap((element) => [
            ...(element.classList.contains('cdk-overlay-pane') ? [element] : []),
            ...Array.from(element.querySelectorAll<HTMLElement>('.cdk-overlay-pane')),
          ]);
          const ownedPane = addedPanes.find((pane) =>
            this._filterOverlayPaneMatchesTrigger(pane, trigger),
          );
          if (!ownedPane) return;

          this._filterOverlayOwnedChildPanes.set(ownedPane, trigger);
          pendingBackdrops.forEach((backdrop) =>
            this._filterOverlayOwnedChildBackdrops.set(backdrop, trigger),
          );
          pendingBackdrops.clear();
          this._pendingFilterOverlayChildTrigger = null;
        })
      : null;
    observer?.observe(overlayContainer!, { childList: true, subtree: true });

    const onClick = (event: MouseEvent) => {
      this._captureFilterOverlayChildActivation(event.target);
    };

    const onKeydown = (event: KeyboardEvent) => {
      if (!this._openFilterKey()) return;
      if (event.key === 'Enter' || event.key === ' ') {
        this._captureFilterOverlayChildActivation(event.target);
      }
      if (event.key === 'Escape') {
        this._escapeReturnFocus = this._escapeFocusTarget(event.target);
        return;
      }
      if (event.key !== 'Tab' || event.defaultPrevented) return;
      const target = event.target;
      if (!(target instanceof HTMLElement) || !this._isInFilterOverlaySession(target)) return;
      const focusable = this._filterOverlaySessionFocusableElements();
      if (!focusable.length) return;
      const currentIndex = focusable.indexOf(target);
      const baseIndex = currentIndex < 0 ? 0 : currentIndex;
      const nextIndex = event.shiftKey
        ? (baseIndex - 1 + focusable.length) % focusable.length
        : (baseIndex + 1) % focusable.length;
      event.preventDefault();
      focusable[nextIndex]?.focus();
    };
    const onKeyup = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !this._openFilterKey()) return;
      const returnTarget = this._escapeReturnFocus;
      this._escapeReturnFocus = null;
      if (returnTarget) {
        this._focusElementIfAvailable(returnTarget);
      } else if (!this._isInFilterOverlaySession(this._document.activeElement)) {
        this._focusInitialFilterOverlayElement();
      }
    };
    const onFocusin = (event: FocusEvent) => {
      if (!this._openFilterKey()) return;
      const target = event.target;
      if (target instanceof HTMLElement && this._isInFilterOverlaySession(target)) {
        this._lastFilterWorkflowFocus = target;
        return;
      }
      this._restoreFilterWorkflowFocus();
    };
    const onOtherTableSessionOpened = (event: Event) => {
      if (
        event instanceof CustomEvent &&
        event.detail !== this._filterOverlayUid &&
        this._openFilterKey()
      ) {
        this._closeFilterOverlay(false);
      }
    };

    this._document.addEventListener('click', onClick, true);
    this._document.addEventListener('keydown', onKeydown, true);
    this._document.addEventListener('keyup', onKeyup, true);
    this._document.addEventListener('focusin', onFocusin, true);
    this._document.addEventListener(_NEU_TABLE_FILTER_SESSION_OPENED, onOtherTableSessionOpened);
    this._filterOverlayFocusCleanup = () => {
      observer?.disconnect();
      this._document.removeEventListener('click', onClick, true);
      this._document.removeEventListener('keydown', onKeydown, true);
      this._document.removeEventListener('keyup', onKeyup, true);
      this._document.removeEventListener('focusin', onFocusin, true);
      this._document.removeEventListener(
        _NEU_TABLE_FILTER_SESSION_OPENED,
        onOtherTableSessionOpened,
      );
      this._filterOverlayFocusCleanup = null;
    };
  }

  private _stopFilterOverlayFocusContainment(): void {
    this._filterOverlayFocusCleanup?.();
  }

  private _filterOverlayPanel(key = this._openFilterKey()): HTMLElement | null {
    if (!key || !isPlatformBrowser(this._platformId)) return null;
    return this._document.getElementById(this._filterOverlayPanelId(key));
  }

  private _filterOverlaySessionPanes(): HTMLElement[] {
    const panel = this._filterOverlayPanel();
    const parentPane = panel?.closest<HTMLElement>('.cdk-overlay-pane');
    if (!panel || !parentPane) return [];
    this._refreshFilterOverlayOwnership(panel);
    return [parentPane, ...this._filterOverlayOwnedChildPanes.keys()];
  }

  private _captureFilterOverlayChildActivation(target: EventTarget | null): void {
    const panel = this._filterOverlayPanel();
    const trigger =
      target instanceof Element ? target.closest<HTMLElement>(_NEU_TABLE_FILTER_CHILD_TRIGGER) : null;
    this._pendingFilterOverlayChildTrigger = trigger && panel?.contains(trigger) ? trigger : null;
  }

  private _refreshFilterOverlayOwnership(panel: HTMLElement): void {
    for (const [pane, trigger] of this._filterOverlayOwnedChildPanes) {
      if (!pane.isConnected || !trigger.isConnected || trigger.getAttribute('aria-expanded') !== 'true') {
        this._filterOverlayOwnedChildPanes.delete(pane);
      }
    }
    for (const [backdrop, trigger] of this._filterOverlayOwnedChildBackdrops) {
      if (!backdrop.isConnected || !trigger.isConnected || trigger.getAttribute('aria-expanded') !== 'true') {
        this._filterOverlayOwnedChildBackdrops.delete(backdrop);
      }
    }

    panel
      .querySelectorAll<HTMLElement>('[aria-expanded="true"][aria-controls]')
      .forEach((trigger) => {
        const controlledId = trigger.getAttribute('aria-controls');
        const controlledPanel = controlledId ? this._document.getElementById(controlledId) : null;
        const pane = controlledPanel?.closest<HTMLElement>('.cdk-overlay-pane');
        if (pane) this._filterOverlayOwnedChildPanes.set(pane, trigger);
      });
  }

  private _filterOverlayPaneMatchesTrigger(pane: HTMLElement, trigger: HTMLElement): boolean {
    const controlledId = trigger.getAttribute('aria-controls');
    if (controlledId) {
      return this._document.getElementById(controlledId)?.closest('.cdk-overlay-pane') === pane;
    }
    return (
      trigger.matches('.neu-date-input__trigger, .neu-drp__trigger') &&
      !!pane.querySelector('.neu-date-input__panel, .neu-drp__panel')
    );
  }

  private _ownedFilterOverlayBackdropTrigger(target: Element): HTMLElement | null {
    for (const [backdrop, trigger] of this._filterOverlayOwnedChildBackdrops) {
      if (!backdrop.isConnected || trigger.getAttribute('aria-expanded') !== 'true') {
        this._filterOverlayOwnedChildBackdrops.delete(backdrop);
      } else if (backdrop === target) {
        return trigger;
      }
    }
    return null;
  }

  private _clearFilterOverlayOwnership(): void {
    this._filterOverlayOwnedChildPanes.clear();
    this._filterOverlayOwnedChildBackdrops.clear();
    this._pendingFilterOverlayChildTrigger = null;
  }

  private _isInFilterOverlaySession(target: EventTarget | null): boolean {
    return (
      target instanceof Node &&
      this._filterOverlaySessionPanes().some((pane) => pane.contains(target))
    );
  }

  private _filterOverlaySessionFocusableElements(): HTMLElement[] {
    const selector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="option"]:not([aria-disabled="true"]), [tabindex]:not([tabindex="-1"])';
    const seen = new Set<HTMLElement>();
    return this._filterOverlaySessionPanes().flatMap((pane) =>
      Array.from(pane.querySelectorAll<HTMLElement>(selector)).filter((element) => {
        if (
          seen.has(element) ||
          !element.isConnected ||
          element.getAttribute('aria-hidden') === 'true'
        ) {
          return false;
        }
        seen.add(element);
        return true;
      }),
    );
  }

  private _escapeFocusTarget(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) return null;
    const panel = this._filterOverlayPanel();
    const parentPane = panel?.closest('.cdk-overlay-pane');
    const targetPane = target.closest('.cdk-overlay-pane');
    if (!panel || !targetPane || targetPane === parentPane) return null;

    this._refreshFilterOverlayOwnership(panel);
    return this._filterOverlayOwnedChildPanes.get(targetPane as HTMLElement) ?? null;
  }

  private _expandedOverlayChildTrigger(panel: HTMLElement): HTMLElement | null {
    return panel.querySelector<HTMLElement>(
      '.neu-select__trigger[aria-expanded="true"], .neu-multiselect__trigger[aria-expanded="true"], .neu-date-input__trigger[aria-expanded="true"], .neu-drp__trigger[aria-expanded="true"]',
    );
  }

  private _focusExpandedOverlayChildTrigger(panel: HTMLElement): void {
    this._focusElementIfAvailable(this._expandedOverlayChildTrigger(panel));
  }

  private _focusOverlayChildTrigger(kind: 'select' | 'date'): void {
    const panel = this._filterOverlayPanel();
    if (!panel) return;
    const selector =
      kind === 'select'
        ? 'neu-select .neu-select__trigger'
        : 'neu-date-input .neu-date-input__trigger, neu-date-input .neu-drp__trigger';
    this._focusElementIfAvailable(panel.querySelector<HTMLElement>(selector));
  }

  private _focusInitialFilterOverlayElement(): void {
    const initial = this._filterOverlayPanel()?.querySelector<HTMLElement>(
      '[data-neu-table-filter-initial-focus]',
    );
    this._focusElementIfAvailable(initial ?? null);
  }

  private _restoreFilterWorkflowFocus(): void {
    if (this._lastFilterWorkflowFocus?.isConnected) {
      this._lastFilterWorkflowFocus.focus();
    } else {
      this._focusInitialFilterOverlayElement();
    }
  }

  private _focusElementIfAvailable(element: HTMLElement | null): void {
    if (
      !element ||
      this._destroyed ||
      !isPlatformBrowser(this._platformId) ||
      !element.isConnected
    ) {
      return;
    }
    element.focus();
  }

  private _eventPointInside(element: HTMLElement, event: MouseEvent): boolean {
    const rect = element.getBoundingClientRect();
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  }

  // ── Pipeline de datos ─────────────────────────────────────────────────
  private readonly _rows = computed<NeuTableRuntimeRow<T>[]>(
    () => [...this.data()] as NeuTableRuntimeRow<T>[],
  );
  // Kept as a private signal alias for existing white-box tests/helpers.
  private readonly rows = computed<NeuTableRuntimeRow<T>[]>(() => this._rows());

  private readonly _resolvedAppliedFilters = computed<
    readonly InternalResolvedAppliedColumnFilter<T>[]
  >(() => {
    const columnsByKey = new Map<string, NeuTableColumn<T>>();
    for (const column of this._typedColumns()) columnsByKey.set(column.key, column);

    const resolved: InternalResolvedAppliedColumnFilter<T>[] = [];
    for (const [key, filter] of Object.entries(this._appliedFilters())) {
      const column = columnsByKey.get(key);
      if (!column) continue;
      const constraints = filter.constraints.filter(
        (constraint) => !isNeuTableFilterValueEmpty(constraint.value),
      );
      if (constraints.length > 0) {
        resolved.push({ column, operator: filter.operator, constraints });
      }
    }
    return resolved;
  });

  readonly filteredData = computed<NeuTableRuntimeRow<T>[]>(() => {
    if (this.serverSide()) return this._rows();
    const rows = this._rows();
    const columns = this._typedColumns();
    const activeColumnFilters = this._resolvedAppliedFilters();
    const q = this.searchQuery().trim().toLowerCase();
    const exact = this._exactMatch();
    const matches = (text: string) =>
      exact ? text.toLowerCase() === q : text.toLowerCase().includes(q);
    return rows.filter((row) => {
      const passesGlobal =
        !q ||
        columns.some((col) => {
          const rawVal = String(this.getRowValue(row, col.key) ?? '');
          const displayVal = col.cell
            ? col.cell(row)
            : col.type === 'badge' && col.badgeMap?.[rawVal]?.label
              ? col.badgeMap[rawVal].label!
              : rawVal;
          return matches(displayVal) || matches(rawVal);
        });
      if (!passesGlobal) return false;
      for (const filter of activeColumnFilters) {
        if (!this._matchesAppliedColumnFilter(row, filter)) return false;
      }
      return true;
    });
  });

  readonly sortedData = computed<NeuTableRuntimeRow<T>[]>(() => {
    if (this.serverSide()) return this.filteredData();
    const data = [...this.filteredData()];
    if (!this.sortable()) return data;
    if (this.multiSort() && this._sortEntries().length > 0) {
      const entries = this._sortEntries();
      return data.sort((a, b) => {
        for (const entry of entries) {
          const cmp = String(this.getRowValue(a, entry.key) ?? '').localeCompare(
            String(this.getRowValue(b, entry.key) ?? ''),
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
      const cmp = String(this.getRowValue(a, key) ?? '').localeCompare(
        String(this.getRowValue(b, key) ?? ''),
        undefined,
        {
        numeric: true,
        },
      );
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  private readonly _dynamicPageSize = signal<number | null>(null);
  readonly effectivePageSize = computed(() => {
    if (!this.pagination()) return this.filteredData().length || 1;
    return this._dynamicPageSize() ?? this.pageSize();
  });

  readonly totalPages = computed(() => {
    if (!this.pagination()) return 1;
    const total =
      this.serverSide() && this.totalItems() != null
        ? this.totalItems()!
        : this.filteredData().length;
    return Math.max(1, Math.ceil(total / this.effectivePageSize()));
  });

  readonly paginatedData = computed(() => {
    if (!this.pagination()) return this.sortedData();
    if (this.serverSide()) return this._rows();
    const page = Math.min(this.currentPage(), this.totalPages());
    const size = this.effectivePageSize();
    return this.sortedData().slice((page - 1) * size, page * size);
  });

  readonly _virtualRowHeight = computed(() => {
    switch (this.density()) {
      case 'compact':
        return 34;
      case 'relaxed':
        return 64;
      default:
        return 48;
    }
  });

  readonly _virtualHeaderHeight = computed(() => 44 + (this._hasFilterableCol() ? 52 : 0));

  readonly _virtualScrollActive = computed(
    () => this.virtualScroll() && this.paginatedData().length > this.virtualScrollVisibleItems(),
  );

  readonly virtualContainerMaxHeight = computed(
    () =>
      `${this._virtualHeaderHeight() + this.virtualScrollVisibleItems() * this._virtualRowHeight()}px`,
  );

  readonly _virtualStartIndex = computed(() => {
    if (!this._virtualScrollActive()) {
      return 0;
    }

    const bodyScrollTop = Math.max(0, this._virtualScrollTop() - this._virtualHeaderHeight());
    const startIndex = Math.floor(bodyScrollTop / this._virtualRowHeight());
    return Math.max(0, startIndex - this._virtualOverscan);
  });

  readonly _virtualEndIndex = computed(() => {
    if (!this._virtualScrollActive()) {
      return this.paginatedData().length;
    }

    return Math.min(
      this.paginatedData().length,
      this._virtualStartIndex() + this.virtualScrollVisibleItems() + this._virtualOverscan * 2,
    );
  });

  readonly visiblePageRows = computed(() => {
    const rows = this.paginatedData();
    if (!this._virtualScrollActive()) {
      return rows;
    }

    return rows.slice(this._virtualStartIndex(), this._virtualEndIndex());
  });

  readonly visiblePageEntries = computed<NeuTablePageEntry<T>[]>(() => {
    const rows = this.visiblePageRows();
    const groupKey = this.groupBy();
    if (!groupKey) {
      return rows.map((row, rowIndex) => ({
        kind: 'row' as const,
        key: this.getRowKey(row),
        row,
        rowIndex,
      }));
    }

    const counts = new Map<string, number>();
    for (const row of rows) {
      const label = String(this.getRowValue(row, groupKey) ?? '—');
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    const seen = new Set<string>();
    const entries: NeuTablePageEntry<T>[] = [];
    rows.forEach((row, rowIndex) => {
      const label = String(this.getRowValue(row, groupKey) ?? '—');
      if (!seen.has(label)) {
        seen.add(label);
        entries.push({
          kind: 'group',
          key: `group:${label}:${entries.length}`,
          label,
          count: counts.get(label) ?? 0,
        });
      }
      entries.push({
        kind: 'row',
        key: this.getRowKey(row),
        row,
        rowIndex,
      });
    });
    return entries;
  });

  readonly _virtualTopSpacerHeight = computed(() => {
    if (!this._virtualScrollActive()) {
      return 0;
    }

    return this._virtualStartIndex() * this._virtualRowHeight();
  });

  readonly _virtualBottomSpacerHeight = computed(() => {
    if (!this._virtualScrollActive()) {
      return 0;
    }

    return Math.max(
      0,
      (this.paginatedData().length - this._virtualEndIndex()) * this._virtualRowHeight(),
    );
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
    const from = total === 0 ? 0 : Math.min((page - 1) * size + 1, total);
    const to = total === 0 ? 0 : Math.min(page * size, total);
    return `${from}-${to} ${this.ofLabel()} ${total} ${
      total === 1 ? this.resultLabelSingular() : this.resultLabelPlural()
    }`;
  });

  readonly totalColspan = computed(() => {
    let cols = this.visibleColumns().length;
    if (this.selectable()) cols++;
    if (this.expandable()) cols++;
    if (this.showRowNumbers()) cols++;
    return cols;
  });

  readonly _frozenLeftOffsets = computed(() => {
    this._columnWidths();
    const offsets = new Map<string, number>();
    let leftPx = 0;
    for (const col of this.visibleColumns()) {
      if (col.frozen === 'left') {
        offsets.set(col.key, leftPx);
        leftPx += this._columnWidthPx(col) ?? 0;
      }
    }
    return offsets;
  });

  readonly _lastFrozenLeftKey = computed(() => {
    const frozenLeft = this.visibleColumns().filter((col) => col.frozen === 'left');
    return frozenLeft.at(-1)?.key ?? null;
  });

  readonly _firstFrozenRightKey = computed(() => {
    const frozenRight = this.visibleColumns().filter((col) => col.frozen === 'right');
    return frozenRight[0]?.key ?? null;
  });

  isLastFrozenLeftColumn(key: string): boolean {
    return this._lastFrozenLeftKey() === key;
  }

  isFirstFrozenRightColumn(key: string): boolean {
    return this._firstFrozenRightKey() === key;
  }

  toggleColumnChooser(): void {
    this.columnChooserOpen.update((value) => !value);
  }

  isColumnVisible(key: string): boolean {
    return !this._hiddenColumns().has(key);
  }

  toggleColumnVisibility(key: string): void {
    const next = new Set(this._hiddenColumns());
    if (next.has(key)) {
      next.delete(key);
    } else if (this.visibleColumns().length > 1) {
      next.add(key);
    }
    this._hiddenColumns.set(next);
    this._emitLayoutChange();
  }

  isFirstVisibleColumn(key: string): boolean {
    return this.visibleColumns()[0]?.key === key;
  }

  isLastVisibleColumn(key: string): boolean {
    return this.visibleColumns().at(-1)?.key === key;
  }

  moveColumn(key: string, direction: -1 | 1): void {
    const order = this.orderedColumns().map((col): string => col.key);
    const previousIndex = order.indexOf(key);
    const targetIndex = previousIndex + direction;
    if (previousIndex < 0 || targetIndex < 0 || targetIndex >= order.length) {
      return;
    }

    const next = [...order];
    const [moved] = next.splice(previousIndex, 1);
    next.splice(targetIndex, 0, moved);
    this._columnOrder.set(next);
    this.columnReorder.emit({
      previousIndex,
      currentIndex: targetIndex,
      columns: next,
    });
    this._emitLayoutChange();
  }

  applyLayout(layout: NeuTableLayout): void {
    const keys = this._typedColumns().map((col): string => col.key);
    this._columnOrder.set([
      ...layout.columnOrder.filter((key) => keys.includes(key)),
      ...keys.filter((key) => !layout.columnOrder.includes(key)),
    ]);
    this._hiddenColumns.set(new Set(layout.hiddenColumns.filter((key) => keys.includes(key))));
    this._columnWidths.set(layout.columnWidths ?? {});
    this._emitLayoutChange();
  }

  currentLayout(): NeuTableLayout {
    return {
      columnOrder: this.orderedColumns().map((col) => col.key),
      hiddenColumns: [...this._hiddenColumns()],
      columnWidths: this._columnWidths(),
    };
  }

  isColumnResizable(col: NeuTableColumnInput<T>): boolean {
    const typedColumn = this.asRuntimeColumn(col);
    return this.resizableColumns() && typedColumn.resizable !== false;
  }

  columnWidth(col: NeuTableColumnInput<T>): string | null {
    const typedColumn = this.asRuntimeColumn(col);
    const resized = this._columnWidths()[typedColumn.key];
    if (resized != null) {
      return `${resized}px`;
    }

    return typedColumn.width ?? null;
  }

  startColumnResize(col: NeuTableColumnInput<T>, event: MouseEvent): void {
    if (!this.isColumnResizable(col) || !isPlatformBrowser(this._platformId)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const headerCell = (event.currentTarget as HTMLElement | null)?.closest('th');
    const startWidth =
      (headerCell instanceof HTMLElement ? headerCell.getBoundingClientRect().width : 0) ||
      this._columnWidthPx(col) ||
      160;
    const startX = event.clientX;
    const typedColumn = this.asRuntimeColumn(col);
    const minWidth = typedColumn.minWidth ?? 96;
    const maxWidth = typedColumn.maxWidth ?? Number.POSITIVE_INFINITY;

    this._stopColumnResize();

    const onMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.min(
        maxWidth,
        Math.max(minWidth, Math.round(startWidth + (moveEvent.clientX - startX))),
      );
      this._setColumnWidth(typedColumn.key, nextWidth);
    };

    const onUp = () => {
      const width = this._columnWidths()[typedColumn.key];
      if (width != null) {
        this.columnResize.emit({ key: typedColumn.key, width });
      }
      this._stopColumnResize();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    this._resizeCleanup = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      this._resizeCleanup = null;
    };
  }

  resetColumnWidth(key: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    this._columnWidths.update((current) => {
      if (!(key in current)) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
    this._emitLayoutChange();
  }

  // ── Expansión de filas ────────────────────────────────────────────────
  private readonly _expandedKeys = signal<Set<unknown>>(new Set());

  isRowExpanded(row: T): boolean {
    return this._expandedKeys().has(this.getRowKey(row));
  }

  expandRow(row: T): void {
    const key = this.getRowKey(row);
    const set = this.expandMode() === 'single' ? new Set<unknown>() : new Set(this._expandedKeys());
    set.add(key);
    this._expandedKeys.set(set);
  }

  collapseRow(row: T): void {
    const key = this.getRowKey(row);
    const set = new Set(this._expandedKeys());
    set.delete(key);
    this._expandedKeys.set(set);
  }

  toggleExpand(row: T): void {
    const key = this.getRowKey(row);
    const set = this.expandMode() === 'single' ? new Set<unknown>() : new Set(this._expandedKeys());
    if (this._expandedKeys().has(key)) set.delete(key);
    else set.add(key);
    this._expandedKeys.set(set);
  }

  // ── Selección ─────────────────────────────────────────────────────────
  private readonly _selectedKeys = signal<Set<unknown>>(new Set());
  private readonly _selectionConfirmPending = signal<string | null>(null);

  readonly selectedCount = computed(() => this._selectedKeys().size);
  readonly selectedRows = computed(() =>
    this._rows().filter((row) => this._selectedKeys().has(this.getRowKey(row))),
  );
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

  isRowSelected(row: T): boolean {
    return this._selectedKeys().has(this.getRowKey(row));
  }

  toggleRow(row: T): void {
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
    this._selectionConfirmPending.set(null);
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

  onRowClick(row: T, _event: MouseEvent): void {
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
    this._writeAppliedFilter(colKey, {
      operator: 'and',
      constraints: [{ value }],
      });
    if (this.serverSide()) {
      this._emitServerState({ page: 1 });
    }
  }

  clearColumnFilters(): void {
    this._appliedFilters.set({});
    if (this._openFilterKey()) this._closeFilterOverlay(false);
  }

  // ── Actions ───────────────────────────────────────────────────────────
  isConfirmPending(row: T, action: NeuTableAction<T>): boolean {
    const p = this._confirmPending();
    return p !== null && p.rowKey === this.getRowKey(row) && p.actionKey === action.key;
  }

  handleAction(row: T, action: NeuTableAction<T>): void {
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

  isSelectionConfirmPending(action: NeuTableSelectionAction<T>): boolean {
    return this._selectionConfirmPending() === action.key;
  }

  handleSelectionAction(action: NeuTableSelectionAction<T>): void {
    const rows = this.selectedRows();

    if (action.confirm) {
      if (this._selectionConfirmPending() === action.key) {
        this._selectionConfirmPending.set(null);
        this.selectionActionClick.emit({ action, rows });
      } else {
        this._selectionConfirmPending.set(action.key);
      }
      return;
    }

    this.selectionActionClick.emit({ action, rows });
  }

  cancelSelectionConfirm(): void {
    this._selectionConfirmPending.set(null);
  }

  // ── Export ────────────────────────────────────────────────────────────
  exportCsv(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const cols = this._getExportColumns();
    const headers = cols.map((c) => `"${c.header.replace(/"/g, '""')}"`);
    const rows = this._getExportRows().map((row) =>
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
    const data = this._getExportRows().map((row) => {
      const obj: Record<string, string> = {};
      cols.forEach((col) => (obj[col.key] = this.getCellValue(row, col)));
      return obj;
    });
    this._downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      `${this.exportFileName()}.json`,
    );
  }

  exportXlsx(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const cols = this._getExportColumns();
    const rows = this._getExportRows();
    const escape = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const table = [
      '<table>',
      `<tr>${cols.map((col) => `<th>${escape(col.header)}</th>`).join('')}</tr>`,
      ...rows.map(
        (row) =>
          `<tr>${cols.map((col) => `<td>${escape(this.getCellValue(row, col))}</td>`).join('')}</tr>`,
      ),
      '</table>',
    ].join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>${table}</body></html>`;
    this._downloadBlob(
      new Blob([html], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;',
      }),
      `${this.exportFileName()}.xlsx`,
    );
  }

  private _getExportColumns(): NeuTableColumn<T>[] {
    const keys = this.exportColumns();
    const all = this._typedColumns().filter((c) => c.type !== 'actions');
    return keys.length ? all.filter((c) => keys.includes(c.key)) : all;
  }

  private _getExportRows(): T[] {
    const scope = this.exportScope();

    if (scope === 'filtered') {
      return this.filteredData();
    }

    const selectedRows = this._rows().filter((row) =>
      this._selectedKeys().has(this.getRowKey(row)),
    );

    if (scope === 'selected') {
      return selectedRows;
    }

    return selectedRows.length > 0 ? selectedRows : this.filteredData();
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
  onTableScroll(event: Event): void {
    if (!this._virtualScrollActive()) {
      return;
    }

    this._virtualScrollTop.set((event.target as HTMLElement).scrollTop);
  }

  /**
   * Dynamic string keys are required by the legacy API for paths/computed
   * columns. Keep that boundary local; the rest of the component stays T.
   */
  private getRowValue(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  private asRuntimeColumn(col: NeuTableColumnInput<T>): NeuTableColumn<T> {
    // The input union is intentionally limited to known NeuTableColumn shapes;
    // this cast only normalizes the legacy and explicit string-key boundaries.
    return col as NeuTableColumn<T>;
  }

  getRowKey(row: T): unknown {
    return this.getRowValue(row, this.rowKey()) ?? JSON.stringify(row);
  }

  visibleRowNumber(rowIdx: number): number {
    return (
      (this.currentPage() - 1) * this.effectivePageSize() + this._virtualStartIndex() + rowIdx + 1
    );
  }

  private resetVirtualScrollPosition(): void {
    this._virtualScrollTop.set(0);
    if (!isPlatformBrowser(this._platformId)) return;
    requestAnimationFrame(() => {
      this._scrollContainer()?.nativeElement.scrollTo({ top: 0 });
    });
  }

  getRowClass(row: T): string {
    return this.rowClass()?.(row) ?? '';
  }

  private _columnWidthPx(col: NeuTableColumnInput<T>): number | null {
    const typedColumn = this.asRuntimeColumn(col);
    const resized = this._columnWidths()[typedColumn.key];
    if (resized != null) {
      return resized;
    }

    if (!typedColumn.width || typedColumn.width === 'auto') {
      return null;
    }

    const px = Number.parseFloat(typedColumn.width);
    return Number.isNaN(px) ? null : px;
  }

  private _setColumnWidth(key: string, width: number): void {
    this._columnWidths.update((current) => ({ ...current, [key]: width }));
    this._emitLayoutChange();
  }

  private _stopColumnResize(): void {
    this._resizeCleanup?.();
  }

  getCellValue(row: T, col: NeuTableColumnInput<T>): string {
    const typedColumn = this.asRuntimeColumn(col);
    if (typedColumn.cell) return typedColumn.cell(row);
    const val = this.getRowValue(row, typedColumn.key);
    if (val == null) return '—';
    const locale = typedColumn.locale ?? 'es-ES';
    switch (typedColumn.type) {
      case 'date': {
        const d = val instanceof Date ? val : new Date(String(val));
        return isNaN(d.getTime())
          ? String(val)
          : d.toLocaleDateString(
              locale,
              typedColumn.dateFormat ?? { day: '2-digit', month: '2-digit', year: 'numeric' },
            );
      }
      case 'number':
        return new Intl.NumberFormat(locale, typedColumn.numberFormat).format(Number(val));
      case 'currency':
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: typedColumn.currencyCode ?? 'EUR',
          ...typedColumn.numberFormat,
        }).format(Number(val));
      default:
        return String(val);
    }
  }

  isEditingCell(row: T, col: NeuTableColumnInput<T>): boolean {
    const typedColumn = this.asRuntimeColumn(col);
    const editing = this._editingCell();
    return (
      editing !== null &&
      editing.rowKey === this.getRowKey(row) &&
      editing.columnKey === typedColumn.key
    );
  }

  editingValue(): unknown {
    return this._editingCell()?.value ?? '';
  }

  inlineEditorType(col: NeuTableColumnInput<T>): NeuInlineEditorType {
    return this.asRuntimeColumn(col).editor ?? 'text';
  }

  inlineEditorOptions(col: NeuTableColumnInput<T>): NeuSelectOption[] {
    return (this.asRuntimeColumn(col).editOptions ?? []).map((option) => ({
      label: option,
      value: option,
    }));
  }

  setEditingValue(value: unknown): void {
    this._editingCell.update((editing) => (editing ? { ...editing, value } : editing));
  }

  startCellEdit(row: T, col: NeuTableColumnInput<T>, event?: Event): void {
    const typedColumn = this.asRuntimeColumn(col);
    if (!this.inlineEdit() || !typedColumn.editable) {
      return;
    }

    event?.stopPropagation();
    const previousValue = this.getRowValue(row, typedColumn.key);
    this._editingCell.set({
      rowKey: this.getRowKey(row),
      columnKey: typedColumn.key,
      value: previousValue ?? '',
      previousValue,
    });
  }

  commitCellEdit(row: T, col: NeuTableColumnInput<T>): void {
    const typedColumn = this.asRuntimeColumn(col);
    const editing = this._editingCell();
    if (
      !editing ||
      editing.rowKey !== this.getRowKey(row) ||
      editing.columnKey !== typedColumn.key
    ) {
      return;
    }

    this._editingCell.set(null);
    this.cellEditCommit.emit({
      row,
      column: typedColumn,
      value: editing.value,
      previousValue: editing.previousValue,
    });
  }

  cancelCellEdit(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    this._editingCell.set(null);
  }

  getSortPriority(key: string): number {
    if (!this.multiSort()) return -1;
    return this._sortEntries().findIndex((e) => e.key === key);
  }

  protected modernFilterMode(col: NeuTableColumn<T>): NeuTableFilterMatchMode | null {
    const config = col.filterConfig;
    if (!config || config.kind === 'boolean' || config.kind === 'custom') return null;
    switch (config.kind) {
      case 'number':
        return config.mode ?? 'equals';
      case 'date':
        return config.mode ?? 'is';
      case 'select':
        return 'equals';
      case 'multiSelect':
        return 'in';
      default:
        return config.mode ?? 'contains';
    }
  }

  protected modernFilterLabel(col: NeuTableColumn<T>): string {
    const mode = this.modernFilterMode(col);
    return mode ? `${this.filterAriaPrefix()} ${col.header} (${mode})` : `${this.filterAriaPrefix()} ${col.header}`;
  }

  protected rangeFilterLabel(col: NeuTableColumn<T>, boundary: 'from' | 'to'): string {
    return `${boundary === 'from' ? this.filterFromLabel() : this.filterToLabel()} ${col.header}`;
  }

  protected dateInputType(col: NeuTableColumn<T>): 'date' | 'datetime-local' {
    return col.filterConfig?.kind === 'date' && col.filterConfig.precision === 'instant'
      ? 'datetime-local'
      : 'date';
  }

  protected isDateOnlyRange(col: NeuTableColumn<T>): boolean {
    return col.filterConfig?.kind === 'date' &&
      this.modernFilterMode(col) === 'between' &&
      (col.filterConfig.precision ?? 'date-only') === 'date-only';
  }

  protected isInstantRange(col: NeuTableColumn<T>): boolean {
    return col.filterConfig?.kind === 'date' &&
      this.modernFilterMode(col) === 'between' &&
      col.filterConfig.precision === 'instant';
  }

  protected typedColumnFilterControl(col: NeuTableColumn<T>): FormControl<unknown> {
    let control = this._typedColumnFilterControls.get(col.key);
    if (!control) {
      control = new FormControl<unknown>(
        this._typedFilterControlValue(col, this._appliedSingleFilterValue(col.key)),
      );
      const subscription = control.valueChanges
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe((value) => {
          const currentColumn = this._currentTypedColumn(col.key);
          if (currentColumn) {
            this.setColumnFilter(col.key, this._typedFilterValueFromControl(currentColumn, value));
          }
        });
      this._trackFilterControl(control, subscription);
      this._typedColumnFilterControls.set(col.key, control);
    }
    return control;
  }

  protected typedRangeStartControl(col: NeuTableColumn<T>): FormControl<number | null> {
    return this._typedNumberRangeControl(col, 'from');
  }

  protected typedRangeEndControl(col: NeuTableColumn<T>): FormControl<number | null> {
    return this._typedNumberRangeControl(col, 'to');
  }

  protected typedInstantRangeStartControl(col: NeuTableColumn<T>): FormControl<string> {
    return this._typedInstantRangeControl(col, 'from');
  }

  protected typedInstantRangeEndControl(col: NeuTableColumn<T>): FormControl<string> {
    return this._typedInstantRangeControl(col, 'to');
  }

  protected typedMultiSelectFilterControl(col: NeuTableColumn<T>): FormControl<unknown[]> {
    let control = this._typedMultiSelectFilterControls.get(col.key);
    if (!control) {
      control = new FormControl<unknown[]>(
        this._multiSelectFilterControlValue(this._appliedSingleFilterValue(col.key)),
        {
          nonNullable: true,
        },
      );
      const subscription = control.valueChanges
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe((value) => {
          const currentColumn = this._currentTypedColumn(col.key);
          if (currentColumn?.filterConfig?.kind === 'multiSelect') {
            this.setColumnFilter(col.key, value);
          }
        });
      this._trackFilterControl(control, subscription);
      this._typedMultiSelectFilterControls.set(col.key, control);
    }
    return control;
  }

  protected typedFilterOptions(col: NeuTableColumn<T>): readonly unknown[] {
    const config = col.filterConfig;
    return config?.kind === 'select' || config?.kind === 'multiSelect' ? (config.options ?? []) : [];
  }

  protected typedFilterOptionLabel(col: NeuTableColumn<T>): NeuOptionLabelAccessor<unknown> | null {
    const config = col.filterConfig;
    if (config?.kind !== 'select' && config?.kind !== 'multiSelect') return null;
    return (config.optionLabel ?? null) as NeuOptionLabelAccessor<unknown> | null;
  }

  protected typedFilterOptionValue(col: NeuTableColumn<T>): NeuOptionValueAccessor<unknown, unknown> | null {
    const config = col.filterConfig;
    if (config?.kind !== 'select' && config?.kind !== 'multiSelect') return null;
    return (config.optionValue ?? null) as NeuOptionValueAccessor<unknown, unknown> | null;
  }

  protected typedFilterOptionDisabled(col: NeuTableColumn<T>): NeuOptionDisabledAccessor<unknown> | null {
    const config = col.filterConfig;
    if (config?.kind !== 'select' && config?.kind !== 'multiSelect') return null;
    return (config.optionDisabled ?? null) as NeuOptionDisabledAccessor<unknown> | null;
  }

  protected typedFilterSearchable(col: NeuTableColumn<T>): boolean {
    const config = col.filterConfig;
    return (config?.kind === 'select' || config?.kind === 'multiSelect') && config.searchable === true;
  }

  protected typedFilterVirtualScroll(col: NeuTableColumn<T>): boolean {
    const config = col.filterConfig;
    return (config?.kind === 'select' || config?.kind === 'multiSelect') && config.virtualScroll === true;
  }

  protected typedFilterVirtualScrollVisibleItems(col: NeuTableColumn<T>): number {
    const config = col.filterConfig;
    return config?.kind === 'select' || config?.kind === 'multiSelect'
      ? (config.virtualScrollVisibleItems ?? 8)
      : 8;
  }

  private _typedNumberRangeControl(
    col: NeuTableColumn<T>,
    boundary: 'from' | 'to',
  ): FormControl<number | null> {
    const controls = boundary === 'from' ? this._typedRangeStartControls : this._typedRangeEndControls;
    let control = controls.get(col.key);
    if (!control) {
      control = new FormControl<number | null>(
        neuTableNumberRangeValue(this._appliedSingleFilterValue(col.key))[boundary],
      );
      const subscription = control.valueChanges
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe((value) => {
          const currentColumn = this._currentTypedColumn(col.key);
          if (currentColumn?.filterConfig?.kind !== 'number') return;
          const range = neuTableNumberRangeValue(this._appliedSingleFilterValue(col.key));
          this.setColumnFilter(col.key, { ...range, [boundary]: value });
        });
      this._trackFilterControl(control, subscription);
      controls.set(col.key, control);
    }
    return control;
  }

  private _typedInstantRangeControl(
    col: NeuTableColumn<T>,
    boundary: 'from' | 'to',
  ): FormControl<string> {
    const controls =
      boundary === 'from' ? this._typedInstantRangeStartControls : this._typedInstantRangeEndControls;
    let control = controls.get(col.key);
    if (!control) {
      control = new FormControl<string>(
        neuTableInstantRangeControlValue(this._appliedSingleFilterValue(col.key), boundary),
        {
          nonNullable: true,
        },
      );
      const subscription = control.valueChanges
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe((value) => {
          const currentColumn = this._currentTypedColumn(col.key);
          if (!currentColumn || !this.isInstantRange(currentColumn)) return;
          const range = neuTableDateRangeFilterValue(this._appliedSingleFilterValue(col.key));
          this.setColumnFilter(col.key, { ...range, [boundary]: neuTableInstantFilterValue(value) });
        });
      this._trackFilterControl(control, subscription);
      controls.set(col.key, control);
    }
    return control;
  }

  private _syncTypedFilterControl(col: NeuTableColumn<T>, value: unknown): void {
    if (col.filterConfig?.kind === 'multiSelect') {
      this._typedMultiSelectFilterControls
        .get(col.key)
        ?.setValue(this._multiSelectFilterControlValue(value), { emitEvent: false });
      return;
    }
    if (col.filterConfig?.kind === 'number' && this.modernFilterMode(col) === 'between') {
      const range = neuTableNumberRangeValue(value);
      this._typedRangeStartControls.get(col.key)?.setValue(range.from, { emitEvent: false });
      this._typedRangeEndControls.get(col.key)?.setValue(range.to, { emitEvent: false });
      return;
    }
    if (this.isInstantRange(col)) {
      this._typedInstantRangeStartControls
        .get(col.key)
        ?.setValue(neuTableInstantRangeControlValue(value, 'from'), { emitEvent: false });
      this._typedInstantRangeEndControls
        .get(col.key)
        ?.setValue(neuTableInstantRangeControlValue(value, 'to'), { emitEvent: false });
      return;
    }
    this._typedColumnFilterControls
      .get(col.key)
      ?.setValue(this._typedFilterControlValue(col, value), { emitEvent: false });
  }

  private _typedFilterControlValue(col: NeuTableColumn<T>, value: unknown): unknown {
    const config = col.filterConfig;
    if (!config) return '';
    if (config.kind === 'text') return typeof value === 'string' ? value : '';
    if (config.kind === 'number') return value ?? null;
    if (config.kind === 'boolean') return value === true || value === false ? value : null;
    if (config.kind === 'select') return isNeuTableFilterValueEmpty(value) ? null : value;
    if (config.kind === 'multiSelect') return this._multiSelectFilterControlValue(value);
    if (config.kind === 'date') {
      if (this.isDateOnlyRange(col)) {
        return neuTableDateRangeControlValue(value);
      }
      return neuTableDateInputControlValue(value, config.precision ?? 'date-only');
    }
    return value;
  }

  private _typedFilterValueFromControl(col: NeuTableColumn<T>, value: unknown): unknown {
    const config = col.filterConfig;
    if (!config || config.kind !== 'date') return value;
    const precision = config.precision ?? 'date-only';
    if (this.isInstantRange(col)) return value;
    if (this.modernFilterMode(col) !== 'between') {
      return precision === 'instant' ? neuTableInstantFilterValue(value) : value;
    }
    if (!isNeuTableDateRange(value)) return { from: null, to: null };
    return {
      from: neuTableDateFilterValue(value.start, precision),
      to: neuTableDateFilterValue(value.end, precision),
    };
  }

  private _multiSelectFilterControlValue(value: unknown): unknown[] {
    return Array.isArray(value) ? [...value] : [];
  }

  private _currentTypedColumn(key: string): NeuTableColumn<T> | null {
    return this._typedColumns().find((candidate) => candidate.key === key) ?? null;
  }

  private _writeAppliedFilter(key: string, input: InternalAppliedColumnFilter): void {
    const column = this._currentTypedColumn(key);
    const normalized = this._normalizeAppliedFilterInput(column, input);
    this._appliedFilters.update((current) => {
      if (normalized.constraints.length === 0) {
        if (!(key in current)) return current;
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: normalized };
    });
  }

  private _appliedSingleFilterValue(key: string): unknown {
    const filter = this._appliedFilters()[key];
    return filter?.constraints.length === 1 ? filter.constraints[0].value : undefined;
  }

  private _createLegacyColumnFiltersFacade(): WritableSignal<Record<string, unknown>> {
    const projection = computed<Record<string, unknown>>(() =>
      this._projectLegacyColumnFilters(this._appliedFilters()),
    );
    const readonlyProjection = computed(() => projection());
    const facade = projection as WritableSignal<Record<string, unknown>>;
    facade.set = (filters) => this._replaceAppliedFiltersFromLegacyProjection(filters);
    facade.update = (update) =>
      this._replaceAppliedFiltersFromLegacyProjection(update(projection()));
    facade.asReadonly = () => readonlyProjection;
    return facade;
  }

  private _replaceAppliedFiltersFromLegacyProjection(
    filters: Record<string, unknown>,
  ): void {
    const applied: Record<string, InternalAppliedColumnFilter> = {};
    for (const [key, value] of Object.entries(filters)) {
      applied[key] = this._normalizeAppliedFilterInput(this._currentTypedColumn(key), {
        operator: 'and',
        constraints: [{ value }],
      });
    }
    this._appliedFilters.set(applied);
  }

  private _matchesAppliedColumnFilter(
    row: NeuTableRuntimeRow<T>,
    filter: InternalResolvedAppliedColumnFilter<T>,
  ): boolean {
    if (filter.operator === 'or') {
      for (const constraint of filter.constraints) {
        if (matchesNeuTableFilter(row, filter.column, constraint.value, constraint.mode)) {
          return true;
        }
      }
      return false;
    }

    for (const constraint of filter.constraints) {
      if (!matchesNeuTableFilter(row, filter.column, constraint.value, constraint.mode)) {
        return false;
      }
    }
    return true;
  }

  private _normalizeAppliedFilterInput(
    column: NeuTableColumn<T> | null,
    input: InternalAppliedColumnFilter,
  ): InternalAppliedColumnFilter {
    return {
      operator: input.operator,
      constraints: input.constraints.map((constraint) => {
        const mode = column
          ? column.filterConfig || constraint.mode !== undefined
            ? resolveNeuTableFilterMatchMode(column as NeuTableColumn<T, string>, constraint.mode)
            : undefined
          : undefined;
        const value = column
          ? normalizeNeuTableAppliedFilterValue(
              column as NeuTableColumn<T, string>,
              constraint.value,
              mode,
            )
          : constraint.value;
        const normalizedConstraint: InternalAppliedFilterConstraint =
          mode === undefined ? { value } : { mode, value };
        if (!Object.is(value, constraint.value)) {
          normalizedConstraint.projectionValue = constraint.value;
        }
        return normalizedConstraint;
      }),
    };
  }

  private _projectLegacyColumnFilters(
    appliedFilters: Record<string, InternalAppliedColumnFilter>,
  ): Record<string, unknown> {
    const projection: Record<string, unknown> = {};
    for (const [key, filter] of Object.entries(appliedFilters)) {
      if (filter.constraints.length === 1) {
        const constraint = filter.constraints[0];
        projection[key] = this._appliedConstraintProjectionValue(constraint);
      }
    }
    return projection;
  }

  private _handleFilterColumnLifecycle(columns: readonly NeuTableColumn<T>[]): void {
    const nextSignatures = new Map<string, InternalFilterColumnSignature>();
    const columnsByKey = new Map<string, NeuTableColumn<T>>();
    for (const column of columns) {
      nextSignatures.set(column.key, this._filterColumnSignature(column));
      columnsByKey.set(column.key, column);
    }

    const invalidatedKeys = new Set<string>();
    const controlsToDispose = new Set<string>();
    const modeChanges = new Map<
      string,
      { previous: NeuTableFilterMatchMode | undefined; next: NeuTableFilterMatchMode | undefined }
    >();

    for (const [key, previous] of this._filterColumnSignatures) {
      const next = nextSignatures.get(key);
      if (!next) {
        invalidatedKeys.add(key);
        controlsToDispose.add(key);
        continue;
      }

      const kindChanged = previous.kind !== next.kind;
      const precisionChanged = previous.datePrecision !== next.datePrecision;
      const optionValueChanged = this._optionValueSemanticsChanged(
        previous.optionValue,
        next.optionValue,
      );
      if (kindChanged || precisionChanged || optionValueChanged) {
        invalidatedKeys.add(key);
      }
      if (kindChanged || optionValueChanged || previous.controlKind !== next.controlKind) {
        controlsToDispose.add(key);
      }
      if (!kindChanged && !precisionChanged && previous.mode !== next.mode) {
        modeChanges.set(key, { previous: previous.mode, next: next.mode });
      }
    }

    this._filterColumnSignatures = nextSignatures;

    if (invalidatedKeys.size > 0 || modeChanges.size > 0) {
      untracked(() => {
        const activeKey = this._openFilterKey();
        if (activeKey && invalidatedKeys.has(activeKey)) this._closeFilterOverlay(false);
        this._appliedFilters.update((current) => {
          let next = current;
          const writable = () => {
            if (next === current) next = { ...current };
            return next;
          };

          for (const key of invalidatedKeys) {
            if (key in next) delete writable()[key];
          }

          for (const [key, change] of modeChanges) {
            if (invalidatedKeys.has(key)) continue;
            const filter = next[key];
            const column = columnsByKey.get(key);
            if (
              !filter ||
              !column ||
              filter.constraints.length !== 1 ||
              filter.constraints[0].mode !== change.previous
            ) {
              continue;
            }
            writable()[key] = this._normalizeAppliedFilterInput(column, {
              operator: filter.operator,
              constraints: [
                {
                  mode: change.next,
                  value: filter.constraints[0].value,
                },
              ],
            });
          }
          return next;
        });
      });
    }

    for (const key of controlsToDispose) this._disposeFilterControlsForKey(key);
  }

  private _filterColumnSignature(column: NeuTableColumn<T>): InternalFilterColumnSignature {
    const config = column.filterConfig;
    if (!config) {
      return {
        kind: column.filterable ? 'legacy' : 'none',
        controlKind: column.filterable ? `legacy:${column.filterType ?? 'text'}` : 'none',
      };
    }

    const mode = resolveNeuTableFilterMatchMode(column as NeuTableColumn<T, string>);
    const datePrecision = config.kind === 'date' ? (config.precision ?? 'date-only') : undefined;
    const optionValue =
      config.kind === 'select' || config.kind === 'multiSelect'
        ? (config.optionValue ?? null)
        : undefined;
    const controlKind =
      config.kind === 'number'
        ? mode === 'between'
          ? 'number:between'
          : 'number:single'
        : config.kind === 'date'
          ? `date:${datePrecision}:${mode === 'between' ? 'between' : 'single'}`
          : config.kind;
    return { kind: config.kind, mode, datePrecision, optionValue, controlKind };
  }

  private _optionValueSemanticsChanged(previous: unknown, next: unknown): boolean {
    if (typeof previous === 'function' && typeof next === 'function') return false;
    return !Object.is(previous, next);
  }

  private _appliedConstraintProjectionValue(constraint: InternalAppliedFilterConstraint): unknown {
    return Object.prototype.hasOwnProperty.call(constraint, 'projectionValue')
      ? constraint.projectionValue
      : constraint.value;
  }

  private _trackFilterControl(control: object, subscription: Subscription): void {
    this._filterControlSubscriptions.set(control, subscription);
  }

  private _disposeFilterControlsForKey(key: string): void {
    this._disposeControlFromMap(this._columnFilterControls, key);
    this._disposeControlFromMap(this._typedColumnFilterControls, key);
    this._disposeControlFromMap(this._typedRangeStartControls, key);
    this._disposeControlFromMap(this._typedRangeEndControls, key);
    this._disposeControlFromMap(this._typedInstantRangeStartControls, key);
    this._disposeControlFromMap(this._typedInstantRangeEndControls, key);
    this._disposeControlFromMap(this._typedMultiSelectFilterControls, key);
  }

  private _disposeControlFromMap<C extends object>(map: Map<string, C>, key: string): void {
    const control = map.get(key);
    if (!control) return;
    this._filterControlSubscriptions.get(control)?.unsubscribe();
    this._filterControlSubscriptions.delete(control);
    map.delete(key);
  }

  private _disposeAllFilterControls(): void {
    const keys = new Set<string>([
      ...this._columnFilterControls.keys(),
      ...this._typedColumnFilterControls.keys(),
      ...this._typedRangeStartControls.keys(),
      ...this._typedRangeEndControls.keys(),
      ...this._typedInstantRangeStartControls.keys(),
      ...this._typedInstantRangeEndControls.keys(),
      ...this._typedMultiSelectFilterControls.keys(),
    ]);
    for (const key of keys) this._disposeFilterControlsForKey(key);
    for (const subscription of this._filterControlSubscriptions.values()) {
      subscription.unsubscribe();
    }
    this._filterControlSubscriptions.clear();
    this._filterColumnSignatures.clear();
  }

  columnFilterControl(key: string): FormControl<string> {
    let control = this._columnFilterControls.get(key);
    if (!control) {
      control = new FormControl(String(this.getColumnFilterValue(key)), {
        nonNullable: true,
      });
      const subscription = control.valueChanges
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe((value) => this.setColumnFilter(key, value));
      this._trackFilterControl(control, subscription);
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
      typedColumnFilters: this._typedColumnFiltersState(),
      localOnlyFilters: this._localOnlyFilters(),
    };
    this.serverStateChange.emit({ ...current, ...patch });
  }
  private _typedColumnFiltersState(): Record<string, NeuTableFilterState> {
    const result: Record<string, NeuTableFilterState> = {};
    const columnsByKey = new Map<string, NeuTableColumn<T>>(
      this._typedColumns().map((column) => [column.key, column] as const),
    );
    for (const [key, filter] of Object.entries(this._appliedFilters())) {
      if (filter.constraints.length !== 1) continue;
      const constraint = filter.constraints[0];
      if (isNeuTableFilterValueEmpty(constraint.value)) continue;
      const column = columnsByKey.get(key);
      if (!column) continue;
      const state = buildNeuTableFilterState(
        column as NeuTableColumn<T, string>,
        constraint.value,
        constraint.mode,
      );
      if (state) result[key] = state;
    }
    return result;
  }

  private _localOnlyFilters(): string[] {
    const customKeys = new Set<string>(
      this._typedColumns()
        .filter((column) => column.filterConfig?.kind === 'custom')
        .map((column) => column.key),
    );
    return Object.entries(this._appliedFilters()).flatMap(([key, filter]) =>
      customKeys.has(key) &&
      filter.constraints.some((constraint) => !isNeuTableFilterValueEmpty(constraint.value))
        ? [key]
        : [],
    );
  }

  private _emitLayoutChange(): void {
    this.layoutChange.emit(this.currentLayout());
  }
}
