# N2-015I — NeuTreeTable 2 final certification

## 1. Executive status

`CERTIFIED FOR N2-011K`. All frozen P1 behaviors are implemented independently of TreeTable 1.x, Table 1.x, TableCore and the NeuTable facade. No P2/P3 capability was added.

## 2. Certified checkpoint

N2-015H is closed at `037e46bb2294414a32a8127c52eb50d86b10d59b` (`feat(tree-table): implement N2-015H final P1 features`), whose exact parent is `f5d08747385fba15eb7654a1588c62cfa64ddfcf`.

## 3. Scope

Certification only: final behavioral, contract, browser, SSR/hydration, performance, bundle, package, migration and removal-readiness evidence. I changes only certification tests/scripts, a typed migration fixture, reproducible bundle artifacts and this report; product runtime is unchanged.

## 4. API freeze

PASS: 66 public types, 11 standalone directives, one `NeuTreeTableComponent<T,K,F>`, 22 inputs, 12 outputs and four methods. No alias, wrapper, secondary entrypoint, `any` escape or public surface growth.

## 5. Angular signals-first audit

PASS: zero `@Input`, `@Output`, `EventEmitter`, controlled `model()`, legacy lifecycle methods/interfaces, `NgZone`, `ChangeDetectorRef`, Zone.js, CVA, Subject/BehaviorSubject store and writable applied-state mirror. The boundary audit covers 22 product files; Signal Forms appears only in the private deferred editor.

## 6. Ownership matrix

| Domain | Applied owner | Proposals/events | Derived/local category |
| --- | --- | --- | --- |
| data/domain nodes | `data` input | none | normalized hierarchy computed |
| hierarchy/roots/children | `hierarchy` input | `dataRequest` domain event | diagnostics/projection computed |
| query | `query` input | `queryChange` | query pipeline computed |
| expansion | `expandedKeys` input | `expandedKeysChange` | transient filter reveal computed |
| selection | `selection` input | `selectionChange` | membership/indeterminate computed |
| editing | `editState` input | `editStateChange`, `editCommit`, `editCancel` | one ephemeral draft/session |
| columns/layout options | inputs | `layoutChange` | visible/projected columns computed |
| remote metadata | hierarchy/query inputs | `dataRequest` | ephemeral request correlation |
| virtual geometry | options input | `rangeChange` | ephemeral viewport/range |
| focus | no applied domain owner | `focus()` command/keyboard intent | ephemeral exact-K roving focus |

Every applied domain has exactly one consumer-owned input.

## 7. Effects ledger

PASS: exactly four product effects, each with one legitimate side-effect responsibility: structural diagnostic emission, focus/projection reconciliation, remote request coordination and viewport lifecycle. There is no query, selection, expansion, edit, data or export synchronization effect.

## 8. Hierarchy engine

PASS: exact string/number K, ordered roots/children, single parent, iterative deep traversal, stable path/depth/sibling metadata, reconstructed identities and immutable inputs. A depth-1000 chain and 10k wide tree pass without unsafe recursion or quadratic behavior.

## 9. Malformed hierarchy

PASS: cycle, duplicate semantic K, duplicate parent, missing root/node, orphan and duplicate child produce deterministic bounded diagnostics. The pure engine never mutates or auto-repairs consumer state; the facade deduplicates `featureError.feature='hierarchy'`.

## 10. Flatten projection

PASS: one canonical pipeline—normalized hierarchy + sibling query + transient ancestor reveal + applied expanded keys → visible depth-first projection. There is no parallel flatten engine or DOM-derived projection.

## 11. Expansion

PASS: immutable exact-K proposals; accept/reject, pointer and keyboard paths; no echo; unloaded expansion does not request until the parent applies it. Accepted unsatisfied expansion correlates exactly one children request.

## 12. Keyboard

PASS for ArrowUp/Down, logical forward/backward, LTR/RTL physical mapping, Home/End, Space, Enter, F2, Escape, editor isolation, interactive descendants and virtual cross-window focus. Unsupported row reorder keys are N/A by contract.

## 13. Focus

PASS: row-focused treegrid, one roving tab stop, empty-container target, no initial focus theft, exact-K restoration across reconstruction/reorder, ancestor/neighbor/container fallback and virtual mount bridging.

## 14. Selection

PASS: none/single/multiple/checkbox, exact K, visible range, toggle-all, disabled boundaries, collapsed loaded descendants and preservation of parent-applied unknown keys. There is no backend enumeration.

