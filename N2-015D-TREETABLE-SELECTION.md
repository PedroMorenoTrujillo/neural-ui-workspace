# N2-015D — NeuTreeTable 2 selection and loaded-subtree propagation

## 1. Status

**READY FOR N2-015E**. N2-015D implements controlled exact-K selection without resuming N2-011K or starting query, remote, virtualization, editing, reorder, export, TreeSelect, or N2-015E runtime.

## 2. Starting checkpoint

`097d860ab001cf190425215e4e28cf995e2200be` — `feat(tree-table): implement N2-015C expansion keyboard focus` on branch `v2`.

## 3. Scope

Implemented only selection modes, immutable proposals, native indicators, loaded-subtree propagation, disabled boundaries, derived aggregation/indeterminate state, controlled acceptance, keyboard Space, SSR/hydration evidence, bundle and performance baselines.

## 4. Selection owner

`selection` remains a parent-owned applied input. NeuTreeTable never writes or mirrors it; `selectionChange` is the sole proposal output.

## 5. Selection contract

The frozen `NeuTreeTableSelection<K>`, `NeuTreeTableSelectionOptions<T>` and `NeuTreeTableSelectionChange<T,K>` contracts are used unchanged. No public symbol, input, output, method, directive or entrypoint was added.

## 6. Exact-K

Membership uses `neuExactKeyToken`; numeric `1` and string `'1'` remain distinct. T identity, DOM identity and flattened indexes never determine selection.

## 7. Modes

`none`, `single`, `multiple` and `checkbox` are executable. Single honors radio/no-indicator and `allowClear`; multiple/checkbox honor row-click, replace/platform/toggle modifiers, visible range, indicator and toggle-all scope.

## 8. Pure engine

`internal/selection/neu-tree-table-selection.ts` is framework-free. It derives loaded/visible indexes, membership, subtree candidates, disabled boundaries, aggregation, indeterminate state, scope toggles and immutable proposals from the normalized hierarchy.

## 9. Single

Single proposals select exactly one enabled semantic K, may clear only when configured, and preserve pre-applied disabled keys instead of silently correcting consumer state.

## 10. Multiple

Multiple selection supports replacement, platform additive toggle and explicit toggle. Range uses the applied visible sequence and never DOM indexes.

## 11. Checkbox

Checkbox mode uses native checkbox controls inside the tree column and the same pure proposal engine. No FormsModule, CVA, `ngModel`, per-row component or per-row listener exists.

## 12. Loaded-subtree

Propagation walks only reachable loaded nodes from the applied hierarchy. It includes collapsed loaded descendants, never fabricates unloaded keys and never allocates from backend totals.

## 13. Parent

A parent gesture applies the same select/deselect intent to its enabled loaded subtree. Partial or unloaded relations remain bounded to the keys already present.

## 14. Child

A child may be selected independently. Ancestors are recomputed for presentation; selection keys are not secretly rewritten beyond the explicit proposal and configured downward propagation.

## 15. Ancestor aggregation

Bottom-up iterative aggregation records selectable/selected counts and completeness for each loaded node. It is derived state only and does not emit or mutate applied selection.

## 16. Indeterminate

No loaded selection is not mixed; partial loaded selection is mixed; a fully selected complete loaded subtree is checked; any selected subtree with unknown/partial/unloaded descendants remains mixed.

## 17. Disabled

Disabled gestures are no-ops. A disabled node is a traversal and aggregation boundary, applied disabled keys remain applied, and independently reachable enabled descendants can still be selected directly.

## 18. Partial

Partial relations aggregate only their loaded keys and retain `complete=false`; they cannot claim a globally checked subtree.

## 19. Unloaded

Unloaded relations never cause enumeration, request, cache expansion or symbolic selection. Selected loaded content under an incomplete relation renders mixed.

## 20. Collapsed

Collapsed presentation does not change selection math: the engine uses the normalized loaded hierarchy, while range and visible toggle-all deliberately use the visible sequence.

## 21. Expansion coexistence

Expansion and selection remain independent controlled channels. Expander clicks do not select; selection gestures do not propose expansion; hidden selected descendants remain applied.

## 22. Presentation/ARIA

Rows expose `aria-selected`; multi/checkbox modes expose `aria-multiselectable`; native inputs expose deterministic `aria-checked`, including `mixed`. The selection technical UI is not a domain column.

## 23. Keyboard

Space on a row produces exactly one keyboard selection proposal. Native checkbox/radio descendants retain their native interaction and are excluded from the row keyboard handler. Enter remains reserved for the later frozen row-action/edit phase.

## 24. Focus

Selection gestures preserve the C row-focus contract. The only D writable focus-adjacent value is a private range anchor K; it is ephemeral interaction state, not applied selection.

## 25. Accept/reject

Rejected proposals leave `selection`, row ARIA and native checked state equal to the applied input. Accepted proposals render only after the parent writes the new selection; that write produces no echo.

## 26. Parent writes

Reconstructed selection arrays, data objects and hierarchy records recompute from semantic K. No output is emitted merely because the parent replaces an applied value.

## 27. Exactly once

Directed integration and Chromium hydration cover checkbox, row click, keyboard and toggle-all once per gesture. Native input bubbling is handled by the single delegated table click boundary and cannot invoke a second row proposal.

## 28. Immutability

Frozen selection/options fixtures remain unchanged. Proposals allocate new arrays/snapshots and never mutate T, hierarchy relations, roots, selection keys or projection nodes.

## 29. Signal graph

