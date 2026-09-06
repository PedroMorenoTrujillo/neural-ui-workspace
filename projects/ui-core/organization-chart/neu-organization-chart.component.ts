import { isPlatformBrowser, NgClass, NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  PLATFORM_ID,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import type { NeuTreeNode } from '@neural-ui/core/tree';
import { walkNeuTreeDepthFirst } from '@neural-ui/core/internal';

export interface NeuOrganizationChartNode<T = unknown> extends Omit<NeuTreeNode<T>, 'children'> {
  children?: NeuOrganizationChartNode<T>[];
  /** Overrides the chart-level collapsible setting for this node. */
  collapsible?: boolean;
  /** Optional consumer class on the node card. */
  className?: string;
  /** Optional consumer styles on the node card. */
  style?: Readonly<Record<string, string | number | null | undefined>>;
}

export type NeuOrganizationChartSelectionMode = 'single' | 'multiple' | 'checkbox';
export type NeuOrganizationChartGap = number | readonly [number, number];

export interface NeuOrganizationChartNodeEvent<T = unknown> {
  readonly originalEvent: Event | null;
  readonly node: NeuOrganizationChartNode<T>;
}

export interface NeuOrganizationChartNodeTemplateContext<T = unknown> {
  readonly $implicit: NeuOrganizationChartNode<T>;
  readonly data: T | undefined;
  readonly index: number;
  readonly level: number;
  readonly path: readonly number[];
  readonly parent: NeuOrganizationChartNode<T> | null;
  readonly leaf: boolean;
  readonly selectable: boolean;
  readonly selected: boolean;
  readonly partialSelected: boolean;
  readonly collapsible: boolean;
  readonly collapsed: boolean;
  readonly expanded: boolean;
  readonly toggle: (event?: Event) => void;
  readonly select: (event?: Event) => void;
}

export interface NeuOrganizationChartToggleIconTemplateContext<T = unknown> {
  readonly $implicit: NeuOrganizationChartNode<T>;
  readonly expanded: boolean;
  readonly collapsed: boolean;
}

export interface NeuOrganizationChartToggleTemplateContext<
  T = unknown,
> extends NeuOrganizationChartToggleIconTemplateContext<T> {
  readonly childCount: number;
  readonly toggle: (event?: Event) => void;
}

export interface NeuOrganizationChartSelectionIndicatorTemplateContext<T = unknown> {
  readonly $implicit: NeuOrganizationChartNode<T>;
  readonly selected: boolean;
  readonly partialSelected: boolean;
}

interface DeepRenderEntry<T> {
  readonly node: NeuOrganizationChartNode<T>;
  readonly parent: NeuOrganizationChartNode<T> | null;
  readonly index: number;
  readonly level: number;
  readonly path: readonly number[];
  readonly trackBy: string;
}

@Directive({
  selector: 'ng-template[neuOrganizationChartNode]',
  standalone: true,
})
export class NeuOrganizationChartNodeDirective<T = unknown> {
  readonly neuOrganizationChartNode = input<readonly NeuOrganizationChartNode<T>[] | null>(null);
  constructor(readonly templateRef: TemplateRef<NeuOrganizationChartNodeTemplateContext<T>>) {}

  static ngTemplateContextGuard<T>(
    _directive: NeuOrganizationChartNodeDirective<T>,
    context: unknown,
  ): context is NeuOrganizationChartNodeTemplateContext<T> {
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuOrganizationChartToggleIcon]',
  standalone: true,
})
export class NeuOrganizationChartToggleIconDirective<T = unknown> {
  readonly neuOrganizationChartToggleIcon = input<readonly NeuOrganizationChartNode<T>[] | null>(
    null,
  );
  constructor(
    readonly templateRef: TemplateRef<NeuOrganizationChartToggleIconTemplateContext<T>>,
  ) {}

  static ngTemplateContextGuard<T>(
    _directive: NeuOrganizationChartToggleIconDirective<T>,
    context: unknown,
  ): context is NeuOrganizationChartToggleIconTemplateContext<T> {
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuOrganizationChartToggle]',
  standalone: true,
})
export class NeuOrganizationChartToggleDirective<T = unknown> {
  readonly neuOrganizationChartToggle = input<readonly NeuOrganizationChartNode<T>[] | null>(null);
  constructor(readonly templateRef: TemplateRef<NeuOrganizationChartToggleTemplateContext<T>>) {}

