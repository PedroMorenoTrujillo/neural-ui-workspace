# Local pre-publication review — 2026-10-10

No package was published, pushed, or deployed. This is a reviewed working-tree
preview, not certification of a V2 release. Package metadata remains 1.15.0;
the final V2 release version still needs selection.

## Functional fixes and evidence

The latest correction keeps optimistic URL parameter state visible until its
pending Router navigation settles. Deferred-navigation regressions cover queued
writes, older completion, cancellation and cleanup. Public API is unchanged.

The complete canonical suite passes: **3,230 tests / 207 test files**.
V8 coverage is 98.14% lines, 96.90% statements, 95.94% functions and 95.06%
branches; all satisfy the unchanged **95.01%** minimum. Meaningful extra tests
cover focus/editor lifecycle, uploader projection/focus, locale changes,
number parsing and stepping, malformed tree hierarchies and server lifecycle.
Four Table/TreeTable benchmark-capture tests have a local 20-second timeout under V8
instrumentation. Their samples, algorithm/performance budgets and the global
test timeout remain unchanged.

Angular 22.2.2 packed-consumer compilation and SSR pass, including all 27 form
controls and the affected overlay, menu, list, table and Kanban components.
The application-owned public icon resolver is exercised in SSR and Chromium
hydration: DOM reuse, preserved focus, no duplicate SVGs, no NG050x, one first
action and a reactive icon update. The obsolete icon-provider fixture was fixed;
this was test-fixture drift, not a newly discovered icon runtime defect.

Public contracts, CVA ownership, entrypoints, Table architecture, strict
single-implementation checks, logical CSS, positive/independent-negative Table
typing, schematics, imports, SSR smoke, package format and release-artifact
checks pass. README metrics are regenerated from the complete canonical run.
The dependency audit after compatible Angular/Vitest updates reports zero known
findings; this is not a guarantee of no undiscovered vulnerabilities.

## Bundle gate — still failing, not waived

Package and aggregate budgets pass, as does the architectural lazy-loading
boundary. Ten consumer scenarios exceed historical hard ceilings: Button,
Table basic, Kanban, five Dialog scenarios, PickList/OrderList and Menu.
No baseline, numeric budget or threshold has been raised to obtain a pass.
The release-verification chain is therefore **not green**.

For Table basic, raw size is 174,934 bytes against the old 174,439 baseline;
gzip improves from 34,670 to 33,838 bytes, but Brotli is 28,294 versus the
25,692 baseline and exceeds its 26,977-byte ceiling. Advanced filters, editors,
selection and export still remain outside the basic initial closure. A changed
compiler/chunk/compression environment must not be disguised as an eager-feature
regression or as a certified historical-baseline comparison.

The old compression metadata was internally inconsistent. The official Node
22.22.3 Darwin ARM64 archive was checked against its published SHA256
`0da7ff74ef8611328c8212f17943368713a2ad953fb7d89a8c8a0eae87c23207`:
it reports zlib 1.3.1-e00f703 and Brotli 1.1.0, not the old policy's 1.2.12/1.2.0.
The policy now truthfully records the measured Node 24.15.0 / Angular 22.2.2
toolchain and preserves the historical metadata and **all numerical ceilings**.
CI runtime pins match that toolchain. No CI publication workflow was executed.
Source: https://nodejs.org/download/release/v22.22.3/SHASUMS256.txt

## Slider accessibility correction

The complete Showcase accessibility scan found 18px interactive Slider targets.
The control now uses a 24px hit area while preserving its 18px visual thumb,
including vertical orientation. The native horizontal numeric axis is explicitly
LTR, matching the range mode, fill positioning and keyboard contract even when
surrounding labels are RTL. The previous native RTL thumb and fill disagreed.
The native vertical input's logical dimensions now respect its vertical writing
mode: its physical height is 200px, not 24px. The shorter native input previously
disagreed with the visual track and produced incorrect track-click values.
Fresh packaged checks cover geometry, track/edge clicks, keyboard increments,
application-owned values, read-only/disabled states, both themes, orientations
and text directions in three engines. Their final receipt is in the Showcase
review; source-only development probes are not package certification.

## Showcase provenance

The corrected private preview is SHA256
`b3c166229d6a3f8fdfc53e63abbbb88e0edb6072e9f16ee8c392df834617db3e`,
built from clean source `b45975dd39d4f38f4db40e1dc91f94d6a046fbed`.
Relative to the previous c93 preview, only Slider's FESM and map changed.
Public types and every other component FESM remain byte-identical. This report
was amended after packing; it does not change the runtime artifact. The final
committed-source coverage and browser receipts are retained in the Showcase.

The previous private preview was SHA256
`c93b2d0f76fce5dada38656c5c1d6595cfbe799f112316b31fccbf2da0b3ebd1`.
Compared with the 3789 preview used for the completed 94-configurator campaign,
only the URLState FESM and its map differ. All component FESM and public types
are byte-identical. The earlier browser receipts remain explicitly historical;
this byte comparison and final fresh-package checks establish their scope.

## Remaining publication decisions

Consumer budget failures require safe optimization or an explicitly reviewed
feature/baseline decision; they are not waived here. Final release metadata and
certification remain pending. The Showcase's public V2 origin is unknown until
Vercel supplies it, so production canonicals, sitemap origin and the V1 → V2
link must be configured then. Local development remains noindex.
