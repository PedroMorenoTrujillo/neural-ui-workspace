# Changelog

All notable changes to `@neural-ui/core` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

<!-- next release -->

---

## [1.5.1] - 2026-05-05

### Added

- `NeuSidebarComponent` — new `collapsed` input for icon-only mode in persistent sidebars (desktop layouts).
- `NeuSidebarComponent` — new `collapsedChange` output for two-way binding `[(collapsed)]`.

### Improved

- `NeuSidebarComponent` — enhanced a11y in drawer mode:
  - Dynamic `role="dialog"` + `aria-modal="true"` when sidebar is in drawer (non-persistent) mode.
  - Focus management: automatically moves focus to first focusable element when opening in drawer mode.
  - Focus trap: Tab/Shift+Tab navigation cycles within the drawer while open.
  - Focus restoration: returns focus to the previously active element when closing the drawer.
  - Updated tests: 7 new test cases for collapsed mode, role/aria-modal, and focus management.

---

## [1.5.0] - 2026-05-05

### Added

- `NeuTreeComponent` (`@neural-ui/core/tree`) — árbol jerárquico interactivo con soporte de expansión, selección simple/múltiple, lazy loading y teclado completo (flechas, Enter, Space).
- `NeuTreeTableComponent` (`@neural-ui/core/tree-table`) — tabla con filas expandibles en árbol, columnas configurables, selección y accesibilidad aria-treegrid.
- `NeuTimelineGridComponent` (`@neural-ui/core/timeline-grid`) — vista de timeline horizontal tipo Gantt con posicionamiento por rango de fechas y scroll libre.
- `NeuKanbanComponent` (`@neural-ui/core/kanban`) — tablero kanban con columnas, tarjetas drag-and-drop (CDK) y callbacks de cambio de estado.
- `NeuImageGalleryComponent` (`@neural-ui/core/image-gallery`) — galería de imágenes con grid, lightbox integrado y navegación por teclado.
- `NeuUploaderComponent` (`@neural-ui/core/uploader`) — componente de subida de archivos con drag-and-drop, validación de tipo/tamaño/duplicados, progreso y mensajes i18n totalmente configurables.

### Fixed

- `NeuUploaderComponent` — los fondos del dropzone y el estado de error ya no usan colores hardcoded (`rgba` fijo), sino `color-mix()` sobre tokens CSS (`--neu-primary`, `--neu-surface`, `--neu-error`); el componente ahora es totalmente compatible con temas oscuros y personalizados.
- `NeuCalendarComponent` — mejoras en la navegación de meses, selección de rango y layout responsivo.
- `NeuSelectComponent` / `NeuMultiselectComponent` — correcciones en sincronización de estado al usar `formControl` en combinación con cambios externos al valor.
- `NeuTableComponent` — se endurece el guard de resize para evitar excepciones en columnas sin ancho definido.
- `NeuSliderComponent` / `NeuStepperComponent` / `NeuPaginationComponent` — ajustes visuales de SCSS para compatibilidad con el sistema de tokens actualizado.

### Improved

- Design tokens (`styles/_tokens.scss`) — se añaden nuevas variables de espacio, radio y sombra para dar soporte a los nuevos componentes sin romper compatibilidad existente.
- La cobertura automatizada se mantiene por encima del 96% statements con 1615+ tests pasando.

---

## [1.4.0] - 2026-05-04

### Added

- `NeuAutocompleteComponent` añade `virtualScroll` y `virtualScrollVisibleItems` para datasets largos, renderizando resultados con `cdk-virtual-scroll-viewport` y manteniendo la navegación por teclado sincronizada con el viewport.
- `@neural-ui/core/modal` exporta ahora `NeuDialogService`, permitiendo abrir diálogos programáticamente sobre la misma base visual y de tamaños que `NeuDialogComponent`.

### Fixed

- Se reforzó el comportamiento interactivo de `NeuSelectComponent`, `NeuMultiselectComponent`, `NeuTableComponent`, `NeuTabsComponent` y `NeuUrlStateService` para reducir trabajo reactivo innecesario y estabilizar escenarios de interacción complejos en navegación, filtros y query params.
- `NeuModalComponent` y `NeuSidebarComponent` endurecen su gestión de foco, scroll y sincronización de estado, reduciendo regresiones en flujos overlay y navegación responsive.

### Improved

- La cobertura automatizada sube a 1615 tests con una instantánea validada de 96.75% statements, 95.67% branches, 94.98% functions y 98.02% lines.
- README, documentación de calidad y ejemplos públicos se alinean con el estado actual de la librería: signals-first, standalone, OnPush, zoneless-oriented y con una base de accesibilidad de alta confianza.

---

## [1.3.2] - 2026-04-17

### Fixed

- `NeuTabsComponent` ya no inicia la captura de puntero cuando la interacción comienza sobre un botón de pestaña, corrigiendo un fallo real en navegador que impedía cambiar de tab en la showcase publicada.
- Se añadió una prueba de regresión para asegurar que los clicks en tabs siguen funcionando aunque exista lógica de drag en la barra.

---

## [1.3.1] - 2026-04-17

### Fixed

- `NeuSelectComponent` y `NeuMultiselectComponent` ahora usan una estructura de trigger válida para el patrón combobox, evitando botones anidados y mejorando la compatibilidad con lectores de pantalla y navegación por teclado.
- `NeuAutocompleteComponent` mejora la navegación por teclado evitando opciones deshabilitadas y expone estados de ayuda y error mediante `aria-describedby` y `aria-invalid`.
- `NeuTabsComponent` corrige la estructura ARIA para renderizar un único `tablist` y mejora la usabilidad de barras de pestañas largas con arrastre horizontal y auto-scroll al tab activo.

### Improved

- Se redujo el trabajo reactivo innecesario en `NeuTableComponent`, `NeuSelectComponent`, `NeuMultiselectComponent` y `NeuTabsComponent` memoizando señales de query params y evitando recreaciones repetidas.
- La accesibilidad base de componentes interactivos se reforzó con live regions, texto auxiliar semántico, estados de error consistentes y mejoras de foco visible.
- La showcase fue alineada con los cambios de rendimiento y accesibilidad: navegación inicial corregida a `/home`, sincronización de título optimizada, demos con configuradores más granulares y documentación validada con build, unit tests y Playwright.

---

## [1.3.0] - 2026-04-16

### Fixed

- Publishing workflow now verifies that the pushed git tag matches the built package version before running `npm publish`.

### Improved

- Quality documentation refreshed across the workspace: README metrics now reflect the current validation snapshot with 1440 passing tests and 96.33% statements coverage.
- Added a formal quality and accessibility status document for `@neural-ui/core`, summarizing architecture alignment, testing thresholds, zoneless readiness and current accessibility confidence.
- Expanded automated test coverage in several complex components, pushing the library-wide baseline above 96% statements, 95% branches and 91% functions.
- README documentation was aligned with the published package structure: dedicated subpath imports, real theme token names, and current release guidance for `@neural-ui/core` 1.3.0.

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
