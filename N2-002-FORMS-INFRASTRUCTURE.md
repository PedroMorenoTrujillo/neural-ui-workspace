# N2-002 — Signal Forms infrastructure + dos controles piloto

## 1. Estado

**Resultado:** `PASS WITH RECORDED RISKS`
**Recomendación:** `READY FOR N2-003/004`
**Base:** rama local `v2`, HEAD `a6a9606613fba61e7c337c3f57d1aecbb11702e8`.
**Alcance ejecutado:** infraestructura de Forms y migración exclusiva de `NeuInputComponent` y `NeuCheckboxComponent`.
**Restricciones respetadas:** sin adapter Neural de Forms, sin doble contrato CVA/Signal Forms, sin migrar otros controles, sin symlinks en el repositorio y sin commit, push, tag, release ni publicación.

Los cuatro caminos oficiales de Angular funcionan para ambos pilotos. No apareció la contradicción que habría obligado a marcar N2-002 como `BLOCKED`.

## 2. Angular Forms Signal API real utilizada

Se inspeccionó la instalación real de Angular 22.1.6 y su runtime, declaraciones y código de `@angular/forms/signals` antes de modificar producto.

- `FormValueControl<T>` exige `value: ModelSignal<T>`.
- `FormCheckboxControl` exige `checked: ModelSignal<boolean>`.
- `FormUiControl` contempla los estados `errors`, `disabled`, `disabledReasons`, `readonly`, `hidden`, `invalid`, `pending`, `touched`, `dirty`, `name`, `required`, `min`, `minLength`, `max`, `maxLength` y `pattern`.
- Sus límites de interacción oficiales son `touch`, `focus` y `reset`.
- El runtime instalado enlaza controles con `NgControl` y los modelos custom sin exigir `ControlValueAccessor`; esta interoperabilidad se confirmó después con ejecución real en las cuatro familias.

No se diseñó ninguna API desde memoria ni se añadió una capa productiva encima de Angular Forms.

## 3. Diseño final de NeuInput

`NeuInputComponent` implementa únicamente `FormValueControl<string>` y expone `readonly value = model<string>('')`. El DOM deriva directamente del modelo público; no existe un segundo signal de valor.

La edición nativa escribe en `value` una sola vez. El único estado temporal adicional es el draft de composición IME, que representa una composición todavía no confirmada y no una segunda fuente canónica. Se preservan `autocomplete`, selección/caret, foco, blur, atributos nativos, ARIA, SSR e hidratación.

## 4. Diseño final de NeuCheckbox

`NeuCheckboxComponent` implementa únicamente `FormCheckboxControl` y expone `readonly checked = model<boolean>(false)`. El checkbox nativo refleja y actualiza ese modelo booleano sin estado CVA paralelo.

`indeterminate` continúa siendo exclusivamente visual. `readonly` conserva el elemento enfocable pero revierte cualquier intento de mutación; `disabled` usa la semántica nativa y tampoco muta.

## 5. CVA eliminado de Input: evidencia

En `projects/ui-core/input/neu-input.component.ts` se eliminaron:

- `implements ControlValueAccessor`;
- `writeValue`, `registerOnChange`, `registerOnTouched` y `setDisabledState`;
- callbacks `_onChange`/`_onTouched`;
- estado `_cvaDisabled` y cualquier valor CVA espejo.

La búsqueda estática del nuevo auditor y la búsqueda directa de esos símbolos dan cero coincidencias en el piloto.

## 6. CVA eliminado de Checkbox: evidencia

En `projects/ui-core/checkbox/neu-checkbox.component.ts` se eliminaron la interfaz CVA, sus cuatro métodos, callbacks y estado espejo. El único dato editable es `checked: ModelSignal<boolean>`.

El auditor clasifica el componente como `SIGNAL-FORM-CONTROL`, no como CVA pendiente.

## 7. NG_VALUE_ACCESSOR eliminado: evidencia

Ninguno de los dos pilotos importa, provee o referencia `NG_VALUE_ACCESSOR`. Sus metadatos de componente no contienen providers de acceso de valor. El auditor falla si reaparece el token, una interfaz CVA, sus métodos o outputs manuales redundantes.

## 8. ModelSignals finales

- Input: `readonly value = model<string>('')`, con `valueChange` generado exclusivamente por Angular.
- Checkbox: `readonly checked = model<boolean>(false)`, con `checkedChange` generado exclusivamente por Angular.

No hay declaración manual adicional de `valueChange` ni `checkedChange`. Los type tests rechazan los valores ajenos a esos tipos.

## 9. Estados FormUiControl usados

