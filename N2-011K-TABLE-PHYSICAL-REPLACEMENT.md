# N2-011K — Table 2 + TreeTable 2 physical replacement

## 1. Final status

**TABLE 2 + TREETABLE 2 PHYSICAL REPLACEMENT PASS.**

The product now exposes exactly two independent data-grid facades:

- `@neural-ui/core/table` → `NeuTableComponent<T, K, F>` / `<neu-table>`;
- `@neural-ui/core/tree-table` → `NeuTreeTableComponent<T, K, F>` / `<neu-tree-table>`.

Table 1.x, TableCore, TreeTable 1.x and the temporary candidate paths are physically absent. No compatibility runtime, alias, wrapper or redirect was introduced.

## 2. Original blocker

The first N2-011K execution started from `c1e07dddd42ac27e8e46960ec0b34a4176b59162` and stopped correctly before changing runtime. TreeTable 1.x still delegated 42 inputs, 21 outputs and 8 methods to Table 1.x/TableCore, so deleting the flat legacy graph would have required either a compatibility layer or a deep TreeTable rewrite.

That attempt remains recorded as **BLOCKED** history; this resumed execution did not restart the audit or reopen the certified Table design.

## 3. TreeTable 2 unblock evidence

NeuTreeTable 2 was rewritten independently, certified in N2-015I and committed before resuming K:

- N2-015H checkpoint: `037e46bb2294414a32a8127c52eb50d86b10d59b`;
- N2-015I checkpoint: `f4b6c54b7c3cde9a0f4059ee9b4c1b9bf4062743`;
- result: `CERTIFIED FOR N2-011K`;
- no runtime dependency on NeuTable, TableCore or either legacy facade.

## 4. Starting checkpoints

- Branch: `v2`.
- NeuTable certification: `c1e07dddd42ac27e8e46960ec0b34a4176b59162`.
- NeuTreeTable final certification: `f4b6c54b7c3cde9a0f4059ee9b4c1b9bf4062743`.
- N2-011K began with a clean working tree after committing N2-015I.
- No behavior was redesigned in K; changes are promotion, removal, package/tooling migration, consumer migration and generated-contract updates.

## 5. NeuTable promotion

`projects/ui-core/table/next/**` was promoted into `projects/ui-core/table/**`. The final root barrel exports `./public/public-api`; certified private folders remain private. The selector remains uniquely `neu-table`.

## 6. NeuTreeTable promotion

`projects/ui-core/tree-table/next/**` was promoted into `projects/ui-core/tree-table/**`. Its two certified neutral helpers were moved inside `tree-table/internal/shared` solely to satisfy the final secondary-entrypoint packaging boundary. NeuTable was not touched and no bilateral extraction was performed. The selector remains uniquely `neu-tree-table`.

## 7. Table 1.x removal

The old facade, controllers, query/state engines, legacy remote/lazy channels, selection/edit/group/export implementations, virtual engine, URL/storage adapters, legacy styles and API-only specs were deleted. There is no old Table runtime beneath the final facade.

## 8. TableCore removal

The complete `projects/ui-core/table-core` secondary entrypoint was deleted: sources, public barrel, ng-package metadata, selector, styles and tests. The final package has no `./table-core` export, declaration, FESM, redirect or empty barrel.

## 9. TreeTable legacy removal

The legacy facade, hierarchy controller, templates, flat-state orchestration, legacy lazy/tree paths and its three API-era spec files were deleted. NeuTreeTable 2 does not wrap or instantiate the old component.

## 10. Final source layout

Both final entrypoints use the same product shape:

```text
projects/ui-core/table/
  public/
  internal/
  *.spec.ts
  public_api.ts
  ng-package.json

projects/ui-core/tree-table/
  public/
  internal/
  *.spec.ts
  public_api.ts
  ng-package.json
```

There is no `next`, `candidate`, `v2`, `table-core` or second facade directory.

## 11. Final package exports

- Present: `@neural-ui/core/table`.
- Present: `@neural-ui/core/tree-table`.
- Absent intentionally: `@neural-ui/core/table-core`.
- Entry points: 102 before K, 101 after K.
- Package verification: PASS, 447 published files.
- SSR import smoke: PASS, all 101 entrypoints.

## 12. Final Table API

Contract gates confirm exactly:

- 66 public types;
- 15 directives;
- 1 component;
- 82 exported symbols;
- 24 inputs;
- 14 outputs;
- 4 methods.

## 13. Final TreeTable API

Contract gates confirm exactly:

- 66 public types;
- 11 directives;
- 1 component;
- 22 inputs;
- 12 outputs;
- 4 methods.

## 14. Contract regeneration

`tokens:generate` regenerated 282 public tokens. `snapshot:contracts` regenerated `public-contract.v2.json` and the historical reconciliation through the official generator. Final audit: 101 entrypoints, 789 exported declarations, 1,496 bindings and 5,243 classified symbols.

