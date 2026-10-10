# N2-011A — NeuTable 2 executable contracts and baselines

## 1. Status

**PASS.** N2-011A is complete as a contracts/tooling phase. No current Table or TableCore runtime behavior was changed, no target renderer/pipeline was implemented, and no public entrypoint was switched.

Checkpoint measured: `281b658` (`docs(table): freeze Neural Table 2 architecture`).

## 2. Authoritative documents

Authority was applied in this order:

1. `N2-TABLE2-TYPE-CONTRACTS.md` for the target API.
2. `N2-TABLE2-FINAL-ARCH.md` for semantics and ownership.
3. `N2-TABLE2-IMPLEMENTATION-PLAN.md` for sequencing.

No material contradiction was found.

## 3. Public API target

The isolated candidate surface is under `projects/ui-core/table/next/public/`. It is intentionally absent from the current product entrypoint.

The executable ledger contains exactly:

- 66 public types;
- 15 template directives;
- one `NeuTableComponent<T, K, F>` facade;
- 24 inputs, 14 outputs and four methods on that facade.

`@neural-ui/core/table-core` and `NeuTableCoreComponent` are marked `PUBLIC TARGET = REMOVE`, with physical removal reserved for N2-011K.

## 4. Generics

- `T extends object`: immutable consumer row model.
- `K extends string | number`: semantic row identity.
- `F extends string`: closed query field domain.

Positive fixtures exercise `AccountRow`, numeric keys and an `AccountField` union. Negative fixtures reject fields outside `F` and keys outside `K`.

## 5. Query

`NeuTableQuery<F>` is the only applied query owner and is always complete: `page`, `pageSize`, `search`, readonly `sort[]` and `filters`. `queryChange` is only a proposal. No partial or parallel legacy query shape was introduced.

## 6. Sort

The only representation is `readonly NeuSortEntry<F>[]`. `NeuTableSortOptions.mode` determines whether runtime accepts `0..1` or `0..n` entries. `sortField`, `sortOrder` and `multiSortMeta` are rejected target shapes.

## 7. Filter AST

The AST is exhaustively discriminated by `kind: 'condition' | 'group'`; groups use `and | or`, conditions carry a field in `F`, rule and heterogeneous `unknown` value. Consumers narrow `unknown` before use. Global search remains `query.search` and `filterOptions.globalFields`, as frozen; it is not duplicated as an AST node.

Negative fixtures reject invalid operators, missing condition members, invalid fields and legacy shapes.

## 8. Pagination

Applied pagination state exists only as `query.page` and `query.pageSize`. `NeuTablePaginationOptions` owns presentation/policy. There are no target `first`, `rows` or `currentPage` inputs.

## 9. Selection keys

`{ kind: 'keys'; keys: readonly K[] }` is the enumerated selection owner. Rows `T` are not stored as selection state. Strong-key and readonly failures are covered by compile-only negatives.

The single-mode `0..1` cardinality remains a runtime invariant because the frozen type deliberately separates selection state from selection policy; N2-011A did not invent a conditional fourth contract.

## 10. Selection all-matching

`{ kind: 'all-matching'; scope; excludedKeys }` represents every remote match without enumerating unloaded rows. The frozen scope contains search, filter AST and global field policy. Incomplete scope and mixed `keys`/`all-matching` shapes fail compilation.

## 11. Row identity/tracking

`NeuRowKey<T, K> = (row: T) => K` owns semantic identity. `NeuRowTrackBy<T> = (index, row) => unknown` is a rendering optimization. Separate types and negative fixtures prevent treating them as one callback contract.

## 12. Remote request

`dataRequest` is the sole remote data transport. `NeuTableDataRequest<F>` contains `requestId`, `queryRevision`, the complete query, a frozen reason (`initial | query | viewport | retry`) and an optional request range. No HTTP or cache ownership was added to Table.

## 13. Request IDs/revisions

`requestId` identifies a concrete request; `queryRevision` identifies the logical applied query represented by data. Both remain `number` because the authoritative type contract does not brand them. Their semantic separation is enforced by named payload fields and fixtures, not by an unauthorized type change.

## 14. Virtual ranges

All ranges are `{ start, end }` with `[start, end)` semantics:

- visible and render ranges are emitted by `rangeChange`;
- request range is carried only by `dataRequest.range`;
- `length` and `lastIndex` shapes are rejected.

No virtual-scroll implementation was added.

## 15. Columns

`NeuTableColumn<T, F>` materializes value, header, sort, filter, edit and geometry contracts. The broader capability is intentionally cohesive rather than a mega-object:

