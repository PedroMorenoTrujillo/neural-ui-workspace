# Release checklist

## Non-negotiable release order

1. Freeze scope and choose the next Semantic Version. Never reuse or move an existing tag.
2. Update the library package version, changelog, generated README metrics and quality-matrix evidence on the release commit.
3. Run `npm ci`, `npm run verify:release:automated` and `npm run verify:release` from a clean checkout.
4. Require a named human reviewer for changed visual baselines and record the five free assistive-technology results. Unresolved cells stay `UNVERIFIED`; automation and Codex cannot self-approve them.
5. Push the verified release commit, then create and push the exact matching `vX.Y.Z` tag. The protected tag workflow is the only npm publisher.
6. Wait for the GitHub workflow and public npm package to succeed. A pushed tag is not proof of publication.
7. Only after npm exposes the exact version, update the independent showcase dependency, lockfile and visible `libVersion` badge to that version.
8. Run the showcase strict version and release gates, then push showcase `main`. That push deploys the documentation site.
9. Install the exact public version in a clean consumer and verify package imports, the public badge and the deployed showcase.

## Required checks

- Review changelog, deprecations, migrations and support ranges.
- Review production dependency licenses and security advisories.
- Verify the packed artifact in the independent showcase and Angular 19–22 consumers.
- Keep registry credentials exclusively in the protected GitHub workflow.
- Do not weaken `verify:release`, bypass human evidence or pre-announce an unpublished version in the showcase.

## Showcase version contract

The showcase must use one exact published version in all three locations:

- `package.json` → `dependencies["@neural-ui/core"]`
- `package-lock.json` → root dependency and resolved npm package
- `projects/showcase/src/app/app.ts` → `libVersion`

`npm run verify:version-badge` rejects drift. `verify:version-badge:local` is only for an unpublished package rebuilt from the sibling workspace and must never be used as deployment evidence.
