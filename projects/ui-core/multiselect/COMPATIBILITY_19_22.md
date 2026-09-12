# NeuMultiselect — external compatibility and no-regression record

Sources: the exact published reference packages across four release lines. The current floor is the reference Select multiple mode; deprecated behavior is retained only where it remains useful for migration or where Neural already provided it.

## Current Reference 22.1 capability closure

| Reference capability | Result | Neural contract/evidence |
| --- | --- | --- |
| Multiple array selection | PARITY | Immutable add/remove/toggle with fresh CVA and public arrays. |
| Reactive/template forms | SUPERSET | CVA, silent writes/reset, cloned programmatic arrays, direct+CVA disabled ownership, touched on exit. |
| Primitive/object/falsy/`NaN` values | PARITY | O1 value resolution and `Object.is` semantics preserve every supported value. |
| Identity/data key replacement | SUPERSET | O1 nested/computed identity and custom comparison reconcile immutable option replacements. |
| Grouped options | SUPERSET | Typed nested/computed or legacy groups, disabled groups, group-aware filter/select-all/keyboard, no group-as-`T`. |
| Filtering | SUPERSET | Controlled/uncontrolled value, nested/computed multi-fields, six modes, locale, reset policy, typed context. |
| Controlled filter proposal/echo | SUPERSET | Owner state is never mutated; proposals emit once and echoes are silent. |
| Select-all | SUPERSET | Truthful filtered-loaded scope, disabled exclusion, selection limit, groups, virtual/lazy safety. |
| Controlled select-all | SUPERSET | Additive `selectAllState` proposal/echo retains legacy Neural `selectAll` visibility semantics. |
| Virtual scrolling | PARITY | Fixed-size CDK window, buffer, active reconciliation and logical ARIA positions. |
| Lazy/server windows | SUPERSET | Bounded monotonic O1 requests for initial, filter and scroll; consumer owns network cancellation. |
| Global and row loading | PARITY | Loading icon/state plus typed bounded loader rows that are never option `T`. |
| Readonly | PARITY | Focusable and inspectable while option, token, clear and select-all mutation are blocked. |
| Disabled | PARITY | Direct+CVA composition blocks interaction and exposes truthful ARIA. |
| Clear | PARITY | Accessible, fresh empty array, one CVA/change/clear sequence, empty no-op. |
| Selection limit | SUPERSET | Historical MultiSelect contract retained across pointer, keyboard and select-all paths. |
| Comma/list display | PARITY | Bounded visible labels and overflow summary. |
| Chip/token display | SUPERSET | Existing Neural runtime chip/count switch plus typed token and remove-icon templates. |
| Selected summary | SUPERSET | Count format, selected-set template, max visible labels and preserved count mode. |
| Overlay lifecycle | PARITY | CDK open/close, outside, Escape, Tab, scroll-dismiss, resize and focus restoration. |
| Keyboard navigation | PARITY | Arrow, Home/End, PageUp/PageDown, Enter/Space, Escape, Tab and typeahead. |
| Focus policies | PARITY | Auto option, hover, select-on-focus, filter autofocus and host autofocus are independent. |
| Active descendant | SUPERSET | O1 stable IDs point only to eligible rendered options after filter/window replacement. |
| Templates | SUPERSET | Eighteen typed item/group/selected/set/token/filter/loader/empty/icon/checkbox slots. |
| Events | SUPERSET | Canonical Neural lifecycle/detail names plus historical `selectionChange`; typed atomic change/remove/select-all/lazy payloads. |
| Native/form metadata | PARITY | ID, name, autocomplete, tabindex, required/invalid, ARIA, fluid, variant and size. |
| Accessibility | SUPERSET | Combobox/listbox multiselect semantics, accessible tokens/removal, logical positions and focus restoration. |
| SSR, zoneless, RTL and forced colors | PARITY | Deterministic IDs, guarded browser access, signal state, logical CSS and high-contrast styling. |
| URL synchronization | SUPERSET | Existing Neural URL-safe primitive array synchronization remains intact. |
| Reference append/overlay/motion objects | N/A | CDK owns portal, positioning, backdrop and lifecycle without leaking Reference internals. |
| Reference style/pass-through/tooltip plumbing | N/A | Neural tokens, host classes and structural templates provide the useful result. |

Current relevant gaps: **0**.

## Meaningful Reference evolution

