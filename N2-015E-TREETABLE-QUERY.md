# N2-015E — NeuTreeTable 2 hierarchical query

## 1. Status

**READY FOR N2-015F.** Hierarchical search, filter and sibling-local sort are implemented on the isolated candidate.

## 2. Starting checkpoint

`99c033332944486d8762d37dbac01afea6eedb61` — `feat(tree-table): implement N2-015D selection` on branch `v2`.

## 3. Scope

This phase implements only applied search/filter/sort semantics, their P1 native controls, pure engines, verification and baselines. Remote transport, virtualization, editing, reorder, export, TreeSelect, N2-011K and the productive entrypoint are untouched.

## 4. Query owner

`query` remains a parent-owned `InputSignal`. NeuTreeTable has no writable applied-query mirror.

## 5. Query contract

The existing `NeuTreeTableQuery<F>` is unchanged: zero-based root page, page size, search text, ordered sort entries and one filter AST. Public counts did not change.

## 6. Accept/reject

Every committed gesture emits one immutable `queryChange` proposal. A rejected proposal leaves rows, `aria-sort` and applied filters unchanged. A parent write recomputes presentation and emits zero echo.

## 7. Search normalization

Search uses NFKC, trim, whitespace collapse and non-locale lowercase. Blank search is inactive. Only declared `globalFields` participate; supported scalar values are string, number, bigint and boolean. Objects, arrays and dates are not serialized.

## 8. Hierarchical search

Self-match is evaluated per loaded domain `T`; traversal remains hierarchy-specific and iterative. Search never inspects metadata or arbitrary object keys.

## 9. Ancestor reveal

A matching descendant retains its full reachable ancestor path. Unrelated siblings and branches are removed.

## 10. Transient expansion/reveal

Retained ancestor paths are presented expanded through a computed `transientReveal` set. `expandedKeys` is neither mutated nor proposed. Clearing query state returns exactly to applied expansion.

## 11. Filter policy

The sole P1 policy is matching nodes plus ancestor paths. A matching parent does not pull in unrelated descendants.

## 12. Filter AST

Conditions and nested AND/OR groups evaluate against one canonical AST. Global search and the filter AST combine with AND for each `T`.

## 13. Filter rules

All 17 closed rules are covered: equals/notEquals, four text rules, four ordering rules, between, in/notIn, null/not-null and empty/not-empty. Invalid operands return false without coercion, mutation or throw. Custom registered predicates and custom equality remain supported.

## 14. Search/filter + expansion

Applied expansion is K-based and independent. Query reveal affects only presentation; clear restores it without `expandedKeysChange`.

## 15. Search/filter + selection

Selection remains exact-K over the loaded normalized hierarchy. Filtering does not autocorrect hidden selected keys or alter loaded-subtree aggregation.

## 16. Search/filter + focus

The existing focus reconciliation handles visibility changes: nearest visible ancestor, then same/next index, previous row, then container. Directed integration verifies a hidden focused child moves deterministically while selection remains unchanged.

## 17. Partial/unloaded semantics

Client mode evaluates loaded reachable nodes only. Partial relations retain unknown sibling count rather than claiming completeness. Remote mode preserves parent/backend-applied order and does no local global search claim.

## 18. Sort semantics

Roots sort among roots and each child set sorts independently. Hierarchy, relation arrays, expansion and selection are never mutated.

## 19. Stable sibling sort

Decorated original sibling index is the final tie-breaker. There is no hidden key sort.

## 20. Multi-sort

Ordered entries apply lexicographically. Duplicate fields keep their first entry; single mode evaluates only the first applied entry.

## 21. Custom comparator/value resolution

Custom `column.sort.compare` wins. Otherwise boolean, number, bigint, string and valid Date use deterministic categories; invalid values follow valid values and nullish values remain last. Resolver precedence is feature accessor, column accessor, then direct declared field. There is no dot-path magic.

## 22. Query UI

The renderer adds only native P1 controls: sortable header buttons, global search and row filters. No public symbol was added.

