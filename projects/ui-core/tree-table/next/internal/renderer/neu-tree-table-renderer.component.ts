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
  type AfterRenderRef,
  type InputSignal,
  type OutputEmitterRef,
  type TemplateRef,
} from '@angular/core';
import { readNeuFieldValue } from '../../../../internal/neu-field-value-resolver';
import { neuExactKeyToken } from '../../../../internal/neu-exact-key';
import type { TreeProjection, TreeProjectionNode } from '../hierarchy/neu-tree-table-hierarchy';
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
  NeuTreeTableExpandedKeysChange,
  NeuTreeTableFocusTarget,
  NeuTreeTableHeaderContext,
  NeuTreeTableHierarchyOptions,
  NeuTreeTableKey,
  NeuTreeTableLabels,
  NeuTreeTableLayoutState,
  NeuTreeTableNodeContext,
  NeuTreeTableRowOptions,
  NeuTreeTableSelectionOptions,
  NeuTreeTableStateContext,
} from '../../public/neu-tree-table.types';

@Component({
  selector: 'neu-tree-table-private-renderer',
  standalone: true,
  imports: [NgTemplateOutlet],
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
  private readonly focusedKey = signal<K | null>(null);
  private readonly selectionAnchor = signal<K | null>(null);
  private focusedSnapshot: TreeFocusSnapshot<K> | null = null;
  private pendingFocus: AfterRenderRef | null = null;

  readonly projection: InputSignal<TreeProjection<T, K>> = input.required();
  readonly expandedKeys: InputSignal<readonly K[]> = input.required();
  readonly selectionModel: InputSignal<TreeSelectionModel<T, K>> = input.required();
  readonly selectionOptions: InputSignal<NeuTreeTableSelectionOptions<T>> = input.required();
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
  readonly footerTemplates: InputSignal<
    ReadonlyMap<string, TemplateRef<NeuTreeTableHeaderContext<T, F>>>
  > = input.required();
  readonly expandedKeysProposal: OutputEmitterRef<NeuTreeTableExpandedKeysChange<K>> = output();
  readonly selectionIntent: OutputEmitterRef<TreeSelectionIntent<K>> = output();

  protected readonly rows = computed(() => this.projection().visible);
  protected readonly rovingToken = computed(() => {
    const key = this.focusedKey();
    if (key !== null) {
      const token = neuExactKeyToken(key);
      if (this.projection().nodesByToken.has(token)) return token;
    }
    return this.rows()[0]?.token ?? null;
  });
  protected readonly containerTabIndex = computed(() => (this.rows().length === 0 ? 0 : -1));
  private readonly projectionFingerprint = computed(() =>
    this.rows()
      .map((node) => `${node.token}|${node.path.map(neuExactKeyToken).join('/')}`)
      .join(';'),
  );
  private readonly focusReconciliationEffect = effect(() => {
    this.projectionFingerprint();
    untracked(() => this.reconcileFocus());
  });
  protected readonly columnCount = computed(() => Math.max(1, this.columns().length));
  protected readonly ariaMultiselectable = computed(() => {
    const mode = this.selectionOptions().mode;
    return mode === 'multiple' || mode === 'checkbox' ? true : null;
  });
  protected readonly hasFooter = computed(
    () => this.footerTemplates().size > 0 || this.summaryTemplate() !== undefined,
  );
  protected readonly stateContext: NeuTreeTableStateContext = { retry: () => undefined };
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
    this.destroyRef.onDestroy(() => this.cancelPendingFocus());
  }

  protected headerTemplate(columnId: string): TemplateRef<NeuTreeTableHeaderContext<T, F>> | null {
    return this.headerTemplates().get(columnId) ?? null;
  }

  protected cellTemplate(columnId: string): TemplateRef<NeuTreeTableCellContext<T, K, F>> | null {
    return this.cellTemplates().get(columnId) ?? null;
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
      indicator.indeterminate = state.indeterminate;
      return;
    }
    if (this.isInteractiveTarget(target)) return;
    this.focusNode(node);
    const options = this.selectionOptions();
    if (options.mode !== 'none' && options.selectOnRowClick) {
      this.proposeSelection(node, 'row', event);
    }
  }

  protected onBodyKeydown(event: KeyboardEvent): void {
    const node = this.nodeFromEvent(event);
    if (!node || this.isInteractiveTarget(event.target as HTMLElement | null)) return;
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
      proposeNeuTreeTableExpansion(this.expandedKeys(), node.key, node.expanded, source),
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

  private rememberFocus(node: TreeProjectionNode<T, K>): void {
    this.focusedKey.set(node.key);
    this.focusedSnapshot = snapshotNeuTreeTableFocus(node);
  }

  private focusNode(node: TreeProjectionNode<T, K>): void {
    this.cancelPendingFocus();
    this.rememberFocus(node);
    this.rowElement(node)?.focus({ preventScroll: true });
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
    target: { readonly kind: 'container' } | { readonly kind: 'row'; readonly token: string },
  ): void {
    if (!this.browser) return;
    this.pendingFocus = afterNextRender(
      () => {
        this.pendingFocus = null;
        if (target.kind === 'container') this.tableElement()?.focus({ preventScroll: true });
        else {
          const node = this.projection().nodesByToken.get(target.token);
          if (node) this.rowElement(node)?.focus({ preventScroll: true });
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
    const row = this.tableElement()?.tBodies.item(0)?.rows.item(node.logicalVisibleIndex) ?? null;
    return row?.dataset['nodeKey'] === node.token ? row : null;
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
