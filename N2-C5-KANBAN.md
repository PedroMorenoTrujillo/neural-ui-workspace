# N2-C5 — Kanban design review and controlled DnD implementation

## 1. Status

**Historical pre-runtime result: NEEDS DESIGN REVIEW.** The mandatory first design gate stopped C5 before any runtime, contract, test, portfolio or package change. The five missing public decisions were subsequently resolved by the user's normative C5 addendum below. This section preserves the original STOP evidence; the final implementation status is recorded at the end.

## 2. Scope

Only the current `@neural-ui/core/kanban` facade, its 37-test suite, the C5 roadmap/portfolio, N2 ownership rules, shared DnD boundary and package baseline were inspected. C6 Tree, P3 VirtualList, C4 CommandPalette and the foreign TreeTable file remain untouched.

## 3. Starting checkpoint

Branch `v2`, HEAD `5928a13d0d9b1f634dfda39247707d818ba6144c` (`feat(command-palette): implement N2-C4 declarative command palette`). Tracked tree and staging were clean; the sole pre-existing untracked file was `projects/ui-core/tree-table/public_api 2.ts`.

## 4. Legacy baseline

`NeuKanbanComponent` is a 659-line standalone Angular 22 component with CDK DragDrop. The directed legacy suite is **37/37 PASS**. Current compiled Kanban consumer baseline from the existing dist package, Angular/CDK externalized: **41,869 B raw / 7,744 B gzip / 6,756 B Brotli**. An older H9 policy baseline is 43,578 / 7,879 / 6,860 under an Angular 21 toolchain and is contextual, not a like-for-like C5 delta. A root-only `provideNeuralUI` consumer has no Kanban FESM input: Kanban root-unused contribution **0 B raw**.

## 5. Product definition

Board → ordered columns → ordered cards, with moves proposed to a parent. No backend/cache/workflow owner. C5 explicitly forbids an optimistic applied board owner; that overrides the legacy optional optimistic mode.

## 6. Public API legacy inventory

Six public symbols: `NeuKanbanComponent`, `NeuKanbanAssignee`, `NeuKanbanCard`, `NeuKanbanColumn`, `NeuKanbanCardDropEvent`, `NeuKanbanStateMode`. Six inputs: `columns`, `columnWidth`, `showCounts`, `showWipLimit`, `moveButtonLabel`, `stateMode`. Two outputs: `columnsChange`, `cardDrop`. The class exposes **13 public methods** (mostly template/DOM handlers), plus `connectedDropLists`; there are **0 Kanban template directives**. `public_api.ts` re-exports the component file. No active source consumer beyond its tests was found in `projects/`.

## 7. Identity model

Legacy column and card IDs are `string`; no board ID exists. Rendering tracks `column.id`/`card.id`, but movement locates a card by first matching ID across all columns. Neither duplicate column IDs nor globally duplicate card IDs are diagnosed. The target must freeze whether one component instance is sufficient board identity and whether card IDs are globally unique across columns; current behavior implicitly needs global uniqueness but does not state it as a public contract.

## 8. Board representation

Legacy uses `NeuKanbanColumn[]` containing mutable `cards: NeuKanbanCard[]`, with display fields embedded in concrete card/column types. N2-C5 permits either a readonly nested representation or separated domain cards/placement. No authoritative document chooses one or freezes generic `TCard/CardKey/ColumnKey`; changing this is a breaking public decision, not an implementation detail.

## 9. Column ownership

The parent currently supplies ordered `columns`; an `effect()` copies them into writable `_columns`. C5 prohibits that mirror. No column drag/reorder UI or output exists today. The roadmap calls C5 “board DnD” but does not explicitly include or exclude column reorder.

## 10. Card ownership

The parent supplies each column's ordered cards. `stateMode='optimistic'` (the default) currently updates `_columns` after a move; `controlled` emits a cloned snapshot and waits for a parent write. C5 freezes parent-owned applied card order and removes the optimistic owner.

## 11. Controlled DnD

