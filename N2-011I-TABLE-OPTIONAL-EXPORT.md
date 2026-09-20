# N2-011I — NeuTable 2 optional features + export

## 1. Status

**PASS.** N2-011I queda implementado y verificado sin iniciar N2-011J.

## 2. Scope

El cambio cierra exclusivamente la exportación P1 de NeuTable 2: proyección de dominio, scopes congelados, serializadores CSV/JSON/XLSX, carga privada dinámica, delegación remota y evidencia de errores, rendimiento, bundle, SSR e hidratación.

## 3. Optional inventory

| Clasificación | Capacidades congeladas |
| --- | --- |
| IMPLEMENT NOW | `export(request)`, CSV, JSON, XLSX propio, scopes locales, delegación remota, `exportRequest`, `featureError`, chunks privados, retry |
| ALREADY COVERED | advanced filter builder y active editor privados; virtualization certificada como core síncrono pequeño en G |
| DEFERRED | ninguna capacidad asignada a I |
| OUT OF SCOPE | UI pública de export, descarga browser, HTTP/backend, Router/storage, grupos sintéticos, detail rows, drafts y nuevos entrypoints |

## 4. Implement/defer decisions

Se implementaron las capacidades exactas de I. No se añadieron inputs, outputs, métodos, directivas, tipos, componentes públicos ni dependencias. La descarga browser no forma parte del contrato congelado: el outcome entrega bytes.

## 5. Export architecture

`export(request)` proyecta las filas y columnas con primitivas ya aprobadas; si faltan datos remotos delega, y si son locales carga por `import()` únicamente el serializador solicitado. El resultado vuelve como `NeuTableExportOutcome`.

## 6. export() method

El método público existente tiene comportamiento real. Cada llamada crea una ejecución local e independiente, conserva el `fileName` solicitado y devuelve `generated` o `delegated`; no añade métodos por formato.

## 7. exportRequest

`exportRequest` se emite exactamente una vez cuando la proyección requiere datos que la tabla remota no posee. No es un segundo owner ni un canal de datos: el consumer decide cómo resolver la exportación externa.

## 8. Ownership

Export no modifica `query`, `selection`, `layout`, `expandedKeys`, `grouping`, `editState`, `data` ni `metadata`. No produce correcciones ni ecos controlados.

## 9. Client scopes

| Scope | Filas y orden |
| --- | --- |
| `page` | pinned-start, página query de normales, pinned-end; con virtualización usa el resultado lógico completo porque pagination queda desactivada |
| `loaded` | todas las filas de dominio poseídas, con pinned una sola vez |
| `filtered` | pinned y normales tras search/filter/sort canónicos |
| `selected` | keys poseídas o alcance all-matching client, menos exclusiones |
| `all` | todas las filas lógicas client poseídas |

## 10. Remote scopes

`page` y `loaded` exportan el slice poseído. `filtered` solo es local si el total demuestra que todo está cargado. `selected` solo es local para keys completamente cargadas. `all`, query no aplicada, keys ausentes y all-matching delegan.

## 11. All-matching

En client se aplica el scope congelado y se excluyen keys sin materializar una colección adicional de selección. En remote se devuelve `delegated`; nunca se enumeran backend ni millones de keys.

## 12. Virtualization

La virtualización sigue siendo presentación. El export client usa el resultado lógico, no las filas montadas. El test real exporta 100 filas con una ventana DOM limitada.

## 13. Grouping

Solo se exportan `T` de dominio. No entran group headers, footers, aggregates ni nodos sintéticos. Grouping remoto continúa loaded-only y no se presenta como agrupación global backend.

## 14. Expansion

RowDetail, contenido de template y filas detail sintéticas quedan excluidos. Expansion no cambia el conjunto exportado.

## 15. Editing

El draft privado activo no se exporta ni fuerza commit. La proyección usa exclusivamente datos committed controlados por el consumer.

## 16. Columns

Se usa `visibleColumns()`: orden aplicado, columnas ocultas excluidas, header contractual y solo columnas de dominio con `field` o `value`. La columna técnica de selección y las columnas action-only no se exportan.

## 17. Field resolution

La lectura reutiliza `readNeuTableColumnValue` y el resolver canónico de query. No hay dot-path magic, `Object.keys(row)`, escaneo DOM ni cuarta resolución.

## 18. CSV

Serializador privado UTF-8 con BOM, delimitador coma, CRLF, headers, todas las celdas quoted, comillas duplicadas, null/undefined vacío, Unicode, fechas ISO y valores deterministas.

