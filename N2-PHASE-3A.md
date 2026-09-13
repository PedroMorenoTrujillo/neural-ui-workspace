# N2 — Fase 3A: Angular 22 default OnPush

Fecha de cierre: 2026-09-12
Rama: `v2`
Base conservada: `a6a9606613fba61e7c337c3f57d1aecbb11702e8`

## 1. Estado

**PASS WITH RECORDED RISKS**

La retirada es semánticamente neutra y queda aislada a la metadata redundante de
change detection y sus imports. Todos los gates de producto pasan. Se conservan los
riesgos de baseline ya aceptados y se documenta una adaptación exclusivamente
temporal del runner de navegador.

## 2. Base de fase

- Working tree acumulado de Fases 1 y 2, sin revertir ni ocultar ningún cambio.
- Rama `v2`; `HEAD` continúa exactamente en
  `a6a9606613fba61e7c337c3f57d1aecbb11702e8`.
- Angular productivo instalado: `@angular/core` y `@angular/compiler` **22.1.6**;
  tooling: `@angular/cli` y `@angular/build` **22.1.8**.
- El test de compatibilidad confirma que workspace y paquete publicado tienen Angular
  22 como único target activo.
- No se hizo commit, push, tag, release ni publicación.
- No se crearon symlinks. Los consumers usaron tarballs o copias físicas.

## 3. Declaraciones OnPush antes/después

| Inventario productivo | Antes | Después |
| --- | ---: | ---: |
| `changeDetection: ChangeDetectionStrategy.OnPush` | 111 | **0** |
| Archivos que las contenían | 97 | **0** |

Las 111 apariciones reales coincidieron con la expectativa de fase. Se eliminaron
exactamente esas 111 entradas y ninguna otra metadata.

## 4. Imports ChangeDetectionStrategy antes/después

| Inventario productivo | Antes | Después |
| --- | ---: | ---: |
| Imports/usos de `ChangeDetectionStrategy` | 97 | **0** |

Cada uno de los 97 archivos afectados tenía un único import asociado. Todos quedaron
sin uso tras retirar la metadata y fueron eliminados.

## 5. Default encontrados antes/después

`ChangeDetectionStrategy.Default`: **0 antes / 0 después** en producto.

Las únicas menciones textuales fuera de código ejecutable son documentación histórica
o de calidad; no existen declaraciones `Default` activas.

## 6. Eager encontrados antes/después

`ChangeDetectionStrategy.Eager`: **0 antes / 0 después** en producto.

No existe ninguna excepción que conservar o justificar y no se introdujo `Eager` para
resolver tests.

## 7. ChangeDetectorRef/markForCheck relevantes

- `ChangeDetectorRef`: 0 usos productivos.
- `.markForCheck()`: 0 usos productivos.
- `.detectChanges()`: una llamada en
  `projects/ui-core/testing/cva-contract.ts`, sobre un `ComponentFixture` del harness
  CVA. No es `ChangeDetectorRef`, no es lógica de producto y se conserva intacta.

## 8. Archivos productivos modificados

**97 archivos**, todos bajo `projects/ui-core`, y todos verificados contra `HEAD` como
la transformación mecánica exacta de retirar solo la metadata y el import autorizados:

`accordion/neu-accordion.component.ts`, `alert/neu-alert.component.ts`,
`autocomplete/neu-autocomplete.component.ts`,
`avatar-group/neu-avatar-group.component.ts`, `avatar/neu-avatar.component.ts`,
`badge/neu-badge.component.ts`, `block-ui/neu-block-ui.component.ts`,
`bottom-sheet/neu-bottom-sheet.component.ts`,
`breadcrumb/neu-breadcrumb.component.ts`,
`button-group/neu-button-group.component.ts`, `button/neu-button.component.ts`,
`calendar/neu-calendar.component.ts`, `card/neu-card.component.ts`,
`carousel/neu-carousel.component.ts`,
`cascade-select/neu-cascade-select.component.ts`,
`checkbox/neu-checkbox.component.ts`, `chip/neu-chip.component.ts`,
`code-block/neu-code-block.component.ts`,
`color-picker/neu-color-picker.component.ts`,
`command-palette/neu-command-palette.component.ts`,
`compare/neu-compare.component.ts`,
`confirm-dialog/neu-confirm-dialog.component.ts`,
`confirm-popup/neu-confirm-popup.component.ts`,
`context-menu/neu-context-menu.component.ts`,
`dashboard-grid/neu-dashboard-grid.component.ts`,
`data-view/neu-data-view.component.ts`, `date-input/neu-date-input.component.ts`,
`divider/neu-divider.component.ts`, `dock/neu-dock.component.ts`,
`empty-state/neu-empty-state.component.ts`,
`filter-bar/neu-filter-bar.component.ts`,
`form-field/neu-form-field.component.ts`, `gallery/neu-gallery.component.ts`,
`icon/neu-icon.component.ts`, `image-gallery/neu-image-gallery.component.ts`,
`image-viewer/neu-image-viewer.component.ts`,
`inline-editor/neu-inline-editor.component.ts`,
`input-mask/neu-input-mask.component.ts`, `input-otp/neu-input-otp.component.ts`,
`input-tags/neu-input-tags.component.ts`, `input/neu-input.component.ts`,
`kanban/neu-kanban.component.ts`, `knob/neu-knob.component.ts`,
`listbox/neu-listbox.component.ts`, `mega-menu/neu-mega-menu.component.ts`,
`menu/neu-menu.component.ts`, `meter-group/neu-meter-group.component.ts`,
`modal/neu-modal.component.ts`, `multiselect/neu-multiselect.component.ts`,
`nav/neu-nav.component.ts`,
`notification-center/neu-notification-center.component.ts`,
`number-input/neu-number-input.component.ts`,
`organization-chart/neu-organization-chart.component.ts`,
`pagination/neu-pagination.component.ts`, `panel/neu-panel.component.ts`,
`password/neu-password.component.ts`, `pick-list/neu-pick-list.component.ts`,
`popover/neu-popover.component.ts`,
`progress-bar/neu-progress-bar.component.ts`,
`radio/neu-radio-group.component.ts`, `radio/neu-radio.component.ts`,
`rating/neu-rating.component.ts`,
`rich-text-editor/neu-rich-text-editor.component.ts`,
`scheduler-gantt/neu-scheduler-gantt.component.ts`,
`scroll-top/neu-scroll-top.component.ts`, `select/neu-select.component.ts`,
`sidebar/neu-sidebar.component.ts`, `skeleton/neu-skeleton.component.ts`,
`slider/neu-slider.component.ts`, `speed-dial/neu-speed-dial.component.ts`,
`spinner/neu-spinner.component.ts`,
`split-button/neu-split-button.component.ts`,
`splitter/neu-splitter.component.ts`, `stats-card/neu-stats-card.component.ts`,
`stepper/neu-stepper.component.ts`, `switch/neu-switch.component.ts`,
`table-core/neu-table-core.component.ts`,
`table/neu-table-checkbox.component.ts`,
`table/neu-table-optional-feature-error.component.ts`,
`table/neu-table-optional-features.component.ts`,
`table/neu-table.component.ts`, `tabs/neu-tabs.component.ts`,
`tag/neu-tag.component.ts`, `tags/neu-tags.component.ts`,
`terminal/neu-terminal.component.ts`, `textarea/neu-textarea.component.ts`,
`timeline-grid/neu-timeline-grid.component.ts`,
`timeline/neu-timeline.component.ts`, `toast/neu-toast.component.ts`,
`toggle-button-group/neu-toggle-button-group.component.ts`,
`toolbar/neu-toolbar.component.ts`, `tooltip/neu-tooltip.component.ts`,
`tree-select/neu-tree-select.component.ts`,
`tree-table/neu-tree-table.component.ts`, `tree/neu-tree.component.ts`,
`uploader/neu-uploader.component.ts` y
`virtual-list/neu-virtual-list.component.ts`.

No se modificaron estado, signals, computed, effects, templates, inputs, outputs,
models, lifecycle, forms, listeners, observers, timers, overlays, estilos ni APIs.

## 9. Fixtures modificadas y motivo

**0 fixtures versionadas modificadas.** La suite completa no necesitó adaptación de
hosts ni conversión a signals.

El runner H9 de navegador se copió temporalmente fuera del repositorio para sustituir
un clic físico sobre `Next month` por `HTMLElement.click()`. Playwright encontraba el
botón, pero un selector de año superpuesto interceptaba el hit-testing. El cambio
temporal activó la misma acción DOM y permitió validar el comportamiento real sin
tocar producto ni el fixture versionado. También se limitó ese runner temporal a
Chromium porque Firefox y WebKit no están instalados en el host.

