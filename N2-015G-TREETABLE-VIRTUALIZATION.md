# N2-015G — NeuTreeTable 2 fixed-height hierarchical virtualization

## 1. Status

`READY FOR N2-015H`.

## 2. Starting checkpoint

N2-015F was committed first as `cd9f4b49538522df2f3708bbe031123b4056c038` (`feat(tree-table): implement N2-015F remote state machine`), whose exact parent is `fd025149d2c87b59f2b4680f6333c74c67df0136`.

## 3. Scope

G implements fixed-height virtualization over the already computed loaded-visible hierarchy, public `scrollTo()`/`focus()` integration, range presentation, native-table spacers, lifecycle resources, tests, Chromium hydration, performance and bundle evidence. Editing, reorder, export, variable height, backend-global indexes, viewport transport, TreeSelect and N2-011K remain untouched.

## 4. Virtual index domain

Indexes address `projection.visible`: the current depth-first loaded-visible domain after applied query, filter reveal and expansion. Hidden descendants and unloaded backend nodes have no virtual index.

## 5. Loaded-visible semantics

Both client and remote modes use the same local domain. Remote totals never enlarge it and no placeholder nodes are synthesized.

## 6. Fixed item height

`virtualizationOptions.itemSize` is normalized to `1` when non-finite or non-positive. A valid value is used directly and is never written back. Row templates must respect the fixed-height contract; variable measurement is out of scope.

## 7. Visible range

Pure math derives the half-open range `[floor(scrollTop/itemSize), ceil((scrollTop+viewportSize)/itemSize))`, clamped to the loaded-visible length.

## 8. Render range

The render range is the visible range expanded by overscan and clamped to `[0, projection.visible.length)`.

## 9. Overscan

Overscan is an integer `>= 0`; invalid applied values normalize privately to `4` without an output or mutation.

## 10. Spacer model

Top and bottom sizes are `render.start × itemSize` and `(logicalLength-render.end) × itemSize`.

## 11. Native table validity

Spacers are valid `<tr><td></td></tr>` structures inside `<tbody>`. They use `role="presentation"`, `aria-hidden="true"`, have no key, focus, selection or hierarchy semantics, and do not receive delegated row behavior.

## 12. Client virtual tree

The 10,000-row integration fixture mounts 7 rows at the top and 9 in the middle for a 100 px viewport, 20 px items and overscan 2. No hidden 10,000-row DOM remains after measurement.

## 13. Remote-loaded virtual tree

Virtual math consumes only the bounded loaded-visible projection. A backend total of 1,000,000 is benchmarked with a loaded length of 250 and causes no proportional allocation.

## 14. No viewport remote channel

The F union remains exactly `roots | children`. `rangeChange` is local presentation output and virtualization emits zero `dataRequest` events.

## 15. Backend huge totals

Backend totals do not affect offsets, row counts, spacers or allocation. An unloaded remote key remains a safe no-op for `scrollTo({kind:'node'})`.

## 16. Expansion + virtual

Applied expansion changes the visible projection. Range reconciliation uses a semantic-K anchor where retained and recalculates spacers from the new length.

## 17. Collapse + virtual

Collapse never retains hidden descendants as DOM rows. If the anchor disappears, scroll is clamped safely; focus reconciliation continues to use the existing ancestor/next/previous/container policy.

## 18. Query + virtual

An applied query shrink from 10,000 rows to one clamps the window, retains exact-K selection and emits a hierarchy range transition without proposal echoes.

## 19. Selection + virtual

Selection remains applied exact-K state. The offscreen selected key `9999` returns with `aria-selected="true"`; unmount never deselects or creates row-owned selection state.

## 20. Focus + virtual

Semantic focus remains K-based. Passive scroll does not pull the viewport back. If a focused row unmounts, the token survives while one mounted row remains the roving target.

## 21. Keyboard + virtual

Arrow navigation operates on the full logical visible projection. An off-window target is scrolled into range, mounted, then focused once through the existing bounded `afterNextRender` path.

## 22. Home/End

Home targets index 0; End targets the last currently loaded-visible index, never a backend-global total.