| Capability | Reference 19.1 | Reference 20.4 | Reference 21.1 | Reference 22.1 | Neural before | Neural after | Classification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dedicated MultiSelect | Primary | Primary | Primary | Deprecated but shipped | Dedicated | Dedicated | HISTORICAL-KEEP |
| `Select[multiple]` | Absent | Absent | Absent | Recommended current path | Family split | NeuMultiselect owns multiple | CURRENT FLOOR |
| Multiple CVA array | MultiSelect | MultiSelect | MultiSelect | Select + MultiSelect | Present, retained caller array | Present, cloned ownership | CURRENT FLOOR |
| Groups/filter/virtual/lazy | MultiSelect | MultiSelect | MultiSelect | Both surfaces, richer deprecated component | Flat/filter/CDK virtual only | O1 grouped, controlled filter, bounded lazy/virtual | CURRENT FLOOR |
| Chips, count and selection limit | MultiSelect | MultiSelect | MultiSelect | Deprecated MultiSelect | Chips/count runtime switch | Preserved and extended | HISTORICAL-MIGRATION-USEFUL |
| Select-all and detailed remove events | MultiSelect | MultiSelect | MultiSelect | Deprecated MultiSelect | Basic loaded select-all | Typed truthful scope and atomic events | HISTORICAL-MIGRATION-USEFUL |
| Controlled overlay visibility | Input only | Input only | Input only | Two-way output added | Not present | Canonical `open` + `openChange` owner/proposal/echo | CURRENT FLOOR |
| Reference portal/z-index/motion/pass-through | Reference-specific | Reference-specific | Reference-specific | Reference-specific | CDK overlay | CDK overlay | OBSOLETE/N/A |
| Typed strict templates | Untyped `any` | Untyped `any` | Untyped `any` | Untyped `any` | Five weakly inferred slots | Eighteen strict contexts | HISTORICAL-MIGRATION-USEFUL |

## Neural useful-behavior regression matrix

| O3-baseline NeuMultiselect capability | O4 result | Evidence |
| --- | --- | --- |
| Multiple selection and deselection | EXTENDED | Atomic typed detail events; no duplicates. |
| CVA and Reactive Forms | EXTENDED | Supplied arrays are cloned; writes remain silent. |
| Primitive, domain-object and function accessors | EXTENDED | O1 identity and replacement reconciliation added. |
| Disabled option and composed disabled state | EXTENDED | Disabled groups/loading/readonly also block mutation. |
| Search by label | EXTENDED | Controlled nested/computed multi-field filter engine. |
| Clear button and footer clear | PRESERVED | Atomic no-op-safe clear lifecycle. |
| Loaded select-all | EXTENDED | Filter/group/disabled/limit-aware truthful scope. |
| CDK virtual scrolling | EXTENDED | Configurable size/buffer, logical total and lazy requests. |
| Loading message | EXTENDED | Loading icon and typed bounded row templates. |
| Count/chip runtime display switch | PRESERVED | Also adds comma, selected-set and token templates. |
| Chip pointer removal | EXTENDED | Keyboard removal and accessible name added. |
| URL-safe primitive synchronization | PRESERVED | Same legacy contract; object values still never stringify falsely. |
| Item/selected/header/footer/empty templates | EXTENDED | All five retained within eighteen strict templates. |
| CDK overlay, outside close and resize | EXTENDED | Escape/Tab/reposition/focus restoration lifecycle events. |
| Arrow/Enter/Space option interaction | EXTENDED | Full boundary/page/typeahead navigation. |
| Error/hint/live results | EXTENDED | Complete ARIA required/invalid/active/logical state. |
| Floating label, size and Neural styling | PRESERVED | Adds variant, fluid, RTL, forced colors and reduced motion. |

Removed useful Neural capabilities: **0**. Regressions: **0**.

## Event atomicity

| Interaction | CVA | `selectionChange` | `changeDetail` | Dedicated event | touched |
| --- | ---: | ---: | ---: | --- | ---: |
| Pointer/keyboard add | 1 | 1 | 1 | none | 0 |
| Pointer/keyboard option remove | 1 | 1 | 1 | `remove` 1 | 0 |
| Token pointer/keyboard remove | 1 | 1 | 1 | `remove` 1 | 0 |
| Uncontrolled select-all | 1 | 1 | 1 | `selectAllChangeDetail` 1 | 0 |
| Controlled select-all proposal | 0 | 0 | 0 | `selectAllChangeDetail` 1 | 0 |
| Clear | 1 | 1 | 1 | `cleared` 1 | 0 |
| Filter edit/reset | 0 | 0 | 0 | `filter` 1; optional deduplicated lazy request | 0 |
| Programmatic write/reset | 0 | 0 | 0 | none | 0 |
| Show/hide | 0 | 0 | 0 | one panel lifecycle event per transition | hide: 1 |
| Readonly/disabled/loading mutation attempt | 0 | 0 | 0 | none | 0 |
| Focus/blur | 0 | 0 | 0 | one focus/blur event | blur: 1 |
| Lazy initial/filter/scroll | 0 | 0 | 0 | one deduplicated bounded request | 0 |
