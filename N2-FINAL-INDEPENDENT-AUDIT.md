# N2 — Final Independent Audit

## 1. Final audit status

**N2 FINAL AUDIT — REMEDIATION REQUIRED**

Audit date: 2026-09-25. One independently reproduced **P1 runtime defect** prevents acceptance of the unconditional final technical certification: RichTextEditor changes valid HTML attribute values, including navigation URLs, on sanitization and subsequent editing cycles. No P0 was demonstrated. Package, ownership, hydration and test results below are not invalidated wholesale by this finding; nor do their green results negate it.

Audit only. No runtime, tests, configuration, thresholds, package exports, snapshots or previous reports were changed. This report is the sole new deliverable. No commit, push, tag, release, publication or subsequent phase was performed.

## 2. Audited checkpoint

| Property | Observed value |
| --- | --- |
| Repository | `neural-ui-workspace-v2` |
| Branch | `v2` |
| HEAD | `7f1d730c5a889c80880b8ead9d2d76bef753ceb0` |
| Parent | `296ccc7c5a90c46b818ad5e63af12e7b4e7da4a0` |
| Initial tracked changes / staged changes | 0 / 0 |
| Initial foreign untracked file | `projects/ui-core/tree-table/public_api 2.ts` |
| Foreign SHA-256 | `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644` |

The checkpoint remained unchanged throughout the audit. Existing generated build/coverage material was distinguished from tracked product source.

## 3. Methodology

Read the original closeout, Calendar REM-01, first recloseout, Tree REM-02 and RECLOSEOUT-02 reports completely. Treated them as claims, not proof. Cross-checked current code, compiler-resolved exports, Git state, package manifests, test implementation and independently executed checks. Sampled frozen Table/TreeTable/Tree/VirtualList and specialized-forms contracts where behavior required interpretation; did not reopen approved scope or perform a new PrimeNG audit.

Evidence levels used here:

- **VERIFIED**: independently reproduced or directly established from the current artifact/source.
- **PARTIALLY VERIFIED**: inspected implementation/fixture and/or unit execution, but did not repeat every browser, performance or interaction matrix.
- **UNVERIFIED**: not established by this audit; never promoted to PASS.
- **CONTRADICTED**: concrete counterexample or artifact contradicts the claim.

New probes used in-memory TypeScript compilation, esbuild metafiles, actual compiled Angular SSR and Chromium DOM inspection. They did not patch production or tests. Package verification used existing commands; global coverage was deliberately not rerun. Browser tests were actual SSR-to-hydration flows, not DOM-only unit substitutes.

Reproduced commands/checks included:

| Check | New result |
| --- | --- |
| `npm test -- --no-coverage` | exit 0; 187 files, 2,500 tests |
| `npm run build` | exit 0; compiled `.mjs`, declaration `.ts` and `.json` hashes unchanged versus prebuild dist |
| `npm run audit:contracts` | exit 0 |
| `npm run verify:package` | exit 0; 431 packed files |
| `npm run audit:package` | exit 0 under its existing ATTW ignores; not strict ATTW |
| `npm run audit:entrypoints` | exit 1; 16 missing-demo mappings, detailed below |
| `scripts/test-ui-core-entrypoint-imports.mjs` | all 97 entrypoints PASS |
| `scripts/test-ui-core-ssr-smoke.mjs` | all 97 entrypoints PASS |
| Table / TreeTable / C6 / C7 compile-only type scripts | PASS |
| `N2_C6_PACKAGED_HYDRATION=1 npm run test:n2-c6-hydration` | real packaged Angular 22 consumer + SSR/hydration PASS |
| `npm run test:n2-final-rem-01-calendar-hydration` | real Chromium PASS |
| Direct publint | PASS |
| Strict ATTW, without ignore rules | exit 1; not PASS |
| Independent valid JS-import tree-shaking probes | root and four sampled facade imports unused: 0 B |

This is an adversarial sample plus broad executable gates, not a proof of all possible states of 94 components.

## 4. Sol reccloseout claim review

| Prior claim | Independent assessment |
| --- | --- |
| 94 public components, 94 completed in portfolio | **VERIFIED** as inventory/status data; **CONTRADICTED** as unconditional defect-free completion by IA-01 |
| Full suite 2,500/2,500 | **VERIFIED**, newly executed |
| Production build and package verification | **VERIFIED**, newly executed |
| Calendar controlled-value remediation | **VERIFIED** in implementation, tests and Chromium |
| Tree P1 typeahead | **VERIFIED** in tests and packaged Chromium flow |
| All P1 runtime paths clear | **CONTRADICTED**: safe RichText HTML attributes are corrupted |
| Global coverage threshold fails | **VERIFIED** from current summary/config and prior command evidence; not rerun |
| Strict ATTW fails | **VERIFIED**, newly executed; diagnostics classified in §23 |
| Unused root retains 0 B | **VERIFIED independently**; several existing harnesses do not prove it (§25) |
| Tree package bundle baseline | **CONTRADICTED methodology**: source/dist mixed through workspace aliases (§26) |
| SSR import safety | **VERIFIED** for all 97 entrypoints |
| Real hydration for every previously certified family | **PARTIALLY VERIFIED**: fixture inspection, full unit suite and two newly rerun real browser flows; not every family rerun |
| Firefox/WebKit/axe certified now | **UNVERIFIED**; current compatible browser/tool installations absent (§42) |
| Calendar `aria-selected`, clear/preset coverage | **CONTRADICTED wording**, not a new runtime failure (§9) |

The last report's acceptance conclusion cannot stand unchanged after a reproduced P1. Historical successful commands remain historical successful commands.

## 5. Portfolio recount

Independently followed the 97 actual ng-package entrypoints using the TypeScript checker, resolved export aliases, and deduplicated exported decorated component classes by source declaration. Result: **94 public components**, no duplicate component declarations and no unresolved public barrels in that census.

Separately parsed `N2-COMPONENT-PORTFOLIO.json`: 94 entries, all `COMPLETED`. This agrees on membership/count; it does not prove each completion assertion. Did not use the portfolio generator as the independent counter and did not regenerate it.

## 6. Completion verification