## 19. CSV security

Se aplica F-064: strings cuyo primer carácter efectivo tras espacios/tabs es `=`, `+`, `-` o `@` reciben apóstrofo. El contenido sigue quoted y no se convierte en fórmula.

## 20. JSON

Genera un array determinista de objetos proyectados en orden de columnas. Normaliza fechas, bigint, arrays y objetos plain con keys ordenadas; detecta ciclos y excluye internals Angular/renderer.

## 21. XLSX

Writer privado propio, sin dependencia externa: ZIP almacenado, workbook/sheet XML, headers y tipos string/number/boolean. Strings que empiezan por `=` son `inlineStr`, nunca fórmulas implícitas.

## 22. Dynamic boundaries

Existen tres imports privados separados: CSV, JSON y XLSX. Ninguno se exporta públicamente y ninguno arrastra Table 1.x, TableCore, root barrel ni runtime tercero.

## 23. Feature loading

La carga ocurre directamente desde el command path. No hay preload, factory global ni effect de dominio. Un fallo de carga puede reintentarse en la llamada siguiente.

## 24. Effects ledger

Permanece exactamente en dos effects de producto: request coordinator y viewport lifecycle. Export añade cero effects.

## 25. Concurrency

Dos o más `export()` concurrentes conservan matrices, loaders, bytes y promises independientes. No existe singleton, buffer ni `currentExport` global.

## 26. Errors

Errores de formato runtime, carga o serialización rechazan la Promise según contrato. No se convierten en `metadata.error`, no se silencian y no alteran state.

## 27. featureError

Solo se emite para fallos reales de exportación, con `feature:'export'` y `recoverable:true`. Delegación y outcomes normales no lo usan.

## 28. SSR

Importar/renderizar NeuTable no evalúa serializadores ni APIs browser. Los módulos de formato usan `TextEncoder` al cargarse solo desde el comando; SSR no llama export y no carga sus chunks.

## 29. Hydration

PASS zoneless: DOM SSR reutilizado, cero NG050x, cero ecos iniciales y ningún chunk export antes del comando. El primer JSON post-hidratación ejecuta una vez y provoca una única carga JS adicional.

## 30. Browser download

No se añadió descarga, `Blob`, anchor, `URL.createObjectURL` ni acceso a `window/document`. El contrato entrega bytes y mantiene separado cualquier side effect del consumer.

## 31. Cleanup

No quedan URLs, nodos, listeners ni buffers globales. Si la instancia muere durante una carga, una Promise puede completar, pero no hay descarga ni emisión tardía; `featureError` queda suprimido tras destroy.

## 32. Encoding

CSV/JSON usan UTF-8 determinista; CSV incluye BOM y JSON no. XLSX contiene XML UTF-8. No se usa `toLocaleString()`.

## 33. Filename

Se devuelve exactamente `request.fileName`. No se añade extensión, timestamp, random suffix ni default inventado.

## 34. Selection

Keys se resuelven por identidad semántica y se exportan una vez. Selected remoto con keys no cargadas delega; all-matching no se materializa.

## 35. Pinned rows

Son `T` normales separados solo para presentación. Se deduplican por key y aparecen una única vez conforme al scope.

## 36. Performance CSV

Baseline reproducible, 25 samples: 1k p50 **0.419 ms**, p95 **0.502 ms**, **31,013 B**; 10k p50 **4.409 ms**, p95 **4.651 ms**, **339,713 B**. Carga fría observada: **4.619 ms**.

## 37. Performance JSON

1k p50 **0.622 ms**, p95 **0.678 ms**, **86,982 B**; 10k p50 **6.563 ms**, p95 **6.745 ms**, **899,682 B**. Carga fría observada: **4.043 ms**.

## 38. Performance XLSX

1k p50 **5.768 ms**, p95 **6.294 ms**, **177,445 B**. Carga fría observada: **6.677 ms**. Download side-effect: no aplicable por contrato.

## 39. Memory

Matrices medidas: 4,000 y 40,000 celdas. Heap delta observacional tras la batería repetida: **19,412,024 B**; las principales allocations son matriz proyectada, texto/XML y `Uint8Array`. No se retienen resultados al completar.

## 40. Remote large total

Fixture con `totalItems=1,000,000` y slice pequeño: cero allocation proporcional al total, cero HTTP, cero `dataRequest`, cero materialización de keys; `all` y all-matching delegan.