  static ngTemplateContextGuard<T>(
    _directive: NeuOrganizationChartToggleDirective<T>,
    context: unknown,
  ): context is NeuOrganizationChartToggleTemplateContext<T> {
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuOrganizationChartSelectionIndicator]',
  standalone: true,
})
export class NeuOrganizationChartSelectionIndicatorDirective<T = unknown> {
  readonly neuOrganizationChartSelectionIndicator = input<
    readonly NeuOrganizationChartNode<T>[] | null
  >(null);
  constructor(
    readonly templateRef: TemplateRef<NeuOrganizationChartSelectionIndicatorTemplateContext<T>>,
  ) {}

  static ngTemplateContextGuard<T>(
    _directive: NeuOrganizationChartSelectionIndicatorDirective<T>,
    context: unknown,
  ): context is NeuOrganizationChartSelectionIndicatorTemplateContext<T> {
    return true;
  }
}

/** Accessible hierarchical node-card visualization with CSS-owned tree connectors. */
@Component({
  selector: 'neu-organization-chart',
  standalone: true,
  imports: [NgClass, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-organization-chart',
  },
  template: `
    <div
      #viewport
      class="neu-organization-chart__viewport"
      [style.--neu-organization-chart-gap-x.px]="gapX()"
      [style.--neu-organization-chart-gap-y.px]="gapY()"
      (pointerdown)="markUserNavigation()"
      (wheel)="markUserNavigation()"
    >
      @if (renderNodes().length) {
        <ul
          class="neu-organization-chart__tree neu-organization-chart__tree--root"
          [class.neu-organization-chart__tree--flat]="deepSafeRender()"
          role="tree"
          [attr.aria-label]="ariaLabelledBy() ? null : ariaLabel()"
          [attr.aria-labelledby]="ariaLabelledBy()"
          [attr.aria-describedby]="ariaDescribedBy()"
          [attr.aria-multiselectable]="
            selectionMode() === 'multiple' || selectionMode() === 'checkbox' ? 'true' : null
          "
        >
          @if (deepSafeRender()) {
            @for (entry of deepRenderEntries(); track entry.trackBy) {
              <li
                class="neu-organization-chart__branch"
                role="treeitem"
                [tabIndex]="canSelect(entry.node) ? 0 : -1"
                [attr.aria-level]="entry.level + 1"
                [attr.aria-expanded]="hasChildren(entry.node) ? !isCollapsed(entry.node) : null"
                [attr.aria-selected]="canSelect(entry.node) ? isSelected(entry.node) : null"
                [attr.aria-checked]="
                  selectionMode() === 'checkbox' && canSelect(entry.node)
                    ? isPartialSelected(entry.node)
                      ? 'mixed'
                      : isSelected(entry.node)
                    : null
                "
                [attr.aria-disabled]="entry.node.disabled ? 'true' : null"
                [style.padding-inline-start.rem]="deepIndent(entry.level)"
                (keydown)="onNodeKeydown(entry.node, $event)"
              >
                <ng-container
                  [ngTemplateOutlet]="nodeCard"
                  [ngTemplateOutletContext]="{
                    node: entry.node,
                    parent: entry.parent,
                    index: entry.index,
                    level: entry.level + 1,
                    path: entry.path,
                  }"
                />
              </li>
            }
          } @else {
            <ng-container
              [ngTemplateOutlet]="branches"
              [ngTemplateOutletContext]="{
                $implicit: renderNodes(),
                level: 1,
                parent: null,
                path: [],
              }"
            />
          }
        </ul>
      } @else {
        <div class="neu-organization-chart__empty" role="status">{{ emptyLabel() }}</div>
      }
    </div>

    <ng-template #branches let-items let-level="level" let-parent="parent" let-parentPath="path">
      @for (node of items; track node.id; let index = $index) {
        <li
          class="neu-organization-chart__branch"
          role="treeitem"
          [tabIndex]="canSelect(node) ? 0 : -1"
          [attr.aria-level]="level"
          [attr.aria-expanded]="hasChildren(node) ? !isCollapsed(node) : null"
          [attr.aria-selected]="canSelect(node) ? isSelected(node) : null"
          [attr.aria-checked]="
            selectionMode() === 'checkbox' && canSelect(node)
              ? isPartialSelected(node)
                ? 'mixed'
                : isSelected(node)
              : null
          "
          [attr.aria-disabled]="node.disabled ? 'true' : null"
          (keydown)="onNodeKeydown(node, $event)"
        >
          <ng-container
            [ngTemplateOutlet]="nodeCard"
            [ngTemplateOutletContext]="{
              node,
              parent,
              index,
              level,
              path: parentPath.concat(index),
            }"
          />

          @if (hasChildren(node) && !isCollapsed(node)) {
            <ul class="neu-organization-chart__tree" role="group">
              <ng-container
                [ngTemplateOutlet]="branches"
                [ngTemplateOutletContext]="{
                  $implicit: node.children ?? [],
                  level: level + 1,
                  parent: node,
                  path: parentPath.concat(index),
                }"
              />
            </ul>
          }
        </li>
      }
    </ng-template>

    <ng-template
      #nodeCard
      let-node="node"
      let-parent="parent"
      let-index="index"
      let-level="level"
      let-path="path"
    >
      <div
        class="neu-organization-chart__node"
        [ngClass]="node.className"
        [style]="node.style ?? null"
        [class.neu-organization-chart__node--selected]="isSelected(node)"
        [class.neu-organization-chart__node--partial]="isPartialSelected(node)"
        [class.neu-organization-chart__node--disabled]="node.disabled"
      >
        <div
          class="neu-organization-chart__node-action"
          [class.neu-organization-chart__node-action--selectable]="canSelect(node)"
          (click)="onNodeContentClick(node, $event)"
        >
          @if (selectionMode() === 'checkbox' && canSelect(node)) {
            @if (selectionIndicatorTemplate(); as template) {
              <ng-container
                [ngTemplateOutlet]="template.templateRef"
                [ngTemplateOutletContext]="selectionIndicatorContext(node)"
              />
            } @else {
              <span
                class="neu-organization-chart__checkbox"
                [class.neu-organization-chart__checkbox--checked]="isSelected(node)"
                [class.neu-organization-chart__checkbox--partial]="isPartialSelected(node)"
                aria-hidden="true"
              >
                @if (isPartialSelected(node)) {
                  <span>−</span>
                } @else if (isSelected(node)) {
                  <span>✓</span>
                }
              </span>
            }
          }

          @if (nodeTemplate(); as template) {
            <ng-container
              [ngTemplateOutlet]="template.templateRef"
              [ngTemplateOutletContext]="nodeTemplateContext(node, parent, index, level, path)"
            />
          } @else {
            <span class="neu-organization-chart__node-copy">
              <span class="neu-organization-chart__label">{{ node.label }}</span>
              @if (node.description) {
                <span class="neu-organization-chart__description">{{ node.description }}</span>
              }
              @if (node.badge) {
                <span class="neu-organization-chart__badge">{{ node.badge }}</span>
              }
            </span>
          }
        </div>

        @if (canCollapse(node)) {
          @if (toggleTemplate(); as template) {
            <ng-container
              [ngTemplateOutlet]="template.templateRef"
              [ngTemplateOutletContext]="toggleTemplateContext(node)"
            />
          } @else {
            <button
              class="neu-organization-chart__toggle"
              type="button"
              [attr.aria-label]="isCollapsed(node) ? expandLabel() : collapseLabel()"
              [attr.aria-expanded]="!isCollapsed(node)"
              (click)="toggleNode(node, $event)"
            >
              @if (toggleIconTemplate(); as template) {
                <ng-container
                  [ngTemplateOutlet]="template.templateRef"
                  [ngTemplateOutletContext]="toggleIconTemplateContext(node)"
                />
              } @else {
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m5 8 5 5 5-5" />
                </svg>
              }
            </button>
          }
        }
      </div>
    </ng-template>
  `,
  styleUrl: './neu-organization-chart.component.scss',
})
export class NeuOrganizationChartComponent<T = unknown> {
  readonly nodes = input<readonly NeuOrganizationChartNode<T>[]>([]);
  readonly selectionMode = input<NeuOrganizationChartSelectionMode | null>(null);
  readonly selectable = input(true);
  readonly collapsible = input(false);
  readonly gap = input<NeuOrganizationChartGap>(40);
  readonly ariaLabel = input<string | null>('Organization chart');
  readonly ariaLabelledBy = input<string | null>(null);
  readonly ariaDescribedBy = input<string | null>(null);
  readonly emptyLabel = input('No organization nodes available');
  readonly expandLabel = input('Expand node');
  readonly collapseLabel = input('Collapse node');

