# REL-02 material coverage gap classification

This classification uses the initial, fresh canonical run. A material file has at least 50 missed coverage units across statements, branches, functions, and lines. The units overlap and are used only to rank inspection, not as a count of distinct behaviors. Exact uncovered locations and all 131 files with gaps are in `N2-REL-02-COVERAGE-INVENTORY.md` and `.json`. A, B, C, D, F follow the categories in the REL-02 request. Multiple categories mean the file contains multiple kinds of paths. No file below is certified unreachable or dead.

| Rank | Production file under `projects/ui-core/` | Missed S/B/F/L | Class | Evidence and next test level |
|---:|---|---:|---|---|
| 1 | `table/internal/renderer/neu-table-basic-renderer.component.ts` | 119/122/23/84 | A/B/C/D | Sort, filter, search focus, edit and row focus paths; integration and directed browser/SSR guard tests. |
| 2 | `select/neu-select.component.ts` | 119/115/22/79 | A/D | Select-all, lazy/loading, keyboard and projected templates; DOM integration and browser focus tests. |
| 3 | `color-picker/neu-color-picker.component.ts` | 146/68/28/85 | A/D | Keyboard, alpha/mode/channel and pointer cancellation; DOM and pointer-capable browser tests. Keyboard test added. |
| 4 | `date-input/neu-date-input.component.ts` | 118/92/26/57 | A/D | Period navigation, range hover and time controls; DOM and browser tests. Period PageUp/PageDown test added. |
| 5 | `tree-table/internal/renderer/neu-tree-table-renderer.component.ts` | 94/138/13/48 | A/D | Filter commit, editor, keyboard, focus and export UI; renderer integration/browser tests. |
| 6 | `uploader/neu-uploader.component.ts` | 87/50/19/53 | A/B/D | File picker, drag/drop, disabled guards and dropzone keyboard paths; browser fixture plus error tests. |
| 7 | `tree/neu-tree.component.ts` | 67/80/14/38 | A/B/D | Drag/drop guards, focus fallback and keyboard expansion; DOM and browser tests. |
| 8 | `mega-menu/neu-mega-menu.component.ts` | 67/49/14/36 | A/D | RTL positioning, pointer dismissal, keyboard and mobile behavior; browser integration tests. |
| 9 | `rich-text-editor/neu-rich-text-editor.component.ts` | 67/29/16/37 | A/B/D | Asynchronous paste/FileReader, link prompt, blur and cleanup; browser and error tests. |
| 10 | `table/internal/renderer/neu-table-basic-renderer.component.html` | 66/28/23/29 | A/F | Search, page size, selection, drag and template event handlers; render-level tests. Generated listener branches need case-by-case attribution. |
| 11 | `kanban/neu-kanban.component.ts` | 59/47/12/24 | A/D | Card actions, keyboard movement, disabled and metadata paths; browser interaction tests. |
| 12 | `tree-select/neu-tree-select.component.ts` | 55/42/16/26 | A/D | Keyboard expand/collapse, overlay focus and virtual scroll; DOM/browser tests. |
| 13 | `table/internal/selection/neu-table-selection.ts` | 43/46/12/37 | A/B | Deep filter-scope equality and all-matching selection; pure contract test added. |
| 14 | `table/public/neu-table.component-contract.ts` | 30/30/17/13 | A/B | Editing, remote, expansion and callback fan-out; contract integration tests. |
| 15 | `tree-table/internal/query/neu-tree-table-query.ts` | 25/52/0/11 | A/B | Typed ordering/filtering and custom predicates; pure query test added. |
| 16 | `listbox/neu-listbox.component.ts` | 23/30/9/18 | A/D | Multi-select, meta toggles, groups and drag; DOM/browser tests. |
| 17 | `slider/neu-slider.component.ts` | 27/36/3/14 | A/D | Keyboard, pointer capture cleanup and dual-thumb paths; browser pointer tests. |
| 18 | `tree-table/internal/renderer/neu-tree-table-renderer.component.html` | 35/11/1/29 | A/F | Projected templates, loading/editor/footer/summary event paths; renderer tests and generated listener attribution. |
| 19 | `tree-table/public/neu-tree-table.component-contract.ts` | 27/10/14/16 | A/B/C | Delegated export, feature errors and browser guard; contract/SSR tests. |
| 20 | `tree-table/internal/editing/neu-tree-table-editing.ts` | 23/28/2/12 | A/B | Session reconciliation and pending draft preservation; pure editing tests. |
| 21 | `menu-tiered/neu-tiered-level.component.ts` | 26/19/2/15 | A/D | Escape, hover close, custom item, icons and shortcuts; DOM/browser menu tests. |
| 22 | `table/internal/client-pipeline/neu-table-client-pipeline.ts` | 15/37/1/9 | A/B | Filter expression equality and scalar comparator cases; pure pipeline tests. |
| 23 | `command-palette/neu-command-palette.component.ts` | 27/17/4/12 | A/B/D | Keyboard navigation and asynchronous open/destroy; DOM/browser tests. |
| 24 | `select/neu-select.directives.ts` | 21/18/9/12 | F/A | Angular directive/input/constructor instrumentation and projected slot use. Test projected behavior; establish exact compiler-only lines before policy treatment. |
| 25 | `tree-table/internal/hierarchy/neu-tree-table-hierarchy.ts` | 20/21/3/15 | A/B | Malformed cycle/parent diagnostics and projection; pure hierarchy tests. |
| 26 | `inline-editor/neu-inline-editor.component.ts` | 24/12/8/10 | A/D | Disabled/read-only actions and focusout; DOM interaction tests. |
| 27 | `tree-table/internal/export/neu-tree-table-export.ts` | 23/11/1/17 | A/B/C | SSR guard, filename fallback and export failure; contract/SSR tests. |
| 28 | `tree-table/internal/features/export/neu-tree-table-json-export.ts` | 20/17/2/13 | A/B | Nonfinite numbers, bigint, dates, shared references and circular data; directed serializer test added. |
| 29 | `virtual-list/neu-virtual-list.component.ts` | 19/20/4/8 | A/B/D | Animation frame cleanup, scroll alignment and invalid sizes; browser and guard tests. |

The initial material set represents 1,492 missed statements, 1,275 branches, 318 functions and 857 lines. Most entries contain reachable behavior. The proposed test levels are recommendations based on uncovered source locations, not claims that a browser run has been performed for each entry.