N2-001 requires INPUT + PROPOSAL for rejectable transitions and silent parent writes. The current controlled branch demonstrates rejection/acceptance but the public proposal has two competing channels (`columnsChange` and `cardDrop`) and an ambiguous canonical payload. No runtime change is safe before one final contract is chosen.

## 12. Move proposal model

Current `columnsChange` emits a whole reordered `NeuKanbanColumn[]`; `cardDrop` separately emits the card object, from/to IDs, indices and another columns snapshot. C5 asks for **one** CDK-independent, identity-oriented movement proposal and no duplicate output, but no document freezes its name, discriminants or whether it carries a next-board snapshot. This is the primary STOP.

## 13. Target-index semantics

Legacy code removes a card from a cloned source array and inserts at CDK `currentIndex`. Thus same-column `currentIndex` behaves as the final index after removal, while cross-column `currentIndex` addresses the destination before insertion. C5 requires an explicitly frozen common interpretation for pointer, keyboard, top/middle/end and empty targets; none is documented as target contract.

## 14. Same-column reorder

Legacy CDK drop, keyboard pick-up/arrows/confirm and visible move buttons support same-column reorder. No-op same index emits nothing. Pure proposal tests should retain this behavior after a contract resolution.

## 15. Cross-column transfer

Legacy CDK and keyboard paths transfer a card to another column, including an empty column, and preserve the card object. Cross-column move is factual P1 behavior; C5 explicitly names it. The final output shape and destination restrictions remain open.

## 16. Column reorder

Absent from current runtime and tests. Neither the C5 roadmap nor N2 ownership docs freeze it as P1. Recommended decision: **OUT OF SCOPE C5** unless the user explicitly authorizes a third movement variant; do not add it by symmetry with card DnD.

## 17. No-op moves

Current same-column equal indices produce 0 outputs. C5 asks to keep semantic no-ops silent; define this on the final index model, including adjacent/empty cases.

## 18. Rejection

In legacy `controlled` mode the parent may reject a proposal without changing inputs; the copied `_columns` stays visually at the applied order. C5 must remove `_columns` entirely and have CDK visual state settle back to the applied projection. Legacy default `optimistic` does not satisfy this target.

## 19. Acceptance

Legacy tests prove an explicit consumer echo and synchronous echo do not amplify outputs. C5 must preserve exactly-once behavior with reconstructed objects sharing semantic IDs.

## 20. Reconstructed identity

Current tracking uses IDs, but ephemeral keyboard move stores card title and IDs. A parent replacement can reconstruct objects. The final contract must key focus and movement by semantic IDs, not object reference.

## 21. Disabled cards

`NeuKanbanCard` has no `disabled` property or disabled accessor. Legacy supports no non-draggable card and has no disabled test. C5 explicitly requires one, but does not freeze whether disabled is domain data, a predicate, a key set or configuration. This public API choice is a STOP.

## 22. Drop restrictions

No `canDrop`/accepts predicate, disabled column, drag group or destination restriction exists. `wipLimit` is informational and legacy tests confirm it does not block moves. Whether C5 keeps unrestricted drops or introduces a consumer-defined pure predicate is not frozen; do not silently turn WIP into a business rule.

## 23. DnD engine/CDK boundary

The component directly imports `CdkDrag`, `CdkDragHandle`, `CdkDropList`, `CdkDropListGroup` and `CdkDragDrop`. CDK is internal in the runtime, but public method `onCardDrop(event: CdkDragDrop<...>)` leaks a CDK type through the class declaration. C5 should keep CDK internally and internalize that handler after the public contract is settled. The separate shared Neural DnD directive already wraps CDK and serves other components; Kanban does not import it, so no shared-infrastructure edit is justified.

## 24. Ephemeral DnD state

Legacy `keyboardMove`, `activeMoveCardId`, `liveMessage` and pending focus are ephemeral. `_columns` is an applied-state mirror and, in optimistic mode, a second owner. The latter must be removed; the others may survive only as UI state with cleanup.

## 25. Signal graph

Target: readonly applied inputs → computed board projection → renderer; gestures → pure proposal → one output. Current `columns → effect() → writable _columns` violates that graph.

