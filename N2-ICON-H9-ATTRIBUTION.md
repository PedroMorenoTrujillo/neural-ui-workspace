# N2-ICON-H9 — neutral icon renderer bundle attribution and certification

## Decision and scope

The provider-agnostic Core icon contract is retained. Its renderer was optimized before any policy change: structural/text fallbacks moved from a global outlet map to explicit component inputs, and the outlet was isolated in the unsupported `@neural-ui/core/icon-outlet-internal` secondary entrypoint. This prevents unrelated `@neural-ui/core/internal` code from entering Button, Select, Kanban, ColorPicker and Pagination solely because of icon rendering. Only the Button and PickList H9 scenario baselines were then remeasured and updated to exact observed bytes. Their previous H9-B4 values remain in `historicalBaseline`; all other scenario baselines, warning/failure formulas, architectural assertions, aggregate budgets and package budgets remain unchanged.

This is a local Core 2 candidate, **not** an npm release. The packed manifest still says `1.15.0`; semver must not be used to identify its product generation. The starting clean Core commit was `63de8dc0f1c030722acaae7bdca08f5750151f53` on `v2`. No push, tag, publication, deploy or Showcase V2-S1 work is part of this certification.

## Measurement method and comparability

- Both the clean starting commit and candidate were built with the same installed toolchain. The clean package is in the isolated detached worktree `/private/tmp/n2-icon-h9-before-63de8dc0`; the candidate is built from this branch. Node `22.22.3`, Angular `22.1.6`, Angular CLI `22.1.8`, esbuild `0.27.3`, zlib `1.2.12`, Brotli `1.2.0`, macOS arm64. H9 uses minified browser ESM, tree shaking, package export resolution and `sideEffects`, with Angular/CDK/RxJS external. Gzip level 9 and Brotli quality 11 compress the selected output bytes.
- Reproduce the apples-to-apples package comparison with `node scripts/audit-h9-b4-bundle-policy.mjs --calibrate --attribution --legacy-baseline-icons --baseline=/private/tmp/n2-icon-h9-before-63de8dc0/dist/neural-ui/core`. `--legacy-baseline-icons` disables the **new** no-Neural-Icons assertion for the historical package *only*; the candidate and ordinary PR/main/release checks keep that assertion. `--attribution` exposes esbuild `bytesInOutput` per input without altering measurements or budgets.
- The original H9 Button baseline `18064/3148/2672` was produced when Button's mandatory Neural Icons peer was externalized. The old-script measurement of the starting Button was `16276/2669/2272`, also excluding the peer. These are historical policy numbers, **not** a like-for-like total end-user closure. With the current package-only method applied to both packages, old Button is `21946/3763/3223`, including Neural Icons, and the candidate is `21806/3788/3221`, including its Core-owned renderer and **zero** Neural Icons modules. Thus the comparable closure changes by **−140 raw, +25 gzip, −2 Brotli**. The policy still needed a new Button baseline because its historical externalized measurement and boundary assertion no longer describe Core 2.
- Two consecutive complete candidate calibrations returned byte-identical 23-scenario/aggregate/package results (candidate JSON SHA-256 `c55b43fd7bf0023838748de9c89584b79ef9ca5b2d37be7e153f3a860c4e42e8`). No threshold padding, scenario exemptions or compiler flags were used.

## Measured package-only consumer deltas

Values are raw/gzip/Brotli bytes. The starting and candidate columns in this table use the **same current** H9 package-only method; they do not mix in the old Button externalization convention.

