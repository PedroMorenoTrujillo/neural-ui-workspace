# N2-C6 — NeuTree 2 rewrite and certification

**Current result: C6 COMPLETE — READY FOR FINAL N2 CLOSEOUT.** The original first-gate STOP and its evidence remain below as history. The normative resolution and the resumed execution/certification appendix supersede its provisional recommendation; no successor work was started.

## 1. Status

**Historical first-gate result: NEEDS DESIGN REVIEW.** The mandatory first gate stopped C6 before runtime. The later normative resolution (§59) authorized the resumed implementation documented after it.

## 2. Scope

Read-only audit of NeuTree, its current consumers, N2 ownership, the TreeTable 2 and TreeSelect contracts, and the current generated bundle. No VirtualList, Table, TreeTable, TreeSelect, shared primitive, or package runtime was modified.

## 3. Starting checkpoint

Branch `v2`, HEAD `390fa4fb02a09ea37b774a339ae249b967093641` (`feat(kanban): implement N2-C5 controlled board dnd`). The tracked tree and staging were clean before this report; the sole foreign untracked file was `projects/ui-core/tree-table/public_api 2.ts`.

## 4. Legacy baseline

`projects/ui-core/tree/neu-tree.component.ts` is 920 lines. The directed legacy Tree spec passes **33/33**. Current compiled Tree FESM is 62,104 B raw / 10,179 B gzip / 8,727 B Brotli; this is an artifact size, not an isolated consumer bundle.

## 5. Product definition

C6 targets one independent `<neu-tree>` hierarchical collection. It must not become TreeTable, TreeSelect, a file manager, a backend cache, or a facade over either certified component.

## 6. Legacy API inventory

The barrel re-exports ten types/interfaces, one `NeuTreeNodeDirective`, and one `NeuTreeComponent<T>`. The component has **25 inputs**, **7 outputs**, and **27 callable public methods** beyond its constructor, mostly template/DOM handlers rather than justified consumer commands. The current outputs are `selectionChange`, `expansionChange`, `nodeClick`, `lazyRequest`, `contextRequest`, `virtualRangeChange`, and `nodeDrop`. The single template directive is `neuTreeNode`; its context carries a legacy node plus level, selection, partial, expansion, loading and callbacks. The node shape includes nested `children`, `expanded`, `leaf`, `loading`, `disabled`, `draggable`, `droppable`, and optional domain `data`.

### Mandatory first design gate (A–M)

| Decision | Evidence | Result |
| --- | --- | --- |
| A. Canonical hierarchy | Legacy Tree nests `NeuTreeNode<T>.children`; certified TreeTable separates `data` from parent-owned root/child relations; TreeSelect has its own nested node contract. None freezes the C6 representation. | **OPEN** |
| B. Stable K | Legacy exposes string `id` on a wrapper, not `NeuTreeComponent<T,K>` or an approved `T → K` accessor. Exact-K domain and duplicate policy for C6 are not frozen. | **OPEN** |
| C. Roots/children ownership | Legacy `nodes` owns nested roots/children; TreeTable uses separate applied relations with remote states/revisions. The C6 owner and shape are not chosen. | **OPEN** |
| D. Expansion ownership | N2 taxonomy and C6 require applied `expandedKeys` plus a proposal, but legacy also has `node.expanded` and a writable fallback. Removing that second owner is clear; the final C6 input/output shape and lazy acceptance correlation are not. | **PARTIAL** |
| E. Selection ownership | Parent-owned selection by K is required; legacy emits `NeuTreeNode<T>[]` and has an internal selected-key fallback. Final modes/value/output shape are not frozen. | **PARTIAL** |
| F–G. Propagation/partial | Legacy, TreeTable and TreeSelect have related but not identical loaded-subtree and incomplete-child policies. C6 does not select one. | **OPEN** |
| H. Disabled | Legacy blocks toggle/action and skips disabled nodes in propagation; exact focus, expansion, direct selection, descendant-boundary and applied-disabled-key policies remain unfrozen for C6. | **OPEN** |
| I. Lazy request | Legacy emits `{node, reason, requestId}` immediately on expansion proposal and deduplicates by object identity. C6 requires request after parent acceptance, but no C6 request/response/currentness contract exists. | **OPEN** |
| J. Filter/search | Legacy local query matches label/description/badge and clones ancestor paths with `expanded:true`. C6 has no frozen search field domain or remote/partial semantics. | **OPEN** |
| K. DnD/reorder | Legacy has cross-tree before/inside/after `nodeDrop` with DOM event and shared DnD directives; neither C6 P1 retention nor a controlled proposal is approved. | **OPEN** |
| L. Focus/keyboard | Existing shared navigation controller implements node focus/RTL/typeahead, while C6 prefers row/node focus. Final activation versus selection, disabled-focus and interactive-descendant policies are not frozen. | **PARTIAL** |
| M. Shared hierarchy | TreeTable's hierarchy engine is private to its facade; the workspace also has object-identity traversal and navigation internals. No C6 neutral extraction/semantic match is approved. | **OPEN** |

