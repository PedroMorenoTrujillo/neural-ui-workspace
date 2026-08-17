# Neural UI Quality Program

Status: active quality freeze
Started: 2026-08-15

## Objective

Reach a technically controllable 10/10 quality level for Neural UI before adding new components or product features. Quality is evaluated through reproducible evidence, not feature count or marketing claims.

## Freeze and scope

- New components and product features are frozen until the technical quality gate is complete.
- Site Composer is explicitly out of scope.
- Figma workflows and artifacts are explicitly out of scope.
- Paid services, paid certifications, time-limited services that later charge, Chromatic, Percy, BrowserStack and paid JAWS validation are not allowed.
- Local and open-source tooling is preferred. Built-in platform accessibility tools may be used without claiming external certification.
- Existing user changes outside this program must remain isolated and must not be overwritten.

## Technical score

The technical score has ten equally weighted dimensions:

1. Release integrity
2. Accessibility
3. RTL and internationalization
4. Tests and public harnesses
5. Visual and responsive quality
6. Performance and bundle size
7. Documentation and developer experience
8. Angular 19-22, SSR and zoneless compatibility
9. Security and governance
10. Evidence in real consumers

A dimension cannot be declared complete while an applicable matrix cell is `FAIL`, `BLOCKED` or `UNVERIFIED`. Scores cannot average away a critical failure, and every `N/A` requires a written rationale.

Adoption is tracked separately. Downloads, dependants, community participation and third-party trust cannot be converted immediately into a technical 10/10 and must never be presented as parity with Angular Material or PrimeNG without external evidence.

## Evidence rules

- Every result identifies the library version, source commit, environment and verification date.
- Automated checks link to executable tests or scripts.
- Manual accessibility and visual reviews identify the tester, platform, browser, assistive technology and reviewed commit.
- Historical evidence is labelled as historical until reproduced on the release candidate.
- JAWS is reported as not validated because it is paid; it is never silently treated as passing.
- Visual baselines cannot be created or replaced without explicit human approval.

## Execution order

1. Maintain the entry-point quality matrix.
2. Close the release and visual gates.
3. Complete WCAG 2.2 AA and manual assistive-technology review.
4. Complete static and dynamic RTL.
5. Add harnesses for every interactive component.
6. Reduce unjustified inline styles to zero.
7. Establish public performance budgets and fair comparison fixtures.
8. Publish governance, support, deprecation and migration policies.
9. Validate the built package in the showcase, Angular 19-22 fixtures and an additional real consumer.

The canonical entry-point status is generated in [QUALITY_MATRIX.md](./QUALITY_MATRIX.md) from [quality/entrypoint-quality-matrix.json](./quality/entrypoint-quality-matrix.json).

## Operating model

The program is designed for one maintainer assisted by Codex. Work is split into reviewable phases, kept on a dedicated branch and merged only after the applicable gates pass. Automation may collect evidence and propose fixes, but it cannot approve visual baselines or claim manual assistive-technology results.

All required tooling must be free to use and local or open source where applicable. The approved stack is Angular CLI/CDK, Vitest, Playwright, axe-core, Lighthouse CI, Size Limit, browser performance APIs, NVDA, Narrator, VoiceOver and TalkBack. JAWS remains explicitly not validated because paid software is outside this program.

## Phase plan

### P0 — Isolation and reproducible baseline

Dependencies: none.

Deliverables:

- Dedicated `codex/*` worktree branches for core and showcase.
- Recorded versions, commits, environment and dirty-worktree state.
- Feature freeze and scope rules in this document.

Acceptance:

- The original user checkout has not been modified by the program.
- Every later evidence record identifies the candidate commit and environment.

Verification:

```bash
git branch --show-current
git status --short
git diff --check
```

Risk: accidental overlap with user work. Mitigation: never reset, clean, amend or overwrite unrelated changes; stop when an overlapping edit cannot be isolated.

### P1 — Canonical 90-entry-point quality matrix

Dependencies: P0.

Deliverables:

- Machine-readable matrix covering tests, states, CVA, keyboard, ARIA, assistive technology, RTL, responsive layout, visual evidence, harnesses, documentation, performance, SSR and Angular 19–22.
- Generated human-readable report with explicit `PASS`, `FAIL`, `BLOCKED`, `UNVERIFIED` and justified `N/A` states.

