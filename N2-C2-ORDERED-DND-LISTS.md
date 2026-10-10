# N2-C2 — Ordered DnD lists: design review and final certification

## Status and checkpoint

**C2 NEEDS DESIGN REVIEW.** No C2 runtime, public contract, test, package, portfolio, or generated-artifact change has been made. N2-C1 was committed on `v2` as `05ba222bcd26d40a72248e5f559f40233ae3ade4` (`feat(media): consolidate Gallery and ImageViewer for Neural 2`). Its certified directed, full-suite, build, package, SSR/hydration and root-unused evidence remains the C1 checkpoint; it is not C2 evidence. The foreign untracked `projects/ui-core/tree-table/public_api 2.ts` is untouched.

## Exact current inventory

Both facades and two strongly typed item-template directives are in `projects/ui-core/pick-list/neu-pick-list.component.ts`, exported from the single existing `@neural-ui/core/pick-list` entrypoint. There is no separate OrderList entrypoint. The public contract snapshot records both selectors in that entrypoint.

| Facade | Inputs | Outputs | Public imperative methods |
| --- | --- | --- | --- |
| PickList | `source`, `target`, `optionLabel`, `optionValue`, `optionDisabled`, `sourceHeader`, `targetHeader`, `filter`, `filterConfig`, `sourceFilterValue`, `targetFilterValue`, `filterPlaceholder`, `sourceFilterLabel`, `targetFilterLabel`, `emptyFilterLabel`, `moveAllScope`, `dragDrop`, `sourceSelectionKeys`, `targetSelectionKeys` (19) | `sourceChange`, `targetChange`, `sourceSelectionChange`, `targetSelectionChange`, `sourceFilterChange`, `targetFilterChange`, `itemDrop`, `itemsChange` (8) | `toggleSource`, `toggleTarget`, `moveToTarget`, `moveToSource`, `moveAllToTarget`, `moveAllToSource`, `setFilter`, `reorderSelection`, `onDrop`, `dragData`, `optionLabelOf`, `optionValueOf`, `isOptionDisabled`, `isSourceSelected`, `isTargetSelected`, `hasSourceSelection`, `hasTargetSelection`, `hasMovableSourceSelection`, `hasMovableTargetSelection`, `hasMovableSourceItems`, `hasMovableTargetItems` (21) |
| OrderList | `items`, `optionLabel`, `optionValue`, `optionDisabled`, `selectionKeys`, `filter`, `filterValue`, `filterConfig`, `filterPlaceholder`, `filterLabel`, `emptyFilterLabel`, `ariaLabel`, `dragDrop` (13) | `orderChange`, `selectionChange`, `filterChange`, `itemDrop` (4) | `move`, `canMove`, `toggle`, `moveSelection`, `setFilter`, `onDrop`, `hasSelection`, `isSelected`, `dataIndex`, `optionLabelOf`, `optionValueOf`, `isOptionDisabled` (12) |

These are source-level callable methods, not an assertion that all are intended as stable documentation API. The existing shared public types are `NeuTransferItem`, `NeuListLocation`, `NeuListMove`, `NeuPickListMoveAllScope`, `NeuPickListDropEvent<T>`, `NeuPickListItemContext<T>`, and `NeuOrderListItemContext<T>`. The two template directives are `NeuPickListItemDirective<T>` and `NeuOrderListItemDirective<T>`. `NeuOption*` accessor types are re-exported from the option API.

## Ownership, identity and current behavior

