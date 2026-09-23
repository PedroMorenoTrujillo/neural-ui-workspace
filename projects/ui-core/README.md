# @neural-ui/core

<p>
  <a href="https://www.npmjs.com/package/@neural-ui/core"><img src="https://img.shields.io/npm/v/@neural-ui/core?color=0ea5e9&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@neural-ui/core"><img src="https://img.shields.io/npm/dm/@neural-ui/core?color=6366f1" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/Angular-22-dd0031?logo=angular" alt="Angular 22" />
  <img src="https://img.shields.io/badge/quality-release%20gated-22c55e" alt="Release gated quality" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" />
</p>

Modern Angular UI component library — **signals-first**, fully **standalone**, with dedicated subpath entry points and no Zone.js requirement.  
Built exclusively for Angular 22 with OnPush change detection and no Zone.js requirement.

> Live documentation and examples → [neural-ui-three.vercel.app](https://neural-ui-three.vercel.app)

---

## Features

- **104 public entry points** — components, overlays, utilities, styles, schematics and public testing harnesses
- **Signals API** — inputs, outputs and internal state are built with `input()`, `output()`, `signal()`, `computed()` and `effect()`
- **Standalone** — every component is standalone, import only what you need
- **OnPush everywhere** — maximum performance out of the box
- **Accessible by design** — ARIA attributes, keyboard navigation and focus management across the main interactive components
- **Release-gated** — unit, package, compatibility, SSR, accessibility and browser checks run before publication
- **Themeable** — full design token system via CSS custom properties

---

## Quality Snapshot

<!-- neural-ui-metrics:start -->
- **Version:** 1.15.0
- **Entry points:** 103
- **Automated tests:** 3270
- **Coverage:** 98.12% statements · 95.96% branches · 98.6% functions · 98.88% lines
<!-- neural-ui-metrics:end -->

- Signals-first architecture across `ui-core`
- Standalone + OnPush component model
- Zoneless-oriented test setup
- Global coverage above 90% in all main metrics
- Strong accessibility baseline validated in showcase and reinforced in core components

For the current quality checklist and accessibility audit snapshot, see [QUALITY_STATUS.md](./QUALITY_STATUS.md).

---

## Installation

```bash
npm install @neural-ui/core @angular/cdk @ng-icons/core @ng-icons/lucide
```

---

## Setup

Automated, additive setup / Configuración automática y aditiva:

```bash
ng add @neural-ui/core
ng generate @neural-ui/core:theme --density=comfortable --theme=high-contrast
ng generate @neural-ui/core:layout app-shell
ng generate @neural-ui/core:dashboard sales
ng generate @neural-ui/core:crud-page customers
```

Commands are idempotent. Existing providers and styles are preserved, and generated files require `--force` to be replaced. Use `--skip-styles` with `ng add` for manual style registration. / Los comandos son idempotentes, conservan providers y estilos y solo sustituyen archivos con `--force`.

| Schematic                | Public options / Opciones públicas                                                                          | Result / Resultado                                                                                                                                                     | Revert / Reversión                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ng add @neural-ui/core` | `--project`, `--skip-styles`                                                                                | Adds `provideNeuralUI()` and the global Neural UI stylesheet without deleting existing configuration. / Añade el provider y el estilo global sin borrar configuración. | Remove only the provider and style entry added by the command. / Elimina solo el provider y la entrada de estilo añadidos.                |
| `:theme [name]`          | `--name`, `--path`, `--density=compact\|comfortable\|spacious`, `--theme=default\|high-contrast`, `--force` | Creates `[path]/[name].scss`; default: `src/styles/neural-ui-theme.scss`. / Crea el preset SCSS.                                                                       | Delete the file and any import or `data-neu-*` attributes added by the consumer. / Elimina el archivo y los imports o atributos añadidos. |
| `:layout NAME`           | `--project`, `--path`, `--force`                                                                            | Generates `.ts`, `.html` and `.scss` with a mobile-first sidebar/toolbar shell. / Genera una base mobile-first con sidebar y toolbar.                                  | Delete the directory and its manually added route. / Elimina el directorio y su ruta añadida manualmente.                                 |
| `:dashboard NAME`        | `--project`, `--path`, `--force`                                                                            | Generates the three component files with responsive metric/card foundations. / Genera una base responsive de métricas y tarjetas.                                      | Delete the directory and its manually added route. / Elimina el directorio y su ruta añadida manualmente.                                 |
| `:crud-page NAME`        | `--project`, `--path`, `--force`                                                                            | Generates the three component files with Reactive Forms, input, table and actions. / Genera una base CRUD con formularios reactivos, input, tabla y acciones.          | Delete the directory and its manually added route. / Elimina el directorio y su ruta añadida manualmente.                                 |

Generated page copy is starter content and must be connected to the consumer application's translation system before release. / Los textos generados son contenido inicial y deben conectarse al sistema de traducciones de la aplicación antes de publicar.

Add `provideNeuralUI()` to your `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNeuralUI } from '@neural-ui/core';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideNeuralUI()],
};
```

Optionally customize global icon defaults:

```typescript
provideNeuralUI({ iconSize: '1rem', iconStrokeWidth: '1.5' });
```

Import the global stylesheet in your `styles.scss`:

```scss
@use '@neural-ui/core/styles' as *;
```

Component APIs are imported from dedicated subpaths. The package root is reserved for setup utilities such as `provideNeuralUI()`.

```typescript
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuTableComponent } from '@neural-ui/core/table';
import { NeuToastService } from '@neural-ui/core/toast';
```

### Table selection / Selección de Table

Use `selectionMode="single"` for radio selection or `selectionMode="multiple"` for checkbox selection. `[selectable]="true"` remains the legacy uncontrolled-multiple alias. Passing `[selection]` makes only that slice controlled and supports preselection by `rowKey`; `selectionChange` emits the proposed `T[]` once, then the consumer echoes the authoritative replacement. / Usa `selectionMode="single"` para radio o `selectionMode="multiple"` para checkbox. `[selectable]="true"` conserva la compatibilidad múltiple no controlada. `[selection]` controla solo esa parte y permite preselección por `rowKey`.

`rowSelectable` disables interaction without deleting an existing controlled selection. `selectAllScope="page"` affects the current page and `"filtered"` affects filtered client rows; the default accessible label follows that scope and `selectAllAriaLabel` remains an override. In server mode both are truthful loaded-row scopes, never all server records. If canonical keys cannot resolve to loaded rows, the bar reports resolved/canonical counts and hides row-dependent actions at zero resolved rows without deleting unknown keys. / `rowSelectable` deshabilita la interacción sin borrar una selección controlada. La etiqueta accesible predeterminada distingue “todas las filas filtradas” de “todas las filas de esta página”. En servidor se muestran los recuentos resuelto/canónico y se ocultan las acciones que necesitan filas cuando no hay ninguna resuelta, sin borrar claves desconocidas.

`rowSelect`/`rowUnselect` are row deltas and `selectAllChange` is aggregate. Single replacement order is `selectionChange`, `rowUnselect(previous)`, `rowSelect(next)`; a controlled echo is silent. Event arrays are isolated and `selectedRows()` is shallow-frozen while preserving `T` identity. `rowKey` values should be unique; with duplicates all matching rows render selected and the first current-data occurrence wins resolution. Selection persists across filtering, sorting, pagination, virtual scrolling and immutable row replacement. / Los arrays de eventos están aislados, la proyección conserva la identidad de `T` y la primera fila actual gana si hay claves duplicadas.

### Table body composition / Composición del cuerpo de Table

Use `neuTableBody` when Neural should own each primary `<tr>` and your template should own its cells. Use `neuTableBodySection` for full `<tbody>` composition, including multiple sibling rows per record. The section outlet takes precedence if both templates are present. Apply `[neuTableManagedRow]="entry"` to the primary data row to retain selection, keyboard focus, ARIA, context-menu and reorder behavior; extra sibling rows remain consumer-owned. `[neuTableBodySectionOf]="rows"` optionally anchors exact row typing under `strictTemplates`. Unlimited sibling rows are supported outside virtualization; virtual contexts expose `siblingRowsSupported=false` because variable-height extra rows are not virtual records. / Usa `neuTableBody` para personalizar celdas y `neuTableBodySection` para controlar filas completas dentro de `<tbody>`.

### Presets and testing / Presets y testing

The existing appearance remains the default. Opt in with `data-neu-density="compact|comfortable|spacious"` and optionally `data-neu-theme="high-contrast"`. Remove the attributes to revert.

```typescript
import { NeuButtonHarness, NeuInputHarness } from '@neural-ui/core/testing';
```

The testing entry point provides stable Component Harnesses for button, input, checkbox, switch, select, date input, table and dialog. / El entry point de testing ofrece Component Harnesses estables sin depender del DOM interno.

---

## Usage

Import any component directly into your standalone component:

```typescript
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuInputComponent } from '@neural-ui/core/input';