## 10. Confirmación del default Angular 22

Confirmación realizada **antes** del cambio masivo:

- La API de `@angular/core` 22.1.6 instalada documenta que OnPush está habilitado por
  defecto para componentes.
- La API de `@angular/compiler` 22.1.6 indica que la estrategia por defecto de la
  metadata es `ChangeDetectionStrategy.OnPush`.
- El compilador instalado resuelve metadata ausente con
  `decl.changeDetection ?? ChangeDetectionStrategy.OnPush`.
- Se compiló con AOT un componente con OnPush explícito y otro sin metadata. Ambos
  produjeron definiciones equivalentes y, en ejecución, ambos informaron
  `ɵcmp.onPush === true`.
- Los archivos temporales de esta comprobación fueron eliminados después de obtener
  la evidencia.

No se encontró ninguna excepción técnica aplicable a los componentes Neural UI.

## 11. Build

**PASS.** `npm run build` compiló correctamente los 104 entrypoints con Angular partial
compilation y generó FESM/DTS y assets publicables.

## 12. TypeScript

**PASS.** `tsc --noEmit` sobre `projects/ui-core/tsconfig.lib.json` terminó con 0
errores y sin escapes `any`, silencios o relajación de configuración.

## 13. Tests total/pass/fail

**3.371 total / 3.371 pass / 0 fail**, en **151 archivos**.

No se omitió, desactivó ni reescribió ningún test productivo.

## 14. Coverage

| Métrica | Resultado | Cubierto/total |
| --- | ---: | ---: |
| Statements | 98,12% | 25.693/26.185 |
| Branches | 95,96% | 15.113/15.749 |
| Functions | 98,60% | 5.381/5.457 |
| Lines | 98,88% | 20.428/20.658 |

Los valores son idénticos a Fase 2. El gate histórico de 95% por cada archivo sigue
marcando los mismos 18 componentes, todos entre 93,75% y 94,96% de branches. No se
alteró producto ni cobertura para maquillar ese riesgo de baseline.

## 15. Render/overlay/async gates

**PASS.** La suite completa ejecutó los tests de render, proyección, templates
dinámicos, CDK, observers y efectos. El inventario dirigido incluye 36 specs con
escenarios de overlay, 23 specs con timers/asincronía y 122 specs con render/eventos.

El consumer real en Chromium pasó **8/8** historias H9:

1. selección de texto nativa/programática sin eventos de dominio espurios;
2. selección mouse/teclado exactamente una vez;
3. TreeSelect y DateInput overlay/navegación/CVA;
4. VirtualList y rangos sin duplicados;
5. Dialog y BottomSheet request/hidden;
6. ColorPicker teclado/puntero;
7. NumberInput native edit/ARIA;
8. destrucción con trabajo pendiente sin callbacks tardíos.

La adaptación temporal del clic DateInput está descrita en el apartado 9.

## 16. Contracts

**PASS.** Auditoría pública: 104 entrypoints, 843 declaraciones exportadas, 1.496
bindings y 5.794 símbolos clasificados. Los cinco tests de contrato pasan.

La retirada de metadata privada de compilación no modifica ninguna API pública.

## 17. Angular 22 consumer

**PASS.** Consumer limpio con Angular **22.1.6**, 316 paquetes y librería instalada
desde tarball físico. Pasaron:

- instalación y build de producción;
- `ng add`;
- schematics theme, layout, dashboard y CRUD;
- SSR TreeTable y H9;
- imports SSR de entrypoints seleccionados.

## 18. SSR

**PASS.** El smoke importó 104/104 entrypoints en entorno Node. El consumer real pasó
TreeTable y H9 de overlays/selección/virtualización con anotaciones de hidratación y
cero outputs de servidor.

## 19. Hydration

**PASS.** El builder Angular 22 completó esta vez la ruta browser + server nativa; el
servidor produjo HTML con `ngh` y Chromium hidrató con Angular 22.1.6.

Se verificaron reutilización de nodos SSR, Input/IME, Textarea, Tree, Kanban,
Autocomplete, ColorPicker, overlays, lifecycle y eventos. Resultado: cero errores de
página/consola, cero requests fallidas y cero recursos HTTP erróneos.

## 20. Zoneless

**PASS.** El test de compatibilidad confirma `provideZonelessChangeDetection` estable
en todos los consumers activos. No se añadió Zone.js ni providers experimentales.

## 21. Package verification

**PASS.** Tras el flujo oficial de preparación:

