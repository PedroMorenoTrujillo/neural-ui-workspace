# FocusTrap and overlay/menu foundation audit

This audit is tied to Workspace baseline `29708ff064bd980b54900403ddbf2f9d1b2efbce` and the exact published reference package. It is intentionally scoped: it records the next foundation work without redesigning existing public components.

## FocusTrap decision

Neural exposes `NeuFocusTrapDirective` from `@neural-ui/core/focus-trap`. The directive owns only live Tab and Shift+Tab containment. It does not assign a role, label a host, choose initial focus, close on Escape, or restore focus. Those policies remain with the consuming dialog, drawer, menu, or overlay.

The directive queries eligible descendants on every boundary operation. It supports native controls, links, contenteditable regions, and non-negative custom `tabindex` values while excluding disabled, `aria-disabled`, hidden, inert, closed-details, disabled-fieldset, and negative-tabindex descendants. Positive tabindex ordering follows browser sequential-focus ordering before DOM-ordered tabindex zero items.

The reference release also provides a standalone directive and a runtime disabled input. Its current implementation inserts two accessibility-hidden sentinel spans and uses them to redirect focus to the opposite boundary. It does not choose initial focus, restore focus, add roles, or own Escape. Earlier release lines used lifecycle/change-detection-managed sentinels; later lines reorganized lifecycle integration and moved the disabled state to a signal/effect. The useful contract is stable across releases. Neural preserves that contract without persistent sentinels and additionally handles a focused dynamic child being removed.

## Existing overlay inventory

| Family                                               | Surface/positioning                                                            | close ownership                                                      | focus ownership                                            | Decision                                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Dialog (`modal`)                                     | in-tree fixed surface                                                          | backdrop and Escape                                                  | initial focus, restore, and containment                    | Adopt the public FocusTrap; retain dialog policy locally.                                                               |
| Drawer (`sidebar`)                                   | in-tree fixed side surface                                                     | backdrop and Escape                                                  | initial focus, restore, and containment for modal mode     | Adopt the public FocusTrap; retain drawer policy locally.                                                               |
| ConfirmDialog                                        | CDK Dialog global overlay                                                      | CDK Dialog; close is disabled except actions                         | CDK Dialog policy                                          | Leave unchanged. It already delegates the complete modal lifecycle to CDK Dialog.                                       |
| Popover                                              | imperative connected CDK Overlay with reposition scroll strategy and fallbacks | backdrop for click trigger; hover/focus lifecycle for those triggers | trigger semantics; no containment                          | Leave local because trigger-specific close semantics are part of its contract.                                          |
| ConfirmPopup                                         | in-tree non-modal alertdialog                                                  | consumer/service actions                                             | none                                                       | Not an overlay abstraction candidate until anchoring and focus semantics are specified.                                 |
| ContextMenu                                          | imperative global CDK Overlay at pointer coordinates; close-on-scroll          | backdrop, item selection, Escape                                     | first enabled item on open; origin restore                 | Keep global positioning and lifecycle local. Its menu keyboard contract needs separate work.                            |
| Menu button                                          | declarative connected CDK Overlay with transparent backdrop                    | backdrop, detach, item selection                                     | currently none beyond native Tab                           | Do not change in this task.                                                                                             |
| Menubar / TieredMenu                                 | in-tree menu composition; Menubar delegates submenus to Menu button            | item selection / nested menu button                                  | currently native buttons, no shared roving-focus engine    | Do not retrofit until the menu model and keyboard contract are decided together.                                        |
| SplitButton                                          | declarative connected CDK Overlay; reposition, push, viewport margin           | CDK backdrop plus a document-click fallback, detach, Escape          | currently none beyond native Tab                           | The document-click path may be redundant, but removing it is not required for FocusTrap or the next three components.   |
| Select / Multiselect / AutoComplete                  | declarative connected CDK overlays with their own option/listbox state         | backdrop/outside-click and control-specific selection                | option-family active option and combobox semantics         | Protected; audited read-only and unchanged.                                                                             |
| CascadeSelect / TreeSelect / DateInput / ColorPicker | connected overlays with component-specific state and positioning               | component-specific backdrop/outside behavior                         | control-specific                                           | Keep local; no substantially identical public behavior was found that benefits the next batch.                          |
| Tooltip                                              | imperative connected CDK Overlay                                               | hover/focus timers and Escape policy                                 | never contains focus                                       | Keep independent.                                                                                                       |
| NotificationCenter                                   | connected overlay                                                              | component-specific backdrop/detach                                   | component-specific                                         | No extraction justified.                                                                                                |
| ImageViewer                                          | imperative global centered CDK Overlay with blocked scroll                     | backdrop surface and Escape                                          | overlay host initial focus; local keyboard navigation      | A future modal-policy pass may adopt FocusTrap and restore origin, but that is outside this regression-safe extraction. |
| CommandPalette / BottomSheet                         | in-tree modal-like surfaces                                                    | backdrop and Escape                                                  | component-specific; no shared containment before this task | Candidates for a later adoption pass with explicit focus/restoration regression tests.                                  |

CDK Overlay is already the right lower-level primitive for detached positioning, scroll strategies, resize repositioning, and direction-aware connected positions. The audited components do not duplicate a single overlay lifecycle closely enough to justify a new Neural overlay service. Their close and focus policies differ materially.

The only substantially identical duplication was the focusable-descendant query and Tab-boundary code in Dialog and Drawer. That code is now replaced by `NeuFocusTrapDirective`, with their initial-focus, Escape, scroll-lock, and restoration behavior retained.

## Menu foundation findings

There is useful visual composition, but there is not yet a safe universal action model or keyboard engine:

- `NeuMenuItem` has `key`, label, icon, shortcut, disabled/separator state, recursive children, and opaque data. `NeuContextMenuItem` and `NeuSplitButtonAction` repeat only the basic label/icon/disabled/separator shape and use different identifiers and variants.
- Menu, Menubar, and TieredMenu can reuse the recursive renderer and item template concept. ContextMenu and SplitButton use separate templates and output types.
- Commands, URLs, router links, targets, visibility, active-route state, and badges are not represented consistently. Consumers currently own commands through click outputs.
- Menu keyboard behavior is not shared: ContextMenu owns Escape and initial focus; Menu and SplitButton rely primarily on native button Tab order; Menubar has no menubar roving-focus contract. RTL-aware arrow mapping and typeahead are therefore not extractable without first defining new behavior.
- Disabled states and ARIA roles exist, but active-item state, `aria-activedescendant`/roving tabindex, submenu relationships, and focus return differ or are absent.

Do not replace the three existing public item interfaces merely for symmetry. The next batch should first introduce an additive internal action resolver (disabled, command, URL/router link, target, visible, icon, label) and a separately tested roving-menu controller. Existing types can opt into adapters after compatibility tests; no current type needs a breaking rewrite.

## MegaMenu plan

Reuse:

- the label/icon/disabled/children/data subset of `NeuMenuItem`;
- `NeuMenuItemDirective`'s item-template context pattern and existing button/icon styling;
- CDK connected positioning only for detached subpanels if the chosen Neural design detaches them;
- the future action/link resolver and roving-menu controller, not FocusTrap.

Add:

- a top-level model capable of column groups, preferably additive `NeuMegaMenuItem` with `columns: readonly (readonly NeuMenuItem[])[]`, instead of overloading ordinary recursive children;
- horizontal and vertical root layouts, large column panels, active root state, start/end content templates, root/item/submenu icon templates, and mobile menu-button template;
- orientation- and RTL-aware Arrow navigation, Home/End, Enter/Space, Escape return, typeahead, submenu open/close, and deterministic disabled-item skipping;
- a responsive breakpoint mode with a hamburger trigger, controlled panel height/scroll, outside-click handling, resize cleanup, and focus return.

The reference release has horizontal/vertical orientations, a 960px default breakpoint, scroll height, disabled/tabindex inputs, start/end and item/icon/button templates, responsive `matchMedia` behavior, and orientation-dependent composite-menu keyboard handling. Neural should match useful behavior rather than copy vendor internals.

Estimated complexity: **high, 7–10 engineering days** including public API, responsive/RTL behavior, unit tests, Showcase, axe, and three-browser tests. The action/link resolver and roving controller account for roughly two of those days if not completed first.

## SpeedDial plan

Reuse:

- the future action/link resolver, the label/icon/disabled/data subset of menu items, `NeuButtonComponent`, `NeuIconComponent`, and `NeuTooltipDirective`;
- existing overlay/backdrop visual tokens where appropriate;
- FocusTrap only if a masked mode is explicitly specified as modal. An ordinary SpeedDial should use roving action focus, not trap the entire page.

Add:

- controlled/uncontrolled visible state, trigger focus return, outside-click/Escape ownership, optional mask, disabled actions, and action/visible outputs;
- linear up/down/left/right geometry plus circle, semicircle, and quarter-circle layouts, configurable radius and stagger delay, collision/viewport tests, and reduced-motion behavior;
- Arrow/Home/End navigation, Enter/Space activation, Escape close/trigger return, accessible trigger expansion state, labeled action list, and RTL-aware horizontal direction;
- trigger, action, icon, and optional tooltip templates.

The reference release supports linear/circle/semi-circle/quarter-circle modes, eight directions including diagonals, radius, stagger delay, mask, tooltips, visibility state, and a composite keyboard model. These require new geometry and interaction code; no existing Neural overlay component provides it.

Estimated complexity: **medium-high, 5–7 engineering days** including all modes, motion, accessibility, Showcase, and browser coverage.

## Dock plan

Reuse:

- the future action/link resolver, `NeuIconComponent`, and `NeuTooltipDirective`;
- shared roving-menu controller for disabled skipping, Home/End, activation, and orientation-aware arrows;
- existing responsive and logical-CSS conventions. Dock is in-tree and should not use CDK Overlay or FocusTrap.

Add:

- top/bottom/left/right layouts and matching `aria-orientation`;
- command, external URL, router-link, target, active-route, disabled, badge, and tooltip rendering through the action resolver;
- focus/blur outputs, `aria-activedescendant` or roving tabindex, responsive breakpoint handling with SSR-safe `matchMedia` cleanup, item templates, and reduced-motion support;
- pointer-neighbor magnification state and animation. The reference release tracks the hovered item and resets on list mouseleave; the visible scale treatment is style-driven. Neural should implement this as progressive enhancement and remove it under reduced motion/coarse pointer conditions.

Estimated complexity: **medium, 4–6 engineering days** including responsive layouts, route/link behavior, magnification, Showcase, axe, and browser tests.

## Recommended next sequence

1. Specify and test the additive action/link resolver plus the roving-menu controller without changing current public item types.
2. Implement Dock first to validate action links, tooltips, orientation, and roving focus without overlay complexity.
3. Implement SpeedDial to validate geometry, mask, motion, and focus return.
4. Implement MegaMenu last, reusing the proven action/keyboard pieces and adding the largest responsive/submenu surface.

Estimated next Sol batch for all shared foundation plus all three components: **18–25 engineering days**, or approximately three focused implementation streams with MegaMenu kept as the largest final stream.