The first gate therefore fails on material public and ownership choices. TreeTable and TreeSelect certifications do not implicitly authorize copying either facade's API into Tree.

## 7. Identity

Legacy gestures and navigation use string `node.id`, but traversal also indexes node object references; lazy dedupe uses the object itself. C6 requires a stable K independent of reconstructed T. Exact K type/accessor and duplicate diagnostic/output must be frozen before replacing these paths.

## 8. Hierarchy model

The legacy nested wrapper is not a clean domain `T` model. TreeTable 2's separate relation model is a plausible candidate, not an approved C6 choice. Supporting both as equivalent public owners would violate the authorization.

## 9. Roots/children

Legacy roots are `nodes: NeuTreeNode<T>[]`; children are embedded in each node. Its `leaf:false` denotes lazy expandability, and `loading`/`loadingKeys` are separate signals. A C6 applied relation must distinguish loaded empty, unloaded, loading and error if lazy P1 is retained; its exact owner/shape is undecided.

## 10. Malformed/cycles

The current internal iterative traversal bounds cycles/shared references by object identity. Tree additionally records duplicate string IDs for DnD rejection, but does not expose a complete C6 key-based policy for duplicate references, parentage, missing nodes, or orphans. No consumer data was changed in this audit.

## 11. Expansion

Legacy `toggleNode` writes an internal set when `expandedKeys` is absent, emits `expansionChange`, then can request lazy children before parent acceptance. The C6 applied/proposal split is required, but its final naming, requiredness, and treatment of legacy `node.expanded` need a normative contract.

## 12. Selection

Legacy offers single/multiple/checkbox and emits node objects, with an internal selected-key fallback. C6 requires K-based parent-applied selection; precise mode/value/proposal types are not frozen.

## 13. Propagation

Legacy checkbox selection traverses loaded descendants, skips disabled nodes, then reconciles ancestors. TreeTable P1 uses loaded-subtree only; TreeSelect supports independent/propagated. Whether C6 exposes one strategy or several is a product decision, not an implementation detail.

## 14. Indeterminate

Legacy derives checked/mixed/unchecked from loaded selectable children. TreeTable treats unknown/partial children as mixed rather than complete. C6's unloaded-child and applied-selected-parent cases need one precise rule; no independent partial owner is authorized.

## 15. Disabled

Legacy `disabled` blocks activation, expansion and selection; disabled descendants are traversal boundaries during propagation. It also makes a node `aria-disabled`, but C6 has not frozen whether disabled nodes remain keyboard-focusable or how applied disabled selections are presented.

## 16. Lazy children

Legacy lazy is active only for `leaf:false` with no children and not loading. The current request fires on proposal, which conflicts with C6 acceptance-first. No C6 roots/children relation or retry policy has been approved.

## 17. Request model/currentness

