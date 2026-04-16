# Changelog

All notable changes to `@neural-ui/core` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-04-16

### Fixed

- Publishing workflow now verifies that the pushed git tag matches the built package version before running `npm publish`.

### Improved

- Quality documentation refreshed across the workspace: README metrics now reflect the current validation snapshot with 1440 passing tests and 96.33% statements coverage.
- Added a formal quality and accessibility status document for `@neural-ui/core`, summarizing architecture alignment, testing thresholds, zoneless readiness and current accessibility confidence.
- Expanded automated test coverage in several complex components, pushing the library-wide baseline above 96% statements, 95% branches and 91% functions.
- README documentation was aligned with the published package structure: dedicated subpath imports, real theme token names, and current release guidance for `@neural-ui/core` 1.3.0.

---

## [Unreleased]

<!-- next release -->

## [1.2.1] - 2026-04-11

### Fixed

- `NeuMultiselectComponent` — añadido `:focus-visible` en `.neu-multiselect__trigger` para mostrar el anillo de foco en navegación por teclado (paridad con `NeuSelectComponent`).

### Improved

- Todos los comentarios JSDoc y de sección en los ficheros `.ts` y `.scss` de la librería ahora son bilingües (español / inglés) para mejorar la DX de consumidores en ambos idiomas.

---

## [1.2.0] - 2026-04-10

### Added

- `NeuSelectComponent` — nuevo output `(selectionChange)` que emite el objeto `NeuSelectOption` completo (incluyendo el campo `data`) al seleccionar una opción, o `null` al limpiar. El valor del `FormControl` sigue siendo `string`.
- `NeuMultiselectComponent` — nuevo output `(selectionChange)` que emite el array `NeuSelectOption[]` completo al cambiar la selección, o `[]` al limpiar. Los valores del `FormControl` siguen siendo `string[]`.
- `NeuSelectOption` — nuevo campo opcional `data?: unknown` para adjuntar el objeto de origen (p.ej. entidad de la API) sin transformación, accesible vía `(selectionChange)`.
- `NeuSelectComponent` / `NeuMultiselectComponent` — nuevo input `urlParam` (desde v1.1.x) que sincroniza el valor seleccionado con el query param indicado de la URL, con soporte a recarga de página.

---

## [1.1.2] - 2026-04-10

### Fixed

- `NeuSplitButton` — los estilos de los botones (`.neu-button`, variantes y tamaños) ahora se incluyen correctamente en el bundle del componente. El template usa `<button>` nativo con clases BEM, por lo que los estilos de `NeuButtonComponent` se incorporan via `@use` en el SCSS del split-button para garantizar que se inyectan en el DOM independientemente de si `NeuButtonComponent` se usa en la misma página.

---

## [1.1.1] - 2026-04-08

### Fixed

- Corregida la URL del showcase en `README.md` y `package.json` (`homepage`) — ahora apunta a [neural-ui-three.vercel.app](https://neural-ui-three.vercel.app).

---

## [1.1.0] - 2026-04-08

### Added

- `NeuMultiselect` — nueva propiedad `floatingLabel` (boolean, default `false`). Cuando está activa, el label se muestra dentro del campo como etiqueta flotante animada, consistente con `NeuInput`, `NeuSelect` y `NeuTextarea`.

### Fixed

- `NeuSelect` — el label ya no quedaba pegado al borde superior cuando el componente tenía un `placeholder` definido pero sin valor seleccionado. El placeholder ahora se oculta hasta que el desplegable está abierto, igual que `NeuInput`.
- `NeuTextarea` — el label flotante ahora usa el mismo patrón outlined que `NeuInput` (posicionado sobre el borde, con fondo de superficie y padding lateral).

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
