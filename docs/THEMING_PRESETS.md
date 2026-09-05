# Tokens and static presets / Tokens y presets estáticos

## English

Behavior/state: Inputs, Outputs, Models and services. Content/markup: templates, slots and directives. Design values: existing CSS tokens. Reusable design mappings: presets. Universal Parts/PT is intentionally excluded; no internal DOM injection contract exists.

The source of truth is `styles/_tokens.scss` plus documented component fallback tokens, indexed by `token-manifest.json`. There are 266 public tokens; private geometry and local bridges are excluded from `NeuTokenName`. Values accept CSS strings and finite numbers: colors, lengths, fonts, shadows, functions and consumer variables. Type checking validates names, not CSS semantics or contrast.

A preset is a small typed map, not a theme engine. Import the build helper from `@neural-ui/core/foundation`. No new provider or entrypoint is required. Use `satisfies NeuPreset` on literals for unknown-name diagnostics. Untrusted CSS is unsupported.

```ts
import { neuPresetCss, type NeuPreset } from '@neural-ui/core/foundation';
const shared = { '--neu-radius': '6px' } as const;
const preset = {
  light: { ...shared, '--neu-text': 'var(--app-text)', '--neu-primary-solid': '#14532d' },
  dark: { ...shared, '--neu-text': '#f0fdf4', '--neu-primary-solid': '#86efac', '--neu-primary-solid-fg': '#052e16' },
} satisfies NeuPreset;
const css = neuPresetCss('forest', preset);
// In your build script: writeFileSync('src/forest.css', css).
```

Load the generated CSS after `@neural-ui/core/styles`. Set `data-neu-preset="forest"` on html, alongside existing `data-theme="light"` or `data-theme="dark"`. Remove the preset attribute for exact defaults. No CSS is injected, no token mutation loop runs, and no preset JavaScript needs to enter the browser. Definition and generation work on the server; include the same stylesheet and attributes in server and client markup. The existing app owns theme selection and persistence. Presets dispatch no events.

Light and dark maps are independent: omitted values use that mode's library defaults. Share values explicitly with object spread. Compose base and override with `{ light: { ...base.light, ...override.light }, dark: { ...base.dark, ...override.dark } }`; last token wins. This is a shallow token merge, not a recursive schema.

Generated rules apply only to the document root. Subtree isolation is unsupported because root aliases and body overlays require a broader contract. Semantic aliases resolve where declared: mapping a root token updates root aliases; component fallback tokens resolve at use sites. A single brand token does not control every state: pair primary-solid, its foreground/hover, focus, surfaces and state colors as appropriate.

Precedence: default tokens, then selected preset (loaded later), then deliberate consumer CSS under normal specificity rules. Root `data-neu-theme="high-contrast"` disables the custom preset. `forced-colors: active` disables its entire stylesheet rules, preserving browser/library accessibility styling. Existing reduced-motion rules and component invariants remain; do not override them with consumer CSS. Verify contrast for your own palette; arbitrary values cannot guarantee accessibility. Cascade layers and Bare are not introduced.

## Español

Comportamiento/estado: Inputs, Outputs, Models y servicios. Contenido/estructura: templates, slots y directivas. Valores de diseño: tokens CSS existentes. Configuración reutilizable: presets. Parts/PT universal queda excluido deliberadamente; no existe un contrato de inyección al DOM interno.

La fuente de verdad es `styles/_tokens.scss` junto con los fallbacks públicos documentados, indexados en `token-manifest.json`. Hay 266 tokens públicos; geometría privada y puentes locales quedan fuera de `NeuTokenName`. Los valores admiten cadenas CSS y números finitos: colores, longitudes, fuentes, sombras, funciones y variables del consumidor. Los tipos validan nombres, no semántica CSS ni contraste.

Un preset es un mapa tipado pequeño, no un motor de temas. Importa el helper de compilación desde `@neural-ui/core/foundation`. No necesita proveedor ni entrypoint nuevo. Usa `satisfies NeuPreset` sobre los literales para detectar nombres desconocidos. No se admite CSS no confiable. El ejemplo anterior genera el texto CSS; guárdalo desde un script de compilación.

Carga el CSS generado después de `@neural-ui/core/styles`. Activa `data-neu-preset="forest"` en html, junto al mecanismo existente `data-theme="light"` o `data-theme="dark"`. Retira el atributo del preset para recuperar los valores por defecto. No hay inyección CSS, bucle de mutaciones ni JavaScript del preset necesario en el navegador. La definición/generación funciona en servidor; entrega la misma hoja y atributos en servidor y cliente. La aplicación conserva la selección y persistencia del tema. Los presets no emiten eventos.

Los mapas claro y oscuro son independientes: un valor omitido usa el valor de la biblioteca para ese modo. Comparte valores mediante spread. Compón base y override con `{ light: { ...base.light, ...override.light }, dark: { ...base.dark, ...override.dark } }`; gana el último token. Es una mezcla superficial por token, sin esquema recursivo.

Las reglas generadas se aplican solo a la raíz del documento. No se garantiza aislamiento de subárboles porque los alias raíz y overlays en body requieren un contrato adicional. Los alias semánticos se resuelven donde se declaran; los fallbacks de componente, donde se usan. Un token de marca no controla todos los estados: combina primary-solid, texto/hover, foco, superficies y estados según corresponda.

Precedencia: tokens por defecto, preset seleccionado cargado después, y CSS deliberado del consumidor según la especificidad normal. `data-neu-theme="high-contrast"` en la raíz desactiva el preset. `forced-colors: active` desactiva todas sus reglas y conserva los estilos accesibles de biblioteca/navegador. Se mantienen las reglas de movimiento reducido y las invariantes de componentes; no las anules mediante CSS. Verifica el contraste de tu paleta; valores arbitrarios no garantizan accesibilidad. No se introducen cascade layers ni Bare.
