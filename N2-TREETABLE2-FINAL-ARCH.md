# NeuTreeTable 2 — Arquitectura final

## 1. Executive decision

**APPROVED FOR IMPLEMENTATION.** NeuTreeTable 2 será una reescritura desde cero, no una adaptación de TreeTable 1.x. La arquitectura congela una entidad `T` limpia, identidad exacta `K`, campos cerrados `F`, jerarquía aplicada separada de los datos, una fachada, un canal remote y un renderer treegrid propio.

No hay decisiones materiales abiertas para N2-015B. Este documento no implementa runtime, no modifica legacy y no reanuda N2-011K.

## 2. Why rewrite

TreeTable 1.x delega en Table 1.x mediante 42 inputs incompatibles, 21 outputs incompatibles y ocho métodos eliminados. Además mezcla `T` con `__tree*`, mantiene motores paralelos de filter/sort, usa unidades ambiguas entre roots y flat rows, pierde correlación remote y parchea treegrid/ARIA después del render. Un adapter conservaría exactamente esas dependencias y bloquearía la eliminación de Table 1.x/TableCore.

La suite legacy se conserva como baseline de capacidades, no como diseño objetivo.

## 3. Zero facade dependency

El grafo runtime final es:

```text
NeuTreeTableComponent
├─ private semantic treegrid renderer
├─ private hierarchy/query/selection engines
├─ neutral package-private primitives
└─ private lazy editor/filter/export chunks
```

No existe edge runtime a `NeuTableComponent`, `NeuTableCoreComponent`, `@neural-ui/core/table-core`, Table 1.x, TreeTable 1.x, old controllers, old virtual engine o old lazy events. No hay wrapper, inheritance ni public facade composition. Un eventual source sharing es package-private y semánticamente neutral.

## 4. Shared neutral primitives

| Primitive                                     | Decision      | Reason                                                                  |
| --------------------------------------------- | ------------- | ----------------------------------------------------------------------- |
| Exact-K token/equality                        | SHARE         | `string/number` identity is identical across grids.                     |
| Field resolver/accessor precedence            | SHARE         | Same column/value semantics; no dot-path magic.                         |
| Single-value filter predicates                | SHARE         | Predicate truth tables are independent of traversal.                    |
| Text normalization                            | SHARE         | Same deterministic case/diacritic policy.                               |
| Stable value comparator/sort-entry evaluation | SHARE         | Same nullish/date/custom comparator behavior.                           |
| Generic immutable proposal helpers            | SHARE         | Freeze/dedupe helpers carry no component policy.                        |
| Generic edit-session core                     | SHARE         | Identity is parameterized by `K + columnId`.                            |
| CSV/JSON/XLSX serializers                     | SHARE         | They serialize an already projected matrix.                             |
| Half-open range/fixed-height math             | SHARE         | Geometry is independent of flat versus tree source.                     |
| SSR platform guards                           | SHARE         | Same browser-activation invariant.                                      |
| Hierarchy validation/projection/flatten       | TREE-SPECIFIC | Parentage, cycles, paths and expansion have tree semantics.             |
| Subtree selection/indeterminate               | TREE-SPECIFIC | Unknown descendants and disabled boundaries differ from flat selection. |
| Root/children request coordinator             | TREE-SPECIFIC | Branch correlation is not Table remote correlation.                     |
| Treegrid keyboard/focus transitions           | TREE-SPECIFIC | Right/Left parent-child semantics are unique.                           |
| Full Table client pipeline                    | DO NOT SHARE  | Flat pagination/sort/filter order is semantically different.            |
| Table selection engine                        | DO NOT SHARE  | `all-matching` is not subtree selection.                                |
| Table renderer/grouping/row-detail            | DO NOT SHARE  | Would recreate facade composition.                                      |

Sharing follows semantics, not LOC reduction.

## 5. Future TreeSelect reuse boundary

Future TreeSelect 2 may reuse exact-K identity, relation validation, parent/children indexes, cycle/orphan diagnostics, expanded-key projection, iterative traversal, loaded-subtree selection math and lazy-child correlation. It must not reuse columns, table layout, treegrid renderer, editing/export, root pagination or row/cell focus policy.

