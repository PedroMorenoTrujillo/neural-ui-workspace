# N2-011F — NeuTable 2 Remote Request State Machine

## 1. Status

PASS. N2-011F is implemented and remains isolated from N2-011G.

## 2. Scope

Implemented only remote request coordination, IDs/revisions, initial/query/retry decisions, response correlation, stale presentation protection, SSR/hydration semantics, directed tests, performance and bundle evidence. Viewport runtime and virtualization remain deferred.

## 3. Remote ownership

`data`, `metadata`, transport, cache, cancellation and response acceptance remain parent-owned. NeuTable performs no HTTP and never mutates parent remote state.

## 4. Single transport channel

`dataRequest` remains the sole transport output. No lazy/server/page/sort/filter alternative channel was added.

## 5. Request effect

One Angular `effect` is the thin bridge from applied inputs plus explicit retry token to the framework-free coordinator. Its only external side effect is emitting a coordinator-produced `dataRequest`.

## 6. Effects ledger

N2-011F consumes effect 1/4: request coordination. Viewport, focus restoration and optional feature loading remain unused by this phase. There are no separate initial, retry, loading or metadata effects.

## 7. Internal coordinator

`internal/remote/neu-table-remote-coordinator.ts` is framework-free and deterministic. It exposes create, transition, correlation and destroy operations; transitions return either no request or the frozen `NeuTableDataRequest<F>`.

## 8. Mutable internal transport state

The facade owns one private coordinator snapshot. Its fields are browser activation, current data mode, destroyed flag, latest emitted request ID for the current revision, next request ID, previous semantic query snapshot, current query revision and consumed retry token. A private version signal only invalidates derived correlation rendering; none of these fields is public applied domain state.

## 9. Query semantic equality

The coordinator reuses `areNeuTableQuerySlicesEqual`, including normalized sort policy and configured filter-value equality. Reference churn and reconstructed equal objects are deduplicated without `JSON.stringify`.

## 10. Query revision

The first observed applied query is revision 0. Each observed semantic applied change increments exactly once. Same-query replacement and retry do not increment.

## 11. Request IDs

IDs start at 1, increment per emitted request and are local to each table instance. They use no time, random value, UUID or persistence. SSR allocates none.

## 12. Initial request

Browser activation or remote entry emits one `initial` only when the current applied remote state is not satisfied. Re-running the effect or writing response metadata does not repeat it.

## 13. Client mode

Client mode always emits zero `dataRequest`, including query, data, metadata, selection, layout and appearance changes.

## 14. Client→remote

Entry uses the current applied query. Satisfied metadata suppresses the request; otherwise exactly one `initial` is emitted.

## 15. Remote→client

Exit emits nothing and performs no cancellation. External transport remains consumer-owned.

## 16. Remote re-entry

Re-entry repeats the same satisfaction decision for the current query and metadata: zero if satisfied, one `initial` if not.

## 17. Applied query request

An observed semantic query change while remote emits exactly one `query` request with the incremented revision and full applied query.

## 18. Rejected proposal

UI proposals only emit `queryChange`. If the parent does not update `query`, the request coordinator sees no applied transition and emits nothing.

## 19. Accepted proposal

After the parent writes the proposed query, the request effect emits once. Integration evidence records `queryChange` before `dataRequest:query`.

## 20. RetryData

`retryData()` is now functional only in browser remote mode. It emits a new request ID with the same query and revision and reason `retry`; client and destroyed instances are no-ops.

## 21. Retry UI

The default error presentation now renders one native button using `labels.retry`; it delegates to the same `retryData()` path. Custom error templates retain the existing retry callback context.

## 22. No automatic retry

Error and loading metadata never produce retry. No timer, backoff, connectivity listener or retry counter exists.

## 23. Overlapping requests

The coordinator does not wait for completion. A newer applied query can emit its request while an older consumer request is still pending.

## 24. Metadata ownership

Audit confirmed the frozen fields are sufficient: `totalItems`, `loading`, `error`, `queryRevision`, `appliedRequestId` and optional future `dataRange`. No field was added.

## 25. Loading

Loading remains parent-owned presentation state with the existing `role="status"`. Emission does not set or announce loading.

## 26. Error