P1 sampling covered ownership, typeahead, forms, hierarchy, remote requests, export, virtualization, editing projection, resources and HTML integrity. Calendar and Tree remediations hold. Table/TreeTable replacement and independent facade boundaries remain present. VirtualList exists as a final public implementation, not a remaining absent component.

RichTextEditor is marked completed but has a reproducible data-integrity failure in its existing HTML contract. Therefore “94 implemented” is supportable; “all 94 technically clear with no open P1” is not. No new feature or P2 expansion is needed to demonstrate the defect.

## 7. Entrypoints

97 JavaScript entrypoints resolve and import. Generated exports include Table, TreeTable, Tree and VirtualList and exclude TableCore and transitional candidate paths. Package export targets inspected exist. The package has 101 export keys when package metadata and style subpaths are included; this is not 101 JavaScript components/entrypoints.

Contract audit reports 97 entrypoints, 813 exported declarations, 1,462 bindings and 5,179 classified symbols. Historical reconciliation categories are not silently treated as new public API failures. The failed `audit:entrypoints` command is specifically its Showcase-demo mapping gate, not missing compiled exports.

## 8. Legacy runtime

Current product scans and sampled dependency graphs found no TableCore entrypoint/component/selector, `table/next`, `tree-table/next`, old Table/TreeTable facade, PrimeNG grid, ApexCharts/ng-apexcharts or hidden compatibility bridge. Historical documentation and synthetic test fixtures were not counted as shipped legacy runtime.

No product `ControlValueAccessor` implementation or `NG_VALUE_ACCESSOR` registration was found. Generic testing helpers mentioning CVA methods do not constitute a production adapter.

## 9. Calendar remediation

`projects/ui-core/calendar/neu-calendar.component.ts` keeps `value` parent-owned. Interaction proposes a value; rejected input does not optimistically change the applied selection, and a parent replacement is reflected without echo. Tests inspect actual DOM classes/pressed state and agenda, not only the proposed payload. The independent real Chromium run confirms accepted/rejected pointer and keyboard behavior, DOM reuse and zero NG050x.

Precision correction: day controls use **`aria-pressed`**, not `aria-selected`. Clear/preset/multiple/range scenarios are not part of this Calendar API. Earlier REM-01 accurately distinguishes these; RECLOSEOUT-02 overstates them. This is P3 report debt, not a reason to rewrite Calendar or reopen its accepted ownership fix.

## 10. Tree typeahead

All 46 current Tree tests run within the newly green full suite. The ten REM-02 additions exercise actual focused treeitems, repeated prefixes, collapsed descendants, interactive child isolation, virtual offscreen focus, reconstruction and destroy cleanup. Expected focus targets are literal independently selected nodes, not results generated by the same implementation helper.

The packaged Chromium gate passed again: first typed character after hydration exactly once, expected focus, zero business events and zero NG050x. The fake-clock timeout test's inspection of private ephemeral state is weaker than DOM evidence, but the separate browser flow supplies real focus evidence. No new runtime remediation is needed for the typeahead claim.

## 11. Forms/CVA

Signal Forms controls use their approved form-value contract, including `model()` where the form control owns its value. This is distinct from a controlled Table/Tree/Calendar proposal contract. Scanning did not find a Neural runtime CVA adapter/provider layered on those controls.

ReactiveFormsModule/FormControl usage remains in DataView/Pagination UI interop; it is not evidence that product form controls implement CVA. Pagination's applied page-size-to-control write suppresses events, and the control subscription emits proposals and tears down. Angular's official interoperability is not a second Neural applied owner.

The previous four-mode specialized-forms matrix is supported by passing current unit tests and contracts, but this audit did not independently repeat every control in every browser/form mode. RichTextEditor's defect is value processing independent of binding mode; it cannot be dismissed as an external adapter problem.

## 12. Signals/ownership

Sampled Calendar, Select, Autocomplete, DateInput, TreeSelect, Table, TreeTable, Tree, VirtualList, CommandPalette and menu ownership graphs. Distinguished applied input, form model, optional uncontrolled fallback, computed projection and ephemeral focus/query/geometry/draft state. No additional demonstrated competing applied domain owner was found in this sample.

Examples: Table/TreeTable query/layout/selection remain inputs/proposals; Tree expansion is applied keys; VirtualList items are inputs, viewport is ephemeral; CommandPalette open/query are intentionally local by the frozen C4 decision. Autocomplete's query/label synchronization is presentation, not a second selected-value owner. MegaMenu's local open behavior is not compared against an invented controlled-open input.

AST inspection of computed callbacks found local collection construction and copied sorting/reversal, not a direct signal `.set/.update` or output emission inside those callbacks. This is a structural check, not a claim that every transitive function is formally pure. RichText's computed sanitizer is pure but semantically wrong on attribute entities.

## 13. Effects

AST census of active product source: **36 `effect()` calls and 11 `afterRenderEffect()` calls**. Comments, tests and type fixtures excluded. Calls below use paths relative to `projects/ui-core/`; line numbers refer to the audited checkpoint. Framework-owned effects are destroyed with the instance. Resource-owning effects additionally need the indicated cleanup. Browser render effects do not execute during SSR.

