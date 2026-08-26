# InputTags parity ledger

## Scope

PrimeNG 22.1.0 introduced InputTags as the dedicated replacement for the former multi-token AutoComplete path. `NeuTags` remains a deliberately separate, string-only token field and was not modified.

## Historical review

| Prime line | Relevant state |
| --- | --- |
| 19 | Token entry lived under AutoComplete multiple mode. |
| 20 | AutoComplete retained token options such as separator, blur and Tab commits. |
| 21 | The legacy AutoComplete token path remained available. |
| 22.1 | InputTags is the current owner, with token events, optional typeahead and option accessors. |

## Neural mapping

| PrimeNG 22.1 behavior | NeuralUI mapping |
| --- | --- |
| Multi-value CVA | `NeuInputTagsComponent` CVA and immutable `valueChange` arrays |
| `max`, duplicate policy, delimiter | `max`, `allowDuplicate`, `delimiter` |
| Blur, Tab and paste opt-ins | `addOnBlur`, `addOnTab`, `addOnPaste` (all default `false`) |
| Typeahead suggestions | `typeahead`, `suggestions`, `delay`, `minQueryLength`, `completeMethod` |
| Object and grouped options | `optionLabel`, `optionValue`, `optionDisabled`, `group`, `optionGroupLabel` and `optionGroupChildren` |
| Item, option, group and panel templates | Typed `neuInputTagsItem`, `neuInputTagsRemoveIcon`, `neuInputTagsOption`, `neuInputTagsGroup`, `neuInputTagsHeader` and `neuInputTagsFooter` directives |
| Add/remove/select lifecycle | `add`, `remove`, `select`, `valueChange` outputs |
| Focus policy | `autoOptionFocus` and `focusOnHover` without implicit token mutation |
| Forms and presentation | Native required state, explicit invalid presentation, `sm`/`md`/`lg` size, `outlined`/`filled` variant and fluid layout |
| Native text input metadata | `inputId`, `name`, `autocomplete`, `autofocus`, title, length/pattern constraints and ARIA metadata forwarded to the real input |
| Keyboard and ARIA combobox | Arrow navigation, Enter selection, Escape close, Backspace removal and listbox semantics |

Prime-specific pass-through, overlay attachment/configuration, motion configuration and raw style/class objects remain intentionally absent. Neural uses its colocated, SSR-safe panel plus semantic inputs, projected templates and design tokens; exposing Prime implementation objects would add plumbing without a distinct migration capability.
