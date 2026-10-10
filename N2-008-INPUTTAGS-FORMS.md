# N2-008 — InputTags Signal Forms + Tags merge

## 1. Estado

PASS WITH RECOMMENDATIONS. El scope N2-008 está implementado y verificado; no se ha iniciado N2-009.

## 2. InputTags target final

`NeuInputTagsComponent<T = string, V = T>` implementa `FormValueControl<readonly V[]>`, usa `value = model<readonly V[]>([])` y conserva una única API pública canónica para edición de colecciones, sugerencias y plantillas.

## 3. Inventario completo Tags

El componente retirado exponía `label`, `placeholder`, `disabled`, `suggestions`, `separators`, `removeLabel`, `value`, `draft`, `filteredSuggestions`, `inputId`, las plantillas `neuTagsTag`/`neuTagsSuggestion`, adición por Enter o separador, eliminación por botón o Backspace, commit al blur y CVA (`writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`). Su SCSS sólo consumía tokens globales ya existentes; no poseía tokens públicos exclusivos.

## 4. Capabilities portadas

`label`, `placeholder`, `disabled`, `separators` y `removeLabel` se conservan con el mismo propósito. `suggestions` pasa a `options`; `neuTagsTag` pasa a `neuInputTagsItem`; `neuTagsSuggestion` pasa a `neuInputTagsOption`; Enter, Backspace, blur, botón de borrado y filtrado están cubiertos por la implementación y las pruebas de InputTags.

## 5. Capabilities retiradas y justificación, si alguna

Se retiran únicamente nombres y mecanismos redundantes: selector `neu-tags`, entrypoint `tags`, directivas `neuTagsTag`/`neuTagsSuggestion` y CVA. No se conserva alias porque el contrato exige una sola superficie. No se ha identificado capacidad funcional de Tags sin equivalente en InputTags.

## 6. Merge Tags

El merge es físico, no un wrapper: los cinco archivos del paquete Tags se eliminan. El caso equivalente es `NeuInputTagsComponent<string, string>`.

## 7. Tags entrypoint eliminado

Desaparece `@neural-ui/core/tags`; build, paquete, import smoke y SSR confirman que no queda export público ni selector `neu-tags`.

## 8. CVA eliminado

InputTags ya no implementa `ControlValueAccessor` ni contiene `writeValue`, `registerOnChange`, `registerOnTouched` o `setDisabledState`.

## 9. NG_VALUE_ACCESSOR eliminado

Se elimina el provider de `NG_VALUE_ACCESSOR`. La integración se realiza mediante el contrato oficial Signal Forms y los adaptadores Angular 22.

## 10. ModelSignal

El único modelo público es `readonly value = model<readonly V[]>([])`. Las mutaciones de usuario publican una copia inmutable y las escrituras del padre no generan eco.

## 11. T/V typing

`T` representa la opción y `V` el valor. `optionValue` normaliza `T → V`; items, eventos, templates, comparador y Forms operan con `V`. Hay fixtures válidos e inválidos para `string/string` y `Person/number`.

## 12. Separators

`separators: readonly string[]` admite uno o varios separadores, caracteres con significado RegExp, separadores consecutivos y extremos vacíos. `normalizeToken` se aplica antes de aceptar valores.

## 13. Duplicates

`allowDuplicates=false` se evalúa después de convertir a `V`, incluyendo valores aceptados en la misma operación atómica. `maxItems` se aplica sobre el resultado normalizado.

## 14. compareWith

El comparador por defecto es `Object.is`, por lo que distingue `+0/-0` y considera `NaN` igual a `NaN`. Se prueba además un comparador de objetos por clave.

## 15. IME

Se respeta `COMPOSITION_BUFFER_MODE`: no hay commit ni request intermedio durante composición; `compositionend` procesa una sola vez; blur durante composición no confirma el draft y las escrituras externas se preservan.

## 16. Paste

Paste tokeniza, normaliza, filtra duplicados y límite, y publica como máximo una mutación. `pasteResult` entrega `accepted` y `rejected` con el evento original.

## 17. commitOnBlur

`commitOnBlur` es explícito y por defecto `false`. Sólo confirma al abandonar el boundary completo, nunca al mover foco dentro ni durante IME.

## 18. Suggestions

`options` y `groups` comparten Option API (`optionLabel`, `optionValue`, `optionDisabled`). Se soportan filtrado local, grupos deshabilitados, loading, estado vacío, foco activo y templates tipados.

## 19. Requests/lifecycle

`suggestionsRequest` contiene `requestId`, `queryRevision`, `query` y reason `initial|query|retry`; el debounce invalida revisiones obsoletas. `opened`/`closed` se emiten una vez por transición y no por escrituras de valor.

## 20. Touch

`touch` se emite al abandonar el boundary del control. Un cambio de foco entre input, chips y panel no marca touch.

## 21. Dirty

Signal Forms marca dirty sólo tras ediciones originadas en el modelo del control. La matriz comprueba dirty en los seis casos.

## 22. Reset

`reset()` limpia draft, composición, timer, panel, foco activo y live region sin sobrescribir el valor que controla Forms.

## 23. Disabled

Disabled bloquea teclado, paste, selección, borrado, reorder, clear, requests y focus; también se refleja en el input nativo y clases de host.

## 24. Readonly

Readonly impide todas las mutaciones de usuario manteniendo lectura, chips y valor. El input nativo recibe `readOnly`.

## 25. Validation

Se verifican required de colección, min/max length, regla síncrona custom, pending asíncrono, cancelación con `AbortSignal` y descarte de resultado stale.

