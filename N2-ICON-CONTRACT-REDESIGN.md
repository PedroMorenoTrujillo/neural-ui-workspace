# N2 Core icon contract redesign — verification report

## 1. Status

**Core 2 icon contract and H9 bundle policy certified locally.** The provider-neutral outlet was isolated and the only remaining failing H9 scenarios, Button and PickList, were rebaselined to exact repeated measurements with historical values preserved. PR/main/release H9, full tests, coverage, package/contract/import/SSR checks and both real Angular 22 consumer variants pass. See [N2-ICON-H9-ATTRIBUTION.md](N2-ICON-H9-ATTRIBUTION.md) for the before/after bytes, retained FESMs, methodology and local archive. No push, tag, npm publication or Showcase V2-S1 implementation.

## 2. Starting HEAD

Repository `neural-ui-workspace-v2`, branch `v2`, starting clean HEAD `63de8dc0f1c030722acaae7bdca08f5750151f53`. The earlier `N2-NEURAL-ICONS-DECOUPLING.md` established that package peers were backed by actual runtime and type coupling; it is preserved as historical evidence.

## 3. Inventory

The starting tree had 27 productive Core components importing `NeuralIcon` at runtime, 16 productive files using `NeuralIconName`/`NeuralIconDefinition`, and exact mandatory Icons peers. See [N2-ICON-CONTRACT-INVENTORY.md](N2-ICON-CONTRACT-INVENTORY.md) for each component, original icon imports, role, public type exposure, and no-provider disposition. A comment in `provide-neural-ui.ts` was stale metadata and has been corrected.

## 4. Alternatives considered

- Keep the mandatory peer: would preserve behavior but contradict Core independence.
- Make the peer optional without changing product imports: unsound; no-Icons consumer would still fail module resolution.
- Move Icons into Core dependencies: hides rather than removes the coupling.
- Embed/copy Neural Icons geometry or build a Core catalogue: rejected by product boundary.
- Use only projected templates everywhere: too disruptive for essential chrome and repeated defaults.
- Chosen: opaque keys for public decoration, a small Core-owned set of semantic control intents, and an optional Angular-component resolver; retain existing template/projection hooks.

## 5. Chosen contract

`@neural-ui/core/foundation` exports `NeuIconKey = string`, `NeuIconRenderContext`, `NeuIconRender`, `NeuIconResolver`, `NEU_ICON_RESOLVER`, and `provideNeuIconResolver`. A resolver maps `{ key, size, strokeWidth, label }` to an app-owned Angular component plus inputs, or returns `null`. There is no Neural Icons import in this contract. `InternalNeuIconOutletComponent` owns rendering inside Core from the isolated, internal/unsupported `@neural-ui/core/icon-outlet-internal` entrypoint; it is not a Neural Icons wrapper or a public catalogue.

## 6. Semantic icon model

Core's built-in keys name intent, not package definitions: examples include `close`, `previous`, `next`, `disclosure-up`, `disclosure-down`, `confirm`, `add`, `status-success`, `validation-error`, and `drag-handle`. Internal constants map the former fixed definitions to these strings so each component's purpose stays legible. Application keys remain opaque; they need not belong to any Core enum or Neural Icons name union.

## 7. Default strategy

Components pass a small stable structural SVG path or compact semantic text fallback to the outlet only where their control/state actually needs one. The outlet does not import a global icon/fallback map; Button's basic `add` path remains especially small. Unknown custom keys without a resolver render no geometry; labels, state and operation must remain meaningful. Existing item/template projection remains available. No Neural Icons SVG path was copied into Core and no full icon catalogue was created.

## 8. Optional Neural Icons integration

A consuming application may install `@neural-icons/angular` and `@neural-icons/core`, import selected definitions, and configure `provideNeuIconResolver` to return `NeuralIcon` for selected keys. The exact tested mapping of `save` to `iconSave` is in [N2-ICON-MIGRATION.md](N2-ICON-MIGRATION.md). Core has no adapter package, mandatory peer, optional peer, runtime import or declaration reference to Icons.

