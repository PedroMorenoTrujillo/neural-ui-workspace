# N2-001 — API ledger Neural UI 1.x → 2.x

## Alcance y reglas

**Estado:** `PASS WITH DECISIONS TO REVIEW`
**Recomendación:** `READY FOR N2-002`

Este ledger enumera toda unidad pública afectada por los contratos N2 auditados. Las APIs no citadas permanecen `KEEP` hasta que el diff de contrato de su tarea demuestre lo contrario. En v2 no existe estado `DEPRECATE`: cada unidad termina en `KEEP`, `ADD`, `CHANGE`, `MERGE`, `RENAME` o `REMOVE`. `Breaking` indica incompatibilidad de fuente, tipo, temporalidad o selector aunque el nombre no cambie.

## Contratos transversales y Forms

| Estado | CURRENT | TARGET | ACTION | RATIONALE | BREAKING | MIGRATION | OWNER TASK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| APPROVED TARGET | `ControlValueAccessor`, `NG_VALUE_ACCESSOR`, callbacks y `writeValue` en 24 controles actuales | contrato oficial Signal Forms por control | REMOVE | un solo contrato Forms Angular 22 | Sí | retirar provider/callbacks al migrar cada componente; usar interoperabilidad oficial | N2-002…010 |
| APPROVED TARGET | inputs `disabled`/`readonly` propietarios y estado CVA separado | estados `FormUiControl` consumidos sin espejo | MERGE | evita propietarios duplicados | Sí | enlazar el estado oficial; preservar DOM/ARIA | N2-002…010 |
| APPROVED TARGET | outputs manuales `valueChange` junto a valor CVA | `value = model<T>()`, output generado | MERGE | un canal de dato | Sí | eliminar declaración manual, conservar binding público | N2-003…010 |
| APPROVED TARGET | outputs manuales `checkedChange` junto a boolean CVA | `checked = model<boolean>()`, output generado | MERGE | un canal booleano | Sí | cambiar a `[(checked)]` o Forms | N2-004 |
| APPROVED TARGET | arrays mutables de valor | `readonly` arrays | CHANGE | snapshot e inmutabilidad pública | Sí | crear array nuevo en cada edición | N2-007…010 |
| APPROVED TARGET | igualdad implícita `===`/helpers distintos | `Object.is` + `compareWith` donde hay V | CHANGE | política transversal verificable | Sí en `NaN`/`±0` | declarar comparator si el dominio usa clave | N2-007/N2-008 |
| APPROVED TARGET | touch en focus o navegación interna en controles compuestos | touch al abandonar toda la superficie | CHANGE | semántica Forms correcta | Sí temporal | mover lógica dependiente de touched al blur compuesto | N2-002…010 |
| APPROVED TARGET | reset con normalizaciones/outputs laterales | reset limpia efímeros; el form escribe valor sin eco | CHANGE | owner único | Sí temporal | fijar valor inicial/nonNullable por contrato | N2-002…010 |
| APPROVED TARGET | constraints duplicadas como validación interna | constraints oficiales compatibles + schema consumidor | CHANGE | no duplicar validator | Sí | mover reglas de negocio al schema | N2-002…010 |

## Controles de texto, booleanos, número y edición

