# REL-02 existing coverage exclusions audit

All 21 existing `v8 ignore start/stop` regions in production source were inspected. They enclose Angular signal query *declarations* (`contentChild`, `contentChildren`, `viewChild`, or `viewChildren`), including a `viewChild.required` call. The V8 locations produced for these factory declarations do not describe a distinct application decision. Their consumers and projected/rendered behavior remain in coverage. Each exclusion is still justified on that narrow basis; none was added or changed in REL-02. Any future expansion around user behavior would require a new review.

| Production file under `projects/ui-core/` | Lines | Reason | Still justified? |
|---|---:|---|---|
| `accordion/neu-accordion.component.ts` | 172-176 | Content and view query declarations for projected header/body and header buttons. | YES |
| `autocomplete/neu-autocomplete.component.ts` | 375-377 | View query declaration for input element. | YES |
| `autocomplete/neu-autocomplete.component.ts` | 485-495 | Content query declarations for option, group, loader and other slots. | YES |
| `cascade-select/neu-cascade-select.component.ts` | 266-272 | Content query declarations for projected slots. | YES |
| `dashboard-grid/neu-dashboard-grid.component.ts` | 122-124 | View query declaration for tile slots. | YES |
| `data-view/neu-data-view.component.ts` | 206-210 | Content query declarations for item/header/footer slots. | YES |
| `dock/neu-dock.component.ts` | 187-192 | View and content query declarations, including required default item query. | YES |
| `input-tags/neu-input-tags.component.ts` | 377-385 | Content query declarations for item, remove icon, option and related slots. | YES |
| `listbox/neu-listbox.component.ts` | 388-398 | Content query declarations for item, indicator, group and related slots. | YES |
| `menu/neu-menu.component.ts` | 100-102 | Content query declaration for item template. | YES |
| `menu/neu-menu.component.ts` | 284-286 | Content query declaration for item template. | YES |
| `menu/neu-menu.component.ts` | 294-297 | View query declarations for trigger and overlay. | YES |
| `menu/neu-menu.component.ts` | 445-447 | Content query declaration for item template. | YES |
| `modal/neu-modal.component.ts` | 176-179 | View query declarations for panel and focus trap. | YES |
| `radio/neu-radio-group.component.ts` | 61-63 | Content query declaration for radios. | YES |
| `select/neu-select.component.ts` | 507-523 | Content query declarations for item, selected value and other projected slots. | YES |
| `split-button/neu-split-button.component.ts` | 173-175 | Content query declaration for item template. | YES |
| `split-button/neu-split-button.component.ts` | 178-181 | View query declarations for trigger and overlay. | YES |
| `timeline/neu-timeline.component.ts` | 148-151 | Content query declarations for item and marker slots. | YES |
| `tree-select/neu-tree-select.component.ts` | 308-314 | Content query declarations for node, selected value, header and related slots. | YES |
| `tree-select/neu-tree-select.component.ts` | 394-397 | View query declarations for trigger and overlay. | YES |

Audit method: enumerate every `v8 ignore start` in `projects/ui-core/**/*.ts`, match its closing marker and inspect all enclosed statements. The 21 pairs are balanced. The only declaration that did not start with a field modifier was `dock`'s continued `viewChild.required(...)` expression; it is part of the same query declaration. No existing ignore region enclosed a branch, handler or application action.
