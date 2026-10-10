# N2-015B — NeuTreeTable 2 hierarchy engine and private renderer

## 1. Status

**READY FOR N2-015C.** N2-015B is implemented as an isolated, unpublished candidate. N2-011K remains blocked and no N2-015C runtime was started.

## 2. Scope

Implemented executable public contracts, a pure hierarchy engine, applied expansion projection, a private semantic renderer, structural hierarchy diagnostics, real SSR/hydration fixtures, directed gates, and reproducible performance and bundle baselines. Interactive expansion, selection, query interactions, remote requests, virtualization, editing, reorder, and export remain unimplemented.

## 3. Authoritative documents

The implementation follows `N2-TREETABLE2-TYPE-CONTRACTS.md`, `N2-TREETABLE2-FINAL-ARCH.md`, `N2-TREETABLE2-IMPLEMENTATION-PLAN.md`, and `N2-TREETABLE2-LEGACY-LEDGER.md`. The design-review resolution extends the existing `featureError` discriminant with `hierarchy`; it does not add an output or widen the surface.

## 4. Public target

The executable candidate freezes exactly 66 public types, 11 standalone template directives, one `NeuTreeTableComponent<T, K, F>`, 22 inputs, 12 outputs, and four methods. The structural error codes are the closed union `cycle | duplicate-key | duplicate-parent | missing-root | missing-node | duplicate-child | orphan | invalid-tree-column`.

## 5. Candidate isolation

The source lives only under `projects/ui-core/tree-table/next/**`. The productive `@neural-ui/core/tree-table` entrypoint, package exports, snapshots, and legacy runtime are unchanged. No `tree-table-next` public entrypoint was added to the workspace; that name exists only inside the disposable bundle harness.

## 6. Zero facade dependency

The boundary gate rejects imports from NeuTable, Table 1.x, TableCore, TreeTable 1.x, Forms, Router, HTTP, storage, CDK, and PrimeNG. The candidate graph contains Angular core/common, its private files, and two explicitly approved neutral internal primitives only.

## 7. Shared primitives

The candidate uses two neutral internals: exact `string | number` key tokenization and canonical field/value resolution. NeuTable 2 was deliberately left untouched: adopting the new paths during B caused ng-packagr to retain a private shared chunk and inflated its isolated audit from 6,329 B to 38,946 B gzip. That experiment was fully reverted, its baselines restored, and no tracked NeuTable source remains changed.

## 8. T/K/F

`T extends object` remains consumer domain data, `K extends string | number` is semantic identity, and `F extends string` is the closed query field domain. No `any`, DOM `Event`, or private hierarchy metadata is exposed in public state.

## 9. Hierarchy representation

The sole representation is parent-owned, readonly, and separate from `T`: ordered root relations plus ordered child relations keyed by exact `K`. It models unloaded, loading, error, and loaded relations, relation revisions, request correlation, optional totals, and complete/partial loaded state.

## 10. Roots

Applied roots preserve consumer order and exact key identity. Unknown and duplicate root references produce deterministic diagnostics; the engine neither repairs nor owns roots.

## 11. Children relation

Children remain in applied relations rather than `row.children`. Known-empty, loaded, partial, unloaded, loading, and error states stay distinguishable. Child order is preserved and no request is issued in B.

## 12. Private node projection

`TreeProjectionNode<T, K>` is internal and contains the key, domain value, parent key, zero-based depth, path, sibling position/count, relation, applied expanded state, expandability, and logical visible index. It is never exported as a public row wrapper.

## 13. Cycle handling

Iterative graph inspection detects cycles, blocks the offending edge, emits a stable internal diagnostic, and bounds rendering. Consumer data and relations are never mutated; cyclic data cannot recurse indefinitely.

## 14. Duplicate K

Duplicate semantic keys use exact type-sensitive tokens (`1` differs from `'1'`). The first indexed node remains deterministic and the duplicate yields `featureError({ feature: 'hierarchy', code: 'duplicate-key' })` at the facade boundary.

## 15. Duplicate parentage

Single-parent ownership is enforced. A repeated node beneath another parent is not rendered twice and yields a stable `duplicate-parent` diagnostic.

## 16. Orphans/missing nodes

Missing roots, missing referenced children, duplicate child references, and unreachable/orphan records are diagnosed with the frozen closed codes. Invalid references are omitted from projection without mutation or synthetic repair.

## 17. Flatten algorithm

Normalization and flattening are framework-free pure functions. A deterministic iterative depth-first traversal preserves applied root and child order and visits only expanded visible branches.

## 18. Deep-tree strategy

Cycle detection, reachability, and flattening use explicit stacks. The depth-1,000 fixture passes without recursion or stack overflow.

## 19. Applied expandedKeys

