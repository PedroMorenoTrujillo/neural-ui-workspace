# Golden documentation — Core remediation

Date: 2026-10-02. Branch: `v2`. Starting authority: `11524ed630246753fe0d05655eb9d99a27b3dc72`.

## Status and scope

Core remediation gates passed on the source tree recorded by the local commit containing this report. This is **not** a declaration that the Showcase golden pages are complete. No release, tag, push or npm publication is authorized or performed. Neural Icons and the V1 Showcase are untouched.

The starting Core tree was clean. Recoverable archives and full command logs are under `/Users/pedromorenotrujillo/Documents/Codex/2026-10-02/neural-ui-golden-implementation/`. The pre-existing Showcase changes were separately archived before implementation.

## Table

- Reconnected `--neu-table-header-height`, `--neu-table-max-height` and `--neu-table-sticky-offset` to the V2 renderer, without synonymous replacements. Directed checks use 73px header height, 211px viewport maximum and 17px sticky offset.
- Selected rows take precedence over stripes.
- `responsive: 'stacked'` changes the non-virtual renderer at widths up to 40rem: cells become labeled stacked rows. Column controls remain available in the header. Normal scroll mode retains table layout.
- Virtualization deliberately retains table rows and a contained viewport, even when stacked is requested: variable-height stacked rows cannot honor the fixed virtual-row geometry contract. Document this precedence; do not promise stacked virtualization.
- Added an explicit table role, preserving its semantic purpose when responsive CSS changes its display layout.

## TreeTable

The renderer stays independent of Table. Only a neutral Sass responsive-layout primitive is shared; no Table renderer or private Table module is imported.

Implemented normal/compact/relaxed cell density, none/rows/cells borders, stripes with selection precedence, sticky header surface, responsive stacking and visible row/control focus. Directed tests verify all densities and borders, selection precedence, mobile layout and virtualization precedence.

### Accepted token additions

| Token | Default at point of use | Why a shared token is insufficient |
| --- | --- | --- |
| `--neu-tree-table-cell-block` | `.625rem` | TreeTable-only row padding must not resize all consumers of a global spacing token. Compact multiplies by .6; relaxed by 1.4. |
| `--neu-tree-table-cell-inline` | `var(--neu-space-3, .75rem)` | TreeTable cell padding needs a local override independent of global application spacing and hierarchical indentation. |
| `--neu-tree-table-selected-background` | `color-mix(in srgb, currentColor 9%, transparent)` | A TreeTable selection surface must not recolor unrelated surfaces or text. |

Only these three additions were accepted. No per-state token explosion, no inherited Table aliases, and no new public error-ring token. The public token-name union and contract snapshot include exactly these additions. There are 262 public and 21 internal tokens.

## Theme/state corrections

- Button: removed dark-only hardcoded brand overrides. Both themes now follow the semantic palette. The four existing Button hooks remain scoped to solid/brand; they are not falsely advertised for outline/ghost.
- Input: floating labels use the same locally overridden background as the field. Invalid focus uses the semantic error color and shared ring geometry.
- Textarea: invalid+focused takes precedence over the normal focus border/ring.
- Checkbox: check and mixed indicators inherit `--neu-primary-fg`, replacing fixed white strokes.
- Select: invalid focus uses the same internal error-focus mixin; normal focus uses the shared ring instead of a fixed blue shadow.
- The error-focus helper is internal Sass, not a new public styling API.

## Input projection

Removed the empty SVG/innerHTML fallback inside the projected prefix outlet. It obscured application content and introduced an SSR-incompatible path. Named icon rendering and provider independence are unchanged. The legacy exposed computed fields were not removed as an incidental breaking change.

Tests assert non-empty prefix, native field and suffix in unit rendering, server HTML and hydrated Chromium/Firefox/WebKit. Three sizes and both themes are exercised, including editing the value after hydration. This is not a screen-reader certification.

## Manifest semantics

`declaredIn` remains declaration evidence. `consumedIn` now contains productive CSS `var()` reads or literal computed-style reads, not mere name occurrences or self-declarations. `cssConsumedIn` and `typescriptConsumedIn` separate the evidence. Root alias dependencies remain described by `fallback`; they are not mislabeled as direct renderer use. Sass primitives are listed at their actual file location, rather than pretending they belong to every importing component.

The four Input tokens are owned by Input. TreeTable tokens are owned by TreeTable. Three directed manifest tests check consumer evidence, restored Table hooks and ownership/local fallbacks. Runtime computed-style detection is literal-call based; it does not claim to infer arbitrary dynamic property names.

## Bounded review of inert candidates

No unused-looking token was deleted. The following candidates have no productive read in the updated manifest and are **DEFER**, not documented as working renderer customization hooks:

