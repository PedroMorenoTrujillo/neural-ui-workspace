# N2 — Final reccloseout #2

## 1. Final result

**N2 FINAL RECLOSEOUT #2 — CERTIFIED.** The Calendar ownership blocker remains fixed, NeuTree's P1 typeahead now has directed, instrumented and real-browser evidence, and no new P0/P1 technical blocker was found. This certifies the Neural UI 2 technical closeout, **not** public-release readiness. Failing historical threshold/tooling/release gates are recorded below as failures, not relabelled PASS.

## 2. Certified checkpoint

Branch `v2`; starting HEAD `296ccc7c5a90c46b818ad5e63af12e7b4e7da4a0`. The checked-in baseline before this audit had a clean tracked tree and empty staging area, with only the foreign untracked `projects/ui-core/tree-table/public_api 2.ts`.

## 3. Commit chronology

`83c9c8d18f7dec64d2d70c6cabb430c2c3ec407d` recorded the original closeout blocker; `2fd74c76d743b1f9b54b8798d10351bad84f809c` fixed Calendar; `eca47baf7751fb80df8fe5356f2eb0306776b042` recorded the NeuTree evidence blocker; `296ccc7c5a90c46b818ad5e63af12e7b4e7da4a0` added directed typeahead evidence. The preceding C7 base was `c464031b817b65955ee31541296215981f32e702`.

## 4. Original Calendar blocker

The first closeout correctly failed because Calendar displayed a proposed date before the parent accepted `selectedDateChange`.

## 5. REM-01 status

`selectedDate` is the only applied owner. The removed private optimistic selection mirror and synchronization effect have not returned. Gestures propose; rejected proposals do not alter visible selection or `aria-selected`; accepted parent writes apply without echo.

## 6. NeuTree evidence blocker

The first reccloseout correctly found implemented P1 visible-label typeahead without sufficient directed/browser coverage. It did not establish a runtime defect.

## 7. REM-02 status

NeuTree went from 36 to 46 directed tests (+10); REM-02 changed **zero runtime files**. The tests cover single/multi-character input, visible-node domain, collapsed descendants, no-match, focus-only behavior, no business outputs, and buffer/lifecycle handling.

## 8. Calendar final recheck

`npm test -- --no-coverage --include=calendar/neu-calendar.component.spec.ts`: exit **0**, **43/43**. Real Chromium `test:n2-final-rem-01-calendar-hydration`: exit **0**; DOM reuse, 0 NG050x, rejection/acceptance for pointer and keyboard, no initial proposal or echo. Clear/today/preset/mode cases remain in the directed suite. Calendar bundle audit compared current source with HEAD and found **0 B delta** in this reccloseout.

## 9. Tree typeahead final recheck

`npm run test:n2-c6`: exit **0**, **46/46**. Real Chromium `test:n2-c6-hydration`: exit **0**; first character after hydration focuses once, collapsed descendants are excluded, no unintended selection/expansion/child request, 0 NG050x, 100 create/destroy cycles. The additional tarball-installed Angular consumer run (§15) repeats this browser behavior through the public package.

## 10. Full suite

`npm test -- --no-coverage`: exit **0**, **187/187 files, 2500/2500 tests**. Both timing-sensitive benchmark specs excluded from coverage execution were included here and passed.

## 11. Build

`npm run build`: exit **0**, 96 secondary entrypoints built. Captured build output contained **zero build-warning lines**. An unregistered `trash` icon warning occurred only inside the isolated consumer fixture at runtime; it was not a build failure or a new package diagnostic. Historical Menu NG8102 and unrelated global debts were not altered.

## 12. Package verification

`verify:package`: exit **0**, 431 packed files. `audit:package`: exit **0** under its documented filtered ATTW policy. `test:imports`: exit **0**, 97 public imports. `test:ssr-smoke`: exit **0**, 97 public SSR imports. `audit:contracts`: exit **0**, 97 entrypoints / 813 declarations / 1462 bindings / 5179 classified symbols. `test:contracts`: exit **0**, 5 tests. `audit:entrypoints`: exit **1** solely for the 16 Showcase mappings in §28. None of these exits is conflated with strict ATTW.

## 13. Publint

Direct `publint dist/neural-ui/core`: exit **0**, “All good!”. No suppression was added.