| Estado | CURRENT | TARGET | ACTION | RATIONALE | BREAKING | MIGRATION | OWNER TASK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| APPROVED TARGET | Input `_value` CVA + `valueChange` manual | `value: ModelSignal<string>` | MERGE | único owner | Sí | control non-nullable o conversión null→`''` en borde | N2-003 |
| APPROVED TARGET | Textarea `_value` CVA + `valueChange` manual | `value: ModelSignal<string>` | MERGE | único owner e IME preservado | Sí | igual que Input | N2-003 |
| APPROVED TARGET | Password valor CVA interno | `value: ModelSignal<string>` | CHANGE | Signal Forms | Sí | enlazar `value`/Forms | N2-003 |
| APPROVED TARGET | InputMask valor CVA interno, sin `readonly` | `value: ModelSignal<string>` + `readonly` oficial | CHANGE | Forms/a11y uniforme | Sí | mantener masked en P1 | N2-003 |
| NEEDS REVIEW | InputMask solo valor masked implícito | `valuePolicy:'masked'\|'raw'`, default masked | ADD | evita tipo ambiguo | No con default | optar por raw y migrar validators/persistencia | N2-027 |
| APPROVED TARGET | InputOTP touch en focus | touch en focusout del grupo | CHANGE | boundary compuesto | Sí temporal | no usar focus como señal de touched | N2-003 |
| APPROVED TARGET | InputOTP valor CVA | `value: ModelSignal<string>` | CHANGE | Signal Forms | Sí | binding/model oficial | N2-003 |
| APPROVED TARGET | Checkbox `checked` input + `_checked` CVA + output | `checked: ModelSignal<boolean>` | MERGE | elimina doble owner | Sí | `[(checked)]`; null reset→false en borde | N2-004 |
| APPROVED TARGET | Checkbox coerción truthy/indeterminate mezclable | boolean estricto; `indeterminate` visual | CHANGE | tipo correcto | Sí | convertir datos legacy antes del control | N2-004 |
| APPROVED TARGET | Switch `_checked` CVA + `checkedChange`, sin input checked | `checked: ModelSignal<boolean>` | MERGE | completa binding oficial | Sí | usar `[(checked)]` o Forms | N2-004 |
| APPROVED TARGET | RadioGroup `unknown` y radios no genéricos | `RadioGroup<V>` con `value: ModelSignal<V\|null>` | CHANGE | preserva tipo de dominio | Sí | eliminar casts y declarar V | N2-004 |
| APPROVED TARGET | NumberInput valor interno + `valueChange<number>` no nullable | `value: ModelSignal<number\|null>` | CHANGE | clear real y canal único | Sí | handlers aceptan null | N2-005 |
| APPROVED TARGET | NumberInput `nullable` como interruptor de tipo | valor siempre `number\|null`; schema decide required | REMOVE | el runtime flag no debe cambiar el tipo | Sí | usar required/non-null normalization fuera | N2-005 |
| APPROVED TARGET | NumberInput layouts `vertical`/`stacked` solapados | disposición única documentada | MERGE | reduce combinaciones | Sí | mapear layout al target de N2-005 | N2-005 |
| APPROVED TARGET | NumberInput sin configuración regional completa | locale/currency/fraction config estructurada | ADD | gap P1 confirmado | No | mover formatter/parser custom a config | N2-005 |
| APPROVED TARGET | NumberInput `inputDetail` | `inputDetail<{rawText,value,state}>` | KEEP | distingue buffer sin ser valor | No | conservar listener | N2-005 |
| APPROVED TARGET | Knob valor CVA interno | `value: ModelSignal<number>` | CHANGE | Signal Forms | Sí | enlazar `value` | N2-005 |
| APPROVED TARGET | Knob sin readonly público | `readonly` oficial | ADD | gap P1 | No | sustituir bloqueo manual | N2-005 |
| APPROVED TARGET | InlineEditor input `value` + `_value` CVA | model confirmado + draft interno | MERGE | draft no es segundo owner | Sí | actualizar valor solo en commit | N2-009 |
| APPROVED TARGET | InlineEditor `editCommit` como canal paralelo potencial | `valueCommitted` con detalle | RENAME | naming de dominio | Sí | `(editCommit)`→`(valueCommitted)` | N2-009 |
| APPROVED TARGET | ColorPicker `colorChange` | `valueChange` generado por model | RENAME | naming de dato | Sí | `(colorChange)`→`(valueChange)` | N2-009 |
| APPROVED TARGET | ColorPicker `colorChangeEnd` | `valueCommitted` | RENAME | conserva fin de gesto | Sí | renombrar listener, no fusionarlo | N2-009 |
| APPROVED TARGET | RichTextEditor valor CVA/manual | `value: ModelSignal<string>` | MERGE | único canal HTML | Sí | mantener HTML saneado | N2-009 |
| APPROVED TARGET | RTE `toolbarAriaLabel` | `labels.toolbar` | REMOVE | sustituto existente y cohesivo | Sí | mover string a `labels` | N2-009 |
| APPROVED TARGET | Uploader acepta `File[]\|File\|null\|undefined` en write | `value: ModelSignal<readonly File[]>` | CHANGE | colección estable | Sí | File→`[File]`; null→`[]` | N2-009 |
| APPROVED TARGET | Uploader `filesSelected`, `fileRemoved`, `fileRetry`, `filesRejected`, `cleared` | mismos eventos de dominio + `valueChange` canónico | KEEP | detalle no sustituye dato | No | conservar listeners; observar model para colección | N2-009 |
| APPROVED TARGET | Slider input/output manual, sin Forms | `value: ModelSignal<number>` + `FormValueControl` | CHANGE | gap P1 | Sí | usar Forms/model | N2-010 |
| APPROVED TARGET | Rating input/output manual, vacío numérico ambiguo | `value: ModelSignal<number\|null>` + `FormValueControl` | CHANGE | clear/reset explícito | Sí | aceptar null | N2-010 |