- template hooks are the 15 typed template directives;
- visibility, order, widths and pinning are the controlled `layout` slice;
- sticky/responsive behavior belongs to `appearance`;
- resize/reorder are expressed through `layoutChange`.

This follows the authoritative type contract exactly.

## 16. Config types

Executable config unions/interfaces exist for `sortOptions`, `filterOptions`, `paginationOptions`, `selectionOptions`, `virtualizationOptions`, `editingOptions`, `expansionOptions`, `groupingOptions`, `rowOptions`, `appearance`, `labels` and `interactionOptions`.

No `sortingOptions`, `filteringOptions` or `layoutOptions` alias was invented. Applied layout uses `layout`, as frozen.

## 17. Output categories

| Category     | Count | Outputs                                                                                                     |
| ------------ | ----: | ----------------------------------------------------------------------------------------------------------- |
| PROPOSAL     |     6 | `queryChange`, `selectionChange`, `layoutChange`, `expandedKeysChange`, `editStateChange`, `groupingChange` |
| DOMAIN EVENT |     7 | `dataRequest`, `rangeChange`, `rowAction`, `editCommit`, `editCancel`, `rowReorder`, `exportRequest`        |
| LIFECYCLE    |     1 | `featureError`                                                                                              |

Every output has exactly one category, owner, direction, semantics and executable type in `scripts/n2-table-contract-manifest.mjs`.

## 18. Methods

The only public commands are:

- `focusCell({ key, columnId }): boolean`;
- `scrollTo({ index?, key? }): Promise<void>`;
- `retryData(): void`;
- `export(request): Promise<NeuTableExportOutcome>`.

No imperative setter for query, selection, layout, editing, expansion or grouping was added.

## 19. Legacy ledger

The executable ledger classifies all current facade members:

- 80/80 inputs;
- 38/38 outputs;
- 32/32 public methods.

Every member has one of `KEEP | CHANGE | MERGE | RENAME | REMOVE | INTERNALIZE`, plus target, reason and migration path. `DEPRECATE` is not a v2 destination. The audit derives the live member inventory from the current component AST, so additions or omissions fail mechanically.

## 20. Type tests

`npm run test:n2-table-types` compiles positive consumers and requires the negative fixture to fail for the expected reasons. Coverage includes T/K/F, complete query, readonly sort, AST exhaustiveness, both selection variants, columns, request/range, configs, methods, DOM `Event` rejection and legacy shape rejection.

Result: **PASS**, positive fixtures compile and 17 invalid shapes are rejected.

## 21. Contract tests

`npm run test:n2-table-contracts` verifies the 82-symbol ledger, exact 24/14/4 surface, names/order/types, readonly inputs/outputs, categories, owners, forbidden aliases/imports, TableCore removal target, package-path isolation, no DOM `Event`/`any`, no symlinks, and SSR-safe evaluation of the candidate surface.

Result: **PASS**, 6/6 tests.

## 22. Invariants

The static gate codifies and verifies:

- ONE QUERY OWNER;
- ONE REMOTE CHANNEL;
- ONE SELECTION OWNER;
- ROW KEY != TRACK BY;
- HALF-OPEN RANGES;
- NO ROUTER OWNERSHIP;
- NO STORAGE OWNERSHIP;
- NO PUBLIC TABLECORE TARGET;
- NO LEGACY STATE PARALLELISM.

## 23. Basic fixture

`fixtures/n2-table-contracts/basic.ts` demonstrates the target client binding for data mode, readonly data, metadata, columns, complete query and semantic row key without legacy inputs.

## 24. Remote fixture

`fixtures/n2-table-contracts/remote.ts` separates:

- applied query and metadata;
- acceptance of a `queryChange` proposal;
- transport of a `dataRequest`;
- total count and request/revision metadata.

HTTP remains consumer-owned.

## 25. Selection fixtures

`fixtures/n2-table-contracts/selection.ts` contains separate explicit-key and all-matching remote scenarios, plus an exhaustive discriminant consumer.

## 26. Migration fixtures

`fixtures/n2-table-contracts/migrations.ts` covers:

- 1.x simple to 2.x query/options;
- lazy/server to remote query + metadata + `dataRequest`;
- selected rows to keys;
- TableCore to basic NeuTable;
- stateStorage to an external application adapter.

These are compile-only recipes, not runtime compatibility.

## 27. Functional baseline

The deterministic snapshot inventories 661 Table tests; together with eight TableCore tests, the checkpoint has 669 tests. Evidence counts by scenario are stored in `baselines/n2-table/current-baseline.json` (render 63, sort 66, filter 84, pagination 54, selection 107, virtual 12, remote/lazy 48, editing 22, expansion 12, grouping 18, export 21).

