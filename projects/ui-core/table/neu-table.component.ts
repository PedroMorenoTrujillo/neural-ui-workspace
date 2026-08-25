import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
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
import type * as _angular_core from '@angular/core';
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
import { resolveNeuOptionValue } from '@neural-ui/core/option-api';
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
  NeuTableSelection,
  NeuTableSelectionMode,
  NeuTableSelectionSource,
  NeuTableRowSelectionEvent,
  NeuTableRowExpansionEvent,
  NeuTableSelectAllChangeEvent,
  NeuTableSelectAllScope,
  NeuTableDatePoint,
  NeuTableDateRangeValue,
  NeuTableFilterConfig,
  NeuTableGlobalFilterAccessor,
  NeuTableGlobalFilterField,
  NeuTableFilterKind,
  NeuTableFilterMatchMode,
  NeuTableFilterState,
  NeuTableLazyPlaceholderContext,
  NeuTableLazyRequest,
  NeuTableLazyRequestReason,
  NeuTableQueryState,
  NeuTableServerState,
  NeuTableSortEntry,
  NeuTableSortState,
  NeuTableStateSnapshot,
  NeuTableStateStorage,
  NeuTableVirtualRange,
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
import {
  NeuTableStateController,
  type InternalAppliedColumnFilter,
  type InternalAppliedFilterConstraint,
  type InternalAppliedFilterOperator,
  type InternalNeuTableState,
  type InternalNeuTableStateChange,
} from './neu-table-state.controller';
import {
  NeuTableUrlStateAdapter,
  type InternalNeuTableUrlStateConfig,
} from './neu-table-url-state.adapter';
import { NeuTableStatePersistenceAdapter } from './neu-table-state-persistence.adapter';
import { NeuTableSelectionController } from './neu-table-selection.controller';
import { NeuTableSortController } from './neu-table-sort.controller';
import {
  NeuTableKeyboardController,
  type NeuTableRowNavigationIntent,
} from './neu-table-keyboard.controller';
import { NeuTableQueryController } from './neu-table-query.controller';
import {
  NeuTableLazyDataController,
  type NeuTableVirtualSlot,
} from './neu-table-lazy-data.controller';

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
  NeuTableSelection,
  NeuTableSelectionMode,
  NeuTableSelectionSource,
  NeuTableRowSelectionEvent,
  NeuTableRowExpansionEvent,
  NeuTableSelectAllChangeEvent,
  NeuTableSelectAllScope,
  NeuTableDatePoint,
  NeuTableDateRangeValue,
  NeuTableFilterConfig,
  NeuTableGlobalFilterAccessor,
  NeuTableGlobalFilterField,
  NeuTableFilterKind,
  NeuTableFilterMatchMode,
  NeuTableFilterState,
  NeuTableLazyPlaceholderContext,
  NeuTableLazyRequest,
  NeuTableLazyRequestReason,
  NeuTableQueryColumnFilter,
  NeuTableQueryFilterConstraint,
  NeuTableQuerySerializability,
  NeuTableQuerySerializationStatus,
  NeuTableQueryState,
  NeuTableNumberRangeValue,
  NeuTableServerState,
  NeuTableSortEntry,
  NeuTableSortState,
  NeuTableStateKey,
  NeuTableStateOmissions,
  NeuTableStateSnapshot,
  NeuTableStateStorage,
  NeuTableVirtualRange,
  NeuTableRow,
  NeuTableRowKey,
} from './neu-table.types';

type NeuTableRuntimeRow<T extends object> = T & Record<string, unknown>;

type NeuTablePageEntry<T extends object> =
  | { kind: 'group'; key: string; label: string; count: number }
  | { kind: 'placeholder'; key: string; logicalIndex: number }
  | {
      kind: 'row';
      key: unknown;
      row: NeuTableRuntimeRow<T>;
      rowIndex: number;
      logicalIndex: number;
    };

type NeuTableData<T> = [T] extends [Record<string, unknown>]
  ? readonly T[] | readonly object[]
  : readonly T[];

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

