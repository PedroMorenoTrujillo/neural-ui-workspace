# TreeTable — Auditoría independiente y diseño Neural UI 2

Auditoría estática del working tree `v2` sobre `a6a9606613fba61e7c337c3f57d1aecbb11702e8`, con Fases 1, 2 y 3A acumuladas. Consulta de fuentes: 12 de septiembre de 2026. Prime de referencia: **22.1.1**. Las propuestas describen arquitectura futura; no están implementadas. PARITY significa cobertura del caso indicado por fuente/contrato y tests existentes, no una certificación comparativa de ejecución. Los gates históricos se atribuyen a su fase; no se volvieron a ejecutar en esta auditoría.

## Principio rector — enmienda Neural UI 2

**PrimeNG es exclusivamente baseline funcional y competitivo. Su naming, inputs, outputs, estado y arquitectura no son el target.** Para cada caso: «¿Cuál es la solución Neural más simple, reactiva, eficiente, coherente y Angular 22-native para cubrirlo o superarlo?» Neural UI 2 es un major: se autorizan renames, fusiones, eliminaciones, cambios de eventos/estado y reescrituras completas. Neural UI 1 conserva el contrato antiguo; Neural UI 2 no incluye aliases, wrappers o compatibility layers para evitar el breaking.

Priorizar simplicidad conceptual, signals como estado real, input/model/computed cuando proceda, tipos fuertes, API expresiva, menos estado duplicado y código imperativo. Zoneless, SSR/hydration, accesibilidad, lifecycle/memoria, tree-shaking, bundle, rendimiento, mantenibilidad y coherencia transversal son gates del diseño. Ninguna API nueva se justifica solo por modernidad. Menor configuración, DOM, listeners, effects o duplicación puede ser superioridad objetiva si se mide manteniendo la capacidad.

Las conversiones de datos de migración son operaciones puntuales del consumidor, no compatibilidad embebida en el paquete. La integración con HTTP, URL o almacenamiento es un límite externo legítimo que seguiría existiendo en una app nueva; no debe emular APIs Prime ni sostener estado espejo. Cada decisión requiere beneficio concreto y prueba; ni conservar ni reescribir código antiguo es un fin en sí mismo.

## CURRENT NEURAL MODEL

TreeTable tiene 49 inputs/25 outputs. Consume nodos, los indexa y aplana, aplica jerarquía/filtrado/sort/paginación de raíces y delega el render a Table con `serverSide=true`. Ese flag evita reprocesamiento local de filas ya proyectadas; no prueba por sí mismo doble paginación. Sin embargo, expresa un modo interno de renderer mediante una política de transporte público. Sources: [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:220), [neu-tree-table-hierarchy.controller.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table-hierarchy.controller.ts:1).

`NeuTreeTableNode<T>` permite data tipada en tipos auxiliares, pero el componente no propaga un genérico T y declara `NeuTableColumn<any>[]`. Al convertir a fila se expande node.data y después se sobrescriben id, label, description, badge y metadata __tree*. Un dominio con data.id/data.label pierde esos campos en la fila de vista. La corrección requiere cambiar contextos, no solo anotar un any. Sources: [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:648), [neu-tree-table-hierarchy.controller.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table-hierarchy.controller.ts:98).

## PRIMENG 22 MODEL

