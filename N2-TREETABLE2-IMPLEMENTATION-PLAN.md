# NeuTreeTable 2 — Implementation plan

## Authority and execution rule

Este plan depende de `N2-TREETABLE2-FINAL-ARCH.md`, `N2-TREETABLE2-TYPE-CONTRACTS.md` y `N2-TREETABLE2-LEGACY-LEDGER.md`. N2-015A no implementa ninguna fase. Cada fase futura debe terminar con un checkpoint revisable, sin avanzar automáticamente a la siguiente.

Reglas comunes:

- una sola fachada `<neu-tree-table>` en `@neural-ui/core/tree-table`;
- cero dependencia runtime de NeuTable, TableCore, Table 1.x o TreeTable 1.x;
- `T` limpio, identidad exacta por `K`, query fields cerrados por `F`;
- applied state por inputs, proposals por outputs, sin `model()`;
- `dataRequest` como único canal remote;
- no compatibility layer, wrapper, inheritance ni aliases legacy;
- no TreeSelect 2, Showcase, entrypoint switch ni reanudación de N2-011K antes de certificar I;
- no global coverage rutinaria; full suite y coverage global solo en I o ante regresión transversal demostrada.

## Dependency graph

```text
B contracts/renderer/identity/hierarchy validation
                    ↓
C projection/expansion/treegrid/keyboard/focus
                    ↓
D selection/propagation/indeterminate
                    ↓
E query/sibling sort/filter/root pagination/layout
                    ↓
F roots/children remote state machine
                    ↓
G fixed visible-sequence virtualization
                    ↓
H editing/actions/export/private optional chunks
                    ↓
I SSR/hydration/a11y/performance/bundle/final certification
                    ↓
resume N2-011K physical replacement
```

## N2-015B — Contracts, renderer skeleton and hierarchy core

### Deliverables

- Candidate isolated under a private `tree-table/next` path or equivalent non-product location; no final entrypoint exposure.
- Executable public type/component/directive contracts matching A: 66 public types, 11 directives, one component, 22 inputs, 12 outputs and four methods.
- Private renderer owned by NeuTreeTable, never NeuTable composition.
- Exact-K token/index primitive with string/number separation.
- Framework-free validation of roots/children relations: duplicate K, duplicate parent, duplicate child reference, missing node, orphan and cycle diagnostics.
- Private `TreeProjectionNode<T,K>`; no `__tree*` fields and no public wrapper.
- Basic loaded client hierarchy render with native table/treegrid semantics in SSR markup.
- Neutral extraction changes only when required by B and guarded by NeuTable directed regressions; no public API drift.

### Directed gates

- Type fixtures: valid generic usage plus failures for `any`, unstable/missing rowKey, invalid F and metadata on T assumptions.
- Pure identity/validation tests including `1` versus `'1'`, cycles and deep 1k chain without stack overflow.
- Renderer integration: roots/children, columns, templates, empty/loading/error.
- Static boundary audit: zero runtime edge to table/table-core/legacy tree-table.
- API snapshot candidate-only; root-unused 0 B.
- SSR import/render and zoneless basic fixture.

### Stop conditions

Stop if relation ownership needs a second canonical form, if the renderer needs NeuTable, or if exact-K indexing cannot preserve reconstructed entities.

## N2-015C — Expansion, visible projection, treegrid, keyboard and focus

### Deliverables

- Controlled `expandedKeys` and `expandedKeysChange`; rejected proposal produces no visible expansion and no request.
- Pure iterative flatten projection with sibling/path/depth/posinset metadata.
- Filter-reveal hook present but query behavior still disabled until E.
- Row-focused treegrid, semantic SSR attributes and roving tabindex.
- Keyboard: Up/Down, Home/End, Right expand/first child, Left collapse/parent, Space selection hook, Enter default action/edit hook, RTL-aware hierarchy arrows.
- Focus restoration for collapse, removal and virtual-unmount contracts; renderer-level event delegation.

### Directed gates

- Pure expansion/flatten truth tables and 1k depth.
- Integration for parent rejection, ancestor collapse, node removal and reconstructed T with same K.
- Keyboard matrix in LTR/RTL; editors and interactive descendants do not steal navigation incorrectly.
- Static and automated a11y; SSR treegrid roles/aria from first byte.
- No request tests yet except assertion that expansion alone cannot emit before applied acceptance.

### Stop conditions

Stop if focus must be patched post-render through DOM scans or if row/cell focus models become mixed.

## N2-015D — Selection and loaded-subtree propagation

### Deliverables

