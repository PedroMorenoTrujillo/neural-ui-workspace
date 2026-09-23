# N2-B7 — Numeric P2 implementation and Signal Forms API resolution

## 1. Status and starting checkpoint

**B7 COMPLETE — READY FOR B8.** The authorized A3/A5/D1 checkpoint was committed as `fd6735ce907ecd5e68ca26a6ee3ef12f533dee11` (`feat(core): complete A3 A5 and D1 modernization`) on `v2`, with parent `5c481661fcccf66e6eb7fd36d823423e55976bb3`. The foreign untracked `projects/ui-core/tree-table/public_api 2.ts` was excluded and remains untouched. The two earlier STOP decisions and rollback below remain as historical evidence. The final implementation and gates are in Section 13.

### Normative B7 resolution (supersedes the original STOP)

Slider has exactly two value shapes, `number` and `readonly [number,number]`, discriminated by value shape without a second mode owner. Range tuples mean lower/upper, emitted tuples are fresh and ordered, thumb identity never swaps, and attempts to cross clamp the active thumb. `minStepsBetweenThumbs` is a non-negative integer count of `step` intervals (default 0), internally capped to a feasible gap. External invalid values/configuration are normalized only for view/ARIA, with no ModelSignal echo; user edits emit clamped, min-origin snapped canonical values. Slider orientation is `'horizontal'|'vertical'` (default horizontal); horizontal min is physically left, vertical min physically bottom, unaffected by RTL. Right/Up increase and Left/Down decrease; Home/End use the active thumb's dynamic limits. Range thumbs need distinct accessible names and dynamic ARIA limits. Pointer track selection chooses the nearest thumb, breaking ties by last focus and then a documented deterministic default.

Rating keeps `number|null`, adds `step: 1|0.5` (default 1), and remains horizontal only. It retains a radiogroup, discrete radio options for every allowed half/integer value, max visible stars, same-value clear to `null`, and RTL-aware horizontal keyboard navigation. External non-aligned values normalize only for presentation. Half-star pointer regions and partial fill must remain local and SSR-deterministic. The four official Forms paths, one ModelSignal owner, no CVA and zero-effect preference remain in force. The implementation and gates below are not certified.

### Compiler proof and rollback

The first compile-only Angular 22.1.6 probe used `NeuSliderComponent<V extends number | readonly [number,number] = number> implements FormValueControl<V>` with the existing numeric `min`/`max` input properties. `ng build ui-core --configuration production` failed with **TS2416** for each property: `InputSignal<number | undefined>` is not assignable to `FormValueControl<V>`'s `InputSignal<NonNullable<V> | undefined>` when `V` can be the readonly tuple. The installed `@angular/forms/types/signals.d.ts` confirms that `FormUiControl<TValue>` reserves `min` and `max` as value-typed optional inputs, inherited by `FormValueControl<TValue>`.

The narrow alias experiment renamed the TypeScript properties to `numericMin`/`numericMax` while preserving the public Angular aliases `[min]`/`[max]`. The production package then compiled. However, a real strict-template fixture with `<neu-slider [formField]="fields.range" />` failed **TS2322** twice: Angular's `FormField` binding supplies `NeuSliderRangeValue | undefined` to each numeric input, which accepts only `number | undefined`. Adding explicit `[min]`/`[max]` on the same element instead produced **NG8022**: binding those inputs is not allowed on a node using `[formField]` because the directive owns them. Removing explicit bounds did not remove TS2322.

A minimal generic component with no `min`/`max` inputs compiled scalar and range examples through `[formField]`, `[formControl]`, `formControlName`, and `[(ngModel)]`; wrong tuple length, arbitrary `number[]`, mixed tuple and string were rejected by direct model/template inference. Generic value inference is therefore viable. The precise blocker is the collision between numeric Slider bounds and Angular's value-typed `min`/`max` auto-bindings. Separately, Angular's `[formControl]` template binding alone did not reject a `FormControl<string>`; direct model and `[formField]` typing did reject invalid shapes. This limitation should be documented, not hidden with a cast.

