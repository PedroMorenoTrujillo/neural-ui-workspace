# N2 icon contract — productive-source inventory

Starting point: `v2` at `63de8dc0f1c030722acaae7bdca08f5750151f53`. Before the redesign, 27 productive components statically imported `NeuralIcon` and 16 productive files used `NeuralIconName` or `NeuralIconDefinition` in types. This is an inventory of that starting contract, not a claim that the old peers were metadata-only. All 27 components can function without a third-party icon package after migration; essential control affordances retain a small Core-owned fallback, while optional decoration may be absent without an application resolver.

Legend: **A** internal control chrome; **B** user-visible semantic default; **C** public/shared icon model; **D** projected/template customization; **E** optional decoration. `C` means the starting API exposed Neural-specific types. Every runtime row previously required Neural Icons even if a template escape hatch existed, because the import was static.

| Productive file under `projects/ui-core/` | Starting imported definitions from `@neural-icons/core/icons/*` | Role | Old Neural type? | Neutral behavior without icon package |
|---|---|---|---|---|
| `alert/neu-alert.component.ts` | `circle-check`, `circle-x`, `info`, `warning`, `x` | A, B, C | `NeuralIconDefinition`, `NeuralIconName` | Status glyph and dismiss fallback; message/actions still work. |
| `bottom-sheet/neu-bottom-sheet.component.ts` | `x` | A, D | No | Close affordance fallback; projected body works. |
| `breadcrumb/neu-breadcrumb.component.ts` | — | C, E | `NeuralIconName` | Item labels/navigation work; unresolved optional icons are absent. |
| `button/neu-button.component.ts` | — | C, D, E | `NeuralIconName` | Label/action works; known structural keys have fallback; custom keys require resolver or projected content. |
| `dock/neu-dock.component.ts` | — | D, E | No | Actions/labels work; item templates remain first-class. |
| `empty-state/neu-empty-state.component.ts` | `inbox` | B, C, D | `NeuralIconName` | Message/actions work; small default glyph or projected content. |
| `gallery/neu-gallery.component.ts` | `chevron-left`, `chevron-right` | A, D | No | Previous/next structural fallback; gallery interaction remains. |
| `image-viewer/neu-image-viewer.component.ts` | `chevron-left`, `chevron-right`, `rotate-ccw`, `rotate-cw`, `flip-horizontal`, `flip-vertical`, `download`, `x`, `zoom-in`, `zoom-out` | A, B | No | Control labels and compact affordance fallback remain; no provider needed to operate. |
| `inline-editor/neu-inline-editor.component.ts` | `edit`, `check`, `x` | A, B | No | Edit/save/cancel controls retain labels and fallback. |
| `input/neu-input.component.ts` | `circle-alert` | B, C, D | `NeuralIconName` | Validation message and a11y state remain; optional start/end icons resolve through app or projection. |
| `mega-menu/neu-mega-menu.component.ts` | — | C, D, E | `NeuralIconName` via item model | Item labels and keyboard navigation work; templates remain. |
| `menu-tiered/neu-tiered-level.component.ts` | — | D, E | Via shared item model | Tier navigation works; templates remain. |
| `menu/neu-menu.component.ts` | — | C, D, E | `NeuralIconName` via item model | Menu items/actions work; templates remain. |
| `modal/neu-modal.component.ts` | `x` | A, D | No | Close control fallback; projected body/footer work. |
| `nav/neu-nav.component.ts` | `chevron-right`, `chevron-left`, `external-link` | A, C, E | `NeuralIconName` | Disclosure and external-link affordances remain; item navigation works. |
| `notification-center/neu-notification-center.component.ts` | `bell`, `circle-check`, `circle-x`, `info`, `warning`, `x` | A, B, C | `NeuralIconDefinition`, `NeuralIconName` | Status/dismiss controls remain; notifications work. |
| `pick-list/neu-pick-list.component.ts` | `arrow-down`, `arrow-left`, `arrow-right`, `arrow-up`, `drag` | A, B, D | No | Transfer/reorder/drag labels and fallback remain; item templates work. |
| `rich-text-editor/neu-rich-text-editor.component.ts` | `bold`, `italic`, `underline`, `list`, `list-ordered`, `link`, `image`, `eraser` | A, B | No | Toolbar buttons retain accessible labels and compact glyph fallback. |
| `scroll-top/neu-scroll-top.component.ts` | `chevron-up` | A, C | `NeuralIconName` | Scroll action and fallback remain. |
| `sidebar/neu-sidebar.component.ts` | `x` | A, D | No | Close control fallback; projected content works. |
| `speed-dial/neu-speed-dial.component.ts` | `plus` | A, D, E | No | Toggle fallback; actions still work with labels/templates. |
| `split-button/neu-split-button.component.ts` | `chevron-down` | A, C, D | `NeuralIconName` | Disclosure fallback; action/menu behavior remains. |
| `stats-card/neu-stats-card.component.ts` | `minus`, `trending-down`, `trending-up` | B, C, E | `NeuralIconName` | Data and trend text remain; compact fallback is optional. |
| `tag/neu-tag.component.ts` | — | C, D, E | `NeuralIconName` | Tag text works; unresolved decorative icon is absent. |
| `toast/neu-toast.component.ts` | `circle-check`, `circle-x`, `info`, `warning`, `x` | A, B | `NeuralIconDefinition` | Status/dismiss glyph fallback; announcement behavior remains. |
| `toggle-button-group/neu-toggle-button-group.component.ts` | — | C, D, E | `NeuralIconName` | Option labels/selection work; templates remain. |
| `uploader/neu-uploader.component.ts` | `upload` | B, D | No | Upload action/labels work; glyph fallback remains. |

The other two of the 16 productive type-usage files have no runtime icon import: `internal/neu-menu-action.ts` and `menu-shared/neu-menu-shared.ts`. Both carried `NeuralIconName` in menu action/item models; both now use `NeuIconKey`. Runtime components above also consumed these shared models. `provide-neural-ui.ts` contained only a stale Icons integration comment, which was corrected.

## Design disposition

- Public icon values are opaque `NeuIconKey` strings, not a Neural Icons catalogue enum. Semantic built-in keys express intent (`close`, `previous`, `status-success`, etc.), not vendor names.
- `NEU_ICON_RESOLVER`/`provideNeuIconResolver` let an application supply any Angular rendering component; no Core runtime or declaration imports `@neural-icons/*`.
- The internal outlet draws only a tiny stable set of original structural strokes. Non-structural default affordances use compact text glyphs; unknown app keys render nothing without a resolver. This is not a second icon catalogue.
- Existing projected/template paths remain available. Icon-only custom keys need an application resolver or explicit projected content; the component's accessible label must remain present.
- All 27 runtime imports and all 16 productive type usages were migrated. Tests/tooling may still import Neural Icons to prove optional coexistence.
