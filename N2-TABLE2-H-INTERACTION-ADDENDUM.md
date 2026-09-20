# N2 — NeuTable 2 H Interaction Normative Addendum

This document resolves the N2-011H design-review stop. It is normative for editing, expansion and grouping and does not reopen the frozen public surface, ownership model, remote channel or fixed-height virtual engine.

## Editing session identity and ownership

An active session is identified privately by exact `K`, edit mode, `columnId` for cell editing, and an internal generation token. It is never identified by row object, DOM node, row index or virtual render index. `editState` remains parent-owned applied state and `editStateChange` remains a proposal. The draft lives in the facade/controller, outside recyclable row DOM.

The session captures only relevant editable source values. Cell editing captures the edited source value through the authorized accessor/equality policy. Row editing captures relevant editable source values. No row serialization or arbitrary deep clone is allowed.

## Parent data writes

A reconstructed row with the same `K` preserves the session, draft and still-applicable validation only when all relevant source values remain semantically equal to the session baseline. If a relevant source value changes externally, the session is cancelled once with `reason:'data-change'`; no merge or hidden last-write-wins is allowed.

In client/non-virtual mode, disappearance of the edited `K` means real removal and cancels with `data-change`. The same applies to replacement of a remote non-virtual applied slice for the same query. In remote virtual mode, range eviction is not deletion and preserves the suspended session. When the key returns, equal relevant values resume the draft; changed values cancel with `data-change`.

## Applied edit state and validation generations

Every async validation belongs to one session generation. Cancel, parent `editState` replacement, data change, semantic query change, accepted grouping change and destroy invalidate that generation. Late results are ignored and cannot revive a session, emit a commit or write errors into another session.

A parent `editState` write always wins. Changing or clearing the target destroys or replaces the prior private session without `editStateChange` echo and without a domain event merely because of the parent write.

## Query, layout and grouping transitions during editing

Every accepted semantic change of search, filter, sort, page or pageSize cancels editing once with the existing `consumer` reason, after invalidating pending validation. A rejected proposal or a semantically equal reconstructed query preserves editing and emits no echo.

Resize, pin/unpin, reorder and column-object reconstruction preserve editing by `column.id`. Hiding or removing the active edited column cancels once with `consumer`. A rejected grouping proposal preserves editing; an accepted applied grouping change cancels it once with `consumer`.

Expansion changes do not cancel editing by themselves. Only an independently applicable data, layout, query, grouping or session rule can cancel the session.

## Virtual editing

Scroll and window recycling never commit or cancel an edit. When the edited row leaves the render range, its editor DOM may unmount while the private session, draft and valid validation state become suspended/offscreen. No synthetic blur is interpreted as commit. Returning under the same applied query and valid baseline reconstructs the editor from the draft, not from source data.

Offscreen editing retains no DOM reference and does not force the viewport to keep the row mounted. Returning onscreen does not steal focus unless an explicit focus operation is pending. No polling is permitted.

## Expansion under virtualization

Row expansion and fixed-height virtualization are incompatible in P1. Virtualization wins. While `virtualizationOptions.enabled` is true, NeuTable renders no expansion controls or details, emits no `expandedKeysChange` gesture, and does not modify applied `expandedKeys`, query or requests. A deterministic development/test diagnostic is issued once when expansion is configured or applied.

When virtualization becomes false, the current parent-owned `expandedKeys` are rendered directly, without restoration state or automatic proposal. No variable-height measurement, detail observer, offset map or assumed detail height is allowed.

## Non-virtual expansion

Non-virtual expansion uses exact `K`, immutable controlled proposals, accept/reject semantics, the frozen `RowDetail` template context, a native toggle button, applied-state `aria-expanded`, stable `aria-controls` where applicable, correct native-table `colspan`, SSR/hydration-safe deterministic markup and the existing interaction boundary.

Expansion in remote non-virtual mode is presentation state only. It emits no transport request and defines no detail protocol.