NeuTreeTable 2 is not designed around TreeSelect, and N2-015A creates no TreeSelect code.

## 6. Public facade

Único entrypoint y selector target:

```text
@neural-ui/core/tree-table
<neu-tree-table>
```

La fachada target deriva en 66 public types, 11 template directives, un component, 22 inputs, 12 outputs y cuatro methods. Los números son el resultado del contrato necesario; no un presupuesto arbitrario. No hay TreeTableCore, Lazy/Virtual variants ni aliases legacy.

## 7. Generics

`NeuTreeTableComponent<T extends object, K extends string | number, F extends string>`.

- `T`: entidad de dominio del consumer.
- `K`: identidad semántica estable y reconstruible; `1 !== '1'`.
- `F`: dominio cerrado de search/sort/filter/edit fields.

No se permite `any`. El runtime nunca usa object identity de `T` como identidad.

## 8. Domain entity

`T` permanece intacta. Se prohíben `__treeLevel`, `__parent`, `__path`, `__expanded`, `__selected`, `__partialSelected`, `__loading`, `__leaf`, `__childrenLoaded`, `__virtualIndex` y cualquier metadata equivalente. Templates y edit/export reciben `T`, no una fila contaminada.

## 9. Hierarchy representation

Se congela el modelo **D: domain collection + parent-owned relation records separados**:

- `data: readonly T[]` es la colección loaded;
- `rowKey(T) → K` indexa entidades;
- `hierarchy.roots` es una relation aplicada;
- `hierarchy.children` contiene relations keyed por `parentKey`;
- cada relation discrimina `unloaded | loading | error | loaded` y porta revisions/correlation.

No hay nested `row.children`, parent key embebido en T, múltiples owners ni mutation de domain rows. La lista de child relations preserva exact-K sin coerción de claves de objeto.

## 10. Roots

El parent posee `hierarchy.roots`. Roots se reconstruyen por K contra `data`; reemplazar `T` conservando K preserva identidad, focus y selección. En client mode la relation debe estar `loaded`; en remote puede estar unsatisfied/loading/error/loaded. `roots.total` significa total de raíces, nunca total de visible nodes.

Una root K inexistente en `data` produce diagnóstico determinista y se omite; el component no inventa un placeholder T.

## 11. Children

`children(parentK)` se obtiene de una única `NeuTreeChildRelation<K>` por parent exacta. Estados:

- `loaded + complete + keys=[] + total=0`: known-empty;
- `loaded + keys`: loaded, completo o parcial;
- `unloaded`: no satisfecho; total puede ser conocido o `null`;
- `loading`: parent aplicó una request; puede conservar keys previas;
- `error`: parent aplicó error; puede conservar keys previas.

No se sobrecarga `leaf`. `total` es opcional semánticamente (`number | null`), nunca obligatorio para backends que no lo conocen.

## 12. Private node projection

`TreeProjectionNode<T,K>` privado contiene key, T, parentKey, depth, sibling index/count, path, relation, expanded aplicado, filter reveal y logical visible index. No es un public row wrapper. Los índices `nodesByToken`, parent map y relation map son computed derivados de inputs.

## 13. Expansion

`expandedKeys` es applied input; `expandedKeysChange` es proposal. No `model()`, internal applied owner ni optimistic expansion.

Gesture → proposal. Si el parent rechaza, `aria-expanded` y children permanecen aplicados y no hay request. Si acepta, la proyección cambia; solo entonces una relation child unsatisfied puede originar request. Filtering puede revelar paths transitoriamente sin modificar `expandedKeys`.

## 14. Request model

Existe un único output `dataRequest`, unión discriminada:

- `{kind:'roots', reason:'initial'|'query'|'page'|'retry', ...}`;
- `{kind:'children', reason:'expand'|'query'|'retry', parentKey, ...}`.

Cada request contiene `requestId`, `queryRevision`, `hierarchyRevision`, `relationRevision` y applied query. No DOM Event, Promise, Observable, HTTP, cache ni viewport request P1.

## 15. Root request

