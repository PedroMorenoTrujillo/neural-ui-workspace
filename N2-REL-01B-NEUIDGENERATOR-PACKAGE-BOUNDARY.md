# N2 REL-01B — NeuIdGenerator package boundary

## 1. Status and decision

**NEEDS DESIGN REVIEW.** REL-01B stopped at the public API governance gate (B5/B6), before any runtime edit. The proposed narrow `foundation` route would add `./foundation#NeuIdGenerator` to the public contract. A new ID-only secondary entrypoint would change the package export map. Both outcomes are explicitly prohibited by this task. No synthetic result is being presented as a productive-package remediation.

## 2. Starting point and reference inventory

- Branch: `v2`; starting commit: `fc0cb57ab7f869703051732575681d8ba2888c69` (`test(release): harden H9 bundle measurement and attribution`).
- The tracked productive TypeScript tree contains **one class definition** and **40 consumer import sites** across 40 component/service files. Those consumers contain **49 `inject(NeuIdGenerator)` calls**. There are no constructor-injection or component-provider sites for this token. The declaration uses `@Injectable({ providedIn: 'root' })`.
- One existing spec contains seven textual references, including two explicit `createEnvironmentInjector([NeuIdGenerator], ...)` registrations that test per-injector counters. The negative package-private fixture contains two references. Six tooling files contain 11 references; the contract snapshot contains eight textual references, representing one `./internal#NeuIdGenerator` exported declaration and its members/bindings. The generated `neural-ui-core-internal.d.ts` has three mentions. Documentation and graph artifacts have further descriptive mentions; these are not runtime imports.
- Counts above are token occurrences or import sites in the stated scopes, not an assumed global “42 references.” The foreign untracked TreeTable file was excluded.

## 3. Existing topology and package contract

- Canonical definition: `projects/ui-core/internal/neu-hydration-internals.ts`, lines 20–30. It maintains a `Map<string, number>`, starts each prefix at zero, increments per call, and returns `${prefix}${next}`. The root provider gives one instance per application injector.
- `projects/ui-core/internal/public_api.ts` re-exports that file. ng-packagr emits `fesm2022/neural-ui-core-internal.mjs` and `types/neural-ui-core-internal.d.ts`; consumers import `@neural-ui/core/internal`. The same source file also defines temporal and responsive services, which the ID-only Kanban and ColorPicker package graphs currently retain.
- `@neural-ui/core/foundation` is an existing **public** secondary entrypoint in the built package export map and in `public-contract.v2.json`. Its public API has no `NeuIdGenerator`. The snapshot does contain `./internal#NeuIdGenerator`.
- An internal re-export of a foundation-owned class could retain one class identity, but Kanban/ColorPicker can only use the narrower foundation package boundary if that symbol is available from its public entrypoint. Exporting it adds a public contract item. Keeping imports at `internal` does not establish the requested narrow package boundary. Adding a private ID subpath creates a new package export. No runtime topology was selected under the authorized constraints.

## 4. Baselines and unperformed after measurements

| Scenario | Productive package before, raw / gzip / Brotli | REL-01A synthetic narrow result | Productive package after |
| --- | ---: | ---: | --- |
| Kanban | 46,636 / 8,446 / 7,390 B | 41,747 / ~7,189 / ~6,246 B | Not measured; no topology change |
| ColorPicker | 63,004 / 12,683 / 11,045 B | 58,084 / ~11,440 / ~9,953 B | Not measured; no topology change |

The synthetic savings are about 4,889 raw / 1,257 gzip / 1,144 Brotli bytes for Kanban and 4,920 raw / 1,243 gzip / 1,092 Brotli for ColorPicker. They do **not** establish actual ng-packagr savings or pass the materiality gate. Their old compiled graphs retain internal temporal/responsive code; no after metafile exists. The internal FESM effect, forbidden cross-consumer retention, source leakage and tree-shaking isolation therefore remain at the REL-01A evidence level, with no REL-01B claim.

## 5. H9 decisions

- **Button:** corrected component-only 16,276 raw / 2,667 gzip / 2,272 Brotli B; PASS against its historical baseline. Keep that baseline. Runtime untouched.
- **Table BASIC:** corrected static initial closure 174,439 raw / 34,801 gzip / 25,692 Brotli B, with advanced filter, active editor, CSV, JSON and XLSX in five separate lazy outputs. The old 30,198 B TableCore historical comparator is not functionally equivalent. A new N2 Table BASIC baseline is **not established**, because REL-01B was stopped before productive remediation. Table runtime untouched.
- **Kanban:** current package consumer remains above its historical H9 ceiling. No after graph or saving; no rebaseline.
- **ColorPicker:** current package consumer remains above its historical H9 ceiling. No after graph or saving; no rebaseline.
- The active H9 policy and tolerance formula were not changed in REL-01B. The requested final policy and two-run post-remediation H9 profile were not run because the B5/B6 stop condition occurred first. Historical trends remain visible in REL-01A evidence.

## 6. Verification and remaining gates

| Requested evidence | Result at stop |
| --- | --- |
| Public API and package exports | Current contract audit PASS: 97 entrypoints, 813 exported declarations, 1,462 bindings. No REL-01B delta. Proposed foundation export would add a public symbol; proposed new subpath would add a package export. |
| Canonical class, DI, ID semantics | Existing one-class/root-provider implementation inspected; existing per-injector ID spec present. No changed topology and thus no new singleton or cross-consumer certification. |
| Cycles | No new import edge was introduced. A future design must prove no foundation ↔ internal cycle. |
| Root-unused / source leakage | REL-01A's corrected six-consumer package audit and 10 focused harness tests PASS under the evidence toolchain; no REL-01B rerun or changed graph. |
| Directed tests, SSR, Chromium hydration, zoneless | Not run for REL-01B after the governance stop. Last certified global state remains the prior 188 files / 2,514 tests. No new SSR, hydration, or zoneless claim. |
| Build, package verify, imports, SSR smoke, publint, Angular 22 tarball consumer | Not rerun for REL-01B; there was no runtime or package topology change. Previous REL-01A PASS evidence remains in `N2-REL-01-PACKAGE-BUNDLE-EVIDENCE.md`. |
| Strict ATTW | Not rerun after topology because topology did not change. Previous classification remains **ATTW STRICT — KNOWN UNSUPPORTED-CONDITION DEBT** (97 CJS→ESM and four Sass diagnostics). |
| Full suite / coverage | No REL-01B suite or coverage run. The 95.01% threshold was not changed. |

The REL-01A evidence audit is sensitive to Node's zlib implementation: this host's Node 22.22.2 (zlib 1.3.1) reproduces its gzip baseline and passes, while Node 22.22.3 (zlib 1.2.12) yields different gzip bytes and fails exact comparison. This does not alter the public API blocker, but the measurement toolchain needs an explicit version decision before another release certification.

## 7. Final recommendation and Git scope

Design review must choose a package boundary that keeps one canonical DI token and does not silently expand the public API or exports, or explicitly authorize a contract change. Until then, do not move the class, rebaseline Kanban/ColorPicker/Table, or claim REL-01 complete. REL-01B has changed only this report; runtime product files, public API, package exports, H9 policy and baselines remain unchanged. The report remains unstaged and uncommitted as required. No push, tag, release or npm publish was performed.
