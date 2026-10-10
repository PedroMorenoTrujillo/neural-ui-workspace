# N2-011G — NeuTable 2 Virtualization

Normative reference: [N2-TABLE2-VIRTUALIZATION-ADDENDUM.md](./N2-TABLE2-VIRTUALIZATION-ADDENDUM.md).

## 1. Status

PASS. N2-011G is complete and the recommendation is **READY FOR N2-011H**. N2-011H has not started.

## 2. Scope

Implemented fixed-height client and remote virtualization, viewport geometry, ranged remote coordination, imperative navigation, SSR/hydration coverage, and reproducible performance/bundle evidence. No legacy Table runtime was changed.

## 3. Virtual architecture

The single `<neu-table>` facade owns projections; the private semantic renderer owns DOM geometry only. There is no second Table component, public entrypoint, or alternate transport.

## 4. Fixed-height policy

`itemSize` is normalized to a finite positive value and applied to normal virtual rows. Variable-height rows, per-row measurement, expansion and editing remain out of scope.

## 5. Visible range

The browser derives the half-open visible range from `scrollTop`, viewport block size and fixed `itemSize`. SSR publishes `[0,0)` only as an internal non-measured value and emits no event.

## 6. Render range

Render is visible plus normalized overscan, clamped to the known logical total. Client SSR uses the deterministic bootstrap range from zero.

## 7. Request range

Remote request range aligns render range down/up to `effectiveRequestStep`, default 50, and clamps its end to a known total.

## 8. Half-open invariants

All visible/render/request/data ranges use `[start,end)`. Normalization guarantees integer `start >= 0` and `end >= start`; exhaustive boundary tests cover empty, exact-edge and non-covering cases.

## 9. Signal/ephemeral state

Writable state is restricted to browser activation, retry/version tokens, selection anchor and viewport geometry. It does not own query, data, selection, layout or metadata.

## 10. Effects ledger

Exactly two product effects exist: the existing facade request-coordination effect and one renderer viewport lifecycle effect. The executable renderer audit freezes this count.

## 11. Scroll listener

Each enabled virtual instance installs one passive viewport `scroll` listener. No row or global persistent listener exists.

## 12. Resize observer

Each enabled browser instance uses at most one viewport `ResizeObserver`; there is no observer per row. The observer is absent during SSR.

## 13. rAF/coalescing

Scroll/resize publications share one pending `requestAnimationFrame`. Cleanup cancels the pending handle; no timeout debounce is used.

## 14. Client virtualization

Client search/filter/sort runs over the complete normal-row result. Pagination is skipped in virtual mode, then only the render window is sliced.

## 15. Remote virtualization

Remote mode never runs the client query pipeline. It maps the one parent-owned contiguous `dataRange` into global logical indexes and requests uncovered aligned windows through `dataRequest`.

## 16. Client/remote boundary

Client owns local query evaluation; remote owns only correlation and safe presentation of parent data. No HTTP, cache or backend key lookup exists inside Table.

## 17. Pagination interaction

Virtualization wins when both modes are enabled: no slicing, paginator, page-size UI or page proposal. Applied `query.page/pageSize` remain unchanged and a deterministic dev diagnostic is issued once.

## 18. Pinned rows

Pinned start/end rows remain rendered outside the virtual normal-row domain. They do not consume virtual indexes, spacer size or request range.

## 19. Identity

Exact `K` identity remains authoritative. Window mounting keeps the existing stable track token and assigns global normal indexes after projection.

## 20. Selection

Selection stays parent-owned by key. Offscreen keys are not removed when their DOM rows unmount; selected mounted rows retain native `aria-selected` semantics.

## 21. All-matching

The symbolic all-matching selection contract is unchanged and independent from viewport coverage.

## 22. Range selection

Shift range selection remains limited to known rendered keys. No unloaded key is invented; backend-wide selection continues through all-matching.

## 23. Layout interaction

Column order, visibility, width and pin projections remain independent from virtual row slicing. Layout replacement does not own or rewrite scroll/query state.

## 24. DOM strategy

Native rows are mounted only for pinned rows plus the current render window. A 10,000-row client fixture reached at most 28 normal DOM rows.

## 25. Spacer strategy

Two optional native `<tr aria-hidden="true">` spacers carry block geometry. They have no key, selection, templates or announced data-row identity.