| Concern | Current implementation |
| --- | --- |
| Source/target/order | `source`, `target`, and `items` are readonly input signals. `commit()` emits new source/target arrays and an atomic `itemsChange` payload; OrderList emits a new array through `orderChange`. Neither facade writes an applied collection. Parent rejection leaves inputs unchanged. |
| Selection | Optional `sourceSelectionKeys`, `targetSelectionKeys`, and `selectionKeys` make selection parent-applied. Otherwise local `Set` signals own action staging. PickList selection outputs are item arrays, not key arrays. Focus and dragged item are separate concepts, but no explicit focus owner/restoration is present. |
| Filter | Optional value inputs make filter parent-applied; otherwise local filter signals own text. Shared `filterNeuOptions` computes visible projections. There is no input-to-writable mirror effect. |
| Identity | `optionValue` resolves a semantic value; absent an accessor, object-valued `T` can fall back to object identity. `@for` tracks `optionValueOf(item)`. This works for reconstructed entities only if a stable value accessor is supplied. Duplicate keys in one list make `findIndex` select the first record and make DOM tracking ambiguous. Cross-list equal values are silently skipped by transfer. |
| Transfer | Button transfer takes selected source items in applied source order, excludes disabled items and destination-value collisions, and appends to the opposite applied list. `moveAllScope='filtered'` (default) uses the visible source projection; `'all'` uses the full source. A pointer drop instead inserts at the reported destination index. A transfer also proposes clearing the selected side, even if the parent rejects the collection proposal; the selection input can independently reject that clearing proposal. |
| Reorder | Toolbar move-up/down/top/bottom applies to the full collection and treats disabled items as movement barriers. Item move buttons in OrderList use full-data index. DnD uses the shared Neural CDK-backed drag/drop directive, not a second pointer engine. Same-side drop uses `neuReorder` on the full collection. |
| Focus/keyboard/a11y | Native transfer and reorder buttons provide keyboard actions. PickList uses `role=listbox` and `role=option`; OrderList uses a labelled group, item buttons, and per-item move buttons. The DnD directive also supports keyboard pickup/drop, but its keyboard drop does not provide an index. No focus restoration or bounded completion announcement has yet been certified for C2. |
| RTL/responsive | CSS uses logical inline sizing and `text-align:start`; source and target are in fixed DOM order. At ≤640px the grid stacks, without swapping domain roles. Pointer geometry and transfer glyphs/labels still require browser certification. |
| Resources | These facades contain 0 product effects, 0 own subscriptions, 0 own timers, 0 own observers, and 0 own global listeners. Drag/drop subscriptions and pointer resources live in the shared CDK-backed directive and require lifecycle verification. |

The component currently calls `splice` only on copied arrays or locally created segments, not on the readonly applied input arrays. The two facades duplicate some selected-block reorder logic; a private neutral engine may be appropriate after semantics are frozen. No shared public base or new entrypoint is justified.

## Material unresolved contract: filtered reorder/drop

The rendered DnD lists contain `visibleSource()`, `visibleTarget()` and `visibleItems()` (`neu-pick-list.component.ts:145,660`). The shared drag/drop directive passes the CDK `currentIndex`, which is the index in the rendered drop list (`neu-drag-drop.directive.ts:668-680`). PickList passes that index directly to `neuReorder` or `inserted.splice` on the **full applied array** (`neu-pick-list.component.ts:396-439`); OrderList does the same (`:800-818`). The keyboard drop path supplies no index (`neu-drag-drop.directive.ts:580-604`), so current fallback is end-of-list. Existing specs use no-filter indices or exercise filtered UI without asserting the resulting order. The public drop event exposes `currentIndex` but does not state whether it is a visible or applied index.

For applied `[A, B, C, D]` with visible `[B, D]`, dragging `D` to visible position 0 can correctly mean either:

1. **Visible-slot permutation:** `[A, D, C, B]`; hidden items keep their applied slots.
2. **Full-list anchor insertion:** `[A, D, B, C]`; insert relative to the visible anchor and shift intervening hidden items.

Both differ from treating visible index `0` as applied index `0`. Cross-list drop has a second ambiguity: an empty filtered destination may mean append to the full target, reject the drop, or insert at a previously remembered position. Toolbar moves also currently reorder the full collection while the DnD list is filtered. Choosing a mapping in runtime would silently define the public `itemDrop.currentIndex` and keyboard/pointer equivalence. This is explicitly a pre-runtime STOP condition in the C2 authorization.

**Decision requested (recommended A):**

- **A — Visible-slot reorder:** same-side DnD and keyboard reorder permute only visible item slots in the applied array, preserving hidden items in their slots. Cross-side DnD inserts before the target visible anchor (or after the last visible item; append when no target is visible). `itemDrop.currentIndex` is documented as the visible destination index; the immutable proposal carries the authoritative full arrays. All reorder controls use this policy while filtered.
- **B — Full-list anchor reorder:** same-side and cross-side DnD move the item in the full applied array relative to a visible anchor; hidden items may change absolute slots but retain relative order. The keyboard controls use the same anchor policy. Define the no-visible-target placement explicitly.
- **C — No filtered reorder:** disable same-side DnD/reorder controls while a filter is active, while keeping filtered transfer buttons. This is simpler but narrows the current affordance and the requested filtered-identity behavior.

The selected policy must also specify whether `itemDrop.currentIndex` is a visible index or an applied index. A controlled rejection must never make either facade retain the proposed order.

## Other design choices to freeze with that decision

