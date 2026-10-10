# NeuTable 2 — Arquitectura final

## 1. Executive decision

Neural UI 2 tendrá una única Table pública:

```text
@neural-ui/core/table
<neu-table>
```

La fachada y orquestación actuales se reescriben. El entrypoint `@neural-ui/core/table-core` y `NeuTableCoreComponent` desaparecen de la API pública. Se conserva el valor arquitectónico de un renderer semántico ligero, pero como implementación privada de Table. No se implementa nada productivo en esta tarea.

Resultado de diseño: **APPROVED FOR IMPLEMENTATION**.

## 2. Why one public Table

La división pública obligaba al consumidor a elegir entre una tabla ligera y una tabla funcional, trasladando una decisión interna de bundle a la aplicación. Table 1.x presenta 80 inputs, 38 outputs, 32 métodos públicos y 158 exports; TableCore añade 16 inputs y 16 exports. La elección no describe dominio, solo coste interno.

NeuTable 2 hace la sofisticación privada: un consumidor básico usa el mismo selector que uno remoto, virtual o editable. Las capacidades opcionales se separan por chunks y fronteras internas, no mediante una segunda Table pública.

## 3. TableCore public removal

La decisión previa de N2-001 queda superseded únicamente en su visibilidad pública. Se elimina en la fase final:

- entrypoint `@neural-ui/core/table-core`;
- `NeuTableCoreComponent` público;
- directivas y tipos `NeuTableCore*` públicos;
- documentación y ejemplos que pidan elegir TableCore;
- presupuestos que midan una etiqueta distinta como sustituto de Table básica.

El beneficio probado —renderer nativo, semántico, sin Forms/Router/CDK/export— se mantiene internamente y se medirá usando `<neu-table>` básico.

## 4. Internal architecture

Decisión sobre el TableCore antiguo: **B + C**. Se divide en primitivas y se reescribe como renderer privado. No se conserva como componente público ni se elimina su conocimiento excelente.

```text
table/
  neu-table.component.ts                 PUBLIC facade
  public/                                PUBLIC types + template directives
  internal/
    renderer/                            native table/grid markup, rows/cells/templates
    query/                               normalization + pure transitions
    client-pipeline/                     filter → sort → group → page
    selection/                           key/all-matching engine
    layout/                              resize/reorder/visibility/pinning
    virtualization/                      visible/render/request ranges
    remote/                              revision/request coordinator
    editing/                             one active draft
    focus/                               logical focus and roving tabindex
    features/
      advanced-filters/                  private lazy chunk
      editors/                           private lazy chunk
      export/                            private lazy chunk
```

Se pueden reutilizar funciones puras actuales de sort, filtros, grouping, layout, export y rangos solo si pasan type tests sin `any`, no preservan owners legacy y no importan la fachada antigua. El componente actual de 7.5k líneas no se envuelve.

## 5. Public component contract

El contrato completo está congelado en [N2-TABLE2-TYPE-CONTRACTS.md](./N2-TABLE2-TYPE-CONTRACTS.md). La fachada conceptual contiene:

- 24 inputs: datos/applied state y configuraciones cohesivas;
- 14 outputs: proposals, un request remoto y eventos de dominio;
- 4 comandos imperativos sin ownership alternativo;
- cero aliases 1.x, CVA, Router, Storage o `Event` DOM.

Los seis slices controlados son `query`, `selection`, `layout`, `expandedKeys`, `editState` y `grouping`. Cada uno tiene input aplicado y, cuando existe interacción, un único output de propuesta.

## 6. Generics T/K/F

- `T extends object`: entidad/fila de dominio. Table nunca la clona profundamente ni la muta.
- `K extends string | number`: identidad semántica estable para selección, expansión, foco y edición.
- `F extends string`: unión tipada de campos ordenables/filtrables/agrupables y serializables.

`rowKey(row): K` define identidad de negocio. `rowTrackBy(index,row): unknown` optimiza el render. No se fusionan, no se usa el índice como key semántica y no se degrada F a `string` dentro de eventos.

## 7. Data model

```ts
dataMode: 'client' | 'remote';
data: readonly T[];
metadata: NeuTableMetadata;
```

