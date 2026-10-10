# N2-C3 — MegaMenu design review

> **Final status after the normative resolution: C3 COMPLETE — READY FOR C4.** Sections 1–42 below preserve the original, correctly blocked pre-runtime design review. The resolution and certification are recorded in sections 43–47; the earlier STOP is historical, not the final recommendation.

## 1. Status

**C3 NEEDS DESIGN REVIEW — pre-runtime STOP.** No MegaMenu runtime, styles, tests, public contract, package export, or portfolio status was changed. The current implementation is materially a recursive APG-style application menu, whereas the authorized C3 target is a navigation-first, bounded, grouped large panel. Choosing which certified-looking legacy behaviors to break would define a new public contract; this report does not make that choice silently.

## 2. Starting checkpoint

Branch `v2`; C2 was reviewed and committed as `2e0fc011cf65933571b3061bd31b957835cc05a1` (`feat(lists): complete C2 ordered DnD lists`), parent `05ba222bcd26d40a72248e5f559f40233ae3ade4`. Its 14 owned files are the complete commit; staging and tracked tree are clean. The foreign untracked `projects/ui-core/tree-table/public_api 2.ts` remains untouched (SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`). C2 rechecks: directed 47/47, B9 74/74, full library 183 files / 2,497 tests, build, contracts, package, 97 public imports, 97 SSR imports, icon boundary and real Chromium hydration all pass; C2 combined bundle 80,412 B raw / 13,862 B gzip and root-unused 0 B raw.

## 3. Current capability inventory

Source: `projects/ui-core/mega-menu/neu-mega-menu.component.ts`, its SCSS/spec, public-contract snapshot, shared `NeuMenuActionLike`, and certified B2 internals. `KEEP`/`REFACTOR` below are technically plausible directions, **not authorization to edit** while the review questions remain open.

| Capability | Current behavior | Classification |
| --- | --- | --- |
| Horizontal/vertical root | Public `orientation`; roving APG menubar keys in both modes | KEEP orientation; NEEDS REVIEW root keyboard semantics |
| Direct root link | Router/external anchor, but `role=menuitem`, roving tabindex | REFACTOR to native navigation semantics |
| Root panel trigger | Native button, local `activeRootKey`, `role=menuitem`, `aria-haspopup=menu` | KEEP trigger; REFACTOR semantics |
| Root with both link and children | `items` branch wins; link metadata is ignored on activation | NEEDS REVIEW public dual-kind policy |
| Large panel | CSS `position:absolute`, not CDK overlay | REFACTOR to one CDK boundary if floating remains |
| Columns | `items: Item[][]` maps to CSS grid columns | KEEP |
| Nested groups | Recursive `items` at every depth; nested `<ul role=menu>` | NEEDS REVIEW bounded vs arbitrary recursion |
| Leaf links | RouterLink and external anchors; `role=menuitem`, `tabindex=-1` | KEEP links; REFACTOR native Tab behavior |
| Command leaves | Inherited `command` callback, native button | NEEDS REVIEW within navigation-first scope |
| Icons/badges | Dynamic `NeuralIconName`, `NeuralIcon`, certified `NeuBadgeComponent` | KEEP; no old icon catalog |
| Templates | One item template at all depths; start/end slots | KEEP slots; NEEDS REVIEW item-template semantics if levels change |
| Current navigation item | Consumer `item.active`; RouterLinkActive also adds active CSS | REFACTOR to one consumer-applied current owner |
| Open item | Local writable `activeRootKey`; `activeItemChange` emits on open/close | NEEDS REVIEW misleading public output/property |
| Hover | Switches panel only when one is already open; no hover-to-open | KEEP behavior if navigation-first is approved |
| Click | Panel roots toggle; leaves navigate or invoke command | KEEP one action per gesture; NEEDS REVIEW dual-kind cases |
| Root keyboard/focus | `NeuRovingMenuController`, arrows/Home/End/typeahead | NEEDS REVIEW APG vs native-nav keyboard contract |
| Panel keyboard/focus | Second roving controller; arrows/Home/End/typeahead, `tabindex=-1` links; microtask focus | NEEDS REVIEW; navigation target prefers native Tab |
| Escape/outside close | Escape returns root focus; global `document:pointerdown` closes | KEEP intent; REFACTOR to one bounded dismissal pipeline |
| Responsive/mobile | `breakpoint` matchMedia; mobile toggle reveals root and panel changes absolute→inline | KEEP only if inline disclosure remains approved; NEEDS REVIEW semantic transition |
| RTL | `direction` drives arrows and logical CSS | KEEP; retest overlay positioning after design resolution |
| Disabled | Buttons disabled; links have `aria-disabled` plus CSS pointer suppression | REFACTOR disabled link keyboard/non-navigation behavior |
| Separators | Inherited `separator`; `<li role=separator>` | NEEDS REVIEW relevance in navigation panel |
| Router metadata | RouterLink navigation plus RouterLinkActive visual class | KEEP navigation metadata; REMOVE URL-derived active presentation |
| SSR/lifecycle | SSR-safe import; responsive state starts false then attaches matchMedia; always-on document host listener | REFACTOR resource lifecycle; real C3 hydration not yet certified |

## 4. Public API inventory

One `@neural-ui/core/mega-menu` entrypoint exports seven symbols: component; `NeuMegaMenuItem`, `NeuMegaMenuItemTemplateContext`, `NeuMegaMenuOrientation`; and three directives (`neuMegaMenuItem`, `neuMegaMenuStart`, `neuMegaMenuEnd`). No second MegaMenu entrypoint exists. Source/snapshot expose **11 inputs**, **3 outputs**, and **8 callable methods**:

| Members | Preliminary classification |
| --- | --- |
| Inputs `id`, `items`, `orientation`, `breakpoint`, `scrollHeight`, `disabled`, `tabindex`, `ariaLabel`, `ariaLabelledBy`, `menuButtonAriaLabel`, `direction` | KEEP subject to native-navigation semantics; `tabindex` needs review if root roving is removed. No new input is justified by this audit. |
| Outputs `itemClick`, `mobileActiveChange` | KEEP as user-gesture notifications where still meaningful. |
| Output `activeItemChange` | NEEDS REVIEW: currently reports local **open** root and `null` on close, not a change to consumer-applied `item.active`. Keeping its name/meaning would conflate open and current; removing/renaming/repurposing is a public breaking decision. |
| Methods `activate`, `close`, `onDocumentPointerDown`, `onPanelKeydown`, `onRootKeydown`, `onRootMouseenter`, `toggleMobile`, `toggleRoot` | `close` may remain public; event handlers are candidates to INTERNALIZE, but public-contract regeneration would be required after authorization. No method change now. |
| Public writable/computed properties `activeRootKey`, `mobileActive`, `mobile`, `focusedRootIndex`, `processedRoots`, `rootListId` | INTERNALIZE candidates; current specs write `activeRootKey`/`mobileActive` directly. Treat as public-surface cleanup, not an invisible refactor. |
| `NeuMegaMenuItem` | Required `key`, `label`; optional recursive `items: Item[] | Item[][]`, `data`, and inherited icon/badge/active/disabled/separator/visible/url/routerLink/target/rel/tooltip/command. Recursion/commands require explicit KEEP or breaking REMOVE/CHANGE. |
| Item context and three template directives | Context is `$implicit`, `index`, `level`, `active`; item template is reused for root/group/leaf, start/end are content slots. Strong typing exists, but changed panel levels could change context meaning. |
| CSS tokens | Only shared `--neu-border`, `--neu-surface`, `--neu-text`, `--neu-primary-soft`, `--neu-primary`, `--neu-shadow-lg`, `--neu-surface-2`; no MegaMenu-specific public token was found. |

## 5. Design classification

The implementation is a **deep refactor or internal rewrite candidate**, but rewrite is not yet authorized by evidence alone. The stop is a public product-semantic decision, not an inability to code. B2 explicitly left MegaMenu outside its certified family; C3 must not reintroduce a second general recursive menu engine.

## 6. Semantic model

Current `<nav>` is coupled to `role=menubar`, `role=menu`, `role=menuitem`, two roving controllers, command actions and recursive submenus. That is not merely CSS nomenclature: the tests assert menubar role, root arrows/Home/End/typeahead, panel arrow traversal, command execution and depth-5,000 recursive normalization. Native navigation links/Tab and bounded section headings would materially alter those behaviors.

## 7. Navigation versus application-menu decision

**BLOCKER 1.** The C3 navigation-first target conflicts with currently implemented/tested APG-style menu semantics. Recommended resolution: authorize a major-version breaking navigation contract for MegaMenu, with former application-menu/recursive use cases migrating to the already distinct B2 Menu/TieredMenu. Alternative: explicitly preserve APG semantics in MegaMenu, accepting overlap with B2 and revising the C3 product target. The latter is not recommended because it recreates a second general-purpose menu engine.

## 8. Item identity

`NeuMegaMenuItem.key: string` is already required and is the correct stable identity candidate across reconstruction/hydration. Runtime currently tracks by key but does not validate duplicates; no new key input is required. Duplicate-key diagnostics/behavior should be frozen with the new panel shape before implementation.

## 9. Active/open/focus ownership

`item.active` is consumer-applied current navigation metadata; `activeRootKey` is local open-panel state; root/child controllers own ephemeral focus. `RouterLinkActive` adds a second URL-derived *visual* current source. **BLOCKER 2:** `activeItemChange` currently emits open state, not active/current navigation state. Recommended resolution: keep open local-ephemeral, remove or rename the misleading output as an explicit breaking delta, and render `aria-current` only from consumer-applied `item.active` on actual destination links. Do not add a controlled-open input absent a real requirement.

## 10. Root item kinds

Current root with `items` always becomes a trigger, even if it also carries `routerLink`/`url`/`command`; the latter fields are ignored by that gesture. **BLOCKER 3:** freeze whether such dual-kind data is invalid (recommended, with deterministic diagnostic) or panel-trigger precedence remains part of the public contract. Neither should execute two actions.

## 11. Panel architecture

Current desktop panel is an absolutely positioned DOM child of each root `<li>`; all panels are rendered, hidden by `aria-hidden` plus CSS. C3 target would use one CDK-connected overlay session anchored to the active root, but that change is deferred pending semantic approval. No B2 facade import is needed; CDK and neutral positioning/focus helpers are candidates.

## 12. Groups and columns

`Item[][]` defines columns, while any item may recursively own another `items` array. **BLOCKER 4:** choose bounded `root → columns → section/group → destination/action` (recommended) or preserve arbitrary depth. The latter is explicitly tested at depth 5,000 and is representable by the exported public type, so reducing it without approval would be a public behavior change.

## 13. Templates

The single `neuMegaMenuItem` context is reused at every level, plus start/end slots. Navigation-first group headings and leaf links could retain this directive, but `level` and `active` semantics must be fixed when the bounded shape is chosen. Do not add a generic render-everything template escape hatch.

## 14. Overlay

There is no current CDK overlay reference. The CSS desktop popup lacks collision-aware placement and viewport fitting beyond max width/height. A post-review implementation should use one CDK overlay boundary, not combine it with the existing absolute popup or a document portal.

## 15. Hover

Hover only switches to another panel trigger while a panel is already open; it does not open from closed or activate a leaf. There is no hover timer. Preserve this bounded pointer behavior if approved, and keep click/tap authoritative on coarse pointers.

## 16. Keyboard

Current root and panel both use roving menu controllers. The navigation-first recommendation is native Tab within panels and native links/buttons; whether root arrows/Home/End/typeahead remain an optional composite affordance is part of BLOCKER 1. Do not silently retain menu-style arrows across arbitrary columns.

## 17. Focus

Current `queueMicrotask` focuses the first child after every root open, including pointer opening; hover switching does not focus the new panel. Escape calls `close(true)` and focuses the root. A new focus policy should distinguish pointer vs keyboard opening, return focus on Escape, and never target unmounted overlay DOM. No change before review.

## 18. Escape and outside close

Escape closes local panel and returns focus; a host-level global `(document:pointerdown)` closes panel/mobile navigation on outside interaction. A CDK overlay would need one dismissal path to avoid duplicate close emissions. Current `activeItemChange(null)` on close is part of BLOCKER 2.

## 19. Direct links

Both `routerLink` and `url` root leaves are native `<a>` elements, but with `role=menuitem` and roving tabindex. Navigation-first should keep the anchors, remove fake menu roles, preserve modifier/middle-click behavior and use consumer-applied current state only.

## 20. Disabled

Buttons use native `disabled`. Links use `aria-disabled` and CSS `pointer-events:none`; the shared click guard prevents ordinary activation, but keyboard/focus semantics need directed verification after the navigation decision.

## 21. Router isolation

No Router subscription or writable URL mirror was found. `RouterLinkActive` nevertheless applies an active style independently of `item.active`. Removing it is required by the requested single consumer-applied current owner and is a consumer-visible styling change; include this in the normative resolution.

## 22. Responsive/mobile

`NeuResponsiveState` observes public `breakpoint` after browser render; mobile toggle controls local `mobileActive`. CSS changes the desktop floating panel into inline disclosure, with root order unchanged. Recommended: preserve this existing inline mobile behavior, explicitly define open-session continuity across breakpoint changes, and do not add width mirrors. This awaits the navigation/APG choice because roles and keyboard semantics currently do not change with layout.

## 23. RTL

Current `direction` changes roving arrow logic and logical CSS aligns roots/panels; it does not reverse data order. Final overlay collision placement and directional chevrons require real RTL browser verification after the semantic decision.

## 24. A11y

Current accessibility is internally consistent with an application-menu interpretation but inconsistent with the proposed native navigation interpretation. The decisive gap is not a missing ARIA attribute; it is which interaction pattern the public component promises. A11y certification is deferred until BLOCKER 1 is resolved.

## 25. Icons and badges

`NeuralIconName` is the inherited dynamic consumer icon contract; `NeuralIcon` renders it. `NeuBadgeComponent` handles badges. No `@ng-icons`, root runtime icon catalog, or duplicate badge implementation was found. A0.2 remains closed.

## 26. Effects and resources

Current MegaMenu has one product `effect` syncing root controller/focus and closing invalid open roots. `NeuResponsiveState.observe` adds one browser-only query effect and one shared matchMedia listener for the active breakpoint; its `DestroyRef` release path exists. The host registers one document pointerdown listener for each instance even when closed. No per-item effect, timer, ResizeObserver, CDK overlay ref, or explicit subscription was found. The `queueMicrotask` focus step is not a timer but needs lifecycle guarding in a rewrite.

## 27. SSR

Current package import is SSR-safe through the 97-entrypoint smoke already rechecked at C2. The responsive signal initially renders desktop structure on the server; no panel is initially open because there is no applied-open input. A real C3 SSR rendering fixture is deferred at this STOP.

## 28. Hydration

No real C3 Chromium hydration run is claimed. Required post-resolution assertions remain DOM reuse, 0 NG050x, no initial output, first open/switch/close exactly once, no duplicate panel/SVG, RTL and mobile behavior.

## 29. Zoneless

The current code uses signals and the shared responsive primitive, but a real Angular 22.1.6 `provideZonelessChangeDetection()` C3 consumer gate has not been run. No Zone.js dependency should be introduced.

## 30. Performance

The existing model recomputes a complete depth-first projection when `items` changes and keeps all closed panels in DOM. The depth-5,000 pure normalization test passes, but it is not the requested 8-root/4-group/~50-link switching benchmark. Post-resolution performance should measure switching and DOM identity; no throughput claim is made here.

## 31. Bundle before/after

Read-only pre-refactor esbuild measurement against the built C2 checkpoint, externalizing Angular/CDK/RxJS/neural-icons and resolving package-private Core FESM imports: basic component **58,320 B raw / 10,149 B gzip / 8,755 B Brotli**; component plus three template directives **58,328 / 10,153 / 8,746**. Root-unused is **0 B raw**. This is a reproducible *before* baseline, not a C3 result; no after measurement exists because runtime was not changed. Metafile inputs: MegaMenu, Badge, Foundation, Option API and Internal FESMs. No B2 facade FESM was pulled in.

## 32. Tree-shaking

The current entrypoint does not retain Menu/MenuButton/Menubar/TieredMenu facades in the measured basic consumer. Any later B2 helper reuse must preserve that boundary. The current `internal` FESM input is not proof that every helper in that file survives minification; retained bytes require a post-change metafile comparison.

## 33. Public API

Before C3: 7 exported symbols, 11 inputs, 3 outputs, 8 callable methods, and the public properties listed above. After C3: **unchanged so far**. A final target count cannot be certified before deciding `activeItemChange`, recursive `items`, commands, root dual-kind data and keyboard semantics. Do not regenerate snapshots for an unapproved target.

## 34. Directed tests

Current legacy MegaMenu spec: **1 file, 8/8 pass**. The test explicitly asserts menubar role, root/panel roving keys, command execution, recursive groups and depth 5,000. `test:n2-c3` was not created because the STOP precedes runtime and target semantics.

## 35. B2 regressions

B2 source was inspected only for neutral reuse boundaries (`NeuRovingMenuController`, CDK overlay/dismissal helpers); its certified contracts were not reopened or modified. A post-C3 B2 directed regression is required only after runtime implementation.

## 36. Full suite

The pre-C3 C2 checkpoint full suite passed **183 files / 2,497 tests** before and during the C2 commit review. No C3 runtime change occurred, so no new full-suite result is claimed and global coverage was not run.

## 37. Package and contracts

The C2 checkpoint passed production build, `audit:contracts`, `test:contracts`, package audit (including publint/ATTW), `verify:package`, 97 public imports, 97 SSR imports and icon boundary. No C3 API or package artifact was changed. These gates must be rerun after an authorized C3 implementation.

## 38. Portfolio

Unchanged: **94 public components, 89 completed, 5 pending, 4 active implementation batches**. MegaMenu remains pending C3; the other pending components are CommandPalette, Kanban, Tree and P3-deferred VirtualList. Do not count C3 as complete from a design review.

## 39. Remaining risks and required resolution

Approve one coherent contract before runtime:

1. **Recommended navigation-first breaking path:** native `<nav>`/links/disclosure buttons; bounded `root → columns → groups → leaves`; local ephemeral open panel; consumer `item.active` is the sole current owner; remove RouterLinkActive visual ownership; panel Tab navigation; explicitly remove/rename the misnamed `activeItemChange`; specify whether command leaves and root link+panel combinations are allowed, rejected or split. Existing APG/recursive consumers migrate to B2 Menu/TieredMenu rather than a compatibility wrapper.
2. **Legacy application-menu path:** preserve recursive `items`, APG roles/roving keys and command semantics, documenting why MegaMenu remains distinct from B2 and revising the navigation-first C3 target. This conflicts with the stated product direction and is not recommended.

The narrow unresolved choices within path 1 are: (a) exact bounded group depth/shape and treatment of deeper legacy input, (b) disposition of `activeItemChange`, (c) root link+panel precedence versus invalid-state diagnostic, and (d) whether command leaves remain valid utility actions. These are public/consumer-facing, not private implementation details.

## 40. Files changed

C3 changes only this report. No MegaMenu runtime/style/spec, B2, contract snapshot, package export, portfolio or Showcase file was edited. The pre-existing foreign TreeTable file remains untouched.

## 41. Git status

After the C2 commit, branch `v2` has a clean tracked tree and empty staging. This report is the sole C3-owned untracked file; `projects/ui-core/tree-table/public_api 2.ts` is separate foreign untracked content. No C3 symlink, temporary hydration directory, push, tag, release, npm publish or commit was made.

## 42. Recommendation

**C3 NEEDS DESIGN REVIEW.** Resolve the four narrow contract choices in section 39 under the navigation-first path (recommended), or explicitly select the legacy application-menu path and revise the C3 target. Do not implement MegaMenu runtime or start C4 until that resolution is frozen.

## 43. Normative resolution

The authorized C3 resolution selected the navigation-first major-version break. MegaMenu is now bounded large-scale navigation, not another recursive APG application menu. The former arbitrary-depth/menubar use cases migrate to certified B2 Menu, TieredMenu, Menubar or MenuButton. The historical blockers in sections 7, 9, 10 and 12 are resolved: bounded root → panel → columns → groups → leaves; local ephemeral panel open; consumer-applied `active` is the only current-navigation source; a root with panel plus navigation/command metadata is invalid and executes only the panel behavior with one development diagnostic; command leaves are valid native buttons.

## 44. Final implementation and public API delta

`NeuMegaMenuItem` is a discriminated, non-recursive root union (`link`, `command`, `panel`). The panel contains `NeuMegaMenuColumn[]`, each column `NeuMegaMenuGroup[]`, each group `NeuMegaMenuLeaf[]`. Leaves are link or command, never both. Required semantic `key: string` remains; duplicate sibling keys and conflicting leaf actions receive deduplicated development diagnostics and fail closed. The root panel+action conflict retains panel-trigger behavior but never executes the extraneous action. No label-derived identity or recursive `items` fallback remains. Public item-template context is visual content only, at levels 0 (root) and 3 (leaf); the component owns the native control. Start/end slots remain.

Officially regenerated declaration inventory: MegaMenu entrypoint **7 → 11 exported symbols** (four bounded structural types added); **11 → 10 inputs** (`tabindex` removed with roving semantics); **3 → 2 outputs** (`activeItemChange` removed); **8 → 1 callable public method** (`close()` retained, template handlers internalized). The three template directives remain. Public writable/derived implementation state is internalized. No compatibility alias, secondary entrypoint, B2 facade dependency or global open-state owner was added.

Migration map: recursive `items` / deep command submenus → B2 Menu or TieredMenu; APG menubar behavior → B2 Menubar/MenuButton as applicable; `activeItemChange` → no replacement (panel open is local UI state); RouterLinkActive styling → consumer `item.active`; root link+panel → split into a direct destination and a panel trigger; old item templates must render non-interactive visual content inside the component-owned anchor/button.

## 45. Semantics, lifecycle and resources

Root destinations and panel leaves are native anchors, command actions are native buttons, and disabled destinations are non-interactive spans. The final structure uses `<nav>`, lists, sections and headings, plus a labelled panel region; it has no ordinary `menubar`, `menu` or `menuitem` roles. `aria-current` derives only from consumer-applied `active`; open, focus and hover remain separate. RouterLink is navigation-only; RouterLinkActive and Router subscriptions are absent. Native Tab/Shift+Tab traverses links/buttons, with the trigger-to-floating-panel boundary handled deterministically; Escape restores the owning trigger. Pointer opening does not steal focus. Hover switches only an already-open desktop panel. RTL changes logical placement, not item order.

Desktop uses one CDK connected-overlay session anchored to the active trigger; closed panels are not mounted. Mobile uses the same bounded panel template inline behind the explicit nav toggle. Breakpoint transitions preserve the still-valid local open key and remount just one presentation, without emitting current/open proposals. A real Chromium check revealed that CDK `overlayOutsideClick` did not close a physical outside pointer in this configuration. The final single dismissal path is **one conditional document pointer listener only while the desktop overlay is attached**; it ignores the host/panel and is removed on detach/destroy. There is no always-on document listener, per-item global resource, timer, observer, subscription or product state-sync effect; ordinary click bindings remain on rendered native actions. The existing responsive primitive retains its browser-only query effect/shared matchMedia resource.

## 46. Certification

Directed C3: **12/12 PASS**, including compile-only rejection of recursive roots, panel+destination and command+destination; B2 regression: **46/46 PASS**. Legacy 8-test file was replaced with 12 navigation-first tests, deleting APG roving/typeahead/depth-5000 assertions and retaining valid command/template/responsive behaviors. Full library suite with explicit `--no-coverage`: **183/183 files, 2,501/2,501 tests PASS** (baseline C2: 183 files / 2,497 tests; net +4 C3 tests). A first generic `npm test` invocation also passed every test but exited nonzero because it enabled the pre-existing global coverage threshold of 95.01%; no threshold was modified, and the required no-coverage rerun passed.

Angular 22.1.6 zoneless real consumer: SSR and Chromium hydration **PASS**, SSR DOM reused, 0 NG050x, no initial outputs/panels, one command callback and one `itemClick`, native Tab, Escape/outside dismissal, hover switch, consumer current write, mobile inline panel, breakpoint remount and RTL vertical placement. No SSR overlay/browser API evaluation was observed. The final representative browser run (8 roots, 4 groups/panel, 64 leaves across the model; 24 open/close samples including one animation frame) measured **p50 16.6 ms / p95 17.4 ms**, with at most one mounted panel. These are fixture observations, not a browser throughput claim. The directed test also completes 50 create/destroy cycles.

Pre-C3 bundle basic: **58,320 B raw / 10,149 B gzip / 8,755 B Brotli**; with directives **58,328 / 10,153 / 8,746**. Final basic: **48,449 / 8,676 / 7,523**; representative rich-data consumer **48,636 / 8,767 / 7,602**; with directives **48,458 / 8,683 / 7,529**. The rich-data delta includes its static consumer fixture, not another runtime feature chunk. Root-unused remains **0 B raw** and the metafile retains **zero B2 facade inputs**. The CDK boundary is present, but removal of recursive/APG machinery offsets its cost.

Production build, public-contract regeneration/audit/tests, package audit (publint/ATTW), package verification, 97 public imports, 97 SSR imports and neural-icons boundary passed. Portfolio generated from the final contract: **94 public components, 90 completed, 4 pending, 3 active implementation batches**. Pending: CommandPalette C4, Kanban C5, Tree C6 and VirtualList P3 deferred. No C4 runtime was started.

## 47. Final recommendation and Git hygiene

**C3 COMPLETE — READY FOR C4.** The major-breaking navigation contract is implemented and certified. Remaining consumer obligation: visual item templates must not nest anchors/buttons inside the component-owned native anchor/button. The C3 changes remain uncommitted for review; no push, tag, release or npm publish was made. The foreign untracked `projects/ui-core/tree-table/public_api 2.ts` was not modified, staged, renamed or removed. No symlink or temporary hydration directory is part of C3.
