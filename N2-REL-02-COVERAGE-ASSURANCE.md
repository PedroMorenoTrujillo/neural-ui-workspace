# Neural UI 2 — REL-02 coverage assurance

## 1. Status

**REL-02 REMEDIATION REQUIRED.** In the REL-02C final run, all 2,562 tests pass and lines reach 95.84%, while statements (93.54%), branches (88.79%) and functions (92.97%) remain below the unchanged 95.01% gate. The REL-02A/B checkpoint is committed locally as `b78cfa67232e0b0d8ad6c35db8865dda586cda3b`; REL-02C changes remain unstaged and uncommitted.

Sections 2–25 preserve the earlier REL-02A checkpoint. The REL-02B addendum preserves its historical measurement. The REL-02C addendum at the end is the authoritative final measurement and recommendation.

## 2. Starting commit

Branch `v2`; REL-01G commit `cd2cf16690c3b23842888150694c0dd3b256dbf9`, parent `fe2a07c0d9b520303567ba792662d6ba0c2cb7c8`, message `fix(package): finalize Neural UI 2 release bundle boundaries`. REL-02 started from that committed state. The separate, foreign `projects/ui-core/tree-table/public_api 2.ts` was not staged or edited.

## 3. Initial canonical coverage

The first fresh `ng test ui-core --watch=false --coverage` run used the canonical Angular/Vitest configuration. It passed 188 test files and 2,516 tests, then exited 1 on global coverage thresholds: statements 91.91% (22,577/24,564), branches 87.21% (12,828/14,708), functions 91.24% (4,284/4,695), lines 94.48% (18,008/19,060). The stale report directory had been removed before the run.

## 4. Thresholds

`angular.json` retains 95.01% for statements, branches, functions and lines, with `perFile: false`. No threshold, coverage provider, production-file inclusion or test exclusion was changed in REL-02.

## 5. File gap inventory

The final fresh report covers 180 production source records, including instrumented Angular templates. 130 files have at least one gap, down from 131 initially. The [machine inventory](N2-REL-02-COVERAGE-INVENTORY.json) contains each gap file's four percentages and counts, uncovered line ranges, branch locations with source snippets and uncovered function names where LCOV resolves them. The [human inventory](N2-REL-02-COVERAGE-INVENTORY.md) ranks gap files by absolute missed units. That sum is a prioritization proxy; statement, branch, function and line units overlap.

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

## REL-02C — coverage matrix remediation (final measurement)

### C1. Strategy and checkpoint

REL-02B improved branches by 115 over 18 tests (6.4 per test). REL-02C uses representative state transitions and parameterized DOM scenarios to reach multiple live branches per fixture. The verified REL-02A/B work was committed locally as `b78cfa67232e0b0d8ad6c35db8865dda586cda3b` (parent `cd2cf16690c3b23842888150694c0dd3b256dbf9`) with the exact message `test(coverage): expand Neural UI 2 behavioral coverage`. The foreign TreeTable file was excluded. New REL-02C work remains unstaged and uncommitted.

### C2. Starting metrics and ranked residual

Start: statements 22,889/24,564 (93.18%; 450 more to gate), branches 13,024/14,708 (88.55%; 951 more), functions 4,340/4,695 (92.43%; 121 more), lines 18,218/19,060 (95.58%; gate passed). The ranked top 15 by missed branches, then functions, from the final REL-02B inventory are:

| Rank | Source cluster | Missed B | Missed F | Missed S |
|---:|---|---:|---:|---:|
| 1 | TreeTable renderer | 127 | 12 | 90 |
| 2 | Select | 107 | 21 | 90 |
| 3 | Table basic renderer | 105 | 18 | 92 |
| 4 | DateInput | 79 | 19 | 83 |
| 5 | Tree | 63 | 12 | 55 |
| 6 | ColorPicker | 46 | 14 | 69 |
| 7 | MegaMenu | 45 | 13 | 64 |
| 8 | Kanban | 41 | 12 | 47 |
| 9 | TreeSelect | 38 | 14 | 50 |
| 10 | Table client pipeline | 37 | 1 | 15 |
| 11 | Uploader | 36 | 12 | 59 |
| 12 | Slider | 36 | 3 | 27 |
| 13 | Table public contract | 30 | 17 | 30 |
| 14 | Listbox | 30 | 9 | 23 |
| 15 | Autocomplete | 30 | 1 | 11 |