## 26. Writable state

Legacy has five writable signals: `_columns`, `keyboardMove`, `activeMoveCardId`, `liveMessage`, `pendingFocusCardId`, plus locale signal. Only `_columns` is a domain mirror. No C5 writable-state changes were made.

## 27. Effects ledger

Current product has **1 `effect()`** for the board mirror and **1 `afterRenderEffect()`** for focus restoration. A document `pointerdown` host listener and one `MutationObserver` watch locale changes. No RxJS subscription was found. C5 target must remove the mirror effect and re-audit the remaining resources.

## 28. Templates

No public card/header/footer/empty/preview template directive exists. Legacy hardcodes card rendering. C5 does not freeze which templates, if any, become P1; adding them requires an explicit public-surface decision rather than assuming the CDK preview facility is a requirement.

## 29. Interactive card descendants

Legacy card `<article>` is itself a `cdkDragHandle` and `role=button`; the component does not currently project consumer interactive descendants. A future template contract would need a separate drag handle and a clear click/focus boundary. Do not claim this is solved by the existing markup.

## 30. Drag handle

The whole legacy card is the pointer handle. C5 says handles should be accessible if supported, but does not freeze a new public handle directive or template. Internal handle placement depends on the template decision.

## 31. Keyboard DnD

Legacy supports Enter/Space pick-up, arrows/Home/End to choose a position, Enter/Space confirm, Escape cancel, and visible directional move buttons. `N2-NEURAL-ADVANTAGES.md` identifies keyboard and a non-drag alternative as an existing Neural capability. C5 should preserve an equivalent accessible route; exact final bindings/announcements must be frozen with the final proposal/index model.

## 32. Focus

Legacy restores by card ID via `afterRenderEffect()` and focuses the move trigger after Escape. New behavior must restore by key across acceptance/rejection and reconstruction, but cannot be verified until the runtime exists.

## 33. Accessibility semantics

Legacy uses labelled column sections, card `role=button`, keyboard instructions, move buttons and an ARIA live region. There is no invented `role=kanban`. The board itself lacks an explicit public accessible-name input. C5 a11y target needs a final board-label contract if an unnamed board is unacceptable.

## 34. Live announcements

Legacy live messages announce target, cancellation and completed move using document/injected locale. Exactly-once messaging after parent rejection versus acceptance is not frozen; an announcement must not falsely claim acceptance.

## 35. SSR

Current template renders applied columns/cards and guards `MutationObserver` behind `doc.defaultView`; no direct `window` call appears in the component. The required C5 real SSR gate is not run while design-blocked.

## 36. Hydration

An existing H9 browser script includes a Kanban DOM-reuse fixture. A direct standalone invocation during this audit could not connect to its expected local server (`ERR_CONNECTION_REFUSED`), so no new hydration PASS is claimed. C5 hydration verification remains pending after a resolved implementation.

## 37. Zoneless

The directed legacy test suite runs in the current Angular workspace; real C5 `provideZonelessChangeDetection()` consumer is deferred, not claimed.

## 38. RTL

Legacy keyboard Left/Right navigates array neighbors without checking `dir`; whether those keys should represent logical previous/next or visual left/right in RTL is not frozen. C5 requires explicit RTL pointer interpretation without reversing applied arrays.

## 39. Responsive

Current SCSS provides horizontally arranged columns and card-list overflow. Narrow/mobile and long-card C5 browser review is deferred until runtime exists.

## 40. Auto-scroll

CDK supplies drag auto-scroll behavior. No bespoke rAF loop exists in Kanban. C5 must test board/column scroll if retained; no new engine was started.

## 41. Empty column/board

Legacy renders an empty-column hint and supports a transfer into an empty target. Zero-column behavior is deterministic by the `@for` loop but has no dedicated empty-board UI contract.

## 42. Duplicate identities

No deterministic duplicate-column/card diagnostic exists. Duplicate card ID across columns is especially unsafe because `cardPosition` chooses the first match. The final globally unique ID policy needs explicit approval.

