# N2-021 — Tabs, Panel, Sidebar y estados de navegación

## 1. Status

**READY FOR N2-022.** N2-021 is complete and remains intentionally uncommitted for review.

## 2. Starting checkpoint

N2-020 was closed first in local commit `63713e2b94e0eb8f020917ab9804d1f1f215555c` (`feat(accordion): modernize Accordion for Neural 2`), on branch `v2`, with a clean tree and no symlinks before N2-021 began.

## 3. Authoritative scope

The roadmap and N2-001 controlled-state contracts resolve N2-021 to three applied state slices: Tabs `activeId`, Panel `collapsed`, and Sidebar `collapsed`; their matching proposal outputs; one-time uncontrolled seeds; stable instance-scoped IDs; and external opt-in persistence. Overlay open/close ownership in Sidebar belongs to the later overlay phase and was not redesigned here.

## 4. Component inventory

- **IMPLEMENTED:** Tabs active state, Panel collapse state, Sidebar collapse state, state seeds, ID namespace, keyboard/focus separation, contracts and gates.
- **PRESERVED:** Fieldset and ScrollArea behavior; Sidebar overlay lifecycle, focus trap and scroll locking.
- **EXTERNALIZED:** Tabs URL synchronization and persistence for all three applied slices.
- **OUT OF SCOPE:** overlay architecture, new navigation components, Table/TreeTable, and N2-022.

## 5. Breaking delta

Tabs removes `tabParam`, the implicit URL owner and the old `tabChange` output. The replacement contract is `activeId` plus `activeIdChange`. There is no compatibility alias, wrapper or internal Router fallback.

## 6. Tabs public contract

`NeuTabsComponent<K,T>` is keyed by exact `string | number` identity and exposes readonly `tabs`, `activeId`, `initialActiveId`, `flush`, `ariaLabel`, and `activeIdChange`. `NeuTab`, `NeuTabKey` and the strongly typed `NeuTabLabelContext<T>` are exported from the existing Tabs entrypoint; no new entrypoint exists.

## 7. Panel public contract

`NeuPanelComponent` exposes applied `collapsed`, proposal `collapsedChange`, and one-time `initialCollapsed`. A controlled gesture proposes state but does not alter rendered state until the parent applies it.

## 8. Sidebar public contract

`NeuSidebarComponent` exposes the same collapse contract as Panel. Existing overlay `open`/`close`, URL parameter behavior, focus restoration and document scroll locking remain unchanged because they are not the N2-021 state slice.

## 9. Fieldset and ScrollArea

Neither component was redesigned. Their existing contracts and tests remain active. The N2-021 static gate explicitly proves Fieldset remains present.

## 10. Ownership model

Applied state is always read from the controlled input when it is bound. User interaction emits a proposal. Uncontrolled mode owns only minimal ephemeral local state seeded once. There is no writable mirror of controlled state and no state-synchronization effect.

## 11. Initial seeds

`initialActiveId` and `initialCollapsed` are read once when an instance establishes uncontrolled lifetime mode. Later parent changes to a seed do not overwrite locally accepted uncontrolled interaction.

## 12. Lifetime mode

Controlled versus uncontrolled mode is fixed for the lifetime of each instance. An invalid switch is ignored and produces one development warning; it does not create a second applied owner.

## 13. URL adapter

Tabs no longer injects Router or `NeuUrlStateService`. A consumer maps URL state to `activeId` and maps `activeIdChange` back to its URL adapter. A directed fixture verifies that a proposal is written once and that a simulated back/forward parent write updates the applied tab without echoing another proposal.

## 14. Storage adapter

Storage follows the same external pattern: hydrate a parent signal before binding, bind it to `activeId`/`collapsed`, and persist accepted proposals in the parent. Tabs, Panel and Sidebar never read `localStorage` or `sessionStorage`; server rendering therefore remains deterministic. No product storage adapter or hidden persistence owner was introduced.

## 15. Stable IDs

Each Tabs instance receives a stable `NeuIdGenerator` namespace. Button and panel IDs combine the instance namespace with a deterministic exact-key token. Two instances with identical keys produce unique DOM IDs in unit tests and in the real SSR/hydration fixture.

## 16. Native semantics

Tabs retains native buttons inside `role="tablist"`, with `role="tab"`, `aria-selected`, `aria-controls`, and paired `role="tabpanel"`/`aria-labelledby`. Panel retains native button and region relationships. Sidebar retains navigation/dialog semantics according to persistent/overlay mode.

## 17. Focus versus selection

Roving focus is ephemeral UI state and is deliberately separate from applied selection. Arrow, Home and End gestures move focus among enabled tabs without emitting `activeIdChange`; click/activation is the selection proposal path.

## 18. RTL, Home and End

Horizontal arrows reverse in an applied RTL ancestor. Home and End move to the first and last enabled tabs, disabled tabs are skipped, and modified arrow shortcuts are ignored.

## 19. Controlled rejection and parent writes