- 333 archivos npm;
- 106 mapas de debug separados;
- 0 referencias rotas;
- publint: PASS;
- Are The Types Wrong: PASS;
- release artifact tests: 2/2 PASS;
- bundle policy: 24/24 consumers, 106 chunks, 0 fallos arquitectónicos.

Métricas finales del paquete: 735.897 bytes packed y 4.754.628 bytes unpacked. El
bundle agregado queda en 3.691.384 raw, 632.449 gzip y 512.250 brotli; todos los
presupuestos pasan.

Frente al cierre de Fase 2, packed baja 1.330 bytes, unpacked baja 13.701 y raw baja
7.920. Gzip sube 343 bytes y brotli 500 por recomposición/compresión de chunks, dentro
de presupuesto y sin incremento de código fuente o dependencias.

La primera verificación directa sobre el `dist` crudo detectó correctamente los mapas;
después de ejecutar `prepare:release-artifacts`, la verificación oficial pasó
con 333 archivos y cero referencias rotas.

## 22. Regresiones encontradas

**Ninguna regresión de producto.** No apareció diferencia de comportamiento entre
OnPush explícito y el default Angular 22.

El único incidente nuevo fue el hit-testing del botón DateInput en el runner browser,
clasificado como fixture/harness porque el elemento existía y otro control superpuesto
interceptaba el puntero. La activación DOM temporal permitió validar la acción y sus
eventos sin cambiar el componente.

## 23. Correcciones realizadas

- Eliminadas 111 declaraciones redundantes de OnPush.
- Eliminados 97 imports asociados de `ChangeDetectionStrategy`.
- Corregido únicamente un espacio final producido por la retirada inline en Carousel.
- Adaptación temporal, no versionada, del clic del runner de navegador.

No se hizo ninguna corrección funcional ni refactor.

## 24. Excepciones conservadas

- No existen declaraciones `Eager`.
- No existen declaraciones `Default`.
- Se conserva `fixture.detectChanges()` en el harness CVA; no es una excepción de
  estrategia de producto.
- Las **24 CVA** permanecen intactas y su auditoría pasa.

## 25. Riesgos

- El gate histórico por archivo conserva 18 componentes por debajo del 95% de
  branches; la suite global supera el umbral y no hubo degradación respecto a Fase 2.
- El runner browser versionado tiene una fragilidad de hit-testing en DateInput. La
  evidencia funcional Chromium es verde con una activación DOM temporal equivalente.
- Firefox y WebKit no están instalados; los gates browser de esta fase se cerraron en
  Chromium.
- Persisten los dos warnings `NG8102` del menú ya registrados en Fase 1.
- Persisten los riesgos ya aceptados de Fase 2: 17 demos externas ausentes para
  `audit:entrypoints` y dos defaults globales de tokens `organization-chart`. No se
  reabrieron por quedar fuera de esta fase.

## 26. Git diff summary

Diff aislado de Fase 3A, antes de añadir este informe:

- **97 archivos productivos**;
- 18 inserciones y 208 eliminaciones en representación Git;
- las 18 inserciones son líneas reescritas al retirar un símbolo de imports/metadata
  inline;
- transformación lógica: **111 metadata + 97 imports eliminados**;
- comprobación automática exacta sobre 97/97 archivos: PASS;
- `git diff --check`: PASS.

Diff versionado acumulado de Fases 1 + 2 + 3A, antes de este informe:

- 127 archivos;
- 2.274 inserciones;
- 4.044 eliminaciones.

## 27. Git status

Antes de añadir este informe, el estado acumulado mostraba:

- 121 archivos modificados;
- 6 archivos eliminados;
- 3 archivos no versionados: `N2-PHASE-1.md`, `N2-PHASE-2.md` y el preexistente
  `docs/N2_ARCH.md`.

Este informe añade `N2-PHASE-3A.md` como cuarto archivo no versionado. Todo el diff
permanece visible; no hay cambios staged, commits nuevos, push, tags ni publicación.

La búsqueda final de symlinks fuera de `node_modules` devuelve **0**.

## 28. Recomendación

**READY FOR PHASE 3B**

Fase 3B no se ha iniciado. No se tocaron Signal Forms, CVA, `model()` de Forms,
HostBinding/HostListener, signal queries, MediaQueryList, APIs, PrimeNG, showcase,
Neural Icons, Neural Charts, tokens, estilos ni refactors generales.
