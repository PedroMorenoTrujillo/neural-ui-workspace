import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  input,
  signal,
  type InputSignal,
  type Signal,
  type TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NeuTableAdvancedFilterBuilderComponent } from '../features/advanced-filters/neu-table-advanced-filter-builder.component';
import type { NeuTableRenderRow } from '../identity/neu-table-row-identity';
import {
  normalizeNeuTableResize,
  projectNeuTableLayout,
  proposeNeuTableMove,
  proposeNeuTablePin,
  proposeNeuTableReorder,
  proposeNeuTableResize,
  proposeNeuTableVisibility,
  type NeuTableColumnPin,
} from '../layout/neu-table-layout';
import {
  isNeuTableRowDisabled,
  type NeuTableSelectionIntent,
  type NeuTableSelectionProjection,
} from '../selection/neu-table-selection';
import {
  createNeuTablePaginationPresentation,
  findNeuTableFilterCondition,
  isNeuTableFilterRule,
  neuTableFilterValueFromText,
  proposeNeuTableFilters,
  proposeNeuTablePage,
  proposeNeuTablePageSize,
  proposeNeuTableSearch,
  proposeNeuTableSort,
  removeNeuTableFilterField,
  setNeuTableFilterCondition,
  type NeuTableFilterRule,
  type NeuTablePaginationPresentation,
} from '../query-ui/neu-table-query-transitions';
import {
  presentNeuTableBasicValue,
  readNeuTableColumnValue,
  resolveNeuTableColumnWidth,
} from '../semantics/neu-table-basic-projections';
import type {
  NeuTableAppearance,
  NeuTableCellContext,
  NeuTableColumn,
  NeuTableDataMode,
  NeuTableFilterOptions,
  NeuTableHeaderContext,
  NeuTableKey,
  NeuTableLabels,
  NeuTableLayoutState,
  NeuTableLayoutChange,
  NeuTableMetadata,
  NeuTablePaginationOptions,
  NeuTableQuery,
  NeuTableRowOptions,
  NeuTableSelectionOptions,
  NeuSortEntry,
  NeuTableSortOptions,
  NeuTableStateTemplateContext,
} from '../../public/neu-table.types';

@Component({
  selector: 'neu-table-basic-renderer',
  standalone: true,
  imports: [NgTemplateOutlet, NeuTableAdvancedFilterBuilderComponent],
  templateUrl: './neu-table-basic-renderer.component.html',
  styleUrl: './neu-table-basic-renderer.component.scss',
  host: {
    '[attr.data-neu-table-renderer]': '"basic"',
  },
})
export class NeuTableBasicRendererComponent<
  T extends object,
  K extends NeuTableKey,
  F extends string,
