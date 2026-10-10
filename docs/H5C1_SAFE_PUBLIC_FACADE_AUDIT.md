# H5-C1 safe public-facade cleanup report

## Verdict

**H5-C1 CLOSED.** This wave changes contract classification and consumer barrels only. Component behavior, bindings, selectors, event semantics, CVA semantics, controlled state, template contexts, CSS, and tokens are unchanged.

## Exact baseline and contract reconciliation

- Root: `f087df0542bd1e8fd167144708fbf5b2b4cd6826`.
- Workspace: `9bf0142bd36c706f693d0951c80064938eab258d`.
- Showcase: `ffc5a6438bc6d351678ec72c2818a9e85d121b10`.
- H5-B4 start: 106 entrypoints; 837 declarations; 1,149 inputs; 230 outputs; 2 models; 1,381 bindings; 5,910 symbols; 3,452 supported; 1,218 internal/unsupported; 1,236 review; 2 compatibility; 2 deprecated.
- Final: 106 entrypoints; 799 declarations; 1,142 inputs; 230 outputs; 2 models; 1,374 bindings; 5,772 symbols; 3,445 supported; 2,323 internal/unsupported; 0 review; 2 compatibility; 2 deprecated.
- Binding extraction shortfall: **0**. The seven removed inputs belonged only to the five implementation render/overlay declarations removed from the consumer facade; supported component bindings did not change.

| REVIEW reconciliation | Count |
|---|---:|
| Starting REVIEW | 1,236 |
| To SUPPORTED | 92 |
| To INTERNAL/UNSUPPORTED now | 1,116 |
| Removed from facade now | 3 |
| Deferred physical hiding, classified INTERNAL/UNSUPPORTED | 25 |
| Final REVIEW | 0 |

The 92 supported resolutions are 47 public-testing members, 40 direct-consumer service members, and five ImageViewer/Stepper imperative methods. H5-B4 replaced 20 earlier SpeedDial/OrganizationChart review members, added three mechanically internal members, and already allowlisted the five final SpeedDial/OrganizationChart methods.

| Starting INTERNAL/UNSUPPORTED reconciliation | Count |
|---|---:|
| Starting INTERNAL/UNSUPPORTED | 1,218 |
| Physically hidden now | 127 |
| Classification-only / Angular-visible retained | 684 |
| Required package-dependency published | 77 |
| Deferred safe physical internalization | 330 |
| Total | 1,218 |

Separately, 1,141 REVIEW symbols and 91 formerly default-SUPPORTED package-internal symbols now classify INTERNAL/UNSUPPORTED. Final internal total: 2,323.

## H5-B4 SpeedDial and OrganizationChart revalidation

| Component | Direct inputs | Outputs | Models | Supported methods | Composition selectors | Result |
|---|---:|---:|---:|---:|---:|---|
| SpeedDial | 15 | 5 | 0 | 3 | 2 | Frozen; non-binding declaration-visible members are internal/unsupported |
| OrganizationChart | 11 | 4 | 2 | 2 | 4 | Frozen; non-binding declaration-visible members are internal/unsupported |

The H5-C policy was re-applied to the final H5-B4 declarations, including the new template context guards and template references. No source or functional API change was made to either component.

## Consumer-facade removals

Exactly 38 declarations / 138 symbols were removed from the consumer contract. Baseline status split: 127 internal/unsupported, 3 review, and 8 default-supported implementation symbols. All candidates retained zero Showcase, docs-consumer, schematic, testing-contract, and sibling-package import evidence; H5-B4 changed only the SpeedDial/OrganizationChart surfaces and did not introduce dependency edges to these candidates.

### Five implementation components

