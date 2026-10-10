# N2-007 — Selector family Signal Forms + Select/Multiselect merge

## 1. Estado

PASS WITH RECOMMENDATION. N2-007 está implementado y sus gates específicos están verdes. `TreeSelect`, `InputTags` y `Tags` permanecen fuera de esta fase; no se ha iniciado N2-008.

## 2. Select target implementado

`NeuSelectComponent<T, V, M extends 'single' | 'multiple' = 'single'>` implementa `FormValueControl<NeuSelectionValue<V, M>>`. Expone `mode`, `options: readonly T[]`, `optionValue: (option: T) => V`, `compareWith` y un único `value = model<NeuSelectionValue<V, M>>()`. El modo single contiene `V | null`; multiple contiene `readonly V[]`; el modo dinámico conserva la unión honesta.

## 3. Multiselect merge

La UX relevante de Multiselect se ha integrado en `<neu-select mode="multiple">`. No existe wrapper, selector alias, componente de compatibilidad ni segundo owner del valor.

## 4. Capabilities portadas

Select multiple cubre chips y su eliminación, `selectionLimit`, `maxSelectedLabels`, toggle-all con scope, estado open controlado, filtrado, templates, carga lazy/remota, clear, opciones deshabilitadas, grupos, virtualización, teclado, ARIA, foco, empty/loading y lifecycle real del overlay. Las pruebas de Select representan explícitamente estas capacidades antes de retirar Multiselect.

## 5. EntryPoint Multiselect eliminado

Se ha eliminado físicamente `projects/ui-core/multiselect`, su `ng-package.json`, API pública, implementación, estilos, tipos, directivas y tests. Tampoco existe `dist/neural-ui/core/multiselect`. El grep final no encuentra `@neural-ui/core/multiselect`, `NeuMultiselectComponent` ni `neu-multiselect` en código, fixtures, scripts, paquete o dist actual; solo el snapshot/reconciliation histórico conserva evidencia legacy.

## 6. Autocomplete strict

`NeuAutocompleteComponent<T, V, F>` en modo `strict` contiene exclusivamente `V | null`. Escribir texto limpia el valor seleccionado sin convertir el string en `V`, mantiene visible el draft y solo una activación de opción confirma un `V`. Se añadió regresión específica para impedir que la sincronización externa borre el texto estricto recién escrito.

## 7. Autocomplete free-text

El modo `free-text` contiene `V | string | null` y separa activación de opción de commit textual. Cubre texto sin match, label igual al texto, selección, blur policy, clear, IME, sugerencias remotas, parent write y reset. No aplica heurística cuando `V` también es string: el consumidor puede usar su propia tagged union.

## 8. CascadeSelect

`NeuCascadeSelectComponent<T, V>` implementa `FormValueControl<V | null>`, con una única fuente pública `options`. El path/expansión permanece como estado interno, el valor Forms siempre es `V`, y `optionActivated` conserva el detalle `T` del dominio. Se cubren nodos anidados, teclado, overlay, clear, lazy/remoto, valor no cargado y boundary de foco.

## 9. Listbox

`NeuListboxComponent<T, V, M>` usa el mismo contrato de cardinalidad: single `V | null`, multiple `readonly V[]`. Conserva virtualización, grupos, drag/drop existente, keyboard, selección, valores remotos, `filterChange`, `rangeChange`, `dataRequest`, templates y metadatos Forms sin emitir `T` como valor.

## 10. ToggleButtonGroup

`NeuToggleButtonGroupComponent<T, V, M>` contiene `V | null` o `readonly V[]`, elimina `neuChange`, mantiene selección/deselección, disabled por opción, readonly, roving tabindex, Home/End/arrows/Enter/Space y ARIA. `optionActivated` añade la opción y el origen sin duplicar el dato Forms.

## 11. T/V/M typing

Toda la familia separa `T` (entidad/opción), `V` (valor Forms) y `M` (cardinalidad). Las fixtures prueban `T != V`, single/multiple, modo dinámico, Autocomplete strict/free-text y valores radio-like sin degradar a `unknown`.

## 12. CVA removal

Select, Autocomplete, CascadeSelect, Listbox y ToggleButtonGroup ya no contienen `ControlValueAccessor`, `NG_VALUE_ACCESSOR`, `writeValue`, callbacks de registro ni `setDisabledState` legacy. Multiselect se elimina en vez de migrarse como sexto control final.

## 13. ModelSignals

Cada selector final tiene un único `value = model<...>()`; `valueChange` es el output generado por Angular. No hay output manual paralelo ni ciclo model → effect → model. Labels, opciones seleccionadas, recuentos y estados visuales se derivan de `value + options`.

## 14. Filtering semantics

El query local/controlado y el transporte remoto están separados. `filterChange` propone o comunica query local; no ordena HTTP. `dataRequest`/`suggestionsRequest` expresa una única intención de transporte. Filtering no se oculta dentro de `selectionOptions`.

## 15. Remote requests

