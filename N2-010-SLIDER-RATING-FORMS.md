# N2-010 — Slider + Rating — Signal Forms

## 1. Estado

**PASS.** `NeuSliderComponent` y `NeuRatingComponent` quedan migrados al contrato oficial de Signal Forms de Angular 22, sin ampliar el alcance a N2-011 ni a funcionalidades P2. La recomendación de cierre figura en el apartado 35.

## 2. Slider target

`NeuSliderComponent` implementa `FormValueControl<number>` como control escalar horizontal P1. Conserva `min`, `max`, `step`, interacción nativa por puntero, teclado, estados Forms, accesibilidad, SSR, hidratación y ejecución zoneless. No se añadió rango de dos thumbs ni orientación vertical.

## 3. Rating target

`NeuRatingComponent` implementa `FormValueControl<number | null>`. `null` es el único estado vacío oficial; la interacción P1 produce valores enteros y permite limpiar la selección. No se añadió rating fraccional, half-rating ni orientación vertical.

## 4. ModelSignals

- Slider: `readonly value = model<number>(0)`.
- Rating: `readonly value = model<number | null>(null)`.

Cada control tiene un único owner de valor. El `valueChange` público lo genera exclusivamente `model()`.

## 5. CVA/legacy state removed si existía

Se retiró el patrón previo `input(value) + output(valueChange)` de ambos controles. Ninguno implementa `ControlValueAccessor`, registra `NG_VALUE_ACCESSOR`, mantiene callbacks CVA ni usa un adaptador Neural. Tampoco existe un signal espejo del valor.

## 6. Touch

Ambos exponen `touch: OutputEmitterRef<void>` según `FormValueControl`. El foco, `pointerdown` o una selección por sí solos no marcan touched. `touch` se emite cuando el foco abandona el control completo; en Rating, moverse entre estrellas no cuenta como salida.

## 7. Dirty

Angular Forms es el dueño de `dirty`. Solo una edición de usuario que cambie efectivamente el ModelSignal lo activa. Escrituras del padre, inicialización, reset e hidratación no generan dirty ficticio.

## 8. Reset

Angular restaura el valor inicial/non-nullable de Slider y el valor inicial o `null` de Rating. Los componentes solo limpian estado efímero propio: Slider cancela el estado de puntero; Rating limpia hover. No se añadió evento de reset.

## 9. Disabled

Slider usa el estado disabled del `input[type="range"]`; Rating deshabilita sus radios. En ambos casos se bloquean puntero y teclado, se refleja ARIA y no se emiten cambios.

## 10. Readonly

Readonly permanece enfocable para inspección y navegación accesible, pero bloquea toda mutación por puntero, click o teclado. Se expone `aria-readonly="true"`; Rating ya no elimina la interacción de foco mediante `pointer-events: none`.

## 11. Validation

La validación usa exclusivamente Angular Forms. Las pruebas cubren `required`, `min`, `max` y validación custom para ambos controles, con propagación de `invalid`, `pending`, `required` y `errors`. No existe motor de validación Neural paralelo.

## 12. Four-path matrix

| Control | `[formField]` | `[formControl]` | `formControlName` | `[(ngModel)]` |
| --- | --- | --- | --- | --- |
| Slider | PASS | PASS | PASS | PASS |
| Rating | PASS | PASS | PASS | PASS |

La matriz usa templates reales y verifica escrituras del usuario, escrituras del padre sin eco y reset gobernado por Angular.

## 13. Exactly-once

Cada edición lógica que cambia el valor produce una única actualización. Repetir el mismo valor no emite. Las pruebas cubren input nativo/puntero de Slider, teclado de ambos controles, selección/clear de Rating y la primera edición posterior a la hidratación.

## 14. Parent-write-no-echo

Una escritura externa actualiza inmediatamente la UI de Slider o Rating sin emitir de vuelta al padre, sin marcar dirty y sin crear estado duplicado. El consumidor SSR y la matriz Forms verifican este comportamiento.

## 15. Slider pointer

La secuencia probada es `pointerdown` → eventos `input` nativos durante el movimiento → `pointerup`/`pointercancel`. El valor se ajusta a `step`, se limita a `min/max` y solo cambia si el resultado normalizado difiere del valor actual. El estado efímero de puntero no es dueño del número.

## 16. Slider keyboard

Se verifican ArrowLeft/ArrowDown, ArrowRight/ArrowUp, PageDown/PageUp y Home/End. Todos respetan `min`, `max`, `step`, clamping, readonly y disabled, con una actualización como máximo por pulsación efectiva.

## 17. Rating interaction

Click o activación sobre una estrella selecciona el entero correspondiente. Activar de nuevo la estrella seleccionada limpia a `null`; seleccionar el mismo valor por API no duplica eventos. Se probaron selección, clear, null, external write, reset, disabled y readonly.

## 18. Rating keyboard

El patrón usa `radiogroup` + radios: flechas desplazan la selección, Home/End saltan a extremos y Enter/Espacio activan o limpian. En RTL se invierte correctamente el sentido horizontal. El roving tabindex mantiene un único punto de entrada.

## 19. Type tests

Los fixtures compile-only confirman:

- Slider acepta `number` y rechaza `null`, `string` y `boolean`.
- Rating acepta `number | null` y rechaza `string` y `boolean`.
- Ambos son asignables al `FormValueControl<T>` correspondiente.

Resultado: **PASS**, 23 controles Signal Forms aceptados y contratos Slider/Rating aplicados.

## 20. A11y

