# Angular compatibility and publication

Neural UI is developed and published with Angular 21.2.19. The single standard
Angular Package Format artifact is certified against Angular 19, 20, and 21
consumers; Angular 22 remains inside the current peer range but is not certified.

## Certified toolchains

| Consumer | Angular framework/compiler | CLI/build | CDK     | TypeScript |
| -------- | -------------------------- | --------- | ------- | ---------- |
| 19       | 19.2.25                    | 19.2.27   | 19.2.19 | 5.8.3      |
| 20       | 20.3.30                    | 20.3.35   | 20.2.14 | 5.9.3      |
| 21       | 21.2.19                    | 21.2.19   | 21.2.14 | 5.9.3      |

The publication compiler stays on 21.2.19 because the resulting partial-compiled
artifact links and runs cleanly in all three certified majors after using
cross-version source constructs. A controlled Angular 19 publication build was
also evaluated. It required an additional Chart typing/dependency adaptation and
therefore added maintenance cost without improving consumer compatibility.

## Source compatibility rules

- Put a template alias (`; as value`) on a primary `@if` block. Angular 19 does
  not accept aliases on secondary `@else if` blocks when linking partial metadata.
- Import `DOCUMENT` from the public `@angular/common` entrypoint.
- Do not post-process partial Angular metadata or maintain version-specific source
  forks.

`npm run test:angular-compatibility` guards the source shapes that previously
caused Angular 19 linker and ESM import failures.

## Release reproduction

Release validation uses a clean `npm ci`, builds and packs once with Angular
21.2.19, then installs that exact tarball with ordinary `npm install` into fresh
Angular 19.2.25, 20.3.30, and 21.2.19 consumers. Each consumer must pass package
resolution, production and SSR builds, strict valid/invalid templates, runtime
smoke tests, schematics, and style compilation without `--force` or
`--legacy-peer-deps`.

Recommended cadence:

- Every pull request: clean install, reference build, focused compatibility guard,
  package audits, and Angular 19/21 compile smoke.
- Nightly: the full Angular 19/20/21 strict-template, SSR, runtime, and schematics
  matrix.
- Release: rebuild and pack once, verify the tarball hash, then run the complete
  clean-consumer matrix against that immutable artifact.
