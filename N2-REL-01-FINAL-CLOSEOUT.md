# N2 REL-01 — Final closeout

## 1. Final status

**REL-01 COMPLETE — READY FOR COVERAGE ASSURANCE.** All required REL-01G package, consumer, and bundle gates passed. This status does not claim global coverage assurance or strict ATTW success.

## 2. Starting checkpoint

Branch `v2` started at `ab1dcfd7771ba3c269a435e435a75b9c79a9600b`. The unrelated untracked `projects/ui-core/tree-table/public_api 2.ts` remained untouched, untracked and unstaged, SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`.

## 3. REL-01 phase history

REL-01A hardened package-only and root-unused evidence; REL-01B exposed the ID-boundary design question; REL-01C showed a source-file split did not change the emitted FESM; REL-01D identified Angular partial-declaration retention; REL-01E shipped a real `internal-state` entrypoint; REL-01F attributed the remaining Menu and PickList/OrderList H9 growth. Phase A of REL-01G committed only the four REL-01F evidence files as `fe2a07c0d9b520303567ba792662d6ba0c2cb7c8` (`test(release): attribute full-profile H9 bundle growth`), parent `ab1dcfd7771ba3c269a435e435a75b9c79a9600b`. All productive REL-01G work remains unstaged and uncommitted.

## 4. IA-02 final state

**Closed.** Package-only probes validate a real export, resolve its built FESM before tree shaking, reject a missing export, retain a used control and yield zero raw bytes for an unused import. The five focused harness tests pass.

## 5. IA-03 final state

**Closed.** Metafile assertions reject `projects/ui-core/**` inputs. The package checks use built exports and an empty tsconfig alias map. No historical source-mode number is presented as a published-package result.

## 6. Tree package-only correction

The six-case active evidence records Tree at **62,514 / 12,166 / 10,726 B** raw/gzip/Brotli, from a built-package export with a nonzero used control and zero raw unused output. The earlier mixed source/package Tree number is not the release comparator.

## 7. Table H9 correction

The H9 Table BASIC baseline and measured static initial closure are both **174,439 / 34,670 / 25,692 B**. Advanced behavior remains separate; the full advanced-lazy measurement is **192,972 / 40,302 / 30,598 B**. The obsolete TableCore comparator was not reinstated.

## 8. Button dependency normalization

The historical Button baseline remains **18,064 / 3,148 / 2,672 B**. The final H9 consumer is **16,276 / 2,669 / 2,272 B**, PASS, with the corrected icon dependency boundary.

## 9. internal-state root cause/remediation

`NeuIdGenerator` no longer pays for temporal and responsive service declarations in one internal FESM. The separate `internal-state` package preserves the old `internal` class identities; ID-only consumers tree-shake the heavy services. REL-01E established the package-level remediation and its directed identity/DI evidence.

## 10. Kanban result

The final H9 Kanban consumer is **43,517 / 7,587 / 6,600 B**, PASS against **43,578 / 7,879 / 6,860 B**. No new Kanban baseline was made in REL-01G.

## 11. ColorPicker result

Both basic and advanced H9 consumers are **59,866 / 11,735 / 10,288 B**, exactly their existing N2 baselines, PASS. REL-01G made no ColorPicker runtime change.

## 12. Menu root cause

Before REL-01G, importing only `NeuMenuComponent` from `@neural-ui/core/menu` retained the independent N2 TieredMenu renderer because Angular partial declarations and metadata shared the Menu FESM. The real package measurement was **96,145 / 12,782 / 10,803 B**. The public import scenario itself was valid.

## 13. Menu package topology

`menu` owns base Menu, MenuButton and Menubar; `menu-shared` owns the item type and directive; `menu-tiered` owns TieredMenu, nested level rendering and state. The built Menu FESM imports/reexports shared and tiered; tiered imports shared; shared imports neither. The emitted graph has no backward edge or cycle. FESM sizes are **49,328 B** Menu, **34,968 B** tiered, **1,200 B** shared. The supported `@neural-ui/core/menu` exports remain available with one runtime class identity.

## 14. Menu real before/after

The same H9 built-package `NeuMenuComponent` scenario changed **96,145 / 12,782 / 10,803 → 68,566 / 10,419 / 9,054 B**, saving **27,579 / 2,363 / 1,749 B**. The separate package-only export-proof harness reports **68,573 / 10,419 / 9,066 B** because its generated consumer differs slightly. Both prove the real emitted boundary; the H9 triplet is the budget authority. The base Menu output attributes **0 bytes** to the tiered FESM after tree shaking.

## 15. Menu H9 final decision

**PASS; retain the historical Menu baseline.** Baseline **70,946 / 10,266 / 8,913 B** and unchanged failure ceiling **72,720 / 10,780 / 9,359 B**. Final measured **68,566 / 10,419 / 9,054 B** is below every failure ceiling. No Menu N2 rebaseline was created.

## 16. Tiered behavior verification

Directed Menu/Tiered tests passed **37/37** after adding the runtime-alias assertion; the full suite includes them. The Chromium B2 test passed SSR and hydration with DOM reuse, stable controls, hover, nested keyboard behavior, escape, pointer dismissal, controlled expansion, RTL positioning, exactly-once item event and zero NG050x. The implementation was relocated without deleting its nested renderer, state, overlay or event behavior.

## 17. PickList/OrderList attribution

The H9 scenario still imports **both** public components from `@neural-ui/core/pick-list`, counts shared dependencies once and has no unrelated Menu/Tiered FESM input. REL-01F found the growth attributable to certified N2 behavior, without a duplicate shared engine or hidden lazy chunk. REL-01G changed no PickList/OrderList runtime code.

## 18. PickList/OrderList N2 baseline

Two canonical pre-update measurements were identical at **106,805 / 16,529 / 13,916 B**. Only this scenario's three baseline values changed. The existing formula gives failure ceilings **109,476 / 17,356 / 14,612 B**; warning ceilings are **107,874 / 16,860 / 14,195 B**. No tolerance formula changed.

## 19. Complete H9 baseline matrix

Triplets are raw/gzip/Brotli bytes. The measured column is the final canonical main/release profile. Existing warning-level Dialog rows remain visible and below failure ceilings.

| Scenario | Baseline | Measured | Status |
|---|---:|---:|---|
| root-unused | 0/20/1 | 0/20/1 | PASS |
| provider | 2178/948/854 | 787/450/392 | PASS |
| button | 18064/3148/2672 | 16276/2669/2272 | PASS |
| select | 125947/22311/19379 | 119881/20419/17796 | PASS |
| table-basic | 174439/34670/25692 | 174439/34670/25692 | PASS |
| table-advanced-lazy | 954019/165462/103647 | 192972/40302/30598 | PASS |
| tree-basic | 112111/20132/16971 | 62507/12166/10724 | PASS |
| tree-checkbox | 112111/20132/16971 | 62507/12166/10724 | PASS |
| tree-lazy | 112111/20132/16971 | 62507/12166/10724 | PASS |
| tree-virtual | 112111/20132/16971 | 62507/12166/10724 | PASS |
| tree-dnd-full | 112111/20132/16971 | 62507/12166/10724 | PASS |
| kanban | 43578/7879/6860 | 43517/7587/6600 | PASS |
| tree-table | 1040899/180473/113265 | 124801/25748/21873 | PASS |
| dialog-basic | 49238/9572/8347 | 50377/9744/8453 | WARN |
| dialog-draggable | 49238/9572/8347 | 50377/9744/8453 | WARN |
| dialog-resizable | 49238/9572/8347 | 50377/9744/8453 | WARN |
| dialog-maximizable | 49238/9572/8347 | 50377/9744/8453 | WARN |
| dialog-all-advanced | 49238/9572/8347 | 50377/9744/8453 | WARN |
| color-picker-basic | 59866/11735/10288 | 59866/11735/10288 | PASS |
| color-picker-advanced | 59866/11735/10288 | 59866/11735/10288 | PASS |
| pick-list-order-list | 106805/16529/13916 | 106805/16529/13916 | PASS |
| menu | 70946/10266/8913 | 68566/10419/9054 | PASS |
| pagination | 140883/24933/21379 | 135096/23149/19885 | PASS |

## 20. PR/main/release H9 results

Each profile passed **twice** with identical results and **0 architectural failures**. PR covered **7** consumers; main and release covered **23** each. All reported **112** chunks. The five Dialog WARN rows are nonblocking under the existing policy.

## 21. Canonical compression environment

Darwin arm64; Node **22.22.3**; zlib **1.2.12**; Brotli **1.2.0**; gzip level **9**; Brotli quality **11**. The active gate compares every field and fails closed if the environment differs.

## 22. Historical REL-01 artifact

`baselines/n2-release/rel-01-package-bundle.json` is byte-identical, SHA-256 **`c2d296a2d72c42dd2162917a627305bdd3629072c73d837f292bc4f56bc42c23`**. It remains historical evidence and is never the update target.

## 23. New active REL-01 artifact

`baselines/n2-release/rel-01-package-bundle-active-n2.json` is the active exact evidence for six cases: root, Tag, Table, TreeTable, Tree and VirtualList. It records schema version, methodology, full canonical compression environment, used/unused measurements, package input lists, invalid-export controls and **37** audited root-unused harnesses. The gate passed twice after the final build.

## 24. Codec migration provenance

The active artifact records the historical path and SHA. The gate checks historical SHA before measuring, demands unchanged used raw and Brotli bytes, and verifies the reviewed gzip deltas: root **−2**, Tag **+1**, Table **−89**, TreeTable **−15**, Tree **−33**, VirtualList **+12 B**. It refuses an unreviewed codec or evidence change.

## 25. Root-unused

All six active REL-01 cases and Menu, TieredMenu, the shared directive, PickList and OrderList produce **0 raw bytes** for a valid unused import. Their used controls are nonzero and invalid exports are rejected. The five focused negative/positive harness tests pass.

## 26. Source leakage

The proof harnesses use built package export targets, JavaScript loading and package-only metafiles. Workspace runtime paths under `projects/ui-core/**` are rejected. The Menu and PickList/OrderList probes passed these checks.

## 27. Tree-shaking isolation

The Menu FESM no longer contains TieredMenu or nested-level class implementations, and the final base Menu bundle attributes **0 tiered output bytes**. A used TieredMenu import retains its tiered FESM. Used PickList and OrderList imports resolve no Menu, shared Menu or TieredMenu FESM. No accidental cross-facade retention was measured.

## 28. Contracts

Public contract audit and its **5/5** focused tests pass: **100** entrypoints, **818** exported declarations, **1,467** bindings, **5,220** classified symbols. A direct comparison with the starting contract finds **3,305 supported symbols before and after**, with no added, removed or changed supported kind/signature/selector. The three added declarations are classified internal/unsupported on `menu-shared` and `menu-tiered`. Angular-generated private directive metadata changed its local declaration alias with the move, without changing the public selector or template-ref signature.

## 29. Package exports

The package has **100** importable entrypoints, up from **98**. `@neural-ui/core/menu` keeps all existing exports; `menu-shared` and `menu-tiered` are internal/unsupported topology boundaries. Runtime identity checks prove the compatibility reexports refer to the same directive and component classes.

## 30. Build

`npm run build` passed with ng-packagr partial compilation and the three emitted Menu boundaries.

## 31. Package verify

`verify:package` passed with **443** package files. No package verification exception was introduced.

## 32. Imports

The entrypoint import smoke passed for **100/100** exports. The Angular 22 tarball consumer also imported the changed and representative adjacent package subpaths.

## 33. SSR

The package SSR import smoke passed for **100/100** entrypoints. The tarball SSR scene rendered Menu, MenuButton, Menubar, TieredMenu, PickList, OrderList, Table, ColorPicker and Kanban with hydration annotations and no server error after supplying Table's required `rowKey`.

## 34. Hydration

The real Chromium B2 SSR/hydration run passed for base Menu, MenuButton, Menubar and TieredMenu, including DOM reuse, controls, overlay interaction and zero NG050x. The same browser harness then passed again with the library installed from an actual tarball and no workspace aliases. Both SSR outputs carried `ngh` annotations.

## 35. Zoneless

The B2 browser fixture and tarball SSR scene use `provideZonelessChangeDetection`; no zone.js runtime was added.

## 36. Angular tarball consumer

A clean Angular **22.1.6** fixture installed the packed package, built its browser application and passed the Menu/Tiered/Pick/Order/Table/Color/Kanban/internal-state SSR and import checks. A second clean installed-tarball fixture passed the Chromium hydration interaction harness. Neither used workspace aliases nor `npm link`. The corrected final run had no `ERROR`, `NG0950` or failed line.

## 37. Full suite

`ng test ui-core --watch=false --no-coverage` passed: **188/188** files, **2,516/2,516** tests. No coverage threshold was run or changed.

## 38. Publint

Publint **0.3.23** with `--strict` reported **All good!** on the built package.

## 39. Strict ATTW

Strict ATTW exits **1**. Its final packed-package ASCII report has only **100** `CJSResolvesToESM` warnings for unsupported CommonJS resolution and **4** `NoResolution` cells for the Sass `styles` export. `menu-shared` and `menu-tiered` each contribute one CJS warning of the same category. No other diagnostic category appeared.

## 40. ATTW release policy

**ATTW STRICT — KNOWN UNSUPPORTED-CONDITION DEBT.** This is explicitly **not** ATTW PASS. It is nonblocking for N2 release certification while supported Angular/Node ESM, bundler, SSR, Sass and package consumers pass. Any new category affecting a supported consumer changes the result to **ATTW PACKAGE REMEDIATION REQUIRED**. Do not add a CJS build, fake Sass declarations or diagnostic ignores merely to clear strict ATTW.

## 41. Coverage status

Coverage assurance remains the next independent activity. REL-01G deliberately ran the full suite without coverage and did not change the **95.01%** global threshold.

## 42. Runtime/API/package delta

Runtime behavior and supported Menu API are preserved. Productive code moved the shared item directive/type and TieredMenu family into two package boundaries; the existing Menu subpath reexports them. The sole numerical H9 baseline delta is the authorized combined PickList/OrderList triplet. The active REL-01 codec artifact is new; the historical one is unchanged.

## 43. Remaining release debts

The classified strict ATTW CJS/Sass debt, five pre-existing Dialog H9 WARN rows and independent global coverage assurance remain visible. A direct exploratory call to `verify-release-artifacts` on the raw build reported source maps in the unprepared `dist`; that verifier requires the separate release-artifact preparation flow, which was outside this no-release task. No release-artifact certification is claimed. No push, tag, publish, release, REL-02 or Showcase 2 action was performed.

## 44. Recommendation

Proceed to coverage assurance from this reviewed REL-01 closeout. Leave productive REL-01G files unstaged and uncommitted for inspection; preserve the foreign TreeTable file. Keep the historical Menu budget and REL-01 artifact frozen.
