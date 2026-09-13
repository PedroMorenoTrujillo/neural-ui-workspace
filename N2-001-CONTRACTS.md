# N2-001 — Contratos transversales de Neural UI 2

## 1. Estado de N2-001

**Resultado:** `PASS WITH DECISIONS TO REVIEW`
**Recomendación:** `READY FOR N2-002`
**Alcance:** diseño y documentación exclusivamente; ninguna API de producto ha sido implementada.
**Base:** rama local `v2`, HEAD `a6a9606613fba61e7c337c3f57d1aecbb11702e8`, con Fases 1, 2 y 3A acumuladas.
**Restricciones respetadas:** sin commit, push, tag, release, publicación, showcase, wrappers de compatibilidad ni symlinks.

La puerta de N2-001 queda superada: todos los contratos P1 tienen propietario, tipo, temporalidad y destino de migración. Las decisiones todavía revisables pertenecen a P2/P3 y no alteran el contrato mínimo que necesita N2-002.

## 2. Principios finales

**Estado: APPROVED TARGET.**

1. PrimeNG 22.1.1 es baseline funcional, no fuente de naming ni arquitectura.
2. Neural UI 2 es un major limpio. Neural UI 1 mantiene la API antigua; v2 no incorpora aliases, wrappers ni setters dobles para simular compatibilidad.
3. Una sola fuente writable por slice; el resto es `computed` o estado efímero con significado propio.
4. Signals representan estado real. Se prohíben effects espejo `input/model → signal → output/model`.
5. Tipos públicos fuertes: `T` es entidad/opción, `V` es valor de formulario y `K` es identidad estable.
6. Colecciones públicas son `readonly`; selección vacía es `null` en single y `[]` en multiple.
7. URL, almacenamiento, HTTP y exportadores son adaptadores externos u opcionales, nunca propietarios canónicos.
8. SSR/hydration, zoneless, accesibilidad, cleanup, tree-shaking y rendimiento son condiciones del contrato, no tareas de pulido posteriores.
9. Un breaking change solo se aprueba con destino, ejemplo y owner de implementación.
10. No se expone una API porque Prime la tenga o porque una API Angular sea nueva.

## 3. Modelo de ownership

**Estado: APPROVED TARGET.**

| Clase | Nombre | Fuente writable | Emisión | Ejemplos |
| --- | --- | --- | --- | --- |
| A | INPUT | Consumidor; el componente solo aplica | Ninguna por escribir el input | `data`, `options`, `loading`, `query`, `activeId` |
| B | MODEL | Consumidor y control comparten un dato que no requiere aceptación previa | `valueChange`/`checkedChange` generado por `model()` exactamente una vez por edición de usuario | `value`, `checked` |
| C | PROPOSAL EVENT | El componente propone; el consumidor acepta o rechaza volviendo a escribir el input | `xChange(next)`; no muta primero el estado aplicado | `queryChange`, `selectedKeysChange`, `expandedKeysChange`, `activeIdChange`, `collapsedChange` |
| D | DOMAIN EVENT | El componente informa una acción o resultado con contexto no derivable del estado | Solo ante la acción definida | `optionActivated`, `valueCommitted`, `rowSelect`, `fileRetry` |
| E | LIFECYCLE EVENT | Informa que una transición física ya ocurrió | Después del attach/detach real | `opened`, `closed` |
| F | INTERNAL DERIVED STATE | Computed o efímero propiedad del componente | Nunca como setter alternativo | etiquetas seleccionadas, proyección plana, rango visible, draft, foco activo |

Regla de control: si el consumidor puede rechazar una transición, el estado aplicado es A y la intención es C. No se usa B porque `model()` escribiría antes de la aceptación.

## 4. Reglas de input, model, proposal, domain y lifecycle

**Estado: APPROVED TARGET.**

- `input()` se usa para configuración y estado aplicado controlado. Una escritura externa es silenciosa respecto a outputs de intención.
- `model()` se limita a un valor de campo que el usuario edita directamente y cuya escritura inmediata es el contrato. Nombres canónicos: `value` o `checked`.
- No se usa `model()` para query, paginación, sort, filtros, selección de Table/TreeTable, expansión, navegación, colapso ni dismissal guardable.
- `xChange` es propuesta de estado cuando `x` es un input aplicado. El consumidor confirma reescribiendo `x`; el componente no mantiene una copia canónica paralela.
- Un evento de dominio existe solo si aporta opción, origen, motivo, commit o resultado que no se obtiene comparando el estado.
- Requests usan `Requested` o un nombre de transporte aprobado: `dataRequest`, `childrenRequest`, `suggestionsRequest`.
- `opened` y `closed` describen lifecycle real. `closeRequested` describe intención y puede ser rechazada; un rechazo no emite `closed`.
- Escrituras de parent/form, reset, hidratación y recomputación no emiten eventos de usuario.
- Payloads de colección son snapshots `readonly`; el evento DOM es opcional y solo aparece cuando existe realmente.