| Source / line | Reads → purpose / writes | Boundary, cleanup and assessment |
| --- | --- | --- |
| `animate-on-scroll/neu-animate-on-scroll.directive.ts:38` | options → observer reconfiguration | Browser-initialized guard; previous observer disposed/disconnected; resource effect |
| `autocomplete/neu-autocomplete.component.ts:717` | value/options → displayed query/matched label | Ephemeral presentation, untracked reads where intended; not applied value ownership |
| same `:750` | visible options → active-option controller | Reconcile focus; controller disposed on destroy |
| same `:766` | suggestions → pending completion/panel | Ephemeral pending intent; timers/controller cleared on destroy |
| same `:777` | disabled → close UI | No selected-value correction; local panel lifecycle |
| `block-ui/neu-block-ui.component.ts:73` | blocked → sibling interaction blocking | DOM/resource boundary; restore lifecycle, no domain mirror |
| `bottom-sheet/neu-bottom-sheet.component.ts:106` | open → overlay stack registration | Stack activation returns cleanup; browser boundary in shared stack |
| `carousel/neu-carousel.component.ts:61` | item/config changes → uncontrolled page clamp | Only when controlled page is absent; legitimate fallback owner |
| same `:71` | autoplay config/state → autoplay lifecycle | Timer/visibility resource stopped on destroy; not controlled page correction |
| `dashboard-grid/neu-dashboard-grid.component.ts:128` | projected content → slot attachment | Guarded microtask; browser/destroy checks; DOM only |
| `dock/neu-dock.component.ts:221` | items/direction → roving focus | Ephemeral controller state |
| `image-viewer/neu-image-viewer.component.ts:253` | current image → reset transform | Presentation-only; private Gallery viewer lifecycle |
| `internal/neu-hydration-internals.ts:117` | media query → acquire/release listener | Browser matchMedia, destroy releases shared registration |
| `key-filter/neu-key-filter.directive.ts:83` | validator/config → validator notification/last valid view | Input-view integration; not a hidden domain model |
| `listbox/neu-listbox.component.ts:519` | visible options/locale → focus/typeahead | Controller teardown; ephemeral |
| `modal/neu-modal.component.ts:219` | open → overlay stack | Cleanup unregisters |
| same `:224` | closing → cancel interaction/reset geometry | UI state; cancel path |
| same `:230` | open/restore-focus → focus scheduling | Epoch/destroy guards and restore lifecycle |
| `pagination/neu-pagination.component.ts:168` | applied page size → view FormControl | `emitEvent:false`; subscription unsubscribes; no applied page mirror |
| `panel/neu-panel.component.ts:253` | enhanced viewport → ResizeObserver | Browser guard; onCleanup disconnect |
| `ripple/neu-ripple.directive.ts:49` | disabled → remove ripples | Visual resource; timers/media listener cleaned on destroy |
| `scroll-top/neu-scroll-top.component.ts:79` | target/threshold → scroll binding | Browser guard; rebind/unbind/destroy cleanup |
| `sidebar/neu-sidebar.component.ts:173` | overlay active → overlay stack | Cleanup unregisters |
| same `:179` | open/persistence/restore target → focus | Cancellation/destroy guard |
| `speed-dial/neu-speed-dial.component.ts:337` | actions → focus reconciliation | Ephemeral |
| same `:347` | open transition → lifecycle notification | Transition dedupe; not a parent-write business proposal |
| same `:363` | disabled → close intent/UI | Approved controlled/fallback boundary, not domain selection |
| `table/internal/renderer/neu-table-basic-renderer.component.ts:328` | viewport config → scroll/ResizeObserver/rAF | Browser guard; all three cleaned by onCleanup |
| `table/public/neu-table.component-contract.ts:876` | applied remote snapshot → request coordination | Browser activation; correlation bookkeeping, not backend cache/domain owner |
| `textarea/neu-textarea.component.ts:133` | value/autoresize → resize measurement | Guarded microtask and destroyed check |
| `tree-table/internal/renderer/neu-tree-table-renderer.component.ts:239` | projection/editor state → anchor/focus reconciliation | UI-only ephemeral state |
| same `:251` | virtual viewport → scroll/observer/rAF | Browser guard and onCleanup |
| `tree-table/public/neu-tree-table.component-contract.ts:384` | hierarchy diagnostics → `featureError` | Browser-only stable diagnostic dedupe; no hierarchy correction |
| same `:412` | remote snapshot → requests | Approved coordinator; no response ownership |
| `tree/neu-tree.component.ts:150` | hierarchy issue → deduped diagnostic | Can diagnose deterministically on server; does not repair data |
| same `:157` | applied expansion/relations → children request | Browser-only, accepted visible expansion; correlation state cleared on destroy |

All 11 render effects:

| Source / line | Purpose / lifecycle |
| --- | --- |
| `bottom-sheet/neu-bottom-sheet.component.ts:94` | Rendered lifecycle notifications |
| `confirm-popup/neu-confirm-popup.component.ts:150` | Fit popup to viewport |
| `context-menu/neu-context-menu.component.ts:121` | Reconcile rendered focus |
| `kanban/neu-kanban.component.ts:273` | Restore pending card focus |
| `menu/neu-menu.component.ts:501` | Reconcile rendered menu/focus |
| `modal/neu-modal.component.ts:207` | Panel presence/lifecycle |
| `rich-text-editor/neu-rich-text-editor.component.ts:349` | Write sanitized HTML to editor; **IA-01 data corruption**, not an extra domain-owner finding |
| `sidebar/neu-sidebar.component.ts:209` | Rendered lifecycle notifications |
| `splitter/neu-splitter.component.ts:88` | Attach projected pane elements |
| `tree/neu-tree.component.ts:175` | Applied visible-sequence fallback focus |
| `virtual-list/neu-virtual-list.component.ts:148` | Range/diagnostic notification with dedupe and browser activation |

Certified counts retained: Table 2; TreeTable 4; Tree 2 regular + 1 render; VirtualList 1 render. Counts alone are neither a violation nor proof of correctness. No effect-per-row/branch or compatibility effect was found in these hierarchical/virtual facades.

## 14. RxJS/resources

No BehaviorSubject domain owner found. Existing RxJS usage is boundary-oriented: DataView and DragDrop use `takeUntilDestroyed`; Pagination unsubscribes its control bridge; CDK DialogRef close streams complete; ContextMenu/Popover/ImageViewer dispose overlay resources. These are not automatically architectural violations.

Sampled lifecycle pairs include Knob's window pointermove/up/cancel/blur registration/removal, Select focus-rAF/controller disposal, Tree typeahead timer cancellation, Table/TreeTable virtual scroll/ResizeObserver/rAF cleanup, and VirtualList's single viewport lifecycle. The fresh packaged Tree browser run includes 100 create/destroy cycles.

CascadeSelect's focus helpers schedule rAF without retaining a cancellation handle (`neu-cascade-select.component.ts:628–637`). No late business event or incorrect focus was reproduced; unique trigger IDs and missing destroyed DOM limit the observed impact. Record as a bounded P3 lifecycle-hardening opportunity, not a speculative P1 or proof of a global leak. No universal “zero asynchronous callbacks” claim is made.

