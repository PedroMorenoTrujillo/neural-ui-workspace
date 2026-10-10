# N2-C1 — Media consolidation: original design review and final certification

**Final status: C1 COMPLETE — READY FOR C2.** No C1 commit was created.

The original STOP evidence in §§1–41 is preserved below as a historical checkpoint. The normative resolution and final execution are recorded in §§42–52; those sections supersede the earlier *pending* statements.

## 1. Status

**C1 NEEDS DESIGN REVIEW.** The mandatory source/spec/contract inventory found material public-policy conflicts before runtime work. No Gallery, ImageGallery or ImageViewer runtime, tests, contracts, package exports or portfolio files were changed in C1.

## 2. Starting checkpoint

B6 was verified and committed on `v2` as `e32260548c20bf2d1fa810a2ff100caaa3962060` (`feat(data-layout): complete B6 Neural 2 data layout`). Its 54/54 directed tests, Angular build, contracts, package, Chromium hydration, icon boundary, bundle root-unused 0 B, and portfolio drift passed. The prior complete library suite was 182 files / 2,482 tests. Only the pre-existing foreign untracked `projects/ui-core/tree-table/public_api 2.ts` remains outside this report.

## 3. Capability matrix

This matrix describes **actual current behavior**, not an approved target. `REVIEW` marks a public decision that must be frozen before implementation.

| Capability            | Gallery                                                                           | ImageGallery                                                         | ImageViewer directive / private overlay                              | Proposed disposition                                    |
| --------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- |
| Source model          | `NeuGalleryItem {src, alt, caption?}`; readonly items                             | `NeuImageViewerItem {src, alt?, caption?}`; mutable-array input type | string, item or item array; `alt?`                                   | **REVIEW** required vs optional `alt`, source identity  |
| Thumbnail strip       | buttons; bottom or logical `start`; `showThumbnails`                              | buttons; bottom or physical `left`; `showThumbnails`                 | none                                                                 | MERGE with RTL-responsive policy review                 |
| Active index          | `activeIndex` input + local signal + `initialIndex`; optimistic controlled writes | local signal + `initialIndex`                                        | directive `neuIvIndex` seeds independent overlay index               | REDESIGN one applied/proposal policy                    |
| Previous/next         | bounded or `circular`                                                             | bounded only                                                         | bounded in overlay                                                   | KEEP Gallery's explicit circular policy                 |
| Counter               | always in preview, absent from main stage                                         | main-stage `showCounter` (default true)                              | always in overlay                                                    | **REVIEW** main-stage policy/API                        |
| Caption               | stage text or typed template; not in Gallery preview                              | stage text                                                           | overlay text                                                         | **REVIEW** preview caption and template policy          |
| Preview/lightbox      | fixed in-template modal backdrop                                                  | delegates to ImageViewer                                             | separate CDK overlay/dialog                                          | **REVIEW** single overlay engine and directive boundary |
| Zoom                  | 1..`maxZoom` (default 3), buttons                                                 | through viewer                                                       | 0.25..5, buttons and wheel                                           | **REVIEW** wheel/minimum/pan parity                     |
| Rotate/flip           | buttons and change events                                                         | none                                                                 | none                                                                 | KEEP Gallery behavior                                   |
| Download              | native anchor with `download`                                                     | none                                                                 | none                                                                 | KEEP native anchor; no network service                  |
| Media error           | `imageError` from main image                                                      | none                                                                 | none                                                                 | KEEP one bounded error path                             |
| Keyboard              | ArrowLeft/Right, Home/End; Escape via modal focus                                 | native buttons, viewer keyboard                                      | ArrowLeft/Right, Escape, +/- in overlay                              | REDESIGN one keyboard policy                            |
| Swipe/pointer         | 36px horizontal pointer-up gesture                                                | none                                                                 | mouse drag-to-pan, wheel zoom                                        | **REVIEW** pan and swipe coexistence                    |
| Templates             | typed item and caption directives                                                 | none                                                                 | none                                                                 | KEEP Gallery directives; preview use to decide          |
| Responsive            | scrolling thumbnails; logical CSS                                                 | left strip becomes row below 720px                                   | overlay layout                                                       | MERGE with explicit `start` semantics                   |
| Image loading         | `imageLoading` for main; lazy thumbnails                                          | no loading input                                                     | no loading input                                                     | KEEP Gallery policy                                     |
| Focus                 | shared trap/modal directives; return via modal focus                              | inherits viewer directive                                            | trap/modal directives; focuses opener                                | REDESIGN one deterministic focus boundary               |
| A11y                  | alt required, named controls, dialog                                              | alt optional, fallback thumbnail names                               | trigger role/button; dialog                                          | **REVIEW** required alt and names                       |
| SSR                   | modal absent until interaction; CDK scroll strategy injected                      | directive inactive until interaction                                 | overlay created only on open                                         | KEEP SSR-safe command boundary; real C1 gate pending    |
| Lifecycle             | two effects; pointer start state                                                  | one effect                                                           | overlay ref, escape subscription, transient window move/up listeners | REDESIGN one bounded engine                             |
| Icons                 | neural-icons per-icon subpaths                                                    | text chevrons; viewer icons                                          | neural-icons per-icon subpaths                                       | KEEP A0.2 boundary                                      |
| Native fullscreen API | not used; CSS fixed dialog                                                        | not used                                                             | not used; CDK overlay                                                | REMOVE misleading native-fullscreen assumption          |

