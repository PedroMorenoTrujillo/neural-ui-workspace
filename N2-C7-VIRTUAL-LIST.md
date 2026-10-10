# N2-C7 — NeuVirtualList 2

## 1. Status

**C7 COMPLETE — READY FOR FINAL N2 CLOSEOUT.** This is the last component implementation checkpoint, not the final N2 certification. No final closeout was started.

## 2. Scope

Only `@neural-ui/core/virtual-list`, its consumer fixtures/tests/contracts, reproducible gates and portfolio status changed. Existing Table, TreeTable, Tree, TreeSelect and other certified runtime is untouched.

## 3. Legacy baseline

At `aa52f09d78341f375d5f4eccf52ebe58b1bc1122` the legacy directed spec passed **26/26**. Its generated VirtualList FESM measured **13,689 B raw / 3,285 B gzip / 2,789 B Brotli** before the rewrite. That is an entrypoint artifact, not a consumer bundle; no pre-C7 basic/root-unused consumer matrix was captured, so no cross-format size improvement is claimed. Legacy SSR was already exercised by the H9 compatibility fixture.

## 4. Product definition

One linear presentation primitive: applied `readonly T[]` → half-open visible range → small rendered window. It is not a data store, listbox, paginator, tree, table or backend adapter.

## 5. Public API inventory

Legacy barrel exported one component; its local row component was not public through the barrel. Component inputs: `items`, `itemSize`, `visibleRows`, `emptyLabel`, `trackBy` (5). Outputs: `rangeChange`, `itemClick` (2). No intentional public product command; `ngAfterViewInit` was a lifecycle method. Legacy row had five private-to-entrypoint inputs. `itemTemplate` was a broad `ContentChild(TemplateRef)`.

## 6. API redesign

Final barrel exports one component, one typed `neuVirtualItem` directive and four types. Component inputs: `items`, `itemSize`, `visibleRows`, required `itemKey`, `emptyLabel` (5). Output: `rangeChange` (1). Method: `scrollTo` (1). KEEP: `items`, `itemSize`, `visibleRows`, `emptyLabel`. CHANGE: `rangeChange` now reports the *visible* range, not CDK's rendered buffer. RENAME/CHANGE: `trackBy` becomes semantic `itemKey`. REMOVE: `itemClick` (consumer template owns actions). INTERNALIZE: CDK row/viewport details. The typed directive replaces the untyped bare template. No DEPRECATE bridge.

## 7. T/K identity

`NeuVirtualListComponent<T,K>` keeps domain T separate from stable `K extends string | number`. Typed key tokens distinguish string/number and signed zero. Reconstruction with the same K preserves tracked DOM identity. Duplicate K is detected deterministically and warned once per stable invalid state in dev; duplicate rows receive index-disambiguated render tracks so rendering remains bounded.

## 8. Data ownership

`items` is a readonly consumer input. C7 never inserts, removes, sorts, pages or caches domain data. Parent replacement immediately determines order and content; no writable items mirror exists.

## 9. Fixed-height model

Vertical fixed item size only. `itemSize` defaults to 48 px and `visibleRows` to 10. Invalid nonpositive/nonfinite size falls back to 1 px; invalid row count falls back to one row. Variable height, horizontal and 2D virtualization remain P3/out of scope.

## 10. Geometry engine

`neu-virtual-list.engine.ts` is framework-free and pure. Its inputs are scroll offset, viewport height, item size/count and overscan; its outputs are visible/render ranges and two spacer heights. Geometry is O(1) in logical count.

## 11. Visible range

`[start,end)` contains items intersecting the viewport. Exact-fit, partial-edge, short-list, empty and beyond-end offsets are clamped. The position is recomputed from ephemeral viewport geometry, never from a backend total.

## 12. Render range

`[start,end)` adds internal overscan to visible rows. Only these applied items are mapped to template contexts, O(rendered window). There is no hidden DOM copy of offscreen data.

## 13. Overscan

The component uses two rows on each side, not a public tuning input. The pure engine bounds any supplied overscan to at most two viewport lengths; an extreme value cannot mount the full dataset.

## 14. Spacers

Top/bottom spacers use deterministic block-size and `aria-hidden="true"`. They are not `listitem`, focus targets or selectable domain items.

## 15. Item template

The standalone `neuVirtualItem` directive exposes typed `$implicit`, `item`, logical `index` and `key`. `[neuVirtualItem]="items"` and optional `[neuVirtualItemKey]="itemKey"` are type-inference witnesses for exact T/K; the latter was compile-checked with numeric `key.toFixed()`. No `TemplateRef<any>`, first/last/even/odd mega-context or default decoration. Primitive fallback text remains available when no template is projected.

## 16. Range output

`rangeChange: NeuVirtualListRange` is data-only. It emits once per *semantic visible-range transition* after browser activation; equivalent items writes or 1,000 scroll events at the same offset do not echo. SSR emits zero.

## 17. Public methods

One command, `scrollTo(target): boolean`; no `scrollToIndex`, `scrollToKey`, raw viewport reference or event handler API.

## 18. scrollTo semantics