API fuente: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-treetable.d.ts`; workflows: [PrimeNG treetable](https://primeng.dev/treetable). El contrato usa TreeNode y columnas, selección por nodos/claves, expanded state, lazy/totalRecords, filtros lenient/strict, orden por hermanos y templates de celdas. La declaración TreeTable no es genérica de dominio. No se deriva de ello superioridad de Neural, cuyo componente tampoco conserva T actualmente. Prime aporta casos de referencia, no una obligación de repetir su representación.

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


## HISTORICAL ISSUES

H9-B1 cerró funcionalidad estructural: selección, edición y controles de jerarquía existen. H9-C3 arregló explosión de recorridos DAG en walkers compartidos; no reabrirla sin regresión. La recertificación H9-C2 calificó ampliamente la cobertura; la inspección actual encuentra problemas que aquella etiqueta no resuelve: colisión de datos, IDs descartados, filtros y semántica generada tras render. Fuentes históricas y clasificación: [N2-PRIME22-EXECUTIVE.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-PRIME22-EXECUTIVE.md:1).

## CURRENT PROBLEMS

- **Prioridad de estado desigual:** effectiveSort de TreeTable puede dar prioridad al sort explícito sobre query.sortEntries; Table prioriza query. El mismo patrón de bindings puede cambiar de significado entre hermanos.
- **Pérdida de correlación:** onTableLazyRequest reduce el request a reason/query/first/last, omitiendo requestId y límites visibles. Expansión de nodo tampoco ofrece el contrato completo de retry/dedupe. Source: [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1042).
- **Unidades mezcladas:** totalItems cuenta raíces y flatRows cuenta filas visibles expandidas. Se necesitan metadatos distintos para paginación y viewport; el total de descendientes puede ser desconocido.
- **Filtros divergentes:** motor jerárquico implementa matchesConstraint aparte. Custom sin predicado de columna acepta true y no reutiliza el registry de Table. Conversión Number(value) puede tratar null como0. Source: [neu-tree-table-hierarchy.controller.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table-hierarchy.controller.ts:196).
- **Frontera disabled inconsistente:** la propagación recorre nietos tras saltar padre disabled, pero la agregación checkboxState detiene recorrido en disabled. Resultado mixed/selected puede no representar la acción aplicada. Source: [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1391), [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1402).
- **Treegrid post-render:** afterRenderEffect modifica roles/ARIA buscando filas y celdas del DOM de Table; syncTreegridDom calcula existencia de tabindex con búsqueda dentro del loop de filas. Coste potencial O(r²) y diferencia entre HTML SSR y estado tras JS. Esto no equivale a un fallo de hydration observado: los smokes históricos pasaron. Source: [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1479).
- **Persistencia:** opciones URL se pasan a Table interno mientras query llega controlada; no certificar persistencia integrada por presencia de input. Adapter externo de query es una alternativa válida que debe documentarse y probarse.

## FEATURE GAPS Y REDESIGN OPPORTUNITIES

La recomendación es **REWRITE FROM SCRATCH de la fachada/orquestación y proyección de TreeTable**. Los fallos atraviesan tipos, datos aplanados, query, transporte, filtros y DOM; parchear cada capa mantendría el acoplamiento equivocado. Conservar capacidades de edición, templates y virtualización como acceptance tests, no como obligación de conservar clases antiguas. El modelo necesita tres capas: árbol de dominio, proyección jerárquica y renderer semántico. Solo la segunda conoce rutas, profundidad, posición de hermanos y expansión; las celdas editan T. Compartir el motor puro de reglas con Table y los recorridos/políticas con Tree evita tres implementaciones divergentes.

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

Pseudotipo de diseño, aún no publicado:

```ts
interface NeuTreeTableNode<T, K extends string | number> {
  key: K;
  data: T;
  children?: readonly NeuTreeTableNode<T, K>[];
  hasChildren?: boolean;
  disabled?: boolean;
}
interface NeuTreeRowContext<T, K> {
  data: T;
  nodeKey: K;
  parentKey: K | null;
  depth: number;
  expanded: boolean;
  loadingChildren: boolean;
  // posInSet/setSize solo cuando son conocidos
}
type NeuTreeDataRequest<F, K> =
  | { kind: 'roots'; requestId: number; queryRevision: number;
      query: NeuTableQuery<F>; page: number; pageSize: number }
  | { kind: 'children'; requestId: number; queryRevision: number;
      parentKey: K; cursor?: string }
  | { kind: 'viewport'; requestId: number; queryRevision: number;
      range: NeuTableRange; projectionRevision: number };