## 43. Immutability

Legacy clones column containers/card arrays before `splice`, preserving consumer arrays and card objects, but its public types are mutable and it keeps a writable board mirror. C5 requires readonly applied snapshots and deep-frozen fixtures; no runtime mutation test has been added.

## 44. Exactly-once matrix

Legacy moves emit `columnsChange` and `cardDrop` once each; parent echoes do not produce another move in existing tests. C5 must have one semantic proposal per gesture and no event on no-op/rejection/initial hydration. The matrix cannot be finalized without the output contract.

## 45. Recomputation evidence

Not measured for a C5 implementation. Current hover is mostly CDK-owned; `_columns` recomputes/clones on input writes. Hover must not create a new board projection owner.

## 46. Performance baseline

No comparable 10×20, 20×50 or 1,000-card interaction p50/p95 was run before the design STOP. Bundle and 37-test baseline are captured above. Do not present a guessed performance claim.

## 47. Performance final

Not run: no C5 runtime exists. Required later: projection, drag start/target, proposal, accepted/rejected writes, and column reorder only if approved.

## 48. Lifecycle/resources

Current destroy hook clears ephemeral signals/disconnects the locale observer. CDK owns drag refs; legacy has one document pointerdown listener. The 100-cycle C5 stress gate is deferred.

## 49. Bundle legacy

Fresh consumer import baseline is 41,869 B raw / 7,744 B gzip / 6,756 B Brotli (Angular/CDK externalized). DnD is statically in the sole Kanban FESM; there is no separate “basic without DnD” code path in this legacy implementation.

## 50. Bundle final

Not measured because no C5 runtime was changed. Do not compare against the older Angular 21 policy baseline as if it were equivalent.

## 51. Root-unused

Current root-only consumer has **0 B Kanban retention**; no Kanban FESM is in its esbuild input graph. Recheck after implementation.

## 52. Dependency graph

Current runtime imports Angular core/common, CDK DragDrop, `@neural-ui/core/foundation` locale and `@neural-ui/core/internal` ID generation. No Router, HTTP, storage, Forms, Table, TreeTable or VirtualList facade import appears. The separate shared DnD directive is not a Kanban dependency.

## 53. Public API redesign

Provisional classification only: `columns` CHANGE to readonly applied input; `stateMode` REMOVE; `columnsChange`/`cardDrop` MERGE or CHANGE into one approved proposal; 13 current public handler/helper methods INTERNALIZE; `columnWidth`, `showCounts`, `showWipLimit`, `moveButtonLabel` KEEP/CHANGE subject to final a11y/layout contract; concrete card/column/assignee types KEEP/CHANGE depending on canonical representation; CDK event type REMOVE from public declaration. No DEPRECATE target. This is not a frozen final surface.

## 54. Legacy tests

37/37 PASS. Behavior to migrate: rendering/WIP, keyboard and non-drag moves, same/cross-column, empty target, no-op, controlled acceptance/rejection, echo, reentrancy/destroy. Tests directly calling `onCardDrop` or private keyboard state are implementation-coupled and should not force those APIs to remain public.

## 55. C5 tests

Not created while the public movement and restriction contracts are unresolved.

## 56. Browser verification

Not run for C5. Pointer, keyboard, disabled, rejection/acceptance, focus, RTL and destroy-mid-drag remain mandatory after implementation.

## 57. Visual structural review

Not run for a C5 implementation. Existing markup was inspected; no Showcase redesign or visual refactor was started.

## 58. Shared DnD regressions

The shared `neuDragDrop`/`neuDraggable` directives have other consumers, but Kanban currently uses CDK directly. No shared code was touched, so no shared regression gate is triggered in this STOP.

## 59. Full suite

Not run: C5 stopped before runtime changes. Last certified C4 full suite is 2,495/2,495; current directed Kanban baseline is 37/37.

## 60. Build/package

Not rerun for a report-only design STOP. No package metadata or entrypoint was changed.

## 61. ATTW classification

