# Neural UI 2 — Matriz PrimeNG 22

Auditoría estática del working tree `v2` sobre `a6a9606613fba61e7c337c3f57d1aecbb11702e8`, con Fases 1, 2 y 3A acumuladas. Consulta de fuentes: 12 de septiembre de 2026. Prime de referencia: **22.1.1**. Las propuestas describen arquitectura futura; no están implementadas. PARITY significa cobertura del caso indicado por fuente/contrato y tests existentes, no una certificación comparativa de ejecución. Los gates históricos se atribuyen a su fase; no se volvieron a ejecutar en esta auditoría.


## Método y alcance

La unidad comparada es el caso de uso de cada fila. Varias filas pueden originar una misma tarea; no sumar tareas y features. REDESIGN tiene precedencia si el caso existe pero el contrato necesita cambiar. SUPERIOR se limita a la dimensión indicada. PARITY de fuente no sustituye ejecución: comprobar combinaciones y navegadores es N2-033. Una ausencia se deduce de la superficie pública inspeccionada; no demuestra que una composición de aplicación sea imposible.

Fuente primaria de API Prime: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`. Se revisaron las declaraciones oficiales publicadas y la documentación actual por familia. Las columnas Prime resumen API, no prometen calidad o comportamiento no probado. Para utilidades/theming se usa documentación conceptual. Legacy y sustituto v22 se contabilizan como una capacidad, no como productos distintos.

Charts: **OUT OF SCOPE / SEPARATE PRODUCT**, futura Neural Charts sin implementación ni fecha comprometida. PT arbitrario, Unstyled y funcionalidades PRO ajenas al core quedan fuera del scope adoptado; véase el registro de decisiones histórico del Executive.


| Clasificación | Features |
| --- | --- |
| GAP | 17 |
| OUT OF SCOPE | 8 |
| PARITY | 171 |
| REDESIGN | 54 |
| SUPERIOR | 2 |


## TABLE · DATA

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | Datos locales | value tipado RowData[] | data readonly y columnas genéricas | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-002 | Página remota | lazy/totalRecords/first | serverSide/query/totalItems; transporte del consumidor | REDESIGN | CHANGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-003 | Loading | loading/showLoader y templates | loading, skeleton y loading-body | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-004 | Vacío | emptymessage template | neuTableEmpty tipado | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-005 | Error y retry | Contenido/template; I/O externo | Contenido externo; error de feature opcional distinto de error de datos | REDESIGN | CHANGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · STATE

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-006 | Controlado/rechazo | Model y inputs de slices | Controller controlado con propuesta; evitar model automático | REDESIGN | CHANGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-007 | Query agregada | Eventos lazy/filter/sort/page | Query serializable tipada | REDESIGN | CHANGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-008 | Server state legacy | Metadatos lazy; sin contrato Neural | ServerState es proyección distinta y antigua | REDESIGN | REMOVE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-009 | Reset | clear/reset; estado | resetState, clearState, clearColumnFilters | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-010 | Persistencia | session/local y stateKey | snapshot/restore + URL; versionar nuevo schema | REDESIGN | CHANGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · SORT

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-011 | Single | sortField/sortOrder | sort/entries/comparador | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-012 | Multi | multiSortMeta | sortEntries/multiSort | REDESIGN | MERGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-013 | Custom | sortFunction/customSort | sortComparator y sortAccessor por columna | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-014 | Remoto | onLazyLoad contiene orden | queryChange con orden y mapping | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-015 | Removable | custom/removable demo | removableSort; vacío explícito | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-016 | Inicial | presort single/multiple | query o sort controlado; precedencia actual | REDESIGN | CHANGE | P1 / N2-011 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · FILTER

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-017 | Columna | filters/ColumnFilter | filterConfig por columna | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-018 | Global | globalFilterFields | accessors y backend fields tipados | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-019 | Match modes | text/number/date/select/boolean | motor tipado de las mismas familias | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-020 | Múltiples reglas | AND/OR y constraints | constraints tipadas AND/OR | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-021 | Custom registry | FilterService/custom | NeuTableFilterRegistry con cleanup | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-022 | Menu/row | ColumnFilter display | filterDisplay + advancedFilterMode; dos ejes solapados | REDESIGN | MERGE | P1 / N2-012 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-023 | Programático | filter()/filterGlobal() | setColumnFilter/clear y query | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-024 | Commit/debounce | filterDelay/filterOn/apply | scheduler delay/on + draft menu | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-025 | Remoto | lazy filter metadata | serializable/local-only/requires-consumer explícito | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · PAGINATION

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-026 | Client | paginator rows first | page 1-based/pageSize | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-027 | Server | totalRecords + lazy | totalItems + página del backend | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-028 | Controlled | first/rows models | query controla page/pageSize | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-029 | Sizes/report/jump | options/report/jump templates | pageSizeOptions/paginatorOptions | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-030 | Placement | top/bottom/both | paginatorPosition | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · SELECTION

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-031 | Single/multiple | selectionMode + selection | selectable boolean\|string, output siempre array | REDESIGN | CHANGE | P1 / N2-012 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-032 | Checkbox/radio | componentes fila y header | checkbox interno/radio y modo single | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-033 | Select all | page-only o conjunto | scope page/filtered; remoto cargado | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-034 | Meta/range/keyboard | modificadores y rangos | controller teclado y selección | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-035 | rowSelectable | predicado | predicado y skip de no seleccionables | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-036 | Remoto no cargado | selection/datakey | keys internos pero input por objetos | REDESIGN | CHANGE | P1 / N2-012 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-037 | ARIA/foco | aria-selected y controles etiquetados | semántica nativa y filas administradas | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · EDITING

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-038 | Cell | editable column/editor template | editMode cell + commit/cancel | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-039 | Row | editable row/save/cancel | editingRowKeys/row draft y save/cancel | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-040 | Validation | Form controls en editor | cellEditValidator/rowEditValidator y error | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-041 | Custom editor | template input/output | neuTableCellEditor; templates de control | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · EXPANSION

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-042 | Controlled/template | expandedRowKeys/expandedrow | expandedRowKeys/neuTableExpand | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · GROUPING

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-043 | Subheader | groupRowsBy/subheader | groupBy/header/footer de grupo | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-044 | Rowspan | rowGroupMode rowspan | rowGroupMode y render entries | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-045 | Colapso y agregado | expand groups/footer propio | expandedGroupKeys + template; agregado del consumidor | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · COLUMNS

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-046 | Dinámicas | columns/proyección | columns y contextos tipados | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-047 | Reorder | reorderableColumns | reorder/layout controllers | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-048 | Resize fit/expand | columnResizeMode | fit/expand y evento layout | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-049 | Frozen/sticky | frozen/alignment | columna frozen y sticky offsets | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-050 | Visibility/width | chooser compuesto y widths | columnChooser y layout | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · ROWS

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-051 | Reorder | drag row event | propuesta inmutable rowReorder | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-052 | Styling/class | templates/class | rowClass y stripedRows | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-053 | Context menu | separate context selection | contextMenuSelection distinta de selección | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-054 | Frozen | frozenValue | frozenData | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · VIRTUALIZATION

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-055 | Fixed viewport | Scroller itemSize | itemSize/visibleItems; rango fijo | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-056 | Lazy sparse | virtual + lazy | datos dispersos + placeholders y retention | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-057 | Overscan/ranges | tolerated items/scroll-index | overscan/rango lógico-visible | REDESIGN | RENAME | P1 / N2-013 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-058 | Altura variable real | No probada por autoSize; itemSize fijo en docs | No algoritmo de medida individual; autoSize viewport | OUT OF SCOPE | DEFER | P3 / N2-036 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-059 | Lifecycle/memory | Scroller listeners/lifecycle | viewport disconnect/retention cleanup | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · TEMPLATES

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-060 | Header/body/footer | templates de sección | header/footer group y body/section | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-061 | Caption/loading/empty | templates dedicados | caption/loadingBody/empty/lazyPlaceholder | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-062 | Group/filter/editor | templates personalizados | directivas tipadas y callbacks acotados | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · RESPONSIVE

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-063 | Overflow contenido | scroll responsive; stack custom | scroll contenido, logical CSS, estándar 320px | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · EXPORT

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-064 | CSV | exportCSV configurable | CSV scope/value/escape de fórmulas | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-065 | JSON/XLSX propios | No exportadores equivalentes públicos en Table | exportJson/exportXlsx en entrypoint | SUPERIOR | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · ACCESSIBILITY

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-066 | Rows/columns/sort | roles y aria-sort | native table, aria-sort, coordenadas solo si veraces | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · PERFORMANCE

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-067 | Granularidad de paquete | entrypoint Table y dependencias propias | TableCore separado; full Table se mide aparte | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-068 | Gran dataset/identity | rowTrackBy/dataKey | rowKey semántico y rowTrackBy render | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TABLE · API

Fuentes oficiales de familia: [PrimeNG table](https://primeng.dev/table). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-069 | Dominio genérico | Table<RowData> y rowSelect<RowData>; selection:any | NeuTable<T> pero keys unknown y compatibilidad | REDESIGN | CHANGE | P1 / N2-012 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-070 | Auxiliares | directivas y templates de Table | managed row, feature components internos; no API extra | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |


## TREETABLE

Fuentes oficiales de familia: [PrimeNG treetable](https://primeng.dev/treetable). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-treetable.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-071 | Jerarquía | TreeNode y siblings | walker iterativo + proyección jerárquica | PARITY | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-072 | Datos de dominio | TreeNode<any>.data | genéricos en tipos pero componente borra T; colisiones al flatten | REDESIGN | CHANGE | P1 / N2-015 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-073 | Expansión controlada | collapsedKeys/nodos | expandedKeys separado de row expansion | PARITY | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-074 | Single/multiple | selection/selectionMode | selección por nodos, claves internas | REDESIGN | CHANGE | P1 / N2-015 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-075 | Checkbox propagation | selección padre/descendiente y mixed | existe, pero frontera disabled inconsistente | REDESIGN | CHANGE | P1 / N2-017 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-076 | Disabled/selectable | nodo no elegible | propagación y agregación usan recorridos distintos | REDESIGN | CHANGE | P1 / N2-017 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-077 | Filtros lenient/strict | modos jerárquicos | projectNeuTreeTable conserva ancestros | PARITY | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-078 | Global/column | filters y global fields | motor paralelo al de Table | REDESIGN | MERGE | P1 / N2-017 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-079 | Custom filters | custom sort/filter metadata | custom predicate sin registro compartido; fallback true | REDESIGN | CHANGE | P1 / N2-017 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-080 | Sort single/multi | sibling sort y multi metadata | stableSort por nivel; sort y query precedencias distintas | REDESIGN | CHANGE | P1 / N2-016 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-081 | Sort inicial y reset programático | sortField/order/multiSortMeta; no removableSort público propio | query permite inicializar y retirar orden; revisar consistencia con Table | REDESIGN | CHANGE | P1 / N2-016 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-082 | Lazy children | onNodeExpand + leaf/loading | lazyRequest reason node-expand, sin requestId/dedupe | REDESIGN | CHANGE | P1 / N2-016 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-083 | Query remota | lazy y totalRecords | queryChange + lazyRequest; inner serverSide forzado | REDESIGN | CHANGE | P1 / N2-016 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-084 | Loading/empty | loading/empty template | estado y templates disponibles | PARITY | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-085 | Error/retry nodo | carga externa y nodo loading | no contrato error/retry por nodo; app reemplaza nodo | REDESIGN | CHANGE | P1 / N2-016 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-086 | Root pagination | paginator de raíces | pageRoots + totalItems de raíces | PARITY | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-087 | Paginator opciones | placement/report/page sizes | solo subconjunto forwarded; composición externa posible | REDESIGN | CHANGE | P2 / N2-016 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-088 | Virtual local | Scroller fijo | Table virtual sobre flatRows | REDESIGN | CHANGE | P1 / N2-016 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-089 | Virtual remoto | lazy Scroller | range first/last pierde visible y requestId; total ambiguo | REDESIGN | CHANGE | P1 / N2-016 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-090 | Columns dynamic/resize/reorder | props y directivas | Table capabilities forwarded | PARITY | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-091 | Frozen columns | frozenColumns y scrolling | column frozen de Table | PARITY | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-092 | Cell editing | TTEditableColumn/CellEditor | cell edit y templates de Table | PARITY | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-093 | Row editing | composición manual de aplicación | rowEditValidator/draft/save/cancel propios | SUPERIOR | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-094 | Templates node/body | templates con rowNode | node/body/bodySection tipado parcialmente | REDESIGN | CHANGE | P1 / N2-015 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-095 | Caption/footer/empty | templates dedicados | forwarding de directivas Table | PARITY | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-096 | Context menu | context selection/event | wrapper actualizado H9-B1 | PARITY | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-097 | Persistence | app state; no stateKey público propio actual | store con query/expanded/selection; URL options no garantiza wiring | REDESIGN | CHANGE | P1 / N2-016 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-098 | Treegrid SSR | treegrid documented | role añadido por afterRenderEffect en DOM cliente | REDESIGN | CHANGE | P1 / N2-018 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-099 | Keyboard/focus | arrows/Home/End/select | keydown + focus por DOM/flat rows | REDESIGN | CHANGE | P1 / N2-018 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-100 | ARIA logical indices | treegrid level/expanded/selected | parches DOM; unidad roots versus visible rows a precisar | REDESIGN | CHANGE | P1 / N2-018 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-101 | DAG/ciclos/depth | no comparación de complejidad probada | walker shared guard y memo de expansión | PARITY | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-102 | Bundle | entrypoint TreeTable | retiene full Table; benchmark histórico desfavorable | REDESIGN | CHANGE | P1 / N2-014 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-103 | Export | no export API propia equivalente publicada | delegación CSV/JSON/XLSX con datos de árbol | PARITY | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-104 | Drag árbol/filas | sin árbol DnD equivalente probado en TreeTable | no se promete adaptar Tree DnD aquí | OUT OF SCOPE | DEFER | P3 / N2-036 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| F-105 | Responsive | scroll horizontal/vertical | overflow contenido + columnas explícitas | PARITY | KEEP | — / — | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |


## FORMS

Fuentes oficiales de familia: [PrimeNG inputtext](https://primeng.dev/inputtext), [PrimeNG textarea](https://primeng.dev/textarea), [PrimeNG inputpassword](https://primeng.dev/inputpassword), [PrimeNG inputmask](https://primeng.dev/inputmask), [PrimeNG inputotp](https://primeng.dev/inputotp), [PrimeNG checkbox](https://primeng.dev/checkbox), [PrimeNG toggleswitch](https://primeng.dev/toggleswitch), [PrimeNG radiobutton](https://primeng.dev/radiobutton), [PrimeNG inputnumber](https://primeng.dev/inputnumber), [PrimeNG knob](https://primeng.dev/knob), [PrimeNG datepicker](https://primeng.dev/datepicker), [PrimeNG rating](https://primeng.dev/rating), [PrimeNG slider](https://primeng.dev/slider), [PrimeNG floatlabel](https://primeng.dev/floatlabel), [PrimeNG iftalabel](https://primeng.dev/iftalabel), [PrimeNG iconfield](https://primeng.dev/iconfield), [PrimeNG inputgroup](https://primeng.dev/inputgroup), [PrimeNG label](https://primeng.dev/label). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-inputtext.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-106 | Texto/estados | input nativo, tamaño, invalid, disabled | Input nativo con label/hint/error e IME | PARITY | KEEP | — / — | [neu-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input/neu-input.component.ts:1) |
| F-107 | Signal/Reactive/Template | integración Angular; CVA no equivale a contrato Signal nativo | CVA actual interoperable; contrato nativo y certificación Neural pendientes | REDESIGN | CHANGE | P1 / N2-003 | [neu-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input/neu-input.component.ts:1) |
| F-108 | Multilínea y autoresize | textarea/autoResize | textarea, autoResize, resizable e IME | PARITY | KEEP | — / — | [neu-textarea.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/textarea/neu-textarea.component.ts:1) |
| F-109 | Metadatos de validación | invalid y atributos nativos | constraint names/estado no homogéneos | REDESIGN | CHANGE | P1 / N2-003 | [neu-textarea.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/textarea/neu-textarea.component.ts:1) |
| F-110 | Ocultar contraseña | directiva y mask | Password con toggle/strength | PARITY | KEEP | — / — | [neu-password.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/password/neu-password.component.ts:1) |
| F-111 | Control de valor | form integration | CVA y señal local sin model público | REDESIGN | CHANGE | P1 / N2-003 | [neu-password.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/password/neu-password.component.ts:1) |
| F-112 | Máscara básica | slots y máscara | 9/A/*; string masked | PARITY | KEEP | — / — | [neu-input-mask.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-mask/neu-input-mask.component.ts:1) |
| F-113 | Readonly y metadata accesible | readonly y atributos accesibles de input | hint sin describedBy; sin readonly público | GAP | CHANGE | P1 / N2-003 | [neu-input-mask.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-mask/neu-input-mask.component.ts:1) |
| F-114 | Caret/máscaras avanzadas y raw | slotChar/autoClear/keepCharPositions; directiva onUnmaskedChange y unmask legacy | sin política pública equivalente | GAP | ADD | P2 / N2-027 | [neu-input-mask.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-mask/neu-input-mask.component.ts:1) |
| F-115 | Código segmentado | length/integerOnly/mask | length/numeric-alphanumeric/completed | PARITY | KEEP | — / — | [neu-input-otp.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-otp/neu-input-otp.component.ts:1) |
| F-116 | Blur/readonly/nombre | readonly, Forms y atributos | touched en focus y nombres españoles fijos | REDESIGN | CHANGE | P1 / N2-003 | [neu-input-otp.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-otp/neu-input-otp.component.ts:1) |
| F-117 | Boolean e indeterminate | binary/indeterminate | checked e indeterminate separados | PARITY | KEEP | — / — | [neu-checkbox.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/checkbox/neu-checkbox.component.ts:1) |
| F-118 | Valores alternativos true/false | trueValue/falseValue y colección | boolean como contrato propio; mapping en app | OUT OF SCOPE | OUT OF SCOPE | — / — | [neu-checkbox.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/checkbox/neu-checkbox.component.ts:1) |
| F-119 | Toggle booleano | control boolean con readonly | CVA boolean; checked no binding público | REDESIGN | CHANGE | P1 / N2-004 | [neu-switch.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/switch/neu-switch.component.ts:1) |
| F-120 | Grupo/radio teclado | radio con valor por opción | RadioGroup y Radio coordinados | PARITY | KEEP | — / — | [neu-radio.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/radio/neu-radio.component.ts:1) |
| F-121 | Tipo de dominio | valor flexible de Forms | RadioGroup unknown; tipar V o null | REDESIGN | CHANGE | P1 / N2-004 | [neu-radio.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/radio/neu-radio.component.ts:1) |
| F-122 | Spinbutton/min/max/step | botones, límites | native number y tres layouts | PARITY | KEEP | — / — | [neu-number-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/number-input/neu-number-input.component.ts:1) |
| F-123 | Locale/moneda/precision | format locale currency fraction digits | sin formatter/parser regional de moneda | GAP | ADD | P1 / N2-005 | [neu-number-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/number-input/neu-number-input.component.ts:1) |
| F-124 | Borrado nullable | allowEmpty | nullable input y valueChange no nullable | REDESIGN | CHANGE | P1 / N2-005 | [neu-number-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/number-input/neu-number-input.component.ts:1) |
| F-125 | Valor radial | knob teclado/límites | drag/teclado, clamp y ARIA | PARITY | KEEP | — / — | [neu-knob.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/knob/neu-knob.component.ts:1) |
| F-126 | Readonly/estado directo | readonly/disabled | solo disabled CVA; sin readonly público | GAP | ADD | P1 / N2-005 | [neu-knob.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/knob/neu-knob.component.ts:1) |
| F-127 | Fecha/hora/rango/múltiple | selectionMode/showTime/timeOnly | type y multiple; unión de valores | PARITY | KEEP | — / — | [neu-date-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/date-input/neu-date-input.component.ts:1) |
| F-128 | Valor consistente y timezone | Date/selección según configuración | rango Date, single string, CSV legacy | REDESIGN | CHANGE | P1 / N2-006 | [neu-date-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/date-input/neu-date-input.component.ts:1) |
| F-129 | Límites/fechas deshabilitadas | minDate/maxDate/disabledDates | min/max/disabledDates/presets | PARITY | KEEP | — / — | [neu-date-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/date-input/neu-date-input.component.ts:1) |
| F-130 | Período/inline/semanas | month/year view, inline, showWeek | navegación mes/año no es valor período; inline ausente | GAP | ADD | P2 / N2-025 | [neu-date-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/date-input/neu-date-input.component.ts:1) |
| F-131 | Rating básico | stars/readonly/disabled | stars/value/teclado | PARITY | KEEP | — / — | [neu-rating.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/rating/neu-rating.component.ts:1) |
| F-132 | Forms integrado | CVA/base editable y demos | sin contrato de Forms propio | GAP | ADD | P1 / N2-010 | [neu-rating.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/rating/neu-rating.component.ts:1) |
| F-133 | Fracciones y orientación | allowHalf/orientation | solo enteros horizontal | GAP | ADD | P2 / N2-026 | [neu-rating.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/rating/neu-rating.component.ts:1) |
| F-134 | Valor continuo discreto | min/max/step | native range/min/max/step | PARITY | KEEP | — / — | [neu-slider.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/slider/neu-slider.component.ts:1) |
| F-135 | Forms integrado | base editable | input/output sin Forms | GAP | ADD | P1 / N2-010 | [neu-slider.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/slider/neu-slider.component.ts:1) |
| F-136 | Intervalo de dos límites | range y separación mínima | un solo thumb | GAP | ADD | P2 / N2-026 | [neu-slider.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/slider/neu-slider.component.ts:1) |
| F-137 | Vertical | orientation | horizontal nativo | GAP | DEFER | P2 / N2-026 | [neu-slider.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/slider/neu-slider.component.ts:1) |
| F-138 | Etiqueta flotante | wrapper FloatLabel | floatingLabel en controles | PARITY | KEEP | — / — | [neu-form-field.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/form-field/neu-form-field.component.ts:1) |
| F-139 | Etiqueta interna fija | wrapper IftaLabel | label/floatingLabel no documentan equivalencia exacta de layout | REDESIGN | CHANGE | P2 / N2-023 | [neu-form-field.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/form-field/neu-form-field.component.ts:1) |
| F-140 | Iconos de campo | IconField/InputIcon | startIcon/endIcon y proyección; icon legacy duplica | REDESIGN | MERGE | P2 / N2-023 | [neu-form-field.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/form-field/neu-form-field.component.ts:1) |
| F-141 | Grupo/prefix/suffix | InputGroup/addons | NeuInputGroup y form-field slots | PARITY | KEEP | — / — | [neu-form-field.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/form-field/neu-form-field.component.ts:1) |
| F-142 | Etiqueta/descripción/error | Label/HTML | forId/mergeDescribedBy; conexión explícita | PARITY | KEEP | — / — | [neu-form-field.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/form-field/neu-form-field.component.ts:1) |


## SELECTORS

Fuentes oficiales de familia: [PrimeNG select](https://primeng.dev/select), [PrimeNG multiselect](https://primeng.dev/multiselect), [PrimeNG autocomplete](https://primeng.dev/autocomplete), [PrimeNG cascadeselect](https://primeng.dev/cascadeselect), [PrimeNG listbox](https://primeng.dev/listbox), [PrimeNG inputtags](https://primeng.dev/inputtags), [PrimeNG selectbutton](https://primeng.dev/selectbutton), [PrimeNG togglebutton](https://primeng.dev/togglebutton), [PrimeNG treeselect](https://primeng.dev/treeselect). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-select.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-143 | Single/multiple | Select con multiple | ambos modos, selección por V | PARITY | KEEP | — / — | [neu-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/select/neu-select.component.ts:1) |
| F-144 | Filtro/lazy/virtual/templates | opciones locales/remotas y templates | 56 inputs, typed slots y option-api | PARITY | KEEP | — / — | [neu-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/select/neu-select.component.ts:1) |
| F-145 | Editable y tipo | editable permite texto libre | string se fuerza a V; tipo boolean dinámico defectuoso | REDESIGN | CHANGE | P1 / N2-007 | [neu-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/select/neu-select.component.ts:1) |
| F-146 | Chips/toggle-all/limits | legacy v22 disponible, deprecated | chips, selectionLimit, maxSelectedLabels, controlled open | PARITY | KEEP | — / — | [neu-multiselect.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/multiselect/neu-multiselect.component.ts:1) |
| F-147 | Owner de selección | Select multiple unifica caso Prime | Multiselect duplica selección; portar UX rica al Select target y retirar fachada | REDESIGN | MERGE | P1 / N2-007 | [neu-multiselect.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/multiselect/neu-multiselect.component.ts:1) |
| F-148 | Búsqueda sugerida/IME | completeMethod/suggestions | requestId, debounce, completion e IME | PARITY | KEEP | — / — | [neu-autocomplete.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/autocomplete/neu-autocomplete.component.ts:1) |
| F-149 | Texto vs opción | forceSelection/optionValue | V o string; select+optionSelected solapados | REDESIGN | MERGE | P1 / N2-007 | [neu-autocomplete.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/autocomplete/neu-autocomplete.component.ts:1) |
| F-150 | Navegación jerárquica | grupos, opción final, overlay | breadcrumb/back/typed path y CVA | PARITY | KEEP | — / — | [neu-cascade-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/cascade-select/neu-cascade-select.component.ts:1) |
| F-151 | Metadata/formato estado | BaseInput y accesibilidad | superficie directa menor; value signal no input | REDESIGN | CHANGE | P1 / N2-007 | [neu-cascade-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/cascade-select/neu-cascade-select.component.ts:1) |
| F-152 | Single/multiple/filter | lista con filter y selección | opciones/grupos/filtro/múltiple | PARITY | KEEP | — / — | [neu-listbox.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/listbox/neu-listbox.component.ts:1) |
| F-153 | Lazy/virtual/drag/keyboard | Scroller y drop | lazyRequest/rango, drop y teclado | PARITY | KEEP | — / — | [neu-listbox.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/listbox/neu-listbox.component.ts:1) |
| F-154 | Tipo valor/evento | valor Forms y evento de cambio | value V/V[]; selectionChange T[] | REDESIGN | CHANGE | P1 / N2-007 | [neu-listbox.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/listbox/neu-listbox.component.ts:1) |
| F-155 | Tags/completions | tags, suggestions, paste/blur | typeahead, IME, templates y eventos | PARITY | KEEP | — / — | [neu-input-tags.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-tags/neu-input-tags.component.ts:1) |
| F-156 | Edición simple texto | InputTags string | Tags duplica subset; separadores múltiples a portar | REDESIGN | MERGE | P1 / N2-008 | [neu-tags.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tags/neu-tags.component.ts:1) |
| F-157 | Opciones exclusivas/múltiples | SelectButton multiple | ToggleButtonGroup single/multiple | PARITY | KEEP | — / — | [neu-toggle-button-group.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/toggle-button-group/neu-toggle-button-group.component.ts:1) |
| F-158 | Alternativa toggle simple | ToggleButton boolean | Chip selected o grupo de opción; no un field boolean directo idéntico | PARITY | KEEP | — / — | [neu-toggle-button-group.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/toggle-button-group/neu-toggle-button-group.component.ts:1) |
| F-159 | Evento/contrato de valor | onChange y Forms | neuChange y unión sin discriminante estable | REDESIGN | RENAME | P1 / N2-007 | [neu-toggle-button-group.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/toggle-button-group/neu-toggle-button-group.component.ts:1) |
| F-160 | Árbol en overlay | TreeSelect simple/multiple | TreeSelect multiple/búsqueda/lazy node intent | PARITY | KEEP | — / — | [neu-tree-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-select/neu-tree-select.component.ts:1) |
| F-161 | Checkbox jerárquico | propagateSelectionUp/Down | multiple independiente sin mixed/propagación | GAP | ADD | P1 / N2-019 | [neu-tree-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-select/neu-tree-select.component.ts:1) |
| F-162 | Virtualización | virtualScroll/itemSize | sin viewport virtual en TreeSelect | GAP | ADD | P1 / N2-019 | [neu-tree-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-select/neu-tree-select.component.ts:1) |


## BUTTONS/ACTIONS

Fuentes oficiales de familia: [PrimeNG button](https://primeng.dev/button), [PrimeNG splitbutton](https://primeng.dev/splitbutton), [PrimeNG speeddial](https://primeng.dev/speeddial). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-button.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-163 | Acción/estados/tamaño | loading/disabled/variant | button nativo, loading, iconOnly y variantes | PARITY | KEEP | — / — | [neu-button.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/button/neu-button.component.ts:1) |
| F-164 | Agrupar acciones | composición de botones | ButtonGroup orientation/aria | PARITY | KEEP | — / — | [neu-button-group.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/button-group/neu-button-group.component.ts:1) |
| F-165 | Acción principal y menú | Button+Menu | primaryClick/actionClick y lifecycle | PARITY | KEEP | — / — | [neu-split-button.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/split-button/neu-split-button.component.ts:1) |
| F-166 | Radial/linear/teclado | directions/type/model | 8 direcciones, typed trigger/item y open controlado | PARITY | KEEP | — / — | [neu-speed-dial.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/speed-dial/neu-speed-dial.component.ts:1) |


## DATA

Fuentes oficiales de familia: [PrimeNG dataview](https://primeng.dev/dataview), [PrimeNG paginator](https://primeng.dev/paginator), [PrimeNG tree](https://primeng.dev/tree), [PrimeNG picklist](https://primeng.dev/picklist), [PrimeNG orderlist](https://primeng.dev/orderlist), [PrimeNG organizationchart](https://primeng.dev/organizationchart), [PrimeNG timeline](https://primeng.dev/timeline), [PrimeNG virtualscroller](https://primeng.dev/virtualscroller). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-dataview.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-167 | Vista/filter/sort/página local | layout/filter/sort/paginator | items/mode/search/sort/pagination | PARITY | KEEP | — / — | [neu-data-view.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/data-view/neu-data-view.component.ts:1) |
| F-168 | Página remota | lazy/totalRecords | total/currentPage; sin doble slicing H9-B2 | PARITY | KEEP | — / — | [neu-data-view.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/data-view/neu-data-view.component.ts:1) |
| F-169 | Página y tamaño | first/rows/rowsPerPageOptions | page/pageSize/total y native select | PARITY | KEEP | — / — | [neu-pagination.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/pagination/neu-pagination.component.ts:1) |
| F-170 | Report/jump/placement avanzado | controles/templates de paginator | Table tiene opciones; standalone subset sin report/jump integrado | PARITY | KEEP | — / — | [neu-pagination.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/pagination/neu-pagination.component.ts:1) |
| F-171 | Control/checkbox/disabled | selection, collapsedKeys, propagation | selection/expandedKeys, mixed y política disabled | PARITY | KEEP | — / — | [neu-tree.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree/neu-tree.component.ts:1) |
| F-172 | Lazy/virtual | lazy y virtual Scroller | requestId/retry, índice y viewport | PARITY | KEEP | — / — | [neu-tree.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree/neu-tree.component.ts:1) |
| F-173 | Drag/drop/contexto | DnD y context menu | immutable nodeDrop/contextRequest y ciclos acotados | PARITY | KEEP | — / — | [neu-tree.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree/neu-tree.component.ts:1) |
| F-174 | Transfer y move-all | mover elegido/todos | filtered eligible move-all y control de duplicados | PARITY | KEEP | — / — | [neu-pick-list.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/pick-list/neu-pick-list.component.ts:1) |
| F-175 | Filtro/selección/drag | filtros/selección/DnD | keys controladas, range selection y typed proposal | PARITY | KEEP | — / — | [neu-pick-list.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/pick-list/neu-pick-list.component.ts:1) |
| F-176 | Ordenación listas | OrderList move up/top/down/bottom | NeuOrderList y drag/keyboard | PARITY | KEEP | — / — | [neu-pick-list.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/pick-list/neu-pick-list.component.ts:1) |
| F-177 | Jerarquía visual/selección | nodos/keys/collapse | forest, typed nodes, controlled keys y templates | PARITY | KEEP | — / — | [neu-organization-chart.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/organization-chart/neu-organization-chart.component.ts:1) |
| F-178 | Eventos lineales | Timeline align/layout | Timeline align/reverse; TimelineGrid para varios ejes | PARITY | KEEP | — / — | [neu-timeline.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/timeline/neu-timeline.component.ts:1) |
| F-179 | Lista virtual vertical | itemSize/trackBy | itemSize/visibleRows/trackBy/rangeChange | PARITY | KEEP | — / — | [neu-virtual-list.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/virtual-list/neu-virtual-list.component.ts:1) |
| F-180 | Horizontal/2D | orientation both/horizontal | vertical fijo; scope de grid aparte | GAP | DEFER | P3 / N2-036 | [neu-virtual-list.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/virtual-list/neu-virtual-list.component.ts:1) |


## OVERLAYS

Fuentes oficiales de familia: [PrimeNG dialog](https://primeng.dev/dialog), [PrimeNG dynamicdialog](https://primeng.dev/dynamicdialog), [PrimeNG drawer](https://primeng.dev/drawer), [PrimeNG popover](https://primeng.dev/popover), [PrimeNG tooltip](https://primeng.dev/tooltip), [PrimeNG confirmdialog](https://primeng.dev/confirmdialog), [PrimeNG confirmpopup](https://primeng.dev/confirmpopup), [PrimeNG contextmenu](https://primeng.dev/contextmenu). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-dialog.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-181 | Modal/drag/resize/maximize | Dialog configurable | Dialog con keyboard resize/restore/focus | PARITY | KEEP | — / — | [neu-modal.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/modal/neu-modal.component.ts:1) |
| F-182 | Contenido dinámico/resultado | DialogService | NeuDialogService tipado y templates | PARITY | KEEP | — / — | [neu-modal.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/modal/neu-modal.component.ts:1) |
| F-183 | Panel superpuesto | Drawer posicionado | BottomSheet inferior; Sidebar/servicio para laterales | PARITY | KEEP | — / — | [neu-bottom-sheet.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/bottom-sheet/neu-bottom-sheet.component.ts:1) |
| F-184 | Dismissal y lifecycle | close/Escape/show/hide | guard real; closed request vs hidden lifecycle | REDESIGN | RENAME | P1 / N2-022 | [neu-modal.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/modal/neu-modal.component.ts:1) |
| F-185 | Popover anclado | overlay/placement/appendTo | directiva + CDK overlay y contenido Angular | PARITY | KEEP | — / — | [neu-popover.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/popover/neu-popover.component.ts:1) |
| F-186 | Ayuda/foco/hover | tooltip content/delay | NeuTooltip texto, foco y hover | PARITY | KEEP | — / — | [neu-tooltip.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tooltip/neu-tooltip.component.ts:1) |
| F-187 | Confirmación modal | ConfirmationService | servicio Neural async accept/cancel | PARITY | KEEP | — / — | [neu-confirm-dialog.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/confirm-dialog/neu-confirm-dialog.component.ts:1) |
| F-188 | Confirmación contextual | popup con accept/reject | open/accepted/rejected | PARITY | KEEP | — / — | [neu-confirm-popup.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/confirm-popup/neu-confirm-popup.component.ts:1) |
| F-189 | Menú contextual | pointer/keyboard target | directiva + overlay, Shift+F10 | PARITY | KEEP | — / — | [neu-context-menu.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/context-menu/neu-context-menu.component.ts:1) |


## NAVIGATION

Fuentes oficiales de familia: [PrimeNG breadcrumb](https://primeng.dev/breadcrumb), [PrimeNG menubar](https://primeng.dev/menubar), [PrimeNG sidebar](https://primeng.dev/sidebar), [PrimeNG tabs](https://primeng.dev/tabs), [PrimeNG stepper](https://primeng.dev/stepper), [PrimeNG dock](https://primeng.dev/dock), [PrimeNG scrolltop](https://primeng.dev/scrolltop). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-breadcrumb.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-190 | Jerarquía navegación | model/home/template | items/router/sep | PARITY | KEEP | — / — | [neu-breadcrumb.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/breadcrumb/neu-breadcrumb.component.ts:1) |
| F-191 | App navigation | Menubar jerárquico | Nav y NeuMenubar: casos separados | PARITY | KEEP | — / — | [neu-nav.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/nav/neu-nav.component.ts:1) |
| F-192 | Navegación persistente/colapsable | Sidebar compound/collapse | Sidebar con collapsed y URL; Nav como contenido | PARITY | KEEP | — / — | [neu-sidebar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/sidebar/neu-sidebar.component.ts:1) |
| F-193 | Tabs y contenido | Tabs/TabPanel | NeuTabs/NeuTabPanel y scrolling | PARITY | KEEP | — / — | [neu-tabs.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tabs/neu-tabs.component.ts:1) |
| F-194 | Estado externo sin Router | value model | URL implícita y no activeId input | REDESIGN | CHANGE | P1 / N2-021 | [neu-tabs.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tabs/neu-tabs.component.ts:1) |
| F-195 | Flujo lineal/paso activo | Stepper value/linear | activeStep/linear y stepChange | PARITY | KEEP | — / — | [neu-stepper.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/stepper/neu-stepper.component.ts:1) |
| F-196 | Acciones dock | model/position/template | typed item layout, magnification | PARITY | KEEP | — / — | [neu-dock.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/dock/neu-dock.component.ts:1) |
| F-197 | Volver arriba | target/threshold/behavior | target/threshold/behavior | PARITY | KEEP | — / — | [neu-scroll-top.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/scroll-top/neu-scroll-top.component.ts:1) |


## MENUS

Fuentes oficiales de familia: [PrimeNG menu](https://primeng.dev/menu), [PrimeNG tieredmenu](https://primeng.dev/tieredmenu), [PrimeNG megamenu](https://primeng.dev/megamenu), [PrimeNG commandmenu](https://primeng.dev/commandmenu). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-menu.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-198 | Menú/niveles | Menu expandedKeys/toggleable | Menu expandedKeys y MenuButton | PARITY | KEEP | — / — | [neu-menu.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/menu/neu-menu.component.ts:1) |
| F-199 | Jerarquía de acciones | TieredMenu popup | NeuTieredMenu/overlay composition | PARITY | KEEP | — / — | [neu-menu.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/menu/neu-menu.component.ts:1) |
| F-200 | Mega menú responsive | orientation/breakpoint/templates | typed models/breakpoint/keyboard | PARITY | KEEP | — / — | [neu-mega-menu.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/mega-menu/neu-mega-menu.component.ts:1) |
| F-201 | Búsqueda de comandos | CommandMenu model/filter | CommandPalette servicio + búsqueda | PARITY | KEEP | — / — | [neu-command-palette.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/command-palette/neu-command-palette.component.ts:1) |


## FEEDBACK

Fuentes oficiales de familia: [PrimeNG message](https://primeng.dev/message), [PrimeNG toast](https://primeng.dev/toast), [PrimeNG badge](https://primeng.dev/badge), [PrimeNG tag](https://primeng.dev/tag), [PrimeNG chip](https://primeng.dev/chip), [PrimeNG progressbar](https://primeng.dev/progressbar), [PrimeNG progressspinner](https://primeng.dev/progressspinner), [PrimeNG skeleton](https://primeng.dev/skeleton), [PrimeNG metergroup](https://primeng.dev/metergroup). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-message.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-202 | Mensaje contextual | severity/closable/projection | Alert type/closed y contenido | PARITY | KEEP | — / — | [neu-alert.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/alert/neu-alert.component.ts:1) |
| F-203 | Notificaciones temporales | Toast service/key/life | Toast service y acciones/cola | PARITY | KEEP | — / — | [neu-toast.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/toast/neu-toast.component.ts:1) |
| F-204 | Contador/señal | Badge value/severity | Badge proyección/dot y variantes | PARITY | KEEP | — / — | [neu-badge.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/badge/neu-badge.component.ts:1) |
| F-205 | Etiqueta de estado | Tag severity/value/icon | Tag severity/value/icon | PARITY | KEEP | — / — | [neu-tag.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tag/neu-tag.component.ts:1) |
| F-206 | Token removible | Chip remove/content | Chip removable/selected y contenido | PARITY | KEEP | — / — | [neu-chip.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/chip/neu-chip.component.ts:1) |
| F-207 | Progreso determinado/indeterminado | value/mode | value/indeterminate | PARITY | KEEP | — / — | [neu-progress-bar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/progress-bar/neu-progress-bar.component.ts:1) |
| F-208 | Carga y ARIA | spinner label/stroke | Spinner ariaLabel/strokeWidth | PARITY | KEEP | — / — | [neu-spinner.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/spinner/neu-spinner.component.ts:1) |
| F-209 | Placeholder | shape/size/animation | variant/size/borderRadius | PARITY | KEEP | — / — | [neu-skeleton.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/skeleton/neu-skeleton.component.ts:1) |
| F-210 | Distribución de métricas | value/min/max/labels | items/total/legend | PARITY | KEEP | — / — | [neu-meter-group.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/meter-group/neu-meter-group.component.ts:1) |


## LAYOUT

Fuentes oficiales de familia: [PrimeNG accordion](https://primeng.dev/accordion), [PrimeNG panel](https://primeng.dev/panel), [PrimeNG fieldset](https://primeng.dev/fieldset), [PrimeNG scrollarea](https://primeng.dev/scrollarea), [PrimeNG card](https://primeng.dev/card), [PrimeNG divider](https://primeng.dev/divider), [PrimeNG splitter](https://primeng.dev/splitter), [PrimeNG toolbar](https://primeng.dev/toolbar). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-accordion.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-211 | Colapso básico | panels/value | items/multiple/panelToggle | PARITY | KEEP | — / — | [neu-accordion.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/accordion/neu-accordion.component.ts:1) |
| F-212 | Contenido Angular y restore | compound Angular panels/model | body string innerHTML; expanded seed solo una vez | GAP | ADD | P1 / N2-020 | [neu-accordion.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/accordion/neu-accordion.component.ts:1) |
| F-213 | Panel con colapso | Panel toggleable/collapsed | Panel collapsible, collapsed signal no input | REDESIGN | CHANGE | P1 / N2-021 | [neu-panel.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/panel/neu-panel.component.ts:1) |
| F-214 | Fieldset semántico colapsable | fieldset/legend/toggleable | NeuFieldset con collapsed controlado | PARITY | KEEP | — / — | [neu-panel.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/panel/neu-panel.component.ts:1) |
| F-215 | Scroll presentado | ScrollArea variant/mask | NeuScrollArea enhanced/variant/mask y teclado | PARITY | KEEP | — / — | [neu-panel.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/panel/neu-panel.component.ts:1) |
| F-216 | Contenedor de contenido | Card header/content | Card proyección/padding | PARITY | KEEP | — / — | [neu-card.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/card/neu-card.component.ts:1) |
| F-217 | Separación horizontal/vertical | Divider layout/type | Divider orientation/label + CSS | PARITY | KEEP | — / — | [neu-divider.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/divider/neu-divider.component.ts:1) |
| F-218 | Resize paneles | Splitter/Panel sizes | panes/drag/keyboard y eventos | PARITY | KEEP | — / — | [neu-splitter.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/splitter/neu-splitter.component.ts:1) |
| F-219 | Colapso y restauración | collapsible/collapsedSize | no contrato equivalente integrado | GAP | ADD | P2 / N2-028 | [neu-splitter.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/splitter/neu-splitter.component.ts:1) |
| F-220 | Composición de acciones | Toolbar sections | Toolbar proyección/density/wrap | PARITY | KEEP | — / — | [neu-toolbar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/toolbar/neu-toolbar.component.ts:1) |


## MEDIA

Fuentes oficiales de familia: [PrimeNG carousel](https://primeng.dev/carousel), [PrimeNG gallery](https://primeng.dev/gallery), [PrimeNG compare](https://primeng.dev/compare), [PrimeNG avatar](https://primeng.dev/avatar), [PrimeNG avatargroup](https://primeng.dev/avatargroup). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-carousel.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-221 | Carrusel de contenido | compound + legacy data mode | data/templates/responsive/autoplay/vertical | PARITY | KEEP | — / — | [neu-carousel.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/carousel/neu-carousel.component.ts:1) |
| F-222 | Galería/fullscreen/transforms | Gallery/Thumbnail/Toolbar | Gallery/index/preview/zoom/rotate/flip | PARITY | KEEP | — / — | [neu-gallery.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/gallery/neu-gallery.component.ts:1) |
| F-223 | Galería simple | mismo Gallery | ImageGallery + Gallery duplican parte del estado | REDESIGN | MERGE | P2 / N2-029 | [neu-image-gallery.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/image-gallery/neu-image-gallery.component.ts:1) |
| F-224 | Viewer imperativo | fullscreen Gallery, Image legacy | ImageViewer servicio/portal | PARITY | KEEP | — / — | [neu-image-viewer.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/image-viewer/neu-image-viewer.component.ts:1) |
| F-225 | Comparador visual | compound Compare | Compare/Item/Indicator, orientation y value | PARITY | KEEP | — / — | [neu-compare.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/compare/neu-compare.component.ts:1) |
| F-226 | Identidad imagen/texto | image/label/shape/group | Avatar src/name/status + AvatarGroup | PARITY | KEEP | — / — | [neu-avatar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/avatar/neu-avatar.component.ts:1) |
| F-251 | Grupo de identidades | AvatarGroup agrupa avatares | NeuAvatarGroup con label/labelledBy y proyección | PARITY | KEEP | — / — | [neu-avatar-group.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/avatar-group/neu-avatar-group.component.ts:1) |


## UTILITIES

Fuentes oficiales de familia: [PrimeNG animateonscroll](https://primeng.dev/animateonscroll), [PrimeNG focustrap](https://primeng.dev/focustrap), [PrimeNG keyfilter](https://primeng.dev/keyfilter), [PrimeNG ripple](https://primeng.dev/ripple), [PrimeNG fluid](https://primeng.dev/fluid), [PrimeNG classnames](https://primeng.dev/classnames), [PrimeNG bind](https://primeng.dev/bind), [PrimeNG autofocus](https://primeng.dev/autofocus), [PrimeNG styleclass](https://primeng.dev/styleclass), [PrimeNG filterservice](https://primeng.dev/filterservice), [PrimeNG blockui](https://primeng.dev/blockui). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-animateonscroll.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-227 | Animación de entrada | enter/leave/threshold | NeuAnimateOnScroll y reduced-motion | PARITY | KEEP | — / — | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/animate-on-scroll/public_api.ts:1) |
| F-228 | Contención de foco | FocusTrap | NeuFocusTrap para contención; política modal separada | PARITY | KEEP | — / — | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/focus-trap/public_api.ts:1) |
| F-229 | Filtro de entrada | KeyFilter/pattern | NeuKeyFilter | PARITY | KEEP | — / — | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/key-filter/public_api.ts:1) |
| F-230 | Feedback visual | Ripple | NeuRipple y reduced-motion | PARITY | KEEP | — / — | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/ripple/public_api.ts:1) |
| F-231 | Ancho fluido | Fluid | fluid en controles y CSS layout | PARITY | KEEP | — / — | [neu-form-field.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/form-field/neu-form-field.component.ts:1) |
| F-232 | Clases dinámicas | ClassNames | class binding Angular | PARITY | KEEP | — / — | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/foundation/public_api.ts:1) |
| F-233 | Props/atributos | Bind | bindings/host Angular; no API interna universal | PARITY | KEEP | — / — | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/foundation/public_api.ts:1) |
| F-234 | Foco inicial | AutoFocus directiva | autofocus nativo/control o política overlay | PARITY | KEEP | — / — | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/foundation/public_api.ts:1) |
| F-235 | Triggers CSS complejos | StyleClass enter/leave/outside | composición Angular; sin paquete de atajos universal | GAP | DEFER | P3 / N2-037 | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/animate-on-scroll/public_api.ts:1) |
| F-236 | Reglas reutilizables | FilterService | TableFilterRegistry y option-api config | PARITY | KEEP | — / — | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| F-252 | Bloquear interacción de una región | BlockUI blocked/target | NeuBlockUI y directiva con blocked e inert restaurado | PARITY | KEEP | — / — | [neu-block-ui.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/block-ui/neu-block-ui.component.ts:1) |


## ADVANCED/ENTERPRISE

Fuentes oficiales de familia: [PrimeNG inplace](https://primeng.dev/inplace), [PrimeNG fileupload](https://primeng.dev/fileupload), [PrimeNG editor](https://primeng.dev/editor), [PrimeNG terminal](https://primeng.dev/terminal), [PrimeNG inputcolor](https://primeng.dev/inputcolor). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-inplace.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-237 | Edición en contexto | Inplace con templates | InlineEditor value/commit/cancel y validation | PARITY | KEEP | — / — | [neu-inline-editor.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/inline-editor/neu-inline-editor.component.ts:1) |
| F-238 | Archivos/validación/progreso/retry | FileUpload files/limits/progress | Uploader File[]/fileStates/retry | PARITY | KEEP | — / — | [neu-uploader.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/uploader/neu-uploader.component.ts:1) |
| F-239 | Transporte HTTP propio | url/headers/auto/uploadHandler | I/O del consumidor; intención explícita | OUT OF SCOPE | OUT OF SCOPE | — / — | [neu-uploader.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/uploader/neu-uploader.component.ts:1) |
| F-240 | Editor HTML básico | Editor legacy deprecado con Quill | HTML saneado, toolbar, variables, paste | PARITY | KEEP | — / — | [neu-rich-text-editor.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/rich-text-editor/neu-rich-text-editor.component.ts:1) |
| F-241 | Delta/plugins motor | Quill modules/formats | HTML como contrato propio | OUT OF SCOPE | OUT OF SCOPE | — / — | [neu-rich-text-editor.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/rich-text-editor/neu-rich-text-editor.component.ts:1) |
| F-242 | Comando/respuesta | Terminal servicio response | commandSubmit y output reactivo | PARITY | KEEP | — / — | [neu-terminal.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/terminal/neu-terminal.component.ts:1) |
| F-243 | Color/alpha/canales | InputColor canales/formatos | hex/RGB/HSL/OKLCH y alpha | PARITY | KEEP | — / — | [neu-color-picker.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/color-picker/neu-color-picker.component.ts:1) |
| F-244 | EyeDropper/compound manager | subcomponentes y muestreo | sin equivalente público | GAP | ADD | P2 / N2-024 | [neu-color-picker.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/color-picker/neu-color-picker.component.ts:1) |


## TRANSVERSAL

Fuentes oficiales de familia: [PrimeNG passthrough](https://primeng.dev/passthrough), [PrimeNG theming/unstyled](https://primeng.dev/theming/unstyled), [PrimeNG theming/styled](https://primeng.dev/theming/styled), [PrimeNG changelog](https://primeng.dev/changelog), [PrimeNG accessibility](https://primeng.dev/accessibility), [PrimeNG migration/v22](https://primeng.dev/migration/v22). API exacta: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-passthrough.d.ts`.

