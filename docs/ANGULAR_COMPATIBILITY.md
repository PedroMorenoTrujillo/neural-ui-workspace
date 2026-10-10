# Angular 22 compatibility and publication

Neural UI 2.x is developed, published, and certified exclusively with Angular 22.
The published peer range is `>=22.0.0 <23.0.0`; Angular 19, 20, and 21 consumers
remain on the Neural UI 1.x release line.

## Certified toolchain

| Consumer | Angular framework/compiler | CLI/build | CDK    | TypeScript |
| -------- | -------------------------- | --------- | ------ | ---------- |
| 22       | 22.1.6                     | 22.1.8    | 22.1.6 | 6.0.3      |

The workspace uses Node `^22.22.3 || ^24.15.0 || >=26.0.0`, matching the Angular
22.1 toolchain requirement. RxJS remains on the compatible 7.8 line.

## Source and runtime rules

- Use the standard Angular 22 package format without version-specific source forks.
- Import public Angular APIs from their documented entrypoints.
- Remain fully zoneless: do not depend on Zone.js and do not configure zone-based
  change detection.
- Use only the stable `provideZonelessChangeDetection` API in explicit consumer
  and SSR/hydration fixtures.

`npm run test:angular-compatibility` guards the Angular 22-only manifests and
stable zoneless setup. The production build compiles all templates with Angular
22, while `npm run test:compat` packs the library and validates the immutable
artifact in a fresh Angular 22 consumer.

## Release reproduction

Release validation starts with a clean `npm ci`, builds and packs with Angular 22,
then installs that exact tarball into a fresh Angular 22 consumer. The consumer
must pass ordinary peer resolution, production and SSR builds, schematics, runtime
smoke checks, and style compilation without `--force` or `--legacy-peer-deps`.
