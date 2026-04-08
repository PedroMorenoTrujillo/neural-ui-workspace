# @neural-ui/core

<p>
  <a href="https://www.npmjs.com/package/@neural-ui/core"><img src="https://img.shields.io/npm/v/@neural-ui/core?color=0ea5e9&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@neural-ui/core"><img src="https://img.shields.io/npm/dm/@neural-ui/core?color=6366f1" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/Angular-19--22-dd0031?logo=angular" alt="Angular 19-22" />
  <img src="https://img.shields.io/badge/tests-534%20passing-22c55e" alt="534 tests passing" />
  <img src="https://img.shields.io/badge/coverage-91%25-22c55e" alt="91% coverage" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" />
</p>

Modern Angular UI component library — **signals-first**, fully **standalone**, zero Zone.js dependency.  
Built for Angular 19–22 with OnPush change detection and no Zone.js requirement.

> Live documentation and examples → [neural-ui-showcase.vercel.app](https://neural-ui-showcase.vercel.app)

---

## Features

- **40+ components** — forms, navigation, layout, feedback, and data display
- **Signals API** — all inputs/outputs use `input()`, `output()`, `model()` — no `@Input()` decorators
- **Standalone** — every component is standalone, import only what you need
- **OnPush everywhere** — maximum performance out of the box
- **Accessible** — ARIA attributes, keyboard navigation and focus management built in
- **Themeable** — full design token system via CSS custom properties

---

## Installation

```bash
npm install @neural-ui/core @angular/cdk @ng-icons/core @ng-icons/lucide apexcharts ng-apexcharts
```

---

## Setup

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

---

## Usage

Import any component directly into your standalone component:

```typescript
import { NeuButtonComponent, NeuInputComponent } from '@neural-ui/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

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

| Category        | Components                                                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Forms**       | `NeuCheckbox` · `NeuDateInput` · `NeuInput` · `NeuMultiselect` · `NeuRadio` · `NeuRadioGroup` · `NeuSelect` · `NeuSlider` · `NeuSwitch` · `NeuTextarea` · `NeuToggleButtonGroup`                                                   |
| **Navigation**  | `NeuBreadcrumb` · `NeuNav` · `NeuPagination` · `NeuSidebar` · `NeuStepper` · `NeuTabs`                                                                                                                                             |
| **Layout**      | `NeuAccordion` · `NeuCard` · `NeuDivider` · `NeuModal` · `NeuTable`                                                                                                                                                                |
| **UI Elements** | `NeuAvatar` · `NeuBadge` · `NeuButton` · `NeuChart` · `NeuChip` · `NeuCodeBlock` · `NeuEmptyState` · `NeuIcon` · `NeuProgressBar` · `NeuRating` · `NeuSkeleton` · `NeuSpinner` · `NeuSplitButton` · `NeuStatsCard` · `NeuTimeline` |
| **Feedback**    | `NeuToast` · `NeuToastService` · `NeuTooltip`                                                                                                                                                                                      |

---

## Theming

All visual properties are controlled via CSS custom properties. Override them in your global stylesheet:

```scss
:root {
  // Brand colors
  --neu-color-primary: #6366f1;
  --neu-color-primary-hover: #4f46e5;

  // Neutral scale
  --neu-color-surface: #ffffff;
  --neu-color-surface-alt: #f8fafc;
  --neu-color-border: #e2e8f0;
  --neu-color-text: #0f172a;
  --neu-color-text-muted: #64748b;

  // Feedback
  --neu-color-error: #ef4444;
  --neu-color-success: #22c55e;
  --neu-color-warning: #f59e0b;

  // Shape & spacing
  --neu-radius-sm: 0.25rem;
  --neu-radius-md: 0.5rem;
  --neu-radius-lg: 0.75rem;
  --neu-radius-xl: 1rem;
  --neu-spacing-xs: 0.25rem;
  --neu-spacing-sm: 0.5rem;
  --neu-spacing-md: 1rem;
  --neu-spacing-lg: 1.5rem;

  // Typography
  --neu-font-family: 'Inter', system-ui, sans-serif;
  --neu-font-size-sm: 0.875rem;
  --neu-font-size-base: 1rem;
  --neu-font-size-lg: 1.125rem;
}
```

---

## Peer dependencies

| Package            | Required version   |
| ------------------ | ------------------ |
| `@angular/core`    | `>=19.0.0 <23.0.0` |
| `@angular/cdk`     | `>=19.0.0 <23.0.0` |
| `@angular/common`  | `>=19.0.0 <23.0.0` |
| `@angular/forms`   | `>=19.0.0 <23.0.0` |
| `@angular/router`  | `>=19.0.0 <23.0.0` |
| `@ng-icons/core`   | `>=33.0.0`         |
| `@ng-icons/lucide` | `>=33.0.0`         |
| `apexcharts`       | `>=5.0.0`          |
| `ng-apexcharts`    | `>=2.0.0`          |

---

## License

MIT © [Pedro Moreno Trujillo](https://github.com/PedroMorenoTrujillo)

```scss
@use '@neural-ui/core/styles' as *;
```

## Usage

Import components directly into your standalone component or NgModule:

```typescript
import { NeuButtonComponent } from '@neural-ui/core';

@Component({
  imports: [NeuButtonComponent],
  template: `<neu-button variant="primary">Click me</neu-button>`,
})
export class AppComponent {}
```

## Components

| Category        | Components                                                                                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Forms**       | `NeuCheckbox`, `NeuDateInput`, `NeuInput`, `NeuMultiselect`, `NeuRadio`, `NeuRadioGroup`, `NeuSelect`, `NeuSlider`, `NeuSwitch`, `NeuTextarea`, `NeuToggleButtonGroup`                                               |
| **Navigation**  | `NeuBreadcrumb`, `NeuNav`, `NeuPagination`, `NeuSidebar`, `NeuStepper`, `NeuTabs`                                                                                                                                    |
| **Layout**      | `NeuAccordion`, `NeuCard`, `NeuDivider`, `NeuDialog` / `NeuDialogService`, `NeuTable`                                                                                                                                |
| **UI Elements** | `NeuAvatar`, `NeuBadge`, `NeuButton`, `NeuChart`, `NeuChip`, `NeuCodeBlock`, `NeuEmptyState`, `NeuIcon`, `NeuProgressBar`, `NeuRating`, `NeuSkeleton`, `NeuSpinner`, `NeuSplitButton`, `NeuStatsCard`, `NeuTimeline` |
| **Feedback**    | `NeuToast` / `NeuToastService`, `NeuTooltip`                                                                                                                                                                         |

## Peer Dependencies

| Package            | Version            |
| ------------------ | ------------------ |
| `@angular/core`    | `>=19.0.0 <23.0.0` |
| `@angular/cdk`     | `>=19.0.0 <23.0.0` |
| `@ng-icons/core`   | `>=33.0.0`         |
| `@ng-icons/lucide` | `>=33.0.0`         |
| `apexcharts`       | `>=5.0.0`          |
| `ng-apexcharts`    | `>=2.0.0`          |

## License

MIT
