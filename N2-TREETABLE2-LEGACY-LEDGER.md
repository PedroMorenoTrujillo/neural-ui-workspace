# NeuTreeTable 2 — Legacy 42/21/8 ledger

## Authority

Este ledger clasifica exclusivamente las dependencias incompatibles que bloquearon N2-011K: 42 bindings de input, 21 bindings de output y ocho llamadas imperativas desde TreeTable 1.x a Table 1.x. No es un plan de compatibilidad. No existe destino `DEPRECATE`.

El componente TreeTable 1.x completo tiene además 49 inputs, 25 outputs y nueve métodos públicos propios. Esas métricas describen la fachada legacy; el conjunto 42/21/8 describe el acoplamiento bloqueante con Table 1.x.

## 42 inputs legacy delegados

|   # | Legacy                   | Purpose                         | Family     | Decision     | Target destination                    | Migration note                                      |
| --: | ------------------------ | ------------------------------- | ---------- | ------------ | ------------------------------------- | --------------------------------------------------- |
|   1 | `sort`                   | Orden aplicado separado         | Query      | MERGE        | `query.sort`                          | Convertir a ordered sibling sort; no segundo owner. |
|   2 | `title`                  | Título visual                   | Templates  | REMOVE       | `neuTreeTableCaption`                 | Migrar contenido a template semántico.              |
|   3 | `tableAriaLabel`         | Nombre accesible                | A11y       | RENAME       | `labels.ariaLabel`                    | Aplicar directamente al `treegrid` SSR.             |
|   4 | `searchable`             | Mostrar búsqueda                | Query UI   | MERGE        | `filterOptions.surfaces/globalFields` | La query sigue parent-owned.                        |
|   5 | `exactMatchable`         | Toggle exact match              | Filters    | REMOVE       | Filter AST rule                       | Usar `equals`/`contains`; no hidden mode.           |
|   6 | `advancedFilterTexts`    | Textos del builder              | Labels     | MERGE        | `labels` + private builder            | Solo labels realmente usados.                       |
|   7 | `loading`                | Loading global                  | Remote     | MERGE        | `hierarchy.roots.status`              | Loading por relación, parent-owned.                 |
|   8 | `pagination`             | Activa paginator                | Pagination | MERGE        | `paginationOptions.enabled`           | Pagina raíces únicamente.                           |
|   9 | `pageSize`               | Tamaño de página                | Query      | MERGE        | `query.pageSize`                      | Cuenta raíces; zero-based page.                     |
|  10 | `pageSizeOptions`        | Opciones de tamaño              | Pagination | MERGE        | `paginationOptions.pageSizeOptions`   | No afecta flattened rows.                           |
|  11 | `selectable`             | Modo de selección               | Selection  | MERGE        | `selectionOptions.mode`               | Selección por `K`, no por filas.                    |
|  12 | `rowSelectable`          | Elegibilidad                    | Selection  | CHANGE       | `selectionOptions.isNodeDisabled`     | Invertir semántica y tipar con `T`.                 |
|  13 | `metaKeySelection`       | Política modifier               | Selection  | MERGE        | `selectionOptions.modifier`           | `platform` explícito.                               |
|  14 | `selectionActions`       | Acciones de selección embebidas | Actions    | REMOVE       | Toolbar consumer                      | No array de acciones dentro del core.               |
|  15 | `stickyHeader`           | Header sticky                   | Appearance | MERGE        | `appearance.stickyHeader`             | Mismo concepto, config cohesionada.                 |
|  16 | `stripedRows`            | Filas alternas                  | Appearance | MERGE        | `appearance.striped`                  | Rename mecánico.                                    |
|  17 | `bordered`               | Bordes                          | Appearance | MERGE        | `appearance.borders`                  | Enum explícito.                                     |
|  18 | `roundedBorders`         | Bordes redondeados              | Appearance | REMOVE       | Tokens/theme                          | No estado de dominio ni input P1.                   |
|  19 | `sortable`               | Habilita sort                   | Sort       | MERGE        | columns + `sortOptions`               | Sortability vive en column contract.                |
|  20 | `multiSort`              | Orden múltiple                  | Sort       | MERGE        | `sortOptions.mode`                    | `multiple` aplica por siblings.                     |
|  21 | `expandMode`             | Row-detail expansion            | Expansion  | REMOVE       | —                                     | Tree expansion es el único expanded concept P1.     |
|  22 | `exportOptions`          | Config export legacy            | Export     | CHANGE       | `exportOptions`                       | Scopes/formats nuevos; sin engines legacy.          |
|  23 | `virtualScroll`          | Flag virtual                    | Virtual    | MERGE        | `virtualizationOptions.enabled`       | Fixed-height sobre visible loaded sequence.         |
|  24 | `resizableColumns`       | Resize                          | Layout     | MERGE        | layout interaction policy             | Proposal `layoutChange`; no write interno.          |
|  25 | `reorderableColumns`     | Reorder columnas                | Layout     | MERGE        | layout interaction policy             | No confundir con tree row DnD.                      |
|  26 | `columnChooser`          | Visibilidad UI                  | Layout     | INTERNALIZE  | Private layout UI                     | Applied state sigue en `layout`.                    |
|  27 | `groupBy`                | Grouping plano                  | Grouping   | OUT OF SCOPE | —                                     | Árbol ya es jerárquico; no grouping P1.             |
|  28 | `editMode`               | Modo edición                    | Editing    | MERGE        | `editingOptions.mode`                 | Session privada por `K + columnId`.                 |
|  29 | `editingRowKeys`         | Keys editando                   | Editing    | MERGE        | `editState`                           | Un applied edit contract controlado.                |
|  30 | `rowEditValidator`       | Validación                      | Editing    | MERGE        | `editingOptions.validate`             | Valida `T`/draft sin mutar.                         |
|  31 | `initialLayout`          | Layout inicial                  | Layout     | RENAME       | `layout`                              | Applied input; no “initial” owner interno.          |
|  32 | `showRowNumbers`         | Columna técnica                 | Columns    | REMOVE       | Consumer column                       | No columna implícita P1.                            |
|  33 | `density`                | Densidad                        | Appearance | MERGE        | `appearance.density`                  | Controlled config.                                  |
|  34 | `rowClass`               | Clase de nodo                   | Rows       | MERGE        | `rowOptions.className`                | Recibe `T` limpio.                                  |
|  35 | `footerRow`              | Fila footer data                | Templates  | CHANGE       | `neuTreeTableFooter`                  | Template column-aware, no record arbitrario.        |
|  36 | `serverSide`             | Modo remote                     | Remote     | RENAME       | `dataMode='remote'`                   | No renderer mode oculto.                            |
|  37 | `totalItems`             | Total ambiguo                   | Pagination | MERGE        | `hierarchy.roots.total`               | Total de raíces, nunca visible nodes.               |
|  38 | `urlStateOptions`        | Persistencia integrada          | State      | REMOVE       | External adapter recipe               | Sin Router/storage runtime.                         |
|  39 | `contextMenu`            | Overlay delegado                | Actions    | CHANGE       | `rowAction` + app overlay             | No dependencia de directive runtime.                |
|  40 | `contextMenuRowDisabled` | Policy context menu             | Actions    | MERGE        | `interactionOptions`/app policy       | Resolver antes de abrir overlay.                    |
|  41 | `contextMenuSelection`   | Selección paralela              | Selection  | REMOVE       | `rowAction`                           | No segundo owner de selección.                      |
|  42 | `emptyMessage`           | Texto vacío                     | Labels     | MERGE        | `labels.empty`                        | SSR-safe.                                           |