  /** Controlled selected node ids. Undefined starts with no selected nodes. */
  readonly selectionKeys = model<readonly string[] | undefined>(undefined);
  /** Controlled collapsed ids. Undefined derives initial state from `node.expanded === false`. */
  readonly collapsedKeys = model<readonly string[] | undefined>(undefined);

  readonly nodeSelect = output<NeuOrganizationChartNodeEvent<T>>();
  readonly nodeUnselect = output<NeuOrganizationChartNodeEvent<T>>();
  readonly nodeExpand = output<NeuOrganizationChartNodeEvent<T>>();
  readonly nodeCollapse = output<NeuOrganizationChartNodeEvent<T>>();

  /* v8 ignore start -- Angular signal-query factories; projected node/toggle behavior is covered. */
  protected readonly nodeTemplate = contentChild(NeuOrganizationChartNodeDirective<T>);
  protected readonly toggleIconTemplate = contentChild(NeuOrganizationChartToggleIconDirective<T>);
  protected readonly toggleTemplate = contentChild(NeuOrganizationChartToggleDirective<T>);
  protected readonly selectionIndicatorTemplate = contentChild(
    NeuOrganizationChartSelectionIndicatorDirective<T>,
  );
  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  /* v8 ignore stop */

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private lastFramedNodes: readonly NeuOrganizationChartNode<T>[] | null = null;
  private userNavigated = false;