The legacy request has an incrementing ID but no tree/query revision or relation correlation; pending dedupe keys to the same node object. C6 needs a data-oriented request and stale-response policy before implementation. It must not own backend responses/cache or start HTTP.

## 18. Filter/search

Legacy search is local, case-folded label/description/badge matching with ancestor paths. The projection clones wrappers and transiently sets `expanded:true`. C6 must decide search fields, loaded-only versus remote semantics and computed reveal behavior; it must not write applied expansion.

## 19. Sorting

Legacy Tree has no sort input/output or sorting engine. No C6 P1 sort target is documented; do not add one without authorization.

## 20. Visible projection

Legacy computed state projects a cycle-safe nested copy, filters, then flattens visible expanded nodes with level/parent/posinset/setsize. C6 needs a pure exact-K projection after the hierarchy model is frozen.

## 21. Virtualization decision

Legacy has fixed-row virtual inputs and `virtualRangeChange` over flattened visible nodes. The portfolio mentions lazy/virtual interaction, but C6 does not explicitly freeze whether virtualization remains P1 or its range/scroll contract. NeuVirtualList facade must not be imported or modified.

## 22. DnD/reorder decision

Legacy uses `@neural-ui/core/drag-drop`, before/inside/after targets, cross-tree scopes, cycle prevention and `nodeDrop` carrying nodes and original DOM event. A key-based controlled proposal and P1 retention are not frozen; it cannot be copied unchanged.

## 23. Context/actions

Legacy `nodeClick` and `contextRequest` exist; the latter includes `originalEvent`. Whether C6 retains a domain action, a context intent, both or neither is open. Tree must not become a Menu facade.

## 24. Templates

One `neuTreeNode` template exists. C6 may retain a strongly typed node context, but whether it supplies domain T, key, presentation metadata and callbacks depends on the hierarchy/selection contract. No `TemplateRef<any>` target was added.

## 25. Focus

Legacy uses `NeuTreeNavigationController` and post-render DOM focus by index. C6 focus should be ephemeral and keyed by K; restoration on collapse/filter/reconstruction/removal needs a frozen rule. The controller was not modified.

## 26. Keyboard

Legacy handles arrows, Home/End, typeahead and activation through the shared controller, plus context-menu keys. C6's exact Space/Enter/action/selection and interactive-descendant policy is undecided.

## 27. Accessibility

Legacy renders `tree`/`treeitem`/`group` and level, sibling position/size, expanded, selected/checked, disabled and busy state. A C6 semantic tree is feasible, but unknown remote sibling counts and focus versus selection require the approved relation/selection policy.

## 28. Signal graph

Current inputs feed computed projections, but one product `effect()` synchronizes `nodes` into writable expansion/selection mirrors and prunes pending lazy state. That effect must not survive a controlled C6 architecture.

## 29. Writable state

Current `internalExpandedKeys` and `internalSelectedKeys` are domain mirrors. `searchQuery`, virtual scroll and navigation/focus are local UI state. C6 may keep only genuinely ephemeral state after the public owners are frozen.

## 30. Effects ledger

Legacy has **1 `effect()`** for input-to-writable synchronization and **1 `afterRenderEffect()`** for navigation/focus and checkbox tabindex patching. No C6 effect budget is implemented or claimed.

## 31. Listener/resource ledger

No component-owned subscription, document listener, observer, timer or rAF call appears in the Tree source. Shared DnD directives manage their own interaction resources; their C6 retention is undecided. `afterRenderEffect` currently performs DOM queries each render.

## 32. Immutability

The legacy API accepts mutable node/children arrays; its filter/cycle projections clone some wrappers. C6 must require readonly applied shapes and avoid mutation, but the final types cannot be written before the hierarchy contract.

## 33. Exactly-once

Legacy outputs and tests are not a C6 exactly-once matrix. In particular lazy request occurs before expansion acceptance. Expansion, selection, lazy, action/context and possible reorder counts must be specified against parent rejection and hydration.

