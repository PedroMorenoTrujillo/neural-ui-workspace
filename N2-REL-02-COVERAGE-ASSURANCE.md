# Neural UI 2 — REL-02 coverage assurance

## 1. Status

**REL-02 REMEDIATION REQUIRED.** In the REL-02B final run, all 2,539 tests pass and lines reach 95.58%, while statements (93.18%), branches (88.55%) and functions (92.43%) remain below the unchanged 95.01% gate. Reachable behavior remains in the residual. All REL-02 work remains uncommitted and unstaged.

Sections 2–25 below preserve the earlier REL-02A checkpoint. The REL-02B addendum at the end is the authoritative final measurement and recommendation.

## 2. Starting commit

Branch `v2`; REL-01G commit `cd2cf16690c3b23842888150694c0dd3b256dbf9`, parent `fe2a07c0d9b520303567ba792662d6ba0c2cb7c8`, message `fix(package): finalize Neural UI 2 release bundle boundaries`. REL-02 started from that committed state. The separate, foreign `projects/ui-core/tree-table/public_api 2.ts` was not staged or edited.

## 3. Initial canonical coverage

The first fresh `ng test ui-core --watch=false --coverage` run used the canonical Angular/Vitest configuration. It passed 188 test files and 2,516 tests, then exited 1 on global coverage thresholds: statements 91.91% (22,577/24,564), branches 87.21% (12,828/14,708), functions 91.24% (4,284/4,695), lines 94.48% (18,008/19,060). The stale report directory had been removed before the run.

## 4. Thresholds

`angular.json` retains 95.01% for statements, branches, functions and lines, with `perFile: false`. No threshold, coverage provider, production-file inclusion or test exclusion was changed in REL-02.

## 5. File gap inventory

The final fresh report covers 180 production source records, including instrumented Angular templates. 130 files have at least one gap, down from 131 initially. The [machine inventory](N2-REL-02-COVERAGE-INVENTORY.json) contains every file's four percentages and counts, uncovered line ranges, branch locations with source snippets and uncovered function names where LCOV resolves them. The [human inventory](N2-REL-02-COVERAGE-INVENTORY.md) ranks files by absolute missed units. That sum is a prioritization proxy; statement, branch, function and line units overlap.

## 6. Statement gaps

Final: 1,923 of 24,564 statements remain uncovered. The 27 files with at least 50 combined missed units contain 1,412 of those statements. The largest statement gaps remain ColorPicker (126), Table renderer (119), Select (119), DateInput (114), TreeTable renderer (94) and Uploader (87). Exact locations are in the inventory.

## 7. Branch gaps

Final: 1,799 of 14,708 branches remain uncovered; the 27 material files contain 1,168. TreeTable renderer (138), Table renderer (122) and Select (115) remain the largest single-file branch gaps. Source inspection finds live filter, keyboard, overlay, editing, drag and fallback decisions. They require behavioral tests, not an ignore comment.

## 8. Function gaps

Final: 405 of 4,695 functions remain uncovered; 312 are in the material set. The LCOV-derived function list is in the machine and human inventories. Angular template listener functions and directive factories need individual attribution; this audit does not label all of them compiler-only.

## 9. Line gaps

Final: 1,004 of 19,060 lines remain uncovered; 803 are in the material set. The inventory records exact uncovered line ranges per file, including `.html` template source records.

## 10. Gap classification

The [material gap classification](N2-REL-02-MATERIAL-GAP-CLASSIFICATION.md) classifies all 29 files material in the initial run (threshold: 50 combined missed units), and therefore also covers all 27 remaining material files. Most contain category A real behavior; several also contain B defensive/error, C SSR or D browser-only behavior. Template and Select directive records include potential F compiler attribution, but no whole material file was assumed non-actionable. No code was proven category E unreachable, G diagnostic-only or H dead.

## 11. Existing exclusions audit

The [exclusions audit](N2-REL-02-EXCLUSIONS-AUDIT.md) lists all 21 existing `v8 ignore` regions with file, line span, reason and individual YES decision. Every region contains Angular signal query declarations; none encloses a handler or application branch. No exclusion was added or expanded.

## 12. High-risk uncovered behavior