| Scenario | Clean `63de8dc0` | N2 candidate | Candidate − clean |
| --- | ---: | ---: | ---: |
| root-unused | 0/20/1 | 0/20/1 | 0/0/0 |
| provider | 787/450/392 | 850/468/423 | +63/+18/+31 |
| button | 21946/3763/3223 | 21806/3788/3221 | −140/+25/−2 |
| select | 119881/20419/17796 | 119946/20456/17823 | +65/+37/+27 |
| table-basic | 174439/34670/25692 | 174439/34670/25692 | 0/0/0 |
| table-advanced-lazy | 192972/40302/30598 | 192972/40302/30598 | 0/0/0 |
| tree-basic / checkbox / lazy / virtual / dnd-full (each) | 62507/12166/10724 | 62507/12166/10724 | 0/0/0 |
| kanban | 43517/7587/6600 | 43581/7623/6632 | +64/+36/+32 |
| tree-table | 124801/25748/21873 | 124801/25748/21873 | 0/0/0 |
| dialog-basic / draggable / resizable / maximizable / all-advanced (each) | 50377/9744/8453 | 49957/9634/8382 | −420/−110/−71 |
| color-picker-basic / advanced (each) | 59866/11735/10288 | 59931/11776/10325 | +65/+41/+37 |
| pick-list-order-list | 106805/16529/13916 | 109514/17059/14166 | +2709/+530/+250 |
| menu | 68566/10419/9054 | 68147/10311/8958 | −419/−108/−96 |
| pagination | 135096/23149/19885 | 135161/23187/19920 | +65/+38/+35 |

Table, Tree, TreeTable and their lazy boundaries are unchanged. Angular's atomic component templates make the H9 basic/advanced variants of the same component identical where shown; this is not a skipped mode. The five dialog variants are improved, although their frozen historical baseline can still display a raw warning. No warning was turned into an exemption.

## Source attribution and optimization

Esbuild `bytesInOutput` for the key FESM inputs (these are additive input contributions to the minified output, not separate gzip/Brotli sizes):

| Closure | Clean package inputs | Candidate inputs | Interpretation |
| --- | --- | --- | --- |
| Button | Button 16,201; Neural Icons Angular 5,721 | Button 16,512; icon-outlet-internal 4,891; foundation 379 | The peer is gone. The neutral outlet replaces it; no general internal FESM or Neural Icons input remains. |
| PickList + OrderList | PickList 62,341; Button 16,212; Neural Icons Angular 5,735 plus selected definition modules; general internal 3,068 | PickList 64,503; Button 16,518; icon-outlet-internal 6,365; general internal 3,150 | Explicit fallbacks and the shared outlet account for the residual +2,709 raw closure after removing the peer. Both the icon outlet and other pre-existing PickList internals are genuinely used. |
| Select | general internal 12,976; foundation 393 | general internal 12,976; foundation 458 | No icon outlet or Neural Icons is accidentally retained. |
| Kanban | general internal 2,391; foundation 316 | general internal 2,392; foundation 379 | No icon outlet or Neural Icons retained. |
| ColorPicker | general internal 2,399; foundation 391 | general internal 2,399; foundation 456 | No icon outlet or Neural Icons retained. |
| Dialog | Neural Icons Angular 5,733 plus definition inputs | icon-outlet-internal 5,431 | Net closure decreases by 420 raw bytes. |
| Menu | Neural Icons Angular 5,723 | icon-outlet-internal 4,891 | Net closure decreases by 419 raw bytes. |

Before optimization, the new outlet was exported from the broad general internal entrypoint. It caused accidental retention: candidate Button `24583/4723/4053`, Select `125534/21969/18986`, Kanban `49153/8979/7834`, ColorPicker `65516/13231/11492`. Moving fallbacks out of the outlet first reduced Button to `24097/4335/3712`; isolating the outlet then reduced it to `21806/3788/3221` and removed the accidental growth in Select/Kanban/ColorPicker. The remaining Button/PickList byte cost is the deliberately retained, provider-neutral Angular rendering path and local control fallbacks, not a full icon catalogue or stray general internals.

The no-provider path renders compact Core-owned structural/text affordances where the component supplies them. An unknown app-owned icon key has no invented SVG. The optional resolver dynamically renders the app's component when provided. This architecture keeps SSR/hydration deterministic, visible control affordances available without Icons, and component inputs typed with Core-owned `NeuIconKey` rather than an Icons package type.

## H9 policy change and invariant checks

