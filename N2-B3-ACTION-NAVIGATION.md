# N2-B3 — Action navigation

## Status and scope

**B3 PASS.** B1 passed its directed, SSR/hydration, package and bundle gates first; this report independently certifies Carousel, SplitButton and SpeedDial. No other roadmap batch was started and no B1/B3 commit was created.

| Facade      | Applied/local owner                                           | Change                                                                                                                                                          |
| ----------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carousel    | Consumer `page` when supplied; local page only when omitted   | Controlled gestures emit `pageChange` without changing the rendered page. A local-only responsive correction preserves the first item when scroll size changes. |
| SplitButton | Local ephemeral CDK menu session                              | Primary and menu triggers now compose A1 NeuButton. Each action invokes only its own output.                                                                    |
| SpeedDial   | Consumer `open` when supplied; local ephemeral open otherwise | `isOpen` computes directly from the applied input; the controlled input is no longer copied into a writable mirror.                                             |

## Carousel

Previous/next, indicators, Home/End, arrow keys and swipe retain the existing loop/clamp contract. Horizontal keyboard and swipe direction reverse under RTL; projected interactive slide content is not hijacked by the root keyboard handler. The viewport is `aria-live=off`, avoiding announcements for every automatic slide, while each visible group has its item position and the navigation buttons have names. Autoplay starts only after the browser's first render, never on SSR or before hydration; it stops on pause, input change, reduced-motion preference and destroy. One resize listener and one media-query change listener are removed on destroy. There is no locale-dependent or hidden page persistence.

## SplitButton

The main and chevron controls use the certified A1 Button component rather than duplicated button/spinner classes. The primary `neuClick` emits `primaryClick` once; menu-item activation emits `actionClick` once and cannot invoke the primary action. The existing CDK connected overlay, backdrop, roving keyboard controller, disabled/loading guards, Escape and guarded focus return remain. The trigger now exposes a deterministic `aria-controls` relationship to the menu panel. A static chevron comes from a per-icon subpath; optional item icons are typed `NeuralIconName` and rendered through neural-icons. No B2 public facade or parallel menu owner was introduced. The existing one document-click host listener remains Angular-managed and is released with the component.

## SpeedDial

An applied `open` input is now the source of truth for DOM, inert state and `aria-expanded`. A rejected proposal leaves the dial closed; acceptance updates it without an `openChange` echo. The local `_isOpen` signal is used only when `open` is absent. The existing lifecycle outputs retain their reason/event semantics through a bounded pending transition record, not an applied-state mirror. RouterLink remains action metadata, while RouterLinkActive was removed so URL changes cannot create a second active owner. Trigger/action elements remain native controls; the existing roving keyboard, Escape, focus return, mask and outside-close semantics are retained. The Badge component and per-icon neural-icons boundary are reused. CSS already suppresses motion under `prefers-reduced-motion`; no JS media-query state was added.

## Effects, resources and API delta

Carousel has two effects: one correcting only its _uncontrolled_ local page after responsive changes and one owning the browser-only autoplay timer. SplitButton has no product effect; CDK owns its overlay lifecycle and its focus microtasks check destruction. SpeedDial retains three effects: roving-item reconciliation, controlled lifecycle notification, and disabled close/proposal. It has one Angular-managed document pointer listener, not one per action. No Router subscription, storage or persistent URL owner was added.

The official declaration snapshot records `NeuSplitButtonAction.icon: NeuralIconName` instead of arbitrary `string`. The removed `mainClasses`/`chevronClasses` members were classified `INTERNAL/UNSUPPORTED` styling helpers, not supported inputs/outputs. No new public entrypoint, input or output was added. Contract snapshots were regenerated only for real deltas.

## Verification

- `test:n2-b3`: **3 files, 60/60 PASS**. Covers controlled rejection/acceptance, responsive/loop behavior, RTL, reduced motion and media cleanup, primary/menu ownership, CDK focus/overlay, SpeedDial actions and lifecycle.
- Real Angular 22 zoneless Chromium SSR/hydration: **PASS** for the three final public entrypoints, RTL, icons/badge and autoplay configured at SSR. DOM reused, 0 NG050x, no SSR autoplay/initial action, first Carousel proposal once, first SplitButton primary and popup item once, first SpeedDial action once. Temporary fixture removed in `finally`.
- Production build, `audit:contracts`, `test:contracts`, icon boundary, published-package audit, package verification, 98 public imports and 98 SSR imports: **PASS**. Shared full library suite with coverage disabled: **182 files, 2,455/2,455 PASS**. The default `npm test` also passed every test but exited nonzero on the pre-existing global coverage thresholds; no threshold or unrelated runtime was changed.

The reproducible built-FESM audit externalizes Angular/CDK/RxJS; CDK overlay runtime is therefore not included in these bytes. Values are per consumer, not additive:

| Consumer    |     Raw |   Gzip | Brotli |
| ----------- | ------: | -----: | -----: |
| Carousel    |  22,876 |  4,477 |  3,834 |
| SplitButton |  48,824 |  9,522 |  8,343 |
| SpeedDial   |  56,190 | 11,354 |  9,955 |
| Combined B3 | 113,122 | 20,047 | 16,777 |
| Root unused |   **0** |     20 |      1 |

## Portfolio, diff and recommendation

The regenerated portfolio and drift gate pass: **95 public components, 76 completed, 19 pending, 9 remaining implementation batches**. This is exactly B1 +4 and B3 +3 from the B2 checkpoint. The diff is limited to B1/B3 runtime, directed tests, reproducible hydration/bundle scripts, official contracts and portfolio reports. The foreign untracked TreeTable file remains untouched. No symlink or temporary hydration directory remains. Remaining bounded risks are the existing per-instance outside listeners in SplitButton/SpeedDial and the externally measured CDK overlay cost; no broader menu or overlay redesign was attempted.

The extra historical `test:n2-navigation-contracts` check is 4/5 because it asserts that the unchanged N2-021 Panel has no `effect()`; the same effect exists at the B2 starting commit. No B3 component participates in that assertion, so it was not altered in this wave.

**B3 CERTIFIED — READY FOR THE NEXT AUTHORIZED BATCH.**
