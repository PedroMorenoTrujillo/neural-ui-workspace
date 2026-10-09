import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  TemplateRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  contentChild,
  effect,
  inject,
  input,
  isDevMode,
  output,
  signal,
} from '@angular/core';
import {
  NeuDragDropGroupDirective,
  NeuDraggableDirective,
  NeuDropZoneDirective,
} from '@neural-ui/core/drag-drop';
import { NeuCheckboxComponent } from '@neural-ui/core/checkbox';
import {
  buildTreeModel,
  deriveTreeCheckboxStates,
  normalizeTreeSearch,
  projectVisibleTree,
  proposeTreeExpansion,
  proposeTreeMove,
  proposeTreeSelection,
  treeSelectedTokens,
  treeToken,
  type TreeCheckboxState,
  type VisibleTreeEntry,
} from './neu-tree.engine';
import type {
  NeuTreeChildrenRequest,
  NeuTreeExpandedKeysChange,
  NeuTreeHierarchy,
  NeuTreeKey,
  NeuTreeMovePosition,
  NeuTreeNode,
  NeuTreeNodeAction,
  NeuTreeNodeMove,
  NeuTreeNodeTemplateContext,
  NeuTreeSelection,
  NeuTreeSelectionChange,
  NeuTreeVirtualization,
} from './neu-tree.types';

@Directive({ selector: 'ng-template[neuTreeNode]', standalone: true })
export class NeuTreeNodeDirective<T, K extends NeuTreeKey = string> {
  constructor(readonly templateRef: TemplateRef<NeuTreeNodeTemplateContext<T, K>>) {}
}

interface TreeDragData<K extends NeuTreeKey> {
  readonly owner: object;
  readonly key: K;
}

interface TreeDropTarget<K extends NeuTreeKey> {
  readonly key: K;
  readonly position: NeuTreeMovePosition;
}

@Component({
  selector: 'neu-tree',
  standalone: true,
  imports: [NgTemplateOutlet, NeuCheckboxComponent, NeuDragDropGroupDirective, NeuDraggableDirective, NeuDropZoneDirective],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './neu-tree.component.html',
  styleUrl: './neu-tree.component.scss',
})
export class NeuTreeComponent<T, K extends NeuTreeKey = string> {
  readonly nodes = input.required<readonly NeuTreeNode<T, K>[]>();
  readonly hierarchy = input.required<NeuTreeHierarchy<K>>();
  readonly expandedKeys = input<readonly K[]>([]);
  readonly selection = input<NeuTreeSelection<K>>({ mode: 'none' });
  readonly searchable = input(false);
  readonly virtualization = input<NeuTreeVirtualization | null>(null);
  readonly reorderable = input(false);
  readonly indentSize = input(18);
  readonly ariaLabel = input('Tree');
  readonly searchLabel = input('Search nodes');
  readonly emptyLabel = input('No nodes available');
  readonly invalidTreeLabel = input('Tree data is invalid');
  readonly expandLabel = input('Expand node');
  readonly collapseLabel = input('Collapse node');
  readonly retryLabel = input('Retry loading');

  readonly expandedKeysChange = output<NeuTreeExpandedKeysChange<K>>();
  readonly selectionChange = output<NeuTreeSelectionChange<K>>();
  readonly childrenRequest = output<NeuTreeChildrenRequest<K>>();
  readonly nodeAction = output<NeuTreeNodeAction<K>>();
  readonly nodeMove = output<NeuTreeNodeMove<K>>();

