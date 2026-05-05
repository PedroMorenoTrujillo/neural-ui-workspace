import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NeuTableComponent, NeuTableColumn } from '@neural-ui/core/table';

export interface NeuTreeTableNode<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  children?: NeuTreeTableNode<T>[];
  expanded?: boolean;
  disabled?: boolean;
  data?: T;
}

export interface NeuTreeTableRow<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends Record<string, unknown> {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  __treeLevel: number;
  __treeHasChildren: boolean;
  __treeExpanded: boolean;
  __treeDisabled: boolean;
  __treeParentId?: string;
  __treeNode: NeuTreeTableNode<T>;
}

@Component({
  selector: 'neu-tree-table',
  standalone: true,
  imports: [NeuTableComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <neu-table
      class="neu-tree-table"
      [columns]="resolvedColumns()"
      [data]="flatRows()"
      [title]="title()"
      [rowKey]="rowKey()"
      [tableAriaLabel]="tableAriaLabel()"
      [searchable]="searchable()"
      [searchPlaceholder]="searchPlaceholder()"
      [pagination]="pagination()"
      [pageSizeOptions]="pageSizeOptions()"
      [selectable]="selectable()"
      [stickyHeader]="stickyHeader()"
      [stripedRows]="stripedRows()"
      [bordered]="bordered()"
      [roundedBorders]="roundedBorders()"
      [sortable]="sortable()"
      [showRowNumbers]="showRowNumbers()"
      [density]="density()"
      [useUrlState]="useUrlState()"
      [emptyMessage]="emptyMessage()"
      (selectionChange)="onTableSelectionChange($event)"
      (rowClick)="onTableRowClick($event)"
    />

    <ng-template #treeCellTpl let-row>
      <div
        class="neu-tree-table__cell"
        [style.padding-inline-start.px]="treeIndent(row)"
        [class.neu-tree-table__cell--disabled]="isTreeRowDisabled(row)"
      >
        @if (row.__treeHasChildren) {
          <button
            class="neu-tree-table__toggle"
            type="button"
            [class.neu-tree-table__toggle--open]="row.__treeExpanded"
            [attr.aria-label]="treeToggleAriaLabel(row)"
            (click)="toggleNode(row.__treeNode, $event)"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m7 5 6 5-6 5" />
            </svg>
          </button>
        } @else {
          <span class="neu-tree-table__toggle neu-tree-table__toggle--placeholder"></span>
        }

        <div class="neu-tree-table__content">
          <div class="neu-tree-table__main">
            <span class="neu-tree-table__label">{{ row.label }}</span>
            @if (row.badge) {
              <span class="neu-tree-table__badge">{{ row.badge }}</span>
            }
          </div>
          @if (row.description) {
            <span class="neu-tree-table__description">{{ row.description }}</span>
          }
        </div>
      </div>
    </ng-template>
  `,
  styleUrl: './neu-tree-table.component.scss',
})
export class NeuTreeTableComponent {
  readonly nodes = input<NeuTreeTableNode[]>([]);
  readonly columns = input<NeuTableColumn<Record<string, unknown>>[]>([]);
  readonly title = input('');
  readonly treeColumnKey = input('label');
  readonly rowKey = input('id');
  readonly tableAriaLabel = input('Tree table');
  readonly searchPlaceholder = input('Search rows');
  readonly emptyMessage = input('No rows found');
  readonly expandLabel = input('Expand row');
  readonly collapseLabel = input('Collapse row');
  readonly indentSize = input(18);

  readonly searchable = input(true);
  readonly pagination = input(true);
  readonly selectable = input(false);
  readonly stickyHeader = input(false);
  readonly stripedRows = input(false);
  readonly bordered = input(true);
  readonly roundedBorders = input(true);
  readonly sortable = input(false);
  readonly showRowNumbers = input(false);
  readonly useUrlState = input(false);
  readonly density = input<'compact' | 'normal' | 'relaxed'>('normal');
  readonly pageSizeOptions = input<number[]>([5, 10, 20]);

  readonly selectionChange = output<NeuTreeTableNode[]>();
  readonly nodeClick = output<NeuTreeTableNode>();
  readonly expansionChange = output<string[]>();

  private readonly treeCellTpl = viewChild<TemplateRef<unknown>>('treeCellTpl');
  private readonly expandedKeys = signal<Set<string>>(new Set());

  readonly flatRows = computed<Record<string, unknown>[]>(() => this.flattenNodes(this.nodes(), 0));

  readonly resolvedColumns = computed<NeuTableColumn<Record<string, unknown>>[]>(() => {
    const tpl = this.treeCellTpl();
    const treeColumnKey = this.treeColumnKey();
    const columns = this.columns();
    const hasConfiguredTreeColumn = columns.some((column) => column.key === treeColumnKey);

    return columns.map((column, index) => {
      const isTreeColumn = hasConfiguredTreeColumn ? column.key === treeColumnKey : index === 0;
      if (!isTreeColumn) {
        return column;
      }

      return {
        ...column,
        sortable: column.sortable ?? false,
        cellTemplate: tpl as
          | TemplateRef<{
              $implicit: Record<string, unknown>;
              row: Record<string, unknown>;
              column: NeuTableColumn<Record<string, unknown>>;
            }>
          | undefined,
      };
    });
  });

  constructor() {
    effect(() => {
      this.expandedKeys.set(this.collectExpandedKeys(this.nodes()));
    });
  }

  toggleNode(node: NeuTreeTableNode, event?: Event): void {
    event?.stopPropagation();
    if (!node.children?.length || node.disabled) {
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

  onTableSelectionChange(rows: Record<string, unknown>[]): void {
    this.selectionChange.emit(rows.map((row) => this.asFlatRow(row).__treeNode));
  }

  onTableRowClick(row: Record<string, unknown>): void {
    this.nodeClick.emit(this.asFlatRow(row).__treeNode);
  }

  treeIndent(row: NeuTreeTableRow): number {
    return row.__treeLevel * this.indentSize();
  }

  isTreeRowDisabled(row: NeuTreeTableRow): boolean {
    return row.__treeDisabled;
  }

  treeToggleAriaLabel(row: NeuTreeTableRow): string {
    return row.__treeExpanded ? this.collapseLabel() : this.expandLabel();
  }

  private flattenNodes(
    nodes: NeuTreeTableNode[],
    level: number,
    parentId?: string,
  ): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = [];

    for (const node of nodes) {
      const expanded = this.expandedKeys().has(node.id);
      rows.push({
        ...(node.data ?? {}),
        id: node.id,
        label: node.label,
        description: node.description,
        badge: node.badge,
        __treeLevel: level,
        __treeHasChildren: !!node.children?.length,
        __treeExpanded: expanded,
        __treeDisabled: !!node.disabled,
        __treeParentId: parentId,
        __treeNode: node,
      });

      if (node.children?.length && expanded) {
        rows.push(...this.flattenNodes(node.children, level + 1, node.id));
      }
    }

    return rows;
  }

  private collectExpandedKeys(nodes: NeuTreeTableNode[]): Set<string> {
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

  private asFlatRow(row: Record<string, unknown>): NeuTreeTableRow {
    return row as NeuTreeTableRow;
  }
}
