# N2-025 — DateInput

**Estado final tras la resolución normativa: READY FOR N2-026.** Los apartados 1–35 siguientes conservan el STOP inicial como historial; la ejecución reanudada y sus resultados definitivos figuran después.

## Historial: STOP inicial antes de la resolución

## 1. Status

**NEEDS ROADMAP DESIGN REVIEW.** N2-025 está identificado, pero el contrato público P2 de período y presentación inline no está congelado. No se modificó el runtime.

## 2. Starting checkpoint

N2-024 se cerró en `d91989682b234e4f4379514c76a6f802f087f55e` (`feat(color-picker): complete Neural 2 ColorPicker`), rama `v2`. El árbol tracked y el staging quedaron limpios; se preservó el untracked ajeno `projects/ui-core/tree-table/public_api 2.ts`.

## 3. Scope resolution

El nombre oficial es **N2-025 — DateInput**, prioridad P2, familia DateInput. El roadmap identifica F-130 (selección de mes/año, presentación inline y semanas), dependiente de N2-006. No autoriza tocar Calendar ni los demás componentes.

## 4. Authoritative sources

- `N2-IMPLEMENTATION-ROADMAP.md`, líneas 432–445: exige contrato civil previo, presentación separada del valor y tests por modo.
- `N2-001-CONTRACTS.md`, línea 314: DateInput period/inline = `NEEDS REVIEW P2`; default: no añadir modos.
- `N2-001-TYPE-CONTRACTS.md`, línea 734: unión `NeuDateMode` P1 sin período hasta N2-025.
- `N2-001-API-LEDGER.md`, línea 68: modos de período tipados = `NEEDS REVIEW`.
- `N2-PRIME22-MATRIX.md`, F-130, y `N2-PRIME-GAPS.md`, F-130: inventario del gap, no contrato de API.
- `N2-006-DATE-FORMS.md`: contrato civil y Signal Forms P1 ya certificado.

El roadmap encarga resolver el gap, mientras los contratos vigentes prohíben añadir modos hasta una revisión. No son objetivos incompatibles: falta la resolución normativa que cambie el estado de `NEEDS REVIEW` a un target ejecutable.

## 5. Previous implementation/baseline

`NeuDateInputControl<V>` expone `value = model<V>()` y `mode = input<NeuDateMode>('date')`. `NeuDateMode` solo admite `date`, `time`, `datetime`, `multiple`, `range`; `NeuDateValueMap` y `NeuDateBoundary` corresponden a esos cinco modos. La navegación de mes/año existente no representa selección de período. N2-006 registró 99.844 B raw y 13.794 B gzip como referencia histórica, no como medición comparable actual.

## 6. Migrate/refactor/rewrite decision

**No decidida.** Elegir arquitectura de runtime antes de conocer el valor público de mes/año y la separación exacta entre modo de valor y presentación inline sería especulativo.

## 7. Architecture

Conservar N2-006 hasta la revisión: valor civil, FormValueControl oficial, presentación y navegación separadas del valor. No se ha autorizado una segunda representación del dato.

## 8. Ownership

El valor existente sigue siendo `MODEL`; vista, foco y overlay siguen siendo efímeros. Falta congelar si inline es un input de presentación, su nombre/default y la semántica de cambio de presentación sin cambio de valor.

## 9. Public API

La API P1 permanece intacta. Faltan nombres de modos, tipos de valor civil mensual/anual, constructores/validadores, vacíos, límites por unidad, y cualquier input de presentación/semanas. Añadir cualquiera ahora sería inventar API pública.

## 10. Breaking delta

Ninguno aplicado. No se retiró ni cambió un miembro público.

## 11. Signal graph

Sin cambios. La posible proyección de período/inline queda pendiente del contrato.

## 12. Writable state

Sin cambios; no se añadió mirror ni owner alternativo.

## 13. Effects

Sin cambios; no se añadió `effect()`.

## 14. Implementation

Detenida antes de modificar runtime por contrato P2 no congelado.

## 15. Forms

Se preserva Signal Forms: `model<V>()`, cero CVA. Falta precisar el tipo de `NeuDateValue<M>` para mes/año y reset/clear por cada nuevo modo.

## 16. Interaction

No implementada. Falta fijar selección frente a navegación month/year y comportamiento de inline.

## 17. Keyboard

No alterado. El contrato de teclado para las nuevas unidades no está definido.

## 18. Focus

No alterado. Falta definir foco al cambiar vista/seleccionar unidad en inline y overlay.

## 19. A11y

No alterada. Faltan semántica y nombres ARIA de selector mensual/anual, límites y semanas.

## 20. SSR

No se cambió el SSR existente; no se ejecutó gate N2-025.

## 21. Hydration

No se cambió la hidratación existente; no se ejecutó gate N2-025.

