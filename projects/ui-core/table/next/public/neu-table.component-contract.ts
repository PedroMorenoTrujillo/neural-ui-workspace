import {
  Component,
  computed,
  contentChildren,
  input,
  isDevMode,
  output,
  signal,
  type InputSignal,
  type OutputEmitterRef,
} from '@angular/core';
import { projectNeuTableRows } from '../internal/identity/neu-table-row-identity';
import {
  createNeuTableFieldResolver,
  filterNeuTableRows,
  normalizeNeuTableQuery,
  paginateNeuTableRows,
  partitionNeuTableSource,
  searchNeuTableRows,
  sortNeuTableRows,
} from '../internal/client-pipeline/neu-table-client-pipeline';
import { NeuTableBasicRendererComponent } from '../internal/renderer/neu-table-basic-renderer.component';
import {
  normalizeNeuTableColumns,
  projectNeuTableLayout,
} from '../internal/layout/neu-table-layout';
import {
  createNeuTableSelectionScope,
  projectNeuTableSelection,
  proposeNeuTableRowSelection,
  proposeNeuTableToggleAll,
  selectionRowsFromData,
  type NeuTableSelectionIntent,
} from '../internal/selection/neu-table-selection';
import {
  createNeuTableTemplateMap,
  firstNeuTableTemplate,
} from '../internal/templates/neu-table-template-registry';
import {
  NeuTableCaptionDirective,
  NeuTableCellDirective,
  NeuTableEmptyDirective,
  NeuTableErrorDirective,
  NeuTableFooterDirective,
  NeuTableHeaderDirective,
  NeuTableLoadingDirective,
  NeuTableSummaryDirective,
  NeuTableToolbarDirective,
} from './neu-table-template-contracts';
import type {
  NeuRowKey,
  NeuRowTrackBy,
  NeuTableAppearance,
  NeuTableColumn,
  NeuTableDataMode,
  NeuTableDataRequest,
  NeuTableEditCancel,
  NeuTableEditChange,
  NeuTableEditCommit,
  NeuTableEditingOptions,
  NeuTableEditState,
  NeuTableExpandedKeysChange,
  NeuTableExpansionOptions,
  NeuTableExportOutcome,
  NeuTableExportRequest,
  NeuTableFeatureError,
  NeuTableFilterOptions,
  NeuTableGroupingChange,
  NeuTableGroupingOptions,
  NeuTableGroupingState,
  NeuTableInteractionOptions,
  NeuTableKey,
  NeuTableLabels,
  NeuTableLayoutChange,
  NeuTableLayoutState,
  NeuTableMetadata,
  NeuTablePaginationOptions,
  NeuTableQuery,
  NeuTableRangeChange,
  NeuTableRowAction,
  NeuTableRowMove,
  NeuTableRowOptions,
  NeuTableSelection,
  NeuTableSelectionChange,
  NeuTableSelectionOptions,
  NeuTableSortOptions,
  NeuTableVirtualizationOptions,
} from './neu-table.types';

@Component({
  selector: 'neu-table',
  standalone: true,
  imports: [NeuTableBasicRendererComponent],
  templateUrl: './neu-table.component.html',
  host: {
    class: 'neu-table2',
    '[attr.data-neu-table-version]': '"2"',
  },
})
export class NeuTableComponent<T extends object, K extends NeuTableKey, F extends string> {
  readonly dataMode: InputSignal<NeuTableDataMode> = input<NeuTableDataMode>('client');
  readonly data: InputSignal<readonly T[]> = input<readonly T[]>([]);
  readonly metadata: InputSignal<NeuTableMetadata> = input<NeuTableMetadata>({
    totalItems: null,
    loading: false,
    error: null,
    queryRevision: 0,
    appliedRequestId: null,
  });
  readonly columns: InputSignal<readonly NeuTableColumn<T, F>[]> = input<
    readonly NeuTableColumn<T, F>[]
  >([]);
  readonly query: InputSignal<NeuTableQuery<F>> = input<NeuTableQuery<F>>({
    page: 0,
    pageSize: 25,
    search: '',
    sort: [],
    filters: null,
  });
  readonly rowKey: InputSignal<NeuRowKey<T, K>> = input.required<NeuRowKey<T, K>>();
  readonly rowTrackBy: InputSignal<NeuRowTrackBy<T> | undefined> = input<
    NeuRowTrackBy<T> | undefined
  >();
  readonly selection: InputSignal<NeuTableSelection<K, F>> = input<NeuTableSelection<K, F>>({
    kind: 'keys',
    keys: [],
  });
  readonly layout: InputSignal<NeuTableLayoutState> = input<NeuTableLayoutState>({
    order: [],
    hidden: [],
    widths: {},
    pinnedStart: [],
    pinnedEnd: [],
  });
  readonly expandedKeys: InputSignal<readonly K[]> = input<readonly K[]>([]);
  readonly editState: InputSignal<NeuTableEditState<K>> = input<NeuTableEditState<K>>({
    kind: 'none',
  });
  readonly grouping: InputSignal<NeuTableGroupingState<F> | null> =
    input<NeuTableGroupingState<F> | null>(null);

