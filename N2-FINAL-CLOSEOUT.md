# N2 — Final closeout of Neural UI 2

## 1. Final status and recommendation

**N2 FINAL CLOSEOUT — NOT CERTIFIED.** The final audit stopped at a reproducible ownership-contract violation in the public `NeuCalendarComponent`. This is a technical N2 blocker, not a release-preparation debt. No runtime was changed in closeout and no later roadmap phase was started.

The component's `selectedDate` input is documented as the **controlled** date (source line 378). N2-022 states that `selectedDateChange` is the sole proposal channel and that Calendar has no mirror state. In the shipped source, `_selectedDate = signal(...)` (line 396) is synchronized from that input by an `effect()` (lines 502–505). More importantly, `selectDate()` writes `_selectedDate` **before** emitting `selectedDateChange` (lines 528–532). The visible month, selected day and agenda derive from `_selectedDate` (lines 466–500). Thus, when a parent rejects a proposed date and leaves its input unchanged, the Calendar still changes its applied presentation. Its existing navigation spec explicitly expects a new month after a click without a parent write (lines 168–179); the proposal spec only checks the event, not parent rejection (lines 182–195). This is not merely a lexical `effect()` finding. It contradicts the frozen N2-022 ownership contract and the final closeout's no-input-to-writable-mirror criterion.

Required remediation is a separate, explicitly authorized phase: preserve the applied parent date as the source of truth, test accepted and rejected proposals and no parent-write echo, then rerun the closeout gates. This report does **not** implement that change.

## 2–5. Checkpoint, toolchain, worktree and portfolio method

Starting branch `v2`; HEAD `c464031b817b65955ee31541296215981f32e702`; parent `aa52f09d78341f375d5f4eccf52ebe58b1bc1122`. Node **24.15.0**, npm **11.12.1**; installed Angular core/CDK **22.1.6**, CLI/build **22.1.8**, ng-packagr **22.1.1**, TypeScript **6.0.3**, RxJS **7.8.2**. Workspace version is `0.0.0`; the library metadata remains `1.15.0` and its Angular peers require `>=22.0.0 <23.0.0`. This is not a release version decision.