## 15. Immutability

Sampled readonly contracts, applied-state computations, copied array operations and deep-frozen test fixtures. Table/TreeTable exports read committed rows rather than editor drafts; hierarchy metadata lives outside domain T. Tree/TreeTable normalization uses private maps/projections and detects malformed references without rewriting consumer arrays. Controlled gestures emit new proposals.

No demonstrated mutation of consumer rows/query/selection/roots/children/layout was found in these paths. IA-01 instead changes serialized form-value meaning; readonly objects would not catch that semantic integrity problem.

## 16. SSR static

Browser work in sampled viewport, focus, overlay and request paths is guarded or render-scheduled. Dynamic serializers/editors are not evaluated by module import. Tree/TreeTable normalization does not require browser geometry. No newly demonstrated import-time `window`/`document` failure was found.

A separate SSR probe of the **compiled public RichTextEditor**, using `renderApplication`, `bootstrapApplication`, `provideServerRendering` and zoneless detection, reproduced double-escaped attributes in server HTML. Thus SSR safety PASS means safe execution, not necessarily correct serialized data.

## 17. SSR imports

New all-entrypoint SSR import smoke: **97/97 PASS**. TableCore absent. This establishes import safety in the current Node/Angular environment, not render correctness for every optional state. Fresh build produced unchanged compiled hashes, so the inspected dist was not a stale different implementation.

## 18. Hydration

New real Chromium executions:

- Packaged Tree: SSR hierarchy reused after hydration; first typeahead and controlled interaction assertions pass; zero NG050x/business echoes in the asserted scenarios.
- Calendar REM-01: SSR DOM reused, rejected/accepted interaction behavior preserved, zero NG050x.

Inspected Table, TreeTable, TreeSelect, C6, C7 and Calendar hydration fixtures: server render and client hydration are real, captured DOM references are compared after bootstrap, and no wholesale DOM reset is used to simulate reuse. Table/TreeTable/TreeSelect also assert the entire captured error list is empty. Some other fixtures filter errors by NG050/NG0/TypeError/ReferenceError; this is less comprehensive than rejecting every unexpected console error.

Did **not** rerun every family's Chromium certification. Those remain partially verified via fixture/source review and full unit execution. No Firefox/WebKit hydration PASS is claimed.

## 19. Angular tarball consumer

`N2_C6_PACKAGED_HYDRATION=1` creates and installs the actual npm-packed library in a temporary consumer, removes source path aliases, and runs the consumer's Angular build/SSR/hydration. Angular 22.1.6 zoneless consumer passed. No workspace/file dependency, npm link, source import or symlink was substituted for that package test.

Fixture cleanup runs in `finally`. Tarballs/temporary consumer directories were not committed or retained as audit deliverables. The current package verification additionally confirms the 431-file publishable set; the foreign TreeTable copy is not a package file.

## 20. Full suite reproduction

Fresh `npm test -- --no-coverage`: **187/187 files, 2,500/2,500 tests PASS**, exit 0, approximately 75 seconds. Includes current Calendar, Tree, Table/TreeTable and VirtualList tests. No threshold/config/test modification was made to obtain this result.

This validates repeatability of the existing suite, not sufficiency. IA-01 remains reproducible against that green suite. No test-count padding or artificial preservation of removed legacy tests was performed.

## 21. Coverage

No new global coverage run. Independently read `angular.json`, `vitest.coverage.config.mts` and current `coverage/ui-core/coverage-summary.json` (2026-09-25 artifact), and compared with the recorded command/outcome.

| Metric | Covered / total | Actual | Threshold |
| --- | --- | --- | --- |
| Lines | 17,944 / 19,052 | 94.18% | 95.01% |
| Statements | 22,493 / 24,551 | 91.61% | 95.01% |
| Functions | 4,271 / 4,693 | 91.00% | 95.01% |
| Branches | 12,766 / 14,687 | 86.92% | 95.01% |

All four global thresholds remain failed. `perFile:false`; thresholds unchanged. Existing exclusions are stress specs and, in the recorded coverage invocation, two benchmark-only Table/TreeTable performance specs. This explains 2,498 coverage-run tests versus 2,500 full-suite tests; it is not a newly invented exclusion. The runner config serializes work rather than hiding source categories.

## 22. Coverage gap analysis

Highest sampled uncovered-line concentrations include ColorPicker (85), Table renderer (84), Select (79), DateInput (57), Uploader (53), TreeTable renderer (48), Tree (38), RichTextEditor component (37), Table selection (37) and MegaMenu (36). These are interactive/error/lifecycle-heavy areas, not all harmless formatting branches.

RichTextEditor utility coverage is 87.30% lines / 100% functions / 69.64% branches; its component is 84.05% lines / 65.95% functions / 68.81% branches. The failing attribute path is exercised for ordinary URLs but not the entity-sensitive data case. More line hits alone would not establish correctness; round-trip and browser semantic assertions are needed.

Coverage failure remains P2 assurance/release-policy debt, not automatically a P1 runtime bug. However, the newly demonstrated P1 means a blanket assertion that remaining gaps contain no P1 risk is unsupported. Tree typeahead's concrete tests/browser evidence remains valid regardless of the aggregate threshold.

## 23. ATTW

Strict `attw --pack dist/neural-ui/core --format ascii --summary --no-color` returned **exit 1**. Parsed the entire diagnostic table, not only its first few rows:

- 97 `node16 (from CJS)` cells: ESM, dynamic import only.
- 4 `./styles` resolution failures: node10, node16 CJS, node16 ESM and bundler.
- No other diagnostic category in this execution.

The package is ESM (`type:module`); styles is a Sass/style asset subpath, not a TypeScript runtime module. Supported Angular ESM/bundler usage passed the real consumer/import tests. These facts bound the observed impact; they do not convert strict ATTW to PASS.

`scripts/audit-published-package.mjs:11` explicitly ignores `cjs-resolves-to-esm` and `no-resolution`. Its green exit is a **filtered-policy PASS**, not strict certification. Reclassify as P2 packaging-tool-policy / release-only review. No ATTW config, exports or ignores were changed. The broad historical “root types” label is less precise than the reproduced diagnostics above.