## 5. Target Forms

**Estado: APPROVED TARGET.** El catálogo final contiene exactamente **24 controles: 22 `FormValueControl` + 2 `FormCheckboxControl`**. `Multiselect` se fusiona en `Select`; `Tags` se fusiona en `InputTags`; `Slider` y `Rating` pasan a ser controles Forms directos.

Reglas comunes a los 24:

- `disabled` impide foco operativo y mutación; no emite cambios. `readonly` conserva foco, selección/copia y evita mutación.
- `touch` ocurre al abandonar el control compuesto completo, incluido su overlay; navegación interna no toca.
- `dirty` procede de una edición de usuario aceptada, nunca de una escritura externa.
- `reset()` elimina query/draft/overlay/trabajo temporal; el formulario establece el valor y no recibe eco.
- Igualdad base `Object.is`; donde existe identidad de dominio se admite `compareWith`. Se prueban `NaN`, `+0/-0`, objetos equivalentes y claves descargadas.
- Signal Forms, `[formControl]`, `formControlName` y `[(ngModel)]` usan la interoperabilidad oficial Angular 22. No se implementa CVA a la vez.
- Estados oficiales (`disabled`, `readonly`, `hidden`, `invalid`, `pending`, `touched`, `dirty`, `errors`, `required` y constraints compatibles) no se duplican en una abstracción Neural.