interface InternalResolvedGlobalFilterField<T> {
  values: (row: T) => readonly unknown[];
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
let _neuTableSelectionIdSeq = 0;

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
      @if (selectionEnabled() && selectedCount() > 0) {
        <div class="neu-table__selection-bar">
          <div class="neu-table__selection-main">
            <span>{{ selectedRowsInfo() }}</span>
            @if (selectionActions().length > 0 && selectedRows().length > 0) {
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
        [attr.aria-busy]="loading() ? true : null"
        [style.max-height]="_virtualScrollActive() ? virtualContainerMaxHeight() : null"
        (scroll)="onTableScroll($event)"
      >
        <table class="neu-table" [attr.aria-rowcount]="_logicalTotalItems()">
          <thead class="neu-table__head">
            <tr>
              <!-- Checkbox de selección global -->
              @if (_expansionEnabled()) {
                <th class="neu-table__th neu-table__th--expand-col" scope="col"></th>
              }
              @if (selectionEnabled()) {
                <th class="neu-table__th neu-table__th--check" scope="col">
                  @if (multipleSelection()) {
                    <neu-checkbox
                      class="neu-table__checkbox"
                      [checked]="headerSelectionState().checked"
                      [indeterminate]="headerSelectionState().indeterminate"
                      [disabled]="headerSelectionState().disabled"
                      [ariaLabel]="resolvedSelectAllAriaLabel()"
                      (checkedChange)="toggleAll()"
                    />
                  }
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
                  [attr.tabindex]="sortable() && col.sortable !== false ? 0 : null"
                  [attr.aria-sort]="
                    sortable() && col.sortable !== false ? sortAriaValue(col.key) : null
                  "
                  (click)="onSortableHeaderClick(col.key, $event)"
                  (keydown)="onSortableHeaderKeydown(col.key, $event)"
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
                    @if (sortPriorityDescription(col.key); as description) {
                      <span class="sr-only">{{ description }}</span>
                    }
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
                @if (_expansionEnabled()) {
                  <th class="neu-table__th neu-table__th--filter-placeholder" scope="col"></th>
                }
                @if (selectionEnabled()) {
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
                            [virtualScrollVisibleItems]="typedFilterVirtualScrollVisibleItems(col)"
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
                            [virtualScrollVisibleItems]="typedFilterVirtualScrollVisibleItems(col)"
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
            @if (loading() && !_lazyVirtualActive()) {
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
            } @else if (_tableEmpty()) {
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
                @if (entry.kind === 'placeholder') {
                  <tr
                    class="neu-table__row neu-table__row--placeholder"
                    aria-hidden="true"
                    inert
                    [style.height.px]="_virtualItemSize()"
                    [attr.data-neu-table-placeholder-index]="entry.logicalIndex"
                  >
                    @if (lazyPlaceholderTemplate(); as placeholderTemplate) {
                      <ng-container
                        [ngTemplateOutlet]="placeholderTemplate"
                        [ngTemplateOutletContext]="lazyPlaceholderContext(entry.logicalIndex)"
                      />
                    } @else {
                      @if (selectionEnabled()) {
                        <td class="neu-table__td neu-table__th--check"></td>
                      }
                      @if (showRowNumbers()) {
                        <td class="neu-table__td neu-table__td--rn">
                          <span class="neu-table__lazy-skeleton"></span>
                        </td>
                      }
                      @for (col of visibleColumns(); track col.key) {
                        <td
                          class="neu-table__td neu-table__td--placeholder"
                          [class.neu-table__td--frozen-left]="col.frozen === 'left'"
                          [class.neu-table__td--frozen-right]="col.frozen === 'right'"
                          [style.left]="
                            col.frozen === 'left'
                              ? (_frozenLeftOffsets().get(col.key) ?? 0) + 'px'
                              : null
                          "
                          [style.width]="columnWidth(col)"
                          [style.min-width]="columnWidth(col)"
                          [style.max-width]="columnWidth(col)"
                        >
                          <span class="neu-table__lazy-skeleton"></span>
                        </td>
                      }
                    }
                  </tr>
                } @else if (entry.kind === 'group') {
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
                    [style.height.px]="_virtualScrollActive() ? _virtualItemSize() : null"
                    [class]="getRowClass(row)"
                    [class.neu-table__row--selected]="isRowSelected(row)"
                    [class.neu-table__row--disabled]="!isRowSelectable(row)"
                    [class.neu-table__row--clickable]="
                      selectionEnabled() && selectOnRowClick() && isRowSelectable(row)
                    "
                    [attr.tabindex]="rowTabIndex(row)"
                    [attr.data-neu-table-navigable]="isNavigableRow(row) ? 'true' : null"
                    [attr.aria-selected]="
                      selectionEnabled() && isRowSelectable(row) ? isRowSelected(row) : null
                    "
                    [attr.aria-disabled]="selectionEnabled() && !isRowSelectable(row) ? true : null"
                    [attr.aria-rowindex]="
                      _lazyVirtualActive()
                        ? entry.logicalIndex + (_hasFilterableCol() ? 3 : 2)
                        : null
                    "
                    [attr.data-neu-table-logical-index]="entry.logicalIndex"
                    (click)="onRowClick(row, $event)"
                    (dblclick)="rowDblClick.emit(row)"
                    (focus)="onRowFocus(row, $event)"
                    (keydown)="onRowKeydown(row, $event)"
                  >
                    @if (_expansionEnabled()) {
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
                          [attr.aria-label]="rowExpansionAriaLabel(row)"
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
                    @if (selectionEnabled()) {
                      <td
                        class="neu-table__td neu-table__th--check"
                        (click)="$event.stopPropagation()"
                      >
                        @if (multipleSelection()) {
                          <neu-checkbox
                            class="neu-table__checkbox"
                            [checked]="isRowSelected(row)"
                            [disabled]="!isRowSelectable(row)"
                            [ariaLabel]="rowSelectionAriaLabel(row)"
                            (checkedChange)="toggleRow(row, 'checkbox')"
                          />
                        } @else {
                          <input
                            class="neu-table__radio"
                            type="radio"
                            [name]="_selectionRadioName"
                            [checked]="isRowSelected(row)"
                            [disabled]="!isRowSelectable(row)"
                            [attr.aria-label]="rowSelectionAriaLabel(row)"
                            (change)="toggleRow(row, 'radio')"
                          />
                        }
                      </td>
                    }
                    @if (showRowNumbers()) {
                      <td class="neu-table__td neu-table__td--rn">
                        {{
                          visibleRowNumber(
                            _lazyVirtualActive() ? entry.logicalIndex : entry.rowIndex
                          )
                        }}
                      </td>
                    }
                    @for (col of visibleColumns(); track col.key) {
                      <td
                        class="neu-table__td"
                        [class]="col.cellClass ?? ''"
                        [class.neu-table__td--frozen-left]="col.frozen === 'left'"
                        [class.neu-table__td--frozen-right]="col.frozen === 'right'"
                        [class.neu-table__td--frozen-left-boundary]="
                          isLastFrozenLeftColumn(col.key)
                        "
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
                  @if (_expansionEnabled() && isRowExpanded(row)) {
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
                @if (_expansionEnabled()) {
                  <td class="neu-table__td"></td>
                }
                @if (selectionEnabled()) {
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
      @if (!loading() && filteredData().length > 0 && !_lazyVirtualActive()) {
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
  private readonly _state = new NeuTableStateController<unknown>((change) =>
    this._onCanonicalStateChange(change),
  );
  private readonly _selectionController = new NeuTableSelectionController<T, unknown>((row) =>
    this.getRowKey(row),
  );
  private readonly _sortController = new NeuTableSortController<T>();
  private readonly _queryController = new NeuTableQueryController<T>();
  private readonly _lazyDataController = new NeuTableLazyDataController<NeuTableRuntimeRow<T>>();
  private readonly _keyboardController = new NeuTableKeyboardController<unknown>();
  protected readonly _selectionRadioName = `neu-table-selection-${_neuTableSelectionIdSeq++}`;
  private readonly _urlAdapter = new NeuTableUrlStateAdapter(this._urlState);
  private readonly _persistenceAdapter = new NeuTableStatePersistenceAdapter();
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _document = inject(DOCUMENT);
  private readonly _scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  private _virtualScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly _filterOverlayUid = _neuTableFilterOverlayIdSeq++;
  private _activeFilterTrigger: HTMLElement | null = null;
  private _lastFilterWorkflowFocus: HTMLElement | null = null;
  private _escapeReturnFocus: HTMLElement | null = null;
  private _filterOverlayFocusCleanup: (() => void) | null = null;
  private readonly _filterOverlayOwnedChildPanes = new Map<HTMLElement, HTMLElement>();
  private readonly _filterOverlayOwnedChildBackdrops = new Map<HTMLElement, HTMLElement>();
  private _pendingFilterOverlayChildTrigger: HTMLElement | null = null;
  private _destroyed = false;
  private _initialQueryHandled = false;
  private _lastEmittedQuery: NeuTableQueryState | null = null;
  private _statePersistenceReady = false;
  private _restoringState = false;
  private _restoredStateSignature: string | null = null;

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
  /** Optional override; when omitted the accessible label follows selectAllScope. */
  readonly selectAllAriaLabel = input<string | undefined>(undefined);
  readonly selectRowAriaLabel = input<string>('Select row');
  readonly unselectRowAriaLabel = input<string>('Unselect row');
  readonly expandRowAriaLabel = input<string>('Expand row');
  readonly collapseRowAriaLabel = input<string>('Collapse row');
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
  /** Opt-in asc -> desc -> unsorted cycle. The legacy two-state cycle remains the default. */
  readonly removableSort = input<boolean>(false);
  /** Presence controls the active sort slice. Empty means unsorted. */
  readonly sort = input<NeuTableSortState | undefined>(undefined);
  /** Omit to preserve the historical all-column global-search policy. */
  readonly globalFilterFields = input<readonly NeuTableGlobalFilterField<T>[] | undefined>(
    undefined,
  );
  readonly selectable = input<boolean>(false);
  /** Typed selection supersedes legacy selectable=true, which remains multiple mode. */
  readonly selectionMode = input<NeuTableSelectionMode>('none');
  /** Presence of this input makes only the canonical selection slice controlled. */
  readonly selection = input<NeuTableSelection<T> | undefined>(undefined);
  readonly rowSelectable = input<((row: T, index: number) => boolean) | undefined>(undefined);
  readonly selectAllScope = input<NeuTableSelectAllScope>('filtered');
  readonly selectOnRowClick = input<boolean>(true);
  readonly metaKeySelection = input<boolean>(false);
  readonly expandable = input<boolean>(false);
  readonly expandMode: _angular_core.InputSignal<'multiple' | 'single'> = input<
    'multiple' | 'single'
  >('multiple');
  /** Presence makes expanded row keys consumer-authoritative. */
  readonly expandedRowKeys = input<readonly unknown[] | undefined>(undefined);
  readonly exportable = input<boolean>(false);
  readonly exportFileName = input<string>('export');
  readonly pageSizeOptions = input<number[]>([]);
  readonly stickyHeader = input<boolean>(false);
  readonly virtualScroll = input<boolean>(false);
  readonly virtualScrollVisibleItems = input<number>(8);
  /** Fixed virtual row height in pixels; density height is the fallback. */
  readonly virtualScrollItemSize = input<number | undefined>(undefined);
  /** Additional logical rows rendered/requested before and after the viewport. */
  readonly virtualScrollOverscan = input<number>(3);
  /** Debounce applied to virtual range rendering and lazy requests. */
  readonly virtualScrollDelay = input<number>(0);
  /** Presentation-only cells for unloaded sparse rows; no fake T is exposed. */
  readonly lazyPlaceholderTemplate = input<
    TemplateRef<NeuTableLazyPlaceholderContext<T>> | undefined
  >(undefined);
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
  /** Presence makes every server/query slice consumer-authoritative. */
  readonly query = input<NeuTableQueryState | undefined>(undefined);
  /** Opt-in one-time initial server/query event after initial inputs and URL restore. */
  readonly lazyLoadOnInit = input<boolean>(false);
  readonly totalItems = input<number | undefined>(undefined);
  /** Logical index of data[0]. Presence opts server virtual scrolling into sparse mode. */
  readonly dataFirst = input<number | undefined>(undefined);
  readonly multiSort = input<boolean>(false);
  readonly exportFormats = input<('csv' | 'json' | 'xlsx')[]>(['csv']);
  readonly exportColumns = input<string[]>([]);
  readonly exportScope: _angular_core.InputSignal<'selected' | 'filtered' | 'auto'> = input<
    'selected' | 'filtered' | 'auto'
  >('auto');
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

  // ── Automatic state persistence ─────────────────────────────────────
  /** Presence enables versioned automatic persistence, matching PrimeNG's stateful opt-in. */
  readonly stateKey = input<string | undefined>(undefined);
  readonly stateStorage = input<NeuTableStateStorage>('session');

  // ── Outputs ───────────────────────────────────────────────────────────
  readonly selectionChange = output<T[]>();
  readonly rowSelect = output<NeuTableRowSelectionEvent<T>>();
  readonly rowUnselect = output<NeuTableRowSelectionEvent<T>>();
  readonly expandedRowKeysChange = output<readonly unknown[]>();
  readonly rowExpand = output<NeuTableRowExpansionEvent<T>>();
  readonly rowCollapse = output<NeuTableRowExpansionEvent<T>>();
  readonly selectAllChange = output<NeuTableSelectAllChangeEvent<T>>();
  readonly rowClick = output<T>();
  readonly rowDblClick = output<T>();
  readonly actionClick = output<NeuTableActionEvent<T>>();
  readonly selectionActionClick = output<NeuTableSelectionActionEvent<T>>();
  readonly serverStateChange = output<NeuTableServerState>();
  /** One immutable canonical proposal per semantic query action. */
  readonly queryChange = output<NeuTableQueryState>();
  /** Atomic fetch trigger for server-backed sparse virtual scrolling. */
  readonly lazyRequest = output<NeuTableLazyRequest>();
  readonly searchChange = output<string>();
  /** One immutable canonical snapshot per user sort action. */
  readonly sortChange = output<NeuTableSortState>();
  readonly columnResize = output<{ key: string; width: number }>();
  readonly columnReorder = output<NeuTableColumnReorderEvent>();
  readonly layoutChange = output<NeuTableLayout>();
  readonly cellEditCommit = output<NeuTableCellEditEvent<T>>();
  readonly stateSave = output<NeuTableStateSnapshot>();
  readonly stateRestore = output<NeuTableStateSnapshot>();

  // ── Canonical consumer-relevant state ─────────────────────────────────
  private readonly _columnWidths = computed(() => this._state.layout().columnWidths);
  private readonly _columnOrder = this._state.createColumnOrderFacade();
  private readonly _hiddenColumns = computed(
    () => new Set<string>(this._state.layout().hiddenColumns),
  );
  readonly columnChooserOpen = signal(false);
  private readonly _editingCell = signal<{
    rowKey: unknown;
    columnKey: string;
    value: unknown;
    previousValue: unknown;
  } | null>(null);
  private _resizeCleanup: (() => void) | null = null;

  readonly currentPage = this._state.page;
  readonly searchQuery = this._state.search;
  readonly sortKey = computed(() => this._state.sort()?.key ?? '');
  readonly sortDir = computed<'asc' | 'desc'>(() => this._state.sort()?.dir ?? 'asc');
  /** Immutable current sort projection. Empty means no active sort. */
  readonly currentSort = computed<NeuTableSortState>(() =>
    this.multiSort()
      ? this._freezeSortState(this._state.sortEntries())
      : this._freezeSortState(this._state.sort() ? [this._state.sort()!] : []),
  );

  // ---- Pipeline de datos / Data pipeline ----
  // ── Estado interno ────────────────────────────────────────────────────
  private readonly _exactMatch = signal(false);
  readonly exactMatch = this._exactMatch.asReadonly();

  /**
   * Multi-sort entries derived from URL param or internal state.
   * Entradas de multisort derivadas del param de URL o del estado interno.
   */
  readonly _sortEntries = computed<NeuTableSortEntry[]>(() =>
    this.multiSort() ? [...this._state.sortEntries()] : [],
  );
  private readonly _appliedFilters = this._state.createFiltersFacade();
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
  private readonly _typedColumns = computed<readonly NeuTableColumn<T>[]>(() =>
    this.columns().map((column) => this.asRuntimeColumn(column)),
  );

  private readonly _resolvedGlobalFilterFields = computed<
    readonly InternalResolvedGlobalFilterField<T>[]
  >(() => {
    const columns = this._typedColumns();
    const columnsByKey = new Map<string, NeuTableColumn<T>>(
      columns.map((column) => [column.key, column] as [string, NeuTableColumn<T>]),
    );
    const configured = this.globalFilterFields();
    if (configured === undefined) {
      return columns.map((column) => ({
        values: (row: T) => this._globalColumnValues(row, column),
      }));
    }
    const directKeys = new Set<string>();
    return configured.flatMap((field) => {
      if (this._isGlobalFilterAccessor(field)) {
        return [{ values: (row: T) => [field.accessor(row)] }];
      }
      const key = String(field);
      if (directKeys.has(key)) return [];
      directKeys.add(key);
      const column = columnsByKey.get(key);
      return [
        {
          values: column
            ? (row: T) => this._globalColumnValues(row, column)
            : (row: T) => [this.getRowValue(row, key)],
        },
      ];
    });
  });

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

  private _urlConfig(): InternalNeuTableUrlStateConfig {
    return {
      pageParam: this.pageParam(),
      searchParam: this.searchParam(),
      sortParam: this.sortParam(),
      sortDirParam: this.sortDirParam(),
      multiSortParam: this.multiSortParam(),
    };
  }

  private _queryConfig() {
    return {
      columns: this._typedColumns(),
      globalFilterFields: this.globalFilterFields(),
      multiSort: this.multiSort(),
    } as const;
  }

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
      this._cancelPendingVirtualScroll();
      this._disposeAllFilterControls();
    });

    this._pageSizeControl.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value) => this.onPageSizeChange(value));

    effect(() => {
      const controlled = this.query();
      const config = this._queryConfig();
      untracked(() => {
        if (controlled === undefined) {
          this._state.releaseControlledQuery();
          return;
        }
        const changed = this._state.setControlledQuery(
          this._queryController.controlledPatch(controlled),
        );
        this._lastEmittedQuery = this._queryController.build(this._state.snapshot(), config);
        if (changed) this._saveStateIfReady();
      });
    });

    effect(() => {
      const pageSize = this.pageSize();
      if (this.query() !== undefined) return;
      untracked(() => this._state.setPageSize(pageSize, 'input'));
    });

    effect(() => {
      const selection = this.selection();
      const mode = this.effectiveSelectionMode();
      this.rowKey();
      untracked(() => {
        if (selection === undefined) {
          this._state.releaseControlledSelection();
          if (mode === 'single' && this._state.selectionKeys().size > 1) {
            const first = this._state.selectionKeys().values().next().value;
            this._state.setSelectionKeys(
              first === undefined ? new Set() : new Set([first]),
              'input',
            );
          }
          return;
        }
        const changed = this._state.setControlledSelectionKeys(
          this._selectionController.keysFromSelection(selection, mode),
        );
        if (changed) this._saveStateIfReady();
      });
    });

    effect(() => {
      const controlled = this.sort();
      const queryControlled = this.query() !== undefined;
      const multiple = this.multiSort();
      const currentSingle = this._state.sort();
      const currentEntries = this._state.sortEntries();
      untracked(() => {
        if (queryControlled) return;
        if (controlled === undefined) {
          this._state.releaseControlledSort();
          this._state.update(
            multiple
              ? {
                  sort: null,
                  sortEntries:
                    currentEntries.length > 0
                      ? currentEntries
                      : currentSingle
                        ? [currentSingle]
                        : [],
                }
              : {
                  sort: currentSingle ?? currentEntries[0] ?? null,
                  sortEntries: [],
                },
            'input',
          );
          return;
        }
        const entries = this._normalizeSortState(controlled, multiple);
        const changed = this._state.setControlledSort(
          multiple ? null : (entries[0] ?? null),
          multiple ? entries : [],
        );
        if (changed) this._saveStateIfReady();
      });
    });

    effect(() => {
      const controlled = this.expandedRowKeys();
      const mode = this.expandMode();
      untracked(() => {
        if (controlled === undefined) {
          this._state.releaseControlledExpansion();
          if (mode === 'single' && this._state.expansionKeys().size > 1) {
            const first = this._state.expansionKeys().values().next().value;
            this._state.setExpansionKeys(
              first === undefined ? new Set() : new Set([first]),
              'input',
            );
          }
          return;
        }
        const changed = this._state.setControlledExpansionKeys(
          this._normalizeExpansionKeys(controlled, mode),
        );
        if (changed) this._saveStateIfReady();
      });
    });

    effect(() => {
      const nextSize = String(this.effectivePageSize());
      if (this._pageSizeControl.value !== nextSize) {
        this._pageSizeControl.setValue(nextSize, { emitEvent: false });
      }
    });

    effect(() => {
      this._handleFilterColumnLifecycle(this._typedColumns());
    });

    let queryConfigInitialized = false;
    effect(() => {
      const config = this._queryConfig();
      untracked(() => {
        const state = this._state.snapshot();
        const projected = this._queryController.build(state, config);
        if (!queryConfigInitialized) {
          queryConfigInitialized = true;
          this._lastEmittedQuery ??= projected;
          return;
        }
        if (this._queryController.equal(this._lastEmittedQuery, projected)) return;
        this._emitQueryState(state);
      });
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
      untracked(() => {
        const current = this._state.layout();
        const rawOrder = layout?.columnOrder?.length ? layout.columnOrder : current.columnOrder;
        this._state.setLayout(
          {
            columnOrder: [
              ...rawOrder.filter((key) => keys.includes(key)),
              ...keys.filter((key) => !rawOrder.includes(key)),
            ],
            hiddenColumns: (layout?.hiddenColumns ?? current.hiddenColumns).filter((key) =>
              keys.includes(key),
            ),
            columnWidths: layout?.columnWidths ?? current.columnWidths,
          },
          'input',
        );
      });
    });

    effect(() => {
      const key = this.stateKey()?.trim() ?? '';
      const storageKind = this.stateStorage();
      const urlSnapshot =
        this.useUrlState() && this.query() === undefined
          ? this._urlAdapter.read(this._urlConfig())
          : null;
      untracked(() => {
        const signature = `${storageKind}:${key}`;
        if (signature !== this._restoredStateSignature) {
          this._statePersistenceReady = false;
          this._restoredStateSignature = signature;
          const restored = key ? this._readPersistedState(key, storageKind) : null;
          if (restored) {
            this._applyPersistedState(restored);
            this.stateRestore.emit(this.currentState());
          }
        }
        if (urlSnapshot) this._state.update(urlSnapshot, 'url');
        this._statePersistenceReady = true;
      });
    });

    effect(() => {
      if (!this.virtualScroll()) {
        return;
      }

      if (this._lazyVirtualActive()) return;

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

    let previousLazyViewport: {
      total: number;
      itemSize: number;
      visibleItems: number;
      overscan: number;
    } | null = null;
    effect(() => {
      const active = this._lazyVirtualActive();
      const total = this._logicalTotalItems();
      const itemSize = this._virtualItemSize();
      const visibleItems = this._virtualVisibleItems();
      const overscan = this._virtualOverscan();
      untracked(() => {
        if (!active) {
          previousLazyViewport = null;
          this._lazyDataController.forgetRange();
          return;
        }

        const previous = previousLazyViewport;
        previousLazyViewport = { total, itemSize, visibleItems, overscan };
        if (previous === null) return;

        if (total < previous.total) {
          const maxFirst = Math.max(0, total - visibleItems);
          const maxScrollTop =
            maxFirst === 0 ? 0 : this._virtualHeaderHeight() + maxFirst * itemSize;
          if (this._virtualScrollTop() > maxScrollTop) {
            this._cancelPendingVirtualScroll();
            this._virtualScrollTop.set(maxScrollTop);
            this._scrollVirtualElementTo(maxScrollTop);
            this._emitLazyRequest('total-change');
            return;
          }
        }

        if (
          previous.itemSize !== itemSize ||
          previous.visibleItems !== visibleItems ||
          previous.overscan !== overscan
        ) {
          this._cancelPendingVirtualScroll();
          this._emitLazyRequest('viewport-change');
        }
      });
    });

    effect(() => {
      const editing = this._editingCell();
      const rows = this._rows();
      if (!editing || !this._lazyVirtualActive()) return;
      if (rows.some((row) => Object.is(this.getRowKey(row), editing.rowKey))) return;
      untracked(() => this.cancelCellEdit());
    });

    effect(() => {
      const keys = this._navigableRows().map((row) => this.getRowKey(row));
      const selected = this._selectedKeys();
      untracked(() => this._keyboardController.reconcile(keys, selected));
    });

    let keyboardAnchorInitialized = false;
    effect(() => {
      this.currentPage();
      this.searchQuery();
      this.currentSort();
      this._appliedFilters();
      this.data();
      this.effectiveSelectionMode();
      untracked(() => {
        if (keyboardAnchorInitialized) this._keyboardController.resetAnchor();
        keyboardAnchorInitialized = true;
      });
    });

    effect(() => {
      const serverSide = this.serverSide();
      const lazyLoadOnInit = this.lazyLoadOnInit();
      const state = this._state.snapshot();
      this._queryConfig();
      untracked(() => {
        if (this._initialQueryHandled) return;
        this._initialQueryHandled = true;
        if (serverSide && lazyLoadOnInit) this._emitQueryState(state, true);
      });
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
      return this._filterOverlayCustomTemplate(column) !== null;
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
    this._advancedFilter.initialize(column, this._appliedFilters()[column.key]);
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
    const changed = this._writeAppliedFilter(key, result.filter);
    if (changed) this._emitQueryState(changed.current);
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
          if (
            !trigger ||
            !trigger.isConnected ||
            trigger.getAttribute('aria-expanded') !== 'true'
          ) {
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
      target instanceof Element
        ? target.closest<HTMLElement>(_NEU_TABLE_FILTER_CHILD_TRIGGER)
        : null;
    this._pendingFilterOverlayChildTrigger = trigger && panel?.contains(trigger) ? trigger : null;
  }

  private _refreshFilterOverlayOwnership(panel: HTMLElement): void {
    for (const [pane, trigger] of this._filterOverlayOwnedChildPanes) {
      if (
        !pane.isConnected ||
        !trigger.isConnected ||
        trigger.getAttribute('aria-expanded') !== 'true'
      ) {
        this._filterOverlayOwnedChildPanes.delete(pane);
      }
    }
    for (const [backdrop, trigger] of this._filterOverlayOwnedChildBackdrops) {
      if (
        !backdrop.isConnected ||
        !trigger.isConnected ||
        trigger.getAttribute('aria-expanded') !== 'true'
      ) {
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
    const globalFields = this._resolvedGlobalFilterFields();
    const activeColumnFilters = this._resolvedAppliedFilters();
    const q = this.searchQuery().trim().toLowerCase();
    const exact = this._exactMatch();
    const matches = (text: string) =>
      exact ? text.toLowerCase() === q : text.toLowerCase().includes(q);
    return rows.filter((row) => {
      const passesGlobal =
        !q ||
        globalFields.some((field) =>
          field.values(row).some((value) => matches(String(value ?? ''))),
        );
      if (!passesGlobal) return false;
      for (const filter of activeColumnFilters) {
        if (!this._matchesAppliedColumnFilter(row, filter)) return false;
      }
      return true;
    });
  });

  readonly sortedData = computed<NeuTableRuntimeRow<T>[]>(() => {
    if (this.serverSide()) return this.filteredData();
    const data = this.filteredData();
    if (!this.sortable()) return [...data];
    return this._sortController.sort(
      data,
      this.currentSort(),
      this._typedColumns(),
    ) as NeuTableRuntimeRow<T>[];
  });

  readonly effectivePageSize = computed(() => {
    if (!this.pagination()) return this.filteredData().length || 1;
    return this._state.pageSize();
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

  /**
   * Sparse mode is deliberately explicit: existing server/preloaded virtual
   * tables do not change behavior until a logical data window start is bound.
   */
  readonly _lazyVirtualActive = computed(
    () =>
      this.serverSide() &&
      this.virtualScroll() &&
      this.dataFirst() !== undefined &&
      this.totalItems() !== undefined,
  );

  readonly _logicalTotalItems = computed(() =>
    this._lazyVirtualActive()
      ? this._lazyDataController.total(this.totalItems())
      : this.filteredData().length,
  );

  readonly _tableEmpty = computed(() => this._logicalTotalItems() === 0);

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

  readonly _virtualItemSize = computed(() =>
    this._lazyDataController.itemSize(this.virtualScrollItemSize(), this._virtualRowHeight()),
  );

  readonly _virtualVisibleItems = computed(() =>
    Math.max(1, Math.floor(this.virtualScrollVisibleItems()) || 1),
  );

  readonly _virtualOverscan = computed(() =>
    Math.max(0, Math.floor(this.virtualScrollOverscan()) || 0),
  );

  readonly _virtualDelay = computed(() => Math.max(0, Math.floor(this.virtualScrollDelay()) || 0));

  readonly _virtualHeaderHeight = computed(() => 44 + (this._hasFilterableCol() ? 52 : 0));

  readonly _virtualScrollActive = computed(
    () =>
      this.virtualScroll() &&
      (this._lazyVirtualActive() || this.paginatedData().length > this._virtualVisibleItems()),
  );

  readonly virtualContainerMaxHeight = computed(
    () =>
      `${this._virtualHeaderHeight() + this._virtualVisibleItems() * this._virtualItemSize()}px`,
  );

  readonly _virtualRange = computed<NeuTableVirtualRange>(() =>
    this._lazyDataController.range({
      scrollTop: Math.max(0, this._virtualScrollTop() - this._virtualHeaderHeight()),
      itemSize: this._virtualItemSize(),
      visibleItems: this._virtualVisibleItems(),
      totalItems: this._lazyVirtualActive()
        ? this._logicalTotalItems()
        : this.paginatedData().length,
      overscan: this._virtualOverscan(),
    }),
  );

  readonly _virtualStartIndex = computed(() => {
    if (!this._virtualScrollActive()) {
      return 0;
    }

    if (this._lazyVirtualActive()) return this._virtualRange().first;

    const bodyScrollTop = Math.max(0, this._virtualScrollTop() - this._virtualHeaderHeight());
    const startIndex = Math.floor(bodyScrollTop / this._virtualItemSize());
    return Math.max(0, startIndex - this._virtualOverscan());
  });

  readonly _virtualEndIndex = computed(() => {
    if (!this._virtualScrollActive()) {
      return this.paginatedData().length;
    }

    if (this._lazyVirtualActive()) return this._virtualRange().end;

    return Math.min(
      this.paginatedData().length,
      this._virtualStartIndex() + this._virtualVisibleItems() + this._virtualOverscan() * 2,
    );
  });

  readonly visiblePageRows = computed(() => {
    if (this._lazyVirtualActive()) {
      return this._virtualSlots()
        .filter(
          (slot): slot is Extract<NeuTableVirtualSlot<NeuTableRuntimeRow<T>>, { kind: 'loaded' }> =>
            slot.kind === 'loaded',
        )
        .map((slot) => slot.row);
    }

    const rows = this.paginatedData();
    if (!this._virtualScrollActive()) {
      return rows;
    }

    return rows.slice(this._virtualStartIndex(), this._virtualEndIndex());
  });

  readonly _virtualSlots = computed(() =>
    this._lazyVirtualActive()
      ? this._lazyDataController.slots(this._virtualRange(), this.dataFirst()!, this._rows())
      : Object.freeze([] as NeuTableVirtualSlot<NeuTableRuntimeRow<T>>[]),
  );

  readonly _expansionEnabled = computed(() => this.expandable() && !this._lazyVirtualActive());

  private readonly _navigableRows = computed<NeuTableRuntimeRow<T>[]>(() => {
    if (!this.selectionEnabled()) return [];
    return this.visiblePageRows().filter((row) => this.isRowSelectable(row));
  });

  readonly visiblePageEntries = computed<NeuTablePageEntry<T>[]>(() => {
    if (this._lazyVirtualActive()) {
      return this._virtualSlots().map((slot) =>
        slot.kind === 'placeholder'
          ? {
              kind: 'placeholder' as const,
              key: `placeholder:${slot.logicalIndex}`,
              logicalIndex: slot.logicalIndex,
            }
          : {
              kind: 'row' as const,
              key: this.getRowKey(slot.row),
              row: slot.row,
              rowIndex: slot.logicalIndex - this._virtualRange().first,
              logicalIndex: slot.logicalIndex,
            },
      );
    }

    const rows = this.visiblePageRows();
    const groupKey = this.groupBy();
    if (!groupKey) {
      return rows.map((row, rowIndex) => ({
        kind: 'row' as const,
        key: this.getRowKey(row),
        row,
        rowIndex,
        logicalIndex:
          (this.pagination() ? (this.currentPage() - 1) * this.effectivePageSize() : 0) +
          this._virtualStartIndex() +
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
        logicalIndex:
          (this.pagination() ? (this.currentPage() - 1) * this.effectivePageSize() : 0) +
          this._virtualStartIndex() +
          rowIndex,
      });
    });
    return entries;
  });

  readonly _virtualTopSpacerHeight = computed(() => {
    if (!this._virtualScrollActive()) {
      return 0;
    }

    return this._virtualStartIndex() * this._virtualItemSize();
  });

  readonly _virtualBottomSpacerHeight = computed(() => {
    if (!this._virtualScrollActive()) {
      return 0;
    }

    return Math.max(
      0,
      ((this._lazyVirtualActive() ? this._logicalTotalItems() : this.paginatedData().length) -
        this._virtualEndIndex()) *
        this._virtualItemSize(),
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
    if (this.selectionEnabled()) cols++;
    if (this._expansionEnabled()) cols++;
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
    const changed = this._state.setLayout(
      { ...this._state.layout(), hiddenColumns: [...next] },
      'ui',
    );
    if (changed) this._emitLayoutChange();
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
    const changed = this._state.setLayout({ ...this._state.layout(), columnOrder: next }, 'ui');
    if (!changed) return;
    this.columnReorder.emit({
      previousIndex,
      currentIndex: targetIndex,
      columns: next,
    });
    this._emitLayoutChange();
  }

  applyLayout(layout: NeuTableLayout): void {
    const keys = this._typedColumns().map((col): string => col.key);
    const changed = this._state.setLayout(
      {
        columnOrder: [
          ...layout.columnOrder.filter((key) => keys.includes(key)),
          ...keys.filter((key) => !layout.columnOrder.includes(key)),
        ],
        hiddenColumns: layout.hiddenColumns.filter((key) => keys.includes(key)),
        columnWidths: layout.columnWidths ?? {},
      },
      'api',
    );
    if (changed) this._emitLayoutChange();
  }

  currentLayout(): NeuTableLayout {
    return {
      columnOrder: this.orderedColumns().map((col) => col.key),
      hiddenColumns: [...this._hiddenColumns()],
      columnWidths: { ...this._columnWidths() },
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

    const current = this._columnWidths();
    if (!(key in current)) return;
    const next = { ...current };
    delete next[key];
    const changed = this._state.setLayout({ ...this._state.layout(), columnWidths: next }, 'api');
    if (changed) this._emitLayoutChange();
  }

  // ── Expansión de filas ────────────────────────────────────────────────
  private readonly _expandedKeys = this._state.expansionKeys;

  isRowExpanded(row: T): boolean {
    return this._expandedKeys().has(this.getRowKey(row));
  }

  expandRow(row: T): void {
    this._proposeRowExpansion(row, true, 'api');
  }

  collapseRow(row: T): void {
    this._proposeRowExpansion(row, false, 'api');
  }

  toggleExpand(row: T): void {
    if (this._lazyVirtualActive()) return;
    const key = this.getRowKey(row);
    this._proposeRowExpansion(row, !this._expandedKeys().has(key), 'ui');
  }

  /** Immutable public projection of every T1-persisted state family. */
  currentState(): NeuTableStateSnapshot {
    return this._persistenceAdapter.snapshot(this._state.snapshot());
  }

  /** Saves immediately; semantic no-ops do not write or emit. */
  saveState(): NeuTableStateSnapshot {
    const snapshot = this.currentState();
    const key = this.stateKey()?.trim() ?? '';
    if (
      key &&
      this._persistenceAdapter.write(this._stateStorageFor(this.stateStorage()), key, snapshot)
    ) {
      this.stateSave.emit(snapshot);
    }
    return snapshot;
  }

  /** Restores the configured key and then reapplies URL precedence. */
  restoreState(): NeuTableStateSnapshot | null {
    const key = this.stateKey()?.trim() ?? '';
    if (!key) return null;
    const restored = this._readPersistedState(key, this.stateStorage());
    if (!restored) return null;
    this._applyPersistedState(restored);
    if (this.useUrlState() && this.query() === undefined) {
      this._state.update(this._urlAdapter.read(this._urlConfig()), 'url');
    }
    const effective = this.currentState();
    this.stateRestore.emit(effective);
    if (this._initialQueryHandled) this._emitQueryState(this._state.snapshot());
    return effective;
  }

  /** Clears browser storage only; the live canonical state is intentionally unchanged. */
  clearState(): void {
    const key = this.stateKey()?.trim() ?? '';
    if (key) this._persistenceAdapter.clear(this._stateStorageFor(this.stateStorage()), key);
  }

  /** Resets live state; automatic persistence records the resulting canonical snapshot. */
  resetState(): void {
    const previous = this._state.snapshot();
    const changed = this._state.update(
      {
        page: 1,
        pageSize: this.pageSize(),
        search: '',
        sort: null,
        sortEntries: [],
        filters: {},
        selectionKeys: new Set(),
        expansionKeys: new Set(),
        layout: this._initialNormalizedLayout(),
      },
      'api',
    );
    if (!changed) return;
    if (
      changed.changedKeys.some((key) =>
        ['page', 'pageSize', 'search', 'sort', 'sortEntries', 'filters'].includes(key),
      )
    ) {
      this._emitQueryState(changed.current);
    }
    if (changed.changedKeys.includes('search')) this.searchChange.emit('');
    if (changed.changedKeys.some((key) => key === 'sort' || key === 'sortEntries')) {
      this.sortChange.emit(Object.freeze([]));
    }
    if (changed.changedKeys.includes('selectionKeys')) this.selectionChange.emit([]);
    if (changed.changedKeys.includes('expansionKeys')) {
      this.expandedRowKeysChange.emit(Object.freeze([]));
    }
    if (changed.changedKeys.includes('layout')) this._emitLayoutChange();
    if (previous.filters !== changed.current.filters && this._openFilterKey()) {
      this._closeFilterOverlay(false);
    }
  }

  private _proposeRowExpansion(row: T, expanded: boolean, origin: 'ui' | 'api'): void {
    if (this._lazyVirtualActive()) return;
    const key = this.getRowKey(row);
    const set =
      expanded && this.expandMode() === 'single'
        ? new Set<unknown>()
        : new Set(this._expandedKeys());
    if (expanded) set.add(key);
    else set.delete(key);
    const changed = this._state.setExpansionKeys(set, origin);
    if (!changed) return;
    const proposal = Object.freeze([...changed.current.expansionKeys]);
    this.expandedRowKeysChange.emit(proposal);
    const event = Object.freeze({ row, key, expandedRowKeys: proposal });
    if (expanded) this.rowExpand.emit(event);
    else this.rowCollapse.emit(event);
  }

  // ── Selección ─────────────────────────────────────────────────────────
  private readonly _selectedKeys = this._state.selectionKeys;
  private readonly _selectionConfirmPending = signal<string | null>(null);

  private readonly effectiveSelectionMode = computed<NeuTableSelectionMode>(() => {
    const mode = this.selectionMode();
    return mode !== 'none' ? mode : this.selectable() ? 'multiple' : 'none';
  });
  protected readonly selectionEnabled = computed(() => this.effectiveSelectionMode() !== 'none');
  protected readonly multipleSelection = computed(
    () => this.effectiveSelectionMode() === 'multiple',
  );
  protected readonly resolvedSelectAllAriaLabel = computed(
    () =>
      this.selectAllAriaLabel() ??
      (this.selectAllScope() === 'page'
        ? 'Select all rows on this page'
        : 'Select all filtered rows'),
  );

  private readonly _suppliedSelectionRows = computed<T[]>(() => {
    const selection = this.selection();
    if (selection === undefined || selection === null) return [];
    return Array.isArray(selection) ? [...selection] : [selection as T];
  });

  readonly selectedCount = computed(() => this._selectedKeys().size);
  readonly selectedRows = computed(() =>
    this._freezeProjection(
      this._selectionController.resolveRows(
        this._selectedKeys(),
        this._rows(),
        this._suppliedSelectionRows(),
      ),
    ),
  );
  readonly selectedRowsInfo = computed(() => {
    const canonical = this.selectedCount();
    const resolved = this.selectedRows().length;
    const count = resolved === canonical ? `${canonical}` : `${resolved}/${canonical}`;
    return `${count} ${this.selectionSummaryLabel()}`;
  });

  private readonly _filteredSelectableRows = computed(() =>
    this._selectionController.scopedRows(
      'filtered',
      this.paginatedData(),
      this.filteredData(),
      (row) => this._rowSelectableAt(row, this._logicalRowIndex(row)),
      this._rows(),
    ),
  );

  private readonly selectionScopeRows = computed(() =>
    this._selectionController.scopedRows(
      this.selectAllScope(),
      this.paginatedData(),
      this.filteredData(),
      (row) => this._rowSelectableAt(row, this._logicalRowIndex(row)),
      this._rows(),
    ),
  );

  protected readonly headerSelectionState = computed(() =>
    this._selectionController.headerState(this._selectedKeys(), this.selectionScopeRows()),
  );

  /**
   * TRUE cuando TODOS los registros que pasan el filtro activo están seleccionados.
   * A diferencia de una selección global, actúa solo sobre el subconjunto filtrado.
   */
  readonly isAllFilteredSelected = computed(() => {
    const filtered = this._filteredSelectableRows();
    return this._selectionController.headerState(this._selectedKeys(), filtered).checked;
  });

  readonly isSomeFilteredSelected = computed(
    () =>
      this._selectionController.headerState(this._selectedKeys(), this._filteredSelectableRows())
        .indeterminate,
  );

  isRowSelected(row: T): boolean {
    return this._selectedKeys().has(this.getRowKey(row));
  }

  isRowSelectable(row: T): boolean {
    return this._rowSelectableAt(row, this._logicalRowIndex(row));
  }

  toggleRow(
    row: T,
    source: Exclude<NeuTableSelectionSource, 'header'> = 'api',
    event?: MouseEvent,
  ): void {
    if (!this.isRowSelectable(row)) return;
    const configuredMode = this.effectiveSelectionMode();
    // Legacy imperative toggleRow has always worked even when the checkbox
    // column is hidden; preserve that API as an uncontrolled multiple toggle.
    const mode = configuredMode === 'none' && source === 'api' ? 'multiple' : configuredMode;
    const metaPressed = event?.metaKey === true || event?.ctrlKey === true;
    const toggleSelected =
      source !== 'radio' && !(source === 'row' && this.metaKeySelection() && !metaPressed);
    const replaceMultiple =
      mode === 'multiple' && source === 'row' && this.metaKeySelection() && !metaPressed;
    const next = this._selectionController.toggleRow(
      this._selectedKeys(),
      row,
      mode,
      toggleSelected,
      replaceMultiple,
    );
    this._applyRowSelection(row, next, source);
    if (source !== 'api') {
      const key = this.getRowKey(row);
      this._keyboardController.focus(key, this._navigableRowKeys());
      this._keyboardController.establishAnchor(key);
    }
  }

  selectRow(row: T): void {
    if (!this.isRowSelectable(row) || this.isRowSelected(row)) return;
    const current = this._selectedKeys();
    const next =
      this.effectiveSelectionMode() === 'single'
        ? new Set([this.getRowKey(row)])
        : new Set([...current, this.getRowKey(row)]);
    this._applyRowSelection(row, next, 'api');
  }

  unselectRow(row: T): void {
    if (!this.isRowSelected(row)) return;
    const next = new Set(this._selectedKeys());
    next.delete(this.getRowKey(row));
    this._applyRowSelection(row, next, 'api');
  }

  /** Applies the configured page or filtered/loaded scope. */
  toggleAll(): void {
    if (!this.multipleSelection()) return;
    const rows = this.selectionScopeRows();
    const header = this.headerSelectionState();
    if (header.disabled) return;
    const next = this._selectionController.toggleAll(this._selectedKeys(), rows);
    const changed = this._state.setSelectionKeys(next, 'ui');
    if (!changed) return;
    const selection = this._resolveSelection(next);
    this.selectionChange.emit([...selection]);
    this.selectAllChange.emit({
      checked: !header.checked,
      scope: this.selectAllScope(),
      rows: [...rows],
      keys: rows.map((row) => this.getRowKey(row)),
      selection: [...selection],
    });
  }

  clearSelection(): void {
    const changed = this._state.setSelectionKeys(new Set(), 'api');
    if (!changed) return;
    this._selectionConfirmPending.set(null);
    this.selectionChange.emit([]);
  }

  private _applyRowSelection(
    row: T,
    next: ReadonlySet<unknown>,
    source: Exclude<NeuTableSelectionSource, 'header'>,
  ): void {
    const previous = this._selectedKeys();
    const changed = this._state.setSelectionKeys(next, source === 'api' ? 'api' : 'ui');
    if (!changed) return;
    const selection = this._resolveSelection(next);
    this.selectionChange.emit([...selection]);
    const event = {
      row,
      key: this.getRowKey(row),
      index: this._logicalRowIndex(row),
      source,
      selection: [...selection],
    } satisfies NeuTableRowSelectionEvent<T>;
    // Replacement contract: whole-selection proposal, previous-row delta, next-row delta.
    if (this.effectiveSelectionMode() === 'single' && next.has(event.key)) {
      for (const key of previous) {
        if (next.has(key)) continue;
        const previousRow = this._selectionController.rowForKey(
          key,
          this._rows(),
          this._suppliedSelectionRows(),
        );
        if (!previousRow) continue;
        this.rowUnselect.emit({
          row: previousRow,
          key,
          index: this._logicalRowIndex(previousRow),
          source,
          selection: [...selection],
        });
      }
    }
    if (next.has(event.key) && !previous.has(event.key)) this.rowSelect.emit(event);
    if (!next.has(event.key) && previous.has(event.key)) this.rowUnselect.emit(event);
  }

  private _resolveSelection(keys: ReadonlySet<unknown>): T[] {
    return this._selectionController.resolveRows(keys, this._rows(), this._suppliedSelectionRows());
  }

  private _freezeProjection(rows: T[]): T[] {
    return Object.freeze([...rows]) as unknown as T[];
  }

  private _rowSelectableAt(row: T, index: number): boolean {
    return this.rowSelectable()?.(row, index) ?? true;
  }

  private _logicalRowIndex(row: T): number {
    const localIndex = this._selectionController.indexOf(row, this._rows());
    if (!this._lazyVirtualActive() || localIndex < 0) return localIndex;
    return Math.max(0, Math.floor(this.dataFirst() ?? 0)) + localIndex;
  }

  // ── Navegación ────────────────────────────────────────────────────────
  goToPage(page: number): void {
    if (this._lazyVirtualActive()) return;
    const clamped = Math.max(1, Math.min(page, this.totalPages()));
    const changed = this._state.setPage(clamped, 'ui');
    if (!changed) return;
    this._emitQueryState(changed.current);
    if (!this.serverSide() && this.query() === undefined && this.useUrlState()) {
      this._urlAdapter.writePage(this.pageParam(), clamped);
    }
  }

  /**
   * Imperative sorting accepts any runtime row key, including hidden/computed columns.
   * Template interaction separately enforces table/column sortability.
   */
  sortBy(key: string, event?: MouseEvent): void {
    const multiple = this.multiSort();
    const entries = this._sortController.next(this.currentSort(), key, {
      multiple,
      additive: multiple && event?.shiftKey === true,
      removable: this.removableSort(),
    });
    const changed = this._state.update(
      multiple ? { sortEntries: entries, page: 1 } : { sort: entries[0] ?? null, page: 1 },
      'ui',
    );
    if (!changed) return;

    const snapshot = this._freezeSortState(entries);
    this.sortChange.emit(snapshot);
    this._emitQueryState(changed.current);
    if (
      !this.serverSide() &&
      this.query() === undefined &&
      this.useUrlState() &&
      this.sort() === undefined
    ) {
      if (multiple) this._urlAdapter.writeSortEntries(this._urlConfig(), snapshot);
      else this._urlAdapter.writeSort(this._urlConfig(), snapshot[0] ?? null);
    }
  }

  protected sortAriaValue(key: string): 'none' | 'ascending' | 'descending' | null {
    const activeIndex = this.currentSort().findIndex((entry) => entry.key === key);
    if (activeIndex < 0) return 'none';
    // ARIA cannot encode multi-sort priority and recommends only one aria-sort
    // header per table. Secondary keys are announced by the adjacent text.
    if (this.multiSort() && activeIndex > 0) return null;
    return this.currentSort()[activeIndex].dir === 'asc' ? 'ascending' : 'descending';
  }

  protected sortPriorityDescription(key: string): string | null {
    if (!this.multiSort()) return null;
    const priority = this.getSortPriority(key);
    if (priority < 0) return null;
    const direction = this.currentSort()[priority]?.dir === 'desc' ? 'descending' : 'ascending';
    return `Sort priority ${priority + 1}, ${direction}.`;
  }

  protected onSortableHeaderClick(key: string, event: MouseEvent): void {
    if (
      !this.sortable() ||
      this._currentTypedColumn(key)?.sortable === false ||
      this._eventOriginatesFromInteractiveDescendant(event)
    ) {
      return;
    }
    this.sortBy(key, event);
  }

  protected onSortableHeaderKeydown(key: string, event: KeyboardEvent): void {
    if (
      event.target !== event.currentTarget ||
      event.repeat ||
      !this.sortable() ||
      (event.key !== 'Enter' && event.key !== ' ')
    ) {
      return;
    }
    const column = this._currentTypedColumn(key);
    if (!column || column.sortable === false) return;
    event.preventDefault();
    this.sortBy(key, event as unknown as MouseEvent);
  }

  onRowClick(row: T, event: MouseEvent): void {
    if (this.selectionEnabled() && this.selectOnRowClick() && this.isRowSelectable(row)) {
      if (this.multipleSelection() && event.shiftKey) {
        this._applyRangeSelection(row);
      } else {
        this.toggleRow(row, 'row', event);
      }
    }
    this.rowClick.emit(row);
  }

  protected isNavigableRow(row: T): boolean {
    return this.selectionEnabled() && this.isRowSelectable(row);
  }

  protected rowTabIndex(row: T): number | null {
    if (!this.isNavigableRow(row)) return null;
    const key = this.getRowKey(row);
    if (!Object.is(this._keyboardController.focusedKey(), key)) return -1;
    return this._navigableRows().find((candidate) => Object.is(this.getRowKey(candidate), key)) ===
      row
      ? 0
      : -1;
  }

  protected rowSelectionAriaLabel(row: T): string {
    return this.multipleSelection() && this.isRowSelected(row)
      ? this.unselectRowAriaLabel()
      : this.selectRowAriaLabel();
  }

  protected rowExpansionAriaLabel(row: T): string {
    return this.isRowExpanded(row) ? this.collapseRowAriaLabel() : this.expandRowAriaLabel();
  }

  protected onRowFocus(row: T, event: FocusEvent): void {
    if (event.target !== event.currentTarget || !this.isNavigableRow(row)) return;
    this._keyboardController.focus(this.getRowKey(row), this._navigableRowKeys());
  }

  protected onRowKeydown(row: T, event: KeyboardEvent): void {
    if (event.target !== event.currentTarget || !this.isNavigableRow(row)) return;
    const key = event.key;
    const currentKey = this.getRowKey(row);
    const navigableRows = this._navigableRows();
    const navigableKeys = navigableRows.map((candidate) => this.getRowKey(candidate));
    this._keyboardController.focus(currentKey, navigableKeys);

    if (
      this.multipleSelection() &&
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      key.toLowerCase() === 'a'
    ) {
      event.preventDefault();
      this.toggleAll();
      return;
    }

    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (this.multipleSelection() && event.shiftKey) {
        this._applyRangeSelection(row);
      } else {
        this.toggleRow(row, 'row', event as unknown as MouseEvent);
      }
      return;
    }

    let intent: NeuTableRowNavigationIntent | null = null;
    if (key === 'ArrowUp') intent = 'previous';
    if (key === 'ArrowDown') intent = 'next';
    if (key === 'Home') intent = 'first';
    if (key === 'End') intent = 'last';
    if (!intent) return;

    event.preventDefault();
    const extendRange = this.multipleSelection() && event.shiftKey;
    if (extendRange) this._keyboardController.ensureAnchor(currentKey);
    const nextKey = this._keyboardController.move(navigableKeys, currentKey, intent);
    if (nextKey === null) return;
    const nextRow = navigableRows.find((candidate) =>
      Object.is(this.getRowKey(candidate), nextKey),
    );
    if (!nextRow) return;
    if (extendRange) this._applyRangeSelection(nextRow, currentKey);
    this._focusKeyboardRow(nextKey);
  }

  private _navigableRowKeys(): unknown[] {
    return this._navigableRows().map((row) => this.getRowKey(row));
  }

  private _applyRangeSelection(row: T, fallbackAnchor = this.getRowKey(row)): void {
    if (!this.multipleSelection() || !this.isRowSelectable(row)) return;
    const rows = this._navigableRows();
    const keys = rows.map((candidate) => this.getRowKey(candidate));
    const targetKey = this.getRowKey(row);
    const range = this._keyboardController.transitionRange(keys, targetKey, fallbackAnchor);
    if (range.current.length === 0) return;
    this._keyboardController.focus(targetKey, keys);

    const next = new Set(this._selectedKeys());
    for (const key of range.previous) next.delete(key);
    for (const key of range.current) next.add(key);
    const changed = this._state.setSelectionKeys(next, 'ui');
    if (!changed) return;
    this.selectionChange.emit([...this._resolveSelection(next)]);
  }

  private _focusKeyboardRow(key: unknown): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const index = this._navigableRowKeys().findIndex((candidate) => Object.is(candidate, key));
    if (index < 0) return;
    const rows = this._scrollContainer()?.nativeElement.querySelectorAll<HTMLElement>(
      '.neu-table__row[data-neu-table-navigable="true"]',
    );
    rows?.item(index)?.focus();
  }

  private _eventOriginatesFromInteractiveDescendant(event: Event): boolean {
    const currentTarget = event.currentTarget;
    for (const target of event.composedPath()) {
      if (target === currentTarget) return false;
      if (!(target instanceof HTMLElement)) continue;
      if (
        target.matches(
          'a[href], button, input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="checkbox"], [role="combobox"], [role="link"], [role="radio"], [role="slider"], [role="spinbutton"], [role="switch"], [role="textbox"]',
        ) ||
        target.tabIndex >= 0
      ) {
        return true;
      }
    }
    return event.target !== currentTarget;
  }

  onSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    const changed = this._state.update({ search: q, page: 1 }, 'ui');
    if (!changed) return;
    this.searchChange.emit(q);
    this._emitQueryState(changed.current);
    if (!this.serverSide() && this.query() === undefined && this.useUrlState()) {
      this._urlAdapter.writeSearch(this._urlConfig(), q);
    }
  }

  clearSearch(): void {
    const changed = this._state.update({ search: '', page: 1 }, 'ui');
    if (!changed) return;
    this._emitQueryState(changed.current);
    if (!this.serverSide() && this.query() === undefined && this.useUrlState()) {
      this._urlAdapter.clearSearch(this._urlConfig());
    }
  }

  onPageSizeChange(value: string | number | { target?: { value?: unknown } } | null): void {
    const normalizedValue =
      value && typeof value === 'object' ? (value.target?.value ?? null) : value;
    const size = Number(normalizedValue);
    if (!Number.isFinite(size) || size <= 0) return;
    const changed = this._state.update({ pageSize: size, page: 1 }, 'ui');
    if (!changed) return;
    this._emitQueryState(changed.current);
    if (!this.serverSide() && this.query() === undefined && this.useUrlState()) {
      this._urlAdapter.resetPage(this.pageParam());
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
    const changed = this._writeAppliedFilter(colKey, {
      operator: 'and',
      constraints: [{ value }],
    });
    if (changed) this._emitQueryState(changed.current);
  }

  clearColumnFilters(): void {
    const changed = this._state.update({ filters: {}, page: 1 }, 'api');
    if (changed) this._emitQueryState(changed.current);
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

    const scrollTop = (event.target as HTMLElement).scrollTop;
    const applyScroll = () => {
      this._virtualScrollTimer = null;
      if (this._destroyed) return;
      this._virtualScrollTop.set(scrollTop);
      if (this._lazyVirtualActive()) this._emitLazyRequest('scroll');
    };

    this._cancelPendingVirtualScroll();
    const delay = this._virtualDelay();
    if (delay === 0) applyScroll();
    else this._virtualScrollTimer = setTimeout(applyScroll, delay);
  }

  /**
   * Dynamic string keys are required by the legacy API for paths/computed
   * columns. Keep that boundary local; the rest of the component stays T.
   */
  private getRowValue(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  private _globalColumnValues(row: T, column: NeuTableColumn<T>): readonly unknown[] {
    const raw = this.getRowValue(row, column.key);
    const rawText = String(raw ?? '');
    const display = column.cell
      ? column.cell(row)
      : column.type === 'badge' && column.badgeMap?.[rawText]?.label
        ? column.badgeMap[rawText].label
        : raw;
    return Object.is(display, raw) ? [raw] : [display, raw];
  }

  private _isGlobalFilterAccessor(
    field: NeuTableGlobalFilterField<T>,
  ): field is NeuTableGlobalFilterAccessor<T> {
    return typeof field === 'object' && field !== null && typeof field.accessor === 'function';
  }

  private _normalizeSortState(entries: NeuTableSortState, multiple: boolean): NeuTableSortEntry[] {
    const seen = new Set<string>();
    const normalized: NeuTableSortEntry[] = [];
    for (const entry of entries) {
      const key = String(entry?.key ?? '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      normalized.push({ key, dir: entry.dir === 'desc' ? 'desc' : 'asc' });
      if (!multiple) break;
    }
    return normalized;
  }

  private _freezeSortState(entries: readonly NeuTableSortEntry[]): NeuTableSortState {
    return Object.freeze(entries.map((entry) => Object.freeze({ ...entry }))) as NeuTableSortState;
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
    if (this._lazyVirtualActive()) return rowIdx + 1;
    return (
      (this.currentPage() - 1) * this.effectivePageSize() + this._virtualStartIndex() + rowIdx + 1
    );
  }

  /** Moves a virtual Table to a logical row without requiring a loaded T object. */
  scrollToIndex(index: number, behavior: ScrollBehavior = 'auto'): void {
    const total = this._logicalTotalItems();
    if (!this.virtualScroll() || total === 0) {
      this.resetVirtualScroll(behavior);
      return;
    }
    const normalized = Number.isFinite(index) ? Math.floor(index) : 0;
    const clamped = Math.max(0, Math.min(normalized, total - 1));
    const visibleItems = this._virtualVisibleItems();
    const visibleFirst = Math.min(clamped, Math.max(0, total - visibleItems));
    this._moveVirtualViewport(visibleFirst * this._virtualItemSize(), behavior);
  }

  /** Moves to a vertical pixel offset measured from the first logical row. */
  scrollToOffset(offset: number, behavior: ScrollBehavior = 'auto'): void {
    const normalized = Number.isFinite(offset) ? Math.max(0, offset) : 0;
    const total = this._logicalTotalItems();
    const visibleItems = this._virtualVisibleItems();
    const maxOffset = Math.max(0, total - visibleItems) * this._virtualItemSize();
    this._moveVirtualViewport(Math.min(normalized, maxOffset), behavior);
  }

  /** Resets virtual positioning to the first logical row. */
  resetVirtualScroll(behavior: ScrollBehavior = 'auto'): void {
    this._cancelPendingVirtualScroll();
    this._virtualScrollTop.set(0);
    this._scrollVirtualElementTo(0, behavior);
    if (this._lazyVirtualActive()) this._emitLazyRequest('programmatic');
  }

  private resetVirtualScrollPosition(): void {
    this._cancelPendingVirtualScroll();
    this._virtualScrollTop.set(0);
    this._scrollVirtualElementTo(0);
  }

  private _moveVirtualViewport(bodyOffset: number, behavior: ScrollBehavior): void {
    this._cancelPendingVirtualScroll();
    const top = bodyOffset === 0 ? 0 : this._virtualHeaderHeight() + bodyOffset;
    this._virtualScrollTop.set(top);
    this._scrollVirtualElementTo(top, behavior);
    if (this._lazyVirtualActive()) this._emitLazyRequest('programmatic');
  }

  private _cancelPendingVirtualScroll(): void {
    if (this._virtualScrollTimer === null) return;
    clearTimeout(this._virtualScrollTimer);
    this._virtualScrollTimer = null;
  }

  private _scrollVirtualElementTo(top: number, behavior: ScrollBehavior = 'auto'): void {
    if (!isPlatformBrowser(this._platformId)) return;
    requestAnimationFrame(() => {
      const element = this._scrollContainer()?.nativeElement;
      if (!element) return;
      if (typeof element.scrollTo === 'function') element.scrollTo({ top, behavior });
      else element.scrollTop = top;
    });
  }

  protected lazyPlaceholderContext(logicalIndex: number): NeuTableLazyPlaceholderContext<T> {
    return {
      $implicit: logicalIndex,
      logicalIndex,
      columns: this.visibleColumns(),
      colspan: this.totalColspan(),
    };
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
    const changed = this._state.setLayout(
      {
        ...this._state.layout(),
        columnWidths: { ...this._columnWidths(), [key]: width },
      },
      'ui',
    );
    if (changed) this._emitLayoutChange();
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
    return mode
      ? `${this.filterAriaPrefix()} ${col.header} (${mode})`
      : `${this.filterAriaPrefix()} ${col.header}`;
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
    return (
      col.filterConfig?.kind === 'date' &&
      this.modernFilterMode(col) === 'between' &&
      (col.filterConfig.precision ?? 'date-only') === 'date-only'
    );
  }

  protected isInstantRange(col: NeuTableColumn<T>): boolean {
    return (
      col.filterConfig?.kind === 'date' &&
      this.modernFilterMode(col) === 'between' &&
      col.filterConfig.precision === 'instant'
    );
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
    return config?.kind === 'select' || config?.kind === 'multiSelect'
      ? (config.options ?? [])
      : [];
  }

  protected typedFilterOptionLabel(col: NeuTableColumn<T>): NeuOptionLabelAccessor<unknown> | null {
    const config = col.filterConfig;
    if (config?.kind !== 'select' && config?.kind !== 'multiSelect') return null;
    return (config.optionLabel ?? null) as NeuOptionLabelAccessor<unknown> | null;
  }

  protected typedFilterOptionValue(
    col: NeuTableColumn<T>,
  ): NeuOptionValueAccessor<unknown, unknown> | null {
    const config = col.filterConfig;
    if (config?.kind !== 'select' && config?.kind !== 'multiSelect') return null;
    return (config.optionValue ?? null) as NeuOptionValueAccessor<unknown, unknown> | null;
  }

  protected typedFilterOptionDisabled(
    col: NeuTableColumn<T>,
  ): NeuOptionDisabledAccessor<unknown> | null {
    const config = col.filterConfig;
    if (config?.kind !== 'select' && config?.kind !== 'multiSelect') return null;
    return (config.optionDisabled ?? null) as NeuOptionDisabledAccessor<unknown> | null;
  }

  protected typedFilterSearchable(col: NeuTableColumn<T>): boolean {
    const config = col.filterConfig;
    return (
      (config?.kind === 'select' || config?.kind === 'multiSelect') && config.searchable === true
    );
  }

  protected typedFilterVirtualScroll(col: NeuTableColumn<T>): boolean {
    const config = col.filterConfig;
    return (
      (config?.kind === 'select' || config?.kind === 'multiSelect') && config.virtualScroll === true
    );
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
    const controls =
      boundary === 'from' ? this._typedRangeStartControls : this._typedRangeEndControls;
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
      boundary === 'from'
        ? this._typedInstantRangeStartControls
        : this._typedInstantRangeEndControls;
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
          this.setColumnFilter(col.key, {
            ...range,
            [boundary]: neuTableInstantFilterValue(value),
          });
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

  private _writeAppliedFilter(
    key: string,
    input: InternalAppliedColumnFilter,
  ): InternalNeuTableStateChange<unknown> | null {
    const column = this._currentTypedColumn(key);
    const normalized = this._normalizeAppliedFilterInput(column, input);
    const current = this._appliedFilters();
    let filters: Record<string, InternalAppliedColumnFilter>;
    if (normalized.constraints.length === 0) {
      if (!(key in current)) return null;
      filters = { ...current };
      delete filters[key];
    } else {
      filters = { ...current, [key]: normalized };
    }
    return this._state.update(
      {
        filters,
        ...(this.serverSide() || this.query() !== undefined ? { page: 1 } : {}),
      },
      'api',
    );
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

  private _replaceAppliedFiltersFromLegacyProjection(filters: Record<string, unknown>): void {
    const applied: Record<string, InternalAppliedColumnFilter> = {};
    for (const [key, value] of Object.entries(filters)) {
      applied[key] = this._normalizeAppliedFilterInput(this._currentTypedColumn(key), {
        operator: 'and',
        constraints: [{ value }],
      });
    }
    this._state.setFilters(applied, 'api');
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
        const current = this._appliedFilters();
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
        if (next !== current) {
          const changed = this._state.setFilters(next, 'column-lifecycle');
          if (changed?.committed) this._emitQueryState(changed.current);
        }
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

  private _onCanonicalStateChange(_change: InternalNeuTableStateChange<unknown>): void {
    this._saveStateIfReady();
  }

  private _saveStateIfReady(): void {
    if (!this._statePersistenceReady || this._restoringState) return;
    this.saveState();
  }

  private _stateStorageFor(kind: NeuTableStateStorage): Storage | null {
    if (!isPlatformBrowser(this._platformId)) return null;
    try {
      const window = this._document.defaultView;
      if (!window) return null;
      return kind === 'local' ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  }

  private _readPersistedState(
    key: string,
    kind: NeuTableStateStorage,
  ): NeuTableStateSnapshot | null {
    return this._persistenceAdapter.read(this._stateStorageFor(kind), key);
  }

  private _applyPersistedState(snapshot: NeuTableStateSnapshot): void {
    this._restoringState = true;
    try {
      this._state.update(
        {
          page: snapshot.page,
          pageSize: snapshot.pageSize,
          search: snapshot.search,
          sort: snapshot.sort,
          sortEntries: snapshot.sortEntries,
          filters: this._restorePersistedFilters(snapshot),
          selectionKeys: new Set(snapshot.selectionKeys),
          expansionKeys: this._normalizeExpansionKeys(snapshot.expandedRowKeys, this.expandMode()),
          layout: this._normalizePersistedLayout(snapshot.layout),
        },
        'persistence',
      );
    } finally {
      this._restoringState = false;
    }
  }

  private _restorePersistedFilters(
    snapshot: NeuTableStateSnapshot,
  ): Record<string, InternalAppliedColumnFilter> {
    return Object.fromEntries(
      Object.entries(snapshot.filters).map(([key, filter]) => {
        const column = this._currentTypedColumn(key);
        return [
          key,
          {
            operator: filter.operator,
            constraints: filter.constraints.map((constraint) => ({
              ...(constraint.mode ? { mode: constraint.mode } : {}),
              value: column
                ? this._rebindPersistedFilterValue(column, constraint.value)
                : constraint.value,
            })),
          },
        ];
      }),
    );
  }

  private _rebindPersistedFilterValue(column: NeuTableColumn<T>, value: unknown): unknown {
    const config = column.filterConfig;
    if (config?.kind !== 'select' && config?.kind !== 'multiSelect') return value;
    const optionValue = (config.optionValue ?? null) as NeuOptionValueAccessor<
      unknown,
      unknown
    > | null;
    const values = config.kind === 'multiSelect' && Array.isArray(value) ? value : [value];
    const rebound = values.map((persisted) => {
      const option = (config.options ?? []).find((candidate) =>
        this._persistenceAdapter.valuesEqual(
          resolveNeuOptionValue(candidate, optionValue),
          persisted,
        ),
      );
      return option === undefined ? persisted : resolveNeuOptionValue(option, optionValue);
    });
    return config.kind === 'multiSelect' ? rebound : rebound[0];
  }

  private _normalizeExpansionKeys(
    keys: Iterable<unknown>,
    mode: 'single' | 'multiple',
  ): ReadonlySet<unknown> {
    const normalized = new Set(keys);
    if (mode === 'multiple' || normalized.size <= 1) return normalized;
    const first = normalized.values().next().value;
    return first === undefined ? new Set() : new Set([first]);
  }

  private _normalizePersistedLayout(layout: NeuTableLayout): NeuTableLayout {
    const keys = this._typedColumns().map((column): string => column.key);
    return {
      columnOrder: [
        ...layout.columnOrder.filter((key) => keys.includes(key)),
        ...keys.filter((key) => !layout.columnOrder.includes(key)),
      ],
      hiddenColumns: layout.hiddenColumns.filter((key) => keys.includes(key)),
      columnWidths: Object.fromEntries(
        Object.entries(layout.columnWidths).filter(([key]) => keys.includes(key)),
      ),
    };
  }

  private _initialNormalizedLayout(): NeuTableLayout {
    const keys = this._typedColumns().map((column): string => column.key);
    const initial = this.initialLayout();
    const initialOrder = initial?.columnOrder ?? [];
    return {
      columnOrder: [
        ...initialOrder.filter((key) => keys.includes(key)),
        ...keys.filter((key) => !initialOrder.includes(key)),
      ],
      hiddenColumns: (initial?.hiddenColumns ?? []).filter((key) => keys.includes(key)),
      columnWidths: { ...(initial?.columnWidths ?? {}) },
    };
  }

  private _emitQueryState(
    state: InternalNeuTableState<unknown> = this._state.snapshot(),
    force = false,
  ): void {
    const query = this._queryController.build(state, this._queryConfig());
    if (
      !force &&
      this.query() !== undefined &&
      this._queryController.equal(this._lastEmittedQuery, query)
    ) {
      return;
    }
    this._lastEmittedQuery = query;
    if (this._lazyVirtualActive()) this.resetVirtualScrollPosition();
    this.queryChange.emit(query);
    if (!this.serverSide()) return;
    this.serverStateChange.emit(this._legacyServerState(query, state));
    if (this._lazyVirtualActive()) {
      this._emitLazyRequest(force ? 'initial' : 'query', query, true);
    }
  }

  private _emitLazyRequest(
    reason: NeuTableLazyRequestReason,
    query = this._queryController.build(this._state.snapshot(), this._queryConfig()),
    force = false,
  ): void {
    if (!this._lazyVirtualActive()) return;
    const request = this._lazyDataController.request(query, this._virtualRange(), reason, force);
    if (request) this.lazyRequest.emit(request);
  }

  /** Internal F4 compatibility shim; all projection logic lives in the query controller. */
  private _emitServerState(): void {
    const state = this._state.snapshot();
    this.serverStateChange.emit(
      this._legacyServerState(this._queryController.build(state, this._queryConfig()), state),
    );
  }

  private _legacyServerState(
    query: NeuTableQueryState,
    state: InternalNeuTableState<unknown>,
  ): NeuTableServerState {
    return this._queryController.legacy(query, state, {
      effectivePageSize: this.pagination() ? query.pageSize : this.filteredData().length || 1,
      configuredGlobalFilterFields: this.globalFilterFields() !== undefined,
      typedFilterKeys: new Set(
        this._typedColumns()
          .filter((column) => column.filterConfig !== undefined)
          .map((column) => column.key),
      ),
    });
  }

  private _typedColumnFiltersState(): Record<string, NeuTableFilterState> {
    const state = this._state.snapshot();
    const query = this._queryController.build(state, this._queryConfig());
    return (
      this._queryController.legacy(query, state, {
        effectivePageSize: state.pageSize,
        configuredGlobalFilterFields: this.globalFilterFields() !== undefined,
        typedFilterKeys: new Set(
          this._typedColumns()
            .filter((column) => column.filterConfig !== undefined)
            .map((column) => column.key),
        ),
      }).typedColumnFilters ?? {}
    );
  }

  private _localOnlyFilters(): string[] {
    return [
      ...this._queryController.build(this._state.snapshot(), this._queryConfig()).serialization
        .localOnlyFilters,
    ];
  }

  private _emitLayoutChange(): void {
    this.layoutChange.emit(this.currentLayout());
  }
}
