# N2-015C — Controlled expansion, treegrid keyboard and focus

## 1. Status

**READY FOR N2-015D.** Controlled expansion, row-focused keyboard navigation, deterministic focus reconciliation, SSR/hydration, zoneless operation, performance, bundle, and contract gates pass.

## 2. Scope

Implemented only interactive expansion, `expandedKeysChange`, row roving focus, treegrid keyboard navigation, semantic focus restoration, and their tests/audits. Selection, query, remote loading, virtualization, editing, reorder, export, TreeSelect, the productive TreeTable entrypoint, and N2-011K remain untouched.

## 3. Starting checkpoint

N2-015B is the clean parent checkpoint `4f20b653f9838365ae75ec2f727fad31611169b4` (`feat(tree-table): implement N2-015B hierarchy renderer`) on `v2`.

## 4. Expansion owner

`expandedKeys` remains the only applied expansion owner and is read directly as a signal input. The candidate has no internal applied expansion state and never mutates the parent value.

## 5. Proposal contract

The pure interaction engine creates `NeuTreeTableExpandedKeysChange<K>` with a new readonly `next`, exact-K `changedKey`, and `source: 'toggle' | 'keyboard'`. Numeric and string keys remain distinct.

## 6. Pointer expansion

The native expander delegates one click through the renderer boundary and produces exactly one proposal. Leaf nodes have no active expander.

## 7. Keyboard expansion

The logical forward arrow proposes expansion for a collapsed expandable node; the logical backward arrow proposes collapse for an expanded node. LTR and RTL map physical arrows to those logical operations.

## 8. Accept/reject

The renderer never applies its proposal. Rejection leaves DOM and ARIA on the applied input with no follow-up; acceptance occurs only when the parent writes a new `expandedKeys` value and produces no echo.

## 9. Applied projection reuse

Expansion continues through the single N2-015B hierarchy projection. No second visible-row list, DOM-derived hierarchy, or alternate flatten engine was introduced.

## 10. Expander semantics

Expanders are native `button[type=button]` controls with applied `aria-expanded`, localized expand/collapse labels, and `tabindex=-1` inside the row-focused model. The glyph is hidden from accessibility APIs.

## 11. Interaction boundaries

One delegated `focusin`, `click`, and `keydown` boundary exists on `tbody`; there are no per-row handlers. Expander clicks are identified before the general interactive-descendant guard and cannot trigger row focus/action or a second proposal.

## 12. Focus owner

Focus identity is a private ephemeral signal of exact semantic K plus a private snapshot used only for deterministic reconciliation. No durable `HTMLElement`, public focus state, or domain owner exists.

## 13. Roving tabindex

For a non-empty projection exactly one row has `tabindex=0`; all other domain rows have `-1`, cells are not tab stops, and the treegrid has `-1`. For an empty/loading/error projection the treegrid has `tabindex=0` and state rows are not roving targets.

## 14. Initial focus

The first visible row is the initial roving target. Initial render never calls `focus()`, so SSR, hydration, and ordinary parent writes do not steal document focus.

## 15. ArrowDown

Moves to the next flattened visible node in O(1) using `logicalVisibleIndex`; the last row is a stable no-op and navigation does not wrap.

## 16. ArrowUp

Moves to the previous flattened visible node in O(1); the first row is a stable no-op.

## 17. ArrowRight

LTR Right / RTL Left proposes expand when collapsed, moves to the first visible child when expanded, and is a no-op on leaves.

## 18. ArrowLeft

LTR Left / RTL Right proposes collapse when expanded, otherwise moves to the visible parent. A collapsed root is a no-op.

## 19. Home/End

Home and End move directly to the first and last flattened visible nodes without scanning by key.

## 20. Enter/Space policy

Both are **N/A in C** and remain reserved for later row action, selection, and editing contracts. Tests prove they do not move focus or emit an expansion proposal.

## 21. Interactive descendants

