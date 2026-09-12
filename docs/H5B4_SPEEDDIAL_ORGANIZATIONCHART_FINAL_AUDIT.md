# H5-B4 SpeedDial + OrganizationChart final audit

## Sources and baselines

- Workspace: `90412a475bf563fba11b179e32de9f0e8e0c7001`
- Showcase: `914ffbb2c774e4337c932255c2b6a6243f79d00b`
- Root integration (report only): `122525ca524ab6a320a917e6306d2f34e2a7cef7`
- Historical Neural v1.12.1: `4985b558b915f5208c69f9ef49db45528fa479a6`
- Reference floor: the published declarations/Angular metadata/implementation and the official SpeedDial and OrganizationChart documentation.

Neither component existed at the historical Neural baseline. Their starting public APIs are therefore `REFERENCE-PARITY-INTRODUCED`; no parity-era spelling receives compatibility protection.

## Mechanical surface recount

| Component | Surface | Reference 22.1 | Starting Neural | Final Neural |
| --- | ---: | ---: | ---: | ---: |
| SpeedDial | main-tag inputs excluding models | 22 | 14 | 15 |
| SpeedDial | explicit outputs | 4 | 5 | 5 |
| SpeedDial | models | 1 | 1 | 0 |
| SpeedDial | supported consumer methods | 0 | 0 (9 unclassified callables) | 3 |
| SpeedDial | template/composition regions | 3 | 2 | 2 |
| SpeedDial | entrypoint exports | n/a | 8 | 13 |
| OrganizationChart | main-tag inputs excluding models | 5 | 9 | 11 |
| OrganizationChart | explicit outputs | 4 | 5 | 4 |
| OrganizationChart | models | 2 | 2 | 2 |
| OrganizationChart | supported consumer methods | 0 | 0 (10 unclassified callables) | 2 |
| OrganizationChart | template/composition regions | 4 | 2 | 4 |
| OrganizationChart | entrypoint exports | n/a | 9 | 13 |

Reference SpeedDial effective inputs are `id`, `style`, `className`, `model`, `visible`, `direction`, `transitionDelay`, `type`, `radius`, `mask`, `disabled`, `hideOnClickOutside`, `buttonStyle`, `buttonClassName`, `maskStyle`, `maskClassName`, `showIcon`, `hideIcon`, `rotateAnimation`, `ariaLabel`, `ariaLabelledBy`, `tooltipOptions`, and `buttonProps`. Its outputs are `visibleChange`, `onClick`, `onShow`, and `onHide`; `visible` is a model. Its template regions are `button`, `item`, and `icon`. Reference's declared `show`/`hide` are implementation helpers rather than documented/supported consumer methods.

Reference OrganizationChart effective inputs are `value`, `selectionMode`, `collapsible`, `selectable`, and `gap`; `selectionKeys` and `collapsedKeys` are models. Its outputs are `onNodeSelect`, `onNodeUnselect`, `onNodeExpand`, and `onNodeCollapse`. Its template regions are `node`, `togglericon`, `checkboxicon`, and `collapsebutton`. It exposes no supported consumer method. Exact 22.1 package inspection found no `preserveSpace` binding or implementation.

## SpeedDial functional gap ledger

