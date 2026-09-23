# N2 — Optimized component execution roadmap (proposal only)

## Decision and counts

**Reorder the original roadmap.** Preserve historical IDs N2-001…025 and keep N2-026…037 as references; do not renumber history. Current public components: **96** = 47 completed + 49 pending + 0 current removals; 2 products physically retired in D1. Pending difficulty: LIGHT 19, MEDIUM 22, HEAVY 7, VERY HEAVY 1. Pending effort: XS 13, S 6, M 22, L 7, XL 1. One-by-one active work would require **48 component/removal tasks**; the proposal is **16 implementation batches/phases** (remaining active groups; A3 already closed). This excludes one P3-deferred audit, final technical certification, Showcase and RC.

## Top 10 next best targets

| # | Component/batch | Difficulty | Effort | Why now | Recommended model |
| --- | --- | --- | --- | --- | --- |
| 1 | A1 foundation/actions (5) | LIGHT | XS/S | Icon/Button unblock feedback, menu and data consumers | GPT-6 SOL MEDIUM |
| 2 | A2 feedback/status (5) | LIGHT | XS/S | Five low-risk feedback surfaces share tone/a11y checks | GPT-6 SOL MEDIUM |
| 3 | A4 metrics/form shell (5) | LIGHT | XS/S | Closes P1 StatsCard chart scope while auditing form shells | GPT-6 SOL MEDIUM |
| 4 | B2 menu family (4) | MEDIUM | M | Menu family has shared nested keyboard and overlay debt | GPT-6 SOL HIGH |
| 5 | B1 navigation state (4) | MEDIUM | M | Navigation state needs an explicit controlled/focus contract | GPT-6 SOL HIGH |
| 6 | B3 action navigation (3) | MEDIUM | M | Action navigation should follow shared interaction contracts | GPT-6 SOL HIGH |

## Dependency-aware execution

No-icons lane: **A3/A5/D1 and B7/B8/B9 completed**; A1 remains blocked by the separate icons lane. D1 is labelled Wave D by work type but should run before TimelineGrid and Tree to avoid preserving removed consumers. A1 gives Icon/Button first; A2 can then safely audit consumers. N2-031 native improvements are directed within affected batches, not a mass rewrite. N2-032 package/bundle measurements run per batch and are consolidated in E.

## WAVE A — quick wins (15 components; 3 batches remaining)

- **A1 — foundation/actions (5):** NeuButtonComponent, NeuButtonGroupComponent, NeuIconComponent, NeuTagComponent, NeuToolbarComponent. GPT-6 SOL MEDIUM; directed contracts/a11y, proportional SSR and bundle gates.
- **A2 — feedback/status (5):** NeuAlertComponent, NeuBadgeComponent, NeuChipComponent, NeuEmptyStateComponent, NeuToastContainerComponent. GPT-6 SOL MEDIUM; directed contracts/a11y, proportional SSR and bundle gates.
- **A4 — metrics/form shell (5):** NeuFormFieldComponent, NeuInputGroupComponent, NeuMeterGroupComponent, NeuProgressBarComponent, NeuStatsCardComponent. GPT-6 SOL MEDIUM; directed contracts/a11y, proportional SSR and bundle gates.

## WAVE B — medium (25 components; 10 batches)

- **B1 — navigation state (4):** NeuBreadcrumbComponent, NeuDockComponent, NeuNavComponent, NeuStepperComponent. GPT-6 SOL HIGH; controlled state, keyboard/focus, SSR/hydration and lifecycle gates where relevant.
- **B2 — menu family (4):** NeuMenubarComponent, NeuMenuButtonComponent, NeuMenuComponent, NeuTieredMenuComponent. GPT-6 SOL HIGH; controlled state, keyboard/focus, SSR/hydration and lifecycle gates where relevant.
- **B3 — action navigation (3):** NeuCarouselComponent, NeuSpeedDialComponent, NeuSplitButtonComponent. GPT-6 SOL HIGH; controlled state, keyboard/focus, SSR/hydration and lifecycle gates where relevant.
- **B4 — overlay feedback (4):** NeuBlockUIComponent, NeuConfirmDialogComponent, NeuConfirmPopupComponent, NeuNotificationCenterComponent. GPT-6 SOL HIGH; controlled state, keyboard/focus, SSR/hydration and lifecycle gates where relevant.
- **B5 — comparison interaction (4):** NeuCompareComponent, NeuCompareHandleComponent, NeuCompareIndicatorComponent, NeuCompareItemComponent. GPT-6 SOL HIGH; controlled state, keyboard/focus, SSR/hydration and lifecycle gates where relevant.
- **B6 — data layout (2):** NeuDashboardGridComponent, NeuDataViewComponent. GPT-6 SOL HIGH; controlled state, keyboard/focus, SSR/hydration and lifecycle gates where relevant.
- **B10 — content and temporal display (4):** NeuCodeBlockComponent, NeuTerminalComponent, NeuTimelineComponent, NeuTimelineGridComponent. GPT-6 SOL MEDIUM; controlled state, keyboard/focus, SSR/hydration and lifecycle gates where relevant.

## WAVE C — heavy (8 components; 6 phases)