`expandedKeys` is read-only applied state. None, single-root, nested, multiple-branch, reconstructed-array, unknown-key, and parent-replacement cases are covered. B emits no expansion proposal and never requests children.

## 20. Leaf/expandable semantics

A complete loaded relation with zero children, or an explicit total of zero, is a leaf. Other unresolved relations remain structurally expandable. `aria-expanded` appears only on expandable nodes and reflects applied state.

## 21. Tree column

Only the applied `hierarchyOptions.treeColumnId` owns indentation and the hierarchy affordance. An unresolved id produces `featureError.feature='hierarchy'` with `invalid-tree-column`; columns are not changed and no first-column fallback is selected.

## 22. Indentation/RTL

Indentation derives from projection depth and uses `padding-inline-start`, so it follows logical direction in RTL. No indentation is persisted in `T` or hierarchy state.

## 23. Columns

B renders applied headers, canonical values/accessors, basic templates, visibility, order, and widths. It does not add sorting, filtering, selection, editing, reorder, or advanced layout interactions.

## 24. Template contexts

The 11 directives have strongly typed contexts and no `TemplateRef<any>`. B connects caption, toolbar, header, node, cell, footer, summary, empty, loading, and error presentation; the editor contract is executable but its runtime starts later.

## 25. Renderer architecture

The private renderer accepts the computed applied projection and turns it into DOM. It owns no roots, hierarchy, expansion, query, selection, focus domain, request state, or virtual state.

## 26. DOM/treegrid structure

