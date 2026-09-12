# NeuAutocomplete — external compatibility and no-regression record

Sources: the exact published reference packages across four release lines, including their declarations and shipped AutoComplete implementations, plus the official AutoComplete documentation for the inspected release lines. The latest package controls the current floor.

## Before-state snapshot at `ff86cecf85fed69451542df6631a2ffe36693e3e`

- 21 inputs: local `options`, label/value/disabled accessors, placeholder/label/hint/error/empty/loading copy, `minLength`, loading, dropdown, force selection, floating label, size, and fixed CDK virtual settings.
- 2 outputs: `optionSelected` and `queryChange`.
- 4 templates: item, header, footer, and empty.
- CVA stored only the text signal and never stored a canonical model or matched option separately.
- Typing after a selection changed visible text but retained the prior form value until the text became empty.
- Blur correctness depended on an arbitrary 150 ms timer.
- `aria-selected` represented the active row rather than the actual selected value, and active-descendant could describe an unrendered virtual option.
- Suggestions were always locally filtered; there was no consumer-owned `completeMethod`, debounce, lazy request, grouping, native metadata, overlay lifecycle, or focus-policy contract.

## Explicit state ownership after O5

| State                  | Owner                            | Rule                                                                             |
| ---------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| Input/query text       | `_query`                         | Mirrors the real input; never scraped from the DOM.                              |
| Display text           | `displayText`                    | Explicit projection of query text, independent of form identity.                 |
| Matched option         | `matchedOption`                  | Raw `T` only; reconciled across immutable replacement.                           |
| Custom arbitrary value | `customTextValue`                | String only when force selection is off; no synthetic option object.             |
| Canonical CVA value    | `canonicalValue`                 | `V`, custom string, or null; editing a selected option cannot leave a stale `V`. |
| Suggestions            | `suggestions`/`groupSuggestions` | Consumer-owned in Reference mode; legacy `options` retains local filtering.          |
| Active option          | `_activeIndex` + logical index   | Eligible option row only; never group/loading/disabled/unrendered.               |
| Overlay visibility     | `_isOpen`                        | One lifecycle transition per actual open/close.                                  |

## Current capability closure

| Reference capability                             | Result   | Neural contract/evidence                                                                                                                        |
| -------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Consumer-owned suggestions                   | PARITY   | `suggestions` and `groupSuggestions` are replaced by the consumer; networking and cancellation stay outside the component.                      |
| Completion, delay and minimum query length   | PARITY   | Typed `completeMethod`, latest-wins cancellable scheduling, canonical `minLength`, and no below-floor request.                                 |
| Complete-on-focus and dropdown blank/current | PARITY   | Immediate focus/dropdown request, one dropdown lifecycle, correct blank/current query and focus restoration.                                    |
| Custom text                                  | PARITY   | Non-force text is the public `V \| string` value; empty text normalizes to null without manufacturing `T`.                                      |
| Force selection                              | PARITY   | Case-insensitive exact labels resolve atomically; invalid text clears text/model/selection without stale form state.                            |
| Label/value/disabled accessors               | SUPERSET | Direct, nested and computed O1 accessors with falsy and `NaN` value semantics.                                                                  |
| Grouping                                     | SUPERSET | Typed nested/computed groups, legacy flat groups, disabled groups/options, strict group template, keyboard and virtual/lazy composition.        |
| Identity/data key                            | SUPERSET | O1 identity configuration and replacement reconciliation exceed Reference's string-only data key.                                                   |
| Loading                                      | PARITY   | Busy input/list, loading icon and typed loader rows that are never option `T`.                                                                  |
| Virtual scrolling                            | SUPERSET | Bounded manual window, buffer, logical total, loader rows, stable active state, and truthful set/position ARIA without total-sized fake arrays. |
| Lazy loading                                 | SUPERSET | Bounded typed requests include first/end/count, monotonic request ID, query/filter metadata and reason; consumer owns network cancellation.     |
| Overlay lifecycle                            | PARITY   | CDK collision positions, push/reposition, outside/Escape/Tab/selection close, resize width sync and focus restoration.                          |
| Keyboard                                     | PARITY   | Arrow, Home/End caret behavior, PageUp/PageDown, Enter, Escape, Tab active selection and Alt+Arrow close.                                       |
| `autoHighlight`                              | PARITY   | New results may activate the first eligible option without selecting it.                                                                        |
| `autoOptionFocus`                            | PARITY   | Opening focuses selected-or-first eligible row independently of auto highlight.                                                                 |
| `selectOnFocus`                              | PARITY   | Keyboard/hover focus can select when explicitly enabled.                                                                                        |
| `focusOnHover`                               | PARITY   | Hover moves activity only when enabled and does not otherwise mutate value.                                                                     |
| Clear                                        | PARITY   | Accessible clear, already-empty no-op, one CVA/query/clear lifecycle when state changes.                                                        |
| Readonly                                     | PARITY   | Focusable and inspectable; typing, option mutation and clear are blocked while dropdown inspection remains available.                           |
| Disabled                                     | PARITY   | Direct+CVA ownership, truthful native disabled state, no interaction or mutation.                                                               |
| Forms                                        | PARITY   | Reactive/template CVA, silent write/reset, direct+CVA disabled composition and touched on meaningful exit.                                      |
| Native/form metadata                         | PARITY   | ID, name, type, autocomplete, autofocus, tabindex, required/invalid, input size, minlength, maxlength, pattern and ARIA reach the text input.   |
| Active/selected accessibility                | SUPERSET | Active descendant names an eligible rendered option only; `aria-selected` names the canonical selection independently.                          |
| Search/empty/selection live copy             | PARITY   | Configurable messages and polite atomic result announcements.                                                                                   |
| Templates                                    | SUPERSET | Strict item/group/loader contexts plus empty/header/footer/loading/clear/dropdown slots; invalid option/group properties fail `ngc`.            |
| Events                                       | PARITY   | Complete/select/focus/blur/dropdown/clear/keydown/keyup/open/close/lazy plus preserved `optionSelected` and `queryChange`.                       |
| SSR/hydration                                | PARITY   | Stable metadata-derived or explicit IDs, no random/global sequence, guarded browser access and timer cleanup.                                   |
| Zoneless                                     | PARITY   | Signal state and deterministic timers require no Zone dependency.                                                                               |
| RTL                                          | PARITY   | Logical inline layout, direction-neutral overlay positions and virtual list.                                                                    |
| Forced colors                                | PARITY   | Native high-contrast borders, focus, active, selected and disabled distinctions.                                                                |
| Reduced motion                               | PARITY   | Overlay/spinner/input transitions are removed under the user preference.                                                                        |
| Size, variant and fluid                      | PARITY   | `sm`/`md`/`lg`, outlined/filled and full-width Neural results.                                                                                  |
| Legacy Neural local options                  | SUPERSET | Existing local case-insensitive filtering remains available without weakening consumer-owned Reference mode.                                        |
| Legacy floating label/hint/error             | SUPERSET | All useful Neural presentation and semantic feedback remains.                                                                                   |
| Public control methods                       | SUPERSET | `open`, `close`, `focus`, `clear`, `reset`, `openAll`, and preserved direct option selection.                                                   |
| Multiple/token entry                         | N/A      | Deprecated in Reference 22 and owned by InputTags; not added to single-value NeuAutocomplete.                                                       |
| Reference append/z-index/overlay/motion objects  | N/A      | CDK owns the useful portal, collision, scrolling and lifecycle result without Reference internals.                                                  |
| Reference style/pass-through plumbing            | N/A      | Neural tokens, host states and structural templates provide the useful result.                                                                  |
| InputTags catalog surface                    | N/A      | Separate missing component recorded for future catalog expansion; not implemented in O5.                                                        |

