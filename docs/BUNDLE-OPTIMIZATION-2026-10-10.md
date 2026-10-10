# Bundle optimization follow-up — 2026-10-10

This follow-up supersedes the bundle-size failures recorded in
[the earlier pre-publication review](PREPUBLICATION-REVIEW-2026-10-10.md).
No package was published, pushed or deployed. Package metadata remains 1.15.0;
this is a local V2 review preview, not official release certification.

## Frozen-budget results

All 23 consumer scenarios satisfy their existing hard budgets. No budget,
compression setting, architecture gate, coverage floor or test timeout was
increased for this optimization.

Measurements are bytes, with the same release-profile toolchain and fixtures:

| Consumer | Raw before | Raw after | Brotli before | Brotli after | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Button | 25,790 | 22,000 | 3,360 | 3,294 | WARN |
| Table basic | 174,934 | 162,629 | 28,294 | 26,695 | WARN |
| Kanban | 71,183 | 43,385 | 9,632 | 6,744 | PASS |
| Dialog (all five scenarios) | 52,897 | 48,162 | 9,110 | 8,170 | PASS |
| Pick List + Order List | 116,616 | 110,699 | 14,952 | 14,003 | WARN |
| Menu | 82,113 | 49,278 | 9,967 | 7,505 | PASS |

WARN is the unchanged preventive threshold, not a hard-budget failure.
Button, Table and Pick/Order List still have preventive warnings; these are
not hidden or reclassified. The final list measurement includes the corrected
dark-theme filter surfaces, text, placeholders and focus rings.

The npm artifact is 650,041 packed bytes / 4,370,076 unpacked bytes, with
346 files, no published source maps and no broken source-map references.
116 source maps remain available in the separate debug artifact.

## Implementation

- Button tone/variant rules share private style variables while retaining
  existing public theme overrides, hover, disabled, loading and focus behavior.
- Kanban's fixed movement controls use Neural-owned internal button markup and
  the shared Neural interaction mixin, without retaining the entire generic
  Button component. All four directions, labels, disabled/busy states and
  keyboard handlers remain.
- Fixed icon fallbacks are independently tree-shakable. Dialog retains its close
  geometry; Pick/Order List retain their required directional geometries.
  Consumer-supplied icon resolvers are unchanged.
- Conservative AST-based grouping keeps each retained class's metadata and
  initialization together, allowing unused sibling classes to be removed.
  Effectful or unsafe candidates are not transformed.
- Table's static implementation closure is consolidated once, behind an
  export-only public facade. Existing internal import paths remain compatible
  facades; advanced dynamic imports remain lazy and class identities are shared.
- Button/Table compiled template literals are compacted only when Angular's
  parsed template AST is semantically unchanged. Source templates remain readable.
- Source maps are remapped for transformed implementations. Maps without a
  remaining generated implementation are removed only from their explicit
  generated facade targets.
- Public component inputs, outputs, methods and exported signatures are retained.
  The contract snapshot records the new internal fallback constants and the
  compiled Table facade location, not a removed consumer API.

## Verification

The complete canonical command passed on stable final source:

```bash
NEURAL_UI_BUNDLE_PROFILE=release NEURAL_UI_ANGULAR_22_CONSUMER=1 npm run verify:release
```

- 3,230 tests / 207 files; coverage: 96.90% statements, 95.06% branches,
  95.94% functions and 98.14% lines, above the unchanged 95.01% floor.
- 10 optimizer regression tests: semantics, effects, tree-shaking, identities,
  lazy imports, maps, template equivalence and idempotence.
- Angular partial linker accepts all 121 compiled modules.
- Frozen consumer budgets, entrypoints, CVA contracts, Table architecture,
  source duplication, logical CSS, public contracts and documentation audits pass.
- Schematics, strict template fixtures, fresh packed Angular 22 consumer,
  package imports, tarball SSR and release-artifact integrity checks pass.
- Full public contract audit: 101 entrypoints, 877 exported declarations,
  1,481 bindings and 5,332 classified symbols; no removed public signatures.

An earlier run was invalidated by editing documentation during coverage
collection. Another run inherited an offline flag while creating a fresh empty
npm cache. Neither was accepted as successful; the full stable run above
completed without either execution condition.

## Browser checks and scope

Real-browser checks cover the affected consumer flows, not just screenshots:

- Button mouse/keyboard activation, six tones and three variants, disabled/loading.
- Kanban's four movement directions and keyboard activation.
- Dialog close geometry, footer layout, Escape and restored trigger focus.
- Pick List filtering/transfer and Order List filtering/reordering; final dark
  filter colors and visible focus rings checked against the final packed artifact.
- Menu keyboard/submenu navigation and Escape.
- Table filtering, editing, expansion and sorting; final three-state sort glyphs,
  pagination, page-size changes and a downloaded valid XLSX with four sheet rows.
- All ten final Table feature routes load their renderers without page errors.
- Desktop/tablet/mobile checks at widths 1,440, 768 and 390 for the affected
  component pages; no document-level horizontal overflow. Kanban's bounded
  internal horizontal scrolling is intentional.
- The new home slogan is checked in English and Spanish at all three widths.
  Final browser console check reports no errors or warnings.

This follow-up does not replace full-catalog manual QA or claim zero bugs.
Selecting the final V2 version, the public showcase URL and explicit publication
approval remain separate release steps.