Client aplica el pipeline puro sobre `data`. Remote considera `data` ya resuelto por el consumidor; no vuelve a filtrar, ordenar ni paginar. `metadata` contiene total/loading/error/revisiones y, en virtual remote, el rango lógico de `data`. No hay filas placeholder dentro de T ni metadata mezclada en el array.

`frozenData` desaparece: row pinning referencia keys del único array. Un dataset remoto virtual es una ventana contigua `data` + `metadata.dataRange`.

## 8. Query

La única query canónica es:

```ts
interface NeuTableQuery<F extends string> {
  page: number;                 // zero-based
  pageSize: number;
  search: string;
  sort: readonly NeuSortEntry<F>[];
  filters: NeuFilterExpression<F> | null;
}
```

Page, pageSize, search, sort y filtros cambian el conjunto/orden solicitado y pertenecen a query. `globalFilterFields` no pertenece: es policy del esquema y vive en `filterOptions.globalFields`. Grouping P1 es presentación de filas cargadas y tampoco entra en query. No existen `sort`, `sortEntries`, `multiSort`, page inputs ni filter maps paralelos.

La query se normaliza en la frontera: page/pageSize positivos, sort sin fields duplicados, AST sin grupos vacíos y snapshots readonly. Valores opacos de filtro usan `Object.is` por defecto o `filterOptions.equals`.

## 9. Query ownership

`query` es **INPUT aplicado**. `queryChange` es **PROPOSAL**. Nunca es `model()`.

```text
USER INTERACTION
  → pure transition proposes next query
  → queryChange(next)
  → consumer accepts or rejects
  → only a changed query input becomes applied
  → client recomputes OR remote dataRequest emits
```

Si el consumer rechaza, no cambian aria-sort, página, filtros aplicados, filas ni requests. Si acepta con un eco semánticamente igual, no se reemite. Los handlers del usuario emiten proposals directamente; ningún effect mantiene una writable copy.

## 10. Remote request state machine

`dataRequest` es el único canal remoto. Payload: `requestId`, `queryRevision`, query, reason (`initial|query|viewport|retry`) y range opcional.

| Estado/transición | Regla |
| --- | --- |
| SSR | Renderiza inputs; nunca emite request. |
| Hydration satisfecha | Si metadata revision/range cubren query/viewport, cero request. |
| Bootstrap browser no satisfecho | Emite exactamente un `initial`. |
| Query propuesta | Cero request hasta aceptación. |
| Query aplicada nueva | Incrementa revision y emite un `query`; con virtual incluye un único rango alineado. |
| Viewport cambia | Emite `rangeChange`; solo emite `viewport` si metadata no cubre renderRange. |
| Retry | Misma query/revision, nuevo requestId, reason retry. |
| Respuesta válida | Consumer actualiza data+metadata con revision actual y requestId no anterior. |
| Respuesta stale/out-of-order | Consumer debe descartarla; Table no renderiza pares metadata/data cuya revision no sea actual. |

Request IDs son monotónicos por instancia. Para una misma revision/range solo hay una intención pending. `rangeChange` no es transporte y nunca produce un segundo request en el consumer documentado. Neural no ejecuta HTTP ni cancela observables del consumidor.

## 11. Sorting

Estado único: `query.sort: readonly NeuSortEntry<F>[]`. Single limita longitud a uno; multiple conserva orden/prioridad. `sortOptions` contiene mode, removable, defaultDirection y resetPageOnChange. Column define field/accessor/comparator.

El ciclo aplicado se refleja en `aria-sort`; la prioridad multi se anuncia mediante descripción accesible. Sorting remote solo propone query. Sorting client es estable, no muta data y resuelve cada accessor una vez por fila/paso.

## 12. Filtering

Un AST único representa condiciones y grupos AND/OR. Se separa:

- **STATE:** `query.filters` y `query.search`;
- **POLICY:** fields, rules, accessors, custom predicates, equality y debounce;
- **PRESENTATION:** `filterOptions.surfaces` (`row|menu|builder`).

Column, global, múltiples reglas, match modes y custom predicates convergen en el mismo AST. Client ejecuta predicates puros; remote entrega la misma query al consumidor. Builder mantiene draft efímero y solo propone al aplicar. No existen `filterDisplay`, `advancedFilterMode` ni un state model alternativo.

