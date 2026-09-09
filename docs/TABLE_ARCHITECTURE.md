# Table architecture

## Status and scope

This document is the H5-B1 source of truth for the public `NeuTableComponent` facade. H5-B1 redesigns the consumer API without removing Table behavior: related scalar configuration is grouped, presentation templates become declarative, and implementation methods are no longer represented as supported consumer API.

Baseline revisions:

- Workspace: `09d157bb`
- Showcase: `7e7d39c`
- Root: `550edd4`

The batteries-included `<neu-table>` remains the default consumer component. `NeuTableCoreComponent` remains the additive lightweight renderer for consumers that only need semantic rows, columns, headers, cells, loading/empty states, typed templates, identity, and contained layout.

## Architectural boundaries

| Boundary                  | Owns                                                                                                                                               | Must not own                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Core renderer             | immutable rows/columns, header/body/cell projection, native table semantics, row identity/tracking, loading/empty states, minimal contained layout | Forms, Router, CDK, filtering, selection, editing, export, persistence, URL state, virtualization |
| Query UI                  | search, sorting, pagination, basic/advanced filters, query proposals                                                                               | canonical consumer-owned query state                                                              |
| Interaction and authoring | selection, expansion, grouping, editing, layout, resize/reorder, context interaction                                                               | URL/storage/export and server transport                                                           |
| Large data and adapters   | virtual/lazy ranges, retention, viewport coordination, persistence, URL serialization, export                                                      | core rendering semantics                                                                          |
| Public facade             | focused consumer configuration, transition routing, established event order and supported imperative API                                           | a second canonical state copy or template implementation helpers                                  |

These are semantic boundaries, not a request for one package per feature. The batteries-included facade remains the ergonomic default; the core entrypoint remains an independently measurable compilation boundary.

## Public API inventory

The H5-B1.1 facade is frozen at **77 inputs, 38 outputs, 96 TypeScript-visible methods, and 20 composition selectors**. Only **32 methods** are classified as supported consumer API; the other 64 remain callable for Angular template implementation but are explicitly `INTERNAL/UNSUPPORTED` in the declaration contract.

### Inputs

Six cohesive configuration objects replace scalar clusters:

| Input                   | Responsibility                                              |
| ----------------------- | ----------------------------------------------------------- |
| `labels`                | visible copy and accessibility labels                       |
| `filterOptions`         | filter debounce, commit mode, and locale                    |
| `paginatorOptions`      | advanced paginator presentation                             |
| `exportOptions`         | export enablement, format, scope, naming, and value policy  |
| `virtualizationOptions` | viewport size, overscan, delay, retention, and request step |
| `urlStateOptions`       | advanced URL parameter names                                |

The remaining 72 inputs are direct because they represent primary data/state, a distinct capability switch, or an established integration boundary:

- **Core/data (9):** `columns`, `data`, `frozenData`, `loading`, `title`, `emptyMessage`, `tableAriaLabel`, `rowKey`, `rowTrackBy`.
- **Query/filter/page/sort (16):** `pageSize`, `pagination`, `searchable`, `advancedFilterMode`, `advancedFilterTexts`, `exactMatchable`, `sortable`, `defaultSortOrder`, `resetPageOnSort`, `removableSort`, `sort`, `globalFilterFields`, `pageSizeOptions`, `paginatorPosition`, `multiSort`, `urlState` (opt-in, disabled by default).
- **Interaction (10):** `selectable`, `compareSelectionBy`, `selection`, `rowSelectable`, `selectAllScope`, `selectOnRowClick`, `metaKeySelection`, `expandMode`, `expandedRowKeys`, `selectionActions`.
- **Viewport/server (8):** `stickyHeader`, `scrollHeight`, `virtualScroll`, `serverSide`, `query`, `lazyLoadOnInit`, `totalItems`, `dataFirst`.
- **Layout/reorder/context (10):** `resizableColumns`, `columnResizeMode`, `reorderableColumns`, `reorderableRows`, `rowReorderable`, `contextMenu`, `contextMenuRowDisabled`, `contextMenuSelection`, `columnChooser`, `initialLayout`.
- **Grouping/editing (10):** `groupBy`, `rowGroupMode`, `groupRowsByOrder`, `expandableRowGroups`, `expandedGroupKeys`, `editMode`, `editingRowKeys`, `editingCell`, `cellEditValidator`, `rowEditValidator`.
- **Visual/persistence (9):** `bordered`, `roundedBorders`, `stripedRows`, `density`, `showRowNumbers`, `rowClass`, `footerRow`, `stateKey`, `stateStorage`.

