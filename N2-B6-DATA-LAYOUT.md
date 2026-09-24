# N2-B6 — Data layout

## 1. Status

**B6 COMPLETE — READY FOR HEAVY WAVE.** DashboardGrid and DataView are complete in the working tree; B6 has **not** been committed. This phase did not start C1–C6.

## 2. Starting checkpoint

B4/B10 were reviewed and committed first on `v2` as `681c036505c0efae44ba9bd93882d8178dcc850c` (`feat(core): complete B4 and B10 medium wave`). The pre-B6 library suite passed 182 files / 2,469 tests. The unrelated untracked `projects/ui-core/tree-table/public_api 2.ts` was preserved byte-for-byte.

## 3. DashboardGrid audit

The existing public `NeuDashboardTileConfig.id` is a stable semantic identity. The old implementation mirrored `tiles` into writable `_orderedTiles`, used CDK mixed-orientation drag/drop, and used two product effects. Projected content is matched by `data-tile-id`. Columns and tile spans are presentation inputs; there is no storage or URL owner.

## 4. DataView audit

The component already exposed list/grid/visual-table presentation, item/header/footer templates, local search/sort, page navigation, externally supplied `total`/`currentPage`, and `trackBy`. Its old search/sort FormControl synchronization used two effects. It composes the certified Button, Input and Select controls; it does not import Table runtime.

## 5. Design classification

DashboardGrid: **focused/deep refactor**; its CDK and projection structure remained useful. DataView: **deep refactor** of ownership and render semantics. Neither required a rewrite or a new public API.

## 6. Ownership

DashboardGrid reads the applied `tiles()` directly. CDK owns only a transient drag preview; `orderChange` is a proposal, and a parent write is the only way to change applied order. DataView receives applied `items`, `total`, `currentPage`, `pageSize`, `mode`, `loading` and configuration inputs; local query, sort key and page exist only where the public contract has no applied counterpart. `modeChange`, `pageChange`, `searchChange` and `sortChange` express user actions. No persistence owner was added.

## 7. Dashboard identity

Reorder resolves the dragged tile by `id`, not title, object identity or long-lived array index. Duplicate display titles, reconstructed frozen tile objects, parent replacement and responsive columns were tested. No identity was derived from text.

## 8. Reorder contract

Pointer and keyboard reorder create a fresh array, leave tile objects/consumer arrays untouched, and emit once for a real move. No-op/boundary moves emit nothing. A rejected proposal leaves applied order unchanged; an accepted parent write is rendered without an echo.

## 9. Drag lifecycle

The existing CDK mixed drag/drop remains the sole drag engine. The standalone `CdkDragHandle` import was added so the real pointer handle is active. Escape during an active drag suppresses its reorder proposal through a transient capture listener, removed on drop/end/destroy. CDK preview cleanup is awaited in the Chromium test. Destroy and 50 create/destroy cycles are covered; there is no permanent document listener.

## 10. Keyboard/a11y reorder

Each tile has a native button handle with a descriptive instruction. Arrow keys propose moves; horizontal key direction follows computed RTL/LTR visual direction while domain order remains logical. Rejection preserves focus and applied order. The grid uses list/listitem semantics, without presenting arbitrary projected tile content as a fake application grid.

## 11. DataView data owner

`items` remains a readonly consumer input. The derived result returns that same array when no local transform is needed; no persistent copy is created. `trackBy` is the existing identity contract; callers with reconstructed items should provide a stable key. No selection, column or generic Table engine was introduced.

## 12. Total/local-remote policy

An explicitly supplied `total` marks `items` as an already-windowed external result. It remains authoritative for page count even when the loaded slice is small. That slice is neither silently searched/sorted nor paginated again. Without `total`, local filtering/sorting/paging operates on supplied items; no backend-global claim is made.

## 13. Pagination

DataView keeps its existing compact previous/next contract rather than adding a second NeuPagination state owner. With `currentPage`, the parent owns the applied page and clicks emit bounded proposals only. Without it, the existing local page signal is bounded and can reset after local query changes. `pageSize` is normalized to a finite positive integer. An externally supplied `total` is never replaced by `items.length`.

## 14. Search

The existing search box is locally owned because there is no applied query input. User changes update its control and local query once, then emit `searchChange` once. In externally-windowed mode the event delegates search to the consumer; the loaded slice is not locally filtered. No new query protocol or filter AST was added.

## 15. Layout mode

`mode` remains the applied input; toggles emit `modeChange` and never install a second applied owner. Rejected proposals leave the rendered mode unchanged. The configured `modes` array is readonly, and invalid/no-op toggles do not emit. The visual `table` mode still represents items as a native list, not a false ARIA table lacking rows/cells.

## 16. Templates

The existing item template receives `{ $implicit: item, index }`; header/footer templates retain their existing void contexts. No template directive or context was added. Projected dashboard content is attached to slots by stable tile id, and the attachment is idempotent.

## 17. Empty/loading

Applied `loading` takes precedence over empty presentation. Data, empty, loading, list and grid were rendered in SSR/Chromium. Status text uses the existing labels; no new component dependency was added.

## 18. RTL