## 13. Pagination

State vive exclusivamente en `query.page/pageSize`. Policy/presentation vive en `paginationOptions`: enabled, size choices, position, report y jump. Client deriva total de pipeline; remote usa `metadata.totalItems`, que puede ser null y nunca se inventa.

Un cambio de sort/filter/search resetea page según policy dentro de una sola propuesta de query. Virtualización P1 y paginator son mutuamente excluyentes; el runtime emite diagnóstico de desarrollo ante esa combinación.

## 14. Selection

El objetivo `selectedKeys[]` no basta para “select all” remoto no cargado. El contrato final usa una única selección discriminada:

- `{kind:'keys', keys}` para single/multiple y keys no cargadas;
- `{kind:'all-matching', scope, excludedKeys}` para todo el resultado remoto/filtrado.

`selectionChange` propone el siguiente estado y describe source/added/removed/loadedRows. No existen row objects como owner ni outputs agregados más rowSelect/rowUnselect duplicados.

Options es unión válida por mode: none; single con radio; multiple con checkbox, modifier, range y toggleAllScope. Range opera sobre orden cargado actual. `all-matching` congela search/filter/globalFields y permite exclusiones sin enumerar el backend.

## 15. Columns

`readonly NeuTableColumn<T,F>[]` cubre columnas static/dynamic mediante ids estables. Cada columna puede declarar value, sort, filter, edit y geometría. Layout aplicado posee order/hidden/widths/pinning; columns no duplica esos estados.

Templates se registran por `columnId` mediante directivas tipadas. Header/cell/editor contexts preservan T/K/F y usan `unknown` para valores heterogéneos. Resize, reorder, frozen/sticky, visibility, width y responsive behavior terminan en column policy + layout proposal, nunca en inputs escalares por feature.

## 16. Virtualization

Tres rangos half-open:

- `visibleRange`: filas geométricamente visibles;
- `renderRange`: visible + overscan, determina DOM;
- `requestRange`: render alineado a requestStep, solo remote.

`rangeChange` entrega visible/render y reason, sin Event DOM. `dataRequest` contiene requestRange cuando falta cobertura. Defaults al activar: overscan 4, requestStep remote 50; itemSize es obligatorio. Retention/cache pertenece al consumidor, no a Table.

El DOM debe ser O(viewport + overscan) con 10k/100k registros lógicos. Solo altura fija P1. Navegación que sale de la ventana cambia rango, espera render y restaura foco lógico por key/column.

## 17. Editing

`editState` aplicado distingue none/cell/row. La interacción propone `editStateChange`; aceptar abre una única sesión. El draft es efímero, aislado y contiene cambios por columnId/field. Table no muta T.

Built-in editors crean un field tree de Signal Forms solo para el draft activo. Custom editor recibe `Signal<unknown>`, errors, set/commit/cancel; no se crean FormControls por cada celda. Validation puede ser sync/async. Un commit válido emite `editCommit`; el consumer cambia data y cierra editState. Cancel emite `editCancel` y descarta draft.

## 18. Expansion

`expandedKeys: readonly K[]` es aplicado y `expandedKeysChange` proposal. Row detail usa template tipado. Expanded state de keys no cargadas se preserva; no se confunde con selección ni grouping. Toggle por fila es policy explícita y disabled/isExpandable se evalúan sin DOM scans.

## 19. Grouping

P1 mantiene subheader, rowspan, collapse y agregados sobre filas client/loaded. `grouping` aplicado contiene fields y group ids expandidos; `groupingOptions` contiene mode, accessor y aggregate. Groups se derivan de data ordenada con IDs deterministas.

Remote server-side aggregation y árboles no se simulan. Grouping no introduce `TreeTable`, parent/child, lazy children ni propagación jerárquica.

## 20. Export

CSV/JSON/XLSX siguen siendo una ventaja Neural, pero su implementación reside en un chunk privado cargado con `import()`. El consumer continúa usando la misma instancia `<neu-table>` y su método `export()`.

