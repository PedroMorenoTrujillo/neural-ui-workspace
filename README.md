# @neural-ui/core

<p>
  <a href="https://www.npmjs.com/package/@neural-ui/core"><img src="https://img.shields.io/npm/v/@neural-ui/core?color=0ea5e9&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@neural-ui/core"><img src="https://img.shields.io/npm/dm/@neural-ui/core?color=6366f1" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/Angular-19--22-dd0031?logo=angular" alt="Angular 19-22" />
  <img src="https://img.shields.io/badge/quality-release%20gated-22c55e" alt="Release gated quality" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" />
</p>

Modern Angular UI component library — **signals-first**, fully **standalone**, with dedicated subpath entry points and no Zone.js requirement.

> Live documentation and examples → [neural-ui-showcase.vercel.app](https://neural-ui-showcase.vercel.app)

> Building a full admin product? Try [Neural Admin Pro](https://neural-ui-admin-pro.vercel.app/login), a premium Angular dashboard template built with Neural UI and ready to connect to your own backend.

> Performance evidence is produced by a free, local laboratory using browser Performance APIs, Lighthouse CI and Size Limit. Results are regression budgets, not field-data claims or an adoption comparison with other libraries.

---

## Features

- **88 component entry points + url-state + testing** — components, overlays, utilities, styles and public harnesses
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
- **Version:** 1.14.3
- **Entry points:** 90
- **Automated tests:** 2218
- **Coverage:** 97.45% statements · 95.36% branches · 96.19% functions · 98.82% lines
- **Public component harnesses:** 71 interactive entry points · 19 justified N/A
- **Showcase evidence:** 91 demos · 88 API pages · 384/384 accessibility · 288 RTL · 2880 responsive checks
- **Quality matrix:** 1864 PASS · 116 N/A · 0 pending human validation
- **Visual evidence:** 464 tracked snapshots · human review approved
<!-- neural-ui-metrics:end -->

- Signals-first architecture across `ui-core`
- Standalone + OnPush component model
- BEM as the required styling convention for component and demo SCSS
- Zoneless-oriented test setup
- Global coverage above the enforced 95% floor in every main metric
- Strong accessibility baseline validated in showcase and reinforced in core components

For the current quality checklist and accessibility audit snapshot, see [projects/ui-core/QUALITY_STATUS.md](projects/ui-core/QUALITY_STATUS.md).

---

## Installation

```bash
npm install @neural-ui/core @angular/cdk @ng-icons/core @ng-icons/lucide
```

---

## Setup

Automated setup is additive and idempotent:

```bash
ng add @neural-ui/core
ng generate @neural-ui/core:theme --density=comfortable --theme=high-contrast
ng generate @neural-ui/core:layout app-shell
ng generate @neural-ui/core:dashboard sales
ng generate @neural-ui/core:crud-page customers
```

`ng add` preserves existing providers and styles. Re-running any command is safe; generated files are not replaced unless `--force` is supplied. Use `--skip-styles` to keep style registration manual.

La configuración automática es aditiva e idempotente: conserva providers y estilos existentes. Los archivos generados no se sustituyen salvo que se use `--force`; `--skip-styles` mantiene el registro de estilos manual.

| Schematic                | Public options / Opciones públicas                                                                          | Result / Resultado                                                                                                                                                                           | Revert / Reversión                                                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ng add @neural-ui/core` | `--project`, `--skip-styles`                                                                                | Adds `provideNeuralUI()` and `node_modules/@neural-ui/core/styles.scss` without removing existing providers or styles. / Añade el provider y el estilo sin eliminar configuración existente. | Remove only the provider and style entry added by the command. / Elimina únicamente el provider y la entrada de estilo añadidos.                                                   |
| `:theme [name]`          | `--name`, `--path`, `--density=compact\|comfortable\|spacious`, `--theme=default\|high-contrast`, `--force` | Creates `[path]/[name].scss`; defaults to `src/styles/neural-ui-theme.scss`. / Crea el preset SCSS en la ruta elegida.                                                                       | Delete the generated file and any import or `data-neu-*` attributes you added. / Elimina el archivo y los imports o atributos añadidos.                                            |
| `:layout NAME`           | `--project`, `--path`, `--force`                                                                            | Creates `NAME.component.ts`, `.html` and `.scss` with a mobile-first sidebar/toolbar shell.                                                                                                  | Delete the generated directory and any route you added; existing routes are not modified automatically. / Elimina el directorio y la ruta añadida; no se alteran rutas existentes. |
| `:dashboard NAME`        | `--project`, `--path`, `--force`                                                                            | Creates the three component files with responsive metric/card foundations. / Genera una base responsive de métricas y tarjetas.                                                              | Delete the generated directory and its manually added route. / Elimina el directorio y su ruta añadida manualmente.                                                                |
| `:crud-page NAME`        | `--project`, `--path`, `--force`                                                                            | Creates the three component files with Reactive Forms, input, table and actions. / Genera una base CRUD con formularios reactivos, input, tabla y acciones.                                  | Delete the generated directory and its manually added route. / Elimina el directorio y su ruta añadida manualmente.                                                                |

Generated page copy is starter content: connect it to the consumer application's translation system before shipping. / Los textos de las páginas generadas son contenido inicial: intégralos con el sistema de traducciones de la aplicación antes de publicar.

Add `provideNeuralUI()` to your `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNeuralUI } from '@neural-ui/core';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideNeuralUI()],
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

