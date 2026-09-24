# N2-C4 — CommandPalette design review and implementation

## 1. Status

**C4 COMPLETE — READY FOR C5.** The initial pre-runtime STOP below is preserved as history. The user subsequently froze the open and action/navigation contracts, and C4 was implemented and verified as documented in the final addendum.

## 2. Scope

Only `@neural-ui/core/command-palette` was audited. C3 remains closed. C5 was not started. No Menu, TieredMenu, MegaMenu, TreeTable, package contract, or portfolio file was modified.

## 3. Starting checkpoint

Branch `v2`, HEAD `d4a7544f31977de95d5a027c0f0a62f62e2fe2d7` (`feat(megamenu): implement N2-C3 bounded grouped navigation`). The only pre-existing untracked file is `projects/ui-core/tree-table/public_api 2.ts`, which is foreign to C4 and remains untouched.

## 4. Legacy baseline

The entrypoint exports four symbols: `NeuCommand`, `NeuCommandPaletteComponent`, `NeuCommandPaletteItemDirective`, and `NeuCommandPaletteService`. The component has **0 inputs, 0 outputs, 4 callable public methods** (`optionId`, `activeOptionId`, `setActive`, `execute`) plus exposed `itemTpl`/`listId`. The service has **5 public methods** (`register`, `unregister`, `open`, `close`, `execute`) and exposes `isOpen`, `query`, and `filteredCommands` signals. Its root-provided registry is the applied command owner. The legacy spec contains 36 tests, many coupled to public/internal handlers and the service registry. No production internal consumer was found; the only TypeScript consumer is the component's own spec.

Runtime imports: Angular Core/Common, `@neural-ui/core/focus-trap`, `@neural-ui/core/internal` for IDs, and CDK Overlay for scroll blocking. No Router, Forms, CVA, HTTP, storage, RxJS subscription, or Menu facade runtime import. One Angular document-keydown host listener per component instance, two `effect()` calls (scroll blocking and active-index correction), no explicit timer/observer/rAF. The panel is an in-tree fixed modal; CDK is **not** the panel boundary. Its actual SSR/hydration and repeated lifecycle behavior remain unverified for C4.

## 5. Product definition

The approved target is flat/grouped search → presentation → command action or navigation. Recursive commands and submenu behavior are not P1 CommandPalette responsibilities.

## 6. Domain model

Legacy `NeuCommand` requires `id`, `label`, and an imperative `action: () => void`; it optionally has `group`, text/emoji `icon`, shortcut text, and `disabled`. It lacks description, keywords, and declarative navigation. No transient highlight/search/overlay fields are stored in `NeuCommand` today.

## 7. Ownership matrix

| Slice | Legacy | C4 target / unresolved choice |
| --- | --- | --- |
| Commands | Root-provided mutable service registry | Consumer-owned readonly input; service registry must not remain the domain owner. |
| Open | Root-provided service `isOpen` | **Unresolved:** per-instance local session vs parent-controlled input/proposal vs service-only open channel. |
| Query | Service writable signal | Ephemeral per-instance search text is the supported direction, not a consumer domain slice. |
| Highlight | Component index signal and corrective effect | Ephemeral stable-result identity; no public output. |
| Route/current app state | Callback may use external Router | Consumer/Router-owned; no route subscription or `RouterLinkActive` owner in the palette. |

## 8. Action/navigation

**Unresolved public contract.** The legacy model executes required callbacks; C3's certified command model also permits callbacks, while the C4 authorization says action should emit domain intent and navigation should be declarative. These facts do not uniquely decide whether C4's action callback is removed, retained alongside an output, or retained as the sole executor. The navigation fields and their mutually exclusive shape likewise require a frozen public choice before implementation.

## 9. Public API redesign

Proposed removals/internalization after resolution: global command registry; public DOM/keyboard/focus/search helper methods; writable service query; index-based active API. Do not regenerate the public contract until the replacement open/action API is approved. `NeuCommandPaletteItemDirective` can remain a presentation-only template contract if its context stays typed.

## 10. Search semantics

Legacy search trims and lowercases query, then searches only label/group by substring. It is accent-sensitive, does not normalize internal whitespace, and does not search description/keywords. A deterministic, pure normalization policy can be frozen after the domain contract is settled; no fuzzy score is justified by current evidence.

## 11. Search pipeline

Legacy search is a service `computed()` over its registry/query. Target pipeline is pure commands → normalized searchable fields → matches → stable grouped projection; no DOM or effect. Not implemented in the stopped review.

## 12. Empty query

Legacy empty query returns all registered commands in registry order. There is no recent/favorite/history source. Preserve all supplied commands unless a later explicit C4 contract says otherwise.

## 13. Grouping

