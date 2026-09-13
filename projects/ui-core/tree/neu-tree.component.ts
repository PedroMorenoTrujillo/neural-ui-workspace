import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NeuCheckboxComponent } from '@neural-ui/core/checkbox';
import {
  NeuDragDropGroupDirective,
  NeuDraggableDirective,
  NeuDropZoneDirective,
  type NeuDropAccept,
  type NeuDropEvent,
} from '@neural-ui/core/drag-drop';
import {
  NeuTreeNavigationController,
  type NeuTreeNavigationItem,
  walkNeuTreeDepthFirst,
} from '@neural-ui/core/internal';
import { NeuInputComponent } from '@neural-ui/core/input';

export interface NeuTreeNode<T = unknown> {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  children?: NeuTreeNode<T>[];
  disabled?: boolean;
  expanded?: boolean;
  selectable?: boolean;
  /** `false` keeps a node expandable before lazy children have been supplied. */
  leaf?: boolean;
  /** Consumer-owned loading state for this node. */
  loading?: boolean;
  draggable?: boolean;
  droppable?: boolean;
  data?: T;
}

export type NeuTreeSelectionMode = 'single' | 'multiple' | 'checkbox';

export interface NeuTreeNodeTemplateContext<T = unknown> {
  $implicit: NeuTreeNode<T>;
  node: NeuTreeNode<T>;
  level: number;
  selected: boolean;
  partial: boolean;
  expanded: boolean;
  loading: boolean;
  toggle: () => void;
  toggleSelection: () => void;
}

export interface NeuTreeLazyRequest<T = unknown> {
  readonly node: NeuTreeNode<T>;
  readonly reason: 'expand' | 'retry';
  readonly requestId: number;
}

export interface NeuTreeContextRequest<T = unknown> {
  readonly node: NeuTreeNode<T>;
  readonly selection: readonly NeuTreeNode<T>[];
  readonly originalEvent: MouseEvent | KeyboardEvent;
}

export interface NeuTreeVirtualRange {
  readonly start: number;
  readonly end: number;
  readonly total: number;
}

export type NeuTreeDropPosition = 'before' | 'inside' | 'after';
const NEU_TREE_DROP_POSITIONS: readonly NeuTreeDropPosition[] = ['before', 'inside', 'after'];

export interface NeuTreeDragData<T = unknown> {
  readonly treeId: string;
  readonly node: NeuTreeNode<T>;
  readonly parent: NeuTreeNode<T> | null;
  readonly index: number;
}

export interface NeuTreeDropTarget<T = unknown> {
  readonly node: NeuTreeNode<T>;
  readonly position: NeuTreeDropPosition;
}

export interface NeuTreeDropEvent<T = unknown> {
  readonly dragNode: NeuTreeNode<T>;
  readonly targetNode: NeuTreeNode<T>;
  readonly position: NeuTreeDropPosition;
  readonly sourceTreeId: string;
  readonly targetTreeId: string;
  readonly sourceParent: NeuTreeNode<T> | null;
  readonly targetParent: NeuTreeNode<T> | null;
  readonly sourceIndex: number;
  readonly targetIndex: number;
  readonly interaction: 'pointer' | 'keyboard';
  readonly originalEvent: MouseEvent | TouchEvent | KeyboardEvent | null;
}

interface NeuTreeFlatEntry<T = unknown> {
  readonly node: NeuTreeNode<T>;
  readonly level: number;
  readonly parentId?: string;
  readonly posInSet: number;
  readonly setSize: number;
}

type CheckboxVisualState = 'checked' | 'mixed' | 'unchecked';

@Directive({ selector: 'ng-template[neuTreeNode]' })
export class NeuTreeNodeDirective<T = unknown> {
  constructor(readonly templateRef: TemplateRef<NeuTreeNodeTemplateContext<T>>) {}
}