## 24. Publint

Direct publint against the newly rebuilt package: PASS. This is independent of strict ATTW and does not waive it. `verify:package` also passes its required-file/npm-pack checks. No package corruption or missing supported ESM target was reproduced.

## 25. Root-unused

**IA-02, P2 evidence defect.** `scripts/audit-n2-c6-bundle.mjs:12,17` imports `NeuTreeComponent` unused from the root FESM, which does not export that symbol. C7 uses the same pattern for `NeuVirtualListComponent` (`:13,18`). The TypeScript loader erases the unused import before resolution; the metafile contains only stdin. Similar unused TypeScript-import probes occur in Table export, TreeTable and overlay bundle harnesses. Zero output in those cases cannot prove tree-shaking of a resolved package.

Independent replacement **probe only, no harness edit**: valid named imports with `loader:'js'`, `tsconfigRaw:{compilerOptions:{}}`, actual dist targets, `bundle:true`, `write:false`, and metafile assertions that the entry was resolved. Results:

| Unused import | Resolved inputs | Entry resolved | Final raw |
| --- | ---: | --- | ---: |
| Root `provideNeuralUI` | 3 | yes | 0 B |
| Table component | 8 | yes | 0 B |
| TreeTable component | 8 | yes | 0 B |
| Tree component | 3 | yes | 0 B |
| VirtualList component | 2 | yes | 0 B |

Therefore the **product root-unused claim holds**, but the existing regression harness has a false-positive blind spot. Repair should assert package resolution and preferably reject an intentionally invalid export as a harness control.

## 26. Tree-shaking

**IA-03, P2 bundle-evidence defect.** C6's bundle harness inherits workspace tsconfig aliases. Its metafile includes compiled Tree plus `projects/ui-core/drag-drop/neu-drag-drop.directive.ts` and its source barrel. It is not a solely compiled-package measurement.

Same component export, same esbuild/environment/externals/compression, differing only by disabling inherited tsconfig paths:

| Tree basic probe | Raw | gzip level 9 | Brotli |
| --- | ---: | ---: | ---: |
| Existing mixed source/dist resolution | 53,135 B | 11,352 B | 10,026 B |
| Package-only resolution | 62,514 B | 12,199 B | 10,726 B |

Package-only metafile contains the compiled Tree and compiled DragDrop FESMs, no workspace runtime source. Difference: +9,379 B raw (~17.65%), +847 B gzip (~7.46%). The older report's 11,312 B gzip differs slightly from the current mixed-path compression; the same-run comparison above isolates the real methodology difference.

This is **not a newly introduced runtime regression** and not an instruction to optimize certified Tree. It invalidates the interpretation of the old number as the final package baseline. No Table/TreeTable/VirtualList/Menu facade is pulled into either Tree graph. Other historical byte matrices were not all reproduced, so no blanket ±5% certification is issued for them here.

## 27. Lazy features

Inspected actual compiled reexport targets, not just tiny facade barrels. Table retains private dynamic imports for advanced filter builder, active editor, CSV, JSON and XLSX. TreeTable retains active editor and export coordinator dynamically, with CSV/JSON/XLSX behind the latter.

A new splitting/metafile probe traversed the **complete static initial output closure**, including shared chunks, and excluded dynamic edges. Initial closures contained **zero editor/advanced-filter-builder/CSV/JSON/XLSX implementation inputs**. This avoids mistaking the 72/76-byte facade entry files for the whole initial application. Aggregate raw closure in that probe: Table 174,447 B; TreeTable 112,510 B (external framework dependencies; not a browser-performance claim or substitute for every historical consumer matrix).

No third-party XLSX writer/parser dependency was observed. Forms editor code remains private/lazy. Dynamic import presence alone was not used as proof of absence from initial closure.

## 28. Dependency graph

Table and TreeTable remain independent public facades. Sampled source imports and compiled/metafile graphs have no legacy facade, TableCore, mutual facade dependency, HTTP, Router, storage or third-party grid edge. Tree's approved DragDrop dependency is present and explicitly included in the corrected bundle accounting. VirtualList does not wrap Tree/Table/Listbox/another scroller.

Router/navigation and Angular forms dependencies in other components are assessed against those components' contracts, not incorrectly banned library-wide. No new dependency was installed during the audit; the packaged consumer installed its existing declared dependencies as part of the authorized test.

## 29. Table

Sampled `table/public/neu-table.component-contract.ts`, client pipeline, selection, remote coordinator, virtualization and lazy exports. Applied state remains input/proposal based; `dataRequest` is the remote channel; SSR coordinator checks browser activation. Empty ranges do not dispatch; request IDs and metadata coverage participate in currentness. No export-triggered hidden HTTP/backend enumeration was found.

All current Table unit tests passed in the full suite, and compile-only positive contracts plus 17 intentionally invalid cases passed. Final package/import/root-unused/lazy boundaries verified. Historical full Table browser/performance certification was not completely rerun; classify those portions PARTIALLY VERIFIED, not a new full Table certification.

## 30. TreeTable

Sampled parent-owned hierarchy/expansion/query/selection, diagnostics, iterative normalization/flatten, renderer and remote coordinator. `featureError.feature='hierarchy'` remains the structural channel, not a new output. Duplicate keys/parents/missing references/cycles are bounded through diagnostics and private projection. The four certified effects remain four.

Current unit suite and positive/11-negative compile-only cases pass. Public final entrypoint and independent facade boundary pass. Export/editor boundaries remain lazy. No new TreeTable P1 defect was demonstrated; remote global-tree virtualization or reparenting was not inferred from its loaded-tree contract.

## 31. Tree

`tree/neu-tree.engine.ts` validates identity, relation/root references, duplicate child/parentage and cycles; cycle detection and flatten traversal use work stacks rather than naive recursion. Domain T is not decorated with private hierarchy fields. Applied expansion precedes children requests; hidden expanded descendants are not an excuse for speculative fetching.

