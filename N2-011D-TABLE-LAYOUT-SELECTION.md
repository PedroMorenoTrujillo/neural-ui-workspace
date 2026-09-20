# N2-011D — NeuTable 2 controlled layout + selection

## 1. Status

PASS. N2-011D is implemented and verified without advancing to N2-011E.

## 2. Scope

Only the private semantic renderer, the single public candidate facade, pure layout/selection engines, directed fixtures, audits, baselines and this report changed.

## 3. Applied/proposal ownership

`layout` and `selection` remain parent-owned applied inputs. User gestures emit `layoutChange` or `selectionChange` proposals and never mutate applied state locally.

## 4. Signal graph

Applied inputs feed computed layout and selection projections. Query processing remains a separate computed branch; layout and selection are downstream consumers and are not dependencies of search/filter/sort/page processing.

## 5. Writable ephemeral state

The renderer owns only interaction state: dragged column ID, resize gesture/preview, selection range anchor and pending focus restoration. None is an applied domain mirror.

## 6. Effects ledger

There are zero `effect()` calls and zero domain synchronization effects. One one-shot `afterNextRender` restores logical focus after an accepted reorder.

## 7. Column identity

Column identity is exactly `column.id`; reconstructed column objects preserve layout, templates, focus targeting and selection behavior.

## 8. Duplicate column IDs

Normalization rejects duplicate IDs deterministically with the offending ID in the diagnostic.

## 9. Layout owner

The facade reads the controlled `layout` input and derives a normalized projection. It does not use `model()`, Forms, CVA or writable mirror state.

## 10. Visibility

Hidden IDs are projected from applied layout. Hide/show controls only propose immutable visibility changes; unknown IDs are ignored.

## 11. Widths

Applied widths override declarative column widths by ID and are rendered with logical `inline-size`.

## 12. Resize

Pointer and keyboard resize produce `source: 'resize'` proposals. Preview state is ephemeral; pointer cancel and Escape clear it without emitting.

## 13. Reorder

Buttons and drag/drop share the same pure reorder proposal. Reorder is stable by ID, respects pin partitions and restores focus by logical column/action identity.

## 14. Column pinning

`pinnedStart` and `pinnedEnd` are distinct controlled column-layout partitions. Logical inset properties support LTR and RTL.

## 15. Layout rejection

If the parent does not apply a proposal, headers, visibility, pinning and widths remain at the currently applied DOM state.

## 16. Layout acceptance

Applying `change.next` updates the projection once and emits no echo event.

## 17. Selection owner

The controlled `selection` input is authoritative. The candidate does not correct, truncate or rewrite parent state.

## 18. Keys mode

Membership uses exact `K` identity tokens, preserves unloaded keys and does not depend on row object identity.

## 19. Single mode

Only the first externally supplied key is visually active. Radio, row and keyboard gestures propose one key, with optional clear according to `allowClear`.

## 20. Multiple mode

Checkbox, row, keyboard and range gestures use immutable key proposals with deterministic ordering.

## 21. Disabled rows

`rowOptions.isDisabled` and `selectionOptions.isRowDisabled` are combined. Disabled gestures are ignored, while a parent-applied disabled key is not deleted.

## 22. Row click

Row click selection follows `selectOnRowClick`. Events from interactive descendants or `data-neu-selection-stop` boundaries do not select the row.

## 23. Checkbox/radio

Native checkbox/radio controls emit exactly one proposal and call `preventDefault()` so rejected proposals visually return to applied state.

## 24. Keyboard selection

Enter on row controls and the header checkbox uses the same proposal functions and emits `source: 'keyboard'` or `source: 'toggle-all'` as applicable.

## 25. Range/meta-key if applicable

Range uses the current loaded/rendered order, skips disabled rows and respects `replace`, `platform` and `toggle` modifier policies.

## 26. Select-all scopes

`rendered` and `page` use rendered candidates, `loaded` uses all loaded rows, and `all-matching` creates a symbolic selection without enumerating backend data.

## 27. All-matching

The state contains a frozen search/filter/global-fields scope plus explicit excluded keys.

## 28. All-matching exclusions