| # | Componente final / genérico | Valor y vacío | Model / evento de dominio | Normalización e igualdad | Forms y comportamiento específico | Owner / tarea |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `NeuAutocompleteComponent<T,V,F>` | strict: `V\|null`; free text: `V\|string\|null`; vacío `null` | `value`; `optionActivated`, `suggestionsRequest`, `opened/closed` | free text explícito; nunca cast string→V; `compareWith` | `FormValueControl<NeuAutocompleteValue<V,F>>`; IME y blur compuesto | N2-003/N2-007 |
| 2 | `NeuCascadeSelectComponent<T,V>` | `V\|null`; vacío `null` | `value`; `optionActivated`, `groupChange`, `opened/closed` | opción T→V mediante accessor; `compareWith` | `FormValueControl<V\|null>`; ruta/expansión no son valor | N2-007 |
| 3 | `NeuCheckboxComponent` | `boolean`; vacío/reset `false` | `checked`; sin segundo evento de valor | boolean estricto; `indeterminate` solo visual | `FormCheckboxControl`; `requiredTrue`; readonly focusable | N2-004 |
| 4 | `NeuColorPickerComponent` | color `string`; vacío definido por valor inicial | `value`; `valueCommitted`, `opened/closed` | formato declarado sin perder alpha | `FormValueControl<string>`; drag continuo vs commit; blur de popup | N2-009 |
| 5 | `NeuDateInputComponent<M>` | `CivilDate\|null`, `LocalTime\|null`, `LocalDateTime\|null`, `readonly CivilDate[]` o `CivilDateRange`; vacíos `null`, `[]`, `{start:null,end:null}` | `value`; `viewChange`, `cleared`, `opened/closed` | tipos nominales ISO; nunca `Date`/UTC implícito ni CSV | `FormValueControl<NeuDateValue<M>>`; modo discriminado; rango parcial permitido | N2-006 |
| 6 | `NeuInlineEditorComponent<M>` | texto `string`; número `number\|null` | `value`; `editStart`, `editCancel`, `valueCommitted` | draft efímero; commit convierte por modo | `FormValueControl<NeuInlineValue<M>>`; reset/cancel descarta draft | N2-009 |
| 7 | `NeuInputComponent` | `string`; vacío `''` | `value`; sin evento redundante | null externo requiere borde explícito; conserva IME | `FormValueControl<string>`; se recomienda control non-nullable | N2-003 |
| 8 | `NeuInputMaskComponent` | `string`; vacío `''`; target inicial masked | `value`; sin evento redundante | slots `9/A/*`; raw solo como política P2 tipada | `FormValueControl<string>`; readonly, caret, paste e IME | N2-003/N2-027 |
| 9 | `NeuInputOTPComponent` | `string`; vacío `''` | `value`; `completed` solo al completar por usuario | longitud/dígitos explícitos; paste distribuye | `FormValueControl<string>`; touch al salir del grupo, no al focus | N2-003 |
| 10 | `NeuInputTagsComponent<T,V>` | `readonly V[]`; vacío `[]` | `value`; `optionActivated`, `suggestionsRequest`, `opened/closed` | accessor T→V, `compareWith`, política de duplicados | `FormValueControl<readonly V[]>`; separadores, paste, IME y blur | N2-008 |
| 11 | `NeuKnobComponent` | `number`; reset al valor del form | `value`; `valueCommitted` si aporta fin de gesto | finite, clamp/step documentados; `Object.is` | `FormValueControl<number>`; readonly y spinbutton | N2-005 |
| 12 | `NeuListboxComponent<T,V,M>` | single `V\|null`; multiple `readonly V[]` | `value`; `optionActivated`, `dataRequest`, `rangeChange` | accessor/`compareWith`; valores remotos no cargados válidos | `FormValueControl<NeuSelectionValue<V,M>>`; superficie persistente | N2-007 |
| 13 | `NeuNumberInputComponent` | `number\|null`; vacío `null` | `value`; `inputDetail`, `valueCommitted` | buffer textual efímero; locale/currency/precision; no NaN/Infinity | `FormValueControl<number\|null>`; parseo y formato no son segundo owner | N2-005 |
| 14 | `NeuPasswordComponent` | `string`; vacío `''` | `value`; sin evento de valor extra | no normaliza contenido salvo texto; reveal no cambia valor | `FormValueControl<string>`; autofill y constraints | N2-003 |
| 15 | `NeuRadioGroupComponent<V>` | `V\|null`; vacío `null` | `value`; `optionActivated` opcional | `compareWith`; cada radio hijo no es otro field | `FormValueControl<V\|null>`; roving focus y nombre único | N2-004 |
| 16 | `NeuRichTextEditorComponent` | HTML saneado `string`; vacío `''` | `value`; `imageRejected`, `valueCommitted` | HTML, no Delta; saneado en el borde aprobado | `FormValueControl<string>`; readonly permite copy; reset limpia recursos | N2-009 |
| 17 | `NeuSelectComponent<T,V,M>` | single `V\|null`; multiple `readonly V[]` | `value`; `optionActivated`, `cleared`, `opened/closed`, `dataRequest` | selección solo de opciones; accessor/`compareWith`; no editable | `FormValueControl<NeuSelectionValue<V,M>>`; un motor single/multiple | N2-007 |
| 18 | `NeuSwitchComponent` | `boolean`; vacío/reset `false` | `checked`; sin segundo evento | boolean estricto | `FormCheckboxControl`; readonly focusable y teclado switch | N2-004 |
| 19 | `NeuTextareaComponent` | `string`; vacío `''` | `value`; sin evento redundante | null externo requiere conversión explícita; conserva IME | `FormValueControl<string>`; autosize y caret estables | N2-003 |
| 20 | `NeuToggleButtonGroupComponent<T,V,M>` | single `V\|null`; multiple `readonly V[]` | `value`; `optionActivated` | accessor/`compareWith`; política de deselect single explícita | `FormValueControl<NeuSelectionValue<V,M>>` | N2-007 |
| 21 | `NeuTreeSelectComponent<T,V,K,M>` | single `V\|null`; multiple `readonly V[]` | `value`; `childrenRequest`, `expandedKeysChange`, `nodeExpanded/nodeCollapsed`, `opened/closed` | identidad K y valor V separados; unloaded values válidos | `FormValueControl<NeuSelectionValue<V,M>>`; blur incluye overlay | N2-007/N2-019 |
| 22 | `NeuUploaderComponent` | `readonly File[]`; vacío `[]` | `value`; `filesSelected`, `fileRemoved`, `fileRetry`, `filesRejected`, `cleared` | `File` legado→`[File]`; null→`[]`; igualdad por identidad | `FormValueControl<readonly File[]>`; sin HTTP; cleanup object URLs | N2-009 |
| 23 | `NeuSliderComponent` | `number`; reset al valor del form | `value`; `valueCommitted` si aporta fin de gesto | finite/min/max/step; rango es modo P2 distinto | `FormValueControl<number>`; cuatro rutas Forms y ARIA | N2-010 |
| 24 | `NeuRatingComponent` | `number\|null`; vacío `null` | `value`; `valueCommitted` opcional | step entero P1; fracciones P2 | `FormValueControl<number\|null>`; clear/required/reset | N2-010 |

## 6. Target Select

**Estado: APPROVED TARGET.**