## 21 outputs legacy delegados

|   # | Legacy                       | Purpose                | Family    | Decision | Target destination         | Migration note                                      |
| --: | ---------------------------- | ---------------------- | --------- | -------- | -------------------------- | --------------------------------------------------- |
|   1 | `rowSelect`                  | Detalle select         | Selection | MERGE    | `selectionChange`          | `addedKeys/loadedValues` cubren detalle.            |
|   2 | `rowUnselect`                | Detalle unselect       | Selection | MERGE    | `selectionChange`          | `removedKeys` cubre detalle.                        |
|   3 | `rowClick`                   | Click nodo             | Actions   | MERGE    | `rowAction`                | `source='click'`.                                   |
|   4 | `rowDblClick`                | Double click nodo      | Actions   | MERGE    | `rowAction`                | `source='double-click'`.                            |
|   5 | `actionClick`                | Acción de fila         | Actions   | MERGE    | `rowAction`                | El consumer decide command/action.                  |
|   6 | `selectionActionClick`       | Acción sobre selección | Actions   | REMOVE   | Consumer toolbar           | La selección aplicada está disponible externamente. |
|   7 | `sortChange`                 | Proposal sort          | Query     | MERGE    | `queryChange`              | Único query proposal.                               |
|   8 | `lazyRequest`                | Canal remote           | Remote    | RENAME   | `dataRequest`              | Unión `roots                                        | children`; IDs/revisions. |
|   9 | `searchChange`               | Proposal search        | Query     | MERGE    | `queryChange`              | Único query proposal.                               |
|  10 | `columnResize`               | Resize detail          | Layout    | MERGE    | `layoutChange`             | `source='resize'`.                                  |
|  11 | `columnReorder`              | Reorder detail         | Layout    | MERGE    | `layoutChange`             | `source='reorder'`.                                 |
|  12 | `cellEditCommit`             | Commit cell            | Editing   | RENAME   | `editCommit`               | Payload tipado `T,K,F`.                             |
|  13 | `cellEditInit`               | Inicio cell edit       | Editing   | MERGE    | `editStateChange`          | Applied state sigue parent-owned.                   |
|  14 | `cellEditCancel`             | Cancel cell edit       | Editing   | RENAME   | `editCancel`               | Reason explícita.                                   |
|  15 | `editValidationError`        | Error validación       | Editing   | REMOVE   | Consumer validation result | No convertir `featureError` en catch-all.           |
|  16 | `editingRowKeysChange`       | Cambio keys edición    | Editing   | MERGE    | `editStateChange`          | Un solo edit state.                                 |
|  17 | `contextMenuSelectionChange` | Selección context menu | Selection | REMOVE   | —                          | Elimina owner paralelo.                             |
|  18 | `contextMenuSelect`          | Acción context menu    | Actions   | MERGE    | `rowAction`                | `source='context-menu'`, data-oriented.             |
|  19 | `rowEditInit`                | Inicio row edit        | Editing   | MERGE    | `editStateChange`          | No lifecycle paralelo.                              |
|  20 | `rowEditSave`                | Save row edit          | Editing   | RENAME   | `editCommit`               | `source='row'`.                                     |
|  21 | `rowEditCancel`              | Cancel row edit        | Editing   | RENAME   | `editCancel`               | Un solo cancel contract.                            |

