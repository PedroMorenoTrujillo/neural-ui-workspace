# N2 — Fase 2: retirada completa de Charts

Fecha de cierre: 12 de septiembre de 2026.

## 1. Estado

**PASS WITH RECORDED RISKS**

Neural UI 2 ya no contiene el producto Chart, su entrypoint ni sus dependencias. Los
riesgos registrados son fallos baseline o del harness local que no proceden de esta
retirada y no requieren adelantar otras fases.

## 2. Base de Fase 2

- Rama: `v2`.
- `HEAD`: `a6a9606613fba61e7c337c3f57d1aecbb11702e8`, base contractual `v1.15.0`.
- Punto de partida lógico: working tree de Fase 1 aprobado como
  `PASS WITH RECORDED RISKS` y `READY FOR PHASE 2`.
- Todos los cambios no confirmados de Fase 1 se conservaron.
- `docs/N2_ARCH.md` seguía siendo un archivo no versionado preexistente y no se
  modificó.

## 3. Inventario Chart encontrado

| Clase | Superficie encontrada |
| --- | --- |
| Source productivo | `NeuChartComponent`, tipos y estilos en `projects/ui-core/chart/` |
| Entrypoint | `public_api.ts`, `ng-package.json`, export `./chart` |
| Manifests/peers/lockfile | Dependencias raíz, peers publicables y dos paquetes del lockfile |
| Tests | Spec exclusivo con 53 tests y un caso Chart dentro del contrato H9 compartido |
| Fixtures/consumers | App de compatibilidad y consumer H9 compartido |
| SSR/hydration | El consumer H9 compartía la superficie Chart; los gates restantes no dependen de ella |
| Contracts/manifests generados | Contrato v2, reconciliación histórica, snapshot legacy y token manifest |
| Bundle/tooling | Smoke de compatibilidad, escenario browser H9 y descubrimiento automático del entrypoint |
| Documentación activa | Instalación, catálogo y tabla de peers de ambos README |
| Documentación histórica | Changelog, handoff H9, evidencia H9, N2-ARCH y N2-PHASE-1 |

No se encontró Chart.js. Las apariciones de `organization-chart` corresponden a otro
componente y se conservaron.

## 4. Archivos de producto eliminados

- `projects/ui-core/chart/neu-chart.component.ts`
- `projects/ui-core/chart/neu-chart.component.scss`
- `projects/ui-core/chart/public_api.ts`
- `projects/ui-core/chart/ng-package.json`

También se eliminó el spec exclusivo indicado en el apartado siguiente. La carpeta
`projects/ui-core/chart/` dejó de existir.

## 5. Tests exclusivos eliminados

- `projects/ui-core/chart/neu-chart.component.spec.ts`: 53 tests exclusivos.
- Un caso exclusivo de selección Chart dentro de
  `projects/ui-core/h9-event-contract.spec.ts`.
- Un escenario Chart dentro del runner browser H9.

Los consumers y contratos H9 compartidos se conservaron; solo se retiraron sus
secciones Chart.

## 6. Entrypoint eliminado

`@neural-ui/core/chart` fue eliminado por completo. No existe en source, build, mapa de
exports, tarball ni smokes.

## 7. Exports eliminados

- `NeuChartComponent`
- `NeuChartDataSelectEvent`
- `NeuChartSeries`
- `NeuChartType`

La comparación entre el tarball conservado de Fase 1 y el paquete final arroja
exactamente un subpath eliminado (`./chart`) y cero subpaths añadidos.

## 8. Dependencias eliminadas

- `apexcharts`
- `ng-apexcharts`

Se retiraron del manifest raíz, peers publicables, lockfile y consumer Angular 22. No
se añadió una librería sustituta.

## 9. Dependency graph final

**PASS.** `npm ci` instala 522 paquetes, frente a 524 al cerrar Fase 1. El grafo
Angular 22 permanece deduplicado y no contiene librerías de gráficas. No se usó
`--force` ni `--legacy-peer-deps`.

## 10. Confirmación ApexCharts = 0

**0 paquetes, 0 imports y 0 referencias ejecutables.** La copia instalada de Fase 1
ocupaba 11.680 KiB en el entorno medido.

## 11. Confirmación ng-apexcharts = 0

**0 paquetes, 0 imports y 0 referencias ejecutables.** La copia instalada de Fase 1
ocupaba 208 KiB.

## 12. Confirmación Chart.js = 0

**0 paquetes y 0 imports.** También se comprobó que no se añadieron Highcharts, D3,
ECharts, Vega ni Recharts.

## 13. EntryPoints antes/después

- Secondary entrypoints: 104 → 103.
- EntryPoints totales del contrato: 105 → 104.
- Imports SSR y ESM finales: 104/104.

La expectativa de N2-ARCH/1 se cumple exactamente.

## 14. Componentes producto antes/después

98 → **97 archivos canónicos de componentes de producto**. Solo desaparece el archivo
de producto de Chart.

## 15. Component declarations antes/después

102 → **101 declaraciones públicas de tipo component**, obtenido del contrato
regenerado.

