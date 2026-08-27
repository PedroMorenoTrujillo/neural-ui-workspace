# H4-D form metadata matrix

This matrix records the interaction-surface audit used for H4-D. `Has` means an
existing, meaningful public contract; `Should have` is implemented only where it
is low-risk in this change; `N/A` means the attribute would not describe the
real interactive surface. Deferred items require a later, component-specific
API pass rather than a cross-control expansion.

| Control | id / inputId | name | autocomplete | required | readonly | invalid | aria label / labelledby / describedby | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CascadeSelect | Has generated trigger ID | N/A | N/A | N/A | N/A | N/A | Has label | Composite widget; defer broader metadata API. |
| ColorPicker | **Should have — implemented** | N/A | N/A | **Should have — implemented** (ARIA) | **Should have — implemented** | **Should have — implemented** (ARIA) | **Should have — implemented** | Composite trigger has a real, deterministic interactive ID; user-provided IDs and ARIA relationships now target it. |
| InputMask | Has generated native-input ID | Should have — deferred | Should have — deferred | Should have — deferred | Should have — deferred | Should have — deferred | Should have — deferred | Native surface, but adding an API family is outside the focused H4-D ownership. |
| InputOtp | Has generated per-digit IDs | N/A | N/A | N/A | N/A | N/A | Has per-digit labels | Composite code entry; defer a group-level metadata API. |
| Knob | Has generated control identity | N/A | N/A | N/A | N/A | N/A | Has value and label ARIA | Composite ARIA slider; direct-disabled composition is a separate future fix. |
| NumberInput | Has generated native input ID | Should have — deferred | Should have — deferred | Should have — deferred | Should have — deferred | Should have — deferred | Has button labels | Native surface; no H4-D change without a focused contract audit. |
| RadioGroup | Group label API exists | N/A | N/A | N/A | N/A | N/A | Has group aria-label | Group semantics own the interactive radios; defer relationship API. |
| Tags | Has generated native-input ID and label relationship | N/A | N/A | N/A | N/A | N/A | Should have — deferred | The text entry is an editor for a collection, not a native serialized collection field. |
| ToggleButtonGroup | N/A | N/A | N/A | N/A | N/A | N/A | Has group role / disabled ARIA | Composite group; labels and descriptions need a dedicated API decision. |
| TreeSelect | Has generated trigger and panel IDs | N/A | N/A | N/A | Has trigger ARIA | N/A | Has label and tree ARIA | Existing deterministic IDs and tree semantics are retained. |
| RichTextEditor | Has editor ID | N/A | N/A | N/A | Has editable readonly | Has ARIA invalid | Has labelledby and describedby | Existing contract already covers this surface. |
| Uploader | Has native file-input ID | N/A | N/A | N/A | N/A | Has ARIA invalid | Has describedby | Existing contract already covers this surface. |

`NeuFormField` now exposes deterministic `labelId`, `hintId`, `errorId`,
`describedBy`, and `mergeDescribedBy(...)` through `exportAs="neuFormField"`.
It remains a presentational component: controls opt in to those IDs and retain
ownership of their own ARIA attributes.
