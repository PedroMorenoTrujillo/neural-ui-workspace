# N2-011H — NeuTable 2 Editing, Expansion and Grouping

## 1. Status

**PASS.** N2-011H está implementado y verificado. La resolución normativa eliminó los tres bloqueos de diseño anteriores sin reabrir superficie pública, ownership, protocolo remoto ni geometría virtual.

## 2. Scope

Se implementaron edición de celda/fila, expansión controlada y grouping loaded-only. No se inició N2-011I ni se modificaron export, TreeTable, backend grouping o edición optimista de datos.

## 3. Ownership

`editState`, `expandedKeys` y `grouping` siguen siendo inputs aplicados propiedad del padre; sus outputs son propuestas. NeuTable solo posee sesión/draft transitorios y nunca copia esos estados controlados.

## 4. Signal graph

El grafo mantiene inputs → computed projections → renderer. La sesión, draft, errores y pending son señales privadas; grouping y expansión son proyecciones puras sobre inputs aplicados.

## 5. Writable state

H añade únicamente una sesión privada con generación, baseline y draft. No añade espejos writable de query, layout, selección, expansión o grouping, ni muta filas `T`.

## 6. Effects ledger

Se mantiene el presupuesto congelado de **2 effects**: coordinación de requests y lifecycle del viewport. H no añade effects de sincronización input→writable.

## 7. Editing architecture

La edición usa un motor puro privado y un editor activo privado. Los templates siguen siendo consumer-owned; el fallback nativo usa Signal Forms tras el límite privado `@defer`.

## 8. Active edit session

Solo existe una sesión activa, identificada por `K`, modo, `columnId` cuando aplica y generación. Nunca depende de objeto, nodo DOM, índice visual o ventana virtual.

## 9. Cell editing

Click, double-click, Enter o F2 activan según `editingOptions.activation`; solo columnas con contrato `edit` son editables. Enter/F2 dentro de un control interactivo no reactivan la celda.

## 10. Row editing

El modo fila construye un draft por `column.id` para las columnas editables visibles. Un commit inválido conserva la sesión completa y sus errores.

## 11. Draft ownership

El draft vive fuera del DOM reciclable. Reconstruir la fila con el mismo `K` y fuente equivalente lo conserva; un cambio real del baseline cancela con `data-change`.

## 12. Validation

Se soporta validación sync/async. Cada resultado queda ligado a sesión, generación y versión; cancel, replace o transición semántica invalidan la versión y los resultados tardíos se ignoran.

## 13. Commit

El commit proyecta cambios inmutables y emite `editCommit` como máximo una vez; NeuTable no escribe en `T`. Después propone cierre y restaura el foco lógico si sigue disponible.

## 14. Cancel

Escape/consumer/data-change emiten un único `editCancel`, invalidan validación y proponen cierre una vez. Un write aplicado del padre gana sin echo ni evento artificial.

## 15. Parent data replacement

Mismo `K` + mismo baseline preserva sesión aunque cambie el objeto. Key ausente cancela salvo eviction remota virtual; mismo `K` + fuente modificada cancela con `data-change`.

## 16. Query during editing

Un cambio semántico aceptado de search/filter/sort/page/pageSize cancela una vez con `consumer`. Una propuesta rechazada o query semánticamente igual conserva edición sin echo.

## 17. Selection interaction

Editor, save/cancel y controles de grupo/expansión usan el límite de interacción existente. Sus clicks y teclado no seleccionan filas ni alteran range/all-matching.

## 18. Layout interaction

Resize, pin/unpin, reorder y reconstrucción preservan por `column.id`. Ocultar o eliminar una columna editada cancela una vez; no existe ownership paralelo de layout.

## 19. Virtual editing

Salir de la ventana desmonta DOM sin commit/cancel y conserva draft/validación. Volver reconstruye desde draft; eviction remota suspende y una fuente realmente cambiada cancela.

## 20. Editing A11y

El fallback expone nombre accesible, `aria-invalid`, pending, errores y botones Save/Cancel. La semántica multiline se preserva al no capturar teclas desde descendientes interactivos.

## 21. Expansion owner