- `NeuSelectComponent<T,V,M extends 'single'|'multiple' = 'single'>` es la única fachada. `NeuMultiselectComponent`, selector y subpath se eliminan tras portar capacidades, sin alias.
- `mode` es discriminante de cardinalidad. Literal `single` produce `V|null`; `multiple` produce `readonly V[]`; un modo dinámico produce la unión y exige narrowing del consumidor.
- Select solo selecciona opciones. `editable` se elimina. Texto libre pertenece a Autocomplete con `freeText` explícito; `Select<string>` sigue seleccionando strings existentes, no inventa opciones.
- Modo multiple incluye chips, remove, `selectionLimit`, resumen de etiquetas, toggle-all con scope, filtro, templates y apertura controlada.
- `options` es fuente; selected labels/counts se derivan de `value + options`. Se conservan valores remotos aún no cargados.
- Igualdad por `Object.is` o `compareWith`; `optionValue` convierte T→V; `optionDisabled` no altera valores externos existentes.
- `open` es estado aplicado si se controla; `openChange` propone apertura/cierre no guardable. `opened/closed` notifican attach/detach. Un dismissal guardable usa `closeRequested`.
- `dataRequest` es la única intención de transporte para opciones remotas; `filterChange` es propuesta de query local/controlada, no petición HTTP duplicada.
- Teclado: combobox/listbox, active descendant estable, Home/End, flechas, Enter/Space, Escape, typeahead; en multiple el chip removal tiene foco y anuncio propios.
- Se eliminan `selectionChange<T|null>`, `changeDetail` como segundo canal, `editable`, `NeuMultiselectComponent` y outputs duplicados. El detalle útil pasa a `optionActivated<{option:T;value:V;source}>`.

## 7. Target InputTags

**Estado: APPROVED TARGET.**

`NeuInputTagsComponent<T,V>` absorbe completamente `NeuTagsComponent` y conserva un único `value: ModelSignal<readonly V[]>`.

- `options/suggestions` contienen T; `optionValue` produce V; los templates reciben T y V tipados.
- `separators: readonly string[]`, suggestion request, máximo, allowDuplicates, reorder/remove y paste son capacidades del único componente.
- Duplicados usan la misma política `compareWith`; se valida después de normalizar, nunca por stringify.
- IME no crea tags durante composición. Paste tokeniza una vez y conserva orden. Blur puede comprometer el token solo si `commitOnBlur` está activo; touch ocurre al salir de input + overlay.
- `suggestionsRequest` solicita datos; `optionActivated` aporta detalle; `valueChange` es el único canal del dato. `focusEntered/focusLeft` son boundary events si se exponen; `opened/closed` son lifecycle.
- `neu-tags`, su entrypoint y su selector se eliminan únicamente después de pasar todos sus escenarios sobre InputTags; no se crea wrapper.

## 8. Target Table

**Estado: APPROVED TARGET — REWRITE de fachada/orquestación.** Se pueden reutilizar renderers y algoritmos puros que cumplan el contrato.

- Modos `client | remote`. `query` contiene page 1-based, pageSize, search, sort array, filter groups y globalFilterFields.
- `query` es INPUT aplicado; `queryChange` es PROPOSAL. Una propuesta rechazada no altera filas, metadata ni dispara transporte.
- `dataRequest` es el único REQUEST remoto y se emite solo para una query aceptada/aplicada o cambio efectivo de viewport. Incluye `requestId`, `queryRevision`, reason y rango cuando aplica.
- `selectedKeys: readonly K[]` es estado de selección; single admite como máximo una clave. `selectedKeysChange` propone; `rowSelect/rowUnselect` conservan detalle de dominio.
- `rowKey` define identidad semántica K. `rowTrackBy` solo optimiza identidad de render. No se fusionan.
- Rangos son `[start,end)` y separan `render` de `visible`. No contienen `Event` DOM obligatorio.
- Configuración cohesiva: `sortOptions`, `filterOptions`, `paginationOptions`, `selectionOptions`, `virtualizationOptions`. No existe mega-options ni callbacks heterogéneos ocultos.
- Metadata remota (`totalItems`, loading/error/revision) se separa de query y de datos.
- URL/storage son adapters externos. Export CSV/JSON/XLSX es capacidad opcional y tree-shakeable.
- SSR no pide datos; hydration con estado transferido no repite request. Respuestas stale se descartan por revision/requestId.

## 9. Frontera TableCore

**Estado: APPROVED TARGET — KEEP boundary, CHANGE public contract.**

`NeuTableCoreComponent<T,K>` posee filas/columnas inmutables, cabecera/cuerpo/celdas, templates tipados, identidad/tracking, loading/empty, tabla semántica y layout contenido. No posee Forms, Router, CDK, query, filtros, selección, edición, export, persistencia, URL ni virtualización. Su grafo productivo se limita a Angular Core/Common y `tslib`.