| ID | Caso | Prime 22.1.1 | Neural actual / problema | Clasificación | Decisión | Prioridad / tarea | Evidencia Neural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-245 | DOM interno arbitrario | pt/ptOptions/sections y hooks | rechazado H9-C2R; tokens/templates cubren scope propio | OUT OF SCOPE | OUT OF SCOPE | — / — | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/foundation/public_api.ts:1) |
| F-246 | Unstyled global/local | unstyled sin tema del componente | decisión de estructura/a11y CSS conservada | OUT OF SCOPE | OUT OF SCOPE | — / — | [index.scss](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/styles/index.scss:1) |
| F-247 | Theming/presets | presets y design tokens | provideNeuralUI/defineNeuPreset y tokens | PARITY | KEEP | — / — | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/foundation/public_api.ts:1) |
| F-248 | Angular 22/zoneless | soporte v22 explícito | Angular 22-only, TS6 y default OnPush | PARITY | KEEP | — / — | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/foundation/public_api.ts:1) |
| F-249 | A11y/SSR evidencia | docs roles/keyboard y SSR support | gates previos; sin comparación actual ejecutada | PARITY | KEEP | — / — | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/testing/public_api.ts:1) |
| F-250 | Charts | Chart legacy/PRO separado | Chart eliminado; sparkData residual | OUT OF SCOPE | REMOVE | P1 / N2-030 | [neu-stats-card.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/stats-card/neu-stats-card.component.ts:1) |