- SSR: cero requests.
- Hydration con roots satisfechas/correlacionadas: cero duplicate.
- Browser con roots unsatisfied: exactamente una request initial.
- Query/page proposal rechazada: cero.
- Query/page aplicada distinta: una root request si la hierarchy remota no representa esa revision.
- Error: cero auto-retry; `retryData({kind:'roots'})` emite por el mismo channel.

Client mode nunca emite dataRequest.

## 16. Children request

Collapsed → expand proposal → parent acceptance → child relation unsatisfied → exactamente una CHILDREN request. Rejection emite cero. Collapse pending no cancela ni escribe. Re-expand con la misma huella pending deduplica; una nueva relation revision o retry explícito permite nueva request.

## 17. Correlation/stale

`requestId` es monotónico por instancia. `queryRevision` identifica applied query; `hierarchyRevision` la topología parent-owned; `relationRevision` una branch. La huella incluye parent K exacta.

Una relation cuya query/request/revision no coincide es stale y no se convierte en current por parecer correcta. No hay heurística sobre data contents ni global mutable singleton. El parent aplica responses; el component solo clasifica/presenta.

## 18. Query

Se define `NeuTreeTableQuery<F>` en lugar de reutilizar `NeuTableQuery<F>` porque `page/pageSize` significan raíces, no filas planas. Mantiene search, ordered sort y filter AST con reglas equivalentes. Los átomos de sort/filter pueden compartir implementación neutral, no el type completo por conveniencia.

## 19. Pagination

P1 pagina raíces. En client mode: filter/sort jerárquico → roots resultantes → root page → expansion/flatten. Los descendientes visibles de una root no consumen page size. En remote mode el backend aplica la root page de query y `roots.total` alimenta el report.

Paginator placement/report avanzados fuera del contrato congelado quedan P2; no se pagina flattened visible nodes.

## 20. Sorting

Cada sibling set se ordena estable e independientemente; roots entre roots, children entre children. No hay global flat sort. Multi-sort respeta el ordered `sort[]`; nullish, date, value accessor y custom comparator siguen la primitive neutral. Remote mode acepta el orden aplicado por backend y no reordena localmente.

## 21. Filtering

Única policy P1: **matching nodes + ancestor paths**.

- node match: visible;
- descendant match: sus ancestors se conservan;
- branch unrelated: se elimina;
- descendants de un node match no aparecen automáticamente salvo que también match o sean path de otro match.

El reveal de ancestors es presentation computed y no emite expansión. Al limpiar filter/search vuelve exactamente el `expandedKeys` aplicado. Remote mode no examina unloaded descendants ni afirma resultados globales.

## 22. Search

Search y filter AST se combinan con AND a nivel de T; search hace OR sobre `filterOptions.globalFields`. No `JSON.stringify(T)`, dot-path magic ni búsqueda en metadata. En remote mode la query se propone y backend aplica; el client no busca children no cargados.

## 23. Columns

`NeuTreeTableColumn<T,F>` conserva la estructura común de NeuTable para id/header/field/value/sort/filter/edit/width/min/max/align. La implementación debe compartir el resolver y engines elementales, no importar el facade ni el flat pipeline. Layout/filter/sort/edit no se redefinen con semánticas divergentes.

## 24. Tree column

`hierarchyOptions.treeColumnId` es required y determina indent, expander y node template. Nunca se asume la primera visible. Si falta o está hidden, se emite diagnóstico/feature error de configuración y no se mueve silenciosamente el affordance a otra columna.

## 25. Layout

P1 mantiene order, visibility, widths, pinning y proposals de resize/reorder de columnas. `layout` es applied input y `layoutChange` único proposal. Column chooser es UI privada opcional; tree row drag/reparent no forma parte de layout.

## 26. Selection

Selection es siempre por K: none, single, multiple o checkbox. `selection` es applied input y `selectionChange` proposal inmutable con added/removed keys y loaded T informativos. No rows como autoridad, no autocorrection y no second context-menu selection.

## 27. Propagation

