# Typed presets / Presets tipados

## English

A preset is a named, typed set of Neural design-token values. It changes the visual language of every component consistently without changing component markup, state or behavior.

Define the preset in a regular TypeScript file:

```ts
// forest.preset.ts
import { defineNeuPreset } from '@neural-ui/core';

export const forestPreset = defineNeuPreset({
  name: 'forest',
  light: {
    '--neu-primary': '#166534',
    '--neu-primary-solid': '#166534',
    '--neu-primary-solid-fg': '#ffffff',
    '--neu-bg': '#f0fdf4',
    '--neu-text': '#142d20',
  },
  dark: {
    '--neu-primary': '#86efac',
    '--neu-primary-solid': '#86efac',
    '--neu-primary-solid-fg': '#052e16',
    '--neu-bg': '#081a10',
    '--neu-text': '#f0fdf4',
  },
});
```

Register it once in the existing application configuration:

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideNeuralUI } from '@neural-ui/core';
import { forestPreset } from './forest.preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuralUI({
      theme: { preset: forestPreset },
    }),
  ],
};
```

That is the complete setup. No custom script, `index.html` edit or additional `angular.json` entry is required. The normal `ng add @neural-ui/core` installation already registers the base Neural stylesheet.

At startup, the provider validates the token names, emits the preset CSS after the base styles and activates the preset on the document root. The existing `data-theme="light"` or `data-theme="dark"` selection chooses the corresponding map. Omitted tokens retain the library default for that mode.

The generated rules are compatible with SSR and reuse server-rendered preset styles during hydration. Angular's `CSP_NONCE` is applied when available. Root `data-neu-theme="high-contrast"` and `forced-colors: active` take precedence over custom preset values. Applications must still verify contrast for their own palette.

`neuPresetCss` remains available from `@neural-ui/core/foundation` as a low-level build-time primitive for tooling authors. Application setup should normally use `defineNeuPreset` with `provideNeuralUI`.

## Español

Un preset es un conjunto tipado y con nombre de valores de los tokens de diseño de Neural. Cambia el lenguaje visual de todos los componentes de forma coherente sin modificar su HTML, estado ni comportamiento.

Define el preset en un archivo TypeScript normal:

```ts
// forest.preset.ts
import { defineNeuPreset } from '@neural-ui/core';

export const forestPreset = defineNeuPreset({
  name: 'forest',
  light: {
    '--neu-primary': '#166534',
    '--neu-primary-solid': '#166534',
    '--neu-primary-solid-fg': '#ffffff',
    '--neu-bg': '#f0fdf4',
    '--neu-text': '#142d20',
  },
  dark: {
    '--neu-primary': '#86efac',
    '--neu-primary-solid': '#86efac',
    '--neu-primary-solid-fg': '#052e16',
    '--neu-bg': '#081a10',
    '--neu-text': '#f0fdf4',
  },
});
```

Regístralo una sola vez en la configuración existente de la aplicación:

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideNeuralUI } from '@neural-ui/core';
import { forestPreset } from './forest.preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuralUI({
      theme: { preset: forestPreset },
    }),
  ],
};
```

Esa es toda la configuración. No hace falta crear un script, editar `index.html` ni añadir otra entrada a `angular.json`. La instalación normal con `ng add @neural-ui/core` ya registra la hoja de estilos base de Neural.

Al arrancar, el provider valida los nombres de los tokens, añade el CSS del preset después de los estilos base y lo activa en la raíz del documento. La selección existente `data-theme="light"` o `data-theme="dark"` elige el mapa correspondiente. Los tokens omitidos conservan el valor predeterminado de la librería para ese modo.

Las reglas generadas son compatibles con SSR y reutilizan durante la hidratación los estilos renderizados en el servidor. Se aplica `CSP_NONCE` de Angular cuando está disponible. `data-neu-theme="high-contrast"` en la raíz y `forced-colors: active` tienen prioridad sobre los valores personalizados. La aplicación debe seguir comprobando el contraste de su propia paleta.

`neuPresetCss` continúa disponible en `@neural-ui/core/foundation` como primitiva de bajo nivel para quienes construyan tooling. La configuración habitual de una aplicación debe usar `defineNeuPreset` con `provideNeuralUI`.