Client/page/loaded/filtered/selected generan bytes localmente. Remote `scope:'all'` emite `exportRequest` y devuelve outcome delegated; la app decide endpoint/worker. El basic bundle no retiene serializers, ZIP/XLSX ni editor/filter UI. Fallos dinámicos producen Promise rejection y `featureError`, no `metadata.error`.

## 21. URL/storage boundary

Table no importa Router, localStorage ni sessionStorage y elimina `urlState`, `stateKey`, `stateStorage` y métodos save/restore. La aplicación observa los seis slices, serializa una versión propia y vuelve a suministrar inputs aplicados.

Se publican recetas documentales para Router y Storage y converters one-shot 1.x→2.x. No se publica service, directive o runtime adapter Neural que vuelva a poseer el estado.

## 22. Signals architecture

| Slice | Source of truth | Derived computed | Ephemeral | Side effect |
| --- | --- | --- | --- | --- |
| Data/query | inputs data/query/metadata | normalized query, client rows, totals | none | remote request boundary |
| Selection | input selection | selected/indeterminate/projected rows | anchor/focus | live announcement |
| Columns/layout | inputs columns/layout | normalized visible columns, geometry | resize/drag draft | DOM measurement |
| Virtual | options + viewport geometry | visible/render/request ranges | scroll position | observer/listener |
| Editing | input editState | active row/column | one draft/errors | focus/editor chunk |
| Expansion/grouping | applied inputs | render entries/aggregates | none | announcement |

Pipeline: `input → normalize/computed → render`. Los transitions de usuario son funciones puras que devuelven proposal. No hay effects para copiar inputs a writable signals ni cadenas de effects entre slices.

## 23. Effects ledger

Solo se autorizan cuatro fronteras:

1. **Request coordinator:** observa query/range aplicado en browser remote, deduplica y emite una intención. No corre SSR.
2. **Viewport lifecycle:** instala y limpia un scroll listener pasivo y ResizeObserver solo con virtualization enabled.
3. **Focus restoration:** mueve foco DOM tras reciclado virtual/edición cuando la coordenada lógica sigue vigente.
4. **Optional feature loader:** carga y libera chunks privados cuando aparece una capability avanzada.

Outputs por click/keyboard se emiten en handlers, no effects. aria-live se actualiza con una señal efímera en el mismo transition. Cada effect tendrá test de cleanup y contador en el gate de 50 ciclos.

## 24. A11y

Basic usa `<table>`, `<thead>`, `<tbody>`, `<th scope>` y `<td>` nativos. `role="grid"` solo se activa con navigation cells; esa decisión está disponible en SSR desde `interactionOptions`. No se parchea ARIA post-render.

Headers exponen aria-sort aplicado; filas aria-selected/disabled/expanded cuando corresponde; controles radio/checkbox conservan semántica nativa. Virtual usa aria-rowcount solo con total conocido y aria-rowindex lógico. Loading marca aria-busy, empty es status, error es alert/status recuperable y retry tiene label. Rowspan/colspan, pinned y grupos mantienen relaciones de encabezado verificables.

## 25. Keyboard

| Feature | Contract |
| --- | --- |
| Navigation rows/cells | Arrow keys, Home/End; Ctrl/Cmd+Home/End solo en grid; un roving tabindex. |
| Selection | Space; Shift extiende rango; Ctrl/Cmd+A solo multiple y scope configurado. |
| Checkbox/radio | Semántica nativa Space; no doble handler en row. |
| Sorting | Enter/Space en button de header; modifier añade prioridad en multiple. |
| Filters | Tab natural; Enter apply cuando procede; Escape cierra menu/builder sin aplicar. |
| Editing | Enter/F2 inicia; Enter commit salvo multiline; Escape cancel; Tab commit/move. |
| Expansion | Enter/Space sobre toggle; row Enter no roba el editor. |
| Menus | Patrón menu estándar; foco vuelve al invocador. |
| Virtual focus | Movimiento fuera de ventana materializa range y restaura coordenada lógica. |

Los descendientes interactivos conservan sus teclas. No se crean shortcuts distintos por pointer/keyboard ni se captura texto/cursores de inputs.

## 26. SSR

SSR produce markup semántico completo con IDs deterministas y nunca emite `dataRequest`. No se evalúan window/document/ResizeObserver/Storage/Router. Un remote consumer puede prerenderizar data+metadata; Table refleja loading/error/total sin inferirlos.

