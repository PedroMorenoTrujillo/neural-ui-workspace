# N2-011B — Table renderer + facade

## 1. Status

**PASS.** N2-011B queda implementado y verificado como primer runtime básico de NeuTable 2, sin adelantar N2-011C.

## 2. Scope

Se implementó exclusivamente la fachada candidata `<neu-table>`, su renderer semántico privado, las directivas de template ejecutables y la infraestructura de validación de esta fase. No se sustituyó el entrypoint público actual.

## 3. Files created

Se añadieron módulos privados de identidad, proyecciones, registro de templates y renderer; template de fachada; suites funcional y de rendimiento; fixture SSR/hydration; audits de límites y bundle; capturas JSON de bundle, grafo y rendimiento; y este informe. Los contratos públicos existentes se convirtieron en implementaciones sin cambiar su inventario.

## 4. Facade architecture

`NeuTableComponent<T, K, F>` es la única fachada candidata. Recibe contratos mediante input signals, conserva los outputs congelados sin emitirlos en esta fase y delega el DOM a un renderer privado mediante proyecciones `computed`.

## 5. Private renderer architecture

`NeuTableBasicRendererComponent` vive bajo `table/next/internal/renderer`. Renderiza toolbar, caption, header, body, estados y footer/summary, pero no implementa subsistemas diferidos. Su export de TypeScript sólo permite el enlace interno; ningún barrel público lo expone.

## 6. Public/internal boundary

El barrel candidato exporta únicamente 66 tipos, 15 directivas y la fachada. No exporta archivos `internal`. El entrypoint vigente `@neural-ui/core/table` permanece sin referencias a `next`.

## 7. Signal ownership table

| Estado                                     | Owner                   | Lectura derivada                                     |
| ------------------------------------------ | ----------------------- | ---------------------------------------------------- |
| data, columns, metadata                    | consumer/parent         | fachada y renderer                                   |
| query, selection, layout y estados futuros | consumer/parent         | fachada; sólo `layout` participa en B                |
| templates proyectados                      | Angular content queries | maps/first-template `computed`                       |
| filas de render                            | ninguna copia mutable   | `computed` desde `data`, `rowKey`, `rowTrackBy`, pin |
| columnas visibles                          | ninguna copia mutable   | `computed` desde `columns` y `layout`                |

## 8. Writable signals ledger

Producto N2-011B: **0** writable signals y **0** `model()`. Los writable signals usados por fixtures pertenecen al parent de prueba, no a NeuTable.

## 9. Effects ledger

Producto N2-011B: **0 effects**. No hay mirrors, sincronización post-render ni cleanup asociado a effects.

## 10. Data rendering

`readonly T[]` se proyecta en wrappers efímeros de render sin clonar ni mutar las filas. Valores primitivos se presentan directamente; `null`/`undefined` quedan vacíos y objetos arbitrarios requieren template explícito.

## 11. Identity

`rowKey` es la identidad semántica obligatoria. Sin `rowTrackBy`, el tracking usa un token estable y tipado (`number:1` y `string:1` son distintos). `rowTrackBy` sólo controla tracking de render, nunca sustituye la clave semántica. La partición pin start/middle/end es estable.

## 12. Duplicate keys

En desarrollo/test una clave semántica duplicada lanza un error determinista antes de renderizar. La decisión no añade API pública ni coste diagnóstico en producción.

## 13. Columns

La proyección respeta orden, ocultación y width de `layout`; después usa el width declarado por columna. La lectura usa `value` antes que `field`. No hay sort, filter, resize ni reorder interactivo.

## 14. Template contexts

Las 15 directivas congeladas son directivas standalone reales. En B se conectan caption, toolbar, header, cell, footer, summary, empty, loading y error. Los contextos preservan `T`, `K`, `F`, índice y estado aplicable. El fixture ngc incluye casos válidos y negativos con `@ts-expect-error` para clave y field.

## 15. DOM structure

La estructura es `toolbar? → viewport → table → caption? + thead + tbody + tfoot?`. No se copió la estructura monolítica de Table 1.x.

## 16. Semantics

Se usa `<table>` nativo con `<caption>`, `<thead>`, `<tbody>`, `<tfoot>`, `<th scope="col">` y `<td>`. Para este alcance básico, la relación header/cell nativa no necesita IDs sintéticos.

## 17. Header

Una fila de headers renderiza label o template tipado por `columnId`, junto con width/min/max/alignment. No anuncia sorting porque el runtime de sort está fuera de fase.

## 18. Body

Cada fila expone clave semántica, pin opcional, estado disabled y clase de consumer normalizada. Cada celda usa template por columna o fallback seguro. No hay controles interactivos añadidos.

## 19. Empty/loading/error

Los tres estados se derivan exclusivamente de `metadata` y data. Loading/empty usan `role="status"`; error usa `role="alert"`. Todos admiten template y fallback de labels.

## 20. Appearance/density

SCSS mínimo cubre tokens/fallbacks, densidad, bordes, stripes, header sticky y overflow contenido. No se copió el stylesheet antiguo. No existe focus-visible interno porque B no introduce elementos interactivos.

## 21. Parent writes

Reemplazos externos de data, reconstrucción de objetos, reorder, columnas, layout y appearance actualizan el DOM directamente. El test verifica reutilización de nodos por clave y **0 echoes** en los 14 outputs.

## 22. Immutability

