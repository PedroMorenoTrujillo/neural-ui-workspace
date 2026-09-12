# NeuSelect — external compatibility record

Baseline: the published reference Select declaration and implementation plus the current official Select documentation. Neural preserves its existing `selectionChange` and URL-state contracts, uses the O1 option foundation for shared behavior, and exposes framework-neutral Angular CDK overlay/virtual behavior instead of vendor implementation objects.

## Capability closure

| Reference capability | Result | Neural contract/evidence |
| --- | --- | --- |
| Basic single selection and placeholder | PARITY | Typed `options`, `optionLabel`, `optionValue`, `optionDisabled`, CVA value, placeholder, pointer and keyboard selection. |
| Forms, disabled and invalid state | PARITY | Reactive/template CVA, required, invalid, direct/CVA disabled ownership, silent programmatic writes, touched on meaningful exit. |
| Clear action and checkmark | PARITY | Canonical `clearable`, accessible clear button, clear template, and checkmark without adding option tab stops. |
| Editable custom values | SUPERSET | Editable text is separate from selected option/filter state; exact labels resolve options and unmatched text commits as a raw typed value without manufacturing `T`. |
| Grouped options | SUPERSET | Typed O1 `groups` + `groupConfig`, with automatic historical flat `option.group` support; generated headers are never selectable and disabled groups are honored. |
| Client filtering | SUPERSET | Canonical `filterConfig` owns computed/nested multi-fields, six modes, and locale; the typed filter context and independent filtered-empty state remain. |
| Controlled filtering | SUPERSET | `filterValue` proposal/echo never mutates owner state; uncontrolled mode remains immediate. |
| Lazy filtering/loading | SUPERSET | Deduplicated, monotonic O1 requests carry inclusive `first`, exclusive `end`, count, reason, filter metadata, and serializable query state. |
| Virtual scrolling | PARITY | Fixed-size buffered render window, bounded DOM, top/bottom spacers, logical `aria-posinset`/`aria-setsize`, active-row reconciliation, and loading rows. |
| Global loading | PARITY | Loading icon/template and message; interaction cannot change the value while loading. |
| Readonly | PARITY | Remains focusable/readable while all mutating pointer, keyboard, clear, editable, and focus-selection paths are blocked. |
| Focus policies | PARITY | `autoOptionFocus`, `focusOnHover`, `selectOnFocus`, `autofocus`, and `autofocusFilter` are independent. |
| Overlay lifecycle | PARITY | Public `open`, `close`, `toggle`, focus restoration, outside/backdrop dismissal, Escape, Tab, and selection close reasons. |
| Keyboard navigation | PARITY | Enter/Space, Escape, Tab, Arrow, Home/End, PageUp/PageDown, Alt+Arrow, and locale-aware typeahead skip non-options and disabled/loading rows. |
| Identity/data key | SUPERSET | O1 identity supports nested/computed keys, custom equality, immutable replacement, duplicate-label values, and active/selected reconciliation. |
| Empty states | PARITY | `emptyMessage` and `noResultsMessage` own genuinely distinct unfiltered and filtered empty states. |
| Native metadata | PARITY | `id`, `inputId`, `name`, `tabindex`, required, autocomplete, hidden form serialization, and editable input metadata. |
| Sizing and variants | PARITY | Canonical `sm`/`md`/`lg`, outlined/filled, and fluid states use Neural tokens and logical CSS. |
| Accessibility | SUPERSET | Combobox/listbox ownership, real rendered active descendants only, accessible naming/descriptions, expanded/controls/required/invalid/disabled/readonly state, logical positions, focus-visible and forced-colors support. |
| SSR, hydration, zoneless and RTL | PARITY | Deterministic IDs, no browser-global construction access, signal state, import/SSR smoke coverage, and direction-neutral interaction/layout. |
| Item and selected-item templates | SUPERSET | Strict generic contexts preserve raw `T`, resolved `V`, index, identity and state; Angular template type tests prove invalid member/callback access fails compilation. |
| Group, loader, header, footer and empty templates | SUPERSET | Strict typed group/filter/loader contexts and structural projection for panel regions. |
| Dropdown/loading/clear/filter icon templates | PARITY | Dedicated typed icon directives cover Reference icon slots without exposing internal component instances. |
| Change/filter/focus/blur/click/open/close/clear/lazy events | PARITY | Canonical Neural output names preserve original events and typed option/value/filter/request data without onX aliases. |
| Public reset/filter/overlay/focus/clear methods | PARITY | `resetFilter`, `open`, `close`, `toggle`, `focus`, `clear`, and `selectOption`. |
| Multiple selection and on/off/cancel icon results | PARITY | `multiple` provides typed array values; `changeDetail` is discriminated by mode, and item composition owns visual option-state customization. |
| `appendTo`, overlay options and motion options | N/A | Angular CDK overlay owns portal placement, positioning, backdrop and focus lifecycle; Reference-specific objects would leak implementation internals. |
| Style/panel style classes, tooltip and unstyled/pass-through plumbing | N/A | Presentation-only Reference framework plumbing; Neural exposes tokens, host classes and structural templates. |

Relevant capability gaps: **0**.

## Public surface inventory

- 56 inputs with one owner per semantic capability and no compatibility aliases.
- 10 outputs: `blurEvent`, `changeDetail`, `cleared`, `closed`, `filter`, `focusEvent`, `lazyRequest`, `opened`, `selectionChange`, and `triggerClick`.
- 13 strict template directives: item, selected, group, filter, loader, header, footer, empty, empty-filter, dropdown icon, loading icon, clear icon, and filter icon.
- 7 public control methods: clear, close, focus, open, reset filter, select option, and toggle.

## Event atomicity

| Interaction | CVA change | `selectionChange` | `changeDetail` | Other output | touched |
| --- | ---: | ---: | ---: | --- | ---: |
| Pointer/keyboard option selection | 1 | 1 | 1 | pointer emits `triggerClick` once; overlay emits `closed` once | 0 |
| Editable exact-option commit | 1 | 1 | 1 | `custom: false`; overlay closes once | 0 |
| Editable custom-value commit | 1 | 1 | 1 | `custom: true`; no synthetic option | 0 |
| Clear | 1 | 1 | 1 | `cleared` 1; overlay close only when open | 0 |
| Uncontrolled filter edit/reset | 0 | 0 | 0 | `filter` 1; lazy mode may add one deduplicated `lazyRequest` | 0 |
| Controlled filter proposal | 0 | 0 | 0 | `filter` 1; owner echo is silent | 0 |
| Virtual scroll lazy window change | 0 | 0 | 0 | one deduplicated `lazyRequest` | 0 |
| Programmatic write/reset | 0 | 0 | 0 | none | 0 |
| Readonly/disabled/loading interaction | 0 | 0 | 0 | observational focus/click only when applicable | 0 |
| Focus | 0 unless `selectOnFocus` selects | follows selection | follows selection | `focusEvent` 1 | 0 |
| Meaningful control exit | 0 | 0 | 0 | `blurEvent` 1 | 1 |
| Open/close without selection | 0 | 0 | 0 | one `opened`/`closed` per actual transition | 0 |

## O1 reuse boundary

NeuSelect consumes the existing O1 normalization, grouping, filtering, identity, navigation, typeahead, active-row, virtual-window, lazy-request, loading-row, and reconciliation helpers through the internal option-foundation bridge. O3 adds no duplicate option algorithm and changes no O1 behavior.
