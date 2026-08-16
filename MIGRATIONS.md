# Migration policy and guide

## Before upgrading

1. Read the relevant section of [CHANGELOG.md](./CHANGELOG.md).
2. Align Angular and Angular CDK to a supported version from [SUPPORT.md](./SUPPORT.md).
3. Upgrade Neural UI in a branch and run the consumer application's build, unit, SSR and end-to-end tests.
4. Resolve documented deprecations before the removal release.

## Automated migrations

When a release needs a mechanical source or configuration change, Neural UI provides an idempotent Angular schematic and documents the exact `ng update` or `ng generate` command. A migration must be safe to rerun and covered by the schematics gate. If an automated transformation cannot be made safely, the release supplies explicit manual steps and does not claim automation.

## Current 1.x line

Neural UI 1.12.x introduces no mandatory migration from 1.11.x. Existing public APIs remain compatible. Consumers adopting the testing entry point can import harnesses from `@neural-ui/core/testing` without relying on internal DOM selectors.

Major-release migration guides will be added here before the corresponding stable release.