`expandedKeys` es la única verdad aplicada. La pertenencia se calcula por identidad canónica de `K`, sin Set espejo writable.

## 22. Expansion proposals

El toggle emite `expandedKeysChange` inmutable con key, próximo array, estado propuesto y source. No muta el input ni emite query/request.

## 23. Expansion template

`neuTableRowDetail` renderiza una fila adyacente con `colspan` técnico correcto. La columna técnica de toggle solo aparece cuando expansión está activa.

## 24. Expansion rejection

Si el padre rechaza, DOM y `aria-expanded` permanecen derivados del input anterior; no hay cambio optimista ni segundo evento.

## 25. Expansion acceptance

Al aplicar `expandedKeys`, el detalle aparece/desaparece una vez. La expansión coexiste con grouping y sigue anclada solo a `K` de dominio.

## 26. Expansion + virtual

Son incompatibles en P1: virtualización gana. No se renderizan toggle/detail, no se emite propuesta/request y el input queda intacto para reactivarse al deshabilitar virtual.

## 27. Expansion A11y

El toggle es `<button type="button">`, con label determinista, `aria-expanded` aplicado y `aria-controls` estable hacia el detalle.

## 28. Grouping owner

`grouping` permanece controlado por el padre. El engine consume `by` y `expandedGroupIds`; no crea árbol writable ni cambia query sort implícitamente.

## 29. Grouping proposals

Collapse/expand produce `groupingChange` inmutable con source `toggle`. Rechazo conserva DOM; aceptación recompone una vez y cancela edición activa según la resolución.

## 30. Client grouping

El dominio completo se obtiene tras search/filter/stable sort y antes de la página visible. Contextos, counts y agregados usan ese dominio pre-page; la proyección usa la página final.

## 31. Remote grouping

En remoto no virtual, `scope:'loaded'` agrupa literalmente el slice/page cargado. No solicita vecinos ni inventa membresía global; counts/agregados son parciales.

## 32. Synthetic rows

Headers, footers y rows usan una unión privada. Los grupos no son `T`, carecen de `K` de negocio y no pasan por rowKey, editing, selection, all-matching, `dataRange` o requests.

## 33. Grouping + sort/filter

Search/filter actúan antes de generar grupos; el sort conserva estabilidad y grouping no añade sort oculto. IDs derivan de path, field y valor canónico, no de índices.

## 34. Grouping + selection

Solo filas de dominio participan en selección, header toggle y rangos. Los controles detienen propagación y los nodos sintéticos nunca son seleccionables/editables.

## 35. Grouping + virtual

Son incompatibles en P1: virtualización gana en client y remote. No se insertan nodos ni cambian índices, spacers, `aria-rowindex`, `dataRange` o request ranges.

## 36. Grouping A11y

Subheaders/footers usan `<tr>`/`<th>`/`<td>` nativos con `colspan`. Collapse usa botón nativo con nombre accesible y estado aplicado.

## 37. Native semantics

Se conservan `<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th>` y `<td>`. Editores, detalles y grupos no sustituyen el modelo nativo.

## 38. Keyboard

Enter/F2 respetan activation; Escape cancela; Save es explícito. Teclas dentro de inputs, textareas, selects, buttons o contenteditable permanecen en el editor.

## 39. Focus

La activación enfoca el editor cuando el padre aplica la propuesta. Commit/cancel restauran la celda lógica por `K` + `columnId` si existe; scroll virtual no roba foco.

## 40. SSR

SSR renderiza estado aplicado determinista, sin focus ni validación de red. Virtual+expansion/grouping renderiza solo virtualización en servidor y browser.

## 41. Hydration

El fixture real verifica edición aplicada, cancel por query y commit exactamente una vez, expansión, grouping, reutilización de DOM y cero `NG050x`.

## 42. Zoneless

El fixture SSR/browser corre zoneless y pasa sin Zone.js, timers de estabilización o effects de sincronización adicionales.

## 43. Lifecycle

Generaciones invalidan validación tardía; cleanup deja cero sesiones. Los listeners/observer/frame virtuales conservan invariantes de N2-011G.

## 44. Edit performance

PASS: start edit p95 **0.0023 ms**; draft/commit permanecen submilisegundo y 100 ciclos start/cancel dejan cero sesiones activas.

