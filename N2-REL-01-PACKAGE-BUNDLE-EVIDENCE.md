# N2 REL-01 — Package and bundle evidence hardening

## 1. Status

**REL-01 PACKAGE REMEDIATION REQUIRED (REL-01A Case A).** The follow-up in §34 corrected H9's Table initial/static measurement and Button's historical icon boundary without changing runtime or budgets. A reproducible, evidence-only package-boundary probe found a material Kanban/ColorPicker saving candidate; the actual package topology, shared DI identity and SSR/hydration must be certified in a separate remediation before either baseline can be raised. H9 now fails only Table basic, Kanban and ColorPicker against unchanged historical ceilings; Table's former TableCore comparator is functionally incompatible. IA-02/IA-03 remain closed. Strict ATTW and global coverage remain classified debts, not passes. No release or publication was performed.

## 2. Starting checkpoint

Branch `v2`, HEAD `eed79bab3de40fde1e9c0b95e1681c3e4f562bf2` (`docs(n2): close final independent audit P1 remediation`). The sole pre-existing untracked file is `projects/ui-core/tree-table/public_api 2.ts`, SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`; it was not edited or staged.

## 3. Scope

Release-engineering harnesses, a package-consumer Sass fixture, deterministic bundle baselines, focused harness tests and this report only. No product component, public entrypoint, package export, dependency, threshold or runtime contract changed.

## 4. IA-02 reproduction

The previous unused probes could print `0 B` after a TypeScript loader erased an unused import, without proving that its export existed. Four probes also named component symbols on the root FESM even though the root exports the provider, not those components. An empty output was therefore insufficient evidence of tree shaking.

## 5. Root-unused harness root cause

Of 36 pre-existing root-unused harnesses: 31 were **FALSE-POSITIVE CAPABLE** through TypeScript loading and missing pre-shake/negative controls; four were **BROKEN** by wrong root-symbol imports (A1, icons, C6 Tree and C7 VirtualList); one H9 probe used a real JavaScript import but was still **FALSE-POSITIVE CAPABLE** because it lacked package-input and invalid-export controls. None satisfied the complete A–E proof on its own. The inventory now contains 37 harnesses including REL-01.

## 6. Corrected resolution model

`scripts/lib/rel-01-package-bundle-evidence.mjs` validates the published export map and `.mjs` target in `dist/neural-ui/core`, checks the package's JavaScript side-effect-free metadata, uses the JavaScript loader and an empty tsconfig alias map, and inspects metafile inputs **before** final tree shaking. Absolute FESM resolution applies `sideEffects: false` only after verifying the package metadata: direct esbuild plugin resolution would otherwise bypass `package.json` discovery. Package and direct-FESM harnesses assert the compiled target and reject `projects/ui-core/**` leakage. Source-mode historical comparisons remain explicitly source-mode.

## 7. Invalid-export negative control

Each representative package proof first compiles a retained re-export of its named symbol, then requires a deliberately missing symbol to fail with `No matching export`. A nonexistent package subpath also fails. The check cannot accept `0 B` from an import erased before resolution.

## 8. Used-import positive control

The same actual package symbol is re-exported and must produce nonzero output with compiled-package metafile inputs. Focused harness tests: **5/5 PASS**, covering valid secondary exports, invalid symbols/subpaths and source-leak rejection.

## 9. Corrected root-unused results

All six measured consumers have final **0 B raw** unused output, actual package inputs and a rejected invalid export:

| Consumer | Used raw bytes | Unused raw bytes |
| --- | ---: | ---: |
| Root provider | 793 | 0 |
| Tag (small primitive) | 12,812 | 0 |
| Table | 192,870 | 0 |
| TreeTable | 124,813 | 0 |
| Tree | 62,514 | 0 |
| VirtualList | 10,658 | 0 |

The Table and TreeTable *used* figures here are nonsplitting proof bundles, not their initial-page bundle sizes; optional chunks are still measured separately by their own gates.

## 10. Harnesses audited

All 36 existing root-unused bundle scripts (A/B/C, forms, overlays, selectors/navigation, Table, TreeTable, Tree and VirtualList) were wired to the shared export proof. Package consumers additionally assert package-only metafiles; direct FESM consumers assert their compiled targets. The new gate inventories all 37 current scripts and fails if one omits the proof. JavaScript syntax checks pass for all 39 modified/new `.mjs` files. Representative A1/B2/C3/C6/C7, final Table/TreeTable, forms and overlays run successfully; H9's distinct size-policy failure is recorded in §15.

## 11. IA-03 reproduction

The historical C6 Tree baseline mixed compiled Tree FESM with workspace-source DragDrop through inherited tsconfig paths: approximately **53,135 raw / 11,352 gzip / 10,026 Brotli**. It was not a package-only measurement.

## 12. Workspace alias leakage

The corrected C6 and package consumers set `tsconfigRaw` without workspace aliases and assert zero `projects/ui-core/**` metafile inputs. The Tree proof now contains compiled `neural-ui-core-tree.mjs` and `neural-ui-core-drag-drop.mjs`, not workspace DragDrop source.

## 13. Package-only methodology

All final package measurements resolve the built export map, require their target FESM among metafile inputs and reject source leakage. The six-consumer REL-01 gate passes; C6, C7, Table and TreeTable gates pass after rebuilding. `scripts/audit-n2-rel-01-package-bundle.mjs` can regenerate its deterministic baseline with `--update`; normal invocation compares it.

## 14. Corrected Tree baseline

Official package-only C6 basic: **62,514 raw / 12,199 gzip / 10,726 Brotli**. Rich: **62,540 / 12,209 / 10,733**. Root-unused: **0 B raw**. These are evidence-method changes, not an attempted runtime size recovery.

## 15. Other corrected baselines

Only affected K/REL measurement artifacts were regenerated: Table final basic **174,266 raw / 34,620 gzip / 25,546 Brotli** (versus prior 174,362 / 34,516 / 25,552); TreeTable final basic **112,510 raw / 22,494 gzip / 19,039 Brotli** (gzip +11 B; raw/Brotli unchanged); and the new six-consumer REL-01 baseline. Table's private CSV/JSON/XLSX chunks remain 382/469/1,430 B gzip; both final root-unused gates remain 0 B raw. The historical H9 policy was **not** silently rebased: its PR profile still fails four old consumer budgets—Button 21,946/3,763 raw/gzip, Table basic 192,862/38,991, Kanban 46,636/8,446 and ColorPicker basic 63,004/12,683. Those budgets were frozen before later certified component replacements. Their failure is a policy-baseline decision, not evidence of a new REL-01 runtime change; approval of a new policy reference is required.

### H9 design-review resolution: required attribution before recalibration

The H9 policy records its historical provenance as the Neural UI 1.15.0 release candidate (`38b75030290b63041cc3a574066759b5bbb83dde`). Its failure ceilings derive from the recorded baseline by `baseline + max(256 B, ceil(2.5%))` for raw and `baseline + max(128 B, ceil(5%))` for gzip/Brotli. The following are **four failing scenarios**, each with three independently gated metrics. “Current” is the corrected package-only measurement; deltas are against the historical baseline, not a REL-01 product change.

| H9 scenario | Metric | Historical baseline | Historical failure ceiling | Current package-only | Delta | Delta % |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| button | raw | 18,064 | 18,516 | 21,946 | +3,882 | +21.49% |
| button | gzip | 3,148 | 3,306 | 3,763 | +615 | +19.54% |
| button | Brotli | 2,672 | 2,806 | 3,223 | +551 | +20.62% |
| table-basic | raw | 30,198 | 30,953 | 192,862 | +162,664 | +538.66% |
| table-basic | gzip | 4,084 | 4,289 | 38,991 | +34,907 | +854.73% |
| table-basic | Brotli | 3,446 | 3,619 | 28,785 | +25,339 | +735.32% |
| kanban | raw | 43,578 | 44,668 | 46,636 | +3,058 | +7.02% |
| kanban | gzip | 7,879 | 8,273 | 8,446 | +567 | +7.20% |
| kanban | Brotli | 6,860 | 7,203 | 7,390 | +530 | +7.73% |
| color-picker-basic | raw | 55,431 | 56,817 | 63,004 | +7,573 | +13.66% |
| color-picker-basic | gzip | 11,375 | 11,944 | 12,683 | +1,308 | +11.50% |
| color-picker-basic | Brotli | 10,007 | 10,508 | 11,045 | +1,038 | +10.37% |

To test the resolution's prerequisite, the **same current built package** was measured with the pre-REL H9 esbuild options and the corrected REL-01 options, keeping imports, package export resolver, minification, externals and compression identical. Results (raw/gzip/Brotli): button **21,946/3,763/3,223** with either method; kanban **46,636/8,446/7,390** with either; color-picker-basic **63,004/12,683/11,045** with either; table-basic **192,940/39,001/28,780** pre-REL versus **192,862/38,991/28,785** corrected. The H9 harness diff adds package metafile validation, an unused-export control and disabled workspace aliases; it does not account for the historical-to-current size gaps. The corrected metafiles contain package inputs and no `projects/ui-core/**` runtime source for all four scenarios. Runtime product files and the published dependency graph were not changed in REL-01, but the historical-to-current increase **cannot be attributed exclusively to the harness correction**. In particular, the pre-REL H9 method on today's package would fail the same four scenarios. Consequently, the authorization's §4 STOP condition applies: **no H9 numbers, headroom ratios or policy were changed**, no new baseline was certified, and post-recalibration gates were not invoked. A separate decision must define how to compare a 1.15.0 historical product baseline with the certified Neural 2 package; this evidence does not establish a new product regression.

## 16. Tree-shaking isolation

Metafile assertions verify Tag retains no Table/Tree/TreeTable, Table retains no Tree/TreeTable, Tree retains no Table/TreeTable, and VirtualList retains no Table/Tree/TreeTable. Size alone is not used as isolation proof.

## 17. Runtime modifications

**Zero.** No component source, shared runtime primitive, public API or package export was changed. The Angular consumer fixture alone gained `@use '@neural-ui/core/styles' as *;` to exercise the published Sass subpath.

## 18. ATTW strict current diagnostics

Strict ATTW, without ignores, exits 1 on **101 entrypoints** with exactly **97 `CJSResolvesToESM`** Node16-CJS cells and **four `NoResolution`** cells for `./styles` (`node10`, `node16-cjs`, `node16-esm`, `bundler`). No third diagnostic category is present. The package audit's existing two ignores were not expanded.

## 19. CJS classification

The package declares `type: module` and exports ESM FESMs; there is no CommonJS target. A Node CJS `require()` is deliberately unsupported. Adding a CJS build solely for ATTW would change the supported target and was not done. Angular 22 ESM consumption and SSR imports pass.

## 20. Styles subpath classification

`./styles` intentionally maps `sass`, `style` and `default` to the shipped `styles.scss`; it is a Sass asset, not JavaScript or a TypeScript declaration. The tarball contains it and `styles/index.scss`; direct publint passes. The real Angular consumer now compiles `@use '@neural-ui/core/styles' as *;` from the tarball. ATTW's JS/types resolution cells therefore do not establish a break in the supported Sass consumer path. No export-map change or fictitious declaration was made.

## 21. ATTW final status

**ATTW STRICT — KNOWN UNSUPPORTED-CONDITION DEBT**, not PASS. The supported ESM/Angular and Sass paths pass, while the unsupported CJS path and Sass-as-JS/types interpretation remain red. `audit:package` passes using its pre-existing `cjs-resolves-to-esm` and `no-resolution` ignores; strict ATTW continues to fail visibly.

## 22. Publint

Direct publint: **PASS** (`All good!`). This does not override strict ATTW's red status.

## 23. Angular tarball consumer

Angular **22.1.6** clean consumer installed an actual `npm pack` tarball, built with the Sass subpath, and passed representative SSR/import/schematic checks. No source alias, workspace link or symlink was used. The packed projection contains **431 files**, including `styles.scss` and `LICENSE`. An initial offline install lacked cached Angular schematics; a normal registry-backed retry passed without `--force` or `--legacy-peer-deps`.

## 24. SSR imports

All **97** public entrypoint import and SSR import smokes pass. The tarball consumer also passed its TreeTable, icons, overlays and forms SSR checks.

## 25. Contracts

Public contract audit: **PASS** (97 entrypoints, 813 exported declarations, 1,462 bindings). No public surface or generated contract snapshot was changed.

## 26. Full suite

Explicit `--coverage=false`: **188/188 files, 2,514/2,514 tests PASS**. A first invocation unintentionally inherited coverage from the Vitest configuration; all tests passed but that process exited red on the known 95.01% global threshold. It was rerun with the verified Angular CLI `--coverage=false` option. Thresholds and coverage configuration were not changed; the accidental coverage run is not claimed as PASS.

## 27. Build/package

`npm run build` production package build **PASS**. Package verification **PASS** (431 packed files), package audit **PASS** under its existing documented ignores, contract/import/SSR checks **PASS**. A first context-sandbox wrapper attempt timed out; the normal build was rerun successfully and its final package verified. Direct `npm pack --dry-run --json` also confirms Sass and license assets.

## 28. IA-02 final state

**IA-02 CLOSED.** The erased-import path is removed, real target and pre-shake package inputs are mandatory, the used control is nonzero, and invalid exports fail. Six representative consumers and the corrected root-unused gates pass.

## 29. IA-03 final state

**IA-03 CLOSED.** Tree is package-only, has no workspace DragDrop source in its metafile, and records a corrected reproducible baseline. Similar vulnerable package consumers now reject aliases/source leakage.

## 30. Remaining release debts

Strict ATTW is classified but red. Global coverage remains below its existing threshold and IA-04 documentation debt remains out of scope. H9's four pre-replacement size budgets need an explicit policy rebaseline decision; neither an architectural product regression nor a new release baseline was invented to turn them green. Showcase 2 was not started.

## 31. Git diff/status

Changes are limited to release/bundle audit scripts, shared proof helper and tests, package-consumer Sass fixture, affected deterministic baselines, root `package.json` script aliases and this report. No product runtime, published package metadata/export, threshold, ATTW configuration or historic certification report changed. `git diff --check` and new-file whitespace checks **PASS**; tracked and new untracked Git-mode symlinks are **zero**. The TreeTable harness's abandoned temporary directory and REL-01 npm caches/fixtures were removed. Everything remains **unstaged and uncommitted**; the unrelated TreeTable file remains untracked and byte-identical at the starting SHA-256.

## 32. Recommendation

The earlier **NEEDS DESIGN REVIEW** stop remains the correct historical response to a methodology-only explanation. The subsequent attribution audit in §33 found a material H9 Table scenario defect and a bounded internal-retention candidate. Its superseding recommendation is **REL-01 PACKAGE REMEDIATION REQUIRED** before any four-scenario N2 rebaseline. No H9 budget or product runtime was changed; coverage assurance and release action remain unauthorized.

## 33. BUNDLE ATTRIBUTION DESIGN REVIEW

1. **Audit status.** **REL-01 PACKAGE REMEDIATION REQUIRED (Case A).** The four historical failures are reproducible, but `table-basic` is not measuring an initial basic closure. Correct that measurement before considering an N2 H9 baseline. No product runtime was edited or optimized in this audit.

2. **Four scenarios.** The two `--profile=pr` H9 runs both measured, in raw/gzip/Brotli bytes: Button `21,946/3,763/3,223`; Table basic `192,862/38,991/28,785`; Kanban `46,636/8,446/7,390`; ColorPicker basic `63,004/12,683/11,045`. Each remains `FAIL` against its original H9 ceiling. The historical baselines, ceilings and exact cross-major deltas are in §15; none was changed.

3. **Measurement definitions.** H9's consumer is a named export re-exported from the built `@neural-ui/core/<entrypoint>`, minified by esbuild 0.27.3 with Angular/CDK/RxJS external, `bundle:true`, `write:false`, gzip level 9 and Brotli quality 11. Package resolution, nonzero used output and metafile inputs are verified. H9 sets **no `splitting:true`**. Its historical script additionally externalized `@ng-icons/*`, whereas the current script does not externalize `@neural-icons/*`. These are benchmark boundaries, not browser-performance claims.

4. **Table dual-scenario explanation.** H9 imports/re-exports `NeuTableComponent` from `@neural-ui/core/table` and emits one minified file: `192,862/38,991/28,785`. The certified K Table BASIC harness imports the same public component but uses ESM code splitting, counts the entry and its static shared chunk only, normalizes generated chunk names, and measures `174,266/34,620/25,546`. Neither source bootstraps Angular; both externalize Angular/CDK/RxJS and minify. H9's no-splitting mode folds dynamic imports into its single output, explaining most of the `+18,596 raw / +4,371 gzip / +3,239 Brotli` difference; the remainder includes chunk wrappers/name normalization and compression layout. An independent split probe, without the K harness's name normalization, measured a `174,447/34,764/25,658` static closure and emitted five separate lazy outputs. These two Table numbers must never be treated as like-for-like BASIC measurements.

5. **Table static closure.** The split probe's static output consists of a 72 B entry plus a 174,375 B shared chunk. The shared chunk's only productive package input is `neural-ui-core-table-neural-ui-core-table-*.mjs` (174,335 `bytesInOutput`); the public barrel contributes zero retained bytes. Its external imports are only `@angular/core` and `@angular/common`. This is a single-facade runtime whose query, renderer, selection and interaction branches are selected at runtime, not by the consumer's compile-time input values.

6. **Table module contribution.** The no-split H9 metafile attributes approximately 174,009 output bytes to the Table core FESM and, additionally, 7,500 advanced-filter-builder, 5,642 active-editor, 4,014 XLSX, 921 JSON and 618 CSV bytes; these are **one-file H9 contributions, not initial network chunks**. Source-map generated-code spans within the *unminified* 266,696 B Table core FESM provide a second, non-additive subsystem view: semantic renderer TS/HTML ~80,978/33,242 B; public facade TS/HTML ~44,177/2,251 B; selection ~12,390 B; client pipeline ~12,078 B; query UI ~7,716 B; remote coordinator ~6,324 B; layout ~5,018 B; grouping ~4,916 B; export projection ~4,284 B; virtual engine ~4,154 B; editing bridge ~2,533 B. Source-map spans are approximate compiled sizes, **not** minified retained-byte or gzip apportionments; do not sum them with `bytesInOutput`.

7. **Table lazy-boundary verification.** In the split metafile, advanced filter (7,494 B raw, 1,938 gzip), active Signal Forms editor (5,604/1,411), CSV (584/382), JSON (887/469) and XLSX (3,964/1,430) each have their own dynamic output. None of their implementation FESMs occurs in the entry/static-chunk input set. In contrast, H9 without splitting includes all five in `table-basic`; its `@angular/forms/signals` external edge comes from that folded editor, **not** from the actual initial closure. Thus the product's certified private boundaries survive; H9's current `table-basic` label is misleading.

8. **Table forbidden-retention scan.** Static split metafile: zero Tree, TreeTable, TableCore, old Table, Router, HttpClient, storage adapter, ApexCharts, PrimeNG, grid, unrelated facade or Angular Forms input. No workspace `projects/ui-core/**` runtime source leaks into the package-only graph. Angular core/common are external. Package declarations and K certification independently document the absence of legacy Table runtime.

9. **Table N1.15 versus N2.** Original H9 `table-basic` (script at `aa6d7d4`) imported **`NeuTableCoreComponent` from `table-core`**, not the old full Table facade. Its source explicitly owned no query, Forms, CDK, Router, selection, editing, export, persistence, URL-state or virtual-scroll behavior; it was a native semantic renderer with 16 applied inputs. That 30,198 B raw baseline is not functionally equivalent to N2's sole NeuTable facade. The old H9 `table-advanced-lazy` full-facade baseline was 954,019 B raw / 165,462 B gzip / 103,647 B Brotli; the current one-file full facade is much smaller, but this contextual comparison is not a substitute for an initial-closure budget. NeuTable 2 deliberately adds client query/filter/sort, selection, controlled layout, remote coordination, fixed-height virtual, grouping/expansion, focus/a11y and editing/export command bridges to its sole facade.

10. **Button attribution.** Current H9 minified output's top inputs are Button FESM **16,201 B** and published `@neural-icons/angular` **5,721 B** (`bytesInOutput`; ~24 B wrapper). The old H9 script externalized `@ng-icons/*`; its current successor is bundled instead. A diagnostic rerun with `@neural-icons/*` externalized gives `16,276/2,667/2,272`, below the historical `18,064/3,148/2,672`; this isolates a benchmark dependency-boundary difference, **not** a claim that consumers need not pay for icons. The published Angular renderer is needed by the single Button template even for text-only runtime configuration; selective icon definitions and the full catalog are absent. No ripple or unexpected facade dependency was found.

11. **Button historical comparison.** The N1.15 Button imported `NeuIconComponent` from the old Neural icon entrypoint; N2 imports `NeuralIcon` from the published package, uses the registered `NeuralIconName` contract and adds the native `type="button"` safe default. A1 measured that last change at only +41 raw/+19 gzip in a Button-plus-save consumer. A0.2 explicitly reports no like-for-like old-wrapper icon measurement, so the whole +615 gzip H9 trend cannot be allocated exactly among the old wrapper, new renderer and compiler output. It does **not** evidence full-catalog retention.

12. **Kanban attribution.** H9 output inputs: Kanban FESM **40,798 B**, shared internal FESM **5,497 B**, foundation **317 B** (~24 B wrapper). CDK DragDrop and Angular runtime remain external, so those libraries' runtime bytes are not counted. The C5 before/after same-harness measurement records `41,869/7,744/6,756` to `46,646/8,443/7,391`: +4,777 raw/+699 gzip for the controlled identity/proposal engine, disabled/keyboard/a11y paths and board diagnostics. The current H9 number differs by only source spelling/compression layout. No duplicate DnD facade, Table or TreeTable input appears.

13. **ColorPicker attribution.** H9 inputs: ColorPicker FESM **57,078 B**, shared internal FESM **5,513 B**, foundation **389 B** (~24 B wrapper). Angular core/common and CDK Overlay are external. The unchanged `color-utils.ts` maps to ~11,603 B of unminified ColorPicker FESM; the component maps to ~39,452 B. N2-024's same-feature before/after audit attributed +4,560 raw/+626 gzip to EyeDropper cancellation, focus/IDs and accessible overlay UI, with no new color library. N2-009 also replaced old runtime CVA imports with type-only Signal Forms integration. Current static metafile contains **no `@angular/forms` runtime input**; there is no full Forms package or third-party palette/parser. The residual historical delta cannot be assigned byte-perfectly without the old compiled artifact.

14. **Module contribution tables.** Values below are minified H9 `bytesInOutput`, except Table's split-core value where noted. Shared-input bytes belong to that one consumer output; they are not multiplied across Table subfeatures.

| Scenario | Retained module/input | Approx. raw B | Category / reason | Expected / clean candidate | Confidence |
| --- | --- | ---: | --- | --- | --- |
| Table H9 | Table core FESM | 174,009 | Facade + renderer + P1 query/selection/layout/remote/virtual/grouping; runtime-controlled template | Expected single-facade static; no simple multi-feature split | High |
| Table H9 | Advanced filter + active editor | 7,500 + 5,642 | Dynamic features folded by `splitting:false` | **Accidental H9 measurement retention**; use static-closure accounting | High |
| Table H9 | XLSX + JSON + CSV | 4,014 + 921 + 618 | Dynamic serializers folded by `splitting:false` | **Accidental H9 measurement retention**; use static-closure accounting | High |
| Button | Button FESM | 16,201 | Native control, template, metadata, states | Expected | High |
| Button | `neural-icons-angular.mjs` | 5,721 | Static icon renderer used by Button template | Expected product dependency; benchmark externalization decision | High |
| Kanban | Kanban FESM | 40,798 | Controlled DnD engine, renderer, focus/a11y | Expected P1 | High |
| Kanban | Internal + foundation | 5,497 + 317 | ID service/locale; internal FESM also retains unrelated services | **Optimization candidate**, needs separate packaging assessment | High for retention, medium for saving |
| ColorPicker | ColorPicker FESM | 57,078 | Color math, overlay renderer, EyeDropper/a11y | Expected P1 | High |
| ColorPicker | Internal + foundation | 5,513 + 389 | ID service/overlay guard; internal FESM also retains unrelated services | **Optimization candidate**, needs separate packaging assessment | High for retention, medium for saving |

15. **Dependency deltas.** Current metafiles contain only the package inputs just listed plus the external edges described above; all four have valid resolved symbols, nonzero output and zero workspace source leakage. The historical H9 policy preserves sizes/toolchain and the old script preserves entrypoint/externalization, but no N1.15 per-input metafiles are available for a byte-accurate old graph. Documented semantic deltas: TableCore→full Table; `@ng-icons/*` external→published neural-icons Angular bundled; Kanban controlled DnD engine; ColorPicker Forms/overlay/EyeDropper changes. No old graph is invented.

16. **Angular/toolchain effect.** H9 recorded Angular 21.2.17/CLI 21.2.16; N2 builds with Angular 22.1.6/CLI 22.1.8. Both H9 probes externalize Angular runtime, but generated component/template code remains inside each Neural FESM. Esbuild is 0.27.3 in both records and compression settings remain gzip 9/Brotli 11. An exact Angular compiler contribution cannot be separated without rebuilding the old source under a controlled dual-toolchain experiment; **none of the delta is assigned to Angular 22 by assumption**.

17. **Shared/minifier effects.** Table's 174,335 B retained core FESM becomes a 174,375 B shared split chunk plus a small entry. One-file H9 minification folds five dynamic modules and changes compression layout; therefore gzip differences cannot be added module by module. Kanban/ColorPicker share *source* infrastructure but their independent consumers each bundle their own internal FESM portion. Button's icon Angular renderer is a separate package input, not a duplicate Neural facade. No `tslib`-like helper or static shared chunk accounts for Table's cross-major +162,664 raw trend.

18. **Duplication scan.** Table's field resolution is shared by client/export projection; its exact-key identity helper is imported by selection/export; the metafile shows one core FESM, not a second engine. There are two small `sameFilter` comparators with different typed/generic purposes, not evidence of two filter pipelines. No duplicate serializer, DnD facade or equivalent full implementation was found in these closures. The internal hydration-service retention is unnecessary for Kanban/ColorPicker's ID-only usage, but is not a duplicate copy of those services within one output.

19. **Tree-shaking boundaries.** `input()=false` is runtime data: esbuild cannot erase Angular template and component methods on that basis. Table remote, virtualization, grouping, expansion, selection variants and layout interaction branches therefore remain in the one facade's static chunk. Button's optional icon display similarly retains the renderer class. Table's five certified private `import()` boundaries **do** split in a splitting build; H9's one-file build defeats this measurement distinction, not the package's lazy architecture.

20. **Two-run stability.** Two corrected package-only H9 PR-profile runs produced **identical bytes for all four scenarios** (triples in item 2), with root-unused 0 B raw both times. A separate split Table probe was also deterministic across two runs (output counts, inputs and bytes). No lower run was selected. The earlier same-package old-versus-REL option check remains in §15: three scenarios were byte-identical and Table differed by only 78 B raw, so the historical growth was not caused by REL-01's alias/metafile correction.

21. **Cross-major trend.** The scenario matrix is retained here even though Table's row is semantically non-equivalent:

| Scenario | N1.15 raw/gzip/Brotli | N2 H9 raw/gzip/Brotli | Delta raw/gzip/Brotli | Delta % raw/gzip/Brotli | Attribution / decision |
| --- | --- | --- | --- | --- | --- |
| Button | 18,064/3,148/2,672 | 21,946/3,763/3,223 | +3,882/+615/+551 | +21.49/+19.54/+20.62% | New icon renderer bundled where old icon peer was external; no baseline yet |
| Table basic | 30,198/4,084/3,446 | 192,862/38,991/28,785 | +162,664/+34,907/+25,339 | +538.66/+854.73/+735.32% | Old TableCore vs N2 full facade **and** H9 lazy-folding; repair H9 BASIC measurement |
| Kanban | 43,578/7,879/6,860 | 46,636/8,446/7,390 | +3,058/+567/+530 | +7.02/+7.20/+7.73% | Controlled DnD P1 plus internal ID closure; assess internal separation |
| ColorPicker basic | 55,431/11,375/10,007 | 63,004/12,683/11,045 | +7,573/+1,308/+1,038 | +13.66/+11.50/+10.37% | EyeDropper/a11y/Forms evolution plus shared internal closure; assess internal separation |

22. **Material optimization candidates.** (a) **H9 evidence fix, highest priority:** measure Table's static initial closure with code splitting and preserve separate private lazy outputs. The avoidable *misattribution* is about 18.6 KB raw / 4.4 KB gzip in H9 BASIC; product saving is **zero** because those chunks are already lazy. Boundary: H9 consumer harness only; SSR/API impact none; tests: two-run stability, existing export controls, static/dynamic metafile assertions and H9 gate. (b) **Internal packaging candidate:** Kanban and ColorPicker import `NeuIdGenerator`, but their built outputs also contain `NeuInitialTemporalState`, `NeuResponsiveState`, `neu-temporal-state` and `matchMedia`. The internal FESM contributes ~5.5 KB raw to each H9 output; this is an **upper bound**, not a proven removable amount. Even `ngDevMode=false` retains ~5.3 KB of that input. A narrower private ID boundary could save part of it, but would affect ng-packagr entrypoint topology and SSR/hydration DI; require separate design, directed package/build/browser tests and no new consumer-facing API. No extraction is authorized here. Table's ~4.3 KB unminified export projection and individual remote/virtual/grouping engines are not clean material split wins relative to the template/one-facade coupling; do not refactor them merely to chase bytes.

23. **Rebaseline decision.** **Case A, no rebaseline.** A `table-basic` policy that includes advanced filter, editor and serializers does not protect BASIC initial download. Resetting its 30 KB historical number to 192,862 B would freeze a misleading quantity; the same defect also makes the present `table-advanced-lazy` and `table-basic` consumers indistinguishable. The other three are attributable enough to investigate, but the four-scenario conditional approval is not met as a group. Repair the Table measurement and explicitly decide icon externalization/internal-ID accounting before certifying N2 H9 baselines. This is not evidence that NeuTable's certified runtime regressed.

24. **New H9 baselines/ceilings.** **None.** The historical baseline and raw/gzip/Brotli warning/failure formula remain unchanged in `scripts/h9-b4-bundle-policy.json`; no current value was copied into it.

25. **H9 policy.** **Unchanged.** Its historical TableCore description in `docs/H9_B4_BUNDLE_POLICY.md` is evidence of the old meaning, not an active N2 acceptance claim. The exact N2 BASIC measurement semantics and icon dependency boundary require a follow-up policy decision before an edit; no historical report was rewritten.

26. **Final gates.** H9 PR-profile twice: deterministic **FAIL** on exactly Button, Table basic, Kanban and ColorPicker basic under old ceilings. REL-01 package-only gate: **PASS**, six consumers, 37 root-unused harnesses, Tree `62,514/12,199` raw/gzip. Helper self-tests **5/5 PASS**, including invalid symbol/subpath rejection, used/unused package controls and source-leakage rejection. Table split metafile independently shows five lazy outputs and no optional implementation in static inputs. The earlier REL-01 build/package/contracts/full-suite 2,514/2,514 evidence remains recorded above; those broad gates were not rerun because this is Case A with no runtime or policy change. No global coverage run.

27. **Runtime changes.** **Zero.** This review only appends evidence to the REL-01 report. H9 budgets, package exports, component code, lazy boundaries, dependencies and thresholds remain untouched. No automatic commit, push, tag, release or npm publication.

28. **Remaining debts.** Strict ATTW remains **FAIL**, classified as CJS→ESM and Sass styles unsupported-condition diagnostics; no ignore was added. Global coverage threshold remains failing; it is not claimed PASS. IA-02 and IA-03 remain CLOSED. The foreign untracked TreeTable file remains outside the work and must remain byte-identical. Showcase 2 and REL-02 were not started.

29. **Final recommendation.** **REL-01 PACKAGE REMEDIATION REQUIRED.** First repair the H9 Table basic *measurement* so its gate excludes already-lazy chunks; then review the bounded internal-ID retention and icon benchmark boundary without changing certified runtime during this audit. Only a subsequent, verified four-scenario package audit can authorize N2 H9 baselines and move REL-01 to coverage assurance.

## 34. REL-01A — static closure and dependency-boundary remediation

1. **Decision.** **REL-01 PACKAGE REMEDIATION REQUIRED (Case A).** Table/ Button measurement defects are corrected. Kanban and ColorPicker have a material, reproducible *synthetic* internal-boundary saving candidate; no product change or rebaseline was authorized in this task. The earlier §33 measurements and recommendation remain historical evidence, superseded here.
2. **Table BASIC meaning.** `table-basic` now imports the final public `@neural-ui/core/table` facade in a split ESM consumer. It counts the entry output and recursively static-imported outputs only. Applied `input()=false` cannot remove runtime-controlled template branches. The original N1.15 `30,198/4,084/3,446` baseline was the removed TableCore renderer, not a comparable final-table basic consumer.
3. **Static algorithm.** `scripts/lib/h9-static-closure.mjs` starts at the sole `<stdin>` output in esbuild's metafile, follows local non-dynamic import edges, rejects missing edges/bytes and sums raw/gzip-9/Brotli-11 **per retained output**. It verifies the compiled Table core FESM is present and rejects optional implementation FESMs from that set. No workspace source is permitted by the existing package-input assertion.
4. **Lazy algorithm.** A second traversal includes dynamic edges. Five reached outputs must contain the advanced-filter builder, active editor, CSV, JSON and XLSX implementations. The full graph is diagnostic, not a substitute for initial download. The `table-advanced-lazy` scenario now measures static **plus** all reached dynamic outputs rather than duplicating BASIC.
5. **Table before/after.** Pre-fix nonsplitting H9 `table-basic` was `192,862/38,991/28,785` raw/gzip/Brotli. Corrected static closure is `174,439/34,801/25,692` across two outputs, a measurement-only reduction of `18,423/4,190/3,093`. The K certified BASIC harness (`174,266/34,620/25,546`) uses its own chunk-name normalization; these two valid harnesses are not byte-identical. No Table runtime byte was removed.
6. **Table lazy proof.** Five dynamically reached outputs, all absent from static inputs: advanced filter `7,494/1,938/1,665`; editor `5,604/1,411/1,215`; CSV `584/382/338`; JSON `887/469/410`; XLSX `3,964/1,430/1,278`. Values are raw/gzip/Brotli. The corrected `table-advanced-lazy` total is `192,972/40,431/30,598` with per-output compression; its old N1.15 full-facade baseline is `954,019/165,462/103,647`, historical context only.
7. **Table profile distinction.** BASIC counts two static outputs and excludes all five lazy implementations. Advanced-lazy counts seven outputs. A focused test makes missing core, missing lazy implementation or accidental static lazy retention fail closed.
8. **Button historical boundary.** The original H9 externalized `@ng-icons/*`. Its N2 component-only successor now externalizes `@neural-icons/*` **only for Button**; a metafile assertion requires an external icon edge and forbids a bundled icon-package input. Angular/CDK/RxJS remain the common externals. No icon source, package export or product dependency changed.
9. **Button component-only.** `16,276/2,667/2,272`, below the unchanged historical `18,064/3,148/2,672` baseline by `1,788/481/400`; PASS with old headroom. This is a comparable benchmark boundary, not a claim that icons are free to an application.
10. **Button end-user closure.** With the published renderer bundled, the informational consumer is `21,946/3,763/3,223`. The `5,670/1,096/951` gap over component-only includes the Angular icon renderer and compression effects. It is recorded, not made a second blocking Button budget.
11. **Kanban retention.** The real H9 output is `46,636/8,446/7,390`; esbuild attributes `5,497` minified raw bytes to `neural-ui-core-internal.mjs`, although Kanban imports only `NeuIdGenerator`. The output contains `NeuInitialTemporalState`, `NeuResponsiveState`, `neu-temporal-state` and `matchMedia`; CDK DragDrop is external. The real output still exceeds historical failure ceilings.
12. **ColorPicker retention.** The real output is `63,004/12,683/11,045`, with `5,513` raw bytes from the same internal FESM despite its ID-only import. The same unrelated temporal/responsive code is present; CDK Overlay is external. It also exceeds historical failure ceilings.
13. **Material-saving assessment.** `scripts/audit-n2-rel-01a-internal-retention.mjs` performs in-memory, evidence-only bundles using the *compiled* `NeuIdGenerator` class verbatim. A narrow virtual ID module yields Kanban `41,747/7,191/6,242` and ColorPicker `58,084/11,438/9,947`. A virtual relocation to the **existing** foundation entrypoint (no new entrypoint) yields Kanban `41,747/7,189/6,246` and ColorPicker `58,084/11,440/9,953`: potential savings of `4,889/1,257/1,144` and `4,920/1,243/1,092` respectively versus real outputs. Both experiments eliminate temporal/responsive symbols; repeated runs are identical. Classification: **PROVEN MATERIAL SAVING in a synthetic boundary**, not a certified production saving. The potential is large enough to explain all of Kanban's old-budget failure; ColorPicker would still be `2,653` raw and `65` gzip above its historical baseline after that hypothetical split.
14. **Clean-boundary qualification.** The foundation probe demonstrates a plausible topology without a new package entrypoint: one canonical application-scoped ID service, existing foundation import, internal re-export for existing users. It does **not** prove ng-packagr output, 42 existing source references, public-symbol governance, singleton DI across entrypoints or SSR/hydration behavior. Those are explicit requirements of a separate package-remediation phase. No experimental bundle is treated as a release artifact or as an excuse to increase H9 budgets now.
15. **Comparability matrix.** Button historical component-only ↔ corrected N2 component-only: comparable dependency boundary, old baseline retained. TableCore historical BASIC ↔ sole N2 Table static BASIC: **not functionally comparable**; N2 static baseline eligible only after package remediation. Full Table historical advanced ↔ N2 split all-output: contextual, different chunk/compression model. Kanban and ColorPicker historical ↔ current: product-feature and internal-packaging deltas remain mixed; material shared-ID saving candidate prevents rebasing either now.
16. **Baseline/policy changes.** `scripts/h9-b4-bundle-policy.json`: **none**; no warning/failure formula or threshold changed. The active H9 script now measures split Table closure and normalizes Button's icon boundary, while `docs/H9_B4_BUNDLE_POLICY.md` explains these semantics and marks the old TableCore baseline as historical. The two red N2 component baselines are deliberately not copied into policy.
17. **H9 final result.** Two identical PR-profile runs: root-unused `0 B raw` PASS; Button PASS; Table BASIC FAIL solely against the incompatible TableCore baseline; Table advanced-lazy PASS against contextual old full-Table ceiling; Kanban FAIL; ColorPicker FAIL. Architecture checks PASS. The REL-01 package gate PASS (six consumers, 37 root-unused harnesses); invalid-export, used-import, source-leakage and new closure/boundary self-tests **10/10 PASS**. No full suite or global coverage was rerun because Case B's policy-rebaseline precondition was not met.
18. **Runtime changes.** **Zero.** This REL-01A delta consists of H9 measurement code, pure evidence tooling/tests, this active-policy clarification and this report. No Table/Button/Kanban/ColorPicker/internal runtime, public API, package exports, lazy product boundaries, dependencies, generated dist or thresholds changed. No commit, push, tag, release or npm publication.
19. **Remaining remediation candidate.** In a separate authorized phase, isolate `NeuIdGenerator` behind a lean canonical package boundary (assess the existing foundation entrypoint first), preserve one DI token/class across all 42 current references, and validate ng-packagr topology, full package consumer, bundle, SSR/hydration and API governance. Then reassess Kanban/ColorPicker individually; only after this can an N2 Table static baseline and any residual ColorPicker P1 baseline be decided without hiding savings. Strict ATTW and global coverage remain independent, classified debts, not PASS.
20. **Final recommendation.** **REL-01 PACKAGE REMEDIATION REQUIRED.** Measurement is now trustworthy, but the material internal-retention candidate blocks conditional H9 rebasing and thus blocks coverage assurance/release progression. The foreign untracked TreeTable file remains outside scope and byte-identical; REL-02/Showcase were not started.