Input implementa `disabled`, `readonly`, `hidden`, `invalid`, `pending`, `touched`, `dirty`, `errors`, `name`, `required`, `min`, `max`, `minLength`, `maxLength` y `pattern`, además de `touch`, `focus` y `reset`.

Checkbox implementa `disabled`, `readonly`, `hidden`, `invalid`, `pending`, `touched`, `dirty`, `errors`, `name` y `required`, además de `touch`, `focus` y `reset`.

Son entradas oficiales enlazadas por Angular, no signals de estado simulados por Neural.

## 10. Touch semantics

Los tests verifican que foco y escrituras programáticas no tocan el control. El blur real emite `touch` y Angular cambia `touched` una sola vez. En estos controles simples no existe navegación interna compuesta que deba considerarse salida.

## 11. Dirty semantics

Una edición de usuario marca `dirty`; una escritura del parent/FormControl no lo marca; `reset` restaura el estado oficial. La hidratación real comienza sin interacción ficticia y la primera edición posterior se registra una sola vez.

No existe un signal Neural propio para emular `dirty`.

## 12. Disabled

El estado oficial `disabled` se propaga al control nativo. Impide foco operativo y mutación y actualiza los estados/atributos accesibles aplicables. Los tests cubren intentos de input/change mientras está deshabilitado.

## 13. Readonly

Input usa `readonly` nativo: mantiene foco, selección y copia, pero no acepta edición. Checkbox comunica readonly mediante ARIA, sigue siendo enfocable y bloquea/revierte pointer y teclado sin cambiar `checked`.

`disabled` y `readonly` son caminos independientes y no se mezclan.

## 14. Reset

Signal Forms y Reactive Forms se prueban con reset a `''` para Input y `false` para Checkbox. También se cubren Reactive Forms non-nullable y actualización externa de `ngModel`.

El reset de Input limpia únicamente el draft de composición efímero; Checkbox no mantiene estado efímero que limpiar. El valor lo establece Angular y no se emite una interacción falsa.

## 15. Validación síncrona

Con la API oficial Signal Forms se ejecutaron y propagaron:

- Input: `required`, `minLength`, `maxLength`, `pattern` y validator custom síncrono.
- Checkbox: semántica de boolean requerido/`requiredTrue` y validator custom booleano.

Los constraints compatibles llegan al elemento nativo y los estados `invalid`, `errors` y ARIA se reflejan en los pilotos. No se creó un motor de validación Neural.

## 16. Validación asíncrona, pending y cancelación

Input usa `validateAsync` y `resource` oficiales. Los tests demuestran entrada en `pending`, éxito, fallo, abort de la petición anterior y descarte del resultado stale. La validación más reciente conserva la autoridad sobre el campo.

## 17. Signal Forms [formField]

`form(signalModel)` + `[formField]` pasa con Input y Checkbox reales. Se verificaron edición, propagación de valor, touched, dirty, reset y escritura externa.

## 18. Reactive Forms [formControl]

`new FormControl(..., { nonNullable: true })` + `[formControl]` pasa para ambos pilotos sin CVA. Se verificaron ediciones de usuario, `setValue`, reset y ausencia de eco.

## 19. Reactive Forms formControlName

Un `FormGroup` con `formControlName="text"` y `formControlName="flag"` pasa para ambos componentes. No se emplea directiva adaptadora ni provider Neural.

## 20. Template-Driven Forms ngModel

`[(ngModel)]` pasa con modelos writable tipados `string` y `boolean`. Las actualizaciones externas vuelven a renderizar los controles y no se interpretan como edición de usuario.

Se normaliza solo para render el `null` transitorio interno que Template Forms utiliza durante su inicialización; la API pública continúa siendo estrictamente `string` y no acepta `null`.

## 21. Matriz 4x2 completa

| Camino                     | Input | Checkbox |
| -------------------------- | ----- | -------- |
| Signal `[formField]`       | PASS  | PASS     |
| Reactive `[formControl]`   | PASS  | PASS     |
| Reactive `formControlName` | PASS  | PASS     |
| Template `[(ngModel)]`     | PASS  | PASS     |

No hay ningún fallo bloqueante en la matriz.

## 22. Tests exactly-once

Los tests observan los ModelSignals y los formularios: escribir en Input o cambiar Checkbox produce una actualización del DOM, una actualización del dato y exactamente una notificación. No existe la cadena `model → effect → model`.

La primera interacción después de hidratación también se validó exactamente una vez en navegador real.

## 23. Tests parent write sin eco