## 26. Native semantics

The implementation retains a real `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>` and `<td>` structure; no `div role=grid` substitute was introduced.

## 27. aria-rowindex

Mounted normal rows expose one-based positions derived from the global normal logical index. Pinned and spacer rows do not claim a logical index.

## 28. aria-rowcount

Client uses the complete queried normal count; remote uses authoritative `metadata.totalItems`. Pinned rows remain outside the count.

## 29. rangeChange

`rangeChange` emits browser-only visible/render ranges and never transports data. Equal semantic ranges are suppressed even if pixel scroll events repeat.

## 30. Request coordinator extension

The F coordinator now tracks required/latest/pending/suppressed ranges. The same effect emits all `initial/query/viewport/retry` requests.

## 31. Initial virtual request

Remote browser activation produces at most one ranged initial request. Real measured range is used when available; deterministic bootstrap is the fallback.

## 32. Query + range coordination

A semantic query replacement increments revision once and emits one `reason='query'` request containing the current aligned range and unchanged complete query.

## 33. Viewport requests

Viewport requests keep the current query revision and consume one new request ID only when the current aligned range is uncovered.

## 34. Request dedupe

Satisfied coverage and a pending covering range both suppress duplicates. In the deterministic 1,000-event scroll run only 10 aligned requests were produced.

## 35. Range coverage

`doesNeuTableRangeCover()` implements half-open containment, including exact and empty boundaries, without data inspection.

## 36. Range alignment

Alignment is `floor(start/step)*step` and `ceil(end/step)*step`, with default step 50 and known-total clamping.

## 37. requestId/revision

Every actual transport increments request ID exactly once. Scroll never changes query revision; only semantic applied query change does.

## 38. dataRange

`data[0]` maps to `dataRange.start`. Expected length is `end-start`; mismatch never mutates metadata or creates placeholders.

## 39. Stale range responses

Currentness now requires revision, request ID and range coverage. A same-revision response that does not cover the required range is classified `stale-range`.

## 40. Out-of-order ranges

An older applied request ID remains stale even if its range happens to cover the viewport. Tests cover stale ID, stale range and current correlation.

## 41. Loading/error behavior

Loading/error remain parent-owned presentation. Unsatisfied stale rows are not presented as current and Table never writes metadata.

## 42. Retry/range behavior

Explicit retry always emits a new ID with the current aligned required range and same revision, even when current metadata is satisfied. Failed-range suppression prevents automatic loops until range/query/retry/current metadata changes.

## 43. scrollTo

Client index/key and remote explicit index/loaded key use deterministic `index*itemSize`. Invalid or unknown client keys are no-op; unloaded remote key is no-op with a dev diagnostic and no request-by-key protocol.

## 44. focusCell

Visible or known offscreen cells can schedule scroll, render and one-shot focus without polling. Hidden/unknown columns and unloaded remote keys return `false`.

## 45. SSR policy

SSR renders `[0,min(total,step))`, or `[0,step)` when total is unknown, emits neither `rangeChange` nor `dataRequest`, and never accesses browser geometry.

## 46. Hydration client

Real Chromium verified the 50-row SSR bootstrap, reuse of table/row nodes, post-hydration measured shrink to a bounded DOM, and no query/data outputs.

## 47. Hydration remote satisfied

Revision/request/range-correlated SSR data produced zero duplicate request after hydration.

## 48. Hydration remote unsatisfied

An SSR range outside bootstrap rendered no invented rows and produced exactly one ranged initial request after browser activation.

## 49. Hydration viewport request

Scrolling the satisfied remote fixture outside coverage produced exactly one aligned viewport request; subsequent query and retry produced the exact 1/2/3 request sequence.

## 50. Zoneless

All state transitions use signals and lifecycle callbacks under `provideZonelessChangeDetection()`. Real hydration passed with zero `NG050x`.

## 51. Lifecycle

Fifty-five create/destroy cycles verified no late range/request emission and coordinator destruction.

## 52. Listener/observer census

Per enabled instance: 1 scroll listener, 1 viewport observer, at most 1 pending rAF, 0 row observers and 0 global persistent listeners. The 55-cycle test observed 55 adds/removes and 55 observe/disconnect pairs.