The largest actionable clusters are Table and TreeTable renderer interaction branches; Select and TreeSelect keyboard/overlay behavior; Uploader file and drag paths; Tree and Kanban movement; MegaMenu focus/RTL; RichTextEditor asynchronous paste and cleanup; and ColorPicker/DateInput interaction alternatives. These are prioritized by absolute gaps and user impact, not solely low percentages.

## 13. Tests added

Five focused tests were added: TreeTable typed filtering/ordering boundaries; Table all-matching selection invalidation when nested filters change; ColorPicker accessible keyboard moves and commit count; DateInput period PageUp/PageDown without value commit; and TreeTable JSON handling of nonfinite numbers, bigint, dates, shared references, non-plain objects and circular data. A pre-existing Table export performance evidence test now has an explicit 15-second timeout so V8 instrumentation can complete its existing assertions.

## 14. Dead code removed

None. The uncovered source examined did not establish behavior-neutral, API-neutral dead code. Removing live guards or template paths to raise coverage would be incorrect.

## 15. Browser/SSR tests added

No new real-Chromium or SSR test was added in this slice. The new ColorPicker and DateInput tests exercise accessible keyboard and period behavior in the component test environment. Pointer, drag, focus and platform-specific residuals are explicitly classified for appropriate browser or SSR follow-up.

## 16. Test-quality rationale

Each new test asserts an externally observable result or a bounded error: filter ordering, selection scope semantics, ARIA values and commit count, unchanged date model during focus navigation, and exact JSON normalization/cycle rejection. They do not call methods merely for execution or add instrumentation ignores. The performance timeout change alters no metric assertion or production budget.

## 17. Coverage before/after

| Metric | Initial | Final | Covered units gained |
|---|---:|---:|---:|
| Statements | 91.91% | 92.17% | 64 |
| Branches | 87.21% | 87.76% | 81 |
| Functions | 91.24% | 91.37% | 6 |
| Lines | 94.48% | 94.73% | 48 |

Denominators did not change. The improvement is attributable to tests; no production code was edited.

## 18. Final global metrics

The final report was regenerated after removing the previous `coverage/ui-core` directory; `coverage-summary.json` was written at `2026-09-27T20:03:02.687Z`. Canonical run exit code: **1 because of coverage gates**, after 188/188 files and 2,521/2,521 tests passed.

| Metric | Covered / total | Final % | Gate |
|---|---:|---:|---:|
| Statements | 22,641 / 24,564 | 92.17% | 95.01% |
| Branches | 12,909 / 14,708 | 87.76% | 95.01% |
| Functions | 4,290 / 4,695 | 91.37% | 95.01% |
| Lines | 18,056 / 19,060 | 94.73% | 95.01% |

## 19. Full suite

Final no-coverage run: exit 0, 188/188 files and 2,521/2,521 tests passed. Final coverage run: all 2,521 tests passed, then exit 1 on the four coverage gates. An earlier instrumented attempt timed out a pre-existing export performance evidence test at Vitest's implicit 5-second limit and produced no coverage report. An explicit 15-second timeout resolved that instrumentation-time failure; the complete no-coverage and coverage runs were then repeated in the required order.

## 20. Build/package

`npm run build`: exit 0; Angular FESM and DTS bundles built successfully. REL-02 changed tests, inventory tooling and reports only; no package graph, exports or production files changed.

## 21. Contracts/imports/SSR

No production or package change triggered the mandatory production-change verification matrix. REL-01G's contracts, package verification, 100/100 imports and 100/100 SSR imports were already certified at the starting commit. REL-02 adds no public API or runtime behavior.

## 22. H9 effect

No production bundle input or H9 baseline changed. No H9 rebaseline is requested. The separate strict ATTW status remains `ATTW STRICT — KNOWN UNSUPPORTED-CONDITION DEBT`.

## 23. Runtime delta

Zero production-source edits. The only executable changes are test assertions and a test-only timeout; the coverage inventory script writes local evidence artifacts. No push, tag, release or publication occurred. Final Git check: branch `v2`, HEAD still `cd2cf16690c3b23842888150694c0dd3b256dbf9`, staging empty, six test files modified, six REL-02 evidence/tool files untracked, and the separate foreign TreeTable file untracked. Its SHA-256 remains `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`. `git diff --check` passes; tracked/untracked project symlink counts and temporary-file count are all zero.

## 24. Remaining coverage debt