Chunks opcionales no se cargan durante SSR salvo que exista contenido semántico necesario y SSR-safe. Templates, row/column relationships y aria-sort salen correctos desde servidor.

## 27. Hydration

El cliente debe reutilizar nodos SSR. Query revision inicial es 0. Si data/metadata SSR cubren query y renderRange, no hay request; si no, se programa un único initial después de hidratación. No se genera ID diferente ni se mide layout antes de que el browser esté listo.

Gates: DOM reuse, cero NG050x, cero request duplicado, parent-write-no-echo y primera interacción exactly-once para sort/filter/page/selection/edit/expand/virtual.

## 28. Zoneless

Todas las mutaciones UI atraviesan signals, inputs y handlers Angular. Observers/listeners actualizan señales dentro del contexto de la instancia y se destruyen con `DestroyRef`. No se usa Zone.js, `detectChanges()` periódico ni timers para forzar render.

Debounce de filtros y resize scheduler son recursos explícitos con cleanup; tests usan `provideZonelessChangeDetection()` en client, SSR e hidratación.

## 29. Performance scenarios

Antes de N2-011B se re-mide baseline Angular 22 en el mismo hardware/toolchain:

1. 1k rows basic y 100 updates inmutables.
2. 10k rows client: single/multi sort, global/column filters y selección.
3. 100k logical rows con virtual fixed-height y scroll programático.
4. Remote+virtual: query acceptance, rapid viewport, stale/out-of-order y retry.
5. Cell/row editing, expansion/grouping y layout changes.
6. 50 mount/unmount cycles y 50 ciclos de cada overlay opcional.

Medir raw/gzip/brotli, render p50/p95, interacción p50/p95, DOM row/cell count, computed/effects, listeners, observers, timers, heap/resources y requests. Gates: DOM acotado; exactamente un request por transición; cero recursos vivos tras destroy; ninguna regresión comprimida >5% por consumer comparable sin design review. No se inventa latencia absoluta antes del baseline.

## 30. Bundle/tree-shaking architecture

El basic closure está compuesto solo por Angular Core/Common, fachada, renderer y motores puros mínimos. Debe excluir Router, Forms, CDK, controles Neural, export y advanced editors/filters.

Virtualization, advanced filters/editors y export son imports dinámicos privados con chunks verificables. Remote coordinator pequeño puede permanecer en base, pero no transports. CI mide:

- `table-basic` usando `<neu-table>` real;
- client query/selection;
- remote;
- virtual lazy chunk;
- advanced filter/editor chunk;
- export chunk;
- aggregate y root-unused.

La antigua cifra TableCore se conserva solo como baseline histórico, no como entrypoint objetivo.

## 31. Visual/UX architecture

La estructura nueva debe soportar:

- jerarquía clara de caption/toolbar/header/filter/body/footer;
- densidades compact/normal/relaxed sin cambiar semántica;
- selección visible sin depender solo de color;
- hover subordinado a focus/selected/error/editing;
- focus ring continuo en celdas, controles y filas virtuales;
- sort priority legible y screen-reader text;
- loading skeleton no interactivo, empty accionable y error con retry;
- group rows y edit drafts visualmente distintos;
- placeholders virtuales inertes;
- contained horizontal overflow y modo stacked explícito.

CSS tokens existentes siguen siendo base; N2-011B define la estructura DOM/tokens necesarios, no copia Prime ni congela el look 1.x.

## 32. PrimeNG baseline mapping

La matriz existente contiene 70 casos Table: 55 PARITY, 13 REDESIGN —incluida F-031, cuya celda histórica está desplazada—, 1 SUPERIOR y 1 OUT OF SCOPE. Destino P1:

- DATA/STATE F-001…010 → data/metadata, query controlada, retry y adapters externos.
- SORT/FILTER/PAGINATION F-011…030 → query AST + policies únicas.
- SELECTION F-031…037 → selection discriminada, keys/all-matching y keyboard.
- EDITING/EXPANSION/GROUPING F-038…045 → slices aplicados + drafts/templates.
- COLUMNS/ROWS F-046…054 → columns/layout/rowOptions/proposals.
- VIRTUAL F-055…059 → rangos half-open, DOM O(window), fixed-height.
- TEMPLATES/RESPONSIVE F-060…063 → renderer/directivas públicas tipadas.
- EXPORT F-064…065 → chunk CSV/JSON/XLSX.
- A11Y/PERF/API F-066…070 → semántica SSR, budgets, T/K/F y auxiliares públicos mínimos.

