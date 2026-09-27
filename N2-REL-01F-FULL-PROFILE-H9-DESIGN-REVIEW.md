# N2 REL-01F — Full-profile H9 design review

All bundle triplets are **raw / gzip / Brotli bytes**. Measurements resolve the built `dist/neural-ui/core` package on canonical Node 22.22.3, Darwin arm64, zlib 1.2.12 and Brotli 1.2.0. Angular, CDK and RxJS are external, as in H9. Metafile and source-map contributions are approximate and are not additive across separate consumer scenarios. Virtual class deletion is an upper-bound diagnostic only; it was never applied to productive source or `dist`.

## 1. Status

**REL-01F PACKAGE REMEDIATION REQUIRED.** The Menu measurement correctly imports the base `NeuMenuComponent`, yet its FESM retains the materially larger N2 TieredMenu implementation. A real package boundary must be designed and measured before a Menu budget decision. The combined PickList/OrderList scenario is **N2 BASELINE ELIGIBLE**: it intentionally imports both components, counts their shared code once, and its growth is attributable to N2 features and dependencies. No budget changes were made.

Separate decisions: **REL-01 BASELINE ENVIRONMENT MIGRATION SAFE** and **ATTW STRICT — KNOWN UNSUPPORTED-CONDITION DEBT**. The former is a migration design conclusion, not a completed release-gate migration. Strict ATTW still exits nonzero.

## 2. Starting commit

Branch `v2` starts this audit at `ab1dcfd7771ba3c269a435e435a75b9c79a9600b`, parent `9e2567cb4efc8ad5224a23fbaebaaff84d0f02ca`, message `fix(package): isolate internal state services for tree shaking`. That one local commit contains the certified REL-01E source, tests, contract and H9 changes. Immediately afterward, the only working-tree item was the foreign untracked TreeTable file.

## 3. Menu historical scenario

The `v1.15.0` H9 harness imported and re-exported **`NeuMenuComponent` from `@neural-ui/core/menu`**. It was not a MenuCore or smaller facade and had no lazy split. Its frozen baseline is **70,946 / 10,266 / 8,913** and failure ceiling **72,720 / 10,780 / 9,359**. The old package source already declared Menu, MenuButton, Menubar, MenuItemDirective and TieredMenu together. Old TieredMenu was a thin wrapper whose template rendered `<neu-menu>`.

## 4. Menu current scenario

The current full-profile H9 harness imports and re-exports the **same symbol and subpath**, with one minified static output and zero dynamic imports. It measures **96,145 / 12,782 / 10,803**, above the old baseline by **25,199 / 2,516 / 1,890**. Running the same current package under the historical and corrected H9 build options produces exactly this same triplet; harness evolution explains **zero** current-package bytes. The `@neural-icons` dependency is bundled by both current-package runs because the historical `@ng-icons/*` external pattern does not match it.

## 5. Menu comparability

**PARTIALLY COMPARABLE.** The imported public component is identical in name and role, but the N2 FESM co-locates a new independent TieredMenu renderer with it. The old TieredMenu was only a wrapper; current TieredMenu owns its own level renderer, overlay readiness, expanded-key state and pointer dismissal. Those capabilities are not requested by the measured base-Menu import. The historical N1.15 output graph is unavailable, so this audit does not invent old per-module bytes.

## 6. Menu module attribution

The current package-only metafile assigns approximately **68,535** raw output bytes to `neural-ui-core-menu.mjs`, **16,207** to Button, **5,729** to `@neural-icons/angular`, **5,259** to internal helpers and **391** to foundation; the remaining bytes are bundle syntax. A generated-source-map attribution within these inputs assigns about **11,088** to `NeuMenuComponent`, **8,812** to Menubar, **8,376** to MenuButton, **5,905** to MenuItemDirective, **12,112** to `neu-tiered-level.component.ts`, **2,923** to `NeuTieredMenuComponent`, **508** to tiered-state helpers, **2,856** to the roving keyboard controller and **1,185** to the overlay stack. These source-map numbers include imperfect mapping of Angular-generated declarations and should not be treated as isolated shippable savings. Item normalization, focus, submenu behavior and a11y bindings reside mainly inside the Menu and tiered classes. `NeuIdGenerator` contributes about **408** mapped bytes; CDK overlay and Angular remain external and contribute no bundled raw bytes.

