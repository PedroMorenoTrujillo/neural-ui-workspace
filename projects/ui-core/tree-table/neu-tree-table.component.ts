import {
  ElementRef,
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  NeuTableAction,
  NeuTableBodyDirective,
  NeuTableBodyRenderEntry,
  NeuTableBodySectionDirective,
  NeuTableCaptionDirective,
  NeuTableCellEditEvent,
  NeuTableCellEditLifecycleEvent,
  NeuTableCellEditorDirective,
  NeuTableCellViewDirective,
  NeuTableColumn,
  NeuTableColumnReorderEvent,
  NeuTableComponent,
  NeuTableEditMode,
  NeuTableEditValidationEvent,
  NeuTableExpandDirective,
  NeuTableExpandMode,
  NeuTableEmptyDirective,
  NeuTableExportConfig,
  NeuTableFooterGroupDirective,
  NeuTableGroupFooterDirective,
  NeuTableGroupHeaderDirective,
  NeuTableHeaderGroupDirective,
  NeuTableLazyRequest,
  NeuTableLabels,
  NeuTableLoadingBodyDirective,
  NeuTablePaginatorLeftDirective,
  NeuTablePaginatorRightDirective,
  NeuTableQueryState,
  NeuTableRowEditContext,
  NeuTableRowEditEvent,
  NeuTableRowSelectionEvent,
  NeuTableSortState,
  NeuTableStructuralContext,
  NeuTableSummaryDirective,
  NeuTableToolbarDirective,
  NeuTableLayout,
  NeuTableSelectionAction,
  NeuTableUrlStateOptions,
  NeuTableVirtualizationOptions,
} from '@neural-ui/core/table';
import { walkNeuTreeDepthFirst } from '@neural-ui/core/internal';
import {
  projectNeuTreeTable,
  type NeuTreeTableProjectedNode,
} from './neu-tree-table-hierarchy.controller';
import {
  NeuTreeTableBodyDirective,
  NeuTreeTableBodySectionDirective,
  NeuTreeTableNodeDirective,
} from './neu-tree-table-templates.directive';
import type {
  InternalNeuTreeTableRow,
  NeuTreeTableActionEvent,
  NeuTreeTableBodyContext,
  NeuTreeTableBodyDataEntry,
  NeuTreeTableBodyRenderEntry,
  NeuTreeTableBodySectionContext,
  NeuTreeTableCellEditEvent,
  NeuTreeTableFilterMode,
  NeuTreeTableLazyRequest,
  NeuTreeTableLabels,
  NeuTreeTableNode,
  NeuTreeTableNodeContext,
  NeuTreeTableRow,
  NeuTreeTableRowEditEvent,
  NeuTreeTableRowEditValidator,
  NeuTreeTableScrollOptions,
  NeuTreeTableSelection,
  NeuTreeTableSelectionActionEvent,
  NeuTreeTableSelectionEvent,
  NeuTreeTableSelectionMode,
} from './neu-tree-table.types';

export type {
  NeuTreeTableActionEvent,
  NeuTreeTableBodyContext,
  NeuTreeTableBodyDataEntry,
  NeuTreeTableBodyRenderEntry,
  NeuTreeTableBodySectionContext,
  NeuTreeTableCellEditEvent,
  NeuTreeTableFilterMode,
  NeuTreeTableLazyRequest,
  NeuTreeTableLabels,
  NeuTreeTableNode,
  NeuTreeTableNodeContext,
  NeuTreeTableRow,
  NeuTreeTableRowEditEvent,
  NeuTreeTableRowEditValidator,
  NeuTreeTableScrollOptions,
  NeuTreeTableSelection,
  NeuTreeTableSelectionActionEvent,
  NeuTreeTableSelectionEvent,
  NeuTreeTableSelectionMode,
} from './neu-tree-table.types';

const NEU_TREE_TABLE_LABELS = {
  searchPlaceholder: 'Search rows',
  searchAriaLabel: 'Search tree table',
  clearSearchAriaLabel: 'Clear search',
  previousPageAriaLabel: 'Previous page',
  nextPageAriaLabel: 'Next page',
  pageSizeLabel: 'Rows:',
  pageSizeAriaLabel: 'Rows per page',
  paginationAriaLabel: 'Tree table pagination',
  clearSelectionLabel: 'Clear selection',
  selectionSummaryLabel: 'selected',
  selectAllAriaLabel: 'Select all visible tree rows',
  selectRowAriaLabel: 'Select tree row',
  expandRowAriaLabel: 'Expand detail row',
  columnChooserLabel: 'Columns',
  groupHeaderLabel: 'Group:',
  inlineEditLabel: 'Edit cell',
  saveInlineEditLabel: 'Save cell',
  cancelInlineEditLabel: 'Cancel cell edit',
  ofLabel: 'of',
  resultLabelSingular: 'result',
  resultLabelPlural: 'results',
  exactMatchLabel: 'Exact match',
  clearFilterLabel: 'Clear filter',
  filterPlaceholder: 'Filter...',
  filterAriaPrefix: 'Filter by',
  allFilterOptionLabel: 'All',
  emptyMessage: 'No rows found',
  expandNodeAriaLabel: 'Expand row',
  collapseNodeAriaLabel: 'Collapse row',
} satisfies NeuTreeTableLabels;