@Component({
  selector: 'neu-tree',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    NeuCheckboxComponent,
    NeuInputComponent,
    NeuDragDropGroupDirective,
    NeuDraggableDirective,
    NeuDropZoneDirective,
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="neu-tree"
      [attr.aria-busy]="loading() ? 'true' : null"
      neuDragDropGroup
      [neuDragDropGroupDisabled]="!dragDrop()"
    >
      @if (searchable()) {
        <neu-input
          class="neu-tree__search-input"
          type="search"
          size="sm"
          [floatingLabel]="false"
          [placeholder]="searchPlaceholder()"
          (valueChange)="onSearchValue($event)"
        />
      }

      @if (showSelectAll() && isCheckboxMode()) {
        <div class="neu-tree__select-all">
          <neu-checkbox
            [checked]="selectAllState() === 'checked'"
            [indeterminate]="selectAllState() === 'mixed'"
            [disabled]="eligibleNodeCount() === 0"
            [label]="selectAllLabel()"
            [ariaLabel]="selectAllLabel()"
            (checkedChange)="toggleSelectAll($event)"
          />
        </div>
      }

      @if (loading() && !renderNodes().length) {
        <div class="neu-tree__empty" role="status">{{ loadingLabel() }}</div>
      } @else if (flatVisibleNodes().length) {
        @if (virtualScroll()) {
          <div
            class="neu-tree__virtual"
            role="tree"
            [attr.aria-label]="ariaLabel()"
            [attr.aria-multiselectable]="isMultiMode() ? 'true' : null"
            [style.height.px]="itemSize() * visibleRows()"
            (scroll)="onVirtualScroll($event)"
          >
            <div aria-hidden="true" [style.height.px]="virtualRange().start * itemSize()"></div>
            @for (entry of virtualEntries(); track entry.node.id) {
              <ng-container
                [ngTemplateOutlet]="treeItem"
                [ngTemplateOutletContext]="{ $implicit: entry, flat: true }"
              />
            }
            <div
              aria-hidden="true"
              [style.height.px]="(virtualRange().total - virtualRange().end) * itemSize()"
            ></div>
          </div>
        } @else {
          <ul
            class="neu-tree__list neu-tree__list--root"
            role="tree"
            [attr.aria-label]="ariaLabel()"
            [attr.aria-multiselectable]="isMultiMode() ? 'true' : null"
          >
            <ng-container
              [ngTemplateOutlet]="treeNodes"
              [ngTemplateOutletContext]="{ $implicit: visibleNodes(), level: 1 }"
            />
          </ul>
        }
      } @else {
        <div class="neu-tree__empty">{{ emptyLabel() }}</div>
      }
    </div>

    <ng-template #treeNodes let-nodes let-level="level">
      @for (node of nodes; track node.id; let position = $index; let count = $count) {
        <li class="neu-tree__branch" role="none">
          <ng-container
            [ngTemplateOutlet]="treeItem"
            [ngTemplateOutletContext]="{
              $implicit: { node, level, posInSet: position + 1, setSize: count },
              flat: false,
            }"
          />
          @if (node.children?.length && isRenderedExpanded(node)) {
            <ul class="neu-tree__list" role="group">
              <ng-container
                [ngTemplateOutlet]="treeNodes"
                [ngTemplateOutletContext]="{ $implicit: node.children ?? [], level: level + 1 }"
              />
            </ul>
          }
        </li>
      }
    </ng-template>

    <ng-template #treeItem let-entry let-flat="flat">
      <div
        class="neu-tree__node"
        [class.neu-tree__node--flat]="flat"
        role="treeitem"
        [style.height.px]="flat ? itemSize() : null"
        [attr.aria-level]="entry.level"
        [attr.aria-posinset]="entry.posInSet"
        [attr.aria-setsize]="entry.setSize"
        [attr.aria-expanded]="isExpandable(entry.node) ? isRenderedExpanded(entry.node) : null"
        [attr.aria-selected]="
          canSelect(entry.node) && !isCheckboxMode() ? isSelected(entry.node.id) : null
        "
        [attr.aria-checked]="
          canSelect(entry.node) && isCheckboxMode() ? ariaChecked(entry.node.id) : null
        "
        [attr.aria-disabled]="entry.node.disabled ? 'true' : null"
        [attr.aria-busy]="isLoading(entry.node) ? 'true' : null"
        [tabIndex]="tabIndexForNode(entry.node)"
        [neuDraggable]="dragData(entry.node)"
        [neuDragScope]="dragScope()"
        [neuDraggableDisabled]="entry.node.disabled || entry.node.draggable === false"
        [neuDragPointer]="dragDrop()"
        [neuDragKeyboard]="dragDrop()"
        [neuDragTabIndex]="tabIndexForNode(entry.node)"
        neuDragRole="treeitem"
        [neuDragAriaLabel]="dragDrop() ? 'Move ' + entry.node.label : null"
        [attr.data-neu-tree-index]="navigationIndex(entry.node.id)"
        [attr.data-neu-tree-node-id]="entry.node.id"
        (focus)="setActiveNode(entry.node.id)"
        (keydown)="onNodeKeydown(entry.node, $event)"
        (contextmenu)="onNodeContext(entry.node, $event)"
      >
        @if (dragDrop()) {
          @for (position of dropPositions; track position) {
            <span
              [class]="'neu-tree__drop neu-tree__drop--' + position"
              [neuDropZone]="dropTarget(entry.node, position)"
              [neuDropScope]="dragScope()"
              [neuDropAccept]="acceptDrop"
              [neuDropAriaLabel]="'Place ' + position + ' ' + entry.node.label"
              (drop)="onTreeDrop($event)"
            ></span>
          }
        }
        <ng-container
          [ngTemplateOutlet]="nodeRow"
          [ngTemplateOutletContext]="{ $implicit: entry.node, level: entry.level }"
        />
      </div>
    </ng-template>

    <ng-template #nodeRow let-node let-level="level">
      <div
        class="neu-tree__row"
        [class.neu-tree__row--selected]="isSelected(node.id)"
        [class.neu-tree__row--disabled]="node.disabled"
        [style.padding-inline-start.px]="(level - 1) * indentSize() + 6"
      >
        @if (isExpandable(node)) {
          <button
            class="neu-tree__toggle"
            type="button"
            tabindex="-1"
            [disabled]="node.disabled || isLoading(node)"
            [class.neu-tree__toggle--open]="isRenderedExpanded(node)"
            [attr.aria-label]="isRenderedExpanded(node) ? collapseLabel() : expandLabel()"
            (click)="toggleNode(node, $event)"
          >
            @if (isLoading(node)) {
              <span class="neu-tree__spinner" aria-hidden="true"></span>
            } @else {
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m7 5 6 5-6 5" />
              </svg>
            }
          </button>
        } @else {
          <span class="neu-tree__toggle neu-tree__toggle--placeholder" aria-hidden="true"></span>
        }
        @if (canSelect(node) && isCheckboxMode()) {
          <neu-checkbox
            class="neu-tree__checkbox"
            [checked]="checkboxState(node.id) === 'checked'"
            [indeterminate]="checkboxState(node.id) === 'mixed'"
            [disabled]="node.disabled"
            [ariaLabel]="'Select ' + node.label"
            (click)="$event.stopPropagation()"
            (checkedChange)="onCheckboxChange(node, $event)"
          />
        }
        <button
          class="neu-tree__content"
          type="button"
          tabindex="-1"
          [disabled]="node.disabled"
          (click)="activateNode(node)"
        >
          @if (nodeTpl()) {
            <ng-container
              [ngTemplateOutlet]="nodeTpl()!.templateRef"
              [ngTemplateOutletContext]="templateContext(node, level)"
            />
          } @else {
            <span class="neu-tree__main"
              ><span class="neu-tree__label">{{ node.label }}</span>
              @if (node.badge) {
                <span class="neu-tree__badge">{{ node.badge }}</span>
              }
            </span>
            @if (node.description) {
              <span class="neu-tree__description">{{ node.description }}</span>
            }
          }
        </button>
      </div>
    </ng-template>
  `,
  styleUrl: './neu-tree.component.scss',
})
export class NeuTreeComponent<T = unknown> {
  protected readonly dropPositions = NEU_TREE_DROP_POSITIONS;
  readonly nodeTpl = contentChild(NeuTreeNodeDirective<T>);
  readonly nodes = input<NeuTreeNode<T>[]>([]);
  readonly selectable = input(false);
  readonly searchable = input(false);
  readonly selectionMode = input<NeuTreeSelectionMode>('single');
  /** Presence makes selection consumer-authoritative. */
  readonly selection = input<readonly NeuTreeNode<T>[] | undefined>(undefined);
  /** Presence makes expansion consumer-authoritative. */
  readonly expandedKeys = input<readonly string[] | undefined>(undefined);
  readonly showSelectAll = input(false);
  readonly lazy = input(false);
  readonly loading = input(false);
  readonly loadingKeys = input<readonly string[]>([]);
  readonly virtualScroll = input(false);
  readonly itemSize = input(44);
  readonly visibleRows = input(10);
  readonly virtualOverscan = input(3);
  readonly dragDrop = input(false);
  readonly treeId = input('tree');
  readonly dragScope = input<string | readonly string[]>('neu-tree');
  readonly indentSize = input(18);
  readonly ariaLabel = input('Tree');
  readonly searchPlaceholder = input('Search nodes');
  readonly emptyLabel = input('No nodes available');
  readonly loadingLabel = input('Loading nodes');
  readonly selectAllLabel = input('Select all nodes');
  readonly expandLabel = input('Expand node');
  readonly collapseLabel = input('Collapse node');

  readonly selectionChange = output<NeuTreeNode<T>[]>();
  readonly expansionChange = output<string[]>();
  readonly nodeClick = output<NeuTreeNode<T>>();
  readonly lazyRequest = output<NeuTreeLazyRequest<T>>();
  readonly contextRequest = output<NeuTreeContextRequest<T>>();
  readonly virtualRangeChange = output<NeuTreeVirtualRange>();
  readonly nodeDrop = output<NeuTreeDropEvent<T>>();

  readonly searchQuery = signal('');
  private readonly internalExpandedKeys = signal<Set<string>>(new Set());
  private readonly internalSelectedKeys = signal<Set<string>>(new Set());
  private readonly virtualScrollTop = signal(0);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly navigation = new NeuTreeNavigationController();
  private readonly pendingLazy = new Map<string, NeuTreeNode<T>>();
  private requestId = 0;
  private previousNodes: readonly NeuTreeNode<T>[] | null = null;
  private focusAfterRender = false;
  private navigationSnapshot: readonly NeuTreeNavigationItem[] | null = null;

  readonly renderNodes = computed(() => this.cycleSafeProjection(this.nodes()));
  readonly effectiveExpandedKeys = computed(
    () => new Set(this.expandedKeys() ?? this.internalExpandedKeys()),
  );
  readonly effectiveSelectedKeys = computed(() =>
    this.selection() === undefined
      ? this.internalSelectedKeys()
      : new Set(this.selection()!.map((node) => node.id)),
  );
  readonly visibleNodes = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    return query ? this.filterNodes(this.renderNodes(), query) : this.renderNodes();
  });
  readonly allEntries = computed(() =>
    walkNeuTreeDepthFirst(this.renderNodes(), (node) => node.children ?? []),
  );
  readonly traversalIndex = computed(() => {
    const entries = this.allEntries();
    const entryIndexById = new Map<string, number>();
    const entryIndexByNode = new Map<NeuTreeNode<T>, number>();
    const duplicateIds = new Set<string>();
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index];
      if (entryIndexById.has(entry.node.id)) duplicateIds.add(entry.node.id);
      else entryIndexById.set(entry.node.id, index);
      entryIndexByNode.set(entry.node, index);
    }
    return { entries, entryIndexById, entryIndexByNode, duplicateIds };
  });
  readonly loadingKeySet = computed(() => new Set(this.loadingKeys()));
  readonly checkboxStates = computed(() => this.deriveCheckboxStates(this.effectiveSelectedKeys()));
  readonly flatVisibleNodes = computed<NeuTreeFlatEntry<T>[]>(() =>
    walkNeuTreeDepthFirst(this.visibleNodes(), (node) => node.children ?? [], {
      shouldDescend: (entry) =>
        !!entry.node.children?.length && this.isRenderedExpanded(entry.node),
    }).map((entry) => ({
      node: entry.node,
      level: entry.level + 1,
      ...(entry.parent ? { parentId: entry.parent.id } : {}),
      posInSet: entry.index + 1,
      setSize: entry.setSize,
    })),
  );
  readonly navigationIndexById = computed(
    () => new Map(this.flatVisibleNodes().map((entry, index) => [entry.node.id, index])),
  );
  readonly navigationItems = computed<readonly NeuTreeNavigationItem[]>(() =>
    this.flatVisibleNodes().map((entry) => ({
      key: entry.node.id,
      label: entry.node.label,
      level: entry.level,
      parentKey: entry.parentId,
      disabled: entry.node.disabled,
      hasChildren: this.isExpandable(entry.node),
      expanded: this.isRenderedExpanded(entry.node),
    })),
  );
  readonly virtualRange = computed<NeuTreeVirtualRange>(() => {
    const total = this.flatVisibleNodes().length;
    const overscan = Math.max(0, this.virtualOverscan());
    const viewportRows = Math.max(1, this.visibleRows());
    const rawStart = Math.floor(this.virtualScrollTop() / Math.max(1, this.itemSize()));
    const start = Math.max(0, Math.min(rawStart - overscan, total));
    return { start, end: Math.min(total, rawStart + viewportRows + overscan), total };
  });
  readonly virtualEntries = computed(() => {
    const range = this.virtualRange();
    return this.flatVisibleNodes().slice(range.start, range.end);
  });
  readonly eligibleNodeCount = computed(
    () => this.allEntries().filter(({ node }) => this.canSelect(node) && !node.disabled).length,
  );
  readonly selectAllState = computed<CheckboxVisualState>(() => {
    const eligible = this.allEntries().filter(({ node }) => this.canSelect(node) && !node.disabled);
    if (!eligible.length) return 'unchecked';
    const checked = eligible.filter(({ node }) => this.checkboxState(node.id) === 'checked').length;
    return checked === eligible.length ? 'checked' : checked === 0 ? 'unchecked' : 'mixed';
  });

  constructor() {
    effect(() => {
      const nodes = this.nodes();
      if (nodes === this.previousNodes) return;
      this.previousNodes = nodes;
      const entries = walkNeuTreeDepthFirst(nodes, (node) => node.children ?? [], {
        sharedReferences: 'shallow',
      });
      const valid = new Set(entries.map(({ node }) => node.id));
      if (this.expandedKeys() === undefined) {
        const next = new Set([...this.internalExpandedKeys()].filter((key) => valid.has(key)));
        for (const { node } of entries) if (node.expanded) next.add(node.id);
        this.internalExpandedKeys.set(next);
      }
      if (this.selection() === undefined)
        this.internalSelectedKeys.set(
          new Set([...this.internalSelectedKeys()].filter((key) => valid.has(key))),
        );
      for (const [key, pendingNode] of this.pendingLazy) {
        const current = entries.find(({ node }) => node.id === key)?.node;
        if (
          !current ||
          current !== pendingNode ||
          current.children?.length ||
          current.leaf === true
        )
          this.pendingLazy.delete(key);
      }
    });
    afterRenderEffect(() => {
      this.flatVisibleNodes();
      this.reconcileNavigation();
      for (const checkbox of this.host.querySelectorAll<HTMLInputElement>(
        '.neu-tree__checkbox input',
      ))
        checkbox.tabIndex = -1;
      if (this.focusAfterRender) {
        this.focusAfterRender = false;
        this.focusActiveNode();
      }
    });
  }

  isMultiMode(): boolean {
    return this.selectable() && this.selectionMode() !== 'single';
  }
  isCheckboxMode(): boolean {
    return this.selectionMode() === 'checkbox' || this.selectionMode() === 'multiple';
  }
  isExpandable(node: NeuTreeNode<T>): boolean {
    return !!node.children?.length || (this.lazy() && node.leaf === false);
  }
  hasChildren(node: NeuTreeNode<T>): boolean {
    return this.isExpandable(node);
  }
  canSelect(node: NeuTreeNode<T>): boolean {
    return this.selectable() && node.selectable !== false;
  }
  isExpanded(nodeId: string): boolean {
    return this.effectiveExpandedKeys().has(nodeId);
  }
  isRenderedExpanded(node: NeuTreeNode<T>): boolean {
    return this.searchQuery().trim()
      ? (node.expanded ?? this.isExpanded(node.id))
      : this.isExpanded(node.id);
  }
  isSelected(nodeId: string): boolean {
    return this.effectiveSelectedKeys().has(nodeId);
  }
  isLoading(node: NeuTreeNode<T>): boolean {
    return node.loading === true || this.loadingKeySet().has(node.id);
  }
  checkboxState(nodeId: string): CheckboxVisualState {
    if (this.selectionMode() === 'multiple')
      return this.isSelected(nodeId) ? 'checked' : 'unchecked';
    return this.checkboxStates().get(nodeId) ?? 'unchecked';
  }
  ariaChecked(nodeId: string): 'true' | 'false' | 'mixed' {
    const state = this.checkboxState(nodeId);
    return state === 'checked' ? 'true' : state === 'mixed' ? 'mixed' : 'false';
  }
  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onSearchValue(value: string): void {
    this.searchQuery.set(value);
  }

  toggleNode(node: NeuTreeNode<T>, event?: Event): void {
    event?.stopPropagation();
    if (node.disabled || !this.isExpandable(node) || this.isLoading(node)) return;
    const next = new Set(this.effectiveExpandedKeys());
    if (next.has(node.id)) next.delete(node.id);
    else next.add(node.id);
    if (this.expandedKeys() === undefined) this.internalExpandedKeys.set(next);
    this.expansionChange.emit([...next]);
    if (next.has(node.id)) this.emitLazyRequest(node, 'expand');
  }

  retryLazy(node: NeuTreeNode<T>): void {
    this.pendingLazy.delete(node.id);
    this.emitLazyRequest(node, 'retry');
  }
  activateNode(node: NeuTreeNode<T>): void {
    if (node.disabled) return;
    this.nodeClick.emit(node);
    if (this.canSelect(node)) this.updateSelection(node, !this.isSelected(node.id));
  }
  onCheckboxChange(node: NeuTreeNode<T>, value: boolean | Event): void {
    this.updateSelection(
      node,
      typeof value === 'boolean' ? value : (value.target as HTMLInputElement).checked,
    );
  }

  toggleSelectAll(checked: boolean): void {
    const next = new Set(this.effectiveSelectedKeys());
    for (const { node } of this.allEntries())
      if (this.canSelect(node) && !node.disabled)
        checked ? next.add(node.id) : next.delete(node.id);
    this.commitSelection(next);
  }

  onNodeContext(node: NeuTreeNode<T>, event: MouseEvent): void {
    if (node.disabled) return;
    event.preventDefault();
    this.contextRequest.emit({
      node,
      selection: this.collectSelectedNodes(this.nodes(), this.effectiveSelectedKeys()),
      originalEvent: event,
    });
  }

  onVirtualScroll(event: Event): void {
    this.virtualScrollTop.set((event.currentTarget as HTMLElement).scrollTop);
    this.virtualRangeChange.emit(this.virtualRange());
  }
  dragData(node: NeuTreeNode<T>): NeuTreeDragData<T> {
    const index =
      this.traversalIndex().entryIndexByNode.get(node) ??
      this.traversalIndex().entryIndexById.get(node.id);
    const entry = index == null ? undefined : this.allEntries()[index];
    return {
      treeId: this.treeId(),
      node,
      parent: entry?.parent ?? null,
      index: entry?.index ?? -1,
    };
  }
  dropTarget(node: NeuTreeNode<T>, position: NeuTreeDropPosition): NeuTreeDropTarget<T> {
    return { node, position };
  }
  readonly acceptDrop: NeuDropAccept<NeuTreeDragData<T>, NeuTreeDropTarget<T>> = (data, target) => {
    if (
      !data ||
      !target ||
      target.node.disabled ||
      target.node.droppable === false ||
      data.node.disabled ||
      data.node.draggable === false
    )
      return false;
    if (data.node.id === target.node.id) return false;
    const index = this.traversalIndex();
    if (index.duplicateIds.has(data.node.id) || index.duplicateIds.has(target.node.id))
      return false;
    if (data.treeId === this.treeId()) {
      const sourceIndex =
        index.entryIndexByNode.get(data.node) ?? index.entryIndexById.get(data.node.id);
      let targetIndex =
        index.entryIndexByNode.get(target.node) ?? index.entryIndexById.get(target.node.id);
      while (sourceIndex != null && targetIndex != null) {
        if (sourceIndex === targetIndex) return false;
        targetIndex = index.entries[targetIndex].parentEntryIndex ?? undefined;
      }
    } else if (index.entryIndexById.has(data.node.id)) return false;
    return target.position !== 'inside' || target.node.leaf !== true;
  };

  onTreeDrop(event: NeuDropEvent<unknown, NeuTreeDropTarget<T>>): void {
    const data = event.data as NeuTreeDragData<T>;
    const target = event.targetData;
    if (!this.acceptDrop(data, target)) return;
    const targetEntryIndex =
      this.traversalIndex().entryIndexByNode.get(target.node) ??
      this.traversalIndex().entryIndexById.get(target.node.id);
    const targetEntry = targetEntryIndex == null ? undefined : this.allEntries()[targetEntryIndex];
    const targetParent = target.position === 'inside' ? target.node : (targetEntry?.parent ?? null);
    const targetIndex =
      target.position === 'inside'
        ? (target.node.children?.length ?? 0)
        : (targetEntry?.index ?? 0) + (target.position === 'after' ? 1 : 0);
    this.nodeDrop.emit({
      dragNode: data.node,
      targetNode: target.node,
      position: target.position,
      sourceTreeId: data.treeId,
      targetTreeId: this.treeId(),
      sourceParent: data.parent,
      targetParent,
      sourceIndex: data.index,
      targetIndex,
      interaction: event.interaction,
      originalEvent: event.originalEvent,
    });
  }
  templateContext(node: NeuTreeNode<T>, level: number): NeuTreeNodeTemplateContext<T> {
    return {
      $implicit: node,
      node,
      level,
      selected: this.isSelected(node.id),
      partial: this.checkboxState(node.id) === 'mixed',
      expanded: this.isRenderedExpanded(node),
      loading: this.isLoading(node),
      toggle: () => this.toggleNode(node),
      toggleSelection: () => this.updateSelection(node, !this.isSelected(node.id)),
    };
  }
  navigationIndex(nodeId: string): number {
    return this.navigationIndexById().get(nodeId) ?? -1;
  }
  tabIndexForNode(node: NeuTreeNode<T>): 0 | -1 {
    this.reconcileNavigation();
    return this.navigation.tabIndexFor(this.navigationIndex(node.id));
  }
  setActiveNode(nodeId: string): void {
    this.reconcileNavigation();
    this.navigation.setActiveKey(nodeId);
  }

  onNodeKeydown(node: NeuTreeNode<T>, event: KeyboardEvent): void {
    if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
      event.preventDefault();
      this.contextRequest.emit({
        node,
        selection: this.collectSelectedNodes(this.nodes(), this.effectiveSelectedKeys()),
        originalEvent: event,
      });
      return;
    }
    this.reconcileNavigation();
    this.navigation.setActiveKey(node.id);
    const direction = this.host.ownerDocument.defaultView?.getComputedStyle(this.host).direction;
    this.navigation.configure({ direction: direction === 'rtl' ? 'rtl' : 'ltr' });
    const result = this.navigation.handleKey(event);
    if (!result.handled) return;
    if (result.action === 'expand' && !this.isRenderedExpanded(node)) {
      this.focusAfterRender = true;
      this.toggleNode(node, event);
    } else if (result.action === 'collapse' && this.isRenderedExpanded(node)) {
      this.focusAfterRender = true;
      this.toggleNode(node, event);
    } else if (result.action === 'activate') this.activateNode(node);
    else this.materializeAndFocus(result.activeIndex);
  }

  private updateSelection(node: NeuTreeNode<T>, checked: boolean): void {
    if (node.disabled || !this.canSelect(node)) return;
    const next = new Set(this.effectiveSelectedKeys());
    if (this.selectionMode() === 'single') {
      next.clear();
      if (checked) next.add(node.id);
    } else if (this.selectionMode() === 'checkbox') {
      const entries = walkNeuTreeDepthFirst([node], (candidate) => candidate.children ?? [], {
        sharedReferences: 'shallow',
        shouldDescend: (entry) =>
          entry.node === node || (!entry.node.disabled && this.canSelect(entry.node)),
      });
      for (const entry of entries)
        if (!entry.node.disabled && this.canSelect(entry.node))
          checked ? next.add(entry.node.id) : next.delete(entry.node.id);
      this.reconcileAncestorSelection(next);
    } else {
      checked ? next.add(node.id) : next.delete(node.id);
    }
    this.commitSelection(next);
  }

  private reconcileAncestorSelection(next: Set<string>): void {
    const entries = this.allEntries();
    const states = this.deriveCheckboxStates(next);
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entry = entries[index];
      if (entry.node.disabled || !this.canSelect(entry.node)) continue;
      const children = entry.childEntryIndices
        .map((child) => entries[child].node)
        .filter((child) => !child.disabled && this.canSelect(child));
      if (!children.length) continue;
      if (children.every((child) => states.get(child.id) === 'checked')) next.add(entry.node.id);
      else next.delete(entry.node.id);
    }
  }

  private deriveCheckboxStates(selected: Set<string>): Map<string, CheckboxVisualState> {
    const entries = this.allEntries();
    const states = new Map<string, CheckboxVisualState>();
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entry = entries[index];
      const node = entry.node;
      if (node.disabled || !this.canSelect(node)) {
        states.set(node.id, 'unchecked');
        continue;
      }
      const children = entry.childEntryIndices
        .map((child) => entries[child].node)
        .filter((child) => !child.disabled && this.canSelect(child));
      if (!children.length) {
        states.set(node.id, selected.has(node.id) ? 'checked' : 'unchecked');
        continue;
      }
      const childStates = children.map((child) => states.get(child.id) ?? 'unchecked');
      states.set(
        node.id,
        childStates.every((state) => state === 'checked')
          ? 'checked'
          : childStates.every((state) => state === 'unchecked') && !selected.has(node.id)
            ? 'unchecked'
            : 'mixed',
      );
    }
    return states;
  }

  private commitSelection(next: Set<string>): void {
    if (this.selection() === undefined) this.internalSelectedKeys.set(next);
    this.selectionChange.emit(this.collectSelectedNodes(this.nodes(), next));
  }
  private collectExpandedKeys(nodes: readonly NeuTreeNode<T>[]): Set<string> {
    return new Set(
      walkNeuTreeDepthFirst(nodes, (node) => node.children ?? [], {
        sharedReferences: 'shallow',
      })
        .filter(({ node }) => node.expanded)
        .map(({ node }) => node.id),
    );
  }
  private emitLazyRequest(node: NeuTreeNode<T>, reason: 'expand' | 'retry'): void {
    if (
      !this.lazy() ||
      node.leaf !== false ||
      node.children?.length ||
      node.loading ||
      this.loadingKeySet().has(node.id) ||
      this.pendingLazy.get(node.id) === node
    )
      return;
    this.pendingLazy.set(node.id, node);
    this.lazyRequest.emit({ node, reason, requestId: ++this.requestId });
  }
  private collectSelectedNodes(
    nodes: readonly NeuTreeNode<T>[],
    selected: Set<string>,
  ): NeuTreeNode<T>[] {
    return walkNeuTreeDepthFirst(nodes, (node) => node.children ?? [], {
      sharedReferences: 'shallow',
    })
      .filter(({ node }) => selected.has(node.id))
      .map(({ node }) => node);
  }

  private filterNodes(nodes: NeuTreeNode<T>[], query: string): NeuTreeNode<T>[] {
    const entries = walkNeuTreeDepthFirst(nodes, (node) => node.children ?? [], {
      sharedReferences: 'shallow',
    });
    const projected = new Map<number, NeuTreeNode<T>>();
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entry = entries[index];
      const children = entry.childEntryIndices.flatMap((child) =>
        projected.has(child) ? [projected.get(child)!] : [],
      );
      const node = entry.node;
      const matches =
        node.label.toLocaleLowerCase().includes(query) ||
        node.description?.toLocaleLowerCase().includes(query) ||
        node.badge?.toLocaleLowerCase().includes(query);
      if (matches || children.length)
        projected.set(index, {
          ...node,
          children,
          expanded: children.length ? true : node.expanded,
        });
    }
    return entries.flatMap((entry, index) =>
      entry.parentEntryIndex == null && projected.has(index) ? [projected.get(index)!] : [],
    );
  }

  private cycleSafeProjection(nodes: readonly NeuTreeNode<T>[]): NeuTreeNode<T>[] {
    const entries = walkNeuTreeDepthFirst(nodes, (node) => node.children ?? [], {
      sharedReferences: 'shallow',
    });
    const projected = new Map<number, NeuTreeNode<T>>();
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entry = entries[index];
      const children = entry.childEntryIndices.map((child) => projected.get(child)!);
      const original = entry.node.children;
      const unchanged =
        original == null ||
        (original.length === children.length &&
          original.every((child, childIndex) => child === children[childIndex]));
      projected.set(index, unchanged ? entry.node : { ...entry.node, children });
    }
    return entries.flatMap((entry, index) =>
      entry.parentEntryIndex == null ? [projected.get(index)!] : [],
    );
  }

  private reconcileNavigation(): void {
    const items = this.navigationItems();
    if (items === this.navigationSnapshot) return;
    this.navigationSnapshot = items;
    this.navigation.setItems(items);
  }

  private materializeAndFocus(index: number): void {
    if (this.virtualScroll() && index >= 0) {
      const range = this.virtualRange();
      if (index < range.start || index >= range.end) {
        const viewport = this.host.querySelector<HTMLElement>('.neu-tree__virtual');
        const scrollTop = Math.max(0, index * this.itemSize());
        if (viewport) viewport.scrollTop = scrollTop;
        this.virtualScrollTop.set(scrollTop);
        this.focusAfterRender = true;
        return;
      }
    }
    this.focusActiveNode();
  }

  private focusActiveNode(): void {
    this.host
      .querySelector<HTMLElement>(`[data-neu-tree-index="${this.navigation.index}"]`)
      ?.focus({ preventScroll: true });
  }
}