Cada ID debe pasar un consumer equivalente; añadir un input no cierra una fila.

## 33. Superiority opportunities

Objetivos medibles, todavía no claims:

- un solo query y un solo request frente a canales paralelos;
- selección all-matching remota sin enumerar el dataset;
- T/K/F y contexts tipados sin `any` de dominio;
- rechazo controlado real con UI aplicada estable;
- SSR/hydration sin request duplicado;
- Table básica sin Router/Forms/CDK/export;
- JSON/XLSX además de CSV mediante chunks;
- menos superficie: 24/14/4 frente a 96/38/32 entre fachadas actuales;
- cero DOM scans para semántica o focus.

Solo se documentarán como superioridad tras N2-011J.

## 34. Out-of-scope

- variable-height real, virtualización horizontal y 2D: N2-036;
- TreeTable/treegrid, lazy children y selección jerárquica;
- grouping/aggregations remotos server-driven P1;
- pivot, spreadsheet formulas, clipboard matrix y Excel-like fill;
- HTTP, cache backend, abort/retry policy de red;
- Router/storage ownership o adapters runtime Neural;
- compatibilidad Prime, aliases 1.x o wrappers TableCore;
- styling final/showcase en esta tarea.

## 35. API before/after metrics

| Métrica pública | 1.x Table | 1.x TableCore | 1.x combinado | Table 2 target |
| --- | ---: | ---: | ---: | ---: |
| Componentes Table | 1 | 1 | 2 | 1 |
| Inputs | 80 | 16 | 96 | 24 |
| Outputs | 38 | 0 | 38 | 14 |
| Métodos públicos | 32 | 0 | 32 | 4 |
| Exports del entrypoint | 158 | 16 | 174 | 82 (66 tipos + 15 directivas + componente) |
| Representaciones solapadas de state/transport | 12 familias | 0 | 12 | 0 |
| Slices controlados | parcial/mixto | 0 | parcial/mixto | 6, un owner cada uno |

Los 82 exports no son un objetivo cosmético: cubren exactamente el componente, 15 directivas de template y 66 tipos del ledger conceptual. Cualquier export adicional necesita caso de consumidor y design review.

## 36. Removal ledger

### Entrypoint y símbolos

- REMOVE: `@neural-ui/core/table-core`, `NeuTableCoreComponent`, `NeuTableCore*` directives/types.
- REWRITE: `NeuTableComponent`, `NeuTableColumn` y todos los contexts.
- No compatibility layer, alias ni re-export desde table.

### Inputs 1.x

- KEEP NAME/CHANGE TYPE: `columns`, `data`, `query`, `rowKey`, `rowTrackBy`.
- MERGE → metadata/dataMode/rowOptions: `frozenData`, `loading`, `totalItems`, `serverSide`, `dataFirst`, `lazyLoadOnInit`, `rowClass`, `rowReorderable`, `reorderableRows`, `contextMenu`, `contextMenuRowDisabled`, `contextMenuSelection`.
- MERGE → query/sortOptions/filterOptions: `pageSize`, `searchable`, `advancedFilterMode`, `filterDisplay`, `filterLabelDisplay`, `advancedFilterTexts`, old `filterOptions`, `exactMatchable`, `sortable`, `defaultSortOrder`, `resetPageOnSort`, `removableSort`, `sort`, `globalFilterFields`, `multiSort`.
- MERGE → selection/selectionOptions: `selectable`, `compareSelectionBy`, `selection`, `rowSelectable`, `selectAllScope`, `selectOnRowClick`, `metaKeySelection`, `selectionActions`.
- MERGE → expandedKeys/expansionOptions/grouping: `expandMode`, `expandedRowKeys`, `groupBy`, `rowGroupMode`, `groupRowsByOrder`, `expandableRowGroups`, `expandedGroupKeys`.
- MERGE → paginationOptions/query: `pagination`, `pageSizeOptions`, `paginatorPosition`, old `paginatorOptions`.
- MERGE → virtualizationOptions/appearance: `stickyHeader`, `scrollHeight`, `virtualScroll`, old `virtualizationOptions`.
- MERGE → layout/columns: `resizableColumns`, `columnResizeMode`, `reorderableColumns`, `columnChooser`, `initialLayout`.
- MERGE → editingOptions/editState/columns: `editMode`, `editingRowKeys`, `editingCell`, `cellEditValidator`, `rowEditValidator`.
- MERGE → appearance/labels/templates: `title`, `emptyMessage`, `labels`, `tableAriaLabel`, `bordered`, `roundedBorders`, `stripedRows`, `density`, `showRowNumbers`, `footerRow`, old `exportOptions`.
- REMOVE TO APP ADAPTER: `urlState`, `urlStateOptions`, `stateKey`, `stateStorage`.

