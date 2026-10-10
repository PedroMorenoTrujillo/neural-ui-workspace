# N2-011J — NeuTable 2 final certification

## 1. Executive status

**CERTIFIED FOR N2-011K.** No queda gap P1, drift de API, owner duplicado, petición duplicada, mismatch de hidratación, request SSR, DOM virtual no acotado, leak reproducido, violación a11y crítica, retención de serializer opcional ni dependencia de Table 1.x/TableCore en la candidata.

J encontró y corrigió dos gaps P1 reales: `rowAction` y `rowReorder` existían en el contrato congelado pero no tenían path productivo de emisión. Se añadieron únicamente bindings internos y tests de propuesta exactly-once; no se amplió la superficie pública.

## 2. Certified checkpoint

Base certificada: `0f91778dd5b2931f22a86e41db162eeefb42ecb8` (`feat(table): implement N2-011I optional export`), parent H `5e18038a2e3dc4784615facf9dc7ae2396c8a381`, rama `v2`.

La certificación cubre el working tree J sin commit. No se inició K, no se cambió el entrypoint público final y no se eliminó código legacy.

## 3. API freeze

| Superficie     |               Resultado |
| -------------- | ----------------------: |
| Tipos públicos |                      66 |
| Directivas     |                      15 |
| Componentes    | 1 (`NeuTableComponent`) |
| Símbolos       |                      82 |
| Inputs         |                      24 |
| Outputs        |                      14 |
| Métodos        |                       4 |

`test:n2-table-types`, `test:n2-table-contracts`, `audit:n2-table-ledger`, contract snapshot y build pasan. No hay alias legacy, nuevo entrypoint, nuevo método ni contract drift.

## 4. Ownership matrix

| Slice        | Applied input  | Proposal output      | Domain events                                     | Computed state                            | Ephemeral state                      |
| ------------ | -------------- | -------------------- | ------------------------------------------------- | ----------------------------------------- | ------------------------------------ |
| data         | `data`         | —                    | `dataRequest` solicita; nunca aplica              | partitions, projected/render rows         | remote correlation only              |
| metadata     | `metadata`     | —                    | `dataRequest`, `rangeChange`                      | presented metadata, totals/ranges         | request coordinator                  |
| query        | `query`        | `queryChange`        | `dataRequest` tras aceptación                     | normalized/effective query, client stages | search/filter drafts                 |
| selection    | `selection`    | `selectionChange`    | `rowAction` separado                              | exact-K projection/header state           | range anchor/control gesture         |
| layout       | `layout`       | `layoutChange`       | `rowReorder` separado                             | visible/order/pin/width projection        | drag/resize preview/focus token      |
| expandedKeys | `expandedKeys` | `expandedKeysChange` | —                                                 | detail membership                         | focus target                         |
| editState    | `editState`    | `editStateChange`    | `editCommit`, `editCancel`, scoped `featureError` | active session view                       | private draft, validation generation |
| grouping     | `grouping`     | `groupingChange`     | —                                                 | private synthetic group nodes             | toggle gesture                       |

No existe writable mirror de input ni owner oculto. Export no escribe ningún slice.

## 5. Signal graph

Los 24 inputs son signals aplicadas. El facade deriva query, rows, selección, layout, virtual ranges, grouping y templates mediante `computed`. Los writable signals privados se limitan a browser activation, retry token, coordinator version, viewport geometry y estado efímero del renderer (drafts, menú, drag/resize). No existe effect input→writable.

`afterNextRender` se usa nueve veces para activar browser tras SSR, medir/fijar viewport y restaurar foco después de montaje, menú, reorder, resize o editor. Ningún callback posee domain state.

## 6. Effects ledger

El censo estático encuentra exactamente dos `effect()` productivos:

1. `neu-table.component-contract.ts`: transición del remote request coordinator; cleanup por `DestroyRef`, currentness y dedupe.
2. `neu-table-basic-renderer.component.ts`: lifecycle del viewport; instala y retira un scroll listener, un `ResizeObserver` y como máximo un rAF.

No existe effect de export, edición, filtros, selección, layout o state mirroring.

## 7. Client pipeline

Orden certificado: data → search → filter AST → stable sort → grouping hook → pagination si no virtual → fixed virtual window → renderer. Las funciones son puras, no mutan fixtures congelados y remote hace bypass completo. Los contadores verifican que scroll no repite search/filter/sort/grouping.

## 8. Search

