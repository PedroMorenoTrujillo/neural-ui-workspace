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
| Object options | `optionLabel`, `optionValue`, `optionDisabled` accessors |
| Add/remove/select lifecycle | `add`, `remove`, `select`, `valueChange` outputs |
| Keyboard and ARIA combobox | Arrow navigation, Enter selection, Escape close, Backspace removal and listbox semantics |

Prime-specific pass-through, grouped templates, overlay attachment and motion configuration do not map to NeuralUI's standalone API. They are intentionally omitted rather than exposing inert compatibility inputs.
