import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface NeuOrgChartNode<T = unknown> {
  id: string;
  label: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  children?: NeuOrgChartNode<T>[];
  expanded?: boolean;
  disabled?: boolean;
  data?: T;
}

export interface NeuOrgChartNodeContext<T = unknown> {
  $implicit: NeuOrgChartNode<T>;
  level: number;
  selected: boolean;
  expanded: boolean;
}

@Directive({ selector: 'ng-template[neuOrgChartNode]' })
export class NeuOrgChartNodeDirective<T = unknown> {
  constructor(readonly templateRef: TemplateRef<NeuOrgChartNodeContext<T>>) {}
}

@Component({
  selector: 'neu-org-chart',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-org-chart-host' },
  template: `
    <div class="neu-org-chart neu-org-chart--{{ orientation() }}">
      @if (nodes().length) {
        <ul class="neu-org-chart__level neu-org-chart__level--root" role="tree" [attr.aria-label]="ariaLabel()">
          <ng-container [ngTemplateOutlet]="tree" [ngTemplateOutletContext]="{ $implicit: nodes(), level: 1 }" />
        </ul>
      } @else {
        <div class="neu-org-chart__empty" role="status">{{ emptyLabel() }}</div>
      }
    </div>

    <ng-template #tree let-items let-level="level">
      @for (node of items; track node.id) {
        <li
          class="neu-org-chart__branch"
          role="treeitem"
          [attr.aria-level]="level"
          [attr.aria-expanded]="hasChildren(node) ? isExpanded(node) : null"
          [attr.aria-selected]="selectable() ? selectedId() === node.id : null"
          [attr.aria-disabled]="node.disabled || null"
        >
          <button
            class="neu-org-chart__node"
            type="button"
            [class.is-selected]="selectedId() === node.id"
            [disabled]="node.disabled"
            [attr.data-node-id]="node.id"
            [attr.tabindex]="activeId() === node.id || (!activeId() && firstNodeId() === node.id) ? 0 : -1"
            (focus)="activeId.set(node.id)"
            (click)="selectNode(node)"
            (keydown)="onKeydown(node, $event)"
          >
            @if (nodeTpl()) {
              <ng-container
                [ngTemplateOutlet]="nodeTpl()!.templateRef"
                [ngTemplateOutletContext]="{ $implicit: node, level, selected: selectedId() === node.id, expanded: isExpanded(node) }"
              />
            } @else {
              @if (node.image) {
                <img class="neu-org-chart__avatar" [src]="node.image" alt="" />
              }
              <span class="neu-org-chart__copy">
                <strong>{{ node.label }}</strong>
                @if (node.subtitle) { <span>{{ node.subtitle }}</span> }
              </span>
              @if (node.badge) { <span class="neu-org-chart__badge">{{ node.badge }}</span> }
            }
          </button>
          @if (collapsible() && hasChildren(node)) {
            <button
              class="neu-org-chart__toggle"
              type="button"
              [attr.aria-label]="(isExpanded(node) ? collapseLabel() : expandLabel()) + ': ' + node.label"
              [attr.aria-expanded]="isExpanded(node)"
              (click)="toggle(node, $event)"
            >{{ isExpanded(node) ? '−' : '+' }}</button>
          }
          @if (hasChildren(node) && isExpanded(node)) {
            <ul class="neu-org-chart__level" role="group">
              <ng-container [ngTemplateOutlet]="tree" [ngTemplateOutletContext]="{ $implicit: node.children ?? [], level: level + 1 }" />
            </ul>
          }
        </li>
      }
    </ng-template>
  `,
  styleUrl: './neu-org-chart.component.scss',
})
export class NeuOrgChartComponent<T = unknown> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly nodeTpl = contentChild(NeuOrgChartNodeDirective<T>);
  readonly nodes = input<NeuOrgChartNode<T>[]>([]);
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly selectable = input(true);
  readonly collapsible = input(true);
  readonly ariaLabel = input('Organization chart');
  readonly emptyLabel = input('No organization data');
  readonly expandLabel = input('Expand');
  readonly collapseLabel = input('Collapse');

  readonly nodeClick = output<NeuOrgChartNode<T>>();
  readonly selectionChange = output<NeuOrgChartNode<T> | null>();
  readonly expansionChange = output<string[]>();

  readonly selectedId = signal<string | null>(null);
  readonly activeId = signal<string | null>(null);
  private readonly expandedIds = signal<Set<string>>(new Set());
  readonly flattenedNodes = computed(() => this.flatten(this.nodes()));
  readonly firstNodeId = computed(() => this.flattenedNodes().find((node) => !node.disabled)?.id ?? null);

  constructor() {
    effect(() => {
      this.expandedIds.set(new Set(this.collectInitialExpanded(this.nodes())));
      this.activeId.set(null);
    });
  }

  hasChildren(node: NeuOrgChartNode<T>): boolean { return !!node.children?.length; }
  isExpanded(node: NeuOrgChartNode<T>): boolean { return this.expandedIds().has(node.id); }

  selectNode(node: NeuOrgChartNode<T>): void {
    if (node.disabled) return;
    this.nodeClick.emit(node);
    if (this.selectable()) {
      this.selectedId.set(node.id);
      this.selectionChange.emit(node);
    }
  }

  toggle(node: NeuOrgChartNode<T>, event?: Event): void {
    event?.stopPropagation();
    if (!this.hasChildren(node) || node.disabled) return;
    const next = new Set(this.expandedIds());
    next.has(node.id) ? next.delete(node.id) : next.add(node.id);
    this.expandedIds.set(next);
    this.expansionChange.emit([...next]);
  }

  onKeydown(node: NeuOrgChartNode<T>, event: KeyboardEvent): void {
    const rendered = this.renderedNodes();
    const index = rendered.findIndex((candidate) => candidate.id === node.id);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = rendered[index + (event.key === 'ArrowDown' ? 1 : -1)];
      if (next) this.focusNode(next.id);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const next = event.key === 'Home' ? rendered[0] : rendered.at(-1);
      if (next) this.focusNode(next.id);
    } else if (event.key === 'ArrowRight' && this.hasChildren(node) && !this.isExpanded(node)) {
      event.preventDefault(); this.toggle(node);
    } else if (event.key === 'ArrowLeft' && this.hasChildren(node) && this.isExpanded(node)) {
      event.preventDefault(); this.toggle(node);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); this.selectNode(node);
    }
  }

  private focusNode(id: string): void {
    this.activeId.set(id);
    queueMicrotask(() => {
      const button = Array.from(
        this.host.nativeElement.querySelectorAll<HTMLElement>('[data-node-id]'),
      ).find((candidate) => candidate.dataset['nodeId'] === id);
      button?.focus();
    });
  }
  private renderedNodes(nodes = this.nodes()): NeuOrgChartNode<T>[] {
    const result: NeuOrgChartNode<T>[] = [];
    for (const node of nodes) {
      if (!node.disabled) result.push(node);
      if (this.isExpanded(node) && node.children) result.push(...this.renderedNodes(node.children));
    }
    return result;
  }
  private flatten(nodes: NeuOrgChartNode<T>[]): NeuOrgChartNode<T>[] {
    return nodes.flatMap((node) => [node, ...this.flatten(node.children ?? [])]);
  }
  private collectInitialExpanded(nodes: NeuOrgChartNode<T>[]): string[] {
    return nodes.flatMap((node) => [
      ...(node.expanded !== false && node.children?.length ? [node.id] : []),
      ...this.collectInitialExpanded(node.children ?? []),
    ]);
  }
}