### Outputs 1.x

- MERGE → `selectionChange`: `selectionChange`, `rowSelect`, `rowUnselect`, `selectAllChange`.
- MERGE → `expandedKeysChange`: `expandedRowKeysChange`, `rowExpand`, `rowCollapse`.
- MERGE → `rowAction`: `rowClick`, `rowDblClick`, `actionClick`, `selectionActionClick`, `contextMenuSelect`, `contextMenuSelectionChange`.
- REMOVE/REPLACE → query/dataRequest: `serverStateChange`, `lazyRequest`, `searchChange`, `sortChange`, `pageChange`.
- RENAME/CHANGE → `rangeChange`: `virtualScrollEvent`.
- MERGE → `layoutChange`: `columnResize`, `columnReorder`.
- KEEP CONCEPT/CHANGE PAYLOAD: `rowReorder`.
- MERGE → edit outputs: `cellEditCommit`, `cellEditInit`, `cellEditCancel`, `editValidationError`, `editingRowKeysChange`, `editingCellChange`, `rowEditInit`, `rowEditSave`, `rowEditCancel`.
- MERGE → `groupingChange`: `expandedGroupKeysChange`, `groupExpand`, `groupCollapse`.
- REMOVE TO APP ADAPTER: `stateSave`, `stateRestore`.

### Métodos 1.x

- REMOVE state setters: `goToPage`, `sortBy`, `setColumnFilter`, `clearColumnFilters`, `clearSearch`, `setExactMatch`, `selectRow`, `unselectRow`, `clearSelection`, `toggleAll`, `expandRow`, `collapseRow`, `toggleExpand`, `applyLayout`, `startCellEdit`, `cancelCellEdit`, `commitCellEdit`, `startRowEdit`, `cancelRowEdit`, `saveRowEdit`.
- REMOVE persistence: `saveState`, `restoreState`, `clearState`, `resetState`, `currentState`.
- REMOVE direct export variants: `exportCsv`, `exportJson`, `exportXlsx`; usar `export(request)`.
- REPLACE: `scrollToIndex`, `scrollToOffset`, `resetVirtualScroll` → `scrollTo(target)`.
- REMOVE projection getter: `currentLayout`; layout input es autoridad.

## 37. Migration examples

### Simple 1.x → 2.x

```html
<neu-table
  [data]="rows"
  [columns]="columns"
  [query]="query()"
  (queryChange)="query.set($event)"
  [rowKey]="rowKey"
/>
```

### Server 1.x → remote

```html
<neu-table
  dataMode="remote"
  [data]="rows()"
  [metadata]="metadata()"
  [query]="query()"
  (queryChange)="acceptQuery($event)"
  (dataRequest)="load($event)"
/>
```

El handler descarta respuestas cuya `queryRevision` no sea actual o cuyo requestId sea anterior al aplicado.

### Selection rows → selection keys

```ts
selection = signal<NeuTableSelection<CustomerId, CustomerField>>({
  kind: 'keys',
  keys: legacySelectedRows.map(row => row.id),
});
```

### Sorting/filtering → query

```ts
query = signal<NeuTableQuery<CustomerField>>({
  page: 0,
  pageSize: 25,
  search: legacySearch,
  sort: legacySort ? [{ field: legacySort.key, direction: legacySort.dir }] : [],
  filters: convertLegacyFiltersOnce(legacyFilters),
});
```

