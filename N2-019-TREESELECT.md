# N2-019 — TreeSelect

## 1. Status

**READY FOR N2-020.** The repository roadmap resolves the next real phase as N2-019. N2-012, N2-013 and N2-014 were absorbed by the certified NeuTable 2 program; N2-016, N2-017 and N2-018 were absorbed by the certified NeuTreeTable 2 program. N2-015 is already complete and therefore is not restarted.

Starting checkpoint: `a05679ba0bded20f12cf841ca159bcdb8ad16c03` on branch `v2`.

## 2. Scope

Only TreeSelect was migrated. This phase implements the frozen N2-019 target: typed Signal Forms value, explicit selection mode and propagation policy, controlled expansion, lazy-child requests, fixed-height virtualization and the existing overlay workflows. Table, TreeTable, Showcase and unrelated debts were not changed.

## 3. Forms contract

`NeuTreeSelectComponent<T,V,M>` now implements `FormValueControl<NeuSelectionValue<V,M>>` and exposes `value` as its only form model. `mode:'single'|'multiple'` determines the value type at compile time. The component no longer implements CVA and does not register `NG_VALUE_ACCESSOR`.

The four official Angular 22 paths are executable and green:

- `[formField]`;
- `[formControl]`;
- `formControlName`;
- `[(ngModel)]`.

Reset clears only ephemeral TreeSelect UI state. The form owner remains authoritative for the reset value. Focus and touch include the connected overlay boundary.

Final Forms audit: 24 Signal Forms controls and 0 legacy CVAs.

## 4. Selection

The ambiguous `multiple:boolean` and `T[]` selection surface was replaced by `mode` plus `NeuSelectionValue<V,M>`. Selection is always expressed in consumer values `V`, never by mutating nodes.

`selectionStrategy` supports:

- `independent`: each loaded value toggles independently;
- `propagated`: a loaded enabled subtree is selected/deselected as a unit and ancestors derive checked/mixed state.

Disabled nodes are propagation boundaries. Values not present in the loaded tree remain in the model. Membership and propagation indexes are linear; the implementation preserves `Object.is` identity semantics, including distinct `0` and `-0` values.

## 5. Expansion and lazy children

Expansion is controlled:

- `expandedKeys` is applied parent state;
- `expandedKeysChange` is an immutable proposal;
- `nodeExpanded` and `nodeCollapsed` are domain detail events;
- `childrenRequest` is the sole lazy-child intent and carries `parentKey`, deterministic `requestId` and `queryRevision`.

The component does not own accepted expansion and does not mutate nodes. Filtering advances the deterministic query revision without creating a transport or cache owner.

## 6. Virtualization

`virtualizationOptions` enables a fixed-height window with item size, viewport height and buffer. `rangeChange` reports visible/render ranges. With 10,000 nodes and the benchmark configuration, the DOM projection is bounded to 12 mounted nodes. Expansion/filtering remains a hierarchy concern; virtualization only changes presentation.

No effect, per-node listener, observer or persistent timer was added. Overlay/keyboard handling continues through the existing renderer-level event paths.

## 7. Existing workflows retained

Search/filter, opening, closing, explicit clearing, templates, keyboard navigation, active descendant behavior, disabled/readonly handling and RTL logical indentation remain covered. Single selection closes the overlay; multiple selection keeps the interaction session active.

## 8. Public breaking delta

Removed:

- input `multiple`;
- outputs `selectionChange`, `nodeExpand`, `nodeExpansionChange`;
- CVA methods `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`.

Added/replaced:

- model `value`;
- inputs `mode`, `selectionStrategy`, `expandedKeys`, `virtualizationOptions`, `touched`;
- outputs `childrenRequest`, `expandedKeysChange`, `nodeExpanded`, `nodeCollapsed`, `rangeChange`, `touch`;
- typed contracts `NeuTreeSelectSelectionStrategy`, `NeuTreeSelectVirtualizationOptions`, `NeuTreeSelectChildrenRequest<K>`.

No legacy aliases, wrapper or compatibility adapter was added.