## 4. Public API matrix

The official v2 contract currently exposes three entrypoints. These are the **exact public binding sets**; proposed dispositions are conditional, not implemented.

| Surface                          | Current members                                                                                                                                                                                                                                                                                                                                                                                                     | Proposed disposition                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gallery inputs (25)              | `items`, `activeIndex`, `initialIndex`, `circular`, `showThumbnails`, `thumbnailPosition`, `showItemNavigators`, `objectFit`, `imageLoading`, `maxZoom`, `ariaLabel`, `thumbnailLabel`, `previewLabel`, `toolbarLabel`, `zoomOutLabel`, `zoomInLabel`, `rotateLeftLabel`, `rotateRightLabel`, `flipHorizontalLabel`, `flipVerticalLabel`, `resetLabel`, `previousLabel`, `nextLabel`, `closeLabel`, `downloadLabel` | KEEP existing names provisionally; redesign `activeIndex` implementation, not a second owner. New `showCounter`/preview-enable API is **not approved**.                                                                                  |
| Gallery outputs (6)              | `activeIndexChange`, `previewChange`, `zoomChange`, `rotationChange`, `flipChange`, `imageError`                                                                                                                                                                                                                                                                                                                    | KEEP provisionally; `activeIndexChange` must be a controlled proposal when `activeIndex` is supplied.                                                                                                                                    |
| Gallery methods (14)             | `closePreview`, `flip`, `next`, `onImageError`, `onKeydown`, `onPointerDown`, `onPointerUp`, `onPreviewKeydown`, `openPreview`, `previous`, `resetTransform`, `rotate`, `setActiveIndex`, `zoom`                                                                                                                                                                                                                    | Command methods may remain; template-only handlers are candidates for INTERNALIZE after contract review, not silently removed.                                                                                                           |
| Gallery types/templates          | `NeuGalleryItem`, `NeuGalleryItemContext`, `NeuGalleryCaptionContext`; `NeuGalleryItemDirective`, `NeuGalleryCaptionDirective`                                                                                                                                                                                                                                                                                      | KEEP typed template contracts provisionally; item shape and preview caption use need review.                                                                                                                                             |
| ImageGallery inputs (7)          | `items`, `initialIndex`, `showThumbnails`, `thumbnailPosition`, `objectFit`, `showCounter`, `viewerEnabled`                                                                                                                                                                                                                                                                                                         | MERGE first five conceptually; `showCounter` and `viewerEnabled` require a **public retain/remove decision**. `thumbnailPosition='left'` versus Gallery `'start'`, and `objectFit` cover versus contain defaults, need migration policy. |
| ImageGallery output/methods/type | `activeIndexChange`; `goNext`, `goPrev`, `setActiveIndex`; reexport `NeuImageViewerItem`                                                                                                                                                                                                                                                                                                                            | MERGE output and navigation into Gallery semantics; remove old method aliases and reexport only if the component is physically removed.                                                                                                  |
| ImageViewer directive            | inputs `neuImageViewer`, `neuIvIndex`; outputs `opened`, `closed`; methods `open`, `close`, `openFromKeyboard`, `ngOnDestroy`; `NeuImageViewerItem`                                                                                                                                                                                                                                                                 | KEEP public directive provisionally because independent use is evidenced; private overlay-engine sharing or public removal requires review.                                                                                              |