The partial runtime, math helpers and throwaway compiler fixture were removed using focused patches. Slider source is byte-for-byte equal to HEAD; Rating was never changed. No `any`, `unknown`, CVA, second value owner, second component, or broadened numeric bound type remains in the product.

### Smallest alternatives requiring approval

1. Rename public numeric bound inputs for both modes (for example `lowerBound`/`upperBound`) so Signal Forms no longer reserves them as `min`/`max`. This preserves one generic component and all four Forms paths, but breaks existing scalar `[min]`/`[max]` bindings and needs a migration decision.
2. Keep scalar `[min]`/`[max]` and add separately named numeric range bounds while accepting Signal Forms' tuple-typed `min`/`max` on the range path. This creates two concepts and a precedence rule, contrary to the frozen single coherent API unless specifically designed and authorized.
3. Relax public types or add a Forms/CVA adapter to mask the collision. This would degrade typing or violate the frozen Forms architecture and is **not recommended**.

No alternative is silently selected. The interaction decisions remain frozen; only the Angular Forms bound-input naming/correlation needs a focused contract resolution.

## 2. Original design-review result and authority (historical)

Sections 2–12 record the state before the public-bound rename. Their P1-only inventories, unrun-gate statements and blocked recommendation are historical, not the final B7 state.

| Area | Classification | Evidence / unresolved decision |
| --- | --- | --- |
| Existing P1 scalar Slider and integer Rating | KEEP CURRENT API | N2-010 certifies these, including all four Forms paths. |
| Slider typed range and Rating half-step | BOUNDED EXTENSION in intent, **NEEDS DESIGN REVIEW** in contract | `N2-IMPLEMENTATION-ROADMAP.md` §N2-026 names `readonly [number,number]` and explicit Rating increments, but defines neither a typed mode discriminator nor normalization/interaction rules. |
| Slider vertical and Rating vertical | **NEEDS DESIGN REVIEW** | `N2-001-CONTRACTS.md` §21 and `N2-001-TYPE-CONTRACTS.md` mark these P2 decisions `NEEDS REVIEW`; N2-026 says “vertical/medio valor según caso”, while the frozen Prime gap row F-137 says Slider vertical `DEFER`. No final vertical API or keyboard policy is frozen. |
| Slider thumb crossing/minimum gap | **NEEDS DESIGN REVIEW** | N2-026 requires “política de cruce” and tests for `minSteps`, but gives no clamp/swap/crossing rule, no unit for minimum gap, and no response to changed bounds or external values. |
| Rating half-step | **NEEDS DESIGN REVIEW** | No accepted fractional value domain, step configuration, pointer hit-region policy, null/clear policy under half values, or half-value accessibility model is frozen. |

The authoritative N2-010 report explicitly defers all four P2 modes. The current source contains only one native horizontal `input[type=range]` for Slider and an integer horizontal radiogroup for Rating, so existing behavior cannot implicitly freeze the missing P2 policy. The portfolio/roadmap assigns both to B7 but does not resolve these decisions. Under the B7 STOP conditions, implementation must wait for a normative resolution; a new public API invented here would be an unauthorized material choice.

## 3. Slider before/final contract

Current and final-at-this-stop public contract are identical: one exported `NeuSliderComponent`, **20 inputs, 1 `value` model, 1 `touch` output, 0 supported public types, 0 supported public methods** in the official snapshot. `value: ModelSignal<number>` implements `FormValueControl<number>`; `min`, `max`, and `step` configure a scalar horizontal range. `focus`/`reset` exist for the Forms interface, but the snapshot classifies methods as internal/unsupported public API. No range value, two-thumb mode, orientation input, or minimum-gap input exists. The existing `valueChange` is generated by `model()`, not a second manual output.

## 4. Rating before/final contract

