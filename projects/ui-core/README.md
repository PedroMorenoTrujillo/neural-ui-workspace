# @neural-ui/core

A modern Angular UI component library built with signals, OnPush change detection, and zero zone dependence. Designed for Angular 21+.

## Features

- **40+ components** — forms, navigation, layout, feedback, and data display
- **Signals-first API** — all inputs/outputs use Angular signals (`input()`, `output()`, `model()`)
- **Standalone** — every component is standalone, import only what you need
- **Accessible** — ARIA attributes, keyboard navigation, and focus management out of the box
- **Themeable** — CSS custom properties for full design token control

## Installation

```bash
npm install @neural-ui/core @angular/cdk @ng-icons/core @ng-icons/lucide apexcharts ng-apexcharts
```

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

This registers all icons used internally by the library. If you need custom icon sizing:

```typescript
provideNeuralUI({ iconSize: '1rem', iconStrokeWidth: '1.5' });
```

Import the global stylesheet in your `styles.scss`:

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