| Capability | Starting state | Final resolution | Status |
| --- | --- | --- | --- |
| Canonical controlled visibility | `visible` model plus `onVisibleChange` | one nullable controlled `open` input and one `openChange` proposal; lifecycle fires only on committed state | CLOSED |
| Programmatic visibility | parity `show`/`hide` implementation methods leaked | supported `open`, `close`, `toggle`; all helpers protected/private | CLOSED |
| Event atomicity | duplicate model/output mirrors and Reference-shaped lifecycle names | one proposal plus distinct `opened`, `closed`, `triggerClick`, `itemActivate` details | CLOSED |
| Keyboard and focus | native Enter/Space could double-toggle; boundary focus incomplete; mixed link/button query order unsafe | native click owns Enter/Space; arrows/Home/End/typeahead skip disabled; Escape/item restore trigger; mixed action kinds use explicit DOM index | CLOSED |
| Outside/mask/disabled | close existed but focus/state semantics were not canonical | outside does not steal focus; mask closes; disabling closes; controlled owner must echo proposals | CLOSED |
| Tooltip | item type could carry text but no coherent global integration | `tooltip` config enables label tooltips/position; per-item tooltip wins | CLOSED |
| Trigger/button customization | icon micro-inputs only | arbitrary trigger template; direct native ARIA/tabindex/disabled; style remains normal CSS | CLOSED |
| Item customization | item template existed with weak context | arbitrary typed item content with item/index/active/disabled/open | CLOSED |
| Animation | separate transition and rotate micro-inputs | coherent `animation` config (`itemDelay`, `rotateTrigger`) | CLOSED |
| Directionality | forced public `textDirection` | inferred from computed document direction; logical layout retained | CLOSED |
| Reference button/style props | object/style micro-surface | ordinary CSS plus trigger template; no lost behavior | CLOSED |
| Reference icon region | dedicated region | richer trigger and item templates cover open/close icon and item content | CLOSED |

`SPEEDDIAL GAP COUNT = 0`.

## Complete starting SpeedDial input ledger

Flags use `S` superset, `D` duplicate, `M` micro-configuration, `L` implementation leakage. “Owner” states the better owner when applicable. Frequency is a product judgment from normal consumer use.

| Input / type | Provenance | Domain, purpose, frequency | Reference equivalent / owner | Flags | Action | Justification |
| --- | --- | --- | --- | --- | --- | --- |
| `ariaLabel: string` | REFERENCE-PARITY-INTRODUCED | accessibility; trigger name; common | `ariaLabel`, main tag | none | KEEP-DIRECT | First-class native accessibility semantic. |
| `direction: NeuSpeedDialDirection` | REFERENCE-PARITY-INTRODUCED | layout; expansion direction; common | `direction`, main tag | S (8 directions) | KEEP-NEURAL-SUPERSET | Valuable diagonal direction superset. |
| `disabled: boolean` | REFERENCE-PARITY-INTRODUCED | state/accessibility; global gate; common | `disabled`, main tag | none | KEEP-DIRECT | Native interaction state. |
| `hideIcon: string \| null` | REFERENCE-PARITY-INTRODUCED | visual; closed/open icon; occasional | `hideIcon`, main tag | M; owner trigger template | MOVE-TO-TEMPLATE | Arbitrary trigger content is more capable and avoids icon-detail inputs. |
| `hideOnClickOutside: boolean` | REFERENCE-PARITY-INTRODUCED | interaction; outside-close policy; occasional | same, main tag | none | KEEP-DIRECT | Genuine behavior policy. |
| `id: string` | REFERENCE-PARITY-INTRODUCED | identity/ARIA; stable menu id; occasional | `id`, main tag | none | KEEP-DIRECT | Required for deterministic relationships/testing. |
| `items: NeuSpeedDialItem[]` | REFERENCE-PARITY-INTRODUCED | data; action model; common | `model`, main tag | none | KEEP-DIRECT | Primary simple API. |
| `mask: boolean` | REFERENCE-PARITY-INTRODUCED | overlay; modal-like backdrop; occasional | `mask`, main tag | none | KEEP-DIRECT | Functional interaction/layout mode. |
| `radius: number` | REFERENCE-PARITY-INTRODUCED | layout; radial distance; occasional | `radius`, main tag | none | KEEP-DIRECT | Core radial geometry, not cosmetic detail. |
| `rotateAnimation: boolean` | REFERENCE-PARITY-INTRODUCED | motion; trigger rotation; occasional | same, main tag | M; owner animation config | MOVE-TO-CONFIG | Belongs with motion policy. |
| `showIcon: string` | REFERENCE-PARITY-INTRODUCED | visual; trigger icon; common | `showIcon`, main tag | M; owner trigger template | MOVE-TO-TEMPLATE | Arbitrary content covers icons and richer states. |
| `textDirection: NeuTextDirection` | REFERENCE-PARITY-INTRODUCED | directionality implementation hint; rare | no direct Reference owner | L; owner document/host direction | INTERNALIZE | Direction is already available from computed CSS. |
| `transitionDelay: number` | REFERENCE-PARITY-INTRODUCED | motion; item staggering; occasional | same, main tag | M; owner animation config | MOVE-TO-CONFIG | Coherent advanced motion configuration. |
| `type: NeuSpeedDialType` | REFERENCE-PARITY-INTRODUCED | layout; linear/radial geometry; common | `type`, main tag | none | KEEP-DIRECT | Core behavior/layout mode. |

