# N2 — Optimized component execution roadmap (proposal only)

## Decision and counts

**Reorder the original roadmap.** Preserve historical IDs N2-001…025 and keep N2-026…037 as references; do not renumber history. Current public components: **94** = 90 completed + 4 pending + 0 current removals; 2 products physically retired in D1. Pending difficulty: LIGHT 1, MEDIUM 0, HEAVY 2, VERY HEAVY 1. Pending effort: XS 1, S 0, M 0, L 2, XL 1. One-by-one active work would require **3 component/removal tasks**; the proposal is **3 implementation batches/phases** (remaining active groups; A3 already closed). This excludes one P3-deferred audit, final technical certification, Showcase and RC.

## Top 10 next best targets

| # | Component/batch | Difficulty | Effort | Why now | Recommended model |
| --- | --- | --- | --- | --- | --- |


## Dependency-aware execution

A3/A5/D1, B7/B8/B9/B5, A1, A2 and A4 are complete. A0.2 externalized Icon to neural-icons; continue with approved medium batches. D1 is labelled Wave D by work type but should run before TimelineGrid and Tree to avoid preserving removed consumers. A0.2 externalized Icon; A1/A2/A4 certified the dependent action, feedback and metrics/form-shell surfaces. N2-031 native improvements are directed within affected batches, not a mass rewrite. N2-032 package/bundle measurements run per batch and are consolidated in E.

## WAVE A — quick wins (0 components; 0 batches remaining)


## WAVE B — medium (0 components; 10 batches)


## WAVE C — heavy (3 components; 6 phases)

- **C4 — command overlay (1):** NeuCommandPaletteComponent. GPT-6 SOL HIGH implementation; require pre-runtime design review where API/owner changes are material, using GPT-6 ASTRA for architecture only.
- **C5 — board DnD (1):** NeuKanbanComponent. GPT-6 SOL HIGH implementation; require pre-runtime design review where API/owner changes are material, using GPT-6 ASTRA for architecture only.
- **C6 — hierarchical collection (1):** NeuTreeComponent. GPT-6 SOL HIGH implementation; require pre-runtime design review where API/owner changes are material, using GPT-6 ASTRA for architecture only.

C1 completed the ImageGallery merge into Gallery and physically removed its runtime/entrypoint; ImageViewer remains an independent directive using the one private preview engine. C2 is a coordinated two-facade DnD family, not two duplicate engines. C3/C4 have Router/overlay/focus boundaries. C5 has cross-column DnD identity. C6 Tree has hierarchy + lazy + virtual + DnD and is the only VERY HEAVY component; evaluate a clean rewrite, not an automatic one. None should be moved ahead of independent quick wins merely for LOC.

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

LIGHT audit-only: GPT-6 LUNA; bounded implementation: GPT-6 SOL MEDIUM. MEDIUM and HEAVY implementation: GPT-6 SOL HIGH. GPT-6 ASTRA only for high-impact design review before C3/C4/C5/C6 or any unexpected public contract ambiguity. Each batch gets pure/integration/type/contract tests proportional to change, SSR/hydration for DOM or lifecycle, a11y for interaction, bundle/root-unused and regression of actual consumers. Full suite/global coverage belong to E, not every batch. Completed batches are recorded in the portfolio; future work remains gated per batch.

## Blocking graph and phase economy

| Provider / decision | BLOCKS | BLOCKED BY / order |
| --- | --- | --- |
| Neural-icons + Button (A1) | Alert, EmptyState, Menu, SplitButton, DataView | A0.2 and A1 complete |
| Badge (A2) | Dock, MegaMenu, SpeedDial | A1 icon semantics |
| Gallery (C1) | ImageGallery merge | Media capability parity and ImageViewer directive audit |
| D1 physical removals | Safe Tree and TimelineGrid modernization | Classify active consumers; no runtime compatibility |
| Slider/Rating (B7) | No other pending component | N2-010 Forms base already certified |
| InputMask (B8) | No other pending component | N2-003 Forms base already certified |
| Splitter/ScrollArea (B9) | No other pending component | N2-001 controlled-state contract |

A3, A5, D1, A1, A2 and A4 are complete; remaining work is gated by its own batch. The plan saves **0** active component/removal task slots versus one-by-one execution (3 → 3); this is a phase count, not a calendar or token-cost guarantee.