| Candidates | Decision and reason |
| --- | --- |
| `--neu-cmd-bg`, `--neu-cmd-highlight`, `--neu-cmd-radius` | DEFER: CommandPalette renderer/overlay contract needs its own focused change and visual tests. |
| `--neu-notification-unread-bg` | DEFER: unread appearance belongs to Notification, outside the golden components. |
| `--neu-otp-cell-focus-border` | DEFER: OTP focus precedence needs its own combined-state contract. |
| `--neu-splitter-handle-bg` | DEFER: handle geometry and hit-area behavior need a Splitter-specific review. |
| `--neu-meter-radius` | DEFER: reconcile track/segment clipping before connecting a public hook. |
| `--neu-context-menu-radius`, `--neu-context-menu-shadow` | DEFER: overlay surface ownership needs ContextMenu-specific verification. |

Table's three inert hooks are **CONNECT** in this change. There are no REMOVE decisions and no evidence-based promotion of the deferred component hooks to KEEP FOR AUTHORING. Foundation primitives retained for authoring are not equivalent to promises that an individual renderer consumes them.

## Public method classification for documentation

The current supported contract remains the authority; TypeScript visibility alone does not promote a method.

- Input/Textarea/Checkbox `focus(options?)` and `reset()` are **FRAMEWORK/CONTROL HOOK** in the current FormValueControl design. In particular, Input `reset()` clears transient composition/focus state, not the application's value. Do not teach it as a clear-value API. Application examples reset their value/checked signal or their form.
- Input `syncNativeValue()` is a **FRAMEWORK/CONTROL HOOK** for autofill synchronization, called from render/autofill handling with destroyed/disabled/readonly guards. It is not required by normal application usage.
- `onInput`, `onBlur`, composition and animation handlers are **ACCIDENTAL/INTERNAL EXPOSURE**, not consumer methods.
- Explicitly supported Table/TreeTable imperative methods remain consumer APIs. Their extraction must preserve signatures and describe effects.
- Any future promotion of the three form controls' hooks to independent consumer guarantees requires **DESIGN REVIEW**, contract classification and tests; this remediation does not silently create that guarantee.

## Verification

| Gate | Result |
| --- | --- |
| Build | PASS |
| Package verification | PASS, 449 build-stage files before source-map separation |
| Public contracts | PASS, 101 entrypoints, 868 declarations, 1473 bindings |
| Token drift | PASS, 262 public tokens |
| Imports / SSR import smoke | PASS, 101 entrypoints each; import smoke alone is not a render test |
| publint | PASS |
| Full canonical tests | PASS, 2937/2937, 192 files |
| Statements | 24024/24772 = 96.9805% |
| Branches | 14066/14800 = 95.0405% |
| Functions | 4519/4706 = 96.0263% |
| Lines | 18839/19193 = 98.1556% |
| CSS contracts | PASS, 216 evidence records, two distinct palettes × light/dark × Chromium/Firefox/WebKit |
| Input projection SSR/hydration | PASS, all three engines, three sizes, two themes |
| Table SSR/hydration | PASS, Chromium, including virtual bootstrap, controlled requests and mechanical a11y checks |
| TreeTable SSR/hydration | PASS, Chromium, including hierarchy, controlled state, virtual bootstrap, export and narrow containment |
| DateInput SSR/hydration | PASS, Chromium, DOM reuse and overlay/event behavior |
| H9 PR / main / release | PASS; 7 / 23 / 23 consumer scenarios, 113 chunks, zero architecture failures |

The CSS probes compile production styles against representative markup. They complement, not replace, Angular interaction/hydration tests. Golden-page browser and visual QA still belongs to the Showcase phase.

Two initial full-suite runs exposed a 5-second timeout in the combined TreeTable benchmark under coverage. The isolated uninstrumented test passed. Query sampling and create/render/destroy sampling are now separate tests, retaining all original sample counts, warmups, workloads, output metric names and the existing 5-second per-test timeout. No coverage or H9 threshold was lowered. Original failed logs are preserved.

Hydration fixture preparation now copies the neutral Sass dependencies it needs. Table's fixture also resolves global styles against the built Core package. These are harness dependencies, not Showcase source imports.

ATTW's previously reported debt is not certified fixed by publint, build or H9. No ATTW PASS is claimed here.

## Local package identity

Product generation is V2. The historical manifest version remains `1.15.0`; it is not an npm V2 release and was not changed for the Showcase.

- Canonical prepared tarball: `dist/release/neural-ui-core-1.15.0.tgz`.
- SHA-256: `363a640940bff37efc94ad052f074502cd2991166208f1c83324d3232d3bf1ed`.
- 336 files; 654519 packed bytes; 4344714 unpacked bytes; zero published source maps or sourceMappingURL references.
- The 113 source maps remain in a separate local debug archive.
- Exact committed source SHA, tree and clean/dirty provenance are emitted by the post-commit preparation into `dist/release/release-manifest.json`; the Showcase snapshot must pin that SHA plus this tarball hash.

The preliminary pack from the raw build has 449 files and is **not** the certified consumer artifact. Install only the canonical 336-file prepared tarball after confirming its post-commit provenance and hash. The local artifact is not published.