## 14. ATTW

Direct strict `attw --pack dist/neural-ui/core --format ascii --summary --no-color`: exit **1**. `@neural-ui/core/styles` is a Sass-only export and has “Resolution failed” across node10/node16/bundler JavaScript/type conditions. The 97 JavaScript entrypoints report `cjs-resolves-to-esm` for Node16 CommonJS, while ESM Node16, Node10 and bundler resolution are green. The package is ESM-only; the supported Angular 22 ESM consumer installs, resolves, type-compiles, browser-builds, server-renders and hydrates (§15). Thus these exact strict-tool/package-format findings are **known non-blocking debt for the tested supported consumer**, not a claimed ATTW PASS; alternate CommonJS/Sass consumer expectations require separate public-release review.

## 15. Angular 22 consumer

`test:angular-22-consumer`: exit **0** using an actual packed tarball in an isolated Angular **22.1.6** consumer, public `@neural-ui/core/*` entrypoints only, no workspace link/source alias. Installation, package resolution, TypeScript/browser build, SSR render, imports and zoneless passed; private optional chunks remained separate. The additional `N2_C6_PACKAGED_HYDRATION=1 npm run test:n2-c6-hydration` ran real Chromium against a second tarball-installed consumer: exit **0**, SSR DOM reuse, 0 NG050x, first typed character exactly once, no duplicate initial output/request, and lifecycle/keyboard interactions passed. This mode is a fixture-only extension of the existing audit script, not product runtime.

## 16. Portfolio 94/94

The official portfolio generator: exit **0**; **94 public components, 94 COMPLETE, 0 PENDING/REMOVE, 0 remaining batches**. Directives/helpers were not counted as components.

## 17. Forms/CVA smoke

`audit:cva`: exit **0**; `LEGACY-CVA-YET-TO-MIGRATE: 0`, 24 Signal Forms controls including TreeSelect. Active source scan found no new `ControlValueAccessor` or `NG_VALUE_ACCESSOR`; no Calendar compatibility layer was introduced. This is a smoke, not a fresh forms macroaudit.

## 18. Signals/effects smoke

Calendar's applied selection remains computed from its input, without optimistic writable mirror or replacement sync effect. REM-02 only added tests, so NeuTree's product effect graph is unchanged. No global effects re-audit was performed.

## 19. SSR imports

All **97** public entrypoints passed the SSR import smoke. Importing the root without use retains **0 B raw** in the relevant bundle audits.

## 20. SSR/hydration matrix

Real Chromium fixtures passed for Calendar, NeuTree, NeuTable, NeuTreeTable, NeuVirtualList, TreeSelect, ColorPicker/overlay, and menus. They checked representative DOM reuse, 0 NG050x, no duplicate initial state/request outputs, and exactly-once first interactions. Table/TreeTable optional chunks stayed lazy; Table remote/hydration and TreeTable edit/JSON export paths passed. The packed NeuTree consumer additionally passed §15. Firefox and WebKit were not claimed.

## 21. A11y/keyboard

Calendar `aria-selected` follows accepted applied state. NeuTree typeahead changes focus only—not selection, expansion or business events—and ignores collapsed descendants. Existing representative menu/treegrid/form keyboard fixtures remain green; no new accessibility macroaudit was attempted.

## 22. Lifecycle/resources

NeuTree's buffer cleanup and 100 browser create/destroy cycles passed without late business outputs. Calendar added no resource owner. VirtualList's 100 lifecycles, 100 resize and 1000 scroll operations, plus overlay/menu lifecycle fixtures, passed their directed smoke.

## 23. Root-unused/tree-shaking

Calendar audit: exit **0**, 60,591 B raw / 8,490 B gzip / 7,248 B Brotli and **0 B root-unused**. Tree audit: exit **0**, 53,135 / 11,352 / 10,026 B, root-unused 0. VirtualList audit: exit **0**, 10,658 / 3,011 / 2,689 B, root-unused 0. Table and TreeTable auditors each measured **0 B root-unused** and <5% basic-size drift, but their strict stored-artifact comparisons exit **1** (Table current 174,266 raw / 34,620 gzip vs stored 174,362 / 34,516; TreeTable current 112,510 / 22,494 vs stored 112,510 / 22,483). The H9-B4 `audit:bundle` also exits **1** for 12 obsolete consumer budgets despite 0 B root-unused and aggregate size below its 1.15.0 baseline; its Table baseline is Table 1-era. These are not represented as green commands. No source/retention regression from REM-01/02 was evidenced; budget/snapshot recalibration belongs to a separately authorized release-performance review.