Current and final-at-this-stop public contract are identical: one exported `NeuRatingComponent`, **15 inputs, 1 `value` model, 1 `touch` output, 0 supported public types, 0 supported public methods**. `value: ModelSignal<number|null>` implements `FormValueControl<number|null>`; user interaction selects whole stars or clears to `null`. The current presentation rounds external fractional values rather than implementing half-step selection. No half-step configuration or orientation input exists. No manual `valueChange` output is present.

## 5. Ownership, scalar/range, crossing and normalization

The certified P1 form value remains the sole MODEL; configuration remains INPUT; Rating hover/focus and Slider pointer identity are ephemeral. Neither component uses CVA, `NG_VALUE_ACCESSOR`, or an input-to-writable mirror. For the P2 range, the tuple's ordering, crossing behavior, focus identity on crossing, `minSteps` unit/rounding, external invalid-value policy, and bounds-change normalization are **not frozen**. No range model, second owner, or proposal channel was added.

## 6. Orientation, pointer, keyboard and accessibility

Existing Slider is native horizontal range with pointer input, arrows/PageUp/PageDown/Home/End, one accessible thumb, and current numeric ARIA metadata. Existing Rating is a horizontal radiogroup with integer radio choices, hover, click, roving focus, RTL-aware left/right keys, up/down/Home/End/Space/Enter, and same-choice clear. These are P1 facts, not approval for the proposed P2 modes. B7 still needs an explicit vertical scope and mapping, range-thumb ARIA naming/min/max/text, half-value role/focus/value text, and RTL policy. No pointer listener/capture or keyboard behavior was changed in this review.

## 7. Signal Forms, touch/dirty/reset/disabled, effects and resources

N2-010 certified `[formField]`, `[formControl]`, `formControlName`, and `[(ngModel)]` for both existing controls, including external writes, touch, dirty, reset, disabled, readonly, validation and exactly-once changes. The current source has **0 effects in Slider and 0 in Rating**, one form `model()` each, and no CVA. Slider has one ephemeral active pointer ID; Rating has ephemeral hover/focus signals. B7 did not alter lifecycle resources, and no P2 Forms path has been certified.

## 8. SSR, hydration, zoneless, pure math and types

N2-010's P1 Angular 22.1.6 consumer passed SSR and real Chromium zoneless hydration with DOM reuse, 0 NG050x and exactly-once first interaction. After the prototype rollback, the production build and the same directed Slider/Rating suite passed again: **4 files, 27/27 tests**. The compile-only P2 probe results and exact diagnostics are recorded above; the throwaway probe was removed after diagnosis. No B7 range/vertical/half runtime fixture, new SSR render, or new hydration run was attempted because implementation stopped at the typing gate. There is no claim that unimplemented P2 modes pass these gates.

## 9. Public API, bundle, performance and test delta

**Public API delta: 0. Runtime delta: 0. Effect delta: 0.** The same compiled-package esbuild consumer harness was run before experimentation and after rollback, with Angular/CDK/ng-icons/RxJS external, minified ESM, gzip 9 and Brotli 11. Every byte count returned to the identical baseline:

| Consumer | Before raw/gzip/Brotli | After rollback raw/gzip/Brotli | Delta |
| --- | ---: | ---: | ---: |
| Slider scalar | 24,023 / 5,046 / 4,315 | 24,023 / 5,046 / 4,315 | 0 |
| Slider range-shaped fixture (P1 component, not a range feature) | 24,050 / 5,064 / 4,330 | 24,050 / 5,064 / 4,330 | 0 |
| Rating integer | 18,824 / 4,609 / 3,986 | 18,824 / 4,609 / 3,986 | 0 |
| Rating half-valued fixture (P1 component, not half-step UI) | 18,847 / 4,623 / 3,995 | 18,847 / 4,623 / 3,995 | 0 |
| Combined | 37,035 / 6,870 / 5,874 | 37,035 / 6,870 / 5,874 | 0 |
| Root-unused | **0 raw** | **0 raw** | 0 |

