# H5-C2 package-private boundaries

## Verdict

H5-C2 is closed. Neural UI now has one dedicated, undocumented APF secondary entrypoint, `@neural-ui/core/internal`, for cross-entrypoint implementation sharing. The supported consumer facade contains no Option `ɵ` bridge, no Menu/Tree foundation entrypoint, and none of the three implementation services. Functional bindings, supported imperative APIs, behavior, templates, CSS, and tokens are unchanged.

## Exact baselines

- Workspace: `83cb607bec4258e578112ea5ecddee4b0262e78e`
- Showcase: `ffc5a6438bc6d351678ec72c2818a9e85d121b10`
- Root: `6cc1b958c17050876d67f59ae68d015dce75aa1d`
- Starting contract: 106 entrypoints, 799 exported declarations, 1,142 inputs, 230 outputs, 2 models, 1,374 bindings, 5,772 symbols, 3,445 supported, 2,323 internal/unsupported, REVIEW 0, compatibility 2, deprecated 2.

## Selected architecture and APF proof

The selected strategy is one dedicated shared internal secondary entrypoint. It replaces the separate `menu-foundation` and `tree-foundation` package paths and removes implementation declarations from `option-api` and `foundation`. It is marked unsupported in contract policy and documentation and is forbidden in consumer fixtures, Showcase, testing contracts, schematics, and generated code.

