# Neural UI public API contract

## Purpose

The release contract is generated from the compiled package declarations. It records what consumers can import and what Angular templates can bind, while keeping support status separate from declaration visibility. A name appearing in a `.d.ts` file is not, by itself, a support promise.

H5-A changes only inventory and classification. It does not rename APIs, alter component behavior, remove exports, or begin a major-version cleanup.

## Sources and artifacts

- `dist/neural-ui/core/package.json` defines the consumer entry points and their declaration bundles.
- Compiled `.d.ts` bundles are parsed with the TypeScript AST. Angular `ɵcmp` and `ɵdir` declaration metadata defines inputs, outputs, aliases, required inputs, selectors, and model-generated change outputs.
- `projects/ui-core/public-contract.policy.json` contains explicit support classifications, compatibility replacements, implementation-only export overrides, framework mechanics, and supported imperative-method allowlists.
- `projects/ui-core/public-contract.v2.json` is the deterministic, sorted release snapshot governed by `public-contract.schema.json`.
- `projects/ui-core/public-contract.snapshot.json` remains unchanged as the historical schema-v1 snapshot.
- `projects/ui-core/public-contract.reconciliation.json` maps every historical binding token to the declaration inventory and records discoveries and ambiguities.

The generator intentionally contains no timestamps, absolute paths, or source-order-dependent records. A release check fails on additions, removals, signature changes, binding changes, export-path changes, status changes, or design-token changes until the snapshot is explicitly reviewed and updated.

## Classification

- `SUPPORTED`: intentional consumer API. Angular bindings, exported declaration shapes, and explicitly allowlisted imperative methods default here.
- `COMPATIBILITY`: a retained compatibility spelling or adapter. `canonicalReplacement` records the current or planned Neural spelling; runtime ownership is addressed in later H5 phases.
- `DEPRECATED`: an API carrying `@deprecated`. The declaration text and migration note remain in the snapshot.
- `INTERNAL/UNSUPPORTED`: declaration leakage, Angular/framework mechanics, underscore or `ɵ` implementation members, `@internal` API, and explicit implementation-only exports. Physical hiding is not implied by H5-A.
- `REVIEW`: public non-binding class state or behavior that has not yet been accepted as consumer API or classified as implementation-only.

Interface and enum members are structural parts of their exported type signatures and are supported with the declaration. Public class methods and properties are reviewed independently. Private and protected class members are not consumer-accessible and are excluded from the public-symbol count.

## Canonical Neural naming policy

Neural vocabulary is canonical whenever Neural and Prime-shaped names express the same result. Compatibility names may remain temporarily, but they do not define a second behavior owner.

| Concept              | Canonical contract                                                 |
| -------------------- | ------------------------------------------------------------------ |
| Controlled value     | `value` / `valueChange`                                            |
| Boolean state        | semantic noun / `<noun>Change`                                     |
| Selection            | `selection` / `selectionChange`                                    |
| Expansion            | positive `expandedKeys` vocabulary                                 |
| Overlay visibility   | `open` / `openChange`; `open()` / `close()`; `opened` / `closed`   |
| Clear                | `clearable`; `clear()`                                             |
| Search               | `searchable`; `searchPlaceholder`                                  |
| Filter configuration | `filterConfig`                                                     |
| Identity             | domain-native name: Table `rowKey`, Option family `identityConfig` |
| Pagination           | `page`, `pageSize`, `totalItems`                                   |
| Lazy proposal        | `lazyRequest`                                                      |
| Events               | no `onX` prefix                                                    |
| Native control ID    | `inputId`                                                          |
| ARIA                 | `ariaLabel`, `ariaLabelledBy`, `ariaDescribedBy`                   |
| Native attributes    | `maxlength`, `minlength`, `tabindex`, `autocomplete`               |
| Size                 | `sm`, `md`, `lg`                                                   |
| Control variant      | `outlined`, `filled`                                               |
| Templates            | `neu<Component><Region>`                                           |

This table is policy metadata for H5-A. Canonical aliases, forwarding, deprecation additions, state consolidation, and event atomicity are later reviewable H5 candidates.

## Updating and checking

Build the package before running the contract tasks. `npm run test:contracts` verifies synthetic declaration fixtures. `npm run audit:contracts` regenerates the inventory in memory and compares it with the reviewed snapshot. `npm run snapshot:contracts` writes schema v2 and the reconciliation report and must be used only after reviewing an intended contract change.
