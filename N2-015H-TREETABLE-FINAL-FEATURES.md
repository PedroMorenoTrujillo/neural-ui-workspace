# N2-015H — NeuTreeTable 2 final P1 features

## 1. Status

PASS. N2-015H is complete in the working tree and is ready for N2-015I review. No commit was created.

## 2. Starting checkpoint

`f5d08747385fba15eb7654a1588c62cfa64ddfcf` — `feat(tree-table): implement N2-015G virtualization` on branch `v2`.

## 3. Scope

Implemented the authoritative H scope: controlled editing, `rowAction`, client/delegated export, and private optional chunks. Tree drag/reparent/row reorder remains P3 and was not introduced. N2-011K remains blocked and was not resumed.

## 4. Editing owner

`editState` remains an applied parent input. NeuTreeTable owns only one ephemeral private draft/session and emits proposals through the already frozen outputs.

## 5. Edit session

The private session is identified by exact semantic `K` plus `columnId`. Reconstructed `T` instances with the same K preserve identity without object-reference coupling.

## 6. Draft

Draft values are private and immutable. They are not written into `T`, exported, selected as domain state, or exposed as a second applied owner.

## 7. Signal Forms/editor boundary

The default editor is a private deferred standalone component using Angular 22 Signal Forms (`form` and `FormField`). It is reached only through the edit command/template path and is absent from the initial bundle.

## 8. Validation

Synchronous column validation is evaluated against the draft. Invalid drafts stay local, expose the frozen validation presentation, and do not emit a commit proposal or `featureError`.

## 9. Commit

Commit builds an immutable consumer replacement proposal, emits exactly once, closes the local session token, and never mutates the applied row or collection.

## 10. Cancel

Explicit cancel emits exactly once and closes the session. A session hidden by collapse, filtering, query replacement, or row removal emits one `editCancel` plus one `editStateChange` with source `hidden`, even if the parent rejects the proposal.

## 11. Data replacement

Applied data replacement reconciles by exact K. A missing or no-longer-visible edited node closes deterministically; a reconstructed row with the same K remains addressable.

## 12. Query interaction

Accepted applied query changes drive the existing projection. If the edited node leaves that projection, the hidden-session rule applies. Rejected controlled proposals do not alter editing state.

## 13. Expansion interaction

Collapsing an ancestor can hide the editor and triggers one hidden cancellation. Expansion state is not mutated and no extra expansion proposal is emitted.

## 14. Virtual interaction

Virtual DOM unmount alone does not cancel or commit: the logical node remains in the applied visible projection and the session survives. Returning to the range restores the editor by K and column.

## 15. Remote interaction

Editing does not create a transport path. NeuTreeTable proposes consumer-owned row replacement only; remote persistence remains outside the component and `dataRequest` stays `roots | children`.

## 16. Selection interaction

Selection and editing remain independent controlled domains. Edit gestures do not synthesize selection changes and selection replacement does not mutate the draft.

## 17. Keyboard

F2 and Enter start editing on editable cells; editor Save/Cancel commands are exactly once. Existing row-focused treegrid navigation remains intact and interactive descendants are guarded from row-action leakage.

## 18. Focus

Completion or cancellation requests restoration through the existing renderer focus boundary. Virtual unmount does not invent a second focus owner.

## 19. Row actions

The existing `rowAction` output now covers click, double-click, keyboard and context-menu sources without carrying a DOM `Event`. A single bounded 200 ms disambiguation timer prevents a double-click from also becoming duplicate click actions; it is cleared on destroy.

## 20. Reorder semantics

Not implemented. The authoritative implementation plan classifies tree drag/reparent/reorder as P3, and the frozen P1 surface has no `rowReorder` output.

## 21. Cycle prevention

No reorder graph was added. Existing hierarchy normalization continues to diagnose and bound cycles; no gesture can create a new parent relation in H.

## 22. Disabled/invalid targets

Not applicable to reorder. Editing respects column editability and validation; row actions ignore interactive descendants and do not mutate disabled/applied domains.

## 23. Filter/sort interaction

Editing follows the applied logical projection. H does not modify the certified sibling sort or ancestor-path filter engines and does not add reorder semantics under either operation.

## 24. Virtual reorder

Not applicable: no row reorder exists in P1. Virtualization remains a presentation window over the logical visible sequence.

## 25. Remote reorder

Not applicable: no reorder transport or new request variant was added.

## 26. Export contract

`export(request): Promise<NeuTreeTableExportOutcome>` now executes through a private command-path loader. Each invocation owns its lifecycle; there is no global mutable export state and failures are outcomes rather than arbitrary throws.

## 27. Export scopes