## 7. Menu forbidden retention

The output has no MegaMenu, Tree, TreeTable, Router, Forms runtime, full internal-state service, icon catalog or unrelated overlay implementation. Button, the roving controller and overlay stack are used by the current Menu family. **Menubar and the new TieredMenu renderer are retained for an import of only `NeuMenuComponent`** because their Angular partial declarations and metadata share one `menu` FESM. No separate duplicate item-normalization engine or keyboard controller appears in the input graph.

## 8. Menu feature delta

Source comparison against `v1.15.0` shows the existing Menu source grew from 584 to 674 lines, while N2 adds `neu-tiered-level.component.ts` (266 lines) and `neu-tiered-state.ts` (50 lines). The TieredMenu template changed from forwarding inputs to `<neu-menu>` to rendering `<neu-tiered-level>` directly. Its new code handles nested branch state, overlay readiness, direction, pointer dismissal and focus/navigation. The base family also gains deterministic panel IDs and safer focus restoration. Icons migrated from `NeuIconComponent` to `NeuralIcon`. This is concrete N2 feature growth, but the tiered feature is unrelated to the measured base-Menu consumer.

## 9. Menu optimization candidates

The evidence-only FESM experiment removes the **TieredMenu and TieredLevel class families** while retaining the measured base Menu. It falls to **68,505 / 10,402 / 9,060**, an upper-bound saving of **27,640 / 2,380 / 1,743**. To pass the unchanged ceiling, a real boundary must save at least **23,425 / 2,002 / 1,444**; the diagnostic has only **4,215 / 378 / 299** of boundary-overhead margin. Deleting classes is not a product fix. A real design would move the tiered renderer, state and component into a separate secondary FESM, preserve all existing `@neural-ui/core/menu` named exports through compatibility re-exports, and keep shared MenuItem types/directives in an acyclic boundary. Likely files are `menu/neu-menu.component.ts`, `menu/neu-tiered-level.component.ts`, `menu/neu-tiered-state.ts`, `menu/public_api.ts` and new secondary-entrypoint metadata. This has **moderate-to-high** implementation complexity because the tiered component uses the shared MenuItemDirective. Existing supported names must remain; new package subpaths require contract/export review. SSR/hydration risk is concentrated in overlay timing, focus and branch state, and needs directed browser verification. The actual saving and cycle-free layout must be proved with ng-packagr; the diagnostic is not a guarantee.

Externalizing `@neural-icons/*` alone yields **90,506 / 11,754 / 9,942**, still above every old failure ceiling. It changes the accounting boundary and does not solve the retained tiered code. Removing MenuButton and Menubar as well in a more destructive virtual experiment reaches **43,023 / 7,939 / 6,973**, but those older facades are outside the focused candidate and this is not a shippable result.

## 10. Menu decision

**ACCIDENTAL PACKAGE RETENTION + LEGITIMATE N2 GROWTH (MIXED).** The measured base Menu should not pay for a distinct TieredMenu implementation. A real boundary remediation is required before considering its H9 baseline. No Menu budget was changed and no Menu runtime was edited.

## 11. PickList/OrderList historical scenario

The `v1.15.0` H9 harness imported **both `NeuPickListComponent` and `NeuOrderListComponent` from `@neural-ui/core/pick-list`** into one consumer. The frozen baseline is **76,025 / 11,936 / 10,202** and failure ceiling **77,926 / 12,533 / 10,713**. The old source already exported both components from the same file and used the Neural DragDrop directives; this was not a PickList-only or lower-level core scenario.

## 12. Current scenario semantics

The current H9 scenario retains those same two imports in **one** minified static output, with zero dynamic imports. It measures **106,805 / 16,529 / 13,916**, above the historical baseline by **30,780 / 4,593 / 3,714**. Running the current package under the old and current H9 options yields identical bytes. This is a shared combined consumer, not two separately summed files. The `pick-list` FESM exports both components and their item directives.

## 13. PickList/OrderList comparability

