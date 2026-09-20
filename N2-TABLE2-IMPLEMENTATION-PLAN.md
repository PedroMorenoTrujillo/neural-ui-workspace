# NeuTable 2 — Implementation plan

## Authority and execution rule

Este plan ejecuta [N2-TABLE2-FINAL-ARCH.md](./N2-TABLE2-FINAL-ARCH.md) y [N2-TABLE2-TYPE-CONTRACTS.md](./N2-TABLE2-TYPE-CONTRACTS.md). No autoriza implementación por sí mismo. Cada subfase requiere autorización y termina con evidencia antes de avanzar.

La secuencia N2-011A…K reemplaza el reparto grueso anterior N2-011/012/013/014. Conserva todas sus obligaciones y añade una retirada final atómica. No se publicará ni documentará una versión Neural UI 2 con Table y TableCore públicos simultáneamente.

## Dependency graph

```text
011A contracts + baselines
  └─011B private renderer + single facade
      └─011C query + client pipeline
          ├─011D columns/layout/selection
          └─011E filters/sort/pagination
              └─011F remote state machine
                  └─011G virtualization
                      └─011H editing/expansion/grouping
                          └─011I optional features/export
                              └─011J hardening/certification
                                  └─011K physical removal/final gate
```

## Shared rules for every subphase

- No aliases, wrapper 1.x→2.x, duplicate owners or Prime-like API.
- New code lives under `table/`; renderer/features remain package-private.
- Tests are directed; full suite only at B, G, J/K or after a shared regression.
- Every state transition has positive, rejection, echo/no-op and immutable-input tests.
- Every new public symbol gets type test, contract snapshot intent and removal/migration destination.
- Every listener/observer/timer/effect gets cleanup coverage.
- `git diff --check`, scope audit and no-symlink check close every subphase.
- No showcase, push, tag, release or publish during the program unless separately authorized.

## N2-011A — Public contracts, harness and baselines

### Deliverables

- Materialize the conceptual T/K/F types and the 24/14/4 component skeleton signatures in an isolated candidate path.
- Add compile-only positive/negative fixtures: F unions, K identity, readonly T[], invalid selection combinations, no DOM Event/any.
- Create baseline consumers for basic, client, remote, virtual, advanced filter/editor and export.
- Measure Angular 22 current Table/TableCore and PrimeNG 22.1.1 under identical scenarios.
- Create mechanical audits for forbidden imports, public entrypoints, duplicate state names and effect/listener counts.

### Directed tests

- TypeScript declaration fixtures only; no production behavior.
- Package resolution for candidate internal paths must fail from consumer.
- SSR import evaluation of new type/public surface.

### Gate

- Exact export ledger frozen at 82 symbols (66 tipos, 15 directivas y el componente), each with consumer case.
- Baseline includes raw/gzip/brotli, p50/p95, DOM, heap/resources and 50-cycle lifecycle.
- No product entrypoint removal yet.

## N2-011B — Private renderer and single public facade

### Deliverables

- Build the new `<neu-table>` shell and private renderer from scratch.
- Reuse only proven native markup, tokens and pure template context logic.
- Implement data, columns, rowKey, rowTrackBy, metadata states, templates and appearance.
- Provide native table semantics, loading/empty/error, pinned rows and contained overflow.
- Keep old implementation temporarily isolated for comparison, not wrapped or imported by the candidate.

### Directed tests

- Immutable rows/columns, typed templates, empty/loading/error/retry.
- Native header/cell relationships, rowspan/colspan basics and deterministic IDs.
- SSR, hydration DOM reuse and zoneless render.
- Basic consumer import graph and bundle.

### Checkpoint gate — new facade functional

- `<neu-table>` basic matches F-001, F-003, F-004, F-046, F-052, F-060, F-061, F-063 and semantic part of F-066.
- Basic bundle excludes Router, Forms, CDK, controls, export and old Table/TableCore code.
- Full Table directed regression checkpoint; no global coverage requirement yet.

## N2-011C — Canonical query and client pipeline

### Deliverables

- Implement immutable query normalization and semantic equality.
- Implement pure client pipeline: filter → stable sort → grouping hook → page.
- `queryChange` is proposal; accepted input is sole applied query.
- Implement rejection, synchronous/asynchronous echo and no-op suppression.
- Add query revision coordinator without remote output yet.

### Directed tests

- Page 1-based, invalid normalization, sort de-duplication, recursive filter AST.
- Rejected proposal leaves rendered state/ARIA unchanged.
- Accepted echo applies once and never reemits.
- 1k/10k client pipeline identity and no mutation.

### Gate