## 23. Sort UI

Sortable headers expose native buttons, applied `aria-sort` and multi-sort priority metadata. One delegated table click produces one proposal.

## 24. Search UI

Search is a native `type=search` control rendered only when `globalFields` is non-empty. It uses signal/event binding, not Forms, ngModel or CVA.

## 25. Filter UI

The row surface renders declared filterable columns with accessible native controls. Menu/builder are not loaded or exposed in this phase; the advanced builder remains a private deferred boundary.

## 26. Drafts/commit

Drafts are ephemeral signals only. Immediate mode supports bounded debounce; explicit mode commits on native change. Proposal completion clears the draft and restores the applied value on rejection. Timers are replaced and cleared on destroy.

## 27. Remote boundary

Remote query remains parent/backend-authoritative. E emits no `dataRequest`, allocates no request id and introduces no coordinator, retry or correlation state.

## 28. Pure query engine

`internal/query/neu-tree-table-query.ts` is framework-free and owns normalization, predicate evaluation, path retention, stable sibling sort and immutable proposal helpers.

## 29. Pipeline order

Normalize hierarchy → search/filter self-match → post-order ancestor retention → stable sibling sort → transient reveal plus applied expansion → iterative visible flatten.

## 30. Single projection path

`projectNormalizedNeuTreeTableHierarchy` is the sole final flatten path for plain, queried and interactive presentation. No parallel search/filter flatteners exist.

## 31. Signal graph

`data/hierarchy/rowKey → normalizedHierarchy`; `normalizedHierarchy/query/columns/options/mode → queryProjection`; `queryProjection/expandedKeys → projection`; projection then feeds renderer and selection.

## 32. Writable state

Only UI-ephemeral search/filter drafts, timer handles, focus and selection anchor exist. There is no writable query, hierarchy, expansion or selection owner.

## 33. Effects ledger

Exactly two existing justified effects remain: structural diagnostic delivery and focus reconciliation. N2-015E adds zero effects.

## 34. Angular 22 signals-first audit

PASS: signal inputs/outputs/computed graph; no decorators, EventEmitter, model(), lifecycle hooks, NgZone, ChangeDetectorRef, Zone.js, Forms, CVA, Subject or synchronization effect.

## 35. Recompute evidence

Selection/focus writes do not feed normalization or query stages. `expandedKeys` feeds only final flatten. Query changes rerun query projection and flatten. Hierarchy diagnostics depend on normalized hierarchy, not query projection.

## 36. Exactly-once

Directed renderer and Chromium tests cover sort, search, filter, accept, reject, equivalent parent writes and hydration. Parent writes echo zero; first committed gestures emit once.

## 37. Immutability

Frozen query, AST, sort arrays, data, hierarchy, relations, expanded keys, selection and columns are read-only. Filter edits rebuild the affected AST and sibling sort produces new token arrays.

## 38. Keyboard interaction boundaries

Tree navigation remains delegated to tbody rows. Native query inputs are interactive descendants and do not leak Arrow keys into tree navigation; header buttons retain native keyboard activation.

## 39. Static a11y

Treegrid/row semantics remain intact. Headers expose `aria-sort`; search and filters have accessible labels; transiently revealed rows expose presentation `aria-expanded`; selection ARIA remains independent.

## 40. Browser a11y

Real Chromium verifies stable treegrid semantics, row focus, native controls, applied sort, filtered ancestor reveal and unchanged selection.

## 41. SSR

PASS. SSR emits the query controls and applied tree semantics deterministically with zero output and zero request. No browser globals are evaluated.

## 42. Hydration

PASS in real Chromium: DOM reused, zero NG050x, zero initial query output, first rejected/accepted search, sort and filter gestures exactly once, deterministic focus, unchanged selection and zero `dataRequest`.

## 43. Zoneless

PASS with `provideZonelessChangeDetection()` and no Zone.js.

## 44. Search performance