P1 usa `loaded-subtree` únicamente. Seleccionar un parent puede propagar a descendientes loaded/reachable/selectable; nunca enumera ni inventa unloaded keys. No se adopta selección simbólica subtree porque el valor P1 no compensa el coste contractual; queda como futura design review si aparece un consumer real.

## 28. Indeterminate

- none loaded selected: false;
- some selectable loaded selected: mixed;
- all selectable loaded selected + relation complete: checked;
- all loaded selected + children unknown/partial/unloaded: mixed, no “backend complete” falso;
- collapsed/filter state no cambia la matemática sobre loaded hierarchy;
- filtered UI puede mostrar un subset, pero el state sigue key-based.

## 29. Disabled nodes

Applied disabled keys no se eliminan. Gesture sobre disabled se bloquea. En propagation y aggregation, un disabled node es boundary: no se atraviesa su subtree desde un ancestor. Descendientes enabled visibles pueden seleccionarse directamente y no cuentan para aggregation del ancestor a través de esa boundary.

## 30. Flatten projection

Engine puro e iterativo:

```text
data index + hierarchy + query + expandedKeys
→ validate/index
→ client sibling filter/sort/root page (or remote applied order)
→ transient filter reveal + applied expansion
→ flattened visible projection
```

No mutation, recursion profunda ni DOM knowledge. Complejidad `O(V+E)` para index/flatten y `O(nodes × predicates)` para filter.

## 31. Virtualization

Fixed-height P1 opera sobre flattened visible nodes, nunca hidden tree. Expand/collapse cambia `projectionRevision` y longitud. Window math usa half-open ranges, overscan y spacers; focus/anchor se preserva por K, no por índice viejo. Variable height queda fuera de scope.

## 32. Remote virtualization

Se congela **Option A**: virtualizar únicamente la secuencia visible currently loaded. No existe global server-defined visible-tree index ni VIEWPORT transport. Large remote trees escalan mediante root pagination y lazy children. `rangeChange` describe presentation local; no solicita backend.

Esta limitación es explícita y evita rangos cuyo dominio cambia.

## 33. Child counts/hasChildren

El state de relation permite NO CHILDREN (complete empty), HAS CHILDREN LOADED, HAS CHILDREN UNLOADED/PARTIAL y UNKNOWN. `total` mejora `aria-setsize` y diagnostics si backend lo conoce, pero puede ser `null`. No se requiere un count imposible.

## 34. Editing

Cell/row edit P1 reutiliza session primitives neutrales, keyed por `K + columnId`. Draft privado no muta ni se exporta. Commit propone consumer-owned T replacement.

Si collapse/filter/removal oculta el edited node, se emite exactamente una cancel/edit-state proposal reason `hidden`, se cierra el token local y no se repite aunque el parent rechace. No CVA, Forms en basic ni draft cache global.

## 35. Row detail

OUT OF SCOPE P1. Tree expansion ya ocupa la semántica expanded. No se añaden detail rows, synthetic rows ni un segundo `expandedKeys` concept.

## 36. Grouping

OUT OF SCOPE P1. Table grouping no equivale a hierarchy. Los consumers modelan groups como domain nodes/relations cuando realmente son parte del árbol.

## 37. Reorder

Tree drag/reparent es P3 (Prime F-104) y queda fuera. No rowReorder output P1. Una futura fase deberá diseñar before/after/inside, sibling versus reparent, disabled targets, cycle prevention y proposal payload sin mutar T.

Column reorder sí pertenece a controlled layout.

## 38. Cycle/orphan handling

El validator iterativo detecta cycles, duplicate K, duplicate parentage, duplicate child refs, missing T y orphan refs. Nunca entra en loop ni asigna arbitrariamente un segundo parent. En dev produce diagnostic determinista; en prod omite el edge inválido y emite `featureError` una vez por fingerprint, preservando el resto válido.

## 39. Export

P1 formats CSV/JSON/XLSX con scopes `visible | loaded | selected`:

- visible: flattened visible T en presentation order, sin synthetic nodes;
- loaded: reachable loaded T una vez, preorder jerárquico, independientemente de collapsed state;
- selected: loaded T correspondientes a applied keys.

