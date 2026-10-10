# N2-A5 — Simple utility/navigation

Status: **A5 COMPLETE — READY FOR D1**. This is an uncommitted checkpoint after A3; A3's file ledger is in its own report.

## Audit, decisions, and changes

| Component | Result |
| --- | --- |
| Fieldset | Retains native `<fieldset>/<legend>` and projected controls, without inheriting or composing `NeuPanelComponent`. Added a narrow `disabled` input wired to native fieldset disabling and to the legend toggle; no state owner was added. It shares the existing `panel` package/stylesheet, an explicit bundle cost, but no Panel behavioral state. |
| FilterBar | Removed the input→writable mirror effect and local filter state. `filters` is the applied consumer-owned list; `filterChange` carries one proposed active-chip list per gesture. Rejected proposals leave DOM unchanged; accepted/reconstructed parent writes update it without echo. `clearAll` is inert when nothing is active, and `setActive` proposes existing keys in applied order. No Router/storage. |
| Pagination | `page`, `pageSize`, and `total` remain applied inputs; boundary and size changes emit proposals. The existing optional NeuSelect/Reactive FormControl is a UI interop bridge, not an alternate domain owner. Fixed rejected size proposals leaving NeuSelect visually at an unapplied value: the control and selector return to applied `pageSize`. Native buttons retain disabled boundaries, current-page ARIA and keyboard behavior. The document-locale observer has teardown. |
| ScrollTop | SSR guard prevents server access to scrolling APIs. One passive listener is bound to the selected target and removed on rebind/destroy; it has no timer or permanent global listener. Native button stays out of the DOM/tab order below threshold, keeps an accessible label, and chooses automatic scrolling for reduced-motion users. Existing NeuIcon import is unchanged; the hydration fixture uses its already-supported projected icon template so this batch does not alter the separate icons lane. |

No new domain effect was added. FilterBar's redundant effect was removed. Pagination's one input→FormControl adapter effect and ScrollTop's listener lifecycle effect remain explicitly UI-bound and are not domain mirrors. No Table pagination state was reused or modified.

## Gates

- Directed Angular tests: **4 files, 52/52 PASS**. These include frozen-input proposals, rejected/accepted parent writes, native disabled Fieldset behavior, Pagination size rejection, and ScrollTop one-listener teardown.
- Production Angular library compilation: **PASS** (`ng build ui-core --configuration production`).
- Real Angular 22 zoneless SSR + Chromium hydration: **PASS** via `scripts/test-n2-a5-hydration.mjs`; all four public components render on the server, DOM is reused, first filter/page gestures occur once, ScrollTop becomes visible after scrolling, and **0 NG050x** diagnostics occur. The test consumer copies only required compiled package entrypoints, creates no symlink, and deletes its temporary folder.
- A11y: native Fieldset/legend/button, FilterBar pressed states and group label, Pagination nav/current/disabled states, ScrollTop labelled native button and reduced motion; directed assertions and browser smoke pass.
- Bundle method: minified Angular-compiled package consumer ESM; Angular/RxJS external; gzip level 9 and Brotli quality 11. Bytes:

| Consumer | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| Fieldset (`panel` entrypoint) | 47,658 | 6,380 | 5,337 |
| FilterBar | 7,112 | 1,675 | 1,423 |
| Pagination | 138,249 | 24,025 | 20,610 |
| ScrollTop | 23,436 | 5,378 | 4,711 |
| Combined A5 | 210,838 | 34,611 | 28,443 |
| Root-unused | **0** | — | — |

Combined attribution is dominated by certified NeuSelect (105,635 raw output bytes), the shared Panel/Fieldset/ScrollArea package (41,848), internal utilities (16,147), Pagination (15,215), existing ng-icons core (13,003), ScrollTop (7,284), FilterBar (7,094), and existing Icon (3,225). A5 does not add those dependencies; it does not modify icon runtime or registration. The size is a representative import graph, not a whole-application cost or claim of new regression.

## Portfolio and hygiene

Regenerated the JSON/audit/roadmap only through `scripts/generate-n2-component-portfolio.mjs --write`; drift gate **PASS**. Source-derived count remains **98 public components = 42 completed + 54 pending + 2 planned removals**. A5's four rows are completed; **20** implementation batches remain.

A5-owned files: `projects/ui-core/panel/neu-panel.component.ts` and its spec (Fieldset-only changes), `projects/ui-core/filter-bar/neu-filter-bar.component.ts` and its spec, `projects/ui-core/pagination/neu-pagination.component.ts` and its spec, `projects/ui-core/scroll-top/neu-scroll-top.component.spec.ts`, `fixtures/n2-a5-hydration/a5-hydration.component.ts`, `scripts/test-n2-a5-hydration.mjs`, this report, and the portfolio generator plus its three generated artifacts. No icon source, certified Select/Panel behavior, Showcase, symlink, push, tag, release, publish, or commit was created. The foreign untracked TreeTable file remains untouched.

Recommendation: **A5 COMPLETE — READY FOR D1**.