## 34. Recomputation

The existing flatten/navigation computed chain depends on visible projection and expansion; post-render focus reconciliation reads it. No C6 instrumentation was run before the design gate. The future implementation must separate focus traversal from full hierarchy/filter recomputation where possible.

## 35. SSR

The compatibility fixture imports and renders current Tree. No new C6 SSR run or certification was performed; the future server must render only applied state without browser side effects or lazy requests.

## 36. Hydration

Current Tree appears in the compatibility hydration fixture. No C6 Chromium run was performed. Acceptance-first expansion and request correlation must be frozen before the exactly-once hydration test.

## 37. Zoneless

The workspace target is Angular 22 `provideZonelessChangeDetection()`. No C6 zoneless implementation or gate was run.

## 38. Performance legacy

The 33-test directed baseline passed. No comparable 1k/10k/deep/interaction timing was captured: the first design gate stopped before a C6 benchmark harness or test fixture was introduced. Do not present the FESM size as performance evidence.

## 39. Performance final

Not run; no final runtime exists. The required 1k/10k/deep/expand/selection/filter/keyboard/lazy p50/p95 matrix remains a C6 implementation gate after normative resolution.

## 40. Lifecycle

No C6 100-cycle lifecycle stress was run. Existing Tree's local source has no direct listener/observer/timer calls; DnD and render-focus lifecycle still require verification if retained.

## 41. Bundle legacy

Reproducible esbuild consumer harness against current generated package, Angular/CDK/RxJS/neural-icons externalized: basic Tree import/export **71,942 B raw / 15,620 B gzip / 13,790 B Brotli**; Tree plus template directive **71,968 / 15,631 / 13,814**. The standalone Tree FESM artifact is recorded in §4. These are local baselines, not product-size claims.

## 42. Bundle final

Not measured; no C6 code exists. The final basic/expanded/selection/lazy/rich matrix must be measured against this baseline after the target is frozen.

## 43. Root-unused

The same esbuild harness importing but not using Tree from the root entrypoint retains **0 B raw** Tree input. This is only the legacy baseline; final C6 must recheck.

## 44. Dependency graph

Legacy Tree imports Angular common/core, Neural Checkbox, Input, shared DragDrop directives and internal traversal/navigation. It has no direct Router, Forms/CVA, HTTP, storage, Table, TreeTable, TreeSelect, VirtualList or CDK import in its source. No facade edge was added.

## 45. Public API redesign

Provisional classification only: legacy `nodes`, `selection`, `expandedKeys`, `lazyRequest`, `nodeDrop`, virtual controls and context payload need **CHANGE/REMOVE/OUT-OF-SCOPE** decisions; template/label inputs need **KEEP/CHANGE** review; the 27 public helper/DOM methods are candidates to **INTERNALIZE**. No `DEPRECATE` target. Final surface is intentionally not invented here.

## 46. Legacy tests

All **33/33** current tests pass. Rendering, keyboard/focus, expansion, selection/partial, lazy, filter, virtual, disabled, DnD and malformed-safety behaviors require KEEP/MIGRATE/OUT-OF-SCOPE classification once C6 P1 scope is frozen. Tests directly invoking public handlers do not authorize retaining them as public API.

## 47. C6 tests

Not created; no runtime or types were changed after the first-gate STOP.

## 48. NeuTreeTable regressions

Not triggered: no shared primitive or TreeTable file was touched. Its private hierarchy engine must not be moved merely for DRY.

## 49. Full suite

Not rerun for a read-only audit/report. The last C5 checkpoint recorded 2487/2487; this report does not claim a new full-suite PASS.

## 50. Build/package

No C6 build, pack, package verification, public-import or npm-installed consumer gate was run. The existing generated package was used read-only for the baseline. All mandatory final gates remain pending after design resolution.

## 51. ATTW classification

No C6 ATTW run. The previously documented Sass `styles` unfiltered-ATTW debt is unrelated and was not modified or claimed fixed.