There is no Angular `model()` binding in these three surfaces. Current Gallery also exposes computed properties (`activeIndex`, `activeItem`, `canPrev`, `canNext`, `itemContext`, `captionContext`, `downloadName`, `isPreviewOpen`, `transform`, `zoomLevel`) through its class declaration; their final classification depends on the ownership redesign. Gallery CSS consumes shared `--neu-*` tokens. ImageGallery consumes shared tokens only. ImageViewer defines six manifest-present `--neu-image-viewer-*` tokens (`bg`, `muted`, `btn-hover`, `caption`, `arrow-bg`, `arrow-hover`); they cannot be deleted incidentally with ImageGallery.

## 5. Design decision

The **one Gallery facade / physical ImageGallery merge** target is already frozen. The following narrower decisions are not:

1. **Stage policy:** retain an opt-out of opening preview (`viewerEnabled`) and an inline `showCounter` (new Gallery input(s)), or intentionally remove those capabilities as major-version changes. Rendering a counter unconditionally is a third policy and must not be an accidental fallback.
2. **Item policy:** require nonempty consumer `alt` on canonical `NeuGalleryItem` (breaking migration from optional `NeuImageViewerItem.alt`), or explicitly allow optional/decorative alt with separate accessible thumbnail/trigger names. Do not infer names from caption.
3. **Preview policy:** use Gallery's modal preview as the one private engine while retaining the standalone ImageViewer directive through it, or make the directive's CDK overlay the one engine and adapt Gallery's rotate/flip/download/templates. Keeping both implementations unchanged contradicts the one-engine decision. Include whether preview caption, wheel zoom and drag pan are retained.

These are material public/ownership choices under the C1 STOP rule. No default was chosen on behalf of the consumer.

## 6. Rewrite/refactor decision

**Clean internal rewrite is authorized but not started.** The existing Gallery optimistic controlled index and separate ImageViewer overlay make preserving both engines inappropriate. The rewrite should wait for the three policies above; otherwise implementation would silently add or remove public behavior.

## 7. Final Gallery architecture

Target only: one `NeuGalleryComponent` facade, one active-index owner, one preview engine, typed templates, and no ImageGallery compatibility wrapper. Specific engine and optional controls remain unresolved.

## 8. Ownership

Current Gallery writes its private `_activeIndex` even with an `activeIndex` input, then reconciles through an effect. A rejected parent proposal therefore renders optimistically; this is incompatible with the requested controlled input/proposal policy. ImageGallery is local-only and ImageViewer owns a separate overlay index. Frozen target: applied input wins in controlled mode; local index is only for the explicit uncontrolled session. Preview is currently a local session in both Gallery and ImageViewer; no applied preview-open input exists.

## 9. Item identity

Neither public item shape has a stable `id`/`key`; both thumbnail loops track array index. Current APIs are positional. A mandatory semantic key must **not** be added without another design review. The C1 migration must document what reconstructed/reordered media means if positional identity is retained.

## 10. Main media

Gallery requires `src` and `alt`, supports image/item template, configurable object fit and loading. ImageGallery accepts optional alt and defaults to `cover`; Gallery defaults to `contain`. Those differing defaults are factual breaking-delta candidates, not yet resolved by runtime.

## 11. Thumbnails

