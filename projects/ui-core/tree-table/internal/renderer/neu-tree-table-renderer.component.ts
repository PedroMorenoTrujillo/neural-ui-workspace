import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  Injector,
  input,
  output,
  PLATFORM_ID,
  signal,
  untracked,
  viewChild,
  type AfterRenderRef,
  type InputSignal,
  type OutputEmitterRef,
  type TemplateRef,
} from '@angular/core';
import { readNeuFieldValue } from '../shared/neu-field-value-resolver';
import { neuExactKeyToken } from '../shared/neu-exact-key';
import {
  buildNeuTreeTableEditCommit,
  createNeuTreeTableEditSession,
  reconcileNeuTreeTableEditSession,
  treeEditStateToken,
  updateNeuTreeTableEditDraft,
  validateNeuTreeTableEdit,
  type TreeEditSession,
} from '../editing/neu-tree-table-editing';
import { NeuTreeTableActiveEditorComponent } from '../features/editing/neu-tree-table-active-editor.component';
import { NeuTreeTableCheckboxComponent } from '../features/selection/neu-tree-table-checkbox.component';
import type { TreeProjection, TreeProjectionNode } from '../hierarchy/neu-tree-table-hierarchy';
import {
  areNeuTreeTableRangesEqual,
  neuTreeTableOffsetForIndex,
  normalizeNeuTreeTableItemSize,
  projectNeuTreeTableVirtualWindow,
  type TreeVirtualViewportGeometry,
} from '../virtualization/neu-tree-table-virtualization';
import {
  proposeNeuTreeTableSort,
  readNeuTreeTableFilterValue,
  replaceNeuTreeTableFilter,
} from '../query/neu-tree-table-query';
import {
  moveNeuTreeTableFocus,
  proposeNeuTreeTableExpansion,
  reconcileNeuTreeTableFocus,
  snapshotNeuTreeTableFocus,
  type TreeFocusSnapshot,
} from '../interaction/neu-tree-table-interaction';
import type {
  TreeSelectionIntent,
  TreeSelectionModel,
  TreeSelectionNodeState,
} from '../selection/neu-tree-table-selection';
import type {
  NeuTreeRelationStatus,
  NeuTreeTableAppearance,
  NeuTreeTableCellContext,
  NeuTreeTableColumn,
  NeuTreeTableEditCancel,
  NeuTreeTableEditChange,
  NeuTreeTableEditCommit,
  NeuTreeTableEditingOptions,
  NeuTreeTableEditorContext,
  NeuTreeTableEditState,
  NeuTreeTableExpandedKeysChange,
  NeuTreeTableFilterOptions,
  NeuTreeTableFocusTarget,
  NeuTreeTableHeaderContext,
  NeuTreeTableHierarchyOptions,
  NeuTreeTableInteractionOptions,
  NeuTreeTableKey,
  NeuTreeTableLabels,
  NeuTreeTableLayoutState,
  NeuTreeTableNodeContext,
  NeuTreeTableRowOptions,
  NeuTreeTableRowAction,
  NeuTreeTableSelectionOptions,
  NeuTreeTableQuery,
  NeuTreeTableRangeChange,
  NeuTreeTableSortOptions,
  NeuTreeTableScrollTarget,
  NeuTreeTableStateContext,
  NeuTreeTableVirtualizationOptions,
} from '../../public/neu-tree-table.types';

interface TreeVirtualAnchor {
  readonly token: string;
  readonly intraItemOffset: number;
}

interface PublishedTreeVirtualRange {
  readonly visible: NeuTreeTableRangeChange['visible'];
  readonly render: NeuTreeTableRangeChange['render'];
  readonly projectionRevision: number;
}

