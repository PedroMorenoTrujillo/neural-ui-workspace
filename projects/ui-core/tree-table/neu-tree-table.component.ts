import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  NeuTableAction,
  NeuTableCellEditEvent,
  NeuTableColumn,
  NeuTableColumnReorderEvent,
  NeuTableComponent,
  NeuTableExpandDirective,
  NeuTableLayout,
  NeuTableSelectionAction,
  NeuTableServerState,
} from '@neural-ui/core/table';

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

export interface NeuTreeTableActionEvent<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  action: NeuTableAction<Record<string, unknown>>;
  node: NeuTreeTableNode<T>;
  row: NeuTreeTableRow<T>;
}

export interface NeuTreeTableSelectionActionEvent<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  action: NeuTableSelectionAction<Record<string, unknown>>;
  nodes: NeuTreeTableNode<T>[];
  rows: NeuTreeTableRow<T>[];
}

export interface NeuTreeTableCellEditEvent<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  node: NeuTreeTableNode<T>;
  row: NeuTreeTableRow<T>;
  column: NeuTableColumn<Record<string, unknown>>;
  value: unknown;
  previousValue: unknown;
}

@Component({
  selector: 'neu-tree-table',
  standalone: true,
  imports: [NgTemplateOutlet, NeuTableComponent, NeuTableExpandDirective],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <neu-table
      class="neu-tree-table"
      [columns]="resolvedColumns()"
      [data]="flatRows()"
      [title]="title()"
      [toolbarExtraRef]="toolbarExtraRef()"
      [rowKey]="rowKey()"
      [tableAriaLabel]="tableAriaLabel()"
      [searchable]="searchable()"
      [searchPlaceholder]="searchPlaceholder()"
      [exactMatchable]="exactMatchable()"
      [exactMatchLabel]="exactMatchLabel()"
      [searchAriaLabel]="searchAriaLabel()"
      [clearSearchAriaLabel]="clearSearchAriaLabel()"
      [clearFilterLabel]="clearFilterLabel()"
      [previousPageAriaLabel]="previousPageAriaLabel()"
      [nextPageAriaLabel]="nextPageAriaLabel()"
      [pageSizeLabel]="pageSizeLabel()"
      [pageSizeAriaLabel]="pageSizeAriaLabel()"
      [paginationAriaLabel]="paginationAriaLabel()"
      [exportCsvTitle]="exportCsvTitle()"
      [exportJsonTitle]="exportJsonTitle()"
      [exportXlsxTitle]="exportXlsxTitle()"
      [clearSelectionLabel]="clearSelectionLabel()"
      [selectionSummaryLabel]="selectionSummaryLabel()"
      [selectAllAriaLabel]="selectAllAriaLabel()"
      [selectRowAriaLabel]="selectRowAriaLabel()"
      [expandRowAriaLabel]="expandRowAriaLabel()"
      [filterPlaceholder]="filterPlaceholder()"
      [filterAriaPrefix]="filterAriaPrefix()"
      [allFilterOptionLabel]="allFilterOptionLabel()"
      [ofLabel]="ofLabel()"
      [resultLabelSingular]="resultLabelSingular()"
      [resultLabelPlural]="resultLabelPlural()"
      [loading]="loading()"
      [skeletonRows]="skeletonRows()"
      [pagination]="pagination()"
      [pageSize]="pageSize()"
      [pageSizeOptions]="pageSizeOptions()"
      [selectable]="selectable()"
      [selectionActions]="selectionActions()"
      [stickyHeader]="stickyHeader()"
      [stripedRows]="stripedRows()"
      [bordered]="bordered()"
      [roundedBorders]="roundedBorders()"
      [sortable]="sortable()"
      [multiSort]="multiSort()"
      [expandable]="expandable()"
      [expandMode]="expandMode()"
      [exportable]="exportable()"
      [exportFileName]="exportFileName()"
      [exportFormats]="exportFormats()"
      [exportColumns]="exportColumns()"
      [exportScope]="exportScope()"
      [virtualScroll]="virtualScroll()"
      [virtualScrollVisibleItems]="virtualScrollVisibleItems()"
      [resizableColumns]="resizableColumns()"
      [reorderableColumns]="reorderableColumns()"
      [columnChooser]="columnChooser()"
      [columnChooserLabel]="columnChooserLabel()"
      [groupBy]="groupBy()"
      [groupHeaderLabel]="groupHeaderLabel()"
      [inlineEdit]="inlineEdit()"
      [inlineEditLabel]="inlineEditLabel()"
      [saveInlineEditLabel]="saveInlineEditLabel()"
      [cancelInlineEditLabel]="cancelInlineEditLabel()"
      [initialLayout]="initialLayout()"
      [showRowNumbers]="showRowNumbers()"
      [density]="density()"
      [rowClass]="rowClass()"
      [footerRow]="footerRow()"
      [emptyStateTemplate]="emptyStateTemplate()"
      [serverSide]="serverSide()"
      [totalItems]="totalItems()"
      [pageParam]="pageParam()"
      [searchParam]="searchParam()"
      [sortParam]="sortParam()"
      [sortDirParam]="sortDirParam()"
      [multiSortParam]="multiSortParam()"
      [useUrlState]="useUrlState()"
      [emptyMessage]="emptyMessage()"
      (selectionChange)="onTableSelectionChange($event)"
      (rowClick)="onTableRowClick($event)"
      (rowDblClick)="onTableRowDblClick($event)"
      (actionClick)="onTableActionClick($event)"
      (selectionActionClick)="onTableSelectionActionClick($event)"
      (serverStateChange)="serverStateChange.emit($event)"
      (searchChange)="searchChange.emit($event)"
      (columnResize)="columnResize.emit($event)"
      (columnReorder)="columnReorder.emit($event)"
      (layoutChange)="layoutChange.emit($event)"
      (cellEditCommit)="onTableCellEditCommit($event)"
    >
      @if (expandTemplate(); as tpl) {
        <ng-template neuTableExpand let-row>
          <ng-container
            [ngTemplateOutlet]="expandTemplateRef(tpl)"
            [ngTemplateOutletContext]="expandTemplateContext(row)"
          />
        </ng-template>
      }
    </neu-table>

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
  readonly columns = input<NeuTableColumn<any>[]>([]);
  readonly title = input('');
  readonly toolbarExtraRef = input<TemplateRef<unknown> | null>(null);
  readonly treeColumnKey = input('label');
  readonly rowKey = input('id');
  readonly tableAriaLabel = input('Tree table');
  readonly searchPlaceholder = input('Search rows');
  readonly exactMatchLabel = input('Exact match');
  readonly searchAriaLabel = input('Search tree table');
  readonly clearSearchAriaLabel = input('Clear search');
  readonly clearFilterLabel = input('Clear filter');
  readonly previousPageAriaLabel = input('Previous page');
  readonly nextPageAriaLabel = input('Next page');
  readonly pageSizeLabel = input('Rows:');
  readonly pageSizeAriaLabel = input('Rows per page');
  readonly paginationAriaLabel = input('Tree table pagination');
  readonly exportCsvTitle = input('Export CSV');
  readonly exportJsonTitle = input('Export JSON');
  readonly exportXlsxTitle = input('Export XLSX');
  readonly clearSelectionLabel = input('Clear selection');
  readonly selectionSummaryLabel = input('selected');
  readonly selectAllAriaLabel = input('Select all visible tree rows');
  readonly selectRowAriaLabel = input('Select tree row');
  readonly expandRowAriaLabel = input('Expand detail row');
  readonly filterPlaceholder = input('Filter...');
  readonly filterAriaPrefix = input('Filter by');
  readonly allFilterOptionLabel = input('All');
  readonly ofLabel = input('of');
  readonly resultLabelSingular = input('result');
  readonly resultLabelPlural = input('results');
  readonly emptyMessage = input('No rows found');
  readonly expandLabel = input('Expand row');
  readonly collapseLabel = input('Collapse row');
  readonly indentSize = input(18);

  readonly loading = input(false);
  readonly skeletonRows = input<number[]>([1, 2, 3, 4, 5]);
  readonly searchable = input(true);
  readonly exactMatchable = input(false);
  readonly pagination = input(true);
  readonly pageSize = input(10);
  readonly selectable = input(false);
  readonly selectionActions = input<NeuTableSelectionAction<Record<string, unknown>>[]>([]);
  readonly stickyHeader = input(false);
  readonly stripedRows = input(false);
  readonly bordered = input(true);
  readonly roundedBorders = input(true);
  readonly sortable = input(false);
  readonly multiSort = input(false);
  readonly expandable = input(false);
  readonly expandMode = input<'multiple' | 'single'>('multiple');
  readonly exportable = input(false);
  readonly exportFileName = input('tree-table-export');
  readonly exportFormats = input<('csv' | 'json' | 'xlsx')[]>(['csv']);
  readonly exportColumns = input<string[]>([]);
  readonly exportScope = input<'filtered' | 'selected' | 'auto'>('auto');
  readonly virtualScroll = input(false);
  readonly virtualScrollVisibleItems = input(8);
  readonly resizableColumns = input(false);
  readonly reorderableColumns = input(false);
  readonly columnChooser = input(false);
  readonly columnChooserLabel = input('Columns');
  readonly groupBy = input('');
  readonly groupHeaderLabel = input('Group:');
  readonly inlineEdit = input(false);
  readonly inlineEditLabel = input('Edit cell');
  readonly saveInlineEditLabel = input('Save cell');
  readonly cancelInlineEditLabel = input('Cancel cell edit');
  readonly initialLayout = input<NeuTableLayout | null>(null);
  readonly showRowNumbers = input(false);
  readonly useUrlState = input(false);
  readonly density = input<'compact' | 'normal' | 'relaxed'>('normal');
  readonly pageSizeOptions = input<number[]>([5, 10, 20]);
  readonly rowClass = input<((row: Record<string, unknown>) => string) | undefined>(undefined);
  readonly footerRow = input<Record<string, string | number> | undefined>(undefined);
  readonly emptyStateTemplate = input<TemplateRef<void> | undefined>(undefined);
  readonly serverSide = input(false);
  readonly totalItems = input<number | undefined>(undefined);
  readonly pageParam = input('page');
  readonly searchParam = input('q');
  readonly sortParam = input('sort');
  readonly sortDirParam = input('sortDir');
  readonly multiSortParam = input('msort');

  readonly selectionChange = output<NeuTreeTableNode[]>();
  readonly nodeClick = output<NeuTreeTableNode>();
  readonly nodeDblClick = output<NeuTreeTableNode>();
  readonly expansionChange = output<string[]>();
  readonly actionClick = output<NeuTreeTableActionEvent>();
  readonly selectionActionClick = output<NeuTreeTableSelectionActionEvent>();
  readonly serverStateChange = output<NeuTableServerState>();
  readonly searchChange = output<string>();
  readonly columnResize = output<{ key: string; width: number }>();
  readonly columnReorder = output<NeuTableColumnReorderEvent>();
  readonly layoutChange = output<NeuTableLayout>();
  readonly cellEditCommit = output<NeuTreeTableCellEditEvent>();

  readonly expandTemplate = contentChild(NeuTableExpandDirective);
  private readonly treeCellTpl = viewChild<TemplateRef<unknown>>('treeCellTpl');
  private readonly expandedKeys = signal<Set<string>>(new Set());

  readonly flatRows = computed<Record<string, unknown>[]>(() => this.flattenNodes(this.nodes(), 0));

  readonly resolvedColumns = computed<NeuTableColumn<Record<string, unknown>>[]>(() => {
    const tpl = this.treeCellTpl();
    const treeColumnKey = this.treeColumnKey();
    const columns = this.columns() as NeuTableColumn<Record<string, unknown>>[];
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

  onTableRowDblClick(row: Record<string, unknown>): void {
    this.nodeDblClick.emit(this.asFlatRow(row).__treeNode);
  }

  onTableActionClick(event: {
    action: NeuTableAction<Record<string, unknown>>;
    row: Record<string, unknown>;
  }): void {
    const row = this.asFlatRow(event.row);
    this.actionClick.emit({ action: event.action, node: row.__treeNode, row });
  }

  onTableSelectionActionClick(event: {
    action: NeuTableSelectionAction<Record<string, unknown>>;
    rows: Record<string, unknown>[];
  }): void {
    const rows = event.rows.map((row) => this.asFlatRow(row));
    this.selectionActionClick.emit({
      action: event.action,
      nodes: rows.map((row) => row.__treeNode),
      rows,
    });
  }

  onTableCellEditCommit(event: NeuTableCellEditEvent<Record<string, unknown>>): void {
    const row = this.asFlatRow(event.row);
    this.cellEditCommit.emit({
      node: row.__treeNode,
      row,
      column: event.column,
      value: event.value,
      previousValue: event.previousValue,
    });
  }

  expandTemplateContext(row: Record<string, unknown>): {
    $implicit: NeuTreeTableNode;
    node: NeuTreeTableNode;
    row: NeuTreeTableRow;
  } {
    const treeRow = this.asFlatRow(row);
    return { $implicit: treeRow.__treeNode, node: treeRow.__treeNode, row: treeRow };
  }

  expandTemplateRef(directive: NeuTableExpandDirective): TemplateRef<unknown> {
    return directive.templateRef as TemplateRef<unknown>;
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
