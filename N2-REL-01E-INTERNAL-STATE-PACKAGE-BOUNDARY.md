# N2 REL-01E — Internal-state package boundary

All byte triplets below are **raw / gzip / Brotli bytes**. Productive measurements use the built Angular package, esbuild with external Angular/CDK/RxJS, gzip level 9 and Brotli quality 11 on Node 22.22.3 (Darwin arm64, zlib 1.2.12, Brotli 1.2.0). Diagnostic virtual bundles are identified explicitly; they are not shipping code.

## 1. Status

**NEEDS DESIGN REVIEW.** The REL-01E boundary works and the authorized PR-profile H9 changes pass. The full `main`/`release` H9 profiles still fail the unchanged Menu and PickList/OrderList historical budgets. The legacy REL-01 package evidence gate also fails closed because its historical baseline lacks codec metadata. Neither historical artifact was rewritten. Strict ATTW still reports classified CJS/Sass debt. Coverage assurance has not begun.

## 2. Starting checkpoint

Branch `v2` started at `7773da735f3098070c0f496463f1c7eee092e402`. Component development was closed at 94/94 with no open P0/P1. The REL-01D root-cause audit had proved that Angular partial declarations for temporal and responsive state are retained beside `NeuIdGenerator` in one internal FESM.

## 3. Evidence commit

Phase 0 committed only the existing REL-01C/D evidence and audit tooling: `9e2567cb4efc8ad5224a23fbaebaaff84d0f02ca`, parent `7773da735f3098070c0f496463f1c7eee092e402`, message `test(release): prove internal FESM retention root cause`. No productive source or H9 baseline was included. All subsequent REL-01E work remains unstaged and uncommitted.

## 4. Root cause

The former `internal` FESM contained the ID class and both state services. Angular-generated injectable declarations and class metadata kept the two otherwise unrelated services reachable from an ID-only import. Splitting TypeScript files inside that same secondary entrypoint had saved zero raw bytes in REL-01C. The effective boundary is a separate emitted package FESM.

## 5. Chosen architecture

`NeuIdGenerator` remains the sole root-provided ID class in `internal`. `NeuInitialTemporalState` and `NeuResponsiveState` moved, with their implementation and decorators, to the new `internal-state` secondary entrypoint. `internal` re-exports both names from that entrypoint. The 40 productive consumer import sites remain unchanged.

## 6. Package topology before/after

Before: one `internal` FESM owned all three injectable classes (53,048 bytes). After: `neural-ui-core-internal.mjs` is 46,923 bytes and has no temporal-state key or `matchMedia`; `neural-ui-core-internal-state.mjs` is 6,551 bytes and owns the two heavy classes. Its appearance in esbuild's resolved input graph does not imply retained output bytes: the ColorPicker output has zero attributed internal-state bytes.

## 7. Export map delta

The package adds exactly `./internal-state`, with its JavaScript and declaration paths. The existing `./internal` export path and its named compatibility exports remain. Package entrypoints increase from 97 to 98. No ID-specific or foundation export was added.

## 8. Supported API compatibility

The supported-symbol inventory remains 3,305. No old contract symbol was removed. The new entrypoint is classified internal/unsupported; two new service declarations and their nine members add 11 internal inventory symbols. The contract collector resolves the existing `internal` re-export to the new declaration owner so its old members and signatures remain attributable to the same exported names.

## 9. DI identity

A directed Angular test confirms that each state class imported from `internal` is strictly identical to its canonical `internal-state` export. It also verifies the root singleton and two explicit child-injector resolutions. The six-test directed suite passes. The ID class remains one `providedIn: 'root'` definition; no duplicate token was introduced.

## 10. Cycle audit

The relevant package graph is `internal → internal-state → foundation`; `internal` also uses `option-api`. `internal-state` has no edge back to `internal`. The source and emitted package graph have no new cycle.

## 11. Minimal ID consumer before/after

An import of `NeuIdGenerator` from the built `@neural-ui/core/internal` package changes from **5,847 / 1,852 / 1,615** to **2,426 / 806 / 696**, saving **3,421 / 1,046 / 919**. Both temporal and responsive markers disappear. The old figure is the canonical REL-01D real-package baseline; the new figure is the productive REL-01E build.

## 12. 36 ID-only entrypoint result

All 36 individually imported ID-only entrypoints have neither `neu-temporal-state-` nor `matchMedia` in their minified outputs. This includes Kanban, ColorPicker, Menu and the other 33 classified imports. Five composed ID-only entrypoints measure 228,678 / 40,015 / 30,550; ten measure 340,001 / 57,205 / 42,472; all 36 composed measure 1,214,441 / 189,451 / 120,392. Both markers remain absent in every composition. These are separate application shapes, not 36 additive savings.

## 13. Heavy legitimate consumers