function projectionRevision(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

@Component({
  selector: 'neu-tree-table-private-renderer',
  standalone: true,
  imports: [NgTemplateOutlet, NeuTreeTableActiveEditorComponent, NeuTreeTableCheckboxComponent],
  templateUrl: './neu-tree-table-renderer.component.html',
  styleUrl: './neu-tree-table-renderer.component.scss',
  host: { '[attr.data-neu-tree-table-renderer]': '"basic"' },
})
export class NeuTreeTableRendererComponent<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly focusedKey = signal<K | null>(null);
  private readonly selectionAnchor = signal<K | null>(null);
  private focusedSnapshot: TreeFocusSnapshot<K> | null = null;
  private pendingFocus: AfterRenderRef | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private rowActionTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly filterTimers = new Map<F, ReturnType<typeof setTimeout>>();
  private readonly searchDraft = signal<{ readonly value: string; readonly base: string } | null>(
    null,
  );
  private readonly filterDrafts = signal<
    ReadonlyMap<F, { readonly value: string; readonly base: unknown }>
  >(new Map());
  private readonly viewportGeometry = signal<TreeVirtualViewportGeometry>({
    measured: false,
    scrollTop: 0,
    viewportSize: 0,
  });
  private lastPublishedRange: PublishedTreeVirtualRange | null = null;
  private virtualAnchor: TreeVirtualAnchor | null = null;
  private lastReconciledProjectionRevision: number | null = null;
  private readonly editSession = signal<TreeEditSession<T, K, F> | null>(null);
  private closedEditToken: string | null = null;

  readonly projection: InputSignal<TreeProjection<T, K>> = input.required();
  readonly expandedKeys: InputSignal<readonly K[]> = input.required();
  readonly selectionModel: InputSignal<TreeSelectionModel<T, K>> = input.required();
  readonly selectionOptions: InputSignal<NeuTreeTableSelectionOptions<T>> = input.required();
  readonly virtualizationOptions: InputSignal<NeuTreeTableVirtualizationOptions> = input.required();
  readonly editState: InputSignal<NeuTreeTableEditState<K>> = input.required();
  readonly editingOptions: InputSignal<NeuTreeTableEditingOptions<T, K, F>> = input.required();
  readonly interactionOptions: InputSignal<NeuTreeTableInteractionOptions> = input.required();
  readonly query: InputSignal<NeuTreeTableQuery<F>> = input.required();
  readonly sortOptions: InputSignal<NeuTreeTableSortOptions> = input.required();
  readonly filterOptions: InputSignal<NeuTreeTableFilterOptions<T, F>> = input.required();
  readonly columns: InputSignal<readonly NeuTreeTableColumn<T, F>[]> = input.required();
  readonly layout: InputSignal<NeuTreeTableLayoutState> = input.required();
  readonly hierarchyOptions: InputSignal<NeuTreeTableHierarchyOptions> = input.required();
  readonly treeColumnValid: InputSignal<boolean> = input.required();
  readonly rootStatus: InputSignal<NeuTreeRelationStatus> = input.required();
  readonly rootError: InputSignal<unknown> = input();
  readonly rowOptions: InputSignal<NeuTreeTableRowOptions<T>> = input.required();
  readonly appearance: InputSignal<NeuTreeTableAppearance> = input.required();
  readonly labels: InputSignal<NeuTreeTableLabels> = input.required();
  readonly captionTemplate: InputSignal<TemplateRef<unknown> | undefined> = input();
  readonly toolbarTemplate: InputSignal<TemplateRef<unknown> | undefined> = input();
  readonly summaryTemplate: InputSignal<TemplateRef<unknown> | undefined> = input();
  readonly emptyTemplate: InputSignal<TemplateRef<unknown> | undefined> = input();
  readonly loadingTemplate: InputSignal<TemplateRef<NeuTreeTableStateContext> | undefined> =
    input();
  readonly errorTemplate: InputSignal<TemplateRef<NeuTreeTableStateContext> | undefined> = input();
  readonly nodeTemplate: InputSignal<TemplateRef<NeuTreeTableNodeContext<T, K>> | undefined> =
    input();
  readonly headerTemplates: InputSignal<
    ReadonlyMap<string, TemplateRef<NeuTreeTableHeaderContext<T, F>>>
  > = input.required();
  readonly cellTemplates: InputSignal<
    ReadonlyMap<string, TemplateRef<NeuTreeTableCellContext<T, K, F>>>
  > = input.required();
  readonly editorTemplates: InputSignal<
    ReadonlyMap<string, TemplateRef<NeuTreeTableEditorContext<T, K, F>>>
  > = input.required();
  readonly footerTemplates: InputSignal<
    ReadonlyMap<string, TemplateRef<NeuTreeTableHeaderContext<T, F>>>
  > = input.required();
  readonly expandedKeysProposal: OutputEmitterRef<NeuTreeTableExpandedKeysChange<K>> = output();
  readonly selectionIntent: OutputEmitterRef<TreeSelectionIntent<K>> = output();
  readonly queryProposal: OutputEmitterRef<NeuTreeTableQuery<F>> = output();
  readonly retryRequested: OutputEmitterRef<void> = output();
  readonly rangeChanged: OutputEmitterRef<NeuTreeTableRangeChange> = output();
  readonly rowActionIntent: OutputEmitterRef<NeuTreeTableRowAction<T, K>> = output();
  readonly editStateProposal: OutputEmitterRef<NeuTreeTableEditChange<K>> = output();
  readonly editCommitted: OutputEmitterRef<NeuTreeTableEditCommit<T, K, F>> = output();
  readonly editCancelled: OutputEmitterRef<NeuTreeTableEditCancel<T, K>> = output();

  private readonly projectionFingerprint = computed(() =>
    this.projection()
      .visible.map((node) => `${node.token}|${node.path.map(neuExactKeyToken).join('/')}`)
      .join(';'),
  );
  private readonly virtualProjectionRevision = computed(() =>
    projectionRevision(`${this.projection().projectionRevision}|${this.projectionFingerprint()}`),
  );
  protected readonly virtualWindow = computed(() =>
    projectNeuTreeTableVirtualWindow({
      geometry: this.viewportGeometry(),
      total: this.projection().visible.length,
      virtualization: this.virtualizationOptions(),
    }),
  );
  protected readonly rows = computed(() => {
    const projection = this.projection().visible;
    const window = this.virtualWindow();
    return projection.slice(window.render.start, window.render.end);
  });
  protected readonly spacerBefore = computed(() => this.virtualWindow().before);
  protected readonly spacerAfter = computed(() => this.virtualWindow().after);
  protected readonly logicalRowCount = computed(() => this.projection().visible.length);
  protected readonly virtualRowSize = computed(() =>
    this.virtualizationOptions().enabled ? this.virtualWindow().itemSize : null,
  );
  protected readonly rovingToken = computed(() => {
    const key = this.focusedKey();
    if (key !== null) {
      const token = neuExactKeyToken(key);
      if (this.rows().some((node) => node.token === token)) return token;
    }
    return this.rows()[0]?.token ?? null;
  });
  protected readonly containerTabIndex = computed(() => (this.logicalRowCount() === 0 ? 0 : -1));
  private readonly focusReconciliationEffect = effect(() => {
    this.projectionFingerprint();
    this.projection();
    this.editState();
    this.editingOptions();
    this.columns();
    untracked(() => {
      this.reconcileVirtualProjection();
      this.reconcileEditing();
      this.reconcileFocus();
    });
  });
  private readonly viewportLifecycleEffect = effect((onCleanup) => {
    const virtualization = this.virtualizationOptions();
    const viewport = this.viewport()?.nativeElement;
    if (!this.browser || !virtualization.enabled || viewport === undefined) {
      untracked(() => {
        this.viewportGeometry.set({ measured: false, scrollTop: 0, viewportSize: 0 });
        this.lastPublishedRange = null;
        this.virtualAnchor = null;
      });
      return;
    }

    const browser = viewport.ownerDocument.defaultView;
    if (browser === null) return;
    let frame: number | null = null;
    let reason: NeuTreeTableRangeChange['reason'] = 'resize';
    const publish = () => {
      frame = null;
      this.updateViewport(
        {
          measured: viewport.clientHeight > 0,
          scrollTop: viewport.scrollTop,
          viewportSize: viewport.clientHeight,
        },
        reason,
      );
    };
    const schedule = (nextReason: NeuTreeTableRangeChange['reason']) => {
      reason = nextReason;
      if (frame === null) frame = browser.requestAnimationFrame(publish);
    };
    const onScroll = () => schedule('scroll');
    viewport.addEventListener('scroll', onScroll, { passive: true });
    const ResizeObserverConstructor = browser.ResizeObserver;
    const observer =
      ResizeObserverConstructor === undefined
        ? null
        : new ResizeObserverConstructor(() => schedule('resize'));
    observer?.observe(viewport);
    schedule('resize');

    onCleanup(() => {
      viewport.removeEventListener('scroll', onScroll);
      observer?.disconnect();
      if (frame !== null) browser.cancelAnimationFrame(frame);
    });
  });
  protected readonly columnCount = computed(() => Math.max(1, this.columns().length));
  protected readonly ariaMultiselectable = computed(() => {
    const mode = this.selectionOptions().mode;
    return mode === 'multiple' || mode === 'checkbox' ? true : null;
  });
  protected readonly hasFooter = computed(
    () => this.footerTemplates().size > 0 || this.summaryTemplate() !== undefined,
  );
  protected readonly showSearch = computed(() => this.filterOptions().globalFields.length > 0);
  protected readonly showFilterRow = computed(
    () =>
      this.filterOptions().surfaces.includes('row') &&
      this.columns().some((column) => column.filter !== undefined),
  );
  protected readonly stateContext: NeuTreeTableStateContext = {
    retry: () => this.retryRequested.emit(),
  };
  protected readonly emptySelectionState: TreeSelectionNodeState = {
    selected: false,
    checked: false,
    indeterminate: false,
    disabled: true,
    selectableCount: 0,
    selectedCount: 0,
    complete: true,
  };

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.cancelPendingFocus();
      if (this.searchTimer !== null) clearTimeout(this.searchTimer);
      if (this.rowActionTimer !== null) clearTimeout(this.rowActionTimer);
      for (const timer of this.filterTimers.values()) clearTimeout(timer);
      this.filterTimers.clear();
      this.editSession.set(null);
    });
  }

  protected searchValue(): string {
    const draft = this.searchDraft();
    return draft?.base === this.query().search ? draft.value : this.query().search;
  }

  protected filterValue(column: NeuTreeTableColumn<T, F>): string {
    const field = column.filter?.field;
    if (!field) return '';
    const applied = readNeuTreeTableFilterValue(this.query().filters, field);
    const draft = this.filterDrafts().get(field);
    if (draft !== undefined && Object.is(draft.base, applied)) return draft.value;
    return typeof applied === 'string' || typeof applied === 'number' ? String(applied) : '';
  }

  protected ariaSort(column: NeuTreeTableColumn<T, F>): 'ascending' | 'descending' | 'none' | null {
    const field = column.sort?.field;
    if (!field) return null;
    const entry = this.query().sort.find((candidate) => candidate.field === field);
    return entry?.direction === 'asc'
      ? 'ascending'
      : entry?.direction === 'desc'
        ? 'descending'
        : 'none';
  }

  protected sortPriority(column: NeuTreeTableColumn<T, F>): number | null {
    const field = column.sort?.field;
    if (!field) return null;
    const index = this.query().sort.findIndex((candidate) => candidate.field === field);
    return index < 0 ? null : index + 1;
  }

  protected onSort(column: NeuTreeTableColumn<T, F>): void {
    if (!column.sort) return;
    this.queryProposal.emit(
      proposeNeuTreeTableSort(this.query(), column.sort.field, this.sortOptions()),
    );
  }

  protected onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    const base = this.query().search;
    this.searchDraft.set({ value, base });
    if (this.filterOptions().commit === 'immediate') this.scheduleSearch(value, target, base);
  }

  protected onSearchCommit(event: Event): void {
    if (this.filterOptions().commit !== 'explicit') return;
    const draft = this.searchDraft();
    this.commitSearch(
      this.searchValue(),
      event.target as HTMLInputElement,
      draft?.base ?? this.query().search,
    );
  }

  protected onFilterInput(column: NeuTreeTableColumn<T, F>, event: Event): void {
    const field = column.filter?.field;
    if (!field) return;
    const target = event.target as HTMLInputElement;
    const value = target.value;
    const base = readNeuTreeTableFilterValue(this.query().filters, field);
    this.filterDrafts.update((current) => {
      const next = new Map(current);
      next.set(field, { value, base });
      return next;
    });
    if (this.filterOptions().commit === 'immediate') {
      this.scheduleFilter(column, value, target, base);
    }
  }

  protected onFilterCommit(column: NeuTreeTableColumn<T, F>, event: Event): void {
    if (this.filterOptions().commit !== 'explicit' || !column.filter) return;
    const draft = this.filterDrafts().get(column.filter.field);
    this.commitFilter(
      column,
      this.filterValue(column),
      event.target as HTMLInputElement,
      draft?.base ?? readNeuTreeTableFilterValue(this.query().filters, column.filter.field),
    );
  }

  private scheduleSearch(value: string, target: HTMLInputElement, base: string): void {
    if (this.searchTimer !== null) clearTimeout(this.searchTimer);
    const delay = Math.max(0, this.filterOptions().debounceMs);
    if (delay === 0) {
      this.commitSearch(value, target, base);
      return;
    }
    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      this.commitSearch(value, target, base);
    }, delay);
  }

  private scheduleFilter(
    column: NeuTreeTableColumn<T, F>,
    value: string,
    target: HTMLInputElement,
    base: unknown,
  ): void {
    const field = column.filter?.field;
    if (!field) return;
    const existing = this.filterTimers.get(field);
    if (existing !== undefined) clearTimeout(existing);
    const delay = Math.max(0, this.filterOptions().debounceMs);
    if (delay === 0) {
      this.commitFilter(column, value, target, base);
      return;
    }
    this.filterTimers.set(
      field,
      setTimeout(() => {
        this.filterTimers.delete(field);
        this.commitFilter(column, value, target, base);
      }, delay),
    );
  }

  private commitSearch(search: string, target: HTMLInputElement, base: string): void {
    this.searchDraft.set(null);
    if (this.query().search !== base) {
      target.value = this.query().search;
      return;
    }
    if (search === this.query().search) return;
    this.queryProposal.emit({ ...this.query(), page: 0, search });
    target.value = this.query().search;
  }

  private commitFilter(
    column: NeuTreeTableColumn<T, F>,
    value: string,
    target: HTMLInputElement,
    base: unknown,
  ): void {
    const filter = column.filter;
    if (!filter) return;
    this.filterDrafts.update((current) => {
      const next = new Map(current);
      next.delete(filter.field);
      return next;
    });
    const current = readNeuTreeTableFilterValue(this.query().filters, filter.field);
    if (!Object.is(current, base)) {
      target.value =
        typeof current === 'string' || typeof current === 'number' ? String(current) : '';
      return;
    }
    const nextValue = value === '' ? undefined : value;
    if (current === nextValue) return;
    const nextConstraint =
      nextValue === undefined
        ? null
        : ({
            kind: 'condition',
            field: filter.field,
            rule: filter.defaultRule,
            value: nextValue,
          } as const);
    this.queryProposal.emit({
      ...this.query(),
      page: 0,
      filters: replaceNeuTreeTableFilter(this.query().filters, filter.field, nextConstraint),
    });
    const applied = readNeuTreeTableFilterValue(this.query().filters, filter.field);
    target.value =
      typeof applied === 'string' || typeof applied === 'number' ? String(applied) : '';
  }

  protected headerTemplate(columnId: string): TemplateRef<NeuTreeTableHeaderContext<T, F>> | null {
    return this.headerTemplates().get(columnId) ?? null;
  }

  protected cellTemplate(columnId: string): TemplateRef<NeuTreeTableCellContext<T, K, F>> | null {
    return this.cellTemplates().get(columnId) ?? null;
  }

  protected editorTemplate(
    columnId: string,
  ): TemplateRef<NeuTreeTableEditorContext<T, K, F>> | null {
    return this.editorTemplates().get(columnId) ?? null;
  }

  protected footerTemplate(columnId: string): TemplateRef<NeuTreeTableHeaderContext<T, F>> | null {
    return this.footerTemplates().get(columnId) ?? null;
  }

  protected isTreeColumn(column: NeuTreeTableColumn<T, F>): boolean {
    return this.treeColumnValid() && column.id === this.hierarchyOptions().treeColumnId;
  }

  protected headerContext(
    column: NeuTreeTableColumn<T, F>,
    columnIndex: number,
  ): NeuTreeTableHeaderContext<T, F> {
    return { column, columnIndex };
  }

  protected nodeContext(node: TreeProjectionNode<T, K>): NeuTreeTableNodeContext<T, K> {
    const selection = this.selectionState(node);
    return {
      $implicit: node.value,
      value: node.value,
      key: node.key,
      parentKey: node.parentKey,
      depth: node.depth,
      siblingIndex: node.siblingIndex,
      siblingCount: node.siblingCount,
      path: node.path,
      expanded: node.expanded,
      selected: selection.selected,
      indeterminate: selection.indeterminate,
      disabled: selection.disabled,
      childStatus: node.relation.status,
      toggleExpansion: () => this.proposeExpansion(node, 'toggle'),
      toggleSelection: () => this.proposeSelection(node, 'checkbox'),
    };
  }

  protected cellContext(
    node: TreeProjectionNode<T, K>,
    column: NeuTreeTableColumn<T, F>,
    columnIndex: number,
  ): NeuTreeTableCellContext<T, K, F> {
    return {
      ...this.nodeContext(node),
      column,
      columnIndex,
      logicalIndex: node.logicalVisibleIndex,
    };
  }

  protected isEditing(
    node: TreeProjectionNode<T, K>,
    column: NeuTreeTableColumn<T, F>,
  ): boolean {
    const session = this.editSession();
    if (session === null || session.token !== treeEditStateToken(this.editState())) return false;
    if (neuExactKeyToken(session.state.key) !== node.token) return false;
    return session.state.kind === 'row' || session.state.columnId === column.id;
  }

  protected editorContext(
    node: TreeProjectionNode<T, K>,
    column: NeuTreeTableColumn<T, F>,
    columnIndex: number,
  ): NeuTreeTableEditorContext<T, K, F> {
    const session = this.editSession();
    const entry = session?.entries.get(column.id);
    return {
      ...this.cellContext(node, column, columnIndex),
      field: entry?.field ?? null,
      draftValue: entry?.value,
      update: (value) => this.updateEditDraft(column.id, value),
      commit: () => this.commitEdit(column.id),
      cancel: () => this.cancelEdit('gesture'),
    };
  }

  protected editorId(node: TreeProjectionNode<T, K>, column: NeuTreeTableColumn<T, F>): string {
    return `neu-tree-editor-${projectionRevision(`${node.token}|${column.id}`).toString(36)}`;
  }

  protected editDraftValue(columnId: string): unknown {
    return this.editSession()?.entries.get(columnId)?.value;
  }

  protected editError(): string | null {
    return this.editSession()?.validationError ?? null;
  }

  protected updateEditDraft(columnId: string, value: unknown): void {
    const session = this.editSession();
    if (session !== null) this.editSession.set(updateNeuTreeTableEditDraft(session, columnId, value));
  }

  protected commitEdit(columnId: string | null): void {
    const session = this.editSession();
    if (session === null) return;
    const validation = validateNeuTreeTableEdit(session, this.editingOptions(), columnId);
    this.editSession.set(validation.session);
    if (!validation.valid) return;
    this.editCommitted.emit(buildNeuTreeTableEditCommit(validation.session, this.columns()));
    this.closeEditSession('commit');
  }

  protected cancelEdit(reason: 'escape' | 'gesture'): void {
    const session = this.editSession();
    if (session === null) return;
    this.editCancelled.emit({ key: session.state.key, value: session.value, reason });
    this.closeEditSession('cancel');
  }

  protected present(value: T, column: NeuTreeTableColumn<T, F>): string | number | null {
    const projected = readNeuFieldValue(value, column);
    if (projected === null || projected === undefined) return null;
    if (typeof projected === 'string' || typeof projected === 'number') return projected;
    if (typeof projected === 'boolean' || typeof projected === 'bigint') return String(projected);
    return null;
  }

  protected columnWidth(column: NeuTreeTableColumn<T, F>): string | undefined {
    return this.layout().widths[column.id] ?? column.width;
  }

  protected rowClass(node: TreeProjectionNode<T, K>): string | readonly string[] | null {
    return this.rowOptions().className?.(node.value) ?? null;
  }

  protected selectionState(node: TreeProjectionNode<T, K>): TreeSelectionNodeState {
    return this.selectionModel().byToken.get(node.token) ?? this.emptySelectionState;
  }

  protected selectionIndicator(node: TreeProjectionNode<T, K>): 'checkbox' | 'radio' | null {
    const options = this.selectionOptions();
    if (options.mode === 'none' || options.indicator === 'none') return null;
    return options.indicator;
  }

  protected showToggleAll(column: NeuTreeTableColumn<T, F>): boolean {
    const options = this.selectionOptions();
    return (
      this.isTreeColumn(column) &&
      (options.mode === 'multiple' || options.mode === 'checkbox') &&
      options.indicator === 'checkbox'
    );
  }

  protected onBodyFocus(event: FocusEvent): void {
    const node = this.nodeFromEvent(event);
    if (node) this.rememberFocus(node);
  }

  protected onTableClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const sortButton = target?.closest<HTMLButtonElement>('button[data-sort-column]');
    if (sortButton) {
      const column = this.columns().find(
        (candidate) => candidate.id === sortButton.dataset['sortColumn'],
      );
      if (column) this.onSort(column);
      return;
    }
    const headerIndicator = target?.closest<HTMLInputElement>('input[data-selection-toggle-all]');
    if (headerIndicator) {
      this.selectionIntent.emit({ kind: 'toggle-all', source: 'toggle-all' });
      headerIndicator.checked = this.selectionModel().header.checked;
      headerIndicator.indeterminate = this.selectionModel().header.indeterminate;
      return;
    }
    const node = this.nodeFromEvent(event);
    if (!node) return;
    if (target?.closest('button.neu-tree-table2__expander')) {
      this.proposeExpansion(node, 'toggle');
      return;
    }
    const indicator = target?.closest<HTMLInputElement>('input[data-selection-indicator]');
    if (indicator) {
      this.proposeSelection(node, indicator.type === 'radio' ? 'radio' : 'checkbox', event);
      const state = this.selectionState(node);
      indicator.checked = state.selected;
      indicator.indeterminate = indicator.type === 'checkbox' && state.indeterminate;
      return;
    }
    if (this.isInteractiveTarget(target)) return;
    this.focusNode(node);
    this.scheduleClickAction(node);
    const options = this.selectionOptions();
    if (options.mode !== 'none' && options.selectOnRowClick) {
      this.proposeSelection(node, 'row', event);
    }
  }

  protected onCheckboxToggle(node: TreeProjectionNode<T, K>, event: MouseEvent): void {
    this.proposeSelection(node, 'checkbox', event);
  }

  protected onToggleAll(): void {
    this.selectionIntent.emit({ kind: 'toggle-all', source: 'toggle-all' });
  }

  protected onTableDoubleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const node = this.nodeFromEvent(event);
    if (!node || this.isInteractiveTarget(target)) return;
    if (this.rowActionTimer !== null) {
      clearTimeout(this.rowActionTimer);
      this.rowActionTimer = null;
    }
    this.rowActionIntent.emit({ key: node.key, value: node.value, source: 'double-click' });
    this.proposeEditStart(node, this.columnFromEvent(event), 'gesture');
  }

  protected onTableContextMenu(event: MouseEvent): void {
    if (!this.interactionOptions().contextMenuAction) return;
    const target = event.target as HTMLElement | null;
    const node = this.nodeFromEvent(event);
    if (!node || this.isInteractiveTarget(target)) return;
    event.preventDefault();
    this.focusNode(node);
    this.rowActionIntent.emit({ key: node.key, value: node.value, source: 'context-menu' });
  }

  protected onBodyKeydown(event: KeyboardEvent): void {
    const node = this.nodeFromEvent(event);
    if (!node || this.isInteractiveTarget(event.target as HTMLElement | null)) return;
    if (event.key === 'Enter' || event.key === 'F2') {
      const started = this.proposeEditStart(node, this.columnFromEvent(event), 'keyboard');
      if (!started && event.key === 'Enter') {
        this.rowActionIntent.emit({ key: node.key, value: node.value, source: 'keyboard' });
      }
      if (started || event.key === 'Enter') event.preventDefault();
      return;
    }
    const rtl = this.rowDirection(event.target) === 'rtl';
    const logicalForward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const logicalBackward = rtl ? 'ArrowRight' : 'ArrowLeft';
    let target: TreeProjectionNode<T, K> | null = null;

    if (event.key === 'ArrowDown') target = moveNeuTreeTableFocus(this.projection(), node, 'next');
    else if (event.key === 'ArrowUp') {
      target = moveNeuTreeTableFocus(this.projection(), node, 'previous');
    } else if (event.key === 'Home')
      target = moveNeuTreeTableFocus(this.projection(), node, 'first');
    else if (event.key === 'End') target = moveNeuTreeTableFocus(this.projection(), node, 'last');
    else if (event.key === logicalForward) {
      if (node.expandable && !node.expanded) this.proposeExpansion(node, 'keyboard');
      else if (node.expanded) {
        target = moveNeuTreeTableFocus(this.projection(), node, 'first-child');
      }
    } else if (event.key === logicalBackward) {
      if (node.expandable && node.expanded) this.proposeExpansion(node, 'keyboard');
      else target = moveNeuTreeTableFocus(this.projection(), node, 'parent');
    } else if (event.key === ' ' && this.selectionOptions().mode !== 'none') {
      this.proposeSelection(node, 'keyboard', event);
    } else {
      return;
    }

    event.preventDefault();
    if (target) this.focusNode(target);
  }

  scrollToTarget(target: NeuTreeTableScrollTarget<K>): void {
    const viewport = this.viewport()?.nativeElement;
    if (viewport === undefined) return;
    const projection = this.projection();
    let offset: number | null = null;
    if (target.kind === 'offset') {
      offset = Number.isFinite(target.offset) ? Math.max(0, target.offset) : null;
    } else {
      const index =
        target.kind === 'index'
          ? target.index
          : (projection.nodesByToken.get(neuExactKeyToken(target.key))?.logicalVisibleIndex ??
            null);
      if (
        index === null ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= projection.visible.length
      ) {
        return;
      }
      offset = neuTreeTableOffsetForIndex(index, this.virtualWindow().itemSize);
    }
    if (offset === null) return;
    offset = Math.min(
      offset,
      Math.max(
        0,
        this.projection().visible.length * this.virtualWindow().itemSize - viewport.clientHeight,
      ),
    );
    if (target.behavior === 'smooth') {
      viewport.scrollTo({ top: offset, behavior: 'smooth' });
      return;
    }
    viewport.scrollTop = offset;
    this.updateViewport(
      {
        measured: viewport.clientHeight > 0,
        scrollTop: offset,
        viewportSize: viewport.clientHeight,
      },
      'programmatic',
    );
  }

  focusTarget(target: NeuTreeTableFocusTarget<K>): void {
    const projection = this.projection();
    let node: TreeProjectionNode<T, K> | null = null;
    if (target.kind === 'first') node = projection.visible[0] ?? null;
    else if (target.kind === 'last') {
      node = projection.visible[projection.visible.length - 1] ?? null;
    } else if ('key' in target) {
      node = projection.nodesByToken.get(neuExactKeyToken(target.key)) ?? null;
    }
    if (node) this.focusNode(node);
    else if (projection.visible.length === 0) this.scheduleFocus({ kind: 'container' });
  }

  private proposeExpansion(
    node: TreeProjectionNode<T, K>,
    source: NeuTreeTableExpandedKeysChange<K>['source'],
  ): void {
    if (!node.expandable) return;
    this.expandedKeysProposal.emit(
      proposeNeuTreeTableExpansion(this.expandedKeys(), node.key, node.appliedExpanded, source),
    );
  }

  private proposeSelection(
    node: TreeProjectionNode<T, K>,
    source: 'row' | 'radio' | 'checkbox' | 'keyboard',
    event?: MouseEvent | KeyboardEvent,
  ): void {
    const anchorKey = this.selectionAnchor();
    this.selectionIntent.emit({
      kind: 'node',
      key: node.key,
      source,
      anchorKey,
      shiftKey: event?.shiftKey ?? false,
      platformModifier: (event?.ctrlKey ?? false) || (event?.metaKey ?? false),
    });
    if (!(event?.shiftKey ?? false)) this.selectionAnchor.set(node.key);
  }

  private proposeEditStart(
    node: TreeProjectionNode<T, K>,
    column: NeuTreeTableColumn<T, F> | null,
    source: 'gesture' | 'keyboard',
  ): boolean {
    const options = this.editingOptions();
    if (options.mode === 'none') return false;
    if (options.mode === 'cell') {
      if (column?.edit === undefined) return false;
      this.editStateProposal.emit({
        next: { kind: 'cell', key: node.key, columnId: column.id },
        source,
      });
      return true;
    }
    if (!this.columns().some((candidate) => candidate.edit !== undefined)) return false;
    this.editStateProposal.emit({ next: { kind: 'row', key: node.key }, source });
    return true;
  }

  private scheduleClickAction(node: TreeProjectionNode<T, K>): void {
    if (this.rowActionTimer !== null) clearTimeout(this.rowActionTimer);
    this.rowActionTimer = setTimeout(() => {
      this.rowActionTimer = null;
      this.rowActionIntent.emit({ key: node.key, value: node.value, source: 'click' });
    }, 200);
  }

  private reconcileEditing(): void {
    const state = this.editState();
    const token = treeEditStateToken(state);
    if (state.kind === 'none' || token === null || this.editingOptions().mode === 'none') {
      this.closedEditToken = null;
      this.editSession.set(null);
      return;
    }
    if (this.closedEditToken === token) return;
    const node = this.projection().nodesByToken.get(neuExactKeyToken(state.key));
    if (node === undefined) {
      const current = this.editSession();
      const indexed = this.projection().normalized.nodes.get(neuExactKeyToken(state.key));
      const value = current?.value ?? indexed?.value;
      if (value !== undefined) this.editCancelled.emit({ key: state.key, value, reason: 'hidden' });
      this.editStateProposal.emit({ next: { kind: 'none' }, source: 'hidden' });
      this.closedEditToken = token;
      this.editSession.set(null);
      return;
    }
    const current = this.editSession();
    if (current?.token === token) {
      const reconciled = reconcileNeuTreeTableEditSession(current, node.value, this.columns());
      if (reconciled !== current) this.editSession.set(reconciled);
      return;
    }
    const created = createNeuTreeTableEditSession(state, node.value, this.columns());
    this.editSession.set(created);
    if (created !== null) {
      const columnId = state.kind === 'cell' ? state.columnId : created.entries.keys().next().value;
      if (typeof columnId === 'string') {
        this.scheduleFocus({ kind: 'editor', token: node.token, columnId });
      }
    }
  }

  private closeEditSession(source: 'commit' | 'cancel'): void {
    const session = this.editSession();
    if (session === null) return;
    this.closedEditToken = session.token;
    this.editSession.set(null);
    this.editStateProposal.emit({ next: { kind: 'none' }, source });
    this.scheduleFocus({ kind: 'row', token: neuExactKeyToken(session.state.key) });
  }

  private rememberFocus(node: TreeProjectionNode<T, K>): void {
    this.focusedKey.set(node.key);
    this.focusedSnapshot = snapshotNeuTreeTableFocus(node);
  }

  private focusNode(node: TreeProjectionNode<T, K>): void {
    this.cancelPendingFocus();
    this.rememberFocus(node);
    const row = this.rowElement(node);
    if (row) {
      row.focus({ preventScroll: true });
      return;
    }
    if (!this.virtualizationOptions().enabled) return;
    const viewport = this.viewport()?.nativeElement;
    const offset = neuTreeTableOffsetForIndex(
      node.logicalVisibleIndex,
      this.virtualWindow().itemSize,
    );
    if (viewport === undefined || offset === null) return;
    viewport.scrollTop = offset;
    this.updateViewport(
      {
        measured: viewport.clientHeight > 0,
        scrollTop: offset,
        viewportSize: viewport.clientHeight,
      },
      'programmatic',
    );
    this.scheduleFocus({ kind: 'row', token: node.token });
  }

  private updateViewport(
    geometry: TreeVirtualViewportGeometry,
    reason: NeuTreeTableRangeChange['reason'],
  ): void {
    if (!this.virtualizationOptions().enabled || !geometry.measured) return;
    const current = this.viewportGeometry();
    if (
      current.measured !== geometry.measured ||
      current.scrollTop !== geometry.scrollTop ||
      current.viewportSize !== geometry.viewportSize
    ) {
      this.viewportGeometry.set(geometry);
    }
    this.captureVirtualAnchor();
    this.publishVirtualRange(reason);
  }

  private captureVirtualAnchor(): void {
    const window = this.virtualWindow();
    const anchor = this.projection().visible[window.visible.start];
    this.virtualAnchor = anchor
      ? {
          token: anchor.token,
          intraItemOffset: Math.max(
            0,
            this.viewportGeometry().scrollTop - window.visible.start * window.itemSize,
          ),
        }
      : null;
  }

  private publishVirtualRange(reason: NeuTreeTableRangeChange['reason']): void {
    const virtualization = this.virtualizationOptions();
    if (!virtualization.enabled || !this.viewportGeometry().measured) return;
    const window = this.virtualWindow();
    const next: PublishedTreeVirtualRange = {
      visible: window.visible,
      render: window.render,
      projectionRevision: this.virtualProjectionRevision(),
    };
    if (
      this.lastPublishedRange !== null &&
      this.lastPublishedRange.projectionRevision === next.projectionRevision &&
      areNeuTreeTableRangesEqual(this.lastPublishedRange.visible, next.visible) &&
      areNeuTreeTableRangesEqual(this.lastPublishedRange.render, next.render)
    ) {
      return;
    }
    this.lastPublishedRange = next;
    this.rangeChanged.emit({ ...next, reason });
  }

  private reconcileVirtualProjection(): void {
    const revision = this.virtualProjectionRevision();
    if (this.lastReconciledProjectionRevision === revision) return;
    this.lastReconciledProjectionRevision = revision;
    const virtualization = this.virtualizationOptions();
    if (!virtualization.enabled || !this.viewportGeometry().measured) return;
    const viewport = this.viewport()?.nativeElement;
    if (viewport === undefined) return;
    const itemSize = normalizeNeuTreeTableItemSize(virtualization.itemSize);
    const anchor = this.virtualAnchor;
    const retained = anchor ? this.projection().nodesByToken.get(anchor.token) : null;
    const maxOffset = Math.max(
      0,
      this.projection().visible.length * itemSize - viewport.clientHeight,
    );
    const nextOffset = Math.min(
      maxOffset,
      retained
        ? retained.logicalVisibleIndex * itemSize + anchor!.intraItemOffset
        : viewport.scrollTop,
    );
    if (viewport.scrollTop !== nextOffset) viewport.scrollTop = nextOffset;
    this.updateViewport(
      {
        measured: viewport.clientHeight > 0,
        scrollTop: nextOffset,
        viewportSize: viewport.clientHeight,
      },
      'hierarchy',
    );
  }

  private reconcileFocus(): void {
    this.cancelPendingFocus();
    const projection = this.projection();
    const table = this.tableElement();
    const active = this.host.nativeElement.ownerDocument.activeElement;
    const focusWasInside = active !== null && this.host.nativeElement.contains(active);
    const focusWasContainer = active === table;

    if (projection.visible.length === 0) {
      this.focusedKey.set(null);
      this.focusedSnapshot = null;
      if (focusWasInside && !focusWasContainer) this.scheduleFocus({ kind: 'container' });
      return;
    }

    const focusedKey = this.focusedKey();
    if (focusedKey === null) {
      if (focusWasContainer) {
        const first = projection.visible[0];
        if (first) {
          this.rememberFocus(first);
          this.scheduleFocus({ kind: 'row', token: first.token });
        }
      }
      return;
    }

    const retained = projection.nodesByToken.get(neuExactKeyToken(focusedKey));
    if (retained) {
      this.focusedSnapshot = snapshotNeuTreeTableFocus(retained);
      return;
    }

    const resolution = this.focusedSnapshot
      ? reconcileNeuTreeTableFocus(projection, this.focusedSnapshot)
      : { kind: 'row' as const, node: projection.visible[0] as TreeProjectionNode<T, K> };
    if (resolution.kind === 'container') {
      this.focusedKey.set(null);
      this.focusedSnapshot = null;
      if (focusWasInside) this.scheduleFocus(resolution);
      return;
    }
    this.rememberFocus(resolution.node);
    if (focusWasInside) this.scheduleFocus({ kind: 'row', token: resolution.node.token });
  }

  private scheduleFocus(
    target:
      | { readonly kind: 'container' }
      | { readonly kind: 'row'; readonly token: string }
      | { readonly kind: 'editor'; readonly token: string; readonly columnId: string },
  ): void {
    if (!this.browser) return;
    this.pendingFocus = afterNextRender(
      () => {
        this.pendingFocus = null;
        if (target.kind === 'container') this.tableElement()?.focus({ preventScroll: true });
        else if (target.kind === 'row') {
          const node = this.projection().nodesByToken.get(target.token);
          if (node) this.rowElement(node)?.focus({ preventScroll: true });
        } else {
          const node = this.projection().nodesByToken.get(target.token);
          const row = node ? this.rowElement(node) : null;
          const cells = row?.querySelectorAll<HTMLElement>('td[data-column-id]') ?? [];
          const cell = [...cells].find(
            (candidate) => candidate.dataset['columnId'] === target.columnId,
          );
          cell?.querySelector<HTMLElement>('[data-tree-editor]')?.focus({ preventScroll: true });
        }
      },
      { injector: this.injector },
    );
  }

  private cancelPendingFocus(): void {
    this.pendingFocus?.destroy();
    this.pendingFocus = null;
  }

  private tableElement(): HTMLTableElement | null {
    return this.host.nativeElement.querySelector<HTMLTableElement>('table[role="treegrid"]');
  }

  private rowElement(node: TreeProjectionNode<T, K>): HTMLTableRowElement | null {
    return (
      [
        ...(this.tableElement()?.querySelectorAll<HTMLTableRowElement>('tr[data-node-key]') ?? []),
      ].find((candidate) => candidate.dataset['nodeKey'] === node.token) ?? null
    );
  }

  private isInteractiveTarget(target: HTMLElement | null): boolean {
    const interactive =
      target?.closest?.(
        'button,input,textarea,select,a[href],[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"]',
      ) ?? null;
    return interactive !== null;
  }

  private nodeFromEvent(event: Event): TreeProjectionNode<T, K> | null {
    const target = event.target as HTMLElement | null;
    const row = target?.closest<HTMLTableRowElement>('tr[data-node-key]') ?? null;
    if (!row || !this.host.nativeElement.contains(row)) return null;
    const index = Number(row.dataset['logicalIndex']);
    if (!Number.isInteger(index) || index < 0) return null;
    const node = this.projection().visible[index] ?? null;
    return node?.token === row.dataset['nodeKey'] ? node : null;
  }

  private columnFromEvent(event: Event): NeuTreeTableColumn<T, F> | null {
    const target = event.target as HTMLElement | null;
    const cell = target?.closest<HTMLElement>('td[data-column-id]') ?? null;
    if (cell === null || !this.host.nativeElement.contains(cell)) return null;
    return this.columns().find((column) => column.id === cell.dataset['columnId']) ?? null;
  }

  private rowDirection(target: EventTarget | null): 'ltr' | 'rtl' {
    const row = target as HTMLElement | null;
    const declaredDirection = row?.closest<HTMLElement>('[dir]')?.getAttribute('dir');
    if (declaredDirection === 'rtl') return 'rtl';
    if (declaredDirection === 'ltr') return 'ltr';
    return row?.ownerDocument.defaultView?.getComputedStyle(row).direction === 'rtl'
      ? 'rtl'
      : 'ltr';
  }
}
