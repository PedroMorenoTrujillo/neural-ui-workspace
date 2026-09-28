# N2 — Neural Icons package-coupling investigation

## 1. Status and starting point

**N2 ICON DEPENDENCY DESIGN REVIEW REQUIRED.** There is no safe metadata-only decoupling candidate. `@neural-icons/*` is an intentional runtime and public-type dependency of current Core V2 source, not merely an accidental peer declaration. Removing or optionalizing only the peers would make the package misleading and break a clean consumer of affected public components. No tracked source, package, lockfile, API, test or threshold was changed; no commit, push, tag or publication was made.

Starting branch `v2`, clean HEAD `63de8dc0f1c030722acaae7bdca08f5750151f53`. Core's reported starting certification: 2,889/2,889 tests, coverage 96.96% statements / 95.02% branches / 96.06% functions / 98.14% lines, build/package/contracts/imports/SSR/publint and directed TreeTable Chromium hydration PASS. This report does not treat those historical results as a new verification of a changed candidate.

## 2. Reference inventory and classification

Tracked files were scanned for `@neural-icons/core`, `/angular`, `/react` and `/vue`; installed package and built output were inspected separately. **React and Vue: zero references.** No secondary-entrypoint package manifest declares Icons. The source `projects/ui-core/package.json` is the publishable peer declaration; `ng-packagr` copies it into `dist/neural-ui/core/package.json`. `projects/ui-core/ng-package.json` itself contains no Icons reference. `scripts/build-ui-core.mjs` augments exports/assets but does not add the peers.

| Class | Occurrences | Interpretation |
|---|---|---|
| **A — product runtime import** | 27 productive Core TS files, listed individually below | Static `NeuralIcon` imports from `@neural-icons/angular`; many also import fixed definitions from `@neural-icons/core/icons/*`. These are real compiled dependencies. |
| **B — type-only import** | 16 productive files in total: 14 of the A files plus `internal/neu-menu-action.ts` and `menu-shared/neu-menu-shared.ts` | `NeuralIconName`/`NeuralIconDefinition` participate in public or shared input/item types. Some emitted `.d.ts` files preserve Core imports; others inline the 399-name union. Erasure at runtime does not make the public type contract provider-neutral. |
| **C — demo/test** | 20 component/testing specs; 3 compatibility-consumer fixture files; 10 test/hydration/compatibility scripts listed below | Intentionally exercise the current Icons-backed behavior. Their presence does not establish that a no-Icons consumer works. |
| **D — tooling/workspace** | root `package.json`, `package-lock.json`, `provide-neural-ui.ts` comment, and five audit/generator/navigation-harness scripts listed below | Exact registry packages are workspace development dependencies; lockfile records both. Tooling enforces/tests the selected integration. |
| **E — package metadata only** | `projects/ui-core/package.json` and generated `dist/neural-ui/core/package.json` | Both declare exact **mandatory** peers: `@neural-icons/angular@0.0.1-next.1` and `@neural-icons/core@0.0.1-next.0`. No `peerDependenciesMeta.optional` entry. These declarations correspond to A/B, so they are not stale metadata. |
| **F — historical/reference material** | `N2-A0.2-NEURAL-ICONS-INTEGRATION.md`, `N2-A2-FEEDBACK-STATUS.md`, `N2-COMPONENT-PORTFOLIO.json`, `N2-REL-01-PACKAGE-BUNDLE-EVIDENCE.md`, `N2-REL-01F-FULL-PROFILE-H9-DESIGN-REVIEW.md` | Historical evidence/portfolio references, not productive imports. They would need reconciliation after an approved architectural change; none is deleted as “accidental.” |

Class C file inventory: `projects/ui-core/{alert,breadcrumb,button,empty-state,gallery,image-viewer,input,menu,modal,nav,notification-center,speed-dial,stats-card,tag,toast,toggle-button-group}/*.spec.ts`, `sidebar/neu-sidebar.component.spec.ts`, `sidebar/neu-sidebar.component.stress.spec.ts`, `testing/n2-overlay-events.spec.ts`, `testing/n2-overlay-events.performance.spec.ts`; `fixtures/compatibility-consumer/src/{app.component.ts,main.ts,ssr-icons.mjs}`; `scripts/h9-static-closure.spec.mjs`, `scripts/test-n2-{a1,a2,b1,b2,b3,c3,c6,icons}-hydration.mjs`, `scripts/test-ui-core-compatibility.mjs`. Class D files beyond manifests/comment: `scripts/audit-n2-a1-bundle.mjs`, `scripts/audit-n2-icons-boundary.mjs`, `scripts/audit-n2-icons-bundle.mjs`, `scripts/generate-n2-component-portfolio.mjs`, `scripts/prepare-n2-navigation-hydration.mjs`.

