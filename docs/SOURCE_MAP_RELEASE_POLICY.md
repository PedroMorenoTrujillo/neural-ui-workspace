# Source-map release policy

`@neural-ui/core` is built once with `ng-packagr` in Angular partial-compilation mode. That
complete APF build contains external FESM source maps. Release preparation then derives two
linked artifacts from that one build:

1. `neural-ui-core-X.Y.Z.tgz`, the npm artifact, contains no `.map` files and no
   `sourceMappingURL` comments.
2. `neural-ui-core-X.Y.Z-sourcemaps.tgz`, the debug artifact, contains the exact maps from
   the same build plus a manifest of map, JavaScript and npm-tarball SHA-256 hashes.

`dist/release/release-manifest.json` records both archive hashes and the common build identity.
The debug archive's own manifest records the npm tarball hash; the external manifest records the
debug archive hash (an archive cannot contain its own hash).

Run `npm run build`, `npm run prepare:release-artifacts`, and
`npm run verify:release-artifacts` in that order. `npm run verify:release` performs the complete
sequence and all existing package gates. Preparation fails if maps are unexpectedly absent,
unreferenced, or already broken. Verification fails on archive or manifest hash mismatch, a
published map, any remaining source-map reference, or a packed npm size above 750,000 bytes.

The release workflow uploads the npm and debug archives separately and publishes the already
verified npm tarball. It still uses `NPM_TOKEN`; migration to npm Trusted Publishing should only
replace authentication and add npm provenance, not rebuild or alter either artifact.

To change this policy, update the preparation and verification scripts, this document, and both
workflow artifact paths together. Do not exclude maps with `.npmignore` alone: that leaves broken
references in the published JavaScript.