1. **Duplicate semantic keys:** Recommend unique `optionValue` across both PickList sides and unique within OrderList; malformed applied input fails closed for transfer/reorder with a deterministic development diagnostic, no silently merged rows. Alternative: uniqueness only within each side and cross-side collision is a documented rejected transfer. Current source does not enforce either invariant consistently.
2. **Reconstructed entities:** Recommend documenting that arbitrary object `T` requires `optionValue` returning a stable semantic key. The default `NeuTransferItem.value` and primitive values remain valid. If a mandatory public key input is desired instead, that is a public API decision and must be authorized first.
3. **Controlled selection after transfer:** Recommend preserving the current independent proposal outputs but not clearing local/controlled action selection until the applied collection change is observed; otherwise a rejected collection proposal can still clear selection. Alternatively explicitly permit independent selection and collection acceptance. No new output is needed because `itemsChange` already carries an atomic two-list proposal.

## Gates deferred by the STOP

No C2 runtime refactor, `test:n2-c2`, focused/browser SSR-hydration, lifecycle/performance measurements, before/after bundle comparison, root-unused measurement, C2 contract/package run, full-suite run, or portfolio status update has been claimed. The only reported full-suite result is the certified C1 checkpoint: 181 files, 2473/2473 tests. Starting portfolio remains 94 public components, 87 completed, 7 pending, 5 implementation batches; active runtime work remains PickList, OrderList, MegaMenu, CommandPalette, Kanban and Tree (VirtualList remains P3 deferred). C2 has no changed API, effects, resource budget, or package graph yet.

## File hygiene and recommendation

This design-review report is the only C2-owned change. No symlink, temp directory, generated artifact, or C2 commit was created. No C3 work was started. Once the filtered-order, duplicate-key, and selection-acceptance policies above are frozen, resume C2 at the private engine/refactor and run all directed, browser, package, bundle, and full-suite gates from the authorization.

**Recommendation: C2 NEEDS DESIGN REVIEW.**

---

## Normative resolution and resumed execution

The preceding section is the preserved historical STOP, not the final status. The subsequent C2 resolution froze visible-slot permutation; visible `itemDrop.currentIndex`/`previousIndex`; destination-visible anchor insertion; no-op for indexless keyboard DnD; globally unique semantic keys across PickList sides and within OrderList; and selection independent of an unaccepted collection proposal. No new input, output, public type, directive, component, or entrypoint was needed.

## Final implementation and ownership

The two public facades remain `NeuPickListComponent` and `NeuOrderListComponent` in the existing `@neural-ui/core/pick-list` entrypoint. The 19/8 PickList and 13/4 OrderList input/output counts in the inventory above are unchanged; the public contract snapshot did not change. `source`, `target`, and `items` stay parent-applied readonly inputs. `sourceChange`/`targetChange` and the atomic `itemsChange`, or `orderChange`, carry fresh immutable proposals; a rejected proposal never becomes applied local order. Selection keys supplied by a parent remain the only controlled selection owner. Local selection persists across a proposal and is silently pruned only when a subsequent applied list write removes the key. Filtering does not clear selection; stale controlled keys render no phantom item and produce no correction echo.

The new private framework-free `neu-ordered-list.engine.ts` owns duplicate detection, visible-slot mapping, immutable reorder/transfer, visible-anchor insertion, and local-selection pruning. It has no Angular state, global cache, listener, or public export. Both facades use the same pure reorder path for native buttons and CDK pointer DnD. Toolbar transfer deliberately retains its existing applied-source-order append behavior and `moveAllScope='filtered'|'all'`; pointer transfer uses the visible destination anchor. Disabled items cannot be selected, transferred, or crossed as reorder barriers.

For filtered `[A,B,C,D]` with visible `[B,D]`, moving `D` to visible index zero proposes `[A,D,C,B]`: the hidden `A` and `C` retain their exact applied slots. A cross-side drop before a visible destination inserts before that item's full-array slot; after the last visible item it inserts immediately after that item's slot; an empty visible destination appends to the complete destination array. `itemDrop.currentIndex` is the visible destination index and `previousIndex` the visible source index, including when hidden items occupy intervening applied slots. The emitted full-array proposal is authoritative. An indexless DnD keyboard drop is intentionally non-authoritative/no-op; labelled native transfer/reorder buttons provide the deterministic keyboard alternative. No pointer simulator was added.

