# N2 — Fase 1: Angular 22 only

Fecha de cierre: 12 de septiembre de 2026.

## 1. Estado final

**PASS WITH RECORDED RISKS**

La librería, sus 105 entrypoints, los tests, los contratos, el paquete publicado de
prueba, el consumer Angular 22, SSR, hidratación real en navegador y el modo zoneless
han quedado validados con Angular 22. Los riesgos registrados no son regresiones de la
librería ni obligan a adelantar Fase 2 o Fase 3.

## 2. Rama y commit base

- Rama: `v2`.
- Base contractual: tag `v1.15.0`, commit
  `a6a9606613fba61e7c337c3f57d1aecbb11702e8`.
- El tag anotado se resolvió y se comprobó contra ese commit antes de modificar el
  repositorio.
- El working tree inicial estaba limpio salvo `docs/N2_ARCH.md`, archivo no versionado
  preexistente que se conservó sin modificar.

## 3. Angular antes/después

- Antes: framework Angular `21.2.19`.
- Después: `@angular/common`, `compiler`, `core`, `forms`, `platform-browser` y
  `router` en `22.1.6`.
- No se añadió `@angular/animations`, porque el workspace no lo utiliza.

## 4. Angular CDK antes/después

- Antes: `@angular/cdk` `21.2.14`.
- Después: `@angular/cdk` `22.1.6`.

## 5. Angular tooling antes/después

- `@angular/build`: `21.2.19` → `22.1.8`.
- `@angular/cli`: `21.2.19` → `22.1.8`.
- `@angular/compiler-cli`: `21.2.19` → `22.1.6`.
- `@angular-devkit/schematics`: `21.2.19` → `22.1.8`.
- `@schematics/angular`: `21.2.19` → `22.1.8`.
- `ng-packagr`: `21.2.7` → `22.1.1`.
- Solo se usaron releases estables, sin prereleases.

## 6. TypeScript antes/después

- Antes: `~5.9.3`.
- Después: `~6.0.3`; versión instalada `6.0.3`.
- No se silenció TypeScript ni se introdujeron escapes con `any` en código fuente.

## 7. RxJS antes/después

- Declaración conservada: `~7.8.0`.
- Versión resuelta: `7.8.2`.
- No se encontró ninguna incompatibilidad que justificase cambiar de línea.

## 8. Node requirement final

El workspace y el paquete publicable expresan:

```text
^22.22.3 || ^24.15.0 || >=26.0.0
```

La validación se ejecutó con Node `22.22.3`. `ng version` informó npm `10.9.7`.

## 9. peerDependencies antes/después

Los peers Angular/CDK/Schematics pasan de `>=19.0.0 <23.0.0` a
`>=22.0.0 <23.0.0`. No se ha preparado soporte para Angular 23.

Los peers de Icons, ApexCharts y ng-apexcharts se conservan deliberadamente para no
adelantar Fase 2.

## 10. Archivos principales modificados

- Manifests y lockfile: `package.json`, `package-lock.json` y
  `projects/ui-core/package.json`.
- Tooling: consumer Angular 22, guard de compatibilidad, preparación del consumer H9,
  verificación de release y eliminación del runner de matriz multi-major.
- Fixtures: providers zoneless estables en los smokes SSR.
- TypeScript: paths explícitamente relativos tras retirar `baseUrl`, obsoleto en
  TypeScript 6.
- Evidencia: README raíz, README del paquete, guía de compatibilidad, handoff H9,
  plantilla de incidencias y este informe.
- Tests/contratos: fixture host de drag/drop adaptada al default OnPush de Angular 22 y
  snapshot público regenerado mediante el generador oficial del repositorio.

## 11. Infraestructura Angular 19 eliminada

- Se eliminaron los branches y reescrituras del provider zoneless para Angular 19.
- Se retiró el fallback a `provideExperimentalZonelessChangeDetection`.
- Se eliminaron las versiones Angular 19 del mapa y de la matriz de consumers.
- Se sustituyeron los tests sintácticos específicos de Angular 19 por invariantes
  actuales de Angular 22.

