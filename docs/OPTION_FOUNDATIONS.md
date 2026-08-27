# Option interaction foundations

## Status and baseline

This document is the H4-A implementation contract for the shared mechanisms used by future Select-family migrations. H4-A starts from the exact H3 revisions:

- Workspace: `d92c53a76da649ab28653f0ab198bd0c04cf4e68`
- Showcase: `be9a33ae6bdf8d281f548d3d259b0b3931b5ad8e`
- Root: `b3eba71342b5601c4bc77a1ef5f4aff81ff903f8`

The foundations are internal support exported only through `ɵ`-prefixed symbols from `@neural-ui/core/option-api`. No new secondary entrypoint or supported consumer-facing controller API is introduced.

## Dependency direction

```text
pure option-api primitives
        ↓
internal interaction foundations
        ↓
future Select / Multiselect / AutoComplete / Listbox adapters
```

The interaction file imports only the existing option API and option normalization/navigation foundation. It has no component, root-barrel, Angular, CDK, Forms, Router, URL-state, or browser-global construction dependency.

## Responsibility map

### Existing option API — preserved

The existing layer remains responsible for accessors, labels, values, disabled state, identity/equality, groups, serialization, normalized option/group/loading rows, stable row IDs, locale-aware filtering, eligibility, navigation, reconciliation, typeahead lookup, lazy windows and requests, request sequencing, and template contexts. H4-A composes these primitives and does not duplicate them.

### Active-row controller — ephemeral UI state

`InternalNeuOptionActiveRowController` owns the current normalized-row index and optional stable domain key. It delegates boundary, next/previous, paging, eligibility, and logical reconciliation to existing primitives. Immutable row replacement preserves a keyed active option when possible; if it disappears or becomes disabled, the deterministic fallback is the first eligible row. With no prior active row, replacement stays inactive so component auto-focus policy remains local. Navigation returns an optional scroll request; it never selects or emits values.

### Typeahead controller — ephemeral UI state

`InternalNeuOptionTypeaheadController` owns only a printable-key buffer and retained timeout handle. It uses existing locale-aware typeahead lookup, collapses repeated characters for cycling, accepts readonly row replacement, and provides explicit idempotent disposal. The default is 500 ms because Select and Listbox already share that behavior; the internal timeout remains configurable so Multiselect can retain its 700 ms policy during migration. AutoComplete must not use this controller because query/completion is a different protocol.

### Connected overlay session — ephemeral UI state

`InternalNeuConnectedOverlaySession` tracks open/closed state, typed close reasons, interaction origin, focus-restoration intent, and one cancellable/coalesced frame refresh. It classifies outside interaction, Escape, and Tab without owning DOM listeners. Escape requests restoration to a still-connected origin; Tab closes without preventing normal focus movement. A pure geometry helper reports narrow-viewport width constraints and above/below collision data, while frozen connected-position data can be adapted to CDK positions.

The session does not own CDK overlay creation, focus calls, modal focus policy, option state, selection, filter state, or component ARIA roles. Components decide placement preference, close consequences, and whether a returned focus intent is applied.

### A11y presentation — derived state

Pure helpers derive a non-stale active descendant, logical `aria-posinset`/`aria-setsize`, result counts, and structured announcement metadata. Group and loading rows never claim option positions. Components retain markup, roles, labels, translations, and live-region wording.

## Policy that remains local

The foundations never own selection or CVA values; chips or select-all; completion, `forceSelection`, or custom text; filter/query ownership; consumer suggestions; Listbox reorder/range selection; templates; lazy request sequencing; URL state; disabled/readonly component policy; hover activation; `autoOptionFocus`; `focusOnHover`; `selectOnFocus`; editable behavior; or focus-follows-selection semantics.

## Future consumer map

- H4-B Select: active row, typeahead, overlay session, A11y derivation.
- H4-B Multiselect: active row, configurable 700 ms typeahead, overlay session, A11y derivation.
- H4-C AutoComplete: active row, overlay session, A11y derivation; never shared typeahead.
- H4-C Listbox: active row, typeahead, A11y derivation; never overlay session.

The shared files in `projects/ui-core/option-api/**` and this document are frozen after H4-A. Parallel migration batches consume them through `@neural-ui/core/option-api` and must not edit them concurrently.