## DateInput

| Estado | CURRENT | TARGET | ACTION | RATIONALE | BREAKING | MIGRATION | OWNER TASK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| APPROVED TARGET | `type` + `multiple` cambian una unión heterogénea | `mode` discriminado | CHANGE | el modo determina el tipo estáticamente | Sí | elegir `date/time/datetime/multiple/range` | N2-006 |
| APPROVED TARGET | date/time/datetime strings no nominales | `CivilDate`, `LocalTime`, `LocalDateTime` | CHANGE | impide zona implícita | Sí de tipo | validar/convertir en borde | N2-006 |
| APPROVED TARGET | range con `Date` | `CivilDateRange` | CHANGE | dominio civil estable | Sí de datos | converter one-shot con zona elegida | N2-006 |
| APPROVED TARGET | multiple acepta CSV/array mutable | `readonly CivilDate[]` | CHANGE | una representación | Sí | split/validate una vez | N2-006 |
| APPROVED TARGET | `rangeChange` | `valueChange` del model range | MERGE | un canal del dato | Sí | `(rangeChange)`→`(valueChange)` | N2-006 |
| APPROVED TARGET | `viewChange` | `viewChange` navegación | KEEP | no es valor | No | conservar listener | N2-006 |
| APPROVED TARGET | `opened`, `closed`, `cleared` | lifecycle/lifecycle/domain | KEEP | semánticas vigentes | No | conservar timing documentado | N2-006/N2-022 |
| APPROVED TARGET | navegación month/year sin valor period | `mode='month'` → `CivilMonth\|null`; `mode='year'` → `CivilYear\|null` | ADD | selección civil de período, distinta de navegación | Sí de tipo | usar valores estructurados y límites por unidad | N2-025 |
| APPROVED TARGET | picker solo en overlay | `presentation: 'overlay'\|'inline'` | ADD | presentación independiente de `NeuDateValue<M>` | No | inline conserva el mismo FormValueControl; `opened/closed` solo overlay | N2-025 |
| APPROVED TARGET | sin numeración de semanas | `showWeekNumbers: boolean` (default `false`) | ADD | ISO-8601 visual solo en day-grid | No | ningún valor/selección de semana; touchUI fuera de scope | N2-025 |

## Select, Multiselect, Autocomplete, Listbox, Toggle y Tags

