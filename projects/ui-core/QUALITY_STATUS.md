# Neural UI Core Quality Status

Last reviewed: 2026-09-28

## Executive Summary

Neural UI Core is aligned with the project's main engineering standards: signals-first APIs, standalone Angular components, OnPush change detection, and zoneless-oriented testing. Neural UI 2 passes the exact 95.01% hard coverage gate on all four metrics.

Validated coverage snapshot:

- Statements: 23,819/24,565 (96.96%; 746 missed)
- Branches: 13,976/14,708 (95.02%; 732 missed)
- Functions: 4,511/4,696 (96.06%; 185 missed)
- Lines: 18,707/19,061 (98.14%; 354 missed)
- Unit tests: 2,889 passing tests in `ui-core`

The blocking release policy requires **at least 95.01% on all four metrics** in the full canonical run. `npm run test:coverage` collects fresh coverage and audits exact covered/total counts; `npm run test:coverage:gate` tests that arithmetic. The current branch passes. The [REL-02 assurance report](../../N2-REL-02-COVERAGE-ASSURANCE.md) retains historical checkpoint evidence and the REL-02G closeout.

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

### Testing

- Global coverage above 95.01% on all four metrics: yes; branches are 95.02%
- Enforced release coverage policy: 95.01% exact hard floor on all four metrics
- Residual low-return hotspots still present: yes
  - `virtual-list`
  - `dashboard-grid`
  - some complex CDK-driven branches in `nav`, `popover`, and similar components

### Accessibility

- ARIA usage present across major interactive components: yes
- Keyboard interaction patterns present in key widgets: yes
- Focus management present in key widgets: yes
- Showcase accessibility validation completed previously: yes
- Formal 100% accessibility certification across all library components: no

### Integration Validation Through Showcase

- Playwright functional and accessibility suite: 375/375 passing in Chromium, Firefox and WebKit
- Responsive matrix: 980/980 passing across 320×568, 360×800, 390×844, 768×1024 and 1440×900
- Visual-baseline gate: pending explicit human approval before the first baseline is created
- Visual baselines: may only be created or replaced after explicit human review approval
- Validation model: showcase runs against the compiled `@neural-ui/core` package, so these checks act as integration validation of the library in real consumer flows

### Documentation / DX

- README metrics generated and release-audited: yes
- Release-note style quality summary added to changelog: yes
- Published API snapshot, package lint, type audit and bundle budgets: enforced
- `ng add`, theme, layout, dashboard and CRUD schematics compile on Angular 19–22: yes
- Public Component Harness entry point: included in the API contract
- BEM requirement documented as part of engineering standards: yes
- Bilingual comments requirement fully re-audited line by line: not fully re-verified in this pass

## Accessibility Audit Snapshot

This is a rapid engineering audit, not a full WCAG certification.

### Strong evidence found

- Combobox/listbox semantics in `autocomplete`
- Dialog semantics and keyboard handling in `date-input` and `image-viewer`
- `aria-current`, labels and navigation semantics in `pagination`
- Group/button pressed semantics in `chip` and `toggle-button-group`
- Tooltip relationship semantics in `tooltip`
- Live-region and role behavior in `toast`
- Separator semantics and keyboard resizing in `splitter`

### Components reviewed with explicit accessibility signals in source

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

- Not every component was verified against a complete WCAG checklist.
- Some advanced widgets would benefit from deeper scenario-based audits.
- CDK-heavy interactions can be semantically acceptable while still requiring manual screen-reader validation.

## Recommended Wording

Use this wording in documentation or internal reporting:

"Neural UI Core uses signals-first, standalone, OnPush and zoneless-oriented Angular architecture and BEM styling. Neural UI 2 currently has 95.52% statement, 91.68% branch, 95.20% function and 97.35% line coverage. Its release gate requires 95.01% on all four metrics and currently blocks release because branch coverage is below that threshold. Accessibility quality is high-confidence, although not formally certified as 100% component-by-component."

For styling standards, component and demo styles are expected to follow BEM naming and BEM-oriented SCSS grouping rather than flat ad hoc selector organization.