DashboardGrid uses logical grid order and a computed directional keyboard delta. Real Chromium covered RTL tile geometry and a horizontal pointer reorder that the parent rejects without changing applied order. Responsive column changes are presentation-only and emit no reorder. DataView retains native controls and logical list/grid layout; no data order reversal was introduced.

## 19. Effects/resources

DashboardGrid: **2 → 1 effect**; the survivor attaches projected content after render on browser only and is destroy-guarded. DataView: **2 → 0 effects**; two FormControl `valueChanges` subscriptions remain and use `takeUntilDestroyed`. No per-item effects, observers or timers were added. DashboardGrid has one document keydown listener **only during active drag**, removed on end/drop/destroy; there are no permanent global listeners.

## 20. SSR

The Angular 22.1.6 zoneless consumer renders multiple applied tiles, list/grid data, search, pagination, empty and loading server-side. It creates no browser-only drag resource or initial proposal on the server.

## 21. Hydration

Real Chromium SSR→hydration passed DOM node reuse and **0 NG050x**. Initial outputs are empty. Keyboard order/page/mode/search proposals occur once; rejected and accepted writes behave deterministically. Real pointer reorder is exactly once, Escape cancels, and an RTL pointer proposal can be rejected without a persisted reorder. CDK animation completion is awaited before starting a second drag.

## 22. Zoneless

The consumer uses `provideZonelessChangeDetection()` without Zone.js. Signals, template bindings and parent writes update without manual change-detection calls.

## 23. Performance

Representative directed fixtures cover 24 dashboard tiles, 100 locally paged items, 1,000 unpaged local items, repeated computed reads, stable keyed DOM across item reconstruction, and 50 create/destroy cycles per component. The unfiltered/no-sort path avoids an unnecessary array copy; the remote-window path avoids proportional work based on `total`. These are structural/regression checks, not browser throughput claims.

## 24. Bundle

The reproducible esbuild audit uses the built package with Angular/CDK/Forms externals and reports raw/gzip/Brotli bytes:

| Consumer      |     Raw |   Gzip | Brotli |
| ------------- | ------: | -----: | -----: |
| DashboardGrid |  12,454 |  3,169 |  2,714 |
| DataView      | 100,957 | 23,545 | 20,681 |
| Combined B6   | 113,432 | 26,138 | 22,725 |
| Root unused   |   **0** |     20 |      1 |

DataView's main retained source is its existing Select composition (~39.9 KB raw), followed by DataView itself (~26.4 KB) and shared internals (~16.1 KB). DashboardGrid's own bundle is ~12.4 KB raw. Gzip/Brotli for the empty root-unused output are compression container overhead, not retained code.

## 25. Public API

Official contract regeneration/audit passed: **98 entrypoints, 792 exported declarations, 1,481 bindings**. No symbols or bindings were added/removed. Six existing signatures widened to readonly inputs/outputs: DashboardGrid `tiles`/`orderChange`, and DataView `items`/`modes`/`searchFields`/`sortOptions`. No new event, method or entrypoint was introduced.

## 26. Directed tests

`test:n2-b6`: **2 files, 54/54 tests PASS** (DashboardGrid 31, DataView 23). Coverage includes immutable proposals, rejected/accepted writes, Escape, RTL, remote `total`, local search/sort/page, templates, frozen data, lifecycle and representative item counts.

## 27. Full suite

The final library run passed **182/182 files and 2,482/2,482 tests**. Relative to the B4/B10 checkpoint's 2,469 tests, B6 added 13 net tests; no existing file was removed. Global coverage was not run.

## 28. Package/contracts

Production build, public contract audit/tests, package audit and package verification passed. The package contained 435 checked files. All **98 public imports** and **98 SSR imports** passed. `audit:n2-icons-boundary` passed; B6 did not change the A0.2 icon graph or add an old icon runtime.

## 29. Portfolio

The official generator was updated and rerun. Drift check passed: **95 public components = 86 completed + 9 pending + 0 remove; 6 implementation batches remain**. B6 completes the last medium data-layout batch. This is an accounting update, not a new implementation phase.

## 30. Remaining risks

DataView's pre-existing local search/sort contract is intentionally simpler than Table; external `total` delegates those operations rather than claiming global results. Consumers must supply stable `trackBy` for reconstructed items. CDK has a short cleanup animation after drag; sequential pointer tests wait for preview removal. No public/API blocker remains for B6.

## 31. Files changed

Runtime/spec/styles: DashboardGrid and DataView only. Tooling: B6 bundle and Chromium hydration scripts plus three package scripts. Generated public contract and portfolio outputs, with the one-line portfolio generator update. This report is B6-owned. No neural-icons package/runtime, Table, TreeTable or unrelated source was modified.

## 32. Git status

Branch `v2`, HEAD `681c036505c0efae44ba9bd93882d8178dcc850c`; B6 remains **uncommitted** in the working tree and staging is empty. The foreign untracked `projects/ui-core/tree-table/public_api 2.ts` remains intact (SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`) and must not be staged with B6. No symlink or temporary hydration directory was created/versioned. No push, tag, release or npm publication occurred.

## 33. Recommendation

**B6 COMPLETE — READY FOR HEAVY WAVE.** The next planned heavy batch is C1 Gallery/ImageGallery, but it was **not** started. Review and explicitly authorize a B6 commit before advancing.
