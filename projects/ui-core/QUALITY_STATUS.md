# Neural UI Core Quality Status

Last reviewed: 2026-08-18

## Executive Summary

Neural UI Core is currently aligned with the project's main engineering standards: signals-first APIs, standalone Angular components, OnPush change detection, zoneless-oriented testing, and global coverage above the requested threshold.

Validated coverage snapshot:

- Statements: 97.45%
- Branches: 95.36%
- Functions: 96.19%
- Lines: 98.82%
- Unit tests: 2218 passing tests in ui-core

The library presents a strong accessibility baseline across interactive components, but accessibility should be described as high-confidence rather than formally certified 100% component-by-component.

## Standards Checklist

### Architecture

- Signals-first: yes
- Standalone components: yes
- OnPush by default: yes
- BEM styling convention required for component styles: yes
- Classic `@Input()` / `@Output()` decorators in `ui-core`: not found in review
- `ChangeDetectionStrategy.Default` in `ui-core`: not found in review

### Zoneless

- Zoneless-oriented test setup: yes
- `provideZonelessChangeDetection()` used broadly across component specs: yes
- Compiled tarball imports verified without Zone.js on Angular 19–22: yes
- Rendered component IDs use Angular CDK's hydration-stable ID generator rather than random values: yes

### Testing

- Global coverage above 95%: yes
- Enforced global coverage floor of 95% across the library: yes
- Per-entry-point coverage gate: 90/90 entry points pass their applicable thresholds

### Accessibility

- ARIA usage present across major interactive components: yes
- Keyboard interaction patterns present in key widgets: yes
- Rating follows a roving-tabstop keyboard model with arrows, Home/End, wrapping and direction-aware horizontal behavior: yes
- Focus management present in key widgets: yes
- Showcase automated accessibility validation: 384/384 localized/theme routes passed with axe-core WCAG 2.2 AA tags
- Manual NVDA 2026.1.1 validation: 89/89 public entry-point routes passed on Windows 11 with current Chrome; Narrator, VoiceOver macOS/iOS and TalkBack remain `UNVERIFIED`
- Formal 100% accessibility certification across all library components: no

### Localization and RTL

- Locale-aware English/Spanish defaults: verified for selection controls, tabs, sidebar, filters, inline editing, spinner and tree table
- Consumer override contract: every localized default remains replaceable through public inputs
- Angular CDK `Directionality`: used by direction-sensitive interactive components
- Dynamic direction changes: verified without application reload, including overlays and physical arrow-key behavior
- Showcase RTL audit: 288/288 route/browser checks passed

### Integration Validation Through Showcase

- Automated axe-core audit: 384/384 localized pages passing with zero errors
- Functional browser gate: 1308/1308 scenarios passed across Chromium, Firefox and WebKit
- Presentation-resilience coverage inside the browser gate: 576/576 route/browser checks passed for 320×720 reflow, text spacing, forced colors, reduced motion, touch targets, clipping and focus
- Responsive browser gate: 2880/2880 route/viewport/direction checks passed
- Dynamic RTL browser gate: 288/288 checks passed
- Browser performance gate: all 90 public routes passed three cold-load samples and their budgets
- Lighthouse CI: 12/12 representative reports passed the committed local budgets
- Visual-baseline inventory: 464 reference snapshots are tracked; the current candidate still requires explicit human review
- Strict matrix: 1419 cells pass and 116 are justified `N/A`; 445 human cells remain `UNVERIFIED` (356 assistive-technology and 89 visual)
- Visual baselines: may only be created or replaced after explicit human review approval
- Validation model: showcase runs against the compiled `@neural-ui/core` package, so these checks act as integration validation of the library in real consumer flows

### Documentation / DX

- README metrics generated and release-audited: yes
- Release-note style quality summary added to changelog: yes
- Published API snapshot, package lint, type audit and bundle budgets: enforced
- `ng add`, theme, layout, dashboard and CRUD schematics compile on Angular 19–22: yes
- Public Component Harness entry point: 71 interactive entry points covered; 19 non-interactive or utility entry points classified `N/A` with rationale; zero unclassified
- Angular Forms: 25 CVA entry points verified; all 65 non-form entry points classified `N/A` with rationale
- Showcase static inline-style debt: zero; 14 runtime style bindings retained under an exact audited allowlist
- BEM requirement documented as part of engineering standards: yes
- Bilingual comments requirement fully re-audited line by line: not fully re-verified in this pass

## Accessibility Audit Snapshot

This is an evidence-backed engineering audit, not a paid or external WCAG certification.

### Strong evidence found

- Combobox/listbox semantics in `autocomplete`
- Dialog semantics and keyboard handling in `date-input` and `image-viewer`
- `aria-current`, labels and navigation semantics in `pagination`
- Group/button pressed semantics in `chip` and `toggle-button-group`
- Tooltip relationship semantics in `tooltip`
- Live-region and role behavior in `toast`
- Separator semantics and keyboard resizing in `splitter`

### Representative components reviewed with explicit accessibility signals in source

- `autocomplete`
- `chip`
- `code-block`
- `date-input`
- `image-viewer`
- `input`
- `notification-center`
- `pagination`
- `slider`
- `splitter`
- `toast`
- `tooltip`

### Why this is not labeled 100%

- NVDA is recorded as 89/89 PASS; Narrator, VoiceOver on macOS/iOS and TalkBack have not yet been recorded for this release candidate.
- The changed visual baselines have not yet been approved by a named human reviewer.
- Automated semantics and keyboard checks cannot prove what a screen reader announces.

## Recommended Wording

Use this wording in documentation or internal reporting:

"Neural UI Core is aligned with a signals-first, standalone, OnPush and zoneless-oriented Angular architecture, uses BEM as its required styling convention, exceeds 95% global coverage in every main metric, and maintains a strong accessibility baseline with ARIA, keyboard navigation and focus management across its main interactive components. Accessibility quality is high-confidence, although not formally certified as 100% component-by-component."

For styling standards, component and demo styles are expected to follow BEM naming and BEM-oriented SCSS grouping rather than flat ad hoc selector organization.