  readonly sortOptions: InputSignal<NeuTableSortOptions> = input<NeuTableSortOptions>({
    mode: 'single',
    removable: true,
    defaultDirection: 'asc',
    resetPageOnChange: true,
  });
  readonly filterOptions: InputSignal<NeuTableFilterOptions<T, F>> = input<
    NeuTableFilterOptions<T, F>
  >({
    surfaces: [],
    globalFields: [],
    predicates: {},
    debounceMs: 0,
    commit: 'immediate',
  });
  readonly paginationOptions: InputSignal<NeuTablePaginationOptions> =
    input<NeuTablePaginationOptions>({
      enabled: false,
      pageSizeOptions: [],
      position: 'bottom',
      report: 'none',
      showPageJump: false,
    });
  readonly selectionOptions: InputSignal<NeuTableSelectionOptions<T>> = input<
    NeuTableSelectionOptions<T>
  >({ mode: 'none' });
  readonly virtualizationOptions: InputSignal<NeuTableVirtualizationOptions> =
    input<NeuTableVirtualizationOptions>({ enabled: false });
  readonly editingOptions: InputSignal<NeuTableEditingOptions<T, K, F>> = input<
    NeuTableEditingOptions<T, K, F>
  >({ mode: 'none' });
  readonly expansionOptions: InputSignal<NeuTableExpansionOptions<T>> = input<
    NeuTableExpansionOptions<T>
  >({
    enabled: false,
    toggleOnRowClick: false,
  });
  readonly groupingOptions: InputSignal<NeuTableGroupingOptions<T, F>> = input<
    NeuTableGroupingOptions<T, F>
  >({
    mode: 'subheader',
    scope: 'loaded',
  });
  readonly rowOptions: InputSignal<NeuTableRowOptions<T, K>> = input<NeuTableRowOptions<T, K>>({
    reorderable: false,
  });
  readonly appearance: InputSignal<NeuTableAppearance> = input<NeuTableAppearance>({
    density: 'normal',
    borders: 'rows',
    striped: false,
    stickyHeader: false,
    responsive: 'contained-scroll',
  });
  readonly labels: InputSignal<NeuTableLabels> = input<NeuTableLabels>({
    ariaLabel: 'Data table',
    empty: 'No data',
    loading: 'Loading',
    error: 'Unable to load data',
    retry: 'Retry',
    selection: 'Selection',
    pagination: 'Pagination',
  });
  readonly interactionOptions: InputSignal<NeuTableInteractionOptions> =
    input<NeuTableInteractionOptions>({
      navigation: 'native',
      wrapFocus: false,
      announceChanges: false,
    });

  readonly queryChange: OutputEmitterRef<NeuTableQuery<F>> = output();
  readonly selectionChange: OutputEmitterRef<NeuTableSelectionChange<T, K, F>> = output();
  readonly layoutChange: OutputEmitterRef<NeuTableLayoutChange> = output();
  readonly expandedKeysChange: OutputEmitterRef<NeuTableExpandedKeysChange<K>> = output();
  readonly editStateChange: OutputEmitterRef<NeuTableEditChange<K>> = output();
  readonly groupingChange: OutputEmitterRef<NeuTableGroupingChange<F>> = output();