| Symbol | Action | Before | After | Symbols | Dependency evidence |
|---|---|---|---|---:|---|
| `NeuContextMenuOverlayComponent` | REMOVE FROM FACADE | Exported | Not consumer-exported | 13 | Showcase/docs/schematic/sibling/d.ts imports all 0; retained locally for Angular/runtime linkage |
| `NeuImageViewerOverlayComponent` | REMOVE FROM FACADE | Exported | Not consumer-exported | 17 | Showcase/docs/schematic/sibling/d.ts imports all 0; retained locally for Angular/runtime linkage |
| `NeuPopoverOverlayComponent` | REMOVE FROM FACADE | Exported | Not consumer-exported | 6 | Showcase/docs/schematic/sibling/d.ts imports all 0; retained locally for Angular/runtime linkage |
| `NeuTooltipOverlayComponent` | REMOVE FROM FACADE | Exported | Not consumer-exported | 5 | Showcase/docs/schematic/sibling/d.ts imports all 0; retained locally for Angular/runtime linkage |
| `NeuVirtualListRowComponent` | REMOVE FROM FACADE | Exported | Not consumer-exported | 9 | Showcase/docs/schematic/sibling/d.ts imports all 0; retained locally for Angular/runtime linkage |

### Four internal DI tokens

| Symbol | Action | Before | After | Evidence |
|---|---|---|---|---|
| `NEU_COMPARE_INSTANCE` | REMOVE FROM FACADE | Exported internal | Local implementation token | Compound/data coordination only; all external dependency counts 0 |
| `NEU_IV_DATA` | REMOVE FROM FACADE | Exported internal | Local implementation token | Compound/data coordination only; all external dependency counts 0 |
| `NEU_RADIO_GROUP` | REMOVE FROM FACADE | Exported internal | Local implementation token | Compound/data coordination only; all external dependency counts 0 |
| `NEU_TABS_CONTEXT` | REMOVE FROM FACADE | Exported internal | Local implementation token | Compound/data coordination only; all external dependency counts 0 |

Application configuration tokens `NEURAL_LOCALE`, `NEURAL_NOW`, and `NEURAL_TIME_ZONE` remain supported.

### Six rich-text implementation helpers

| Symbol | Action | Evidence |
|---|---|---|
| `escapeRichTextAttribute` | REMOVE FROM FACADE | Sanitization/escaping implementation only; all external dependency counts 0; behavior unchanged |
| `escapeRichTextHtml` | REMOVE FROM FACADE | Sanitization/escaping implementation only; all external dependency counts 0; behavior unchanged |
| `NEU_RICH_TEXT_ALLOWED_TAGS` | REMOVE FROM FACADE | Sanitization/escaping implementation only; all external dependency counts 0; behavior unchanged |
| `normalizeRichTextHtml` | REMOVE FROM FACADE | Sanitization/escaping implementation only; all external dependency counts 0; behavior unchanged |
| `plainTextToRichTextHtml` | REMOVE FROM FACADE | Sanitization/escaping implementation only; all external dependency counts 0; behavior unchanged |
| `sanitizeRichTextHtml` | REMOVE FROM FACADE | Sanitization/escaping implementation only; all external dependency counts 0; behavior unchanged |

### Three foundation services

| Symbol | Action | Symbols | Sibling imports | Compiled public d.ts references |
|---|---|---:|---:|---:|
| `NeuIdGenerator` | KEEP PUBLISHED INTERNAL | 4 | 37 | 0 |
| `NeuInitialTemporalState` | KEEP PUBLISHED INTERNAL | 7 | 5 | 0 |
| `NeuResponsiveState` | KEEP PUBLISHED INTERNAL | 4 | 3 | 0 |

Physical hiding is deferred to a later foundation/private-entrypoint wave; all 15 symbols classify INTERNAL/UNSUPPORTED now.

### Forty-five Option `ɵ` bridges