## 23. scrollTo

The frozen `node`, `index` and `offset` variants are implemented. Node/index resolution uses exact K or constant-time projection metadata; offsets use fixed-height math. Invalid, unloaded or out-of-range targets are safe no-ops and never request data.

## 24. Public focus method

`focus(first|last|node|cell)` keeps the four-method public surface. For virtual targets it mounts the row first and uses the existing semantic focus path; no API was added.

## 25. ARIA row index

Mounted domain rows expose `aria-rowindex=logicalVisibleIndex+1`, independent of DOM/spacer position.

## 26. ARIA row count

Virtual treegrid `aria-rowcount` is the current loaded-visible projection length only. Backend totals are not presented as a fictitious flattened count.

## 27. Tree ARIA

`aria-level`, `aria-expanded`, `aria-selected`, `aria-posinset` and known `aria-setsize` continue to come from hierarchy/selection projection, not the virtual window.

## 28. Signal graph

Applied inputs → hierarchy/query/selection computed graph → pure virtual window computed → sliced renderer rows. Scroll updates only viewport geometry.

## 29. Writable viewport state

The sole new writable signal is ephemeral geometry `{measured, scrollTop, viewportSize}`. It is not an input mirror or domain owner. Anchor, last published range and resource handles are instance-private ephemeral fields.

## 30. Effects ledger

Exactly four product effects remain: hierarchy diagnostics, focus/projection reconciliation, remote request coordination and viewport lifecycle/measurement. There is no effect per row/range and zero render effects.

## 31. Angular 22 signals-first audit

PASS: zero `@Input`, `@Output`, `EventEmitter`, `model()`, lifecycle methods/interfaces, `NgZone`, `ChangeDetectorRef`, Zone.js, Forms/CVA, Subjects or writable applied-state mirrors.

## 32. Signal query

The viewport is obtained with `viewChild<ElementRef<HTMLElement>>('viewport')`; no legacy view lifecycle hook is used.

## 33. Scroll resource

One passive scroll listener is installed per enabled browser instance and removed on cleanup. There are no row or global listeners.

## 34. ResizeObserver

At most one observer measures the viewport; there is no observer per row. It is disconnected on cleanup.

## 35. rAF

Scroll/resize work is coalesced behind at most one pending animation frame. Cleanup cancels the pending frame.

## 36. Recompute evidence

The benchmark records `scrollQueryExecutions=0` and `scrollHierarchyExecutions=0` across 1,000 scroll calculations. Only the cached projection slice/window changes.

## 37. Exactly-once

Range output is deduplicated by visible range, render range and deterministic presentation revision. Existing query, expansion, selection and remote outputs remain exactly-once in Chromium hydration.

## 38. Immutability

No mutation occurs to T, hierarchy, roots, children, query, expanded keys, selection, columns or options. Virtual slicing and proposals are immutable.

## 39. SSR

With no geometry, virtual mode deterministically renders the complete applied loaded hierarchy. There are zero server listeners, observers, frames or requests.

## 40. Hydration

Real Chromium reuses the SSR table/head/retained first virtual row with zero NG050x, then safely activates the measured bounded window without initial focus stealing.

## 41. Remote hydration

Satisfied roots/children still emit zero duplicate requests; the unsatisfied-root and accepted-child cases remain exactly the F state machine. Virtual activation emits zero transport requests.

## 42. Static a11y

PASS: one roving target, logical row indexes, loaded row count, hierarchy/selection semantics, `aria-hidden` presentation spacers and no selectable/focusable spacer.

## 43. Browser a11y

Chromium covers hydrated top and middle windows, logical indexes, bounded rows, semantic focus transitions and preserved controlled expansion/selection/query behavior. No axe claim is made.

## 44. DOM bound client

The 10k Angular fixture observed a maximum of 9 mounted domain rows with its 100 px/20 px/overscan-2 geometry. The 640 px/32 px/overscan-6 benchmark bound is 32.

## 45. DOM bound remote-loaded

The remote-large-total benchmark uses only 250 loaded-visible nodes and the same bounded range math; metadata total 1,000,000 causes no rows/placeholders.