Tabs, Panel and Sidebar all have directed rejection tests. Reconstructed parent values with the same semantic key are accepted by exact identity. Parent writes update the DOM without output echoes.

## 20. Multiple instances

Nested Tabs and sibling Tabs with identical keys remain isolated. Label templates resolve against their owning Tabs instance, IDs never collide, and there is no document-global navigation state.

## 21. Signals graph

The graph is `input -> computed effective state -> template`. Tabs and Panel use zero product effects. Sidebar keeps its two pre-existing overlay lifecycle effects only; collapse state does not add an effect.

## 22. Effects ledger

- Tabs: **0** effects.
- Panel: **0** effects.
- Sidebar: **2** existing effects for overlay scroll/focus lifecycle; **0** new collapse synchronization effects.
- Fieldset/ScrollArea: unchanged.

## 23. Resource ledger

Tabs removes its ResizeObserver and animation-frame indicator measurement; the active marker is CSS-based. It has no persistent timer or observer. Sidebar retains one bounded focus timer and existing cleanup verified by two 100-cycle stress tests.

## 24. SSR

The real Angular 22 fixture renders two Tabs instances, Panel and persistent Sidebar with applied state. SSR emits unique IDs, native semantics, visible applied content and zero proposal events. No product browser API is evaluated to derive state.

## 25. Hydration and zoneless

Chromium hydration with `provideZonelessChangeDetection()` reuses the first tab DOM node, reports zero NG050x diagnostics, preserves unique IDs, emits zero hydration echoes, and executes the first Tabs, Panel and Sidebar proposals exactly once.

## 26. Directed tests

The final directed suite contains **4 files / 89 tests**: Tabs 22, Panel 13, Sidebar 52, and Sidebar lifecycle stress 2. The previous suite was 44 Tabs + 10 Panel + 52 Sidebar = 106 tests; legacy Tabs URL/measurement cases were removed or replaced by denser controlled-state, identity, collision, SSR and adapter coverage. P1 behavior remains covered.

## 27. Type and contract gates

`test:n2-navigation-types` compiles positive and negative fixtures for generic Tabs keys, typed template context, controlled inputs and removed legacy members. `test:n2-navigation-contracts` has 5/5 passing static contracts covering surface, ownership, focus, IDs, effects and forbidden dependencies. Public contracts were regenerated with the official snapshot command and audit successfully.

## 28. Performance

Reproducible p50/p95 milliseconds: Tabs 1k projection **0.002/0.064**, 1k membership reads **0.021/0.133**, 1k-domain parent writes **0.002/0.007**, Panel toggle fixture **0.906/2.682**, Sidebar toggle fixture **0.835/1.773**, and 50 Tabs create/destroy cycles **0.754/1.759** per cycle sample. These are test-environment baselines, not browser-product claims.

## 29. Bundle

Angular-compiled, minified consumer ESM (Angular/RxJS external): Tabs is **21,376 B raw / 5,312 B gzip / 4,652 B Brotli**; Panel **45,937 / 6,010 / 5,049**; Sidebar **44,519 / 9,395 / 8,181**; combined **107,484 / 18,105 / 14,899**. Combined delta versus HEAD is **+3.18% raw / +5.05% gzip / +3.53% Brotli**. The 871 B combined gzip increase is attributed to the three controlled-state/lifetime-mode implementations and exact collision-free Tabs identity; no optional or forbidden graph entered the bundle. Tabs isolated also replaces a 3,101 B URL-state edge with the 4,177 B shared internal ID/foundation edge. The approximately 5% combined increase is accepted as the bounded cost of the frozen contracts, not accidental retention. Root-unused remains **0 B raw** and forbidden graph tokens are empty.

## 30. Dependencies

Tabs has no Router, URL-state, Forms, HTTP, storage, PrimeNG, Table, TreeTable or TableCore edge. Panel has the same clean boundary. Sidebar's pre-existing URL-state edge remains solely for its unchanged overlay-open contract and is explicitly deferred to the overlay phase; it does not own collapsed persistence.

## 31. Build and package

Production build passes. Publint reports no problems, package verification passes for 447 files, and the final regenerated public contract audit passes for 101 entrypoints, 798 exported declarations, 1,511 bindings and 5,294 classified symbols.

## 32. Regressions and known debts

No Table/TreeTable runtime was touched and TableCore remains absent. The existing Menu NG8102 warnings are unchanged and out of scope. Global coverage and the full suite were not run because the change is isolated and all proportional directed, SSR/hydration, build, contract and package gates are green.

## 33. Git diff and hygiene

The worktree contains only N2-021 runtime, directed tests, fixtures, scripts, generated baselines and this report. It is intentionally uncommitted on `v2`, based on `63713e2b94e0eb8f020917ab9804d1f1f215555c`. `git diff --check`, symlink, temporary-directory and scoped Table-family audits are required final gates; no push, tag, release or npm publish is performed.

## 34. Recommendation

**READY FOR N2-022.** N2-022 has not been started.