## Ocho métodos Table 1.x invocados por TreeTable 1.x

|   # | Legacy                 | Purpose                | Family  | Decision    | Target destination                   | Migration note                          |
| --: | ---------------------- | ---------------------- | ------- | ----------- | ------------------------------------ | --------------------------------------- |
|   1 | `exactMatch()`         | Lee mode interno       | Filters | REMOVE      | Query/filter contracts               | Nunca leer estado privado del renderer. |
|   2 | `resetVirtualScroll()` | Reset viewport         | Virtual | MERGE       | `scrollTo({kind:'offset',offset:0})` | Command único.                          |
|   3 | `scrollToIndex()`      | Scroll por índice flat | Virtual | MERGE       | `scrollTo({kind:'index'})`           | Índice de visible projection.           |
|   4 | `scrollToOffset()`     | Scroll por offset      | Virtual | MERGE       | `scrollTo({kind:'offset'})`          | Offset fixed-height.                    |
|   5 | `resetState()`         | Reset interno          | State   | REMOVE      | Parent writes                        | Consumer aplica query/layout/selection. |
|   6 | `startRowEdit()`       | Inicio imperativo      | Editing | REMOVE      | Applied `editState`                  | El parent acepta el proposal.           |
|   7 | `saveRowEdit()`        | Save imperativo        | Editing | INTERNALIZE | Editor gesture → `editCommit`        | No method público especializado.        |
|   8 | `cancelRowEdit()`      | Cancel imperativo      | Editing | INTERNALIZE | Editor gesture → `editCancel`        | No method público especializado.        |

## TreeTable 1.x full public surface baseline

El AST actual registra:

- 49 inputs;
- 25 outputs;
- nueve métodos públicos (`toggleNode`, `resetScrollTop`, `scrollToVirtualIndex`, `scrollTo`, `scrollToNode`, `reset`, `startRowEdit`, `saveRowEdit`, `cancelRowEdit`).

NeuTreeTable 2 target reduce esa superficie a 22 inputs, 12 outputs y cuatro métodos. La reducción proviene de ownership controlado y agrupación cohesionada; no de un objetivo numérico previo.

## Breaking families

- **REMOVED:** Table composition, embedded selection actions, row detail mode, grouping, row numbers, URL/storage, context-menu selection y state-reset methods.
- **CHANGED:** hierarchy/data split, query root semantics, remote protocol, selection by K, editing, export y templates.
- **MERGED:** sort/search → query; selection detail → selectionChange; layout events → layoutChange; edit lifecycle → editState/editCommit/editCancel; row/context actions → rowAction.
- **RENAMED:** serverSide → dataMode; lazyRequest → dataRequest; initialLayout → layout.
- **INTERNALIZED:** column chooser UI, edit save/cancel commands, hierarchy metadata y virtual/focus mechanics.
- **OUT OF SCOPE P1:** flat grouping, row detail y tree drag/reparent.

## Proof and gate

El future static gate debe parsear el template/runtime final y fallar si reaparece cualquiera de estos bindings o calls, si existe un import runtime a `@neural-ui/core/table`, `table-core`, Table 1.x o TreeTable 1.x, o si el único remote output deja de ser `dataRequest`.