## 12. Infraestructura Angular 20 eliminada

- Se eliminó Angular 20 del mapa de versiones y de la matriz de consumers.
- Se retiró su documentación como target activo de Neural UI 2.x.
- No queda un branch ejecutable dedicado a Angular 20.

## 13. Infraestructura Angular 21 eliminada

- Se eliminó Angular 21 del mapa de versiones y de la matriz de consumers.
- Se borró `scripts/test-ui-core-compatibility-matrix.mjs`.
- El gate de compatibilidad quedó convertido en un consumer Angular 22 único.
- Se actualizaron manifests, lockfile, documentación activa y plantilla de incidencias.

## 14. Infraestructura conservada y motivo

- Charts, ApexCharts, ng-apexcharts y el entrypoint chart: pertenecen a Fase 2.
- Los 24 CVA y sus contratos: Signal Forms pertenece a Fase 3B.
- `ChangeDetectionStrategy.OnPush`: su retirada pertenece a Fase 3A.
- `DOCUMENT` desde el entrypoint público de `@angular/common`: sigue siendo la API
  correcta en Angular 22; se cambió el test para validar el comportamiento real.
- Evidencia histórica de Angular 19–21 y baselines históricos de bundle: se conserva
  porque no es infraestructura activa.
- Se registró para Fase 7 la corrección documental: Neural UI 1.x es compatible con
  Angular 19–22; Neural UI 2.x es Angular 22-only.

## 15. Resultado clean install

**PASS.** `npm ci --no-audit --no-fund` instaló 524 paquetes sin `--force` ni
`--legacy-peer-deps`.

## 16. Dependency graph final

**PASS.** Un único grafo Angular deduplicado:

- framework/CDK `22.1.6`;
- build/CLI/schematics `22.1.8`;
- ng-packagr `22.1.1`;
- TypeScript de compilación `6.0.3`;
- RxJS `7.8.2`;
- ningún Angular 19, 20 o 21 instalado;
- ningún `zone.js` instalado.

Existe un TypeScript `5.6.1-rc` encapsulado bajo `@arethetypeswrong/core`; es una
dependencia interna de una herramienta de auditoría de tipos y no participa en el
compilador, el paquete ni el runtime de Neural UI.

## 17. Resultado build

**PASS.** Build de producción y empaquetado correctos para los 105 entrypoints,
incluido Charts. La compilación `tsc -b` también pasó.

TypeScript 6 convirtió el antiguo `baseUrl` en error. Se eliminó esa opción y se
hicieron explícitamente relativas las rutas de `paths`, sin silenciar el compilador.

## 18. Resultado unit tests

**PASS:** 3425 total, 3425 pass, 0 fail, en 152 archivos.

Cobertura final:

- statements: 98.13% (25,805/26,296);
- branches: 95.96% (15,193/15,831);
- functions: 98.61% (5,407/5,483);
- lines: 98.90% (20,523/20,751).

Angular 22 emite dos avisos no bloqueantes `NG8102` en las defensas
`item.children ?? []` del menú. Las defensas se conservaron porque eliminarlas podría
cambiar robustez y comportamiento fuera del alcance de Fase 1.

## 19. Resultado contracts

**PASS.** 105 entrypoints, 847 declaraciones exportadas, 1,506 bindings y 5,818
símbolos. Los cinco tests del contrato pasan.

El snapshot fue regenerado con `npm run snapshot:contracts`, nunca editado a mano. El
único delta son 11 firmas internas `ɵprov` que el compilador Angular 22 emite con
metadatos genéricos distintos; no hay altas, bajas ni cambios de API pública.

## 20. Resultado audit CVA actual

**PASS.** Los 24 CVA y sus contratos permanecen intactos. No se adelantó Signal Forms.

## 21. Resultado Angular 22 consumer

**PASS.** Consumer limpio con Angular `22.1.6`, instalado desde el tarball real sin
forzar peers. Pasaron `ng add`, los schematics de theme/layout/dashboard/CRUD, el build
de producción y los smokes de importación. Charts sigue incluido.

## 22. Resultado SSR