  readonly dataRequest: OutputEmitterRef<NeuTableDataRequest<F>> = output();
  readonly rangeChange: OutputEmitterRef<NeuTableRangeChange> = output();
  readonly rowAction: OutputEmitterRef<NeuTableRowAction<T, K>> = output();
  readonly editCommit: OutputEmitterRef<NeuTableEditCommit<T, K, F>> = output();
  readonly editCancel: OutputEmitterRef<NeuTableEditCancel<T, K>> = output();
  readonly rowReorder: OutputEmitterRef<NeuTableRowMove<K>> = output();
  readonly exportRequest: OutputEmitterRef<NeuTableExportRequest<F>> = output();
  readonly featureError: OutputEmitterRef<NeuTableFeatureError> = output();

  protected readonly captionDirectives = contentChildren(NeuTableCaptionDirective, {
    descendants: true,
  });
  protected readonly toolbarDirectives = contentChildren(NeuTableToolbarDirective, {
    descendants: true,
  });
  protected readonly headerDirectives = contentChildren<NeuTableHeaderDirective<T, F>>(
    NeuTableHeaderDirective,
    { descendants: true },
  );
  protected readonly cellDirectives = contentChildren<NeuTableCellDirective<T, K, F>>(
    NeuTableCellDirective,
    { descendants: true },
  );
  protected readonly footerDirectives = contentChildren<NeuTableFooterDirective<T, F>>(
    NeuTableFooterDirective,
    { descendants: true },
  );
  protected readonly summaryDirectives = contentChildren(NeuTableSummaryDirective, {
    descendants: true,
  });
  protected readonly emptyDirectives = contentChildren(NeuTableEmptyDirective, {
    descendants: true,
  });
  protected readonly loadingDirectives = contentChildren(NeuTableLoadingDirective, {
    descendants: true,
  });
  protected readonly errorDirectives = contentChildren(NeuTableErrorDirective, {
    descendants: true,
  });

