# H2-B state ownership map

This record defines the state contracts for the H2-B component batch. It is
intentionally internal: no public API is removed by this work.

## Calendar

| Slice                                         | Before                                           | Contract after H2-B                                                                                                                                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selectedDate` / visible period               | input copied to local signal and changed locally | **Proposal/echo**. `selectedDate` initializes and reconciles the local date projection; user selection updates that projection and emits `selectedDateChange` once. Input reconciliation and reset are silent. |
| calendar grid, labels, agenda, event grouping | mixed input/signal reads                         | **Derived** from the canonical projected date, locale, timezone, events, and view.                                                                                                                                                                                              |
| event collection                              | input                                            | **Consumer-owned**, normalized in a computed value only.                                                                                                                                                                                                                        |
| focus / button interaction                    | DOM                                              | **Ephemeral**.                                                                                                                                                                                                                                                                  |

The temporal foundation remains the initial source for an absent/invalid date and
for Today; date-only values remain local calendar dates.

## Carousel

| Slice                                                    | Before                  | Contract after H2-B                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page` / `initialPage`                                   | input copied to `_page` | **Proposal/echo**. `page` is authoritative when it changes; otherwise `initialPage` initializes the internal projected page. User, keyboard, swipe, and autoplay transitions update one local projection and emit one `pageChange`. Input reconciliation is silent. |
| responsive counts, page count, first item, visible items | effect plus reads       | **Derived** from inputs, viewport, and projected page.                                                                                                                                                                                                              |
| viewport width                                           | browser listener        | **Ephemeral UI state**.                                                                                                                                                                                                                                             |
| autoplay interval handle                                 | timer                   | **Ephemeral UI state**; it advances the canonical page transition and is destroyed deterministically.                                                                                                                                                               |

## Gallery

| Slice                                                        | Before                       | Contract after H2-B                                                                                                                                                            |
| ------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `activeIndex` / `initialIndex`                               | input copied to local signal | **Proposal/echo**, equivalent to Carousel but scoped to an item index. Reconciliation and bounds correction are silent; user navigation emits one `activeIndexChange`.         |
| active item, navigation affordances, contexts, download name | local and input reads        | **Derived**.                                                                                                                                                                   |
| preview visibility                                           | local signal                 | **Internal**; programmatic preview operations emit `previewChange` by established API.                                                                                         |
| zoom, rotation, flip                                         | local signals                | **Internal** transform state, reset when the active item or preview lifecycle changes.                                                                                         |
| swipe                                                        | DOM/local values             | **Ephemeral UI state**.                                                                                                                                                        |
| preview focus lifecycle                                      | shared modal-focus directive | **Ephemeral**. Gallery establishes the supplied opener as the interaction origin (including WebKit pointer activation); `NeuModalFocusDirective` captures/restores it, selects initial focus, and delegates Escape; `NeuFocusTrapDirective` owns containment. |

## Nav

| Slice                     | Before                                                  | Contract after H2-B                                                                                                                                |
| ------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `collapsed`               | `linkedSignal` copied from input and locally overridden | **Proposal/echo**. Input changes silently reconcile the rendered projection; a user toggle changes the projection and emits one `collapsedChange`. |
| open groups               | local set                                               | **Internal**.                                                                                                                                      |
| flyout position and timer | local signal/timer                                      | **Ephemeral UI state** independent of collapsed-state ownership.                                                                                   |
| active route              | router signal                                           | **Derived**.                                                                                                                                       |

## Kanban

| Slice                                  | Before                              | Contract after H2-B                                                                                                                                                                                                                                                       |
| -------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| columns/cards                          | deep input clone and local mutation | **Optimistic proposal/echo projection**. The consumer input is canonical; input replacement reconciles the projection silently. A drop creates fresh column/card-array containers, preserves domain-card object identity, and emits one `columnsChange` / one `cardDrop`. |
| drag source, target and drop operation | CDK event                           | **Ephemeral UI state**.                                                                                                                                                                                                                                                   |

Consumer rejection is represented by supplying a replacement board; a consumer echo
or a modified concurrent board replaces the projection atomically.

## DashboardGrid

| Slice                                    | Before                            | Contract after H2-B                                                                                                                                                 |
| ---------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tile layout/order                        | input array copied to local array | **Optimistic proposal/echo projection**. Input replacement is the canonical reconciliation path. Drop creates a fresh order container and emits `orderChange` once. |
| column count                             | input                             | **Consumer-owned** layout configuration.                                                                                                                            |
| drag state and projected-node attachment | CDK/DOM                           | **Ephemeral UI state** / external imperative synchronization.                                                                                                       |

## SpeedDial

| Slice                         | Before                                  | Contract after H2-B                                                                                                                                                                                                                   |
| ----------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `visible`                     | `model()` plus manual visibility output | **Controlled/two-way model**. `visibleChange` generated by `model()` is canonical. `onVisibleChange` is a compatibility alias for user transitions; `onShow` and `onHide` are lifecycle events. Programmatic model writes are silent. |
| focused action                | local signal/controller                 | **Ephemeral UI state**.                                                                                                                                                                                                               |
| resolved actions and geometry | computed                                | **Derived**.                                                                                                                                                                                                                          |
| closed action menu            | visually hidden menu                     | **Inactive accessibility state**. The closed `aria-hidden` menu is also `inert`, preventing hidden descendants from remaining programmatically focusable.                                                                            |

## Future interaction adoption ledger

- Kanban: adopt the accessible keyboard DragDrop foundation after H2-A supplies
  it.
- DashboardGrid: adopt the same accessible DragDrop foundation after H2-A
  integration.

## Public compatibility ledger

- Calendar `selectedDateChange`: canonical proposal event; the duplicate
  `dateSelect` compatibility mirror was removed in N2-022.
- Carousel `pageChange`, Gallery `activeIndexChange`, and Nav `collapsedChange`:
  canonical proposal events; their input values retain proposal/echo behavior.
- Kanban `columnsChange` / `cardDrop` and DashboardGrid `orderChange`: canonical
  optimistic-proposal events.
- SpeedDial `visibleChange`: canonical; `onVisibleChange`: compatibility alias,
  keep in H2 and consider deprecating only in a major release. `onShow` and
  `onHide` remain lifecycle events.