**PASS.** Smoke SSR para los 105 entrypoints, tree-table y eventos H9 con el provider
zoneless estable.

## 23. Resultado hydration

**PASS WITH RECORDED HARNESS RISK.** Se verificó en Chromium una hidratación Angular
22.1.6 zoneless sobre HTML SSR con anotaciones `ngh`, reutilización del DOM y cero
errores de consola/página.

El antiguo recorrido del harness H9 basado en el application builder sufrió un crash
nativo reproducible de memoria en macOS. La evidencia final se obtuvo en un consumer
temporal con instalación física desde tarball y compilación Angular/esbuild. No se usó
ningún symlink. El preparador H9 del repositorio ahora copia dependencias físicas y
desreferenciadas.

## 24. Resultado zoneless

**PASS.** Solo se usa `provideZonelessChangeDetection`, la API estable de Angular 22.
No existen dependencias de `zone.js`, providers de Zone, providers experimentales ni
branches por versión.

## 25. Referencias activas inesperadas a Angular menor que 22

**Ninguna.** Las únicas menciones restantes están en documentación histórica,
changelog, la especificación N2, baselines congelados o en la indicación intencional de
que aplicaciones Angular 19–22 que aún no migren a Neural UI 2 deben permanecer en la
línea 1.x. Ninguna controla código, manifests, instalación o gates activos.

## 26. Regresiones encontradas

Angular 22 hace default OnPush a los componentes de los hosts de prueba. Se detectaron
cuatro fallos en el spec de drag/drop porque el host mutaba campos planos y esperaba
que un segundo `detectChanges` los propagase como antes. El producto y la directiva no
habían perdido comportamiento.

También se detectó la incompatibilidad de configuración `baseUrl` con TypeScript 6,
descrita en el apartado de build.

## 27. Correcciones realizadas

- El estado mutable del host de prueba drag/drop se convirtió a signals y los tests
  usan `.set()`. Es una corrección mínima de la fixture; no modifica el componente,
  UX, API ni estrategia de detección del producto.
- Se retiró `baseUrl` y se normalizaron los aliases de `paths` como rutas relativas.
- Se regeneró el contrato con el comando oficial tras el cambio de metadatos del
  compilador.
- Se reemplazaron providers experimentales y branches multi-major por la API estable
  Angular 22.
- Se reemplazó la preparación con symlinks del fixture H9 por copias físicas.

## 28. Riesgos pendientes

- El gate agregado `verify:release` alcanza `audit:entrypoints` y se detiene por 17
  demos ausentes del showcase externo. Es el desajuste baseline ya documentado en
  N2-ARCH/1 y el showcase pertenece a Fase 8; no es una regresión Angular 22. Todos los
  gates de librería posteriores se ejecutaron por separado y pasaron.
- Bundle main: gzip y brotli pasan; el raw agregado queda en warning. El paquete
  comprimido pasa y el tamaño desempaquetado queda solo 243 bytes por encima del
  umbral de warning, muy por debajo del umbral de fallo.
- El crash nativo del recorrido application-builder del harness de hidratación en
  macOS debe aislarse en una fase de tooling futura; el comportamiento de hidratación
  real sí quedó validado.
- Los dos avisos `NG8102` del menú se registran sin retirar defensas de runtime.

## 29. Git diff summary

Antes de añadir este informe: 18 archivos versionados afectados, con 2,151 inserciones
y 2,453 eliminaciones. La mayor parte del delta corresponde a la regeneración del
lockfile. Hay una eliminación intencional: el runner de matriz multi-major.

No se hicieron commits locales, push, tag, release ni publicación npm.

## 30. Git status

El working tree queda deliberadamente con los cambios de Fase 1 sin ocultar. Además de
los archivos modificados/eliminados y este informe nuevo, continúa presente
`docs/N2_ARCH.md` como archivo no versionado preexistente, preservado sin cambios.

No hay symlinks en el repositorio fuera de dependencias instaladas, y la solución no
crea symlinks para sus consumers.

## 31. Recomendación

**READY FOR PHASE 2**

No se ha iniciado ni implementado ningún trabajo de Fase 2.