Baseline p50/p95 ms: 1k no-match 0.4367/1.3448, 1k sparse 0.4174/0.4910, 10k no-match 3.2276/3.9735, 10k many 4.4536/5.9772, deep-1k 0.7283/0.9802.

## 45. Filter performance

1k simple: 0.4744/0.8199 ms. 10k nested AND/OR: 3.4965/3.7341 ms.

## 46. Sort performance

10k single: 3.6010/4.6893 ms. 10k ordered multi-sort: 10.5522/11.0209 ms.

## 47. Combined performance

Search + nested filter + sort: 1k 0.4588/0.6129 ms; 10k 5.2959/5.7575 ms.

## 48. Deep-tree performance

Depth 1,000 descendant search completes iteratively without stack overflow; p50/p95 0.7283/0.9802 ms.

## 49. Wide-tree performance

10k-wide search/filter/sort scenarios remain linear plus stable sort cost; no O(n²) result was observed.

## 50. Lifecycle/resources

100 proposals: 0.1218/0.1934 ms. 100 query transitions: 32.7774/41.1225 ms. 50 create/destroy: 69.3570/73.5409 ms. Debounce teardown test proves no late proposal; no manual subscription, global listener or retained DOM was introduced.

## 51. Bundle BASIC

83,670 B raw / 16,477 B gzip / 13,837 B Brotli. Versus D this is +15,423 raw / +3,705 gzip / +3,144 Brotli, attributable to core P1 query engine and native controls. Candidate remains below the 18,411 B gzip legacy reference.

## 52. Bundle search/filter/sort

Search, filter and sort consumers each measure 83,670 B raw / 16,477 B gzip / 13,837 B Brotli because runtime inputs cannot be statically inferred by a basic consumer.

## 53. Optional chunks

Zero optional query chunks are emitted. No advanced builder code is present; no dynamic or third-party dependency was added.

## 54. Combined bundle

All public templates: 84,171 B raw / 16,651 B gzip / 13,944 B Brotli.

## 55. Root-unused

PASS: 0 B raw.

## 56. Dependency graph

Main source attribution: renderer 11,700 B, query engine 5,791 B, facade 5,191 B, selection 4,371 B, hierarchy 3,926 B, templates 1,709 B, interaction 1,017 B. Package imports remain only `@angular/core` and `@angular/common`; forbidden graph edges are zero.

## 57. Candidate tests

PASS: 44 directed behavior tests plus four performance suites in the complete candidate run. Search hierarchy, ancestor reveal, clear restoration, all rules, nested filters, stable/multi/custom sort, accept/reject, external parent replacement, selection, focus, expansion, partial/remote, exact-K, immutability and debounce teardown are covered.

## 58. Legacy regression

PASS: unchanged legacy TreeTable suites remain 76/76. No legacy runtime or test was edited.

## 59. Types/contracts/ledger

PASS: positive types and 11 invalid shapes; contract suite 4/4; legacy ledger 42 inputs / 21 outputs / 8 methods; boundary audit passes.

## 60. Build/package

Production build, official package audit (publint/ATTW policy) and 431-file package verification pass. The existing Menu NG8102 warnings and historical raw ATTW CJS/no-resolution debts are unchanged.

## 61. API surface

Unchanged and verified: 66 public types, 11 directives, one component, 22 inputs, 12 outputs and four methods.

## 62. Regressions

No candidate, legacy, SSR/hydration, zoneless, contract, package or dependency regression was found. NeuTable, Table 1.x, TableCore and productive TreeTable are untouched.

## 63. Risks

Remote completeness and request correlation remain intentionally deferred to F. Advanced menu/builder UI remains private/deferred. All core query code is retained by the single facade, explaining the measured BASIC increase.

## 64. Git diff/status

The working tree contains only N2-015E candidate runtime, directed fixtures/tests, scripts, generated E baselines and this report. It is intentionally uncommitted on `v2`; no symlink or temporary hydration directory remains.

## 65. Recommendation

**READY FOR N2-015F.** Do not start N2-015F or resume N2-011K without explicit authorization.