Only the frozen scopes exist: `visible`, `loaded`, and `selected`. Visible uses the logical flattened result, loaded uses unique reachable domain rows in preorder regardless of collapse, and selected uses loaded rows addressed by the applied selection.

## 28. Hierarchy export semantics

CSV/XLSX/JSON use a flat domain-column projection. Private projection metadata, paths, synthetic hierarchy nodes, templates, indentation, expanders and details are excluded.

## 29. Virtual export

Export never treats mounted DOM rows as the logical dataset. `visible` spans the full logical visible projection, including virtual rows outside the current render window.

## 30. Remote export

NeuTreeTable exports only data it already owns. A remote scope requiring unknown rows delegates through the existing `exportRequest`; there is no hidden HTTP, backend enumeration, cache expansion or new `dataRequest` reason.

## 31. Selection export

Loaded selected K values resolve to unique domain rows. Unknown remote selected keys delegate instead of being invented or materialized.

## 32. Draft exclusion

Exports read applied committed `T` values only. An active private draft is never serialized and export does not force commit.

## 33. CSV

The private lazy CSV serializer preserves column/header order, deterministic UTF-8 text, BOM and CRLF policy, quoting, embedded quotes/newlines, empty/nullish values and Unicode.

## 34. JSON

The private lazy JSON serializer emits deterministic domain-column objects. It does not serialize Angular, DOM, event, template, renderer or private hierarchy state.

## 35. XLSX

The private lazy XLSX serializer writes a minimal workbook/worksheet ZIP without a third-party dependency. Cell types and headers are deterministic, and strings remain inline strings rather than formulas.

## 36. Formula safety

CSV prefixes strings beginning with `=`, `+`, `-` or `@` according to the frozen injection policy. XLSX never promotes consumer strings to formulas.

## 37. Dynamic chunks

Dynamic imports are invoked directly from the command path; no loading effect exists. The Signal Forms editor, CSV, JSON, XLSX and export runner are separate private chunks with no public entrypoint.

## 38. Export errors

Unsupported requests and serialization/loading failures return the frozen outcome. `featureError.feature='export'` is reserved for actual export feature failures and is not used for ordinary validation. A destroyed instance performs no late output or browser side effect.

## 39. Signal graph

Applied inputs feed existing computed hierarchy/query/selection/virtual projections. Editing adds only ephemeral session state; export captures one immutable applied snapshot per invocation.

## 40. Writable state

New writable state is limited to the private edit session, its draft/editor control, one closed-session token, and the bounded click timer handle. There is no mirror of data, hierarchy, query, selection, expansion, layout or export state.

## 41. Effects ledger

PASS: the product total remains exactly four effects—interaction/focus reconciliation, accepted remote request coordination, viewport lifecycle and existing applied-state coordination. H adds zero effects.

## 42. Angular 22 signals-first audit

PASS: no decorators, `EventEmitter`, `model()`, `NgZone`, `ChangeDetectorRef`, Zone.js or lifecycle-hook state synchronization. Inputs, outputs, view queries and editor form state use signals-first APIs.

## 43. Exactly-once

Directed unit, integration and real-browser hydration tests cover commit, cancel, hidden cancellation, action sources, delegated export and post-hydration export. No duplicate proposal, action, request or download was observed.

## 44. Immutability

Frozen fixtures pass. `T`, roots, relations, columns, query, expansion, selection and layout are never mutated; commit constructs a replacement row.

## 45. SSR

SSR remains deterministic and browser-global-free. Export chunks and the deferred editor are not loaded during module evaluation or server render, and SSR emits no requests or state echoes.

## 46. Hydration

PASS in real Chromium: DOM reuse, 0 NG050x, optional chunks absent initially, deferred Signal Forms editor loaded on first edit, JSON export/download exactly once, CSV/XLSX still unloaded, 0 viewport requests and no controlled-state echoes.

## 47. Zoneless

PASS with `provideZonelessChangeDetection()` and no Zone.js dependency.

## 48. Editing performance

Reproducible baseline for 100 edit-session operations: p50 `0.311 ms`, p95 `1.559 ms`. Projection context remains p50/p95 `0.111/0.239 ms` for 1k and `1.292/2.692 ms` for 10k rows.

## 49. Reorder performance

Not applicable because tree reorder is outside P1 and no reorder engine was introduced.

## 50. Export performance

Baseline p50/p95: CSV 1k `0.331/0.685 ms`, 10k `2.464/3.025 ms`; JSON 1k `0.481/0.694 ms`, 10k `3.924/4.479 ms`; XLSX 1k `4.095/6.987 ms`, 10k `41.596/42.454 ms`. Output sizes are recorded in the committed-style baseline artifact.

