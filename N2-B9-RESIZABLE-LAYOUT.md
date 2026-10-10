# N2-B9 — Resizable layout: design review

**Final status: B9 COMPLETE — READY FOR NEXT ROADMAP BATCH.** The first 30 sections preserve the historical STOP; the final normative resolution and certification follow them.

## 1. Status

**B9 NEEDS DESIGN REVIEW.** The mandatory pre-runtime audit found material public-policy gaps. No B9 runtime, test, package, portfolio, or contract file was changed.

## 2. Starting commits

- B8: `c004c306c2bdcbc2f34553af7254b5a0c0c39623` — `feat(input-mask): replace masking parser with slot engine`.
- Forms audit repair: `230fc1e58ad2beb6b1a5cd1948bf3ec344ba8bdf` — `test(forms): support bounded generic Signal Forms models`.
- Branch: `v2`. The only pre-existing untracked file is `projects/ui-core/tree-table/public_api 2.ts`, which is not part of B9.

## 3. Splitter audit

**NEEDS DESIGN REVIEW.** `NeuSplitterPane.size` is a percentage, rendered as `flex-basis: <size>%`; `min` and `max` are pixels converted at interaction time. The component stores applied sizes in an internal writable signal synchronized by an `effect`, then changes that signal on gestures. This lets a rejected `sizeChange` proposal remain visible, contrary to the B9 controlled-state target. It has horizontal/vertical layout and keyboard and mouse/touch resizing, but no collapse/restore contract.

## 4. ScrollArea audit

**FOCUSED REFACTOR after policy resolution.** `NeuScrollAreaComponent` lives in the `panel` entrypoint. Native scrolling is the source of truth, with optional enhanced tracks. Its public `NeuScrollPosition.left`, `scrollPositionChange`, `position()`, and `scrollTo({left})` expose numeric horizontal coordinates. The implementation directly reads/writes `element.scrollLeft`, including track position and keyboard Home/End. No authoritative document freezes whether these public numbers are raw browser coordinates or normalized logical coordinates in RTL. This is an explicit B9 STOP condition.

## 5. Public API decisions needed

1. Freeze the Splitter applied-size owner: keep percentage sizes in `panes` with a proposal-only `sizesChange`, or introduce a distinct applied `sizes` input. N2-001 freezes `direction` → `orientation` and `sizeChange` → `sizesChange`, but not this owner or collapse API.
2. Freeze collapse/restore: eligible panes, collapsed size versus pixel `min`, restoration source after parent writes new sizes, and whether collapse has its own proposal or is solely a size proposal. N2-001 explicitly marks Splitter collapse **NEEDS REVIEW P2**; N2-028 names the goal but not these rules.
3. Freeze horizontal Splitter RTL semantics: whether pane index/percentage is logical start-to-end or physical left-to-right, and how pointer and arrow-key deltas map to it. The existing implementation uses raw `clientX` and physical arrow signs.
4. Freeze ScrollArea public horizontal coordinates in RTL: browser-raw `scrollLeft`, or a normalized logical range such as `0..max`. State how `position().left`, `scrollPositionChange.left`, `scrollTo({left})`, enhanced track, and Home/End agree. Do not silently change consumer-visible values.

## 6. Ownership

Target: consumer owns applied Splitter layout and optional persistence; Splitter owns only transient gesture state. ScrollArea's browser viewport remains the scroll owner. Neither component should own URL or storage state.

## 7. Applied/proposal state

Current Splitter `_sizes` is a writable applied-state mirror. Its `resizeStart`, `resize`, and `sizeChange` outputs have gesture timing but do not provide rejection semantics. The exact controlled proposal API awaits decision 5.1.

## 8. Size model

Current unit is determinable: percentage `size`, pixel `min`/`max`. Preserve this distinction unless an explicit review changes it. No new unit was introduced.

## 9. Collapse/restore

Current runtime has neither. N2-028 requests collapse and restoration; policy 5.2 is not frozen. No speculative implementation.

## 10. Pointer

