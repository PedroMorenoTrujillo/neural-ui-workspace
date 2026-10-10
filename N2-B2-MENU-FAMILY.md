# N2-B2 — Neural 2 Menu family

## 1. Status and 2. starting checkpoint

**B2 COMPLETE — READY FOR NEXT MEDIUM BATCH.** A2/A4 was closed first at `3fb6ffab128a776a52e4e00b6a64a78c71a3f106` (`feat(core): complete A2 and A4 quick-win wave`). An initial B2 design review STOP was correct: the old TieredMenu was an inline NeuMenu wrapper. The subsequent normative resolution authorized an inline TieredMenu root with initially closed, floating nested submenus. B2 has no commit; the working tree is left for review.

## 3. Family inventory and 4. design classification

| Facade | Applied/open owner | Focus owner | Result |
| --- | --- | --- | --- |
| NeuMenu | Parent `expandedKeys` when supplied; otherwise its existing inline collapsed-key session | One vertical `NeuRovingMenuController` per rendered level | Focused refactor; inline recursion retained |
| NeuMenuButton | Local trigger/popup `open` session | NeuMenu controller inside CDK popup | Focused refactor; A1 Button and CDK retained |
| NeuMenubar | Each MenuButton owns its popup; Menubar coordinates one open root popup | Shared horizontal roving controller | Deep interaction refactor without replacing the controller |
| NeuTieredMenu | Parent-applied `expandedKeys` with proposals, or local ephemeral path when absent | One roving controller per visible menu level | Clean private renderer rewrite; no NeuMenu facade composition |

The item key remains the semantic identity. Router metadata (`routerLink`, `url`) is not made into Router state or a navigation side effect. There are no checkbox/radio menu-item variants in the frozen contract.

## 5. Menu final architecture

NeuMenu remains the vertical, native-button, inline-nested menu. Controlled `expandedKeys` never mutates on a gesture; uncontrolled inline branches retain their established default-open behavior. Item reconciliation is cached by immutable `items` array identity, avoiding remapping all items once per rendered button. The two factually redundant `children ?? []` expressions were removed; no item behavior changed.

## 6. MenuButton

The A1 native Button remains the trigger and CDK remains the sole popup boundary. `open` is local lifecycle state, not a new public input. Trigger `aria-controls` now targets a deterministic panel ID from the existing `NeuIdGenerator`. Attach/close focus microtasks check destruction and current open state before acting. Escape/backdrop still pass through the existing dismissal guard; `openChange` reports lifecycle once.

## 7. Menubar

The horizontal roving controller remains. Left/Right use the current computed direction; Home/End and disabled skipping remain. When one root popup is open, hover on another branch switches it immediately. Click/keyboard opening of another branch also closes the previous popup through `openChange` coordination. No new public open owner or second item state engine was introduced.

## 8. TieredMenu and 9. ownership

The root is inline; each child level is a private `neu-tiered-level` attached to its parent button through `CdkConnectedOverlay`. No root popup, wrapper around NeuMenu, public entrypoint, timer or per-item controller was added. With no `expandedKeys` input, local ephemeral expansion starts at `[]` and gestures emit `expandedKeysChange`. With the input supplied, it is the sole applied owner; all gestures emit proposals and rejected proposals leave overlays and ARIA unchanged. Opening a branch proposes its ancestor path and closes siblings; a wider parent-applied set is rendered without normalization. Closing a branch preserves unrelated controlled branches. Outside pointer proposes `[]`; leaf activation invokes its command and `itemClick` once, then proposes/closes the path. A destroyed instance has no late focus side effect.

This intentionally changes uncontrolled TieredMenu behavior from inline/default-expanded children to initially closed floating submenus. It is a Neural 2 breaking behavior, not a legacy compatibility mode.

## 10. Public API