### C3. Compact state matrices

The following are selected representative combinations, not a cartesian product. Each row names a currently missed branch area, an observable assertion, and the reason its state differs from existing baseline coverage. Source line numbers refer to the committed inventory.

| Cluster | Representative state transition | Branch target | Observable assertion and distinction |
|---|---|---|---|
| TreeTable renderer | Empty/loading/error versus populated; collapsed parent versus visible child; editing accepted/rejected | template states; focus, edit and projection guards | State row or exact focused node and proposal count; separates applied state from an emitted proposal. |
| Select | Empty/grouped/lazy options; single versus multiple; controlled open accepted/rejected | projected templates, bulk action, filter/overlay guards | DOM/ARIA option state, model and typed output; distinguishes local filtering from transport and accepted state from proposal. |
| Table basic renderer | First/middle/last page; filter menu versus row filter; selected/disabled rows | pagination listeners, filter rules, selection templates | Page model and current-page text or filter/selection output; includes boundary controls previously unactivated through DOM. |
| DateInput | Date/time/datetime/multiple/range; empty, partial and complete; enabled/readonly | calendar hover, picker, footer and drum listeners | Canonical civil value, range preview, disabled state or overlay closure; distinguishes navigation from commit. |
| Tree | Empty versus loaded; expanded versus hidden child; disabled versus selectable | visible projection, focus and selection guards | Focused key, visible node count and proposal; distinguishes structural expansion from selection. |
| ColorPicker | Invalid/valid draft; alpha shown/hidden; browser sampling success/error | error template and channel/gesture alternatives | Error status, serialized color and one commit; distinguishes draft from applied value. |
| MegaMenu | Horizontal/vertical and LTR/RTL; item link versus action; open/closed | orientation and link template branches | Panel position/ARIA, action output and dismissal; distinguishes route link from command. |
| Kanban | Loaded/empty card; disabled/enabled move; same/different column | card template and drag proposal guards | Visible metadata and move proposal count; distinguishes rejected moves from accepted intent. |
| TreeSelect | Leaf/parent; collapsed/expanded; disabled/enabled; selected/missing | nested check and overlay branches | Node ARIA/model and expansion proposal; distinguishes parent propagation from leaf action. |
| Table client pipeline | Equal/different nested filters; empty/matching result; local/remote | filter equality and normalization | Stable query/result and request count; distinguishes semantic equality from a changed filter. |
| Uploader | Empty/selected/uploading/error; picker/drop; disabled/readonly | preview, progress and action listeners | File list, progress/error DOM and output; distinguishes a blocked gesture from a real selection. |
| Slider | Empty/bounded/nonfinite input; keyboard edge; value shown/hidden | normalization and keyboard branches | Value, ARIA and displayed range; distinguishes boundary clamping from ordinary increment. |
| Table public contract | Edit closed/valid/invalid; expansion allowed/blocked; remote/local | edit session and expansion guards | Edit/expansion proposal and applied state; distinguishes rejected editing from commit. |
| Listbox | Single/multiple; meta modifier; virtual boundary; selected/unselected | selection and active-row branches | Model, active descendant and option ARIA; distinguishes modifier toggling from simple selection. |
| Autocomplete | Empty/matched/grouped/lazy; keyboard accept/reject; overlay states | group template and replacement guards | Suggestion DOM, selected value and open state; distinguishes no-match from accepted suggestion. |

### C4. Behavioral scenarios actually added

REL-02C adds 23 scenarios in seven existing spec files: Table page controls (3), DateInput rendered selection/range/clear controls (6), Select bulk/filter/focus paths (3), Uploader native selection and picker controls (2), TreeSelect parent/disabled/filter paths (3), Tree RTL and focus boundaries (2), and TreeTable default/projected state templates (4). Parameterized cases share fixtures and assert applied model, rendered DOM/ARIA, or exact output; no expectation merely repeats an implementation branch.

