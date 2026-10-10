# N2-B8 — InputMask P2 slot engine

## 1. Status

**B8 COMPLETE — READY FOR B9.** B8 is implemented and verified but intentionally uncommitted. No B9 work began. The independent `audit:forms` script still reports the pre-existing B7 generic Slider typed-model mismatch; the InputMask-specific Forms paths and contracts pass (see §33–35).

## 2. Starting checkpoint

Branch `v2`; B7 was reviewed and committed first as `04362b0a350624b28bb3e8ee0371bf504ef32d3c` (`feat(slider-rating): complete Neural 2 numeric P2`), parent `fd6735ce907ecd5e68ca26a6ee3ef12f533dee11`. Staging and tracked changes were clean after that commit. The foreign untracked `projects/ui-core/tree-table/public_api 2.ts` was not staged or modified (SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`).

## 3. Current parser diagnosis

**DEEP REFACTOR of the mask engine, not of the entire control.** The former `applyMask` globally filtered characters, searched and removed candidates repeatedly, reconstructed the whole string, and restored the caret to the end. It could reorder candidate characters and lost the user's slot/selection intent. The existing Signal Forms shell, native input, validation, label, touch and IME ownership were retained.

## 4. Public value policy

`value: ModelSignal<string>` means the **masked/display string**, never raw digits. This is explicit in `N2-001-CONTRACTS.md`, `N2-001-TYPE-CONTRACTS.md`, `N2-003-004-FORMS.md`, the component and its specs. There is no raw-mode input. The existing applied external-write behavior is verbatim display with no normalization/echo; a nonconforming external string remains visible until the next user edit. A dedicated regression test now freezes that observed policy. No second applied owner was introduced.

## 5. Mask grammar

Only `9` (ASCII digit), `A` (ASCII letter, case-insensitive), and `*` (ASCII alphanumeric) are editable tokens. Every other mask character is a literal. No optional group, escape syntax, regex mask, recursive mask, locale grammar or public mode was added. `mask=''` remains an ordinary text input.

## 6. Slot model

The private framework-free compiled mask distinguishes literal/editable units, and editable units carry token, mask index and editable index. It is derived by `computed(() => compileMask(mask()))`; there is no global cache or mutable mask owner. A per-operation cell array and projected caret positions are temporary local values.

## 7. Pure engine

`neu-input-mask.engine.ts` owns compilation, token matching, browser-input reconciliation, insertion/paste and backward/forward deletion. Each operation accepts the applied string and returns `{ value, caret }`; it does not access Angular, DOM or browser globals. The component alone publishes the returned value through its existing single `model<string>`.

## 8. Literals

Literals are projected, not editable data. Full paste may contain literal separators; they are skipped at their mask boundary and not used to fill a slot. The renderer includes a separator only when a later editable cell has content.

## 9. Partial/incomplete values

Partial values remain compact masked strings (for example `12/3`), with no guide characters or placeholders inserted into the model. The existing `placeholder` input remains the native input placeholder. Sparse same-token segments compact deterministically when serialized; no parallel long-lived slot-value model is kept.

## 10. Caret

Insertion targets the next editable slot at/after the caret, advances past literals, and returns a normalized caret. Start, middle, end and literal boundaries are pure-tested; the first post-hydration physical keystroke verifies the browser caret.

## 11. Backspace/delete

`beforeinput` owns `deleteContentBackward` and `deleteContentForward`. Backspace clears the preceding editable character; Delete clears the current/next one; immutable literals are skipped. Start/end and before/after-literal boundaries are tested.

## 12. Selection

A selected range maps to intersected editable cells; replacing/deleting a range spanning literals affects only editable characters. Selection remains native; Arrow/Home/End and selection modifiers are not hijacked.

## 13. Paste

The paste event prevents the browser's uncontrolled insertion and passes clipboard text through the same slot matcher. Accepted characters retain source order; invalid characters are ignored. Full, mixed, literal-bearing, middle and selection replacement cases are covered. This deliberately removes the old candidate-reordering behavior; the public masked-value policy is unchanged.

## 14. Composition/IME

Intermediate composition input is an ephemeral draft, not a model write. `compositionend` reconciles once and suppresses the browser's duplicate trailing input; an intervening parent write wins. Existing IME regression specs and a real post-hydration commit pass.

## 15. Browser event ownership

Cancelable `beforeinput` owns ordinary `insertText`, backward delete and forward delete. `paste` owns clipboard insertion. `input` reconciles non-cancelable/browser-generated edits such as autofill and undo/redo. The paths do not independently publish the same edit; `commitEdit` checks equality before `value.set`.

## 16. Invalid characters

User characters that do not match the current editable slot are ignored; they do not corrupt the model. Reconciliation and paste preserve the accepted source order rather than searching ahead and reordering characters. Mask syntax checking remains distinct from Forms validation.

## 17. External writes

Applied parent/Form values render literally, including nonconforming strings; there is no automatic normalization, output, dirty or touched transition. On subsequent user editing, the slot engine interprets that display into the existing mask grammar. This is explicitly tested.

## 18. Signal Forms

The real component passes `[formField]`, `[formControl]`, `formControlName` and `[(ngModel)]` in the directed 4-path matrix. It remains `FormValueControl<string>` with one `ModelSignal<string>`, no CVA and no `NG_VALUE_ACCESSOR`.

## 19. Touch/dirty/reset/disabled/readonly

The expanded matrix verifies InputMask dirty/touched/reset and parent writes across the relevant paths. Blur remains the sole `touch` gesture. Disabled/readonly block edits; readonly retains native focus/selection/copy. The browser fixture hydrates empty, partial, readonly and disabled states.

## 20. A11y

The native `<input>`, label association, hint/error description, required/invalid/readonly/busy ARIA and FormField validation presentation are unchanged. No literal live announcements or custom keyboard role were added.

## 21. Keyboard/native behavior

Tab, arrows, Home/End, selection modifiers, copy, cut and undo/redo are not intercepted by `keydown`. Only cancelable mask-edit `beforeinput` operations are owned; remaining native edits reconcile on `input`.

## 22. SSR

Mask compilation and display are pure; the module does not evaluate `window`, `document`, selection APIs or timers on the server. The Angular 22 SSR fixture renders empty, partial, complete, readonly and disabled values deterministically. SSR import smoke passes for all 99 entrypoints.

## 23. Hydration

Real Chromium zoneless SSR→hydration passes with DOM node reuse, zero NG050x, zero initial InputMask events, and exactly one event each for first key, paste, IME commit and external write. The post-hydration caret remains usable. The focused B8 runner avoids unrelated 27-control interaction timing in the older shared runner.

## 24. Zoneless

The consumer uses Angular 22.1.6 `provideZonelessChangeDetection()` with no Zone.js dependency for the B8 browser gate.

## 25. Effects/resources

Before/after: **0 product effects**, **0 global listeners**, **0 observers**, **0 timers/rAF/microtasks**. Native template handlers grow from **5 to 6** (`beforeinput` added), owned and cleaned by Angular. The existing one `DestroyRef` cleanup cancels the ephemeral composition draft. Fifty create/destroy cycles pass without a late model write.

## 26. Performance

Reproducible `npm run capture:n2-b8-performance`: 96 editable slots, 500 middle edits in the pure Node engine, p50 **0.0118 ms**, p95 **0.0365 ms** in this run. These are local observations, not browser/product latency claims. Compilation is derived only when `mask` changes; ordinary edits use linear slot scans, not repeated whole-string candidate removal.

## 27. Bundle

Compiled-package minified ESM consumer, Angular/RxJS/ng-icons external, gzip-9/Brotli-11: BASIC **19,226/4,642/4,050 B** raw/gzip/br before → **22,077/5,521/4,885 B** after (**+2,851/+879/+835 B**). Complex mask **19,234/4,649/4,053 B** → **22,085/5,528/4,890 B**. `root-unused` remains **0 B raw**. Growth is attributable to slot/edit/caret logic; no third-party mask dependency.

## 28. Public API delta

**None.** Same component, 19 ordinary inputs plus one model, one explicit `touch` output, same `focus`/`reset` public commands, same `string` value and mask grammar. The new handler is protected; the engine is private and not exported by the public barrel. Official public-contract audit shows no drift.

## 29. Type gates

`test:n2-forms-types` PASS; `audit:contracts` PASS (99 entrypoints, 793 exported declarations, 1,487 bindings). No public `any`, raw-mode escape hatch or new contract snapshot was introduced.

## 30. Tests

Directed B8: **4 files, 35/35 tests PASS**. Pure engine covers compile/literals/partial/invalid, insertion, deletion, selection, paste, caret, determinism and immutability; DOM covers beforeinput, IME, external invalid writes, A11y and 50 lifecycle cycles; Forms matrix and validation remain green.

## 31. Full suite

Run once after runtime edits, without coverage: **179/179 files, 2,423/2,423 tests PASS**. No global coverage or threshold change.

## 32. Consumer regression

Active TS references outside the component are the Forms type fixtures, the compatibility/hydration consumer and the directed Forms specs; no unrelated product consumer required an API migration. The Angular 22 consumer builds/renders and the relevant integration tests pass.

## 33. Package verification

Production build PASS; `verify:package` PASS (**439 files**); `audit:package`/publint/ATTW PASS, including `@neural-ui/core/input-mask` across Node10, Node16 CJS/ESM and bundler; SSR import and 99-entrypoint import smoke PASS. `audit:forms` alone fails on the already-committed B7 generic Slider typed-model rule, not on InputMask. It is not silently attributed to B8 or fixed outside scope.

## 34. Portfolio

Official generator/write and drift gate PASS: **96 public components = 45 completed + 51 pending + 0 remove**, **17 remaining implementation batches**. Only InputMask moved to completed; the neural-icons/A1 lane is untouched.

## 35. Remaining risks

The compact masked-string contract cannot represent every gap between adjacent identical token slots without a guide character or another public value policy; deletion therefore compacts those segments deterministically. Broader raw/masked configurability remains outside B8. The separate B7 Slider `audit:forms` rule needs its own scoped correction/checkpoint; no InputMask gate depends on an additional value owner.

## 36. Git status

B8 source, tests, fixture, scripts, portfolio and this report remain uncommitted in the working tree on `v2`. Staging is empty. The foreign untracked TreeTable file remains unchanged; zero tracked/new symlinks, zero temporary hydration directories, and `git diff --check` PASS. No push, tag, release or npm publish.

## 37. Recommendation

**B8 COMPLETE — READY FOR B9.** Review B8's uncommitted diff and the separately identified B7 Forms-audit rule before authorizing the B8 commit or B9. Do not start B9 automatically.