## 15. Propagation

PASS: propagation is loaded-subtree only. Partial/unloaded relations remain honestly indeterminate; disabled nodes are propagation/aggregation boundaries. No symbolic remote subtree selection was added.

## 16. Query/search/filter

PASS: search; all 17 frozen rules; nested AST; matches plus ancestor paths; transient reveal; exact expansion restoration after clear; immutable proposals; and remote bypass. Hidden selected keys stay applied.

## 17. Sort

PASS: stable single/multi sibling sort, nullish handling, custom comparator and remote ownership. Hierarchy is never destroyed by global flatten sorting.

## 18. Remote state machine

PASS: one `dataRequest` channel with roots/children discriminants, client bypass, explicit retry, dedupe and concurrent-parent isolation. NeuTreeTable owns no HTTP, backend cache or response writes.

## 19. Request correlation

PASS: requestId, query revision, hierarchy revision, parent K and relation revision reject stale/out-of-order responses without data-content heuristics. Rejected expansion/query proposals produce zero request.

## 20. Virtualization

PASS: fixed height, loaded-visible indexes, half-open ranges, overscan, native-table spacers, client and remote-loaded modes, scroll/focus commands, query shrink and expansion-length changes. Virtual activation emits no viewport transport request.

## 21. DOM bound

PASS: 10k logical visible nodes mount at most 32 rows in the certified geometry. A backend total of 1,000,000 creates no proportional placeholder array, DOM, key list or offset table. One thousand scroll updates execute hierarchy normalization 0 times and query evaluation 0 times.

## 22. Editing

PASS: applied `editState`, one exact-K/column session, private draft, deferred Signal Forms editor, validation, immutable commit, cancel, exactly-once hidden cancellation, reconstruction, selection isolation, focus restore and virtual-unmount survival. T remains unmodified.

## 23. Row actions

PASS: click, double-click, keyboard and context-menu emit data-only `rowAction` exactly once; interactive descendants are guarded and destroy clears pending work. The deliberate single-click disambiguation latency is 200 ms.

## 24. Row reorder P3 classification

Tree drag/reparent is `OUT OF SCOPE/P3` (Prime F-104). There is no `rowReorder` output or engine; its absence is not a P1 gap. Column layout reorder remains the controlled layout concern.

## 25. Export

PASS: CSV/JSON/XLSX; visible/loaded/selected; logical virtual rows; committed T only; remote unknown-key delegation; independent invocations; destroyed-instance failure; formula safety; and no DOM scraping, hidden transport or backend enumeration.

## 26. Optional chunks

PASS: active editor, export runner, CSV, JSON and XLSX are private dynamic chunks reached only by command/deferred paths. No public optional-feature entrypoint exists.

## 27. Native semantics

Real Chromium and integration tests confirm native `table/thead/tbody/tr/th/td` plus treegrid roles/ARIA and valid spacer rows. No div-treegrid fallback exists.

## 28. Static a11y

PASS for accessible treegrid name, column headers, level/expanded/posinset/setsize, selected/multiselectable, rowindex/rowcount, checkbox/radio state, sort, query, loading/error/empty, editor validation and one roving focus target. No conflicting ARIA was found.

## 29. Browser a11y

Real Chromium validates native semantics, roving focus, controlled keyboard/action paths, virtual row counts, applied states, deferred editor and hydration reuse. `axe-core` and `@axe-core/playwright` are not installed, so no axe result is claimed.

## 30. Keyboard matrix

| Key/gesture | Frozen result | Status |
| --- | --- | --- |
| ArrowUp/Down | previous/next visible row | PASS |
| logical forward/backward | expand/first child or collapse/parent | PASS |
| ArrowLeft/Right | mapped through LTR/RTL | PASS |
| Home/End | first/last logical visible row, virtual-aware | PASS |
| Space | selection intent | PASS |
| Enter | row action or edit according to cell capability | PASS |
| F2 | begin editable cell | PASS |
| Escape | cancel editor | PASS |
| editor descendants | editor owns keystroke | PASS |
| virtual cross-window | mount then focus exact K | PASS |

## 31. SSR matrix

PASS: basic, nested/applied expansion, selection, query, satisfied/unsatisfied remote, virtual, applied edit state, loading, error and empty render deterministically through Angular SSR. Optional chunks remain unloaded and every SSR scenario emits zero `dataRequest` or controlled proposal.

## 32. Hydration matrix