Unexplained inputs: 0. Review inputs: 0.

## Final SpeedDial inputs

| Input / type | Domain | Reference main-tag equivalent | Why direct |
| --- | --- | --- | --- |
| `id: string` | identity | `id` | deterministic identity/ARIA |
| `items: readonly NeuSpeedDialItem[]` | data/actions | `model` | primary simple API |
| `open: boolean \| null` | controlled state | `visible` model | canonical Neural ownership; null enables uncontrolled use |
| `direction: NeuSpeedDialDirection` | layout | `direction` | principal expansion axis, with Neural diagonal superset |
| `type: NeuSpeedDialType` | layout | `type` | principal geometry |
| `radius: number` | layout | `radius` | required radial geometry |
| `mask: boolean` | overlay behavior | `mask` | functional backdrop mode |
| `disabled: boolean` | state/accessibility | `disabled` | native global gate |
| `hideOnClickOutside: boolean` | interaction | same | functional dismissal policy |
| `animation: Readonly<NeuSpeedDialAnimationConfig>` | advanced motion | `transitionDelay` + `rotateAnimation` | one coherent advanced owner |
| `tooltip: Readonly<NeuSpeedDialTooltipConfig> \| null` | assistance | `tooltipOptions` | coherent opt-in label tooltip policy |
| `ariaLabel: string \| null` | accessibility | `ariaLabel` | first-class trigger name |
| `ariaLabelledBy: string \| null` | accessibility | `ariaLabelledBy` | native accessible-name relationship |
| `ariaDescribedBy: string \| null` | accessibility | via `buttonProps` | native description relationship |
| `tabindex: number` | accessibility/focus | via `buttonProps` | native focus order |

## SpeedDial output and method ledgers

| Starting output | Class | Action | Final owner |
| --- | --- | --- | --- |
| generated `visibleChange` | controlled state | REMOVE-DUPLICATE/rename | `openChange: boolean` |
| `onVisibleChange` | duplicate state mirror | REMOVE-DUPLICATE | `openChange` only |
| `onShow` | lifecycle | MERGE/rename | `opened: NeuSpeedDialVisibilityEvent` |
| `onHide` | lifecycle | MERGE/rename | `closed: NeuSpeedDialVisibilityEvent` |
| `onTriggerClick` | interaction detail | MERGE/rename | `triggerClick: MouseEvent` |
| `itemClick` | item detail | MERGE/rename and strengthen | `itemActivate: NeuSpeedDialItemEvent` |

Final explicit outputs: `openChange`, `opened`, `closed`, `triggerClick`, `itemActivate`. Duplicate owners: 0. Review outputs: 0.

Supported method allowlist: `open(): void`, `close(): void`, `toggle(): void`. Starting `show`/`hide` and all action/focus/template/layout handlers are implementation helpers and are now protected/private; no duplicate imperative path remains.

## SpeedDial composition and context

| Reference region | Neural selector | Coverage |
| --- | --- | --- |
| `button` | `neuSpeedDialTrigger` | arbitrary Angular trigger/open-close content |
| `item` + `icon` | `neuSpeedDialItem` | arbitrary item content including icon, badge, pipes, components, directives and events |

