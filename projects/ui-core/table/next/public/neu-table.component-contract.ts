import {
  afterNextRender,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  effect,
  inject,
  input,
  isDevMode,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
  type InputSignal,
  type OutputEmitterRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  neuTableIdentityToken,
  projectNeuTableRows,
} from '../internal/identity/neu-table-row-identity';
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
  classifyNeuTableRemoteCorrelation,
  createNeuTableRemoteCoordinatorState,
  destroyNeuTableRemoteCoordinator,
  transitionNeuTableRemoteCoordinator,
} from '../internal/remote/neu-table-remote-coordinator';
import { areNeuTableQuerySlicesEqual } from '../internal/query-ui/neu-table-query-transitions';
import {
  areNeuTableRangesEqual,
  normalizeNeuTableItemSize,
  projectNeuTableSpacerSizes,
  projectNeuTableVirtualWindow,
  type NeuTableViewportGeometry,
} from '../internal/virtualization/neu-table-virtualization';
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
  NeuTableRange,
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browserActive = signal(false);
  private readonly retryToken = signal(0);
  private readonly remoteCoordinatorVersion = signal(0);
  private readonly viewportGeometry = signal<NeuTableViewportGeometry>({
    measured: false,
    scrollTop: 0,
    viewportSize: 0,
  });
  private readonly renderer = viewChild(NeuTableBasicRendererComponent);
  private readonly diagnostics = new Set<string>();
  private lastPublishedViewport: {
    readonly visible: NeuTableRange;
    readonly render: NeuTableRange;
  } | null = null;
  private remoteCoordinator = createNeuTableRemoteCoordinatorState<F>();
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
  protected readonly remoteVirtualProjection = computed(() => {
    const virtualization = this.virtualizationOptions();
    if (!virtualization.enabled) return null;
    return projectNeuTableVirtualWindow({
      geometry: this.viewportGeometry(),
      total: this.metadata().totalItems,
      virtualization,
    });
  });
  protected readonly remoteCorrelation = computed(() => {
    this.remoteCoordinatorVersion();
    return classifyNeuTableRemoteCorrelation(
      this.remoteCoordinator,
      this.metadata(),
      this.dataMode() === 'remote' ? (this.remoteVirtualProjection()?.request ?? null) : null,
    );
  });
  protected readonly presentedData = computed(() => {
    if (this.dataMode() === 'client') return this.data();
    const correlation = this.remoteCorrelation();
    return correlation === 'stale-query' ||
      correlation === 'stale-request' ||
      correlation === 'stale-range'
      ? []
      : this.data();
  });
  protected readonly presentedMetadata = computed<NeuTableMetadata>(() => {
    if (this.dataMode() === 'client') return this.metadata();
    const correlation = this.remoteCorrelation();
    if (
      correlation !== 'stale-query' &&
      correlation !== 'stale-request' &&
      correlation !== 'stale-range'
    ) {
      return this.metadata();
    }
    if (correlation === 'stale-range') {
      return { ...this.metadata(), appliedRequestId: this.metadata().appliedRequestId };
    }
    return {
      totalItems: null,
      loading: false,
      error: null,
      queryRevision: this.remoteCoordinator.queryRevision,
      appliedRequestId: null,
    };
  });
  protected readonly sourcePartition = computed(() =>
    partitionNeuTableSource(
      this.presentedData(),
      this.rowKey(),
      this.rowOptions().pin,
      isDevMode(),
    ),
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
      this.dataMode() === 'client' &&
        this.paginationOptions().enabled &&
        !this.virtualizationOptions().enabled,
    ),
  );
  protected readonly matchedNormalCount = computed(() => this.sortedRows().length);
  protected readonly logicalNormalCount = computed<number | null>(() =>
    this.dataMode() === 'client' ? this.normalPage().rows.length : this.metadata().totalItems,
  );
  protected readonly virtualProjection = computed(() => {
    const virtualization = this.virtualizationOptions();
    if (!virtualization.enabled) return null;
    if (this.paginationOptions().enabled) {
      this.diagnoseOnce(
        'virtual-pagination',
        'NeuTable 2 virtualization disables pagination runtime while preserving applied query.',
      );
    }
    return this.dataMode() === 'remote'
      ? this.remoteVirtualProjection()
      : projectNeuTableVirtualWindow({
          geometry: this.viewportGeometry(),
          total: this.logicalNormalCount(),
          virtualization,
        });
  });
  protected readonly normalWindow = computed(() => {
    const projection = this.virtualProjection();
    const rows = this.normalPage().rows;
    if (projection === null) return { rows, start: 0, end: rows.length };
    if (this.dataMode() === 'client') {
      const windowRows = rows.slice(projection.render.start, projection.render.end);
      return {
        rows: windowRows,
        start: projection.render.start,
        end: projection.render.start + windowRows.length,
      };
    }

    const dataRange = this.metadata().dataRange;
    if (dataRange === undefined || rows.length === 0) {
      return {
        rows: [] as readonly T[],
        start: projection.render.start,
        end: projection.render.start,
      };
    }
    const declaredLength = Math.max(0, dataRange.end - dataRange.start);
    if (this.data().length !== declaredLength) {
      this.diagnoseOnce(
        `data-range:${dataRange.start}:${dataRange.end}:${this.data().length}`,
        `NeuTable 2 remote data/dataRange mismatch: ${this.data().length} rows for [${dataRange.start},${dataRange.end}).`,
      );
    }
    const safeEnd = dataRange.start + Math.min(rows.length, declaredLength);
    const start = Math.max(projection.render.start, dataRange.start);
    const end = Math.min(projection.render.end, safeEnd);
    if (end <= start) return { rows: [] as readonly T[], start, end: start };
    const localStart = start - dataRange.start;
    const windowRows = rows.slice(localStart, localStart + (end - start));
    return { rows: windowRows, start, end: start + windowRows.length };
  });
  protected readonly visibleNormalCount = computed(() => this.normalWindow().rows.length);
  protected readonly pipelineRows = computed(() => [
    ...this.sourcePartition().start,
    ...this.normalWindow().rows,
    ...this.sourcePartition().end,
  ]);
  protected readonly renderRows = computed(() => {
    let normalIndex = this.normalWindow().start;
    return projectNeuTableRows(
      this.pipelineRows(),
      this.rowKey(),
      this.rowTrackBy(),
      this.rowOptions().pin,
      false,
    ).map((renderRow) =>
      renderRow.pin === null ? { ...renderRow, index: normalIndex++ } : renderRow,
    );
  });
  protected readonly virtualSpacers = computed(() => {
    const projection = this.virtualProjection();
    if (projection === null) return { before: 0, after: 0 };
    return projectNeuTableSpacerSizes({
      itemSize: projection.itemSize,
      mounted: { start: this.normalWindow().start, end: this.normalWindow().end },
      total: this.logicalNormalCount(),
    });
  });
  protected readonly selectionAnchor = signal<K | null>(null);
  protected readonly loadedSelectionRows = computed(() =>
    selectionRowsFromData(this.presentedData(), this.rowKey()),
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
  protected readonly updateViewport = (
    geometry: NeuTableViewportGeometry,
    reason: NeuTableRangeChange['reason'],
  ) => {
    if (!this.virtualizationOptions().enabled || !geometry.measured) return;
    const current = this.viewportGeometry();
    if (
      current.measured === geometry.measured &&
      current.scrollTop === geometry.scrollTop &&
      current.viewportSize === geometry.viewportSize
    ) {
      return;
    }
    this.viewportGeometry.set(geometry);
    const projection = this.virtualProjection();
    if (projection === null) return;
    const published = { visible: projection.visible, render: projection.render };
    if (
      this.lastPublishedViewport !== null &&
      areNeuTableRangesEqual(this.lastPublishedViewport.visible, published.visible) &&
      areNeuTableRangesEqual(this.lastPublishedViewport.render, published.render)
    ) {
      return;
    }
    this.lastPublishedViewport = published;
    this.rangeChange.emit({ ...published, reason });
  };

  constructor() {
    effect(() => {
      const previous = this.remoteCoordinator;
      const transition = transitionNeuTableRemoteCoordinator(
        previous,
        {
          browserActive: this.browserActive(),
          dataMode: this.dataMode(),
          metadata: this.metadata(),
          query: this.query(),
          requiredRange:
            this.dataMode() === 'remote' ? (this.remoteVirtualProjection()?.request ?? null) : null,
          retryToken: this.retryToken(),
          virtualizationEnabled: this.virtualizationOptions().enabled,
        },
        (left, right) =>
          areNeuTableQuerySlicesEqual(left, right, this.sortOptions(), this.filterOptions().equals),
      );
      this.remoteCoordinator = transition.state;
      if (
        previous.queryRevision !== transition.state.queryRevision ||
        previous.latestRequestId !== transition.state.latestRequestId ||
        !areNeuTableRangesEqual(previous.latestRequestRange, transition.state.latestRequestRange) ||
        previous.dataMode !== transition.state.dataMode
      ) {
        this.remoteCoordinatorVersion.update((version) => version + 1);
      }
      if (transition.request !== null) this.dataRequest.emit(transition.request);
    });

    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => this.browserActive.set(true));
    }

    this.destroyRef.onDestroy(() => {
      this.remoteCoordinator = destroyNeuTableRemoteCoordinator(this.remoteCoordinator);
    });
  }

  private readonly diagnoseOnce = (key: string, message: string): void => {
    if (!isDevMode() || this.diagnostics.has(key)) return;
    this.diagnostics.add(key);
    console.warn(message);
  };

  private readonly normalIndexForKey = (key: K): number | null => {
    const token = neuTableIdentityToken(key);
    if (this.dataMode() === 'client') {
      const index = this.normalPage().rows.findIndex(
        (row) => neuTableIdentityToken(this.rowKey()(row)) === token,
      );
      return index < 0 ? null : index;
    }
    const range = this.metadata().dataRange;
    if (range === undefined) return null;
    const index = this.sourcePartition().normal.findIndex(
      (row) => neuTableIdentityToken(this.rowKey()(row)) === token,
    );
    return index < 0 ? null : range.start + index;
  };

  focusCell(target: { readonly key: K; readonly columnId: string }): boolean {
    if (!this.visibleColumns().some((column) => column.id === target.columnId)) return false;
    const virtualization = this.virtualizationOptions();
    const token = neuTableIdentityToken(target.key);
    const pinned = [...this.sourcePartition().start, ...this.sourcePartition().end].some(
      (row) => neuTableIdentityToken(this.rowKey()(row)) === token,
    );
    const index = pinned ? null : this.normalIndexForKey(target.key);
    if (!pinned && index === null) return false;
    const renderer = this.renderer();
    if (renderer === undefined) return false;
    return renderer.focusVirtualCell(
      token,
      target.columnId,
      index,
      virtualization.enabled ? normalizeNeuTableItemSize(virtualization.itemSize) : null,
    );
  }

  scrollTo(target: { readonly index?: number; readonly key?: K }): Promise<void> {
    const virtualization = this.virtualizationOptions();
    if (!virtualization.enabled) return Promise.resolve();
    const index =
      target.index ?? (target.key === undefined ? null : this.normalIndexForKey(target.key));
    const total = this.logicalNormalCount();
    if (
      index === null ||
      !Number.isInteger(index) ||
      index < 0 ||
      (total !== null && index >= total)
    ) {
      if (target.key !== undefined && this.dataMode() === 'remote') {
        this.diagnoseOnce(
          `remote-key:${neuTableIdentityToken(target.key)}`,
          'NeuTable 2 cannot scroll to an unloaded remote key without a key-to-index contract.',
        );
      }
      return Promise.resolve();
    }
    return (
      this.renderer()?.scrollToVirtualIndex(index, virtualization.itemSize) ?? Promise.resolve()
    );
  }

  retryData(): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      this.dataMode() !== 'remote' ||
      this.remoteCoordinator.destroyed
    ) {
      return;
    }
    this.retryToken.update((token) => token + 1);
  }

  export(request: NeuTableExportRequest<F>): Promise<NeuTableExportOutcome> {
    void request;
    return Promise.reject(new Error('NeuTable export is not implemented in N2-011B'));
  }
}