PASS in real Chromium: server DOM reused, zero NG050x, zero initial proposals, satisfied state produces no duplicate request, unsatisfied roots produce one browser request, accepted query/expansion/retry are exactly once, virtual activation produces zero viewport request, and first edit/export lazily loads exactly once.

## 33. Zoneless

PASS under Angular 22.1.6 with `provideZonelessChangeDetection()`. No Zone.js, mark/detect architecture or OnPush compatibility boilerplate is used.

## 34. Browser matrix

Chromium executable is installed and passes the real certification. Playwright Firefox and WebKit executables are absent locally; that limitation is recorded and no result is fabricated. Their absence is not a frozen certification blocker.

## 35. Exactly-once matrix

| Output | Trigger | Expected | Parent echo/hydration |
| --- | --- | ---: | --- |
| `queryChange` | search/filter/sort/page gesture | 1 | no echo; 0 initial |
| `expandedKeysChange` | pointer/keyboard toggle | 1 | request waits for acceptance; 0 initial |
| `selectionChange` | row/indicator/keyboard/toggle-all | 1 | no autocorrection; 0 initial |
| `layoutChange` | controlled layout intent | 1 | no applied mirror; 0 initial |
| `editStateChange` | begin/commit/cancel/hidden | 1 | closed local token prevents repeats |
| `dataRequest` | accepted unsatisfied roots/children/retry | 1 | 0 SSR; satisfied hydration 0 |
| `rangeChange` | semantic range transition | 1 | no transport; deterministic bootstrap |
| `rowAction` | click/double/keyboard/context | 1 | interactive descendants guarded |
| `editCommit` | valid save | 1 | immutable value proposal |
| `editCancel` | explicit/hidden/destroy | 1 | no late output after destroy |
| `exportRequest` | unavailable remote data | 1 | no hidden enumeration |
| `featureError` | stable structural/feature failure | 1 per diagnostic | deduped across hydration/recompute |

## 36. Recompute matrix

| Independent change | Recomputed stages |
| --- | --- |
| focus | focus/renderer only |
| selection | membership/indeterminate + renderer |
| expanded keys | flatten/projection + focus reconciliation; remote check after acceptance |
| query | query pipeline + projection + accepted remote coordination |
| hierarchy | normalization + query/projection + diagnostics/remote |
| remote metadata | request reducer and affected projection status |
| scroll | virtual range/render window only |
| edit draft | editor/session validation only |
| export invocation | immutable snapshot + selected lazy serializer only |

Instrumentation confirms 1,000 scrolls cause zero hierarchy and zero query executions; no mega-computed regression was observed.

## 37. Immutability

Deep-frozen fixtures pass for T, roots, child relations, hierarchy metadata, query/sort/filter AST, expansion, selection, columns, edit state, options and remote metadata. All proposals are new snapshots.

## 38. Lifecycle

Evidence covers 100 virtual create/destroy lifecycles, 100 editing/action lifecycles, 100 expansion/navigation cycles, 100 selection gestures, 100 query transitions, 100 remote transitions, 100 edit operations and at least 60 serializer invocations across the three formats. After destroy there are zero late public outputs.

## 39. Resource census

Per instance maximum: one delegated interaction boundary, one scroll listener, one ResizeObserver, one pending rAF, zero row observers, two bounded query debounce timers and one bounded click-disambiguation timer. Cleanup tests pass; no persistent global listener or subscription exists.

## 40. Memory observations

No retained DOM row, parent-K branch map, edit session, validation state, timer, rAF or object URL was observed after lifecycle completion. Export buffers are invocation-local; XLSX 10k is the dominant temporary allocation and is released after completion. No heap-size marketing claim is made.

## 41. Hierarchy performance

Baseline p50/p95 ms: normalize 1k `0.413/0.818`, flatten 1k `0.648/0.857`, normalize 10k `5.450/5.939`, flatten 10k `6.965/7.435`, deep 1k `2.277/3.136`. Current recertification passes the frozen harness.

## 42. Selection performance

Baseline p50/p95 ms: membership 10k `2.376/2.945`, loaded propagation depth 1k `0.468/0.569`, indeterminate 10k `2.350/3.054`, 100 gestures `4.966/5.189`. Current recertification passes.

## 43. Query performance

Baseline p50/p95 ms at 10k: search-many `4.454/5.977`, nested filter `3.497/3.734`, single sort `3.601/4.689`, multi-sort `10.552/11.021`, combined `5.296/5.758`. Current recertification passes.