Row toggles add/remove exact keys from `excludedKeys`; the implementation never materializes all matching keys.

## 29. All-matching + query changes

Later query changes do not rewrite the frozen scope or emit selection proposals. A header gesture under a new query proposes a new scope.

## 30. Header selection state

Checked, unchecked and indeterminate states are derived from the applicable scope, selectable rows and exclusions; keys mode never infers backend-wide selection.

## 31. Selection rejection

Rejected row/header proposals leave `aria-selected`, `checked` and the applied selection unchanged.

## 32. Selection acceptance

Parent application updates selected rows/header state once, with no corrective or echo emission.

## 33. Same-state suppression

Pure equality guards suppress selection and layout changes whose `next` state equals the applied state.

## 34. Pagination/filter persistence

Keys, including offscreen/unloaded keys, persist through page, search, reconstructed row and reconstructed column changes.

## 35. Pinned rows

Row pinning remains a row projection concern; selection membership stays keyed and independent of row position.

## 36. Remote unloaded keys

Remote mode retains unknown keys in controlled state and never fabricates loaded rows for them.

## 37. Selection column boundary

The private renderer owns one technical selection column. It is not a product column, does not enter column order/visibility/pinning, and adjusts spans consistently.

## 38. A11y selection

Rows expose `aria-selected`/`aria-disabled`; native inputs have row/header labels and preserve checked/indeterminate semantics.

## 39. A11y layout

Every layout action has an accessible label, resize exposes vertical orientation, focus-visible styling is present and accepted reorder restores logical focus.

## 40. SSR

Server output includes applied order, hidden-column recovery UI, width, start/end pins, selected keys, all-matching state, disabled rows, checkbox and radio markup.

## 41. Hydration

Real Angular 22 zoneless SSR/hydration reuses table/head/row/cell nodes, reports no NG050x, and emits the first selection and layout proposal exactly once.

## 42. Zoneless

All candidate and hydration tests use signal-driven state with `provideZonelessChangeDetection`; no zone dependency was added.

## 43. Focus

Focus is tracked by `column.id` plus action identity and restored after the parent accepts a reorder.

## 44. Lifecycle/cleanup

Pointer cancel, drag end and Escape clear ephemeral gesture state. The one-shot render callback does not install a persistent listener.

## 45. Recompute evidence

Instrumentation records one query-pipeline evaluation while independent selection/layout replacements produce exactly two evaluations in their own computed branches.

## 46. Selection performance

Stored 15-sample baselines: 10k rows/5k keys p95 4.721 ms, one-key toggle p95 4.536 ms, header state p95 5.093 ms, all-matching/1k exclusions p95 6.432 ms.

## 47. Layout performance

Stored 100-column baselines: projection p95 0.096 ms, visibility p95 0.207 ms, reorder proposal p95 0.083 ms and resize proposal p95 0.008 ms.

## 48. Bundle basic

Angular-compiled/minified basic consumer: 78,665 B raw, 13,819 B gzip, 11,818 B Brotli.

## 49. Bundle keys

Keys consumer: 78,713 B raw, 13,838 B gzip, 11,863 B Brotli.

## 50. Bundle all-matching

All-matching consumer: 78,781 B raw, 13,872 B gzip, 11,854 B Brotli.

## 51. Bundle layout

Layout consumer: 78,769 B raw, 13,858 B gzip, 11,855 B Brotli.

## 52. Bundle combined

Combined layout + selection consumer: 78,811 B raw, 13,872 B gzip, 11,884 B Brotli.

## 53. Root-unused

The root-unused consumer remains exactly 0 raw bytes.

## 54. Dependency graph

The package imports only `@angular/common` and `@angular/core`. Forbidden legacy Table, TableCore, Forms, Router, CDK and icon graph tokens are absent.

## 55. Pure tests

Eleven pure tests cover column identity/duplicates, immutable layout proposals, pin boundaries, resize constraints, exact-key selection, modes, modifier/range, disabled rows, all-matching, stale scope and header scopes.

## 56. Integration tests