The policy now lists only the four certified methods on each final facade and removes the old Table registry/compatibility classifications.

## 15. Legacy API scans

The new executable `audit:n2-table-physical-replacement` gate verifies:

- TableCore directory/export/symbol/selector absent;
- legacy Table and TreeTable facade files absent;
- `next` paths absent;
- removed ledger members absent from the final classes;
- one `neu-table` and one `neu-tree-table` selector;
- no Router, HTTP, storage or PrimeNG edge;
- exact 2/4 effect budgets;
- zero runtime symlinks.

Result: PASS across 55 active runtime files.

## 16. Table migration fixtures

The eleven certified recipes compile against `@neural-ui/core/table`: basic, remote, query, selection, virtual, editing, expansion/grouping, export, URL, storage and TableCore→NeuTable. No internal or candidate import is used.

## 17. TreeTable migration fixtures

The certified hierarchy, expansion, remote children, selection, query, virtual, editing, export and legacy-migration examples compile against `@neural-ui/core/tree-table`. They use clean domain rows plus the parent-owned hierarchy relation.

## 18. Legacy test classification

- A — behavior already covered: duplicate legacy renderer/controller tests removed after the certified final suites were retained.
- B — relevant uncovered P1 behavior: none found; no test migration was required to preserve a missing P1 path.
- C — legacy API-only: facade, controller, TableCore and 42/21/8 compatibility tests removed as the intended major break.
- D — P2/P3: not reintroduced; variable-height/grouping+virtual/expansion+virtual/remote-key lookup and tree reorder remain outside K.

## 19. Test count accounting

| Measure | Before K | After K | Delta |
|---|---:|---:|---:|
| Full-suite files | 203 | 170 | -33 |
| Full-suite tests | 3,166 | 2,417 | -749 |

Deleted spec files: 29 Table 1.x, 1 TableCore and 3 TreeTable 1.x. The final promoted suites remain: 22 NeuTable files / 124 tests and 17 NeuTreeTable files / 88 tests. No functional P1 loss was identified.

## 20. NeuTable tests

PASS: 22/22 files, 124/124 tests covering renderer, query, selection, layout, remote, virtual, editing, expansion, grouping, export and lifecycle behavior.

## 21. NeuTreeTable tests

PASS: 17/17 files, 88/88 tests covering hierarchy, renderer, expansion, keyboard/focus, selection, query, remote roots/children, virtualization, editing, export, lifecycle and accessibility behavior.

## 22. Full suite

PASS without global coverage: 170/170 files and 2,417/2,417 tests. Duration of the recorded final run: 67.85 s.

## 23. Build

Production Angular package build: PASS. The two known Menu NG8102 warnings remain unchanged and were not modified.

## 24. Package verification

`audit:package`: PASS. `verify:package`: PASS. The published projection contains both final entrypoints and no TableCore entry.

## 25. Import smoke

The Angular 22.1.6 consumer imports only the two final subpaths. Build and representative Table/TreeTable rendering pass. No internal-path import is required.

## 26. SSR import smoke

PASS for all 101 final entrypoints. Table and TreeTable evaluate without browser globals. TableCore is absent from the package export map.

## 27. Angular 22 consumer

PASS on Angular 22.1.6: production build, zoneless providers, basic final Table, controlled hierarchy TreeTable, generated CRUD page, server rendering and entrypoint imports. The CRUD schematic was minimally updated to supply the required semantic `rowKey`.

## 28. Table SSR/hydration

Real Chromium PASS: deterministic virtual SSR bootstrap, satisfied range with zero duplicate request, accepted request paths exactly once, bounded DOM, DOM reuse, zero NG050x and zero mechanical accessibility violations.

## 29. TreeTable SSR/hydration

Real Chromium PASS: DOM reuse, native table/treegrid structure, empty/loading/error, RTL logical indentation, narrow containment, optional chunks lazy, editor/JSON exactly once, controlled interactions exactly once, zero viewport request and zero NG050x.

## 30. Zoneless

Both final consumers run with `provideZonelessChangeDetection()`. No Zone.js dependency or compatibility change-detection bridge was introduced.

## 31. Effects audits

- NeuTable: exactly 2 product effects (request coordination and viewport lifecycle).
- NeuTreeTable: exactly 4 certified product effects.
- No compatibility or promotion effect was added.

## 32. Accessibility smoke

NeuTable retains native table semantics. NeuTreeTable retains native table plus treegrid semantics. Chromium hydration checks found zero mechanical violations and no ARIA regression caused by the path promotion.

## 33. Table dependency graph

The final graph contains Angular core/common, private Table runtime and private dynamic chunks. It has no edge to Table 1.x, TableCore, TreeTable, Router, HTTP, storage, PrimeNG or a third-party grid/XLSX runtime.

## 34. TreeTable dependency graph

