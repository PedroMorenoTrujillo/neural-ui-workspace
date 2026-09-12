# Compare parity ledger

## Scope

The reference release introduced Compare as a current before/after comparison family. It replaces the legacy ImageCompare route. `NeuImageViewer` and `NeuImageGallery` remain media-viewing components and were not changed.

## Historical review

| Reference line | Relevant state |
| --- | --- |
| 19 | No current Compare family; legacy ImageCompare was the comparison route. |
| 20 | ImageCompare remained the legacy surface. |
| 21 | No standalone current Compare compound API. |
| 22.1 | Compare is a compound root, item, handle and indicator API. |

## Neural mapping

| Reference behavior | NeuralUI mapping |
| --- | --- |
| Comparison root | `NeuCompareComponent` |
| Before/after content | `NeuCompareItemComponent` with `position` |
| Draggable handle | `NeuCompareHandleComponent` |
| Accessible range control | `NeuCompareIndicatorComponent` |
| Controlled/uncontrolled value | `value` and `defaultValue` |
| Range semantics | `min`, `max`, `step` |
| Horizontal and vertical clipping | `orientation` |
| Hover and drag updates | `slideOnHover`, pointer capture and live `valueChange` |
| Completion event | `valueChangeEnd` |

Reference pass-through customization is intentionally absent. The Neural API provides native composition and CSS tokens instead.