## 52. Browser verification

No C6 Chromium run. SSR/hydration and pointer/keyboard/lifecycle scenarios remain mandatory after implementation.

## 53. Structural visual review

No C6 visual rewrite or review. Existing template has tree/treeitem/group semantics, virtual and nested paths, checkbox, expander and DnD targets; final layout awaits scope decisions.

## 54. Portfolio

Unchanged: **94 public components, 92 complete, 2 pending**. NeuTree remains pending C6; NeuVirtualList remains P3-deferred. No generator or portfolio file was changed.

## 55. Risks and decisions required

Freeze a Tree-specific public contract before runtime: (1) canonical applied domain data/roots/children relation and exact-K accessor/type; (2) selection modes, proposal shape, propagation, partial and disabled boundaries; (3) lazy relation states, request ID/revision/currentness and acceptance-first timing; (4) local/remote search and sibling sort P1 scope; (5) virtual P1 scope and range domain; (6) reorder/context/action P1 status and data-only outputs; (7) node-focused keyboard/activation/focus restoration and template context; (8) whether any existing hierarchy primitive is semantically neutral enough to share without altering certified facades. These are alternatives with materially different APIs; no option was silently selected.

## 56. Git diff

Only this new report belongs to the C6 audit. No Tree runtime, tests, shared internals, package metadata, portfolio or roadmap was modified.

## 57. Git status

Branch `v2`, HEAD remains the C5 checkpoint. This report is untracked and unstaged alongside the unrelated TreeTable file, whose expected SHA-256 is `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`. No commit, push, tag, release or npm publication was performed.

## 58. Recommendation

**NEEDS DESIGN REVIEW.** The first C6 gate cannot pass without a Tree-specific normative resolution of the open hierarchy, identity, selection, disabled, lazy/currentness, filter, virtual and reorder contracts. Do not implement runtime, mark C6 complete, start NeuVirtualList or begin final N2 closeout until those choices are approved.

---

## Normative C6 design-review resolution

The user approved the following Tree-specific contract. The preceding **NEEDS DESIGN REVIEW** remains the historical first-gate result; this resolution removes that blocker and authorizes resuming C6 only.