## 24. Coverage methodology

The single final global run used `npm run test:coverage -- --exclude='**/*.stress.spec.ts' --exclude='**/neu-table.export-performance.spec.ts' --exclude='**/neu-tree-table.query-performance.spec.ts'`. The stress exclusion was already frozen; the two named performance *test* files are excluded because instrumentation invalidates timing. They passed in the normal full suite. No production source was excluded, no timeout/threshold changed, and no retry was made.

## 25. Coverage final result

Exit **1** from unchanged **95.01%** thresholds, despite **185/185 files, 2498/2498 tests PASS**: statements **91.61%** (22,493/24,551), branches **86.92%** (12,766/14,687), functions **91.00%** (4,271/4,693), lines **94.18%** (17,944/19,052). Previous valid reccloseout: 91.45 / 86.72 / 90.83 / 94.02 respectively; 185 files / 2488 tests. This is exactly one final global coverage execution.

## 26. NeuTree typeahead coverage mapping

The instrumented NeuTree character branch at component line 316 has **117** hits; dispatch lines 317–319 have **114/114/3**; `handleTypeahead` lines 400–404 have **114** each; scan lines 405–406 have **167**; match/focus lines 407–408 have **112**. The timeout path at line 401 has **2** hits and both outcomes at line 406 have **112/55**. This is source-branch execution, not a test-name inference. Chromium separately proves the first hydrated character and visible/collapsed behavior. NeuTree component coverage rose from 71.24% to **83.69% lines** and 50.23% to **62.79% branches**. Some arrow-key paths absent from V8 unit coverage are exercised by the browser fixture; browser evidence was not merged into the V8 percentage.

## 27. Coverage interpretation

The threshold failure remains real. Largest remaining uncovered-line clusters include ColorPicker (85), Table renderer (84), Select (79), DateInput (57), Uploader (53), TreeTable renderer (48) and NeuTree (38). These are historical branch/optional/browser-path debt, not a claim that every uncovered line is unreachable or harmless; targeted suites and representative Chromium gates provide P1 behavioral evidence. A directed review found **no remaining materially untested critical P1 path** analogous to typeahead. Optional/lazy code such as TreeTable JSON export has limited unit-line coverage but was invoked once in the browser fixture. No threshold was lowered and no REM-03 was initiated.

## 28. Showcase debt

`audit:entrypoints` exits **1** for 16 current missing entrypoint-to-demo mappings. The earlier ledger's 17 missing demos uses a different scope and is not silently counted as resolved. Core package imports pass; Showcase 2 remains a separate release-facing task.

## 29. Browser/a11y tooling debt

Chromium was installed and actually used. Firefox: **not installed/not run**. WebKit: **not installed/not run**. `axe-core`: **unavailable/not run**. No claim of those tools passing, and no installation was attempted.

## 30. Public API

Contract, imports and package gates found no unexplained public drift. REM-01 changed Calendar implementation ownership, not its public API; REM-02 is tests only. Table/TreeTable final facades and TreeSelect remained as certified.

## 31. Dependency graph

Active Core source smoke found no Table 1.x/TableCore/legacy TreeTable, PrimeNG/primeicons, ApexCharts/ng-apexcharts, HTTP ownership, browser storage ownership, or new Forms/CVA dependency. Existing RouterLink navigation and explicit URL adapter imports are intentional, not new hidden state owners. No test-only package leaked into the shipped runtime; private optional chunks remain lazy. Charts remain outside Core.

## 32. Performance smoke

Full normal suite included Table 10k and benchmark specs. Pure-engine probes passed: Tree wide-10k flatten p50 **0.477 ms** / p95 **0.945 ms**, normalization p50 **3.968** / p95 **5.088 ms**, deep-1k safe; VirtualList 10k window p50 **0.0018** / p95 **0.0073 ms**, key lookup p50 **0.304** / p95 **0.537 ms**; TreeTable 10k flatten p50 **7.152 ms**. These are reproducible local Node measurements, not browser/product-wide performance claims. REM-02 changed no runtime.

