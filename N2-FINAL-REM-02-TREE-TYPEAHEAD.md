# N2 — Final Remediation 02: NeuTree keyboard typeahead P1

## 1. Original blocker

N2 final reccloseout could not certify the frozen P1 keyboard typeahead: its branch had no directed or real-Chromium character-key evidence. This was an evidence gap, not a demonstrated runtime defect.

## 2. Contract authority

`N2-C6-TREE.md`, final NeuTree types/contracts, the current tree keyboard/engine implementation, the existing C6 directed and Chromium fixtures, and the exact blocker in `N2-FINAL-RECLOSEOUT.md`. C6 freezes visible-loaded-label typeahead, row focus independent of selection, disabled rows focusable, and parent-owned hierarchy/selection/expansion.

## 3. Runtime-before-test status

The first implementation step added tests against the unchanged runtime. No product file was edited. One initial test-harness assertion counted Angular-owned timers as NeuTree timers; narrowing that assertion to the 500 ms buffer handle resolved it. No frozen behavior failed.

## 4. Typeahead semantics

One character key extends an ephemeral per-instance prefix. The component searches the currently visible loaded-node projection forward from the focused logical index, wrapping to the beginning. A match moves focus; it does not propose or apply domain state.

## 5. Match source

The source is `NeuTreeNode.label` from the private visible-tree projection, not DOM `textContent`, a template, or a new resolver.

## 6. Normalization

`normalizeTreeSearch` applies NFKC, trim, Unicode whitespace collapse, and lowercase to typed characters and labels. Directed coverage exercises case, full-width `Ｂ`, and surrounding label whitespace. Accent stripping is not part of the frozen implementation and is not claimed.

## 7. Single character

Alpha → `b` focuses Beta, including when Beta is disabled; the actual focused DOM treeitem and unchanged applied selection/expansion are asserted.

## 8. Multiple characters

`b` then `e` within the buffer window focuses Berlin after Beta, in directed and real-Chromium tests.

## 9. Buffer reset

The existing 500 ms timeout clears the prefix. A directed fake-clock test verifies `b`, expiry, then `e` matches Echo rather than continuing `be`; Chromium uses bounded real-time waits for exclusion/reveal scenarios.

## 10. Repeated-character policy

N/A: repeated-character cycling is not promised by C6. The implementation uses ordinary prefix accumulation; no new cycling semantics were added.

## 11. Wrap policy

The existing modulo scan wraps from a later focused item to a matching item near the start. Duplicate-prefix tests also verify deterministic forward search.

## 12. Collapsed branches

A collapsed descendant is absent from the visible projection and cannot receive a typeahead match. After the parent applies expansion, the same loaded descendant becomes matchable. Typeahead itself emits no expansion proposal.

## 13. Disabled nodes

C6 keeps disabled nodes navigable/focusable while blocking activation and selection. The directed typeahead test confirms focus can land on disabled Beta without a business output.

## 14. Duplicate prefixes

Apple/Apricot/Avocado exercise deterministic next-match order and wrap from Avocado to Apple. No random or DOM-text-dependent choice occurs.

## 15. No match

An unmatched prefix leaves actual focus unchanged, raises no exception, and emits no selection, expansion, children request, action, or move.

## 16. Hierarchy replacement

Replacing nodes and hierarchy during a pending prefix makes the next character search the new visible projection. The test finds a newly applied Berlin rather than using a stale key/index/DOM node.

## 17. Virtualization policy

The P1 implementation searches the full loaded *visible logical* projection, not just mounted DOM rows. A directed 100-node virtual fixture finds offscreen index 50, scrolls/mounts it, and focuses its real treeitem without output.

## 18. Interactive descendants

A typed character in a projected input remains with that control; the treeitem key handler ignores bubbled descendant keys. The same handler boundary covers textarea/select/button/contenteditable and other nested controls without a new contract.

## 19. Modifier/composition handling

Ctrl, Meta, Alt, and navigation keys do not enter the prefix; directed tests verify this. No explicit IME/composition typeahead promise exists in C6, so no new composition behavior is asserted or implemented.

## 20. Focus-only invariant

The tests observe real DOM focus, unchanged `aria-selected`, unchanged applied `selection` and `expandedKeys`, and unchanged hierarchy. Typeahead neither selects, expands, checks, reorders, nor requests children.

## 21. Exactly-once

Focus is internal and has no public output. All five NeuTree business outputs remain unchanged. The first post-hydration character causes one `focusin` transition to the expected child, not duplicate handling.

## 22. Accessibility

Directed and Chromium assertions use focused `[role="treeitem"]` DOM nodes. The matching nested row keeps `aria-level="2"`; disabled and selection ARIA remain consistent with applied state.

## 23. Chromium real

The C6 Chromium fixture now uses real Playwright keyboard input for first-character, multi-character, no-match, collapsed-descendant exclusion, applied expansion/reveal, and focus-only behavior. Existing C6 browser paths remain intact.

## 24. Hydration

SSR DOM nodes are reused. There are zero initial business outputs and requests, first post-hydration `c` focuses Child once, and the fixture reports zero NG050x. Typeahead performs no SSR work.

## 25. Zoneless

The real fixture continues to bootstrap with `provideZonelessChangeDetection()`; no Zone.js or manual change-detection workaround was added.

## 26. Lifecycle/timer cleanup

Source audit: `DestroyRef.onDestroy` clears the buffer timeout and cancels a pending focus animation frame. A directed 100-instance cycle checks the exact scheduled 500 ms handle is cleared, then waits past expiry with no late business output. Chromium also destroys the instance with a pending prefix and verifies no late output/error.

## 27. Runtime changes

None. No NeuTree runtime, engine, public API, CSS, contract, or other product file changed for REM-02.

## 28. Directed tests before/after

Before: 2 NeuTree files, 36/36 tests. After: 2 files, 46/46 tests. Ten typeahead tests added; no existing test removed. The final directed run passes without coverage.

## 29. Full suite

`npm test -- --no-coverage`: 187/187 files and 2,500/2,500 tests PASS. No global coverage was rerun; the reccloseout coverage observation remains historical evidence for this gap. ATTW is untouched.

## 30. Git diff

REM-02 owns only `projects/ui-core/tree/neu-tree.component.spec.ts`, `scripts/test-n2-c6-hydration.mjs`, and this report. Earlier Calendar/closeout/other dirty work remains untouched and unstaged. The foreign untracked `projects/ui-core/tree-table/public_api 2.ts` remains outside this scope. No commit, push, tag, release, or npm publish.

## 31. Recommendation

NEUTREE TYPEAHEAD REMEDIATION — CERTIFIED

This certifies the narrow typeahead P1 behavior only; it does not perform another final reccloseout.