Typeahead and packaged Chromium evidence are verified (§10). Tree has its separately authorized controlled node-drop contract; this must not be confused with TreeTable's deferred reorder/reparent feature. The Tree runtime was not modified. Its corrected package-only bundle evidence is in §26.

## 32. VirtualList

`virtual-list/neu-virtual-list.engine.ts:38–50` normalizes nonfinite/negative counts and geometry, falls back to a positive item size, clamps scroll position, caps overscan, and computes bounded half-open ranges. Invalid size does not create an unbounded loop. Exact semantic identity and duplicate-key diagnostics are separate from presentation index.

Readonly/generic/range compile-only tests pass, as does the complete unit suite. Root-unused and independent facade graph verified. Browser fixture implementation reviewed; the C7 real browser matrix was not newly rerun. Fixed-height one-dimensional local items remain the promise; remote/infinite/variable-height/2D behavior is not falsely treated as implemented P1.

## 33. Accessibility

Verified sampled native semantics, SSR attributes, actual focus and keyboard behavior in fresh Tree/Calendar runs. Tree uses tree/treeitem metadata, Table native table structure, and TreeTable its row-focused treegrid contract. Leaf/expanded and sibling semantics derive from projections rather than post-hydration ARIA patching in the reviewed paths.

No blanket WCAG conformance claim. No current axe run, no assistive-technology user testing, and no new all-browser matrix. Missing tools reduce assurance; they are not themselves evidence of a P1 accessibility failure. RichText URL/title corruption can also affect meaningful link content, but the demonstrated finding is classified as value integrity rather than a speculative WCAG violation.

## 34. Keyboard/focus

Tree's post-hydration first key, prefix matching and virtual focus behavior are directly verified. Calendar real Enter/Space handling supplements unit calls that alone would not establish browser default-action behavior. Reviewed cleanup/focus boundaries in Menu, Modal, Sidebar, Select and TreeTable use ephemeral state and lifecycle guards.

Did not infer correctness of every browser-native contenteditable/IME/pointer-capture combination from Chromium or synthetic events. Those remain cross-browser risk areas. No unexplained focus owner competing with applied business state was demonstrated in the sampled controlled facades.

## 35. Test quality

Concrete weaknesses, not generic distrust:

- Root-unused TypeScript imports are erased before resolution (IA-02); a false green mechanism is demonstrated.
- Tree's “package bundle” resolves one dependency to source (IA-03).
- RichTextEditor formatting/link test (`neu-rich-text-editor.component.spec.ts:87–105`) uses uncomplicated `https://example.com` and a mocked execCommand append. It does not assert a query-bearing entity-encoded link's browser destination or sanitization idempotence. Malicious-script tests do not cover safe-data preservation (IA-01).
- Some browser fixtures reject selected error patterns instead of every unexpected error (§18); no actual NG050 failure was hidden in the new runs.

Counterexamples to an indiscriminate false-confidence finding: Calendar tests inspect rejected-state DOM; Tree typeahead asserts actual activeElement and literal targets; packaged hydration captures/reuses server DOM before interactions; full-suite results were independently reproduced. No “same helper for actual and expected” issue was demonstrated in these selected regression tests.

## 36. Public API quality

Inspected final barrels/generated declarations and representative controlled, form and template contracts. No candidate aliases, old facade or accidental TableCore public path was found. Audited product surfaces preserve the final Table/TreeTable contracts; current contract gate passes.

Data-oriented proposal/request types in the sampled rewritten families do not embed DOM events as domain state. Existing UI event handlers or genuine directive/DOM-boundary APIs elsewhere must not be declared an API violation merely because TypeScript visibility is public. No new required public type/input/output/method is implicated by IA-01. This sample is not a promise that all 813 exported declarations have received a new manual design review.

## 37. Type quality

New compile-only runs: Table positive generics + 17 invalid cases rejected; TreeTable positive + 11 invalid cases rejected; C6 readonly/exact-K/closed selection and C7 readonly T/exact K/half-open/scroll contracts PASS.

Sampled 17 type-fixture files: no `as any`, no `@ts-ignore`; 29 `@ts-expect-error` directives; two `null as unknown as Component` phantom compile-time instances in CommandPalette/Kanban, not runtime coercion of consumer values. Compiler enforcement of expected errors is materially stronger than a comment-only negative fixture. Did not interpret those phantom instances as evidence that all generic cases are exhaustive.

## 38. Robustness

Reviewed concrete guards and passing tests for Tree/TreeTable duplicate keys, missing roots/children/parents, duplicate parentage and cycles; iterative work stacks bound deep traversal. Packaged Tree gate includes a 1,001-deep tree. VirtualList handles zero/negative/nonfinite geometry by the frozen fallback policy, not unsafe division/loops. Table remote coordinator reasons over loaded range/correlation rather than allocating `metadata.totalItems` rows.

Existing malformed-filter/date/range tests ran with the suite; these boundaries were not independently fuzzed exhaustively. No recursion overflow, infinite loop or total-proportional hidden remote allocation was reproduced. RichText's valid-input round-trip failure is a robustness counterexample even without malformed input.

## 39. Security surfaces

RichText uses a private tag/attribute/URL allowlist and direct editor HTML assignment; no bypass-trust call was found in that path. **A real integrity defect is confirmed (§47); no XSS bypass was demonstrated.** Do not describe the audit as proving sanitizer security.

Sampled Table/TreeTable CSV engines quote/escape cells and apply the frozen string formula-prefix policy; XLSX strings use inline string cells rather than implicit formulas. No new CSV policy was invented by the audit. Browser export object URLs are revoked in cleanup paths; Uploader's inspected file/preview paths did not establish an object-URL leak.

Field resolution is accessor-first, then direct field lookup, not arbitrary dot-path or `JSON.stringify(row)` traversal. TreeTable's direct `field in value` / `Reflect.get` can read inherited direct properties; therefore “no prototype traversal whatsoever” would be too broad. No prototype write/pollution was demonstrated. Sampled navigation uses Angular/native-link bindings; no separate executable URL injection was reproduced.

## 40. Active docs

