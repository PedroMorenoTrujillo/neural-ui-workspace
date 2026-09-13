# NeuTable / NeuTableCore — Arquitectura objetivo Neural UI 2

Auditoría estática del working tree `v2` sobre `a6a9606613fba61e7c337c3f57d1aecbb11702e8`, con Fases 1, 2 y 3A acumuladas. Consulta de fuentes: 12 de septiembre de 2026. Prime de referencia: **22.1.1**. Las propuestas describen arquitectura futura; no están implementadas. PARITY significa cobertura del caso indicado por fuente/contrato y tests existentes, no una certificación comparativa de ejecución. Los gates históricos se atribuyen a su fase; no se volvieron a ejecutar en esta auditoría.

## Principio rector — enmienda Neural UI 2

**PrimeNG es exclusivamente baseline funcional y competitivo. Su naming, inputs, outputs, estado y arquitectura no son el target.** Para cada caso: «¿Cuál es la solución Neural más simple, reactiva, eficiente, coherente y Angular 22-native para cubrirlo o superarlo?» Neural UI 2 es un major: se autorizan renames, fusiones, eliminaciones, cambios de eventos/estado y reescrituras completas. Neural UI 1 conserva el contrato antiguo; Neural UI 2 no incluye aliases, wrappers o compatibility layers para evitar el breaking.

Priorizar simplicidad conceptual, signals como estado real, input/model/computed cuando proceda, tipos fuertes, API expresiva, menos estado duplicado y código imperativo. Zoneless, SSR/hydration, accesibilidad, lifecycle/memoria, tree-shaking, bundle, rendimiento, mantenibilidad y coherencia transversal son gates del diseño. Ninguna API nueva se justifica solo por modernidad. Menor configuración, DOM, listeners, effects o duplicación puede ser superioridad objetiva si se mide manteniendo la capacidad.

Las conversiones de datos de migración son operaciones puntuales del consumidor, no compatibilidad embebida en el paquete. La integración con HTTP, URL o almacenamiento es un límite externo legítimo que seguiría existiendo en una app nueva; no debe emular APIs Prime ni sostener estado espejo. Cada decisión requiere beneficio concreto y prueba; ni conservar ni reescribir código antiguo es un fin en sí mismo.

## CURRENT NEURAL MODEL

NeuTable<T> combina renderer, controllers de estado, filtrado, layout, edición, persistencia, virtualización y activación de features opcionales. La fachada actual declara **80 inputs y 38 outputs**; TableCore declara **16 inputs y 0 outputs**. El número histórico77 ya no describe este árbol. Sources: [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1903), [neu-table-core.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table-core/neu-table-core.component.ts:217), [TABLE_ARCHITECTURE.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/docs/TABLE_ARCHITECTURE.md:1).

`NeuTableQueryState` tiene page1-based, pageSize, search, sort single y sortEntries multi, globalFilterFields, filtros y serialización. `NeuTableServerState` es una interfaz distinta con sortKey/sortDir y proyecciones de filtros. El effect de query controlada prevalece sobre sort separado: no son dos owners activos sin prioridad, pero sí dos formas públicas de suministrar el mismo estado. `_emitQueryState` puede emitir queryChange, serverStateChange y lazyRequest para una transición; el consumidor puede duplicar HTTP al conectar más de un canal. No se diagnostica una petición duplicada incondicional dentro de la librería. Sources: [neu-table.types.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.types.ts:957), [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:7428).

Datos, query, selección, expansión, edición y layout son slices distintas. El controller conserva rutas controlled/uncontrolled y propuestas; no deben reemplazarse mecánicamente con model. La selección entra como T / readonly T[] / null y sale como T[]; los keys internos no son aún un contrato canónico externo.

`virtualizationOptions` cubre altura fija, viewport, overscan, delay, appendOnly, autoSize y step. AutoSize dimensiona viewport, no prueba soporte de altura variable por fila. El request actual ya lleva requestId y rangos render/visible: preservarlos. `rowKey` identifica datos; `rowTrackBy` optimiza render y no es un alias. Source: [neu-table.types.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.types.ts:493).