## 53. Pure engine tests

Tests cover 0/1 row, sub-row/exact/partial viewport, negative/beyond-end/fractional scroll, large totals, invalid config, alignment, coverage, spacers and index/offset conversion.

## 54. Integration tests

The complete private candidate set passes: 15 spec files and 91 tests, including facade, pipeline, layout/selection, query UI, remote and virtualization.

## 55. 10k client performance

Top/middle/end slice p95 values are below 0.00015 ms in the stored deterministic baseline. DOM remains bounded and correct keys/indexes/selection were verified.

## 56. Remote 1M logical performance

The 1,000,000-row projection allocates no million-row structure and remains O(1); stored p95 is below 0.00004 ms.

## 57. DOM bound

The evidence target is visible rows plus twice overscan. The deterministic viewport used 20 visible plus 8 overscan = 28 maximum normal rows.

## 58. Pipeline recompute evidence

An instrumented sort accessor count is unchanged across client scrolls. Only virtual projection/window signals recompute.

## 59. Request performance

Stored request-decision p95 is about 0.00123 ms. Repeated aligned-window dedupe emitted 10 requests for 1,000 simulated scroll events.

## 60. Bundle basic

Non-virtual basic is 136,808 B raw / 23,788 B gzip / 20,177 B Brotli, +3,466 B gzip versus F.

## 61. Bundle client virtual

Client virtual is 136,874 B raw / 23,821 B gzip / 20,219 B Brotli.

## 62. Bundle remote virtual

Remote virtual is 136,927 B raw / 23,848 B gzip / 20,297 B Brotli.

## 63. Bundle combined

Combined is 137,191 B raw / 23,935 B gzip / 20,308 B Brotli, +3,481 B gzip versus F combined.

## 64. Bundle attribution

Source attribution is led by renderer (15,889 raw output bytes) and facade (11,454), with the virtual engine at 1,657. Isolated engine size is 2,068 raw / 835 gzip; the retained increase is the synchronous core geometry, template/spacer/a11y and lifecycle bridge, so splitting is not worth the complexity.

## 65. Root-unused

Root-unused remains exactly 0 raw bytes (compression framing only: 20 gzip / 1 Brotli).

## 66. Dependencies

No CDK, third-party virtual scroll, Router, Forms, HTTP, storage, TableCore, legacy Table, PrimeNG or icons were added. Package imports remain Angular core/common plus the existing private advanced-filter chunk.

## 67. A11y

Native headers, selected/disabled states, total/position attributes and focusable virtual cells are retained. Spacer rows are hidden and never masquerade as data.

## 68. Keyboard/focus

Existing selection/sort/filter controls continue to use native keyboard behavior. No spreadsheet navigation model was introduced; virtual focus restoration uses a single `afterNextRender` callback.

## 69. Type/contract gates

Types PASS; contract PASS; ledger PASS; renderer boundary/effect/symlink audit PASS; architecture PASS. Surface remains 66 types, 15 directives, 24 inputs, 14 outputs and 4 methods.

## 70. Legacy regressions

Directed legacy lazy/virtual, data controller, state, keyboard and final-parity suites pass: 5 files / 99 tests. Legacy runtime was not edited.

## 71. Build/package

Angular package build PASS and current package verification PASS (431 files). Candidate remains private; no public entrypoint switch occurred.

## 72. API surface

No new public type, directive, input, output or method was added. `dataRequest` remains the sole remote channel and `rangeChange` remains a domain event.

## 73. Regressions

No product regression is known. Existing unrelated Angular menu NG8102 warnings and legacy jsdom CSS-parser noise remain outside this phase.

## 74. Risks

Fixed-height correctness requires consumers to provide an `itemSize` compatible with rendered row content. Variable height, remote key-to-index lookup, sparse caching, expansion and editing remain deliberately deferred.

## 75. Git diff

The diff contains only G runtime, pure engine, renderer/facade integration, coordinator extension, directed fixtures/tests/audits, baselines, package scripts, normative addendum and this report. No symlink exists in the candidate.

## 76. Git status

Checkpoint `066933b` remains the clean F commit. G is intentionally left as uncommitted local changes because no explicit G commit was requested; no push/tag/release/publish occurred.

## 77. Recommendation

**READY FOR N2-011H**.