La API actual de 16 inputs no se congela por compatibilidad: N2-014 puede rehacerla. El gate es que un consumer core no retenga dependencias de la fachada y que los templates gestionados mantengan semántica/SSR.

## 10. Target TreeTable

**Estado: APPROVED TARGET — REWRITE FROM SCRATCH de fachada, orquestación y proyección.**

- `NeuTreeTableComponent<T,K>` recibe nodos `{key,data,children?,hasChildren?,disabled?}`. `data: T` nunca recibe `__tree*`, ids o labels sintéticos.
- Metadata de ocurrencia (parent, depth, expansion, loading, index) vive fuera del dominio. En DAG, identidad de dominio y clave de ocurrencia se documentan; ciclos y ocurrencias duplicadas se rechazan con error definido.
- Query sigue el contrato Table y ordena hermanos, no aplana globalmente.
- Requests son una unión discriminada única: `roots`, `children`, `viewport`, siempre con IDs/revisions apropiados.
- `rootTotal`, `visibleRowCount` y `estimatedRowCount` son unidades distintas. Paginación cuenta raíces; viewport indexa la proyección visible e incluye `projectionRevision`.
- Estados de hijos: unloaded/loading/loaded/error. Hay dedupe y retry por nodo; collapse conserva cache válido; cambio de query invalida lógicamente respuestas antiguas.
- `expandedKeys` y `selectedKeys` son inputs aplicados con proposals. La política inicial aprobada es `selectionDisabledBoundary: 'stop'`; un nodo disabled detiene propagación y agregación. Lazy mixed refleja solo descendientes conocidos.
- El motor de filtros es puro y compartido con Table; lenient/strict son políticas, no registros duplicados.
- Treegrid SSR es declarativo antes de hidratar. Foco roving y materialización virtual se resuelven por K, nunca buscando DOM por fila.
- Edición/export son extensiones opcionales sobre T y no cambian el core jerárquico.

## 11. Target TreeSelect

**Estado: APPROVED TARGET.**

TreeSelect comparte nodos tipados, índice/proyección, filtros e igualdad con Tree/TreeTable, pero conserva fachada Forms + overlay propia; Tree no se convierte en FormControl.

- Valor: `NeuSelectionValue<V,M>`; K identifica nodos y V es el valor del field.
- `selectionStrategy: 'independent'|'propagated'`; propagated respeta `selectionDisabledBoundary:'stop'`.
- Valores y claves expandidas pueden referir datos todavía no cargados.
- `childrenRequest` solicita hijos; `expandedKeysChange` propone estado; `nodeExpanded/nodeCollapsed` son dominio.
- Virtualización usa rango half-open y active descendant por K. Search no muta value y usa el mismo registro de filtros puro.
- El overlay cumple attach/detach, retorno de foco, Escape y touch al abandonar la superficie compuesta.

## 12. Estado controlado de navegación

**Estado: APPROVED TARGET.**

| Componente | Estado aplicado | Propuesta | Seed no controlado | Persistencia |
| --- | --- | --- | --- | --- |
| Accordion | `expandedKeys` | `expandedKeysChange` | `initialExpandedKeys` una vez | adapter externo |
| Tabs | `activeId` | `activeIdChange` | `initialActiveId` una vez | URL/storage adapter externo |
| Panel | `collapsed` | `collapsedChange` | `initialCollapsed` una vez | adapter externo |
| Sidebar | `collapsed` | `collapsedChange` | `initialCollapsed` una vez | URL/storage adapter externo |

`item.expanded`, `tabParam` e inferencias desde URL dejan de ser propietarios. Dos instancias pueden reutilizar claves sin colisión gracias a IDs namespaced por instancia. No se cambia de controlado a no controlado durante una instancia; en desarrollo se informa el uso inválido.

## 13. Overlays y eventos

**Estado: APPROVED TARGET.**

- REQUEST: `closeRequested({reason, originalEvent?})`; se emite antes de cerrar y puede rechazarse.
- APPLIED STATE: `open` input cuando existe control externo; una escritura no emite intención.
- LIFECYCLE: `opened` tras attach/foco inicial y `closed` tras detach/retorno de foco. Destrucción no inventa eventos.
- VALUE: `value/valueChange` o `checked/checkedChange` exclusivamente.
- DOMAIN: nombres específicos (`optionActivated`, `valueCommitted`, `cleared`) solo si el payload aporta información útil.
- Migración atómica Dialog/BottomSheet: `closed` antiguo (request) → `closeRequested`; `hidden` antiguo (final) → `closed`.
- Native `select`, `focus` y `blur` internos no se bloquean salvo para evitar colisión documentada; boundaries compuestos usan `focusEntered/focusLeft`.

