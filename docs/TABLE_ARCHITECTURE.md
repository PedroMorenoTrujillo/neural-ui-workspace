# Table architecture

## Status and scope

This document is the H3 source of truth for Neural Table. It classifies the public compatibility surface shipped at the H2 baseline, records state ownership, and defines the additive architecture used by H3.

Baseline revisions:

- Workspace: `a8ba70885c371d2a12ffef4711426a647ffdac9e`
- Showcase: `37882e57770fa648134846d8f30e8e1af8e0e9ca`
- Root: `055e7bfd8b074c2ee00726e22b88b57376498236`

The existing `NeuTableComponent` and `<neu-table>` selector are the batteries-included compatibility facade. H3 does not remove, rename, or narrow any existing input, output, method, type, or template selector. `NeuTableCoreComponent` is an additive canonical renderer for consumers that need only semantic rows, columns, headers, cells, loading/empty states, typed templates, row identity, and contained layout.

## Architectural boundaries

| Boundary | Owns | Must not own |
| --- | --- | --- |
| Core renderer | immutable rows/columns, header/body/cell projection, native table semantics, row identity/tracking, loading/empty states, minimal contained layout | Forms, Router, CDK, filtering, selection, editing, export, persistence, URL state, virtualization |
| Query UI | search, sorting, pagination, basic/advanced filters, query proposals | canonical consumer-owned query state |
| Interaction and authoring | selection, expansion, grouping, editing, layout, resize/reorder, context interaction | URL/storage/export and server transport |
| Large data and adapters | virtual/lazy ranges, retention, viewport coordination, persistence, URL serialization, export | core rendering semantics |
| Compatibility facade | legacy input normalization, feature configuration, transition routing, established event order and imperative API | a second canonical state copy |

These are semantic boundaries, not a request for one package per feature. The only new public compilation boundary in H3 is the lightweight core entrypoint because it has direct consumer value and measurable isolation. The batteries-included facade remains the ergonomic default for established consumers.

## Compatibility API inventory

The exact H2/H3 compatibility surface is **155 inputs, 38 outputs, 96 TypeScript-exposed methods, and 16 template selectors**. The counts below are frozen for H3.

### Inputs

Classification totals:

| Classification | Count |
| --- | ---: |
| CANONICAL | 17 |
| OPTIONAL-FEATURE | 135 |
| ALIAS | 2 |
| COMPATIBILITY | 1 |
| **Total** | **155** |

Domain ledger:

- **CORE / CANONICAL (8):** `columns`, `data`, `loading`, `title`, `emptyMessage`, `tableAriaLabel`, `rowKey`, `rowIdentity`.
- **STYLE / CANONICAL (9):** `skeletonRows`, `bordered`, `roundedBorders`, `stripedRows`, `density`, `showRowNumbers`, `rowClass`, `footerRow`, `emptyStateTemplate`.
- **SELECTION / ALIAS (1):** `selectable` normalizes to `selectionMode="multiple"` when no explicit mode is supplied.
- **CORE TEMPLATE / ALIAS (1):** `toolbarExtraRef` normalizes to the projected `neuTableToolbar` contract.
- **CORE / COMPATIBILITY (1):** `rowTrackBy` remains a render-tracking hook distinct from semantic `rowIdentity`.
- **DATA / OPTIONAL-FEATURE (1):** `frozenData`.
- **FILTER / OPTIONAL-FEATURE (20):** `searchable`, `filterDelay`, `filterOn`, `advancedFilterMode`, `advancedFilterTexts`, `searchPlaceholder`, `exactMatchable`, `exactMatchLabel`, `searchAriaLabel`, `clearSearchAriaLabel`, `clearFilterLabel`, `filterPlaceholder`, `filterLocale`, `filterAriaPrefix`, `filterFromLabel`, `filterToLabel`, `filterTrueLabel`, `filterFalseLabel`, `allFilterOptionLabel`, `globalFilterFields`.
- **PAGE / OPTIONAL-FEATURE (24):** `pageSize`, `pagination`, `previousPageAriaLabel`, `nextPageAriaLabel`, `firstPageAriaLabel`, `lastPageAriaLabel`, `pageAriaLabel`, `jumpToPageAriaLabel`, `pageSizeLabel`, `pageSizeAriaLabel`, `paginationAriaLabel`, `ofLabel`, `resultLabelSingular`, `resultLabelPlural`, `pageSizeOptions`, `paginatorPosition`, `pageLinkSize`, `showPageLinks`, `showFirstLastPageButtons`, `showCurrentPageReport`, `currentPageReportTemplate`, `showJumpToPageInput`, `showJumpToPageDropdown`, `alwaysShowPaginator`.
- **SORT / OPTIONAL-FEATURE (6):** `sortable`, `defaultSortOrder`, `resetPageOnSort`, `removableSort`, `sort`, `multiSort`.
- **SELECTION / OPTIONAL-FEATURE (13):** `selectionMode`, `compareSelectionBy`, `selection`, `rowSelectable`, `selectAllScope`, `selectOnRowClick`, `metaKeySelection`, `clearSelectionLabel`, `selectionSummaryLabel`, `selectAllAriaLabel`, `selectRowAriaLabel`, `unselectRowAriaLabel`, `selectionActions`.
- **OTHER—EXPANSION / OPTIONAL-FEATURE (5):** `expandable`, `expandMode`, `expandedRowKeys`, `expandRowAriaLabel`, `collapseRowAriaLabel`.
- **EXPORT / OPTIONAL-FEATURE (11):** `exportable`, `exportFileName`, `exportCsvTitle`, `exportJsonTitle`, `exportXlsxTitle`, `exportFormats`, `exportColumns`, `exportScope`, `csvSeparator`, `csvFormulaPolicy`, `exportValue`.
- **VIRTUAL / OPTIONAL-FEATURE (16):** `stickyHeader`, `scrollHeight`, `virtualScroll`, `virtualScrollVisibleItems`, `virtualScrollItemSize`, `virtualScrollOverscan`, `virtualScrollDelay`, `virtualScrollAppendOnly`, `virtualScrollAutoSize`, `virtualScrollResizeDelay`, `virtualScrollStep`, `serverSide`, `query`, `lazyLoadOnInit`, `totalItems`, `dataFirst`.
- **CORE TEMPLATE / OPTIONAL-FEATURE (1):** `lazyPlaceholderTemplate`.
- **LAYOUT / OPTIONAL-FEATURE (6):** `resizableColumns`, `columnResizeMode`, `reorderableColumns`, `columnChooser`, `columnChooserLabel`, `initialLayout`.
- **REORDER / OPTIONAL-FEATURE (4):** `reorderableRows`, `rowReorderable`, `moveRowUpAriaLabel`, `moveRowDownAriaLabel`.
- **CONTEXT / OPTIONAL-FEATURE (3):** `contextMenu`, `contextMenuRowDisabled`, `contextMenuSelection`.
- **OTHER—GROUPING / OPTIONAL-FEATURE (8):** `groupBy`, `groupHeaderLabel`, `rowGroupMode`, `groupRowsByOrder`, `expandableRowGroups`, `expandedGroupKeys`, `expandGroupAriaLabel`, `collapseGroupAriaLabel`.
- **EDIT / OPTIONAL-FEATURE (9):** `inlineEdit`, `editMode`, `editingRowKeys`, `editingCell`, `cellEditValidator`, `rowEditValidator`, `inlineEditLabel`, `saveInlineEditLabel`, `cancelInlineEditLabel`.
- **URL / OPTIONAL-FEATURE (6):** `pageParam`, `searchParam`, `sortParam`, `sortDirParam`, `multiSortParam`, `useUrlState`.
- **PERSISTENCE / OPTIONAL-FEATURE (2):** `stateKey`, `stateStorage`.

### Outputs

Classification totals:

| Classification | Count |
| --- | ---: |
| CANONICAL | 3 |
| OPTIONAL-FEATURE | 34 |
| COMPATIBILITY | 1 |
| **Total** | **38** |

Domain ledger:

- **CORE / CANONICAL (3):** `rowClick`, `rowDblClick`, `actionClick`.
- **OTHER—SERVER / COMPATIBILITY (1):** `serverStateChange`; `queryChange` is the canonical aggregate.
- **SELECTION / OPTIONAL-FEATURE (5):** `selectionChange`, `rowSelect`, `rowUnselect`, `selectAllChange`, `selectionActionClick`.
- **OTHER—EXPANSION / OPTIONAL-FEATURE (3):** `expandedRowKeysChange`, `rowExpand`, `rowCollapse`.
- **DATA / OPTIONAL-FEATURE (5):** `queryChange`, `lazyRequest`, `searchChange`, `sortChange`, `pageChange`.
- **LAYOUT / OPTIONAL-FEATURE (3):** `columnResize`, `columnReorder`, `layoutChange`.
- **REORDER / OPTIONAL-FEATURE (1):** `rowReorder`.
- **CONTEXT / OPTIONAL-FEATURE (2):** `contextMenuSelectionChange`, `contextMenuSelect`.
- **VIRTUAL / OPTIONAL-FEATURE (1):** `virtualScrollEvent`.
- **EDIT / OPTIONAL-FEATURE (9):** `cellEditCommit`, `cellEditInit`, `cellEditCancel`, `editValidationError`, `editingRowKeysChange`, `editingCellChange`, `rowEditInit`, `rowEditSave`, `rowEditCancel`.
- **OTHER—GROUPING / OPTIONAL-FEATURE (3):** `expandedGroupKeysChange`, `groupExpand`, `groupCollapse`.
- **PERSISTENCE / OPTIONAL-FEATURE (2):** `stateSave`, `stateRestore`.