The mask remains structural behavior and normal CSS styling; a public mask template was not required for functional parity. Item tooltips have a coherent config plus per-item text; unusual tooltip content/events remain possible inside arbitrary item templates.

`NeuSpeedDialTriggerTemplateContext` (`$implicit`, `open`) is SUFFICIENT. `NeuSpeedDialItemTemplateContext` (`$implicit` item, `index`, `active`, `disabled`, `open`) is SUFFICIENT. Both have strict context guards, contain no `any` or controller, and preserve ordinary Angular content freedom.

## SpeedDial visual debt (H8 report only)

Classification: **POOR**. The component is functionally sound but still reads as a basic prototype: hard-coded fallback colors and pill geometry, weak hierarchy between FAB/items, generic shadow/radius, abrupt/simple easing, minimal pressed feedback, no deliberate dark/light tuning, and limited mask/product polish. Functional focus styling and responsive overflow are present; no subjective redesign was performed.

H8 recommendations: establish tokenized FAB/item sizes and icon scale; tune radial/linear spacing; introduce intentional enter/exit easing and stagger; align radius/shadow with product elevation; add distinct hover/focus/pressed/disabled states; refine mask opacity/blur and stacking; validate dark/light contrast; tune small-screen edge placement; and add visual regression states for every layout/direction.

## OrganizationChart functional gap ledger

| Capability | Starting state | Final resolution | Status |
| --- | --- | --- | --- |
| Tree value/model | multiple `nodes` roots supported | preserved as valuable Neural superset; empty state retained | CLOSED |
| Selection ownership | `selectable` and `selectionMode` looked overlapping | retained: global/per-node gate versus selection policy; `selectionKeys` is sole controlled owner | CLOSED |
| Collapse ownership | `collapsedKeys` controlled state | retained without semantic inversion; `expanded === false` seeds uncontrolled collapse | CLOSED |
| Node style/class | node type lacked exact Reference style/class capability | typed `style` and canonical `className` added to node model | CLOSED |
| Templates | node/toggle only | node, toggle, toggle-icon and selection-indicator arbitrary typed regions | CLOSED |
| Arbitrary node content | content nested in an interactive button | treeitem owns keyboard/ARIA; content container safely permits buttons/forms; explicit context action remains available | CLOSED |
| Accessibility | incomplete treeitem state/keyboard | tree/treeitem roles, roving focus, selected/checked/expanded, labels, disabled/non-selectable behavior, arrows/Home/End/Enter/Space | CLOSED |
| Event atomicity | `nodeActivate` duplicated interaction detail | removed; model state mutates before one semantic detail/lifecycle output | CLOSED |
| Layout/connectors | multiple roots/connectors/gap existed | retained, logical CSS and responsive viewport verified | CLOSED |
| `preserveSpace` | presumed from docs/history | absent from exact Reference 22.1 package; no floor capability exists | CLOSED |

`ORGANIZATIONCHART GAP COUNT = 0`.

## Complete starting OrganizationChart input ledger

