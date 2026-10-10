# N2-011C — NeuTable 2 client pipeline

## 1. Status

**PASS — READY FOR N2-011D.** N2-011C is implemented and verified; N2-011D has not started.

## 2. Scope

Implemented the private client query pipeline, its Angular computed integration, executable contracts, SSR/hydration coverage, performance/bundle evidence and normative addendum. No interaction UI was added.

## 3. Pipeline architecture

The pure stages are normalization, source partition, search, recursive filter, stable sort and pagination. Recombination happens only after the normal-row page is known.

## 4. Client/remote boundary

Client mode executes all stages. Remote mode bypasses search, filter, sort and pagination, while the renderer still applies pinned presentation.

## 5. Query ownership

The `query` input is the sole applied owner. No local query mirror or second owner exists.

## 6. Signal/computed graph

`data/query/options → sourcePartition/fieldResolver/effectiveQuery → searchedRows → filteredRows → sortedRows → normalPage → pipelineRows → renderRows`.

## 7. Effects ledger

Zero Angular `effect()` calls and zero writable internal query state.

## 8. Search

NFKC, trim, whitespace collapse and lowercase are applied once. Search is a full normalized substring over declared global fields and supported primitives only.

## 9. Field resolution

One private resolver serves search, filter and sort. Accessor wins; fallback is a direct literal field read. Dot paths are not inferred.

## 10. Filter AST

Recursive `and`/`or` groups are evaluated without mutation. Empty derived groups normalize to no filter.

## 11. Filter rules

All 17 frozen rules are implemented and covered. The exact union is frozen in the executable manifest.

## 12. Unknown narrowing

Unknown runtime kinds/rules narrow to inactive/false behavior without crash, output or mutation.

## 13. Sorting

Default comparison supports boolean, number, bigint, string and valid dates. Custom row comparators take precedence.

## 14. Stable sort

Rows are decorated with source index; the original index is the final explicit tie-breaker.

## 15. Multi-sort

Multi-sort is one lexicographic comparator. Duplicate fields keep the first entry.

## 16. Sort policy

Valid categories are deterministic; NaN/invalid dates/unsupported objects follow valid values; nullish values are always last. Single mode uses the first applied entry.

## 17. Pagination

Pagination runs after sort and only on normal rows when enabled.

## 18. Page semantics

Page is zero-based, page size is at least one, non-finite values normalize deterministically, and out-of-range pages are not clamped.

## 19. Pipeline result

The private result contains recombined rows, effective query, three normal-row counts, page count and half-open page bounds.

## 20. Counts

`sourceNormalCount`, `matchedNormalCount` and `pageNormalCount` exclude pinned rows. Remote metadata remains authoritative.

## 21. Pinned row semantics

Pinned start/end rows remain visible and source-stable, ignore query membership, consume no page capacity and prevent a false empty state.

## 22. Disabled rows

Disabled-row presentation remains renderer-owned and is preserved after query projection.

## 23. Identity

Duplicate semantic keys are diagnosed across the complete source before filtering/pagination; number and string keys remain distinct.

## 24. Parent query writes

Immutable parent query replacement recomputes the necessary derived stages once and updates DOM output.

## 25. No proposal evidence

Integration and hydration tests observe zero `queryChange` emissions for parent writes.

## 26. No request evidence

Integration and hydration tests observe zero `dataRequest` emissions for client and remote parent writes.

## 27. Immutability

Deep-frozen data/query inputs remain unchanged. Every projection returns derived arrays only where work is required.

## 28. Pure engine tests

10 tests pass, covering the 17 rules, invalid operands, search, shared resolution, nested AST, normalization/equality, sorting, pagination, pinned, remote, determinism and immutability.

## 29. Integration tests

6 facade/renderer tests pass together with the pure suite (16/16): combined query, page, parent replacement, `aria-sort`, remote bypass and zero outputs are covered.