| Symbol | Action | Symbols | Sibling imports | Compiled d.ts refs |
|---|---|---:|---:|---:|
| `ɵconstrainNeuConnectedOverlayGeometry` | KEEP PUBLISHED INTERNAL | 1 | 2 | 0 |
| `ɵcreateNeuOptionLazyRequest` | KEEP PUBLISHED INTERNAL | 1 | 4 | 0 |
| `ɵcreateNeuOptionLoadingRows` | KEEP PUBLISHED INTERNAL | 1 | 4 | 0 |
| `ɵderiveNeuOptionActiveDescendant` | KEEP PUBLISHED INTERNAL | 1 | 4 | 0 |
| `ɵderiveNeuOptionAnnouncementData` | KEEP PUBLISHED INTERNAL | 1 | 3 | 0 |
| `ɵderiveNeuOptionAriaPosition` | KEEP PUBLISHED INTERNAL | 1 | 3 | 0 |
| `ɵderiveNeuOptionResultCount` | REMOVE FROM FACADE | 1 | 0 | 0 |
| `ɵderiveNeuOptionRowId` | KEEP PUBLISHED INTERNAL | 1 | 4 | 0 |
| `ɵfilterNeuOptionRows` | KEEP PUBLISHED INTERNAL | 1 | 4 | 0 |
| `ɵfindNeuOptionBoundaryRow` | REMOVE FROM FACADE | 1 | 0 | 0 |
| `ɵfindNeuOptionTypeaheadRow` | REMOVE FROM FACADE | 1 | 0 | 0 |
| `ɵINTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS` | KEEP PUBLISHED INTERNAL | 1 | 3 | 0 |
| `ɵInternalNeuConnectedOverlayCloseIntent` | KEEP PUBLISHED INTERNAL | 4 | 3 | 0 |
| `ɵInternalNeuConnectedOverlayCloseReason` | KEEP PUBLISHED INTERNAL | 1 | 3 | 0 |
| `ɵInternalNeuConnectedOverlayFrameScheduler` | REMOVE FROM FACADE | 3 | 0 | 0 |
| `ɵInternalNeuConnectedOverlayGeometry` | REMOVE FROM FACADE | 9 | 0 | 0 |
| `ɵInternalNeuConnectedOverlayGeometryOptions` | REMOVE FROM FACADE | 4 | 0 | 0 |
| `ɵInternalNeuConnectedOverlayKeyIntent` | REMOVE FROM FACADE | 4 | 0 | 0 |
| `ɵInternalNeuConnectedOverlayPosition` | REMOVE FROM FACADE | 5 | 0 | 0 |
| `ɵInternalNeuConnectedOverlayRefreshReason` | REMOVE FROM FACADE | 1 | 0 | 0 |
| `ɵInternalNeuConnectedOverlaySession` | KEEP PUBLISHED INTERNAL | 15 | 3 | 0 |
| `ɵInternalNeuConnectedOverlaySessionConfig` | REMOVE FROM FACADE | 4 | 0 | 0 |
| `ɵInternalNeuOptionA11yOptions` | REMOVE FROM FACADE | 3 | 0 | 0 |
| `ɵInternalNeuOptionActiveRowConfig` | REMOVE FROM FACADE | 4 | 0 | 0 |
| `ɵInternalNeuOptionActiveRowController` | KEEP PUBLISHED INTERNAL | 16 | 4 | 0 |
| `ɵInternalNeuOptionActiveRowResult` | KEEP PUBLISHED INTERNAL | 6 | 2 | 0 |
| `ɵInternalNeuOptionAnnouncementData` | REMOVE FROM FACADE | 6 | 0 | 0 |
| `ɵInternalNeuOptionAriaPosition` | REMOVE FROM FACADE | 3 | 0 | 0 |
| `ɵInternalNeuOptionLazyRequestSequencer` | KEEP PUBLISHED INTERNAL | 2 | 4 | 0 |
| `ɵInternalNeuOptionNormalizedRow` | KEEP PUBLISHED INTERNAL | 1 | 4 | 4 |
| `ɵInternalNeuOptionRow` | KEEP PUBLISHED INTERNAL | 7 | 4 | 4 |
| `ɵInternalNeuOptionScrollRequest` | REMOVE FROM FACADE | 3 | 0 | 0 |
| `ɵInternalNeuOptionTypeaheadConfig` | REMOVE FROM FACADE | 5 | 0 | 0 |
| `ɵInternalNeuOptionTypeaheadController` | KEEP PUBLISHED INTERNAL | 8 | 3 | 0 |
| `ɵInternalNeuOptionTypeaheadResult` | REMOVE FROM FACADE | 5 | 0 | 0 |
| `ɵInternalNeuOptionTypeaheadScheduler` | REMOVE FROM FACADE | 3 | 0 | 0 |
| `ɵInternalNeuOverlayRect` | REMOVE FROM FACADE | 7 | 0 | 0 |
| `ɵInternalNeuOverlayViewport` | REMOVE FROM FACADE | 3 | 0 | 0 |
| `ɵmoveNeuOptionActiveRow` | REMOVE FROM FACADE | 1 | 0 | 0 |
| `ɵnormalizeNeuLegacyOptionGroups` | KEEP PUBLISHED INTERNAL | 1 | 4 | 0 |
| `ɵnormalizeNeuOptionGroups` | KEEP PUBLISHED INTERNAL | 1 | 4 | 0 |
| `ɵnormalizeNeuOptionLazyWindow` | KEEP PUBLISHED INTERNAL | 1 | 4 | 0 |
| `ɵnormalizeNeuOptionRows` | KEEP PUBLISHED INTERNAL | 1 | 2 | 0 |
| `ɵpageNeuOptionActiveRow` | REMOVE FROM FACADE | 1 | 0 | 0 |
| `ɵreconcileNeuOptionActiveRow` | REMOVE FROM FACADE | 1 | 0 | 0 |