## Grouping under virtualization

Grouping and virtualization are incompatible in P1 in both client and remote modes. Virtualization wins. No group nodes, collapse controls or grouping gestures render; no `groupingChange`, query mutation or request is emitted; applied grouping remains untouched. A deterministic development/test diagnostic is issued once when grouping is active. Disabling virtualization renders the current applied grouping directly.

Because grouping and expansion are inactive under virtualization, N2-011G logical indexes, spacers, `aria-rowindex`, `aria-rowcount`, `dataRange` and request ranges remain unchanged.

## Non-virtual grouping pipeline

Client grouping runs over domain rows after search, filter and stable sort, using the frozen grouping hook/order, and before final pagination/presentation. It never mutates `T`, adds metadata to rows or implicitly changes query sort.

Remote non-virtual grouping with `scope:'loaded'` literally groups only domain rows in the current applied `data` slice/page. Groups, counts and aggregates describe loaded members only, may be incomplete at slice boundaries, never fetch adjacent slices and never imply backend-global membership.

## Private render nodes and group identity

Grouping projection may create private discriminated group and domain-row nodes. Group nodes are not `T`, have no business `K`, never pass through `rowKey`, editing, selection, all-matching, exclusions, remote `dataRange` or request ranges.

Group IDs are deterministic from the approved grouping path, canonical value and configuration, never indexes, random UUIDs or timestamps. Reconstructed rows with equal grouping values preserve group identity.

## Group collapse, filtering, sorting and selection

Group collapse is controlled through applied `grouping.expandedGroupIds` and `groupingChange`. Rejected proposals leave the DOM unchanged; accepted input updates projection once without `queryChange`.

Search/filter operate on domain rows before group generation; empty groups do not render. Sorting remains exactly the applied query sort and grouping adds no hidden sort. Synthetic group rows are never selectable or editable. Header/range selection operates on domain rows only, and group controls use the existing interaction-stop boundary.

## Expansion with grouping

Non-virtual expansion may coexist with grouping. Expansion remains attached to a domain row `K`; group headers cannot use `expandedKeys`. The detail row renders adjacent to its domain row inside the group projection.

## Native semantics and accessibility

Non-virtual group headers use native `<tr>` with appropriate header/cell `colspan`, an accessible label and a native toggle when collapsible. No synthetic virtual row index is added. Expansion toggles are native buttons whose ARIA reflects applied state only. Editors expose accessible names, invalid/pending/error relationships and explicit save/cancel behavior while preserving multiline input semantics.

## SSR and hydration

SSR may render applied editing only when the target row/column exists and the editor is SSR-safe. It creates no browser focus or validation network activity. Hydration reuses deterministic markup, initializes the same applied session once, emits no duplicate proposal/domain event and never steals focus automatically.

For `virtual=true` plus applied expansion or grouping, SSR and browser both render virtualization only, preventing hydration mismatch while leaving parent inputs unchanged. An accepted semantic query after hydrated editing cancels once with no commit, late validation or `NG050x`.

## Effects, bundle and surface

The product effect budget remains request coordination plus viewport lifecycle. H adds no input-to-writable synchronization effect. A private optional editing loader may use the already-budgeted feature-loading boundary if measurement justifies it.

The public surface remains exactly 66 types, 15 directives, 24 inputs, 14 outputs and 4 methods. There is no new mode, resolver, lookup, output, directive, method, entrypoint or request channel.

## Required verification

Directed evidence must cover same-key reconstruction/source change/removal; stale async validation; rejected/accepted query and grouping changes; layout preservation and active-column disappearance; client and remote virtual offscreen editing; expansion/grouping virtual incompatibility and reactivation; remote loaded-only grouping; interaction boundaries; exactly-once transitions; SSR/hydration/zoneless; performance, bundle/root-unused, contracts, architecture, effects, symlinks, directed legacy regressions and build/package.
