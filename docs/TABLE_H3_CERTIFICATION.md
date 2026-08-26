# Table H3-B certification

Date: 2026-08-27
Status: certified with explicitly recorded baseline/global gate debt

## Source integrity

The work was performed from isolated, exact source revisions:

- root: `055e7bfd8b074c2ee00726e22b88b57376498236`
- Workspace: `a8ba70885c371d2a12ffef4711426a647ffdac9e`
- Showcase: `37882e57770fa648134846d8f30e8e1af8e0e9ca`

The root revision and index were not updated. Nothing was pushed. The existing developer checkouts were not used as implementation inputs.

## Outcome

H3-B introduces an additive lightweight renderer at `@neural-ui/core/table-core` while preserving the batteries-included `@neural-ui/core/table` compatibility facade. The split is architectural rather than cosmetic:

- `NeuTableCoreComponent` owns semantic rendering, immutable row projection, typed templates, loading/empty/footer states, row identity, styling, and contained horizontal overflow.
- It does not import or own Forms, CDK, Router, RxJS, Neural controls, sorting, filtering, pagination, selection, editing, export, persistence, URL state, or virtualization.
- Existing `<neu-table>` behavior and selectors remain available.
- Compatibility aliases remain operational and are normalized by a stateless adapter.
- TreeTable was not rewritten; its existing integration remains intact.

The complete boundary, ownership, API, and migration contract is in `docs/TABLE_ARCHITECTURE.md`.

## Public surface certification

The compatibility facade remains exactly:

| Surface | Count |
| --- | ---: |
| Inputs | 155 |
| Outputs | 38 |
| Public methods | 96 |
| Template selectors | 16 |

The new core entrypoint exposes one component, six typed template directives, and its supporting types. Its runtime dependency graph is only:

```text
@neural-ui/core/table-core
├── @angular/core
└── @angular/common
```

The automated architecture audit rejects facade count drift, forbidden core imports, and core FESM budget regressions.

## Bundle certification

All consumer figures are optimized production `main.js` measurements against isolated Angular 21.2.17 fixtures. Incremental values subtract the matching empty fixture. Gzip uses level 9; Brotli uses quality 11.

| Scenario | Raw total | Gzip total | Brotli total | Raw incremental | Gzip incremental | Brotli incremental |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Empty app | 92,023 B | 30,547 B | 27,576 B | — | — | — |
| Lightweight core | 140,807 B | 45,772 B | 40,901 B | 48,784 B | 15,225 B | 13,325 B |
| Existing `NeuTable` facade | 839,728 B | 214,160 B | 175,074 B | 747,705 B | 183,613 B | 147,498 B |
| TreeTable | 857,126 B | 218,756 B | 177,598 B | 765,103 B | 188,209 B | 150,022 B |
| Dashboard fixture | 845,149 B | 215,961 B | 175,916 B | 753,126 B | 185,414 B | 148,340 B |

Warm shared-runtime comparison:

| Scenario | Raw total | Gzip total | Brotli total | Raw incremental | Gzip incremental | Brotli incremental |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Router + Neural provider, no Table | 191,908 B | 57,686 B | 51,585 B | — | — | — |
| Router + Neural provider + `NeuTable` | 845,567 B | 215,358 B | 176,053 B | 653,659 B | 157,672 B | 124,468 B |

The packaged core FESM is 36,069 B raw, 4,720 B gzip, and 3,963 B Brotli.

### Bundle conclusion

- Core cost: **15,225 B gzip incremental**.
- Compatibility facade cost: **183,613 B gzip incremental**.
- Real existing `<neu-table>` consumers continue to pay the compatibility-facade cost.
- The lightweight path is well below the desired 140 KiB gzip target.
- The existing facade was not falsely represented as meeting that target.
- The H3-A cold facade reference was approximately 180.3 KiB gzip; H3-B remains near that reference because compatibility behavior was preserved rather than removed.

## Accessibility and virtual-row contract