Counts: **PARITY 25 · SUPERSET 10 · GAP 0 · N/A 4**.

## Meaningful Reference evolution

| Capability                | Reference 19.1                      | Reference 20.4                                          | Reference 21.1                                  | Reference 22.1                                        | Neural before     | Neural after                                             | Classification                              |
| ------------------------- | ------------------------------- | --------------------------------------------------- | ------------------------------------------- | ------------------------------------------------- | ----------------- | -------------------------------------------------------- | ------------------------------------------- |
| Minimum query API         | `minLength`                     | `minQueryLength` added; `minLength` deprecated      | Both shipped                                | `minLength` removed                               | `minLength` only  | Canonical historical `minLength`                         | CURRENT FLOOR / NEURAL-NATIVE                |
| Token/chips additions     | Multiple only                   | `addOnTab`, `addOnBlur`, `separator`, `onAdd` added | Retained                                    | Deprecated for InputTags                          | Absent            | Still absent                                             | OBSOLETE/N/A                                |
| Multiple/token owner      | AutoComplete                    | AutoComplete                                        | AutoComplete                                | Deprecated; InputTags introduced                  | Single value      | Single value                                             | OBSOLETE/N/A                                |
| Native/form inputs        | Component-owned inputs          | Expanded base/input conventions                     | Retained                                    | Signal-based BaseInput/BaseEditableHolder surface | Minimal           | Forwarded current useful metadata                        | CURRENT FLOOR                               |
| Completion/focus policies | Complete/delay/min/focus family | Current naming expanded                             | Retained                                    | Signal inputs, same useful behavior               | Local query only  | Typed consumer completion and independent focus policies | CURRENT FLOOR                               |
| Strict template typing    | Untyped templates               | Untyped templates                                   | Typed context declarations but `any` option | Generic declarations still default `any`          | Weak item only    | Actual Angular strict item/group/loader directives       | HISTORICAL-MIGRATION-USEFUL                 |
| Overlay/virtual/lazy      | Reference overlay/scroller objects  | Expanded Reference plumbing                             | Retained                                    | Motion/pass-through plumbing added                | CDK basic virtual | Bounded CDK result and typed lazy contract               | CURRENT FLOOR                               |

## Deprecated token-mode classification