The renderer emits native `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, and `<td>` elements with `treegrid`, `row`, `columnheader`, and `gridcell` roles directly in the template. No post-render ARIA patch exists.

## 27. aria-level

`aria-level` is `depth + 1` and is derived directly from the private projection. Root, child, grandchild, and deep-node cases are covered.

## 28. aria-expanded

Expandable nodes expose the applied boolean. Leaves omit the attribute rather than presenting a false expandability signal.

## 29. aria-posinset/setsize

Position is the one-based index within the actual sibling relation. Set size is emitted only from a known relation total or a complete loaded relation; unknown size is not invented from global DOM position.

## 30. Empty/loading/error

Applied root state and typed templates drive presentation. There is no request, retry, timer, cache, or mutable owner in B.

## 31. Signal graph

Inputs feed computed visible columns, computed hierarchy normalization/projection, computed templates, and the private renderer. There are no writable input mirrors or synchronization effects.

## 32. Writable state

The only mutable field is the ephemeral diagnostic fingerprint snapshot used to prevent repeated public error emission. It does not copy or own hierarchy domain state.

## 33. Effects ledger

Product effects: **0**. The request coordinator and viewport lifecycle are absent until their authorized phases. The static boundary audit fails on any `effect()` call in the candidate.

## 34. Parent writes

Replacement of roots, data, hierarchy relations, expanded keys, columns, and reconstructed `T` instances with the same `K` recomputes DOM from applied state. Valid writes produce zero outputs and no echo.

## 35. Immutability

Deep-frozen fixtures verify no mutation of `T`, roots, relations, hierarchy metadata, expanded keys, columns, or presentation inputs. Projections and proposals are new readonly structures.

## 36. SSR

The Angular 22 server fixture renders the native treegrid, headers, applied roots/branches, levels, expanded state, sibling semantics, logical indentation, templates, and empty/loading/error states. It uses no browser geometry and emits no request or state output.

## 37. Hydration

Real Chromium reuses the SSR table, head, and keyed nested rows with zero NG050x and zero outputs. A post-hydration parent write preserves the controlled projection. The fixture cleanup now also handles loopback listen failure without leaving temporary folders.

## 38. Zoneless

The real consumer uses `provideZonelessChangeDetection()` and no Zone.js, `detectChanges()`, or `markForCheck()` architecture.

## 39. Focus/keyboard preparation

Rows have stable exact-key data identity and projection metadata for the row-focused model. Final roving tabindex and Arrow key behavior remain exclusively N2-015C work.

## 40. Pure tests

Coverage includes empty/single/multiple roots, exact identity, child relations, deep and partial expansion, path and sibling metadata, malformed references, cycles, duplicates, orphans, depth 1,000, width 10,000, reconstructed identity, determinism, and frozen inputs.

## 41. Integration tests

The private renderer tests native semantics, templates, tree/ordinary columns, applied expansion and collapse writes, leaves, logical RTL indentation, reconstructed data, states, zero echoes, and exactly-once invalid-tree-column and malformed-hierarchy diagnostics. Result: 10/10 directed candidate tests pass.

## 42. Type tests

`test:n2-tree-table-types` compiles a positive consumer without `as any` and confirms 11 invalid shapes fail, covering generics, hierarchy, roots/children, expansion, columns, directives, inputs/outputs/methods, and legacy shapes.

## 43. Contract tests

`test:n2-tree-table-contracts` passes 4/4 executable AST gates: exact surface, closed hierarchy errors, readonly/generic/no-any constraints, and candidate isolation.

## 44. Legacy ledger audit

The executable ledger accounts for exactly 42 inputs, 21 outputs, and eight methods. Every member has a non-DEPRECATE migration decision; the audit passes.

## 45. Boundary audit

The gate scans nine candidate runtime files and passes with zero forbidden facade/runtime dependencies, zero effects, no private metadata fields on `T`, and only approved neutral internal edges.

## 46. Shared extraction / NeuTable regression

The neutral helper files are minimal and TreeTable-only in this phase. An attempted immediate NeuTable import migration exposed a large package-retention regression and was reverted completely. NeuTable source, behavior, and certified baselines remain byte-for-byte unchanged in the final diff, so no NeuTable runtime regression was introduced.

## 47. 1k performance

Reproducible baseline: normalization p50/p95 **0.413/0.818 ms**; flatten p50/p95 **0.648/0.857 ms**. A repeated identical computed read is **0.002/0.112 ms**. Rendering 1,000 rows is **2.670/4.775 ms** with 5,008 fixture DOM nodes.

## 48. 10k performance

Wide 10,000-node normalization is **5.450/5.939 ms** p50/p95 and flattening is **6.965/7.435 ms**. The fixtures show no accidental quadratic path.

## 49. Deep-tree performance

Depth 1,000 projects in **2.277/3.136 ms** p50/p95 without stack overflow.

## 50. Expanded-branch performance

Applying expansion to a branch with 100 children projects in **0.080/0.086 ms** p50/p95.

## 51. Lifecycle

Fifty create/destroy cycles complete in **78.954 ms** in the baseline. B installs zero product effects, listeners, observers, timers, or subscriptions.

## 52. Bundle basic

Candidate BASIC is **49,201 B raw / 8,068 B gzip / 6,786 B Brotli**. The 120,496 B raw / 18,411 B gzip legacy figure is retained only as contextual baseline, not as a superiority claim.

## 53. Bundle nested/templates

Nested applied expansion is size-neutral with BASIC. The full template surface is **49,702 B raw / 8,225 B gzip / 6,934 B Brotli**. Main source attribution is component 4,416 B, hierarchy engine 3,513 B, renderer 2,047 B, and directives 1,704 B in the minified source graph.

## 54. Root-unused

Root-unused remains **0 B raw**. The gzip/Brotli wrapper measurements are 20/1 B and contain no retained candidate code.

## 55. Dependency graph

The packaged candidate imports only `@angular/core` and `@angular/common`. The source graph contains the private candidate plus the 108 B value resolver and 47 B exact-key helper; all forbidden graph tokens are absent.

## 56. Legacy regression

The directed legacy TreeTable suite remains unchanged and passes **76/76** across its component, hierarchy controller, and template directives. Existing CSS parser notices and Menu NG8102 warnings are unchanged global debt.

## 57. Build/package

Production library build passes. `audit:package` passes publint and ATTW, and `verify:package` passes for 431 packaged files. The candidate remains unpublished and the productive package graph is unchanged.

## 58. API surface verification

Executable gates confirm **66 types / 11 directives / 1 component / 22 inputs / 12 outputs / 4 methods**. `featureError` is still one of the same 12 outputs; only its closed discriminant domain gained `hierarchy`.

## 59. Regressions

No regression was found in legacy TreeTable, the current package, SSR/hydration, exact identity, or controlled parent writes. No full suite was run because the candidate is isolated, legacy runtime is untouched, and no broad shared extraction survived the final diff, matching the authorized policy.

## 60. Risks

The interaction contracts are intentionally executable before their implementations, so the four methods have safe B behavior and feature phases remain gated. Cross-entrypoint sharing with NeuTable needs a later packaging-aware extraction because a naïve shared-source import causes excessive retention. Remote, virtual, keyboard, and selection behavior remain future-phase risks rather than hidden B behavior.

## 61. Git diff

Expected categories only: two narrow architecture/type-contract amendments, isolated candidate source/tests, two neutral internal helpers, executable scripts/fixtures, package script registration, and N2-015B baselines/report. There are no changes to productive TreeTable, Table, TableCore, package entrypoints, Showcase, TreeSelect, or public snapshots.

## 62. Git status

Branch `v2`; working tree intentionally contains the uncommitted N2-015B files for review. No commit, push, tag, release, or npm publish was performed. No symlink or temporary hydration folder is part of the change.

## 63. Recommendation

**READY FOR N2-015C.** N2-015B satisfies its runtime, contract, malformed-hierarchy, SSR/hydration, zoneless, performance, bundle, legacy, build, package, and hygiene gates. Do not start N2-015C until separately authorized.