El converter vive en la aplicación/migración y se elimina al terminar; no se empaqueta.

### Virtual 1.x → range contract

```html
<neu-table
  [virtualizationOptions]="{ enabled: true, itemSize: 44, overscan: 4, requestStep: 50 }"
  (rangeChange)="observeRange($event)"
  (dataRequest)="loadWindow($event)"
/>
```

### stateStorage/urlState → app adapter

```ts
effect(() => routerAdapter.write({
  query: query(),
  selection: selection(),
  layout: layout(),
}));
```

Table no conoce el adapter. La app restaura sus signals antes de render/hydration.

### TableCore consumer → NeuTable basic

```html
<neu-table
  [data]="rows"
  [columns]="columns"
  [query]="staticQuery"
  [rowKey]="rowKey"
  [appearance]="basicAppearance"
/>
```

No existe selector, módulo o import alternativo.

## 38. Implementation subphases

El orden exacto se congela en [N2-TABLE2-IMPLEMENTATION-PLAN.md](./N2-TABLE2-IMPLEMENTATION-PLAN.md): N2-011A contratos/harness; B renderer/fachada; C query/client; D columns/layout/selection; E filtros/sort/pagination; F remote; G virtual; H editing/expansion/grouping; I optional/export; J a11y/performance/bundle; K retirada física y certificación.

Este desglose supersede la ejecución gruesa anterior de N2-011…014 sin perder sus obligaciones.

## 39. Gate per subphase

Cada subfase exige tests/type tests dirigidos y `git diff --check`. Los checkpoints con certificación amplia son:

- N2-011B: nueva fachada básica funcional, SSR y bundle basic.
- N2-011F/G: remote+virtual, stale/dedupe, hydration y lifecycle.
- N2-011J/K: suite Table completa, matriz F-001…070, navegadores, a11y, performance, package/imports/contracts y eliminación pública.

No se ejecuta coverage global en cada slice. No se elimina Table/TableCore antiguo hasta que el sustituto equivalente haya pasado su gate; tampoco se publica una versión intermedia con ambas APIs.

## 40. Risks

| Riesgo | Mitigación/gate |
| --- | --- |
| Reescritura pierde parity histórica | Matriz F-001…070 y 669 tests actuales como inventario de comportamiento, no como contrato de código. |
| Una sola fachada infla basic bundle | renderer privado mínimo + chunks + import graph gate. |
| Controlled proposals resultan verbosos | ejemplos y helpers de estado en app; no model/owner oculto. |
| all-matching se usa con scope stale | scope inmutable y consumer/backend valida fingerprint semántico. |
| data/metadata remote llegan separados | consumer aplica en un mismo update; Table rechaza revision no actual. |
| Virtual focus/hydration divergen | IDs deterministas, range SSR estable, browser measurement posterior y DOM reuse test. |
| Optional dynamic chunk falla | `featureError`, UI fallback accesible y retry explícito. |
| CSS rewrite rompe enterprise layout | renderer B antes de features, visual scenarios y responsive/high-contrast gates. |

## 41. Open decisions

No quedan decisiones públicas o de ownership abiertas. Quedan tres calibraciones no bloqueantes que deben resolverse con evidencia sin cambiar el contrato:

1. baseline Angular 22 exacto para latencia/memoria/bundle en N2-011A;
2. elección interna entre Angular `@defer` y loader `import()` para cada chunk, validando que el resultado sea realmente separado;
3. umbral de promoción de un requestStep distinto de 50 para datasets medidos; el default permanece 50 hasta evidencia.

Cualquier necesidad de segundo canal remoto, segundo state model, API TableCore pública o variable-height cambia arquitectura y requiere design review.

## 42. Final recommendation

**APPROVED FOR IMPLEMENTATION.**

NeuTable 2 queda congelada como una única fachada pública, controlada, tipada y Angular 22-native, con renderer privado, query/request únicos, selección remota representable y features pesadas separadas. Puede comenzar N2-011A cuando exista autorización explícita. Esta tarea no implementa N2-011 ni modifica código productivo.