| Token capability        | Classification | O5 decision                                            |
| ----------------------- | -------------- | ------------------------------------------------------ |
| `multiple`              | OBSOLETE/N/A   | Not added; no existing Neural token baseline.          |
| `addOnTab`              | OBSOLETE/N/A   | Not confused with current active-option Tab selection. |
| `addOnBlur`             | OBSOLETE/N/A   | Not added.                                             |
| `separator`             | OBSOLETE/N/A   | Not added.                                             |
| `unique`                | OBSOLETE/N/A   | Multiple-only behavior; not added.                     |
| selected-token template | OBSOLETE/N/A   | Not added.                                             |
| remove-token template   | OBSOLETE/N/A   | Not added.                                             |
| `onAdd`                 | OBSOLETE/N/A   | Not added.                                             |
| `onUnselect`            | OBSOLETE/N/A   | Not added.                                             |

Reference 22.1 ships InputTags and Neural has no equivalent component. Catalog classification: **InputTags → MISSING EQUIVALENT NEURAL COMPONENT → CATALOG EXPANSION REQUIRED**.

Complete preserved catalog-expansion ledger: **Tag, SpeedDial, ButtonGroup, ScrollPanel, ScrollTop, AvatarGroup, Image, InputTags**.

## Neural useful-behavior regression matrix

| O4-baseline NeuAutocomplete capability | O5 result | Evidence                                                                |
| -------------------------------------- | --------- | ----------------------------------------------------------------------- |
| Local option filtering                 | PRESERVED | `options` retains O1-backed client filtering.                           |
| Primitive/domain options               | EXTENDED  | Nested/computed access and identity replacement added.                  |
| Disabled options                       | EXTENDED  | Groups/loading/readonly/direct+CVA disabled also protected.             |
| CVA option selection                   | EXTENDED  | Explicit canonical value, custom string and silent programmatic writes. |
| Query output                           | PRESERVED | `queryChange` remains and is atomic with clear/input.                   |
| Option selection output                | PRESERVED | `optionSelected` remains alongside typed detail output `select`.        |
| Clear button                           | EXTENDED  | Accessible, optional, readonly/disabled aware and no-op safe.           |
| Dropdown trigger                       | EXTENDED  | Blank/current completion contract and lifecycle event.                  |
| Force selection                        | EXTENDED  | Exact match/invalid normalization is atomic and stale-selection safe.   |
| Loading feedback                       | EXTENDED  | Icon and typed non-option loader rows.                                  |
| CDK virtual list                       | EXTENDED  | Bounded DOM, logical total/ARIA, groups and lazy windows.               |
| Arrow/Enter/Escape keyboard            | EXTENDED  | Full current keyboard/focus-policy surface.                             |
| CDK overlay/outside/resize             | EXTENDED  | Collision/reposition/Tab/focus lifecycle and no blur timer.             |
| Item/header/footer/empty templates     | EXTENDED  | All retained with strict typing and additional group/loader/icon slots. |
| Floating label and size                | PRESERVED | Adds variant, fluid, RTL, forced colors and reduced motion.             |
| Hint/error/live results                | EXTENDED  | Full native/ARIA metadata and truthful active/selected semantics.       |

Removed useful Neural capabilities: **0**. Regressions: **0**.

## Event atomicity

| Interaction                           |                                      CVA |               `queryChange` | `optionSelected` / `select` | complete/dropdown/clear/overlay              |   touched |
| ------------------------------------- | ---------------------------------------: | --------------------------: | ----------------------------: | -------------------------------------------- | --------: |
| Typed custom query                    |          1 when canonical string changes |                           1 |                             0 | delayed latest-wins complete 1               |         0 |
| Typed force-selection query           |           stale option clears with CVA 1 |                           1 |                             0 | delayed complete 1                           |         0 |
| Pointer/keyboard/exact-blur selection |                       1 if value changes |                           0 |                         1 / 1 | hide 1 when open                             | blur only |
| Invalid force-selection blur          | 0 after edit already cleared stale model | 1 for normalized text clear |                             0 | clear 1; hide at most 1                      |         1 |
| Clear button                          |             1 if canonical value changed |           1 if text changed |                             0 | clear 1; hide at most 1                      |         0 |
| Already-empty clear                   |                                        0 |                           0 |                             0 | 0                                            |         0 |
| Dropdown request                      |                                        0 |                           0 |                             0 | complete 1, dropdown 1, show at most 1       |         0 |
| Open/close repeat                     |                                        0 |                           0 |                             0 | only real transition emits                   |         0 |
| Programmatic write/reset              |                                        0 |                           0 |                             0 | 0                                            |         0 |
| Readonly/disabled mutation attempt    |                                        0 |                           0 |                             0 | 0                                            |         0 |
| Focus/blur                            |                                        0 |                           0 |                             0 | focus/blur 1 each; optional focus complete 1 |    blur 1 |
| Lazy filter/scroll                    |                                        0 |                           0 |                             0 | one deduplicated bounded lazy request        |         0 |