  protected readonly nodeTpl = contentChild(NeuTreeNodeDirective<T, K>);
  protected readonly dropPositions: readonly NeuTreeMovePosition[] = ['before', 'inside', 'after'];
  protected readonly maxGroupDepth = 32;
  protected readonly dragScope = 'neu-tree';
  protected readonly rejectDrop = (): boolean => false;
  protected readonly searchQuery = signal('');
  protected readonly activeKey = signal<K | null>(null);
  protected readonly scrollTop = signal(0);
  protected readonly dragging = signal(false);
  protected readonly model = computed(() => buildTreeModel(this.nodes(), this.hierarchy()));
  protected readonly visibleNodes = computed(() => projectVisibleTree(this.model(), this.expandedKeys(), this.searchQuery()));
  protected readonly visibleByToken = computed(() => new Map(this.visibleNodes().map((entry) => [treeToken(entry.key), entry])));
  protected readonly rootNodes = computed(() => this.visibleNodes().filter((entry) => entry.parentKey === null));
  protected readonly selectedTokens = computed(() => treeSelectedTokens(this.selection()));
  protected readonly checkboxStates = computed(() => deriveTreeCheckboxStates(this.model(), this.selection()));
  protected readonly virtualItemSize = computed(() => Math.max(1, this.virtualization()?.itemSize ?? 1));
  protected readonly virtualRange = computed(() => {
    const total = this.visibleNodes().length;
    const options = this.virtualization();
    if (!options) return { start: 0, end: total, total };
    const itemSize = Math.max(1, options.itemSize);
    const buffer = Math.max(0, Math.floor(options.buffer ?? 3));
    const viewport = Math.max(1, options.viewportHeight);
    const first = Math.floor(this.scrollTop() / itemSize);
    return { start: Math.max(0, first - buffer), end: Math.min(total, first + Math.ceil(viewport / itemSize) + buffer), total };
  });
  protected readonly renderedNodes = computed(() => {
    const range = this.virtualRange();
    return this.visibleNodes().slice(range.start, range.end);
  });
  protected readonly tabbableKey = computed(() => {
    const visible = this.visibleNodes();
    const active = this.activeKey();
    if (active !== null && visible.some((entry) => treeToken(entry.key) === treeToken(active))) return active;
    return visible[0]?.key ?? null;
  });

  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly requestSeen = new Map<unknown, number>();
  private readonly dragOwner = {};
  private nextRequestId = 0;
  private lastDiagnostic = '';
  private focusPath: K[] = [];
  private hadTreeFocus = false;
  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  private focusFrame: number | null = null;
  private restoringCheckbox = false;

  constructor() {
    effect(() => {
      const issue = this.model().issue;
      const fingerprint = issue ? `${issue.code}:${String(issue.key)}` : '';
      if (fingerprint === this.lastDiagnostic) return;
      this.lastDiagnostic = fingerprint;
      if (issue && isDevMode()) console.error(`[NeuTree] ${issue.code}: ${String(issue.key)}`);
    });
    effect(() => {
      if (!this.browser) return;
      const model = this.model();
      const expanded = new Set(this.expandedKeys().map(treeToken));
      if (model.issue) return;
      // Only an applied, visibly expanded branch can demand children. An
      // expanded descendant behind a collapsed ancestor stays dormant.
      for (const entry of projectVisibleTree(model, this.expandedKeys(), '')) {
        const token = treeToken(entry.key);
        if (!expanded.has(token) || entry.relation?.state !== 'unloaded') {
          if (entry.relation?.state === 'loaded' || entry.relation?.state === 'error') this.requestSeen.delete(token);
          continue;
        }
        if (this.requestSeen.get(token) === model.revision) continue;
        this.requestSeen.set(token, model.revision);
        this.emitChildrenRequest(entry.key, 'expand', model.revision);
      }
    });
    afterRenderEffect(() => {
      if (!this.browser || !this.hadTreeFocus) return;
      const active = this.activeKey();
      const visible = this.visibleNodes();
      if (active === null || visible.some((entry) => treeToken(entry.key) === treeToken(active))) return;
      const fallback = this.focusPath.find((key) => visible.some((entry) => treeToken(entry.key) === treeToken(key))) ?? visible[0]?.key;
      if (fallback === undefined) return;
      this.activeKey.set(fallback);
      this.scheduleFocus(fallback);
    });
    this.destroyRef.onDestroy(() => {
      if (this.typeaheadTimer !== null) clearTimeout(this.typeaheadTimer);
      if (this.focusFrame !== null && this.browser) cancelAnimationFrame(this.focusFrame);
      this.requestSeen.clear();
    });
  }

  protected isSelected(key: K): boolean {
    return this.selectedTokens().has(treeToken(key));
  }

  protected checkboxState(key: K): TreeCheckboxState {
    return this.checkboxStates().get(treeToken(key)) ?? 'unchecked';
  }

  protected checkboxAria(key: K): 'true' | 'false' | 'mixed' {
    const state = this.checkboxState(key);
    return state === 'checked' ? 'true' : state === 'mixed' ? 'mixed' : 'false';
  }

  protected isTabbable(key: K): boolean {
    const active = this.tabbableKey();
    return active !== null && treeToken(active) === treeToken(key);
  }

  protected templateContext(entry: VisibleTreeEntry<T, K>): NeuTreeNodeTemplateContext<T, K> {
    return { $implicit: entry.node.data, key: entry.key, level: entry.level,
      expanded: entry.expanded, selected: this.isSelected(entry.key),
      partial: this.checkboxState(entry.key) === 'mixed', disabled: !!entry.node.disabled,
      loading: entry.loading, hasChildren: entry.hasChildren };
  }