Explicit `aria-rowcount` and `aria-rowindex` are now emitted only when the rendered DOM is an incomplete logical projection and the component knows the header-row count.

- Complete native tables omit redundant explicit row coordinates.
- Virtual/lazy tables count rendered header rows, frozen rows, and the logical data set.
- Data row indices follow all known header rows and frozen rows.
- Consumer-owned grouped header templates suppress explicit coordinates when their row count cannot be known truthfully.
- The Showcase lazy fixture renders two header rows, so a 10,000-row logical data set reports `aria-rowcount="10002"`; its first data row reports `aria-rowindex="3"`.

The context-menu boundary also consumes disabled-row pointer and Shift+F10 events so they cannot escape to a parent context-menu directive.

## Mobile certification

`NEURAL_STANDARD.md` now formalizes the mobile-first contract: smallest-viewport base layout, min-width progressive enhancement, semantic max-width behavior, usable touch targets, component-owned overflow when required, and no document-level overflow.

The focused Chromium responsive audit passed the Table Showcase route at:

- 320 × 568
- 360 × 800
- 390 × 844
- 412 × 915
- 768 × 1024
- 1440 × 900

Result: 6 checks, 0 failures. Table overflow remained internal.

## Verification

Passing gates and regressions:

- production Angular package build and declarations
- public contract snapshot: 110 exports, 258 root tokens
- Table architecture audit: 155/38/96/16 and dependency/budget checks
- package verification: 443 files
- package lint and resolution checks
- 106 public-entrypoint import smokes
- 106 SSR import smokes
- token contract: 266 public/default/documented tokens, 0 deep selectors
- logical CSS audit: 102 stylesheets
- focused Table + Table Core + TreeTable tests: 30 files, 639 tests
- final core-focused suite: 8 tests
- focused Showcase Table unit suite: 13 tests
- Chromium Table functional suite: 10 tests, 10 passed
- Showcase translation audit: 4,141 synchronized values
- Showcase production build and 214 prerendered routes
- focused Table responsive audit: 6 checks, 0 failures
- full Workspace functional test run: passed

Full Workspace coverage remained informational as required by the H7 baseline-debt rule. Thresholds were not changed:

| Metric | Result | Existing threshold |
| --- | ---: | ---: |
| Statements | 96.08% | 95% |
| Branches | 94.45% | 95% |
| Functions | 94.72% | 95% |
| Lines | 97.75% | 95% |

The new core itself reached 96.90% statements, 98.44% branches, and 96.66% lines in its focused run. Its reported 75% function value includes six Angular content-query source-map artifacts; all six query paths and all six public template context guards are exercised.

## Recorded non-H3 global gate debt

No threshold was lowered and no unrelated debt was rewritten.

- `audit:bundle` remains red for the global package: Table FESM exceeds the legacy 260 KB raw ceiling and aggregate FESM exceeds 2,000 KB. The exact H3-A baseline fails the same gate (Table 637.1 KB and aggregate 3,041.3 KB); the finished H3-B build measures 639.2 KB and 3,078.6 KB. The dedicated core gate passes at 36,069 B raw.
- `audit:entrypoints` remains red for three pre-existing missing Showcase demos: `animate-on-scroll`, `key-filter`, and `ripple`. The exact H3-A baseline fails identically. The new `table-core` entrypoint has a mapped Showcase example and adds no new entrypoint failure.
- Showcase `audit:docs-api` reports repository-wide pre-existing API documentation debt for Compare, Panel, Table, and Terminal. H3-B adds the architecture note and the exhaustive Table architecture ledger without expanding that audit's unrelated scope.
- Showcase production prerender continues to emit the pre-existing missing-translation warnings for `literal.analytics` and `literal.reports`.

## Regression statement

Required Table regression families—rendering, templates, query features, pagination, selection, editing, virtual/lazy behavior, resize/reorder, frozen rows, context menus, export, persistence, URL state, keyboard, ARIA, SSR, mobile behavior, and TreeTable integration—remain functionally green.

H3 functional regression count: **0**.