## 9. Public API deltas

**Intentional N2 breaking icon changes:** icon-bearing public inputs and item models formerly typed as `NeuralIconName` now use `NeuIconKey` (an app-owned string). Fixed status/notification icon definitions formerly typed as `NeuralIconDefinition` now resolve to semantic keys. This affects Alert, Breadcrumb, Button, EmptyState, Input, Menu/MegaMenu/shared actions, Nav, NotificationCenter, ScrollTop, SplitButton, StatsCard, Tag, Toast and ToggleButtonGroup. The foundation resolver API was added. No V1 compatibility shim is kept.

The generated contract now has 101 entrypoints (one new internal/unsupported icon-outlet entrypoint), 868 exported declarations and 1,473 bindings. The intentional public change is the icon type/resolver contract, not a V1 compatibility shim. Internal semantic constants and the outlet are not supported consumer APIs. No unrelated public component feature was intentionally changed. `npm run snapshot:contracts` updated the declaration snapshot/reconciliation; `npm run audit:contracts` passes.

## 10. Components migrated

All 27 runtime-import components in the inventory use the internal neutral outlet instead of `NeuralIcon`. Existing keyboard, focus, event and content/template paths are preserved. Representative component tests for Alert, Button, EmptyState, Gallery, ImageViewer, Menu, Tag and Toast were updated for neutral semantics; the outlet has focused tests for structural/non-structural fallbacks, unknown keys, labels, sizing and optional Neural Icons rendering.

## 11. Type decoupling

All 16 productive type-usage files now use Core-owned types. A recursive scan of productive `projects/ui-core/**/*.ts` (excluding specs) found **zero `@neural-icons/*` references**. A recursive scan of built `.mjs` and `.d.ts` found **zero Icons references**. Test-only and tooling references remain where they deliberately verify optional integration or historical budgets.

## 12. Package metadata

After source decoupling, `projects/ui-core/package.json` removed the two mandatory Icons peers. The built package declares Angular 22 peers (`@angular/*`, CDK and schematics) and `tslib` dependency; it has no `@neural-icons/*` dependency, peer or optional peer. The local package still declares version `1.15.0`; that is **not** an official Neural UI 2 release identifier.

## 13. Clean consumer without Neural Icons

A clean Angular 22 standalone, zoneless, SSR/hydration consumer installed the exact local archive and legitimate required peers, with neither `@neural-icons/angular` nor `@neural-icons/core` present. Button, Select, civil DateInput, Table, Tree, TreeTable, Dialog and Nav compiled and prerendered (one route). The browser rendered all representative surfaces and a Button click updated a signal-backed output from `0` to `1`, with zero console errors/warnings. `add` retained a Core-owned structural SVG; an unresolved `save` key produced no invented SVG. No `ERR_MODULE_NOT_FOUND`. The temporary offline npm cache needed `--legacy-peer-deps` for local tarball resolution; `npm ls` confirmed the actual Angular 22 peers. This is an install-mode caveat, not a product import failure.

## 14. Consumer with Neural Icons

The same temporary consumer was subsequently extended with exact locally packed `@neural-icons/angular@0.0.1-next.1` and `@neural-icons/core@0.0.1-next.0`. It compiled and prerendered. In Chromium, a `save` icon rendered through a Core Button slot via the application resolver and also rendered directly as a Showcase-owned `<neural-icon>`; both contained SVGs. A post-hydration Button click updated `0` to `1`, with zero console errors/warnings. Core was not forked or rebuilt for this variant.

## 15. SSR, hydration and zoneless

The Core 101-entrypoint SSR smoke passed. Both Angular 22 consumer variants prerendered and ran through the SSR server; both had a real post-hydration signal interaction, and the with-Icons variant rendered the provider component on the hydrated page. The prerendered HTML contained `ngh` markers and `ng-server-context`; the browser had no `Zone` global. The consumer's zoneless configuration was generated by Angular CLI, not added to Core. No console hydration errors were observed.

## 16. Tests