No inputs, outputs, methods, models, directives or entrypoints were added or removed across the four public facades. TieredMenu still exposes `items`, `ariaLabel`, `expandedKeys`, `expandedKeysChange`, `itemClick`. A private renderer and private state helpers are not exported by `@neural-ui/core/menu`. The official contract generator updated only TieredMenu's Angular `ɵcmp` signature for its private content query/projection; the public input/output binding set stayed identical. `audit:contracts` and `test:contracts` pass.

## 11. Focus model and 12. keyboard matrix

Every active vertical context owns one roving controller, not one per item. MenuButton transfers focus to the first/last enabled popup item and returns it to the trigger on close. Tiered keyboard opening focuses the first enabled child after CDK attach; closing a child focuses its parent trigger. An unaccepted controlled open cannot steal focus into an unmounted submenu.

| Context | ArrowUp/Down | Left/Right | Home/End | Enter/Space | Escape |
| --- | --- | --- | --- | --- | --- |
| Menu | Previous/next enabled | Directional inline child open/close | First/last | Leaf once, branch toggle | No root popup to close |
| MenuButton popup | Previous/next enabled | Inline child behavior | First/last | Leaf once, branch toggle | Close popup/return trigger |
| Menubar root | Popup trigger handles Down/Up | Previous/next root, RTL-aware | First/last root | Open/activate | Open popup closes |
| Tiered level | Previous/next enabled | Toward submenu opens/focuses child; toward parent closes/focuses trigger | First/last | Leaf once; branch toggle | Close deepest floating level, root stays |

Typeahead remains in the shared roving controller. Disabled, hidden and separator items are skipped.

## 13. RTL, 14. pointer/hover and 15. overlay lifecycle

Tiered arrow mapping and CDK connected positions reverse for RTL. The floating panel explicitly receives RTL direction because it lives under the global overlay container rather than the root DOM. The Chromium fixture verifies the physical left-side placement when space is available. CSS uses logical spacing; the directional chevron flips. Hover opens immediately with no timer; pointer movement from trigger into its portal does not close the path. One Angular-managed document pointer listener per TieredMenu instance distinguishes the inline root and its CDK panels by a deterministic owner ID. It proposes outside close but cannot physically hide a rejected controlled overlay. CDK disposes nested panels on close/destroy; the 20-cycle unit fixture leaves zero panels.

## 16. Command semantics, 17. icons and 18. a11y

A branch never invokes a leaf command. A leaf executes its command once, emits `itemClick` once and closes/proposes the Tiered path. Keyboard activation prevents native duplicate click. Static/dynamic item icons retain the neural-icons boundary and typed `NeuralIconName`; no `@ng-icons`, root icon catalog or Router subscription was added. Menus use `role=menu`, menubar uses `role=menubar`, buttons use `role=menuitem`, separators retain `role=separator`. Branches expose `aria-haspopup=menu`, applied `aria-expanded` and deterministic `aria-controls`; leaves do not claim expansion. Disabled state is native. Projected item content remains under the semantic button.

## 19. Effects and 20. resources

Product effects: Menu 0, MenuButton 0, Menubar 1 existing `afterRenderEffect` for tab/role reconciliation, TieredMenu 0. Tiered uses one `afterNextRender` hydration boundary, not an effect or applied-state mirror. No timers, observers, Router subscriptions or per-item global listeners were introduced. MenuButton uses guarded, bounded focus microtasks. Each Tiered level has one private roving controller; only mounted levels have a CDK overlay and controller. The Angular-managed document listener is one per Tiered root and is removed with the component.

## 21. SSR, 22. hydration and 23. zoneless

The Angular 22 real consumer renders Menu, MenuButton, Menubar, TieredMenu, disabled/icon items, controlled preapplied Tiered expansion and RTL. It uses `provideZonelessChangeDetection()` and no Zone.js. Chromium confirms SSR root DOM reuse, stable `aria-controls`, 0 NG050x, no initial outputs, first hover/keyboard open, nested Escape, controlled outside rejection, exact-once leaf action and RTL placement. A real hydration bug was found: a preapplied CDK submenu could attach before root hydration. Overlay attachment is now deferred until `afterNextRender` while applied ARIA state remains deterministic; no hydration skip or post-render semantic patch was used. The temporary consumer directory is removed in `finally`.

