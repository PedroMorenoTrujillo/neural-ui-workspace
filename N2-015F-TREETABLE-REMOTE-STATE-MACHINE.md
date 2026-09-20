# N2-015F — NeuTreeTable 2 remote roots/children state machine

## 1. Status

PASS. N2-015F is implemented and ready for review.

## 2. Starting checkpoint

`fd025149d2c87b59f2b4680f6333c74c67df0136` — `feat(tree-table): implement N2-015E hierarchical query`.

## 3. Scope

Only the private remote roots/children coordinator, its facade integration, retry bridge, directed tests, SSR/hydration fixture, performance/bundle baselines and this report were added. N2-015G and N2-011K were not started.

## 4. Single remote channel

`dataRequest` remains the only remote transport output. There is no HTTP, Promise/Observable transport, cache, viewport channel or secondary root/child output.

## 5. Request union

The existing closed `roots | children` union is used unchanged. Roots use `initial | query | page | retry`; children use `expand | query | retry`.

## 6. RequestId

IDs are monotonic and instance-local, start at `1`, never use time/randomness and are retained across client/remote transitions. Two instances start independently at `1`.

## 7. Query/tree revisions

The coordinator fingerprints the applied query structurally. It seeds the initial query revision from `hierarchy.queryRevision`, increments only for a semantically different applied query, and carries query, hierarchy and relation revisions in every request.

## 8. Root request state

Remote browser + unsatisfied roots emits one request. Current loaded/partial, loading and error roots do not auto-emit. Client and SSR emit zero.

## 9. Child request state

Only known, applied-expanded exact-K nodes are candidates. An unloaded/absent or stale relation emits one children request; a current loaded/partial, loading or error relation does not.

## 10. Expansion acceptance ordering

The renderer still emits only `expandedKeysChange`. A request is derived only after the parent writes the key into applied `expandedKeys`; rejected proposals emit zero requests.

## 11. Query acceptance ordering

Query UI emits only `queryChange`. A root query/page request, plus query invalidation requests for applied-expanded children, occurs only after a semantically different applied `query` is observed.

## 12. Satisfied roots

Preloaded/hydrated current roots are accepted without a local request. After this instance emits for roots, a loaded response is current only when its `appliedRequestId` matches the latest acceptable roots request.

## 13. Satisfied children

The same rule is branch-local: preloaded current children are accepted; after emission, the relation must correlate to the latest request for that exact parent K.

## 14. Partial relations

`loaded + partial` is a current loaded-only presentation snapshot, never a claim of global completeness. Root continuation is expressed by the frozen root page query. P1 defines no child cursor/range request, so F does not invent automatic “load more” for partial children; the parent may replace the applied relation, and explicit retry remains failure recovery rather than pagination.

## 15. Loading

Current applied loading suppresses duplicate emission. Loading from an older query revision cannot suppress the accepted new query request.

## 16. Error

Current applied error produces no automatic loop. An old-query error is stale and does not block a new accepted query request.

## 17. Retry

`retryData()` uses `dataRequest`, increments a private per-branch retry generation and always allocates a new request ID. There are no timers or backoff.

## 18. Root retry

`retryData({kind:'roots'})` emits exactly one roots request with `reason:'retry'` in remote browser mode.

## 19. Child retry

`retryData({kind:'children', parentKey})` emits exactly one children request for a known exact-K parent, without requiring another expansion proposal.

## 20. Correlation

The private footprint is `kind/parent + queryRevision + hierarchyRevision + relationRevision + retryGeneration`. Applied correlation uses `appliedRequestId` after a local request exists.

## 21. Stale request

Older query revisions or an older applied request ID never become current by matching data contents. No content heuristic is used.

## 22. Out-of-order

An older applied response does not satisfy a newer branch request. A new relation/hierarchy revision can create a new request; unchanged stale state remains deduplicated.

## 23. Concurrent parents

Expanded parents are evaluated independently and can emit multiple children requests in one coordinator transition. There is no singleton/global state.

## 24. Same-parent dedupe

Repeated computed reads, rendering, collapse/re-expand and reconstructed arrays with the same footprint emit zero duplicates.

## 25. Root dedupe

The same unsatisfied roots footprint emits once. A changed revision or explicit retry creates a new footprint.

## 26. Collapse pending

Collapse does not cancel transport or mutate response state. Correlation is retained while the parent still exists, so re-expanding the same pending branch does not duplicate.

## 27. Removed parent pending

Branch correlation/retry records are pruned when the parent K no longer exists in the normalized hierarchy. No parent key remains after destroy.

## 28. Mode transition

Client mode emits nothing and clears remote branch dedupe. Re-entering remote evaluates current applied state afresh while preserving monotonic request IDs.

## 29. Client bypass

Client mode never calls `dataRequest`.

## 30. Remote query semantics

The N2-015E local query pipeline remains bypassed in remote mode. Backend-applied order and loaded relations are projected; no local global-result claim is made.

## 31. Selection coexistence

Requests never write selection. Parent-applied children recompute existing loaded-subtree selection by exact K; unloaded descendants are not invented.

## 32. Focus coexistence

The request coordinator never moves focus. Existing deterministic focus reconciliation handles parent-applied hierarchy replacement.

## 33. Expansion coexistence

Requests never write `expandedKeys`; applied expansion is only an input to request eligibility.

## 34. Pure coordinator