```

TreeTable<T,K> infiere T de nodes y lo conserva en columna/accessor, template, edición y eventos. No expone flatRow como T ni añade __metadata al dominio. Columna de jerarquía explícita configura toggler/indent; no se deduce porque la key de negocio se llame label. El key identifica un nodo de la vista. Para DAG, cada ocurrencia bajo padres distintos necesita key de ocurrencia estable, aunque comparta un domainKey; selección por entidad compartida se modela mediante adapter explícito. Rechazar ciclos de ancestros y duplicados de key con diagnóstico; no bloquear dos ocurrencias válidas del mismo objeto de dominio.

### Query, hierarchy y sorting

Una query comparte reglas serializables con Table. Sort es array y se aplica **entre hermanos** conservando jerarquía; nunca ordenar globalmente flatRows. Comparadores reciben data:T y política null definida. Filtrado strict exige coincidencia por nodo; lenient conserva descendencia del ancestro coincidente según contrato actual documentado. La visibilidad de ancestros de un descendiente coincidente debe quedar especificada mediante truth table, no inferida del nombre del modo. Expansión visual inducida por filtro es estado derivado; no sobrescribe expandedKeys persistidos. Al retirar búsqueda se restaura expansión aplicada previa.

Custom filters usan registry común, con clave/versión y limpieza. Un filtro sin implementación local falla de forma explicada o se deriva a backend; no devuelve true silencioso. Zero, null, string vacío y fecha inválida son casos diferentes. Locale es explícito donde afecta comparación; una función local no se serializa en URL.

### Paginación y virtualización: unidades

Root pagination cuenta raíces: pageSize10 significa diez raíces con sus descendientes visibles, no diez filas aplanadas. `rootTotal` es total del backend conocido; si se desconoce, usar cursor/hasMore y no inventar páginas. `visibleRowCount` es resultado de proyección cargada, diferente de total de nodos. `estimatedRowCount` solo aparece como estimación identificada.

Viewport virtual opera sobre índice de la proyección visible y lleva projectionRevision. Expandir cambia esa revisión y puede invalidar rangos antiguos aunque query sea idéntica. Preservar ancla por nodeKey/offset, no por índice anterior. Un rango half-open [start,end) nunca usa rootTotal como longitud de flatRows. Altura fija es el compromiso inicial; filas con editores/expansión incompatibles deben desactivar virtualización o exigir estrategia de altura explícita, no recortar contenido silenciosamente. Overscan y DOM count siguen acotados tras abrir muchas ramas.

### Carga remota y eventos

Raíces, hijos y viewport comparten correlación pero tienen intents distintos. Estados de hijo por key: unloaded/loading/loaded/error; loaded-empty no vuelve a pedir al expandir. Retry genera nuevo ID; expansión repetida durante loading deduplica por parent/query. Collapse no borra datos por defecto; política de caché/retención explícita. Respuesta de query antigua se descarta; respuesta tras collapse puede cachearse si query sigue válida, sin reabrir la rama. Destroy cancela suscripciones propias y el consumidor aborta transporte.

`queryChange` propone estado; `dataRequest` es el único canal de transporte con unión kind. `expandedKeysChange` propone expansión; `nodeExpanded/nodeCollapsed` entrega detalle y no dispara automáticamente otra petición en la guía. El primer request se produce según política cliente/hydration igual que Table. `rangeChange` no necesita Event DOM. No usar nodeExpand a la vez para toggle, petición y lifecycle.

### Selección

`selectedKeys: readonly K[]` con selectionOptions mode none/single/multiple y checkboxPolicy independent/propagate. [] vacío; single máximo1. `selectionDisabledBoundary:'stop'` como regla inicial uniforme: un nodo disabled corta propagación y agregación en ambas direcciones. Si una app necesita otra política, será explícita y cubrirá la misma truth table, no dos funciones incompatibles.

Mixed state se deriva de hijos seleccionables **cargados** bajo esa política. «Todos los descendientes» de nodo lazy no puede afirmarse a partir de los cargados: proporcionar intención de dominio del consumidor o marcar selección parcial/conocida. No emitir keys de hijos aún desconocidos. Select-all se delimita a roots/page/loaded-visible según contrato adoptado; página remota no significa todo dataset. Meta/range opera sobre orden visible y salta no seleccionables. Selección programática de keys no cargadas se conserva para recuperar cuando lleguen datos.

### Renderer y accesibilidad

Compartir TableCore o un renderer gestionado interno que reciba roles e información de fila **en template SSR**. No modificar DOM por selectores de Table desde TreeTable. Render declarativo role treegrid/row/gridcell/columnheader; aria-level, aria-expanded solo en padre, aria-selected y checkbox mixed coherentes. aria-posinset/setsize se calculan dentro de hermanos y se omiten si desconocidos; no usar el total plano como tamaño de hermanos. Los column headers y aria-sort corresponden al orden aplicado.

Roving tabindex tiene una clave activa, materializa la fila virtual antes de enfocarla y conserva foco al reordenar. Flecha derecha expande o entra en hijo; izquierda colapsa o va al padre; arriba/abajo siguiente visible; Home/End en conjunto visible según contrato; Ctrl+Home/End global si se soporta; Enter/Space no deben disparar simultáneamente selección y edición. Tab entra a editor y Escape cancela sin colapsar la rama. Tras borrar/collapse del nodo enfocado, fallback a padre o vecino visible estable. Focus return de overlays de editor se verifica con viewport desplazado.

Lectores anuncian jerarquía, sort, selección y carga/error sin tormenta de live regions. Contador conocido/desconocido es honesto. Validar HTML SSR sin JS, reuse de nodos al hidratar, teclado con árbol profundo, RTL, 320px, forced colors, reduced motion y zoom. Eliminar búsqueda O(r²) del post-render usando modelo e índices, no caché DOM frágil.

### Edición, columns, templates y persistencia

Edición de celda/fila usa data:T, snapshot temporal y propuestas inmutables. No exportar nodeKey/depth a datos de negocio salvo columnas explícitas. Exportación por alcance visible/loaded es distinta de todo árbol remoto; backend para desconocidos. Column layout, frozen, resize, reorder y templates conservan contexto jerárquico sin colisiones. Contratos de body libre deben especificar directivas necesarias para treegrid y focus.

Persistir schemaVersion, query, expandedKeys y columnLayout por adapter opt-in. No persistir handles DOM, request IDs, loading, draft de edición ni errores de transporte. Al restaurar keys que aún no existen, conservar intención limitada por política de retención; no expandir recursivamente todo árbol mediante una tormenta HTTP. Estado controlado externo puede rechazar propuestas sin que el renderer muestre expansión no aceptada.

## BREAKING CHANGES

| Actual | Target | Impacto |
| --- | --- | --- |
| data mezclada con id/label/__tree* | context.data + metadata separada | Migrar templates, accessors, export y editores. |
| componente no genérico/columns<any> | TreeTable<T,K>/columns<T> | Errores de compilación útiles; no ocultarlos con casts. |
| sort separado con otra prioridad | query.sort[] | Eliminar binding y convertir snapshot. |
| first/last lazy sin ID | request unión + rangos half-open | Dedupe/correlación por query/proyección/parent. |
| serverSide usado como modo render interno | proyección gestionada | Consumidor solo conoce client/remote de dominio. |
| selection por filas | selectedKeys + política | Distinguir selección de nodo/entidad y unloaded. |
| ARIA post-render implícita | directivas/contextos semánticos | Custom templates deben adoptar contrato accesible. |
| URL passthrough | adapter controlado | Cambiar inicialización y back/forward con prueba. |

## MIGRATION IMPACT, SUPERIORITY OPPORTUNITIES Y ACEPTACIÓN

Crear fixture de árbol de departamentos con data.id/data.label, nodos disabled con nietos, padres lazy y páginas remotas. Convertir el consumer completo antes de retirar fachada vieja. Migración automática solo para renames mecánicos; selección propagada, DAG y paginación requieren decisión de dominio. Los ejemplos antes/después de la futura guía no compilan todavía hasta existir target.

Ventaja concreta a conservar: edición de fila integrada. Oportunidades pendientes: T íntegro hasta template, un request trazable por causa, SSR semántico desde primer byte y costes O(V+E) para índices/recorridos. No afirmar victoria de bundle: el comparativo histórico tuvo desventaja en TreeTable. N2-015…018 pasan solo con types, filtros cruzados, state rejection, root/visible counts, stale requests, treegrid SSR/keyboard y benchmark equivalente. La suite anterior es baseline, no prueba del nuevo diseño.