Both offer button thumbnails and selection markers. Gallery uses logical `start`; ImageGallery uses physical `left` with a responsive switch at 720px. Final thumb focus/selection and migration of `left` need a frozen policy before parity can be signed off.

## 12. Navigation

Gallery has previous/next and explicit `circular`; ImageGallery and ImageViewer are bounded. The final Gallery should not change bounded behavior unless `circular` is applied. Exactly-once interaction proof is pending implementation.

## 13. Counter

ImageGallery's `showCounter` controls the **main-stage** counter. Gallery and ImageViewer show counters only inside preview/overlay. Preserving this behavior needs an additional Gallery policy/input; dropping it is an intentional capability removal. **Design review required.**

## 14. Caption/templates

Gallery main-stage caption has a typed template fallback; ImageGallery displays text in the main stage; ImageViewer displays text in overlay. Gallery's preview currently omits caption. Whether to show a preview caption and whether the existing caption template applies there must be frozen. Caption must not be substituted for `alt`.

## 15. Preview/lightbox

Gallery uses an in-template fixed modal and a CDK scroll strategy; ImageViewer uses a portal-backed CDK Overlay. ImageGallery delegates to the directive. These are duplicate preview engines today. `viewerEnabled=false` suppresses ImageGallery's preview trigger, whereas Gallery always presents one. **Design review required** before selecting one engine and opt-out semantics.

## 16. Zoom

Gallery zooms 1..`maxZoom` (default 3). ImageViewer supports 0.25..5, wheel zoom and drag pan; ImageGallery inherits it. Whether below-1 zoom, wheel and pan are P1 parity or intentionally removed must be decided. No transform state should be public.

## 17. Rotate/flip

Gallery alone provides rotate ±90°, horizontal/vertical flip and outputs. The final private preview engine must retain them if Gallery remains canonical. They must reset on the appropriate item/session transition. No ImageGallery parity claim is needed for these Gallery-only features.

## 18. Download

Gallery alone offers a native anchor with a derived filename from the active URL. Neither other surface performs a download. Keep native browser semantics if retained; do not introduce fetch, cross-origin expansion or a service.

## 19. Error/fallback

Gallery emits `imageError` for its main image, but its preview image has no equivalent handler. ImageGallery/ImageViewer have no public error output. A single non-looping fallback policy is needed during implementation; no consumer source mutation is authorized.

## 20. Keyboard

Gallery supports ArrowLeft/Right and Home/End; its modal focus directive handles Escape. ImageViewer supports ArrowLeft/Right, Escape and +/-; ImageGallery relies on native buttons and viewer. The final one-engine keyboard contract and RTL mapping need certification after policy resolution.

## 21. Pointer/swipe

Gallery has a 36px swipe threshold on stage/preview. ImageViewer has mouse-based drag-pan and wheel zoom, with temporary window move/up listeners. Both behaviors cannot simply occupy the same pointer gesture without a precedence rule. **Design review required** if pan is retained.

## 22. RTL

Gallery uses logical CSS inset/`start` thumbnail placement; ImageGallery's public `left` is physical even though its CSS uses logical properties for layout. Current ArrowLeft/Right represent previous/next physically. The final RTL navigation/thumbnail policy is not to reverse media chronology implicitly.

## 23. A11y

Gallery uses required consumer alt, named native buttons, selected thumbnail state and modal directives. ImageGallery allows absent alt and synthesizes some thumbnail labels. ImageViewer adds a role/button trigger and dialog. This mismatch is part of the item-policy review; a caption is not an accessibility name.

## 24. Focus

Gallery and ImageViewer both use the shared trap/modal focus directives, but in different overlay architectures. Initial focus, containment, Escape, return to opener and destroy behavior must be revalidated against the selected single engine. No C1 focus claim is certified yet.

## 25. SSR

Current source defers preview DOM/overlay creation until interaction and has no native fullscreen API call. A real final-entrypoint SSR render was **not** run because runtime implementation is stopped before this gate.

## 26. Hydration

The B6 Chromium fixture does not exercise C1. The required C1 base/thumbnails/controlled index/preview/RTL/error/transform hydration gate is **pending design resolution and implementation**; no 0-NG050x claim is made for C1.