Directed execution result: **PASS**, 344 current Table tests + 8 TableCore tests = **352/352**.

## 28. Performance baseline

Captured on Angular test builder + jsdom + zoneless. Client render ingests the full dataset and renders a bounded 100-row page; sort/filter/selection/virtual operate over 10k data. Durations are observations, not budgets.

| Scenario          | Samples | p50 ms |  p95 ms | DOM nodes |
| ----------------- | ------: | -----: | ------: | --------: |
| 1k client render  |       5 | 79.044 | 287.376 |       546 |
| 10k client render |       5 | 70.760 |  83.265 |       546 |
| 10k sort          |       5 | 36.774 |  39.663 |       100 |
| 10k filter        |       5 |  5.896 |  10.238 |        96 |
| 10k selection     |       5 |  9.250 |  12.386 |       178 |
| 10k virtual       |       5 | 22.053 |  24.275 |       218 |
| destroy lifecycle |      50 |  0.271 |   0.441 |         0 |

Heap, listener, observer and effect census are `null`: the current jsdom harness does not expose stable measurements for them. Resources observed: 0. This limitation is explicit in `baselines/n2-table/performance.json`.

## 29. Bundle baseline

Minified ESM consumers, with Angular/CDK/ng-icons/RxJS external, gzip level 9 and Brotli quality 11:

| Consumer                      |       raw |      gzip |   brotli |
| ----------------------------- | --------: | --------: | -------: |
| A. current Table basic        | 795,591 B | 137,031 B | 94,784 B |
| B. current Table feature-rich | 795,759 B | 137,096 B | 94,875 B |
| C. current TableCore basic    |  30,086 B |   4,044 B |  3,414 B |
| D. root-unused                |       0 B |      20 B |      1 B |

The near-identical A/B cost records the current monolithic retention problem; it is not treated as the target.

## 30. A11y baseline

Static source signals record native table markup, roles, header relationships, `aria-sort`, selection, keyboard, editing, expansion and virtual-row coordinates. The current test inventory has 31 directed a11y/keyboard/focus tests. These observations are stored with exact evidence titles; they are not a new accessibility certification.

## 31. SSR baseline

`npm run test:ssr-smoke` passes for **102 entrypoints**. TableCore imports only Angular core/common and its local contracts. Current Table retains Forms, CDK, URL-state/storage and advanced feature dependencies; static source contains browser/storage references.

There was no Table-specific hydration DOM-reuse/NG050x/request-deduplication fixture at the checkpoint. This absence is explicitly recorded as a baseline gap rather than reported as PASS. The isolated candidate contract surface itself bundles and evaluates under Node without browser globals.

## 32. Prime baseline

No PrimeNG source or package was re-audited. The closed checklist is derived only from `N2-PRIME22-MATRIX.md`, rows F-001..F-070:

- parity target: 68 (55 existing PARITY + 13 REDESIGN capabilities);
- superiority target: 1 (`F-065`);
- out of scope: 1 (`F-058`, variable height).

The full row-level checklist is in the deterministic snapshot.

## 33. Dependencies baseline

The generated import graph records 44 current production source files and their relevant edges. Category counts are:

- Forms: 3;
- Router/URL state: 3;
- CDK: 2;
- export: 2;
- storage/URL-state helpers: 6;
- advanced/optional/filter-engine edges: 44.

Candidate contracts import only Angular core types and local candidate files.

## 34. Risks

- Directive class names are now mechanically frozen by the 82-export manifest; any later rename is an API change.
- Single-selection cardinality and request/revision ordering still require runtime rejection tests in their authorized phases.
- jsdom performance numbers are regression references for this harness, not browser production claims.
- Current Table-specific hydration behavior remains unverified beyond package SSR import safety.
- Bundle results expose the current basic/feature-rich retention cost; N2-011B must not copy the old facade into the new renderer.

## 35. Open contradictions

None material.

Clarifications resolved by source-of-truth priority:

- global search stays outside the filter AST;
- layout visibility/pinning is not duplicated inside columns;
- no `layoutOptions` alias exists;
- request IDs remain unbranded numbers;
- variable-height virtualization remains out of scope.

## 36. Git diff/status

The N2-011A diff is limited to:

- isolated candidate contracts under `table/next/public`;
- compile-only fixtures;
- contract/ledger/baseline tooling and snapshots;
- one performance-only spec;
- package scripts;
- this report.

Current Table/TableCore product runtime and public entrypoints are unchanged. No symlink was created. Final handoff must be a clean local commit on `v2`; no push, tag, release or publish is authorized.

## 37. Recommendation

**READY FOR N2-011B.**

N2-011A stops here. It does not implement or authorize the private renderer.