Legacy renders each command's group as trailing row text; it does not create group headers. The authorized target allows presentational flat groups only; exact visual grouping is not yet implemented.

## 14. Result limit

No legacy `maxResults` or pagination contract exists. Do not add a limit solely for theoretical scale.

## 15. Open/close

Legacy service `open()` clears query and sets `isOpen`; `close()` clears query and closes. Cmd/Ctrl+K toggles; backdrop and Escape close; execution closes. Whether the final API remains locally owned or becomes parent-controlled is the first design-review decision.

## 16. Shortcut

Cmd/Ctrl+K is existing behavior. Current Angular `document:keydown` host binding exists for each instance and does not check editable targets. Final listener ownership, configuration, and cleanup depend on the final open contract.

## 17. Overlay architecture

Legacy uses in-tree fixed backdrop/dialog and injects CDK Overlay only for a block-scroll strategy. The final panel boundary and outside dismissal must be implemented once, without importing Menu-family facades. No overlay rewrite has begun.

## 18. Outside dismissal

Legacy backdrop click and `NeuModalFocusDirective` Escape both call service `close()`. Real outside-click, destroy, and reopen behavior has not been C4-certified. The C3 outside-click finding is not assumed fixed here.

## 19. Focus

Legacy modal-focus directive targets the query input; the same modal infrastructure attempts focus containment and return. C4 still needs a real-browser focus-origin and cleanup test.

## 20. Highlighted result

Legacy stores an index; an effect repairs it when results change. `setActive()` can accept an out-of-range index (its test explicitly asserts `99`), so this behavior must not be preserved as a public contract. Final highlight should remain ephemeral and valid for the current result set.

## 21. Keyboard

Legacy supports Up/Down/Home/End/Enter/Escape and Cmd/Ctrl+K. Many tests invoke implementation handlers directly. Final tests must drive DOM keyboard events, disabled skipping, Tab containment, and exactly-once activation.

## 22. Pointer

Legacy `mouseenter` changes active index; option click invokes the callback. No persistent domain selection is involved.

## 23. Execution

Legacy action callback runs, then service closes; disabled commands do not run. Final exactly-once and close-after-action semantics await the action/open decisions.

## 24. Accessibility

The existing panel uses modal `dialog` containing a `combobox` input with a `listbox` and `aria-activedescendant`. This is a plausible base under the [WAI-ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) and [modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), but the input currently relies on placeholder instead of a proper accessible label and the no-results message is incorrectly rendered as `role="option"`. Final roles/relationships, status, groups, focus return and Tab behavior need certification, not assumption.

## 25. Signal graph

Legacy: registry/query signals → filteredCommands computed; service `isOpen` and component active-index signals; two effects. The target should derive search/grouping in separate computed nodes from an input command collection and ephemeral query.

## 26. Writable state

Legacy writable registry, open, query and active index. Final writable state is limited to justified per-instance UI session values; no input mirror or command-store owner.

## 27. Effects ledger

Legacy **2**: CDK scroll-block enable/cleanup and active-index correction. The correction is derived-state synchronization and should disappear in C4. Final effect count is not yet established.

## 28. Listener ledger

Legacy Angular document-keydown host listener; template input/option/backdrop listeners; modal-focus/focus-trap listeners; CDK scroll strategy while open. No explicit `addEventListener`, timer, observer or rAF in the component file. Final retained-listener counts require lifecycle measurement.

## 29. SSR

Legacy closed render is structurally empty and has no direct `window`/`document` reference in its TypeScript body, but no C4 SSR import/render gate has run. Do not claim SSR PASS from source inspection.

## 30. Hydration

No C4 real-Chromium hydration gate has run. DOM reuse, NG050x, first interaction, and duplicate-listener counts remain pending.

## 31. Zoneless

The legacy spec configures `provideZonelessChangeDetection()`. A real Angular 22 consumer and browser hydration remain pending.

## 32. RTL

Legacy CSS uses logical inline placement for the modal but also `translateX(-50%)`; C4 physical RTL review remains pending.

## 33. Responsive/mobile

Legacy uses one panel with `max-width: calc(100vw - 32px)`. No separate mobile data owner; narrow Chromium review pending.

## 34. Recompute evidence

Not instrumented. The final computed graph must prove highlight-only movement does not rerun search.

## 35. Performance 100

Not measured; runtime contract stopped before a comparable final implementation.

## 36. Performance 1k

Not measured; runtime contract stopped before a comparable final implementation.

## 37. Lifecycle stress

Not run. Final gate requires 100 open/close cycles and 100 create/destroy cycles where feasible.

## 38. Immutability

Legacy registry methods replace array references but permit command callback data and mutable command objects; no deep-frozen consumer fixture test exists. Final immutable input tests pending.

## 39. Bundle legacy