Applied inputs → computed hierarchy projection → computed selection model → private renderer. Gesture intent → pure proposal → `selectionChange`. There is no synchronization effect.

## 30. Writable state

D adds only a private ephemeral selection-anchor signal. There is no local applied selection, selected-key mirror, subtree cache or writable hierarchy owner.

## 31. Effects ledger

Unchanged from hardened C: exactly two justified product effects, diagnostic emission and focus reconciliation. D adds zero effects and zero render effects.

## 32. Angular audit

Boundary audit passes with zero lifecycle methods/interfaces, `@Input`, `@Output`, EventEmitter, `model()`, NgZone, ChangeDetectorRef, Zone.js or Forms dependencies. One delegated click, focus and key boundary remains.

## 33. SSR

The real Angular 22 server render includes treegrid selection semantics, native controls, selected/mixed state and zero selection/request outputs. No browser selection API is evaluated on the server.

## 34. Hydration

Real Chromium reuses the table/head/rows, reports zero NG050x, emits no hydration echo, rejects the first selection proposal without DOM drift, accepts the next exactly once, and emits zero data requests.

## 35. Zoneless

Candidate, unit and hydration fixtures use `provideZonelessChangeDetection()` with no Zone.js or manual detect/mark architecture in product runtime.

## 36. Static a11y

The boundary gate requires native checkbox/radio indicators, `aria-selected`, `aria-multiselectable`, `aria-checked`, one toggle-all control and no row-level event listener.

## 37. Browser a11y

Browser integration verifies selected and mixed states before hydration, native checkbox checked state after rejection/acceptance, disabled controls, treegrid multiselectability and stable row focus.

## 38. 1k performance

Membership/aggregation p50/p95: **0.3089/0.3718 ms**. Leaf toggle p50/p95: **0.1353/0.1990 ms**.

## 39. 10k performance

Membership/aggregation p50/p95: **2.3762/2.9452 ms**. Leaf proposal p50/p95: **1.5595/2.1748 ms**. Indeterminate p50/p95: **2.3499/3.0535 ms**.

## 40. Deep/wide

The selection model handles a depth-1,000 chain iteratively and a 10,000-root wide tree. No recursive traversal or stack overflow is used.

## 41. Propagation

100-child propagation p50/p95: **0.0497/0.0621 ms**. Depth-1,000 propagation p50/p95: **0.4680/0.5690 ms**. One hundred repeated propagated proposals: **3.6000/3.8407 ms**.

## 42. Lifecycle

One hundred gestures: **4.9657/5.1890 ms**; 100 selection recomputations: **12.6748/12.9665 ms**; 50 create/destroy cycles: **44.3085/54.8722 ms**. D adds no observer, timer, subscription, per-node listener or cleanup resource.

## 43. Bundle basic

BASIC is **68,247 B raw / 12,772 B gzip / 10,693 B Brotli**. Against C this is +10,953 B raw / +2,569 B gzip / +2,097 B Brotli, attributable to the P1 selection engine, native presentation and proposal plumbing retained by the single facade.

## 44. Bundle selection

Selection and checkbox/propagation consumers each measure **68,247 B raw / 12,772 B gzip / 10,693 B Brotli** because selection is core TreeTable behavior, not an optional public entrypoint.

## 45. Combined

The complete public candidate/template surface is **68,748 B raw / 12,950 B gzip / 10,831 B Brotli**.

## 46. Root-unused

Root-unused remains **0 B raw** (compression container headers: 20 B gzip / 1 B Brotli).

## 47. Dependency graph

Source attribution: renderer 8,178 B; facade 4,854 B; selection engine 4,371 B; hierarchy 3,565 B; template contracts 1,704 B; interaction 1,017 B; neutral resolver 108 B; exact-key helper 47 B. Package imports remain only `@angular/core` and `@angular/common`; forbidden legacy/Table/TableCore/Forms/Router/HTTP/storage/PrimeNG edges are zero.

## 48. Candidate tests

Directed candidate suite passes **30/30**: 8 pure selection tests, 14 renderer/integration tests, 5 hierarchy tests and 3 interaction tests. C had 19 directed tests; D adds 11 selection-specific tests without removing coverage.

## 49. Legacy

Unchanged legacy TreeTable component, hierarchy-controller and template-directive suites pass **76/76**. No legacy runtime or test was edited to accommodate the candidate.

## 50. Contracts

Type fixtures pass (positive consumer plus 11 rejected invalid shapes), contract tests pass 4/4, the 42/21/8 ledger passes and the boundary audit passes.

## 51. Build/package

Production build passes. Publint/ATTW report no package problems; package verification passes for **431 files**. Existing Menu NG8102 warnings remain unchanged global debt.

## 52. API

Exact and unchanged: **66 public types, 11 directives, 1 component, 22 inputs, 12 outputs and 4 methods**.

## 53. Regressions

No regression was found in candidate, legacy, SSR/hydration, zoneless, types/contracts, bundle, performance, build or package gates. No global coverage or full suite was run, per phase policy.

## 54. Risks

Selection is intentionally core and therefore increases BASIC. Incomplete backend relations can only be represented as mixed over loaded data; symbolic remote subtree selection remains explicitly out of P1. Controlled native inputs are restored from the applied state at the delegated event boundary when a parent rejects a proposal.

## 55. Git diff/status

D is intentionally left uncommitted for review. The diff is limited to the candidate selection engine/integration/tests, D bundle/performance/hydration gates, generated D baselines and this report; productive TreeTable, NeuTable, Table/TableCore and package entrypoints remain untouched.

## 56. Recommendation

**READY FOR N2-015E**.
