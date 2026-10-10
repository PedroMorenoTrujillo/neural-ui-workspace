# N2-A3 — Simple display

Status: **A3 COMPLETE — READY FOR A5**. This checkpoint is uncommitted, as requested.

## Scope and decisions

Audited `NeuAvatarComponent`, `NeuAvatarGroupComponent`, `NeuCardComponent`, `NeuDividerComponent`, `NeuSkeletonComponent`, and `NeuSpinnerComponent`. No new feature, API, state owner, effect, timer, document/window listener, Router, storage, overlay, or icon dependency was introduced.

| Component | Audit and decision |
| --- | --- |
| Avatar | Existing image-error fallback is ephemeral and recovers when `src` changes; size/shape/color use existing tokens. Fixed duplicate screen-reader naming: the containing `role=img` owns a provided `alt` or `name`, while the nested image has empty `alt`. An unnamed avatar is decorative rather than announcing a generic “Avatar”. Initials and presence marker remain hidden from accessibility APIs. |
| AvatarGroup | Projects child avatars; optional labelled `group` semantics do not duplicate child names. It has no overflow counter or hidden-child feature, so no invented overflow policy. Dependency on Avatar is by composition, not imported runtime. |
| Card | Header/body/footer projection and clipping surface are presentational. No landmark role or state owner was added. |
| Divider | `role=separator` and horizontal/vertical ARIA orientation are applied. Its symmetric label padding and flex presentation remain RTL-safe. |
| Skeleton | Decorative `aria-hidden=true`; CSS disables shimmer under reduced motion. Consumer owns loading/busy state. |
| Spinner | One `role=status` live region with either visible label or screen-reader-only fallback. SVG is hidden. CSS respects reduced motion. |

## Verification

- Directed Angular tests: **6 files, 48/48 PASS**. The audit strengthened Avatar accessible-name/decorative assertions and Divider/Skeleton semantics.
- Production Angular library compilation: **PASS** (`ng build ui-core --configuration production`).
- Representative Angular 22 zoneless SSR + real Chromium hydration: **PASS** via `scripts/test-n2-a3-hydration.mjs`. SSR contains all six components and hydration annotations; DOM is reused, first signal update works once, and there are **0 NG050x** diagnostics. The fixture uses only the six final public entrypoints, copies only their package files into a temporary consumer, creates no symlink, and removes its temporary directory.
- A11y: semantic/source audit plus directed DOM assertions above; no interactive keyboard contract exists for these display components.
- Bundle method: Angular-compiled published-package ESM, esbuild minified consumer, Angular/RxJS external, gzip level 9, Brotli quality 11. Sizes in bytes:

| Consumer | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| Avatar | 7,633 | 1,838 | 1,549 |
| AvatarGroup | 2,632 | 855 | 735 |
| Card | 5,307 | 1,160 | 998 |
| Divider | 3,333 | 955 | 797 |
| Skeleton | 3,698 | 1,035 | 886 |
| Spinner | 6,993 | 1,513 | 1,298 |
| Combined A3 | 29,551 | 4,811 | 4,077 |
| Root-unused | **0** | — | — |

The only runtime delta is Avatar accessibility markup; no material format/dependency retention is introduced. Baseline is a package-consumer measurement, not a whole-application/browser claim.

## Portfolio and file ledger

Regenerated solely through `scripts/generate-n2-component-portfolio.mjs --write`; its drift gate passes. Current source-derived partition: **98 public components = 38 completed + 58 pending + 2 planned removals**. A3's six rows are completed; **21** implementation batches remain. A1 remains blocked by the separate neural-icons lane.

A3-owned changed/new paths: `projects/ui-core/avatar/neu-avatar.component.ts`, `projects/ui-core/avatar/neu-avatar.component.spec.ts`, `projects/ui-core/divider/neu-divider.component.spec.ts`, `projects/ui-core/skeleton/neu-skeleton.component.spec.ts`, `fixtures/n2-a3-hydration/a3-hydration.component.ts`, `scripts/test-n2-a3-hydration.mjs`, this report, and the portfolio generator/its three generated planning artifacts. The pre-existing foreign untracked `projects/ui-core/tree-table/public_api 2.ts` is untouched. No commit, push, tag, release, or publish was made.

Recommendation: **A3 COMPLETE — READY FOR A5**.
