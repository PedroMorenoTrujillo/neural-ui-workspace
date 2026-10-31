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

Modern Angular UI component library — **signals-first**, fully **standalone**, with dedicated subpath entry points and no Zone.js requirement.

> Building a full admin product? Try [Neural Admin Pro](https://neural-ui-admin-pro.vercel.app/login), a premium Angular dashboard template built with Neural UI and ready to connect to your own backend.

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
- **Version:** 2.0.4
- **Entry points:** 100
- **Automated tests:** 3241
- **Coverage:** 96.9% statements · 95.08% branches · 95.93% functions · 98.14% lines
<!-- neural-ui-metrics:end -->

- Signals-first architecture across `ui-core`
- Standalone + OnPush component model
- BEM as the required styling convention for component and demo SCSS
- Zoneless-oriented test setup
- Neural UI 2 release coverage passes the exact 95.01% floor on statements, branches, functions and lines in the full canonical run
- Strong accessibility baseline validated in showcase and reinforced in core components

The [quality snapshot above](#quality-snapshot) is generated from the canonical
release coverage run; historical audit documents are not current compatibility guidance.
The exact-count coverage gate is enforced by `npm run test:coverage` and the release verifier.

---

## Installation

```bash
npm install @neural-ui/core@2.0.4 @angular/cdk@22
```

---

## Setup

Use Angular 22 and a Node.js version compatible with its CLI:
`^22.22.3 || ^24.15.0 || >=26.0.0`. Keep Angular packages on compatible versions.
External icon packages are optional, not peer dependencies of Core.

Automated setup is additive and idempotent:

```bash
ng add @neural-ui/core@2.0.4
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
| `:theme`          | `--name`, `--path`, `--density=compact\|comfortable\|spacious`, `--theme=default\|high-contrast`, `--force` | Creates `[path]/[name].scss`; defaults to `src/styles/neural-ui-theme.scss`. / Crea el preset SCSS en la ruta elegida.                                                                       | Delete the generated file and any import or `data-neu-*` attributes you added. / Elimina el archivo y los imports o atributos añadidos.                                            |
| `:layout NAME`           | `--project`, `--path`, `--force`                                                                            | Creates `NAME.component.ts`, `.html` and `.scss` with a mobile-first sidebar/toolbar shell.                                                                                                  | Delete the generated directory and any route you added; existing routes are not modified automatically. / Elimina el directorio y la ruta añadida; no se alteran rutas existentes. |
| `:dashboard NAME`        | `--project`, `--path`, `--force`                                                                            | Creates the three component files with responsive metric/card foundations. / Genera una base responsive de métricas y tarjetas.                                                              | Delete the generated directory and its manually added route. / Elimina el directorio y su ruta añadida manualmente.                                                                |
| `:crud-page NAME`        | `--project`, `--path`, `--force`                                                                            | Creates the three component files with Signal Forms, input, table and actions. / Genera una base CRUD con Signal Forms, input, tabla y acciones.                                  | Delete the generated directory and its manually added route. / Elimina el directorio y su ruta añadida manualmente.                                                                |

Generated page copy is starter content: connect it to the consumer application's translation system before shipping. / Los textos de las páginas generadas son contenido inicial: intégralos con el sistema de traducciones de la aplicación antes de publicar.

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

### Table query, remote data and controlled selection

Import `NeuTableQuery` from `@neural-ui/core/table`. Its `page` is
**zero-based**; `sort` is an ordered array and `filters` is a typed expression.
Bind `[query]` and accept or reject each `queryChange` proposal explicitly.
Table does not mutate the parent-owned query.

Use `dataMode="remote"` and `dataRequest` for server-backed rows. Each request
carries its query, `requestId`, `queryRevision` and optional virtual `range`.
Return those IDs in `metadata` with the data they describe; handle loading,
errors and cancellation in the application. The backend owns filtering,
sorting and totals in remote mode. Register `provideHttpClient()` alongside
`provideNeuralUI()` in the application configuration for this example.
The example endpoint `/api/users` must return `{ items: User[], totalItems: number }`.

```typescript
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import {
  NeuTableComponent,
  NeuTableCellDirective,
  NeuTableErrorDirective,
  NeuTableRowDetailDirective,
  type NeuTableColumn,
  type NeuTableDataRequest,
  type NeuTableMetadata,
  type NeuTableQuery,
  type NeuTableSelection,
  type NeuTableSelectionOptions,
} from '@neural-ui/core/table';

interface User {
  id: string;
  name: string;
  active: boolean;
}
type Field = 'name';
interface UserPage {
  items: readonly User[];
  totalItems: number;
}

@Component({
  selector: 'app-remote-users',
  imports: [
    NeuTableComponent,
    NeuTableCellDirective,
    NeuTableErrorDirective,
    NeuTableRowDetailDirective,
  ],
  template: `
    <neu-table
      dataMode="remote"
      [data]="rows()"
      [metadata]="metadata()"
      [columns]="columns"
      [rowKey]="keyOf"
      [query]="query()"
      [selection]="selection()"
      [selectionOptions]="selectionOptions"
      [expandedKeys]="expanded()"
      [expansionOptions]="{ enabled: true, toggleOnRowClick: false }"
      (queryChange)="query.set($event)"
      (selectionChange)="selection.set($event.next)"
      (expandedKeysChange)="expanded.set($event.next)"
      (dataRequest)="load($event)"
    >
      <ng-template neuTableCell="name" let-value="value">
        <strong>{{ value }}</strong>
      </ng-template>
      <ng-template neuTableRowDetail let-key="key">
        <p>Details for user {{ key }}</p>
      </ng-template>
      <ng-template neuTableError let-retry="retry">
        <p role="alert">Unable to load users.</p>
        <button type="button" (click)="retry()">Retry</button>
      </ng-template>
    </neu-table>
  `,
})
export class RemoteUsersComponent {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private pending: Subscription | undefined;
  readonly keyOf = (row: User): string => row.id;
  readonly rows = signal<readonly User[]>([]);
  readonly columns: readonly NeuTableColumn<User, Field>[] = [
    { id: 'name', field: 'name', header: 'Name', sort: { field: 'name' } },
  ];
  readonly query = signal<NeuTableQuery<Field>>({
    page: 0, pageSize: 25, search: '', sort: [], filters: null,
  });
  readonly metadata = signal<NeuTableMetadata>({
    totalItems: null, loading: false, error: null,
    queryRevision: 0, appliedRequestId: null,
  });
  readonly selection = signal<NeuTableSelection<string, Field>>({
    kind: 'keys', keys: [],
  });
  readonly selectionOptions: NeuTableSelectionOptions<User> = {
    mode: 'multiple', indicator: 'checkbox', selectOnRowClick: false,
    modifier: 'platform', range: true, toggleAllScope: 'loaded',
    isRowDisabled: (row) => !row.active,
  };
  readonly expanded = signal<readonly string[]>([]);

  load(request: NeuTableDataRequest<Field>): void {
    this.pending?.unsubscribe();
    this.rows.set([]);
    const applied = {
      queryRevision: request.queryRevision,
      appliedRequestId: request.requestId,
    };
    this.metadata.set({
      ...applied, totalItems: null, loading: true, error: null,
    });
    this.pending = this.http.get<UserPage>('/api/users', {
      params: {
        page: request.query.page,
        pageSize: request.query.pageSize,
        search: request.query.search,
        sort: JSON.stringify(request.query.sort),
        filters: JSON.stringify(request.query.filters),
      },
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.rows.set(page.items);
        this.metadata.set({
          ...applied, totalItems: page.totalItems, loading: false, error: null,
        });
      },
      error: (error: unknown) => this.metadata.set({
        ...applied, totalItems: null, loading: false, error,
      }),
    });
  }
}
```

Selection is key-based: `selectionChange.next` is a `NeuTableSelection`,
not a row array. Configure its mode, indicator, disabled-row predicate and
toggle-all scope through `selectionOptions`. The example uses the loaded
rows only. The separate `all-matching` selection kind records a frozen query
scope and excluded keys for remote datasets; it does not invent unloaded rows.

### Table templates and row composition

Use the public `neuTableCell`, `neuTableHeader`, `neuTableFooter`,
`neuTableRowDetail`, `neuTableEditor`, `neuTableFilter` and
`neuTablePaginator` directives. Import each directive used by a standalone
template from `@neural-ui/core/table`; the example imports its cell, detail
and error directives explicitly. Table owns the primary row, focus and ARIA.
A cell template receives its row/key and `value`; row-detail templates are
controlled through `expandedKeys` and `expandedKeysChange.next`.
See the [Table API and runnable recipes](https://ui.neuralui.org/v2/en/components/table)
for grouping, export, remote virtualization and the full template contracts.

### Density and high contrast / Densidad y alto contraste

The current appearance remains the default. Opt in on `<html>` or a scoped shell:

```html
<html data-neu-density="compact" data-neu-theme="high-contrast"></html>
```

Available densities are `compact`, `comfortable`, and `spacious`. Remove the attributes to revert instantly to the existing default. / Las densidades disponibles son `compact`, `comfortable` y `spacious`. Elimina los atributos para volver al aspecto actual.

### Public testing API / API pública de testing

This complete test uses an Angular CLI Vitest project with Angular TestBed initialized.

```typescript
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { describe, expect, it } from 'vitest';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuInputHarness } from '@neural-ui/core/testing';