Five zoneless host tests cover rejection/acceptance, one-emission controls, interactive boundaries, disabled/keyboard selection, all-matching without requests, pointer/keyboard reorder, visibility, pin, resize, focus and reconstructed/page/query persistence.

## 57. Type/contract gates

`test:n2-table-types`, `test:n2-table-contracts`, `audit:n2-table-ledger`, the package-private boundary audit and the architecture audit all pass.

## 58. Legacy regressions

Directed Table 1.x and TableCore runs pass: 2 files and 352 tests. Their product sources and tests were not changed.

## 59. Build/package

The Angular package build passes and `verify:package` validates the current package (431 files). The candidate remains isolated and unpublished.

## 60. API surface verification

The frozen 82-symbol target remains unchanged: component + 66 types + 15 directives, with exactly 24 inputs, 14 outputs and 4 methods. No N2-011D public API was added.

## 61. Regressions

Candidate suite: 4 files, 23 tests, all passing. Hydration, performance, bundle, contracts, legacy, build and package gates are green.

## 62. Risks

The renderer controls are intentionally private/basic UI. Future styling or virtualization work must preserve the frozen controlled semantics and exact-key behavior; it must not introduce a second owner.

## 63. Git diff

The diff is limited to N2-011D engines, renderer/facade wiring, directed tests/fixtures, reproducible scripts/baselines, package scripts and this report. No symlink is present.

## 64. Git status

The handoff is committed locally as one N2-011D commit; no push, tag, release or package publication is performed.

## 65. Recommendation

PASS. Authorize design review of N2-011D. Do not begin N2-011E until that review explicitly approves this checkpoint.

---

## Addendum — Basic bundle retention check

### Attribution

The reproducible audit now compares the frozen N2-011C artifacts with N2-011D and stores the result in `layout-selection-d-bundle.json`.

- N2-011C combined: 50,676 B raw / 8,460 B gzip.
- N2-011D basic: 78,665 B raw / 13,819 B gzip.
- Review delta: **+5,359 B gzip**.
- Like-for-like basic delta: **+5,448 B gzip**.
- Compiled FESM contribution delta: **+28,169 B raw**.

The esbuild source graph attributes 13,766 B of minified raw growth:

| Source area                               | Raw contribution delta |
| ----------------------------------------- | ---------------------: |
| Selection pure engine                     |               +6,045 B |
| Private renderer class                    |               +3,909 B |
| Layout pure engine                        |               +2,341 B |
| Public facade implementation              |               +1,661 B |
| Template contracts, pipeline and identity |                  +21 B |
| Basic projection simplification           |                 -211 B |

The remaining 14,403 B raw is the reproducible residual for Angular-compiled template instructions, styles, component metadata and compilation overhead. The metafile cannot divide that residual byte-perfectly between template branches.

Non-additive isolated bundles locate the internal feature costs. They deliberately overlap through shared helpers:

| Feature probe               | Isolated gzip | Interpretation                                                     |
| --------------------------- | ------------: | ------------------------------------------------------------------ |
| Complete selection engine   |       2,867 B | Keys, all-matching, range/modifier, header and proposal machinery  |
| All-matching support        |       1,343 B | Includes 809 B selection code plus shared client-pipeline matching |
| Range/modifier selection    |       2,168 B | Includes 3,462 B raw selection code plus shared matching/identity  |
| Header selection/toggle-all |       2,327 B | Includes projection, header state and shared matching              |
| Layout projection           |         442 B | Normalization, order, hidden, widths and pin projection            |
| Resize pure interaction     |         472 B | Constraint normalization and proposal                              |
| Reorder pure interaction    |         673 B | Reorder and keyboard move proposals                                |
| Pinning pure interaction    |         311 B | Pin proposal                                                       |

Selection controls/A11y, drag event wiring and focus restoration are methods and template instructions of the same Angular component definition. They therefore sit in the renderer/facade delta and compiled residual rather than in independently tree-shakeable metafile entries.

### Basic reachability

For a BASIC consumer, the entire N2-011D component definition remains reachable:

- the facade template statically references the private renderer;
- the facade computeds statically reference layout and selection projections;
- the renderer class statically references selection, resize, reorder, visibility and pin proposal functions;
- the compiled renderer template statically contains selection controls, A11y bindings and layout controls;
- focus restoration is referenced by the reorder path.

