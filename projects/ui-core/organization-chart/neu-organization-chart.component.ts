import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import type { NeuTreeNode } from '@neural-ui/core/tree';

export interface NeuOrganizationChartNode<T = unknown> extends Omit<NeuTreeNode<T>, 'children'> {
  children?: NeuOrganizationChartNode<T>[];
  /** Overrides the chart-level collapsible setting for this node. */
  collapsible?: boolean;
}

export type NeuOrganizationChartSelectionMode = 'single' | 'multiple' | 'checkbox';
export type NeuOrganizationChartGap = number | readonly [number, number];

export interface NeuOrganizationChartNodeEvent<T = unknown> {
  readonly originalEvent: Event | null;
  readonly node: NeuOrganizationChartNode<T>;
}

export interface NeuOrganizationChartNodeTemplateContext<T = unknown> {
  readonly $implicit: NeuOrganizationChartNode<T>;
  readonly level: number;
  readonly selected: boolean;
  readonly partialSelected: boolean;
  readonly expanded: boolean;
  readonly toggle: () => void;
  readonly select: () => void;
}

export interface NeuOrganizationChartToggleTemplateContext<T = unknown> {
  readonly $implicit: NeuOrganizationChartNode<T>;
  readonly expanded: boolean;
}

@Directive({
  selector: 'ng-template[neuOrganizationChartNode]',
  standalone: true,
})
export class NeuOrganizationChartNodeDirective<T = unknown> {
  constructor(readonly templateRef: TemplateRef<NeuOrganizationChartNodeTemplateContext<T>>) {}
}

@Directive({
  selector: 'ng-template[neuOrganizationChartToggleIcon]',
  standalone: true,
})
export class NeuOrganizationChartToggleIconDirective<T = unknown> {
  constructor(readonly templateRef: TemplateRef<NeuOrganizationChartToggleTemplateContext<T>>) {}
}