  protected visibleChildren(entry: VisibleTreeEntry<T, K>): readonly VisibleTreeEntry<T, K>[] {
    const visible = this.visibleByToken();
    return entry.loadedChildren.flatMap((key) => {
      const child = visible.get(treeToken(key));
      return child ? [child] : [];
    });
  }

  protected visibleDescendants(entry: VisibleTreeEntry<T, K>): readonly VisibleTreeEntry<T, K>[] {
    const visible = this.visibleNodes();
    let end = entry.visibleIndex + 1;
    while (end < visible.length && visible[end]!.level > entry.level) end += 1;
    return visible.slice(entry.visibleIndex + 1, end);
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.scrollTop.set(0);
  }

  protected onScroll(event: Event): void {
    if (!this.virtualization()) return;
    this.scrollTop.set((event.target as HTMLElement).scrollTop);
  }

  protected onToggleClick(entry: VisibleTreeEntry<T, K>, event: MouseEvent): void {
    event.stopPropagation();
    this.proposeExpansion(entry.key, 'pointer');
  }

  protected onRetryClick(key: K, event: MouseEvent): void {
    event.stopPropagation();
    if (this.model().byKey.get(treeToken(key))?.relation?.state !== 'error') return;
    this.emitChildrenRequest(key, 'retry', this.model().revision);
  }

  protected onCheckboxChange(key: K, control: NeuCheckboxComponent, host: HTMLElement): void {
    if (this.restoringCheckbox) return;
    this.proposeSelection(key, 'pointer');
    const state = this.checkboxState(key);
    this.restoringCheckbox = true;
    try {
      control.checked.set(state === 'checked');
    } finally {
      this.restoringCheckbox = false;
    }
    // Restore rejected proposals even when the parent's binding is unchanged.
    const native = host.querySelector<HTMLInputElement>('input');
    if (native) {
      native.checked = state === 'checked';
      native.indeterminate = state === 'mixed';
    }
  }

  protected onContentClick(entry: VisibleTreeEntry<T, K>, event: MouseEvent): void {
    if (this.isInteractiveDescendant(event.target, event.currentTarget)) return;
    this.activeKey.set(entry.key);
    this.proposeSelection(entry.key, 'pointer');
    this.activate(entry.key);
  }

