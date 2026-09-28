# Neural UI 2 icon contract migration

This is an intentional **Core 2 icon API change**. The former Core package statically imported `@neural-icons/angular` in 27 components, used `@neural-icons/core` definitions in fixed chrome, and exposed `NeuralIconName`/`NeuralIconDefinition` in 16 productive files. Thus its mandatory Icons peers described real coupling. Core 2 now owns icon slots and semantic intent; the application owns any full icon catalogue. Neural Icons is optional, separate, and useful for Showcase 2 chrome.

This document describes the local `v2` candidate, **not an npm release**. Its package manifest still says `1.15.0`; identify the candidate by Core commit plus tarball name and SHA-256, not semver alone.

## API changes

| Before | After | Action |
|---|---|---|
| `NeuralIconName` in Button, Input, Alert, Tag, Nav, menus, Breadcrumb, ScrollTop, SplitButton, StatsCard, notification items, ToggleButtonGroup and EmptyState | `NeuIconKey` from `@neural-ui/core/foundation` (`string`) | Keep meaningful application keys; configure a resolver for keys that are not Core's small built-in affordances. |
| Fixed `NeuralIconDefinition` return/model values for Alert, Toast and NotificationCenter | Core-owned semantic `NeuIconKey` | Stop treating a fixed icon definition as the public status representation. Map semantic keys in the application only if a custom renderer is desired. |
| `<neural-icon>` statically embedded inside Core components | Internal `neu-icon-outlet` with optional `NeuIconResolver` | No app-wide Icons installation is necessary for Core itself. |
| Required Core peers `@neural-icons/angular` and `@neural-icons/core` | No Core Icons peers/dependencies | Install Icons in the application only when using them. |

`NeuIconKey`, `NeuIconRenderContext`, `NeuIconRender`, `NeuIconResolver`, `NEU_ICON_RESOLVER`, and `provideNeuIconResolver` are exported by `@neural-ui/core/foundation`. The resolver receives `{ key, size, strokeWidth, label }` and returns `{ component, inputs? }` or `null`. The component is an Angular component supplied by the consuming application; Core does not import or wrap Neural Icons.

## No icon provider

```ts
import { Component } from '@angular/core';
import { NeuButtonComponent } from '@neural-ui/core/button';

@Component({
  imports: [NeuButtonComponent],
  template: `<button neu-button icon="add">Add item</button>`,
})
export class ExampleComponent {}
```

The `add` structural affordance has a small original Core fallback. Essential controls such as close, disclosure and previous/next remain operable without an icon package. Non-structural defaults may use simple text glyphs. An unknown key has no drawn fallback: give it a resolver or use projected content. Keep an accessible text label for icon-only actions; never depend on the visual shape alone to communicate the action.

## Optional Neural Icons integration

The application installs `@neural-icons/angular` and `@neural-icons/core` independently of Core and maps only the definitions it uses:

```ts
import type { ApplicationConfig } from '@angular/core';
import { NeuralIcon } from '@neural-icons/angular';
import { iconSave } from '@neural-icons/core/icons/save';
import { provideNeuIconResolver } from '@neural-ui/core/foundation';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuIconResolver(({ key, size, strokeWidth }) =>
      key === 'save'
        ? { component: NeuralIcon, inputs: { icon: iconSave, size, strokeWidth } }
        : null,
    ),
  ],
};
```

Then `icon="save"` on a Core Button uses the application resolver. Other components can ask for the same key, and Showcase 2 may render `<neural-icon>` directly in its own shell. Map semantic Core defaults (`close`, `previous`, `status-success`, etc.) only when the product wants replacement geometry. An unmapped key falls back to Core's built-in affordance if one exists; otherwise it stays empty. Avoid an eager import of the full Icons catalogue.

## Own icon component or existing templates

The same resolver can return an application-owned standalone Angular component instead of `NeuralIcon`:

```ts
provideNeuIconResolver(({ key, size, label }) =>
  key === 'company-mark'
    ? { component: CompanyMarkComponent, inputs: { size, label } }
    : null,
);
```

For a one-off control, use a component's existing projected content or item/template hook where offered. For example, a labelled Button can project an app-owned SVG next to text without configuring a global resolver. Template hooks on Menu, Dock, Input and other components remain application composition choices; this migration does not remove them.

## Migration checklist

1. Replace imports and annotations of `NeuralIconName`/`NeuralIconDefinition` coming from Core-facing models with `NeuIconKey` or explicit application-owned types. Do not use the old 399-name union as Core 2 authority.
2. Review every `icon` value. Core built-in values are semantic intents, not Neural Icons names. Unknown custom keys need a resolver or projected content.
3. If using Neural Icons, install and version it as a separate application dependency, configure `provideNeuIconResolver`, and import only selected definitions. Core does not supply a mandatory adapter package.
4. Verify icon-only labels, focus, reduced-motion behavior, SSR/hydration and zoneless interaction in the consuming application. A missing decorative icon must not hide the operation or accessible name.
5. Test a clean install without Icons if your application does not use it. Do not infer this candidate's product generation from its temporary `1.15.0` package version.

Showcase 2 should declare both Core 2 and Neural Icons as **its own** dependencies. Its chrome uses Neural Icons directly; Core slots may use the app resolver. Showcase must not duplicate the Icons catalogue or modify Core to support its shell.