/** Accessible hierarchical node-card visualization with CSS-owned tree connectors. */
@Component({
  selector: 'neu-organization-chart',
  standalone: true,
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-organization-chart',
  },
  template: `
    <div
      class="neu-organization-chart__viewport"
      [style.--neu-organization-chart-gap-x.px]="gapX()"
      [style.--neu-organization-chart-gap-y.px]="gapY()"
    >
      @if (nodes().length) {
        <ul
          class="neu-organization-chart__tree neu-organization-chart__tree--root"
          role="tree"
          [attr.aria-label]="ariaLabel()"
          [attr.aria-multiselectable]="
            selectionMode() === 'multiple' || selectionMode() === 'checkbox' ? 'true' : null
          "
        >
          <ng-container
            [ngTemplateOutlet]="branches"
            [ngTemplateOutletContext]="{ $implicit: nodes(), level: 1 }"
          />
        </ul>
      } @else {
        <div class="neu-organization-chart__empty" role="status">{{ emptyLabel() }}</div>
      }
    </div>

    <ng-template #branches let-items let-level="level">
      @for (node of items; track node.id) {
        <li
          class="neu-organization-chart__branch"
          role="treeitem"
          [attr.aria-level]="level"
          [attr.aria-expanded]="hasChildren(node) ? !isCollapsed(node) : null"
          [attr.aria-selected]="canSelect(node) ? isSelected(node) : null"
          [attr.aria-disabled]="node.disabled ? 'true' : null"
        >
          <div
            class="neu-organization-chart__node"
            [class.neu-organization-chart__node--selected]="isSelected(node)"
            [class.neu-organization-chart__node--partial]="isPartialSelected(node)"
            [class.neu-organization-chart__node--disabled]="node.disabled"
          >
            <button
              class="neu-organization-chart__node-action"
              type="button"
              [disabled]="node.disabled"
              [attr.role]="selectionMode() === 'checkbox' && canSelect(node) ? 'checkbox' : null"
              [attr.aria-checked]="
                selectionMode() === 'checkbox' && canSelect(node)
                  ? isPartialSelected(node)
                    ? 'mixed'
                    : isSelected(node)
                  : null
              "
              [attr.aria-pressed]="
                selectionMode() !== 'checkbox' && canSelect(node) ? isSelected(node) : null
              "
              (click)="activateNode(node, $event)"
              (keydown)="onNodeKeydown(node, $event)"
            >
              @if (selectionMode() === 'checkbox' && canSelect(node)) {
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

              @if (nodeTemplate(); as template) {
                <ng-container
                  [ngTemplateOutlet]="template.templateRef"
                  [ngTemplateOutletContext]="nodeTemplateContext(node, level)"
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
            </button>

            @if (canCollapse(node)) {
              <button
                class="neu-organization-chart__toggle"
                type="button"
                [attr.aria-label]="isCollapsed(node) ? expandLabel() : collapseLabel()"
                [attr.aria-expanded]="!isCollapsed(node)"
                (click)="toggleNode(node, $event)"
              >
                @if (toggleTemplate(); as template) {
                  <ng-container
                    [ngTemplateOutlet]="template.templateRef"
                    [ngTemplateOutletContext]="{
                      $implicit: node,
                      expanded: !isCollapsed(node),
                    }"
                  />
                } @else {
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="m5 8 5 5 5-5" />
                  </svg>
                }
              </button>
            }
          </div>

          @if (hasChildren(node) && !isCollapsed(node)) {
            <ul class="neu-organization-chart__tree" role="group">
              <ng-container
                [ngTemplateOutlet]="branches"
                [ngTemplateOutletContext]="{
                  $implicit: node.children ?? [],
                  level: level + 1,
                }"
              />
            </ul>
          }
        </li>
      }
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
  readonly ariaLabel = input('Organization chart');
  readonly emptyLabel = input('No organization nodes available');
  readonly expandLabel = input('Expand node');
  readonly collapseLabel = input('Collapse node');

  /** Controlled selected node ids. Undefined starts with no selected nodes. */
  readonly selectionKeys = model<readonly string[] | undefined>(undefined);
  /** Controlled collapsed node ids. Undefined derives initial state from `node.expanded === false`. */
  readonly collapsedKeys = model<readonly string[] | undefined>(undefined);

  readonly nodeSelect = output<NeuOrganizationChartNodeEvent<T>>();
  readonly nodeUnselect = output<NeuOrganizationChartNodeEvent<T>>();
  readonly nodeExpand = output<NeuOrganizationChartNodeEvent<T>>();
  readonly nodeCollapse = output<NeuOrganizationChartNodeEvent<T>>();
  readonly nodeActivate = output<NeuOrganizationChartNodeEvent<T>>();

  readonly nodeTemplate = contentChild(NeuOrganizationChartNodeDirective<T>);
  readonly toggleTemplate = contentChild(NeuOrganizationChartToggleIconDirective<T>);

  readonly gapX = computed(() => {
    const value = this.gap();
    return Array.isArray(value) ? value[0] : value;
  });
  readonly gapY = computed(() => {
    const value = this.gap();
    return Array.isArray(value) ? (value[1] ?? value[0]) : value;
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly selectedSet = computed(() => new Set(this.selectionKeys() ?? []));
  private readonly collapsedSet = computed(
    () => new Set(this.collapsedKeys() ?? this.defaultCollapsedKeys(this.nodes())),
  );

  hasChildren(node: NeuOrganizationChartNode<T>): boolean {
    return !!node.children?.length;
  }

  canSelect(node: NeuOrganizationChartNode<T>): boolean {
    if (!this.selectionMode() || node.disabled || node.selectable === false) {
      return false;
    }
    return node.selectable === true || this.selectable();
  }

  canCollapse(node: NeuOrganizationChartNode<T>): boolean {
    if (!this.hasChildren(node) || node.disabled || node.collapsible === false) {
      return false;
    }
    return node.collapsible === true || this.collapsible();
  }

  isSelected(node: NeuOrganizationChartNode<T>): boolean {
    return this.selectedSet().has(node.id);
  }

  isPartialSelected(node: NeuOrganizationChartNode<T>): boolean {
    if (this.selectionMode() !== 'checkbox') {
      return false;
    }
    const ids = this.selectableSubtreeIds(node);
    if (!ids.length) {
      return false;
    }
    const selected = this.selectedSet();
    const selectedCount = ids.filter((id) => selected.has(id)).length;
    return selectedCount > 0 && selectedCount < ids.length;
  }

  isCollapsed(node: NeuOrganizationChartNode<T>): boolean {
    return this.canCollapse(node) && this.collapsedSet().has(node.id);
  }

  activateNode(node: NeuOrganizationChartNode<T>, originalEvent: Event | null): void {
    if (node.disabled) {
      return;
    }

    const event = { originalEvent, node };
    this.nodeActivate.emit(event);
    if (!this.canSelect(node)) {
      return;
    }

    const mode = this.selectionMode();
    if (mode === 'checkbox') {
      this.toggleCheckboxSelection(node, event);
      return;
    }

    const next = mode === 'single' ? new Set<string>() : new Set(this.selectedSet());
    const selected = this.isSelected(node);
    if (selected) {
      next.delete(node.id);
      this.nodeUnselect.emit(event);
    } else {
      next.add(node.id);
      this.nodeSelect.emit(event);
    }
    this.selectionKeys.set([...next]);
  }

  toggleNode(node: NeuOrganizationChartNode<T>, originalEvent: Event | null): void {
    originalEvent?.preventDefault();
    originalEvent?.stopPropagation();
    if (!this.canCollapse(node)) {
      return;
    }

    const next = new Set(this.collapsedSet());
    const event = { originalEvent, node };
    if (next.has(node.id)) {
      next.delete(node.id);
      this.nodeExpand.emit(event);
    } else {
      next.add(node.id);
      this.nodeCollapse.emit(event);
    }
    this.collapsedKeys.set([...next]);
  }

  nodeTemplateContext(
    node: NeuOrganizationChartNode<T>,
    level: number,
  ): NeuOrganizationChartNodeTemplateContext<T> {
    return {
      $implicit: node,
      level,
      selected: this.isSelected(node),
      partialSelected: this.isPartialSelected(node),
      expanded: !this.isCollapsed(node),
      toggle: () => this.toggleNode(node, null),
      select: () => this.activateNode(node, null),
    };
  }

  onNodeKeydown(node: NeuOrganizationChartNode<T>, event: KeyboardEvent): void {
    const actions = Array.from(
      this.host.querySelectorAll<HTMLButtonElement>(
        '.neu-organization-chart__node-action:not(:disabled)',
      ),
    );
    const current = event.currentTarget as HTMLButtonElement;
    const index = actions.indexOf(current);
    const direction = this.host.ownerDocument.defaultView?.getComputedStyle(this.host).direction;
    const forwardKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    let target: HTMLButtonElement | undefined;

    if (event.key === 'ArrowDown') {
      target = actions[index + 1];
    } else if (event.key === 'ArrowUp') {
      target = actions[index - 1];
    } else if (event.key === 'Home') {
      target = actions[0];
    } else if (event.key === 'End') {
      target = actions.at(-1);
    } else if (event.key === forwardKey) {
      if (this.isCollapsed(node)) {
        this.toggleNode(node, event);
        return;
      }
      target = this.firstChildAction(current);
    } else if (event.key === backKey) {
      if (this.canCollapse(node) && !this.isCollapsed(node)) {
        this.toggleNode(node, event);
        return;
      }
      target = this.parentAction(current);
    } else {
      return;
    }

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
      if (selecting) {
        next.add(id);
      } else {
        next.delete(id);
      }
    }

    this.reconcileAncestors(this.nodes(), next);
    this.selectionKeys.set([...next]);
    if (selecting) {
      this.nodeSelect.emit(event);
    } else {
      this.nodeUnselect.emit(event);
    }
  }

  private reconcileAncestors(
    nodes: readonly NeuOrganizationChartNode<T>[],
    selected: Set<string>,
  ): void {
    for (const node of nodes) {
      if (node.children?.length) {
        this.reconcileAncestors(node.children, selected);
      }
      if (!this.canSelect(node) || !node.children?.length) {
        continue;
      }
      const descendantIds = node.children.flatMap((child) => this.selectableSubtreeIds(child));
      if (descendantIds.length && descendantIds.every((id) => selected.has(id))) {
        selected.add(node.id);
      } else {
        selected.delete(node.id);
      }
    }
  }

  private selectableSubtreeIds(node: NeuOrganizationChartNode<T>): string[] {
    const own = this.canSelect(node) ? [node.id] : [];
    return [...own, ...(node.children?.flatMap((child) => this.selectableSubtreeIds(child)) ?? [])];
  }

  private defaultCollapsedKeys(nodes: readonly NeuOrganizationChartNode<T>[]): string[] {
    return nodes.flatMap((node) => [
      ...(node.expanded === false && this.canCollapse(node) ? [node.id] : []),
      ...(node.children?.length ? this.defaultCollapsedKeys(node.children) : []),
    ]);
  }

  private firstChildAction(current: HTMLElement): HTMLButtonElement | undefined {
    const branch = current.closest('.neu-organization-chart__branch');
    return (branch?.querySelector(
      ':scope > .neu-organization-chart__tree > .neu-organization-chart__branch > .neu-organization-chart__node > .neu-organization-chart__node-action:not(:disabled)',
    ) ?? undefined) as HTMLButtonElement | undefined;
  }

  private parentAction(current: HTMLElement): HTMLButtonElement | undefined {
    const branch = current.closest('.neu-organization-chart__branch');
    const parentBranch = branch?.parentElement?.closest('.neu-organization-chart__branch');
    return (parentBranch?.querySelector(
      ':scope > .neu-organization-chart__node > .neu-organization-chart__node-action:not(:disabled)',
    ) ?? undefined) as HTMLButtonElement | undefined;
  }
}
