import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  PLATFORM_ID,
  TemplateRef,
  ViewEncapsulation,
  WritableSignal,
  afterNextRender,
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
  NeuTableBodyDirective,
  NeuTableBodySectionDirective,
  NeuTableCaptionDirective,
  NeuTableCellEditorDirective,
  NeuTableCellViewDirective,
  NeuTableFooterGroupDirective,
  NeuTableGroupFooterDirective,
  NeuTableGroupHeaderDirective,
  NeuTableHeaderGroupDirective,
  NeuTableEmptyDirective,
  NeuTableLazyPlaceholderDirective,
  NeuTableLoadingBodyDirective,
  NeuTablePaginatorLeftDirective,
  NeuTablePaginatorRightDirective,
  NeuTableSummaryDirective,
} from './neu-table-templates.directive';
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
import { NeuContextMenuDirective } from '@neural-ui/core/context-menu';
import { NeuIdGenerator, NeuInitialTemporalState } from '@neural-ui/core/internal';
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
  NeuTableCellEditLifecycleEvent,
  NeuTableCellEditorContext,
  NeuTableCellViewContext,
  NeuTableColumn,
  NeuTableColumnHeaderInteractions,
  NeuTableColumnResizeEvent,
  NeuTableColumnResizeMode,
  NeuTableColumnReorderEvent,
  NeuTableContextMenuSelectEvent,
  NeuTableLayout,
  NeuTableBodyContext,
  NeuTableEditMode,
  NeuTableExpandMode,
  NeuTableEditValidationEvent,
  NeuTableEditValidationResult,
  NeuTableEditingCellState,
  NeuTableGroup,
  NeuTableGroupBy,
  NeuTableGroupExpansionEvent,
  NeuTableGroupSortOrder,
  NeuTableGroupTemplateContext,
  NeuTablePaginatorTemplateContext,
  NeuTablePaginatorPosition,
  NeuTablePageEvent,
  NeuTableRowEditContext,
  NeuTableRowEditEvent,
  NeuTableRowGroupMode,
  NeuTableRowReorderEvent,
  NeuTableRowReorderScope,
  NeuTableStructuralContext,
  NeuTableRow,
  NeuTableRowKey,
  NeuTableRowTrackBy,
  NeuTableSelectionAction,
  NeuTableSelectionActionEvent,
  NeuTableSelection,
  NeuTableSelectionComparison,
  NeuTableSelectionMode,
  NeuTableSelectable,
  NeuTableSelectionSource,
  NeuTableRowSelectionEvent,
  NeuTableRowExpansionEvent,
  NeuTableSelectAllChangeEvent,
  NeuTableSelectAllScope,
  NeuTableDatePoint,
  NeuTableDateRangeValue,
  NeuTableFilterConfig,
  NeuTableFilterOn,
  NeuTableFilterOptions,
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
  NeuTableVirtualScrollEvent,
  NeuTableCsvFormulaPolicy,
  NeuTableExportFormat,
  NeuTableExportConfig,
  NeuTableExportOptions,
  NeuTableExportScope,
  NeuTableExportValue,
  NeuTableLabels,
  NeuTablePaginatorOptions,
  NeuTableUrlStateOptions,
  NeuTableVirtualizationOptions,
  NeuTableBodyDataRenderEntry,
  NeuTableBodyRenderEntry,
  NeuTableBodySectionContext,
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
import {
  NeuTableReferenceIdentity,
  neuTableDeepSelectionToken,
  resolveNeuTablePath,
} from './neu-table-value-resolver';
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
import { NeuTableEditingController } from './neu-table-editing.controller';
import {
  NeuTableGroupingController,
  type InternalNeuTableGroup,
} from './neu-table-grouping.controller';
import {
  NeuTableLayoutController,
  type InternalNeuTableColumnMetric,
  type InternalNeuTableColumnReorderResult,
} from './neu-table-layout.controller';
import { NeuTableFilterRegistry } from './neu-table-filter.registry';
import {
  NeuTableFilterScheduler,
  type NeuTableScheduledFilters,
} from './neu-table-filter-scheduler';
import { NeuTablePaginatorController } from './neu-table-paginator.controller';
import { NeuTableViewportController } from './neu-table-viewport.controller';
import { NeuTableVirtualRetentionController } from './neu-table-virtual-retention.controller';
import { NeuTableExportController, type NeuTableExportColumn } from './neu-table-export.controller';
import { NeuTableReorderController } from './neu-table-reorder.controller';
import { NeuTableRowReorderHandleDirective } from './neu-table-row-reorder-handle.directive';
import {
  NeuTableManagedRowCoordinator,
  type NeuTableManagedRowAdapter,
} from './neu-table-managed-row.directive';

export type {
  NeuTableAction,
  NeuTableActionEvent,
  NeuTableAdvancedFilterMode,
  NeuTableAdvancedFilterTexts,
  NeuTableBadgeConfig,
  NeuTableBadgeVariant,
  NeuTableCellEditEvent,
  NeuTableCellEditLifecycleEvent,
  NeuTableCellEditorContext,
  NeuTableCellViewContext,
  NeuTableCellType,
  NeuTableColumn,
  NeuTableColumnResizeEvent,
  NeuTableColumnResizeMode,
  NeuTableColumnReorderEvent,
  NeuTableContextMenuSelectEvent,
  NeuTableLayout,
  NeuTableBodyContext,
  NeuTableEditMode,
  NeuTableExpandMode,
  NeuTableEditValidationEvent,
  NeuTableEditValidationResult,
  NeuTableEditingCellState,
  NeuTableGroup,
  NeuTableGroupExpansionEvent,
  NeuTableGroupSortOrder,
  NeuTableGroupTemplateContext,
  NeuTablePaginatorTemplateContext,
  NeuTableRowEditContext,
  NeuTableRowEditEvent,
  NeuTableRowGroupMode,
  NeuTableRowReorderEvent,
  NeuTableRowReorderScope,
  NeuTableStructuralContext,
  NeuTableSelectionAction,
  NeuTableSelectionActionEvent,
  NeuTableSelection,
  NeuTableSelectionMode,
  NeuTableSelectable,
  NeuTableSelectionSource,
  NeuTableRowSelectionEvent,
  NeuTableRowExpansionEvent,
  NeuTableSelectAllChangeEvent,
  NeuTableSelectAllScope,
  NeuTableDatePoint,
  NeuTableDateRangeValue,
  NeuTableFilterConfig,
  NeuTableFilterOptions,
  NeuTableGlobalFilterAccessor,
  NeuTableGlobalFilterField,
  NeuTableFilterKind,
  NeuTableFilterMatchMode,
  NeuTableFilterState,
  NeuTableLazyPlaceholderContext,
  NeuTableLazyRequest,
  NeuTableLazyRequestReason,
  NeuTableLabels,
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
  NeuTablePaginatorOptions,
  NeuTableUrlStateOptions,
  NeuTableVirtualizationOptions,
  NeuTableExportConfig,
  NeuTableVirtualRange,
  NeuTableRow,
  NeuTableRowKey,
} from './neu-table.types';

type NeuTableRuntimeRow<T extends object> = T & Record<string, unknown>;

type NeuTablePageEntry<T extends object> =
  | {
      kind: 'group';
      key: string;
      label: string;
      count: number;
      group: InternalNeuTableGroup<T>;
      frozen: boolean;
    }
  | { kind: 'group-footer'; key: string; group: InternalNeuTableGroup<T>; frozen: boolean }
  | { kind: 'placeholder'; key: string; logicalIndex: number; frozen: false }
  | { kind: 'spacer'; key: string; height: number; position: 'top' | 'bottom' }
  | {
      kind: 'row';
      key: unknown;
      row: NeuTableRuntimeRow<T>;
      rowIndex: number;
      logicalIndex: number;
      frozen: boolean;
    };

type NeuTableData<T> = [T] extends [Record<string, unknown>]
  ? readonly T[] | readonly object[]
  : readonly T[];

interface InternalFilterColumnSignature {
  kind: NeuTableFilterKind | 'legacy' | 'none';
  mode?: string;
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
  exactMatch: 'Exact match',
  placeholder: 'Filter...',
  ariaPrefix: 'Filter by',
};

const _NEU_TABLE_LABELS: Required<NeuTableLabels> = {
  searchPlaceholder: 'Search...',
  searchAriaLabel: 'Search table',
  clearSearchAriaLabel: 'Clear search',
  previousPageAriaLabel: 'Previous page',
  nextPageAriaLabel: 'Next page',
  firstPageAriaLabel: 'First page',
  lastPageAriaLabel: 'Last page',
  pageAriaLabel: 'Page {page}',
  jumpToPageAriaLabel: 'Jump to page',
  pageSizeLabel: 'Rows:',
  pageSizeAriaLabel: 'Rows per page',
  paginationAriaLabel: 'Pagination',
  clearSelectionLabel: 'Clear selection',
  selectionSummaryLabel: 'selected',
  selectAllAriaLabel: '',
  selectRowAriaLabel: 'Select row',
  unselectRowAriaLabel: 'Unselect row',
  expandRowAriaLabel: 'Expand row',
  collapseRowAriaLabel: 'Collapse row',
  moveRowUpAriaLabel: 'Move row up',
  moveRowDownAriaLabel: 'Move row down',
  columnChooserLabel: 'Columns',
  groupHeaderLabel: 'Group:',
  expandGroupAriaLabel: 'Expand group',
  collapseGroupAriaLabel: 'Collapse group',
  inlineEditLabel: 'Edit cell',
  saveInlineEditLabel: 'Save cell',
  cancelInlineEditLabel: 'Cancel cell edit',
  ofLabel: 'of',
  resultLabelSingular: 'result',
  resultLabelPlural: 'results',
};

const _NEU_TABLE_FILTER_OPTIONS: Required<NeuTableFilterOptions> = {
  delay: 0,
  on: 'input',
  locale: '',
};

const _NEU_TABLE_PAGINATOR_OPTIONS: Required<NeuTablePaginatorOptions> = {
  pageLinkSize: 5,
  showPageLinks: true,
  showFirstLastPageButtons: true,
  showCurrentPageReport: true,
  currentPageReportTemplate: '',
  showJumpToPageInput: false,
  showJumpToPageDropdown: false,
  alwaysShow: true,
};

const _NEU_TABLE_VIRTUALIZATION_OPTIONS: Required<NeuTableVirtualizationOptions> = {
  visibleItems: 8,
  itemSize: 0,
  overscan: 3,
  delay: 0,
  appendOnly: false,
  autoSize: false,
  step: 0,
};