Keyboard events originating from buttons, inputs, textareas, selects, links, editable content, or button/link roles are ignored by row navigation. Native descendant behavior remains intact.

## 22. Focus after expand

Accepted expansion retains focus on the expanded parent. A subsequent logical-forward arrow moves to the first loaded child. Rejected expansion leaves focus and presentation unchanged.

## 23. Focus after collapse

When an applied collapse hides the focused descendant, the nearest surviving visible ancestor receives the roving target and DOM focus, but only if focus was actually inside the treegrid.

## 24. Parent-write reconciliation

One narrow effect observes a deterministic semantic projection fingerprint and reconciles only when the applied visible structure changes. Ephemeral reads/writes run untracked, so the effect cannot become a reaction loop. It does not mirror hierarchy/expanded state and does not emit on parent writes.

## 25. Reconstructed identity

Reconstructed `T`, arrays, hierarchy relations, reordered input objects, and columns preserve focus when the same exact K remains visible. Object identity is never used.

## 26. Removed-node fallback

The pure policy is: retained K; nearest visible ancestor; same old flattened index (next); last remaining previous row; container. Tests cover ancestor, middle removal, last removal, and empty projection.

## 27. Unloaded children

An unloaded/unknown child relation remains expandable and can produce a controlled expansion proposal, but C emits zero `dataRequest` and does not invent children or remote state.

## 28. Loading/error relations

Applied root loading/error/empty states keep the treegrid focusable at the container and have no semantic row tab stops. Child relation presentation remains parent-owned; no retry or request coordinator was added.

## 29. Writable state

The only signal writable added in C is the allowed ephemeral `focusedKey`. Pending focus metadata, the semantic focus snapshot, and fingerprint are non-domain ephemeral fields; there are zero writable mirrors of inputs, hierarchy, expansion, or flattened rows.

## 30. Effects ledger

Product `effect()` count is **2**, both justified true side effects: one emits deduplicated public hierarchy diagnostics and one reconciles semantic focus after an applied structural transition. There are zero render effects, synchronization effects, request effects, or domain-state effects.

## 31. afterNextRender ledger

One bounded use schedules DOM focus after a structural render. Targets are a semantic exact-K token or the container, stale row targets are revalidated against the current projection, and `DestroyRef` cancels pending work.

## 32. DOM lookup/IDs

Row lookup uses `tbody.rows[logicalVisibleIndex]` plus exact-token verification; no user key enters a CSS selector. No row IDs or `aria-activedescendant` IDs are generated, so there are no duplicate or unstable IDs and actual row focus remains the accessibility source of truth.

## 33. SSR

Real Angular 22 SSR renders the same native table/treegrid, applied expansion, ARIA levels/positions/sizes, roving tabindex, expander labels, nested templates, and empty/loading/error/unloaded states. It performs no focus side effect, output, request, or browser-global access.

## 34. Hydration

Real Chromium reuses table, head, and row DOM with **0 NG050x**. The valid primary tree emits zero initial outputs. A separate invalid-tree fixture emits exactly one browser-side `invalid-tree-column` diagnostic after SSR emitted none, proving there is no SSR→hydration duplicate. Rejected and accepted pointer/keyboard expansion are exactly once; empty/non-empty focus transitions are deterministic; requests remain zero.

## 35. Zoneless

All unit and real consumer fixtures use `provideZonelessChangeDetection()`. There is no Zone.js, `NgZone`, `ChangeDetectorRef`, `detectChanges`, or `markForCheck` product architecture.

## 36. Keyboard matrix

| Gesture                | Result                                         |
| ---------------------- | ---------------------------------------------- |
| ArrowDown / ArrowUp    | PASS — next/previous visible, no wrap          |
| ArrowRight collapsed   | PASS — one controlled proposal in LTR          |
| ArrowRight expanded    | PASS — first visible child in LTR              |
| ArrowRight leaf        | PASS — no-op                                   |
| ArrowLeft expanded     | PASS — one controlled collapse proposal in LTR |
| ArrowLeft child        | PASS — visible parent in LTR                   |
| ArrowLeft root         | PASS — no-op when collapsed                    |
| RTL physical arrows    | PASS — logical forward/backward swapped        |
| Home / End             | PASS — first/last visible                      |
| Enter / Space          | N/A — reserved, stable no-op                   |
| Interactive descendant | PASS — row keyboard ignored                    |