## 14. Naming visual y tokens

**Estado: APPROVED TARGET para el vocabulario y los 14 destinos; NEEDS REVIEW para el mapa exhaustivo por componente de N2-023.**

- `density: 'compact'|'normal'|'relaxed'`; default `normal`. Solo se expone donde los tres modos tienen tratamiento real.
- `tone` comunica intención semántica (`neutral|info|success|warning|danger`) y solo admite tonos soportados por el componente.
- `variant` comunica tratamiento visual (`solid|outline|ghost|soft`, subconjunto por componente).
- `type` conserva semántica HTML/dominio (Input, DateInput); `color` literal sigue siendo color y no se renombra a tone.
- Temas/presets resuelven tokens canónicos para light, dark, RTL, forced-colors y high contrast. El orden lógico usa propiedades inline/block.

Mapa cerrado de aliases CSS 1.x → token canónico 2.x:

| 1.x | 2.x |
| --- | --- |
| `--neu-color-border` | `--neu-border` |
| `--neu-color-danger` | `--neu-error` |
| `--neu-color-picker-bg` | `--neu-surface` |
| `--neu-color-picker-shadow` | `--neu-shadow-lg` |
| `--neu-color-primary` | `--neu-primary` |
| `--neu-color-primary-alpha` | `--neu-primary-alpha` (token canónico nuevo, mismo valor visual inicial) |
| `--neu-color-secondary` | `--neu-secondary` |
| `--neu-color-success` | `--neu-success` |
| `--neu-color-surface-subtle` | `--neu-bg` |
| `--neu-color-text-secondary` | `--neu-text-muted` |
| `--neu-color-warning` | `--neu-warning` |
| `--neu-danger` | `--neu-error` |
| `--neu-nav-toggle-color-hover` | `--neu-text` |
| `--neu-radius-md` | `--neu-radius` |

Los aliases se eliminan de v2 después de migrar todos los usos internos, presets y consumers. No quedan variables puente runtime.

## 15. StatsCard y charts

**Estado: APPROVED TARGET.**

`StatsCard` mantiene valor KPI, etiqueta, icono, delta/tendencia textual y proyección de contenido no gráfica. `sparkData` y su SVG de serie se eliminan. Chart, ApexCharts y Chart.js permanecen fuera de `@neural-ui/core`; una visualización futura se compone desde un producto separado y no se promete aquí.

## 16. Ledger de componentes: merge/remove/rewrite

**Estado: APPROVED TARGET salvo filas marcadas NEEDS REVIEW.**

