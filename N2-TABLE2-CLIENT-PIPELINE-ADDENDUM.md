# N2 — Table 2 client pipeline normative addendum

**Checkpoint:** N2-011C

**Status:** APPLIED

**Date:** 2026-09-20

This addendum resolves the N2-011C design review and is normative for the private client pipeline. It supersedes earlier one-based pagination wording without changing the frozen public symbol count.

## Filter contract

`NeuFilterConstraint.rule` is the closed inline union `equals | notEquals | contains | notContains | startsWith | endsWith | lessThan | lessThanOrEqual | greaterThan | greaterThanOrEqual | between | in | notIn | isNull | isNotNull | isEmpty | isNotEmpty`. `NeuTableFilterColumn.rules` and `defaultRule` reference that property type. No new exported type is introduced; the target remains 66 types.

- `equals` is exact for strings, booleans and bigints, uses `Object.is` for numbers, and uses identity for dates, arrays and objects. `notEquals` is its negation.
- Text operators accept strings only and normalize with NFKC, trim, whitespace collapse and non-locale lowercase. Invalid operands return `false`; `notContains` negates only valid operands.
- Ordering accepts compatible same-type numbers, bigints or strings without coercion. `between` is inclusive and requires exactly two compatible bounds.
- `in` requires an array and uses equality semantics. Invalid `in` returns `false`; `notIn` is its logical negation.
- `isNull` matches `null` and `undefined`. `isEmpty` matches a normalized empty string or empty array, but not nullish values; `isNotEmpty` is the inverse over non-null values.
- An unknown runtime rule returns `false` and never mutates, throws or rewrites query state.

## Search and field resolution

Search applies NFKC, trim, whitespace collapse and lowercase to one full substring. Blank search is inactive. Only `filterOptions.globalFields` participate. Supported values are string, number, bigint and boolean; dates, objects and arrays are not stringified.

Search, filter and sort use one private resolver. A column accessor wins even when it returns a falsy or nullish value; otherwise resolution is a literal direct property read. Dot paths are never traversed implicitly.

## Sort

Custom `column.sort.compare` wins. Default ordering supports boolean, number, bigint, string and valid `Date`, with deterministic category order. Direction reverses only comparable valid values. NaN, invalid dates and unsupported objects remain after valid values and before nullish values in either direction. Null and undefined are always last. The decorated sort uses original source index as the final stable tie-breaker; multi-sort is one lexicographic comparator. Duplicate fields keep their first entry and single mode evaluates only the first applied entry.

## Pinned rows, pagination and remote mode

Pinned rows are presentation, not query membership. Source data is partitioned into start, normal and end. Search, filter, sort and pagination run only over normal rows, then the result is recombined as `start + page(normal) + end`. Pinned rows remain visible, retain source order, do not consume `pageSize`, and are excluded from source-normal, matched-normal and page-normal counts.

Page is zero-based. Finite values normalize with `max(0, floor(page))`; page size uses `max(1, floor(pageSize))`. Non-finite values become 0 and 1 respectively. Out-of-range pages return an empty normal page and never clamp or emit a rewritten query.

Remote mode bypasses all client search, filter, sort and pagination while retaining pinned presentation. Parent input writes emit neither `queryChange` nor `dataRequest`.

## Ownership and implementation boundary

`query` remains the only applied owner. Normalization is derived evaluation only. There is no mirror state, writable query copy, effect, proposal coordinator or query UI in N2-011C. The engine is private framework-free TypeScript; the Angular facade consumes it through `computed` stages.