Los requests incluyen `requestId`, `queryRevision`, `query`, rango opcional y reason. Las pruebas cubren initial, query, viewport, retry/reset, respuestas stale/out-of-order y valores seleccionados aún no cargados. Neural UI no realiza HTTP.

## 16. Open ownership

En Select, `open` es input aplicado, `openChange` es propuesta y el estado no controlado vive aparte. `opened` y `closed` se emiten después del attach/detach físico. Autocomplete y CascadeSelect conservan la misma separación entre intención y lifecycle.

## 17. optionActivated

La selección de dominio converge en `{ option: T, value: V, source: 'pointer' | 'keyboard', originalEvent? }`. Se retiraron los canales paralelos `select`, `selectionChange<T>`, `changeDetail` y equivalentes de la familia migrada.

## 18. Touch boundary

`focusEntered`, `focusLeft` y `touch` operan sobre la superficie compuesta completa. Cambiar entre trigger, filtro, lista, chip u overlay child no toca el control; touch ocurre al salir realmente del boundary.

## 19. Dirty

Solo una edición de valor iniciada por el usuario marca dirty mediante la integración Forms. Abrir/cerrar, filtrar, navegar o recibir una escritura del padre no genera dirty ficticio.

## 20. Reset

Angular establece el valor oficial. El reset local limpia query/draft efímero, opción activa, overlay, foco de chip y request UI pendiente sin emitir eco. Los vacíos oficiales siguen siendo `null` para single y `[]` para multiple.

## 21. Disabled

Disabled bloquea apertura, selección, clear, filtro editable y teclado mutador; también se refleja en elementos nativos y atributos accesibles.

## 22. Readonly

Readonly permanece enfocable e inspeccionable y permite abrir overlays donde aporta consulta, pero bloquea toda mutación de `value`, incluido clear, toggle-all y eliminación de chips.

## 23. Equality/compareWith

El default es `Object.is`, probado con `NaN`, `+0` y `-0`. `compareWith` admite objetos reconstruidos con identidad de dominio. No se usa stringify ni deep equality implícita para comparar valores.

## 24. Four-path matrix

La matriz estática cubre nueve targets —Select single/multiple, Autocomplete strict/free-text, CascadeSelect, Listbox single/multiple y ToggleButtonGroup single/multiple— en `[formField]`, `[formControl]`, `formControlName` y `[(ngModel)]`: 36 combinaciones reales de template.

## 25. Exactly-once

Pointer, teclado, clear, toggle-all, remove chip y free-text commit actualizan el modelo una sola vez. Los tests de componente, Forms y Chromium verifican exactamente una emisión por primera edición real.

## 26. Parent-write-no-echo

Las escrituras del padre sincronizan modelo y presentación sin emitir `valueChange`, eventos de dominio o dirty. La adaptación regresiva de filtros de Table conserva `valueChanges` hacia el adapter mientras su guard `_syncing` evita el feedback.

## 27. Type tests

`npm run test:n2-forms-types` pasa: 16 controles oficiales aceptados, cardinalidad de selectores y separación T/V verificadas. Los negativos rechazan array en single, scalar/null en multiple, relaciones strict/free-text incorrectas y valores incompatibles. `npm run test:option-api-template-types` también pasa.

## 28. Keyboard

Se conservan Escape, arrows, Home/End, PageUp/PageDown donde aplica, Enter/Space, typeahead y Tab. ToggleButtonGroup usa roving focus; los overlays restauran foco al origen.

## 29. A11y

Se preservan combobox/listbox/group, expanded, controls, activedescendant, selected, multiselectable, labels de grupo/chip/removal, disabled, invalid, required, readonly, busy, posiciones lógicas y live announcements de límites/toggle-all.

## 30. SSR

El fixture Angular 22 renderiza los 20 controles N2 actuales, incluidos los nueve modos selector, con valores iniciales, chips multiple, overlays cerrados, IDs deterministas, locale explícito y cero ecos de escritura.

## 31. Hydration

Chromium real pasa para los 20 controles: reutilización de DOM SSR, texto estable, cero errores de hidratación y primera interacción exactamente una vez. También incluye valor selector remoto/no cargado.

## 32. Zoneless

Las suites específicas, matriz de Forms, consumidor Angular 22 y prueba real de hidratación usan change detection zoneless. No se añade Zone.js ni dependencia equivalente.

## 33. Performance

Tests dirigidos usan 10.000 opciones en Select, Autocomplete y Listbox. Filtering reduce correctamente a una opción; la ventana virtual queda acotada a 12 filas con viewport 8 + buffer 2; Select y Autocomplete repiten tres ciclos open/close sin paneles desprendidos. Remote/lazy mantiene rangos acotados y request IDs monotónicos. No se crean listeners/effects por opción: la derivación es por `computed` y el lifecycle de overlay limpia frames, estado activo y paneles.

## 34. Unit tests

Las siete suites selector dirigidas suman 309 tests verdes. La suite completa termina con 158 archivos y 3.075 tests verdes.

## 35. Coverage