const _NEU_TABLE_URL_STATE_OPTIONS: Required<NeuTableUrlStateOptions> = {
  enabled: true,
  pageParam: 'page',
  searchParam: 'q',
  sortParam: 'sort',
  sortDirectionParam: 'sortDir',
  multiSortParam: 'msort',
};

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
  providers: [NeuTableManagedRowCoordinator],
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
    NeuTableRowReorderHandleDirective,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.neu-table__host]': 'true',
    '[class.neu-table__host--compact]': 'density() === "compact"',
    '[class.neu-table__host--relaxed]': 'density() === "relaxed"',
    '[class.neu-table__host--flex]': 'scrollHeight() === "flex"',
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
      [class.neu-table--sticky-header]="_verticalScrollEnabled()"
      [class.neu-table-container--bordered]="bordered()"
      [class.neu-table-container--rounded]="roundedBorders()"
      [class.neu-table-container--striped]="stripedRows()"
      [class.neu-table-container--flex-scroll]="scrollHeight() === 'flex'"
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

      <ng-template #tablePaginator>
        <div class="neu-table__footer">
          @if (paginatorLeftTemplate(); as paginatorLeft) {
            <div class="neu-table__paginator-outlet neu-table__paginator-outlet--left">
              <ng-container
                [ngTemplateOutlet]="paginatorLeft.templateRef"
                [ngTemplateOutletContext]="paginatorTemplateContext()"
              />
            </div>
          }
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
          @if (showCurrentPageReport()) {
            <span class="neu-table__info" aria-live="polite">{{ paginationInfo() }}</span>
          }
          @if (totalPages() > 1) {
            <nav class="neu-table__pagination" [attr.aria-label]="paginationAriaLabel()">
              @if (showFirstLastPageButtons()) {
                <button
                  class="neu-table__page-btn"
                  type="button"
                  [disabled]="currentPage() === 1"
                  (click)="goToPage(1)"
                  [attr.aria-label]="firstPageAriaLabel()"
                >
                  «
                </button>
              }
              <button
                class="neu-table__page-btn"
                type="button"
                [disabled]="currentPage() === 1"
                (click)="goToPage(currentPage() - 1)"
                [attr.aria-label]="previousPageAriaLabel()"
              >
                ‹
              </button>
              @if (showPageLinks()) {
                @for (page of pageNumbers(); track page) {
                  <button
                    class="neu-table__page-btn"
                    [class.neu-table__page-btn--active]="page === currentPage()"
                    (click)="goToPage(page)"
                    [attr.aria-current]="page === currentPage() ? 'page' : null"
                    [attr.aria-label]="pageButtonAriaLabel(page)"
                    type="button"
                  >
                    {{ page }}
                  </button>
                }
              }
              <button
                class="neu-table__page-btn"
                type="button"
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(currentPage() + 1)"
                [attr.aria-label]="nextPageAriaLabel()"
              >
                ›
              </button>
              @if (showFirstLastPageButtons()) {
                <button
                  class="neu-table__page-btn"
                  type="button"
                  [disabled]="currentPage() === totalPages()"
                  (click)="goToPage(totalPages())"
                  [attr.aria-label]="lastPageAriaLabel()"
                >
                  »
                </button>
              }
              @if (showJumpToPageInput()) {
                <input
                  class="neu-table__jump-input"
                  type="number"
                  min="1"
                  [max]="totalPages()"
                  [value]="currentPage()"
                  [attr.aria-label]="jumpToPageAriaLabel()"
                  (change)="goToPage(+$any($event.target).value)"
                />
              }
              @if (showJumpToPageDropdown()) {
                <select
                  class="neu-table__jump-select"
                  [value]="currentPage()"
                  [attr.aria-label]="jumpToPageAriaLabel()"
                  (change)="goToPage(+$any($event.target).value)"
                >
                  @for (page of pageNumbersAll(); track page) {
                    <option [value]="page">{{ page }}</option>
                  }
                </select>
              }
            </nav>
          }
          @if (paginatorRightTemplate(); as paginatorRight) {
            <div class="neu-table__paginator-outlet neu-table__paginator-outlet--right">
              <ng-container
                [ngTemplateOutlet]="paginatorRight.templateRef"
                [ngTemplateOutletContext]="paginatorTemplateContext()"
              />
            </div>
          }
        </div>
      </ng-template>

      @if (
        !loading() &&
        filteredData().length > 0 &&
        !_lazyVirtualActive() &&
        pagination() &&
        (alwaysShowPaginator() || totalPages() > 1) &&
        (paginatorPosition() === 'top' || paginatorPosition() === 'both')
      ) {
        <ng-container [ngTemplateOutlet]="tablePaginator" />
      }

      <!-- ---- Scroll container ---- -->
      <div
        #scrollContainer
        cdkScrollable
        class="neu-table__scroll-container"
        [class.neu-table__scroll-container--virtual]="_virtualScrollActive()"
        [class.neu-table__scroll-container--vertical]="_verticalScrollEnabled()"
        [class.neu-table__scroll-container--flex]="scrollHeight() === 'flex'"
        role="region"
        [attr.aria-label]="title() || tableAriaLabel()"
        [attr.aria-busy]="loading() ? true : null"
        [style.max-height]="_scrollContainerMaxHeight()"
        (scroll)="onTableScroll($event)"
      >
        <table class="neu-table" [attr.aria-rowcount]="_ariaRowCount()">
          @if (captionTemplate(); as caption) {
            <caption class="neu-table__caption">
              <ng-container
                [ngTemplateOutlet]="caption.templateRef"
                [ngTemplateOutletContext]="structuralContext()"
              />
            </caption>
          }
          <thead class="neu-table__head">
            @if (headerGroupTemplate(); as headerGroup) {
              <ng-container
                [ngTemplateOutlet]="headerGroup.templateRef"
                [ngTemplateOutletContext]="structuralContext()"
              />
            } @else {
              <tr [attr.aria-rowindex]="_ariaCoordinatesActive() ? 1 : null">
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
                @if (reorderableRows()) {
                  <th class="neu-table__th neu-table__th--row-reorder" scope="col">
                    <span class="sr-only">Row order</span>
                  </th>
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
                    [class.neu-table__th--dragging]="_draggedColumnKey() === col.key"
                    [class.neu-table__th--drop-before]="
                      _columnDropTarget()?.key === col.key &&
                      _columnDropTarget()?.placement === 'before'
                    "
                    [class.neu-table__th--drop-after]="
                      _columnDropTarget()?.key === col.key &&
                      _columnDropTarget()?.placement === 'after'
                    "
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
                    [attr.data-neu-table-column-key]="col.key"
                    [attr.draggable]="isColumnDraggable(col) ? 'true' : null"
                    (pointerdown)="onColumnPointerDown(col, $event)"
                    (dragstart)="onColumnDragStart(col, $event)"
                    (dragover)="onColumnDragOver(col, $event)"
                    (drop)="onColumnDrop(col, $event)"
                    (dragend)="onColumnDragEnd(col)"
                    (click)="onSortableHeaderClick(col.key, $event)"
                    (keydown)="onSortableHeaderKeydown(col.key, $event)"
                  >
                    @if (reorderableColumns()) {
                      <span class="neu-table__reorder-controls" (click)="$event.stopPropagation()">
                        <button
                          type="button"
                          class="neu-table__reorder-btn"
                          [disabled]="!canMoveColumn(col.key, -1)"
                          [attr.aria-label]="'Move ' + col.header + ' left'"
                          (click)="moveColumn(col.key, -1)"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          class="neu-table__reorder-btn"
                          [disabled]="!canMoveColumn(col.key, 1)"
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
                        [class.neu-table__filter-overlay-trigger--open]="
                          _openFilterKey() === col.key
                        "
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
                          _isFilterOverlayActive(col.key)
                            ? _advancedFilterText().filterActive
                            : null
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
                        tabindex="-1"
                        [attr.aria-label]="'Resize ' + col.header"
                        (dblclick)="resetColumnWidth(col.key, $event)"
                        (pointerdown)="startColumnResize(col, $event)"
                      ></button>
                    }
                  </th>
                }
              </tr>
              <!-- ── Fila de filtros de columna / Column filter row ── -->
              @if (_hasFilterableCol()) {
                <tr
                  class="neu-table__filter-row"
                  [attr.aria-rowindex]="_ariaCoordinatesActive() ? 2 : null"
                >
                  @if (_expansionEnabled()) {
                    <th class="neu-table__th neu-table__th--filter-placeholder" scope="col"></th>
                  }
                  @if (selectionEnabled()) {
                    <th class="neu-table__th neu-table__th--filter-placeholder" scope="col"></th>
                  }
                  @if (showRowNumbers()) {
                    <th class="neu-table__th neu-table__th--filter-placeholder" scope="col"></th>
                  }
                  @if (reorderableRows()) {
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
                      <span class="sr-only">{{ col.header }}</span>
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
                              (keydown)="commitInlineFilterOnEnter(col, $event)"
                            />
                          }
                          @case ('number') {
                            @if (modernFilterMode(col) === 'between') {
                              <div class="neu-table__filter-range">
                                <neu-number-input
                                  [nullable]="true"
                                  [label]="rangeFilterLabel(col, 'from')"
                                  [formControl]="typedRangeStartControl(col)"
                                  (keydown)="commitInlineFilterOnEnter(col, $event)"
                                />
                                <neu-number-input
                                  [nullable]="true"
                                  [label]="rangeFilterLabel(col, 'to')"
                                  [formControl]="typedRangeEndControl(col)"
                                  (keydown)="commitInlineFilterOnEnter(col, $event)"
                                />
                              </div>
                            } @else {
                              <neu-number-input
                                [nullable]="true"
                                [label]="modernFilterLabel(col)"
                                [formControl]="typedColumnFilterControl(col)"
                                (keydown)="commitInlineFilterOnEnter(col, $event)"
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
                            (keydown)="commitInlineFilterOnEnter(col, $event)"
                          />
                        }
                      }
                    </th>
                  }
                </tr>
              }
            }
          </thead>

          <tbody class="neu-table__body">
            @if (bodySectionTemplate(); as bodySection) {
              <ng-container
                [ngTemplateOutlet]="bodySection.templateRef"
                [ngTemplateOutletContext]="bodySectionContext()"
              />
            } @else {
              @if (loading() && !_lazyVirtualActive()) {
                @if (loadingBodyTemplate(); as loadingBody) {
                  <ng-container
                    [ngTemplateOutlet]="loadingBody.templateRef"
                    [ngTemplateOutletContext]="structuralContext()"
                  />
                } @else {
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
                }
              } @else if (_tableEmpty()) {
                <tr>
                  <td [attr.colspan]="totalColspan()" class="neu-table__td neu-table__td--empty">
                    @if (emptyTemplate(); as empty) {
                      <ng-container
                        [ngTemplateOutlet]="empty.templateRef"
                        [ngTemplateOutletContext]="emptyContext()"
                      />
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
                @for (
                  entry of renderedPageEntries();
                  track entryTrackingKey(entry, entryIdx);
                  let entryIdx = $index
                ) {
                  @if (entry.kind === 'spacer') {
                    <tr class="neu-table__spacer-row" aria-hidden="true">
                      <td
                        [attr.colspan]="totalColspan()"
                        class="neu-table__spacer-cell"
                        [style.height.px]="entry.height"
                      ></td>
                    </tr>
                  } @else if (entry.kind === 'placeholder') {
                    <tr
                      class="neu-table__row neu-table__row--placeholder"
                      aria-hidden="true"
                      inert
                      [style.height.px]="_virtualItemSize()"
                      [attr.data-neu-table-placeholder-index]="entry.logicalIndex"
                    >
                      @if (lazyPlaceholderTemplate(); as placeholderTemplate) {
                        <ng-container
                          [ngTemplateOutlet]="placeholderTemplate.templateRef"
                          [ngTemplateOutletContext]="lazyPlaceholderContext(entry.logicalIndex)"
                        />
                      } @else {
                        @if (_expansionEnabled()) {
                          <td class="neu-table__td neu-table__td--expand-col"></td>
                        }
                        @if (selectionEnabled()) {
                          <td class="neu-table__td neu-table__th--check"></td>
                        }
                        @if (showRowNumbers()) {
                          <td class="neu-table__td neu-table__td--rn">
                            <span class="neu-table__lazy-skeleton"></span>
                          </td>
                        }
                        @if (reorderableRows()) {
                          <td class="neu-table__td neu-table__td--row-reorder"></td>
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
                    <tr
                      class="neu-table__group-row"
                      [class.neu-table__group-row--sticky]="stickyHeader()"
                      [class.neu-table__group-row--frozen]="entry.frozen"
                      [attr.data-neu-table-frozen-stack]="entry.frozen ? entryIdx + ':group' : null"
                      [style.top.px]="entry.frozen ? frozenRowTop(entryIdx + ':group') : null"
                    >
                      <td
                        [attr.colspan]="totalColspan()"
                        class="neu-table__td neu-table__td--group"
                      >
                        @if (expandableRowGroups() && !_virtualScrollActive()) {
                          <button
                            type="button"
                            class="neu-table__group-toggle"
                            [attr.aria-expanded]="entry.group.expanded"
                            [attr.aria-label]="groupExpansionAriaLabel(entry.group)"
                            (click)="toggleGroup(entry.group)"
                          >
                            {{ entry.group.expanded ? '−' : '+' }}
                          </button>
                        }
                        @if (groupHeaderTemplate(); as groupHeader) {
                          <ng-container
                            [ngTemplateOutlet]="groupHeader.templateRef"
                            [ngTemplateOutletContext]="
                              groupTemplateContext(entry.group, entry.frozen)
                            "
                          />
                        } @else {
                          {{ groupHeaderLabel() }} {{ entry.group.label }}
                          <span class="neu-table__group-count">({{ entry.group.count }})</span>
                        }
                      </td>
                    </tr>
                  } @else if (entry.kind === 'group-footer') {
                    <tr
                      class="neu-table__group-footer-row"
                      [class.neu-table__group-footer-row--frozen]="entry.frozen"
                      [attr.data-neu-table-frozen-stack]="
                        entry.frozen ? entryIdx + ':footer' : null
                      "
                      [style.top.px]="entry.frozen ? frozenRowTop(entryIdx + ':footer') : null"
                    >
                      <td
                        [attr.colspan]="totalColspan()"
                        class="neu-table__td neu-table__td--group-footer"
                      >
                        @if (groupFooterTemplate(); as groupFooter) {
                          <ng-container
                            [ngTemplateOutlet]="groupFooter.templateRef"
                            [ngTemplateOutletContext]="
                              groupTemplateContext(entry.group, entry.frozen)
                            "
                          />
                        }
                      </td>
                    </tr>
                  } @else {
                    @let row = entry.row;
                    <tr
                      class="neu-table__row"
                      [style.height.px]="
                        _virtualScrollActive() && !entry.frozen ? _virtualItemSize() : null
                      "
                      [attr.data-neu-table-frozen-stack]="entry.frozen ? entryIdx + ':row' : null"
                      [style.top.px]="entry.frozen ? frozenRowTop(entryIdx + ':row') : null"
                      [class]="getRowClass(row)"
                      [class.neu-table__row--selected]="isRowSelected(row)"
                      [class.neu-table__row--frozen]="entry.frozen"
                      [class.neu-table__row--context-selected]="isContextMenuRow(row)"
                      [class.neu-table__row--dragging]="_draggedRowKey() === getRowKey(row)"
                      [class.neu-table__row--drop-before]="
                        _rowDropTarget()?.key === getRowKey(row) &&
                        _rowDropTarget()?.placement === 'before'
                      "
                      [class.neu-table__row--drop-after]="
                        _rowDropTarget()?.key === getRowKey(row) &&
                        _rowDropTarget()?.placement === 'after'
                      "
                      [class.neu-table__row--disabled]="!isRowSelectable(row)"
                      [class.neu-table__row--clickable]="
                        selectionEnabled() && selectOnRowClick() && isRowSelectable(row)
                      "
                      [attr.tabindex]="rowTabIndex(row)"
                      [attr.data-neu-table-navigable]="isNavigableRow(row) ? 'true' : null"
                      [attr.aria-selected]="
                        selectionEnabled() && isRowSelectable(row) ? isRowSelected(row) : null
                      "
                      [attr.aria-disabled]="
                        selectionEnabled() && !isRowSelectable(row) ? true : null
                      "
                      [attr.aria-rowindex]="bodyAriaRowIndex(entry)"
                      [attr.data-neu-table-logical-index]="entry.logicalIndex"
                      [attr.data-neu-table-frozen]="entry.frozen ? 'true' : null"
                      [attr.draggable]="isRowDragArmed(row, entry.frozen) ? 'true' : null"
                      (pointerdown)="onRowPointerDown(row, entry.frozen, $event)"
                      (dragstart)="onRowDragStart(row, entry.frozen, $event)"
                      (dragover)="onRowDragOver(row, entry.frozen, $event)"
                      (drop)="onRowDrop(row, entry.frozen, $event)"
                      (dragend)="onRowDragEnd($event)"
                      (contextmenu)="onRowContextMenu(row, entry.logicalIndex, $event)"
                      (click)="onRowClick(row, $event)"
                      (dblclick)="rowDblClick.emit(row)"
                      (focus)="onRowFocus(row, $event)"
                      (keydown)="onRowKeydown(row, $event)"
                    >
                      @if (bodyTemplate(); as body) {
                        <ng-container
                          [ngTemplateOutlet]="body.templateRef"
                          [ngTemplateOutletContext]="
                            bodyContext(row, entry.rowIndex, entry.logicalIndex, entry.frozen)
                          "
                        />
                      } @else {
                        @if (_expansionEnabled()) {
                          <td
                            class="neu-table__td neu-table__td--expand-col"
                            (click)="$event.stopPropagation()"
                          >
                            @if (_rowExpansionEnabled(entry.frozen)) {
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
                            }
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
                        @if (reorderableRows()) {
                          <td
                            class="neu-table__td neu-table__td--row-reorder"
                            (click)="$event.stopPropagation()"
                          >
                            @if (canReorderRow(row, entry.frozen)) {
                              <span class="neu-table__row-reorder-controls">
                                <button
                                  neuTableRowReorderHandle
                                  type="button"
                                  class="neu-table__row-reorder-drag"
                                  [attr.aria-label]="'Drag row ' + (entry.logicalIndex + 1)"
                                  title="Drag row"
                                >
                                  ⋮⋮
                                </button>
                                <button
                                  type="button"
                                  class="neu-table__row-reorder-move"
                                  [disabled]="!canMoveRow(row, -1)"
                                  [attr.aria-label]="moveRowUpAriaLabel()"
                                  (click)="moveRow(row, -1)"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  class="neu-table__row-reorder-move"
                                  [disabled]="!canMoveRow(row, 1)"
                                  [attr.aria-label]="moveRowDownAriaLabel()"
                                  (click)="moveRow(row, 1)"
                                >
                                  ↓
                                </button>
                              </span>
                            }
                          </td>
                        }
                        @for (col of visibleColumns(); track col.key) {
                          @if (
                            !isRowspanGroupCell(entry.rowIndex, col.key) ||
                            !hideGroupRowspanCell(entry.rowIndex, entry.frozen)
                          ) {
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
                              [attr.tabindex]="editMode() === 'cell' && col.editable ? -1 : null"
                              [attr.rowspan]="
                                isRowspanGroupCell(entry.rowIndex, col.key)
                                  ? groupRowspan(entry.rowIndex, entry.frozen)
                                  : null
                              "
                              [attr.data-neu-table-edit-row]="entry.rowIndex"
                              [attr.data-neu-table-edit-frozen]="entry.frozen ? 'true' : 'false'"
                              [attr.data-neu-table-edit-column]="col.key"
                              [attr.data-neu-table-editing]="
                                isEditingCell(row, col) ? 'true' : null
                              "
                              [attr.aria-invalid]="
                                isEditingCell(row, col) && cellEditingInvalid() ? true : null
                              "
                              (dblclick)="startCellEdit(row, col, $event)"
                              (keydown)="onEditableCellKeydown(row, col, $event)"
                            >
                              @if (isEditingCell(row, col)) {
                                @if (cellEditorTemplate(col.key); as editorTemplate) {
                                  <ng-container
                                    [ngTemplateOutlet]="editorTemplate"
                                    [ngTemplateOutletContext]="
                                      cellEditorContext(
                                        row,
                                        col,
                                        entry.rowIndex,
                                        entry.logicalIndex,
                                        entry.frozen
                                      )
                                    "
                                  />
                                } @else {
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
                                    (editCancel)="cancelCellEdit(undefined, row, col)"
                                  />
                                }
                                @if (cellEditingError(); as editError) {
                                  <span class="neu-table__edit-error" role="alert">{{
                                    editError
                                  }}</span>
                                }
                              } @else if (cellViewTemplate(col.key); as viewTemplate) {
                                <ng-container
                                  [ngTemplateOutlet]="viewTemplate"
                                  [ngTemplateOutletContext]="
                                    cellViewContext(
                                      row,
                                      col,
                                      entry.rowIndex,
                                      entry.logicalIndex,
                                      entry.frozen
                                    )
                                  "
                                />
                              } @else if (col.cellTemplate) {
                                <ng-container
                                  [ngTemplateOutlet]="col.cellTemplate"
                                  [ngTemplateOutletContext]="{
                                    $implicit: row,
                                    row: row,
                                    column: col,
                                  }"
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
                                            (click)="
                                              handleAction(row, action); $event.stopPropagation()
                                            "
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
                                          [disabled]="
                                            action.disabled ? action.disabled(row) : false
                                          "
                                          [title]="action.label"
                                          (click)="
                                            handleAction(row, action); $event.stopPropagation()
                                          "
                                        >
                                          @if (action.icon.startsWith('lucide')) {
                                            <neu-icon
                                              class="neu-table__action-icon"
                                              [name]="action.icon"
                                              size="1rem"
                                              aria-hidden="true"
                                            />
                                          } @else {
                                            <span
                                              class="neu-table__action-icon"
                                              aria-hidden="true"
                                              >{{ action.icon }}</span
                                            >
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
                        }
                      }
                    </tr>
                    @if (_rowExpansionEnabled(entry.frozen) && isRowExpanded(row)) {
                      <tr
                        class="neu-table__row-expand-detail"
                        [class.neu-table__row-expand-detail--frozen]="entry.frozen"
                        [attr.data-neu-table-frozen-stack]="
                          entry.frozen ? entryIdx + ':detail' : null
                        "
                        [style.top.px]="entry.frozen ? frozenRowTop(entryIdx + ':detail') : null"
                      >
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
              }
            }
          </tbody>
          @if (footerGroupTemplate(); as footerGroup) {
            <tfoot class="neu-table__foot">
              <ng-container
                [ngTemplateOutlet]="footerGroup.templateRef"
                [ngTemplateOutletContext]="structuralContext()"
              />
            </tfoot>
          } @else if (footerRow()) {
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
                @if (reorderableRows()) {
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

      @if (summaryTemplate(); as summary) {
        <div class="neu-table__summary">
          <ng-container
            [ngTemplateOutlet]="summary.templateRef"
            [ngTemplateOutletContext]="structuralContext()"
          />
        </div>
      }

      @if (
        !loading() &&
        filteredData().length > 0 &&
        !_lazyVirtualActive() &&
        pagination() &&
        (alwaysShowPaginator() || totalPages() > 1) &&
        (paginatorPosition() === 'bottom' || paginatorPosition() === 'both')
      ) {
        <ng-container [ngTemplateOutlet]="tablePaginator" />
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
    this.getSelectionKey(row),
  );
  private readonly _referenceIdentity = new NeuTableReferenceIdentity<T>();
  private readonly _sortController = new NeuTableSortController<T>();
  private readonly _queryController = new NeuTableQueryController<T>();
  private readonly _filterRegistry = inject(NeuTableFilterRegistry);
  private readonly _temporal = inject(NeuInitialTemporalState);
  private readonly _filterScheduler = new NeuTableFilterScheduler<InternalAppliedColumnFilter>(
    (pending) => this._applyScheduledFilters(pending),
  );
  private readonly _paginatorController = new NeuTablePaginatorController();
  private readonly _viewportController = new NeuTableViewportController();
  private readonly _exportController = new NeuTableExportController();
  private readonly _lazyDataController = new NeuTableLazyDataController<NeuTableRuntimeRow<T>>();
  private readonly _virtualRetention = new NeuTableVirtualRetentionController<
    NeuTableRuntimeRow<T>
  >();
  private readonly _keyboardController = new NeuTableKeyboardController<unknown>();
  private readonly _editingController = new NeuTableEditingController<NeuTableRuntimeRow<T>>();
  private readonly _groupingController = new NeuTableGroupingController<NeuTableRuntimeRow<T>>();
  protected readonly _selectionRadioName = inject(NeuIdGenerator).getId('neu-table-selection-');
  private readonly _urlAdapter = new NeuTableUrlStateAdapter(this._urlState);
  private readonly _persistenceAdapter = new NeuTableStatePersistenceAdapter();
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _document = inject(DOCUMENT);
  private readonly _elementRef = inject(ElementRef<HTMLElement>);
  private readonly _injector = inject(Injector);
  private readonly _managedRowCoordinator = inject(NeuTableManagedRowCoordinator);
  private readonly _scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  private _virtualScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly _filterOverlayUid = inject(NeuIdGenerator).getId('neu-table-filter-overlay-');
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
  private readonly _browserEnhancementsReady = signal(false);
  private _restoringState = false;
  private _restoredStateSignature: string | null = null;
  private _pendingEditorFocus = false;

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
  /** Rows pinned above the scrolling/virtual data domain. Row keys must be unique across both. */
  readonly frozenData = input<readonly T[]>([]);
  readonly pageSize = input<number>(10);
  /** Controla si la paginación está activa. Si es false, se muestran todos los datos y se ocultan los controles de paginación y pageSize. */
  readonly pagination = input<boolean>(true);
  readonly loading = input<boolean>(false);
  readonly title = input<string>('');
  readonly emptyMessage = input<string>('No results found');
  protected readonly skeletonRows = computed(() => [1, 2, 3, 4, 5] as const);

  readonly expandTemplate = contentChild<NeuTableExpandDirective<T>>(NeuTableExpandDirective);
  readonly toolbarTemplate = contentChild(NeuTableToolbarDirective);
  readonly bodyTemplate = contentChild<NeuTableBodyDirective<T>>(NeuTableBodyDirective);
  readonly bodySectionTemplate = contentChild<NeuTableBodySectionDirective<T>>(
    NeuTableBodySectionDirective,
  );
  readonly captionTemplate = contentChild<NeuTableCaptionDirective<T>>(NeuTableCaptionDirective);
  readonly headerGroupTemplate = contentChild<NeuTableHeaderGroupDirective<T>>(
    NeuTableHeaderGroupDirective,
  );
  readonly footerGroupTemplate = contentChild<NeuTableFooterGroupDirective<T>>(
    NeuTableFooterGroupDirective,
  );
  readonly loadingBodyTemplate = contentChild<NeuTableLoadingBodyDirective<T>>(
    NeuTableLoadingBodyDirective,
  );
  readonly emptyTemplate = contentChild<NeuTableEmptyDirective<T>>(NeuTableEmptyDirective);
  readonly lazyPlaceholderTemplate = contentChild<NeuTableLazyPlaceholderDirective<T>>(
    NeuTableLazyPlaceholderDirective,
  );
  readonly summaryTemplate = contentChild<NeuTableSummaryDirective<T>>(NeuTableSummaryDirective);
  readonly paginatorLeftTemplate = contentChild(NeuTablePaginatorLeftDirective);
  readonly paginatorRightTemplate = contentChild(NeuTablePaginatorRightDirective);
  readonly groupHeaderTemplate = contentChild<NeuTableGroupHeaderDirective<T>>(
    NeuTableGroupHeaderDirective,
  );
  readonly groupFooterTemplate = contentChild<NeuTableGroupFooterDirective<T>>(
    NeuTableGroupFooterDirective,
  );
  readonly cellViewTemplates =
    contentChildren<NeuTableCellViewDirective<T>>(NeuTableCellViewDirective);
  readonly cellEditorTemplates = contentChildren<NeuTableCellEditorDirective<T>>(
    NeuTableCellEditorDirective,
  );
  protected readonly filterTemplates = contentChildren<NeuTableFilterTemplateDirective<T>>(
    NeuTableFilterTemplateDirective,
  );
  protected readonly _toolbarTemplateRef = computed(
    () => this.toolbarTemplate()?.templateRef ?? null,
  );

  // ── Inputs de funcionalidad ──────────────────────────────────────────
  readonly searchable = input<boolean>(true);
  readonly advancedFilterMode = input<NeuTableAdvancedFilterMode>('off');
  readonly advancedFilterTexts = input<Partial<NeuTableAdvancedFilterTexts>>({});
  readonly labels = input<NeuTableLabels>({});
  readonly filterOptions = input<NeuTableFilterOptions>({});
  readonly paginatorOptions = input<NeuTablePaginatorOptions>({});
  readonly exportOptions = input<NeuTableExportConfig<T>>({});
  readonly virtualizationOptions = input<NeuTableVirtualizationOptions>({});
  readonly urlStateOptions = input<NeuTableUrlStateOptions>({});
  readonly exactMatchable = input<boolean>(false);
  readonly tableAriaLabel = input<string>('Data table');

  private readonly _labels = computed<Required<NeuTableLabels>>(() => ({
    ..._NEU_TABLE_LABELS,
    ...this.labels(),
  }));
  private readonly _filterOptions = computed<Required<NeuTableFilterOptions>>(() => ({
    ..._NEU_TABLE_FILTER_OPTIONS,
    ...this.filterOptions(),
  }));
  private readonly _paginatorOptions = computed<Required<NeuTablePaginatorOptions>>(() => ({
    ..._NEU_TABLE_PAGINATOR_OPTIONS,
    ...this.paginatorOptions(),
  }));
  private readonly _virtualizationOptions = computed<Required<NeuTableVirtualizationOptions>>(
    () => ({ ..._NEU_TABLE_VIRTUALIZATION_OPTIONS, ...this.virtualizationOptions() }),
  );
  private readonly _urlStateOptions = computed<Required<NeuTableUrlStateOptions>>(() => ({
    ..._NEU_TABLE_URL_STATE_OPTIONS,
    ...this.urlStateOptions(),
  }));

  protected readonly filterDelay = computed(() => this._filterOptions().delay);
  protected readonly filterOn = computed(() => this._filterOptions().on);
  protected readonly filterLocale = computed(() => this._filterOptions().locale || undefined);
  protected readonly searchPlaceholder = computed(() => this._labels().searchPlaceholder);
  protected readonly searchAriaLabel = computed(() => this._labels().searchAriaLabel);
  protected readonly clearSearchAriaLabel = computed(() => this._labels().clearSearchAriaLabel);
  protected readonly previousPageAriaLabel = computed(() => this._labels().previousPageAriaLabel);
  protected readonly nextPageAriaLabel = computed(() => this._labels().nextPageAriaLabel);
  protected readonly firstPageAriaLabel = computed(() => this._labels().firstPageAriaLabel);
  protected readonly lastPageAriaLabel = computed(() => this._labels().lastPageAriaLabel);
  protected readonly pageAriaLabel = computed(() => this._labels().pageAriaLabel);
  protected readonly jumpToPageAriaLabel = computed(() => this._labels().jumpToPageAriaLabel);
  protected readonly pageSizeLabel = computed(() => this._labels().pageSizeLabel);
  protected readonly pageSizeAriaLabel = computed(() => this._labels().pageSizeAriaLabel);
  protected readonly paginationAriaLabel = computed(() => this._labels().paginationAriaLabel);
  protected readonly clearSelectionLabel = computed(() => this._labels().clearSelectionLabel);
  protected readonly selectionSummaryLabel = computed(() => this._labels().selectionSummaryLabel);
  protected readonly selectAllAriaLabel = computed(
    () => this._labels().selectAllAriaLabel || undefined,
  );
  protected readonly selectRowAriaLabel = computed(() => this._labels().selectRowAriaLabel);
  protected readonly unselectRowAriaLabel = computed(() => this._labels().unselectRowAriaLabel);
  protected readonly expandRowAriaLabel = computed(() => this._labels().expandRowAriaLabel);
  protected readonly collapseRowAriaLabel = computed(() => this._labels().collapseRowAriaLabel);
  protected readonly moveRowUpAriaLabel = computed(() => this._labels().moveRowUpAriaLabel);
  protected readonly moveRowDownAriaLabel = computed(() => this._labels().moveRowDownAriaLabel);
  protected readonly columnChooserLabel = computed(() => this._labels().columnChooserLabel);
  protected readonly groupHeaderLabel = computed(() => this._labels().groupHeaderLabel);
  protected readonly expandGroupAriaLabel = computed(() => this._labels().expandGroupAriaLabel);
  protected readonly collapseGroupAriaLabel = computed(() => this._labels().collapseGroupAriaLabel);
  protected readonly inlineEditLabel = computed(() => this._labels().inlineEditLabel);
  protected readonly saveInlineEditLabel = computed(() => this._labels().saveInlineEditLabel);
  protected readonly cancelInlineEditLabel = computed(() => this._labels().cancelInlineEditLabel);
  protected readonly ofLabel = computed(() => this._labels().ofLabel);
  protected readonly resultLabelSingular = computed(() => this._labels().resultLabelSingular);
  protected readonly resultLabelPlural = computed(() => this._labels().resultLabelPlural);

  protected readonly pageLinkSize = computed(() => this._paginatorOptions().pageLinkSize);
  protected readonly showPageLinks = computed(() => this._paginatorOptions().showPageLinks);
  protected readonly showFirstLastPageButtons = computed(
    () => this._paginatorOptions().showFirstLastPageButtons,
  );
  protected readonly showCurrentPageReport = computed(
    () => this._paginatorOptions().showCurrentPageReport,
  );
  protected readonly currentPageReportTemplate = computed(
    () => this._paginatorOptions().currentPageReportTemplate || undefined,
  );
  protected readonly showJumpToPageInput = computed(
    () => this._paginatorOptions().showJumpToPageInput,
  );
  protected readonly showJumpToPageDropdown = computed(
    () => this._paginatorOptions().showJumpToPageDropdown,
  );
  protected readonly alwaysShowPaginator = computed(() => this._paginatorOptions().alwaysShow);

  protected readonly virtualScrollVisibleItems = computed(
    () => this._virtualizationOptions().visibleItems,
  );
  protected readonly virtualScrollItemSize = computed(
    () => this._virtualizationOptions().itemSize || undefined,
  );
  protected readonly virtualScrollOverscan = computed(() => this._virtualizationOptions().overscan);
  protected readonly virtualScrollDelay = computed(() => this._virtualizationOptions().delay);
  protected readonly virtualScrollAppendOnly = computed(
    () => this._virtualizationOptions().appendOnly,
  );
  protected readonly virtualScrollAutoSize = computed(() => this._virtualizationOptions().autoSize);
  protected readonly virtualScrollStep = computed(
    () => this._virtualizationOptions().step || undefined,
  );

  protected readonly exportable = computed(() => this.exportOptions().enabled ?? false);
  protected readonly exportFileName = computed(() => this.exportOptions().fileName ?? 'export');
  protected readonly exportFormats = computed<readonly NeuTableExportFormat[]>(
    () => this.exportOptions().formats ?? ['csv'],
  );
  protected readonly exportColumns = computed<readonly string[]>(
    () => this.exportOptions().columns ?? [],
  );
  protected readonly exportScope = computed<NeuTableExportScope>(
    () => this.exportOptions().scope ?? 'auto',
  );
  protected readonly csvSeparator = computed(() => this.exportOptions().csvSeparator ?? ',');
  protected readonly csvFormulaPolicy = computed<NeuTableCsvFormulaPolicy>(
    () => this.exportOptions().csvFormulaPolicy ?? 'escape',
  );
  protected readonly exportValue = computed<NeuTableExportValue<T> | undefined>(
    () => this.exportOptions().value,
  );
  protected readonly exportCsvTitle = computed(() => this.exportOptions().csvTitle ?? 'Export CSV');
  protected readonly exportJsonTitle = computed(
    () => this.exportOptions().jsonTitle ?? 'Export JSON',
  );
  protected readonly exportXlsxTitle = computed(
    () => this.exportOptions().xlsxTitle ?? 'Export XLSX',
  );

  protected readonly useUrlState = computed(() => this._urlStateOptions().enabled);
  protected readonly pageParam = computed(() => this._urlStateOptions().pageParam);
  protected readonly searchParam = computed(() => this._urlStateOptions().searchParam);
  protected readonly sortParam = computed(() => this._urlStateOptions().sortParam);
  protected readonly sortDirParam = computed(() => this._urlStateOptions().sortDirectionParam);
  protected readonly multiSortParam = computed(() => this._urlStateOptions().multiSortParam);
  readonly sortable = input<boolean>(false);
  readonly defaultSortOrder = input<1 | -1>(1);
  readonly resetPageOnSort = input<boolean>(true);
  /** Opt-in asc -> desc -> unsorted cycle. The legacy two-state cycle remains the default. */
  readonly removableSort = input<boolean>(false);
  /** Presence controls the active sort slice. Empty means unsorted. */
  readonly sort = input<NeuTableSortState | undefined>(undefined);
  /** Omit to preserve the historical all-column global-search policy. */
  readonly globalFilterFields = input<readonly NeuTableGlobalFilterField<T>[] | undefined>(
    undefined,
  );
  /** Historical Neural owner. `true` preserves the original multiple-selection behavior. */
  readonly selectable = input<NeuTableSelectable>(false);
  readonly compareSelectionBy = input<NeuTableSelectionComparison>('key');
  /** Presence of this input makes only the canonical selection slice controlled. */
  readonly selection = input<NeuTableSelection<T> | undefined>(undefined);
  readonly rowSelectable = input<((row: T, index: number) => boolean) | undefined>(undefined);
  readonly selectAllScope = input<NeuTableSelectAllScope>('filtered');
  readonly selectOnRowClick = input<boolean>(true);
  readonly metaKeySelection = input<boolean>(false);
  readonly expandMode = input<NeuTableExpandMode>('none');
  /** Presence makes expanded row keys consumer-authoritative. */
  readonly expandedRowKeys = input<readonly unknown[] | undefined>(undefined);
  readonly pageSizeOptions = input<number[]>([]);
  readonly paginatorPosition = input<NeuTablePaginatorPosition>('bottom');
  readonly stickyHeader = input<boolean>(false);
  /** Fixed CSS max-height or `flex` for parent-driven vertical scrolling. */
  readonly scrollHeight = input<string | undefined>(undefined);
  readonly virtualScroll = input<boolean>(false);
  readonly resizableColumns = input<boolean>(false);
  readonly columnResizeMode = input<NeuTableColumnResizeMode>('fit');
  readonly reorderableColumns = input<boolean>(false);
  readonly reorderableRows = input<boolean>(false);
  readonly rowReorderable = input<((row: T, index: number) => boolean) | undefined>(undefined);
  readonly contextMenu = input<NeuContextMenuDirective | null>(null);
  readonly contextMenuRowDisabled = input<((row: T, index: number) => boolean) | undefined>(
    undefined,
  );
  /** Presence makes the transient context-menu row selection consumer-authoritative. */
  readonly contextMenuSelection = input<T | null | undefined>(undefined);
  readonly columnChooser = input<boolean>(false);
  readonly groupBy = input<NeuTableGroupBy<T> | ''>('');
  readonly rowGroupMode = input<NeuTableRowGroupMode>('subheader');
  readonly groupRowsByOrder = input<NeuTableGroupSortOrder>(1);
  readonly expandableRowGroups = input<boolean>(false);
  readonly expandedGroupKeys = input<readonly unknown[] | undefined>(undefined);
  readonly editMode = input<NeuTableEditMode>('none');
  readonly editingRowKeys = input<readonly unknown[] | undefined>(undefined);
  readonly editingCell = input<NeuTableEditingCellState | null | undefined>(undefined);
  readonly cellEditValidator = input<
    ((event: NeuTableCellEditLifecycleEvent<T>) => NeuTableEditValidationResult) | undefined
  >(undefined);
  readonly rowEditValidator = input<
    ((event: NeuTableRowEditEvent<T>) => NeuTableEditValidationResult) | undefined
  >(undefined);
  readonly initialLayout = input<NeuTableLayout | null>(null);
  readonly rowKey = input<NeuTableRowKey<T>>('id' as NeuTableRowKey<T>);
  /** Render-only tracking hook equivalent to Prime's rowTrackBy callback. */
  readonly rowTrackBy = input<NeuTableRowTrackBy<T> | undefined>(undefined);
  readonly bordered = input<boolean>(true);
  readonly roundedBorders = input<boolean>(true);
  readonly stripedRows = input<boolean>(false);

  // ── Inputs nuevos v1.3.0 ──────────────────────────────────────────────
  readonly density = input<'compact' | 'normal' | 'relaxed'>('normal');
  readonly showRowNumbers = input<boolean>(false);
  readonly rowClass = input<((row: T) => string) | undefined>(undefined);
  readonly footerRow = input<Record<string, string | number> | undefined>(undefined);
  readonly serverSide = input<boolean>(false);
  /** Presence makes every server/query slice consumer-authoritative. */
  readonly query = input<NeuTableQueryState | undefined>(undefined);
  /** Opt-in one-time initial server/query event after initial inputs and URL restore. */
  readonly lazyLoadOnInit = input<boolean>(false);
  readonly totalItems = input<number | undefined>(undefined);
  /** Logical index of data[0]. Presence opts server virtual scrolling into sparse mode. */
  readonly dataFirst = input<number | undefined>(undefined);
  readonly multiSort = input<boolean>(false);
  readonly selectionActions = input<readonly NeuTableSelectionAction<T>[]>([]);

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
  /** @deprecated Prefer the canonical aggregate `queryChange`. Retained until a future major. */
  readonly serverStateChange = output<NeuTableServerState>();
  /** One immutable canonical proposal per semantic query action. */
  readonly queryChange = output<NeuTableQueryState>();
  /** Atomic fetch trigger for server-backed sparse virtual scrolling. */
  readonly lazyRequest = output<NeuTableLazyRequest>();
  readonly searchChange = output<string>();
  /** One immutable canonical snapshot per user sort action. */
  readonly sortChange = output<NeuTableSortState>();
  readonly columnResize = output<NeuTableColumnResizeEvent>();
  readonly columnReorder = output<NeuTableColumnReorderEvent>();
  readonly rowReorder = output<NeuTableRowReorderEvent<T>>();
  readonly contextMenuSelectionChange = output<T | null>();
  readonly contextMenuSelect = output<NeuTableContextMenuSelectEvent<T>>();
  readonly virtualScrollEvent = output<NeuTableVirtualScrollEvent>();
  readonly layoutChange = output<NeuTableLayout>();
  readonly cellEditCommit = output<NeuTableCellEditEvent<T>>();
  readonly cellEditInit = output<NeuTableCellEditLifecycleEvent<T>>();
  readonly cellEditCancel = output<NeuTableCellEditLifecycleEvent<T>>();
  readonly editValidationError = output<NeuTableEditValidationEvent<T>>();
  readonly editingRowKeysChange = output<readonly unknown[]>();
  readonly editingCellChange = output<NeuTableEditingCellState | null>();
  readonly rowEditInit = output<NeuTableRowEditEvent<T>>();
  readonly rowEditSave = output<NeuTableRowEditEvent<T>>();
  readonly rowEditCancel = output<NeuTableRowEditEvent<T>>();
  readonly expandedGroupKeysChange = output<readonly unknown[]>();
  readonly groupExpand = output<NeuTableGroupExpansionEvent<T>>();
  readonly groupCollapse = output<NeuTableGroupExpansionEvent<T>>();
  readonly stateSave = output<NeuTableStateSnapshot>();
  readonly stateRestore = output<NeuTableStateSnapshot>();
  readonly pageChange = output<NeuTablePageEvent>();

  // ── Canonical consumer-relevant state ─────────────────────────────────
  private readonly _columnWidths = computed(() => this._state.layout().columnWidths);
  private readonly _columnOrder = this._state.createColumnOrderFacade();
  private readonly _hiddenColumns = computed(
    () => new Set<string>(this._state.layout().hiddenColumns),
  );
  readonly columnChooserOpen = signal(false);
  private readonly _editingRevision = signal(0);
  private _resizeCleanup: (() => void) | null = null;
  private readonly _layoutController = new NeuTableLayoutController();
  private readonly _columnHeaderInteractions: NeuTableColumnHeaderInteractions = Object.freeze({
    width: (key: string) => {
      const column = this._currentTypedColumn(key);
      return column ? this.columnWidth(column) : null;
    },
    resizable: (key: string) => {
      const column = this._currentTypedColumn(key);
      return column ? this.isColumnResizable(column) : false;
    },
    draggable: (key: string) => {
      const column = this._currentTypedColumn(key);
      return column ? this.isColumnDraggable(column) : false;
    },
    pointerDown: (key: string, event: PointerEvent) => {
      const column = this._currentTypedColumn(key);
      if (column) this.onColumnPointerDown(column, event);
    },
    resizeStart: (key: string, event: PointerEvent) => {
      const column = this._currentTypedColumn(key);
      if (column) this.startColumnResize(column, event);
    },
    resetWidth: (key: string, event?: Event) => this.resetColumnWidth(key, event),
    dragStart: (key: string, event: DragEvent) => {
      const column = this._currentTypedColumn(key);
      if (column) this.onColumnDragStart(column, event);
    },
    dragOver: (key: string, event: DragEvent) => {
      const column = this._currentTypedColumn(key);
      if (column) this.onColumnDragOver(column, event);
    },
    drop: (key: string, event: DragEvent) => {
      const column = this._currentTypedColumn(key);
      if (column) this.onColumnDrop(column, event);
    },
    dragEnd: (key: string) => {
      const column = this._currentTypedColumn(key);
      if (column) this.onColumnDragEnd(column);
    },
  });
  private readonly _reorderController = new NeuTableReorderController<NeuTableRuntimeRow<T>>();
  protected readonly _draggedColumnKey = signal<string | null>(null);
  protected readonly _columnDropTarget = signal<Readonly<{
    key: string;
    placement: 'before' | 'after';
  }> | null>(null);
  private readonly _suppressColumnClickKey = signal<string | null>(null);
  protected readonly _armedRowKey = signal<unknown | null>(null);
  protected readonly _draggedRowKey = signal<unknown | null>(null);
  protected readonly _rowDropTarget = signal<Readonly<{
    key: unknown;
    placement: 'before' | 'after';
  }> | null>(null);
  protected readonly _contextMenuKey = signal<unknown | null>(null);

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
  protected readonly _sortEntries = computed<NeuTableSortEntry[]>(() =>
    this.multiSort() ? [...this._state.sortEntries()] : [],
  );
  private readonly _appliedFilters = this._state.createFiltersFacade();
  private readonly _columnFilters = this._createLegacyColumnFiltersFacade();
  protected readonly _pageSizeControl = new FormControl('', { nonNullable: true });
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
  protected readonly _hasFilterableCol = computed(() =>
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
  protected readonly exactMatchLabel = computed(() => this._advancedFilterText().exactMatch);
  protected readonly clearFilterLabel = computed(() => this._advancedFilterText().clear);
  protected readonly filterPlaceholder = computed(() => this._advancedFilterText().placeholder);
  protected readonly filterAriaPrefix = computed(() => this._advancedFilterText().ariaPrefix);
  protected readonly filterFromLabel = computed(() => this._advancedFilterText().from);
  protected readonly filterToLabel = computed(() => this._advancedFilterText().to);
  protected readonly filterTrueLabel = computed(() => this._advancedFilterText().yes);
  protected readonly filterFalseLabel = computed(() => this._advancedFilterText().no);
  protected readonly allFilterOptionLabel = computed(() => this._advancedFilterText().all);
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
  protected _filterOpts(col: NeuTableColumn<T>): NeuSelectOption[] {
    return [
      { label: this.allFilterOptionLabel(), value: '' },
      ...(col.filterOptions ?? []).map((o) => ({ label: o, value: o })),
    ];
  }

  protected readonly _pageSizeOptions = computed<NeuSelectOption[]>(() =>
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
  private readonly _virtualRetentionRevision = signal(0);
  private readonly _measuredViewportHeight = signal(0);
  private readonly _measuredHeaderHeight = signal(0);
  private readonly _frozenStackOffsets = signal<ReadonlyMap<string, number>>(new Map());
  private _pendingViewportBinding = false;

  constructor() {
    const managedRowAdapter: NeuTableManagedRowAdapter<T> = {
      state: (entry) => this._managedRowState(entry),
      pointerDown: (entry, event) => this.onRowPointerDown(entry.row, entry.frozen, event),
      dragStart: (entry, event) => this.onRowDragStart(entry.row, entry.frozen, event),
      dragOver: (entry, event) => this.onRowDragOver(entry.row, entry.frozen, event),
      drop: (entry, event) => this.onRowDrop(entry.row, entry.frozen, event),
      dragEnd: (event) => this.onRowDragEnd(event),
      contextMenu: (entry, event) => this.onRowContextMenu(entry.row, entry.logicalIndex, event),
      click: (entry, event) => this.onRowClick(entry.row, event),
      doubleClick: (entry) => this.rowDblClick.emit(entry.row),
      focus: (entry, event) => this.onRowFocus(entry.row, event),
      keydown: (entry, event) => this.onRowKeydown(entry.row, event),
    };
    this._managedRowCoordinator.connect(managedRowAdapter);
    afterNextRender(() => this._browserEnhancementsReady.set(true));
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
      this._filterScheduler.cancel();
      this._viewportController.disconnect();
      this._managedRowCoordinator.disconnect();
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
      this.compareSelectionBy();
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
      const controlled = this.editingRowKeys();
      untracked(() => {
        if (controlled === undefined) {
          this._state.releaseControlledEditing();
          return;
        }
        this._state.setControlledEditingKeys(new Set(controlled));
        this._editingController.prune(this._state.editingKeys());
        this._editingRevision.update((value) => value + 1);
      });
    });

    effect(() => {
      const controlled = this.editingCell();
      untracked(() => {
        if (controlled === undefined) {
          this._state.releaseControlledEditingCell();
          return;
        }
        this._state.setControlledEditingCell(controlled);
        this._editingRevision.update((value) => value + 1);
      });
    });

    effect(() => {
      const editing = this._state.editingCell();
      if (!editing) return;
      this._typedColumns();
      untracked(() => this._scheduleEditorFocus(editing.columnKey));
    });

    effect(() => {
      const controlled = this.expandedGroupKeys();
      untracked(() => {
        if (controlled === undefined) {
          this._state.releaseControlledGroupExpansion();
          return;
        }
        const changed = this._state.setControlledGroupExpansionKeys(new Set(controlled));
        if (changed) this._saveStateIfReady();
      });
    });

    effect(() => {
      const controlled = this.contextMenuSelection();
      this.rowKey();
      untracked(() => {
        if (controlled === undefined) return;
        this._contextMenuKey.set(controlled === null ? null : this.getRowKey(controlled));
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
      if (!this._browserEnhancementsReady()) return;
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

    effect(() => {
      this.scrollHeight();
      this.virtualScrollAutoSize();
      this.stickyHeader();
      this.renderedPageEntries();
      this.headerGroupTemplate();
      this._hasFilterableCol();
      untracked(() => this._scheduleViewportBinding());
    });

    let retentionQueryInitialized = false;
    effect(() => {
      const appendOnly = this.virtualScrollAppendOnly();
      this.currentPage();
      this.searchQuery();
      this.currentSort();
      this._appliedFilters();
      untracked(() => {
        if (!appendOnly || retentionQueryInitialized) {
          if (this._virtualRetention.reset()) {
            this._virtualRetentionRevision.update((value) => value + 1);
          }
        }
        retentionQueryInitialized = true;
      });
    });

    effect(() => {
      const active = this._appendOnlyActive();
      const range = this._virtualRange();
      const total = this._logicalTotalItems();
      const dataFirst = this._lazyVirtualActive() ? this.dataFirst() : undefined;
      const rows = this._lazyVirtualActive() ? this._rows() : [];
      untracked(() => {
        if (!active) return;
        if (this._virtualRetention.include(range, total, dataFirst, rows)) {
          this._virtualRetentionRevision.update((value) => value + 1);
        }
      });
    });

    let previousLazyViewport: {
      total: number;
      itemSize: number;
      visibleItems: number;
      overscan: number;
      step: number | undefined;
    } | null = null;
    effect(() => {
      const active = this._lazyVirtualActive();
      const total = this._logicalTotalItems();
      const itemSize = this._virtualItemSize();
      const visibleItems = this._virtualVisibleItems();
      const overscan = this._virtualOverscan();
      const step = this.virtualScrollStep();
      untracked(() => {
        if (!active) {
          previousLazyViewport = null;
          this._lazyDataController.forgetRange();
          return;
        }

        const previous = previousLazyViewport;
        previousLazyViewport = { total, itemSize, visibleItems, overscan, step };
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
          previous.overscan !== overscan ||
          previous.step !== step
        ) {
          this._cancelPendingVirtualScroll();
          this._emitLazyRequest('viewport-change');
        }
      });
    });

    effect(() => {
      const editing = this._state.editingCell();
      const rows = this._identityRows();
      if (!editing || !this._lazyVirtualActive()) return;
      if (rows.some((row) => Object.is(this.getRowKey(row), editing.rowKey))) return;
      untracked(() => this.cancelCellEdit());
    });

    effect(() => {
      const keys = this._navigableRows().map((row) => this.getRowKey(row));
      const selected = new Set(
        this._resolveSelection(this._selectedKeys()).map((row) => this.getRowKey(row)),
      );
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
      const browserEnhancementsReady = this._browserEnhancementsReady();
      const state = this._state.snapshot();
      this._queryConfig();
      untracked(() => {
        if (isPlatformBrowser(this._platformId) && !browserEnhancementsReady) return;
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
    return neuTableAdvancedFilterModes(column).map((mode) => ({
      label: text[mode as keyof typeof text] ?? mode,
      value: mode,
    }));
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
    this._advancedFilter.initialize(
      column,
      this._appliedFilters()[column.key] as Parameters<
        NeuTableAdvancedFilterController<T>['initialize']
      >[1],
    );
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
  private readonly _frozenRows = computed<NeuTableRuntimeRow<T>[]>(
    () => [...this.frozenData()] as NeuTableRuntimeRow<T>[],
  );
  private readonly _identityRows = computed<NeuTableRuntimeRow<T>[]>(() => [
    ...this._frozenRows(),
    ...this._rows(),
  ]);
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
    this._filterRegistry.revision();
    if (this.serverSide()) return this._rows();
    const rows = this._rows();
    const globalFields = this._resolvedGlobalFilterFields();
    const activeColumnFilters = this._resolvedAppliedFilters();
    const q = this.searchQuery().trim().toLocaleLowerCase(this.filterLocale());
    const exact = this._exactMatch();
    const matches = (text: string) =>
      exact
        ? text.toLocaleLowerCase(this.filterLocale()) === q
        : text.toLocaleLowerCase(this.filterLocale()).includes(q);
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
    const sorted = this.sortable()
      ? (this._sortController.sort(
          data,
          this.currentSort(),
          this._typedColumns(),
        ) as NeuTableRuntimeRow<T>[])
      : [...data];
    const groupKey = this.groupBy();
    return groupKey
      ? this._groupingController.order(
          sorted,
          (row, index) => this._groupValue(row, index),
          this.groupRowsByOrder(),
        )
      : sorted;
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
  protected readonly _lazyVirtualActive = computed(
    () =>
      this.serverSide() &&
      this.virtualScroll() &&
      this.dataFirst() !== undefined &&
      this.totalItems() !== undefined,
  );

  private readonly _logicalTotalItems = computed(() =>
    this._lazyVirtualActive()
      ? this._lazyDataController.total(this.totalItems())
      : this.filteredData().length,
  );

  protected readonly _tableEmpty = computed(
    () => this._logicalTotalItems() === 0 && this._frozenRows().length === 0,
  );

  private readonly _virtualRowHeight = computed(() => {
    switch (this.density()) {
      case 'compact':
        return 34;
      case 'relaxed':
        return 64;
      default:
        return 48;
    }
  });

  protected readonly _virtualItemSize = computed(() =>
    this._lazyDataController.itemSize(this.virtualScrollItemSize(), this._virtualRowHeight()),
  );

  private readonly _virtualVisibleItems = computed(() => {
    const configured = Math.max(1, Math.floor(this.virtualScrollVisibleItems()) || 1);
    if (!this.virtualScrollAutoSize() && this.scrollHeight() !== 'flex') return configured;
    const available = this._measuredViewportHeight() - this._virtualHeaderHeight();
    return available > 0 ? Math.max(1, Math.ceil(available / this._virtualItemSize())) : configured;
  });

  private readonly _virtualOverscan = computed(() =>
    Math.max(0, Math.floor(this.virtualScrollOverscan()) || 0),
  );

  private readonly _virtualDelay = computed(() => Math.max(0, Math.floor(this.virtualScrollDelay()) || 0));

  private readonly _virtualHeaderHeight = computed(
    () => this._measuredHeaderHeight() || 44 + (this._hasFilterableCol() ? 52 : 0),
  );

  protected readonly _virtualScrollActive = computed(
    () =>
      this.virtualScroll() &&
      (this._lazyVirtualActive() || this.paginatedData().length > this._virtualVisibleItems()),
  );

  private readonly _appendOnlyActive = computed(
    () => this.virtualScrollAppendOnly() && this._virtualScrollActive() && !this.groupBy(),
  );

  readonly virtualContainerMaxHeight = computed(
    () =>
      `${this._virtualHeaderHeight() + this._virtualVisibleItems() * this._virtualItemSize()}px`,
  );

  protected readonly _verticalScrollEnabled = computed(
    () =>
      this.stickyHeader() || Boolean(this.scrollHeight()?.trim()) || this._virtualScrollActive(),
  );

  protected readonly _scrollContainerMaxHeight = computed(() => {
    const height = this.scrollHeight()?.trim();
    if (height === 'flex') return null;
    if (height) return height;
    return this._virtualScrollActive() ? this.virtualContainerMaxHeight() : null;
  });

  private readonly _virtualRange = computed<NeuTableVirtualRange>(() =>
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

  private readonly _virtualStartIndex = computed(() => {
    if (!this._virtualScrollActive()) {
      return 0;
    }

    if (this._lazyVirtualActive()) return this._virtualRange().first;

    const bodyScrollTop = Math.max(0, this._virtualScrollTop() - this._virtualHeaderHeight());
    const startIndex = Math.floor(bodyScrollTop / this._virtualItemSize());
    return Math.max(0, startIndex - this._virtualOverscan());
  });

  private readonly _virtualEndIndex = computed(() => {
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

  private readonly _virtualSlots = computed(() =>
    this._lazyVirtualActive()
      ? this._lazyDataController.slots(this._virtualRange(), this.dataFirst()!, this._rows())
      : Object.freeze([] as NeuTableVirtualSlot<NeuTableRuntimeRow<T>>[]),
  );

  protected readonly _expansionEnabled = computed(
    () =>
      this.expandMode() !== 'none' && (!this._lazyVirtualActive() || this._frozenRows().length > 0),
  );

  protected _rowExpansionEnabled(frozen: boolean): boolean {
    return this.expandMode() !== 'none' && (frozen || !this._lazyVirtualActive());
  }

  private readonly _navigableRows = computed<NeuTableRuntimeRow<T>[]>(() => {
    if (!this.selectionEnabled() && !this.contextMenu()) return [];
    return [...this._frozenRows(), ...this.visiblePageRows()].filter(
      (row) => !this.selectionEnabled() || this.isRowSelectable(row),
    );
  });

  readonly visibleGroups = computed<InternalNeuTableGroup<NeuTableRuntimeRow<T>>[]>(() => {
    const groupKey = this.groupBy();
    if (!groupKey || this._lazyVirtualActive()) return [];
    return this._groupingController.groups(
      this.visiblePageRows(),
      (row, index) => this._groupValue(row, index),
      this._state.groupExpansionKeys(),
    );
  });

  readonly frozenGroups = computed<InternalNeuTableGroup<NeuTableRuntimeRow<T>>[]>(() => {
    const groupKey = this.groupBy();
    if (!groupKey) return [];
    return this._groupingController.groups(
      this._frozenRows(),
      (row, index) => this._groupValue(row, index),
      this._state.groupExpansionKeys(),
    );
  });

  readonly visiblePageEntries = computed<NeuTablePageEntry<T>[]>(() => {
    if (this._lazyVirtualActive()) {
      return this._virtualSlots().map((slot) =>
        slot.kind === 'placeholder'
          ? {
              kind: 'placeholder' as const,
              key: `placeholder:${slot.logicalIndex}`,
              logicalIndex: slot.logicalIndex,
              frozen: false as const,
            }
          : {
              kind: 'row' as const,
              key: this.getRowKey(slot.row),
              row: slot.row,
              rowIndex: slot.logicalIndex - this._virtualRange().first,
              logicalIndex: slot.logicalIndex,
              frozen: false,
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
        frozen: false,
      }));
    }

    const entries: NeuTablePageEntry<T>[] = [];
    const groups = this.visibleGroups();
    const baseIndex =
      (this.pagination() ? (this.currentPage() - 1) * this.effectivePageSize() : 0) +
      this._virtualStartIndex();
    for (const group of groups) {
      if (this.rowGroupMode() === 'subheader') {
        entries.push({
          kind: 'group',
          key: `group-header:${String(group.key)}:${group.groupIndex}`,
          label: group.label,
          count: group.count,
          group,
          frozen: false,
        });
      }
      if (
        !this.expandableRowGroups() ||
        group.expanded ||
        this.rowGroupMode() === 'rowspan' ||
        this._virtualScrollActive()
      ) {
        group.rows.forEach((row, offset) => {
          const rowIndex = group.firstRowIndex + offset;
          entries.push({
            kind: 'row',
            key: this.getRowKey(row),
            row,
            rowIndex,
            logicalIndex: baseIndex + rowIndex,
            frozen: false,
          });
        });
        if (
          this.rowGroupMode() === 'subheader' &&
          (this.groupFooterTemplate() || this.bodySectionTemplate())
        ) {
          entries.push({
            kind: 'group-footer',
            key: `group-footer:${String(group.key)}:${group.groupIndex}`,
            group,
            frozen: false,
          });
        }
      }
    }
    return entries;
  });

  readonly frozenPageEntries = computed<NeuTablePageEntry<T>[]>(() => {
    const rows = this._frozenRows();
    const groupKey = this.groupBy();
    if (!groupKey) {
      return rows.map((row, rowIndex) => ({
        kind: 'row' as const,
        key: `frozen:${String(this.getRowKey(row))}`,
        row,
        rowIndex,
        logicalIndex: rowIndex,
        frozen: true,
      }));
    }

    const entries: NeuTablePageEntry<T>[] = [];
    for (const group of this.frozenGroups()) {
      if (this.rowGroupMode() === 'subheader') {
        entries.push({
          kind: 'group',
          key: `frozen-group-header:${String(group.key)}:${group.groupIndex}`,
          label: group.label,
          count: group.count,
          group,
          frozen: true,
        });
      }
      if (!this.expandableRowGroups() || group.expanded || this.rowGroupMode() === 'rowspan') {
        group.rows.forEach((row, offset) => {
          const rowIndex = group.firstRowIndex + offset;
          entries.push({
            kind: 'row',
            key: `frozen:${String(this.getRowKey(row))}`,
            row,
            rowIndex,
            logicalIndex: rowIndex,
            frozen: true,
          });
        });
        if (
          this.rowGroupMode() === 'subheader' &&
          (this.groupFooterTemplate() || this.bodySectionTemplate())
        ) {
          entries.push({
            kind: 'group-footer',
            key: `frozen-group-footer:${String(group.key)}:${group.groupIndex}`,
            group,
            frozen: true,
          });
        }
      }
    }
    return entries;
  });

  private readonly _virtualTopSpacerHeight = computed(() => {
    if (!this._virtualScrollActive()) {
      return 0;
    }

    return this._virtualStartIndex() * this._virtualItemSize();
  });

  private readonly _virtualBottomSpacerHeight = computed(() => {
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

  readonly renderedPageEntries = computed<NeuTablePageEntry<T>[]>(() => {
    const entries: NeuTablePageEntry<T>[] = [...this.frozenPageEntries()];
    if (this._appendOnlyActive()) {
      entries.push(...this._retainedPageEntries());
      return entries;
    }
    const top = this._virtualTopSpacerHeight();
    const bottom = this._virtualBottomSpacerHeight();
    if (top > 0) entries.push({ kind: 'spacer', key: 'spacer:top', height: top, position: 'top' });
    entries.push(...this.visiblePageEntries());
    if (bottom > 0) {
      entries.push({ kind: 'spacer', key: 'spacer:bottom', height: bottom, position: 'bottom' });
    }
    return entries;
  });

  private readonly _retainedPageEntries = computed<NeuTablePageEntry<T>[]>(() => {
    this._virtualRetentionRevision();
    const total = this._logicalTotalItems();
    const itemSize = this._virtualItemSize();
    const rows = this.paginatedData();
    const sparse = this._lazyVirtualActive();
    const pageBase = this.pagination() ? (this.currentPage() - 1) * this.effectivePageSize() : 0;
    const entries: NeuTablePageEntry<T>[] = [];
    let cursor = 0;
    for (const interval of this._virtualRetention.intervals()) {
      if (interval.first > cursor) {
        entries.push({
          kind: 'spacer',
          key: `spacer:retained:${cursor}:${interval.first}`,
          height: (interval.first - cursor) * itemSize,
          position: cursor === 0 ? 'top' : 'bottom',
        });
      }
      for (let logicalIndex = interval.first; logicalIndex < interval.end; logicalIndex++) {
        const row = sparse ? this._virtualRetention.row(logicalIndex) : rows[logicalIndex];
        if (row) {
          entries.push({
            kind: 'row',
            key: this.getRowKey(row),
            row,
            rowIndex: logicalIndex,
            logicalIndex: sparse ? logicalIndex : pageBase + logicalIndex,
            frozen: false,
          });
        } else {
          entries.push({
            kind: 'placeholder',
            key: `placeholder:retained:${logicalIndex}`,
            logicalIndex,
            frozen: false,
          });
        }
      }
      cursor = interval.end;
    }
    if (cursor < total) {
      entries.push({
        kind: 'spacer',
        key: `spacer:retained:${cursor}:${total}`,
        height: (total - cursor) * itemSize,
        position: 'bottom',
      });
    }
    return entries;
  });

  private readonly _paginatorEvent = computed(() =>
    this._paginatorController.event({
      page: this.currentPage(),
      pageSize: this.effectivePageSize(),
      totalRecords: this.serverSide() ? (this.totalItems() ?? 0) : this.filteredData().length,
    }),
  );

  readonly pageNumbers = computed(() =>
    this._paginatorController.pages(
      {
        page: this.currentPage(),
        pageSize: this.effectivePageSize(),
        totalRecords: this._paginatorEvent().totalRecords,
      },
      this.pageLinkSize(),
    ),
  );

  private readonly _jumpPageOptions = computed<NeuSelectOption[]>(() =>
    Array.from({ length: this.totalPages() }, (_, index) => ({
      label: String(index + 1),
      value: String(index + 1),
    })),
  );
  readonly pageNumbersAll = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  readonly paginationInfo = computed(() => {
    const event = this._paginatorEvent();
    const template = this.currentPageReportTemplate();
    if (template !== undefined) {
      return this._paginatorController.report(
        {
          page: event.page,
          pageSize: event.rows,
          totalRecords: event.totalRecords,
        },
        template,
      );
    }
    const from = event.totalRecords === 0 ? 0 : event.first + 1;
    return `${from}-${event.last} ${this.ofLabel()} ${event.totalRecords} ${
      event.totalRecords === 1 ? this.resultLabelSingular() : this.resultLabelPlural()
    }`;
  });

  readonly totalColspan = computed(() => {
    let cols = this.visibleColumns().length;
    if (this.selectionEnabled()) cols++;
    if (this._expansionEnabled()) cols++;
    if (this.showRowNumbers()) cols++;
    if (this.reorderableRows()) cols++;
    return cols;
  });

  protected readonly _ariaHeaderRowCount = computed(() => (this._hasFilterableCol() ? 2 : 1));

  /**
   * Native tables already expose complete row coordinates. Explicit ARIA is
   * reserved for the incomplete virtual DOM where logical rows are absent.
   * Custom grouped headers opt out because their row count is consumer-owned.
   */
  protected readonly _ariaCoordinatesActive = computed(
    () => (this._virtualScrollActive() || this._lazyVirtualActive()) && !this.headerGroupTemplate(),
  );

  protected readonly _ariaRowCount = computed<number | null>(() =>
    this._ariaCoordinatesActive()
      ? this._ariaHeaderRowCount() + this._frozenRows().length + this._logicalTotalItems()
      : null,
  );

  protected bodyAriaRowIndex(entry: Extract<NeuTablePageEntry<T>, { kind: 'row' }>): number | null {
    if (!this._ariaCoordinatesActive()) return null;
    return (
      this._ariaHeaderRowCount() +
      1 +
      (entry.frozen ? entry.logicalIndex : this._frozenRows().length + entry.logicalIndex)
    );
  }

  protected frozenRowTop(stackKey: string): number {
    return this._frozenStackOffsets().get(stackKey) ?? this._virtualHeaderHeight();
  }

  protected readonly _frozenLeftOffsets = computed(() => {
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

  private readonly _lastFrozenLeftKey = computed(() => {
    const frozenLeft = this.visibleColumns().filter((col) => col.frozen === 'left');
    return frozenLeft.at(-1)?.key ?? null;
  });

  private readonly _firstFrozenRightKey = computed(() => {
    const frozenRight = this.visibleColumns().filter((col) => col.frozen === 'right');
    return frozenRight[0]?.key ?? null;
  });

  protected isLastFrozenLeftColumn(key: string): boolean {
    return this._lastFrozenLeftKey() === key;
  }

  protected isFirstFrozenRightColumn(key: string): boolean {
    return this._firstFrozenRightKey() === key;
  }

  protected toggleColumnChooser(): void {
    this.columnChooserOpen.update((value) => !value);
  }

  protected isColumnVisible(key: string): boolean {
    return !this._hiddenColumns().has(key);
  }

  protected toggleColumnVisibility(key: string): void {
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

  private isFirstVisibleColumn(key: string): boolean {
    return this.visibleColumns()[0]?.key === key;
  }

  private isLastVisibleColumn(key: string): boolean {
    return this.visibleColumns().at(-1)?.key === key;
  }

  protected canMoveColumn(key: string, direction: -1 | 1): boolean {
    const columns = this.visibleColumns().map((column) => this.asRuntimeColumn(column));
    const index = columns.findIndex((column) => column.key === key);
    const target = columns[index + direction];
    return index >= 0 && !!target && columns[index]!.frozen === target.frozen;
  }

  protected moveColumn(key: string, direction: -1 | 1): void {
    const columns = this._columnMetrics();
    const previousIndex = columns.findIndex((column) => column.key === key);
    const target = columns[previousIndex + direction];
    if (!target) return;
    const result = this._layoutController.reorder(
      columns,
      key,
      target.key,
      direction === -1 ? 'before' : 'after',
    );
    if (result) this._commitColumnReorder(result);
  }

  private _columnMetrics(): InternalNeuTableColumnMetric[] {
    return this.visibleColumns().map((input) => {
      const column = this.asRuntimeColumn(input);
      const escapedKey =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
          ? CSS.escape(column.key)
          : column.key.replace(/["\\]/g, '\\$&');
      const header = isPlatformBrowser(this._platformId)
        ? (this._elementRef.nativeElement.querySelector(
            `[data-neu-table-column-key="${escapedKey}"]`,
          ) as HTMLElement | null)
        : null;
      const measured = header?.getBoundingClientRect().width ?? 0;
      return {
        key: column.key,
        width: Math.round(measured || this._columnWidthPx(column) || 160),
        minWidth: column.minWidth ?? 96,
        maxWidth: column.maxWidth ?? Number.POSITIVE_INFINITY,
        frozen: column.frozen ?? null,
      };
    });
  }

  private _commitColumnReorder(result: InternalNeuTableColumnReorderResult): void {
    const changed = this._state.setLayout(
      { ...this._state.layout(), columnOrder: [...result.order] },
      'ui',
    );
    if (!changed) return;
    this.columnReorder.emit({
      columnKey: result.key,
      previousIndex: result.previousIndex,
      currentIndex: result.currentIndex,
      columns: Object.freeze([...result.order]),
    });
    this._emitLayoutChange();
  }

  protected isColumnDraggable(col: NeuTableColumnInput<T>): boolean {
    const column = this.asRuntimeColumn(col);
    return this.reorderableColumns() && column.reorderable !== false;
  }

  protected onColumnPointerDown(col: NeuTableColumnInput<T>, event: PointerEvent): void {
    if ((event.target as Element | null)?.closest('.neu-table__resize-handle')) return;
    this._suppressColumnClickKey.set(null);
  }

  protected onColumnDragStart(col: NeuTableColumnInput<T>, event: DragEvent): void {
    if (!this.isColumnDraggable(col) || this._eventOriginatesFromInteractiveDescendant(event)) {
      event.preventDefault();
      return;
    }
    const key = this.asRuntimeColumn(col).key;
    this._draggedColumnKey.set(key);
    event.dataTransfer?.setData('text/plain', key);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  protected onColumnDragOver(col: NeuTableColumnInput<T>, event: DragEvent): void {
    const draggedKey = this._draggedColumnKey();
    const target = this.asRuntimeColumn(col);
    if (!draggedKey || draggedKey === target.key) return;
    const dragged = this._currentTypedColumn(draggedKey);
    if (!dragged || dragged.frozen !== target.frozen) return;
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const rtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl';
    const after = rtl
      ? event.clientX < rect.left + rect.width / 2
      : event.clientX > rect.left + rect.width / 2;
    this._columnDropTarget.set({ key: target.key, placement: after ? 'after' : 'before' });
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  protected onColumnDrop(col: NeuTableColumnInput<T>, event: DragEvent): void {
    const draggedKey = this._draggedColumnKey();
    const targetKey = this.asRuntimeColumn(col).key;
    const placement = this._columnDropTarget()?.placement ?? 'before';
    if (!draggedKey) return;
    event.preventDefault();
    event.stopPropagation();
    const result = this._layoutController.reorder(
      this._columnMetrics(),
      draggedKey,
      targetKey,
      placement,
    );
    if (result) this._commitColumnReorder(result);
    this.onColumnDragEnd(this._currentTypedColumn(draggedKey) ?? col);
  }

  protected onColumnDragEnd(col: NeuTableColumnInput<T>): void {
    this._suppressColumnClickKey.set(this.asRuntimeColumn(col).key);
    this._draggedColumnKey.set(null);
    this._columnDropTarget.set(null);
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

  protected isColumnResizable(col: NeuTableColumnInput<T>): boolean {
    const typedColumn = this.asRuntimeColumn(col);
    if (!this.resizableColumns() || typedColumn.resizable === false) return false;
    return this.columnResizeMode() === 'expand' || !this.isLastVisibleColumn(typedColumn.key);
  }

  protected columnWidth(col: NeuTableColumnInput<T>): string | null {
    const typedColumn = this.asRuntimeColumn(col);
    const resized = this._columnWidths()[typedColumn.key];
    if (resized != null) {
      return `${resized}px`;
    }

    return typedColumn.width ?? null;
  }

  protected startColumnResize(col: NeuTableColumnInput<T>, event: MouseEvent | PointerEvent): void {
    if (!this.isColumnResizable(col) || !isPlatformBrowser(this._platformId)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const headerCell = (event.currentTarget as HTMLElement | null)?.closest('th');
    const columns = this._columnMetrics();
    const startX = event.clientX;
    const typedColumn = this.asRuntimeColumn(col);
    const rtl =
      headerCell instanceof HTMLElement && getComputedStyle(headerCell).direction === 'rtl';
    const baseWidths = { ...this._columnWidths() };
    let latest: ReturnType<NeuTableLayoutController['resize']> = null;

    this._stopColumnResize();

    const onMove = (moveEvent: PointerEvent) => {
      latest = this._layoutController.resize(
        columns,
        typedColumn.key,
        (moveEvent.clientX - startX) * (rtl ? -1 : 1),
        this.columnResizeMode(),
      );
      if (!latest) return;
      this._state.setLayout(
        {
          ...this._state.layout(),
          columnWidths: { ...baseWidths, ...latest.widths },
        },
        'ui',
      );
    };

    const onUp = () => {
      if (latest) {
        const layout = this.currentLayout();
        this.columnResize.emit({
          key: latest.key,
          width: latest.width,
          delta: latest.delta,
          mode: this.columnResizeMode(),
          adjacentKey: latest.adjacentKey,
          adjacentWidth: latest.adjacentWidth,
          layout: Object.freeze({
            columnOrder: Object.freeze([...layout.columnOrder]) as unknown as string[],
            hiddenColumns: Object.freeze([...layout.hiddenColumns]) as unknown as string[],
            columnWidths: Object.freeze({ ...layout.columnWidths }),
          }),
        });
        this._emitLayoutChange();
      }
      this._stopColumnResize();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    this._resizeCleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      this._resizeCleanup = null;
    };
  }

  protected resetColumnWidth(key: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const current = this._columnWidths();
    if (!(key in current)) return;
    const next = { ...current };
    delete next[key];
    const changed = this._state.setLayout({ ...this._state.layout(), columnWidths: next }, 'api');
    if (changed) this._emitLayoutChange();
  }

  protected canReorderRow(row: T, frozen = false): boolean {
    if (
      !this.reorderableRows() ||
      frozen ||
      this._lazyVirtualActive() ||
      this.groupBy() ||
      this.currentSort().length > 0
    ) {
      return false;
    }
    const index = this.visiblePageRows().findIndex((candidate) =>
      Object.is(this.getRowKey(candidate), this.getRowKey(row)),
    );
    return index >= 0 && (this.rowReorderable()?.(row, index) ?? true);
  }

  protected canMoveRow(row: T, direction: -1 | 1): boolean {
    if (!this.canReorderRow(row)) return false;
    const rows = this.visiblePageRows();
    const index = rows.findIndex((candidate) =>
      Object.is(this.getRowKey(candidate), this.getRowKey(row)),
    );
    return index >= 0 && index + direction >= 0 && index + direction < rows.length;
  }

  protected moveRow(row: T, direction: -1 | 1): void {
    if (!this.canMoveRow(row, direction)) return;
    const rows = this.visiblePageRows();
    const index = rows.findIndex((candidate) =>
      Object.is(this.getRowKey(candidate), this.getRowKey(row)),
    );
    const target = rows[index + direction];
    if (!target) return;
    this._proposeRowReorder(
      this.getRowKey(row),
      this.getRowKey(target),
      direction === -1 ? 'before' : 'after',
    );
  }

  protected isRowDragArmed(row: T, frozen = false): boolean {
    return this.canReorderRow(row, frozen) && Object.is(this._armedRowKey(), this.getRowKey(row));
  }

  protected onRowPointerDown(row: T, frozen: boolean, event: PointerEvent): void {
    const target = event.target as Element | null;
    const armed =
      this.canReorderRow(row, frozen) &&
      target?.closest('[data-neu-table-row-reorder-handle="true"]') !== null;
    const rowElement = event.currentTarget as HTMLTableRowElement;
    rowElement.draggable = armed;
    this._armedRowKey.set(armed ? this.getRowKey(row) : null);
  }

  protected onRowDragStart(row: T, frozen: boolean, event: DragEvent): void {
    if (!this.isRowDragArmed(row, frozen)) {
      event.preventDefault();
      return;
    }
    const key = this.getRowKey(row);
    this._draggedRowKey.set(key);
    event.dataTransfer?.setData('text/plain', String(key));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  protected onRowDragOver(row: T, frozen: boolean, event: DragEvent): void {
    const draggedKey = this._draggedRowKey();
    if (draggedKey === null || frozen || Object.is(draggedKey, this.getRowKey(row))) return;
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const placement = event.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
    this._rowDropTarget.set({ key: this.getRowKey(row), placement });
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  protected onRowDrop(row: T, frozen: boolean, event: DragEvent): void {
    const draggedKey = this._draggedRowKey();
    if (draggedKey === null || frozen) return;
    event.preventDefault();
    event.stopPropagation();
    this._proposeRowReorder(
      draggedKey,
      this.getRowKey(row),
      this._rowDropTarget()?.placement ?? 'before',
    );
    this.onRowDragEnd(event);
  }

  protected onRowDragEnd(event?: DragEvent): void {
    if (event?.currentTarget instanceof HTMLTableRowElement) {
      event.currentTarget.draggable = false;
    }
    this._armedRowKey.set(null);
    this._draggedRowKey.set(null);
    this._rowDropTarget.set(null);
  }

  private _proposeRowReorder(
    draggedKey: unknown,
    targetKey: unknown,
    placement: 'before' | 'after',
  ): void {
    const visible = this.visiblePageRows();
    const result = this._reorderController.reorder(
      this._rows(),
      visible,
      draggedKey,
      targetKey,
      placement,
      (candidate) => this.getRowKey(candidate),
      this._rowReorderScope(),
    );
    if (!result) return;
    this.rowReorder.emit({
      row: result.row,
      key: result.key,
      previousIndex: result.previousIndex,
      currentIndex: result.currentIndex,
      previousDataIndex: result.previousDataIndex,
      currentDataIndex: result.currentDataIndex,
      scope: result.scope,
      rows: result.rows,
      visibleRows: result.visibleRows,
    });
  }

  private _rowReorderScope(): NeuTableRowReorderScope {
    if (this.serverSide()) return 'server-window';
    if (this.pagination()) return 'page';
    if (this.searchQuery() || Object.keys(this._appliedFilters()).length > 0) return 'filtered';
    return 'loaded';
  }

  // ── Expansión de filas ────────────────────────────────────────────────
  private readonly _expandedKeys = this._state.expansionKeys;

  protected isRowExpanded(row: T): boolean {
    return this._expandedKeys().has(this.getRowKey(row));
  }

  expandRow(row: T): void {
    this._proposeRowExpansion(row, true, 'api');
  }

  collapseRow(row: T): void {
    this._proposeRowExpansion(row, false, 'api');
  }

  toggleExpand(row: T): void {
    const frozen = this._frozenRows().some((candidate) =>
      Object.is(this.getRowKey(candidate), this.getRowKey(row)),
    );
    if (this._lazyVirtualActive() && !frozen) return;
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
        editingKeys: new Set(),
        editingCell: null,
        groupExpansionKeys: new Set(),
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
    if (changed.changedKeys.includes('editingKeys'))
      this.editingRowKeysChange.emit(Object.freeze([]));
    if (changed.changedKeys.includes('editingCell')) this.editingCellChange.emit(null);
    if (changed.changedKeys.includes('groupExpansionKeys')) {
      this.expandedGroupKeysChange.emit(Object.freeze([]));
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
    const selectable = this.selectable();
    if (selectable === false) return 'none';
    return selectable === true ? 'multiple' : selectable;
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
        this._identityRows(),
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
    this._withFrozenRows(
      this._selectionController.scopedRows(
        'filtered',
        this.paginatedData(),
        this.filteredData(),
        (row) => this._rowSelectableAt(row, this._logicalRowIndex(row)),
        this._rows(),
      ),
    ),
  );

  private readonly selectionScopeRows = computed(() =>
    this._withFrozenRows(
      this._selectionController.scopedRows(
        this.selectAllScope(),
        this.paginatedData(),
        this.filteredData(),
        (row) => this._rowSelectableAt(row, this._logicalRowIndex(row)),
        this._rows(),
      ),
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

  protected isRowSelected(row: T): boolean {
    return this._selectedKeys().has(this.getSelectionKey(row));
  }

  protected isRowSelectable(row: T): boolean {
    return this._rowSelectableAt(row, this._logicalRowIndex(row));
  }

  protected toggleRow(
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
        ? new Set([this.getSelectionKey(row)])
        : new Set([...current, this.getSelectionKey(row)]);
    this._applyRowSelection(row, next, 'api');
  }

  unselectRow(row: T): void {
    if (!this.isRowSelected(row)) return;
    const next = new Set(this._selectedKeys());
    next.delete(this.getSelectionKey(row));
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
      keys: rows.map((row) => this.getSelectionKey(row)),
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
      key: this.getSelectionKey(row),
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
          this._identityRows(),
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
    return this._selectionController.resolveRows(
      keys,
      this._identityRows(),
      this._suppliedSelectionRows(),
    );
  }

  private _freezeProjection(rows: T[]): T[] {
    return Object.freeze([...rows]) as unknown as T[];
  }

  private _rowSelectableAt(row: T, index: number): boolean {
    return this.rowSelectable()?.(row, index) ?? true;
  }

  private _logicalRowIndex(row: T): number {
    const frozenIndex = this._identityIndexOf(row, this._frozenRows());
    if (frozenIndex >= 0) return frozenIndex;
    const localIndex = this._identityIndexOf(row, this._rows());
    if (!this._lazyVirtualActive() || localIndex < 0) {
      return localIndex < 0 ? localIndex : this._frozenRows().length + localIndex;
    }
    return this._frozenRows().length + Math.max(0, Math.floor(this.dataFirst() ?? 0)) + localIndex;
  }

  private _withFrozenRows(rows: readonly T[]): NeuTableRuntimeRow<T>[] {
    const seen = new Set<unknown>();
    const combined: NeuTableRuntimeRow<T>[] = [];
    for (const row of [...this._frozenRows(), ...rows] as NeuTableRuntimeRow<T>[]) {
      const key = this.getSelectionKey(row);
      if (seen.has(key) || !this._rowSelectableAt(row, this._logicalRowIndex(row))) continue;
      seen.add(key);
      combined.push(row);
    }
    return combined;
  }

  // ── Navegación ────────────────────────────────────────────────────────
  goToPage(page: number): void {
    if (this._lazyVirtualActive()) return;
    if (!Number.isFinite(page)) return;
    const clamped = Math.max(1, Math.min(Math.trunc(page), this.totalPages()));
    const changed = this._state.setPage(clamped, 'ui');
    if (!changed) return;
    this._emitPageChange(changed.current.page, changed.current.pageSize);
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
      defaultOrder: this.defaultSortOrder() === -1 ? -1 : 1,
    });
    const pagePatch = this.resetPageOnSort() ? { page: 1 as const } : {};
    const changed = this._state.update(
      multiple
        ? { sortEntries: entries, ...pagePatch }
        : { sort: entries[0] ?? null, ...pagePatch },
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
      if (multiple) {
        this._urlAdapter.writeSortEntries(this._urlConfig(), snapshot, this.resetPageOnSort());
      } else {
        this._urlAdapter.writeSort(this._urlConfig(), snapshot[0] ?? null, this.resetPageOnSort());
      }
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
    if (this._suppressColumnClickKey() === key) {
      this._suppressColumnClickKey.set(null);
      return;
    }
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

  protected onRowClick(row: T, event: MouseEvent): void {
    if (this.selectionEnabled() && this.selectOnRowClick() && this.isRowSelectable(row)) {
      if (this.multipleSelection() && event.shiftKey) {
        this._applyRangeSelection(row);
      } else {
        this.toggleRow(row, 'row', event);
      }
    }
    this.rowClick.emit(row);
  }

  protected isContextMenuRow(row: T): boolean {
    return Object.is(this._contextMenuKey(), this.getRowKey(row));
  }

  protected onRowContextMenu(row: T, index: number, event: MouseEvent): void {
    const menu = this.contextMenu();
    if (!menu || this._eventOriginatesFromInteractiveDescendant(event)) return;
    if (this.contextMenuRowDisabled()?.(row, index) === true) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const origin = event.currentTarget as HTMLElement;
    this._proposeContextMenuSelection(row);
    this.contextMenuSelect.emit({
      originalEvent: event,
      row,
      key: this.getRowKey(row),
      index,
    });
    origin.focus();
    menu.openAt(event.clientX, event.clientY, origin, () =>
      this._proposeContextMenuSelection(null),
    );
  }

  private _openRowContextMenuFromKeyboard(row: T, event: KeyboardEvent): void {
    const menu = this.contextMenu();
    const logicalIndex = this._logicalRowIndex(row);
    if (!menu) return;
    if (this.contextMenuRowDisabled()?.(row, logicalIndex) === true) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const origin = event.currentTarget as HTMLElement;
    const rect = origin.getBoundingClientRect();
    event.preventDefault();
    event.stopPropagation();
    this._proposeContextMenuSelection(row);
    this.contextMenuSelect.emit({
      originalEvent: event,
      row,
      key: this.getRowKey(row),
      index: logicalIndex,
    });
    menu.openAt(
      rect.left + (getComputedStyle(origin).direction === 'rtl' ? rect.width : 0),
      rect.bottom,
      origin,
      () => this._proposeContextMenuSelection(null),
    );
  }

  private _proposeContextMenuSelection(row: T | null): void {
    if (this.contextMenuSelection() === undefined) {
      this._contextMenuKey.set(row === null ? null : this.getRowKey(row));
    }
    this.contextMenuSelectionChange.emit(row);
  }

  protected isNavigableRow(row: T): boolean {
    return this.contextMenu() !== null || (this.selectionEnabled() && this.isRowSelectable(row));
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

    if (key === 'ContextMenu' || (key === 'F10' && event.shiftKey)) {
      this._openRowContextMenuFromKeyboard(row, event);
      return;
    }

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

    if (this.selectionEnabled() && (key === 'Enter' || key === ' ')) {
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
    for (const key of range.previous) {
      const previousRow = rows.find((candidate) => Object.is(this.getRowKey(candidate), key));
      if (previousRow) next.delete(this.getSelectionKey(previousRow));
    }
    for (const key of range.current) {
      const currentRow = rows.find((candidate) => Object.is(this.getRowKey(candidate), key));
      if (currentRow) next.add(this.getSelectionKey(currentRow));
    }
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

  protected onSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this._filterScheduler.search(q, this.filterDelay());
  }

  clearSearch(): void {
    this._filterScheduler.discardSearch();
    const changed = this._state.update({ search: '', page: 1 }, 'ui');
    if (!changed) return;
    this._emitQueryState(changed.current);
    if (!this.serverSide() && this.query() === undefined && this.useUrlState()) {
      this._urlAdapter.clearSearch(this._urlConfig());
    }
  }

  private onPageSizeChange(value: string | number | { target?: { value?: unknown } } | null): void {
    const normalizedValue =
      value && typeof value === 'object' ? (value.target?.value ?? null) : value;
    const size = Number(normalizedValue);
    if (!Number.isFinite(size) || size <= 0) return;
    const changed = this._state.update({ pageSize: size, page: 1 }, 'ui');
    if (!changed) return;
    this._emitPageChange(changed.current.page, changed.current.pageSize);
    this._emitQueryState(changed.current);
    if (!this.serverSide() && this.query() === undefined && this.useUrlState()) {
      this._urlAdapter.resetPage(this.pageParam());
    }
  }

  protected pageButtonAriaLabel(page: number): string {
    return this.pageAriaLabel().replace(/\{page\}/g, String(page));
  }

  private _emitPageChange(page: number, pageSize: number): void {
    this.pageChange.emit(
      this._paginatorController.event({
        page,
        pageSize,
        totalRecords: this.serverSide() ? (this.totalItems() ?? 0) : this.filteredData().length,
      }),
    );
  }

  setExactMatch(value: boolean): void {
    this._exactMatch.set(value);
  }

  setColumnFilter(colKey: string, value: unknown): void {
    this._filterScheduler.column(
      colKey,
      { operator: 'and', constraints: [{ value }] },
      this.filterDelay(),
    );
  }

  clearColumnFilters(): void {
    this._filterScheduler.discardColumns();
    const changed = this._state.update({ filters: {}, page: 1 }, 'api');
    if (changed) this._emitQueryState(changed.current);
    if (this._openFilterKey()) this._closeFilterOverlay(false);
  }

  // ── Actions ───────────────────────────────────────────────────────────
  protected isConfirmPending(row: T, action: NeuTableAction<T>): boolean {
    const p = this._confirmPending();
    return p !== null && p.rowKey === this.getRowKey(row) && p.actionKey === action.key;
  }

  protected handleAction(row: T, action: NeuTableAction<T>): void {
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

  protected cancelConfirm(): void {
    this._confirmPending.set(null);
  }

  protected isSelectionConfirmPending(action: NeuTableSelectionAction<T>): boolean {
    return this._selectionConfirmPending() === action.key;
  }

  protected handleSelectionAction(action: NeuTableSelectionAction<T>): void {
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

  protected cancelSelectionConfirm(): void {
    this._selectionConfirmPending.set(null);
  }

  // ── Export ────────────────────────────────────────────────────────────
  exportCsv(options: NeuTableExportOptions<T> = {}): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const cols = this._getExportProjection();
    const csv = this._exportController.csv(this._getExportRows(options), cols, {
      separator: options.separator ?? this.csvSeparator(),
      formulaPolicy: this.csvFormulaPolicy(),
    });
    this._downloadBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      `${options.fileName ?? this.exportFileName()}.csv`,
    );
  }

  exportJson(options: NeuTableExportOptions<T> = {}): void {
    if (!isPlatformBrowser(this._platformId)) return;
    this._downloadBlob(
      new Blob(
        [this._exportController.json(this._getExportRows(options), this._getExportProjection())],
        { type: 'application/json' },
      ),
      `${options.fileName ?? this.exportFileName()}.json`,
    );
  }

  exportXlsx(options: NeuTableExportOptions<T> = {}): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const bytes = this._exportController.xlsx(
      this._getExportRows(options),
      this._getExportProjection(),
    );
    this._downloadBlob(
      new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `${options.fileName ?? this.exportFileName()}.xlsx`,
    );
  }

  private _getExportColumns(): NeuTableColumn<T>[] {
    const keys = this.exportColumns();
    const all = this._typedColumns().filter(
      (column) =>
        column.exportable !== false &&
        (column.type !== 'actions' ||
          (column.exportable === true && column.exportAccessor !== undefined)),
    );
    return keys.length ? all.filter((c) => keys.includes(c.key)) : all;
  }

  private _getExportProjection(): NeuTableExportColumn<T>[] {
    return this._getExportColumns().map((column) => ({
      key: column.key,
      header: column.exportHeader ?? column.header,
      value: (row: T, rowIndex: number) => {
        const value = column.exportAccessor
          ? column.exportAccessor(row)
          : this.getRowValue(row, column.key);
        const transform = this.exportValue();
        return transform
          ? transform({
              row,
              rowIndex,
              column,
              field: column.key,
              header: column.exportHeader ?? column.header,
              value,
            })
          : value;
      },
    }));
  }

  private _getExportRows(options: NeuTableExportOptions<T>): T[] {
    if (options.rows) return [...options.rows];
    const scope = options.scope ?? this.exportScope();

    if (scope === 'filtered') {
      return this._dedupeExportRows([...this._frozenRows(), ...this.filteredData()]);
    }
    if (scope === 'page') {
      return this._dedupeExportRows([...this._frozenRows(), ...this.paginatedData()]);
    }
    if (scope === 'loaded') {
      return this._dedupeExportRows([...this._frozenRows(), ...this._rows()]);
    }

    const selectedRows = this._identityRows().filter((row) =>
      this._selectedKeys().has(this.getSelectionKey(row)),
    );

    if (scope === 'selected') {
      return this._dedupeExportRows(selectedRows);
    }

    return selectedRows.length > 0
      ? this._dedupeExportRows(selectedRows)
      : this._dedupeExportRows([...this._frozenRows(), ...this.filteredData()]);
  }

  private _dedupeExportRows(rows: readonly T[]): T[] {
    const seen = new Set<unknown>();
    return rows.filter((row) => {
      const key = this.getRowKey(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private _downloadBlob(blob: Blob, filename: string): void {
    const view = this._document.defaultView;
    if (!view) return;
    const url = view.URL.createObjectURL(blob);
    const a = this._document.createElement('a');
    a.href = url;
    a.download = filename;
    this._document.body.appendChild(a);
    a.click();
    this._document.body.removeChild(a);
    view.URL.revokeObjectURL(url);
  }

  // ── Utilidades ────────────────────────────────────────────────────────
  protected onTableScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (this.virtualScroll()) {
      this.virtualScrollEvent.emit({
        originalEvent: event,
        scrollTop: target.scrollTop,
        scrollLeft: target.scrollLeft,
        range: this._virtualRange(),
      });
    }
    if (!this._virtualScrollActive()) {
      return;
    }

    const scrollTop = target.scrollTop;
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
    return resolveNeuTablePath(row, key);
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

  protected getRowKey(row: T): unknown {
    const identity = this.rowKey();
    const resolved =
      typeof identity === 'function' ? identity(row) : this.getRowValue(row, String(identity));
    if (resolved !== undefined) return resolved;
    try {
      return JSON.stringify(row);
    } catch {
      return this._referenceIdentity.key(row);
    }
  }

  private getSelectionKey(row: T): unknown {
    const comparison = this.compareSelectionBy();
    if (comparison === 'equals') return this._referenceIdentity.key(row);
    if (comparison === 'deepEquals') {
      const identity = this.rowKey();
      const resolved =
        typeof identity === 'function' ? identity(row) : this.getRowValue(row, String(identity));
      return neuTableDeepSelectionToken(resolved === undefined ? row : resolved);
    }
    return this.getRowKey(row);
  }

  private _identityIndexOf(row: T, rows: readonly T[]): number {
    const referenceIndex = rows.indexOf(row);
    if (referenceIndex >= 0) return referenceIndex;
    const key = this.getRowKey(row);
    return rows.findIndex((candidate) => Object.is(this.getRowKey(candidate), key));
  }

  protected entryTrackingKey(entry: NeuTablePageEntry<T>, _index: number): unknown {
    const trackBy = this.rowTrackBy();
    return entry.kind === 'row' && trackBy ? trackBy(entry.logicalIndex, entry.row) : entry.key;
  }

  private _groupValue(row: NeuTableRuntimeRow<T>, index: number): unknown {
    const group = this.groupBy();
    return typeof group === 'function' ? group(row, index) : this.getRowValue(row, group);
  }

  protected visibleRowNumber(rowIdx: number): number {
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

  private _scheduleViewportBinding(): void {
    if (!isPlatformBrowser(this._platformId) || this._pendingViewportBinding) return;
    this._pendingViewportBinding = true;
    afterNextRender(
      () => {
        this._pendingViewportBinding = false;
        if (this._destroyed) return;
        const container = this._scrollContainer()?.nativeElement;
        const view = this._document.defaultView;
        if (!container || !view) return;
        const header = container.querySelector<HTMLElement>('.neu-table__head');
        const frozen = [
          ...container.querySelectorAll<HTMLElement>('[data-neu-table-frozen-stack]'),
        ];
        this._viewportController.observe(
          view,
          [container, ...(header ? [header] : []), ...frozen],
          10,
          () => this._measureViewportGeometry(container, header, frozen),
        );
      },
      { injector: this._injector },
    );
  }

  private _measureViewportGeometry(
    container: HTMLElement,
    header: HTMLElement | null,
    frozen: readonly HTMLElement[],
  ): void {
    if (this._destroyed) return;
    const headerHeight = header?.getBoundingClientRect().height ?? 0;
    const viewportHeight = container.clientHeight;
    if (this._measuredHeaderHeight() !== headerHeight) this._measuredHeaderHeight.set(headerHeight);
    if (this._measuredViewportHeight() !== viewportHeight) {
      this._measuredViewportHeight.set(viewportHeight);
    }
    const offsets = new Map<string, number>();
    let top = this._verticalScrollEnabled() ? headerHeight : 0;
    for (const element of frozen) {
      const key = element.dataset['neuTableFrozenStack'];
      if (!key) continue;
      offsets.set(key, top);
      top += element.getBoundingClientRect().height;
    }
    const current = this._frozenStackOffsets();
    const equal =
      current.size === offsets.size &&
      [...offsets].every(([key, value]) => current.get(key) === value);
    if (!equal) this._frozenStackOffsets.set(offsets);
  }

  protected lazyPlaceholderContext(logicalIndex: number): NeuTableLazyPlaceholderContext<T> {
    return {
      $implicit: logicalIndex,
      logicalIndex,
      columns: this.visibleColumns(),
      colspan: this.totalColspan(),
    };
  }

  private _managedRowState(entry: NeuTableBodyDataRenderEntry<T>) {
    const row = entry.row;
    const selectable = this.isRowSelectable(row);
    const selected = this.isRowSelected(row);
    const key = this.getRowKey(row);
    const renderedIndex = this.renderedPageEntries().findIndex(
      (candidate) =>
        candidate.kind === 'row' &&
        candidate.frozen === entry.frozen &&
        candidate.logicalIndex === entry.logicalIndex &&
        Object.is(this.getRowKey(candidate.row), key),
    );
    const frozenStackKey = entry.frozen ? `${Math.max(0, renderedIndex)}:row` : null;
    return {
      rowClass: this.getRowClass(row),
      selected,
      frozen: entry.frozen,
      contextSelected: this.isContextMenuRow(row),
      dragging: Object.is(this._draggedRowKey(), key),
      dropPlacement: Object.is(this._rowDropTarget()?.key, key)
        ? (this._rowDropTarget()?.placement ?? null)
        : null,
      disabled: !selectable,
      clickable: this.selectionEnabled() && this.selectOnRowClick() && selectable,
      tabIndex: this.rowTabIndex(row),
      navigable: this.isNavigableRow(row),
      ariaSelected: this.selectionEnabled() && selectable ? selected : null,
      ariaDisabled: this.selectionEnabled() && !selectable ? true : null,
      ariaRowIndex: this.bodyAriaRowIndex({
        kind: 'row',
        key: entry.key,
        row: row as NeuTableRuntimeRow<T>,
        rowIndex: entry.rowIndex,
        logicalIndex: entry.logicalIndex,
        frozen: entry.frozen,
      }),
      logicalIndex: entry.logicalIndex,
      frozenStackKey,
      top: frozenStackKey ? this.frozenRowTop(frozenStackKey) : null,
      height: this._virtualScrollActive() && !entry.frozen ? this._virtualItemSize() : null,
      draggable: this.isRowDragArmed(row, entry.frozen) ? true : null,
    } as const;
  }

  protected getRowClass(row: T): string {
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

  private _stopColumnResize(): void {
    this._resizeCleanup?.();
  }

  protected getCellValue(row: T, col: NeuTableColumnInput<T>): string {
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
          : d.toLocaleDateString(locale, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              timeZone: this._temporal.timeZone(),
              ...typedColumn.dateFormat,
            });
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

  protected isEditingCell(row: T, col: NeuTableColumnInput<T>): boolean {
    const typedColumn = this.asRuntimeColumn(col);
    this._editingRevision();
    const editing = this._state.editingCell();
    return (
      editing !== null &&
      editing.rowKey === this.getRowKey(row) &&
      editing.columnKey === typedColumn.key
    );
  }

  protected editingValue(): unknown {
    this._editingRevision();
    return this._editingController.cell()?.value ?? '';
  }

  protected cellEditingInvalid(): boolean {
    this._editingRevision();
    return this._editingController.cell()?.invalid ?? false;
  }

  protected cellEditingError(): string | null {
    this._editingRevision();
    return this._editingController.cell()?.error ?? null;
  }

  protected inlineEditorType(col: NeuTableColumnInput<T>): NeuInlineEditorType {
    return this.asRuntimeColumn(col).editor ?? 'text';
  }

  protected inlineEditorOptions(col: NeuTableColumnInput<T>): NeuSelectOption[] {
    return (this.asRuntimeColumn(col).editOptions ?? []).map((option) => ({
      label: option,
      value: option,
    }));
  }

  protected setEditingValue(value: unknown): void {
    if (this._editingController.setCellValue(value)) {
      this._editingRevision.update((revision) => revision + 1);
    }
  }

  startCellEdit(row: T, col: NeuTableColumnInput<T>, event?: Event): void {
    const typedColumn = this.asRuntimeColumn(col);
    if (this.editMode() !== 'cell' || !typedColumn.editable) {
      return;
    }

    event?.stopPropagation();
    const previousValue = this.getRowValue(row, typedColumn.key);
    const rowKey = this.getRowKey(row);
    this._editingController.beginCell(rowKey, typedColumn.key, previousValue);
    this._editingRevision.update((revision) => revision + 1);
    const changed = this._state.setEditingCell({ rowKey, columnKey: typedColumn.key }, 'ui');
    const proposal = changed?.current.editingCell ?? this._state.editingCell();
    this.editingCellChange.emit({ ...proposal! });
    const lifecycle = this._cellLifecycleEvent(row, typedColumn);
    if (lifecycle) this.cellEditInit.emit(lifecycle);
  }

  commitCellEdit(row: T, col: NeuTableColumnInput<T>): void {
    const typedColumn = this.asRuntimeColumn(col);
    const editing = this._editingController.cell();
    if (
      !editing ||
      editing.rowKey !== this.getRowKey(row) ||
      editing.columnKey !== typedColumn.key
    ) {
      return;
    }

    const lifecycle = this._cellLifecycleEvent(row, typedColumn)!;
    const validation = this.cellEditValidator()?.(lifecycle);
    if (!this._editingController.validateCell(validation)) {
      this._editingRevision.update((revision) => revision + 1);
      const invalid = this._editingController.cell()!;
      this.editValidationError.emit({
        mode: 'cell',
        row,
        rowKey: lifecycle.rowKey,
        rowIndex: lifecycle.rowIndex,
        column: typedColumn,
        value: invalid.value,
        message: invalid.error!,
      });
      return;
    }
    this._editingController.finishCell();
    this._editingRevision.update((revision) => revision + 1);
    const changed = this._state.setEditingCell(null, 'ui');
    this.editingCellChange.emit(changed?.current.editingCell ?? null);
    this.cellEditCommit.emit({
      row,
      column: typedColumn,
      value: editing.value,
      previousValue: editing.previousValue,
    });
  }

  cancelCellEdit(event?: Event, row?: T, col?: NeuTableColumnInput<T>): void {
    event?.stopPropagation();
    event?.preventDefault();
    const editing = this._editingController.cell();
    if (!editing) return;
    const resolvedRow =
      row ?? this._identityRows().find((candidate) => this.getRowKey(candidate) === editing.rowKey);
    const resolvedColumn = col
      ? this.asRuntimeColumn(col)
      : this._typedColumns().find((candidate) => candidate.key === editing.columnKey);
    const lifecycle =
      resolvedRow && resolvedColumn ? this._cellLifecycleEvent(resolvedRow, resolvedColumn) : null;
    this._editingController.cancelCell();
    this._editingRevision.update((revision) => revision + 1);
    const changed = this._state.setEditingCell(null, 'ui');
    this.editingCellChange.emit(changed?.current.editingCell ?? null);
    if (lifecycle) this.cellEditCancel.emit(lifecycle);
  }

  protected onEditableCellKeydown(row: T, col: NeuTableColumnInput<T>, event: KeyboardEvent): void {
    if (!this.isEditingCell(row, col)) return;
    if (event.key === 'Escape') {
      this.cancelCellEdit(event, row, col);
      return;
    }
    if (event.key === 'Enter' && !this._isMultilineEditTarget(event.target)) {
      event.preventDefault();
      event.stopPropagation();
      this.commitCellEdit(row, col);
      return;
    }
    const intent =
      event.key === 'Tab'
        ? event.shiftKey
          ? 'previous'
          : 'next'
        : event.key === 'ArrowLeft'
          ? 'left'
          : event.key === 'ArrowRight'
            ? 'right'
            : event.key === 'ArrowUp'
              ? 'up'
              : event.key === 'ArrowDown'
                ? 'down'
                : null;
    if (!intent || (event.key.startsWith('Arrow') && this._editorOwnsArrow(event))) return;
    const adjacent = this._adjacentEditableCell(row, col, intent);
    if (!adjacent && event.key !== 'Tab') return;
    this.commitCellEdit(row, col);
    if (this.isEditingCell(row, col)) {
      event.preventDefault();
      return;
    }
    if (!adjacent) return;
    event.preventDefault();
    event.stopPropagation();
    adjacent.cell.focus();
    this.startCellEdit(adjacent.row, adjacent.column);
  }

  private _isMultilineEditTarget(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    );
  }

  private _editorOwnsArrow(event: KeyboardEvent): boolean {
    const target = event.target;
    const element = target instanceof Element ? target : null;
    if (!element) return false;
    if (
      element instanceof HTMLTextAreaElement ||
      (element instanceof HTMLElement && element.isContentEditable) ||
      element.matches('select, [role="listbox"], [role="slider"], [role="spinbutton"]')
    ) {
      return true;
    }
    if (element.matches('[role="combobox"]')) {
      return event.key === 'ArrowUp' || event.key === 'ArrowDown';
    }
    if (element instanceof HTMLInputElement) {
      if (element.type === 'number' || element.type === 'range') return true;
      return event.key === 'ArrowLeft' || event.key === 'ArrowRight';
    }
    return false;
  }

  private _adjacentEditableCell(
    row: T,
    col: NeuTableColumnInput<T>,
    intent: 'previous' | 'next' | 'left' | 'right' | 'up' | 'down',
  ): { cell: HTMLElement; row: NeuTableRuntimeRow<T>; column: NeuTableColumn<T> } | null {
    const root = this._scrollContainer()?.nativeElement;
    if (!root) return null;
    const cells = [...root.querySelectorAll<HTMLElement>('[data-neu-table-edit-column]')].filter(
      (cell) => this._currentTypedColumn(cell.dataset['neuTableEditColumn'] ?? '')?.editable,
    );
    const frozen = this._frozenRows().includes(row as NeuTableRuntimeRow<T>);
    const domainRows = frozen ? this._frozenRows() : this.visiblePageRows();
    const rowIndex = domainRows.indexOf(row as NeuTableRuntimeRow<T>);
    const columnKey = this.asRuntimeColumn(col).key;
    const current = cells.findIndex(
      (cell) =>
        Number(cell.dataset['neuTableEditRow']) === rowIndex &&
        cell.dataset['neuTableEditFrozen'] === String(frozen) &&
        cell.dataset['neuTableEditColumn'] === columnKey,
    );
    if (current < 0) return null;
    let next: HTMLElement | undefined;
    if (intent === 'previous' || intent === 'left') next = cells[current - 1];
    if (intent === 'next' || intent === 'right') next = cells[current + 1];
    if (intent === 'up' || intent === 'down') {
      const targetRow = rowIndex + (intent === 'up' ? -1 : 1);
      next = cells.find(
        (cell) =>
          Number(cell.dataset['neuTableEditRow']) === targetRow &&
          cell.dataset['neuTableEditFrozen'] === String(frozen) &&
          cell.dataset['neuTableEditColumn'] === columnKey,
      );
    }
    if (!next) return null;
    const nextRows =
      next.dataset['neuTableEditFrozen'] === 'true' ? this._frozenRows() : this.visiblePageRows();
    const nextRow = nextRows[Number(next.dataset['neuTableEditRow'])];
    const nextColumn = this._currentTypedColumn(next.dataset['neuTableEditColumn'] ?? '');
    return nextRow && nextColumn ? { cell: next, row: nextRow, column: nextColumn } : null;
  }

  private _scheduleEditorFocus(columnKey: string): void {
    if (!isPlatformBrowser(this._platformId) || this._pendingEditorFocus) return;
    this._pendingEditorFocus = true;
    afterNextRender(
      () => {
        this._pendingEditorFocus = false;
        if (this._destroyed) return;
        const cell = this._scrollContainer()?.nativeElement.querySelector<HTMLElement>(
          '[data-neu-table-editing="true"]',
        );
        if (!cell) return;
        const selector = this._currentTypedColumn(columnKey)?.editorFocusSelector?.trim();
        let target: HTMLElement | null = null;
        if (selector) {
          try {
            target = cell.querySelector<HTMLElement>(selector);
          } catch {
            target = null;
          }
        }
        target ??= cell.querySelector<HTMLElement>(
          'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
        );
        (target ?? cell).focus();
      },
      { injector: this._injector },
    );
  }

  private _cellLifecycleEvent(
    row: T,
    column: NeuTableColumn<T>,
  ): NeuTableCellEditLifecycleEvent<T> | null {
    const editing = this._editingController.cell();
    if (!editing) return null;
    return {
      row,
      rowKey: editing.rowKey,
      rowIndex: this._logicalRowIndex(row),
      column,
      value: editing.value,
      previousValue: editing.previousValue,
    };
  }

  private isEditingRow(row: T): boolean {
    return this._state.editingKeys().has(this.getRowKey(row));
  }

  startRowEdit(row: NeuTableRuntimeRow<T>): void {
    if (this.editMode() !== 'row') return;
    const rowKey = this.getRowKey(row);
    this._editingController.beginRow(rowKey, row);
    this._editingRevision.update((revision) => revision + 1);
    const next = new Set(this._state.editingKeys());
    next.add(rowKey);
    const changed = this._state.setEditingKeys(next, 'ui');
    const keys = Object.freeze([...(changed?.current.editingKeys ?? this._state.editingKeys())]);
    this.editingRowKeysChange.emit(keys);
    this.rowEditInit.emit(this._rowEditEvent(row, keys));
  }

  saveRowEdit(row: NeuTableRuntimeRow<T>): boolean {
    const rowKey = this.getRowKey(row);
    if (!this._state.editingKeys().has(rowKey)) return false;
    const current = this._rowEditEvent(row, [...this._state.editingKeys()]);
    const validation = this.rowEditValidator()?.(current);
    if (!this._editingController.validateRow(rowKey, validation)) {
      this._editingRevision.update((revision) => revision + 1);
      const invalid = this._editingController.row(rowKey, row);
      this.editValidationError.emit({
        mode: 'row',
        row,
        rowKey,
        rowIndex: current.rowIndex,
        draft: invalid.draft,
        message: invalid.error!,
      });
      return false;
    }
    const next = new Set(this._state.editingKeys());
    next.delete(rowKey);
    const changed = this._state.setEditingKeys(next, 'ui');
    const keys = Object.freeze([...changed!.current.editingKeys]);
    const event = this._rowEditEvent(row, keys);
    this._editingController.finishRow(rowKey);
    this._editingRevision.update((revision) => revision + 1);
    this.editingRowKeysChange.emit(keys);
    this.rowEditSave.emit(event);
    return true;
  }

  cancelRowEdit(row: NeuTableRuntimeRow<T>): void {
    const rowKey = this.getRowKey(row);
    if (!this._state.editingKeys().has(rowKey)) return;
    const draft = this._editingController.row(rowKey, row);
    const next = new Set(this._state.editingKeys());
    next.delete(rowKey);
    const changed = this._state.setEditingKeys(next, 'ui');
    const keys = Object.freeze([...changed!.current.editingKeys]);
    this._editingController.cancelRow(rowKey);
    this._editingRevision.update((revision) => revision + 1);
    this.editingRowKeysChange.emit(keys);
    this.rowEditCancel.emit({
      row,
      draft: draft.draft,
      rowKey,
      rowIndex: this._logicalRowIndex(row),
      editingRowKeys: keys,
    });
  }

  private setRowEditingValue(row: NeuTableRuntimeRow<T>, columnKey: string, value: unknown): void {
    if (this._editingController.setRowValue(this.getRowKey(row), columnKey, value)) {
      this._editingRevision.update((revision) => revision + 1);
    }
  }

  private _rowEditEvent(
    row: NeuTableRuntimeRow<T>,
    keys: readonly unknown[],
  ): NeuTableRowEditEvent<T> {
    const rowKey = this.getRowKey(row);
    return {
      row,
      draft: this._editingController.row(rowKey, row).draft,
      rowKey,
      rowIndex: this._logicalRowIndex(row),
      editingRowKeys: keys,
    };
  }

  protected structuralContext(): NeuTableStructuralContext<T> {
    const columns = Object.freeze([...this.visibleColumns()]) as readonly NeuTableColumn<T>[];
    return {
      $implicit: columns,
      columns,
      colspan: this.totalColspan(),
      column: this._columnHeaderInteractions,
    };
  }

  protected emptyContext() {
    return Object.freeze({ ...this.structuralContext(), message: this.emptyMessage() });
  }

  protected paginatorTemplateContext(): NeuTablePaginatorTemplateContext {
    const event = this._paginatorEvent();
    return {
      $implicit: event.page,
      currentPage: event.page,
      totalPages: event.pageCount,
      first: event.first,
      last: event.last,
      rows: event.rows,
      totalRecords: event.totalRecords,
      disabled: event.pageCount <= 1,
      goToPage: (page) => this.goToPage(page),
      setPageSize: (pageSize) => this.onPageSizeChange(pageSize),
    };
  }

  protected readonly bodySectionContext = computed<NeuTableBodySectionContext<T>>(() => {
    const columns = Object.freeze([...this.visibleColumns()]) as readonly NeuTableColumn<T>[];
    const colspan = this.totalColspan();
    let entries: readonly NeuTableBodyRenderEntry<T>[];

    if (this.loading() && !this._lazyVirtualActive()) {
      entries = Object.freeze([
        { kind: 'loading', key: 'loading', columns, colspan } satisfies NeuTableBodyRenderEntry<T>,
      ]);
    } else if (this._tableEmpty()) {
      entries = Object.freeze([
        {
          kind: 'empty',
          key: 'empty',
          message: this.emptyMessage(),
          columns,
          colspan,
        } satisfies NeuTableBodyRenderEntry<T>,
      ]);
    } else {
      entries = Object.freeze(
        this.renderedPageEntries().map((entry): NeuTableBodyRenderEntry<T> => {
          if (entry.kind === 'row') {
            const context = this.bodyContext(
              entry.row,
              entry.rowIndex,
              entry.logicalIndex,
              entry.frozen,
            );
            const dataEntry: NeuTableBodyDataRenderEntry<T> = {
              kind: 'data',
              key: entry.key,
              row: context.row,
              rowIndex: context.rowIndex,
              logicalIndex: context.logicalIndex,
              frozen: context.frozen,
              columns: context.columns,
              group: context.group ? this._publicGroup(context.group) : null,
              selected: context.selected,
              expanded: context.expanded,
              editing: context.editing,
              toggleSelection: context.toggleSelection,
              toggleExpansion: context.toggleExpansion,
              edit: context.edit,
              reorder: context.reorder,
            };
            return Object.freeze(dataEntry);
          }
          if (entry.kind === 'group' || entry.kind === 'group-footer') {
            return Object.freeze({
              kind: entry.kind === 'group' ? 'group-header' : 'group-footer',
              key: entry.key,
              group: this._publicGroup(entry.group),
              frozen: entry.frozen,
              toggle: () => this.toggleGroup(entry.group),
            });
          }
          if (entry.kind === 'placeholder') {
            return Object.freeze({
              kind: 'placeholder',
              key: entry.key,
              logicalIndex: entry.logicalIndex,
              columns,
              colspan,
              frozen: false,
            });
          }
          return Object.freeze({
            kind: 'spacer',
            key: entry.key,
            height: entry.height,
            position: entry.position,
            colspan,
          });
        }),
      );
    }

    const virtualized = this._virtualScrollActive() || this._lazyVirtualActive();
    return Object.freeze({
      $implicit: entries,
      entries,
      columns,
      colspan,
      virtualized,
      siblingRowsSupported: !virtualized,
    });
  });

  private _publicGroup(group: NeuTableGroup<T>): NeuTableGroup<T> {
    return Object.freeze({
      key: group.key,
      label: group.label,
      rows: Object.freeze([...group.rows]),
      count: group.count,
      groupIndex: group.groupIndex,
      expanded: group.expanded,
    });
  }

  protected bodyContext(
    row: NeuTableRuntimeRow<T>,
    rowIndex: number,
    logicalIndex: number,
    frozen = false,
  ): NeuTableBodyContext<T> {
    const groups = frozen ? this.frozenGroups() : this.visibleGroups();
    const group =
      groups.find(
        (candidate) =>
          rowIndex >= candidate.firstRowIndex &&
          rowIndex < candidate.firstRowIndex + candidate.count,
      ) ?? null;
    return {
      $implicit: row,
      row,
      rowIndex,
      logicalIndex,
      frozen,
      columns: Object.freeze([...this.visibleColumns()]) as readonly NeuTableColumn<T>[],
      group,
      selected: this.isRowSelected(row),
      expanded: this.isRowExpanded(row),
      editing: this.isEditingRow(row),
      toggleSelection: () => this.toggleRow(row, 'api'),
      toggleExpansion: () => this.toggleExpand(row),
      edit: this.rowEditContext(row, rowIndex, logicalIndex),
      reorder: {
        enabled: this.canReorderRow(row, frozen),
        move: (direction) => this.moveRow(row, direction),
      },
    };
  }

  private rowEditContext(
    row: NeuTableRuntimeRow<T>,
    rowIndex: number,
    logicalIndex: number,
  ): NeuTableRowEditContext<T> {
    this._editingRevision();
    const state = this._editingController.row(this.getRowKey(row), row);
    return {
      $implicit: row,
      row,
      draft: state.draft,
      rowIndex,
      logicalIndex,
      editing: this.isEditingRow(row),
      invalid: state.invalid,
      error: state.error,
      setValue: (columnKey, value) => this.setRowEditingValue(row, columnKey, value),
      init: () => this.startRowEdit(row),
      save: () => this.saveRowEdit(row),
      cancel: () => this.cancelRowEdit(row),
    };
  }

  protected cellViewTemplate(columnKey: string): TemplateRef<NeuTableCellViewContext<T>> | null {
    return (
      this.cellViewTemplates().find((template) => template.columnKey() === columnKey)
        ?.templateRef ?? null
    );
  }

  protected cellEditorTemplate(columnKey: string): TemplateRef<NeuTableCellEditorContext<T>> | null {
    return (
      this.cellEditorTemplates().find((template) => template.columnKey() === columnKey)
        ?.templateRef ?? null
    );
  }

  protected cellViewContext(
    row: NeuTableRuntimeRow<T>,
    column: NeuTableColumn<T>,
    rowIndex: number,
    logicalIndex: number,
    frozen = false,
  ): NeuTableCellViewContext<T> {
    return {
      $implicit: row,
      row,
      rowIndex,
      logicalIndex,
      column,
      value: this.getRowValue(row, column.key),
      frozen,
      editing: this.isEditingCell(row, column),
      startEdit: () => this.startCellEdit(row, column),
    };
  }

  protected cellEditorContext(
    row: NeuTableRuntimeRow<T>,
    column: NeuTableColumn<T>,
    rowIndex: number,
    logicalIndex: number,
    frozen = false,
  ): NeuTableCellEditorContext<T> {
    this._editingRevision();
    const editing = this._editingController.cell();
    return {
      $implicit: editing?.value,
      row,
      rowIndex,
      logicalIndex,
      column,
      value: editing?.value,
      previousValue: editing?.previousValue,
      frozen,
      invalid: editing?.invalid ?? false,
      error: editing?.error ?? null,
      setValue: (value) => this.setEditingValue(value),
      save: () => {
        this.commitCellEdit(row, column);
        return !this.isEditingCell(row, column);
      },
      cancel: () => this.cancelCellEdit(undefined, row, column),
    };
  }

  protected groupTemplateContext(
    group: InternalNeuTableGroup<T>,
    frozen = false,
  ): NeuTableGroupTemplateContext<T> {
    const publicGroup: NeuTableGroup<T> = { ...group };
    return {
      ...publicGroup,
      $implicit: publicGroup,
      frozen,
      toggle: () => this.toggleGroup(group),
    };
  }

  protected toggleGroup(group: InternalNeuTableGroup<T>): void {
    if (!this.expandableRowGroups() || this._virtualScrollActive()) return;
    const next = new Set(this._state.groupExpansionKeys());
    const expanding = !next.has(group.key);
    if (expanding) next.add(group.key);
    else next.delete(group.key);
    const changed = this._state.setGroupExpansionKeys(next, 'ui');
    const keys = Object.freeze([...changed!.current.groupExpansionKeys]);
    this.expandedGroupKeysChange.emit(keys);
    const event: NeuTableGroupExpansionEvent<T> = {
      group: { ...group, expanded: expanding },
      expandedGroupKeys: keys,
    };
    if (expanding) this.groupExpand.emit(event);
    else this.groupCollapse.emit(event);
    this._saveStateIfReady();
  }

  protected groupExpansionAriaLabel(group: InternalNeuTableGroup<T>): string {
    return `${group.expanded ? this.collapseGroupAriaLabel() : this.expandGroupAriaLabel()} ${group.label}`;
  }

  protected isRowspanGroupCell(rowIndex: number, columnKey: string): boolean {
    const group = this.groupBy();
    return this.rowGroupMode() === 'rowspan' && typeof group === 'string' && columnKey === group;
  }

  protected groupRowspan(rowIndex: number, frozen = false): number {
    return this._groupingController.rowspan(
      this.rowGroupMode(),
      frozen ? this.frozenGroups() : this.visibleGroups(),
      rowIndex,
    ).span;
  }

  protected hideGroupRowspanCell(rowIndex: number, frozen = false): boolean {
    return this._groupingController.rowspan(
      this.rowGroupMode(),
      frozen ? this.frozenGroups() : this.visibleGroups(),
      rowIndex,
    ).hidden;
  }

  protected getSortPriority(key: string): number {
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
            this._scheduleInlineFilter(
              currentColumn,
              this._typedFilterValueFromControl(currentColumn, value),
            );
          }
        });
      this._trackFilterControl(control, subscription);
      this._typedColumnFilterControls.set(col.key, control);
    }
    return control;
  }

  private _scheduleInlineFilter(column: NeuTableColumn<T>, value: unknown): void {
    if (this.filterOn() === 'enter' && this._isEnterDrivenFilter(column)) return;
    this.setColumnFilter(column.key, value);
  }

  protected commitInlineFilterOnEnter(column: NeuTableColumn<T>, event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (
      this.filterOn() !== 'enter' ||
      keyboardEvent.key !== 'Enter' ||
      keyboardEvent.repeat ||
      !this._isEnterDrivenFilter(column)
    ) {
      return;
    }
    let value: unknown;
    if (column.filterConfig?.kind === 'number' && this.modernFilterMode(column) === 'between') {
      value = {
        from: this.typedRangeStartControl(column).value,
        to: this.typedRangeEndControl(column).value,
      };
    } else if (column.filterConfig) {
      value = this._typedFilterValueFromControl(
        column,
        this.typedColumnFilterControl(column).value,
      );
    } else {
      value = this.columnFilterControl(column.key).value;
    }
    this.setColumnFilter(column.key, value);
  }

  private _isEnterDrivenFilter(column: NeuTableColumn<T>): boolean {
    const kind = column.filterConfig?.kind;
    if (kind) return kind === 'text' || kind === 'number';
    return (
      column.filterable === true &&
      (column.filterType === undefined ||
        column.filterType === 'text' ||
        column.filterType === 'number-range')
    );
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
            this._scheduleInlineFilter(currentColumn, value);
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
          this._scheduleInlineFilter(currentColumn, { ...range, [boundary]: value });
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
          this._scheduleInlineFilter(currentColumn, {
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
    this._filterScheduler.discardColumn(key);
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

  private _applyScheduledFilters(
    pending: NeuTableScheduledFilters<InternalAppliedColumnFilter>,
  ): void {
    if (this._destroyed) return;
    const filters = { ...this._appliedFilters() };
    for (const [key, input] of pending.columns) {
      const normalized = this._normalizeAppliedFilterInput(this._currentTypedColumn(key), input);
      if (normalized.constraints.length === 0) delete filters[key];
      else filters[key] = normalized;
    }
    const changed = this._state.update(
      {
        ...(pending.searchSet ? { search: pending.search } : {}),
        ...(pending.columns.size > 0 ? { filters } : {}),
        ...(pending.searchSet ||
        (pending.columns.size > 0 && (this.serverSide() || this.query() !== undefined))
          ? { page: 1 }
          : {}),
      },
      'ui',
    );
    if (!changed) return;
    if (pending.searchSet) this.searchChange.emit(pending.search);
    this._emitQueryState(changed.current);
    if (
      pending.searchSet &&
      !this.serverSide() &&
      this.query() === undefined &&
      this.useUrlState()
    ) {
      this._urlAdapter.writeSearch(this._urlConfig(), pending.search);
    }
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
        if (
          matchesNeuTableFilter(
            row,
            filter.column,
            constraint.value,
            constraint.mode,
            this._filterRegistry,
            this.filterLocale(),
          )
        ) {
          return true;
        }
      }
      return false;
    }

    for (const constraint of filter.constraints) {
      if (
        !matchesNeuTableFilter(
          row,
          filter.column,
          constraint.value,
          constraint.mode,
          this._filterRegistry,
          this.filterLocale(),
        )
      ) {
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
              mode as NeuTableFilterMatchMode | undefined,
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
      { previous: string | undefined; next: string | undefined }
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

  protected columnFilterControl(key: string): FormControl<string> {
    let control = this._columnFilterControls.get(key);
    if (!control) {
      control = new FormControl(String(this.getColumnFilterValue(key)), {
        nonNullable: true,
      });
      const subscription = control.valueChanges
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe((value) => {
          const column = this._currentTypedColumn(key);
          if (column) this._scheduleInlineFilter(column, value);
        });
      this._trackFilterControl(control, subscription);
      this._columnFilterControls.set(key, control);
    }
    return control;
  }

  private getColumnFilterValue(key: string): unknown {
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
          groupExpansionKeys: new Set(snapshot.expandedGroupKeys ?? []),
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
    mode: NeuTableExpandMode,
  ): ReadonlySet<unknown> {
    if (mode === 'none') return new Set();
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
    const requestRange = this._lazyDataController.requestRange(
      this._virtualRange(),
      this._logicalTotalItems(),
      this.virtualScrollStep(),
    );
    const request = this._lazyDataController.request(query, requestRange, reason, force);
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
