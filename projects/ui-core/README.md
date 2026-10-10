# @neural-ui/core

**Built for Angular. Designed for developers. Open to everyone.**

> Documentation and live examples for Neural UI 2 → [ui.neuralui.org/v2/](https://ui.neuralui.org/v2/)

<p>
  <a href="https://www.npmjs.com/package/@neural-ui/core"><img src="https://img.shields.io/npm/v/@neural-ui/core?color=0ea5e9&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@neural-ui/core"><img src="https://img.shields.io/npm/dm/@neural-ui/core?color=6366f1" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/Angular-22-dd0031?logo=angular" alt="Angular 22" />
  <img src="https://img.shields.io/badge/quality-release%20gated-22c55e" alt="Release gated quality" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" />
</p>

Modern Angular UI component library — **signals-first**, fully **standalone**, with dedicated subpath entry points. Built for Angular 22 with OnPush change detection and no Zone.js requirement.

---

## Features

- **94 public components** — forms, navigation, data, overlays, feedback and display, with dedicated subpath entry points
- **Signals API** — inputs, outputs and internal state are built with `input()`, `output()`, `signal()`, `computed()` and `effect()`
- **Standalone** — every component is standalone, import only what you need
- **OnPush everywhere** — maximum performance out of the box
- **Accessible by design** — ARIA attributes, keyboard navigation and focus management across the main interactive components
- **Release-gated** — unit, package, Angular compatibility and SSR checks, complemented by showcase accessibility and browser audits
- **Themeable** — full design token system via CSS custom properties
- **Controlled state and Signal Forms** — explicit value/model contracts and Angular 22 form integration
- **Icon-provider agnostic** — structural icons work without an external icon package; optional resolvers are application-owned
- **SSR-aware configuration** — explicit locale, timezone and injectable clock for deterministic rendering

---

## Architecture

A modern, open-source Angular component library. Not a fork. Not a wrapper. Built with its own architecture.

Neural UI implements its own components, state contracts and design tokens. Its signals-first, standalone architecture uses dedicated entry points so applications import only what they need. Angular CDK provides supporting infrastructure for capabilities such as overlays and accessibility; it does not replace Neural UI's component implementation.

## Quality Snapshot

<!-- neural-ui-metrics:start -->
- **Version:** 2.0.0
- **Entry points:** 100
- **Automated tests:** 3230
- **Coverage:** 96.9% statements · 95.06% branches · 95.94% functions · 98.14% lines
<!-- neural-ui-metrics:end -->

- Signals-first architecture across `ui-core`
- Standalone + OnPush component model
- Zoneless-oriented test setup
- Neural UI 2 release coverage passes the exact 95.01% floor on statements, branches, functions and lines in the full canonical run
- Strong accessibility baseline validated in showcase and reinforced in core components

For the current quality checklist and accessibility audit snapshot, see
[the repository quality status](https://github.com/PedroMorenoTrujillo/neural-ui-workspace/blob/main/projects/ui-core/QUALITY_STATUS.md).
The exact-count coverage gate is enforced by `npm run test:coverage` and the release verifier.

---

## Installation

```bash
npm install @neural-ui/core@2.0.0 @angular/cdk@22
```

---

## Setup

Use Angular 22 and a Node.js version compatible with its CLI:
`^22.22.3 || ^24.15.0 || >=26.0.0`. Keep Angular packages on compatible versions.
External icon packages are optional, not peer dependencies of Core.

Automated, additive setup / Configuración automática y aditiva:

```bash
ng add @neural-ui/core@2.0.0
ng generate @neural-ui/core:theme --density=comfortable --theme=high-contrast
ng generate @neural-ui/core:layout app-shell
ng generate @neural-ui/core:dashboard sales
ng generate @neural-ui/core:crud-page customers
```

Commands are idempotent. Existing providers and styles are preserved, and generated files require `--force` to be replaced. Use `--skip-styles` with `ng add` for manual style registration. / Los comandos son idempotentes, conservan providers y estilos y solo sustituyen archivos con `--force`.

| Schematic                | Public options / Opciones públicas                                                                          | Result / Resultado                                                                                                                                                     | Revert / Reversión                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ng add @neural-ui/core` | `--project`, `--skip-styles`                                                                                | Adds `provideNeuralUI()` and the global Neural UI stylesheet without deleting existing configuration. / Añade el provider y el estilo global sin borrar configuración. | Remove only the provider and style entry added by the command. / Elimina solo el provider y la entrada de estilo añadidos.                |
| `:theme`          | `--name`, `--path`, `--density=compact\|comfortable\|spacious`, `--theme=default\|high-contrast`, `--force` | Creates `[path]/[name].scss`; default: `src/styles/neural-ui-theme.scss`. / Crea el preset SCSS.                                                                       | Delete the file and any import or `data-neu-*` attributes added by the consumer. / Elimina el archivo y los imports o atributos añadidos. |
| `:layout NAME`           | `--project`, `--path`, `--force`                                                                            | Generates `.ts`, `.html` and `.scss` with a mobile-first sidebar/toolbar shell. / Genera una base mobile-first con sidebar y toolbar.                                  | Delete the directory and its manually added route. / Elimina el directorio y su ruta añadida manualmente.                                 |
| `:dashboard NAME`        | `--project`, `--path`, `--force`                                                                            | Generates the three component files with responsive metric/card foundations. / Genera una base responsive de métricas y tarjetas.                                      | Delete the directory and its manually added route. / Elimina el directorio y su ruta añadida manualmente.                                 |
| `:crud-page NAME`        | `--project`, `--path`, `--force`                                                                            | Generates the three component files with Signal Forms, input, table and actions. / Genera una base CRUD con Signal Forms, input, tabla y acciones.          | Delete the directory and its manually added route. / Elimina el directorio y su ruta añadida manualmente.                                 |

Generated page copy is starter content and must be connected to the consumer application's translation system before release. / Los textos generados son contenido inicial y deben conectarse al sistema de traducciones de la aplicación antes de publicar.

Add `provideNeuralUI()` to your `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideNeuralUI } from '@neural-ui/core';

export const appConfig: ApplicationConfig = {
  providers: [provideNeuralUI()],
};
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

### Table server query contract

Import `NeuTableQueryState` from `@neural-ui/core/table` for server-backed
tables. Its canonical query includes 1-based `page`, `pageSize`, global
`search`, sorting and complete typed column-filter constraints.
Supplying `[query]` controls the query: `queryChange` proposes an immutable
replacement and the application echoes the accepted state. The existing
`serverStateChange` output remains a compatibility projection.

With `serverSide=true`, `lazyLoadOnInit=true` opts into one initial load after
initial state is resolved; it defaults to `false`. Server serialization is
explicit: custom predicates need `serverSerializer`, and values that cannot
be transported safely are marked `local-only` or `requires-consumer` instead
of silently losing information. The query's `serialization` summary reports
these cases. See the [Table API and examples](https://ui.neuralui.org/v2/en/components/table).

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
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuInputComponent } from '@neural-ui/core/input';

@Component({
  selector: 'app-login',
  imports: [NeuButtonComponent, NeuInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <neu-input
      label="Email"
      type="email"
      [value]="email()"
      (valueChange)="email.set($event)"
    />
    <button
      neu-button
      type="button"
      tone="brand"
      variant="solid"
      [disabled]="!email()"
      (click)="submit()"
    >
      Send
    </button>
    @if (submittedEmail(); as submitted) {
      <p role="status">Submitted: {{ submitted }}</p>
    }
  `,
})
export class LoginComponent {
  readonly email = signal('');
  readonly submittedEmail = signal<string | null>(null);

  submit(): void {
    this.submittedEmail.set(this.email());
  }
}
```

---

## Signal Forms and state ownership

Editable controls expose their documented value/model and change events. The
application owns authoritative state; controlled outputs propose a change and
the application echoes the accepted value. Use Angular 22 Signal Forms through
`FormField` when building a form:

```typescript
import { Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { NeuInputComponent } from '@neural-ui/core/input';

@Component({
  selector: 'app-email-field',
  imports: [NeuInputComponent, FormField],
  template: `
    <neu-input label="Email" type="email" [formField]="fields.email" />
  `,
})
export class EmailFieldComponent {
  readonly model = signal({ email: '' });
  readonly fields = form(this.model);
}
```

V1 `[formControl]`/`ngModel` examples are not interchangeable with V2
`[formField]`. Migrate to Signal Forms or connect the documented value/change
bindings to your application-owned form state explicitly.

See [Signal Forms](https://ui.neuralui.org/v2/en/foundations/signal-forms) and
[state ownership](https://ui.neuralui.org/v2/en/foundations/state-ownership).

## Themes, icons and public types

Core includes light/dark tokens, density presets and high-contrast support.
Use `data-theme="dark"` on the document root to select dark appearance.
`data-neu-density` accepts `compact`, `comfortable` and `spacious`;
`data-neu-theme="high-contrast"` enables the high-contrast preset.

A typed, named preset can be installed without a custom build script:

```typescript
import { ApplicationConfig } from '@angular/core';
import { defineNeuPreset, provideNeuralUI } from '@neural-ui/core';

const productPreset = defineNeuPreset({
  name: 'product',
  light: { '--neu-primary': '#2563eb' },
  dark: { '--neu-primary': '#60a5fa' },
});

export const appConfig: ApplicationConfig = {
  providers: [provideNeuralUI({ theme: { preset: productPreset } })],
};
```

Public CSS tokens are also available from
`@neural-ui/core/token-manifest.json`. Read the
[theming guide](https://ui.neuralui.org/v2/en/foundations/theming) for custom
tokens, scoped themes, forced colors and CSP-aware preset registration.

Structural icons have built-in Core fallbacks. An optional application-owned
resolver is registered with `provideNeuIconResolver` from
`@neural-ui/core/foundation`; no external icon renderer is mandatory.
See the [icons guide](https://ui.neuralui.org/v2/en/foundations/icons).

Import public interfaces, event types and models from the owning entry point,
not internal source paths. For example:

```typescript
import type { NeuButtonTone, NeuButtonVariant } from '@neural-ui/core/button';

const tone: NeuButtonTone = 'success';
const variant: NeuButtonVariant = 'outline';
```

Button tones are `brand`, `neutral`, `success`, `info`, `warning` and
`danger`; variants are `solid`, `outline` and `ghost`. Other components
have their own documented contracts; do not assume their `variant` names
mean the same thing.

## Components

Representative entry points:

Single-select and multiselect use `NeuSelectComponent` from
`@neural-ui/core/select`. Set `mode="multiple"` for multiselect;
there is no separate multiselect component or package export.

- **Forms**: `@neural-ui/core/input`, `@neural-ui/core/select`, `@neural-ui/core/autocomplete`, `@neural-ui/core/input-tags`, `@neural-ui/core/date-input`, `@neural-ui/core/number-input`, `@neural-ui/core/input-otp`
- **Navigation and layout**: `@neural-ui/core/tabs`, `@neural-ui/core/nav`, `@neural-ui/core/sidebar`, `@neural-ui/core/menu`, `@neural-ui/core/dock`, `@neural-ui/core/speed-dial`, `@neural-ui/core/mega-menu`, `@neural-ui/core/accordion`, `@neural-ui/core/toolbar`, `@neural-ui/core/dashboard-grid`
- **Data and overlays**: `@neural-ui/core/table`, `@neural-ui/core/tree`, `@neural-ui/core/tree-table`, `@neural-ui/core/modal`, `@neural-ui/core/popover`, `@neural-ui/core/context-menu`, `@neural-ui/core/command-palette`, `@neural-ui/core/virtual-list`, `@neural-ui/core/confirm-dialog`
- **Rich data display**: `@neural-ui/core/kanban`, `@neural-ui/core/timeline-grid`, `@neural-ui/core/gallery`, `@neural-ui/core/uploader`
- **Feedback and utilities**: `@neural-ui/core/alert`, `@neural-ui/core/toast`, `@neural-ui/core/tooltip`, `@neural-ui/core/block-ui`, `@neural-ui/core/url-state`
- **Visualization and display**: `@neural-ui/core/compare`, `@neural-ui/core/stats-card`, `@neural-ui/core/timeline`, `@neural-ui/core/timeline-grid`, `@neural-ui/core/meter-group`, `@neural-ui/core/knob`

For the complete catalog, interactive configurators, examples and API tables, use
the [Neural UI 2 showcase](https://ui.neuralui.org/v2/). Each page documents Inputs,
Outputs, Models, Public Types and Templates, including the public imports.

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
| `@angular-devkit/schematics` | `>=22.0.0 <23.0.0` |
| `@schematics/angular` | `>=22.0.0 <23.0.0` |

Neural UI 2.x supports Angular 22 only. Follow the V2 migration guidance before
upgrading an existing 1.x application; the V1 documentation has its own
compatibility requirements. Do not mix V1 components or examples with V2 imports.

### Migrating from 1.x

Neural UI 2 is a major release, not a drop-in upgrade. Update component
imports, templates, value/event bindings and forms together. Do not import
components from the package root or from private implementation paths.

| V1 entry point | V2 direction |
| --- | --- |
| `@neural-ui/core/multiselect` | `NeuSelectComponent` from `@neural-ui/core/select`, with `mode="multiple"` |
| `@neural-ui/core/image-gallery` | Review the new `@neural-ui/core/gallery` API |
| `@neural-ui/core/image-compare` | Review the new `@neural-ui/core/compare` API |
| `@neural-ui/core/tags` | Review the new `@neural-ui/core/input-tags` API |
| `@neural-ui/core/icon` | Application-owned icons and the optional foundation icon resolver |
| `@neural-ui/core/panel-menu`, `@neural-ui/core/org-chart`, `@neural-ui/core/scheduler-gantt` | These legacy entry points are not exported by Core 2.0.0; there is no drop-in replacement |

These are migration directions, not automatic renames: compare each V2 API
and its examples before replacing a V1 component.

### Charts in Neural UI 2

Neural UI 1.x included the `@neural-ui/core/chart` entry point backed by ApexCharts.
That entry point is **removed in Neural UI 2.0**. Charts are not replaced by another
library inside Neural UI; Neural Charts is planned as a separate future product, with
no package name or release date announced.

---

## License

Neural UI was created and is maintained by [Pedro Moreno Trujillo](https://github.com/PedroMorenoTrujillo).

Copyright © 2026 Pedro Moreno Trujillo. Released under the MIT License.

## Previous version

Maintaining a Neural UI 1.x application? Use the separate
[Neural UI v1 showcase and documentation](https://ui.neuralui.org/v1/).
Its examples and compatibility requirements apply to V1, not this 2.0.0 package.
