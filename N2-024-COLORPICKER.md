# N2-024 — ColorPicker

## 1. Status

**READY FOR N2-025.** N2-024 queda preparada en el working tree, sin commit. No se inició N2-025.

## 2. Starting checkpoint

Rama `v2`; N2-023 quedó cerrado en `0e1f177ac6a21dbc241b5485c86274a72c753287` (`feat(theme): normalize visual tokens and nomenclature`), parent `b18a50cc632b439ff186ffb4efdf83c003fa8189`. Se verificaron árbol limpio, staging vacío, cero symlinks y las auditorías N2-023 antes de iniciar N2-024.

## 3. Scope resolution

Autoridad: `N2-IMPLEMENTATION-ROADMAP.md`, contratos/API/types N2-001, `N2-FORMS-TARGET.md`, `N2-009-SPECIALIZED-FORMS.md`, matriz N2-023 y contrato/runtime ColorPicker actual. No existe un documento de fase N2-024 más específico. P2 autorizado: EyeDropper opcional con detección de capacidad y fallback al editor existente. Canales HEX/RGB/HSL/OKLCH, alpha, presets y overlay ya estaban implementados; no se añadió palette/custom input, clear, recent colors ni una segunda API de color. La API [EyeDropper de WICG](https://wicg.github.io/eyedropper-api/) devuelve `sRGBHex`, requiere activación del usuario y puede abortarse/rechazarse.

## 4. Previous implementation

Existían `model<string>()`, un motor puro `color-utils.ts`, proyección sRGB derivada, controles de canales, plano HSV, presets, CDK ConnectedOverlay y las cuatro vías Forms. Las debilidades verificadas eran: `effect` para limpiar estado de formato, dos listeners documentales por instancia, búsqueda global del primer panel al resolver blur, captura de puntero no liberada al cancelar/destruir y pérdida de alpha en serialización después de editar con `showAlpha=false`.

## 5. Rewrite/refactor decision

Refactor focal. El motor puro y el owner único del valor eran sanos; reescribirlos habría ampliado riesgo y contrato. Se añadieron únicamente el muestreo opcional y correcciones locales de interacción/lifecycle.

## 6. Public API

Sin nuevo input, output, método público, tipo exportado ni entrypoint. `value: ModelSignal<string>` y `mode: 'hex' | 'rgb' | 'hsl' | 'oklch'` permanecen. Los outputs existentes `touch`, `opened`, `closed`, `valueCommitted` siguen siendo los únicos. `EyeDropper` y su resultado son tipos privados; `panelId` es `protected`.

## 7. Breaking delta

Ningún breaking change de superficie. Corrección observable: el valor/etiqueta conserva alpha aplicado aunque `showAlpha=false`; la opción controla la edición de alpha, no su descarte. El panel recibe foco al abrir y se restaura al trigger cuando se cierra desde dentro.

## 8. Ownership

| Slice                                                             | Owner / clasificación                               |
| ----------------------------------------------------------------- | --------------------------------------------------- |
| `value`                                                           | `model<string>()`; único valor aplicado/Forms       |
| `mode`, `showAlpha`, `showChannels`, disabled/readonly/validación | inputs del consumer/Forms                           |
| sRGB/HSV/HSL/OKLCH y texto normalizado                            | computed/puras, no mirrors                          |
| presets                                                           | lista privada readonly; sin palette/custom públicos |
| overlay abierto, foco, puntero, muestreo, hue hint y borrador     | efímero de UI por instancia                         |
| `valueCommitted`, `touch`, `opened`, `closed`                     | eventos de dominio/lifecycle existentes             |
| recent/custom colors                                              | ausentes; ningún owner creado                       |

## 9. Canonical color model

La fuente de verdad sigue siendo el string `value`. `_color` es sRGB derivado por `parseColor`; HSV/HSL/OKLCH se calculan al leer. `_hueHint` solo conserva hue de colores acromáticos durante la interacción. No hay tres owners de color.

## 10. Parsing

`color-utils.ts` sigue siendo puro y sin Angular: HEX/HEXA (incluida abreviatura), RGB(A), HSL(A) y OKLCH aprobados. Entrada incompleta/inválida permanece como borrador y no escribe `value`; límites y gamut siguen el motor N2-009. EyeDropper usa el mismo parser de `sRGBHex`.

## 11. Serialization

Se reutiliza `serializeColor`, sin conversiones acumulativas ni locale implícito. En gestos de edición se serializa alpha si `showAlpha` o `color.alpha < 1`; el valor y texto siguen visibles como HEXA/RGB(A)/HSL(A)/OKLCH alpha. El muestreo RGB conserva el alpha aplicado previo, pues la API no entrega alpha. Presets opacos siguen siendo elecciones explícitas opacas.

## 12. Signal Forms

Sin CVA, `NG_VALUE_ACCESSOR` ni espejo Forms. `value=model<string>()`; `[formField]`, `[formControl]`, `formControlName` y `[(ngModel)]` pasan en la matriz especializada. Reset/disabled/readonly y parent writes conservan ownership externo; no echo de writes.

## 13. Interaction

Swatch, texto, canales, hue, alpha, plano HSV y EyeDropper comparten `commitColor`/`finishColorChange`. Los gestos continuos emiten `value` durante el gesto y `valueCommitted` una vez al terminar si cambió. Rechazo/cancelación/permisos de EyeDropper no emiten valor. No se creó `sampledColor` ni evento paralelo.

## 14. Pointer

Un `pointerId` activo por instancia; un segundo puntero no sustituye al primero. La captura se libera en up, cancel, pérdida de captura, cierre, reset, parent write invalidante y destroy. No listener global ni rAF permanente. Pruebas cubren commit único, cancelación, cambio de formato y destrucción.

## 15. Keyboard

Plano: Left/Right ajustan saturación, Up/Down brillo, Shift ×10, Home/End saturación 0/100, PageUp/PageDown brillo ±10. Hue/alpha usan rangos nativos; botones admiten Enter/Space nativos. Escape del texto cancela solo el borrador; Escape del overlay pasa por el guard y cierra. La alternativa textual/canales existe sin puntero.

## 16. Focus

El panel recibe foco al adjuntarse y el trigger lo recupera al cerrar desde dentro. Cada instancia usa ID de panel estable y propio; el blur ya no consulta el primer `.neu-cp__panel` global. Microtasks de foco/touch verifican destroy. Focus-visible sigue en trigger, plano, rangos, presets, formatos y botón de muestreo.

## 17. Overlay

Se conserva CDK ConnectedOverlay, backdrop y política `NEU_OVERLAY_DISMISS_GUARD`. Escape usa `overlayKeydown`; fuera usa `backdropClick`, ambos del overlay propio. Se retiraron dos `@HostListener('document:…')` por instancia. `opened`/`closed` siguen ligados a attach/detach exactly-once, no estado URL/storage.

## 18. A11y

Trigger con nombre/valor textual, `aria-expanded` y `aria-controls`; panel `role=dialog`. Plano mantiene `role=slider`, valor/rango y `aria-valuetext` con las dos dimensiones; rangos nativos tienen nombre y valor. Error de muestreo se anuncia mediante `role=status`; botón nativo expone busy/disabled. El color nunca es el único dato: HEX/text input y canales siguen disponibles. La semántica de plano bidimensional es heredada; no se añadió ARIA ornamental.

## 19. Visual tokens

Se preservan los tokens canónicos congelados en N2-023. El botón nuevo usa `--neu-border-color`, `--neu-radius`, `--neu-text-primary`, `--neu-surface-1` y `--neu-primary`; no se introdujo alias visual antiguo. `audit:tokens` PASS, 266 tokens.

## 20. Signal graph

`value`/config aplicados → `computed` de color/canales/texto → template. `_draft` es `linkedSignal` efímera reiniciada por config; `_textInvalid` es `computed`. La detección de EyeDropper ocurre en `afterNextRender`, después del render/hidratación; no hay `effect` de sincronización.

## 21. Writable state

Solo UI efímera: apertura, modo elegido localmente, borrador, hue hint, capacidad/pending/error de muestreo y correlación de gesto/puntero. Sin mirror writable de `value`, `mode`, alpha aplicado, Forms o validación externa.

## 22. Effects

**0 product `effect()`** en ColorPicker. Un callback `afterNextRender` para detección de capacidad; no sincroniza dominio ni toca SSR.

## 23. SSR

La importación/render no instancian EyeDropper ni leen `window`/geometría. El servidor emite trigger estable, sin panel abierto ni sampler, y 0 cambios/request de ColorPicker. `AbortController` solo se crea desde un gesto browser.

## 24. Hydration

Angular 22 + Chromium real: DOM trigger reutilizado, 0 NG050x, sin eco de valor, primer edit de teclado, puntero y muestreo simulado una vez cada uno. El botón de EyeDropper se detecta después del render para evitar divergencia SSR/cliente; el test inyecta una implementación browser simulada antes de hidratar. `test:n2-color-picker-hydration` PASS.

## 25. Zoneless

Fixture real con `provideZonelessChangeDetection()`, sin Zone.js ni `detectChanges` de arquitectura de producto. PASS.

## 26. Lifecycle/resources

100 ciclos create/open/destroy en JSDOM: 0 paneles remanentes. Capture y muestreo pendiente se cancelan; una promesa del browser que resuelva tarde no escribe `value` ni emite eventos. El CDK posee sus propios recursos de overlay; ColorPicker ya no instala listeners documentales.

## 27. Multiple instances

IDs de panel únicos, estado de muestreo/puntero por instancia y límite de focus propio. Prueba explícita de blur entre dos paneles PASS. No singleton mutable de color.

## 28. Performance

Medición reproducible local, no claim de browser/producto. Motor puro: 100 lotes de 1.000 operaciones, ms/op p50/p95. Antes → después: parse+serialize `0.000943/0.001785` → `0.000950/0.001829`; proyección `0.000403/0.000760` → `0.000400/0.000763`; matemática de puntero `0.000380/0.000709` → `0.000384/0.000708`. Motor no modificado; diferencias de ruido. JSDOM final, 100 muestras p50/p95: create/open/destroy `3.05/4.57 ms`, gesto puntero `0.0051/0.0109 ms`, teclado `0.0076/0.0112 ms`. No baseline pre-cambio comparable para lifecycle/DOM; no se afirma mejora ahí. Palette lookup: no feature pública ni lookup dinámico.

## 29. Bundle

Consumer Angular-compiled ESM minificado, Angular/CDK/RxJS external, `measure-h9-b3-color-picker-consumers.mjs`: basic previo `55.627 B raw / 11.697 B gzip / 10.186 B Brotli`; final `60.187 / 12.323 / 10.760 B`. Delta `+4.560 raw`, `+626 gzip` (**+5,35 %**), `+574 Brotli`. Full/overlay usa el mismo bundle por template Angular atómico. Atribución: lógica/cancelación privada de EyeDropper, UI accesible, IDs/foco y liberación de captura; el esbuild metafile sitúa `57.069 B` del output en FESM ColorPicker y no muestra nueva librería. Se investigó el umbral ~5 %; 626 B gzip es coste focal, sin dependencia pesada ni split justificable.

## 30. Root-unused

Import no usado desde `@neural-ui/core/color-picker`: `0 B raw`. Import no usado desde root: `0 B raw`. PASS.

## 31. Dependency graph

Angular core, Forms Signals como tipo, CDK Overlay y primitivas Neural ya existentes. Sin PrimeNG, Table, TreeTable, Router, HTTP, storage ni librería de color tercera. EyeDropper es API nativa opcional browser-only.

## 32. Directed tests

4 archivos / **105 tests PASS**: motor puro (54), ColorPicker (21), matriz especializada de Forms (4), contrato de eventos H9 (26). Incluyen valores/alpha/OKLCH, gestos, multiinstancia, cancellation/permission/late result, parent write, overlay/foco, lifecycle y benchmark JSDOM. No se ejecutó full suite ni coverage global, conforme a la política N2-024.

## 33. Types

`test:n2-forms-types` PASS: fixtures positivos/negativos incluyen ColorPicker string. `NeuColorMode` es unión cerrada; los tipos EyeDropper son privados y no hay `any` público nuevo.

## 34. Contracts

Nuevo `test:n2-color-picker-contracts`: 3/3 PASS para Signal Forms, 4 outputs existentes, modos cerrados, ausencia CVA/effects/listeners globales/dependencias prohibidas y tokens. `audit:cva` PASS: 24 Signal Forms / 0 CVA. `audit:tokens` PASS.

## 35. Build/package

`ng build ui-core --configuration production` PASS; solo warnings NG8102 conocidos de Menu. En un paquete limpio aislado generado del mismo source: `npm pack --dry-run` PASS (347 archivos), `publint` PASS y ATTW **del entrypoint ColorPicker** PASS. El `dist` ignorado local contiene 108 entradas duplicadas antiguas; `verify:package`/auditoría global sobre ese árbol se atascan en `npm pack`/`publint`. No se borraron esos artefactos ajenos. ATTW global, incluso en paquete limpio, señala una resolución Node10 del root `@neural-ui/core/foundation`, fuera del entrypoint y sin cambio de root en N2-024; no se corrigió packaging global en una fase focal. El paquete/entrypoint ColorPicker sí está verificado.

## 36. Regressions

Forms y H9 dirigidos verdes tras adaptar una prueba H9 que simulaba blur sin sacar realmente el foco del nuevo panel. No se modificaron Table, TreeTable ni otros runtimes.

## 37. Known excluded debts

No se tocaron los 17 demos Showcase, Menu NG8102, Gantt/OrganizationChart, root ATTW Node10 ni el `dist` ignorado contaminado. No se implementó N2-025.

## 38. Git diff/status

Cambios N2-024: componente/SCSS/spec ColorPicker, prueba H9 focal, dos scripts de gate y scripts `package.json`, más este informe. `git diff --check` PASS; sin commit N2-024, push, tag, release ni publish. Rama `v2`; cero symlinks versionados o añadidos; temporales de hidratación/paquete limpiados. Existe un untracked ajeno `projects/ui-core/tree-table/public_api 2.ts` (mtime 12 Sep), que se conservó intacto y no se incorpora a N2-024.

## 39. Risks

EyeDropper depende de disponibilidad, contexto seguro, permisos y activación del browser; los casos de no soporte/cancelación/permiso están cubiertos por fallback y tests, pero no se fuerza una captura real de pantalla en headless. El crecimiento gzip relativo supera 5 % por solo 626 B y queda atribuido. La higiene del `dist` local y ATTW root son riesgos de verificación global externos al cambio ColorPicker, documentados sin intervención transversal.

## 40. Final recommendation

**READY FOR N2-025.** N2-024 cumple el target focal sin alterar la API pública ni el contrato Signal Forms. N2-025 no se inició; esperar revisión y autorización. No crear commit N2-024 automáticamente.