PASS: NFKC, trim, colapso de whitespace, lowercase, únicamente `globalFields`, precedencia del accessor congelado y valores heterogéneos. No hay `Object.keys`, `JSON.stringify(row)`, dot-path magic ni resolver alternativo.

## 9. Filters

PASS para las 17 rules exactas (`equals`, `notEquals`, `contains`, `notContains`, `startsWith`, `endsWith`, `lessThan`, `lessThanOrEqual`, `greaterThan`, `greaterThanOrEqual`, `between`, `in`, `notIn`, `isNull`, `isNotNull`, `isEmpty`, `isNotEmpty`). Nested AND/OR, null/empty, runtime rule inválida, AST congelado y las superficies row/menu/builder comparten el mismo engine.

## 10. Sorting

PASS: estabilidad, single/multiple, prioridades, nullish, NaN, fechas válidas/inválidas, valores heterogéneos, comparator custom, first-entry de single y supresión same-state. UI y engine usan las mismas transiciones.

## 11. Pagination

PASS: `query.page` zero-based, presentación one-based, preservación del primer índice visible al cambiar pageSize, valores inválidos/out-of-range sin autocorrección, totals client/remote y precedencia de virtualización sobre paginación.

## 12. Query UI

Sort, search, filter row/menu/builder, page y pageSize producen propuestas controladas. Una propuesta rechazada deja pipeline y visual applied sin cambios; la aceptación produce una actualización lógica y cero echo. El builder sigue privado y lazy. Se ejecutaron 100 ciclos de apertura/cierre del menú sin propuesta ni estado retenido.

## 13. Selection

PASS: keys, all-matching, single/multiple, range/modifiers, disabled, row click, radio/checkbox/header, rendered/page/loaded scopes, offscreen/unloaded keys, objetos reconstruidos y exact K. El owner nunca es un array de `T`.

## 14. All-matching

Permanece simbólico (`scope` + exclusions), congelado a query, independiente de viewport/paginación y apto para remote. No enumera backend, no materializa miles de keys y export global/selected no cargado delega por `exportRequest`.

## 15. Layout

PASS: order, visibility, widths, pointer/keyboard resize, column reorder por drag y botones, pinning logical/RTL, rechazo/aceptación, focus restoration y duplicate IDs. Los cambios de layout no recalculan el pipeline. Row reorder emite una propuesta `NeuTableRowMove` sin mutar data.

## 16. Remote state machine

PASS: initial/query/viewport/retry, requestId, queryRevision, semantic y same-query dedupe, stale response/range, out-of-order, transición client↔remote y currentness. No HTTP, cache, Router ni storage ownership.

## 17. Request/range correlation

Secuencia observada: interacción → `queryChange` → aceptación parent → input query → `dataRequest`. Rechazo produce 0 requests. SSR produce 0; hydration satisfied 0 duplicate; unsatisfied 1 initial; query/retry/viewport, uno cada uno. Ranges son half-open y request/render/visible se correlacionan sin eco.

## 18. Virtualization

PASS para fixed-height, visible/render/request ranges, overscan, requestStep, bootstrap SSR, client/remote, pinned rows, dataRange y stale ranges. 10.000 filas lógicas montan como máximo 28 filas en el benchmark; remote con `totalItems=1_000_000` mantiene DOM y cálculo O(1), sin array de un millón.

Expansion+virtual y grouping+virtual se desactivan de forma determinista sin reescribir state. Pagination no participa cuando virtual está activa.

## 19. scrollTo/focusCell

`scrollTo()` pasa index/key client, index explícito remote, loaded key, first/middle/last, target visible e inválidos; remote unloaded key es no-op. `focusCell()` pasa visible/offscreen conocido con mount, hidden/unknown column, unknown/unloaded key y reorder aceptado. No polling loops.

## 20. Editing

PASS: cell/row, sesión única, draft privado Signal Forms, sin CVA/`NG_VALUE_ACCESSOR`, validación sync/async y stale, reemplazo/reconstrucción por K, cancelación por query/column/data, suspensión virtual, eviction remote, reanudación, commit/cancel exactly-once e inmutabilidad de T/data.

100 ciclos start/cancel dejan `activeSessionsAfterCleanup=0`; generaciones de validación invalidan callbacks tardíos y destroy impide side effects.

## 21. Expansion

PASS: `expandedKeys` aplicado, propuesta inmutable/rechazo/aceptación, RowDetail, K, SSR/hydration, button nativo, `aria-expanded`/`aria-controls` y teclado. 100 membership/toggle cycles pasan. Virtual=true no monta detail ni reescribe state.

## 22. Grouping

