# N2-020 — Accordion

## 1. Status

**READY FOR N2-021.** N2-020 is complete in the working tree and remains uncommitted for review.

Starting checkpoint: `5c89870dff78b2e522b858a499aad8af15e55394` (`feat(tree-select): migrate TreeSelect to Signal Forms`) on branch `v2`.

## 2. Scope resolution

The authoritative roadmap and N2 contracts resolve N2-020 to Accordion only:

- typed Angular header/body templates;
- controlled aggregate expansion state;
- optional one-time uncontrolled seed;
- retained sanitized HTML fallback;
- native semantics, keyboard behavior, SSR/hydration, performance and bundle evidence.

No contradiction was found between the roadmap, API ledger, type contracts, migration examples and naming decisions. N2-021 was not started. Showcase, Table, TreeTable, Forms controls and unrelated global debts were not changed.

## 3. Previous implementation

The previous component accepted only string HTML bodies and treated `item.expanded` as a one-time internal seed. Expansion could not be restored independently from reconstructed item data, and real Angular content such as child forms could not be projected as the panel body.

The legacy directed suite had 17 tests. Its item-owned expansion cases were removed as an intentional breaking change; the replacement suite has 16 denser tests and covers the new ownership, typed content, lifecycle and accessibility paths.

## 4. Final public contract

`NeuAccordionComponent<K,T>` now uses:

- `K extends string | number` for semantic panel identity;
- `T extends NeuAccordionItem<K>` for immutable consumer items;
- `expandedKeys: readonly K[] | undefined` as applied controlled state;
- `expandedKeysChange: readonly K[]` as the immutable aggregate proposal;
- `initialExpandedKeys: readonly K[]` as the one-time uncontrolled seed;
- `panelToggle: NeuAccordionPanelToggle<K>` as optional gesture detail, not a second state owner.

Added public typed contracts are `NeuAccordionKey`, `NeuAccordionBodyContext<T>`, `NeuAccordionBodyDirective<T>` and `NeuAccordionPanelToggle<K>`. `NeuAccordionHeaderContext<T>` and `NeuAccordionHeaderDirective<T>` are now generic. `NeuAccordionItem.expanded` was removed.

No alias, compatibility wrapper, CVA, model signal or second aggregate expansion output was added.

## 5. Typed Angular content

`ng-template[neuAccordionBody]` receives a strongly typed context containing the domain item and applied `expanded` state. Header templates use the corresponding generic context. The body view remains mounted while collapsed, so child Angular components and Reactive Forms controls preserve their instance and draft state. Collapse is presentation-only through CSS, `aria-hidden` and `inert`.

The HTML `content` field remains an optional fallback for consumers without a body template. It is processed with `DomSanitizer.sanitize(SecurityContext.HTML, ...)`; no trust-bypass API is used.

## 6. Expansion ownership

Controlled mode follows the project-wide proposal contract:

1. the parent applies `expandedKeys`;
2. a user gesture computes an immutable proposal;
3. `expandedKeysChange` emits exactly once;
4. the rendered state changes only after the parent writes accepted state.

A rejected proposal produces no visual state change. Parent writes and reconstructed arrays update the DOM without echoing either output. Keys not yet present in asynchronous item data remain valid applied state and become visible when their item arrives.

Uncontrolled mode is selected only when `expandedKeys` is absent. `initialExpandedKeys` is copied once; later seed changes do not overwrite UI state. Controlled/uncontrolled mode is fixed for the component lifetime, with one development diagnostic on an attempted switch.

## 7. Identity and immutability

Membership and gestures use exact `Object.is` identity. String and number keys remain distinct, including `0` and `-0`; DOM IDs and Angular tracking tokens preserve that distinction. Proposals are frozen readonly snapshots. The component does not mutate items, input arrays or parent state.

## 8. Semantics and accessibility

Headers remain native buttons with stable, instance-namespaced `id`, `aria-controls` and applied `aria-expanded`. Panels use `role="region"`, `aria-labelledby`, `aria-hidden` and `inert` when collapsed. Disabled items use the native `disabled` state and cannot propose changes.

Arrow Up/Down and Home/End move focus among enabled headers and skip disabled headers. IDs stay unique across multiple Accordion instances. Logical CSS and the existing animation/reduced-motion behavior remain intact.

## 9. Signal and resource ledger

The graph is inputs → computed applied-key membership → template. There are no product effects, writable mirrors of controlled state, subscriptions, observers or persistent timers. The only writable runtime state is the minimal uncontrolled UI state, its invalidation revision and a one-shot mode diagnostic flag.