**IA-04, P2 documentation/release accuracy debt.** `projects/ui-core/QUALITY_STATUS.md` remains an unqualified quality-status document (last reviewed 2026-08-05). It claims current OnPush defaults, global coverage above threshold and Angular 19–22 tarball/schematic support (`:7–15`, `:24–38`, `:66`). Current Angular-22-only compatibility and failed coverage contradict those as current-product guidance. It also lists an old browser/test matrix that is not evidence for this checkpoint.

Current README/Angular compatibility documentation correctly restrict support to Angular >=22 <23. `docs/TABLE_ARCHITECTURE.md` and `docs/TABLE_H3_CERTIFICATION.md` explicitly mark their Table1/TableCore material historical; they are not counted as active TableCore recommendations. Original N2 roadmap baselines are likewise distinguished from current API instructions. No docs were fixed in this audit.

## 41. Showcase debt

New entrypoint audit reports **16 entrypoint-to-demo failures**, corresponding to 14 unique page names because three utilities share `utilities-demo`: AnimateOnScroll, AvatarGroup, ButtonGroup, Carousel, Compare, Dock, DragDrop, Gallery, InputTags, KeyFilter, MegaMenu, Ripple, ScrollTop, SpeedDial, Tag and Terminal mappings.

This is the current measured count, not an automatic repetition of the historical “17 demos” label. Compiled imports, package verification and the tarball consumer pass independently. Classification: P2 / Showcase-readiness and release-documentation debt, not proof of a missing package runtime. No demo was implemented or repaired.

## 42. Browser/tooling limitations

Checked the executable paths resolved by the currently installed Playwright, not merely cache directory names. Chromium's expected revision 1243 exists. Expected Firefox 1543 and WebKit 2359 executables do not exist; older cached revisions do not certify the current harness. `axe-core` and `@axe-core/playwright` are not installed in this workspace.

No tools were installed to hide this limitation. Chromium passed the new runs; Firefox/WebKit/axe remain unverified. Contenteditable selection/IME, pointer capture, native keyboard default actions and overlay/focus restoration carry meaningful cross-browser risk. Classify P2 assurance debt, not automatic P1 failure. No fresh performance/visual marketing claims are made from these tests.

## 43. Filesystem hygiene

Git tracked/staged mode `120000`: **0**. Source/workspace scan excluding dependency/cache/build output directories: **0 symlinks**. No added symlink. No tracked generated package dist/tarball or `.DS_Store` was found. Two tracked paths named `fixtures/public-contract/dist/*` are intentional synthetic package-contract fixtures, not accidentally committed build output.

No leftover audit hydration/temp directory in the project. In-memory esbuild probes use `write:false`; their nominal output path was not created. Normal ignored dist/coverage/cache artifacts are not mislabeled as new untracked deliverables.