PASS: grouping parent-owned, propuestas, client/remote loaded-only, IDs estables, collapse, agregados, subheader/rowspan, nodos sintéticos privados, aislamiento de selección/edición, orden respecto de search/filter/sort y SSR/hydration. 100 toggles pasan; virtual=true mantiene la incompatibilidad P1.

## 23. Export

PASS: CSV, JSON y XLSX propios; scopes client lógicos; remote/all-matching delegados; virtual export no depende del DOM; columnas hidden/reordered; solo committed domain data; sin detail/group nodes; CSV formula injection protegida; XLSX no convierte strings en fórmulas; 50 exportaciones independientes sin state events.

La única superioridad específica congelada F-065 se sostiene factual: Neural implementa JSON y XLSX propios además de CSV. No se formula comparación global con PrimeNG.

## 24. Optional chunks

BASIC no carga advanced builder, active Signal Forms editor, CSV, JSON ni XLSX. Tamaños gzip: advanced filter 1.939 B, editor 1.414 B, CSV 383 B, JSON 469 B, XLSX 1.422 B. Los serializers solo se importan desde el command path; no hay effect de carga.

## 25. Native semantics

DOM real mantiene `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th scope>` y `<td>`. Loading/empty/error, spacers, detail y group rows conservan estructura table válida; no existe div-grid.

## 26. Static accessibility

PASS: accessible table name, scope, `aria-sort`, `aria-selected`, `aria-disabled`, `aria-expanded`, `aria-rowindex`, `aria-rowcount`, status, alert, buttons, paginator, filtros, search, editor, groups y selection controls. No IDs duplicados ni ARIA conflictiva en la matriz real.

## 27. Automated accessibility

Playwright/Chromium inspeccionó basic, selection/query, client+remote virtual, editing, expansion/grouping, loading/error/retry y el accessibility tree nativo. Resultado: **0 violaciones mecánicas** (nombre de tabla/control, header scope, IDs duplicados) y árbol con `table "Data table"`. `axe-core` no está instalado; no se simuló resultado axe. No se observó violación crítica.

## 28. Keyboard matrix

| Interacción                          | Resultado   | Evidencia                                                     |
| ------------------------------------ | ----------- | ------------------------------------------------------------- |
| sort                                 | PASS        | button Enter/Space, aria-sort                                 |
| search/filter                        | PASS        | form/input/buttons nativos; menu/builder focus                |
| pagination                           | PASS        | buttons/select nativos                                        |
| row selection, checkbox/radio, range | PASS        | Enter + controls; range/modifier specs                        |
| column resize                        | PASS        | ArrowLeft/ArrowRight, RTL-aware                               |
| column reorder                       | PASS        | Move left/right buttons; drag es alternativo                  |
| row reorder                          | N/A teclado | target P1 congelado es propuesta drag, sin shortcut prometido |
| editing/save/cancel                  | PASS        | Enter/F2, button/Enter, Escape                                |
| expansion/grouping                   | PASS        | buttons nativos                                               |
| focusCell/scrollTo/virtual focus     | PASS        | integration specs, mount then focus                           |

## 29. Focus

Reorder/resize, filter menu/builder, editor start/commit/cancel, virtual mount, expansion/grouping y focusCell/scrollTo no dejan focus trap ni referencia DOM stale. La restauración usa `afterNextRender` acotado a `DestroyRef`; no hay polling. No se observó body focus inesperado en los paths con target recuperable.

## 30. SSR matrix

SSR real pasa para basic, queried client, selection/layout/query UI, remote satisfied/unsatisfied/loading/error, virtual client/remote, editing, expansion/grouping no virtual y optional features unloaded. `dataRequest=0` en todos los renders server; no se evalúan `window`, `document`, Blob, object URL ni serializers.

## 31. Hydration matrix

Chromium real pasa la misma matriz: nodos table/thead/row/cell reutilizados, 0 NG050x, 0 echoes iniciales, satisfied 0 duplicate, unsatisfied 1 initial, y query/retry/viewport exactly-once. El primer export post-hydration carga un único chunk y completa una vez.

## 32. Zoneless

Todos los fixtures mayores usan `provideZonelessChangeDetection()`. No hay dependencia de Zone.js ni arquitectura basada en `markForCheck`; los `detectChanges()` presentes pertenecen al harness de tests.

## 33. Browser matrix

| Browser  | Resultado                                                |
| -------- | -------------------------------------------------------- |
| Chromium | PASS real, SSR hydration + interacciones + a11y + visual |
| Firefox  | No disponible: ejecutable Playwright no instalado        |
| WebKit   | No disponible: ejecutable Playwright no instalado        |