Aggregate and lifecycle outputs are distinct contracts. `selectionChange` remains the canonical complete selection proposal. Compatibility outputs mirror canonical transitions; they never write state independently.

### Exposed methods

Method support classification totals:

| Support classification | Architecture classification | Count |
| --- | --- | ---: |
| SUPPORTED-CONSUMER (documented) | OPTIONAL-FEATURE | 8 |
| ESTABLISHED-CONSUMER CANDIDATE (undocumented but callable) | OPTIONAL-FEATURE | 38 |
| TEMPLATE/ORCHESTRATION LEAK | INTERNAL-IMPLEMENTATION + MAJOR-VERSION-ONLY CLEANUP | 50 |
| **Total** |  | **96** |

The 8 documented supported methods are `scrollToIndex`, `scrollToOffset`, `resetVirtualScroll`, `currentState`, `saveState`, `restoreState`, `clearState`, and `resetState`.

The 38 established-consumer candidates are `toggleColumnChooser`, `isColumnVisible`, `toggleColumnVisibility`, `canMoveColumn`, `moveColumn`, `applyLayout`, `currentLayout`, `resetColumnWidth`, `canMoveRow`, `moveRow`, `isRowExpanded`, `expandRow`, `collapseRow`, `toggleExpand`, `isRowSelected`, `isRowSelectable`, `toggleRow`, `selectRow`, `unselectRow`, `toggleAll`, `clearSelection`, `goToPage`, `sortBy`, `clearSearch`, `setExactMatch`, `setColumnFilter`, `clearColumnFilters`, `exportCsv`, `exportJson`, `exportXlsx`, `startCellEdit`, `commitCellEdit`, `cancelCellEdit`, `isEditingRow`, `startRowEdit`, `saveRowEdit`, `cancelRowEdit`, and `toggleGroup`.

The 50 internal implementation leaks are `_filterOpts`, `isLastFrozenLeftColumn`, `isFirstFrozenRightColumn`, `isFirstVisibleColumn`, `isLastVisibleColumn`, `isColumnDraggable`, `isColumnResizable`, `columnWidth`, `startColumnResize`, `canReorderRow`, `onRowClick`, `onSearch`, `onPageSizeChange`, `pageButtonAriaLabel`, `isConfirmPending`, `handleAction`, `cancelConfirm`, `isSelectionConfirmPending`, `handleSelectionAction`, `cancelSelectionConfirm`, `onTableScroll`, `getRowKey`, `visibleRowNumber`, `getRowClass`, `getCellValue`, `isEditingCell`, `editingValue`, `cellEditingInvalid`, `cellEditingError`, `inlineEditorType`, `inlineEditorOptions`, `setEditingValue`, `onEditableCellKeydown`, `setRowEditingValue`, `structuralContext`, `paginatorTemplateContext`, `bodyContext`, `rowEditContext`, `cellViewTemplate`, `cellEditorTemplate`, `cellViewContext`, `cellEditorContext`, `groupTemplateContext`, `groupExpansionAriaLabel`, `isRowspanGroupCell`, `groupRowspan`, `hideGroupRowspanCell`, `getSortPriority`, `columnFilterControl`, and `getColumnFilterValue`.

H3 does not change visibility for any of these methods. Angular-template methods remain template-visible, and all TypeScript-callable members remain source compatible. A later major may restrict only the 50 implementation leaks after `@internal` release metadata and consumer migration evidence exist.

### Template selectors

Classification totals:

| Classification | Count |
| --- | ---: |
| CANONICAL | 8 |
| OPTIONAL-FEATURE | 8 |
| **Total** | **16** |

- **CORE / CANONICAL (8):** `neuTableBody`, `neuTableCaption`, `neuTableHeaderGroup`, `neuTableFooterGroup`, `neuTableLoadingBody`, `neuTableSummary`, `neuTableCellView`, `neuTableToolbar`.
- **PAGE / OPTIONAL-FEATURE (2):** `neuTablePaginatorLeft`, `neuTablePaginatorRight`.
- **OTHER—GROUPING / OPTIONAL-FEATURE (2):** `neuTableGroupHeader`, `neuTableGroupFooter`.
- **EDIT / OPTIONAL-FEATURE (1):** `neuTableCellEditor`.
- **FILTER / OPTIONAL-FEATURE (1):** `neuTableFilterTemplate`.
- **OTHER—EXPANSION / OPTIONAL-FEATURE (1):** `neuTableExpand`.
- **REORDER / OPTIONAL-FEATURE (1):** `[neuTableRowReorderHandle]`.

## Compatibility normalization and deprecation ledger

Compatibility flows in one direction:

`legacy or alias input → compatibility adapter → canonical state/config → feature implementation → canonical output → compatibility mirror`

