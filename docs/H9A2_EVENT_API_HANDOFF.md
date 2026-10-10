# H9-A2 certified Library event API candidate

> Historical Neural UI 1.x handoff. Its Chart sections document the former
> `@neural-ui/core/chart` contract and are retained as migration evidence. Neural UI
> 2.0 removes that entrypoint; current consumers and gates no longer execute it.

PUBLICATION_LOCKED_PENDING_USER_LOCAL_REVIEW. No push, tag, publish or release.

## Baseline

Clean worktree: `h9-a2-event-api-workspace`, branch `codex/h9-a2-event-api-hardening`.
Initial HEAD: `c959fe56ee555cecbb1375a3047658bfb5e3bf47`.
Initial tree: `75fe7890e1025d720ae35d9abfc7f827249cc735`.
H8-B5 `8cf2ffbb5e5f5b058292feefb2c8bef12ef80922` is an ancestor (merge-base equals H8-B5).
No descendant commit was present on any local/remote branch at baseline capture.
The restored H8-C candidate is integrated; subsequent Input/autofill, DateInput/id,
Tabs/scroll, Chart/animation, NumberInput ARIA, OrganizationChart, SchedulerGantt,
Rating, Table and token-manifest changes remain uncommitted in local-review.
They are neither copied nor discarded here. Integration must retain them.
Showcase is owned by the concurrent H8-C5 task and is not changed here.

## Approved implementation contracts

Interaction handlers are commands representing user intent. Calling such a handler
explicitly requests the same action; passive input updates and CVA `writeValue` do
not emit interaction outputs. Lifecycle events are independent of trigger source.
No new event is emitted during destruction. Rendering on the server does not emit
browser mount/range events. Event payload arrays are snapshots, not internal sets.

| Component | Candidate outputs | Semantic justification / emission policy |
| --- | --- | --- |
| Chart | dataSelect | USER ONLY. Data point identity/value, inaccessible through host click. Actual renderer selection only; background, legend and render operations excluded. |
| TreeSelect | filter | USER ONLY. Changed raw search query in the external overlay, including native search clear. No echo on query signal writes/reopen/Escape dismissal. |
| TreeSelect | opened, closed | LIFECYCLE REGARDLESS OF SOURCE. Actual connected overlay attachment/detachment, not requests or animation phases. |
| TreeSelect | cleared | USER ONLY. Explicit clear command; no last-item deselection or CVA reset echo. |
| TreeSelect | nodeExpansionChange | USER ONLY. Node plus actual expanded state. Existing nodeExpand remains lazy child request only. |
| CascadeSelect | groupChange | USER ONLY. New ancestor path after group navigation/back/breadcrumb; no final value selection or restored path echo. |
| CascadeSelect | opened, closed | LIFECYCLE REGARDLESS OF SOURCE. Actual overlay attachment/detachment. |
| DateInput | viewChange | USER ONLY. Changed calendar interval through navigation, not selected value/model synchronization. Date/datetime use one month; range uses two; time has no calendar event. |
| DateInput | opened, closed | LIFECYCLE REGARDLESS OF SOURCE. Actual overlay attachment/detachment in all modes. |
| DateInput | cleared | USER ONLY. Explicit single or range clear command. |
| VirtualList | rangeChange | PROGRAMMATIC + USER. Changed rendered range including buffer; start inclusive, end exclusive. Initial rendered range included. This does not implement remote virtualization. |
| Dialog, BottomSheet | opened, hidden | LIFECYCLE REGARDLESS OF SOURCE. Browser panel mounted/unmounted after rendering. Existing closed stays a close request; a refused request never emits hidden. |
| ColorPicker | opened, closed | LIFECYCLE REGARDLESS OF SOURCE. Actual overlay attachment/detachment. |
| ColorPicker | colorChangeEnd | USER ONLY. Completion of changed canvas drag or hue slider interaction. Discrete swatches/text remain colorChange only. |
| PickList | sourceSelectionChange, targetSelectionChange | USER ONLY. Selected domain items after toggling existing selection or clearing it through transfer. No source/target input echo; no new transfer features. |
| Splitter | resizeStart, resize | USER ONLY. Initial sizes on drag start; changed live sizes while dragging. Keyboard retains existing atomic sizeChange contract. |
| SplitButton | opened, closed | LIFECYCLE REGARDLESS OF SOURCE. Actual nested menu attachment/detachment. |
| ImageViewer | opened, closed | LIFECYCLE REGARDLESS OF SOURCE. Viewer portal attached/disposed, including imperative open/close. |
| NumberInput | inputDetail | USER ONLY. Raw text and parsed number or null on native input; empty and invalid distinguished. No CVA/valueChange commit echo. |

All candidates have a useful domain or external-overlay capability without an
equivalent existing output or CVA notification. Lifecycle payloads are void.
All 30 candidates passed implementation review. No candidate was rejected; no structural feature gap was implemented.

## Existing contracts preserved for Showcase

- Autocomplete.select and InputTags.select retain their names and types. Native
  `select` on the internal input stops bubbling, without preventDefault. Direct
  listeners on that input and ancestor capture listeners remain possible. The
  ordinary host `(select)` binding receives domain selections only.
