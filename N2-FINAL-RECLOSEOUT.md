# N2 — Final reccloseout post-remediation

## 1. Result

**N2 FINAL RECLOSEOUT — NOT CERTIFIED.** Calendar's original blocker is resolved, but the one valid global coverage run exposed an untested P1 keyboard path in NeuTree: visible-label typeahead. The Tree contract freezes this behavior (`N2-C6-TREE.md`, final decision 19), yet the instrumented component path has zero executed lines and neither the C6 directed tests nor its Chromium fixture exercises character-key typeahead. This is a test-evidence blocker, **not evidence of a runtime defect**. Per the reccloseout rule for genuinely under-tested critical N2 runtime, no tests or runtime were added here to make the result pass.

## 2. Original closeout blocker

`N2-FINAL-CLOSEOUT.md` stopped because Calendar's local `_selectedDate` signal changed visible selection before the consumer accepted `selectedDateChange`. That prior result remains a historical **NOT CERTIFIED** record.

## 3. Calendar remediation checkpoint

`N2-FINAL-REM-01-CALENDAR-CONTROLLED-OWNERSHIP.md` records **CALENDAR REMEDIATION — CERTIFIED FOR N2 RECLOSEOUT**. There is no Calendar remediation commit: branch `v2`, HEAD `c464031b817b65955ee31541296215981f32e702`, parent `aa52f09d78341f375d5f4eccf52ebe58b1bc1122`; the Calendar change remains unstaged/uncommitted. This deviates from the expected clean starting checkpoint and must be resolved before an immutable sign-off. Toolchain: Node 24.15.0, Angular core 22.1.6, CLI/build 22.1.8, TypeScript 6.0.3, Vitest 4.1.4.

## 4. Calendar ownership recheck

Applied owner: public `selectedDate` input. Proposal: public `selectedDateChange` output. Agenda reveal/focus are presentation-only. Static scan: 0 `effect(`, 0 `signal(`, 0 `model(` and no `_selectedDate` mirror in Calendar; the input feeds `appliedDate` computed and all visible selected-date projections. There is no equivalent hidden writable owner.

## 5. Rejection behavior

Pointer and keyboard proposals leave the former applied day, agenda, selected class and `aria-pressed` unchanged when the parent does not write. The public Calendar has single-date mode only; clear, multiple and range are not part of its frozen API. Thus those mode-specific checks are not applicable. Day buttons correctly expose applied `aria-pressed`; `aria-selected` is not used on native buttons.

## 6. Acceptance behavior

Applying the proposed date updates the day, header and agenda. When the parent writes a *different* date, that applied date wins. Parent `Date` objects are not mutated.

## 7. Exactly-once

One gesture emits one proposal; rejection generates no second proposal; parent acceptance/write generates zero echo. Repeated independent gestures each emit once without optimistic accumulation.

## 8. Calendar SSR/hydration

`npm run test:n2-final-rem-01-calendar-hydration`: real Angular 22 Chromium **PASS**. SSR DOM reused, 0 NG050x, 0 initial proposals, first pointer/Enter/Space proposals exactly once, rejection stable and acceptance reflected only after parent write. Zoneless provider used.

## 9. Full suite

`npm test -- --no-coverage`: **187/187 files, 2490/2490 tests PASS**, exit 0. Both performance specs later excluded from *coverage execution* are included and passed here.

## 10. Build

`npm run build`: production Angular package **PASS**, 97 public entrypoints. No remediation-specific warning or build failure appeared.

## 11. Package

`verify:package` **PASS** (431 files); `audit:package` filtered project gate **PASS**; `test:imports` **PASS** (97); `audit:contracts` **PASS** (97 entrypoints, 813 declarations, 1462 bindings, 5179 symbols); direct publint **PASS**. The strict ATTW result is separately classified in §24. `audit:entrypoints` exits 1 only for missing Showcase demo mappings (§25); it is not a product import failure.

## 12. Angular 22 consumer

The tarball-installed, external Angular 22.1.6 consumer **PASS** after rerunning its npm installation with network access. Browser build, SSR fixtures (including Table/TreeTable/forms), zoneless setup and public SSR imports passed; private lazy editor/export/filter chunks remained separate. The first sandboxed npm-install attempt made no test assertion and was cancelled; its two exact temporary directories were removed. No source alias or symlink was used for the packaged library.

## 13. Portfolio 94/94

Official generator without `--write`: **94 public components = 94 COMPLETE + 0 PENDING + 0 REMOVE**, zero implementation batches. Calendar remains marked COMPLETE. This inventory label does not override the typeahead test-evidence blocker.