`internal/remote/neu-tree-table-remote.ts` is framework-free. Reducer/retry/destroy operations return a new ephemeral state and request list without mutating inputs.

## 35. Signal graph

Applied inputs → computed normalized hierarchy → computed remote snapshot → one request effect → `dataRequest`. No state-sync effect exists.

## 36. Writable state

Only permitted ephemeral transport state exists: next ID, semantic query fingerprint/revision, per-branch request fingerprints and retry generations. There is no writable mirror of data, hierarchy, query, expansion or relations.

## 37. Effects ledger

Candidate total: exactly three effects — structural diagnostics, focus reconciliation and remote request coordination. F adds exactly one.

## 38. Angular 22 signals-first audit

PASS: zero decorators for inputs/outputs, EventEmitter, `model()`, lifecycle hooks/interfaces, NgZone, ChangeDetectorRef, Zone.js, Forms/CVA, Subject stores and writable input mirrors.

## 39. SSR

Real Angular SSR renders deterministic treegrid markup and emits zero root/child requests.

## 40. Hydration satisfied

Hydrated current roots emit zero requests and reuse the SSR DOM.

## 41. Hydration unsatisfied

An unsatisfied remote roots fixture emits exactly one browser request after hydration, never on the server.

## 42. First interaction after hydration

Applying expansion for an unloaded child relation emits exactly one children request after hydration.

## 43. Exactly-once matrix

Initial unsatisfied roots: 1; satisfied roots: 0; rejected expansion/query: 0; accepted unloaded expansion: 1; accepted query/page: 1 roots plus applicable expanded branches; current loading/error: 0; explicit retry: 1; repeated render: 0.

## 44. Immutability

Frozen snapshots remain unchanged. The coordinator never mutates T, query, hierarchy, roots, child relations, expanded keys or relation arrays.

## 45. Request payload typing

Positive compile fixtures now instantiate both roots and children payloads with all frozen correlation fields. The existing negative suite still rejects all 11 invalid shapes.

## 46. Currentness tests

Directed tests cover correct response IDs, stale IDs, relation revision changes, query invalidation, out-of-order state, exact string/number K and independent instances.

## 47. Root performance

100 root transitions: p50 `0.6258 ms`, p95 `1.1608 ms`.

## 48. Child performance

100 child transitions: p50 `0.6106 ms`, p95 `0.9614 ms`.

## 49. Concurrent performance

100 concurrent parents: p50 `0.0900 ms`, p95 `0.1052 ms`. 100 accepted query cycles: p50 `0.6015 ms`, p95 `0.8578 ms`.

## 50. Large totals

`total=1_000_000` with one loaded root: p50 `0.0051 ms`, p95 `0.0114 ms`; no placeholder or total-proportional allocation exists.

## 51. Lifecycle/resources

50 create/destroy cycles: p50 `55.4858 ms`, p95 `66.6185 ms`. 100 pure state destroys: p50 `0.1559 ms`, p95 `0.2048 ms`. Remote adds no timer, listener, observer, subscription or HTTP resource; destroy clears branch maps and suppresses late retry emission.

## 52. Bundle BASIC

`90,344 B raw / 18,136 B gzip / 15,316 B Brotli`.

## 53. Bundle remote

Roots and children consumers both measure `90,344 / 18,136 / 15,316 B` because the frozen single facade retains its core coordinator.

## 54. Bundle combined

`90,845 B raw / 18,305 B gzip / 15,429 B Brotli`.

## 55. Root-unused

PASS: `0 B raw` (`20 B gzip`, `1 B Brotli` empty-stream overhead).

## 56. Dependency graph

Private remote engine attribution is about `5.69 KB raw`. BASIC delta from E is `+6,674 B raw / +1,659 B gzip / +1,479 B Brotli`. Graph remains Angular common/core + candidate + approved neutral field/exact-key primitives; forbidden facade/router/HTTP/storage/Forms/PrimeNG edges are absent.

## 57. Candidate tests

PASS: 58 directed candidate behavior tests across 6 files, plus the dedicated performance spec.

## 58. Legacy regression

PASS: legacy TreeTable remains `76/76`; no legacy runtime or test was changed.

## 59. Types/contracts/ledger

PASS: positive types + 11 negative shapes, 4 contract tests, and exact legacy ledger `42 inputs / 21 outputs / 8 methods`.

## 60. Build/package

Production build PASS. Official package audit PASS (publint + ATTW with the repository's documented historical ignores). Package verification PASS: 431 files. Candidate remains isolated and unpublished.

## 61. API surface

Unchanged and exact: 66 public types, 11 directives, 1 component, 22 inputs, 12 outputs and 4 methods.

## 62. Regressions

No candidate, legacy, SSR/hydration, controlled-state, exact-K, focus, selection or query regression observed. Existing unrelated Menu NG8102 warnings remain untouched.

## 63. Risks

Partial child continuation remains intentionally outside P1 because no cursor/range contract exists. The coordinator is core and adds `1.659 KB gzip`; this is attributed and still keeps the candidate near the legacy basic reference without importing legacy runtime.

## 64. Git diff/status

E is committed at the starting checkpoint. F consists only of candidate runtime, fixtures/tests, gates, baselines and this report and remains uncommitted for review. No symlink, temp hydration folder or product entrypoint change is included.

## 65. Recommendation

**READY FOR N2-015G**