## 37. Focus matrix

| Case                                  | Result                                                     |
| ------------------------------------- | ---------------------------------------------------------- |
| Initial / next / previous             | PASS                                                       |
| Root→child / child→parent             | PASS                                                       |
| Expand accepted / rejected            | PASS                                                       |
| Collapse accepted / rejected          | PASS                                                       |
| Focused descendant hidden             | PASS — ancestor                                            |
| Parent write / reconstructed same K   | PASS — no steal, semantic K retained                       |
| Focused K removed / malformed removal | PASS — deterministic fallback                              |
| Empty transition / restore            | PASS — container then first row only when focus was inside |
| Destroy while pending focus           | PASS — callback cancelled, no late side effect             |

## 38. Exactly-once

Pointer gesture: one proposal. Keyboard gesture: one proposal. Acceptance: zero echo. Rejection: zero follow-up. Hydration: zero initial state/proposal output, plus exactly one browser diagnostic for the intentionally invalid diagnostic fixture. Event delegation removes duplicate handler paths.

## 39. Immutability

The pure proposal engine returns new arrays and preserves frozen inputs. Existing deep-frozen hierarchy/data/roots/children/expanded/column fixtures remain green; no `T` or consumer collection is mutated.

## 40. Deep tree

The iterative hierarchy baseline still handles depth 1000 without stack overflow. Parent/first-child navigation is index/map based and introduces no recursive focus search.

## 41. Wide tree

The 10,000-root projection remains deterministic. Next, previous, Home, and End are O(1) over the already-applied visible projection and perform no DOM scan.

## 42. Expansion performance

Reproducible p50/p95: proposal 100 keys **0.0066/0.0098 ms**; proposal 1,000 keys **0.0479/0.0488 ms**; expand 100-child branch **0.1639/0.3303 ms**; collapse **0.0615/0.1255 ms**; nested branch **0.1255/0.1752 ms**. These are test-environment observations, not browser marketing claims.

## 43. Keyboard performance

At 1k and 10k visible nodes, next/previous/Home/End p50 values remain approximately **0.0001 ms**. One hundred navigation cycles measure **0.0038/0.0039 ms** p50/p95; 100 proposal cycles measure **0.1317/0.1609 ms**.

## 44. Lifecycle

Fifty create/destroy cycles measure **36.8830/44.0430 ms** p50/p95. One hundred navigation and proposal cycles pass, and destruction with pending focus produces no late focus, output, request, timer, or exception.

## 45. Listeners/resources

Exactly one Angular template boundary each handles `focusin`, `click`, and `keydown` on `tbody`. There are zero manual row, document, window, scroll, observer, timer, subscription, or rAF resources.

## 46. Static a11y

Directed assertions cover accessible treegrid name, one roving row, levels, expanded only on expandable nodes, sibling position/size, expander labels, leaf semantics, logical indentation, and absence of duplicate IDs. The boundary audit freezes one delegated listener boundary.

## 47. Browser a11y

Real Chromium covers expanded/collapsed nodes, nested focus, leaf behavior, unloaded expandability, root loading/error states, rejection, acceptance, empty/container focus, and restore. `axe-core` is not installed, so no axe claim is made.

## 48. Bundle BASIC

Hardened N2-015C BASIC is **57,294 B raw / 10,203 B gzip / 8,596 B Brotli**. Versus N2-015B this is **+8,093 raw / +2,135 gzip / +1,810 Brotli**. The lifecycle-to-effect hardening changes the pre-hardening C baseline by only **+103 raw / +12 gzip / -24 Brotli**. Cost remains attributed to core renderer interaction/focus logic and the pure interaction engine, not an optional feature leak.