## 27. Zoneless

The project uses Angular 22 signals-first/zoneless patterns. A C1-specific `provideZonelessChangeDetection()` consumer gate remains pending.

## 28. Effects/resources

Current Gallery: two effects (scroll-strategy enable/cleanup; input-to-writable-index synchronization), one bounded pointer-start field. ImageGallery: one input-to-writable-index effect. ImageViewer: zero effects in its overlay, one modal-Escape subscription, one overlay ref per open session, and window `mousemove`/`mouseup` listeners only during drag-pan, removed on pointer-up/destroy. Keeping these three engines as-is would retain duplicate preview ownership and resource machinery.

## 29. Performance

No C1 runtime benchmark is meaningful before the one-engine decision. Current code loops thumbnail items once per render; Gallery tracks by index. The future gate must use representative media counts, repeated navigation, preview cycles and transforms, and check DOM identity/preload/resource retention rather than claim unsupported throughput.

## 30. Bundle before/after

Read-only esbuild baseline from the current built FESM, with Angular/CDK/RxJS externalized; bytes are raw/gzip/Brotli:

| Current consumer      |    Raw |   Gzip | Brotli |
| --------------------- | -----: | -----: | -----: |
| Gallery               | 50,880 |  8,982 |  7,720 |
| ImageGallery          | 34,823 |  7,834 |  6,836 |
| ImageViewer directive | 27,099 |  6,777 |  5,933 |
| All three combined    | 90,079 | 14,048 | 11,518 |

These are not additive because ImageGallery imports ImageViewer and the bundler shares code. Final basic/thumbnails/preview/advanced/root-unused measurements are **pending**. No bundle reduction or root-unused result is claimed for C1.

## 31. ImageGallery parity ledger

| ImageGallery behavior                     | Final Gallery equivalent or decision                                     | Test after resolution        |
| ----------------------------------------- | ------------------------------------------------------------------------ | ---------------------------- |
| `items` with optional `alt`               | **REVIEW** canonical item contract                                       | type/SSR/a11y fixture        |
| `initialIndex` local session              | Gallery already has it; remove mirror effect                             | controlled/uncontrolled test |
| `showThumbnails`                          | Gallery already has it                                                   | thumb toggle                 |
| `thumbnailPosition='left'`                | Gallery `'start'` is logical, not exact physical alias; migration policy | RTL/responsive               |
| `objectFit='cover'` default               | Gallery supports value but defaults to `contain`; migration policy       | image class/style            |
| `showCounter` main-stage toggle           | **REVIEW** retain via Gallery API or remove                              | stage/counter a11y           |
| `viewerEnabled=false` non-clickable media | **REVIEW** retain via Gallery API or remove                              | keyboard/preview absence     |
| `activeIndexChange`, prev/next/thumbnail  | Gallery equivalents exist, but controlled rejection needs repair         | exactly-once/rejection       |
| viewer caption                            | Gallery preview lacks it; **REVIEW**                                     | modal caption                |
| viewer wheel zoom, below-1 zoom, drag pan | Gallery lacks them; **REVIEW**                                           | pointer/wheel/cleanup        |
| bounded navigation                        | Gallery supports with `circular=false`                                   | boundaries                   |
| empty/single-item states                  | Gallery structurally supports both                                       | empty/single                 |

The 17 ImageGallery tests are classified, not deleted: shared navigation/thumbnail/empty behavior is a migration-test candidate; counter/preview-disable/caption/zoom-pan cases await policy; API-only assertions can be removed only after a parity decision. The 44 ImageViewer tests remain relevant to the standalone directive.

## 32. ImageGallery removal

**Not performed.** `NeuImageGalleryComponent`, its entrypoint, tests, CSS, ng-package metadata and public contract remain intact until the parity ledger is resolved and final gates pass. No wrapper or alias was added.

## 33. ImageViewer decision