No se atribuye cobertura falsa a Firefox/WebKit. La limitación no oculta un fallo reproducido.

## 34. Performance client

Medición aislada: render 100 filas p50/p95 26,015/27,557 ms; render 1.000 p50/p95 550,198/552,915 ms; parent replacement 1.000: 31,313 ms. Estos renders finales incluyen UI D–I y no se comparan con el renderer B incompleto.

## 35. Performance query

P95 aislado: search 1k 0,963 ms; search 10k 4,470; filter 10k 2,314; single sort 2,797; multi-sort 3,122; combined 4,521; page extraction 1,904. Tres repeticiones del punto query UI más ruidoso dieron nested 0,0317/0,0341/0,0315 ms y pipeline 0,2312/0,2295/0,4271; el >20 % no fue reproducible.

## 36. Performance selection/layout

P95: membership 10k 4,269 ms; rows 10k/keys 5k 3,676; toggle 4,070; header 3,640; all-matching exclusions 1k 5,490; 100 columns projection 0,048; visibility 0,178; reorder proposal 0,074; resize 0,012. Pipeline computations=1 mientras selection/layout cambian independientemente.

## 37. Performance virtualization

Stress comparable p95: repeated scroll 1.000 = 0,01043 ms; remote 1M projection = 0,0000408; request decision = 0,001234; large jump = 0,0000384. Máximo client render rows=28; 1.000 scroll events produjeron 10 request decisions deduplicadas.

## 38. Performance editing/grouping

P95: start edit 0,00207 ms; draft 0,00206; commit projection 0,00099; 100 start/cancel 0,02390; expansion 100 0,00707; grouping 1k 0,17363; grouping 10k 1,58878; 100 group toggles 0,00803. La escala 1k→10k es lineal, no O(n²).

## 39. Browser performance

Chromium engineering evidence (incluye coordinación Playwright/wait, no benchmark de marketing): navegación+hydration 192,57 ms; query interaction 45,41; virtual scroll 50,59; selection 44,15; edit activation 57,07.

## 40. Lifecycle

PASS: 100 create/destroy basic; 100 virtual; 100 filter open/close; 100 edit start/cancel; 100 expansion/group toggles; 50 exports. No late output tras destroy, sesión activa, mutable export buffer ni validation callback aplicado a una generación nueva.

## 41. Listener/observer census

Por instancia virtual: exactamente 1 scroll listener, 1 `ResizeObserver`, ≤1 rAF pendiente, 0 row observers y 0 listener global persistente. En 100 ciclos: added=100, removed=100, observed=100, disconnected=100 y cancelled rAF≥100.

## 42. Memory/resource observations

CSV/JSON/XLSX no conservan matrices ni bytes después de resolver; 50 invocaciones son locales e independientes. La medición export 10k observa la matriz inevitable de 40.000 celdas, sin buffers globales. Remote 1M no asigna proporcionalmente. Destroy invalida remote coordinator, timers de filtro, rAF, observer, focus callbacks y async validation.

## 43. Bundle BASIC

Final: 174.382 B raw, 34.559 B gzip, 25.541 B Brotli. Frente a I (171.897/30.044/25.271): +1,45 % raw, +15,03 % gzip, +1,07 % Brotli. La anomalía gzip se reproduce como sensibilidad de layout DEFLATE del chunk Angular; la atribución/metafile confirma que solo entraron handlers core F-051/F-053 y no código opcional. No se oculta el valor gzip.

## 44. Bundle enterprise

Typical enterprise initial sin abrir feature privada: igual a BASIC, 34.559 B gzip. Advanced filter y editor se pagan al activarse (1.939 B y 1.414 B gzip respectivamente).

## 45. Bundle remote

Remote y client comparten la única facade/core closure: 34.559 B gzip initial; no HTTP/cache/Router ni segundo channel. Las diferencias de configuración son runtime y no se presentan como tree-shakeable.

## 46. Bundle virtual

Virtual client/remote: 34.559 B gzip initial. La matemática fixed-height es core deliberado; no retiene editor, builder ni export serializers.

## 47. Bundle editing/grouping

Grouping/expansion no añaden chunk initial. Editing carga el private editor de 1.414 B gzip al activarse; Signal Forms no está en BASIC. La incompatibilidad virtual evita runtimes paralelos.

## 48. Bundle combined

