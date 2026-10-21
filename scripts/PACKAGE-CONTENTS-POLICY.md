# Consumer package policy

`package-contents-policy.json` is the reviewed, explicit inventory of files needed
by consumers. Its initial inventory was checked against the official 2.0.1 npm
tarball. It is deliberately independent of the candidate build: do not regenerate
it from `dist`, since that would approve accidental additions.

- **PUBLIC NECESSARY**: the exact paths listed in justified categories. Includes
  package metadata, license, README, compiled entry points and required shared
  chunks, declarations, public styles/tokens, and the Angular CLI schematics.
- **INTERNAL NOT PUBLISHED**: every unreviewed path, including reports, tests,
  fixtures, screenshots, logs, environment files, backups and extra code files.
  These may belong in Git or external evidence storage but never in the consumer
  tarball without an explicit policy review.
- **DEBUG ARTIFACT SEPARATE**: maps corresponding to reviewed consumer files.
  Full builds retain these temporarily; release preparation removes source-map
  comments, archives maps separately and links both archives by checksums.

`verify:package` checks npm's dry-run inventory, allowing maps only at the full
build stage. `verify:release-artifacts` extracts and checks the **exact tarball**
that the publication workflow later uploads/publishes. The archive check rejects
maps and internal files independently of checksums, file count and byte budgets.
The publish job repeats this verification with `--archives-only` after download.
`test:release-artifacts` includes negative tests with contaminated real `.tgz`
files below the size budget.

A legitimate new file needs an explicit allowlist entry, a reason, and review of
its generated references. Removal needs corresponding review of entry points and
consumer imports. Never relax the policy to a Markdown/JSON/TypeScript extension
rule or automatically accept new files because a build emitted them.

## ATTW support policy

Core targets Angular 22 ESM consumers and Angular's application/bundler toolchain.
CommonJS `require()` consumption is not supported. `audit:package` runs Publint
without ignored diagnostics and ATTW with the existing explicit exclusions
`cjs-resolves-to-esm` and `no-resolution`. The latter covers the legacy Node 10
resolution mode that does not understand Angular package exports; it is not a
supported consumption mode. ESM resolution through Node 16/NodeNext and bundler
resolution remain evaluated by ATTW. Declaration correctness, exported targets,
real Angular consumer builds, schematics, SSR and hydration have separate gates.
An ATTW pass under this policy does not certify unsupported CommonJS/Node 10
consumers or replace those integration tests.
