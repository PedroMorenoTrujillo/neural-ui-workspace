# N2-011K — NeuTable 2 physical replacement

## 1. Status

**TABLE 2 PHYSICAL REPLACEMENT BLOCKED.** La condición de parada de TreeTable de las secciones 12 y 59 de la autorización se activa antes de modificar runtime.

## 2. Starting checkpoint

- Rama: `v2`.
- HEAD: `c1e07dddd42ac27e8e46960ec0b34a4176b59162`.
- Mensaje: `test(table): certify NeuTable 2 for N2-011K`.
- Working tree inicial: limpio.
- Symlinks versionados iniciales: 0.

## 3. Scope

Se releyeron la arquitectura, contratos, plan, informes A–J y addenda normativos. La inspección se limitó a la sustitución física, entrypoints, consumidores y especialmente el desacoplamiento requerido de TreeTable. No se reabrieron decisiones certificadas ni se inició otra macrofase.

## 4. Candidate promotion

No ejecutada. Promover `projects/ui-core/table/next/**` y borrar Table 1.x dejaría TreeTable sin un runtime compatible. Hacer el move antes de resolver ese bloqueo produciría deliberadamente un paquete roto.

## 5. Final source layout

No aplicado. Se conserva temporalmente el layout certificado en J mientras se resuelve la decisión de TreeTable; no se creó ningún segundo layout ni copia.

## 6. Public Table entrypoint

Sin cambios. `@neural-ui/core/table` sigue apuntando a Table 1.x en este checkpoint; NeuTable 2 permanece privada en `table/next`.

## 7. TableCore removal

No ejecutada. Eliminar TableCore sin completar la sustitución atómica incumpliría el gate de paquete y no se ha intentado un redirect, alias o barrel vacío.

## 8. Table 1.x removal

No ejecutada. No se conserva una eliminación parcial ni se deja un facade roto.

## 9. next removal

No ejecutada por el mismo bloqueo atómico. No se creó nomenclatura candidata adicional.

## 10. TreeTable decoupling

La inspección reproducible de `projects/ui-core/tree-table/neu-tree-table.component.ts` contra el contrato final de NeuTable 2 demuestra que no es un simple cambio de imports:

- el `<neu-table>` delegado tiene 48 bindings de input; 42 no existen con ese nombre/semántica en los 24 inputs finales;
- tiene 24 bindings de output; 21 no existen en los 14 outputs finales;
- invoca 8 miembros imperativos eliminados (`exactMatch`, `resetVirtualScroll`, `scrollToIndex`, `scrollToOffset`, `resetState`, `startRowEdit`, `saveRowEdit`, `cancelRowEdit`); ninguno pertenece a los cuatro métodos finales;
- consume contratos eliminados como `NeuTableQueryState`, `NeuTableSortState`, `NeuTableLazyRequest`, selección por filas, eventos de edición legacy y `NeuTableUrlStateOptions`;
- proyecta directivas legacy de body/body-section, cell view/editor, expand, header/footer groups, loading body y paginator slots que no tienen equivalencia directa en la superficie final;
- delega context menu y eventos detallados de row/edit que NeuTable 2 consolidó o eliminó.

Desacoplarla conservando comportamiento obliga a rediseñar su query/filter projection, selección, edición, virtual scroll, template projection, context menu, eventos, métodos y tests. Eso es una reescritura funcional profunda de TreeTable y está expresamente fuera de K.

## 11. Internal consumers

TreeTable es el consumidor activo bloqueante. NeuTable 2 no tiene edges a Table 1.x o TableCore, según J. No se encontró una primitive neutral que permita retirar el componente legacy sin reimplementar su comportamiento dentro de TreeTable.

## 12. Showcase minimal migration

No requerida ni iniciada antes del STOP. Los 17 debts históricos de Showcase permanecen intactos.

## 13. URL/storage removal

No ejecutada. La API final mantiene el modelo controlled, pero la eliminación física no puede hacerse parcialmente mientras TreeTable consume `NeuTableUrlStateOptions` y bindings legacy.

## 14. Export legacy removal

No ejecutada. No se duplicaron ni tocaron los serializers privados CSV/JSON/XLSX certificados.

## 15. Filter legacy removal

No ejecutada. TreeTable usa `NeuTableQueryState` y `NeuTableQueryFilterConstraint` en su hierarchy controller; migrarlo al AST final cambia su motor funcional y forma parte del bloqueo.

## 16. Virtual legacy removal

No ejecutada. TreeTable invoca cuatro rutas imperativas legacy de scroll/reset que no tienen sustitución uno-a-uno.

## 17. Remote legacy removal

No ejecutada. TreeTable traduce `lazyRequest` y server/query behavior legacy; cambiarlo al único `dataRequest` exige rediseñar su protocolo público.

## 18. Forms/edit legacy removal

No ejecutada. TreeTable depende de lifecycle outputs e imperative row-edit removidos. No se añadió CVA ni infraestructura Forms alternativa.

## 19. CSS/styles

Sin cambios. No se copiaron estilos legacy ni se hizo rediseño visual.

## 20. Tokens

Sin cambios. No se añadieron aliases de compatibilidad.

## 21. Package exports

Sin cambios por el STOP. El estado objetivo (`table` presente y `table-core` ausente) no se declara falsamente como alcanzado.

## 22. EntryPoints before/after

- Before K: 102 directorios con `ng-package.json`.
- Entrypoints relacionados: `table`, `table-core`, `tree-table`.
- After K: no aplicable; no hubo sustitución física. El delta esperado de `-1` no se materializó.

## 23. Public contracts

No regenerados, porque el package surface no cambió. Regenerarlos ahora solo produciría el mismo contrato de J y no ocultaría el bloqueo.

