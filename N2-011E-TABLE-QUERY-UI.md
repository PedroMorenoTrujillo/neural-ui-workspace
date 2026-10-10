# N2-011E — NeuTable 2 Query Interaction UI

## 1. Status

PASS. N2-011E is complete within the authorized scope. No N2-011F runtime was added.

## 2. Scope

Implemented controlled sort, global search, row/menu/advanced filtering, pagination, page-size interaction, keyboard behavior and accessibility for the private NeuTable 2 candidate.

## 3. Query ownership

`query` remains the only applied owner. There is no `model()`, mirrored applied query or secondary query store.

## 4. Applied/proposal model

Every gesture computes an immutable `NeuTableQuery` candidate and emits it through `queryChange`. Rendering and the client pipeline continue to read only the input `query` supplied by the parent.

## 5. Signal graph

The existing source → search → filter → sort → page → render graph is unchanged. The renderer receives the applied query, derived counts and one proposal callback; UI drafts do not feed the pipeline.

## 6. Writable ephemeral state

Writable state is limited to search editing/draft, row-filter drafts and timers, open menu plus its draft, advanced-builder open state and focus triggers. Layout drag/resize state from D is unchanged. Every new writable value is interaction-local and disposable.

## 7. Effects ledger

Angular domain effects: **0**. `afterNextRender` is used only for local focus placement/restoration. Timers exist only for configured immediate filter debounce and are cleared on commit, clear and destroy.

## 8. Query transforms

Internal pure helpers implement sort cycling, search commit, AST transforms, page proposals, page-size anchoring, pagination presentation and semantic equality. They never run the client pipeline.

## 9. Same-query suppression

Semantic comparison normalizes the evaluable query and compares sort entries and filter AST values through the configured equality function. Equal proposals return `null` and are not emitted; no `JSON.stringify` equality is used.

## 10. Sorting UI

Only columns with `column.sort` receive an interactive native button. Applied external sort state remains presentationally visible through `aria-sort` for field-backed columns.

## 11. Sort cycle

The cycle follows `defaultDirection`, its opposite, and optional removal. Non-removable sorting returns to the configured default instead of producing `none`.

## 12. Single sort

Single mode always proposes zero or one entry, even if the applied parent state contains several entries.

## 13. Multi-sort

Shift, Control or Command makes the gesture additive. Existing priority is preserved, and the interacted field moves to the newest priority position. The displayed priority is derived from the applied array.

## 14. Sort a11y

Native buttons provide Enter/Space behavior and visible focus. Accessible names communicate current state and next action; `aria-sort` and indicators always reflect the applied query.

## 15. Search UI

Integrated search is rendered only when `filterOptions.globalFields` is non-empty. No new public input or output was introduced.

## 16. Search draft/commit

Focus starts an ephemeral draft from `query.search`; submit proposes once, Escape cancels, and Clear proposes an empty string. Rejection restores the applied input value immediately without an effect or mirror.

## 17. Filter UI architecture

The filter AST is the sole applied filter state. Row, menu and builder surfaces share the same pure AST operations and single `queryChange` channel.

## 18. Filter presentation

The authorized `row`, `menu` and `builder` surfaces are honored. Simple row/menu editors are core; the builder is a private deferred component.

## 19. Filter AST transforms

Set replaces the first matching field in place, add preserves existing nesting, append retains the chosen AND/OR operator, and remove prunes only the target field while collapsing redundant one-child groups.

## 20. Filter rule handling

Only the 17 frozen rules are accepted. Values remain `unknown` with explicit narrowing for presentation; no indiscriminate number or date parsing occurs. List and range text becomes a trimmed string array, and null/empty rules use `null`.

## 21. Advanced filter boundary

The advanced builder is internal and referenced only inside `@defer`. The compiled lazy chunk is **1,939 B gzip**; there is no public entrypoint, feature module or second Table component.

## 22. Filter rejection

Rejected menu/builder proposals close and restore focus while the applied AST and rows remain unchanged. Row drafts are discarded after commit and the control returns to the applied value.

## 23. Filter acceptance

When the parent writes the proposed AST, presentation and pipeline update from that input once and emit no echo.

## 24. Pagination UI

First, previous, next, last, specific-page and page-size controls are native controls inside an accessible navigation landmark. Top, bottom and both positions are supported.

## 25. Zero-based/internal vs human numbering

`query.page` remains zero-based. Labels and page-jump values are one-based for people and are translated only at the interaction boundary.

## 26. Page-size behavior

The implementation preserves the first visible normal-row index: `floor(effectivePage * effectivePageSize / nextPageSize)`. Only configured finite positive integer options can be proposed. The policy is identical for client and remote modes and ignores pinned rows.

## 27. Out-of-range applied page

No automatic correction or last-page clamp exists. Applied out-of-range state remains visible and produces zero normal rows until the parent changes it or the user proposes another page.

## 28. Client counts

Client pagination uses the sorted/filtered normal-row count and current page normal-row count already produced by the pipeline graph.

## 29. Remote metadata

Remote pagination uses authoritative `metadata.totalItems`; it never infers total from loaded data. Unknown total keeps forward navigation available without inventing a last page.

## 30. Parent writes

Direct parent replacement of search, filters, sort, page or pageSize updates controls and pipeline with zero `queryChange`.

## 31. Parent rejection

Integration tests reject sort, search, filter, page and pageSize proposals. Applied indicators, controls and rows remain on the prior input state.

## 32. Parent acceptance

Integration tests accept query proposals through a parent signal and verify one applied update with no output echo.

## 33. Exactly-once

One gesture calls one transform and at most one proposal callback. Submit handlers prevent default, debounce timers are cancelled before explicit commit, and Apply closes without another emit.

## 34. Query independence from selection