### C5. Directed verification

All seven changed directed suites passed after their edits: Table 12/12, DateInput 53/53, Select 101/101, Uploader 14/14, TreeSelect 20/20, Tree 31/31, TreeTable 24/24. The full no-coverage suite later passed 188/188 files and 2,562/2,562 tests.

### C6. First global checkpoint

After 23 new scenarios, a fresh canonical V8 run passed all 2,562 tests but failed the unchanged gates: statements 22,978/24,564 (93.54%), branches 13,058/14,708 (88.78%), functions 4,365/4,695 (92.97%), lines 18,269/19,060 (95.84%). Relative to REL-02B, this gained 89 statements, 34 branches, 25 functions and 51 lines. The midpoint targets of 94.5% statements, 92.5% branches and 94% functions were missed.

### C7. Scenario efficiency decision

The first checkpoint yielded 34/23 = 1.48 additional branches per scenario, below both REL-02B's 6.4 and the REL-02C target of about 15. REL-02C stopped adding tests at that point and audited source-mapped coverage units. This avoids inventing a large number of similar tests to chase a percentage.

### C8. Final source identity and denominator

The clean final run and the checked-in baseline both count the same 180 production records and denominators: 24,564 statements, 14,708 branches, 4,695 functions and 19,060 lines. The inventory generator reads the canonical `coverage/ui-core/coverage-summary.json` and LCOV output. It does not alter the 95.01% gate, provider, inclusions or exclusions.

### C9. Attribution A — authored TypeScript

Of 1,648 final missed branch slots, 1,547 map to lines of authored TypeScript outside component template literals. This is a source-origin count, **not** a claim that every slot is easy to trigger. The largest residuals remain TreeTable renderer (125), Table basic renderer (105), Select (99), DateInput (68) and Tree (60). Their source snippets include live filter, focus, navigation, selection, export and guard decisions; the inventory gives exact file/line/block/branch identities for continued targeted work.

### C10. Attribution B — authored templates

The other 101 missed branch slots map to external `.html` templates or to template literals identified through the TypeScript syntax tree. This includes 27 in the Table renderer HTML and 11 in the DateInput inline template. The TreeTable projected/default-state scenarios covered eight branches in its HTML template; the remaining template slots still need rendered-state tests tied to visible assertions.

### C11. Attribution C — compiler structural output

No missed slot is proven compiler-only by this audit. Multiple branch slots can share one source line (for example the repeated RTL alternatives in MegaMenu), but source-map co-location alone does not establish a compiler-only branch. REL-02C therefore assigns **zero proven** units to this category and leaves unresolved structural attribution open in the inventory rather than subtracting it from the denominator.

### C12. Attribution D — browser/SSR environment

44 missed slots on 39 lines match narrow browser/SSR guard patterns such as `isPlatformBrowser`, a nullable browser handle, `defaultView` or optional browser APIs. This is a **candidate** subset of the 1,547 TypeScript slots, not 44 proven unreachable units. Some guards are reachable in the unit fixture, and browser/SSR scripts do not automatically satisfy the canonical V8 counters.

### C13. Attribution E — defensive/error paths

507 missed slots contain a null/undefined, runtime-type, invalid/error, destruction or throw guard pattern. This is a broad triage subset which overlaps D and includes ordinary reachable boundary behavior; it is **not** an exclusion request or a proof of impossibility. Such lines require an individually valid public input or state transition before a test is added.

### C14. Attribution F — contract-impossible paths

Two missed slots are attached to literal `false &&` conditions in `select/neu-select.component.ts` at lines 1044 and 1062. Their right operands cannot execute as written. No other branch is classified as contract-impossible without an explicit invariant proof. Even these two units are far below the 915 branches needed at the final gate.

### C15. Function attribution

The final run misses 330 of 4,695 functions. Of those, 107 have Angular generated template/listener name shapes in LCOV and 223 have other names. A generated listener name identifies a rendered interaction to inspect; it does not prove an artificial function. The new Uploader, Select and TreeSelect interactions gained 8, 5 and 5 functions respectively.