| Input / type | Provenance | Domain, purpose, frequency | Reference equivalent / owner | Flags | Action | Justification |
| --- | --- | --- | --- | --- | --- | --- |
| `ariaLabel: string` | REFERENCE-PARITY-INTRODUCED | accessibility; tree name; common | no direct main-tag input in exact Reference | S | KEEP-NEURAL-SUPERSET | First-class accessible name. |
| `collapseLabel: string` | REFERENCE-PARITY-INTRODUCED | accessibility/i18n; toggle name; common | internal Reference locale text | S | KEEP-NEURAL-SUPERSET | Consumer/localization-facing native semantics. |
| `collapsible: boolean` | REFERENCE-PARITY-INTRODUCED | behavior; collapse gate; common | same, main tag | none | KEEP-DIRECT | Principal chart behavior. |
| `emptyLabel: string` | REFERENCE-PARITY-INTRODUCED | empty state/a11y; occasional | no direct equivalent | S | KEEP-NEURAL-SUPERSET | Useful localized empty state. |
| `expandLabel: string` | REFERENCE-PARITY-INTRODUCED | accessibility/i18n; toggle name; common | internal Reference locale text | S | KEEP-NEURAL-SUPERSET | Consumer/localization-facing native semantics. |
| `gap: NeuOrganizationChartGap` | REFERENCE-PARITY-INTRODUCED | layout; connector spacing; occasional | `gap`, main tag | S (number or axes) | KEEP-NEURAL-SUPERSET | Coherent layout primitive. |
| `nodes: readonly NeuOrganizationChartNode<T>[]` | REFERENCE-PARITY-INTRODUCED | data/tree; common | `value`, main tag | S (multiple roots) | KEEP-NEURAL-SUPERSET | Primary API and valuable forest support. |
| `selectable: boolean` | REFERENCE-PARITY-INTRODUCED | selection gate; common | `selectable`, main tag | not duplicate | KEEP-DIRECT | Distinct global gate; per-node override remains. |
| `selectionMode: single \| multiple \| null` | REFERENCE-PARITY-INTRODUCED | selection policy; common | same, main tag | S (multiple) | KEEP-NEURAL-SUPERSET | Distinct cardinality/selection policy. |

Unexplained inputs: 0. Review inputs: 0.

## Final OrganizationChart inputs

| Input / type | Domain | Reference equivalent | Why direct |
| --- | --- | --- | --- |
| `nodes: readonly NeuOrganizationChartNode<T>[]` | data | `value` | primary tree/forest API |
| `selectionMode: NeuOrganizationChartSelectionMode \| null` | selection policy | same | principal behavior |
| `selectable: boolean` | selection gate | same | distinct global gate |
| `collapsible: boolean` | collapse behavior | same | principal behavior |
| `gap: NeuOrganizationChartGap` | layout | `gap` | connector/node geometry |
| `ariaLabel: string \| null` | accessibility | none direct | tree accessible name |
| `ariaLabelledBy: string \| null` | accessibility | none direct | native name relationship |
| `ariaDescribedBy: string \| null` | accessibility | none direct | native description relationship |
| `emptyLabel: string` | empty state/i18n | none direct | useful localized state |
| `expandLabel: string` | accessibility/i18n | Reference locale/internal | native toggle label |
| `collapseLabel: string` | accessibility/i18n | Reference locale/internal | native toggle label |

Models remain `selectionKeys: readonly string[] | undefined` and `collapsedKeys: readonly string[] | undefined`.

## OrganizationChart output and method ledgers

| Starting output | Class | Action | Final owner |
| --- | --- | --- | --- |
| generated `selectionKeysChange` | controlled selection proposal | KEEP | model output |
| generated `collapsedKeysChange` | controlled collapse proposal | KEEP | model output |
| `nodeSelect` | selection detail | KEEP | same |
| `nodeUnselect` | selection detail | KEEP | same |
| `nodeExpand` | expand lifecycle/detail | KEEP | same |
| `nodeCollapse` | collapse lifecycle/detail | KEEP | same |
| `nodeActivate` | duplicate interaction mirror | REMOVE-DUPLICATE | selection/toggle semantics only |

Final explicit outputs: `nodeSelect`, `nodeUnselect`, `nodeExpand`, `nodeCollapse`; model outputs remain the only controlled proposals. Duplicate owners: 0. Review outputs: 0.

Supported method allowlist: `activateNode(node, originalEvent?)` and `toggleNode(node, originalEvent?)`. They provide useful programmatic equivalents of consumer actions. All layout, traversal, template-context, keyboard and ARIA helpers are protected/private.

## OrganizationChart composition, selection and collapse decisions

| Reference region | Neural selector | Coverage |
| --- | --- | --- |
| `node` | `neuOrganizationChartNode` | arbitrary typed node content |
| `collapsebutton` | `neuOrganizationChartToggle` | arbitrary full toggle content |
| `togglericon` | `neuOrganizationChartToggleIcon` | arbitrary icon-only customization |
| `checkboxicon` | `neuOrganizationChartSelectionIndicator` | selected/partial indicator customization |

