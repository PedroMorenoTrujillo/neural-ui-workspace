# Angular compatibility and publication

Neural UI is developed and published with Angular 21.2.19. Its single standard
Angular Package Format artifact is certified against representative Angular 19,
20, 21, and 22 consumers. The supported peer range is exactly
`>=19.0.0 <23.0.0`; certification does not imply that every patch release in
each major was tested.

## Certified toolchains

| Consumer | Angular framework/compiler | CLI/build    | CDK          | TypeScript |
| -------- | -------------------------- | ------------ | ------------ | ---------- |
| 19       | 19.2.25                    | 19.2.27      | 19.2.19      | 5.8.3      |
| 20       | 20.3.30                    | 20.3.35      | 20.2.14      | 5.9.3      |
| 21       | 21.2.19                    | 21.2.19      | 21.2.14      | 5.9.3      |
| 22       | Current 22.x matrix target | Current 22.x | Current 22.x | 6.0.x      |

The publication compiler stays on 21.2.19 because the resulting partial-compiled
artifact links and runs cleanly in all four certified majors after using
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
representative Angular 19, 20, 21, and 22 consumers. Each consumer must pass package
resolution, production and SSR builds, strict valid/invalid templates, runtime
smoke tests, schematics, and style compilation without `--force` or
`--legacy-peer-deps`.

Recommended cadence:

- Every pull request: clean install, reference build, focused compatibility guard,
  package audits, and Angular 19/22 compile smoke.
- Nightly: the full Angular 19/20/21/22 strict-template, SSR, runtime, and schematics
  matrix.
- Release: rebuild and pack once, verify the tarball hash, then run the complete
  clean-consumer matrix against that immutable artifact.