Las escrituras mediante ModelSignal, `FormControl.setValue`, FormGroup y actualización externa de ngModel renderizan el valor/checked sin emitir un cambio de usuario adicional. Reset tampoco genera eco.

## 24. Preservación de IME

Input conserva buffering de `compositionstart`/`compositionend`, no publica valores intermedios y confirma una sola vez al terminar la composición. También se prueba la secuencia de `input` duplicada posterior y el caso en que una escritura externa gana durante una composición, preservando caret/selección y autoridad del parent.

## 25. Checkbox keyboard y accesibilidad

Se mantiene un `<input type="checkbox">` semántico con label asociado, estados checked/indeterminate, `aria-required`, `aria-invalid`, `aria-readonly`, `aria-disabled` y `aria-busy` cuando proceden.

La prueba de navegador real activa el checkbox con `Space` después de hidratar. Pointer, foco, required, invalid, readonly y disabled también están cubiertos.

## 26. SSR

El consumidor Angular 22.1.6 renderiza ambos pilotos desde el paquete construido. Se validaron valor SSR, checked SSR, required, disabled, readonly, estados accesibles, anotaciones de hidratación y cero emisiones de escritura. El smoke general importa por SSR los 104 entrypoints.

## 27. Hydration

La prueba real en Chromium intercepta el arranque cliente, captura los nodos SSR y verifica que Angular reutiliza esos mismos nodos. Resultado: cero errores de hidratación, valores y estados preservados y primeras ediciones de Input/Checkbox exactamente una vez.

El fixture se prepara con copias ordinarias en un directorio temporal; no monta dependencias mediante symlinks.

## 28. Zoneless

La matriz y validación configuran explícitamente `provideZonelessChangeDetection()`. El consumidor Angular 22 también es zoneless. SSR, hidratación, escrituras externas y primeras interacciones pasan sin Zone.js.

## 29. Type tests

Se añadieron fixtures compile-only positivos y negativos:

- Input acepta `string` y rechaza `null` y `number`.
- Checkbox acepta `boolean` y rechaza `null`, `1` y `'true'`.
- Los componentes satisfacen `FormValueControl<string>` y `FormCheckboxControl` oficiales.

`npm run test:n2-forms-types`: PASS.

## 30. Total de unit tests

- Suite completa: **153 archivos, 3379 tests, 3379 PASS, 0 FAIL**.
- Suite dirigida N2: **4 archivos, 71 tests, 71 PASS, 0 FAIL**.
- Contratos: **5 tests, 5 PASS, 0 FAIL**.
- Compatibilidad Angular declarativa: **3 tests, 3 PASS, 0 FAIL**.

Los mensajes de jsdom sobre parsing CSS/navegación y dos warnings NG8102 de Menu ya existían y no representan fallos.

## 31. Cobertura

Cobertura global completa:

- statements: **98.11%** (25708/26201);
- branches: **95.95%** (15122/15759);
- functions: **98.60%** (5372/5448);
- lines: **98.87%** (20441/20673).

Pilotos:

- Input: statements 96.70%, branches 95.06%, functions 96.77%, lines 97.24%.
- Checkbox: 100% en statements, branches, functions y lines.

No se redujo ningún umbral. El checker histórico por componente aún enumera 18 componentes no modificados con alguna métrica inferior al 95%; ninguno de los dos pilotos está en esa lista.

## 32. Nuevo auditor Forms

`audit:forms`/`audit:cva` distingue ahora:

- `SIGNAL-FORM-CONTROL`: **2** (`NeuInputComponent`, `NeuCheckboxComponent`);
- `LEGACY-CVA-YET-TO-MIGRATE`: **22**.

Para los pilotos valida interfaz y model correctos, ausencia de CVA/`NG_VALUE_ACCESSOR`/métodos/outputs manuales, `touch`, disabled, readonly, focus y reset. Resultado: PASS.

## 33. Bundle before/after

Medición aislada contra HEAD, con ESM minificado y Angular/CDK/ng-icons/RxJS externalizados:

| Escenario             | Antes raw/gzip/brotli | Después raw/gzip/brotli |           Delta |
| --------------------- | --------------------: | ----------------------: | --------------: |
| entrypoint Input      |       34111/5887/4982 |         37139/6100/5185 | +3028/+213/+203 |
| entrypoint Checkbox   |       11716/2467/2066 |         14383/2711/2245 | +2667/+244/+179 |
| consumer Input        |       33885/6239/5341 |         36117/6437/5508 | +2232/+198/+167 |
| consumer Checkbox     |       13915/3322/2846 |         16337/3672/3111 | +2422/+350/+265 |
| consumer Forms mínimo |       43474/7457/6348 |         48127/7705/6540 | +4653/+248/+192 |
| root-unused           |                0/20/1 |                  0/20/1 |           0/0/0 |