Node context exposes node, data, index, level, path, parent, leaf, selectable, selected, partial, collapsible, collapsed, expanded, `toggle`, and `select`: SUFFICIENT. Toggle context exposes node, expanded, collapsed, childCount, and `toggle`: SUFFICIENT. Toggle-icon context exposes node/expanded/collapsed: SUFFICIENT. Selection-indicator context exposes node/selected/partial: SUFFICIENT. Guards are strict and contexts contain no `any` or internal controller.

Selection result: `selectable` is a global gate with a per-node override; `selectionMode` chooses no/single/multiple policy; `selectionKeys` owns controlled selection. They are not duplicates.

Collapse result: keep `collapsedKeys`. Exact Reference uses the same negative-semantics model, the starting unpublished API already implements it, and inversion to `expandedKeys` would change defaults and controlled semantics. This task does not start a cross-tree v2 redesign.

## Public types

SpeedDial final exports are the component plus `NeuSpeedDialAnimationConfig`, `NeuSpeedDialDirection`, `NeuSpeedDialItem`, `NeuSpeedDialItemDirective`, `NeuSpeedDialItemEvent`, `NeuSpeedDialItemTemplateContext`, `NeuSpeedDialTooltipConfig`, `NeuSpeedDialTriggerDirective`, `NeuSpeedDialTriggerTemplateContext`, `NeuSpeedDialType`, `NeuSpeedDialVisibilityEvent`, and `NeuSpeedDialVisibilityReason` (13 total). Reference-shaped duplicate visibility/item DTOs were replaced by semantic event types; layout helpers remain internal.

OrganizationChart final exports are the component plus `NeuOrganizationChartGap`, `NeuOrganizationChartNode`, `NeuOrganizationChartNodeDirective`, `NeuOrganizationChartNodeEvent`, `NeuOrganizationChartNodeTemplateContext`, `NeuOrganizationChartSelectionIndicatorDirective`, `NeuOrganizationChartSelectionIndicatorTemplateContext`, `NeuOrganizationChartSelectionMode`, `NeuOrganizationChartToggleDirective`, `NeuOrganizationChartToggleIconDirective`, `NeuOrganizationChartToggleIconTemplateContext`, and `NeuOrganizationChartToggleTemplateContext` (13 total). No controller/traversal/layout helper is exported.

## Final quality and contract result

- SpeedDial API quality: **GOOD**. Functional floor 0 gaps, one state owner, 15 direct inputs, 5 outputs, 0 models, 3 methods, 2 composition selectors.
- OrganizationChart API quality: **EXCELLENT**. Functional floor 0 gaps, distinct selection/collapse owners, 11 direct inputs, 4 outputs, 2 models, 2 methods, 4 composition selectors.
- Starting-to-final direct-input delta: SpeedDial `14 -> 15` (three visual/motion micro-inputs consolidated/templated, one direction leak internalized, native accessibility/state/tooltip capabilities added); OrganizationChart `9 -> 11` (native ARIA relationships added; no existing direct input removed).
- Review inputs/outputs/methods in both audited components: 0.
- Unexplained inputs: 0. Duplicate state/event/imperative owners: 0.
- Binding extraction shortfall: 0 (contract audit passes).

Global contract snapshot: 106 entrypoints; 837 exported declarations; 1,149 inputs; 230 outputs; 2 models; 1,381 bindings; 5,910 public symbols. Status totals: 3,452 SUPPORTED; 1,218 INTERNAL/UNSUPPORTED; 1,236 REVIEW; 2 COMPATIBILITY; 2 DEPRECATED. Remaining global REVIEW/internal work is explicitly outside H5-B4/H5-C.

Protected counts remain: Table `77 / 38 / 0 / 20`; TreeTable `46 / 23 / 0 / 18`; Select 56 inputs; Multiselect 66; Autocomplete 65; Listbox 51. Their functional gap counts remain 0 and no source in those component scopes changed.