  constructor() {
    afterRenderEffect(() => {
      const nodes = this.nodes();
      if (!this.isBrowser || !nodes.length || nodes === this.lastFramedNodes || this.userNavigated)
        return;
      this.lastFramedNodes = nodes;
      this.centerInitialView();
    });
  }

  /** Frames the primary root once after measurable browser layout. */
  private centerInitialView(): void {
    const viewport = this.viewport()?.nativeElement;
    if (!viewport || viewport.scrollWidth <= viewport.clientWidth + 1) return;
    const root = viewport.querySelector<HTMLElement>(
      '.neu-organization-chart__tree--root > .neu-organization-chart__branch > .neu-organization-chart__node',
    );
    if (!root) return;
    const viewportBounds = viewport.getBoundingClientRect();
    const rootBounds = root.getBoundingClientRect();
    viewport.scrollBy({
      left:
        rootBounds.left + rootBounds.width / 2 - (viewportBounds.left + viewportBounds.width / 2),
      behavior: 'instant',
    });
  }

  protected markUserNavigation(): void {
    this.userNavigated = true;
  }

  protected readonly gapX = computed(() => {
    const value = this.gap();
    return Array.isArray(value) ? value[0] : value;
  });
  protected readonly gapY = computed(() => {
    const value = this.gap();
    return Array.isArray(value) ? (value[1] ?? value[0]) : value;
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly renderNodes = computed(() => this.cycleSafeProjection(this.nodes()));
  private readonly renderTraversal = computed(() =>
    walkNeuTreeDepthFirst(this.renderNodes(), (node) => node.children ?? []),
  );
  protected readonly deepSafeRender = computed(() =>
    this.renderTraversal().some((entry) => entry.level >= 512),
  );
  protected readonly deepRenderEntries = computed<readonly DeepRenderEntry<T>[]>(() => {
    if (!this.deepSafeRender()) return [];
    const entries = walkNeuTreeDepthFirst(this.renderNodes(), (node) => node.children ?? [], {
      shouldDescend: ({ node }) => !this.isCollapsed(node),
    });
    const paths = new Map<number, readonly number[]>();
    return entries.map((entry, entryIndex) => {
      const parentPath =
        entry.parentEntryIndex == null ? [] : (paths.get(entry.parentEntryIndex) ?? []);
      const path = [...parentPath, entry.index];
      paths.set(entryIndex, path);
      return {
        node: entry.node,
        parent: entry.parent,
        index: entry.index,
        level: entry.level,
        path,
        trackBy: path.join('.'),
      };
    });
  });
  private readonly selectedSet = computed(() => new Set(this.selectionKeys() ?? []));
  private readonly collapsedSet = computed(
    () => new Set(this.collapsedKeys() ?? this.defaultCollapsedKeys(this.renderNodes())),
  );

  /** Selects or unselects one node according to the active selection mode. */
  activateNode(node: NeuOrganizationChartNode<T>, originalEvent: Event | null = null): void {
    if (!this.canSelect(node)) return;

    const event = { originalEvent, node };
    const mode = this.selectionMode();
    if (mode === 'checkbox') {
      this.toggleCheckboxSelection(node, event);
      return;
    }

    const next = mode === 'single' ? new Set<string>() : new Set(this.selectedSet());
    const selected = this.isSelected(node);
    if (selected) next.delete(node.id);
    else next.add(node.id);
    this.selectionKeys.set([...next]);
    if (selected) this.nodeUnselect.emit(event);
    else this.nodeSelect.emit(event);
  }

  /** Toggles one collapsible node through the canonical collapsedKeys owner. */
  toggleNode(node: NeuOrganizationChartNode<T>, originalEvent: Event | null = null): void {
    originalEvent?.preventDefault();
    originalEvent?.stopPropagation();
    if (!this.canCollapse(node)) return;

    const next = new Set(this.collapsedSet());
    const event = { originalEvent, node };
    const expanding = next.has(node.id);
    if (expanding) next.delete(node.id);
    else next.add(node.id);
    this.collapsedKeys.set([...next]);
    if (expanding) this.nodeExpand.emit(event);
    else this.nodeCollapse.emit(event);
  }

  protected hasChildren(node: NeuOrganizationChartNode<T>): boolean {
    return !!node.children?.length;
  }

  protected canSelect(node: NeuOrganizationChartNode<T>): boolean {
    if (!this.selectionMode() || node.disabled || node.selectable === false) return false;
    return node.selectable === true || this.selectable();
  }

  protected canCollapse(node: NeuOrganizationChartNode<T>): boolean {
    if (!this.hasChildren(node) || node.disabled || node.collapsible === false) return false;
    return node.collapsible === true || this.collapsible();
  }

  protected isSelected(node: NeuOrganizationChartNode<T>): boolean {
    return this.selectedSet().has(node.id);
  }

  protected isPartialSelected(node: NeuOrganizationChartNode<T>): boolean {
    if (this.selectionMode() !== 'checkbox') return false;
    const ids = this.selectableSubtreeIds(node);
    if (!ids.length) return false;
    const selected = this.selectedSet();
    const selectedCount = ids.filter((id) => selected.has(id)).length;
    return selectedCount > 0 && selectedCount < ids.length;
  }

  protected isCollapsed(node: NeuOrganizationChartNode<T>): boolean {
    return this.canCollapse(node) && this.collapsedSet().has(node.id);
  }

  protected deepIndent(level: number): number {
    return Math.min(level, 32) * 0.75;
  }

  protected nodeTemplateContext(
    node: NeuOrganizationChartNode<T>,
    parent: NeuOrganizationChartNode<T> | null,
    index: number,
    level: number,
    path: readonly number[],
  ): NeuOrganizationChartNodeTemplateContext<T> {
    return {
      $implicit: node,
      data: node.data,
      index,
      level,
      path,
      parent,
      leaf: !this.hasChildren(node),
      selectable: this.canSelect(node),
      selected: this.isSelected(node),
      partialSelected: this.isPartialSelected(node),
      collapsible: this.canCollapse(node),
      collapsed: this.isCollapsed(node),
      expanded: !this.isCollapsed(node),
      toggle: (event) => this.toggleNode(node, event ?? null),
      select: (event) => this.activateNode(node, event ?? null),
    };
  }

  protected toggleIconTemplateContext(
    node: NeuOrganizationChartNode<T>,
  ): NeuOrganizationChartToggleIconTemplateContext<T> {
    return {
      $implicit: node,
      expanded: !this.isCollapsed(node),
      collapsed: this.isCollapsed(node),
    };
  }

  protected toggleTemplateContext(
    node: NeuOrganizationChartNode<T>,
  ): NeuOrganizationChartToggleTemplateContext<T> {
    return {
      ...this.toggleIconTemplateContext(node),
      childCount: node.children?.length ?? 0,
      toggle: (event) => this.toggleNode(node, event ?? null),
    };
  }

  protected selectionIndicatorContext(
    node: NeuOrganizationChartNode<T>,
  ): NeuOrganizationChartSelectionIndicatorTemplateContext<T> {
    return {
      $implicit: node,
      selected: this.isSelected(node),
      partialSelected: this.isPartialSelected(node),
    };
  }

  protected onNodeContentClick(node: NeuOrganizationChartNode<T>, event: MouseEvent): void {
    const target = event.target as Element | null;
    const current = event.currentTarget as Element | null;
    if (target && current && target !== current && this.isConsumerInteractive(target, current))
      return;
    this.activateNode(node, event);
  }

  protected onNodeKeydown(node: NeuOrganizationChartNode<T>, event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) return;
    if ((event.key === 'Enter' || event.key === ' ') && this.canSelect(node)) {
      event.preventDefault();
      this.activateNode(node, event);
      return;
    }

    const actions = Array.from(
      this.host.querySelectorAll<HTMLElement>('.neu-organization-chart__branch[tabindex="0"]'),
    );
    const current = event.currentTarget as HTMLElement;
    const index = actions.indexOf(current);
    const direction = this.host.ownerDocument.defaultView?.getComputedStyle(this.host).direction;
    const forwardKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    let target: HTMLElement | undefined;

    if (event.key === 'ArrowDown') target = actions[index + 1];
    else if (event.key === 'ArrowUp') target = actions[index - 1];
    else if (event.key === 'Home') target = actions[0];
    else if (event.key === 'End') target = actions.at(-1);
    else if (event.key === forwardKey) {
      if (this.isCollapsed(node)) {
        this.toggleNode(node, event);
        return;
      }
      target = this.firstChildItem(current);
    } else if (event.key === backKey) {
      if (this.canCollapse(node) && !this.isCollapsed(node)) {
        this.toggleNode(node, event);
        return;
      }
      target = this.parentItem(current);
    } else return;

    if (target) {
      event.preventDefault();
      target.focus();
    }
  }

  private toggleCheckboxSelection(
    node: NeuOrganizationChartNode<T>,
    event: NeuOrganizationChartNodeEvent<T>,
  ): void {
    const next = new Set(this.selectedSet());
    const subtreeIds = this.selectableSubtreeIds(node);
    const selecting = !subtreeIds.every((id) => next.has(id));
    for (const id of subtreeIds) {
      if (selecting) next.add(id);
      else next.delete(id);
    }

    this.reconcileAncestors(this.nodes(), next);
    this.selectionKeys.set([...next]);
    if (selecting) this.nodeSelect.emit(event);
    else this.nodeUnselect.emit(event);
  }

  private reconcileAncestors(
    nodes: readonly NeuOrganizationChartNode<T>[],
    selected: Set<string>,
  ): void {
    const entries = walkNeuTreeDepthFirst(nodes, (node) => node.children ?? []);
    const subtreeIds = new Map<number, string[]>();
    for (let entryIndex = entries.length - 1; entryIndex >= 0; entryIndex -= 1) {
      const entry = entries[entryIndex];
      const node = entry.node;
      const descendantIds = entry.childEntryIndices.flatMap(
        (childIndex) => subtreeIds.get(childIndex) ?? [],
      );
      if (descendantIds.length && descendantIds.every((id) => selected.has(id))) {
        if (this.canSelect(node)) selected.add(node.id);
      } else if (this.canSelect(node) && node.children?.length) selected.delete(node.id);
      subtreeIds.set(entryIndex, [...(this.canSelect(node) ? [node.id] : []), ...descendantIds]);
    }
  }

  private selectableSubtreeIds(node: NeuOrganizationChartNode<T>): string[] {
    return walkNeuTreeDepthFirst([node], (entry) => entry.children ?? [])
      .map((entry) => entry.node)
      .filter((entry) => this.canSelect(entry))
      .map((entry) => entry.id);
  }

  private defaultCollapsedKeys(nodes: readonly NeuOrganizationChartNode<T>[]): string[] {
    return walkNeuTreeDepthFirst(nodes, (node) => node.children ?? [])
      .map((entry) => entry.node)
      .filter((node) => node.expanded === false && this.canCollapse(node))
      .map((node) => node.id);
  }

  private cycleSafeProjection(
    nodes: readonly NeuOrganizationChartNode<T>[],
  ): readonly NeuOrganizationChartNode<T>[] {
    const entries = walkNeuTreeDepthFirst(nodes, (node) => node.children ?? []);
    const projected = new Map<number, NeuOrganizationChartNode<T>>();
    for (let entryIndex = entries.length - 1; entryIndex >= 0; entryIndex -= 1) {
      const entry = entries[entryIndex];
      const children = entry.childEntryIndices.map((index) => projected.get(index)!);
      const originalChildren = entry.node.children;
      const unchanged =
        originalChildren == null ||
        (originalChildren.length === children.length &&
          originalChildren.every((child, index) => child === children[index]));
      projected.set(entryIndex, unchanged ? entry.node : { ...entry.node, children });
    }
    return entries.flatMap((entry, index) =>
      entry.parentEntryIndex == null ? [projected.get(index)!] : [],
    );
  }

  private isConsumerInteractive(target: Element, boundary: Element): boolean {
    const interactive = target.closest(
      'a, button, input, select, textarea, summary, [contenteditable="true"], [role="button"], [role="link"]',
    );
    return !!interactive && interactive !== boundary && boundary.contains(interactive);
  }

  private firstChildItem(current: HTMLElement): HTMLElement | undefined {
    const branch = current.closest('.neu-organization-chart__branch');
    const tree = branch?.parentElement;
    if (tree?.classList.contains('neu-organization-chart__tree--flat')) {
      const items = Array.from(
        tree.querySelectorAll<HTMLElement>(
          ':scope > .neu-organization-chart__branch[tabindex="0"]',
        ),
      );
      const index = items.indexOf(current);
      const level = Number(current.getAttribute('aria-level'));
      for (let candidateIndex = index + 1; candidateIndex < items.length; candidateIndex += 1) {
        const candidate = items[candidateIndex];
        const candidateLevel = Number(candidate.getAttribute('aria-level'));
        if (candidateLevel <= level) break;
        return candidate;
      }
      return undefined;
    }
    return (branch?.querySelector(
      ':scope > .neu-organization-chart__tree > .neu-organization-chart__branch[tabindex="0"]',
    ) ?? undefined) as HTMLElement | undefined;
  }

  private parentItem(current: HTMLElement): HTMLElement | undefined {
    const branch = current.closest('.neu-organization-chart__branch');
    const tree = branch?.parentElement;
    if (tree?.classList.contains('neu-organization-chart__tree--flat')) {
      const items = Array.from(
        tree.querySelectorAll<HTMLElement>(
          ':scope > .neu-organization-chart__branch[tabindex="0"]',
        ),
      );
      const index = items.indexOf(current);
      const level = Number(current.getAttribute('aria-level'));
      for (let candidateIndex = index - 1; candidateIndex >= 0; candidateIndex -= 1) {
        const candidate = items[candidateIndex];
        if (Number(candidate.getAttribute('aria-level')) < level) return candidate;
      }
      return undefined;
    }
    return (branch?.parentElement?.closest('.neu-organization-chart__branch[tabindex="0"]') ??
      undefined) as HTMLElement | undefined;
  }
}