### Density and high contrast / Densidad y alto contraste

The current appearance remains the default. Opt in on `<html>` or a scoped shell:

```html
<html data-neu-density="compact" data-neu-theme="high-contrast"></html>
```

Available densities are `compact`, `comfortable`, and `spacious`. Remove the attributes to revert instantly to the existing default. / Las densidades disponibles son `compact`, `comfortable` y `spacious`. Elimina los atributos para volver al aspecto actual.

### Public testing API / API pública de testing

```typescript
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NeuInputHarness } from '@neural-ui/core/testing';

const loader = TestbedHarnessEnvironment.loader(fixture);
const input = await loader.getHarness(NeuInputHarness);
await input.setValue('Ada');
```

The dedicated testing entry point exports 71 Angular CDK harnesses: one for every interactive public entry point. The remaining 19 entry points (17 non-interactive components plus the `url-state` and `testing` utilities) are explicitly classified as not applicable in the quality matrix. / El entry point dedicado de testing exporta 71 harnesses de Angular CDK: uno para cada entry point público interactivo. Los 19 restantes (17 componentes no interactivos más las utilidades `url-state` y `testing`) constan explícitamente como no aplicables en la matriz de calidad.

### Language and direction / Idioma y dirección

Neural UI reads the document `lang` when creating locale-aware default copy. English is the fallback and Spanish is selected when `<html lang="es">` is active. Consumer inputs such as `placeholder`, `searchPlaceholder`, `ariaLabel` and the component-specific label inputs always take precedence, so applications can supply any language through their own translation system.

Neural UI usa el atributo `lang` del documento al crear los textos por defecto sensibles al idioma. Inglés es el fallback y español se activa con `<html lang="es">`. Los inputs públicos siempre tienen prioridad, por lo que cada aplicación puede proporcionar cualquier idioma desde su propio sistema de traducciones.

Direction-sensitive components subscribe to Angular CDK `Directionality`. Changing the application direction between `ltr` and `rtl` updates layouts, directional icons, overlays and physical arrow-key behavior without recreating the application. The live showcase header exposes an RTL/LTR switch for verification; it changes direction, not language.

Los componentes sensibles a la dirección usan `Directionality` de Angular CDK. El cambio dinámico entre `ltr` y `rtl` adapta layouts, iconos, overlays y navegación física con flechas. El botón RTL/LTR del showcase sirve para verificar esta capacidad y no cambia el idioma.

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
- **Data and overlays**: `@neural-ui/core/table`, `@neural-ui/core/tree`, `@neural-ui/core/tree-table`, `@neural-ui/core/modal`, `@neural-ui/core/popover`, `@neural-ui/core/context-menu`, `@neural-ui/core/command-palette`, `@neural-ui/core/virtual-list`, `@neural-ui/core/confirm-dialog`
- **Rich data display**: `@neural-ui/core/kanban`, `@neural-ui/core/timeline-grid`, `@neural-ui/core/image-gallery`, `@neural-ui/core/uploader`
- **Feedback and utilities**: `@neural-ui/core/alert`, `@neural-ui/core/toast`, `@neural-ui/core/tooltip`, `@neural-ui/core/block-ui`, `@neural-ui/core/url-state`
- **Visualization and display**: `@neural-ui/core/chart`, `@neural-ui/core/stats-card`, `@neural-ui/core/timeline`, `@neural-ui/core/meter-group`, `@neural-ui/core/knob`