`npm run test:coverage` pasa sin cambiar thresholds: 97,46% statements, 95,23% branches, 97,39% functions y 98,30% lines. Select queda en 86,69/81,94/86,60/89,33 y ToggleButtonGroup en 97,63/100/88,88/100 (statements/branches/functions/lines).

## 36. audit:forms final counts

`npm run audit:forms` pasa con `SIGNAL-FORM-CONTROL: 16` y `LEGACY-CVA-YET-TO-MIGRATE: 7`. El cálculo migra cinco controles finales y elimina Multiselect por merge; no lo cuenta artificialmente como sexto Signal control. TreeSelect sigue entre los siete CVA pendientes.

## 37. EntryPoints before/after

El inventario público baja de 104 a 103 entrypoints por la única retirada autorizada: Multiselect. Package verification pasa con 435 archivos, import smoke pasa con 103 imports y SSR smoke pasa con 103 entrypoints.

## 38. Contract delta

El snapshot oficial regenerado pasa auditoría: 103 entrypoints, 829 declaraciones exportadas, 1.575 bindings y 5.714 símbolos clasificados. Frente a N2-006: 104 → 103 entrypoints, 862 → 829 declaraciones, 1.623 → 1.575 bindings y 5.974 → 5.714 símbolos. Los models aumentan 13 → 18 por los cinco selectores finales; la reducción restante corresponde al componente/entrypoint Multiselect y a las APIs legacy/renames autorizadas.

## 39. Select single bundle

El entrypoint Select baja 148.694 → 144.794 raw, 21.901 → 20.777 gzip y 18.377 → 17.422 Brotli. El consumidor single baja 125.824 → 121.747 raw, 22.296 → 21.009 gzip y 19.375 → 18.274 Brotli: deltas −4.077, −1.287 y −1.101.

## 40. Select multiple bundle

El consumidor multiple baja 125.826 → 121.749 raw, 22.293 → 21.006 gzip y 19.380 → 18.296 Brotli: deltas −4.077, −1.287 y −1.084. Single y multiple ya compilaban con tamaño prácticamente idéntico antes; el merge no añade un impuesto nuevo al consumidor single y ambos mejoran. La fachada única conserva ramas de modo, mientras chips/toggle-all DOM solo se materializan en multiple.

## 41. Family bundle

El consumidor agregado selector queda 335.995 → 339.757 raw (+3.762), 56.373 → 56.498 gzip (+125) y 38.042 → 37.225 Brotli (−817). El agregado N2 queda +3.749 raw, +60 gzip y −1.170 Brotli. `root-unused` permanece en 0 raw/20 gzip/1 Brotli. Deltas individuales gzip: Autocomplete +104, CascadeSelect +388, Listbox +15 y ToggleButtonGroup +718.

## 42. Dependencies

No se añade ninguna dependencia. El paquete mantiene exclusivamente `tslib: ^2.3.0` en dependencies; root-unused no cambia.

## 43. Regressions

Pasan build, 3.075 unit tests, cobertura, matriz 9×4, type tests, contracts y sus tests, Forms audit, package/publint, 435-file verification, 103 imports, 103 SSR entrypoints, Angular compatibility 3/3, consumidor Angular 22.1.6, SSR de 20 controles, hidratación Chromium zoneless, bundle y `git diff --check`. La regresión dirigida de Table pasa 399 tests después de sustituir sus usos internos de Multiselect por Select multiple.

## 44. Risks

Persisten de `HEAD` tres deudas globales ajenas al scope: `audit:entrypoints` reclama 17 demos Showcase ausentes; `audit:tokens` reclama dos tokens OrganizationChart sin default/documentación; `audit:primitives` detecta inline SVG preexistente en MegaMenu, Modal y TreeSelect. Los tres archivos fuente señalados son idénticos a `HEAD` en esta fase y arreglarlos violaría el scope. También persisten dos warnings NG8102 de Menu y mensajes de parseo CSS de happy-dom, sin fallos. La fachada Select no permite especialización estática por un `mode` runtime, pero su consumidor single se reduce 1.287 bytes gzip frente al baseline y el DOM multiple no se instancia en single.

## 45. Git diff

El diff de N2-007 parte exactamente de `fbe9e5c4c3f9f73f5177089c298f3d9f52eaf330`. Se concentra en los cinco selectores finales, eliminación física de Multiselect, contratos/tipos compartidos, pruebas, fixtures SSR/hydration, inventarios y las adaptaciones mínimas demostradas de Pagination/Table. No modifica la API pública de TreeSelect ni inicia InputTags/Tags.

## 46. Git status

La rama es `v2`. Antes del commit solicitado, el árbol contiene exclusivamente N2-007; `git diff --check` pasa. `find` no encuentra symlinks en `projects/ui-core`, `fixtures` o `scripts`, y el índice Git no contiene entradas modo `120000`.

## 47. Recommendation

READY FOR N2-008, manteniendo como deuda separada los tres gates globales heredados descritos arriba. N2-008 no se ha iniciado.