@Component({
  imports: [NeuButtonComponent, NeuInputComponent, ReactiveFormsModule],
  template: `
    <neu-input label="Email" type="email" [formControl]="email" />
    <neu-button variant="primary" (click)="submit()">Send</neu-button>
  `,
})
export class LoginComponent {
  email = new FormControl('');
}
```

---

## Components

Representative entry points:

- **Forms**: `@neural-ui/core/input`, `@neural-ui/core/select`, `@neural-ui/core/autocomplete`, `@neural-ui/core/input-tags`, `@neural-ui/core/date-input`, `@neural-ui/core/number-input`, `@neural-ui/core/input-otp`
- **Navigation and layout**: `@neural-ui/core/tabs`, `@neural-ui/core/nav`, `@neural-ui/core/sidebar`, `@neural-ui/core/menu`, `@neural-ui/core/dock`, `@neural-ui/core/speed-dial`, `@neural-ui/core/mega-menu`, `@neural-ui/core/accordion`, `@neural-ui/core/toolbar`, `@neural-ui/core/dashboard-grid`
- **Data and overlays**: `@neural-ui/core/table`, `@neural-ui/core/modal`, `@neural-ui/core/popover`, `@neural-ui/core/context-menu`, `@neural-ui/core/command-palette`, `@neural-ui/core/virtual-list`, `@neural-ui/core/confirm-dialog`
- **Feedback and utilities**: `@neural-ui/core/alert`, `@neural-ui/core/toast`, `@neural-ui/core/tooltip`, `@neural-ui/core/block-ui`, `@neural-ui/core/url-state`
- **Visualization and display**: `@neural-ui/core/compare`, `@neural-ui/core/stats-card`, `@neural-ui/core/timeline`, `@neural-ui/core/timeline-grid`, `@neural-ui/core/meter-group`, `@neural-ui/core/knob`

For the complete catalog, examples, and API tables, use the live docs at [neural-ui-three.vercel.app](https://neural-ui-three.vercel.app).

### Highlights

- `NeuAutocompleteComponent` supports virtual scroll for large result sets.
- `@neural-ui/core/modal` now includes `NeuDialogService` for programmatic dialogs.
- Select (single and multiple), tabs, table, modal and URL-state flows were hardened with focused regression coverage.

---

## Theming

All visual properties are controlled via CSS custom properties. Override them in your global stylesheet:

```scss
:root {
  --neu-primary: #2563eb;
  --neu-primary-dark: #1d4ed8;
  --neu-primary-50: #eff6ff;
  --neu-surface: #ffffff;
  --neu-surface-2: #f8fafc;
  --neu-border: rgba(15, 23, 42, 0.08);
  --neu-text: #0f172a;
  --neu-text-muted: #64748b;
  --neu-success: #10b981;
  --neu-warning: #f59e0b;
  --neu-error: #ef4444;
  --neu-radius: 10px;
  --neu-space-4: 1rem;
  --neu-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  --neu-focus-ring: 0 0 0 3px rgba(37, 99, 235, 0.18);
}
```

For the full token list, see `styles/_tokens.scss` in the published package source.

---

## Peer dependencies

| Package            | Required version   |
| ------------------ | ------------------ |
| `@angular/core`    | `>=22.0.0 <23.0.0` |
| `@angular/cdk`     | `>=22.0.0 <23.0.0` |
| `@angular/common`  | `>=22.0.0 <23.0.0` |
| `@angular/forms`   | `>=22.0.0 <23.0.0` |
| `@angular/router`  | `>=22.0.0 <23.0.0` |
| `@ng-icons/core`   | `>=31.4.0 <34.0.0` |
| `@ng-icons/lucide` | `>=31.4.0 <34.0.0` |

Neural UI 2.x supports Angular 22 only. Angular 19–22 applications that cannot yet
adopt the Angular 22-only line should remain on Neural UI 1.x.

### Charts in Neural UI 2

Neural UI 1.x included the `@neural-ui/core/chart` entry point backed by ApexCharts.
That entry point is **removed in Neural UI 2.0**. Charts are not replaced by another
library inside Neural UI; Neural Charts is planned as a separate future product, with
no package name or release date announced.

---

## License

Neural UI was created and is maintained by [Pedro Moreno Trujillo](https://github.com/PedroMorenoTrujillo).

Copyright © 2026 Pedro Moreno Trujillo. Released under the MIT License.

## Typed presets / Presets tipados

Define a named preset with `defineNeuPreset()` and register it through `provideNeuralUI({ theme: { preset } })`. Neural validates its public token names, installs the CSS and activates the preset at startup. No custom build script, `index.html` edit or extra `angular.json` entry is required. Light/dark maps follow `data-theme`; high contrast and forced colors take precedence. See `docs/THEMING_PRESETS.md` and Showcase Theming.

Define un preset con nombre mediante `defineNeuPreset()` y regístralo con `provideNeuralUI({ theme: { preset } })`. Neural valida los tokens públicos, instala el CSS y activa el preset al arrancar. No hacen falta scripts propios, cambios en `index.html` ni otra entrada en `angular.json`. Los mapas claro/oscuro siguen `data-theme`; alto contraste y colores forzados tienen prioridad. Consulta `docs/THEMING_PRESETS.md` y Theming en Showcase.
