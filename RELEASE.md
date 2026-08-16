# Release checklist

- Confirm the quality freeze scope and candidate version.
- Review changelog, deprecations, migrations and support ranges.
- Run `npm ci` and `npm run verify:release` from a clean checkout.
- Review production dependency licenses and security advisories.
- Verify the packed artifact in the independent showcase and Angular 19–22 consumers.
- Require a named human reviewer for changed visual baselines.
- Record unresolved manual accessibility checks and never convert them to automated passes.
- Publish only from the protected release workflow; never commit registry credentials.
- After publishing, install the exact public version in a clean consumer and verify its version badge and imports.