## 46. Expansion stress

The 100-child projection-length transition has p50 `0.000417 ms`, p95 `0.000500 ms` for range normalization/slicing math. B–F expansion behavior remains covered.

## 47. Selection stress

Offscreen/return selection is verified through applied K state. No retained per-row component state exists.

## 48. State side effects

Virtualization emits no query, expansion, selection, layout, edit, export or data request. Only deduplicated `rangeChange` is new runtime behavior.

## 49. Projection revision and anchor

A deterministic fingerprint of hierarchy revision plus the loaded-visible K/path sequence changes on expansion/query/hierarchy transitions. Anchor restoration uses K and intra-item offset, never a stale index.

## 50. Virtual engine

The framework-free private engine owns normalization, half-open range math, overscan, spacers, clamping and index/offset conversion. It imports no Angular or DOM APIs.

## 51. Range performance

Stored p50/p95: 1k `0.000500/0.000584 ms`; 10k `0.000459/0.000583 ms`; 100k `0.000459/0.000625 ms`.

## 52. Scroll performance

1,000 range updates: p50 `0.000459 ms`, p95 `0.000583 ms`; zero query/hierarchy execution.

## 53. Render-window performance

10k slice/window update: p50 `0.000459 ms`, p95 `0.001041 ms`.

## 54. Query performance

10k explicit query/filter plus window normalization: p50 `0.065167 ms`, p95 `0.151166 ms`, measured separately from scroll.

## 55. Remote-loaded performance

Loaded-250/backend-total-1M math: p50 `0.000375 ms`, p95 `0.000458 ms`.

## 56. Lifecycle

The integration gate creates/destroys 100 real virtual components and verifies 100 listener removals and 100 observer disconnects. The stored 100-cycle pure resource-state metric is p50 `0.000042 ms`, p95 `0.000625 ms`.

## 57. Resource census

Per enabled instance: 1 passive viewport listener, 0/1 ResizeObserver, <=1 pending rAF, 2 pre-existing bounded query timers only when used, 0 subscriptions, 0 row observers and 0 global persistent listeners.

## 58. Candidate tests

PASS: 71/71 across 8 files after adding virtual math, 10k DOM, query shrink, selection return, programmatic focus/scroll and 100 lifecycle coverage. B–F tests are preserved.

## 59. Legacy regression

PASS: TreeTable 1.x remains 76/76 across 3 files and is unmodified.

## 60. Contract and package gates

PASS: positive/negative types; 4/4 contract tests; 42/21/8 ledger; boundary/signals-first audit; production build; publint; ATTW; package verification (431 files). Only the pre-existing unrelated Menu NG8102 warnings remain.

## 61. API surface

Unchanged and exact: 66 public types, 11 directives, 1 component, 22 inputs, 12 outputs and 4 methods. `dataRequest` remains `roots | children`.

## 62. Bundle

G BASIC/client virtual/remote-loaded virtual: `99,991 B raw / 20,053 B gzip / 16,950 B Brotli`. Combined/templates: `100,492 / 20,228 / 17,087 B`. Root-unused remains `0 B raw`; optional chunks remain empty.

Against F BASIC (`90,344 / 18,136 / 15,316 B`), G adds `9,647 raw / 1,917 gzip / 1,634 Brotli`, attributable to pure virtual math, viewport lifecycle, K-anchor/focus bridging, spacer/ARIA template and styles. The dependency graph has no forbidden edge.

## 63. Git diff and hygiene

The diff is limited to the candidate renderer/facade, private virtual engine, directed fixtures/tests/scripts, baselines and this report. `git diff --check` passes; no symlink or temporary hydration/build directory is added. G remains uncommitted for review.

## 64. Risks

Fixed-height templates must honor `itemSize`. SSR intentionally renders the complete loaded hierarchy until browser measurement; very large SSR-loaded trees therefore trade deterministic hydration for larger server HTML. Remote direct-to-unloaded-key scrolling remains unsupported by design.

## 65. Recommendation

`READY FOR N2-015H`.

Do not start N2-015H and do not resume N2-011K in this phase.