## 3. Productive Core source dependency proof

All rows below import `NeuralIcon` at runtime. “Partial escape hatch” means some content/template projection exists, **not** that the built component can be imported or fully rendered without Icons: a static Angular component `imports: [NeuralIcon]` and generated FESM import still require the package.

| Productive file (`projects/ui-core/…`) | Actual use and provider-neutrality today |
|---|---|
| `alert/neu-alert.component.ts` | Built-in tone icons and dismiss X use fixed definitions; public `icon` accepts `NeuralIconName`. Projection covers message/actions, not all icon behavior. Required. |
| `bottom-sheet/neu-bottom-sheet.component.ts` | Built-in close X. Body projection is not a close-control provider. Required. |
| `breadcrumb/neu-breadcrumb.component.ts` | Renders item icons supplied as Neural names. No equivalent neutral item-icon contract. Required. |
| `button/neu-button.component.ts` | Public `icon: NeuralIconName` renders `<neural-icon>` in start/end positions. Projected custom content is explicitly an escape hatch, not the same supported icon input. Required. |
| `dock/neu-dock.component.ts` | Default action icon rendering uses `NeuralIcon`; item templates are partial customization. Required for default path. |
| `empty-state/neu-empty-state.component.ts` | Default Inbox definition and public named icon; no equivalent provider-neutral default. Required. |
| `gallery/neu-gallery.component.ts` | Built-in previous/next definitions; templates do not remove static renderer import. Required. |
| `image-viewer/neu-image-viewer.component.ts` | Built-in navigation, zoom, rotate, flip, download and close definitions; no neutral replacement. Required. |
| `inline-editor/neu-inline-editor.component.ts` | Built-in edit/accept/cancel definitions. Required. |
| `input/neu-input.component.ts` | Public named start/end icon and fixed validation icon; projected content is only a partial escape hatch. Required. |
| `mega-menu/neu-mega-menu.component.ts` | Default item icon rendering; templates offer partial customization. Required for default path. |
| `menu-tiered/neu-tiered-level.component.ts` | Tiered item icon rendering; template hooks do not remove compiled import. Required. |
| `menu/neu-menu.component.ts` | Menu item icon rendering; projection/template hooks are partial. Required. |
| `modal/neu-modal.component.ts` | Dialog close X is a fixed definition; body/footer projection is unrelated. Required. |
| `nav/neu-nav.component.ts` | Public item `icon: NeuralIconName` plus built-in chevrons/external-link definitions throughout hierarchy. Required. |
| `notification-center/neu-notification-center.component.ts` | Bell/status/dismiss definitions and name/definition types. Required. |
| `pick-list/neu-pick-list.component.ts` | Transfer, reorder and drag controls use fixed definitions; templates cover items, not every control. Required. |
| `rich-text-editor/neu-rich-text-editor.component.ts` | Eight formatting toolbar controls use fixed definitions. Required. |
| `scroll-top/neu-scroll-top.component.ts` | Default chevron-up plus public named-icon customization; partial template path. Required. |
| `sidebar/neu-sidebar.component.ts` | Built-in close X; projected panel content is unrelated. Required. |
| `speed-dial/neu-speed-dial.component.ts` | Built-in plus and action icon rendering; partial action templates. Required. |
| `split-button/neu-split-button.component.ts` | Built-in dropdown chevron and named action icon; templates are partial. Required. |
| `stats-card/neu-stats-card.component.ts` | Built-in trend definitions and public named icon. Required. |
| `tag/neu-tag.component.ts` | Public named icon renders via `NeuralIcon`; projected label/template is not equivalent. Required. |
| `toast/neu-toast.component.ts` | Built-in tone/status and close definitions. Required. |
| `toggle-button-group/neu-toggle-button-group.component.ts` | Default option icon rendering; option templates partial. Required. |
| `uploader/neu-uploader.component.ts` | Built-in upload icon; content templates are partial. Required. |

Examples from the built artifact: `fesm2022/neural-ui-core-button.mjs` imports `@neural-icons/angular`; Alert and Modal also import fixed `@neural-icons/core/icons/*` subpaths. `types/neural-ui-core-nav.d.ts` imports `NeuralIconName`; Alert's declarations import `NeuralIconDefinition`. Some declarations inline the branded name union, which still exposes the same public choice set. The component templates and generated FESMs—not peer metadata alone—are the dependency.

## 4. Metadata provenance and architecture finding