An esbuild consumer probe over the pre-existing C3-built `dist/neural-ui/core/fesm2022` artifact measured component BASIC **29,216 raw / 6,679 gzip / 5,828 Brotli B**; component+service **29,216 raw / 6,684 gzip / 5,860 Brotli B**. Inputs include the command-palette, focus-trap and internal FESMs; no Menu/MegaMenu facade FESM. This is a provisional artifact baseline, **not** a freshly certified build: a new baseline build attempt timed out after four minutes and must be repeated before final C4 certification.

## 40. Bundle basic

Final C4 BASIC not measured.

## 41. Bundle opened/grouped

Final C4 opened/grouped/RouterLink scenarios not measured.

## 42. Root-unused

The provisional pre-existing artifact probe produced **0 B raw** when the root package import was unused. Final C4 root-unused gate remains pending.

## 43. Dependency graph

Legacy direct graph: Angular Core/Common → focus-trap and internal ID helper → CDK Overlay scroll strategy. No Menu/TieredMenu/MegaMenu facade, Router, Forms/CVA, HTTP, storage or business service import in the component runtime.

## 44. Public methods

Legacy component's four callable public methods are DOM/result implementation details and candidates for INTERNALIZE/REMOVE. Service `register/unregister/execute` encode the legacy command-store/callback ownership and cannot be carried over unchanged to a consumer-owned `commands` input. Whether `open/close` move to component methods is unresolved.

## 45. Outputs/exactly-once

Legacy component has **0 outputs**; callbacks in command data are the only action channel. A final output matrix cannot be stated honestly until the action/navigation contract is selected.

## 46. Legacy tests

36 tests inventoried. Service registry/query and direct handler/index tests are legacy-API-only or need migration to DOM behavior; search, shortcut, disabled, template, keyboard, backdrop and ARIA behaviors remain relevant. Do not keep service compatibility merely to retain test count.

## 47. B2 regression

No shared B2 runtime modified. C3 reported B2 46/46 PASS; no C4 rerun is claimed.

## 48. C3 regression

No shared C3 runtime modified. C3 reported 12/12 PASS; no C4 rerun is claimed.

## 49. C4 tests

No rewritten C4 tests run; the 36-test file remains untouched.

## 50. Full suite

Not rerun. The certified C3 full-suite checkpoint was 183 files / 2,501 tests PASS without coverage.

## 51. Browser verification

Not run for C4.

## 52. Visual structural review

Not run for C4; no UI changes were made.

## 53. Build/package

A preliminary fresh build timed out after four minutes; no C4 build/package PASS is claimed. No source/package artifact was changed by this attempt.

## 54. API before/after

Legacy: **4 exported symbols**, component **0 inputs / 0 outputs / 4 callable public methods**, service **5 public methods** and 3 public signals; one template directive. Final counts are intentionally **not frozen** until open and action/navigation choices are resolved. Proposed statuses: service command registry REMOVE; `query` INTERNALIZE; component DOM helpers INTERNALIZE; command `action` CHANGE or KEEP subject to resolution; grouping/search behavior CHANGE; recursive commands OUT OF SCOPE (none existed).

## 55. Portfolio accounting

No C4 completion credit. C3 remains **94 public components, 90 complete, 4 pending, 3 active batches**. Recalculate from the generated portfolio only after C4 genuinely passes.

## 56. Risks

The material risk is inventing a public open/action API that consumers cannot migrate to. Other pending gates: modal/combobox semantics, lifecycle, real SSR/hydration, build provenance and bundle.

## 57. Git diff

Only this design-review report was added. No C4 runtime, tests, package metadata, contracts, roadmap, portfolio, or unrelated source were changed.

## 58. Git status

Branch `v2`; this report is untracked for review, alongside the pre-existing foreign TreeTable untracked file. No staging or commit. Verify again before any resumed implementation.

## 59. Recommendation

**NEEDS DESIGN REVIEW.** Freeze exactly:

1. Open owner/API: local per-instance `open()/close()` with shortcut; parent-controlled `open` input + proposal; or service-owned open channel without the command registry. State whether a parent may reject a close/open gesture.
2. Action/navigation contract: callbacks retained, action intent output, or both; discriminated navigation destination (`routerLink`/URL or equivalent); and whether action or navigation closes after activation. C3 permits callbacks, so it cannot decide this for C4 by analogy alone.

Once resolved, resume C4 from this inventory; do not start C5. No push, tag, release, npm publish or automatic commit.

---

## Final implementation addendum after normative resolution

### Frozen contracts and ownership