1. **Generics/K:** `NeuTreeComponent<T, K extends string | number = string>`; exact stable K, never object/DOM/index identity.
2. **Node model:** one lightweight readonly wrapper `{key, data, label, description?, badge?, disabled?}`. Neither T nor this wrapper contains children, expansion, selection, loading, parent or virtual metadata.
3. **Hierarchy relation:** parent-owned `{revision, roots, children}`. One child relation per parent, discriminated `unloaded | loading(requestId) | loaded(keys) | error(requestId?)`. Missing relation is leaf; loaded empty is known-empty leaf.
4. **Ownership:** parent owns nodes, hierarchy, expanded keys, selection and presentation config. Tree owns only focus, typeahead, viewport, temporary DnD and minimal request-coordinator metadata.
5. **Expansion:** applied `expandedKeys: readonly K[]`; `expandedKeysChange` proposes `{keys,key,expanded,source}`. Rejection leaves DOM and remote output unchanged; accepted expansion drives the projection.
6. **Selection:** sole applied discriminated union `none | single(key) | multiple(keys) | checkbox(keys)`. `selectionChange` carries the full proposed value, changed key and source; no node-object-array authority or optimistic selection.
7. **Propagation:** checkbox gestures affect only currently loaded selectable descendants. Newly loaded descendants are not auto-selected; unknown K are never synthesized.
8. **Partial:** checkbox checked requires the node and all known loaded selectable descendants selected with no known-unloaded relation. None selected is unchecked; all other states, including selected known portions with unloaded descendants, are mixed. Partial is computed only.
9. **Disabled:** disabled nodes remain readable, keyboard-focusable and structurally expandable, but cannot be selected by gesture, activated or dragged. A disabled branch is a checkbox-propagation boundary. Applied disabled selections are not corrected.
10. **Lazy:** one `childrenRequest` channel, emitted only after an accepted expansion exposes `unloaded` children; loading does not duplicate. Explicit retry from error is allowed. No HTTP/cache/response owner.
11. **Currentness:** request payload is `{requestId, hierarchyRevision, parentKey, reason:'expand'|'retry'}` with monotonic per-instance IDs. Consumer decides stale/out-of-order responses.
12. **Search:** local loaded-only substring over normalized NFKC/trim/collapsed-whitespace/lowercase label, description and badge. Results are matches plus ancestor paths; reveal is presentation-only and never proposes expansion or requests unloaded children.
13. **Sorting:** out of C6; applied sibling order is authoritative.
14. **Virtualization:** fixed-height P1 over flattened visible loaded nodes only. It is private presentation state, with no backend flat-range request and no public `virtualRangeChange` absent a proven active consumer.
15. **DnD:** same-instance before/inside/after P1 only, cycle-safe and parent-controlled through one data-only `nodeMove` payload. Indices use applied source position and final destination position after source removal. Cross-tree scopes and DOM/CDK event payloads are removed.
16. **Context/action:** DOM-bearing `contextRequest` is removed. One `nodeAction` domain output carries key (and T only if consistent with project convention); Enter activates enabled nodes. Template consumers may compose their own menu trigger.
17. **Template:** one strongly typed `neuTreeNode` context with T, K and readonly computed presentation fields; no mutation callbacks or DOM references.
18. **Focus:** row/node-focused roving tabindex by K. Focus is ephemeral, distinct from applied selection and domain action.
19. **Keyboard/typeahead:** arrows, Home/End, Enter, Space and visible-loaded-label typeahead follow the specified Tree pattern. Disabled nodes stay navigable; interactive descendants retain native keys.
20. **A11y:** semantic `tree/treeitem/group` with ARIA derived from applied/computed state, including checked/mixed and known sibling position/size. No post-render ARIA patch.
21. **Shared primitives:** do not move TreeTable's private engine. Reuse only already-neutral, semantically identical helpers; otherwise use Tree-local pure code. No bilateral extraction.

Final C6 output budget is exactly `expandedKeysChange`, `selectionChange`, `childrenRequest`, `nodeAction`, `nodeMove`. All original verification gates remain mandatory. No commit, C6 successor or NeuVirtualList work is authorized by this resolution.

---

## Resumed C6 implementation and final certification

### Current status, scope, ownership and API

**C6 COMPLETE — READY FOR FINAL N2 CLOSEOUT.** The historical STOP was removed by the approved Tree-specific contract above. The production `@neural-ui/core/tree` entrypoint now has one independent `NeuTreeComponent<T,K>` and the one typed `neuTreeNode` template directive. There is no TreeTable, TreeSelect or VirtualList facade dependency, wrapper, second hierarchy owner, HTTP, Router, storage, Forms/CVA or backend cache. The public Tree facade has 15 inputs, exactly five normative outputs and no public command method. The former 25-input/7-output/27-method Tree API is a major-breaking replacement, not a compatibility layer.

`T` remains consumer domain data. Nodes are readonly `{key,data,label,description?,badge?,disabled?}` records; applied roots and child relations are separate readonly parent inputs. `K` is exact `string | number` identity, including distinct `-0` and `0` tokens. Parent-applied `expandedKeys` and selection never acquire a local mirror. Expansion, selection and movement emit immutable, data-only proposals. Focus, search text, scroll offset, active drag and request dedupe are ephemeral component state only.

### Hierarchy, search, selection and remote lifecycle

The new framework-free engine validates duplicate keys/roots/relations/children, missing references, duplicate parentage, cycles and orphans in deterministic order, then traverses iteratively. Invalid state fails closed to an accessible alert and one deduplicated dev diagnostic; it does not mutate consumer data. The engine passed deep-chain 1,001 and wide-root 10,000 cases. Its flat visible projection preserves applied sibling order and derives level, sibling position/size, expandability, loading and logical visible index.