- **C1 — media consolidation (2):** NeuGalleryComponent, NeuImageGalleryComponent. GPT-6 SOL HIGH implementation; require pre-runtime design review where API/owner changes are material, using GPT-6 ASTRA for architecture only.
- **C2 — ordered DnD lists (2):** NeuOrderListComponent, NeuPickListComponent. GPT-6 SOL HIGH implementation; require pre-runtime design review where API/owner changes are material, using GPT-6 ASTRA for architecture only.
- **C3 — hierarchical menu (1):** NeuMegaMenuComponent. GPT-6 SOL HIGH implementation; require pre-runtime design review where API/owner changes are material, using GPT-6 ASTRA for architecture only.
- **C4 — command overlay (1):** NeuCommandPaletteComponent. GPT-6 SOL HIGH implementation; require pre-runtime design review where API/owner changes are material, using GPT-6 ASTRA for architecture only.
- **C5 — board DnD (1):** NeuKanbanComponent. GPT-6 SOL HIGH implementation; require pre-runtime design review where API/owner changes are material, using GPT-6 ASTRA for architecture only.
- **C6 — hierarchical collection (1):** NeuTreeComponent. GPT-6 SOL HIGH implementation; require pre-runtime design review where API/owner changes are material, using GPT-6 ASTRA for architecture only.

C1 must prove ImageGallery-only counter/viewer behavior before its merge; ImageViewer is a **directive**, not a 99th component. C2 is a coordinated two-facade DnD family, not two duplicate engines. C3/C4 have Router/overlay/focus boundaries. C5 has cross-column DnD identity. C6 Tree has hierarchy + lazy + virtual + DnD and is the only VERY HEAVY component; evaluate a clean rewrite, not an automatic one. None should be moved ahead of independent quick wins merely for LOC.

## WAVE D — D1 completed (2 historical products removed)

D1 physically removed OrganizationChart and SchedulerGantt, their entrypoints/contracts/tests/active docs, after consumer classification. “Gantt” and “Scheduler” are not two additional components: one public SchedulerGantt runtime serves both concepts. Verify TimelineGrid remains useful independently; remove OrganizationChart before redesigning Tree. GPT-6 SOL MEDIUM with source/package audit.

## WAVE E — final technical certification (0 new components)

One cross-cutting checkpoint after all active runtime batches: full suite, global coverage, public contracts/package/entrypoints, SSR/hydration/zoneless, CVA=0, legacy scans, comparable bundle/performance, real a11y/keyboard and browser matrix. N2-031/032/033 are absorbed here only for final consolidation; directed gates run earlier. Do not run this audit now.

## WAVE F — Showcase (0 runtime components)

**DEFERRED UNTIL RUNTIME COMPLETE.** N2-034 final demos/migration guide follow stable public APIs. The 17 historical missing demos do not affect technical ordering. N2-035 RC gate follows Showcase; no release/publish is authorized.

## Explicit P3 deferral

VirtualList remains a real public component, but N2-036 2D/variable-height is **AUDIT ONLY / XS** now, not an active implementation batch. N2-037 StyleClass/AutoFocus is a directive/utility question, not a missing public component. Activate P3 only with a measured use case and new approval.

## Original roadmap disposition

| Original phase | Disposition | Reason |
| --- | --- | --- |
| N2-026 Slider/Rating | MOVE LATER → B7 | P2; quick wins and dependent foundations first |
| N2-027 InputMask | MOVE LATER → B8 | Independent parser phase after short batches |
| N2-028 Splitter | MOVE LATER → B9 | Layout contract plus ScrollArea lifecycle |
| N2-029 Gallery/ImageGallery/ImageViewer | MOVE LATER → C1 | Media merge heavy; ImageViewer is directive |
| N2-030 StatsCard/charts | MOVE EARLIER → A4 | P1 scope cleanup; no neural-charts implementation |
| N2-031 native pass | BATCH WITH A/B/C | Only targeted benefit, no mass migration |
| N2-032 contracts/package/performance | BATCH WITH EACH + E | Per-batch budgets, final consolidation |
| N2-033 final certification | KEEP AFTER RUNTIME → E | Full technical gate |
| N2-034 Showcase | KEEP LAST → F | 17 demos are deferred |
| N2-035 RC | KEEP AFTER F | Release gate, not automatic release |
| N2-036 2D virtualization | DEFER P3 | No measured need, VirtualList audit only |
| N2-037 StyleClass/AutoFocus | DEFER P3 | Utility/directive, not component backlog |

## Gate and model policy

LIGHT audit-only: GPT-6 LUNA; bounded implementation: GPT-6 SOL MEDIUM. MEDIUM and HEAVY implementation: GPT-6 SOL HIGH. GPT-6 ASTRA only for high-impact design review before C1/C3/C4/C5/C6 or any unexpected public contract ambiguity. Each batch gets pure/integration/type/contract tests proportional to change, SSR/hydration for DOM or lifecycle, a11y for interaction, bundle/root-unused and regression of actual consumers. Full suite/global coverage belong to E, not every batch. Completed batches are recorded in the portfolio; future work remains gated per batch.

## Blocking graph and phase economy

| Provider / decision | BLOCKS | BLOCKED BY / order |
| --- | --- | --- |
| Icon + Button (A1) | Alert, EmptyState, Menu, SplitButton, DataView | A1 first; Icon before Button |
| Badge (A2) | Dock, MegaMenu, SpeedDial | A1 icon semantics |
| Gallery (C1) | ImageGallery merge | Media capability parity and ImageViewer directive audit |
| D1 physical removals | Safe Tree and TimelineGrid modernization | Classify active consumers; no runtime compatibility |
| Slider/Rating (B7) | No other pending component | N2-010 Forms base already certified |
| InputMask (B8) | No other pending component | N2-003 Forms base already certified |
| Splitter/ScrollArea (B9) | No other pending component | N2-001 controlled-state contract |

A3, A5 and D1 are complete. A1 remains blocked by the separate neural-icons lane. The plan saves **32** active component/removal task slots versus one-by-one execution (48 → 16); this is a phase count, not a calendar or token-cost guarantee.