Query interactions do not modify selection or emit `selectionChange`; offscreen keys remain present.

## 35. Query independence from layout

Query interactions do not modify layout or emit `layoutChange`; pinned and ordered columns remain unchanged.

## 36. Pinned rows

Pinned rows remain outside search/filter/sort/page membership. Page-size anchor tests and integration include a pinned row, which never consumes page size.

## 37. Selection technical column

The internal selection column has neither sort nor filter controls and never contributes a query field.

## 38. Keyboard

Sort buttons, search, selects, filter buttons/forms and paginator controls use native keyboard semantics. Enter commits row/search edits and Escape cancels search or closes filter UI.

## 39. Focus

Opening a menu/builder moves focus into it; closing or applying restores the trigger after render. Stable sort/search/page DOM does not require global focus effects.

## 40. A11y filter/search/page

Controls have field-specific names, active-filter state, Apply/Clear/Cancel actions, search semantics, `aria-current`, boundary-disabled pagination controls and human-readable page labels.

## 41. SSR

SSR renders applied sort, search, active-filter presentation, page state and already processed client rows. No draft is created server-side and no output is emitted.

## 42. Hydration

Real Chromium zoneless hydration reuses the SSR DOM. First sort/search/filter/page gestures emit exactly once; selection/layout continue working; there are zero NG050x errors, echoes and `dataRequest` emissions.

## 43. Zoneless

The fixture uses `provideZonelessChangeDetection()`. No Zone.js, `detectChanges()` or `markForCheck()` architecture was added.

## 44. Recompute evidence

The performance harness records two pipeline evaluations: initial read and one accepted query replacement. An intervening rejected search proposal and draft write cause zero pipeline invalidation.

## 45. Proposal performance

Current p95: sort 0.0082 ms, multi-sort 0.0024 ms, search 0.0022 ms, simple filter 0.0037 ms, depth-40 nested filter 0.0428 ms, page 0.0033 ms, page-size 0.0035 ms and same-query suppression 0.0082 ms.

## 46. Render performance

The 100-row combined client pipeline measures 0.2592 ms p95; a query replacement measures 0.0953 ms p95 in the directed harness.

## 47. Bundle basic

Initial BASIC is **19,400 B gzip** versus D BASIC 13,819 B: **+5,581 B gzip**. Runtime-configurable template controls remain reachable because an `input=false` value cannot be tree-shaken. The advanced builder chunk is excluded.

## 48. Bundle sort

The reproducible sort scenario is **19,435 B gzip**. Its small delta over BASIC is the exported consumer fixture configuration; sort UI itself is part of the single renderer core.

## 49. Bundle pagination

The pagination scenario is **19,468 B gzip**.

## 50. Bundle simple filters

The row/menu filter scenario is **19,460 B gzip**.

## 51. Bundle advanced filters if present

The advanced-config initial scenario is **19,452 B gzip** and the private compiled builder chunk is **1,939 B gzip**, loaded only when opened.

## 52. Bundle combined

Combined E is **19,543 B gzip**, +5,671 B versus D combined. The measured increase is the reasonable cost of controlled query controls, their pure transforms and expanded Angular template; no accidental heavy dependency was found.

## 53. Bundle classification

- CORE: controlled proposal helpers and sort/search/simple-filter/pagination controls.
- OPTIONAL-SPLITTABLE: row/menu presentation, but current savings do not justify additional architecture.
- DYNAMIC CANDIDATE: advanced builder, implemented as a private deferred chunk.
- NOT WORTH SPLITTING: small equality and query-transform helpers.

## 54. Root-unused

Root-unused remains **0 B raw**.

## 55. Dependency graph

The candidate depends only on Angular core/common plus its private lazy chunk. Forms, Router, CDK, PrimeNG, legacy Table and TableCore are absent; forbidden graph tokens are empty.

## 56. Pure tests

Pure tests cover sort cycles/modes/immutability, semantic suppression, search/filter independence, nested AST preservation, add/update/remove, page presentation and all frozen page-size anchor cases including invalid applied state and out-of-range state.

## 57. Integration tests

Five real NeuTable integration cases cover reject/accept, multi-sort, search, basic/nested/clear/advanced filters, pagination/pageSize, pinned rows, remote mode, parent writes, selection/layout independence and zero request.

## 58. Type/contract gates

`test:n2-table-types`, `test:n2-table-contracts`, `audit:n2-table-ledger`, public contract, package-private boundary and table architecture audits pass.

## 59. Legacy regressions

Directed legacy Table/TableCore sort, query, pagination and filter regressions pass: **405 tests** across six files.

## 60. Build/package

The production Angular package build and current package verification pass. The candidate remains isolated from the public package entrypoint.

## 61. API surface verification

The frozen surface remains 66 public types, 15 directives, 24 inputs, 14 outputs and 4 methods. No public symbol, input, output, method or entrypoint was added; `queryChange` remains the sole query proposal channel.

## 62. Regressions

Directed candidate suite: **42 tests** across six files before the final advanced-builder addition; the final advanced integration suite passes **5/5**. Existing toolbar and applied `aria-sort` compatibility assertions remain green.

## 63. Risks

The core increase is measurable but bounded and dependency-clean. Simple editors intentionally produce strings/string arrays unless a future frozen typed editor contract says otherwise. Advanced UI is already isolated. No unresolved design ambiguity remains.

## 64. Git diff

Changes are limited to the NeuTable 2 private candidate, directed fixtures/tests, N2-011E measurements, scripts, this report and package scripts. Legacy runtime source is untouched. No symlink was created.

## 65. Git status

Before the requested local commit, the working tree contains only the expected N2-011E additions/modifications and generated N2-011E baselines. No push, tag, release or publish was performed.

## 66. Recommendation

**READY FOR N2-011F**