## 44. Remote performance

Baseline p50/p95 ms: roots×100 `0.626/1.161`, children×100 `0.611/0.961`, concurrent parents×100 `0.090/0.105`, large total 1m `0.005/0.011`. Current recertification passes.

## 45. Virtual performance

Range/scroll math stays sub-millisecond; 1,000 scrolls execute no semantic pipeline, remote total 1m is constant-size, and the 10k DOM maximum is 32 rows. Current recertification passes.

## 46. Editing/export performance

Baseline p50/p95 ms: edits×100 `0.311/1.559`; CSV 10k `2.464/3.025`; JSON 10k `3.924/4.479`; XLSX 10k `41.596/42.454`. A post-suite noisy p95 outlier was investigated; a clean repeat returned edit `0.344/1.667`, JSON 10k `3.794/5.075`, XLSX 10k `42.716/44.229`. No reproducible >20% p95 regression remains.

## 47. Browser performance

Chromium engineering evidence covers hydration completion, expansion/query/selection interactions, a 200-row virtual fixture with deterministic windowing, deferred editor activation and first JSON export. No marketing FPS claim is made.

## 48. Bundle BASIC

`112,525 B raw / 22,485 B gzip / 19,049 B Brotli`. This is `+4,074 B gzip` over legacy TreeTable 1.x (`18,411 B gzip`), openly attributable to the independent controlled hierarchy/query/remote/virtual/edit/action architecture. It remains below the frozen ≤50 KB gzip target and retains no legacy runtime.

## 49. Bundle combined

Typical/templates/combined initial: `113,229 B raw / 22,764 B gzip / 19,247 B Brotli`. Remote, virtual, editing and each export consumer retain the BASIC initial size because their runtime inputs are not compile-time feature flags.

## 50. Optional chunks

Raw/gzip/Brotli: editor `4,372/1,185/1,003 B`; export runner `2,576/1,097/960 B`; CSV `588/386/341 B`; JSON `891/471/413 B`; XLSX `3,972/1,425/1,280 B`. No optional body is retained in initial output.

## 51. Root-unused

PASS: `0 B raw` (only empty compression-container overhead: 20 B gzip, 1 B Brotli). This remains a blocker gate and is green.

## 52. Dependency graph

PASS: Angular core/common, candidate-private code and the approved neutral exact-key/value resolver only. Zero edge to TreeTable legacy, NeuTable facade, Table 1.x, TableCore, PrimeNG, Router, HttpClient, storage, third-party grid or third-party XLSX. Signal Forms is private-editor-only.

## 53. Global coverage

One global run: 203 files and 3,165 tests passed before the additional export-outcome certification test. Lines `96.17%`; statements `94.66%`; functions `94.42%`; branches `91.43%`. The unchanged threshold is `95.01%`: lines pass, while statements/functions/branches fail. The repository already had historical functions/branches threshold debt at N2-011J; statements crossed below threshold as the isolated candidate/lazy code expanded. Thresholds were not changed and global coverage was not rerun to chase percentages.

## 54. NeuTreeTable coverage

The same global instrumentation reports 18 candidate files: lines `88.69%`, statements `84.92%`, functions `87.53%`, branches `76.42%`. Lazy loader/serializer coverage is under-represented by the global instrumenter, while directed serializer and real-browser lazy-load tests pass. Critical cycle/stale, rejection, partial/unloaded, ancestor reveal, out-of-order, virtual boundary/focus, hidden edit, export failure/delegation and hydration branches all have behavioral evidence.

## 55. Full suite

PASS without re-running global coverage: 203/203 files and 3,166/3,166 tests. No functional failure remains; only the separately reported one-time coverage threshold result exists.

## 56. Candidate tests

PASS: 10/10 files, 81/81 tests. The final added test explicitly covers disabled export, SSR export and destruction during lazy serialization.

## 57. Legacy tests

PASS: TreeTable 1.x remains 3/3 files and 76/76 tests. Legacy runtime was not modified.

## 58. Build/package/imports

PASS: production build, package audit, publint, ATTW, verification (431 files), 102 entrypoint imports, 102 SSR import smokes, public-contract audit and Angular 22.1.6 consumer build/SSR/hydration. Candidate remains isolated and unpublished until K.

## 59. Legacy 42/21/8 disposition