## 14. Forms/CVA smoke

`audit:cva` **PASS**: 24 Signal Forms controls and 0 legacy CVA yet to migrate. Calendar adds no CVA, `NG_VALUE_ACCESSOR` or forms adapter.

## 15. Signals/effects smoke

Calendar's removed input→writable effect was not replaced by a mirror. Its applied-date graph is input → computed → template; 0 Calendar product effects. The change does not add a domain effect or alter another component's certified owner.

## 16. SSR imports

`test:ssr-smoke` **PASS** across all 97 final public entrypoints. No browser API was evaluated by importing Calendar on the server.

## 17. Hydration representative matrix

Real Chromium/Angular 22 fixtures **PASS** for Calendar, Table, TreeTable, Tree, VirtualList, N2-022 overlay/ColorPicker and TreeSelect form control. Table and TreeTable report DOM reuse and 0 NG050x; C6 Tree and C7 VirtualList likewise report 0 NG050x. The first TreeTable attempt did not reach the browser because its fixture copied the foreign untracked `public_api 2.ts`; a minimal fixture-only filter now copies versioned TreeTable source, leaving the foreign file unchanged. The rerun passed. This harness change does not alter product runtime or package output.

## 18. Lifecycle/resources

Calendar adds 0 listener, timer, observer, subscription or effect for applied selection. Existing C6 Chromium fixture passed 100 create/destroy cycles and C7 passed 100 lifecycle cycles, 100 resizes and 1000 scrolls. No new late Calendar output or feedback loop was observed.

## 19. Calendar bundle

The current-vs-HEAD N2-022 audit **PASS**: Calendar before 60,256 B raw / 8,487 B gzip / 7,247 B Brotli; after 60,591 / 8,490 / 7,248 B. Delta +0.556% raw, +0.035% gzip, +0.014% Brotli; no new dependency or material bundle regression.

## 20. Root-unused

Calendar/N2-022, Table, TreeTable, Tree and VirtualList each measured **0 B raw root-unused**. Tree and VirtualList bundle audits pass. Table and TreeTable exact historical artifact comparisons exit 1 despite root-unused 0 and <5% basic-size drift: Table stored 174,362 B raw / 34,516 B gzip, current 174,266 / 34,620; TreeTable stored 112,510 / 22,483, current 112,510 / 22,494. Table source had a later certified token-normalization change; TreeTable's small gzip-only difference has no established source cause. No baseline was regenerated or claim of exact artifact PASS made.

## 21. Coverage methodology

The prior closeout run was invalid because two benchmark-only specs exceeded the 5-second test timeout under V8 instrumentation. Before this run, the CLI `--exclude` test-file behavior and both specs' timing/measurement purpose were inspected. Exact single command:

```sh
npm run test:coverage -- --exclude='**/*.stress.spec.ts' --exclude='**/neu-table.export-performance.spec.ts' --exclude='**/neu-tree-table.query-performance.spec.ts'
```

The preexisting stress-spec exclusion was preserved. Only those two performance *test files* were additionally excluded from execution under coverage; no production source was excluded, `coverage-exclude` was not used, and all 2490 tests—including both benchmarks—passed in the preceding normal suite. No timeout or 95.01% threshold was changed.

## 22. Valid global coverage result

**One run only**: 185/185 files and 2488/2488 tests PASS under V8 instrumentation; exit **1 solely from thresholds**. Statements **91.45%** (22,452/24,551), branches **86.72%** (12,738/14,687), functions **90.83%** (4,263/4,693), lines **94.02%** (17,914/19,052). Each is below the unchanged **95.01%** threshold. The report is valid; it is not called a PASS.

## 23. Coverage interpretation

Global threshold debt predates this reccloseout: N2-011J already failed branches/functions and N2-015I failed statements/functions/branches. Browser-only evidence also does not merge into the unit V8 report. Calendar itself measured 97.94% lines, 97.12% statements, 97.22% functions and 93.81% branches. Nevertheless the current report specifically exposes **category A** in NeuTree: `neu-tree.component.ts` has 71.24% lines / 50.23% branches, and its P1 visible-label typeahead (`onNodeKeydown` character branch and `handleTypeahead`) has zero executed lines. Source/test inspection found no character-key/typeahead test in the C6 directed specs or Chromium fixture. This is an actionable uncovered P1 interaction, so the historical/global debt classification cannot excuse it. Other low percentages alone are not claimed to prove defects.