| Estado | CURRENT | TARGET | ACTION | RATIONALE | BREAKING | MIGRATION | OWNER TASK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| APPROVED TARGET | `NeuSelectComponent<T,V,M extends boolean>` | `NeuSelectComponent<T,V,M extends 'single'\|'multiple'>` | CHANGE | discriminante legible y unión dinámica honesta | Sí | `multiple`→`mode` | N2-007 |
| APPROVED TARGET | Select `_value` CVA | `value: ModelSignal<NeuSelectionValue<V,M>>` | CHANGE | Signal Forms | Sí | `[(value)]`/Forms | N2-007 |
| APPROVED TARGET | Select `selectionChange<T\|null>` | `valueChange<V\|null\|readonly V[]>` | RENAME | evento coincide con valor | Sí | mover detalle de opción a `optionActivated` | N2-007 |
| APPROVED TARGET | Select `changeDetail` | `optionActivated<{option,value,source}>` | RENAME | detalle útil con nombre de dominio | Sí | renombrar listener/payload | N2-007 |
| APPROVED TARGET | Select `editable` y cast string→V | Autocomplete `freeText` explícito | REMOVE | elimina tipo falso | Sí | sustituir componente o usar opciones string reales | N2-007 |
| APPROVED TARGET | Select `filter` | `filterChange` proposal/query event | RENAME | filtro no es valor | Sí | renombrar listener | N2-007 |
| APPROVED TARGET | Select `focusEvent`/`blurEvent` | `focusEntered`/`focusLeft` | RENAME | boundary compuesto | Sí | cambiar listeners | N2-022 |
| APPROVED TARGET | Select `triggerClick` | `triggerActivated` solo si se conserva detalle | RENAME | no promete MouseEvent para keyboard | Sí | usar source/originalEvent opcional | N2-007 |
| APPROVED TARGET | Select `opened`/`closed` | lifecycle `opened`/`closed` | KEEP | transición real | No | conservar | N2-022 |
| APPROVED TARGET | Select `cleared<Event>` | `cleared<{source;originalEvent?}>` | CHANGE | no inventa evento DOM | Sí de payload | tratar Event como opcional | N2-007 |
| APPROVED TARGET | Select `lazyRequest` | `dataRequest` | RENAME | canal remoto único | Sí | mapear paginación/filtro/rango | N2-007 |
| APPROVED TARGET | `NeuMultiselectComponent`, `neu-multiselect`, subpath | modo multiple de Select | MERGE | un motor/contrato | Sí | portar chips, límites, toggle-all, templates | N2-007 |
| APPROVED TARGET | Multiselect chips/selectionLimit/maxSelectedLabels/toggle-all/open | `Select` `selectionOptions` + slots + open contract | MERGE | conserva UX sin duplicar facade | Sí | mapear configuración a Select | N2-007 |
| APPROVED TARGET | Autocomplete CVA value | `value: ModelSignal<NeuAutocompleteValue<V,F>>` | CHANGE | free text tipado | Sí | elegir F strict/freeText | N2-007 |
| APPROVED TARGET | Autocomplete `select` + `optionSelected` | `optionActivated` único | MERGE | elimina colisión/duplicidad | Sí | unir listeners y usar payload T/V | N2-007 |
| APPROVED TARGET | Autocomplete `completeMethod` | `suggestionsRequest` | RENAME | request, no método | Sí | renombrar binding | N2-007 |
| APPROVED TARGET | Autocomplete `focusEvent`/`blurEvent` | `focusEntered`/`focusLeft` | RENAME | boundary compuesto | Sí | cambiar listeners | N2-022 |
| APPROVED TARGET | CascadeSelect `nodes`/`options` | `options` + children accessor | MERGE | una fuente | Sí | renombrar `nodes` | N2-007 |
| APPROVED TARGET | CascadeSelect `selectionChange<T\|null>` | `valueChange<V\|null>` + `optionActivated<T,V>` | CHANGE | T y V no se confunden | Sí | separar valor/detalle | N2-007 |
| APPROVED TARGET | Listbox `selectionChange<T[]>` | `valueChange<NeuSelectionValue<V,M>>` + `optionActivated` | CHANGE | alinea field con V | Sí | separar valor/detalle | N2-007 |
| APPROVED TARGET | ToggleButtonGroup `neuChange` | `valueChange` generado por model | RENAME | convención Forms | Sí | renombrar listener | N2-007 |
| APPROVED TARGET | InputTags valor `T[]` ambiguo | `InputTags<T,V>` y `value: readonly V[]` | CHANGE | opción/valor separados | Sí | declarar `optionValue` o T=V | N2-008 |
| APPROVED TARGET | InputTags `show`/`hide` | `opened`/`closed` | RENAME | lifecycle uniforme | Sí | renombrar listeners | N2-022 |
| APPROVED TARGET | InputTags `focus`/`blur` | `focusEntered`/`focusLeft` | RENAME | boundary compuesto | Sí | renombrar listeners | N2-022 |
| APPROVED TARGET | InputTags sugerencia `select` | `optionActivated` | RENAME | evita evento DOM ambiguo | Sí | renombrar listener | N2-008 |
| APPROVED TARGET | Tags separators/duplicates/max/label/hint | mismas capacidades en InputTags | MERGE | cero pérdida antes de retirar | Sí | mapear inputs | N2-008 |
| APPROVED TARGET | `NeuTagsComponent`, `neu-tags`, subpath | `NeuInputTagsComponent<string,string>` | MERGE | un editor de tags | Sí | cambiar import/selector | N2-008 |

## TreeSelect

