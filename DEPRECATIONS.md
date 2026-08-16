# Deprecation policy

Neural UI follows Semantic Versioning.

- Deprecations are additive in a minor release and are documented in code, API documentation, the changelog and migration guide.
- A deprecated public API remains functional for at least one subsequent minor release.
- Removal or an incompatible behavioral change normally occurs only in a major release.
- A security or data-integrity issue may require faster removal. The security advisory and changelog must explain the exception and provide the safest available migration.
- Internal DOM and CSS implementation details are not public contracts unless documented as public selectors, tokens or harness APIs.

Deprecation warnings must identify the replacement and target removal release when known. A release may not silently delete an exported entry point, selector, input, output, token or public harness; the public-contract gate enforces that review boundary.