The final graph contains Angular core/common, private TreeTable runtime and its internal neutral helpers. It has no edge to TreeTable 1.x, NeuTable, Table 1.x, TableCore, Router, HTTP, storage or PrimeNG.

## 35. Table bundle

Final promoted `@neural-ui/core/table`:

| Scenario | Raw | Gzip | Brotli |
|---|---:|---:|---:|
| BASIC / enterprise initial / remote / virtual / combined initial | 174,362 B | 34,516 B | 25,552 B |
| root-unused | 0 B | 20 B container | 1 B container |

The measured initial closure is byte-identical to the checked-in N2-011J bundle baseline. Runtime configuration does not create separate compile-time closures; the enterprise/remote/virtual scenarios therefore share BASIC until a private feature is invoked.

## 36. TreeTable bundle

Final promoted `@neural-ui/core/tree-table`:

| Scenario | Raw | Gzip | Brotli |
|---|---:|---:|---:|
| BASIC | 112,510 B | 22,483 B | 19,039 B |
| combined/templates | 113,211 B | 22,763 B | 19,278 B |
| root-unused | 0 B | 20 B container | 1 B container |

Against N2-015I BASIC (112,525/22,485/19,049), promotion changes -15 raw, -2 gzip and -10 Brotli: well inside the 5% gate.

## 37. Optional chunks

NeuTable keeps advanced filter, active Signal Forms editor, CSV, JSON and XLSX behind dynamic imports. Export chunk gzip sizes remain CSV 383 B, JSON 469 B and XLSX 1,422 B.

NeuTreeTable keeps its active editor and private export boundary lazy. Final gzip sizes: editor 1,185 B, shared export projection 1,097 B, CSV 386 B, JSON 471 B and XLSX 1,425 B.

## 38. Root-unused

PASS for both final entrypoints: 0 B raw. Neither facade is retained by an unused root import.

## 39. Table legacy absence

Proof: zero old facade file, duplicate selector, legacy state/query controller, old remote channel, old virtual implementation or old export implementation in the shipped source/package.

## 40. TableCore absence

Proof: zero source folder, entrypoint, export-map key, FESM, declaration, selector, runtime import or current consumer recommendation.

## 41. TreeTable legacy absence

Proof: zero old facade, old hierarchy/orchestration engine, legacy 42/21/8 runtime API, old lazy/tree engine, Table dependency or compatibility wrapper.

## 42. Candidate path absence

The product tree contains no Table/TreeTable `next`, candidate or v2 implementation directory. Hydration and bundle fixtures were renamed to final paths. Historical N2 reports retain historical terminology.

## 43. Breaking migration delta

- REMOVED: Table 1.x, TableCore, TreeTable 1.x, legacy URL/storage owners and parallel remote/virtual/export/edit paths.
- CHANGED: flat legacy state becomes the certified controlled Table query/state and controlled TreeTable hierarchy.
- MERGED: scalar legacy flags move into the frozen cohesive option contracts.
- RENAMED: legacy lazy/server events become the single certified `dataRequest` channels.
- INTERNALIZED: renderers, hierarchy projections, drafts, focus state and serializers.
- No DEPRECATE target or runtime adapter remains.

## 44. Known debts intentionally untouched

- Global coverage was not rerun; N2-015I remains the recorded checkpoint (lines 96.17%, statements 94.66%, functions 94.42%, branches 91.43%, threshold 95.01%).
- The entrypoint audit now has zero Table/TreeTable findings and still reports exactly the 17 previously known missing Showcase demos.
- The historical aggregate H9-B4 bundle policy was migrated away from TableCore but its shared budgets were not recalibrated in K. Its dedicated Table/TreeTable K bundle gates pass; the aggregate audit remains red for stale Table/Tree/ColorPicker budgets and requires separate global-policy authorization.
- Menu NG8102, Firefox/WebKit installation, axe installation and unrelated component debts remain untouched.

## 45. Git diff review

The diff is limited to expected categories: candidate promotion/moves, legacy deletion, package/contract tooling, migration fixtures and consumer/schematic adaptation, generated contracts/baselines, static absence gates, and minimal historical-doc labeling. No unrelated runtime feature or broad refactor was found.

## 46. Symlink/file hygiene

`git diff --check`: PASS. Tracked mode 120000: 0. Changed mode 120000: 0. Runtime symlinks: 0. Temporary N2 hydration/bundle directories: 0. No dist/coverage artifact was newly tracked.

## 47. Remaining risks

The physical replacement itself has no open blocker. Remaining work is operational: review the destructive diff, authorize the local K commit, and separately decide whether to recalibrate the shared H9-B4 policy. Future Table P2 and TreeTable P2/P3 remain explicitly out of scope.

## 48. Final recommendation

**TABLE 2 + TREETABLE 2 PHYSICAL REPLACEMENT PASS**

N2-011K is complete in the working tree and ready for review. No commit, push, tag, release or npm publish was performed.