| Estado | CURRENT | TARGET | ACTION | RATIONALE | BREAKING | MIGRATION | OWNER TASK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| APPROVED TARGET | `multiple:boolean`, `V\|V[]\|null` | `mode` discriminado + `NeuSelectionValue<V,M>` | CHANGE | typing consistente | Sí | declarar modo literal | N2-019 |
| APPROVED TARGET | `selectionChange<T[]>` | model `value` V + `valueChange` | CHANGE | field usa V | Sí | separar opción/nodo del valor | N2-019 |
| APPROVED TARGET | `nodeExpand<T>` usado como lazy request | `childrenRequest<{parentKey,requestId,queryRevision}>` | RENAME | request explícito | Sí | adaptar handler remoto | N2-019 |
| APPROVED TARGET | `nodeExpansionChange<{node,expanded}>` | `expandedKeysChange` proposal + `nodeExpanded`/`nodeCollapsed` | CHANGE | estado y dominio separados | Sí | aplicar/rechazar keys y escuchar detalle aparte | N2-019 |
| APPROVED TARGET | selección multiple independiente única | `selectionStrategy:'independent'\|'propagated'` | ADD | gap P1 | No | optar por propagated donde corresponda | N2-019 |
| APPROVED TARGET | sin virtualización pública | `virtualizationOptions` + `rangeChange` | ADD | gap P1 10k | No | configurar tamaño fijo/rango | N2-019 |
| APPROVED TARGET | `filter`, `opened`, `closed`, `cleared` | search domain/lifecycle/lifecycle/domain | KEEP | semántica útil | No | conservar payload/timing target | N2-019/N2-022 |

## Table y TableCore

| Estado | CURRENT | TARGET | ACTION | RATIONALE | BREAKING | MIGRATION | OWNER TASK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| APPROVED TARGET | `serverSide:boolean` | `dataMode:'client'\|'remote'` | RENAME | modo explícito | Sí | boolean→literal | N2-011 |
| APPROVED TARGET | `query`, `sort`, `sortEntries`, `multiSort`, page/search/filter inputs como estado paralelo | `query: NeuTableQuery<F>` | MERGE | una query aplicada | Sí | converter one-shot | N2-011 |
| APPROVED TARGET | `sortOptions` inexistente y flags sort escalares | `sortOptions:{mode,...}` | MERGE | política separada de estado | Sí | agrupar flags | N2-011/012 |
| APPROVED TARGET | `queryChange` con estado vigente | `queryChange` proposal de `NeuTableQuery<F>` | CHANGE | rechazo controlado | Sí temporal/tipo | consumer aplica query | N2-011 |
| APPROVED TARGET | `serverStateChange`, `NeuTableServerState` | sin canal; usar query/dataRequest/metadata | REMOVE | no es alias de query | Sí | converter explícito | N2-011 |
| APPROVED TARGET | `lazyRequest` | `dataRequest<NeuTableDataRequest<F>>` | RENAME | único transporte | Sí | handler por reason/revision | N2-013 |
| APPROVED TARGET | `virtualScrollEvent<Event>` | `rangeChange<NeuTableRange>` | RENAME | rango lógico half-open | Sí | dejar DOM event fuera o en detail opcional | N2-013 |
| APPROVED TARGET | `selectable:false\|true\|'single'\|'multiple'` | `selectionOptions.mode:'none'\|'single'\|'multiple'` | CHANGE | sin boolean ambiguo | Sí | mapear true a política elegida | N2-012 |
| APPROVED TARGET | `selection:T\|T[]` | `selectedKeys: readonly K[]` | RENAME | funciona con datos unloaded | Sí de datos | extraer K de selección | N2-012 |
| APPROVED TARGET | `selectionChange` | `selectedKeysChange` proposal | RENAME | estado aplicado/propuesta | Sí | consumer aplica keys | N2-012 |
| APPROVED TARGET | `selectAll`/`selectAllChange` ambiguos | `toggleAll` + proposal según `selectionOptions.scope` | CHANGE | scope explícito | Sí | elegir page/filtered/loaded | N2-012 |
| APPROVED TARGET | `rowSelect`/`rowUnselect` | detalle de dominio con T,K,source | KEEP | aporta origen/fila | Sí de payload si cambia | adaptar payload | N2-012 |
| APPROVED TARGET | `rowKey` | identidad semántica K | KEEP | owner correcto | No | conservar | N2-012 |
| APPROVED TARGET | `rowTrackBy` | identidad de render | KEEP | distinto de rowKey | No | conservar | N2-012 |
| APPROVED TARGET | `filterDisplay`, `advancedFilterMode`, debounce/locale/text flags | `filterOptions` cohesivo | MERGE | reduce combinaciones | Sí | agrupar con defaults explícitos | N2-012 |
| APPROVED TARGET | `paginatorOptions` + page flags | `paginationOptions` + query page/pageSize | CHANGE | naming y owner consistentes | Sí | renombrar config; mover estado a query | N2-012 |
| APPROVED TARGET | `virtualizationOptions` actual | `virtualizationOptions` target con render/visible/retention/requestStep | CHANGE | rango explícito | Sí de tipo | mapear campos | N2-013 |
| APPROVED TARGET | `urlState`, `urlStateOptions`, inyección Router | adapter URL externo | REMOVE | persistencia no es owner | Sí | subscribe query/proposal fuera | N2-014 |
| APPROVED TARGET | `stateKey`, `stateStorage`, `stateSave`, `stateRestore`, `saveState/restoreState/clearState/resetState` | adapter storage externo | REMOVE | paquete no posee persistencia | Sí | serializar query/layout externally | N2-014 |
| APPROVED TARGET | export integrado en fachada | entrypoint/adaptador opcional CSV/JSON/XLSX | CHANGE | tree-shaking | Sí de import | importar exportador explícito | N2-014 |
| APPROVED TARGET | `contextMenuSelection` | estado contextual separado | KEEP | no altera selección de negocio | No | conservar | N2-012 |
| APPROVED TARGET | `expandedRowKeys` + change | input aplicado + proposal | KEEP | patrón controlado válido | No/typing posible | aplicar keys externamente | N2-012 |
| APPROVED TARGET | `editingRowKeys`/`editingCell` + change | inputs aplicados + proposals | KEEP | authoring controlado | No/typing posible | conservar owner | N2-012 |
| APPROVED TARGET | TableCore frontera existente | renderer `NeuTableCore<T,K>` mínimo | KEEP | ventaja medida | Sí de firma | migrar consumer core al nuevo type contract | N2-014 |
| APPROVED TARGET | TableCore 16 inputs actuales congelados por historia | firma desde rows/columns/templates/identity/loading/empty | CHANGE | no arrastrar facade | Sí | seguir ledger específico N2-014 | N2-014 |

