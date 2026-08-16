# Contributing to Neural UI

Neural UI accepts accessibility, correctness, documentation, performance and maintenance contributions. New components and product features remain frozen while the quality program in [QUALITY_PROGRAM.md](./projects/ui-core/QUALITY_PROGRAM.md) is active.

## Development setup

Requirements are Node.js 20 or 22, npm 10 and Git. Then run:

```bash
npm ci
npm test
npm run verify:release
```

The release gate builds the package, validates public contracts and schematics, imports all entry points, performs SSR smoke tests and compiles clean Angular 19–22 consumers. It may need npm registry access for those temporary consumers.

## Pull requests

- Create a focused branch and keep unrelated changes out of the pull request.
- Add tests that fail before a behavior fix and pass afterward.
- Preserve standalone, signals-first, OnPush, zoneless and SSR-safe behavior.
- Use logical CSS and test runtime LTR/RTL changes for directional interactions.
- Update public API documentation, the changelog and migration guidance when applicable.
- Do not update visual baselines without explicit human review.
- Do not include generated credentials, private reports or paid-service dependencies.

All contributions are provided under the repository's MIT license. Review and merge timing is best effort; no response SLA is promised.