## 49. Bundle interactive

Expansion-interaction, keyboard-focus, nested, and BASIC consumers all resolve to **57,294 / 10,203 / 8,596 B** because C is core behavior of the single facade. The all-template consumer is **57,795 / 10,381 / 8,722 B**. No feature module, second component, or public entrypoint was added.

## 50. Root-unused

Root-unused remains **0 B raw** (compression wrapper values: 20 B gzip / 1 B Brotli). Gate PASS.

## 51. Dependency graph

Minified source attribution: renderer 6,542 B; facade 4,536 B; hierarchy engine 3,524 B; template contracts 1,704 B; interaction engine 1,017 B; neutral field resolver 108 B; exact-key helper 47 B. Package imports remain only `@angular/core` and `@angular/common`; all legacy/Table/TableCore/Forms/Router/HTTP/storage/PrimeNG edges are absent.

## 52. Legacy regression

The unchanged legacy TreeTable component, hierarchy controller, and template directive suites pass **76/76**.

## 53. NeuTable regression if any

None required: C did not move or modify either neutral helper or any NeuTable 2 source.

## 54. Type/contract gates

`test:n2-tree-table-types`, `test:n2-tree-table-contracts`, the 42/21/8 legacy ledger, and the boundary audit pass. The directed candidate suite passes **19/19**. Positive fixtures compile and 11 invalid shapes remain rejected.

## 55. Build/package

Production build passes. Publint and ATTW report no problems; package verification passes for **431 files**. Existing Menu NG8102 notices remain unchanged global debt. The candidate stays isolated and unpublished.

## 56. API surface

Unchanged and exact: **66 public types, 11 directives, 1 component, 22 inputs, 12 outputs, 4 methods**. There is no alias, wrapper, new output, new input, or entrypoint.

## 57. Regressions

No functional regression was found in directed candidate, legacy, SSR/hydration, build, package, type, contract, ledger, boundary, performance, or bundle gates. No global coverage or full suite was run, per phase policy.

## 58. Risks

Core focus/keyboard behavior adds 2.135 KB gzip to BASIC and is intentionally retained. Two narrow effects now model the genuine diagnostic-emission and focus-reconciliation side effects; both remain isolated from domain ownership. Future virtualization must preserve the same semantic-token restoration contract.

## 59. Git diff/status

The single C commit contains only architecture clarifications, candidate runtime/tests, the real hydration fixture, static/bundle/performance tooling, generated C baselines, and this report, with parent `4f20b653f9838365ae75ec2f727fad31611169b4`. `git diff --check` passes; no product entrypoint, legacy TreeTable, NeuTable, Table 1.x, TableCore, push, tag, release, or npm publish changed.

## Angular 22 signal-first / zoneless audit

- `@Input`: **0**; `@Output`: **0**; `EventEmitter`: **0**; `model()`: **0**.
- Product `effect()`: **2**; render effects: **0**; writable input/domain mirrors: **0**. The diagnostic effect emits deduplicated public errors; the focus effect reconciles DOM focus after applied structural transitions.
- Signal queries: **7 textual uses** (`viewChild` once, six `contentChildren` queries).
- Lifecycle methods: **0**; lifecycle interfaces, including `OnDestroy`: **0**. Both former `ngDoCheck()` methods were removed, not merely detached from interfaces.
- `DestroyRef` has **2 textual occurrences** (import plus injection) and exactly one cleanup registration.
- `afterNextRender`: **1**, solely for bounded, semantic, stale-safe focus after DOM mount.
- `ChangeDetectorRef`: **0**; `NgZone`: **0**; Zone.js: **0**.
- Static audit freezes exactly two justified effects and fails on decorator/EventEmitter/model drift, any lifecycle method/interface, render-effect drift, zone/change-detector drift, manual resources, per-row handlers, or legacy dependency edges.

## 60. Recommendation

**READY FOR N2-015D.** Do not start N2-015D and do not resume N2-011K without explicit authorization.