Combined initial con features opcionales aún cerradas: 34.559 B gzip. No se suma lazy code al initial. La Table 1.x BASIC histórica permanece en 137.031 B gzip; se registra como contexto, no como ranking.

## 49. Lazy/private chunks

| Chunk                   |    gzip |
| ----------------------- | ------: |
| advanced filter builder | 1.939 B |
| Signal Forms editor     | 1.414 B |
| CSV                     |   383 B |
| JSON                    |   469 B |
| XLSX                    | 1.422 B |

No hay dependencia pesada nueva ni entrypoint público para estos chunks.

## 50. Root-unused

**0 B raw** (gzip container vacío 20 B, Brotli 1 B). Gate PASS.

## 51. Dependency graph

La candidata importa solo Angular core/common, Angular Signal Forms en el editor privado y módulos relativos de Table 2. Cero edges hacia Table 1.x, TableCore, PrimeNG, Router, HTTP, storage, third-party grid/table o CVA. Los serializers y UI avanzada permanecen private dynamic imports.

## 52. Global coverage

Única ejecución autorizada: 186 test files, 3.074 tests entonces verdes. Statements 95,42 %, branches 92,74 %, functions 94,85 %, lines 96,77 %. El comando devuelve threshold failure histórico para branches/functions (95,01 %); no se cambió threshold ni se repitió cobertura global.

## 53. NeuTable coverage

23 archivos candidatos instrumentados: statements 88,05 % (2.520/2.862), branches 80,79 % (1.464/1.812), functions 84,72 % (516/609), lines 91,17 % (2.098/2.301). Las ramas críticas remote stale/out-of-order, virtual ranges, all-matching, edit lifecycle, export error/lazy failure y hydration tienen tests conductuales dirigidos.

## 54. Full suite

PASS: suite completa 186/186 files, 3.078/3.078 tests. NeuTable 2 dirigida: 22 files, 124 tests. Table 1.x/TableCore dirigida: 52 files, 797 tests. Type/contract/ledger/render/interactions/export gates pasan.

## 55. Build/package/imports

PASS: production build, package audit, package verification, import smoke, SSR import smoke y consumidor Angular 22. La candidata sigue privada. `audit:entrypoints` conserva un fallo histórico ajeno: 17 componentes no Table sin página Showcase; J no crea Showcase ni manipula snapshot para ocultarlo.

## 56. Immutability

Fixtures frozen verifican que no se mutan T, data, columns, query/sort/filter AST, selection, layout, expandedKeys, grouping ni metadata. Row reorder solo propone; edit trabaja sobre draft privado; export proyecta committed data.

## 57. Exactly-once matrix

| Output             | Trigger                           |           Count | Parent echo | Hydration                  |
| ------------------ | --------------------------------- | --------------: | ----------: | -------------------------- |
| queryChange        | sort/search/filter/page/pageSize  |               1 |           0 | first interactions 1       |
| selectionChange    | row/control/header/range          |               1 |           0 | 1                          |
| layoutChange       | resize/reorder/visibility/pin     |               1 |           0 | 1                          |
| expandedKeysChange | toggle/keyboard                   |               1 |           0 | 1                          |
| editStateChange    | start/commit/cancel proposal      |               1 |           0 | 1                          |
| groupingChange     | group toggle                      |               1 |           0 | 1                          |
| dataRequest        | accepted remote transition        |               1 |           0 | satisfied 0; unsatisfied 1 |
| rangeChange        | changed virtual geometry          |               1 |           0 | deduped                    |
| rowAction          | activate/double/context-menu      | 1 por DOM event |         N/A | no initial                 |
| editCommit         | valid commit                      |               1 |         N/A | 1                          |
| editCancel         | cancel/invalidation               |               1 |         N/A | 1                          |
| rowReorder         | valid source→target drop          |               1 |         N/A | no initial                 |
| exportRequest      | remote/global delegation          |               1 |         N/A | first delegated command 1  |
| featureError       | frozen feature lifecycle failures |               1 |         N/A | no initial                 |

## 58. Recompute matrix

| Cambio       | Recalcula                                   |
| ------------ | ------------------------------------------- |
| appearance   | presentation only                           |
| layout       | column projection/sticky offsets            |
| selection    | selection projection/header only            |
| query        | affected client stages o remote coordinator |
| data         | row identity + affected pipeline            |
| metadata     | totals/status/correlation; no client query  |
| scroll       | virtual ranges/spacers only                 |
| draft        | active editor only                          |
| expandedKeys | detail membership only                      |
| grouping     | grouping projection only                    |
| export       | invocation-local projection/serializer      |