## 22. Zoneless

No se cambió el contrato zoneless existente.

## 23. Lifecycle/resources

No se añadieron listeners, observers, timers ni overlays.

## 24. Performance

No se midió delta porque no hubo implementación. La evaluación de `disabledDays` recurrente exige política previa: no expandir años de fechas por una restricción semanal.

## 25. Bundle

No hay delta N2-025 ni chunks nuevos. La cifra N2-006 es histórica y no sustituye un baseline fresh al reanudar.

## 26. Root-unused

No medido en esta revisión sin cambios de producto.

## 27. Dependency graph

No se añadieron dependencias.

## 28. Directed tests

No proceden tests de modos inexistentes. Tras congelar el contrato se requieren mes/año, min/max por unidad, inline Forms, semanas y touch UI si se incluyen.

## 29. Types/contracts

La unión cerrada vigente excluye períodos. El mínimo a congelar es: (1) discriminantes y valores civiles de mes/año, vacíos y validación; (2) `min`/`max` y disabled por unidad; (3) presentación inline independiente del valor, nombre/default y relación con overlay; (4) alcance de semanas/touch UI. Los type fixtures positivos/negativos deberán seguir esa resolución.

## 30. Build/package

No ejecutados: no se modificó producto ni paquete.

## 31. Regressions

Ninguna introducida en runtime; DateInput, Table, TreeTable y ColorPicker permanecen intactos.

## 32. Excluded debts

No se tocaron Showcase, los 17 demos, Menu NG8102, coverage global, ATTW Node10, `dist` ignorado ni otros componentes P2.

## 33. Risks

Resolver sin contrato podría mezclar navegación de mes/año con valor de período, romper el tipo dependiente de `mode` o introducir una segunda semántica de inline/Forms. Es una decisión pública material, no un detalle local de implementación.

## 34. Git diff/status

N2-024 es el único commit nuevo. Este informe es el único archivo N2-025 nuevo y queda sin commit para revisión. El untracked ajeno de TreeTable permanece fuera del staging. No se hizo push, tag, release ni publish.

## 35. Final recommendation

**NEEDS ROADMAP DESIGN REVIEW.** Congelar explícitamente el contrato público mensual/anual y la presentación inline (incluidos valores, límites y alcance de semanas) antes de reanudar N2-025. No iniciar N2-026.

## Ejecución reanudada tras la resolución normativa

### 1. Final status

**READY FOR N2-026**, sujeto a revisión del working tree. N2-025 se deja sin commit y N2-026 no se ha iniciado.

### 2. Initial design stop

El STOP anterior fue correcto: el contrato P2 de períodos e inline no estaba congelado. Se preserva íntegramente arriba y no se trató como permiso para inventar API.

### 3. Normative resolution

La resolución del usuario congeló `month`, `year`, `CivilMonth`, `CivilYear`, `presentation: 'overlay' | 'inline'`, `showWeekNumbers`, límites por unidad y la política de `disabledDates`. Los tres documentos N2-001 se actualizaron de forma mínima antes del runtime.

### 4. Starting checkpoint

Rama `v2`, HEAD `d91989682b234e4f4379514c76a6f802f087f55e` (N2-024). No se cambió ese commit.

### 5. Scope

F-130: selección simple de mes/año, superficie inline y numeración ISO de semanas. Calendar, otros controles y modos de semana/período compuesto quedan fuera.

### 6. Architecture decision

**FOCUSED EXTENSION** de N2-006: una única fachada, un único picker surface compartido mediante `NgTemplateOutlet`, un único ModelSignal y un motor civil privado para períodos. No hay engine inline paralelo.

### 7. CivilMonth

`{ readonly year: number; readonly month: number }`; mes 1..12 y año 1..9999, sin día sintético. El validador, comparador y desplazamiento civil son privados.

### 8. CivilYear

`{ readonly year: number }`; mismo rango civil 1..9999. No `Date`, UTC ni timezone para seleccionar/navegar años.

### 9. NeuDateMode/value map

La unión cerrada tiene siete modos. `NeuDateValue<'month'> = CivilMonth | null`; `NeuDateValue<'year'> = CivilYear | null`. Los cinco valores N2-006 permanecen intactos; no se añadió alias ni modo `week`.

### 10. Boundaries

`min`/`max` usan `CivilMonth` o `CivilYear` según la especialización. Mes compara año→mes; año compara año. No clamping ni conversión a fecha diaria.

### 11. Disabled-days policy

`disabledDates` sigue siendo exclusivamente diario. Month/year no expanden días, meses ni años; su elegibilidad usa validez civil, límites y estado disabled/readonly del control. Validación custom/async permanece en el Form owner.

### 12. Presentation

`presentation` es input independiente del modo/valor, default `overlay`. Parent write cambia únicamente presentación; no proposal, echo ni segundo owner.