@Component({
  selector: 'neu-tree-table',
  standalone: true,
  host: { '(keydown)': 'onHostKeydown($event)' },
  imports: [
    NgTemplateOutlet,
    NeuTableComponent,
    NeuTableBodyDirective,
    NeuTableBodySectionDirective,
    NeuTableCaptionDirective,
    NeuTableCellEditorDirective,
    NeuTableCellViewDirective,
    NeuTableExpandDirective,
    NeuTableEmptyDirective,
    NeuTableFooterGroupDirective,
    NeuTableGroupFooterDirective,
    NeuTableGroupHeaderDirective,
    NeuTableHeaderGroupDirective,
    NeuTableLoadingBodyDirective,
    NeuTablePaginatorLeftDirective,
    NeuTablePaginatorRightDirective,
    NeuTableSummaryDirective,
    NeuTableToolbarDirective,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <neu-table
      class="neu-tree-table"
      [columns]="resolvedColumns()"
      [data]="flatRows()"
      [query]="effectiveQuery()"
      [sort]="effectiveSort()"
      [title]="title()"
      rowKey="id"
      [tableAriaLabel]="tableAriaLabel()"
      [searchable]="searchable()"
      [exactMatchable]="exactMatchable()"
      [labels]="tableLabels()"
      [advancedFilterTexts]="tableFilterTexts()"
      [loading]="loading()"
      [pagination]="pagination()"
      [pageSize]="pageSize()"
      [pageSizeOptions]="pageSizeOptions()"
      [selectable]="tableSelectable()"
      [selection]="selectedRows()"
      [rowSelectable]="isRowSelectable"
      [metaKeySelection]="metaKeySelection()"
      [selectionActions]="selectionActions()"
      [stickyHeader]="stickyHeader()"
      [stripedRows]="stripedRows()"
      [bordered]="bordered()"
      [roundedBorders]="roundedBorders()"
      [sortable]="sortable()"
      [multiSort]="multiSort()"
      [expandMode]="expandMode()"
      [exportOptions]="exportOptions()"
      [virtualScroll]="virtualScroll()"
      [virtualizationOptions]="virtualizationOptions()"
      [resizableColumns]="resizableColumns()"
      [reorderableColumns]="reorderableColumns()"
      [columnChooser]="columnChooser()"
      [groupBy]="groupBy()"
      [editMode]="effectiveEditMode()"
      [editingRowKeys]="editingRowKeys()"
      [rowEditValidator]="tableRowEditValidator"
      [initialLayout]="initialLayout()"
      [showRowNumbers]="showRowNumbers()"
      [density]="density()"
      [rowClass]="rowClass()"
      [footerRow]="footerRow()"
      [serverSide]="true"
      [totalItems]="effectiveTotalItems()"
      [urlStateOptions]="urlStateOptions()"
      [emptyMessage]="resolvedLabels().emptyMessage"
      (selectionChange)="onTableSelectionChange($event)"
      (rowSelect)="onTableRowSelect($event)"
      (rowUnselect)="onTableRowUnselect($event)"
      (rowClick)="onTableRowClick($event)"
      (rowDblClick)="onTableRowDblClick($event)"
      (actionClick)="onTableActionClick($event)"
      (selectionActionClick)="onTableSelectionActionClick($event)"
      (queryChange)="onTableQueryChange($event)"
      (sortChange)="sortChange.emit($event)"
      (lazyRequest)="onTableLazyRequest($event)"
      (searchChange)="searchChange.emit($event)"
      (columnResize)="columnResize.emit($event)"
      (columnReorder)="columnReorder.emit($event)"
      (layoutChange)="layoutChange.emit($event)"
      (cellEditCommit)="onTableCellEditCommit($event)"
      (cellEditInit)="onTableCellEditLifecycle('init', $event)"
      (cellEditCancel)="onTableCellEditLifecycle('cancel', $event)"
      (editValidationError)="onTableEditValidationError($event)"
      (editingRowKeysChange)="editingRowKeysChange.emit($event.map(asNodeKey))"
      (rowEditInit)="onTableRowEdit('init', $event)"
      (rowEditSave)="onTableRowEdit('save', $event)"
      (rowEditCancel)="onTableRowEdit('cancel', $event)"
    >
      @if (toolbarTemplateRef(); as toolbar) {
        <ng-template neuTableToolbar>
          <ng-container [ngTemplateOutlet]="toolbar" />
        </ng-template>
      }
      @if (captionTemplate(); as caption) {
        <ng-template
          neuTableCaption
          let-columns="columns"
          let-colspan="colspan"
          let-column="column"
        >
          <ng-container
            [ngTemplateOutlet]="$any(caption.templateRef)"
            [ngTemplateOutletContext]="$any({ $implicit: columns, columns, colspan, column })"
          />
        </ng-template>
      }
      @if (headerGroupTemplate(); as header) {
        <ng-template
          neuTableHeaderGroup
          let-columns="columns"
          let-colspan="colspan"
          let-column="column"
        >
          <ng-container
            [ngTemplateOutlet]="$any(header.templateRef)"
            [ngTemplateOutletContext]="$any({ $implicit: columns, columns, colspan, column })"
          />
        </ng-template>
      }
      @if (footerGroupTemplate(); as footer) {
        <ng-template
          neuTableFooterGroup
          let-columns="columns"
          let-colspan="colspan"
          let-column="column"
        >
          <ng-container
            [ngTemplateOutlet]="$any(footer.templateRef)"
            [ngTemplateOutletContext]="$any({ $implicit: columns, columns, colspan, column })"
          />
        </ng-template>
      }
      @if (summaryTemplate(); as summary) {
        <ng-template
          neuTableSummary
          let-columns="columns"
          let-colspan="colspan"
          let-column="column"
        >
          <ng-container
            [ngTemplateOutlet]="$any(summary.templateRef)"
            [ngTemplateOutletContext]="$any({ $implicit: columns, columns, colspan, column })"
          />
        </ng-template>
      }
      @if (emptyTemplateRef(); as empty) {
        <ng-template
          neuTableEmpty
          let-columns="columns"
          let-colspan="colspan"
          let-column="column"
          let-message="message"
        >
          <ng-container
            [ngTemplateOutlet]="$any(empty)"
            [ngTemplateOutletContext]="
              $any({ $implicit: columns, columns, colspan, column, message })
            "
          />
        </ng-template>
      }
      @if (loadingBodyTemplate(); as loadingBody) {
        <ng-template
          neuTableLoadingBody
          let-columns="columns"
          let-colspan="colspan"
          let-column="column"
        >
          <ng-container
            [ngTemplateOutlet]="$any(loadingBody.templateRef)"
            [ngTemplateOutletContext]="$any({ $implicit: columns, columns, colspan, column })"
          />
        </ng-template>
      } @else {
        <ng-template neuTableLoadingBody let-columns="columns" let-colspan="colspan">
          <tr class="neu-table__row--loading" aria-hidden="true">
            <td [attr.colspan]="colspan" class="neu-table__td neu-table__td--center">
              <div class="neu-table__skeleton-rows">
                @for (_ of skeletonRows(); track $index) {
                  <div class="neu-table__skeleton-row">
                    @for (__ of columns; track $index) {
                      <div class="neu-table__skeleton-cell"></div>
                    }
                  </div>
                }
              </div>
            </td>
          </tr>
        </ng-template>
      }
      @if (paginatorLeftTemplate(); as left) {
        <ng-template
          neuTablePaginatorLeft
          let-currentPage
          let-totalPages="totalPages"
          let-first="first"
          let-last="last"
          let-rows="rows"
          let-totalRecords="totalRecords"
          let-disabled="disabled"
          let-goToPage="goToPage"
          let-setPageSize="setPageSize"
        >
          <ng-container
            [ngTemplateOutlet]="$any(left.templateRef)"
            [ngTemplateOutletContext]="
              $any({
                $implicit: currentPage,
                currentPage,
                totalPages,
                first,
                last,
                rows,
                totalRecords,
                disabled,
                goToPage,
                setPageSize,
              })
            "
          />
        </ng-template>
      }
      @if (paginatorRightTemplate(); as right) {
        <ng-template
          neuTablePaginatorRight
          let-currentPage
          let-totalPages="totalPages"
          let-first="first"
          let-last="last"
          let-rows="rows"
          let-totalRecords="totalRecords"
          let-disabled="disabled"
          let-goToPage="goToPage"
          let-setPageSize="setPageSize"
        >
          <ng-container
            [ngTemplateOutlet]="$any(right.templateRef)"
            [ngTemplateOutletContext]="
              $any({
                $implicit: currentPage,
                currentPage,
                totalPages,
                first,
                last,
                rows,
                totalRecords,
                disabled,
                goToPage,
                setPageSize,
              })
            "
          />
        </ng-template>
      }
      @if (groupHeaderTemplate(); as groupHeader) {
        <ng-template
          neuTableGroupHeader
          let-group
          let-label="label"
          let-rows="rows"
          let-count="count"
          let-groupIndex="groupIndex"
          let-expanded="expanded"
          let-frozen="frozen"
          let-toggle="toggle"
        >
          <ng-container
            [ngTemplateOutlet]="$any(groupHeader.templateRef)"
            [ngTemplateOutletContext]="
              $any({
                $implicit: group,
                group,
                label,
                rows,
                count,
                groupIndex,
                expanded,
                frozen,
                toggle,
              })
            "
          />
        </ng-template>
      }
      @if (groupFooterTemplate(); as groupFooter) {
        <ng-template
          neuTableGroupFooter
          let-group
          let-label="label"
          let-rows="rows"
          let-count="count"
          let-groupIndex="groupIndex"
          let-expanded="expanded"
          let-frozen="frozen"
          let-toggle="toggle"
        >
          <ng-container
            [ngTemplateOutlet]="$any(groupFooter.templateRef)"
            [ngTemplateOutletContext]="
              $any({
                $implicit: group,
                group,
                label,
                rows,
                count,
                groupIndex,
                expanded,
                frozen,
                toggle,
              })
            "
          />
        </ng-template>
      }
      @if (treeBodyTemplate(); as body) {
        <ng-template
          neuTableBody
          let-row
          let-rowIndex="rowIndex"
          let-logicalIndex="logicalIndex"
          let-frozen="frozen"
          let-columns="columns"
          let-edit="edit"
        >
          <ng-container
            [ngTemplateOutlet]="body.templateRef"
            [ngTemplateOutletContext]="
              treeBodyContext(row, rowIndex, logicalIndex, frozen, columns, edit)
            "
          />
        </ng-template>
      }
      @if (treeBodySectionTemplate(); as section) {
        <ng-template
          neuTableBodySection
          let-entries="entries"
          let-columns="columns"
          let-colspan="colspan"
          let-virtualized="virtualized"
          let-siblingRowsSupported="siblingRowsSupported"
        >
          <ng-container
            [ngTemplateOutlet]="section.templateRef"
            [ngTemplateOutletContext]="
              treeBodySectionContext(entries, columns, colspan, virtualized, siblingRowsSupported)
            "
          />
        </ng-template>
      }
      @for (view of cellViewTemplates(); track view.columnKey()) {
        <ng-template
          [neuTableCellView]="view.columnKey()"
          let-row
          let-rowIndex="rowIndex"
          let-logicalIndex="logicalIndex"
          let-column="column"
          let-value="value"
          let-frozen="frozen"
          let-editing="editing"
          let-startEdit="startEdit"
        >
          <ng-container
            [ngTemplateOutlet]="$any(view.templateRef)"
            [ngTemplateOutletContext]="
              $any({
                $implicit: row,
                row,
                rowIndex,
                logicalIndex,
                column,
                value,
                frozen,
                editing,
                startEdit,
              })
            "
          />
        </ng-template>
      }
      @for (editor of cellEditorTemplates(); track editor.columnKey()) {
        <ng-template
          [neuTableCellEditor]="editor.columnKey()"
          let-value
          let-row="row"
          let-rowIndex="rowIndex"
          let-logicalIndex="logicalIndex"
          let-column="column"
          let-previousValue="previousValue"
          let-frozen="frozen"
          let-invalid="invalid"
          let-error="error"
          let-setValue="setValue"
          let-save="save"
          let-cancel="cancel"
        >
          <ng-container
            [ngTemplateOutlet]="$any(editor.templateRef)"
            [ngTemplateOutletContext]="
              $any({
                $implicit: value,
                row,
                rowIndex,
                logicalIndex,
                column,
                value,
                previousValue,
                frozen,
                invalid,
                error,
                setValue,
                save,
                cancel,
              })
            "
          />
        </ng-template>
      }
      @if (expandTemplate(); as tpl) {
        <ng-template neuTableExpand let-row>
          <ng-container
            [ngTemplateOutlet]="expandTemplateRef(tpl)"
            [ngTemplateOutletContext]="expandTemplateContext(row)"
          />
        </ng-template>
      }
    </neu-table>

    <ng-template #treeCellTpl let-row let-column="column">
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
            [attr.aria-expanded]="row.__treeExpanded"
            [disabled]="row.__treeDisabled"
            (click)="toggleNode(row.__treeNode, $event)"
            (keydown)="onTreeToggleKeydown(row, $event)"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m7 5 6 5-6 5" />
            </svg>
          </button>
        } @else {
          <span class="neu-tree-table__toggle neu-tree-table__toggle--placeholder"></span>
        }

        <div class="neu-tree-table__content">
          @if (treeNodeTemplate(); as nodeTemplate) {
            <ng-container
              [ngTemplateOutlet]="nodeTemplate.templateRef"
              [ngTemplateOutletContext]="treeNodeContext(row, column)"
            />
          } @else {
            @if (consumerTreeCellTemplate(); as consumerTemplate) {
              <ng-container
                [ngTemplateOutlet]="consumerTemplate"
                [ngTemplateOutletContext]="{ $implicit: row, row, column }"
              />
            } @else {
              <div class="neu-tree-table__main">
                <span class="neu-tree-table__label">{{ row.label }}</span>
                @if (row.badge) {
                  <span class="neu-tree-table__badge">{{ row.badge }}</span>
                }
              </div>
              @if (row.description) {
                <span class="neu-tree-table__description">{{ row.description }}</span>
              }
            }
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
  readonly treeColumnKey = input('label');
  readonly tableAriaLabel = input('Tree table');
  readonly labels = input<NeuTreeTableLabels>({});
  readonly indentSize = input(18);

  readonly loading = input(false);
  protected readonly skeletonRows = computed(() => [1, 2, 3, 4, 5] as const);
  readonly searchable = input(true);
  readonly exactMatchable = input(false);
  readonly pagination = input(true);
  readonly pageSize = input(10);
  readonly selectionActions = input<NeuTableSelectionAction<Record<string, unknown>>[]>([]);
  readonly stickyHeader = input(false);
  readonly stripedRows = input(false);
  readonly bordered = input(true);
  readonly roundedBorders = input(true);
  readonly sortable = input(false);
  readonly multiSort = input(false);
  readonly expandMode = input<NeuTableExpandMode>('none');
  readonly exportOptions = input<NeuTableExportConfig<Record<string, unknown>>>({});
  readonly virtualScroll = input(false);
  readonly virtualizationOptions = input<NeuTableVirtualizationOptions>({});
  readonly resizableColumns = input(false);
  readonly reorderableColumns = input(false);
  readonly columnChooser = input(false);
  readonly groupBy = input('');
  readonly initialLayout = input<NeuTableLayout | null>(null);
  readonly showRowNumbers = input(false);
  readonly density = input<'compact' | 'normal' | 'relaxed'>('normal');
  readonly pageSizeOptions = input<number[]>([5, 10, 20]);
  readonly rowClass = input<((row: Record<string, unknown>) => string) | undefined>(undefined);
  readonly footerRow = input<Record<string, string | number> | undefined>(undefined);
  readonly serverSide = input(false);
  readonly totalItems = input<number | undefined>(undefined);
  readonly urlStateOptions = input<NeuTableUrlStateOptions>({});

  // Canonical controlled TreeTable state and policy owners.
  readonly query = input<NeuTableQueryState | undefined>(undefined);
  readonly sort = input<NeuTableSortState | undefined>(undefined);
  readonly filterMode = input<NeuTreeTableFilterMode>('lenient');
  readonly selectionMode = input<NeuTreeTableSelectionMode>('none');
  readonly selection = input<NeuTreeTableSelection | undefined>(undefined);
  readonly metaKeySelection = input(false);
  readonly expandedKeys = input<readonly string[] | undefined>(undefined);
  readonly editMode = input<NeuTableEditMode>('none');
  readonly editingRowKeys = input<readonly string[] | undefined>(undefined);
  readonly rowEditValidator = input<NeuTreeTableRowEditValidator | undefined>(undefined);

  protected readonly resolvedLabels = computed(
    () =>
      ({
        ...NEU_TREE_TABLE_LABELS,
        ...this.labels(),
      }) as typeof NEU_TREE_TABLE_LABELS & NeuTreeTableLabels,
  );

  protected readonly tableLabels = computed<NeuTableLabels>(() => this.resolvedLabels());

  protected readonly tableFilterTexts = computed(() => ({
    exactMatch: this.resolvedLabels().exactMatchLabel,
    clear: this.resolvedLabels().clearFilterLabel,
    placeholder: this.resolvedLabels().filterPlaceholder,
    ariaPrefix: this.resolvedLabels().filterAriaPrefix,
    all: this.resolvedLabels().allFilterOptionLabel,
  }));

  readonly selectionChange = output<NeuTreeTableNode[]>();
  readonly nodeClick = output<NeuTreeTableNode>();
  readonly nodeDblClick = output<NeuTreeTableNode>();
  readonly actionClick = output<NeuTreeTableActionEvent>();
  readonly selectionActionClick = output<NeuTreeTableSelectionActionEvent>();
  readonly searchChange = output<string>();
  readonly columnResize = output<{ key: string; width: number }>();
  readonly columnReorder = output<NeuTableColumnReorderEvent>();
  readonly layoutChange = output<NeuTableLayout>();
  readonly cellEditCommit = output<NeuTreeTableCellEditEvent>();
  readonly queryChange = output<NeuTableQueryState>();
  readonly sortChange = output<NeuTableSortState>();
  readonly expandedKeysChange = output<readonly string[]>();
  readonly nodeSelect = output<NeuTreeTableSelectionEvent>();
  readonly nodeUnselect = output<NeuTreeTableSelectionEvent>();
  readonly lazyRequest = output<NeuTreeTableLazyRequest>();
  readonly cellEditInit = output<NeuTreeTableCellEditEvent>();
  readonly cellEditCancel = output<NeuTreeTableCellEditEvent>();
  readonly editValidationError = output<NeuTableEditValidationEvent<Record<string, unknown>>>();
  readonly editingRowKeysChange = output<readonly string[]>();
  readonly rowEditInit = output<NeuTreeTableRowEditEvent>();
  readonly rowEditSave = output<NeuTreeTableRowEditEvent>();
  readonly rowEditCancel = output<NeuTreeTableRowEditEvent>();

  /* v8 ignore start -- Angular signal-query factories; projected tree-table slots are covered. */
  readonly expandTemplate = contentChild(NeuTableExpandDirective);
  readonly toolbarTemplate = contentChild(NeuTableToolbarDirective);
  readonly captionTemplate = contentChild(NeuTableCaptionDirective);
  readonly headerGroupTemplate = contentChild(NeuTableHeaderGroupDirective);
  readonly footerGroupTemplate = contentChild(NeuTableFooterGroupDirective);
  readonly groupHeaderTemplate = contentChild(NeuTableGroupHeaderDirective);
  readonly groupFooterTemplate = contentChild(NeuTableGroupFooterDirective);
  readonly loadingBodyTemplate = contentChild(NeuTableLoadingBodyDirective);
  readonly emptyTemplate = contentChild(NeuTableEmptyDirective);
  readonly summaryTemplate = contentChild(NeuTableSummaryDirective);
  readonly paginatorLeftTemplate = contentChild(NeuTablePaginatorLeftDirective);
  readonly paginatorRightTemplate = contentChild(NeuTablePaginatorRightDirective);
  readonly cellViewTemplates = contentChildren(NeuTableCellViewDirective);
  readonly cellEditorTemplates = contentChildren(NeuTableCellEditorDirective);
  readonly treeNodeTemplate = contentChild(NeuTreeTableNodeDirective);
  readonly treeBodyTemplate = contentChild(NeuTreeTableBodyDirective);
  readonly treeBodySectionTemplate = contentChild(NeuTreeTableBodySectionDirective);
  private readonly treeCellTpl = viewChild<TemplateRef<unknown>>('treeCellTpl');
  private readonly table = viewChild(NeuTableComponent);
  /* v8 ignore stop */
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly internalExpandedKeys = signal<Set<string>>(new Set());
  private readonly internalSelectionKeys = signal<Set<string>>(new Set());
  private readonly internalQuery = signal<NeuTableQueryState>(this.defaultQuery());

  protected readonly toolbarTemplateRef = computed(
    () => this.toolbarTemplate()?.templateRef ?? null,
  );
  protected readonly emptyTemplateRef = computed(() => this.emptyTemplate()?.templateRef ?? null);
  readonly effectiveQuery = computed(() => this.query() ?? this.internalQuery());
  readonly effectiveSort = computed<NeuTableSortState>(
    () => this.sort() ?? this.effectiveQuery().sortEntries,
  );
  protected readonly effectiveExpandedKeys = computed(
    () => new Set(this.expandedKeys() ?? this.internalExpandedKeys()),
  );
  readonly effectiveEditMode = computed<NeuTableEditMode>(() => this.editMode());
  readonly tableSelectionMode = computed<'none' | 'single' | 'multiple'>(() => {
    const mode = this.effectiveSelectionMode();
    return mode === 'checkbox' ? 'multiple' : mode;
  });
  readonly tableSelectable = computed<false | 'single' | 'multiple'>(() => {
    const mode = this.tableSelectionMode();
    return mode === 'none' ? false : mode;
  });
  private readonly effectiveSelectionMode = computed<NeuTreeTableSelectionMode>(() => {
    return this.selectionMode();
  });

  private readonly hierarchy = computed(() =>
    projectNeuTreeTable(this.nodes(), {
      query: this.serverSide() ? this.queryWithoutLocalFilters() : this.effectiveQuery(),
      sort: this.serverSide() ? [] : this.effectiveSort(),
      filterMode: this.filterMode(),
      exactMatch: this.table()?.exactMatch() ?? false,
      columns: this.columns() as NeuTableColumn<Record<string, unknown>>[],
    }),
  );
  private readonly allRowsById = computed(() => this.indexAllRows(this.nodes()));
  private readonly pageRoots = computed(() => {
    const roots = this.hierarchy().roots;
    if (this.serverSide() || !this.pagination()) return roots;
    const query = this.effectiveQuery();
    const first = Math.max(0, (query.page - 1) * query.pageSize);
    return roots.slice(first, first + query.pageSize);
  });

  readonly flatRows = computed<Record<string, unknown>[]>(() =>
    this.flattenProjection(this.pageRoots()),
  );
  readonly effectiveTotalItems = computed(() =>
    this.serverSide() ? (this.totalItems() ?? this.nodes().length) : this.hierarchy().roots.length,
  );
  private readonly selectedKeys = computed(() => {
    const controlled = this.selection();
    if (controlled === undefined) return this.internalSelectionKeys();
    const values = controlled == null ? [] : Array.isArray(controlled) ? controlled : [controlled];
    return new Set(values.map((node) => node.id));
  });
  readonly selectedRows = computed<Record<string, unknown>[]>(() => {
    const rows = this.allRowsById();
    return [...this.selectedKeys()].flatMap((key) => {
      const row = rows.get(key);
      return row ? [row] : [];
    });
  });
  private readonly partialKeys = computed(() => this.checkboxState(this.selectedKeys()).partial);

  readonly consumerTreeCellTemplate = computed(() => {
    const treeColumnKey = this.treeColumnKey();
    const columns = this.columns() as NeuTableColumn<Record<string, unknown>>[];
    const configured = columns.find((column) => column.key === treeColumnKey) ?? columns[0];
    return configured?.cellTemplate;
  });

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
      if (this.expandedKeys() === undefined) {
        this.internalExpandedKeys.set(this.collectExpandedKeys(this.nodes()));
      }
    });
    effect(() => {
      const controlled = this.selection();
      if (controlled !== undefined) return;
      const valid = new Set(this.allRowsById().keys());
      const retained = new Set([...this.internalSelectionKeys()].filter((key) => valid.has(key)));
      if (!this.sameSet(retained, this.internalSelectionKeys()))
        this.internalSelectionKeys.set(retained);
    });
    afterRenderEffect(() => {
      this.flatRows();
      this.selectedKeys();
      this.partialKeys();
      this.syncTreegridDom();
    });
  }

  toggleNode(node: NeuTreeTableNode, event?: Event): void {
    event?.stopPropagation();
    if ((node.leaf !== false && !node.children?.length) || node.disabled) {
      return;
    }

    const next = new Set(this.effectiveExpandedKeys());
    const expanding = !next.has(node.id);
    if (next.has(node.id)) {
      next.delete(node.id);
    } else {
      next.add(node.id);
    }
    if (this.expandedKeys() === undefined) this.internalExpandedKeys.set(next);
    this.expandedKeysChange.emit(Object.freeze([...next]));
    if (expanding && node.leaf === false && !node.children?.length) {
      this.lazyRequest.emit({ reason: 'node-expand', query: this.effectiveQuery(), node });
    }
  }

  protected onTableSelectionChange(rows: Record<string, unknown>[]): void {
    const proposed = this.selectionProposal(rows);
    if (this.selection() === undefined)
      this.internalSelectionKeys.set(new Set(proposed.map((node) => node.id)));
    this.selectionChange.emit([...proposed]);
  }

  protected onTableRowSelect(event: NeuTableRowSelectionEvent<Record<string, unknown>>): void {
    this.emitSelectionDetail('select', event);
  }

  protected onTableRowUnselect(event: NeuTableRowSelectionEvent<Record<string, unknown>>): void {
    this.emitSelectionDetail('unselect', event);
  }

  protected onTableRowClick(row: Record<string, unknown>): void {
    this.nodeClick.emit(this.asFlatRow(row).__treeNode);
  }

  protected onTableRowDblClick(row: Record<string, unknown>): void {
    this.nodeDblClick.emit(this.asFlatRow(row).__treeNode);
  }

  protected onTableActionClick(event: {
    action: NeuTableAction<Record<string, unknown>>;
    row: Record<string, unknown>;
  }): void {
    const row = this.asFlatRow(event.row);
    this.actionClick.emit({ action: event.action, node: row.__treeNode, row });
  }

  protected onTableSelectionActionClick(event: {
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

  protected onTableCellEditCommit(event: NeuTableCellEditEvent<Record<string, unknown>>): void {
    const row = this.asFlatRow(event.row);
    this.cellEditCommit.emit({
      node: row.__treeNode,
      row,
      column: event.column,
      value: event.value,
      previousValue: event.previousValue,
    });
  }

  protected onTableCellEditLifecycle(
    phase: 'init' | 'cancel',
    event: NeuTableCellEditLifecycleEvent<Record<string, unknown>>,
  ): void {
    const row = this.asFlatRow(event.row);
    const mapped = {
      node: row.__treeNode,
      row,
      column: event.column,
      value: event.value,
      previousValue: event.previousValue,
    };
    (phase === 'init' ? this.cellEditInit : this.cellEditCancel).emit(mapped);
  }

  protected onTableEditValidationError(
    event: NeuTableEditValidationEvent<Record<string, unknown>>,
  ): void {
    this.editValidationError.emit(event);
  }

  protected onTableRowEdit(
    phase: 'init' | 'save' | 'cancel',
    event: NeuTableRowEditEvent<Record<string, unknown>>,
  ): void {
    const mapped = this.mapRowEditEvent(event);
    if (phase === 'init') this.rowEditInit.emit(mapped);
    else if (phase === 'save') this.rowEditSave.emit(mapped);
    else this.rowEditCancel.emit(mapped);
  }

  readonly tableRowEditValidator = (event: NeuTableRowEditEvent<Record<string, unknown>>) =>
    this.rowEditValidator()?.(this.mapRowEditEvent(event)) ?? true;

  readonly asNodeKey = (key: unknown): string => String(key);
  readonly isRowSelectable = (row: Record<string, unknown>): boolean => {
    const treeRow = this.asFlatRow(row);
    return !treeRow.__treeDisabled && treeRow.__treeNode.selectable !== false;
  };

  protected onTableQueryChange(query: NeuTableQueryState): void {
    if (this.query() === undefined) this.internalQuery.set(query);
    this.queryChange.emit(query);
    if (this.serverSide()) this.lazyRequest.emit({ reason: 'query', query });
  }

  protected onTableLazyRequest(request: NeuTableLazyRequest): void {
    this.lazyRequest.emit({
      reason: 'virtual',
      query: request.query,
      first: request.range.first,
      last: request.range.end,
    });
  }

  protected expandTemplateContext(row: Record<string, unknown>): {
    $implicit: NeuTreeTableNode;
    node: NeuTreeTableNode;
    data: Record<string, unknown> | undefined;
    row: NeuTreeTableRow;
    level: number;
    leaf: boolean;
    expanded: boolean;
    selected: boolean;
    editing: boolean;
    columns: readonly NeuTableColumn<Record<string, unknown>>[];
    toggle: () => void;
    toggleSelection: () => void;
  } {
    const treeRow = this.asFlatRow(row);
    const node = treeRow.__treeNode;
    return {
      $implicit: node,
      node,
      data: node.data,
      row: treeRow,
      level: treeRow.__treeLevel,
      leaf: !treeRow.__treeHasChildren,
      expanded: treeRow.__treeExpanded,
      selected: this.selectedKeys().has(node.id),
      editing: this.editingRowKeys()?.includes(node.id) ?? false,
      columns: this.resolvedColumns(),
      toggle: () => this.toggleNode(node),
      toggleSelection: () => this.toggleSelectionForNode(node),
    };
  }

  protected expandTemplateRef(directive: NeuTableExpandDirective): TemplateRef<unknown> {
    return directive.templateRef as TemplateRef<unknown>;
  }

  protected treeIndent(row: InternalNeuTreeTableRow): number {
    return row.__treeLevel * this.indentSize();
  }

  protected isTreeRowDisabled(row: InternalNeuTreeTableRow): boolean {
    return row.__treeDisabled;
  }

  protected treeToggleAriaLabel(row: InternalNeuTreeTableRow): string {
    const labels = this.resolvedLabels();
    return `${row.__treeExpanded ? labels.collapseNodeAriaLabel : labels.expandNodeAriaLabel}: ${row.label}`;
  }

  protected onTreeToggleKeydown(row: InternalNeuTreeTableRow, event: KeyboardEvent): void {
    const direction = (
      event.currentTarget as HTMLElement
    ).ownerDocument.defaultView?.getComputedStyle(event.currentTarget as HTMLElement).direction;
    const expandKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const collapseKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if (
      (event.key === expandKey && !row.__treeExpanded) ||
      (event.key === collapseKey && row.__treeExpanded)
    ) {
      event.preventDefault();
      this.toggleNode(row.__treeNode, event);
    }
  }

  protected treeNodeContext(
    row: InternalNeuTreeTableRow,
    column: NeuTableColumn<Record<string, unknown>>,
  ): NeuTreeTableNodeContext {
    const node = row.__treeNode;
    return {
      $implicit: node,
      node,
      data: node.data,
      row,
      column,
      level: row.__treeLevel,
      leaf: !row.__treeHasChildren,
      expanded: row.__treeExpanded,
      selected: this.selectedKeys().has(node.id),
      partial: this.partialKeys().has(node.id),
      editing: this.editingRowKeys()?.includes(node.id) ?? false,
      toggle: () => this.toggleNode(node),
      toggleSelection: () => this.toggleSelectionForNode(node),
    };
  }

  protected treeBodyContext(
    row: Record<string, unknown>,
    rowIndex: number,
    logicalIndex: number,
    frozen: boolean,
    columns: readonly NeuTableColumn<Record<string, unknown>>[],
    edit: NeuTableRowEditContext<Record<string, unknown>>,
  ): NeuTreeTableBodyContext {
    const treeRow = this.asFlatRow(row);
    const node = treeRow.__treeNode;
    return {
      $implicit: node,
      node,
      data: node.data,
      row: treeRow,
      level: treeRow.__treeLevel,
      leaf: !treeRow.__treeHasChildren,
      expanded: treeRow.__treeExpanded,
      selected: this.selectedKeys().has(node.id),
      partial: this.partialKeys().has(node.id),
      editing: edit.editing,
      rowIndex,
      logicalIndex,
      frozen,
      columns,
      toggleSelection: () => this.toggleSelectionForNode(node),
      toggleExpansion: () => this.toggleNode(node),
      edit: {
        editing: edit.editing,
        draft: this.consumerDraft(edit.draft),
        setValue: edit.setValue,
        init: edit.init,
        save: edit.save,
        cancel: edit.cancel,
      },
    };
  }

  protected treeBodySectionContext(
    entries: readonly NeuTableBodyRenderEntry<Record<string, unknown>>[],
    columns: readonly NeuTableColumn<Record<string, unknown>>[],
    colspan: number,
    virtualized: boolean,
    siblingRowsSupported: boolean,
  ): NeuTreeTableBodySectionContext {
    const mapped: NeuTreeTableBodyRenderEntry[] = entries.map((entry) => {
      if (entry.kind !== 'data') return entry;
      const context = this.treeBodyContext(
        entry.row,
        entry.rowIndex,
        entry.logicalIndex,
        entry.frozen,
        entry.columns,
        entry.edit,
      );
      const nodeEntry: NeuTreeTableBodyDataEntry = {
        ...context,
        kind: 'node',
        key: context.node.id,
        focus: () => this.focusNode(context.node.id),
        focusParent: () => this.focusParent(context.node.id),
        focusFirstChild: () => this.focusFirstChild(context.node.id),
        focusPrevious: () => this.focusRelative(context.node.id, -1),
        focusNext: () => this.focusRelative(context.node.id, 1),
      };
      return nodeEntry;
    });
    return {
      $implicit: mapped,
      entries: mapped,
      columns,
      colspan,
      virtualized,
      siblingRowsSupported,
    };
  }

  protected onHostKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    const rowElement =
      event.target instanceof HTMLElement
        ? event.target.closest<HTMLTableRowElement>('tr[data-neu-tree-node-id]')
        : null;
    if (!rowElement || event.target !== rowElement) return;
    const nodeId = rowElement.dataset['neuTreeNodeId'];
    if (!nodeId) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      this.focusRelative(nodeId, event.key === 'ArrowUp' ? -1 : 1);
      event.preventDefault();
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      const rows = this.flatRows();
      const target = rows[event.key === 'Home' ? 0 : rows.length - 1];
      if (target) this.focusNode(this.asFlatRow(target).__treeNode.id);
      event.preventDefault();
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && this.effectiveSelectionMode() !== 'none') {
      const node = this.allRowsById().get(nodeId)?.__treeNode;
      if (node) this.toggleSelectionForNode(node);
      event.preventDefault();
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const row = this.allRowsById().get(nodeId);
    if (!row) return;
    const direction = this.document.defaultView?.getComputedStyle(rowElement).direction;
    const expandKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    if (event.key === expandKey) {
      if (row.__treeHasChildren && !row.__treeExpanded) this.toggleNode(row.__treeNode);
      else if (row.__treeExpanded) this.focusFirstChild(nodeId);
      else return;
    } else if (row.__treeExpanded && row.__treeHasChildren) {
      this.toggleNode(row.__treeNode);
    } else {
      this.focusParent(nodeId);
    }
    event.preventDefault();
    event.stopPropagation();
  }

  /** Useful imperative floor, expressed in Neural vocabulary. */
  resetScrollTop(behavior: ScrollBehavior = 'auto'): void {
    this.table()?.resetVirtualScroll(behavior);
  }

  scrollToVirtualIndex(index: number, behavior: ScrollBehavior = 'auto'): void {
    this.table()?.scrollToIndex(index, behavior);
  }

  scrollTo(options: NeuTreeTableScrollOptions): void {
    const behavior = options.behavior ?? 'auto';
    if (options.nodeId) this.scrollToNode(options.nodeId, behavior);
    else if (options.index != null) this.table()?.scrollToIndex(options.index, behavior);
    else if (options.offset != null) this.table()?.scrollToOffset(options.offset, behavior);
  }

  scrollToNode(nodeId: string, behavior: ScrollBehavior = 'auto'): boolean {
    const index = this.flatRows().findIndex((row) => this.asFlatRow(row).__treeNode.id === nodeId);
    if (index < 0) return false;
    this.table()?.scrollToIndex(index, behavior);
    this.focusNode(nodeId);
    return true;
  }

  reset(): void {
    if (this.query() === undefined) this.internalQuery.set(this.defaultQuery());
    if (this.sort() === undefined) this.table()?.resetState();
    this.resetScrollTop();
  }

  startRowEdit(nodeId: string): boolean {
    const row = this.allRowsById().get(nodeId);
    if (!row || this.effectiveEditMode() !== 'row') return false;
    this.table()?.startRowEdit(row);
    return true;
  }

  saveRowEdit(nodeId: string): boolean {
    const row = this.allRowsById().get(nodeId);
    return row ? (this.table()?.saveRowEdit(row) ?? false) : false;
  }

  cancelRowEdit(nodeId: string): boolean {
    const row = this.allRowsById().get(nodeId);
    if (!row) return false;
    this.table()?.cancelRowEdit(row);
    return true;
  }

  private flattenProjection(
    nodes: readonly NeuTreeTableProjectedNode<Record<string, unknown>>[],
  ): Record<string, unknown>[] {
    const filtering =
      this.effectiveQuery().search.trim().length > 0 ||
      Object.keys(this.effectiveQuery().filters).length > 0;
    return walkNeuTreeDepthFirst(nodes, (entry) => entry.children, {
      shouldDescend: (entry) => this.effectiveExpandedKeys().has(entry.node.node.id) || filtering,
    }).map((entry) => {
      const expanded = this.effectiveExpandedKeys().has(entry.node.node.id) || filtering;
      return { ...entry.node.row, __treeExpanded: expanded };
    });
  }

  private indexAllRows(nodes: readonly NeuTreeTableNode[]): Map<string, InternalNeuTreeTableRow> {
    const rows = new Map<string, InternalNeuTreeTableRow>();
    for (const entry of walkNeuTreeDepthFirst(nodes, (node) => node.children ?? [])) {
      const node = entry.node;
      rows.set(node.id, {
        ...(node.data ?? {}),
        id: node.id,
        label: node.label,
        description: node.description,
        badge: node.badge,
        __treeLevel: entry.level,
        __treeHasChildren: node.leaf === false || !!node.children?.length,
        __treeExpanded: this.effectiveExpandedKeys().has(node.id),
        __treeDisabled: !!node.disabled,
        __treeParentId: entry.parent?.id,
        __treePosInSet: entry.index + 1,
        __treeSetSize: entry.setSize,
        __treeNode: node,
      });
    }
    return rows;
  }

  private selectionProposal(rows: readonly Record<string, unknown>[]): readonly NeuTreeTableNode[] {
    const incoming = new Set(rows.map((row) => this.asFlatRow(row).__treeNode.id));
    if (this.effectiveSelectionMode() === 'checkbox') {
      const previous = this.selectedKeys();
      for (const key of new Set([...previous, ...incoming])) {
        if (incoming.has(key) === previous.has(key)) continue;
        this.applyDescendantSelection(key, incoming.has(key), incoming);
      }
      return this.nodesForKeys(this.checkboxState(incoming).selected);
    }
    if (this.effectiveSelectionMode() === 'single') {
      const first = rows.at(-1);
      return first ? [this.asFlatRow(first).__treeNode] : [];
    }
    return this.nodesForKeys(incoming);
  }

  private emitSelectionDetail(
    phase: 'select' | 'unselect',
    event: NeuTableRowSelectionEvent<Record<string, unknown>>,
  ): void {
    const row = this.asFlatRow(event.row);
    const selection = this.selectionProposal(event.selection);
    const detail: NeuTreeTableSelectionEvent = {
      node: row.__treeNode,
      row,
      source: event.source,
      selection,
    };
    (phase === 'select' ? this.nodeSelect : this.nodeUnselect).emit(detail);
  }

  private toggleSelectionForNode(node: NeuTreeTableNode): void {
    const keys = new Set(this.selectedKeys());
    if (keys.has(node.id)) keys.delete(node.id);
    else {
      if (this.effectiveSelectionMode() === 'single') keys.clear();
      keys.add(node.id);
    }
    const rows = this.nodesForKeys(keys).flatMap((candidate) => {
      const row = this.allRowsById().get(candidate.id);
      return row ? [row] : [];
    });
    this.onTableSelectionChange(rows);
  }

  private applyDescendantSelection(key: string, selected: boolean, keys: Set<string>): void {
    const row = this.allRowsById().get(key);
    if (!row) return;
    for (const entry of walkNeuTreeDepthFirst([row.__treeNode], (node) => node.children ?? [])) {
      const node = entry.node;
      if (!node.disabled && node.selectable !== false) {
        selected ? keys.add(node.id) : keys.delete(node.id);
      }
    }
  }

  private checkboxState(source: ReadonlySet<string>): {
    selected: ReadonlySet<string>;
    partial: ReadonlySet<string>;
  } {
    const selected = new Set(source);
    const partial = new Set<string>();
    type State = 'full' | 'empty' | 'partial' | 'ignored';
    const entries = walkNeuTreeDepthFirst(this.nodes(), (node) => node.children ?? [], {
      shouldDescend: (entry) => !entry.node.disabled && entry.node.selectable !== false,
    });
    const states = new Map<number, State>();
    for (let entryIndex = entries.length - 1; entryIndex >= 0; entryIndex -= 1) {
      const entry = entries[entryIndex];
      const node = entry.node;
      if (node.disabled || node.selectable === false) {
        states.set(entryIndex, 'ignored');
        continue;
      }
      const children = entry.childEntryIndices
        .map((index) => states.get(index) ?? 'ignored')
        .filter((state) => state !== 'ignored');
      if (!children.length) {
        states.set(entryIndex, selected.has(node.id) ? 'full' : 'empty');
        continue;
      }
      const all = children.every((state) => state === 'full');
      const none = children.every((state) => state === 'empty');
      if (all) {
        selected.add(node.id);
        states.set(entryIndex, 'full');
        continue;
      }
      selected.delete(node.id);
      if (none) {
        states.set(entryIndex, 'empty');
        continue;
      }
      partial.add(node.id);
      states.set(entryIndex, 'partial');
    }
    return { selected, partial };
  }

  private nodesForKeys(keys: ReadonlySet<string>): readonly NeuTreeTableNode[] {
    const rows = this.allRowsById();
    return [...rows.entries()].flatMap(([key, row]) => (keys.has(key) ? [row.__treeNode] : []));
  }

  private mapRowEditEvent(
    event: NeuTableRowEditEvent<Record<string, unknown>>,
  ): NeuTreeTableRowEditEvent {
    const row = this.asFlatRow(event.row);
    return {
      node: row.__treeNode,
      row,
      draft: this.consumerDraft(event.draft),
      editingNodeKeys: event.editingRowKeys.map(this.asNodeKey),
    };
  }

  private consumerDraft(
    value: Readonly<Record<string, unknown>>,
  ): Readonly<Record<string, unknown>> {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).filter(
          ([key]) =>
            !key.startsWith('__tree') &&
            key !== 'id' &&
            key !== 'label' &&
            key !== 'description' &&
            key !== 'badge',
        ),
      ),
    );
  }

  private syncTreegridDom(): void {
    const table = this.host.nativeElement.querySelector<HTMLTableElement>('table.neu-table');
    table?.setAttribute('role', 'treegrid');
    const rows = this.host.nativeElement.querySelectorAll<HTMLTableRowElement>(
      'tr.neu-table__row[data-neu-table-logical-index]:not([aria-hidden="true"])',
    );
    rows.forEach((element) => {
      const index = Number(element.dataset['neuTableLogicalIndex']);
      const row = this.flatRows()[index] ? this.asFlatRow(this.flatRows()[index]) : null;
      if (!row) return;
      const key = row.__treeNode.id;
      element.dataset['neuTreeNodeId'] = key;
      element.setAttribute('role', 'row');
      if (![...rows].some((candidate) => candidate.tabIndex === 0)) {
        element.tabIndex = row.__treeDisabled ? -1 : 0;
      } else if (element.tabIndex !== 0) {
        element.tabIndex = -1;
      }
      element.setAttribute('aria-level', String(row.__treeLevel + 1));
      element.setAttribute('aria-posinset', String(row.__treePosInSet));
      element.setAttribute('aria-setsize', String(row.__treeSetSize));
      if (row.__treeHasChildren) element.setAttribute('aria-expanded', String(row.__treeExpanded));
      else element.removeAttribute('aria-expanded');
      if (this.effectiveSelectionMode() !== 'none') {
        element.setAttribute('aria-selected', String(this.selectedKeys().has(key)));
      }
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]');
      if (checkbox) {
        const partial = this.partialKeys().has(key);
        checkbox.indeterminate = partial;
        checkbox.setAttribute(
          'aria-checked',
          partial ? 'mixed' : String(this.selectedKeys().has(key)),
        );
      }
    });
  }

  private focusNode(nodeId: string): void {
    const rows = [
      ...this.host.nativeElement.querySelectorAll<HTMLTableRowElement>('[data-neu-tree-node-id]'),
    ];
    const row = rows.find((candidate) => candidate.dataset['neuTreeNodeId'] === nodeId);
    rows.forEach((candidate) => (candidate.tabIndex = candidate === row ? 0 : -1));
    row?.focus();
  }

  private focusParent(nodeId: string): void {
    const parentId = this.allRowsById().get(nodeId)?.__treeParentId;
    if (parentId) this.focusNode(parentId);
  }

  private focusFirstChild(nodeId: string): void {
    const node = this.allRowsById().get(nodeId)?.__treeNode;
    const first = node?.children?.find((child) => !child.disabled);
    if (first) queueMicrotask(() => this.focusNode(first.id));
  }

  private focusRelative(nodeId: string, direction: -1 | 1): void {
    const ids = this.flatRows().map((row) => this.asFlatRow(row).__treeNode.id);
    const index = ids.indexOf(nodeId);
    const target = ids[index + direction];
    if (target) this.focusNode(target);
  }

  private queryWithoutLocalFilters(): NeuTableQueryState {
    const query = this.effectiveQuery();
    return { ...query, search: '', filters: Object.freeze({}) };
  }

  private defaultQuery(): NeuTableQueryState {
    return {
      page: 1,
      pageSize: this.pageSize(),
      search: '',
      sort: null,
      sortEntries: Object.freeze([]),
      globalFilterFields: Object.freeze([]),
      filters: Object.freeze({}),
      serialization: {
        status: 'serializable',
        localOnlyFilters: Object.freeze([]),
        requiresConsumerSerializationFilters: Object.freeze([]),
        localOnlyGlobalFilterFields: false,
      },
    };
  }

  private sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
    return a.size === b.size && [...a].every((value) => b.has(value));
  }

  private collectExpandedKeys(nodes: NeuTreeTableNode[]): Set<string> {
    return new Set(
      walkNeuTreeDepthFirst(nodes, (node) => node.children ?? [])
        .filter((entry) => entry.node.expanded)
        .map((entry) => entry.node.id),
    );
  }

  private asFlatRow(row: Record<string, unknown>): InternalNeuTreeTableRow {
    return row as InternalNeuTreeTableRow;
  }
}