Each rendered header has the existing click/keyboard interaction binding. No document/window listener or per-panel observer was introduced.

## 10. Directed tests

`test:n2-accordion`: **16/16 PASS**.

Coverage includes native semantics, controlled rejection, accepted parent writes, uncontrolled seeding, exclusive/multiple proposals, immutable events, asynchronous items, real typed content, child form persistence, keyed view reuse, sanitization, disabled/unknown gestures, keyboard focus, unique IDs, exact numeric identity and lifetime mode diagnostics.

`test:n2-accordion-contracts`: **4/4 PASS**. The static gate freezes the new state/template surface and rejects item-owned expansion, CVA, effects, trust bypasses and forbidden Table/transport dependencies.

`test:n2-accordion-types`: **PASS**. Positive generic item/context contracts compile; boolean keys and the removed `item.expanded` shape are compile-time failures.

Global coverage and the full suite were intentionally not run because the change is isolated and all proportional gates are green.

## 11. SSR, hydration and zoneless

The real Angular fixture uses `provideZonelessChangeDetection()` and renders typed body content on the server. Chromium hydration verifies:

- server DOM reuse;
- zero NG050x;
- zero expansion proposal during hydration;
- the first header proposal exactly once;
- the first projected body action exactly once.

`test:n2-accordion-hydration`: **PASS**. The disposable fixture is copied without symlinks and removed after the run.

The package-wide SSR import smoke also passes for **101/101 entrypoints**.

## 12. Performance

Reproducible artifact: `baselines/n2-accordion/n2-020-performance.json`.

| Scenario | p50 | p95 |
| --- | ---: | ---: |
| 1k applied item input projection | 0.002 ms | 0.059 ms |
| 1k expanded-membership reads | 0.004 ms | 0.191 ms |
| toggle lookup in 1k items | 0.006 ms | 0.024 ms |
| controlled parent writes | 0.003 ms | 0.073 ms |
| 50 create/destroy cycles | 2.186 ms | 4.795 ms |

These are local reproducible microbenchmarks, not browser/product latency claims. Expanded membership is set-based; the item lookup for an individual gesture is linear and bounded to one user action. Resource observations remain 0 effects, 0 observers and 0 persistent timers.

## 13. Bundle

Reproducible artifact: `baselines/n2-accordion/n2-020-bundle.json`.

| Consumer | raw | gzip | Brotli |
| --- | ---: | ---: | ---: |
| previous Accordion basic at HEAD | 15,430 B | 3,653 B | 3,148 B |
| N2-020 basic | 19,771 B | 4,549 B | 3,941 B |
| N2-020 full facade | 19,965 B | 4,633 B | 4,020 B |
| root unused | 0 B | transport header only | transport header only |

Basic increases by 4,341 B raw / **896 B gzip**. The cost is attributed to the typed body projection, generic aggregate contracts, controlled/uncontrolled proposal logic, exact identity handling and keyboard navigation. It remains below the approximately 1 KB plumbing investigation threshold.

The emitted basic graph is Accordion plus the already-used private internal ID/foundation primitives. It contains no Table, TreeTable, TableCore, Forms, Router, HTTP, storage or PrimeNG edge. Root-unused remains **0 B raw**.

## 14. Contracts, build and package

- production build: PASS;
- public contract regeneration: PASS;
- public contract audit: 101 entrypoints, 796 exported declarations, 1,507 bindings and 5,282 classified symbols;
- public contract tests: 5/5 PASS;
- published package audit/publint: PASS;
- package verification: PASS, 447 files;
- Forms audit: 24 Signal Forms controls, 0 CVAs.

The known entrypoint audit continues to report the same 17 missing Showcase demo pages. This is an established unrelated debt and was not modified.

## 15. Dependencies and regressions

No dependency was added. Accordion remains independent from Table, TreeTable, TableCore, Router, HTTP, storage, Forms and third-party runtime wrappers. Table and TreeTable sources are untouched, TableCore remains absent, and the pre-existing Menu NG8102 warnings are unchanged.

## 16. Git state and recommendation

The diff is limited to Accordion runtime/tests, typed/hydration/performance fixtures, static gates, reproducible baselines, generated public contracts, package scripts and this report. No symlink or temporary hydration directory is retained. No commit, push, tag, release or npm publish was performed.

**READY FOR N2-021.** N2-021 has not been started.