| Componente | Decisión | Rol target | Impacto API pública | Impacto visual | Dependencias | Riesgo / estado |
| --- | --- | --- | --- | --- | --- | --- |
| Select | REWRITE | selector Forms single/multiple | Nuevo model, tipos y eventos | Conserva workflows; un overlay | N2-002 | Alto / APPROVED TARGET |
| Multiselect | MERGE | capacidades dentro de Select | selector/subpath/type retirados | UX múltiple portada | Select | Alto / APPROVED TARGET |
| InputTags | REWRITE | editor Forms genérico T→V | model/eventos unificados | Porta separadores y suggestions | N2-002 | Medio / APPROVED TARGET |
| Tags | MERGE | `InputTags<string,string>` | selector/subpath retirados | sin pérdida de features | InputTags | Medio / APPROVED TARGET |
| Table | REWRITE | fachada de datos client/remote | query/request/selection nuevos | workflows conservados | TableCore | Alto / APPROVED TARGET |
| TableCore | REWRITE | renderer ligero; frontera conservada | firma puede cambiar | tabla semántica conservada | Core/Common | Medio-alto / APPROVED TARGET |
| TreeTable | REWRITE | treegrid typed/lazy/virtual | reemplazo total de facade | treegrid conservado/mejorado | TableCore + motores puros | Alto / APPROVED TARGET |
| TreeSelect | REWRITE | field árbol + overlay | typed value/requests/strategy | virtual/propagated añadidos | primitivas Tree | Alto / APPROVED TARGET |
| Accordion | REWRITE | contenedor controlado | expandedKeys/proposal/templates | contenido Angular real | ninguna | Medio / APPROVED TARGET |
| Tabs | REWRITE | navegación controlada | activeId; tabParam retirado | mismo patrón tabs | adapter externo | Medio-alto / APPROVED TARGET |
| Panel | KEEP | contenedor colapsable | collapsed controlado | sin rediseño general | ninguna | Medio / APPROVED TARGET |
| Sidebar | KEEP | navegación colapsable | collapsed controlado | sin rediseño general | adapter externo | Medio / APPROVED TARGET |
| StatsCard | KEEP | KPI no gráfico | sparkData retirado | sparkline desaparece | ninguna chart | Bajo-medio / APPROVED TARGET |
| 24 Forms finales | REWRITE | controles Angular 22 | CVA→Signal Forms | comportamiento observable preservado | Angular Forms | Alto / APPROVED TARGET |
| Autocomplete/CascadeSelect/Listbox/ToggleButtonGroup | REWRITE | fields de opción tipados | valor V y detalle T separados | workflows conservados | Option primitives | Alto / APPROVED TARGET |
| Checkbox/Switch/RadioGroup | REWRITE | fields boolean/radio tipados | checked/value models | semántica ARIA preservada | Angular Forms | Medio / APPROVED TARGET |
| Input/Textarea/Password/InputMask/InputOTP | REWRITE | fields de texto | models y touch uniforme | IME/caret/autofill preservados | Angular Forms | Alto / APPROVED TARGET |
| NumberInput/Knob/Slider/Rating | REWRITE | fields numéricos | nullability/models/config | spinbutton/range/rating preservados | Angular Forms | Alto / APPROVED TARGET |
| DateInput | REWRITE | field civil discriminado | valor/tipo/range breaking | calendario/overlay conservado | Angular Forms | Alto / APPROVED TARGET |
| ColorPicker/InlineEditor/RichTextEditor/Uploader | REWRITE | fields especializados | model + eventos de dominio | interacción preservada | Angular Forms | Alto / APPROVED TARGET |
| Dialog/BottomSheet | KEEP | overlays guardables | request/lifecycle renombrados | timing/foco conservados | Overlay/CDK actual | Alto / APPROVED TARGET |
| Calendar | KEEP | agenda con fecha controlada | outputs de fecha fusionados | agenda se conserva | ninguna | Medio / APPROVED TARGET |
| CodeBlock | KEEP | bloque de código | lang/language fusionados | sin cambio visual | highlighter actual | Bajo / APPROVED TARGET |
| Splitter | KEEP | layout redimensionable | orientation/sizesChange | sin rediseño P1 | ninguna | Medio / NEEDS REVIEW P2 |
| Componentes con severity/color/variant semánticos | KEEP | tone + variant por familia | rename condicionado a mapa | visual actual es baseline | tokens | Medio / NEEDS REVIEW P2 |
| Gallery/ImageGallery | MERGE | Gallery único | ImageGallery se retiraría | portar contador/viewerEnabled | ImageViewer se conserva | Medio / NEEDS REVIEW P2 |

## 17. Ledger de API

**Estado: APPROVED TARGET.** El ledger exhaustivo de unidades afectadas, con CURRENT/TARGET/ACTION/owner/migración, está en [N2-001-API-LEDGER.md](./N2-001-API-LEDGER.md). Solo usa `KEEP`, `ADD`, `CHANGE`, `MERGE`, `RENAME` y `REMOVE`; no existe `DEPRECATE` como destino v2.

## 18. Cambios de tipos

**Estado: APPROVED TARGET.** Los contratos conceptuales completos están en [N2-001-TYPE-CONTRACTS.md](./N2-001-TYPE-CONTRACTS.md).

Cambios cardinales:

- Arrays mutables → `readonly` arrays.
- `unknown` en RadioGroup → `V|null`.
- opción T separada de valor V e identidad K.
- Date/string/CSV heterogéneo → valores civiles discriminados.
- Table/TreeTable server booleans y estados paralelos → query/request unions.
- fila TreeTable aplanada/adornada → `NeuTreeTableNode<T,K>` + `NeuTreeRowContext<T,K>`.
- eventos ambiguos → payloads discriminados y semántica temporal explícita.

## 19. Ejemplos de migración

**Estado: APPROVED TARGET.** Las conversiones ejecutables por el consumidor están en [N2-001-MIGRATION-EXAMPLES.md](./N2-001-MIGRATION-EXAMPLES.md): Select/Multiselect, Tags/InputTags, Table, TreeTable, DateInput, NumberInput, Forms y overlays. Son conversiones one-shot; ninguna se ejecuta dentro del paquete.

## 20. Límites de rendimiento

**Estado: APPROVED TARGET.**