## 24. ATTW

Strict `attw --pack dist/neural-ui/core` exits **1**, not PASS. Diagnostics are the preexisting `@neural-ui/core/styles` Sass export (not a JavaScript/types entrypoint) and CommonJS resolution of an ESM-only (`type: module`) package. The project audit with these rules filtered passes, direct publint passes, and the real ESM Angular consumer imports/builds/SSR-renders successfully. Classified **known non-blocking ATTW tool/package-format debt for this ESM Angular consumer**, but strict ATTW remains an explicit public-release review item; no diagnostic was hidden in the strict result.

## 25. Showcase debt

No Showcase page was implemented. Current `audit:entrypoints` exit 1 lists **16 missing entrypoint-demo mappings**; the first closeout carried **17 missing demos**. Different counting scopes are not treated as a silent resolution of one demo. This remains isolated Showcase/release debt, not a failed Core import.

## 26. Final debt ledger

| Debt | Current classification |
|---|---|
| Calendar optimistic ownership | Resolved and reverified; no longer a blocker |
| Critical NeuTree P1 typeahead test gap | **N2 technical certification blocker**; authorize targeted test evidence in a separate remediation |
| Global 95.01% coverage thresholds | Valid measurement fails all four; historical debt plus the separate category-A gap above; thresholds unchanged |
| Strict ATTW Sass/ESM diagnostics | Known non-blocking for tested ESM Angular consumer; strict command still fails; release review required |
| Showcase demos | 16 current audit mappings fail; historical ledger says 17 demos; Showcase 2 owner |
| Firefox/WebKit/axe | No such browser/axe run; Chromium-only matrix remains a release/test-matrix debt |
| Active docs / migration guide | No comprehensive active-doc rewrite or v2 guide performed; release-preparation debt |
| Package version/release metadata | Generated package remains `1.15.0`; no v2 release action authorized |
| Foreign TreeTable file | Untracked and byte-identical; external file owner must resolve before clean release worktree |
| Table/TreeTable exact bundle snapshots | Tiny current-vs-stored drift; root-unused 0 and <5% basic drift, but exact artifact audits still exit 1; do not regenerate silently |
| Other historical warnings | Menu NG8102, OrganizationChart tokens, inline SVG and unrelated component debts were not changed or reclassified here |

## 27. Public API drift

The contract audit passes with the same 97 entrypoints / 813 declarations / 1462 bindings / 5179 classified symbols. Calendar changed no public symbol, input, output, method or type. No compatibility API was added.

## 28. Migration readiness

Calendar's migration mapping remains `selectedDate` applied plus `selectedDateChange` proposal. No recipe, contract snapshot or migration guidance was changed in this reccloseout. The packaged Angular consumer passed; publication readiness remains separate.

## 29. Filesystem hygiene

`git diff --check` passes; staging empty; 0 versioned symlinks, no new symlink or tracked `dist`, and no `.n2-*` test temporary left in the workspace. The foreign `projects/ui-core/tree-table/public_api 2.ts` remains untracked and byte-identical, SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`. The interrupted consumer's exact temp fixture/cache were removed. Generated coverage/dist remain ignored, not staged.

## 30. Technical blockers

One verified blocker remains: the frozen NeuTree P1 keyboard typeahead path is not tested by the directed/browser gates and is entirely uncovered by the valid global unit coverage. It requires separately authorized targeted evidence; this reccloseout does not alter Tree runtime or tests. Calendar is not a remaining blocker. The small exact bundle-snapshot drift is documented, not silently passed.

## 31. Public-release blockers

The `1.15.0` package version and v2 migration/release artifacts, Showcase debt, strict ATTW review, browser/axe matrix and clean immutable checkpoint are outside this technical remediation and must be closed before public release. No release was attempted.

## 32. Git status

Branch `v2`; HEAD and parent as in §3. The prior untracked `N2-FINAL-CLOSEOUT.md`, Calendar remediation report/script, Calendar source/spec/package/bundle-audit changes and the foreign TreeTable file remain uncommitted. This reccloseout adds only this report and the fixture-only TreeTable hydration preparation filter; all are unstaged. No commit, push, tag, release, npm publish, Showcase 2 or later roadmap phase was started.

## 33. Final recommendation

**N2 FINAL RECLOSEOUT — NOT CERTIFIED.** Authorize a separate, focused test-evidence remediation for NeuTree P1 typeahead (and then rerun proportional gates); do not infer a runtime bug or alter coverage thresholds from this report. Keep the known release debts separately tracked.
