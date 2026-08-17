# @neural-ui/core

<p>
  <a href="https://www.npmjs.com/package/@neural-ui/core"><img src="https://img.shields.io/npm/v/@neural-ui/core?color=0ea5e9&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@neural-ui/core"><img src="https://img.shields.io/npm/dm/@neural-ui/core?color=6366f1" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/Angular-19--22-dd0031?logo=angular" alt="Angular 19-22" />
  <img src="https://img.shields.io/badge/quality-release%20gated-22c55e" alt="Release gated quality" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" />
</p>

Modern Angular UI component library — **signals-first**, fully **standalone**, with dedicated subpath entry points and no Zone.js requirement.  
Built for Angular 19–22 with OnPush change detection and no Zone.js requirement.

> Live documentation and examples → [neural-ui-showcase.vercel.app](https://neural-ui-showcase.vercel.app)

---

## Features

- **89 component entry points + testing** — components, overlays, utilities, styles and public harnesses
- **Signals API** — inputs, outputs and internal state are built with `input()`, `output()`, `signal()`, `computed()` and `effect()`
- **Standalone** — every component is standalone, import only what you need
- **OnPush everywhere** — maximum performance out of the box
- **Accessible by design** — ARIA attributes, keyboard navigation and focus management across the main interactive components
- **Locale and direction aware** — English/Spanish defaults follow the document language, while Angular CDK `Directionality` drives live LTR/RTL behavior
- **Release-gated** — unit, package, compatibility, SSR, accessibility and browser checks run before publication
- **Themeable** — full design token system via CSS custom properties

---

## Quality Snapshot

<!-- neural-ui-metrics:start -->
- **Version:** 1.14.1
- **Entry points:** 90
- **Automated tests:** 2218
- **Coverage:** 97.45% statements · 95.36% branches · 96.19% functions · 98.82% lines
- **Public component harnesses:** 62 interactive entry points · 28 justified N/A
- **Showcase evidence:** 91 demos · 88 API pages · 384/384 accessibility · 288 RTL · 2880 responsive checks
- **Quality matrix:** 1312 PASS · 108 N/A · 560 pending human validation
- **Visual evidence:** 464 tracked snapshots · explicit human approval required
<!-- neural-ui-metrics:end -->

- Signals-first architecture across `ui-core`
- Standalone + OnPush component model
- Zoneless-oriented test setup
- Global coverage above the enforced 95% floor in every main metric
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

### Presets and testing / Presets y testing

The existing appearance remains the default. Opt in with `data-neu-density="compact|comfortable|spacious"` and optionally `data-neu-theme="high-contrast"`. Remove the attributes to revert.

```typescript
import { NeuButtonHarness, NeuInputHarness } from '@neural-ui/core/testing';
```

The dedicated testing entry point exports 62 Angular CDK harnesses: one for every interactive public entry point. The remaining 19 entry points are presentational, layout or utility APIs and are explicitly classified as not applicable in the quality matrix. / El entry point dedicado de testing exporta 62 harnesses de Angular CDK: uno para cada entry point público interactivo. Los 19 restantes son APIs de presentación, layout o utilidad y constan explícitamente como no aplicables en la matriz de calidad.

### Language and direction / Idioma y dirección

Locale-aware defaults read the document `lang` when the component is created: English is the fallback and `<html lang="es">` selects Spanish. Explicit component inputs always win, allowing consumer applications to provide any language through their own translation layer. / Los defaults sensibles al idioma leen `lang` al crear el componente: inglés es el fallback y `<html lang="es">` activa español. Los inputs explícitos siempre tienen prioridad.

Direction-sensitive components subscribe to Angular CDK `Directionality` and react to live `ltr`/`rtl` changes. This covers layout, directional icons, overlays and physical arrow-key behavior. The showcase RTL/LTR switch demonstrates this library behavior; it does not change language. / Los componentes sensibles a dirección reaccionan dinámicamente a `Directionality`, incluidos layout, iconos, overlays y navegación con flechas. El botón RTL/LTR del showcase demuestra esta capacidad y no cambia el idioma.

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

- **Forms**: `@neural-ui/core/input`, `@neural-ui/core/select`, `@neural-ui/core/multiselect`, `@neural-ui/core/autocomplete`, `@neural-ui/core/date-input`, `@neural-ui/core/number-input`, `@neural-ui/core/input-otp`
- **Navigation and layout**: `@neural-ui/core/tabs`, `@neural-ui/core/nav`, `@neural-ui/core/sidebar`, `@neural-ui/core/accordion`, `@neural-ui/core/toolbar`, `@neural-ui/core/dashboard-grid`
- **Data and overlays**: `@neural-ui/core/table`, `@neural-ui/core/modal`, `@neural-ui/core/popover`, `@neural-ui/core/context-menu`, `@neural-ui/core/command-palette`, `@neural-ui/core/virtual-list`, `@neural-ui/core/confirm-dialog`
- **Feedback and utilities**: `@neural-ui/core/alert`, `@neural-ui/core/toast`, `@neural-ui/core/tooltip`, `@neural-ui/core/block-ui`, `@neural-ui/core/url-state`
- **Visualization and display**: `@neural-ui/core/chart`, `@neural-ui/core/stats-card`, `@neural-ui/core/timeline`, `@neural-ui/core/timeline-grid`, `@neural-ui/core/scheduler-gantt`, `@neural-ui/core/meter-group`, `@neural-ui/core/knob`

For the complete catalog, examples, and API tables, use the live docs at [neural-ui-showcase.vercel.app](https://neural-ui-showcase.vercel.app).

### Highlights

- `NeuAutocompleteComponent` supports virtual scroll for large result sets.
- `@neural-ui/core/modal` now includes `NeuDialogService` for programmatic dialogs.
- `@neural-ui/core/scheduler-gantt` adds a date-driven planning layer on top of `timeline-grid` for roadmap and delivery views.
- Select, multiselect, tabs, table, modal and URL-state flows were hardened with focused regression coverage.

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
| `@angular/core`    | `>=19.0.0 <23.0.0` |
| `@angular/cdk`     | `>=19.0.0 <23.0.0` |
| `@angular/common`  | `>=19.0.0 <23.0.0` |
| `@angular/forms`   | `>=19.0.0 <23.0.0` |
| `@angular/router`  | `>=19.0.0 <23.0.0` |
| `@ng-icons/core`   | `>=31.4.0 <34.0.0` |
| `@ng-icons/lucide` | `>=31.4.0 <34.0.0` |

The Chart entry point uses the bundled MIT-licensed `chart.js` runtime and requires no charting peer dependency.

---

## License

MIT © [Pedro Moreno Trujillo](https://github.com/PedroMorenoTrujillo)