## PRIMENG 22 MODEL

Referencia de API: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`. Documentación de workflows: [PrimeNG table](https://primeng.dev/table). Prime expone estado por slices de paginación, sort, filtros, selección y expansión; lazy metadata permite carga remota, y templates/directivas habilitan editing, grouping, columnas y contenido. El genérico `Table<RowData=any>` conserva RowData en datos y algunos eventos, pero no elimina any en toda la superficie. No usar ausencia global de tipos como ventaja de Neural.

Su modelo distribuido es baseline funcional, no el diseño a copiar. Los casos concretos y evidencias se desglosan aquí:

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | Datos locales | value tipado RowData[] | data readonly y columnas genéricas | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-002 | Página remota | lazy/totalRecords/first | serverSide/query/totalItems; transporte del consumidor | REDESIGN | CHANGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-003 | Loading | loading/showLoader y templates | loading, skeleton y loading-body | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-004 | Vacío | emptymessage template | neuTableEmpty tipado | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-005 | Error y retry | Contenido/template; I/O externo | Contenido externo; error de feature opcional distinto de error de datos | REDESIGN | CHANGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-006 | Controlado/rechazo | Model y inputs de slices | Controller controlado con propuesta; evitar model automático | REDESIGN | CHANGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-007 | Query agregada | Eventos lazy/filter/sort/page | Query serializable tipada | REDESIGN | CHANGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-008 | Server state legacy | Metadatos lazy; sin contrato Neural | ServerState es proyección distinta y antigua | REDESIGN | REMOVE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-009 | Reset | clear/reset; estado | resetState, clearState, clearColumnFilters | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-010 | Persistencia | session/local y stateKey | snapshot/restore + URL; versionar nuevo schema | REDESIGN | CHANGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-011 | Single | sortField/sortOrder | sort/entries/comparador | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-012 | Multi | multiSortMeta | sortEntries/multiSort | REDESIGN | MERGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-013 | Custom | sortFunction/customSort | sortComparator y sortAccessor por columna | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-014 | Remoto | onLazyLoad contiene orden | queryChange con orden y mapping | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-015 | Removable | custom/removable demo | removableSort; vacío explícito | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-016 | Inicial | presort single/multiple | query o sort controlado; precedencia actual | REDESIGN | CHANGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-017 | Columna | filters/ColumnFilter | filterConfig por columna | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-018 | Global | globalFilterFields | accessors y backend fields tipados | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-019 | Match modes | text/number/date/select/boolean | motor tipado de las mismas familias | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-020 | Múltiples reglas | AND/OR y constraints | constraints tipadas AND/OR | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-021 | Custom registry | FilterService/custom | NeuTableFilterRegistry con cleanup | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-022 | Menu/row | ColumnFilter display | filterDisplay + advancedFilterMode; dos ejes solapados | REDESIGN | MERGE | P1 / N2-012 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-023 | Programático | filter()/filterGlobal() | setColumnFilter/clear y query | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-024 | Commit/debounce | filterDelay/filterOn/apply | scheduler delay/on + draft menu | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-025 | Remoto | lazy filter metadata | serializable/local-only/requires-consumer explícito | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-026 | Client | paginator rows first | page 1-based/pageSize | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-027 | Server | totalRecords + lazy | totalItems + página del backend | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-028 | Controlled | first/rows models | query controla page/pageSize | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-029 | Sizes/report/jump | options/report/jump templates | pageSizeOptions/paginatorOptions | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-030 | Placement | top/bottom/both | paginatorPosition | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-031 | Single/multiple | selectionMode + selection | selectable boolean\|string, output siempre array | REDESIGN | CHANGE | P1 / N2-012 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-032 | Checkbox/radio | componentes fila y header | checkbox interno/radio y modo single | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-033 | Select all | page-only o conjunto | scope page/filtered; remoto cargado | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-034 | Meta/range/keyboard | modificadores y rangos | controller teclado y selección | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-035 | rowSelectable | predicado | predicado y skip de no seleccionables | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-036 | Remoto no cargado | selection/datakey | keys internos pero input por objetos | REDESIGN | CHANGE | P1 / N2-012 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-037 | ARIA/foco | aria-selected y controles etiquetados | semántica nativa y filas administradas | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-038 | Cell | editable column/editor template | editMode cell + commit/cancel | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-039 | Row | editable row/save/cancel | editingRowKeys/row draft y save/cancel | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-040 | Validation | Form controls en editor | cellEditValidator/rowEditValidator y error | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-041 | Custom editor | template input/output | neuTableCellEditor; templates de control | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-042 | Controlled/template | expandedRowKeys/expandedrow | expandedRowKeys/neuTableExpand | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-043 | Subheader | groupRowsBy/subheader | groupBy/header/footer de grupo | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-044 | Rowspan | rowGroupMode rowspan | rowGroupMode y render entries | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-045 | Colapso y agregado | expand groups/footer propio | expandedGroupKeys + template; agregado del consumidor | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-046 | Dinámicas | columns/proyección | columns y contextos tipados | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-047 | Reorder | reorderableColumns | reorder/layout controllers | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-048 | Resize fit/expand | columnResizeMode | fit/expand y evento layout | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-049 | Frozen/sticky | frozen/alignment | columna frozen y sticky offsets | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-050 | Visibility/width | chooser compuesto y widths | columnChooser y layout | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-051 | Reorder | drag row event | propuesta inmutable rowReorder | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-052 | Styling/class | templates/class | rowClass y stripedRows | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-053 | Context menu | separate context selection | contextMenuSelection distinta de selección | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-054 | Frozen | frozenValue | frozenData | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-055 | Fixed viewport | Scroller itemSize | itemSize/visibleItems; rango fijo | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-056 | Lazy sparse | virtual + lazy | datos dispersos + placeholders y retention | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-057 | Overscan/ranges | tolerated items/scroll-index | overscan/rango lógico-visible | REDESIGN | RENAME | P1 / N2-013 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-058 | Altura variable real | No probada por autoSize; itemSize fijo en docs | No algoritmo de medida individual; autoSize viewport | OUT OF SCOPE | DEFER | P3 / N2-036 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-059 | Lifecycle/memory | Scroller listeners/lifecycle | viewport disconnect/retention cleanup | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-060 | Header/body/footer | templates de sección | header/footer group y body/section | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-061 | Caption/loading/empty | templates dedicados | caption/loadingBody/empty/lazyPlaceholder | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-062 | Group/filter/editor | templates personalizados | directivas tipadas y callbacks acotados | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-063 | Overflow contenido | scroll responsive; stack custom | scroll contenido, logical CSS, estándar 320px | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-064 | CSV | exportCSV configurable | CSV scope/value/escape de fórmulas | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-065 | JSON/XLSX propios | No exportadores equivalentes públicos en Table | exportJson/exportXlsx en entrypoint | SUPERIOR | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-066 | Rows/columns/sort | roles y aria-sort | native table, aria-sort, coordenadas solo si veraces | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-067 | Granularidad de paquete | entrypoint Table y dependencias propias | TableCore separado; full Table se mide aparte | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-068 | Gran dataset/identity | rowTrackBy/dataKey | rowKey semántico y rowTrackBy render | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-069 | Dominio genérico | Table<RowData> y rowSelect<RowData>; selection:any | NeuTable<T> pero keys unknown y compatibilidad | REDESIGN | CHANGE | P1 / N2-012 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-070 | Auxiliares | directivas y templates de Table | managed row, feature components internos; no API extra | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-236 | Reglas reutilizables | FilterService | TableFilterRegistry y option-api config | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## HISTORICAL ISSUES

H3 y H5-B1 separaron TableCore para proteger import simple y consolidaron controllers. H5-C1 limitó la fachada soportada a32 métodos en aquel snapshot y diferenció miembros internos. H9 profesionalizó features y finalizó estilos. Se preservan sus capacidades y gates; las estructuras, controllers y fachadas se pueden sustituir si dificultan el target. FinalPolish añadió filterDisplay/filterLabelDisplay, resolviendo presentación pero aumentando solapamiento con advancedFilterMode. N2_ARCH propone retirar ServerState como alias; esa justificación es incorrecta y requiere converter. El Executive clasifica cada precedente con enlace.

## CURRENT PROBLEMS

1. **Query redundante:** sort y sortEntries permiten representaciones divergentes; slices sueltas coexisten con query agregada y defaults. Debe existir una sola representación persistida.
2. **Estado remoto mezclado:** serverSide decide ejecución, ServerState repite datos de query y lazyRequest también transporta query. Separar política, intención y respuesta.
3. **Configuración dispersa:** selectable boolean|string, selección por objeto, multiSort y displays de filtro expresan políticas de forma irregular. `urlState` más `urlStateOptions.enabled` usan activación OR; false no anula un true legacy.
4. **Dependencia involuntaria:** inyección incondicional de NeuUrlStateService cuyo constructor necesita Router, aun con URL State desactivado. No afirmar que TableCore tenga esta dependencia. Sources: [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1822), [neu-url-state.service.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/url-state/neu-url-state.service.ts:32).
5. **Errores de datos vs errores de feature:** el error al cargar export u otra feature no equivale a error de transporte. Faltan canales y templates explícitos en el target sin hacer HTTP interno.
6. **Eventos virtuales acoplados:** un Event DOM obligatorio no representa bien resize, restauración o scroll programático. El rango lógico debe existir sin evento nativo.

## FEATURE GAPS

No se propone una segunda Table ni clonar cada input de Prime. Los workflows principales de Table existen. Los déficits que condicionan sustitución son coherencia de estado remoto/identidad, contratos y prueba de combinaciones, clasificados REDESIGN. Virtualización 2D/altura variable queda P3; no prometerla bajo autoSize. Una agregación financiera o exportación de todo el backend es responsabilidad del consumidor, no un gap de renderer.

## REDESIGN OPPORTUNITIES

Separar **datos aplicados, propuesta de query, intención remota y vista efímera**. La simplificación se mide por un owner y un canal por semántica, no por menor número de inputs a cualquier coste. Conservar configuraciones cohesivas accesibles, sin un mega objeto anónimo ni sistema público de plugins. Definir los tipos y migraciones antes de la fase Signal Forms; integrar después editores tipados ya migrados.

## Decisión de reescritura y arquitectura reactiva

**REWRITE FROM SCRATCH de la fachada y orquestación; reutilización selectiva del renderer y funciones puras.** No envolver el componente viejo ni incorporar sus inputs como capa de compatibilidad. La evidencia de query/proyecciones duplicadas, transporte, tipos y dependencia de DOM atraviesa la orquestación y hace insuficiente limitarse a renames incrementales. Reescribir también todo el renderer sin beneficio probado añadiría riesgo a accesibilidad y bundle; puede sustituirse si su contrato impide la semántica objetivo.

| Alternativa | Evaluación | Decisión |
| --- | --- | --- |
| Parchear facade1.x y conservar channels legacy | Mantiene precedencias, branches y dualidad de estado | Rechazada. |
| Nuevo flujo de estado y API sobre primitivas independientes | Elimina acoplamientos; conserva solo algoritmos y semántica probados | Recomendada. |
| Reescribir también todas las primitivas desde cero | No hay ventaja general demostrada; puede mejorar una pieza concreta | Permitida por pieza con benchmark/corrección que la justifique. |

| Capa | Primitiva / propietario | Regla de diseño |
| --- | --- | --- |
| Datos, configuración y estado controlado | input tipado, readonly | No copiar a writable signals por effect. |
| Estado no controlado | signal local de la slice cuando no hay owner externo | No sincronizarlo con input controlado; transición de modo explícita. |
| Estado aplicado | computed selecciona owner | Query/selectedKeys/expandedKeys tienen una sola fuente aplicada. |
| Índices, filtros, orden, proyección, ARIA | computed + funciones puras memoizadas por identidad | No set() de resultados derivados ni arrays espejo. |
| Rango visible y foco activo | señales efímeras mínimas | Índice render se deriva de rango; foco por key, no doble lista DOM. |
| Edición | signal de draft durante sesión activa | Draft distinto del valor confirmado; desaparece con commit/cancel/reset. |
| Eventos de usuario | transición pura + output de propuesta | No effects para convertir todo cambio derivado en evento. |
| I/O inevitable | frontera acotada DOM/observer/transport intention | Effect solo si conecta estado aplicado con sistema externo; cleanup y SSR guard. |

input/model/computed son herramientas, no una cuota. Query controlada que puede rechazarse usa input+output de propuesta; model se reserva a valores que aceptan escritura local como parte de su contrato. En modo uncontrolled, la misma transición opera sobre un único signal local. initialQuery inicializa una vez y no compite con query aplicada. No mantener query, serverState, sort y sortEntries como signals equivalentes.

Estado remoto conserva identidad de petición y payload aplicado, sin duplicar respuesta en el renderer. Funciones de transición devuelven nuevo estado/intención; effects no se encadenan para sincronizar slices. Un effect de frontera para reaccionar a aceptación externa debe deduplicar por revisión efectiva, tener owner explícito y no ejecutarse como fetch durante SSR. Eventos derivados del usuario no necesitan un effect adicional por output.

Modelo de coste: registrar número de fuentes writable, computeds, effects de frontera, listeners/observers/timers, renders, DOM y bytes por consumer antes/después. Cada effect debe justificar qué sistema externo sincroniza; cero effects dedicados a copiar estado derivable. Índices/recorridos jerárquicos O(V+E), renderer O(ventana) con overscan, actualizaciones locales con identidad estable. No sustituir un input por un mega objeto any para ganar una cifra superficial.

La nueva fachada se construye contra los contratos de este documento y fixtures empresariales independientes. Se adaptan los tests de comportamiento valioso, se reemplazan los que fijan contratos incorrectos y se elimina la fachada vieja al integrar v2. No publicar dos variantes equivalentes del componente. Migración rompe imports/bindings/tipos/snapshots cuando sea necesario; ejemplos puntuales en el consumidor, ningún Prime-like adapter dentro de Neural.

Gate adicional: misma cobertura funcional in-scope, menos representaciones canónicas del mismo estado, ningún canal legacy ni dependencia DOM privada, tipos completos, SSR semántico, teclado/foco intactos y presupuestos de bundle/DOM/lifecycle. El número de inputs o antigüedad de una clase no basta para decidir.

## TARGET NEURAL 2 MODEL

El siguiente pseudotipo es una especificación futura, no un export existente:

```ts
type NeuDataMode = 'client' | 'remote';
type NeuKey = string | number;
interface NeuTableQuery<F extends string = string> {
  page: number; // 1-based
  pageSize: number;
  search: string;
  sort: readonly { field: F; direction: 'asc' | 'desc' }[];
  filters: readonly NeuFilterGroup<F>[]; // reglas tipadas existentes, schema versionado
  globalFilterFields: readonly F[];
}
interface NeuIndexRange { start: number; end: number } // [start,end)
interface NeuTableRange {
  render: NeuIndexRange;
  visible: NeuIndexRange;
}
interface NeuTableDataRequest<F extends string = string> {
  requestId: number;
  queryRevision: number;
  query: NeuTableQuery<F>;
  reason: 'initial' | 'query' | 'viewport' | 'retry';
  range?: NeuTableRange;
}
```

`NeuFilterGroup` conserva discriminantes de familia, operador AND/OR y valores serializables. Columnas unen key de UI, accessor de T y backend field explícito: no convertir key de UI en ruta SQL ni serializar funciones. Los filtros locales registrados se identifican como local-only o requieren converter del consumidor. Query snapshot version2 incluye schemaVersion; las funciones comparadoras y templates quedan fuera.

### Propietarios y transiciones

| Slice | Entrada aplicada | Propuesta / intención | Semántica |
| --- | --- | --- | --- |
| Query | query opcional; initialQuery si no controlada | queryChange | Consumidor puede rechazar; no cambiar UI aplicada antes de aceptar. |
| Datos | data + dataMode | dataRequest solo remote | La librería no ejecuta HTTP. |
| Remoto | metadata totalItems/loading/error/requestId | retry por dataRequest | Respuesta correlacionada; no derivar query de metadata. |
| Selección | selectedKeys: readonly K[] | selectedKeysChange | Single limita a1; [] vacío; no requiere filas cargadas. |
| Expansión | expandedRowKeys | expandedRowKeysChange + rowExpanded/rowCollapsed detail | Mantener claves aunque cambie ventana de datos. |
| Layout | columnLayout | columnLayoutChange | Ancho/orden/visibilidad; separado de filtros y sort. |
| Edición | editingRowKeys / draft sesión | editStarted/editCommitted/editCancelled | Draft temporal separado de dato confirmado; no persistencia automática. |
| Viewport | configuración y referencia scroll | rangeChange | No forma parte de query persistida; restauración opt-in. |

Todos los estados controlables aceptan input más output de propuesta; un valor inicial explícito solo en modo no controlado. No exponer simultáneamente initialQuery y slices de defaults competidoras. En modo controlado, una acción emite queryChange; dataRequest se emite una vez **cuando se acepta/aplica la query**, no antes. En uncontrolled, la transición aplica localmente y emite ambos eventos con semánticas diferentes. `queryChange` sirve para estado/URL; **solo dataRequest dispara transporte**. El primer render remoto emite una intención inicial en cliente, no durante SSR; hidratar datos ya provistos evita repetir esa petición mediante estado explícito de carga completada.

Revision cambia por query efectiva; requestId por intención remota. Un eco idéntico no incrementa revision. Debounce actúa sobre el draft de filtro antes de proponer; no retrasa selección ni estado a11y. Cambio de filtro/sort vuelve a página1 salvo política explícita. Reset de query no borra selección/layout por defecto: resetAll es una operación deliberada de consumidor. Retry conserva query/revision y genera nuevo requestId. Respuestas tardías se rechazan en el adaptador de datos mediante ID/revision, nunca por orden de llegada supuesto.

### Configuración cohesiva

`sortOptions` define single/multiple, removable, orden inicial de ciclo y comparator policy; el estado siempre es array. `filterOptions` define enabled, display row/menu/both, labels visible/sr-only y scheduler. Se retira advancedFilterMode tras mapear cada caso. `paginationOptions` define enabled, sizes, placement, report y jump; page/pageSize viven solo en query. `selectionOptions` define mode, interaction (row/checkbox/radio), meta/range y selectAllScope page/filtered/loaded. En remoto, filtered-all requiere selección de dominio respaldada por el backend; no simularla con filas cargadas.

`virtualizationOptions` sigue separada por coste y semántica; no prometer tamaños variables ni 2D. `rowKey` debe ser estable y único; `rowTrackBy` no puede contradecirlo cuando se conservan drafts o foco. Duplicados se detectan en desarrollo y la política de error se documenta. Columnas y rows readonly; el componente propone reorder/edits sin mutar datos entrantes.

### TableCore, auxiliares y dependencias

TableCore sigue siendo renderer semántico; no importa Router, Forms, export, CDK ni el facade completo por acceder a un template. Header/Cell/Row, checkbox, template directives y managed-row coordinator conservan su función. El contrato interno necesario para TreeTable se comparte por una frontera estrecha, no por selectores CSS privados. Los auxiliares públicos se validan en consumidor compilado; no ampliar la allowlist de métodos por comodidad interna.

URL y storage son adapters opt-in de query/layout/selection. Suscripciones y serialización viven fuera del renderer; inicialización no debe inyectar Router en uso sin URL. Mantener import de feature opcional y errores accionables para export; medir imports reales, no solo tamaño total del tarball. Referencias: [neu-table-core.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table-core/neu-table-core.component.ts:1), [H5C1_SAFE_PUBLIC_FACADE_AUDIT.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/docs/H5C1_SAFE_PUBLIC_FACADE_AUDIT.md:242).

### Rendering, editing y templates

Mantener header/body/footer/caption/loading/empty/expansion/group/filter/editor y frozen rows. Contextos tipados con T y columna; preserve row/cell coordinator para teclado al usar custom body. Documentar qué pierde un template completamente libre y suministrar directivas semánticas para recuperar foco, índices, aria-selected y sort. Edición confirma una propuesta validada; cancel restituye draft, nunca revive datos obsoletos. Save async recibe estado pending/error del consumidor y bloquea commits duplicados sin congelar Escape accesible.

Loading inicial, refresh con datos previos, error con retry y vacío son estados distintos. No desmontar el control enfocado por ocultar loading; announcements discretos para actualización y error, sin leer cada fila. El renderer usa HTML table nativo para lectura; la interacción añade semántica adecuada con pruebas reales, sin imponer role grid a toda tabla estática.

### Performance y accesibilidad

Medir datasets1k/10k/100k con escenarios equivalentes: filtrado local, sort multi, selección sin rerender masivo, ventana virtual, resize y export opcional. Publicar DOM count, commits de filas, tiempos p50/p95 y memoria tras 50 ciclos mount/unmount/overlay. Presupuesto relativo inicial: ninguna regresión >5% gzip/brotli por consumer sin revisión justificada; cero retención nueva de Router/Forms/export en Core; ventana DOM proporcional a viewport+overscan, no N. Los presupuestos existentes del repo prevalecen si son más estrictos.

Keyboard: Tab entra/sale, flechas según modo, Space selección, Enter edición/expansión, Escape cancel, Home/End documentados. aria-sort refleja orden aplicado y prioridad multi con anuncio; aria-selected y encabezados corresponden a fila/celda; report de página y total no inventa datos desconocidos. Probar row/columnspan, frozen columnas, RTL, zoom200/400%, 320px, high contrast/reduced motion y lectores de pantalla. Ninguna mejora de bundle justifica perder foco o etiquetas.

## BREAKING CHANGES Y MIGRATION IMPACT

| Origen | Destino | Trabajo obligatorio |
| --- | --- | --- |
| sort + sortEntries + multiSort | query.sort[] + sortOptions.mode | Convertir single a array0/1; detectar conflicto legado y preferencia actual. |
| NeuTableServerState/serverStateChange | query + metadata + dataRequest | Converter de sortKey/sortDir y columnFilters; no sustitución de nombre. |
| serverSide | dataMode | Separar proveedor de datos de política del renderer. |
| selectable/selection/selectionChange | selectionOptions + selectedKeys/selectedKeysChange | Extraer keys; evento de detalle entrega rows cargadas. |
| virtualScrollEvent/lazyRequest | rangeChange/dataRequest | half-open, IDs, transporte único; sin Event obligatorio. |
| filterDisplay/advancedFilterMode y flags | filterOptions | Matriz de combinaciones y migración de defaults. |
| urlState + options.enabled | adapter explícito | Configurar Router solo donde se persiste; snapshots version2. |
| métodos que mutan slices | operación sobre owner o método inequívoco | Actualizar consumer y harness; no crear aliases perpetuos. |

Implementar y validar el target completo y retirar la API antigua en la misma entrega v2; no mantener convivencia de fachadas dentro de la librería. La migración tiene ejemplos de conversión puntual en el consumidor para query/selección/storage, mapa de cada input legado y fixtures de callbacks. No mantener indefinidamente ambos propietarios dentro del core para facilitar transición.

## SUPERIORITY OPPORTUNITIES Y GATES

Ventaja ya acotada: export integrado adicional; oportunidad: tipado de principio a fin, menos canales de transporte, bundle Core y SSR predecible. No certificadas aún. Gate conjunto N2-011…014: casos de la matriz ejecutables, type tests sin any accidental, controlled rejection/echo, stale responses, snapshots migrados, Router ausente en Core, DOM acotado, templates accesibles y comparación Prime equivalente. Datos de baseline y protocolo final en [N2-IMPLEMENTATION-ROADMAP.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-IMPLEMENTATION-ROADMAP.md:1).