Result: 23 unused bridges removed (78 symbols); 22 used bridges retained and classified INTERNAL/UNSUPPORTED. No bridge architecture or Option foundation restructuring was performed.

## Complete supported imperative allowlist


### NeuAutocompleteComponent (7)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `clear` | `clear(originalEvent?: Event \| null, reason?: 'button' \| 'force-selection' \| 'programmatic'): void;` | Clear consumer-owned value/selection | H5-B3 Option-family final allowlist and declaration contract |
| `close` | `close(originalEvent?: Event \| null, reason?: OverlayReason, restoreFocus?: boolean): void;` | Close the public overlay/surface | H5-B3 Option-family final allowlist and declaration contract |
| `focus` | `focus(): void;` | Move focus to the public control | H5-B3 Option-family final allowlist and declaration contract |
| `open` | `open(originalEvent?: Event \| null, reason?: OverlayReason): void;` | Open the public overlay/surface | H5-B3 Option-family final allowlist and declaration contract |
| `openAll` | `openAll(event?: Event \| null): void;` | Open Autocomplete with all options | H5-B3 Option-family final allowlist and declaration contract |
| `reset` | `reset(): void;` | Reset public component state | H5-B3 Option-family final allowlist and declaration contract |
| `selectOption` | `selectOption(option: T, originalEvent?: Event \| null): void;` | Select a consumer option | H5-B3 Option-family final allowlist and declaration contract |

### NeuContextMenuDirective (2)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `close` | `close(): void;` | Close the public overlay/surface | H5-C audit consumer evidence plus the pre-existing explicit allowlist |
| `openAt` | `openAt(x: number, y: number, origin?: HTMLElement \| null, onClose?: () => void): void;` | Open at consumer coordinates | H5-C audit consumer evidence plus the pre-existing explicit allowlist |

### NeuImageViewerDirective (2)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `close` | `close(): void;` | Close the public overlay/surface | Showcase image-viewer demo teaches open(); close() is its paired lifecycle operation |
| `open` | `open(): void;` | Open the public overlay/surface | Showcase image-viewer demo teaches open(); close() is its paired lifecycle operation |

### NeuListboxComponent (3)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `resetFilter` | `resetFilter(): void;` | Reset the public filter | H5-B3 Option-family final allowlist and declaration contract |
| `setFilter` | `setFilter(value: string, originalEvent?: Event \| null): void;` | Set the public filter text | H5-B3 Option-family final allowlist and declaration contract |
| `toggleAll` | `toggleAll(event: Event): void;` | Toggle all eligible options/rows | H5-B3 Option-family final allowlist and declaration contract |

### NeuMenuComponent (1)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `activate` | `activate(item: NeuMenuItem, originalEvent?: Event): void;` | Activate a consumer menu item | H5-C audit consumer evidence plus the pre-existing explicit allowlist |

