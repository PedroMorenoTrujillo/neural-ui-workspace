import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  output,
  PLATFORM_ID,
  untracked,
  viewChild,
  type InputSignal,
  type OutputEmitterRef,
  type TemplateRef,
} from '@angular/core';
import {
  normalizeNeuTreeTableHierarchy,
  projectNormalizedNeuTreeTableHierarchy,
  type TreeDiagnostic,
} from '../internal/hierarchy/neu-tree-table-hierarchy';
import { buildNeuTreeTableQueryProjection } from '../internal/query/neu-tree-table-query';
import { NeuTreeTableRendererComponent } from '../internal/renderer/neu-tree-table-renderer.component';
import {
  buildNeuTreeTableSelectionModel,
  proposeNeuTreeTableSelection,
  type TreeSelectionIntent,
} from '../internal/selection/neu-tree-table-selection';
import {
  NeuTreeTableCaptionDirective,
  NeuTreeTableCellDirective,
  NeuTreeTableEditorDirective,
  NeuTreeTableEmptyDirective,
  NeuTreeTableErrorDirective,
  NeuTreeTableFooterDirective,
  NeuTreeTableHeaderDirective,
  NeuTreeTableLoadingDirective,
  NeuTreeTableNodeDirective,
  NeuTreeTableSummaryDirective,
  NeuTreeTableToolbarDirective,
} from './neu-tree-table-template-contracts';
import type {
  NeuTreeTableAppearance,
  NeuTreeTableCellContext,
  NeuTreeTableColumn,
  NeuTreeTableDataMode,
  NeuTreeTableDataRequest,
  NeuTreeTableEditCancel,
  NeuTreeTableEditChange,
  NeuTreeTableEditCommit,
  NeuTreeTableEditingOptions,
  NeuTreeTableEditState,
  NeuTreeTableExpandedKeysChange,
  NeuTreeTableExportOptions,
  NeuTreeTableExportOutcome,
  NeuTreeTableExportRequest,
  NeuTreeTableFeatureError,
  NeuTreeTableFilterOptions,
  NeuTreeTableFocusTarget,
  NeuTreeTableHeaderContext,
  NeuTreeTableHierarchy,
  NeuTreeTableHierarchyOptions,
  NeuTreeTableInteractionOptions,
  NeuTreeTableKey,
  NeuTreeTableLabels,
  NeuTreeTableLayoutChange,
  NeuTreeTableLayoutState,
  NeuTreeTableNodeContext,
  NeuTreeTablePaginationOptions,
  NeuTreeTableQuery,
  NeuTreeTableRangeChange,
  NeuTreeTableRetryTarget,
  NeuTreeTableRowAction,
  NeuTreeTableRowOptions,
  NeuTreeTableScrollTarget,
  NeuTreeTableSelection,
  NeuTreeTableSelectionChange,
  NeuTreeTableSelectionOptions,
  NeuTreeTableSortOptions,
  NeuTreeTableStateContext,
  NeuTreeTableVirtualizationOptions,
} from './neu-tree-table.types';

interface HierarchyDiagnostic<K extends NeuTreeTableKey> {
  readonly code: NeuTreeTableFeatureError extends infer ErrorType
    ? ErrorType extends { readonly feature: 'hierarchy'; readonly code: infer Code }
      ? Code
      : never
    : never;
  readonly fingerprint: string;
  readonly error: unknown;
  readonly key?: K;
}

const EMPTY_HIERARCHY = {
  hierarchyRevision: 0,
  queryRevision: 0,
  roots: {
    status: 'loaded',
    keys: [],
    relationRevision: 0,
    appliedRequestId: null,
    total: 0,
    completeness: 'complete',
  },
  children: [],
} as const;

function firstTemplate<C>(
  directives: readonly { readonly templateRef: TemplateRef<C> }[],
): TemplateRef<C> | undefined {
  return directives[0]?.templateRef;
}

function templateMap<C>(
  directives: readonly {
    readonly columnId: () => string;
    readonly templateRef: TemplateRef<C>;
  }[],
): ReadonlyMap<string, TemplateRef<C>> {
  const templates = new Map<string, TemplateRef<C>>();
  for (const directive of directives) {
    const columnId = directive.columnId();
    if (!templates.has(columnId)) templates.set(columnId, directive.templateRef);
  }
  return templates;
}