With unchanged denominators, at least **698 additional statements, 1,066 branches, 171 functions and 53 lines** must be covered to reach 95.01% (ceil calculation against covered units). These are metric-specific counts, not additive test targets. The 27 material files still hold 1,412 missed statements, 1,168 branches, 312 functions and 803 lines. Reachable paths remain, so `REL-02 COVERAGE POLICY REVIEW REQUIRED` is not supported.

## 25. Recommendation

Keep REL-02 open and uncommitted. Continue with focused tests of the highest-risk Table/Select/TreeTable renderer branches, using real browser fixtures for pointer/focus behavior and SSR fixtures for platform guards. Re-run the full no-coverage and canonical coverage suites after remediation; declare PASS only when all four unchanged gates pass. Preserve the foreign TreeTable file and the certified REL-01G commit.

## REL-02B — coverage remediation addendum (final measurement)

### B1. Scope

Continued the unstaged REL-02 checkpoint on branch `v2` at HEAD `cd2cf16690c3b23842888150694c0dd3b256dbf9`. Added focused behavioral tests in the five requested waves, refreshed the inventory from a clean canonical run, and made no production or package changes.

### B2. Starting metrics

REL-02B began at 2,521 passing tests: statements 22,641/24,564 (92.17%), branches 12,909/14,708 (87.76%), functions 4,290/4,695 (91.37%), lines 18,056/19,060 (94.73%). The existing gate was 95.01% for each metric.

### B3. Wave 1 tests

Five tests cover Table sort/search/page controls and edit gesture boundaries, plus TreeTable explicit row filtering and the controlled query proposal/clear path. They assert accepted state, visible behavior and rejected gestures.

### B4. Wave 1 coverage impact

No isolated global run was made for this wave, so its individual coverage delta is not claimed. Its tests were included in the wave 1–3 midpoint run in B8.

### B5. Wave 2 tests

Three tests cover Select projected header/footer/empty/group/lazy-loader content and TreeSelect keyboard selection plus controlled horizontal expansion/collapse.

### B6. Wave 2 coverage impact

No isolated global run was made for this wave. Its tests were included in the midpoint measurement in B8.

### B7. Wave 3 tests

Four tests cover Uploader drag/drop and picker-only disabled behavior, Tree keyboard navigation, and Kanban card metadata without a move proposal.

### B8. Midpoint global coverage

After waves 1–3, a fresh canonical run passed 188/188 files and 2,533/2,533 tests, then exited 1 on coverage: statements 22,779/24,564 (92.73%), branches 12,997/14,708 (88.36%), functions 4,319/4,695 (91.99%), lines 18,149/19,060 (95.22%). Combined gains from the REL-02B start were 138 statements, 88 branches, 29 functions and 93 lines. The guidance targets of >94% statements, >92% branches and >93% functions were not reached.

### B9. Reprioritized residual

The midpoint inventory still showed 130 files with gaps and 26 material files (at least 50 combined missed units). Select, Table basic renderer, TreeTable renderer, ColorPicker and DateInput led the absolute gaps. V8 LCOV identified executable Angular template listeners among uncovered functions; these were treated as interaction paths, not automatically as nonactionable compiler artifacts. The small branch gain called for this instrumentation review before more tests.

### B10. Wave 4/5 work actually needed

Wave 4 added three tests: MegaMenu internal versus outside pointer dismissal, RichTextEditor cancelled link/alt fallback and asynchronous allowed-image paste. Wave 5 added three tests: ColorPicker rendered format/channel/alpha/swatch editing, DateInput rendered calendar navigation/day choice and time drum changes. All directed suites passed after correcting test expectations for format serialization and one-minute default step.

### B11. Browser-directed assurance

No real-browser coverage was merged into the canonical V8 report. DOM interaction tests exercised rendered controls in the component test environment. Pointer capture, native focus and platform-specific behavior still need a compatible browser coverage path before their counts can be included; no merged percentage is invented.

### B12. SSR-directed assurance

No new SSR coverage was merged into the canonical report. Existing SSR smoke evidence from REL-01G remains historical package assurance, not REL-02B coverage evidence. Platform branches are left in the residual inventory.

### B13. Template coverage work

The new tests invoke rendered template listeners for sort/search, filtering, projection, keyboard navigation, drag/drop, menu dismissal, format/channel/slider/swatch editing, calendar selection and time drums. Angular template records stayed included. No global template exclusion or compiler-only classification was introduced.