Error remains parent-owned presentation state with `role="alert"`. Writing or reconstructing error metadata emits no request.

## 27. Total

`metadata.totalItems` remains authoritative in remote mode. Total-only writes update presentation and emit nothing.

## 28. Response write behavior

Data writes are not dependencies of the request effect. Metadata writes are observed only for activation/entry satisfaction and otherwise produce no request, preventing request→loading→request loops.

## 29. Correlation contract

For N2-011F, satisfaction is exactly `metadata.queryRevision === currentQueryRevision && metadata.appliedRequestId !== null`. Currentness uses those same fields; range coverage is intentionally deferred to N2-011G.

## 30. Stale responses

Metadata with a different revision, or with an applied request ID older than the latest locally emitted ID for that revision, is stale. NeuTable does not mutate or correct it; derived presentation excludes the stale data/metadata pair.

## 31. Current responses

A matching revision with a non-null request ID not older than the latest emitted ID is current. A matching revision with null ID is unresolved: it may render supplied initial presentation but does not suppress an unsatisfied browser initial request.

## 32. Request deduplication

Same reference, semantic clone, response metadata, effect stabilization and synchronous final-state observation do not duplicate requests. No transport debounce or timer was introduced.

## 33. QueryChange/dataRequest ordering

The UI handler emits the proposal first. Only a later applied input transition can emit transport. The integration log asserts this order explicitly.

## 34. Sort remote

Accepted sort uses one `query` request; rejected sort uses zero. Remote rows are never locally sorted.

## 35. Search remote

Only an applied search change requests. Draft edits and rejected proposals remain ephemeral.

## 36. Filter remote

Only an applied filter AST change requests. Filter drafts and menu/builder interaction do not touch transport.

## 37. Pagination remote

Applied page and page-size changes each use the same single `query` channel. Total changes do not correct query or request again.

## 38. Selection independence

Selection input/proposals are absent from effect dependencies and emit no transport.

## 39. All-matching independence

All-matching selection changes remain local controlled selection semantics and never enumerate or request backend rows.

## 40. Layout independence

Resize, reorder, visibility and pinning remain absent from remote coordination.

## 41. Range/viewport deferred

N2-011F emits no `viewport`, no request `range` and no `rangeChange`. N2-011G remains the sole owner of viewport runtime.

## 42. SSR

The platform boundary plus post-render browser activation keeps the request machine inactive during server rendering. The real SSR fixture records zero requests for satisfied, unsatisfied, error and loading remote tables.

## 43. Hydration satisfied

SSR metadata with revision 0 and non-null applied request ID satisfies the initial applied query. Hydration reuses the DOM and emits zero duplicate initial requests.

## 44. Hydration unsatisfied

Matching revision with null applied request ID is unsatisfied. After browser activation the real fixture emits exactly `B:initial:1:0` once.

## 45. Hydration query acceptance

The real Chromium fixture rejects the first sort proposal with no request, accepts the second via parent query write, then emits exactly `B:query:2:1`.

## 46. Hydration retry

The same hydrated instance emits exactly `B:retry:3:1`; the revision is unchanged and there is no duplicate activation.

## 47. Zoneless

Unit/integration and real hydration gates run with `provideZonelessChangeDetection()` and no Zone.js orchestration.

## 48. Lifecycle/cleanup

Angular owns effect and `afterNextRender` cleanup. `DestroyRef` marks the pure coordinator destroyed; a directed component test confirms `retryData()` cannot emit afterward. No timer, listener or subscription is retained.

## 49. Pure state-machine tests

Eight framework-free tests cover initial/satisfied/server activation, semantic equality, revisions/IDs, retry, modes/re-entry, correlation, 1k metadata updates, rapid transitions and destroy.

## 50. Integration tests

Eight real NeuTable integration tests cover initial, accepted/rejected ordering, search/filter/page/pageSize, dedupe, selection/layout/all-matching, retry method/UI, mode transitions, stale rendering and destroy.

## 51. QueryRevision matrix

Observed sequence: initial 0; semantic change 1; retry 1; equal replacement 1; next semantic change 2. Selection, layout, data, metadata and appearance leave it unchanged.

## 52. RequestId matrix