DateInput, NotificationCenter and MegaMenu legitimately use temporal or responsive state and still resolve `internal-state`. Their namespace bundles measure 103,167 / 16,151 / 14,121; 33,540 / 7,510 / 6,583; and 60,095 / 10,475 / 8,981, respectively. The shared state FESM lets each retain the other service too. A **virtual-only** split of the two classes suggests roughly 1.7–1.8 KB raw could be removed per relevant bundle; no second productive entrypoint was created. A composition of all 39 entrypoints legitimately retains both markers (1,377,750 / 214,012 / 135,844).

## 14. Kanban before/after

The same direct component-export package scenario measured in REL-01D changes from **46,645 / 8,440 / 7,373** to **43,526 / 7,593 / 6,599**, saving **3,119 / 847 / 774**. No temporal or responsive marker remains. The composed Kanban+ColorPicker bundle is 100,748 / 18,447 / 15,533 after remediation.

## 15. Kanban H9

Canonical H9 changes from **46,636 / 8,434 / 7,390** to **43,517 / 7,587 / 6,600**, saving **3,119 / 847 / 790**. It passes the unchanged historical baseline **43,578 / 7,879 / 6,860**. No Kanban baseline or tolerance changed.

## 16. ColorPicker before/after

The same direct component-export package scenario changes from **63,018 / 12,586 / 11,051** to **59,880 / 11,741 / 10,289**, saving **3,138 / 845 / 762**. The canonical H9 scenario changes from **63,004 / 12,580 / 11,045** to **59,866 / 11,735 / 10,288**, saving **3,138 / 845 / 757**. Neither heavy state marker remains.

## 17. ColorPicker residual attribution

The final direct output attributes 57,052 raw bytes to the ColorPicker FESM, 2,399 to the internal ID path and 391 to foundation. The component now has 967 source lines versus 810 at the N1.15 tag; its source diff is +251/−94 lines. `color-utils.ts` is byte-identical to N1.15, so there is no new duplicate parser or color math. The residual is concentrated in the component's N2 EyeDropper cancellation, focus behavior, accessible overlay content, deterministic IDs and Signal Forms integration, together with Angular-generated component metadata. The old CVA runtime was removed. The Signal Forms interface import is type-only, so a full Angular Forms runtime does not enter this bundle. CDK overlay is external under the measurement contract. The output contains no Kanban, Table, Tree, third-party color library, unrelated overlay implementation or temporal/responsive service.

## 18. ColorPicker optimization candidates

A virtual diagnostic that empties the EyeDropper sampling method reduces **59,880 / 11,741 / 10,289** to **59,025 / 11,527 / 10,099**. Emptying cancellation too reaches **58,746 / 11,491 / 10,078**. This destructive upper-bound proxy saves only 1,134 raw bytes and remains above the old raw failure ceiling (about 56,817). Removing those methods would lose user-visible behavior; the browser EyeDropper must also start from its user gesture. No clean, material, feature-preserving package split was demonstrated. The virtual stubs were never applied to source or `dist`.

## 19. ColorPicker baseline decision

The historical baseline **55,431 / 11,375 / 10,007** is incompatible with the certified N2 feature set at the measured package boundary. After the residual audit found no material clean avoidable retention, set a new N2 basic and advanced ColorPicker baseline to the measured **59,866 / 11,735 / 10,288**. Both H9 scenarios pass. This decision does not relax the common headroom formula.

## 20. Button

Canonical Button H9 is **16,276 / 2,669 / 2,272** and passes its unchanged historical **18,064 / 3,148 / 2,672** baseline. Button runtime and baseline were untouched.

## 21. Table

Table BASIC's initial static closure is **174,439 / 34,670 / 25,692**. The old 30,198 / 4,084 / 3,446 TableCore comparator omits current BASIC functionality and is not comparable. Advanced filter, active editor, CSV, JSON and XLSX remain five distinct lazy outputs; the advanced-lazy H9 scenario is **192,972 / 40,302 / 30,598** and passes its unchanged existing budget. Table runtime was untouched.

## 22. H9 final baselines

Only three baseline records changed: Table BASIC and ColorPicker basic/advanced. Table BASIC is **174,439 / 34,670 / 25,692**; ColorPicker basic and advanced are each **59,866 / 11,735 / 10,288**. Button, Kanban, Menu, PickList/OrderList and every other baseline remain historical. Tolerances remain unchanged. The new failure ceilings from the existing formula are **178,800 / 36,404 / 26,977** for Table BASIC and **61,363 / 12,322 / 10,803** for each ColorPicker scenario. The PR H9 profile passes 7 consumers and 110 chunks.

## 23. Root-unused

The built-package root-unused controls pass for the internal ID export, the canonical temporal state export and ColorPicker. Each has nonzero used output, zero unused raw bytes and a rejected invalid-export control. No root-only transitive code leak is counted as a valid consumer saving.