No B7 performance delta can be measured because no P2 implementation exists. No B7-specific runtime tests, hydration or lifecycle gates were run; the intended full suite was not repeated because no public runtime changed. The completed checkpoint's full suite was **177 files, 2,393/2,393 tests**. No global coverage was run.

## 10. Portfolio and remaining risks

The B7 status was **not** marked complete and generated portfolio files were **not** changed: **96 public components = 42 completed + 54 pending**, with 19 implementation batches remaining. The separate neural-icons/A1 lane remains independent and untouched. The original policy risk was resolved normatively; the remaining risk is choosing an unapproved Angular Forms binding/API workaround. N2-023 visual-axis decisions are not reopened.

## 11. Original resolution request (historical; resolved above)

Freeze, at minimum: (1) Slider's public scalar/range discriminator and exact tuple type; (2) crossing/clamping versus identity swap; (3) `minSteps` meaning, step rounding and behavior for external invalid tuples or changed min/max; (4) whether vertical is in B7 for Slider and Rating, with keyboard/RTL policy; (5) Rating's half-step configuration, accepted values, pointer/keyboard normalization, accessibility representation and clear behavior. A narrow normative addendum to N2-026/N2-001 can resolve these without redesigning the certified P1 Forms architecture.

## 12. Files, Git status and recommendation

B7 changed only the authoritative N2 contract/roadmap text and this report; Slider, Rating, their specs, snapshots, generated portfolio, icons, and TreeTable were not modified in the final diff. The partial prototype was fully rolled back. The working tree has these uncommitted documentation changes plus the unrelated preserved untracked TreeTable file; staging is empty. No B7 commit, push, tag, release, or npm publish was made. **B7 IMPLEMENTATION BLOCKED** by the compiler-proven Signal Forms input collision; do not start B8.

## 13. Final B7 implementation after `minValue`/`maxValue` resolution

**Compiler issue resolved.** Angular 22.1.6 reserves `min`/`max` in `FormUiControl<V>` for field-value-typed validation metadata. The original generic component failed TS2416 and the alias attempt failed TS2322/NG8022 for tuple fields (Section 1). The authorized breaking rename removes the Slider inputs `min`/`max` completely and exposes one numeric bound pair, `minValue`/`maxValue`, for scalar and range (defaults preserved at 0/100). The real `ngc` fixture `fixtures/n2-forms-typing/slider-range.ts` now compiles scalar and `readonly [number,number]` through `[formField]`, `[formControl]`, `formControlName`, and `[(ngModel)]`; `@ts-expect-error` verifies rejection of arbitrary `number[]`, one/three element tuples, string and mixed tuples, and verifies the former `.min/.max` properties are absent. Numeric bound reads remain `number`. The existing Angular Reactive Forms template checker cannot prove every control-value mismatch for `[formControl]` alone; the direct ModelSignal and `[formField]` type gates enforce the closed Slider value domain. No CVA, adapter, secondary mode input or alias was added.

**Slider.** One generic `NeuSliderComponent<V extends NeuSliderValue = number>` and one `model<V>` own the value. `NeuSliderValue = number | readonly [number,number]`; tuple shape selects two thumbs, with ordered lower/upper output, stable thumb identity, no crossing, active-thumb clamp, and `minStepsBetweenThumbs` as non-negative step intervals. Pure private math derives view/ARIA from malformed external tuples without echo, then emits a fresh canonical tuple on user edit. Step snapping uses a min-origin lattice and bounded decimal precision. Horizontal min is physical left and vertical min is physical bottom, independent of RTL; arrow/Page/Home/End mappings and dynamic thumb ARIA limits are tested. Scalar remains a native range input. Range uses two named, focusable slider buttons and pointer capture, with no listener/effect/mirror. Native HTML `min`/`max` attributes on the scalar input remain correct and are not Angular public inputs.