The public directive is independently exercised by `fixtures/h5c1-public-facade/valid.ts`, the compatibility consumer's H9 event fixture, and dedicated viewer tests; it is not merely an ImageGallery implementation detail. **Proposed: keep its public directive contract**, then choose one private preview engine shared with Gallery. Removing or absorbing its public entrypoint without approval is prohibited. Keeping its current separate overlay runtime unchanged would violate C1's one-engine target.

## 34. Public contract

No C1 contract snapshot was regenerated or edited. Current exports remain Gallery (component, two directives, three interfaces), ImageGallery (component and viewer-item reexport), and ImageViewer (directive and item interface). The final API delta depends on the review choices; no new inputs/outputs/types were silently added.

## 35. Package

No package entrypoint was removed in C1. B6 checkpoint package verification passed before this audit. `@neural-ui/core/image-gallery` is **still present**; reporting it absent would be false. Final package/publint/ATTW/import-smoke gates remain pending.

## 36. Full suite

B6 checkpoint: 182 files / 2,482 tests PASS. C1 made no runtime or spec changes, so the full suite was not rerun. Mandatory post-removal full suite remains pending. No global coverage was run.

## 37. Portfolio

B6 source truth remains **95 public components, 86 completed, 9 pending, 6 batches**. ImageGallery is **not** marked merged and Gallery is **not** marked complete. The expected 94-component structure is conditional on physical removal; counts were not hardcoded or regenerated for an incomplete C1.

## 38. Remaining risks

The three blocking public choices in §5 and pointer gesture conflict in §21 are material. Additional migration details include physical `left` versus logical `start`, object-fit defaults, no item key, stage versus preview captions, and six manifest-present ImageViewer tokens. These are recorded to prevent accidental parity claims.

## 39. Files changed

C1 changed **only this report**. B6's already-approved files are contained in its separate checkpoint commit. The foreign TreeTable file was not touched, staged, deleted or renamed.

## 40. Git status

Branch `v2`; HEAD `e32260548c20bf2d1fa810a2ff100caaa3962060`. This report is untracked and intentionally uncommitted. The pre-existing untracked `projects/ui-core/tree-table/public_api 2.ts` remains intact. Staging is empty. No symlink, temporary consumer directory, push, tag, release or npm publication was created.

## 41. Recommendation

**C1 NEEDS DESIGN REVIEW.** Freeze the stage counter/preview opt-out policy, canonical item/alt policy, and single preview engine with caption/zoom-pan parity. Then resume C1 from this audit, implement one Gallery, prove ImageGallery parity, physically remove ImageGallery, run the required gates, and only then consider C2. **C2 was not started.**

## 42. Normative resolution applied

The follow-up authorization froze one Gallery component, one independently public ImageViewer directive, and one private CDK Overlay preview engine. It also froze required item `alt` (empty string permitted), `showCounter=false`, `previewEnabled=true`, main-stage-only counter control, preview counter/caption, wheel zoom, pan only above 1×, 36px swipe at or below 1×, and a parent-owned applied `activeIndex` when supplied. The original STOP in §1 was correct at the time; no public ambiguity remains from that review.

## 43. Final public shape and migration

`@neural-ui/core/gallery` exposes `NeuGalleryComponent`, `NeuGalleryItem`, and the two existing typed item/caption template directives. Gallery has **27 inputs** (the former 25 plus `showCounter` and `previewEnabled`) and its six existing outputs. `NeuGalleryItem` is a public alias of the sole object-based `NeuImageViewerItem` shape `{src:string, alt:string, caption?:string}`. `alt=""` is decorative; no filename/caption/URL inference occurs. The ImageViewer string shorthand maps to decorative `alt=""` internally. The standalone `@neural-ui/core/image-viewer` directive and its `opened`/`closed` events remain public. The preview overlay component is private and not exported by either public API.

ImageGallery migration is explicit: `viewerEnabled` → `previewEnabled`; physical `thumbnailPosition="left"` → logical `"start"`; callers relying on ImageGallery's old `cover` default set `objectFit="cover"`; `showCounter` is now opt-in because Gallery defaults it to false. `initialIndex`, thumbnails, bounded navigation (`circular=false`), stage counter, caption, viewer wheel/minimum zoom, drag pan, and active-index proposals are covered by Gallery. No alias/wrapper was retained. Positional index identity remains unchanged: replacement/reorder displays the item occupying the applied index.

