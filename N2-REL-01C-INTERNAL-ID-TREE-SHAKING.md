# N2 REL-01C — Internal ID source-module split

## Decision

**REL-01C REMEDIATION NOT EFFECTIVE.** The proposed split compiled in the real Angular package but did not remove unrelated temporal/responsive code from ID-only consumers or save any raw bytes. The productive split was reverted. The current runtime, public contract, package exports and H9 budgets remain unchanged.

## Required evidence ledger

1. **Final status:** REL-01C REMEDIATION NOT EFFECTIVE (Phase 6, Case B).
2. **Starting commit:** `7773da735f3098070c0f496463f1c7eee092e402`, the REL-01B design-stop report checkpoint; parent `fc0cb57ab7f869703051732575681d8ba2888c69`, branch `v2`.
3. **Design-review resolution:** Tried a source-module split within the existing `@neural-ui/core/internal` entrypoint. No `foundation` export or new package subpath was attempted.
4. **Canonical release runtime:** Node 22.22.3, zlib 1.2.12, Brotli 1.2.0, Darwin arm64. H9 policy already records this Node/zlib/Brotli tuple. H9 and REL tooling now print or record the actual environment and fail on incompatible codec metadata.
5. **Compression reproducibility:** Two canonical Node runs gave identical pre-change H9 measurements. Two canonical runs of the ID probe agreed. Node 22.22.2 (zlib 1.3.1-e00f703, Brotli 1.1.0) is rejected by H9 and REL tooling. In six REL consumers, canonical raw/Brotli matched the existing REL baseline, while gzip changed: root 454→452, Tag 2,827→2,828, Table 38,990→38,901, TreeTable 25,762→25,747, Tree 12,199→12,166, VirtualList 3,011→3,023 B. The existing REL baseline has no codec metadata; the updated gate fails closed instead of silently comparing it. Automatic approval review rejected overwriting that baseline under the new codec, so it remains intact. The Phase-A Table and TreeTable K artifacts also fail exact canonical gzip comparison; their raw figures remain stable. Historical N1.15 H9 budgets were not rewritten.
6. **Previous topology:** The one `NeuIdGenerator` class was in `internal/neu-hydration-internals.ts`, exported by `internal/public_api.ts` and compiled into `neural-ui-core-internal.mjs` together with temporal/responsive declarations.
7. **Experimental split:** Moved the exact class into `internal/neu-id-generator.ts` and exported it from the same `internal/public_api.ts`; removed its old definition. After the materiality failure, restored all three productive files to their starting state. The final definition remains in `neu-hydration-internals.ts`.
8. **Public API:** Final delta 0. The restored contract audit passes with 97 entrypoints, 813 exported declarations and 1,462 bindings. `./internal#NeuIdGenerator` remains; `./foundation#NeuIdGenerator` is absent.
9. **Package exports:** Final delta 0. No ID subpath was added, and package metadata was not edited.
10. **Canonical identity:** Exactly one source class definition before, during and after the experiment; one `providedIn: 'root'` declaration. The compiled `internal` FESM remained the sole package owner.
11. **DI singleton:** The implementation and provider semantics were copied unchanged for the experiment and restored. No new singleton certification is claimed because Case B ended the experiment.
12. **Per-injector semantics:** The existing class still owns a per-instance `Map<string, number>`; its explicit environment-injector spec was not changed or rerun for this rejected topology.
13. **Cross-consumer IDs:** Kanban and ColorPicker package consumers were measured together as separate bundle scenarios. A live combined-injector ID test was not required after Case B and was not run.
14. **Cycles:** The final runtime has no new source import edges. No new package boundary survived.
15. **Kanban before graph:** Kanban FESM 40,798 B, foundation 317 B, internal 5,497 B in the minified output; temporal key and `matchMedia` retained.
16. **Kanban experimental after graph:** The same 40,798 / 317 / 5,497 B input contributions; temporal key and `matchMedia` still retained. Full metafiles: `baselines/n2-release/rel-01c-before-metafiles.json` and `rel-01c-after-metafiles.json`.
17. **Kanban before → experimental after:** 46,636 / 8,434 / 7,390 → 46,636 / 8,436 / 7,379 B (raw / gzip / Brotli).
18. **Kanban real saving:** 0 raw, **−2 gzip** (2 B increase), 11 Brotli B. No material saving.
19. **ColorPicker before graph:** ColorPicker FESM 57,078 B, foundation 389 B, internal 5,513 B; temporal key and `matchMedia` retained.
20. **ColorPicker experimental after graph:** The same 57,078 / 389 / 5,513 B input contributions; temporal key and `matchMedia` still retained. Full metafiles are in the same two evidence files.
21. **ColorPicker before → experimental after:** 63,004 / 12,580 / 11,045 → 63,004 / 12,579 / 11,039 B.
22. **ColorPicker real saving:** 0 raw, 1 gzip, 6 Brotli B. No material saving.
23. **Synthetic versus real:** REL-01A's canonical-runtime synthetic ID-only probe suggested Kanban 41,747 / 7,185 / 6,242 and ColorPicker 58,084 / 11,346 / 9,947 B. The real internal-entrypoint split stayed at the old raw sizes. Synthetic substitution did not predict ng-packagr's actual retention.
24. **Unrelated symbols:** `neu-temporal-state` and `matchMedia` remained in both experimental outputs; internal `bytesInOutput` was unchanged. The split therefore did not isolate the temporal/responsive closure.
25. **SSR:** Not rerun after Case B; no productive topology change remains.
26. **Hydration:** Not rerun after Case B; no productive topology change remains.
27. **Zoneless:** No `zone.js` or runtime changes. A new zoneless consumer run was not needed for the reverted split.
28. **Contracts:** PASS after restoration (97 / 813 / 1,462).
29. **Root-unused:** The canonical read-only six-consumer probe resolved real package exports, produced nonzero used output, rejected invalid exports, and measured 0 B unused raw. The exact REL baseline gate now fails closed because its old baseline lacks codec metadata; it is not claimed as a release PASS.
30. **Source leakage:** Both captured measurements used compiled package exports and passed package-only metafile assertions; no `projects/ui-core/**` runtime source was used.
31. **Button H9:** Canonical pre-change H9: 16,276 / 2,669 / 2,272 B, PASS; retain the historical baseline. Runtime untouched.
32. **Table BASIC H9:** Canonical pre-change static closure: 174,439 / 34,670 / 25,692 B, FAIL against the obsolete TableCore comparator. No Table runtime change.
33. **Table lazy chunks:** H9 still reported five separate lazy outputs (advanced filter, active editor, CSV, JSON, XLSX); none was folded into BASIC.
34. **Kanban H9:** Canonical pre-change H9: 46,636 / 8,434 / 7,390 B, above historical ceiling. The ineffective split did not resolve it; no rebaseline.
35. **ColorPicker H9:** Canonical pre-change H9: 63,004 / 12,580 / 11,045 B, above historical ceiling. The ineffective split did not resolve it; no rebaseline.
36. **Baseline decisions:** Keep Button's historical baseline. No new Table, Kanban or ColorPicker baseline was established after Case B. Headroom formula and old budgets remain untouched.
37. **H9 policy:** Numeric policy unchanged. The H9 runner now rejects a Node/zlib/Brotli tuple different from its recorded toolchain and emits the measured environment. Scenario semantics and historical values remain as recorded.
38. **Two-run determinism:** Two canonical pre-change H9 PR runs matched exactly for root-unused, Button, Table BASIC/advanced-lazy, Kanban and ColorPicker. No post-remediation H9 certification applies to the reverted experiment.
39. **Build/package/import/SSR:** Real ng-packagr build PASS before the split, with the split, and after restoration. Package verification, imports and SSR smoke were not rerun because the split failed the materiality gate.
40. **Angular 22 tarball consumer:** Not run after Case B; no productive topology change remains.
41. **Full suite:** Not rerun after Case B. Last certified global result remains 188/188 files and 2,514/2,514 tests; this report does not claim a new suite pass.
42. **Strict ATTW:** Not rerun after Case B. Prior classified debt remains 97 CJS→ESM plus four Sass diagnostics; no ignores or package conditions changed.
43. **Runtime diff:** Zero productive runtime files at final state. Only release measurement tooling and this report/evidence are uncommitted.
44. **Remaining release debts:** H9 Table/Kanban/ColorPicker ceilings unresolved; exact REL and affected K gzip baselines need an explicitly approved canonical-runtime decision; strict ATTW and global coverage remain known debts; IA-04 docs and Showcase 2 remain outside this phase.
45. **Recommendation:** Do not keep the source split or finalize REL-01. A different packaging design must demonstrate removal of the unrelated closure in real ng-packagr output while preserving one DI token and zero API/export delta. Keep historical evidence and seek explicit review before changing old compressed baselines.

The REL-01B checkpoint report remains committed separately. All REL-01C work is unstaged and uncommitted. No push, tag, release, npm publish, REL-02 or Showcase 2 action was performed.