Contadores: pipeline=1 frente a cambios independientes selection/layout; scroll no ejecuta search/filter/sort/grouping; no mega-computed nuevo.

## 59. Robustness/security

PASS: malformed rule, query numbers/ranges inválidos, duplicate row K/column IDs, huge total, stale response, lazy/export failures, async validation failure, remote error y scoped featureError. No loop ni corrupción silenciosa. No unsafe HTML path nuevo, prototype-sensitive lookup, arbitrary object coercion o fórmula CSV/XLSX implícita.

## 60. RTL/density/responsive

RTL real y specs cubren pinning logical, resize direction, sort/pagination/selection y geometría virtual. Compact/normal/relaxed mantienen fixed itemSize explícito; controls/editor/group rows no cambian la altura virtual oculta. A 320 px cada `neu-table` queda dentro de su parent y usa contained-scroll; pinned columns, filtros, paginator y viewport permanecen operables. No API responsive nueva.

## 61. Structural visual review

Se inspeccionaron capturas Chromium wide, 320 px y RTL. No se observó clipping estructural del host, spacer fuera de table, columna técnica exportable, overlap de pinned/selection, editor detached ni state row inválida. La fixture es deliberadamente funcional, no Showcase; no se realizó redesign visual.

## 62. Prime F-001...F-070

No se re-auditó PrimeNG. Se aplicó el checklist congelado:

