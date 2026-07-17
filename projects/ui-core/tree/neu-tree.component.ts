import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  computed,
  contentChild,
  effect,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NeuCheckboxComponent } from '@neural-ui/core/checkbox';

export interface NeuTreeNode<T = unknown> {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  children?: NeuTreeNode<T>[];
  disabled?: boolean;
  expanded?: boolean;
  selectable?: boolean;
  data?: T;
}

export type NeuTreeSelectionMode = 'single' | 'multiple';
export interface NeuTreeNodeTemplateContext { $implicit: NeuTreeNode; level: number; selected: boolean; expanded: boolean; toggle: () => void; }
@Directive({ selector: 'ng-template[neuTreeNode]' })
export class NeuTreeNodeDirective { constructor(readonly templateRef: TemplateRef<NeuTreeNodeTemplateContext>) {} }

@Component({
  selector: 'neu-tree',
  standalone: true,
  imports: [NgTemplateOutlet, NeuCheckboxComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="neu-tree">
      @if (searchable()) {
        <label class="neu-tree__search" [attr.aria-label]="searchPlaceholder()">
          <svg
            class="neu-tree__search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m20 20-3.5-3.5"></path>
          </svg>
          <input
            class="neu-tree__search-input"
            type="search"
            [value]="searchQuery()"
            [attr.placeholder]="searchPlaceholder()"
            (input)="onSearch($event)"
          />
        </label>
      }

      @if (visibleNodes().length) {
        <ul
          class="neu-tree__list neu-tree__list--root"
          role="tree"
          [attr.aria-label]="ariaLabel()"
          [attr.aria-multiselectable]="
            selectable() && selectionMode() === 'multiple' ? 'true' : null
          "
        >
          <ng-container
            [ngTemplateOutlet]="treeNodes"
            [ngTemplateOutletContext]="{ $implicit: visibleNodes(), level: 1 }"
          />
        </ul>
      } @else {
        <div class="neu-tree__empty">{{ emptyLabel() }}</div>
      }
    </div>

    <ng-template #treeNodes let-nodes let-level="level">
      @for (node of nodes; track node.id) {
        <li
          class="neu-tree__node"
          role="treeitem"
          [attr.aria-level]="level"
          [attr.aria-expanded]="hasChildren(node) ? isRenderedExpanded(node) : null"
          [attr.aria-selected]="canSelect(node) ? isSelected(node.id) : null"
          [attr.aria-disabled]="node.disabled ? 'true' : null"
        >
          <div
            class="neu-tree__row"
            [class.neu-tree__row--selected]="isSelected(node.id)"
            [class.neu-tree__row--disabled]="node.disabled"
            [style.padding-inline-start.px]="(level - 1) * indentSize() + 6"
          >
            @if (hasChildren(node)) {
              <button
                class="neu-tree__toggle"
                type="button"
                [class.neu-tree__toggle--open]="isRenderedExpanded(node)"
                [attr.aria-label]="isRenderedExpanded(node) ? collapseLabel() : expandLabel()"
                (click)="toggleNode(node, $event)"
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m7 5 6 5-6 5" />
                </svg>
              </button>
            } @else {
              <span
                class="neu-tree__toggle neu-tree__toggle--placeholder"
                aria-hidden="true"
              ></span>
            }

            @if (canSelect(node) && selectionMode() === 'multiple') {
              <neu-checkbox
                class="neu-tree__checkbox"
                [checked]="isSelected(node.id)"
                [disabled]="node.disabled"
                [ariaLabel]="'Select ' + node.label"
                (click)="$event.stopPropagation()"
                (checkedChange)="onCheckboxChange(node, $event)"
              />
            }

            <button
              class="neu-tree__content"
              type="button"
              [disabled]="node.disabled"
              (click)="activateNode(node)"
            >
              @if (nodeTpl()) { <ng-container [ngTemplateOutlet]="nodeTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: node, level, selected: isSelected(node.id), expanded: isRenderedExpanded(node), toggle: toggleNode.bind(this, node) }" /> } @else { <span class="neu-tree__main">
                <span class="neu-tree__label">{{ node.label }}</span>
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

          @if (hasChildren(node) && isRenderedExpanded(node)) {
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
  `,
  styleUrl: './neu-tree.component.scss',
})
export class NeuTreeComponent {
  readonly nodeTpl = contentChild(NeuTreeNodeDirective);
  nodes = input<NeuTreeNode[]>([]);
  selectable = input(false);
  searchable = input(false);
  selectionMode = input<NeuTreeSelectionMode>('single');
  indentSize = input(18);
  ariaLabel = input('Tree');
  searchPlaceholder = input('Search nodes');
  emptyLabel = input('No nodes available');
  expandLabel = input('Expand node');
  collapseLabel = input('Collapse node');

  selectionChange = output<NeuTreeNode[]>();
  expansionChange = output<string[]>();
  nodeClick = output<NeuTreeNode>();

  readonly searchQuery = signal('');

  private readonly expandedKeys = signal<Set<string>>(new Set());
  private readonly selectedKeys = signal<Set<string>>(new Set());

  readonly visibleNodes = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.nodes();
    }

    return this.filterNodes(this.nodes(), query);
  });

  constructor() {
    effect(() => {
      const nextExpanded = this.collectExpandedKeys(this.nodes());
      this.expandedKeys.set(nextExpanded);
      this.selectedKeys.set(new Set());
      this.searchQuery.set('');
    });
  }

  hasChildren(node: NeuTreeNode): boolean {
    return !!node.children?.length;
  }

  canSelect(node: NeuTreeNode): boolean {
    return this.selectable() && node.selectable !== false;
  }

  isExpanded(nodeId: string): boolean {
    return this.expandedKeys().has(nodeId);
  }

  isRenderedExpanded(node: NeuTreeNode): boolean {
    if (this.searchQuery().trim()) {
      return node.expanded ?? this.isExpanded(node.id);
    }

    return this.isExpanded(node.id);
  }

  isSelected(nodeId: string): boolean {
    return this.selectedKeys().has(nodeId);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  toggleNode(node: NeuTreeNode, event?: Event): void {
    event?.stopPropagation();
    if (node.disabled || !this.hasChildren(node)) {
      return;
    }

    const next = new Set(this.expandedKeys());
    if (next.has(node.id)) {
      next.delete(node.id);
    } else {
      next.add(node.id);
    }

    this.expandedKeys.set(next);
    this.expansionChange.emit([...next]);
  }

  activateNode(node: NeuTreeNode): void {
    if (node.disabled) {
      return;
    }

    this.nodeClick.emit(node);

    if (!this.canSelect(node)) {
      return;
    }

    if (this.selectionMode() === 'multiple') {
      const checked = !this.isSelected(node.id);
      this.updateSelection(node, checked);
      return;
    }

    this.updateSelection(node, true);
  }

  onCheckboxChange(node: NeuTreeNode, checkedOrEvent: boolean | Event): void {
    const checked =
      typeof checkedOrEvent === 'boolean'
        ? checkedOrEvent
        : (checkedOrEvent.target as HTMLInputElement).checked;
    this.updateSelection(node, checked);
  }

  private updateSelection(node: NeuTreeNode, checked: boolean): void {
    if (node.disabled || !this.canSelect(node)) {
      return;
    }

    const next = new Set(this.selectedKeys());

    if (this.selectionMode() === 'single') {
      next.clear();
      if (checked) {
        next.add(node.id);
      }
    } else if (checked) {
      next.add(node.id);
    } else {
      next.delete(node.id);
    }

    this.selectedKeys.set(next);
    this.selectionChange.emit(this.collectSelectedNodes(this.nodes(), next));
  }

  private collectExpandedKeys(nodes: NeuTreeNode[]): Set<string> {
    const expanded = new Set<string>();
    for (const node of nodes) {
      if (node.expanded) {
        expanded.add(node.id);
      }
      if (node.children?.length) {
        for (const childId of this.collectExpandedKeys(node.children)) {
          expanded.add(childId);
        }
      }
    }
    return expanded;
  }

  private collectSelectedNodes(nodes: NeuTreeNode[], selected: Set<string>): NeuTreeNode[] {
    const result: NeuTreeNode[] = [];
    for (const node of nodes) {
      if (selected.has(node.id)) {
        result.push(node);
      }
      if (node.children?.length) {
        result.push(...this.collectSelectedNodes(node.children, selected));
      }
    }
    return result;
  }

  private filterNodes(nodes: NeuTreeNode[], query: string): NeuTreeNode[] {
    const filtered: NeuTreeNode[] = [];
    for (const node of nodes) {
      const children = node.children?.length ? this.filterNodes(node.children, query) : [];
      const matches =
        node.label.toLowerCase().includes(query) ||
        node.description?.toLowerCase().includes(query) ||
        node.badge?.toLowerCase().includes(query);

      if (matches || children.length) {
        filtered.push({
          ...node,
          children,
          expanded: children.length ? true : node.expanded,
        });
      }
    }
    return filtered;
  }
}