## 45. Expansion performance

Baseline: toggle p95 ≈ **0.0067 ms** para 100 keys y **0.0756 ms** para 1k. No añade trabajo al scroll virtual porque allí queda inactiva.

## 46. Grouping performance

PASS: 1k rows p95 **0.1640 ms** y 10k rows p95 **1.5876 ms** en captura final; 20/100 grupos respectivamente.

## 47. Recompute evidence

Scroll virtual no repite search/sort/filter/grouping y inputs equivalentes no reinician sesión. Grouping recalcula por dominio/configuración, no por eventos DOM.

## 48. Bundle basic

**168,789 B raw / 29,127 B gzip / 24,472 B Brotli**. Delta frente a G basic: **+5,339 B gzip**, atribuido al bridge controlado y proyecciones H.

## 49. Bundle editing

**174,393 B raw / 30,224 B gzip / 25,254 B Brotli** al alcanzar el editor. El motor puro aislado mide **803 B gzip**.

## 50. Bundle expansion

**29,127 B gzip**, igual a basic: membership/toggle/detail forman parte pequeña del renderer único y no justifican módulos adicionales.

## 51. Bundle grouping

**29,127 B gzip**, igual a basic. El engine aislado con IDs, rowspan, contextos y agregados mide **1,090 B gzip**.

## 52. Bundle combined

**181,912 B raw / 31,897 B gzip / 26,135 B Brotli**; delta frente a G combined: **+7,962 B gzip** con editor alcanzado.

## 53. Private/lazy chunks

Signal Forms queda en chunk privado de **1,414 B gzip**; advanced filters conserva **1,939 B gzip**. No se añadieron entrypoints, feature modules ni imports públicos.

## 54. Root-unused

El consumidor root sin usar NeuTable retiene **0 B raw** (20 B gzip/1 B Brotli son framing del stream vacío).

## 55. Dependencies

Signal Forms solo aparece en el editor privado; no hay CVA, `NG_VALUE_ACCESSOR` ni adapter Neural. El grafo no contiene tokens prohibidos.

## 56. Pure tests

PASS para session/draft/reconciliation/commit e IDs, collapse controlado, null, domain pre-page, rowspan, aggregates y aislamiento de errores.

## 57. Integration tests

H cubre exactly-once, reconstrucción, fuente/query/layout, validación tardía, virtual client/remote, rechazo/aceptación, loaded-only y reactivación post-virtual.

## 58. Type/contract gates

PASS: tipos T/K/F, 17 formas inválidas, 6 contratos, ledger, renderer audit y superficie congelada de **82 símbolos / 24 inputs / 14 outputs / 4 métodos**.

## 59. Legacy regressions

PASS **108/108** pruebas legacy dirigidas: lazy/virtual, lazy data, grouping, expand, selection, keyboard, editing y parity. Sin coverage global.

## 60. Build/package

`npm run build` PASS y `verify:package` PASS sobre **431 archivos**. La batería candidata final suma **105/105** pruebas en 19 specs.

## 61. API surface

No hay símbolos públicos nuevos ni TableCore público. Helpers, nodos, editor y engines permanecen internos.

## 62. Regressions

No se detectaron regresiones runtime. Solo quedan warnings NG8102 preexistentes de Menu; los diagnósticos virtual-expansion/grouping son intencionados y probados.

## 63. Risks

Grouping remoto describe solo datos cargados; expansion/grouping no operan con fixed-height virtual en P1; Promises sin AbortSignal no se abortan físicamente, pero sus resultados se invalidan.

## 64. Git diff

El diff contiene implementación, fixtures, scripts y baselines H; `git diff --check` PASS. No hay cambios N2-011I, push, tag, release ni publish.

## 65. Git status

Rama **v2**, working tree deliberadamente modificado y sin commit porque no se solicitó. No hay temporales de hydration ni symlinks añadidos/versionados.

## 66. Recommendation: READY FOR N2-011I

**READY FOR N2-011I.** N2-011H cumple arquitectura, contratos, interacción, SSR/hydration, rendimiento, bundle, regresiones y paquete. N2-011I no se ha iniciado.
