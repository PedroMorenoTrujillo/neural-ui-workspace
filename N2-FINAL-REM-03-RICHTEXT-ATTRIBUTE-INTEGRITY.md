# N2 — Final Remediation 03: RichTextEditor attribute integrity

## 1. Result

**RICHTEXT IA-01 REMEDIATION — CERTIFIED.** The exact safe-attribute counterexample now retains its browser meaning through sanitization, server render, hydration and three native input cycles. This certifies the explicit REM-03 contract and tests below; it does not reopen the independent audit's P2/P3 findings.

## 2. IA-01 reproduction before

Checkpoint `df03ac0e7f04550eb423f69a23bbaa45fa327faf` on `v2`. Added the exact regression case before editing runtime. The first directed run failed: 1 file, 12 tests, **1 failed / 11 passed**. Actual `anchor.href` was `https://example.test/?a=1&amp;b=2`; expected `https://example.test/?a=1&b=2`. The existing 11 tests remained green.

## 3. Root cause

`sanitizeAttributes` previously captured HTML source attribute text and sent it directly to `escapeRichTextAttribute`. Encoded `&amp;` therefore became `&amp;amp;`; each subsequent sanitize pass added another `amp;`. The browser then parsed a query parameter named `amp;b` instead of `b`. This is the IA-01 runtime defect documented in `N2-FINAL-INDEPENDENT-AUDIT.md` §47.

## 4. Test-first proof

The initial test contains `<a href="https://example.test/?a=1&amp;b=2"\n   title="A &amp; B">link</a>`. It asserts actual DOM `anchor.href`, `title`, query parameters `a` and `b`, and `sanitize(sanitize(input)) === sanitize(input)`. It failed against HEAD before the implementation patch and passed only after it.

## 5. Attribute parsing

Only the private attribute path in `projects/ui-core/rich-text-editor/neu-rich-text-editor.utils.ts` changed. The existing tag/attribute parser, allowlists, blocked-content removal and text-node handling remain in place. Captured raw attribute source is decoded once before existing URL/image/size validation; accepted semantic values are serialized through the existing attribute escaper.

## 6. Entity decoding semantics

The private deterministic decoder recognizes `&amp;`, `&quot;`, `&lt;`, `&gt;`, `&apos;`, decimal numeric references, and hexadecimal references with `x` or `X`. Its one-pass replacement does not recursively collapse `&amp;amp;`: that source denotes a literal semantic `&amp;`, and the canonical output remains `&amp;amp;` on future passes. Numeric zero, surrogate and out-of-range code points become U+FFFD. No DOM, DOMParser, temporary element or browser API is used by the decoder.

## 7. Security validation order

The order is raw attribute source → one semantic decode → existing `isSafeHref`/`isSafeImageSource` and other attribute checks → one canonical escape. Unit cases show `javascript&#58;alert(1)`, `javascript&#x3A;alert(1)` and uppercase-X hex remain blocked for links and images. A valid `https&#58;//` URL is accepted only after decoding and remains canonical on a second pass.

## 8. Canonical escaping

The existing `escapeRichTextAttribute` serializes `&`, quotes, `<`, `>`, apostrophes and backticks for the double-quoted HTML context. The decoder does not preempt or bypass it. Safe entities become one canonical escaped representation, preserving browser attribute properties rather than source byte spelling.

## 9. Idempotence

The pure regression matrix asserts `once = sanitize(input)`, `twice = sanitize(once)`, and `third = sanitize(twice)`, with `twice === once` and `third === once` for the supported safe URL forms. The literal `&amp;amp;` source-layer test proves that canonicalization does not recursively decode a deliberate literal entity.

## 10. Named href entity

`href="https://example.test/?a=1&amp;b=2"` becomes canonical HTML containing `a=1&amp;b=2`; the DOM URL has keys `a,b` and `searchParams.get('b') === '2'`.

## 11. Decimal href entity

`&#38;` has the same DOM URL and query parameters. Decimal `&#58;` in an otherwise safe `https` scheme is validated after decoding.

## 12. Hex href entity

`&#x26;` and `&#X26;` preserve `b=2`. Lowercase and uppercase hexadecimal markers are explicit tests.

## 13. Title

`title="A &amp; B"` yields `anchor.title === 'A & B'`. A separate case covers quote, `<`, `>`, and apostrophe references in the allowed title attribute.

## 14. Other textual attribute

The allowed image `alt="A &amp; B"` yields DOM `image.alt === 'A & B'`; its source is validated and escaped by the same private path.

## 15. Encoded unsafe protocol

Encoded-colon `javascript` URL cases remain rejected. Existing script tag, event-handler attribute, blocked URL and paste security tests also pass. No URL allowlist was relaxed, no sanitizer bypass was added, and no third-party HTML parser was introduced.

## 16. Link insertion

The existing `addLink()` escapes the semantic prompt value while constructing an HTML snippet. `insertHtml()` then sanitizes it. The new one-layer decode means the final canonical output has one escape, even when the prompted link has `&` query separators. A directed component test inspects the inserted anchor's real DOM URL and confirms no `&amp;amp;` in the emitted value. This construction escape is still needed to prevent a quote in user input from becoming a new HTML attribute.

## 17. Applied value

A parent-applied entity-bearing link renders with the correct `href` and `title`. Its original value remains unchanged; `valueChange` emits **zero times** on the parent write. A subsequent native input emits once and produces a canonical value that remains idempotent.

## 18. Browser innerHTML roundtrip

The dedicated real Chromium fixture uses a built `@neural-ui/core/rich-text-editor` entrypoint in an Angular 22 zoneless consumer. It captures the server HTML, hydrates the page, edits the contenteditable surface, lets the control read actual browser `innerHTML`, and inspects `anchor.href`, `anchor.title` and `new URL(anchor.href).searchParams`. After the first input, `a=1`, `b=2` and `A & B` remain intact.