Runtime values such as `selectionOptions.mode === 'none'` or an empty layout cannot enable build-time tree-shaking. The bundler cannot prove those input values for every future component instance.

What is tree-shaken:

- type-only contracts;
- tests, fixtures, audit code and performance code;
- unused consumer literals for keys, all-matching, layout and combined scenarios;
- the entire `table-next` entrypoint when imported through an unused side-effect-free root path, preserving root-unused at 0 B raw.

No legacy Table 1.x or TableCore code is reachable, and package imports remain limited to `@angular/common` and `@angular/core`.

### Classification

| Cost                                       | Classification      | Decision                                                                                                                                                      |
| ------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Column normalization/layout projection     | CORE                | Required to render the controlled column set deterministically.                                                                                               |
| Exact-key membership and base header state | CORE                | Required for one complete accessible NeuTable contract.                                                                                                       |
| Selection controls and A11y bindings       | CORE                | Template semantics must be present when runtime inputs enable selection.                                                                                      |
| Renderer/template Angular instructions     | CORE                | Inherent to the single facade/private-renderer architecture.                                                                                                  |
| All-matching matching/exclusions           | OPTIONAL-SPLITTABLE | Conceptually separable internally, but a static split would still be reachable and a dynamic split would complicate synchronous selection for a small saving. |
| Range/modifier policies                    | OPTIONAL-SPLITTABLE | Can remain an internal boundary candidate if later selection work grows materially. No split is justified at the current size.                                |
| Resize proposal/gesture code               | NOT WORTH SPLITTING | The pure probe is 472 B gzip and would cost more in loading/state plumbing.                                                                                   |
| Reorder/drag code                          | NOT WORTH SPLITTING | The pure probe is 673 B gzip; it shares renderer state and focus behavior.                                                                                    |
| Pinning                                    | NOT WORTH SPLITTING | The pure probe is 311 B gzip.                                                                                                                                 |
| Focus restoration                          | NOT WORTH SPLITTING | Small one-shot behavior coupled to accepted reorder.                                                                                                          |
| Angular compilation overhead               | CORE                | Consequence of statically available runtime template branches.                                                                                                |

### Optimization performed

No runtime optimization or architecture refactor was performed. There is no accidental legacy dependency, duplicate implementation or independently reachable optional module to remove. The only change is stronger reproducible attribution in the existing bundle audit and its baseline.

The BASIC bundle remains **13,819 B gzip**. No public API, component, entrypoint, feature module, DI layer, factory or dynamic import was added.

### Future budget map

| Phase                          | Core                                                        | Internally separable                    | Dynamic/private feature chunk                                          |
| ------------------------------ | ----------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| E — sort/filter/pagination UI  | Basic sort controls and compact pagination state            | Filter-row/menu adapters                | Advanced filter builder/overlay if its implementation becomes material |
| F — remote machine             | Minimal request/output coordination and deterministic state | Retry, concurrency and transport policy | Only heavyweight optional transport tooling, if ever introduced        |
| G — virtualization             | Stable row identity and viewport contract                   | Virtualization engine/adapter           | Private chunk if a substantial runtime/CDK dependency is required      |
| H — editing/expansion/grouping | Minimal expansion/group keys needed by the facade           | Group/expansion projections             | Editing engine, editor orchestration and heavy editor integrations     |
| I — optional/export            | Output contract only                                        | Small optional command adapters         | Export serializers/workers and format-specific dependencies            |

Advanced filters, editing and export must not be compiled into BASIC merely because their frozen inputs/outputs exist. They are the primary candidates for private internal separation, with dynamic chunks reserved for implementations whose measured weight justifies the loading boundary.

### Recommendation

**BUNDLE ARCHITECTURE PASS.**

The approximately 5.36 KB gzip increase is explained by the controlled selection/layout engines plus the single renderer's statically compiled controls and Angular instructions. At the present size, splitting would add more architectural and runtime complexity than it removes. Keep the new retention attribution as the budget guard for later phases and do not begin N2-011E until separately authorized.