For the complete catalog, examples, and API tables, use the live docs at [neural-ui-showcase.vercel.app](https://neural-ui-showcase.vercel.app).

---

## Neural Admin Pro

Build production-ready SaaS dashboards, CRM tools, internal business apps and client portals with Neural Admin Pro, a premium Angular dashboard template built with Neural UI.

Neural Admin Pro is a full-stack Angular and NestJS product with PostgreSQL, authentication, roles, workspaces and a public static demo. Its source can also be adapted to another backend when required.

- [Live demo](https://neural-ui-admin-pro.vercel.app/login)
- [Buy on Gumroad](https://trujillopete.gumroad.com/l/epbrur)
- [Buy on Payhip](https://payhip.com/b/0apB6)
- [Buy on Lemon Squeezy](https://pedromorenostordeve.lemonsqueezy.com/checkout/buy/52e743fd-bb93-4ce7-ae17-c8bf2718de3c)

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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the complete workflow.

Project policies: [security](./SECURITY.md) · [support](./SUPPORT.md) · [deprecations](./DEPRECATIONS.md) · [migrations](./MIGRATIONS.md) · [release checklist](./RELEASE.md)

---

## Known issues & workarounds

### Angular 20.x — npm peer resolution on install

**Affected versions:** Angular 20.x projects with mixed Angular/CDK minors  
**Symptom:** `npm install` may fail with `ERESOLVE` or peer dependency conflicts while installing `@neural-ui/core` and its required peers.

**Root cause:** Angular 20.x is supported, but installation can fail when `@angular/*` packages and `@angular/cdk` are not aligned to the same minor version in the host app.

**Solution — align Angular packages before installing:**

Make sure all Angular packages, especially `@angular/cdk`, use the same 20.x minor in your app, then reinstall dependencies.

```bash
npm install @angular/core@20.x @angular/common@20.x @angular/forms@20.x @angular/router@20.x @angular/cdk@20.x
npm install @neural-ui/core @ng-icons/core @ng-icons/lucide
```

### Angular 21.2.x — NG3004 with `FormsModule`

**Affected versions:** Angular 21.2.0 – 21.2.7  
**Symptom:** Using `FormsModule` (even standalone imports) in any component causes the build error:

```
NG3004: NeuXxx is not a known element... ɵNgNoValidate is not exported from the types definition file
```

**Root cause:** `ɵNgNoValidate` is accidentally not `export`ed from `@angular/forms/types/forms.d.ts` in those patch releases.

**Solution — use `ReactiveFormsModule` + `FormControl`:**

Replace every template-driven value binding with a `FormControl` + `[formControl]` directive:

```typescript
// Before (triggers NG3004)
import { FormsModule } from '@angular/forms';
// ...
imports: ([FormsModule],
  // ...
  (isChecked = false));
```

```typescript
// After (works correctly)
import { FormControl, ReactiveFormsModule } from '@angular/forms';
// ...
imports: [ReactiveFormsModule],
// ...
readonly isChecked = new FormControl(false, { nonNullable: true });
```

```html
<!-- Before -->
<neu-checkbox [value]="isChecked" (valueChange)="isChecked = $event" label="Accept" />

<!-- After -->
<neu-checkbox [formControl]="isChecked" label="Accept" />
```

All NeuralUI form components implement `ControlValueAccessor` (`NG_VALUE_ACCESSOR`) and work with both binding strategies. Prefer `ReactiveFormsModule` for Angular 21+.

---

## License

MIT © [Pedro Moreno Trujillo](https://github.com/PedroMorenoTrujillo)