@Component({
  selector: 'neu-tree-table',
  standalone: true,
  imports: [NeuTreeTableRendererComponent],
  templateUrl: './neu-tree-table.component.html',
  host: {
    class: 'neu-tree-table2',
    '[attr.data-neu-tree-table-version]': '"2"',
  },
})
export class NeuTreeTableComponent<T extends object, K extends NeuTreeTableKey, F extends string> {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private lastDiagnosticSnapshot = '';
  private readonly renderer = viewChild(NeuTreeTableRendererComponent<T, K, F>);

  readonly dataMode: InputSignal<NeuTreeTableDataMode> = input<NeuTreeTableDataMode>('client');
  readonly data: InputSignal<readonly T[]> = input<readonly T[]>([]);
  readonly hierarchy: InputSignal<NeuTreeTableHierarchy<K>> = input<NeuTreeTableHierarchy<K>>(
    EMPTY_HIERARCHY as NeuTreeTableHierarchy<K>,
  );
  readonly query: InputSignal<NeuTreeTableQuery<F>> = input<NeuTreeTableQuery<F>>({
    page: 0,
    pageSize: 25,
    search: '',
    sort: [],
    filters: null,
  });
  readonly columns: InputSignal<readonly NeuTreeTableColumn<T, F>[]> = input<
    readonly NeuTreeTableColumn<T, F>[]
  >([]);
  readonly rowKey: InputSignal<(value: T) => K> = input.required<(value: T) => K>();
  readonly expandedKeys: InputSignal<readonly K[]> = input<readonly K[]>([]);
  readonly selection: InputSignal<NeuTreeTableSelection<K>> = input<NeuTreeTableSelection<K>>({
    kind: 'keys',
    keys: [],
  });
  readonly layout: InputSignal<NeuTreeTableLayoutState> = input<NeuTreeTableLayoutState>({
    order: [],
    hidden: [],
    widths: {},
    pinnedStart: [],
    pinnedEnd: [],
  });
  readonly editState: InputSignal<NeuTreeTableEditState<K>> = input<NeuTreeTableEditState<K>>({
    kind: 'none',
  });
  readonly sortOptions: InputSignal<NeuTreeTableSortOptions> = input<NeuTreeTableSortOptions>({
    mode: 'single',
    removable: true,
    defaultDirection: 'asc',
    resetRootPageOnChange: true,
  });
  readonly filterOptions: InputSignal<NeuTreeTableFilterOptions<T, F>> = input<
    NeuTreeTableFilterOptions<T, F>
  >({ surfaces: [], globalFields: [], predicates: {}, debounceMs: 0, commit: 'immediate' });
  readonly paginationOptions: InputSignal<NeuTreeTablePaginationOptions> =
    input<NeuTreeTablePaginationOptions>({
      enabled: false,
      pageSizeOptions: [],
      position: 'bottom',
      report: 'none',
    });
  readonly selectionOptions: InputSignal<NeuTreeTableSelectionOptions<T>> = input<
    NeuTreeTableSelectionOptions<T>
  >({ mode: 'none' });
  readonly virtualizationOptions: InputSignal<NeuTreeTableVirtualizationOptions> =
    input<NeuTreeTableVirtualizationOptions>({ enabled: false });
  readonly editingOptions: InputSignal<NeuTreeTableEditingOptions<T, K, F>> = input<
    NeuTreeTableEditingOptions<T, K, F>
  >({ mode: 'none' });
  readonly hierarchyOptions: InputSignal<NeuTreeTableHierarchyOptions> =
    input.required<NeuTreeTableHierarchyOptions>();
  readonly rowOptions: InputSignal<NeuTreeTableRowOptions<T>> = input<NeuTreeTableRowOptions<T>>(
    {},
  );
  readonly appearance: InputSignal<NeuTreeTableAppearance> = input<NeuTreeTableAppearance>({
    density: 'normal',
    borders: 'rows',
    striped: false,
    stickyHeader: false,
    responsive: 'contained-scroll',
  });
  readonly labels: InputSignal<NeuTreeTableLabels> = input<NeuTreeTableLabels>({
    ariaLabel: 'Tree table',
    empty: 'No data',
    loading: 'Loading',
    error: 'Unable to load tree data',
    retry: 'Retry',
    expand: 'Expand node',
    collapse: 'Collapse node',
    selection: 'Selection',
    pagination: 'Pagination',
  });
  readonly interactionOptions: InputSignal<NeuTreeTableInteractionOptions> =
    input<NeuTreeTableInteractionOptions>({
      navigation: 'row',
      wrapFocus: false,
      announceChanges: false,
      contextMenuAction: false,
    });
  readonly exportOptions: InputSignal<NeuTreeTableExportOptions> = input<NeuTreeTableExportOptions>(
    {
      formats: [],
      defaultFilename: 'tree-table',
    },
  );