| Surface | Canonical replacement | Why retained | Earliest removal |
| --- | --- | --- | --- |
| `selectable` | `selectionMode="multiple"` | shipped boolean alias used by existing templates | future major |
| `toolbarExtraRef` | projected `neuTableToolbar` template | shipped direct `TemplateRef` input | future major |
| `serverStateChange` / `NeuTableServerState` | `queryChange` / `NeuTableQueryState` | established server integration payload | future major |
| column `filterable`, `filterType`, `filterOptions` | typed `filterConfig` | established simple-filter column syntax | future major |
| legacy query `columnFilters` / `typedColumnFilters` projections | canonical filter constraints | server payload compatibility | future major |
| unparameterized `NeuTableColumn` | `NeuTableColumn<T>` | source compatibility for pre-generic consumers | future major, only with migration evidence |
| 50 template/orchestration methods | no consumer replacement; implementation moves behind controllers | TypeScript visibility is already observable | future major after `@internal` release period |

Migration examples:

```html
<!-- compatibility -->
<neu-table [selectable]="true" />

<!-- canonical -->
<neu-table selectionMode="multiple" />
```

```html
<!-- compatibility -->
<neu-table [toolbarExtraRef]="actions" />

<!-- canonical -->
<neu-table>
  <ng-template neuTableToolbar>...</ng-template>
</neu-table>
```

`rowTrackBy` is not a deprecation candidate: render tracking and semantic row identity are related but distinct. Aggregate outputs are not deprecated merely because granular lifecycle outputs also exist.

## State ownership

| State family | Ownership | Canonical owner |
| --- | --- | --- |
| columns, data, frozen data | CONTROLLED | consumer; renderer uses immutable projections |
| page, page size, search, filter constraints | CONTROLLED with `query`, otherwise INTERNAL | table state controller |
| sort entries | CONTROLLED with `query`/`sort`, otherwise INTERNAL | table state controller |
| selection keys | CONTROLLED with `selection`, otherwise INTERNAL | table state controller; selected rows are DERIVED |
| row/group expansion keys | CONTROLLED when inputs are supplied, otherwise INTERNAL | table state controller |
| row/cell editing identity | CONTROLLED when inputs are supplied, otherwise INTERNAL | table state controller; drafts are EPHEMERAL in editing controller |
| column layout | initial controlled seed, then INTERNAL | table state controller |
| filter overlay drafts and controls | EPHEMERAL | filter UI/controller |
| virtual range, retention, request IDs, scroll position | EPHEMERAL/DERIVED | virtual/lazy controllers |
| keyboard focus and range anchors | EPHEMERAL | keyboard controller |
| context selection | CONTROLLED when supplied, otherwise EPHEMERAL | interaction boundary |
| persistence and URL | EXTERNAL SYNC | adapters; never canonical owners |

Controlled transitions emit fresh proposal containers and wait for consumer echo. Consumer rows, columns, filters, sort, selection, layout, and server state are never mutated; domain object identity is preserved.

## Dependency and entrypoint contract

`@neural-ui/core/table-core` is the lightweight entrypoint. Its production dependency graph is limited to `@angular/core`, `@angular/common`, and `tslib`. It has no root-barrel import, side-effect registration, private-path import, Forms, Router, CDK, RxJS subscription, icon, Inline Editor, or Neural control dependency.

`@neural-ui/core/table` remains batteries included and retains the full existing feature graph. This distinction must be stated in bundle reports: core cost is not the existing `<neu-table>` cost.

The core renderer and compatibility facade resolve styling through the same existing `--neu-table-*`, semantic, and foundation token contract. H3 adds no theme system and no `::ng-deep` selector.

## Virtual ARIA contract

When all native rows are rendered, Table relies on native row coordinates and omits redundant `aria-rowcount`/`aria-rowindex`. When virtual/lazy rendering makes the DOM incomplete, Table exposes one coherent logical coordinate space:

1. default header rows begin at 1;
2. filter header, when present, follows the primary header;
3. frozen rows follow all headers;
4. virtual body rows use their logical dataset position after frozen rows;
5. `aria-rowcount` includes headers, frozen rows, and the logical dataset;
6. hidden placeholders and spacers do not claim coordinates;
7. custom grouped-header templates suppress explicit coordinates because the facade cannot truthfully infer their row count.

No rendered `aria-rowindex` may exceed `aria-rowcount`.

## Bundle gates

All reports distinguish:

- empty application;
- lightweight `NeuTableCoreComponent`;
- existing batteries-included `NeuTableComponent` compatibility facade;
- TreeTable;
- dashboard fixture.

Each scenario records raw, gzip `-9`, and Brotli `q11` increments. The ≤140 KiB gzip target is evaluated honestly. A core-only win is never reported as a reduction in the compatibility facade.