> {
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  readonly rows: InputSignal<readonly NeuTableRenderRow<T, K>[]> = input.required();
  readonly columns: InputSignal<readonly NeuTableColumn<T, F>[]> = input.required();
  readonly allColumns: InputSignal<readonly NeuTableColumn<T, F>[]> = input.required();
  readonly metadata: InputSignal<NeuTableMetadata> = input.required();
  readonly layout: InputSignal<NeuTableLayoutState> = input.required();
  readonly rowOptions: InputSignal<NeuTableRowOptions<T, K>> = input.required();
  readonly selectionOptions: InputSignal<NeuTableSelectionOptions<T>> = input.required();
  readonly selectionProjection: InputSignal<NeuTableSelectionProjection<K>> = input.required();
  readonly sort: InputSignal<readonly NeuSortEntry<F>[]> = input.required();
  readonly query: InputSignal<NeuTableQuery<F>> = input.required();
  readonly dataMode: InputSignal<NeuTableDataMode> = input.required();
  readonly sortOptions: InputSignal<NeuTableSortOptions> = input.required();
  readonly filterOptions: InputSignal<NeuTableFilterOptions<T, F>> = input.required();
  readonly paginationOptions: InputSignal<NeuTablePaginationOptions> = input.required();
  readonly matchedNormalCount: InputSignal<number> = input.required();
  readonly visibleNormalCount: InputSignal<number> = input.required();
  readonly appearance: InputSignal<NeuTableAppearance> = input.required();
  readonly labels: InputSignal<NeuTableLabels> = input.required();
  readonly captionTemplate: InputSignal<TemplateRef<never> | undefined> = input();
  readonly toolbarTemplate: InputSignal<TemplateRef<never> | undefined> = input();
  readonly summaryTemplate: InputSignal<TemplateRef<never> | undefined> = input();
  readonly emptyTemplate: InputSignal<TemplateRef<never> | undefined> = input();
  readonly loadingTemplate: InputSignal<TemplateRef<NeuTableStateTemplateContext> | undefined> =
    input();
  readonly errorTemplate: InputSignal<TemplateRef<NeuTableStateTemplateContext> | undefined> =
    input();
  readonly headerTemplates: InputSignal<
    ReadonlyMap<string, TemplateRef<NeuTableHeaderContext<T, F>>>
  > = input.required();
  readonly cellTemplates: InputSignal<ReadonlyMap<string, TemplateRef<NeuTableCellContext<T, K>>>> =
    input.required();
  readonly footerTemplates: InputSignal<
    ReadonlyMap<string, TemplateRef<NeuTableHeaderContext<T, F>>>
  > = input.required();
  readonly retry: InputSignal<() => void> = input.required();
  readonly proposeSelection: InputSignal<(intent: NeuTableSelectionIntent<T, K>) => void> =
    input.required();
  readonly proposeToggleAll: InputSignal<() => void> = input.required();
  readonly proposeLayout: InputSignal<(change: NeuTableLayoutChange | null) => void> =
    input.required();
  readonly proposeQuery: InputSignal<(query: NeuTableQuery<F> | null) => void> = input.required();

  protected readonly draggedColumnId = signal<string | null>(null);
  protected readonly resizeGesture = signal<{
    readonly column: NeuTableColumn<T, F>;
    readonly startX: number;
    readonly startWidth: number;
    readonly direction: 1 | -1;
  } | null>(null);
  protected readonly resizePreview = signal<{
    readonly columnId: string;
    readonly width: string;
  } | null>(null);
  protected readonly searchDraft = signal('');
  protected readonly searchEditing = signal(false);
  protected readonly rowFilterDrafts = signal<
    ReadonlyMap<string, { readonly rule: NeuTableFilterRule; readonly value: string }>
  >(new Map());
  protected readonly openFilterColumnId = signal<string | null>(null);
  protected readonly filterDraftRule = signal<NeuTableFilterRule>('equals');
  protected readonly filterDraftValue = signal('');
  protected readonly filterTrigger = signal<HTMLElement | null>(null);
  protected readonly builderOpen = signal(false);
  protected readonly builderTrigger = signal<HTMLElement | null>(null);
  private readonly filterTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly rowFilterControls = new Map<string, HTMLInputElement | HTMLSelectElement>();

  protected readonly columnCount: Signal<number> = computed(() =>
    Math.max(1, this.columns().length + (this.hasSelectionColumn() ? 1 : 0)),
  );
  protected readonly stateContext: Signal<NeuTableStateTemplateContext> = computed(() => ({
    loading: this.metadata().loading,
    error: this.metadata().error,
    retry: this.retry(),
  }));
  protected readonly hasFooterTemplates: Signal<boolean> = computed(
    () => this.footerTemplates().size > 0 || this.summaryTemplate() !== undefined,
  );
  protected readonly hasSelectionColumn = computed(() => {
    const options = this.selectionOptions();
    return options.mode !== 'none' && options.indicator !== 'none';
  });
  protected readonly hiddenColumns = computed(
    () => projectNeuTableLayout(this.allColumns(), this.layout()).hiddenColumns,
  );
  protected readonly pagination = computed<NeuTablePaginationPresentation>(() =>
    createNeuTablePaginationPresentation({
      query: this.query(),
      total: this.dataMode() === 'client' ? this.matchedNormalCount() : this.metadata().totalItems,
      visibleNormalCount: this.visibleNormalCount(),
    }),
  );
  protected readonly pageSizeOptions = computed(() => [
    ...new Set(
      this.paginationOptions()
        .pageSizeOptions.filter(
          (value) => Number.isFinite(value) && value > 0 && Number.isInteger(value),
        )
        .map((value) => Math.floor(value)),
    ),
  ]);
  protected readonly appliedPageSizeConfigured = computed(() =>
    this.pageSizeOptions().includes(this.pagination().pageSize),
  );
  protected readonly hasGlobalSearch = computed(() => this.filterOptions().globalFields.length > 0);
  protected readonly hasRowFilters = computed(() => this.filterOptions().surfaces.includes('row'));
  protected readonly hasMenuFilters = computed(() =>
    this.filterOptions().surfaces.includes('menu'),
  );
  protected readonly hasBuilder = computed(
    () =>
      this.filterOptions().surfaces.includes('builder') &&
      this.allColumns().some((column) => column.filter !== undefined),
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const timer of this.filterTimers.values()) clearTimeout(timer);
      this.filterTimers.clear();
      this.rowFilterControls.clear();
    });
  }

  protected readonly headerTemplate = (columnId: string) => this.headerTemplates().get(columnId);
  protected readonly cellTemplate = (columnId: string) => this.cellTemplates().get(columnId);
  protected readonly footerTemplate = (columnId: string) => this.footerTemplates().get(columnId);
  protected readonly headerContext = (
    column: NeuTableColumn<T, F>,
  ): NeuTableHeaderContext<T, F> => ({ column, sort: this.sort() });
  protected readonly ariaSort = (column: NeuTableColumn<T, F>) => {
    const field = column.sort?.field ?? column.field;
    if (field === undefined) return null;
    const entry = this.sort().find((candidate) => candidate.field === field);
    return entry?.direction === 'asc'
      ? 'ascending'
      : entry?.direction === 'desc'
        ? 'descending'
        : null;
  };
  protected readonly sortPriority = (column: NeuTableColumn<T, F>) => {
    if (column.sort === undefined) return null;
    const index = this.sort().findIndex((entry) => entry.field === column.sort?.field);
    return index < 0 ? null : index + 1;
  };
  protected readonly sortActionLabel = (column: NeuTableColumn<T, F>) => {
    if (column.sort === undefined) return '';
    const current = this.ariaSort(column);
    const defaultState = this.sortOptions().defaultDirection === 'asc' ? 'ascending' : 'descending';
    const oppositeState = defaultState === 'ascending' ? 'descending' : 'ascending';
    const next =
      current === null
        ? defaultState
        : current === defaultState
          ? oppositeState
          : this.sortOptions().removable
            ? 'none'
            : defaultState;
    return `Sort ${column.header}; current ${current ?? 'none'}; activate for ${next}`;
  };
  protected readonly sortColumn = (column: NeuTableColumn<T, F>, event: MouseEvent) => {
    if (column.sort === undefined) return;
    this.proposeQuery()(
      proposeNeuTableSort({
        query: this.query(),
        field: column.sort.field,
        sortOptions: this.sortOptions(),
        additive: event.shiftKey || event.metaKey || event.ctrlKey,
      }),
    );
  };
  protected readonly beginSearch = () => {
    this.searchDraft.set(this.query().search);
    this.searchEditing.set(true);
  };
  protected readonly updateSearchDraft = (event: Event) =>
    this.searchDraft.set((event.currentTarget as HTMLInputElement).value);
  protected readonly commitSearch = (event?: Event) => {
    event?.preventDefault();
    const search = this.searchDraft();
    const input = (event?.currentTarget as HTMLElement | null)?.querySelector<HTMLInputElement>(
      'input[type="search"]',
    );
    if (input !== null && input !== undefined) input.value = this.query().search;
    this.searchDraft.set(this.query().search);
    this.searchEditing.set(false);
    this.proposeQuery()(
      proposeNeuTableSearch({
        query: this.query(),
        search,
        sortOptions: this.sortOptions(),
      }),
    );
  };
  protected readonly cancelSearch = (event?: Event) => {
    event?.preventDefault();
    if (event?.currentTarget instanceof HTMLInputElement) {
      event.currentTarget.value = this.query().search;
    }
    this.searchDraft.set(this.query().search);
    this.searchEditing.set(false);
  };
  protected readonly clearSearch = (event: Event) => {
    const input = (event.currentTarget as HTMLElement)
      .closest('form')
      ?.querySelector<HTMLInputElement>('input[type="search"]');
    if (input !== null && input !== undefined) input.value = this.query().search;
    this.searchEditing.set(false);
    this.searchDraft.set(this.query().search);
    this.proposeQuery()(
      proposeNeuTableSearch({
        query: this.query(),
        search: '',
        sortOptions: this.sortOptions(),
      }),
    );
  };
  protected readonly filterRules = (
    column: NeuTableColumn<T, F>,
  ): readonly NeuTableFilterRule[] => {
    const rules = column.filter?.rules.filter(isNeuTableFilterRule) ?? [];
    return rules.length === 0 ? ['equals'] : rules;
  };
  protected readonly appliedFilter = (column: NeuTableColumn<T, F>) =>
    column.filter === undefined
      ? null
      : findNeuTableFilterCondition(this.query().filters, column.filter.field);
  protected readonly filterValueText = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
      return String(value);
    }
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString();
    if (Array.isArray(value)) {
      return value
        .filter(
          (entry): entry is string | number | bigint | boolean =>
            typeof entry === 'string' ||
            typeof entry === 'number' ||
            typeof entry === 'bigint' ||
            typeof entry === 'boolean',
        )
        .map(String)
        .join(', ');
    }
    return '';
  };
  protected readonly filterRule = (column: NeuTableColumn<T, F>) => {
    const draft = this.rowFilterDrafts().get(column.id);
    if (draft !== undefined && this.filterRules(column).includes(draft.rule)) return draft.rule;
    const applied = this.appliedFilter(column)?.rule;
    if (applied !== undefined && isNeuTableFilterRule(applied)) return applied;
    const preferred = column.filter?.defaultRule;
    return preferred !== undefined && isNeuTableFilterRule(preferred)
      ? preferred
      : this.filterRules(column)[0]!;
  };
  protected readonly filterValue = (column: NeuTableColumn<T, F>) =>
    this.rowFilterDrafts().get(column.id)?.value ??
    this.filterValueText(this.appliedFilter(column)?.value);
  protected readonly filterNeedsValue = (rule: NeuTableFilterRule) =>
    !['isNull', 'isNotNull', 'isEmpty', 'isNotEmpty'].includes(rule);
  protected readonly setRowFilterRule = (column: NeuTableColumn<T, F>, event: Event) => {
    const rule = (event.currentTarget as HTMLSelectElement).value;
    if (!isNeuTableFilterRule(rule) || !this.filterRules(column).includes(rule)) return;
    this.setRowFilterDraft(column, rule, this.filterValue(column));
    this.rowFilterControls.set(column.id, event.currentTarget as HTMLSelectElement);
    this.scheduleRowFilter(column);
  };
  protected readonly setRowFilterValue = (column: NeuTableColumn<T, F>, event: Event) => {
    this.setRowFilterDraft(
      column,
      this.filterRule(column),
      (event.currentTarget as HTMLInputElement).value,
    );
    this.rowFilterControls.set(column.id, event.currentTarget as HTMLInputElement);
    this.scheduleRowFilter(column);
  };
  private setRowFilterDraft(
    column: NeuTableColumn<T, F>,
    rule: NeuTableFilterRule,
    value: string,
  ): void {
    const next = new Map(this.rowFilterDrafts());
    next.set(column.id, { rule, value });
    this.rowFilterDrafts.set(next);
  }
  private scheduleRowFilter(column: NeuTableColumn<T, F>): void {
    const timer = this.filterTimers.get(column.id);
    if (timer !== undefined) clearTimeout(timer);
    if (this.filterOptions().commit !== 'immediate') return;
    this.filterTimers.set(
      column.id,
      setTimeout(
        () => {
          this.filterTimers.delete(column.id);
          this.commitRowFilter(column);
        },
        Math.max(0, this.filterOptions().debounceMs),
      ),
    );
  }
  protected readonly commitRowFilter = (column: NeuTableColumn<T, F>, event?: Event) => {
    event?.preventDefault();
    const timer = this.filterTimers.get(column.id);
    if (timer !== undefined) clearTimeout(timer);
    this.filterTimers.delete(column.id);
    if (column.filter === undefined) return;
    const rule = this.filterRule(column);
    const value = this.filterValue(column);
    const filters = setNeuTableFilterCondition(this.query().filters, {
      kind: 'condition',
      field: column.filter.field,
      rule,
      value: neuTableFilterValueFromText(rule, value),
    });
    const drafts = new Map(this.rowFilterDrafts());
    drafts.delete(column.id);
    this.rowFilterDrafts.set(drafts);
    const control = this.rowFilterControls.get(column.id);
    this.rowFilterControls.delete(column.id);
    if (control instanceof HTMLSelectElement) control.value = this.filterRule(column);
    if (control instanceof HTMLInputElement) control.value = this.filterValue(column);
    this.proposeQuery()(
      proposeNeuTableFilters({
        query: this.query(),
        filters,
        sortOptions: this.sortOptions(),
        filterOptions: this.filterOptions(),
      }),
    );
  };
  protected readonly clearFilter = (column: NeuTableColumn<T, F>) => {
    if (column.filter === undefined) return;
    const timer = this.filterTimers.get(column.id);
    if (timer !== undefined) clearTimeout(timer);
    this.filterTimers.delete(column.id);
    this.rowFilterControls.delete(column.id);
    const drafts = new Map(this.rowFilterDrafts());
    drafts.delete(column.id);
    this.rowFilterDrafts.set(drafts);
    const filters = removeNeuTableFilterField(this.query().filters, column.filter.field);
    this.proposeQuery()(
      proposeNeuTableFilters({
        query: this.query(),
        filters,
        sortOptions: this.sortOptions(),
        filterOptions: this.filterOptions(),
      }),
    );
    this.closeFilterMenu();
  };
  protected readonly openFilterMenu = (column: NeuTableColumn<T, F>, event: MouseEvent) => {
    if (column.filter === undefined) return;
    this.filterTrigger.set(event.currentTarget as HTMLElement);
    this.filterDraftRule.set(this.filterRule(column));
    this.filterDraftValue.set(this.filterValue(column));
    this.openFilterColumnId.set(column.id);
    afterNextRender(
      () => {
        const scope = this.filterTrigger()?.closest('neu-table-basic-renderer');
        const editor = [
          ...(scope?.querySelectorAll<HTMLElement>('[data-filter-editor]') ?? []),
        ].find((candidate) => candidate.dataset['filterEditor'] === column.id);
        editor?.querySelector<HTMLElement>('input,select,button')?.focus();
      },
      { injector: this.injector },
    );
  };
  protected readonly menuColumn = () =>
    this.allColumns().find((column) => column.id === this.openFilterColumnId()) ?? null;
  protected readonly setMenuRule = (event: Event) => {
    const rule = (event.currentTarget as HTMLSelectElement).value;
    const column = this.menuColumn();
    if (column !== null && isNeuTableFilterRule(rule) && this.filterRules(column).includes(rule)) {
      this.filterDraftRule.set(rule);
    }
  };
  protected readonly setMenuValue = (event: Event) =>
    this.filterDraftValue.set((event.currentTarget as HTMLInputElement).value);
  protected readonly applyFilterMenu = (event?: Event) => {
    event?.preventDefault();
    const column = this.menuColumn();
    if (column?.filter === undefined) return;
    const rule = this.filterDraftRule();
    if (!this.filterRules(column).includes(rule)) return;
    const filters = setNeuTableFilterCondition(this.query().filters, {
      kind: 'condition',
      field: column.filter.field,
      rule,
      value: neuTableFilterValueFromText(rule, this.filterDraftValue()),
    });
    this.proposeQuery()(
      proposeNeuTableFilters({
        query: this.query(),
        filters,
        sortOptions: this.sortOptions(),
        filterOptions: this.filterOptions(),
      }),
    );
    this.closeFilterMenu();
  };
  protected readonly closeFilterMenu = () => {
    if (this.openFilterColumnId() === null) return;
    const trigger = this.filterTrigger();
    this.openFilterColumnId.set(null);
    this.filterTrigger.set(null);
    afterNextRender(() => trigger?.focus(), { injector: this.injector });
  };
  protected readonly openBuilder = (event: MouseEvent) => {
    this.builderTrigger.set(event.currentTarget as HTMLElement);
    this.builderOpen.set(true);
  };
  protected readonly closeBuilder = () => {
    const trigger = this.builderTrigger();
    this.builderOpen.set(false);
    this.builderTrigger.set(null);
    afterNextRender(() => trigger?.focus(), { injector: this.injector });
  };
  protected readonly applyAdvancedFilters = (filters: NonNullable<NeuTableQuery<F>['filters']>) =>
    this.proposeQuery()(
      proposeNeuTableFilters({
        query: this.query(),
        filters,
        sortOptions: this.sortOptions(),
        filterOptions: this.filterOptions(),
      }),
    );
  protected readonly changePage = (page: number) =>
    this.proposeQuery()(
      proposeNeuTablePage({
        query: this.query(),
        page,
        sortOptions: this.sortOptions(),
      }),
    );
  protected readonly changePageSize = (event: Event) =>
    this.proposeQuery()(
      proposeNeuTablePageSize({
        query: this.query(),
        pageSize: Number((event.currentTarget as HTMLSelectElement).value),
        sortOptions: this.sortOptions(),
        allowedPageSizes: this.paginationOptions().pageSizeOptions,
      }),
    );
  protected readonly jumpToPage = (event: Event) => {
    const page = Number((event.currentTarget as HTMLInputElement).value) - 1;
    if (Number.isFinite(page)) this.changePage(page);
  };
  protected readonly paginationReport = () => {
    const state = this.pagination();
    if (this.paginationOptions().report === 'summary') {
      return state.total === null
        ? `Page ${state.humanPage}`
        : `Page ${state.humanPage} of ${Math.max(1, state.pageCount ?? 1)}`;
    }
    if (this.paginationOptions().report === 'range') {
      return state.total === null
        ? `${state.rangeStart}–${state.rangeEnd}`
        : `${state.rangeStart}–${state.rangeEnd} of ${state.total}`;
    }
    return '';
  };
  protected readonly cellContext = (
    renderRow: NeuTableRenderRow<T, K>,
    column: NeuTableColumn<T, F>,
  ): NeuTableCellContext<T, K> => ({
    $implicit: renderRow.row,
    row: renderRow.row,
    key: renderRow.key,
    index: renderRow.index,
    selected: this.selectionProjection().isSelected(renderRow.key),
    expanded: false,
    disabled: this.rowDisabled(renderRow),
    columnId: column.id,
    value: readNeuTableColumnValue(renderRow.row, column),
  });
  protected readonly basicValue = (row: T, column: NeuTableColumn<T, F>) =>
    presentNeuTableBasicValue(readNeuTableColumnValue(row, column));
  protected readonly columnWidth = (column: NeuTableColumn<T, F>) => {
    const preview = this.resizePreview();
    return preview?.columnId === column.id
      ? preview.width
      : resolveNeuTableColumnWidth(column, this.layout());
  };
  protected readonly columnPin = (column: NeuTableColumn<T, F>): NeuTableColumnPin =>
    projectNeuTableLayout(this.allColumns(), this.layout()).pinById.get(column.id) ?? null;
  protected readonly columnPinOffset = (column: NeuTableColumn<T, F>, edge: 'start' | 'end') => {
    const columns = this.columns();
    const index = columns.findIndex((candidate) => candidate.id === column.id);
    const siblings = edge === 'start' ? columns.slice(0, index) : columns.slice(index + 1);
    const widths = siblings
      .filter((candidate) => this.columnPin(candidate) === edge)
      .map((candidate) => this.columnWidth(candidate) ?? candidate.minWidth ?? '0px');
    return widths.length === 0 ? '0px' : `calc(${widths.join(' + ')})`;
  };
  protected readonly rowDisabled = (renderRow: NeuTableRenderRow<T, K>) =>
    isNeuTableRowDisabled(renderRow.row, this.selectionOptions(), this.rowOptions());
  protected readonly rowSelected = (renderRow: NeuTableRenderRow<T, K>) =>
    this.selectionProjection().isSelected(renderRow.key);
  protected readonly selectionIndicator = () => {
    const options = this.selectionOptions();
    return options.mode === 'none' ? 'none' : options.indicator;
  };
  protected readonly selectRow = (
    renderRow: NeuTableRenderRow<T, K>,
    source: NeuTableSelectionIntent<T, K>['source'],
    event: MouseEvent | KeyboardEvent,
  ) =>
    this.proposeSelection()({
      row: renderRow.row,
      key: renderRow.key,
      source,
      shiftKey: event.shiftKey,
      platformModifier: event.metaKey || event.ctrlKey,
    });
  protected readonly isInteractiveEvent = (event: MouseEvent) =>
    event.composedPath().some((target) => {
      const matches = (target as { matches?: (selectors: string) => boolean }).matches;
      return (
        typeof matches === 'function' &&
        matches.call(
          target,
          'a,button,input,select,textarea,[contenteditable="true"],[data-neu-selection-stop]',
        )
      );
    });
  protected readonly onRowClick = (renderRow: NeuTableRenderRow<T, K>, event: MouseEvent) => {
    const options = this.selectionOptions();
    if (options.mode === 'none' || !options.selectOnRowClick || this.isInteractiveEvent(event)) {
      return;
    }
    this.selectRow(renderRow, 'row', event);
  };
  protected readonly onSelectionEnter = (renderRow: NeuTableRenderRow<T, K>, event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    this.selectRow(renderRow, 'keyboard', event as KeyboardEvent);
  };
  protected readonly onSelectionControlClick = (
    renderRow: NeuTableRenderRow<T, K>,
    event: MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    this.selectRow(renderRow, this.selectionIndicator() === 'radio' ? 'radio' : 'checkbox', event);
  };
  protected readonly onHeaderToggle = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    this.proposeToggleAll()();
  };
  protected readonly onHeaderSelectionEnter = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    this.proposeToggleAll()();
  };
  protected readonly showColumn = (columnId: string) =>
    this.proposeLayout()(proposeNeuTableVisibility(this.layout(), columnId, true));
  protected readonly hideColumn = (columnId: string) =>
    this.proposeLayout()(proposeNeuTableVisibility(this.layout(), columnId, false));
  protected readonly moveColumn = (columnId: string, delta: -1 | 1, event: MouseEvent) => {
    const target = event.currentTarget as HTMLElement | null;
    const scope = target?.closest('neu-table-basic-renderer');
    const focusToken = `move:${columnId}:${delta}`;
    this.proposeLayout()(proposeNeuTableMove(this.allColumns(), this.layout(), columnId, delta));
    afterNextRender(
      () => {
        const replacement = [
          ...(scope?.querySelectorAll<HTMLElement>('[data-layout-focus]') ?? []),
        ].find((candidate) => candidate.dataset['layoutFocus'] === focusToken);
        (replacement ?? (target?.isConnected === true ? target : null))?.focus();
      },
      { injector: this.injector },
    );
  };
  protected readonly cycleColumnPin = (column: NeuTableColumn<T, F>) => {
    const current = this.columnPin(column);
    const next: NeuTableColumnPin = current === null ? 'start' : current === 'start' ? 'end' : null;
    this.proposeLayout()(proposeNeuTablePin(this.layout(), column.id, next));
  };
  protected readonly onColumnDragStart = (columnId: string) => this.draggedColumnId.set(columnId);
  protected readonly onColumnDrop = (targetId: string, event: DragEvent) => {
    event.preventDefault();
    const sourceId = this.draggedColumnId();
    this.draggedColumnId.set(null);
    if (sourceId !== null) {
      this.proposeLayout()(
        proposeNeuTableReorder(this.allColumns(), this.layout(), sourceId, targetId),
      );
    }
  };
  protected readonly cancelColumnDrag = () => this.draggedColumnId.set(null);
  protected readonly onResizeStart = (column: NeuTableColumn<T, F>, event: PointerEvent) => {
    const target = event.currentTarget as HTMLElement | null;
    const header = target?.closest('th');
    if (target === null || header == null) return;
    target.setPointerCapture(event.pointerId);
    this.resizeGesture.set({
      column,
      startX: event.clientX,
      startWidth: header.getBoundingClientRect().width,
      direction: target.closest('[dir="rtl"]') === null ? 1 : -1,
    });
  };
  protected readonly onResizeMove = (event: PointerEvent) => {
    const gesture = this.resizeGesture();
    if (gesture === null) return;
    const width = gesture.startWidth + (event.clientX - gesture.startX) * gesture.direction;
    const normalized = normalizeNeuTableResize(gesture.column, width);
    if (normalized !== null) {
      this.resizePreview.set({ columnId: gesture.column.id, width: normalized });
    }
  };
  protected readonly commitResize = () => {
    const gesture = this.resizeGesture();
    const preview = this.resizePreview();
    this.resizeGesture.set(null);
    this.resizePreview.set(null);
    if (gesture !== null && preview?.columnId === gesture.column.id) {
      this.proposeLayout()(
        proposeNeuTableResize(this.layout(), gesture.column, Number.parseFloat(preview.width)),
      );
    }
  };
  protected readonly cancelResize = () => {
    this.resizeGesture.set(null);
    this.resizePreview.set(null);
  };
  protected readonly resizeWithKeyboard = (
    column: NeuTableColumn<T, F>,
    delta: -1 | 1,
    event: Event,
  ) => {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement | null;
    const width = target?.closest('th')?.getBoundingClientRect().width;
    if (width === undefined) return;
    const direction = target?.closest('[dir="rtl"]') === null ? 1 : -1;
    this.proposeLayout()(
      proposeNeuTableResize(this.layout(), column, width + delta * direction * 10),
    );
  };
  protected readonly rowClass = (renderRow: NeuTableRenderRow<T, K>) => {
    const value = this.rowOptions().className?.(renderRow.row);
    return Array.isArray(value) ? value.join(' ') : (value ?? null);
  };
}