Observed sequence: initial 1; query 2; retry 3; next query 4. Rejected proposals, SSR, equal query, client mode and metadata writes consume none.

## 53. Correlation tests

Tests cover current request/current revision, old request at the same revision, old revision, response after newer query, retry response, null unresolved ID and reconstructed metadata objects without data-content heuristics.

## 54. Performance

Stored 25-sample p50/p95 evidence includes initial, same-query, query request, retry, metadata response, semantic equality and 1k metadata updates. Representative p95: initial 0.00046 ms, query request 0.00058 ms, retry 0.00053 ms and 1k metadata updates 0.329 ms; metadata and viewport request counts are zero.

## 55. Recompute evidence

The request effect reads browser activation, mode, query, metadata, retry token and semantic-equality policies only. Data, selection, layout, appearance, DOM and drafts are excluded. Remote branches continue bypassing client search/filter/sort/pagination; metadata storms emit zero requests.

## 56. Bundle client

Client-basic is 120,636 B raw / 20,322 B gzip / 17,332 B Brotli, +922 B gzip over E basic. Runtime-configurable `dataMode` means the small coordinator remains reachable.

## 57. Bundle remote

Remote-basic is 120,636 B raw / 20,322 B gzip / 17,321 B Brotli.

## 58. Bundle retry/error

Remote + retry/error is 120,696 B raw / 20,364 B gzip / 17,331 B Brotli.

## 59. Bundle combined

Combined is 120,935 B raw / 20,454 B gzip / 17,401 B Brotli, +911 B gzip over E combined.

## 60. Bundle attribution

The isolated coordinator is 1,638 B raw / 600 B gzip / 550 B Brotli. The remaining delta is the Angular effect/platform bridge, correlation-derived presentation and native retry wiring. This is small CORE cost and not worth a new entrypoint/component split.

## 61. Root-unused

Root-unused remains 0 B raw. Compressed empty-buffer framing is not counted as retained code.

## 62. Dependencies

Product changes use Angular core/common plus private NeuTable candidate files. There is no HttpClient, common/http, Forms, Router, CDK transport, RxJS orchestration, storage, Table 1.x, TableCore or PrimeNG dependency.

## 63. A11y loading/error/retry

Loading keeps polite status semantics; error keeps alert semantics. Retry is a native `type="button"` with the frozen accessible label, one click handler and no synthetic double activation.

## 64. URL-state compatibility

No Router import or URL owner exists. A URL adapter may accept `queryChange`, update URL/app state and then write `query`; only that final applied write requests.

## 65. Type/contract gates

`test:n2-table-types`, `test:n2-table-contracts`, `audit:n2-table-ledger`, package-private boundaries and architecture audit pass. The sole remote channel and controlled query owner remain intact.

## 66. Legacy regressions

Directed legacy lazy-data, lazy-virtual and final-parity controller/integration suites pass: 4 files, 53 tests. Table 1.x and TableCore product code were not changed.

## 67. Build/package

The full library build passes. Package verification passes with 431 files. The candidate remains private and the public entrypoint is unchanged.

## 68. API surface verification

The executable contract gate still freezes 82 exported symbols: 66 public types, 15 directives and one component; the component remains exactly 24 inputs, 14 outputs and 4 methods. Only existing `retryData()` gained behavior.

## 69. Regressions

All 12 NeuTable 2 directed spec files pass (64 tests after the final destroy case), real hydration passes and bundle/performance baselines pass. The only build warnings are the two pre-existing unrelated menu NG8102 diagnostics.

## 70. Risks

Consumers must still apply data+metadata atomically and discard stale transport responses. N2-011G must extend satisfaction/currentness with frozen range coverage without adding another effect or channel. Request IDs remain per client instance and are not a server-persisted namespace.

## 71. Git diff

The diff adds the private coordinator, request bridge, stale derived presentation, retry button, pure/integration/performance tests, four-scenario hydration evidence, F bundle/performance harnesses and baselines, plus compatibility updates to E/B-era assertions. No symlink was created.

## 72. Git status

The worktree contains only the N2-011F implementation/evidence changes listed above. It is intentionally left uncommitted because the N2-011F authorization says local commit only when explicitly requested.

## 73. Recommendation

**READY FOR N2-011G**

Do not begin N2-011G until separately authorized.
