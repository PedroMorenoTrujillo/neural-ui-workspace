# N2-B1 — Navigation state

## Status and scope

**B1 PASS.** Starting checkpoint: B2 menu family committed at `fb4c491eefce33b58c695e15934fd0aea5a79216`. This batch covers only Breadcrumb, Dock, Nav and Stepper. B3 retains a separate certification identity. No B1/B3 commit was created.

| Facade     | Applied state owner                                                                                | Focus/resource owner                                                              | Result                                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Breadcrumb | Ordered `items`; the final path item is current                                                    | Native link focus; no effect/listener/timer                                       | Semantic `nav` + `ol`, decorative separator and `aria-current=page`; duplicate labels no longer collide in tracking |
| Dock       | Consumer item `active`; RouterLink is navigation metadata only                                     | Existing roving controller and responsive-state media listener                    | RouterLinkActive removed; item identity, Badge, neural-icons, orientation and RTL retained                          |
| Nav        | Consumer item `active`; supplied `collapsed` is authoritative, omitted input uses local disclosure | Local group/flyout disclosure; one bounded 150 ms leave timer, cleared on destroy | Router subscription and URL-derived active state removed; rejected collapse proposals do not change DOM/ARIA        |
| Stepper    | Consumer `activeStep` and per-step completion/disabled data                                        | Native buttons and shared responsive-state listener                               | `stepChange` is a proposal; imperative navigation validates bounds/disabled target without changing applied step    |

## Ownership and public contract

Nav adds `NeuNavItem.active?: boolean`, making the consumer's applied current-page state explicit. `collapsed` now accepts `boolean | undefined`: a supplied boolean is controlled, while omission preserves the existing ergonomic local disclosure. Group opening remains local ephemeral presentation, not Router state. A parent write changes applied active/collapsed presentation without output echo. RouterLink remains solely for link execution; neither Nav nor Dock reads the URL to decide active styling. Breadcrumb's optional icon is now typed `NeuralIconName` and actually rendered through neural-icons. The only other declaration delta is Nav's ephemeral flyout placement shape for RTL. Contract snapshots were regenerated with the official generator; no entrypoint, component or output was added.

Stepper preserves its existing linear policy: advancing one step is a proposal, jumping beyond the next step requires the current step to be completed, and no child form is introspected. `next`, `prev` and `goTo` reject missing/disabled targets. Current step exposes `aria-current=step`; each button announces position and completed state, and disabled remains native. No form-value owner was introduced.

## Semantics, focus, RTL and icons

Breadcrumb uses ordinary links without roving focus. Dock retains its composite roving controller, orientation and RTL key mapping. Nav uses navigation links and disclosure buttons, not menu roles. Its collapsed flyout is a labelled navigation landmark with native links; focus can enter it, Escape closes it and returns focus to the trigger. RTL flyout placement uses the physical opposite edge, while CSS indentation and edge positioning use logical properties. Stepper uses native buttons and parent-applied current/completed/disabled semantics. Static icons use per-icon subpaths; dynamic names use `NeuralIconName`; Dock composes the certified Badge. No retired icon graph or full icon catalog was introduced.

## Effects and lifecycle

Product effects: Breadcrumb 0, Dock 1 existing roving-focus reconciliation, Nav 0, Stepper 0. Nav no longer has an input-to-writable effect or Router/RxJS subscription. Its one optional flyout leave timer is cancelled on re-entry and destroy; Escape does not reopen through focus restoration. Dock and Stepper use the shared responsive-state resource with removal on destroy. No URL/storage owner or per-item global listener was added.

## Verification

- `test:n2-b1`: **4 files, 110/110 PASS**. Includes applied active state, Router isolation, controlled rejection/acceptance, disabled/bounds, inert disabled flyout links, RTL flyout, keyboard/focus and lifecycle.
- Real Angular 22 zoneless Chromium SSR/hydration: **PASS** for all four public entrypoints, nested Nav, RTL, icons/badge and controlled proposals. SSR roots were reused, SVG count stayed stable, no initial output, 0 NG050x, first proposals exactly once and focus remained on the trigger after rejection. The fixture removes its temporary directory in `finally`.
- Production build, `audit:contracts`, `test:contracts`, icon boundary, published-package audit, package verification, 98 public imports and 98 SSR imports: **PASS**. Shared full suite after B3, with coverage disabled: **182 files, 2,455/2,455 PASS**. The default `npm test` also passed all 2,455 tests but exited nonzero on the pre-existing global coverage thresholds (functions/statements/branches); thresholds and unrelated runtime were not changed.

The reproducible built-FESM audit externalizes Angular/CDK/RxJS and reports raw/gzip/Brotli bytes. Values are per consumer, not additive:

| Consumer    |     Raw |   Gzip | Brotli |
| ----------- | ------: | -----: | -----: |
| Breadcrumb  |  12,094 |  2,588 |  2,189 |
| Dock        |  40,625 |  8,989 |  7,872 |
| Nav         |  77,110 | 10,290 |  8,641 |
| Stepper     |  22,410 |  5,079 |  4,402 |
| Combined B1 | 122,647 | 17,093 | 14,136 |
| Root unused |   **0** |     20 |      1 |

## Diff, risks and recommendation

The diff is limited to these four facades/tests, B1 scripts, official contract/portfolio updates and the separate B3 batch. The existing foreign untracked `projects/ui-core/tree-table/public_api 2.ts` was left unchanged and unstaged (SHA-256 verified). No symlink or temporary fixture remains. Nav still has one local flyout timer and Dock retains its existing focus effect; neither owns applied selection. The current Stepper completion inference for prior steps is retained rather than redesigning validation.

An additional historical `test:n2-navigation-contracts` check remains 4/5: its N2-021 assertion forbids an `effect()` already present in the unchanged Panel source at this B1 starting commit. This is unrelated to the four B1 facades and was not changed to make the check pass.

**B1 CERTIFIED — READY FOR B3.**