Expansion reads only applied keys. Rejected gestures leave DOM and requests unchanged. A browser-only coordinator emits one `childrenRequest` for a visibly expanded `unloaded` relation after parent acceptance; `loading` is silent, error supports explicit retry, and hidden expanded descendants remain dormant. Request IDs increment per instance and carry hierarchy revision and parent K. Parent owns responses and stale-response decisions. Search is local to loaded label/description/badge, normalized NFKC/whitespace/case, and reveals only match ancestor paths without writing expansion or requesting hidden children. Sorting remains out of scope.

Selection is exact-K `none | single | multiple | checkbox`; selected/partial state is computed from applied values and loaded relations. Checkbox propagation traverses only known enabled descendants and stops at disabled boundaries, never materializing future keys. Disabled nodes remain focusable and structurally expandable but gestures cannot select, activate or drag them. Parent write/reconstruction updates the DOM without output echoes. Same-instance DnD proposes before/inside/after moves with final-after-removal indices; unsafe cycles, disabled targets, cross-instance payloads and no-ops are rejected. The shared CDK boundary uses a source list per rendered row and ephemeral drag state; an idle inside target cannot mask the source handle. Real pointer movement was verified in Chromium exactly once.

### Renderer, a11y, SSR and resource model

The private template renders a semantic `tree`; non-virtual branches nest their child `treeitem` elements under the parent-owned `group` through a bounded depth of 32. Beyond that bound, remaining visible descendants are flat within the last group with explicit ARIA level/position/set size, preventing DOM recursion overflow. The virtual presentation likewise uses a flat visible window with explicit metadata. Computed treeitems expose expanded, selected/checked/mixed, disabled and busy attributes. Node-focused roving tabindex, arrows/Home/End, RTL direction, Enter action, Space selection, visible-label typeahead and interactive-descendant key isolation are implemented. Nested keyboard events are handled only by the focused treeitem, never echoed through ancestors. Template context is strongly typed and presentation-only; no callback or DOM event leaks into public data contracts. CSS uses logical indentation and reduced-motion/forced-colors handling.

Signals graph: applied inputs → computed hierarchy → computed projection/selection/window → renderer. Product `effect()` ledger is two: deterministic invalid-hierarchy diagnostic and browser request coordination. One `afterRenderEffect()` restores ephemeral focus; it does not patch ARIA or synchronize domain state. The component owns no persistent global listener, observer or subscription. Its transient typeahead timer and focus rAF are cancelled on destruction. Shared CDK directives own their drag lifecycle; 100 browser create/destroy cycles passed.

Real Angular 22.1.6 zoneless SSR/hydration passed: server emitted a loaded nested tree and zero outputs/requests; Chromium reused the same main, Tree, tree container and child DOM nodes with zero NG050x errors. The first lazy expansion proposed once, rejected state issued zero requests, accepted state issued one request, and pointer reorder proposed once without optimistic mutation. The browser gate also covered checkbox mixed/rejection, disabled nodes, nested Enter action, RTL, reconstructed domain rows, loading/error retry, a 375px viewport, a 1,001-deep tree and 100 create/destroy cycles. Desktop and narrow RTL screenshots were inspected for indentation, controls and overflow. Package import and SSR import smoke passed.

### Verification and measurements

| Gate | Result |
| --- | --- |
| Pure + integration Tree | 2 files, 36/36 PASS (18 pure, 18 component; includes 1,001-deep DOM and 100 interaction cycles) |
| Type + C6 contract gates | PASS; readonly exact-K and exactly five outputs |
| Full library unit suite | 186/186 files; 2,490/2,490 PASS; no global coverage run |
| Build / package verification | PASS; 431 package files verified |
| npm package archive | PASS; 431 files, 1,300,832 B; temporary tarball removed |
| Package audit / public contract audit | PASS; 97 entrypoints, 808 declarations, 1,461 bindings |
| Final entrypoint imports / Angular consumer | 97 imports PASS; real Angular 22.1.6 consumer build/SSR PASS |
| Chromium SSR/hydration/zoneless | PASS; DOM reuse, 0 NG050x, first interactions exactly once, 100 lifecycles |
| Bundle root-unused | 0 B raw Tree retained |
| Git whitespace and foreign-file hygiene | `git diff --check` PASS; foreign TreeTable SHA-256 unchanged |