| ID    | Capacidad                     | Target             | Evidencia actual                | Estado       | Referencia                             |
| ----- | ----------------------------- | ------------------ | ------------------------------- | ------------ | -------------------------------------- |
| F-001 | Datos locales                 | PARITY/KEEP        | pipeline client                 | PASS         | `neu-table.client-pipeline.spec.ts`    |
| F-002 | Página remota                 | REDESIGN/CHANGE    | data+metadata/dataRequest       | PASS         | `neu-table.remote.integration.spec.ts` |
| F-003 | Loading                       | PARITY/KEEP        | native state row/status         | PASS         | `neu-table.next.spec.ts`               |
| F-004 | Vacío                         | PARITY/KEEP        | empty template/state            | PASS         | `neu-table.next.spec.ts`               |
| F-005 | Error y retry                 | REDESIGN/CHANGE    | retry request reason            | PASS         | remote integration/hydration           |
| F-006 | Controlado/rechazo            | REDESIGN/CHANGE    | proposal rejection              | PASS         | query UI integration                   |
| F-007 | Query agregada                | REDESIGN/CHANGE    | single query owner              | PASS         | contracts/client pipeline              |
| F-008 | Server state legacy           | REDESIGN/REMOVE    | remote machine replacement      | PASS         | remote coordinator spec                |
| F-009 | Reset                         | PARITY/KEEP        | parent-applied reset            | PASS         | query UI integration                   |
| F-010 | Persistencia                  | REDESIGN/CHANGE    | external adapter recipe         | PASS         | `migrations.ts`                        |
| F-011 | Sort single                   | PARITY/KEEP        | single transition/engine        | PASS         | client/query specs                     |
| F-012 | Sort multi                    | REDESIGN/MERGE     | ordered sort[]                  | PASS         | client/query specs                     |
| F-013 | Sort custom                   | PARITY/KEEP        | custom comparator               | PASS         | client pipeline spec                   |
| F-014 | Sort remoto                   | PARITY/KEEP        | proposal→accepted request       | PASS         | remote integration                     |
| F-015 | Sort removable                | PARITY/KEEP        | removable cycle                 | PASS         | query UI spec                          |
| F-016 | Sort inicial                  | REDESIGN/CHANGE    | applied query first entry       | PASS         | contracts/query UI                     |
| F-017 | Filter columna                | PARITY/KEEP        | canonical field resolver        | PASS         | client/query specs                     |
| F-018 | Filter global                 | PARITY/KEEP        | declared fields search          | PASS         | client pipeline spec                   |
| F-019 | Match modes                   | PARITY/KEEP        | 17 exact rules                  | PASS         | client pipeline spec                   |
| F-020 | Múltiples reglas              | PARITY/KEEP        | nested AST                      | PASS         | client/query specs                     |
| F-021 | Custom registry               | PARITY/KEEP        | predicate registry              | PASS         | client pipeline spec                   |
| F-022 | Menu/row                      | REDESIGN/MERGE     | same filter engine              | PASS         | query UI integration                   |
| F-023 | Programático                  | PARITY/KEEP        | applied query input             | PASS         | query UI integration                   |
| F-024 | Commit/debounce               | PARITY/KEEP        | drafts/timers cleanup           | PASS         | query UI integration                   |
| F-025 | Filter remoto                 | PARITY/KEEP        | no local filtering              | PASS         | remote integration                     |
| F-026 | Pagination client             | PARITY/KEEP        | pure pagination                 | PASS         | client pipeline spec                   |
| F-027 | Pagination server             | PARITY/KEEP        | query/request sequence          | PASS         | remote integration                     |
| F-028 | Pagination controlled         | PARITY/KEEP        | proposal/rejection              | PASS         | query UI integration                   |
| F-029 | Sizes/report/jump             | PARITY/KEEP        | paginator presentation          | PASS         | query UI integration                   |
| F-030 | Placement                     | PARITY/KEEP        | top/bottom/both                 | PASS         | renderer/query tests                   |
| F-031 | Selection single/multiple     | REDESIGN/CHANGE    | exact-K state                   | PASS         | layout-selection specs                 |
| F-032 | Checkbox/radio                | PARITY/KEEP        | native controls                 | PASS         | layout-selection integration           |
| F-033 | Select all                    | PARITY/KEEP        | header scopes                   | PASS         | layout-selection specs                 |
| F-034 | Meta/range/keyboard           | PARITY/KEEP        | modifier/range intents          | PASS         | layout-selection specs                 |
| F-035 | rowSelectable                 | PARITY/KEEP        | disabled predicate              | PASS         | renderer/selection tests               |
| F-036 | Remoto no cargado             | REDESIGN/CHANGE    | symbolic/no-op external index   | PASS         | selection/virtual specs                |
| F-037 | ARIA/foco                     | PARITY/KEEP        | browser a11y/focus              | PASS         | hydration browser                      |
| F-038 | Edit cell                     | PARITY/KEEP        | controlled private draft        | PASS         | editing/integration specs              |
| F-039 | Edit row                      | PARITY/KEEP        | row session                     | PASS         | editing spec                           |
| F-040 | Validation                    | PARITY/KEEP        | sync/async/stale                | PASS         | editing spec                           |
| F-041 | Custom editor                 | PARITY/KEEP        | typed editor template           | PASS         | interactions integration               |
| F-042 | Expansion controlled/template | PARITY/KEEP        | expandedKeys/RowDetail          | PASS         | interactions integration               |
| F-043 | Group subheader               | PARITY/KEEP        | private group nodes             | PASS         | grouping specs                         |
| F-044 | Group rowspan                 | PARITY/KEEP        | rowspan projection              | PASS         | grouping spec                          |
| F-045 | Collapse/agregado             | PARITY/KEEP        | toggle+aggregate                | PASS         | grouping spec                          |
| F-046 | Columnas dinámicas            | PARITY/KEEP        | normalized columns              | PASS         | renderer/layout tests                  |
| F-047 | Column reorder                | PARITY/KEEP        | drag/buttons proposal           | PASS         | layout integration                     |
| F-048 | Resize fit/expand             | PARITY/KEEP        | pointer/keyboard normalize      | PASS         | layout integration                     |
| F-049 | Frozen/sticky                 | PARITY/KEEP        | logical pin/sticky              | PASS         | layout integration                     |
| F-050 | Visibility/width              | PARITY/KEEP        | controlled layout               | PASS         | layout specs                           |
| F-051 | Row reorder                   | PARITY/KEEP        | drop→NeuTableRowMove            | PASS         | `neu-table.next.spec.ts` J             |
| F-052 | Styling/class                 | PARITY/KEEP        | appearance/row class            | PASS         | renderer spec                          |
| F-053 | Context menu                  | PARITY/KEEP        | rowAction context-menu          | PASS         | `neu-table.next.spec.ts` J             |
| F-054 | Frozen rows                   | PARITY/KEEP        | pinned domain rows no duplicate | PASS         | client/layout specs                    |
| F-055 | Fixed viewport                | PARITY/KEEP        | fixed itemSize                  | PASS         | virtualization specs                   |
| F-056 | Lazy sparse                   | PARITY/KEEP        | dataRange mapping               | PASS         | remote virtual integration             |
| F-057 | Overscan/ranges               | REDESIGN/RENAME    | visible/render/request          | PASS         | virtualization specs                   |
| F-058 | Altura variable real          | OUT OF SCOPE/DEFER | exclusión congelada             | OUT OF SCOPE | virtualization addendum                |
| F-059 | Lifecycle/memory              | PARITY/KEEP        | 100-cycle census                | PASS         | virtualization integration J           |
| F-060 | Header/body/footer            | PARITY/KEEP        | typed templates/native sections | PASS         | renderer spec                          |
| F-061 | Caption/loading/empty         | PARITY/KEEP        | template registry/state rows    | PASS         | renderer/hydration                     |
| F-062 | Group/filter/editor           | PARITY/KEEP        | private typed templates         | PASS         | interaction/query specs                |
| F-063 | Overflow contenido            | PARITY/KEEP        | contained-scroll 320 px         | PASS         | browser certification                  |
| F-064 | CSV                           | PARITY/KEEP        | private CSV serializer          | PASS         | export specs                           |
| F-065 | JSON/XLSX propios             | SUPERIOR/KEEP      | genuine JSON + ZIP XLSX         | PASS         | export specs/bundle                    |
| F-066 | Rows/columns/sort a11y        | PARITY/KEEP        | native DOM/ARIA                 | PASS         | hydration browser                      |
| F-067 | Granularidad paquete          | PARITY/KEEP        | private chunks/root-unused      | PASS         | final bundle audit                     |
| F-068 | Gran dataset/identity         | PARITY/KEEP        | 10k/1M exact K                  | PASS         | virtual/performance specs              |
| F-069 | Dominio genérico              | REDESIGN/CHANGE    | T/K/F contracts                 | PASS         | type contracts                         |
| F-070 | Auxiliares                    | PARITY/KEEP        | templates/methods/labels        | PASS         | renderer/contracts                     |