## 44. Ownership and one preview engine

Gallery uses computed applied index from the optional `activeIndex` input; a rejected proposal leaves the stage and overlay on the applied item, while a parent write updates both. When no index is supplied, one bounded local signal initializes from `initialIndex`. There is no input-to-writable mirror effect. Preview open is local ephemeral state, with one `previewChange(true/false)` lifecycle notification per open/close. Gallery delegates to the existing ImageViewer CDK Overlay through a scoped private adapter; ImageViewer standalone opens that same overlay. No second Gallery fixed modal, duplicate transform state, or alternate preview runtime remains.

The overlay owns private zoom/pan/rotation/flip state. Wheel and buttons share clamped hundredth-step normalization (Gallery 0.25–`maxZoom`, default maximum 3; standalone viewer up to 5). Pointer capture is local to the media viewport: drag pans only above 1×, and at or below 1× horizontal movement above 36px navigates. Pan clears when zoom returns to 1× or below. Applied active item changes, explicit reset, and close reset the transform. Rotate/flip and their existing outputs are Gallery-only. Download remains a native anchor; no fetch/blob transport was introduced. Main and preview captions use the same typed caption template context; plain item caption works in standalone ImageViewer.

## 45. Accessibility, focus and presentation

The stage image and preview image use the supplied alt exactly. Decorative thumbnails still have named native buttons via the existing `thumbnailLabel` fallback; preview-disabled main media is a static div, not a fake button/trigger. The preview has dialog modality, focus containment/initial focus, Escape, and return to opener via the existing focus infrastructure. The counter is not live. Native controls have names, icons stay decorative, and toolbar controls scroll horizontally on narrow viewports. The `start` thumbnail strip uses logical grid placement and was verified on the physical right in RTL Chromium. Gallery `contain` remains its default, with explicit `cover` supported. All six existing `--neu-image-viewer-*` theme tokens remain in the generated manifest.

## 46. Parity, tests and lifecycle

The 17 legacy ImageGallery tests were classified: shared presentation/navigation behavior is covered by Gallery tests; unique counter/preview opt-out/caption/zoom-pan behavior is covered by new Gallery and Chromium gates; old selector/API-only cases are intentionally removed. The standalone ImageViewer suite remains. Final directed gate: `test:n2-c1` **4/4 static contract tests and 62/62 Angular tests PASS**. The full library suite after physical removal and final type change: **181/181 files, 2,473/2,473 tests PASS**; before C1 it was 182 files / 2,482 tests. Net −1 file/−9 tests = 17 deleted legacy tests and 8 added Gallery tests, with no uncovered C1 P1 behavior identified. No global coverage was run.

The Gallery has zero product effects; ImageViewer's overlay has one effect solely to reset private transforms when the applied item changes. This replaces the former Gallery two and ImageGallery one applied-state synchronization effects. There is one overlay ref per open session and one modal Escape subscription cleaned up on destroy; pan uses Pointer Events/capture and no permanent window move/up listeners. No timers/observers/preload subscriptions were introduced. A directed 50-cycle open→navigate→zoom→close test left zero overlays, followed by component destroy. The real browser fixture used 50 media items and 100 next gestures, preserving the same mounted stage image and all 50 thumbnail nodes; its synchronous dispatch sample is diagnostic only and is **not** a render-throughput claim.

## 47. SSR, hydration and zoneless

The new Angular 22.1.6 consumer imports only the final Gallery and ImageViewer entrypoints and uses `provideZonelessChangeDetection()`. SSR rendered basic, controlled/uncontrolled, preview-disabled, counters, captions, decorative alt, 50-item thumbnails and standalone trigger with no overlay. Chromium hydration reused the checked DOM nodes with **0 NG050x** and no initial outputs. It verified rejected/accepted thumbnail proposals, exactly one preview, caption, wheel zoom, zoom-below-one swipe, zoom-above-one pan without navigation, transform reset, Gallery focus return, and independent standalone ImageViewer open/close/focus return. The fixture cleans its temporary directory in `finally`.