At entry, tracked files and staging were clean, no tracked Git-mode `120000` symlinks existed, and the only untracked file was `projects/ui-core/tree-table/public_api 2.ts` with SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`. It was not read as product source, edited, moved, staged or removed.

The official source/TypeScript-checker portfolio gate (`node scripts/generate-n2-component-portfolio.mjs`, without `--write`) passed: **94 distinct public `@Component` declarations = 94 marked COMPLETED + 0 PENDING + 0 REMOVE; 0 active implementation batches**. It resolves component declarations through public barrels and reconciles the checked-in contract; directives, aliases, secondary entrypoints, private renderers, tests, fixtures and Showcase do not add to this count. This proves inventory agreement, not that every component passes the final cross-cutting audit. The Calendar finding means “94 marked complete” cannot by itself certify the whole product.

## 6 and 45–46. Public-component inventory

`N2-COMPONENT-PORTFOLIO.json` is the authoritative generated inventory for entrypoint, phase, source path and prior SSR/hydration evidence. The status below is the inventory's prior `COMPLETED` label, **not** an N2 final certification. The form-like/CVA classification and representative browser recheck were not completed after the STOP.

| # | Public component | Entrypoint suffix | Prior phase | Inventory status |
|---:|---|---|---|---|
| 1 | NeuAccordionComponent | accordion | N2-020 | COMPLETE |
| 2 | NeuAlertComponent | alert | A2 | COMPLETE |
| 3 | NeuAutocompleteComponent | autocomplete | N2-007 | COMPLETE |
| 4 | NeuAvatarComponent | avatar | A3 | COMPLETE |
| 5 | NeuAvatarGroupComponent | avatar-group | A3 | COMPLETE |
| 6 | NeuBadgeComponent | badge | A2 | COMPLETE |
| 7 | NeuBlockUIComponent | block-ui | B4 | COMPLETE |
| 8 | NeuBottomSheetComponent | bottom-sheet | N2-022 | COMPLETE |
| 9 | NeuBreadcrumbComponent | breadcrumb | B1 | COMPLETE |
| 10 | NeuButtonComponent | button | A1 | COMPLETE |
| 11 | NeuButtonGroupComponent | button-group | A1 | COMPLETE |
| 12 | NeuCalendarComponent | calendar | N2-022 | COMPLETE (prior label; blocker above) |
| 13 | NeuCardComponent | card | A3 | COMPLETE |
| 14 | NeuCarouselComponent | carousel | B3 | COMPLETE |
| 15 | NeuCascadeSelectComponent | cascade-select | N2-007 | COMPLETE |
| 16 | NeuCheckboxComponent | checkbox | N2-003/004 | COMPLETE |
| 17 | NeuChipComponent | chip | A2 | COMPLETE |
| 18 | NeuCodeBlockComponent | code-block | B10 | COMPLETE |
| 19 | NeuColorPickerComponent | color-picker | N2-024 | COMPLETE |
| 20 | NeuCommandPaletteComponent | command-palette | C4 | COMPLETE |
| 21 | NeuCompareComponent | compare | B5 | COMPLETE |
| 22 | NeuCompareHandleComponent | compare | B5 | COMPLETE |
| 23 | NeuCompareIndicatorComponent | compare | B5 | COMPLETE |
| 24 | NeuCompareItemComponent | compare | B5 | COMPLETE |
| 25 | NeuConfirmDialogComponent | confirm-dialog | B4 | COMPLETE |
| 26 | NeuConfirmPopupComponent | confirm-popup | B4 | COMPLETE |
| 27 | NeuDashboardGridComponent | dashboard-grid | B6 | COMPLETE |
| 28 | NeuDataViewComponent | data-view | B6 | COMPLETE |
| 29 | NeuDateInputControl | date-input | N2-006/025 | COMPLETE |
| 30 | NeuDividerComponent | divider | A3 | COMPLETE |
| 31 | NeuDockComponent | dock | B1 | COMPLETE |
| 32 | NeuEmptyStateComponent | empty-state | A2 | COMPLETE |
| 33 | NeuFilterBarComponent | filter-bar | A5 | COMPLETE |
| 34 | NeuFormFieldComponent | form-field | A4 | COMPLETE |
| 35 | NeuInputGroupComponent | form-field | A4 | COMPLETE |
| 36 | NeuGalleryComponent | gallery | C1 | COMPLETE |
| 37 | NeuInlineEditorControl | inline-editor | N2-009 | COMPLETE |
| 38 | NeuInputComponent | input | N2-003/004 | COMPLETE |
| 39 | NeuInputMaskComponent | input-mask | B8 | COMPLETE |
| 40 | NeuInputOTPComponent | input-otp | N2-003/004 | COMPLETE |
| 41 | NeuInputTagsComponent | input-tags | N2-008 | COMPLETE |
| 42 | NeuKanbanComponent | kanban | C5 | COMPLETE |
| 43 | NeuKnobComponent | knob | N2-005 | COMPLETE |
| 44 | NeuListboxComponent | listbox | N2-007 | COMPLETE |
| 45 | NeuMegaMenuComponent | mega-menu | C3 | COMPLETE |
| 46 | NeuMenubarComponent | menu | B2 | COMPLETE |
| 47 | NeuMenuButtonComponent | menu | B2 | COMPLETE |
| 48 | NeuMenuComponent | menu | B2 | COMPLETE |
| 49 | NeuTieredMenuComponent | menu | B2 | COMPLETE |
| 50 | NeuMeterGroupComponent | meter-group | A4 | COMPLETE |
| 51 | NeuDialogComponent | modal | N2-022 | COMPLETE |
| 52 | NeuNavComponent | nav | B1 | COMPLETE |
| 53 | NeuNotificationCenterComponent | notification-center | B4 | COMPLETE |
| 54 | NeuNumberInputComponent | number-input | N2-005 | COMPLETE |
| 55 | NeuPaginationComponent | pagination | A5 | COMPLETE |
| 56 | NeuFieldsetComponent | panel | A5 | COMPLETE |
| 57 | NeuPanelComponent | panel | N2-021 | COMPLETE |
| 58 | NeuScrollAreaComponent | panel | B9 | COMPLETE |
| 59 | NeuPasswordComponent | password | N2-003/004 | COMPLETE |
| 60 | NeuOrderListComponent | pick-list | C2 | COMPLETE |
| 61 | NeuPickListComponent | pick-list | C2 | COMPLETE |
| 62 | NeuProgressBarComponent | progress-bar | A4 | COMPLETE |
| 63 | NeuRadioComponent | radio | N2-003/004 | COMPLETE |
| 64 | NeuRadioGroupComponent | radio | N2-003/004 | COMPLETE |
| 65 | NeuRatingComponent | rating | B7 | COMPLETE |
| 66 | NeuRichTextEditorComponent | rich-text-editor | N2-009 | COMPLETE |
| 67 | NeuScrollTopComponent | scroll-top | A5 | COMPLETE |
| 68 | NeuSelectComponent | select | N2-007 | COMPLETE |
| 69 | NeuSidebarComponent | sidebar | N2-021 | COMPLETE |
| 70 | NeuSkeletonComponent | skeleton | A3 | COMPLETE |
| 71 | NeuSliderComponent | slider | B7 | COMPLETE |
| 72 | NeuSpeedDialComponent | speed-dial | B3 | COMPLETE |
| 73 | NeuSpinnerComponent | spinner | A3 | COMPLETE |
| 74 | NeuSplitButtonComponent | split-button | B3 | COMPLETE |
| 75 | NeuSplitterComponent | splitter | B9 | COMPLETE |
| 76 | NeuStatsCardComponent | stats-card | A4 | COMPLETE |
| 77 | NeuStepperComponent | stepper | B1 | COMPLETE |
| 78 | NeuSwitchComponent | switch | N2-003/004 | COMPLETE |
| 79 | NeuTableComponent | table | N2-011J/K | COMPLETE |
| 80 | NeuTabPanelComponent | tabs | N2-021 | COMPLETE |
| 81 | NeuTabsComponent | tabs | N2-021 | COMPLETE |
| 82 | NeuTagComponent | tag | A1 | COMPLETE |
| 83 | NeuTerminalComponent | terminal | B10 | COMPLETE |
| 84 | NeuTextareaComponent | textarea | N2-003/004 | COMPLETE |
| 85 | NeuTimelineComponent | timeline | B10 | COMPLETE |
| 86 | NeuTimelineGridComponent | timeline-grid | B10 | COMPLETE |
| 87 | NeuToastContainerComponent | toast | A2 | COMPLETE |
| 88 | NeuToggleButtonGroupComponent | toggle-button-group | N2-007 | COMPLETE |
| 89 | NeuToolbarComponent | toolbar | A1 | COMPLETE |
| 90 | NeuTreeComponent | tree | C6 | COMPLETE |
| 91 | NeuTreeSelectComponent | tree-select | N2-019 | COMPLETE |
| 92 | NeuTreeTableComponent | tree-table | N2-015I/K | COMPLETE |
| 93 | NeuUploaderComponent | uploader | N2-009 | COMPLETE |
| 94 | NeuVirtualListComponent | virtual-list | C7 | COMPLETE |

All suffixes in the table are under `@neural-ui/core/`. Prior component reports hold the frozen P2/P3 exclusions and per-component SSR/hydration evidence; the final revalidation of those claims stopped early.

## 7–19. Contracts, architecture and rendering gates

These final gates were **not completed** after the required STOP: complete public entrypoint/package inventory and regeneration; symbol hygiene; all-form Signal Forms/CVA table (including TreeSelect); global ownership/effect and RxJS lifecycle adjudication; Angular 22 representative zoneless matrix; all-entrypoint SSR imports; representative SSR renders; Chromium hydration; and exactly-once interactions. Preliminary static source scans found no active `table-core`/`table/next` legacy facade references and no `primeng`/ApexCharts/HTTP/storage or experimental zoneless-provider reference in active product TypeScript/SCSS. Historical contract snapshots still contain some legacy names and are not product runtime. These are **partial observations**, not PASS claims.

The preliminary lexical census saw 39 `effect(` matches in 26 source files, 11 `afterRenderEffect(` matches, and 18 `.subscribe(` matches in 9 files; some matches are type/comment/property names and require classification before certification. Calendar's `effect` is the first confirmed input-to-writable mirror. No global count is certified. The existing Forms audit gate expects 24 Signal Forms controls, but it was not run in this stopped closeout; no final CVA table or “0 unjustified CVA” claim is made.

## 20–22. Full suite and global coverage

Full suite **without coverage**: **187/187 files, 2,484/2,484 tests PASS**, duration 74.28 s. The initial `npm test` invocation was stopped immediately when its configuration revealed coverage was enabled by default; the valid non-coverage run used `npm test -- --no-coverage`. This distinction is material to the requested order.

Global coverage was invoked **once**, after the green suite, with the unmodified `test:coverage` script. It exited **1**: 185 files/2,482 tests passed and two performance-evidence specs hit the existing 5-second timeout under V8 instrumentation (`neu-table.export-performance.spec.ts`, `neu-tree-table.query-performance.spec.ts`). No trustworthy global percentage/threshold comparison was produced. The same specs passed in the preceding non-coverage full suite. This is an instrumentation/time-budget finding, not evidence of failing functional assertions; no timeout or threshold was changed, and the coverage run was not repeated. In any case the Calendar runtime blocker independently prevents certification.

## 23–44 and 47–55. Gates deferred at the STOP boundary

The following were deliberately **not marked PASS** and not completed in this attempt: portfolio static/browser accessibility and keyboard/focus; resource/lifecycle stress and memory observations; transversal performance smoke; production build and warnings; package verification, publint, strict ATTW and entrypoint audit; Showcase audit; root-unused and bundle matrix/regressions/lazy chunks; full dependency and third-party inventory; final Table, TreeTable, Tree and VirtualList revalidation; Angular 22 installed consumer and consumer tree-shaking; security/robustness; migration recipes; active-doc consistency; release metadata; and final P2/P3 ledger. Earlier certified reports remain historical evidence, not a substitute for final gates. In particular, neither ATTW nor Showcase is asserted to pass, and the final report does not claim axe/Firefox/WebKit coverage.

Known prior release debts that still require re-evaluation include the strict ATTW Sass `styles` diagnostic, 17 missing Showcase demos, an unpublished v2 version/migration guide, and absent axe/Firefox/WebKit gates. Their final blocking classification remains **undetermined** because the mandatory technical stop was reached first. No PrimeNG macroaudit, Showcase 2 work, version bump or release preparation was started.

## 56–60. Debt and blocker ledger

| Finding | Current evidence | N2 technical blocker | Public release blocker | Next owner/action |
|---|---|---|---|---|
| Calendar applied-state ownership | Public `selectedDate` is labelled controlled, but `selectDate()` writes a mirrored signal before the parent accepts; existing navigation test demonstrates local transition. Contradicts N2-022. | **YES** | YES until repaired and reverified | New authorized remediation phase, then rerun final closeout |
| Coverage instrumentation timeouts | One global run exit 1; two performance-only specs exceeded 5 s; percentages unavailable. | Not adjudicated; Calendar already blocks | Must classify before release | Separate test-infrastructure review, without changing thresholds opportunistically |
| Strict ATTW Sass `styles` | Historically failing unfiltered command; not rerun here. | Undetermined | Undetermined | Package certification after remediation |
| Showcase demos | Historical 17 missing; not rerun or changed. | Not shown as Core blocker | Showcase 2 blocker | Showcase 2 phase |
| Foreign TreeTable copy | Untracked `public_api 2.ts`, unchanged; outside product/package. | NO | Worktree hygiene before release | File owner, not closeout |
| Firefox/WebKit/axe | No new run in this stopped closeout. | Undetermined | Test-matrix debt | Future browser/a11y certification |
| Version/migration/release artifacts | Library metadata still `1.15.0`; no v2 release action authorized. | NO | YES before public v2 release | Release preparation phase |

The Calendar issue is an **N2 TECHNICAL CLOSEOUT BLOCKER**. Release-only debt does not downgrade or override that result. Previously frozen P2/P3 work does not by itself make the portfolio incomplete; it was not re-enumerated because of the stop.

## 61–65. Git diff/status, conditions and scope

Only this closeout report changed. No product runtime, official snapshot, package version, thresholds or generated artifact was edited. Final branch/HEAD remain `v2` / `c464031b817b65955ee31541296215981f32e702`. Tracked diff and staging are empty; `git diff --check` passed. `git status --short` shows exactly two untracked paths: this report and the foreign `projects/ui-core/tree-table/public_api 2.ts`. The latter still has SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`. Git mode `120000` count is zero; no new symlink or test temporary was found (the ignored, pre-existing `coverage/` directory is empty). No commit, push, tag, release, npm publication, Showcase 2 or later roadmap phase is authorized or performed.

**Final recommendation: N2 FINAL CLOSEOUT — NOT CERTIFIED.** Resume only after the Calendar contract violation is resolved in a separately approved change and the unfinished gates, including the one-shot coverage interpretation, are completed honestly.