`target` is `{index}` or `{key}`, with optional `nearest | start | center | end` alignment. It returns `false` for SSR/inactive instance, empty list, invalid index or unknown key. Already-visible `nearest` is a no-op. First/middle/last and reconstructed same-K cases use the current applied order.

## 19. Key lookup

Key-to-index resolution scans applied items only on a `scrollTo({key})` command. No persistent full-size map is retained. The benchmark shows approximately 0.025/0.030 ms p50/p95 at 1k, 0.267/0.362 ms at 10k, and 3.714/4.090 ms at 100k in Node; those are not browser guarantees.

## 20. Focus/keyboard scope

VirtualList is a layout/presentation list, not a navigable selection widget. It has no roving tabindex or key interception. Consumer controls inside templates own their keyboard behavior and focus.

## 21. Accessibility

The viewport is `role="list"`, mounted items are `role="listitem"`, and each item exposes logical `aria-posinset`/`aria-setsize` despite virtualization. This follows the [WAI-ARIA listitem contract](https://www.w3.org/TR/wai-aria-1.2/#listitem). Empty content is a status message; spacers are hidden from the accessibility tree. RTL needs no horizontal direction math.

## 22. Remote/lazy decision

No remote transport or request output. A consumer may replace its applied list after fetching externally; `rangeChange` communicates viewport position only and never requests or correlates data.

## 23. Infinite loading separation

No infinite-data store, HTTP, hidden cache, loading/retry owner or backend-total allocation was added. Infinite loading is a consumer workflow, not C7 virtualization.

## 24. Empty state

Zero items yields zero mounted domain nodes and zero spacers, with applied `emptyLabel` in a status element. Empty→populated and populated→empty parent writes were tested.

## 25. Signal graph

Applied input signals → pure computed geometry/duplicate diagnosis → computed rendered contexts → template. Scroll offset, measured viewport height and browser activation are the only signal-backed ephemeral state.

## 26. Writable state

No mirror for items, size, key function or identity. Writable state is limited to viewport geometry/activation and private frame/listener/observer handles. The last-emitted range and diagnostic signature are dedupe bookkeeping, not domain state.

## 27. Effects

Zero `effect()` domain synchronizers. One browser `afterRenderEffect()` handles range/diagnostic transition delivery; one `afterNextRender()` attaches viewport resources after hydration. No per-item effect.

## 28. Listener lifecycle

Exactly one passive scroll listener per live viewport. Destroy removes it. Browser instrumentation confirmed one live listener after 100 remounts and zero after the final destroy.

## 29. ResizeObserver

At most one observer for the viewport, none per item. It is created only in the browser when available and disconnected on destroy. Browser instrumentation confirmed one live/zero destroyed.

## 30. rAF coalescing

Scroll and resize share a scheduler with at most one pending frame per instance. Destroy cancels that frame. A 1,000-event same-offset storm caused no duplicate range output and fewer than 20 global frame requests in the real fixture.

## 31. SSR

SSR renders a deterministic bootstrap window from `visibleRows × itemSize` with no browser geometry, listeners, observer, frame or `rangeChange`. The 10k-item SSR fixture mounted at most 14 domain rows.

## 32. Hydration

Real Angular 22.1.6 Chromium hydration reused the SSR main, component, viewport and first item DOM nodes, with **0 NG050x**. Browser measurement activated after render and emitted the initial visible range once.

## 33. Zoneless

The consumer uses `provideZonelessChangeDetection()` and no Zone.js. Signals drive window updates; no `detectChanges`/`markForCheck` architecture is used.

## 34. Parent writes

Directed/browser tests cover same/new arrays, reconstructed objects with same K, new lengths, reorder, insert/remove, empty/populated transitions and replacement after scrolling. New order is authoritative; no business selection preservation is attempted.

## 35. Immutability

Frozen input fixtures pass. Neither the engine nor facade mutates applied items or template context values.

## 36. Recompute evidence

Geometry depends on scroll/viewport/count/size only. Duplicate-key diagnosis depends on applied items/key function and is cached across scrolls. Window context projection touches rendered indices only. Browser scroll storm and 100k/1M pure benchmarks corroborate the intended boundary; no per-scroll identity rebuild is designed.

## 37. Lifecycle stress

Chromium exercised 100 create/destroy cycles, 100 resize toggles, 1,000 scroll events and repeated top↔bottom jumps. Final live listener/observer counts were zero; no browser errors or late outputs were observed.

## 38. 1k performance

Node pure-engine p50/p95: range **0.0005/0.0006 ms**, large jump **0.0005/0.0006**, window projection **0.0021/0.0041**, key lookup **0.0250/0.0295**.

## 39. 10k performance

Node p50/p95: range **0.0005/0.0005 ms**, large jump **0.0005/0.0005**, window projection **0.0012/0.0016**, key lookup **0.2674/0.3620**. A real 10k-item Chromium fixture maintained a bounded DOM. Fixture two-frame-settled p50/p95 latencies were about **33.3/34.0 ms scroll**, **33.3/33.9 ms resize** and **33.3/34.2 ms remount**; the two awaited frames dominate these numbers, so they are lifecycle checks, not render-CPU or FPS claims.

## 40. 100k/1M geometry evidence

100k applied domain objects were allocated only for the 100k key-lookup/window benchmark; range and jump remained ~**0.0005/0.0006 ms** p50/p95. At 1M, *geometry only* (no million-item domain array) measured ~**0.0003/0.0004 ms**. No geometry loop iterates over total count.

## 41. DOM bound

The 10k applied-item SSR/Chromium fixture asserted `mounted <= 14` for ten visible rows and `<= 15` during the 11-row resize case. The measured maximum was **13 mounted domain rows**. No offscreen domain rows are `display:none`.

## 42. Legacy bundle

Pre-rewrite FESM: **13,689 raw / 3,285 gzip / 2,789 Brotli**. The old CDK-based consumer bundle and root-unused were not captured before rewrite; comparing this FESM directly to a minified consumer bundle would be misleading.

## 43. Final bundle

After the final build, minified isolated consumer bundles (Angular externalized): BASIC **10,658 raw / 3,023 gzip / 2,689 Brotli**; typed template **10,687 / 3,034 / 2,700**; large-data configuration **10,683 / 3,036 / 2,702**. This is a bundle size, not a browser-speed claim. No CDK virtual-scroll runtime is retained.

## 44. Root-unused

**0 B raw**, not reachable through an unused root import. This is an enforced gate in `audit:n2-c7-bundle`.

## 45. Dependency graph

VirtualList runtime depends only on Angular core/common and its private engine/types. No Table, TreeTable, Tree, TreeSelect, Listbox, Scroller, PrimeNG, HTTP, Router, Forms or storage facade edge. Bundle metafile audits the forbidden facade edges.

## 46. CDK decision

The CDK wrapper, viewport, row helper, stream subscription and remeasure calls were removed. A small pure fixed-height engine meets the approved linear scope without importing another certified virtualization engine or refactoring other components.

## 47. Test migration

The 26 legacy CDK-facing tests were classified as KEEP BEHAVIOR/MIGRATE (rendering, empty, size, template, range) versus REMOVE API-ONLY (CDK viewport checks, row helper, trackBy/internal helpers). They were replaced by **12 component + 8 pure** C7 tests; the six-test count decrease consolidates obsolete CDK/internal checks, not identified P1 behavior. The H9 event-contract test was migrated from CDK rendered-range manipulation to the final visible-range command.

## 48. Directed tests

**46/46** across C7 component/pure and migrated H9 directed files. Separate compile-only type test and three static C7 contract tests pass. Tests cover half-open math, overscan, boundaries, empty, million-count geometry, exact K, duplicate K, parent writes, scrollTo, DOM bound, a11y/RTL and 100 component lifecycles.

## 49. Full suite

**187/187 files, 2,484/2,484 tests PASS**, no global coverage. Previous C6 suite was 186 files/2,490 tests; C7 adds one pure spec file and replaces 26 legacy tests with 20 C7 tests (net −6). A pre-existing malformed-Tree fixture still prints its expected Angular duplicate-track diagnostic; it did not fail the suite.

## 50. Build/package

Production build PASS. Public contract audit **97 entrypoints / 813 declarations / 1,462 bindings**; contracts test PASS; 97 import and SSR-import smokes PASS; Angular 22 compatibility consumer build/SSR PASS; package verification **431 files** PASS; published-package audit including publint and project-policy ATTW PASS. The stricter unfiltered ATTW Sass `styles` debt is not called PASS. Global entrypoint audit still fails only on the known missing Showcase demos.

## 51. Public portfolio

Official generator reports **94 public components = 94 COMPLETE + 0 PENDING**, zero active implementation batches. The fixed-height C7 component is complete; the N2-036 2D/variable-height extension remains P3-deferred. Portfolio completion is not final N2 closeout.

## 52. Known debts untouched

No global coverage thresholds, 17 missing Showcase demos, unfiltered ATTW debt, Firefox/WebKit installation, unrelated warnings or other P2/P3 features were changed to make C7 pass.

## 53. Unrelated file verification

`projects/ui-core/tree-table/public_api 2.ts` remains untracked, unstaged and byte-identical at SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`.

## 54. Git diff/status

Branch `v2`, starting HEAD `aa52f09d78341f375d5f4eccf52ebe58b1bc1122`. C7 changes are intentionally uncommitted and unstaged for review. Diff contains VirtualList runtime/engine/tests, migrated VirtualList-specific fixtures, official contracts, portfolio, C7 gates and this report. `git diff --check` PASS; no symlink or temporary artifact is staged/tracked. No push, tag, release or npm publication.

## 55. Risks

The major-break migration requires `itemKey` and `neuVirtualItem` for typed templates. `scrollTo({key})` is deliberately O(n) command-time lookup; very frequent key commands at much larger datasets would warrant separate evidence, not a hidden cache now. Consumer templates must honor the fixed row height. No remote/infinite or variable-height promise is made.

## 56. Recommendation

**C7 COMPLETE — READY FOR FINAL N2 CLOSEOUT.** Do not start that separate certification phase automatically.