## 63. API before/after

| Métrica            | Table 1.x | TableCore 1.x | Combinado 1.x | NeuTable 2 |
| ------------------ | --------: | ------------: | ------------: | ---------: |
| Componentes        |         1 |             1 |             2 |          1 |
| Inputs             |        80 |            16 |            96 |         24 |
| Outputs            |        38 |             0 |            38 |         14 |
| Métodos            |        32 |             0 |            32 |          4 |
| Exports entrypoint |       158 |            16 |           174 |         82 |

Table 2 mantiene un único target entrypoint final; el switch físico queda reservado para K.

## 64. Table/TableCore removal readiness

**Sin blocker para K.** Candidate scan: cero imports/edges a Table 1.x o TableCore. Clasificación:

- REMOVE IN K: `projects/ui-core/table-core/**`, su secondary entrypoint, tests, tipos/directivas y contract/public snapshots.
- REMOVE IN K: facade/orchestration/types/templates/tests legacy bajo `projects/ui-core/table/**` excluyendo `next/**` una vez migrados consumidores.
- MIGRATE IN K: `projects/ui-core/public-api.ts`, package exports/ng-package, contract policy/snapshots, bundle policy, compatibility fixture, harnesses y docs.
- MIGRATE IN K: TreeTable, actualmente consumidor de tipos/componente legacy; debe desacoplarse o apuntar al contrato final antes de borrar archivos.
- PROMOTE IN K: candidata `table/next` al path privado/final `table`, manteniendo una sola `<neu-table>` y un solo entrypoint.
- REPLACE IN K: tests legacy por los 124 tests de candidata más comparación/migration fixtures; eliminar reconciliaciones temporales.

Las once recetas compile-ready pasan: simple, lazy/server, sort/filter/page, selection, TableCore, virtual, editing, expansion/grouping, export, URL y storage. No compatibility wrapper runtime.

## 65. Remaining risks/blockers

Riesgos no bloqueantes y explícitos:

- Firefox/WebKit no disponibles; solo Chromium real.
- `axe-core` no instalado; se usó accessibility tree + auditoría mecánica real.
- global coverage falla thresholds históricos de functions/branches aunque tests pasan; las ramas críticas Table tienen tests dirigidos.
- gzip BASIC muestra +15,03 % pese a +1,45 % raw/+1,07 % Brotli; metafile descarta retención opcional y la causa queda atribuida a layout DEFLATE tras F-051/F-053.
- `audit:entrypoints` sigue fallando por 17 demos Showcase históricos ajenos a Table.

No coincide ninguno de los blockers de §77: no P1 gap, API drift, owner/request duplicado, mismatch SSR/hydration, leak, a11y crítica, keyboard P1 failure, DOM no acotado, retención pesada, root-unused, leakage candidate ni migration blocker.

## 66. Final recommendation

**CERTIFIED FOR N2-011K**

K puede ejecutar la sustitución física siguiendo el plan de §64. J no ha iniciado esa sustitución.