**Rating.** One nullable `model<number|null>` remains; `step: 1|0.5` defaults to 1, with a defensive runtime fallback to 1. Half mode renders discrete radio options with clipped half-star visuals, exact fractional `aria-checked`, RTL-aware arrows, Home/End and same-value clear to `null`. Rating vertical remains rejected. Neither component adds effects; Slider retains ephemeral pointer/focus state, Rating ephemeral hover/focus state. No product listener, observer, timer or subscription was added.

**Public contract.** Official `snapshot:contracts` and `audit:contracts` pass. Slider supported inputs **20→22**: remove `min`, `max`; add `minValue`, `maxValue`, `minStepsBetweenThumbs`, `orientation`. One `NeuSliderValue` type is added; one model, one explicit `touch` output and one public component remain. Rating supported inputs **15→16** by adding `step`; its model/output count is unchanged. `scripts/n2-b7-contracts.spec.mjs` verifies the exact final bindings and absence of legacy aliases. Active contracts, roadmap, Forms target and the scalar validation fixture were migrated deliberately; historical N2-010 evidence was not rewritten.

**Verification.** Production `ng build ui-core --configuration production` PASS (only the pre-existing Menu NG8102 notices). The dedicated type gate and existing 24-control Forms type gate PASS. Directed B7: **5 files, 43/43 tests**, including pure numeric math, scalar/integer regressions, range/half interaction, RTL, ARIA and all four Forms paths with silent parent writes. Full library suite after the final runtime edit: **178/178 files, 2,409/2,409 tests**, no global coverage. Real Angular 22.1.6 zoneless SSR → Chromium hydration PASS for scalar, horizontal range, vertical range, integer and half Rating: server DOM reused, no NG050x or initial events, and first range/half edits propagated exactly once. `verify:package` PASS (341 files); publint PASS. ATTW for `@neural-ui/core/slider` and `/rating` PASS; the global `audit:package` still exits 1 on a pre-existing Node10 internal-resolution issue at the package root, previously documented as ATTW Node10 debt in N2-025. No B7 entrypoint error appears.

**Bundle.** Reproducible final compiled-package esbuild ESM consumers (`npm run audit:n2-b7-bundle`), minified, with Angular/RxJS/ng-icons external, private internal code included, gzip level 9 and Brotli quality 11:

| Consumer | Final raw / gzip / Brotli (B) | Historical P1 raw / gzip / Brotli (B) |
| --- | ---: | ---: |
| Slider scalar | 35,445 / 6,888 / 5,978 | 24,023 / 5,046 / 4,315 |
| Slider range | 35,450 / 6,892 / 5,979 | 24,050 / 5,064 / 4,330 (range-shaped constant, P1 component) |
| Rating integer | 20,578 / 4,834 / 4,191 | 18,824 / 4,609 / 3,986 |
| Rating half | 20,580 / 4,835 / 4,184 | 18,847 / 4,623 / 3,995 (half-valued constant, P1 UI) |
| Combined | 50,209 / 8,888 / 7,631 | 37,035 / 6,870 / 5,874 |
| Root unused | **0 raw** | **0 raw** |

The historical fixture source was not retained, so byte deltas against that baseline are indicative, not a strict same-source diff; both use compiled-package esbuild/minification with the same external dependency policy. The main incremental cost is range template/pointer/ARIA and private math; Rating half options/CSS are smaller. A consumer that never imports these controls retains 0 raw bytes from the root.

**Portfolio, Git and next step.** Official portfolio generator and drift audit PASS: **96 public components = 44 completed + 52 pending**, 18 implementation batches. The neural-icons/A1 lane is unchanged. `git diff --check` passes; no symlink or hydration temporary remains, and the foreign TreeTable untracked file is unchanged. B7 is left uncommitted on `v2` for review; no push, tag, release or npm publish. Recommended next step: review/authorize one local B7 commit; use **GPT-6 SOL HIGH** for any subsequent B8 work. B8 was not started.