## TreeTable

| Estado | CURRENT | TARGET | ACTION | RATIONALE | BREAKING | MIGRATION | OWNER TASK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| APPROVED TARGET | TreeTable no genérico, `columns<any>` | `TreeTable<T,K>` y columnas typed | CHANGE | T atraviesa toda la API | Sí | declarar T/K y quitar any | N2-015 |
| APPROVED TARGET | filas planas con `id`,`label`,`__tree*` | `NeuTreeTableNode<T,K>` + metadata aparte | CHANGE | evita colisiones/mutación | Sí de datos/templates | envolver dominio en `{key,data}` | N2-015 |
| APPROVED TARGET | templates/eventos reciben fila aplanada | `NeuTreeRowContext<T,K>` | CHANGE | dominio intacto | Sí | usar `context.data`/`nodeKey` | N2-015 |
| APPROVED TARGET | `serverSide`/Table bypass | proyección jerárquica propia + `dataMode` | REMOVE | no reutilizar pipeline plano | Sí | adaptar fuente roots/children | N2-016 |
| APPROVED TARGET | sort externo/estado paralelo | `query.sort[]` por hermanos | MERGE | semántica árbol | Sí | mover a query | N2-016 |
| APPROVED TARGET | `NeuTreeTableLazyRequest` | `NeuTreeDataRequest` union roots/children/viewport | CHANGE | unidades/IDs explícitos | Sí | switch por `kind` | N2-016 |
| APPROVED TARGET | múltiples lazy/virtual outputs | `dataRequest` único | MERGE | un transporte | Sí | consolidar handlers | N2-016 |
| APPROVED TARGET | `virtualRangeChange` | `rangeChange` con render/visible half-open + projectionRevision | RENAME | convención común | Sí | adaptar rangos | N2-016 |
| APPROVED TARGET | `totalItems` ambiguo | `rootTotal`, `visibleRowCount`, `estimatedRowCount` | CHANGE | unidades honestas | Sí | mapear total a raíces | N2-016 |
| APPROVED TARGET | filtro TreeTable duplicado/custom fall-through | registro puro compartido con Table | CHANGE | misma regla/mismo resultado | Sí en edge cases | registrar predicate una vez | N2-017 |
| APPROVED TARGET | propagación disabled asimétrica | `selectionDisabledBoundary:'stop'` | CHANGE | truth table definida | Sí | revisar selección jerárquica | N2-017 |
| APPROVED TARGET | `selectedKeys` mutado/aplicado internamente | input + `selectedKeysChange` proposal | CHANGE | rechazo controlado | Sí temporal | consumer aplica propuesta | N2-017 |
| APPROVED TARGET | `expandedKeys` mutado/aplicado internamente | input + `expandedKeysChange` proposal | CHANGE | rechazo controlado | Sí temporal | consumer aplica propuesta | N2-016 |
| APPROVED TARGET | parche DOM de roles/índices/tabindex | bindings declarativos + foco por K | CHANGE | SSR/a11y/virtual | Sí solo para template managed | migrar template context | N2-018 |

