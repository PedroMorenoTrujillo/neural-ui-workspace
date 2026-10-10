# H9-B4 authoritative bundle policy

H9-B4 replaces the historical 3,400 KiB aggregate-raw blocker. The source of truth is
`scripts/h9-b4-bundle-policy.json`; `npm run audit:bundle` generates the full ledger and enforces
consumer, package, and architectural boundaries.

## What is authoritative

- Consumer builds use minified ESM with Angular, CDK, and RxJS external. The Button
  **component-only** scenario additionally externalizes `@neural-icons/*`, matching the historical
  `@ng-icons/*` boundary; its renderer-bundled end-user closure is reported separately, not budgeted.
  Raw bytes are canonical; gzip level 9 and Brotli quality 11 are compressed trend signals.
- An unused root import must retain exactly zero runtime bytes.
- The publish projection must contain zero source maps and zero `sourceMappingURL` references.
- Runtime dependencies, entrypoint cycles, duplicated shared implementations, Table's lazy/core
  boundary, accidental heavy dependencies, and Dialog's lack of CDK drag/drop are hard gates.
- Package packed and unpacked sizes are hard-budgeted from the measured H9-B4 package projection.
- Aggregate raw size is diagnostic. Aggregate Brotli warns at 500 KiB and reaches diagnostic failure
  at 512 KiB; neither aggregate metric can hide a green or red consumer/architecture result.

The warning/failure headroom is deliberately small: consumer raw budgets use 1%/2.5% (with
128/256-byte floors), and compressed budgets use 2%/5% (with 64/128-byte floors). Package budgets
use 1%/3%. Aggregate diagnostics use 32/64 KiB raw and 12/24 KiB gzip headroom.

## Interpreting basic and advanced scenarios

Angular standalone templates retain a component implementation atomically. Tree, Dialog, and
ColorPicker therefore have identical basic and advanced consumer closures today. That result is
recorded rather than disguised as input-level tree shaking. Dialog retains no CDK drag/drop
dependency, and Tree retains its own runtime-selectable drag/drop support but no separate virtual-list
entrypoint. ColorPicker's internal-ID retention remains a REL-01A package-remediation candidate.

Table is intentionally different: `table-basic` measures the entry plus recursively static-imported
chunks of the sole final `@neural-ui/core/table` facade in a code-split build. It excludes dynamic
advanced-filter, editor, CSV, JSON and XLSX implementations and asserts that all five exist only in
the lazy closure. `table-advanced-lazy` measures static **plus** dynamic output chunks of the same
consumer, so it is no longer an alias of BASIC. Compression is summed per output. The frozen
historical `table-basic` baseline (30,198 raw bytes) measured the removed TableCore component and
is **not comparable** to this final Table closure. Its red result remains visible; no budget was
raised in REL-01A. The full-facade historical advanced baseline is likewise context, not proof of
a current BASIC budget.

## CI cadence

- Pull requests set `NEURAL_UI_BUNDLE_PROFILE=pr`: root, provider, Button, Table basic/lazy,
  ColorPicker basic, package integrity, and every architectural hard gate.
- Main sets `NEURAL_UI_BUNDLE_PROFILE=main`: the complete representative consumer ledger.
- Tagged release verification sets `NEURAL_UI_BUNDLE_PROFILE=release`: the full ledger plus the
  existing publish-package/source-map artifact verification. Publication still requires the
  separate release workflow and is not authorized by this policy.