`git blame` and `git log -S @neural-icons/angular -- projects/ui-core/package.json` identify commit **`434c873b`**, dated 2026-09-23, `feat(icons): integrate neural-icons into Neural UI`. The same commit changes Button and adds `N2-A0.2-NEURAL-ICONS-INTEGRATION.md`. That report explicitly says 19 former `NeuIconComponent` consumers were migrated to the published renderer, fixed definitions became selective package imports, the workspace uses exact dependencies, and the publishable Core package uses exact peers. This is evidence of *why and when* the peers appeared; it does not imply approval of the newer decoupling goal.

The desired product topology—Showcase depends independently on Core and Icons, while Core works with other providers or no icon library—conflicts with today's component implementation and public name types. **The peers are currently necessary for the shipped runtime contract.** Changing them to optional without an implementation replacement would be a false package promise. Moving them from peers to dependencies would only hide, not remove, coupling. Tree-shaking cannot resolve a missing module referenced by a selected component FESM.

## 5. Consumer experiments

Diagnostic tarball packed from a fresh `npm run build` of clean `63de8dc0`: `neural-ui-core-1.15.0.tgz`, 443 files, 1,306,412 bytes, SHA-256 `02d468029d7f066561e4ad1a4efa4614a965fd497a1a998bc94ae34678e5d748`. It is byte-identical to the earlier Showcase V2-S0 tarball; it is **not** a remediated/final artifact and must not be handed off as one.

- **Without Neural Icons (negative proof):** in a separate temporary Angular 22 consumer, installed the tarball with legitimate Angular packages while intentionally using `npm install --omit=peer` to prevent npm from silently supplying the current Icons peers. Install returned 0 and neither `@neural-icons/angular` nor `/core` was present. Importing public Button/Input/Dialog failed immediately: `ERR_MODULE_NOT_FOUND: Cannot find package '@neural-icons/angular' imported from …/@neural-ui/core/fesm2022/neural-ui-core-button.mjs`. This is a diagnostic of current coupling, not a valid PASS consumer. Build/SSR/hydration cannot proceed from this state.
- **With Neural Icons (positive coexistence only):** installing exact `@neural-icons/angular@0.0.1-next.1` and `@neural-icons/core@0.0.1-next.0` then importing Core Button, Input, Dialog, `NeuralIcon`, `provideNeuralIcons` and `iconSave` succeeded. This proves current integration coexists; it does **not** prove optional integration.

## 6. Checks, coverage, H9 and API delta

`npm run build` from the clean starting HEAD **PASS** during this investigation. The freshly generated dist metadata still declares both mandatory Icons peers, `dependencies: { "tslib": "^2.3.0" }`, and no `optionalDependencies` or optional-peer metadata.

There is **no remediation candidate**, so `verify:package`, `audit:contracts`, `test:imports`, `test:ssr-smoke`, publint, full suite, `npm run test:coverage`, H9 PR/main/release and candidate tarball checks were **not rerun as change gates**. The starting certification values above remain historical evidence only. No 2,889+ test or ≥95.01% coverage result is claimed for a nonexistent change. Public API delta: **none**, because no product code was edited.

## 7. Decision required and recommendation

The two coherent choices require explicit product/Core-owner approval:

1. **Preserve current public icon-name/fixed-icon behavior.** Keep Neural Icons as required peers and document the dependency honestly. This does not meet the newly stated Core-independence rule.
2. **Enforce true Core independence.** Authorize a Core-neutral icon/content contract—including default control glyphs, named-input migration, provider rendering, SSR/hydration, accessibility, type ownership and bundle policy—across the 27 runtime files and affected public types. This is a deliberate API/component redesign, not a package metadata patch. A separate optional integration boundary may be considered, but optional peers alone are insufficient. Define the public API delta and migration policy before implementing; then repeat all requested consumer, package, full-suite/coverage and H9 gates.

Do not copy Neural Icons geometry into Core, switch to another mandatory icon library, introduce an unapproved compatibility layer, or remove imports while leaving broken defaults. This task's constraints prohibit choosing the required API redesign unilaterally. **No local commit** is created: the requested commit was conditional on a tracked fix with all gates passing.

## 8. Showcase V2 handoff

Showcase V2-S0 should **not** replace its tarball: Core HEAD remains `63de8dc0`, and the diagnostic tarball has the same SHA as the existing S0 artifact. Continue documenting its required Icons peers as an observed current-package fact. No V2-S1 work starts here. After the Core owner approves and completes a genuinely decoupled candidate with all gates passing, provide the new Core SHA, tarball filename/SHA-256 and final peer map; only then should Showcase replace the artifact and rerun baseline build, SSR and browser proof.
