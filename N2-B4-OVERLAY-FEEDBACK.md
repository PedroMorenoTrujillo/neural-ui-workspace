# N2-B4 — Overlay feedback

## Status and scope

**B4 PASS — ready for B10.** This identity covers BlockUI, ConfirmDialog, ConfirmPopup and NotificationCenter only. Starting checkpoint: `791208b` (`feat(navigation): complete B1 and B3 medium wave`). No B4 commit, push, tag or release was made.

| Facade             | Applied/domain owner                                                                                      | Close/lifecycle                                                       | Focus and resources                                                                                                                                        | Result                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BlockUI            | Consumer `blocked` input                                                                                  | No dialog close protocol                                              | One existing DOM-only effect manages sibling `inert`, restores original inert state on unblock/destroy                                                     | Kept as a blocking surface, not a fabricated modal dialog or input mirror                                                                                     |
| ConfirmDialog      | CDK Dialog service session                                                                                | CDK result `true/false`; Escape/backdrop cancel                       | CDK focus trap, initial/return focus, backdrop and overlay                                                                                                 | Added per-instance settlement guard: repeated accept/reject cannot close/invoke the same session twice                                                        |
| ConfirmPopup       | Declarative `open` input **or** service-owned confirmation session                                        | Existing `accepted`/`rejected` intents; service promise resolves once | Anchored local panel; modal-focus entry/Escape/return without a nonmodal focus trap; one Angular-managed document pointer listener and one resize listener | Outside dismissal uses the same reject path. Rejected declarative close leaves the applied panel open; a service action closes only an active service session |
| NotificationCenter | Singleton service owns history, read flags and dismissal timers; component owns ephemeral CDK panel state | Local backdrop/Escape/toggle close; no duplicate Toast owner          | CDK reposition/backdrop, focus entry/return, one bounded mark-read timer, service-owned auto-dismiss timers                                                | Browser-only auto-dismiss timers, immutable read updates, static per-icon imports and typed optional consumer icon name                                       |

## Contract and accessibility decisions

No new input, output, method or entrypoint was introduced. ConfirmDialog and ConfirmPopup retain their existing service/session contracts; `closeRequested` was **not** added to a facade whose current public contract does not expose it. In ConfirmPopup, `open=true` remains consumer-applied: an outside/Escape reject is an intent, not a hidden local close. The service path is a separate ephemeral confirmation session routed to exactly one mounted host by a private injector-scoped registry; consumers should not combine both modes on the same host. ConfirmDialog remains modal (`alertdialog`/CDK), ConfirmPopup remains anchored and nonmodal (`aria-modal=false`, no trap), BlockUI remains a blocking surface, and NotificationCenter remains persistent history rather than Toast.

The only real public declaration change is `NeuNotification.icon?: NeuralIconName` instead of arbitrary glyph text. Defaults are private icon definitions by tone; the optional consumer name uses its registered neural-icons symbol. The bell and remove affordance use direct per-icon imports. The official contract snapshot was regenerated, and the icon boundary passes. Notification dismiss buttons include the corresponding message/title in their accessible name; unread count remains in the bell label without a noisy list-wide live region.

## Exactly-once and lifecycle

ConfirmDialog rejects a second accept/reject after settlement. ConfirmPopup routes action, Escape and outside gestures through one reject/accept method; document pointerdown ignores events inside the panel. Service supersession resolves a previous pending promise false. Destroying a non-owning host leaves the session intact; destroying the active host transfers it to another mounted host, or resolves false if it was the last. The private registry is ephemeral host routing, not a second domain owner. Declarative rejection does not change `open`, and the retained modal-focus directive returns focus on physical panel removal. NotificationCenter's CDK backdrop and Escape close its one local panel; its 500 ms mark-read timer is cancelled on close/destroy. Service auto-dismiss timers are browser-only and cancelled on removal/clear/destroy. No Router, storage, global listener per item, or input-to-writable applied mirror was added.

## Gates

- Directed `test:n2-b4`: **4 files, 90/90 PASS**. Added coverage for repeated confirmation, outside dismissal, rejected declarative close/nonmodal focus, single service-host rendering/transfer and SSR timer absence; retained lifecycle, service, read/unread, focus and 100-cycle timer tests.
- Real Angular 22 zoneless Chromium SSR/hydration: **PASS**. BlockUI, applied ConfirmPopup, service ConfirmDialog and NotificationCenter are imported from public entrypoints; SSR DOM is reused, no initial output, 0 NG050x, first reject/confirm once, and no blocked sibling remains inert after parent unblocks. Two mounted ConfirmPopup hosts render exactly one service panel and resolve its first action once. The temporary fixture is removed in `finally`.
- Production build, official snapshot generation, `audit:contracts`, `test:contracts`, `audit:n2-icons-boundary`, published-package audit, `verify:package`, 98 public imports and 98 SSR imports: **PASS**. Shared coverage-disabled full suite after the two-host runtime fix: **182 files, 2,469/2,469 PASS**. The default coverage-threshold debt remains pre-existing and was not rerun or changed.

Built-FESM bundle audit (Angular/CDK/RxJS externalized; bytes are per consumer, not additive):

| Consumer           |    Raw |   Gzip | Brotli |
| ------------------ | -----: | -----: | -----: |
| BlockUI            |  7,538 |  1,879 |  1,563 |
| ConfirmDialog      | 14,214 |  3,363 |  2,882 |
| ConfirmPopup       | 28,291 |  7,421 |  6,539 |
| NotificationCenter | 33,146 |  7,328 |  6,453 |
| Combined B4        | 65,888 | 13,621 | 11,670 |
| Root unused        |  **0** |     20 |      1 |

The main internal cost is the CDK-dependent popup/notification shell; externalized CDK runtime is not included in those bytes. BlockUI remains small and contains no dialog machinery. No full icon catalog is retained.

## Risks and recommendation

The existing ConfirmPopup public surface permits declarative and service usage modes; simultaneous use on one host is not part of this batch's tested consumer pattern. Its one resize listener is Angular-managed and does not create a per-anchor observer. The historical global coverage threshold and N2-021 Panel contract-gate debt are outside B4 and were not modified. `git diff --check` and file-hygiene review are repeated at the shared checkpoint.

**B4 CERTIFIED — CONTINUE TO B10.**