`rowKey` now accepts either a field/path string or a function and is the sole semantic identity input. `selectable` accepts `false`, `true`, `'single'`, or `'multiple'`. `expandMode="none"` and `editMode="none"` own capability enablement, so separate `expandable` and `inlineEdit` switches are unnecessary. Skeleton row count and virtual resize coalescing are implementation details.

### Outputs

Classification totals:

| Classification   |  Count |
| ---------------- | -----: |
| CANONICAL        |      3 |
| OPTIONAL-FEATURE |     34 |
| COMPATIBILITY    |      1 |
| **Total**        | **38** |

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

The declaration contract uses a closed allowlist. These 32 methods are supported:

`applyLayout`, `cancelCellEdit`, `cancelRowEdit`, `clearColumnFilters`, `clearSearch`, `clearSelection`, `clearState`, `collapseRow`, `commitCellEdit`, `currentLayout`, `currentState`, `expandRow`, `exportCsv`, `exportJson`, `exportXlsx`, `goToPage`, `resetState`, `resetVirtualScroll`, `restoreState`, `saveRowEdit`, `saveState`, `scrollToIndex`, `scrollToOffset`, `selectRow`, `setColumnFilter`, `setExactMatch`, `sortBy`, `startCellEdit`, `startRowEdit`, `toggleAll`, `toggleExpand`, and `unselectRow`.

All other public TypeScript methods on `NeuTableComponent` are emitted as `INTERNAL/UNSUPPORTED`. They stay class-visible only because the Angular template currently calls them; visibility does not make them consumer contract. Contract tests fail if a new method is accidentally classified as supported.

### Template selectors

There are 20 selectors: 18 existing selectors plus the H5-B1.1 body-section template and managed-row directive.

- **CORE / CANONICAL (11):** `neuTableBody`, `neuTableBodySection`, `neuTableCaption`, `neuTableHeaderGroup`, `neuTableFooterGroup`, `neuTableLoadingBody`, `neuTableSummary`, `neuTableCellView`, `neuTableToolbar`, `neuTableEmpty`, `neuTableLazyPlaceholder`.
- **PAGE / OPTIONAL-FEATURE (2):** `neuTablePaginatorLeft`, `neuTablePaginatorRight`.
- **OTHER—GROUPING / OPTIONAL-FEATURE (2):** `neuTableGroupHeader`, `neuTableGroupFooter`.
- **EDIT / OPTIONAL-FEATURE (1):** `neuTableCellEditor`.
- **FILTER / OPTIONAL-FEATURE (1):** `neuTableFilterTemplate`.
- **OTHER—EXPANSION / OPTIONAL-FEATURE (1):** `neuTableExpand`.
- **ROW BEHAVIOR / OPTIONAL-FEATURE (2):** `tr[neuTableManagedRow]`, `[neuTableRowReorderHandle]`.

### Full body-section composition

`neuTableBody` remains the controlled path: Neural owns the primary `<tr>` and the consumer owns its cells. `neuTableBodySection` is the opt-in structural path and is inserted directly inside `<tbody>`. When both are projected, `neuTableBodySection` wins deterministically and the normal body, loading, empty, group, placeholder, and expansion renderers do not render a second copy.

The body-section context exposes a stable discriminated `entries` union. Only `kind: 'data'` contains `row: T`. Group, empty, loading, placeholder, and spacer entries never fabricate `T`. Use the optional `[neuTableBodySectionOf]="rows"` compile-time anchor when strict templates should infer the exact consumer row type.

Apply `[neuTableManagedRow]="entry"` to the consumer-owned primary `<tr>`. The component-scoped directive delegates selection, controlled-selection proposals, roving focus, keyboard selection/range behavior, ARIA coordinates, context menu, row click/double-click, drag/drop reorder, frozen positioning, and canonical row state to the owning Table. Consumer classes, attributes, directives, and ARIA coexist on that row. Additional sibling rows are deliberately unmanaged and remain the consumer's accessibility and interaction responsibility.