Foreign `projects/ui-core/tree-table/public_api 2.ts`: still untracked, unstaged, byte-identical SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`; no tracked runtime/tooling import references and no package inclusion. It was never formatted, renamed or deleted.

Final audit delivery is this new report plus the original foreign untracked file. Tracked product files and staging remain clean; `git diff --check` passes. No changes to previous evidence or certification documents.

## 44. Cross-component consistency

Compared applied proposal ownership, exact semantic key handling, half-open viewport ranges, disabled gesture behavior, open-state contracts, featureError and Signal Forms. Domain-controlled containers and form model controls intentionally differ. Local CommandPalette open, form model value and controlled Tree expansion are not three inconsistent implementations of the same owner.

Table and hierarchical facades keep private focus/draft/correlation state distinct from applied domain data. Shared string/number key concepts distinguish numeric from textual identity; do not infer every family's exotic numeric edge policy without its contract. Tree's node drop and TreeTable's deferred reparenting have different frozen scope.

No additional material contradiction was demonstrated by this sample. RichText safe-value preservation is a direct contract defect, not a justified family-specific semantics difference.

## 45. Deferred P2/P3

Rechecked frozen exclusions against final implementations: variable-height virtualization, extra multidimensional VirtualList modes, Table grouping/expansion combined with virtual modes beyond its approved contract, remote key lookup, TreeTable hierarchy-export extras and TreeTable reorder/reparent remain deferred. TreeTable reorder is explicitly P3 in I; Tree's later separately approved drop proposal does not silently authorize it there.

No deferred feature was implemented for this audit. The RichText issue is **not** an optional serializer enhancement or a P2 request: it corrupts an ordinary safe link/title supported by existing P1 HTML editing.

## 46. Debt reclassification

| Item | Independent classification | Reason |
| --- | --- | --- |
| RichText attribute entity corruption | **P1 BLOCKER** | Reproduced current runtime/value-contract violation |
| Global coverage below 95.01% | P2 DEBT / release-policy | Failed real thresholds; aggregate percentage alone is not a runtime proof |
| Strict ATTW | P2 DEBT / RELEASE-ONLY review | ESM-CJS and style-subpath diagnostics; supported ESM consumer passes |
| Root-unused harness false positive | P2 DEBT | Existing evidence can be vacuous; independent product result is still 0 B |
| Tree mixed source/package bundle | P2 DEBT | Understates compiled consumer bytes; no new runtime regression |
| Current missing Showcase mappings | P2 DEBT / Showcase readiness | 16 mappings, not missing runtime exports |
| Firefox/WebKit current revisions absent | P2 DEBT | Browser-critical behaviors not cross-browser revalidated |
| axe absent | P2 DEBT | No automated broad accessibility result; not fabricated as PASS |
| Active QUALITY_STATUS claims | P2 DEBT / release docs | Unsupported current support/coverage claims |
| Calendar report wording | P3 IMPROVEMENT | Wrong attribute/nonexistent scenarios; actual fix holds |
| CascadeSelect uncancelled focus rAF | P3 IMPROVEMENT | Hardening opportunity; no wrong late effect demonstrated |
| Historical Menu NG8102 / unrelated warnings | INFO pending applicable gate | Not emitted by the new core build; not newly fixed or certified away |
| Frozen P2/P3 features | INFO / deferred | Not an implementation gap against approved P1 |

## 47. P0/P1 findings

### IA-01 — P1: RichTextEditor corrupts safe HTML attribute values

**Exact implementation:**

- `projects/ui-core/rich-text-editor/neu-rich-text-editor.utils.ts:97–147`: attribute parser reads raw entity-encoded attribute text (`:110`) and serializes it through `escapeRichTextAttribute` again (`:147`), without decoding to its actual attribute value.
- `projects/ui-core/rich-text-editor/neu-rich-text-editor.component.ts:363`: applied value is normalized/sanitized for display.
- Same file `:349–354`, `:530–535`: render effect assigns that HTML to the actual editor.
- Same file `:513–515`: input reads browser `innerHTML`, sanitizes again, and writes the resulting form value. `:390`/`:507–510` can also preescape link insertion then sanitize it.

**Violated contract:** N2-009 specialized form controls retain real HTML editing/link behavior and sanitized form value. Sanitizing a permitted, safe attribute must not alter its decoded URL/title on each pass. This is a existing value-integrity requirement, not a request for a new API or unsupported protocol.

**Minimal input:**

```html
<a href="https://example.test/?a=1&amp;b=2" title="A &amp; B">link</a>
```

**Actual first result:**

```html
<a href="https://example.test/?a=1&amp;amp;b=2" target="_blank" rel="noopener noreferrer" title="A &amp;amp; B">link</a>
```

**Actual second sanitization:** the corresponding parts become `a=1&amp;amp;amp;b=2` and `A &amp;amp;amp; B`. Thus `sanitize(sanitize(input)) !== sanitize(input)` even though the input is safe, supported HTML.

Reproduction stages independently executed:

1. Compile the current utility in memory with TypeScript `transpileModule` (CommonJS) and evaluate in a fresh VM context. Run `sanitizeRichTextHtml` twice on the literal above: exact outputs shown above.
2. Import the built public RichTextEditor FESM in an Angular standalone root with `[value]="html"`; render with `renderApplication`/`provideServerRendering`/zoneless. Actual SSR editor anchor contains `&amp;amp;`, proving this is not an unused helper-only defect.
3. In real Chromium, assign the original, once-sanitized and twice-sanitized strings to a DOM host; inspect anchor `.href`, `.title` and `new URL(anchor.href).searchParams`:

| HTML stage | Actual query keys | `searchParams.get('b')` | Actual title |
| --- | --- | --- | --- |
| Original valid HTML | `a`, `b` | `2` | `A & B` |
| First sanitized HTML | `a`, `amp;b` | `null` | `A &amp; B` |
| Second sanitized HTML | `a`, `amp;amp;b` | `null` | `A &amp;amp; B` |

This changes the consumer's actual navigation target. Subsequent native HTML serialization plus the existing input path can compound the corruption. No network request or real navigation was needed for reproduction. Image source/alt and other permitted attributes share this serializer, but the demonstrated blocker only needs the link/title case; no broader exploit is asserted.

**Why green tests miss it:** current tests cover malicious scripts/handlers/URLs and a simple link URL, not safe entity-bearing attribute round-trips or the actual resulting browser query parameters. The execCommand mock does not model a full browser serialization/edit cycle. Full-suite PASS therefore coexists with the defect.

**Minimal affected scope:** RichText HTML attribute parsing/serialization and its regression tests/browser fixture. Not Table, Tree, forms ownership, package layout or a new public API. No fix was made by this audit. No XSS bypass or P0 is claimed.

## 48. P2/P3 findings

| ID | Priority | Exact evidence / affected scope |
| --- | --- | --- |
| IA-02 | P2 | `scripts/audit-n2-c6-bundle.mjs:12,17`, C7 `:13,18` and similar unused-TS-import harnesses; resolution skipped; repair evidence harness only |
| IA-03 | P2 | C6 esbuild inherited tsconfig paths; metafile source DragDrop vs compiled DragDrop and byte comparison in §26; repair package-only baseline methodology |
| IA-04 | P2 | `projects/ui-core/QUALITY_STATUS.md:7–15,24–38,66`; current support/coverage presentation contradicts actual checkpoint; documentation only |
| IA-05 | P3 | RECLOSEOUT-02 Calendar wording vs actual `aria-pressed`/no clear-preset API; report precision only |

Existing coverage, ATTW, Showcase and browser/tooling debts are explicitly classified in §46 rather than disguised as fresh runtime findings. CascadeSelect rAF and filtered browser-error assertion concerns are limited hardening observations, not fabricated reproduced failures.

## 49. Required remediation

Before a new unconditional final technical acceptance:

1. Authorize a **focused RichTextEditor remediation** for IA-01. Preserve safe decoded attribute values while retaining URL/tag/attribute security policy and deterministic SSR output. Do not fix this by blindly allowing unsafe protocols or bypassing sanitization.
2. Add independent assertions for named/numeric entities, query-bearing links, title/alt, insertion, applied value and repeated native input/HTML round-trip; verify actual browser `.href`/parameters, not only matching escaped source strings. Include idempotence where sanitization has reached canonical output.
3. Reproduce SSR and real post-hydration editing for that case and rerun proportionate forms/RichText tests and affected product gates. A green suite without the counterexample is insufficient.

Separately repair IA-02/IA-03 evidence harnesses before relying on them for future byte gates, and correct active status documentation through an authorized documentation change. These P2 items do not justify unrelated runtime optimization. Keep strict ATTW and coverage explicitly failed/classified until separately resolved; do not lower thresholds or suppress new categories to obtain a green label.

No remediation was implemented here. No need to reopen Calendar/Tree remediations, Table/TreeTable architecture, approved P2/P3 exclusions or Showcase within the minimal IA-01 scope.

## 50. Final recommendation

**N2 FINAL AUDIT — REMEDIATION REQUIRED**

One concrete P1 safe-value corruption outweighs the otherwise reproducible green build, 2,500-test suite, supported package consumer, SSR imports and sampled hydration results. Root-unused is independently 0 B; its existing harness and Tree bundle methodology still require honest evidence corrections. Strict ATTW and coverage remain failed and classified, not approved.

Deliver only this report for review. Runtime/tests/config/snapshots unchanged; no commit or external publication; foreign TreeTable file preserved exactly. Do not begin Showcase, release work or a subsequent roadmap phase as a consequence of this audit.