`npm run test:coverage`: **192/192 files, 2935/2935 tests PASS**. Directed neutral-outlet tests and the optional Neural Icons resolver test are included. `node --test scripts/h9-static-closure.spec.mjs`: 5/5 PASS after changing its old “Icons must be external” assertion to the new “Icons must be absent” invariant. No coverage exclusions or thresholds changed.

## 17. Coverage

Statements **96.9889%**, branches **95.0345%**, functions **96.0688%**, lines **98.1559%**. All exceed the hard gate of **95.01%**. The margin in branches is narrow and must not be rounded into a larger claim.

## 18. Contracts

`npm run audit:contracts` PASS after intentional snapshot update: 101 entrypoints, 868 exported declarations, 1,473 bindings, 5,284 classified symbols. See section 9 for classification; this is a deliberate Core 2 icon API break, not a V1-preserving shim.

## 19. Packaging and imports

`npm run build` PASS; `npm run verify:package` PASS (447 files); `npm run test:imports` PASS (101 entrypoints); `npm run test:ssr-smoke` PASS (101 entrypoints); `npm exec -- publint dist/neural-ui/core` PASS. `npm run audit:n2-icons-boundary` rejects both runtime and type-only product imports and PASSes. The updated `npm run audit:n2-icons-bundle` PASSes: Core-only Button and representative bundles contain no Neural Icons geometry, whereas the optional application resolver bundles only selected `save` or `download/save/trash` definitions; unused root remains zero raw bytes. Packaged files contain no `@neural-icons/*` paths, productive source leakage, or `.ts` implementation sources.

## 20. H9 bundle policy — certified

The former H9 assertion required Button to externalize Neural Icons. It now fails if a Core-only Button bundle **contains or imports** Icons. Separating the outlet from the broad general internal entrypoint returned Select, Kanban and ColorPicker inside their original budgets. Only Button and PickList were rebaselined to observed `21806/3788/3221` and `109514/17059/14166` raw/gzip/Brotli bytes; their historical values are preserved in the policy. Two full calibrations matched byte-for-byte. H9 PR/main/release **PASS**, with zero architectural failures and unchanged formulas, aggregate/package budgets and all other scenario baselines. The detailed fair old/new package comparison and esbuild attribution are in [N2-ICON-H9-ATTRIBUTION.md](N2-ICON-H9-ATTRIBUTION.md).

## 21. Local tarball

Local archive `/private/tmp/n2-icon-h9-certified-20260928/neural-ui-core-1.15.0.tgz`: **447 files**, **1,304,074 bytes**, SHA-256 **`a849ffc695a73359d5e45ff5d5e1d6bc61cf67f605bbf561c66291ae0c8f9343`**. Both clean consumer variants were rerun against this exact archive. It is a certified local Core 2 candidate, **not** a published npm release. Identify it by the final Core commit plus filename and SHA-256, never the still-`1.15.0` package field alone.

## 22. Migration guide

[N2-ICON-MIGRATION.md](N2-ICON-MIGRATION.md) documents before/after public types, a no-provider example, optional Neural Icons resolver, application-owned component path, templates, accessibility, and the candidate-version caveat.

## 23. Showcase 2 handoff

Showcase 2 should consume the local tarball pinned by the **new Core commit**, filename and SHA-256. Showcase separately installs Neural Icons for its shell and may configure the optional resolver for selected Core slots; it must not duplicate the Icons catalogue or make Core depend on its design. Replace the old V2-S0 Core snapshot only after reviewing this certification, then rerun Showcase baseline build/SSR/browser proofs. No V2-S1 visual work is authorized by this Core task. The enterprise visual addendum was separately recorded in `SHOWCASE-V2-PROPOSAL.md` on `showcase-v2`, without starting V2-S1.

## 24. Recommendation

Treat the local Core commit and tarball as the new functional/API truth for Showcase V2-S0 after its own verification. Keep the icon provider optional, keep Core independent, and retain the H9 baseline rationale and historical values for future regressions. Do not push, tag, publish or deploy from this task.