## 26. Four-path matrix

La matriz cubre `[formField]`, `[formControl]`, `formControlName` y `[(ngModel)]`; en cada ruta prueba A simple string, B `T != V`, C suggestions, D múltiples separadores, E duplicados desactivados y F `commitOnBlur`: 24 combinaciones.

## 27. Exactly-once

Add/select, paste, remove, reorder, clear, adapters y primera edición post-hydration se verifican con una única emisión por gesto.

## 28. Parent-write-no-echo

Se prueba en ModelSignal, Reactive Forms, ngModel, SSR e hidratación. Las escrituras del padre cambian el valor sin republicarlo.

## 29. Type tests

`test:n2-forms-types` pasa con 17 controles Signal Forms. Rechaza scalar, null y arrays del tipo incorrecto para InputTags y acepta `readonly string[]`/`readonly number[]`.

## 30. Keyboard

Enter confirma o activa opción; Escape cierra; ArrowUp/ArrowDown navegan; Backspace borra el último item con draft vacío; Delete/Backspace borran chips y flechas recorren el boundary.

## 31. A11y

Combobox/listbox mantienen `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-selected`, `aria-required`, `aria-invalid`, busy, labels de borrado y live region. Label, hint y estados se enlazan con IDs estables.

## 32. SSR

El consumidor Angular 22 pasa SSR para 21 controles, InputTags incluido, con valor inicial renderizado, anotaciones `ngh` y cero emisiones de escritura.

## 33. Hydration

Chromium real confirma reutilización del DOM SSR de los 21 controles, valor de InputTags estable, cero errores de hidratación y primera edición exactamente una vez.

## 34. Zoneless

Unit tests, Forms matrix, validación, consumidor e hidratación usan `provideZonelessChangeDetection`; no se depende de Zone.js.

## 35. Performance

Se prueban 2.000 opciones, 500 tags y commit de lote sin emisiones duplicadas. Filtrado y comparación son lineales respecto de las colecciones visibles; no se introduce dependencia nueva.

## 36. Unit tests

Suite completa: 159 archivos y 3.075 tests verdes. El bloque dirigido N2-008 contiene 26 tests: 20 del componente, 4 de matriz y 2 de validación.

## 37. Coverage

Global: 97,46 % statements, 95,24 % branches, 97,37 % functions y 98,31 % lines. InputTags: 98,29 %, 96,00 %, 99,03 % y 99,52 %. No se redujeron thresholds.

## 38. audit:forms final counts

Resultado real: `SIGNAL-FORM-CONTROL = 17`, `LEGACY-CVA-YET-TO-MIGRATE = 5`, componente eliminado por merge = Tags. El cálculo 16/7 − InputTags CVA − Tags CVA + InputTags Signal produce 17/5.

## 39. EntryPoints before/after

103 → 102 por la eliminación exclusiva de `tags`. Package verification pasa con 431 archivos, import smoke con 102 imports y SSR smoke con 102 entrypoints.

## 40. Contract delta

Snapshot oficial: 102 entrypoints, 825 declaraciones exportadas, 1.578 bindings y 5.705 símbolos clasificados. Baseline N2-007: 103, 829, 1.575 y 5.714. El aumento de bindings corresponde al contrato Signal/InputTags; la reducción restante a Tags y APIs legacy eliminadas.

## 41. Bundle simple

Consumidor simple: 49.406 → 54.139 raw, 8.902 → 10.200 gzip, 7.645 → 8.792 Brotli; delta +4.733/+1.298/+1.147 bytes frente a N2-007.

## 42. Bundle rich

Consumidor rich `T != V`: 49.440 → 54.173 raw, 8.922 → 10.218 gzip, 7.634 → 8.810 Brotli; delta +4.733/+1.296/+1.176 bytes.

## 43. Family bundle

Familia: 49.510 → 54.243 raw, 8.945 → 10.240 gzip, 7.649 → 8.824 Brotli. Aggregate N2: delta +4.149 raw, +1.147 gzip, +440 Brotli. `root-unused` permanece 0 raw y sin delta.

## 44. Dependencies

Las dependencias publicadas antes/después son idénticas. No se añade paquete, runtime ni peer dependency.

## 45. Regressions

Pasan build, Forms audit, contratos, package audit/verification, imports, SSR, Angular compatibility, consumidor 22.1.6, type tests, bundle, 3.075 tests y cobertura global. Continúan tres deudas heredadas: 17 demos Showcase ausentes, dos tokens OrganizationChart incompletos y tres SVG inline en MegaMenu/Modal/TreeSelect; ninguno de esos fuentes se modifica en N2-008.

## 46. Risks

El consumidor simple incorpora +1.298 bytes gzip porque suggestions sigue dentro del mismo componente; conviene vigilar una futura separación interna sin alterar API. Persisten warnings NG8102 de Menu y mensajes conocidos de happy-dom. El gate histórico de cobertura por componente sigue señalando componentes ajenos, pero InputTags supera 95 % en sus cuatro métricas.

## 47. Git diff

El diff queda limitado a InputTags/Tags, contratos e inventarios generados, auditoría Forms/bundle, fixtures H9/N2, type tests, matriz, validación e informe. `git diff --check` pasa.

## 48. Git status

Se prepara un único commit local N2-008. No hay push, archivos temporales ni symlinks añadidos; el árbol deberá quedar limpio tras el commit.

## 49. Recommendation

READY FOR N2-009. Recomendación no bloqueante: seguir el coste gzip del caso simple y resolver las tres deudas globales heredadas en sus scopes autorizados. N2-009 no se inicia aquí.