## 9. Type and contract gates

- `test:n2-tree-select-contracts`: 4/4 PASS.
- `test:n2-forms-types`: PASS; valid single/multiple contracts compile and invalid cardinalities are rejected.
- public contract regeneration: PASS; 101 entrypoints, 792 exported declarations, 1,504 bindings and 5,268 classified symbols.
- boundary gate: no Tree/Table facade dependency and no product effect.

## 10. Directed tests

`test:n2-tree-select` passes 45/45 tests across three files. Coverage includes Signal Forms interoperability, controlled expansion, deterministic children requests, independent/propagated selection, disabled boundaries, unloaded values, mixed state, 10k virtualization, deep/cyclic trees, templates, keyboard, lifecycle, touch, disabled/readonly and event exactly-once behavior.

The performance specification is an additional directed test. Global coverage and the full suite were intentionally not run because the phase is isolated and its proportional gates are green.

## 11. SSR, hydration and zoneless

- SSR import smoke: 101/101 entrypoints PASS.
- real Angular SSR: rendered TreeSelect content and hydration annotations, zero requests and zero value echoes.
- Chromium hydration: DOM node reuse PASS, zero NG050x, first post-hydration value proposal exactly once.
- `provideZonelessChangeDetection()`: PASS; no Zone.js dependency.

The hydration fixture copies real source and internal dependencies into a disposable directory. It creates no symlink and removes the directory after every run.

## 12. Performance

Reproducible artifact: `baselines/n2-tree-select/n2-019-performance.json`.

| Scenario | p50 | p95 |
| --- | ---: | ---: |
| projection 1k | 0.648 ms | 5.424 ms |
| projection 10k | 6.458 ms | 7.941 ms |
| filter 10k | 0.269 ms | 0.574 ms |
| propagated selection 10k | 4.591 ms | 7.308 ms |
| virtual window 10k | 0.002 ms | 0.003 ms |
| 50 create/destroy cycles | 1.451 ms | 3.619 ms |

These are local reproducible measurements, not browser/product latency claims. The verification rerun remains within the same order of magnitude. The 10k path is linear and no accidental O(n²) propagation remains.

## 13. Bundle

Reproducible artifact: `baselines/n2-tree-select/n2-019-bundle.json`.

| Consumer | raw | gzip | Brotli |
| --- | ---: | ---: | ---: |
| legacy basic at HEAD | 45,602 B | 9,399 B | 8,312 B |
| N2-019 basic | 55,865 B | 11,190 B | 9,905 B |
| N2-019 full facade | 56,169 B | 11,295 B | 10,016 B |
| root unused | 0 B | transport header only | transport header only |

Basic increases by 10,263 B raw / 1,791 B gzip. This exceeds the general 5% investigation trigger and is accepted as the measured cost of the two required P1 capabilities: loaded-subtree propagation/mixed derivation and the fixed virtual window/keyboard integration. These behaviors are selected at runtime, so `input=false` cannot make them tree-shakeable. Splitting them would require a second public facade or runtime feature loader and is not justified for 1.8 KB gzip.

The graph contains only TreeSelect, explicitly approved neutral option/tree navigation internals, Angular/CDK overlay and RxJS. It has no Table, TreeTable, TableCore, Router, HTTP, storage or PrimeNG edge. Root-unused remains 0 B raw.

## 14. Build and package

- production build: PASS;
- package verification: PASS, 447 files;
- publint/package audit: PASS;
- public contract tests: 5/5 PASS;
- no new public entrypoint;
- no generated package artifact is tracked.

## 15. Known unrelated debts

The pre-existing Menu NG8102 warnings, Showcase omissions and other roadmap debts were not changed. No global coverage threshold, Table/TreeTable behavior or future component phase was touched.

## 16. Git and recommendation

The diff is limited to TreeSelect runtime/styles, directed tests and fixtures, N2 Forms audit/type inventory, generated contracts, reproducible performance/bundle evidence and this report. No commit, push, tag, release or publish was performed.

**READY FOR N2-020.** N2-020 has not been started.