- Controlled K selection for none/single/multiple/checkbox.
- Pure proposal engine over visible/loaded scopes.
- `loaded-subtree` propagation only; no symbolic remote selection in P1.
- Disabled node as propagation/aggregation boundary; independently reachable enabled descendants remain selectable directly.
- Indeterminate calculation distinguishes partial loaded selection from unknown descendants and never claims backend completeness.
- Applied disabled keys remain applied; gestures do not auto-correct parent state.

### Directed gates

- Pure truth tables for loaded/partial/unloaded, disabled boundaries, filtered presentation, collapsed branches and duplicate keys.
- Integration for controlled rejection and exactly-once keyboard/pointer/toggle-all proposals.
- ARIA selected/multiselectable/checked mixed checks.
- Performance: 10k loaded selection propagation and no O(n²).

### Stop conditions

Stop if a P1 consumer requires symbolic subtree selection across unloaded descendants; that changes the public selection contract.

## N2-015E — Query, sibling sort, filtering, root pagination, columns and layout

### Deliverables

- `NeuTreeTableQuery<F>` behavior: zero-based root page, search, ordered sibling sort and filter AST.
- Client sort within each sibling set only; stable nullish/custom comparator behavior.
- Client filter result = matching nodes plus ancestor paths; unrelated branches removed; descendants of a matching node are not included unless they match or lead to a match.
- Filter reveal computed without writing `expandedKeys`; clearing restores applied expansion presentation.
- Remote query is parent/backend-authoritative; no claim over unloaded descendants.
- Root pagination after client filter/sort; expanded descendants do not consume page size.
- Shared neutral field resolver/predicate/comparator usage; no flat pipeline reuse.
- Controlled layout for order, visibility, widths and pinning; `treeColumnId` explicit and validated.
- Query/filter/sort/layout interaction UI with no new applied owners.

### Directed gates

- Pure filter/sort/root-pagination truth tables, null/zero/empty/date/custom predicate cases.
- Query proposal acceptance/rejection and filter-clear expansion restoration.
- Column layout, tree column hidden/missing diagnostics and exactly-once sort/search/filter/page proposals.
- Bundle audit: advanced builder remains private/lazy.
- Performance: 10k filter, wide sibling multi-sort and deep tree.

### Stop conditions

Stop if a single query shape cannot express root pagination unambiguously or if a filter mode beyond “matches + ancestors” is required for P1.

## N2-015F — Remote roots/children state machine

### Deliverables

- One private coordinator and one public `dataRequest` union (`roots|children`).
- Monotonic per-instance request IDs; query, hierarchy and relation revisions.
- Browser-only root request: SSR 0, hydrated satisfied 0, unsatisfied browser 1.
- Child request after accepted expansion only; rejected expansion 0.
- Dedupe for pending relation; explicit retry through same channel; no timers/backoff.
- Stale response classification by request/revisions/parent K; no content heuristics.
- Parent-owned loading/error/data/hierarchy; no cache or response writes.
- Remote sort/filter/page authoritative; loaded relations remain the only projected tree.

### Directed gates

- Reducer/state-machine pure tests covering initial/query/page/expand/retry, collapse pending, re-expand, parent replacement and stale responses.
- Integration with two instances and concurrent requests; no singleton/global mutable state.
- Huge remote totals/child counts with no proportional allocation.
- SSR/hydration request counts exactly as specified.
- Effect census remains one request coordinator.

### Stop conditions

Stop if backend semantics require a second request output, hidden HTTP, cache ownership or a global flattened remote index.

## N2-015G — Fixed-height visible-sequence virtualization

### Deliverables

- Fixed-height virtual window over the loaded flattened visible sequence.
- `projectionRevision` and K-based anchor restoration across expand/collapse/insertion/removal.
- Remote mode deliberately virtualizes loaded visible nodes only; it never fabricates global visible indexes.
- RangeChange is presentation output, not transport. No VIEWPORT request variant in P1.
- One scroll listener, at most one ResizeObserver and one scheduled rAF; zero per-node observers/listeners.

### Directed gates

- Pure range/spacer/index math and projection-revision invalidation.
- Client top/mid/end, expansion insertion and collapse anchor integration.
- Remote loaded slice with unknown totals and no hidden dataRequest.
- Focus unmount/remount restoration and DOM count bound.
- Performance 10k visible, overscan bound and 100 create/destroy cycles.
- Bundle attribution for shared neutral range math.

### Stop conditions

Stop if P1 requires variable height, global backend flattened ranges, grouping+virtual or expansion detail rows.

## N2-015H — Editing, actions, export and optional boundaries

### Deliverables