The strict root-entrypoint type-resolution failure documented in C4 is pre-existing and remains untouched. ATTW was not rerun for this report-only STOP; no PASS is claimed and no threshold was changed.

## 62. Portfolio accounting

Unchanged: **94 public components, 91 complete, 3 pending, 2 active implementation batches**. Kanban remains pending C5. The other pending components are Tree C6 and P3-deferred VirtualList.

## 63. Risks and decisions required

Freeze, in one normative resolution, at least:

1. Canonical public board shape and identity: retain readonly nested columns/cards or separate domain cards/placement; whether a board ID exists; column/card key types and global card-key uniqueness.
2. One public movement output: name, closed variants, exact identity/context fields, whether a next-board snapshot is included, and whether `columnsChange` or `cardDrop` survives. Freeze target index as final-after-removal or another precise rule for both intra/inter-column moves.
3. Column reorder: P1 or out of scope. Current implementation has none; recommended out of scope unless a real requirement is stated.
4. Disabled card and destination restrictions: API location (domain field, key set, accessor/pure predicate, or no destination restriction), whether disabled descendants are focusable, and WIP remains informational or becomes an explicit rule. Current API cannot represent disabled cards.
5. Accessible interaction: preserve keyboard pick-up plus non-drag move buttons, and decide whether card templates/interactive descendants and a separate drag handle are P1. Clarify board accessible name and RTL left/right meaning.

The C5 prompt intentionally does not authorize inventing these product semantics. A code implementation choosing any of them silently would violate its first design gate.

## 64. Git diff

This report is the only C5 file added. No Kanban runtime, specs, public contract, package snapshot, shared DnD, portfolio or roadmap file was changed.

## 65. Git status

Branch `v2`, HEAD still C4 `5928a13d0d9b1f634dfda39247707d818ba6144c`. This report is untracked/unstaged alongside the unrelated TreeTable file. No commit, push, tag, release or publication. Verify final status before handoff.

## 66. Recommendation

**Historical recommendation: NEEDS DESIGN REVIEW.** The five decision groups below were subsequently frozen by the user. Do not start C6 or VirtualList. The foreign TreeTable file must remain untracked and byte-identical.

---

## Normative C5 design-review resolution

The user approved the following changes to the historical decision set. One component instance is one board, with no public `boardId`. The applied shape stays ordered readonly columns containing ordered readonly cards; `column.id` and `card.id` remain strings. Column IDs are unique within one board and card IDs globally unique across its columns, with deterministic diagnostics for duplicates. Reconstructed objects retain identity by ID.

The two old movement channels (`columnsChange`, `cardDrop`) and `stateMode` are removed. The sole movement output is `cardMove: NeuKanbanCardMove`, a closed union of `NeuKanbanCardReorder` and `NeuKanbanCardTransfer`. It carries IDs and indices, never card objects, a next-board snapshot, CDK/DOM objects or coordinates. `fromIndex` is the applied source position before movement; `toIndex` is the final destination position after movement for both variants. Same-column equal-index gestures are silent. The parent accepts by replacing readonly columns/cards; rejection leaves applied inputs unchanged and must leave no ghost ordering.

Column reorder is explicitly out of scope. `NeuKanbanCard.disabled?: boolean` is the only new move restriction: disabled cards remain rendered/readable, but pointer drag, keyboard pickup and move actions emit nothing. Destination predicates, disabled columns, drag groups and business rules are out of scope; `wipLimit` remains informational. The existing keyboard pick-up/arrows/confirm/Escape and non-drag move controls stay P1 and converge with pointer on one pure proposal engine. No public card/column/preview template or drag-handle API is added; CDK remains private. Horizontal keyboard arrows follow visual direction in RTL without changing applied array order. Live announcements describe a requested move, not parent acceptance. No optimistic owner, `_columns` mirror or compatibility mode survives.

The original C5 implementation and verification gates now resume under these frozen semantics. No C6 or VirtualList work is authorized.

---

## Resumed C5 implementation and verification (2026-09-25)