### NeuMultiselectComponent (6)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `clear` | `clear(event?: Event): void;` | Clear consumer-owned value/selection | H5-B3 Option-family final allowlist and declaration contract |
| `close` | `close(event?: Event \| null, reason?: NeuMultiselectOverlayEvent['reason'], restoreFocus?: boolean): void;` | Close the public overlay/surface | H5-B3 Option-family final allowlist and declaration contract |
| `focusTrigger` | `focusTrigger(): void;` | Move focus to the public trigger | H5-B3 Option-family final allowlist and declaration contract |
| `open` | `open(event?: Event \| null, reason?: NeuMultiselectOverlayEvent['reason']): void;` | Open the public overlay/surface | H5-B3 Option-family final allowlist and declaration contract |
| `resetFilter` | `resetFilter(emit?: boolean, event?: Event \| null): void;` | Reset the public filter | H5-B3 Option-family final allowlist and declaration contract |
| `toggle` | `toggle(event?: Event \| null): void;` | Toggle the public overlay/surface | H5-B3 Option-family final allowlist and declaration contract |

### NeuOrganizationChartComponent (2)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `activateNode` | `activateNode(node: NeuOrganizationChartNode<T>, originalEvent?: Event \| null): void;` | Activate/select a node | H5B4_SPEEDDIAL_ORGANIZATIONCHART_FINAL_AUDIT |
| `toggleNode` | `toggleNode(node: NeuOrganizationChartNode<T>, originalEvent?: Event \| null): void;` | Toggle node expansion | H5B4_SPEEDDIAL_ORGANIZATIONCHART_FINAL_AUDIT |

### NeuPopoverDirective (3)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `close` | `close(): void;` | Close the public overlay/surface | H5-C audit consumer evidence plus the pre-existing explicit allowlist |
| `open` | `open(): void;` | Open the public overlay/surface | H5-C audit consumer evidence plus the pre-existing explicit allowlist |
| `toggle` | `toggle(): void;` | Toggle the public overlay/surface | H5-C audit consumer evidence plus the pre-existing explicit allowlist |

### NeuSelectComponent (7)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `clear` | `clear(event?: Event): void;` | Clear consumer-owned value/selection | H5-B3 Option-family final allowlist and declaration contract |
| `close` | `close(restoreFocus?: boolean, originalEvent?: Event \| null, reason?: NeuSelectOverlayEvent['reason']): void;` | Close the public overlay/surface | H5-B3 Option-family final allowlist and declaration contract |
| `focus` | `focus(): void;` | Move focus to the public control | H5-B3 Option-family final allowlist and declaration contract |
| `open` | `open(restoreFocus?: boolean, originalEvent?: Event \| null, reason?: NeuSelectOverlayEvent['reason']): void;` | Open the public overlay/surface | H5-B3 Option-family final allowlist and declaration contract |
| `resetFilter` | `resetFilter(emit?: boolean): void;` | Reset the public filter | H5-B3 Option-family final allowlist and declaration contract |
| `selectOption` | `selectOption(option: T): void;` | Select a consumer option | H5-B3 Option-family final allowlist and declaration contract |
| `toggle` | `toggle(): void;` | Toggle the public overlay/surface | H5-B3 Option-family final allowlist and declaration contract |

### NeuSpeedDialComponent (3)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `close` | `close(): void;` | Close the public overlay/surface | H5B4_SPEEDDIAL_ORGANIZATIONCHART_FINAL_AUDIT |
| `open` | `open(): void;` | Open the public overlay/surface | H5B4_SPEEDDIAL_ORGANIZATIONCHART_FINAL_AUDIT |
| `toggle` | `toggle(): void;` | Toggle the public overlay/surface | H5B4_SPEEDDIAL_ORGANIZATIONCHART_FINAL_AUDIT |

### NeuStepperComponent (3)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `goTo` | `goTo(i: number): void;` | Navigate to a requested step | Showcase stepper demo teaches next()/prev(); goTo() completes direct navigation |
| `next` | `next(): void;` | Navigate to the next step | Showcase stepper demo teaches next()/prev(); goTo() completes direct navigation |
| `prev` | `prev(): void;` | Navigate to the previous step | Showcase stepper demo teaches next()/prev(); goTo() completes direct navigation |