## 30. SSR

The real SSR document includes an applied combined client query, the remote bypass table and all loading/error/empty states.

## 31. Hydration

PASS: table/head/row/cell nodes are reused, IDs remain stable, the parent query update runs once, and no NG050x is emitted.

## 32. Zoneless

Both integration and real hydration fixtures use zoneless change detection.

## 33. A11y

Native table semantics remain intact. Applied sort is reflected with `aria-sort`; no premature interactive keyboard surface was introduced.

## 34. Empty/loading/error

Existing precedence and projected templates remain covered. Visible pinned rows suppress an incorrect empty result.

## 35. 1k performance

Search: p50 **0.326 ms**, p95 **2.761 ms** (15 samples).

## 36. 10k search

p50 **3.828 ms**, p95 **4.545 ms**.

## 37. 10k filter

p50 **1.355 ms**, p95 **2.688 ms**. The N2-011A direct baseline was p50 5.896 / p95 10.238 ms; no >20% regression exists.

## 38. 10k sort

Single sort p50 **1.540 ms**, p95 **2.503 ms**. The N2-011A direct baseline was p50 36.774 / p95 39.663 ms; no >20% regression exists.

## 39. 10k multi-sort

p50 **2.356 ms**, p95 **3.469 ms**.

## 40. Combined pipeline

10k combined search/filter/sort/page: p50 **3.779 ms**, p95 **4.324 ms**. Page extraction alone: p50 0.933 / p95 1.602 ms.

## 41. Recompute evidence

Repeated identical computed read: 0.001 ms and same object. Appearance replacement causes no pipeline evaluation. Data and query replacements produce exactly one evaluation each; total observed evaluations: 3.

## 42. Memory/allocation observations

The pipeline does not retain row caches across owners. Stable sort allocates one decorated array; inactive stages preserve incoming array references. No listener, timer or effect lifecycle was added.

## 43. Bundle

N2-011B renderer/basic baseline: 44,039 raw / 6,329 gzip / 5,286 Brotli. N2-011C query client basic: **50,496 / 8,371 / 7,123**. Combined consumer: **50,676 / 8,460 / 7,173**.

## 44. Bundle attribution

The private client pipeline contributes 4,597 minified bytes in the source graph; facade 3,869 and private renderer 1,691. Combined over basic adds 180 raw / 89 gzip / 50 Brotli bytes.

## 45. Root-unused

PASS: raw contribution remains exactly **0 B**.

## 46. Dependency graph

Only `@angular/core`, `@angular/common` and private candidate files are present. No legacy Table, TableCore, forms, router, CDK, icon or PrimeNG dependency leaked in.

## 47. Contract gates

PASS: 66 types, 15 directives, 24 inputs, 14 outputs and 4 methods. The 17 filter rules and zero-based page documentation are executable assertions.

## 48. Legacy tests

Directed Table 1.x and TableCore suites pass: **352/352** tests.

## 49. Build/package

Angular package build passes. Package verification passes for **431 files**.

## 50. API surface verification

No new exported type or public entrypoint was added. The client engine remains private and framework-free.

## 51. Regressions

No functional, contract, hydration, legacy, build, package, performance-threshold or dependency regression was found.

## 52. Risks

Bundle compression grows versus N2-011B because the applied client engine is now reachable (+2,042 gzip / +1,837 Brotli). This is measured and attributed; future UI phases must avoid duplicating query policy.

## 53. Git diff

The diff is limited to N2-011C engine/integration/tests/scripts/baselines/docs plus the authorized zero-based and filter-union contract corrections.

## 54. Git status

Before the final commit, only N2-011C-owned files are modified/untracked. No symlinks exist. The requested local commit is the terminal action.

## 55. Recommendation READY FOR N2-011D or NEEDS DESIGN REVIEW

**READY FOR N2-011D.** Stop here pending explicit authorization; do not begin N2-011D automatically.