Datos, filas y columnas congelados renderizan correctamente. Las proyecciones crean arrays/wrappers propios y nunca ordenan ni escriben sobre inputs del consumer.

## 23. A11y

La tabla recibe `aria-label`; headers usan scope nativo; estados tienen roles apropiados; filas disabled exponen `aria-disabled`. El test confirma ausencia de `tabindex`, IDs de header y `headers` innecesarios.

## 24. Keyboard scope

No se implementó navegación rows/cells ni teclado de features. El scope de B conserva comportamiento nativo del navegador y no crea focus traps ni listeners globales.

## 25. SSR

El fixture SSR real genera tabla, custom header/cell y estados empty/loading/error, y exige anotaciones `ngh`. El render no accede directamente a browser globals.

## 26. Hydration

Chromium bloquea inicialmente JavaScript, captura nodos SSR, libera bundles y confirma la misma identidad de table/thead/row/cell tras hidratar. IDs permanecen estables, no aparece NG050x, no hay outputs/dataRequest y la primera actualización del parent ocurre una vez.

## 27. Zoneless

Unit tests, SSR y browser hydration usan `provideZonelessChangeDetection()`. No existe dependencia de Zone.js para actualizar la candidata.

## 28. Lifecycle/cleanup

El producto no registra listeners globales, observers, timers, subscriptions ni effects. El escenario destroy ×50 pasa. El harness no realiza medición heap de largo plazo; no hay recursos explícitos que liberar.

## 29. Legacy isolation

El audit rechaza imports de Table 1.x, TableCore, Forms, Router, CDK, storage, export y runtimes avanzados. No hay cambios en archivos productivos de Table actual ni TableCore.

## 30. Dependency graph

`baselines/n2-table/renderer-b-dependency-graph.json` conserva atribución por fuente para basic y templates. El paquete compilado sólo importa `@angular/core` y `@angular/common`; no retiene el grafo monolítico.

## 31. Bundle basic

**44.039 raw / 6.329 gzip / 5.286 brotli**. Equivale aproximadamente a 5,5% raw, 4,6% gzip y 5,6% brotli del baseline monolítico de Table 1.x.

## 32. Bundle templates

Fachada más las 15 directivas: **44.490 raw / 6.428 gzip / 5.369 brotli**. Incremento frente a basic: 451 raw / 99 gzip / 83 brotli.

## 33. Root-unused

**0 bytes raw** tras tree-shaking. Los tamaños 20 gzip / 1 brotli corresponden únicamente al contenedor comprimido vacío.

## 34. Bundle attribution

El metafile compilado atribuye 44.007 bytes al FESM plano de table-next; el graph de fuente desglosa fachada, renderer, directivas y helpers. El basic supera TableCore en 13.953 raw / 2.285 gzip / 1.872 brotli por la fachada completa 24/14/4, las declaraciones Angular y templates conectados, pero queda muy lejos de Table 1.x.

## 35. Performance renderer

Baseline almacenado: 100 filas p50 9,851 ms / p95 13,468 ms / 409 nodos; 1.000 filas p50 111,442 ms / p95 123,236 ms / 4.009 nodos; reemplazo 1k 10,068 ms; reorder 1k 68,256 ms; destroy ×50 148,384 ms. No se presenta 10k full-render como comparación equivalente al pipeline paginado anterior.

## 36. Contract gates

`test:n2-table-types`, `test:n2-table-contracts`, `audit:n2-table-ledger` y el audit de límites N2-011B pasan. No se actualizó ningún snapshot 011A para ocultar drift.

## 37. Legacy tests

Table 1.x: **344 PASS**. TableCore: **8 PASS**. Total dirigido: **352 PASS**, sin modificar tests legacy.

## 38. New tests

La suite propia cubre renderer, identidad, columnas, templates, semántica, estados, parent writes, zoneless, immutability, aislamiento, SSR, hydration, bundle, lifecycle y rendimiento. Suite funcional: **5 PASS**; invariantes estáticos: **4 PASS**.

## 39. Build/package

Build productivo PASS. `audit:package` PASS. `verify:package` PASS con 431 archivos. La build temporal de medición prueba la candidata como entrypoint aislado, pero el paquete real no la publica ni cambia el entrypoint vigente.

## 40. API surface 24/14/4 verification

La auditoría AST confirma exactamente **24 inputs, 14 outputs y 4 métodos**, además de 66 tipos + 15 directivas + 1 componente = 82 símbolos. No se añadieron aliases ni miembros públicos.

## 41. Regressions

No se detectaron regresiones funcionales, contractuales, SSR, hydration, bundle o packaging. El build conserva dos warnings NG8102 preexistentes en `menu`, fuera de este alcance.

## 42. Risks

La medición heap prolongada no forma parte del harness; queda mitigada por ausencia de recursos persistentes y destroy ×50. Los objetos complejos sin template se muestran vacíos deliberadamente. El runner SSR requiere un árbol de dependencias Angular SSR 22 mediante `NEU_N2_DEPENDENCIES` cuando no está instalado en el workspace principal.

## 43. Git diff

El diff está limitado a `table/next`, fixtures, scripts, baselines, `package.json` y este informe. No contiene cambios productivos en Table 1.x ni TableCore, ni symlinks.

## 44. Git status

El handoff se deja en commit local dedicado y con working tree limpio. No se hizo push, tag, release ni npm publish.

## 45. Recommendation

**READY FOR N2-011C.** No apareció ninguna stop condition ni decisión pública nueva. N2-011C no se ha iniciado.