Las declaraciones productivas explícitas de OnPush pasan de 112 a 111 porque la
declaración eliminada pertenecía al propio `NeuChartComponent`; las 111 ajenas a Chart
permanecen intactas.

## 16. Public API delta

- EntryPoints: -1.
- Declaraciones exportadas: 847 → 843 (-4, todas de Chart).
- Bindings: 1.506 → 1.496 (-10: nueve inputs y un output de Chart).
- Símbolos clasificados: 5.818 → 5.794 (-24, todos bajo `./chart`).
- Exports de paquete: solo `./chart` eliminado; ninguno añadido.

No desaparece ninguna API pública ajena a Chart.

## 17. Tarball antes/después/delta/%

Contra el baseline contractual N2-ARCH/1:

- 741.374 → **737.227 bytes**.
- Delta: **-4.147 bytes (-0,559%)**.

Para aislar la retirada respecto al cierre real de Fase 1:

- 743.384 → **737.227 bytes**.
- Delta de Fase 2: **-6.157 bytes (-0,828%)**.

## 18. Unpacked antes/después/delta/%

Contra N2-ARCH/1:

- 4.749.112 → **4.768.329 bytes**.
- Delta: **+19.217 bytes (+0,405%)**.

Ese total mezcla el crecimiento previo del output Angular 22 con la retirada de
Chart. El delta aislado desde Fase 1 sí baja:

- 4.796.847 → **4.768.329 bytes**.
- Delta de Fase 2: **-28.518 bytes (-0,595%)**.

## 19. Packed files antes/después

336 → **333 archivos** (-3). Hay 106 mapas de depuración separados y cero referencias
rotas.

## 20. Bundle raw antes/después

- Contra N2-ARCH/1: 3.672.316 → **3.699.304 bytes**, +26.988 (+0,735%).
- Aislando Fase 2: 3.720.169 → **3.699.304 bytes**, -20.865 (-0,561%).

El aumento respecto al baseline 1.15 pertenece al cambio de toolchain Angular 22 de
Fase 1; el bundle raw sí disminuye al retirar Chart.

## 21. Bundle gzip antes/después

- Contra N2-ARCH/1: 634.881 → **632.106 bytes**, -2.775 (-0,437%).
- Aislando Fase 2: 636.814 → **632.106 bytes**, -4.708 (-0,739%).

## 22. Bundle brotli antes/después

- Contra N2-ARCH/1: 514.169 → **511.750 bytes**, -2.419 (-0,470%).
- Aislando Fase 2: 515.815 → **511.750 bytes**, -4.065 (-0,788%).

## 23. Root unused import

**0 bytes raw**, sin cambio. El escenario informa 20 bytes gzip y 1 byte brotli por
el contenedor vacío; el raw autoritativo permanece en cero.

## 24. Tests total/pass/fail

**3.371 total, 3.371 pass, 0 fail**, en 151 archivos.

La reducción exacta de 54 tests respecto a Fase 1 corresponde a los 53 tests del spec
Chart y al caso Chart del contrato H9 compartido.

## 25. Coverage antes/después

| Métrica | Fase 1 | Fase 2 |
| --- | ---: | ---: |
| Statements | 98,13% | 98,12% (25.693/26.185) |
| Branches | 95,96% | 95,96% (15.113/15.749) |
| Functions | 98,61% | 98,60% (5.381/5.457) |
| Lines | 98,90% | 98,88% (20.428/20.658) |

La diferencia aritmética procede de retirar el componente Chart, que estaba muy
cubierto, junto con sus tests y denominadores. No se redujo cobertura mediante skips,
exclusiones o desactivación de tests.

El gate histórico de mínimo 95% por cada archivo continúa señalando 18 componentes
ajenos a Chart entre 93,75% y 94,96% de branches. No se modificaron para evitar ampliar
esta fase.

## 26. Contracts

**PASS.** El generador oficial produjo 104 entrypoints, 843 declaraciones, 1.496
bindings y 5.794 símbolos. La auditoría posterior y sus cinco tests pasan.

`public-contract.snapshot.json` sigue siendo el snapshot legacy histórico usado por el
propio generador. La reconciliación histórica se regeneró oficialmente; no se editó
ningún contrato a mano.

## 27. CVA audit

**PASS: 24 CVA.** No se inició Signal Forms ni se modificó ningún contrato de control.

## 28. Angular 22 consumer

**PASS.** Consumer limpio Angular `22.1.6`, 316 paquetes, instalación desde tarball,
build de producción, `ng add`, theme, layout, dashboard, CRUD y smoke de imports. Ya no
instala ni importa Chart.

## 29. SSR

**PASS.** Smoke de los 104 entrypoints, tree-table y consumer H9 compartido. El H9
conserva overlays, selección y virtualización, produce anotaciones de hidratación y
cero outputs durante SSR.

## 30. Hydration

**PASS WITH RECORDED HARNESS RISK.** Chromium hidrató HTML generado por Angular 22 con
anotaciones `ngh`; el input SSR conservó identidad de nodo y no hubo errores de página
ni consola.