## 48. Bundle and package

esbuild from final FESM, with Angular/CDK/RxJS/neural-icons externalized, measured raw/gzip/Brotli bytes:

| Consumer | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| Gallery basic | 52,457 | 10,874 | 9,524 |
| Gallery thumbnails | 52,457 | 10,874 | 9,524 |
| Gallery preview | 52,457 | 10,874 | 9,524 |
| Gallery advanced | 52,457 | 10,874 | 9,524 |
| ImageViewer standalone | 34,915 | 8,009 | 7,044 |
| Both canonical surfaces | 76,849 | 14,857 | 10,771 |
| Root unused | **0** | 20 | 1 |

Angular's single compiled Gallery template makes input-selected variants identical at bundle time; `showThumbnails=false` is runtime data, not tree-shaking evidence. Versus the previous three-surface combined 90,079/14,048/11,518 B, the final combined case is −13,230 raw, +809 gzip, −747 Brotli. The gzip increase is attributable to the shared overlay's added Gallery transform controls/caption/gestures and the different compression mix; no numerical reduction threshold was required. There is one preview engine and zero retired ImageGallery code in the package. The ImageViewer standalone cost rises because it now contains those shared capabilities, not because a second engine is shipped.

The build, regenerated public contract/reconciliation, `audit:contracts`, `test:contracts`, package audit/verification, publint, 97-entrypoint public import/SSR import smokes, token audit, and neural-icons boundary all PASS. Scoped ATTW on Gallery/ImageViewer has only the pre-existing ESM-only package `CJSResolvesToESM` warning; with that known rule ignored, it exits 0. Global ATTW additionally sees existing styles resolution debt. The unrelated primitive audit remains red on the already-known MegaMenu/Modal/Slider/TreeSelect inline-SVG/native-button inventory, not on C1.

## 49. Physical removal and portfolio

`projects/ui-core/image-gallery/` and its component, styles, spec, public API and ng-package metadata were physically deleted. `@neural-ui/core/image-gallery` is absent from final package exports, the generated v2 contract, and active source. `@neural-ui/core/image-viewer` remains. The active README and primitive inventory no longer advertise the retired entrypoint; historical CHANGELOG and historical contract snapshot were intentionally left intact. Official token and public-contract generators were used, followed by the official portfolio writer/check. Portfolio source truth is **94 public components = 87 complete + 7 pending, 5 implementation batches**. Remaining pending: VirtualList (P3), PickList, OrderList, MegaMenu, CommandPalette, Kanban and Tree.

## 50. Dependency and risk boundary

No new public entrypoint, HTTP client, storage, remote image fetching or separate preload engine was added. The Gallery entrypoint depends on the public ImageViewer directive and the existing internal adapter; the viewer does not depend on Gallery, so the package graph is acyclic. Consumer migration is a major-version change for optional object alt, `viewerEnabled`, physical `left`, and ImageGallery's cover default. Browser testing used deliberately missing fixture image URLs; the test checks semantic DOM/interaction rather than successful network image loading.

## 51. Git/diff hygiene

The C1 diff is limited to Gallery/ImageViewer runtime and tests, the new private adapter, ImageGallery physical deletion, generated contract/token/portfolio artifacts, bounded scripts, and one active README reference. `git diff --check` PASS; staging empty; no tracked or new symlinks; no leftover `.n2-c1-hydration-*` directory. No C1 commit, push, tag, release or npm publication was made. The unrelated untracked `projects/ui-core/tree-table/public_api 2.ts` is preserved and excluded with unchanged SHA-256 `c125dde6541cf65f1936dcc6d0468c84da4391234e2a162ba10f889d1936b644`. C2 was not started.

## 52. Recommendation

**C1 COMPLETE — READY FOR C2.** This is a readiness result only; C2 requires its own authorization and was not initiated.