### NeuTableComponent (32)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `applyLayout` | `applyLayout(layout: NeuTableLayout): void;` | Apply a saved column/layout definition | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `cancelCellEdit` | `cancelCellEdit(event?: Event, row?: T, col?: NeuTableColumnInput<T>): void;` | Cancel the active cell edit | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `cancelRowEdit` | `cancelRowEdit(row: NeuTableRuntimeRow<T>): void;` | Cancel an active row edit | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `clearColumnFilters` | `clearColumnFilters(): void;` | Clear all column filters | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `clearSearch` | `clearSearch(): void;` | Clear the global search | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `clearSelection` | `clearSelection(): void;` | Clear consumer selection | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `clearState` | `clearState(): void;` | Delete persisted table state | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `collapseRow` | `collapseRow(row: T): void;` | Collapse a row | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `commitCellEdit` | `commitCellEdit(row: T, col: NeuTableColumnInput<T>): void;` | Commit a cell edit | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `currentLayout` | `currentLayout(): NeuTableLayout;` | Read the current table layout | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `currentState` | `currentState(): NeuTableStateSnapshot;` | Read a serializable state snapshot | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `expandRow` | `expandRow(row: T): void;` | Expand a row | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `exportCsv` | `exportCsv(options?: NeuTableExportOptions<T>): void;` | Export visible data as CSV | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `exportJson` | `exportJson(options?: NeuTableExportOptions<T>): void;` | Export visible data as JSON | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `exportXlsx` | `exportXlsx(options?: NeuTableExportOptions<T>): void;` | Export visible data as XLSX | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `goToPage` | `goToPage(page: number): void;` | Navigate to a page | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `resetState` | `resetState(): void;` | Reset table state | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `resetVirtualScroll` | `resetVirtualScroll(behavior?: ScrollBehavior): void;` | Return virtual scrolling to the start | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `restoreState` | `restoreState(): NeuTableStateSnapshot \| null;` | Restore persisted table state | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `saveRowEdit` | `saveRowEdit(row: NeuTableRuntimeRow<T>): boolean;` | Validate and save a row edit | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `saveState` | `saveState(): NeuTableStateSnapshot;` | Persist and return table state | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `scrollToIndex` | `scrollToIndex(index: number, behavior?: ScrollBehavior): void;` | Scroll to a data index | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `scrollToOffset` | `scrollToOffset(offset: number, behavior?: ScrollBehavior): void;` | Scroll to a pixel offset | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `selectRow` | `selectRow(row: T): void;` | Select a row | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `setColumnFilter` | `setColumnFilter(colKey: string, value: unknown): void;` | Set a column filter | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `setExactMatch` | `setExactMatch(value: boolean): void;` | Control exact filter matching | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `sortBy` | `sortBy(key: string, event?: MouseEvent): void;` | Apply consumer-requested sorting | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `startCellEdit` | `startCellEdit(row: T, col: NeuTableColumnInput<T>, event?: Event): void;` | Start editing a cell | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `startRowEdit` | `startRowEdit(row: NeuTableRuntimeRow<T>): void;` | Start editing a row | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `toggleAll` | `toggleAll(): void;` | Toggle all eligible options/rows | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `toggleExpand` | `toggleExpand(row: T): void;` | Toggle row expansion | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |
| `unselectRow` | `unselectRow(row: T): void;` | Unselect a row | TABLE_ARCHITECTURE H5-B1 final allowlist and contract policy |

### NeuTooltipDirective (2)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `hide` | `hide(): void;` | Hide the public tooltip | H5-C audit consumer evidence plus the pre-existing explicit allowlist |
| `show` | `show(): void;` | Show the public tooltip | H5-C audit consumer evidence plus the pre-existing explicit allowlist |

### NeuTreeComponent (2)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `activateNode` | `activateNode(node: NeuTreeNode): void;` | Activate/select a node | H5-C audit consumer evidence plus the pre-existing explicit allowlist |
| `toggleNode` | `toggleNode(node: NeuTreeNode, event?: Event): void;` | Toggle node expansion | H5-C audit consumer evidence plus the pre-existing explicit allowlist |

### NeuTreeTableComponent (9)