## 33. Robustness

Calendar rejected values are not displayed or fed back. NeuTree's typeahead uses the visible applied projection, excludes collapsed descendants and has no late output after destruction. Deep hierarchy (1001) and malformed/projection safety retain earlier directed certifications. No new mutable consumer `Date`, feedback loop, stale key/index or timer leak was found in this proportional smoke.

## 34. Migration readiness

Existing migration fixtures/contracts remain applicable; neither remediation changed migration-facing API. The packed Angular 22 consumer confirms public entrypoint resolution, but active documentation and a polished v2 migration guide remain release work.

## 35. Deferred P2/P3

The frozen Table/TreeTable/Tree and portfolio P2/P3 exclusions remain intentional. No deferred feature was reclassified as missing P1, implemented, or used to make this reccloseout pass.

## 36. Final debt ledger

| Debt / current evidence | Severity | N2 technical blocker | Public-release blocker | Future owner/phase |
| --- | --- | --- | --- | --- |
| Global 95.01% coverage thresholds: all four fail (§25); no material P1 gap found | Medium | No | Yes — explicit threshold disposition needed | Dedicated coverage policy/evidence review |
| Strict ATTW exits 1 for Sass-only styles and ESM-only CJS conditions (§14); supported Angular ESM consumer passes | Medium | No | Yes — package-format decision needed | Package-format/release review |
| Table/TreeTable exact bundle artifacts and obsolete H9-B4 budgets exit 1 (§23), root-unused 0 | Medium | No | Yes — baseline decision needed | Release performance baseline owner |
| Showcase: 16 current audit mappings; 17 historical demo debt | Medium | No | Yes for complete Showcase | Showcase 2 |
| Firefox, WebKit and axe unavailable; Chromium passes | Medium | No | Yes — matrix disposition needed | Cross-browser/a11y certification |
| Active docs and full migration guide not polished | Medium | No | Yes | Documentation/release phase |
| Build warnings: none captured; isolated fixture warns about unregistered `trash` icon; historical Menu NG8102/other component debts untouched | Low | No | No | Relevant fixture/component owners |
| Package/release metadata still 1.15.0; no release action | High | No | Yes | Independent release phase |
| Foreign TreeTable untracked file, SHA-256 in §39 | Low | No | Yes — clean release checkpoint needed | Its external owner |

## 37. N2 technical blockers

**None identified** under the authorized proportional recheck. Both prior blockers have concrete resolution/evidence; full suite, build, supported consumer, SSR/hydration, public API, root-unused and dependencies are sound. Failing historical percentage/tool/budget gates remain explicit debt, not hidden successes.

## 38. Public release blockers

Showcase 2, active v2 documentation/migration polish, strict ATTW/package-format decision, stale bundle budget/snapshot decision, expanded Firefox/WebKit/axe evidence, v2 package metadata and a clean immutable release checkpoint are separate from N2 technical certification. No public release is authorized by this report.

## 39. Filesystem hygiene

The foreign `projects/ui-core/tree-table/public_api 2.ts` was not read for editing, staged, renamed or removed; SHA-256 remains **`c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`**. `git diff --check` passes; zero tracked/new symlinks, zero remaining hydration temp directories, no tracked `dist`/tarballs/generated duplicate copies. Temporary tarball consumer and npm cache were removed. A Chromium audit rewrote the tracked timing baseline while running; its exact original bytes were restored, leaving no baseline diff.

## 40. Git status

Branch `v2`, HEAD unchanged at `296ccc7c5a90c46b818ad5e63af12e7b4e7da4a0`; staging empty. This reccloseout leaves only this report and a fixture-only packaged-hydration audit-script enhancement unstaged, plus the untouched foreign untracked TreeTable file. **Zero product-runtime files modified.** No commit, push, tag, release, npm publish, Showcase 2 or later roadmap work.

## 41. Final recommendation

**N2 FINAL RECLOSEOUT #2 — CERTIFIED.** Stop here. The next action, if authorized separately, is an independent final audit by a different auditor/model—not automatic Showcase, release or another remediation.