## Navegación, overlays y eventos

| Estado | CURRENT | TARGET | ACTION | RATIONALE | BREAKING | MIGRATION | OWNER TASK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| APPROVED TARGET | Accordion `item.expanded` seed + `panelToggle` agregado | `initialExpandedKeys`, `expandedKeys`, `expandedKeysChange`; toggle detail opcional | CHANGE | control/restauración reales | Sí | extraer keys iniciales; aplicar proposals | N2-020 |
| APPROVED TARGET | Accordion body HTML string único | template/body Angular tipado; HTML saneado opcional | ADD | gap P1 | No | mover contenido complejo a template | N2-020 |
| APPROVED TARGET | Tabs `tabParam` y URL implícita | `activeId` + `activeIdChange`, adapter URL externo | REMOVE | sin Router/estado global por defecto | Sí | implementar adapter en app | N2-021 |
| APPROVED TARGET | Tabs estado activo interno sin input | `activeId` aplicado + proposal | ADD | control externo | No/Sí temporal | mantener signal owner en app | N2-021 |
| APPROVED TARGET | Panel collapsed interno | `collapsed` + `collapsedChange` | CHANGE | estado controlable | Sí | aplicar proposal | N2-021 |
| APPROVED TARGET | Fieldset collapsed controlado | misma convención collapsed/proposal | KEEP | ya encaja | No | conservar | N2-021 |
| APPROVED TARGET | Sidebar collapsed/persistencia implícita | `collapsed` + `collapsedChange`, adapter externo | CHANGE | owner explícito | Sí | mover URL/storage fuera | N2-021 |
| APPROVED TARGET | Sidebar `urlParam` + `open()`/`close()` ownership | `[open]` aplicado + `closeRequested`; `opened`/`closed` lifecycle | CHANGE | overlay controlled-only; URL/storage externos | Sí | parent adapta URL y acepta/rechaza intención | N2-022 |
| APPROVED TARGET | Dialog/BottomSheet `closed` como request | `closeRequested` | RENAME | intención puede rechazarse | Sí | renombrar listener | N2-022 |
| APPROVED TARGET | Dialog/BottomSheet `hidden` como detach final | `closed` lifecycle | RENAME | convención temporal | Sí | `(hidden)`→`(closed)` | N2-022 |
| APPROVED TARGET | lifecycle `opened` en overlays | `opened` tras attach | KEEP | semántica correcta | No | conservar | N2-022 |
| APPROVED TARGET | outputs ambiguos `select` de dominio | `optionActivated`/nombre específico | RENAME | no colisiona con DOM | Sí | renombrar listener | N2-007/N2-022 |
| APPROVED TARGET | output compuesto `focusEvent`/`blurEvent` | `focusEntered`/`focusLeft` | RENAME | boundary, no elemento interno | Sí | cambiar listeners | N2-022 |
| APPROVED TARGET | Calendar `selectedDateChange` + `dateSelect` espejo | `selectedDateChange` estado; detail solo si añade source | MERGE | evita doble canal | Sí | eliminar listener redundante | N2-022 |
| APPROVED TARGET | SpeedDial `open/openChange`, aliases históricos ya retirados | `open/openChange` | KEEP | no reabrir contrato válido | No | ninguna | KEEP |
| APPROVED TARGET | Carousel public alias `page`, Gallery `activeIndex` | mismos publicNames únicos | KEEP | alias metadata no es duplicación | No | ninguna | KEEP |

## Visual, utilidades y catálogo