| Method | Signature | Consumer use case | Evidence |
|---|---|---|---|
| `cancelRowEdit` | `cancelRowEdit(nodeId: string): boolean;` | Cancel an active row edit | H5-B2/H5-B3 final allowlist and contract policy |
| `reset` | `reset(): void;` | Reset public component state | H5-B2/H5-B3 final allowlist and contract policy |
| `resetScrollTop` | `resetScrollTop(behavior?: ScrollBehavior): void;` | Return scrolling to the top | H5-B2/H5-B3 final allowlist and contract policy |
| `saveRowEdit` | `saveRowEdit(nodeId: string): boolean;` | Validate and save a row edit | H5-B2/H5-B3 final allowlist and contract policy |
| `scrollTo` | `scrollTo(options: NeuTreeTableScrollOptions): void;` | Apply a TreeTable scroll request | H5-B2/H5-B3 final allowlist and contract policy |
| `scrollToNode` | `scrollToNode(nodeId: string, behavior?: ScrollBehavior): boolean;` | Reveal a node by id | H5-B2/H5-B3 final allowlist and contract policy |
| `scrollToVirtualIndex` | `scrollToVirtualIndex(index: number, behavior?: ScrollBehavior): void;` | Reveal a virtual node index | H5-B2/H5-B3 final allowlist and contract policy |
| `startRowEdit` | `startRowEdit(nodeId: string): boolean;` | Start editing a row | H5-B2/H5-B3 final allowlist and contract policy |
| `toggleNode` | `toggleNode(node: NeuTreeTableNode, event?: Event): void;` | Toggle node expansion | H5-B2/H5-B3 final allowlist and contract policy |

**Total supported imperative methods: 84.** Every other callable component/directive member is INTERNAL/UNSUPPORTED unless it is an Angular framework protocol method.

## Protected final facades

- Table: 77 inputs / 38 outputs / 0 models / 20 composition selectors; 32 supported methods.
- TreeTable: 46 inputs / 23 outputs / 0 models / 18 effective composition selectors; 9 supported methods.
- Select: 56 direct inputs / 10 outputs / GAP 0.
- Multiselect: 66 direct inputs / 13 outputs / GAP 0.
- Autocomplete: 65 direct inputs / 13 outputs / GAP 0.
- Listbox: 51 direct inputs / 10 outputs / GAP 0.
- SpeedDial: 15 inputs / 5 outputs / 0 models / 2 composition selectors.
- OrganizationChart: 11 direct inputs / 4 outputs / 2 models / 4 composition selectors.
- Option family: 30 supported exports retained; 22 required internal bridges retained; no input/output/model/context redesign.

## Verification

- Focused: contract unit tests 5/5; strict H5-C1 consumer facade rejected 38/38 removed exports; H5-B4, Option, and Table strict template fixtures passed.
- Build/declarations: production package build passed for all 106 typed entrypoints; declaration contract audit passed.
- Functional: 145 files / 2,995 tests passed. The command then reported the pre-existing H7 coverage-threshold debt: 94.75% statements, 92.69% branches, 93.52% functions, 96.54% lines.
- Imports/SSR: 106/106 import smoke and 106/106 SSR smoke passed.
- Package: 443-file package verification passed; publint passed; ATTW reported no problems.
- Schematics: package and idempotence checks passed.
- Entrypoint/CVA/logical CSS: 105 secondary-entrypoint audit passed, 24 CVA components passed, 102 stylesheets passed.
- Table architecture: 77/38/96/20 passed.
- Baseline debts left unchanged: token manifest stale; primitive allowlist debt; bundle thresholds (baseline 3,183.4KB, candidate 3,182.7KB); README metrics/coverage threshold. No H6/H7 work was performed.
- Showcase: unchanged; no Showcase candidate generated.

## Scope confirmation

- H5-C1 only; no H5-C2 foundation restructuring or H5-C3 private bridge work.
- No H6 optimization, H7 coverage farming, or H8 visual/CSS/token changes.
- Consumer behavior and supported functional API are unchanged; only unsupported implementation exports were removed.
- SpeedDial visual debt is untouched.
- No commit, push, tag, or publish.