Se usó un consumer temporal con dependencias copiadas físicamente, sin symlinks. El
application builder reproduce el crash nativo macOS ya registrado en Fase 1, por lo
que se utilizó el mismo recorrido alternativo Angular compiler + esbuild aceptado en
esa fase.

## 31. Zoneless

**PASS.** Solo se usa `provideZonelessChangeDetection`. El grafo final no contiene
`zone.js`, providers experimentales ni providers Zone.

## 32. Schematics/package gates

- Schematics e idempotencia: PASS.
- Package verification: PASS, 333 archivos.
- Publint y Are The Types Wrong: PASS.
- Release artifacts: PASS, cero referencias rotas.
- Bundle policy: PASS, 24 consumers, 106 chunks y cero fallos arquitectónicos.
- Strict template consumers, table architecture, límites internos y logical CSS:
  PASS.
- Documentation metrics: PASS.

El token manifest se regeneró oficialmente y ya no contiene rutas Chart. Su auditoría
descubrió dos tokens preexistentes de `organization-chart` sin default global; se
registra como riesgo y no se modifica una API ajena a esta fase.

## 33. Referencias activas residuales

**0 referencias ejecutables** a `@neural-ui/core/chart`, `NeuChartComponent`,
`ng-apexcharts` o `apexcharts` en source, fixtures, scripts, manifests, lockfile,
contrato actual o paquete construido.

Los dos README contienen deliberadamente la línea de breaking change
`@neural-ui/core/chart` → **removed in Neural UI 2.0**; es registro de migración, no una
API activa.

## 34. Referencias históricas conservadas

- `CHANGELOG.md`.
- `docs/N2_ARCH.md`.
- `N2-PHASE-1.md`.
- `docs/H9A2_EVENT_API_HANDOFF.md`, marcado explícitamente como handoff histórico 1.x.
- `docs/h9-a2-evidence/`.
- `public-contract.snapshot.json` y `public-contract.reconciliation.json`, que el
  generador define como snapshot y reconciliación legacy.

## 35. Showcase work pendiente para Fase 8

En un checkout limpio y separado se deberán retirar posteriormente:

- demo y ruta Chart;
- navegación y sandbox;
- dependencias;
- documentación e i18n;
- snapshots, tests y verificadores.

No se inspeccionó destructivamente ni se modificó ningún checkout del showcase.

## 36. Regresiones encontradas

No se encontró ninguna regresión funcional ajena a Chart. Los 54 tests retirados, el
entrypoint, el componente público, sus bindings y el cambio de OnPush corresponden
exactamente a la superficie eliminada.

El primer bundle manual de hidratación necesitó importar explícitamente
`@angular/compiler` para enlazar dependencias parcialmente compiladas; el ajuste se
hizo solo en el fixture temporal y la prueba final pasó.

## 37. Correcciones realizadas

- Eliminación quirúrgica de producto, entrypoint, spec y dependencias Chart.
- Limpieza de las secciones Chart dentro de fixtures y tests compartidos, preservando
  toda su cobertura restante.
- Retirada del escenario browser Chart y del import SSR del consumer.
- Regeneración oficial de lockfile, contrato, reconciliación, token manifest, tipo de
  tokens, READMEs y artefactos publicables.
- Documentación explícita del breaking change y del futuro producto independiente
  Neural Charts, sin inventar paquete ni fecha.

## 38. Riesgos

- `audit:entrypoints` valida correctamente la librería pero termina en las mismas 17
  demos ausentes del showcase externo ya aceptadas como baseline. Fase 8 resolverá el
  checkout de integración.
- El application builder del harness H9 sufre un crash nativo macOS; la hidratación
  real pasa con el recorrido alternativo.
- El gate por archivo reporta 18 porcentajes de branches preexistentes menores al 95%;
  la suite global pasa y ninguno de esos componentes fue modificado.
- La auditoría de tokens señala dos defaults preexistentes de `organization-chart`
  descubiertos al regenerar el manifest. Resolverlos aquí alteraría una API ajena a
  Chart.
- Persisten los dos warnings Angular `NG8102` del menú registrados en Fase 1.
- El unpacked y raw totales siguen por encima del baseline Angular 21 debido a Fase 1,
  aunque ambos bajan al medir exclusivamente la retirada de Chart.

## 39. Git diff summary

Antes de añadir este informe, el diff acumulado de Fases 1 y 2 contiene 30 archivos
versionados afectados, 2.256 inserciones y 3.836 eliminaciones. Incluye cinco archivos
Chart eliminados y el runner multi-major eliminado en Fase 1. La mayor parte del delta
restante es lockfile y contratos/manifests regenerados.

No se hicieron commits, push, tags, releases ni publicaciones npm.

## 40. Git status

El working tree permanece visible con todos los cambios aprobados de Fase 1 y Fase 2.
`N2-PHASE-1.md` y este informe son nuevos. `docs/N2_ARCH.md` continúa como archivo no
versionado preexistente y preservado.

No hay symlinks de proyecto; los consumers y la hidratación usan tarballs o copias
físicas.

## 41. Recomendación

**READY FOR PHASE 3A**

No se ha iniciado ni implementado ningún trabajo de Fase 3A.