@Component({
  imports: [NeuInputComponent],
  template: '<neu-input label="Name" [(value)]="name" />',
})
class InputHarnessHost {
  readonly name = signal('');
}

describe('Input integration', () => {
  it('writes the shared value through the public harness', async () => {
    await TestBed.configureTestingModule({
      imports: [InputHarnessHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(InputHarnessHost);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const input = await loader.getHarness(NeuInputHarness);
    await input.setValue('Ada');
    expect(fixture.componentInstance.name()).toBe('Ada');
    fixture.destroy();
  });
});
```

Harnesses are available for button, input, checkbox, switch, select, date input, table and dialog. / Hay harnesses para button, input, checkbox, switch, select, date input, table y dialog.

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

Writable component models such as `NeuInputComponent.value` are shared state:
`[(value)]` connects the component and application value. A model's
`valueChange` reports the change; it is not a vetoable proposal. Table's
`queryChange` and `selectionChange.next` are controlled proposals: the parent
supplies the accepted replacement. Follow each component's own contract.

Use Angular 22 Signal Forms through `FormField`:

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

Angular 22 also provides reactive and template-driven forms interop for
compatible model controls. For example, `NeuInputComponent` supports
`[formControl]`, `formControlName` and `ngModel`:

```typescript
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NeuInputComponent } from '@neural-ui/core/input';

@Component({
  selector: 'app-compatible-fields',
  imports: [NeuInputComponent, FormsModule, ReactiveFormsModule],
  template: `
    <neu-input label="Reactive control" [formControl]="control" />
    <form [formGroup]="group">
      <neu-input label="Named reactive control" formControlName="email" />
    </form>
    <neu-input label="Template-driven control" [(ngModel)]="email" />
  `,
})
export class CompatibleFieldsComponent {
  readonly control = new FormControl('', { nonNullable: true });
  readonly group = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
  });
  email = '';
}
```

This uses Angular's model-control compatibility, not a parallel Neural CVA.
The form directives are not interchangeable bindings on the same field.
Check the selected component's value type and supported integration; V1
component imports and APIs still require migration.

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
The optional companion project has its own catalog and documentation:
[Neural Icons](https://icons.neuralui.org/). It is not required to use Core.

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

---

## Neural Admin Pro

Build production-ready SaaS dashboards, CRM tools, internal business apps and client portals with Neural Admin Pro, a premium Angular dashboard template built with Neural UI.

Neural Admin Pro is a full-stack Angular and NestJS product with PostgreSQL, authentication, roles, workspaces and a public static demo. Its source can also be adapted to another backend when required.

- [Live demo](https://neural-ui-admin-pro.vercel.app/login)
- [Buy on Gumroad](https://trujillopete.gumroad.com/l/epbrur)
- [Buy on Payhip](https://payhip.com/b/0apB6)

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
| `@neural-ui/core/panel-menu`, `@neural-ui/core/org-chart`, `@neural-ui/core/scheduler-gantt` | These legacy entry points are not exported by Core 2; there is no drop-in replacement |

These are migration directions, not automatic renames: compare each V2 API
and its examples before replacing a V1 component.

### Charts in Neural UI 2

Neural UI 1.x included the `@neural-ui/core/chart` entry point backed by ApexCharts.
That entry point is **not part of Core 2**. Core does not bundle ApexCharts or
replace that V1 API with another chart library. Choose and integrate a chart
package separately in the application.

---

## Contributing

1. Fork the repository and create a feature branch
2. Run `npm install`
3. Run tests: `npm test`
4. Run the release gate: `npm run verify:release`
5. Open a pull request

---

## License

Neural UI was created and is maintained by [Pedro Moreno Trujillo](https://github.com/PedroMorenoTrujillo).

Copyright © 2026 Pedro Moreno Trujillo. Released under the MIT License.

## Previous version

Maintaining a Neural UI 1.x application? Use the separate
[Neural UI v1 showcase and documentation](https://ui.neuralui.org/v1/).
Its examples and compatibility requirements apply to V1, not this V2 package.