`NeuCommandPaletteComponent` now takes a readonly `commands` input, emits `commandAction` only for an action command, and exposes exactly `open(): void` and `close(): void`. The old root-provided `NeuCommandPaletteService` and registry are removed from runtime and the public contract. Open, query and highlighted semantic ID are per-instance ephemeral UI state; no parent-controlled open channel, writable mirror, command callbacks or domain effect was introduced. A document-level Cmd/Ctrl+K listener is installed only after browser render and is removed through `DestroyRef`. The `NeuCommand` union is closed over `action`, `router` and `link`; RouterLink is declarative and external links retain native `<a href>` activation. Modified/auxiliary navigation does not close the palette. Normal same-context activation closes exactly once; actions emit once.

The pure engine normalizes Unicode accents/case/whitespace, searches labels/descriptions/groups/keywords, preserves supplied order, groups by first occurrence, deduplicates IDs deterministically and retains highlight by semantic ID across results changes. No Menu/MegaMenu facade is imported. The public item template remains strongly typed. A single in-tree modal panel uses the existing focus trap and CDK scroll blocking; Escape, backdrop, focus return, disabled results, empty status, responsive width and RTL are covered. Because the results contain native links and buttons, the panel uses a labelled searchbox plus native result lists, not ARIA listbox/options (which cannot contain independently operable links/buttons accessibly).

### Verification

- Directed C4: **2 files, 30/30 tests PASS**; positive/negative compile-only type gate PASS. The legacy 36-test suite was replaced by 30 behavior-focused tests across component and pure engine files, so the full-suite arithmetic is 183 → 184 files and 2,501 → **2,495 tests**.
- B2 Menu directed regression: **46/46 PASS**. C3 MegaMenu directed regression: **12/12 PASS**. Full ui-core unit suite: **184 files, 2,495/2,495 PASS**.
- Production Angular build PASS; official public-contract regeneration/audit and contract tests PASS. Public import smoke: **97/97**. Package verification: **335 files PASS**. Neural-icons boundary PASS. Showcase entrypoint audit reports only the pre-existing 16 missing demo pages; no C4 entrypoint defect.
- Real Angular 22.1.6 zoneless Chromium SSR/hydration PASS: SSR renders no unopened panel; DOM reused; 0 NG050x; first action exactly once; native href/RouterLink navigation and modified click; shortcut, Escape, outside close and focus return; group/disabled semantics; mobile/RTL. No server-side request or browser-global evaluation.
- Pure-engine Node baseline, p50/p95: 100 commands prepare 0.102/0.215 ms, query 0.007/0.025 ms, group 0.009/0.011 ms, 100 arrow advances 0.139/0.278 ms. 1,000 commands prepare 1.094/1.522 ms, query 0.030/0.036 ms, group 0.023/0.029 ms, arrow advances 0.412/0.733 ms. Browser open+close, 30 samples with two animation frames each: 33.3/33.7 ms. These are reproducible local baselines, not cross-device claims.
- Bundle basic **37,577 B raw / 7,941 B gzip / 6,946 B Brotli**; opened 37,635 / 7,968 / 6,994; grouped 37,654 / 7,980 / 6,977; RouterLink 37,654 / 7,977 / 6,977. Root-unused **0 B**. The C3 provisional legacy basic was 29,216 / 6,679 / 5,828; the ~1.26 KB gzip increase is attributable to the new discriminated navigation, grouping/search metadata and native interactive rendering. No Menu/MegaMenu FESM is retained.
- Portfolio was regenerated by its official script: **94 public components = 91 complete + 3 pending; 2 implementation batches**. No C5 work was started.

### Package-audit environment note

The ignored generated `dist/neural-ui/core` tree contains unrelated duplicate directories with a ` 2` suffix, including a very large `fesm2022 2`. A temporary exclusion in that generated tree's `.npmignore` allowed `npm pack` and the package verification gate to complete; **no tracked package metadata was changed for this workaround**. Publint passes. The unmodified strict ATTW command returns **exit 1** for one root-entrypoint Node10 internal type-resolution error (`@neural-ui/core`); all 97 secondary entrypoints resolve. Its root declaration imports `@neural-ui/core/foundation`, whose declaration, module and export are all present in the packed package. The root source and its import predate C4. A diagnostic ATTW run ignoring only this known `internal-resolution-error` category passes. Strict ATTW therefore remains a separate package-tooling debt, not a C4 runtime/public-contract regression; do not misreport the strict command as PASS. No runtime or public C4 contract workaround was introduced.

### Git and recommendation

The temporary generated `.npmignore` exclusion was removed after the package checks; no packaging workaround is left in the working tree.

Changes are limited to CommandPalette runtime/styles/tests, C4 verification scripts, official contract/portfolio outputs and this report. The foreign untracked TreeTable file remains outside C4 and untouched. No symlink, temporary hydration fixture, commit, push, tag, release or npm publication was introduced. **C4 COMPLETE — READY FOR C5**, with the separate root ATTW packaging diagnostic noted above; C5 itself remains unstarted.