## 51. Lifecycle

100 create/destroy operations measure p50 `0.021 ms`, p95 `0.100 ms`. Pending click timers are cleared, deferred imports have no instance-global owner, and destroyed instances suppress late DOM/output work.

## 52. Resource census

Product totals remain one delegated interaction boundary, one viewport scroll listener, one ResizeObserver and at most one pending rAF. Existing query debounce timers remain two; H adds only one bounded click-disambiguation timer. No per-row listener, observer, timer, subscription or effect exists.

## 53. Static a11y

PASS: native table/treegrid semantics, row-focused identity, editor labels/errors, native buttons and existing ARIA ownership are preserved. Technical edit/export implementation does not add a public UI column.

## 54. Browser a11y

Real Chromium verifies editor activation, focus-safe completion, DOM reuse and exactly-once keyboard/action behavior without hydration diagnostics.

## 55. Bundle BASIC

`112,525 B raw / 22,485 B gzip / 19,049 B Brotli`. Against G BASIC (`99,991 / 20,053 / 16,950 B`), H adds `12,534 raw / 2,432 gzip / 2,099 Brotli`. The >5% gzip delta was investigated: it is core edit-session reconciliation, row-action routing, facade command plumbing and template bindings—not optional editor/serializer code. BASIC remains below the architecture target of 50 KB gzip.

## 56. Bundle editing

Initial editing consumer is the same `112,525 / 22,485 / 19,049 B`; the deferred Signal Forms editor is a separate `4,372 / 1,185 / 1,003 B` chunk.

## 57. Bundle reorder

No reorder code or chunk exists.

## 58. Bundle export

CSV, JSON and XLSX consumers retain the same initial BASIC size. The private export runner is `2,576 / 1,097 / 960 B`; format code remains outside initial load.

## 59. Optional chunks

CSV: `588 / 386 / 341 B`; JSON: `891 / 471 / 413 B`; XLSX: `3,972 / 1,425 / 1,280 B`; editor and export-runner sizes are recorded above. Values are raw/gzip/Brotli.

## 60. Combined bundle

Combined/templates initial: `113,229 B raw / 22,764 B gzip / 19,247 B Brotli`. Optional feature bodies remain dynamically separated.

## 61. Root-unused

PASS: `0 B raw` (compression container overhead only: 20 B gzip, 1 B Brotli).

## 62. Dependency graph

PASS: Angular core/common, candidate-private sources and approved neutral exact-key/value resolver only. No TreeTable legacy, NeuTable facade, TableCore, Router, Forms/CVA outside the private editor, HTTP, storage, PrimeNG or third-party grid edge. Serializers are tree-private to avoid changing certified NeuTable/package boundaries; a future neutral extraction remains optional and was not needed for H.

## 63. Candidate tests

PASS: 80/80 across 10 files, covering editing, hidden/virtual behavior, action sources, export scopes/formats/errors, destroyed lifecycle and 100 create/destroy cycles while preserving B–G tests.

## 64. Legacy regression

PASS: TreeTable 1.x remains 76/76 across 3 files and its runtime is unchanged.

## 65. Types/contracts/ledger

PASS: positive/negative type consumer, 4/4 contract tests, 42-input/21-output/8-method legacy ledger and boundary audit. The public domain remains closed and no alias or arbitrary `any` was added.

## 66. Build/package

PASS: production build, package audit, publint, ATTW and package verification (431 files). The candidate remains internal and unpublished. Only the pre-existing unrelated Menu NG8102 warnings remain.

## 67. API surface

Unchanged and exact: 66 public types, 11 directives, 1 component, 22 inputs, 12 outputs and 4 methods. No `rowReorder`, compatibility alias, component, directive, type or entrypoint was added.

## 68. Regressions

No candidate, legacy, SSR/hydration, zoneless, package, contract, API, dependency or bundle-boundary regression was found. No shared NeuTable runtime was modified.

## 69. Risks

The click/double-click distinction intentionally adds up to 200 ms latency for single-click row actions. XLSX serialization remains in-memory and therefore scales with exported loaded data; remote unknown data is delegated rather than enumerated. Tree reorder remains explicitly deferred.

## 70. Git diff/status

The diff is limited to the candidate facade/renderer, private editing/export features, H fixtures/tests/scripts, reproducible baselines and this report. `git diff --check` passes; the repository has zero tracked symlinks and the H change set adds zero symlinks or temporary hydration/build directories. H remains uncommitted for review.

## 71. Recommendation

`READY FOR N2-015I`.

Do not start N2-015I and do not resume N2-011K in this phase.