## Componentes exclusivos / sin contraparte directa

| Neural | Capacidad | Clasificación propia | Decisión | Justificación | Tarea | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| calendar | Calendar agenda por fecha | NEURAL ADVANTAGE | KEEP | Agenda de eventos, locale y día seleccionado; DatePicker no sustituye agenda. | N2-022 | [neu-calendar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/calendar/neu-calendar.component.ts:1) |
| kanban | Kanban accesible | NEURAL ADVANTAGE | KEEP | Teclado, alternativa no-drag, controlled/optimistic y WIP; no confundir PRO Task Board con core. | N2-033 | [neu-kanban.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/kanban/neu-kanban.component.ts:1) |
| scheduler-gantt | SchedulerGantt | NEURAL ADVANTAGE | KEEP | Planificación temporal y tareas; no es una librería de charts; medir grandes horizontes. | N2-033 | [neu-scheduler-gantt.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/scheduler-gantt/neu-scheduler-gantt.component.ts:1) |
| timeline-grid | TimelineGrid | NEURAL ADVANTAGE | KEEP | Matriz temporal, slots e items; conservar tipo y navegación. | N2-033 | [neu-timeline-grid.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/timeline-grid/neu-timeline-grid.component.ts:1) |
| dashboard-grid | DashboardGrid | USEFUL BUT NICHE | KEEP | Layout de tiles editable; no convertir en motor genérico de dashboards. | N2-033 | [neu-dashboard-grid.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/dashboard-grid/neu-dashboard-grid.component.ts:1) |
| notification-center | NotificationCenter | NEURAL ADVANTAGE | KEEP | Bandeja persistente de notificaciones y acciones, distinta de Toast temporal. | N2-033 | [neu-notification-center.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/notification-center/neu-notification-center.component.ts:1) |
| stats-card | StatsCard | USEFUL BUT NICHE | CHANGE | Conservar KPI textual; retirar sparkline por scope sin charts. | N2-030 | [neu-stats-card.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/stats-card/neu-stats-card.component.ts:1) |
| filter-bar | FilterBar | USEFUL BUT NICHE | KEEP | Filtros de aplicación visibles; no duplicar query de Table. | N2-012 | [neu-filter-bar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/filter-bar/neu-filter-bar.component.ts:1) |
| code-block | CodeBlock | USEFUL BUT NICHE | KEEP | Código/copy; unificar lang/language. | N2-023 | [neu-code-block.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/code-block/neu-code-block.component.ts:1) |
| empty-state | EmptyState | USEFUL BUT NICHE | KEEP | Estado vacío accionable reutilizable. | N2-034 | [neu-empty-state.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/empty-state/neu-empty-state.component.ts:1) |
| image-gallery | ImageGallery | MERGE CANDIDATE | MERGE | Con Gallery tras cubrir capacidades únicas; servicio Viewer se conserva. | N2-029 | [neu-image-gallery.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/image-gallery/neu-image-gallery.component.ts:1) |
| tags | Tags | REDUNDANT | MERGE | Editor string duplicado; portar separadores a InputTags. | N2-008 | [neu-tags.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tags/neu-tags.component.ts:1) |
| icon | Icon wrapper | USEFUL BUT NICHE | KEEP | Adaptación actual ng-icons; no implementar Neural Icons aún. | N2-031 | [neu-icon.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/icon/neu-icon.component.ts:1) |
| url-state | URL State | NEURAL ADVANTAGE | KEEP | Composición explícita reusable; eliminar activación implícita de componentes. | N2-021 | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/url-state/public_api.ts:1) |
| testing | Testing harnesses | NEURAL ADVANTAGE | KEEP | Harness público para consumidores, cobertura por componente debe declararse. | N2-033 | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/testing/public_api.ts:1) |
| table-core | TableCore | NEURAL ADVANTAGE | KEEP | Renderer semántico ligero separado de features avanzadas. | N2-014 | [neu-table-core.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table-core/neu-table-core.component.ts:1) |