An isolated ng-packagr spike proved that two ordinary secondary entrypoints can import one shared internal secondary entrypoint; ng-packagr emits the implementation once, emits resolvable declarations, and passes import, SSR, package verification, publint, and ATTW checks. Removing `./internal` from the built package export map then made the dependent entrypoints fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`. Therefore the APF entrypoint must remain physically exported for runtime resolution even though it is not supported consumer API.

Rejected alternatives:

- Retaining separate Menu and Tree internal entrypoints leaves fragmented physical exposure and does not solve Option/service sharing.
- Cross-entrypoint private/deep source imports do not provide stable APF package or declaration resolution.
- Removing the internal subpath from `exports` was disproved by the spike.
- Inlining or copying foundations would regress the H6-A zero-duplication result.

## Reproducible evidence

- `docs/H5C2_PACKAGE_PRIVATE_DEPENDENCY_GRAPH.json` records the shared-boundary definitions and consumers, declaration references, the complete 330-symbol ledger projection, and the dependency-count reconciliation.
- `docs/H5C2_PACKAGE_PRIVATE_LEDGER.json` records every one of the 330 deferred symbols and its final action.
- `npm run audit:h5c2-boundaries` mechanically rebuilds and validates the counts and physical visibility.
- `npm run audit:h5c2-duplication` validates source-map ownership and emitted runtime markers.
- `npm run test:h5c2-boundaries` compiles supported imports and requires rejection diagnostics for all removed public paths.

## Dependency graph summary

| Family | Declarations moved | Real sibling consumers | Public-path result |
|---|---:|---|---|
| Option foundation | 22 | Select, Multiselect, Autocomplete, Listbox | 0 `ɵ` exports from `option-api` |
| Menu foundation | 16 | Menu, MegaMenu, Dock, SpeedDial, ContextMenu, SplitButton | `menu-foundation` removed |
| Tree navigation foundation | 6 | Tree, TreeSelect | `tree-foundation` removed; no assumed TreeTable/OrganizationChart edge |
| Foundation services | 3 | 41 actual component/foundation entrypoints | removed from supported `foundation` |

The emitted internal declaration graph contains 47 top-level declarations. It has no Showcase, consumer-fixture, schematic/generated-code, or consumer-document import. Cross-entrypoint `.d.ts` references resolve through `@neural-ui/core/internal`.

## Option bridge ledger

All 22 actions are `MOVE TO PRIVATE BOUNDARY`; UNEXPLAINED is 0.

| Former consumer export | Consumers and emitted usage | Final action |
|---|---|---|
| `ɵInternalNeuOptionLazyRequestSequencer` | Autocomplete, Listbox, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵcreateNeuOptionLazyRequest` | Autocomplete, Listbox, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵcreateNeuOptionLoadingRows` | Autocomplete, Listbox, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵderiveNeuOptionRowId` | Autocomplete, Listbox, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵfilterNeuOptionRows` | Autocomplete, Listbox, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵnormalizeNeuLegacyOptionGroups` | Autocomplete, Listbox, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵnormalizeNeuOptionGroups` | Autocomplete, Listbox, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵnormalizeNeuOptionLazyWindow` | Autocomplete, Listbox, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵnormalizeNeuOptionRows` | Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵInternalNeuOptionNormalizedRow` | Autocomplete, Listbox, Multiselect, Select — type-only | MOVE TO PRIVATE BOUNDARY |
| `ɵInternalNeuOptionRow` | Autocomplete, Listbox, Multiselect, Select — type-only | MOVE TO PRIVATE BOUNDARY |
| `ɵINTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS` | Autocomplete, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵInternalNeuConnectedOverlaySession` | Autocomplete, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵInternalNeuOptionActiveRowController` | Autocomplete, Listbox, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵInternalNeuOptionTypeaheadController` | Listbox, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵconstrainNeuConnectedOverlayGeometry` | Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵderiveNeuOptionActiveDescendant` | Autocomplete, Listbox, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵderiveNeuOptionAnnouncementData` | Autocomplete, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵderiveNeuOptionAriaPosition` | Listbox, Multiselect, Select — runtime | MOVE TO PRIVATE BOUNDARY |
| `ɵInternalNeuConnectedOverlayCloseIntent` | Autocomplete, Multiselect, Select — type-only | MOVE TO PRIVATE BOUNDARY |
| `ɵInternalNeuConnectedOverlayCloseReason` | Autocomplete, Multiselect, Select — type-only | MOVE TO PRIVATE BOUNDARY |
| `ɵInternalNeuOptionActiveRowResult` | Multiselect, Select — type-only | MOVE TO PRIVATE BOUNDARY |

Final Option exposure: 0 supported `ɵ` exports and 0 consumer-importable `ɵ` names. The unprefixed implementations remain physically emitted at the unsupported internal APF subpath because sibling FESMs require it.

## Foundation ledgers

| Foundation | Final result |
|---|---|
| Menu | 16 declarations moved to the shared internal boundary; implementation emitted once |
| Tree | 6 declarations moved to the shared internal boundary; implementation emitted once |
| `NeuIdGenerator` | moved from supported `foundation` to internal; 37 production sibling import sites plus its focused foundation test |
| `NeuInitialTemporalState` | moved from supported `foundation` to internal; Calendar, DateInput, NotificationCenter, SchedulerGantt, Table consumers |
| `NeuResponsiveState` | moved from supported `foundation` to internal; Dock, MegaMenu, Stepper consumers |

Supported tokens `NEURAL_LOCALE`, `NEURAL_TIME_ZONE`, `NEURAL_NOW`, and the `NeuNow` type remain on `foundation` unchanged.

## 330 deferred internalizations

| Final action | Count |
|---|---:|
| PRIVATE CLASS MEMBER | 67 |
| PROTECTED/TEMPLATE-VISIBLE MEMBER | 252 |
| KEEP PHYSICALLY ACCESSIBLE FOR SAME-ENTRYPOINT COMPOSITION | 3 |
| TYPE-ONLY INTERNALIZATION | 8 |
| Total resolved | 330 |
| Remaining | 0 |

The three retained members are `NeuRadioGroupComponent._name`, `_value`, and `_isDisabled`, which the sibling `NeuRadioComponent` uses within the same entrypoint. The eight TreeTable hierarchy bookkeeping fields moved from public `NeuTreeTableRow` to the non-exported `InternalNeuTreeTableRow`. Existing tests use bracket access where they intentionally inspect private/protected implementation state; assertions and behavior are unchanged.

## Reconciliation of the reported 77

H5-C1's summary reports 77 required package-dependency symbols but publishes no 77-item ledger. Its own Option/service tables mechanically sum to 88 symbols. Rebuilding those exact tables from the H5-B4 contract gives 88: 79 then `INTERNAL/UNSUPPORTED`, 6 then REVIEW, and 3 then SUPPORTED. H5-C2 reconciles the complete 88-symbol superset, so every possible member of the reported 77 is covered without inventing an unreproducible subset.

- 88/88 moved off supported entrypoints into the shared internal boundary.
- 88/88 remain physically emitted through that one unsupported APF subpath; the spike proves hiding the subpath breaks sibling runtime resolution.
- 0 remain on the former supported Option/foundation entrypoints.

## Contract and functional freeze

Final contract: 105 emitted entrypoints (104 supported consumer entrypoints and 1 internal), 799 exported declarations, 1,142 inputs, 230 outputs, 2 models, 1,374 bindings, 5,445 classified symbols, 3,445 supported, 1,996 internal/unsupported, REVIEW 0, compatibility 2, deprecated 2. Binding extraction shortfall is 0. The reduction of 327 classified symbols is exactly 319 private/protected class members excluded from the consumer contract plus 8 TreeTable bookkeeping fields.

The supported imperative allowlist remains 84. Option-family bindings remain Select 56/10, Multiselect 66/13, Autocomplete 65/13, Listbox 51/10. Table remains 77 inputs, 38 outputs, 32 supported imperative methods, 20 composition selectors, and 292 total implementation methods. TreeTable, SpeedDial, OrganizationChart, and every other functional surface are unchanged.

## Package, duplication, and size

- Import smoke: 105/105 passed.
- SSR import smoke: 105/105 passed.
- Package verification: 439 files passed.
- publint: pass.
- ATTW: pass.
- Shared implementation source duplication: 0 bytes before, 0 bytes after.
- Total raw FESM: 3,259,129 bytes before; 3,256,230 bytes after; −2,899 bytes (−0.09%).
- Consolidated affected foundations: 54,160 bytes before; 53,545 bytes after; −615 bytes (−1.14%).

Affected raw FESMs: Option API 32,248 → 5,142; Foundation 8,135 → 847; Menu foundation 7,924 → 0; Tree foundation 5,853 → 0; new Internal 0 → 47,556. Consumers either shrink slightly or remain effectively flat; the largest increase is TreeTable +95 bytes from the private row-type boundary. No affected entrypoint or total package regression approaches 2%.

The historical bundle-budget audit still fails at Table 646.6 KiB versus its 260 KiB limit and total 3,179.9 KiB versus 2,000 KiB. It already failed at baseline (Table 646.6 KiB and total 3,182.7 KiB); H5-C2 reduces the total and does not create that debt.

## Verification result

Production build/declarations, contract audit/tests, entrypoint audit, CVA audit, Table architecture audit, focused boundary tests (523/523), strict Option/H5-B4/Table template fixtures, H5-C1/H5-C2 consumer fixtures, imports, SSR, package verification, publint, ATTW, and schematics all pass.

The single full Workspace run executed 145 test files and all 2,995 tests passed. The command exits non-zero only because the existing global 95% coverage thresholds remain unmet: 94.75% statements, 92.70% branches, 93.52% functions, 96.54% lines. Coverage remains H7 debt and was report-only in H5-C2.

## Remaining debt and H5-C3 decision

H5-C3 is not required. There are no `ɵ` bridges on supported entrypoints, no fragmented Menu/Tree foundation entrypoints, no unresolved deferred internalizations, no REVIEW symbols, and no duplication or bundle regression. The only residual is the APF-required, explicitly unsupported `./internal` export-map entry proven necessary by the spike. Further removal would require a packaging model change rather than another facade-cleanup wave.

No H6 implementation, H7 implementation, H8 work, visual/CSS work, commit, push, tag, publish, or Showcase change is included.