Body-section entries already reflect Neural's canonical filtered, sorted, grouped, paged, frozen, and sparse-visible pipeline; consumer rows never become a second data pipeline and never change record counts.

Unrestricted sibling rows are supported only when `siblingRowsSupported` is `true`. In fixed-size, lazy-sparse, and append-only virtual modes it is `false`: consumers may customize the single managed virtualization unit and must render placeholder/spacer entries, but must not add variable-height sibling rows because those rows are not virtualization records and would invalidate range math. The context exposes `virtualized` and this policy explicitly.

Compared with the reference implementation, the normal Neural body keeps stronger default ownership, while the advanced body section has equivalent complete-row/multiple-row freedom. The managed-row directive adds canonical behavior that consumers otherwise reconstruct with table directives and bindings.

## Normalization and deliberate deferrals

Normalization flows one way:

`focused public input → normalized internal config/state → feature implementation → canonical output`

Direct `TemplateRef` inputs for toolbar, empty state, and lazy placeholders were replaced by `neuTableToolbar`, `neuTableEmpty`, and `neuTableLazyPlaceholder`. `rowIdentity` was folded into the widened `rowKey`; selection, expansion, and edit enablement were folded into their historical mode owners.

`contextMenu` and `contextMenuRowDisabled` remain direct. The current context menu is an imperative directive/overlay relationship, and moving it to projection without a clear owner could alter controlled context-selection behavior. This is an explicit H5-B1 deferral, not accidental facade growth.

`serverStateChange` remains the compatibility projection of canonical `queryChange`. `rowTrackBy` remains distinct from semantic `rowKey`: one owns render tracking, the other owns state identity.

## State ownership

| State family                                           | Ownership                                               | Canonical owner                                                    |
| ------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------ |
| columns, data, frozen data                             | CONTROLLED                                              | consumer; renderer uses immutable projections                      |
| page, page size, search, filter constraints            | CONTROLLED with `query`, otherwise INTERNAL             | table state controller                                             |
| sort entries                                           | CONTROLLED with `query`/`sort`, otherwise INTERNAL      | table state controller                                             |
| selection keys                                         | CONTROLLED with `selection`, otherwise INTERNAL         | table state controller; selected rows are DERIVED                  |
| row/group expansion keys                               | CONTROLLED when inputs are supplied, otherwise INTERNAL | table state controller                                             |
| row/cell editing identity                              | CONTROLLED when inputs are supplied, otherwise INTERNAL | table state controller; drafts are EPHEMERAL in editing controller |
| column layout                                          | initial controlled seed, then INTERNAL                  | table state controller                                             |
| filter overlay drafts and controls                     | EPHEMERAL                                               | filter UI/controller                                               |
| virtual range, retention, request IDs, scroll position | EPHEMERAL/DERIVED                                       | virtual/lazy controllers                                           |
| keyboard focus and range anchors                       | EPHEMERAL                                               | keyboard controller                                                |
| context selection                                      | CONTROLLED when supplied, otherwise EPHEMERAL           | interaction boundary                                               |
| persistence and URL                                    | EXTERNAL SYNC                                           | adapters; never canonical owners                                   |

Controlled transitions emit fresh proposal containers and wait for consumer echo. Consumer rows, columns, filters, sort, selection, layout, and server state are never mutated; domain object identity is preserved.

## Dependency and entrypoint contract

`@neural-ui/core/table-core` is the lightweight entrypoint. Its production dependency graph is limited to `@angular/core`, `@angular/common`, and `tslib`. It has no root-barrel import, side-effect registration, private-path import, Forms, Router, CDK, RxJS subscription, icon, Inline Editor, or Neural control dependency.

`@neural-ui/core/table` remains batteries included and retains the full existing feature graph. This distinction must be stated in bundle reports: core cost is not the existing `<neu-table>` cost.

The core renderer and public facade resolve styling through the same existing `--neu-table-*`, semantic, and foundation token contract. H5-B1 adds no theme system and no `::ng-deep` selector.

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
- batteries-included `NeuTableComponent` public facade;
- TreeTable;
- dashboard fixture.

Each scenario records raw, gzip `-9`, and Brotli `q11` increments. The ≤140 KiB gzip target is evaluated honestly. A core-only win is never reported as a reduction in the batteries-included facade.