## Cobertura de declaraciones públicas

El inventario siguiente permite localizar todos los componentes públicos, incluidos auxiliares. Compartir ficha de familia es intencional: Checkbox de Table y wrappers de menús no se presentan como una ventaja por conteo. Las directivas y servicios se documentan junto al caso que habilitan.

| Declaración | Selector | Familia / entrypoint | Resultado por capacidades | Filas | Fuente |
| --- | --- | --- | --- | --- | --- |
| NeuAccordionComponent | neu-accordion | accordion | PARITY, GAP | F-211, F-212 | [neu-accordion.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/accordion/neu-accordion.component.ts:1) |
| NeuAlertComponent | neu-alert | alert | PARITY | F-202 | [neu-alert.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/alert/neu-alert.component.ts:1) |
| NeuAutocompleteComponent | neu-autocomplete | autocomplete | PARITY, REDESIGN | F-148, F-149 | [neu-autocomplete.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/autocomplete/neu-autocomplete.component.ts:1) |
| NeuAvatarGroupComponent | neu-avatar-group | avatar-group | PARITY | F-251 | [neu-avatar-group.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/avatar-group/neu-avatar-group.component.ts:1) |
| NeuAvatarComponent | neu-avatar | avatar | PARITY | F-226 | [neu-avatar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/avatar/neu-avatar.component.ts:1) |
| NeuBadgeComponent | neu-badge | badge | PARITY | F-204 | [neu-badge.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/badge/neu-badge.component.ts:1) |
| NeuBlockUIComponent | neu-block-ui | block-ui | PARITY | F-252 | [neu-block-ui.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/block-ui/neu-block-ui.component.ts:1) |
| NeuBottomSheetComponent | neu-bottom-sheet | bottom-sheet | PARITY | F-183 | [neu-bottom-sheet.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/bottom-sheet/neu-bottom-sheet.component.ts:1) |
| NeuBreadcrumbComponent | neu-breadcrumb | breadcrumb | PARITY | F-190 | [neu-breadcrumb.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/breadcrumb/neu-breadcrumb.component.ts:1) |
| NeuButtonGroupComponent | neu-button-group | button-group | PARITY | F-164 | [neu-button-group.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/button-group/neu-button-group.component.ts:1) |
| NeuButtonComponent | button[neu-button] | button | PARITY | F-163 | [neu-button.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/button/neu-button.component.ts:1) |
| NeuCalendarComponent | neu-calendar | calendar | NEURAL ADVANTAGE | Caso compuesto; ver ficha de familia | [neu-calendar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/calendar/neu-calendar.component.ts:1) |
| NeuCardComponent | neu-card | card | PARITY | F-216 | [neu-card.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/card/neu-card.component.ts:1) |
| NeuCarouselComponent | neu-carousel | carousel | PARITY | F-221 | [neu-carousel.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/carousel/neu-carousel.component.ts:1) |
| NeuCascadeSelectComponent | neu-cascade-select | cascade-select | PARITY, REDESIGN | F-150, F-151 | [neu-cascade-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/cascade-select/neu-cascade-select.component.ts:1) |
| NeuCheckboxComponent | neu-checkbox | checkbox | PARITY, OUT OF SCOPE | F-117, F-118 | [neu-checkbox.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/checkbox/neu-checkbox.component.ts:1) |
| NeuChipComponent | neu-chip | chip | PARITY | F-206 | [neu-chip.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/chip/neu-chip.component.ts:1) |
| NeuCodeBlockComponent | neu-code-block | code-block | USEFUL BUT NICHE | Caso compuesto; ver ficha de familia | [neu-code-block.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/code-block/neu-code-block.component.ts:1) |
| NeuColorPickerComponent | neu-color-picker | color-picker | PARITY, GAP | F-243, F-244 | [neu-color-picker.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/color-picker/neu-color-picker.component.ts:1) |
| NeuCommandPaletteComponent | neu-command-palette | command-palette | PARITY | F-201 | [neu-command-palette.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/command-palette/neu-command-palette.component.ts:1) |
| NeuCompareComponent | neu-compare | compare | PARITY | F-225 | [neu-compare.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/compare/neu-compare.component.ts:1) |
| NeuCompareHandleComponent | neu-compare-handle | compare | PARITY | F-225 | [neu-compare.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/compare/neu-compare.component.ts:1) |
| NeuCompareIndicatorComponent | neu-compare-indicator | compare | PARITY | F-225 | [neu-compare.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/compare/neu-compare.component.ts:1) |
| NeuCompareItemComponent | neu-compare-item | compare | PARITY | F-225 | [neu-compare.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/compare/neu-compare.component.ts:1) |
| NeuConfirmDialogComponent | neu-confirm-dialog | confirm-dialog | PARITY | F-187 | [neu-confirm-dialog.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/confirm-dialog/neu-confirm-dialog.component.ts:1) |
| NeuConfirmPopupComponent | neu-confirm-popup | confirm-popup | PARITY | F-188 | [neu-confirm-popup.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/confirm-popup/neu-confirm-popup.component.ts:1) |
| NeuDashboardGridComponent | neu-dashboard-grid | dashboard-grid | USEFUL BUT NICHE | Caso compuesto; ver ficha de familia | [neu-dashboard-grid.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/dashboard-grid/neu-dashboard-grid.component.ts:1) |
| NeuDataViewComponent | neu-data-view | data-view | PARITY | F-167, F-168 | [neu-data-view.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/data-view/neu-data-view.component.ts:1) |
| NeuDateInputComponent | neu-date-input | date-input | PARITY, REDESIGN, GAP | F-127, F-128, F-129, F-130 | [neu-date-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/date-input/neu-date-input.component.ts:1) |
| NeuDividerComponent | neu-divider | divider | PARITY | F-217 | [neu-divider.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/divider/neu-divider.component.ts:1) |
| NeuDockComponent | neu-dock | dock | PARITY | F-196 | [neu-dock.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/dock/neu-dock.component.ts:1) |
| NeuEmptyStateComponent | neu-empty-state | empty-state | USEFUL BUT NICHE | Caso compuesto; ver ficha de familia | [neu-empty-state.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/empty-state/neu-empty-state.component.ts:1) |
| NeuFilterBarComponent | neu-filter-bar | filter-bar | USEFUL BUT NICHE | Caso compuesto; ver ficha de familia | [neu-filter-bar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/filter-bar/neu-filter-bar.component.ts:1) |
| NeuFormFieldComponent | neu-form-field | form-field | PARITY, REDESIGN | F-138, F-139, F-140, F-141, F-142, F-231 | [neu-form-field.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/form-field/neu-form-field.component.ts:1) |
| NeuInputGroupComponent | neu-input-group | form-field | PARITY, REDESIGN | F-138, F-139, F-140, F-141, F-142, F-231 | [neu-form-field.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/form-field/neu-form-field.component.ts:1) |
| NeuGalleryComponent | neu-gallery | gallery | PARITY | F-222 | [neu-gallery.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/gallery/neu-gallery.component.ts:1) |
| NeuIconComponent | neu-icon | icon | USEFUL BUT NICHE | Caso compuesto; ver ficha de familia | [neu-icon.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/icon/neu-icon.component.ts:1) |
| NeuImageGalleryComponent | neu-image-gallery | image-gallery | REDESIGN | F-223 | [neu-image-gallery.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/image-gallery/neu-image-gallery.component.ts:1) |
| NeuInlineEditorComponent | neu-inline-editor | inline-editor | PARITY | F-237 | [neu-inline-editor.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/inline-editor/neu-inline-editor.component.ts:1) |
| NeuInputMaskComponent | neu-input-mask | input-mask | PARITY, GAP | F-112, F-113, F-114 | [neu-input-mask.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-mask/neu-input-mask.component.ts:1) |
| NeuInputOTPComponent | neu-input-otp | input-otp | PARITY, REDESIGN | F-115, F-116 | [neu-input-otp.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-otp/neu-input-otp.component.ts:1) |
| NeuInputTagsComponent | neu-input-tags | input-tags | PARITY | F-155 | [neu-input-tags.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-tags/neu-input-tags.component.ts:1) |
| NeuInputComponent | neu-input | input | PARITY, REDESIGN | F-106, F-107 | [neu-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input/neu-input.component.ts:1) |
| NeuKanbanComponent | neu-kanban | kanban | NEURAL ADVANTAGE | Caso compuesto; ver ficha de familia | [neu-kanban.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/kanban/neu-kanban.component.ts:1) |
| NeuKnobComponent | neu-knob | knob | PARITY, GAP | F-125, F-126 | [neu-knob.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/knob/neu-knob.component.ts:1) |
| NeuListboxComponent | neu-listbox | listbox | PARITY, REDESIGN | F-152, F-153, F-154 | [neu-listbox.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/listbox/neu-listbox.component.ts:1) |
| NeuMegaMenuComponent | neu-mega-menu | mega-menu | PARITY | F-200 | [neu-mega-menu.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/mega-menu/neu-mega-menu.component.ts:1) |
| NeuMenubarComponent | neu-menubar | menu | PARITY | F-198, F-199 | [neu-menu.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/menu/neu-menu.component.ts:1) |
| NeuMenuButtonComponent | neu-menu-button | menu | PARITY | F-198, F-199 | [neu-menu.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/menu/neu-menu.component.ts:1) |
| NeuMenuComponent | neu-menu | menu | PARITY | F-198, F-199 | [neu-menu.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/menu/neu-menu.component.ts:1) |
| NeuTieredMenuComponent | neu-tiered-menu | menu | PARITY | F-198, F-199 | [neu-menu.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/menu/neu-menu.component.ts:1) |
| NeuMeterGroupComponent | neu-meter-group | meter-group | PARITY | F-210 | [neu-meter-group.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/meter-group/neu-meter-group.component.ts:1) |
| NeuDialogComponent | neu-dialog | modal | PARITY, REDESIGN | F-181, F-182, F-184 | [neu-modal.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/modal/neu-modal.component.ts:1) |
| NeuMultiselectComponent | neu-multiselect | multiselect | PARITY, REDESIGN | F-146, F-147 | [neu-multiselect.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/multiselect/neu-multiselect.component.ts:1) |
| NeuNavComponent | neu-nav | nav | PARITY | F-191 | [neu-nav.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/nav/neu-nav.component.ts:1) |
| NeuNotificationCenterComponent | neu-notification-center | notification-center | NEURAL ADVANTAGE | Caso compuesto; ver ficha de familia | [neu-notification-center.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/notification-center/neu-notification-center.component.ts:1) |
| NeuNumberInputComponent | neu-number-input | number-input | PARITY, GAP, REDESIGN | F-122, F-123, F-124 | [neu-number-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/number-input/neu-number-input.component.ts:1) |
| NeuOrganizationChartComponent | neu-organization-chart | organization-chart | PARITY | F-177 | [neu-organization-chart.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/organization-chart/neu-organization-chart.component.ts:1) |
| NeuPaginationComponent | neu-pagination | pagination | PARITY | F-169, F-170 | [neu-pagination.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/pagination/neu-pagination.component.ts:1) |
| NeuFieldsetComponent | neu-fieldset | panel | REDESIGN, PARITY | F-213, F-214, F-215 | [neu-panel.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/panel/neu-panel.component.ts:1) |
| NeuPanelComponent | neu-panel | panel | REDESIGN, PARITY | F-213, F-214, F-215 | [neu-panel.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/panel/neu-panel.component.ts:1) |
| NeuScrollAreaComponent | neu-scroll-area | panel | REDESIGN, PARITY | F-213, F-214, F-215 | [neu-panel.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/panel/neu-panel.component.ts:1) |
| NeuPasswordComponent | neu-password | password | PARITY, REDESIGN | F-110, F-111 | [neu-password.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/password/neu-password.component.ts:1) |
| NeuOrderListComponent | neu-order-list | pick-list | PARITY | F-174, F-175, F-176 | [neu-pick-list.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/pick-list/neu-pick-list.component.ts:1) |
| NeuPickListComponent | neu-pick-list | pick-list | PARITY | F-174, F-175, F-176 | [neu-pick-list.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/pick-list/neu-pick-list.component.ts:1) |
| NeuProgressBarComponent | neu-progress-bar | progress-bar | PARITY | F-207 | [neu-progress-bar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/progress-bar/neu-progress-bar.component.ts:1) |
| NeuRadioComponent | neu-radio | radio | PARITY, REDESIGN | F-120, F-121 | [neu-radio.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/radio/neu-radio.component.ts:1) |
| NeuRadioGroupComponent | neu-radio-group | radio | PARITY, REDESIGN | F-120, F-121 | [neu-radio-group.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/radio/neu-radio-group.component.ts:1) |
| NeuRatingComponent | neu-rating | rating | PARITY, GAP | F-131, F-132, F-133 | [neu-rating.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/rating/neu-rating.component.ts:1) |
| NeuRichTextEditorComponent | neu-rich-text-editor | rich-text-editor | PARITY, OUT OF SCOPE | F-240, F-241 | [neu-rich-text-editor.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/rich-text-editor/neu-rich-text-editor.component.ts:1) |
| NeuSchedulerGanttComponent | neu-scheduler-gantt | scheduler-gantt | NEURAL ADVANTAGE | Caso compuesto; ver ficha de familia | [neu-scheduler-gantt.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/scheduler-gantt/neu-scheduler-gantt.component.ts:1) |
| NeuScrollTopComponent | neu-scroll-top | scroll-top | PARITY | F-197 | [neu-scroll-top.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/scroll-top/neu-scroll-top.component.ts:1) |
| NeuSelectComponent | neu-select | select | PARITY, REDESIGN | F-143, F-144, F-145 | [neu-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/select/neu-select.component.ts:1) |
| NeuSidebarComponent | neu-sidebar | sidebar | PARITY | F-192 | [neu-sidebar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/sidebar/neu-sidebar.component.ts:1) |
| NeuSkeletonComponent | neu-skeleton | skeleton | PARITY | F-209 | [neu-skeleton.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/skeleton/neu-skeleton.component.ts:1) |
| NeuSliderComponent | neu-slider | slider | PARITY, GAP | F-134, F-135, F-136, F-137 | [neu-slider.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/slider/neu-slider.component.ts:1) |
| NeuSpeedDialComponent | neu-speed-dial | speed-dial | PARITY | F-166 | [neu-speed-dial.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/speed-dial/neu-speed-dial.component.ts:1) |
| NeuSpinnerComponent | neu-spinner | spinner | PARITY | F-208 | [neu-spinner.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/spinner/neu-spinner.component.ts:1) |
| NeuSplitButtonComponent | neu-split-button | split-button | PARITY | F-165 | [neu-split-button.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/split-button/neu-split-button.component.ts:1) |
| NeuSplitterComponent | neu-splitter | splitter | PARITY, GAP | F-218, F-219 | [neu-splitter.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/splitter/neu-splitter.component.ts:1) |
| NeuStatsCardComponent | neu-stats-card | stats-card | OUT OF SCOPE | F-250 | [neu-stats-card.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/stats-card/neu-stats-card.component.ts:1) |
| NeuStepperComponent | neu-stepper | stepper | PARITY | F-195 | [neu-stepper.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/stepper/neu-stepper.component.ts:1) |
| NeuSwitchComponent | neu-switch | switch | REDESIGN | F-119 | [neu-switch.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/switch/neu-switch.component.ts:1) |
| NeuTableCoreComponent | neu-table-core | table-core | NEURAL ADVANTAGE | Caso compuesto; ver ficha de familia | [neu-table-core.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table-core/neu-table-core.component.ts:1) |
| NeuTableComponent | neu-table | table | PARITY, REDESIGN, OUT OF SCOPE, SUPERIOR | F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-009, F-010, F-011, F-012, F-013, F-014, F-015, F-016, F-017, F-018, F-019, F-020, F-021, F-022, F-023, F-024, F-025, F-026, F-027, F-028, F-029, F-030, F-031, F-032, F-033, F-034, F-035, F-036, F-037, F-038, F-039, F-040, F-041, F-042, F-043, F-044, F-045, F-046, F-047, F-048, F-049, F-050, F-051, F-052, F-053, F-054, F-055, F-056, F-057, F-058, F-059, F-060, F-061, F-062, F-063, F-064, F-065, F-066, F-067, F-068, F-069, F-070, F-236 | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) |
| NeuTabPanelComponent | neu-tab-panel | tabs | PARITY, REDESIGN | F-193, F-194 | [neu-tabs.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tabs/neu-tabs.component.ts:1) |
| NeuTabsComponent | neu-tabs | tabs | PARITY, REDESIGN | F-193, F-194 | [neu-tabs.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tabs/neu-tabs.component.ts:1) |
| NeuTagComponent | neu-tag | tag | PARITY | F-205 | [neu-tag.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tag/neu-tag.component.ts:1) |
| NeuTagsComponent | neu-tags | tags | REDESIGN | F-156 | [neu-tags.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tags/neu-tags.component.ts:1) |
| NeuTerminalComponent | neu-terminal | terminal | PARITY | F-242 | [neu-terminal.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/terminal/neu-terminal.component.ts:1) |
| NeuTextareaComponent | neu-textarea | textarea | PARITY, REDESIGN | F-108, F-109 | [neu-textarea.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/textarea/neu-textarea.component.ts:1) |
| NeuTimelineGridComponent | neu-timeline-grid | timeline-grid | NEURAL ADVANTAGE | Caso compuesto; ver ficha de familia | [neu-timeline-grid.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/timeline-grid/neu-timeline-grid.component.ts:1) |
| NeuTimelineComponent | neu-timeline | timeline | PARITY | F-178 | [neu-timeline.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/timeline/neu-timeline.component.ts:1) |
| NeuToastContainerComponent | neu-toast-container | toast | PARITY | F-203 | [neu-toast.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/toast/neu-toast.component.ts:1) |
| NeuToggleButtonGroupComponent | neu-toggle-button-group | toggle-button-group | PARITY, REDESIGN | F-157, F-158, F-159 | [neu-toggle-button-group.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/toggle-button-group/neu-toggle-button-group.component.ts:1) |
| NeuToolbarComponent | neu-toolbar | toolbar | PARITY | F-220 | [neu-toolbar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/toolbar/neu-toolbar.component.ts:1) |
| NeuTreeSelectComponent | neu-tree-select | tree-select | PARITY, GAP | F-160, F-161, F-162 | [neu-tree-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-select/neu-tree-select.component.ts:1) |
| NeuTreeTableComponent | neu-tree-table | tree-table | PARITY, REDESIGN, SUPERIOR, OUT OF SCOPE | F-071, F-072, F-073, F-074, F-075, F-076, F-077, F-078, F-079, F-080, F-081, F-082, F-083, F-084, F-085, F-086, F-087, F-088, F-089, F-090, F-091, F-092, F-093, F-094, F-095, F-096, F-097, F-098, F-099, F-100, F-101, F-102, F-103, F-104, F-105 | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) |
| NeuTreeComponent | neu-tree | tree | PARITY | F-171, F-172, F-173 | [neu-tree.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree/neu-tree.component.ts:1) |
| NeuUploaderComponent | neu-uploader | uploader | PARITY, OUT OF SCOPE | F-238, F-239 | [neu-uploader.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/uploader/neu-uploader.component.ts:1) |
| NeuVirtualListComponent | neu-virtual-list | virtual-list | PARITY, GAP | F-179, F-180 | [neu-virtual-list.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/virtual-list/neu-virtual-list.component.ts:1) |


## Interpretación de alcance

No hay certificación de cada combinación posible de inputs. La matriz cubre el catálogo público y workflows, y señala dónde la composición es alternativa, dónde falta funcionalidad y dónde una API promete demasiado. Los gaps y rediseños tienen tareas distintas: no confundir deuda de arquitectura con ausencia funcional. Auxiliares heredados de Panel, Menu o Modal se cubren en su flujo padre, no como productos independientes.