- Exactly one query representation in candidate source and declarations.
- No effect copies query to writable state.
- F-006, F-007, F-009 and client portions of F-011…025 pass.

## N2-011D — Columns, layout and selection

### Deliverables

- Normalize columns by stable id and typed field F.
- Controlled layout: order, visibility, widths and pinning; resize fit/expand policy internal.
- Controlled selection union: keys/all-matching; row/radio/checkbox, range, modifier and disabled rows.
- Logical row/cell focus keyed by K and columnId.
- Row reorder and rowAction discriminated events without native Event payload.

### Directed tests

- Single/multiple/all-matching; unloaded keys; exclusions; page/loaded/rendered/all scopes.
- Row replacement with stable key; duplicate-key diagnostics; rowTrackBy independence.
- Resize/reorder/visibility/pin proposals rejected/accepted/echoed.
- Pointer/keyboard selection exactly once and RTL layout behavior.

### Gate

- F-031…037, F-046…054 and F-069 pass in client and remote-shaped fixtures.
- No row object owns selection; no hidden checkbox state.
- Type fixtures reject single+all-matching and invalid indicator/mode combinations.

## N2-011E — Filters, sorting and pagination UI

### Deliverables

- Implement column/global filters on the single AST.
- Add row/menu/builder surfaces through private optional UI boundary.
- Implement sort header cycles/priorities and paginator presentation.
- Register built-in/custom predicates with pure teardown-free registry.
- Keep builder drafts ephemeral until Apply.

### Directed tests

- All built-in modes, custom predicates, dates/numbers/booleans/options and nested groups.
- Debounce cleanup, explicit apply/cancel/clear and malformed values.
- Single/multiple/removable sorting, stable comparator and page reset atomicity.
- Client pagination sizes/report/placement/unknown total semantics.

### Gate

- F-011…030 pass; no `filterDisplay`, `advancedFilterMode`, `sortEntries` or parallel page input.
- Advanced UI is absent from basic closure.
- Keyboard/ARIA for header/filter/paginator passes before remote work.

## N2-011F — Remote request state machine

### Deliverables

- Implement `dataMode:'remote'`, metadata validation and request coordinator.
- Emit initial/query/retry only from applied state.
- Assign monotonic requestId/queryRevision and deduplicate semantic transitions.
- Reject stale metadata/data pairs and document consumer stale-response guard.
- Implement retry without HTTP ownership.

### Directed tests

- Proposal rejection → zero requests.
- Acceptance → exactly one query request; echo → zero extra.
- Initial satisfied/unsatisfied, retry IDs, error/loading and unknown total.
- Rapid query A/B with B-before-A and A-before-B responses.
- SSR zero request and hydrated snapshot zero duplicate.

### Gate

- F-002, F-005, F-008, F-014, F-016, F-025 and F-027 pass.
- Only `dataRequest` can represent transport.
- No Router, HttpClient, Observable subscription or AbortController policy in Table.

## N2-011G — Fixed-height virtualization and remote windows

### Deliverables

- Implement visible/render/request ranges `[start,end)`.
- Browser-only scroll listener + ResizeObserver with deterministic cleanup.
- Client windowing and remote contiguous dataRange coverage.
- Programmatic `scrollTo`, logical focus materialization and inert placeholders.
- requestStep alignment and a single coordinator shared with query requests.

### Directed tests

- Top/middle/end ranges, resize, scroll, programmatic move, clamp/zero total.
- 10k and 100k logical rows with DOM bounded by viewport+overscan.
- Query+viewport same turn emits one request.
- Remote stale windows, gaps, rapid scroll and destroyed/recreated instances.
- SSR/hydration/zoneless and first post-hydration scroll exactly once.

### Checkpoint gate — remote + virtual complete

- F-055…057 and F-059 pass; F-058 remains explicit N2-036.
- Zero leaked listener/observer/timer after 50 cycles.
- Full Table directed suite, real browser hydration and bundle virtual chunk pass.

## N2-011H — Editing, expansion and grouping

### Deliverables

- Controlled editState and one ephemeral Signal Forms draft.
- Cell/row editors, sync/async validation, commit/cancel and custom template contexts.
- Controlled expandedKeys and row detail templates.
- Client/loaded grouping: subheader, rowspan, collapse and pure aggregates.

### Directed tests

- Edit rejection/acceptance, invalid/async, source row immutability and data replacement.
- Keyboard Enter/F2/Escape/Tab and multiline descendants.
- Expansion unknown keys, disabled rows and virtual window recycling.
- Stable grouping order/ids, null values, large groups, aggregate errors and no TreeTable leakage.