| Estado | CURRENT | TARGET | ACTION | RATIONALE | BREAKING | MIGRATION | OWNER TASK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| APPROVED TARGET | `density:'default'\|'normal'\|...` desigual | `'compact'\|'normal'\|'relaxed'`, default normal | CHANGE | vocabulario único | Sí | mapear default→normal | N2-023 |
| NEEDS REVIEW | `severity`/`color`/`variant`/`type` semánticos mezclados | `tone` semántico + `variant` visual por componente | RENAME | separa intención/tratamiento | Sí | aplicar solo tras mapa exacto | N2-023 |
| APPROVED TARGET | CodeBlock `lang` + `language` | `language` | MERGE | un nombre | Sí | `[lang]`→`[language]` | N2-023 |
| APPROVED TARGET | Input `icon`/`iconPosition` + `startIcon/endIcon` | slots `start`/`end` con icono o template | MERGE | composición sin solape | Sí | mover adornos a slots | N2-023 |
| APPROVED TARGET | `--neu-color-border` | `--neu-border` | REMOVE | alias CSS | Sí | reemplazo token a token | N2-023/N2-032 |
| APPROVED TARGET | `--neu-color-danger`, `--neu-danger` | `--neu-error` | REMOVE | un concepto | Sí | reemplazar ambos | N2-023/N2-032 |
| APPROVED TARGET | `--neu-color-picker-bg` | `--neu-surface` | REMOVE | token canónico existente | Sí | reemplazar | N2-023/N2-032 |
| APPROVED TARGET | `--neu-color-picker-shadow` | `--neu-shadow-lg` | REMOVE | token canónico existente | Sí | reemplazar | N2-023/N2-032 |
| APPROVED TARGET | `--neu-color-primary` | `--neu-primary` | REMOVE | alias CSS | Sí | reemplazar | N2-023/N2-032 |
| APPROVED TARGET | `--neu-color-primary-alpha` | `--neu-primary-alpha` | RENAME | falta nombre canónico estable | Sí | mismo valor inicial | N2-023/N2-032 |
| APPROVED TARGET | `--neu-color-secondary` | `--neu-secondary` | REMOVE | alias CSS | Sí | reemplazar | N2-023/N2-032 |
| APPROVED TARGET | `--neu-color-success` | `--neu-success` | REMOVE | alias CSS | Sí | reemplazar | N2-023/N2-032 |
| APPROVED TARGET | `--neu-color-surface-subtle` | `--neu-bg` | REMOVE | mismo concepto actual | Sí | reemplazar | N2-023/N2-032 |
| APPROVED TARGET | `--neu-color-text-secondary` | `--neu-text-muted` | REMOVE | mismo concepto actual | Sí | reemplazar | N2-023/N2-032 |
| APPROVED TARGET | `--neu-color-warning` | `--neu-warning` | REMOVE | alias CSS | Sí | reemplazar | N2-023/N2-032 |
| APPROVED TARGET | `--neu-nav-toggle-color-hover` | `--neu-text` | REMOVE | mismo valor contractual actual | Sí | reemplazar | N2-023/N2-032 |
| APPROVED TARGET | `--neu-radius-md` | `--neu-radius` | REMOVE | alias CSS | Sí | reemplazar | N2-023/N2-032 |
| APPROVED TARGET | Splitter `direction` | `orientation` | RENAME | no confundir con dir RTL | Sí | renombrar input | N2-028 |
| APPROVED TARGET | Splitter `sizeChange` | `sizesChange` | RENAME | payload plural | Sí | renombrar output | N2-028 |
| NEEDS REVIEW | `NeuImageGalleryComponent`/selector/subpath | Gallery tras portar contador/viewerEnabled | MERGE | reduce estado duplicado | Sí si se acepta | no retirar hasta equivalencia | N2-029 |
| APPROVED TARGET | ImageViewer service | mismo servicio | KEEP | caso imperativo distinto | No | ninguna | N2-029 |
| APPROVED TARGET | StatsCard `sparkData` y SVG serie | sin API gráfica; KPI/trend/projection | REMOVE | charts fuera de scope | Sí | componer visual externa | N2-030 |
| APPROVED TARGET | StatsCard KPI/text/icon/trend/projection | mismo contrato no gráfico | KEEP | propósito válido | No | ninguna | N2-030 |

## Cierre del ledger

- Todos los breaking changes P1 tienen sustituto y tarea.
- Las dos filas `NEEDS REVIEW` de superficie pública no se ejecutan hasta N2-023/N2-029; su comportamiento actual se mantiene mientras tanto.
- Las adiciones P2/P3 descritas en el contrato general no autorizan implementación durante N2-002.
- Al implementar cada tarea, el contrato generado debe demostrar que no quedan aliases, selectors, entrypoints ni outputs legacy de esa unidad.