  protected onNodeFocus(key: K): void {
    this.hadTreeFocus = true;
    this.activeKey.set(key);
    const path: K[] = [];
    let parent = this.model().byKey.get(treeToken(key))?.parentKey ?? null;
    while (parent !== null) {
      path.push(parent);
      parent = this.model().byKey.get(treeToken(parent))?.parentKey ?? null;
    }
    this.focusPath = path;
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && !this.host.contains(next)) this.hadTreeFocus = false;
  }

  protected onNodeKeydown(entry: VisibleTreeEntry<T, K>, event: KeyboardEvent): void {
    // Nested role=group branches bubble through ancestor treeitems. Only the
    // focused item owns its key gesture; controls inside it retain native keys.
    if (event.target !== event.currentTarget) return;
    const visible = this.visibleNodes();
    const index = entry.visibleIndex;
    const rtl = this.browser && getComputedStyle(this.host).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    let nextIndex: number | null = null;
    if (event.key === 'ArrowDown') nextIndex = Math.min(visible.length - 1, index + 1);
    else if (event.key === 'ArrowUp') nextIndex = Math.max(0, index - 1);
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = visible.length - 1;
    else if (event.key === forward) {
      event.preventDefault();
      if (entry.hasChildren && !entry.expanded) this.proposeExpansion(entry.key, 'keyboard');
      else if (entry.expanded && visible[index + 1]?.parentKey !== null &&
        visible[index + 1] && treeToken(visible[index + 1]!.parentKey!) === treeToken(entry.key)) nextIndex = index + 1;
    } else if (event.key === back) {
      event.preventDefault();
      if (entry.hasChildren && entry.expanded && this.expandedKeys().some((key) => treeToken(key) === treeToken(entry.key))) {
        this.proposeExpansion(entry.key, 'keyboard');
      } else if (entry.parentKey !== null) nextIndex = visible.findIndex((item) => treeToken(item.key) === treeToken(entry.parentKey!));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.activate(entry.key);
    } else if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.proposeSelection(entry.key, 'keyboard');
    } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      this.handleTypeahead(event.key, index);
      return;
    } else return;
    if (nextIndex !== null && nextIndex >= 0) {
      event.preventDefault();
      this.focusIndex(nextIndex);
    }
  }

  protected dragData(key: K): TreeDragData<K> {
    return { owner: this.dragOwner, key };
  }

  protected dropTarget(key: K, position: NeuTreeMovePosition): TreeDropTarget<K> {
    return { key, position };
  }

  protected readonly acceptDrop = (data: unknown, target: unknown): boolean => {
    if (!this.reorderable() || !this.isTreeDragData(data) || !this.isTreeDropTarget(target)) return false;
    if (data.owner !== this.dragOwner) return false;
    return proposeTreeMove(this.model(), data.key, target.key, target.position) !== null;
  };

  protected onDrop(event: unknown): void {
    if (!event || typeof event !== 'object') return;
    const candidate = event as { data?: unknown; targetData?: unknown };
    if (!this.acceptDrop(candidate.data, candidate.targetData)) return;
    const data = candidate.data as TreeDragData<K>;
    const target = candidate.targetData as TreeDropTarget<K>;
    const move = proposeTreeMove(this.model(), data.key, target.key, target.position);
    if (move) this.nodeMove.emit(move);
  }

  private proposeExpansion(key: K, source: 'pointer' | 'keyboard'): void {
    const entry = this.model().byKey.get(treeToken(key));
    if (!entry || !entry.relation || entry.relation.state === 'loaded' && entry.relation.keys.length === 0) return;
    this.expandedKeysChange.emit(proposeTreeExpansion(this.expandedKeys(), key, source));
  }

  private proposeSelection(key: K, source: 'pointer' | 'keyboard'): void {
    const change = proposeTreeSelection(this.model(), this.selection(), key, source);
    if (change) this.selectionChange.emit(change);
  }

  private activate(key: K): void {
    const entry = this.model().byKey.get(treeToken(key));
    if (entry && !entry.node.disabled) this.nodeAction.emit({ key });
  }

  private emitChildrenRequest(key: K, reason: 'expand' | 'retry', hierarchyRevision: number): void {
    if (!this.browser || this.destroyRef.destroyed) return;
    this.childrenRequest.emit({ requestId: ++this.nextRequestId, hierarchyRevision, parentKey: key, reason });
  }

  private focusIndex(index: number): void {
    const key = this.visibleNodes()[index]?.key;
    if (key === undefined) return;
    this.activeKey.set(key);
    const options = this.virtualization();
    if (options) {
      const range = this.virtualRange();
      if (index < range.start || index >= range.end) {
        const top = index * this.virtualItemSize();
        const viewport = this.host.querySelector<HTMLElement>('[role="tree"]');
        if (viewport) viewport.scrollTop = top;
        this.scrollTop.set(top);
      }
    }
    this.scheduleFocus(key);
  }

  private scheduleFocus(key: K): void {
    if (!this.browser) return;
    if (this.focusFrame !== null) cancelAnimationFrame(this.focusFrame);
    this.focusFrame = requestAnimationFrame(() => {
      this.focusFrame = null;
      const index = this.visibleNodes().findIndex((entry) => treeToken(entry.key) === treeToken(key));
      if (index < 0) return;
      this.host.querySelector<HTMLElement>(`[data-neu-tree-index="${index}"]`)?.focus({ preventScroll: true });
    });
  }

  private handleTypeahead(character: string, index: number): void {
    this.typeahead += normalizeTreeSearch(character);
    if (this.typeaheadTimer !== null) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => { this.typeahead = ''; this.typeaheadTimer = null; }, 500);
    const visible = this.visibleNodes();
    for (let offset = 1; offset <= visible.length; offset += 1) {
      const candidateIndex = (index + offset) % visible.length;
      if (normalizeTreeSearch(visible[candidateIndex]!.node.label).startsWith(this.typeahead)) {
        this.focusIndex(candidateIndex);
        return;
      }
    }
  }

  private isInteractiveDescendant(target: EventTarget | null, current: EventTarget | null): boolean {
    if (!(target instanceof Element) || !(current instanceof Element) || target === current) return false;
    const interactive = target.closest('input, textarea, select, button, a, [contenteditable], [role="button"], [role="link"]');
    return interactive !== null && current.contains(interactive);
  }

  private isTreeDragData(value: unknown): value is TreeDragData<K> {
    return !!value && typeof value === 'object' && 'owner' in value && 'key' in value;
  }

  private isTreeDropTarget(value: unknown): value is TreeDropTarget<K> {
    return !!value && typeof value === 'object' && 'key' in value && 'position' in value &&
      (value.position === 'before' || value.position === 'inside' || value.position === 'after');
  }
}
