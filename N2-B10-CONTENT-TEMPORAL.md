# N2-B10 — Content and temporal display

## Status and scope

**B10 PASS.** B4 passed its own directed, SSR/hydration, contract and bundle gates before B10 started. This identity covers only CodeBlock, Terminal, Timeline and TimelineGrid. SchedulerGantt was already physically removed; no compatibility runtime or new scheduler behavior was added. B10 remains uncommitted for review.

| Facade       | Domain/applied owner                                                                                                        | Change                                                                                                                                                                                                                                                                                                                                          | Effects and resources                                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CodeBlock    | Consumer `code` and language/labels; copy feedback is ephemeral                                                             | Plain text interpolation remains safe; one click makes one Clipboard API request with the existing textarea fallback. Late clipboard completion cannot update a destroyed component. A polite success status announces copy feedback.                                                                                                           | 0 product effects; one existing document-language MutationObserver when available in browser; one bounded 2 s copy timer, both cleaned on destroy. No server timer. |
| Terminal     | Consumer owns `output`; component owns its local command/draft/history session and optional local `response`/`appendOutput` | Applied output is projected in a computed transcript, never copied to a persistent writable mirror. Local command positions retain chronological interleaving. Reconstructed output replaces presentation without echo. `clear()` clears local session entries, not consumer-applied output. Enter/Arrow history ignore active IME composition. | 0 effects, 0 global listeners/observers/timers; destroy-guarded scroll microtask.                                                                                   |
| Timeline     | Consumer owns ordered events; `reverse` is presentation only                                                                | Semantic `ol/li`, template contexts, tone/density and authored order retained. Optional stable `id` avoids duplicate-title tracking collisions; visual index is the fallback. No implicit sorting or timezone conversion.                                                                                                                       | 0 effects/listeners/observers/timers.                                                                                                                               |
| TimelineGrid | Consumer owns columns, rows, selected item/slot                                                                             | Item and slot buttons emit domain/proposal events once; selected state remains input-applied. Valid item projection is computed once per applied rows/columns rather than filtered every render. Span is bounded to the supplied time scale.                                                                                                    | 0 effects/listeners/observers/timers; no SchedulerGantt edge.                                                                                                       |

## Temporal direction and accessibility

Timeline and TimelineGrid do not infer time from labels or mutate consumer data. Timeline's list order is the authored order, optionally reversed by its existing `reverse` input. TimelineGrid's column array is the authored time scale. Its CSS Grid places the first column at **inline-start**: left in LTR, right in RTL. This is the existing layout behavior, explicitly verified in Chromium; no array reversal or implicit change to time meaning was introduced. Grid events use native buttons and row+column accessible names. Timeline events remain nonfocusable list items unless consumer templates add interaction.

CodeBlock never uses `innerHTML`; SSR displays escaped code. The copy button has an accessible name and an empty-until-success polite status. Terminal uses a native text input and plain-text log output; composition Enter cannot submit an uncommitted command. No new URL, storage, Router or service owner was introduced.

## Public contract and migration delta

The official snapshot was regenerated for real changes: `NeuTimelineItem.id?: string | number`, readonly applied Timeline/TimelineGrid collection inputs, and Terminal's derived `entries` projection. There is no new entrypoint, input, output or method. `NeuTerminalComponent.clear()` now leaves parent-owned `output` visible; the consumer must replace its applied output with `[]` to clear that domain data. Local command history remains local. No compatibility alias for removed SchedulerGantt was added.

## Gates

- Directed `test:n2-b10`: **4 files, 65/65 PASS**. Covers copy/fallback/late completion and status, Terminal ownership/chronology/IME, Timeline duplicate titles and immutable reordering, TimelineGrid applied selection/RTL/bounded spans, and representative stable-node fixtures.
- Real Angular 22 zoneless Chromium SSR/hydration: **PASS** for all four public entrypoints. DOM reused, 0 NG050x, no initial outputs, escaped code, first copy once, first committed terminal command once after IME, RTL temporal order and item/slot proposals once. Temporary fixture removed in `finally`.
- Representative performance/identity checks: 100 Timeline events and a 100-row/500-event, 12-column TimelineGrid retain item DOM across presentation-only writes. Valid item lists are cached per applied rows/columns; no per-event effect or observer. No browser speed claim or hard timing threshold is inferred.
- Production build, official contract snapshot/audit, contract tests, icon boundary, published-package audit, package verification, 98 public imports, 98 SSR imports and portfolio generation/drift: **PASS**. Shared full library suite with coverage disabled after the B4 two-host fix: **182 files, 2,469/2,469 PASS**. The default coverage-threshold debt remains pre-existing and was not rerun or changed.

Built-FESM bundle audit (Angular/CDK/RxJS externalized; values per consumer, not additive):

| Consumer     |    Raw |  Gzip | Brotli |
| ------------ | -----: | ----: | -----: |
| CodeBlock    | 17,134 | 3,400 |  2,881 |
| Terminal     | 11,642 | 2,748 |  2,366 |
| Timeline     | 15,311 | 2,382 |  2,007 |
| TimelineGrid | 20,071 | 3,074 |  2,609 |
| Combined B10 | 64,073 | 9,490 |  8,120 |
| Root unused  |  **0** |    20 |      1 |

## Risks and recommendation

TimelineGrid currently treats column labels/IDs as a consumer-authored scale, not parsed dates; callers are responsible for chronological ordering. Terminal's `response` input remains a local append channel for compatibility with its current public contract, while the `output` input is authoritative for externally supplied lines. The historical global coverage and N2-021 Panel contract-gate debts remain outside B10. No B6 or C batch was started.

**B10 CERTIFIED — READY FOR SHARED B4+B10 GATES.**