**PARTIALLY COMPARABLE.** H9 imports the same two public components in both versions, and the combined scenario still represents the pair. N2 adds material P1 behavior and dependencies: semantic-key duplicate handling, a shared ordered-list engine, visible-selection reordering, transfer focus restoration, an explicit drag handle, standardized Button controls and leaf icon modules. The baseline is a valid historical reference, but not the byte budget for the expanded N2 implementation without an explicit new-baseline decision.

## 14. PickList/OrderList module attribution

The current combined metafile attributes approximately **62,341** raw bytes to `neural-ui-core-pick-list.mjs`, **17,931** to the shared DragDrop FESM, **16,212** to Button, **5,735** to `@neural-icons/angular`, **3,068** to internal helpers, **613** to option-api and under 900 combined to five leaf icon modules and their definition helper. CDK DragDrop and Angular are external. Source-map attribution of an almost identical single-component output (~16 raw bytes smaller) assigns about **24,163** to the PickList class, **8,063** to OrderList, **8,560** to its item-directive region, **1,977** to the new shared ordered-list engine, **17,505** to DragDrop source and **14,488** to Button source. The map also assigns about **3,000** to NeuralIcon implementation; generated metadata can shift bytes between adjacent class buckets. These are approximate retained contributions, not a sum of independently removable features.

## 15. PickList/OrderList forbidden retention

The combined output has no Table, Listbox, Tree, Forms runtime, internal-state service, unrelated component facade or icon catalog. Only five leaf icons are imported. One ordered engine and one DragDrop FESM are present, without duplicate reorder or identity modules. A **PickList-only** import still measures **106,789 / 16,529 / 13,943**, and an **OrderList-only** import **106,789 / 16,529 / 13,909**: Angular declarations keep both classes in the same FESM. That is a separate single-component package tax, but the audited H9 consumer explicitly uses both, so removing the unused class from either isolated case cannot reduce the combined H9 result.

## 16. Shared/split semantics

H9 creates one output, reports no dynamic chunk and counts shared Button, DragDrop, icons and ordered-list code once. It neither double-counts the two components nor folds hidden lazy chunks. Virtual deletion of the other component in a **single-component** diagnostic reduces PickList-only to **81,992 / 14,556 / 12,630** and OrderList-only to **70,877 / 12,615 / 11,012**. Both deletions invalidate the combined scenario and exported API; they demonstrate a future single-import optimization opportunity, not a correction to this H9 measurement. No harness change is justified.

## 17. PickList/OrderList optimization candidates

Externalizing the current icon package gives **100,626 / 15,237 / 12,752**, still far above the historical ceiling, so it cannot explain or resolve the failure. Removing `neu-button` from the controls would discard the current styled/accessible Button behavior and is not a clean feature-preserving package edit. The shared ordered engine is retained once and supports semantic identity, reorder and transfer behavior. Splitting the two component families into separate entrypoints could help applications importing just one, but offers no proved saving for the H9 consumer that imports both. No material, clean, avoidable closure for the combined scenario was found.

## 18. PickList/OrderList decision

**LEGITIMATE N2 PRODUCT GROWTH; N2 BASELINE ELIGIBLE for the combined H9 scenario.** The old comparison is partially comparable because the exported pair is unchanged but behavior expanded. Do not update its budget in this audit. A later decision should define the N2 baseline from a canonical deterministic run. Single-component entrypoint isolation may be reviewed separately and should not be credited toward this combined budget.

## 19. REL-01E effect

The comparable **Menu namespace** probe in REL-01D was 99,523 raw before the boundary; the REL-01E built-package namespace probe is **96,384 raw**, a **3,139-byte decrease**. The current Menu and PickList/OrderList H9 outputs contain neither `neu-temporal-state-` nor `matchMedia`. There is no archived pre-REL-01E PickList/OrderList H9 measurement under the exact current scenario, so no exact before/after triplet is invented for it. REL-01E removes an unrelated internal closure; it did not create these historical-budget failures.

## 20. Canonical Node environment

All REL-01F runs use Node **22.22.3**, zlib **1.2.12**, Brotli **1.2.0**, Darwin **arm64**. gzip uses level 9 and Brotli quality 11. Two complete runs of the six REL-01 package controls are byte-identical, including raw, gzip, Brotli, unused controls and package inputs.