**Final status: NEEDS DESIGN REVIEW — package-certification gate unresolved.** The Kanban runtime and directed functional gates pass. This is not a request to change the frozen movement contract: the remaining blocker is the repository's generated package/packing path described below. No C6 work, commit, push, tag, release or publication occurred.

1. **Scope and ownership.** The only product runtime changed is `@neural-ui/core/kanban`. `columns: InputSignal<readonly NeuKanbanColumn[]>` is the sole applied board owner; `cardMove: OutputEmitterRef<NeuKanbanCardMove>` is the sole intent channel. No optimistic mirror, `columnsChange`, `cardDrop`, `stateMode`, column reorder, new template API or new board ID remains. Presentation inputs `columnWidth`, `showCounts`, `showWipLimit`, `moveButtonLabel` remain. The migration fixture in the real Angular consumer now applies a move proposal to its own signal.
2. **Identity and pure engine.** Ordered readonly nested columns/cards retain string IDs. `diagnoseKanbanBoard` detects the first duplicate column or globally duplicate card ID in applied traversal order. A malformed board renders a deterministic alert rather than duplicating keyed DOM. `findKanbanCard` and `proposeKanbanCardMove` are framework-free, immutable and shared by pointer, keyboard and visible buttons. Same-column `toIndex` means the final index after removal; cross-column `toIndex` is the insertion index. Invalid, stale, disabled and same-index gestures produce no proposal. Reconstructed domain objects preserve semantic identity by ID. WIP is informational.
3. **Accessibility and interaction.** Card content remains readable and focusable when `disabled`; CDK drag and the move trigger are disabled, and keyboard pickup is ignored. Existing keyboard pickup, arrow/Home/End, confirm and Escape flow remains. Left/right are physical/visual under RTL without reversing applied arrays. The live region says “move requested”, never falsely “moved” before parent acceptance. Move controls use native buttons, Escape returns focus, and outside pointer closes the ephemeral menu. CDK types stay out of the public declaration; the template handler accepts `unknown` and casts internally. There are 0 domain `effect()` calls; one `afterRenderEffect` restores focus. The existing document pointer listener and locale `MutationObserver` are cleaned up through Angular lifecycle. No timer or subscription was added.
4. **Type/contract tests.** A compile-only fixture verifies readonly board/card data, closed `reorder | transfer` discrimination, removed legacy outputs/mode and no public CDK handler. The C5 contract gate verifies one output, protected/private handlers, no CDK/DOM payload, no legacy owner and 0 domain effects. Both pass. Generated package declarations contain no `Cdk`, `columnsChange`, `cardDrop` or `stateMode`. Official contract generation and audit pass: 97 entrypoints, 804 exported declarations, 1473 bindings, 5225 classified symbols.
5. **Unit/integration.** Legacy Kanban baseline was 37/37. The replacement is 14 component + 15 pure-engine tests = **29/29 PASS**, covering readonly/frozen data, all movement paths, rejection/acceptance, no echo, duplicate identities, disabled cards, RTL, keyboard, a11y and lifecycle. The full library suite is **185/185 files, 2487/2487 tests PASS**. Relative to the C4 full-suite 2495 tests, the net −8 is the replacement of 37 legacy tests (including deleted optimistic-contract cases) by 29 tests against the frozen C5 API; no failing P1 behavior was suppressed.
6. **Real Angular 22 SSR/hydration.** The C5 consumer imports only `@neural-ui/core/kanban` from the compiled package, uses `provideZonelessChangeDetection()` and `provideClientHydration()`, and builds both browser and server. Chromium verified SSR DOM reuse, 0 NG050x, 0 SSR move events, first keyboard proposal exactly once, explicit parent acceptance without echo, real pointer drag proposal exactly once, disabled card semantics and 100 create/destroy cycles. Fixture directories clean up in `finally`; no C5 temporary folder remains. The broader npm-installed compatibility consumer did not finish because its `npm pack` subprocess stalled (see package gate); it is not claimed as PASS.
7. **Performance and bundle.** Reproducible Node pure-engine p50/p95 milliseconds, 201 samples after warmup: 10×20 diagnostic 0.0148/0.0263, proposal 0.0087/0.0122; 20×50 diagnostic 0.0409/0.0522, proposal 0.0454/0.0579; 1×1000 diagnostic 0.0441/0.0637, proposal 0.0423/0.0554. These are pure-engine measurements, not browser-render claims. Same esbuild harness as the starting comparison, Angular/CDK externalized: basic **46,646 raw / 8,443 gzip / 7,391 Brotli**, versus 41,869 / 7,744 / 6,756 before C5 (+4,777 raw, +699 gzip). Added cost is the pure identity/proposal engine, diagnostic/controlled bindings and disabled/a11y paths; no Table/TreeTable/drag-drop facade FESM is retained. Root-unused remains **0 B raw**. The 10×20 and rich consumer cases measure 46,795/8,511/7,415 and 46,777/8,509/7,441 respectively.
8. **Build, imports, portfolio.** Direct production `ng build ui-core --configuration production` passes; 97 final-entrypoint imports and 97 SSR imports pass. Generated portfolio passes: **94 public components = 92 complete + 2 pending (Tree C6 and deferred VirtualList), 1 implementation batch**. The global entrypoint audit still reports only the pre-existing missing Showcase demo pages (none for Kanban). The strict ATTW root-entrypoint resolution debt recorded at C4 remains external and is not claimed fixed.
9. **Package gate and remaining risk.** The normal `npm run build` wrapper and `npm pack`-based package verification/audit stall on the existing ignored `dist/neural-ui/core` tree, which contains duplicate generated directories with “ 2” suffix. The wrapper timed out; `verify:package` initially saw the wrapper's missing generated LICENSE, and a direct copy of the repository LICENSE into ignored dist allowed its static precheck but `npm pack` still timed out. `publint` also stalled while invoking `npm pack`; the npm-installed Angular 22 compatibility test stalled at the same boundary. Orphaned packing processes were terminated. A targeted cleanup of the ignored generated dist was stopped when it proved abnormally slow; direct Angular build was rerun successfully afterward. **Package verification, publint and strict ATTW are NOT PASS.** Do not attribute a package PASS to the successful direct build or the dedicated C5 browser fixture. Resolve the generated-dist/packing issue in a separate review, then rerun these gates before authorizing C6.
10. **Git/file hygiene.** Branch `v2`, HEAD remains C4 `5928a13d0d9b1f634dfda39247707d818ba6144c`; C5 changes are unstaged and uncommitted. `git diff --check` passes. Zero mode-120000 tracked symlinks and zero changed-file symlinks. The unrelated untracked `projects/ui-core/tree-table/public_api 2.ts` remains untracked and byte-identical (SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`). No C5 hydration directory remains. The diff is limited to Kanban source/tests/contracts, its compatibility fixture, generated public contracts, portfolio/roadmap, C5 scripts and this report.

**Recommendation: NEEDS DESIGN REVIEW.** The controlled Kanban implementation is functionally ready, but C5 certification cannot be declared complete while the mandatory package/ATTW path is unverified. Do not start C6.

---

## Package-certification design-review resolution (2026-09-25)

**Final status: C5 COMPLETE — READY FOR C6.** This addendum supersedes the package-only STOP above; it does not erase the fact that the first packing attempt stalled. No Kanban runtime, public API, fixture, build script or package metadata was changed during this resolution. C6 was not started.

1. **Root cause and bounded inventory.** `dist/neural-ui` is generated output ignored by `.gitignore` and has zero tracked files. Before cleanup it held 577 paths: 431 files, 136 directories, 0 symlinks, 7,615,282 bytes of file contents and maximum depth 3 in `core`. The suspicious entries were empty duplicate directories with literal ` 2` suffixes under `core` (34 at the initial inventory; one was removed in an exact-target deletion probe), plus empty sibling `core 2` and `core 3` trees. There were no nested copies, symlinks or unbounded recursion. No source build/package script creates these suffixes; their exact external origin cannot be proven. The safe conclusion is stale generated-directory debris, not a reproducible defect in the canonical build. The earlier stall is not attributed to a specific filesystem or process mechanism without evidence.
2. **Scoped cleanup and rebuild.** After confirming the target was ignored, generated, bounded and contained no source or foreign file, only `dist/neural-ui` was removed. This is recoverable by rebuilding; no tracked files were deleted. A clean `npm run build` completed successfully in 27.4 seconds. The new `dist/neural-ui` contains only `core`: 536 paths, 431 files, 105 directories, 0 symlinks, 7,613,145 bytes of file contents and maximum depth 4. No duplicate ` 2`/` 3`/` 4` or copy paths reappeared. Generated `LICENSE`, package metadata, Kanban FESM and declaration are present. No build-tooling patch was warranted.
3. **Packing and package verification.** Real `npm pack dist/neural-ui/core --json` completed in about 1 second and produced `neural-ui-core-1.15.0.tgz` (1,297,924 bytes, 431 files), with no duplicate paths. Temporary tarballs and scratch directories were removed. `npm run verify:package` passed (431 files); standalone `publint` passed with no problems; `npm run audit:package` passed. The package audit includes the repository's ATTW policy and does not hide the literal strict result below.
4. **ATTW classification.** Unfiltered `attw --pack dist/neural-ui/core` still exits 1 for the existing Sass-only `@neural-ui/core/styles` export's `no-resolution` classifications (Node10/Node16 CJS/ESM/bundler), plus CJS-to-ESM warnings. It reports no Kanban error. The repository-policy invocation, ignoring `cjs-resolves-to-esm` and `no-resolution`, exits 0 with no `internal-resolution-error`. C4's previously reported root-entrypoint internal type-resolution failure did **not** reproduce after the clean rebuild; it is not silently declared fixed in source. Thus project-policy ATTW is PASS; literal unfiltered ATTW is **not** claimed PASS and its non-Kanban styles classification remains documented debt.
5. **Packed Kanban API smoke.** A fresh tarball was extracted to temporary scratch for inspection. Its `./kanban` export resolves to `types/neural-ui-core-kanban.d.ts` and `fesm2022/neural-ui-core-kanban.mjs`; both files are present. The packed declaration includes `NeuKanbanComponent`, `NeuKanbanCardMove` and `NeuKanbanColumn`, and excludes `CdkDragDrop`, `columnsChange`, `cardDrop` and `stateMode`. The FESM contains the component. The npm-installed Angular 22.1.6 consumer builds using only `@neural-ui/core/kanban`, binds `(cardMove)` and supplies `readonly NeuKanbanColumn[]`; its SSR/import smoke and zoneless checks pass. Compile-only negative shapes remain covered by `test:n2-c5-types` from the functional run.
6. **Bundle and root-unused.** Repeating `audit:n2-c5-bundle` after the clean package build reproduces basic 46,646 B raw / 8,443 B gzip / 7,391 B Brotli, rich cases 46,795/8,511/7,415 and 46,777/8,509/7,441, and root-unused **0 B raw**. There is no material bundle change from the functional C5 checkpoint.
7. **Functional gates retained.** The earlier 29/29 directed tests, 185/185 files and 2487/2487 full-suite tests, real Chromium SSR/hydration, 0 NG050x, pointer/keyboard exactly-once, contracts, 97 import/SSR-import smokes and portfolio 92/94 remain the C5 functional evidence. Only ignored generated dist was cleaned and this report updated, so the full suite was not rerun merely for packaging.
8. **Hygiene and scope.** No commit, push, tag, release or npm publication. C5 changes remain uncommitted for review. The unrelated untracked `projects/ui-core/tree-table/public_api 2.ts` was neither modified nor staged and retains SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`. No symlinks or temporary package/consumer directories remain. No C6 runtime or roadmap batch was started.

**Final recommendation: C5 COMPLETE — READY FOR C6.** The package STOP was resolved by a bounded cleanup of ignored generated output and successful rebuild/pack/consumer verification. The remaining unfiltered ATTW styles classification is explicitly outside Kanban and remains visible as an existing package debt.