The new Tree directed suite replaces the 33/33 legacy tests with 36/36 C6 pure/integration tests (net +3); the final full-suite total is 2,490. Browser pointer/lifecycle and compile-only contracts add verification outside the unit count. Contract snapshots and reconciliation were regenerated by the official script, not edited manually. The consumer fixture was migrated to the new applied hierarchy without changing other facades.

The reproducible esbuild consumer matrix (Angular/CDK/RxJS/neural-icons externalized) is: basic **53,135 B raw / 11,312 B gzip / 10,026 B Brotli**, rich with template directive **53,161 / 11,323 / 10,035**, root-unused **0 B raw**. The legacy basic comparator was **71,942 / 15,620 / 13,790**. The reduction is not a browser-performance claim. The shared DnD boundary remains in basic because one facade supports reorder at runtime; no Table/TreeTable/VirtualList/Menu FESM is pulled into the isolated Tree bundle.

Reproducible Node pure-engine benchmarks, p50/p95 milliseconds (not browser render): 1k normalization **0.334/0.504**, flatten **0.050/0.210**, search **0.185/0.296**; 10k wide normalization **4.061/5.996**, flatten **0.511/0.831**, search **1.921/2.188**; deep 1,001 normalization **0.413/0.809**, flatten **0.096/0.238**. For one root plus 100 children, accepted expansion projection is **0.015/0.020**, collapsed projection **0.0004/0.0004**, and move proposal **0.0003/0.0003**. The benchmark script prints fresh environment-specific values and allocation is bounded to nodes/relations, model maps, projected rows and the mounted virtual window; it has no backend-total allocation.

The component stress fixture performed 100 cycles each of expansion/collapse, selection toggles, keyboard traversal and lazy open/cancel. Its jsdom interaction timings (p50/p95) were **2.902/4.782 ms** for keyboard traversal and **0.104/0.318 ms** for lazy open/cancel. These are test-environment observations, not browser responsiveness claims.

Portfolio generation now reports **94 public components = 93 completed + 1 pending (NeuVirtualList P3)** and zero active implementation batches. This is a C6 status update only; NeuVirtualList runtime and final closeout are untouched. Strict global entrypoint/Showcase audit still reports the historical missing demo pages and is not declared PASS; package/contract/import gates above passed. The previously documented unfiltered ATTW Sass `styles` issue remains an external debt, not changed by C6. No global coverage threshold, Showcase demo, unrelated component or dependency was modified to force a green result.

### Git review, risks and recommendation

Diff scope is Tree runtime/styles, Tree-specific engine/types/tests/gates, the migrated compatibility fixture, officially generated public contracts, portfolio/roadmap status, package test scripts and this report. No generated `dist`, tarball, temporary hydration directory or symlink is tracked. The unrelated untracked `projects/ui-core/tree-table/public_api 2.ts` remains byte-identical (`c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`) and unstaged. Branch remains `v2` at starting HEAD `390fa4fb02a09ea37b774a339ae249b967093641`; C6 changes are uncommitted for review. No push, tag, release or npm publication occurred.

Residual limits are intentional: local loaded-only search, fixed-height visible-node virtualization, no sorting, no cross-tree DnD, and parent-owned remote staleness policy. The known Showcase/strict ATTW debts are outside C6. **Recommendation: C6 COMPLETE — READY FOR FINAL N2 CLOSEOUT.** Do not start NeuVirtualList or final closeout automatically.
