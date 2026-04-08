# Changelog

All notable changes to `@neural-ui/core` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-04-08

Initial stable release of `@neural-ui/core`.

### Added

#### Components (40+)

**Forms**

- `NeuCheckbox` — checkbox with indeterminate state and CVA support
- `NeuDateInput` — date/time/datetime-local picker with drum scroll UI
- `NeuInput` — text input with floating label, icons, hint, and error
- `NeuMultiselect` — multi-value select with chips, search, and keyboard navigation
- `NeuRadio` / `NeuRadioGroup` — radio button group with CVA support
- `NeuSelect` — single-value select with search, clearable, and keyboard navigation
- `NeuSlider` — range slider with CVA support
- `NeuSwitch` — toggle switch with CVA support
- `NeuTextarea` — textarea with auto-resize and floating label
- `NeuToggleButtonGroup` — single/multi selection button group with CVA support

**Navigation**

- `NeuBreadcrumb` — breadcrumb trail with custom separators
- `NeuNav` — sidebar navigation with flyout menus and accordion groups
- `NeuPagination` — page navigation with configurable page size
- `NeuSidebar` — collapsible sidebar layout panel
- `NeuStepper` — linear/non-linear step wizard with `next()` / `prev()` API
- `NeuTabs` — tab group with URL state sync and badge support

**Layout**

- `NeuAccordion` — collapsible content panels
- `NeuCard` — card container with header, content, and footer slots
- `NeuDivider` — horizontal or vertical visual separator
- `NeuModal` — dialog/modal with backdrop and keyboard close
- `NeuTable` — data table with sorting, pagination, expandable rows, and CSV export

**UI Elements**

- `NeuAvatar` — user avatar with image, initials, and size variants
- `NeuBadge` — status badge with color variants
- `NeuButton` — button with variants, sizes, loading state, and icon support
- `NeuChart` — chart wrapper (line, area, bar, donut, pie, pareto) via ApexCharts
- `NeuChip` — dismissible chip / tag
- `NeuCodeBlock` — syntax-highlighted code block with clipboard copy
- `NeuEmptyState` — empty state placeholder with icon, title, and action
- `NeuIcon` — icon wrapper for `@ng-icons/lucide`
- `NeuProgressBar` — linear progress bar with indeterminate mode
- `NeuRating` — star rating with half-star and readonly support
- `NeuSkeleton` — loading skeleton placeholder
- `NeuSpinner` — loading spinner with size and color variants
- `NeuSplitButton` — button with attached dropdown action menu
- `NeuStatsCard` — KPI card with trend indicator and sparkline
- `NeuTimeline` — vertical timeline with custom icons and connectors

**Feedback**

- `NeuToast` / `NeuToastService` — toast notification system with queue management
- `NeuTooltip` / `NeuTooltipDirective` — tooltip overlay with position variants

#### Infrastructure

- `provideNeuralUI()` — single setup function for `app.config.ts`
- `NeuUrlStateService` — URL query param state synchronization utility
- CSS custom properties theming system (colors, spacing, radius, typography)
- Full ARIA attributes and keyboard navigation across all interactive components
- 534 unit tests with ~91% line coverage (Vitest)
- Angular 19–22 compatibility

---

<!-- next release -->
<!-- ## [Unreleased] -->
