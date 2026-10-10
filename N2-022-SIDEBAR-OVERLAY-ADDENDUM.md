# N2-022 — Sidebar overlay normative addendum

This addendum resolves the only design stop found before implementing N2-022. It does not reopen the collapse decisions certified in N2-021.

## Controlled overlay ownership

- `open: boolean` is the sole applied overlay state and defaults to `false`.
- `closeRequested: NeuCloseRequest` is the sole close intent/proposal channel.
- `opened` and `closed` are lifecycle outputs emitted only for completed post-initialization overlay transitions.
- `persistent` is applied presentation mode. Persistent Sidebar is always presented and does not use overlay dismissal, focus-trap, or scroll-lock behavior.
- `collapsed`/`collapsedChange` and `initialCollapsed` retain their N2-021 semantics.

There is no `openChange`, `initialOpen`, internal open owner, optimistic transition, compatibility alias, or runtime adapter.

## Lifecycle

Initial render, SSR, and hydration emit no `opened`, `closed`, or `closeRequested`. In overlay mode, an applied `false → true` transition emits `opened` once after the overlay is operational. An applied `true → false` transition emits `closed` once after teardown has begun and focus restoration has been scheduled according to the existing lifecycle contract.

A rejected `closeRequested` leaves applied `open=true`, retains resources, and emits no `closed`. Changing `persistent` never mutates `open`: overlay-to-persistent ends the overlay lifecycle without a close intent, while persistent-to-overlay with applied `open=true` starts a new overlay lifecycle.

## Dismissal

Escape emits one `closeRequested` with reason `escape`, outside interaction emits reason `outside`, and an internal close action emits reason `action`. Sidebar does not retain an imperative close method merely to emit `programmatic-command`.

Nested overlays use top-overlay ownership: a child overlay prevents dismissal from cascading to the Sidebar below it.

## URL, storage, and methods

`urlParam`, `NeuUrlStateService`, Router ownership, URL ownership, storage ownership, and imperative `open`/`close`/open-toggle methods are removed from Sidebar. URL and storage synchronization belong to consumer state:

`URL/storage → consumer state → [open]`, and `closeRequested → consumer decision → URL/storage update → [open]`.

Parent writes, including back/forward navigation, never echo a close proposal.