Current Splitter uses window mouse/touch listeners with destroy cleanup, not a unified pointer-capture session. Pointer conversion must follow the frozen RTL policy before refactor.

## 11. Keyboard

Current Splitter uses a hard-coded two-percentage-point step and physical arrow keys. Existing ScrollArea enhanced tracks intercept arrows/Page/Home/End. Both need direction-aware tests after decisions 5.3–5.4.

## 12. RTL

Splitter uses physical horizontal delta; ScrollArea exposes raw browser `scrollLeft` while enhanced track calculations assume a nonnegative `0..max` range. CSS mirroring alone cannot settle either public meaning.

## 13. A11y

Splitter renders focusable separators with orientation, value, min, max, and labels. Enhanced ScrollArea renders focusable scrollbars. Existing semantics were inspected only; no B9 a11y gate was claimed.

## 14. Persistence boundary

N2-028 assigns persistence to a consumer adapter. No Router, URL, `localStorage`, or `sessionStorage` owner was added.

## 15. ScrollArea observer lifecycle

The existing `ResizeObserver` is constructed only for `enhanced() === true` during `ngAfterViewInit` and disconnected on destroy. A later `enhanced` input change does not rebind it. This remains the focused lifecycle repair once the public RTL policy is frozen.

## 16. Native scrolling

Default scrolling is native. B9 should preserve wheel, touch, trackpad, and normal focus behavior; no replacement engine is proposed.

## 17. SSR

The existing observer is browser-guarded. No B9 SSR render gate was run because implementation stopped before runtime changes.

## 18. Hydration

No B9 Chromium hydration gate was run. It remains mandatory after runtime changes.

## 19. Zoneless

No B9 zoneless gate was run. Existing Splitter tests configure `provideZonelessChangeDetection()`; that is not a certification of the proposed refactor.

## 20. Effects/resources

Current Splitter has one applied-size synchronization `effect`, one `afterRenderEffect`, and a per-drag set of window listeners. ScrollArea can hold one `ResizeObserver` and has template scroll/pointer/keyboard handlers. B9 target counts were not measured because no new runtime exists.

## 21. Tests

Existing source inventory: Splitter spec has 34 tests; the combined Fieldset/ScrollArea spec has 14 tests, 9 in its ScrollArea-containing section. No B9-directed tests were added or run after the STOP. B8 and forms-auditor gates passed before B9 began.

## 22. Bundle

No B9 bundle measurement: there is no candidate runtime change. B8's certified bundle is unaffected.

## 23. Public contract delta

None. The required `orientation`/`sizesChange` renames and any controlled/collapse contract were not applied.

## 24. Package gates

No B9 package/entrypoint gate was run after the STOP. B8 package verification passed before the B8 commit; forms-auditor contract gate passed before its separate commit.

## 25. Full suite

No B9 full-suite run. The pre-B9 B8 suite had passed 179/179 files and 2,423/2,423 tests; this is not presented as B9 certification.

## 26. Portfolio

Generated inventory remains **96 public components: 45 completed, 51 pending**. Splitter and ScrollArea remain pending. No status or icons-lane state was changed.

## 27. Remaining risks

Without decisions 5.1–5.4, a refactor can break controlled rejection, collapsed minimum constraints, RTL resizing, or the meaning of emitted horizontal scroll values. These are product contracts, not internal implementation details.

## 28. Files changed

For B9: this report only. B8 and the forms-auditor repair were committed separately before the audit. No Splitter, Panel/ScrollArea, or shared runtime file was modified.

## 29. Git status

Branch `v2`; B9 report is untracked pending review, alongside the untouched pre-existing untracked `projects/ui-core/tree-table/public_api 2.ts`. Staging is empty. No B9 commit, symlink, push, tag, release, or publish.

## 30. Recommendation

**B9 NEEDS DESIGN REVIEW.** Freeze the four narrow decisions in section 5, then resume B9 runtime and its directed, browser, bundle, package, and suite gates. Do not begin another roadmap batch. The neural-icons/A1 lane remains independent.

---

# Final normative resolution and implementation certification