### B14. Branch remediation

Covered branches rose by 115 from the REL-02B start to 13,024/14,708 (88.55%). The residual is 1,684 branches; at least 951 more covered branches are needed for 95.01% with the present denominator. High-gap live paths remain in TreeTable renderer (127), Select (107), Table basic renderer (105), DateInput (79) and Tree (63).

### B15. Function remediation

Covered functions rose by 50 to 4,340/4,695 (92.43%). The residual is 355 functions; at least 121 more must be covered for the gate. Remaining template listeners and application callbacks need behavioral attribution rather than blanket exclusion.

### B16. Tests added total

REL-02B added 18 tests: wave 1 five, wave 2 three, wave 3 four, wave 4 three and wave 5 three. Together with the five earlier REL-02 tests, the suite grew from 2,516 to 2,539 tests. Existing performance assertions stayed intact; the earlier REL-02 test-only timeout is unchanged.

### B17. Production delta

Zero production-source, public API, package export, H9, ATTW or runtime changes in REL-02B. The build therefore checks the same product source as the REL-01G starting commit.

### B18. Exclusions delta

Zero. The 95.01% thresholds, V8 provider, production inclusion and 21 previously audited signal-query `v8 ignore` regions remain unchanged. No test-only or source path was excluded to raise a percentage.

### B19. Final inventory

The [machine inventory](N2-REL-02-COVERAGE-INVENTORY.json) and [human inventory](N2-REL-02-COVERAGE-INVENTORY.md) were regenerated from the final canonical report written at `2026-09-27T20:38:04.999Z`. Of 180 production source records, 130 have gaps and 26 meet the material threshold. The material set holds 1,152 missed statements, 1,047 branches, 258 functions and 632 lines. The leading absolute gaps are Select, Table basic renderer and TreeTable renderer; source locations and snippets are in the inventories.

### B20. Initial versus final coverage

| Metric | REL-02B start | Midpoint | Final | Covered units gained |
|---|---:|---:|---:|---:|
| Statements | 92.17% | 92.73% | 93.18% | 248 |
| Branches | 87.76% | 88.36% | 88.55% | 115 |
| Functions | 91.37% | 91.99% | 92.43% | 50 |
| Lines | 94.73% | 95.22% | 95.58% | 162 |

Denominators stayed fixed; these gains came from tests.

### B21. Final metrics

| Metric | Covered / total | Final | 95.01% gate | More covered units needed |
|---|---:|---:|---|---:|
| Statements | 22,889 / 24,564 | 93.18% | FAIL | 450 |
| Branches | 13,024 / 14,708 | 88.55% | FAIL | 951 |
| Functions | 4,340 / 4,695 | 92.43% | FAIL | 121 |
| Lines | 18,218 / 19,060 | 95.58% | PASS | 0 |

The remaining-unit counts are metric-specific and are not additive test targets.

### B22. Full no-coverage suite

After deleting the old `coverage/ui-core` output, `ng test ui-core --watch=false --no-coverage` exited 0 with 188/188 files and 2,539/2,539 tests passing.

### B23. Full coverage suite

The subsequent clean `ng test ui-core --watch=false --coverage` run passed 188/188 files and 2,539/2,539 tests, wrote the final V8 report, then exited 1 solely on the statement, branch and function global thresholds. The line threshold passed.

### B24. Build

`npm run build` exited 0; Angular FESM and DTS bundles built successfully. Final Git check: branch `v2`, HEAD still `cd2cf16690c3b23842888150694c0dd3b256dbf9`, staging empty, `git diff --check` exit 0, no changed production file, zero tracked/untracked project symlinks and zero temporary files. The separate foreign `projects/ui-core/tree-table/public_api 2.ts` remains untracked, unstaged and byte-identical (SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`). No commit, push, tag, release or publication occurred.

### B25. Recommendation

**REL-02 REMEDIATION REQUIRED.** Keep the 95.01% policy and all REL-02 work unstaged and uncommitted. The residual includes live renderer, selection and platform behavior, so a policy-review-only disposition is unsupported. Continue with broad behavioral scenarios in the largest remaining branch clusters, measure each substantial wave with a fresh canonical run, and declare PASS only when all four unchanged gates pass.
