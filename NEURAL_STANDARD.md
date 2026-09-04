# Neural Standard

## Purpose

NeuralUI is an Angular design system with a coherent Neural visual language, a small public API, and consumer-controlled CSS theming. This document is the canonical engineering and product standard for the library, its packages, and its Showcase. It stands on its own as an independent design-system contract.

## Architecture

- Use current Angular standalone APIs, typed inputs/outputs, `OnPush`, signals for component-owned reactive state, and explicit dependency injection.
- Components must remain correct without Zone.js: event, async, and external-library updates explicitly update signals or Angular state.
- SSR and hydration must produce deterministic initial markup. Generated IDs are request/application scoped and must never depend on randomness, the clock, or process-global mutable counters for hydrated output. The dedicated SSR foundation owns this contract.
- The initial render is viewport-independent. Responsive behavior enhances only after hydration through the shared responsive-state foundation; server rendering must not guess from browser globals.
- Locale, IANA time zone, and initial time are explicit or transferred application state. Date-only values preserve calendar-date semantics, while timestamps are formatted against the configured locale/time-zone contract.
- Representative hydration certification must compare server and client structure across supported locales and time zones, including generated relationships, responsive surfaces, and temporal components.
- State has one owner. Inputs are immutable contracts; never mutate input collections or caller objects. Emit new values for externally owned state.
- Keep public APIs minimal and typed. New runtime APIs require a documented consumer use case and a secondary-entrypoint review.
- Form controls implement the CVA contract, disabled state, labels/errors, and keyboard behavior consistently.
- Clean up listeners, observers, timers, subscriptions, overlays, and generated DOM in the owning lifecycle.

## Accessibility and resilient CSS

- Provide semantic structure, labels, focus-visible treatment, keyboard operation, and correct ARIA only where it reflects real behavior.
- Use logical CSS properties for direction-sensitive layout.
- Respect `prefers-reduced-motion` and `forced-colors`; do not add animation or focus styling that defeats either mode.
- `!important` is exceptional: only reduced-motion/forced-colors enforcement, documented third-party overrides, or an unavoidable established contract may use it.
- Production library code and consumer examples must contain neither `::ng-deep` nor `/deep/`.

### Mobile-first layout

- Base layout targets the smallest supported viewport; progressively enhanced layout uses `min-width` queries where appropriate.
- Semantic `max-width` behavior remains valid for intrinsic limits, overlays, and content containment.
- Touch targets remain usable at the supported compact viewports.
- A component may own horizontal overflow when its semantics require a wider internal surface, such as a data table. Document-level horizontal overflow is never acceptable.

## CSS and theming contract

The cascade is a public product contract. Consumers theme without private DOM knowledge, `::ng-deep`, or specificity contests:

```scss
:root { --neu-primary: #6750a4; }
.billing-area { --neu-button-background: #3f2b70; }
```

Values resolve in this order: **foundation → semantic → component → local cascade override**. A component stylesheet must consume tokens through `var()` and must not reset a public token on an internal selector where that would defeat an ancestor override. Component geometry calculated at runtime is private implementation state, not a token API.

### Token hierarchy and ownership

- **Foundation**: primitives such as `--neu-space-*`, `--neu-radius-*`, fonts, text sizes, transitions, shadows, and z-index values.
- **Semantic**: intent such as `--neu-primary`, `--neu-surface`, `--neu-text`, `--neu-border`, statuses, overlay, and focus tokens.
- **Component**: meaningful choices for one family, for example `--neu-terminal-bg`, `--neu-popover-padding`, or `--neu-table-header-height`.

Every public token has one logical owner and a deterministic default in `projects/ui-core/styles/_tokens.scss`. Legacy names remain supported as aliases to canonical semantic tokens until a future major release. Avoid a mass rename.

Use the `--neu-` prefix. Semantic names describe intent (`--neu-text-muted`, `--neu-focus-color`); component names begin with the component/family (`--neu-popover-padding`). Use state suffixes such as `-hover`, `-disabled`, `-focus`, `-error`, and size/motion suffixes only where a consumer can meaningfully theme them. Do not tokenize internal transforms, virtual spacers, runtime coordinates, or other structural math.

The focus contract is `--neu-focus-color`, `--neu-focus-ring-color`, `--neu-focus-ring-width`, `--neu-focus-ring-offset`, `--neu-focus-ring-alpha`, `--neu-focus-ring-strong-alpha`, `--neu-focus-ring`, and `--neu-focus-ring-strong`. Components use the ring tokens; custom themes can override color, width, or the complete ring while preserving the default appearance.

The default light and dark themes are part of Neural's visual identity: clean slate surfaces, restrained borders/shadows, accessible text, and Neural Blue actions. Dark overrides must continue to resolve semantic aliases, not recreate unrelated component colors.

`projects/ui-core/token-manifest.json` is generated from the token source and records the machine-readable public contract. Run `npm run tokens:generate`; CI uses `npm run audit:tokens` to reject drift.

## Entrypoints, performance, and package shape

- Consumers use secondary entrypoints first. The root package is provider/setup only; never add heavy sibling imports, root barrel imports, or import-time side effects to lightweight entrypoints.
- Package size alone is not consumer cost. New optional capabilities need quantitative bundle and consumer-fixture evidence before imposing cost on a lightweight import.
- A large component is not inherently wrong (including Table), but optional features must be evaluated for isolation and consumer cost.
- Avoid unnecessary runtime work, allocations, layout reads, and global listeners. Benchmark or measure hot paths when changing them.

## Testing and documentation

- Test behavior at the public contract: signals/zoneless updates, SSR/hydration compatibility, forms, a11y, cleanup, immutability, tokens, and keyboard flows.
- Token tests must cover manifest integrity, ownership/defaults, aliases/fallbacks, local cascade, focus, dark resolution, documentation coverage, and no-deep-selector enforcement.
- The Showcase is product surface, not a scratchpad. Each visual/API route retains **Preview**, **Config**, and **API**. Config is meaningful, API mirrors package declarations, and token documentation is discoverable from shared metadata.
- Keep EN and ES content synchronized. Examples use current Angular/Neural APIs and secondary entrypoints.

## Deprecation and compatibility

Do not remove public tokens, aliases, or component APIs in a minor release. Mark replacements as compatibility aliases in the manifest and docs, communicate migration guidance, and remove only in a planned major version after a deprecation period. Private runtime custom properties may be renamed when they were never documented or exposed as a public contract.

## Definition of Done

A component or feature is complete only when its functional behavior, signals/zoneless behavior, SSR/hydration safety, state ownership, immutability, Forms/CVA (when applicable), accessibility, tokens/theming, Neural default visual language, secondary entrypoint/tree-shaking impact, performance, cleanup, and focused tests are addressed. Visual families also require responsive browser evidence plus Showcase Preview, Config, API, discoverable token docs, and synchronized EN/ES content.