### 13. Inline

El mismo template se monta permanentemente en flujo normal, con `role="group"`, sin trigger de apertura, backdrop, positioning, focus trap ni eventos `opened`/`closed` ficticios.

### 14. Overlay

Se conserva el CDK overlay N2-006. Los eventos `opened`/`closed` siguen asociados al attach/detach real. Cambiar overlay abierto a inline lo desmonta y emite un `closed` real; inline→overlay comienza cerrado.

### 15. Month selection

Grid de 12 meses en cuatro columnas; navegación entre años no cambia el valor. Click/Enter/Space válido propone un único `CivilMonth`; overlay cierra tras selección simple, inline permanece visible.

### 16. Year selection

Grid privada de hasta 12 años por página; navegar páginas no cambia valor. Selección válida propone un único `CivilYear` y usa la misma política de cierre.

### 17. Week numbers

`showWeekNumbers` default false, solo en day-grid (`date`, `datetime`, `multiple`, `range`). ISO-8601 se calcula con matemática civil pura a partir del jueves de cada fila; no altera `firstDayOfWeek`, selección, foco ni Form value. Probadas transiciones 52/53→1 y comienzo de semana domingo.

### 18. TouchUI decision

No se añadió `touchUI`, fullscreen ni tercera presentación; queda fuera de N2-025.

### 19. Ownership

`value` continúa siendo MODEL; modo, presentación, semanas y límites son INPUT. Anchor visible, foco, overlay y draft son efímeros; celdas y semanas son derivados.

### 20. Signals

Inputs → computed de opciones/proyección → template. `linkedSignal` resetea únicamente vista/open efímeros cuando cambian sus fuentes; no sincroniza un estado de dominio espejo.

### 21. Writable state

No se añadió writable owner del valor ni de presentación. `focusedMonth`/`focusedYear` son estado de foco efímero; la vista existente se conserva.

### 22. Effects

**0 effects nuevos** y ningún effect para Forms, loading, vista o presentación.

### 23. Signal Forms

Un único `model<V>()` y `FormValueControl<V>`. Pruebas reales de `[formField]`, `[formControl]`, `formControlName` y `[(ngModel)]` para month/year; sin CVA ni `NG_VALUE_ACCESSOR`. Auditoría global: 24 controles Signal Forms, 0 CVA pendientes.

### 24. Validation

Mes 1..12, año 1..9999, límites tipados; valor aplicado inválido no se autocorrige. Required/custom/async son responsabilidad de Angular Forms. Reset/clear retornan `null` para períodos.

### 25. Keyboard

Month/year: flechas horizontales ±1, verticales ±4, Home/End, PageUp/PageDown y Enter/Space. Mover foco no selecciona. Celdas fuera de rango conservan navegación con `aria-disabled` y rechazan selección.

### 26. Focus

Foco de celda estable por unidad; overlay restaura foco según N2-006 al cerrar. Inline no busca trigger inexistente. Instancias múltiples mantienen foco/valor aislados.

### 27. A11y

Grid con filas/celdas, nombres de mes completo+año mediante Intl y nombre de año civil; `aria-selected` distingue selección, `aria-disabled` restricciones, y semanas son `aria-hidden`, no enfocables ni seleccionables. Inline usa group; overlay conserva dialog.

### 28. SSR

Fixture Angular 22 renderiza date overlay/inline, month overlay/inline, year overlay/inline y semana visible sin browser globals ni requests. Import smoke SSR: **101/101 entrypoints**.

### 29. Hydration

Chromium real: DOM inline y semana SSR reutilizados, 0 NG050x, 0 ecos iniciales, primer cambio month/year exactamente una vez y lifecycle overlay `opened`/`closed` exactamente una vez.

### 30. Zoneless

Fixture usa `provideZonelessChangeDetection()`; no Zone.js ni detección manual como arquitectura.

### 31. Lifecycle

Sin observers/timers/listeners globales nuevos; CDK overlay existente se destruye. Test de 100 create/destroy inline no registra outputs tardíos. El fixture temporal de hidratación se elimina al finalizar.

### 32. Performance

Microbench Node reproducible sobre la misma implementación de `buildCalendarDays` extraída de HEAD y working tree, 20 warmups, 100 muestras × 10 iteraciones: HEAD p50/p95 **0,0275/0,0434 ms**, final **0,0271/0,0401 ms**. Nuevos: ISO week **0,0001/0,0002 ms**, grid mensual **0,0009/0,0010 ms**, navegación mensual **<0,0001/0,0001 ms**. El test de 100 ciclos inline tardó ~438 ms en su corrida dirigida; no se presenta como benchmark de producto/navegador. No hay expansión diaria para evaluar elegibilidad de períodos.

### 33. Bundle