| Área | Límite contractual | Evidencia obligatoria |
| --- | --- | --- |
| Select | modo single no carga código/DOM de chips/toggle-all; opciones virtuales DOM acotado; filtro no crea effect espejo | consumer single y multiple, bytes raw/gzip/brotli, DOM, p50/p95, 50 ciclos open/close |
| Table | un request por transición aceptada; DOM acotado; stale responses sin render; core/full medidos separados | 10k local, remote+virtual, filtros/sort/page, listeners/observers tras 50 ciclos |
| TreeTable | proyección incremental por claves; no DOM scan por fila; expand lazy deduplicado; foco virtual materializable | árbol profundo/ancho, 10k visibles, roots/children/viewport, SSR/hydration, memoria |

Presupuesto transversal propuesto: ningún consumer equivalente empeora más de 5% comprimido frente a su baseline Neural sin decisión documentada; cualquier presupuesto histórico más estricto prevalece. La comparación con Prime usa mismos datos, funcionalidad, tooling y navegador. No se fija una latencia absoluta sin hardware: N2-032 congela baseline antes de D/E.

## 21. Decisiones no resueltas

No queda ninguna ambigüedad P1 que bloquee implementación. Estas decisiones son deliberadamente posteriores y tienen default seguro:

| Decisión | Estado | Default cerrado mientras se revisa | Owner |
| --- | --- | --- | --- |
| mapa `tone/variant` por cada componente | NEEDS REVIEW P2 | conservar visual actual; no renombrar un input hasta tener mapa/test | N2-023 |
| InputMask raw vs masked avanzado | NEEDS REVIEW P2 | masked | N2-027 |
| DateInput period/inline | NEEDS REVIEW P2 | no añadir modos | N2-025 |
| Slider range/vertical y Rating half/vertical | NEEDS REVIEW P2 | scalar/horizontal/step entero | N2-026 |
| Splitter collapse | NEEDS REVIEW P2 | resize actual; persistence externa | N2-028 |
| Gallery/ImageGallery merge | NEEDS REVIEW P2 | no retirar ImageGallery hasta equivalencia | N2-029 |
| EyeDropper | NEEDS REVIEW P2 | color editor funciona sin API browser | N2-024 |
| VirtualList 2D/variable | REJECTED para P1; revisión futura P3 | lista vertical fixed-size | N2-036 |
| StyleClass/AutoFocus genéricos | REJECTED para v2 P1 | composición Angular/nativa | N2-037 |

## 22. Blockers

**Estado: ninguno para N2-002.**

- La falta de checkout limpio del showcase bloquea N2-034/fase de integración, no N2-002.
- Los 18 misses históricos de branch coverage, dos warnings NG8102, dos defaults de tokens y 17 demos pendientes conservan owner; no contradicen estos contratos.
- La interacción browser DateInput pendiente con runner oficial bloquea RC, no diseño ni infraestructura Forms.

## 23. Riesgos

| Riesgo | Nivel | Mitigación contractual |
| --- | --- | --- |
| pérdida de interoperabilidad al retirar CVA | Alto | dos muestras N2-002 y gate de cuatro rutas antes de familias |
| eco/doble owner por model | Alto | un model, cero output manual y pruebas exactly-once |
| tipo dinámico single/multiple | Alto | discriminante y type tests literal/dinámico |
| doble request Table/TreeTable | Alto | query aplicada + único dataRequest con revision/ID |
| colisión de identidad árbol | Alto | K/occurrence separados, cycle/duplicate detection |
| regresión a11y/SSR por rewrite | Alto | semántica declarativa y consumers SSR/hydration/keyboard |
| retención de bundle en merges | Medio-alto | imports opcionales y consumers core/single/full separados |
| retirada de tokens rompe themes | Medio | mapa 14/14 y migración de usos/presets en la misma tarea |
| documentación conceptual diverge del código | Alto | N2-001 es fuente de diseño; cada tarea actualiza ledger y type tests |

## 24. Recomendación

**`READY FOR N2-002`.** N2-002 puede implementar únicamente la infraestructura y las dos muestras oficiales (texto y booleano) contra estos contratos. No autoriza todavía migrar familias completas, reescribir Table/TreeTable, retirar Multiselect/Tags, cambiar tokens ni modificar showcase.

El estado global de N2-001 es **`PASS WITH DECISIONS TO REVIEW`** porque existen decisiones P2/P3 explícitas, acotadas y no bloqueantes. Si N2-002 demuestra que la interoperabilidad oficial Angular 22 contradice `FormValueControl`/`FormCheckboxControl` aquí fijados, se detiene la familia y se reabre N2-001 con evidencia ejecutable; no se introduce CVA doble como salida temporal.