## 24. NG8102 and 25. performance

The two pre-existing Menu NG8102 warnings were removed by using the narrowed `children` value within the existing truthy child guard. No new compiler warning remains. Menu/level roving item descriptors are recomputed only when the immutable `items` array identity changes. Tiered open proposal is O(depth); branch close and deepest-branch lookup are bounded iterative traversals, avoiding recursive stack growth. The directed 20-cycle open/close/destroy fixture passed; its jsdom runtime is not a browser performance claim. No benchmark threshold or global coverage policy was changed.

## 26. Bundle

The reproducible esbuild audit externalizes Angular, CDK and RxJS, then reports raw/gzip/Brotli bytes from the built public Menu FESM. Angular's compiled references currently retain the four facades together, so per-facade values are nearly equal; these are not independent additive costs.

| Consumer | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| Menu basic | 85,292 | 12,345 | 10,564 |
| MenuButton | 85,292 | 12,345 | 10,557 |
| Menubar | 85,292 | 12,344 | 10,554 |
| TieredMenu | 85,292 | 12,344 | 10,558 |
| Combined B2 | 85,301 | 12,353 | 10,562 |
| Root unused | 0 | 20 (empty gzip envelope) | 1 (empty Brotli envelope) |

The preliminary pre-B2 FESM context was about 56,079 raw / 8,468 gzip / 7,315 Brotli. The ~3.9 KB gzip increase is primarily the private tiered level renderer, controlled path logic and CDK overlay bindings; CDK itself is external in this audit. There is no full icon catalog. Root-unused remains **0 B raw**.

## 27. Directed tests and 28. full suite

`test:n2-b2`: **3 files, 46/46 PASS** covering the four facades, pure path helpers, controlled rejection, keyboard/RTL, hover, outside close, a11y IDs, exactly-once actions and 20 overlay lifecycles. Final full library suite: **182/182 files, 2,445/2,445 tests PASS** with no global coverage run.

## 29. Package/contracts and 30. portfolio

Production build, `audit:contracts`, `test:contracts`, `audit:package` (including the routine publint/ATTW matrix), `verify:package` (435 files), 98 entrypoint import smoke, and `audit:n2-icons-boundary` PASS. The portfolio generator and drift check PASS: **95 public components, 69 completed, 26 pending, 0 remove, 11 implementation batches**. B2 is marked complete; C3 MegaMenu and all other batches remain separate.

## 31. Remaining risks

The current compiled Menu FESM keeps all four facades reachable for an individual facade consumer; there is no public API split planned in B2. Menubar retains its existing post-render tab-index reconciliation because MenuButton's public trigger contract has no tab-index input. `routerLink`/`url` remain item metadata, not automatic Router navigation. No checkbox/radio item semantics were introduced. These are explicit boundaries, not failing B2 gates.

## 32. Files changed and 33. Git status

B2 owns `projects/ui-core/menu/neu-menu.component.ts`, `.scss`, `.spec.ts`, new private level/state modules and Tiered spec; the `test:n2-b2`, hydration and bundle scripts; the generated public contract snapshot; the portfolio generator/output; and this report. `git diff --check` PASS; no symlinks or temporary hydration directories. Branch `v2`; B2 remains uncommitted as requested. The pre-existing foreign untracked `projects/ui-core/tree-table/public_api 2.ts` remains untouched and unstaged (SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`). No push, tag, release or npm publish.

## 34. Recommendation

**B2 COMPLETE — READY FOR NEXT MEDIUM BATCH.** Do not start another batch from this task. Review and authorize a local B2 commit separately if desired.