  readonly queryChange: OutputEmitterRef<NeuTreeTableQuery<F>> = output();
  readonly expandedKeysChange: OutputEmitterRef<NeuTreeTableExpandedKeysChange<K>> = output();
  readonly selectionChange: OutputEmitterRef<NeuTreeTableSelectionChange<T, K>> = output();
  readonly layoutChange: OutputEmitterRef<NeuTreeTableLayoutChange> = output();
  readonly editStateChange: OutputEmitterRef<NeuTreeTableEditChange<K>> = output();
  readonly dataRequest: OutputEmitterRef<NeuTreeTableDataRequest<K, F>> = output();
  readonly rangeChange: OutputEmitterRef<NeuTreeTableRangeChange> = output();
  readonly rowAction: OutputEmitterRef<NeuTreeTableRowAction<T, K>> = output();
  readonly editCommit: OutputEmitterRef<NeuTreeTableEditCommit<T, K, F>> = output();
  readonly editCancel: OutputEmitterRef<NeuTreeTableEditCancel<T, K>> = output();
  readonly exportRequest: OutputEmitterRef<NeuTreeTableExportRequest<F>> = output();
  readonly featureError: OutputEmitterRef<NeuTreeTableFeatureError> = output();

  protected readonly captionDirectives = contentChildren(NeuTreeTableCaptionDirective, {
    descendants: true,
  });
  protected readonly toolbarDirectives = contentChildren(NeuTreeTableToolbarDirective, {
    descendants: true,
  });
  protected readonly headerDirectives = contentChildren<NeuTreeTableHeaderDirective<T, F>>(
    NeuTreeTableHeaderDirective,
    { descendants: true },
  );
  protected readonly nodeDirectives = contentChildren<NeuTreeTableNodeDirective<T, K>>(
    NeuTreeTableNodeDirective,
    { descendants: true },
  );
  protected readonly cellDirectives = contentChildren<NeuTreeTableCellDirective<T, K, F>>(
    NeuTreeTableCellDirective,
    { descendants: true },
  );
  protected readonly footerDirectives = contentChildren<NeuTreeTableFooterDirective<T, F>>(
    NeuTreeTableFooterDirective,
    { descendants: true },
  );
  protected readonly summaryDirectives = contentChildren(NeuTreeTableSummaryDirective, {
    descendants: true,
  });
  protected readonly emptyDirectives = contentChildren(NeuTreeTableEmptyDirective, {
    descendants: true,
  });
  protected readonly loadingDirectives = contentChildren(NeuTreeTableLoadingDirective, {
    descendants: true,
  });
  protected readonly errorDirectives = contentChildren(NeuTreeTableErrorDirective, {
    descendants: true,
  });
  protected readonly editorDirectives = contentChildren<NeuTreeTableEditorDirective<T, K, F>>(
    NeuTreeTableEditorDirective,
    { descendants: true },
  );

  protected readonly captionTemplate = computed(() => firstTemplate(this.captionDirectives()));
  protected readonly toolbarTemplate = computed(() => firstTemplate(this.toolbarDirectives()));
  protected readonly headerTemplates = computed(() => templateMap(this.headerDirectives()));
  protected readonly nodeTemplate = computed(() => firstTemplate(this.nodeDirectives()));
  protected readonly cellTemplates = computed(() => templateMap(this.cellDirectives()));
  protected readonly footerTemplates = computed(() => templateMap(this.footerDirectives()));
  protected readonly summaryTemplate = computed(() => firstTemplate(this.summaryDirectives()));
  protected readonly emptyTemplate = computed(() => firstTemplate(this.emptyDirectives()));
  protected readonly loadingTemplate = computed<TemplateRef<NeuTreeTableStateContext> | undefined>(
    () => firstTemplate(this.loadingDirectives()),
  );
  protected readonly errorTemplate = computed<TemplateRef<NeuTreeTableStateContext> | undefined>(
    () => firstTemplate(this.errorDirectives()),
  );