Slider conserva el range nativo con `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, orientación horizontal, label/describedby y estados required/invalid/readonly/disabled/pending. Rating expone `radiogroup`, radios con `aria-checked`, label accesible y los mismos estados Forms. Los controles readonly siguen siendo perceptibles y enfocables.

## 21. SSR

El consumidor Angular 22.1.6 renderiza los 27 controles N2 en servidor, incluidos Slider y Rating, sin eco. Los smokes de SSR de los 102 entrypoints también pasan.

## 22. Hydration

La prueba en Chromium real confirma anotaciones SSR, reutilización de nodos DOM, cero errores/warnings de hidratación y primera interacción exactly-once para los 27 controles. Slider parte de `35`; Rating parte de `3` y actualiza a `4` una sola vez.

## 23. Zoneless

El consumidor usa `provideZonelessChangeDetection()` tanto en cliente como en servidor. Build, SSR, hidratación y primeras interacciones pasan sin Zone.js.

## 24. Tests ejecutados

- Dirigidos Slider/Rating + matriz + validación: **4 archivos, 27/27 PASS** (`--coverage=false`).
- Type tests N2: **PASS**.
- Build productivo: **PASS**; solo permanecen dos warnings NG8102 heredados de Menu, fuera de alcance.
- Contract snapshot/audit: **PASS**, 102 entrypoints, 828 exports, 1630 bindings y 5775 símbolos clasificados.
- Contract tests: **5/5 PASS**.
- Import smoke: **102/102 PASS**.
- SSR import smoke: **102/102 PASS**.
- Package verification: **431 archivos PASS**.
- Consumidor Angular 22.1.6 + SSR de Forms: **27 controles PASS**.
- Hidratación real zoneless: **27 controles PASS**.
- Bundle dirigido: **PASS**.

Una primera ejecución dirigida heredó coverage activo del runner: las 27 pruebas pasaron, pero los umbrales globales no son representativos para un subconjunto. Se repitió explícitamente con `--coverage=false`, con resultado limpio; no se modificaron thresholds ni se ejecutó la suite global de coverage.

## 25. audit:forms final

**PASS**:

- `SIGNAL-FORM-CONTROL: 23`.
- `LEGACY-CVA-YET-TO-MIGRATE: 1`.
- TreeSelect sigue siendo el único CVA.
- Slider y Rating no contienen CVA, `NG_VALUE_ACCESSOR` ni output manual redundante.

## 26. Bundle Slider

Consumidor dirigido Slider:

| Métrica | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Raw | 15,096 B | 22,702 B | +7,606 B |
| Gzip | 3,286 B | 4,749 B | +1,463 B |
| Brotli | 2,805 B | 4,064 B | +1,259 B |

El entrypoint conserva únicamente imports de `@angular/core` y `@neural-ui/core/internal`.

## 27. Bundle Rating

Consumidor dirigido Rating:

| Métrica | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Raw | 13,956 B | 17,504 B | +3,548 B |
| Gzip | 3,701 B | 4,319 B | +618 B |
| Brotli | 3,215 B | 3,733 B | +518 B |

El entrypoint conserva únicamente imports de `@angular/core` y `@neural-ui/core/internal`.

## 28. Aggregate/root-unused

La familia de interacción sube +11,159 B raw / +1,516 B gzip / +1,252 B brotli. El agregado N2 sube +11,191 B raw / +1,559 B gzip / +334 B brotli. `root-unused` permanece en **0 B raw**. El gate dirigido pasa sin cambiar presupuestos.

## 29. Dependencies

La comparación before/after de dependencias es idéntica. No se añadieron dependencias productivas, adaptadores de Forms ni paquetes auxiliares.

## 30. Contract delta

El contrato público cambia únicamente en los entrypoints de Slider y Rating y en sus snapshots derivados: `input(value) + output(valueChange)` pasa a `ModelSignal`, se declara `FormValueControl<T>`, se incorporan estados oficiales de Forms, `touch`, focus/reset y accesibilidad asociada. La reconciliación registra como removidos los bindings legacy manuales y como nuevos los modelos/bindings Signal Forms. El audit de contratos pasa sin divergencias no declaradas.

## 31. Regressions

No se detectaron regresiones en los gates dirigidos, build, contratos, imports, package, SSR, hidratación, zoneless ni bundle. Los warnings NG8102 preexistentes de Menu no pertenecen a este cambio. No fue necesaria la full suite porque no se modificó infraestructura compartida de runtime y ningún gate descubrió una regresión.

## 32. Risks

- Los modos Slider range/vertical y Rating half/vertical siguen deliberadamente aplazados a N2-026.
- TypeScript expresa Rating como `number | null`, por lo que no puede excluir fracciones en compile-time; la UI P1 produce enteros y normaliza defensivamente la presentación externa sin reescribir el modelo.
- La interacción de arrastre de Slider delega el movimiento al `input[type="range"]` nativo; el contrato exactly-once se aplica a cada evento de edición efectiva, no al gesto completo con múltiples valores intermedios.

## 33. Git diff

El diff queda limitado a Slider, Rating, sus specs, matriz/validación N2-010, fixtures de tipos e hidratación, auditorías dirigidas de Forms/bundle, snapshots de contrato y este informe. No se modificaron TreeSelect, Table, TableCore, TreeTable, Accordion, Tabs, Panel, Sidebar, tokens ni Showcase. `git diff --check`: **PASS**.

## 34. Git status

Antes del commit solo existen cambios esperados de N2-010 y no hay symlinks en el workspace. Tras crear el commit local se comprueba que el árbol queda limpio. No se hace push, tag, release ni publicación npm.

## 35. Recommendation

**READY FOR N2-011.**

N2-010 queda cerrado y validado. Esta recomendación no inicia ni implementa N2-011.