### C16. Final gate shortfall

At 95.01% with unchanged denominators, the final run still needs 360 statements, 915 branches and 96 functions; lines already pass. The first and final global runs differ by two branch hits and one statement hit, without a denominator change or source edit, so the final clean run is authoritative. The small variation does not affect the gate decision.

### C17. Browser coverage feasibility

The existing hydration scripts exercise built browser bundles as separate assurance. There is no repository pipeline that proves identical source identities, source maps, counter semantics and denominators between those bundles and the canonical `ng test ui-core` V8 report. Consequently their results are not merged into the four global percentages. A future merge would first need a fixture that covers one known source branch in both runners and verifies a single merged source record, branch identity, hit count and unchanged denominator.

### C18. SSR coverage feasibility

The SSR smoke script imports built `dist` entry points and checks server-side package behavior. It does not emit compatible canonical V8 source counters or a validated remap to the unit-test source records. Its outcome is reported separately; no SSR hit is imputed to the global gate.

### C19. Browser-directed assurance

`test:n2-date-input-hydration`, `test:n2-tree-select-hydration` and `test:n2-tree-table-hydration` passed in Chromium after a fixture-only stylesheet correction. The two latter fixture preparers had inherited a package Sass import that could not resolve in copied source fixtures. TreeSelect now loads the copied library `styles.scss`; TreeTable, which only copies its component subtree, uses the fixture CSS. These fixes change no production source or canonical coverage counter. The browser assertions cover DOM reuse, first proposals and hydration errors; their results remain separate from the unit coverage gate.

### C20. SSR-directed assurance

`test:ssr-smoke` passed for 100 built package entry points. The DateInput, TreeSelect and TreeTable hydration scripts also built and rendered SSR fixtures before Chromium checks. No SSR coverage percentage is claimed.

### C21. Final inventory and residual priority

The synchronized [machine inventory](N2-REL-02-COVERAGE-INVENTORY.json) and [human inventory](N2-REL-02-COVERAGE-INVENTORY.md) summarize 180 production records and detail the 130 with at least one gap. The next useful work is exact branch targeting in TreeTable renderer (125 missed B), Table renderer (105), Select (99), DateInput (68) and Tree (60), using each inventory block/branch identity and a visible behavioral assertion. Repeating broad state matrices at 1.48 branches per scenario is not an efficient gate strategy.

### C22. Final no-coverage suite

`ng test ui-core --watch=false --no-coverage` exited 0: 188/188 files and 2,562/2,562 tests passed. The 23 REL-02C scenarios are included.

### C23. Final fresh coverage suite

After deleting the prior coverage output, `ng test ui-core --watch=false --coverage` passed 188/188 files and 2,562/2,562 tests, then exited 1 solely on the unchanged global thresholds. Final counts: statements 22,979/24,564 (93.54%, +90 from REL-02B), branches 13,060/14,708 (88.79%, +36), functions 4,365/4,695 (92.97%, +25), lines 18,269/19,060 (95.84%, +51). The final branch yield is 36/23 = 1.57 per scenario.

### C24. Build

`ng build ui-core` exited 0 and generated the library's partial-compiled FESM and declaration bundles. No production source was modified for REL-02C.

### C25. Quality and repository state