CSV/JSON/XLSX son flat column-projected; hierarchy-preserving JSON queda P2. Remote missing data delega por `exportRequest`; no hidden fetch/enumeration. Private serializers de NeuTable se comparten detrás de dynamic imports.

## 40. Treegrid semantics

Renderer usa HTML table con `role="treegrid"`, rows, columnheader/gridcell, `aria-level`, `aria-expanded` solo en parents, `aria-posinset`, `aria-setsize` cuando conocido, `aria-selected` y `aria-multiselectable`. SSR emite estos atributos directamente; no after-render DOM patch.

La base normativa es [W3C WAI-ARIA APG Treegrid](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/) y el modelo de edición/navegación de [APG Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

## 41. Keyboard

Se elige row-focused treegrid:

| Key      | Behavior                                                  |
| -------- | --------------------------------------------------------- |
| Down/Up  | next/previous visible node                                |
| Home/End | first/last loaded visible node                            |
| Right    | expand collapsed parent; otherwise first loaded child     |
| Left     | collapse expanded parent; otherwise parent                |
| Space    | selection gesture when enabled                            |
| Enter    | default row action; editor enters only on editable target |
| Escape   | cancel active editor                                      |
| Tab      | enters/leaves interactive descendants, not row navigation |

Hierarchy Left/Right is logical and RTL-aware. Navigation handlers ignore events owned by editors/inputs/links unless the editor explicitly returns control.

## 42. Focus

Una sola row tiene `tabindex=0`; las demás `-1`. Focus identity es K. Collapse con focused descendant devuelve focus al collapsing ancestor; removal usa nearest visible ancestor, luego next/previous, luego container. Virtual unmount conserva focus token y restaura afterNextRender si vuelve a window. Remote child load no mueve focus automáticamente.

No per-row listener ni O(n²) DOM scan.

## 43. SSR

Server renderiza la hierarchy loaded aplicada, incluidos expanded branches ya suministrados, niveles, paths semánticos y treegrid attributes. Cero requests, geometry, browser globals o export chunks. Unsatisfied relations se presentan como estado aplicado, no se cargan.

## 44. Hydration

DOM SSR se reutiliza sin NG050x. Satisfied roots/branches emiten cero requests. Expand unloaded: proposal → parent acceptance → exactamente una child request. No duplicate state echoes, listener duplication ni chunk load inicial. First keyboard/edit/export command es exactly-once.

## 45. Zoneless

Angular 22 signal-first con `provideZonelessChangeDetection()`, sin Zone.js y sin explicit OnPush. Inputs/computed controlan presentación; commands/output handlers controlan intents.

## 46. Signals

| Concern                                                        | Category        | Owner                    |
| -------------------------------------------------------------- | --------------- | ------------------------ |
| data/hierarchy/roots/children                                  | INPUT           | parent                   |
| query/expandedKeys/selection/layout/editState                  | INPUT           | parent                   |
| `*Change`, edit/action/export intents                          | PROPOSAL        | component → parent       |
| exact indexes, validation, filter/sort, flatten, indeterminate | COMPUTED DOMAIN | private                  |
| request IDs/fingerprints                                       | EPHEMERAL       | instance                 |
| viewport geometry/anchor                                       | EPHEMERAL       | instance                 |
| focus token                                                    | EPHEMERAL       | instance                 |
| edit draft/session                                             | EPHEMERAL       | private optional feature |
| requests                                                       | EFFECT          | coordinator only         |
| viewport listener/measurement                                  | EFFECT          | lifecycle only           |

No writable signal duplica applied parent state.

## 47. Effects

Máximo exacto de product effects: dos.

1. Request coordinator, browser-only.
2. Viewport lifecycle/measurement, solo con virtualization enabled.

Focus usa event handlers + `afterNextRender`, no domain effect. No effect per node, relation, editor o branch.

## 48. Listener/resource budget

- 0 listener/observer por node.
- Event delegation fija en renderer: como máximo keydown, click, dblclick/contextmenu.
- Virtual: un scroll listener, 0/1 ResizeObserver, ≤1 scheduled rAF.
- No MutationObserver, polling, timers de retry ni global listeners persistentes.
- Destroy limpia listeners, observer, rAF, pending download y late UI actions.

## 49. Performance targets

Benchmarks frozen: 1k y 10k visible; deep chain 1k; wide roots 10k; expand 100 children; collapse subtree; filter 10k; sibling multi-sort; loaded-subtree selection; virtual top/mid/end; lazy child request; 100 create/destroy.

Targets:

- flatten/index `O(V+E)` y sin stack overflow;
- filter `O(nodes × predicates)`;
- sort `Σ sibling O(n log n)`;
- selection linear en touched loaded subtree;
- virtual DOM bounded por viewport + overscan;
- no O(n²) focus/ARIA pass.

Measurements reportan host, p50/p95, allocation observation y DOM count; no claims de navegador basados en Node.

## 50. Bundle strategy

Basic incluye facade, renderer, hierarchy/query/selection core y neutral primitives mínimas. Excluye NeuTable/TableCore/Router/HTTP/storage/CDK/Forms, advanced filter builder, editor y export serializers.

- basic initial target: ≤50 KB gzip;
- root-unused: 0 B raw;
- editor/filter/export: private dynamic chunks;
- rich runtime configuration no justifica duplicar components/entrypoints;
- bundle gate atribuye cualquier delta >5% entre fases.

## 51. Legacy baseline

Checkpoint `c1e07dddd42ac27e8e46960ec0b34a4176b59162`, rama `v2`.

### API/features/dependencies

- 49 inputs, 25 outputs, nueve methods y 18 composition selectors efectivos.
- Hierarchy nested `NeuTreeTableNode`, root pagination, sibling sort, strict/lenient filter, expansion, selection propagation, virtual, editing, templates, context menu, export delegation and URL passthrough.
- Runtime imports: Angular core/common, `@neural-ui/core/table`, `@neural-ui/core/internal`; Table closure retiene Forms, Router, CDK scrolling/overlay y optional Table chunk.

### Tests/build/SSR

- Directed: 3 files, 76/76 tests PASS (47 component, 25 expanded hierarchy cases, 4 directives).
- Production build PASS.
- SSR import smoke: 102/102 entrypoints PASS.
- Real Angular 22.1.6 consumer + basic/configured TreeTable SSR render PASS; configured filter excludes unrelated node.
- DOM baseline: semantic `<table>` delegated a Table; treegrid role/level/expanded/posinset/setsize/tabindex se aplican client-side mediante `afterRenderEffect`, por lo que SSR no tiene la misma semantic source of truth.

### Bundle reproducible

Angular externals, esbuild ESM/minified/splitting over built package:

| Scenario                  | Initial raw | Initial gzip | Lazy Table optional raw | Lazy gzip |
| ------------------------- | ----------: | -----------: | ----------------------: | --------: |
| basic component import    |   750,411 B |    138,496 B |               161,970 B |  23,083 B |
| rich entrypoint namespace |   750,714 B |    138,623 B |               161,970 B |  23,083 B |

TreeTable FESM alone: 120,496 B raw, 18,411 B gzip, 15,365 B Brotli. La diferencia confirma que el coste real del consumer viene del edge a Table 1.x; no se “optimiza” legacy.

### Pure projection performance baseline

Node host, 5 warmups + 30 samples, generation/allocation included:

| Scenario         |       p50 |       p95 |
| ---------------- | --------: | --------: |
| roots 1k         |  0.531 ms |  0.922 ms |
| roots 10k        |  5.836 ms |  6.575 ms |
| deep chain 1k    |  0.498 ms |  0.659 ms |
| filter 10k       |  5.081 ms |  7.948 ms |
| sibling sort 10k | 31.122 ms | 34.092 ms |

Son baseline comparativo del pure controller, no product/browser claims.

## 52. Legacy 42/21/8 ledger

El ledger exhaustivo vive en `N2-TREETABLE2-LEGACY-LEDGER.md`: 42/42 inputs, 21/21 outputs y 8/8 method calls clasificados KEEP/CHANGE/MERGE/RENAME/REMOVE/INTERNALIZE/OUT OF SCOPE, sin DEPRECATE.

Resumen: sort/search → query; lazy → dataRequest; selection events → selectionChange; edit lifecycle → edit state/commit/cancel; layout events → layoutChange; context actions → rowAction; URL/storage → external adapter; grouping/row detail/row DnD → fuera de P1.

## 53. Prime baseline mapping

Se reutiliza la auditoría F-071…F-105, sin macroaudit nueva.

| Bucket           | IDs / decision                                                                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1 PARITY TARGET | F-071 hierarchy, F-073 expansion, F-084 states/templates, F-086 root pagination, F-090/091 columns/layout, F-092/093 editing, F-095 templates, F-096 context intent, F-103 export, F-105 responsive                        |
| P1 REDESIGN      | F-072 domain clean, F-074–076 selection, F-077–079 filters, F-080/081 sort, F-082/083/085 remote, F-088/089 virtual, F-094 typed templates, F-097 external persistence, F-098–102 treegrid/keyboard/ARIA/complexity/bundle |
| P2               | F-087 advanced paginator composition; hierarchy-preserving JSON; symbolic subtree selection only with new evidence                                                                                                         |
| OUT OF SCOPE/P3  | F-104 tree drag/reparent; variable height, grouping and row detail                                                                                                                                                         |

No scoring ni “winner” claim.

## 54. API before/after

| Metric                        |             TreeTable 1.x | NeuTreeTable 2 target |
| ----------------------------- | ------------------------: | --------------------: |
| Inputs                        |                        49 |                    22 |
| Outputs                       |                        25 |                    12 |
| Methods                       |                         9 |                     4 |
| Template directives/selectors |              18 effective |                    11 |
| Generic facade                |            erased/partial |               `T,K,F` |
| Remote outputs                |  lazy + query/event paths |     1 (`dataRequest`) |
| Applied state owners          | mixed/internal forwarding |           parent-only |

Los 66 public types target resultan de query/hierarchy/selection/edit/request/template contracts fuertemente tipados. No se añade mega-object genérico; las configs agrupan familias cohesionadas.

## 55. Migration examples

### Simple

```ts
// 1.x: nested NeuTreeTableNode<T>
nodes = [{ id: 'a', label: 'A', data: accountA, children: [...] }];

// 2.x: T + applied relation
data = [accountA, accountB];
hierarchy = {
  hierarchyRevision: 1,
  queryRevision: 0,
  roots: loaded(['a']),
  children: [{ parentKey: 'a', relation: loaded(['b']) }],
};
rowKey = (account: Account) => account.id;
```

### Lazy children

```html
<neu-tree-table
  dataMode="remote"
  [data]="data"
  [hierarchy]="hierarchy"
  [expandedKeys]="expandedKeys"
  (expandedKeysChange)="acceptExpansion($event.next)"
  (dataRequest)="load($event)"
/>
```

El CHILDREN request aparece solo después de que el input aplicado acepte la expansión.

### Selection

```ts
selection = { kind: 'keys', keys: ['a'] };
selectionOptions = {
  mode: 'checkbox',
  indicator: 'checkbox',
  selectOnRowClick: false,
  modifier: 'toggle',
  range: false,
  propagation: 'loaded-subtree',
  toggleAllScope: 'visible',
};
```

### Filters/sort/root page

```ts
query = {
  page: 0,
  pageSize: 25,
  search: 'finance',
  sort: [{ field: 'name', direction: 'asc' }],
  filters: null,
};
```

Sort opera por siblings; pageSize cuenta roots; filter presenta matches + ancestors.

### Virtual

```ts
virtualizationOptions = { enabled: true, itemSize: 40, overscan: 6 };
```

Solo virtualiza flattened loaded visible nodes.

### Editing

```ts
editState = { kind: 'cell', key: 'a', columnId: 'name' };
// editCommit proposes a draft; consumer replaces T and then clears editState.
```

No runtime compatibility ni legacy aliases.

## 56. Shared extraction plan

No se mueve código en A. En fases futuras, con gates NeuTable + TreeTable:

| Current NeuTable 2 source                               | Extract/share                                                                 | Keep private                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------- |
| `internal/identity/neu-table-row-identity.ts`           | exact key token/equality                                                      | row projection                                  |
| `internal/client-pipeline/neu-table-client-pipeline.ts` | `normalizeNeuTableText`, field resolver core, predicate evaluator, comparator | flat partition/search/filter/sort/page pipeline |
| `internal/editing/neu-table-editing.ts`                 | generic session/read/draft/reconcile helpers                                  | Table-specific events/tokens                    |
| `internal/features/export/*`                            | CSV/JSON/XLSX serializers                                                     | Table projection/scopes                         |
| `internal/virtualization/neu-table-virtualization.ts`   | range normalization, coverage, offsets/index math                             | Table remote request alignment                  |
| `internal/semantics/neu-table-basic-projections.ts`     | primitive value presentation if exact                                         | Table visible-column projection                 |

Extraction is package-private, produces no new public entrypoint/symbol and must leave all 124 NeuTable directed tests, contracts, bundle and SSR/hydration green.

## 57. K unblock plan

```text
Implement/certify NeuTreeTable 2 in private candidate
→ migrate TreeTable entrypoint atomically to NeuTreeTable 2
→ prove zero TreeTable edge to Table 1.x/TableCore/NeuTable facade
→ remove TreeTable 1.x runtime
→ resume N2-011K
→ remove Table 1.x + TableCore
→ promote NeuTable 2 from table/next to final table
→ regenerate final package/contracts and certify
```

No circular compatibility period, hidden second Table o dual TreeTable public API.

## 58. Implementation phases

- N2-015B: executable contracts, private renderer, identity and hierarchy validation.
- N2-015C: expansion, flatten, treegrid, keyboard and focus.
- N2-015D: selection, propagation and indeterminate.
- N2-015E: query, sibling sort, filtering, root pagination, columns/layout.
- N2-015F: remote roots/children state machine.
- N2-015G: fixed visible-sequence virtualization.
- N2-015H: editing, row actions, export and private optional chunks.
- N2-015I: SSR/hydration/a11y/performance/bundle certification and K readiness.

El detalle y dependencia exacta vive en `N2-TREETABLE2-IMPLEMENTATION-PLAN.md`.

## 59. Gates

Cada fase usa pure/integration/type/boundary gates proporcionales. SSR aparece desde B y en cambios remote/virtual/optional; hydration en F/G/H; a11y en C/D/I; bundle y performance donde cambia el closure. Full library suite y global coverage se reservan para I, sin bajar thresholds.

Certificación final exige Angular 22 real, browser hydration, zoneless, build/package/imports/SSR, publint/ATTW, root-unused 0, basic ≤50 KB gzip, exact effect/listener census y full P1 matrix.

## 60. Risks

- **Backend partial relations:** mitigado con states/revisions explícitos y loaded-only semantics.
- **Selection expectation over unloaded descendants:** declarado no soportado P1; cualquier necesidad simbólica vuelve a design review.
- **Large root sets:** root pagination, no fake flattened remote viewport.
- **Tree column hidden:** diagnostic determinista, no silent fallback.
- **Deep/cyclic malformed graphs:** traversal iterativa + validation.
- **Editing node hidden:** exactly-once cancel token.
- **Shared extraction regression:** NeuTable gates obligatorios antes/después.
- **Bundle creep:** zero facade edge + dynamic optional chunks + per-phase attribution.

## 61. Open decisions

No quedan decisiones materiales para B. Quedan explícitamente diferidas, no abiertas:

- symbolic remote subtree selection (P2/design review);
- hierarchy-preserving JSON (P2);
- advanced paginator surfaces (P2);
- variable-height/global remote flattened virtualization (fuera de P1);
- row detail, grouping y tree drag/reparent (fuera de P1/P3).

Valores de presupuesto se medirán, pero no cambian ownership ni contratos.

## 62. Final recommendation

**APPROVED FOR IMPLEMENTATION**

Siguiente fase autorizable: N2-015B. No iniciar automáticamente. N2-011K permanece pausada hasta la certificación N2-015I.