The preceding review is retained as historical STOP evidence. The user subsequently froze all four public-policy questions; the following certification supersedes its pending status.

1. **Status — B9 COMPLETE — READY FOR NEXT ROADMAP BATCH.** Splitter and ScrollArea passed the directed, real-browser, full-suite, bundle, and package gates below. B9 is left uncommitted for review.
2. **Original STOP.** `panes` ownership, collapse policy, horizontal RTL semantics, and numeric ScrollArea `left` were previously unresolved. No B9 runtime was changed before that review.
3. **Normative decisions.** `panes` alone owns applied percentages; `sizesChange` proposes immutable sizes; panes are logical-order; pointer/arrows move physically; collapse/restore is P3; ScrollArea `left` is normalized logical `[0,max]`. N2-001 and N2-028 were updated accordingly.
4. **Splitter applied owner.** `_appliedSizes` is computed from readonly `panes`; no writable applied-size mirror or synchronization effect remains. Parent replacement produces no output.
5. **Proposal contract.** `sizesChange: readonly number[]` is a fresh array in pane order. Keyboard emits once per effective gesture. Pointer emits once per changed move, not again at release. Rejection leaves the applied layout intact; acceptance requires a parent write.
6. **Drag preview.** A private signal exists only during an active pointer session. It clears on pointerup, pointercancel, lost capture, or destroy. Rejected layout reappears after clear; an accepted parent write persists.
7. **Size/min/max units.** `pane.size` remains percentage; `min/max` remain pixels converted using current axis geometry for interaction bounds. Missing sizes follow the existing equal-remaining distribution. No geometry-only proposal is emitted.
8. **Orientation.** `orientation: 'horizontal'|'vertical'` replaces the `direction` input, retaining horizontal default. No old input alias exists.
9. **Logical pane order.** Pane indices never reverse. Horizontal RTL lays pane 0 at physical right/inline-start; vertical pane 0 stays at top/block-start. `sizesChange[i]` always addresses `panes[i]`.
10. **RTL pointer.** Physical right movement increases the preceding logical pane in LTR but decreases it in RTL. Vertical movement is independent of text direction. Pointer capture replaces global mouse/touch drag listeners.
11. **RTL keyboard.** Horizontal Right/Left move the separator physically; RTL translates their sign before proposing logical percentages. Vertical Down/Up remain physical. The established 2-percentage-point step is retained without a new public input.
12. **A11y.** Focusable separators retain `role=separator`, perpendicular `aria-orientation`, accessible labels, and logical-start-pane `aria-valuenow/min/max`. Adjacent pixel constraints drive dynamic ARIA bounds.
13. **Collapse deferral.** No collapse API, restoration buffer, or hidden collapsed state was introduced. N2-028 collapse/restore is explicitly DEFERRED P3, not a B9 defect.
14. **Persistence boundary.** Consumer may save proposed percentages externally and rebuild `panes`; Core adds no URL, Router, `localStorage`, `sessionStorage`, or persistence adapter.
15. **ScrollArea coordinate contract.** Every public `left` (`NeuScrollPosition`, `position()`, `scrollPositionChange`, and `scrollTo`) is logical 0 at inline-start and max at inline-end. LTR numbers remain equivalent; RTL raw-browser meaning changes intentionally for Neural 2.
16. **Raw/logical normalization.** Private pure conversion supports negative, reverse, and default RTL browser models; a temporary browser-only probe detects the mode once per instance and is removed synchronously. Public writes clamp to `[0,max]`. SSR performs no probe.
17. **Enhanced tracks.** Horizontal ARIA position and thumb placement derive from logical values; `inset-inline-start` places the thumb correctly in RTL. Native scrolling remains the source of truth.
18. **Home/End/arrows.** Horizontal Home/End use logical 0/max. Arrows and page keys represent physical movement, converted to logical sign for RTL; vertical semantics remain physical. Tests cover both directions.
19. **ResizeObserver lifecycle.** One lifecycle effect observes only while `enhanced` is true, disconnects on false/rebind/destroy, and never constructs an observer on SSR. Fifty repeated create/destroy cycles leave zero active observers.
20. **SSR.** Angular 22.1.6 zoneless consumer renders horizontal LTR/RTL, vertical, native/enhanced ScrollArea with hydration annotations and no initial proposals or browser resource construction.
21. **Hydration.** Real Chromium reused all five SSR host nodes; 0 NG050x, 0 initial outputs, one observer. First pointer acceptance, first RTL keyboard rejection, logical RTL `scrollTo`, and physical RTL pane/thumb placement passed.
22. **Zoneless.** Both the directed TestBed setup and real browser fixture use `provideZonelessChangeDetection()`; no Zone.js contract was added.
23. **Effects/resources.** Splitter: synchronization effects **1→0**, after-render projection **1→1**, global drag listener registrations **6→0**. ScrollArea: lifecycle effects **0→1**, maximum observers **1**, destroy residue **0**. No timer/subscription was added; capture is released on end/cancel/destroy.
24. **Tests.** Directed `test:n2-b9`: **5/5 files, 74/74 tests**. Cases include controlled accept/reject, immutable proposals, pointer capture/cancel, pixel bounds, physical LTR/RTL and vertical gestures, all three RTL raw modes, ScrollArea Home/End/arrows/observer toggles, and the 50-cycle cleanup gate. Legacy event-contract tests were migrated to pointer/proposal semantics.
25. **Bundle.** Raw/gzip/Brotli bytes: Splitter basic **11,707/2,926/2,530**; interactive **11,739/2,948/2,549**; ScrollArea native **48,842/6,787/5,716**; enhanced **48,863/6,797/5,725**; combined **60,550/8,987/7,561**. Root-unused is **0 B raw** (compression container bytes are not retained code). No third-party runtime was added.
26. **Performance.** Reproducible Chromium fixture dispatches 100 representative keyboard and scroll events after correctness assertions. Observed p50/p95: Splitter **below timer resolution / ~0.1 ms**, ScrollArea **below timer resolution / below timer resolution**. These are local event-dispatch samples, not render-throughput or product performance claims.
27. **Public API delta.** Splitter `direction`→`orientation`, `sizeChange`→`sizesChange`, no compatibility aliases; readonly pane input/proposal array. ScrollArea property names unchanged, but public RTL `left` is now logical. Official contract snapshots/reconciliation regenerated; totals remain **99 entrypoints, 793 declarations, 1,487 bindings**.
28. **Package gates.** Production build, contract audit, package audit (including publint/ATTW), verification (**439 files**), all-entrypoint import smoke (**99**), SSR import smoke (**99**), and the real Angular **22.1.6** compatibility consumer pass. General `audit:entrypoints` still reports the previously documented Showcase demo gaps; no B9 entrypoint defect was found.
29. **Full suite.** After the final directed tests, **181/181 files and 2,423/2,423 tests PASS**, without global coverage. The previous legacy-private Splitter tests were replaced with controlled-contract behavioral tests; the final count matches the pre-B9 checkpoint for substantive coverage, not by retaining obsolete private methods.
30. **Portfolio.** Generator/check gate PASS: **96 public components = 47 completed + 49 pending; 16 remaining implementation batches**. Splitter and ScrollArea are COMPLETE. The neural-icons/A1 lane remains independent and untouched.
31. **Remaining P3.** Splitter collapse/restore requires future measured need and a separate controlled policy. No P3 work was implemented in B9.
32. **Git status.** Branch `v2`, HEAD remains the committed forms-auditor checkpoint `230fc1e58ad2beb6b1a5cd1948bf3ec344ba8bdf`. B9 changes are unstaged/uncommitted; staging empty. The foreign untracked TreeTable file is byte-identical (SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`). No symlinks or hydration temp folders; no push/tag/release/publish.
33. **Recommendation — B9 COMPLETE — READY FOR NEXT ROADMAP BATCH.** Leave this worktree for review. The next independent no-icons candidate is B2 menu family (GPT-6 SOL HIGH); A1 depends on its separate neural-icons lane. Neither was started.