  protected readonly visibleColumns = computed(() => {
    const columns = this.columns();
    const byId = new Map(columns.map((column) => [column.id, column] as const));
    const hidden = new Set(this.layout().hidden);
    const ordered: NeuTreeTableColumn<T, F>[] = [];
    const included = new Set<string>();
    for (const id of this.layout().order) {
      const column = byId.get(id);
      if (!column || hidden.has(id) || included.has(id)) continue;
      included.add(id);
      ordered.push(column);
    }
    for (const column of columns) {
      if (hidden.has(column.id) || included.has(column.id)) continue;
      included.add(column.id);
      ordered.push(column);
    }
    return ordered;
  });
  protected readonly treeColumnValid = computed(() =>
    this.visibleColumns().some((column) => column.id === this.hierarchyOptions().treeColumnId),
  );
  protected readonly rootError = computed(() => {
    const roots = this.hierarchy().roots;
    return roots.status === 'error' ? roots.error : undefined;
  });
  protected readonly normalizedHierarchy = computed(() =>
    normalizeNeuTreeTableHierarchy(this.data(), this.rowKey(), this.hierarchy()),
  );
  protected readonly queryProjection = computed(() =>
    buildNeuTreeTableQueryProjection({
      normalized: this.normalizedHierarchy(),
      query: this.query(),
      columns: this.columns(),
      filterOptions: this.filterOptions(),
      sortOptions: this.sortOptions(),
      dataMode: this.dataMode(),
    }),
  );
  protected readonly projection = computed(() =>
    projectNormalizedNeuTreeTableHierarchy(
      this.normalizedHierarchy(),
      this.expandedKeys(),
      this.queryProjection(),
    ),
  );
  protected readonly selectionModel = computed(() =>
    buildNeuTreeTableSelectionModel(this.projection(), this.selection(), this.selectionOptions()),
  );
  private readonly hierarchyDiagnostics = computed<readonly HierarchyDiagnostic<K>[]>(() => {
    const diagnostics: HierarchyDiagnostic<K>[] = this.normalizedHierarchy().diagnostics.map(
      (diagnostic: TreeDiagnostic<K>) => ({
        code: diagnostic.code,
        fingerprint: diagnostic.fingerprint,
        error: diagnostic,
        key: diagnostic.key,
      }),
    );
    if (!this.treeColumnValid()) {
      const treeColumnId = this.hierarchyOptions().treeColumnId;
      diagnostics.push({
        code: 'invalid-tree-column',
        fingerprint: `invalid-tree-column|${treeColumnId}`,
        error: new Error(`NeuTreeTable 2 cannot resolve treeColumnId: ${treeColumnId}`),
      });
    }
    return diagnostics;
  });
  private readonly hierarchyDiagnosticEffect = effect(() => {
    const diagnostics = this.hierarchyDiagnostics();
    const snapshot = [
      this.hierarchy().hierarchyRevision,
      this.hierarchy().queryRevision,
      ...diagnostics.map((diagnostic) => diagnostic.fingerprint),
    ].join(';');
    untracked(() => {
      if (snapshot === this.lastDiagnosticSnapshot) return;
      this.lastDiagnosticSnapshot = snapshot;
      if (!this.browser) return;
      for (const diagnostic of diagnostics) {
        this.featureError.emit({
          feature: 'hierarchy',
          code: diagnostic.code,
          error: diagnostic.error,
        });
      }
    });
  });

  protected onExpandedKeysProposal(change: NeuTreeTableExpandedKeysChange<K>): void {
    this.expandedKeysChange.emit(change);
  }

  protected onSelectionIntent(intent: TreeSelectionIntent<K>): void {
    const change = proposeNeuTreeTableSelection({
      model: this.selectionModel(),
      selection: this.selection(),
      selectionOptions: this.selectionOptions(),
      intent,
    });
    if (change) this.selectionChange.emit(change);
  }

  protected onQueryProposal(query: NeuTreeTableQuery<F>): void {
    this.queryChange.emit(query);
  }

  scrollTo(target: NeuTreeTableScrollTarget<K>): void {
    void target;
  }

  focus(target: NeuTreeTableFocusTarget<K>): void {
    this.renderer()?.focusTarget(target);
  }

  retryData(target: NeuTreeTableRetryTarget<K>): void {
    void target;
  }

  export(request: NeuTreeTableExportRequest<F>): Promise<NeuTreeTableExportOutcome> {
    void request;
    return Promise.resolve({ status: 'unsupported', reason: 'Export starts in N2-015H.' });
  }
}