- Private generic edit session keyed by `K + columnId`; cell and row modes.
- Hidden edited node emits exactly one cancel/edit-state proposal and closes the local session token; no repeated effect and no mutation of T.
- Data-oriented `rowAction` for click/double-click/keyboard/context-menu intent; no DOM Event and no parallel context-menu selection.
- Export method/scopes: visible, loaded and selected; unique reachable T only, no synthetic hierarchy rows or private metadata.
- CSV/JSON/XLSX use column projection; remote/unknown selected data delegates through `exportRequest`; no hidden enumeration.
- Private dynamic editor, advanced filter and format chunks. Tree drag/reparent, row detail, grouping and hierarchy-preserving JSON remain out of scope.

### Directed gates

- Editing session/reconciliation/visibility tests, validation, commit/cancel exactly once and destroy safety.
- Action routing with interactive-descendant guard.
- Export projection for visible/loaded/selected, virtual, remote partial, active draft excluded, pinned/order/hidden columns.
- Serializer security/encoding tests inherited from neutral implementations.
- SSR import never evaluates browser download APIs; chunks absent from initial.
- Bundle matrix basic/rich/editor/filter/CSV/JSON/XLSX/root-unused.

### Stop conditions

Stop if export needs backend enumeration, editing needs CVA/Forms in basic, or context menu needs a dedicated selection owner.

## N2-015I — Final certification and replacement readiness

### Deliverables

- Complete public API/contract snapshots for the candidate, not yet final entrypoint.
- Full P1 feature matrix F-071…F-105 with P2/P3 limitations explicit.
- Real Angular 22 consumer, SSR render, Chromium hydration and zoneless matrix.
- Static/automated a11y plus full keyboard/focus certification.
- Reproducible performance and bundle baselines against TreeTable 1.x using identical scenarios.
- Listener/observer/effect/resource census and 100 create/destroy lifecycle verification.
- Migration fixtures: simple, lazy children, expansion, selection, filter/sort/root page, virtual, editing and export.
- Removal-readiness proof: no runtime imports from Table 1.x, TableCore, NeuTable or TreeTable 1.x; legacy 42/21/8 fully accounted.

### Gates

- All NeuTreeTable 2 pure/integration/browser tests green.
- Full library unit suite mandatory.
- Global coverage once at certification; thresholds unchanged.
- Build, package audit/verification, publint, ATTW, imports and SSR smokes.
- Root-unused 0 B; basic initial target ≤50 KB gzip; no heavy optional code initial.
- Performance gates: linear flatten/filter, sibling sort sum `O(n log n)`, no deep recursion overflow, bounded virtual DOM.
- No P1 loss relative to the frozen Prime mapping.

### Final outcomes

- `CERTIFIED TO RESUME N2-011K`, or
- `NEEDS DESIGN REVIEW` with the exact failed invariant.

N2-015I does not itself remove legacy runtime or switch the entrypoint.

## Gate matrix

| Phase | Pure             | Integration | Types/contracts | SSR/hydration | A11y           | Bundle        | Performance              | Full suite/coverage |
| ----- | ---------------- | ----------- | --------------- | ------------- | -------------- | ------------- | ------------------------ | ------------------- |
| B     | required         | basic       | required        | SSR basic     | static         | basic/root    | identity/depth           | no                  |
| C     | required         | required    | boundary        | SSR semantics | required       | affected      | flatten/focus            | no                  |
| D     | required         | required    | selection       | targeted      | selection      | affected      | propagation              | no                  |
| E     | required         | required    | query/layout    | targeted      | controls       | builder       | filter/sort              | no                  |
| F     | reducer          | required    | request union   | required      | status         | remote        | correlation/large totals | no                  |
| G     | range math       | required    | range           | hydration     | focus          | virtual       | required                 | no                  |
| H     | serializers/edit | required    | method/outcomes | required      | editor/actions | full optional | export/edit              | no                  |
| I     | all              | all         | final           | real browser  | final          | final         | final                    | mandatory           |

## Implementation-wide stop conditions

Stop before or during B if any of these decisions cease to be true:

- canonical `data + hierarchy` representation is insufficient;
- roots/children cannot remain parent-owned;
- expansion acceptance would need optimistic applied state;
- a second remote channel is needed;
- filter must use a different P1 visibility policy;
- loaded-only subtree selection is insufficient for P1;
- remote virtualization needs a global flattened backend index;
- row-focused treegrid cannot support the approved editor interaction;
- SSR needs browser geometry or emits requests;
- exact K identity cannot correlate reconstructed values;
- a new public component/entrypoint or legacy adapter becomes necessary.

Any such change returns to design review; it is not improvised inside implementation.