- Input and Textarea each retain zero outputs. Native input/change/keydown bubble;
  use focusin/focusout on the host. Forms value/touched/disabled use CVA.
- NumberInput nullable clear emits null through CVA, never through valueChange<number>.
- Table.virtualScrollEvent already exists; the Showcase omission is documentation work.
- Select/Multiselect/Autocomplete/Popover/ContextMenu/SpeedDial retain their existing
  names, payloads and transition timing; new lifecycle events are not aliases for requests.
- The 17 structural H9 feature gaps are out of scope.

## Sources

- [Angular outputs and native-event naming](https://angular.dev/guide/components/outputs)
- [Browser DOM timing](https://angular.dev/guide/components/dom-apis)
- [Chart selection callback requirements](https://apexcharts.com/docs/options/chart/events/)

## Certification

PASS on the isolated Library candidate. Publication remains locked.

| Gate | Result |
| --- | --- |
| Full functional suite | 149 files, 3,218 tests passed |
| Global coverage S/B/F/L | 98.16 / 96.51 / 98.60 / 98.87% |
| Per-component coverage | All 98 components >=95% in all four metrics |
| Browser event scenarios | 24/24 passed across Chromium, Firefox and WebKit |
| Actual hydration | Angular 22, all three browsers: server input DOM identity retained, no hydration error, opened/hidden/domain select exactly once |
| Angular consumers | 19, 20, 21, 22: strict compiled bindings for the affected API, schematics, SSR |
| Directed SSR | Dialog/BottomSheet rendered open; DateInput, TreeSelect, VirtualList, Autocomplete and InputTags rendered; hydration annotations present; zero server outputs |
| SSR import safety | 105 entrypoints passed without browser globals |
| Entry imports | 105 passed |
| CVA audit | 24 CVA components passed; directed tests retain silent writes/disable and nullable NumberInput behavior |
| H5 declaration contract | Generated through audit-public-contract.mjs --update; subsequent audit passed |
| Entrypoint source/demo audit | 104 secondary entrypoints passed with NEURAL_UI_SHOWCASE_PATH=local-review/neural-ui-showcase; root makes 105 total |
| Styles, tokens, dependencies | Zero source changes; peer Angular >=19.0.0 <23.0.0 retained |

The directed suite tests event amplification, DOM/OutputRef separation, invalid
callbacks, unchanged ranges, cancellation, disabled/readonly controls, repeated
lifecycle notifications, destroyed consumers, and reentrant destruction inside
selection/lazy-request callbacks. Existing keyboard/CVA suites remain passing.
No full H6/A3.1 macroaudit was rerun.

The first cross-version run overlapped an intermediate package rebuild and produced
an incomplete Angular 22 test tarball; that run was discarded. The retained matrix
log is a subsequent complete 19–22 run against the final built package. Browser
verification found and corrected the actual Apex non-axis index mapping before
that final run. No failing preliminary run is presented as final certification.

Evidence: [metrics](h9-a2-evidence/metrics.json),
[browser scenarios](h9-a2-evidence/browser-results.json),
[hydration](h9-a2-evidence/hydration-results.json),
[Angular matrix](h9-a2-evidence/angular-19-22.log).

## Exact public delta

| Contract | Baseline | Candidate | Delta |
| --- | ---: | ---: | ---: |
| Public entrypoints | 105 | 105 | 0 |
| Exported declarations | 802 | 804 | +2 |
| Input bindings | 1,142 | 1,142 | 0 |
| Output bindings | 230 | 260 | +30 |
| Model bindings | 2 | 2 | 0 |
| Total bindings | 1,374 | 1,404 | +30 |
| Classified public symbols | 5,459 | 5,500 | +41 |
| Design tokens | 258 | 258 | 0 |

The two new public exports are `NeuChartDataSelectEvent` from `@neural-ui/core/chart`
and `NeuDateViewChangeEvent` from `@neural-ui/core/date-input`, through existing
barrels. No new entrypoint or alias was added. The 41 classified symbols are the
30 outputs, two interface declarations, and their nine fields.

Affected FESMs: +18,779 bytes raw and +3,856 bytes gzip summed per entrypoint.
The largest per-entrypoint gzip increment is DateInput (+646 bytes). Complete
package directory: 7,722,247 -> 7,779,641 bytes (+57,394, about 0.74%, including
maps/types). There is no new runtime dependency. Per-file sizes and FESM SHA-256
hashes are in metrics.json.

## Payload details for Showcase

- Chart.dataSelect: `{ seriesIndex, dataPointIndex, seriesName, label, value,
  originalEvent }`. Indices are zero-based. Axis charts use a series index plus
  index within that series. Non-axis charts identify the selected slice with
  seriesIndex and use dataPointIndex=0. The adapter translates Apex's internal
  shared-series/slice-point representation; no Apex context escapes. Pareto's
  generated cumulative series is index 1 with its computed percentage value.
  Names/labels can be undefined. Only existing selectable chart marks activate
  this output. No persistent markers or new selection UI were added to default
  line/area charts, whose renderer requires selectable markers for this callback.
- TreeSelect.filter: `{ query: string }`, preserving the raw entered query.
  Native search clear emits an empty query when it changes. Escape dismissal and
  reopening retain the query and do not emit filter. Direct query signal writes
  and recomputation are silent. Readonly selection does not prevent searching.
- TreeSelect.nodeExpansionChange: `{ node: T, expanded: boolean }`, emitted for
  eager/lazy expand and collapse; leaf/disabled expansion is ignored. A lazy
  expansion can produce the separate nodeExpand child request and one actual
  expansion event. Destroying the component in the lazy-request subscriber
  suppresses the subsequent expansion event.
- CascadeSelect.groupChange: `readonly T[]` snapshot of ancestor groups after
  entering, returning or following a breadcrumb. No output for the same depth,
  restoring a selection path, final leaf selection, CVA writes or disabled commands.
- DateInput.viewChange: `{ start: Date, end: Date }` in local calendar time,
  start inclusive/end exclusive. The interval covers the displayed grid cells,
  including adjacent-month days. Range mode covers both displayed grids; time
  mode emits none. Navigation while closed is silent. Opening does not emit an
  initial viewChange. The existing Today command in date mode selects and closes,
  so it does not report a subsequently hidden interval. Use opened for the initial
  opening notification and viewChange for subsequent visible navigation. Existing
  Escape behavior at the DateInput host is preserved; no dismissal-policy feature
  was introduced for keys originating within the detached calendar overlay.
- VirtualList.rangeChange: `{ start: number, end: number }`, zero-based rendered
  interval including the CDK buffer, with an exclusive end. Includes initial
  measurement and user/programmatic scrolling or data-driven range changes;
  identical consecutive ranges are suppressed. Payload has no CDK classes.
- ColorPicker.colorChangeEnd: final string in the active hex/rgb/hsl format after
  a changed canvas drag or hue edit. Pointer up commits once, native hue change
  commits once (each keyboard adjustment is one native commit). Pointer cancel,
  lost capture, CVA write/disable and panel teardown cancel pending completion.
  Swatches and text editing retain colorChange only. Returning to the original
  color during the gesture emits no completion.
- PickList.sourceSelectionChange/targetSelectionChange: `T[]` snapshots after
  an existing selection toggle or transfer clearing that selection. Input-array
  replacement and direct selection-signal writes remain silent.
- Splitter.resizeStart/resize: `number[]` snapshots of percentage sizes. Start is
  once per primary mouse/touch drag; resize is only for changed live sizes.
  Keyboard resizing retains its atomic sizeChange event; no synthetic drag events.
- NumberInput.inputDetail: `{ rawText: string, value: number | null,
  state: 'valid' | 'empty' | 'invalid' }`. Finite numeric text is parsed without
  clamping or committing. Intermediate invalid text and empty text have value=null.
  Only native editing emits; spin-button commits and writeValue remain separate.
- All new opened/closed/hidden/cleared outputs use void, not empty event interfaces.

## Reproduction

1. Build Library with `npm run build`; audit with `npm run audit:contracts`.
2. Run `npm run test:coverage:components` and `npm run test:angular-22-consumer`.
   `NEURAL_UI_KEEP_COMPAT_FIXTURE=1 npm run test:angular-22-consumer` retains a
   temporary Angular 22 consumer when SSR/hydration investigation is required.
3. Run `node scripts/prepare-h9-browser-consumer.mjs`. It prints a private fixture
   directory. Build there with `node_modules/.bin/ng build`, serve its dist/browser
   on localhost:4389, then run `node scripts/test-h9-event-browser.mjs` from Library.
4. For hydration, supply an Angular 22 test node_modules containing
   @angular/platform-server, @angular/ssr and @types/node through
   `NEU_H9_DEPENDENCIES`; run the preparation script with `--hydrate`. Build the
   printed fixture, run `node dist/server/server.mjs`, serve dist/browser on
   localhost:4390, then run `node scripts/test-h9-hydration-browser.mjs` from Library.
5. The browser runners accept `NEU_PLAYWRIGHT_MODULE` for an already installed
   Playwright module. Browser and hydration URLs/evidence paths are configurable
   through the NEU_H9_* variables shown in each runner. No Showcase file is changed.

## Integration and publication handoff

Integrate this isolated candidate only after preserving/committing the concurrent
H8 Library edits identified above. In particular keep Input/autofill, DateInput/id,
Tabs/scroll, Chart/animation, NumberInput ARIA, OrganizationChart and SchedulerGantt
fixes; this branch intentionally starts at the latest integrated commit and does
not include those still-dirty changes. Resolve overlapping Chart/DateInput/
NumberInput hunks against that authoritative line, then rerun the affected gates.
Do not treat this certificate as certifying an untested future merge.

Showcase should document the exact 30 outputs and payloads above, keep Input and
Textarea at zero outputs, add the already-existing Table.virtualScrollEvent docs,
and explain the native-select consequence. H9 feature-gap closure remains separate.

PUBLICATION_LOCKED_PENDING_USER_LOCAL_REVIEW.