El aumento procede principalmente del metadato de bindings oficiales `FormUiControl`. A la vez desaparecen los imports runtime de `@angular/forms` en ambos entrypoints y el import de `@angular/common` en Input.

El gate histórico `audit:bundle:main` mantiene agregado, paquete y arquitectura en PASS, pero sus cinco escenarios Tree superan el techo raw: 116501 B frente a 114914 B; gzip 20747 B permanece por debajo del techo de fallo 21139 B y brotli 17120 B por debajo de 17820 B. La medición N2 aislada de Tree registra +4805 raw, +724 gzip y +221 brotli porque Tree incorpora Checkbox. Se registra como riesgo visible; no se cambió el baseline ni la política para ocultarlo.

## 34. Dependencies before/after

Dependencias runtime del paquete antes y después: únicamente `tslib: ^2.3.0`. No se añadió Zone.js, un adapter Neural, una librería externa ni otra dependencia productiva.

El consumer Forms mínimo externaliza Angular y root-unused continúa en 0 raw, por lo que no hay retención de Signal Forms cuando el control no se usa.

## 35. Regresiones

Resultados finales:

- build del paquete: PASS;
- suite unitaria completa: PASS;
- suite dirigida Input/Checkbox/matriz/validación: PASS;
- contratos y snapshots públicos: PASS (104 entrypoints, 843 declarations, 1511 bindings, 5806 símbolos clasificados);
- tipos: PASS;
- verificación de paquete: PASS (439 archivos);
- publint/npm pack: PASS;
- imports: PASS (104);
- SSR smoke: PASS (104);
- consumidor Angular 22.1.6: PASS;
- SSR N2: PASS;
- hidratación real/zoneless: PASS;
- auditor Forms 22+2: PASS;
- bundle específico N2: PASS con coste registrado;
- bundle histórico principal: agregado/paquete/arquitectura PASS; escenarios raw de Tree en riesgo registrado.

No se modificó ni migró ninguna otra familia de Forms, ni Showcase, tokens o entrypoints.

## 36. Riesgos

1. **Bundle Tree raw:** la incorporación legítima del metadato oficial de Checkbox hace que el gate histórico raw de Tree supere su techo, aunque las métricas de transferencia gzip/brotli no alcanzan el techo de fallo y el agregado/package/architecture pasa. Debe revisarse el presupuesto o la composición de Tree en una tarea explícita; no se encubrió en N2-002.
2. **Checker de cobertura histórico:** 18 componentes ajenos a estos pilotos siguen bajo 95% en alguna métrica. Los pilotos sí cumplen el 95% por métrica y la cobertura global pasa.
3. **Inicialización de ngModel:** Angular puede escribir internamente un `null` transitorio antes del valor string. Input lo tolera únicamente en render durante ese ciclo; el contrato TypeScript y el ModelSignal siguen siendo `string` estricto.
4. **Worktree acumulativo:** la rama ya contenía cambios no relacionados de fases anteriores. N2-002 los preservó y no intentó limpiarlos o apropiárselos.

## 37. Git diff

El diff propio de N2-002 comprende:

- implementación y specs de Input y Checkbox;
- matriz y validación Signal Forms de testing;
- fixtures compile-only de tipos;
- fixtures SSR/hidratación del consumidor;
- auditor Forms 22 CVA + 2 Signal;
- auditor de bundle específico N2;
- scripts de preparación/prueba de hidratación;
- scripts npm asociados;
- snapshots de contrato público actualizados;
- este informe.

No se generó commit. El diff global del worktree incluye además trabajo previo ya existente y no debe atribuirse íntegramente a N2-002.

## 38. Git status

Estado global observado antes de añadir este informe: **124 modificados, 6 eliminados y 28 no rastreados (158 entradas)**, acumulando fases anteriores y N2-002. No se revirtieron cambios ajenos.

La inspección del repositorio excluyendo `node_modules` y `dist` no encontró symlinks. No se realizó commit, push, tag, release ni publicación.

## 39. Recomendación

**`READY FOR N2-003/004`**.

La interoperabilidad oficial queda probada en los cuatro caminos y no requiere CVA ni adapter propietario. La expansión a otras familias debe conservar la misma disciplina de ModelSignal único, exactly-once, tipos estrictos, SSR/hidratación/zoneless y medición aislada de bundle.

N2-003/004 no se ha iniciado ni ejecutado en esta tarea.