## 21. Legacy compression baseline issue

The frozen `baselines/n2-release/rel-01-package-bundle.json` has **no `compressionEnvironment` field**. The hardened release auditor rejects it before byte comparison; this is a provenance failure, not proof of product regression. For all six current-package cases, raw and Brotli match the frozen values exactly. Canonical gzip differences (current minus historical) are: root **−2**, Tag **+1**, Table **−89**, TreeTable **−15**, Tree **−33**, VirtualList **+12** bytes. All six unused imports remain **0 / 20 / 1**, and invalid-export controls reject as expected. The 37 audited root-unused harness names also match the frozen inventory. Prior REL-01C evidence reproduced the frozen gzip values under another Node/zlib build, but the baseline itself does not identify that runtime, so its exact codec provenance remains unrecorded.

## 22. Codec migration plan

**REL-01 BASELINE ENVIRONMENT MIGRATION SAFE.** Preserve the historical JSON unchanged as immutable evidence (SHA-256 `c2d296a2d72c42dd2162917a627305bdd3629072c73d837f292bc4f56bc42c23`). Create a **new active N2 artifact** carrying the canonical environment tuple, the six current byte triplets, unchanged method/input controls, and provenance linking that frozen file by path and hash. The release gate should explicitly select the new artifact, reject a mismatched runtime, and compare only measurements produced by its recorded codec. Keep old gzip/Brotli values visible as historical rather than overwriting them. Two identical canonical runs plus unchanged raw/Brotli support this migration; implement and review the gate/artifact in a separate task. This audit did not modify either baseline or release gate.

## 23. ATTW current state

Strict ATTW exits 1 with exactly **98 `CJSResolvesToESM`** diagnostics and **4 `NoResolution`** diagnostics for `./styles`; no other category appears. `./internal-state` adds one `CJSResolvesToESM` at **`node16-cjs`**, the same condition as the previous 97 entrypoints. Its `node16-esm` and `bundler` resolutions have no visible problems. The Sass diagnostics are the four resolution modes of the existing `./styles` export.

## 24. ATTW policy classification

**ATTW STRICT — KNOWN UNSUPPORTED-CONDITION DEBT.** The new diagnostic concerns CommonJS consuming this ESM package; no supported Angular/ESM path is broken. REL-01E's real Angular 22 tarball, Sass, entrypoint imports, SSR and publint passed and the productive package has not changed in REL-01F. No CJS build, fake Sass typings or ATTW ignore was added. Strict ATTW is not claimed as passing; its policy still needs an explicit release decision.

## 25. Productive runtime delta

**Zero.** The only REL-01F source files are three read-only audit scripts and this report. Virtual FESM deletions ran through esbuild's in-memory onLoad path; `dist` and productive TypeScript were not rewritten. No experiment remains applied.

## 26. H9 baseline delta

**Zero.** Menu, PickList/OrderList and all other numerical budgets and tolerances remain exactly as committed in REL-01E. The H9 harness is unchanged because old/current measurements of the same package agree and combined-pair semantics are correct.

## 27. Git cleanliness

REL-01F report and audit scripts remain untracked, unstaged and uncommitted. The tracked runtime and H9 policy have no working-tree delta. The foreign `projects/ui-core/tree-table/public_api 2.ts` remains untracked and unstaged at SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`. Final `git diff --check` passes; there are zero symlinks and zero temporary files in the workspace outside installed dependencies/generated distribution.

## 28. Next authorized action

Design and implement a cycle-free Menu/TieredMenu package split in a separate task, retaining old exports and proving real-package, H9, SSR/hydration and contract results. Then decide the combined PickList/OrderList N2 baseline and enact the provenance-preserving REL-01 codec migration. Resolve ATTW policy explicitly before release certification. This audit does not authorize an automatic follow-on commit, push, tag, release, npm publication, REL-02 or Showcase 2.

Reproducible evidence: `scripts/audit-n2-rel-01f-h9-attribution.mjs` measures old/current harness and virtual package closures; `scripts/audit-n2-rel-01f-source-map.mjs` estimates retained source owners; `scripts/audit-n2-rel-01f-codec.mjs` performs two canonical read-only package-evidence runs.