Executable ledger PASS: all 71 members are classified—41 MERGE, 14 REMOVE, 8 RENAME, 4 CHANGE, 3 INTERNALIZE and 1 OUT OF SCOPE; zero DEPRECATE. Every P1 destination has implementation/tests, and no compatibility runtime is required.

## 60. Prime capability preservation

Frozen F-071…F-105 mapping was reused without a new macroaudit. All P1 parity/redesign targets pass with actual tests: hierarchy, expansion, states/templates, root pagination, columns/layout, editing, context/action, export, responsive behavior, domain cleanliness, selection, filters, sibling sort, remote, virtual and treegrid/a11y. F-087 hierarchy-preserving extras remain P2; F-104 reorder/reparent remains P3.

## 61. Migration examples

The compile-only fixture now covers simple and nested hierarchy, controlled expansion/selection, lazy children, single-channel remote routing, search/filter/sort, fixed virtualization, editing, export and the legacy nested-wrapper → clean `data + hierarchy` conversion. It compiles with no positive-fixture `any` and no runtime adapter.

## 62. TreeTable removal readiness

Active public consumers are limited to the productive legacy entrypoint/compatibility fixtures that K must switch. Candidate tests, bundle harness and hydration fixture already consume candidate-private contracts. No active product outside the legacy TreeTable implementation requires its internal controllers.

## 63. N2-011K unblock evidence

NeuTreeTable 2 has zero runtime dependency on old Table, TableCore or the NeuTable facade; all frozen P1 capabilities exist independently; the 42/21/8 ledger is closed; and package/bundle/SSR/hydration gates pass. The productive TreeTable entrypoint can be atomically switched and legacy TreeTable removed during K. N2-011K is therefore unblocked but was not resumed here.

## 64. Physical replacement plan

1. Promote the NeuTable candidate.
2. Promote the NeuTreeTable candidate.
3. Switch `@neural-ui/core/table`.
4. Switch `@neural-ui/core/tree-table`.
5. Remove Table 1.x.
6. Remove TableCore.
7. Remove TreeTable legacy.
8. Migrate internal consumers.
9. Regenerate contracts/package artifacts.
10. Run the final destructive-replacement gates.

No step is executed in I.

## 65. next-path removal plan

K moves `table/next/**` and `tree-table/next/**` into their final internal/public layouts, rewrites only package-internal imports, removes all candidate/next naming, regenerates manifests and proves zero runtime/public next path. I only certifies readiness.

## 66. Security/robustness

PASS: bounded cycle/duplicate/missing-node handling, exact-key identity, safe field resolver with no dot-path/prototype traversal, closed filter AST, clamped virtual geometry, CSV injection defense, non-formula XLSX strings, escaped Angular templates, constant-size large-total handling and revision-based stale-response rejection.

## 67. RTL/responsive/structural review

Real Chromium confirms native table/treegrid nodes, logical RTL indentation, restored LTR interaction behavior, contained 320 px overflow, virtual viewport/spacers, selection controls, empty/loading/error and an editor contained by its cell. Unit/browser tests cover deep indentation, RTL arrows and focus. No visual redesign was made.

## 68. Known global debt

Untouched: Menu NG8102 warnings, missing Showcase demos, icon/Chart/OrganizationChart and other global audit debt. Firefox/WebKit and axe executables are absent. These are recorded separately from NeuTreeTable P1 certification.

## 69. Remaining risks

The deliberate 200 ms single-click disambiguation is observable behavior; fixed-height templates must honor itemSize; very large XLSX exports allocate an invocation-local workbook buffer; SSR renders the full loaded hierarchy before browser geometry; global coverage remains below three historical thresholds. None is a frozen P1 blocker.

## 70. Blockers

None. No P1 gap, API drift, duplicate owner, early request, stale response bug, SSR request, hydration mismatch/duplication, critical a11y/keyboard/focus failure, unbounded virtual DOM, reproducible resource leak, unexplained performance regression, eager optional retention, root-unused regression, legacy runtime edge or missing migration path remains.

## 71. Git diff/status

N2-015H is committed. N2-015I remains intentionally uncommitted with five modified and four new files, all unstaged: certification evidence/tests/scripts, the typed migration fixture and this report. `git diff --check` passes; tracked and changed symlink counts are both zero; no temporary artifact, product runtime, protected legacy runtime or N2-011K file is changed.

## 72. Final recommendation

`CERTIFIED FOR N2-011K`.

Do not resume N2-011K inside N2-015I. Do not commit I without explicit authorization.