## 19. Repeated edit cycles

Three successive browser input cycles each append harmless text and reapply the emitted canonical HTML through the consumer. Each emits exactly one value, leaves the anchor's semantic URL/title unchanged and keeps its serialized `href`/`title` attributes stable. No progressive entity growth occurs.

## 20. Exact auditor counterexample

For `<a href="https://example.test/?a=1&amp;b=2"\n   title="A &amp; B">link</a>`, first canonical output has `&amp;`, not `&amp;amp;`. Second sanitization is byte-identical to the first. Real Chromium reports query keys `a,b`, `get('b') === '2'`, and title `A & B`.

## 21. SSR

The fixture performs an actual Angular `renderApplication` of the package consumer. The server HTML has hydration annotations, `href="https://example.test/?a=1&amp;b=2"` and `title="A &amp; B"`; it contains no `&amp;amp;` and has zero initial value events. The sanitizer uses no browser-only decoder.

## 22. Hydration

JavaScript loads after capturing SSR nodes. Angular reuses the `main`, `neu-rich-text-editor` host and contenteditable surface. The child anchor generated by `[innerHTML]` is replaced during Angular's HTML binding reconciliation; this is recorded by the fixture rather than claimed as reused. Its semantic URL/title is unchanged, the value output remains empty at hydration, and Chromium reports zero NG050x or unexpected page errors. The first post-hydration input emits once and preserves the URL.

## 23. Zoneless

Server and browser consumer use `provideZonelessChangeDetection()`. No Zone.js, manual `detectChanges`, timing workaround or new effect was introduced.

## 24. Security regression

All previous RichTextEditor security cases passed alongside the new encoded-protocol tests. The same blocked tags, handlers, URL policy and image-source policy remain. The change addresses value integrity within permitted attributes and does not claim a new comprehensive HTML security certification.

## 25. Forms regression

The specialized-forms matrix and validation specs run with the two RichText specs: **4 files, 31/31 tests PASS**. Existing `model()`/Signal Forms interoperability remains, and `audit:forms` plus `test:n2-forms-types` pass. No CVA/provider, public form type or second value owner was added.

## 26. Directed tests

Before: RichTextEditor 1 spec, 11 existing tests; the new test failed as 11/12 passed. After: RichTextEditor component plus sanitizer specs, **2 files, 25/25 PASS**. With the two specialized form specs, **4 files, 31/31 PASS**. New explicit cases cover named/decimal/hex URL separators, title/alt, one-layer decoding, idempotence through three sanitizations, encoded unsafe protocols, applied writes, insertion and component input. Browser-only assertions are in the dedicated real Chromium fixture.

## 27. Full suite

`npm test -- --no-coverage`: **188/188 files, 2,514/2,514 tests PASS**. Previous independent audit baseline: 187 files, 2,500 tests. The delta is one new pure spec and 14 new tests; no old tests were removed. No global coverage run or threshold change.

## 28. Build/package

`npm run build` PASS. `npm run verify:package` PASS, 431 files. `npm run audit:contracts` PASS, 97 entrypoints and unchanged aggregate public counts. `npm run test:imports` PASS for 97 imports; `npm run test:ssr-smoke` PASS for 97 SSR imports. `audit:forms` and N2 forms type checks PASS. The independent Angular SSR/Chromium hydration fixture PASS.

## 29. Bundle

The existing forms bundle harness compared the built package at HEAD against the current candidate. RichTextEditor entry FESM: **49,340 → 50,053 B raw**, **7,838 → 8,066 B gzip**, **6,651 → 6,863 B Brotli**. RichTextEditor consumer: **68,499 → 68,839 B raw**, **12,037 → 12,211 B gzip**, **10,269 → 10,404 B Brotli**. Thus the consumer delta is **+340 B raw / +174 B gzip / +135 B Brotli**. Dependencies are identical; root-unused remains 0 B raw in that harness. The independent audit's IA-02 root-unused harness limitation is unchanged and is not newly declared resolved here.

## 30. Public API

Only private utility logic and tests/fixture changed. The RichTextEditor component declaration, `public_api.ts`, input/output/method/type surface, package exports and generated contracts were not edited. Public contract audit PASS.

## 31. Git diff/status

Branch `v2`, starting HEAD `df03ac0e7f04550eb423f69a23bbaa45fa327faf`. REM-03 changes are the private RichText utility, its component spec, one new utility spec, this report and one focused SSR/hydration fixture script. No unrelated product file, config, snapshot or threshold was changed. Changes remain **unstaged and uncommitted** for review. `git diff --check` PASS; zero new/versioned symlinks; no fixture temporary directory remains. Foreign `projects/ui-core/tree-table/public_api 2.ts` remains untracked and byte-identical at SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`. No push, tag, release or npm publication.

## 32. Remaining risks

This is a targeted entity-decoder repair. It supports the named references required by REM-03 plus decimal/hex numeric references, not the entire HTML5 named-entity catalog or every browser's semicolonless recovery rule. Inputs using other named references need a separate contract and bundle assessment before claiming full HTML parser equivalence. The inner anchor under Angular `[innerHTML]` is reconciled on hydration, while the host/surface remain reused without NG050x or semantic change. Pre-existing coverage, strict ATTW, Showcase, cross-browser and IA-02/03/04/05 debts remain as recorded in the independent audit.

## 33. Recommendation

**RICHTEXT IA-01 REMEDIATION — CERTIFIED.** The concrete P1 counterexample and all explicit REM-03 gates pass with a private, dependency-free, scoped change. Leave the diff for review; do not commit or start another phase without authorization.