## 24. Legacy API scan

Resultado: FAIL esperado para K. Siguen existiendo `table/next`, Table 1.x, TableCore y referencias TreeTable a API legacy. No se añadió un gate engañoso sobre un producto todavía no sustituido.

## 25. Final 82-symbol surface

NeuTable 2 mantiene internamente la superficie certificada de 82 símbolos: 66 tipos, 15 directivas y un componente, con 24 inputs, 14 outputs y cuatro métodos. No se promovió al entrypoint final.

## 26. Migration fixtures

No migrados al entrypoint final porque ese entrypoint no se cambió. Las once recetas certificadas en J permanecen intactas.

## 27. TableCore migration fixture

Permanece como receta documental/compile-only; no se creó wrapper, alias o runtime de compatibilidad.

## 28. Candidate tests promoted

No ejecutado. Los 22 files/124 tests certificados continúan en el árbol candidato.

## 29. Legacy tests removed/migrated

Ninguno eliminado ni migrado. La clasificación A/B/C/D no puede consumarse de forma segura antes de resolver TreeTable.

## 30. Test count accounting

- Before K certificado por J: 186 files, 3.078 tests.
- NeuTable 2 dirigida: 22 files, 124 tests.
- Table 1.x/TableCore dirigida: 52 files, 797 tests.
- After K: no aplicable; no se cambió runtime ni tests.

## 31. Final NeuTable tests

No repetidos: el STOP ocurrió durante el análisis previo a runtime. Se conserva la evidencia green de J.

## 32. Full suite

No repetida porque no hubo sustitución física. Última certificación: 186/186 files y 3.078/3.078 tests en J.

## 33. Build

No repetido; no hubo cambios de runtime/package que validar.

## 34. Package verification

No repetida; la eliminación objetivo no fue aplicada.

## 35. Import smoke

No repetido. El smoke final sin `table-core` no puede ejecutarse hasta resolver el bloqueo.

## 36. SSR import smoke

No repetido. Se mantiene el PASS de J para el estado previo.

## 37. Angular 22 consumer

No repetido. No se expuso el entrypoint final nuevo.

## 38. SSR/hydration real

No repetido; paths y barrels permanecen intactos. Último estado certificado en J: PASS.

## 39. Zoneless

Sin cambios. NeuTable 2 continúa certificada con `provideZonelessChangeDetection()` y sin Zone.js.

## 40. Effects audit

Sin cambios: NeuTable 2 conserva los dos effects certificados. No se añadió effect de compatibilidad.

## 41. Dependency graph

El grafo objetivo no se publicó. El grafo candidato sigue sin edges a Table 1.x, TableCore, Router, HTTP, storage, PrimeNG o third-party grids. TreeTable sí conserva el edge bloqueante al entrypoint legacy.

## 42. Bundle BASIC

No recalculado. Baseline J: 174.382 B raw, 34.559 B gzip, 25.541 B Brotli.

## 43. Bundle enterprise

No recalculado. Baseline J initial: 34.559 B gzip.

## 44. Bundle remote

No recalculado. Baseline J initial: 34.559 B gzip.

## 45. Bundle virtual

No recalculado. Baseline J initial: 34.559 B gzip.

## 46. Bundle combined

No recalculado. Baseline J initial: 34.559 B gzip.

## 47. Optional chunks

Sin cambios: advanced filter 1.939 B gzip, Signal Forms editor 1.414 B, CSV 383 B, JSON 469 B y XLSX 1.422 B.

## 48. Root-unused

No recalculado. Baseline J: 0 B raw.

## 49. TableCore absence proof

FAIL esperado: TableCore sigue físicamente presente porque la sustitución atómica fue detenida. No se oculta ni se redirige.

## 50. Old Table absence proof

FAIL esperado: Table 1.x permanece intacta para no romper TreeTable mientras el diseño está bloqueado.

## 51. next absence proof

FAIL esperado: `table/next` permanece intacto y certificado; no se realizó un move parcial.

## 52. rowAction/rowReorder

Sin cambios. Los fixes exactamente-once de J permanecen en el candidato.

## 53. Prime checklist preservation

No re-auditado. F-001…F-070 permanece con el resultado funcional certificado en J.

## 54. Breaking delta

No materializado. El ledger REMOVED/CHANGED/MERGED/RENAMED/INTERNALIZED sigue siendo el plan aprobado, no una afirmación sobre el package actual.

## 55. Documentation changes

Solo se añade este informe de bloqueo. No se alteran documentos históricos ni docs activas para fingir una promoción inexistente.

## 56. Known global debts untouched

No se tocaron los 17 demos Showcase ausentes, warnings NG8102 de Menu, tokens de OrganizationChart, deuda de SVG inline ni otros debts globales.

## 57. Git diff review

El diff de K queda limitado a este informe. No hay promotion, deletions, package changes, TreeTable rewrite ni refactor no relacionado.

## 58. Symlink/file hygiene

0 symlinks versionados al inicio y ninguno añadido. No se crearon carpetas temporales de hydration ni build artifacts versionados.

## 59. Remaining risks

La decisión necesaria excede K: o se autoriza una fase específica de migración/reescritura de TreeTable a los contratos finales, o se retira TreeTable como producto. Las alternativas de conservar un adapter Table1→Table2, esconder Table 1.x dentro de TreeTable, duplicar engines o crear aliases están explícitamente prohibidas y no se implementaron.

## 60. Final recommendation

**TABLE 2 PHYSICAL REPLACEMENT BLOCKED**

Solicitar una resolución de diseño para TreeTable antes de reintentar la sustitución física. No avanzar a otra fase del roadmap.