  protected readonly captionTemplate = computed(() =>
    firstNeuTableTemplate(this.captionDirectives()),
  );
  protected readonly toolbarTemplate = computed(() =>
    firstNeuTableTemplate(this.toolbarDirectives()),
  );
  protected readonly headerTemplates = computed(() =>
    createNeuTableTemplateMap(this.headerDirectives()),
  );
  protected readonly cellTemplates = computed(() =>
    createNeuTableTemplateMap(this.cellDirectives()),
  );
  protected readonly footerTemplates = computed(() =>
    createNeuTableTemplateMap(this.footerDirectives()),
  );
  protected readonly summaryTemplate = computed(() =>
    firstNeuTableTemplate(this.summaryDirectives()),
  );
  protected readonly emptyTemplate = computed(() => firstNeuTableTemplate(this.emptyDirectives()));
  protected readonly loadingTemplate = computed(() =>
    firstNeuTableTemplate(this.loadingDirectives()),
  );
  protected readonly errorTemplate = computed(() => firstNeuTableTemplate(this.errorDirectives()));
  protected readonly normalizedColumns = computed(() =>
    normalizeNeuTableColumns(this.columns(), isDevMode()),
  );
  protected readonly layoutProjection = computed(() =>
    projectNeuTableLayout(this.normalizedColumns(), this.layout()),
  );
  protected readonly visibleColumns = computed(() => this.layoutProjection().columns);
  protected readonly fieldResolver = computed(() =>
    createNeuTableFieldResolver(this.normalizedColumns()),
  );
  protected readonly sourcePartition = computed(() =>
    partitionNeuTableSource(this.data(), this.rowKey(), this.rowOptions().pin, isDevMode()),
  );
  protected readonly effectiveQuery = computed(() =>
    normalizeNeuTableQuery(this.query(), this.sortOptions()),
  );
  protected readonly searchedRows = computed(() => {
    const rows = this.sourcePartition().normal;
    if (this.dataMode() === 'remote') return rows;
    return searchNeuTableRows(
      rows,
      this.effectiveQuery().search,
      this.filterOptions().globalFields,
      this.fieldResolver(),
    );
  });
  protected readonly filteredRows = computed(() =>
    this.dataMode() === 'remote'
      ? this.searchedRows()
      : filterNeuTableRows(
          this.searchedRows(),
          this.effectiveQuery().filters,
          this.fieldResolver(),
          this.filterOptions(),
        ),
  );
  protected readonly sortedRows = computed(() =>
    this.dataMode() === 'remote'
      ? this.filteredRows()
      : sortNeuTableRows(this.filteredRows(), this.effectiveQuery().sort, this.fieldResolver()),
  );
  protected readonly normalPage = computed(() =>
    paginateNeuTableRows(
      this.sortedRows(),
      this.effectiveQuery().page,
      this.effectiveQuery().pageSize,
      this.dataMode() === 'client' && this.paginationOptions().enabled,
    ),
  );
  protected readonly matchedNormalCount = computed(() => this.sortedRows().length);
  protected readonly visibleNormalCount = computed(() => this.normalPage().rows.length);
  protected readonly pipelineRows = computed(() => [
    ...this.sourcePartition().start,
    ...this.normalPage().rows,
    ...this.sourcePartition().end,
  ]);
  protected readonly renderRows = computed(() =>
    projectNeuTableRows(
      this.pipelineRows(),
      this.rowKey(),
      this.rowTrackBy(),
      this.rowOptions().pin,
      false,
    ),
  );
  protected readonly selectionAnchor = signal<K | null>(null);
  protected readonly loadedSelectionRows = computed(() =>
    selectionRowsFromData(this.data(), this.rowKey()),
  );
  protected readonly renderedSelectionRows = computed(() =>
    this.renderRows().map(({ row, key }) => ({ row, key })),
  );
  protected readonly currentSelectionScope = computed(() =>
    createNeuTableSelectionScope(this.query(), this.filterOptions()),
  );
  protected readonly headerSelectionRows = computed(() => {
    const options = this.selectionOptions();
    return options.mode === 'multiple' && options.toggleAllScope === 'loaded'
      ? this.loadedSelectionRows()
      : this.renderedSelectionRows();
  });
  protected readonly selectionProjection = computed(() =>
    projectNeuTableSelection({
      selection: this.selection(),
      selectionOptions: this.selectionOptions(),
      rowOptions: this.rowOptions(),
      rows: this.renderedSelectionRows(),
      headerRows: this.headerSelectionRows(),
      columns: this.normalizedColumns(),
      filterOptions: this.filterOptions(),
      currentScope: this.currentSelectionScope(),
    }),
  );
  protected readonly proposeSelection = (intent: NeuTableSelectionIntent<T, K>) => {
    const result = proposeNeuTableRowSelection({
      selection: this.selection(),
      selectionOptions: this.selectionOptions(),
      rowOptions: this.rowOptions(),
      intent,
      rangeRows: this.renderedSelectionRows(),
      loadedRows: this.loadedSelectionRows(),
      anchor: this.selectionAnchor(),
      columns: this.normalizedColumns(),
      filterOptions: this.filterOptions(),
    });
    this.selectionAnchor.set(result.anchor);
    if (result.change !== null) this.selectionChange.emit(result.change);
  };
  protected readonly proposeToggleAll = () => {
    const change = proposeNeuTableToggleAll({
      selection: this.selection(),
      selectionOptions: this.selectionOptions(),
      rowOptions: this.rowOptions(),
      rows: this.headerSelectionRows(),
      loadedRows: this.loadedSelectionRows(),
      currentScope: this.currentSelectionScope(),
      columns: this.normalizedColumns(),
      filterOptions: this.filterOptions(),
    });
    if (change !== null) this.selectionChange.emit(change);
  };
  protected readonly proposeLayout = (change: NeuTableLayoutChange | null) => {
    if (change !== null) this.layoutChange.emit(change);
  };
  protected readonly proposeQuery = (query: NeuTableQuery<F> | null) => {
    if (query !== null) this.queryChange.emit(query);
  };
  protected readonly retry = () => this.retryData();

  focusCell(target: { readonly key: K; readonly columnId: string }): boolean {
    void target;
    return false;
  }

  scrollTo(target: { readonly index?: number; readonly key?: K }): Promise<void> {
    void target;
    return Promise.resolve();
  }

  retryData(): void {
    return;
  }

  export(request: NeuTableExportRequest<F>): Promise<NeuTableExportOutcome> {
    void request;
    return Promise.reject(new Error('NeuTable export is not implemented in N2-011B'));
  }
}