Branch `v2` remains at checkpoint commit `b78cfa67232e0b0d8ad6c35db8865dda586cda3b`; staging is empty and all REL-02C test, fixture and evidence changes are unstaged. `git diff --check` passes. The foreign untracked `projects/ui-core/tree-table/public_api 2.ts` retains SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`. No changed file is a symlink or temporary artifact, and no production source, gate, exclusion or provider was changed. No push, tag, release or publication was made.

### C26. Recommendation

**REL-02 REMEDIATION REQUIRED.** The final clean canonical report remains below 95.01% in statements, branches and functions. The A/B source-origin attribution and narrow C/D/F evidence do not prove that compiler, browser/SSR or contract-impossible units dominate the 915-branch gate shortfall; a policy review would be premature. Continue only with branch-identity-specific behavioral work that shows materially better yield, or gather a reproducible counter/source-map proof before proposing any policy change.

## REL-02D — coverage gate provenance and branch forensics

### D1. Scope

This audit examines the existing 95.01% global gate, 245 exact missing branch slots, 123 uncovered function records, and a predeclared 50-slot experiment. It changes tests and evidence only. Production source, public API, Angular test builder, V8 provider, coverage thresholds, exclusions, and runtime behavior are unchanged. REL-02D is left unstaged and uncommitted.

### D2. Starting checkpoint

The REL-02C tests, fixture-only corrections, inventories, and report were committed once as `09e181859076dca0e379378814d0074dfa7f38c4` (`test(coverage): add branch-targeted Neural UI 2 scenarios`), parent `b78cfa67232e0b0d8ad6c35db8865dda586cda3b`. Before this checkpoint, the full no-coverage suite passed 188/188 files and 2,562/2,562 tests and `ng build ui-core` passed. The foreign untracked `projects/ui-core/tree-table/public_api 2.ts` was excluded from the commit.

### D3. 95.01 threshold origin

`git log -S 95.01 -- angular.json` identifies `470eaac03144d1c2d2dac3cd887d7cbbde91b79a` (2026-09-01, `test(ui-core): make coverage gate deterministic`) as the introduction. Its parent used 95 for statements, branches, functions, and lines. The commit changed all four to 95.01, retained `perFile: false`, and added `runnerConfig: vitest.coverage.config.mts`, which serializes test files in one worker. The commit message and diff contain no numeric rationale for the extra 0.01 point; none is inferred.

### D4. Threshold git history and configuration

At the threshold commit, the test builder was `@angular/build:unit-test`, coverage was enabled, the only explicit test exclusion was `**/*.stress.spec.ts`, and reporters were text, HTML, LCOV, and JSON summary. The same test block, including global rather than per-file enforcement, is present at H7 and HEAD. The runner still has `fileParallelism: false` and `maxWorkers: 1`. The project does not configure a separate browser or SSR source population for the canonical gate. `@vitest/coverage-v8` remains `^4.1.3` and Vitest `^4.0.8`; Angular changed from core/build 21.2.19 at H7 to core 22.1.6/build 22.1.8 now. GitHub CI history inspected for the threshold/H7 SHAs yielded no corresponding all-four-metric run; the local historical reproduction below is the positive evidence.

### D5. Historical four-metric PASS evidence

An isolated worktree at `bd1b168a6d2b185e20370225329a2546440a5ab4` (`test(ui-core): complete H7 coverage hardening`, 2026-09-01) was installed from its lockfile and ran its own `npm run test:coverage` to completion with exit 0: 148/148 files and 3,157/3,157 tests. The emitted summary was statements 23,255/23,672 (98.23%), branches 15,529/16,072 (96.62%), functions 4,905/4,970 (98.69%), and lines 18,197/18,404 (98.87%). This proves at least one historical green run under the 95.01 gate. It does not prove that this was the last green revision or that present counters are interchangeable.

### D6. Historical instrumentation and population

The H7 and present test blocks have the same builder, runner configuration, test exclusion, V8 package range, reporters, and global threshold. H7's summary contains 161 source records, all TypeScript; the present summary has 180 records, including 175 TypeScript and 5 authored HTML template records. Current tests number 188 files/2,568 tests. Angular major version, compiled output, source set, template mapping, and tests changed. These population differences are material even though the gate settings did not change.

### D7. Comparability verdict

**PARTIALLY COMPARABLE.** The historical PASS establishes that the gate was achievable for the H7 source and instrumented population. It cannot certify a like-for-like present percentage. In particular, H7 had **1,364 more** branch denominator slots (16,072 versus 14,708), despite having fewer source records. A simple claim that the Angular 22 upgrade inflated the current branch denominator is contradicted by the measured totals. Identifying the exact per-counter causes would require a two-revision source-map/counter diff, which this audit has not produced.

### D8. Denominator timeline

| Checkpoint | S covered/total | B covered/total | F covered/total | L covered/total |
| --- | ---: | ---: | ---: | ---: |
| H7 reproduced | 23,255/23,672 | 15,529/16,072 | 4,905/4,970 | 18,197/18,404 |
| REL-02C checkpoint | 22,979/24,564 | 13,060/14,708 | 4,365/4,695 | 18,269/19,060 |
| REL-02D final | 23,002/24,564 | 13,086/14,708 | 4,368/4,695 | 18,283/19,060 |

The REL-02 initial, REL-02B, REL-02C, and REL-02D current-source runs kept the same four denominators. Thus REL-02D's delta is interpretable at slot level; H7's percentage is historical provenance, not a current baseline.

### D9. Branch forensic sample method

[`audit-n2-rel-02d-forensics.mjs`](scripts/audit-n2-rel-02d-forensics.mjs) records a deterministic 245-slot sample from the REL-02C inventory's high-gap clusters in [`N2-REL-02D-FORENSIC-SAMPLE.json`](N2-REL-02D-FORENSIC-SAMPLE.json). Every row retains file, line, LCOV block and branch, original source line, syntax, one category, and reason. This is a purposive top-residual sample, not a statistically random estimate of all 1,648 baseline missing branches. A/B classifications are source-based candidates for reachable behavior; only the experiment proves hits.

### D10. Branch category counts

| Category | Meaning | Sample slots |
| --- | --- | ---: |
| A | Distinct user behavior candidate | 127 |
| B | Reachable defensive/error behavior candidate | 28 |
| C | Repeated counters for one behavior | 12 |
| D | Proven Angular structural counter | 0 |
| E | Proven browser-only branch | 0 |
| F | Proven SSR-only branch | 0 |
| G | Contract-impossible branch with source proof | 3 |
| H | Unknown or unproven environment/counter mapping | 75 |

The syntax distribution is 80 if/else, 41 short-circuit, 39 ternary, 32 optional/nullish, 17 template, 13 error guard, 12 browser guard, 1 switch, and 10 other. The 12 browser guards remain H because seeing a platform check does not establish which environment can execute its missing side. The 17 template slots remain subject to their individual A/B/H classification; template syntax alone is not proof of a compiler-only counter.

### D11. Counter multiplication evidence

The 12 C slots occur at `mega-menu/neu-mega-menu.component.ts:345-346`: repeated `rtl ? ... : ...` ternaries set overlay origin, alignment, and offset from the **same** local `rtl` boolean. A single direction state selects those coordinates together while LCOV assigns separate block/branch identities. This proves local counter multiplication for that source expression, not that all 12 slots are irrelevant or that the global 95.01 branch floor is unsound. Twelve is under 1% of the baseline 1,648-branch gap.

### D12. Template and compiler evidence

The sample contains 17 template syntax slots but no D assignment: no generated JavaScript/source-map pair was shown to establish a purely structural Angular branch. The source population now includes five HTML records absent at H7, which is a provenance difference rather than proof that their counters are artificial. Generated template listeners correspond to rendered interactions until demonstrated otherwise. No threshold or exclusion change is justified by these observations.

### D13. Browser and SSR candidate count

Twelve sampled slots have browser/platform guard syntax, but **zero** are proven browser-only E or SSR-only F. For example, Table renderer `341:13:0` checks `viewport.ownerDocument.defaultView === null` and has zero hits, while `341:13:1` has 111 canonical hits; TreeTable renderer `264:7:0` has zero and its sibling has 104. Neither fact proves the null side runs in the existing SSR fixture: the viewport effect may never execute there. The current candidate count is therefore 12 to investigate and zero verified environment-exclusive slots.

### D14. Contract-impossible count

Select source lines 1044 and 1062 use literal `false && ...`; the right operand cannot run without a source change. Tree source line 118 is the no-options arm of `virtualRange()`, but the template reads this computed value only inside the `virtualization()` arm and `focusIndex` calls it only after the options guard. Those are the three G assignments. The proof is limited to the current call graph and public contract; the audit does not generalize G to other nullish or error checks.

### D15. Function forensic sample

The same artifact classifies 123 of the baseline 330 uncovered function records: 50 meaningful event callbacks, 30 meaningful application functions, 2 browser callbacks, and 41 unknown. Proven compiler wrapper, SSR-only, defensive-only, and contract-impossible counts are zero. Across the full baseline, 107 uncovered function names have `_listener` form, 218 are `(anonymous_n)`, 2 are `HostBindingHandler`, and 3 have other names. Names are not causal proof: a `_listener` points to an interaction; an anonymous source-map position may identify a method declaration or signal initialization. The 41 unknown sample records require generated-code/source-map inspection before policy use.

### D16. Exact-target branch experiment

Before test edits, [`audit-n2-rel-02d-targets.mjs`](scripts/audit-n2-rel-02d-targets.mjs) froze 50 missing identities in [`N2-REL-02D-EXACT-TARGETS.json`](N2-REL-02D-EXACT-TARGETS.json): DateInput 17, Select 12, Table renderer 11, TreeTable renderer 6, Tree 4. Each row specifies file/line/block/branch, source condition, covered sibling sides, missing side, intended user state, and a visible assertion. An isolated rerun of checkpoint `09e1818` reproduced 188/188 files and 2,562/2,562 tests and supplied the 92 sibling counters retained in [`N2-REL-02D-BASELINE-SIBLINGS.json`](N2-REL-02D-BASELINE-SIBLINGS.json). It differed from the committed checkpoint summary by two branch hits and one statement hit, with the same denominators and target identities. Eight targets lacked any covered sibling in their block. Six tests were then added: DateInput month and year navigation (2), Select projected controls (1), Table required descending sort and page summary (1), TreeTable stale draft/immediate replacement (1), and Tree checked/mixed ARIA with zero-buffer window (1). No production file was edited. Directed runs passed DateInput 55/55, Select 102/102, Table 13/13, and combined Tree/TreeTable 57/57 tests. The two-file directed coverage command exited 1 solely because a subset cannot meet the global coverage thresholds.

### D17. Target-hit accuracy

[`audit-n2-rel-02d-results.mjs`](scripts/audit-n2-rel-02d-results.mjs) joins the frozen identities to the final LCOV file; [`N2-REL-02D-TARGET-RESULT.json`](N2-REL-02D-TARGET-RESULT.json) contains all 50 outcomes and 31 misses. **19/50 (38%)** targets received at least one hit, 31 remained zero, and none disappeared from instrumentation. Hits by file: DateInput 9/17, Select 3/12, Table 5/11, TreeTable 1/6, Tree 1/4. For example, rendered month/year navigation hit DateInput `213:8:0`, `213:8:1`, `213:9:0`, `252:10:0`, and `252:11:0`; Select template projection hit `210:2:0`, `293:3:0`, and `287:4:0`. This is direct slot evidence, while the 31 misses show that a plausible state/assumption did not necessarily trigger its exact branch.

### D18. Coverage delta from exact targeting

The final global run covered 29 baseline-missing branches: 19 declared targets and 10 incidental slots. Three Select slots that were covered in the checkpoint became uncovered (`947:88:0`, `1689:266:1`, `1691:267:0`), leaving a net **+26 branches**. Statements gained 23, functions 3, and lines 14; denominators stayed fixed. The six scenarios therefore produced 26/6 = 4.33 net branch slots per scenario, a useful local result but far short of the remaining gate. The Select file had three target hits yet no net branch gain, which illustrates why raw target-hit and global delta are both reported. The exact three newly uncovered identities are retained in the result artifact rather than silently credited to the new tests.

### D19. Browser merge proof

**BROWSER COVERAGE MERGE = NOT VALIDATED.** Existing Chromium hydration fixtures assert DOM behavior but call neither CDP precise coverage nor Playwright JavaScript coverage, and their application build has no demonstrated mapping from bundle V8 ranges to the canonical LCOV `SF`/`BRDA` identities. The source example at Table `341:13:0` is an unhit browser-null guard, but its sibling is already hit in the canonical DOM test; it is not a known missing browser-only branch definitely executed by hydration. There is therefore no defensible one-branch fixture to merge yet. Same original source, compatible block/branch identity, a single denominator, and repeatable combined hit count remain unproven. Browser assertions remain separate assurance.

### D20. SSR merge proof

**SSR COVERAGE MERGE = NOT VALIDATED.** The fixture runner builds an Angular server bundle and invokes `server/server.mjs` without Node V8 coverage collection or source-map remapping. The package SSR smoke imports built entry points without canonical counters. The `defaultView === null` examples are candidate server sides, but the existing SSR render has not shown that their viewport effects run. No SSR-only source branch with a mapped canonical `BRDA` hit, unchanged denominator, and deterministic merge was obtained. SSR behavior checks remain separate assurance.

### D21. Current coverage and gates

After deleting stale `coverage/ui-core`, the canonical `ng test ui-core --watch=false --coverage` run passed **188/188 test files and 2,568/2,568 tests**, then exited 1 on the unchanged global gate. Statements are 23,002/24,564 = 93.64% (337 more hits needed); branches 13,086/14,708 = 88.97% (889 needed); functions 4,368/4,695 = 93.03% (93 needed); lines 18,283/19,060 = 95.92% (pass). Needed-hit counts use `ceil(0.9501 × denominator) − covered`; they assume the denominator stays fixed.

### D22. Policy provenance conclusion

The gate has a concrete historical all-four PASS under the same global settings, but not a fully comparable instrumented population. The sample identifies 155 A/B candidates versus 12 C and 3 G with proof, 75 H requiring investigation, and no proven D/E/F. The exact experiment produces real branch gains with stable identities and denominator. These facts support continued focused remediation now; they do not show that compiler counters, environment partitioning, or impossible paths materially account for the 889-branch deficit.

### D23. Remediation feasibility

Next bounded tranche: predeclare approximately 100 LCOV identities across the same five high-gap components, then implement **at most 20** rendered-behavior scenarios with explicit events and assertions. Prioritize DateInput's remaining keyboard/commit branches, Table's filter commit and page state, Select's lazy/autofocus and keyboard paths, TreeTable's immediate versus explicit filter branches, and Tree's virtual scroll guards; skip G identities and resolve H before counting them as behavior. After each five-scenario batch, run directed coverage and compare exact hit IDs. Stop the tranche for redesign if fewer than half the declared identities are hit or net gain falls below four branches per scenario. Twenty scenarios at the observed 4.33 net yield suggest about 87 further branch hits, not a guarantee; this tranche alone cannot close an 889-slot gap. Reassess source maps, counter stability, and remaining meaningful behavior after the tranche before estimating further test count.

### D24. Policy-review eligibility

Policy review is not currently supported by the required counter evidence. The historical pass is only partially comparable; 12 proven multiplied and 3 impossible sample slots cannot explain hundreds of missing branches; and browser/SSR merges are unvalidated. A policy proposal would first need reproducible generated-code mappings for C/D/H, a quantified whole-population split, and a one-branch browser or SSR merge with unchanged denominator. Keep all four 95.01 thresholds, provider, include/exclude rules, and per-file setting intact while gathering that evidence.

### D25. Recommended next action and repository state

**REL-02 REMEDIATION REQUIRED.** The checkpoint commit is complete; REL-02D's six tests, three audit scripts, four JSON evidence files, updated inventories, and this report remain unstaged and uncommitted. The full no-coverage run exited 0 (188/188 files, 2,568/2,568 tests), `ng build ui-core` exited 0, and the fresh coverage run's only failure was the three unchanged thresholds in D21. `git diff --check` passes, staging is empty, no production source or symlink/temporary artifact changed, and the foreign untracked `projects/ui-core/tree-table/public_api 2.ts` still has SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`. Continue with the bounded exact-identity tranche in D23. The synchronized [machine inventory](N2-REL-02-COVERAGE-INVENTORY.json) and [human inventory](N2-REL-02-COVERAGE-INVENTORY.md) reflect the fresh REL-02D run. No push, tag, release, publication, Showcase2 work, production change, or gate change is part of this audit.