## 24. Source leakage

The bundle audit resolves the built package export map and records compiled FESM inputs. It finds no `projects/ui-core` source input in the measured outputs. The ColorPicker output retains no internal-state FESM bytes despite that module being resolvable during linking.

## 25. SSR

Built-package SSR import smoke passes all 98 entrypoints. The Angular 22 tarball consumer server-renders DateInput, NotificationCenter, MegaMenu, Kanban and ColorPicker with hydration annotations. No SSR rendering failure was observed.

## 26. Hydration

Chromium hydration checks pass for the same five components, including NotificationCenter's overlay. Each verifies DOM reuse and zero NG050x errors. These are directed browser checks of the produced package.

## 27. Zoneless

The directed ColorPicker, MegaMenu and Kanban hydration/browser flows pass in zoneless mode. The moved state services retain their original platform and after-render guards.

## 28. Contracts

`audit:contracts` passes with 98 entrypoints, 815 exported declarations, 1,462 bindings and 5,190 classified symbols. The contract unit suite passes 5/5. Existing `internal` service member signatures remain represented after the declaration-owner move; supported inventory remains 3,305.

## 29. Package exports

The real `npm run build` succeeds. Package verification passes 435 files, import smoke passes 98 imports, SSR import smoke passes 98 entrypoints, and publint exits successfully. `./internal-state` is the sole package export-map addition.

## 30. Tarball consumer

The clean Angular 22.1.6 compatibility fixture installs the real `npm pack` artifact, builds its browser application using the five REL-01E components, runs its Sass and existing SSR checks, then passes a new five-component server-render/identity check and entrypoint imports. The fixture's temporary installation is cleaned by its runner.

## 31. Full suite

The no-coverage ui-core suite passes **188 files / 2,515 tests**. The directed six-test DI suite and five package-bundle control tests also pass. No global coverage measurement was run.

## 32. Build/package/imports

Final `npm run build`, `verify:package`, `audit:contracts`, `test:imports`, `test:ssr-smoke` and publint pass. The legacy REL-01 package evidence command exits before comparison: its frozen JSON lacks `compressionEnvironment`, while the hardened auditor requires the canonical Node/zlib/Brotli tuple. The historical file was preserved. REL-01E's new built-package boundary audit supplies current topology and byte evidence but does not silently replace that release gate.

## 33. ATTW

Strict ATTW exits 1 with **98 `CJSResolvesToESM`** diagnostics (97 historical plus the new internal-state export) and **4 `NoResolution`** diagnostics for `./styles`. No new category indicates a supported ESM/Angular consumer regression. No ignore was added, and strict ATTW is not claimed as passing.

## 34. Toolchain determinism

Two final canonical Node 22.22.3 PR-profile H9 runs match exactly in raw, gzip and Brotli for all scenarios and pass. The main and release profiles produce the same two remaining failures. The codec-sensitive legacy REL-01 baseline remains a separate release-toolchain decision; its frozen compressed figures were not rewritten.

## 35. Runtime diff

Productive source changes are the moved state implementation in `projects/ui-core/internal-state/neu-hydration-states.ts`, its new barrel and package declaration, and the slimmed `internal/neu-hydration-internals.ts` plus compatibility re-export. The ID implementation and all 40 consumer imports stay on `internal`. Additional unstaged changes are directed tests, package/contract tooling, H9's three permitted baseline records, the Angular tarball fixture and three reproducible REL-01E diagnostic scripts. No component runtime file was edited.

## 36. Remaining release debts

Full H9 `main`/`release` still fails unchanged **PickList/OrderList** (**106,805 / 16,529 / 13,916** versus **76,025 / 11,936 / 10,202**) and **Menu** (**96,145 / 12,782 / 10,803** versus **70,946 / 10,266 / 8,913**). Their failure ceilings are **77,926 / 12,533 / 10,713** and **72,720 / 10,780 / 9,359**, respectively. They need a separate design/budget decision outside this request's permitted baseline edits. The legacy REL-01 codec baseline and strict ATTW CJS/Sass diagnostics remain classified toolchain/package debts. Global coverage assurance, REL-02 and Showcase 2 remain future work.

## 37. Final recommendation

Review the Menu and PickList/OrderList full-profile H9 failures as a separate design decision, then resolve the historical REL-01 codec evidence and ATTW policy before release certification. The REL-01E internal-state boundary and scoped H9 decisions are ready for review in the working tree. Git status has only the REL-01E modified/untracked files and the foreign untracked file; the staging area is empty. `git diff --check` passes, with zero symlinks and zero temporary files in the workspace (excluding installed dependencies and generated distribution). Leave the changes unstaged and uncommitted. No push, tag, release or npm publication was performed. The foreign `projects/ui-core/tree-table/public_api 2.ts` remains unstaged and byte-identical at SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`.