Baseline comparable desde HEAD y fuente final con esbuild ESM minificado, Angular/RxJS externos, gzip nivel 9 y Brotli calidad 11: **32.364/8.537/7.645 B** raw/gzip/Brotli → **41.597/10.637/9.551 B**. Delta **+9.233/+2.100/+1.906 B**; supera 5 % y se atribuye a template/handlers de una fachada completa (+8.229 B atribuidos al componente) y al engine civil privado (~984 B), no a librería de fecha de terceros. El bundle publicado de un consumer básico, overlay, inline, month/year y combined contiene el mismo DateInput (96.811 B `bytesInOutput` de su FESM); runtime inputs no son compile-time flags. Tamaños completos raw/gzip/Brotli: básico **102.679/16.040/13.898 B**; overlay **102.715/16.056/13.902**; inline **102.714/16.057/13.918**; month/year **102.715/16.063/13.922**; combined **102.781/16.091/13.911**. Incluyen costes comunes del paquete, no equivalen al delta de fuente anterior.

### 34. Root-unused

Consumer que importa solo `provideNeuralUI` desde raíz: contribución de `neural-ui-core-date-input.mjs` en metafile **0 B raw**. El bundle total de ese consumer no es 0 B (2.184 B raw); el objetivo es que DateInput no se retenga si no se usa.

### 35. Dependencies

Sin dependencia de fechas nueva. Angular/CDK/Intl existentes y engine civil privado; ningún segundo Form adapter, wrapper o chunk adicional.

### 36. Types

`test:n2-forms-types` PASS con fixtures positivos y negativos de los siete modos, presentation cerrada y combinaciones inválidas. El rango literal de `month` es una validación runtime porque el contrato público usa `number`, no un tipo numérico enumerado.

### 37. Contracts

`test:n2-date-input-contracts` **3/3 PASS**: siete modos, presentación/semanas, prohibiciones de week/touchUI/CVA/efectos y política civil. `audit:cva` PASS.

### 38. Directed tests

**3 archivos, 51/51 tests PASS**: 44 de componente, 4 Forms matrix, 3 engine civil. Cubren períodos, límites, weeks ISO, presentación, keyboard/focus, readonly/disabled, parent writes, aislamiento e inmutabilidad.

### 39. Existing P1 regression

Los **34/34** tests N2-006 existentes para `date`, `time`, `datetime`, `multiple`, `range` siguen dentro del archivo de componente y pasan. `test:n2-date-timezones` PASS en UTC, Europe/Madrid y America/New_York.

### 40. Build/package

`ng build ui-core --configuration production` PASS; solo warnings Menu NG8102 preexistentes. El `dist` ignorado local contiene directorios ajenos contaminados y no se limpió. Verificación aislada después del build: se copiaron únicamente 341 ficheros regulares de la salida final en un package temporal, **0 exports ausentes**, `npm pack --dry-run --json` PASS (**340 ficheros empaquetados**), incluidos FESM/declarations DateInput y ficheros obligatorios. El temp se eliminó. No se ejecutó el verificador habitual directamente contra el `dist` contaminado. Un intento de recompilar a otro destino aislado falló en tipado preexistente de `internal/neu-hydration-internals.ts`; no se alteró ese runtime ni se presenta el empaquetado aislado como segunda compilación limpia. El build productivo normal y el package aislado de su salida sí pasaron.

### 41. Breaking delta

Extensión aditiva: tres tipos públicos, dos modos de la unión existente y dos inputs (`presentation`, `showWeekNumbers`). Los cinco modos P1 y sus valores conservan semántica; month/year no mezclan range/multiple.

### 42. Regressions

Ninguna detectada en gates dirigidos, build, SSR/hydration o Forms. La advertencia NG0956 descubierta en grid anual se corrigió con identidad de índice estable y desapareció en la repetición final.

### 43. Excluded debts

Sin Showcase, Calendar, otros controles, cobertura global, deuda Menu NG8102, ATTW Node10 ni limpieza del `dist` ignorado.

### 44. Git diff/status

Solo documentos N2-001, DateInput, fixtures Forms/hydration, gates/scripts y este informe. Rama `v2`, sin commit, push, tag, release ni publish. `git diff --check` PASS. El untracked ajeno `projects/ui-core/tree-table/public_api 2.ts` permanece intacto y fuera de staging; no se añadieron symlinks.

### 45. Risks

La única fachada comparte inevitablemente el coste del template de modos nuevos incluso en consumers de DateInput básico; no se introduce split complejo por ~2,1 KB gzip. `dist` local contaminado impide tomar un audit recursivo ingenuo como evidencia de paquete limpio, por eso se aisló la verificación. Los microbench de Node no predicen frame time.

### 46. Final recommendation

**READY FOR N2-026.** N2-025 está preparado para revisión sin commit; N2-026 no se inicia aquí.