`scripts/h9-b4-bundle-policy.json` changes **only** these two active scenario baselines:

| Scenario | Preserved historical baseline | New exact N2 baseline | Reason |
| --- | ---: | ---: | --- |
| button | 18064/3148/2672 | 21806/3788/3221 | Historical Button excluded its required peer; N2 must include its own neutral outlet while importing no Icons. |
| pick-list-order-list | 106805/16529/13916 | 109514/17059/14166 | Two genuine icon-bearing components, explicit fallbacks and shared outlet are retained; previous external geometry has been removed. |

H9 PR **PASS** (7 consumers), main **PASS** (23), release **PASS** (23); 113 aggregate chunks and zero architectural failures. Root-unused remains **0 raw bytes**. Table initial/lazy architecture remains enforced. H9 still fails if Core Button pulls or imports any `@neural-icons/*` module; the legacy-boundary bypass exists only inside opt-in calibration of the clean old package. The separate icon bundle audit reports Core-only Button `21814/3789/3220` with no icon definitions (the 8-byte raw difference from H9 is the audit's different source expression); the optional app adapter retains only `save`, or the explicitly selected `download/save/trash`, and no complete Icons catalogue.

## Full certification and consumer proof

| Gate | Result |
| --- | --- |
| Core build, package verification | PASS; 447 built package files |
| Public declaration contract | PASS; 101 entrypoints, 868 exported declarations, 1,473 bindings, 5,284 classified symbols |
| Entrypoint imports and SSR import smoke | PASS; 101 entrypoints each |
| publint | PASS (`All good!`) |
| Icon productive-source boundary and bundle audit | PASS; zero productive runtime/type `@neural-icons/*` references, zero Core-only bundle icon geometry |
| H9 static-closure tests and PR/main/release budgets | PASS; 5/5 static tests, all profiles |
| Full unit suite | PASS; 192/192 files, 2,935/2,935 tests |
| Coverage hard gate | PASS; statements 96.9889%, branches 95.0345%, functions 96.0688%, lines 98.1559%; each ≥95.01% |
| Angular 22 consumer without Icons | Real tarball installed; both Icons packages absent; build and one-route prerender PASS; Chromium SSR/hydration interaction `0→1`, no console error/warning; `add` fallback SVG present, unresolved `save` SVG absent; no `Zone` global |
| Angular 22 consumer with Icons | Same Core tarball plus local Icons packages; build and one-route prerender PASS; Core `save` slot and app-owned `<neural-icon>` both produce SVG; Chromium SSR/hydration interaction `0→1`, no console error/warning; no `Zone` global |

The consumer prerender has Angular `ngh` hydration markers and `ng-server-context`, and no ZoneJS script. The temporary consumer's offline npm resolver required `--legacy-peer-deps` for the local tarball; `npm ls` confirmed its actual Angular 22 peers and the absence of Icons in the no-provider variant. This is a package-manager resolution caveat, not a Core source import failure.

## Local artifact and Showcase V2-S0 handoff

The actual npm archive is `/private/tmp/n2-icon-h9-certified-20260928/neural-ui-core-1.15.0.tgz`: **1,304,074 bytes**, **447 files**, SHA-256 **`a849ffc695a73359d5e45ff5d5e1d6bc61cf67f605bbf561c66291ae0c8f9343`**. Package manifest: `version: 1.15.0` (non-authoritative for product generation), `dependencies: { tslib: ^2.3.0 }`, Angular 22/CDK/schematics peers, **no Neural Icons dependencies, peers or optional peers**. No implementation `.ts` files are packed. This archive is local-only and must not be published.

After the single local Core commit, Showcase V2-S0 must pin the **new Core commit SHA**, this tarball filename and this SHA-256 together; it must not infer Core 2 identity from `1.15.0`. Showcase may separately install Neural Icons for its own UI and configure the optional Core resolver, but Core remains independent. Do not begin V2-S1 here.

**N2-ICON-H9 PASS — neutral Core icon contract certified locally; ready for the Core snapshot handoff.**