Acceptance:

- Exactly 90 public entry points are represented once.
- Unknown evidence remains `UNVERIFIED`; it is never inferred as passing.
- Applicable failures and missing rationales fail the strict completion gate.

Verification:

```bash
npm run quality:matrix
npm run audit:quality-matrix
```

Risk: false confidence from aggregate coverage. Mitigation: completion is per entry point and per dimension; averages cannot hide critical gaps.

### P2 — Release integrity and visual custody

Dependencies: P1.

Deliverables:

- Correct public metrics and a single reproducible release gate.
- Angular 19–22 fixture builds that import every published entry point.
- Baseline manifest containing count, digest and human approval metadata.

Acceptance:

- Unit tests, coverage, package build, 90 entry points, CVA, bundle budgets, logical CSS, public contracts, schematics, imports, SSR, package contents, `publint`, `attw` and Angular 19–22 all pass.
- All 464 tracked visual baselines match the reviewed candidate set.
- Baseline digest is approved by a named human reviewer and matches Git exactly.

Verification:

```bash
npm run verify:release:automated
npm run verify:release
cd ../neural-ui-showcase
npm run audit:visual-manifest
npm run test:visual
npm run audit:visual-approval
```

The automated gate must complete independently. The full release gate then runs the same checks and finishes with the strict matrix, which requires the named human visual and assistive-technology evidence.

Risk: accepting intended accessibility changes as visual truth without review. Mitigation: snapshot updates and approval are separate operations; Codex never performs the approval.

### P3 — WCAG 2.2 AA and assistive technology

Dependencies: P2 baseline custody; fixes may iterate with P2 visual review.

Deliverables:

- Automated axe-core audits for every documented route, ES/EN and light/dark appearance using WCAG 2.2 AA tags.
- Per-interactive-entry-point keyboard, focus, states, name/role/value and WAI-ARIA APG evidence.
- Manual matrix for NVDA and Narrator on Windows, VoiceOver on macOS/iOS and TalkBack on Android.

Acceptance:

- Zero critical, serious, moderate or minor automated violations in the audited scope.
- Every interactive entry point has a documented keyboard path and expected announcements.
- Manual results identify tester, OS, browser, assistive technology version, commit and date.
- JAWS is labelled `NOT_VALIDATED_PAID`, never `PASS`.

Verification:

```bash
cd ../neural-ui-showcase
npm run audit:a11y:built
npm exec playwright test e2e/accessibility.spec.ts
```

Risk: axe passing while interaction remains unusable. Mitigation: automated evidence cannot fill manual screen-reader or keyboard cells.

### P4 — Bidirectional layout and dynamic direction

Dependencies: P3 interaction contracts.

Deliverables:

- Angular CDK `Directionality` integration and a documented direction API.
- Logical CSS for all layout-sensitive rules.
- Runtime LTR↔RTL switching without reload, overlay misplacement or stale state.
- Unit, E2E, responsive and visual RTL evidence per applicable entry point.

Acceptance:

- No unjustified physical-direction declaration passes the logical CSS audit.
- Keyboard semantics follow the applicable APG pattern in both directions.
- The showcase can switch direction dynamically and restore LTR in the same session.

Verification:

```bash
npm run audit:logical-css
cd ../neural-ui-showcase
npm exec playwright test --grep @rtl
npm run test:visual
```

Risk: mirroring visuals while event semantics remain LTR. Mitigation: direction-change and keyboard assertions are mandatory in addition to screenshots.

### P5 — Public test harness coverage

Dependencies: P3 and P4 stable interaction contracts.

Deliverables:

- Public Angular CDK harness for every interactive component.
- Harness contract tests for state, actions, disabled behavior and overlays.
- Testing guide and migration-safe selector policy.

Acceptance:

- Every matrix entry marked `INTERACTIVE` has a public harness export and contract test.
- Consumer fixtures use only public harness APIs and work on Angular 19–22.

Verification:

```bash
npm test
npm run audit:entrypoints
npm run test:compat:matrix
```

Risk: brittle harnesses coupled to internal DOM. Mitigation: semantic host selectors and public behavior only.

### P6 — Responsive quality and inline-style debt

Dependencies: P2 visual custody and P4 RTL.

Deliverables:

- Responsive coverage at 320, 360, 390, 768 and desktop widths in Chromium, Firefox and WebKit.
- Inventory classifying every inline style as required runtime geometry or removable debt.
- Static classes, CSS variables or stylesheet rules replacing all unjustified inline styles.

Acceptance:

- Zero horizontal document overflow, clipped required controls or inaccessible content in the complete responsive matrix.
- Unjustified inline-style count is zero; every retained dynamic style has a recorded rationale and test.

Verification:

```bash
cd ../neural-ui-showcase
npm run audit:responsive
npm run audit:standards
npm run test:visual
```

Risk: mechanically removing dynamic geometry breaks virtualization, drag/drop or overlays. Mitigation: classify first and require behavioral evidence for retained styles.

### P7 — Performance and bundle laboratory

Dependencies: stable P3–P6 behavior and layouts.

Deliverables:

- Reproducible local fixtures for cold load, interaction latency, large tables/lists, overlays and SSR hydration.
- Lighthouse CI, browser Performance API and Size Limit budgets committed to Git.
- Fair comparison methodology using only MIT/free Angular Material and, if included, PrimeNG 21 MIT fixtures with equivalent content and production builds.

Acceptance:

- Every applicable entry point has a measured budget or justified `N/A`.
- Regressions fail CI using stable statistical thresholds and recorded hardware/runtime metadata.
- Published comparisons include raw data, fixture source, versions and limitations; no unsupported superiority claim is made.

Verification:

```bash
npm run audit:bundle
npm run perf:build
npm run perf:test
npm run size-limit
npm run lighthouse:ci
```

The last four commands are deliverables of this phase and must exist before the phase can pass.

Risk: noisy local benchmarks and misleading competitor comparisons. Mitigation: warm-up, repeated samples, medians/percentiles, pinned versions and identical fixtures.

### P8 — Governance, security and lifecycle

Dependencies: P2 release contract; can proceed in parallel with P5–P7.

Deliverables:

- `SECURITY.md`, `CONTRIBUTING.md`, support and Angular-version policy.
- SemVer, deprecation duration, migration/schematic policy and response expectations.
- Local dependency/license audit and release checklist.

Acceptance:

- Policies are public, internally consistent, free of paid-service requirements and linked from the READMEs.
- A documented deprecation fixture proves warnings and migration behavior without silent breakage.
- Security reporting has a private, usable route controlled by the maintainer; no response SLA is promised unless sustainable.

Verification:

```bash
npm run audit:public-contracts
npm run test:schematics
npm run verify:release
```

Risk: aspirational policies that one maintainer cannot honor. Mitigation: publish response targets and compatibility windows only when operationally sustainable.

### P9 — Consumer evidence and technical completion

Dependencies: P2–P8.

Deliverables:

- Showcase consuming only the packed release candidate.
- Angular 19–22 compatibility fixtures and at least one additional real local consumer.
- Final matrix with every applicable technical cell passing and every `N/A` justified.

Acceptance:

- Core and showcase release gates pass from clean installs using the packed artifact.
- No undocumented deep imports or workspace-only resolution are required.
- The final report calls the result “technically controllable 10/10” only when all applicable cells pass.

Verification:

```bash
npm ci
npm run verify:release:automated
npm run verify:release
cd ../neural-ui-showcase
npm ci
npm run verify:release
```

Risk: the monorepo hides packaging defects. Mitigation: install the tarball into isolated fixtures and the independent consumer before release.

## Technical completion versus adoption

Technical completion is controlled by repository work: correctness, accessibility evidence, RTL, tests, harnesses, responsiveness, visual review, performance budgets, documentation, compatibility, security and governance. It can reach 10/10 when the strict matrix is fully evidenced.

Adoption is a separate longitudinal score made from independently verifiable signals such as downloads, real dependants, community contributors, issue response history, external audits and production case studies. It cannot be made 10/10 by code changes, generated demos or marketing text, and parity with Angular Material or PrimeNG must not be claimed until third-party evidence supports it.

## Recommended checkpoints

- Merge P0–P2 only after the core gate is green and changed visual baselines receive human approval.
- Merge P3–P4 after automated evidence is green and the available manual platform matrix is recorded honestly.
- Merge P5–P6 in small component families so one maintainer can review behavior and screenshots.
- Merge P7–P9 only with reproducible raw evidence and no paid infrastructure dependency.
