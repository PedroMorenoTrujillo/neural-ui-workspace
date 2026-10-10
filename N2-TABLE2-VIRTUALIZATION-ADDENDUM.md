# N2 — NeuTable 2 Virtualization Normative Addendum

This document records the design-review resolution that authorizes N2-011G. It is normative for virtualization and does not reopen the frozen ownership or public API contracts.

## Navigation policy

Pagination and virtualization are mutually exclusive at runtime. When virtualization is enabled it wins: pagination does not slice rows, no paginator is rendered and `query.page`/`query.pageSize` remain unchanged and inert for table navigation. Virtual indexes are global within the normal-row result domain; pinned rows are outside that domain.

## Ranges and defaults

Visible, render and request ranges are distinct half-open `[start,end)` ranges. Render adds overscan to visible; remote request ranges align render to `effectiveRequestStep`. A finite positive `requestStep` is floored with minimum 1; otherwise it defaults to 50.

SSR uses the deterministic bootstrap render/request range `[0,min(total,step))`, or `[0,step)` when total is unknown. SSR publishes no visible range, emits no `rangeChange` and emits no request. Browser geometry begins after hydration.

## Remote windows

Remote virtual data is one parent-owned contiguous window. For `dataRange=[start,end)`, `data[0]` maps to `start`. Runtime renders only the safe representable intersection and never creates placeholders or an internal cache.

Initial and semantic-query requests contain one aligned current range. Viewport requests occur only for an uncovered, not-already-requested range. Retry always uses the current aligned required range with the same query revision and a new request ID.

## Imperative methods

`scrollTo({index})` uses the global normal-row index. Client keys resolve against the logical result; remote keys resolve only when loaded. An unloaded remote key is a successful no-op. `focusCell()` returns false for unknown/hidden columns and unloaded remote keys; known offscreen rows may be materialized and focused without polling.

## Surface

No public symbol or member is added. The surface remains 66 types, 15 directives, 24 inputs, 14 outputs and 4 methods. `dataRequest` remains the sole transport channel.