### Gate

- F-038…045 pass.
- No FormControl per rendered cell and no draft survives close/destroy.
- Editing/grouping chunks do not enter basic closure.

## N2-011I — Optional features and export

### Deliverables

- Finalize private dynamic chunks for advanced filters, editors, virtualization and export.
- Implement CSV/JSON/XLSX export for local scopes.
- Implement remote-all delegation via exportRequest.
- Accessible feature-loading/error fallbacks and retry.

### Directed tests

- CSV formula escaping/locale separators, JSON projection, valid XLSX archive.
- Page/loaded/filtered/selected scopes and all-matching remote delegation.
- Dynamic import success/failure/retry; featureError separate from data error.
- Chunk presence/absence in isolated production consumers.

### Gate

- F-064/F-065 pass without loading export in basic.
- No feature chunk imports old facade/TableCore or root barrel.
- Dependencies before/after remain intentional and recorded.

## N2-011J — A11y, keyboard, SSR, performance and bundle hardening

### Deliverables

- Complete native table/grid mode, roving focus, live announcements and virtual coordinates.
- Certify all keyboard paths and interactive-descendant guards.
- Run SSR/hydration/zoneless matrix across basic/client/remote/virtual/editing.
- Execute performance and bundle scenarios from architecture section 29/30.
- Compare against current Neural and PrimeNG baselines with identical functionality.

### Tests/certification

- Chromium/Firefox/WebKit; keyboard-only; automated axe plus manual screen-reader scripts.
- RTL, zoom 200/400%, 320px, high contrast, reduced motion.
- 1k/10k/100k, 100 immutable updates, remote stale storms and 50 lifecycle cycles.
- Full Table tests, branch/file coverage for new Table, package/import/SSR/type/contracts.

### Checkpoint gate — Table certification

- F-001…070 all have PASS evidence except F-058 documented out-of-scope.
- No P0/P1 a11y/performance/bundle regression.
- No compressed consumer regression >5% without approved design review.
- Zero live listeners/observers/timers/effects after destroy.

## N2-011K — Physical removal and final package gate

### Deliverables

- Delete old Table facade/orchestration after consumer migration.
- Delete public table-core project/entrypoint and all NeuTableCore exports.
- Remove legacy types, inputs, outputs, methods, docs and contract reconciliation entries.
- Move only approved renderer/pure implementation into private table paths.
- Update migration docs, package entrypoints, public contract snapshot and bundle policy.

### Directed tests

- Positive import: `@neural-ui/core/table` and every frozen public symbol.
- Negative import: `@neural-ui/core/table-core`, legacy types/members and internal paths.
- Search audit for all removal-ledger names and forbidden dependencies.
- Build/package/publint/ATTW/imports/SSR/hydration/contracts/bundle.

### Final gate

- One public Table and zero compatibility layers.
- Public surface equals frozen ledger; no unexplained export.
- Working tree clean, no symlinks, migration examples compile.
- Full suite and global certification run here, not per earlier slice.
- Final result can be marked implemented only after user approval; no automatic N2-012/N2-015 advance.

## Gate matrix summary

| Phase | Unit/type | Browser | SSR/hydration | Bundle/perf | Full suite |
| --- | --- | --- | --- | --- | --- |
| A | Required | No | import smoke | baseline | No |
| B | Required | Basic | Required | basic | Table checkpoint |
| C | Required | Query | Directed | diagnostic | No |
| D | Required | Selection/layout | Directed | diagnostic | No |
| E | Required | Filter/sort/page | Directed | chunks | No |
| F | Required | Remote | Required | requests | No |
| G | Required | Virtual | Required real | virtual/perf | Table checkpoint |
| H | Required | Edit/group | Directed | chunks | No |
| I | Required | Optional/export | SSR import | chunks | No |
| J | Required | 3 engines + a11y | Full matrix | certification | Table full |
| K | Required | Migration consumer | Full matrix | package/final | Global final |

## Stop conditions

Detener la subfase y devolver **NEEDS DESIGN REVIEW** si aparece cualquiera de estos casos:

- necesidad demostrada de una segunda Table/entrypoint público;
- query o selection que requiera dos owners aplicados;
- segundo canal remoto para evitar pérdida de información;
- basic Table no puede excluir Router/Forms/CDK/export;
- virtual P1 requiere altura variable para cumplir un caso P1;
- el target tipado exige `any` de dominio;
- regresión a11y o bundle >5% sin compensación aprobada;
- migración exige wrapper runtime en el paquete.

Fuera de esas condiciones, los detalles internos pueden resolverse dentro de la subfase manteniendo los contratos congelados.