Semantic identity uses the existing canonical `optionValue` resolution. Duplicate keys within OrderList, within either PickList side, or across the PickList union are invalid applied state: ordered interactions fail closed, inputs are not mutated, and a deterministic development diagnostic is emitted once per stable invalid signature rather than on every computed read. Production does not throw for the diagnostic. The index-based tracking fallback on malformed data is renderer hygiene only, never a substitute semantic identity. Arbitrary reconstructed object `T` must supply a stable `optionValue`; without it, the existing object-reference fallback cannot preserve identity across reconstruction. No `trackBy`/`itemKey`/`dataKey` API was introduced.

The HTML uses an explicit drag handle separate from the selectable native item button, A1 `NeuButtonComponent` for move actions, and statically imported neural-icons arrows/drag glyphs. List labels, item names, `aria-selected`/`aria-pressed`, disabled controls and keyboard action labels are present. No unbounded live-region or pointer-move announcement was added. Keyboard focus stays on the action after a rejected proposal; after an accepted transfer disables/removes that action, one `afterNextRender` callback places focus on the moved destination item (or a deterministic valid destination fallback), with a destroy guard. This is ephemeral focus handling, not a domain effect or collection owner. Source/target domain roles are unchanged in RTL and in the stacked responsive layout. CDK remains the sole pointer engine. The facades retain zero product effects, own global listeners, timers, observers, and subscriptions; DnD resources are released by the existing shared directive on destroy.

## Certification evidence

| Gate | Result |
| --- | --- |
| C2 directed | 3 files, 47/47 tests pass, including pure engine, duplicates, filtered hidden-slot reorder, anchor transfer, acceptance/rejection, selection ownership, disabled barriers, reconstruction, and immutable inputs. |
| Cross-component legacy contract | `test:n2-b9`: 5 files, 74/74 pass. Its prior auto-clear expectation was updated to the newly frozen C2 selection contract; no legacy runtime was changed. |
| Full library | 183 files, 2,497/2,497 tests pass, no global coverage run. Compared with C1's 181 files / 2,473 tests, C2 adds two files and 24 tests (9 pure-engine + 15 integration); no legacy test was removed. |
| Production build | PASS, 97 entrypoints. |
| Public contracts | `audit:contracts` PASS (97 entrypoints, 795 exported declarations, 1,475 bindings, 5,233 classified symbols); `test:contracts` 5/5 pass. No snapshot regeneration or API delta. |
| Package and imports | `audit:package` (including publint/ATTW), `verify:package` (431 files), 97 public imports and 97 SSR imports PASS. Icon boundary PASS. |
| Real Angular 22 SSR/hydration | Chromium consumer using final public import and `provideZonelessChangeDetection()` passes: server emits no proposal, SSR DOM is reused, 0 NG050x, native keyboard reorder, real CDK pointer reorder and cross-side transfer, rejected/accepted parent proposals, reverse transfer, RTL, stable action focus and no duplicate output. The fixture removes its temporary directory in `finally`. |
| Bundle, built final entrypoint | OrderList 80,404 B raw / 13,854 B gzip / 11,819 B Brotli; PickList 80,404 / 13,855 / 11,835; combined 80,412 / 13,862 / 11,830; root-unused **0 B raw**. No new third-party runtime or duplicate large engine. |
| Reproducible pure performance | 100-item filtered OrderList reorder p50/p95 0.0053/0.0132 ms; selected-to-top 0.0075/0.0145 ms. 100+100 PickList duplicate validation 0.0095/0.0180 ms, anchor lookup 0.0035/0.0041 ms, transfer 0.0032/0.0044 ms. These are representative local Node microbenchmarks (1,000 iterations each), not browser throughput claims. |

No same-harness pre-refactor C2 bundle was captured before the runtime refactor; therefore this report does **not** invent a before/after byte delta. The baseline in the earlier STOP report was an inventory, not a measured bundle. The final numbers and harness above are reproducible. Main allocations are short-lived copied arrays for immutable proposals, key/index maps for each operation, and serialized bundle outputs in the measurement script; no retained proposal/cache owner was introduced.

The portfolio is now 94 public components: 89 completed, 5 pending, 4 active implementation batches. Pending are MegaMenu (C3), CommandPalette (C4), Kanban (C5), Tree (C6), plus VirtualList's P3-deferred extension. The C2 diff is limited to the shared pick-list entrypoint implementation/styles/tests, one cross-component assertion updated for the new normative selection behavior, local C2 gates, this report, and portfolio bookkeeping. The foreign untracked `projects/ui-core/tree-table/public_api 2.ts` remains untouched. `git diff --check` passes; no symlink, package build artifact, temporary hydration folder, C2 commit, push, tag, release, or npm publish was made. No C3 runtime work was started.

**Final recommendation: C2 COMPLETE — READY FOR C3.**