## 41. Bundle basic

**30,044 B gzip** frente a **29,127 B** en H: delta **+917 B gzip**, dentro del gate de investigación de ~1 KB. El coste corresponde al command plumbing y proyección compartida, no a serializadores.

## 42. CSV initial/chunk

Initial **30,044 B gzip**; chunk CSV privado **584 B raw / 383 B gzip / 338 B Brotli**.

## 43. JSON initial/chunk

Initial **30,044 B gzip**; chunk JSON privado **887 B raw / 469 B gzip / 410 B Brotli**.

## 44. XLSX initial/chunk

Initial **30,044 B gzip**; chunk XLSX privado **3,964 B raw / 1,422 B gzip / 1,278 B Brotli**. El writer completo queda fuera de BASIC.

## 45. Combined bundle

Combined initial sigue **30,044 B gzip**: ningún formato se incluye hasta invocarlo. Los tres chunks continúan separados y cargables de forma independiente.

## 46. Bundle attribution

Core retiene facade/loader/proyección de scopes; la proyección export aporta ~2,048 B minificados en el grafo source y explica el delta junto con el command plumbing. Los serializers aislados aportan ~549 B CSV, 851 B JSON y 3,928 B XLSX minificados antes de compresión.

## 47. Root-unused

**0 B raw**, gate PASS.

## 48. Dependencies

Cero dependencias nuevas y package lock intacto. No Router, HTTP, storage, CDK, PrimeNG, third-party grid, TableCore, Table 1.x, SheetJS, `xlsx` ni ExcelJS.

## 49. Pure tests

9/9: scopes page/filtered/selected/all-matching, virtual logical result, remote huge total, projection de columnas, CSV seguro, JSON determinista, XLSX válido/no fórmula y fallo/retry de loader.

## 50. Integration tests

5/5 con NeuTable real: tres formatos concurrentes, layout/columnas, query, selección, virtualización, remote loaded/delegated, grouping/expansion/draft, failure/retry y destroy.

## 51. Exactly-once

Una llamada produce una proyección y una carga/serialización. Hydration, outputs y DOM bubbling no duplican invocaciones; el fixture hidratado lo valida con contador 1.

## 52. State side-effects

Cero `queryChange`, `selectionChange`, `layoutChange`, `expandedKeysChange`, `groupingChange`, `editStateChange`, `dataRequest` y `rangeChange` por export local o delegado.

## 53. Lifecycle

El flag privado de destroy solo bloquea side effects tardíos. No cambia el outcome contractual, no añade recursos lifecycle y no interfiere con los coordinadores existentes.

## 54. Type/contract gates

PASS: `test:n2-table-types`, 17 formas inválidas rechazadas; `test:n2-table-contracts`, 6/6; ledger PASS; arquitectura PASS; boundary actual PASS; dos effects y cero symlinks PASS.

## 55. Legacy regressions

PASS **364/364** en component, export controller, selection controller y grouping controller. No se modificó runtime legacy.

## 56. Build/package

`npm run build` PASS. `verify:package` PASS sobre **431 archivos**. El package público permanece en el entrypoint actual y la candidata sigue privada.

## 57. API surface

Sin cambios: **66 tipos públicos + 15 directivas + 1 componente = 82 símbolos**, **24 inputs**, **14 outputs**, **4 métodos**. Cero entrypoints nuevos.

## 58. Regressions

Candidata completa PASS **120/120** en **22 specs**. Export dirigido PASS 14/14; SSR/hydration PASS; bundle/perf PASS. No se ejecutó coverage global ni full suite global.

## 59. Risks

Riesgo residual bajo: serialización grande sigue siendo síncrona y proporcional a las filas realmente poseídas, nunca a `totalItems` remoto. Export server-side queda deliberadamente en el consumer mediante `exportRequest`.

## 60. Git diff

El diff añade projection/loader/serializers privados, 3 specs y fixture hydration, scripts/baselines de bundle/perf y este informe; actualiza facade, package scripts y el test que aún esperaba el placeholder. `git diff --check` PASS. HEAD permanece en `5e18038a2e3dc4784615facf9dc7ae2396c8a381`.

## 61. Git status

Rama `v2`; working tree intencionadamente con cambios N2-011I sin commit, tal como se solicitó. Cero symlinks versionados y cero symlinks nuevos en el workspace. Sin push, tag, release ni npm publish.

## 62. Recommendation

**READY FOR N2-011J.** N2-011J no se ha iniciado.
